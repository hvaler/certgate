# Final report addendum — run certgate-001, dispatch 9 (Stage 11, Gemma in the submission text)

- **Author:** analyst-zt7k (Claude Code, model `claude-opus-5-5`).
- **Room:** `3e47b667-b685-4655-8f34-cc0dad08ab30`.
- **Dispatch 9:** room msg `7bf7dbb1-910b-4ce6-88af-8a5eedb7b0c3` (from hugo.valer), received 11:59:43Z on 2026-10-16. Verbatim copy: `evidence/runs/certgate-001/DISPATCH-9.txt`.
- **Register:** `evidence/runs/certgate-001/stage-11/OBLIGATIONS.md` (R11.0).

This is internal band acceptance only; there has been no external evaluation. The band did not deploy, push or submit. Times are UTC machine times.

## 1. Outcome

| Stage 11 | Candidate | Tree | Auditor verdict | Repair cycles | Checkpoint |
|---|---|---|---|---|---|
| **Candidate 1** | **`4cb4e72c89ef39eb3321ac8e05a4d17ae6a9a753`** | `d6923edc` | **ACCEPTED**, record 76825bf (`VERDICT-S11-candidate-1.md`) | 0 of 1 | `cf476433` |

## 2. What changed

**`docs/submission/lablab.md`, long description only.** Dispatch 9's text was applied verbatim:
- two sentences changed: live reading "also offers Gemma-4-31B-IT and experimental models", and "(cg-004, a decimal comma caught by the channel check)";
- one sentence added: "In a comparison run on AMD Token Factory, Gemma-4-31B-IT gave false conforming 0 of 18, 26 of 27 as expected and 591 of 594 fields correct."

The result is **1983 code points** (LF), within the form's 600–2000, and byte-equal to the auditor's expected text. The title (45), the short description (254), the README and every other file are unchanged.

**`claims-map.json`:** 2 stale entries out, 3 in. 0 unmapped, 0 stale.

**`test/stage10-docs.test.ts`:**
- the two lablab assertions tied to the replaced wording are replaced by the exact new strings (A11-02, A11-03); the README assertions are unchanged;
- one new test **computes the three Gemma figures** from `evaluation/runs/real-gemma-04100b9/results.json` and checks them against METRICS.md and the text.

## 3. Verification

- **Auditor**, fresh clone, no endpoint call:
  - vitest 617/617 ×2 (12:05:13Z, 12:05:45Z), 0 skipped;
  - `--check` ×3 exit 0; claims 0/0; prize check passes;
  - its mutants C1–C5 (each Gemma figure, the model name, the live sentence) were killed;
  - Gemma figures recomputed: 0/18, 26/27, 591/594;
  - value secret scan 0 (1666 blobs, the delta and the messages).
- **Adversary:** 12 mutants on 4cb4e72 (result posted separately). A survivor would re-open the verdict.
- **Byte identity:** with 55b217d outside `lablab.md`, `claims-map.json` and the test. CLAIMS.md is unchanged because dispatch 9 does not list it, so the new Gemma test is not cited there; the rows used keep their existing proofs (auditor observation).

## 5. Limitations carried

- **Stage 10's late adversary result** on candidate 2 (msg 4bcd3bd6): 29/29 mutants killed, no re-open. That seat did not verify candidate 3, whose acceptance rests on the auditor's evidence.
- **One-digit stage pattern.** The rejected-stage and mutation tests match one-digit stage numbers only (`\d`). Stage 10's own rejection row is therefore not checked against the README. Fixing it would need a README line, which dispatch 9 does not allow. This is left for the operator.
- **The dispatch 8 word limit was wrong.** Its "at least 100 words" for the long description was not questioned by any seat until the form rejected the text. It was corrected in Stage 10 candidate 3.

## 6. Time, final commit and push

| | Start (UTC) | Accepted (UTC) | Wall clock | Limit |
|---|---|---|---|---|
| Stage 11 | 11:59:43Z (dispatch 9) | record 76825bf committed 12:08:29Z | 8 min 46 s | 45 min (ends 12:44:43Z) |

- **Endpoint usage:** none.

**Push request:**
- **What to push:** the local main head named in the room message that posts this addendum. It is a fast-forward from GitHub main 55b217d. Candidate 4cb4e72 is merged; outside `evidence/` the head equals 4cb4e72.
- **What the push changes:** only `docs/submission/lablab.md`, `claims-map.json`, the Stage 10 docs test and `evidence/`. Vercel redeploys the same product.
- **The form:** paste the new long description (1983 characters) from the pushed `docs/submission/lablab.md`. The access code goes only in Additional Information.

CertGate makes no claim of winning, entering or qualifying for any prize.
