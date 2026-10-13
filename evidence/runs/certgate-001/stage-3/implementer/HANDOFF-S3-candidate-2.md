# Stage 3 candidate 2 (repair cycle 1 of 5): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 3
Repair task: analyst msgs f388f141 (part 1) … 497fb65b (part 13). Finding F3-01 and observation O3-01 come from the
auditor's pre-run findings, msg 40961585. Register R3.3 (SHA-256 `52dbd3c0…9788`); R2.2 and R1.6 still in force.
This record states what was done; it is not an acceptance. No push.

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `e4132c5173a5c19b9377ac449bf0a12d2554cc7d` |
| Tree | `3c691422d33f2c63e3809fdced7de01cbd1b516b` |
| Input revision (preserved, not rewritten) | candidate 1 `0a40432ccce2758d7da490cbcdb3be758e9faaa6` (+ evidence `d47428f`) |
| Repair commit | `e4132c5` (one commit on top of `d47428f`) |
| Prompt SHA-256 | `32fad2f980bcf755841d80bb2385d9601465f83b5b42c1b6c048f3bfe1cfb567`, unchanged |
| Reading path, prompt, rules | unchanged. The repair changes only the F1 snapshot of receipts (`pipeline.ts` `replyOnlyF1`/`notApplicableF1`, `types.ts`), the evaluation tools, one UI badge, the tests and the docs |

## F3-01: live receipts said endpoint "off"

| | |
|---|---|
| Reproduced on candidate 1 | yes. All 27 receipts in `results.json` had `f1.state: "off"`, "no endpoint data captured" |
| Cause | `run-eval.mjs` passed no F1 snapshot, so `pipeline.ts` fell back to `notApplicableF1("live")`, which returned `off` |
| Repair | New state `not_captured_in_evaluation_run` (`src/types.ts`) for a live reading made without an F1 probe, built by `replyOnlyF1` (`src/pipeline.ts`). The reply's own values are filled: model as reported, completion and total tokens, cost, reading time, tokens per second, and the X-RateLimit headers when recorded. Every other value is the string `not_captured_in_evaluation_run` and is listed in `f1.not_captured`; nothing is defaulted. GPU, ROCm and vLLM say "not exposed by the endpoint". A live receipt says `off` only when no endpoint was configured or reachable and nothing was read (C11 `endpoint_off` / `endpoint_not_configured`); the Stage 1 test for that case is kept. `run-eval.mjs` now stores the snapshot in every receipt at reading time, headers included. The UI badge for the state reads "F1 NOT CAPTURED AT READING TIME" |
| The 27-case run | **Option used: kept the run and regenerated the receipts offline** from data recorded at reading time (analyst's decision). `results.json` is preserved unchanged (`2a08b37d74f05196bb906381cd9decff75100df8bc6c6039519f527bb03c5cef`). `results.f1-regenerated.json` sits alongside it (`804176f48843bbf4b57559a6001b6a35220879937b88ada48da0e2dbdd7dc1e4`), produced by `node tools/evaluate/regenerate-receipts.mjs evaluation/runs/real-candidate-dd557fd`. Used: each case's `endpoint_response` (model, id, created, usage, cost, elapsed) and `run.json` host. The candidate-1 runner did not record X-RateLimit headers or GET /models / GET /usage at reading time, so those are `not_captured_in_evaluation_run`. **No re-run**, because the fix touches neither the reading path, nor the prompt, nor the rules |
| Regression test | `test/evaluation-receipts.test.ts`, 5 tests: a live pipeline reading without a probe is never `off` and carries the reply values; a failed live reading that reached the endpoint is not_captured (only the no-endpoint classes are off); recorded headers are carried and missing ones labelled; the runner and regeneration tool source; the committed regenerated file has 27 live receipts, none off, equals an offline regeneration from the preserved file, and differs from it only in `f1`. **Fails 5/5 on candidate 1** (`repair-1/f3-01-test-on-candidate-1.log`); passes on candidate 2 |

## O3-01: cg-028 wording

`metrics.json` `per_field_accuracy.wrong_causes` is derived from the recorded values by `tools/evaluate/metrics.mjs`.
For cg-028 `cev_printed` (model `0,41` with no unit, correct `0.41 %`), the cause it gives is **"value right
(decimal comma), unit missing"**. REPORT.md and README use the same words, and say the channel check correctly
disagreed (unit required), so the proposal was review. The metric still counts the field as wrong. The headline
figures are unchanged, and `public/figures.json` is byte-identical (`c0c8b6c4…`).

| Artifact | SHA-256 |
|---|---|
| results.json (preserved) | `2a08b37d74f05196bb906381cd9decff75100df8bc6c6039519f527bb03c5cef` |
| results.f1-regenerated.json | `804176f48843bbf4b57559a6001b6a35220879937b88ada48da0e2dbdd7dc1e4` |
| metrics.json | `726486ac3f4422b3fdb473f8f769bff6fb15dd51a62b0a74d8a6d7361fcdb75d` |
| REPORT.md | `680b65069bbb5819bc052944a7f468f0df9cf9143c1be3a577f298c74ffb9a5e` |
| public/figures.json (unchanged) | `c0c8b6c404fab43470e376b13961dbece04c24f9e2f1674eb80542e5f8e3b705` |

## Verification on a clean clone of e4132c5 (logs in `repair-1/`)

- `clean-clone-tests.log`: `npm ci`, build, `npx vitest run` with MODEL_* unset: **274/274** pass (269 + 5 new).
- `docker-network-none.log`: `docker build --no-cache`; `docker run --rm --network none … npx vitest run`: **274/274**.
- `browser-checks.log`: `node test/browser/ui-checks.mjs`: 15 PASS / 0 FAIL.
- Endpoint calls for this repair: **0**.

Everything else in the candidate 1 record (`HANDOFF-S3-candidate-1.md`) still holds: evaluation figures, stories,
row mapping and known gaps.

Time: repair received 18:17Z; candidate 2 frozen 18:26Z.
