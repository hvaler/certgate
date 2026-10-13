// Development calls to the real endpoint, used for prompt tuning and for recording test fixtures (S3-06).
// Every call is appended to evaluation/dev-calls.jsonl (R3.1 C-13): UTC time, kind, case id, certificate
// SHA-256, prompt SHA-256, HTTP status, elapsed time. No key and no base-URL value is written anywhere: the
// host name may appear. Run only while holding the room's ENDPOINT LEASE (D3-02).
//
//   node tools/dev/endpoint-dev.mjs usage|models|error-model|error-auth
//   node tools/dev/endpoint-dev.mjs read <case-id> [--fixture <name>]     (tuning cases cg-001..cg-003 only)
import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dist = (p) => import(pathToFileURL(path.join(ROOT, "dist", "src", p)).href);
const { LiveReader, promptSha256, READING_INSTRUCTION } = await dist("web/live-reader.js");
const { loadDatasetCase, loadShared } = await dist("cases.js");
const { evaluateCase, readCase } = await dist("pipeline.js");

const base = (process.env.MODEL_BASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.MODEL_API_KEY ?? "";
const model = process.env.MODEL_ID ?? "";
if (!base || !key || !model) { console.error("MODEL_BASE_URL, MODEL_API_KEY and MODEL_ID must be set"); process.exit(2); }
const host = new URL(base).host;
const TUNING = new Set(JSON.parse(readFileSync(path.join(ROOT, "evaluation", "tuning-exclusions.json"), "utf8")).excluded);
const LOG = path.join(ROOT, "evaluation", "dev-calls.jsonl");
const FIX = path.join(ROOT, "test", "fixtures", "endpoint");
mkdirSync(FIX, { recursive: true });

/** Remove anything that could carry the key or the base URL value; keep the host name. */
function scrub(text) {
  let s = String(text);
  if (key) s = s.split(key).join("<MODEL_API_KEY>");
  if (base) s = s.split(base).join(`https://${host}/<base-path>`);
  return s;
}
const keepHeaders = (h) => Object.fromEntries(Object.entries(h).filter(([k]) => /^(content-type|retry-after|x-ratelimit-.*|x-request-id|date)$/i.test(k)));
const log = (entry) => appendFileSync(LOG, JSON.stringify({ utc: new Date().toISOString(), prompt_sha256: promptSha256(), host, ...entry }) + "\n");
function saveFixture(name, record) {
  const file = path.join(FIX, `${name}.json`);
  writeFileSync(file, scrub(JSON.stringify({ recorded_utc: new Date().toISOString(), host, ...record }, null, 2)) + "\n");
  console.log("fixture", path.relative(ROOT, file));
}

async function plain(kind, pathPart, { authKey = key, method = "GET", body = undefined } = {}) {
  const t0 = Date.now();
  const res = await fetch(`${base}${pathPart}`, {
    method, headers: { authorization: `Bearer ${authKey}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  const h = {}; res.headers.forEach((v, k) => { h[k] = v; });
  log({ kind, case_id: null, certificate_sha256: null, http_status: res.status, elapsed_ms: Date.now() - t0 });
  let parsed = null; try { parsed = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, headers: keepHeaders(h), body: parsed ?? text };
}

const [cmd, arg] = process.argv.slice(2);
const fixtureName = process.argv.includes("--fixture") ? process.argv[process.argv.indexOf("--fixture") + 1] : null;
if (cmd === "usage") {
  const r = await plain("usage", "/usage");
  saveFixture(fixtureName ?? "usage", { request: { method: "GET", path: "/usage" }, ...r });
} else if (cmd === "models") {
  const r = await plain("models", "/models");
  saveFixture(fixtureName ?? "models", { request: { method: "GET", path: "/models" }, ...r });
} else if (cmd === "error-model") {
  const r = await plain("error-model", "/chat/completions", { method: "POST", body: { model: "certgate-no-such-model", max_tokens: 8, messages: [{ role: "user", content: "ping" }] } });
  saveFixture(fixtureName ?? "error-unknown-model", { request: { method: "POST", path: "/chat/completions", model: "certgate-no-such-model" }, ...r });
} else if (cmd === "error-auth") {
  const r = await plain("error-auth", "/chat/completions", { authKey: "certgate-invalid-test-key", method: "POST", body: { model, max_tokens: 8, messages: [{ role: "user", content: "ping" }] } });
  saveFixture(fixtureName ?? "error-invalid-key", { request: { method: "POST", path: "/chat/completions", model, key: "an invalid test key" }, ...r });
} else if (cmd === "read") {
  if (!TUNING.has(arg)) { console.error(`read is limited to the tuning cases (${[...TUNING].join(", ")}); add a case to evaluation/tuning-exclusions.json first`); process.exit(2); }
  const shared = loadShared("real");
  const input = loadDatasetCase(arg, shared);
  const sha = createHash("sha256").update(input.certificate).digest("hex");
  let raw = null;
  const reader = new LiveReader({ baseUrl: base, modelId: model, apiKey: key, onResponse: (r) => { raw = r; } });
  const t0 = Date.now();
  const readings = await readCase({ ...input, reader, mode: "real" });
  const result = evaluateCase(readings);
  log({ kind: "read", case_id: arg, certificate_sha256: sha, http_status: raw?.status ?? null, elapsed_ms: Date.now() - t0, attempts: reader.attempts.length });
  if (raw) {
    let body = raw.body; try { body = JSON.parse(raw.body); } catch { /* raw */ }
    saveFixture(fixtureName ?? `read-${arg}`, { request: { method: "POST", path: "/chat/completions", model, case_id: arg, certificate_sha256: sha, prompt_sha256: promptSha256() }, status: raw.status, headers: keepHeaders(raw.headers), body });
  }
  console.log(JSON.stringify({
    case: arg, status: result.readings.case.status, proposal: result.decision.proposal, reasons: result.decision.reasons.map((x) => x.code),
    reader: { model_reported: reader.lastCall?.model_reported, finish: reader.lastCall?.finish_reason, tokens: reader.lastCall?.total_tokens, completion: reader.lastCall?.completion_tokens, cost: reader.lastCall?.cost_reported, elapsed_ms: reader.lastCall?.elapsed_ms, rate: reader.lastCall?.rate_limit },
    attempts: reader.attempts, errors: result.receipt.errors,
    values: result.receipt.values.filter((v) => !/issuer|dimensions|date|certificate_no/.test(v.field)).map((v) => `${v.field}=${v.value ?? "∅"}${v.unit ? " " + v.unit : ""} [${v.source}]`),
  }, null, 1));
} else {
  console.error("usage: endpoint-dev.mjs usage|models|error-model|error-auth|read <case>");
  process.exit(2);
}
void READING_INSTRUCTION;
