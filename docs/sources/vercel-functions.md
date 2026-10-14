# Work after the response on Vercel: waitUntil, and Secret variables (Stage 6, S6-03, S6-04)

Recorded from Vercel's own pages, not from memory.

| Item | Quote | Source |
|---|---|---|
| `waitUntil` | "Extends the lifetime of the request handler for the lifetime of the given Promise. The `waitUntil()` method enqueues an asynchronous task to be performed during the lifecycle of the request. … `waitUntil()` is available in Node.js and in the Edge Runtime." | https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package (last_updated 2026-09-03), retrieved 2026-10-14 |
| Its time limit | "Promises passed to `waitUntil()` will have the same timeout as the function itself. If the function times out, the promises will be cancelled." | same page |
| The package | `@vercel/functions` (import `{ waitUntil } from '@vercel/functions'`). CertGate pins `@vercel/functions@3.10.1` (licence Apache-2.0), which depends on `@vercel/oidc@4.0.1` (licence Apache-2.0); the lockfile adds 25 packages in all. It is imported only by `api/index.ts`, the Vercel function entry, and only `waitUntil` is used | npm registry metadata (`npm view @vercel/functions version license dependencies`), retrieved 2026-10-14; `node_modules/@vercel/functions/LICENSE` |
| The function limit | `maxDuration` 300 s on Hobby ([vercel-limits.md](vercel-limits.md)); the job budget fits it with 30 s to spare (`DEPLOYED_LIVE_BUDGET` in `src/web/limits.ts`) | – |
| Secret variables | "**Secret** values are write-only after saving. Use them for passwords, API keys, and tokens." To create one: "Choose **Config** or **Secret** under **Type**." | https://vercel.com/docs/environment-variables/sensitive-environment-variables (last_updated 2026-08-28), retrieved 2026-10-14 |
| Integration variables | "Environment variables created by integrations can't be changed to Secret from the environment variables list." To store them as Secrets: disconnect the resource, rotate its secrets, reconnect it with **Development** deselected and **Sensitive** enabled in the advanced options, and redeploy | same page, section "Sensitive environment variables for integrations" |
