// Web configuration, from environment variables only (I6). Every variable is listed without a value in
// .env.example. Secrets (MODEL_API_KEY, LIVE_ACCESS_CODE) never leave the server.

export interface WebConfig {
  /** Base URL of the OpenAI-compatible endpoint (AMD Token Factory). No default: unset means "endpoint off". */
  modelBaseUrl: string | null;
  modelApiKey: string | null;
  modelId: string | null;
  /** Live readings per UTC hour; unset, invalid or 0 disables live reading (S2-16, fail closed). */
  liveReadsPerHour: number;
  liveAccessCode: string | null;
  /** Failed access-code attempts allowed per UTC hour before rejection (B-04). Default 5. */
  liveCodeFailuresPerHour: number;
  /** Announced live windows, free text shown as is (D2-07). */
  liveWindows: string | null;
  /**
   * Running as the deployed Vercel function (Vercel sets VERCEL=1). The live path's time budget does not fit the
   * function duration there (S3-24, C-07), so live reading is unavailable on the deployed site.
   */
  deployedSite: boolean;
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
    liveReadsPerHour: count(env.LIVE_READS_PER_HOUR, 0),
    liveAccessCode: nonEmpty(env.LIVE_ACCESS_CODE),
    liveCodeFailuresPerHour: count(env.LIVE_CODE_FAILURES_PER_HOUR, 5),
    liveWindows: nonEmpty(env.LIVE_WINDOWS),
    deployedSite: nonEmpty(env.VERCEL) !== null,
  };
}
