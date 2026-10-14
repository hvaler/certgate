# Auditor verdict, Stage 6 candidate 2: LOCAL ACCEPTANCE (S6-12) — ACCEPTED

Candidate `730bd43976932b39653544438375d017bee7b608`, tree `51adb59ed33dbaff394ed130858c3caa4965fd60`. Register R6.3,
plus the repair-1 routing (486c107b) and its addendum (46e4579e).
- Implementer handoff: msg ffec6bb7, record 4b110ad.
- Analyst freeze: msg 90e13dd3.
- Adversary bundle: msg 284ba216 (51/51 killed, probes 13/13).

Audited in a fresh clone, `C:\nexus\dev\certgate-audit-s6c2`, from 16:27Z to 16:40Z, in the one-heavy-job slot
announced in msg 008411c9. No endpoint call was made.

**Result: candidate 2 is ACCEPTED for local acceptance.** This is **not yet the final Stage 6 verdict.** Under
S6-13, the stage is accepted only after the human deploys this candidate and my live checks against
https://certgate-wheat.vercel.app pass:
- live reading is refused without a code and with a wrong code;
- one real Gemma reading is labelled live, with its F1 snapshot;
- the global limit holds;
- no secret appears in the bundle or the responses.

Repair cycles used: 1 of 4. Candidate 1 `bec22567` was REJECTED (f4d7899).

## Findings of candidate 1, now closed

| Finding | Check on candidate 2 | Result |
|---|---|---|
| F6-01: the Lua scripts were not executed | `fake-upstash.mjs` holds its own verbatim copies, not imported from `src/`. They are byte-equal to `src/` and have the same SHA-1 as the texts I ran (`5f010c66…`, `e9f69f2b…`). A test pins their SHA-256. My mutants **S2** (`if true`), **D1** (DEL script with no token compare) and **S3** (no EXPIRE) are **all killed**. I re-ran the committed scripts on real Redis 7.4 (`candidate-2/lua-real-redis.log`): count `1 1 1`, `2 2 1`, `3 2 0`, `4 2 0`, then `1 3 1`; DEL wrong gives 0, right gives 1 | **closed** |
| F6-02: the flaky guard test | `npm ci` (0 dirty), build, then **5 consecutive cold full runs: 392/392 each** (`candidate-2/clean-clone.log`). The loops are now bounded by time | **closed** |
| ADV-S6-F01 survivors g6, c7, a6, e1, c6, c12, f5, c8 | A named killer test is present for each. The adversary reports 51/51 killed, these 8 included | **closed** |
| ADV-S6-F02: `.env.example` | It states that the hourly limit is global in the store on the deployed site and per process in the container, and that the code is mandatory on the deployed site (S6-01). This matches DEPLOY.md §4 | **closed** |

## Checks on candidate 2

| Check | Result |
|---|---|
| Diff vs bec22567, outside evidence | `.env.example` (comments), `test/stage6-live.test.ts`, `test/support/fake-upstash.mjs`. **Tests and docs only**; no product, package or Dockerfile change |
| METRICS · claims | matches · 0 unmapped, 0 stale |
| T6-09 Docker (`candidate-2/docker.log`) | `--no-cache` build; 2 runs with `--network none` and 0 MODEL_*, code or store variables: **364 passed, 28 skipped (repo-only), 0 failed**, both times |
| My Stage 6 mutants (`candidate-2/s6-mutants.log`, 21) | **19 killed.** A7 is equivalent (the gate refuses before the fallback store is used). J7 is near-equivalent (`DeadlineReader` ends every attempt by the deadline). Both are unchanged from candidate 1 and recorded as O6-02 |
| T6-02 secrecy (`scan-head-tree-and-dist.txt`, `scan-history.txt`, `scan-code-digest.txt`) | **`LIVE_ACCESS_CODE` was scanned**, read from the user-level environment and never printed: raw value 0 and SHA-256 hex 0 in 1427 files (tree plus `dist/`) and 1512 history blobs. MODEL_API_KEY 0. Base-URL host and path 0. The generic hits are only the known fake values: O4-03 `sk-proj-…` and the O6-01 test sentinels |

## Carried forward from candidate 1 (identical product; record f4d7899)

- T6-01 / S6-09 byte-identity is empty.
- The Qwen and Gemma request bodies are byte-identical to 409fb69a.
- Code review: count-first EVAL, header-only constant-time code, read-only polls, J-06, FIFO by admission, budgets and leases, W-02 and W-06.
- The per-client key cannot be spoofed on Vercel (`candidate-1/vercel-xff-source.md`).
- DEPLOY.md content.

## Observations (not blocking)

- **O6-01:** the fake sentinels in the tests are not credentials.
- **O6-02:** A7 is equivalent; J7 is near-equivalent.
- **O6-03:** `used_this_hour` can read above the limit once the limit is reached; the limit itself holds.
- **S2M04 (Stage 2):** masked by the store count. The adversary reports it and I accept it as equivalent.

## Next (S6-13)

- The analyst posts the push request and the variable list.
- The human pushes, sets the Vercel variables (DEPLOY.md §4) and reports in the room.
- I then take an announced endpoint lease, check the headroom, and run the live checks: T6-02, T6-04, T6-05, T6-07,
  T6-08 and T6-10.
- I record them under `stage-6/auditor/live/` and issue the final Stage 6 verdict.
