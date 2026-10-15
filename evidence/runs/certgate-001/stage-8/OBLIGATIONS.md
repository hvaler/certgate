# Obligation register — Stage 8 (model choice for live reading)

Run: certgate-001 · Stage: 8 · Register version: **R8.0** (analyst-zt7k, 2026-10-15). Append-only: later versions add amendments below and never delete a row.

- **Dispatch 6:** room msg `42b2a37d-9da8-45bf-871a-dd047100f569` from hugo.valer, posted 19:14:41Z, received by the analyst ~19:15Z.
  - Verbatim copy: `evidence/runs/certgate-001/DISPATCH-6.txt` (commit 1d8be64).
  - Operator correction: msg `b642c66d-586e-4f01-aceb-80430160e7d0`, which resolves the `{{…_HANDLE}}` placeholders. It is filed as `DISPATCH-6-CORRECTION.txt`.
  - Line references below (`D6:Lnn`) are line numbers in DISPATCH-6.txt.
- **Dispatches 1–5 remain in force** except where dispatch 6 changes them (D6:L5). Verbatim copies: `DISPATCH-1.txt` … `DISPATCH-5.txt`.

**Seats (resolved by b642c66d):**
- analyst `@hugo.valer/analyst-zt7k`
- implementer `@hugo.valer/implementer-zt7m`
- adversary `@hugo.valer/adversary-zt7n`
- auditor `@hugo.valer/auditor-zt7p`

Earlier handles in the evidence (`*-xwz3/4/5/6`) are the previous seats with the same roles.

**Input revision:** `feaadff8c90d4dc7bc913f83bf956b2d28bfae66` (tree `f9959353…`), GitHub `main` = local main. It contains the Stage 7 accepted product (final record at `21580169aa6fbee9c0e840407601281eb4b90fc7`, product candidate `cf97dfad`), plus these commits:
- **a27cbbc, bcaee78:** evidence-only log lines of the previous analyst. The dispatch called every commit after 2158016 an operator commit; the auditor's S8-00 corrects this for these two.
- **d3dd58d, e0de5c7:** the operator's room export and its redaction.
- **feaadff:** the operator's live-model record: README, DEPLOY.md, claims-map.json, `docs/diagrams/architecture.svg` and the label in `tools/diagrams.mjs`.

S8-00 (auditor) shows the product diff 2158016..feaadff is **empty** over src, public, api, config, data, evaluation, test, `tools/evaluate`, vercel.json, the package files, Dockerfile and tsconfig. The baseline suite at feaadff passes 486/486 in a fresh clone.

**Byte-identity reference for Stage 8 (D6:L26, L36):** feaadff.

**Sources:** `stage-8/SOURCES.sha256` (commit 1d8be64).
- 22 of 23 planning files are unchanged since Stage 7.
- `docs/01-REGLAS.md` changed: file time 2026-10-15 ~18:46Z, new SHA-256 `9666304d…`. The planning workspace is not under version control, so the change itself cannot be diffed.
- Its "Reglas vigentes" block (lines 4–52) was re-read on 2026-10-15. It has no rule about model choice, live reading or Token Factory model lists beyond those already cited in dispatches 2–5.

**Limits (D6:L33):**
- Stage 8: **300 min including final verification**, counted from 19:15Z on 2026-10-15, so it **ends 2026-10-16T00:15Z**. The addendum reserve is 30 min, so **no new work starts after 23:45Z**.
- At most **3 repair cycles**; **2 infrastructure retries per command**.
- **STAGE HARD STOP: 2026-10-17T08:00:00Z.** If Stage 8 is not accepted by then, the band reports where it stands and the human keeps feaadff on the site.
- Dispatch-wide HARD STOP: 2026-10-17T18:00:00Z.
- If the 300-minute budget runs out before the stage hard stop, the analyst publishes the outcome at that point (D1 autonomy). No new candidate is started past the budget.

## Facts the design must respect (D6:L14–L18, quoted in substance)

- **F-1 Measured models:** only Qwen3.8-27B (two runs, figures of record) and Gemma-4-31B-IT (Stage 5 comparison run) have an evaluation run in METRICS.md. No other model may be offered.
- **F-2 Changing list:** Token Factory's model list changes without notice. Gemma was listed on 2026-10-13 and absent on 2026-10-15. An offered model may disappear between page load and reading.
- **F-3 Time per reading:** Qwen3.8-27B takes about 77–90 s per reading (53.8 s live once); Gemma about 35 s. The Stage 6 deadline (270 s inside the 300 s function limit) must hold **for both**.
- **F-4 Stage 6 stands:** mandatory access code, global queue, at most 2 in flight, global hourly limit, I7 labels, no key or code in the browser.

## Obligations

