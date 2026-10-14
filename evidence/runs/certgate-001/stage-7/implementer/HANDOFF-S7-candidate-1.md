# Stage 7 candidate 1 (phase A): implementer handoff

**Candidate commit `4ef04b272e0766caaf34b934e28230bf60a52f8c`, tree `7ce51055fb5dedb65c88d91fa4016856695c5504`**
(frozen). It is three commits:
- `431316e`: the product, tools, docs and tests;
- `edfcd33`: a test that kills `b4`;
- `4ef04b2`: the repository-only checks are skipped in the container image, as the docs tests are.

`src/`, `public/`, `data/` and the docs are identical at `431316e` and `4ef04b2`. Its input is `2e472e77`, GitHub `main`, which contains the Stage 6 accepted candidate `9759d3af`.

Governing documents:
- **Register:** R7.1, including CH7-01…CH7-12 (adversary 10d6e7f5) and L-13…L-15 (analyst dfbc060c).
- **Dispatch:** dispatch 5 (msg 6f50b629).
- **Handoff:** the analyst's 21f4b2d9 … f945b274.

No endpoint call was made, and nothing was pushed or deployed. **Phase B** (the screenshots from the deployed site)
follows the human's push. Logs are under `stage-7/implementer/candidate-1/`.

## 1. Diff vs 9759d3af, and the reason for each hunk

`git diff --stat 9759d3af 431316ec -- . ':!evidence'`: 27 files, 1978 insertions and 97 deletions. `edfcd33` and `4ef04b2` change only `test/stage7.test.ts` and `test/stage7-diagrams.test.ts`.

**Product:**

| File | Change | Obligation |
|---|---|---|
| `src/web/app.ts`, hunk 1 | `ORIGINALS`, a fixed `Map` built from `[...STORY_IDS, ...SAMPLE_IDS]`. `originalFile(id)` looks the id up and answers 404 when it is absent; the request id is only a map key. `ORIGINAL_BY_SHA256` maps the three sample PDFs' SHA-256 to their id. The answer is `image/png`, with `SECURITY_HEADERS` (nosniff) and `x-content-sha256` | S7-04, T7-02, CH7-04, CH7-05 |
| `src/web/app.ts`, hunk 2 | `storyEvaluate` returns `{ ...sv, ...out.view, ...sv }`, so the story view's key order is used and `recorded` and `recorded_at` sit next to `reading_source` | S7-05, T7-04 |
| `src/web/app.ts`, hunk 3 | routes `GET /api/originals/<id>` and `GET /api/originals/by-certificate/<sha256>` | S7-04, CH7-04 |
| `src/tools/build-stories.ts` | `storyView` puts `recorded: true` and `recorded_at` right after `reading_source`. A live job result never goes through `storyView` | S7-05, CH7-07 |
| `public/stories/cg-00{1,2,3}.json` | 2 lines each: `"recorded": true` and `"recorded_at"` after the view's `reading_source`. Nothing else changes; the story list already carried `recorded: true` | T7-04 (the T7-01 exception) |
| `public/app.js` | **Original panel:** "View the original certificate" sits beside the values, in the right-hand column above "Runs on AMD", as a `<details>` holding the page image. **Stories:** `/api/originals/<id>`. **Live result:** the receipt's `certificate_sha256`, computed by the server, is compared with the sample hashes the server lists. On a match the page uses `/api/originals/by-certificate/<sha>`. Otherwise it shows "The original is your own file …" as text only, and requests nothing. **Label lines:** the `ctx` lines are unchanged (labels test) | S7-04, CH7-04 |
| `data/previews/*.png` (new) | 6 previews | S7-03 |

The diff is **empty** on: the reading path, `live-reader.ts`, `live-jobs.ts`, `live-store.ts`, `deadline-reader.ts`,
`limits.ts`, `config/`, `evaluation/`, `data/cases/`, `data/expected/`, `public/figures.json`, `METRICS.md`,
`vercel.json`, `package.json` and `package-lock.json`. `vercel.json` needs no change, because `includeFiles`
already covers `data/**`.

