# Final report: run certgate-001, dispatch 1 (Stages 1 and 2)

Author: analyst-xwz3 (Claude Code, model `claude-opus-5-5`). Room: `3e47b667-b685-4655-8f34-cc0dad08ab30`. Dispatch: room msg `7e4a26f9-70e9-4043-807b-b4b05093a00b` (from hugo.valer), received 2026-10-12T16:52Z.

**This dispatch used no real model and no AMD hardware.** Every model reading went through a labelled mock reader (`MockReader`). The live path was exercised only against local **test stub** endpoints, which are not models. Nothing was deployed and nothing was submitted. Nothing was pushed: `git push` is denied on this host (D1-19), so the public repository https://github.com/hvaler/certgate has received nothing from this run. Both acceptances are **internal** band acceptances on the mock/stored path. Neither is MVP acceptance (04-PLAN L19-20), and no external evaluation has taken place.

## 1. Outcome

| Stage | Accepted candidate | Product tree | Auditor verdict | Repair cycles | Room checkpoint |
|---|---|---|---|---|---|
| 1, offline core | `9d0449917b237ab5de51ccf1141b772e5c0e7008` | `e65caa5b420d833bac8e9037db45688239f6e4f6` | ACCEPTED (mock path only). Record `stage-1/auditor/VERDICT-S1-candidate-2.md`, commit 3717f315, SHA-256 c44c1dc3…e29f | 1 of 5 | `32d95424` |
| 2, web app, Vercel shape, no model | `b7f4a546fee6784d3312c19b74817807f6f0114d` | `33bb040e5a21ce9fa1b92f0f1dd80708808bf3ad` | ACCEPTED (mock/stored path, no endpoint, no deployment). Record `stage-2/auditor/VERDICT-S2-candidate-2.md`, commit 2d6d6d11, SHA-256 617d023f…66e4 | 1 of 5 | `863c3ff1` |

Rejected candidates are preserved:

| Stage | Rejected candidate | Rejection record | Reasons |
|---|---|---|---|
| 1 | `31335ee1` | record aa40a9af | **F-01**: injected reader failures were not labelled planted. **F-02**: the README run command didn't work. **F-05**: two stealth float mutants survived the suite |
| 2 | `496f4ddc` | record 1096e317, plus addendum 8d4e1409 | **F2-01**: a re-evaluated story showed the re-evaluation time as its stored time. **F2-03**: the configured model id was presented as the endpoint's. **F2-04**: an explanation with no references was displayed. **F2-05**: four required-class mutants survived. **F2-02**: a live attempt was called "mock" |

Every finding was fixed in the next candidate and reproduced as fixed by both reviewers.

The accepted product is **one app at the repo root**: TypeScript on Node 24, `decimal.js`, `pdfjs-dist`, a `node:http` service plus Vercel function shape (not deployed), Docker image, `vitest` suite of 246 tests.

## 2. Coverage

### Acceptance matrix C1–C14 (04-PLAN), on the accepted Stage 2 candidate (Stage 1 behaviour re-verified there)

| Case | Dataset cases | Expected | Result (auditor, independent) |
|---|---|---|---|
| C1 conforming | cg-001, cg-004 | release (person confirms) | reproduced |
| C2 element over max | cg-002, cg-005..007 | block, rule names element/value/limit | reproduced |
| C3 ReH = min | cg-008, cg-009 | release (inclusive limits) | reproduced |
| C4 heat mismatch | cg-010, cg-011 (heat of another line) | review | reproduced |
| C5 wrong grade | cg-012 | block, both grades | reproduced |
| C6 units / scale | cg-013 ksi, cg-015 scale jump, cg-014 N/mm² control | review, no conversion | reproduced |
| C7 ambiguous scan | cg-003, cg-016 clean scan, cg-017 | review; A-21 full confirmation required before release | reproduced, incl. A-21 (a) release / (b) review / (c) block |
| C8 channels disagree | cg-018 (planted misread) | review, both readings visible | reproduced |
| C9 CEV incoherent | cg-019 review; cg-020 block | as registered | reproduced |
| C10 hostile document | cg-021 block; cg-022 review; HTML/script in PDF fields (browser) | injection never changes the proposal; unreferenced explanation withheld | reproduced (see known consequence of cg-022 below) |
| C11 endpoint failure | cg-023..027 (mock injection); stub over HTTP: 429, 5xx, invalid JSON, timeout, huge reply | status error, review, bounded retry, planted label | reproduced |
| C12 isolation | consecutive cases, both orders, server and browser | no carry-over | reproduced |
| C13 missing stamp | cg-028 | review | reproduced |
| C14 Evolus | — | **N/A**: Evolus out of scope (gates E1–E4 closed) | not a pass |

Additional checks run beyond the C1–C14 matrix:

