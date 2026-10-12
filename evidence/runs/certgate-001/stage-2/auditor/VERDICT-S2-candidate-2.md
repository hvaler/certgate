# Auditor decision — certgate-001 · Stage 2 · candidate 2

- **Run / stage:** certgate-001 · Stage 2 (web app, Vercel shape, no model)
- **Auditor and seat ID:** auditor-xwz6 (`hugo.valer/auditor-xwz6`), Claude Code, model `claude-opus-5-5`
- **Date UTC:** 2026-10-12T19:38Z
- **Decision:** **ACCEPTED**
- **Product commit and tree:** `b7f4a546fee6784d3312c19b74817807f6f0114d`, product tree `33bb040e5a21ce9fa1b92f0f1dd80708808bf3ad`, verified in my own clone `C:\nexus\dev\certgate-audit-s2c2`.
- **Supersedes:** candidate 1 `496f4ddc`, REJECTED (`VERDICT-S2-candidate-1.md`, commit `1096e317`; addendum `8d4e1409`). Repair cycle 1 of 5: commits `b581e1dc`, `b7f4a546`.
- **Input:** Stage 1 accepted `9d044991`. Stage 1 obligations re-verified on this candidate (S2-34).
- **Test revisions:**
  - the product suite at the candidate (11 files, 246 tests);
  - the adversary's tests at `0203683f`. I independently reproduced the adversary's key checks: its candidate-1 harness, 24 of my own live-path checks, and all mutant diffs.
- **Spec and checksum:** sources at Stage 2 start (`stage-2/SOURCES.sha256`, commit `97288c85`): D `42081f15…`, V `9d176352…`, R `33ce894a…`. I verified D, V and R myself.
- **Register:** R2.2, commit `2ac05d62`, SHA-256 `5d93a2e987b6e7f80ead1a652ec4aaf55ab7ee74581e7da8d8b6fdf80c6ee845`. Stage 1 R1.6 (`0daa1894`, `adbae778…`) is also in force.
- **Scope wording (D2-01):** Stage 2 is accepted on the **mock / stored path only**, with **no endpoint** and **no deployment**.
  - F1 "endpoint on", live reading and AMD evidence are **not** verified in this dispatch; they go to dispatch 2.
  - The live path was exercised only against the candidate's **test stub**, which is not a model.
  - No real model and no AMD hardware were used.
  - This is not MVP acceptance and does not satisfy P:L19-20 or the AMD gates A1–A4.

## Commands run by the auditor and the environment

Evidence is under `stage-2/auditor/run-s2c2/`, in commits `02461e6d` (local runs), `fcc0205` (S2M02b) and `6a18ee92` (container runs). Host: Windows 11, Docker 29.8.0, Node v24.19.0, npm 11.17.0, Python 3.12.10 (`-I`). Browser: Chromium through the Playwright tool.

