# Obligation register — Stage 2 (web app, Vercel shape, no model)

Run: certgate-001 · Stage: 2 · Register version: **R2.2** (analyst-xwz3, 2026-10-12; R2.1 = commit b2af36cb, SHA-256 d12f6a5501286745a3b7da1ea161e71dfa7e08ffe5e378a283b5159ae1ec0363; R2.2 adds B-23…B-25 from auditor testability review msg 2fa541ba; R2.0 = commit 97288c85, SHA-256 7ac9e8d104b038f37503da80dfc628c709778a288848aa8faaab3b0369163c53, dispatched at Stage 2 start ~18:12Z; R2.1 answers adversary challenge msg 74bf34b9, CH2-01…CH2-23 — section "R2.1 amendments" supersedes earlier text it names) · **Input revision: Stage 1 ACCEPTED candidate `9d0449917b237ab5de51ccf1141b772e5c0e7008` (tree `e65caa5b420d833bac8e9037db45688239f6e4f6`)**, auditor checkpoint msg 32d95424, verdict record commit 3717f315.

Sources **re-hashed at Stage 2 start** into `stage-2/SOURCES.sha256` (D, V, R changed after Stage 1 start; see S2-32 and Stage 1 A-24; V changed again at 18:08:45Z: AMD Developer Cloud account active, MI300X at 1.99 USD/hour, credit still pending), plus the design files (look only): `C:\nexus\dev\AMD-ACT3\diseno\{Inicio,Main,Progreso,Bloqueo,Recibo,JuradoMovil,ExpedienteMovil}.dc.html`, `canvas.json` (hashes in `stage-1/SOURCES.sha256`). Key **G** = design files. Stage 1 register R1.5 (commit f9836f89) stays in force: every S1 row and decision applies to Stage 2 (regression, S2-34).

## Scope statement (D2-01)

Stage 2 is accepted on the **mock / stored path only**, with **no endpoint**. F1 "endpoint on", live reading and AMD evidence cannot be verified in this dispatch; they are listed for dispatch 2. No deployment (X:§Stage 2 F4 "Do not deploy").

## Obligations

### UI (X:§Stage 2 b1; D:L213-222)

| ID | Source | Obligation | Boundary / error case | Acceptance method → expected | Owner |
|---|---|---|---|---|---|
| S2-01 | X:§S2 b5; D:L174-177; G Inicio | **Start screen = landing**: problem and user in one sentence; a button to the **ambiguous case**; four evaluation figures (false conforming, non-conformities caught, seconds per certificate, cost per certificate) shown as **visible placeholders with denominator placeholders** | No numeric figure hard-coded anywhere (code, static files) | Browser at 375/1280; grep for figure literals; mutation: hard-coded figure must fail a test | implementer |
| S2-02 | D:L217-218; G Progreso | **Progress**: real pipeline steps (case created, model reading, text layer, coherence, rules, proposal), each with **real status and duration** from the run | Mock model step labelled **mock**, never "on AMD"; no invented durations | Browser; durations come from receipt timings | implementer |
| S2-03 | D:L219-220; G Main/Bloqueo | **Case file**: every value beside its spec limit, result highlighted, **source location** (page + region/fragment); both channels visible when they disagree; unknown shown as unknown | No value shown without source or unknown marker | Browser on cg-001, cg-002, cg-003, cg-018 | implementer |
| S2-04 | D:L71-72, L221; A-07; A-21 | **Human decision**: release / block / request new certificate, with **reason, who, when**, recorded in the receipt. **Release enabled only when the core's proposal is release** (including a scan whose every critical field was confirmed, A-21); block and request-new-certificate always available | Per-field confirmation UI for scans covers **every** critical field (G Main shows only ReH: A-21 wins) | Browser + API tests: release disabled on cg-002/cg-003; enabled after full confirmation with ReH 358 | implementer |
| S2-05 | D:L73-74, L222; S1-33 | **Receipt** exportable (JSON download) without secrets; includes human decision, F1 snapshot (in this dispatch: "endpoint off / mock, no model") | A "Download PDF" control (G Recibo) is shown only if it works | Download in browser; secret scan of downloaded file | implementer |
| S2-06 | X:§S2 b1; X:§Acceptance S2 | Usable at **375 px and 1280 px**: no horizontal page scroll, all actions reachable | — | Auditor screenshots at both widths of each screen | implementer; auditor |
| S2-07 | X:§S2 b1; D:L215-216; X:§OUT OF SCOPE | Visible **fictitious-data notice** on every screen (companies, grade TRN-355, ESP-014) | — | Browser, each screen | implementer |
| S2-08 | X:§SOURCE (diseno) | Look follows **G** (layout, typography, colours, label wording) **only where it does not conflict** with D or I1–I7; every `[placeholder]` filled from real data or left visibly as a placeholder, **never hard-coded** | Conflicts resolved per D2-03 | Side-by-side review; grep for hard-coded placeholder values | implementer |
| S2-09 | X:§SOURCE (diseno) | README states the UI was **designed with Claude Design and implemented by the band**; data fictitious; mock-only status | — | README | implementer |
| S2-10 | X:I1; D:L67-69; G Bloqueo | The "Explanation" area shows a model explanation **only** when one exists with references; in mock mode it says there is **no model explanation (mock)**; the G placeholder text is never shown as an explanation | — | Browser on cg-002 | implementer |

