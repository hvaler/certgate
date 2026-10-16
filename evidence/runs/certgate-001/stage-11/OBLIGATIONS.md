# Obligation register — Stage 11 (Gemma in the submission text)

Run: certgate-001 · Stage: 11 · Register version: **R11.0** (analyst-zt7k, 2026-10-16). Append-only.

- **Dispatch 9:** room msg `7bf7dbb1-910b-4ce6-88af-8a5eedb7b0c3` from hugo.valer, received 11:59:43Z. Verbatim copy: `evidence/runs/certgate-001/DISPATCH-9.txt`.
- **Still in force, except where dispatch 9 changes them:** dispatches 1–8 and amendment 1.
- **Input revision and byte-identity reference:** GitHub main **55b217d0a39d3278960de81c1e7332fd9ee47884** (`ls-remote` at 11:59:43Z).
- **Limits:**
  - **45 min, ending 12:44:43Z**, including final verification; no new work after 12:34Z;
  - **at most 1 repair cycle**;
  - **no endpoint call.**

## Obligations

| ID | Obligation (D9; the verbatim text governs) | Acceptance | Owner |
|---|---|---|---|
| S11-01 | In the **long description** of `docs/submission/lablab.md`, **change exactly two sentences and add one**, word for word as dispatch 9 gives them:<br>(1) the Qwen sentence becomes "The open model Qwen3.8-27B, served by AMD Token Factory, reads the page images of the certificate; live reading also offers Gemma-4-31B-IT and experimental models.";<br>(2) the cg-004 parenthesis becomes "(cg-004, a decimal comma caught by the channel check)";<br>(3) after that sentence, add "In a comparison run on AMD Token Factory, Gemma-4-31B-IT gave false conforming 0 of 18, 26 of 27 as expected and 591 of 594 fields correct." | Byte comparison with the dispatch text | implementer |
| S11-02 | **The long description must be 1983 code points** (LF), within 600–2000. The title, the short description, the README and every other file stay unchanged | Auditor's count | implementer |
| S11-03 | **Every Gemma figure** (0/18, 26/27, 591/594) is **computed by a test** from `evaluation/runs/real-gemma-04100b9` and equals METRICS.md (the Gemma column, lines 136–140 and :190) | Test, plus the auditor's recomputation | implementer |
| S11-04 | Each changed or new sentence has its claims-map row: **0 unmapped, 0 stale**. The docs tests are adjusted for the changed sentences **and never loosened**; each hunk is listed. The prize check passes | Suite, plus the hunk review | implementer |
| S11-05 | **Byte identity** with 55b217d outside `docs/submission/lablab.md`, `claims-map.json`, the docs tests and `evidence/` | Auditor diff | auditor |
| S11-06 | **Auditor acceptance:**<br>- the three Gemma figures recomputed from the run artifacts;<br>- the long description counted and byte-compared with the dispatch text;<br>- the suite, claims and prize checks from a clean clone;<br>- the secret scan by value | Verdict | auditor |
| S11-07 | **A short addendum,** with the push request | Auditor verifies | analyst |

## Decisions

| ID | Decision |
|---|---|
| A11-01 | **The dispatch text is applied verbatim, without paraphrase.** If the result is not exactly 1983 code points, the implementer reports the actual count and the difference **before** committing, rather than adjusting the wording |
| A11-02 | **Labelling.** Sentence (1) no longer says "the evaluated model behind every figure". The Qwen figures in the long description must still name their runs ("two independent Qwen3.8-27B runs", implementer and auditor), which the existing tests already require (X-02). The new Gemma sentence is labelled by "In a comparison run", which meets X-02 for Gemma figures. Any test that required the old "evaluated model" wording **in lablab.md** is changed to require the run labels instead. This is listed as a hunk. The README requirement (Z-02) is unaffected |
| A11-03 | **The cg-004 test** (X-04) required the decimal-comma explanation in lablab.md. The new parenthesis keeps "cg-004", "decimal comma" and "channel check", so the test is narrowed only to those words in lablab.md. The full explanation stays required in the README. This is listed as a hunk |
| A11-04 | **Process.** No separate design note is needed. The implementer commits a candidate on a new branch `s11-impl` from 55b217d. The adversary challenges and mutates **the candidate**: Gemma figure changed, Gemma label removed, a 2001 code-point mutant, a prize word. The auditor gives its verdict. Machine times only; the configured e-mail; no endpoint call |
| A11-05 | **Order and targets:**<br>- acknowledgements by 12:05Z;<br>- candidate by ~12:15Z;<br>- verdict by 12:30Z;<br>- addendum and push request by 12:40Z |
