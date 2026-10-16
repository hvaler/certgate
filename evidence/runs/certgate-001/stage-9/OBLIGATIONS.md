# Obligation register — Stage 9 (fresh screenshots of the deployed site)

Run: certgate-001 · Stage: 9 · Register version: **R9.0** (analyst-zt7k, 2026-10-16). Append-only.

- **Dispatch 7:** room msg `bf50f64b-a847-421a-bac8-0c87759899ea` from hugo.valer, received 05:26Z. Verbatim copy: `evidence/runs/certgate-001/DISPATCH-7.txt`; `D7:Ln` below means line n of that file.
- **Still in force, except where dispatch 7 changes them:** dispatches 1–6 and operator amendment 1. They are verbatim in DISPATCH-1…6.txt and DISPATCH-6-AMENDMENT-1.txt, and were delivered to these same seats in full as Stage 8 handoff parts 1–11.
- **Seats:** the same as Stage 8: analyst-zt7k, implementer-zt7m, adversary-zt7n, auditor-zt7p.

**Input revision:** GitHub main **`c040e8246993e50f72457c6395ca1b06cfd1d305`** (analyst `ls-remote` at 05:26Z).
- The deployed product is 37938b25 = Stage 8 accepted adb21d5 (auditor msg 2f2825c1).
- c040e82 adds evidence only.

**Byte-identity reference:** c040e82, for the product paths in S9-06.

**Limits (D7):**
- **Budget:** 150 min including final verification, from 05:26Z, so it **ends 07:56Z**. With the 20-minute addendum reserve, **no new work starts after 07:36Z**.
- **Repairs and retries:** at most **2 repair cycles**; 2 infrastructure retries per command.
- **Live readings:** at most **3 in the stage**.
- **Stage hard stop:** **2026-10-16T14:00:00Z**. If Stage 9 is not accepted by then, the band reports where it stands and the human keeps c040e82.

## Obligations

| ID | Source | Obligation | Acceptance | Owner |
|---|---|---|---|---|
| S9-00 | D7 Deliver 1 | **The capture is of the deployed site at 37938b2.** The auditor confirms that the served files equal the commit, **before and after** the capture, with GETs only and hashes recorded | Auditor record | auditor |
| S9-01 | D7 Deliver 1 | **Re-run `tools/capture-screenshots.mjs`** (Playwright **1.56.1**, as in Stage 7, run through pinned `npx -p`) against https://certgate-wheat.vercel.app, at **1280 and 375 px**. Same safeguards as Stage 7 (CH7-01…CH7-11):<br>- the access-code input is **empty** (`value === ""`) before every screenshot;<br>- no tracing, HAR, video or console capture;<br>- the code, the key and the base-URL path are never written, nor any property of them (D8-04);<br>- the DOM text is scanned inside the script, because there is no OCR on this host | Script logs, the visible-field record, the auditor's view of every image | implementer |
| S9-02 | D7 Deliver 2 | **Stage 8 screens:**<br>(a) the live-reading screen showing the three model groups (MEASURED; NOT EVALUATED · EXPERIMENTAL; LISTED, NOT OFFERED) and the probe time;<br>(b) **one live reading of sample cg-004 with Gemma-4-31B-IT**, captured queued or reading, then done;<br>(c) its proposal with the model line;<br>(d) its receipt, showing the model requested, the model as reported and the F1 copy at reading time.<br>**Fallback:** if Gemma is not listed or fails at capture time, use **Qwen3.8-27B** and say so in the captions and the README. A failed reading is **captured and labelled failed**. It is never silently retried into a success, and never replaced by a stored result | Images, captions, job timeline | implementer |
| S9-03 | D7 Deliver 3 | **At most 3 live readings in the stage,** each under an announced ENDPOINT LEASE and reconciled with GET /usage before and after | Lease messages, /usage records | implementer (auditor, if used) |
| S9-04 | D7 Deliver 4 | **README "Screenshots":**<br>- a new table giving every image its **machine time** and the **site commit**;<br>- the Stage 7 captures and their O7-01 note move to a short dated line, **"Earlier captures (Stage 7)"**, pointing to the evidence. They are not deleted from history | Auditor review | implementer |
| S9-05 | D7 Deliver 4 | **`docs/screenshots/manifest.json` is regenerated** with the SHA-256 of **every image** and of the **files served during the capture** | The auditor recomputes the hashes against the images and against the served files | implementer |
| S9-06 | D7 Deliver 4–5 | **Claims:**<br>- every new or changed sentence has a claims-map row, and the claims show 0 unmapped and 0 stale;<br>- E-11 (fail-closed) and the prize check still pass;<br>- the docs tests and the Stage 7 screenshot checks are updated **only as far as the new manifest requires, never loosened**. Every hunk in an existing test is listed with its reason | The suite and the auditor's hunk review | implementer |
| S9-07 | D7 Deliver 5 | **Nothing changes outside** `docs/`, `README.md`, `CLAIMS.md`, `claims-map.json`, the screenshot tests and `evidence/`.<br>**Byte-identical to c040e82:** `src/`, `public/`, `api/`, `data/`, `config/`, `evaluation/`, the package files, `vercel.json`, `Dockerfile`, and **`tools/`** (A9-01) | `git diff c040e82 <cand>` on those paths is empty | implementer; auditor |
| S9-08 | D7 Acceptance | **Auditor:**<br>- the full suite from a clean clone, plus the docs and diagram checks;<br>- byte-identity of the product paths;<br>- **every new image opened** and checked against its row and label;<br>- the manifest hashes checked against the images and the served files;<br>- **no image or file shows the code, the key or the base-URL path** | Auditor verdict | auditor |
| S9-09 | D7 Acceptance | **Automatic rejection:**<br>- a screenshot showing a stored result as live;<br>- a failed reading presented as successful;<br>- a secret | Auditor | auditor |
| S9-10 | D7 Final report | **Addendum** in the same shape, with the push request. The band never deploys, pushes or submits | Auditor verifies | analyst |