| ID | Source | Obligation | Acceptance method | Owner |
|---|---|---|---|---|
| S8-00 | D6:L5 | **Baseline:** feaadff differs from accepted 2158016 only by the operator's redaction and live-model record commits (plus the two evidence-only log commits) | Auditor diff, **done** in S8-00-BASELINE-feaadff.md (msg e9ec6baa) | auditor |
| S8-01 | D6:L21, F-1 | **Closed offer set in code.** A constant lists exactly the models with an evaluation run in METRICS.md, Qwen3.8-27B and Gemma-4-31B-IT, each linked to its METRICS.md run(s). **No other id can ever be offered, from any input.** | Unit tests. A test ties the constant to METRICS.md's run list, so a model added to the code without a run fails. Mutant: an extra id in the set | implementer |
| S8-02 | D6:L21 | **LIVE_MODELS** is an optional env var of comma-separated model ids that **can only narrow** the set: offer = closed set ∩ LIVE_MODELS. An id outside the closed set is **ignored and logged by name** (server log only), never offered. Parsing rule is decided in A8-04 | Unit tests over unset, empty, whitespace, duplicates, an unknown id, a case variant, and only unknown ids. Mutants: union instead of intersection; an unknown id offered; no log | implementer |
| S8-03 | D6:L21 | **Without LIVE_MODELS the offer is MODEL_ID alone, so the site behaves exactly as today** (see A8-01 when MODEL_ID is not in the closed set) | Test with LIVE_MODELS unset. The live-disabled golden routes stay byte-identical (S8-13) | implementer |
| S8-04 | D6:L22 | **Model choice on the live-reading screen.** Each offered model shows **enabled** only if the server-side probe lists it: the same cached GET /models the F1 panel uses (Stage 6 H-11/J-09). An enabled model shows a link to its measured figures and "listed by the endpoint, checked <time>". An offered model the probe does not list shows **disabled** with "not listed by the endpoint now (checked <time>)". `<time>` is the probe's real `checked_at` | UI and route tests with a stubbed probe in the listed, unlisted and mixed states. Browser check at 375 and 1280 px. Mutants: an unlisted model enabled; a hard-coded time | implementer |
| S8-05 | D6:L22 | **Default selection:** MODEL_ID if it is offered and listed; otherwise the first listed offered model in the offer order (A8-05). **If no offered model is listed, live reading is disabled with that reason** shown | Tests for each branch | implementer |
| S8-06 | D6:L23 | **Server validation on POST:** the chosen model must be in the offer **and** listed by a probe no older than the probe cache (A8-02). Otherwise the job is **refused before any model call and before the hourly counter moves**, with a reason the page shows. A missing, empty, unoffered or unlisted model, or a stale or failed probe, is refused | Tests with a counting stub endpoint and a fake store: 0 chat calls, hourly count unchanged, no job created, a fixed reason class (J-07 style). Mutants: validation after INCR; listing not checked; offer not checked; missing model defaulting silently | implementer |
| S8-07 | D6:L23 | **No fallback.** A model the endpoint refuses during a reading (4xx) fails the job with the existing honest reason (`endpoint_4xx`). It **never** falls back to another model or to a stored result. The **model_mismatch guard stays**: the reported model must match the requested one, which is now the chosen model, not MODEL_ID | Tests: a stub 4xx means failed `endpoint_4xx`, exactly the chat calls the discipline allows, all with the chosen id, and no second model id. Stub reporting the other measured model → `model_mismatch`. Mutants: retry with another model; guard compares against MODEL_ID; guard removed | implementer |
| S8-08 | D6:L24 | **Receipts and the F1 snapshot record the requested model and the model as reported**, for every live job (done and failed where a reply exists) | Tests on the receipt and snapshot fields. Mutant: requested model dropped | implementer |
| S8-09 | D6:L24 | **Judge mode, the landing figures and the stories do not change** (Qwen3.8-27B, recorded). `public/figures.json`, `public/stories/`, the recorded flag and the judge-mode screens are byte-identical to feaadff | Auditor diff; existing tests | implementer; auditor |
| S8-10 | D6:L25 | **Plain statements** on the page, in README and in DEPLOY.md: the choice is limited to **measured** models and to **what Token Factory lists now**. The **dated record of the Gemma change** (feaadff text) is kept. **DEPLOY.md documents LIVE_MODELS**: name, not secret, format, the value the band names (A8-08), and narrowing only. It also lists the post-deploy checks, including **one real live reading with each model the endpoint lists at that time**. The CLAIMS.md rows C-85 and C-89, which still call Gemma the deployed model, are corrected (auditor note in e9ec6baa) | Auditor review; claims checks | implementer |
| S8-11 | D6:L25, D3/D4 E-11 | **Claims:** every new capability sentence (README, DEPLOY.md, page text in the claims scope, and diagram labels if touched) has a claims-map row. **0 unmapped, 0 stale**. The prize check E-17…E-19 still passes: no prize claim, and Gemma described as facts only | Claims and prize tests | implementer |
| S8-12 | D6:L26, L36 | **Byte-identical to feaadff except the model id in the request:** the reading path, the frozen prompt (SHA-256 `32fad2f9…`), the rules, `data/`, `config/`, `evaluation/`, `public/figures.json`, `public/stories/` and the evaluation figures in METRICS.md. **The request body differs from Stage 7 only in the `model` value** (A8-06). The exact hunks in `src/web/live-reader.ts` or the request builder are listed in the handoff | Auditor `git diff feaadff <cand>`. Stub-captured request bodies for cg-004 and cg-021 for Qwen **and** Gemma are byte-identical to feaadff's for the same model id. Prompt SHA unchanged | implementer; auditor |
| S8-13 | D6:L18, Stage 6 J-08/C-36/C-78 | **Stage 6 behaviour stands.** Access code (constant-time, count-first per-client limit, K-01/K-02), global queue, at most 2 in flight, global hourly limit, J-06 orphan derivation, reason classes, no key or code in the browser, I7. **With live reading disabled, every existing route answers byte for byte as at feaadff**; any change to the golden is listed and justified | Existing Stage 6 suites plus the disabled-site golden | implementer |
| S8-14 | F-3, D6:L17 | **Time budget for both models.** The worst-case queue wait, render, reading and any retry fit under `maxDuration` 300 s with ≥ 30 s margin for the **slowest offered model**. The 270 s job deadline holds. If a bounded retry does not fit for Qwen, it is not attempted, and the handoff says which | The T6-06-style test over every offered model | implementer |
| S8-15 | D6:L27 | **Tests (as listed by the dispatch):**<br>- offer = measured ∩ LIVE_MODELS;<br>- an id outside the measured set is never offered;<br>- listed and unlisted states from a stubbed probe;<br>- POST with an unoffered, unlisted or missing model is refused before any model call and without spending the hourly limit;<br>- the request body differs from Stage 7 only in the model id;<br>- receipts carry the requested and the reported model;<br>- no fallback;<br>- I7 labels;<br>- **a mutant for each new guard** | Suite, plus the adversary mutants, each with a named killer | implementer; adversary |
| S8-16 | D1 §Mutation, D6:L27/L36 | **Mutation:**<br>- Stage 8 mutants for each new guard: S8-01, S8-02, S8-04, S8-05, S8-06, S8-07 and S8-08;<br>- the Stage 6/7 mutants re-run where code moved (`app.ts`, live jobs, F1, `live-reader.ts`);<br>- each mutant run on a throwaway branch, never merged, with the failing test recorded | Adversary builds; auditor re-applies | adversary; auditor |
| S8-17 | D6:L36 | **Auditor, local:**<br>- the full suite from a clean clone;<br>- Docker with no network;<br>- the mutants re-applied;<br>- the S8-12 diff | Auditor record | auditor |
| S8-18 | D6:L30, L36 | **Auditor, live, after the human reports the LIVE_MODELS setting and the push.** Run DEPLOY.md against https://certgate-wheat.vercel.app and check that:<br>- the choice offers only measured models;<br>- an unlisted model is shown disabled, and the server refuses it **without spending the limit** (hourly count before and after);<br>- a POST naming a model outside the offer is refused;<br>- **one real live reading with each listed offered model** completes with that model as reported, labelled live, with its F1 snapshot;<br>- no secret appears in the bundle or the responses.<br>**Automatic rejection:** a model offered without an evaluation run, a fallback to another model or to a stored result, or the key reachable from the browser | Auditor live record | auditor |
| S8-19 | D6:L30 | **Human's part:** the human sets LIVE_MODELS in Vercel to the value DEPLOY.md names, pushes the accepted commit, and posts in the room when each is done. The band never deploys, pushes or submits, and never sees the access code or the key | Room messages | human; analyst (push request) |
| S8-20 | D6:L39 | **Final report addendum**, same shape as the earlier ones, with the deployment audit and the push request | Auditor verifies the addendum | analyst |

## Code facts at feaadff that bind the design

These come from an analyst read of the tree. File:line references are at feaadff; the implementer verifies them in the design note.

