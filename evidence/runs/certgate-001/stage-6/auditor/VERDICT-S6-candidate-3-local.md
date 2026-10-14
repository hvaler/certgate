# Auditor verdict, Stage 6 candidate 3: LOCAL ACCEPTANCE (S6-12) — ACCEPTED

Candidate `9759d3af0b23e532f71cf0072112b4d5dce6c612`, tree `022264f90a2fab9fdd44715c5779f1c8a41e4698`. It is `cc5d470b`
plus a test-only commit.
- Register R6.5: K-01, K-02, K-03 and K-04, as amended in 74fd3401. Repair cycle 2 of 4, an operator-ordered
  security repair (`stage-6/OPERATOR-SECURITY-REPAIR.txt`).
- The analyst's ruling 5df87015 (option b) assigns the heavy checks to the auditor's slot after the host stopped the
  implementer's run.
- Audited in `C:\nexus\dev\certgate-audit-s6c3` from 17:41Z to 17:58Z, in the slot announced in fb902e88.
- The host had 4.6–6.7 GB free, so vitest ran with `--maxWorkers=4`.
- No endpoint call was made.

**Result: candidate 3 is ACCEPTED for local acceptance.** This is **not** the final Stage 6 verdict. That verdict
needs the human's push and redeploy, then S6-13 with K-04 against https://certgate-wheat.vercel.app. Two readings
remain under K-03.

## The R6.4 delta (vs candidate 2 `730bd439`)

| Item | Check | Result |
|---|---|---|
| Product files | `src/web/app.ts` (`clientKey`; code gate), `live-jobs.ts` (`countCodeAttempt`, `forgiveCode`, the new `recordCodeFailure`; global ceiling removed), `live-store.ts` (the COUNT_ATTEMPT Lua script and `countAttempt`/`forgiveAttempt` removed; `forgive`). Docs: README, DEPLOY, CLAIMS, claims map, EVIDENCE-INDEX, `.env.example`, the new `docs/sources/vercel-request-headers.md`. S6-09 paths: 0 changes | as ruled |
| K-01 | On Vercel the key is SHA-256(`x-vercel-forwarded-for`) only. Without that header there is one shared key (fail closed). In the container the key is the socket address. `x-forwarded-for` and `x-real-ip` are never read. The source page is cited verbatim, with the retrieval date. Whether Vercel overwrites a client-sent `x-vercel-forwarded-for` cannot be shown offline; **K-04 tests it live** | code and source OK; live part pending |
| K-02 | The per-client counter is a single `/multi-exec` INCR+EXPIRE before the compare, 429 when over the limit, and DECR on a correct code. The global counter is INCR'd **only after a wrong compare** and refuses nothing. `code_failure_ceiling_global` is removed from status | OK |
| Docs | DEPLOY.md §6 states the residual (guessing spread over many addresses is bounded only per address), recommends a random code of at least 20 characters, and explains how to clear one client's lockout | OK |

## Local checks

| Check | Result |
|---|---|
| Fresh install: `rm -rf node_modules dist`, `npm ci` (0 dirty), build. **5 suite runs** (`candidate-3/clean-clone.log`) | runs 2–5: **397/397**. Run 1 (the cold one) failed **1 test**: "a job that waits too long fails as timed out in queue…", with `AssertionError: expected … to match { state: 'failed' … }` after its 5 s poll. See O6-04 |
| METRICS · claims | matches · 0 unmapped, 0 stale |
| R6.4-delta mutants (`candidate-3/s6-mutants-delta.log`, 13, all **killed**) | key from `x-forwarded-for` (K1); key from `x-real-ip` (K1b); container trusting a header (K1c); global INCR before the compare (K2); global INCR also on a correct code (K2b); a global ceiling refusing a correct code (K3); a wrong code not counted globally (K4); INCR and EXPIRE as two requests (K5); the `KV_*` fallback dropped (K6); lockout ignored (A1); code bypass (A2); no forgive on a correct code (A8); DEL script always deleting (D1) |
| Other Stage 6 mutants | Carried forward from candidate 2 (19/21 mine, with A7 and J7 equivalent; 51/51 the adversary's), because their code did not move. The COUNT_ATTEMPT Lua mutants (S2, S3) are retired along with the script |
| T6-09 Docker (`candidate-3/docker.log`) | `--no-cache` build at 6.7 GB free, then 1 run with `--network none` and 0 MODEL_*, code or store variables: **369 passed, 28 skipped (repo-only), 0 failed**. A second run was skipped for memory and time |
| `DEL_IF_EQUALS_SCRIPT` | Unchanged (same text and pin as candidate 2), so the real-Redis result carries forward (`candidate-2/lua-real-redis.log`) |
| T6-02 secrecy (`scan-head-tree-and-dist.txt`, `scan-code-digest.txt`) | Code value 0 and code SHA-256 hex 0 in 1461 files (tree plus `dist/`) and 1566 history blobs. MODEL_API_KEY 0. Base-URL host and path 0. Generic hits are only the known fakes (O4-03, O6-01) |

## Observations (not blocking)

- **O6-04 (infrastructure): one cold-run failure under host memory pressure.** The failing test and the queue code
  it exercises are **unchanged since candidate 2**, where 5 consecutive cold runs passed with normal free memory.
  This run had 4.6 GB free, and the implementer's run was stopped by the host for low memory minutes earlier. The
  test uses real-time budgets (1.5 s queue wait, 5 s poll), which a cold, memory-starved run can exceed. The other 4
  runs passed. A later tests-only hardening is suggested: bound the poll by a longer deadline, or use a fake clock.
  This is not the F6-02 defect, which was an iteration-bounded loop that failed under normal conditions.
- **O6-01, O6-02 and O6-03** stand as recorded.
- **Access-code strength.** Under K-02 the code's entropy is the main barrier. I gave the human my advice on the
  current code's strength privately, not in the repository. Rotating it per DEPLOY.md §6 is the human's call and does
  not block acceptance.

## Next

- The human pushes a commit containing 9759d3af. Vercel redeploys.
- I run S6-13 with K-04 under an announced lease: 2 wrong codes; the plain and forged status counts must be equal,
  and the plain count must rise by exactly 2; one real reading; secrets checked in every exchange.
- Then the final Stage 6 verdict.
