// Auditor (T8-02): the exact POST /chat/completions body produced through the JOB PATH of a built tree.
// A local capture endpoint lists the models given and records every chat body (answering 500, so no reading
// completes). The tree's own createApp serves in container mode (in-process store, no access code); jobs are
// started for a dataset certificate.
//   candidate: node jobpath_bodies.mjs <tree> candidate <out.json> <model[,model…]> <case[,case…]>
//              (MODEL_ID=Qwen3.8-27B, LIVE_MODELS = the models; the model is chosen in the POST body,
//               with not_evaluated_acknowledged: true, which the server ignores for a measured model)
//   baseline:  node jobpath_bodies.mjs <tree> baseline <out.json> <model[,model…]> <case[,case…]>
//              (one server per model with MODEL_ID = that model; no model in the POST body, as at feaadff)
import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [tree, mode, out, modelsArg, casesArg] = process.argv.slice(2);
const models = modelsArg.split(","), cases = casesArg.split(",");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const masked = (body) => { const b = structuredClone(body); for (const p of b.messages[1].content) if (p.type === "image_url") p.image_url = { url: "<page image>" }; return sha(JSON.stringify(b)); };
const { createApp } = await import(pathToFileURL(path.join(tree, "dist/src/server.js")).href);

const bodies = [];
const ep = createServer((q, r) => {
  let b = ""; q.on("data", (c) => (b += c)); q.on("end", () => {
    const u = new URL(q.url, "http://x");
    if (u.pathname.endsWith("/models")) { r.writeHead(200, { "content-type": "application/json" }); return r.end(JSON.stringify({ object: "list", data: models.map((id) => ({ id: `self-dploy/${id}`, object: "model" })) })); }
    if (u.pathname.endsWith("/chat/completions")) bodies.push(b);
    r.writeHead(500, { "content-type": "application/json" }); r.end("{}");
  });
}).listen(0, "127.0.0.1");
await new Promise((r) => ep.once("listening", r));
const epUrl = `http://127.0.0.1:${ep.address().port}/v1`;

async function serve(env) {
  const s = createApp({ env, backoffBaseMs: 1 }).listen(0, "127.0.0.1");
  await new Promise((r) => s.once("listening", r));
  return { base: `http://127.0.0.1:${s.address().port}`, close: () => new Promise((r) => { s.closeAllConnections(); s.close(() => r()); }) };
}
async function oneBody(base, caseId, model) {
  const before = bodies.length;
  const cert = readFileSync(path.join(tree, "data", "cases", caseId, "certificate.pdf")).toString("base64");
  const post = { certificate_base64: cert, synthetic_confirmed: true };
  if (model !== null) { post.model = model; post.not_evaluated_acknowledged = true; }
  const res = await fetch(`${base}/api/live/jobs`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(post) });
  const j = await res.json().catch(() => null);
  if (res.status !== 202) return { status: res.status, error: j };
  const t0 = Date.now();
  while (bodies.length === before && Date.now() - t0 < 30_000) await new Promise((r) => setTimeout(r, 50));
  // let the job fail and release its slot before the next one
  for (let i = 0; i < 100; i++) { const p = await (await fetch(`${base}/api/live/jobs/${j.job_id}`)).json(); if (p.state === "failed" || p.state === "done") break; await new Promise((r) => setTimeout(r, 100)); }
  return { status: res.status, raw: bodies[before] };
}
const rows = [];
const baseEnv = { MODEL_BASE_URL: epUrl, MODEL_API_KEY: "test-key-not-real", LIVE_READS_PER_HOUR: "50" };
if (mode === "candidate") {
  const s = await serve({ ...baseEnv, MODEL_ID: "Qwen3.8-27B", LIVE_MODELS: models.join(",") });
  for (const m of models) for (const c of cases) { const r = await oneBody(s.base, c, m); rows.push({ model: m, case_id: c, ...summ(r) }); }
  await s.close();
} else {
  for (const m of models) { const s = await serve({ ...baseEnv, MODEL_ID: m }); for (const c of cases) { const r = await oneBody(s.base, c, null); rows.push({ model: m, case_id: c, ...summ(r) }); } await s.close(); }
}
function summ(r) {
  if (!r.raw) return { status: r.status, error: r.error ?? "no body captured" };
  const b = JSON.parse(r.raw);
  return { status: r.status, body_model: b.model, body_sha256: sha(r.raw), body_masked_sha256: masked(b) };
}
ep.closeAllConnections(); ep.close();
writeFileSync(out, JSON.stringify({ tree, mode, rows }, null, 1));
for (const r of rows) console.log(`${mode}\t${r.model}\t${r.case_id}\t${r.status}\t${r.body_model ?? "-"}\tfull=${(r.body_sha256 ?? "").slice(0, 16)}\tmasked=${(r.body_masked_sha256 ?? "").slice(0, 16)}${r.error ? "\t" + JSON.stringify(r.error).slice(0, 120) : ""}`);
process.exit(0);
