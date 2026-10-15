// Stage 8 probe batch (amendment 1 §1b; register S8-22, S8-27, A8-16, L-20…L-22, L-33, L-34, P-01…P-07, Q-07,
// Q-08, Q-11, Q-15). One real probe per listed, non-measured, image-input model on one dataset scan certificate,
// through the product's unchanged reading path: LiveReader (the request builder and the frozen prompt) and the
// pipeline's own retry loop and response schema (readCase). It decides nothing for the product: it writes evidence,
// and the ids that passed are then committed by hand in src/web/models.ts, where a test ties them to these files.
//
// Run only while holding the room's ENDPOINT LEASE, from a clean commit:
//   npm run build && node tools/probe-models.mjs [--out evidence/runs/certgate-001/stage-8/probes]
//
// Pass needs all of: HTTP 200 on the attempt that answered; the reply passes the existing response schema
// (parseModelOutput, through readCase); the reported model names the requested one (sameModel, L-C1); and the whole
// read, from the start of the first attempt to the parsed reply, retries and backoff included, took at most 210 s
// (the deployed reading budget, L-29, Q-08). The correctness of the values read is NOT judged.
// Each id is probed once, with at most the D2 attempts on 429/5xx inside that probe; no id is probed twice (R8.2b).
//
// Never written: request or response headers, the key, the base URL beyond its host, provider error text (L-34).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist", "src");
const fromDist = (p) => import(pathToFileURL(path.join(DIST, p)).href);

/** The probe certificate (P-01): cg-016, a dataset scan with one page image and no text layer. */
export const PROBE_CASE = "cg-016";
/** P-02, R8.2b: the batch's hard cap of chat calls. A test may lower it; nothing can raise it. */
export const CALL_CAP = 18;
/** D8-06: at most 12 ids are probed. */
export const MAX_IDS = 12;
export const PROBE_NOTE = "One probe of CertGate's own request (the certificate page as an image plus the frozen prompt) through the unchanged reading path. Pass means the request was accepted and the reply passed the existing response schema, named the requested model and finished within the 210 s reading budget. The correctness of the values read is NOT judged; no figure of CertGate applies to this model.";

const sha = (b) => createHash("sha256").update(b).digest("hex");
export const probeFileName = (id) => `${id.replace(/[^A-Za-z0-9._-]/g, "_")}.json`;

/** Q-07: excluded only by a field that is present; an entry missing a field is probed. */
export function classify(entry, measuredIds, sameModel) {
  const id = typeof entry?.id === "string" ? entry.id : null;
  if (id === null) return { id: null, action: "skip_invalid" };
  if (measuredIds.some((m) => sameModel(m, id))) return { id, action: "measured" };
  if (Array.isArray(entry.output) && !entry.output.includes("text")) return { id, action: "not_chat", field: `output = ${JSON.stringify(entry.output)}` };
  const inp = entry.architecture?.input_modalities;
  if (Array.isArray(inp) && !inp.includes("image")) return { id, action: "no_image_input", field: `architecture.input_modalities = ${JSON.stringify(inp)}` };
  return { id, action: "probe" };
}

/** The T8-02 golden of a request body: the page images replaced by a fixed marker (Q-11). */
export function maskedBodySha256(bodyText) {
  const b = JSON.parse(bodyText);
  for (const p of b.messages[1].content) if (p.type === "image_url") p.image_url = { url: "<page image>" };
  return sha(JSON.stringify(b));
}

/**
 * Runs one batch. `load` resolves a product module by its dist path ("web/live-reader.js"); the default is the
 * built dist/, a test passes the sources. Returns the batch summary.
 */
