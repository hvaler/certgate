# Auditor verification of the dispatch 3 final-report addendum (S5-16)

**Report:** `evidence/runs/certgate-001/final/FINAL-REPORT-DISPATCH-3-ADDENDUM.md` at commit
`f110993c151b8e986ecb946cfd29952063852256`. I verified its committed-blob SHA-256:
`4a5357e201b7e2816510b60ab12d823e3ba212006aac3301afacc1b0b1fd9d02`. The analyst's message is a57e9bf0.

**Result: VERIFIED.** There is one wording note (N1) and one correction to my own record (C1). Neither changes any
figure, verdict or to-do item.

## Checks

| § | Check | Result |
|---|---|---|
| — | `git diff 409fb69a f110993c` outside `evidence/` is empty, and `f110993c` is a fast-forward from `05103af` | pass |
| 1 Outcome and lineage | the accepted candidate, its tree, record d44be28, SHA `9ab37772…a1d5`, checkpoint 47316d66, cycles 2 of 3; the rejected candidates `ddb75eca` (4eed261) and `a848dfae` (7919e26) with their reasons; the product change, which is `vercel.json` only | pass. Matches my three verdict records |
| 2 AMD evidence | host; MODEL_ID set only in the command environment; reported model; finish `stop`. The G-03 request shape (temperature 0, max_tokens 16384, json_object, no reasoning control) and my capture-stub result. The G-02 run of record (10:47:17–10:55:09Z, first and only run, 27/27, concurrency 2), 32 lease calls, /usage 0.017769629 → 0.019872587, delta 0.00210296 = sum, cg-003 at 0.00007580. My run: 35.1 s, 0.00006653, delta 0.0017963741 with diff −1.6e-9, headroom 0.97826, 0 differences vs the run of record. Licence `apache-2.0` with the Gemma 4 link | pass. Equal to `candidate-1/recompute-gemma-run-of-record.json`, my `real-run/recompute-auditor-gemma.json` and `candidate-1/gemma-card-README.md` |
| 3 Comparison | every cell of the table, against METRICS.md at 409fb69a and my recomputes; the fields not read correctly (cg-028 and cg-004 for Qwen; cg-017 and cg-021 for Gemma); the differences cg-004 and cg-021; no Gemma false conforming; cg-003 evidence only; timing compares runs | pass |
| 4 Deployment fix | the fault and the authorisation as reported; the E-15 change and its two guard tests; the E-16 results (without pdfjs-dist the load fails; with it 200s, `/api/live/read` 503, canvas not needed); my pre-fix baseline; **S4-10 NOT DONE** | pass. Matches `candidate-1/e16-bundle-sim.log` and `vercel/baseline-prefix.txt` |
| 5 Limitations | G-12 operator facts stated as reported; "no column shift in the 27-case runs" (true: 0 wrong fields in both Gemma runs); O5-01, O5-03, O5-04 and O5-05 as in my record; the not-tested list | pass |
| 6 Time and usage | Stage 5 ran 10:41Z → ~12:25Z: d44be28 is dated 12:26:15Z and the analyst's register commit 12:27:07Z. Cycles 2/3, infrastructure retries 0. Implementer lease cost 0.00217876 = 0.00210296 + 0.00007580 | pass. The seat-usage table is the analyst's snapshot, stated with its limits; I did not re-measure it |
| Scans | addendum and `final/band-usage-agents-dispatch3.txt`: key 0, base-URL host and path 0, generic patterns 0, local user name or e-mail 0, user-profile paths 0, control bytes 0. The prize words that occur are all negated disclaimers or names of the check | pass |

## Notes

- **N1 (wording, §2).** "Google DeepMind's model card": the card is published by the Google organisation on
  Hugging Face, and it names Google DeepMind as authors. The README and `docs/sources/gemma.md` state this precisely.
  No change is needed.
- **C1 (correction to my own record).** `VERDICT-S5-candidate-3.md` says "Finalized after the adversary bundle, at
  about 12:40Z". The record's commit d44be28 is dated **2026-10-14T12:26:15Z**, so the finalization time was about
  12:26Z. The verdict and its content are unchanged. This note is the correction; the committed record is not
  rewritten.

## Push note

The analyst will name the push target after this commit. It must contain 409fb69a, the addendum (f110993c) and this
record, as a fast-forward from 05103af. After the push I check `git ls-remote` against it. After the Vercel redeploy I
run the DEPLOY.md checks on the live URL (S4-10) and record them under `stage-5/auditor/vercel/`.
