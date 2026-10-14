# Stage 6 candidate 2: implementer handoff (repair cycle 1 of 4: tests and `.env.example`)

**Candidate commit `730bd43976932b39653544438375d017bee7b608`, tree `51adb59ed33dbaff394ed130858c3caa4965fd60`** (frozen).

It is built from two commits on top of candidate 1:
- `9996a6b`: F6-01 and F6-02;
- `730bd43`: the ADV-S6-F01 killers and the ADV-S6-F02 docs fix.

**Input:** candidate 1 `bec22567` (tree `79b374e5`), which is preserved and not rewritten.

**Findings repaired:**
- the auditor's verdict msg 86f3bdbc (`stage-6/auditor/VERDICT-S6-candidate-1.md`, commit f4d7899);
- the auditor's ruling on the adversary's results, msg 48a9ad70;
- the analyst's repair task msg 486c107b and addendum msg 46e4579e;
- the adversary's results msg e1667207.

The register is R6.3. Logs are under `stage-6/implementer/candidate-2/`. No endpoint call was made in this repair, and
nothing was pushed.

## 1. Diff vs bec22567: tests, plus `.env.example`

`git diff --stat bec2256 730bd43 -- . ':!evidence'`: 3 files, 188 insertions, 19 deletions.

| File | Change |
|---|---|
| `test/support/fake-upstash.mjs` | **F6-01:** it holds its own verbatim copies of the two Lua scripts instead of importing them from `src/`, and refuses any other script text. **S6M-g6:** it counts REST requests (`state.requests`) |
| `test/stage6-live.test.ts` | F6-01: 2 tests. F6-02: two loops bounded by time, with failure messages that show what was seen. ADV-S6-F01: 8 killer tests, plus a recording store |
| `.env.example` | **ADV-S6-F02:** comments only. `LIVE_READS_PER_HOUR` is global in the shared store on the deployed site and per process in the container. `LIVE_ACCESS_CODE` is mandatory on the deployed site (S6-01) and optional in the container. The wording follows DEPLOY.md §4 |

**Unchanged:** `src/`, `public/`, `api/`, `vercel.json`, the package files, README, DEPLOY.md, CLAIMS and the claims
map. No test was renamed.

`.env.example` is not part of the claims sentence map, which covers README, DEPLOY.md and METRICS.md. It is scanned
for secret values only, and it still lists every variable with no value. The product tree is identical to candidate 1
outside these comments, so the auditor's passing product checks carry forward (86f3bdbc).

## 2. F6-01: the production Lua scripts are guarded

- **The fake's own copies:** these are the texts the auditor ran on real Redis 7.4.10
  (`stage-6/auditor/candidate-1/lua-real-redis.log`). The SHA-1 of the copies starts with `5f010c665661` and
  `e9f69f2beb75`, the values in that log.
- **What a changed script does:** if a script in `src/` changes, `UpstashRestStore` sends a text the fake refuses
  (`NOSCRIPT unknown script`), and the tests that go through the fake fail.
- **Test "the two Lua scripts in src/ are exactly the texts verified on real Redis (pinned SHA-256)":**
  - `COUNT_ATTEMPT_SCRIPT` SHA-256 `210382f3def5e863033e2f2023dd8148017f41b17cd6e0c9cd933dd05a239abc`;
  - `DEL_IF_EQUALS_SCRIPT` SHA-256 `58c1e79c3e95626750ef05e2e74a7f650a45d44acbee56a3fa9df61b30d58631`;
  - the `src/` texts equal the fake's copies;
  - the SHA-1 prefixes of the auditor's log.
  The failure message says to re-verify on real Redis before re-pinning.
- **Test "the fake store refuses a script that is not one of the verified texts":** this guards the mechanism itself.

## 3. F6-02: polls bounded by time, with clear failures

