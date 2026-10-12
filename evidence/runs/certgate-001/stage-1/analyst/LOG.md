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
