# Final report addendum — run certgate-001, dispatch 3 (Stage 5, Gemma comparison)

- **Author:** analyst-xwz3 (Claude Code, model `claude-opus-5-5`).
- **Room:** `3e47b667-b685-4655-8f34-cc0dad08ab30`.
- **Dispatch 3:** room msg `82f82e5e-b831-462a-8a4a-51dd02532237` (from hugo.valer), received 2026-10-14T10:40Z; verbatim copy `evidence/runs/certgate-001/DISPATCH-3.txt`.
- **Shape:** this addendum follows the shape of `final/FINAL-REPORT-DISPATCH-2.md`, which stays in force for Stages 3 and 4.

Internal band acceptance only. No external evaluation has taken place. The band did not deploy, did not push and did not submit. CertGate makes no claim of winning, entering or qualifying for any prize.

## 1. Outcome

| Stage | Accepted candidate | Product tree | Auditor verdict | Repair cycles | Checkpoint |
|---|---|---|---|---|---|
| 5 — Gemma comparison | `409fb69a8e538efadbf2687862e39e384b73d92b` | `b030c6de0ab78540f3f021c46b9b7a92c3d2a294` | ACCEPTED, record `stage-5/auditor/VERDICT-S5-candidate-3.md` (commit d44be28, SHA-256 9ab37772…a1d5) | 2 of 3 | `47316d66` |

Candidates that were rejected, all preserved:

| Candidate | Status | Reason |
|---|---|---|
| `ddb75eca` | REJECTED (record 4eed261) | **F5-01 = ADV-S5-F01**: README prize claims survived the suite. The cause was a negation word elsewhere in the clause, or a word missing from the list ("won", "finalist", "placed first"). **F5-02**: the receipt `model_id` was not checked |
| `a848dfae` | REJECTED (record 7919e26); the analyst had already marked it superseded before the verdict, as the same cycle | It was frozen against the first, narrower repair note. F5-01 and F5-02 were still open. It was repaired by the fail-closed prize check E-17/E-18/E-19 |

**Product change vs the accepted Stage 4 product `b0ec67a6`:** only `vercel.json`. Its `includeFiles` gains `node_modules/pdfjs-dist` (E-15, the operator-authorised deployment fix; section 4). Everything else is byte-identical, checked by a test against the b0ec67a6 blob ids:
- `src/`, `public/` (landing figures and stories), `api/`, `data/`, `config/`;
- the package files and the Dockerfile;
- the expectations;
- the Qwen run artifacts.

The reading path, the prompt (SHA-256 `32fad2f9…c567`) and the Qwen request are unchanged; a golden-hash test guards the request. **Qwen3.8-27B remains the product model.** The landing figures, the stories and the deployed site use only Qwen.

## 2. AMD evidence for the Gemma runs

- **Endpoint and model:** AMD Token Factory, the same endpoint as Stage 3 (host `developer.amd.com.cn`). Requested `MODEL_ID=Gemma-4-31B-IT`, set only in the environment of each evaluation command; the user-level MODEL_ID stayed `Qwen3.8-27B`. Every reply reported `self-dploy/Gemma-4-31B-IT`, with `finish_reason` `stop`.
- **Request shape actually sent (G-03):**
  - It is the same builder as Qwen; only `model` differs.
  - The body is `temperature: 0`, `max_tokens: 16384`, `response_format: {"type":"json_object"}`, the frozen system prompt and page images.
  - No thinking or reasoning control was sent. No parameter was rejected, so S5-02 needed no change.
  - The auditor confirmed with a capture stub, without endpoint calls, that the Gemma and Qwen bodies differ only in `model`, and that the Qwen body is byte-identical to the one built at the earlier commit.
- **Run of record (G-02):** the implementer's `evaluation/runs/real-gemma-04100b9`, 2026-10-14 10:47:17–10:55:09Z, from head 04100b9 (product identical to b0ec67a6). It was the first and only run, with no per-case re-run and no infrastructure re-run. It covered 27 of 27 cases at concurrency 2.
  - **Lease calls:** 32, made up of 27 readings, 1 optional cg-003 reading and 4 GET /usage. 0 retries, 0 errors.
  - **GET /usage:** `daily_cost_used` went 0.017769629 → 0.019872587 over the run. The delta of 0.00210296 equals the 27 per-reply costs, with a difference of 0. The cg-003 reading added 0.00007580, equal to its reply cost.