| Requirement | Dataset case | Expected |
|---|---|---|
| KV test temperature (A-05) | cg-029 | review |
| Certificate type 3.1 (A-06) | cg-030 | review |

### Invariants I1–I7

| Invariant | Status on accepted candidates | Basis |
|---|---|---|
| I1 rules decide, model explains | holds | proposal never reads model text; the cg-021 contaminated explanation is withheld (F2-04 repair); release is rejected in the core, API and CLI when the proposal isn't release (B-14) |
| I2 unknown, never invented | holds | illegible fields read as unknown; an unknown critical field gives review |
| I3 two channels | holds | text layer read with no model; a scan reports "no second channel" and needs all critical fields confirmed (A-21) |
| I4 exact decimals | holds | decimal.js; numbers kept as JSON strings; behavioural float guards kill the stealth float mutants M13 and M14 |
| I5 no release on listed conditions | holds | every trigger tested; heat mismatch always gives review (A-04) |
| I6 no secrets | holds for the tree, the image, the evidence and the client bundle | the room history couldn't be scanned (no export tool): **stated limitation** |
| I7 stored never shown as live | holds on the mock/stored path | stored label with original time; re-evaluation noted; `live_no_reading`; endpoint-reported model id; no AMD claims. The live path is verified only against the stub |

## 3. Mutation results (dispatch §MUTATION CHECK)

Branches are kept unmerged in the adversary's local clones (`adv-cand-*-local`, `adv-mut/<candidate>/*`). The auditor re-applied and re-ran them independently.

| Stage | Candidate | Product suite result | Notes |
|---|---|---|---|
| 1 | 31335ee1 | 12 of 14 killed | M13 and M14 (floats introduced through unary `+`) survived → rejection F-05 |
| 1 | **9d044991** | **14 of 14** killed | behavioural tests A25/A26/A16 added |
| 2 | 496f4ddc | S2: 8 of 12 killed (adversary count: 9 of 13); S1: 14 of 14 killed | S2M01, S2M02, S2M04, S2M08 survived → rejection F2-05 |
| 2 | **b7f4a546** | auditor: **29 of 29** killed (14 S1, M06r, 12 S2, 2 equivalents); adversary: 34 runs, 30 killed, 3 covered by equivalents, 1 survivor | The survivor is S2M02b: dropping " · not live". It is killed by the adversary's browser checks. Both reviewers classed it as non-blocking: the label keeps "stored <original time>" |

The required classes were all present and killed: flip a comparison, drop the stamp check, decimal→float, mock passing as live, limit counted client-side, hard-coded F1 value, release enabled on a block proposal.

## 4. Open issues and limitations

- **OI-S2-01:** the live-read counter and the access-code throttle are in memory, per server instance. On Vercel with several instances the limit is not global, and the UI and README say so.
- **OI-S2-02:** a live reading is a single request inside the documented 300 s function budget. Start-then-poll is not implemented.
- **Untested against real vLLM:** the live adapter's request and response format.
- **Reference check is structural only:** an injected explanation that cites real field names would still be displayed. The check confirms the referenced fields exist, not that the text is supported by their values. I1 holds for the decision.
- **cg-022 / A-16:** a hostile duplicate field in the text layer turns a would-be **block** into **review**. It never gives release, so I5 holds, but the hostile document lowers the proposal's severity.
- **S2M02b:** needs a product test on the rendered story label.
- **Text-layer parser:** covers only the dataset's two fictitious layouts (A, B).
- **Local paths in committed logs:** some implementer Stage 1 logs (`stage-1/implementer/repair-1/*.txt`) contain local user paths. They were committed before S2-35. Review them before the repository goes public; history was not rewritten.
- **No push:** the public repository is empty from this run.
- **No room-history secret scan;** no proof that no seat ever ran a deploy command. No deploy configuration exists.
- **Source drift during the run:** the planning docs (03, 01, 02) were edited after Stage 1 started (A-24). Stage 1 is bound to the stage-start hashes and Stage 2 to the hashes taken at its start (`stage-2/SOURCES.sha256`).
- **Human intervention outside the room:** around 19:3xZ the auditor reported that the operator, in the auditor's own window, freed memory and allowed its stopped `docker build` to restart. This was after the host stopped the build for low memory, an infrastructure retry, 1 of 2. It is the only human input reported during the run, and it happened outside the room.

## 5. Time and usage

| | Start (UTC) | End (UTC) | Wall clock |
|---|---|---|---|
| Stage 1 | 16:52Z (dispatch received) | ~18:16Z (acceptance, auditor clock) | ~84 of 300 min |
| Stage 2 | ~18:12Z (opened) | 19:39Z (acceptance, auditor clock) | ~87 of 300 min |
| Run, dispatch → this report | 16:52Z | ~19:45Z | ~173 of 600 min |

