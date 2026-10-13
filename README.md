# CertGate

**CertGate prepares the review of a steel mill inspection certificate against a purchase specification, and
proposes release, block or review. A person in Quality decides.** CertGate never releases material on its own.

> **All data in this repository is fictitious.** Siderúrgica Valdemora S.A. (the mill), Talleres Ribera Norte
> S.L. (the buyer), the grade TRN-355 and the purchase specification ESP-014 are invented for the demo. The limits
> in ESP-014 belong to that fictitious company and are **not** the limits of any real standard.

## Problem and user

When a batch of steel arrives at a plant, it comes with a mill certificate (an inspection certificate of the
EN 10204 3.1 kind): heat or lot, grade, chemical composition and measured mechanical properties. Someone in
goods-in or Quality must check that the certificate belongs to that batch and that the values meet the purchase
specification. Today this is done by hand, with certificates in different layouts and sometimes scanned. Material
out of spec that reaches production means scrap, claims or a recall.

- **Primary user:** goods-in or Quality technician at a mid-size plant that buys certified material.
- **Who decides:** the Quality manager who signs the release or the block.

## What it does

For each case (certificate PDF plus its delivery-note line), CertGate:

1. Validates the files (PDF by magic bytes, size limits, not encrypted, has pages) and records their SHA-256.
2. Reads the certificate through two channels:
   - the **model channel** (`ModelReader`): the open model **Qwen3.8-27B served by AMD Token Factory** reads the
     rendered **page images** of every certificate, digital or scanned (`src/web/live-reader.ts`). It is never
     given the text layer, so the two channels stay independent. It reads only: it never explains and never
     decides. The offline `MockReader` (dataset readings, labelled `MOCK` everywhere) remains for the tests and the
     Stage 1 CLI; real mode never falls back to it.
   - the **text layer** of a digital PDF, extracted without any model. A scan has no text layer, so its critical
     fields need human confirmation, and CertGate says so.
3. Compares the channels. A disagreement makes the field unknown and the case goes to review.
4. Checks internal coherence: heat or lot against the delivery note, expected units and scale jumps, and the
   printed carbon equivalent against one recomputed from the composition. The formula's source is cited in
   [docs/sources/cev-formula.md](docs/sources/cev-formula.md).
5. Applies deterministic, versioned rules against the spec, with exact decimals (never binary floating point).
6. Proposes `release`, `block` or `review`, records the person's decision (who, when, why) and exports a run
   receipt without secrets.

Proposal precedence: a heat mismatch means review; otherwise block > review > release. Release is proposed only
when no review or block condition holds. A scan is never proposed for release until a person has confirmed every
critical field.

## Where AMD fits, and what runs in this build

**Reading each certificate is done by the open model Qwen3.8-27B (reported by the endpoint as
`self-dploy/Qwen3.8-27B`; publisher Qwen Team, licence apache-2.0 as published at
https://huggingface.co/Qwen/Qwen3.8-27B, retrieved 2026-10-13; see [docs/sources/model.md](docs/sources/model.md)),
served by AMD Token Factory.** The model receives page images and returns a JSON reading; requests use
temperature 0. The text layer, the coherence checks, the rules and the proposal run in the CertGate backend
without any model, and a person decides. **No model-written explanation is requested or shown** (register R3.1
C-04): the case file shows the deterministic rule reasons only. A page/fragment location given by the model is
labelled "as reported by the model"; it is the model's claim, not a verified position.

The endpoint does not expose the GPU model, the ROCm version or the serving-stack version, so the "Runs on AMD"
panel says "not exposed by the endpoint" for them and nothing else claims them. The panel shows only what the
endpoint reports: the model list (`GET /models`), the key's limits and spend (`GET /usage`, or the `X-RateLimit`
headers of the last reading), the model id, latency, tokens and the cost of the last reading, labelled "cost
reported by the endpoint; Token Factory credits are free and have no monetary value". Endpoint probes are cached on
the server for 60 s, because every call counts in the same per-key budget.

The endpoint provider keeps prompts and outputs for about 2 days. **Only the fictitious dataset is ever sent.**

## Status of this build (run certgate-001, Stages 1 to 3)

- **Stage 1, offline core:** contract, inputs, text layer, coherence, rules, proposal, receipt, MockReader.
- **Stage 2, web app in the shape of Vercel functions:** landing, judge mode with three stored runs, case file,
  progress, per-field human confirmation, decision, exportable receipt, "Runs on AMD" panel, live-reading path
  with a server-side hourly limit and an optional access code. **Not deployed.**
