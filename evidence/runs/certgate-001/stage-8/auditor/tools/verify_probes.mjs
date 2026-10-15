// Auditor (T8-21, R8.2a P-01..P-07, R8.2b, Q-07/Q-08/Q-11/Q-15): independent check of the committed probe batch.
// No endpoint call. Replies are re-parsed with the BASELINE build's own parser; request bodies are re-captured with
// the BASELINE build's own LiveReader against a local capture server.
//   node verify_probes.mjs <probe-repo> <baseline-repo-with-dist> <out.json>
import { createServer } from "node:http";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [repo, base, out] = process.argv.slice(2);
const P = path.join(repo, "evidence/runs/certgate-001/stage-8/probes");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const imp = (f) => import(pathToFileURL(path.join(base, "dist/src", f)).href);
const { parseModelOutput } = await imp("model-output.js");
const { LiveReader, promptSha256 } = await imp("web/live-reader.js");

const lower = (s) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());
// L-C1, written independently: equal ignoring ASCII case, or exactly one "<provider>/" prefix on `other`.
const strictSame = (id, other) => {
  const a = lower(id), b = lower(other);
  if (a === b) return true;
  const i = b.indexOf("/");
  return i > 0 && b.indexOf("/", i + 1) < 0 && b.slice(i + 1) === a;
};
const masked = (body) => {
  const b = structuredClone(body);
  for (const p of b.messages[1].content) if (p.type === "image_url") p.image_url = { url: "<page image>" };
  return sha(JSON.stringify(b));
};

const certBytes = readFileSync(path.join(base, "data/cases/cg-016/certificate.pdf"));
const seen = [];
const srv = createServer((q, r) => {
  let b = "";
  q.on("data", (c) => (b += c));
  q.on("end", () => { seen.push(b); r.writeHead(500, { "content-type": "application/json" }); r.end("{}"); });
}).listen(0, "127.0.0.1");
await new Promise((r) => srv.once("listening", r));
const url = `http://127.0.0.1:${srv.address().port}/v1`;
async function capture(m) {
  seen.length = 0;
  await new LiveReader({ baseUrl: url, modelId: m, apiKey: "x", backoffBaseMs: 1, maxAttempts: 1 })
    .read({ case_id: "cg-016", certificate: new Uint8Array(certBytes) }).catch(() => {});
  return seen[0];
}

const NON_PROBE = new Set(["BATCH.json", "models-snapshot.json", "models-sizing.json", "usage-before.json", "usage-after.json"]);
const files = readdirSync(P).filter((f) => f.endsWith(".json") && !NON_PROBE.has(f)).sort();
const findings = [];
const rows = [];
let calls = 0, cost = 0;
const KEY = process.env.MODEL_API_KEY || "";
const BASEURL = (process.env.MODEL_BASE_URL || "").replace(/\/$/, "");
const hostpath = BASEURL.split("://")[1] || "";
const secretPath = hostpath.includes("/") ? hostpath : "";
const baseLR = sha(readFileSync(path.join(base, "dist/src/web/live-reader.js")));
const baseMO = sha(readFileSync(path.join(base, "dist/src/model-output.js")));

for (const f of files) {
  const raw = readFileSync(path.join(P, f), "utf8");
  const j = JSON.parse(raw);
  const id = j.model_requested;
  const r = { file: f, id, recorded_result: j.result, failure_class: j.failure_class };
  if (path.basename(f, ".json") !== id) findings.push(`${f}: file name differs from model_requested`);

  let parsed = null, perr = null;
  if (typeof j.reply_content === "string") {
    try { parseModelOutput(j.reply_content); parsed = true; } catch (e) { parsed = false; perr = String(e.message || e).slice(0, 100); }
  }
  r.reparse = parsed;
  r.reparse_error = perr;
  const last = j.attempts?.[j.attempts.length - 1];
  const http200 = last?.http_status === "200";
  const same = typeof j.model_reported === "string" ? strictSame(id, j.model_reported) : false;
  const el = Number(j.elapsed_ms);
  const span = Date.parse(j.finished_utc) - Date.parse(j.started_utc);
  const within = el <= 210000;
  Object.assign(r, { model_reported: j.model_reported, http200, strict_same: same, elapsed_ms: el, wall_span_ms: span, within });
  const pass = http200 && parsed === true && same && within;
  r.auditor_result = pass ? "passed" : "failed";
  if ((j.result === "passed") !== pass) findings.push(`${id}: recorded ${j.result}, auditor ${r.auditor_result}`);
  const mine = { http_200: http200, schema_parsed: parsed === true, same_model: same, within_reading_budget: within };
  for (const [k, v] of Object.entries(mine)) {
    if (j.checks?.[k] === undefined || j.checks[k] === null) continue;
    if (k === "schema_parsed" && parsed === null) continue;
    if (j.checks[k] !== v) findings.push(`${id}: checks.${k} recorded ${j.checks[k]}, auditor ${v}`);
  }
  if (Math.abs(span - el) > 2000) findings.push(`${id}: elapsed_ms ${el} differs from wall span ${span}`);
  if (Number(j.chat_calls) !== j.attempts.length || j.attempts.length > 3) findings.push(`${id}: chat_calls ${j.chat_calls} vs attempts ${j.attempts.length}`);
  calls += Number(j.chat_calls);
  cost += Number(j.cost_reported || 0);
  if (j.certificate?.sha256 !== sha(certBytes) || j.certificate?.case_id !== "cg-016") findings.push(`${id}: certificate is not cg-016 by SHA-256`);
  if (j.prompt_sha256 !== promptSha256()) findings.push(`${id}: prompt SHA-256 differs`);

  const body = await capture(id);
  r.body_full_match = sha(body) === j.request_body_sha256;
  r.body_masked_match = masked(JSON.parse(body)) === j.request_body_masked_sha256;
  if (!r.body_full_match || !r.body_masked_match) findings.push(`${id}: request body hash mismatch (full ${r.body_full_match}, masked ${r.body_masked_match})`);

  const pv = j.provenance || {};
  r.provenance_commit = pv.commit;
  if (pv.commit !== "303c32bb0a969a4ad4d79157426b6b2ff9fce000" || pv.product_tree_dirty !== false) findings.push(`${id}: provenance commit or dirty flag`);
  if (pv.live_reader_sha256 !== baseLR || pv.model_output_sha256 !== baseMO) findings.push(`${id}: compiled live-reader/model-output differ from the feaadff build`);

  for (const bad of [/authorization/i, /bearer\s+[a-z0-9]/i, /api[_-]?key/i]) if (bad.test(raw)) findings.push(`${id}: pattern ${bad} present`);
  if (KEY && raw.includes(KEY)) findings.push(`${id}: key value present`);
  if (secretPath && raw.includes(secretPath)) findings.push(`${id}: base-URL path present`);
  rows.push(r);
}
srv.closeAllConnections();
srv.close();

