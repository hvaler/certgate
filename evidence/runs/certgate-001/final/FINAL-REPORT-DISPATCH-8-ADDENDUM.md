# Final report addendum — run certgate-001, dispatch 8 (Stage 10, README and submission text for a judge)

- **Author:** analyst-zt7k (Claude Code, model `claude-opus-5-5`).
- **Room:** `3e47b667-b685-4655-8f34-cc0dad08ab30`.
- **Dispatch 8:** room msg `fca8944b-ca52-41ed-a62e-74ea140e27ef` (from hugo.valer), received 10:11:41Z on 2026-10-16. Verbatim copy: `evidence/runs/certgate-001/DISPATCH-8.txt`.
- **Register:** `evidence/runs/certgate-001/stage-10/OBLIGATIONS.md` (R10.0 → R10.4).
- **Seats:** the same four (analyst-zt7k, implementer-zt7m, adversary-zt7n, auditor-zt7p).
- **Shape:** as the dispatch 7 addendum.

This is internal band acceptance only; there has been no external evaluation. The band did not deploy, push or submit. Times are UTC machine times.

## 0. Starting point and rulings

- **Input:** GitHub main **4e5b9fe**, which is Stage 9 accepted (product deployed from 37938b2). Dispatch 8 changes documentation and evidence only, with no endpoint call.
- **Scan count, a correction to the dispatch wording (C10-1, X-01).** Dispatch 8 says "the evaluation set has 5 scans of 30 certificates". The committed data gives **5 scans among the 30 dataset certificates**, but **3 among the 27 evaluated** (cg-016, cg-017 and cg-025; cg-002 and cg-003 are story and tuning cases). The README and the submission text state both, each with its set.
- **`tools/` stays unchanged** (A10-03, A10-06). The utility counts and the claims coverage of `docs/submission/lablab.md` are computed by a docs test, not by the generator or the claims CLI.
- **Missing Stage 7 register row.** `STAGE-REGISTER.md` had no Stage 7 row. The auditor found this through F10-A02. The analyst added the row in 31d21a8, reconstructed from the dispatch 5 addendum and the Stage 7 verdicts.

## 1. Outcome

| Stage 10 | Candidate | Tree | Auditor verdict | Repair cycles | Checkpoint |
|---|---|---|---|---|---|
| Candidate 1 | `ee2328a987b8912c1daca341284874adb21edcd8` | `59f99871` | **REJECTED**, record 80d10e2 (`VERDICT-S10-candidate-1.md`) | — | `fb443150` |
| **Candidate 2** | **`18dd217893e87f98987e4cdb3caea0ac4fd79fc3`** | `5c5ecf2c` | **ACCEPTED**, record 7fc19ac (`VERDICT-S10-candidate-2.md`) | 1 of 2 | `738b24fa` |

**Why candidate 1 was rejected** (text only):
- **F10-A01:** the "sent to review without need" figures had no run label in their clause.
- **F10-A02:** "How it was built and verified" lacked the Stage 7 rejection line. The register row was missing, see §0.

Two observations were folded in:
- **O10-A02:** mutation facts for every stage.
- **O10-A01:** CLAIMS.md says how lablab.md is checked.

## 2. What Stage 10 delivered