### F1 "Runs on AMD" (X:§S2 b2; D:L145-153)

| ID | Source | Obligation | Boundary / error case | Acceptance method → expected | Owner |
|---|---|---|---|---|---|
| S2-11 | X:§S2 b2; D:L145-151 | F1 panel reads **live from the configured endpoint**: model list, GPU and ROCm from a small sidecar route, latency, tokens/s, cost estimate. **Never hand-written values** | Cost estimate needs a configured price (env); absent ⇒ "unknown", never a default | Code review; test with a **local stub endpoint** (D2-05) that the panel shows the stub's values | implementer; adversary |
| S2-12 | X:§S2 b2; D:L151 | **No endpoint configured ⇒ "endpoint off" with the real time of the last check**; unreachable endpoint ⇒ off with last check time | Never "on", never a model name | Browser with no env; auditor verifies | implementer; auditor |
| S2-13 | D:L153 | Each receipt stores a copy of the F1 data at reading time | Mock run ⇒ F1 copy says off / not applicable | Receipt inspection | implementer |

### F2 judge mode and live reading (X:§S2 b3–b4; D:L155-172)

| ID | Source | Obligation | Boundary / error case | Acceptance method → expected | Owner |
|---|---|---|---|---|---|
| S2-14 | X:§S2 b3; X:I7; D2-02 | The three stories — **conforming (cg-001), out of spec (cg-002), ambiguous scan (cg-003)** — available as **stored runs** in versioned static files, each **labelled stored with its timestamp**, and labelled as **mock readings (no model, no AMD)** in this dispatch | G wording "three real runs on AMD" / "read on AMD" is **not** used while the stored runs are mock (D2-02) | Browser; grep static files and UI strings | implementer; adversary |
| S2-15 | X:§S2 b3; D:L158-159 | "Read live" works **only when the endpoint is up**; otherwise **explains when it will be** (announced windows from configuration; none configured ⇒ says so) instead of failing | Never falls back to a stored or mock result | Browser with no endpoint; API test | implementer; adversary |
| S2-16 | X:§S2 b4; D:L162-168 | **Server-side global** live-read limit `LIVE_READS_PER_HOUR`, counted on the server; UI shows **remaining this hour**; exhausted ⇒ "Read live" **disabled with reopening time** (D2-06) | Unset/invalid/0 ⇒ live reading disabled (fail closed) | API tests; adversary bypass attempts (S2-19) | implementer |
| S2-17 | X:§S2 b4; D:L166-168 | Optional `LIVE_ACCESS_CODE`: if set, live reading requires it, **checked server-side**; never sent to or stored in the browser, never logged; wrong code rejected **without consuming** a reading; unset ⇒ open within the limit | Constant-time comparison | API tests | implementer |
| S2-18 | X:§S2 b4; D:L169 | **No login**; judge mode has **no limit** | — | Browser | implementer |
| S2-19 | X:§S2 b4 | Adversary shows the limit **cannot be bypassed from the browser** (client counters, headers, cookies, parallel requests, replay) and that a **stored result is never served as a new live one** | — | Adversary attack report | adversary |
| S2-20 | D:L160 | Uploading one's own certificate: with no endpoint, the case behaves as C11 endpoint_off (status error, proposal review, never release), clearly labelled | — | Browser upload of a dataset PDF with no endpoint | implementer |

