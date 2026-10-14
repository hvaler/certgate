# Auditor verdict, Stage 6 candidate 1 (local acceptance, S6-12): REJECTED

Candidate `bec225675bf653d092b7aa2a304ee347e602a134`, tree `79b374e5b9f6f7b10cc6a45cb298059ab897096b`. Register R6.3
(J-01…J-20, T6-01…T6-10), with the rulings on W-01…W-07 and A-01.
- Implementer handoff: msg 72442980, record 2c426e1. Analyst freeze: msg 8602faf7.
- Audited in a fresh clone, `C:\nexus\dev\certgate-audit-s6c1`, from 14:55Z to 15:12Z. The adversary bundle had not
  arrived when this was written.
- No endpoint call was made.

**Result: REJECTED on F6-01 (a surviving mutant) and F6-02 (a guard test that fails intermittently).** Both repairs
are **tests only**; the product code needs no change. Everything else passes, as listed below, and carries forward if
the repair touches only `test/`. Repair cycle 1 of 4 is used.

## Findings

### F6-01 (REJECT): the production Lua scripts are never executed by a test, so a wrong script survives

The deployed site uses `UpstashRestStore`. It runs two Lua scripts through EVAL:
- `COUNT_ATTEMPT_SCRIPT`, which is the whole of J-02 and W-01 on Vercel;
- `DEL_IF_EQUALS_SCRIPT`, the slot compare-and-delete of J-03.

`test/support/fake-upstash.mjs` imports the same two constants. It recognises a script by identity
(`a[0] === COUNT_ATTEMPT_SCRIPT`) and emulates it in JavaScript. A change to the script text is therefore invisible
to every test.

**My mutant S2** (`candidate-1/s6-mutants.log`) changes the script's guard `if c <= tonumber(ARGV[2])` to
`if true`. That brings back W-01 on the deployed site: an over-limit client keeps adding to the global counter and
locks the judge out. The mutant **survived, 382/382**. A surviving non-equivalent mutant blocks acceptance; the
precedent is S3M06 and S2M02br.

**What I verified independently.** I ran the scripts of this candidate, read from its `dist/`, on real Redis 7.4.10
in Docker with `--network none` (`candidate-1/lua-real-redis.log`). Both are **correct as committed**:
- **Count script, client A with limit 2:** `1 1 1`, `2 2 1`, `3 2 0`, `4 2 0`. Once the client is over its limit,
  the global counter stops.
- **Client B:** `1 3 1`.
- **TTLs:** 7200 s.
- **Compare-and-delete:** a wrong token gives 0 and keeps the slot; the right token gives 1 and deletes it.

The product is correct today. What is missing is the guard that keeps it correct.

**Required repair (tests only):** a test must fail when either script's text changes. Either:
- **(a)** pin the SHA-256 of both script texts in a test, with a comment pointing at this verification log, or
- **(b)** make the fake server match a script copied verbatim into the test, not imported from `src/`.

My S2 mutant and a matching mutant of `DEL_IF_EQUALS_SCRIPT` must then be killed.

### F6-02 (REJECT): the guard test "4 jobs from 2 instances…" fails intermittently from a clean clone

`clean-clone.log`, run 1 (the first run after `npm ci` and the build) shows **381/382**:
- **Failed:** `stage6-live.test.ts > global limits across two instances … > 4 jobs from 2 instances: at most 2
  reading at any time…`, which took 5082 ms.
- **Later runs:** 2 and 3 passed, and so did 4 more full runs (`flake-fullsuite.log`). That makes 1 failure in 7
  full runs. In isolation it passed 6 of 6 (`flake-isolated.log`).
- **Passing time:** 4194 ms (verbose run).

**Likely cause:** its poll loop is bounded by **iterations**, `for (let i = 0; i < 400; i++)` with a 10 ms sleep
and 4 HTTP calls each. The bound is about 4–5 s of wall time, while the jobs need 2 × 1.5 s plus overhead. Under the
load of the full parallel suite, the loop can end before all four jobs are done, and the final `done ×4` assertion
fails. I could not capture the failing assertion. A real breach of "at most 2 in flight" is therefore not excluded
by the log alone, but every other run and my mutants J2 and J3 support the timing explanation.

A guard of S6-03 that fails 1 time in 7 from a clean clone does not meet "the full suite from a clean clone passes"
(S6-12). The implementer's record also states that the timing-dependent tests were made deterministic.

**Required repair (tests only):**
- bound the loop by **time**, for example a deadline of at least 30 s;
- report which assertion failed if it does fail;
- show 5 consecutive full clean-clone runs passing.

