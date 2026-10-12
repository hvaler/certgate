# Auditor decision — certgate-001 · Stage 1 · candidate 1

- **Run / stage:** certgate-001 · Stage 1 (offline core, mock path only)
- **Auditor and seat ID:** auditor-xwz6 (`hugo.valer/auditor-xwz6`), Claude Code, model `claude-opus-5-5`
- **Date UTC:** 2026-10-12T17:56Z
- **Decision:** **REJECTED**
- **Product commit and tree:** `31335ee13944563a0eb559f6d1125efe94f598c9`, tree `5a2efc6d37dabff1b0376c261f0d47f8bd9132b6` (verified in my own clone)
- **Test revision:**
  - The implementation suite in the candidate (`test/`, 9 files) was run by me.
  - The **adversary's independent test revision had not been delivered** at decision time, so its tests were not run.
- **Spec and checksum:** stage-start sources per register R1.5/R1.6:
  - D `29a203a8…279d`, P `1205bbf4…a012`, R `d3b8ea59…744b`, V `277356fc…d6fb`;
  - mini-prueba hashes as in `SOURCES.sha256`;
  - later drift (A-24, plus V `cc62a36c…` at 17:42:08Z) does not affect Stage 1.
- **Register:** R1.5 `f9836f89` (`fd836c91…a404`); R1.6 `0daa1894` (`adbae778…fc9c`) changes no obligation.
- **Scope (D1-01):** mock path only. This decision is not MVP acceptance and does not touch P:L19-20, P:L100-102 or the AMD gates A1–A4.

## Commands run by the auditor, and the clean environment

Own clone `C:\nexus\dev\certgate-audit-s1c1`, made with `git clone C:\nexus\dev\certgate`, checked out at the candidate, `git status` clean. Host: Windows 11, Docker 29.8.0, Python 3.12.10.

| Step | Command | UTC | Exit | Observed |
|---|---|---|---|---|
| Build | `docker build --no-cache --progress=plain -t certgate-audit:31335ee <clone>` | 17:43:41–17:44:16 | 0 | image `sha256:98aafdb80313e83207758310f3310704768978c7ea34b299b3d0a7f8a4229885`; base `node:24.21.0-bookworm-slim@sha256:d6aa754f…7b20` |
| Suite, offline | `docker run --rm --network none certgate-audit:31335ee npx vitest run --reporter=verbose` | 17:44:48–17:44:50 | 0 | 9 files, **175 passed, 0 failed, 0 skipped** |
| 30 cases | `docker run --rm --network none certgate-audit:31335ee node dist/src/cli.js process --case cg-NNN`, one container per case | 17:44:59–17:45:20 | 0 ×30 | compared by `compare_cases.py` (v2) |
| A-21 | the same command on cg-003 with `--confirm …`: (a) all 22 critical fields with ReH 358, (b) ReH 358 only, (c) ReH 338 | ~17:46:37 | 0 ×3 | (a) release · (b) review, 21 pending · (c) block, `RULE_FAIL:ReH` |
| Isolation and health | `docker run --rm --network none -e PORT=4100 -v <auditor dir>:/probe:ro … node /probe/isolation_probe.mjs A B` for 3 pairs | ~17:47 | 0 ×3 | B after A = B before A = B alone; A after B = A alone; `/health` mode mock |
| Real mode | `docker run --rm --network none -e CERTGATE_MODE=real … process --case cg-001` | ~17:47 | 0 | status error, review, `READER_ERROR:endpoint_not_configured`, no mock fallback |
| README run | `docker run -d --rm --network none -p 3057:3000 -e PORT=3000 …` then POST to localhost:3057 | ~17:49 | — | **connection refused; no port published** (F-02) |
| Static | grep of `src/` for expectation and origin reads, float parsing, env reads; secret scan of the tracked tree and the image | ~17:45–17:48 | — | see below |
| History | `git log --format='%H %aI %cI %an' 31335ee1` | 17:42 | 0 | every commit ≥ 2026-10-12T15:00:00Z; earliest `705c857` at 16:45:45Z |

## Reports and logs (paths under `evidence/runs/certgate-001/stage-1/auditor/`, committed in `b1b15093b9382b057c4480f48ba0041a478537e1`)

- `run-s1c1/docker-build-no-cache.log`, `run-s1c1/docker-build.meta`
- `run-s1c1/suite-network-none.txt` and `.meta`
- `run-s1c1/cases/cg-001..030.json` (CLI output per case) and `.stderr.txt`
- `run-s1c1/compare-cases-v2.txt`. Also `compare-cases-v1-wrong-planted-assumption.txt`, kept because it records my own wrong assumption about cg-022 and the C11 labels, which v2 corrects.
- `run-s1c1/human/{a-all-confirmed-358,b-only-reh-358,c-reh-338}.json`
- `run-s1c1/isolation-and-health.txt`, `run-s1c1/real-mode-cg-001.json`
- Tools: `compare_cases.py`, `isolation_probe.mjs`, `audit_dataset.py`. Dataset pre-check: `DATASET-PRECHECK.md`.