const ub = JSON.parse(readFileSync(path.join(P, "usage-before.json"))).body;
const ua = JSON.parse(readFileSync(path.join(P, "usage-after.json"))).body;
const dcost = ua.daily_cost_used_usd - ub.daily_cost_used_usd;
const snap = JSON.parse(readFileSync(path.join(P, "models-snapshot.json"))).body;
const data = snap.data || [];
// Q-07: a reason applies only when its field is PRESENT and lacks the value; an absent field means "probe".
const cls = data.map((m) => {
  const o = m.output, im = m.architecture?.input_modalities;
  const measured = ["qwen3.8-27b", "gemma-4-31b-it"].includes(lower(m.id));
  return { id: m.id, cls: measured ? "measured" : Array.isArray(o) && !o.includes("text") ? "not_chat" : Array.isArray(im) && !im.includes("image") ? "no_image" : "probe" };
});
const probed = new Set(rows.map((r) => r.id));
for (const c of cls) {
  if (c.cls === "probe" && !probed.has(c.id)) findings.push(`${c.id}: should have been probed`);
  if (c.cls !== "probe" && probed.has(c.id)) findings.push(`${c.id}: probed but classified ${c.cls}`);
}
for (const id of probed) if (!data.some((m) => m.id === id)) findings.push(`${id}: probed but not in the snapshot`);

const src = readFileSync(path.join(repo, "src/web/models.ts"), "utf8");
const block = (name) => (src.split(`export const ${name}`)[1] || "").split("];")[0];
const codeExp = [...block("EXPERIMENTAL_MODELS").matchAll(/id: "([^"]+)"/g)].map((m) => m[1]).sort();
const passed = rows.filter((r) => r.auditor_result === "passed").map((r) => r.id).sort();
if (JSON.stringify(codeExp) !== JSON.stringify(passed)) findings.push(`EXPERIMENTAL_MODELS [${codeExp}] differs from passed [${passed}]`);
const codeOut = [...block("PROBE_OUTCOMES").matchAll(/id: "([^"]+)", outcome: "([^"]+)"/g)].map((m) => `${m[1]}:${m[2]}`).sort();
const wantOut = [
  ...rows.filter((r) => r.auditor_result === "failed").map((r) => `${r.id}:probe_failed`),
  ...cls.filter((c) => c.cls === "not_chat").map((c) => `${c.id}:not_chat`),
].sort();
if (JSON.stringify(codeOut) !== JSON.stringify(wantOut)) findings.push(`PROBE_OUTCOMES [${codeOut}] differs from [${wantOut}]`);
if (calls > 18) findings.push(`chat calls ${calls} exceed the cap 18`);
if (Math.abs(dcost - cost) > 1e-8) findings.push(`/usage cost delta ${dcost} differs from the sum of replies ${cost}`);

const summary = {
  run_utc: new Date().toISOString(), snapshot_ids: data.length, classification: cls, probes: rows,
  chat_calls_total: calls, cap: 18, cost_sum_replies: cost, usage_daily_cost_delta: dcost,
  code_experimental: codeExp, code_outcomes: codeOut,
  secret_scan: { key_available: Boolean(KEY), base_path_checked: Boolean(secretPath) }, findings,
};
writeFileSync(out, JSON.stringify(summary, null, 1));
for (const r of rows) console.log(`${r.id.padEnd(30)} rec=${String(r.recorded_result).padEnd(6)} aud=${r.auditor_result.padEnd(6)} reparse=${r.reparse} 200=${r.http200} same=${r.strict_same} ${r.elapsed_ms}ms body=${r.body_full_match}/${r.body_masked_match}${r.reparse_error ? " err=" + r.reparse_error : ""}`);
console.log(`calls ${calls}/18; cost sum ${cost.toFixed(9)} vs /usage delta ${dcost.toFixed(9)}; snapshot ${data.length} ids`);
console.log(`code experimental [${codeExp}]; outcomes [${codeOut}]`);
console.log(`classification: ${cls.map((c) => c.id + "=" + c.cls).join(", ")}`);
console.log(`secret scan: key_available=${Boolean(KEY)} base_path_checked=${Boolean(secretPath)}`);
console.log(`FINDINGS (${findings.length}):`);
for (const f of findings) console.log(" - " + f);
