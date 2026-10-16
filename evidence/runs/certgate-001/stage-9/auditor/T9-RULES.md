# Auditor pass/fail rules T9 — Stage 9 (dispatch 7: fresh screenshots of the deployed site)

- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Written 2026-10-16 ~05:35Z.
- **Specification:** DISPATCH-7.txt (msg bf50f64b) and register R9.0 (6ab7464). Dispatches 1–6 and amendment 1 still apply.
- **Byte-identity reference:** c040e8246993e50f72457c6395ca1b06cfd1d305.
- **Deployed product:** 37938b251189fed7be636fc2187e6fbd1fe778fa (Stage 8 accepted, product adb21d5).

A rule passes only on evidence this seat produced or re-ran itself. A skipped or unrun check is not a pass.

## T9-00 Served files before and after the capture (S9-00)

**Tool:** `stage-8/auditor/tools/served_check.mjs`. It makes GETs only and no endpoint call, and needs no code.
- Every file under `public/` at 37938b2 (12 files) is fetched from https://certgate-wheat.vercel.app, and its SHA-256 is compared with the committed blob.
- `/health` and `git ls-remote` main are recorded.
- **Dry run at 05:27:33Z:** 12/12 equal, GitHub main c040e82.

**Pass:** 12/12 equal at both points:
- **BEFORE:** run on the capture seat's **CAPTURE START** message, before its first page load;
- **AFTER:** run on its **CAPTURE DONE**.

If the live reading's job crosses the window, the AFTER check follows the last screenshot.

A mismatch at either point, or a capture made outside the window, fails. The manifest's served-file hashes must also equal these (T9-04).

## T9-01 Byte identity (S9-07)

`git diff --stat c040e82 <cand>` is **empty** over:
- `src/`, `public/`, `api/`, `data/`, `config/`, `evaluation/`;
- `package.json`, `package-lock.json`, `vercel.json`, `Dockerfile`, `tsconfig.json`, `vitest.config.ts`;
- **`tools/`** (A9-01).

The full changed-file list must fall within:
- `docs/`, `README.md`, `CLAIMS.md`, `claims-map.json`;
- the screenshot tests (`test/stage7*.test.ts`, plus any new screenshot test);
- `evidence/`.

Any other path fails.

## T9-02 Suite and checks (S9-08)

- **Fresh clone at the candidate:** `npm ci`, typecheck, build, then `npx vitest run` **×2**. Each must exit 0 with 0 failed and 0 skipped.
- **Then:**
  - `metrics-md --check`, `previews --check` and `diagrams --check` must exit 0;
  - `claims-units` must give **0 unmapped and 0 stale**;
  - the prize and E-11 tests must pass.
- **Existing test hunks (S9-06):** every hunk in an existing test file is listed in the handoff with its reason. One that removes, skips or loosens an assertion is a finding. "Updated only as far as the new manifest requires" means, for example, that the image list and its count change, but not the strength of a check: the caption format, the hash equality, the PNG chunk ban and the forbidden capture options all stay.

## T9-03 Every new image opened by the auditor (S9-08)

For **each** image under `docs/screenshots/` that differs from c040e82, the auditor opens it and checks it against:
- its README row;
- its caption;
- its `manifest.json` entry.

Each image must show what its label says, at the stated width.

**Required content:**
- **Live screen:** the three groups (MEASURED; NOT EVALUATED · EXPERIMENTAL; LISTED, NOT OFFERED), with the probe time as the page shows it, and the experimental "not evaluated" label.
- **The reading:** sample cg-004 with **Gemma-4-31B-IT**, or **Qwen3.8-27B if declared** as the fallback.
  - A queued or reading state, and a done state.
  - The proposal with its model line.
  - The receipt with model requested, model as reported, and the F1 copy at reading time.
- **A failed reading, if any:** labelled failed in the image and its caption.
- **Every stored or recorded screen** (stories, judge mode) keeps its "recorded … not live" label.

**Visible-field rule (no OCR on this host):**
- the access-code input is empty in every image showing the live screen;
- "Runs on AMD" shows the endpoint host only, never a path;
- the auditor also checks the script's DOM-scan record (S9-01).

## T9-04 Manifest (S9-05)

- **Images:** every image file's SHA-256 equals its `manifest.json` entry, and every manifest image exists, with no extra and no missing.
- **Served files:** the manifest's served-file hashes equal the committed blobs at 37938b2 **and** the auditor's T9-00 BEFORE and AFTER hashes.
- **Captions** name `site commit 37938b2` (A9-04), never c040e82, and a capture time inside the T9-00 window.

## T9-05 Secrets (S9-08)

- **Values:** compared in memory and counted only: the access code, SHA-256(code), the key, SHA-256(key), and the base-URL host+path.
- **Scope:** **0 hits** required in every changed or new file of the candidate. That includes the image bytes, the manifest, the logs and the capture records, the history delta c040e82..cand, and the commit messages.
- **PNG metadata:** no `tEXt`, `iTXt` or `zTXt` chunks, and no time chunk, as the Stage 7 test requires.
- **No property of a secret** is written anywhere (D8-04).

## T9-06 The live reading (S9-02, S9-03)

- **At most 3 readings in the stage**, each under an announced ENDPOINT LEASE TAKEN/RELEASED.
- **Each reading's records:** the job id, the state timeline, its final state and reason class, and GET /usage before and after.
- **Reconciliation:** the /usage delta equals the reply cost. A failed attempt with 0 tokens is reconciled by an unchanged cost.
- **Consistency:** the images, the job record and the README must agree on the model, the state and the time.
- **Fallback (A9-03):** declared in the room and in the captions if used.
- **No silent retry:** a reading that failed and was then retried must show **both**, with the failure labelled.

## T9-07 README (S9-04)

- **The new "Screenshots" table:** one row per image, with its machine capture time and site commit 37938b2.
- **"Earlier captures (Stage 7)" line:** names 2026-10-15T05:15:09Z, cf97dfad (site d1aaa3e), `evidence/runs/certgate-001/stage-7/` and O7-01. Nothing claims the Stage 7 live reading succeeded.
- **Claims:** every new or changed capability sentence has a claims row.

## Automatic rejection (S9-09)

Any of these rejects the stage:
- a screenshot showing a **stored result as live**;
- a **failed reading presented as successful**;
- a **secret** in any image or file.

## Verdict

- **ACCEPTED:** only if T9-00…T9-07 all pass with no blocking finding.
- **REJECTED:** names each unmet rule.
- **BLOCKED:** for missing infrastructure or evidence.

The verdict is bound to the candidate commit and to deployed 37938b2. Because no product file changes, Vercel redeploying the push serves the same files; T9-00 can be repeated after the push if the human asks.

## Challenges to R9.0

- **C9-1 (A9-01):** agreed. Add that the new Stage 8 capture script must **not** import from `src/` or change any product file at run time. The forbidden-options test must cover it, as R9.0 says.
- **C9-2 (T9-00 timing):** the capture seat posts **CAPTURE START** before its first page load and **CAPTURE DONE** after its last screenshot, both with machine times, so that the auditor's BEFORE and AFTER checks bracket the run. If the auditor cannot run BEFORE in time, the capture waits for it.
- **C9-3 (A9-03):** the reading is made **by the capture script through the site**, like a judge would make it, and its receipt JSON is saved (secret-scanned) so that T9-06 can compare it with the images.
