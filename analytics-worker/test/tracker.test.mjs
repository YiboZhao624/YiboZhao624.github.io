import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../../assets/js/visit-tracker.js", import.meta.url), "utf8");

function browser({ hidden = false, endpoint = "https://collector.example/collect", beaconOK = true, failFetch = false } = {}) {
  let now = 0;
  let heartbeat;
  const listeners = {};
  const sent = [];
  const beacons = [];
  const document = {
    currentScript: { getAttribute: () => endpoint },
    visibilityState: hidden ? "hidden" : "visible",
    addEventListener: (name, fn) => { listeners[name] = fn; }
  };
  const window = {
    crypto: { randomUUID: () => "56a49cc2-38a5-4289-bf1c-faf11781a0b8" },
    location: { pathname: "/blog/", search: "?secret=123", hash: "#private" },
    addEventListener: (name, fn) => { listeners[name] = fn; },
    setInterval: fn => { heartbeat = fn; }
  };
  runInNewContext(source, {
    document, window, URL, Blob,
    performance: { now: () => now },
    navigator: { sendBeacon: (url, body) => { if (beaconOK) beacons.push(body); return beaconOK; } },
    fetch: (url, options) => {
      sent.push(JSON.parse(options.body));
      return failFetch ? Promise.reject(new Error("offline")) : Promise.resolve();
    }
  });
  return {
    document, sent, beacons,
    tick(ms) { now += ms; if (heartbeat) heartbeat(); },
    advance(ms) { now += ms; },
    event(name) { listeners[name]?.(); },
    visibility(value) { document.visibilityState = value; listeners.visibilitychange?.(); }
  };
}

test("counts only visible time and flushes the final partial interval", async () => {
  const b = browser();
  assert.equal(b.sent[0].duration_ms, 0);
  assert.equal(b.sent[0].path, "/blog/");
  b.tick(15000);
  assert.equal(b.sent.at(-1).duration_ms, 15000);
  b.advance(2300);
  b.visibility("hidden");
  assert.equal(JSON.parse(await b.beacons.at(-1).text()).duration_ms, 17300);
  b.tick(60000);
  assert.equal(b.sent.length, 2);
  b.visibility("visible");
  b.advance(1200);
  b.event("pagehide");
  assert.equal(JSON.parse(await b.beacons.at(-1).text()).duration_ms, 18500);
});

test("back/forward cache resumes the same visit without counting suspended time", async () => {
  const b = browser();
  b.advance(5000);
  b.event("pagehide");
  b.tick(90000);
  b.event("pageshow");
  b.tick(15000);
  assert.equal(b.sent.at(-1).duration_ms, 20000);
  assert.equal(b.sent[0].visit_id, b.sent.at(-1).visit_id);
});

test("background-loaded pages start only when first shown", () => {
  const b = browser({ hidden: true });
  b.tick(60000);
  assert.equal(b.sent.length, 0);
  b.visibility("visible");
  assert.equal(b.sent[0].duration_ms, 0);
});

test("falls back to fetch when beacon cannot be queued and tolerates network errors", async () => {
  const b = browser({ beaconOK: false, failFetch: true });
  b.advance(4500);
  b.event("pagehide");
  assert.equal(b.sent.at(-1).duration_ms, 4500);
  await new Promise(resolve => setImmediate(resolve));
});

test("empty or insecure endpoints produce no requests", () => {
  for (const endpoint of ["", "http://collector.example/collect", "invalid"]) {
    const b = browser({ endpoint });
    b.tick(15000);
    assert.equal(b.sent.length, 0);
  }
});