| ID | Fact | Consequence for Stage 8 |
|---|---|---|
| CF-01 | `src/web/live-reader.ts` is pinned byte-for-byte (`test/fixtures/stage6-baseline.json`, checked at `test/stage6-live.test.ts:690-704`, and the Stage 5 baseline). The model already arrives as `LiveReaderOptions.modelId`, and the body sets `model: this.o.modelId` (`live-reader.ts:315`) | **Stage 8 should not edit `live-reader.ts`.** It passes the chosen id through `modelId`. If an edit proves unavoidable, the hunk is listed and justified, and the S8-12 goldens still hold |
| CF-02 | **Pinned-file guards:**<br>- `test/stage5-gemma.test.ts:28-31` (`STAGE6_MAY_CHANGE`) and `test/support/stage7.mjs:6` (`STAGE7_MAY_CHANGE`) list the only files allowed to differ from earlier baselines.<br>- Every other file under `src/`, `public/`, `api/`, `data/` and `config/` is pinned, including `config.ts`, `f1.ts`, `types.ts`, `pipeline.ts`, `index.html` and `labels.js` | Stage 8 adds a **`STAGE8_MAY_CHANGE` set naming exactly the files it changes**, with feaadff as their baseline. Every other pinned file stays pinned. Widening a guard beyond the files actually changed, or deleting a guard, is a finding |
| CF-03 | `test/stage6-live.test.ts:705-711` (T6-10) fails if `/gemma-4-31b/i` appears in any .ts/.js/.html/.json/.css under `src/` or `public/`, stories excluded. Its purpose (R6.2 T6-10) is that no Gemma id is ever a **default** | See **A8-11** |
| CF-04 | The model_mismatch guard (`app.ts:398-400`) is a case-insensitive **substring** test of the requested id in the reported id, so it accepts `self-dploy/<id>`. It compares against `requested = cfg.modelId!` (`app.ts:388`) | It must compare against the **chosen** id (S8-07). The listing rule (A8-04) is stricter on near-miss ids; the adversary may challenge whether the guard should be made equally strict |
| CF-05 | The POST `/api/live/jobs` order in `startJob` (`app.ts:343-414`):<br>1. job gate;<br>2. body and size checks;<br>3. access code: count-first at `:360`, forgive at `:367`;<br>4. certificate and delivery-note validation;<br>5. `f1Now()` at `:384`, with 503 if off;<br>6. `jobs.admit(...)` at `:387`, where `admit` does the queue ZADD, the busy check, then the **hourly INCR at `live-jobs.ts:143`** and the job SET | The model checks go **between step 5 and `:387`**, using the `f1Now()` probe (`model_ids`, `checked_at`) as A8-02/A8-03 require. `cfg.modelId!` at `:387`, `:388` and `:412` becomes the chosen id |
| CF-06 | The F1 probe: `F1_CACHE_MS = 60_000` (`f1.ts:279`); the cross-instance cache `f1Now()` (`app.ts:308-327`) uses keys `certgate:live:f1` (60 s) and `certgate:live:f1:last` (3600 s). The fallback to `f1:last` happens when the lock is held | **A probe taken from `f1:last` older than 60 s must not validate a POST** (A8-02). That needs a test |
| CF-07 | **The legacy synchronous route `/api/live/read`** (`app.ts:207-265`) builds a reader with `cfg.modelId ?? "unknown"` and has **no mismatch guard** | The design note states whether this route can reach the endpoint in any configuration. If it can, it obeys S8-01/A8-01 (never an unmeasured model) and is covered by a test. If it cannot, a test shows that |
| CF-08 | The F1 snapshot (`types.ts:211-247`) has `model_ids` and `model_reported` but **no requested-model field**. The receipt has `reader.requested_model_id` and `reader.model_id` | S8-08 needs the requested model in the F1 snapshot too. That touches pinned `types.ts`, under CF-02 |
| CF-09 | The request-body golden is `test/stage5-gemma.test.ts:62-99`: the Qwen cg-004 body hash `69cb4771…`, and the Gemma body equal to Qwen except `model` | These goldens stay unchanged and are the S8-12 killers |
| CF-10 | The `/models` probe ids come from `data[].id` (`f1.ts:340`). The stub endpoint lists only `certgate-test-stub` (`test/support/stub-endpoint.mjs:17,28`) | The stub must be made able to list a chosen set of ids, in a test-support file |

## Ambiguities and reasoned decisions

These are interpretations, not source requirements. The adversary and auditor may challenge any of them; a challenge accepted in R8.1 replaces the decision.

| ID | Ambiguity | Decision and reason |
|---|---|---|
| A8-01 | **"Without LIVE_MODELS the offer is MODEL_ID alone"** vs **"an id outside [the measured set] is never offered"** and the automatic rejection "a model offered without an evaluation run", when MODEL_ID itself is not a measured model | The closed set wins. Offer = {MODEL_ID} ∩ closed set. If MODEL_ID is not measured, the offer is empty: live reading is disabled with a plain reason, and MODEL_ID is logged by name. Today MODEL_ID is Qwen3.8-27B, so "behaves exactly as today" holds. Reason: the acceptance (D6:L36) makes an unmeasured offer an automatic rejection |
| A8-02 | **"listed by a probe no older than the probe cache"** | The probe used for the decision has `checked_at` ≥ now − the F1 cache TTL (60 s, C-84/J-09). If the cached probe is older, the POST path refreshes it through the same global cache: at most one GET /models per period across instances. The refresh happens **after** the access-code check and **before** the hourly INCR. If the probe fails or is unavailable, the POST is refused (fail closed) with a reason class, no job and no counter change. The probe is never a model call. The implementer's design note states the exact order |
| A8-03 | **Order of checks on POST** relative to the access code | Keep the Stage 6 order for the existing checks: well-formed request and size cap, then the access code (count-first per client, K-01/K-02), **then** the model checks (offer, then probe freshness and listing), **then** the hourly INCR, admission and the queue. Reason: an unauthenticated POST must not trigger an endpoint probe, and an authenticated but invalid model must not spend the hourly limit. A refused model is a refusal, not a job (J-16) |
| A8-04 | **Id matching and LIVE_MODELS parsing** | LIVE_MODELS is split on commas, entries are trimmed, empty entries and duplicates are dropped, and unset or empty means "not set". An entry matches a closed-set id **exactly, ignoring case**. Anything else is ignored and logged by name. For **listing**, an offered id is listed when the probe's id list contains it under the same normalisation the model_mismatch guard uses (J-10: case-insensitive, provider-prefix tolerant, e.g. `self-dploy/Qwen3.8-27B`). Near-miss ids, for example `Qwen3.8-27B-FP8` or `Gemma-4-31B`, must **not** count as listed. Each case has a test. Raw probe ids never reach the page except as the offered id's own label |
| A8-05 | **"the first listed offered model"** | The offer order is the closed-set order in code: Qwen3.8-27B first (figures of record), then Gemma-4-31B-IT. LIVE_MODELS narrows the set but does not reorder it. Deterministic, and independent of env formatting |
| A8-06 | **D6:L26 wording:** "Nothing in Stage 8 changes the reading path except the model id in the request, the frozen prompt, the rules or the evaluation figures" | Read with D6:L36: the reading path, prompt, rules and figures are byte-identical to feaadff, **except** that the request's `model` value is the chosen model. Nothing else in the body changes. The Stage 5 rule stands that Gemma and Qwen requests differ only where the accepted Stage 5 code already makes them differ, and the auditor checks that by golden |
| A8-07 | **"the model as reported"** for a job that fails before a reply | A failed job with no endpoint reply records the requested model and `reported: null` with its reason class, never a guessed reported model |
| A8-08 | **LIVE_MODELS value to name in DEPLOY.md** | `Qwen3.8-27B,Gemma-4-31B-IT`, as the dispatch expects (D6:L30). Gemma being unlisted today is exactly the case the page shows as disabled. DEPLOY.md also says that leaving it unset keeps today's single-model behaviour |
| A8-09 | **"one real live reading with each model the endpoint lists at that time"** when only one is listed | Only listed models are read live. If Gemma is unlisted at audit time, the "unlisted model shown disabled and refused" check is done live on Gemma. If both are listed, there is no unlisted model to show live, and that check rests on the local stubbed tests; the record says so. A listing change during the audit is recorded with the probe's `checked_at` |
| A8-10 | **Who may call the real endpoint in Stage 8** | See D8-02 |
| A8-11 | **CF-03 vs D6:L21.** The T6-10 test forbids the Gemma id anywhere under `src/` and `public/`, while dispatch 6 requires Gemma-4-31B-IT in a closed set "in the code" | Dispatch 6 is the later instruction, and T6-10's purpose (no Gemma **default**) is kept. The Gemma id may appear in **exactly one** module that holds the closed set, with its METRICS run link. T6-10 is narrowed to "nowhere else under src/ and public/". New tests show that no default path yields Gemma: the MODEL_ID default, the default selection when MODEL_ID is listed, and the container default. The test is narrowed, never deleted, and its narrowing is listed in the handoff. Mutant: a Gemma default reached from config |
| A8-12 | **Page text and claims scope.** The new page text ("listed by the endpoint, checked <time>", "not listed by the endpoint now (checked <time>)", the limited-choice statement) | The page text uses the dispatch's wording. The plain statement of D6:L25 appears on the live-reading screen. E-11 still holds: no positive claim that the public site reads live beyond what Stage 6 accepted |

