# Stage 6 candidate 3: implementer handoff (repair cycle 2 of 4, operator security repair R6.4)

**Candidate commit `9759d3af0b23e532f71cf0072112b4d5dce6c612`, tree `022264f90a2fab9fdd44715c5779f1c8a41e4698`**
(frozen). It is three commits on top of candidate 2:
- `69eeca1`: K-01, K-02 and the docs;
- `cc5d470`: two more killers, K-01 in the container and the `KV_*` fallback;
- `9759d3a`: tests only. It pins the K-01 fail-closed branch, which kills `k01_no_header_fresh_key`.

`src/` and the docs are identical at `cc5d470` and `9759d3a`.

**Input:** candidate 2 `730bd439` (tree `51adb59e`), which was accepted locally and pushed as part of 6318a8e2. It is
preserved.

**Task:** the analyst's repair 2, msgs 425e7ddd … 06cb131c, with register **R6.4** (commit 9ccb909). The design was
approved by the analyst (eda6c1f2), the auditor (f223f589) and the adversary (16856262; residual accepted in 36bf337e).

**Operator instruction:** quoted verbatim in `stage-6/OPERATOR-SECURITY-REPAIR.txt`.

No endpoint call was made, and nothing was pushed. Logs are under `stage-6/implementer/candidate-3/`.

## 1. Diff vs 730bd43, with the reason for each change

`git diff --stat 730bd43 9759d3a -- . ':!evidence'`: 12 files; `9759d3a` adds 5 test lines to `cc5d470`'s diff of 191 insertions and 110 deletions.

| File | Change | Why |
|---|---|---|
| `src/web/app.ts` | `clientKey()`: on Vercel, the hash of `x-vercel-forwarded-for` only, with one shared key `no-platform-client-address` when it is absent; in the container, the socket address only. The code check calls `recordCodeFailure()` after a wrong compare only. `code_failure_ceiling_global` is removed from `/api/live/status` | K-01, K-02 |
| `src/web/live-jobs.ts` | `countCodeAttempt()` is now `incr(client)` and nothing global. `forgiveCode()` gives back the per-client unit only. New `recordCodeFailure()` is `incr(global)`, a monitoring count. `GLOBAL_CODE_FAILURE_FACTOR` and the ceiling are removed | K-02 |
| `src/web/live-store.ts` | `countAttempt`/`forgiveAttempt` become `forgive(key)`, which is DECR in one `/multi-exec`. **`COUNT_ATTEMPT_SCRIPT` is removed** | K-02: no script is needed, because each counter is a plain INCR+EXPIRE transaction (J-16) |
| `test/support/fake-upstash.mjs` | the count-script copy is removed; only the DEL copy is left, and other script texts are still refused | K-02 / F6-01 |
| `test/stage6-live.test.ts` | the helper sends the client address in `x-vercel-forwarded-for` (and, as `spoof`, in `x-forwarded-for` and `x-real-ip`). New killers in section 4. The old global-ceiling test is replaced by K-02 (a). The pin test now pins the one remaining script and asserts that no other EVAL or Lua text exists | K-01, K-02 |
| `docs/sources/vercel-request-headers.md` (new) | the Vercel quotes, the URL and the retrieval date, and the reasoning | K-01 |
| `DEPLOY.md` §4 and §6 | per-client limit; the global count is monitoring only and never refuses; **the residual risk, with a long random code (≥ 20 random characters)**; clearing a lockout uses the per-client key | K-02 and the adversary's residual (36bf337e) |
| `README.md`, `.env.example` | the `LIVE_CODE_FAILURES_PER_HOUR` row and comment: other clients' wrong codes never block a correct code | K-02 |
| `CLAIMS.md` C-80, `claims-map.json`, `EVIDENCE-INDEX.md` | C-80 reworded: R6.4 K-02 supersedes the former global ceiling of W-01; the residual is stated. New proofs; the 6 new units are mapped to C-80. The new source is listed in the index | claims |

**Unchanged (S6-09):** the reading path, `live-reader.ts`, `data/`, `config/`, `evaluation/`, `vercel.json`, the
package files, `figures.json`, the stories and `METRICS.md`. The `KV_*` fallback in `storeEnv()` is also unchanged,
and is now guarded by a test.

## 2. K-01: the Vercel documentation

