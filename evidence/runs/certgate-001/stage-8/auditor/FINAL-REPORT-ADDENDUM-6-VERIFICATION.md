# Auditor verification of the dispatch 6 addendum (S8-20)

- **Seat:** auditor-zt7p. Run 2026-10-16 ~02:20Z.
- **File:** `evidence/runs/certgate-001/final/FINAL-REPORT-DISPATCH-6-ADDENDUM.md` at **6d7120c3f417f065aec82bba83b05506c59d8a17** (analyst-zt7k, committed 2026-10-16T02:12:14Z), 13 388 bytes.
- **Checked against:** the auditor's own records:
  - S8-00 and S8-00a, S8-P01, S8-T821, T8-RULES;
  - VERDICT-S8-candidate-1-local (44f8cd0) and VERDICT-S8-candidate-2-local (0920b82);
  - the auditor's room messages: e9ec6baa, 314563fa, f439150d, bb51e0bc, 6286395d, bb4dd7a6, 8bbeb670, b8f4577e, 15d6a99c, 31943fa6, 7fd2fee4.

## Push target 6d7120c3 (checked before the human pushes)

| Check | Result |
|---|---|
| Fast-forward from GitHub main feaadff (`ls-remote`: feaadff8c90d) | yes |
| Contains adb21d5 | yes |
| `git diff adb21d5 6d7120c3 -- . ':!evidence'` | **empty**: the product equals the locally accepted candidate |
| Difference from 61b150e8 | evidence only: the addendum, `band-usage-agents-dispatch6.txt` and the analyst LOG |
| Value secret scan of what the push publishes (code, SHA-256(code), key, SHA-256(key), base-URL path; in memory, counts only) | **0 hits** in the 1602 files at the head, the 120 blobs feaadff..6d7120c3, and the commit messages |

## Facts verified as written

- **§0:**
  - the starting commits, and S8-00's correction of "operator commits";
  - the product diff 2158016..feaadff is empty;
  - 486/486 at feaadff.
- **§1:**
  - candidate 1 is REJECTED (local), record 44f8cd0, checkpoint b8f4577e, on F8-A01 alone;
  - F8-A01 was found by the adversary and reproduced by the implementer and the auditor;
  - candidate 2 is ACCEPTED (local), record 0920b82, checkpoint 31943fa6, repair cycle 1 of 3;
  - the repair is the 5-line strict guard with 502 `model_mismatch`, its killer, and the stricter F2-03 test.
- **§2:**
  - the probe batch on cg-016 (no text layer, auditor-verified in S8-P01): 9 chat calls of the cap 18, with no re-probe;
  - the passed, failed, no-image and not-chat groups;
  - the statement that value correctness was not judged;
  - T8-01 unchanged, the prompt `32fad2f9…`, and claims at 0 unmapped / 0 stale.
- **§3:** every figure equals the auditor's records:
  - candidate 1: 564 ×3; Docker 474 + 90; auditor mutants 22/22; adversary 26/26; 0 secret hits;
  - candidate 2: 565 ×3; Docker 475 + 90; auditor mutants 25/25; adversary 29/29, S7 10/10 and S6 44/44; job-path bodies 8/8; browser 16/16; bundle 31/31; cadence 10 against feaadff's 10.
  - The implementer's 40/40 is that seat's claim, reported as such.
- **§4:**
  - the live checks are "Not done";
  - the auditor's pre-push check msg 7fd2fee4 is cited correctly;
  - the live checks T8-30…T8-37 and their caps (4 readings, 8 GET /models) are as adopted.
- **§5:**
  - O8-01 as recorded, including the auditor's S8-00 miss and the S8-00a correction;
  - O8-A02, the `ui-checks.mjs:94` timeout, the freshness boundary, the 200-character note and the legacy unit spend (CH8-19), each as recorded.
- **§6:**
  - "The auditor and the adversary made no endpoint calls before deployment" is true for this seat. Its only network use was `git ls-remote` to GitHub and the local stubs. Its dry run of the live tool ran against a local server and stub, with fake values.
  - The probe and smoke costs match the implementer's records, and the probe batch figure matches S8-T821 (0.002788170).
- The statements that there was no deploy, push, submission or prize claim are correct.

## Corrections (the analyst decides how to record them; none changes the outcome)