### F4 Vercel fit (X:§S2 b6; D:L187-193, L131-138)

| ID | Source | Obligation | Boundary / error case | Acceptance method → expected | Owner |
|---|---|---|---|---|---|
| S2-21 | X:§S2 b6; D:L188-189 | **Stateless** backend functions; **no local SQLite** or server-side case store; stored stories as versioned static files; **new cases kept in the visitor's browser** | The live-read counter is the only server state (D2-06) | Code review; restart server ⇒ no case data lost/kept server-side | implementer |
| S2-22 | X:§S2 b6; D:L190-192 | **Before** writing the adapter call path: read Vercel's current documentation for **function max duration** and **request body size**, record values, **source URL and retrieval date** in the repo; design for them (**start-then-poll** if a reading may exceed the limit); upload size limit ≤ body limit | Values not from memory | File in repo with quotes; commit order (doc record before adapter path); design note | implementer |
| S2-23 | X:§S2 b6 | **Do not deploy** | — | No deploy config pushed / no deploy command run | all |
| S2-24 | D:L193; X:§S1 b1 | Local Docker run still serves UI + API on `PORT`, no outbound dependency in mock mode | — | Auditor `docker run --network none` + browser | implementer |
| S2-25 | P:L87 (C11); D:L126-127 | Model adapter call path (real mode) normalises **endpoint down, timeout, 429, 5xx, invalid JSON** into the C11 behaviour through the HTTP layer, bounded retry, no positive proposal, no secrets | — | Tests against a local stub endpoint and no endpoint | implementer; adversary |
| S2-26 | X:I6; D:L126; P:L70-71 | Browser **never receives** keys or codes (`MODEL_API_KEY`, `LIVE_ACCESS_CODE`); every env var in `.env.example` without values | — | Inspect network responses and client bundle | implementer; adversary |

### Verification

| ID | Source | Obligation | Acceptance method → expected | Owner |
|---|---|---|---|---|
| S2-27 | X:§S2 adversary list | Adversary attacks at least: prompt injection in a PDF (C10) via the UI path, endpoint down / timeout / invalid JSON (C11), isolation between consecutive cases incl. in the browser (C12), missing stamp (C13), stored result presented as live (I7) | Attack report | adversary |
| S2-28 | X:§MUTATION CHECK | Mutations for Stage 2 at least: stored/mock result passing as live, limit counted client-side or bypassable, hard-coded F1 value, release enabled on a block proposal; each killed by ≥ 1 test; branches unmerged | Mutation report | adversary |
| S2-29 | X:§Acceptance S2 | Auditor reproduces from a clean clone, runs the UI in a **real browser at 375 px and 1280 px**, records screenshots, verifies F1 shows "endpoint off" honestly, verifies F2 labels, **re-runs the Stage 1 suite** | Verdict record + screenshots | auditor |
| S2-34 | X:§S2 "extend it" | Every Stage 1 obligation (R1.5) still holds on the Stage 2 candidate | Stage 1 suite + adversary Stage 1 checks green | all |

### Labelling and sources (added after Stage 1 findings and source drift)

