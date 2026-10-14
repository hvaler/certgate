// Stateless web backend (F4): every route is a pure function of the request, the server configuration and
// the versioned files in the repository. No case is kept on the server; the live-read counters are the only
// server state (D2-06). The same handler serves the local container and is the shape of a Vercel function
// (api/index.ts); nothing is deployed in this dispatch (S2-23).
import { createHash, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { CaseInputError, listDatasetCases, loadDatasetCase, loadShared, type Shared } from "../cases.js";
import { getMode, REPO_ROOT } from "../config.js";
import { DeliveryNoteError } from "../delivery.js";
import { InputRejected, validateCertificate, validateDeliveryNote } from "../input-file.js";
import { ConfirmationError, HumanDecisionError, processCase, recordHumanDecision, type CaseResult } from "../pipeline.js";
import { ReaderError, type ModelReader, type ReadRequest } from "../reader.js";
import { exportReceipt } from "../receipt.js";
import { CRITICAL_FIELDS } from "../fields.js";
import type { FieldConfirmation, HumanAction } from "../types.js";
import { summary } from "../cli.js";
import { loadWebConfig, type WebConfig } from "./config.js";
import { probeF1 } from "./f1.js";
import { datasetCertificateHashes } from "./dataset-hashes.js";
import { InMemoryHourlyCounter, type HourlyCounter } from "./limiter.js";
import { LiveReader, type LiveCallInfo } from "./live-reader.js";
import { DeadlineReader } from "./deadline-reader.js";
import { ADAPTER_ATTEMPT_TIMEOUT_MS, WEB_MAX_CERTIFICATE_BYTES, WEB_MAX_DELIVERY_BYTES, WEB_MAX_REQUEST_BYTES, DEPLOYED_LIVE_UNAVAILABLE, LIVE_FITS_DEPLOYED_FUNCTION, DEPLOYED_LIVE_BUDGET, CONTAINER_LIVE_BUDGET, type LiveBudget } from "./limits.js";
import { MemoryStore, StoreUnavailable, UpstashRestStore, storeEnv, type LiveStore } from "./live-store.js";
import { JOB_ID, KEYS, LiveJobs, REASONS, Refusal, WINDOW_TTL_S, hourKey, type Outcome, type ReasonClass } from "./live-jobs.js";
import { getDataDir } from "../config.js";
import { toView } from "./view.js";
import type { PlantedEntry } from "../model-output.js";

/** The three judge-mode stories (S2-14). */
export const STORY_IDS = ["cg-001", "cg-002", "cg-003"] as const;
/** Shown on the page and required to be confirmed before any live reading (R3.1 C-02 b). */
export const LIVE_NOTICE = "The file is sent to AMD Token Factory, a third-party service that keeps prompts and outputs for about 2 days. Send only synthetic, fictitious certificates, never real data.";
export const PUBLIC_DIR = path.join(REPO_ROOT, "public");

/** Web uploads never reach MockReader (B-13): with no endpoint they fail as C11 endpoint_off (S2-20). */
class EndpointOffReader implements ModelReader {
  readonly kind = "live" as const;
  readonly reader_id = "live-reader-endpoint-off";
  readonly model_id = "none (endpoint off)";
  readonly model_version = "unknown";
  readonly vllm_version = "unknown";
  readonly rocm_version = "unknown";
  readonly planted: PlantedEntry[] = [];
  private count = 0;
  constructor(private readonly why: string) {}
  get calls() { return this.count; }
  async read(_req: ReadRequest): Promise<string> {
    this.count++;
    throw new ReaderError("endpoint_off", this.why);
  }
}

export interface AppDeps {
  env?: NodeJS.ProcessEnv;
  /** Injected only by the test harness (B-07). */
  clock?: () => Date;
  liveCounter?: HourlyCounter;
  codeFailureCounter?: HourlyCounter;
  /** Test-only override of adapter timeouts; never reachable over HTTP. */
  adapterTimeoutMs?: number;
  /** Test-only override of retry backoff; never reachable over HTTP. */
  backoffBaseMs?: number;
  /**
   * Shared store for live jobs and their limits (Stage 6). Default: Upstash REST from the integration's variables on
   * the deployed site (none: live reading refused), an in-process MemoryStore in the container. Tests inject one
   * MemoryStore into two handlers to simulate two instances.
   */
  liveStore?: LiveStore;
  /** Keeps the job's work alive after the response: Vercel's waitUntil in api/index.ts; in process otherwise. */
  defer?: (work: Promise<unknown>) => void;
  /** Test-only budget and polling override; never reachable over HTTP. */
  liveBudget?: Partial<LiveBudget>;
}

/** Dataset certificates offered for download on the live screen (S6-06, CH6-16): a fixed allow-list by id. */
export const SAMPLE_IDS = ["cg-004", "cg-005", "cg-010"] as const;
/** The live job API's request header for the access code; never a query parameter (CH6-01). */
export const ACCESS_CODE_HEADER = "x-live-access-code";
const JOB_POLL_INTERVAL_S = 2;

const NO_STORE = { "cache-control": "no-store" };
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};
const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  // Same-origin only: no third-party request from any page (B-17); no inline script (B-16).
  "content-security-policy": "default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
};

