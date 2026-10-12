# Analyst log — certgate-001 stage 1

Append-only. Times UTC. Message IDs are the `sent` IDs returned by `band send`, copied from command output.

| Time | Event | Message IDs |
|---|---|---|
| 2026-10-12T16:52Z | Dispatch 1 received (from hugo.valer) | 7e4a26f9-70e9-4043-807b-b4b05093a00b |
| 16:53Z | Sources read in full; SHA-256 generated → `stage-1/SOURCES.sha256` (matches auditor baseline msg fe3d3a0d) | — |
| ~17:00Z | Register R1.0 written (`stage-1/OBLIGATIONS.md`, SHA-256 5ebea584fbe147a2b6f8949013d97c2f5ebf0d6d58291ff9e80d363b8e3e8779), incorporating auditor input fe3d3a0d | — |
| ~17:01Z | Stage 1 handoff to implementer, parts 1–7 | ea1456ee, d9f204e2, b8654265, b91a5c1d, 5ae3b69a, 54ebb410, f20bf8b5 |
| ~17:01Z | Stage 1 handoff to adversary, parts 1–7 | eaf4f1a4, 7287486b, d1466bcb, 55a447f0, 0e8e6af0, 494f97d9, 348a46aa |
| ~17:02Z | Stage 1 handoff to auditor, parts 1–7 | 855539c8, 3527d75c, ed87919c, 3ebfa5a5, 08e63f8a, db8639e5, 7d8b246c |

Budgets: stage 1 ends 21:52Z; run ends 2026-10-13T02:52Z (final report reserve 30 min → stop new work by 02:22Z); hard stop 2026-10-14T20:00Z.
| ~17:06Z | Auditor testability review cbb38820 → R1.1 committed 6e92e827 (SHA-256 66b7eba7…0e95); sent to all three (4af1fd78, 4c99f34a, 8028dc71, 3b277de8, 92ebfbb5, 75243ce4) | — |
| 17:09Z | Adversary register challenge deb9efbf (CH-01..19) → R1.2 committed 258825fe (SHA-256 11283e6f…0611), all items accepted/decided; sent to all three (95d624c8, a1af3f6b, e2e39d5b, 590b8e3d, f5bebdcd, cba37310) | — |
| 17:12Z | Adversary CH-20 ec4e03af → R1.3 committed 9d098336 (SHA-256 cd2fbcb2…9a29), A-20 half-even; sent to all three in one directed message | 69d7f861 |
| 17:12Z | Auditor 11ea6c43 → R1.4 committed f65ad5b0 (SHA-256 595ce62f…e70b), A-21/A-22; sent to all three | ce1c8d41 |
| 17:15Z | Adversary checkpoint: test revision 178a6cf2 in C:\nexus\dev\adv-certgate (33 oracle self-tests, 24 PDFs + 2 non-PDF); auditor accepts against R1.4 (bfd22869) | 9f84c751 |
| 17:17Z | Implementer acks R1.2–R1.4; dataset commit 4ebd9533 (30 cases, 17:15:59Z, no product code) (22813e0c) → R1.5 committed f9836f89 (SHA-256 fd836c91…a404) naming case IDs, A-23; sent to all three | cb74fe4c |
| 17:19Z | Adversary independent dataset review of 4ebd9533: 30/30 expectations agree with spec-derived oracle, no defects (evidence adv clone 963468f3, dataset-review.json sha 87c8e7ef…) | e9232d87 |
| 17:42Z | Stage 1 candidate 1 posted by implementer: 31335ee13944563a0eb559f6d1125efe94f598c9 (tree 5a2efc6d), 7 parts 875e156e..9ef4a5ab, record commit 72c7b984; own runs 175/175 local and in-image. Source drift finding fe9fda17 → R1.6 committed 0daa1894 (A-24, no obligation changed) | a64c429c |
| 17:43Z | Auditor 69217260: further drift, 02-VALIDACION at 17:42:08Z now cc62a36cc37e30b6fdef647beb33b065fff438369985517cfb434ca0e9c37a3c (A2 credit status). Covered by A-24 policy: Stage 1 bound to stage-start sources; Stage 2 binds to hashes taken at its own start | 69217260 |
| 17:50Z | Auditor interim findings on 31335ee1 (f2637abc): reproduced 175/175 in-image, 30/30 cases; F-01 REJECT (C11 receipts not labelled planted), F-02 REJECT (README run command), F-03/F-04 non-blocking. Routed to implementer as repair cycle 1/5, 7 parts: 8e511ad4, 924b8bc0 (part 2, 1 infra retry after 'daemon unavailable'), 37f0e35b, cb9c35f0, def644e3, a15723e8, c55dd273. Candidate 2 freeze held until adversary findings or 18:45Z | f2637abc |
| 17:56Z | Auditor checkpoint: candidate 1 31335ee1 REJECTED (F-01, F-02, S1-40 missing); verdict record aa40a9af, SHA-256 6cdbd3df…ecd | 483351ad |
| 17:55Z | Adversary bundle on 31335ee1 (90b39eda): test rev 19f981df; 14 mutants, 12 killed, M13/M14 (unary + floats) survive → ADV-S1-F01; F02 exit code; F03 = corroboration of F-01. Routed into repair cycle 1 as addendum, implementer told to freeze after fix | 902fef8f |
| 17:57Z | Auditor addendum to verdict (33c884aa): mutation check reproduced independently (12 killed, M13/M14 survive), evidence d90ba0c7; F-05 = ADV-S1-F01 added; unmet: F-01, F-02, F-05 (already routed, 902fef8f) | 33c884aa |
| 18:00Z | Stage 1 candidate 2 posted: 9d0449917b237ab5de51ccf1141b772e5c0e7008 (tree e65caa5b), 7 parts 896ef1ab..a31b2afb, record 4ca5b23f; claims 188/188, M13/M14 killed by A26/A25, O1 taken | 896ef1ab |
| 18:07Z | Adversary bundle candidate 2 (2f4495c0): test rev 0f13ae58; 188/188; 30/30; harness 47/0; mutants 14/14 killed; F-01,F-02,F-05,ADV-F02,F-04 resolved; new ADV-S1-F04 low (recovered non-persistent injected failure unlabelled). Severity left to auditor; if non-blocking → open issue OI-S1-01, fixed in Stage 2 | 2f4495c0 |
| 18:10Z (analyst clock) | STAGE_ACCEPTED Stage 1, candidate 9d044991 (auditor 32d95424, record 3717f315). Stage 2 opened without human input per dispatch | 32d95424 |