## Decisions

| ID | Decision |
|---|---|
| D8-01 | **Order of work:**<br>1. R8.0 and the handoffs.<br>2. The adversary challenges R8.0 (target **20:35Z**). In parallel, the implementer posts a short **design note** (target **20:35Z**): offer computation, probe reuse and freshness, POST order with line references, UI states, receipt and snapshot fields, time budget per model, the files touched and the expected `live-reader.ts` hunk.<br>3. Analyst ruling R8.1 (target **20:50Z**).<br>4. Candidate 1, frozen at a full commit id.<br>5. Adversary and auditor local checks, in parallel, each in its own clean clone.<br>6. Local verdict.<br>7. Push request and the human's steps.<br>8. Auditor live checks (S8-18) and the final verdict.<br>9. Addendum.<br>Coding may start before the ruling, but the freeze follows it |
| D8-02 | **Endpoint lease and calling discipline (D2) unchanged:** at most 2 in flight, Retry-After honoured, retry only 429/5xx, at most 3 attempts, 300 s timeout, GET /usage before and after every real reading. Every endpoint use is announced as **ENDPOINT LEASE TAKEN / RELEASED** in the room; check that the last lease message is RELEASED before taking one.<br>- **Implementer:** at most 2 real readings for a container smoke test, one per listed offered model, plus GET /models probes.<br>- **Auditor (live, S8-18):** one reading per listed offered model, plus at most 1 infrastructure retry, so at most 3 in total.<br>- **Adversary:** no endpoint calls unless granted in the room.<br>All other work uses stubs |
| D8-03 | **Heavy local work is serialized** across seats while host memory is low (D7-04 carried). Announce **HEAVY WORK START / DONE** in the room |
| D8-04 | **Never write any property of a secret** (D7-03 carried): value, length, character class or hash prefix of the access code, the key or the base URL path. The endpoint host name may appear |
| D8-05 | **Shared checkout C:\nexus\dev\certgate:** one writer at a time, under a write lease granted by the analyst. Reviewers use their own clean clones. Candidates and rejected candidates are never rewritten |


## R8.0a: operator amendment 1 (msg 79b781e6, 2026-10-15 ~19:27Z), analyst-zt7k

The verbatim copy is `evidence/runs/certgate-001/DISPATCH-6-AMENDMENT-1.txt`, and `Am1 §n` below refers to its numbered points. It **widens** S8-01…S8-08 and S8-10, S8-15 and S8-18. Everything else in dispatches 1–6 and in R8.0 stands, except where this section changes it.

**Limits (Am1 preamble):**
- Stage 8 is now **480 min**, from 19:15Z, so it **ends 2026-10-16T03:15Z**. With the 30-minute addendum reserve, **no new work starts after 02:45Z**.
- At most 3 repair cycles.
- Stage hard stop unchanged: **2026-10-17T08:00Z**.

**Clock correction:** R8.0 and the handoff were committed and sent between 19:18Z and 19:24Z (machine time). The 20:45Z and 21:00Z targets stand.

| ID | Source | Obligation | Acceptance method | Owner |
|---|---|---|---|---|
| S8-21 | Am1 §1 | **The whole list, in real time.** The live-reading screen shows **every model id** that the server-side GET /models probe returns now (the same cache as F1, as in S8-04), with the probe time. The ids are shown in three groups:<br>(a) **MEASURED** (Qwen3.8-27B, Gemma-4-31B-IT): selectable when listed; the default comes **only** from this group;<br>(b) **NOT EVALUATED · EXPERIMENTAL**;<br>(c) **LISTED, NOT OFFERED**.<br>An id that disappears from the list is disabled. **An id never seen in a probe is never offered** | Route and UI tests with a stubbed `/models` returning a mixed list. Browser check at 375 and 1280 px. Mutants: a listed id missing from the page; a default from (b) | implementer |
| S8-22 | Am1 §1(b) | **The experimental set.** A listed model is in (b) only if the band has shown, **in this stage**, that it accepts CertGate's request (the certificate page as an image plus the frozen prompt, through the unchanged request builder) and returns a reply that passes the **existing response schema**. The evidence is **one real probe per model on one dataset certificate**, within the D2 discipline. It is committed under `evidence/runs/certgate-001/stage-8/probes/`, with the requested model id, the model as reported, the time, the tokens and the parsed-or-failed result. **The set of probed-and-passed ids is committed in the code.** A model is selectable in (b) only if it is in that set **and** listed now. Selecting one needs an explicit acknowledgement on the page: "this model is not evaluated; no figure of CertGate applies to it" | A test ties the code set to the committed probe files: every id in the set has a passing probe file, and a failed probe is never in the set. Mutants: an id in the set without evidence; selection without the acknowledgement | implementer |
| S8-23 | Am1 §1(c) | **Listed, not offered:** every other listed id is shown **disabled with its reason**: "no image probe", "probe failed", or "not a chat model" (A8-13) | Tests with a stubbed list containing each reason | implementer |
| S8-24 | Am1 §2 | **Labels and receipts.**<br>- A reading with an experimental model is labelled **"not evaluated"** next to its proposal, in its receipt (`evaluated: false`, with the probe evidence path) and in its F1 snapshot.<br>- **Nothing** on the page, README, METRICS or slides-facing text attaches the measured figures to an experimental model.<br>- The rules, the two-channel check, the review triggers and the person's decision apply **unchanged to every model**.<br>- No fallback between models | Tests on the receipt, F1 and the page text. Mutants: label dropped; `evaluated: true` on an experimental reading; measured figures shown beside an experimental model | implementer |
| S8-25 | Am1 §3 | **Server checks, extended:** a POST naming an experimental model **without the acknowledgement**, a model **not in the probed set**, or an **unlisted** model is refused **before any model call and without spending the hourly limit** (as S8-06, with the same order as A8-03) | Counting stub and fake store: 0 chat calls and the hourly count unchanged. Mutants for each refusal | implementer |
| S8-26 | Am1 §4 | **LIVE_MODELS narrows both (a) and (b).** Without it, (a) is MODEL_ID only and (b) is empty, so the site behaves as today until the human sets it. **DEPLOY.md names the value to set** (A8-15) | Tests for unset and set | implementer |
| S8-27 | Am1 §1(b), D2 | **The probes themselves.** They are real endpoint calls by the implementer, using a **committed probe script** that drives the unchanged request builder. Probe budget and lease rules are in D8-06 | Probe files plus GET /usage before and after the probe batch | implementer |
| S8-28 | Am1 §5 | **Auditor additions:**<br>- the probe evidence for **every id** in the committed experimental set;<br>- no experimental model is ever the default or appears without its label;<br>- the receipt carries `evaluated: false`;<br>- a POST without the acknowledgement is refused;<br>- **on the deployed site, one real live reading with one experimental model listed at that time.** If none is listed, the auditor records that and the check is skipped.<br>**Automatic rejection, added:** a model offered without probe evidence, or measured figures presented for an experimental model | Auditor local and live records | auditor |