class HttpError extends Error {
  constructor(readonly status: number, message: string, readonly extra: Record<string, unknown> = {}) {
    super(message);
  }
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", ...SECURITY_HEADERS, ...headers });
  res.end(JSON.stringify(body, null, 2) + "\n");
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const declared = Number.parseInt(String(req.headers["content-length"] ?? "0"), 10);
  if (declared > WEB_MAX_REQUEST_BYTES) throw new HttpError(413, `request body exceeds ${WEB_MAX_REQUEST_BYTES} bytes`);
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > WEB_MAX_REQUEST_BYTES) throw new HttpError(413, `request body exceeds ${WEB_MAX_REQUEST_BYTES} bytes`);
    chunks.push(chunk as Buffer);
  }
  if (size === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "request body is not JSON");
  }
}

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();

/** Constant-time comparison of the access code (S2-17). */
export function codeMatches(given: unknown, expected: string): boolean {
  return typeof given === "string" && timingSafeEqual(digest(given), digest(expected));
}

function viewJson(r: CaseResult) {
  const view = toView(r);
  return { summary: summary(r), view: { ...view, receipt: JSON.parse(exportReceipt(r.receipt)) } };
}

function parseConfirmations(raw: unknown, by: string, at: string): FieldConfirmation[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new HttpError(400, "confirmations must be a list");
  return raw.map((c) => {
    const o = c as Record<string, unknown>;
    if (typeof o.field !== "string" || !CRITICAL_FIELDS.includes(o.field)) throw new HttpError(400, "unknown confirmation field");
    if (o.value !== null && typeof o.value !== "string") throw new HttpError(400, "confirmation value must be a string or null");
    // confirmed_at is stamped by the server (B-15).
    return { field: o.field, value: o.value as string | null, unit: null, confirmed_by: by, confirmed_at: at };
  });
}

