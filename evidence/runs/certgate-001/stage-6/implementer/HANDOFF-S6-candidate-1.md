# Stage 6 candidate 1 (live reading on the deployed site): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 6

**Task:** dispatch 4 (msg 980db228) and the analyst's 18-part handoff (5e7928b7 …).

**Register:** R6.3 with J-01…J-20, including:
- the CH6-01…CH6-19 challenge (R6.1);
- the T6-01…T6-10 rules (R6.2);
- the design ruling, the addendum ruling 8950ce99, the dependency ruling 80e434c9 and the early-read ruling 175b83b2 (W-01…W-06);
- the pre-freeze observation A-01 (66c201bb).

**Design note:** 7c8234e1, with its addendum e1752abc.

This record states what was done; it is not an acceptance. **No push, no deploy.** One real reading was made under the announced lease (section 9).

## 1. Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `bec225675bf653d092b7aa2a304ee347e602a134` |
| Tree | `79b374e5b9f6f7b10cc6a45cb298059ab897096b` |
| Input revision | `8868838f` (contains the Stage 5 accepted `409fb69a`) |
| Implementer commits | `40c4a37` the job API, store, limits, docs and tests · `af48025` the guard tests · `dd9349c` position not stored · `90ebc69` W-01…W-06 · `4002362` claims proofs · `f12b29f` two timing-dependent tests made deterministic · `c9099fb` A-01 · `c024789` test budgets for a cold start · `914cd50` W-07 · `33d9a85` the W-07 worst-case test · `6224ebd`, `bec2256` three killer tests (atomic slot admission; no attempt after the deadline; internal errors stay internal), tests only |

## 2. Product files changed vs 409fb69a, each with its reason

| File | Reason |
|---|---|
| `src/web/app.ts` | Job routes; deployed enablement; the code gate; samples; F1 cache; `/health` reader live when enabled; the container's sync route shares the hourly count |
| `src/web/live-jobs.ts` (new) | Job lifecycle, queue, slot leases, the hourly window, code counters, orphan derivation, fixed reason classes |
| `src/web/live-store.ts` (new) | The store interface: MemoryStore (container and tests) and the Upstash REST adapter (fetch, `/multi-exec`, EVAL) |
| `src/web/deadline-reader.ts` (new) | W-03: each attempt is capped at `min(time left, 300 s)`, and no attempt starts after the deadline. It wraps the unchanged `LiveReader` |
| `src/web/limits.ts` | `DEPLOYED_LIVE_BUDGET` and `CONTAINER_LIVE_BUDGET` added; nothing existing changed |
| `api/index.ts` | `waitUntil` from `@vercel/functions` |
| `public/app.js` | Live section: the job flow with polling every 2 s or more, the code sent in a header, samples, model naming, the scope note from the server |
| `package.json`, `package-lock.json` | `@vercel/functions@3.10.1`, pinned exact (J-18), with 25 lockfile entries |
| `.env.example` | The store variable names; comment texts |

The 25 lockfile entries and their licences:

| Licence | Packages |
|---|---|
| Apache-2.0 | `@vercel/functions` 3.10.1, `@vercel/oidc` 4.0.1, `@vercel/cli-config` 0.3.1, `@vercel/cli-exec` 1.0.1, `human-signals` 2.1.0 |
| ISC | `isexe` 2.0.0, `signal-exit` 3.0.7, `which` 2.0.2 |
| MIT | `cross-spawn` 7.0.6, `execa` 5.1.1, `get-stream` 6.0.1, `is-stream` 2.0.1, `jose` 5.10.0, `merge-stream` 2.0.0, `mimic-fn` 2.1.0, `npm-run-path` 4.0.1, `onetime` 5.1.2, `os-paths` 4.4.0, `path-key` 3.1.1, `shebang-command` 2.0.0, `shebang-regex` 3.0.0, `strip-final-newline` 2.0.0, `xdg-app-paths` 5.5.1, `xdg-portable` 7.3.0, `zod` 4.1.11 |

None of them ships to `public/`: only `api/index.ts` imports the package.

**Unchanged (S6-09, T6-01, J-19):**
- the reading-path files, `src/web/live-reader.ts` included;
- `data/`, `config/`, `evaluation/`, `public/figures.json`, `public/stories/`, `vercel.json` and `METRICS.md`.

