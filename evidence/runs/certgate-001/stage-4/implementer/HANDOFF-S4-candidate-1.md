# Stage 4 candidate 1 (delivery): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 4
Task: analyst's Stage 4 handoff (msgs 6dfa1de7 … 18419d86, 14 parts). Register: `stage-4/OBLIGATIONS.md` **R4.6**
(R4.0 + R4.1 E-01 + R4.2 E-02…E-06 + R4.3 F-01…F-14 + R4.4 E-07 + R4.5 E-08 + R4.6 E-09), SHA-256
`bd9a9daa18327d0cc9d0fc93dd958c363f16e6effb44a48d43d1a30446940f64`; R3.3, R2.2 and R1.6 still in force.
This record states what was done; it is not an acceptance. **No push** (D4-02). **No endpoint calls** in Stage 4.
No deployment, video, slides, cover, form or submission is made or claimed (S4-11).

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `02c5c36b79f35d8a1c13955411b6b17f80a84b22` |
| Tree | `41e723207c371cf15c50b4f783842a08c6cf53cb` |
| Input revision | Stage 3 accepted `5c904693423574846e17994331a628cc06d735ef` |
| Commits since 5c904693 (mine) | `f4058c2` delivery docs, generators, checks, E-08/E-09 strings · `39bf3e3` evidence: Stage 3 logs force-added · `02c5c36` repository checks skip in the image |
| Evidence-only commit on top | named in the room message |

## Diff vs 5c904693, by kind

| Kind | Files |
|---|---|
| **Docs** | `README.md` (rewritten), `DEPLOY.md` (new), `METRICS.md` (new, generated), `CLAIMS.md` (new), `EVIDENCE-INDEX.md` (new) |
| **Tools (generators)** | `tools/evaluate/metrics-md.mjs` (new) |
| **Tests** | `test/docs.test.ts` (new), `test/metrics-md.test.ts` (new), `test/support/fake-dom.ts` (new), `test/story-screen-render.test.ts` (uses the shared DOM stand-in; adds the `#/amd` tests), `test/web.test.ts` (/health test; S3-23 wording check) |
| **Code: product strings, R4.5 E-08 and R4.6 E-09** | `src/web/app.ts` (`/health` `reader`), `public/app.js` (`amdScreen()` text) |
| **Code: comment-only** | `src/web/live-reader.ts` (header comment, S4-21), `api/index.ts` (header comment) |
| **Evidence** | `evidence/runs/certgate-001/stage-3/implementer/**/*.log` + `LOGS.sha256` (force-added, unchanged; see "Correction"), this directory. Plus the analyst's register and log commits |

No other file under `src/`, `public/`, `api/`, `config/`, `data/`, the package files, `Dockerfile`, `.dockerignore`
or `vercel.json` changed. The reading path, the prompt (SHA-256 `32fad2f9…`) and the rules are unchanged.

### Every src/, public/ and api/ hunk (exact)

