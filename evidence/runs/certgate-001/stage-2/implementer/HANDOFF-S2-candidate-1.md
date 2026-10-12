# Stage 2 candidate 1: implementer handoff record

To: @hugo.valer/analyst-xwz3, @hugo.valer/adversary-xwz5, @hugo.valer/auditor-xwz6 · From: @hugo.valer/implementer-xwz4
Run certgate-001 · Stage 2 · Register claimed: **R2.2** (commit 2ac05d62, SHA-256 5d93a2e9…c6ee845), with Stage 1
R1.6 in force (S2-34). Input revision: accepted Stage 1 candidate `9d0449917b237ab5de51ccf1141b772e5c0e7008`.

The complete task and specification travel with the room handoff, which has 11 numbered parts. A success statement
here is a claim, not acceptance. Scope (D2-01): mock and stored path only, no endpoint, no deployment.

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `496f4ddc76bf3a3c088d933d712d7f248efe1ebe` |
| Product tree | `a3c6345524476d44f91af09226d7112568328913` |
| Commits since 9d044991 | `3404f4c8` (S2-33), `e96d29ce` (S2-22 Vercel limits record, **before** any adapter code), `d6a2fbae` (web, UI, adapter, limiter, stories), `1cc1f538` (README, Docker, Vercel shape, browser checks), `496f4ddc` (B-14 CLI test). Seat evidence commits in between touch only `evidence/` |
| Working tree | clean for product paths |
| Sources | all files in `stage-2/SOURCES.sha256` match at 18:44Z |

## Commands

```sh
git clone C:\nexus\dev\certgate certgate-review && cd certgate-review && git checkout 496f4ddc76bf3a3c088d933d712d7f248efe1ebe
npm ci && npm run build && npx vitest run
docker build --no-cache -t certgate:s2c1 .
docker run --rm --network none certgate:s2c1 npx vitest run                     # full suite in the image, offline
docker run --rm --network none certgate:s2c1 node dist/src/cli.js process --case cg-003

# UI in a browser: http://localhost:3000 (published port needs a network; the service makes no outbound call)
docker run --rm -d --name certgate-ui -p 3000:3000 -e PORT=3000 certgate:s2c1      # then: docker stop certgate-ui
# UI and API fully offline (no port can be published under --network none; query from inside):
docker run --rm --network none -e PORT=3000 certgate:s2c1 sh -c 'node dist/src/server.js & sleep 2; node -e "fetch(\"http://127.0.0.1:3000/api/f1\").then(r=>r.text()).then(console.log)"'

# Local, with the TEST STUB (not a model) for F1 "on", the live limit and C11:
node test/support/stub-endpoint.mjs --port 8001 [--mode ok|timeout|http_429|http_5xx|invalid_json|huge] [--case <id> | --reading <file>]
MODEL_BASE_URL=http://127.0.0.1:8001 MODEL_ID=certgate-test-stub GPU_INFO_URL=http://127.0.0.1:8001/gpu-info LIVE_READS_PER_HOUR=3 PORT=3000 node dist/src/server.js
# optional: LIVE_ACCESS_CODE=<code> LIVE_CODE_FAILURES_PER_HOUR=<n> GPU_COST_PER_HOUR=<usd> LIVE_WINDOWS="<text>"

# Browser checks (Playwright + Chromium needed; not part of the suite):
node test/browser/ui-checks.mjs <outDir>
# Regenerate the stored stories with the candidate's own pipeline (B-23):
node dist/src/tools/build-stories.js
```

Vercel limits record: `docs/sources/vercel-limits.md`. Function shape (not deployed): `api/index.ts`, `vercel.json`.

## Tool versions

Node v24.19.0 (host), image `node:24.21.0-bookworm-slim@sha256:d6aa754f…7b20`, Docker 29.8.0, TypeScript 5.9.3,
vitest 5.0.4, decimal.js 10.6.0, pdfjs-dist 6.4.299. Browser checks used Playwright 1.56.1 with Chromium build 1194,
installed outside the repository. Built image `sha256:1e8626234ac0aacedd019011067354f51cf249d7515d7cd58637b9ad299902ee`.

## Own results (implementer; not independent verification)

| Run | Result | Artifact (in `stage-2/implementer/candidate-1/`) |
|---|---|---|
| Clean clone: `npm ci && npm run build && npx vitest run` | 10 files, **232 passed**, 0 failed, 0 skipped | `local-clean-clone-tests.txt` |
| `docker build --no-cache` | exit 0 | `docker-build-no-cache.txt` |
| Suite in the image, `--network none` | **232 passed** | `docker-network-none-tests.txt` |
| Offline in-container `/api/f1`, `/api/live/status`, `/` | F1 `off`, "no endpoint configured", real check time; live disabled; page served | `docker-network-none-ui-api.txt` |
| Container UI at 375 and 1280 px, 6 screens each | `scrollWidth == innerWidth` on all 12; notice on all; 0 external requests; 0 console errors; 0 AMD-run claims | `screens/*.png`, `screens/layout-report.json` |
| Browser checks (clean clone build) | **9/9 PASS**: release disabled cg-002 and cg-003; enabled after all 22 critical fields confirmed with ReH 358; B-21 ×2; S2-20; B-09; B-17; B-16 | `ui-checks.txt`, `ui-checks/` |

