# Auditor verification of the dispatch 2 final report (S4-13)

Report: `evidence/runs/certgate-001/final/FINAL-REPORT-DISPATCH-2.md` at commit `0884e7f2a27e5f443baf08cbd2a892cd2aab78a4`.
Committed-blob SHA-256 `5fad0423269f26b761e131ae9aaa0aa4e5573565d35ffc7f8460812ba38b5a48`, verified. The analyst's
message is b3c41e17.

**Result: VERIFIED, with one minor correction (C1 below). It does not change any figure, verdict or to-do item.**

## Checks

| Section | Check | Result |
|---|---|---|
| — | `0884e7f` and `73302a4` are evidence-only on top of the accepted `b0ec67a6` (`git diff b0ec67a 0884e7f` outside `evidence/` is empty) | pass |
| 1 Outcome | accepted candidates, trees, verdict records, commits and blob SHAs, repair cycles, rejected or superseded candidates and their reasons | pass. They match my records `VERDICT-S3-candidate-3/4.md` and `VERDICT-S4-candidate-1/3/4/5.md`. "Superseded before verdict" for `0a40432c` and `ac738ef3` is accurate: I issued pre-run findings or a carry-forward, not a verdict |
| 2 AMD evidence | both runs' figures: FC 0/18 and 0/6, caught 6/6, 27/27 and 26/27, 89.6 s and 77.1 s, cost means, usage reconciliation, headroom 0.98234; "not exposed"; the free-credits statement | pass. They equal my independent recomputation of both runs (`stage-4/auditor/recompute-implementer-run.json`, `stage-3/auditor/candidate-3/recompute-auditor-run.json`) |
| 3 Coverage, per-case table | every row against my `eval-retry1/results.json` | pass, case by case. cg-004 review (expected release). cg-005/006/007 block. cg-008/009 release. cg-010/011 review. cg-012 block. cg-013 and cg-015 review, cg-014 release. cg-016/017 review. cg-018 release. cg-019 review, cg-020 block. cg-021 block, cg-022 review. cg-023/024/026/027 release, cg-025 review. cg-028/029/030 review. The implementer run has 0 mismatches and all receipts are `live` |
| 3 Invariants and Stage 4 rows | consistent with my records; S4-07 push and S4-10 Vercel correctly marked **open / not done** | pass |
| 4 Mutation | Stage 3 and Stage 4 numbers and survivor history | pass, except C1 |
| 5 Limitations, incidents, not tested | the host-memory incident and operator go (~19:13Z), the force-added logs, the wrong-seat commit, E-07, image skips, the not-tested list (no deployment, real mode via GET-only lease, no Docker or browser re-run on candidates 2–5, `LIVE_ACCESS_CODE`, room history) | pass. These match what I observed and recorded |
| 6 Time and usage | Stage 3 accepted ~20:01Z (my checkpoint 6e4c01d3, sent 20:00:49Z). Stage 4 accepted ~22:20Z (record commit `6af4903` at 2026-10-13T22:20:22Z). Repair cycles 3/5 and 4/5. Retry 1 of 2 for my run. E-02: 6 GETs, 0 readings | pass. The seat-usage table is the analyst's snapshot, stated with its limits (cumulative, includes dispatch 1, list price); not independently re-measured by me |
| 7 Deployment | not done by the band; no `MODEL_*` on Vercel; push not done; GitHub `main` is `e90fe2c`; public and MIT verified | pass |
| 8 Human to-do (F-12) | push the named commit; Vercel without `MODEL_*` plus checks plus URL; video MP4; slides PDF; 16:9 cover; lablab form; deadline check; O4-03 fake-key note | pass. Complete per R4.3 F-12 |
| 10 Checks on the report | I re-ran my scanner on the report and `final/band-usage-agents-dispatch2.txt`: key 0, base-URL host+path 0, generic patterns 0, user-profile paths 0, local user name or operator e-mail 0. The forbidden-claim grep gives 0 | pass |

## Correction

- **C1 (minor, §4).** The adversary report hash is given as "`MUTATION-5c90469.md`, SHA-256 9b957a54…3a". The committed blob in the adversary clone at `eafc7e14`, verified by me earlier, is `9b957a54fde2217b459efbafe4ffcf553fdb35d4f33b46661aef3385e46d4a43`, so the abbreviation should end in **…4a43**. This record states the correct value; the analyst may correct the report in place.

## Push note

The room message asks the human to push `0884e7f`, then this verification commit, as fast-forwards from `e90fe2c`. Report §8 names `77ce975` "then the later commit"; both are consistent. After the push I check `git ls-remote https://github.com/hvaler/certgate refs/heads/main` against the pushed commit (S4-07).
