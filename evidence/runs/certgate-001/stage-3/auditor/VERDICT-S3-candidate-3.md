# Stage 3 verdict: candidate 3 (auditor-xwz6)

Run certgate-001 · Stage 3 (real reading on AMD Token Factory) · Register R3.3 (committed-blob SHA-256
`52dbd3c08867124e27526d47ec778462b9c61c4cc104fcfb7325caba42bb9788`), with R2.2 and R1.6 still in force.

**VERDICT: REJECTED (2026-10-13T19:52Z) on finding ADV-S3-F02 / F3-02 (section 7).** A required-class mutant
(R2.2 S2M02, invariant I7: a stored reading is never presented as live) survives the candidate suite. Every other
check passed. The product behaviour is correct, so the repair is **test-only**. My real run, stories and the other
checks carry forward to the next candidate if, and only if, its diff against `a892f77` outside evidence touches only
`test/` (see "Carry-forward conditions").

## 1. Candidate

| | |
|---|---|
| Candidate commit | `a892f771e531ca76b621b5a03163b2d3cb4f02d6` |
| Tree | `f0c829e9214e8cc9bcd6643f1e86a98db18d3662` (verified) |
| Handoff | implementer msgs df782c04 … 43631004 (13 parts, receipt confirmed in cfeb5e19). Record `stage-3/implementer/HANDOFF-S3-candidate-3.md` (evidence commit 108ed05) |
| Earlier candidates | 1 `0a40432` was not accepted: F3-01 (msg 40961585), repaired in candidate 2. 2 `e4132c5` was not accepted: ADV-S3-F01 (adversary msg 0a4f6702, reproduced by me in d3633a29), repaired in candidate 3 |
| Audit clone | `C:\nexus\dev\certgate-audit-s3c3`, fresh `git clone` and `npm ci`, detached at the candidate. The tree was clean when the run started (`run.json` `product_tree_dirty: false`) |

## 2. Repairs since candidate 1

- **F3-01** (live receipts said endpoint "off"): repaired in `e4132c5`.
  - **Offline (candidate 2):**
    - `results.json` of the implementer run is preserved byte-identical: `2a08b37d…cef`.
    - The regenerated file reproduces byte-identically: `804176f4…c1e4`.
    - My script `check_regenerated_f1.py` reports 0 problems over 27 cases. Only `receipt.f1` differs. Every captured value equals the value recorded in the reply, and every value that was not recorded is labelled `not_captured_in_evaluation_run`.
  - **Live (candidate 3, my run):** all 27 receipts are `live`, state `not_captured_in_evaluation_run`, never "off". All 27 carry the reply's X-RateLimit headers captured at reading time: rpm 20, daily limit 1, remaining spend. Model as reported is `self-dploy/Qwen3.8-27B`. GPU, ROCm and vLLM say "not exposed by the endpoint".
- **O3-01:** REPORT, README and `metrics.json` `wrong_causes` state "value right (decimal comma), unit missing". The cause is derived from recorded values.
- **ADV-S3-F01:** `test/live-reader-prose.test.ts` is new.
  - I re-applied S3M06 myself on `a892f77`: **5 failed / 275 passed**, so the mutant is killed.
  - Log: `candidate-3/s3m06-mutant-suite.log`.
- **The two repairs since candidate 2 are test-only.**
  - `git diff e4132c5 a892f77` outside evidence touches only `test/live-reader-prose.test.ts` (+67) and `test/web.test.ts` (+3 −1).
  - These are byte-identical: `src`, `public`, `tools`, `config`, `data`, the package files, `Dockerfile`, `api`, `vercel.json`, `tsconfig.json` and `vitest.config.ts`.
  - The reading path is unchanged since `dd557fd`, apart from the F1 labelling in candidate 2. The prompt SHA-256 from `promptSha256()` of the build is `32fad2f980bcf755841d80bb2385d9601465f83b5b42c1b6c048f3bfe1cfb567`, the R3.3 C-23 value. It is also stored in my `run.json`.

## 3. Suites in mock mode (Stage 1 and 2 regression, C-22)

| Where | Result |
|---|---|
| Clean clone, `MODEL_*` cleared, `npx vitest run` | **280 / 280** (`candidate-3/suite-clean-clone.log`) |
| My `docker build --no-cache` image `sha256:78a86b7f…668d`, `docker run --network none`, `MODEL_*` count 0 | **280 / 280** (`candidate-3/docker-network-none-suite.log`) |

The default suite makes no endpoint call: it passes with the variables absent and with no network.

## 4. My independent real evaluation (from the clean clone, under my lease)

- **Lease:**
  - Taken: room msg 3ff8e1f3. First attempt stopped by the host for low memory after 9 of 27 cases. `candidate-3/BLOCKER-auditor-run-killed.md` records it; the partial run is kept in `real-run/partial-killed-run/` and **not used**. Released: msg 102be241.
  - Operator go for infrastructure retry 1 of 2; re-taken in msg e5ba9774, released in msg c825d982.
