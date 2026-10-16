# Auditor verdict, Stage 10 candidate 2: ACCEPTED

- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Checks run 11:03:15Z–11:05:54Z on 2026-10-16.
- **Candidate:** `18dd217893e87f98987e4cdb3caea0ac4fd79fc3`, tree `5c5ecf2cf55d1cb2eac2fc16000ac35f676e59b2`, branch `s10-impl`.
  - History: ee2328a (candidate 1, untouched), then merge 0a81c2f of main 31d21a8 (`evidence/` only), then 18dd217.
  - ee2328a and 31d21a8 are ancestors.
- **Rules:** [T10-RULES.md](T10-RULES.md), register R10.0–R10.4. The previous verdict is [VERDICT-S10-candidate-1.md](VERDICT-S10-candidate-1.md) (F10-A01, F10-A02).
- **Environment:** Windows 11 Pro 10.0.26220, node v24.19.0, npm 11.17.0, git 2.55.0.windows.3.
- **Clone:** a fresh clone at the candidate in this seat's scratchpad (`s10/c2`), with a clean tree. No other seat's process, clone or log was used.

**Result: ACCEPTED.** F10-A01 and F10-A02 are repaired, and O10-A01 and O10-A02 are addressed. T10-01…T10-08 all pass.

## Rules

| Rule | Result | Evidence |
|---|---|---|
| T10-01 Byte identity | PASS | `git diff --stat 4e5b9fe 18dd217` over `src public api data config evaluation tools docs/screenshots`, `package.json`, `package-lock.json`, `vercel.json`, `Dockerfile`, `tsconfig.json`, `vitest.config.ts`: empty. The 11 changed paths are CLAIMS.md, README.md, claims-map.json, docs/submission/lablab.md, the three docs test files, and `evidence/` (the merge of main) |
| T10-02 Suite and checks | PASS | `npm ci` exit 0 (11:03:15Z–11:03:22Z); typecheck exit 0; build exit 0; `npx vitest run` at 11:03:37Z and 11:04:07Z: 28 files, **616 passed (616)**, exit 0, 0 failed, 0 skipped. `metrics-md.mjs`, `previews.mjs` and `diagrams.mjs --check`: exit 0. `claims-units.mjs --unmapped`: empty. `--stale`: 30 entries, all `docs/submission/lablab.md`, which CLAIMS.md:11–13 now explains (O10-A01). 0 non-lablab stale entries. The test hunks since ee2328a are in `test/stage10-docs.test.ts` only (see below). No other test file changed since ee2328a |
| T10-03 Figures | PASS | Every value equals the reference table. **F10-A01 repaired:** "sent to review without need **0/9** (implementer run) and **1/9** (auditor's run, cg-004: …)". Each figure carries its run label in its own clause, and the test asserts that |
| T10-04 Reading time names its model | PASS | `tools/t10_text.mjs` (11:05:06Z): same result as candidate 1. The 60/210/300 s limits are Y-07 exempt; the timing row is headed by its runs and names Qwen3.8-27B; lablab.md has 1 duration, with model and run |
| T10-05 Length limits | PASS | title 45 code points, short description 254, long description 375 words. lablab.md is unchanged since ee2328a |
| T10-06 Judge read | PASS | No codes, "dispatch", "the band" or "the human". `V4.1` and `V2.6` are parts of model names (allowed). **F10-A02 repaired:** the new line "Stage 7 (documentation, visuals and the original certificate): candidate 1 rejected, because a timing-sensitive guard test was flaky; repaired in the tests only, and candidate `cf97dfad` accepted, 1 of 3 repair cycles." It matches STAGE-REGISTER.md:32 and `stage-7/auditor/VERDICT-S7-FINAL.md` (R7.1, 1 of 3) |
| T10-07 Submission text | PASS | Unchanged since ee2328a. The sentence "mutation checks at every stage" is now supported: the README gives mutation lines for Stages 1–9, each checked against its register row (O10-A02). Stage 5 (21 + 4, adversary 34/39 with 5 non-binding), 7 (13/13, 19/19), 8 (25/25, 29/29) and 9 (20/20) equal STAGE-REGISTER.md |
| T10-08 Secrets | PASS | `tools/t10_secrets.mjs`, 11:05:19Z, exit 0, all five needles available. Changed files (11), history delta 4e5b9fe..18dd217, commit messages, every tracked blob at 18dd217 (1656): 0 for each of base-URL host+path, key, SHA-256(key), access code, SHA-256(code) |

## Test hunks since ee2328a (`test/stage10-docs.test.ts`, +44 −3)

1. **The utility assertion** now requires `**0/9** (implementer run) and **1/9** (auditor's run, cg-004:` (F10-A01). It is stricter.
2. **The cg-004 assertion** drops the leading "(" because the sentence now opens "(auditor's run, cg-004: …". The full cg-004 text is still asserted, and hunk 1 asserts the "(auditor's run, cg-004:" prefix. The property is unchanged, so this is not a widening.
3. **The Z-01 test:**
   - The hard-coded list is replaced by the set of stages the register marks REJECTED.
   - That set must equal the set of stages whose `stage-N/auditor/VERDICT-S*-candidate-*.md` decision line says REJECTED, with at least 8 such stages.
   - So a stage missing from the register now fails the test.
   - Note: `^stage-\d$` and `^\| \d \| ` match one-digit stages only. Stage 10 is not yet a register row. A future check on two-digit stages would need `\d+`.
4. **A new test, "mutation checks at every stage":**
   - every accepted stage 1–9 has a "- Stage N: " mutation line;
   - the figures for Stages 5, 7, 8 and 9 are each found in that stage's register row;
   - lablab.md keeps "mutation checks at every stage".

## Auditor mutants on candidate 2 (11:05:44Z–11:05:54Z, `npx vitest run test/stage10-docs.test.ts`; README restored after each run, tree clean)

| Id | Mutation | Result |
|---|---|---|
| A1 | swap the run labels on 0/9 and 1/9 | killed (1 failed) |
| A2 | delete the Stage 7 rejection line | killed (1 failed) |
| A3 | delete the Stage 7 mutation line | killed (1 failed) |
| A4 | Stage 8 "25 of 25" → "24 of 25" | killed (1 failed) |

## Adversary

- **On candidate 1** (msg 297b112f): 27/27 mutants killed.
- **On candidate 2:** the run of its 29 mutants (the 27 plus two, label swap and Stage 7 line) started after this seat's HEAVY WORK DONE. Its result, when posted, is recorded in the room. A1 and A2 above independently cover its two new mutants.

## Decision

**ACCEPTED.** Stage 10 is accepted on `18dd217893e87f98987e4cdb3caea0ac4fd79fc3` (tree `5c5ecf2c`), after repair cycle 1 of 2.

The verdict is bound to that commit. Before a push, the human merges or fast-forwards main to it; the band does not push.
