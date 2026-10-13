# Evidence index (S4-04)

This is where the evidence for every README claim lives. Each capability sentence is mapped to its proof in
[CLAIMS.md](CLAIMS.md); this file is the map of the records themselves. All paths are relative to the repository
root. Run `certgate-001` was built by the band: analyst, implementer, adversary and auditor seats.

## Task and specification

| What | Where |
|---|---|
| Human dispatches (verbatim) | [evidence/runs/certgate-001/DISPATCH-1.txt](evidence/runs/certgate-001/DISPATCH-1.txt), [DISPATCH-2.txt](evidence/runs/certgate-001/DISPATCH-2.txt) |
| Obligation registers, one per stage | [stage-1](evidence/runs/certgate-001/stage-1/OBLIGATIONS.md), [stage-2](evidence/runs/certgate-001/stage-2/OBLIGATIONS.md), [stage-3](evidence/runs/certgate-001/stage-3/OBLIGATIONS.md) (R3.3), [stage-4](evidence/runs/certgate-001/stage-4/OBLIGATIONS.md) |
| Hashes of the planning sources at each stage start | `evidence/runs/certgate-001/stage-N/SOURCES.sha256` |
| Stage register (verdicts and checkpoints) | [evidence/runs/certgate-001/STAGE-REGISTER.md](evidence/runs/certgate-001/STAGE-REGISTER.md) |

## Verdicts (auditor)

| Stage | Record |
|---|---|
| 1, offline core | [VERDICT-S1-candidate-2.md](evidence/runs/certgate-001/stage-1/auditor/VERDICT-S1-candidate-2.md) (candidate 1: [VERDICT-S1-candidate-1.md](evidence/runs/certgate-001/stage-1/auditor/VERDICT-S1-candidate-1.md)) |
| 2, web app | [VERDICT-S2-candidate-2.md](evidence/runs/certgate-001/stage-2/auditor/VERDICT-S2-candidate-2.md) (candidate 1: [VERDICT-S2-candidate-1.md](evidence/runs/certgate-001/stage-2/auditor/VERDICT-S2-candidate-1.md)) |
| 3, real model: **ACCEPTED, candidate 4 `5c904693`** | [VERDICT-S3-candidate-4.md](evidence/runs/certgate-001/stage-3/auditor/VERDICT-S3-candidate-4.md) (candidate 3: [VERDICT-S3-candidate-3.md](evidence/runs/certgate-001/stage-3/auditor/VERDICT-S3-candidate-3.md)) |
| Dispatch 1 final report (Stages 1 and 2) | [evidence/runs/certgate-001/final/FINAL-REPORT.md](evidence/runs/certgate-001/final/FINAL-REPORT.md) |

## Real model: evaluation, stories, endpoint

| What | Where |
|---|---|
| Implementer evaluation run, 27 cases (artifacts and report) | [evaluation/runs/real-candidate-dd557fd/](evaluation/runs/real-candidate-dd557fd/REPORT.md): `run.json`, `usage-before.json`, `usage-after.json`, `results.json` (preserved), `results.f1-regenerated.json`, `metrics.json` |
| Auditor's independent evaluation run, 27 cases | [evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1/](evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1/) |
| Metrics of both runs (generated) | [METRICS.md](METRICS.md), produced by `node tools/evaluate/metrics-md.mjs` |
| Landing figures (generated) | [public/figures.json](public/figures.json), produced by `node tools/evaluate/figures.mjs` |
| Real-run expectations, hand-written before the first run; tuning exclusions | [evaluation/expectations-real-run.json](evaluation/expectations-real-run.json), [evaluation/tuning-exclusions.json](evaluation/tuning-exclusions.json) |
| Development calls to the endpoint (one per line, no key or URL) | [evaluation/dev-calls.jsonl](evaluation/dev-calls.jsonl) |
| Recorded stories with the stored endpoint replies | [public/stories/](public/stories/): `cg-00N.json`, `cg-00N.recording.json` |
| Recorded endpoint replies used by the tests (both error shapes) | [test/fixtures/endpoint/](test/fixtures/endpoint/) |
| Model, publisher and licence, from the publisher's page | [docs/sources/model.md](docs/sources/model.md) |
| Vercel limits as retrieved (duration, body size) | [docs/sources/vercel-limits.md](docs/sources/vercel-limits.md) |
| CEV formula source | [docs/sources/cev-formula.md](docs/sources/cev-formula.md) |
| Analyst endpoint check at Stage 3 start; host-memory blocker record | [ENDPOINT-CHECK-stage3-start.json](evidence/runs/certgate-001/stage-3/analyst/ENDPOINT-CHECK-stage3-start.json), [BLOCKER-host-memory-1906Z.md](evidence/runs/certgate-001/stage-3/analyst/BLOCKER-host-memory-1906Z.md) |

## Implementer handoffs and verification logs (Stage 3)

| Candidate | Record and logs |
|---|---|
| 1 `0a40432` | [HANDOFF-S3-candidate-1.md](evidence/runs/certgate-001/stage-3/implementer/HANDOFF-S3-candidate-1.md); clean clone, docker `--network none`, browser checks in the same directory |
| 2 `e4132c5` (F3-01, O3-01) | [HANDOFF-S3-candidate-2.md](evidence/runs/certgate-001/stage-3/implementer/HANDOFF-S3-candidate-2.md); [repair-1/](evidence/runs/certgate-001/stage-3/implementer/repair-1/) |
| 3 `a892f77` (ADV-S3-F01) | [HANDOFF-S3-candidate-3.md](evidence/runs/certgate-001/stage-3/implementer/HANDOFF-S3-candidate-3.md); [repair-2/](evidence/runs/certgate-001/stage-3/implementer/repair-2/) (S3M06 kill logs) |
| 4 `5c904693`, accepted (ADV-S3-F02) | [HANDOFF-S3-candidate-4.md](evidence/runs/certgate-001/stage-3/implementer/HANDOFF-S3-candidate-4.md); [repair-3/](evidence/runs/certgate-001/stage-3/implementer/repair-3/) (S2M02br kill logs) |
| Auditor's own logs on candidate 4 | [evidence/runs/certgate-001/stage-3/auditor/candidate-4/](evidence/runs/certgate-001/stage-3/auditor/candidate-4/) (clean clone, docker build, `--network none` suite, mutant suites) |

## Stage 4

| What | Where |
|---|---|
| Delivery documents | [README.md](README.md), [DEPLOY.md](DEPLOY.md), [METRICS.md](METRICS.md), [CLAIMS.md](CLAIMS.md), this file |
| Checks over the documents (claims proofs, figures, env vars, duration, forbidden claims, secrets, local paths) | [test/docs.test.ts](test/docs.test.ts) |
| Implementer handoff record | [evidence/runs/certgate-001/stage-4/implementer/](evidence/runs/certgate-001/stage-4/implementer/) |
| Auditor's anonymous GitHub API baselines | [evidence/runs/certgate-001/stage-4/auditor/](evidence/runs/certgate-001/stage-4/auditor/) |

The adversary's Stage 3 bundles and mutation reports were posted in the room (msgs 7d0d6556, 540fb415). Their
evidence lives in the adversary's clean checkouts, at the test revisions named in those messages.