This is pinned by `test/stage6-live.test.ts` ("…byte-identical to 409fb69a", git blob ids of 170 files in `test/fixtures/stage6-baseline.json`) and by the Stage 5 golden request hash, which is unchanged. My smoke test's two GET /usage log lines are therefore kept in evidence (`smoke/dev-calls-stage6.jsonl`), not in `evaluation/dev-calls.jsonl`.

Docs: `DEPLOY.md` (rewritten), `README.md`, `CLAIMS.md` (C-36, C-37, C-46 and C-72 reworded; C-77…C-86 new), `claims-map.json`, `EVIDENCE-INDEX.md`, `docs/sources/upstash-redis.md`, `docs/sources/vercel-functions.md`.

Tests: `test/stage6-live.test.ts` (new), `test/support/{fake-upstash,disabled-golden}.mjs` (new), `test/support/stub-endpoint.mjs` (delay, counters, `http_4xx`), the two fixtures, and `test/{docs,web,stage5-gemma}.test.ts`.

## 3. Design as built

- **Job lifecycle.** POST `/api/live/jobs` answers 202 with `{job_id, state: queued, position, poll, poll_interval_s: 2}`. GET `/api/live/jobs/<id>` returns one of four states:

| State | Carries |
|---|---|
| queued | position |
| reading | `elapsed_s` |
| done | the job's own view and receipt, `job_id`, `started_at`, `finished_at` |
| failed | `reason_class` and its fixed `reason`, `result: null` |

- **Where the reading runs.** On Vercel it runs in the POST invocation through `waitUntil`. In the container it runs as an in-process promise.
- **Budgets:**
  - **Vercel:** queue at most 60 s; reading at most 210 s; deadline 270 s from request arrival; margin 30 s; lease 310 s.
  - **Container:** queue 120 s; reading 1140 s; lease 1290 s.
- **Store keys** (all prefixed `certgate:live:`):

| Key | TTL |
|---|---|
| `job:<id>` | 3600 s |
| `queue` (a ZSET) | – |
| `slot:0`, `slot:1` (SET NX PX with the job id as token) | 310 s |
| `reads:<UTC hour>` (INCR and EXPIRE in one `/multi-exec`) | 7200 s |
| `codefail:c:<sha256(client) 32 hex>:<hour>`, `codefail:g:<hour>` | 7200 s |
| `f1`, `f1:last`, `f1lock` | 60 s / 3600 s / 60 s |

- **Atomic operations:**
  - INCR+EXPIRE through MULTI.
  - The code attempt runs as one EVAL (`COUNT_ATTEMPT_SCRIPT`).
  - Slots are taken with SET NX PX and released with an EVAL compare-and-delete.
  - The MemoryStore does the same synchronously.
- **Env names.** `UPSTASH_REDIS_REST_URL`/`_TOKEN`, else `KV_REST_API_URL`/`_TOKEN`. The read-only token is never used.

## 4. Answers by number (J-20)

The DN-nn items of the adversary's design challenge correspond one to one to J-nn (R6.3), so each line answers both.

