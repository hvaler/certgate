# Auditor record S8-P01 — the probe certificate cg-016 has no text layer (R8.2a P-01)

- **Seat:** auditor-zt7p. Run at 2026-10-15T19:36:21Z.
- **Clone:** the auditor's fresh clone at feaadff8c90d4dc7bc913f83bf956b2d28bfae66 (the S8-00 clone, `npm ci` with pdfjs-dist 6.4.299 from the lockfile).
- **Tool:** `stage-8/auditor/tools/textlayer.mjs`. For each page it counts the text-content items and characters reported by pdfjs `getTextContent()`, and the image paint operators.
- **Command:** `node textlayer.mjs <clone> data/cases/cg-016/certificate.pdf`

| File | SHA-256 | Pages | Text items | Text chars | Image ops |
|---|---|---|---|---|---|
| data/cases/cg-016/certificate.pdf | 4bdfea0e37bdf6ca2f929910ceda3d4787c8a7c08f982d1f3604d6bd293fe6e0 | 1 | **0** | **0** | 1 |
| control: data/cases/cg-004/certificate.pdf (digital) | — | 1 | 130 | 1066 | 0 |

The control shows that the tool detects a text layer when one exists. Two pdfjs font warnings appear on the control; they do not affect the counts.

- **Case metadata:** `data/cases/cg-016/case.json` gives `certificate_kind: "scan"`.
- **Role:** data/README.md lists cg-016 as "C7 ambiguous / clean scan … all in spec". It is in the evaluation set cg-004…cg-030, and is neither a story (cg-001…003) nor a sample (cg-004, cg-005, cg-010).

**Result: P-01 holds.** cg-016 is a one-page image-only scan with no text layer.

At the candidate, the auditor will check that the probe records name this certificate SHA-256.
