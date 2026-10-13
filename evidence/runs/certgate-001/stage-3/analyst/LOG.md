# Analyst log — certgate-001 stage 3

Append-only. Times UTC, analyst clock.

| Time | Event | Message IDs |
|---|---|---|
| 16:54Z | Dispatch 2 received (7e4ee02a), copy DISPATCH-2.txt. Endpoint GET /models 200 in 1192 ms, host developer.amd.com.cn, Qwen3.8-27B listed (ENDPOINT-CHECK-stage3-start.json). Env vars present in analyst session (11/42/51 chars) | 7e4ee02a |
| ~16:56Z | Stage 3 kickoff posted: env/host check requested from all seats; endpoint lease rule D3-02 | d9a2c531 |
| ~17:0xZ | R3.0 committed ae0a412c (committed-blob SHA-256 50b6e65bdb82b3cec1e148e03f1a960e0c6e8982c1c4a3a29fb86b4d32632147); sources at Stage 3 start in stage-3/SOURCES.sha256 (01 and 02 changed since Stage 2) | — |
| ~17:0xZ | Implementer (050db153) and auditor (2963106e): vars visible 11/42/51, host allows calls, one GET /models each under lease (f75d69e5/7f914753; ea88448e/78097076). Auditor took lease before implementer released; reminded (73032426) | — |
| 17:01Z | Stage 3 handoff, 13 parts each. Implementer: 9385d721, 4de73143, 34f31c2c, 64832cde, 6133485d, 9fa255fe, eb59115e, 6137ec4a, 69d01b2e, 3dcb7865, 14a72745, 139bb5ec, e8c2fa0c. Adversary: 48b9a8a3, efea6593, b46c2398, dd12db9e, 73161159, 403a40e2, 923bb9af, 7ab673f5, 9f7c7a6e, 56f7c154, ca33ae90, 8ccdc2ee, 168a2292. Auditor: 1a2c1f5a, 755eda17, 2a5bab3d, 8a445fc2, 25db9f5c, 4ea6fe90, cc68615d, 1f40d930, 029dae8c, 75980a81, 07430f60, 1204d604, 4907a6fe | — |

Budgets: Stage 3 ends 22:54Z; Stage 4 300 min; run total ends 2026-10-14T03:54Z; hard stop 2026-10-17T18:00Z.
| 17:01Z | Adversary (14740157): vars visible 11/42/51, host allows calls; one GET /models at 16:56:20Z (made without an announced lease, single call). All four seats can reach the endpoint; no host block | 14740157 |
| 17:04Z | Adversary Stage 3 challenge ea1533c3 (CH3-01..18) → R3.1 committed ed8f8e92 (committed-blob SHA-256 48dbb1bb9ae29e05cfc67acf8cd754b4c90c0b17b0b747832e8c607fbbe5c93a); all accepted/decided; C-04 drops model explanation for this run (recorded deviation from D step 7); sent to all three | 03ec3b8c |
| 17:07Z | Auditor review 98e7df7f → R3.2 committed 8830aff1 (committed-blob SHA-256 5d6de654a84c3fa82d788ce1372d6f3216004d069247b4f022ac84f616d8fd18): C-19 any FC is REJECT; C-20; C-21 cap ⇒ BLOCKED; C-22 default suite offline. Process error owned: analyst committed auditor's ENDPOINT-CHECK-auditor.json in ae0a412/ed8f8e9 (content unchanged); own-paths-only from now | 98e7df7f |
| 17:12Z | Implementer acks R3.1/R3.2 (9a5ef4dc); lease taken b2507185; tuning on cg-001 (images, temp 0, logged) took 212 s, proposal review from a CEV channel disagreement, under analysis | 9a5ef4dc |
| 17:21Z | Adversary independent check of real-run expectations a3af07f (1bf88327): 30/30 agree; evaluated 27 (9 release, 6 block, 12 review); C-20 gap (per-planted-case C-row coverage) routed to implementer | e17452e5 |
