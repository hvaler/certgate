# Stage 4 candidate 2 (repair cycle 1 of 5): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 4
Repair task: analyst msgs ece8ee3f (part 1) … 68c21109 (part 14) and addendum 009d07df. Findings: auditor verdict
d24985d8 (F4-01, O4-01, O4-02) and adversary msg 646f4b1f (ADV-S4-F01…F05, F-06 extension). Register R4.6
R4.7 (commit a2440d0, SHA-256 `29ad90ae…4c06`; R4.7 adds E-10, the F-06 extension). This record states what was done; it is
not an acceptance. **No push. No endpoint calls.**

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `ac738ef3ebb4675760f1b24c10964da49fd79067` |
| Tree | `72ebab2f6e65c54349581726d615332ade7f0751` |
| Input revision (preserved, not rewritten) | candidate 1 `02c5c36b79f35d8a1c13955411b6b17f80a84b22` (+ evidence `d51bfbe`) |
| Repair commit | `ac738ef` |
| **Diff vs 02c5c36b, excluding evidence** | **docs:** `README.md`, `DEPLOY.md`, `CLAIMS.md`, `claims-map.json` (new) · **tests:** `test/docs.test.ts`, `test/stage4-claims.test.ts` (new) · **test tooling:** `tools/claims-units.mjs` (new; reads the docs and splits them into sentences, used by the test). `git diff --stat 02c5c36 ac738ef -- src public api` is **empty**: no product change |

## F4-01: claims table incomplete

| Item | Resolution | CLAIMS row | Proof |
|---|---|---|---|
| (a) input limits 10 MiB / 1 MiB / 256 KiB | row and two new tests | **C-50** | "rejects an oversized file"; "delivery note: over 1 MiB is rejected…"; "…over 256 KiB is rejected by the web upload with 413"; the web upload limit test |
| (b) LIVE_READS_PER_HOUR fail closed | row | **C-51** | "status: disabled when LIVE_READS_PER_HOUR is unset, 0 or invalid" |
| (c) LIVE_CODE_FAILURES_PER_HOUR default 5 | row and new test | **C-52** | "without LIVE_CODE_FAILURES_PER_HOUR, 5 wrong codes are refused (403) and the 6th is rejected (429)" |
| (d) CLI exit codes 0, 2, 1 | row and new test: exit 1 from a dataset directory whose spec is not valid JSON (`CERTGATE_DATA_DIR`, no product change) | **C-53** | "0 processed, 2 input rejected, 1 internal error…" |
| (e) unit-less confirmation | row and new test | **C-54** | "ReH 358 confirmed with no unit is MPa; Mn 1.43 with no unit is %" |
| (f) LIVE_WINDOWS shown as text | row and new tests: status text and the rendered landing, plus the unset case | **C-55** | "configured: the status carries the text as is, and the landing shows it…"; "unset: no window is announced" |
| (g) "judge-mode routes answer in well under a second" | **removed** from DEPLOY.md | — | — |
| Own complete pass | **structural**: `claims-map.json` maps all 318 units of README, DEPLOY.md and METRICS.md (sentences, list items, table rows, as split by `tools/claims-units.mjs`). 270 go to CLAIMS rows, 48 to "none: <reason>". Test "every sentence of README, DEPLOY.md and METRICS.md is in the claims map…" fails on any unmapped, changed or stale sentence, or an unknown row | C-50…**C-66** added (C-56 provenance facts, C-57 reading time, C-58 screens, C-59 API routes, C-60 shared service, C-61 prompt examples, C-62 text-layer layouts, C-63 reason codes, C-64 how built, C-65 MIT, C-66 reporting rules) | `test/docs.test.ts` |
| O4-01 | C-38 now also cites `evaluation/dev-calls.jsonl` and REPORT.md (the tuning reads) and names the adversary probe | C-38 | — |
| O4-02 | README explains the two `/health` fields (`mode` vs `reader`, e.g. `"mode": "mock", "reader": "live"` in real mode) | C-44 | /health tests |

