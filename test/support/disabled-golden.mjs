// J-08 / T6-03 golden: the answers of every existing route on the deployed site (VERCEL=1) while live reading is
// disabled. `record(createApp)` serves each configuration below with a handler, sends the same requests and returns
// status, the relevant headers and the body, with times and run ids normalised. The committed golden
// (test/fixtures/stage6-disabled-golden.json) was recorded with this file from a build of 409fb69a; the test
// replays it against the current build. Offline: no endpoint variables are set in any configuration.
export const CONFIGS = {
  vercel_only: { VERCEL: "1" },
  vercel_store_and_limit_no_code: { VERCEL: "1", LIVE_READS_PER_HOUR: "5", UPSTASH_REDIS_REST_URL: "http://127.0.0.1:9", UPSTASH_REDIS_REST_TOKEN: "golden-store-token" },
  vercel_code_and_limit_no_store: { VERCEL: "1", LIVE_READS_PER_HOUR: "5", LIVE_ACCESS_CODE: "golden-code-value" },
};
const PDF = "JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PD4+CmVuZG9iagp0cmFpbGVyCjw8Pj4KJSVFT0YK";
export const REQUESTS = [
  ["GET", "/health"],
  ["GET", "/api/health"],
  ["GET", "/api/f1"],
  ["GET", "/api/live/status"],
  ["POST", "/api/live/read", { certificate_base64: PDF, synthetic_confirmed: true }],
  ["POST", "/api/live/read", { certificate_base64: PDF, synthetic_confirmed: true, access_code: "wrong" }],
  ["POST", "/api/stories/cg-003/evaluate", {}],
  ["GET", "/figures.json"],
  ["GET", "/stories/index.json"],
  ["GET", "/index.html"],
  ["GET", "/api/cases"],
];
const HEADERS = ["content-type", "cache-control", "content-security-policy", "x-content-type-options", "referrer-policy"];

export function normalise(text) {
  return text
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g, "<time>")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "<uuid>")
    .replace(/"timings_ms": \{[^}]*\}/g, '"timings_ms": "<timings>"')
    .replace(/"([a-z_]+_ms)": "?\d+(\.\d+)?"?/g, '"$1": "<ms>"');
}

export async function record(createApp) {
  const out = {};
  for (const [name, env] of Object.entries(CONFIGS)) {
    const server = createApp({ env, clock: () => new Date("2026-10-14T13:00:00.000Z") }).listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    out[name] = [];
    for (const [method, p, body] of REQUESTS) {
      const res = await fetch(base + p, { method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
      const text = await res.text();
      out[name].push({ method, path: p, status: res.status, headers: Object.fromEntries(HEADERS.map((h) => [h, res.headers.get(h)])), body: normalise(text) });
    }
    server.closeAllConnections();
    await new Promise((r) => server.close(() => r()));
  }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("disabled-golden.mjs")) {
  const [, , appModule, outFile] = process.argv;
  const { createApp } = await import(appModule);
  const { writeFileSync } = await import("node:fs");
  writeFileSync(outFile, JSON.stringify(await record(createApp), null, 1) + "\n");
  console.log("recorded", outFile);
}