export function createHandler(deps: AppDeps = {}) {
  const env = deps.env ?? process.env;
  const clock = deps.clock ?? (() => new Date());
  const loaded: WebConfig = loadWebConfig(env);
  // Stage 6 (S6-01, S6-04, CH6-04): on the deployed site, live reading is enabled only with an access code, the
  // shared store, an hourly limit and a configured endpoint. Otherwise the site behaves as at 409fb69a and the new
  // live routes answer the deployed-site refusal.
  const sEnv = storeEnv(env);
  const deployedMissing = !loaded.deployedSite ? null
    : loaded.liveAccessCode === null ? "code"
    : sEnv === null && !deps.liveStore ? "store"
    : loaded.liveReadsPerHour <= 0 ? "limit"
    : loaded.modelBaseUrl === null || loaded.modelId === null ? "endpoint"
    : null;
  const deployedLive = loaded.deployedSite && deployedMissing === null;
  // J-08: with live reading disabled on the deployed site every existing route answers as at 409fb69a, so the
  // loaded configuration is used unchanged there; only the new job routes look at deployedLive.
  const cfg: WebConfig = loaded;
  const liveCounter = deps.liveCounter ?? new InMemoryHourlyCounter(cfg.liveReadsPerHour, clock);
  const codeFailures = deps.codeFailureCounter ?? new InMemoryHourlyCounter(cfg.liveCodeFailuresPerHour, clock);
  let shared: Shared | null = null;
  const getShared = () => (shared ??= loadShared("mock"));
  let lastLive: LiveCallInfo | null = null;
  const store: LiveStore | null = deps.liveStore
    ?? (loaded.deployedSite ? (sEnv && deployedLive ? new UpstashRestStore(sEnv.url, sEnv.token) : null) : new MemoryStore(() => clock().getTime()));
  const budget: LiveBudget = { ...(loaded.deployedSite ? DEPLOYED_LIVE_BUDGET : CONTAINER_LIVE_BUDGET), ...deps.liveBudget };
  const jobs = store ? new LiveJobs(store, clock, budget) : null;
  const defer = deps.defer ?? ((w: Promise<unknown>) => void w.catch(() => undefined));
  // J-08: what is missing on the deployed site goes to the server log only (names, never values).
  if (loaded.deployedSite && deployedMissing !== null && deployedMissing !== "code") {
    console.warn(`[certgate] live reading disabled on the deployed site: ${deployedMissing === "store" ? "no shared store variables" : deployedMissing === "limit" ? "LIVE_READS_PER_HOUR not set or 0" : "MODEL_BASE_URL or MODEL_ID not set"}`);
  }

  function liveStatus() {
    const p = liveCounter.peek();
    const deployedOff = cfg.deployedSite && !LIVE_FITS_DEPLOYED_FUNCTION;
    const enabled = cfg.liveReadsPerHour > 0 && !deployedOff;
    return {
      enabled,
      reason: deployedOff ? DEPLOYED_LIVE_UNAVAILABLE
        : enabled ? (p.remaining > 0 ? "open within the limit" : "limit reached this hour") : "live reading disabled: LIVE_READS_PER_HOUR not set or 0",
      deployed_site: cfg.deployedSite,
      upload_policy: cfg.liveAccessCode !== null
        ? "any synthetic PDF, with the access code"
        : "dataset certificates only (matched by SHA-256); uploaded files need the access code, which is not configured here",
      notice: LIVE_NOTICE,
      limit_per_hour: String(cfg.liveReadsPerHour),
      remaining_this_hour: String(enabled ? p.remaining : 0),
      reopens_at: p.reopens_at,
      access_code_required: cfg.liveAccessCode !== null,
      endpoint_configured: cfg.modelBaseUrl !== null,
      windows: cfg.liveWindows ?? null,
      windows_note: cfg.liveWindows ? "announced live windows (configured)" : "no live window is announced",
      scope_note: "The limit is counted on the server, per server instance in this build.",
      checked_at: clock().toISOString(),
    };
  }

  async function liveRead(body: Record<string, unknown>) {
    // 0. Deployed site: the live path's time budget does not fit the function duration (S3-24, C-07).
    if (cfg.deployedSite && !LIVE_FITS_DEPLOYED_FUNCTION) throw new HttpError(503, DEPLOYED_LIVE_UNAVAILABLE);
    // 1. Input shape and size (not counted when rejected, B-03).
    if (typeof body.certificate_base64 !== "string") throw new HttpError(400, "certificate_base64 is required");
    const cert = Buffer.from(body.certificate_base64, "base64");
    if (cert.length > WEB_MAX_CERTIFICATE_BYTES) throw new HttpError(413, `certificate exceeds the web limit of ${WEB_MAX_CERTIFICATE_BYTES} bytes`);
    // 1b. The visitor confirmed the third-party notice: the file goes to AMD Token Factory and must be synthetic (C-02 b).
    if (body.synthetic_confirmed !== true) throw new HttpError(400, `confirm the notice first: ${LIVE_NOTICE}`);
    const csv = typeof body.delivery_csv === "string" ? Buffer.from(body.delivery_csv, "utf8") : null;
    if (csv && csv.length > WEB_MAX_DELIVERY_BYTES) throw new HttpError(413, `delivery note exceeds ${WEB_MAX_DELIVERY_BYTES} bytes`);
    const line = typeof body.delivery_line === "string" ? body.delivery_line : null;
    // 2. Access code, if configured, with its own failure throttle (S2-17, B-04).
    if (cfg.liveAccessCode !== null && !codeMatches(body.access_code, cfg.liveAccessCode)) {
      const t = codeFailures.tryConsume();
      if (!t.ok) throw new HttpError(429, "too many wrong access codes this hour", { reopens_at: t.reopens_at });
      throw new HttpError(403, "wrong or missing access code; no live reading was used");
    }
    // 2b. Without a configured access code only the dataset certificates can be read live (C-02 a).
    const certSha = createHash("sha256").update(cert).digest("hex");
    if (cfg.liveAccessCode === null && !datasetCertificateHashes().has(certSha)) {
      throw new HttpError(403, "live reading of an uploaded file needs the access code, which is not configured on this server; only the dataset certificates can be read live here");
    }
    // 3. Validate the documents before anything is counted.
    const inputBase = {
      case_id: `upload-${createHash("sha256").update(cert).digest("hex").slice(0, 12)}`,
      certificate: new Uint8Array(cert),
      delivery_note: csv ? { name: "delivery.csv", bytes: new Uint8Array(csv) } : null,
      delivery_line: line,
      spec: getShared().spec,
      plausibility: getShared().plausibility,
      mode: "real",
      now: clock,
    };
    // 4. Endpoint off: the case behaves as C11 endpoint_off (S2-20); nothing is counted (B-03).
    const f1 = await probeF1(cfg, clock, lastLive);
    if (f1.state !== "on") {
      const r = await processCase({ ...inputBase, reader: new EndpointOffReader(`no live endpoint: ${f1.detail}`), f1 });
      return { counted: false, explanation: liveStatus().windows_note, ...viewJson(r) };
    }
    // 5. Limit, checked and consumed atomically, on the server (S2-16, B-02).
    await validateCertificate(inputBase.certificate);
    if (inputBase.delivery_note) validateDeliveryNote(inputBase.delivery_note.bytes);
    // The container's synchronous route shares the job API's hourly count in the in-process store (CH6-17).
    if (jobs && (await jobs.store.incr(KEYS.reads(hourKey(clock())), WINDOW_TTL_S)) > cfg.liveReadsPerHour) {
      throw new HttpError(429, cfg.liveReadsPerHour > 0 ? "live readings exhausted this hour" : "live reading disabled", { reopens_at: liveCounter.peek().reopens_at });
    }
    const slot = liveCounter.tryConsume();
    if (!slot.ok) {
      throw new HttpError(429, cfg.liveReadsPerHour > 0 ? "live readings exhausted this hour" : "live reading disabled", { reopens_at: slot.reopens_at });
    }
    const reader = new LiveReader({ baseUrl: cfg.modelBaseUrl!, modelId: cfg.modelId ?? "unknown", apiKey: cfg.modelApiKey, attemptTimeoutMs: deps.adapterTimeoutMs, backoffBaseMs: deps.backoffBaseMs });
    const r = await processCase({ ...inputBase, reader, f1 });
    if (reader.lastCall) {
      lastLive = reader.lastCall;
      r.receipt.f1 = await probeF1(cfg, clock, lastLive);
    }
    return { counted: true, remaining_this_hour: String(slot.remaining), ...viewJson(r) };
  }

  // ---- Stage 6: live jobs (S6-01…S6-08) ----

  /** The live state for the job API: enabled, and the refusal when it is not (CH6-03, CH6-04). */
  function jobGate(): { enabled: true } | { enabled: false; status: number; reason: string } {
    if (cfg.deployedSite) {
      // J-08: one identical refusal whatever is missing; the detail goes to the server log only.
      if (!deployedLive) return { enabled: false, status: 503, reason: DEPLOYED_LIVE_UNAVAILABLE };
      return { enabled: true };
    }
    if (cfg.liveReadsPerHour <= 0) return { enabled: false, status: 429, reason: "live reading disabled: LIVE_READS_PER_HOUR not set or 0" };
    return { enabled: true };
  }

  async function liveStatusNow(req: IncomingMessage) {
    const base = liveStatus();
    // J-08: disabled on the deployed site, for any reason, answers exactly as at 409fb69a.
    if (cfg.deployedSite && !deployedLive) return base;
    const gate = jobGate();
    const c = await jobs!.counts(cfg.liveCodeFailuresPerHour, clientKey(req));
    const remaining = Math.max(0, cfg.liveReadsPerHour - c.used_this_hour);
    return {
      ...base,
      enabled: gate.enabled,
      reason: gate.enabled ? (remaining > 0 ? "open within the limit" : "limit reached this hour") : gate.reason,
      remaining_this_hour: String(gate.enabled ? remaining : 0),
      reopens_at: c.reopens_at,
      scope_note: cfg.deployedSite ? "global: counted in the shared store across all instances" : "global for this server process: counted in the in-process store",
      used_this_hour: String(c.used_this_hour),
      in_flight: String(c.in_flight),
      waiting: String(c.waiting),
      code_failures_this_hour_global: String(c.code_failures_this_hour_global),
      code_failures_this_hour_this_client: String(c.code_failures_this_hour_this_client),
      code_failure_limit_per_client: String(c.code_failure_limit_per_client),
      job_api: "/api/live/jobs",
      access_code_header: ACCESS_CODE_HEADER,
      poll_interval_s: String(JOB_POLL_INTERVAL_S),
      model_requested: cfg.modelId,
      samples: "/api/samples",
    };
  }

  /** F1 on the deployed site with live enabled: one probe per 60 s across instances (H-11, CH6-11). */
  async function f1Now() {
    if (!deployedLive || !store) return probeF1(cfg, clock, lastLive);
    const hit = await store.get(KEYS.f1);
    if (hit) return JSON.parse(hit);
    if (await store.setNx(KEYS.f1Lock, "1", 60_000)) {
      const snap = await probeF1(cfg, clock, lastLive);
      await store.set(KEYS.f1, JSON.stringify(snap), 60);
      await store.set(KEYS.f1Last, JSON.stringify(snap), 3600);
      return snap;
    }
    // Another instance holds the probe (J-09): wait briefly for its snapshot instead of probing again.
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 100));
      const fresh = await store.get(KEYS.f1);
      if (fresh) return JSON.parse(fresh);
    }
    const last = await store.get(KEYS.f1Last);
    return last ? JSON.parse(last) : { ...(await probeF1({ ...cfg, modelBaseUrl: null }, clock, null)), detail: "the endpoint check is in progress on another instance" };
  }

  // K-01: the per-client key comes only from a value the platform guarantees (docs/sources/vercel-request-headers.md).
  // On Vercel that is x-vercel-forwarded-for. x-forwarded-for and x-real-ip are never read: Vercel documents that
  // x-forwarded-for "could be overwritten if you're using a proxy on top of Vercel", and x-real-ip only as identical
  // to it. Without the platform header every request shares one key (fail closed). In the container no header is
  // trusted: the socket address is the client.
  const clientKey = (req: IncomingMessage) => {
    const ip = cfg.deployedSite
      ? String(req.headers["x-vercel-forwarded-for"] ?? "").trim() || "no-platform-client-address"
      : req.socket.remoteAddress || "unknown";
    return createHash("sha256").update(ip, "utf8").digest("hex").slice(0, 32);
  };

  const READER_CLASS: Record<string, ReasonClass> = { timeout: "timeout", http_429: "endpoint_429", http_5xx: "endpoint_5xx", endpoint_off: "endpoint_5xx" };

  async function startJob(req: IncomingMessage, body: Record<string, unknown>) {
    const arrivedAt = clock(); // J-14: the deadline is measured from the request's arrival
    const gate = jobGate();
    if (!gate.enabled) throw new HttpError(gate.status, gate.reason);
    // 1. Input shape, size and consent, before anything is counted (CH6-09, CH6-16).
    if (typeof body.certificate_base64 !== "string") throw new HttpError(400, "certificate_base64 is required");
    const cert = Buffer.from(body.certificate_base64, "base64");
    if (cert.length > WEB_MAX_CERTIFICATE_BYTES) throw new HttpError(413, `certificate exceeds the web limit of ${WEB_MAX_CERTIFICATE_BYTES} bytes`);
    if (body.synthetic_confirmed !== true) throw new HttpError(400, `confirm the notice first: ${LIVE_NOTICE}`);
    const csv = typeof body.delivery_csv === "string" ? Buffer.from(body.delivery_csv, "utf8") : null;
    if (csv && csv.length > WEB_MAX_DELIVERY_BYTES) throw new HttpError(413, `delivery note exceeds ${WEB_MAX_DELIVERY_BYTES} bytes`);
    const line = typeof body.delivery_line === "string" ? body.delivery_line : null;
    // 2. Access code: request header only, never the query string or the body (CH6-01, J-12). J-02 count first:
    //    this client's counter is incremented atomically before the compare; over its limit, no compare at all; a
    //    correct code gives the unit back. K-02: only a wrong code adds to the global count, which never refuses.
    if (cfg.liveAccessCode !== null) {
      const client = clientKey(req);
      const attempt = await jobs!.countCodeAttempt(client, cfg.liveCodeFailuresPerHour);
      if (attempt.over) throw new HttpError(429, "too many wrong access codes this hour", { reopens_at: attempt.reopens_at });
      if (!codeMatches(req.headers[ACCESS_CODE_HEADER], cfg.liveAccessCode)) {
        // K-02: a wrong code is counted globally after the compare, for monitoring only; it never refuses anyone.
        await jobs!.recordCodeFailure(attempt);
        throw new HttpError(403, "wrong or missing access code; no live reading was used");
      }
      await jobs!.forgiveCode(attempt);
    } else if (!datasetCertificateHashes().has(createHash("sha256").update(cert).digest("hex"))) {
      throw new HttpError(403, "live reading of an uploaded file needs the access code, which is not configured on this server; only the dataset certificates can be read live here");
    }
    // 3. Documents valid and endpoint on, still before counting.
    const inputBase = {
      case_id: `upload-${createHash("sha256").update(cert).digest("hex").slice(0, 12)}`,
      certificate: new Uint8Array(cert),
      delivery_note: csv ? { name: "delivery.csv", bytes: new Uint8Array(csv) } : null,
      delivery_line: line,
      spec: getShared().spec,
      plausibility: getShared().plausibility,
      mode: "real",
      now: clock,
    };
    await validateCertificate(inputBase.certificate);
    if (inputBase.delivery_note) validateDeliveryNote(inputBase.delivery_note.bytes);
    const f1 = await f1Now();
    if (f1.state !== "on") throw new HttpError(503, `no live endpoint: ${f1.detail}`);
    // 4. Admission: busy check, then one atomic count in the UTC hour (CH6-05, CH6-08).
    const job = await jobs!.admit(cfg.liveReadsPerHour, cfg.modelId!, arrivedAt);
    const requested = cfg.modelId!;
    const work = async (attemptTimeoutMs: number): Promise<Outcome> => {
      // W-03: each attempt ends by the job's deadline, and none starts after it (deadline-reader.ts).
      const reader = new DeadlineReader({ baseUrl: cfg.modelBaseUrl!, modelId: requested, apiKey: cfg.modelApiKey, backoffBaseMs: deps.backoffBaseMs }, Date.now() + attemptTimeoutMs, deps.adapterTimeoutMs ?? ADAPTER_ATTEMPT_TIMEOUT_MS);
      const r = await processCase({ ...inputBase, reader, f1 });
      if (r.receipt.status === "error" || !reader.lastCall) {
        if (reader.attempts.at(-1)?.outcome === "http_4xx") return { kind: "failed", reason_class: "endpoint_4xx" };
        const cls = [...r.receipt.errors].reverse().find((e) => !e.recovered)?.class ?? "endpoint_off";
        return { kind: "failed", reason_class: READER_CLASS[cls] ?? "invalid_model_output" };
      }
      // CH6-12: the reading counts only if the endpoint reports the requested model.
      const reported = reader.lastCall.model_reported ?? "";
      if (!reported.toLowerCase().includes(requested.toLowerCase())) return { kind: "failed", reason_class: "model_mismatch" };
      lastLive = reader.lastCall;
      r.receipt.f1 = await probeF1(cfg, clock, lastLive);
      // W-02 (CH6-10): the job API never returns provider text: each recorded error keeps its class only.
      const out = viewJson(r);
      const rc = out.view.receipt as { errors?: { class: string; detail: string }[] };
      for (const e of rc.errors ?? []) e.detail = `attempt failed (${e.class}); it was retried`;
      return { kind: "done", result: { counted: true, ...out } };
    };
    defer(jobs!.run(job, work));
    return {
      job_id: job.job_id, state: job.state, position: job.position, created_at: job.created_at,
      model_requested: requested, poll: `/api/live/jobs/${job.job_id}`, poll_interval_s: JOB_POLL_INTERVAL_S,
    };
  }

  async function jobView(id: string) {
    const gate = jobGate();
    if (!gate.enabled && cfg.deployedSite) throw new HttpError(gate.status, gate.reason);
    if (!JOB_ID.test(id) || !jobs) throw new HttpError(404, "unknown job");
    const v = await jobs.view(id);
    if (!v) throw new HttpError(404, "unknown job");
    return v;
  }

  function samples() {
    return {
      note: "Fictitious certificates of the synthetic dataset (data/cases), offered for download and upload back. They are sent to AMD Token Factory only when you start a live reading.",
      samples: SAMPLE_IDS.map((id) => {
        const c = JSON.parse(readFileSync(path.join(getDataDir(), "cases", id, "case.json"), "utf8")) as { delivery_note: string; delivery_line: string; certificate_kind: string };
        const pdf = readFileSync(path.join(getDataDir(), "cases", id, "certificate.pdf"));
        return {
          id, kind: c.certificate_kind, delivery_line: c.delivery_line,
          certificate: `/api/samples/${id}/certificate.pdf`, certificate_sha256: createHash("sha256").update(pdf).digest("hex"),
          delivery_note: `/api/samples/${id}/delivery.csv`,
        };
      }),
    };
  }

  function sampleFile(id: string, file: string, res: ServerResponse) {
    if (!(SAMPLE_IDS as readonly string[]).includes(id)) return send(res, 404, { error: "not found" });
    const c = JSON.parse(readFileSync(path.join(getDataDir(), "cases", id, "case.json"), "utf8")) as { delivery_note: string };
    const abs = file === "certificate.pdf" ? path.join(getDataDir(), "cases", id, "certificate.pdf") : path.join(getDataDir(), c.delivery_note);
    const type = file === "certificate.pdf" ? "application/pdf" : "text/csv; charset=utf-8";
    res.writeHead(200, { "content-type": type, "content-disposition": `attachment; filename="${id}-${file}"`, "cache-control": "public, max-age=300", ...SECURITY_HEADERS });
    res.end(readFileSync(abs));
  }

  async function storyEvaluate(id: string, body: Record<string, unknown>) {
    if (!(STORY_IDS as readonly string[]).includes(id)) throw new HttpError(404, "unknown story");
    const now = clock().toISOString();
    const by = typeof body.confirmed_by === "string" ? body.confirmed_by.trim() : "";
    const confirmations = parseConfirmations(body.confirmations, by, now);
    // The story's recorded real reading, replayed; never the mock and never a new endpoint call (S3-18).
    const { replayStory, storyView } = await import("../tools/build-stories.js");
    const replay = await replayStory(id, confirmations, undefined, clock);
    const rec = replay.rec;
    let r = replay.r;
    const d = body.decision as Record<string, unknown> | undefined;
    if (d) {
      r = recordHumanDecision(r, {
        action: String(d.action) as HumanAction, reason: typeof d.reason === "string" ? d.reason : "",
        decided_by: typeof d.decided_by === "string" ? d.decided_by : "", decided_at: now, // server time (B-15)
      });
    }
    const out = viewJson(r);
    return { ...out, view: { ...out.view, ...storyView(r, rec) }, note: `recorded real reading of ${id} (${rec.recorded_at}), re-evaluated by the server at ${now} with the confirmations and decision given; not live` };
  }

  function serveStatic(urlPath: string, res: ServerResponse) {
    const rel = urlPath === "/" ? "index.html" : decodeURIComponent(urlPath).replace(/^\/+/, "");
    const file = path.resolve(PUBLIC_DIR, rel);
    if (!file.startsWith(PUBLIC_DIR + path.sep) || !existsSync(file) || !statSync(file).isFile()) {
      return send(res, 404, { error: "not found" });
    }
    const type = TYPES[path.extname(file)] ?? "application/octet-stream";
    // Stored stories are versioned static files and may be cached; pages are not (B-05).
    const cache = rel.startsWith("stories/") ? "public, max-age=300" : "no-cache";
    res.writeHead(200, { "content-type": type, "cache-control": cache, ...SECURITY_HEADERS });
    res.end(readFileSync(file));
  }

  return async function handle(req: IncomingMessage, res: ServerResponse) {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const p = url.pathname;
      const m = req.method ?? "GET";
      if (m === "GET" && (p === "/health" || p === "/api/health")) {
        // The reader state from the loaded configuration only (R4.5 E-08): "live" when an endpoint and model are
        // configured outside the deployed site, otherwise "off". No claim beyond that.
        const reader = cfg.modelBaseUrl !== null && cfg.modelId !== null && (!cfg.deployedSite || deployedLive) ? "live" : "off";
        return send(res, 200, { status: "ok", mode: getMode(env), reader, notice: "All data is fictitious." }, NO_STORE);
      }
      if (m === "GET" && p === "/api/f1") return send(res, 200, await f1Now(), NO_STORE);
      if (m === "GET" && p === "/api/live/status") return send(res, 200, await liveStatusNow(req), NO_STORE);
      if (m === "POST" && p === "/api/live/jobs") return send(res, 202, await startJob(req, (await readBody(req)) as Record<string, unknown>), NO_STORE);
      const job = /^\/api\/live\/jobs\/([^/]+)$/.exec(p);
      if (m === "GET" && job) return send(res, 200, await jobView(job[1]!), NO_STORE);
      if (m === "GET" && p === "/api/samples") return send(res, 200, samples(), NO_STORE);
      const sample = /^\/api\/samples\/([A-Za-z0-9_-]+)\/(certificate\.pdf|delivery\.csv)$/.exec(p);
      if (m === "GET" && sample) return sampleFile(sample[1]!, sample[2]!, res);
      if (m === "POST" && p === "/api/live/read") {
        return send(res, 200, await liveRead((await readBody(req)) as Record<string, unknown>), NO_STORE);
      }
      const story = /^\/api\/stories\/([A-Za-z0-9_-]+)\/evaluate$/.exec(p);
      if (m === "POST" && story) {
        return send(res, 200, await storyEvaluate(story[1]!, (await readBody(req)) as Record<string, unknown>), NO_STORE);
      }
      // Stage 1 API, kept (dataset cases through the mock path).
      if (m === "GET" && p === "/api/cases") return send(res, 200, { cases: listDatasetCases() });
      const dc = /^\/api\/cases\/([A-Za-z0-9_-]+)\/process$/.exec(p);
      if (m === "POST" && dc) {
        const result = await processCase(loadDatasetCase(dc[1]!, loadShared(getMode(env))));
        return send(res, 200, { summary: summary(result), receipt: JSON.parse(exportReceipt(result.receipt)) }, NO_STORE);
      }
      if (m === "GET" && !p.startsWith("/api/")) return serveStatic(p, res);
      return send(res, 404, { error: "not found" });
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { status: "rejected", error: e.message, ...e.extra }, NO_STORE);
      if (e instanceof Refusal) return send(res, e.status, { status: "rejected", error: e.message, ...e.extra }, NO_STORE);
      // A store failure refuses live reading; it never falls back to another queue or to a stored result (CH6-04).
      if (e instanceof StoreUnavailable) return send(res, 503, { status: "rejected", reason_class: "store_unavailable", error: REASONS.store_unavailable }, NO_STORE);
      if (e instanceof CaseInputError || e instanceof InputRejected || e instanceof DeliveryNoteError || e instanceof ConfirmationError) {
        return send(res, 400, { status: "rejected", code: (e as InputRejected).code ?? e.name, error: e.message }, NO_STORE);
      }
      if (e instanceof HumanDecisionError) return send(res, 409, { status: "rejected", error: e.message }, NO_STORE);
      return send(res, 500, { status: "internal_error", error: "internal error" }, NO_STORE);
    }
  };
}
