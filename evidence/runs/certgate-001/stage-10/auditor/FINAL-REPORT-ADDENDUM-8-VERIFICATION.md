# Auditor verification S10-11 — dispatch 8 addendum

- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Checks run 2026-10-16 11:27:21Z–11:28Z.
- **Request:** analyst msg e59535db.
- **Checked:** `evidence/runs/certgate-001/final/FINAL-REPORT-DISPATCH-8-ADDENDUM.md` at main `9bb3b3796476ee403da803647f27fe9799f34404`.

**Result: VERIFIED.** No correction is required. Two observations follow; neither blocks.

## Checks

| Claim in the addendum | Check | Result |
|---|---|---|
| Outside `evidence/`, main equals 18dd217 | `git diff --stat 18dd217 9bb3b37 -- . ':!evidence'` | empty |
| Fast-forward from GitHub main 4e5b9fe | `git merge-base --is-ancestor 4e5b9fe 9bb3b37` | true |
| The push changes only README.md, CLAIMS.md, claims-map.json, docs/submission/lablab.md, the docs tests and evidence/ | `git diff --name-only 4e5b9fe 9bb3b37`, filtered by those paths | nothing outside them |
| Candidate 1 rejected (record 80d10e2, msg fb443150); candidate 2 accepted (record 7fc19ac, msg 738b24fa), repair cycle 1 of 2 | the auditor's own records and messages | equal |
| Suite 615/615 and 616/616; blobs 1653 and 1656; title 45, short 254, long 375; mutants A1–A4 | the auditor's verdicts | equal |
| Wall clock 56 min 02 s (10:11:41Z → 11:07:43Z) | the committer time of 7fc19ac is `2026-10-16T13:07:43+02:00`, which is 11:07:43Z; dispatch received 10:11:41Z | 56 min 02 s, equal |
| Usage meter read at 11:08:15Z; latest per-seat activity 06:06:50.840Z, so no Stage 10 figure is claimed | `final/band-usage-agents-dispatch8.txt`, lines 4 and 17 | equal |
| Value secret scan 0 | `stage-10/auditor/tools/t10_secrets.mjs` at 11:27:50Z, exit 0. All five needles available. Changed files (18), history delta 4e5b9fe..9bb3b37, commit messages, every tracked blob (1663) | 0 for each of base-URL host+path, key, SHA-256(key), access code, SHA-256(code) |
| No prize claim; the band did not deploy, push or submit | read whole | equal |

## Observations (not blocking)

- **O-ADD8-1.** The addendum is said to have "the same shape" as the dispatch 7 addendum, but it has no §4: it goes from §3 to §5. The dispatch 7 addendum's §4 is "Live". Stage 10 had no live work, so nothing is missing. A line such as "§4 Live: none; dispatch 8 forbids endpoint calls" would keep the shape.
- **O-ADD8-2.** The adversary's 29-mutant result on 18dd217 had not reached this seat's inbox when this check was made. The table says "result posted separately". The Stage 10 acceptance stands, subject to the re-open condition stated in msg 738b24fa.
- **On the untracked `DISPATCH-8-DRAFT.txt`:** this seat's window wrote it at the operator's direct request, as the operator's draft of dispatch 8, before the dispatch was sent. It is not band work, and it is correctly left uncommitted.

## Decision

The dispatch 8 addendum is **VERIFIED** at 9bb3b37. When this record is committed, its commit is the push head the analyst names.