## Adversary findings (msg 646f4b1f)

| Finding | Repair (tests and docs only) |
|---|---|
| ADV-S4-F01 figures outside the README table | sentence map (any changed figure changes its sentence) **plus** explicit checks: the "(52–208 s …)" range equals round(min)/round(max) of the implementer run; the "0 retries and 0 failures" sentence against both runs' metrics |
| ADV-S4-F02 sentences not tied to rows | the sentence map (above) |
| ADV-S4-F03 secret patterns | `sk-[A-Za-z0-9_-]{16,}`; `[A-Z0-9_]*(KEY\|TOKEN\|SECRET\|PASSWORD\|CODE)[ \t]*[=:]…` (the README's test-stub value `stub-key` is excluded by name); a high-entropy rule (24+ `[A-Za-z0-9_-]` with ≥ 4 letter/digit alternations, so file names like `BLOCKER-host-memory-1906Z` pass) |
| ADV-S4-F04 provenance facts | test "README provenance facts equal the run artifacts and the publisher record": the README commits are checked against each `run.json` `candidate_commit`, the reported model against `results.json` of both runs, and the licence and publisher against `docs/sources/model.md` |
| ADV-S4-F05 /health without MODEL_ID | test "MODEL_BASE_URL set without MODEL_ID reports reader off" |
| F-06 extension (R4.7) | grep adds `vercel\.app`, `hosted demo` and `https?://(?!localhost\|127\.\|vercel\.com/docs/)…(vercel\|netlify)`. **Deviation:** the cited documentation URL `https://vercel.com/docs/functions/limitations` in DEPLOY.md is exempt; without that, the rule as written would flag a required citation (F-10) |

## Mutant kills (throwaway branches `impl-mut/<id>-on-ac738ef` in a scratch clone, never merged)

My re-creation of each surviving mutant as an exact replacement. Each line gives the full-suite result and the killing tests (`repair-1/mutants-stage4.log`).

| Mutant | Suite | Killed by |
|---|---|---|
| S4M11 (52–208 → 12–48 s) | 2 failed / 311 | sentence map; reading-time range |
| S4M11b ("…and every proposal was as expected") | 2 failed / 311 | sentence map; retry and failure sentence |
| S4M12 (new list item "Detects forged inspection stamps…") | 1 failed / 312 | sentence map |
| S4M13 (`MODEL_API_KEY=sk-proj-…` in DEPLOY.md) | 2 failed / 311 | **secret-pattern test**; sentence map |
| S4M14 (`tfk_…` in a DEPLOY table cell) | 3 failed / 310 | **secret-pattern test**; F-05 do-not-set check; sentence map |
| S4M20 (implementer commit → 5c904693) | 2 failed / 311 | provenance facts; sentence map |
| S4M21 (licence → MIT) | 2 failed / 311 | provenance facts; sentence map |
| S4M22 (reported model → Qwen3.8-27B) | 2 failed / 311 | provenance facts; sentence map |
| S4M04 (`/health` without the MODEL_ID condition) | 1 failed / 312 | /health without MODEL_ID |
| S4M18s ("Try the hosted demo: https://certgate.vercel.app …") | 2 failed / 311 | forbidden-claim grep; sentence map |

The first S4M18s attempt did not apply, because its pattern wraps across a README line. The log records this and
then the re-anchored run.

## Verification (logs in `repair-1/`)

- `clean-clone-tests.log`: clean checkout of ac738ef, `npm ci`, build, `npx vitest run` with MODEL_* unset: **313/313**; METRICS matches; **0 unmapped sentences**.
- Docker and browser not re-run: no product, packaging or `public/` change since candidate 1, whose image (288 passed / 12 skipped) and browser (15/0) results stand. The new tests run in the image too. `stage4-claims.test.ts` is not repository-only; `docs.test.ts` skips there as ruled (msg f472c111).

Time: repair received about 20:50Z; candidate 2 frozen about 21:06Z.
