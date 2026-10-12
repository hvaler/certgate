# Stage register — run certgate-001

Run: certgate-001 · Dispatch 1 (stages 1–2 authorised), room msg 7e4a26f9-70e9-4043-807b-b4b05093a00b, received 2026-10-12T16:52Z · Owner: analyst-xwz3. Append-only; earlier decisions are never deleted.

| Stage | State | Candidate commit | Product tree | Auditor decision | Register | Mutation | Time | Room checkpoint |
|---|---|---|---|---|---|---|---|---|
| 1 | REJECTED (candidate 1) | 31335ee13944563a0eb559f6d1125efe94f598c9 | 5a2efc6d… | REJECTED, record aa40a9af (F-01, F-02, F-05) | R1.5/R1.6 | 12/14 killed (M13, M14 survived) | — | 483351ad, 33c884aa |
| 1 | **ACCEPTED** (candidate 2, repair cycle 1 of 5) | 9d0449917b237ab5de51ccf1141b772e5c0e7008 | e65caa5b420d833bac8e9037db45688239f6e4f6 | ACCEPTED (mock path only, not MVP acceptance), record 3717f315 (SHA-256 c44c1dc3…e29f) | R1.6 (0daa1894) | 14/14 killed | 16:52Z → ~18:16Z (auditor clock), ~84 of 300 min | 32d95424 |
| 2 | REJECTED (candidate 1) | 496f4ddc76bf3a3c088d933d712d7f248efe1ebe | a3c63455… | REJECTED, record 1096e317 (F2-01; adversary S2-27/S2-28 pending) | R2.2 (2ac05d62) | pending | started ~18:12Z (analyst clock) | 3bf970e4 |

Open items carried from Stage 1: ADV-S1-F04 (→ S2-33, must fix before Stage 2 acceptance); local paths in committed logs (→ S2-35); cg-022/A-16 consequence (final report); room-history secret scan not possible (limitation).

Clock note: analyst and auditor timestamps differ by a few minutes; each seat records its own clock.| 2 | **ACCEPTED** (candidate 2, repair cycle 1 of 5) | b7f4a546fee6784d3312c19b74817807f6f0114d | 33bb040e5a21ce9fa1b92f0f1dd80708808bf3ad | ACCEPTED (mock/stored path, no endpoint, no deploy), record 2d6d6d11 (SHA-256 617d023f…66e4) | R2.2 (2ac05d62) | auditor 29/29 killed; adversary 30/34 killed + 3 equivalents, S2M02b observation | ~18:12Z → 19:39Z (auditor clock), ~87 of 300 min | 863c3ff1 |

Terminal result for dispatch 1: **Stages 1 and 2 ACCEPTED (internal verification, mock/stored path only)**. Final report: final/FINAL-REPORT.md.
