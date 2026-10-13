// Full evaluation against the REAL endpoint (S3-13..S3-16, R3.1 C-08..C-15). Never uses the mock.
// Run only while holding the room's ENDPOINT LEASE (D3-02):
//
//   npm run build && node tools/evaluate/run-eval.mjs [--out evaluation/runs/<name>] [--cases cg-004,cg-005]
//
// Writes run.json (candidate commit, prompt SHA-256, cases), usage-before.json, usage-after.json, results.json
// (one record per case) and metrics.json (computed by tools/evaluate/metrics.mjs from results.json). No key and
// no base-URL value is written; the host name is. The expectations come from data/expected/<id>.json, overridden
// by evaluation/expectations-real-run.json (D3-04, C-16); they are read here, by the evaluation tool, never by src/.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { computeMetrics } from "./metrics.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dist = (p) => import(pathToFileURL(path.join(ROOT, "dist", "src", p)).href);
const { LiveReader, promptSha256 } = await dist("web/live-reader.js");
const { loadDatasetCase, loadShared } = await dist("cases.js");
const { evaluateCase, readCase } = await dist("pipeline.js");
const { exportReceipt } = await dist("receipt.js");
const { CRITICAL_FIELDS } = await dist("fields.js");
const { decimalTextEqual } = await dist("decimal.js");
const { unitsEquivalent } = await dist("fields.js");

const base = (process.env.MODEL_BASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.MODEL_API_KEY ?? "";
const model = process.env.MODEL_ID ?? "";
if (!base || !key || !model) { console.error("MODEL_BASE_URL, MODEL_API_KEY and MODEL_ID must be set; the evaluation never falls back to the mock"); process.exit(2); }
const host = new URL(base).host;
const arg = (k) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : null);
const stamp = new Date().toISOString().replace(/[:.]/g, "").replace("T", "-").slice(0, 15) + "Z";
const OUT = path.resolve(ROOT, arg("out") ?? path.join("evaluation", "runs", `real-${stamp}`));
mkdirSync(OUT, { recursive: true });

const excluded = new Set(JSON.parse(readFileSync(path.join(ROOT, "evaluation", "tuning-exclusions.json"), "utf8")).excluded);
const realExp = JSON.parse(readFileSync(path.join(ROOT, "evaluation", "expectations-real-run.json"), "utf8").replace(/^﻿/, "")).cases;
const all = readdirSync(path.join(ROOT, "data", "cases")).sort();
const cases = (arg("cases")?.split(",") ?? all).filter((id) => !excluded.has(id));
const scrub = (s) => String(s).split(key).join("<MODEL_API_KEY>").split(base).join(`https://${host}/<base-path>`);
const write = (name, obj) => writeFileSync(path.join(OUT, name), scrub(JSON.stringify(obj, null, 2)) + "\n");

let commit = null, dirty = null;
try {
  commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString().trim();
  dirty = execFileSync("git", ["status", "--porcelain", "--", "src", "data", "config", "package.json", "package-lock.json"], { cwd: ROOT }).toString().trim() !== "";
} catch { /* not a git checkout */ }

async function usage(name) {
  const t0 = Date.now();
  const res = await fetch(`${base}/usage`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(60_000) });
  const text = await res.text();
  let body = text; try { body = JSON.parse(text); } catch { /* raw */ }
  write(name, { read_utc: new Date().toISOString(), host, status: res.status, elapsed_ms: Date.now() - t0, raw: text, body });
  return { status: res.status, raw: text };
}

function expectationFor(id) {
  const e = JSON.parse(readFileSync(path.join(ROOT, "data", "expected", `${id}.json`), "utf8"));
  const r = realExp[id];
  return {
    expected_proposal: r?.expected_proposal ?? e.expected_proposal,
    reasons_must_include: r?.reasons_must_include ?? e.reasons_must_include,
    expectation_source: r ? "evaluation/expectations-real-run.json" : `data/expected/${id}.json`,
    correct_reading: e.correct_reading,
    acceptance_cases: e.acceptance_cases,
  };
}

const NUMERIC = (k) => k.startsWith("chemistry.") || k.startsWith("mechanical.") || k === "cev_printed" || k === "kv_temperature";
function fieldOf(reading, key) {
  const [g, n] = key.split(".");
  return n ? reading?.[g]?.[n] : reading?.[g];
}

