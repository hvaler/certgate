# Source: Vercel request headers (per-client key, R6.4 K-01)

**Source:** https://vercel.com/docs/headers/request-headers (page front matter `last_updated: 2025-12-13`), retrieved
by implementer-xwz4 on **2026-10-14 at ~17:18Z**. The auditor read the same page earlier the same day
(`evidence/runs/certgate-001/stage-6/auditor/candidate-1/vercel-xff-source.md`).

The page lists these three client-address headers in this order. The quotes are verbatim:

1. **`x-forwarded-for`:** "The public IP address of the client that made the request." "If you are trying to use
   Vercel behind a proxy, we currently overwrite the `X-Forwarded-For` header and **do not forward external IPs**.
   This restriction is in place to prevent IP spoofing." Under "Custom `X-Forwarded-For` IP": "Trusted Proxy is
   available on Enterprise plans" … "Enterprise customers can purchase and enable a trusted proxy to allow your
   custom `X-Forwarded-For` IP."
2. **`x-vercel-forwarded-for`:** "This header is identical to the `x-forwarded-for` header. However,
   `x-forwarded-for` could be overwritten if you're using a proxy on top of Vercel."
3. **`x-real-ip`:** "This header is identical to the `x-forwarded-for` header."

## What CertGate derives from it (`src/web/app.ts`, `clientKey()`)

On the deployed site (`VERCEL=1`), the per-client key is a hash of **`x-vercel-forwarded-for` only**: the first 32 hex
characters of SHA-256. The address itself is never stored.

`x-forwarded-for` and `x-real-ip` are never read, for these reasons:
- Vercel's statement about `x-forwarded-for` is qualified twice. It says Vercel "currently" overwrites it, and that a
  Trusted Proxy lets a custom value through.
- The `x-vercel-forwarded-for` entry says that `x-forwarded-for` "could be overwritten" by a proxy in front of Vercel.
- `x-real-ip` is documented only as "identical to" `x-forwarded-for`, with no guarantee of its own.

`x-vercel-forwarded-for` is the only header the page sets apart as unaffected by a proxy in front of Vercel. CertGate
treats it as the platform-guaranteed value. A request without it on the deployed site gets one shared key
(`no-platform-client-address`), so a missing header can never yield a fresh per-client budget: the failure is closed.

In the container (no `VERCEL`), no header is trusted. The key is a hash of the socket's remote address.

The test "K-01: rotating a client-set X-Forwarded-For and X-Real-IP while the platform header stays fixed still hits
the per-client limit" in `test/stage6-live.test.ts` checks this.
