# Obligation register — Stage 4 (delivery)

Run: certgate-001 · Stage: 4 · Register version: **R4.2** (analyst-xwz3, 2026-10-13; R4.1 = commit 6f8f08e7; R4.2 records rulings on auditor testability review msg 13bfa92b; R4.0 = commit 1024f791 dispatched ~20:01Z; R4.1 narrows S4-16 per implementer question msg 8f4f9e61) · **Input revision: Stage 3 ACCEPTED candidate 4 `5c904693423574846e17994331a628cc06d735ef` (tree `1ed386fd25d993f1d37b823eadddfa7040b19dae`)**, auditor msg 6e4c01d3, verdict record commit 4a6f28c (committed-blob SHA-256 348ac2315af6467c686c1c64284cae55457d020131041d81706a8ca1f2975773). Sources at Stage 4 start: `stage-4/SOURCES.sha256` (unchanged since Stage 3 start). Dispatch 2 (Y) §STAGE 4 and §FINAL REPORT; dispatch 1 (X) in force. Registers R1.6, R2.2 and R3.x stay in force.

## Scope statement (D4-01)

Stage 4 delivers documentation, deployment instructions, generated metrics, an evidence index and a claims table, and a submission audit by the auditor on the real artifacts. The band does **not** deploy (the human deploys on Vercel), does **not** push (`git push` is denied on this host; the human pushes), and does **not** make or claim the video, slides, cover image or lablab form, or the submission.

## Obligations

| ID | Source | Obligation | Boundary / error case | Acceptance method → expected | Owner |
|---|---|---|---|---|---|
| S4-01 | Y §S4 b1 | **README runs from a clean clone** and states: what CertGate is; the user; **what runs on AMD** (AMD Token Factory, the model as reported, what the model does — reads page images into the contract — and what it never decides) and how that is shown (F1, receipts); the **synthetic-data notice**; Docker run in **mock** and **real** mode; environment variables by name; demo procedure; **evaluation results with denominators** (from the Stage 3 artifacts); **limitations** (shared-service limits, what remains of OI-S2-01 and OI-S2-02, C-04 no model explanation, cg-022 consequence, reference-check scope, any other open item) | No claim beyond evidence; key/base-URL values never written | Auditor runs every README command from a clean clone | implementer |
| S4-02 | Y §S4 b2 | **DEPLOY.md** for the human: Vercel project settings, every environment variable **by name** (values never written), the expected **function duration** setting (from the S2-22 record and S3-24/C-07), and the **post-deploy checks**. The deployed site opens in **judge mode without the endpoint**, honestly labelled | No credential handling by seats | Review; auditor follows the checks against the container equivalent | implementer |
| S4-03 | Y §S4 b3 | **METRICS.md generated** from the Stage 3 evaluation artifacts by a committed command, not by hand | Regeneration must reproduce the committed file byte for byte | Test or command that regenerates and diffs | implementer |
| S4-04 | Y §S4 b4 | **EVIDENCE-INDEX.md** links every README claim to its evidence record | — | Auditor follows each link | implementer (product docs); analyst may maintain the index of planning/evidence records |
| S4-05 | Y §S4 b5 | **Claims table**: every README sentence that states a capability, with the file, test or evidence that makes it true. Auditor greps each; an unsupported claim is removed or proven | — | Auditor grep report | implementer; auditor |
| S4-06 | Y §S4 Acceptance | **Public repo and licence**: GitHub repository public and detected licence **MIT**, checked through the **GitHub API anonymously** | — | Auditor API capture | auditor |
| S4-07 | Y §S4 Acceptance; X kickoff | **History**: `git log` starts after 2026-10-12T15:00:00Z; **remote head equals local head after the human pushes** (D4-02) | No push by seats | Auditor `git ls-remote` vs local | auditor; human pushes |
| S4-08 | Y §S4 Acceptance | Container behaves as documented in a **real browser at 375 px and 1280 px** | — | Screenshots | auditor |
| S4-09 | Y §S4 Acceptance; X:I6 | **No secret** in the repository, the built bundle or the evidence (key, base-URL value, access code) | Host name may appear | Auditor scan | auditor; adversary |
| S4-10 | Y §S4 Acceptance | **Vercel URL** (if the human reports it in the room before the hard stop): the URL and every asset it needs answer 200; served files match the committed ones (hash at least one bundle). Not reported in time ⇒ listed as **not done** | — | Auditor HTTP captures | auditor |
| S4-11 | Y §S4 "Video, slides…" | Video, slides, cover image and lablab form are made by the human and are **not claimed** by the band anywhere (README, docs, final report) | — | Grep | all |
| S4-12 | Y §OPEN b5 (S3-25) | Before delivery no local absolute path (`C:\Users\…`) remains in the tree at the delivered head (new redaction commits only, no history rewrite) | Earlier public history unchanged | Auditor grep at head | implementer; all seats for own evidence |
| S4-13 | Y §FINAL REPORT | Final report (analyst): Stages 3 and 4 in the dispatch-1 shape, plus the evaluation table with denominators; AMD evidence (endpoint, model as reported, latency, tokens, reported cost with the "free credits, no monetary value" note, usage before and after); deployment status and its audit; final commit and tree hash; explicit list of what the human must still do before **2026-10-18T10:00:00Z** (Vercel deploy if not done, video MP4, slides PDF, 16:9 cover, submission form, final check of the deadline question). No claim of submission | — | Auditor verifies the report | analyst |
| S4-14 | X §MUTATION CHECK | Mutation check on what Stage 4 adds: at least a hard-coded figure in METRICS.md/README not regenerated, an unsupported README claim surviving the claims table, a secret value in DEPLOY.md | Mutation report | adversary |

