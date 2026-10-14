# Stage 5 candidate 1 (Gemma comparison): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 5
Task: dispatch 3 (msg 82f82e5e) and the analyst's 16-part handoff. Register **R5.4** (commit 3ef256d, committed-blob
SHA-256 `be06c946…ce32`), including R5.1 E-12…E-14, R5.2 G-01…G-12, R5.3 E-15 and R5.4 E-16. This record states
what was done; it is not an acceptance. **No push, no deploy.** All endpoint calls were made under the lease I
announced and released (msg 78b43118).

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `ddb75eca79c1e66b06456ebce45992ccd140eafa` |
| Tree | `2fdd51a2abe738755672b41098d1f371569de67a` |
| Base | public head `05103af` (accepted Stage 4 product `b0ec67a6`) |
| Implementer commits | `41b9b6a` Gemma run of record and endpoint evidence · `6ad7b16` E-15 (separate commit) · `e2c15d4` METRICS, README, claims, guards · `51285cc` prize check in docs.test · `2b83861` README rewrap · `ddb75ec` G-12 wording |
| Intermediate state | `51285cc` alone fails one test: the prize check flagged the README sentence "…no claim about any / prize or award." because it was wrapped across two lines. `2b83861` puts it on one line. The candidate is `ddb75eca` |

## Product files vs b0ec67a6

`git diff --stat b0ec67a6 ddb75eca -- src public api data config package.json package-lock.json Dockerfile .dockerignore vercel.json tsconfig.json`:
**only `vercel.json`** (1 line: `includeFiles` `"{data,config,public/stories}/**"` → `"{data,config,public/stories,node_modules/pdfjs-dist}/**"`, E-15).
`src/`, `public/` (figures.json, stories), `api/`, `data/`, `config/`, the package files and the Dockerfile are
byte-identical; `test/stage5-gemma.test.ts` checks this against the b0ec67a6 git blob ids (283 files).

