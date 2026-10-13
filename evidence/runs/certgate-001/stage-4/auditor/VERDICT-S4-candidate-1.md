# Stage 4 verdict: candidate 1 (auditor-xwz6)

Run certgate-001 · Stage 4 (delivery) · Register R4.6 (`stage-4/OBLIGATIONS.md` at `d51bfbe`, SHA-256
`bd9a9daa18327d0cc9d0fc93dd958c363f16e6effb44a48d43d1a30446940f64`), with R3.3, R2.2 and R1.6 still in force.

**VERDICT: REJECTED (2026-10-13T20:52Z) on finding F4-01: the claims table is incomplete (S4-05, R4.3 F-02).**
Every other check passed (sections 2–9). The repair is docs and tests only: add the missing rows, or prove or remove
each sentence. No product code needs to change.

## 1. Candidate

| | |
|---|---|
| Candidate commit / tree | `02c5c36b79f35d8a1c13955411b6b17f80a84b22` / `41e723207c371cf15c50b4f783842a08c6cf53cb` (verified in my fresh clone `certgate-audit-s4c1`) |
| Evidence commit on top | `d51bfbe` (implementer handoff record) |
| Input | Stage 3 accepted `5c904693` |
| Handoff | implementer msgs 7f506cf9 … 6e592d41 (14 parts, receipt confirmed in dd257092) |

## 2. D4-04: product changes since 5c904693 (each hunk read)

| File | Change | Within R4.5 E-08 / R4.6 E-09 |
|---|---|---|
| `src/web/app.ts` | `/health` `reader` is `live` when an endpoint and model are configured and this is not the deployed site, otherwise `off` | yes (E-08) |
| `public/app.js` `amdScreen()` | sidecar wording removed; the `#amd-state` line is driven by `f1.state` | yes (E-09) |
| `src/web/live-reader.ts` | comment only | yes |
| `api/index.ts` | comment only | yes |

- These are byte-identical to `5c904693`: the reading path and rules (`rules.ts`, `reader.ts`, `model-output.ts`, `text-layer.ts`, `pipeline.ts`, `f1.ts`, `limits.ts`), `data/`, `config/`, the package files, `Dockerfile` and `vercel.json`.
- The prompt SHA-256 of the build is `32fad2f9…c567`, unchanged.
- All other changes are docs, generators and tests.

## 3. Suites (Stage 1–3 regression, C-22)

| Where | Result |
|---|---|
| Clean clone, `MODEL_*` cleared | **300 / 300 passed, 0 skipped** (vitest JSON report `vitest-report.json`; `suite-clean-clone.log`) |
| My `docker build --no-cache -t certgate` (README command), image `sha256:86355e29…fe30`, `--network none` | 288 passed; 12 **not run in image** (`docs.test.ts` 9, `metrics-md.test.ts` 3: the image carries no docs or evidence). The clean-clone run is the suite of record for those (analyst ruling msg 58c985b1) |

## 4. Mutants re-applied by me (logs in `mutants/`)

| Mutant | Result |
|---|---|
| S4M01: `/health` reader hard-coded `"off"` | KILLED (2 failed) |
| S4M02: `/health` stale `"no model in this build"` | KILLED (1 failed) |
| S4M03: AMD line ignores `f1.state` | KILLED (1 failed) |
| S4M04: sidecar wording restored | KILLED (2 failed) |
| S2M02br: story label cut | KILLED (5 failed) |
| S3M06: JSON repaired by guessing | KILLED (5 failed) |

The clone was restored clean.

## 5. README commands (S4-01, R4.3 F-03)

Log: `readme-commands.log`.

- **Mock mode, every command run verbatim:**
  - the build;
  - the UI container: `/health` gives reader `off`, `/` answers 200;
  - the service with `POST /api/cases/cg-003/process`: review, mock;
  - the fully offline `--network none` server and fetch;
  - the CLI in the image;
  - the suite in the image;
  - local `npm ci`, `npm run build`, `npm test`, `cli list`, `cli process --case cg-001` (release);
  - the stub command: `/health` live, F1 on, live status enabled.
- **Real mode** (R4.2 E-02 GET-only lease; taken in msg aae9ae5f, released in msg 00456ea3): the README real-mode `docker run` with `MODEL_*` set.
  - `/health` reader is `live`.
  - `/api/f1` state is `on`, with the 12 models the endpoint lists. GPU, ROCm and vLLM say "not exposed by the endpoint".
  - `/api/live/status` is enabled.
  - **No reading was made.** GET /usage before and after shows **0 chat requests and cost delta 0**. In all, 6 GETs: the server's F1 probe plus my two raw captures. Headroom 0.98234.
