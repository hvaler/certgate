# Stage 3 candidate 1: implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 3 (real model)
Register: `evidence/runs/certgate-001/stage-3/OBLIGATIONS.md` R3.0 + R3.1 (C-01…C-18) + R3.2 (C-19…C-22) +
R3.3 (C-23), SHA-256 `52dbd3c08867124e27526d47ec778462b9c61c4cc104fcfb7325caba42bb9788`; R2.2 and R1.6 still in force.
Task: dispatch 2 (room msg 7e4ee02a) and the analyst's 13-part Stage 3 handoff, both forwarded complete with this
handoff. This record states what was done; it is not an acceptance. Nothing is deployed or pushed.

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `0a40432ccce2758d7da490cbcdb3be758e9faaa6` |
| Product tree | `fe87f6f2f8501d6a41016fe13baf8df3ca97ac8e` |
| Evaluation candidate | `dd557fd2395db09566dc193c69e4dc30600ef7db`: the real run used this commit (reading path, prompt, rules) |
| Commits since R3.3 (`0b68387`) | `dd557fd` real reader, F1, evaluation tools · `a967439` S3-25 redaction · `5b9cd49` evaluation artifacts · `c2da617` stories, UI, live path, tests · `264165f` UI fixes · `0a40432` S3-23 measurement |
| Prompt SHA-256 | `32fad2f980bcf755841d80bb2385d9601465f83b5b42c1b6c048f3bfe1cfb567`, frozen since tuning (C-13); unchanged after the run |
| Between dd557fd and 0a40432 | no change to the reading instruction, the request, the parsing, the channels, the rules or the proposal. Changes: F1 in-flight de-duplication (C-06), the "as reported by the model" location label in the view and in the receipt `values` (C-03), upload policy and notice (C-02), the deployed-site gate (C-07), recorded stories, UI, tests, docs. The backoff constants moved to `limits.ts` with the same values (2000 ms base, 120 s cap) |

## Commands

```sh
npm ci && npm run build && npx vitest run            # 269 tests; no endpoint call (C-22)
docker build --no-cache -t certgate . && docker run --rm --network none certgate npx vitest run
node test/browser/ui-checks.mjs <outDir>             # needs Playwright + Chromium
# Real endpoint, opt-in, under the endpoint lease (D3-02):
node tools/evaluate/run-eval.mjs --out evaluation/runs/<name>   # 27 cases + 2 GET /usage
node tools/evaluate/metrics.mjs evaluation/runs/<name>          # offline recompute
node tools/evaluate/figures.mjs evaluation/runs/<name>          # offline: public/figures.json
node dist/src/tools/build-stories.js record                     # 3 story readings (+ F1 probes)
```

Verification on a clean clone of 0a40432, with MODEL_* unset (logs in this directory):
`clean-clone-tests.log`: 269/269 pass · `docker-network-none.log`: image builds, 269/269 pass with
`--network none`, CLI runs offline · `browser-checks.log`: 15 PASS / 0 FAIL, screenshots in `browser/`.

## Evaluation (S3-13…S3-16; artifacts `evaluation/runs/real-candidate-dd557fd/`, report `REPORT.md`)

Run 2026-10-13T17:28:48Z → 17:49:07Z, after `31da371` (C-20); 27 cases cg-004…cg-030; cg-001…003 excluded; 2 in flight;
temperature 0; model reported `self-dploy/Qwen3.8-27B` in all 27 replies. Completed, not BLOCKED.

