# Auditor pass/fail rules T8 — Stage 8 (dispatch 6 and operator amendment 1)

- **Seat:** auditor-zt7p (`hugo.valer/auditor-zt7p`), Claude Code, model `claude-opus-5-5`. Written 2026-10-15 ~19:40Z.
- **Specification:**
  - dispatches 1–6 (DISPATCH-1..6.txt) and the correction b642c66d;
  - **operator amendment 1** (room msg `79b781e6-300f-423e-9de4-4d34fae32d32`, from hugo.valer), which widens the choice to three groups and raises the limit to 480 min;
  - register R8.0 (157f469). R8.1 is still to come.
- **Baseline:** feaadff8c90d4dc7bc913f83bf956b2d28bfae66 (S8-00, 49e377f).
- **Candidate:** a full commit id on `s8-impl`. It is checked in the auditor's own clone, never the implementer's worktree, and Docker is built `--no-cache` and run with `--network none`.

A rule passes only on evidence this seat produced or re-ran itself. A skipped, empty or unrun check is not a pass. Each rule has a binding id; the verdict records the outcome of each.

## Where the amendment changes the dispatch's rejection rule

Dispatch 6 says: "A model offered without an evaluation run … rejects the stage". Amendment 1 explicitly offers group (b), experimental models, without an evaluation run. The auditor reads the two together as follows:

- **R-A (reject):** a model is offered in group **(a) MEASURED**, or carries any measured figure or link, without an evaluation run in METRICS.md.
- **R-B (reject):** a model is offered in group **(b) EXPERIMENTAL** without committed probe evidence that passes T8-21.
- **R-C (reject):** a measured figure appears next to an experimental model anywhere: page, README, METRICS, receipts, slides-facing text.
- **R-D (reject):** a fallback to another model or to a stored result.
- **R-E (reject):** the key is reachable from the browser.
- **R-F (reject):** an experimental model is a default, or appears anywhere without its "not evaluated" label.

R8.1 should confirm this reading.

## S8-12 — byte identity (diff against feaadff)

**T8-01 Paths that must not change.** `git diff --stat feaadff <cand> -- <path>` must be **empty** for:

| Group | Paths |
|---|---|
| Reading path | `src/web/live-reader.ts` (CF-01) and `src/web/deadline-reader.ts` |
| Pipeline | `src/pipeline.ts`, `src/reader.ts`, `src/model-output.ts`, `src/strict-json.ts`, `src/text-layer.ts`, `src/pdf.ts`, `src/fields.ts`, `src/coherence.ts`, `src/spec.ts`, `src/decimal.ts`, `src/delivery.ts`, `src/cases.ts`, `src/input-file.ts`, `src/evaluate.ts`, `src/receipt.ts`, `src/web/recorded-reader.ts` |
| Data and evaluation | `config/`, `data/` (cases, expectations, previews), `evaluation/`, `tools/evaluate/` |
| Recorded output | `public/figures.json`, `public/stories/` |
| Build | `vercel.json`, `Dockerfile` |

If `live-reader.ts` or `receipt.ts` changes, the handoff lists the hunk and why, and the change can still fail T8-02/T8-03. **METRICS.md** may change only if `metrics-md.mjs --check` passes and every figure line equals feaadff. If `package.json` or `package-lock.json` change, a new dependency needs its name, version and licence in the handoff.

**T8-02 Request goldens.** These are recomputed by the auditor, not taken from the suite.
- **Capture:** a local capture stub records the exact POST /chat/completions bytes:
  - at **feaadff** with `MODEL_ID=X`;
  - at the **candidate** with X chosen through the new path;
  - for X = Qwen3.8-27B and Gemma-4-31B-IT, on cg-004 and cg-021.
