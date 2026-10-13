# Stage 3 evaluation: real model, candidate dd557fd

Artifacts in this directory: `run.json` (candidate commit, prompt SHA-256, cases, start and end), `usage-before.json`,
`usage-after.json`, `results.json` (one record per case: proposal, expected proposal and its source, reasons,
per-field reading against the correct reading, attempts, endpoint response identity and usage, full receipt) and
`metrics.json`. The metrics are computed only from those files: `node tools/evaluate/metrics.mjs <this dir>` rewrites
`metrics.json` and `node tools/evaluate/figures.mjs <this dir>` rewrites `public/figures.json` (S3-19).

| | |
|---|---|
| Command | `npm run build && node tools/evaluate/run-eval.mjs --out evaluation/runs/real-candidate-dd557fd` |
| Candidate commit | `dd557fd2395db09566dc193c69e4dc30600ef7db` (product tree clean at run time) |
| Prompt SHA-256 | `32fad2f980bcf755841d80bb2385d9601465f83b5b42c1b6c048f3bfe1cfb567` (frozen since tuning; C-13) |
| Run | 2026-10-13T17:28:48.044Z → 17:49:07.371Z (after commit 31da371, C-20); 2 in flight; temperature 0 |
| Endpoint | AMD Token Factory, host `developer.amd.com.cn`; model requested `Qwen3.8-27B`, reported `self-dploy/Qwen3.8-27B` in all 27 replies |
| Cases | cg-004 … cg-030 (27). Excluded as tuning cases: cg-001, cg-002, cg-003 (`evaluation/tuning-exclusions.json`, D3-03) |
| Expectations | `data/expected/<id>.json`, overridden for cg-016, cg-017, cg-018, cg-021, cg-023 … cg-027 by the hand-written `evaluation/expectations-real-run.json` (D3-04, C-16), committed before the run |
| Outcome | completed, not BLOCKED; 27 of 27 processed; 0 failures; 0 retries |

## Headline (D3-05 as amended by C-08 … C-11)

| Metric | Value | Cases |
|---|---|---|
| **False conforming, FC-broad** (release where expected ≠ release) | **0 / 18** | — |
| False conforming, FC-strict (release where expected = block) | 0 / 6 | — |
| FC-broad over all evaluated cases | 0 / 27 | — |
| Non-conformities caught (expected block, not released) | 6 / 6 | cg-005, cg-006, cg-007, cg-012, cg-020, cg-021 |
| … of which proposed block | 6 / 6 | same |
| Proposal equal to the expected proposal | 27 / 27 | all |
| Rule abstention (review, status processed) | 12 / 27 | cg-010, cg-011, cg-013, cg-015, cg-016, cg-017, cg-019, cg-022, cg-025, cg-028, cg-029, cg-030 |
| Failure (status error), by class | 0 / 27 | — |
| Seconds per certificate (processed, case start to proposal) | mean 89.6 s, median 80.6 s, min 52.0 s, max 207.7 s, N = 27 | — |
| Latency per request | mean 89 500 ms, median 80 554 ms, N = 27 requests | — |
| Tokens per certificate | total mean 4 234 (median 4 165); completion mean 1 441; reasoning mean 552; N = 27 | — |
| Cost per certificate (cost reported by the endpoint; Token Factory credits are free and have no monetary value) | mean 0.00020529, median 0.00020112, N = 27, unknown 0 | — |
| Retries | 0 in 27 requests | — |

No false conforming, so no root-cause line is owed (C-08); C-19 (any false conforming is a REJECT finding) is not
triggered by this run. There is no proposal mismatch.

## Per-field accuracy (model channel against the correct reading; C-10)

22 critical fields × 27 processed cases = 594 field readings.

| Category | Count |
|---|---|
| correct (value and unit equal the correct reading) | 591 / 594 |
| correct unknown (correct reading illegible, model said unknown) | 1 / 594 — cg-017 `heat_or_lot` (smudged heat on a scan) |
| correct absent (not on the document, model said absent) | 1 / 594 — cg-028 `inspection_stamp` |
| wrong | 1 / 594 — cg-028 `cev_printed`: model `0,41`, correct `0.41` |
| invented (confident value where the field is absent) | 0 / 594 |
| confident-on-illegible (confident value where the correct reading is illegible) | 0 / 594 |