**Amendment decisions:**

| ID | Decision |
|---|---|
| A8-13 | **Group (c) reasons come only from committed evidence or from the probe's own `/models` data, never guessed.**<br>- "probe failed": a committed failed probe exists for that id.<br>- "not a chat model": the committed probe shows the endpoint refused chat completions for that id, or the committed `/models` snapshot marks it as not a chat model.<br>- "no image probe": any other listed id, including ids first seen after the probe batch.<br>Each reason has a test |
| A8-14 | **With live reading enabled, the full list (S8-21) is shown whether or not LIVE_MODELS is set,** because Am1 §1 requires the screen to show every listed id. LIVE_MODELS only changes what is **selectable**: unset means (a) = {MODEL_ID} ∩ measured and (b) = ∅. The ids that would be offered with LIVE_MODELS set are then shown in (c) with the reason "not enabled on this site". This is an analyst addition and is open to challenge. With live reading **disabled**, every existing route stays byte-identical to feaadff (S8-13) |
| A8-15 | **The LIVE_MODELS value DEPLOY.md names:** `Qwen3.8-27B,Gemma-4-31B-IT` followed by the committed experimental ids, in code order. This supersedes A8-08 |
| A8-16 | **What a probe passes.** It drives the **same request builder** (`live-reader.ts`, unchanged) with `modelId` = the probed id, on **one dataset scan certificate**: a page image, no text layer, the same one for every probe and named in the design note. Pass means:<br>- HTTP 200;<br>- the reply parses under the existing strict response schema (`model-output.ts` / `strict-json.ts`, unchanged);<br>- the reported model matches the requested id under the model_mismatch guard.<br>**Correctness of the values is not part of the pass**, and the evidence must say so. Anything else fails, and the failure reason is recorded |
| A8-17 | **Probe order:** the probes run, and their evidence and the code set are committed, **before candidate 1 is frozen**. A model listed after the batch is "no image probe" and is never offered. Re-probing a failed id is allowed once, only for a 429/5xx/timeout infrastructure failure, and counts as that command's infrastructure retry |
| A8-18 | **Gemma literal and the experimental ids (CF-03, A8-11).** The experimental id set lives in the same single closed-set module as the measured set. The T6-10 narrowing covers both, and the "no default from (b)" tests are added |

**Decisions changed:**

| ID | Decision |
|---|---|
| D8-06 | **Probe budget.**<br>- At most **one probe call per listed id** that is not a measured model, with up to 3 attempts on 429/5xx (D2), at most 2 in flight, Retry-After honoured and a 300 s timeout.<br>- At most **12 ids** are probed. If more are listed, the first 12 in the `/models` order are probed and the rest go to (c) as "no image probe", recorded.<br>- Ids the `/models` snapshot marks as non-chat (for example embeddings or rerankers) are not probed: they are (c) "not a chat model", with the snapshot committed.<br>- GET /usage is read before and after the batch.<br>- The batch runs under one announced **ENDPOINT LEASE TAKEN/RELEASED**. Its first step is one GET /models snapshot, committed with the evidence |
| D8-02-bis | **Endpoint lease amended.**<br>- **Implementer:** the D8-06 probe batch, plus at most 2 container smoke readings (one per listed measured model), plus at most 1 smoke reading with one experimental model.<br>- **Auditor (live):** one reading per listed measured model, plus one with one listed experimental model (S8-28), plus at most 1 infrastructure retry, so **at most 4** in total.<br>- **Adversary:** none unless granted |


## R8.1: rulings on adversary CH8-01…CH8-36 (msgs ef22b976, 53ff3d65) and auditor T8 / C-1…C-6 (msgs 314563fa, f439150d), analyst-zt7k

The design note (implementer, due 20:45Z) is ruled separately in R8.2. These rulings bind it and candidate 1, and every item with a killer needs that killer named in the candidate handoff.

### Auditor rules

| ID | Ruling |
|---|---|
| L-T8 | **T8-01…T8-37 are adopted as the acceptance rules for S8-12, S8-17, S8-18 and S8-28**, with the R8.0a delta in f439150d. The record is `stage-8/auditor/T8-RULES.md`, committed by the auditor under a lease. One point of T8-01, which pins `src/pipeline.ts`, `src/receipt.ts` and `src/web/deadline-reader.ts`: the new receipt and F1 fields (S8-08, S8-24, C-2) are **added after `processCase` in `app.ts`**, as the job already does for `r.receipt.f1` today. `src/types.ts` may change for the types. Those three files stay byte-identical |
| L-RA | **R-A…R-F, the auditor's reading of "a model offered without an evaluation run", are confirmed.**<br>- A model offered in (a), or carrying a measured figure or link, without an evaluation run means reject.<br>- A model in (b) without committed passing probe evidence means reject.<br>- Measured figures next to an experimental model means reject.<br>- Fallback means reject.<br>- The key reachable from the browser means reject.<br>- An experimental model as a default, or shown without its label, means reject |
| L-C1 | **C-1 / CH8-03 / CH8-30 adopted: one strict identity rule.** One exported function decides **listing, the mismatch guard and the probe pass**. Ids are equal ignoring ASCII case, optionally after exactly one `<provider>/` prefix on the reported or listed side, and nothing else. `self-dploy/Qwen3.8-27B` matches; `Qwen3.8-27B-FP8`, `xQwen3.8-27B` and `Gemma-4-31B-IT-v2` do not. This tightens the Stage 6 guard on purpose. The existing prefix test stays, and the substring-accepting cases become `model_mismatch`. Killers: CH8-03 and CH8-30. Mutants: M8-15 (substring restored) and adversary 12/29 |
| L-C2 | **C-2 adopted.** The job record and the receipt store `listing_checked_at`, the `checked_at` of the probe snapshot that validated the POST, so freshness can be verified after the fact |
| L-C4 | **C-4 adopted.** The auditor may make at most **8 direct GET /models reads** for T8-31, in addition to the D8-02-bis cap of **4 live readings**, all under announced leases |
| L-C5 | **C-5 adopted.** Measured takes precedence: an id in the measured set is never in (b), whatever LIVE_MODELS or the probe set say. It has its own test |