**README top block,** directly after the title, in 5 lines:
- the problem and the user (a steel mill certificate, an inspection certificate of the EN 10204 3.1 kind);
- how it works: a model on AMD Token Factory reads (Qwen3.8-27B is the evaluated model behind every figure, and live reading also offers other measured and experimental models); deterministic versioned rules propose; a person decides;
- **safety:** false conforming 0/18 in both Qwen3.8-27B runs; proposals equal to the expected proposal 27/27 (implementer run) and 26/27 (auditor's independent run); fields read correctly 591/594 in both runs;
- **utility:** of the 9 cases expected release, proposed release 9/9 and 8/9, and sent to review without need 0/9 and 1/9. The one is cg-004: the model read the printed CEV with a decimal comma, and the channel check disagreed;
- links to the deployed site, judge mode and the screenshots.

**Other README changes:**
- The second-channel scope is moved up into "Problem and user", with the scan counts by set.
- Every reading time names its model and its run.
- The limitation "One endpoint and one model" is reworded.
- A dated sentence records Token Factory listing Gemma-4-31B-IT again on 2026-10-16 (operator 04:21:59Z; auditor direct GET /models 04:23:34.429Z).
- Internal codes and the words "dispatch", "the band" and "the human" are replaced by plain words.
- "How it was built and verified" gives one plain-word line per rejected stage, and mutation figures for Stages 1–9.

**`docs/submission/lablab.md`,** for the operator to paste:
- title of 45 characters (limit 50);
- short description of 254 characters (limit 255), with 0 of 18 false conforming in both Qwen3.8-27B runs;
- long description of 375 words (minimum 100);
- an Additional Information line saying that the operator gives the access code there.

It carries no code, no key, no base-URL path and no prize-family word.

**Tests (`test/stage10-docs.test.ts`, plus `docs.test.ts` hunks), each check tied to the committed artifacts:**
- every figure, compared with each run's `metrics.json` and with METRICS.md;
- the utility counts, computed from each run's `results.json`;
- the scan counts, computed from the data;
- the run label beside each figure;
- the position and line count of the top block;
- the jargon ban over README and lablab.md;
- the length limits;
- the lablab claims units, through the unchanged `tools/claims-units.mjs`;
- the rejected-stage lines, derived from STAGE-REGISTER.md.

## 3. Verification

| Candidate | Suite (auditor, ×2) | Mutants | Secrets |
|---|---|---|---|
| `ee2328a` (1) | 615/615 | adversary 27/27 (labels on 0/9 and 1/9 absent, so F10-A01 could not be mutated) | 0 in 1653 tracked blobs, the history delta and the commit messages |
| `18dd217` (2) | 616/616 | auditor A1–A4 killed; adversary 29 (result posted separately) | 0 in 1656 tracked blobs, the history delta and the commit messages |

- **Byte identity (T10-01):** `src/`, `public/`, `api/`, `data/`, `config/`, `evaluation/`, `tools/`, `docs/screenshots/`, the package files, `vercel.json`, `Dockerfile`, `tsconfig.json` and `vitest.config.ts` are unchanged from 4e5b9fe.
- **Figures (T10-03):** every figure equals the auditor's reference table, which it recomputed at 4e5b9fe from the committed artifacts.
- **Reading times (T10-04):** each one names its model and run. The limit durations are listed as exemptions and reviewed.
- **Docker:** not run. Only docs and tests changed, and the new tests are repository-only.

## 5. Interventions, infrastructure, limitations

**Operator input:** the dispatch only. An untracked `DISPATCH-8-DRAFT.txt` in the checkout is not the band's; it is left untouched and is not committed.

**Analyst records:**
- The Stage 7 register row had been missing since Stage 7. It was added in 31d21a8 (§0).
- The R10.4 routing made O10-A02 **required**, because the submission text's "mutation checks at every stage" had to be provable.

**Observations, not blocking:**
- The rejected-stage and mutation tests match one-digit stage numbers only (`\d`). A Stage 10+ line would need the pattern widened.
- `node tools/claims-units.mjs --stale` lists the 30 lablab.md entries as stale, because the unchanged CLI does not split that file. The docs test does, and gives 0/0. CLAIMS.md explains this.

## 6. Time, usage, final commit and push

| | Start (UTC) | Accepted (UTC) | Wall clock | Limit |
|---|---|---|---|---|
| Stage 10 | 10:11:41Z, 2026-10-16 (dispatch 8) | record 7fc19ac committed 11:07:43Z (verdict msg 738b24fa) | 56 min 02 s (10:11:41Z → 11:07:43Z) | 120 min (ends 12:11:41Z); stage hard stop 2026-10-17T12:00Z |

- **Repair cycles:** 1 of 2. **Infrastructure retries:** 0.
- **Endpoint usage:** none. Dispatch 8 forbids calls, and none was made.
- **Seat usage (Claude):** `final/band-usage-agents-dispatch8.txt`, read at 11:08:15Z. The meter still shows the figures read at the end of Stage 9 (the latest per-seat activity it shows is 06:06:50.840Z, implementer-zt7m), so **Stage 10's usage is not yet visible in the meter**, and no Stage 10 figure is claimed.

**Final commit and push request:**
- The accepted candidate is **18dd217**, merged into main at 9463aa2. Outside `evidence/`, main equals 18dd217.
- **Push target:** the local main head named in the room message that posts this addendum, a fast-forward from GitHub main 4e5b9fe.
- **What the push changes:** only `README.md`, `CLAIMS.md`, `claims-map.json`, `docs/submission/lablab.md`, the docs tests and `evidence/`. Vercel redeploys the same product.

**For the operator before the submission deadline (2026-10-18T10:00:00Z):**
1. Push the named head.
2. Paste `docs/submission/lablab.md` into the lablab form: the title, the short description and the long description as written. Put the access code only in Additional Information.
3. The video, slides and cover; export the room.

CertGate makes no claim of winning, entering or qualifying for any prize.
