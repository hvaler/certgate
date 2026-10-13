# Analyst log — certgate-001 stage 2

Append-only. Times UTC, analyst clock.

| Time | Event | Message IDs |
|---|---|---|
| ~18:12Z | Stage 2 opened after Stage 1 ACCEPTED (32d95424). Sources re-hashed (stage-2/SOURCES.sha256). R2.0 committed 97288c85 (SHA-256 7ac9e8d1…3c53) | — |
| 18:17Z | Stage 2 handoff, 11 parts each. Implementer: 4132aef8, 664b0e14, 254b7b11, f76cee19, a1a0e310, 7cd43b5f, ae401089, a1ba8c67, 411412f0, b1af25be, 8e24d5e6 (acked 907dfba8). Adversary: 57aaee20, 4d1d3da1, c5840727, 37435686, 5736198e, a2ee23a8, e7b9c78e, 1a6fab3e, 7bdec5ab, 1a5c96a0, b825cf4f. Auditor: 8c2fb5d0, a8bab0ef, 92ebc808, dce1b848, 2b4ed5a1, 4b5cc9a4, 16b09cb3, 1e502525, 8a00f1b8, 1fc509c3, 3d34c160 | — |

Budgets: stage 2 ends 23:12Z; run ends 2026-10-13T02:52Z (no new work after 02:22Z); hard stop 2026-10-14T20:00Z.
| 18:22Z | Adversary Stage 2 challenge 74bf34b9 (CH2-01..23) → R2.1 committed b2af36cb (SHA-256 d12f6a55…0363), all accepted/decided; sent to all three | 2ffa4c68 |
| 18:23Z | Auditor testability 2fa541ba → R2.2 committed 2ac05d62 (SHA-256 5d93a2e9…e845), B-23/B-24; sent 97ab36e3. Auditor acks R2.1 (aaabb234); will re-run full Stage 1 reproduction on the Stage 2 candidate because B-14 changes the core | 97ab36e3 |
| 18:37Z | Implementer acks R2.1/R2.2 (275311ae); WIP d6a2fba covers most B-items; freeze target 20:45Z. Prior commits: 3404f4c (S2-33), e96d29c (S2-22 Vercel limits record before adapter) | 275311ae |
| 18:45Z | Stage 2 candidate 1 posted: 496f4ddc76bf3a3c088d933d712d7f248efe1ebe (tree a3c63455), 11 parts d4072020..87229c6d, record ccc9054f; claims 232/232, browser 9/9, 12 screens; OI-S2-01 per-instance counter, OI-S2-02 no start-then-poll | d4072020 |
| 19:00Z | Auditor interim on 496f4ddc (90cb1232): Stage 1 regression full (232, 30/30, 14/14 S1 mutants), live path vs stub 25/25, 14 screenshots; F2-01 REJECT (re-evaluated story shows re-evaluation time as stored time), F2-02 non-blocking. Routed as Stage 2 repair cycle 1/5, 11 parts: 9bfa32c4, 2cd46a94, 945f80fb, 6f8db22f, 8a583501, 516586c6, 91866540, 1ed56639, 54bb6977, bb61b329, 031d9fb3. Freeze held until adversary bundle or 19:45Z | 90cb1232 |
| 19:01Z | Auditor checkpoint: Stage 2 candidate 1 496f4ddc REJECTED (F2-01; S2-27/S2-28 evidence missing), record 1096e317 (bdfce555…ce96) | 3bf970e4 |
| 19:01Z | Adversary findings on 496f4ddc (270b6936): ADV-S2-F01 model id from config shown as endpoint-reported; F02 = auditor F2-02; F03 explanation without references displayed; F04 4/12 S2 mutants survive (S2M01, S2M02, S2M04, S2M08). Routed as addendum to Stage 2 repair 1 (097b4723); freeze after fix | 270b6936 |
| 19:02Z | Auditor addendum (8d4e1409): reproduced ADV-S2-F01/F03 (evidence 7dfd701a) → REJECT conditions F2-03, F2-04; F2-02 now required; F2-05 = surviving S2 mutants. All already routed in 097b4723 | 8d4e1409 |
| 19:08Z | Adversary Stage 2 bundle cand 1 (1cb938ba): test rev c7295154; 27 mutant branches; candidate suite kills 9/13 S2 + 14/14 S1; survivors killed by adversary checks; mutant diffs sent to implementer (ee2b2219). No new findings | 1cb938ba |
| 19:11Z | Stage 2 candidate 2 posted: b7f4a546fee6784d3312c19b74817807f6f0114d (tree 33bb040e), 11 parts e44315e9..71ecf73b, record afd686b3; claims 246/246, browser 13/13, S2M01/02/04/08 killed | e44315e9 |
| 19:13Z | Auditor build of b7f4a546 stopped by host low memory (f1e2af49). Analyst measured 3958/32397 MB free, no CertGate containers. Heavy work serialized: auditor first, infra retry 1/2 authorized after adversary/implementer idle; others hold | ba15a8ff |
| 19:14Z | BLOCKER: auditor's host requires a human go to restart docker build after a low-memory stop (5e1d8ea3). Directed: record blocker, proceed with non-build checks, decide by 22:40Z (BLOCKED acceptable); adversary released to run heavy checks one at a time | 5e1d8ea3 |
| 19:14Z | BLOCKER: auditor's host requires a human go to restart docker build after a low-memory stop (5e1d8ea3). Directed: record blocker, proceed with non-build checks, decide by 22:40Z (BLOCKED acceptable) (cc294d9c); adversary released to run heavy checks one at a time (40579273) | 5e1d8ea3 |
| 19:23Z | Auditor heavy work done on b7f4a546 (8e1c5682), evidence 02461e6d incl. infra blocker record for docker build; verdict after adversary bundle | 8e1c5682 |
| 19:27Z | Adversary bundle cand 2 b7f4a546 (63ea06c9): test rev 0203683f; 246/246; API 41/41; browser 29/29; 34 mutant runs, 30 killed, 3 N/A-with-equivalent, 1 survivor S2M02b (drops ' · not live', classified observation ADV-S2-O5); all F2 findings resolved; no new defects | 63ea06c9 |
| 19:33Z | Auditor reports the human operator gave an infrastructure go in its window (~13 GB free); auditor resumes docker build --no-cache b7f4a546 as infra retry 1/2 (a669fd01). Recorded as a human intervention reported by the auditor, outside the room; analyst cannot verify it | a669fd01 |
| 19:35Z | Auditor infra retry 1/2 succeeded (image 26cb4fde..e291); heavy work done 19:36Z; evidence 6a18ee92; verdict pending | 0921b2d8 |
| 19:38Z | STAGE_ACCEPTED Stage 2 b7f4a546 (863c3ff1). Adversary closing summary 80e1ca2f. Final report written | 863c3ff1 |
| 19:39Z | Final report posted (dbfe2f1c). Adversary confirms its content, no corrections (70b82ce8) | 70b82ce8 |
| 19:40Z | Auditor verified section 8 (8dfba3c1). Hash note: committed blob of FINAL-REPORT.md at e90fe2c2 (blob d6450330, LF) has SHA-256 66a97b2733a5fe4c0c908d6895c198a36fd7d965836f36cff21a8b9a118a1317 (auditor's computation); the 27fc67cd value cited in msg d6fe5271 is of the CRLF working copy. Dispatch 1 closed by analyst and auditor | 8dfba3c1 |
