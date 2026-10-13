# Final report — run certgate-001, dispatch 2 (Stages 3 and 4)

Author: analyst-xwz3 (Claude Code, model `claude-opus-5-5`). Room `3e47b667-b685-4655-8f34-cc0dad08ab30`. Dispatch 2: room msg `7e4ee02a-7ff6-4133-9c36-ce5d92e3870e` (from hugo.valer), received 2026-10-13T16:54Z; verbatim copy `evidence/runs/certgate-001/DISPATCH-2.txt`.

Internal band acceptance only. No external evaluation has taken place. The band did not deploy, did not push and did not submit.

## 1. Outcome

| Stage | Accepted candidate | Product tree | Auditor verdict | Repair cycles | Checkpoint |
|---|---|---|---|---|---|
| 3 — real reading on AMD Token Factory | `5c904693423574846e17994331a628cc06d735ef` | `1ed386fd25d993f1d37b823eadddfa7040b19dae` | ACCEPTED, record `stage-3/auditor/VERDICT-S3-candidate-4.md` (commit 4a6f28c, SHA-256 348ac231…5773) | 3 of 5 | `6e4c01d3` |
| 4 — delivery | `b0ec67a663d1caeb9496ff4b75bec163c837d0b3` | `8688691982ba6e211bd55374743dab8c21161749` | ACCEPTED, record `stage-4/auditor/VERDICT-S4-candidate-5.md` (commit 6af4903, SHA-256 3df08447…f13f) | 4 of 5 | `afb6dc7f` |

Candidates that were rejected or superseded, all preserved:

| Stage | Candidate | Status | Reason |
|---|---|---|---|
| 3 | `0a40432c` | Superseded before verdict | **F3-01**: the evaluation receipts said the endpoint was "off" for live readings |
| 3 | `e4132c51` | Superseded | **ADV-S3-F01**: the S3M06 mutant ("JSON repaired by guessing") survived the suite |
| 3 | `a892f771` | REJECTED (record 1f22f7f) | **F3-02 = ADV-S3-F02**: the S2M02br mutant (" · not live" dropped from the story label) survived |
| 4 | `02c5c36b` | REJECTED (record 67c5093) | **F4-01**: seven capability sentences had no claims-table row; three of them were untested. The adversary also had 9 surviving mutants (ADV-S4-F01…F05): figures outside the table, claim–row ties, secret shapes, provenance facts and a /health configuration |
| 4 | `ac738ef3` | Superseded before verdict | C-15 wording true only with the endpoint on |
| 4 | `a130bbf4` | REJECTED (record 8210d06) | **F4-02 = ADV-S4-F06**: claims in headings and fenced-code comments (S4M23, S4M24) survived |
| 4 | `c5769948` | REJECTED (record 7694541) | **F4-03 = ADV-S4-F07**: claims in trailing comments and in `text` fences (S4M25, S4M26) survived; fixed by the fail-closed unit rule (register E-11) |

**Final commit and tree.** The accepted product is `b0ec67a6` (tree `86886919…`). The evidence head at the time of the push request is `77ce975061e4e4205da4c1001395591d5b83b315` (tree `06d8c9313abd4965e73ebbab9cf3d3ce686c0fa2`); it differs from `b0ec67a6` only under `evidence/`. This report is one further evidence-only commit, named in its room message.

Since the accepted Stage 3 product (`5c904693`), the product changed only in two places: the `/health` reader field (E-08) and the `#/amd` endpoint-state strings (E-09). There are also two comment-only hunks. The reading path, the prompt (SHA-256 `32fad2f9…c567`), the rules, the data, the packaging and `vercel.json` are byte-identical.

## 2. AMD evidence (what ran where)

