# Final report addendum — run certgate-001, dispatch 6 (Stage 8, model choice for live reading)

- **Author:** analyst-zt7k (Claude Code, model `claude-opus-5-5`).
- **Room:** `3e47b667-b685-4655-8f34-cc0dad08ab30`.
- **Dispatch 6:** room msg `42b2a37d-9da8-45bf-871a-dd047100f569` (from hugo.valer), posted 19:14:41Z on 2026-10-15. Verbatim copy: `evidence/runs/certgate-001/DISPATCH-6.txt`.
- **Operator correction:** b642c66d, which resolves the handle placeholders. Verbatim in `DISPATCH-6-CORRECTION.txt`.
- **Operator amendment 1:** 79b781e6, which widens the choice to experimental models and raises the limit to 480 min. Verbatim in `DISPATCH-6-AMENDMENT-1.txt`.
- **Shape:** the same as the dispatch 2 report and the dispatch 3–5 addenda.
- **Register:** `evidence/runs/certgate-001/stage-8/OBLIGATIONS.md` (R8.0 → R8.4).

This is internal band acceptance only; there has been no external evaluation. The band did not deploy, push or submit.

**Seats.** Stage 8 was run by four **new** seats with the same mandates, each started without memory of Stages 1–7:

| Seat | Handle |
|---|---|
| analyst | analyst-zt7k |
| implementer | implementer-zt7m |
| adversary | adversary-zt7n |
| auditor | auditor-zt7p |

Earlier handles in the evidence (`*-xwz3/4/5/6`) are the previous seats. Times are UTC, from machine records (`date -u`, commit and band times). One analyst log line carried an estimated time; it is corrected in the log (§5).

## 0. Starting point

- **Input:** GitHub main **feaadff**. That is the Stage 7 accepted product (final record 2158016) plus five later commits:
  - **d3dd58d, e0de5c7:** the operator's room export and its redaction;
  - **feaadff:** the operator's record of the live-model change;
  - **a27cbbc, bcaee78:** the previous analyst's evidence-only log lines. The dispatch called them operator commits; the auditor's S8-00 corrected that.
- **S8-00 (auditor, 49e377f):** the product diff 2158016..feaadff is empty. The suite at feaadff passes 486/486.
- **Sources (`stage-8/SOURCES.sha256`):** 22 of 23 planning files are unchanged. `docs/01-REGLAS.md` changed on 2026-10-15. Its "Reglas vigentes" block has no rule bearing on model choice.

## 1. Outcome

| Stage 8 | Candidate | Tree | Auditor verdict | Repair cycles | Checkpoint |
|---|---|---|---|---|---|
| Candidate 1 | `cb7d83bc1dd5ec9aefbcd76becdaabf968470887` | `8344f8f2` | **REJECTED** (local), record 44f8cd0 | — | `b8f4577e` |
| **Candidate 2** | **`adb21d5ef03163b5caeb76b1b063f7fae1e7e037`** | `c3d5d399` | **ACCEPTED**: local record 0920b82; **final, live on deployed main 37938b25**, record ccb82d9 (§4) | 1 of 3 | `31943fa6`, `2f2825c1` |

**Candidate 1 was rejected on one condition, F8-A01** (low; found by the adversary, then reproduced by the implementer and the auditor):
- In the container, the legacy `/api/live/read` had no model-mismatch guard. A reply reporting another model was shown as live and counted.
- The approved design note §4 required the guard; the implementer had removed it before the freeze without a ruling.
- The deployed site was unaffected: that route answers 503 there.
- **Repair (candidate 2):** a 5-line strict `sameModel` guard answering 502 `model_mismatch`, its killer test, and a strictened F2-03 test.
- Candidate 1 is preserved.

## 2. What Stage 8 built

- **One closed module, `src/web/models.ts`.** Under `src/` and `public/`, it is the only file that may name a non-default model.
  - **Measured models:** Qwen3.8-27B and Gemma-4-31B-IT, each tied by a test to its evaluation run and its METRICS.md section.
  - **Experimental models:** the ids that passed a probe in this stage, each tied by a test to its committed probe evidence.
  - **Probe outcomes:** the recorded results that give the group (c) reasons.
- **The offer.**
  - The measured set and the experimental set are each intersected with `LIVE_MODELS`, which can only narrow them.
  - With `LIVE_MODELS` unset, only `MODEL_ID` can be chosen (A8-14), as on the site until now.
  - An id outside both sets is never offered, even if listed. A `LIVE_MODELS` entry or a `MODEL_ID` outside the measured set is ignored and logged by name, on the server only. A **listed** id outside both sets is shown disabled in group (c) with its reason.
