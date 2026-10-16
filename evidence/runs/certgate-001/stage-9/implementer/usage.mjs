// Stage 9 implementer evidence (S9-03, V-12): one GET /usage of the endpoint, written as usage-<label>.json next to
// this script. Only the counters needed for the reconciliation are kept; no key, no base-URL path, no header.
//   node evidence/runs/certgate-001/stage-9/implementer/usage.mjs <label>
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const label = process.argv[2];
if (!/^[a-z0-9-]+$/.test(label ?? "")) { console.error("usage: usage.mjs <label>"); process.exit(2); }
const base = (process.env.MODEL_BASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.MODEL_API_KEY ?? "";
if (!base || !key) { console.error("MODEL_BASE_URL and MODEL_API_KEY must be set"); process.exit(2); }
const r = await fetch(`${base}/usage`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(60_000) });
const j = await r.json();
const out = {
  read_utc: new Date().toISOString(), host: new URL(base).host, status: r.status,
  daily_cost_used_usd: j.daily_cost_used_usd ?? null, all_time_requests: j.all_time?.requests ?? null, all_time_errors: j.all_time?.errors ?? null,
  all_time_total_tokens: j.all_time?.total_tokens ?? null, by_model: (j.by_model ?? []).map((m) => ({ model: m.model, requests: m.requests, errors: m.errors, cost: m.cost })),
};
const text = JSON.stringify(out, null, 2) + "\n";
if (text.includes(key)) { console.error("refusing to write: secret"); process.exit(3); }
writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), `usage-${label}.json`), text);
console.log(`usage ${label}: status ${r.status} at ${out.read_utc}, requests ${out.all_time_requests}, daily cost ${out.daily_cost_used_usd}`);
