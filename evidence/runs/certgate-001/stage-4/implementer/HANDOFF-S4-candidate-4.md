# Stage 4 candidate 4 (repair cycle 3 of 5): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 4
Repair task: analyst msgs 420d8556 (part 1) … (14 parts) and routing 25c522a4. Finding ADV-S4-F06: adversary msg
1bdea91b. Register R4.7 (commit a2440d0). This record states what was done; it is not an acceptance.
**No push. No endpoint calls.**

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `c57699480d5d251bec93ccf3c4b55dd91bf14f1a` |
| Tree | `8c3fcc82466df15684e9e36bdab80bf3eb09354a` |
| Input revision (preserved, not rewritten) | candidate 3 `a130bbf468bccce5d3faa1a4e3cf707dda3139c1` (+ evidence `8ac7296`) |
| **Diff vs a130bbf4, excluding evidence** | `tools/claims-units.mjs` (unit extraction), `claims-map.json` (+66 units), `README.md` (+2: the C-42 sentence), `CLAIMS.md` (C-42 row), `test/docs.test.ts` (+11: positive deployed-site patterns). **Docs and tests only**: no file under `src/`, `public/` or `api/` changed |

## Repair

1. **Headings and code comments are units.** `tools/claims-units.mjs` now makes a unit of:
   - every heading's text;
   - every `#` comment line inside a fenced block;
   - every non-empty line of a fenced block with no language tag (the CLI usage block and the repository layout).

   Shell command lines are not units. The 65 new units are all mapped in `claims-map.json` (384 + 1 = 385 units in total):
   - headings: "none: heading";
   - run-block comments: C-27 (mock mode and offline), C-28 (CLI in the image), C-32 (never write the values);
   - the CLI exit-code line: **C-53** (previously outside the map);
   - the `--confirm` option: C-09;
   - the DEPLOY `reason` line: C-36;
   - the CLI option syntax and the layout lines: "none" with reasons.
2. **Positive deployed-site claims are forbidden** (`test/docs.test.ts`, inside "no forbidden claim in README,
   DEPLOY.md, METRICS.md or public"):
   - `live reading(?: (?:also|works|is|available|runs))* (?:on|from) the deployed site`;
   - `live reading[^.\n]*\b(works?|available|runs?|possible)\b[^.\n]*deployed`.

   They run over whitespace-normalised text, so headings, comments and wrapped lines are all covered. A match is
   allowed only when it carries a negation (`not`, `unavailable`, `never`, `no`). That keeps the documented
   sentences: "live reading unavailable on the deployed site…" and "Live reading runs from the container, not from
   the deployed site."
3. **C-42** now points at a README sentence (Limitations, shared service): "A reply that is not one JSON object
   (JSON wrapped in prose or followed by text, empty content, or a reply cut off by the token limit) is a failure
   (status error, proposal review), never repaired by guessing." The row cites the prose, empty-content and
   `finish_reason: length` tests.

## Kill check (`repair-3/mutants-stage4.log`; throwaway branches `impl-mut/<id>-on-c576994` in a scratch clone, never merged)

| Mutant | Suite | Killed by |
|---|---|---|
| **S4M23** `# Build the image (live reading also works on the deployed site; no container needed)` | 2 failed / 313 | forbidden-claim grep (positive deployed-site pattern); sentence map |
| **S4M24** `## Demo procedure (live reading on the deployed site in about 10 s)` | 2 failed / 313 | forbidden-claim grep; sentence map |
| S4M11, S4M11b, S4M12, S4M13, S4M14, S4M20, S4M21, S4M22, S4M04, S4M18s (re-run) | 1–3 failed each | as in candidate 2; all still killed |

## Verification (`repair-3/clean-clone-tests.log`)

Clean checkout of c576994, `npm ci` (lockfile unchanged), build, `npx vitest run` with MODEL_* unset: **315/315**.
METRICS matches a fresh generation. Unmapped units **0**, stale map entries **0**. Docker and browser not re-run: no
product, packaging or `public/` change since candidate 1.

Time: repair routed about 21:25Z; candidate 4 frozen about 21:37Z.
