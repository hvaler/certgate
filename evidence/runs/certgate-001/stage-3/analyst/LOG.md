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
