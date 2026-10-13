# Stage 3 candidate 3 (repair cycle 2 of 5): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 3
Repair task: analyst msgs 191d9a59 (part 1) … 8dfe604c (part 13). Freeze instruction: msg f6735d74. Finding
ADV-S3-F01: adversary msg 0a4f6702. Register R3.3 (SHA-256 `52dbd3c0…9788`); R2.2 and R1.6 still in force.
This record states what was done; it is not an acceptance. No push. No endpoint calls.

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `a892f771e531ca76b621b5a03163b2d3cb4f02d6` |
| Tree | `f0c829e9214e8cc9bcd6643f1e86a98db18d3662` |
| Input revision (preserved, not rewritten) | candidate 2 `e4132c5173a5c19b9377ac449bf0a12d2554cc7d` (+ evidence `7415562`) |
| Repair commits | `3bb5328` (ADV-S3-F01 tests) · `a892f77` (de-flake one existing web test) |
| **Diff vs e4132c5, excluding evidence** | `test/live-reader-prose.test.ts` +67 (new) · `test/web.test.ts` +3 −1. **Test-only**: no file under `src/`, `public/`, `tools/`, `config/`, `data/` or the package files changed. The reading path and the prompt (`32fad2f9…`) are unchanged. File: `repair-2/diff-vs-e4132c5.txt` |

## ADV-S3-F01: mutant S3M06 ("JSON repaired by guessing") survived

| | |
|---|---|
| Reproduced | yes. The adversary's diff (first `{…}` pulled out of any text) survived the candidate 2 suite |
| Cause | a gap in the suite: no test had JSON outside a whole-content fence. The reader itself was already correct |
| Repair | `test/live-reader-prose.test.ts`, 6 tests, replies replayed from 127.0.0.1. Each of the following is C11 `invalid_json`, status error, review, 1 call, no value read: **prose before the JSON**; **prose before and after** (the adversary's `prefixed` shape); **JSON followed by trailing text**; a fence that does not span the whole content. A control shows whole-content JSON and one whole-content fence are still read. `stripCodeFences` never extracts JSON from surrounding text |
| Kill check | S3M06 applied with the adversary's exact diff on a throwaway branch (`impl-mut/S3M06-on-a892f77` in a scratch clone, never merged): **full suite 5 failed / 275 passed**, and all 5 failures are the new tests (`repair-2/mutant-S3M06-on-a892f77.log`, SHA-256 `85e7d156…`). The same result on `3bb5328`: `repair-2/mutant-S3M06-on-repair-2.log` |

## De-flaked web test (found while verifying)

On the first clean-clone run of `3bb5328`, the existing test "C11 through HTTP, stub mode http_429" failed once:
the expected class was `http_429`, the received one `timeout` (`repair-2/clean-clone-tests-3bb5328-flaky.log`). The
same commit passed 280/280 in Docker and in the working copy. Cause: the test gave every stub mode a 300 ms
attempt timeout and the real 2 s / 4 s back-off. On a loaded machine an attempt that answers 429 could exceed
300 ms. Repair (test only): the 300 ms timeout is used only in `timeout` mode; the other modes get 30 s and a 1 ms
back-off. The assertions are unchanged.

## Verification on a clean clone of a892f77 (logs in `repair-2/`)

- `clean-clone-tests.log`: `npm ci`, build, `npx vitest run` **twice** with MODEL_* unset: **280/280** both times.
- `docker-network-none.log`: `docker build --no-cache`; `docker run --rm --network none … npx vitest run`: **280/280**.
- The browser checks were not re-run: `public/` is unchanged since candidate 2 (15/0 in `repair-1/browser-checks.log`).

The candidate 1 and 2 records still hold for everything else: evaluation, F3-01, O3-01, stories and row mapping.
For the auditor's real run, the reading path of a892f77 is identical to that of e4132c5.

Time: repair 2 received 18:3xZ; candidate 3 frozen 18:52Z.