- **Equal byte for byte:** each candidate body equals the feaadff body for the same X (4 pairs).
- **Hash:** the Qwen cg-004 body hash equals `69cb4771…655e` under the existing golden function.
- **Experimental model:** for one stub-listed experimental id Y, the candidate body equals the feaadff body with `MODEL_ID=Y`, byte for byte. That is, the request is the same request with only the model id changed, as amendment 1 requires.
- **Prompt:** `promptSha256()` equals `32fad2f980bcf755841d80bb2385d9601465f83b5b42c1b6c048f3bfe1cfb567`.

**T8-03 Pinned-file guards (CF-02).** The set of files under `src/`, `public/`, `api/`, `data/` and `config/` that differ from feaadff must equal `STAGE8_MAY_CHANGE`, plus new files the handoff lists. A guard widened beyond the files actually changed, or deleted, fails. **T6-10** may be narrowed only per A8-11:
- grep for the Gemma id under `src/` and `public/` (stories excluded) hits exactly one module;
- the same check holds for every committed experimental id, which may appear only in the experimental-set module.

**T8-04 Judge mode unchanged (S8-09).** The bodies of GET `/api/stories/*` and the story evaluate route, and the bytes of `figures.json`, equal feaadff in the disabled-site golden. With LIVE_MODELS unset and live reading disabled, every existing route answers byte for byte as at feaadff (S8-13).

## S8-17 — local acceptance

**Fresh clone and suite**
- **T8-10:** fresh clone at the exact commit, `npm ci`, `npm run typecheck`, `npm run build`, then `npx vitest run` **3 times**. Pass needs exit 0 three times, 0 failed and 0 skipped outside the documented image skips. Any failure is a finding, unless it is reproduced as infrastructure with host evidence.
- **T8-11:** `docker build --no-cache`. In the image, with `--network none`, run the suite (the docs tests that need `evidence/` are recorded as "not run in image", as earlier) and a mock-mode container smoke: `/health`, a story, the live screen.
- **T8-12:** each passes:
  - `node tools/evaluate/metrics-md.mjs --check`;
  - `node tools/previews.mjs --check`;
  - `node tools/diagrams.mjs --check`;
  - `node tools/claims-units.mjs --stale`, plus the unmapped check, with **0 unmapped and 0 stale**;
  - the prize check (E-17…E-19).

  CLAIMS.md rows C-85 and C-89 no longer call Gemma the deployed model. Every new capability sentence has a row whose proof exists.

**Offer computation (stubbed GET /models, run by the auditor)**
- **T8-13:** with LIVE_MODELS unset, the offer is {MODEL_ID} ∩ measured, group (b) is empty, and the site is as today.
- **T8-14:** LIVE_MODELS can only narrow (a) and (b). Cases: unset, empty, whitespace, duplicates, a case variant, an unknown id, and only unknown ids. Unknown ids are logged by name on the server and never offered.
- **T8-15, the three groups from a stubbed probe.** Each case is seen in the API and rendered at 375 and 1280 px in a real browser, with screenshots:
  - (a) listed / unlisted;
  - (b) listed and in the probed set / listed but not in the set / unlisted;
  - (c) every other listed id, disabled with its reason;
  - the probe time shown equals the probe's `checked_at`;
  - nothing listed means live reading is disabled with the reason.
- **T8-16, the default:** MODEL_ID if it is measured and listed; else the first listed measured model in code order; **never an experimental model**, including when only experimental models are listed. In that last case live reading has no default and needs an explicit choice plus the acknowledgement.

**Server refusals (S8-06 and amendment point 3)**
- **T8-17:** each of these POSTs carries a **correct** code:
  - model missing, empty, unmeasured and unprobed, or unlisted;
  - stale probe (cached probe older than 60 s and refresh failing);
  - experimental without the acknowledgement;
  - experimental not in the probed set.

  Pass for each requires all of the following, observed on a counting stub endpoint and a fake store:
  - a 4xx answer with a fixed reason class the page shows;
  - **0** chat calls;
  - the hourly counter unchanged;
  - no job key and no queue entry;
  - the code-failure counters unchanged.

  The model checks run after the code check and before the INCR (A8-03).
