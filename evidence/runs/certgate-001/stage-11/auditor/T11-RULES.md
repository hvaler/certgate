# Auditor pass/fail rules T11 — Stage 11 (dispatch 9: Gemma in the submission text)

- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Written 2026-10-16 12:00Z.
- **Specification:** DISPATCH-9 (msg 7bf7dbb1). Dispatches 1–8, amendment 1, and the Stage 10 rulings (R10.5 form limits) remain in force.
- **Byte-identity reference:** 55b217d0a39d3278960de81c1e7332fd9ee47884.

## Reference, recomputed by the auditor at 11:59:46Z

Source: `evaluation/runs/real-gemma-04100b9/results.json`, recomputed independently and checked against `metrics.json`:
- N = 27;
- FC-broad 0/18;
- proposal equal to the expected proposal 26/27;
- fields correct 591/594.

## Rules

- **T11-01 Byte identity.** `git diff 55b217d <cand>` touches only `docs/submission/lablab.md`, `claims-map.json`, `test/docs.test.ts`, `test/stage10-docs.test.ts` (or a new docs test) and `evidence/`. README.md is unchanged.
- **T11-02 Exact text.**
  - In lablab.md, the only change is in the Long description: exactly the two replacements and the one addition that dispatch 9 quotes.
  - The Long description is byte-equal to the auditor's text (`scratchpad/long-gemma.txt`, 1983 code points, LF).
  - Title, short description and Additional Information are unchanged.
- **T11-03 Figures.** The three Gemma figures equal the reference above. A test computes them from the Gemma artifacts and checks them against METRICS.md, and a mutant changing any one of them must fail. The sentence names Gemma-4-31B-IT and calls the run a comparison run.
- **T11-04 Limits.** Title ≤ 50, short ≤ 255, long 600–2000 code points.
- **T11-05 Suite and claims.**
  - Fresh clone; `npx vitest run` ×2, exit 0, 0 failed, 0 skipped.
  - 0 unmapped, 0 stale outside the known lablab CLI listing.
  - The prize check passes.
  - No existing assertion is loosened. A test that matched a removed sentence is replaced by one for its new form.
- **T11-06 Secrets.** Value scan with 0 hits over the changed files, the delta 55b217d..cand, the commit messages and every tracked blob.

## Verdict

- **ACCEPTED** only if T11-01…T11-06 all pass. Otherwise **REJECTED**, naming each unmet rule.
- The verdict is bound to the candidate commit.
