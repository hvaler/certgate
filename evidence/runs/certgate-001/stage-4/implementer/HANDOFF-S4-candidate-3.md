# Stage 4 candidate 3 (repair cycle 2 of 5): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 4
Repair task: analyst msg 3d89a497 and the formal handoff d4c471e2 … f1ff9aa4 (14 parts). Finding: adversary
observation 9390ddb7; implementer msg 86391428. Register R4.7 (commit a2440d0). This record states what was done;
it is not an acceptance. **No push. No endpoint calls.**

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `a130bbf468bccce5d3faa1a4e3cf707dda3139c1` |
| Tree | `acaad466c8bafb5169a49b61e7d2b262f3e3b515` |
| Input revision (preserved, not rewritten) | candidate 2 `ac738ef3ebb4675760f1b24c10964da49fd79067` (+ evidence up to `944217a`) |
| **Diff vs ac738ef3, excluding evidence** | `README.md` (+4 −2), `CLAIMS.md` (C-15 row), `claims-map.json` (C-15 units), `test/story-screen-render.test.ts` (+26). **Docs and tests only**: no file under `src/`, `public/` or `api/` changed |

## Repair: README C-15 true in only one state

Old: "The endpoint does not expose the GPU model, the ROCm version or the serving-stack version. The panel says "not
exposed by the endpoint" for them, and nothing else claims them."

New: "The endpoint does not expose the GPU model, the ROCm version or the serving-stack version. With the endpoint
on, the panel says "not exposed by the endpoint" for them; with it off, they show "unknown", like the other
endpoint values (the model list shows "none"). Nothing else claims them."

The analyst's suggested "every endpoint value shows unknown" is made exact. With the endpoint off, the
"Model(s) listed" row shows "none", not "unknown", and the test asserts that.

**Proof, both states, as rendered** (`test/story-screen-render.test.ts`, describe "Runs on AMD panel rows for GPU,
ROCm and vLLM in both states (README C-15)"). The real `public/app.js` runs in a vm with the DOM stand-in:
- "endpoint on: GPU and ROCm · vLLM say "not exposed by the endpoint"";
- "endpoint off: GPU, ROCm · vLLM and every other endpoint value show "unknown"". This checks GPU, ROCm · vLLM,
  Model (as reported), Probe latency, Last reading and Tokens / s, that "Model(s) listed" is "none", and that "not
  exposed by the endpoint" appears nowhere.

CLAIMS row C-15 cites both, plus the existing server test "with the test stub: shows only what the endpoint
reports…". In `claims-map.json` the old unit is replaced by the two new units, both C-15.

## Verification (`repair-2/clean-clone-tests.log`)

Clean checkout of a130bbf, `npm ci` (lockfile unchanged), build, `npx vitest run` with MODEL_* unset: **315/315**.
METRICS.md matches a fresh generation. Unmapped sentences: **0**; stale map entries: **0**. Docker and browser
were not re-run: no product, packaging or `public/` change since candidate 1.

Time: repair routed about 21:10Z; candidate 3 frozen about 21:14Z.