- **T8-18, no fallback:**
  - a stub 4xx fails the job as `endpoint_4xx`; every chat call carries the chosen id and no second id is ever sent;
  - a stub reporting a different model fails as `model_mismatch`;
  - nothing stored is shown.
- **T8-19, receipts and F1 snapshot:** for done and failed jobs, the receipt and the snapshot carry the **requested** model and the **reported** model (null if there was no reply, A8-07). An experimental reading carries `evaluated: false` and the probe evidence path in the receipt and the snapshot, and the label "not evaluated" beside the proposal.
- **T8-20, time budget:** the deadline test covers the slowest offered model. A reading of an experimental model gets the same 270 s deadline, and no bounded retry is added beyond what fits.

**Probe evidence (amendment points 1b and 5)**
- **T8-21:** for every id in the committed experimental set there is one committed probe record under `evidence/`. It holds the request model id, the model as reported, the UTC time, the tokens, the dataset certificate used, the raw reply content and the parsed-or-failed result.
- The auditor **re-parses each committed reply offline** through the product's own parser (`parseModelOutput`) and requires the recorded result to be reproduced.
- The auditor checks that:
  - the request used is the frozen-prompt image request (prompt SHA as T8-02);
  - the reported model passes the strict identity rule (challenge C-1);
  - the probes' GET /usage before and after reconcile with their reply costs.
- **Set equality:** the experimental set in code equals the set of ids whose probe passed, exactly. A test must tie the two, like S8-01 ties the measured set to METRICS.md.
- **Group (c) reasons:** "probe failed" ids have a failing record; "no image probe" ids have none.

**Mutation (S8-16)**
- **T8-22, the auditor's own mutants**, each on a throwaway branch of its clone, never merged. Each must be killed by a candidate test, and the killer is recorded:
  - M8-01 union instead of intersection;
  - M8-02 an id outside the measured and probed sets offered;
  - M8-03 an unlisted model enabled;
  - M8-04 the server listing check removed;
  - M8-05 model validation moved after the hourly INCR;
  - M8-06 a stale probe accepted (TTL ignored);
  - M8-07 the mismatch guard compares to MODEL_ID;
  - M8-08 a fallback to MODEL_ID on 4xx;
  - M8-09 the requested model dropped from the receipt or snapshot;
  - M8-10 a missing model defaults silently;
  - M8-11 Gemma or an experimental id reached as a default;
  - M8-12 the acknowledgement not checked on the server;
  - M8-13 `evaluated: false` dropped;
  - M8-14 an experimental id added to the code set without evidence;
  - M8-15 near-miss reported id accepted (if C-1 is adopted).

  The Stage 6/7 mutants for code that moved (`app.ts`, live jobs, F1) are re-run. A survivor is a finding, routed to the adversary through the analyst.
- **T8-23, the adversary's bundle:** re-run from a clean clone at the bundle's test revision, and its assertions read against the obligations. A test that passes against the requirement it claims, but would also pass with the guard removed, is a finding.
- **T8-24, secrets:** 0 hits for the code value, its SHA-256, the key and the base-URL path. Only matches are counted; no property is ever written. The scan covers the tree at the candidate, the history delta feaadff..cand, `dist/`, the image filesystem and every committed probe record.

The local verdict is **ACCEPTED (local)** only if T8-01…T8-24 all pass with no blocking finding. Otherwise it is REJECTED with each unmet rule, or BLOCKED with the missing infrastructure.

## S8-18 — live acceptance (after the human reports LIVE_MODELS and the push)

- **T8-30, deployment identity:**
  - `git ls-remote` main equals the pushed commit, which contains the locally accepted candidate;
  - the served `/app.js`, `/index.html`, `/labels.js` and `/styles.css` equal the committed blobs (SHA-256);
  - `/api/live/status` shows enabled and the code required.