| Metric | Value |
|---|---|
| FC-broad | **0 / 18** |
| FC-strict | 0 / 6 |
| FC-broad over all | 0 / 27 |
| Non-conformities caught / blocked | 6 / 6 · 6 / 6 (cg-005, 006, 007, 012, 020, 021) |
| Proposal = expected | 27 / 27; no proposal mismatch |
| Rule abstention (review, processed) | 12 / 27 |
| Failure (status error), by class | 0 / 27 |
| Per-field (594 = 22 × 27) | correct 591, correct-unknown 1 (cg-017 heat), correct-absent 1 (cg-028 stamp), wrong 1 (cg-028 `cev_printed` read `0,41`; text layer `0.41`, so CHANNEL_DISAGREE, so review), invented 0, confident-on-illegible 0 |
| Seconds per certificate | mean 89.6, median 80.6, min 52.0, max 207.7 (N = 27 processed) |
| Latency per request | mean 89 500 ms, median 80 554 ms (N = 27) |
| Tokens per certificate | total mean 4 234; completion 1 441; reasoning 552 |
| Cost per certificate (cost reported by the endpoint; Token Factory credits are free and have no monetary value) | mean 0.00020529, median 0.00020112, N = 27, unknown 0 |
| Retries | 0 in 27 requests |
| GET /usage delta vs sum of reply costs (C-15) | 0.00554288 vs 0.00554288; difference 0 |

| Artifact | SHA-256 |
|---|---|
| run.json | `dfdce1c49656bcf8a3222f8cd1483eb45d2f10167da6bd6e6628fcac815a4cae` |
| usage-before.json | `f2447eb9c703abca630a5c733bb5bd2b81f39a3956c2069473880e53615a43d9` |
| usage-after.json | `79af757bf2c097ab5885efb5d27926cf9e268300fccc7cb8e49d40187a432198` |
| results.json | `2a08b37d74f05196bb906381cd9decff75100df8bc6c6039519f527bb03c5cef` |
| metrics.json | `ee3fd40ebfb965ec0bb152290fce14d67baf018901581623253dc58613890e98` |
| REPORT.md | `6dd9b9399a90d05218d3efc9e561eae8337bf55ae747b17e6089f1be159d4ef7` |
| public/figures.json | `c0c8b6c404fab43470e376b13961dbece04c24f9e2f1674eb80542e5f8e3b705` |
| evaluation/expectations-real-run.json | `eab916906b1ad3998fee155d892eb9da248296995104c77d83027369ce9e5973` |
| evaluation/tuning-exclusions.json | `520fab603a4a4b4c90b6dd77aea202e452e658c4371dc8efb3148e3810cb051a` |
| evaluation/dev-calls.jsonl | `c31fd413b101179f665c3d55f4f1c8701d827df150d30dee51d6d481168c71e5` |

`metrics.json` was recomputed offline after the run because of a number-formatting fix in `metrics.mjs`: integer
means had lost their trailing zeros (latency "895" for 89500). The numerators and denominators are unchanged.

## Stories (S3-18)

Recorded 17:49:52Z–17:53:44Z from real readings through the product's live path. Each comes with its receipt, its
F1 snapshot and `<id>.recording.json`, which keeps the reply content verbatim and never the reasoning, the key or
the URL.

| Story | Proposal | Reasons | SHA-256 story · recording |
|---|---|---|---|
| cg-001 | release | — | `2b6c9d6e…` · `a29231a2…` |
| cg-002 | block | NO_SECOND_CHANNEL, RULE_FAIL:Mn, RULE_FAIL:CEV | `d0c3a28d…` · `228376e3…` |
| cg-003 | **block** | NO_SECOND_CHANNEL, RULE_FAIL:ReH (ReH read **338**, true 358) | `d0bd4e89…` · `75977f5e…` |

cg-003 is recorded as the run proposed (C-23). It is a proposal mismatch with the dataset's `review`, caused by a
model misread of the illegible digit. It is not false conforming. The card makes no claim about the digit read.
After a person confirms every critical field with ReH 358, the proposal is release (browser check). This is
stated in the README limitations and in REPORT.md.

## Endpoint calls by this seat in Stage 3 (all logged; no key or URL value anywhere)

| Window | Calls |
|---|---|
| 16:5xZ endpoint check | 1 (GET /models) |
| 17:07Z–17:21Z development and tuning (lease b2507185 → 2cea78b8) | 10 (`evaluation/dev-calls.jsonl`) |
| 17:28Z–17:54Z evaluation, stories and headroom (lease 1c34afd7 → 48108578) | 41 = 29 (run) + 11 (stories: 3 reads + 4 F1 probes × 2) + 1 (GET /usage) |

Headroom posted on release (C-21): daily_cost_remaining_usd 0.99159412 of 1; rpm 20. The auditor's full run fits.

