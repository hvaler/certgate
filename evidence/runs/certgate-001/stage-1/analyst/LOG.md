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
