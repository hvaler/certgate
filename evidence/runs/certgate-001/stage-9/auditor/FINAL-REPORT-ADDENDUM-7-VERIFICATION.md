# Auditor verification of the dispatch 7 addendum (S9-10)

- **Seat:** auditor-zt7p. Run 2026-10-16 ~06:50Z.
- **File:** `evidence/runs/certgate-001/final/FINAL-REPORT-DISPATCH-7-ADDENDUM.md` at **631511a75d6d648c53238db9f595b800174a9f0b** (analyst-zt7k, configured e-mail).
- **Checked against:** the auditor's T9-RULES, the S9-00 BEFORE and AFTER records, VERDICT-S9-candidate-1 (8f02203), VERDICT-S9-FINAL (1e6399a), and the auditor's room messages 0d8360c8 and 8bfbb847.

## Head 631511a (the push candidate)

| Check | Result |
|---|---|
| Fast-forward from GitHub main c040e82 | yes |
| Contains 3fff294 and the auditor's 1e6399a | yes |
| `git diff 3fff294 631511a -- . ':!evidence'` | **empty**: equal to the accepted candidate outside `evidence/` |
| Commits after 3fff294 | c938759 (merge), b1de06e (RECAPTURE-NOTE fix), 631511a (addendum, band usage, register, log), plus the auditor's records; all evidence only |
| b1de06e | touches only `stage-9/implementer/RECAPTURE-NOTE.md`, replacing "at about 06:1xZ" with "(the time of reading was not recorded)". It resolves the auditor's observation |
| Value secret scan of what the push publishes (the code, SHA-256(code), the key, SHA-256(key), the base-URL path; in memory, counts only) | **0 hits** in the 60 blobs c040e82..631511a and in the commit messages |

## Facts verified as written

- **§1:**
  - candidate 1 REJECTED, record 8f02203, checkpoint 0d8360c8, on F9-A01 and F9-A02 (found by the adversary, reproduced by the auditor), with F9-A03 and F9-A04 folded in;
  - candidate 2 ACCEPTED, record 1e6399a, checkpoint 8bfbb847, repair cycle 1 of 2;
  - the images and the capture did not change between the candidates.
- **§2:**
  - BEFORE 05:57:09.920Z and AFTER 05:59:43.524Z, 12/12;
  - the tool run (12 images) and the Stage 9 run (7 images);
  - the reading: job bc8a3b3a…, its times, `self-dploy/Gemma-4-31B-IT`, evaluated, release, live; 1 of 3 readings;
  - the manifest has 19 images and 12 served files;
  - claims 0/0, and the safeguards as recorded.
- **§3:**
  - candidate 1: 595 ×2, adversary 18/20 with M9-10 and M9-12 surviving;
  - candidate 2: 596 ×2, adversary 20/20, and the auditor's re-applied survivors killed;
  - the secret figures (28 files, 39 blobs);
  - T9-01, T9-03 and T9-04 as recorded;
  - the `expect` counts 41→65 and 53→57.
  - The Docker figures are the implementer's, labelled as such. The auditor did not run Docker in Stage 9, because T9 did not require it.
- **§4:** no further live check is needed, and the product is unchanged.
- **§5:** A9-01, V-05, R9.3 and R9.4; the limitations (queued not observed, the four byte-identical images with their proof, the receipt label); and the estimated-time fix b1de06e, all as recorded.
- **§6:** endpoint use is 1 reading, reconciled. "No other seat called the endpoint" holds for this seat, whose only network use was GETs to the site and `git ls-remote`. The push changes only docs, README, claims, tests and evidence; nothing is to be set in Vercel.

## Correction

**E1 (§6, the time table): "~70 min" is not a machine time (A9-05), and it is short by about 7 min.**
- The dispatch arrived at 05:26:47Z.
- The auditor's final verdict message was written at 06:43:54Z, and its record 1e6399a was committed at 06:44:41Z.
- That gives **about 77 min** (05:26:47Z → 06:44:41Z = 77.9 min to the record).
- Please give the two machine times, or "77 min to the verdict record".

## Result

**VERIFIED with one correction (E1).** No other figure is wrong, and head 631511a is evidence-only on top of the accepted 3fff294.

## Correction E1 applied: 2c9c9fd, checked

- **The fix:** `git diff 631511a 2c9c9fd` changes one line of the addendum (§6, the time table) and adds one analyst LOG line.
- **The table now reads:** "verdict message 8bfbb847 written 06:43:54Z; record 1e6399a committed 06:44:41Z | 77 min (05:26:47Z → 06:44:41Z; auditor correction E1)". These are machine times, so **E1 passes**.
- **Product:** `git diff 3fff294 2c9c9fd` outside `evidence/` is still **empty**.

**S9-10: the dispatch 7 addendum is VERIFIED at 2c9c9fd, without reservation.**
