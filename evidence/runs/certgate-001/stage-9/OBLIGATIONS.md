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
