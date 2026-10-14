# Auditor verdict, Stage 5 candidate 2: REJECTED

Candidate `a848dfae8674bb5bba34d5f83cf5e967acb7bce7`, tree `ee5fea47d4252c40b82b4b99debdd23b45c386af`. Repair cycle 1
of 3. Implementer handoff: msg c9a81fe2, record a98cf90. Adversary early result: msg 967693e3. Audited in a fresh
clone, `C:\nexus\dev\certgate-audit-s5c2`, from 11:46Z to 11:55Z.

**Result: REJECTED. F5-01 and F5-02 of my candidate 1 verdict (4eed261, msg e0b691a0) are not closed.** Candidate 2 was
frozen at 11:41Z, before that verdict was posted at 11:46Z, so it addresses only ADV-S5-F01. Repair cycle 2 of 3 is
used. **One cycle remains.**

## What passes

- **Diff vs ddb75eca:** apart from evidence, only `test/support/prize-check.mjs`, `test/stage5-gemma.test.ts` and
  `CLAIMS.md` (C-75 proof title) change. It is tests and docs only, so every product, run, Docker, E-16 and request
  check of candidate 1 carries forward.
- **Clean clone** (`candidate-2/clean-clone.log`): `npm ci` with 0 dirty files, build, **332/332** with 0 MODEL_*.
  `metrics-md --check` matches. Claims: 0 unmapped, 0 stale.
- **O5-01 is closed:** `b93b237` removes the local path from `kill5.sh` at head. The old blob remains in history; it
  is not a secret.
- **Prize mutants now killed:** S5M-e2 (my A2), S5M-e3 (A4), e5 (by `/qualif/`) and e6.

## What fails

Prize mutants on a848dfae. Each adds a README sentence plus its own `"none: context"` map entry, and each runs the full
suite (`candidate-2/prize-mutants.log`):

| Mutant | Sentence | Result | Cause |
|---|---|---|---|
| A3 | CertGate never invents a value and is eligible for the Gemma prize. | **survived** 332/332 | a negation anywhere before the prize word still excuses it |
| e4 | With no doubt CertGate is eligible for the Gemma prize. | **survived** | same |
| e8 | Without question CertGate deserves the Gemma prize. | **survived** | same |
| A5 | CertGate won the Gemma track. | **survived** | `won` is not a prize word |
| A6 | CertGate is a finalist in the hackathon. | **survived** | `finalist` is not a prize word |
| A7 | CertGate placed first in the Gemma category. | **survived** | `placed first` is not a prize word |
| e7 | CertGate is a frontrunner in Google's Gemma track on AMD. | killed in my run only by the sentence map; `frontrunner` is not a prize word, so with a matching map entry it survives (adversary) | |

**F5-02:** mutant b2, which sets a Gemma `receipt.reader.model_id` to `self-dploy/Qwen3.8-27B`, still **survives**:
332/332 (`candidate-2/b2-mutant.log`).

## Required repair for candidate 3 (the last cycle): docs and tests only, exactly this

1. **Fail closed by exact allow-list (G-09).** Any clause of README, DEPLOY.md, METRICS.md or `public/` that
   contains a prize-family word is a finding, **unless its exact trimmed text is in an `ALLOWED_PRIZE_CLAUSES` list**
   in `test/support/prize-check.mjs`. Negation no longer excuses anything by itself. The 01-REGLAS quote rule stays.
   I review the list. Today it should hold only the README sentence "This comparison makes no claim about any prize or
   award." and any other existing sentence the check currently relies on.
2. **Prize-family words:**
   - prize/prizes, award/awards/awarded, win/wins/won/winning/winner/winners, eligib\*, qualif\*;
   - enter/entered/entry/entries, submission/submitted, best use, google prize;
   - contender(s), challenge(s), compet\*, finalist(s), shortlist\*, runner-up, podium, frontrunner;
   - deserv\*, ranked, `place[ds]? (first|second|third|1st|2nd|3rd)` and honou?rable mention.

   Words such as "entry point" must not occur, or go on the allow-list by exact text.
3. **A stale allow-list entry,** one no longer present in any checked file, fails a test.
4. **Unit tests:**
   - flag A1–A7 and S5M-e2 to e8 verbatim;
   - flag "CertGate does not compete for any prize, but it qualifies for the Gemma award.";
   - accept every allow-list sentence.
5. **F5-02:** the model-identity test also checks `receipt.reader.model_id` (Gemma `/gemma-4-31b/i`, Qwen
   `/Qwen3\.8-27B/`) and `receipt.reader.requested_model_id` (`Gemma-4-31B-IT` / `Qwen3.8-27B`) in all three runs.
   My b2 mutant and the adversary's requested_model_id probe must be killed.

On candidate 3 I will re-run every mutant above, b2 and the adversary's probes, plus a clean-clone suite and the
claims checks. Everything else carries forward if the diff vs ddb75eca stays tests and docs only.