/** Model-channel reading vs correct reading, per critical field (D3-05, C-10). */
function compareFields(modelFields, correct) {
  const out = {};
  for (const k of CRITICAL_FIELDS) {
    const c = fieldOf(correct, k);
    const m = modelFields?.get(k) ?? null;
    const mv = m && m.status === "read" ? m.value : null;
    let category;
    if (c.status === "read") {
      if (mv === null) category = "unknown";
      else if (NUMERIC(k) ? decimalTextEqual(mv, c.value) && unitsEquivalent(m.unit, c.unit) : mv.trim() === c.value) category = "correct";
      else category = "wrong";
    } else if (c.status === "unknown") {
      category = mv === null ? "correct_unknown" : "confident_on_illegible";
    } else {
      category = mv === null ? "correct_absent" : "invented";
    }
    out[k] = { category, correct: c.value, correct_status: c.status, model: mv, model_unit: m?.unit ?? null, model_status: m?.status ?? null };
  }
  return out;
}

const results = [];
let lastSuccess = Date.now();
let blocked = null;
async function runCase(id) {
  if (blocked) return;
  const shared = loadShared("real");
  const input = loadDatasetCase(id, shared);
  const reader = new LiveReader({ baseUrl: base, modelId: model, apiKey: key });
  const started = new Date();
  const t0 = Date.now();
  const readings = await readCase({ ...input, reader, mode: "real" });
  const result = evaluateCase(readings);
  const ms = Date.now() - t0;
  const exp = expectationFor(id);
  const errors = result.receipt.errors;
  if (result.readings.case.status === "processed") lastSuccess = Date.now();
  if (errors.some((e) => /daily|cap|limit exceeded|quota/i.test(e.detail))) blocked = { reason: "daily cap reached", case_id: id, at: new Date().toISOString() };
  if (Date.now() - lastSuccess > 60 * 60_000) blocked = { reason: "endpoint failing for 60 minutes", case_id: id, at: new Date().toISOString() };
  const rec = {
    case_id: id,
    certificate_sha256: createHash("sha256").update(input.certificate).digest("hex"),
    acceptance_cases: exp.acceptance_cases,
    started_utc: started.toISOString(),
    case_wall_ms: String(ms),
    status: result.readings.case.status,
    proposal: result.decision.proposal,
    expected_proposal: exp.expected_proposal,
    expectation_source: exp.expectation_source,
    reasons: result.decision.reasons.map((r) => r.code),
    reasons_must_include: exp.reasons_must_include,
    missing_reasons: exp.reasons_must_include.filter((c) => !result.decision.reasons.some((r) => r.code === c)),
    attempts: reader.attempts,
    endpoint_response: result.receipt.endpoint_response,
    fields: compareFields(result.readings.model?.fields ?? null, exp.correct_reading),
    receipt: JSON.parse(exportReceipt(result.receipt)),
  };
  results.push(rec);
  console.log(`${new Date().toISOString()} ${id} ${rec.status} ${rec.proposal} (expected ${rec.expected_proposal}) ${ms} ms attempts=${reader.attempts.length}`);
  write("results.json", results.sort((a, b) => a.case_id.localeCompare(b.case_id)));
}

const runMeta = {
  schema: "certgate.evaluation-run/1", started_utc: new Date().toISOString(), host, model_requested: model,
  candidate_commit: commit, product_tree_dirty: dirty, prompt_sha256: promptSha256(), reader: "LiveReader (real endpoint; never the mock)",
  cases, excluded: [...excluded], concurrency: "2", note: "Run under the room's endpoint lease (D3-02).",
};
write("run.json", runMeta);
const before = await usage("usage-before.json");
const queue = [...cases];
await Promise.all([0, 1].map(async () => { while (queue.length && !blocked) await runCase(queue.shift()); }));
const after = await usage("usage-after.json");
runMeta.finished_utc = new Date().toISOString();
runMeta.completed_cases = String(results.length);
runMeta.blocked = blocked;
write("run.json", runMeta);
const metrics = computeMetrics({ results, usageBefore: before.raw, usageAfter: after.raw, run: runMeta });
write("metrics.json", metrics);
console.log(JSON.stringify(metrics.headline, null, 1));
console.log("artifacts:", path.relative(ROOT, OUT));
if (blocked) { console.error("BLOCKED:", blocked.reason); process.exit(3); }