| Step | Command (abridged) | UTC | Exit | Observed |
|---|---|---|---|---|
| Infra | first `docker build --no-cache` attempt, stopped by the host for low memory | ~19:14 | — | blocker recorded (`BLOCKER-infra-build.md`); resolved by retry 1 below |
| Local clean clone | `npm ci && npm run build && npx vitest run` | –19:14:46 | 0 | 11 files, **246 passed**, 0 skipped; tree clean afterwards |
| Build, retry 1 | `docker build --no-cache -t certgate-audit:b7f4a54 <clone>` | 19:33:10–19:33:39 | 0 | `sha256:26cb4fde389cb18d19380533b789540da830e3fd0a3102f6676d70285753e291` |
| Suite in image | `docker run --rm --network none … npx vitest run` | 19:33:48–19:33:52 | 0 | **246 passed**, 0 skipped |
| 30 cases | in containers (`--network none`) **and** locally, each compared by `compare_cases_v4.py` | ~19:15, ~19:34 | 0 | **30/30 both times**; strict labels: planted, injected, MOCK, no JSON numbers, no secrets |
| S2-24 | `docker run --network none -e PORT=3000`; in-container probe `s2-24-probe.mjs` | ~19:34:20 | 0 | `/`, `app.js`, `labels.js`, `styles.css` and the stories served with CSP; F1 off with real check time; live disabled; cg-003 → review (mock); `index.html` has no external URL |
| A-21 / B-14 | CLI `--confirm` (a), (b), (c); release on cg-002; release after full confirmation | ~19:15 | 0/0/0/**2**/0 | release / review (21 pending) / block; release on block **rejected**; positive control accepted |
| Isolation | `isolation_probe.mjs`, 3 pairs, both orders, one server process | ~19:20 | 0 | identical |
| Real mode | `CERTGATE_MODE=real … process --case cg-001` | ~19:20 | 0 | error, review, `live_no_reading` |
| B-23 | `build-stories.js`, then `compare_stories.py` | 19:20:13 | 0 | EQUAL outside volatile keys; `stored_at` = file `created_at` |
| Mutants | the 14 Stage 1, M06r and the 12 Stage 2 adversary diffs re-applied by me to a working copy of the candidate (M06, M07, S2M02 and S2M08 re-based by exact line replacement in `labels.js`), plus my 2 `app.js` equivalents, plus the adversary's S2M02b | ~19:16–19:26 | — | **29/29 killed**. S2M02b survives the product suite (see observations) |
| Live path vs stub | `local_live_probe.mjs` | 19:19:52–19:19:59 | 0 | **24/24**: F1 shows the endpoint's values; atomic limit (2 of 8 accepted); next-hour reopen; no-store; override ignored; bypass rejected; access code (403, not consumed, throttled, never echoed); C11 429/5xx/invalid_json/huge; no key in responses. The timeout mode was verified on candidate 1 (unchanged path) |
| F2-03 / F2-04 | `local_adv_f01_f03_probe.mjs` (configured id ≠ endpoint id; cg-021 contamination) | ~19:20 | 0 | `model_id` = endpoint's id; configured id only as "requested"; contaminated text **withheld** (`available: false`); proposal block |
| Browser, local server | 6 screens × 375 and 1280, plus F2-01 and F2-02 flows | 19:20–19:22 | — | every screen: scrollWidth ≤ innerWidth (360/375, 1265/1280), notice present, 0 other-origin resources, no AMD/LIVE/model-id string; release disabled on cg-002/003 and enabled on cg-001 |
| F2-01 in the browser | cg-002: confirm Mn, re-run, block decision, open the receipt | ~19:20:53 | — | case file, after decision **and receipt screen**: "stored 2026-10-12T19:05:49.057Z · re-evaluated by the server at … · not live" |
| F2-02 in the browser | upload of byte-identical cg-001 with no endpoint, limit 3 | ~19:21:12 | — | "Stored in this browser · live attempt · no reading · … · not live"; explanation "this was a live attempt and nothing was read"; no "mock" on the page |
| Browser, container | container UI on a published port, 6 screens at 375 plus cg-003 at 1280 | ~19:34–19:35 | — | same results as the local run; cg-003 label shows the true stored time |
| Static | `git grep` for secrets in `public/`, the price, deploy linkage, local paths in changed product files | ~19:37 | — | clean |

**Screenshots (`run-s2c2/screens/`, 16 files):**
- `1280-0{1..6}-*.png` and `0375-0{1..6}-*.png` from the local server;
- `1280-08-local-upload.png` and `1280-09-cg-002-receipt-after-reevaluation.png`;
- `container-0375-amd-f1.png` and `container-1280-story-cg-003.png`.

## Coverage against the register