- **Auditor's independent run (S5-13):** a clean clone at 04100b93, made after the implementer released the lease.
  - All 27 replies reported `self-dploy/Gemma-4-31B-IT`. There were 0 retries and 0 failures.
  - It matches the run of record case by case: 0 proposal differences and 0 field differences.
  - Mean time was 35.1 s per certificate, and mean cost 0.00006653.
  - The /usage delta was 0.0017963741 over 27 requests, equal to the sum of the replies (difference −1.6e-9).
  - Headroom afterwards was 0.97826 of 1.
- **Credits:** Token Factory credits are free and have no monetary value.
- **Not exposed by the endpoint:** GPU, ROCm and vLLM versions. None is claimed.
- **Gemma publisher and licence, as published by the publisher:** Google DeepMind's model card (https://huggingface.co/google/gemma-4-31b-it, retrieved 2026-10-14) states `license: apache-2.0`, with `license_link` https://ai.google.dev/gemma/docs/gemma_4_license. Recorded in `docs/sources/gemma.md`; the auditor checked it against the card fetched at 11:23:52Z.

## 3. Comparison (from METRICS.md at the accepted candidate; generated from the committed artifacts)

| Metric | Qwen3.8-27B, implementer run | Qwen3.8-27B, auditor run | Gemma-4-31B-IT, run of record |
|---|---|---|---|
| **False conforming, broad** | **0 / 18** | **0 / 18** | **0 / 18** |
| False conforming, strict | 0 / 6 | 0 / 6 | 0 / 6 |
| Non-conformities caught (not released) | 6 / 6 | 6 / 6 | 6 / 6 |
| … of which proposed block | 6 / 6 | 6 / 6 | 5 / 6 |
| Proposal equal to expected | 27 / 27 | 26 / 27 | 26 / 27 |
| Rule abstention | 12 / 27 | 13 / 27 | 13 / 27 |
| Failures · requests · retries | 0 / 27 · 27 · 0 | 0 / 27 · 27 · 0 | 0 / 27 · 27 · 0 |
| Fields correct | 591 / 594 | 591 / 594 | 591 / 594 |
| Fields wrong | 1 / 594 | 1 / 594 | 0 / 594 |
| Fields invented | 0 / 594 | 0 / 594 | 0 / 594 |
| Fields confident on illegible | 0 / 594 | 0 / 594 | **1 / 594** |
| Seconds per certificate (mean · median) | 89.6 · 80.6 | 77.1 · 76.9 | 34.5 · 30 |
| Tokens per certificate (total mean) | 4234 | 4211 | 2003 |
| Cost per certificate (mean, as reported; free credits) | 0.00020529 | 0.00020863 | 0.00007789 |

**Fields not read correctly**, as listed by the generator:
- **Qwen implementer:** cg-028 `cev_printed` was read `0,41` (decimal comma, no unit); the case went to review.
- **Qwen auditor:** cg-004 `cev_printed` was read `0,39`, with the same pattern; the case went to review.
- **Gemma:**
  - cg-017 `heat_or_lot` was confidently read as `24-73269`, where the correct reading is illegible. The case was proposed review (no second channel).
  - cg-021 `chemistry.Si` was returned as absent, where the text layer reads 0.62 % (limit 0.55 %). The channels disagreed, so the proposal was review instead of block, never release.

**Per-case proposal differences vs Qwen:** cg-004 and cg-021, both generated and checked by a test.
- **cg-004:** Gemma and the Qwen implementer run proposed release; the Qwen auditor run proposed review.
- **cg-021:** both Qwen runs proposed block; Gemma proposed review.

**Gemma false conforming:** none, so no root-cause line is owed. The generator writes one for any false conforming, and a test covers it on a synthetic case.

**cg-003, evidence only:** one Gemma reading, kept outside the evaluation and the demo. Gemma read the smudged ReH confidently as 338 MPa, as the recorded Qwen story reading does, so the proposal was block, not release.

**Timing:** the runs were made at different times on a shared service. The seconds compare runs, not models (G-08).

## 4. Deployment fix (operator-authorised, E-15/E-16)

- **Fault and authorisation:** the operator reported that a Vercel deployment from `main` 05103af answered 200 for static files but **500 FUNCTION_INVOCATION_FAILED** on every function route ("Cannot find module 'pdfjs-dist/package.json'"). At about 11:02Z, in the analyst's own window (outside the room), the operator authorised one scoped fix. The verbatim text is in `stage-5/OPERATOR-DEPLOY-FIX-AUTHORISATION.txt`; it was relayed to the room in msg 1fa0d0ec.
- **Fix (E-15):** the analyst chose the `vercel.json` option. The function's `includeFiles` gains `node_modules/pdfjs-dist`, with `src/` unchanged. Two tests guard it: the include is present, and `vercel.json` differs from b0ec67a6 only in that value.
- **Bundle simulation (E-16):** run by both the adversary and the auditor.
  - Without `pdfjs-dist`, the function fails at load with the operator's error.
  - With it, `/health`, `/api/f1`, `/api/live/status` and the cg-003 story evaluation all answer 200, with the endpoint off and live reading unavailable. `/api/live/read` answers 503, as DEPLOY.md states.
  - `@napi-rs/canvas` is not needed.
