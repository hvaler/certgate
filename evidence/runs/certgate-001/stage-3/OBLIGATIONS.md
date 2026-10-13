# Obligation register — Stage 3 (real reading on AMD Token Factory)

Run: certgate-001 · Stage: 3 · Register version: **R3.0** (analyst-xwz3, 2026-10-13) · Dispatch 2: room msg `7e4ee02a-7ff6-4133-9c36-ce5d92e3870e`, verbatim copy `evidence/runs/certgate-001/DISPATCH-2.txt` (key **Y**) · Dispatch 1 stays in force (key **X**, `DISPATCH-1.txt`) except where Y changes it · **Input revision: Stage 2 ACCEPTED candidate `b7f4a546fee6784d3312c19b74817807f6f0114d` (tree `33bb040e5a21ce9fa1b92f0f1dd80708808bf3ad`)**; repository head at Stage 3 start `e90fe2c` (evidence only on top of b7f4a546; public on GitHub).

Sources re-hashed at Stage 3 start into `stage-3/SOURCES.sha256` (D 03-DISENO unchanged since Stage 2; R 01-REGLAS and V 02-VALIDACION changed: R adds the Token Factory event-compute rows, V adds section "[13/10] Vía AMD Token Factory" with the human's mini-test). Registers R1.6 (Stage 1) and R2.2 (Stage 2) stay in force: every S1 and S2 row and decision applies, except where a row below supersedes it.

Line keys as before: X/Y = dispatch sections and bullets; D, P, R, V = planning documents (Stage 3 hashes).

## Scope statement (D3-01)

Stage 3 uses the **real model** `Qwen3.8-27B` served by **AMD Token Factory** (Y §RUN CONFIGURATION; R row "Cómputo de AMD del evento"). Token Factory exposes no GPU, ROCm or vLLM information; the band states only what the endpoint reports, plus the cited fact that the endpoint is AMD Token Factory, the AMD compute named by the event page. No AMD Developer Cloud instance, no own vLLM. Stage 3 acceptance is **not** deployment and not submission.

## Obligations

### Reader and channels

| ID | Source | Obligation | Boundary / error case | Acceptance method → expected | Owner |
|---|---|---|---|---|---|
| S3-01 | Y §S3 b1 | **Real ModelReader** against `MODEL_BASE_URL` with `MODEL_ID`: POST /chat/completions, `response_format: json_object`, structured JSON for the Certificate contract with a **source location for every value**; strip only surrounding code fences; a non-JSON body or schema-invalid output is a **C11 failure**, never repaired by guessing | Missing `source_ref` ⇒ value unknown; JSON numbers rejected (S1-25 still applies) | Recorded-fixture tests; auditor real run | implementer |
| S3-02 | Y §RUN CONFIGURATION "Calling discipline" | Calling discipline in product code: ≤ 2 requests in flight, honour `Retry-After`, retry **only** 429 and 5xx, exponential backoff, **≤ 3 attempts per call**, client timeout **300 s** | Timeout/connection error counts as failure (C11) | Unit tests with recorded/stub responses; auditor checks call counts | implementer |
| S3-03 | Y §S3 b1, §RUN "thinks by default" | Reasoning tokens count toward `max_tokens`; the reader sets a `max_tokens` that leaves room for reasoning and output; `choices[0].message.reasoning` is **never** used as a reading or as an explanation fact (I1); a truncated reply (`finish_reason: length`) is a C11 failure | — | Fixture test with a truncated reply | implementer |
| S3-04 | Y §S3 b2; X:I3 | Two-channel check of I3 runs with the real model: digital PDFs compare text layer vs real model reading; disagreements visible **side by side** (UI and receipt) | — | Auditor real run on digital cases | implementer |
| S3-05 | Y §S3 b2; V §[13/10] "Ningún modelo señala la duda" | The `review` proposal for scans comes from the **product rule** (scan without text layer + critical field ⇒ human confirmation), **never** from model confidence. cg-003 read as 358 with no doubt must still be `review` | A model "confidence" or "doubt" field never changes the proposal | Real run of cg-003 ⇒ review; mutation "review only when model expresses doubt" killed | implementer; adversary |
| S3-06 | Y §OPEN ITEMS b4 | Tests use **recorded fixtures from real calls**: `content`, `reasoning`, `usage`, `X-RateLimit-*` headers, and the **two error shapes** `{"error":…}` and `{"detail":{"error":…}}`. Fixtures contain no key and no base URL value (host may appear) | — | Fixture files + tests; secret scan | implementer |
| S3-07 | Y §RUN "never substitute the mock" | In real mode the mock is **never** used, not as fallback, not for tests counted as real; a mock reading counted as real **rejects the stage** | — | Code review; mutation "fallback to mock on endpoint failure" killed; auditor | implementer; adversary; auditor |

### F1 panel and receipts

| ID | Source | Obligation | Boundary / error case | Acceptance method → expected | Owner |
|---|---|---|---|---|---|
| S3-08 | Y §S3 b3 | F1 fed **live by the endpoint**: model id **as the endpoint reports it** (GET /models and the response's `model`), latency, **tokens per second = usage tokens / measured time**, the **cost the endpoint reports** (`usage.cost`), remaining requests/spend from `X-RateLimit-*` headers or GET /usage | A value absent from the endpoint is shown as unknown, never defaulted | Auditor compares panel values with its own raw endpoint responses | implementer; auditor |
| S3-09 | Y §S3 b3 | GPU, ROCm and vLLM version shown as **"not exposed by the endpoint"**, never a value from code. Panel may state, with link, that the endpoint is **AMD Token Factory**, the AMD compute named by the event page (cite the event page text in R) | — | Grep; browser | implementer |
| S3-10 | Y §S3 b3 | **Remove or disable the sidecar route** of dispatch 1 (no sidecar exists); `GPU_INFO_URL` removed from `.env.example` unless a sidecar exists | — | Code/config review | implementer |
| S3-11 | Y §S3 b3; D:L153 | Each receipt stores a copy of these F1 values at reading time | — | Receipt inspection on real run | implementer |
| S3-12 | Y §S3 b3; Y "usage.cost" | Cost labelled everywhere it appears: **"cost reported by the endpoint; Token Factory credits are free and have no monetary value"** | — | Grep UI/README/METRICS | implementer |

### Evaluation (Y §S3 b4)

| ID | Source | Obligation | Boundary / error case | Acceptance method → expected | Owner |
|---|---|---|---|---|---|
| S3-13 | Y §S3 b4 | **Full evaluation** over the dataset against the real endpoint, by a committed, re-runnable command, producing machine-readable artifacts: per case (proposal, status, reasons, per-field reading vs correct reading, timings, tokens, reported cost, retries, failures) and an aggregate | A run interrupted by the daily cap or 60 min of failures is reported as such (BLOCKED), never completed with the mock | Artifacts committed; auditor re-runs | implementer; auditor |
| S3-14 | Y §S3 b4; D3-04 | Metrics with **numerators and denominators** (D3-05): per-field reading accuracy; **FALSE CONFORMING** (critical); non-conformities detected; abstentions; time per certificate; latency per request; tokens; reported cost; retries; failures | No metric without the run that produced it | Auditor recomputes from artifacts | implementer; auditor |
| S3-15 | Y §S3 b4; D:L231-232; P:L94 | Cases used to **tune prompts are listed and excluded** from the final evaluation (D3-03) | — | List file committed before the final run; artifacts show exclusion | implementer |
| S3-16 | Y §RUN "Read GET /usage before and after" | GET /usage read **before and after** every evaluation run; both stored in the evidence | — | Evidence files | implementer; auditor |
| S3-17 | X §Stage 1 b8 "expected … written BEFORE any model run"; D3-04 | Real-run expectations for cases whose dataset expectation depends on a **mock-only planted deviation** (cg-018 planted misread, cg-021 contaminated mock explanation, cg-023…cg-027 injected failures) are **hand-written and committed before any real evaluation run** (D3-04), not computed by product code | — | Commit order; auditor reads | implementer; auditor verifies |

### Stories, landing, limits, model facts

| ID | Source | Obligation | Boundary / error case | Acceptance method → expected | Owner |
|---|---|---|---|---|---|
| S3-18 | Y §S3 b5 | The three judge-mode stories (cg-001 conforming, cg-002 out of spec, cg-003 ambiguous scan) **re-recorded from real runs**, replacing the Stage 2 stored files, each with receipt and F1 snapshot, labelled **recorded (stored) with their date**, model as reported | Never presented as live (I7); stories are not part of the evaluation denominator if their cases are tuning cases (D3-03) | Auditor reproduces each story with its own real run and compares proposal/reasons/values | implementer; auditor |
| S3-19 | Y §S3 b6; D:L174-177 | The four landing figures (false conforming, non-conformities caught, seconds per certificate, cost per certificate) **generated from the evaluation artifacts** with denominators, replacing the placeholders; never hand-written | — | Grep; a test that regenerates figures from the artifact | implementer |
| S3-20 | Y §S3 b6 | Live-read limit configured from `LIVE_READS_PER_HOUR` (documented deployment value **20**) and, if given, `LIVE_ACCESS_CODE`; the code value never in the room or the repository | — | `.env.example`, docs | implementer |
| S3-21 | Y §S3 b7 | Record in the repo the **exact model**, its **publisher** and its **licence as published by the publisher** (with source URL and retrieval date; not from memory), and that it is **served by AMD Token Factory**. MODEL_ID is not Gemma ⇒ no Gemma statement required; no prize claim of any kind | — | File review; source URL | implementer |

### Open items carried from Stage 2 (Y §OPEN ITEMS)

| ID | Source | Obligation | Acceptance → expected | Owner |
|---|---|---|---|---|
| S3-22 | Y §OPEN b1 | `jury-code-77` is a test fixture only: no default access code in product or config; deployed code only from `LIVE_ACCESS_CODE`; unset ⇒ hourly limit alone | Grep product/config; test | implementer |
| S3-23 | Y §OPEN b2 (OI-S2-01) | Live limit made global with a store the deployment really has, **or** page and README state it is per instance, with the **measured consequence** | Code or text + measurement | implementer |
| S3-24 | Y §OPEN b3 (OI-S2-02) | Live path finishes inside the documented function duration of the deployed Vercel plan (S2-22 record), or start-then-poll, or the deployed site says live reading is unavailable there and the live demonstration runs from the container. Real reading takes 30–190 s (V), retries may add more | Design note + test; never a stored result as live | implementer |
| S3-25 | Y §OPEN b5 | Redact the five local absolute paths (`C:\Users\…`) in `evidence/runs/certgate-001/stage-1/implementer/` by a **new commit** (no history rewrite) | grep at candidate | implementer |
| S3-26 | Y §OPEN b6 | Product test that kills **S2M02b** (dropping " · not live") | Mutant re-run | implementer; adversary |

### Verification

| ID | Source | Obligation | Acceptance method → expected | Owner |
|---|---|---|---|---|
| S3-27 | Y §S3 Acceptance | Auditor runs the evaluation itself from a clean clone **against the real endpoint**, reproduces the three stories, confirms F1 values come from the endpoint and not from code, and re-runs the Stage 1 and 2 suites in mock mode | Verdict record | auditor |
| S3-28 | X §MUTATION CHECK | Stage 3 mutants at least: mock reading counted as real / fallback to mock; review for scans made dependent on model doubt; F1 GPU/ROCm value from code; reasoning text used as reading or explanation; retry on 4xx other than 429 or > 3 attempts; cost or figures hard-coded; JSON repaired by guessing. Each killed by ≥ 1 test; branches unmerged | Mutation report | adversary |
| S3-29 | Y §S3 Acceptance "paced"; D3-02 | Endpoint use paced by the **endpoint lease** so that the seats together stay under the shared limits | Lease messages in the room | all seats |
| S3-30 | Y §RUN "BLOCKED" | Daily cap reached or endpoint failing for **60 minutes** ⇒ conclude BLOCKED with evidence; host denial of an endpoint call ⇒ BLOCKER file with exact host message, wait for operator, no workaround | Evidence files | all seats |

## Decisions (ambiguity log)

| ID | Ambiguity | Decision | Evidence | Impact |
|---|---|---|---|---|
| D3-01 | Scope / AMD claim | As scope statement above | Y §RUN, §S3 b3; R; V §[13/10] | No GPU/ROCm claim |
| D3-02 | Shared key across four seats | **Endpoint lease**: one seat at a time calls the endpoint, announced in the room ("ENDPOINT LEASE TAKEN/RELEASED"); within the lease ≤ 2 in flight. Order: implementer (development, tuning on tuning cases, then the candidate's evaluation run and the three stories) → adversary (targeted real probes, small number of calls) → auditor (its own evaluation run and stories). Reading GET /models or /usage counts as a call | Y §RUN "SHARED service", "paced" | Prevents 429 storms and cap exhaustion |
| D3-03 | Tuning cases | Prompt tuning may use **only cg-001, cg-002, cg-003** (the three pre-kickoff certificates the human already used in the mini-test, V §[13/10]). They are the judge-mode stories and are **excluded** from the final evaluation: denominator = **cg-004…cg-030 (27 cases)**. Any other case touched while developing the prompt joins the exclusion list, and the list is committed before the final run | Y §S3 b4; D:L231-232 | Evaluation on 27 cases unless the list grows |
| D3-04 | Expectations for planted-deviation cases under the real reader | For cg-018, cg-021, cg-023…cg-027 the mock planted deviation does not exist in a real run. Their **real-run expected proposal = the proposal implied by the certificate's correct reading and delivery line** (D1-03/A-04 precedence, inclusive limits, A-02 CEV), **hand-written** per case in a separate file committed **before** the first real evaluation run, never computed by product code. All other cases keep `data/expected/<id>.json` | X §S1 b8; A-09 | No circularity |
| D3-05 | Metric definitions | **Non-conforming case** = real-run expected proposal `block`. **False conforming** = proposal `release` on a case whose expected proposal ≠ `release` (numerator), over all evaluated cases with expected ≠ release (denominator) — also report over all evaluated cases. **Non-conformities caught** = non-conforming cases whose proposal ≠ `release` (report the `block` subset separately). **Abstention** = proposal `review` or status `error`. **Per-field accuracy** per critical field (D1-10, A-05, A-06): correct / unknown / wrong, where wrong includes an **invented value** (a confident value where the correct reading is unknown); measured on the model channel against the correct reading. **Time per certificate** = wall time from case start to proposal; **latency** = per HTTP request. **Seconds and cost per certificate** on the landing = mean (and median) over evaluated cases, with N | Y §S3 b4; D:L229-231; M-README "valores inventados" | Auditor recomputes from artifacts |
| D3-06 | "analyst's run" in Y §S3 Acceptance | The analyst does not run product evaluation as a deliverable (analyst mandate: no verification code, no acceptance). The candidate's evaluation run is the implementer's deliverable; the auditor's run is the independent one; pacing applies to every seat's calls (D3-02) | Analyst mandate; Y | — |
| D3-07 | Scans and the real model | Scans are sent to the model as page images; digital PDFs as text layer and/or image as the implementer designs, documented; the text-layer channel stays model-free (I3) | V §[13/10]; X:I3 | — |
| D3-08 | Stories vs evaluation | Stories are recorded real runs of cg-001..003, stored with receipt and F1 snapshot; the landing figures come only from the cg-004..030 evaluation artifacts (D3-03), never from the stories | Y §S3 b5–b6 | — |
