# Source: Vercel request headers (per-client key, J-01/H-02)

Retrieved by the auditor on 2026-10-14 from https://vercel.com/docs/headers/request-headers (page `last_updated: 2025-12-13`).

- `x-forwarded-for`: "The public IP address of the client that made the request. If you are trying to use Vercel
  behind a proxy, we currently overwrite the `X-Forwarded-For` header and **do not forward external IPs**. This
  restriction is in place to prevent IP spoofing." A custom `X-Forwarded-For` IP is honoured only with a Trusted Proxy,
  which is "available on Enterprise plans".
- `x-real-ip`: "This header is identical to the `x-forwarded-for` header."

**Consequence for candidate `bec22567`:** `clientKey()` in `src/web/app.ts` hashes the first hop of
`x-forwarded-for`, else `x-real-ip`. On this Hobby project a client cannot spoof that value, so it cannot rotate
per-client keys to reach the global ceiling. The residual risk is about ten real client addresses. A visitor sending
wrong codes from that many addresses can still exhaust the global ceiling of 10 × the per-client limit, as H-02
accepts. DEPLOY.md states how the human clears it.