Every other changed file: `CLAIMS.md` (C-69…C-76), `EVIDENCE-INDEX.md` (Stage 5 rows), `METRICS.md` (generated),
`README.md` (Gemma section; the layout line "Vercel function entry" became "Vercel function handler" so that the
prize check's word "entry" does not occur), `claims-map.json`, `docs/sources/gemma.md` (new), `docs/sources/model.md`
(one sentence now points at gemma.md), `evaluation/dev-calls.jsonl` (+3 lines), `evaluation/runs/real-gemma-04100b9/`
(new), `test/docs.test.ts`, `test/fixtures/stage5-baseline.json`, `test/stage5-gemma.test.ts`,
`test/support/prize-check.mjs`, `test/vercel-config.test.ts`, `tools/evaluate/metrics-md.mjs`.

## Gemma run of record (G-02)

- `evaluation/runs/real-gemma-04100b9`: 2026-10-14 10:47:17Z → 10:55:09Z, from commit `04100b93` (product tree
  identical to b0ec67a6), 27 of 27 cases, concurrency 2. It is the first and only Gemma run: no infrastructure re-run
  and no per-case re-run.
- Command: `MODEL_ID=Gemma-4-31B-IT node tools/evaluate/run-eval.mjs --out evaluation/runs/real-gemma-04100b9`.
  `MODEL_ID` was set only in that command's environment.
- Reported model: `self-dploy/Gemma-4-31B-IT` in every one of the 27 replies; finish_reason `stop` in all 27.
  `run.json` has `model_requested: "Gemma-4-31B-IT"` and prompt `32fad2f9…c567`.
- Request shape sent (G-03): the same builder as Qwen, with only `model` different. Fields: `temperature: 0`,
  `max_tokens: 16384`, `response_format: {"type":"json_object"}`, the frozen system prompt and page images only.
  **No thinking or reasoning control was sent.** No parameter was rejected, so S5-02 needed no change.
- **/usage:** headroom at 10:47:02Z: used 0.01777, remaining 0.98223 (limit 1, reset 16:00Z). That is about 450×
  the projected cost of about 0.0022.
  - Before the run: `daily_cost_used` 0.017769629. After the run: 0.019872587. Delta 0.00210296 = the sum of the
    27 per-reply costs; difference 0.
  - After the cg-003 reading (10:56:30Z): 0.019948386. The delta 0.00007580 equals that reply's cost.
- **Lease calls:** 32 = 28 chat completions (27 run + 1 cg-003) + 4 GET /usage (headroom, run before, run after,
  final). 0 retries, 0 errors.

## Metrics (generated; METRICS.md "Comparison run: Gemma-4-31B-IT (Stage 5)")

| | qwen implementer | qwen auditor | gemma |
|---|---|---|---|
| FC-broad · FC-strict | 0 / 18 · 0 / 6 | 0 / 18 · 0 / 6 | **0 / 18 · 0 / 6** |
| Non-conformities caught (of which block) | 6 / 6 (6) | 6 / 6 (6) | 6 / 6 (5) |
| Proposal as expected | 27 / 27 | 26 / 27 | 26 / 27 |
| Rule abstention · failures | 12 / 27 · 0 / 27 | 13 / 27 · 0 / 27 | 13 / 27 · 0 / 27 |
| Per field: correct · wrong · invented · confident-on-illegible · unknown · unit missing (of 594) | 591 · 1 · 0 · 0 · 0 · 1 | 591 · 1 · 0 · 0 · 0 · 1 | 591 · 0 · 0 · **1** · 1 · 0 |
| Seconds per certificate (mean · median · N) | 89.6 · 80.6 · 27 | 77.1 · 76.9 · 27 | 34.5 · 30 · 27 |
| Tokens per certificate (total mean) | 4234 | 4211 | 2003 |
| Cost per certificate (mean, as reported) | 0.00020529 | 0.00020863 | 0.00007789 |

**Per-case proposal differences vs the Qwen runs (generated; 2 cases):**
- **cg-021** (expected block): gemma **review**; qwen implementer block, qwen auditor block. Gemma returned Si as
  absent; the text layer read 0.62 % (limit 0.55 %). Reasons: CHANNEL_DISAGREE:Si, CRITICAL_UNKNOWN:Si,
  RULE_NOT_EVALUABLE:Si. The case was not released.
- **cg-004** (expected release): gemma release; qwen implementer release, qwen auditor **review**.

**Every Gemma field not read correctly:**
- cg-017 `heat_or_lot`, **confident on illegible**: read `24-73269`, correct reading unknown. The case was proposed
  review (NO_SECOND_CHANNEL).
- cg-021 `chemistry.Si`, unknown: read absent, correct 0.62.

**Gemma false conforming:** none. No root-cause line is owed. The generator writes one from the artifacts for any FC
(case, field read vs correct, rule path, reasons); this is tested on a synthetic FC.

**cg-003 Gemma reading (evidence only, S5-12, G-10):** `evidence/runs/certgate-001/stage-5/implementer/endpoint/gemma-read-cg-003.json`.
Gemma read ReH as 338 MPa with status read. The recorded Qwen story reading (`public/stories/cg-003.recording.json`)
also reads 338. The proposal was block (RULE_FAIL:ReH, NO_SECOND_CHANNEL); the dataset expects review
(CRITICAL_UNKNOWN:ReH). The reading is not in `public/`, not a story and not on the landing.

## Checks and killers (named)

| Requirement | Test (file::title fragment) |
|---|---|
| G-01, S5-15 b: model identity | `test/stage5-gemma.test.ts::every reply of the Gemma run reports a Gemma model id` |
| G-03, S5-15 c: Qwen request golden hash (page images replaced by a marker; hash `69cb4771…655e`, equal at b0ec67a6, where `src/` is byte-identical) and Gemma body = Qwen body except `model`, with keys exactly model, temperature, max_tokens, response_format, messages | `::the Qwen request body for cg-004 hashes to its value at b0ec67a6`; `::the Gemma request body equals the Qwen request body except the model id` |
| E-13, G-04, CH5-07: byte-identical product, expectations, Qwen artifacts, stage-3 evidence (git blob ids) | `::are byte-identical to b0ec67a6` |
| E-15: vercel.json differs only in includeFiles | `::vercel.json differs from b0ec67a6 only in the includeFiles value`; `test/vercel-config.test.ts::the function includes node_modules/pdfjs-dist` |
| S5-15 d: landing stays Qwen | `::the landing figures are generated from the Qwen implementer run, never from a Gemma run` |
| G-05, S5-15 f: differences computed and listed | `::the per-case difference list equals the set of cases whose Gemma proposal differs from a Qwen run` |
| G-06: generated FC root-cause line | `::a false conforming gets a generated root-cause line` |
| E-13: Qwen sections of METRICS unchanged (the prefix before the comparison heading has the SHA-256 of `b0ec67a6:METRICS.md`, `fcd2d6fc…7b21`) | `::the comparison section follows the Qwen sections, which are unchanged from b0ec67a6` |
| S5-15 a (README): Gemma figures | `::README Gemma figures equal the generated metrics of the Gemma run` |
| S5-10: publisher and licence as published (apache-2.0, license_link to the Gemma 4 licence; https://huggingface.co/google/gemma-4-31b-it, retrieved 2026-10-14) | `::the Gemma publisher and licence are stated as the publisher's page states them` |
| S5-11, G-09, S5-15 e: prize check per line and clause, with negation and the 01-REGLAS quote rule | `test/docs.test.ts::no forbidden claim in README, DEPLOY.md, METRICS.md or public`; `test/stage5-gemma.test.ts::flags a prize, award, eligibility or entry claim` |

Kill log `candidate-1/mutants5.log` (base ddb75eca; throwaway branches `impl-mut5/<id>-on-ddb75ec` in a scratch
clone, never merged; applier `candidate-1/mutate5.mjs`, runner `candidate-1/kill5.sh`). **All 15 killed:**

| Mutant | Failed / 332 | Killed by |
|---|---|---|
| a_metrics: METRICS Gemma seconds 34.5 → 24.5 | 2 | fresh generation; sentence map |
| a_readme: README Gemma seconds 34.5 → 24.5 | 2 | README Gemma figures; sentence map |
| a_readme_fc: README "5 of 6 proposed block" → "6 of 6" | 2 | README Gemma figures; sentence map |
| b_gemma_as_qwen: GEMMA_RUNS dir → the Qwen run | 4 | model identity; fresh generation; README Gemma figures; landing |
| b_qwen_as_gemma: auditor Qwen run dir → the Gemma run | 3 | model identity; fresh generation; Qwen prefix hash |
| b_run_json: Gemma run.json model_requested → Qwen3.8-27B | 2 | model identity; fresh generation |
| c_request: `top_p: 1` added to the request | 3 | golden hash; Gemma = Qwen body keys; byte-identical src |
| c_max_tokens: ADAPTER_MAX_TOKENS 16384 → 8192 | 2 | golden hash; byte-identical src |
| d_landing: public/figures.json regenerated from the Gemma run | 4 | landing from Qwen; byte-identical public; README Qwen figures; METRICS landing run |
| e_eligible: "CertGate is eligible for the Gemma prize." | 2 | prize check; sentence map |
| e_qualifies: "CertGate qualifies for the Google prize." | 2 | forbidden claim (qualif, prize); sentence map |
| f_generator: difference list only where Gemma differs from every Qwen run | 2 | per-case difference list; fresh generation |
| f_metrics_hand: cg-004 removed from the METRICS difference line | 2 | fresh generation; sentence map |
| e15_drop_pdfjs: node_modules/pdfjs-dist dropped from includeFiles | 2 | vercel-config; vercel.json only-includeFiles |
| g04_expected: cg-021 expected_proposal block → review | 3 | byte-identical data; dataset checksums; dataset outcome |

## Verification

- `candidate-1/clean-clone5.log`: fresh clone of ddb75eca, `npm ci` (0 dirty files), `npm run build`,
  `npx vitest run` with MODEL_* unset: **332/332**. `metrics-md --check`: matches. Claims: **0 unmapped, 0 stale**
  (507 map entries; CLAIMS.md has 76 rows).
- `candidate-1/docker5.log`: `docker build --no-cache`, image suite with `--network none` and **0 MODEL_*
  variables** in the container: 305 passed, 27 skipped. All 27 skipped tests are repository-only checks, because the
  image carries no evidence/ and no METRICS.md (the 12 of Stage 4 plus 15 new ones). The request-body golden hash
  passes inside the image. The service is fully offline: /health ok, mode mock, reader off.
- The key and the base-URL value occur in no artifact or evidence file. I checked this by presence only.
- E-16 bundle simulation: not added as a committed test (R5.4 allows the config test plus the reviewers'
  simulations). The adversary's pre-candidate simulation (msg 3dae879d) reproduced the fault without pdfjs-dist and
  got 200s with it.

Time: Stage 5 handoff about 10:41Z; Gemma run 10:47–10:55Z; lease released 10:57Z; candidate 1 frozen about 11:19Z.