Of the 232 tests, 189 are carried over from Stage 1 (including S2-33's P20-style regression) and 43 are new.

## Requirement mapping (R2.2, implementer rows)

| Row | Code | Tests or checks |
|---|---|---|
| S2-01, B-20 | public/app.js `landing`, `fig` (placeholders `[n]`, `[n / N]`, `[s]`, `[USD]`, "MEASURED ON [N]") | web.test "landing figures are placeholders …" |
| S2-02 | src/web/view.ts `steps` (receipt timings; coherence and rules measured together and labelled so) | screenshots |
| S2-03 | view.ts rows (value, channels, spec, source, result); app.js `caseFile` | screenshots; story files |
| S2-04, A-21, B-14 | app.js `decisionForm`, `confirmForm` (all critical fields); pipeline.ts `recordHumanDecision` gate; API 409 | web.test confirmations/release; human.test; entrypoints.test CLI; ui-checks |
| S2-05, B-10 | app.js `receiptScreen` (JSON download; browser copies add `client_held_copy`); no PDF control | ui (manual), receipt export checks |
| S2-06 | styles.css (flex-wrap, table boxes) | layout-report.json |
| S2-07 | index.html notice | web.test; layout-report |
| S2-08, B-17 | look from G; system fonts (no Google Fonts); CSP `default-src 'self'` | web.test "no third-party URL"; ui-checks B-17 |
| S2-09, S2-30, B-08 | README "Where AMD fits", status; landing note | static.test README; web.test S2-30/B-08 |
| S2-10 | view.ts `explanation` ("no model explanation: mock") | story files |
| S2-11, S2-12, S2-36, B-06, B-19 | src/web/f1.ts `probeF1`, `costEstimate` (configured price only) | web.test F1 ×5 |
| S2-13 | receipt `f1` snapshot (`not_applicable_mock`, `off` or endpoint data) | web.test; reader.test real mode |
| S2-14, B-11, B-12, B-23 | public/stories/*.json by src/tools/build-stories.ts | web.test stored stories ×3; AMD-claims grep |
| S2-15, D2-07 | app.js `liveSection` (windows from `LIVE_WINDOWS`, else "no live window is announced") | web.test status |
| S2-16, B-02, B-03, B-05, B-07, B-24(5) | src/web/limiter.ts (UTC hour, atomic, fail closed); app.ts order: validate, code, endpoint, consume | web.test limit, parallel 8→3, headers, reopen at next hour |
| S2-17, B-04 | app.ts `codeMatches` (timingSafeEqual on SHA-256), failure counter | web.test access code |
| S2-18 | no login; stories unlimited | — |
| S2-20, B-13 | app.ts `EndpointOffReader`; uploads never use MockReader | web.test byte-identical upload; ui-checks S2-20 |
| S2-21 | stateless handler; cases kept in localStorage | ui-checks B-09 |
| S2-22, B-18 | docs/sources/vercel-limits.md (committed in e96d29ce before d6a2fbae); src/web/limits.ts | web.test upload limit 413 |
| S2-23 | no `.vercel/`, no project link, no deploy command run | — |
| S2-24 | Dockerfile copies public/ | docker logs |
| S2-25, B-22 | src/web/live-reader.ts (C11 mapping, 60 s attempt timeout, 1 MiB response cap) | web.test C11 ×5 through HTTP |
| S2-26 | secrets only server-side | web.test (responses never contain key or code; static files) |
| S2-31 | `reading_source: "live_no_reading"`, label "live attempt · no reading" | reader.test; web.test; entrypoints.test |
| S2-33 | pipeline.ts planted union and `errors[].recovered` (3404f4c8) | reader.test P20 style |
| S2-35 | logs scrubbed; no local paths in product or new evidence | `git grep` clean; scan of this folder |
| B-15 | server stamps `decided_at` and `confirmed_at` | web.test server clock |
| B-16 | app.js builds DOM with textContent only | web.test sink grep; ui-checks B-16 |
| B-21 | per-tab state reset on navigation; story inputs not stored | ui-checks |
| S2-34 | Stage 1 suite unchanged and green (one test adapted for S2-31: `live_no_reading`) | full suite |

## Known gaps and limitations

1. **OI-S2-01:** the live-read counter and the code-failure throttle are in memory, per server instance. Several
   instances need a shared store behind `HourlyCounter`.
2. **OI-S2-02:** live reading is one request within the 300 s budget (3 × 60 s). Start-then-poll is not
   implemented. If dispatch 2 measures longer readings, it needs start-then-poll with a managed store.
3. The live adapter's request format (PDF as a base64 data URL in an OpenAI-style message) is untested against a
   real vLLM or model. Only the test stub was used. Dispatch 2 must take the format from the vLLM documentation of
   the deployed version.
4. With `--network none` the UI cannot be reached from a host browser. Browser checks use a published port; the
   service makes no outbound call in mock mode.
5. Confirmations and decisions on cases kept in the browser are recorded in the browser with browser time,
   labelled as not verified by a server. Re-evaluation with confirmations exists only for the three stored stories.
6. Fonts are system fallbacks (IBM Plex only if installed locally), so the look differs slightly from the design.
7. Coherence and rules are timed together; the progress screen says so rather than inventing separate durations.
8. Stage 1 gaps 1, 4, 6, 7 and 9 still apply.

## Time and usage

Stage 2 handoff was received at about 18:20Z and the candidate frozen at 18:41Z (commit time). Clean-clone
verification ran 18:41–18:45Z. Token and cost usage: unknown, because there is no per-seat meter. Model: claude-opus-5-5.
