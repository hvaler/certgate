# Analyst log — Stage 7 (documentation, visuals and the original certificate)

Run certgate-001 · dispatch 5 msg 6f50b629 (received ~18:30Z on 2026-10-14) · owner analyst-xwz3 · analyst clock (UTC).

Budgets:
- Stage 7 runs ~18:31Z → ~22:31Z (240 min), with 3 repair cycles.
- No new work after ~22:00Z.
- Stage hard stop: 2026-10-16T06:00Z.

| Time | Event | Message IDs |
|---|---|---|
| 18:31Z | Dispatch 5 acked; verbatim DISPATCH-5.txt; sources unchanged. Auditor T7-01…T7-08 (cbe79978) adopted; R7.0 committed 21b4b02 (96765262…7486) | 6f50b629 |
| ~18:40Z | Stage 7 handoffs, 20 parts per seat (mkparts7). Implementer 21f4b2d9…f945b274; adversary e6d40f45…bd74ceec (receipt 816621d3); auditor 48b8afc2…1cb6350a | — |
| ~18:45Z | Adversary CH7-01…CH7-12 (10d6e7f5, auditor support f2cebca9) and implementer questions (11df15bb: Playwright as an npx-pinned tool, diagrams from one JS definition) → R7.1 L-ALL, L-13, L-14. Operator code rotation relayed by the implementer (said in the implementer's window ~18:42Z) → L-15 | 10d6e7f5 |
| 18:49Z | **Operator, directly in the analyst window:** LIVE_ACCESS_CODE rotated in Vercel and in the host's user-level environment, site redeployed; confirms the new code follows DEPLOY.md's strength guidance (the operator's wording about the code's characteristics is not reproduced, per D7-03); read from the user-level registry when needed, never print it or any property of it. Confirms L-15 | — |
| 18:50Z | Auditor (19e28c01): rotation confirmed (equality check only, nothing printed); GET /api/live/status 18:50Z still enabled, code required, Gemma-4-31B-IT; no reading | 19e28c01 |
| 19:00Z | Stage 7 candidate 1 committed 431316ec77378f58ef1c36b73ba060060cca6fc9 (tree a10241bc), heavy run until ~19:40Z (4695859f). Analyst light check: T7-01 paths unchanged except data/previews/*.png (additions, allowed) and public/stories/*.json (+recorded/recorded_at only); app.ts +27/-1; build-stories.ts +9/-1; docs, diagrams, tools, tests; vercel.json unchanged (data/** already included) | 4695859f |
| 19:12Z | **Stage 7 candidate 1 frozen**: 4ef04b272e0766caaf34b934e28230bf60a52f8c (tree 7ce51055…), record 8ce11d6; since 431316e only test/stage7*.ts changed. Implementer: 5 cold clones 485/485, claims 0/0, Docker run 2 402+83 (run 1 O6-04 flake), mutants 15/15 | 8ce11d6 |
| 19:15Z | Implementer freeze notice (283f1ce5): handoffs auditor 2e99e05e…9f9ca243, adversary 8768b0c7…17ad4c97; 'Try it' says 'the access code given to the judges' (not 'in the submission': 'submission' is a fail-closed prize word; no allow-list entry), accepted. Auditor HEAVY WORK START (2b1854ea, 6.8 GB free) | 2b1854ea |
| 19:16Z | Adversary light results on 4ef04b27 (ff18ce25): T7-01 diff confirmed; route/flag probes 8/8 PASS (6 allowed ids 200 png nosniff byte-equal; 20 bad ids + 4 traversal URLs 404; by-certificate only the 3 sample hashes; recorded flag next to reading_source in files and evaluate; live result has no flag; client maps by the server-computed certificate_sha256). Heavy run waits for the auditor | ff18ce25 |
| 19:28Z | Auditor (ee925ab2): Stage 7 candidate 1 4ef04b27 phase A local REJECTED on **F7-01 only** (the Stage 6 queue-timeout guard test is flaky on real-time budgets; 3rd independent occurrence); record ed05391 (8296cfa7…4e81). Everything else passes and carries forward (T7-01…T7-07, capture script static, auditor mutants 12/12) | ee925ab2 |
| 19:25Z | Repair 1 of 3 (tests only) routed: deterministic queue-timeout test plus sweep of sub-10 s real-time tests, 5 cold runs + Docker + queue mutants; 20 parts 65fd427c…c1096fe6; target 20:05Z. Adversary heavy run on 4ef04b27 (3333768a) carries to candidate 2 for product code | — |
| 19:25Z | Auditor optional note (9c4e1277): README 'How it was built' omits the Stage 5 independent Gemma run (f258d0d); text as written is true; counts match STAGE-REGISTER. Analyst: candidate 2 stays tests-only, so the note is deferred; it can go in the phase B docs-only commit | 9c4e1277 |
