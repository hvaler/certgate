# Auditor verdict — Stage 8 candidate 1 (local, S8-17): **REJECTED**

- **Candidate:** `cb7d83bc1dd5ec9aefbcd76becdaabf968470887`, tree `8344f8f2627a64b7815ad12d12c646ceeed0c0ab`, branch `s8-impl`.
- **Baseline:** feaadff8c90d4dc7bc913f83bf956b2d28bfae66.
- **Rules:** T8-01…T8-24 (`T8-RULES.md`, ecb6c22), as adopted by R8.1 (L-T8) and refined by R8.2a, R8.2b, R8.2 and R8.3.
- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Run 2026-10-15 21:15Z–21:50Z. Heavy work was serialized after the adversary's DONE (ed9435e9).
- **Environment:** Windows 11; Node v24.19.0; npm 11.17.0; Docker 29.8.0; Playwright 1.56.1 (npx cache). MODEL_BASE_URL, MODEL_API_KEY, MODEL_ID, LIVE_ACCESS_CODE and LIVE_MODELS were removed from every product run's environment, and every endpoint was a local stub. **This seat made no Token Factory call for this verdict.**
- **Workspace:** the auditor's own fresh clone, `git clone --no-hardlinks C:\nexus\dev\certgate`, checked out at the exact commit, `git status --porcelain` 0 lines before and after. It shares no worktree, image or process with another seat.

## Unmet condition (the reason for rejection)

**F8-A01 (adversary aca78529, reproduced by the auditor): the legacy `/api/live/read` has no model_mismatch guard.**
- **Requirement:**
  - design note 4328e0ec §4, approved by R8.2: "A strict `sameModel` guard after the reading answers 502 `model_mismatch`";
  - S8-07: the model_mismatch guard stays;
  - L-C1;
  - **R8.3 ruled (a), repair.**
- **Auditor's reproduction** (`tools/repro_f8a01.mjs`, own stub and script, container mode):
  - the stub lists `Qwen3.8-27B`, and its reply reports `model: "Gemma-4-31B-IT"`; `MODEL_ID=Qwen3.8-27B`, `LIVE_READS_PER_HOUR=3`; POST `/api/live/read` with cg-001 and its delivery note;
  - **observed at cb7d83b: HTTP 200**, `reading_source: live`, requested `Qwen3.8-27B`, reported `Gemma-4-31B-IT`, 1 chat call (sent with `Qwen3.8-27B`), `used_this_hour` 0 → 1. Record: `S8-F8A01-repro-cb7d83b.json`;
  - expected: 502 `model_mismatch`.
- **At feaadff** the same input gives the same 200 (`S8-F8A01-repro-feaadff.json`). It is **not a regression**: it is an approved Stage 8 obligation that was not delivered.
- **Scope:** container only. On the deployed site the route answers 503 (T8-37 holds by code; it is checked live in S8-18), so this is **not** a dispatch-6 automatic-rejection item.
- **The adversary's repro test** (`verification/adversary/stage-8/adv8-legacy.test.ts` at 31aaaae8) fails on the candidate in the auditor's clone too.

Candidate 2 must make the guard answer 502 `model_mismatch` with nothing shown as live, add a product killer test, add a mutant "legacy guard removed", and list every changed hunk of the F2-03 test (Q-14).

## Everything else checked: passed