## Decisions (draft)

| ID | Ambiguity | Decision | Evidence |
|---|---|---|---|
| D4-01 | Scope | As scope statement | Y §S4; D1-19 |
| D4-02 | Push and "remote head equals local head" | The band never pushes. When the delivery candidate is accepted, the analyst posts a directed request in the room to the human (`hugo.valer`) naming the exact commit to push. The auditor then checks `git ls-remote` against the local head. If the human has not pushed before the hard stop, the check is listed as **not done** | `.claude/settings.local.json` deny list; Y §S4 Acceptance |
| D4-03 | Anonymous GitHub API | Read-only anonymous requests to `api.github.com` (repo visibility, licence) are allowed; no token is used or stored | Y §S4 Acceptance |
| D4-04 | Final head vs accepted candidate | Evidence-only commits after the accepted candidate are allowed; the auditor states the product tree of the accepted candidate and confirms later commits touch only `evidence/` (and the redaction of S4-12 if it lands after) | X §ACCEPTANCE |

## Items carried from Stage 3 into the delivery (each must appear, accurately, in README limitations / METRICS / REPORT as stated)

| ID | Source | Obligation | Owner |
|---|---|---|---|
| S4-15 | Auditor O3-02 (msg c613a03b, 6e4c01d3) | State that the model sometimes returns a CEV with a **decimal comma and no unit**; it appeared in both real runs on a different case each time (implementer run cg-028, auditor run cg-004) and was always caught by the channel check (⇒ review) | implementer |
| S4-16 | Auditor O3-04 | The landing figures and METRICS name the **run that produced them** (implementer evaluation run, candidate/commit and prompt SHA) and mention the auditor's **independent second run** with its own figures (FC-broad 0/18, FC-strict 0/6, caught 6/6, 26/27 as expected, mean 77.1 s, 0.00020863 reported cost/cert) | implementer |
| S4-17 | R3.3 C-23 | Limitation: on the ambiguous scan cg-003 the model reads the smudged ReH confidently as 338 (true 358); the product proposes **block**, never release, and requires human confirmation; the story card shows what the recorded run shows | implementer |
| S4-18 | R3.1 C-04 | Limitation / deviation: **no model-written explanation** in this build (deviation from 03-DISENO step 7), chosen to protect I1; the case file shows deterministic rule reasons | implementer |
| S4-19 | A-16 / auditor msg 3ca000f7 | Limitation: a hostile duplicate field in the text layer turns a would-be block into review (cg-022), never release | implementer |
| S4-20 | Dispatch 2 §OPEN; S3-23, S3-24 | Limitations: OI-S2-01 (live limit per instance, with measured consequence) and OI-S2-02 (deployed live path: as implemented — e.g. live reading unavailable on Vercel, live demo from the container) stated exactly as the accepted code behaves | implementer |
| S4-21 | Adversary observations msg 7d0d6556 | Prompt examples reuse cg-001 values ("0.16", "392", "QA-07") — cg-001 is a tuning/story case outside the evaluation; state it. The stale "text layer" comment in `live-reader.ts` may be fixed in Stage 4 (code-comment-only change) | implementer |
| S4-22 | Auditor O3-03 | `/favicon.ico` returns 404: fix (static asset) or list as known cosmetic issue | implementer |
| S4-23 | Shared service (Y §RUN) | README states the shared-service limits observed (≈20–30 rpm, 8 concurrent, daily cap 1 USD of free credits, 429/504/timeouts seen by the human; 0 retries/failures in the band's two evaluation runs) and that inputs are retained by the provider ~2 days, so only synthetic data may be sent | implementer |

Any product-code change in Stage 4 (beyond docs, comments, static favicon) requires the auditor to re-verify the affected Stage 1–3 obligations; prefer docs-only changes.
### R4.1 amendment

| ID | Answers | Amendment |
|---|---|---|
| E-01 | Implementer msg 8f4f9e61 — option (b), amends S4-16 | The **landing** must name the run that produced its figures (already true: run `real-candidate-dd557fd`, candidate, run time, from `public/figures.json`). The **auditor's independent second run** is stated in **METRICS.md and README**, not on the landing. No product change for this. Not a known gap: the dispatch requires the landing figures to come from the evaluation artifacts with denominators, which they do |
### R4.2 amendment (rulings on auditor testability review msg 13bfa92b)

| ID | Item | Ruling |
|---|---|---|
| E-02 | T4-01 real-mode README commands | **Granted:** one short endpoint lease for the auditor, **GET /models and GET /usage only (≈ 4 calls), no reading**, to verify the container starts in real mode with the variables set, `/health` and the F1 route behave as documented, and no reading is made. Taken and released in the room per D3-02 |
| E-03 | T4-02, T4-03, T4-04, T4-05, T4-09, T4-10 | Auditor's stated pass/fail rules adopted as written (DEPLOY.md duration consistent with `vercel.json` 300 s, cited doc and C-07 budget; capability-sentence extraction; history check; secrets scope incl. all reachable blobs, built `dist/`, image filesystem and evidence, `LIVE_ACCESS_CODE` not settable on this host stated as a limitation; Vercel asset rule; README demo procedure at 375/1280 in mock mode) |
| E-04 | T4-06 local paths | Only **user-profile paths** (`C:\Users\…`, `C:/Users/…`) are findings; workspace paths (`C:\nexus\dev\…`, named by the dispatches) are not |
| E-05 | T4-07 (= E-01) | Landing unchanged. METRICS.md names **both runs** with candidate commit and prompt SHA; the auditor-run figures in METRICS are **generated from the auditor's committed artifacts** (`stage-3/auditor/candidate-3/real-run/eval-retry1/`), never typed |
| E-06 | T4-08 favicon | Adding `public/favicon.ico` is a product change: allowed only with the auditor's re-run (suite in image, browser console without 404). If the implementer prefers docs-only, S4-22 is satisfied by listing the 404 as a known cosmetic issue |