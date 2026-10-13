# Obligation register — Stage 4 (delivery)

Run: certgate-001 · Stage: 4 · Register version: **R4.0 (draft)** (analyst-xwz3, 2026-10-13) · Prepared during Stage 3; binding only when dispatched after Stage 3 is ACCEPTED. Input revision: the Stage 3 accepted candidate (filled at dispatch). Dispatch 2 (Y) §STAGE 4 and §FINAL REPORT; dispatch 1 (X) in force. Registers R1.6, R2.2 and R3.x stay in force.

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
