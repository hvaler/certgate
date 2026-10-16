# Final report addendum — run certgate-001, dispatch 7 (Stage 9, fresh screenshots of the deployed site)

- **Author:** analyst-zt7k (Claude Code, model `claude-opus-5-5`).
- **Room:** `3e47b667-b685-4655-8f34-cc0dad08ab30`.
- **Dispatch 7:** room msg `bf50f64b-a847-421a-bac8-0c87759899ea` (from hugo.valer), received 05:26:47Z on 2026-10-16. Verbatim copy: `evidence/runs/certgate-001/DISPATCH-7.txt`.
- **Register:** `evidence/runs/certgate-001/stage-9/OBLIGATIONS.md` (R9.0 → R9.4).
- **Seats:** the same as Stage 8 (analyst-zt7k, implementer-zt7m, adversary-zt7n, auditor-zt7p).
- **Shape:** as the dispatch 6 addendum.

This is internal band acceptance only; there has been no external evaluation. The band did not deploy, push or submit. Times are UTC machine times.

## 0. Starting point

- **Input:** GitHub main **c040e82**, which is Stage 8 accepted (deployed 37938b25, product adb21d5) plus evidence-only commits.
- **Scope:** dispatch 7 changes documentation and evidence only.
- **Decision A9-01:** `tools/capture-screenshots.mjs` is outside the paths dispatch 7 allows to change, so it stays byte-identical. The Stage 8 screens were captured by a new script, `evidence/runs/certgate-001/stage-9/implementer/capture-stage9.mjs`.

## 1. Outcome

| Stage 9 | Candidate | Tree | Auditor verdict | Repair cycles | Checkpoint |
|---|---|---|---|---|---|
| Candidate 1 | `e1b927db49225922925add8ef2b287242f80b8fc` | `40ab37bb` | **REJECTED**, record 8f02203 (`VERDICT-S9-candidate-1.md`) | — | `0d8360c8` |
| **Candidate 2** | **`3fff29421e7aae071111f0c0e26825a2f904415c`** | `0aedac61` | **ACCEPTED**, record 1e6399a (`VERDICT-S9-FINAL.md`) | 1 of 2 | `8bfbb847` |

**Why candidate 1 was rejected.** There were two D1 mutation findings, both found by the adversary and reproduced by the auditor:
- **F9-A01:** the PNG chunk ban did not cover `docs/screenshots/`.
- **F9-A02:** the no-`src/`-import check missed the bare `import "…"` form.

Two documentation items were folded into the same repair:
- **F9-A03:** four images are byte-identical to Stage 7. The README now says that these screens did not change and were re-written by the 05:58:08Z tool run.
- **F9-A04:** the README rows now explain the product's "Stored in this browser · not live" label on the browser-held copy of a live reading.

The images and the capture did not change between the two candidates.

## 2. What Stage 9 delivered

**The capture,** bracketed by the auditor's served-file checks: BEFORE at 05:57:09.920Z and AFTER at 05:59:43.524Z, 12/12 served files equal to 37938b2 at both points.
1. The unchanged tool ran at 05:58:08Z and wrote 12 images: landing, judge, story cg-003, its decision section, "Runs on AMD", and the live screen with the three model groups, each at 1280 and 375 px.
2. `capture-stage9.mjs --model Gemma-4-31B-IT` ran from 05:58:11Z to 05:59:09Z and wrote 7 images: the model-group close-up at both widths, the reading at 1280 px, done at both widths, and the receipt at both widths.

**One live reading.** Readings used: 1 of 3.
- Gemma-4-31B-IT on sample cg-004, job `bc8a3b3a63f4353fee5ec31c618ac978`.
- Posted 05:58:35.981Z → reading 05:58:37.342Z → done 05:59:07.224Z. The queued state was not observed, and the README says so.
- Reported as `self-dploy/Gemma-4-31B-IT`, `evaluated: true`, proposal **release**, `reading_source: live`.
- /usage: requests 199 → 200; the cost delta of 0.0001025186 equals the reply cost (free credits).

**Docs and manifest.**
- The README "Screenshots" table gives a machine capture time and site commit 37938b2 for every image.
- The Stage 7 captures and O7-01 moved to a dated "Earlier captures (Stage 7)" line.
- `manifest.json` lists all 19 images and all 12 served files (CH9-05).
- The claims map has 0 unmapped and 0 stale.

**Safeguards:**
- the code input was empty before every screenshot;
- the code was sent as a header of the single job POST only;
- no trace, HAR, video, console or DOM dump was kept;
- 0 secret-value hits;
- 0 PNG text or time chunks.

## 3. Verification

