# Obligation register — Stage 7 (documentation, visuals and the original certificate)

Run: certgate-001 · Stage: 7 · Register version: **R7.1** (analyst-xwz3, 2026-10-14; R7.0 = commit 21b4b02; R7.1 accepts adversary challenge msg 10d6e7f5, CH7-01…CH7-12, supported by the auditor in f2cebca9, and rules on the implementer's questions in 11df15bb).

- **Dispatch 5:** room msg `6f50b629-4b40-43c8-9d03-6e008b7b1f6b` from hugo.valer, received ~18:30Z. Verbatim copy: `evidence/runs/certgate-001/DISPATCH-5.txt`.
- Dispatches 1–4 remain in force except where dispatch 5 changes them.

**Input revision:** `2e472e77ad6b70da49324bebafdf0f955755b433`, GitHub `main` pushed by the human (analyst `ls-remote` at 18:29Z). It contains the Stage 6 accepted candidate `9759d3af0b23e532f71cf0072112b4d5dce6c612` (auditor 50d46663, record eedb56a; addendum verified 493d4f9c). The deployed site serves that product.

**Sources:** `stage-7/SOURCES.sha256`, unchanged since Stage 6.

**Limits (dispatch 5):**
- Stage 7 runs ~18:31Z → ~22:31Z (240 min), including final verification. The addendum reserve is 30 min, so **no new work after ~22:00Z**.
- At most **3 repair cycles**; 2 infrastructure retries per command.
- **Stage hard stop: 2026-10-16T06:00:00Z.** If Stage 7 is not accepted by then, the band reports where it stands and the human keeps the Stage 6 product.
- Overall hard stop: 2026-10-17T18:00:00Z.

## Obligations

| ID | Source | Obligation | Owner |
|---|---|---|---|
| S7-01 | D5: diagrams | **Two Mermaid diagrams in the README**, with committed SVG or PNG exports under `docs/diagrams/` that a committed script regenerates. **Architecture:** browser; the Vercel static site and the `api` function; the live-reading queue in the Upstash store; AMD Token Factory, with the deployed live model Gemma-4-31B-IT and the evaluated product model Qwen3.8-27B; the container as the other way to run it. **Flow:** upload or story → model reading on AMD → text-layer channel (when present) → coherence and versioned rules in exact decimals → proposal → a person confirms and decides → receipt. **Every box and arrow maps to existing code** and has a claims-table row naming the file and symbol | implementer |
| S7-02 | D5: screenshots | **Real screenshots under `docs/screenshots/`,** captured by a committed Playwright script **from the deployed site** at 1280 px and 375 px. They show: the landing with its figures; judge mode; story cg-003 with the ReH row and the Block proposal; the confirmation and decision section; the "Runs on AMD" panel; the live-reading screen. **Each caption names the deployed site commit and the capture time.** Live reading may be captured as queued, reading and done from **one real reading**, with the code read at run time from the host's user-level variable. **No secret may appear in any image, log or evidence: not the code, the key, the base URL, nor any property of the code (length included).** The method for checking the images (OCR or a visible-field rule) is named and applied | implementer; auditor checks |
| S7-03 | D5: previews | **PNG previews** of the certificates of the three stories and of the sample certificates. A committed script generates them from the committed PDFs: the PDF's own page image for scans, a render for digital ones. Each has its SHA-256 and is linked from the README next to its PDF. They regenerate **byte-identical** | implementer |
| S7-04 | D5: web app | **"View the original certificate"** on every story, and on the live-reading result for a sample certificate. It shows the image of the document the reading came from, beside the values. The files are served **only from an allow-list of dataset case ids**: no path from the request reaches the filesystem. The files are included in the Vercel function or in `public/` as needed. **Tests** cover allowed ids, traversal and unknown ids; **mutants** cover the guard. For an uploaded certificate that is not a sample, the page says plainly that the original is the user's own file | implementer |
| S7-05 | D5: recorded clarity | **The JSON of a recorded story** carries a field such as `"recorded": true`, with its recording date, next to `reading_source`, so it cannot be taken for a live call. **UI labels are unchanged.** I7 holds | implementer |
| S7-06 | D5: README | **The README is restructured for a judge, in this order:**<br>1. one paragraph on what CertGate is and who it is for;<br>2. **Try it:** the URL, judge mode, the note that live reading needs the access code given in the submission (never the code itself), and the sample certificates;<br>3. **What runs on AMD**;<br>4. results with denominators (the Qwen runs and the Gemma comparison, from METRICS.md);<br>5. the two diagrams;<br>6. screenshots;<br>7. the existing run, deploy and limitations sections;<br>8. a short **"How it was built and verified"** section, with facts from the registers and the final reports only: the four seats and their roles, stages and repair cycles, rejections and their causes in one line each, mutation counts, the independent auditor runs. Claude Code is the building tool; AMD runs the product's reading.<br>**No prize claim.** E-11 (fail-closed claims) and the prize check E-17…E-19 apply | implementer |
| S7-07 | D5: unchanged | **Byte-identical to 9759d3af**, checked by the auditor by diff: the reading path, the frozen prompt, the rules, the queue and its limits (`src/web/live-jobs.ts`, `live-store.ts`, `deadline-reader.ts`, `limits.ts`, and the job and limit code in `app.ts`), `data/` (except new preview files if placed there), `config/`, `evaluation/`, `public/figures.json`, `public/stories/` (except the S7-05 field, if it is served from the story JSON), and the evaluation figures in METRICS.md. **Stage 6 behaviour on the deployed site stays as accepted.** Any hunk in `app.ts` outside the new route and the S7-05 field is listed with its reason | implementer; auditor |
| S7-08 | D5 Acceptance | **Auditor, locally:**<br>- the full suite from a clean clone and in Docker with no network;<br>- the mutants, including the new route guard;<br>- the S7-07 diff;<br>- each diagram element mapped to code;<br>- the screenshots are real captures of the named commit and show no secret;<br>- the previews regenerate byte-identical;<br>- claims 0 unmapped and 0 stale | auditor |
| S7-09 | D5 Acceptance | **Auditor, live, once the human reports the deployment:**<br>- "View the original certificate" works for the three stories and one sample;<br>- unknown ids and traversal are refused;<br>- every asset the README links answers 200;<br>- the screenshots match the deployed commit | auditor |
| S7-10 | D5 Final report | **Addendum** in the same shape, with the push request and an explicit list for the human before submitting on **Friday 2026-10-16**:<br>- the video MP4 on YouTube (unlisted, at most 5 min, under 300 MB);<br>- the slides PDF;<br>- the 16:9 cover;<br>- the lablab form (title ≤ 50 characters, short description ≤ 255, long description ≥ 100 words, the access code in Additional Information);<br>- exporting the room.<br>The band never deploys, pushes or submits | analyst |

## Decisions

| ID | Decision |
|---|---|
| D7-01 | **Two phases, because the screenshots must show the deployed commit.** **Phase A:** candidate 1 carries the code (S7-04, S7-05), the diagrams, the previews, the README structure and the capture script, with the screenshot slots described. After local acceptance, the human pushes and Vercel redeploys. **Phase B:** the script captures the screenshots from the deployed site, which now shows "View the original certificate". They are committed in a **docs-only** candidate 2, captioned with the deployed commit. The auditor checks them against the site (S7-09), then the final push. If time runs short, phase B may be cut. The band then reports the screenshots as **not done**, never as captured from a local build |
| D7-02 | **Endpoint lease:** at most **2 real readings** in Stage 7. **1** is for the live-reading screenshots in phase B (the capture seat), through the deployed site, with the code read at run time from the user-level registry. **1** is reserved for the auditor, only if its checks need it (T7 calling discipline). Each needs an announced and released lease. The S7-09 checks themselves need no reading |
| D7-03 | **Never write any property of a secret** (value, length, character class, hash prefix) in the room, the repository, logs or evidence. This is the lesson of the Stage 6 C1 incident |
| D7-04 | Heavy local work stays **serialized** across seats while host memory is low. Announce START and DONE |

## Auditor pass/fail rules (msg cbe79978), adopted as written

| ID | Rule |
|---|---|
| T7-01 | **Unchanged.** `git diff 9759d3af <cand>` is empty on all of the following:<br>- the reading path, `live-reader.ts` and the prompt;<br>- `live-jobs.ts`, `live-store.ts`, `deadline-reader.ts`, `limits.ts`;<br>- `data/`, `config/`, `evaluation/`, `public/figures.json` and METRICS;<br>- `public/stories/`, unless a story JSON gains only the T7-04 field;<br>- `vercel.json`, unless `includeFiles` gains only the previews.<br>Hunks in `src/web/app.ts` may touch only the new route and the T7-04 field |
| T7-02 | **Route guard.** Bytes are served only for the allow-listed ids (cg-001, cg-002, cg-003 and the samples), and they equal the committed preview or PDF. Traversal (`..`, `%2e%2e`, `%2f`, backslash, absolute path), unknown ids, case variants and extra suffixes all answer 404, and no request path reaches `readFileSync`. **Live:** the 3 stories and 1 sample answer 200 with matching SHA-256; traversal and unknown ids answer 404 |
| T7-03 | **Previews regenerate.** A clean clone run of the committed script reproduces every PNG byte for byte, and each SHA-256 equals both the committed file and the hash listed in the README. Scans use the PDF's embedded page image; digital certificates use a pinned renderer |
| T7-04 | **Recorded flag.** Every recorded story response, both the JSON file and the evaluate route, carries `recorded: true` and its date next to `reading_source`. A live result never carries it. Tests and mutants cover both |
| T7-05 | **Screenshots.** Each caption names the site commit and the capture time, and that commit equals the deployed `main`. The capture script is committed. **Secret check:** OCR with tesseract if present, otherwise a visible-field rule (the code input is empty or masked in every capture). The script logs and the evidence are scanned for the code value and its SHA-256. A live capture spends at most 1 reading, under an announced lease |
| T7-06 | **Diagrams.** Every Mermaid node and edge maps to a CLAIMS row and to existing code (file and symbol). The SVG or PNG exports match the Mermaid source, through a committed script or a test. Claims show 0 unmapped and 0 stale |
| T7-07 | **README.** Every figure equals METRICS.md. Every linked asset answers 200, locally and live. "How it was built and verified" contains only facts found in the registers and reports. The prize check E-17…E-19 still passes |
| T7-08 | **Local acceptance.** 5 cold clean-clone runs. Docker `--network none`, if memory allows. The auditor's mutants on the guard and the flag, plus the Stage 6 carry-forward for unmoved code. The live checks follow the human's deployment report |

## R7.1 amendments

| ID | Ruling |
|---|---|
| L-ALL | **CH7-01…CH7-12 are accepted as written** (verbatim appendix below) and bind candidate 1 and phase B. In particular:<br>- the code input is **empty** (`value === ""`) in every capture, and the code is set by route interception or cleared before capture;<br>- no trace, HAR or video is recorded;<br>- a manifest of the served files' SHA-256 proves which commit was captured;<br>- the live-result original is chosen by the **upload's SHA-256**, never by a client id;<br>- the route serves only the preview and the PDF for allow-listed ids;<br>- previews regenerate deterministically, with no `tIME`, `tEXt` or `iTXt` chunks;<br>- the recorded flag appears everywhere a recording is served and never on a live result;<br>- the README names the event only through exact, auditor-reviewed allow-list sentences, or without prize-family words;<br>- diagram nodes are claims units, with a killer for an invented node;<br>- every count in "How it was built and verified" cites its record;<br>- every page text scan is done inside the script, never printing secrets |
| L-13 | **Playwright is not a dependency (implementer question, 11df15bb). Approved.** The capture script runs as `npx -y -p playwright@<exact pinned version> node tools/capture-screenshots.mjs`. The pinned version and the Chromium build are named in the script and in the handoff. `package.json`, the lockfile and the Docker image are unchanged. The capture needs network, which is outside the offline suite; that is recorded as a limitation. A test still greps the script for forbidden tracing, HAR and video options (CH7-02) |
| L-14 | **Diagrams from one committed JS definition (`tools/diagrams.mjs`), approved.** It generates both the README Mermaid block and `docs/diagrams/*.svg`, with no new dependency. A test checks that both equal the generator's output. The SVG is the band's own rendering of the same graph, not Mermaid's renderer, and the README says so |
| L-15 | **Operator: access code rotated** (relayed by the implementer in 11df15bb, said in the implementer's window at ~18:42Z). LIVE_ACCESS_CODE was rotated in Vercel and in the host's user-level environment, and the site was redeployed. This closes the Stage 6 C1 remedy. It is read from the user-level registry at run time and never printed, nor any property of it (D7-03) |

### Appendix: adversary challenge msg 10d6e7f5, verbatim

@hugo.valer/analyst-xwz3 @hugo.valer/implementer-xwz4 @hugo.valer/auditor-xwz6 ADVERSARY CHALLENGE to Stage 7 register R7.0 (commit 21b4b02), checked against dispatch 5. These are gaps where every row could pass while the product or evidence is wrong. I issue no verdict.

**CH7-01 [S7-02, T7-05, D7-03]: a masked field leaks the code's length.** A password input shows one dot per character. Any screenshot taken while the code field is filled writes the code's length into an image, which is the C1 class D7-03 forbids.
- Rule: capture the live screen only after the field is cleared, or never type into the visible field at all. For example, the capture script can set the header through Playwright route interception rather than the form.
- Killer: the visible-field check asserts that the code input is **empty** (`value === ""`) in every capture, not merely "masked".
- The same applies to the 375 px captures.

**CH7-02 [S7-02, T7-05]: no Playwright side artefacts.** No trace, HAR, video or console capture of request headers may be kept. The code travels in `x-live-access-code`, and a HAR or trace stores it verbatim.
- The script disables all of them explicitly, and a test greps the script for `tracing.start`, `recordHar` and `recordVideo`.
- The evidence scan covers the Playwright output directory too.

**CH7-03 [S7-02, T7-05]: proving "captured from the named commit".** The site does not expose its commit, and `/health` must stay as accepted.
- Proof: at capture time the script fetches the served `public/*` files and records their SHA-256 in a manifest next to the images. They must equal the committed files at the named commit.
- A caption alone is not evidence.

**CH7-04 [S7-04]: the live-result original is chosen by bytes, not by a client id.**
- "View the original certificate" on a live result for a sample must map from the **SHA-256 of the uploaded bytes** to the sample's id, through the existing `datasetCertificateHashes`. It must never take a case id from the client, or a client could pair any reading with any dataset image.
- A non-sample upload shows the "your own file" text and requests nothing from the server.
- Killer: a live job on an upload that is byte-different from every sample never offers a dataset preview.

**CH7-05 [S7-04, T7-02]: what the route may serve.**
- Only the preview PNG and the PDF for allow-listed ids. Never `case.json`, `data/expected/*`, `evaluation/*` or a dataset case outside the allow-list.
- Killers: `cg-020`, a real dataset id that is not allow-listed, gives 404; `case.json` under an allowed id gives 404.
- Headers: `Content-Type` exact, `X-Content-Type-Options: nosniff`.
- Bundle reachability: if the files go through `includeFiles`, `node_modules/pdfjs-dist` must stay in it (E-15/G-1 mutant). My `bundle-sim.mjs` shows a story preview and a sample preview answering 200 from a Vercel-shaped bundle.

**CH7-06 [S7-03, T7-03]: byte-identical previews need a pinned platform.**
- Scans: embedded page image bytes, re-encoded deterministically or copied.
- Digital renders depend on fonts, canvas and zlib. Name the renderer version and the environment that regenerates them (the Docker image is best), and run the T7-03 check there.
- PNGs must carry no time, text or software chunks (`tIME`, `tEXt`, `iTXt`), so that the hash is stable.

**CH7-07 [S7-05, T7-04]: the recorded flag everywhere a recording is served.**
- It belongs on the story list, the story view and evaluate, and the story JSON files.
- It must **not** be on a live job result.
- Mutants: the flag dropped from evaluate; the flag added to a live result.
- The J-08 disabled-site golden changes only by the new field and the new route, and that change is listed.

**CH7-08 [S7-06, T7-07]: the prize check vs a judge-facing README.**
- `PRIZE_WORDS` includes `hackathon`, `track`, `challenge` and `compet\w*`. A README that names the event ("AMD Developer Hackathon: ACT III, track Intelligent Industry") will fail the fail-closed check.
- Rule: phrase without those words, or add **exact** allow-list sentences reviewed by the auditor, as E-17 does. Never a blanket exemption, and never a weakened check.
- Killer: the existing allow-list stale test still passes.

**CH7-09 [S7-01, T7-06]: diagram nodes as claims.**
- Each Mermaid node and edge label is a text unit for the claims map.
- Killer: a mutant that adds a node naming a component that does not exist (for example "vLLM on MI300X" or "Evolus") must fail a test, not only a review.
- The export check (Mermaid source to SVG or PNG) is a committed script whose output hash is pinned.

**CH7-10 [S7-06]: "How it was built and verified" counts.**
- Each number (stages, repair cycles, rejections, mutation counts, auditor runs) cites its record: a commit or a file path.
- A test checks at least the counts that are in committed evidence. The prose must not round or aggregate them into claims the records do not state.
- No adjectives about quality.

**CH7-11 [S7-02, D7-02]: screenshot content.**
- The "Runs on AMD" and receipt captures may show the endpoint **host**. They must not show the base-URL path, the key or any header value.
- If tesseract is not on this host, apply the visible-field rule to every text element in the page DOM at capture time: scan `document.body.innerText` for the secret values, inside the script, never printing them.

**CH7-12 [S7-07, T7-01]: unchanged code.**
- `app.ts` hunks only for the route and the flag.
- The Stage 6 mutants on unmoved code carry forward.
- My P1–P15 re-run on candidate 1 shows Stage 6 behaviour intact.

I will build the Stage 7 mutants (route guard, flag, sample mapping, previews, diagram node) on candidate 1 and re-run P1–P15. No endpoint calls unless granted.
