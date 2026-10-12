# Expected outcomes (test side only)

These files are read **only by tests**. Product code under `src/` never reads this folder. A test enforces that
no source file names it or any expectation key (register D1-12, S1-37).

Each `<case-id>.json` holds:

| Key | Meaning |
|---|---|
| `acceptance_cases` | Acceptance-matrix rows (C1–C13) or register amendments (A-05, A-06) the case covers |
| `expected_status` | `ok`, or `error` when the reader fails (C11) |
| `expected_proposal` | `release`, `block` or `review`. Always only a proposal: a person decides |
| `reasons_must_include` | Reason codes the decision must contain (it may contain more) |
| `rule_failures` | Spec rules expected to fail, with field, observed value and limit |
| `planted_fault` | What was planted in the case, in words |
| `correct_reading` | What a correct reader returns for the certificate (register A-01, D1-02). The mock model output in `cases/<id>/reading.json` equals it except for the deviations listed there under `planted` |

## Reason codes

| Code | Raised when | Proposal effect |
|---|---|---|
| `RULE_FAIL:<field>` | A spec limit fails on a known value (`<field>` is C, Si, Mn, P, S, Cu, CEV, ReH, Rm, A or KV_media) | block |
| `GRADE_MISMATCH` | Certified grade differs from the ordered grade or the spec grade | block |
| `HEAT_MISMATCH` | Certificate heat differs from the heat of the paired delivery line | review, regardless of rule outcomes (A-04) |
| `NO_SECOND_CHANNEL` | The certificate has no text layer: critical fields need human confirmation | review |
| `CRITICAL_UNKNOWN:<field>` | A critical field could not be read with confidence | review |
| `CHANNEL_DISAGREE:<field>` | Text layer and model reading differ on a critical field | review |
| `TEXT_LAYER_CONFLICT:<field>` | The text layer holds conflicting values for one field (A-16) | review |
| `UNIT_UNEXPECTED:<field>` | A unit other than the expected one (MPa and N/mm² are equivalent), or no unit | review |
| `IMPLAUSIBLE:<field>` | Value outside the band-defined plausibility range (scale jump) | review |
| `CEV_MISMATCH` | Printed CEV differs from the recomputed CEV rounded to 0.01 half-even (A-20) | review |
| `STAMP_MISSING` | No inspection stamp on the certificate | review |
| `KV_TEMPERATURE_MISMATCH` | Impact test temperature missing or different from -20 °C (A-05) | review |
| `CERT_TYPE_NOT_3_1` | Certificate type absent or not 3.1 (A-06) | review |
| `READER_ERROR:<class>` | Reader failed: endpoint_off, timeout, http_429, http_5xx, invalid_json (C11) | review, status error |
| `EVIDENCE_MISSING:<what>` | Paired delivery line or other required evidence missing (D1-14) | review |

## Known exceptions to the CEV print convention

Every certificate prints CEV as its exact recomputed value rounded to 0.01 half-even (A-20), except:

- `cg-019` and `cg-020`: planted C9 cases (printed 0.38 and 0.44).
- `cg-015`: planted scale jump. The certificate prints C as `16` (instead of 0.16). Its printed CEV, 0.41, comes
  from the real composition, so a recomputation from the printed values does not match it. The product marks C
  implausible and so cannot recompute CEV for this case.
