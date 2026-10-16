# Auditor verdict, Stage 10 candidate 3: ACCEPTED

- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Checks run 11:44:36Z–11:46:49Z on 2026-10-16.
- **Candidate:** `3b46b1d143f578abdc979eb304fd9d1333a59f86`, tree `fba52582f9f9c476b3ff9c4870a0a4c00f992c5a`, branch `s10-impl`. It is one commit on 18dd217 (candidate 2, accepted and pushed as GitHub main 40ea1ae).
- **Reason:** the operator's BLOCKER (auditor msg eb158d80): the lablab form takes a long description of **600–2000 characters**, and candidate 2's was 2201. Ruling R10.5 (analyst msg efa2e055) re-opened the stage for repair cycle 2 of 2, deletion only.
- **Rule change:** T10-05's "long description ≥ 100 words" is replaced by **600 ≤ code points ≤ 2000** (R10.5). The word count is for information only.
- **Clone:** fresh, in this seat's scratchpad (`s10/c3`), clean tree. Environment as for candidate 2 (node v24.19.0, npm 11.17.0, git 2.55.0.windows.3).

**Result: ACCEPTED.** T10-01…T10-08 pass, with T10-05 as amended.

## Rules

| Rule | Result | Evidence |
|---|---|---|
| T10-01 Byte identity | PASS | Product paths, `tools/`, `docs/screenshots/`, package/config files vs 4e5b9fe: empty diff. Changes vs 18dd217: `claims-map.json` (−15), `docs/submission/lablab.md` (3 sentences deleted), `test/stage10-docs.test.ts`. README.md and CLAIMS.md are unchanged |
| T10-02 Suite and checks | PASS | npm ci, typecheck and build exit 0. `npx vitest run` at 11:44:47Z and 11:45:18Z: 28 files, 616 passed (616), exit 0, 0 skipped. Three `--check` commands exit 0. Unmapped: empty. Stale outside lablab.md: 0 |
| T10-03 Figures | PASS | Unchanged from candidate 2, apart from the three deleted lablab sentences. Every figure that remains equals the reference table |
| T10-04 Reading times | PASS | lablab.md now has 0 durations. The README is unchanged |
| T10-05 Limits (amended) | PASS | Title 45, short 254, **long 1980 code points** (LF, no CR in the file), 336 words |
| T10-06 Judge read | PASS | The README is unchanged from candidate 2. The scan sentence is still in the README (whitespace-flattened check: present) |
| T10-07 Submission text | PASS | Kept: EN 10204 3.1, "a person decides", the utility figures with runs, the second-channel scope, the process sentence, Additional Information. No prize word |
| T10-08 Secrets | PASS | `t10_secrets.mjs`, 11:46:49Z, exit 0, all needles available. Changed files (11), delta 4e5b9fe..3b46b1d, commit messages, 1656 tracked blobs: 0 on every needle |

**The text the operator pastes.** The committed Long description is **byte-equal** to the text this seat gave the operator (`scratchpad/long-2000.txt`, built by deleting the same three sentences). SHA-256 of `docs/submission/lablab.md`: `1eeeb305d0f4b621e3de0866e0e10c24aedb2bf3a1f27037799353494ed2391f`, equal to the implementer's handoff.

## Hunks

**claims-map.json:** removes exactly the three lablab entries (C-01, C-19, C-105) of the deleted sentences. The README entries of those rows remain.

**test/stage10-docs.test.ts:**
1. ≥ 100 words is replaced by 600 ≤ code points ≤ 2000 (R10.5).
2. The scan sentence is required in the README only. The loop that makes every scan count name its set still covers both files.
3. The lablab reading-time `toContain` is replaced by `not.toMatch(DURATION)`, which is stricter: lablab.md must now carry no duration at all.

## Auditor mutants (`npx vitest run test/stage10-docs.test.ts`; files restored after each run, tree clean)

| Id | Mutation | Result |
|---|---|---|
| B1 | long description at 2001 code points | killed ("expected 2001 to be less than or equal to 2000") |
| B1′ | long description at 2000 code points (boundary, in range) | passes, as it must. A first attempt at B1 came out at 2000 and was re-made |
| B2 | long description cut to 599 code points | killed (among others, "expected 599 to be greater than or equal to 600") |
| B3 | a reading time put back into lablab.md | killed |
| B4 | the scan sentence removed from the README | killed |

**Adversary:** its 29-mutant result on 18dd217 has not reached this seat. Candidate 3 changes only lablab.md, the claims entries and three test hunks, all covered by B1–B4.

## Decision

**ACCEPTED.** Stage 10 is accepted on `3b46b1d143f578abdc979eb304fd9d1333a59f86` (tree `fba52582`), after repair cycle 2 of 2. It supersedes the acceptance of 18dd217 for the push. 18dd217 stays on record.