- **Command:** `node tools/evaluate/run-eval.mjs --out evaluation/runs/auditor-a892f77-retry1`.
  - Run 19:13:55Z → 19:31:41Z.
  - Host `developer.amd.com.cn`, `MODEL_ID` Qwen3.8-27B; the model as reported is `self-dploy/Qwen3.8-27B`.
  - Cases cg-004..cg-030, 2 in flight; cg-001..003 excluded.
  - Artifacts: `real-run/eval-retry1/`.
- **GET /usage before and after:** stored by the runner (`usage-before.json`, `usage-after.json`) and in my own raw captures (`real-run/f1-capture-3-before-retry1.json`, `f1-capture-4-after-stories.json`).
- **Recomputation:** my stdlib script `recompute_metrics.py`. The expectations were re-derived from `evaluation/expectations-real-run.json` and `data/expected/`. Output: `candidate-3/recompute-auditor-run.json`, with 0 problems.

| Metric | Auditor run on a892f77 | Implementer run on dd557fd (headline on the landing page) |
|---|---|---|
| **False conforming, broad** | **0 / 18** | 0 / 18 |
| **False conforming, strict** | **0 / 6** | 0 / 6 |
| Non-conformities caught (not released) | 6 / 6 (all 6 blocked: cg-005, 006, 007, 012, 020, 021) | 6 / 6 |
| Proposal = expected | 26 / 27; cg-004 review where release was expected (below) | 27 / 27 |
| Rule abstention (review, processed) | 13 / 27 | 12 / 27 |
| Failures | 0 / 27 | 0 / 27 |
| Attempts / retries | 27 / 0 | 27 / 0 |
| Per field (594 critical fields) | 591 correct, 1 correct-unknown (cg-017 heat), 1 correct-absent (cg-028 stamp), 1 value right with unit missing (cg-004 CEV `0,39`); 0 invented, 0 confident-on-illegible, 0 missed | 591, 1, 1, 1 (cg-028 CEV `0,41`) |
| Seconds per certificate | mean 77.1, median 76.9 (min 60.3, max 111.9; N 27) | mean 89.6, median 80.6 |
| Tokens per certificate | total mean 4211, completion mean 1418, reasoning mean 529 | — |
| Cost per certificate (endpoint-reported) | mean 0.00020863, median 0.00019930, N 27, 0 unknown | mean 0.00020529 |
| /usage delta vs sum of reply costs (C-15) | 0.0056331242 vs 0.0056331226 (difference 1.6e-9); request delta 27 | difference 3.9e-10; 27 |

Token Factory credits are free and have no monetary value.

**C-19:** there is no false conforming, broad or strict, in my run or in the implementer's run.

**C-12 reproduction:** the only proposal difference is cg-004, which got **review** in my run where the expected proposal is release.
- **Cause:** the model gave the printed CEV as `0,39` (decimal comma) with no unit. The model-free text layer read `0.39`. The channel check disagreed (`CHANNEL_DISAGREE:cev_printed`), so the proposal was review.
- This is the same mechanism as O3-01 on cg-028 in the implementer's run. It is **more cautious and explained**, not a false conforming. The mismatch appears in the run's own artifacts (numerator and denominator) and is not hidden.
- It shows that at temperature 0 the endpoint is not bit-reproducible on the decimal separator. **The product rule, not the model, decides:** a disagreement goes to review.

## 5. Stories (F2) and F1 from the endpoint

- **Recording:** `node dist/src/tools/build-stories.js record` in my clone, under my lease, at 19:31:57Z, 19:33:04Z and 19:34:05Z.
  - Recordings and story files: `real-run/stories/`.
  - Comparison: my script `story_compare.py` against the committed stories, 0 problems.

| Story | Auditor proposal | Committed proposal | Note |
|---|---|---|---|
| cg-001 | release | release | digital, both channels |
| cg-002 | block | block | `RULE_FAIL:Mn` 1.68 > 1.60, `RULE_FAIL:CEV` 0.46 > 0.45, `NO_SECOND_CHANNEL` |
| cg-003 | block | block | `RULE_FAIL:ReH` 338 < 355, `NO_SECOND_CHANNEL` (R3.3 C-23: a block on an unconfirmed scan is not false conforming; the story is recorded as run) |

- **F1 in each of my stories:**
  - State `on`, reading source `live`.
  - `model_reported` equals the reply's `model`, and every model id in the snapshot appears in my own raw GET /models captures.
  - Tokens per second equals completion tokens ÷ elapsed time, recomputed: 19.21, 20.87, 16.69.
  - The F1 cost equals the reply's reported cost.
  - GPU, ROCm and vLLM say "not exposed by the endpoint".
- **The F1 values come from the endpoint, not from code.**

## 6. Other R3.x checks