SHA-256 values for these files are those of the blobs in commit `b1b15093` (`git ls-tree -r b1b15093` + `git cat-file`). They are not restated here, to avoid a self-referential hash.

## Actual counts, failures and skips

- Implementation suite: 175/175 passed, 0 skipped.
- Dataset cases: **30/30 match** the expected proposal, status and required reasons.
  - C1 cg-001/004 release
  - C2 cg-002/005/006/007 block
  - C3 cg-008/009 release
  - C4 cg-010/011 review
  - C5 cg-012 block
  - C6 cg-013/015 review, cg-014 release
  - C7 cg-003/016/017 review
  - C8 cg-018 review
  - C9 cg-019 review, cg-020 block
  - C10 cg-021 block, cg-022 review
  - C11 cg-023..027 error + review
  - C13 cg-028 review
  - A-05 cg-029 and A-06 cg-030 review
  - C12: isolation probe as above
  - C14: N/A (out of scope), not counted as a pass
- Label check: 29/30 under the corrected check; cg-027 fails it (F-01).

## Invariants on this candidate

| | Result |
|---|---|
| I1 | Holds: the proposal comes from `evaluate.propose` over the rule and coherence reasons. The explanation is recorded with `used_for_decision=false`; cg-021's contaminated explanation does not change the `block` |
| I2 | Holds: unknown critical fields give `CRITICAL_UNKNOWN` and `review` (cg-003, 013, 015, 017, 018) |
| I3 | Holds: scans give `NO_SECOND_CHANNEL` and need all critical fields confirmed (A-21 a/b/c). Disagreement gives unknown and `review` (cg-018) |
| I4 | Holds: decimal.js precision 50, half-even. Strings throughout; strict JSON rejects numbers; floats only in PDF layout geometry. Inputs resolve to 1/30000, far above the precision |
| I5 | Holds on all 30 cases: no release under any I5 trigger |
| I6 | Holds for the tree and the image (no secrets, no `.env`; `.env.example` has 3 keys and no values; `.env` git-ignored). **Room: stated limitation**, no full-history export (R1.1 S1-43) |
| I7 | Not met in full for the mock path: see F-01 |

## Blocking findings (precise unmet conditions)

1. **F-01 — A-01 / D1-05 / I7: injected reader failures are not labelled as planted in the receipt.** `src/pipeline.ts:200` takes `planted` from `rd.model?.planted`, which is null on a reader failure. All five C11 receipts (cg-023..027) therefore show `planted: []` and `reading_source: "mock"`. For cg-027 (`invalid_json`) the receipt holds no marker that the failure was simulated: `errors[0].detail` is only the JSON parse error.
   - **Condition:** every receipt of an injected failure carries the planted failure entry and is marked planted, with a test over all 5 classes.
2. **F-02 — S1-01: the README's documented container run does not work.** "Run it", line 58: `docker run --rm --network none -p 3000:3000 …` followed by `curl localhost:3000`. With `--network none` no port is published, and I reproduced connection refused.
   - **Condition:** every documented run command works as written.
3. **S1-40 / dispatch §MUTATION CHECK — missing evidence:** there is no adversary mutation report and no mutation branches. On its own this is BLOCKED, not a product defect. It is listed so the next candidate is not presented without it.

## Non-blocking findings

- **F-03 (S1-45):** `.gitignore` ignores `*.log`. The four implementer logs cited with hashes in `HANDOFF-S1-candidate-1.md` are not committed, so those claims have no artifact. The auditor's own logs are committed with `git add -f`.
- **F-04:** in `CERTGATE_MODE=real` the CLI summary note says "the reading is MOCK", while the receipt says `reading_source: "live"` (error, no reading). Neither claims a live reading. The note should follow the mode.
- **Observation (cg-022, A-16):** a hostile duplicate value in the text layer turns a would-be `block` (true ReH 340 < 355) into `review`. That follows the register and is never release. It should be stated in the final report.

## Result of the next-stage probe

None run. Stage 2 is not started.

## Ledger events and room messages

- Room:
  - candidate handoff `875e156e` … `9ef4a5ab`
  - my acknowledgement `30fbc96d`
  - interim findings `f2637abc`
  - analyst routing to repair cycle 1: `1658ac08` and messages `8e511ad4`, `924b8bc0`, `37f0e35b`, `cb9c35f0`, `def644e3`, `a15723e8`, `c55dd273`
- Events: none written as JSON for this decision. This VERDICT file is the record. Its message ID is linked by the checkpoint that publishes it.

## Required change and recipient

F-01 and F-02 (blocking) and F-03 and F-04 (non-blocking) go to the implementer through analyst-xwz3, as repair cycle 1 of 5. Candidate 1 is preserved unchanged. The repair goes into a new commit, which I will reproduce independently from scratch.

## Next action authorised by the dispatch

Repair, then adversary recheck, then auditor reproduction of candidate 2. Stage 2 stays closed until a Stage 1 ACCEPTED.

ACCEPTED would be internal acceptance of an identified candidate only. It is not a statement about hidden tests or an official event result. This REJECTED applies only to `31335ee1`.
