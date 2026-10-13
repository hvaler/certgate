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
