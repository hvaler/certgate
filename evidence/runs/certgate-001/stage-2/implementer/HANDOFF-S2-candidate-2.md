# Stage 2 candidate 2 (repair cycle 1 of 5): implementer handoff record

To: @hugo.valer/analyst-xwz3, @hugo.valer/adversary-xwz5, @hugo.valer/auditor-xwz6 · From: @hugo.valer/implementer-xwz4
Run certgate-001 · Stage 2 · Register **R2.2** (commit 2ac05d62, SHA-256 5d93a2e9…e845), with R1.6 in force.
Repair task: analyst msgs 9bfa32c4 … 031d9fb3 (parts 1–11), addendum 097b4723, and msg 4f383aca. Findings come from
the auditor verdict 1096e317 (F2-01, F2-02), auditor addendum 8d4e1409 (F2-03, F2-04, F2-05) and adversary msgs
270b6936 (ADV-S2-F01…F04) and ee2b2219 (mutant diffs).

The complete task and specification travel with the room handoff, which has 11 parts. A success statement here is a
claim, not acceptance. Scope (D2-01): mock and stored path only, no endpoint, no deployment.

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `b7f4a546fee6784d3312c19b74817807f6f0114d` |
| Product tree | `33bb040e5a21ce9fa1b92f0f1dd80708808bf3ad` |
| Input revision (preserved) | candidate 1 `496f4ddc76bf3a3c088d933d712d7f248efe1ebe` |
| Repair commits | `b581e1dc` (F2-01, F2-02), `b7f4a546` (F2-03, F2-04, F2-05) |
| Working tree | clean for product paths |

## Findings and repairs

| Finding | Reproduced on 496f4ddc | Cause | Repair | Regression check (fails on 496f4ddc, passes on b7f4a546) |
|---|---|---|---|---|
| **F2-01** [REJECT]: a re-evaluated story shows the re-evaluation time as its stored time | yes. Browser check: case file, after a decision and on the receipt screen all FAIL (receipt screen had no label at all) | label built from the re-evaluated receipt's `created_at` | the story keeps `storedAt` from the static file. `storyLabelDetail` shows "stored <original> · re-evaluated by the server at <time>" on the case file and the receipt screen | ui-checks "F2-01: …" ×3; labels.test "a re-evaluated story keeps the original stored time …" |
| **F2-02 = ADV-S2-F02** (required): upload explanation says "mock" | yes (browser FAIL; API note) | any non-live source got the mock text | `explanationNote(reading_source)`: mock, planted, live, and live_no_reading ("live attempt and nothing was read") | web.test byte-identical upload; ui-checks "F2-02 …" |
| **F2-03 = ADV-S2-F01** [REJECT]: configured model id presented as the endpoint's | yes, by cause: `get model_id()` returned the configured id | reply `model` field ignored | `LiveReader` records the reply's `model` verbatim as `reader.model_id` (missing => "unknown (the endpoint reported no model id)"). The configured id appears only as `reader.requested_model_id` and in the note as "requested" | web.test "model id: the receipt shows the id the endpoint reported …" (configured `configured-name-not-from-endpoint`, reported `adv-stub-model-7f3a`, and an omitted model) |
| **F2-04 = ADV-S2-F03** [REJECT]: unreferenced explanation shown | yes, by cause: any live `expl.text` was shown | no reference check | shown only if every `references[]` entry names a field read with a source in the document. Otherwise withheld, with the note "withheld: it has no references to verifiable input". The receipt keeps `model_text {text, references, untrusted: true, used_for_decision: false}` | web.test cg-021 contamination via stub (withheld; proposal block); positive and negative reference tests |
| **F2-05 = ADV-S2-F04** [REJECT]: mutants S2M01, S2M02, S2M04, S2M08 survive | yes, per adversary and auditor | the suite had no behavioural UI-label, client-count or UI-gating tests | label and gating logic moved to `public/labels.js` (loaded by `index.html` before `app.js`) and tested in node via `vm`. Behavioural tests plus static guards on app.js; a client-count test with `remaining_this_hour: "999"` | **kill table below** |

### Mutant kill table (throwaway branch `throwaway/s2-mutant-check` in my scratch clone of b7f4a546, never committed or merged)

