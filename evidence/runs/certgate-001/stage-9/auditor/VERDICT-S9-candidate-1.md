# Auditor verdict — Stage 9 candidate 1: **REJECTED**

- **Candidate:** `e1b927db49225922925add8ef2b287242f80b8fc`, tree `40ab37bb04129d02ef481c75bbbe0faefab8a3b0`, branch `s9-impl`.
- **Baseline:** c040e82. **Deployed site:** 37938b2.
- **Rules:** T9-00…T9-07 (adopted, V-T9), R9.1–R9.3, dispatch 7, and the D1 mutation check.
- **Seat:** auditor-zt7p. Run 2026-10-16 06:00Z–06:20Z, in the auditor's own fresh clone, with no endpoint call.
- **Repair cycle:** this is **1 of 2**.

## Unmet conditions

Both are D1 mutation-check findings: a mutation no test catches is a finding against the suite. **Both were reproduced by the auditor** in its own clone, running `test/stage7.test.ts`, `test/stage7-capture.test.ts` and `test/stage9-screenshots.test.ts`. The baseline is 61/61.

1. **F9-A01: no suite check bans PNG text chunks in `docs/screenshots/`.**
   - **Mutant:** a `tEXt` chunk ("Comment\0auditor-mutant") inserted after IHDR in `landing-1280.png`, with its manifest hash updated.
   - **Result:** **61/61 still pass.**
   - The only chunk ban (`stage7.test.ts`, "the PNGs carry no time, text or software chunks") walks `data/previews/` only.
   - T9-05 requires no text or time chunk in the screenshots. Today the images have none (the auditor's scan), but nothing keeps it so.
2. **F9-A02: the "imports nothing from `src/`" check (V-01, C9-1) misses a side-effect import.**
   - **Mutant:** a first line `import "../../../../../src/web/models.js";` in `capture-stage9.mjs`.
   - **Result:** **61/61 still pass.**

## Folded into the same repair (documentation and evidence, analyst R9.3; the adversary's F9-A03 and F9-A04)

The auditor had judged these two as observations. Since a repair is needed anyway, it requires them in candidate 2:

3. **F9-A03, G-1:**
   - **The proof the auditor accepts:** the unchanged tool always writes each screenshot, then hashes it, then writes the manifest (`tools/capture-screenshots.mjs` lines 176–179 and 258). So the run-time manifest shows that `judge-*` and `story-cg-003-decision-*` were written by the 05:58:08.081Z run. The implementer's mtimes agree, but they are not committed.
   - **What is still required:** the README rows (or one sentence beside the table) for these **four images must say that they are byte-identical to the Stage 7 captures** because those screens did not change, and that they were re-captured by the 05:58:08.081Z run.
   - **Not required:** no new capture is needed. The generated captions stay as they are.
4. **F9-A04, G-2:** the README rows of `live-done` and `live-receipt` must say that the page labels the browser-held case "Stored in this browser · … · not live", while the reading itself was live (job `bc8a3b3a…`, `reading_source: live`). The intro paragraph already says this; the rows must say it too.

**Not affected by the repair:** the images, the manifest and the generated captions stay as captured. **No new capture and no live reading is needed.**

## Everything else checked: passed

| Rule | Result |
|---|---|
| **T9-00** | BEFORE 05:57:09.920Z and AFTER 05:59:43.524Z: **12/12** served `public/` files equal 37938b2, identical file by file. The capture window 05:56:46Z–05:59:11Z lies between the two checks (`S9-00-served-*-capture.json`) |
| **T9-01** | `git diff c040e82 e1b927d` is empty over src, public, api, data, config, evaluation, **tools**, the package files, vercel.json, Dockerfile, tsconfig.json and vitest.config.ts. The 28 changed paths are all in the allowed set |
| **T9-02** | `npm ci`, typecheck and build ok. **Suite 595/595 ×2**, 27 files, 0 skipped. metrics-md, previews and diagrams `--check` all ok. Claims **0 unmapped / 0 stale**. Existing tests: `stage7.test.ts` has 53 → 57 `expect` calls, and `stage7-capture.test.ts` 41 → 64. Its 2 new `skipIf(!stage9Present)` gate only the new Stage 9 blocks, in Docker only, and every CH7 check runs over every discovered script, the tool included. The T7-05 caption check is now end-anchored, which is stricter |
| **T9-03** | The auditor opened **all 19 images**, and each matches its row, caption and width:<br>- live and live-models at 1280 and 375 px: the three groups, the probe time 05:58:11.891Z, experimental "not evaluated" badges with no figure beside them, the code input empty;<br>- live-reading: Gemma selected, "Reading at AMD Token Factory (model requested Gemma-4-31B-IT)";<br>- live-done at 1280 and 375: "Release proposed — a person decides", with the model line "Read by Gemma-4-31B-IT, a measured model (reported as self-dploy/Gemma-4-31B-IT …)";<br>- live-receipt at 1280 and 375: Model requested, Model as reported, Evaluated, and the F1 "copy at reading time", with the endpoint shown by host only;<br>- judge and story: "recorded real reading … not live" and "Recorded reading · … · not live", cg-003 Block with ReH 338;<br>- amd: endpoint on, host only |
| **T9-04** | 19 PNGs on disk equal the manifest's 19, with **0 hash mismatches**. `served_files_sha256` has **12 entries**, equal to the auditor's BEFORE and AFTER hashes. Every caption names `site commit 37938b2`; the tool images carry the run time 05:58:08.081Z, and the 7 new images their own `captured_at`, all inside the T9-00 window |
| **T9-05** | Value scan (the code, SHA-256(code), the key, SHA-256(key), the base-URL path): **0 hits** in the 27 changed files, including the 15 changed PNGs (raw bytes **and** inflated IDAT), the 33 history blobs c040e82..e1b927d and the commit messages. **0** tEXt, iTXt, zTXt or tIME chunks |
| **T9-06** | 1 reading of 3, under a lease. Job bc8a3b3a…: reading at 05:58:37.342Z, done at 05:59:07.224Z, reported `self-dploy/Gemma-4-31B-IT`, live, release. The implementer's /usage delta 0.0001025186 equals the reply cost. The images agree with the job and with the README |
| **T9-07** | The table gives every image its machine time and site commit 37938b2. The "Earlier captures (Stage 7)" line names 2026-10-15T05:15:09.161Z, d1aaa3e, O7-01, cf97dfad, and `evidence/runs/certgate-001/stage-7/`, which resolves |
| Automatic rejections | **None.** No stored result is shown as live (the "stored in this browser" label errs conservative on a live result), no failed reading is shown as successful (it was done), and no secret appears |

**The adversary's bundle** (a1dea038): its findings F9-A01 and F9-A02 were reproduced here. The full bundle re-run is done on candidate 2.

## Decision

**REJECTED** on `e1b927db…` for **F9-A01 and F9-A02**, test gaps from surviving mutants. **F9-A03 and F9-A04**, documentation, are to be repaired in the same cycle.
- **Candidate 2:** a new commit on `s9-impl` that changes **only** the screenshot tests (a stricter chunk walk over `docs/screenshots/*.png`, and an import check covering any specifier containing `/src/`), plus README rows, claims and evidence.
- **No re-capture:** the images and the manifest stay as captured.
- Candidate 1 is preserved.
