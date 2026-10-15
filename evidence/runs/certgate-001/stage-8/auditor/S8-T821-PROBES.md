# Auditor record S8-T821 — independent check of the Stage 8 probe batch (T8-21; R8.2a P-01…P-07; R8.2b; Q-07, Q-08, Q-11, Q-15)

- **Seat:** auditor-zt7p. Run on 2026-10-15 at ~20:20Z. **No endpoint call was made.**
- **Evidence checked:** `evidence/runs/certgate-001/stage-8/probes/` at `s8-impl` **fd326d61632c48373a0f0573b7d2a4fb601f7ef5**, in the auditor's own fresh clone.
- **The batch ran from** P-04 commit **303c32bb0a969a4ad4d79157426b6b2ff9fce000** (the implementer's lease message e901b933).

## Method

`stage-8/auditor/tools/verify_probes.mjs`, run with the auditor's **feaadff** build as the reference. At 303c32bb, `src/web/live-reader.ts`, `src/model-output.ts`, `src/strict-json.ts`, `src/web/deadline-reader.ts` and `src/pipeline.ts` are byte-identical to feaadff (`git diff --stat feaadff 303c32bb` over those paths is empty).

For each `probes/<id>.json` the tool:
- **re-parses** `reply_content` with the feaadff build's own `parseModelOutput`;
- **re-applies** the four pass conditions of P-01/Q-08: last attempt HTTP 200, the schema parse, the **strict identity rule written independently from L-C1**, and elapsed ≤ 210 000 ms;
- compares elapsed with the start–finish wall span;
- checks the chat calls against the attempts (≤ 3);
- checks the certificate SHA-256 (cg-016, `4bdfea0e…e6e0`, see S8-P01) and the prompt SHA-256;
- **re-captures the request body** with the feaadff build's own `LiveReader` for that id on cg-016, against a local capture server, and compares both the full-body SHA-256 and the image-masked T8-02 hash with the record (Q-11);
- checks the provenance fields: the commit and the dirty flag, and the compiled `live-reader.js` and `model-output.js` against the feaadff build;
- scans for `authorization`, `bearer <token>`, `api_key`, and for the key value and the base-URL path read from the environment and compared in memory. Nothing is printed and no property is written (D8-04).

**Batch-level checks:**
- the classification of every id in `models-snapshot.json`, under Q-07: a reason applies only if its field is present and lacks the value;
- every "probe" id was probed, and no other id was;
- the sum of the calls against the 18 cap;
- the GET /usage cost delta against the sum of `cost_reported`;
- `EXPERIMENTAL_MODELS` and `PROBE_OUTCOMES` in `src/web/models.ts` at fd326d6 against the auditor's own pass/fail.

**Dist provenance (P-07):** the auditor rebuilt 303c32bb from a fresh clone (`npm ci`, `npm run build`) and recomputed the dist listing hash with the probe script's own method. The result, **33 files, `e506edc3da147b2ece5cc0a8b3bea18ecf6570d8f46207eadcf5d30ef7d568a5`**, equals every probe record's `dist_tree_sha256`.

## Results

| Id | Recorded | Auditor | Re-parse | HTTP 200 | Strict id | Elapsed ms | Calls | Body full / masked |
|---|---|---|---|---|---|---|---|---|
| DeepSeek-V4.1-Flash | passed | **passed** | ok | yes | yes | 151 649 | 1 | match / match |
| DeepSeek-V4-Flash-Vision-Exp | passed | **passed** | ok | yes | yes | 39 793 | 1 | match / match |
| MiMo-V2.6-Flash | passed | **passed** | ok | yes | yes | 39 396 | 2 (429, then 200) | match / match |
| Qwen3.8-Flash-Next | passed | **passed** | ok | yes | yes | 29 170 | 1 | match / match |
| MiniCPM-V-4.7-1B | failed | **failed** | **fails**: "model output does not match the reading schema: issuer is not an object" | yes | yes | 11 668 | 1 | match / match |
| MiniCPM-V-4.7-35B-A3B | failed | **failed** | no reply | no (HTTP 500 ×3) | — | 11 216 | 3 | match / match |

**Classification** (snapshot, 11 ids), every one equal to BATCH.md:
- **probe:** the 6 above;
- **no image:** DeepSeek-V4-Flash, GLM-5.3-Flash, MiniCPM5-2B (`input_modalities = ["text"]`);
- **not chat:** MinerU2.5-Pro (`output = ["ocr"]`);
- **measured:** Qwen3.8-27B;
- **Gemma-4-31B-IT:** not listed.

**Batch-level results:**
- **Calls:** **9 of the 18 cap**. One probe per id, with no re-probe (R8.2b).
- **/usage:** the `daily_cost_used_usd` delta equals the sum of the replies' `cost_reported`: **0.002788170 = 0.002788170**. These are free credits, with no monetary value.
- **Code sets at fd326d6:**
  - `EXPERIMENTAL_MODELS` = {DeepSeek-V4-Flash-Vision-Exp, DeepSeek-V4.1-Flash, MiMo-V2.6-Flash, Qwen3.8-Flash-Next}, **exactly the auditor's passed set**;
  - `PROBE_OUTCOMES` = {MiniCPM-V-4.7-1B: probe_failed, MiniCPM-V-4.7-35B-A3B: probe_failed, MinerU2.5-Pro: not_chat}, **exactly as derived**.
- **Secrets:** 0 hits. The key and the base-URL path were both available to the scan.
- **Informational field (Q-15):** each record carries `informational_not_a_quality_figure` (critical fields read, proposal), and every record states that correctness is not judged. Whether it is ever shown on the page or in the README is checked on the candidate (R-C).

**Findings: 0.**

## Still to check on candidate 1

- fd326d6 (and 303c32bb) are **ancestors** of the frozen candidate.
- The code sets are unchanged between fd326d6 and the candidate.
- The candidate's own test ties the sets to these files.
- The candidate's capture of each experimental body equals the feaadff body for that id (T8-02).

Machine-readable output: `S8-T821-probe-verification.json`.
