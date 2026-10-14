# Stage 5 candidate 3 (repair cycle 2 of 3, the last): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 5

**Repair task:** analyst repair-2 parts (2057614c …), with E-18 (65912eaf) and E-19 (574c7584) as the closing
condition.

**Findings:**
- **F5-01**: auditor verdicts e0b691a0 (candidate 1) and 2e8c019d (candidate 2), together with adversary probes
  31240af4, 18a5af25 and b246d6ef.
- **F5-02**: the receipt model id was not checked.

**Register:** R5.7 (commit f0515a6, committed-blob SHA-256 `4679cd67…f1d3e6`).

This record states what was done; it is not an acceptance. **No push. No endpoint calls.**

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `409fb69a8e538efadbf2687862e39e384b73d92b` |
| Tree | `b030c6de0ab78540f3f021c46b9b7a92c3d2a294` |
| Input revision (preserved, not rewritten) | candidate 2 `a848dfae8674bb5bba34d5f83cf5e967acb7bce7` (+ evidence a98cf90) |
| Commits after candidate 2 | `86fdbd3`: first E-17 version, never handed off, superseded by `409fb69` (E-18, E-19) |
| **Diff vs ddb75eca, excluding evidence** | `test/support/prize-check.mjs`, `test/stage5-gemma.test.ts`, `test/docs.test.ts`, `CLAIMS.md` (the C-75 proof title only). **Tests and docs only.** Nothing under `src/`, `public/`, `api/`, `data/` or `config/` changed. `vercel.json`, the package files and the run artifacts are unchanged |

## The prize check (`test/support/prize-check.mjs`)

Item numbers below are those of the auditor's message 2e8c019d, which E-19 adopts.

1. **Fail closed (E-17, E-19 item 1).** Every sentence that contains a prize-family word is a finding unless the
   whole normalised sentence is in `ALLOWED_PRIZE_CLAUSES`. Negation excuses nothing. A sentence wrapped across
   lines is checked line by line, so each fragment is unlisted and fails. The 01-REGLAS quote rule is kept.
2. **Normalisation before matching (E-18).**
   - Unicode NFKC;
   - U+200B–U+200D and U+FEFF removed;
   - `*` and `_` inside a word removed;
   - common Cyrillic and Greek look-alikes mapped to Latin letters.

   The allow-list match is exact on the whole normalised sentence, so e13 (the allowed sentence with a claim
   appended) is not listed.
3. **Words (E-19 item 2, the union of the E-17 and auditor lists):**
   - prize/s, award/s/ed;
   - win, wins, won, winning, winner/s (word-bounded, so "window" does not match);
   - eligib\*, qualif\*;
   - enter, entered, entry, entries, submission, submitted;
   - best use, google prize;
   - contender/s, challenge/s, compet\*, finalist/s, shortlist\*, runner(s)-up, podium, front-?runner/s,
     favou?rite/s;
   - deserv\*, rank\*, placed, `place[ds]? (first|second|third|1st|2nd|3rd)`, honou?rable mention/s;
   - track, hackathon.
4. **Allow-list, with reasons, for the auditor's review:**
   - "This comparison makes no claim about any prize or award.": the README Gemma section states that no prize
     claim is made (S5-10).
   - "Enter at least one value.": the UI validation message in `public/app.js`, where "enter" means type a value.
     Product code is not changed in Stage 5.
5. **public/*.js: only string literals are checked**, which is the text the page can show. `Object.entries` is a
   code identifier, so it is not text (E-19 analyst note). README, DEPLOY.md, METRICS.md and the html, css and json
   files in `public/` are checked as whole text.
6. **Stale entries (E-19 item 3).** The test "every prize allow-list entry still occurs, as a whole sentence, in a
   checked file" fails when a listed sentence no longer occurs.
7. **Current files:** the only sentences with a prize word are the two allow-listed ones.

## F5-02

The G-01 test now also checks, in all three runs, every result's `receipt.reader.model_id` (against the run's model
pattern) and `receipt.reader.requested_model_id` (`Qwen3.8-27B` or `Gemma-4-31B-IT`). No run artifact was edited.

## Unit tests (E-19 item 4)

These are flagged verbatim:
- A1–A7;
- S5M-e2…e8;
- e13, plus e14/e15 (Cyrillic і inside "prize" and "eligible", including sentences where it is the only prize
  word), e16 (`eli**gible**`, `eli_gible_`) and e17 (U+200B, U+FEFF);
- "CertGate does not compete for any prize, but it qualifies for the Gemma award." and "CertGate does not compete
  for any prize.";
- Greek and full-width variants, and placing, ranking, shortlist, runner-up and podium wording.

Both allow-list sentences are accepted. A JS-strings test shows `Object.entries` passes while a prize string in a JS
literal fails. e18 is not required (E-18).

## Kill check (`candidate-3/mutants5.log`, base 409fb69)

Mutants run on throwaway branches `impl-mut5/<id>-on-409fb69`, never merged. The appliers are `mutate5.mjs` and
`mutate5x.mjs`; the runner is `kill5.sh`. Every sentence mutant adds its own `"none: context"` claims-map entry, so
only the prize check can kill it.

| Mutants | Failed / 336 | Killed by |
|---|---|---|
| A1, A2, A3, A4/S5M-e3, A5, A6, A7, S5M-e2, e4, e5, e6, e7, e8, neg, neg_but, e13, e14, e14b, e15, e16, e17 | 1 each | docs.test "no forbidden claim" (prize check) |
| stale_allow: the README allowed sentence reworded, with its map entry following it | 1 | docs.test "every prize allow-list entry still occurs" |
| b2: the first Gemma `receipt.reader.model_id` set to the Qwen id | 1 | model identity (receipt) |
| b2q: a Qwen `receipt.reader.requested_model_id` set to the Gemma id | 2 | model identity; byte-identical stage-3 evidence |
| the 17 earlier Stage 5 mutants (a×3, b×3, c×2, d, e×2, f×2, E-15, G-04) | 2–4 each | as before |

**40 of 40 killed.**

## Verification (`candidate-3/clean-clone5.log`)

| Check | Result |
|---|---|
| Fresh clone of 409fb69: `npm ci` (0 dirty files), build, `npx vitest run` with MODEL_* unset | **336/336** |
| `metrics-md --check` | matches |
| Claims | **0 unmapped, 0 stale** |

Docker was not re-run: the product, the packaging and `public/` are unchanged since candidate 1.

Time: candidate 3 frozen about 12:12Z.