- **Stage 3, real model:** the live reader against AMD Token Factory, the full evaluation of 27 cases
  (see "Evaluation" below), and the three judge-mode stories **recorded from real runs**.
- The three stories (cg-001, cg-002, cg-003) are **recorded real readings**, stored with their receipt, the F1
  snapshot and the recording date in `public/stories/`, and labelled "recorded … not live" everywhere. Each
  `<id>.recording.json` keeps the endpoint's reply verbatim (never the model's reasoning, the key or the endpoint
  URL), so judge mode re-evaluates a story with a person's confirmations **without calling the model**, and a
  test checks that the stored stories are what this pipeline produces from those replies.
- Calling discipline: at most 2 requests in flight, client timeout 300 s per attempt, retries only on 429 and 5xx
  with exponential backoff (2 s, 4 s, capped at 120 s; `Retry-After` honoured), at most 3 attempts. A timeout, an
  invalid reply, empty content (even with JSON in the reasoning), or `finish_reason: length` is a C11 failure:
  status error, proposal review.
- **Live reading of uploads.** Before any live reading the page shows, and the server requires the visitor to
  confirm, the notice that the file goes to AMD Token Factory, which keeps prompts and outputs for about 2 days,
  and must be synthetic. Without `LIVE_ACCESS_CODE` configured, live reading is limited to the dataset
  certificates (matched by SHA-256); a visitor-uploaded file needs the access code. There is no default code.
- **Deployed site: live reading unavailable; live demonstration from the container.** One live reading takes
  about 1 to 4 minutes, and its worst case is 3 × 300 s + 2 × 120 s = 1140 s, above the 300 s Vercel function
  duration. With `VERCEL` set, `/api/live/read` answers 503 and the page says so; judge mode works.
- The live-read limit is counted on the server, **per server instance in this build** (in memory). Documented
  deployment value: `LIVE_READS_PER_HOUR=20`. Measured consequence (test "the live limit is per instance" in
  `test/web.test.ts`: two instances with a limit of 2 let 4 readings through): with N instances the real ceiling
  is N × 20 live readings per
  hour, all drawn on the same endpoint key (rate limit 20 requests per minute and daily cost limit 1, as reported
  by GET /usage). A deployment with several instances needs a shared store behind the same interface
  (`src/web/limiter.ts`).
- The text-layer parser covers the two fictitious certificate layouts of the dataset, not arbitrary mill
  certificates (known gap).
- **The UI was designed with Claude Design and implemented by the band** (four Claude Code seats: analyst,
  implementer, adversary, auditor). The design defines the look; behaviour follows the written specification.
## Evaluation (real model, Stage 3)

27 fictitious certificates (cg-004 … cg-030), read by the real model through AMD Token Factory on
2026-10-13, 17:28–17:49 UTC, candidate `dd557fd`, prompt SHA-256 `32fad2f9…`. cg-001 … cg-003 were used to tune
the prompt and are excluded. Full artifacts and the report:
[evaluation/runs/real-candidate-dd557fd/](evaluation/runs/real-candidate-dd557fd/REPORT.md).

| | |
|---|---|
| False conforming (released when the expected proposal was not release) | **0 of 18** (strict, expected block: 0 of 6) |
| Non-conformities caught | 6 of 6, all proposed block |
| Proposal equal to the expected one | 27 of 27 |
| Review proposed by the rules | 12 of 27; failures 0 of 27; retries 0 |
| Field readings correct | 591 of 594; 1 wrong (cg-028 CEV read `0,41`, caught by the text layer, so review) |
| Seconds per certificate | mean 89.6 s, median 80.6 s (N = 27) |
| Cost per certificate | mean 0.00020529, cost reported by the endpoint; Token Factory credits are free and have no monetary value |

The landing page shows these figures from `public/figures.json`, which is generated from the artifacts
(`node tools/evaluate/figures.mjs <run dir>`) and never written by hand.

**Limitations.** On the ambiguous scan cg-003 (a tuning case, outside the 27), the model confidently reads the
smudged yield strength as 338 MPa where the true value is 358. The recorded story therefore proposes **block**,
not review. It is not a release, and the scan still needs a person to confirm every critical field. The prompt
was not tuned to hide this (register R3.3 C-23). Readings take about 1 to 4 minutes. One evaluation run is
reported; repeat runs may differ.

## Run it

Requirements: Node.js 24 (local run) or Docker.

