# Auditor verdict, Stage 7 candidate 1 (phase A, local acceptance): REJECTED

Candidate `4ef04b272e0766caaf34b934e28230bf60a52f8c`, tree `7ce51055fb5dedb65c88d91fa4016856695c5504`. Register R7.1
(S7-01…S7-10, T7-01…T7-08, CH7-01…CH7-12, L-13…L-15).
- Implementer handoff: msg 2e99e05e, record 8ce11d6.
- Analyst freeze: msg 0dfb7356.
- Audited in `C:\nexus\dev\certgate-audit-s7c1` from 19:12Z to 19:27Z, in the slot announced in 2b1854ea.
- Free memory was 5.6 GB; vitest ran with `--maxWorkers=4`.
- No endpoint call was made, and no secret value or property was read.

**Result: REJECTED on F7-01 only.** It is a flaky guard test, and the repair is tests only. Every Stage 7 check
passes, as listed below, and carries forward if the repair touches only `test/`. Repair cycle 1 of 3.

## Finding

### F7-01 (REJECT): the Stage 6 guard test "a job that waits too long fails as timed out in queue…" fails intermittently

- **This audit** (`candidate-1/clean-clone.log`): 5 clean runs, and **run 3 failed 1 test**, at 6329 ms with
  `AssertionError: expected { …(10) } to match object { state: 'failed', …(3) }`. Runs 1, 2, 4 and 5 passed 485/485.
- **Same test, earlier:**
  - Stage 6 candidate 3, my cold run 1 (recorded then as O6-04, infrastructure);
  - this candidate's own Docker run 1 (implementer, as reported by the analyst in 0dfb7356).

  That is three failures in three independent run series. It no longer fits "one cold run under memory pressure".
- **Cause, by reading the test** (`test/stage6-live.test.ts`): it runs real wall-clock budgets of `queueMaxWaitMs`
  1.5 s, `deadlineMs` 6 s and an adapter timeout of 5 s against a stub in timeout mode, then waits for the third job
  with `poll(…, 5_000)`. Under a loaded host the third job is still queued, or not yet failed, when the 5 s poll ends.
  The queue code is unchanged since Stage 6 and is correct by other killers (J-04, J-06, A-01, c6). The defect is the
  test's real-time margins.
- **Why it blocks:** S7-08 requires "the full suite from a clean clone". A guard that fails about 1 run in 5 does not
  meet it, by the same standard as F6-02. The human records the demo video and submits from this suite's state.
- **Required repair (tests only):**
  - Make the test deterministic: a fake clock or an injected `now`, or a time-bounded poll of at least 30 s together
    with budgets that a loaded runner meets.
  - Report which assertion failed.
  - Re-run the 4 other real-time Stage 6 tests that use sub-10 s windows, and harden them the same way if they share
    the pattern.
  - Show 5 consecutive cold clean-clone runs passing, **and** one Docker `--network none` run.

## Checks that pass (they carry forward to a tests-only candidate 2)

| Check | Result |
|---|---|
| T7-01 unchanged | `git diff 9759d3af 4ef04b27` is **empty** on the reading path, `live-reader.ts`, `live-jobs.ts`, `live-store.ts`, `deadline-reader.ts`, `limits.ts`, `config/`, `evaluation/`, `figures.json`, METRICS, `vercel.json`, the package files and the Dockerfile. `data/` gains only `data/previews/*.png`. `public/stories/*.json` gains only `"recorded": true` and `recorded_at`. `src/web/app.ts` changes by +27/−1 (the originals routes and the evaluate view order). `src/tools/build-stories.ts` changes by +9/−1 (the flag) |
| Previews in the function | `vercel.json` is unchanged, so `includeFiles` `{data,…}/**` already carries `data/previews`, and `node_modules/pdfjs-dist` stays included |
| T7-02 guard, code | `ORIGINALS` is a fixed map from `[...STORY_IDS, ...SAMPLE_IDS]`. The request id is only a key, so no request path reaches the filesystem. `by-certificate/<sha256>` maps only the 3 sample PDFs' SHA-256 (CH7-04). The answer is `image/png`, with `SECURITY_HEADERS` (nosniff) and `x-content-sha256`. The adversary's probes (ff18ce25) pass 8/8: 20 bad ids, traversal, and story hashes all give 404 |
| T7-03 previews | `node tools/previews.mjs --check` passes; a fresh run leaves **0** files changed. All 6 hashes are listed in the README. **No `tIME`, `tEXt`, `iTXt` or `zTXt` chunks.** Scans use the PDF's own page image; digital certificates use the pinned pdf.js render. Regeneration inside the Docker image is checked on candidate 2 (CH7-06) |
| T7-04 flag | `recorded: true` and `recorded_at` come right after `reading_source` in the 3 story files and on evaluate. A live result goes through `viewJson` and carries no flag |
| T7-06 diagrams | `tools/diagrams.mjs --check` passes, with both SVGs byte-stable from one definition. Every node and edge names a file and a symbol that occurs in it, and the README Mermaid equals the tool's output. Claims C-87…C-91 present. **Claims: 0 unmapped, 0 stale** |
| T7-07 README | All 37 relative links resolve to committed files. The prize check (E-17…E-19) passes in the suite. METRICS check matches. Live link checks follow the deployment |
| CH7-01/02/11 capture script (static) | The code is read from the user-level registry, never typed, and sent through route interception as `x-live-access-code`. The code input is checked to be `""` in every capture. `innerText` is scanned for the code, the key and the base-URL path. No tracing, HAR, video or console capture. The script runs in phase B |
| My Stage 7 mutants (`candidate-1/s7-mutants.log`), **12/12 killed** | R1: allow-list gains cg-020. R2: request path reaches the filesystem. R3: by-certificate maps the stories too. R4: nosniff dropped. F1: flag dropped from evaluate. F2: flag dropped from `storyView`. F3: flag added to a live result. C1: the client always shows a dataset original. D1: fake diagram node "vLLM on MI300X". D2: README Mermaid edited. S1: the capture records a HAR. P1: a preview byte changed |
| Stage 6 mutants | Carried forward. The code did not move (T7-01) |

**Not run on this candidate:** Docker `--network none`. It is required on candidate 2 (F7-01 and CH7-06).