## Register mapping (Stage 3 rows)

| Row | Where |
|---|---|
| S3-01, S3-02, C-01, C-12 | `src/web/live-reader.ts` (page images only, temperature 0, 300 s, ≤2 in flight, 429/5xx only, Retry-After, backoff, ≤3 attempts) · `test/live-reader.test.ts` request-shape and discipline tests |
| S3-03, C-05 | finish_reason length → `truncated_output`; empty content (JSON in reasoning) → C11 · tests in `live-reader.test.ts` |
| S3-04 two channels with the real model | digital cases compare text layer vs real reading; side by side in the case file (columns Model channel / Text layer) and in receipt `channel_checks`; real run: cg-028 CHANNEL_DISAGREE (`0,41` vs `0.41`) |
| S3-05 scan review from the rule | NO_SECOND_CHANNEL rule, independent of model confidence; real run: cg-016, cg-017, cg-025 review; cg-002/003 stories carry NO_SECOND_CHANNEL |
| S3-07 never the mock in real mode | `cases.ts` real ⇒ UnconfiguredLiveReader; evaluation and stories use LiveReader only; stories replay only the stored real reply (`src/web/recorded-reader.ts`) |
| S3-06 recorded fixtures, both error shapes | `test/fixtures/endpoint/*.json` (`{"detail":{"error"}}` 404, `{"error"}` 401) · `live-reader.test.ts` |
| S3-08…S3-12 (S3-11 F1 copy in each receipt), C-06 | `src/web/f1.ts` (GET /models, GET /usage, X-RateLimit, 60 s cache + in-flight dedupe, NOT_EXPOSED, no sidecar) · `web.test.ts` F1 tests · cost label `COST_LABEL` in `src/pipeline.ts` |
| S3-13…S3-16, C-08…C-11, C-13…C-15 | `tools/evaluate/run-eval.mjs`, `metrics.mjs`; artifacts and REPORT.md |
| S3-17, C-16, C-20 | `evaluation/expectations-real-run.json` (31da371, a3af07f, 47f01cb, before the run) |
| S3-18, D3-08, C-23 | `src/tools/build-stories.ts`, `public/stories/*` · `web.test.ts` "recorded stories" |
| S3-19 | `tools/evaluate/figures.mjs` → `public/figures.json`; regeneration test in `web.test.ts` |
| S3-20 | `.env.example`, README (LIVE_READS_PER_HOUR = 20 documented) |
| S3-21 | `docs/sources/model.md` (huggingface.co/Qwen/Qwen3.8-27B, apache-2.0, retrieved 2026-10-13) |
| S3-22 | no default access code (`config.ts`); README |
| S3-23 | per instance, stated on the page and in the README with the measured consequence: test "the live limit is per instance" (two instances × limit 2 ⇒ 4 readings) |
| S3-24, C-07 | `limits.ts` LIVE_WORST_CASE_MS = 1 140 000 > 300 000 ⇒ deployed site 503 "live reading unavailable on the deployed site; live demonstration from the container" · budget test |
| S3-25 | `a967439` (5 files) |
| S3-26 | `labels.test.ts` "every story label in app.js says not live" (fails when " · not live" is dropped from the judge card) |
| C-02 | `app.ts` (dataset SHA-256 set without LIVE_ACCESS_CODE; `synthetic_confirmed` required), `app.js` notice + checkbox · web tests + browser checks |
| C-03 | `view.ts` / `pipeline.ts` "as reported by the model" |
| C-04 | `view.ts` explanationView never shows model text; README/UI say the model only reads · tests |
| C-22 | default suite offline; C-22 guard test; docker `--network none` log |

## Known gaps

- cg-003 misread (above). Readings take 52–208 s, so live reading runs from the container only.
- One implementer run. Repeat runs may differ (C-12); the auditor's run is the independent one.
- The receipts in `results.json` predate the C-03 `location` field.
- The live-read limit is per instance (in memory); stated with its consequence (S3-23).
- The text-layer parser covers the two dataset layouts only (Stage 1 known gap).

Time: Stage 3 started 16:54Z; candidate frozen 18:09Z (75 min used of 360).
