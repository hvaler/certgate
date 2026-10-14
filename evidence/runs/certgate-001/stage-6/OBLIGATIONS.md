# Obligation register — Stage 6 (live reading on the deployed site)

Run: certgate-001 · Stage: 6 · Register version: **R6.1** (analyst-xwz3, 2026-10-14; R6.0 = commit 47a951b; R6.1 accepts adversary challenge msg 41f6ca68, CH6-01…CH6-19, with rulings H-02 and H-11).
Dispatch 4: room msg `980db228-2297-4439-984a-8370e4a940cd` from hugo.valer, received ~12:36Z. Verbatim copy: `evidence/runs/certgate-001/DISPATCH-4.txt`.
Dispatches 1–3 remain in force except where dispatch 4 changes them.

**Input revision:** `8868838f90abd9593c6d5be17124ff5d5272e5e5` (tree `5c2fd2ef…`).
- It contains the Stage 5 accepted candidate `409fb69a8e538efadbf2687862e39e384b73d92b` (auditor 47316d66, record d44be28), plus the verified addendum.
- The human pushed it: GitHub `main` = 8868838f at ~12:37Z, checked by the analyst with `git ls-remote`.

**Sources:** `stage-6/SOURCES.sha256`, unchanged since Stage 5.

**Limits (dispatch 4):**
- Stage 6: 360 min including final verification. It started ~12:37Z and ends ~18:37Z. The addendum reserve is 30 min, so **no new work after ~18:05Z**.
- At most **4 repair cycles**; 2 infrastructure retries per command.
- **HARD STOP 2026-10-17T18:00:00Z.** If Stage 6 is not accepted by then, the band reports where it stands, and the Stage 5 product stays on the site.

## Obligations

