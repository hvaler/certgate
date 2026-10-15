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
| `MODEL_ID` | set: `Qwen3.8-27B` | no | the live model of the deployed site. From dispatch 4 it was `Gemma-4-31B-IT`, which read live on 2026-10-14; on 2026-10-15 it failed with HTTP 5xx at 05:15 UTC and by 18:23 UTC Token Factory no longer listed it and refused it (HTTP 4xx), so the operator set `Qwen3.8-27B` and redeployed, with no code changes. From Stage 8 it is the default choice on the live screen when the endpoint lists it |
| `LIVE_MODELS` | set: `Qwen3.8-27B,Gemma-4-31B-IT,DeepSeek-V4.1-Flash,DeepSeek-V4-Flash-Vision-Exp,MiMo-V2.6-Flash,Qwen3.8-Flash-Next` | no | the models a judge may choose for a live reading (section 4a). It can only narrow the measured and experimental sets in `src/web/models.ts`; any other id is ignored and named in the server log. Leave it unset to keep the single-model behaviour (`MODEL_ID` only) |
| `LIVE_ACCESS_CODE` | set: a code you choose and give to the judges | yes | mandatory: without it live reading stays off on the deployed site |
| `LIVE_READS_PER_HOUR` | set: `20` | no | the global hourly limit of live readings, counted in the shared store across all instances |
| `LIVE_CODE_FAILURES_PER_HOUR` | optional, default `5` | no | wrong codes allowed per client per UTC hour; other clients’ wrong codes never block a correct code (section 6) |
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

## 4a. The model choice (Stage 8)

With `LIVE_MODELS` set to the value above, the live screen shows every model AMD Token Factory lists now (the same
check as "Runs on AMD", at most once per 60 s), in three groups:
- **measured** (Qwen3.8-27B, Gemma-4-31B-IT): selectable while listed; the default is `MODEL_ID` when listed;
- **not evaluated · experimental** (the four models that passed the Stage 8 probe): selectable while listed, only
  with the acknowledgement on the page;
- **listed, not offered:** every other id, disabled with its reason.

The choice is limited to measured models and to what Token Factory lists now. A model the endpoint stops listing
is shown disabled, and the server refuses it before any model call; nothing falls back to another model. No
redeploy is needed when the list changes. Without `LIVE_MODELS` only `MODEL_ID` can be chosen.

## 5. Checks after deploying

Replace `<site>` with the deployment URL. Each check states its expected result. The checks marked "code" need
the access code; type it in place of `<code>` in your own terminal and do not paste it anywhere else.

```sh
curl -s https://<site>/health                     # 200, "status": "ok", "reader": "live"
curl -s https://<site>/api/f1                     # 200, "state": "on", the model list of the endpoint
curl -s https://<site>/api/live/status            # 200, "enabled": true, "access_code_required": true, "used_this_hour" and "in_flight" counts, and "models" with the three groups and their "checked_at"
curl -s -o /dev/null -w "%{http_code}\n" https://<site>/stories/cg-003.json            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://<site>/figures.json                   # 200
curl -s -X POST -H "content-type: application/json" -d '{}' https://<site>/api/stories/cg-003/evaluate   # 200, "proposal": "block"
curl -s -o cg-004.pdf https://<site>/api/samples/cg-004/certificate.pdf               # the sample certificate
curl -s -X POST -H "content-type: application/json" -d "{\"certificate_base64\":\"$(base64 -w0 cg-004.pdf)\",\"synthetic_confirmed\":true,\"model\":\"Qwen3.8-27B\"}" https://<site>/api/live/jobs   # 403, no code
# code: a model outside the offer, and an experimental model without the acknowledgement, are refused; used_this_hour does not move
curl -s -X POST -H "content-type: application/json" -H "x-live-access-code: <code>" -d "{\"certificate_base64\":\"$(base64 -w0 cg-004.pdf)\",\"synthetic_confirmed\":true,\"model\":\"Not-A-Measured-Model\"}" https://<site>/api/live/jobs   # 400, "reason_class": "model_not_offered"
curl -s -X POST -H "content-type: application/json" -H "x-live-access-code: <code>" -d "{\"certificate_base64\":\"$(base64 -w0 cg-004.pdf)\",\"synthetic_confirmed\":true,\"model\":\"MiMo-V2.6-Flash\"}" https://<site>/api/live/jobs   # 400, "reason_class": "model_ack_required"
curl -s https://<site>/api/live/status            # "used_this_hour" unchanged by the two refusals
```

If an offered model is not listed at that time (for example Gemma-4-31B-IT), check that the live screen shows it
disabled with "not listed by the endpoint now (checked <time>)", and that a POST naming it with the code answers 409
with `"reason_class": "model_unlisted"` and leaves `used_this_hour` unchanged.

Then one real live reading **with each offered model the endpoint lists at that time**, in a browser: open the site,
go to "Read a certificate live", download the sample cg-004 certificate and its delivery note, choose them, give
line 1 and the access code, choose the model (for an experimental model, tick its acknowledgement), tick the notice
and press "Read live". The page shows "Queued", then "Reading at AMD Token Factory" with the seconds so far, then
opens the case file. Its receipt names the model requested and the model as reported by the endpoint, with the
endpoint snapshot taken at reading time; a reading by an experimental model is labelled "not evaluated" next to its
proposal. Each reading counts once against `LIVE_READS_PER_HOUR`.

If live reading is not configured completely, the site answers exactly as before Stage 6: `/api/live/status` shows
"enabled": false with "live reading unavailable on the deployed site; live demonstration from the container",
`/api/live/read` and `/api/live/jobs` answer 503, and the server log names what is missing (no values).

## 6. Wrong codes, and clearing a lockout

Every attempt with a code counts first, and a correct code is given back at once. A client (identified by a hash
of the address Vercel sets in `x-vercel-forwarded-for`) is refused for the rest of the UTC hour after `LIVE_CODE_FAILURES_PER_HOUR` wrong codes (default 5).
Wrong codes from all clients are also counted together, for monitoring only (`code_failures_this_hour_global` in `/api/live/status`); that count never refuses anyone, so a correct code is never refused because other clients failed.
The residual risk is that guessing spread over many client addresses is bounded only by `LIVE_CODE_FAILURES_PER_HOUR` per address and per hour, so the real barrier is the code itself: set `LIVE_ACCESS_CODE` to a long random value, at least 20 random characters from a password generator.
To clear one client's lockout before the hour ends, delete the key `certgate:live:codefail:c:<hash>:<hour>` in the Upstash console (`certgate:live:codefail:g:<hour>` is the monitoring count), where `<hour>` is the UTC hour as `YYYY-MM-DDTHH`; or wait for the next UTC hour.

Then report in the room that the deployment is done, so that the auditor can run its checks.

Known cosmetic issue: `/favicon.ico` answers 404.