- **T8-31, listing at the moment:**
  - The auditor reads `GET {MODEL_BASE_URL}/models` directly, under its lease, **immediately before and after** reading the page's choice data.
  - The two direct reads must agree. If they differ, the list changed: repeat once and record both.
  - Pass: every id the site lists equals the direct listing, allowing only for a change within the site probe's 60 s `checked_at` window. Each id is in its expected group, and the shown time equals the site's `checked_at`.
  - The site's listing is never trusted on its own.
- **T8-32, only measured or probed models are offered:** the offered set ⊆ (measured ∪ committed experimental set) ∩ LIVE_MODELS ∩ listed-now. Group (c) shows every other listed id, disabled with its reason.
- **T8-33, refusals with the correct code** (no wrong-code budget is used; at most 2 wrong codes in the whole stage, as T6-04):
  - POST with a model outside the offer (an id listed in (c) if there is one, else an unlisted id);
  - POST with an unlisted offered model, if one exists (A8-09);
  - POST with an experimental model without the acknowledgement, if one is offered.

  **"Without spending the limit" method:**
  - 5 GETs of `/api/live/status` immediately before and 5 immediately after, all inside one UTC hour, never within 3 min of a boundary;
  - `used_this_hour` and both code-failure counts must be equal in all 10 reads;
  - GET /usage all-time requests and tokens unchanged across the refusals, so 0 chat calls.

  If another visitor's reading moves the count, repeat once. If it moves again, record it as **inconclusive (external traffic)**, not as a pass.
- **T8-34, one real live reading per listed offered measured model, plus one listed experimental model** (amendment point 5):
  - each goes 202 → queued → reading → done;
  - the receipt says `reading_source` live, with requested = chosen;
  - the reported model passes the identity rule;
  - the F1 snapshot holds both models;
  - experimental readings carry `evaluated: false`, the probe path and the "not evaluated" label;
  - `used_this_hour` rises by exactly 1 per reading;
  - the /usage delta equals the reply cost.

  If no experimental model is listed, the record says so and that check is skipped, as the amendment says. If no measured model is listed, the measured readings cannot be made: that part is **BLOCKED**, and is retried before the stage hard stop.
- **T8-35, A8-09:** if no offered model is unlisted at audit time, the live check "an unlisted model is shown disabled and refused" cannot be made: no observable state exists. The record says **"condition absent at <direct /models time>"**. That behaviour then rests on T8-15/T8-17, which runs in the production shape locally (`VERCEL=1` container, stub listing one measured model). It is a stated limitation, not a pass.
- **T8-36, secrets:** 0 hits as in T8-24, across every response body and header and the served bundle.
- **T8-37, the old route:** `/api/live/read` still answers 503 on the deployed site, with and without a model parameter (CF-07).

**Endpoint budget for the auditor:**
- live readings: measured listed (≤ 2), plus 1 experimental, plus ≤ 1 infrastructure retry, so **≤ 4**;
- direct GET /models: ≤ 8;
- GET /usage: before and after each step.

All of this happens under announced leases. This exceeds D8-02's "at most 3", so challenge C-4 asks R8.1 to set the cap.

The final verdict is bound to the deployed commit and lists the outcome of each T8-30…T8-37.

## Challenges to R8.0 (for R8.1)

- **C-1 (CF-04 / A8-04), one strict identity rule.** Today's mismatch guard is a substring test. With the whole Token Factory list now in play (amendment point 1), `Qwen3.8-27B` would pass a reply reporting `Qwen3.8-27B-FP8` or `Qwen3.8-27B-Instruct`, and a measured label would sit on a model that was never measured.
  - **Proposal:** one function used for listing **and** mismatch: equal ignoring case, optionally after one `<provider>/` prefix, nothing else.
  - It needs a test and mutant M8-15.
- **C-2 (A8-02), freshness evidence in the record.** The receipt (or job record) should store the `checked_at` of the probe that validated the POST, so the auditor can verify freshness after the fact. This is suggested, not required by the dispatch.
- **C-3 (amendment 1b), who probes and the budget.** The analyst should fix:
  - who runs the experimental probes;
  - the maximum number of probes (one per listed non-measured id, within the calling discipline);
  - that probes use only a dataset certificate (synthetic; the provider keeps prompts about 2 days);
  - a time cut-off: ids listed after the probe run are group (c) "no image probe".

  It should also state how "not a chat model" is decided: from the /models metadata, or from a probe answering that it does not take chat or image input, never by guessing from the name.
