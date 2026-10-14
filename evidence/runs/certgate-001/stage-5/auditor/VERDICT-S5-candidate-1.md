# Auditor verdict, Stage 5 candidate 1: REJECTED

Candidate `ddb75eca79c1e66b06456ebce45992ccd140eafa`, tree `2fdd51a2abe738755672b41098d1f371569de67a`. Register R5.4
(`3ef256d`). Implementer handoff: commit 2566cc8, room msg 3b3e9f41. Adversary bundle: room msg 31240af4 (clone
`e6a1ec0d`). The audit ran in a fresh clone, `C:\nexus\dev\certgate-audit-s5c1`, on 2026-10-14 from 11:22Z to 11:45Z.
No endpoint call was made for this audit. My independent Gemma run (S5-13, commit f258d0d) carries forward, because
`src/`, `tools/evaluate/run-eval.mjs` and the prompt are unchanged since 04100b93.

**Result: REJECTED on F5-01.** README prize and eligibility claims survive the suite (S5-10, S5-11, S5-15 e, G-09).
**F5-02 is minor** and should be fixed in the same repair. Everything else passes, as listed below. Repair cycle 1
of 3 is used. The repair is docs and tests only; no product change is needed.

## Findings

### F5-01 (REJECT): a prize claim survives when a negation word appears elsewhere in its clause, or when it uses a word that is not on the list

`test/support/prize-check.mjs` accepts a clause when a negation word occurs **anywhere** in it. It also leaves out
words for winning or placing. I ran the full suite on each mutant. Each one adds the README sentence and its own
claims-map entry (`"none: context"`), so the fail-closed sentence map does not kill it
(`candidate-1/prize-mutants.log`, tool `candidate-1/tools/s5_prize_mutants.py`):

| Mutant | Sentence added to README | Result |
|---|---|---|
| A1 | CertGate is eligible for the Gemma prize. | killed (T5-08 probe) |
| A2 | CertGate is not just a comparison: it is eligible for the Gemma prize. | **survived**, 332/332 |
| A3 | CertGate never invents a value and is eligible for the Gemma prize. | **survived**, 332/332 |
| A4 | CertGate is a strong contender for Google's Gemma challenge on AMD. | killed only by the sentence map in my run; it survived in the adversary's run, which had a matching map entry (S5M-e3) |
| A5 | CertGate won the Gemma track. | **survived**, 332/332 |
| A6 | CertGate is a finalist in the hackathon. | **survived**, 332/332 |
| A7 | CertGate placed first in the Gemma category. | **survived**, 332/332 |

The adversary found the same gap independently (ADV-S5-F01: S5M-e2 and S5M-e3 survived). Direct probes of the check
are in `candidate-1/prize-probes.txt`.

**Why this blocks.** Dispatch 3 forbids any claim of winning, entering or qualifying for a prize. S5-15 (e) requires
a named killer for "a README prize/eligibility claim". Under the mutation rule, a surviving mutant is not accepted;
this is the same precedent as S3M06 and S2M02br. The fail-closed map stops none of these mutants, because a
"none: context" entry is all it takes.

**Required repair (docs and tests only):**
1. A clause is accepted only when the negation governs the prize word: `no`, `not`, `never` or `without` comes
   **before** the prize word in the same clause, with no `,`, `:`, `;`, `.` or `#` in between. Example:
   `\b(?:no|not|never|without)\b[^,:;.#]{0,60}?<prize word>`. An exact sentence on an explicit allow-list that I
   review (G-09) is also accepted. The current sentence "This comparison makes no claim about any prize or award."
   must still pass.
2. Extend `PRIZE_WORDS` with `won`, `finalist`, `shortlist\w*`, `contender`, `challenge`, `compet\w*`,
   `runner-up`, `podium`, `ranked`, `placed (first|second|third|1st|2nd|3rd)` and `honou?rable mention`. Keep the
   01-REGLAS quote rule. Any legitimate existing use goes on the allow-list by exact text.
3. Add unit tests that flag A1–A7 above and S5M-e2/e3 verbatim, and accept the current allowed sentences.

### F5-02 (minor; fix in the same repair): model identity is not checked on the receipts

Mutant b2 changed the first Gemma receipt `reader.model_id` in `evaluation/runs/real-gemma-04100b9/results.json` from
`self-dploy/Gemma-4-31B-IT` to `self-dploy/Qwen3.8-27B`. It **survived** (332/332). G-01 checks only
`endpoint_response.model`. A Gemma reading whose receipt names Qwen is a case of S5-15 (b).

**Repair:** extend the model-identity test so that, in all three runs, `receipt.reader.model_id` and
`receipt.reader.requested_model_id` match the run's model too.

## Checks that pass (carried forward to a docs-and-tests-only repair)

