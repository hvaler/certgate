# Stage 5 candidate 2 (repair cycle 1 of 3): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 5
Repair task: analyst msg a486952f (part 1 of 16; parts 2–16 follow). Finding **ADV-S5-F01** (adversary msg 31240af4):
the prize-claim mutants S5M-e2 and S5M-e3 survived candidate 1. Register **R5.4** (3ef256d, `be06c946…ce32`). This
record states what was done; it is not an acceptance. **No push. No endpoint calls.**

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `a848dfae8674bb5bba34d5f83cf5e967acb7bce7` |
| Tree | `ee5fea47d4252c40b82b4b99debdd23b45c386af` |
| Input revision (preserved, not rewritten) | candidate 1 `ddb75eca79c1e66b06456ebce45992ccd140eafa` (+ evidence `2566cc8`) |
| Commits after candidate 1 | `b93b237`: evidence correction, see below · `a848dfa`: the repair |
| **Diff vs ddb75eca, excluding evidence** | `test/support/prize-check.mjs`, `test/stage5-gemma.test.ts` (+6 probes; one test title broadened), `CLAIMS.md` (C-75 proof title updated to the new test title). **Tests and docs only**: no file under `src/`, `public/`, `api/`, `data/` or `config/`, and no change to `vercel.json` or the package files |

## Repair (`test/support/prize-check.mjs`)

1. **The negation must govern the prize word.** A clause is accepted only when a negation (`no`, `not`, `never`,
   `without`) comes **before the first prize word in that clause**. Clauses end at `.`, `;`, `#`, `:`, `,` and at
   the word "but". So "not just a comparison: it is eligible…" now yields the clause "it is eligible for the Gemma
   prize", which carries no negation, and it is flagged.
   I dropped `unavailable` from the negation list: it never governs a prize word.
2. **More prize words:** `contender(s)`, `challenge(s)`, and `compete`, `competes`, `competing`, `competition(s)`,
   `competitor(s)` join the list.
3. The quoted kickoff allowance is unchanged: inside quotation marks, on a line that names 01-REGLAS.
4. **Probes** in `test/stage5-gemma.test.ts`, under "flags a prize, award, eligibility, entry or challenge claim
   and accepts a negated clause":

| Probe | Result |
|---|---|
| "CertGate is not just a comparison: it is eligible for the Gemma prize." | flagged |
| "CertGate is not a toy, it is eligible for the Gemma prize." | flagged |
| "not a toy, it is eligible for the prize" | flagged |
| "CertGate is a strong contender for Google's Gemma challenge on AMD." | flagged |
| "CertGate does not compete for any prize." | accepted |
| "This comparison makes no claim about any prize or award." (README) | accepted |

The current README, DEPLOY.md, METRICS.md and `public/` pass. None of them contains contender, challenge or a
compete word.

## Evidence correction (`b93b237`)

My candidate-1 evidence commit `2566cc8` added `candidate-1/kill5.sh` with a local user-profile path in its first
lines. The candidate 1 commit itself passed. At heads after 2566cc8, however, the test "no user-profile path or
operator e-mail in any tracked text file at head" fails.

`b93b237` replaces that line with `S=${SCRATCH:?…}`, so the script now takes the scratch directory from the
environment. History is not rewritten, and the path stays in the blob of 2566cc8.

Candidate 2 includes the correction. Its suite passes at its own head.

## Kill check (`candidate-2/mutants5.log`; throwaway branches `impl-mut5/<id>-on-a848dfa`, never merged)

- S5M-e2 and S5M-e3 are applied as the adversary built them: a README bullet **plus a claims-map entry**
  ("none: context"). With that entry in place, only the prize check can kill them.

| Mutant | Failed / 332 | Killed by |
|---|---|---|
| **S5M-e2** "CertGate is not just a comparison: it is eligible for the Gemma prize." (+ map entry) | 1 | `docs.test.ts` no forbidden claim (prize check) |
| **S5M-e3** "CertGate is a strong contender for Google's Gemma challenge on AMD." (+ map entry) | 1 | same |
| a_metrics, a_readme, a_readme_fc, b_gemma_as_qwen, b_qwen_as_gemma, b_run_json, c_request, c_max_tokens, d_landing, e_eligible, e_qualifies, f_generator, f_metrics_hand, e15_drop_pdfjs, g04_expected (re-run) | 2–4 each | as in candidate 1; all still killed |

**17 of 17 killed.**

## Verification (`candidate-2/clean-clone5.log`)

Fresh clone of a848dfa, `npm ci` (0 dirty files), build, `npx vitest run` with MODEL_* unset: **332/332**.
`metrics-md --check`: matches. Claims: **0 unmapped, 0 stale**. Docker is not re-run: there is no change to the
product, the packaging or `public/` since candidate 1, and both the adversary and I ran Docker on ddb75eca.

Time: repair routed about 11:30Z; candidate 2 frozen about 11:41Z.
