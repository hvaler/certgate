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
import { ConfirmationError, evaluateCase, HumanDecisionError, processCase, readCase, recordHumanDecision, type CaseResult } from "../pipeline.js";
import { ReaderError, type ModelReader, type ReadRequest } from "../reader.js";
import { exportReceipt } from "../receipt.js";
import { CRITICAL_FIELDS } from "../fields.js";
import type { FieldConfirmation, HumanAction } from "../types.js";
import { summary } from "../cli.js";
import { loadWebConfig, type WebConfig } from "./config.js";
import { probeF1 } from "./f1.js";
import { InMemoryHourlyCounter, type HourlyCounter } from "./limiter.js";
import { LiveReader, type LiveCallInfo } from "./live-reader.js";
import { WEB_MAX_CERTIFICATE_BYTES, WEB_MAX_DELIVERY_BYTES, WEB_MAX_REQUEST_BYTES } from "./limits.js";
import { toView } from "./view.js";
import type { PlantedEntry } from "../model-output.js";

/** The three judge-mode stories (S2-14). */
export const STORY_IDS = ["cg-001", "cg-002", "cg-003"] as const;
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
}

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
  const cfg: WebConfig = loadWebConfig(env);
  const liveCounter = deps.liveCounter ?? new InMemoryHourlyCounter(cfg.liveReadsPerHour, clock);
  const codeFailures = deps.codeFailureCounter ?? new InMemoryHourlyCounter(cfg.liveCodeFailuresPerHour, clock);
  let shared: Shared | null = null;
  const getShared = () => (shared ??= loadShared("mock"));
  let lastLive: LiveCallInfo | null = null;

  function liveStatus() {
    const p = liveCounter.peek();
    const enabled = cfg.liveReadsPerHour > 0;
    return {
      enabled,
      reason: enabled ? (p.remaining > 0 ? "open within the limit" : "limit reached this hour") : "live reading disabled: LIVE_READS_PER_HOUR not set or 0",
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
    // 1. Input shape and size (not counted when rejected, B-03).
    if (typeof body.certificate_base64 !== "string") throw new HttpError(400, "certificate_base64 is required");
    const cert = Buffer.from(body.certificate_base64, "base64");
    if (cert.length > WEB_MAX_CERTIFICATE_BYTES) throw new HttpError(413, `certificate exceeds the web limit of ${WEB_MAX_CERTIFICATE_BYTES} bytes`);
    const csv = typeof body.delivery_csv === "string" ? Buffer.from(body.delivery_csv, "utf8") : null;
    if (csv && csv.length > WEB_MAX_DELIVERY_BYTES) throw new HttpError(413, `delivery note exceeds ${WEB_MAX_DELIVERY_BYTES} bytes`);
    const line = typeof body.delivery_line === "string" ? body.delivery_line : null;
    // 2. Access code, if configured, with its own failure throttle (S2-17, B-04).
    if (cfg.liveAccessCode !== null && !codeMatches(body.access_code, cfg.liveAccessCode)) {
      const t = codeFailures.tryConsume();
      if (!t.ok) throw new HttpError(429, "too many wrong access codes this hour", { reopens_at: t.reopens_at });
      throw new HttpError(403, "wrong or missing access code; no live reading was used");
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

  async function storyEvaluate(id: string, body: Record<string, unknown>) {
    if (!(STORY_IDS as readonly string[]).includes(id)) throw new HttpError(404, "unknown story");
    const now = clock().toISOString();
    const by = typeof body.confirmed_by === "string" ? body.confirmed_by.trim() : "";
    const confirmations = parseConfirmations(body.confirmations, by, now);
    const readings = await readCase(loadDatasetCase(id, getShared()));
    let r = evaluateCase(readings, confirmations);
    const d = body.decision as Record<string, unknown> | undefined;
    if (d) {
      r = recordHumanDecision(r, {
        action: String(d.action) as HumanAction, reason: typeof d.reason === "string" ? d.reason : "",
        decided_by: typeof d.decided_by === "string" ? d.decided_by : "", decided_at: now, // server time (B-15)
      });
    }
    const out = viewJson(r);
    return { ...out, note: `stored mock reading of ${id}, re-evaluated by the server at ${now} with the confirmations and decision given` };
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
        return send(res, 200, { status: "ok", mode: getMode(env), reader: "no model in this build", notice: "All data is fictitious." }, NO_STORE);
      }
      if (m === "GET" && p === "/api/f1") return send(res, 200, await probeF1(cfg, clock, lastLive), NO_STORE);
      if (m === "GET" && p === "/api/live/status") return send(res, 200, liveStatus(), NO_STORE);
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
      if (e instanceof CaseInputError || e instanceof InputRejected || e instanceof DeliveryNoteError || e instanceof ConfirmationError) {
        return send(res, 400, { status: "rejected", code: (e as InputRejected).code ?? e.name, error: e.message }, NO_STORE);
      }
      if (e instanceof HumanDecisionError) return send(res, 409, { status: "rejected", error: e.message }, NO_STORE);
      return send(res, 500, { status: "internal_error", error: "internal error" }, NO_STORE);
    }
  };
}
