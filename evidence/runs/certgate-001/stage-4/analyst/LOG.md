# Analyst log — certgate-001 stage 4

Append-only. Times UTC, analyst clock.

| Time | Event | Message IDs |
|---|---|---|
| ~20:01Z | STAGE_ACCEPTED Stage 3 candidate 4 5c904693 (auditor 6e4c01d3, record 4a6f28c). Stage 4 opened without human input per dispatch 2. Sources unchanged (stage-4/SOURCES.sha256). R4.0 committed 1024f791 | 6e4c01d3 |
| 20:05Z | Stage 4 handoff, 14 parts each. Implementer 6dfa1de7…18419d86 (acked 9884df95, target freeze 21:45Z). Adversary a4057103…e2297acd. Auditor 14a0aa10…2cf5c4fd | — |

Budgets: Stage 4 ends ~01:01Z; run total ends 03:54Z (final report reserve → no new work after 03:24Z); hard stop 2026-10-17T18:00Z.
| 20:08Z | Implementer S4-16 question 8f4f9e61 → R4.1 6f8f08e7 (E-01, docs-only). Auditor testability 13bfa92b → R4.2 44a43ed4 (E-02 short GET-only lease granted; E-03 rules adopted; E-04 only user-profile paths; E-05 METRICS both runs generated; E-06 favicon optional) | 13bfa92b |
| 20:11Z | Adversary Stage 4 challenge ec0d0db5 (CH4-01..14) → R4.3 committed 2940a8c1 (committed-blob SHA-256 2f7af710…8046); F-05 decision: no MODEL_* on Vercel. Auditor S4-06 baseline (967d72e2): repo public, licence MIT via anonymous API, pushed_at 2026-10-13T16:40:40Z | — |
| 20:13Z | Implementer acks R4.1–R4.3 (1479814f); docs+tests only, favicon as known cosmetic issue; comment-only src change in live-reader.ts (S4-21) to be listed for D4-04; target ~22:00Z. Analyst redacted own SOURCE-DRIFT diff user paths (91fb287f) after auditor heads-up ef0e52ab | 1479814f |
| 20:14Z | Auditor F-07 heads-up 7ab80c79: operator e-mail in stage-1 registers → redacted in 3daf0791 (incl. R1.0 copy; R4.4 E-07 records it is no longer byte-exact; original in history 6e92e827); e-mail count at HEAD 0 | 7ab80c79 |
| 20:17Z | Implementer found stale /health string (5680d5a3) → ruling (a) minimal honest fix + test; R4.5 E-08 committed 4ddb289f; auditor/adversary told | 4b4a1b8c |
| 20:17Z | Implementer found stale /health string (5680d5a3) → ruling (a) minimal honest fix + test (4b4a1b8c); R4.5 E-08 committed 4ddb289f; auditor/adversary told (1ee41e64) | 5680d5a3 |
