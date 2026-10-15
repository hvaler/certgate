# Auditor final verdict, Stage 7 (documentation, visuals and the original certificate): ACCEPTED

**Accepted candidate:** `cf97dfadec83c4603b538adca081f9966de4830e`, tree `1eb191fd1b7d73f8b8c42c371d29ad21d1345340`.
- It holds the docs, the tools and one test, on top of the product candidate `dc228d10`, which was locally accepted
  (record d1aaa3e) and is deployed from GitHub `main` `d1aaa3e`.
- Register R7.1. Repair cycles used: 1 of 3.
- Implementer handoff: msg 2dbdd04f, record ff0a02c. Adversary check: msg 86ee368b (10/10).

**Result: Stage 7 is ACCEPTED on cf97dfad.**
- **One check stays open until the human pushes cf97dfad:** that the README's new screenshot links answer 200 on
  GitHub. I run it with `git ls-remote` and the link script right after the push, as for S4-07.
- **Live reading on the deployed site failed twice today at the endpoint** (O7-01, below). The product is unchanged
  since Stage 6, and the band's last verified live reading is the auditor's Stage 6 check (2026-10-14 18:01Z,
  done in 27 s).

## Lineage

| Candidate | Commit | Verdict |
|---|---|---|
| 1 | `4ef04b27` | REJECTED (ed05391): F7-01, a flaky Stage 6 guard test. Every Stage 7 check passed |
| 2 | `dc228d10` | Phase A locally ACCEPTED (d1aaa3e). Pushed as main `d1aaa3e` and deployed |
| 3 | `cf97dfad` | **ACCEPTED** (this record): phase B screenshots, README, claims, the capture script and one test |

## Phase B checks on candidate 3

| Check | Result |
|---|---|
| Scope (`candidate-3/t705-check.log`) | 20 files outside evidence: 14 PNGs, `manifest.json`, README, CLAIMS, `claims-map.json`, `tools/capture-screenshots.mjs`, `test/stage7.test.ts`. **No product file.** No package change. No HAR, trace, video or zip anywhere in the tree |
| T7-05: commit identity | `manifest.json` names `site_commit` **d1aaa3e**, which is the deployed `main`. The SHA-256 of the 6 files served during the capture **equals** `public/*` at d1aaa3e. Every README caption names d1aaa3e and a machine time (captured_at 2026-10-15T05:15:09.161Z) |
| T7-05: secrets | The rotated code was read from the user-level registry in-process and never printed. The code value, its SHA-256, the key and the base-URL path have **0 hits** in all 14 PNG byte streams, the manifest and the README screenshot section. The PNGs carry **no tEXt, iTXt or zTXt chunks** |
| T7-05: visual rule (no tesseract on this host) | I viewed `live-reading-1280`, `live-failed-1280` and `live-375`: the **"Access code for live reading" field is empty** in each (CH7-01). `amd-1280` shows the endpoint **host only** (`developer.amd.com.cn`), with no URL path, no key and no header value (CH7-11) |
| I7 on the live screens | `live-failed-1280` reads "Live reading failed: the model endpoint failed or could not be reached. Nothing stored is shown instead.", with Retry. No done screen is shown or implied, and no stored result stands in for one |
| README wording (option b) | It quotes both failures with machine times, the class `endpoint_5xx`, and that the queued and done screens are not shown. It names the last verified live reading. It adds the F7-02 limitation line, and the Stage 5 independent auditor run |
| Suite (`candidate-3/suite.log`) | 3 runs: **486/486** each. METRICS check matches. `previews --check` and `diagrams --check` pass. **Claims: 0 unmapped, 0 stale.** All 54 README relative links resolve in the candidate tree |
| Capture script (tools) | Each screen loads in a fresh document (the F7-02 workaround). Job id, state timeline and failure class come from a read-only poll. No header value or code is recorded. The no-HAR/trace/video, empty-input and `innerText` rules are kept, and the CH7-02 static test passes |

## Carried forward

- **Phase A, candidate 2 (d1aaa3e):**
  - T7-01: the reading path, the prompt, the queue and limits, figures, METRICS, `vercel.json` and the packages are
    unchanged since 9759d3af;
  - the T7-02 guard, T7-03 previews, the T7-04 flag and T7-06 diagrams;
  - 5/5 cold runs; Docker with previews in the image; my 13/13 mutants and the adversary's 19/19.
- **Live S7-09 on the deployed product (`live/s709-live.log`, 2026-10-15 05:01:36Z, GETs only):**
  - 8/8 served files equal dc228d10;
  - originals 6/6 answer 200 with the preview bytes;
  - 17 bad ids and paths refused, including cg-020;
  - by-certificate maps samples only;
  - the recorded flag is live;
  - README links resolve.

  cf97dfad changes no served file, so this result holds for the accepted candidate.

## Observations and limitations (for the addendum)

- **O7-01, endpoint.** Both Stage 7 live readings through the deployed site failed at AMD Token Factory.
  - Attempt 1: between the GET /usage reads at 05:07:34.574Z and 05:09:29.106Z, +3 requests and 0 tokens; class not
    recorded.
  - Attempt 2: job `2ce1c257…`, reading at 05:15:19.113Z, failed at 05:15:40.956Z, **endpoint_5xx**; /usage
    179→182 with 0 tokens.
  - GET /models and GET /usage answered, and Gemma-4-31B-IT was listed.
  - This is not a product finding: the live path is byte-identical to the Stage 6 candidate that read successfully
    on 2026-10-14 at 18:01Z.
  - **For the human:** while Token Factory keeps returning 5xx for Gemma-4-31B-IT, live reading on the site fails
    honestly. DEPLOY.md gives the human's options, and the choice is the human's.
- **F7-02 (UI, not blocking).** Fast hash-only navigation can let an earlier screen's slow render overwrite the
  current one. A reload recovers. It does not show stored data as live (I7). It is documented in the README
  limitations.
- **O6-04 is resolved** by the F7-01 test repair: 5/5 and then 3/3 clean runs, and Docker 0 failed.
- Stage 7 overran its 240-minute budget overnight. The human said to continue ("continuemos"). The stage hard stop of
  2026-10-16T06:00Z was met.
- Readings in Stage 7: 2, both by the capture seat (my reserved one was reallocated). Auditor endpoint calls in
  Stage 7: none.