| Rule | Result |
|---|---|
| Identity and ancestry | HEAD and tree as above, clean. fd326d6 (probe evidence), 303c32bb (probe run), 1497571 (O8-01 redaction) and feaadff are all ancestors. `models.ts` is unchanged since fd326d6 |
| **T8-01** byte identity | `git diff --stat feaadff cb7d83b` is **empty** over: live-reader, deadline-reader, f1, pipeline, reader, model-output, strict-json, text-layer, pdf, fields, coherence, spec, decimal, delivery, cases, input-file, evaluate, receipt, recorded-reader, config/, data/, evaluation/, tools/evaluate/, public/figures.json, public/stories/, vercel.json, Dockerfile, the package files, METRICS.md and api/ |
| **T8-02** request bodies | **Direct reader:** the Qwen cg-004 body equals feaadff (full `10dd28b7…`, masked `69cb4771…`, the suite's golden). **Job path:** with the auditor's own capture endpoint (`tools/jobpath_bodies.mjs`), the candidate with the model chosen in the POST, against feaadff with `MODEL_ID` = that model, for Qwen3.8-27B, Gemma-4-31B-IT, DeepSeek-V4.1-Flash and Qwen3.8-Flash-Next on cg-004 and cg-021: **8/8 byte-identical** (full and masked). Prompt SHA-256 `32fad2f9…b567` |
| **T8-03** guards | The changed files under the pinned roots are exactly `src/types.ts`, `src/web/app.ts`, `src/web/live-jobs.ts` and `public/app.js` (= `STAGE8_MAY_CHANGE`), plus the new `src/web/models.ts` (= `STAGE8_NEW`). T6-10 is narrowed to exactly `[src/web/models.ts]` for the Gemma id and every experimental id, not removed |
| **Q-14** existing-test hunks | Every hunk in web.test, stage4-claims, stage5-gemma, stage6-live, stage7, browser/ui-checks and support/stub-endpoint was read: each matches the handoff list, and **no assertion is removed, skipped or loosened**. The adversary counted the same `expect` totals as at feaadff |
| **T8-04 / L-07** | Covered by the disabled-site golden test, which passes. In the image, the stories are served with `recorded: true`, and story cg-003 evaluates to **block** |
| **T8-10** suite | `npm ci`, `npm run typecheck`, `npm run build`: all rc 0. `npx vitest run` ×3: **564/564, 26 files, 0 skipped, rc 0, three times** (21:20:20Z–21:21:52Z) |
| **T8-11** Docker | `docker build --no-cache` rc 0. Image `sha256:cad7edd7…2501`; the only CACHED step is `WORKDIR`. `docker run --network none … npx vitest run`: **474 passed, 90 skipped, 0 failed**. The skips are the repo-only `describe.skipIf(!REPO)` suites: docs, metrics-md, the README diagram blocks and the evidence-dependent cases, which need `evidence/` (not in the image). All 564 ran in the clone. Mock-mode smoke with no network: `/health` 200, `/stories/*.json` 200, the cg-003 evaluate is block, `/api/live/status` disabled with its reason |
| **T8-12** generators and claims | `metrics-md --check`, `previews --check` and `diagrams --check` all rc 0. `claims-units.mjs` and `--stale` both print nothing (**0 unmapped, 0 stale**). The docs and prize tests pass. CLAIMS C-85 and C-89 are corrected |
| **T8-13…T8-20** | Covered by the candidate's stage8-live and stage8-models tests (all passing). Each new guard's killer is confirmed by T8-22 below |
| **Q-02 / DN8-01** probe cadence | Auditor's own script (`tools/probe_cadence.mjs`): fake clock, one MemoryStore, separate stubs per instance, `/api/f1` and `/api/live/status` on every instance every step for 10 simulated minutes. **feaadff 10, candidate 10** upstream GET /models, for 3 instances at 1 s, 3 at 5 s and 2 at 1 s. No increase |
| **T8-21** probe evidence | S8-T821 (commit 269897b): 0 findings. The set in the candidate's `models.ts` is unchanged since fd326d6 |
| **T8-22** auditor mutants | `tools/s8_mutants.mjs`: 22 mutants, each an exact once-only replacement on the clean clone, restored by `git checkout`. Run against stage8-live, stage8-models, stage6-live and web.test. **22/22 killed**, each with a named Stage 8 killer (`S8-T822-mutants-cb7d83b.json`). The guards covered: offer union; unknown id; unlisted enabled; listing check removed; listing after admission; stale accepted; guard against MODEL_ID; read with MODEL_ID; requested dropped (F1 copy, model_choice); missing model defaults; default from (b); ack unchecked; ack truthy; evaluated:true; set id without evidence; substring identity; future-dated accepted; measured precedence removed; legacy unguarded (offer and listing); figures on an experimental reading; label dropped |
| **T8-23** adversary bundle | Re-run in the auditor's clone at the adversary's commit 31aaaae8 (which descends from the candidate and adds `verification/` and `evidence/` only): **30 passed, 1 failed** (F8-A01, as reported). The assertions were read for the refusal and freshness probes: the exact class, 0 chat calls, an identical store snapshot before and after, and the stale, future and lock-held cases giving `probe_unavailable`. They test what they claim |
| **T8-24** secrets | Values compared in memory and counted only: the access code, SHA-256(code), the key, SHA-256(key) and the base-URL host+path. **0 hits** in the 1583 tracked files at the candidate, the 88 blobs added in feaadff..cb7d83b, the 33 `dist/` files, and the image filesystem (`docker export`, 387 142 656 bytes) |
| Browser, 375 and 1280 px | `test/browser/stage8-checks.mjs` with Playwright 1.56.1: **16/16 PASS**. The auditor viewed the screenshots: the three groups; Qwen the checked default and Gemma disabled as not listed; a hostile `<img onerror>` id shown as text; the experimental reading's "not evaluated" badge beside the proposal, with no figure on its result screen and the model as reported in Runs on AMD |

## Observations (not blocking)

- **O8-A02** (adversary: a Stage 6 queue-timeout test, line 219, fails about 1 in 25 under load): it did **not** occur in the auditor's 3 full runs (0/3), nor in the 22 mutant runs that include stage6-live. It is unchanged since feaadff. R8.3 allows a strength-preserving fix in candidate 2.
- **Pre-existing `test/browser/ui-checks.mjs:94` timeout**, reported by the implementer: **reproduced** by the auditor at **feaadff and at cb7d83b** (`page.waitForFunction: Timeout 10000ms exceeded` at line 94 in both). It is not a Stage 8 regression. The Stage 8 browser behaviour rests on `stage8-checks.mjs`.
- **Freshness boundary, by reading:** a snapshot aged between about 59 and 60 s can make a POST answer `probe_unavailable` for under a second (the store TTL is rounded down, with a minimum of 1 s). It is fail-closed and consistent with L-01; recorded, not a defect.

## Decision

**REJECTED (local) on cb7d83bc1dd5ec9aefbcd76becdaabf968470887**, for exactly one unmet condition, F8-A01. Every other T8-01…T8-24 check passed on this candidate.
- This is **repair cycle 1 of 3**. Candidate 1 is preserved unchanged.
- The live checks (S8-18) are not started; they apply to the accepted candidate.
- On candidate 2 the auditor re-checks the delta against cb7d83b in full. That means T8-01, T8-02 for any touched path, T8-03, Q-14, the suite ×3, Docker, the F8-A01 killer and mutant, and the O8-A02 fix if present. It also re-runs the T8-22 mutants for `app.ts`.
