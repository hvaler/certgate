# Auditor verdict — Stage 8 candidate 2 (local, S8-17): **ACCEPTED (local)**

- **Candidate:** `adb21d5ef03163b5caeb76b1b063f7fae1e7e037`, tree `c3d5d399fe016b5eeb86f4e7932e36db30f02dcc`, branch `s8-impl`. Repair cycle 1 of 3, on top of rejected candidate 1 `cb7d83bc…`, which is preserved unchanged.
- **Baseline:** feaadff8c90d4dc7bc913f83bf956b2d28bfae66.
- **Rules:** T8-01…T8-24 (`T8-RULES.md`), as adopted by R8.1 (L-T8) and refined by R8.2a, R8.2b, R8.2 and R8.3 (part 15).
- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Run 2026-10-15 22:05Z–22:55Z. Heavy work was serialized with the adversary (D8-03).
- **Environment:** as in the candidate 1 verdict (Node v24.19.0, npm 11.17.0, Docker 29.8.0, Playwright 1.56.1). MODEL_*, LIVE_ACCESS_CODE and LIVE_MODELS were removed from every product run, and every endpoint was a local stub. **No Token Factory call.**
- **Workspace:** a fresh auditor clone at the exact commit, clean before and after every product run.

**This is local acceptance only.** The stage verdict also requires S8-18, the live checks on https://certgate-wheat.vercel.app after the human sets `LIVE_MODELS` and pushes. That verdict will be bound to the deployed commit.

## The repair (F8-A01, the only unmet condition of candidate 1)

| | Candidate 1 cb7d83b | Candidate 2 adb21d5 |
|---|---|---|
| Auditor repro (`tools/repro_f8a01.mjs`): container, the stub lists Qwen, the reply reports Gemma-4-31B-IT, POST `/api/live/read` | 200, `reading_source: live`, reading shown, counted | **502**, `reason_class: model_mismatch`, error "the endpoint reported a different model than the one requested; the reading is not shown"; **no view and no receipt**; 1 chat call (sent with Qwen3.8-27B); unit spent 0 → 1 (CH8-19, as on the job path) |
| Adversary repro `adv8-legacy.test.ts` (`expect(res.status).toBe(502)`, unchanged between 31aaaae8 and 0e4822ae) | fails | **passes** |
| New product killer: stage8-live "…model_mismatch on the legacy route too…" (Gemma, `-FP8`, `xQwen…`; control `self-dploy/Qwen` gives 200) | — | passes; it kills M8-21, M8-22 and M8-23 (below) |

Records: `S8-F8A01-repro-cb7d83b.json`, `S8-F8A01-repro-adb21d5.json`.

## Delta cb7d83b → adb21d5, every hunk read

`git diff --stat cb7d83b adb21d5` lists 6 files:
- `src/web/app.ts` +5, the legacy guard;
- `test/stage8-live.test.ts` +17, the killer;
- `test/web.test.ts` 19 lines, the F2-03 hunk;
- `test/stage6-live.test.ts` 4 lines, O8-A02;
- implementer evidence, 2 files.

No other file changed: models.ts, live-jobs.ts, types.ts, `public/`, README, DEPLOY, CLAIMS and claims-map are all unchanged since cb7d83b.
- **F2-03 hunk (Q-14): stricter, not looser.**
  - The reported id is now `adv-stub/configured-name-not-from-endpoint`. That still differs verbatim from the configured id, so F2-03's assertions (the reported id in the receipt, the configured one only as requested, the rows never showing it) all stand.
  - The omitted-model case changes from "shows `unknown…`" to an **exact** 502 body.
- **O8-A02 hunk: strength kept.**
  - The two slot holders must equal exactly the two jobs asserted `reading`, derived from the observed `queued` job rather than from POST order.
  - The third job must still fail with `queue_timeout`, and `used_this_hour` must be 3.
  - It passed in all 3 of the auditor's clean full-suite runs (0/3 failures). It is absent from the first 8 recorded killers of each of the auditor's 25 mutant runs. The mutant record caps killer lists at 8, so 0 across every mutant run is not proven.
  - **Adversary count (correction 1ed02961):** on adb21d5 the test passed 80 times and failed 4 times. All 4 failures were in mutants that break what it checks (S6M-b1, S6M-c1, S6M-c3, A26), and none was unrelated, unlike candidate 1. Not blocking.

## Rule results on adb21d5

