// Web configuration, from environment variables only (I6). Every variable is listed without a value in
// .env.example. Secrets (MODEL_API_KEY, LIVE_ACCESS_CODE) never leave the server.

export interface WebConfig {
  /** Base URL of the OpenAI-compatible endpoint (vLLM). No default: unset means "endpoint off". */
  modelBaseUrl: string | null;
  modelApiKey: string | null;
  modelId: string | null;
  /** Small sidecar route next to vLLM that reports GPU and ROCm (S2-11). */
  gpuInfoUrl: string | null;
  /** Configured GPU price in USD per hour, as a decimal string (S2-36). Unset means cost "unknown". */
  gpuCostPerHour: string | null;
  /** Live readings per UTC hour; unset, invalid or 0 disables live reading (S2-16, fail closed). */
  liveReadsPerHour: number;
  liveAccessCode: string | null;
  /** Failed access-code attempts allowed per UTC hour before rejection (B-04). Default 5. */
  liveCodeFailuresPerHour: number;
  /** Announced live windows, free text shown as is (D2-07). */
  liveWindows: string | null;
}

const nonEmpty = (v: string | undefined) => (v === undefined || v.trim() === "" ? null : v.trim());

function count(v: string | undefined, fallback: number): number {
  const s = (v ?? "").trim();
  if (s === "") return fallback;
  return /^\d{1,6}$/.test(s) ? Number.parseInt(s, 10) : 0;
}

export function loadWebConfig(env: NodeJS.ProcessEnv = process.env): WebConfig {
  return {
    modelBaseUrl: nonEmpty(env.MODEL_BASE_URL)?.replace(/\/+$/, "") ?? null,
    modelApiKey: nonEmpty(env.MODEL_API_KEY),
    modelId: nonEmpty(env.MODEL_ID),
    gpuInfoUrl: nonEmpty(env.GPU_INFO_URL),
    gpuCostPerHour: nonEmpty(env.GPU_COST_PER_HOUR),
    liveReadsPerHour: count(env.LIVE_READS_PER_HOUR, 0),
    liveAccessCode: nonEmpty(env.LIVE_ACCESS_CODE),
    liveCodeFailuresPerHour: count(env.LIVE_CODE_FAILURES_PER_HOUR, 5),
    liveWindows: nonEmpty(env.LIVE_WINDOWS),
  };
}