- **Endpoint:** AMD Token Factory, the event's AMD compute (dispatch 2; event page quoted in the planning workspace 01-REGLAS "Reglas vigentes"). Host `developer.amd.com.cn`, OpenAI-compatible.
- **Model:** `MODEL_ID = Qwen3.8-27B`. The endpoint reports it as `self-dploy/Qwen3.8-27B`. Its publisher and licence are recorded in the repository from the publisher's page (S3-21).
- **Not exposed by the endpoint:** GPU, ROCm and vLLM versions. The band claims none of them.
- **What the model does:** it reads the page images into the Certificate contract, with a source location per value. It never decides and is never asked for an explanation (C-04). Proposals come only from the deterministic rules (I1). The text layer is a model-free second channel (C-01).
- **Implementer evaluation run** (candidate `dd557fd`, reading path identical by diff to `5c904693`, prompt SHA-256 `32fad2f9…c567`), 27 cases cg-004…030, 2026-10-13 17:28–17:49Z:
  - **FC-broad 0/18, FC-strict 0/6**;
  - non-conformities caught **6/6**, all blocked;
  - proposals as expected 27/27;
  - failures 0/27, retries 0;
  - fields 591/594 correct; the cg-028 CEV was value right (decimal comma), unit missing, caught by the text layer, so review;
  - mean 89.6 s per certificate (median 80.6 s);
  - mean reported cost 0.00020529 per certificate (**Token Factory credits are free and have no monetary value**);
  - GET /usage delta equals the sum of per-reply costs.
- **Auditor's independent run** on `a892f771` (product byte-identical to `5c904693`), 2026-10-13 19:13–19:31Z:
  - **FC-broad 0/18, FC-strict 0/6**;
  - caught **6/6**;
  - proposals as expected 26/27; cg-004 was review because of a decimal comma with no unit, caught by the channel check, which is more cautious and explained;
  - rule abstention 13/27;
  - failures 0, retries 0;
  - mean 77.1 s per certificate;
  - mean reported cost 0.00020863 per certificate (free credits);
  - the /usage delta reconciles.
- **Usage headroom** at the last reading (GET /usage): 0.98234 of a 1 USD daily limit remaining (free credits).
- **Stories** (cg-001 release, cg-002 block, cg-003 block) were recorded from real runs and reproduced by the auditor. On cg-003 the model reads the smudged ReH confidently as 338 (true 358) in every completed run, so the rules propose **block**, never release; a person must confirm (C-23).

## 3. Coverage

### Acceptance matrix C1–C14 with real reading (Stage 3)

The evaluation set is cg-004…cg-030 (27 cases); cg-001…cg-003 were used for tuning and the stories only (D3-03). Expectations were written by hand and committed before the reader existed (D3-04). Proposals matched the expectations as follows:
- implementer run: **27/27**;
- auditor's independent run: **26/27**. The one difference is cg-004 (C1), which got review instead of release because of a CEV with a decimal comma and no unit. The channel check caught it; the outcome is more cautious, never less (C-12).

Per-case values below are from the auditor's results (`stage-3/auditor/candidate-3/real-run/eval-retry1/results.json`). Where a case's synthetic fault is a mock injection that a real reading does not reproduce (C7, C8, C10 cg-021, C11), the expectation for the real run was written separately, before the run, in `evaluation/expectations-real-run.json` (D3-04).