| Rule | Result |
|---|---|
| Identity and ancestry | Clean tree. cb7d83b, fd326d6, 303c32bb, 1497571 and feaadff are all ancestors. `models.ts` is unchanged since fd326d6 (S8-T821 holds) |
| **T8-01** | `git diff --stat feaadff adb21d5` is **empty** over every pinned path (the list in the candidate 1 verdict) |
| **T8-02** | Job path, auditor capture endpoint: **8/8 byte-identical** to feaadff for Qwen3.8-27B, Gemma-4-31B-IT, DeepSeek-V4.1-Flash and Qwen3.8-Flash-Next × cg-004 and cg-021 (`S8-T802-jobpath-adb21d5.json`). The direct-reader golden and the prompt SHA are as in candidate 1, because live-reader.ts is unchanged |
| **T8-03 / L-17** | The changed pinned-root files equal `STAGE8_MAY_CHANGE` {types.ts, app.ts, live-jobs.ts, public/app.js} plus `STAGE8_NEW` {models.ts}. There is no widening; T6-10 is narrowed to exactly models.ts |
| **T8-10** | `npm ci`, typecheck and build rc 0. `npx vitest run` ×3: **565/565, 26 files, 0 skipped**, rc 0 each (22:17:44Z, 22:18:11Z, 22:18:39Z) |
| **T8-11** | `docker build --no-cache` rc 0, image `sha256:8f038529…5a48`. With `--network none`: **475 passed, 90 skipped** (the repo-only suites, as in candidate 1), 0 failed |
| **T8-12** | metrics-md, previews and diagrams `--check` rc 0. claims-units: **0 unmapped, 0 stale**. The docs and prize tests pass in the suite. The DEPLOY.md LIVE_MODELS value is `Qwen3.8-27B,Gemma-4-31B-IT,DeepSeek-V4.1-Flash,DeepSeek-V4-Flash-Vision-Exp,MiMo-V2.6-Flash,Qwen3.8-Flash-Next`, which is A8-15 in code order |
| **Q-02** | Unchanged code path. The candidate 1 cadence result stands (10 = 10), and the adversary's P8-16 on adb21d5 gives 10 |
| **T8-21** | S8-T821 holds; the code sets are unchanged |
| **T8-22** | **25/25 auditor mutants killed** (`S8-T822-mutants-adb21d5.json`): the 22 from candidate 1, re-run on the moved app.ts, plus M8-21 (legacy guard removed), M8-22 (guard as a substring test) and M8-23 (reading shown on mismatch), each killed by the new F8-A01 test |
| **S8-16** | Adversary: 29/29 Stage 8 mutants; **Stage 7 re-run 10/10** and **Stage 6 re-run 44/44** on the moved files, killed (3 Stage 6 and 1 Stage 7 re-based to rewritten lines). The Stage 6/7 mutants on files byte-identical to feaadff are carried |
| **T8-23** | The adversary bundle at `0e4822ae188ef70130944cbfb7ea411ae15cb65c` (descends from adb21d5; product untouched) was re-run in the auditor's clone: **31/31 passed**, including the unchanged F8-A01 test, now passing. Its assertions were read in candidate 1 and are unchanged |
| **T8-24** | Value scan of the code, its SHA-256, the key, its SHA-256 and the base-URL path: **0** in the tree (1584 files), the history delta feaadff..adb21d5 (94 blobs), `dist/` (33), and the **image filesystem** (`docker export`, 387 145 728 bytes) |
| Browser, 375 and 1280 px | `stage8-checks.mjs`: **16/16 PASS** on adb21d5. `public/` is unchanged since candidate 1, whose screenshots the auditor viewed |

**R-A…R-F (automatic rejections), locally:**
- no model is offered without an evaluation run or passing probe evidence (T8-21, the guards);
- no measured figure appears next to an experimental reading (M8-19 killed; screenshots);
- there is no fallback to another model or a stored result (M8-08 killed; T8-02);
- no key or code is reachable from the build or the image (T8-24);
- no experimental default and no unlabeled experimental model (M8-11 and M8-20 killed; browser).

## Observations carried (not blocking)

- **`ui-checks.mjs:94` timeout:** pre-existing, reproduced at feaadff and at cb7d83b. `public/` is unchanged since.
- **Freshness edge:** at the 60 s boundary a POST may be refused with `probe_unavailable` for under a second. It is fail-closed, as L-01 requires.
- **Unchanged-file mutants:** the Stage 6/7 mutants on files that are byte-identical to feaadff were not re-run in Stage 8; they are carried.
- **Upstash REST:** not exercised for the Stage 8 refusals (MemoryStore only). The Stage 6 suites cover both stores for the shared paths.

## Decision

**ACCEPTED (local) on adb21d5ef03163b5caeb76b1b063f7fae1e7e037**, tree c3d5d399fe016b5eeb86f4e7932e36db30f02dcc.
- Every in-scope local obligation (S8-01…S8-17, S8-21…S8-28 locally) has reproduced evidence, the required checks ran, no blocking finding remains, provenance is intact, and the scope is correct.
- **Stage 8 is not yet accepted.** S8-18 and the live part of S8-28 remain. The analyst issues the push request. After the human sets `LIVE_MODELS` (the value above) in Vercel and pushes, the auditor runs T8-30…T8-37 against https://certgate-wheat.vercel.app and publishes the final verdict, bound to the deployed commit.
- Any product change after adb21d5 voids this local acceptance until it is rechecked.