### Adversary challenge

| ID | Ruling |
|---|---|
| L-01 | **CH8-01 adopted.** Freshness is `now − snapshot.checked_at ≤ 60 000 ms`, computed from the snapshot's own `checked_at`. Store TTL or the presence of a key is never freshness. An older snapshot triggers one refresh through `f1Now()`, or a fail-closed refusal. Killers as written, including the 61-second `f1:last` case |
| L-02 | **CH8-02 adopted.** While another instance holds the lock and no fresh snapshot exists, the POST is refused with a fixed class, `probe_unavailable` (the design note gives the text). It never validates against `f1:last`. The design note states the worst-case refusal window |
| L-04 | **CH8-04 adopted.** The POST `model` must be a string. It matches a closed-set or experimental-set entry **exactly, ignoring ASCII case**; no trimming and no Unicode folding. The request, the job record, the receipt and the guard all use the **constant's** spelling. A non-string, padded or look-alike value is refused with 400 and a fixed class, before any model call or INCR. Never a 500. Killers as written |
| L-05 | **CH8-05 adopted.** The legacy `/api/live/read` calls the endpoint only with `MODEL_ID` canonicalised against the **measured** set (never (b)), checked **before** its hourly INCR. Otherwise it is refused, with no call and no unit spent. On the deployed site it stays 503, as at feaadff (T8-37). Killer as written; mutant 19 |
| L-06 | **CH8-06 adopted; it corrects A8-11.** "Gemma is never a default **in the absence of configuration**." The code default for MODEL_ID is not Gemma, and the container default stays Qwen. Gemma becomes the default only under the D6:L22 rule (MODEL_ID unlisted or not offered, Gemma offered and listed). The three killers stand as written. T6-10's exception list must equal exactly the one closed-set module, and a second file fails |
| L-07 | **CH8-07 adopted.** With live reading disabled, `/api/live/status` and every other route are byte-identical to the feaadff disabled-site golden. The offer and listing fields appear only when live reading is enabled |
| L-08 | **CH8-08 adopted; it withdraws A8-04's sentence** "Raw probe ids never reach the page…". Endpoint ids are untrusted input:<br>- rendered as text only (`textContent`, or escaped);<br>- never in `innerHTML`, an unescaped attribute or a URL;<br>- each id capped at 200 characters for display, with the truncation marked;<br>- at most 100 ids shown, with "+N more" marked;<br>- a (c) id is never a selectable value.<br>Killers as written, including the dialog listener |
| L-09 | **CH8-09 adopted.** Model validation completes before `jobs.admit`. A refused POST leaves every store key unchanged, apart from the net-zero count-then-forgive of the code attempt. Killer as written |
| L-10 | **CH8-10 (a)–(d) adopted as written.** This is the order of A8-03, made testable |
| L-11 | **CH8-11 adopted.** The requested model, `evaluated` and the probe path go into **each receipt's own** F1 copy, never into the shared `f1`/`f1:last` store value. Killer: two concurrent jobs |
| L-12 | **CH8-12 adopted.** The receipt view and the exported receipt show both the requested and the reported model. A `model_mismatch` job keeps the reported id; with no reply it is `reported: null` (A8-07). The page change for this is allowed in `public/app.js` |
| L-13 | **CH8-13 adopted.** An empty offer from LIVE_MODELS disables live reading with its own reason ("no measured or probed model is enabled on this site"). It never falls back to MODEL_ID. Ignored ids go to the server log only. Mutant 3 |
| L-14 | **CH8-14 adopted.** The T6-06 test is parametrised over every offered model, with the stub delays as written. The 270 s deadline holds, and failures carry the honest `timeout` class |
| L-15 | **CH8-15 adopted.** A refusal reason is shown, the status is re-read, the choice control updates, and nothing stored or other is started |
| L-16 | **CH8-16 adopted.** Each measured entry links to `evaluation/runs/<run>`, whose recorded model id equals the entry, and that run appears in METRICS.md's run table. The two mutants stand |
| L-17 | **CH8-17 adopted.** `STAGE8_MAY_CHANGE` equals the actual `git diff --name-only feaadff <cand>` over the pinned roots. Earlier baselines are not re-based for unchanged files. No pin assertion is removed or loosened |
| L-18 | **CH8-18 accepted.** The line references are corrected: CF-01 is `live-reader.ts:220`, CF-06 `f1.ts:17`, and CF-10 `f1.ts:78`. The design note cites lines it has verified itself |
| L-19 | **CH8-19 [OBS] noted.** O6-03 and the unit spent on a mismatch are Stage 6 residuals, outside the Stage 8 contract. Stage 8 must not make them worse |
| L-20 | **CH8-20 adopted.** Evidence path: `evidence/runs/certgate-001/stage-8/probes/`, holding:<br>- one `<id>.json` per probed id, with the fields of CH8-20 plus the request-body SHA-256 (CH8-21) and the duration (CH8-29);<br>- `models-snapshot.json`, the GET /models response bodies only;<br>- `usage-before.json` and `usage-after.json`;<br>- `BATCH.md`, with the counts against the cap.<br>The set is a code constant. A test ties it to the files. The three mutants stand |
| L-21 | **CH8-21 adopted.** The probe drives `LiveReader` (or `DeadlineReader`) with the canonical id on the probe certificate. The body SHA-256 is recorded and must equal the stub-captured body for the same certificate and id. A separately built request does not count |
| L-22 | **CH8-22 and CH8-31 adopted; the name-pattern idea is withdrawn by its author and rejected.** Rules:<br>- **Owner:** the implementer runs the batch.<br>- **Inputs:** only dataset certificates.<br>- **"not a chat model"** comes only from a JSON field and value in the committed `/models` snapshot, named in the design note, or from a committed probe refusal. If no such field exists, every listed non-measured id up to the cap is probed.<br>- **No id-name heuristics** |
| L-23 | **CH8-23 adopted.** The acknowledgement is a dedicated POST field, strictly `=== true`, required only for (b). It is checked after the code and before the probe refresh, INCR or ZADD. Every other value is refused. On a measured model it is ignored. The design note names the field. The three mutants stand |
| L-24 | **CH8-24, ruling.** If no measured model is offered and listed, but an experimental one is offered and listed, **live reading stays enabled with no preselection**: the visitor must pick and acknowledge. A POST without a model is refused. Reason: Am1 §1(a) says the default comes only from (a), and Am1 §1(b) makes listed probed models selectable. D6:L22's "if none is listed, disabled" applies to the offer, which now includes (b). An (a)-only or (b)-only offer with nothing listed stays disabled with its reason |
| L-25 | **CH8-25 adopted.** The label and flag appear in the proposal block, the receipt (`evaluated: false`, `probe_evidence: <path>`), the export, the receipt's F1 copy and the job view. Measured readings carry `evaluated: true` and their run link. No `figures.json` figure, METRICS link or "figures of record" text sits next to an experimental reading |
| L-26 | **CH8-26 and CH8-32 adopted. They refine A8-13 and A8-14.**<br>- **Measured ids are always shown in group (a).** If listed but not offered, they are disabled there with "not enabled on this site". If not listed, they show "not listed by the endpoint now (checked <time>)".<br>- **Group (c) holds only non-measured ids**, with these reasons:<br>  - "not enabled on this site": in the experimental set but not enabled by LIVE_MODELS;<br>  - "probe failed";<br>  - "not a chat model" (L-22);<br>  - "no image probe".<br>Each has its exact string and a killer |
| L-27 | **CH8-27: A8-14 stands, confirmed by the auditor in f439150d.** "As today" covers selection and the request. The groups are shown when live reading is enabled, and the disabled-site golden stays byte-identical (L-07) |
| L-28 | **CH8-28 adopted.** offer(a) = measured ∩ LIVE_MODELS; offer(b) = experimental set ∩ LIVE_MODELS. LIVE_MODELS can never promote a (c) id. Mutant 26 |
| L-29 | **CH8-29 adopted, fail-closed.** The probe records its duration. An id whose probe exceeded the deployed read budget (210 s) is **not** admitted to the set. Admitted ids keep the 270 s deadline, the `timeout` class and no fallback. The CH8-14 test is extended to an experimental id with a 200 s stub delay |
| L-33 | **CH8-33 adopted. This supersedes the retry counts of D8-06 and A8-17.**<br>- The probe batch may make at most **24 chat calls in total**, enforced by a counter in the probe script. The script stops at the cap, and the remaining ids are recorded as `failed (infrastructure, cap reached)` and kept out of the set.<br>- Within the cap, each id gets one probe, with up to 3 attempts on 429/5xx (D2).<br>- The A8-17 re-probe is **withdrawn**.<br>- At most 12 ids. GET /usage is read before and after. One lease covers the batch.<br>Killer: a stub that always answers 503 |
| L-34 | **CH8-34 adopted.** Probe evidence keeps:<br>- model ids, the reported model, times, tokens and duration;<br>- the parsed result or failure class;<br>- the body SHA-256;<br>- the reply content needed for the auditor's offline re-parse (T8-21). It is the model's JSON output, not provider error text.<br>It keeps no headers, no `Authorization`, no base-URL path and no raw provider error text. The secret scan covers `probes/` |
| L-35 | **CH8-35 [OBS], recommended, not required.** The probe evidence records the count of non-null critical fields and the resulting proposal, explicitly without judging correctness |
| L-36 | **CH8-36 [OBS], recommended, not required.** The page shows "probed <date>" next to the experimental label |

