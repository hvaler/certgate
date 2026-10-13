// F1 "Runs on AMD" panel data (S2-11, S2-12, S3-08..S3-12, R3.1 C-06). Every value is read from the configured
// endpoint: the model list (GET /models), the key's usage and limits (GET /usage), and the last reading's reply
// (model, usage, X-RateLimit headers). GPU, ROCm and vLLM versions are not exposed by AMD Token Factory and are
// shown as such, never filled from code. Probes are cached server-side for at least 60 s, because every call to
// the endpoint counts in the shared per-key budget. URLs come only from server configuration (B-06).
import { Dec, parseDecimal } from "../decimal.js";
import { COST_LABEL } from "../pipeline.js";
import type { F1Snapshot } from "../types.js";
import type { WebConfig } from "./config.js";
import { F1_PROBE_TIMEOUT_MS } from "./limits.js";
import type { LiveCallInfo } from "./live-reader.js";

export const NOT_EXPOSED = "not exposed by the endpoint";
/** Cited fact (dispatch 2, event page): the endpoint is AMD Token Factory. Not a measurement. */
export const ENDPOINT_NAME = "AMD Token Factory";
export const ENDPOINT_SOURCE = "https://notebooks.amd.com/tokenfactory (event page: \"The event is hosted on notebooks.amd.com/tokenfactory.\")";
export const F1_CACHE_MS = 60_000;

interface Probe {
  at: number;
  checked_at: string;
  ok: boolean;
  detail: string;
  model_ids: string[];
  latency_ms: string | null;
  usage: Record<string, string | null>;
}

// Server-side cache of the last probe per base URL (C-06). Per instance, like the live-read counter.
const cache = new Map<string, Probe>();
// Probes in flight per base URL: concurrent requests share one upstream probe instead of each starting one.
const pending = new Map<string, Promise<Probe>>();
let upstreamCalls = 0;
/** Number of upstream probe calls made by this process (tests assert the cache). */
export const f1UpstreamCalls = () => upstreamCalls;
export function clearF1Cache() { cache.clear(); pending.clear(); }

const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" && v.length <= 200 ? v : null);

/** Exact numeric text of a top-level JSON field, read from the raw body (no float round trip). */
function rawField(body: string, key: string): string | null {
  const m = new RegExp(`"${key}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`).exec(body);
  return m ? m[1]! : null;
}

async function get(url: string, key: string | null): Promise<{ status: number; text: string; ms: number }> {
  upstreamCalls++;
  const t0 = Date.now();
  const res = await fetch(url, { headers: key ? { authorization: `Bearer ${key}` } : {}, signal: AbortSignal.timeout(F1_PROBE_TIMEOUT_MS) });
  const text = await res.text();
  if (text.length > 512 * 1024) throw new Error("response too large");
  return { status: res.status, text, ms: Date.now() - t0 };
}

async function probe(cfg: WebConfig, clock: () => Date): Promise<Probe> {
  const now = clock();
  const hit = cache.get(cfg.modelBaseUrl!);
  if (hit && now.getTime() - hit.at < F1_CACHE_MS) return hit;
  const inFlight = pending.get(cfg.modelBaseUrl!);
  if (inFlight) return { ...(await inFlight) };
  const fresh = probeUpstream(cfg, now);
  pending.set(cfg.modelBaseUrl!, fresh);
  try {
    const p = await fresh;
    cache.set(cfg.modelBaseUrl!, p);
    return { ...p, at: -1 };
  } finally {
    pending.delete(cfg.modelBaseUrl!);
  }
}

