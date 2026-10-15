# Auditor record S8-00a — correction to S8-00 §4 (room export secret scan)

- **Seat:** auditor-zt7p, 2026-10-15 ~20:55Z.
- **Corrects** `S8-00-BASELINE-feaadff.md` (commit 49e377f), §4. S8-00 is kept unchanged as the original record.

## What S8-00 said, and why it was wrong

S8-00 §4 scanned `final/room.json` for **patterns** only (`jrx_` leases, profile paths, `Bearer`, `sk-`, `MODEL_API_KEY=`, `LIVE_ACCESS_CODE=`). It stated: "The key and the access code values are not known to this seat, so it cannot prove their absence directly."

**That statement was wrong.** The values were available to this seat at run time:
- `MODEL_API_KEY` and `MODEL_BASE_URL` in the process environment;
- `LIVE_ACCESS_CODE` in the user-level registry.

S8-T821 later used them. Because S8-00 did not compare the values, it **missed 9 occurrences of the endpoint base-URL host plus path** in `room.json`. That is the part D2 and D8-04 say must never be written. The implementer's value scan found them first (room msg 043a9050).

## Reproduction (value comparison in memory, counts only)

Nothing was printed and no property was written (D8-04).

| Commit | base-URL host+path | key | SHA-256(key) | access code | SHA-256(code) |
|---|---|---|---|---|---|
| 2158016 | file absent | | | | |
| d3dd58d | 9 | 0 | 0 | 0 | 0 |
| e0de5c7 | 9 | 0 | 0 | 0 | 0 |
| feaadff | 9 | 0 | 0 | 0 | 0 |

**Every tracked file, the same five needles:**
- feaadff: 1535 files, the only hit is `room.json` (base-URL path = 9);
- **main after 1497571** (analyst redaction, O8-01): 1551 files, **0 hits**;
- **s8-impl**: 1583 files, **0 hits**.

## The redaction commit 1497571be9845a2745a68e0152f076f45cc765f8 (analyst-zt7k), verified

- **Files changed:**
  - `final/room.json`, 9 lines changed;
  - `stage-8/OBLIGATIONS.md`, which gains the O8-01 section. That is the analyst's own register, evidence only. No other file changed.
- **The 9 room.json hunks:** each replaces only the path, with `https://developer.amd.com.cn/<base-url-path redacted>`. The host is kept. No other text in the file changed.
- **The file at 1497571** parses as JSON (6 730 019 bytes).
- **Value scan at 1497571:** 0 hits for all five needles (see above, main).

## Consequences

- **S8-00's product conclusion is unaffected.** The diff 2158016..feaadff over the product paths is empty, and the baseline suite passed 486/486.
- **S8-00's "room export: no value" line is withdrawn.** It is replaced by the table above.
- **The 9 occurrences remain in the published history** of d3dd58d, e0de5c7 and feaadff. History is not rewritten (as with E-07), and rotating or confirming the endpoint URL is the operator's decision. The analyst routes this in the final report (O8-01).
- **Rule change for this seat:** every auditor secret scan from here on (T8-24, T8-36) compares the actual values in memory: the code, SHA-256(code), the key, SHA-256(key) and the base-URL host+path. Patterns only supplement it.
