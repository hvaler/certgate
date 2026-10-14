# Analyst log — Stage 5 (Gemma comparison)

Run certgate-001 · dispatch 3 msg 82f82e5e (received 2026-10-14T10:40Z) · owner analyst-xwz3 · analyst clock (UTC).

Budgets:
- Stage 5 runs 10:41Z → ~14:41Z (240 min), with 3 repair cycles.
- The addendum needs a 30-min reserve, so no new work after ~14:10Z.
- Hard stop: 2026-10-17T18:00Z.

| Time | Event | Message IDs |
|---|---|---|
| 10:41Z | Dispatch 3 received and acked. Verbatim DISPATCH-3.txt. Sources hashed: only 01-REGLAS.md changed since Stage 4 (24d243cb… → f9298767…). R5.0 committed 04100b9 (7b27e57a…54fa) | 82f82e5e |
| 10:43–10:47Z | Stage 5 handoffs sent, 16 parts per seat (mkparts5: dispatches 1–3, spec incl. REGLAS "Kickoff en directo", R5.0, R4.8, R3.3, R2.2, R1.6, design). Implementer ff2e84c8…95ab23f4 (acked f0761cca). Adversary a2a585df…21c8f642. Auditor 3f682058…632f7892 | — |
| ~10:45Z | Implementer ENDPOINT LEASE TAKEN: Gemma evaluation, about 30–36 calls, 2 in flight, no product change | d4c51a61 |
| ~10:46Z | Auditor testability review (T5-01…T5-10) → R5.1 committed 240652b (25556ef3…ad7b): E-12 (C-19 applies to the product model; Gemma FC never hidden), E-13 (Qwen figures equal; product files byte-identical), E-14 (T5 rules adopted). Posted 688a40c8 | f0954890 |
| 10:48Z | Correction: the three preceding rows were first written with estimated times later than the actual clock; corrected here to the observed times (no other content changed) | — |
| 10:52Z | Auditor receipt 59176a92 (pointed to R5.1, c903ce0a); auditor adopts R5.1 (8a0644e0). Adversary challenge CH5-01…CH5-12 (f64c1429) → R5.2 G-01…G-12, all accepted, committed a0d75f5 (b9f18698…7f65), full text posted 6c288bb9 | f64c1429 |
| 10:57Z | Implementer ENDPOINT LEASE RELEASED (78b43118): 32 calls (28 chat, 4 GET /usage), 0 retries/errors, every reply self-dploy/Gemma-4-31B-IT, finish stop. Run of record evaluation/runs/real-gemma-04100b9, 10:47:17–10:55:09Z (head 04100b9 = product b0ec67a6): FC-broad 0/18, FC-strict 0/6, caught 6/6 (5 block), as expected 26/27 (cg-021 review: Si absent vs text layer 0.62), abstention 13/27, failures 0, fields 591 correct + 1 correct-absent + 1 unknown + 1 confident-on-illegible (cg-017 heat 24-73269), wrong 0; 34.5 s mean; /usage delta 0.00217876 = 27 replies 0.00210296 + cg-003 0.00007580. cg-003 (evidence only): ReH 338 confident → block. Request shape: Qwen builder, model only; no thinking control. Auditor may take the lease | 78b43118 |
