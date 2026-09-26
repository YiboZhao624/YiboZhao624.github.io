const MAX_BODY_BYTES = 4096;
const MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function reply(status, origin) {
  const headers = { "Cache-Control": "no-store", "Vary": "Origin" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    // sendBeacon uses credentials mode 'include', even though this service
    // neither sets cookies nor uses credentials. Only allow the exact origin.
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return new Response(null, { status, headers });
}

async function readPayload(request) {
  if (!request.body) throw new Error("Empty body");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("Body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function validPayload(data) {
  return data && typeof data === "object" &&
    typeof data.visit_id === "string" && UUID.test(data.visit_id) &&
    typeof data.path === "string" && data.path.startsWith("/") &&
    data.path.length <= 1024 && !/[?#\u0000-\u001f\u007f]/.test(data.path) &&
    Number.isSafeInteger(data.duration_ms) &&
    data.duration_ms >= 0 && data.duration_ms <= MAX_DURATION_MS;
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== "/collect") return reply(404);
    const origin = request.headers.get("Origin");
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
    if (!origin || !allowed.includes(origin)) return reply(403);
    if (request.method === "OPTIONS") return reply(204, origin);
    if (request.method !== "POST") return reply(405, origin);

    // Cloudflare supplies this header at the edge. Never accept a browser-
    // supplied IP field or X-Forwarded-For as the visitor's address.
    const ip = request.headers.get("CF-Connecting-IP");
    if (!ip || ip.length > 45) return reply(400, origin);
    if (Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES) return reply(413, origin);
    let data;
    try {
      data = await readPayload(request);
    } catch (_) {
      return reply(400, origin);
    }
    if (!validPayload(data)) return reply(400, origin);

    try {
      const now = Date.now();
      await env.DB.prepare(`
        INSERT INTO visits (origin, visit_id, ip, path, first_seen_at, last_seen_at, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(origin, visit_id) DO UPDATE SET
          last_seen_at = MAX(visits.last_seen_at, excluded.last_seen_at),
          duration_ms = MAX(visits.duration_ms, excluded.duration_ms)
      `).bind(origin, data.visit_id, ip, data.path, now, now, data.duration_ms).run();
      return reply(204, origin);
    } catch (_) {
      // Do not expose database errors or visitor details to public clients.
      return reply(503, origin);
    }
  },

  async scheduled(controller, env, ctx) {
    const configured = Number(env.RETENTION_DAYS);
    const days = Number.isInteger(configured) && configured > 0 ? configured : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    ctx.waitUntil(env.DB.prepare("DELETE FROM visits WHERE last_seen_at < ?").bind(cutoff).run());
  }
};
