# Auditor verdict — Stage 9 FINAL: **ACCEPTED** (candidate 2)

- **Candidate:** `3fff29421e7aae071111f0c0e26825a2f904415c`, tree `0aedac613699d955f736cfec57e2f9be77f35158`, branch `s9-impl`.
  - It is one commit on top of rejected candidate 1 `e1b927db…`, which is preserved (VERDICT-S9-candidate-1.md).
  - Repair cycle **1 of 2**.
- **Baseline:** c040e82. **Deployed site captured:** 37938b2 (product adb21d5), unchanged by this stage.
- **Rules:** T9-00…T9-07 (V-T9) and R9.1–R9.4, dispatch 7, and the D1 mutation check.
- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Run 2026-10-16 06:25Z–06:45Z, in a fresh auditor clone, with no endpoint call. Heavy work was serialized after the adversary's DONE (5ef5ad17).

## The repair, delta e1b927d → 3fff294 (6 files, every hunk read)

**Changed:**
- `test/stage9-screenshots.test.ts` (+8): a chunk walk (`tIME`, `tEXt`, `iTXt`, `zTXt`) over **every PNG in `docs/screenshots/`** (F9-A01);
- `test/stage7-capture.test.ts` (+2): `not.toMatch(/import\s+["'][^"']*\/src\//)` (F9-A02);
- README rows (F9-A03, F9-A04);
- CLAIMS.md and claims-map.json (remapped);
- `stage-9/implementer/RECAPTURE-NOTE.md` (new).

**Unchanged:** `git diff e1b927d 3fff294 -- docs` is **empty**: no image, no manifest and no caption changed. The capture script, `tools/` and every product path are unchanged.

**Killers re-applied by the auditor** over stage7, stage7-capture and stage9-screenshots. The baseline is **62/62**:

| Mutant | Candidate 1 | Candidate 2 |
|---|---|---|
| `tEXt` chunk in landing-1280.png (manifest hash updated) | 61/61, survived | **1 failed**: "every screenshot PNG carries no time, text or software chunk" |
| `iTXt` chunk in live-receipt-375.png | — | **1 failed** |
| `import "../../../../../src/web/models.js";` in capture-stage9.mjs | 61/61, survived | **1 failed** |
| the same with single quotes | — | **1 failed** |

**The adversary's `mutate9.mjs`** (from its commit 4c30ea3b, run in the auditor's clone): M9-05 failed-to-done, **M9-10 import-src**, **M9-12 png-text-chunk** and M9-16 route-wide are all **KILLED**. The adversary's own run killed 20/20.

## T9 results on 3fff294

| Rule | Result |
|---|---|
| **T9-00** | BEFORE 05:57:09.920Z and AFTER 05:59:43.524Z: 12/12 served files equal 37938b2, identical, and the capture is bracketed. The images and manifest are unchanged since then (empty `docs/` diff) |
| **T9-01** | `git diff c040e82 3fff294` is **empty** over src, public, api, data, config, evaluation, **tools**, the package files, vercel.json, Dockerfile, tsconfig.json and vitest.config.ts. All changed paths are in the allowed set (adversary check9 re-run: `[]` and `[]`) |
| **T9-02** | `npm ci`, typecheck and build ok. **Suite 596/596 ×2**, 27 files, 0 skipped. metrics-md, previews and diagrams `--check` all ok. Claims **0 unmapped / 0 stale**. Existing tests: stage7-capture has 41 → 65 `expect` calls and stage7 53 → 57, with no drop. The 2 new `skipIf(!stage9Present)` apply only to the new Stage 9 blocks, in Docker. The new hunks only add assertions |
| **T9-03** | All 19 images were opened by the auditor on candidate 1 (VERDICT-S9-candidate-1). They are unchanged byte for byte, and each matches its row, caption and width |
| **T9-04** | The manifest equals the 19 PNGs, with 0 hash mismatches. Its 12 served-file hashes equal the auditor's BEFORE and AFTER records. Every caption names `site commit 37938b2`, and every time is inside the T9-00 window (check9 re-run agrees) |
| **T9-05** | Value scan (the code, SHA-256(code), the key, SHA-256(key), the base-URL path), in memory, counts only: **0 hits** in the 28 changed files c040e82..3fff294, the 39 history blobs and the commit messages. Candidate 1's scan of the images, including the inflated IDAT, holds, since the images are unchanged. **0 PNG text or time chunks**, now also enforced by the suite |
| **T9-06** | 1 reading of 3 (Gemma-4-31B-IT, job bc8a3b3a…, done, live, release); the /usage delta equals the reply cost (implementer record). No other reading was made in the stage |
| **T9-07** | Every row has its machine time and site commit 37938b2.<br>- **F9-A03:** the four `judge` and `story-cg-003-decision` rows say "identical bytes to the Stage 7 capture: the screen did not change; written by the tool run of 05:58:08Z".<br>- **F9-A04:** the four `live-done` and `live-receipt` rows say the page labels its browser-held copy "Stored in this browser · … · not live", while the reading was live (job bc8a3b3a…, `reading_source: live`).<br>- The "Earlier captures (Stage 7)" line names 2026-10-15T05:15:09.161Z, d1aaa3e, O7-01 and cf97dfad, and links evidence that resolves |

**G-1 (R9.3), accepted:**
- The unchanged tool writes each screenshot, then hashes the written file, then writes the manifest (`tools/capture-screenshots.mjs` lines 176–179 and 258). So the 05:58:08.081Z run manifest proves that those four files were written by that run.
- RECAPTURE-NOTE records the local mtimes, labelled "local observations, not carried by git", and states that the stdout was not saved and is not reconstructed.

## Automatic rejections: none occurred

- **No stored result is shown as live.** The recorded stories and judge mode are labelled "recorded … not live", and the live reading is labelled conservatively and explained in its rows.
- **No failed reading is shown as successful:** the one reading was done.
- **No secret** appears in any image or file.

## Observation (not blocking; an evidence-only fix is suggested)

- **RECAPTURE-NOTE.md** says the mtimes were read "at about 06:1xZ". That is an estimated time, contrary to A9-05 ("every time written anywhere is a machine time"). It misstates nothing, and it describes when the note's author read local metadata, not a capture time. **Suggestion:** replace it with the machine time of that read if one exists, or delete the phrase, in an evidence-only commit. That changes no accepted file.

## Decision

**Stage 9 ACCEPTED** on `3fff29421e7aae071111f0c0e26825a2f904415c` (tree 0aedac61). It is documentation, tests and evidence only. The product served by https://certgate-wheat.vercel.app (37938b2) is unchanged, and a push makes Vercel redeploy the same product.

Any later change outside `evidence/` voids this acceptance until it is rechecked.
