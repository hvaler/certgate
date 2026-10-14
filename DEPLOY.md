# Deploying CertGate on Vercel (for the human)

The band does not deploy and holds no Vercel, GitHub or store credentials; the human does this. Deploy the accepted
commit named in the room. Judge mode works with no configuration: three recorded real readings, the case files,
human confirmation and decision, the receipts, and the landing figures. Live reading on the deployed site is the
extra: it is enabled only when the access code, the shared store, the hourly limit and the model endpoint are all
configured (sections 3 and 4). Without them the site behaves exactly as the Stage 5 site, and makes no model call.

## 1. Project settings

| Setting | Value |
|---|---|
| Framework preset | Other |
| Root directory | the repository root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `public`, already set in `vercel.json` (`"outputDirectory": "public"`) |
| Node.js version | 24.x (`package.json` `engines.node` is `>=24`) |
| Function | `api/index.ts`, configured in `vercel.json`; the `/api/*` and `/health` rewrites are in `vercel.json` too |

## 2. Function duration

- Set the **maximum duration to 300 seconds**. `vercel.json` already does it: `"maxDuration": 300` for
  `api/index.ts`. Do not lower it.
- 300 s is the default and maximum of the **Hobby** plan, and the default of the Pro plan, as quoted in
  [docs/sources/vercel-limits.md](docs/sources/vercel-limits.md):
  - "Hobby 300s (5 minutes) 300s (5 minutes)";
  - source https://vercel.com/docs/functions/limitations, retrieved 2026-10-12.
- A live reading runs as a job inside that limit (`DEPLOYED_LIVE_BUDGET` in `src/web/limits.ts`): at most 60 s
  waiting for a reading slot, at most 210 s reading (rendering, attempts and retries included), and 30 s kept
  free. The job keeps running after the first answer through Vercel's `waitUntil`
  ([docs/sources/vercel-functions.md](docs/sources/vercel-functions.md)).

## 3. The shared store (done by the human on 2026-10-14, about 12:55Z)