- Clocks: seat clocks differed by a few minutes; each seat recorded its own.
- Infrastructure retries: 1 used (auditor's docker build, Stage 2). One send retry for a band "daemon unavailable" error (analyst).
- **Token/cost usage: unknown.** `band usage agents` does not attribute this run's seats (`*-xwz*` absent; host-wide unattributed total only), and no seat had a per-seat meter. No financial cap was configured, as the dispatch states.
- Models: all four seats reported `claude-opus-5-5`.

## 6. Key room references

| Message | What |
|---|---|
| 7e4a26f9 | Dispatch |
| ea1456ee…f20bf8b5, eaf4f1a4…348a46aa, 855539c8…7d8b246c | Stage 1 handoffs |
| fe3d3a0d, cbb38820 | Auditor input → R1.1 |
| deb9efbf | Adversary challenge → R1.2 |
| ec4e03af | CH-20 → R1.3 |
| 11ea6c43 | Auditor review → R1.4 |
| 22813e0c | Dataset → R1.5 |
| fe9fda17 | Source drift → R1.6 |
| 875e156e | S1 candidate 1 |
| f2637abc, 483351ad | S1 rejection |
| 90b39eda | Adversary S1 bundle |
| 33c884aa | F-05 |
| 8e511ad4…c55dd273, 902fef8f | S1 repair |
| 896ef1ab | S1 candidate 2 |
| 2f4495c0 | Adversary S1 candidate 2 bundle |
| 32d95424 | **STAGE_ACCEPTED Stage 1** |
| 4132aef8…8e24d5e6, 57aaee20…b825cf4f, 8c2fb5d0…3d34c160 | Stage 2 handoffs |
| 74bf34b9 | Adversary challenge → R2.1 |
| 2fa541ba | Auditor review → R2.2 |
| d4072020 | S2 candidate 1 |
| 90cb1232, 3bf970e4 | S2 rejection |
| 270b6936 | Adversary S2 findings |
| 8d4e1409 | F2-03..05 |
| 9bfa32c4…031d9fb3, 097b4723 | S2 repair |
| e44315e9 | S2 candidate 2 |
| f1e2af49, 5e1d8ea3, a669fd01 | Memory blocker and retry |
| 63ea06c9 | Adversary S2 candidate 2 bundle |
| 863c3ff1 | **STAGE_ACCEPTED Stage 2** |
| 80e1ca2f | Adversary closing summary |

The registers are committed under `evidence/runs/certgate-001/stage-1/OBLIGATIONS.md` (R1.6) and `stage-2/OBLIGATIONS.md` (R2.2). The analyst logs are in `stage-{1,2}/analyst/LOG.md`.

## 7. Obligations that need the AMD endpoint (input for dispatch 2)

1. **Real model reading** of certificates through vLLM on AMD Developer Cloud. This replaces the mock for live cases, and the stored stories are re-run on AMD (D:L45-49, P:L19-20, P:L100). The **model choice** follows the updated V/D: Gemma 4 multimodal first, best reader wins, vLLM with tool calling on.
2. **Model-written explanation** citing rule and source (D:L67-69, S2-10). Include a C10 probe whose contaminated explanation **cites valid field names** (reference-check scope).
3. **F1 "endpoint on" with real values:** model list, GPU and ROCm via the sidecar, latency, tokens per second, cost from the configured `GPU_COST_PER_HOUR` (S2-11, S2-12, S2-13, S2-36). The F1 copy goes into every receipt.
4. **F2 "Read live" working** with the endpoint up; announced GPU windows via `LIVE_WINDOWS` (S2-15, D2-07).
5. **Live adapter verified against real vLLM:** request and response format, model-reported id, usage fields, timeouts (OI-S2-02; start-then-poll if a real reading can exceed the budget).
6. **Global live-read limit** with a shared store before any multi-instance deployment (OI-S2-01, D2-06), plus the access-code throttle.
7. **Landing figures** filled only from a Stage 3 evaluation run with denominators: false conforming, non-conformities caught, seconds and cost per certificate (S2-01, D:L174-177).
8. **Evaluation on the 30-case dataset** with the real model: per-field reading accuracy, false conforming, abstentions, latency and cost (D:L226-232). Cases used to tune prompts are kept out of the final evaluation.
9. **AMD gates A2–A4 evidence** (V): credit, a model served on an AMD GPU with ROCm and vLLM visible, inference cost per certificate.
10. **Deployment to Vercel** (F4), then the delivery tests P:L98-110 from a clean clone.
11. **Carried test-suite items:** S2M02b label test. Optional robustness: lowercase `mpa`, duplicate JSON keys, Unicode and long values at 375 px, Firefox and WebKit.

The following are **not** claimed: AMD integration, deployment, submission, or any evaluation metric.
