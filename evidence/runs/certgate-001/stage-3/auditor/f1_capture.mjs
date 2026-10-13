// Auditor (stage 3): raw, independent capture of what the endpoint reports, to compare with the product's F1 panel
// and receipts (S3-08..S3-11). One GET /models and one GET /usage per call; run only under the auditor's endpoint
// lease (D3-02). Reads MODEL_BASE_URL / MODEL_API_KEY from the environment; writes the host name only, never the key
// or the base-URL value (both are scrubbed from every stored string).
//
//   node f1_capture.mjs <out.json> <label>
import { writeFileSync } from "node:fs";

const base = process.env.MODEL_BASE_URL, key = process.env.MODEL_API_KEY;
if (!base || !key) { console.error("MODEL_BASE_URL / MODEL_API_KEY missing"); process.exit(2); }
const host = new URL(base).host;
const scrub = (s) => String(s).split(key).join("<MODEL_API_KEY>").split(base.replace(/\/$/, "")).join(`https://${host}/<base-path>`);
const [out, label] = process.argv.slice(2);

async function get(path) {
  const t0 = Date.now();
  const at = new Date().toISOString();
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}${path}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(60_000) });
    const text = await res.text();
    const headers = Object.fromEntries([...res.headers].filter(([k]) => k.startsWith("x-ratelimit") || k === "date" || k === "retry-after"));
    return { path, at, status: res.status, elapsed_ms: Date.now() - t0, headers, raw: scrub(text) };
  } catch (e) {
    return { path, at, status: null, elapsed_ms: Date.now() - t0, error: scrub(e?.name ?? "error") + ": " + scrub(e?.message ?? "") };
  }
}

const models = await get("/models");
const usage = await get("/usage");
let model_ids = null;
try { model_ids = JSON.parse(models.raw).data.map((m) => m.id); } catch { /* left null */ }
const record = { schema: "certgate.auditor-f1-capture/1", label, host, model_ids, models, usage };
writeFileSync(out, JSON.stringify(record, null, 2) + "\n");
console.log(`${label}: /models ${models.status} ${models.elapsed_ms} ms (${model_ids?.length ?? "?"} models), /usage ${usage.status} ${usage.elapsed_ms} ms`);