- **Not run:**
  - `run-eval.mjs` and `build-stories.js record`: they call the endpoint for readings, which is outside E-02. Both were run by me in Stage 3 on the identical reading path.
  - The browser checks script, which needs Playwright with Chromium; I ran my own browser checks instead.

## 6. DEPLOY.md (S4-02, R4.3 F-05, F-10)

- **Settings.** `vercel.json` `maxDuration` is 300, matching DEPLOY.md, which cites `docs/sources/vercel-limits.md` with its quote and URL. The worst case of 1140 s is consistent with `LIVE_WORST_CASE_MS`.
- **No `MODEL_*` on Vercel:** DEPLOY.md says "do not set" for all three.
- **The §4 post-deploy checks, run against the container with `VERCEL=1` and no `MODEL_*`** (log `deploy-checks-vercel-shape.log`). All match DEPLOY.md:
  - `/health` 200;
  - `/api/f1` off, "no endpoint configured";
  - `/api/live/status` enabled false, `deployed_site` true, with the stated reason;
  - stories, recording and `figures.json` answer 200;
  - evaluating cg-003 gives `block`;
  - `/api/live/read` answers 503.

## 7. Browser, real Chromium at 375 and 1280 px (S4-08, R4.3 F-13)

Screenshots and logs in `browser/`.

- **Vercel shape (`VERCEL=1`):**
  - The landing shows the notice and the four figures with denominators, and names its run.
  - The pill reads "Model endpoint: off".
  - All 3 judge cards say "recorded real reading … not live".
  - The live section says it is unavailable on the deployed site, and "Read live" is disabled.
  - No third-party request, no horizontal overflow.
- **Demo step 3, cg-003:**
  - The recorded proposal is block, and release is disabled on the story.
  - With all 22 critical fields confirmed and ReH 358, the proposal is **release** with no reasons. With ReH 338 it is **block** (`RULE_FAIL:ReH`).
  - A release decision is recorded with who, when (server-stamped) and why.
  - The receipt shows "not live", both channels, the rules and the endpoint data, and offers a JSON download.
- **`#/amd` screen:**
  - Off: "Endpoint off (no endpoint configured): judge mode shows the recorded readings only."
  - On (real mode, under the lease): "Endpoint on: AMD Token Factory. The values above are as reported by the endpoint." The screen shows 3 × "not exposed by the endpoint".
  - In both states: no sidecar wording, no hardware claim, no key or URL.
- **Normal mock shape:** the same landing. Live reading is "disabled on this server (no hourly limit configured)".
- **Only console error:** `/favicon.ico` 404, documented as a known cosmetic issue (S4-22, E-06).

## 8. Metrics, evidence index, public repository, history, secrets

- **S4-03 / F-01:**
  - `node tools/evaluate/metrics-md.mjs --check` matches, and the regeneration is byte-identical.
  - Every headline figure in METRICS.md for **both** runs equals my independent recomputation (`recompute_metrics.py`, `recompute-implementer-run.json`, and the Stage 3 auditor recompute): FC, caught, as-expected, abstention, failures, seconds, latency, tokens, cost.
  - METRICS names `dd557fd2` and `a892f771` with the prompt SHA.
  - The README figures and "52–208 s" match.
- **S4-04 EVIDENCE-INDEX:** 69 links and paths checked across README, DEPLOY, METRICS, CLAIMS and EVIDENCE-INDEX.
  - Three are missing at the candidate commit: `stage-4/implementer/`, which exists from `d51bfbe`; `stage-4/auditor/`, which exists from this record's commit; and the `stage-N` pattern placeholder.
  - Re-check at the delivered head.
- **S4-06:** anonymous GitHub API (`X-RateLimit-Limit` 60, no token): `hvaler/certgate` private=false, visibility public, licence SPDX **MIT** (`LICENSE`). Captures in `github-repo.json` and `github-license.json`.
- **S4-07:**
  - The first commit is `705c857` at 2026-10-12T16:45:45Z, after the kickoff.
  - **Remote head `e90fe2c` ≠ local `d51bfbe`: not done.** It waits for the human's push of the accepted commit (D4-02).
