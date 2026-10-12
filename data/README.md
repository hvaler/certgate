# CertGate evaluation dataset (fictitious)

**Everything in this folder is invented.** Siderúrgica Valdemora S.A. (the mill), Talleres Ribera Norte S.L. (the
buyer), the grade TRN-355 and the purchase specification ESP-014 are fictitious. The limits in ESP-014 belong to
that fictitious company and are **not** the limits of any real standard. Every certificate says so in its footer.

## Provenance

| Cases | Created | By |
|---|---|---|
| `cg-001`, `cg-002`, `cg-003` | **Before kickoff** (2026-10-02, planning workspace `AMD-ACT3/datos/mini-prueba`, generator `generar.py`) | human planning work; copied **byte-identical** (see `origin/mini-prueba/` and the hashes below) |
| `cg-004` … `cg-030` (27 cases) | **In run certgate-001**, after the kickoff instant 2026-10-12T15:00:00Z | `tools/dataset/generate.py`, implementer-xwz4 |

Pre-kickoff certificate files and their SHA-256 (identical in `origin/mini-prueba/` and in `cases/`):

| Case | Original file | SHA-256 |
|---|---|---|
| cg-001 | `cert-01-digital-conforme.pdf` | `55c15e2e23d2928af427c633c19ef1605f9e4145ba330c0aec1b469d19eca4c6` |
| cg-002 | `cert-02-escaneado-fuera-especificacion.pdf` | `c9df9fac7e26217426d7d99a689912e2849f56ea026a969c7070efc2e8de968e` |
| cg-003 | `cert-03-escaneado-ambiguo.pdf` | `40899aa26ccec1e0a2e62d63a7abac8098ee0debc38df7c7b7ea121ac3619c01` |

`origin/mini-prueba/` holds the complete pre-kickoff folder unchanged (including its own `esperado.json` and
`generar.py`). The product never reads `origin/`.

`spec/ESP-014.r3.json` is the pre-kickoff `especificacion-ESP-014.json` with every limit unchanged. The only edit is
that `revision` is stored as the string `"3"`, because product data files hold no JSON numbers (register R1.1, S1-25).
`delivery/ALB-2026-0917.csv` is the pre-kickoff delivery note, byte-identical. `delivery/ALB-2026-1003.csv` was
generated in this run.

## Layout

```
cases/<id>/certificate.pdf   input document (digital = has a text layer; scan = image only)
cases/<id>/case.json         input pairing: delivery note file and line (partida)
cases/<id>/reading.json      MOCK model output (correct reading + labelled planted deviations); used ONLY by MockReader
expected/<id>.json           correct reading + expected outcome; read by tests only, never by src/
CHECKSUMS.sha256             SHA-256 of every file in this folder
```

The expected outcomes were written by hand in `tools/dataset/generate.py` and committed **before** any product code
that evaluates them existed (register S1-37). The generator does not import or run product code (register A-09).
Reason codes are defined in `expected/README.md`.

`reading.json` (the mock model output, register A-01) notes:
- A field the case defines as illegible has `status: "unknown"` and `value: null` (register D1-02). For example, the
  ReH of cg-003 is smudged (physically 358, could be read as 338), so its reading is unknown.
- A field not printed on the document has `status: "absent"`, for example the inspection stamp in cg-028.
- Planted deviations are listed under `planted` and marked `planted: true` where they apply:
  - `misread`, only in cg-018 (acceptance case C8, D1-20). It replaces only the model-channel Mn value. The text
    layer still comes from the PDF bytes.
  - `contamination`, only in cg-021 (C10). The mock explanation echoes the instruction injected in the document.
  - `failure`, in cg-023 … cg-027 (C11): `mock_failure` tells MockReader to fail with that error class.
- All numeric values are JSON strings.

`case.json` gives the certificate kind (`digital` = has a text layer, `scan` = image only), the layout
(`A` = pre-kickoff layout, Spanish/English labels, decimal point; `B` = English labels in another order, mechanical
tests before chemistry, decimal comma) and the paired delivery line.

## Coverage of the acceptance matrix and register R1.4

| Acceptance case | Dataset cases |
|---|---|
| C1 conforming | cg-001 (A), cg-004 (B) |
| C2 element / property out of range | cg-002 (scan: Mn, CEV), cg-005 (Mn), cg-006 (P, decimal comma), cg-007 (Rm) |
| C3 value exactly at limit (digital) | cg-008 (ReH = 355), cg-009 (every max and min at its limit, KV sum = 81) |
| C4 heat mismatch | cg-010 (transposed digits), cg-011 (heat of another line of the same note, A-12) |
| C5 wrong grade | cg-012 |
| C6 unit changed / scale jump | cg-013 (ksi), cg-014 (N/mm², positive control), cg-015 (C printed as 16) |
| C7 ambiguous / clean scan | cg-003 (smudged ReH), cg-016 (clean, all in spec, D1-04), cg-017 (smudged heat no.) |
| C8 channels disagree | cg-018 (planted misread) |
| C9 CEV incoherent | cg-019 (printed 0.38, recomputed 0.41: review), cg-020 (printed 0.44, recomputed exact 0.4629: block, A-03) |
| C10 hostile document | cg-021 (approve instruction, Si 0.62: block), cg-022 (spoofed duplicate ReH: review, A-16) |
| C11 reader failure | cg-023 endpoint_off, cg-024 timeout, cg-025 http_429 (scan), cg-026 http_5xx, cg-027 invalid_json |
| C12 isolation | every case, processed in sequence and alone (tests) |
| C13 missing stamp | cg-028 |
| A-05 KV temperature | cg-029 (impact test at 0 °C) |
| A-06 certificate type | cg-030 (test report 2.2) |
| C14 Evolus | not applicable in this run (register D1-12) |

Mix: 25 digital certificates (16 layout A, 9 layout B) and 5 scans. Layout coverage of the text-layer parser is a
declared known gap: it supports these two fictitious layouts, not arbitrary mill certificates.