| Candidate | Suite | Docker `--network none` (implementer) | Mutants | Secrets |
|---|---|---|---|---|
| `e1b927d` (1) | 595/595 ×2 (auditor) | 475 + 105 skipped | adversary 18/20 (M9-10, M9-12 survived = F9-A02, F9-A01) | 0 |
| `3fff294` (2) | 596/596 ×2 (auditor) | 475 + 106 skipped | adversary 20/20; auditor re-applied the former survivors: killed | 0 in 28 files, 39 blobs and the commit messages; 0 PNG text or time chunks, now enforced by the suite |

**Byte identity (T9-01):** `src/`, `public/`, `api/`, `data/`, `config/`, `evaluation/`, `tools/`, the package files, `vercel.json`, `Dockerfile`, `tsconfig.json` and `vitest.config.ts` are unchanged from c040e82.

**Images and manifest:**
- The auditor opened all 19 images and matched each one to its README row and caption (T9-03).
- The manifest gives 0 image mismatches and 12/12 served hashes equal to the auditor's BEFORE and AFTER checks. All captions name site commit 37938b2, with capture times inside the window (T9-04).

**Existing tests:** only stricter. `expect` counts rose: stage7-capture 41 → 65, stage7 53 → 57.

## 4. Live

Dispatch 7 requires no live check beyond the capture's own reading and the auditor's served-file checks (§2). The deployed product is unchanged (37938b25). Pushing the accepted head changes only `docs/`, the README, the claims and evidence; Vercel redeploys the same product.

## 5. Interventions, infrastructure, limitations

**Operator input:** the dispatch only.

**Rulings during the stage:**
- **A9-01:** the tool stays unchanged, and a new script captures the Stage 8 screens.
- **V-05:** all 12 served files are hashed by the new script, because the tool hashes 6 (adversary 16d9194d).
- **R9.3:** interpretations of the two "known gaps".
- **R9.4:** routing of the repair.

**Limitations:**
- **Queued state:** not observed live, because the job went straight to reading. The README says so.
- **Four images byte-identical to Stage 7:** `judge` and `story-cg-003-decision` at 1280 and 375 px. The screens did not change. The proof that the 05:58:08Z run wrote them is the tool's own write → hash → manifest path (the tool is unchanged). The run's stdout was not saved, and the mtimes in `RECAPTURE-NOTE.md` are local observations, not carried by git.
- **Receipt label:** the page labels the browser-held copy of the live reading "Stored in this browser · … · not live". This is the accepted product's own label. The reading itself was live (job bc8a3b3a…), and the README rows say so.
- **Estimated time:** the auditor observed one estimated time ("about 06:1xZ") in `RECAPTURE-NOTE.md`, contrary to A9-05. It was **fixed in an evidence-only commit**, b1de06e (06:45:20Z): the phrase was removed, because no machine time of that reading was recorded. No accepted file changed.

**Infrastructure:** none. Heavy work was serialized.

## 6. Time, usage, final commit and push

| | Start (UTC) | Accepted (UTC) | Wall clock | Limit |
|---|---|---|---|---|
| Stage 9 | 05:26:47Z, 2026-10-16 (dispatch 7) | verdict message 8bfbb847 written 06:43:54Z; record 1e6399a committed 06:44:41Z | 77 min (05:26:47Z → 06:44:41Z; auditor correction E1) | 150 min (ends 07:56Z); stage hard stop 14:00Z |

- **Repair cycles:** 1 of 2. **Infrastructure retries:** 0.
- **Endpoint usage in Stage 9** (Token Factory, free credits, no monetary value): 1 live reading (Gemma-4-31B-IT), cost 0.0001025185 as reported, reconciled with GET /usage (requests 199 → 200). No other seat called the endpoint; the auditor's checks were GETs to the site only.
- **Seat usage (Claude):** in `final/band-usage-agents-dispatch7.txt`, recorded at 06:46:56Z. The figures are cumulative since each seat was created, so they include Stage 8. They are list-price estimates, not a bill.

| Seat | Tokens | Estimate |
|---|---|---|
| implementer-zt7m | 219,685,564 | $54.99 |
| auditor-zt7p | 150,662,464 | $38.51 |
| analyst-zt7k | 141,720,979 | $35.60 |
| adversary-zt7n | 92,953,167 | $27.22 |

**Final commit and push request:**
- The accepted candidate is **3fff294** (tree 0aedac61). It was merged into main at c938759; outside `evidence/`, it is identical to 3fff294.
- **Push target:** the local main head named in the room message that posts this addendum. It is a fast-forward from GitHub main c040e82.
- **What the push changes:** only `docs/screenshots/`, `README.md`, `CLAIMS.md`, `claims-map.json`, the screenshot tests and `evidence/`. Vercel redeploys **the same product** (37938b25's served files).
- **Nothing to set in Vercel.**

**For the human before submitting (stage hard stop 2026-10-16T14:00Z; submission deadline 2026-10-18T10:00Z):**
1. Push the named head.
2. The README now shows the deployed site as it is: the model choice and one completed live Gemma reading with its receipt.
3. The video, slides, cover and lablab form (access code only in Additional Information).
4. Export the room.