async function probeUpstream(cfg: WebConfig, now: Date): Promise<Probe> {
  const p: Probe = { at: now.getTime(), checked_at: now.toISOString(), ok: false, detail: "endpoint unreachable", model_ids: [], latency_ms: null, usage: {} };
  try {
    const models = await get(`${cfg.modelBaseUrl}/models`, cfg.modelApiKey);
    if (models.status === 200) {
      const doc = JSON.parse(models.text) as { data?: { id?: unknown }[] };
      p.model_ids = (doc.data ?? []).map((m) => str(m.id)).filter((m): m is string => m !== null);
      p.latency_ms = String(models.ms);
      p.ok = true;
      p.detail = "read from the configured endpoint";
    } else {
      p.detail = `endpoint answered ${models.status} to GET /models`;
    }
  } catch {
    p.detail = "endpoint unreachable";
  }
  if (p.ok) {
    try {
      const usage = await get(`${cfg.modelBaseUrl}/usage`, cfg.modelApiKey);
      if (usage.status === 200) {
        p.usage = {
          rpm_limit: rawField(usage.text, "rpm_limit"),
          daily_cost_limit_usd: rawField(usage.text, "daily_cost_limit_usd"),
          daily_cost_used_usd: rawField(usage.text, "daily_cost_used_usd"),
          daily_cost_remaining_usd: rawField(usage.text, "daily_cost_remaining_usd"),
        };
      }
    } catch {
      // Usage unknown; the endpoint itself answered.
    }
  }
  return p;
}

/** Tokens per second = completion tokens / measured reading time (S3-08). Unknown if either is missing. */
export function tokensPerSecond(tokens: string | null, elapsedMs: string | null): string | null {
  const t = parseDecimal(tokens);
  const ms = parseDecimal(elapsedMs);
  if (t === null || ms === null || ms.lte(0)) return null;
  return t.div(ms.div(new Dec(1000))).toDecimalPlaces(2).toString();
}

export async function probeF1(cfg: WebConfig, clock: () => Date, last: LiveCallInfo | null = null): Promise<F1Snapshot> {
  const off = (checkedAt: string, detail: string): F1Snapshot => ({
    state: "off", checked_at: checkedAt, detail, endpoint_name: null, endpoint_source: null,
    endpoint_host: cfg.modelBaseUrl ? new URL(cfg.modelBaseUrl).host : null, model_ids: [], model_reported: null,
    gpu: null, rocm_version: null, vllm_version: null, latency_ms: null, last_reading_ms: null, completion_tokens: null,
    total_tokens: null, tokens_per_second: null, cost_reported: null, cost_label: COST_LABEL, rate_limit_rpm: null,
    rate_limit_rpm_remaining: null, daily_spend_limit: null, daily_spend_used: null, daily_spend_remaining: null,
    usage_source: null, probe_cached: false,
  });
  if (!cfg.modelBaseUrl) return off(clock().toISOString(), "no endpoint configured");
  const p = await probe(cfg, clock);
  if (!p.ok) return { ...off(p.checked_at, p.detail), probe_cached: p.at !== -1 };
  const rl = last?.rate_limit ?? {};
  return {
    state: "on", checked_at: p.checked_at, detail: p.detail,
    endpoint_name: ENDPOINT_NAME, endpoint_source: ENDPOINT_SOURCE, endpoint_host: new URL(cfg.modelBaseUrl).host,
    model_ids: p.model_ids, model_reported: last?.model_reported ?? null,
    gpu: NOT_EXPOSED, rocm_version: NOT_EXPOSED, vllm_version: NOT_EXPOSED,
    latency_ms: p.latency_ms, last_reading_ms: last?.elapsed_ms ?? null,
    completion_tokens: last?.completion_tokens ?? null, total_tokens: last?.total_tokens ?? null,
    tokens_per_second: last ? tokensPerSecond(last.completion_tokens, last.elapsed_ms) : null,
    cost_reported: last?.cost_reported ?? null, cost_label: COST_LABEL,
    rate_limit_rpm: rl["x-ratelimit-limit-user-rpm"] ?? p.usage.rpm_limit ?? null,
    rate_limit_rpm_remaining: rl["x-ratelimit-remaining-user-rpm"] ?? null,
    daily_spend_limit: rl["x-ratelimit-limit-user-daily-usd"] ?? p.usage.daily_cost_limit_usd ?? null,
    daily_spend_used: rl["x-ratelimit-used-user-daily-usd"] ?? p.usage.daily_cost_used_usd ?? null,
    daily_spend_remaining: rl["x-ratelimit-remaining-user-daily-usd"] ?? p.usage.daily_cost_remaining_usd ?? null,
    usage_source: last && Object.keys(rl).length > 0 ? "X-RateLimit headers of the last reading" : Object.keys(p.usage).length > 0 ? "GET /usage" : null,
    probe_cached: p.at !== -1,
  };
}
