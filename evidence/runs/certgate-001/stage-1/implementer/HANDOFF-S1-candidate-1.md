# Stage 1 candidate 1: implementer handoff record

To: @hugo.valer/analyst-xwz3, @hugo.valer/adversary-xwz5, @hugo.valer/auditor-xwz6 · From: @hugo.valer/implementer-xwz4
Run certgate-001 · Stage 1 · Register claimed: **R1.5** (commit f9836f89, file SHA-256 fd836c91…a404)

The complete task and specification travel with the room handoff, which has 7 numbered parts. This file records
the candidate and its claims. A success statement here is a claim, not acceptance.

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `31335ee13944563a0eb559f6d1125efe94f598c9` |
| Product tree | `5a2efc6d37dabff1b0376c261f0d47f8bd9132b6` |
| Dataset and expectations commit (before any product code) | `4ebd95333e3bb486cb79c62fc6bd7a2e025379e9` (tree `9bddc672…6e70`, 2026-10-12T17:15:59Z) |
| Commit dates | 4ebd9533 at 17:15:59Z and 31335ee1 at 17:35:59Z, both after kickoff 15:00:00Z |
| Working tree at handoff | clean for product paths. Only the analyst's own `evidence/.../analyst/` files are modified or untracked, and I did not touch them |
| Dataset checksums | `data/CHECKSUMS.sha256` (134 files) |

## Commands

```sh
git clone C:\nexus\dev\certgate certgate-review && cd certgate-review
git checkout 31335ee13944563a0eb559f6d1125efe94f598c9

# local
npm ci && npm run build && npx vitest run

# container (build fetches npm dependencies; runtime needs no network)
docker build --no-cache -t certgate:31335ee .
# (a) full test suite inside the built image, offline
docker run --rm --network none certgate:31335ee npx vitest run
# (b) one named dataset case: prints proposal (summary) and receipt
docker run --rm --network none certgate:31335ee node dist/src/cli.js process --case cg-003
# service on PORT, offline (port publishing does not work with --network none, so it is queried from inside)
docker run --rm --network none -e PORT=4100 certgate:31335ee sh -c 'node dist/src/server.js & sleep 2; node -e "fetch(\"http://127.0.0.1:4100/health\").then(r=>r.text()).then(console.log)"'
# with a network, published:  docker run --rm -p 3000:3000 -e PORT=3000 certgate:31335ee ; curl -X POST localhost:3000/api/cases/cg-003/process
# external case directory (adversary interface, msg 0a960033):
docker run --rm --network none -v <dir>:/case:ro certgate:31335ee node dist/src/cli.js process --case-dir /case --line <partida>
#   <dir>/certificate.pdf, <dir>/reading.json (schema docs/schemas/model-output.schema.json), <dir>/delivery.csv
#   exit 0 processed (any proposal, incl. reader errors) / 2 input rejected / 1 internal error
```

## Tool versions

Node v24.19.0 / npm 11.17.0 (host). Image `node:24.21.0-bookworm-slim@sha256:d6aa754f…7b20`. Docker 29.8.0.
TypeScript 5.9.3, vitest 5.0.4, decimal.js 10.6.0, pdfjs-dist 6.4.299. Python 3.12.10, reportlab 5.0.0 and
Pillow 12.3.0 are used by the dataset generator only. Built image ID `sha256:e87869bc…1454`.

## Own results (implementer runs; not independent verification)

| Run | Result | Log (SHA-256) |
|---|---|---|
| Clean clone at 31335ee1, `npm ci && npm run build && npx vitest run` | 9 files, **175 passed**, 0 failed, 0 skipped | `local-clean-clone-tests.log` (`007abfacbe0c55265cc4b454b48c3c7d2178388ab14f4420fcddcc1b58bbc5ab`) |
| `docker build --no-cache` from that clone | exit 0 | `docker-build-no-cache.log` (`d3480ea24fb69b0e59ca3f40b12e0e5a4dc820c809fe036ce22e699d000b8cb5`) |
| `docker run --network none … npx vitest run` | **175 passed**, 0 failed, 0 skipped | `docker-network-none-tests.log` (`3c3598f5fe14c7e651d330e24ea66572f377a2b8d0ffbb89c5ae1dce0a636ad8`) |
| `docker run --network none … process --case cg-003` | exit 0, proposal review | `docker-network-none-cg-003.json` (`f68b7e6831b317f74b92e92e68f4ff48bab86a5a6c9282988dae39347a2d6cac`) |
| `docker run --network none -e PORT=4100 …` /health | `{"status":"ok","mode":"mock",…}` | `docker-network-none-health.log` (`62ee11a03358867a2aa1f726bb2aa1e437035d0b5627010ecdf5e1dcb5c9330e`) |
| All 30 dataset cases via CLI | 30/30 expected proposal, status and required reasons | covered by `test/dataset.test.ts` |

## Requirement mapping (R1.5, implementer rows)