| Item | As built | Killer test (`test/stage6-live.test.ts` unless noted) |
|---|---|---|
| J-01 / DN-01 / H-02 / CH6-02 | Per-client and global keys as named; `/api/live/status` reports `code_failures_this_hour_global`, `…_this_client`, the limit and the 10× ceiling; DEPLOY.md §6 explains how to clear them | "per client and global: 10 clients…"; "one client over its limit cannot lock the others out" (W-01) |
| J-02 / DN-02 / CH6-01 | One EVAL counts the client, and the global only while the client is within its limit (W-01), before any compare; over the limit gives 429 with no compare; a correct code is given back on the keys counted, in their hour (W-05) | "count first: 12 parallel wrong codes…"; "a correct code never counts as a failure…" |
| J-03 / DN-03 | Lease 310 s on Vercel and 1290 s in the container, both ≥ the budget; released by compare-and-delete on the job's token; attempts end by the deadline (W-03) | "a crashed holder's slot comes back through its lease TTL (fake clock)"; "a late finisher never frees another job's slot"; "…the attempt ends at the deadline, no attempt starts after it…" |
| J-04 / DN-04 | Prune at `now − (QUEUE_MAX_WAIT + 10 s)` at admission and at each slot attempt; a job that fails in the queue ZREMs itself | "dead queue entries are pruned at admission…" |
| J-05 / DN-05 / H-19 / CH6-19 | A poll is one GET, plus one ZRANK while queued, with no writes; ids are checked against `^[0-9a-f]{32}$` before the store; the queued loop looks every 2 s; the browser polls every ≥ 2 s; DEPLOY.md §3 gives the Free quota and about 40–60 commands per reading | "polls reject malformed and unknown ids…"; "orphaned jobs… without writing"; app.js pattern test |
| J-06 / DN-06 / CH6-07 | Failed is derived on read: reading past `started_at + 270 s + 10 s`, queued past `created_at + 60 s + 10 s`, or non-terminal past `created_at + 300 s` | "orphaned jobs: a poll derives failed…" |
| J-07 / DN-07 / CH6-10 | The classes are `timeout`, `queue_timeout`, `busy`, `endpoint_429`, `endpoint_5xx`, `endpoint_4xx`, `invalid_model_output`, `model_mismatch`, `store_unavailable` and `internal` (W-06), each with a fixed text; a done job's `receipt.errors[].detail` is replaced by a fixed text (W-02); store errors carry only an HTTP status | the 4 "-> failed …" tests; "a done job carries no provider text" (W-02); "a store that fails at admission…" |
| J-08 / DN-08 / T6-03 / CH6-03 | Disabled on Vercel for any reason means every existing route answers as the real 409fb69a build did, recorded with `test/support/disabled-golden.mjs` from a build of 409fb69a in 3 configurations; the new routes give one identical 503; what is missing goes to the server log only | "every existing route answers byte for byte…"; "the new live routes give one identical refusal…"; "…no access code, live reading stays off" |
| J-09 / DN-09 / H-11 / CH6-11 | F1 lives in the store (`f1` 60 s); `SET f1lock NX`; losers wait up to 3 s for the snapshot; a live receipt takes a fresh snapshot from its own call | "10 concurrent /api/f1 calls… one GET /models", including a second instance after the process cache is dropped |
| J-10 / DN-10 / CH6-12 | `reported.toLowerCase().includes(requested.toLowerCase())`, otherwise failed `model_mismatch`; the receipt keeps `requested_model_id` and `model_id` | "…fails as model_mismatch"; "…reported with a provider prefix" |
| J-11 / DN-11 / CH6-13 | A done result carries `job_id`, `started_at`, `finished_at`, `reading_source: live` and the endpoint `response_id`; `live-jobs.ts` imports no recorded reader or story | the state-machine tests; "the job module imports no recorded reader…" |
| J-12 / DN-12 | The code is taken from the `x-live-access-code` header only (stricter than J-12, accepted in 8950ce99); never from the query string; never stored | "…a code in the query string are refused…" |
| J-13 / DN-13 / CH6-09 | 16 random bytes in hex; size and consent checks run before the code count and the job; the certificate stays in the invocation's memory and is never stored | the 32-hex id check in the state-machine tests |
| J-14 / DN-14 | The deadline is measured from request arrival; `vercel.json` keeps `maxDuration: 300`, which the test reads | "queue wait + reading + margin fit vercel.json maxDuration…" |
| J-15 / DN-15 / CH6-04 | A store error at admission refuses with 503 `store_unavailable`, with no job and no call; one at a slot attempt fails the job; a lost final write turns into failed through J-06 | "a store that fails at admission…" |
| J-16 / DN-16 / CH6-08 | Counters use INCR+EXPIRE in one `/multi-exec`; each job is counted once at admission; a queue-timeout keeps its unit; busy, limit, code and store refusals consume nothing (busy is decided before the INCR, W-04) | "the hourly limit is counted once per job…"; "a job that waits too long… keeps its hourly unit" |
| J-17 / DN-17 / CH6-16 | Fixed allow-list `cg-004`, `cg-005`, `cg-010`; `../` and unknown ids answer 404; the bytes equal `data/CHECKSUMS.sha256`; consent is required server-side | "three allow-listed dataset certificates…" |
| J-18 / DN-18 / CH6-15 | The dependency as in section 2; both sources cited | the Docker log (installs from the lockfile) |
| J-19 / T6-01 | The baseline as in section 2 | "…byte-identical to 409fb69a"; Stage 5 golden request hash |
| CH6-05 / T6-06 | The POST invocation waits; at most 2 waiting (ZADD-first, W-04); 60 + 210 + 30 ≤ 300 | "4 jobs from 2 instances…busy"; the budget test |
| CH6-06 | Real interleaving: 4 jobs on 2 instances with a store delay; at most 2 reading at once | "4 jobs from 2 instances…" |
| CH6-14 / T6-02 | Sentinels for the key, code, store token and base URL are scanned in every response body and header in the file | "no sentinel value… appears in any response" |
| CH6-17 / T6-09 | The same state machine runs on MemoryStore and on the Upstash REST adapter against the fake server; the container uses the in-process store | "job state machine on both store implementations"; "the container runs the same states…" |
| T6-04 | `/api/live/status` shows both counts | as J-01 |
| T6-05 | `/api/live/status` shows `used_this_hour`, `in_flight`, `waiting` and both failure counts; `scope_note` is "global: counted in the shared store across all instances" on Vercel | the state-machine and two-instance tests |
| T6-07 | No path returns stored data from the job API | `failed_falls_back` mutant killed |
| T6-08 | The auditor's live reading, after the push | – |
| T6-10 | No `gemma-4-31b` literal anywhere in `src/` or `public/`; the model comes from `MODEL_ID` | "no Gemma model id is a default…" |
| W-01…W-06 | Fixed in `90ebc69` | the named killers above, and the mutants in section 6 |
| W-07 (adversary 6827a9d2, ruled 546ac950) | The queue's capacity is the free slots plus 2 waiting, measured against the job's rank by admission, minus slot holders still in the queue ahead of it. The holders are read before the rank, so an interleaving can only err towards admitting. The ruling's suggested `rank >= slots + maxWaiting` would admit a 3rd waiting job when 2 are reading, because reading jobs leave the queue | "an idle system admits 4 simultaneous jobs from 4 clients…" (the P13 shape, stable in 8 of 8 repeated runs); "4 jobs from 2 instances… a 5th… busy"; mutants `queue_busy_counts_free_slots`, `queue_bound_ignores_held`. **Worst case (analyst 5bedb68c):** an admission over-admits only when other queued jobs take slots between its read of the holders and its rank, and by at most one waiting job per slot taken in that window, so at most `slots` = 2 extra. The queue then holds at most `maxWaiting + slots` = **4 waiting jobs**, and the next admission is busy. Each extra job is still bounded by the 60 s queue wait and counted in the hour. Pinned by "the worst interleaving over-admits by at most the number of slots: 4 waiting at most…", where a barrier store forces exactly that interleaving for two concurrent admissions |
| A-01 (analyst 66c201bb) | The queue is scored by admission time (FIFO by admission); the waiting bound is ZCARD after the ZADD; a missing rank refuses as busy; refusals come before the hourly INCR; the deadline is still from arrival | "an earlier arrival that reaches admission later cannot overfill or jump the queue…"; mutant `queue_rank_by_arrival` |

