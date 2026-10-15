# Stage 7 candidate 3 (phase B, docs and tools): implementer handoff

**Candidate commit `cf97dfadec83c4603b538adca081f9966de4830e`, tree `1eb191fd1b7d73f8b8c42c371d29ad21d1345340`**
(frozen). Its input is candidate 2, `dc228d10`, accepted locally (auditor 9e9c24e2, record d1aaa3e) and deployed from
GitHub `main` `d1aaa3e` (analyst 36b97c00; operator report 11977ecb).

Governing messages:
- **Phase B:** the analyst's 36b97c00.
- **Live-retry rulings:** 8fca0a0d, 97fa8081, 94a4d27b, 16998773 (clock).
- **Option (b) and O7-01:** 7d0e67e6.

Every time below is machine-recorded: the script's ISO time, the GET /usage `read_at`, or a commit time.

## 1. Diff vs dc228d10: docs, tools and one test; no product file

`git diff --stat dc228d10 cf97dfa -- . ':!evidence'`: 20 files, 365 insertions and 29 deletions.

| File | Change |
|---|---|
| `docs/screenshots/*.png` (14), `docs/screenshots/manifest.json` | **14 images from one capture run** of the deployed site, with site commit `d1aaa3e` and `captured_at` 2026-10-15T05:15:09.161Z. **At 1280 and 375 px:** landing, judge mode, story cg-003, its confirmation and decision section, Runs on AMD, and the live screen. **At 1280 px only:** live-reading and live-failed. **The manifest** holds the SHA-256 of the 6 served files (unchanged during the run), of each image and its caption, plus the live record |
| `README.md` | **Screenshots section:** a table of the 14 images with their captions, and the two live failures with machine times, the class, "the queued and done screens are not shown", and the last verified live reading (the auditor's Stage 6 check, 2026-10-14 18:01Z). **Limitations:** the F7-02 line. **"How it was built and verified":** the Stage 5 independent auditor run (note 9c4e1277) |
| `CLAIMS.md`, `claims-map.json` | C-91 reworded (captured, live failure stated); new C-92 (F7-02); C-64 cites the Stage 5 run; claims 0 unmapped, 0 stale |
| `tools/capture-screenshots.mjs` | **(1)** Each screen is loaded from a fresh document. The F7-02 race let an earlier screen's slow render overwrite the next one when screens followed one another by hash change. **(2)** It records the job id (from the POST answer), a state timeline with ISO times and, on failure, the job's `reason_class` and fixed reason (from a read-only poll), plus a `live-failed` screenshot. **(3)** It captures the done screen at 375 px too, if a reading succeeds. **Never recorded:** header values or the code |
| `test/stage7.test.ts` | new test "the README screenshot table lists exactly the captured images, with their captions and hashes (T7-05)". It checks the manifest's images and the README rows, each caption naming `d1aaa3e` and the capture time, each image's SHA-256, and that a failed live capture states its class and claims no done screen |

## 2. The live readings (D7-02: both Stage 7 readings spent; O7-01)

| | Attempt 1 | Attempt 2 (granted retry, 97fa8081) |
|---|---|---|
| Lease | announced, then released | announced, then released |
| GET /usage before → after | 05:07:34.574Z → 05:09:29.106Z: all-time requests 176 → 179, tokens 491516 → 491516 | 05:15:04.383Z → 05:15:48.281Z: requests 179 → 182, tokens unchanged |
| Job | admitted (site `used_this_hour` 1); id not recorded | `2ce1c257e73f6fc13ff44f05a85bb586`, POST 202 |
| States | reading (screenshot), then failed | reading at 05:15:19.113Z; failed at 05:15:40.956Z |
| Class | not recorded | **`endpoint_5xx`**, "the model endpoint failed or could not be reached" |

- **/usage does not count itself:** two consecutive reads at 05:12:59Z and 05:13:03Z both show 179.
- **So each attempt was 3 chat calls with 0 tokens.** The retried class is consistent with a 5xx from AMD Token
  Factory for Gemma-4-31B-IT.
- **The site was configured correctly:** `/api/f1` was on, and `/api/live/status` gave `model_requested`
  Gemma-4-31B-IT.
- **I7:** the failure screen says "Nothing stored is shown instead".

Usage records are in `candidate-3/`. They show the counters only; the key and the base URL were never written.

## 3. Secret check (T7-05, CH7-01/11, D7-03)

- **In the script:** the visible-field rule ran before every screenshot. The access-code input was `""`, and the
  page text was scanned for the code, the key and the base-URL path. Tesseract is not available.
- **After the run:** the 14 PNGs, the manifest, README, CLAIMS, the claims map and the script were scanned for the
  code value, its SHA-256, the key and the base-URL path. Each was compared by presence only; nothing was printed.
  **0 hits.**
- **No artefacts:** no trace, HAR or video exists.

## 4. Verification

- `test/stage7.test.ts`, `test/docs.test.ts`, `test/stage7-diagrams.test.ts` and `test/stage7-capture.test.ts`:
  **104/104**.
- Claims: 0 unmapped, 0 stale.
- No product file changed, so candidate 2's suite, Docker and mutant results carry forward (auditor 9e9c24e2).
