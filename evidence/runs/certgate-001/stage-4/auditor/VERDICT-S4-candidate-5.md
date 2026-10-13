# Stage 4 verdict: candidate 5 (auditor-xwz6)

Run certgate-001 · Stage 4 (delivery) · Register R4.8 (commit `f09a060`, committed-blob SHA-256 `b1ef987f…c0c3`;
E-11 fail-closed units), with R3.3, R2.2 and R1.6 still in force.

**VERDICT: ACCEPTED. Delivery candidate `b0ec67a663d1caeb9496ff4b75bec163c837d0b3`, tree
`8688691982ba6e211bd55374743dab8c21161749`.**

This verdict covers the band's delivery: README, DEPLOY.md, generated METRICS.md, EVIDENCE-INDEX.md, the claims table
with its fail-closed sentence map, and their checks. The product is the one accepted in Stage 3 (`5c904693`) plus
the R4.5 E-08 `/health` field and the R4.6 E-09 `#/amd` strings.

Two acceptance checks depend on the human and are **open (not done), not passed**:
- **S4-07 remote head = local head:** waits for the human's push of the commit the analyst names (D4-02).
- **S4-10 Vercel URL:** not reported. Listed as **not done** unless reported before the hard stop.

The band does not make or claim the video, slides, cover image, lablab form, deployment or submission (S4-11).

## 1. Candidate and history

| | |
|---|---|
| Candidate / tree | `b0ec67a6…d0b3` / `86886919…1749` (verified in my clone `certgate-audit-s4c2`) |
| Evidence on top | `a505073` (implementer record and logs) |
| Handoff | implementer msgs b3fd7f8d … (14 parts) |
| Lineage | 1 `02c5c36b` REJECTED (F4-01, `67c5093`) → 2 `ac738ef3` (superseded) → 3 `a130bbf4` REJECTED (F4-02, `8210d06`) → 4 `c5769948` REJECTED (F4-03, `7694541`) → **5 `b0ec67a6`** |
| Repair cycles used | 4 of 5 |
| Product since Stage 3 | `/health` reader (E-08), `#/amd` strings (E-09) and two comment-only hunks. The reading path, prompt (`32fad2f9…c567`), rules, data, packaging and `vercel.json` are byte-identical to `5c904693` |

## 2. Diff from candidate 4: docs and tests only

- Changed: `tools/claims-units.mjs` (test tooling, imported only by `test/docs.test.ts`), `claims-map.json` (+16 units), `CLAIMS.md` (C-46 broadened; C-67 and C-68 new), `test/docs.test.ts`, `test/stage4-claims.test.ts`.
- No change to README, DEPLOY or METRICS text.
- No change under `src/`, `public/`, `api/`, `tools/evaluate/`, `data/`, `config/`, the package files, `Dockerfile` or `vercel.json`.
- **Carried forward (product identical since candidate 1; record `VERDICT-S4-candidate-1.md` §2–§8):**
  - README and DEPLOY commands;
  - the E-02 real-mode check: 0 readings, 0 cost;
  - the browser at 375/1280 in mock, `VERCEL=1` and real shapes;
  - the image-filesystem secret scan;
  - the GitHub API check;
  - the history start.

## 3. Checks on `b0ec67a6`

| Check | Result |
|---|---|
| Suite, clean clone, `MODEL_*` cleared | **317 / 317, 0 skipped** (`candidate-5/vitest-report.json`) |
| `check_claims.py` with the report | **68 rows, 145 proofs**, all exist and pass. C-15's report is my parser splitting a title at `;`; that test passed |
| Sentence map (`tools/claims-units.mjs`, E-11 fail closed) | **0 unmapped, 0 stale** (401 units). Units include prose, headings, whole-line and trailing comments, and every line of any non-shell or untagged fence |
| `metrics-md --check` | matches; METRICS.md equals my independent recomputation of both runs |
| Forbidden-claim grep (F-06, E-10) | 0 |
| Head-tree scan (1227 files; counts only) | real key 0, base-URL host+path 0, Bearer 0, `sk-` 0. The generic matches are the **fake** S4M13 bait in mutant logs only. Local user name and operator e-mail only in the verbatim DISPATCH-2 quote. User-profile matches are prose or regex only |

## 4. Mutants and probes re-applied by me (`candidate-5/mutants/`)

| Group | Result |
|---|---|
| **F4-03:** S4M25 trailing-comment claim, S4M26 `text`-fence claim | **KILLED** |
| **My extra probes for the class:** S4M27 HTML comment, S4M28 indented code block, S4M29 table cell, S4M30 `json` fence, S4M31 plain DEPLOY sentence | **all KILLED** |
| F4-02: S4M23, S4M24 | KILLED |
| F4-01 and ADV-S4-F01…F05: S4M11, S4M11b, S4M12, S4M13, S4M18s, S4M20, S4M21, S4M22, S4M04 | KILLED |
| E-08 / E-09: S4M01, S4M03 | KILLED |
| Stage 3: S2M02br, S3M06 | KILLED |

All 22 are killed, and the clone was restored clean after each run.

**Adversary bundle on `b0ec67a6`** (msg fbbadc96; clone `e2c7322d`, `stage-4/adversary/cand-b0ec67a/`): 38 of 38
Stage 4 mutants killed, 0 survived. These include the paraphrased hiding-place probes S4M27–S4M35: JSON fence,
indented code, single-line and multi-line HTML comment, API table row, image alt text, `<details>`, blockquote and an
appended table cell. The adversary reports no open finding.

## 5. Submission audit (dispatch 2 §STAGE 4 Acceptance)

| Item | Status |
|---|---|
| S4-06 public repository, licence MIT (GitHub API, anonymous) | **pass** (`private:false`, `visibility:public`, SPDX `MIT`; `github-repo.json`, `github-license.json`) |
| S4-07 git log starts after 2026-10-12T15:00:00Z | **pass** (first commit `705c857` at 16:45:45Z) |
| S4-07 remote head = local head | **open, not done** (GitHub `main` = `e90fe2c`; re-checked after the human's push) |
| S4-08 container in a real browser at 375 / 1280 | **pass** (carried forward; product identical) |
| S4-09 no secret in repository, bundle or evidence | **pass** (history, head, `dist/`, image filesystem, evidence: real values 0; `LIVE_ACCESS_CODE` not set on this host and not scannable) |
| S4-01 README runs from a clean clone, S4-02 DEPLOY | **pass** (carried forward; README and DEPLOY text unchanged since candidate 4) |
| S4-03 METRICS generated and equal to an independent recomputation | **pass** |
| S4-04 EVIDENCE-INDEX, S4-05 claims table | **pass** (0 unmapped units under the fail-closed rule) |
| S4-11 no claim of video, slides, cover, form, submission, deployment or prize | **pass** |
| S4-12 no user-profile path at head | **pass** (prose only) |
| S4-10 Vercel URL | **not done** (none reported) |
| S4-13 final report | to be verified when the analyst posts it |

## 6. For the human (non-blocking)

- **Push:** push the commit the analyst names. I then check `git ls-remote` against the local head (S4-07).
- **O4-03:** committed mutant logs contain the **fake** test string `sk-proj-Ab12Cd34Ef56Gh78Ij90Kl12Mn34`, which is the bait of mutant S4M13. It is not a credential. It is short and lacks the format of real provider keys. If GitHub push protection flags it, it can be allowed as a test value.
- **Vercel:** deploy per DEPLOY.md **without** `MODEL_*` and post the URL in the room for the S4-10 check.
- **Cosmetic:** `/favicon.ico` answers 404; this is documented.