| ID | Source | Obligation | Boundary / error case | Acceptance method → expected | Owner |
|---|---|---|---|---|---|
| S2-30 | R (vigentes, kickoff-stream row added 17:35Z): «When you explain your project, make it clear which part runs on AMD and what that part does.» | README and landing state plainly **which part is meant to run on AMD** (model reading and explanation, D:L82-86) and that **in this dispatch nothing runs on AMD** (mock); no sentence implies an AMD run happened | — | README + landing review | implementer |
| S2-31 | X:I7; adversary O2 (msg 90b39eda) | A receipt or screen for a live attempt with **nothing read** (endpoint off/not configured) must not present itself as a live reading: `reading_source` and labels say "live attempt, no reading" (or equivalent), status error | — | Test + browser with `CERTGATE_MODE=real` and no endpoint | implementer; adversary |
| S2-32 | X:§SOURCE ("Read them completely at the start of each stage and record their SHA-256") | Stage 2 binds to source hashes **taken at Stage 2 start** (`stage-2/SOURCES.sha256`), which include the edits made to D, V, R after Stage 1 start (A-24) | — | Hash file committed at stage start | analyst |
| S2-33 | Auditor STAGE_ACCEPTED msg 32d95424 (open item); adversary ADV-S1-F04 (msg 2f4495c0); A-01; X:I7 | **Must fix before Stage 2 acceptance:** an injected failure that recovers on retry is recorded in the receipt — `planted` is the union of what the model output and the reader declare; `errors[]` records every failed attempt with `recovered: true/false` | Recovered and persistent failures both visible | Regression test (adversary probe P20 style); adversary re-runs P20 | implementer |
| S2-35 | Auditor msg 32d95424 (hygiene) | Committed logs and evidence must not carry local absolute paths (`C:\Users\…`) or user names beyond the seat handles before the repository goes public: redact in new files; record existing ones as a known item for the human (history is not rewritten) | — | grep of tree at candidate | implementer (product/logs); all seats (own evidence) |
| S2-36 | V (18:08Z): GPU price per hour now known | F1 cost estimate uses a **configured** price (env, e.g. `GPU_COST_PER_HOUR`), never the value from V hard-coded; absent ⇒ "unknown" | — | grep; test | implementer |

### Deferred to dispatch 2 (need the AMD endpoint)

S2-11 and S2-12 "on" path with real values; S2-15 live reading working; S2-13 F1 copy with real values; landing figures filled (S2-01); real model explanation (S2-10); live limit on a deployed multi-instance Vercel backend (D2-06); deployment.

## Decisions (ambiguity log)

| ID | Ambiguity | Decision | Evidence | Impact |
|---|---|---|---|---|
| D2-01 | Scope | Mock/stored path only, no endpoint, no deploy | X:§THIS HOST; X:§S2 b6 | Verdict wording |
| D2-02 | G says "three real runs on AMD", "read on AMD at …" but this dispatch has no model | Stored runs are produced by the **mock path** and labelled "stored · mock reading, no model · <timestamp>". G's AMD wording is used only when the data is real (dispatch 2) | X:I7; X:§SOURCE (G is look only; written design and I1–I7 win) | No false AMD claim |
| D2-03 | G conflicts with written spec | Written spec wins: (a) scan release needs **all** critical fields confirmed (A-21), not only ReH; (b) release not offered when proposal ≠ release (consistent with G Bloqueo); (c) explanation placeholder never shown as text (S2-10); (d) "KV avg 61" display allowed only with stated rounding, never compared (D1-09) | D:L54-55; X:I1, I3 | — |
| D2-04 | Receipt formats | JSON download required; PDF optional, shown only if implemented | D:L222 "exportable" | — |
| D2-05 | Verifying F1 "reads live, never hand-written" without an endpoint | A **local stub endpoint** (test double, not a model) may be used by tests and by the adversary to show the panel displays what the endpoint returns; it is not a real model call | X:§OUT OF SCOPE forbids real model calls only | F1 testable |
| D2-06 | Global hourly limit vs stateless functions | Window = **UTC clock hour**; reopening time = start of next UTC hour. Counter is server-side behind an interface; **local/single-instance in-memory implementation in this dispatch**; a shared managed store is required before any multi-instance deployment — recorded as an open item for dispatch 2, not claimed as solved | D:L164-165; D:L188-189 | Limitation stated |
| D2-07 | Live windows text | Announced windows come from configuration (env); none configured ⇒ UI says no window is announced | D:L158-159 | No hard-coded windows |

