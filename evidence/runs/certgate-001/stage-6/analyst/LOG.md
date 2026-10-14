# Analyst log — Stage 6 (live reading on the deployed site)

Run certgate-001 · dispatch 4 msg 980db228 (received ~12:36Z on 2026-10-14) · owner analyst-xwz3 · analyst clock (UTC).

Budgets:
- Stage 6 runs ~12:37Z → ~18:37Z (360 min), with 4 repair cycles.
- No new work after ~18:05Z.
- Hard stop: 2026-10-17T18:00Z.

| Time | Event | Message IDs |
|---|---|---|
| 12:37Z | Dispatch 4 acked; verbatim DISPATCH-4.txt. GitHub main = 8868838f (human pushed the Stage 5 target; analyst ls-remote). Sources unchanged. R6.0 committed 47a951b (dff6c8e8…d2c0) | 980db228 |
| ~12:40–12:47Z | Stage 6 handoffs, 18 parts per seat (mkparts6: dispatches 1–4, spec, data, R6.0, R5.7, R3.3, R2.2, R1.6, design ×3, R4.8). Implementer 5e7928b7…3f2f2e87. Adversary 655939ab…6b001591 (receipt 8b49fdc7). Auditor 86cd3636…1a1973ee | — |
| ~12:44Z | Adversary challenge CH6-01…CH6-19 (41f6ca68) → R6.1 295c59e (b3a56012…5cc5): all accepted, verbatim appendix; rulings H-02 (per-client plus global failure limit), H-11 (cached F1), H-19. Posted cd0d59c5 | 41f6ca68 |
| 12:48Z | Auditor: **S4-10 PASSED** live at 12:45Z on 8868838f (record 8aead6a), marked in the R4/R5 registers. Auditor T6-01…T6-10 (c3f96035, 744a0e0a) → R6.2 2cc6bdb (052aa79c…d4c5), posted 3cd22154 | c3f96035 |
| 12:49Z | Implementer design note D6-01 (7c8234e1): POST /api/live/jobs → 202 + waitUntil (@vercel/functions@3.10.1, Apache-2.0, new dependency, justified); JOB_DEADLINE 270 s, QUEUE_MAX_WAIT 60 s; no extra retry layer; Upstash REST via fetch, keys certgate:live:*, slot leases SET NX PX 310000 (GET+DEL release); UTC-hour INCR at admission; env UPSTASH_REDIS_REST_* or KV_REST_API_*; MemoryStore for the container and the fake shared store; samples /api/samples. Analyst pre-review gaps vs R6.1: H-02 per-client key absent, CH6-03 identical refusal, CH6-07 poll-side dead-worker failover, CH6-10 reason class only, CH6-12 model mismatch, CH6-05 queue bound, CH6-01 header-only. Awaiting the adversary's design challenge before ruling | 7c8234e1 |
| 12:52Z | Auditor design review ed2c7a0c (5 points) and adversary DN-01…DN-18 (9ddc9096) → **design ruling R6.3** 7bbf816 (cfcf4aa2…f6a): design APPROVED with mandatory J-01…J-20 (per-client+global limits with INCR-first and DECR on success, lease TTL ≥ budget per env, ghost pruning, read-only polls, orphan failover on poll, reason classes only, unchanged disabled behaviour, global F1 cache, model mismatch, freshness, code transport, 128-bit ids, deadline from arrival, store errors, atomic counters, samples allow-list, new dependency approved, baseline). Posted | 9ddc9096 |
| 12:53Z | Implementer design addendum e1752abc (crossed with R6.3). Ruling: R6.3 governs; addendum accepted otherwise; dependency approved (J-18, 25 lockfile entries); six deltas sent (J-02 order INCR-first+DECR, J-08 no config detail in public status, J-01 both counts, J-03 container lease TTL, J-06 three conditions, J-04 pruning) | e1752abc |
| 12:53Z | Adversary delta note on the addendum (54f85bdd): agrees R6.3 binds; adds J-05 (loop ≥ 2 s), J-14 (deadline from arrival), J-16 (pipeline INCR+EXPIRE), J-01 key naming (harmless if documented), J-07 class set; will mutate against these. Consistent with analyst ruling 8950ce99 | 54f85bdd |
| 12:56Z | **Operator (analyst window, outside the room):** Upstash Redis connected to Vercel project certgate (Free, iad1, default variable names, all environments, not marked sensitive); MODEL_*, LIVE_ACCESS_CODE, LIVE_READS_PER_HOUR not yet set. Recorded verbatim (OPERATOR-STORE-CONNECTED.txt) and relayed with consequences for candidate 1 (exact names in DEPLOY.md, Sensitive flag recommendation, Free-tier quota) | — |
