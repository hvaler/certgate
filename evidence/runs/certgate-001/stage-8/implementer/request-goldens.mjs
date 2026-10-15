// Stage 8 implementer evidence for S8-12 / T8-02 (not product code). Captures the exact POST /chat/completions body
// that the job API sends, through a built tree's own createApp, against the TEST STUB of the candidate (it serves
// /models with chosen ids and answers with a dataset reading; it is not a model). Offline: 127.0.0.1 only.
//
//   node request-goldens.mjs <repo-root> baseline   # a feaadff build: MODEL_ID=<id>, no model field (as at feaadff)
//   node request-goldens.mjs <repo-root> candidate  # the candidate build: the model chosen in the POST
//
// Prints one JSON object: { "<case> <model>": { sha256, masked_sha256 } }.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAND = path.resolve(HERE, "..", "..", "..", "..", "..");
const [root, mode] = process.argv.slice(2);
const { createApp } = await import(pathToFileURL(path.join(root, "dist", "src", "server.js")).href);
const { MemoryStore } = await import(pathToFileURL(path.join(root, "dist", "src", "web", "live-store.js")).href);
const { startStub } = await import(pathToFileURL(path.join(CAND, "test", "support", "stub-endpoint.mjs")).href);
const MODELS = ["Qwen3.8-27B", "Gemma-4-31B-IT", "DeepSeek-V4.1-Flash"];
const CODE = "golden-code-not-real-91c";
const sha = (s) => createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
const masked = (s) => { const b = JSON.parse(s); for (const p of b.messages[1].content) if (p.type === "image_url") p.image_url = { url: "<page image>" }; return sha(JSON.stringify(b)); };
const out = {};
for (const caseId of ["cg-004", "cg-021"]) {
  for (const model of MODELS) {
    const s = await startStub({ caseId: "cg-004", models: MODELS, reportedModel: (m) => `self-dploy/${m}` });
    const env = { VERCEL: "1", MODEL_BASE_URL: s.url, MODEL_API_KEY: "golden-key-not-real", MODEL_ID: mode === "baseline" ? model : "Qwen3.8-27B", LIVE_READS_PER_HOUR: "5", LIVE_ACCESS_CODE: CODE, LIVE_MODELS: MODELS.join(",") };
    const server = createApp({ env, liveStore: new MemoryStore(), liveBudget: { pollMs: 20, queueMaxWaitMs: 20_000, readBudgetMs: 20_000, deadlineMs: 40_000, staleGraceMs: 10_000, leaseTtlMs: 45_000, marginMs: 0 } }).listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const body = { certificate_base64: readFileSync(path.join(CAND, "data", "cases", caseId, "certificate.pdf")).toString("base64"), synthetic_confirmed: true };
    if (mode === "candidate") { body.model = model; if (model === "DeepSeek-V4.1-Flash") body.not_evaluated_acknowledged = true; }
    const r = await (await fetch(`${base}/api/live/jobs`, { method: "POST", headers: { "content-type": "application/json", "x-live-access-code": CODE }, body: JSON.stringify(body) })).json();
    for (let i = 0; i < 500; i++) {
      const v = await (await fetch(`${base}/api/live/jobs/${r.job_id}`)).json();
      if (v.state === "done" || v.state === "failed") break;
      await new Promise((res) => setTimeout(res, 20));
    }
    const sent = s.state.bodies?.[0] ?? null;
    out[`${caseId} ${model}`] = sent ? { model: JSON.parse(sent).model, sha256: sha(sent), masked_sha256: masked(sent) } : null;
    await new Promise((res) => { server.closeAllConnections(); server.close(() => res()); });
    await s.close();
  }
}
console.log(JSON.stringify(out, null, 2));