| Case | Evaluation cases | Expected (source) → auditor's real result | Implementer run |
|---|---|---|---|
| C1 conforming | cg-004 | release → **review** (CEV decimal comma without unit, caught by the channel check) | as expected |
| C2 element over max | cg-005, cg-006, cg-007 | block → block (3/3) | as expected |
| C3 ReH = min | cg-008, cg-009 | release → release (2/2) | as expected |
| C4 heat mismatch | cg-010, cg-011 | review → review (2/2) | as expected |
| C5 wrong grade | cg-012 | block → block | as expected |
| C6 units / scale | cg-013, cg-015; cg-014 control | review, review; release → same | as expected |
| C7 ambiguous scan | cg-016, cg-017 (real-run expectation) | review → review (2/2) | as expected |
| C8 channels disagree | cg-018 (real-run expectation) | release → release. The planted misread is a mock injection; the real model read it correctly. Disagreement handling is proven in the suite and was seen live on the decimal-comma cases | as expected |
| C9 CEV incoherent | cg-019, cg-020 | review, block → same | as expected |
| C10 hostile document | cg-021 (real-run expectation), cg-022 | block, review → same | as expected |
| C11 endpoint failure | cg-023…cg-027 (real-run expectation) | the endpoint did not fail, so 4 release and cg-025 review → same. **Endpoint-failure behaviour was not exercised by the real endpoint** (0 failures, 0 retries); it is proven against the stub over HTTP (429, 5xx, invalid JSON, timeout, huge reply) | as expected |
| C12 isolation | — | proven by the suite (consecutive cases, both orders); not a separate real-run case | — |
| C13 missing stamp | cg-028 | review → review | as expected (the CEV unit was missing, but the result was still review) |
| C14 Evolus | — | **N/A**: Evolus out of scope | not a pass |

Also run: cg-029 (KV test temperature) and cg-030 (certificate type 3.1), both review, as expected in both runs.

**Critical metric:** false conforming, broad **0/18** and strict **0/6**, in both runs. Non-conformities caught: **6/6**, all blocked.

### Invariants I1–I7 on the accepted product

| Invariant | Status | Basis |
|---|---|---|
| I1 rules decide | holds | Proposals come only from the deterministic rules. The model is never asked for an explanation (C-04). Release is rejected in core, API and CLI when the proposal is not release |
| I2 unknown, never invented | holds | Per field, 591/594 correct in each run; 0 invented and 0 confident-on-illegible in the auditor's recomputation. The cg-003 confident misread is caught by the rule for scans with critical fields, never by the model's confidence |
| I3 two channels | holds with the real model | Text layer read without a model; disagreements shown side by side; the decimal-comma cases went to review |
| I4 exact decimals | holds | Unchanged since Stage 1; the float mutants stay killed |
| I5 no release on listed conditions | holds | 0/18 false conforming in both real runs |
| I6 no secrets | holds | 0 real-value matches across history, the tree at head, `dist/`, the image filesystem and the evidence. Only the host name appears. The room history cannot be scanned (no export tool), as in dispatch 1 |
| I7 stored never shown as live | holds | All 27 receipts per run say `reading_source: live`, and the runner imports only the live reader. Stories are labelled as recorded, with their date. F1 values come from the endpoint, and GPU/ROCm/vLLM show "not exposed by the endpoint" |

### Stage 4 delivery rows (dispatch 2, Stage 4 → Acceptance; register R4.0–R4.8), from the auditor's record

| Row | Status |
|---|---|
| S4-01 README runs from a clean clone (mock); S4-02 DEPLOY.md | pass. Real mode was checked through the auditor's GET-only lease (E-02): 6 GETs, 0 readings, 0 cost |
| S4-03 METRICS generated, equal to independent recomputation of both runs | pass |
| S4-04 EVIDENCE-INDEX; S4-05 claims table | pass. 68 rows and 145 proofs; the fail-closed sentence map has 401 units, with 0 unmapped and 0 stale |
| S4-06 repository public, licence MIT (anonymous GitHub API) | pass |
| S4-07 history after kickoff | pass (first commit 16:45:45Z on 2026-10-12) |
| S4-07 remote head = local head | **open, not done**. It waits for the human's push (request msg eaa4ed50) |
| S4-08 browser 375/1280 in mock, `VERCEL=1` and real shapes | pass |
| S4-09 no secret | pass |
| S4-10 Vercel URL | **not done**: no URL reported |
| S4-11 no claim of deployment, submission, video, slides, form or prize | pass. The forbidden-claim grep at head returns 0 |
| S4-12 no user-profile path at head | pass (prose and regex patterns only) |
| S4-13 this report | to be verified by the auditor |
| S4-14 mutation check | pass (section 4) |
| S4-15…S4-23 carried items | stated in README and limitations (section 5) |

## 4. Mutation results