- **"4 jobs from 2 instances …":**
  - The iteration-count loop (`i < 400`) became `while (Date.now() < deadline)` with a **45 s** deadline. The test
    timeout is 60 s and the work takes about 3 s.
  - A new assertion, `settled`, checks that all 4 jobs reached done or failed in time.
  - Every assertion message carries the sequence of state changes seen (the four states at each change, with a
    queued job's position). A failure therefore shows whether the jobs were slow or the limit of 2 broke.
- **The other wait bounded by an iteration count:** "two workers that look for a slot at the same moment …"
  (`i < 200` over a store with a 20 ms delay) now has a **30 s** deadline, and its failure shows the holders seen.
- **Fixed-count loops left as they are:** none of them is a wait.
  - 3 sequential jobs, each awaited by the time-bounded `poll()` helper (30 s);
  - 20 wrong-code requests;
  - the Stage 4 loops of 5 requests.

## 4. ADV-S6-F01: one killer per surviving mutant

All the new tests are in the describe block "killers for the guards the adversary found unguarded (ADV-S6-F01 …)".
A **recording store** wraps a MemoryStore and logs every operation with its arguments. Writes are `incr`,
`countAttempt`, `forgiveAttempt`, `set`, `setNx`, `delIfEquals`, `zadd`, `zrem` and `zremBelow`.

| Survivor (row) | Killer test | What it asserts |
|---|---|---|
| S6M-g6 (J-16) | "S6M-g6 (J-16): on Upstash, incr and countAttempt are each ONE REST request …" | On the fake Upstash, `incr` is 1 request through `/multi-exec`, and `countAttempt` is 1 request (EVAL). The key carries its TTL |
| S6M-c7 (J-05) | "S6M-c7 (J-05): a poll makes zero store writes, in every state …" | `view()` on jobs in the states queued, reading, done and failed, then on the same jobs as orphans after 400 s (derived as failed), plus `counts()` for the status: **0 writes** |
| S6M-a6 (H-02) | "S6M-a6 (H-02): the per-client code-failure key holds a 32-hex hash …" | The client segment of `codefail:c:…` is 32 hex characters and equals the first 32 hex characters of SHA-256 of the address. No store key or argument contains the address |
| S6M-e1 (J-06) | "S6M-e1 (J-06): a reading orphan fails at started_at + deadline + 10 s (281 s) …" | Fake clock, deployed budget: still reading at 279 s; failed with `timeout` and no result at 281 s, before the 300 s backstop |
| S6M-c6 (J-04) | "S6M-c6 (J-04): a job that times out in the queue removes its own queue entry at once …" | Fake clock 60 001 ms after admission, so the 70 s prune has not run yet. The job fails as `queue_timeout`, its ZSET rank is null and the queue is empty |
| S6M-c12 (A-01) | "S6M-c12 (A-01): a missing rank at admission (fault-injected store) is refused as busy …" | A store whose `zrank` returns null: `admit()` throws `Refusal` 429 busy; `used_this_hour` is 0 and the queue is empty |
| S6M-f5 | "S6M-f5: with the endpoint not on (F1 off), the job POST is refused 503 before admission …" | Deployed shape with the endpoint at a closed local port, so F1 is off: POST gives 503 `no live endpoint…`; `used_this_hour` is "0"; there is no `reads` INCR, no `zadd` and no job `set` |
| S6M-c8 (J-05, J-13) | "S6M-c8 (J-05, J-13): malformed job ids get 404 with zero store operations" | 6 malformed ids (short, long, upper-case hex, non-hex, `%2e%2e`) give 404 with **0 store operations** |

**S6M-f5, as the addendum asked:** admission is refused **before** the hourly INCR when F1 is not "on". The F1 gate
in `startJob` comes before `admit()`, so no unit is consumed, and the test asserts it. Before the gate, the access
code is counted and forgiven, as for every POST (J-02), so the code counters end at 0.

**S2M04 (Stage 2)** is masked, not killed. The auditor accepts it as equivalent (48a9ad70), and it is not part of
this repair.

## 5. Verification of candidate 2

All runs below are on `730bd43`, one heavy job at a time (analyst instruction 46e4579e). The logs are in
`candidate-2/`.

| Check | Result |
|---|---|
| **5 consecutive full clean-clone runs** (`clean-clone6-c2.log`): fresh `git clone`; cold `npm ci` (0 dirty files); build; `npx vitest run` with MODEL_* unset | **392/392 in each of the 5 runs**, run 1 being the cold first run (15:40:31Z … 15:41:48Z) |
| `metrics-md --check` · claims | matches · **0 unmapped, 0 stale** |
| **T6-09 Docker** (`docker6-c2.log`): `docker build --no-cache`, image `sha256:1cfcecd7…`; image suite twice with `--network none`, with 0 MODEL_*, `LIVE_ACCESS_CODE` or store variables in the container | **364 passed, 28 skipped (repository-only), 0 failed**, both times |
| **Stage 6 mutants** (`mutants6-c2.log`, 15:42:47Z → 16:06:50Z): the 39 of candidate 1, the 2 Lua mutants, and the adversary's 8 survivors ported verbatim from `verification/adversary/stage-6/mutate6.py` | **49 of 49 killed**, on the default suite |

**Which test kills each of the new mutants** (`mutants6-c2.log`):

| Mutant | Failed tests |
|---|---|
| `lua_count_guard_true` (the auditor's S2) | the SHA-256 pin; `upstash-rest: queued -> reading -> done …`; S6M-g6 |
| `lua_del_no_compare` | the SHA-256 pin; `upstash-rest: queued -> reading -> done …` |
| `adv_g6_incr_two_requests` | S6M-g6 |
| `adv_c7_poll_writes` | S6M-c7 |
| `adv_a6_client_key_raw_ip` | S6M-a6 |
| `adv_e1_no_reading_orphan` | S6M-e1 |
| `adv_c6_no_self_zrem` | S6M-c6 |
| `adv_c12_null_rank_admitted` | S6M-c12 |
| `adv_f5_f1_gate_off` | S6M-f5 |
| `adv_c8_malformed_id_hits_store` | S6M-c8 |

**The mutant definitions** are in `candidate-2/mutate6.mjs`, with `kill6.sh` as the runner. Each mutant is applied
on a throwaway branch of a scratch clone, and the full default suite is run with MODEL_* unset.

**Infrastructure notes:**
- No run was killed by the host.
- **Two runs were stopped and discarded by me, and are not test results:**
  - a first 5-run clean-clone attempt on `9996a6b`, whose log missed the Tests line. Its 2 completed runs had
    passed;
  - a mutant batch on `9996a6b`, stopped after 15 mutants (all killed) because `730bd43` superseded it.
- **Earlier checks on `9996a6b`** (the F6-01 and F6-02 commit alone):
  - 5 clean-clone runs at 384/384;
  - Docker 356 passed and 28 skipped, twice;
  - S2 and the DEL mutant killed (`mutants6-lua.log`).
  All of these were re-run on `730bd43` above.

## 6. Observations from the auditor's verdict

**O6-01, O6-02 (J7) and O6-03** are noted and are not blocking. This repair does not touch them.