- **The live-reading screen** shows every id the endpoint lists now, with the probe time, in three groups:
  - **MEASURED** (selectable when listed);
  - **NOT EVALUATED · EXPERIMENTAL**, which needs an explicit acknowledgement;
  - **LISTED, NOT OFFERED**, disabled with its reason: "not enabled on this site", "probe failed", "not a chat model" or "no image probe".
  - The default comes only from the measured group. Endpoint ids are rendered as text only.
- **Server checks**, run before any model call and before the hourly limit moves:
  - a missing, not offered or unacknowledged model is refused after the access code;
  - a stale (> 60 s), future-dated or lock-held model list is refused (`probe_unavailable`);
  - an unlisted model is refused.
  - The request carries the canonical id. Only the `model` value differs from feaadff, byte for byte.
- **One strict identity rule** (`sameModel`: case-insensitive, at most one `<provider>/` prefix) decides listing, the job mismatch guard, the legacy route guard and the probe pass. No fallback between models or to a stored result.
- **Receipts and F1 snapshot.**
  - Each live receipt carries `model_choice`: requested, reported, group, `evaluated`, figures or probe evidence, and `listing_checked_at`.
  - The receipt's own F1 copy carries the requested model and `evaluated`.
  - Experimental readings are labelled "not evaluated" beside the proposal, with no figure.
- **Probe batch (19:46:54Z–19:50:36Z, implementer, under a lease)**, on cg-016, a scan with no text layer (auditor-verified). It made 9 chat calls of the 18-call cap, with no re-probe.

| Group | Ids |
|---|---|
| **Passed** (experimental set) | DeepSeek-V4.1-Flash (151.6 s), DeepSeek-V4-Flash-Vision-Exp, MiMo-V2.6-Flash, Qwen3.8-Flash-Next |
| **Probe failed** | MiniCPM-V-4.7-1B (schema), MiniCPM-V-4.7-35B-A3B (HTTP 500 ×3) |
| **No image probe** (text-only per `/models`) | 3 ids |
| **Not a chat model** (`output: ["ocr"]`) | MinerU2.5-Pro |

  A probe pass means the endpoint accepted CertGate's request and returned a reply that passes the response schema. **The correctness of the values was not judged, and no CertGate figure applies to these models.** The auditor verified the batch offline with 0 findings (S8-T821).
- **Unchanged (T8-01, verified by diff):** the reading path, the prompt (`32fad2f9…`), the rules, data, config, evaluation, figures, stories, METRICS, `vercel.json`, the Dockerfile and the packages. Judge mode and the landing still use Qwen3.8-27B recordings.
- **Docs:** README, DEPLOY.md (`LIVE_MODELS` value and post-deploy checks), CLAIMS.md (C-85 and C-89 corrected, new rows), and the claims map at 0 unmapped and 0 stale.

## 3. Verification (local)

| Candidate | Suite | Docker `--network none` | Mutants | Secrets |
|---|---|---|---|---|
| `cb7d83b` (1) | 564/564 ×3 (auditor) | 474 + 90 skipped | auditor 22/22; adversary 26/26; implementer 40/40 | 0 in tree, delta, `dist/` and image |
| `adb21d5` (2) | 565/565 ×3 (auditor) | 475 + 90 skipped | auditor 25/25; adversary S8 29/29, S7 re-run 10/10, S6 re-run 44/44 | 0 in tree, delta, `dist/` and image |

Also on candidate 2:
- the request bodies through the job path are 8/8 byte-identical to feaadff (4 models × 2 certificates);
- the browser checks pass 16/16 at 375 and 1280 px;
- the adversary's bundle passes 31/31 when re-run by the auditor;
- the F1 model-list cadence is 10 upstream calls, equal to feaadff (≤ 11).

## 4. Live checks on https://certgate-wheat.vercel.app (S8-18 and S8-28)

**Deployment (operator report 7afc3c62, ~04:22Z on 2026-10-16):**
- `LIVE_MODELS` is set in Vercel to the DEPLOY.md value, and `MODEL_ID` stays Qwen3.8-27B.
- GitHub main = **37938b251189fed7be636fc2187e6fbd1fe778fa** (analyst `ls-remote` at 04:22:58Z). It is a fast-forward from feaadff, and its product equals adb21d5 outside `evidence/`.