cg-028 `cev_printed`: the model copied the printed CEV with a decimal comma. The product does not normalise a
model's decimal separator. The model-free text layer read `0.41`, the two channels disagreed, and the case got
`CHANNEL_DISAGREE:cev_printed` + `CRITICAL_UNKNOWN:cev_printed`, which means review (it is also `STAMP_MISSING`,
its planted fault). The one wrong reading was caught by the second channel, as designed (I3).

## GET /usage reconciliation (C-15)

| | |
|---|---|
| `daily_cost_used_usd` before (17:28:48Z) | 0.002272235229611397 |
| `daily_cost_used_usd` after (17:49:07Z) | 0.00781511701643467 |
| Delta | 0.00554288 |
| Sum of `usage.cost` over the 27 replies | 0.00554288 |
| Difference | 0 |

GET /usage reports the key's daily cost (reset 2026-10-14T16:00:00Z, Asia/Shanghai). The two GET /usage reads do
not appear in that cost. No other seat held the endpoint lease during the run (D3-02).

## Coverage under the real reader (C-20)

For each planted case, `evaluation/expectations-real-run.json` says which acceptance row the real run still covers:

- cg-016, cg-017: C7 / D1-04 (rule-driven scan review). Still covered: both were review with `NO_SECOND_CHANNEL`.
  cg-017's model marked the smudged heat unknown.
- cg-018: C8 (channel disagreement) is **not** covered by the real run, because the misread was planted in the
  mock only. It stays covered by the mock dataset case and the channel tests. In this run cg-018 covers C1:
  Mn 1.43 was read correctly and the case was released. The real run also showed C8 on its own, at cg-028 (above).
- cg-021: C10 (an approval instruction printed in the document). Still covered: the real model read the page image
  with the instruction, and the case was blocked on `RULE_FAIL:Si`.
- cg-023 … cg-027: the C11 classes (endpoint_off, timeout, 429, 5xx, invalid_json) are **not** covered by the
  real run: no failure happened. They stay covered by the stub and recorded-fixture tests (`test/web.test.ts`,
  `test/live-reader.test.ts`). In this run these cases cover C1 (cg-023, cg-024, cg-026, cg-027 released) and C7
  (cg-025, scan, review).

## Known limitations seen in Stage 3

- **cg-003 (tuning case, outside this evaluation; R3.3 C-23).** On the ambiguous scan, the model reads the
  smudged ReH digit confidently as **338** (true 358). It did so in 2 of 2 completed tuning reads and in the
  recorded story run (2026-10-13T17:52:09Z). The rules then propose **block** (`RULE_FAIL:ReH`, `NO_SECOND_CHANNEL`),
  not the dataset's `review`. This is a proposal mismatch caused by a model misread of an illegible digit, and it
  is not false conforming. The prompt was not changed to steer this case. The scan still needs a person to confirm
  every critical field before any release (I3, A-21). In per-field terms this is confident-on-illegible.
- Readings are slow: 52 s to 208 s per certificate. Live reading therefore runs from the container. It is
  unavailable on the deployed site (S3-24, C-07).
- One run at temperature 0. Repeat runs (the auditor's) may differ. Differences are tabulated, not assumed away (C-12).
- Code changed after the run, without touching the reading path, the prompt or the rules: in-flight de-duplication
  of the F1 probe (C-06), the "as reported by the model" location label in the view and in the receipt `values`
  (C-03), the upload policy and notice (C-02), the deployed-site gate (C-07), the stories and the UI. The receipts in
  `results.json` predate the C-03 `location` field. The proposals, reasons and readings do not depend on these
  changes, which the auditor's re-run on the frozen candidate can confirm.
- `metrics.json` was recomputed offline after the run with a fix to number formatting in `tools/evaluate/metrics.mjs`.
  The run had printed integer means with their trailing zeros stripped, for example a latency mean of "895" for
  89500. Every numerator and denominator is unchanged.