- **S4-09 / F-04** (counts only; values never printed). **0 hits for the `MODEL_API_KEY` value, the base-URL host+path, and the generic Bearer, `sk-` and KEY/TOKEN/SECRET patterns** in:
  - all 1073 reachable history blobs;
  - the 1135 files of the head tree plus `dist/`;
  - the 1819 files of the image filesystem (`/app`, `/root`, `/home`, `/etc`).

  Notes:
  - The image's generic-pattern matches are in third-party `node_modules` (typescript, vite, vitest) and contain no key.
  - `LIVE_ACCESS_CODE` is not set on this host and cannot be scanned for.
  - The `jury-code-77` fixture appears only under `test/` and `evidence/`.
- **S4-12 / F-07 at head:** no real user-profile path. The 6 pattern matches are prose (the DISPATCH-2 quote, register rows, and the auditor Stage 1/2 notes `C:\Users\…`). The operator e-mail and local user name appear only in the verbatim DISPATCH-2 quote. E-07 notes the R1.0 copy redaction. History is not rewritten, so the earlier blobs keep such paths (out of scope).

## 9. Claims table: proofs (S4-05, part 1)

`check_claims.py` with the vitest JSON report: **49 rows, 94 proofs, all exist; every cited test passed** in the clean-clone run. My parser split C-15's title at its `;`; I checked that test separately, and it passed.

## 10. Finding F4-01 [REJECT; S4-05, R4.3 F-02]: capability sentences with no claims row

My independent enumeration of capability sentences in README.md and DEPLOY.md found these with **no row in CLAIMS.md**. F-02: "a capability sentence absent from the table is a finding". Dispatch: "a claim without support is removed or proven".

| # | Doc · line | Sentence (abridged) | What I found |
|---|---|---|---|
| a | README 257 | "CLI and container: certificate PDF up to 10 MiB; delivery note up to 1 MiB" (and web "delivery note up to 256 KiB") | `test/inputs.test.ts` "rejects an oversized file" exists; no row |
| b | README 250 | `LIVE_READS_PER_HOUR`: "unset, invalid or 0 = disabled" | `test/web.test.ts` "status: disabled when LIVE_READS_PER_HOUR is unset, 0 or invalid" exists; no row |
| c | README 252 | `LIVE_CODE_FAILURES_PER_HOUR` default 5: "wrong codes allowed per UTC hour before rejection" | `test/web.test.ts` "access code: wrong code rejected … throttled after repeated failures" exists; no row |
| d | README 178 | CLI "exit codes: 0 processed (any proposal, including reader errors), 2 input rejected, 1 internal error" | tests exist for exit 0 and exit 2; **exit 1 has no test**; no row |
| e | README 185 | "A confirmation without a unit is taken in the field's expected unit" | only implicit (human.test confirmations with `unit: null`); no row |
| f | README 253 / DEPLOY 44 | `LIVE_WINDOWS` "shown as text" / "free text shown on the landing" | only the **unset** case is tested ("no live window is announced"); the configured case is untested; no row |
| g | DEPLOY 32 | "The judge-mode routes answer in well under a second" | a performance claim with no test or evidence; no row |

**Closing condition:**
- Add a row for each sentence, citing a test that passes (or evidence), or remove or reword the sentence. Where no test exists (d exit 1, f configured windows, g timing), either add a test or evidence, or drop the claim.
- `test/docs.test.ts` must keep passing.
- Docs and tests only: no `src/`, `public/` or `api/` change.

## 11. Observations (non-blocking)

- **O4-01:** README line 290 says the model read 338 "in both completed tuning reads, in the recorded story and in the adversary's probe". C-38 cites only the recording. Please add the tuning-log and adversary-probe evidence paths to that row. My Stage 3 re-recording also read 338.
- **O4-02:** `/health` `mode` stays `mock` in real mode, because `CERTGATE_MODE` governs only the CLI and dataset API (README table). This is correct, but a reader may find `"mode":"mock", "reader":"live"` surprising; consider one line in the README.

## 12. Carry-forward to the next candidate

If the next candidate's diff against `02c5c36b`, outside `evidence/`, touches only docs (`*.md`) and `test/`, then sections 2–9 carry forward. I will then re-run:
- the clean-clone suite;
- `check_claims.py`;
- my capability enumeration;
- `metrics-md --check`;
- the head-tree secret and path scans.

Any `src/`, `public/`, `api/`, `tools/` or package change voids the carry-forward.