- **Live check: NOT DONE.** This is a simulation, not Vercel itself. S4-10 stays **not done** until the human pushes the commit named in section 6, Vercel redeploys, and the auditor's DEPLOY.md checks against the live URL pass. The auditor recorded a pre-fix baseline of the live URL with plain GETs: static files 200 with matching hashes, functions 500.

## 5. Open issues, limitations and interventions

- **Facts reported by the operator, not observed by the band (G-12):**
  - the Gemma service fault of 2026-10-13 (degenerate output);
  - the re-test of 2026-10-14 10:27–10:31Z;
  - the three-certificate observations in dispatch 3 (a one-column chemistry shift on a scan, ReH 338).

  In the band's 27-case runs Gemma showed no column shift. Its one confident value on an illegible field was cg-017.
- **Operator interventions outside the room:** the Vercel fault report and the fix authorisation, at about 11:02Z in the analyst's window, relayed verbatim.
- **Limits of the prize check:**
  - **O5-03:** the prize check is a word list that fails closed. Its residual limit is wording with no listed word, for example "the obvious pick for the Gemma judges", "a prizewinning tool", "took first place" or "earned a trophy", and split words.
  - **O5-04:** invisible characters or markup that the normalisation does not strip get past it: a soft hyphen, a word joiner, an HTML numeric entity, inline tags.
  - **Barrier for both:** the fail-closed claims map, whose entries the auditor and adversary review. Today the documents contain no such sentence. A tests-only hardening is suggested for later.
- **O5-05:** `public/stories/*.json` is not read by the prize check. It is guarded by the byte-identity test instead.
- **O5-01:** an old local scratchpad path stays in the history blob of 2566cc8. It was removed at head in b93b237; history is not rewritten. It is not a secret.
- **Analyst process errors, each corrected in a new commit:**
  - three log rows were first written with estimated times later than the clock;
  - a register edit introduced stray control bytes in a regex;
  - a first draft of the word list would have matched "window".
- **Not tested:**
  - the live Vercel URL (section 4);
  - Gemma beyond these 27 synthetic cases;
  - product mutants beyond the Stage 1–4 lists, since the product is unchanged.

  As in dispatch 2, the room history cannot be scanned for secrets (no export tool).

## 6. Time, usage, final commit and push request

| | Start (UTC) | End (UTC) | Wall clock | Limit |
|---|---|---|---|---|
| Stage 5 | 10:41Z, 2026-10-14 (dispatch 3 received) | ~12:25Z (acceptance) | ~104 min | 240 min |

- **Repair cycles:** 2 of 3. **Infrastructure retries:** 0.
- **Endpoint usage, Stage 5:**
  - implementer lease: 32 calls, 0.00217876 reported cost;
  - auditor lease: 27 readings plus GETs, 0.0017963741 reported cost.

  Free credits, with no monetary value.
- **Seat usage (Claude):** `band usage agents` at 2026-10-14T12:27:15Z, saved as `final/band-usage-agents-dispatch3.txt`. The figures are cumulative since each seat was created, so they include dispatches 1 and 2. The meter's last activity is ~07:5xZ, so most of Stage 5 is **not yet counted**. They are list-price estimates, not a bill.

  | Seat | Tokens | Estimate |
  |---|---|---|
  | implementer-xwz4 | 552,748,004 | $139.54 |
  | auditor-xwz6 | 519,073,395 | $125.58 |
  | adversary-xwz5 | 456,953,306 | $111.29 |
  | analyst-xwz3 | 437,781,546 | $103.16 |

- **Final commit and push request:** named in the room message that posts this addendum after the auditor's verification. It is a fast-forward from the public head `05103af`, and the band never pushes.
  - After the push, Vercel redeploys automatically. The auditor then runs the DEPLOY.md checks on the live URL (S4-10).
  - Any later evidence commits can be pushed the same way.

The human's remaining to-do list from `FINAL-REPORT-DISPATCH-2.md` §8 is unchanged, except that the Vercel deployment exists and needs only the push of the fix:
- video MP4;
- slides PDF;
- 16:9 cover;
- lablab submission form;
- final check of the deadline question.
