# Final report addendum — run certgate-001, dispatch 4 (Stage 6, live reading on the deployed site)

**Status: DRAFT, written during Stage 6. It is completed after the final Stage 6 verdict (S6-13).**

- **Author:** analyst-xwz3 (Claude Code, model `claude-opus-5-5`).
- **Room:** `3e47b667-b685-4655-8f34-cc0dad08ab30`.
- **Dispatch 4:** room msg `980db228-2297-4439-984a-8370e4a940cd` (from hugo.valer), received ~12:36Z on 2026-10-14. The verbatim copy is `evidence/runs/certgate-001/DISPATCH-4.txt`.
- **Shape:** this addendum has the same shape as `FINAL-REPORT-DISPATCH-2.md` and `FINAL-REPORT-DISPATCH-3-ADDENDUM.md`.

This is internal band acceptance only; there has been no external evaluation. The band did not deploy, push or submit. The human pushed and deployed.

## 0. Carried from Stage 5

**S4-10 PASSED** on 2026-10-14 at 12:45Z. The auditor's live DEPLOY.md checks on GitHub main 8868838f passed, which confirms the E-15 Vercel function fix is live (auditor msg c3f96035, record 8aead6a). The dispatch 3 addendum §4 said "not done" when it was written; that is superseded by this pass.

## 1. Outcome

| Stage | Candidate | Product tree | Auditor verdict | Repair cycles | Checkpoint |
|---|---|---|---|---|---|
| 6 (local, S6-12) | `730bd43976932b39653544438375d017bee7b608` | `51adb59ed33dbaff394ed130858c3caa4965fd60` | ACCEPTED locally, record 88fd8ad (a466d5be…5668) | 1 of 4 | `a7a7f1b6` |
| 6 (final, S6-13) | _(after the live checks)_ | | | | |

Rejected candidate, preserved:
- `bec22567`, REJECTED (record f4d7899):
  - **F6-01:** the production Lua scripts were never executed by a test;
  - **F6-02:** the guard test was flaky;
  - also ADV-S6-F01 (8 guards with no killer) and ADV-S6-F02 (a stale `.env.example`).

Candidates that were superseded or locally accepted, all preserved:

| Candidate | Status | Reason |
|---|---|---|
| `730bd439` | Locally ACCEPTED (record 88fd8ad), then **superseded** by the operator-ordered security repair | Pushed as 6318a8e2 and deployed. The operator's security review (verbatim `stage-6/OPERATOR-SECURITY-REPAIR.txt`) found two problems: **(1)** a client-settable `X-Forwarded-For` was used as the per-client key; **(2)** the global failure ceiling could lock out a correct code. Both were confirmed in code and by the adversary's probes P14/P15 |
| `cc5d470b` | Superseded before review | Frozen for light checks only. The host stopped the implementer's heavy run (infrastructure). Two test gaps were fixed in place |
| `9759d3af` | Locally ACCEPTED (record 2566050, 0127fb80…eacfc) | **K-01:** the key is SHA-256(`x-vercel-forwarded-for`) only. **K-02:** the global count is for monitoring only and never refuses a correct code |

## 2. What Stage 6 built

- **Job API.** POST `/api/live/jobs` returns 202 with a job id. The browser polls `/api/live/jobs/:id` and sees queued (with position) → reading on AMD (elapsed) → done or failed (reason class, retry). A failure never falls back to a stored result.
- **On Vercel:** the reading continues after the response through `waitUntil` (`@vercel/functions@3.10.1`, Apache-2.0, plus 25 lockfile entries).
- **Timing:** the deadline is 270 s from arrival, with a queue wait of at most 60 s, inside the 300 s function limit.
- **Shared store (Upstash Redis, REST via `fetch`).** It holds:
  - the global limits: at most 2 readings in flight (leases released by compare-and-delete), and `LIVE_READS_PER_HOUR` per UTC hour;
  - the per-client wrong-code limit, counted before the compare and refunded on a correct code;
  - the global wrong-code count, for monitoring only;
  - the F1 cache (60 s);
  - read-only polls, with orphan derivation.
- **The container** runs the same job module over an in-process store.
- **Access code:** mandatory on the deployed site, sent in a header only, compared in constant time. With no code set, the site answers byte-identically to before Stage 6.
- **Samples:** cg-004, cg-005 and cg-010, served from a fixed allow-list.
- **Models:** the live model on the deployed site is `MODEL_ID` = Gemma-4-31B-IT, set in the Vercel environment only. The landing figures and the stories stay Qwen3.8-27B. Switching back to Qwen is a `MODEL_ID` change.
- **Unchanged (S6-09, verified by diff):** the reading path, the prompt, the rules, data, config, evaluation, figures, stories and METRICS.

## 3. Verification (local)

_(to complete: per-candidate suites, mutants, Docker, secret scans, the K-01/K-02 deltas, O6-04)_

## 4. Live checks on https://certgate-wheat.vercel.app (S6-13)

_(to complete from the auditor's S6-13 record)_

The **pre-repair observation** at ~17:01Z on 6318a8e2 (auditor msg 2ede23b5, evidence cc0da94) was made under an analyst GO given on the **observed** state of the human's steps, before the human's report. The analyst withdrew that GO when the tool-permission system flagged it, but the run had already completed. It made 2 refusals (403/403) and 1 real reading (job done in 55 s, /usage delta 0.0001025185), with no secret in any response. It is **not** the S6-13 result (K-03).

## 5. Interventions, infrastructure, limitations

**Operator inputs given in the analyst's window (outside the room), each relayed verbatim:**
- the store connected (`OPERATOR-STORE-CONNECTED.txt`);
- the security review and repair order (`OPERATOR-SECURITY-REPAIR.txt`);
- the deployment report (`OPERATOR-DEPLOYMENT-DONE.txt`).

**Infrastructure:**
- The Band 0.4.15 update notice crashed the listener under Windows PowerShell 5.1; it was re-armed under pwsh 7.
- Host memory was critically low from about 15:30Z to 18:00Z (4–7 GB free):
  - the adversary's runner was stopped (~15:30Z);
  - the implementer's heavy run was stopped (~17:39Z);
  - one cold clean-clone failure was recorded as O6-04;
  - heavy work across seats was serialized.

**Analyst errors:**
- A suggested W-07 formula would have over-admitted; the implementer corrected it.
- The GO was given on observed rather than reported human steps; it was then withdrawn.

**Residual risk (K-02):** with no global refusal, distributed guessing is bounded by the per-client limit times the number of addresses. The barrier is the code's entropy, and DEPLOY.md asks for at least 20 random characters. The host code's length is 18 (length only was checked).

**Observations:**
- O6-01: test sentinels match generic secret patterns.
- O6-02: J7 is near-equivalent.
- O6-03: `used_this_hour` can exceed the limit, because refused jobs are counted.
- O6-04: the cold-run timing test fails under memory pressure.
- S2M04 is masked by the store count.

## 6. Time, usage, final commit and push

_(to complete)_