- **Stage 3, accepted candidate:** S3M01–S3M12 all killed. The Stage 2 and Stage 1 lists were killed, re-based where the code had moved. The re-based list scored 16/16, with 0 survivors (adversary report `MUTATION-5c90469.md`, SHA-256 9b957a54…3a). The auditor re-applied S3M06 and S2M02br itself.
- **Stage 4, accepted candidate `b0ec67a6`:**
  - The adversary's set has **38/38 killed**. It covers S4M01–S4M26 (hard-coded figures, unsupported claims, secret shapes, provenance facts, /health configuration, hosted-demo wording, claims hidden in headings, comments, trailing comments and `text` fences) and nine paraphrased hiding-place probes S4M27–S4M35 (JSON fence, indented code, HTML comments, table row and cell, alt text, `<details>` and blockquote).
  - The auditor re-applied **22 mutants and probes, all killed**, including its own HTML-comment, indented-code, table-cell, JSON-fence and plain-sentence probes, plus S2M02br and S3M06.
  - The Stage 1–3 lists carry forward, because the product is identical to candidate 1 and its E-08/E-09 changes have their own killed mutants (S4M01, S4M03, S4M04).
- **Stage 4 history:** survivors drove each repair:
  - candidate 1: 9 of 25;
  - candidate 3: S4M23 and S4M24;
  - candidate 4: S4M25 and S4M26.

  Branches are kept unmerged in the seats' clones (`adv-mut/<candidate>/*`, `impl-mut/*`).

## 5. Open issues, limitations, interventions

**Product limitations.** Each is stated in the README and has a row in the Stage 4 register.
- **Decimal comma without a unit (S4-15):** the model sometimes returns the CEV with a decimal comma and no unit. This happened once in each real run, on a different case each time (cg-028 in the implementer run, cg-004 in the auditor run). The channel check always caught it, giving review.
- **cg-003 (S4-17, C-23):** the model reads the smudged ReH confidently as 338; the true value is 358. The product proposes **block**, never release, and a person must confirm. This was not tuned away.
- **No model-written explanation (S4-18, C-04):** this is a deliberate deviation from 03-DISENO step 7, made to protect I1. The case file shows the deterministic rule reasons instead.
- **cg-022 (S4-19):** a hostile duplicate field in the text layer turns a would-be block into review, never release.
- **OI-S2-01 and OI-S2-02 (S4-20):** the live limit is per instance. Live reading is unavailable on the deployed site; the live demo runs from the container.
- **Prompt examples (S4-21):** the examples reuse cg-001 values ("0.16", "392", "QA-07"). cg-001 is a tuning and story case outside the evaluation set.
- **Favicon (S4-22):** `/favicon.ico` returns 404, a known cosmetic issue.
- **Shared service (S4-23):** about 20–30 requests per minute and 8 concurrent requests, with a daily cap of 1 USD of free credits. The provider retains inputs for about 2 days, so only synthetic data was sent.
- **Evaluation scope (D3-03):** the evaluation covers 27 synthetic cases, cg-004…030. cg-001…003 were used for tuning only. No real certificate was read.
- **Not claimed:** GPU, ROCm and vLLM versions are not exposed by the endpoint.