| Check | Result |
|---|---|
| D3-04 commit order | Commit `31da371` (expectations and tuning-exclusion list, 17:01:56Z) and `a3af07f` (C-16) precede the reader `dd557fd` (17:28:33Z) and the run commit `5b9cd49`. Ancestry verified |
| D3-03 tuning exclusion | `evaluation/tuning-exclusions.json` lists cg-001..003, and `dev-calls.jsonl` touches only cg-001..003. Both runs exclude them |
| C-13 frozen prompt | prompt SHA `32fad2f9…c567` in the build and in `run.json`; matches C-23 |
| Secrets | No `MODEL_API_KEY` value and no base-URL host/path value in any of the 1061 files of the candidate tree (excluding `.git` and `node_modules`), including my run artifacts. The same holds for all 43 files of my evidence. The host name only appears where allowed. No local user paths in my evidence |
| Only page images and the fixed prompt sent (C-01) | Adversary reader-vs-stub, 22/22, records the request bodies (bundle `ae62497`, blob hashes verified by me). The reader code is unchanged since then |
| Landing figures | Generated from `evaluation/runs/real-candidate-dd557fd`, with denominators: FC 0 of 18 (strict 0 of 6), 6 / 6, 89.6 s (median 80.6, N 27), 0.00020529 with the free-credits label. My run reproduces the two safety figures exactly. Time and cost vary from run to run, as expected |
| Browser, my container (mock mode, no endpoint configured) | 375 px and 1280 px: no horizontal overflow. "Model endpoint: off" is shown honestly. The stories are labelled "recorded real reading … not live". The cg-003 card says block, ReH 338 < 355, with the measured step timings. Live reading is disabled and labelled as such. Only console error: `/favicon.ico` 404 (cosmetic). Evidence: `candidate-3/browser/` |

## 7. Mutation check (S3-28; R2.2 and R1.6 regression)

- **Adversary bundle** (clone `C:\nexus\dev\adv-certgate` @ `ae62497`, blob SHA-256 verified):
  - S3M01–S3M12 on `e4132c5`: 11 of 12 killed; S3M06 survived, which is ADV-S3-F01.
  - S3M06 on `a892f77` was re-run by me: killed (5 failed).
- **Adversary re-run on `a892f77`** (msg 540fb415, 19:38–19:48Z; clone test revision `7ee7bb97`, report
  `MUTATION-a892f77.md` with SHA-256 `160cfb46…3fe7`):
  - Stage 3 S3M01–S3M12: 12/12 killed.
  - Stage 2 (R2.2): 13 killed; S2M05r and S2M06r re-based and killed.
  - Stage 1 M01–M14 (R1.6): 13 killed, M06r killed.
  - S2M02 re-based: er, ar and jr killed; **br SURVIVED**.

**F3-02 = ADV-S3-F02 [REJECT; R2.2 S2M02, I7].**
- **Mutant:** in `public/app.js` `drawStory()`, `storedDetail: storyLabelDetail(s)` becomes `storyLabelDetail(s).slice(0, -10)`. This removes "· not live" from the story-screen label.
- **Independently reproduced by me** in `certgate-audit-s3c3` at `a892f77`: 280 / 280 pass on the mutant (`candidate-3/s2m02br-mutant-suite.log`). I restored the file afterwards, and the clone is clean outside the recorded stories.
- **Cause:** `test/labels.test.ts` lines 65 and 73 check the call site with `/storedDetail: storyLabelDetail\(s\)/`. The regex has no right anchor, so any suffix or slice passes.
- **Closing condition:**
  - A test fails whenever the rendered story-screen label (`storedDetail` as drawn) does not end in "not live". Preferably it asserts on the value `drawStory` actually passes, not on source text; an anchored source regex is the minimum.
  - S2M02br must then fail the suite. I will re-apply it myself.
  - No file outside `test/` (and evidence) may change.

## Carry-forward conditions for the next candidate

The next candidate may reuse my real run (section 4), stories (section 5), browser check and secrets scan without a
new endpoint call if all of these hold:
1. `git diff a892f77 <next>` outside `evidence/` touches only `test/`.
2. The prompt SHA is unchanged.
3. The suite passes with `MODEL_*` cleared, and in a `--no-cache` image under `--network none`.
4. S2M02br and S3M06, re-applied by me, both fail the suite.

Any change under `src/`, `public/`, `tools/`, `config/`, `data/` or the package files voids this and needs a new real
run.

## 8. Observations (non-blocking)

- **O3-02:** cg-004 in my run, as in section 4. The decimal comma without a unit recurs across runs, on a different case each time, and the channel check catches it every time. Suggestion for Stage 4: README and METRICS should say that this class appears in both real runs and is always caught as review.
- **O3-03:** `/favicon.ico` returns 404 (console error only).
- The analyst's routed observations (stale comment, prompt examples; msg bf7746f4) go to the final report and Stage 4.
