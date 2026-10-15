# Stage 8 analyst log (analyst-zt7k)

Times are UTC, from the machine clock or band/git records. Append-only.

## 2026-10-15

**19:15Z, dispatch 6 received.** msg 42b2a37d (posted 19:14:41Z).
- Receipt posted: msg 134d72a8. It sets the write lease and says to read before working.
- Operator correction b642c66d received.

**1d8be64, Stage 8 opened.** Committed:
- DISPATCH-6.txt, verbatim, as returned in the `content` field of `band brief --json`;
- DISPATCH-6-CORRECTION.txt;
- stage-8/SOURCES.sha256. 01-REGLAS.md changed since Stage 7; the rest is unchanged.

**Auditor S8-00 done.** msg e9ec6baa.
- Write lease lent to the auditor in 7cb09e5b.
- The auditor committed 49e377f and released the lease in c17a90ee.

**157f469, register R8.0 committed.** OBLIGATIONS.md, SHA-256 d292a6e1…de28.

**~20:00Z, handoff sent.** 7 common parts to all three seats, plus 3 seat parts:

| Part | Msg |
|---|---|
| p1, D6 and the correction | 7d82bfc1 |
| p2, D1 | 77cc2785 |
| p3, D2 | 1f3bcf52 |
| p4, D3 and D4 | 369a9e46 |
| p5, D5 | 6b2b7e5c |
| p6, R8.0 A | 623ba400 |
| p7, R8.0 B | 7e1fb31d |
| p8, implementer | fbef5a34 |
| p9, adversary | e9bc6b7d |
| p10, auditor | b411598c |

- **Due 20:45Z:** the adversary's CH8 challenge, the implementer's design note and the auditor's T8 rules.
- **Target 21:00Z:** R8.1.
- Band warned that the old `*-xwz*` handles inside the verbatim dispatches are not in the peer network and left them as literal text. That is expected.

**Correction, machine time.** The "~20:00Z" above was an analyst estimate and is wrong. Commit times show:

| Event | Commit | Time |
|---|---|---|
| Stage 8 opened | 1d8be64 | 19:18:38Z |
| Auditor S8-00 | 49e377f | 19:21:20Z |
| R8.0 | 157f469 | 19:22:08Z |
| Log | c840e5a | 19:24:29Z |

The handoff parts were sent between 19:22Z and 19:24Z. From now on this log uses machine times only (`date -u`, commit or band times).

**19:27Z, operator amendment 1 received.** msg 79b781e6. It widens the model choice: a measured group, an experimental group with real probe evidence, and a listed-not-offered group. The Stage 8 limit rises to 480 min; at most 3 repair cycles stay. Filed verbatim as DISPATCH-6-AMENDMENT-1.txt.