## R2.1 amendments (answers to adversary challenge msg 74bf34b9)

Line anchors (CH2-22): unless stated otherwise, `D:Lnn` in R2.0 refers to the **stage-1** file (29a203a8). In the stage-2 file (42081f15) the F4 block is **D:L189-195** and "sin SQLite local" is **D:L190**; F1 (L145), F2 (L155), live limit (L162) and Landing (L174) are unchanged.

| ID | Answers | Amendment | Owner |
|---|---|---|---|
| B-01 | CH2-01 [BLOCKING] accepted | Acceptance of S2-16, S2-17, S2-19, S2-25 (and F1 "on" display, S2-11) runs against the **D2-05 local stub**. The stub exists only in test code/config: **no default endpoint** ships, stored stories are never produced through it. The stub identifies itself (e.g. model id `certgate-test-stub`) and the product shows the endpoint-reported model id verbatim, so every result through it reads as the stub, never as AMD or a real model | implementer; adversary |
| B-02 | CH2-02 [BLOCKING] accepted | (a) the **server rejects** live requests when the limit is exhausted, independent of the UI; (b) check-and-consume is **atomic**: with k remaining, N > k parallel requests ⇒ exactly k accepted (test); (c) remaining count and reopening time come **only from the server** | implementer |
| B-03 | CH2-03 [DECIDE] — adversary proposal adopted | A live reading is **counted once when it is accepted and dispatched** to the endpoint, including attempts that later time out or return invalid JSON; retries inside one reading count once. **Not counted** when rejected before dispatch (wrong code, endpoint off, input validation failure, limit reached) | implementer |
| B-04 | CH2-04 [DECIDE] | Server-side **throttle on failed `LIVE_ACCESS_CODE` attempts**, separate from the reading counter: configurable (env), default fail-closed at a small number per UTC hour (implementer documents the value), then rejection with reopening time. Per-instance in this build, stated as a limitation | implementer |
| B-05 | CH2-05 [BLOCKING] accepted | Live-read and limit/remaining API responses carry `Cache-Control: no-store`; stored stories may be cached. Test via response headers | implementer |
| B-06 | CH2-06 [BLOCKING] accepted | F1 sidecar route and adapter use **only** the endpoint URL and model id from env; no request parameter, header or body field can set or override them. Test: such a parameter is ignored or rejected | implementer |
| B-07 | CH2-07 [DECIDE] accepted | Clock is injectable **only** in the test harness (constructor/module injection); not reachable via HTTP, production env, headers or browser | implementer |
| B-08 | CH2-08 [DECIDE] accepted | README, landing and F2 text **must not claim a global guarantee**: they state the limit is per server instance in this build (D2-06). Grep test | implementer |
| B-09 | CH2-09 [BLOCKING] accepted | A case reopened from browser storage is labelled **stored · <original timestamp>**, never live, even if it came from a live attempt. Browser test: process, reload, check label | implementer |
| B-10 | CH2-10 [DECIDE] | A receipt downloaded from a browser-held case carries a structural field stating it is a **client-held copy, not verified by the server**; stored-story receipts are versioned static files (integrity by repo hash). No integrity claim is made for client-held copies | implementer |
| B-11 | CH2-11 [BLOCKING] accepted; extends D2-02 | **Every** UI string from G that asserts an AMD run or reading (hero "reads it with an open model on AMD", "Read on [MODEL_ID], vLLM on an AMD Instinct GPU", "per certificate on AMD", "Model (AMD)", "Run on AMD · copied from the endpoint", "Explanation (model on AMD)", "LIVE reading on AMD", "AMD endpoint: on") is shown only when backed by real endpoint data; in this build only design-intent phrasing ("is meant to run on AMD") appears. Grep test over built UI and static stories for "on AMD", "AMD Instinct", "real runs", "Model (AMD)" | implementer |
| B-12 | CH2-12 [BLOCKING] accepted | Stored-story timestamp shown = receipt `created_at` in the versioned static file; never build time or "now"; unchanged across loads. Test | implementer |
| B-13 | CH2-13 [BLOCKING] accepted | An upload **never reaches MockReader**, even byte-identical to a dataset PDF; with no endpoint ⇒ C11 endpoint_off. Test with a byte-identical upload | implementer |
| B-14 | CH2-14 [BLOCKING] — adversary recommendation adopted; amends D2-03(b) | Release gating is enforced **in the core**: `recordHumanDecision`, the API and the CLI reject `release` when the current proposal ≠ release (after any A-21 confirmation re-run). UI gating is in addition. Stage 1 tests that recorded release on a block proposal are updated accordingly | implementer |
| B-15 | CH2-15 [DECIDE] | `decided_at` is **stamped by the server** when the decision passes through the API; any time from the client is labelled client time | implementer |
| B-16 | CH2-16 [BLOCKING] accepted | All document-derived strings are rendered as **text, never HTML**. Test with a PDF whose fields contain HTML/script (browser form of C10) | implementer; adversary |
| B-17 | CH2-17 [BLOCKING] accepted | **No third-party request** from any page: fonts self-hosted or system fallbacks. Test: browser network log shows only same-origin requests | implementer |
| B-18 | CH2-18 [BLOCKING] accepted | Web upload limit ≤ the Vercel request-body limit recorded under S2-22, enforced with a clear error; CLI/Docker limit stated separately. Test with a file just over the web limit | implementer |
| B-19 | CH2-19 accepted | S2-12 test compares the displayed last-check time with the server's check time (a later load shows a later time) | implementer; auditor |
| B-20 | CH2-20 accepted | S2-01 ban covers "MEASURED ON [N]" and denominators; grep built assets for digits in figure slots | implementer |
| B-21 | CH2-21 accepted | C12 in the browser includes confirmations and decisions: nothing entered on case A carries to case B in the tab or in storage | implementer; adversary |
| B-22 | CH2-23 [OPTIONAL], partly adopted | Adapter enforces a **maximum response size** and the C11 timeout on HTTP reads from the endpoint (slow/huge stub reply ⇒ C11). Unicode/very long field values at 375 px stay optional | implementer; adversary |
### R2.2 amendment (auditor testability review msg 2fa541ba)