The band did not deploy or push.

**Auditor run, 04:23Z–04:29Z,** under lease 4d8b723a → 79631832. Final verdict msg 2f2825c1, record `stage-8/auditor/VERDICT-S8-FINAL.md` with `stage-8/auditor/live/` (commit ccb82d9).
- **Calls:** 3 live readings (cap 4), 0 retries, 4 direct GET /models (cap 8), 0 wrong codes.
- **T8-30, identity:** `ls-remote` = 37938b25 at every step. The 6 served files are byte-equal to the commit. Health ok, F1 on, story cg-003 **block** and `recorded: true`.
- **T8-31 and T8-32, listing and offer:** two direct GET /models agree (11 ids), and the page's groups match them exactly:
  - **MEASURED:** Qwen3.8-27B (default) and Gemma-4-31B-IT, both listed and enabled;
  - **EXPERIMENTAL:** the 4 probed ids, each labelled "not evaluated · experimental";
  - **LISTED, NOT OFFERED:** 5 ids, each disabled with its reason.

  Nothing is offered without an evaluation run or passing probe evidence. The auditor viewed the page at 1280 and 375 px (2 screenshots).
- **T8-33, refusals with a correct code:**
  - `model_not_offered` ×2 (an unknown id, and a group (c) id);
  - `model_ack_required` ×2 (no acknowledgement, and the string `"true"`);
  - `model_missing` ×1.

  No job was created. `used_this_hour` and both code-failure counts stayed 0 across 10 reads, and the /usage daily cost was unchanged.
- **T8-34, the readings** (sample cg-004):

| Model | Done | Reported (strict match) | `evaluated` | Hourly count | /usage delta (= reply cost) |
|---|---|---|---|---|---|
| Qwen3.8-27B | 138 s | `self-dploy/Qwen3.8-27B` | true | 0 → 1 | 0.000239575 |
| Gemma-4-31B-IT | 30 s | `self-dploy/Gemma-4-31B-IT` | true | 1 → 2 | 0.000102519 |
| Qwen3.8-Flash-Next (experimental, acknowledged) | 56 s | `self-dploy/Qwen3.8-Flash-Next` | **false** | 2 → 3 | 0.000652260 |

  All three are labelled live, with proposal **release** (the cg-004 expectation) and an F1 copy carrying the requested and reported model. The experimental reading has `figures: null`, its probe-evidence path, the "not evaluated" label and **no measured figure**. There was no fallback.
- **T8-35: condition absent.** Every offered model, Gemma included, was listed at 04:23:34Z. "An unlisted model is shown disabled and refused" could therefore not be observed live, and rests on the local evidence (tests, mutants M8-03/04/05, browser). **This is a stated limitation, not a pass.**
- **T8-36, secrets:** 0 hits for the code, the key, their SHA-256 values and the base-URL path, across 177 site exchanges (bodies and headers) and the served bundle.
- **T8-37:** the legacy `/api/live/read` answers 503 on the site, with and without a model.

**Automatic rejections: none occurred.**
- No model without an evaluation run is offered as measured.
- No model is offered as experimental without probe evidence.
- No measured figure appears on an experimental reading.
- There is no fallback.
- The key is not reachable from the browser.
- No experimental model is a default, and none appears without its label.

**Result: Stage 8 ACCEPTED**, bound to deployed main 37938b25, whose product is adb21d5.

## 5. Interventions, infrastructure, limitations

**Operator inputs (all in the room):**
- the dispatch;
- the correction b642c66d;
- amendment 1 (79b781e6);
- the deployment report and decisions (7afc3c62, R8.4).

**O8-01, endpoint base-URL path in the room export:**
- The implementer's value scan found the base-URL path 9 times in `final/room.json`, added by operator commits d3dd58d and e0de5c7. The key and the code were not there.
- The analyst redacted it in a new commit, 1497571; the host is kept. The auditor verified 0 hits at head.
- The path stays in the published history at d3dd58d, e0de5c7 and feaadff.
- **Operator decision (7afc3c62), option A:** history is not rewritten, and the URL is not rotated. The operator's reason: the path without the key grants nothing, and the host is public.
- The auditor's S8-00 pattern scan had missed it. It was corrected in S8-00a, and value scans are used from then on.

**Infrastructure:** Docker Desktop was not running and was started by the implementer (1 infrastructure retry). Heavy local work was serialized across seats (8.1 of 31.6 GB free).