```sh
# Docker
docker build --no-cache -t certgate .

# The web UI: open http://localhost:3000 after this (no endpoint: judge mode shows the recorded real runs; "endpoint off")
docker run --rm -d --name certgate-ui -p 3000:3000 -e PORT=3000 certgate
docker stop certgate-ui

# The service on PORT, reachable from the host (a published port needs a network; the service itself makes
# no outbound call in mock mode)
docker run --rm -d --name certgate -p 3000:3000 -e PORT=3000 certgate
curl -X POST http://localhost:3000/api/cases/cg-003/process
docker stop certgate

# The service fully offline: with --network none no port can be published, so query it from inside
docker run --rm --network none -e PORT=3000 certgate sh -c 'node dist/src/server.js & sleep 2; node -e "fetch(\"http://127.0.0.1:3000/api/cases/cg-003/process\",{method:\"POST\"}).then(r=>r.text()).then(console.log)"'

# One dataset case through the CLI, inside the image
docker run --rm --network none certgate node dist/src/cli.js process --case cg-003

# The full test suite inside the image
docker run --rm --network none certgate npx vitest run

# Local
npm ci
npm run build
npm test
node dist/src/cli.js list
node dist/src/cli.js process --case cg-001
```

### CLI

```
certgate list
certgate process --case <id>                              dataset case data/cases/<id>
certgate process --case-dir <dir> [--line <n>] [--delivery <csv>]
    <dir>/certificate.pdf, <dir>/reading.json (mock model output), <dir>/delivery.csv (or --delivery);
    the paired delivery line from --line or <dir>/case.json "delivery_line"
options:
  --out <file>                 also write the output to a file
  --receipt-only               print only the receipt JSON
  --confirm <field>=<value>    human confirmation of a critical field (repeatable; value "absent" = not on document)
  --confirmed-by <name>
  --decide <release|block|request_new_certificate> --reason <text> --decided-by <name>
exit codes: 0 processed (any proposal, including reader errors), 2 input rejected, 1 internal error
```

Field names for `--confirm`: `certificate_type`, `heat_or_lot`, `grade`, `chemistry.<C|Si|Mn|P|S|Cr|Ni|Mo|Cu|V>`,
`cev_printed`, `mechanical.<ReH|Rm|A|KV_1|KV_2|KV_3>`, `kv_temperature`, `inspection_stamp`. A confirmation
without a unit is taken in the field's expected unit.

### Web UI and HTTP API

Open `http://localhost:<PORT>/`. Screens: landing and judge mode (`#/`), a stored run (`#/story/cg-003`), a case
kept in this browser (`#/local/<id>`), the "Runs on AMD" panel (`#/amd`), and each case's receipt with a JSON
download. Every page carries the fictitious-data notice. Pages make no third-party request.

| Method and path | Result |
|---|---|
| `GET /health` | status and mode |
| `GET /api/f1` | "Runs on AMD" data from the configured endpoint, probed at most once per 60 s (`no-store`) |
| `GET /api/live/status` | live reading: enabled, limit, remaining this hour, reopening time, windows, upload policy, notice (`no-store`) |
| `POST /api/live/read` | `{certificate_base64, delivery_csv?, delivery_line?, access_code?, synthetic_confirmed: true}`: a live reading, or C11 `endpoint_off` with no endpoint (`no-store`) |
| `POST /api/stories/<cg-001\|cg-002\|cg-003>/evaluate` | `{confirmations?: [{field, value}], confirmed_by?, decision?: {action, reason, decided_by}}`: the recorded reading re-evaluated (no model call) with a person's confirmations and decision; times are stamped by the server |
| `GET /stories/<id>.json`, `GET /stories/<id>.recording.json` | recorded run and its stored endpoint reply (versioned static files) |
| `GET /figures.json` | landing figures, generated from the evaluation artifacts |
| `GET /api/cases`, `POST /api/cases/<id>/process` | Stage 1 dataset API (mock path) |

Release is rejected (HTTP 409, and in the core) while the proposal is not release.

### Live reading against the real endpoint (container or local)

```sh
# MODEL_BASE_URL, MODEL_API_KEY and MODEL_ID come from your environment; never write their values anywhere.
docker run --rm -p 3000:3000 -e PORT=3000 -e MODEL_BASE_URL -e MODEL_API_KEY -e MODEL_ID -e LIVE_READS_PER_HOUR=20 certgate
```

### Live reading against the local test stub (tests and review only)

```sh
node test/support/stub-endpoint.mjs --port 8001            # TEST STUB, not a model; --mode timeout|http_429|http_5xx|invalid_json|huge
MODEL_BASE_URL=http://127.0.0.1:8001/v1 MODEL_ID=certgate-test-stub MODEL_API_KEY=stub-key \
  LIVE_READS_PER_HOUR=3 PORT=3000 node dist/src/server.js
```