```diff
--- a/src/web/app.ts
+++ b/src/web/app.ts
@@ -257,7 +257,10 @@ export function createHandler(deps: AppDeps = {}) {
       if (m === "GET" && (p === "/health" || p === "/api/health")) {
-        return send(res, 200, { status: "ok", mode: getMode(env), reader: "no model in this build", notice: "All data is fictitious." }, NO_STORE);
+        // The reader state from the loaded configuration only (R4.5 E-08): "live" when an endpoint and model are
+        // configured outside the deployed site, otherwise "off". No claim beyond that.
+        const reader = cfg.modelBaseUrl !== null && cfg.modelId !== null && !cfg.deployedSite ? "live" : "off";
+        return send(res, 200, { status: "ok", mode: getMode(env), reader, notice: "All data is fictitious." }, NO_STORE);
       }
--- a/public/app.js
+++ b/public/app.js
@@ -438,8 +438,10 @@ function receiptScreen(view, opts) {
   render(h("div", { class: "row" }, f1Panel(f1 || { state: "off", detail: "status unavailable", model_ids: [] }, "Runs on AMD",
-    "Read now from the configured model endpoint and its sidecar. With no endpoint configured, it says endpoint off with the time of this check. Nothing is typed by hand.")),
-    h("p", { class: "muted" }, "In this build no endpoint is configured and no AMD hardware is used."));
+    "Read now from the configured model endpoint (GET /models and GET /usage, probed at most once per 60 s). With no endpoint configured, it says endpoint off with the time of this check. Nothing is typed by hand.")),
+    h("p", { class: "muted", id: "amd-state" }, f1 && f1.state === "on"
+      ? "Endpoint on: AMD Token Factory. The values above are as reported by the endpoint."
+      : `Endpoint off (${f1 && f1.detail ? f1.detail : "status unavailable"}): judge mode shows the recorded readings only.`));
--- a/src/web/live-reader.ts   (comment only)
+++ b/src/web/live-reader.ts
@@ -1,7 +1,7 @@
-// (AMD Token Factory in this run). It sends the certificate's text layer (digital PDF) or its page images
-// (scan), asks for the CertGate reading as one JSON object, and returns that JSON text unchanged except for
-// surrounding code fences. The pipeline validates it; invalid output is a C11 failure, never repaired.
+// (AMD Token Factory in this run). It sends only the rendered page images of every certificate, digital or scanned
+// (never the text layer, R3.1 C-01), asks for the CertGate reading as one JSON object, and returns that JSON text
+// unchanged except for one code fence spanning the whole content. The pipeline validates it; invalid output is a C11 failure, never repaired.
--- a/api/index.ts   (comment only)
+++ b/api/index.ts
@@ -1,4 +1,4 @@
-// Vercel function entry (F4 shape only; NOTHING IS DEPLOYED in this dispatch, S2-23). Vercel's Node runtime
+// Vercel function entry (F4 shape; the human deploys it, see DEPLOY.md; live reading is off there, S3-24). Vercel's Node runtime
```

**Deviation from E-09 wording, stated for review.** E-09 suggests the "off" line say "No endpoint is configured on
this server…". That sentence is false when an endpoint is configured but unreachable: F1 is then off with detail
"endpoint unreachable". So the line reports the server's own detail instead: "Endpoint off (no endpoint
configured): …" or "Endpoint off (endpoint unreachable): …". Both texts are tested in
`test/story-screen-render.test.ts`.

## Deliverables (rows)