**Tools and docs:**

| File | Change | Obligation |
|---|---|---|
| `tools/previews.mjs` (new) | **Scans:** the embedded page image XObject, decoded by pdf.js and re-encoded as PNG with no scaling or drawing. **Digital:** page 1 rendered at scale 2 by pdf.js 6.4.299 on @napi-rs/canvas 1.0.11 (both pinned in the lockfile), with the bundled standard fonts and no system fonts. `--check` exits 1 on any difference | S7-03, T7-03, CH7-06 |
| `tools/diagrams.mjs` (new) | One definition generates both the Mermaid blocks and the SVGs. Every node and edge carries a `file` and a `symbol`. `--check` compares the committed SVGs | S7-01, T7-06, CH7-09, L-14 |
| `docs/diagrams/{architecture,flow}.svg` (new) | the band's own render | S7-01 |
| `tools/capture-screenshots.mjs` (new) | the phase B capture script; see section 5 | S7-02, CH7-01/02/03/11, L-13 |
| `README.md` | restructured in the dispatch order; see section 4 | S7-06 |
| `CLAIMS.md` | C-64 reworded; new C-87 (Try it, the original), C-88 (previews), C-89 (architecture diagram), C-90 (flow diagram), C-91 (screenshots) | E-11 |
| `claims-map.json` | 112 new units mapped, 8 stale units removed | E-11 |

**Tests:**

| File | Change | Obligation |
|---|---|---|
| `test/stage7.test.ts` (new) | route, flag, previews and README tests | T7-02/03/04/07 |
| `test/stage7-diagrams.test.ts` (new) | each node and edge's file and symbol, the SVG equality, the README blocks, the forbidden labels | T7-06, CH7-09 |
| `test/stage7-capture.test.ts` (new) | static checks on the capture script | CH7-01/02/03/11 |
| `test/support/stage7.mjs` (new) | the Stage 7 exceptions, stated once: the 2 flag lines in the story files, `data/previews/`, and `build-stories.ts` | T7-01 |
| `test/stage5-gemma.test.ts`, `test/stage6-live.test.ts` | the byte-identity guards and the J-08 disabled golden accept exactly those exceptions and nothing else. Empty `.sonar` folders that a host editor plugin creates (git-excluded) are skipped in the directory walk | T7-01, CH7-07 |
| `test/docs.test.ts` | exactly one deployment URL is allowed, `https://certgate-wheat.vercel.app`, once, in README "Try it"; any other `vercel.app` or hosted-demo wording is still forbidden. The high-entropy check exempts exactly the SHA-256 digests of the committed previews | S7-06 vs R4.7 F-06 |

## 2. Preview hashes (S7-03)

