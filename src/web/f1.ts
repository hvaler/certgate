// F1 "Runs on AMD" panel data (S2-11, S2-12, S2-36). Every value is read from the configured endpoint at
// check time; nothing is typed by hand. With no endpoint configured, or an unreachable one, the state is
// "off" with the real time of the check. URLs come only from server configuration (B-06).
import { parseDecimal } from "../decimal.js";
import type { F1Snapshot } from "../types.js";
import type { WebConfig } from "./config.js";
import { F1_PROBE_TIMEOUT_MS } from "./limits.js";

const off = (checkedAt: Date, detail: string): F1Snapshot => ({
  state: "off", checked_at: checkedAt.toISOString(), detail, model_ids: [], gpu: null, rocm_version: null,
  vllm_version: null, latency_ms: null, tokens_per_second: null, cost_estimate_usd: null,
});

const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" && v.length <= 200 ? v : null);

async function getJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(F1_PROBE_TIMEOUT_MS) });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.length > 256 * 1024) throw new Error("response too large");
  return JSON.parse(text);
}

/** Cost of one reading: elapsed time x configured GPU price per hour. Unknown without a configured price. */
export function costEstimate(elapsedMs: string | null, pricePerHour: string | null): string | null {
  const ms = parseDecimal(elapsedMs);
  const price = parseDecimal(pricePerHour);
  if (ms === null || price === null) return null;
  return ms.div(3_600_000).times(price).toDecimalPlaces(6).toString();
}

export function tokensPerSecond(tokens: string | null, elapsedMs: string | null): string | null {
  const t = parseDecimal(tokens);
  const ms = parseDecimal(elapsedMs);
  if (t === null || ms === null || ms.lte(0)) return null;
  return t.div(ms.div(1000)).toDecimalPlaces(2).toString();
}

export async function probeF1(
  cfg: WebConfig,
  clock: () => Date,
  lastReading: { completion_tokens: string | null; elapsed_ms: string } | null = null,
): Promise<F1Snapshot> {
  const checkedAt = clock();
  if (!cfg.modelBaseUrl) return off(checkedAt, "no endpoint configured");
  const headers: Record<string, string> = cfg.modelApiKey ? { authorization: `Bearer ${cfg.modelApiKey}` } : {};
  const t0 = Date.now();
  let models: string[];
  try {
    const doc = (await getJson(`${cfg.modelBaseUrl}/v1/models`, headers)) as { data?: { id?: unknown }[] };
    models = (doc.data ?? []).map((m) => str(m.id)).filter((m): m is string => m !== null);
  } catch {
    return off(checkedAt, "endpoint unreachable");
  }
  const latency = String(Date.now() - t0);
  let gpu: string | null = null;
  let rocm: string | null = null;
  let vllm: string | null = null;
  if (cfg.gpuInfoUrl) {
    try {
      const info = (await getJson(cfg.gpuInfoUrl, {})) as Record<string, unknown>;
      gpu = str(info.gpu);
      rocm = str(info.rocm_version);
      vllm = str(info.vllm_version);
    } catch {
      // Sidecar down: GPU and ROCm stay unknown; the endpoint itself answered.
    }
  }
  return {
    state: "on", checked_at: checkedAt.toISOString(), detail: "read from the configured endpoint",
    model_ids: models, gpu, rocm_version: rocm, vllm_version: vllm, latency_ms: latency,
    tokens_per_second: lastReading ? tokensPerSecond(lastReading.completion_tokens, lastReading.elapsed_ms) : null,
    cost_estimate_usd: lastReading ? costEstimate(lastReading.elapsed_ms, cfg.gpuCostPerHour) : null,
  };
}