- **C1 (§4, line 105): "As of 02:4xZ on 2026-10-16".** The commit is 02:12:14Z and the room message c9266f11 says 02:12Z, so this time is about 30 minutes **ahead of the clock**. It should be the machine time of the last `ls-remote` check, at or before 02:12Z (the machine-time rule of §5).
- **C2 (§4, lines 100–103):** "push main **61b150e8**". The push target was superseded in msg c9266f11 by **6d7120c3**, the head carrying this addendum. §6 already allows "a later evidence-only head". §4 should name 6d7120c3, or say "61b150e8 or later", so the human is not pointed at the older head. Both heads have the same product.
- **C3 (§2, line 56), wording:** "An id outside both sets is never offered, even if listed, and is logged by name on the server only."
  - The server log names ignored **LIVE_MODELS entries** and an unmeasured MODEL_ID.
  - A **listed** id outside both sets is not logged. It is shown on the page in group (c) with its reason.
  - Suggested: "…never offered, even if listed (it is shown disabled in group (c)); an ignored LIVE_MODELS entry is logged by name on the server only."

## Result

**VERIFIED, with the three corrections above.** No figure is wrong, and the outcome, the verdicts and the push target's product identity are as the auditor recorded them. §4 stays open until the live checks.

## Corrections applied: a7901af583b3cce99edfca15d645fa56cf088e8b (analyst-zt7k, 2026-10-16T02:15:27Z), checked

`git diff 6d7120c3 a7901af5` changes the addendum (3 lines) and the analyst LOG (+2) only.

- **C1, passed.** "As of the last `ls-remote` check at 02:11:34Z on 2026-10-16 (machine time)". That is before the 02:12:14Z commit, and no longer ahead of the clock.
- **C2, passed.** "push main **6d7120c3** or a later evidence-only head (it superseded 61b150e8; room msg c9266f11)".
- **C3, passed.** The logging sentence now says that ignored LIVE_MODELS entries and an unmeasured MODEL_ID are logged on the server, and that a listed id outside both sets is shown disabled in group (c) with its reason.
- **Product:** `git diff adb21d5 a7901af5` outside `evidence/` is still **empty**.

**S8-20: the addendum is VERIFIED at a7901af5.** Its §4 stays open until the live checks (S8-18).

## The completed addendum, after the live acceptance: 016e0288 and bdd587e2, checked

- **016e02880a8c9bd97e2c4f73e130a92160ca27a7** (analyst, 2026-10-16T04:33:27Z) completes §4 from VERDICT-S8-FINAL (ccb82d9) and updates §1, §5 and §6.
  - **Checked against the auditor's final record and `live/`:**
    - the lease;
    - the call counts (3 readings, 0 retries, 4 GET /models, 0 wrong codes);
    - T8-30…T8-37 as recorded;
    - the readings table (138, 30 and 56 s; the strict reported ids; `evaluated` true, true, false; the hourly count 0→1→2→3);
    - the per-reading /usage deltas 0.000239575, 0.000102519 and 0.000652260, equal to `live/read-*-counts.json` and to the reply costs;
    - the total 0.000994354;
    - T8-35 as condition absent, a limitation and not a pass;
    - "no automatic rejection";
    - O8-01 option A;
    - the push note.
  - **Product:** `git diff 37938b25 016e0288` outside `evidence/` is empty.
  - **Two corrections were raised (msg 612ddfc4):**
    - **D1, commit identity:** 6 auditor commits carry `auditor-zt7p@certgate.local`, not `hvaler@comillas.edu`.
    - **D2, final time:** 04:29Z was the lease release.
- **bdd587e2f6234b88b838ddfd7c93b794401b8a4b** applies both, in the addendum only (+5 −2), and they **pass**:
  - **D1** states the 33 `hvaler@comillas.edu` commits and the 6 auditor commits under `auditor-zt7p@certgate.local`, listed by id, and notes that the human rewrites both.
  - **D2** gives "final ~04:31Z", with the lease released at 04:29:04Z, the verdict message written at 04:30:49Z and the record committed at 04:31:38Z.
  - **Product:** `git diff 37938b25 bdd587e2` outside `evidence/` is empty.

**S8-20: the dispatch 6 addendum is VERIFIED at bdd587e2, without reservation.**
