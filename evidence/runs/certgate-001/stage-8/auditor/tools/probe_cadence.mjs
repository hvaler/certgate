// Auditor (Q-02, DN8-01): upstream GET /models calls made by N simulated deployed instances that share one store,
// under a fake clock, with every instance calling /api/f1 and /api/live/status once per simulated second for 10
// minutes. Each instance gets its own stub endpoint URL, so it has its own in-process probe cache, as separate
// Vercel instances do. Run against a built tree; compare feaadff with the candidate. No endpoint call.
//   node probe_cadence.mjs <tree> <instances> <stepMs> <minutes>
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [tree, nArg = "3", stepArg = "1000", minArg = "10"] = process.argv.slice(2);
const N = Number(nArg), STEP = Number(stepArg), MIN = Number(minArg);
const imp = (f) => import(pathToFileURL(path.join(tree, "dist/src", f)).href);
const { createApp } = await imp("server.js");
const { MemoryStore } = await imp("web/live-store.js");

let t = Date.parse("2026-10-15T20:00:00.000Z");
const clock = () => new Date(t);
const store = new MemoryStore(() => t);
const counts = [];
async function stub(i) {
  counts[i] = 0;
  const s = createServer((q, r) => {
    const u = new URL(q.url, "http://x");
    if (u.pathname.endsWith("/models")) counts[i]++;
    r.writeHead(200, { "content-type": "application/json" });
    r.end(u.pathname.endsWith("/models") ? JSON.stringify({ object: "list", data: [{ id: "Qwen3.8-27B", object: "model" }] }) : "{}");
  }).listen(0, "127.0.0.1");
  await new Promise((r) => s.once("listening", r));
  return { url: `http://127.0.0.1:${s.address().port}/v1`, close: () => { s.closeAllConnections(); s.close(); } };
}
const stubs = await Promise.all(Array.from({ length: N }, (_, i) => stub(i)));
const apps = [];
for (const s of stubs) {
  const env = { VERCEL: "1", MODEL_BASE_URL: s.url, MODEL_API_KEY: "test-key-not-real", MODEL_ID: "Qwen3.8-27B", LIVE_ACCESS_CODE: "aud-cadence-test-code-not-real", LIVE_READS_PER_HOUR: "20", UPSTASH_REDIS_REST_URL: "http://127.0.0.1:9", UPSTASH_REDIS_REST_TOKEN: "x" };
  const a = createApp({ env, liveStore: store, clock }).listen(0, "127.0.0.1");
  await new Promise((r) => a.once("listening", r));
  apps.push({ base: `http://127.0.0.1:${a.address().port}`, close: () => { a.closeAllConnections(); a.close(); } });
}
const st0 = await (await fetch(`${apps[0].base}/api/live/status`)).json();
const f10 = await (await fetch(`${apps[0].base}/api/f1`)).json();
for (let i = 0; i < N; i++) counts[i] = 0;
const steps = Math.round((MIN * 60_000) / STEP);
for (let k = 0; k <= steps; k++) {
  for (const a of apps) { await fetch(`${a.base}/api/f1`).then((r) => r.text()); await fetch(`${a.base}/api/live/status`).then((r) => r.text()); }
  t += STEP;
}
const total = counts.reduce((x, y) => x + y, 0);
console.log(JSON.stringify({ tree: path.basename(path.dirname(tree)), instances: N, step_ms: STEP, minutes: MIN, status_enabled: st0.enabled, f1_state: f10.state, upstream_models_calls: total, per_instance: counts }));
for (const a of apps) a.close();
for (const s of stubs) s.close();
process.exit(0);