The adversary's addendum deltas (54f85bdd) are met:
- the J-01 key names, exactly as named, so the prefix scan does not mix them;
- the full class set as listed;
- the lease of 310 s;
- the queued loop every 2 s;
- the deadline from arrival;
- all 25 licences, as listed in section 2.

## 5. Verification

Logs are in `candidate-1/`.

| Check | Result |
|---|---|
| Fresh clone of bec22567: `npm ci` (0 dirty files), build, `npx vitest run` with MODEL_* unset, **run 3 times** | **382/382**, 382/382, 382/382 (`clean-clone6.log`) |
| `metrics-md --check` | matches |
| Claims | **0 unmapped, 0 stale** (CLAIMS.md has 86 rows) |
| `docker build --no-cache`; the image suite **run twice** with `--network none`; 0 MODEL_*, `LIVE_ACCESS_CODE` or store variables in the container | 354 passed, 28 skipped, both times. The skipped tests are the repository-only checks (no evidence/ or METRICS.md in the image), as in Stage 5 |
| The offline service in the image: `/api/live/status` with `LIVE_READS_PER_HOUR=2` | `enabled: true`, scope "global for this server process: counted in the in-process store", `job_api` present (`docker6.log`) |

Two tests used to depend on timing. In earlier verification runs, one failed in a clean clone and another in Docker. `f12b29f` and `c024789` made them deterministic (a stub `failFirst` mode, a first wave held long enough, budgets that fit a cold start). Since then, all five runs above passed.

## 6. Kill logs