**Corrections to R8.0:**
- **A8-04, last sentence:** withdrawn (L-08).
- **A8-11:** reworded (L-06).
- **A8-13 and A8-14:** refined (L-26).
- **A8-17 re-probe:** withdrawn (L-33).
- **CF-01, CF-06, CF-10 line references:** corrected (L-18).
- **D8-02-bis:** the auditor's direct GET /models cap is added (L-C4).

**Timing:**
- **R8.2:** the ruling on the design note, within about 15 minutes of receiving it and of the adversary's DN8 challenge.
- **The probe batch** may run as soon as R8.2 approves the probe script and the probe certificate. If the design note arrives early, R8.2 comes early.

**L-37, sizing GET /models (implementer msg 7fd13df7, 19:30:59.960Z).** 11 ids are listed. **Gemma-4-31B-IT is not listed**; Qwen3.8-27B is listed. Per the snapshot's own input and output metadata:
- **image input:** 6 non-measured ids;
- **text-only input:** 3 ids;
- **OCR output, not chat:** 1 id.

**Rulings:**
- **(i)** The probe batch covers the **6 image-input ids only**, within the L-33 cap of 24 calls.
- **(ii)** Text-only ids are not probed. They go to (c) with the reason **"no image probe"**. The design note names the snapshot field that marks them.
- **(iii)** The OCR-output id goes to (c) as **"not a chat model"**, by the named output field.
- **(iv)** The snapshot `models-sizing.json` is committed, and the batch's own first GET /models snapshot is committed too (D8-06).

Live, A8-09 means "unlisted shown disabled and refused" can be checked on Gemma, if it is still unlisted at audit time.

## R8.2a: ruling on implementer design note msg 4328e0ec, probe-gating items (analyst-zt7k)

The rest of the note is ruled in R8.2, after the adversary's DN8 challenge.

| ID | Ruling |
|---|---|
| P-01 | **Probe script and certificate approved.**<br>- The script is `tools/probe-models.mjs`. It drives the unchanged `LiveReader` with the canonical id.<br>- The certificate is **cg-016**, a dataset scan with a page image and no text layer, neither a story nor a sample. The auditor verifies that it has no text layer.<br>- Pass needs all of: HTTP 200; `parseModelOutput()` accepts the reply; `sameModel(id, reported)`; elapsed ≤ 210 000 ms. Correctness of the values is not judged, and the record says so.<br>- Records: the field list of design note §9, which meets L-20, L-21 and L-34 |
| P-02 | **Batch cap: 18 chat calls**, counted and enforced by the script. That is within L-33's 24, so L-33 is satisfied. A8-17's single re-probe falls inside the cap |
| P-03 | **Classification from the committed snapshot approved, with no name heuristics (L-22, L-37, CH8-31):**<br>- an `output` array without `"text"` is **"not a chat model"**;<br>- `architecture.input_modalities` without `"image"` is **"no image probe"**;<br>- measured ids are skipped.<br>Text-only ids are **not** probed |
| P-04 | **Order.** The probe script, and `sameModel` with its unit tests, are **committed on `s8-impl` before the batch runs**. The lease message names that commit. The batch then runs under one announced ENDPOINT LEASE, with GET /usage before and after. The evidence and the code sets (`EXPERIMENTAL_MODELS`, `PROBE_OUTCOMES`) are committed afterwards, and that commit is an ancestor of candidate 1 (T8-21). **The batch may run as soon as P-04's commit exists.** It does not wait for R8.2 |
| P-05 | **Measured figures link (D6:L22): approved as text.** The METRICS.md section name and run directory are shown as text, from the API, because B-17 forbids third-party URLs in page assets and METRICS.md is not served. "Linked to its run" is satisfied by the code constant naming the run directory (CH8-16 tie) and by that text on the page. The README states where the figures are |
| P-06 | **The container smoke plan is approved:** 1 Qwen reading plus 1 experimental reading, since Gemma is unlisted. It runs under a lease after the candidate builds, within D8-02-bis |


## R8.2: ruling on design note 4328e0ec (with the implementer's alignment 3805afb4), adversary DN8-01…12 (6ff43afd, 707bdb93) and auditor note bb51e0bc (analyst-zt7k)