- **C-4 (D8-02), the auditor's endpoint cap.** Raise it to 4 readings (T8-34) and allow up to 8 direct GET /models (T8-31). Without those reads the listing check would rest on the site's own probe, which is the thing under test.
- **C-5 (A8-01 with amendment point 4).** Agreed: without LIVE_MODELS, (b) is empty. Add: an id that is in LIVE_MODELS and also in **both** sets can never be offered in (b) once it is measured. Measured takes precedence, and has its own test.
## Delta for R8.0a (commit 6b3b730), posted after part 11

- **T8-13, aligned with A8-14:**
  - With live reading enabled and LIVE_MODELS unset, the **selectable** set is {MODEL_ID} ∩ measured, (b) is empty, and the request equals today's.
  - The screen still shows the full list. Ids that would be offered with LIVE_MODELS set appear in (c) as "not enabled on this site".
  - With live reading disabled, every route answers byte for byte as feaadff (T8-04).
  - The auditor reads Am1 §4's "the site behaves as today" as covering selection and request only. A8-14 is accepted on that reading.
- **T8-21, aligned with A8-16, A8-17 and D8-06:**
  - **Records:** probe records sit under `evidence/runs/certgate-001/stage-8/probes/`, with the committed `/models` snapshot as the first step of the batch.
  - **Pass rule:** exactly A8-16, which is HTTP 200, schema parse, and a reported model that matches the requested one. The record must state that value correctness is not assessed.
  - **Counts:**
    - at most 12 ids probed;
    - at most one call per id, with 3 attempts on 429/5xx;
    - one re-probe only after an infrastructure failure.
  - **Unprobed ids** are (c), with the snapshot as the evidence for "not a chat model".
  - **Freeze:** every probe commit is earlier than the frozen candidate commit (`git merge-base --is-ancestor`).
  - **Re-checks by the auditor:** it re-parses every reply offline and reconciles the batch's /usage before and after with the per-reply costs. Each probe's request must equal the body the unchanged builder produces for that id. That is checked with the same capture-stub method as T8-02, for every probed id, with no endpoint call.
- **T8-34:** the live endpoint cap is **4 readings** (D8-02-bis), as T8-34 already assumes. Challenge **C-4 narrows** to the direct GET /models reads (≤ 8) of T8-31, which D8-02-bis does not yet name.
- **C-1 now matters more.** A8-16 makes the mismatch guard part of the probe pass rule. With the substring guard, a probe of `Qwen3.8-27B` answered by `Qwen3.8-27B-FP8` would pass. Under the strict rule, it fails.

- **C-6, the limit.** Amendment 1 raises the stage limit to **480 min from 19:15Z, so it ends 2026-10-16T03:15Z**. The 23:45Z and 00:15Z cut-offs in R8.0 and in my part 10 should be re-based. The stage hard stop 2026-10-17T08:00Z is unchanged.

## Adoption

R8.1 (commits 88b9ae8 and 46f12fd, room msg aec584cc) adopts T8-01…T8-37 and the R8.0a delta as the acceptance rules for S8-12, S8-17, S8-18 and S8-28 (L-T8).
- It confirms R-A…R-F (L-RA) and adopts C-1, C-2, C-4 and C-5 (L-C1, L-C2, L-C4, L-C5). C-6 is met by R8.0a.
- **L-T8 note:** `src/pipeline.ts`, `src/receipt.ts` and `src/web/deadline-reader.ts` stay byte-identical. The new receipt and F1 fields are added in `app.ts` after `processCase`, and `src/types.ts` may change for the types.
- The adopted CH8 rulings L-01…L-36 bind the candidate. The auditor checks each one that has a named killer under T8-22/T8-23.
