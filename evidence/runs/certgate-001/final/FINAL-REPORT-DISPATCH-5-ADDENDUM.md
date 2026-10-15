# Final report addendum — run certgate-001, dispatch 5 (Stage 7, documentation, visuals and the original certificate)

- **Author:** analyst-xwz3 (Claude Code, model `claude-opus-5-5`).
- **Room:** `3e47b667-b685-4655-8f34-cc0dad08ab30`.
- **Dispatch 5:** room msg `6f50b629-4b40-43c8-9d03-6e008b7b1f6b` (from hugo.valer), received ~18:30Z on 2026-10-14. The verbatim copy is `evidence/runs/certgate-001/DISPATCH-5.txt`.
- **Shape:** the same as `FINAL-REPORT-DISPATCH-2.md` and the dispatch 3 and 4 addenda.

This is internal band acceptance only; there has been no external evaluation. The band did not deploy, push or submit. The human pushed and deployed.

Times are UTC. Times on 2026-10-15 come from machine records: script ISO times, GET /usage `read_at` values or commit times. Some of the analyst's log lines between 05:07Z and 05:12Z carried estimated times; they are corrected in the log (commit c713242).

## 0. Carried from Stage 6

- **Stage 6 final:** `9759d3af0b23e532f71cf0072112b4d5dce6c612`, ACCEPTED (auditor `50d46663`, record eedb56a).
- **C1 remedy:** the human rotated `LIVE_ACCESS_CODE` after Stage 6. The auditor confirmed it with an equality check only (msg 19e28c01).
- **Dispatch 4 addendum:** verified at 1f9cfc56 (auditor msg 493d4f9c).
- **O6-04** (a cold-run timing test failing under memory pressure) is **resolved** by the F7-01 test repair below.

## 1. Outcome

| Stage 7 | Candidate | Tree | Auditor verdict | Repair cycles | Checkpoint |
|---|---|---|---|---|---|
| Phase A (product, local) | `dc228d10636cc3cf7b12f3b1226e88027cce12b2` | `cf0dcba0` | ACCEPTED locally, record d1aaa3e (dffd6330…91d9) | 1 of 3 | `9e9c24e2` |
| Phase A (deployed) | the same, served from GitHub main `d1aaa3e` | — | Deployment confirmed by GETs, record e2b80b8 | — | `f186deca` |
| **Phase B / final** | **`cf97dfadec83c4603b538adca081f9966de4830e`** (docs, tools, one test on top of dc228d10) | `1eb191fd` | **ACCEPTED**, record `stage-7/auditor/VERDICT-S7-FINAL.md` (commit 2aa14ed, baa2fca3…f089) | 1 of 3 | `57325c3a` |

**Rejected candidate (preserved):** `4ef04b272e0766caaf34b934e28230bf60a52f8c` (tree 7ce51055), REJECTED locally (record ed05391).
- The only finding was **F7-01**: a flaky Stage 6 queue-timeout test that used real-time budgets. It occurred independently 5 times.
- Every Stage 7 check on that candidate passed:
  - adversary 19/19 mutants, P7 8/8, P1–P15 15/15;
  - auditor 12/12.
- **Repair 1 (tests only):**
  - The test now runs on an injected clock.
  - The W-03 waits are bounded at 30 s.
  - A second real-time race was found (a busy test answering 202 vs 429) and fixed in the same cycle.

## 2. What Stage 7 built

**Phase A (product, deployed):**
- **S7-04, "View the original certificate".**
  - `GET /api/originals/<id>` serves a PNG preview only for 6 allow-listed case ids; no request path reaches the filesystem.
  - The preview appears on every story and on a live sample result.
  - For a non-sample upload, the page says the original is the user's own file.
- **S7-05:** recorded story JSON carries `recorded: true` with its date, both in the file and from the evaluate route. A live result never carries it.
- **S7-03, previews.** PNG previews of the 3 stories and the 3 samples come from a committed script and regenerate byte-identically; their SHA-256 values are in the README.
- **S7-01, diagrams.** The architecture and flow diagrams are Mermaid blocks in the README, with exports under `docs/diagrams/` from `tools/diagrams.mjs`. Each node and edge has a CLAIMS row.
- **S7-06, README.** The README is restructured for a judge in the dispatch's order. "Try it" never contains the code.
- **S7-07:** the reading path, prompt, rules, queue and limits, data, config, evaluation, figures, METRICS, `vercel.json` and the packages are unchanged since 9759d3af (verified by diff).