**Source:** https://vercel.com/docs/headers/request-headers (`last_updated: 2025-12-13`), retrieved by me on
2026-10-14 at ~17:18Z. It is quoted in full in `docs/sources/vercel-request-headers.md`. The page lists these
headers in this order:
- `x-forwarded-for`: "we currently overwrite the `X-Forwarded-For` header and **do not forward external IPs**. This
  restriction is in place to prevent IP spoofing." A custom value passes with a Trusted Proxy ("available on
  Enterprise plans").
- `x-vercel-forwarded-for`: "This header is identical to the `x-forwarded-for` header. However, `x-forwarded-for`
  could be overwritten if you're using a proxy on top of Vercel."
- `x-real-ip`: "This header is identical to the `x-forwarded-for` header."

**What CertGate uses:** on Vercel, `x-vercel-forwarded-for` only. It is the only header the page sets apart as
unaffected by a proxy in front of Vercel. The `x-forwarded-for` guarantee is qualified twice ("currently", and the
Trusted Proxy), and `x-real-ip` has no guarantee of its own.
- **Without the platform header**, every request shares one key, so the failure is closed: no fresh budget per
  request.
- **In the container**, no header is trusted; the key comes from the socket address.

## 3. K-02: a correct code is never refused because of other clients' failures

| Counter | When it is counted | What it can refuse |
|---|---|---|
| per client `certgate:live:codefail:c:<hash>:<hour>` | **before** the compare, INCR+EXPIRE in one `/multi-exec` (J-02, J-16); DECR (one `/multi-exec`) on a correct code | over `LIVE_CODE_FAILURES_PER_HOUR`: 429, with no compare |
| global `certgate:live:codefail:g:<hour>` | **only after a wrong compare**, INCR+EXPIRE | **nothing.** It is a monitoring count (`code_failures_this_hour_global` in status) |

**Still in force:** `LIVE_READS_PER_HOUR` and the per-client limit. The `/api/live/status` field
`code_failure_ceiling_global` is removed.

**Residual** (the adversary's 16856262, required by the analyst's 36bf337e): with no global refusal, a guess spread
over many client addresses is bounded only by the per-client limit per address and per hour. The barrier is the
code's entropy. DEPLOY.md §6 states this and tells the human to use at least 20 random characters from a password
generator. The sentence is mapped to C-80.

**Lua:**
- `COUNT_ATTEMPT_SCRIPT` is **removed**.
- The only script left is `DEL_IF_EQUALS_SCRIPT`, unchanged:
  `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`, SHA-256
  `58c1e79c3e95626750ef05e2e74a7f650a45d44acbee56a3fa9df61b30d58631` (pin unchanged; SHA-1 prefix `e9f69f2beb75`).
- The fake holds only that copy.
- The pin test also asserts that `live-store.ts` has exactly 1 `"EVAL"` call site and one Lua text.

## 4. Killers (in `test/stage6-live.test.ts`)

| Requirement | Test | Asserts |
|---|---|---|
| K-01 (P14 shape) | "K-01: rotating a client-set X-Forwarded-For and X-Real-IP while the platform header stays fixed still hits the per-client limit" | `VERCEL=1`, limit 3, fixed `x-vercel-forwarded-for`, XFF and X-Real-IP rotated: `403,403,403,429,429,429`, then the correct code from that client gets 429. Without the platform header, rotated spoofed headers give `403,403,403,429` (one shared key) |
| K-01 (source) | "K-01: the client key is read from x-vercel-forwarded-for on Vercel and from the socket in the container; x-forwarded-for and x-real-ip are never read" | `clientKey()` reads only those two values; the source file exists |
| K-01 (container) | "K-01 in the container: no header is trusted; rotating X-Forwarded-For and X-Real-IP from one socket still hits the per-client limit" | limit 2, with XFF, X-Real-IP and the platform header all rotated: `403,403,429,429` |
| K-02 (a), never blocks | "K-02 (a): with the global failure count far over the old ceiling (10 x the limit), a client within its own limit and the correct code gets 202" | 15 clients fail at a limit of 1 (old ceiling 10). Global count 15, no ceiling field. A fresh client with the correct code gets **202**; a fresh client with a wrong code gets 403, not 429 |
| K-02 (b), J-02 kept | "count first: 12 parallel wrong codes from one client against a slow store give exactly the limit of 403s, the rest 429; then even the right code is 429" (unchanged) | exactly 5×403 and 7×429 |
| K-02 (c) (P15 shape), wrong code counted once | "K-02 (c): a correct code after other clients' failures leaves the global failure count unchanged, and its own unit is given back" | 4 wrong codes give global `"4"` (once each). A correct code gets 202, global stays `"4"`, and the client's own count is `"0"` |
| J-16 | "S6M-g6 (J-16): on Upstash, incr and forgive are each ONE REST request (multi-exec) …" | 1 request each; the TTL is kept |
| `KV_*` fallback | "the store variables: the Upstash names first, else the KV_* names the deployed integration set …" | KV-only gives the KV pair; both sets give Upstash; the read-only token gives null |
| W-01 (other clients unaffected) | "one client over its limit cannot lock the others out …" (unchanged) | B's right code gets 202 after A's 20 wrong codes |