| Row | Code | Tests |
|---|---|---|
| S1-01 | README.md | static.test "README states fictitious…" |
| S1-02 | LICENSE (MIT) | static.test "LICENSE is MIT" |
| S1-03 | .env.example (3 keys, no values), src/config.ts | static.test env reads = .env.example keys |
| S1-04 | .gitignore (human entries kept; dist/, coverage/ added) | static.test; `git check-ignore .env` → `.env` |
| S1-05 | Dockerfile, src/server.ts | docker logs above; entrypoints.test HTTP |
| S1-06 | TypeScript/Node 24, node:http core library (Stage 2 mounts it in Vercel functions) | README |
| S1-07 | src/types.ts (Case, Certificate, DeliveryLine, Spec, ChannelCheck, RuleResult, Decision, RunReceipt) | inputs.test contract types |
| S1-08 | SourceRef on every value, src/evaluate.ts toCertificate | inputs.test source refs |
| S1-09, S1-10 | src/pipeline.ts recordHumanDecision (the only setter) | human.test; static.test "no automatic release" |
| S1-11, A-17 | src/input-file.ts (magic bytes, size, /Encrypt, pdf.js PasswordException, no pages) | inputs.test validation (fixtures in test/fixtures) |
| S1-12, S1-49 | src/spec.ts, data/spec/ESP-014.r3.json; spec SHA-256 in receipt | inputs.test spec |
| S1-13 | src/delivery.ts | inputs.test delivery note |
| S1-14, A-10, A-11 | src/pdf.ts, src/text-layer.ts | channels.test extraction (9 digital cases, both layouts), header units |
| S1-15 | text-layer channel_available=false, NO_SECOND_CHANNEL, human_confirmation_required | channels.test scans |
| S1-16, D1-20 | src/evaluate.ts resolveChannels | channels.test C8, exact-decimal equality, missing text-layer field |
| S1-17 | evaluate CRITICAL_UNKNOWN | rules.test, channels.test |
| S1-18, A-18 | src/reader.ts MockReader (MOCK label), src/receipt.ts exporter checks | reader.test mock label, exporter rejects |
| S1-19, D1-15 | UnconfiguredLiveReader; src/cases.ts readerFor | reader.test real mode |
| S1-20, D1-05, A-14 | pipeline readWithRetry, src/model-output.ts | reader.test call counts 3/3/3/1/1, schema and JSON-number rejection |
| S1-21, A-04, A-12, D1-14 | coherence.heatMatches, evaluate | rules.test heat; dataset cg-010, cg-011 |
| S1-22, S1-23, A-08 | fields.EXPECTED_UNITS, config/plausibility.v1.json | rules.test units, scale jump, ranges contain limits |
| S1-24, A-02, A-20, A-22, A-03 | src/coherence.ts recomputeCev, docs/sources/cev-formula.md (Wikipedia rev 1354593332, quoted) | rules.test CEV (0.4500 pass; 0.4549/0.4550/0.4551 fail; printed 0.45/0.46; ties 0.425→0.42, 0.435→0.44) |
| S1-25, A-15 | src/decimal.ts, src/strict-json.ts | rules.test decimals; static.test no float; dataset/reader strict JSON |
| S1-26, S1-27 | evaluate.limitRule (inclusive, no rounding) | rules.test limits |
| S1-28 | evaluate KV sum ≥ 3 × 27 | rules.test KV |
| S1-29 | evaluate grade rule | rules.test grade; cg-012 |
| S1-30 | evaluate STAMP_MISSING | rules.test stamp; cg-028 |
| S1-31 | evaluate.propose | rules.test precedence and each I5 trigger |
| S1-32 | explanation recorded with used_for_decision=false; evaluate never reads it | reader.test explanation variants; cg-021 |
| S1-33 | pipeline.buildReceipt, receipt.exportReceipt | reader.test receipt content, secrets, no numbers |
| S1-34..S1-39 | data/ (4ebd9533), data/README.md | dataset.test; channels.test C10; isolation.test; static.test |
| S1-44 | suite runs in `--network none` | docker-network-none-tests.log |
| S1-46 (A-05) | KV_TEMPERATURE_MISMATCH | rules.test; cg-029 |
| S1-47 (A-06) | CERT_TYPE_NOT_3_1 | rules.test; cg-030 |
| S1-48 (A-07, A-21) | pipeline.confirmFields; CLI --confirm | human.test (a) release, (b) review, (c) block; receipt keeps both values |
| S1-45 | this folder, events/ | — |

## Known gaps and limitations

1. The text-layer parser covers the two fictitious layouts (A, B) only, not arbitrary mill certificates.
2. Only MockReader exists. It ignores the certificate bytes it receives. No real model or AMD hardware is used,
   so Stage 1 does not satisfy P:L19-20 (D1-01).
3. A receipt from `CERTGATE_MODE=real` says `reading_source: "live"` because that channel was attempted. It has
   status error, no reading, and model_id "none (model endpoint not configured)".
4. A human confirmation without a unit is taken in the field's expected unit (documented in the README).
5. The Stage 1 HTTP service only processes dataset cases. Uploads come in Stage 2.
6. Encryption is detected by the `/Encrypt` trailer token and by pdf.js PasswordException. Malformed PDFs that
   pdf.js repairs are accepted if they have pages.
7. Scans are not byte-reproducible by the generator. The committed bytes and checksums are authoritative.
8. The image keeps dev dependencies, and `/app` is owned by `node`, so vitest can run inside it.
9. No push (D1-19).

## Time and usage

Stage 1 handoff received at 16:52Z; implementer work ran from 17:03Z to 17:45Z (about 42 minutes of wall clock to
this candidate). Token and cost usage: unknown, because no per-seat usage meter is available to this seat. Model:
claude-opus-5-5.
