# Auditor verification of the dispatch 5 final-report addendum (Stage 7, S7-10)

**Report:** `evidence/runs/certgate-001/final/FINAL-REPORT-DISPATCH-5-ADDENDUM.md` at commit
`8cc524f05b2b9d8f7843b589f168339e5a4e5af0`. I verified its committed-blob SHA-256:
`5d3b70d04adad063bbd0dcea32f30adf36841fdc445d3f109514a2351a416288`. Analyst message: 11066a1c.

**Result: VERIFIED.** There are no corrections.

| § | Check | Result |
|---|---|---|
| — | `8cc524f` is a fast-forward from d1aaa3e and contains cf97dfad and my final record 2aa14ed. `git diff cf97dfad 8cc524f` outside `evidence/` is **empty** | pass |
| 0 | Stage 6 final and record eedb56a. The rotation was confirmed by an equality check only (19e28c01). The dispatch 4 addendum was verified at 1f9cfc56. O6-04 is resolved | pass |
| 1 | The candidates, trees and records: dc228d10 / d1aaa3e (dffd6330…), the deployment GETs e2b80b8, cf97dfad / 2aa14ed (baa2fca3…f089), 4ef04b27 REJECTED ed05391 (F7-01). Checkpoints 9e9c24e2, f186deca, 57325c3a. 1 of 3 cycles | pass. Matches my four Stage 7 records |
| 2 | What was built in phase A and phase B, including the capture script's behaviour and the claims changes (C-91, C-92, C-64; 0/0) | pass. Matches my code review and the T7-05 log |
| 3 | The verification table: F7-01 in run 3 of 5; 5/5 at 485/485; Docker 402+83 with previews in the image; my 13/13 and 12/12; the adversary's 19/19 and 10/10; 3/3 at 486/486; 54/54 links; secret scans at 1529 files / 1675 blobs and over the 14 PNGs, the manifest and the README; the visual rule | pass |
| 4 | S7-09 at 05:01:36Z: 8/8, 6/6, 17 refused (my log shows 21 refusals in total; the other 4 are by-certificate probes, reported separately), by-certificate samples only, the flag, the links. O7-01 with machine times (05:07:34.574Z–05:09:29.106Z; job 2ce1c257…, 05:15:19.113Z→05:15:40.956Z, endpoint_5xx; /usage 176→179→182, 0 tokens; the self-count check). The last verified live reading is 2026-10-14 18:01Z. The open GitHub link check is listed | pass |
| 5 | The D7-02 reallocation (97fa8081, 4c44a223); 2 of 2 readings; no auditor endpoint call; the infrastructure stop and ruling (b); the analyst's clock error and its correction (16998773); F7-02 described accurately and not blocking | pass |
| 6 | Stage 7 accepted at 05:22:45Z (2aa14ed is dated 07:22:45+02:00). The overrun is stated; the stage hard stop was met. Usage: 6 chat calls and 6 GET /usage reads, 0 tokens. Seat usage is the analyst's snapshot, with its limits stated (not re-measured by me). The push request and the human's list (push, a live check with the MODEL_ID choice as the human's, F7-02 care, video, slides, cover, the lablab form with the code only in Additional Information, room export) | pass |
| D7-03 | No value or property of any secret appears. The code is mentioned only as something the human enters in the lablab form | pass |

**Push note:** after the human pushes the final head, I check `git ls-remote` against it. Then I check that the README
links under `docs/screenshots/` answer 200 on GitHub at that commit. That closes the one open item of
`VERDICT-S7-FINAL.md`.
