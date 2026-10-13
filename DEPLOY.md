# Deploying CertGate on Vercel (for the human)

The band does not deploy and holds no Vercel or GitHub credentials; the human does this. Deploy the accepted
commit named in the room. The deployed site is **judge mode only**: three recorded real readings, the case files,
human confirmation and decision, the receipts, and the landing figures. It makes **no model call**. Live reading
runs from the container (README, "Real mode"), never from the deployed site.

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
- Any plan works.
- Even 300 s cannot hold one live reading. Its worst case is 3 × 300 s + 2 × 120 s = 1140 s
  (`LIVE_WORST_CASE_MS` in `src/web/limits.ts`). That is why the deployed site has no live reading: with `VERCEL`
  set, `/api/live/read` answers 503.

## 3. Environment variables (names only; never write a value anywhere)

| Variable | On Vercel | Why |
|---|---|---|
| `MODEL_BASE_URL` | **do not set** | Live reading is unavailable on Vercel by design. Without it, the "Runs on AMD" panel honestly shows "endpoint off", and the shared endpoint key is never exposed to anonymous traffic |
| `MODEL_API_KEY` | **do not set** | same |
| `MODEL_ID` | **do not set** | same |
| `LIVE_READS_PER_HOUR` | leave unset | live reading is off on Vercel anyway; unset also means "disabled" |
| `LIVE_ACCESS_CODE` | leave unset | only meaningful with live reading |
| `LIVE_CODE_FAILURES_PER_HOUR` | leave unset | same |
| `LIVE_WINDOWS` | optional | free text shown on the landing, for example the time of a live demo from the container |
| `CERTGATE_MODE` | leave unset (`mock`) | dataset API only |
| `CERTGATE_DATA_DIR` | leave unset | the function bundles `data/` (`includeFiles` in `vercel.json`) |
| `PORT` | leave unset | not used by the Vercel function |
| `VERCEL` | **set by Vercel itself**; never set or remove it | it switches live reading off on the deployed site |

## 4. Checks after deploying

Replace `<site>` with the deployment URL. Each check states its expected result.

```sh
curl -s https://<site>/health                     # 200, JSON with "status": "ok"
curl -s https://<site>/api/f1                     # 200, "state": "off", "detail": "no endpoint configured"
curl -s https://<site>/api/live/status            # 200, "enabled": false, "deployed_site": true,
                                                  #      "reason": "live reading unavailable on the deployed site; live demonstration from the container"
curl -s -o /dev/null -w "%{http_code}\n" https://<site>/stories/cg-003.json            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://<site>/stories/cg-003.recording.json  # 200
curl -s -o /dev/null -w "%{http_code}\n" https://<site>/figures.json                   # 200
curl -s -X POST -H "content-type: application/json" -d '{}' https://<site>/api/stories/cg-003/evaluate   # 200, "proposal": "block"
curl -s -X POST -H "content-type: application/json" -d '{"certificate_base64":"","synthetic_confirmed":true}' -o /dev/null -w "%{http_code}\n" https://<site>/api/live/read   # 503
```

In a browser, at phone width (375 px) and desktop width (1280 px):

1. The landing shows the fictitious-data notice and four figures with denominators, and names the evaluation
   run they come from.
2. The endpoint pill says "Model endpoint: off".
3. Judge mode lists cg-001, cg-002 and cg-003, each labelled "recorded real reading … not live".
4. On cg-003, release is disabled. After confirming every critical field with ReH 358 and re-running the
   rules, release becomes possible.
5. The receipt opens and downloads as JSON.
6. "Read a certificate live" says "live reading unavailable on the deployed site; live demonstration from the
   container", and "Read live" is disabled.
7. The page makes no request outside the site. Check the browser network tab.

Known cosmetic issue: `/favicon.ico` answers 404.

Then report the URL in the room so that the auditor can check it: every asset answers 200, and the served files
match the committed ones.
