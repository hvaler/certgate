# The shared store for live reading: Upstash Redis REST API (Stage 6, S6-04)

Recorded from the providers' own pages and package, not from memory. The band never sees the store's values.

| Item | Value | Source |
|---|---|---|
| Store | Upstash Redis, connected to the Vercel project from the Vercel Marketplace by the human (plan Free, region iad1, default variable names; operator update, `evidence/runs/certgate-001/stage-6/OPERATOR-STORE-CONNECTED.txt`) | https://vercel.com/marketplace/upstash, retrieved 2026-10-14 |
| How Vercel connects it | "Have credentials and environment variables injected into your Vercel project." (the page does not list the names) | https://vercel.com/docs/redis (last_updated 2026-01-13), retrieved 2026-10-14 |
| Variable names read by CertGate | `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, or the fallback `KV_REST_API_URL` and `KV_REST_API_TOKEN`; `KV_REST_API_READ_ONLY_TOKEN` is never read | the same order as Upstash's own client: in `@upstash/redis` 1.39.0, `Redis.fromEnv()` is documented as "URL: `UPSTASH_REDIS_REST_URL` or fallback to `KV_REST_API_URL` … Token: `UPSTASH_REDIS_REST_TOKEN` or fallback to `KV_REST_API_TOKEN` … compatibility with Vercel KV" (npm package `@upstash/redis@1.39.0`, file `nodejs.js`, retrieved 2026-10-14; CertGate does not use this package, it only follows its names) |
| One command | POST the command as a JSON array to the REST URL, header `Authorization: Bearer $TOKEN`; the reply is `{"result": …}` or `{"error": …}` ("POST Command in Body", "Response") | https://upstash.com/docs/redis/features/restapi, retrieved 2026-10-14 |
| Atomic group of commands | "Upstash REST API supports transactions to execute multiple commands atomically." "API endpoint for transaction is `/multi-exec`." The body is "a two dimensional JSON array"; "Each item in the response array corresponds to the command in the same order within the transaction." ("Transactions") | same page |
| Scripting (`EVAL`) | listed as supported in "REST - Redis API Compatibility"; CertGate uses one script, the compare-and-delete of a slot lease | same page |
| Free plan | "500K" monthly commands; max request size 10MB; max record size 100MB; data size 256MB (comparison table) or 250 MB (plan card and FAQ); monthly bandwidth 10 GB. The page does not say what happens on the Free plan when the quota is used up | https://upstash.com/pricing/redis, retrieved 2026-10-14 |

What CertGate stores (all keys prefixed `certgate:live:`): job records (TTL 3600 s, no code, no key, no
certificate bytes), the queue, two slot leases (TTL 310 s), the hourly reading count and the hourly failed-code
counts (TTL 7200 s), and the F1 snapshot (TTL 60 s). See DEPLOY.md, section 4, for the command count per reading.