Mutants run in the scratch clone on throwaway branches `impl-mut6/<id>-on-<base>` and `impl-mut5/<id>-on-<base>`, never merged. The appliers are `mutate6.mjs`, `mutate5.mjs` and `mutate5x.mjs`, the runners `kill6.sh` and `kill5.sh`; all are in `candidate-1/`, and every log lists the failing tests of each mutant.

**Stage 6 (`mutants6.log`, base `33d9a85`).** 39 mutants, all killed:
- **36 killed at `33d9a85`.**
- **The other 3 survived there:** `slot_read_then_write`, `attempt_after_deadline` and `internal_as_endpoint`. The tests added in `6224ebd` and `bec2256` kill them, which `mutants6-final-survivors.log` re-runs on the frozen commit `bec2256`, 1 failed test each.
- **Why the `33d9a85` results carry over:** the product code is identical between `33d9a85` and `bec2256` (`git diff 33d9a85 bec2256` touches only `test/stage6-live.test.ts`), so those kills stand.

| Mutant | Guard (S6-14, R6.3, W, A) |
|---|---|
| `code_bypass`, `code_not_constant_time`, `code_from_query`, `deployed_without_code` | S6-01, J-12 |
| `code_count_after_compare`, `code_no_forgive`, `global_counts_over_limit` | J-02, W-01, W-05 |
| `code_fail_per_instance`, `slots_per_instance`, `hourly_per_instance` (each handler with its own key suffix) | S6-14 per instance |
| `slot_no_ttl`, `slot_read_then_write`, `slot_release_without_token`, `lease_ttl_short` | J-03, CH6-06 |
| `timeout_ge_limit`, `attempt_not_capped`, `attempt_after_deadline` | T6-06, W-03 |
| `queue_unbounded`, `queue_rank_by_arrival`, `queue_busy_counts_free_slots`, `queue_bound_ignores_held`, `queue_no_prune` | CH6-05, A-01, W-07, J-04 |
| `poll_writes`, `no_orphan` | J-05, J-06 |
| `failed_falls_back`, `story_labelled_live` | I7, T6-07 |
| `model_mismatch_ignored`, `model_hardcoded` | J-10, T6-10 |
| `f1_hardcoded`, `f1_per_instance` | J-09 |
| `key_in_status`, `code_in_status`, `raw_store_error`, `provider_text_in_done`, `internal_as_endpoint` | CH6-14, J-07, W-02, W-06 |
| `disabled_reason_leak`, `vercel_memory_fallback` | J-08, CH6-04 |
| `ids_uuid`, `samples_any_id` | J-13, J-17 |

**Stage 1–5 mutants re-run where code moved (`mutants5-rerun.log`, base `33d9a85`).** All 40 of the Stage 5 kill set are killed:
- the prize, receipt and identity probes;
- the METRICS and README figures;
- the request golden hash;
- landing on Gemma;
- the E-15 `includeFiles` drop;
- the expectations edit.

The Stage 1–4 product mutants against the reading path (rules, decimals, text layer, request builder) have no code to act on: those files are byte-identical to 409fb69a, as the test pins. The Stage 4 document mutants are covered by the Stage 5 README and prize sets and by the sentence map.

**The two per-instance mutants and timing.** An earlier mutant run was discarded: orphaned runners from stopped tasks were running concurrently in the scratch clone. The run logged here was the only one running. Before freezing, the timing-dependent tests were made deterministic, and three consecutive clean-clone runs plus two Docker runs passed.

## 7. Smoke test under the lease (D6-02): 1 real reading

- **Lease:** taken in msg 2226696e, released in e744b7a2.
- **Configuration:** the Docker image of `af48025` (the job API at this candidate's shape before the W fixes), `MODEL_ID=Gemma-4-31B-IT` in the container environment only, `LIVE_READS_PER_HOUR=3`, no code, no store.
- **The reading:** sample cg-004, downloaded from `/api/samples`. Its states were: 202 queued (position 1), reading, done at 46 s.
  - `reading_source` live; model reported `self-dploy/Gemma-4-31B-IT`; F1 on; proposal release (expected release).
  - The endpoint `response_id` and cost are in `smoke/smoke6.log`.
- **/usage:** `all_time.requests` went 173 → 174, so exactly one chat completion. `daily_cost_used` rose by 0.0001025181, against a reported cost of 0.0001025185.
- **Evidence:** `evidence/runs/certgate-001/stage-6/implementer/smoke/`.
