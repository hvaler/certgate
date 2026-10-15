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

| Commit | Time | Event |
|---|---|---|
| 6b3b730 | 19:29Z | R8.0a; sent as part 11 (831d0ba8). All 3 seats acknowledged |
| — | — | Adversary CH8-01…29 (ef22b976) and supplement CH8-30…36 (53ff3d65); auditor T8 rules (314563fa) and delta (f439150d) |
| 88b9ae8 | 19:32Z | R8.1, rulings on all CH8 items and C-1…C-6 |
| 46f12fd | — | L-37, on the implementer's sizing GET /models (19:30:59.960Z, 11 ids, Gemma unlisted; msg 7fd13df7). R8.1 sent as part 12 (aec584cc) |
| ecb6c22 | — | The auditor committed T8-RULES.md under a lent lease and released it (a3b0c781) |
| 24622f2 | 19:35Z | R8.2a, the probe-gating rulings on design note 4328e0ec; sent as part 13 (3ae07e1a). R8.2 (the rest of the note) waits for the adversary's DN8 |

| Commit | Time | Event |
|---|---|---|
| e41ff65 | 19:37Z | R8.2 approves the design note with Q-01…Q-15; part 14 (ca855d94). R8.2b, no re-probe and P-07 provenance, had already been sent as c00521b9. All 3 seats acknowledged R8.2 |
| — | 19:46Z–19:50Z | **Probe batch** by the implementer (lease fbf783a5, released e901b933) on P-04 commit 303c32bb, ancestor of 157f469 checked. Probe certificate cg-016, which the auditor verified has no text layer (6286395d) |

Probe batch details:
- 9 chat calls of the 18-call cap.
- **Passed (4):** DeepSeek-V4.1-Flash (151.6 s), DeepSeek-V4-Flash-Vision-Exp, MiMo-V2.6-Flash, Qwen3.8-Flash-Next.
- **Failed (2):** MiniCPM-V-4.7-1B (`invalid_output`); MiniCPM-V-4.7-35B-A3B (HTTP 500 ×3).
- **Text-only, "no image probe" (3):** not probed.
- **"not a chat model" (1):** MinerU2.5-Pro, from `output: ["ocr"]`.
- **/usage reconciles:** cost delta 0.00278817 equals the sum of the probes' costs (free credits). Requests +8, because the endpoint does not count the 429. Errors +3.
- Gemma-4-31B-IT is still unlisted at 19:46:54Z.

| Commit | Time | Event |
|---|---|---|
| 1497571 | ~20:50Z | O8-01 redaction of the base-URL path in `final/room.json`, on the implementer's finding 043a9050. Messages a469c39e and c40785d4 |
| — | 20:35Z–20:37Z | Implementer container smoke under lease: Qwen3.8-27B done 54.8 s; Qwen3.8-Flash-Next done 40.5 s, `evaluated: false`. The usage cost delta equals the two reply costs. Both used cg-001's delivery note by mistake, so both proposals are review; recorded by the implementer |
| cb7d83b | 20:54Z | **Candidate 1** (tree 8344f8f2), handoff 3/3 in ffbd7d81, 559e2743, af8f4f9b. The analyst checked: it contains 1497571 and fd326d6; the product diff against feaadff is 5 files (app.js, types.ts, app.ts, live-jobs.ts, new models.ts); live-reader, pipeline, data, config, evaluation, vercel.json, the Dockerfile and the package files are unchanged |