**The design note is approved** as amended below. With R8.1, R8.2a and R8.2b it is binding on candidate 1, and the candidate handoff answers each P, Q and DN item by number.

**R8.2b, sent as msg c00521b9, recorded here:**
- **P-02 corrected:** no re-probe at all. Each image-input id gets exactly one probe, with at most 3 attempts on 429/5xx. Infrastructure failure means (c) "probe failed" with its class. The hard cap is 18 chat calls, and BATCH.md records the calls per id.
- **P-07, provenance:** each probe file records the P-04 commit and the SHA-256 of the `dist/` it imported. That commit is an ancestor of candidate 1, with `live-reader.ts` and `model-output.ts` byte-identical to feaadff.

| ID | Ruling |
|---|---|
| Q-01 | **The refusal classes are fixed.** Each has one fixed text, as in design note §3:<br>- `model_missing` (400);<br>- `model_not_offered` (400);<br>- `model_ack_required` (400);<br>- **`probe_unavailable`** (503, replacing the note's `model_list_stale` per L-02 and alignment 3805afb4), for stale, future-dated or lock-held snapshots;<br>- `model_unlisted` (409).<br>Receipt and job field: **`listing_checked_at`** (L-C2) |
| Q-02 | **DN8-01 and auditor item 2: the f1Now() hunks are allowed only if the one-probe-per-period rule holds.**<br>- Across 3 instances sharing one store, a fake clock, and traffic every 5 s for 10 simulated minutes, the upstream `/models` calls must be **≤ 11**. The feaadff baseline count is recorded beside it.<br>- The existing Stage 6 test "10 concurrent /api/f1 calls on two instances … one GET /models" stays **unchanged and unloosened**.<br>- The auditor's two-instance case with a store copy about 59 s old must not double the probes.<br>- If these cannot all hold with hunk (ii), **drop (ii)**: keep the 60 s lock and accept the 3–60 s `probe_unavailable` window. Hunk (i) stays only if it also passes |
| Q-03 | **DN8-02 adopted.** A snapshot whose age is below **−5 s** (`checked_at` in the future) is stale, and gets `probe_unavailable`, 0 chat calls and no counter change |
| Q-04 | **DN8-03: residual accepted. `f1.ts` stays pinned.** An endpoint id longer than 200 characters is dropped by the accepted Stage 6 sanitiser (`f1.ts:38`). The live screen says, as fixed text: "Model ids longer than 200 characters are not shown." The README limitations say it too. Reasons: f1.ts is the accepted F1 boundary, the cap protects the page, and today's 11 ids are all short. Killer: the stub lists a 250-character id, which is not shown, and the note is present. A claims row covers the sentence |
| Q-05 | **DN8-04 adopted.** Every new receipt, F1 and `model_choice` field is a string, a boolean or null, so that `receipt.ts` `assertNoNumbers` passes. Killer: a measured and an experimental live receipt both export from the job path, with their fields present |
| Q-06 | **DN8-05: option 1 adopted.** The order changes:<br>- steps **6a–6c** (missing, not offered, acknowledgement), which need no probe, move **before step 5** (`f1Now()`), still after the code check;<br>- steps **6d–6e** (freshness, listing) stay after step 5 and before `admit`.<br>This meets L-23 literally. Killer: with the store empty, a POST without the acknowledgement leaves `modelsCalls` unchanged |
| Q-07 | **DN8-06 adopted; it corrects P-03.**<br>- "not a chat model" applies only when an `output` array is **present** and has no `"text"`.<br>- "no image probe" applies only when `architecture.input_modalities` is **present** and has no `"image"`.<br>- An entry missing either field is **probed**, within the cap.<br>Killer as written |
| Q-08 | **DN8-07 adopted.** The 210 s probe budget is measured from the start of the first attempt to the parsed reply, **including** backoff and retries. Killer as written |
| Q-09 | **DN8-08:** settled by R8.2b. Killer: after a probe fails with 3 attempts, there is no fourth call for that id |
| Q-10 | **DN8-09 adopted.** The disabled-site golden, at least one enabled-site status test and the T6-10 narrowing run with the **default catalog**, with no seam. Both the implementer's and the adversary's seam mutants must be killed |
| Q-11 | **DN8-10 adopted.** The probe evidence records both the full body SHA-256 and the image-masked T8-02 hash. The §10 test "each probe's `request_body_sha256` equals a fresh local capture" is named in the handoff, and the page render must be deterministic for it to hold |
| Q-12 | **DN8-11 adopted.** A browser-stored receipt without `model_choice`, from before Stage 8, renders as today: no badge and no crash. The badge test is strict `=== false`. Killer: a stored Stage 7 receipt fixture |
| Q-13 | **DN8-12 and auditor item 3:** settled by P-05. On the page, the measured figures are named as text (the METRICS.md section and the run directory). The README may carry the real repository link |
| Q-14 | **Auditor item 4 adopted.** The candidate handoff lists **every hunk in an existing test file**, with its reason. Any removed, skipped or loosened assertion is a finding. Adding `model` to POST helpers and using the stub catalog are the expected hunks, each listed |
| Q-15 | **Auditor item 6 adopted.** The CH8-35 non-null critical-field count is recorded in the probe evidence only. It is **never shown** on the page, in the README or next to an experimental label (R-C) |

**Design note points approved without change:**
- `src/web/models.ts` as the single module holding the measured and experimental ids;
- the `sameModel` rule;
- LIVE_MODELS parsing and logging;
- the offer formulas;
- the legacy route (§4);
- the UI groups, the default rule, the no-preselection case and the caps (§5);
- the types and receipt additions after `processCase` (§6);
- the time budget (§7);
- the file list, `stage8-baseline.json` and `STAGE8_MAY_CHANGE`/`STAGE8_NEW` (§8);
- the probe batch (§9), as corrected by P-02, P-07, Q-07, Q-08 and Q-11;
- the tests and mutants (§10).

**The limited-choice statement (§5) is approved as worded.**

## O8-01: base-URL path in the operator's room export (implementer msg 043a9050)

**Finding.** `evidence/runs/certgate-001/final/room.json` contained the endpoint base-URL **path** 9 times. The path is the part D2 and D8-04 forbid; the host may appear.
- It was added by the operator commits d3dd58d and e0de5c7 (2026-10-15), which are already on GitHub main.
- It is pre-existing: the file is absent at 2158016.
- The key gives 0 hits. The Stage 8 delta adds nothing.

**Remedy, by the analyst under its own lease:**
- A **new redaction commit** replaces each occurrence with `<host>/<base-url-path redacted>`, so the host is kept as D2 allows.
- The file still parses as JSON.
- Afterwards, a whole-tree scan of tracked files gives 0 path hits.
- The comparison is in memory only, against the user-level `MODEL_BASE_URL`, and no property of the value is written.
- History is **not** rewritten. This is the same remedy as the Stage 3 path redaction under D2.

**For the operator (push request and addendum):**
- The value remains in the published history at d3dd58d, e0de5c7 and feaadff.
- Whether to rotate or confirm the endpoint URL, or to rewrite published history, is the operator's decision. The band does neither.
