import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import worker from "../src/index.mjs";

const origin = "https://yibozhao624.github.io";
const id = "56a49cc2-38a5-4289-bf1c-faf11781a0b8";
const payload = { visit_id: id, path: "/blog/", duration_ms: 0 };

function fixture(t) {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
  t.after(() => db.close());
  const env = {
    ALLOWED_ORIGINS: origin,
    RETENTION_DAYS: "90",
    DB: {
      prepare(sql) {
        return { bind: (...values) => ({ run: async () => db.prepare(sql).run(...values) }) };
      }
    }
  };
  const send = (body = payload, headers = {}, method = "POST", path = "/collect") => worker.fetch(
    new Request(`https://collector.example${path}`, {
      method,
      headers: { Origin: origin, "CF-Connecting-IP": "203.0.113.7", ...headers },
      ...(method === "POST" ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {})
    }), env
  );
  return { db, env, send };
}

test("stores edge IP and monotonic duration; retries do not create extra visits", async t => {
  const { db, send } = fixture(t);
  for (const duration_ms of [0, 15000, 32000, 15000, 32000]) {
    const response = await send({ ...payload, duration_ms, ip: "forged" });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  }
  const rows = db.prepare("SELECT * FROM visits").all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].ip, "203.0.113.7");
  assert.equal(rows[0].duration_ms, 32000);
  assert.equal(rows[0].path, "/blog/");
  assert.ok(rows[0].last_seen_at >= rows[0].first_seen_at);
});

test("never exposes logs; rejects foreign origins and spoofed forwarding headers", async t => {
  const { db, send } = fixture(t);
  assert.equal((await send(payload, {}, "GET")).status, 405);
  assert.equal((await send(payload, {}, "GET", "/visits")).status, 404);
  assert.equal((await send(payload, { Origin: "https://unrelated.example" })).status, 403);
  assert.equal((await send(payload, { Origin: "" })).status, 403);
  assert.equal((await send(payload, { "CF-Connecting-IP": "", "X-Forwarded-For": "203.0.113.8" })).status, 400);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM visits").get().n, 0);
  assert.equal((await send(payload, {}, "OPTIONS")).status, 204);
});

test("rejects malformed, oversized and out-of-range input", async t => {
  const { db, send } = fixture(t);
  for (const body of [
    "not json", "null", "x".repeat(5000),
    { ...payload, visit_id: "invalid" },
    { ...payload, duration_ms: -1 },
    { ...payload, duration_ms: 0.5 },
    { ...payload, duration_ms: 604800001 },
    { ...payload, path: "/?private=secret" },
    { ...payload, path: "/#fragment" }
  ]) assert.equal((await send(body)).status, 400);
  assert.equal((await send(payload, { "Content-Length": "5000" })).status, 413);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM visits").get().n, 0);
});

test("SQL treats page paths as data and errors do not disclose database details", async t => {
  const { env, db, send } = fixture(t);
  assert.equal((await send({ ...payload, path: "/it's-a-page/" })).status, 204);
  assert.equal(db.prepare("SELECT path FROM visits").get().path, "/it's-a-page/");
  env.DB.prepare = () => { throw new Error("private database detail"); };
  const response = await send();
  assert.equal(response.status, 503);
  assert.equal(await response.text(), "");
});

test("retention job deletes expired rows and preserves recent visits", async t => {
  const { env, db, send } = fixture(t);
  await send();
  await send({ ...payload, visit_id: "16a49cc2-38a5-4289-bf1c-faf11781a0b8" });
  db.prepare("UPDATE visits SET last_seen_at = ? WHERE visit_id = ?").run(Date.now() - 91 * 86400000, id);
  let cleanup;
  await worker.scheduled({}, env, { waitUntil: promise => { cleanup = promise; } });
  await cleanup;
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM visits").get().n, 1);
});