### Evaluation and stories against the real endpoint (opt-in; never part of `npm test`)

`npx vitest run` makes no endpoint call and passes with `--network none`: the live reader is tested against
replies recorded from the endpoint (`test/fixtures/endpoint/`) and a local stub. Commands that call the endpoint
are separate and need the three `MODEL_*` variables:

```sh
npm run build
node tools/evaluate/run-eval.mjs --out evaluation/runs/<name>     # cg-004..cg-030, GET /usage before and after
node tools/evaluate/metrics.mjs evaluation/runs/<name>            # recompute metrics.json from results.json (offline)
node tools/evaluate/figures.mjs evaluation/runs/<name>            # regenerate public/figures.json (offline)
node dist/src/tools/build-stories.js record                       # re-record the three stories (3 readings)
node dist/src/tools/build-stories.js                              # rebuild the stories from the recordings (offline)
```

Browser checks (needs Playwright with Chromium, not part of `npm test`): `node test/browser/ui-checks.mjs [outDir]`.

### Configuration

Environment variables only; see [.env.example](.env.example) (no values in it; `.env` is ignored by git). Secrets
(`MODEL_API_KEY`, `LIVE_ACCESS_CODE`) stay on the server and are never sent to the browser.

| Variable | Default | Meaning |
|---|---|---|
| `CERTGATE_MODE` | `mock` | CLI and dataset API: `mock` (offline, dataset readings) or `real` (no adapter: fails visibly) |
| `PORT` | `3000` | HTTP port |
| `CERTGATE_DATA_DIR` | `<repo>/data` | dataset directory |
| `MODEL_BASE_URL` | none | OpenAI-compatible endpoint (AMD Token Factory); unset = endpoint off |
| `MODEL_API_KEY` | none | secret, sent only to that endpoint |
| `MODEL_ID` | none | model id requested from the endpoint |
| `LIVE_READS_PER_HOUR` | none (disabled) | live readings per UTC hour, server-side, per instance; unset, invalid or 0 = disabled; documented deployment value 20 |
| `LIVE_ACCESS_CODE` | none (no default) | needed for live reading of a visitor-uploaded file; without it only dataset certificates are read live |
| `VERCEL` | set by Vercel | on the deployed site live reading is unavailable (time budget) |
| `LIVE_CODE_FAILURES_PER_HOUR` | `5` | wrong codes allowed per UTC hour before rejection |
| `LIVE_WINDOWS` | none | announced live windows, shown as text |

Input limits: CLI and container certificate PDF up to 10 MiB; **web upload up to 3 MiB** of PDF (sent as base64,
so the request stays below Vercel's 4.5 MB body limit); delivery note up to 1 MiB (CLI) or 256 KiB (web). The live
adapter waits up to 300 s per attempt with at most 3 attempts, which does **not** fit Vercel's 300 s function
limit, so the deployed site has no live reading (above). Sources and design notes:
[docs/sources/vercel-limits.md](docs/sources/vercel-limits.md). `api/index.ts` and `vercel.json` give the Vercel
function shape.
## Dataset

30 fictitious certificates with planted faults, 25 digital and 5 scanned. The expected outcomes were written and
committed before any product code. Three certificates predate the kickoff; 27 were generated in this run. See
[data/README.md](data/README.md) for provenance, coverage and checksums.

## Reason codes

The codes of [data/expected/README.md](data/expected/README.md), plus these, raised by the product:

| Code | When | Effect |
|---|---|---|
| `TEXT_LAYER_MISSING:<field>` | The model channel read a field that the text layer does not contain | review |
| `RULE_NOT_EVALUABLE:<field>` | A spec rule's input is unknown | review |
| `NOT_A_NUMBER:<field>` | A numeric field holds text that is not a decimal | review |
| `READER_ERROR:invalid_output` | Model output parses as JSON but breaks the reading schema | review, status error |
| `READER_ERROR:endpoint_not_configured` | `CERTGATE_MODE=real` without an adapter | review, status error |

## Repository layout

```
src/        product code (TypeScript, Node 24)
test/       implementation tests (vitest), runnable offline
config/     band-defined plausibility ranges (not from any standard)
data/       fictitious dataset, spec ESP-014 r3, delivery notes
docs/       cited sources
tools/      dataset generator (Python, dev-time only)
```

## How it was built

CertGate is built by a four-seat band (analyst, implementer, adversary, auditor) of Claude Code agents. Claude
Code is how it is built. In the full product, the model that reads certificates is meant to run on AMD hardware;
this build contains no such reading.

## License

[MIT](LICENSE).
