# Auditor verdict, Stage 11 candidate 1: ACCEPTED

- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Checks run 12:04:48Z–12:07:39Z on 2026-10-16.
- **Candidate:** `4cb4e72c89ef39eb3321ac8e05a4d17ae6a9a753`, tree `d6923edc382f113f2a5ea5365bbb12ff96b85849`, branch `s11-impl`. It is one commit on 55b217d.
- **Rules:** [T11-RULES.md](T11-RULES.md); dispatch 9 (msg 7bf7dbb1); R11.0 (msg d233dad7).
- **Clone:** fresh, in this seat's scratchpad (`s11/c1`), clean tree. node v24.19.0, npm 11.17.0, git 2.55.0.windows.3.

**Result: ACCEPTED.** T11-01…T11-06 pass.

| Rule | Result | Evidence |
|---|---|---|
| T11-01 Byte identity | PASS | `git diff --stat 55b217d 4cb4e72`: only `claims-map.json`, `docs/submission/lablab.md` and `test/stage10-docs.test.ts`. README.md and CLAIMS.md are unchanged |
| T11-02 Exact text | PASS | The Long description is **byte-equal** to `long-description-expected.txt` (1983 code points, LF, no CR in the file). Title, short description, Additional Information and the file head are each identical to 55b217d (field-by-field comparison) |
| T11-03 Figures | PASS | Reference recomputed by the auditor from `real-gemma-04100b9/results.json` at 11:59:46Z: FC-broad 0/18, equal 26/27, fields 591/594, equal to `metrics.json`. The new test computes the same from the run, checks `metrics.json`, the METRICS.md rows and `endpoint_response.model` = `self-dploy/Gemma-4-31B-IT`, and builds the lablab sentence from the computed values |
| T11-04 Limits | PASS | Title 45, short 254, long 1983 code points |
| T11-05 Suite and claims | PASS | npm ci, typecheck and build exit 0. `npx vitest run` at 12:05:13Z and 12:05:45Z: 28 files, **617 passed (617)**, exit 0, 0 skipped. Three `--check` commands exit 0. Unmapped: empty. Stale outside the lablab CLI listing: 0. The prize check is part of the suite and passes |
| T11-06 Secrets | PASS | `t10_secrets.mjs`, 12:07:39Z, exit 0: changed files (3), delta 55b217d..4cb4e72, commit messages, 1666 tracked blobs: 0 on every needle |

## Hunks

**claims-map.json:** the two old lablab sentences are removed (C-04, C-104), and three are added: the changed sentences under C-04 and C-104, and the Gemma sentence under C-70, the Gemma-figures row.

**test/stage10-docs.test.ts:**
1. The lablab cg-004 string is replaced by its short form. The README's full cg-004 assertion, with the recorded reasons and the `wrong` field, is unchanged.
2. In the content list, "the evaluated model behind every figure below" is replaced by two exact strings: the Qwen run labels, and the live-reading Gemma sentence. The README's Z-02 check is untouched.
3. A new test computes the Gemma figures, as described under T11-03.

None of these loosens a check.

## Auditor mutants (`npx vitest run test/stage10-docs.test.ts`, 12:07:10Z–12:07:28Z; lablab.md restored after each run, tree clean)

| Id | Mutation in lablab.md | Result |
|---|---|---|
| C1 | Gemma false conforming 0 → 1 of 18 | killed |
| C2 | Gemma 26 → 27 of 27 as expected | killed |
| C3 | Gemma 591 → 592 of 594 fields | killed |
| C4 | the comparison sentence's model renamed to Qwen3.8-27B | killed |
| C5 | "offers Gemma-4-31B-IT and experimental models" → "offers other models" | killed |

## Observation (not blocking)

The changed live-reading sentence is mapped to C-04, whose proof covers reading page images, not the live model list. The sentence it replaces had the same mapping, which was accepted in Stage 10. The new test now asserts the sentence exactly. CLAIMS.md is outside dispatch 9's file list, so the row itself is left unchanged.

## Decision

**ACCEPTED** on `4cb4e72c89ef39eb3321ac8e05a4d17ae6a9a753` (tree `d6923edc`), repair cycle 0 of 1. The adversary's 12 mutants were running at the time of this verdict. A survivor re-opens it.