| Rows | Result |
|---|---|
| S2-01 landing (placeholders, button to the ambiguous case), B-20 | met |
| S2-02 progress with real durations, mock badge | met |
| S2-03 case file (values, spec, source, channels, unknown) | met |
| S2-04 human decision, B-14, B-15 | met |
| S2-05 receipt, B-10 | met (JSON download control present; content checked on candidate 1 via API) |
| S2-06 375/1280 usability | met |
| S2-07 notice | met |
| S2-08 look, B-17 | met |
| S2-09 README | met (unchanged since candidate 1) |
| S2-10 explanation, F2-02, F2-04 | met |
| S2-11, S2-12, S2-13, S2-36, B-06, B-19 F1 | met (off path verified for real; on path against the test stub only, D2-05) |
| S2-14 stored stories, B-11, B-12, B-23, F2-01 | met |
| S2-15, D2-07 | met |
| S2-16, B-02, B-03, B-05, B-07 limit | met (stub) |
| S2-17, B-04 access code | met (stub) |
| S2-18 no login | met |
| S2-19 bypass | met (auditor plus adversary) |
| S2-20, B-13 upload | met |
| S2-21 stateless, B-09 | met |
| S2-22, B-18 Vercel limits | met (live docs checked on candidate 1; record unchanged) |
| S2-23 no deploy | met for repo and config; that no seat ever ran a deploy is a **stated limitation** |
| S2-24 container offline | met |
| S2-25, B-22 C11 | met (stub) |
| S2-26 secrets | met (responses, client files, image env) |
| S2-27 adversary attacks | adversary bundles `1cb938ba` (candidate 1) and `63ea06c9` (candidate 2), test revisions `c7295154` and `0203683f`; key items reproduced by me |
| S2-28 mutation | met: 29/29 killed by the product suite in my runs |
| S2-29 auditor reproduction | this record |
| S2-30 where AMD fits | met (landing and README state that nothing runs on AMD in this build) |
| S2-31 live_no_reading | met |
| S2-32 source hashes | met |
| S2-33 recovered injected failures | met (P20 style, product suite) |
| S2-34 Stage 1 regression | met (suite, 30 cases, A-21, isolation, 14 Stage 1 mutants on this candidate) |
| S2-35 local paths | met for files added since `9d044991` (one hit in my own mutant log was redacted before commit); earlier implementer Stage 1 logs are a known item for the human |
| D2-06 | limitation stated: the counter is per instance (OI-S2-01) |

**Invariants I1–I7 hold on the mock/stored path:**
- **I1:** decisions come only from rules; an unreferenced model text is withheld.
- **I2 to I5:** the Stage 1 regression holds.
- **I6:** no secrets in the repo, the image, client files, responses or my evidence; the room is a stated limitation.
- **I7:** stored, mock, planted and live-attempt states are labelled on every screen and receipt, with their real timestamps.

## Findings from candidate 1: status

F2-01, F2-02, F2-03, F2-04 and F2-05 are **resolved**, reproduced on this candidate as above.

## Observations (non-blocking)

1. **S2M02b** (adversary): an `app.js` change that drops the trailing " · not live" from the story label survives the product suite. My reproduction is in `run-s2c2/mutants/S2M02b-adversary.*`.
   - The adversary's browser checks A1/A4 kill it, so the §MUTATION CHECK condition "at least one test fails" holds.
   - The label still reads "Stored reading · mock reading, no model · stored <original time>", so I7 holds.
   - Recommendation: add a product test in dispatch 2.
2. **Explanation references:** an explanation is shown only if every reference names a field that was read with a source. Injected text that cites real field names would still be shown as an explanation. I1 holds, because it never decides. Dispatch 2 must prompt a real model for references and review this rule.
3. **Open items for dispatch 2, declared by the implementer:**
   - OI-S2-01: per-instance counter;
   - OI-S2-02: no start-then-poll;
   - the live request format is untested against real vLLM;
   - system fonts differ slightly from the design.
4. `/favicon.ico` returns 404, which is cosmetic.
5. The implementer's Stage 1 `repair-1/*.txt` logs contain local user paths: a known item for the human before the repo goes public (S2-35).

## Budgets at 19:38Z

- Stage 2: started about 18:12Z, about 86 min used of 300.
- Repair cycles: 1 of 5.
- Infrastructure retries: 1 of 2 used for the build.
- Run total: until 2026-10-13T02:52Z. Hard stop: 2026-10-14T20:00Z.
- Seat token and cost usage: unknown.

## Next action authorised by the dispatch

Stages 1 and 2 of this dispatch are accepted. Analyst writes the final report. Stages 3 and 4 need the AMD endpoint and a second dispatch.

ACCEPTED is internal acceptance of `b7f4a546fee6784d3312c19b74817807f6f0114d` (tree `33bb040e…`) only. It is not a statement about hidden tests, real-model behaviour, AMD, deployment, or an official event result. Any later change to the product tree voids it until it is rechecked.
