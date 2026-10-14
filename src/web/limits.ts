// Limits designed for the Vercel function limits recorded in docs/sources/vercel-limits.md (S2-22, B-18).

/** Vercel request/response body limit (4.5 MB), as recorded. */
export const VERCEL_BODY_LIMIT_BYTES = 4_500_000;
/** Vercel function duration on the lowest plan (300 s), as recorded. */
export const VERCEL_MAX_DURATION_MS = 300_000;

/** Web upload: the PDF travels base64-encoded in JSON (x 4/3), so 3 MiB of PDF is 4 MiB of base64. */
export const WEB_MAX_CERTIFICATE_BYTES = 3 * 1024 * 1024;
export const WEB_MAX_DELIVERY_BYTES = 256 * 1024;
/** Request bodies above this are rejected with 413 before parsing; stays below the Vercel limit. */
export const WEB_MAX_REQUEST_BYTES = 4_400_000;

/** Live adapter calling discipline (dispatch 2, S3-02): client timeout 300 s, at most 3 attempts, 2 in flight. */
export const ADAPTER_ATTEMPT_TIMEOUT_MS = 300_000;
export const ADAPTER_MAX_ATTEMPTS = 3;
export const ADAPTER_MAX_IN_FLIGHT = 2;
/** Reasoning tokens count toward max_tokens (S3-03): leave room for reasoning and the JSON reading. */
export const ADAPTER_MAX_TOKENS = 16_384;
export const ADAPTER_MAX_RESPONSE_BYTES = 1024 * 1024;
/** F1 probe timeout: the panel must answer quickly even when the endpoint hangs. */
export const F1_PROBE_TIMEOUT_MS = 3_000;
/** Retry backoff of the live adapter: base and cap (Retry-After is honoured when larger, up to the cap). */
export const ADAPTER_BACKOFF_BASE_MS = 2_000;
export const ADAPTER_BACKOFF_CAP_MS = 120_000;

/**
 * Worst-case time of one live reading (S3-24, C-07): every attempt runs to the client timeout and every wait
 * between attempts reaches the cap. 3 x 300 s + 2 x 120 s = 1140 s, above the 300 s Vercel function duration,
 * so live reading is unavailable on the deployed site and is demonstrated from the container.
 */
export const LIVE_WORST_CASE_MS = ADAPTER_ATTEMPT_TIMEOUT_MS * ADAPTER_MAX_ATTEMPTS + ADAPTER_BACKOFF_CAP_MS * (ADAPTER_MAX_ATTEMPTS - 1);
export const LIVE_FITS_DEPLOYED_FUNCTION = LIVE_WORST_CASE_MS < VERCEL_MAX_DURATION_MS;
export const DEPLOYED_LIVE_UNAVAILABLE = "live reading unavailable on the deployed site; live demonstration from the container";

/**
 * Stage 6 live-reading budget on the deployed site (S6-03, CH6-05, T6-06). The reading runs in the POST invocation
 * after the response (waitUntil), so queue wait + reading (render, attempts and any retry of the D2 discipline)
 * + the final store writes must fit the function duration with a margin of at least 30 s.
 */
export const DEPLOYED_LIVE_BUDGET = {
  /** A job still queued after this fails as "timed out in queue". */
  queueMaxWaitMs: 60_000,
  /** Time left for the reading once a slot is taken; the LiveReader's attempt timeout never exceeds it. */
  readBudgetMs: 210_000,
  /** Kept free for the final store writes. */
  marginMs: 30_000,
  /** From admission: queue wait + reading budget. A poll after deadline + staleGraceMs reports the job as timed out. */
  deadlineMs: 270_000,
  staleGraceMs: 10_000,
  /** In-flight slot lease: at least the deadline, and it outlives the function (J-03: 310 s), so a crashed holder frees it. */
  leaseTtlMs: 310_000,
  /** At most 2 readings in flight (D2 calling discipline) and at most 2 jobs waiting behind them. */
  slots: 2,
  maxWaiting: 2,
  /** How often a waiting job looks for a free slot (J-05: at most once per 2 s). */
  pollMs: 2_000,
} as const;

/** The container has no function limit: the D2 worst case of one reading, after a longer queue wait. */
export const CONTAINER_LIVE_BUDGET = {
  queueMaxWaitMs: 120_000,
  readBudgetMs: LIVE_WORST_CASE_MS,
  marginMs: 0,
  deadlineMs: 120_000 + LIVE_WORST_CASE_MS,
  staleGraceMs: 10_000,
  leaseTtlMs: 120_000 + LIVE_WORST_CASE_MS + 30_000,
  slots: 2,
  maxWaiting: 2,
  pollMs: 2_000,
} as const;

export type LiveBudget = { [K in keyof typeof DEPLOYED_LIVE_BUDGET]: number };
