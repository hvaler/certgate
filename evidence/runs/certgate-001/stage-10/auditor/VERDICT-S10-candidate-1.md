# Auditor verdict, Stage 10 candidate 1: REJECTED

- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Verdict written 2026-10-16 10:51Z.
- **Candidate:** `ee2328a987b8912c1daca341284874adb21edcd8`, tree `59f99871b4f0a2cd1d3b0022064996576517f603`, branch `s10-impl`.
- **Rules:** [T10-RULES.md](T10-RULES.md) (adopted as X-T10), register R10.0–R10.3 (X-01…X-14, Y-01…Y-08, Z-01…Z-10).
- **Byte-identity reference:** `4e5b9fe7b123ef3090daec7aeffddb51ceb2a548`.
- **Environment:** Windows 11 Pro 10.0.26220, node v24.19.0, git 2.55.0.windows.3.
- **Clone:** a fresh clone of the repository at the candidate, in this seat's scratchpad (`s10/c1`); `npm ci` finished at 10:42:55Z (mtime of `node_modules/.package-lock.json`). No other seat's process, clone or log was used.

**Result: REJECTED on F10-A01 and F10-A02.** Both are text-only repairs. Every figure equals the artifacts, every reading time names its model, the length limits hold, and no secret or prize claim was found.

## Rules

| Rule | Result | Evidence |
|---|---|---|
| T10-01 Byte identity | PASS | `git diff --stat 4e5b9fe ee2328a` over `src/ public/ api/ data/ config/ evaluation/ tools/ docs/screenshots/`, the package files, `vercel.json`, `Dockerfile`, `tsconfig.json`, `vitest.config.ts`: empty. Changed paths: CLAIMS.md, README.md, claims-map.json, docs/submission/lablab.md (new), test/docs.test.ts, test/stage10-docs.test.ts (new), test/stage5-gemma.test.ts. 4e5b9fe is an ancestor |
| T10-02 Suite and checks | PASS, with observation O10-A01 | `npx vitest run` ×2: 615 passed (615), exit 0, 0 failed, 0 skipped (the machine times of the two runs were not kept); build exit 0; metrics-md, previews and diagrams `--check` exit 0; claims-units unmapped empty. Existing test hunks: docs.test `expect` 68→73, stage5-gemma 65→65; each hunk reviewed (URL count 1→3 per Y-05; "52–208 s per certificate in the implementer run"; "In the two evaluation runs"; the Gemma seconds row labelled with its model). None loosened |
| T10-03 Figures | **FAIL: F10-A01** | Every value equals the reference table (recomputed at 4e5b9fe from the three `results.json`). But two top-block figures carry no run label |
| T10-04 Reading time names its model | PASS | `tools/t10_text.mjs`: README 7 duration sentences/rows. 4 without a model are the limits 60 s, 210 s and 300 s (Y-07, reviewed: the probe limit at README:85, the model-list check at :431 and :515, the attempt and function limits at :524 and :531–532). The 89.6/80.6 and 77.1/76.9 row (README:118) names Qwen3.8-27B, and its columns are headed "Implementer run" and "Auditor's independent run". lablab: 1 duration, with model and run |
| T10-05 Length limits | PASS | `tools/t10_text.mjs` (10:51:52Z): title 45 code points (≤ 50), short description 254 (≤ 255), long description 375 words (≥ 100). The checker's first run counted only the long description's first paragraph (44): its section regex ended at the first line end. That was fixed in the tool, and the 375 was cross-checked with a heading-to-heading split |
| T10-06 Judge read | **FAIL: F10-A02** | Jargon grep: no O/F/OI-S codes, no I1–I7, no 03-DISENO, no "dispatch", "the band" or "the human". Register-id regex hits only `V4.1` and `V2.6`, which are parts of model names (DeepSeek-V4.1-Flash, MiMo-V2.6-Flash): allowed. "One endpoint and one model" is gone; the dated re-listing sentence (04:21:59Z, 04:23:34.429Z) is present. The section "How it was built and verified" has no line for Stage 7 |
| T10-07 Submission text | PASS | EN 10204 3.1, "a person decides", the utility figures with runs, the second-channel scope, one process sentence, Additional Information. Prize-family words: none |
| T10-08 Secrets | PASS | `tools/t10_secrets.mjs` (values compared in memory, counts only, run 10:50:06Z, exit 0). All five needles were available. Changed files (7), history delta 4e5b9fe..ee2328a (patches), commit messages, every tracked blob at ee2328a (1653): base-URL host+path 0, key 0, SHA-256(key) 0, access code 0, SHA-256(code) 0 |

