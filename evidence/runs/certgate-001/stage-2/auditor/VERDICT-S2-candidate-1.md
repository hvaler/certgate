# Auditor decision — certgate-001 · Stage 2 · candidate 1

- **Run / stage:** certgate-001 · Stage 2 (web app, Vercel shape, no model)
- **Auditor and seat ID:** auditor-xwz6 (`hugo.valer/auditor-xwz6`), Claude Code, model `claude-opus-5-5`
- **Date UTC:** 2026-10-12T19:02Z
- **Decision:** **REJECTED**
- **Product commit and tree:** `496f4ddc76bf3a3c088d933d712d7f248efe1ebe`, tree `a3c6345524476d44f91af09226d7112568328913`, verified in my own clone `C:\nexus\dev\certgate-audit-s2c1`.
- **Input:** Stage 1 accepted `9d044991`. Candidate 1 is preserved unchanged.
- **Test revisions:**
  - The product suite at the candidate (232 tests) was run by me.
  - The adversary's Stage 2 test revision had **not been delivered** at decision time.
- **Spec and checksum:** sources hashed at Stage 2 start (`stage-2/SOURCES.sha256`, commit `97288c85`): D `42081f15…`, V `9d176352…`, R `33ce894a…`. I verified D, V and R myself.
- **Register:** R2.2, commit `2ac05d62`, SHA-256 `5d93a2e9…e845`; Stage 1 R1.6 also in force.
- **Scope (D2-01):** mock and stored path only, no endpoint, no deployment.

## Commands run by the auditor and the clean environment

All evidence is in commit `e428f7461451744ec7aae1e566afd58b2e0950a9`, under `stage-2/auditor/run-s2c1/`. Interim message: `90cb1232`.

| Step | Command (abridged) | UTC | Exit | Observed |
|---|---|---|---|---|
| Build | `docker build --no-cache -t certgate-audit:496f4dd <clone>` | 18:45:22–18:46:14 | 0 | `sha256:efb09a2a9b8bf0225cc309c4b72a9e82c6c64c3bec70eafb4e77caf4ff88e8a2` |
| Suite | `docker run --rm --network none … npx vitest run` | 18:46:33–18:46:40 | 0 | 10 files, 232 passed, 0 skipped |
| 30 cases | `… cli.js process --case cg-NNN`, then `compare_cases_v4.py` | ~18:47 | 0 | 30/30. v3 output kept as `compare-cases-v3-token-false-positive.txt`: my regex matched `tokens_per_second` |
| A-21 and B-14 | cg-003 `--confirm`: (a) all fields, (b) ReH only, (c) ReH 338. Release on cg-002; release after full confirmation; block | ~18:48 | 0/0/0/**2**/0/0 | (a) release, (b) review, (c) block; release on a block proposal is **rejected**; positive controls accepted |
| Isolation | `isolation_probe.mjs`, 3 pairs | ~18:49 | 0 | identical in both orders |
| Real mode | `CERTGATE_MODE=real … process --case cg-001` | ~18:49 | 0 | error, review, `live_no_reading` |
| B-23 | `node dist/src/tools/build-stories.js` in a fresh container, then `compare_stories.py` | 18:48:45 | 0 | EQUAL outside volatile keys; `stored_at` = `created_at` |
| Stage 1 mutants | the 14 adversary diffs applied to the candidate `src/` (M06 and M07 re-based), suite | ~18:50 | 1 ×14 | **14/14 KILLED** |
| Live path | `live_probe.mjs` against `test/support/stub-endpoint.mjs`, `--network none` | 18:51:53–18:55 (timeout mode ~197 s) | 0 | **25/25 PASS** |
| Browser | Chromium (Playwright tool), container UI on `-p 3077` and `-p 3078` (`LIVE_READS_PER_HOUR=3`) | 18:52–18:57 | — | 14 screenshots (6 screens × 375/1280, plus 2 flows). Every screen: scroll OK, notice, 0 other-origin resources, no AMD/LIVE/model-id string |
| Vercel docs | Invoke-WebRequest of both pages | 18:57:50 | 200 | values and dateModified match `docs/sources/vercel-limits.md` |
| Static | `git grep` over public/ (secrets), price, figures, deploy linkage, local paths | ~18:58 | — | clean (see the interim message) |

## Blocking finding (unmet condition)

**F2-01 — B-12 / S2-14 / I7 labelling.** After a stored story is re-evaluated by the server (confirmations or a decision), the UI presents the re-evaluation time as the stored time, and the original stored run time disappears.
- cg-002 case file after "Re-run the rules": "Stored reading · mock reading, no model · **stored 2026-10-12T18:55:25.879Z**". The true stored run is 18:35:51.737Z.
- cg-003 receipt screen after a decision: "Stored · mock reading · no model · 2026-10-12T18:54:40.724Z", with **no re-evaluation note**.
- The API note is honest; the screens are not.

**Condition:** every screen showing a re-evaluated story shows the original stored run time **and** "re-evaluated by the server at <time>", with a test.

## Missing evidence

S2-27 (adversary attack report) and S2-28 (Stage 2 mutation report and branches) had not been delivered. On its own that would make the verdict BLOCKED, not a product defect. It is listed so candidate 2 is not presented without them.

## Non-blocking

- **F2-02:** a browser-held upload (live attempt, no reading) says in its Explanation area "this is a mock reading". That is false under B-13, and the explanation should follow `reading_source`.
- **Known item for the human (S2-35):** implementer Stage 1 `repair-1/*.txt` contain local `C:/Users/…` paths. They were committed at 18:00Z, before S2-35 existed.
- **B-17 evidence limit:** the browser tool's network log keeps only the last page load. B-17 rests on the per-screen Resource Timing checks (0 other-origin resources on 12 screens), the CSP `default-src 'self'` header, and the console (only same-origin favicon 404s).
- **Cosmetic:** `/favicon.ico` 404.

## Budgets at 19:02Z

- Stage 2: started about 18:12Z, about 50 min used, ends 23:12Z (analyst clock).
- Repair cycles: 1 of 5 used (analyst msg `48ea574e`).
- Run total: until 2026-10-13T02:52Z; no new work after 02:22Z.
- Hard stop: 2026-10-14T20:00Z.

This REJECTED applies only to `496f4ddc`. The repair goes into a new commit, which I will reproduce from scratch, with the adversary's Stage 2 bundle.
