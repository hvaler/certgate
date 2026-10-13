# Stage 3 verdict: candidate 4 (auditor-xwz6)

Run certgate-001 · Stage 3 (real reading on AMD Token Factory) · Register R3.3 (committed-blob SHA-256
`52dbd3c08867124e27526d47ec778462b9c61c4cc104fcfb7325caba42bb9788`), with R2.2 and R1.6 still in force.

**VERDICT: ACCEPTED.** Stage 3, candidate `5c904693423574846e17994331a628cc06d735ef`, tree
`1ed386fd25d993f1d37b823eadddfa7040b19dae`. The acceptance covers real reading on AMD Token Factory: model
`Qwen3.8-27B`, reported by the endpoint as `self-dploy/Qwen3.8-27B`. It is not deployment and not submission (D3-01).

## 1. Candidate and history

| | |
|---|---|
| Candidate commit / tree | `5c904693…35ef` / `1ed386fd…9dae` (verified in my fresh clone `certgate-audit-s3c4`) |
| Handoff | implementer msgs 8ce37d8a … (13 parts). Record `stage-3/implementer/HANDOFF-S3-candidate-4.md` (evidence commit `ddf57d5`) |
| Repair cycles used | 3 of 5: F3-01 (candidate 2), ADV-S3-F01 (candidate 3), ADV-S3-F02 (candidate 4) |
| Earlier candidates | 1 `0a40432`: not accepted (F3-01). 2 `e4132c5`: not accepted (ADV-S3-F01). 3 `a892f771`: REJECTED (F3-02 = ADV-S3-F02; record `VERDICT-S3-candidate-3.md`, commit `1f22f7f`) |

## 2. Carry-forward from candidate 3: every condition holds

I set these conditions in `VERDICT-S3-candidate-3.md`.

1. **Test-only diff.** `git diff a892f77 5c90469` outside evidence touches only `test/labels.test.ts` (+13) and `test/story-screen-render.test.ts` (+92, new). These are byte-identical: `src`, `public`, `tools`, `config`, `data`, `package.json`, `package-lock.json`, `Dockerfile`, `api`, `vercel.json`, `tsconfig.json`, `vitest.config.ts` and `.env.example`.
2. **Prompt.** `promptSha256()` of the build is `32fad2f980bcf755841d80bb2385d9601465f83b5b42c1b6c048f3bfe1cfb567`, unchanged.
3. **Suites in mock mode (Stage 1 and 2 regression, C-22):**
   - Clean clone with `MODEL_*` cleared: **285 / 285** (`candidate-4/suite-clean-clone.log`).
   - My `docker build --no-cache` image `sha256:7173871c…eabf`, `docker run --network none` with 0 `MODEL_*` variables: **285 / 285** (`candidate-4/docker-network-none-suite.log`).
4. **Mutants re-applied by me:**

   | Mutant | Result | Log |
   |---|---|---|
   | S2M02br, story label | **5 failed** / 280 passed | `candidate-4/s2m02br-mutant-suite.log` |
   | S2M02br, receipt-label variant (`storyLabel: storyLabelDetail(s).slice(0, -10)`) | **4 failed** / 281 passed | `candidate-4/s2m02br-receipt-mutant-suite.log` |
   | S3M06, JSON repaired by guessing | **5 failed** / 280 passed | `candidate-4/s3m06-mutant-suite.log` |

   All three are killed. The clone was restored and is clean.

Because the shipped product (`src/`, `public/`, `tools/`, `data/`, `config/`) is byte-identical to `a892f771`, my real
run, stories, browser check and secrets scan on `a892f771` apply to this candidate unchanged.

## 3. Real evaluation (mine, from a clean clone, under my lease; details in `VERDICT-S3-candidate-3.md` §4)

- Run 2026-10-13T19:13:55Z → 19:31:41Z on product `a892f771` (= this candidate's product). Retry 1 of 2, on the operator's go, after the host stopped the first attempt for low memory (BLOCKER record kept; the partial run was not used).
- Host `developer.amd.com.cn`, model reported `self-dploy/Qwen3.8-27B`, cases cg-004..cg-030, cg-001..003 excluded (D3-03).
- Artifacts: `candidate-3/real-run/eval-retry1/`. Independent recomputation: `candidate-3/recompute-auditor-run.json`.

| Metric | Value |
|---|---|
| **False conforming, broad (C-19)** | **0 / 18** |
| **False conforming, strict** | **0 / 6** |
| Non-conformities caught | 6 / 6, all blocked |
| Proposal = expected | 26 / 27. cg-004 got review where release was expected: decimal comma with no unit on the CEV, caught by the channel check. More cautious and explained (C-12) |
| Rule abstention / failures / retries | 13 / 27 · 0 / 27 · 0 |
| Per field (594) | 591 correct, 1 correct-unknown, 1 correct-absent, 1 value right with unit missing; 0 invented, 0 confident-on-illegible |
| Seconds per certificate | mean 77.1, median 76.9 (N 27) |
| Tokens per certificate | total mean 4211 (completion 1418, reasoning 529) |
| Cost per certificate (endpoint-reported) | mean 0.00020863, median 0.00019930 |
| GET /usage before and after (C-15) | delta 0.0056331242 vs sum of replies 0.0056331226; request delta 27 |

Token Factory credits are free and have no monetary value.

**A mock reading was never counted as real:** all 27 receipts have `reading_source: live`, and the runner imports `LiveReader` only.

## 4. Stories, F1 and the rest

- **Three stories re-recorded by me:** cg-001 release, cg-002 block, cg-003 block (ReH 338 < 355, C-23). Each proposal equals the committed story's.
- **F1 in each story comes from the endpoint:** state on; model equals the reply's `model`; every model id is in my raw GET /models captures; tokens/s recomputed from the reply; cost equals the reply's; GPU, ROCm and vLLM say "not exposed by the endpoint" (`story_compare.py`, 0 problems).
- **F3-01 closed live:** all 27 evaluation receipts carry the reading-time snapshot with X-RateLimit headers, and none says "off".
- **D3-04:** expectations and the tuning list (`31da371`, `a3af07f`) were committed before the reader `dd557fd` and the run.
- **D3-03:** tuning used only cg-001..003, which are excluded.
- **Secrets:** no `MODEL_API_KEY` or base-URL value in the 1070 files of this candidate's tree, nor in my evidence. Only the host name appears.
- **Browser** (product byte-identical to `a892f771`): 375 and 1280 px, no horizontal overflow; I7 labels present; endpoint "off" shown honestly in mock mode.
- **Mutation check (S3-28, R2.2, R1.6):** the adversary report on `a892f77` (`MUTATION-a892f77.md`, `160cfb46…`) shows all mutants killed except S2M02br. S2M02br is now killed (above), and S3M06 is killed.

## 5. Observations carried to Stage 4 (non-blocking)

- **O3-02:** the decimal comma without a unit on the printed CEV appeared in both real runs, on a different case each time (implementer cg-028, auditor cg-004), and was always caught as review. README and METRICS should say so.
- **O3-03:** `/favicon.ico` returns 404 (console error only).
- **O3-04:** the landing figures are generated from the implementer's run `real-candidate-dd557fd`. My run reproduces the safety figures exactly (FC 0/18, 0/6; 6/6 caught). Seconds and cost differ by run (77.1 s vs 89.6 s mean). Stage 4 METRICS should say which run the figures come from, and that a second, independent run exists.
- The analyst's observations (stale comment, prompt examples; msg bf7746f4).
