// Stage 8 implementer container smoke (P-06, D8-02-bis; evidence, not product code). Against a running container of
// the candidate on http://127.0.0.1:<port>, with the real endpoint: GET /usage, the live status and its model groups,
// one live reading with each model named on the command line (dataset sample cg-004, no access code in the
// container), GET /usage again. Writes container-smoke.json next to this script. No key, no base-URL path, no header
// is written; the reply's content is not kept (the receipt summary is).
//   node container-smoke.mjs <port> <model>[,<model>...]
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..", "..");
const [port, list] = process.argv.slice(2);
const site = `http://127.0.0.1:${port}`;
const base = (process.env.MODEL_BASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.MODEL_API_KEY ?? "";
if (!base || !key) { console.error("MODEL_BASE_URL and MODEL_API_KEY must be set"); process.exit(2); }
const usage = async () => {
  const r = await fetch(`${base}/usage`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(60_000) });
  const j = await r.json();
  return { read_utc: new Date().toISOString(), status: r.status, daily_cost_used_usd: j.daily_cost_used_usd, all_time_requests: j.all_time?.requests, all_time_errors: j.all_time?.errors };
};
const get = async (p) => (await fetch(`${site}${p}`)).json();
const out = { schema: "certgate.stage8-container-smoke/1", site: "container (docker run, network on)", endpoint_host: new URL(base).host, usage_before: await usage() };
const st = await get("/api/live/status");
out.status = { enabled: st.enabled, reason: st.reason, models: st.models };
out.readings = [];
const cert = readFileSync(path.join(ROOT, "data", "cases", "cg-004", "certificate.pdf")).toString("base64");
const csv = readFileSync(path.join(ROOT, "data", "delivery", "ALB-2026-0917.csv"), "utf8");
for (const model of list.split(",")) {
  const exp = st.models.experimental.some((x) => x.id === model);
  const body = { certificate_base64: cert, delivery_csv: csv, delivery_line: "1", synthetic_confirmed: true, model, ...(exp ? { not_evaluated_acknowledged: true } : {}) };
  const t0 = Date.now();
  const r = await fetch(`${site}/api/live/jobs`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  let v = j;
  if (r.status === 202) {
    for (;;) {
      v = await get(`/api/live/jobs/${j.job_id}`);
      if (v.state === "done" || v.state === "failed") break;
      if (Date.now() - t0 > 600_000) break;
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  const rc = v.result?.view?.receipt;
  out.readings.push({
    model, post_status: String(r.status), job_id: j.job_id ?? null, state: v.state ?? null, reason_class: v.reason_class ?? j.reason_class ?? null,
    wall_ms: String(Date.now() - t0), model_group: v.model_group ?? null, evaluated: v.evaluated ?? null, listing_checked_at: v.listing_checked_at ?? null,
    receipt: rc ? { reading_source: rc.reading_source, proposal: rc.proposal, reader: rc.reader, model_choice: rc.model_choice, f1: { state: rc.f1.state, model_requested: rc.f1.model_requested, model_reported: rc.f1.model_reported, model_evaluated: rc.f1.model_evaluated, model_probe_evidence: rc.f1.model_probe_evidence, cost_reported: rc.f1.cost_reported, last_reading_ms: rc.f1.last_reading_ms }, endpoint_response: rc.endpoint_response } : null,
  });
  console.log(`${model}: ${r.status} ${v.state ?? ""} ${v.reason_class ?? ""} ${Date.now() - t0} ms`);
}
out.status_after = { used_this_hour: (await get("/api/live/status")).used_this_hour };
out.usage_after = await usage();
const text = JSON.stringify(out, null, 2) + "\n";
if (text.includes(key) || /authorization|bearer /i.test(text)) { console.error("refusing to write: secret or header"); process.exit(3); }
writeFileSync(path.join(HERE, "container-smoke.json"), text);