Live reading needs one store shared by all function instances, for the queue and the limits. Connect **Upstash for
Redis** from the Vercel Marketplace to the project ([docs/sources/upstash-redis.md](docs/sources/upstash-redis.md)).
In the Vercel project's Environment Variables page, check that **one** of these pairs is present:
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, or `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
CertGate reads the first pair, else the second. It never reads `KV_REST_API_READ_ONLY_TOKEN`.

The Upstash Free plan allows 500K commands per month ([docs/sources/upstash-redis.md](docs/sources/upstash-redis.md)).
One live reading costs about 40 to 60 store commands: about 15 for admission and the code check, one slot attempt
every 2 s while it waits, and one poll every 2 s from the browser while it reads. A judge's reading of 35 s is
about 40 commands. If the store refuses or cannot be reached, live reading is refused with
"the shared store is unavailable; live reading refused"; it never falls back to anything else.

## 4. Environment variables (names only; never write a value anywhere)

Mark every variable marked "secret" below as **Secret** when you add it ("Choose **Config** or **Secret** under
**Type**", [docs/sources/vercel-functions.md](docs/sources/vercel-functions.md)). The store variables were created
by the integration and cannot be changed to Secret from the list: to make them Secret, reconnect the store with
Development deselected and Sensitive enabled, as that page describes, then redeploy.

| Variable | On Vercel | Secret | Why |
|---|---|---|---|
| `MODEL_BASE_URL` | set: the AMD Token Factory base URL, including `/v1` | yes | the endpoint of live reading, read only on the server |
| `MODEL_API_KEY` | set: the team's Token Factory key | yes | sent only from the server to the endpoint; never to the browser |
| `MODEL_ID` | set: `Gemma-4-31B-IT` | no | the live model of the deployed site (dispatch 4). To switch back to Qwen, set it to `Qwen3.8-27B` and redeploy; no code changes. Do that if Gemma returns unusable readings again, as on 2026-10-13 |
| `LIVE_ACCESS_CODE` | set: a code you choose and give to the judges | yes | mandatory: without it live reading stays off on the deployed site |
| `LIVE_READS_PER_HOUR` | set: `20` | no | the global hourly limit of live readings, counted in the shared store across all instances |
| `LIVE_CODE_FAILURES_PER_HOUR` | optional, default `5` | no | wrong codes allowed per client per UTC hour; all clients together are allowed 10 times as many (section 6) |
| `UPSTASH_REDIS_REST_URL` | set by the store integration | no | the store's REST URL (or `KV_REST_API_URL`) |
| `UPSTASH_REDIS_REST_TOKEN` | set by the store integration | yes | the store's token (or `KV_REST_API_TOKEN`) |
| `KV_REST_API_URL` | set by the store integration, if it uses these names | no | the fallback name of the REST URL |
| `KV_REST_API_TOKEN` | set by the store integration, if it uses these names | yes | the fallback name of the token |
| `LIVE_WINDOWS` | optional | no | free text shown on the landing |
| `CERTGATE_MODE` | leave unset (`mock`) | no | dataset API only |
| `CERTGATE_DATA_DIR` | leave unset | no | the function bundles `data/` (`includeFiles` in `vercel.json`) |
| `PORT` | leave unset | no | not used by the Vercel function |
| `VERCEL` | **set by Vercel itself**; never set or remove it | no | it selects the deployed-site rules: the access code and the shared store are required |

The landing figures and the three recorded readings stay Qwen3.8-27B, whatever `MODEL_ID` says: they come from
the committed evaluation runs. A live reading names the model the endpoint reports, in its receipt.

## 5. Checks after deploying

Replace `<site>` with the deployment URL. Each check states its expected result. The checks marked "code" need
the access code; type it in place of `<code>` in your own terminal and do not paste it anywhere else.

```sh
curl -s https://<site>/health                     # 200, "status": "ok", "reader": "live"
curl -s https://<site>/api/f1                     # 200, "state": "on", the model list of the endpoint
curl -s https://<site>/api/live/status            # 200, "enabled": true, "access_code_required": true, "used_this_hour" and "in_flight" counts
curl -s -o /dev/null -w "%{http_code}\n" https://<site>/stories/cg-003.json            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://<site>/figures.json                   # 200
curl -s -X POST -H "content-type: application/json" -d '{}' https://<site>/api/stories/cg-003/evaluate   # 200, "proposal": "block"
curl -s -o cg-004.pdf https://<site>/api/samples/cg-004/certificate.pdf               # the sample certificate
curl -s -X POST -H "content-type: application/json" -d "{\"certificate_base64\":\"$(base64 -w0 cg-004.pdf)\",\"synthetic_confirmed\":true}" https://<site>/api/live/jobs   # 403, no code
```

Then one real live reading, in a browser: open the site, go to "Read a certificate live", download the sample
cg-004 certificate and its delivery note, choose them, give line 1 and the access code, tick the notice and press
"Read live". The page shows "Queued", then "Reading at AMD Token Factory" with the seconds so far, then opens the
case file. Its receipt names the model as reported by the endpoint, with the endpoint snapshot taken at reading
time.

If live reading is not configured completely, the site answers exactly as before Stage 6: `/api/live/status` shows
"enabled": false with "live reading unavailable on the deployed site; live demonstration from the container",
`/api/live/read` and `/api/live/jobs` answer 503, and the server log names what is missing (no values).

## 6. Wrong codes, and clearing a lockout

Every attempt with a code counts first, and a correct code is given back at once. A client (identified by a hash
of its address) is refused for the rest of the UTC hour after `LIVE_CODE_FAILURES_PER_HOUR` wrong codes (default 5).
All clients together are refused after 10 times that number (default 50). To clear a lockout before the hour ends,
delete the keys `certgate:live:codefail:g:<hour>` (all clients) or `certgate:live:codefail:c:<hash>:<hour>` (one
client) in the Upstash console, where `<hour>` is the UTC hour as `YYYY-MM-DDTHH`; or wait for the next UTC hour.

Then report in the room that the deployment is done, so that the auditor can run its checks.

Known cosmetic issue: `/favicon.ico` answers 404.