**Analyst errors:**
- The analyst twice wrote estimated times instead of machine times: the handoff ("~20:00Z" for 19:22–19:24Z) and the first version of §4 ("02:4xZ" for 02:11:34Z, auditor correction C1). Both were corrected in new commits.

**Commit identity (operator, 7afc3c62):**
- Before 04:22Z on 2026-10-16, Stage 8 commits carry one of two author e-mails, counted over feaadff..016e028:
  - `hvaler@comillas.edu`: 33 commits;
  - `auditor-zt7p@certgate.local`: 6 auditor commits (49e377f, ecb6c22, 269897b, 44f8cd0, 0920b82, 6571c78), set per commit as in earlier stages.
- The human will rewrite both after the event (auditor correction D1).
- Later commits use the repository's configured e-mail.

**Observations, not blocking:**
- **O8-A02:** a Stage 6 test had a slot-ordering assumption and failed about 1 in 25 under load. It was fixed in candidate 2 with its strength kept.
- **`ui-checks.mjs:94`:** a browser timeout that already occurs at feaadff.
- A sub-second `probe_unavailable` can occur at the 60 s freshness boundary. It is fail-closed.
- Model ids longer than 200 characters are not shown; the page says so.
- The legacy route spends its hourly unit before the mismatch check (as jobs do, CH8-19).

## 6. Time, usage, final commit and push

| | Start (UTC) | Local acceptance (UTC) | Wall clock | Limit |
|---|---|---|---|---|
| Stage 8 | 19:15Z, 2026-10-15 (dispatch 6) | local ~22:55Z (msg 31943fa6); **final ~04:31Z on 2026-10-16** (live lease released 04:29:04Z; verdict msg 2f2825c1 written 04:30:49Z; record ccb82d9 committed 04:31:38Z; auditor correction D2) | ~220 min to local acceptance. The 480-min budget ended at 03:15Z while waiting for the human's deployment; the live checks ran on the report at 04:22Z, inside the stage hard stop 2026-10-17T08:00Z | 480 min (amendment 1) |

- **Repair cycles:** 1 of 3.
- **Infrastructure retries:** 1 (Docker Desktop not running).
- **Endpoint usage in Stage 8** (Token Factory, free credits, no monetary value):

| Call | Count | Reported cost |
|---|---|---|
| Implementer sizing GET /models | 1 | — |
| Probe batch, chat calls | 9 (8 counted by the endpoint; 1 was a 429) | 0.00278817 |
| Container smoke readings | 2 (Qwen3.8-27B; Qwen3.8-Flash-Next) | 0.000901495 |
| Auditor live readings via the site | 3 (Qwen3.8-27B; Gemma-4-31B-IT; Qwen3.8-Flash-Next), plus 4 direct GET /models | 0.000994354 |

  GET /usage was read before and after each batch and reconciled exactly. The adversary made no endpoint calls.
- **Seat usage (Claude):** recorded in `final/band-usage-agents-dispatch6.txt` at 01:41Z on 2026-10-16. These are list-price estimates, not a bill.

| Seat | Tokens | Estimate |
|---|---|---|
| implementer-zt7m | 138,432,226 | $36.49 |
| auditor-zt7p | 93,036,599 | $25.16 |
| analyst-zt7k | 80,950,291 | $21.58 |
| adversary-zt7n | 66,560,656 | $18.88 |

**Final commit and push:**
- The accepted product is **adb21d5** (tree c3d5d399).
- It is **live** from GitHub main **37938b25**, pushed by the human.
- Everything after 37938b25 is evidence only: R8.4, the auditor's final record and this completed addendum. Pushing it is optional and changes no served file.

**For the human before submitting (2026-10-18T10:00Z):**
1. **Optional:** push the evidence-only head named in the room message that posts this addendum.
2. **Re-record the live-reading clip.** It now shows the model choice and the "not evaluated" label on experimental models.
   - Readings take about 30 s (Gemma) to about 140 s (Qwen).
   - Token Factory's list can change, and the page shows it as it is.
3. Video MP4 (unlisted, at most 5 min, under 300 MB).
4. Slides PDF.
5. 16:9 cover.
6. lablab form, with the access code only in Additional Information.
7. Export the room.

CertGate makes no claim of winning, entering or qualifying for any prize. The band did not deploy, push or submit; the human pushed and Vercel deployed.