**Phase B (docs and tools, candidate 3):**
- **S7-02, screenshots.** 14 images under `docs/screenshots/`, all from one capture run of the deployed site (site commit d1aaa3e, captured_at 2026-10-15T05:15:09.161Z):
  - at 1280 and 375 px: landing, judge mode, story cg-003, its confirmation and decision section, "Runs on AMD", and the live screen;
  - at 1280 px only: live "reading" and live "failed".

  `manifest.json` holds the SHA-256 of the 6 files served during the run, of each image and of each caption.
- **Capture script, `tools/capture-screenshots.mjs`:**
  - It runs Playwright through a pinned `npx -p playwright@<exact>`, not as a dependency.
  - It loads each screen in a fresh document, to work around F7-02.
  - For the live job it records the job id, a state timeline and the failure class. It records no header value and never the code.
- **README:**
  - a screenshot section that states both live failures (O7-01);
  - the F7-02 limitation line;
  - the Stage 5 independent auditor run in "How it was built and verified" (auditor note 9c4e1277).
- **Claims:** C-91 reworded, C-92 added (F7-02), and C-64 cites the Stage 5 run. 0 unmapped, 0 stale.

## 3. Verification (local)

| Candidate | Suite | Docker `--network none` | Mutants / checks | Secrets |
|---|---|---|---|---|
| `4ef04b27` (1) | F7-01 flaky (auditor clean run 3 of 5) | implementer run 1 hit F7-01 | adversary 19/19, auditor 12/12 | 0 |
| `dc228d10` (2) | 5 consecutive cold runs, 485/485 | 402 passed + 83 skipped; previews `--check` passed in the image | auditor 13/13 including q_timeout_never; adversary 19/19 carried | rotated code and its SHA-256: 0 hits in 1529 files + 1675 blobs |
| `cf97dfad` (3) | 3 runs, 486/486 | — (no product change) | adversary check-c3 10/10; auditor T7-05 passed; previews, diagrams and METRICS checks pass; 54/54 README relative links resolve | 0 hits for the code, its SHA-256, the key and the base-URL path in the 14 PNGs, the manifest and the README. No PNG text chunks |

**Visual rule for the images:** there is no OCR tool on this host. The auditor and the adversary each viewed the live screens:
- the access-code field is empty in each (CH7-01);
- "Runs on AMD" shows the endpoint host only (CH7-11).

## 4. Live checks on https://certgate-wheat.vercel.app

**S7-09 (auditor, 2026-10-15 05:01:36Z, GETs only, on main d1aaa3e):**
- 8/8 served files equal dc228d10.
- `/api/originals` answers 200 `image/png` with nosniff for 6/6 allow-listed ids, and the bytes equal the committed previews.
- 17 bad ids and paths are refused.
- by-certificate answers 200 only for the 3 sample hashes.
- The recorded flag is live.
- Every README link resolves.

The human's own checks agree (operator report, relayed in room msg 11977ecb). cf97dfad changes no served file.

**O7-01: both Stage 7 live readings failed at AMD Token Factory** (endpoint observation, not a product finding). Both were sample cg-004 through the site's job API, by the capture seat, under announced leases.

| Attempt | Machine times | Result | GET /usage |
|---|---|---|---|
| 1 | between the /usage reads at 05:07:34.574Z and 05:09:29.106Z | admitted, shown "reading", then "Live reading failed"; class not recorded (the script stopped before reading it) | all-time requests 176→179, 0 tokens |
| 2 | job `2ce1c257…`, reading at 05:15:19.113Z, failed at 05:15:40.956Z | **endpoint_5xx** ("the model endpoint failed or could not be reached") | 179→182, 0 tokens |

- Two consecutive /usage reads (05:12:59Z, 05:13:03Z) both showed 179, so /usage does not count itself. Each attempt was therefore 3 chat calls, the calling discipline's maximum, with 0 tokens.
- GET /models and GET /usage answered, and Gemma-4-31B-IT was listed.
- The site behaved as specified: it said the reading failed and showed nothing stored instead (I7).
- The live path is byte-identical to the Stage 6 candidate. The **last verified live reading** is the auditor's Stage 6 check, 2026-10-14 18:01Z, done in 27 s.
- The README states all of this, and that the queued and done screens are not shown.
- **Still open until the human pushes:** the auditor checks that the README's new screenshot links answer 200 on GitHub.

## 5. Interventions, infrastructure, limitations

**Operator inputs in the analyst's window, each relayed to the room:**
- "continuemos" after the overnight pause;
- the push and deployment report (room msg 11977ecb).