| Requirement | My check | Result |
|---|---|---|
| E-13, G-04, CH5-07: product unchanged | `git diff b0ec67a6 ddb75eca` on src, public, api, data, config, package files, Dockerfile, .dockerignore, tsconfig, `tools/evaluate/run-eval.mjs`, expectations, tuning exclusions, `real-candidate-dd557fd` and stage-3 evidence | only `vercel.json` differs (1 line). In evidence, only additions plus the analyst's register and log |
| E-15 | the vercel.json diff | only `includeFiles` gains `node_modules/pdfjs-dist`. `maxDuration` and the rewrites are unchanged; `@napi-rs/canvas` is not included |
| E-16 bundle simulation (my own, `candidate-1/tools/sim_bundle.mjs`, `e16-bundle-sim.log`) | function bundle with the built product, data, config, public/stories and node_modules; handler run with `VERCEL=1` and no MODEL_* | **A** (no pdfjs-dist) and **A2** (no pdfjs-dist, with canvas): import fails with `Cannot find module 'pdfjs-dist/package.json'`, the operator's fault. **B** (with pdfjs-dist, no canvas) and **B2** (with both): `/health` 200 ok/mock/reader off; `/api/f1` 200 off "no endpoint configured"; `/api/live/status` 200 enabled false, deployed_site true; cg-003 evaluate 200 block; `/api/live/read` 503, as DEPLOY.md states. B shows that pdfjs-dist without canvas is enough (canvas gives a warning only) |
| T5-03, G-03: request bodies (local stub, no endpoint; `request-bodies-summary.txt`) | cg-004 and cg-021, Qwen and Gemma on ddb75eca, and Qwen on 04100b93 | Qwen bodies are byte-identical between the two builds (cg-004 `bce915c3…`, cg-021 `87bf11ea…`). Gemma differs only in `model`. Keys: model, temperature, max_tokens, response_format, messages |
| Suite in a clean clone (`clean-clone.log`) | `npm ci` (0 dirty), build, vitest with 0 MODEL_* | **332/332**. `metrics-md --check` matches |
| T5-09 Docker (`docker.log`) | `docker build --no-cache`, run with `--network none`; MODEL_* in the container: 0 | 305 passed, 27 skipped (repository-only), 0 failed |
| E-11 claims | `claims-units.mjs` and `--stale`; `check_claims.py` with the vitest JSON report | 0 unmapped, 0 stale. 76 rows, 507 map entries, 169 proofs; every cited test passed. The C-15 parse note is my parser's `;` split of a passing test title, the same as at Stage 4 |
| S5-08, E-12, G-05, G-06: Gemma figures | independent recompute of `real-gemma-04100b9` (`recompute-gemma-run-of-record.json`) | FC 0/18 and 0/6; caught 6/6, 5 block; 26/27 (cg-021 review); fields 591 correct, 1 correct-absent, 1 confident-on-illegible (cg-017 `24-73269`), 1 unknown (cg-021 Si, true 0.62); failures 0, retries 0; finish `stop`; all receipts `live`; case-wall mean 34.5, median 30.0; tokens 2003; cost mean 0.00007789; /usage delta 0.002102958 vs sum 0.0021029624 (diff −4.4e-9). METRICS and README equal these figures. The per-case differences (cg-004, cg-021) are complete. No FC, so no root-cause line is owed |
| E-13: Qwen figures | the METRICS prefix before the comparison heading vs `b0ec67a6:METRICS.md` | byte-identical, 7607 bytes, SHA-256 `fcd2d6fc…7b21`. The Qwen columns of the comparison equal my Stage 3 and 4 recomputes |
| S5-13: my run vs the run of record | f258d0d | identical case by case (0 proposal and 0 field differences) |
| S5-10, G-08: licence and publisher | the publisher's model card, fetched 11:23:52Z (`candidate-1/gemma-card-README.md`) | `license: apache-2.0`, `license_link: https://ai.google.dev/gemma/docs/gemma_4_license`, "Authors: Google DeepMind", `pipeline_tag: image-text-to-text`. All match `docs/sources/gemma.md` and the README |
| README facts | the Qwen artifacts | cg-017 heat: both Qwen runs `correct_unknown`. cg-021: both Qwen runs block with Si 0.62. cg-004: implementer release, auditor review. True. "The deployed site makes no model call: judge mode replays recorded Qwen readings": present. The 2026-10-13 fault is stated as reported by the operator |
| Mutants (`s5-mutants.log`, tool `candidate-1/tools/s5_mutants.py`) | 11 single edits, each followed by a full suite run | killed: a1, a2, a3 (Gemma figures in METRICS and README); b1 (Gemma reply with the Qwen id); b3 (Qwen reply with the Gemma id); c1 (`top_p` added); c2 (max_tokens); d1 (landing from the Gemma run); f1 (cg-004 dropped from the difference list); e15 (pdfjs-dist dropped). **Survived: b2 (F5-02)** |
| Secrets (`scan-head-tree-and-dist.txt`, `scan-history.txt`) | head tree plus dist; all 1314 reachable blobs | MODEL_API_KEY value 0. Base-URL host and path 0. Generic hits are only the known fake `sk-proj-…` (O4-03). User-profile paths are only in records already known from earlier stages, plus O5-01 |

## Observations (not blocking)

- **O5-01.** The post-candidate implementer evidence file `stage-5/implementer/candidate-1/kill5.sh` (commit
  2566cc8) contains a local scratchpad path with the local user name, in its line 3. It is not a secret, and it is
  of the same kind as earlier evidence records. The implementer may replace it with a placeholder before the push.
- **O5-02.** The E-16 simulation is not a committed test; R5.4 allows this. The real proof is the live check after
  the push (S4-10), which stays **not done** until then.

## What the repair must contain

- A docs-and-tests-only candidate 2 on top of `ddb75eca`, with F5-01 items 1–3 and F5-02.
- I will re-check the delta, re-run A1–A7, S5M-e2/e3 and b2, run the suite in a clean clone, and run the claims
  checks. The rest above carries forward if `git diff ddb75eca <c2>` touches only `test/`, the prize-check helper,
  `claims-map.json`, `CLAIMS.md` and evidence.