| ID | Source | Obligation | Owner |
|---|---|---|---|
| S6-01 | D4 Deliver: access code | **Mandatory access code on the deployed site.** If `VERCEL` is set and `LIVE_ACCESS_CODE` is unset or empty, live reading is **disabled** and the site behaves exactly as at 409fb69a. Comparison is constant-time. Failed codes are limited by `LIVE_CODE_FAILURES_PER_HOUR`, counted **globally** in the shared store. The code value never appears in the room, the repository, logs, evidence, responses or the browser bundle | implementer |
| S6-02 | D4: global queue | **Asynchronous job API.** POST starts a job and returns at once with a job id; the browser polls the job. States are shown honestly: **queued** (with position), **reading on AMD** (with elapsed time), **done**, and **failed** (with the reason, and a retry offered). A failed or timed-out reading **never** falls back to a stored result (I7) | implementer |
| S6-03 | D4: limits | Global limits **across all instances**, enforced in the shared store with atomic operations and TTL leases, so a crashed instance cannot leak a slot: **at most 2 readings in flight**; an hourly limit from `LIVE_READS_PER_HOUR` (this closes OI-S2-01 on the deployed site). The job timeout keeps **every attempt inside the 300 s function limit with margin**. A bounded retry is allowed only if it fits, and the band decides and documents it. The calling discipline of D2 is unchanged | implementer |
| S6-04 | D4: store | **Shared state** in a store a Vercel Hobby project can attach. The default is **Upstash Redis from the Vercel Marketplace**, which the human provisions and connects. The band reads its documentation and cites it in `docs/sources/` with the retrieval date. The band uses **only the environment variable names that integration injects**, and never handles its credentials. Preference: Upstash's documented **REST API via `fetch`, with no new runtime dependency**. A new dependency needs a reason, a pinned version, its licence and a lockfile entry. If the band uses Vercel's documented `waitUntil`, or another documented mechanism, to continue work after the response, it is cited the same way | implementer |
| S6-05 | D4: container | **The container keeps working with no store:** an in-process queue with the same states and the same API. README "Real mode" stays true | implementer |
| S6-06 | D4: samples | **Sample certificates** from the synthetic dataset can be downloaded from the live-reading screen and uploaded back. The synthetic-data consent stays. The samples are served from committed files whose hashes match the dataset | implementer |
| S6-07 | D4: F1 | On the deployed site, **with live reading enabled**, the F1 panel reads the real endpoint **server-side**: "Model endpoint: on", the model as reported, latency. Every live receipt keeps its F1 snapshot. With live reading disabled, F1 stays honest ("off"), as today | implementer |
| S6-08 | D4: model | The live model on the deployed site is **Gemma-4-31B-IT**, set by the human as `MODEL_ID` in the Vercel environment only. The container default, the user-level `MODEL_ID` on this host, the landing figures and the stories stay **Qwen3.8-27B**. **The site names the model of each thing:** the landing figures and stories are Qwen3.8-27B with their runs; a live reading uses the model as reported by the endpoint (receipt and F1 snapshot); the Gemma comparison figures are in METRICS.md. Switching back to Qwen needs **only a change of `MODEL_ID` in Vercel**. DEPLOY.md says how and when, for example on degenerate output, as on 2026-10-13 | implementer |
| S6-09 | D4: unchanged | **Byte-identical to 409fb69a** (the auditor checks by diff): the rules, the frozen prompt (SHA-256 `32fad2f9…c567`), the reading path, `data/`, `config/`, `evaluation/`, `public/figures.json`, `public/stories/` and the evaluation figures in METRICS.md. The reading-path files are `src/pdf.ts`, `src/text-layer.ts`, `src/model-output.ts`, `src/strict-json.ts`, `src/evaluate.ts`, `src/coherence.ts`, `src/decimal.ts`, `src/fields.ts`, `src/spec.ts`, `src/delivery.ts` and the request builder and prompt in `src/web/live-reader.ts`. If plumbing (for example a timeout parameter) unavoidably touches a reading-path file, the exact hunks are listed, and the Qwen and Gemma request golden hashes and the prompt SHA are shown unchanged | implementer; auditor |
| S6-10 | D4: docs | **DEPLOY.md is rewritten for the new set-up.** It covers: the store to connect; every environment variable by name (`MODEL_BASE_URL`, `MODEL_API_KEY`, `MODEL_ID`, `LIVE_ACCESS_CODE`, `LIVE_READS_PER_HOUR`, `LIVE_CODE_FAILURES_PER_HOUR`, and the store's own), marking which are secrets; and the post-deploy checks, including **one real live reading through the URL**. The README and claims table are updated: every new text unit maps to a row or to "none" (E-11), and the prize check (E-17…E-19) still passes. The earlier F-05 instruction ("do not set MODEL_* on Vercel") is **superseded by dispatch 4**, now that the key is protected by the access code and the global limits | implementer |
| S6-11 | D4: tests | Tests cover: queue states and ordering; **global limits across two simulated instances sharing one store** (a fake store implementing the same interface, so Docker `--network none` still passes); code enforcement (missing, wrong, right, failure limit); timeout and failure paths, with no stored fallback; **no key and no code in the bundle**; I7 labels. Each new guard has **a mutant and a named killer** | implementer; adversary |
| S6-12 | D4 Acceptance | **Auditor's local checks:** the full suite from a clean clone and in Docker with no network; the mutants re-applied; the S6-09 diff | auditor |
| S6-13 | D4 Acceptance | **Auditor's live checks, after the human reports the deployment.** It runs DEPLOY.md against https://certgate-wheat.vercel.app:<br>- every asset and route answers as documented, and served files match the committed ones;<br>- live reading is refused **without** the code and with a **wrong** code;<br>- **one real live reading with the code** completes with Gemma-4-31B-IT as reported by the endpoint, labelled live with its F1 snapshot;<br>- the site names the model of each figure and reading correctly;<br>- the global limit holds;<br>- no secret appears in the bundle or the responses.<br>The code is read only from the host's user-level `LIVE_ACCESS_CODE`, never seen or written. **A stored result shown as live, or the key reachable from the browser, rejects the stage** | auditor |
| S6-14 | D1 §Mutation | Stage 6 product code changes, so the **Stage 1–5 mutant lists are re-run where code moved**. Stage 6 mutants include at least: code check bypassed or made non-constant-time; the failure limit counted per instance; the in-flight limit counted per instance or without TTL; the hourly limit per instance; timeout ≥ the function limit; a failed job falling back to a stored result; the key or the code in the bundle or a response; the live label on a stored result; F1 hard-coded; the deployed model id hard-coded | adversary; auditor re-applies |
| S6-15 | D4 Human's part | The human connects the store, sets the Vercel environment variables, pushes the accepted commit, and puts the code in the host's user-level `LIVE_ACCESS_CODE`. **The human posts each step in the room.** The band never deploys, pushes or submits, and never handles store or Vercel credentials | analyst (push request) |
| S6-16 | D4 Final report | An **addendum** in the same shape, with the deployment audit and the push request | analyst |

## Decisions

| ID | Decision |
|---|---|
| D6-01 | **Design note first.** Before coding, the implementer posts a short design note: job lifecycle and states; where the reading runs (for example the POST invocation continuing with `waitUntil`, or another documented mechanism) and how it stays inside 300 s; store keys, TTLs and atomic operations; the slot lease and recovery after a crash; the hourly window; the code check; the env names injected by the store integration (cited); and the container fallback. The adversary challenges it, and the analyst rules. **Target 13:20Z.** Coding may start in parallel, but the freeze follows the ruling |
| D6-02 | **Endpoint lease.** The implementer may make at most **3 real readings**, for a container smoke test of the new job API under the lease, announced and released. All other development and tests use the stub or the fake store. The auditor's live checks after deployment use the auditor's own lease: at most 3 live readings plus GETs. Headroom is checked first. The adversary makes no endpoint calls unless granted |
| D6-03 | **Order of work:** design note → challenge → ruling → candidate 1 → adversary and auditor local checks → verdict on local acceptance → push request → the human's deployment steps → auditor live checks (S6-13) → final Stage 6 verdict → addendum |
| D6-04 | **Credits** are free and have no monetary value. Costs are reported as the endpoint reports them |

## R6.1 amendments (adversary challenge msg 41f6ca68; all accepted)

| ID | Ruling |
|---|---|
| H-ALL | **CH6-01, CH6-03…CH6-10 and CH6-12…CH6-19 are accepted as written** (verbatim text in the appendix below). Each is binding on the design note and on candidate 1, and each named mutant needs a named killer |
| H-02 | **CH6-02 ruling.** The code-failure limit is enforced **per client and globally**. The per-client key is a SHA-256 of the client address Vercel provides (`x-forwarded-for`, first hop, or `x-real-ip`), never stored raw, and it is limited by `LIVE_CODE_FAILURES_PER_HOUR`. The global ceiling is 10 × that value per hour, so one anonymous visitor cannot lock the judge out. DEPLOY.md states both limits, the lockout, and how the human clears it: the store key names, or wait for the window to end |
| H-11 | **CH6-11 ruling.** On the deployed site, F1 is **cached server-side** for at least 60 s, with its honest `checked_at` shown. GET /models and GET /usage are made at most once per cache period across instances. A live receipt takes a fresh F1 snapshot at reading time |
| H-19 | CH6-19 is accepted. The poll interval is at least 2 s, with the cheap rejection paths as written. DEPLOY.md cites the store's quota, and live reading is refused when the quota is exhausted |

### Appendix: adversary challenge msg 41f6ca68, verbatim

@hugo.valer/analyst-xwz3 @hugo.valer/implementer-xwz4 @hugo.valer/auditor-xwz6 ADVERSARY CHALLENGE to Stage 6 register R6.0 (commit 47a951b), checked against dispatch 4. It lists gaps a candidate could pass through while every R6.0 row stays green. The design note (D6-01) should answer each one. I issue no verdict.

**CH6-01 [S6-01: code transport and the compare].**
- The code goes in a request header only, never in the query string, because Vercel request logs record URLs.
- It is never stored in a job record and never echoed in an error.
- Compare HMAC or SHA-256 digests of equal length with `timingSafeEqual`. On raw strings of unequal length, `timingSafeEqual` throws, and the resulting 500 leaks the length.
- An empty or whitespace-only `LIVE_ACCESS_CODE` counts as unset.
- The failure counter is incremented atomically **before** the result is used. Once the limit is reached, even the correct code is refused until the window ends.
- Mutants: plain `===`; counting after success only; a code accepted from the query string.

**CH6-02 [S6-01: global failure limit as a lockout].** A global failure counter lets any anonymous visitor lock the judge out for an hour with a few wrong codes. Rule one way or the other: global only (as R6.0 says), or global plus a per-client key. Either way, DEPLOY.md states the lockout and how the human clears it (the store key name, or wait for the window to end).

**CH6-03 [S6-01, S6-05: "behaves exactly as at 409fb69a"].** Needs a named check: with no code set and `VERCEL=1`, every existing route answers byte for byte as at 409fb69a, with a golden test over status, body and relevant headers. Also, the live endpoints must return the same refusal whether the code is missing, empty or unset, so a visitor cannot probe whether live reading is configured.

**CH6-04 [S6-03, S6-04: no silent fallback on Vercel].** If `VERCEL` and the code are set but the store variables are missing or unreachable, live reading is **refused with an honest reason**. It never falls back to the in-process queue, because a per-instance queue silently breaks the 2-in-flight and hourly limits. Killer: a test with `VERCEL=1`, the code set and no store, which expects a refusal and zero endpoint calls.

**CH6-05 [S6-02, S6-03: who starts a queued job, and the time budget].** If the reading runs in the POST invocation (`waitUntil`), a job queued behind 2 others has to wait inside that same invocation. Then queue wait + PDF render + reading + any retry must all fit under the configured `maxDuration`.
- The design must say who starts a queued job: the POST invocation waiting, or a poll request claiming it.
- Bound the queue length, so that worst-case wait plus budget stays under 300 s. Beyond that bound, refuse with "busy, try later", which counts as a refusal and not as a failed reading.
- The test reads `maxDuration` from `vercel.json` and asserts every budget against it.
- Mutant: timeout ≥ limit, or an unbounded queue.

**CH6-06 [S6-03: slot lease correctness].**
- A slot is taken with a unique token (SET NX PX, or a Lua or MULTI script), never read-then-write.
- It is released only by compare-and-delete on its own token. Otherwise a late finisher whose lease expired releases another job's slot, and 3 readings run.
- The lease TTL is at least the job budget.
- The two-instance test runs real interleaved concurrency (`Promise.all` against one fake store with an artificial delay between read and write), not sequential calls.
- Mutants: release without the token check; a TTL shorter than the budget; read-then-write admission.

**CH6-07 [S6-02: dead workers].**
- If the instance dies mid-reading, the job must not stay in "reading on AMD" forever.
- A poll past `started_at + budget + margin` (server time) turns it into **failed: timed out**, with retry offered, and its slot comes back through the TTL.
- Never "done", never a stored result.
- Killer: a fake-store test with a job left in "reading" and the clock advanced.

**CH6-08 [S6-03: what the hourly limit counts].**
- Count at admission, atomically, so a failed or timed-out reading still consumes its unit. Otherwise retries can burn the quota without bound.
- A bounded internal retry counts as part of the same job, and each endpoint call is still counted against the D2 discipline.
- State whether the window is fixed or sliding.
- Refusals ("busy", "limit reached", "wrong code") are not jobs.

**CH6-09 [S6-02: job privacy and inputs].**
- Job ids are random with at least 128 bits. A poll returns only that job.
- The upload size is capped before admission.
- Say where the certificate bytes live between POST and reading. In the invocation's memory is preferred; if they go in the store, they need a TTL, a cited size limit for the store's REST request, and deletion when the job ends.
- A job record expires (TTL) and holds no code, key or raw provider error.

**CH6-10 [S6-02, I6: failure reasons].** A failed job shows a reason **class**, such as `timeout`, `endpoint 429`, `endpoint 5xx`, `invalid model output` or `busy`, never the raw error text. Raw fetch, store and provider errors can carry the base-URL path or headers. The full error goes to server logs only after redaction.

**CH6-11 [S6-07: F1 must not spend the quota per page view].** If every anonymous page view triggers a server-side call to the endpoint, it eats into the ~20 requests per minute that live readings need. F1 is either cached server-side with its honest `checked_at` shown, or globally rate-limited. A live receipt takes a fresh F1 snapshot at reading time. Mutant: F1 hard-coded to "on" (already in S6-14).

**CH6-12 [S6-08, CH5-01: reported vs requested model].**
- The live receipt shows the requested `MODEL_ID` and the model **as reported**.
- If the reported model does not match the requested family, for example `/gemma-4-31b/i` for Gemma, the job is marked failed (`model mismatch`) rather than shown as a Gemma reading.
- Mutant: the deployed model id hard-coded, or the reported model ignored.

**CH6-13 [I7: a "done" job must hold a fresh reading].** A job's result is built only from the endpoint response obtained in that job: an endpoint `id`/`created` plus the job id and timestamps in the receipt. Stored stories never pass through the job store or the job API. Mutants: a job's "done" returning a story recording; a failed job returning the last good result for the same file (a hash-keyed cache is also a stored result).

**CH6-14 [S6-01, S6-11: secrets scan with sentinels].**
- Tests set sentinel values for `MODEL_API_KEY`, `LIVE_ACCESS_CODE` and the store token.
- They then scan the built `public/` and **every API response body and header**, error paths included: wrong code, store down, endpoint 500, timeout.
- The base-URL path never appears in a response either; the host may.

**CH6-15 [S6-04: store env names].**
- Cite the exact names the Marketplace Upstash integration injects (some integrations inject `KV_REST_API_URL`/`KV_REST_API_TOKEN`, others `UPSTASH_REDIS_REST_URL`/`..._TOKEN`), with the doc and retrieval date.
- Never use a read-only token for writes.
- No new dependency, per R6.0. If one is added, pin it, state its licence and add the lockfile entry.

**CH6-16 [S6-06: samples].**
- Samples are served from a fixed allow-list, by id, not by a path parameter: no traversal, correct content type.
- A test checks the served bytes equal the dataset files' hashes.
- The consent stays on the upload path too, not only on the screen.

**CH6-17 [S6-05: container parity].** The in-process queue enforces the same limits in-process (2 in flight, hourly, failure limit) and shows the same states. Run the same state-machine tests against both store implementations.

**CH6-19 [S6-02, S6-04: polling abuse and store quota].** Every poll is a store read, and the Upstash free tier has a command and request quota (cite it). A tight client loop or an anonymous poll flood can exhaust it, taking down live reading and the limits with it.
- The poll endpoint answers unknown or expired ids cheaply, with one bounded read and no writes.
- The browser polls at a fixed interval of at least 2 s.
- The server rejects polls without a well-formed id before touching the store.
- DEPLOY.md states the store quota and what happens when it runs out. The answer must be that live reading is refused, never a fallback.

**CH6-18 [S6-14: earlier mutants].** If `src/web/app.ts` or the live-reader plumbing moves, re-run my Stage 3/4 web and receipt mutants and the Stage 5 b/c identity and request mutants. The Qwen and Gemma request golden hashes stay as killers.

I will build the Stage 6 mutant set from S6-14 plus CH6-01…17 against candidate 1. I make no endpoint calls unless granted.

[3e47b667-b685-4655-8f34-cc0dad08ab30] 8b49fdc7-d7af-46f5-b439-d09baf77b876 from hugo.valer/adversary-xwz5: @hugo.valer/analyst-xwz3 Received all 18 parts of the Stage 6 handoff (655939ab, 9662ffe9 through 6b001591). Task A is done: my R6.0 challenge CH6-01 to CH6-19 is msg 41f6ca68. Next is task B, the D6-01 design note, as soon as it is posted. No endpoint calls.
