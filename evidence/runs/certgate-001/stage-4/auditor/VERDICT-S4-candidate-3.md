# Stage 4 verdict: candidate 3 (auditor-xwz6)

Run certgate-001 · Stage 4 (delivery) · Register R4.7 (commit `a2440d0`), with R3.3, R2.2 and R1.6 still in force.

**VERDICT: REJECTED (2026-10-13T21:30Z) on finding F4-02 = ADV-S4-F06.** Two required-class mutants survive:
- S4M23: a false capability claim in a README fenced-code comment;
- S4M24: a false capability claim in a README heading.

Every other check passed (sections 2–5). The repair is docs and tests only. Candidate 2 (`ac738ef3`) was superseded by candidate 3 at the analyst's request (msg 0b282d93) and was not given a separate verdict. Its checks are reported here.

## 1. Candidate

| | |
|---|---|
| Candidate / tree | `a130bbf468bccce5d3faa1a4e3cf707dda3139c1` / `acaad466c8bafb5169a49b61e7d2b262f3e3b515` (verified in my clone `certgate-audit-s4c2`) |
| Evidence on top | `8ac7296` |
| Handoff | implementer msgs 70127ff5 … 57174381 (14 parts; receipt confirmed 96ba8589) |
| Lineage | candidate 1 `02c5c36b` (REJECTED, F4-01; record `VERDICT-S4-candidate-1.md`, commit `67c5093`) → candidate 2 `ac738ef3` (F4-01 and ADV-S4-F01…F05 repaired) → candidate 3 (C-15 wording, the adversary observation in 9390ddb7) |
| Repair cycles used | 2 of 5 |

## 2. Diff, docs and tests only

- `02c5c36b..ac738ef3` (outside evidence): `README.md`, `DEPLOY.md`, `CLAIMS.md`, `claims-map.json` (new), `test/docs.test.ts`, `test/stage4-claims.test.ts` (new), and `tools/claims-units.mjs` (new test tooling, imported only by `test/docs.test.ts`).
- `ac738ef3..a130bbf4`: `README.md` (the C-15 sentence), `CLAIMS.md` (row C-15), `claims-map.json`, `test/story-screen-render.test.ts`.
- **Byte-identical to candidate 1:** `src/`, `public/`, `api/`, `tools/evaluate/`, `data/`, `config/`, the package files, `Dockerfile`, `vercel.json`. The prompt SHA is `32fad2f9…c567`.
- So the product checks of candidate 1 carry forward: README and DEPLOY commands, the E-02 real-mode check (0 readings), the browser at 375/1280 px in three shapes, and the image-filesystem scan.

## 3. Re-run on candidate 3 (and candidate 2)

| Check | ac738ef3 | a130bbf4 |
|---|---|---|
| Suite, clean clone, `MODEL_*` cleared | 313 / 313, 0 skipped | **315 / 315, 0 skipped** |
| `check_claims.py` with the vitest report | 66 rows / 130 proofs, all exist and pass | 66 rows / 132 proofs, all exist and pass |
| `tools/claims-units.mjs`: unmapped / stale | 0 / — | 0 / 0 |
| `metrics-md --check` | matches | matches |
| New C-15 tests (endpoint on: "not exposed by the endpoint"; off: "unknown", model list "none") | — | both pass. Consistent with what I captured in the browser on candidate 1 |
| Forbidden-claim grep (F-06 and E-10) | 0 | 0 |
| Head-tree secret and path scan | 0 secrets; path matches are prose or regex only | (same files plus the C-15 docs; README contains no path) |

**F4-01 is closed.** All of (a) to (g) were checked on ac738ef3:
- C-50 to C-55 added, with new tests for exit 1, the configured `LIVE_WINDOWS`, the unit default, the code throttle and the 1 MiB / 256 KiB limits.
- (g) "well under a second" was removed.
- O4-01 (C-38 evidence) and O4-02 (`mode` vs `reader`) are done.

## 4. Mutants re-applied by me (logs in `candidate-2/mutants/` and `candidate-3/mutants/`)

Killed on both candidates:
- S4M11, S4M11b, S4M12, S4M13, S4M18s, S4M20, S4M21, S4M22, S4M04: the adversary's candidate-1 survivors;
- S4M01, S4M03 (E-08 / E-09);
- S2M02br and S3M06 (Stage 3).

**Survived on `a130bbf4` (reproduced by me, 315/315 passing):**

| Mutant | Change | Why it survives |
|---|---|---|
| S4M23 | README `# Build the image` → `# Build the image (live reading also works on the deployed site; no container needed)` | `tools/claims-units.mjs` skips fenced code, and the F-06/E-10 grep has no token for it |
| S4M24 | README `## Demo procedure` → `## Demo procedure (live reading on the deployed site in about 10 s)` | headings are skipped |

## 5. Finding F4-02 = ADV-S4-F06 [REJECT; R4.3 F-08 (c), F-02]

**Why it blocks.** The class "a README capability sentence without a claims row" is required to have a committed killer (F-08 c). The README carries real capability statements in exactly the places the check skips:
- the `# …` comments of the "Run it" block, for example "the service itself makes no outbound call in mock mode" and "the test suite inside the image … makes no endpoint call";
- the CLI block's "exit codes: …".

The content is true today (I ran those commands). Still, a false claim placed there would pass the suite. Under the same rule I applied to S3M06 and S2M02br, a surviving required-class mutant blocks.

**Closing condition (docs and tests only):**
- The sentence map also covers heading text and `#`-comment lines inside fenced blocks (or every non-command text line in fenced blocks) of README, DEPLOY and METRICS. Each such unit maps to a CLAIMS row or to "none", as now.
- S4M23 and S4M24 must fail the default suite. I will re-apply both.
- Optional: the analyst may also extend the forbidden grep with a positive deployed-site live-reading pattern.

## 6. Unchanged open items (human-dependent)

- **S4-07 remote head = local head:** not done. It waits for the human's push of the accepted commit.
- **S4-10 Vercel:** not done. No URL has been reported.