## Ambiguities and decisions

| ID | Decision |
|---|---|
| A9-01 | **The capture tool and the scope rule.** D7 says to "re-run `tools/capture-screenshots.mjs`", but `tools/` is not among the paths allowed to change. So **`tools/capture-screenshots.mjs` stays byte-identical** and is re-run as-is for the screens it already captures. The **Stage 8 screens (S9-02)** are captured by a **new committed script under `evidence/runs/certgate-001/stage-9/implementer/`**. It has the same safeguards and the same pinned Playwright, and may import the Stage 7 tool's helpers without changing it. The Stage 7 forbidden-options test (CH7-02: no `tracing.start`, `recordHar` or `recordVideo`) is extended to cover the new script, as a screenshot-test change. If the implementer finds that this cannot work, it says so in the design note before capturing |
| A9-02 | **Image files.** New captures may overwrite the files in `docs/screenshots/`. Their Stage 7 versions stay in history at cf97dfad (d1aaa3e on the site). The "Earlier captures (Stage 7)" line names the date (2026-10-15T05:15:09Z), the commit and `evidence/runs/certgate-001/stage-7/` as the pointer, together with O7-01 |
| A9-03 | **Readings budget.**<br>- The implementer has **1 Gemma reading** for the capture.<br>- If Gemma is unlisted, or that reading fails: the failure is captured and labelled, then **1 Qwen3.8-27B reading** is made, declared in the room and in the captions.<br>- The **3rd** reading is reserved for one infrastructure retry by the capture seat, announced. The auditor's acceptance needs no live reading.<br>Every reading is reconciled with /usage |
| A9-04 | **Which commit is captured.** The site commit in every caption is **37938b2**, the deployed main. The capture happens while GitHub main is c040e82 and Vercel serves the product of 37938b2. The auditor's S9-00 hashes prove which files were served. The captions do not name c040e82 as the site commit, because it changed no served file |
| A9-05 | **Times.** Every time written anywhere is a **machine time**: script ISO times or command output. No estimates (the analyst's lesson from Stage 8) |
| A9-06 | **Branch.** The implementer works in its worktree on a new branch, **`s9-impl`, from c040e82**. Candidates are new commits, never amended. Only the analyst moves `main`, after acceptance |
| A9-07 | **Commit e-mail.** The repository's configured `user.email` is used and never overridden (operator 7afc3c62). Setting `user.name` to the seat is fine |
| A9-08 | **Heavy work** is serialized, with HEAVY WORK START/DONE announced. **D8-04:** no property of any secret is written |
| A9-09 | **Order of work:**<br>1. Handoff.<br>2. Short design note (implementer) and register challenge (adversary), **both by 05:55Z**; auditor T9 rules by 05:55Z.<br>3. R9.1.<br>4. Capture under a lease.<br>5. Candidate 1.<br>6. Adversary and auditor checks.<br>7. Verdict.<br>8. Addendum and push request |


## R9.1: rulings on auditor T9 / C9-1…3 (a15f27f3), design note c845040b and adversary CH9-01…14 (c1d48c92), by analyst-zt7k

**The design note is approved** as amended below. With R9.0, it binds the capture and candidate 1. The candidate handoff answers every CH9, C9 and V item by number.

| ID | Ruling |
|---|---|
| V-T9 | **T9-00…T9-07 adopted** as the acceptance rules for S9-00, S9-08 and S9-09, together with the automatic rejections. The record is `stage-9/auditor/T9-RULES.md`, committed under a lease |
| V-C9 | **C9-1 adopted.** The new capture script imports nothing from `src/` and changes no product file at run time.<br>**C9-2 adopted.** CAPTURE START (before the first page load) and CAPTURE DONE (after the last screenshot), each with its machine time. The capture waits for the auditor's BEFORE hashes.<br>**C9-3 adopted.** The reading is made through the site by the capture script. Its job and receipt JSON, from the API responses, is saved after a secret scan |
| V-01 | **CH9-01 adopted.** The forbidden-options test **discovers** every Playwright-launching `*.mjs` (`tools/capture-screenshots.mjs` plus everything under `evidence/runs/certgate-001/stage-9/`) instead of using a fixed list. It bans the Stage 7 set, plus `page.on("console"`, `storageState` writes, `launchPersistentContext` (CH9-10) and `page.content(`. It also checks that there is no import from `src/`, and that writes go only under `docs/screenshots/` and `stage-9/`. This change makes the test stricter |
| V-02 | **CH9-02 adopted.** Immediately before each `page.screenshot`, the script asserts that the code input is empty where it exists. It writes a per-image visible-field record: image, width, `code_input_present`, `code_input_empty`. By the design note, the code goes **only** in the job POST header via `page.route` and is never typed into the input. The input therefore stays empty, and a test reads the record |
| V-03 | **CH9-03 adopted.** The captions and README rows of reading images are **generated from the saved job's final state and reason class**. "done" needs `state: "done"`; a failure says "failed (<reason_class>)". A Qwen fallback carries "fallback: Gemma-4-31B-IT <unlisted, or failed: class>" in every Qwen caption. A test ties them together |
| V-04 | **CH9-04 adopted.** Each reading has its own job id, job and receipt JSON, and /usage pair, plus a count of readings used out of 3. A failed attempt stays in `evidence/` and in the README, at least as a row or line. A failed image is never replaced in place |
| V-05 | **CH9-05 adopted.** The manifest lists every PNG under `docs/screenshots/` (no missing, no extra). Per image: width, machine capture time, site commit 37938b2 and URL. It also lists **all 12** `public/` files at 37938b2 with their SHA-256 as fetched. A repo-only test ties these to `git ls-tree 37938b2 public/`. It is skipped in Docker under the same `repoOnly` rule, and the skip count is stated (CH9-14) |
| V-06 | **CH9-06 adopted.**<br>- New captions and rows say `site commit 37938b2`; other commits appear only on the "Earlier captures" line.<br>- Every capture time falls inside the T9-00 window.<br>- The Stage 7 tool re-captures **all 12** of its images, so no image carries a new time over an old file. The adversary's hash-versus-time check is the killer |
| V-07 | **CH9-07 adopted.** Existing screenshot and docs tests keep their strength. Only the image list and count change. There is no skip or todo, no broader regex, no lowered threshold, and no drop in `expect` count per existing file. The design note's T7-05 per-image time equality and its new done/receipt assertion are approved: they make the checks stricter |
| V-08 | **CH9-08 adopted.**<br>- The recorded label is visible in every story and judge image.<br>- The live done image comes from the job's own result.<br>- A test checks the saved receipt: `reading_source === "live"`, the requested model equals the caption's model, and the job id equals the job record |
| V-09 | **CH9-09 adopted.**<br>- The requested model is Gemma-4-31B-IT, or Qwen3.8-27B under a declared fallback.<br>- The reported model passes `sameModel`.<br>- `evaluated` is true.<br>- The F1 copy's `checked_at` is within the reading.<br>- The README and caption agree. A test runs over the receipt and the manifest |
| V-10 | **CH9-10 adopted.** No HTML or DOM dump is saved; the DOM scan is done in memory and only counts are recorded. No persistent browser profile is used |
| V-11 | **CH9-11 adopted.**<br>- All three group headings and the probe-time line are visible in the live-screen images at 1280 and 375 px, using a full-page shot or a close-up.<br>- The "+N more" line appears if more than 100 ids are listed.<br>- The DOM-scan record notes the headings and the time per width |
| V-12 | **CH9-12 adopted.** The 3rd reading is only an infrastructure retry of the **same** model, after a 429, 5xx or timeout. It is never made after `invalid_model_output` or `model_mismatch`, which are captured as failures. GET /usage is saved before and after each reading |
| V-13 | **CH9-13 [OBS]:** the auditor and the adversary review the images for R-C (no measured figure beside an experimental id) |
| V-14 | **CH9-14 [OBS], adopted** under V-05 |
| V-15 | **Design note §2 approved.** The Stage 7-only `live-reading-1280.png` and `live-failed-1280.png` may be removed from `docs/screenshots/`. They remain in history at cf97dfad and are cited on the "Earlier captures (Stage 7)" line. If the Stage 9 reading fails, its own `live-failed-1280.png` is a new file with its own row (V-04) |
| V-16 | **Order.** R9.1 → CAPTURE START (wait for the auditor's BEFORE) → ENDPOINT LEASE TAKEN → GET /usage → tool run → stage-9 run (Gemma) → GET /usage → CAPTURE DONE → LEASE RELEASED → auditor AFTER → tests and candidate 1. **The capture may start now** |

## R9.2: rulings on adversary DN9-01…11 (msg 21b6fd39), by analyst-zt7k

**All DN9 items are adopted as written.** They bind the capture script and candidate 1.

| ID | Ruling |
|---|---|
| W-01 | **DN9-01.** Every `capture-stage9` manifest entry **must** carry `captured_at`, and the test asserts it. Only tool images take the run time |
| W-02 | **DN9-02.** Captions are built from the manifest and compared **whole**, with exact string equality |
| W-03 | **DN9-03.** The test has a failed branch too:<br>- **done** means `live-done` and `live-receipt` exist, `live-failed` does not, and the strict reported-model match holds;<br>- **failed** means `live-failed` exists with `failed (<failure>)`, and no done or receipt image exists for that job |
| W-04 | **DN9-04.** On any failure after the job POST, the script still shoots the current screen, saves the job record (one read-only GET) and writes the outcome and failure to the manifest, **before** exiting non-zero. Such an attempt counts toward the 3. One job POST per run, and every run has an outcome |
| W-05 | **DN9-05.** If Gemma is unlisted, `live-models-1280` (Gemma disabled, with `checked <time>`) and the status `models` block (without the code) are saved before the fallback. Qwen captions cite them |
| W-06 | **DN9-06.** The README column is "capture time (machine)". Tool rows state the tool's run start (or start–end), and new rows their own shot time. All times fall within the T9-00 window |
| W-07 | **DN9-07.** The "Earlier captures (Stage 7)" line links only to targets that resolve: existing `evidence/runs/certgate-001/stage-7/` paths, or full-SHA GitHub URLs at cf97dfad. The README-links test covers it |
| W-08 | **DN9-08.** The `page.route` hook matches only `POST` to `/api/live/jobs`, sets the header, continues, and is removed after the one POST. It never logs or stores request headers. The static test asserts both |
| W-09 | **DN9-09.** The empty-code proof for the live screen is the tool's `live` images at both widths. The new script's visible-field record still has one row per image |
| W-10 | **DN9-10 [OBS].** The 375 px `live-done` and `live-receipt` carry the same job id as the 1280 px ones |
| W-11 | **DN9-11 [OBS].** The handoff states the Docker skip count (V-05) |

## R9.3 and R9.4

**R9.3** (msg 82d38226) gives the analyst's interpretation of the two candidate 1 gaps:
- **G-1:** a byte-equal re-capture is acceptable only if this run is shown to have written it.
- **G-2:** the "Stored in this browser · not live" label on a live reading is not an automatic rejection, but the rows must explain it.

**R9.4** (msg 6a58e888) routes the adversary findings d78eac00 on e1b927d. All four are repaired in candidate 2, with tests, docs and evidence only:
- **F9-A01:** the PNG chunk ban is extended to `docs/screenshots/`;
- **F9-A02:** side-effect `src/` imports are caught;
- **F9-A03:** the README says the four images are byte-identical to Stage 7, and the mtimes are recorded as local observations only;
- **F9-A04:** the `live-done` and `live-receipt` rows explain the browser-held label.

Candidate 2 is frozen after the auditor's e1b927d verdict.
