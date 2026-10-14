# Stage 7 candidate 2 (phase A, repair cycle 1 of 3, tests only): implementer handoff

**Candidate commit `dc228d10636cc3cf7b12f3b1226e88027cce12b2`, tree `cf0dcba04e9b0c2e041a8955b0e107b313311149`**
(frozen). It is two test-only commits on candidate 1:
- `6478105`: tests 1 and 2 below;
- `dc228d1`: test 3, a race found by my own clean runs on `6478105`. Its input is candidate 1, `4ef04b27` (tree `7ce51055`), with evidence in `8ce11d6`, which is preserved.

What this repairs:
- the auditor's verdict msg ee925ab2 (`stage-7/auditor/VERDICT-S7-candidate-1-local.md`, commit ed05391), which
  rejected candidate 1 on **F7-01** only;
- the analyst's repair task msg 65fd427c.

The adversary confirmed F7-01 independently (2e46c108). The register is R7.1. No push and no endpoint call. Logs are under `stage-7/implementer/candidate-2/`.

## 1. Diff vs 4ef04b27: tests only

`git diff --stat 4ef04b27 dc228d1 -- . ':!evidence'`: `test/stage6-live.test.ts` only, with 31 insertions and 11
deletions. Nothing else changed. Everything the auditor passed carries forward (ee925ab2): T7-01, the T7-02 code,
T7-03, T7-04, T7-06, T7-07, the capture script and its mutants. So do the adversary's 19/19 Stage 7 mutants and P1–P15.

## 2. The tests changed

**1. "a job that waits too long fails as timed out in queue and keeps its hourly unit; the 2 slots are leases with
a token" (F7-01).**
- **Before:** it ran on real time. The queue wait was 1.5 s, the deadline 6 s and the adapter timeout 5 s, with a 5 s
  poll. A loaded runner could miss any of them, including the first two jobs' own admission, because the queue wait
  is measured from arrival and so includes the PDF check (J-14).
- **Now:** it runs on an **injected app clock** (`clock` dependency, fixed at 13:00:00Z, mid-hour).
  - The queue budget is 60 s on that clock. It elapses only when the test moves the clock (`t += 60 001 ms`), after a
    time-bounded wait (30 s) shows exactly 2 jobs reading and 1 queued.
  - The real-time budgets are far beyond any runner, so the two readers stay "reading" throughout: deadline 120 s,
    reading 100 s, adapter 110 s.
- **What it still proves:** a job that cannot get a slot within its queue budget ends as failed with
  `queue_timeout`, the fixed reason and no result. It keeps its hourly unit (`used_this_hour` = 3). The two
  readers keep their leased slots, holding their own tokens. It never reads past the limit, since only two slots
  exist.
- **Failure reporting:** each assertion now says what was expected and lists the states seen, for example
  `states before the queue wait elapses: …` and `the waiting job after 60001 ms on the app clock`.

**2. "a reading that outlives the deadline fails as timed out; the attempt ends at the deadline, no attempt starts
after it, and the slot comes back (W-03)" (sweep).**
- **Before:** a 5 s poll for the failed state, and a slot-release wait bounded by an iteration count (100 × 20 ms).
- **Now:** both waits are bounded by time (30 s). The 1.5 s deadline is the behaviour under test and only has to
  elapse, so load can make it later but never make the test miss it. The failure message names the state seen.

**3. "4 jobs from 2 instances: at most 2 reading at any time, the others queued with positions; a 5th waiting job is
refused as busy" (found on `6478105`).**
- **What happened:** my clean run 2 of 5 on `6478105` failed it, with "5th job: expected 202 to be 429".
- **Cause:** the stub's reading took 1.5 s. On a loaded runner, a reading could finish and free its slot before the
  5th POST arrived, so busy was no longer true.
- **Now:** each reading holds its slot 8 s, far longer than the admission phase. All four still finish well inside the
  test's 45 s time-bounded watch: 2 rounds of 8 s, against a 40 s job deadline. The busy assertion now names the
  answer seen.
- **What it still proves:** at most 2 reading at once, both slots used, a queued position seen, at most 2 endpoint
  calls in flight, the 5th job refused as busy, and all 4 done.

**The rest of the sweep needed no change.** These are the Stage 6 and Stage 7 tests that wait on real time under
about 10 s:

| Test | Why it is already safe |
|---|---|
| "two workers that look for a slot at the same moment …" | 30 s time-bounded (F6-02) |
| "a crashed holder's slot comes back through its lease TTL (fake clock) …" | fake clock; the short loop is followed by `await ran`, which waits for the outcome |
| "dead queue entries are pruned at admission …" | the ghost entries are 11 s past the prune line, and the job is polled with the 30 s `poll()` |
| `test/stage7.test.ts`, "a live job result never carries the flag" | 30 s time-bounded |
| Everything else | uses the shared `poll()` (30 s) or no real-time wait |

## 3. Verification

Logs are in `candidate-2/`. Heavy work ran one job at a time and was announced (22a4ddb8, 5f5c427d).

**On `6478105`, tests 1 and 2 only:**

| Check | Result |
|---|---|
| Queue mutants on the full suite. **The log was overwritten** by the re-run on `dc228d1`, which used the same file name. The results are quoted from the console output of 19:33Z | `adv_c6_no_self_zrem` KILLED (S6M-c6); `queue_rank_by_arrival` (A-01) KILLED; **`q_timeout_never`** (the queue wait never enforced) KILLED by 2 tests, the rewritten F7-01 test and S6M-c6 |
| 5 cold clean clones (`clean-clone7-c2-6478105.log`) | runs 1, 3, 4 and 5 at 485/485. **Run 2 failed** the 4-jobs busy test (`expected 202 to be 429`), a real-time race that the sweep had missed. It is fixed in `dc228d1` (test 3) |
| Docker `--no-cache`, `--network none`, 0 MODEL_*, code or store variables, ×1 (`docker7-c2-6478105.log`) | **402 passed, 83 skipped (repository-only), 0 failed**. This includes the preview regeneration in the Linux image (CH7-06) |

**On `dc228d1`, the candidate:**

| Check | Result |
|---|---|
| The changed test, locally | passes |
| Queue mutants (`mutants7-c2-queue.log`) | `adv_c6_no_self_zrem` KILLED; `queue_rank_by_arrival` KILLED. **The host stopped the run at about 19:38Z for low memory**, during `q_timeout_never`. That is infrastructure retry 1, not a test result |
| 5 cold clean clones and Docker ×1 | **not yet run on `dc228d1`**, because of that stop. Under the host rule I did not restart; the analyst rules on who runs them (see the room) |

**Carried forward** (tests only since `4ef04b27`):
- the auditor's ee925ab2 checks;
- the adversary's 19/19 Stage 7 mutants and P1–P15 (2e46c108);
- my Stage 7 mutants, 15/15 (candidate 1).
