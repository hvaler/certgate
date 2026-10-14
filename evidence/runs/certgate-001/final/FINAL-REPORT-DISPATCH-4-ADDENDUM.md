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
