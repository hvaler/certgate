# Auditor dataset pre-check — certgate-001 · Stage 1

- Seat: auditor-xwz6 (`hugo.valer/auditor-xwz6`), model claude-opus-5-5
- Kind: **pre-check of inputs, not a verdict.** No product code exists at this revision. This record decides nothing about Stage 1 acceptance.
- Date UTC: 2026-10-12T17:19:07Z (run 17:19:07.511Z → 17:19:07.664Z)
- Register: R1.5, commit `f9836f8954a036ac8b5e6eb63d3a09044280f75e`, `OBLIGATIONS.md` SHA-256 `fd836c91580ee61b58fd18d28a88418e10e6fbb552e9e6a98fcbe31b0412a404` (verified from git objects)
- Dataset revision checked: `4ebd95333e3bb486cb79c62fc6bd7a2e025379e9` (tree `9bddc672d9c72dc9252d5d2709bd447e927c6e70`), implementer-xwz4, 2026-10-12T17:15:59Z
- Environment: auditor's own clone `C:\nexus\dev\certgate-auditor` (a `git clone` of `C:\nexus\dev\certgate`), checked out at that commit; Windows 11; Python 3.12.10, run with `-I`, stdlib only
- Command: `python -I audit_dataset.py C:\nexus\dev\certgate-auditor C:\nexus\dev\AMD-ACT3\datos\mini-prueba`
- Artifacts:
  - `audit_dataset.py`: SHA-256 `2fdc7ede320ef9e238ff0440c06211178e645958b425598b50d155b961f1a3d5`
  - `dataset-precheck-4ebd9533.log`: SHA-256 `02e5663cd2d6d08405a2b1538ccdff98a00ab1b8b43d370f1757cdb77d843d1b`, exit code 1 (two findings, both explained below)

## What was checked, and the result

| Check | Obligation | Result |
|---|---|---|
| All 134 entries of `data/CHECKSUMS.sha256` match the files | S1-37 | PASS |
| `data/origin/mini-prueba/*` byte-identical to `C:\nexus\dev\AMD-ACT3\datos\mini-prueba` (8 files); cg-001..003 PDFs identical to the three pre-kickoff certificates | S1-38 | PASS |
| The dataset commit holds no product code: only `data/` and `tools/dataset/generate.py`, and the commit is dated before any `src/` | S1-37 | PASS |
| The generator imports only stdlib, PIL and reportlab; no product module (A-09). `ROUND_HALF_UP` is used only for the printed KV mean (display, never compared, D1-09); CEV is printed half-even (A-20) | A-09, A-20 | PASS |
| No `reading.json` holds an expectation key (`expected_*`, `reasons_must_include`, `rule_failures`, `propuesta_esperada`, `fallos_especificacion`, `motivo`) | D1-12 | PASS |
| Planted deviations appear only where allowed: misread in cg-018; contamination in cg-021 and cg-022; failure in cg-023..027. The mock output equals the correct reading in all other fields | D1-20, A-01 | PASS |
| `expected_proposal` of all 30 cases agrees with the R1.5 case table | R1.5 | PASS (30/30) |
| No JSON numeric literal in dataset JSON | S1-25, A-15 | PASS for all product-side files. One hit in `data/origin/mini-prueba/especificacion-ESP-014.json` (`"revision": 3`). That file is the byte-exact pre-kickoff copy, kept for provenance; the product spec is `data/spec/ESP-014.r3.json`, which stores the revision as a string. **Condition for the candidate:** no product loader reads anything under `data/origin/`. |
| An independent oracle (my own exact-Decimal rules, written from R1.5 without reading product code) recomputes each case's proposal from the correct reading, the paired delivery line and the spec | S1-31, C1–C13 | 29/30 agree. **cg-022 differs:** the oracle says `block` (ReH 340 < 355), the expectation says `review` (`TEXT_LAYER_CONFLICT:ReH`). The oracle does not model the text layer. A-16 sets "conflicting values for one field in the text layer ⇒ field unknown ⇒ review", so `review` follows from the register. Not a defect. Consequence for the record: under A-16, a hostile duplicate turns a would-be `block` into `review`. Both still require a person, and neither is ever `release`. |

The oracle also confirms independently:
- the CEV limit fails on both the printed and the exact recomputed value for cg-002, and only on the recomputed value for cg-020 (A-02, A-03);
- all certificates except cg-015, cg-019 and cg-020 print CEV equal to the half-even rounding of their exact recomputed value (A-20, A-23);
- the KV rule passes by sum ≥ 81 for every case.

## Limits of this pre-check

- It validates the **inputs and expectations** only. No product behaviour has been run, and this pre-check proves nothing about C1–C13.
- The text-layer content of the PDFs was not parsed here. cg-021 and cg-022 are checked against their declared hostile content only when the candidate runs.
- The oracle's plausibility bounds are coarse and its own (C ≤ 2 %, others ≤ 1–5 %). They are not the product's band-defined ranges (D1-11), and serve only to detect cg-015's scale jump.
