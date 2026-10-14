# S4-10: live check of the deployed site (auditor)

**Site:** https://certgate-wheat.vercel.app.
**Deployed commit:** the human pushed `8868838f90abd9593c6d5be17124ff5d5272e5e5`; `git ls-remote` shows GitHub main at
that commit at 12:44:55Z. It contains the accepted Stage 5 candidate `409fb69a`, with the E-15 `includeFiles` fix.
The pre-fix baseline (11:04Z) is `baseline-prefix.txt`: static files 200, function routes 500.

**Result: PASSED.** The checks were plain GETs and POSTs with no credentials. The site has no MODEL_* configured, so
no endpoint call was made.

| DEPLOY.md check (as at 409fb69a) | Expected | Observed, 12:44:55–12:45:49Z |
|---|---|---|
| GET /health | 200, status ok | 200: ok, mode mock, reader off |
| GET /api/f1 | 200, state off, "no endpoint configured" | 200: off, "no endpoint configured", every value null |
| GET /api/live/status | 200, enabled false, deployed_site true, reason "live reading unavailable on the deployed site; live demonstration from the container" | 200, exactly that |
| GET /stories/cg-003.json, /stories/cg-003.recording.json, /figures.json | 200 | 200, 200, 200 |
| POST /api/stories/cg-003/evaluate `{}` | 200, proposal block | 200, block. The note reads "recorded real reading of cg-003 (2026-10-13T17:52:09.471Z), re-evaluated … not live" |
| POST /api/live/read (empty, synthetic_confirmed) | 503 | 503 |
| Other assets: /, /index.html, /app.js, /labels.js, /styles.css, /stories/cg-001.json, /stories/cg-002.json | 200 | all 200. /favicon.ico answers 404, as documented |
| Served files vs committed `public/` at 8868838f (`live-hashes-8868838.txt`) | SHA-256 equal | **all 9 MATCH**: index.html (also served at /), app.js, labels.js, styles.css, figures.json, and the four story files |
| Secrets in the served files (`live-scan-8868838.txt`) | none | key 0, base-URL host and path 0, generic patterns 0. Only the bare host name occurs, in the recorded stories, which the dispatch allows |

**What the band did not check here:** the DEPLOY.md browser steps 1–7 at 375 and 1280 px. Those are the human's
steps; I checked them on the container in Stage 4.

The 500 FUNCTION_INVOCATION_FAILED reported by the operator is resolved on the live site by E-15.