**D7-02 readings:**
- The plan was 1 for capture plus 1 reserved for the auditor.
- After the first attempt failed, the analyst moved the auditor's reserved reading to the capture seat (msg 97fa8081); the auditor agreed (4c44a223).
- Total readings: 2 of 2, no more. The auditor made no endpoint call in Stage 7.

**Infrastructure:** the host stopped the implementer's re-run on dc228d10 (~19:38Z on 2026-10-14, memory). Ruling (b): the auditor's slot covered it. Heavy work stayed serialized (D7-04).

**Analyst errors:**
- The analyst stamped several log lines and messages with estimated times ahead of the real clock (05:13Z–05:31Z for events at 05:07Z–05:12Z). This was corrected in the log and the room (msg 16998773). The machine-time rule was then imposed on captions, the README and this addendum.

**Product limitation, F7-02 (= O7-ADV-01):**
- Fast hash-only navigation can let an earlier screen's slow render overwrite the current screen, because `route()` in `public/app.js` does not check that its hash is still current.
- A reload recovers, and stored data is never shown as live (I7).
- Judged not blocking by all three reviewing seats and documented in the README.
- Not repaired, so that the deployed product stays stable for the video.

**Observations:**
- O7-01: endpoint 5xx (§4).
- O6-04: resolved.
- Optional auditor note 9c4e1277: done in candidate 3.

## 6. Time, usage, final commit and push

| | Start (UTC) | Accepted (UTC) | Wall clock | Limit |
|---|---|---|---|---|
| Stage 7 | ~18:31Z, 2026-10-14 (dispatch 5) | 05:22:45Z, 2026-10-15 (final verdict commit 2aa14ed) | ~651 min elapsed, including an overnight pause from ~20:00Z to ~05:00Z | 240 min: **exceeded** |

- The budget was exceeded across the overnight pause. The run resumed on the human's "continuemos".
- The **stage hard stop 2026-10-16T06:00Z was met**. The overall hard stop 2026-10-17T18:00Z is unaffected.
- **Repair cycles:** 1 of 3.
- **Infrastructure retries:** 1 (the implementer's run stopped by the host).
- **Endpoint usage in Stage 7 (Token Factory, free credits):**
  - 2 readings, both failed, 6 chat calls in total;
  - 0 tokens; the daily cost was unchanged;
  - 6 GET /usage reads, by the implementer;
  - no endpoint calls in phase A or by the auditor.
- **Seat usage (Claude):** `final/band-usage-agents-dispatch5.txt`.
  - The figures are cumulative since each seat was created, and the meter lags (last activity shown ~19:4xZ on 2026-10-14).
  - They are list-price estimates, not a bill.

| Seat | Tokens | Estimate |
|---|---|---|
| implementer-xwz4 | 926,956,954 | $240.60 |
| auditor-xwz6 | 807,566,972 | $194.06 |
| analyst-xwz3 | 769,439,707 | $179.02 |
| adversary-xwz5 | 745,408,733 | $178.59 |

**Deployed:** https://certgate-wheat.vercel.app serves main **d1aaa3e**, which contains product candidate dc228d10. Candidate 3 changes no served file.

**Push request:**
- The human pushes the head named in the room message that posts this addendum. It contains cf97dfad, the auditor's final record 2aa14ed and this addendum, and is a fast-forward from d1aaa3e.
- After the push, the auditor runs the open GitHub screenshot-link check.
- The served product does not change; Vercel may redeploy the same files.

**For the human before submitting on Friday 2026-10-16:**
1. **Push** the named head.
2. **Live reading:** at 05:15Z on 2026-10-15, AMD Token Factory returned 5xx for Gemma-4-31B-IT (O7-01).
   - Before recording, try one live reading on the site yourself.
   - If it still fails, the choice is yours: wait, or switch `MODEL_ID` as DEPLOY.md describes (set it to `Qwen3.8-27B` in Vercel and redeploy; no code change).
   - The site fails honestly and never shows a stored result as live.
3. **While recording:** let each screen finish loading before clicking on (F7-02); a reload recovers.
4. **Video:** MP4 on YouTube, unlisted, 5 minutes or less, under 300 MB.
5. **Slides:** PDF. The diagram exports in `docs/diagrams/` and the screenshots in `docs/screenshots/` can be used.
6. **Cover:** 16:9.
7. **lablab form:**
   - title at most 50 characters;
   - short description at most 255 characters;
   - long description at least 100 words;
   - the access code in **Additional Information**, and only there: never in the repository, the README or the room.
8. **Export the room.**

CertGate makes no claim of winning, entering or qualifying for any prize. Nothing has been submitted by the band.