## 5. Verification of candidate 3

**Run on cc5d470, then stopped by the host (infrastructure, not a test result).**
- The heavy run went in series: mutants first, then 5 cold clones, then Docker.
- Claude Code stopped it at about 17:39Z because the host was critically low on memory. 31 of the 58 mutants had
  completed on the full suite. The clean clones and Docker had not started.
- Leftover processes were killed.
- Under the analyst's one-heavy-job rule and the host rule, I did not restart it. The auditor's heavy slot covers
  `9759d3a` (fb902e88): 5 cold runs, its own 27 mutants including the K-01/K-02 classes, Docker, the DEL script on
  real Redis, and the scans.

**Local, light (9759d3a):** the full suite at `cc5d470` is **397/397**; `9759d3a` changes only one K-01 test, whose
3 K-01 tests pass. Claims: 0 unmapped, 0 stale.

**Mutants completed** (`candidate-3/mutants6-c3.log`, base `cc5d470`, full default suite):

| Mutant | Result |
|---|---|
| `k01_xff_first_hop` (key from the XFF first hop) | KILLED, 2 |
| `k01_xreal_ip` (key from x-real-ip) | KILLED, 2 |
| `k01_container_trusts_xff` | KILLED, 2 |
| `k01_no_header_fresh_key` (no platform header: socket or random key) | **survived at cc5d470**. Every test socket is 127.0.0.1, so the K-01 behaviour test could not tell it apart. **Killed at 9759d3a** by the pinned fail-closed branch in "K-01: the client key is read from x-vercel-forwarded-for …", checked by applying the mutant in place |
| `k02_global_blocks_correct` (global ceiling refusing a correct code) | KILLED, 1 |
| `k02_global_before_compare` | KILLED, 4 |
| `k02_global_on_correct` | KILLED, 2 |
| `k02_wrong_counted_twice` | KILLED, 3 |
| `k02_client_incr_after_compare` (read-then-write after the compare) | KILLED, 2 |
| `k02_global_not_counted` | KILLED, 3 |
| `forgive_split_requests` (J-16) | KILLED, 1 |
| `kv_fallback_dropped` | KILLED, 3 |
| `code_bypass` | did not apply at cc5d470, because the code check was restructured and its pattern no longer matched. With the pattern fixed: **KILLED, 10** (in place, at 9759d3a) |
| 18 more candidate-2 mutants: `code_not_constant_time`, `code_no_forgive`, `code_fail_per_instance`, `code_from_query`, `slots_per_instance`, `slot_no_ttl`, `slot_read_then_write`, `slot_release_without_token`, `lease_ttl_short`, `hourly_per_instance`, `timeout_ge_limit`, `queue_unbounded`, `queue_rank_by_arrival`, `queue_busy_counts_free_slots`, `queue_bound_ignores_held`, `queue_no_prune`, `poll_writes`, `no_orphan` | all KILLED |
| not run because of the host stop (26): `failed_falls_back` … `internal_as_endpoint`, including the adversary-ported and Lua DEL mutants | the product code they target did not move between `730bd43` and `9759d3a`, and all of them were killed at 730bd43 (candidate 2, 49/49) |

**Retired, because the code they targeted was removed by K-02:**
- `code_count_after_compare`, replaced by `k02_client_incr_after_compare`;
- `global_counts_over_limit` (the W-01 global ceiling no longer exists);
- `lua_count_guard_true` (`COUNT_ATTEMPT_SCRIPT` no longer exists).

**Not run by me:** the 5 cold clean clones and Docker on candidate 3. They are covered by the auditor's slot
(fb902e88).