## Findings

### F10-A01 (T10-03, Z-06): two top-block figures are matched to their runs by order alone

README.md, line 6 of the file (the utility line of the top block):

> sent to review without need **0/9** and **1/9** (cg-004: …)

The clause has no run label. A reader can only infer from the order of the earlier clause that 0/9 is the implementer run and 1/9 the auditor's. Z-06 says: "Each figure is matched **with its run label in the same clause**, never by order alone." T10-03 says each figure must name its run.

lablab.md already does it right: "0 of 9 in the implementer run and 1 of 9 in the auditor's run".

**Repair:** label both figures in the clause. For example, "sent to review without need **0/9** (implementer run) and **1/9** (auditor's run, cg-004: …)". Extend the test to assert the labels.

### F10-A02 (Z-01, T10-06): Stage 7 had a rejection and has no line

Z-01 says "How it was built and verified" keeps **one plain-word line per stage with a rejection**. Stage 7 had one:
- `evidence/runs/certgate-001/stage-7/auditor/VERDICT-S7-candidate-1-local.md`: "Stage 7 candidate 1 … REJECTED on F7-01 only", a flaky guard test;
- `VERDICT-S7-FINAL.md`: "Stage 7 is ACCEPTED on cf97dfad".

The README table covers Stages 1–6, and "Later stages" covers 8 and 9. Stage 7 is absent. The test misses it because STAGE-REGISTER.md has no Stage 7 row, and the test hardcodes the expected set `["1","2","3","4","5","6","8","9"]` (`test/stage10-docs.test.ts:212`).

**Repair:**
- add a plain-word Stage 7 line (documentation, visuals and the original certificate: candidate 1 rejected for a flaky guard test; `cf97dfad` accepted);
- make the test include Stage 7, either from the stage-7 verdict files or by an explicit, commented addition.

The missing STAGE-REGISTER row for Stage 7 is the analyst's to record, if the analyst agrees.

## Observations (not blocking)

- **O10-A01, claims-units `--stale`.** `node tools/claims-units.mjs --stale` at ee2328a prints 31 `docs/submission/lablab.md` entries as stale. The unchanged tool splits only README.md, DEPLOY.md and METRICS.md (tools/ must stay byte-identical, T10-01). The candidate checks lablab.md through the imported splitter in `test/docs.test.ts` (X-10), and that check gives 0 unmapped and 0 stale. So this is a false "stale" from the CLI, not stale claims. **Suggestion:** CLAIMS.md:10 should say that lablab.md is split by the same tool but checked by the docs test, so that a reader of the CLI output is not misled.
- **O10-A02, mutation list.** The README "Mutation checks" list names Stages 1, 2, 3, 4 and 6. The register also records mutation results for Stages 5, 8 and 9, and lablab.md says "mutation checks at every stage". **Suggestion:** add the register's figures for 5, 8 and 9 (and Stage 7 from its verdict), so the README supports the lablab sentence.

## Not yet run on this candidate

- The adversary's mutant bundle. A rejection does not depend on it. It is re-run on candidate 2.

## Decision

**REJECTED.** Unmet conditions: **F10-A01** (T10-03, Z-06) and **F10-A02** (Z-01, T10-06). This uses repair cycle 1 of 2.

The verdict is bound to `ee2328a987b8912c1daca341284874adb21edcd8`.