Auditor items 1 (browser-kept cases), 2 (no external origin) and 3 (progress badge) are already covered by B-09, B-17 and B-11 of R2.1. B-11 explicitly includes the Progreso badge: no screen shows "LIVE", "on AMD", "endpoint: on" or a model id unless F1 read them from a live endpoint; **in this dispatch the progress badge says "mock reading · no model"**.

| ID | Answers | Amendment | Owner |
|---|---|---|---|
| B-23 | Auditor item 4 | The three stored stories are **generated by the candidate's own mock pipeline** and committed as versioned static files with the run's real `created_at` and receipt; no hand-written or build-time timestamp. Auditor regenerates them with the candidate pipeline and compares (excluding ids/timestamps): proposal, reasons and values must be equal; the shown timestamp equals the file's | implementer; auditor |
| B-24 | Auditor items 5–9 (readings adopted) | (5) S2-16 is tested with the stub endpoint up, including exhaustion and reopening at the next UTC hour (B-01, B-07). (6) S2-23: auditor verifies no linked deploy configuration (`.vercel/`, project ids, tokens), no deploy command in committed logs, nothing pushed; that no seat ever ran a deploy command is a **stated limitation**. (7) S2-35 is checked on files added or changed since `9d044991`; earlier files are a known item for the human. (8) S2-06 measured as `document.documentElement.scrollWidth <= window.innerWidth` at 375 and 1280 CSS px on every screen, with values recorded beside each screenshot, plus every action reachable. (9) API rejection of release on a non-release proposal (B-14) | auditor |