## Checks that pass (they carry forward to a tests-only repair)

| Check | Result |
|---|---|
| T6-01 / S6-09: `git diff 409fb69a bec22567` on the reading path, `live-reader.ts`, `data/`, `config/`, `evaluation/`, `public/figures.json`, `public/stories/`, `vercel.json`, `METRICS.md` | **empty** |
| T6-01: stub-captured request bodies (`request-bodies.txt`) | Qwen and Gemma for cg-004 and cg-021: **byte-identical to 409fb69a**, and equal to the Stage 5 hashes `bce915c3…`, `7bddbf11…`, `87bf11ea…`, `85d8c5fb…` |
| Product files changed | only `src/web/app.ts`, `limits.ts`, `api/index.ts`, `public/app.js`, `package*.json`, `.env.example`, plus the new `live-jobs.ts`, `live-store.ts` and `deadline-reader.ts` |
| METRICS check · claims | matches · 0 unmapped, 0 stale |
| T6-09 Docker (`docker.log`) | `--no-cache` build; 2 runs with `--network none` and 0 MODEL_*, `LIVE_ACCESS_CODE` or store variables: **354 passed, 28 skipped (repo-only), 0 failed**, both times |
| My Stage 6 mutants (`s6-mutants.log`, 19) | **16 killed**: lockout ignored; code bypass; code from the body; deployed without a code; provider text kept (W-02); model mismatch ignored; no forgive on a correct code; failed job carrying a stored result (I7); short lease; unbounded queue; queue by arrival (A-01); no orphan rule (J-06); deadline ignored; hourly count dropped; deadline with no margin (T6-06); MemoryStore global over limit (W-01). **Survived: S2 → F6-01.** A7 (in-memory fallback on Vercel) is **equivalent**: without store variables, `deployedMissing` = "store" and the job gate refuses first, so the fallback store is never used. J7 (slot released at the deadline) is **near-equivalent**: `DeadlineReader` ends every attempt by the deadline and starts none after it, so provider concurrency stays at most 2. Recorded as O6-02 |
| Code review | Count-first EVAL before the compare; header-only code (`x-live-access-code`); constant-time compare over SHA-256 digests; per-client key `sha256(first x-forwarded-for hop)`, never stored raw; read-only polls; three J-06 orphan rules; FIFO by admission with a null rank refused; deadline 270 s from arrival with lease 310 s; container lease 1290 s ≥ budget; done results with provider text replaced (W-02); `internal` reason class (W-06) |
| Per-client key cannot be spoofed (`vercel-xff-source.md`) | Vercel documents that it overwrites `X-Forwarded-For` "to prevent IP spoofing", with no external IPs except via an Enterprise Trusted Proxy. `x-real-ip` is identical. The residual risk of about 10 real addresses reaching the global ceiling is the one H-02 accepts, and DEPLOY.md §6 says how to clear it |
| DEPLOY.md | It names every variable, with secrets marked; the store pair and the read-only token excluded; the budget; the post-deploy checks, including one real reading; both lockout limits and how to clear them; `MODEL_ID` switch-back with no code change |
| Secrets (`scan-head-tree.txt`, `scan-history.txt`) | MODEL_API_KEY value 0. Base-URL host and path 0. `LIVE_ACCESS_CODE` is not set on this host yet, so it is scanned at S6-13. The new generic-pattern hits are **only** the fake sentinels in `test/stage6-live.test.ts` (`sentinel-access-code-…`, `sentinel-model-key-…`, `sentinel-store-token-…`), which are not credentials (O6-01, like O4-03) |

## Observations (not blocking)

- **O6-01.** The fake sentinel strings in `test/stage6-live.test.ts` match generic secret patterns. They are not
  credentials. If GitHub push protection flags them, they can be allowed as test values.
- **O6-02.** Mutant J7 (releasing the slot when the deadline fires) survives, but it is near-equivalent today
  because of `DeadlineReader`. A future test could pin "the slot is kept until the work settles".
- **O6-03.** `admit()` counts a job in `reads:<hour>` before refusing it as over the limit, so `used_this_hour` can
  read above `LIVE_READS_PER_HOUR` once the limit is reached. The limit itself holds. For T6-05 live I will compare
  the counter before and after my own reading, below the limit.

## Next

- A tests-only candidate 2 with F6-01 and F6-02.
- I re-run S2 and a DEL-script mutant, 5 clean-clone runs, and the Lua check.
- Local acceptance, then the push request, then the human's deployment, then the S6-13 live checks.