| Case | Kind | Preview | SHA-256 |
|---|---|---|---|
| cg-001 | digital (pdf.js render) | `data/previews/cg-001.png` | `686b0e2f4687d9557220cc8bef65f84423ee656a1d3cc2687efd5f515edd116f` |
| cg-002 | scan (the PDF's page image) | `data/previews/cg-002.png` | `b4eaf0d17d76a5f764b9cdebbb5f7f4166cc1e06d4b854f9bb297a6c9300b5fe` |
| cg-003 | scan (the PDF's page image) | `data/previews/cg-003.png` | `9fb6e411349eb8c1b57833b19d09b361e40de299544244ac92a9b7d4cf05b174` |
| cg-004 | digital | `data/previews/cg-004.png` | `b850c1e334d440e6f619a76bb0e5e5af48e19480c92ab37858b0b7992ca8c413` |
| cg-005 | digital | `data/previews/cg-005.png` | `fc1c257336227937d7a4bd5c3908954aa1d424fdbb4dbbd360d6354fb699d51a` |
| cg-010 | digital | `data/previews/cg-010.png` | `74d3335d9b32fbfc6c30031dde67f681bef1e99bc9982db4802f7e49224cbb8c` |

- **Regeneration:** two runs on this host give identical bytes (`node tools/previews.mjs --check`: 6 ok).
- **In the suite:** the test "a fresh run of tools/previews.mjs equals every committed PNG" regenerates in-process and
  compares, so the clean clones and the Docker image check this too (CH7-06). The PNGs carry no `tIME`, `tEXt`,
  `iTXt` or `zTXt` chunk.

## 3. Diagram-to-code map (S7-01, T7-06)

The definition is `DIAGRAMS` in `tools/diagrams.mjs`. The test `test/stage7-diagrams.test.ts` asserts, for every
element below, that the file exists and contains the symbol.

**Architecture:**

| Element | File · symbol |
|---|---|
| Browser | `public/app.js` · `doLiveRead` |
| Container (other way to run) | `Dockerfile` · `FROM node:24.21.0-bookworm-slim` |
| Vercel static site | `vercel.json` · `"outputDirectory": "public"` |
| Vercel function api | `api/index.ts` · `export default function handler` |
| Node server | `src/server.ts` · `export function createApp` |
| Request handler | `src/web/app.ts` · `export function createHandler` |
| Live-reading queue and limits | `src/web/live-jobs.ts` · `export class LiveJobs` |
| Live reader | `src/web/deadline-reader.ts` · `export class DeadlineReader` |
| Upstash Redis store | `src/web/live-store.ts` · `export class UpstashRestStore` |
| In-process store | `src/web/live-store.ts` · `export class MemoryStore` |
| AMD Token Factory | `src/web/f1.ts` · `ENDPOINT_NAME = "AMD Token Factory"` |
| Deployed live model Gemma-4-31B-IT | `DEPLOY.md` · `Gemma-4-31B-IT` |
| Evaluated product model Qwen3.8-27B | `METRICS.md` · `Qwen3.8-27B` |

Architecture edges:
- browser → static: `vercel.json` · `"outputDirectory"`;
- browser → api: `vercel.json` · `"source": "/api/(.*)"`;
- container → server: `Dockerfile` · `CMD ["node", "dist/src/server.js"]`;
- api → handler: `api/index.ts` · `createHandler({ defer`;
- server → handler: `src/server.ts` · `createHandler(deps)`;
- handler → jobs: `src/web/app.ts` · `new LiveJobs(store, clock, budget)`;
- handler → reader: `src/web/app.ts` · `new DeadlineReader(`;
- jobs → store: `src/web/app.ts` · `new UpstashRestStore(sEnv.url, sEnv.token)`;
- jobs → memory: `src/web/app.ts` · `new MemoryStore(() => clock().getTime())`;
- reader → amd: `src/web/live-reader.ts` · `/chat/completions`;
- amd → gemma: `src/web/config.ts` · `env.MODEL_ID`;
- amd → qwen: `METRICS.md` · the run header naming Qwen3.8-27B.

**Flow:**

| Element | File · symbol |
|---|---|
| Upload | `public/app.js` · `doLiveRead` |
| Story | `src/tools/build-stories.ts` · `export async function replayStory` |
| Certificate opened | `src/pdf.ts` · `export async function openPdf` |
| Text-layer channel | `src/text-layer.ts` · `export function extractTextLayer` |
| Model reading on AMD | `src/pipeline.ts` · `export async function processCase` |
| Channels compared | `src/evaluate.ts` · `function resolveChannels` |
| Versioned config | `config/plausibility.v1.json` · `"version": "plausibility-v1"` |
| Coherence and rules | `src/evaluate.ts` · `export const RULES_VERSION` |
| Exact decimals | `src/decimal.ts` · `from "decimal.js"` |
| Proposal | `src/evaluate.ts` · `export function propose` |
| A person confirms and decides | `src/pipeline.ts` · `export function recordHumanDecision` |
| Run receipt | `src/receipt.ts` · `export function exportReceipt` |

Flow edges:
- upload → open: `src/web/app.ts` · `processCase({ ...inputBase, reader, f1 })`;
- story → open: `src/tools/build-stories.ts` · `new RecordedReader(rec)`;
- open → textlayer: `src/pipeline.ts` · `extractTextLayer(cert.pdf.pages)`;
- open → model: `src/pipeline.ts` · `readWithRetry(input.reader`;
- textlayer → channels and model → channels: `src/evaluate.ts`;
- channels → rules: `checkUnitsAndPlausibility(…)`;
- config → rules: `src/coherence.ts` · `plausibility.v1.json`;
- decimals → rules: `src/evaluate.ts` · `from "./decimal.js"`;
- rules → proposal: `propose(reasons.list, pendingConfirmation)`;
- proposal → human: `src/web/app.ts` · `parseConfirmations(body.confirmations`;
- human → receipt: `src/web/app.ts` · `exportReceipt(`.

**SVG hashes:** `architecture.svg` `23913a02cc3eeae487cf1ac40ec1b8a6975a7c27eafaf0f0e6cd34e5618ca206`, `flow.svg`
`a6eb647e6ae0d8f5527362b0f69e316b72f770ac68119276cedb110362660fd5`. The test fails if a label names vLLM,
MI300, Evolus or GPU (CH7-09).

## 4. README (S7-06, T7-07, CH7-08, CH7-10)

**Order:**
1. the opening paragraph;
2. **Try it**;
3. What runs on AMD;
4. Evaluation;
5. Comparison with Gemma;
6. **Architecture and certificate flow**;
7. **Screenshots**;
8. Problem and user, What it does, Demo procedure, Run it, Limitations, Dataset, Reason codes, Repository layout;
9. **How it was built and verified**;
10. License.

The test "the sections come in the dispatch order" pins this.

- **The access code (CH7-08):** "Try it" says *"the access code given to the judges"*. It does not use the suggested
  phrase "given in the submission": `submission` (and `enter`, `track`, `challenge`) are in the fail-closed
  `PRIZE_WORDS`. A blanket exemption is not allowed, so the phrase avoids the word, and no allow-list entry was
  added. If the auditor wants the dispatch's exact wording, an exact allow-list sentence would be needed instead.
- **The URL** appears once, in "Try it" (docs test).
- **Screenshots:** the section says plainly *"Not captured yet: they are taken from the deployed site after this
  version is deployed, never from a local build"*, and lists the planned screens (D7-01).
- **"How it was built and verified"** holds only figures from `STAGE-REGISTER.md`: the six accepted commits, the
  repair cycles, the rejections with their finding ids, and the mutation counts 14/14, 29/29, 12/12, 38/38, 13/13
  and 9/9. The test "\"How it was built and verified\" states only what the stage register records" finds each
  row's commit and "repair cycle X of Y" in the register row, and each mutation count in the register. It has no
  adjectives about quality. Claude Code is the building tool; AMD runs the product's reading.

## 5. The capture script for phase B (S7-02, L-13, CH7-01/02/03/11)

**Run:** `npx -y -p playwright@1.56.1 node tools/capture-screenshots.mjs --site https://certgate-wheat.vercel.app
--commit <deployed sha> [--live]`. It uses Chromium build 1194 (already in the host cache) and is not a package
dependency.

**Screens**, at 1280 px and 375 px:
- landing with its figures;
- judge mode;
- story cg-003, where the run stops unless the proposal starts with "Block" and a ReH row exists;
- the confirmation and decision section;
- the "Runs on AMD" panel;
- the live-reading screen;
- with `--live`, at 1280 px only, one reading of the sample cg-004 shown as queued, reading and done. Exactly one job
  POST is allowed; a second is aborted and fails the run.

**Secret handling:**
- **CH7-01:** the code is read at run time from the user-level registry. It is added only as the
  `x-live-access-code` header on the job POST, through `page.route`; the visible input is never filled. Before every
  screenshot the code input must be `value === ""`.
- **CH7-02:** no tracing, HAR, video or console capture.
- **CH7-03:** `docs/screenshots/manifest.json` records the SHA-256 of the 6 served `public/*` files before and after
  the capture, the commit, the capture time, the Playwright version and the Chromium build, plus each image's hash
  and caption.
- **CH7-11:** the visible-field rule. Inside the script, `document.body.innerText` is scanned for the code and the
  key, and a hit prints only "secret check failed on <screen>". Tesseract is not on this host, so OCR is not used.
- **Not tested yet:** the script has not been run against a site; that is phase B. The static test checks its text
  (17 checks).
- **Known risk:** if the base-URL path is generic (for example `/v1`), ordinary page text could trip the innerText
  scan and stop the run. That fails safe.

## 6. Verification

Logs are in `candidate-1/`. Heavy work ran one job at a time and was announced (4695859f).

| Check | Result |
|---|---|
| **5 cold clean clones** of `431316e`: fresh clone, `npm ci` (0 dirty files), build, then `npx vitest run` with MODEL_* unset (`clean-clone7-c1.log`) | **485/485** in each of the 5 runs (19:05:55Z … 19:07:05Z); METRICS check matches; claims **0 unmapped, 0 stale** |
| Local, at `4ef04b2` | the Stage 7 files 71/71 (the tests changed after the clean runs are only the two repository-only markings and the b4 assertion) |
| **Docker** `--no-cache` at `4ef04b2`, image `sha256:b768aeb4…`, `--network none`, 0 MODEL_*, code or store variables, run twice (`docker7-c1.log`) | **run 2: 402 passed, 83 skipped (repository-only), 0 failed.** **Run 1:** 1 failure, `a job that waits too long fails as timed out in queue …`. This is the Stage 6 timing test that the auditor recorded as O6-04 (host-load flake). Its code is unchanged since candidate 2 |
| **Previews on Linux (CH7-06)** | the test "a fresh run of tools/previews.mjs equals every committed PNG" passes inside the Debian image, so the digital renders and the scan images regenerate byte-identical there too, not only on this Windows host |
| **Stage 7 mutants** (`mutants7-c1.log`, `mutate7.mjs`, `kill7.sh`; full default suite, on `431316e`) | **15 of 15 killed**. 14 were killed on `431316e`. `b4_ui_own_file_shows_image` survived there, because the static test's slice did not detect the changed branch; `edfcd33` adds the assertion, and the mutant applied in place is killed (1 failed) |

**Mutants:**

| Mutant | What it breaks | Killed by |
|---|---|---|
| `g1_path_from_request` | the request id reaches the filesystem | traversal and unknown ids; the fixed-map source check; the by-certificate test |
| `g2_case_insensitive` | `CG-003` is served | traversal/case test; source check |
| `g3_every_dataset_id` | every dataset case is served | 200-and-bytes test; traversal (cg-020); source check |
| `g4_suffix_stripped` | `cg-003.png` is served | traversal/suffix test |
| `g5_no_nosniff` | `nosniff` is missing | 200-and-headers test |
| `g6_wrong_type` | wrong content type | 200-and-headers test |
| `b1_by_client_id` | by-certificate accepts a case id | traversal test (`by-certificate/cg-004`) |
| `b2_story_hashes_too` | a story's hash maps to a preview | by-certificate test; source check |
| `b3_ui_every_upload_a_sample` | every upload shows a dataset image | UI test |
| `b4_ui_own_file_shows_image` | an own file falls into the image branch | UI test, after `edfcd33` |
| `f1_flag_dropped` | the flag is missing on evaluate | evaluate-flag test |
| `f2_flag_appended_on_evaluate` | the flag is not next to `reading_source` | evaluate-flag test; the J-08 golden |
| `f3_flag_on_live` | a live result carries the flag | live-result test |
| `f4_wrong_date` | wrong `recorded_at` | evaluate-flag test |
| `p1_scan_rendered` | a scan rendered instead of its own page image | preview regeneration test |

**Under mutant load:** in two runs (`g1`, `b2`), a Stage 6 timing test also failed. The O6-04 class again; both
mutants were killed by Stage 7 tests anyway.

**Stage 6 carry-forward:** the queue, the limits, the code check and the store files are byte-identical to
`9759d3af`, so the Stage 6 mutant sets carry forward. Of the Stage 6 guard tests, only the two byte-identity tests
and the J-08 golden changed, and each change is only the T7-01 exception list.
