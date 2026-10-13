# Stage 3 candidate 4 (repair cycle 3 of 5): implementer handoff record

From: implementer-xwz4 · To: analyst-xwz3, adversary-xwz5, auditor-xwz6 · Run certgate-001 · Stage 3
Repair task: analyst msgs 86dcafba (part 1) … d4bbf9d0 (part 13). Finding ADV-S3-F02: adversary msg 540fb415 (report
`MUTATION-a892f77.md`, SHA-256 160cfb46…3fe7). Register R3.3 (SHA-256 `52dbd3c0…9788`); R2.2 and R1.6 still in force.
This record states what was done; it is not an acceptance. No push. No endpoint calls.

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `5c904693423574846e17994331a628cc06d735ef` |
| Tree | `1ed386fd25d993f1d37b823eadddfa7040b19dae` |
| Input revision (preserved, not rewritten) | candidate 3 `a892f771e531ca76b621b5a03163b2d3cb4f02d6` (+ evidence `108ed05`) |
| **Diff vs a892f771, excluding evidence** | `test/labels.test.ts` +13 · `test/story-screen-render.test.ts` +92 (new). **Test-only**: `src/` and `public/` byte-identical to a892f771 (`git diff --stat a892f77 5c90469 -- src public` is empty), as are tools, config, data, package files and Dockerfile. File: `repair-3/diff-vs-a892f77.txt` |

## ADV-S3-F02: S2M02br survived (story-screen label could lose "· not live")

| | |
|---|---|
| Cause | The S3-26 check in `test/labels.test.ts` matched `/storedDetail: storyLabelDetail\(s\)/` with no right anchor. A suffix cut such as `.slice(0, -10)` still matched |
| Repair, part 1: rendered labels | `test/story-screen-render.test.ts` runs the real `public/labels.js` and `public/app.js` in a Node vm with a minimal DOM stand-in (no new dependency); fetch serves the committed static files. For cg-001, cg-002 and cg-003 the **rendered story-screen label** (`[data-stored-label]`) starts "Recorded reading", contains "recorded <recorded_at>" and **ends with " · not live"**. After clicking "Open the receipt", the **rendered receipt-screen label** also ends with " · not live". The rendered cg-003 label equals `"Recorded reading · " + storyLabelDetail(story)` exactly |
| Repair, part 2: call-site anchor | `test/labels.test.ts`: every `storyLabelDetail(…)` and `localLabelDetail(…)` call in app.js, outside the import line (3 calls: story screen L351, receipt link L370, local case L378), must be exactly `storyLabelDetail(s)` / `localLabelDetail(view)`, followed directly by `,` `}` or `)`. Nothing may be cut from or appended to the label |
| Kill check, throwaway branches in a scratch clone, never merged | **S2M02br as given** (story screen, `storyLabelDetail(s).slice(0, -10)` at L351): full suite **5 failed / 280 passed**, all 5 failures in the new tests (`repair-3/mutant-S2M02br-story.log`). **The same cut on the receipt label** (L370), as the adversary suggested: **4 failed / 281 passed** (`repair-3/mutant-S2M02br-receipt.log`) |

## Verification (logs in `repair-3/`)

- `clean-clone-tests.log`: clean checkout of 5c90469, `npm ci` from the unchanged lockfile, build, `npx vitest run` twice with MODEL_* unset: **285/285** both times (280 + 5 new).
- **Not run for this candidate:** Docker `--network none` and the browser checks. The analyst's host-memory blocker (msg 0e46d1f5) forbids heavy local work. Since a892f771 only test files changed. Candidate 3 passed in Docker 280/280 (`repair-2/docker-network-none.log`); candidate 2 passed the browser checks 15/0, with `public/` unchanged since.

The earlier records still hold for everything else: evaluation, F3-01, O3-01, ADV-S3-F01 and stories. Any real run
on a892f771 remains valid for the product of 5c90469.

Time: repair 3 received 19:4xZ; candidate 4 frozen 19:54Z.
