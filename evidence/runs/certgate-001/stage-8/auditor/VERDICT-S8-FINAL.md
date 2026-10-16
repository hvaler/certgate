# Auditor verdict — Stage 8 FINAL (S8-17 + S8-18, S8-28): **ACCEPTED**

- **Deployed commit:** GitHub main `37938b251189fed7be636fc2187e6fbd1fe778fa`. That is `git ls-remote` at 04:23:06Z and again at the start of every live step, equal each time. It is a fast-forward from feaadff and contains the locally accepted candidate.
- **Product:** `adb21d5ef03163b5caeb76b1b063f7fae1e7e037` (tree `c3d5d399…`), ACCEPTED (local) in `VERDICT-S8-candidate-2-local.md` (0920b82).
- **Product identity of the deployment:** `git diff adb21d5 37938b25 -- . ':!evidence'` is **empty**. The commits after adb21d5 are evidence only: the analyst's register, log and addendum, and the auditor's records.
- **Site:** https://certgate-wheat.vercel.app. Operator deployment report msg 7afc3c62: `LIVE_MODELS` is set to the DEPLOY.md value, `MODEL_ID=Qwen3.8-27B`, no other variable changed. Analyst R8.4 (62e087d).
- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`.
- **Lease:** ENDPOINT LEASE TAKEN (4d8b723a) at about 04:23Z, RELEASED (79631832) after the last reading at about 04:29Z.
- **Tools:** `tools/live_s8.mjs` (the checks and the readings) and `tools/live_screen.mjs` (the browser).
  - The access code was read only from the user-level registry at run time. The key and the base URL came from the environment.
  - No value or property of any secret was printed or written: every save and the logs are checked against the code, SHA-256(code), the key, SHA-256(key) and the base-URL host+path, and a save that would contain one is refused.
- **Records:** `stage-8/auditor/live/` (logs, JSON bodies, counts, screenshots).

**Endpoint use by this seat:**
- **3 live readings, out of the cap of 4, with 0 infrastructure retries.**
- 4 direct GET /models, out of the cap of 8.
- GET /usage before and after each step.
- **0 wrong codes**: every refusal was made with the correct code.

These are Token Factory free credits, with no monetary value.

## T8 results on the deployed site

| Rule | Result |
|---|---|
| **T8-30** identity | `ls-remote` main = 37938b25 at every step. Served `/index.html`, `/app.js`, `/labels.js`, `/styles.css`, `/figures.json` and `/stories/cg-003.json` are 200 and **byte-equal** to the committed `public/` at 37938b25. `/health` 200, ok, reader live. `/api/f1` on. Story cg-003 evaluates to **block**, `recorded: true`. Status: enabled, access code required |
| **T8-31** listing now | Direct GET /models at 04:23:34.429Z and at 04:23:34.963Z, around the site's status read: **11 ids each, identical**. The site's `models.checked_at` (04:23:33.252Z) is its own probe's time, and it is the time the page shows. Every listed id is in exactly one group, matching the direct listing: **group problems 0** |
| **T8-32** offer | Offered and enabled: Qwen3.8-27B and Gemma-4-31B-IT (MEASURED); DeepSeek-V4.1-Flash, DeepSeek-V4-Flash-Vision-Exp, MiMo-V2.6-Flash and Qwen3.8-Flash-Next (EXPERIMENTAL, each labelled "not evaluated · experimental · probed 2026-10-15", with its probe evidence). That is (measured ∪ committed probed set) ∩ LIVE_MODELS ∩ listed-now. LISTED, NOT OFFERED, each disabled with its reason: DeepSeek-V4-Flash, GLM-5.3-Flash and MiniCPM5-2B ("no image probe"), MinerU2.5-Pro ("not a chat model"), MiniCPM-V-4.7-1B ("probe failed"). The default is **Qwen3.8-27B**, measured. **No model without an evaluation run or passing probe evidence is offered** |
| **T8-33** refusals, correct code, limit unspent | at UTC minute 23. Each of these was refused with no job id: **400 `model_not_offered`** for an unknown id (`Llama-3.3-70B-Instruct`); **400 `model_not_offered`** for a listed group (c) id (`DeepSeek-V4-Flash`); **400 `model_ack_required`** for an experimental model with no acknowledgement; **400 `model_ack_required`** with the string `"true"`; **400 `model_missing`** with no model. Five status reads before and five after: `used_this_hour`, the per-client and the global code-failure counts all **0 in all 10**. GET /usage `daily_cost_used_usd` is **unchanged** (0.003916080… → 0.003916080…), so no chat call was made |
| **T8-34** one real live reading per listed measured model, plus one experimental | The sample **cg-004** with its own delivery note (ALB-2026-1003.csv, line 1), the access code in the header. Detailed in the next table |
| **T8-35** unlisted offered model | **Condition absent** at the direct GET /models of 04:23:34.429Z: every offered model, Gemma-4-31B-IT included, was listed. There was no unlisted offered model to show disabled or refuse live. This behaviour rests on the local evidence (stage8-live "…does not list now: model_unlisted"; mutants M8-03, M8-04 and M8-05 killed; the browser check "Gemma disabled as not listed" at 375 and 1280 px), as T8-35 states. **A stated limitation, not a live pass** |
| **T8-36** secrets | **0 hits** for the code, SHA-256(code), the key, SHA-256(key) and the base-URL host+path, across every site response body and header in all four runs (31, 78, 28 and 40 exchanges), including the served bundle files. The push itself scanned 0 (records 7fd2fee4, 6571c78) |
| **T8-37** legacy route | `POST /api/live/read` gives **503** "live reading unavailable on the deployed site; live demonstration from the container", with and without a model in the body |

### T8-34 readings

| Model | Group | POST | States (s) | Receipt | Model as reported (strict rule) | F1 copy | Hourly count | Reply cost = /usage delta |
|---|---|---|---|---|---|---|---|---|
| **Qwen3.8-27B** | measured | 202, `evaluated: true`, listing_checked_at 04:23:33.252Z | reading at 3, **done at 138** | `reading_source: live`, proposal **release** (the cg-004 expectation) | `self-dploy/Qwen3.8-27B` ✓ | model_requested Qwen3.8-27B, reported self-dploy/Qwen3.8-27B, `model_evaluated: true` | 0 → **1** (×5 / ×5) | 0.000239575 = 0.000239575 ✓ |
| **Gemma-4-31B-IT** | measured | 202, `evaluated: true` | reading at 2, **done at 30** | live, proposal **release** | `self-dploy/Gemma-4-31B-IT` ✓ | requested and reported as named, `model_evaluated: true` | 1 → **2** | 0.0001025185 = 0.000102519 ✓ |
| **Qwen3.8-Flash-Next** | **experimental**, with `not_evaluated_acknowledged: true` | 202, **`evaluated: false`** | reading at 2, **done at 56** | live, proposal **release**; `model_choice`: label **"not evaluated"**, **`figures: null`**, probe_evidence `stage-8/probes/Qwen3.8-Flash-Next.json`; **no measured figure** in the view | `self-dploy/Qwen3.8-Flash-Next` ✓ | **`model_evaluated: false`**, `model_probe_evidence` = that path | 2 → **3** | 0.00065226 = 0.000652260 ✓ |

- Each reading counted exactly one hourly unit.
- No reading fell back to another model or to a stored result: each receipt is live, names its own requested model, and reports that model.
- Each receipt carries its own F1 snapshot, with its own `checked_at`.

### The deployed screen (`tools/live_screen.mjs`, GETs only)

Playwright 1.56.1 at **1280 and 375 px** (`live/deployed-live-models-{1280,375}.png`, `deployed-live-screen.json`):
- **6 radio choices**: the 2 measured and the 4 experimental, with Qwen3.8-27B checked.
- The 5 "listed, not offered" ids are **text only**, never choices.
- The acknowledgement row stays hidden until an experimental model is picked.
- The statement "You can choose only the models CertGate has measured, and experimental models that passed a probe in this stage, and only while AMD Token Factory lists them now…" and the 200-character note are present.
- The probe time shown equals the site's `checked_at`.
- 0 dialogs.
- The auditor viewed the 1280 px image.

## Automatic rejections (dispatch 6 as read in R-A…R-F, L-RA): none occurred

| | |
|---|---|
| A model offered without an evaluation run (group a), or without passing probe evidence (group b) | **No.** The measured models are the two with evaluation runs. The four experimental ids are exactly the S8-T821-verified passing probes |
| Measured figures presented for an experimental model | **No.** The experimental receipt has `figures: null`, and no figure text appears in its view |
| Fallback to another model or to a stored result | **No.** T8-34 above; locally T8-02 and M8-08 |
| The key reachable from the browser | **No.** T8-36; locally T8-24, including the image |
| An experimental model as the default, or shown without its label | **No.** The default is Qwen3.8-27B, and every experimental entry carries "not evaluated · experimental" |

## Limitations (stated, not passes)

- **T8-35, condition absent:** no offered model was unlisted at audit time, so "an unlisted model is shown disabled and refused" was **not observable live**. It rests on the local evidence above.
- **0-chat-call evidence for the T8-33 refusals:** GET /usage on this endpoint exposes no request counter (the field is absent). So that evidence is the unchanged `daily_cost_used_usd`, together with: no job id in any refusal, unchanged hourly and code counts, and the server-side order verified locally (L-09, M8-05).
- **Live samples:** one reading per model, on one sample (cg-004). Live correctness of the experimental model's values is **not** judged, and no CertGate figure applies to it (Am1 §2).
- **Token Factory's list changes** without notice (Gemma unlisted at 19:46Z, listed again by 04:21:59Z). The verdict describes the listing at 04:23–04:28Z only.
- **Carried from the local verdict:** `ui-checks.mjs:94` (pre-existing); the sub-second `probe_unavailable` at the 60 s boundary; the Stage 6/7 mutants on unchanged files, carried; Upstash REST not exercised for the Stage 8 refusals locally (the deployed site uses it, and the live refusals ran through it).

## Decision

**Stage 8 ACCEPTED.**
- **Bound to:** deployed GitHub main `37938b251189fed7be636fc2187e6fbd1fe778fa`, whose product is the locally accepted candidate `adb21d5ef03163b5caeb76b1b063f7fae1e7e037` (tree `c3d5d399fe016b5eeb86f4e7932e36db30f02dcc`).
- **Repair cycles:** 1 of 3. The rejected candidate 1 `cb7d83bc…` is preserved with its records.
- **Coverage:** all in-scope obligations, S8-00…S8-28, have reproduced evidence. The one exception is T8-35, whose live condition was absent; that is stated above as a limitation.
- **Still open, outside this verdict:** the analyst completes the addendum's §4 from this record (S8-20).
- **A later product change voids this acceptance until it is rechecked.** Evidence-only commits do not.
