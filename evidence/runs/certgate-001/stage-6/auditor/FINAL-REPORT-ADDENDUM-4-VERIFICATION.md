# Auditor verification of the dispatch 4 final-report addendum (S6-16)

**Report:** `evidence/runs/certgate-001/final/FINAL-REPORT-DISPATCH-4-ADDENDUM.md`, at commit
`2f8dd68846bd0c12d20d41037c6084113baf92ae`. I verified its committed-blob SHA-256:
`7a6a4aa2c280d940d8c5fa720e90074eb5620d71cd39468089cbdd858fe0b421`. Analyst message: c2c90991.

**Result: VERIFIED, subject to one required correction (C1) before any push.** C1 changes no figure or verdict.

## Checks

| § | Check | Result |
|---|---|---|
| — | `git diff 9759d3af 2f8dd68` outside `evidence/` is empty. `2f8dd68` is a fast-forward from 2566050f and contains my final record eedb56a | pass |
| 0 | S4-10 PASSED at 12:45Z on 8868838f (record 8aead6a, msg c3f96035) | pass |
| 1 | Candidates, trees, records and blob SHAs: bec22567 REJECTED (f4d7899); 730bd439 locally accepted (88fd8ad, a466d5be…), then superseded by the operator's repair; cc5d470b superseded before review; 9759d3af locally accepted (2566050, 0127fb80…), then final ACCEPTED (eedb56a, 94b53899…), checkpoint 50d46663, 2 of 4 cycles | pass. Matches my four verdict records |
| 2 | What was built: job API and states, waitUntil, the 270/60/300 s budget, the store and its limits, K-01 and K-02 as built, samples, models, the S6-09 byte-identity | pass. Matches my code review and the diffs |
| 3 | The verification table: suites, Docker, mutant counts (mine 16/19, 19/21, 13/13; the adversary's 41/50, 51/51, k1–k9, P1–P15), secrets scans, O6-04, Lua on real Redis | pass. Matches my logs |
| 4 | S6-13: times, lease ids, 403/403, counts 0→2, K-04 2 = 2, 27 s, live Gemma, release, 0→1 across 10 GETs each, usage delta, 0 secrets in 57 exchanges, O6-05. The 17:01Z pre-repair observation and the GO-then-withdrawal sequence are stated as they happened, and labelled not the S6-13 result (K-03) | pass |
| 5 | Operator inputs relayed; infrastructure (listener, host memory); analyst errors; K-02 residual; O6-01…O6-05 and S2M04 | pass, **except C1** |
| 6 | 12:37Z → 18:01Z, about 324 min against 360 min; 2 of 4 cycles; my endpoint use (2 readings, 4 GET /usage); seat usage stated with its limits (not re-measured by me) | pass |
| Scans | Addendum: key 0, base-URL value 0, access-code value 0, user paths 0 (analyst, counts only) | pass. My own scan of my records also gives 0 |

## Required correction

- **C1 (§5, secret hygiene).** The sentence "The host code's length is 18 (length only was checked)." states a property
  of the live `LIVE_ACCESS_CODE`. The repository becomes public on push, and the code's length narrows a guesser's
  search, which is exactly the residual K-02 leaves.
  - **Remove the sentence.** Replace it with, for example, "The human was advised privately on the current code's
    strength."
  - `2f8dd68` is not on GitHub: main is 2566050f. **Amend that unpushed commit, or rebuild it**, so the length never
    enters published history. A follow-up commit would leave it in the history once pushed.
  - I will re-check the corrected blob before the push target is named.

## Push note

The push target must contain the corrected addendum, my final record eedb56a and this verification. It must be a
fast-forward from 2566050f, with **no product change** after 9759d3af. After the push I check `git ls-remote` against
it.