| Mutant | Applied as | Result | Killing tests | Artifacts in `repair-1/mutants/` |
|---|---|---|---|---|
| S2M01 | adversary diff verbatim (`src/web/view.ts`) | **killed**, 2 failed | labels.test "view labels per reading source"; "a mock run's view is labelled mock …" | `S2M01-verbatim.diff/.txt` |
| S2M02 | equivalent in `public/app.js` (drawStory `storedDetail` → `` `live reading · ${new Date().toISOString()}` ``; the verbatim line no longer exists) | **killed**, 1 failed | labels.test "app.js builds every stored label through labels.js …" | `S2M02-equivalent-app.diff/.txt` |
| S2M02 | equivalent in `public/labels.js` (`storyLabelDetail` → live label with the current time) | **killed**, 1 failed | labels.test "a stored story shows its original stored time, says mock and not live" | `S2M02-equivalent-labels.diff/.txt` |
| S2M04 | adversary diff verbatim (`src/web/app.ts`) | **killed**, 1 failed | web.test "a client-sent remaining_this_hour is ignored: 10 parallel reads against a limit of 3 give exactly 3" | `S2M04-verbatim.diff/.txt` |
| S2M08 | equivalent in `public/app.js` (`const releaseOk = true;`) | **killed**, 1 failed | labels.test "app.js gates the Release button … only through releaseAllowed" | `S2M08-equivalent-app.diff/.txt` |
| S2M08 | equivalent in `public/labels.js` (`releaseAllowed` → `true`) | **killed**, 2 failed | labels.test "release is offered only for a release proposal …"; "on the stored stories: disabled for cg-002 and cg-003 …" | `S2M08-equivalent-labels.diff/.txt` |

The verbatim S2M02 and S2M08 lines would also be caught by the static guards: `storedDetail:` with a template literal,
and `releaseOk = true`.

## Commands

As candidate 1, with `b7f4a546fee6784d3312c19b74817807f6f0114d` (image tag `certgate:s2c2`). The stub can now set the
reply's model id (`state.reportedModel`, `state.omitModel` in tests). The stored stories were regenerated with the
pipeline because the receipt gained `requested_model_id` and `model_text`: `node dist/src/tools/build-stories.js`.

## Own results (implementer; not independent verification)

| Run | Result | Artifact (in `stage-2/implementer/candidate-2/`) |
|---|---|---|
| Clean clone: `npm ci && npm run build && npx vitest run` | 11 files, **246 passed**, 0 failed, 0 skipped | `local-clean-clone-tests.txt` |
| `docker build --no-cache` | exit 0, image `sha256:396b1fbc…79da` | `docker-build-no-cache.txt` |
| Suite in the image, `--network none` | **246 passed** | `docker-network-none-tests.txt` |
| Offline in-container `/api/f1`, `/api/live/status`, `/` | F1 off with real check time; live disabled; page served | `docker-network-none-ui-api.txt` |
| Container UI, 6 screens at 375 and 1280 px | `scrollWidth == innerWidth` on all 12; notice on all; 0 external requests; 0 console errors; 0 AMD-run claims | `screens/` |
| Browser checks (clean-clone build) | **13/13 PASS** (9 from candidate 1, plus F2-01 ×3 and F2-02) | `ui-checks.txt`, `ui-checks/` |
| New checks on candidate 1 code | browser: 4 FAIL (F2-01 ×3, F2-02), 9 PASS | reported in room msg a28cfc54 context; run in scratch clone of 496f4ddc |

## Mapping changes since candidate 1

S2-14, B-12 and I7 gain F2-01 (`public/labels.js`, `public/app.js`). S2-10 and S2-31 gain F2-02 (`src/web/view.ts`
`explanationNote`). S2-11 and B-01 gain F2-03 (`src/web/live-reader.ts`, receipt `requested_model_id`). S2-10 and I1
gain F2-04 (`explanationView`, receipt `model_text`). S2-28 gains F2-05 (`test/labels.test.ts`, web.test S2M04). All
other rows are as in HANDOFF-S2-candidate-1.md.

## Known gaps

As candidate 1, items 1–8. In addition: explanations need a `references` list naming reading fields. A real model
must be prompted to supply it (dispatch 2). Without it, every explanation is withheld.

## Time and usage

Repair 1 handoff received at about 19:00Z. Candidate 2 committed at about 19:07Z, and clean-clone verification
finished at about 19:13Z. Stage 2 implementer total: about 60 minutes. Token and cost usage: unknown, because there is
no per-seat meter. Model: claude-opus-5-5.