**Process incidents and interventions.**
- **Host memory, Stage 3 (about 19:03Z):** the auditor's evaluation run was killed. Analyst blocker record: `stage-3/analyst/BLOCKER-host-memory-1906Z.md`. A llama-server process (about 7.1 GB) and sonarqube-mcp containers that were not the band's were resident. The operator gave a go in the auditor's window at about 19:13Z, as the auditor reported. That human action took place outside the room, and the run then completed. An earlier operator go in Stage 2 is recorded in the dispatch-1 final report.
- **Stage 3 logs:** the implementer's 16 Stage 3 `.log` files had been skipped by `.gitignore`. They were force-added unchanged in 39bf3e3, with LOGS.sha256. The auditor's acceptance did not rest on them.
- **Wrong-seat commit:** the analyst once committed the auditor's ENDPOINT-CHECK file (Stage 3). This was acknowledged, and since then the analyst commits only its own paths.
- **E-07:** the operator's name and e-mail were redacted from the stage-1 registers in 3daf0791. This includes the R1.0 copy, which is therefore no longer byte-exact; the original remains in history at 6e92e827. DISPATCH-2.txt line 25 keeps the human's verbatim quote as a quoted pattern, with the auditor's agreement. The analyst also redacted user paths in its own SOURCE-DRIFT diff (91fb287f).
- **Docker image:** 12 documentation tests are skipped in the image, because the image contains no docs. They are recorded as "not run in image"; the suite of record is the clean clone.
- **GET /usage:** the counter can lag a reading. The deltas reconcile after the run completes.
- **Listener:** the analyst's listener failed once because the daemon was busy. The infrastructure retry succeeded.