| Row | Where | Check |
|---|---|---|
| S4-01 README runs from a clean clone, with all required content | `README.md` | every README "Run it" docker command run verbatim at 02c5c36 (`readme-commands-docker.log`); real-mode command **not run** (no endpoint calls by this seat in Stage 4; E-02 grants the auditor a GET-only lease) |
| S4-02 DEPLOY.md | `DEPLOY.md` | settings, every variable by name, **do not set MODEL_* on Vercel** (F-05), 300 s = `vercel.json` (F-10), post-deploy checks. Each check was verified against a local server with `VERCEL=1` and no MODEL_* (results in the room, msg 5680d5a3) |
| S4-03 METRICS.md generated | `node tools/evaluate/metrics-md.mjs` (write) / `--check` (compare) | `test/metrics-md.test.ts` regenerates and diffs byte for byte in the default offline suite. The generator reads only the committed `metrics.json`/`run.json`/`results.json` of both runs: no clock, locale, environment or absolute path |
| S4-04 | `EVIDENCE-INDEX.md` | links exist (claims check covers the cited paths) |
| S4-05, F-02 | `CLAIMS.md`: 49 rows over README, DEPLOY.md and METRICS.md | `test/docs.test.ts` "every proof cited in CLAIMS.md exists" (each `test:` title found in its file, each path exists) |
| S4-11, F-06 | grep list in `test/docs.test.ts` "no forbidden claim in README, DEPLOY.md, METRICS.md or public" | `MI3\d\d`, `ROCm \d`, `vLLM \d`, `deployed at`, `\blive at\b`, `submitted`, `winner`, `qualif`, `own vLLM endpoint`, `AMD Instinct` |
| S4-12, F-07 | `test/docs.test.ts` "no user-profile path or operator e-mail in any tracked text file at head" | regex over `git ls-files` text files: `X:\Users\<name>\`, `X:/Users/<name>/`, `/c/Users/<name>/`, the operator e-mail; zero hits at 02c5c36 |
| S4-15…S4-23 | README "Limitations", "Evaluation"; METRICS "Reporting rules", "Per-case proposals", "Per-field accuracy" | S4-15 decimal comma (cg-028 and cg-004, wording O3-01); S4-16 both runs (METRICS generated from both runs' artifacts; README table, checked by "README evaluation figures equal the generated metrics of both runs"); S4-17 cg-003 read as 338, block; S4-18 no model explanation (deviation from 03-DISENO step 7, I1); S4-19 cg-022; S4-20 OI-S2-01 (per instance, measured) and OI-S2-02 (deployed: 503, live from container); S4-21 prompt examples reuse cg-001 values + comment fix; S4-22 favicon 404 listed as cosmetic (docs-only per E-06); S4-23 shared-service limits and 2-day retention |
| F-01 | METRICS names each run's actual candidate (`dd557fd`, `a892f771`) and states the reading path is identical by diff to `5c904693` | generated text |
| F-08 b, d | "README evaluation figures equal the generated metrics of both runs"; "no secret-looking value in the docs" (patterns plus this host's real values compared by presence, never printed) | `test/docs.test.ts` |
| F-09 | "env var names documented in README and DEPLOY.md equal the names read by src (both directions)" | 11 names, `VERCEL` documented as platform-set |
| F-10 | "DEPLOY.md duration equals vercel.json maxDuration and cites the Vercel record" | `test/docs.test.ts` |
| F-11, F-14 | METRICS "Reporting rules" (C-08…C-15, D3-03); README model publisher, licence, source link and dataset provenance | CLAIMS C-12, C-43 |
| E-08, E-09 | `/health` `reader` from config; `#/amd` texts | `test/web.test.ts` "/health reports the reader state from the configuration only" (off, live, off with VERCEL); `test/story-screen-render.test.ts` "Runs on AMD screen text follows the F1 state" (off with two details, on) |

## Results (logs in this directory)

| Check | Result |
|---|---|
| `clean-clone-tests.log`: fresh clone of 02c5c36, `npm ci`, build, `npx vitest run`, `metrics-md.mjs --check`, MODEL_* unset | **300/300**; METRICS matches |
| `readme-commands-docker.log`: the README docker commands, verbatim | image built; mock UI 200 with `/health` `"reader": "off"`; cg-003 process via published port and `--network none`; CLI; suite in image **288 passed, 12 skipped** |
| `browser-checks.log`: `test/browser/ui-checks.mjs`, normal shape | **15 PASS / 0 FAIL** (screenshots in `browser/`) |

**The 12 tests skipped in the image** are `test/docs.test.ts` (9) and `test/metrics-md.test.ts` (3). They check
the repository's delivery documents and evidence. The image carries neither: `.dockerignore` excludes `evidence/`,
and the Dockerfile copies only `README.md` of the documents. So these tests skip there explicitly (`describe.skipIf`)
and run in every checkout. The README says so next to the image test command. The alternative is to put the docs
and the auditor run artifacts into the image, which is a packaging change; that is the analyst's call.

## Correction (posted in the room, msg d11f8232)

The `.log` files cited by my Stage 3 records were not committed until `39bf3e3`, because `.gitignore` excludes
`*.log`. They are now force-added unchanged, with `stage-3/implementer/LOGS.sha256`. The Stage 4 logs in this
directory are force-added too.

## Not done or not run by this seat

- The real-mode README command (it needs the endpoint; no Stage 4 endpoint calls by this seat).
- The browser checks in the `VERCEL=1` shape (F-13 is the auditor's and adversary's). The `VERCEL=1` server
  behaviour was checked with curl (`/api/f1` off, live status disabled with the reason, `/api/live/read` 503,
  stories and figures 200).
- Vercel itself (the human deploys), push (the human pushes), the GitHub API checks (auditor).

Time: Stage 4 started about 20:01Z; candidate frozen 20:3xZ.