export async function runBatch({ base, key, out, cap = CALL_CAP, backoffBaseMs, load = fromDist, distDir = DIST, log = console.log, budgetMsForTest }) {
  const { LiveReader, promptSha256 } = await load("web/live-reader.js");
  const { loadDatasetCase, loadShared } = await load("cases.js");
  const { evaluateCase, readCase } = await load("pipeline.js");
  const { CRITICAL_FIELDS } = await load("fields.js");
  const { ReaderError } = await load("reader.js");
  const { MEASURED_MODELS, sameModel } = await load("web/models.js");
  const { DEPLOYED_LIVE_BUDGET } = await load("web/limits.js");
  const callCap = Number.isInteger(cap) && cap > 0 ? Math.min(cap, CALL_CAP) : CALL_CAP;
  // A test may shorten the budget to exercise the slow path; the command line never does.
  const budgetMs = Number.isInteger(budgetMsForTest) && budgetMsForTest > 0 ? Math.min(budgetMsForTest, DEPLOYED_LIVE_BUDGET.readBudgetMs) : DEPLOYED_LIVE_BUDGET.readBudgetMs;
  base = base.replace(/\/+$/, "");
  const host = new URL(base).host;
  const basePath = new URL(base).pathname.replace(/\/+$/, "");
  mkdirSync(out, { recursive: true });

  /** L-34, D8-04: nothing that carries the key, the base URL path or a header is written; compared in memory only. */
  const write = (name, obj) => {
    const text = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n";
    if (text.includes(key) || (basePath.length > 1 && text.includes(`${host}${basePath}`)) || /authorization|bearer /i.test(text)) {
      throw new Error(`refusing to write ${name}: it would carry a secret or a header`);
    }
    writeFileSync(path.join(out, name), text);
  };

  // ---- provenance (P-07)
  let commit = null;
  let dirty = null;
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString().trim();
    dirty = execFileSync("git", ["status", "--porcelain", "--", "src", "tools/probe-models.mjs", "package.json", "package-lock.json"], { cwd: ROOT }).toString().trim() !== "";
  } catch { /* not a git checkout */ }
  const files = [];
  const walk = (d) => { for (const e of readdirSync(d).sort()) { const p = path.join(d, e); if (statSync(p).isDirectory()) walk(p); else files.push(p); } };
  walk(distDir);
  const listing = files.map((f) => `${sha(readFileSync(f))}  ${path.relative(path.dirname(distDir), f).split(path.sep).join("/")}`);
  const pick = (suffix) => listing.find((l) => l.endsWith(suffix))?.slice(0, 64) ?? null;
  const provenance = {
    commit, product_tree_dirty: dirty, built_from: path.relative(ROOT, distDir).split(path.sep).join("/"),
    dist_tree_sha256: sha(listing.join("\n") + "\n"), dist_files: String(listing.length),
    live_reader_sha256: pick("web/live-reader.js") ?? pick("web/live-reader.ts"),
    model_output_sha256: pick("/model-output.js") ?? pick("/model-output.ts"),
    prompt_sha256: promptSha256(),
  };

  const getJson = async (p) => {
    const t0 = Date.now();
    const res = await fetch(`${base}${p}`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(60_000) });
    const text = await res.text();
    let body = null; try { body = JSON.parse(text); } catch { /* not JSON */ }
    return { read_utc: new Date().toISOString(), host, path: p, status: res.status, elapsed_ms: String(Date.now() - t0), body };
  };

  // ---- the request bytes, captured locally (L-21, Q-11)
  const captureBody = async (modelId, certificate) => {
    let seen = null;
    const server = createServer((req, res) => {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => { seen ??= body; res.writeHead(500, { "content-type": "application/json" }); res.end("{}"); });
    }).listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    try {
      const reader = new LiveReader({ baseUrl: `http://127.0.0.1:${server.address().port}/v1`, modelId, apiKey: "capture-not-a-key", backoffBaseMs: 1 });
      await reader.read({ case_id: PROBE_CASE, certificate: new Uint8Array(certificate) }).catch(() => undefined);
    } finally {
      await new Promise((r) => { server.closeAllConnections(); server.close(() => r()); });
    }
    return { request_body_sha256: sha(Buffer.from(seen, "utf8")), request_body_masked_sha256: maskedBodySha256(seen) };
  };

  // ---- the call cap, enforced on every attempt (P-02)
  let calls = 0;
  class CappedRecordingReader extends LiveReader {
    constructor(o) { super(o); this.texts = []; this.capped = false; }
    async read(req) {
      if (calls >= callCap) { this.capped = true; throw new ReaderError("endpoint_off", "probe batch call cap reached; no call made"); }
      calls++;
      const t = await super.read(req);
      this.texts.push(t);
      return t;
    }
  }

  const probe = async (id, shared) => {
    const input = loadDatasetCase(PROBE_CASE, shared);
    const bodies = await captureBody(id, input.certificate);
    const reader = new CappedRecordingReader({ baseUrl: base, modelId: id, apiKey: key, backoffBaseMs });
    const started = new Date();
    const t0 = Date.now();
    const readings = await readCase({ ...input, reader, mode: "real" });
    const elapsed = Date.now() - t0;
    const result = evaluateCase(readings);
    const last = reader.attempts.at(-1);
    const reported = reader.lastCall?.model_reported ?? null;
    const checks = {
      http_200: last?.http_status === "200" && last?.outcome === "ok",
      schema_parsed: readings.case.status === "processed" && !!readings.model,
      same_model: reported !== null && sameModel(id, reported),
      within_reading_budget: elapsed <= budgetMs,
    };
    const passed = Object.values(checks).every(Boolean);
    const errorClass = [...result.receipt.errors].reverse().find((e) => !e.recovered)?.class ?? null;
    const failure = passed ? null
      : reader.capped ? "infrastructure, cap reached"
      : !checks.http_200 ? (last ? `endpoint ${last.outcome}${last.http_status ? ` (HTTP ${last.http_status})` : ""}` : "no attempt")
      : !checks.schema_parsed ? `reply failed the response schema (${errorClass ?? "invalid_output"})`
      : !checks.same_model ? "model_mismatch"
      : "slower than the 210 s reading budget";
    const fields = readings.model?.fields;
    const nonNull = fields ? CRITICAL_FIELDS.filter((k) => { const f = fields.get(k); return f && f.status === "read" && f.value !== null; }).length : null;
    const rec = {
      schema: "certgate.model-probe/1",
      note: PROBE_NOTE,
      model_requested: id,
      model_reported: reported,
      started_utc: started.toISOString(),
      finished_utc: new Date().toISOString(),
      elapsed_ms: String(elapsed),
      reading_budget_ms: String(budgetMs),
      attempts: reader.attempts.map((a) => ({ started_at: a.started_at, elapsed_ms: a.elapsed_ms, outcome: a.outcome, http_status: a.http_status })),
      chat_calls: String(reader.attempts.length),
      tokens: reader.lastCall ? { prompt: reader.lastCall.prompt_tokens, completion: reader.lastCall.completion_tokens, reasoning: reader.lastCall.reasoning_tokens, total: reader.lastCall.total_tokens } : null,
      cost_reported: reader.lastCall?.cost_reported ?? null,
      finish_reason: reader.lastCall?.finish_reason ?? null,
      certificate: { case_id: PROBE_CASE, sha256: sha(input.certificate), kind: "scan (page image, no text layer)" },
      ...bodies,
      prompt_sha256: promptSha256(),
      reply_content: reader.texts.at(-1) ?? null,
      validator: "readCase -> parseModelOutput (src/model-output.ts), unchanged since feaadff",
      checks,
      result: passed ? "passed" : "failed",
      failure_class: failure,
      // Q-15: recorded here only; never shown on the page, in the README or next to an experimental label.
      informational_not_a_quality_figure: { critical_fields_read: nonNull === null ? null : `${nonNull}/${CRITICAL_FIELDS.length}`, proposal: readings.case.status === "processed" ? result.decision.proposal : null },
      endpoint_host: host,
      provenance,
    };
    write(probeFileName(id), rec);
    return rec;
  };

  // ---- the batch
  const usageBefore = await getJson("/usage");
  write("usage-before.json", usageBefore);
  const models = await getJson("/models");
  write("models-snapshot.json", { read_utc: models.read_utc, host, path: "/models", status: models.status, body: models.body });
  if (models.status !== 200 || !Array.isArray(models.body?.data)) throw new Error(`GET /models answered ${models.status}`);
  const classified = models.body.data.map((e) => classify(e, MEASURED_MODELS.map((m) => m.id), sameModel)).filter((c) => c.id !== null);
  const probeable = classified.filter((c) => c.action === "probe");
  const toProbe = probeable.slice(0, MAX_IDS);
  const shared = loadShared("real");
  const records = [];
  // At most 2 probes in flight (D2); LiveReader also caps requests in flight per process.
  for (let i = 0; i < toProbe.length; i += 2) {
    const pair = await Promise.all(toProbe.slice(i, i + 2).map((c) => probe(c.id, shared)));
    records.push(...pair);
    for (const r of pair) log(`${r.finished_utc} ${r.model_requested}: ${r.result}${r.failure_class ? ` (${r.failure_class})` : ""}, ${r.chat_calls} call(s), ${r.elapsed_ms} ms`);
  }
  const usageAfter = await getJson("/usage");
  write("usage-after.json", usageAfter);

  const passed = records.filter((r) => r.result === "passed");
  const summary = {
    schema: "certgate.model-probe-batch/1",
    started_utc: usageBefore.read_utc, finished_utc: usageAfter.read_utc, endpoint_host: host, provenance,
    probe_certificate: PROBE_CASE, call_cap: String(callCap), chat_calls: String(calls),
    listed: classified.map((c) => ({ id: c.id, action: c.action, ...(c.field ? { field: c.field } : {}) })),
    probed: records.map((r) => ({ id: r.model_requested, result: r.result, failure_class: r.failure_class, chat_calls: r.chat_calls, elapsed_ms: r.elapsed_ms, evidence: probeFileName(r.model_requested) })),
    not_probed_over_max_ids: probeable.slice(MAX_IDS).map((c) => c.id),
    experimental_set: passed.map((r) => r.model_requested),
  };
  write("BATCH.json", summary);
  write("BATCH.md", [
    "# Stage 8 probe batch", "",
    `Generated by \`tools/probe-models.mjs\` at commit \`${commit}\` (dist tree \`${provenance.dist_tree_sha256}\`). Endpoint host ${host}. Probe certificate ${PROBE_CASE}. One probe per id, no re-probe. The correctness of the values read is not judged.`, "",
    `Chat calls: **${calls} of the cap ${callCap}**. GET /usage before at ${usageBefore.read_utc}, after at ${usageAfter.read_utc}. GET /models at ${models.read_utc}: ${classified.length} ids.`, "",
    "| Listed id | Action | Result | Chat calls | Elapsed ms | Evidence |", "|---|---|---|---|---|---|",
    ...classified.map((c) => {
      const r = records.find((x) => x.model_requested === c.id);
      return `| ${c.id} | ${c.action}${c.field ? ` (${c.field})` : ""} | ${r ? `${r.result}${r.failure_class ? `: ${r.failure_class}` : ""}` : "not probed"} | ${r ? r.chat_calls : "0"} | ${r ? r.elapsed_ms : "—"} | ${r ? probeFileName(c.id) : "—"} |`;
    }), "",
    `Experimental set (passed): ${passed.length ? passed.map((r) => `\`${r.model_requested}\``).join(", ") : "none"}.`, "",
  ].join("\n"));
  log(`chat calls ${calls}/${callCap}; passed: ${passed.map((r) => r.model_requested).join(", ") || "none"}`);
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = process.env.MODEL_BASE_URL ?? "";
  const key = process.env.MODEL_API_KEY ?? "";
  if (!base || !key) { console.error("MODEL_BASE_URL and MODEL_API_KEY must be set"); process.exit(2); }
  const arg = (k) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : null);
  const out = path.resolve(ROOT, arg("out") ?? path.join("evidence", "runs", "certgate-001", "stage-8", "probes"));
  runBatch({ base, key, out }).catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
}
