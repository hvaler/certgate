# Auditor final verdict, Stage 6 (live reading on the deployed site): ACCEPTED

**Accepted candidate:** `9759d3af0b23e532f71cf0072112b4d5dce6c612`, tree `022264f90a2fab9fdd44715c5779f1c8a41e4698`.
- Deployed from GitHub `main` = `2566050feda1093adb09048b0ddfe69e4f70e422`, which contains it.
- Site: https://certgate-wheat.vercel.app.
- Register R6.5: S6-01…S6-16, T6-01…T6-10, J-01…J-20, K-01…K-04.
- Repair cycles used: 2 of 4.

**Result: Stage 6 is ACCEPTED.**
- Local acceptance (S6-12): `VERDICT-S6-candidate-3-local.md`, commit 2566050.
- Live checks (S6-13 with K-04): this record, run from 18:00:34Z to 18:01:20Z under the lease announced in msg
  321e495e and released in ef9fe6d6.
- Neither rejection condition of dispatch 4 occurred. No stored result was shown as live, and no key was reachable
  from the browser.

## Lineage

| Candidate | Commit | Verdict |
|---|---|---|
| 1 | `bec22567` | REJECTED (f4d7899): F6-01, production Lua untested; F6-02, a flaky guard test |
| 2 | `730bd439` | Locally ACCEPTED (88fd8ad). Pushed as 6318a8e2. Superseded by the operator-ordered security repair R6.4 (K-01, K-02). My 17:01Z live run on it is a pre-repair observation (K-03, evidence cc0da94) |
| 3 | `9759d3af` | Locally ACCEPTED (2566050), then **live checks passed** (below) |

## S6-13 live checks on the deployed candidate 3 (`live-c3/live-checks.log`)

| Check | Result |
|---|---|
| Remote = deployed | `git ls-remote` gives main = 2566050f. `/api/live/status` no longer has `code_failure_ceiling_global`, so the K-02 code is live |
| Routes | `/health` 200 (reader live). `/api/f1` 200: state **on**, the endpoint's model list, latency 810 ms. `/api/live/status` 200: enabled, access code required, scope "global: counted in the shared store across all instances", model requested Gemma-4-31B-IT |
| Served files vs committed `public/` | **9/9 MATCH** (index, app.js, labels.js, styles.css, figures.json, four stories). cg-003 evaluate gives **block**, with the note "recorded real reading … not live" |
| Samples (S6-06) | `/api/samples` lists cg-004, cg-005 and cg-010. The cg-004 certificate's SHA-256 equals the listed hash and `data/cases/cg-004/certificate.pdf` |
| Refusals (T6-04) | No code gives **403**; a wrong code gives **403**. Neither used a reading. Per-client 0→2, global 0→2, readings 0→0 |
| **K-04 (R6.5): platform-set client header** | After the 2 wrong codes, a plain status GET shows a per-client count of **2**. A status GET with a forged `x-vercel-forwarded-for: 203.0.113.99` also shows **2**. **PASS**: Vercel delivers its own value, and a client cannot rotate the key |
| One real live reading (T6-08) | POST with the code (header only) gives **202**, queued at position 1, then reading at 3 s, then **done at 27 s**. Receipt: `reading_source` **live**, mode real, `reader.model_id` **self-dploy/Gemma-4-31B-IT** (requested Gemma-4-31B-IT), status processed, proposal **release** (cg-004's dataset expectation is release). View label: "live reading from the configured endpoint". The result carries its own `job_id` |
| F1 snapshot in the receipt | state on, model reported self-dploy/Gemma-4-31B-IT, latency 810 ms. See O6-05 |
| Global limit (T6-05) | 10 status GETs before the reading all give used 0; 10 after all give used **1**. The counts are consistent across instances and rose by exactly the one reading |
| Endpoint usage | GET /usage delta **0.0001025185**, which is one chat completion. Credits are free |
| Secrets (T6-02) | **0 hits** for the code value, the code's SHA-256, the key, or the base-URL host and path, across all 57 response bodies and headers. The repository scans of candidate 3 also give 0 (local record) |
| Model naming (T6-10) | The landing and stories name Qwen3.8-27B and their runs. The live section says the reading is made by the model the server requests, that the receipt shows the model as the endpoint reports it, and that the Gemma comparison is in METRICS.md. The live receipt names Gemma as reported. There is no hard-coded Gemma default (local) |
| I7 | The live result is labelled live. Recorded stories stay labelled "recorded real reading … not live". The failure paths carry no stored result (local mutant J1 killed) |

**Endpoint calls in Stage 6 by the auditor:** 2 real readings in total, one per run (17:01Z and 18:00Z), plus 4 GET
/usage. That is within the D6-02 limit of 3 readings.

## Observations (not blocking)

- **O6-05.** The F1 fields in the live receipt (`checked_at`, `latency_ms`) are the server's F1 probe of 18:00:36Z,
  reused within the 60 s cache (H-11). `model_reported` comes from this reading itself. H-11 asks for a "fresh F1
  snapshot at reading time". The snapshot is at most 60 s old and carries the reading's own model. A later change
  could take an uncached probe for receipts.
- **O6-04 (infrastructure):** one cold-run flake under host memory pressure (local record).
- **O6-01, O6-02 and O6-03** stand as recorded.
- **Access-code strength** is the human's call, per DEPLOY.md §6. I gave my advice privately.
- **Not checked by the band:** the DEPLOY.md browser walk-through at 375/1280 px on the live site. It is the human's,
  and the served files are byte-identical to the committed ones.

## For the final report addendum

- Stage 6 was accepted on 9759d3af at about 18:01Z, within its budget, which ends at about 18:37Z.
- Two repair cycles: candidate 1 rejected (F6-01, F6-02); the operator-ordered security repair R6.4.
- The remaining evidence commits after 2566050f can be pushed by the human.
