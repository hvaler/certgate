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

| 3 | REJECTED (candidates 1–3: F3-01; ADV-S3-F01; ADV-S3-F02) then **ACCEPTED** (candidate 4, repair cycle 3 of 5) | 5c904693423574846e17994331a628cc06d735ef | 1ed386fd25d993f1d37b823eadddfa7040b19dae | ACCEPTED (real reading on AMD Token Factory, Qwen3.8-27B; not deployment/submission), record 4a6f28c (348ac231…5773) | R3.3 (0b683879) | S3 12/12, S2 and S1 lists killed (re-based where code moved) | 16:54Z → ~20:01Z, ~187 of 360 min | 6e4c01d3 |
| 4 | ACTIVE | — | — | — | R4.0 | — | started ~20:01Z | — |
| 4 | REJECTED (candidate 1 02c5c36b: F4-01; candidate 3 a130bbf4: F4-02; candidate 4 c5769948: F4-03; candidate 2 ac738ef3 superseded) then **ACCEPTED** (candidate 5, repair cycle 4 of 5) | b0ec67a663d1caeb9496ff4b75bec163c837d0b3 | 8688691982ba6e211bd55374743dab8c21161749 | ACCEPTED (delivery candidate; internal verification only; push S4-07 and Vercel S4-10 open, human-dependent), record 6af4903 (3df08447…f13f), msg afb6dc7f | R4.8 (f09a060) | auditor 22 re-applied killed; adversary 38/38 Stage 4 killed; S1–S3 lists carried (product identical since candidate 1) | ~20:01Z → ~22:20Z, ~139 of 300 min | afb6dc7f |