**Not tested** (from each seat's records):
- **No deployed site exists,** so nothing was tested on Vercel; S4-10 is not done.
- **Real-mode README commands** were checked statically, plus the auditor's GET-only lease. No reading was made in Stage 4.
- The adversary and auditor did not re-run Docker or the browser on candidates 2–5; the product is unchanged since candidate 1, where both passed.
- **No product mutants beyond the Stage 1–3 lists** and the E-08/E-09 mutants.
- **`LIVE_ACCESS_CODE`** is not set on this host, so its value could not be scanned for.
- **Room-history secret scan:** not possible (no export tool).
- **The deadline question** (dispatch 2) is left to the human.

## 6. Time and usage

| | Start (UTC) | End (UTC) | Wall clock | Limit |
|---|---|---|---|---|
| Stage 3 | 16:54Z (dispatch 2 received) | ~20:01Z (acceptance) | ~187 min | 360 min |
| Stage 4 | ~20:01Z | ~22:20Z (acceptance) | ~139 min | 300 min |
| Dispatch 2, received → this report | 16:54Z | ~22:25Z (report committed) | ~331 min | 660 min (run total ends 03:54Z on 2026-10-14; hard stop 2026-10-17T18:00Z) |

- **Repair cycles:** Stage 3 used 3 of 5; Stage 4 used 4 of 5.
- **Infrastructure retries:**
  - Stage 3: the auditor's real evaluation was stopped by the host for low memory and re-run (retry 1 of 2) after the operator's go.
  - The analyst's listener failed once (daemon busy); the retry succeeded.
- **Endpoint usage (AMD Token Factory, GET /usage and per-reply cost):**
  - implementer evaluation run: mean 0.00020529 per certificate × 27;
  - auditor evaluation run: delta 0.0056331242, against a sum of replies of 0.0056331226, 27 requests;
  - the stories and tuning readings cost more;
  - remaining headroom at the last reading: 0.98234 of the 1 USD daily limit.

  **Token Factory credits are free and have no monetary value.**

  The auditor's Stage 4 real-mode check made 6 GETs and 0 readings (cost delta 0).
- **Seat usage (Claude):** `band usage agents` at 2026-10-13T22:22:11Z (`final/band-usage-agents-dispatch2.txt`). It now attributes the seats. The figures are cumulative per seat session since the seat was created, so **they include dispatch 1**. The meter's last activity is ~20:15Z, so **later work is missing**. They are list-price estimates, not a bill.

  | Seat | Tokens | Estimate (list price) |
  |---|---|---|
  | implementer-xwz4 | 389,316,244 | $101.50 |
  | auditor-xwz6 | 362,661,557 | $89.66 |
  | adversary-xwz5 | 305,822,251 | $76.97 |
  | analyst-xwz3 | 319,006,106 | $76.00 |

  A per-dispatch split is not available. No financial cap was configured (dispatch 1).
- **Models:** all four seats `claude-opus-5-5`; reader model `Qwen3.8-27B`, reported by the endpoint as `self-dploy/Qwen3.8-27B`.

## 7. Deployment status and audit

- **Deployment: not done by the band.** The band never deploys. No Vercel URL has been reported, so S4-10 is **not done**.
- `DEPLOY.md` gives the steps. **Do not set `MODEL_BASE_URL`, `MODEL_API_KEY` or `MODEL_ID` on Vercel** (F-05). On the deployed site, live reading is unavailable by design, F1 honestly shows "off", and judge mode serves the recorded stories.
- The DEPLOY.md checks pass in the `VERCEL=1` container shape (C-46).
- **Push: not done by the band.** No seat can push on this host. The push request names `77ce975061e4e4205da4c1001395591d5b83b315` (msg eaa4ed50).
- At the time of writing, GitHub `main` is `e90fe2c`, which is the dispatch 1 report. S4-07 "remote head = local head" is **open**. The auditor checks it with `git ls-remote` after the push.
- **Audit already done:** the repository is public, the detected licence is MIT (anonymous API), and history starts after the kickoff.

## 8. What the human must still do before 2026-10-18T10:00:00Z (12:00 Madrid)

The band did not submit anything and claims no submission.
1. **Push** `77ce975061e4e4205da4c1001395591d5b83b315` to `main`, then push the later commit that adds this report (fast-forward):
   `git -C C:\nexus\dev\certgate push origin <commit>:main`
   If GitHub push protection flags `sk-proj-Ab12…` in the committed mutant logs, allow it. It is a fake test value (O4-03), not a credential.
2. **Deploy on Vercel** per `DEPLOY.md`, **without any `MODEL_*` variable**. Then open the site in judge mode and run the DEPLOY.md checks. Post the URL in the room before 2026-10-17T18:00Z if you want the auditor's S4-10 check.
3. **Video (MP4)** of the demo. Use the recorded stories and/or the container's live reading, and label each as what it is.
4. **Slides (PDF).**
5. **Cover image, 16:9.**
6. **lablab.ai submission form**, track Intelligent Industry. Use the repository URL, and the deployed URL if there is one.
7. **Final check of the deadline question:** confirm the exact submission deadline and time zone on the event page. This report plans against 2026-10-18T10:00:00Z (12:00 Madrid) as the dispatch states.
8. Optional: the known cosmetic `/favicon.ico` 404.

## 9. Key room references

- Dispatch 2: `7e4ee02a`.
- Stage 3: acceptance `6e4c01d3`; rejection of a892f771 recorded in 1f22f7f.
- Stage 4 handoff: R4.0 1024f791.
- Stage 4 rejections: `d24985d8` (F4-01), `9c8aec11` (F4-02), `57075296` (F4-03).
- Adversary bundles: `646f4b1f`, `1bdea91b`, `5de8156c`, `fbbadc96`.
- Stage 4 acceptance: `afb6dc7f`.
- Push request: `eaa4ed50`.
- Analyst logs: `stage-3/analyst/`, `stage-4/analyst/LOG.md`, `STAGE-REGISTER.md`.

## 10. Checks applied to this report (F-06, F-07, I6)

- **Forbidden-claim patterns:** the patterns of `test/docs.test.ts` (F-06 and E-10), applied to this file, give **0 matches**.
- **User-profile paths:** **0**.
- **Secrets:** the report and `band-usage-agents-dispatch2.txt` were compared against the host's `MODEL_API_KEY` and `MODEL_BASE_URL` values, counting matches only. **Both give 0.** Only the host name appears.

## 11. Corrections after auditor verification (msg 24722863, record `stage-4/auditor/FINAL-REPORT-VERIFICATION.md`, commit af88607)

- **C1 (section 4):** the adversary report `MUTATION-5c90469.md` has SHA-256 `9b957a54…4a43`, not `9b957a54…3a` as written above. The value is the auditor's; the file is in the adversary's clone, not in this repository, so the analyst could not re-hash it. Section 4 is left as written; this note corrects it, and earlier text is not rewritten.

Everything else was verified by the auditor as written.
