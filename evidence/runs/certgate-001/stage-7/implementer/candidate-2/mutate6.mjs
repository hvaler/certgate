// Stage 6 mutants (S6-14, R6.3 J-01…J-17, CH6), as exact replacements on a throwaway checkout.
// Usage: node mutate6.mjs <checkout> <id>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const [dir, id] = process.argv.slice(2);
const APP = "src/web/app.ts", JOBS = "src/web/live-jobs.ts", STORE = "src/web/live-store.ts", LIM = "src/web/limits.ts";
const PER_HANDLER = (marker) => `  const __hid = Math.random().toString(36).slice(2);
  const __per = (s: LiveStore): LiveStore => new Proxy(s, { get(t, p) { const f = (t as any)[p]; return typeof f === "function" ? (...a: unknown[]) => f.apply(t, a.map((x) => (typeof x === "string" && x.includes(${JSON.stringify(marker)}) ? x + __hid : x))) : f; } });
  const jobs = store ? new LiveJobs(__per(store), clock, budget) : null;`;
const M = {
  // S6-14: code check bypassed / not constant-time
  code_bypass: [[APP, `if (!codeMatches(req.headers[ACCESS_CODE_HEADER], cfg.liveAccessCode)) {`, `if (false && !codeMatches(req.headers[ACCESS_CODE_HEADER], cfg.liveAccessCode)) {`]],
  code_not_constant_time: [[APP, `return typeof given === "string" && timingSafeEqual(digest(given), digest(expected));`, `return typeof given === "string" && given === expected;`]],
  // J-02: compare first, count after a failure only (check-then-act)
  code_no_forgive: [[APP, `      await jobs!.forgiveCode(attempt);`, `      void attempt;`]],
  // S6-14: failure limit per instance
  // Per-instance mutants: each handler (= one instance) gets its own key suffix for the guarded keys, as separate
  // processes with process-local counters would.
  code_fail_per_instance: [[APP, `  const jobs = store ? new LiveJobs(store, clock, budget) : null;`, PER_HANDLER(":codefail:")]],
  // J-12: code read from the query string
  code_from_query: [[APP, `if (!codeMatches(req.headers[ACCESS_CODE_HEADER], cfg.liveAccessCode))`, `if (!codeMatches(req.headers[ACCESS_CODE_HEADER] ?? new URL(req.url ?? "/", "http://x").searchParams.get("access_code"), cfg.liveAccessCode))`]],
  // S6-14: in-flight limit per instance, without TTL, read-then-write admission, release without the token check
  slots_per_instance: [[APP, `  const jobs = store ? new LiveJobs(store, clock, budget) : null;`, PER_HANDLER(":slot:")]],
  slot_no_ttl: [[JOBS, `if (await this.store.setNx(KEYS.slot(i), job.job_id, this.budget.leaseTtlMs)) slot = i;`, `if (await this.store.setNx(KEYS.slot(i), job.job_id, 1e12)) slot = i;`]],
  slot_read_then_write: [[JOBS, `if (await this.store.setNx(KEYS.slot(i), job.job_id, this.budget.leaseTtlMs)) slot = i;`, `if ((await this.store.get(KEYS.slot(i))) === null) { await this.store.set(KEYS.slot(i), job.job_id, this.budget.leaseTtlMs / 1000); slot = i; }`]],
  slot_release_without_token: [[JOBS, `.finally(() => this.store.delIfEquals(KEYS.slot(slot), job.job_id).catch(() => false));`, `.finally(async () => { const v = await this.store.get(KEYS.slot(slot)); if (v !== null) await this.store.delIfEquals(KEYS.slot(slot), v); });`]],
  lease_ttl_short: [[LIM, `  leaseTtlMs: 310_000,`, `  leaseTtlMs: 100_000,`]],
  // S6-14: hourly limit per instance
  hourly_per_instance: [[APP, `  const jobs = store ? new LiveJobs(store, clock, budget) : null;`, PER_HANDLER(":reads:")]],
  // S6-14: timeout at or above the function limit
  timeout_ge_limit: [[LIM, `  readBudgetMs: 210_000,`, `  readBudgetMs: 280_000,`]],
  // CH6-05: unbounded queue
  queue_unbounded: [[JOBS, `    if (rankOrNull === null || ahead >= this.budget.maxWaiting + (this.budget.slots - holders.length)) {`, `    if (false) {`]],
  queue_rank_by_arrival: [[JOBS, `    await this.store.zadd(KEYS.queue, this.now(), job.job_id);`, `    await this.store.zadd(KEYS.queue, arrivedAt.getTime(), job.job_id);`]],
  queue_busy_counts_free_slots: [[JOBS, `    if (rankOrNull === null || ahead >= this.budget.maxWaiting + (this.budget.slots - holders.length)) {`, `    if (rankOrNull === null || rankOrNull >= this.budget.maxWaiting) {`]],
  queue_bound_ignores_held: [[JOBS, `    if (rankOrNull === null || ahead >= this.budget.maxWaiting + (this.budget.slots - holders.length)) {`, `    if (rankOrNull === null || ahead >= this.budget.maxWaiting + this.budget.slots) {`]],
  // J-04: no pruning of dead queue entries
  queue_no_prune: [[JOBS, `  private pruneBefore() { return this.now() - (this.budget.queueMaxWaitMs + 10_000); }`, `  private pruneBefore() { return -Infinity; }`]],
  // J-05 / J-06: polls write, or derive nothing for orphans
  poll_writes: [[JOBS, `      return { ...job, state: "failed", reason_class, reason: REASONS[reason_class], result: null };`, `      const f = { ...job, state: "failed" as const, reason_class, reason: REASONS[reason_class], result: null };\n      await this.store.set(KEYS.job(id), JSON.stringify(f), JOB_TTL_S);\n      return f;`]],
  no_orphan: [[JOBS, `    if (orphan) {`, `    if (false && orphan) {`]],
  // S6-14 / T6-07: a failed job falls back to a stored result
  failed_falls_back: [[APP, `        return { kind: "failed", reason_class: READER_CLASS[cls] ?? "invalid_model_output" };`, `        return { kind: "done", result: { counted: false, note: "recorded reading shown instead", view: JSON.parse(readFileSync(path.join(PUBLIC_DIR, "stories", "cg-001.json"), "utf8")) } };`]],
  // CH6-12 / S6-14: reported model ignored; deployed model id hard-coded
  model_mismatch_ignored: [[APP, `if (!reported.toLowerCase().includes(requested.toLowerCase())) return { kind: "failed", reason_class: "model_mismatch" };`, `void reported;`]],
  model_hardcoded: [[APP, `    const requested = cfg.modelId!;`, `    const requested = "Gemma-4-31B-IT";`]],
  // S6-14: F1 hard-coded on; J-09: F1 cached per instance only
  f1_hardcoded: [[APP, `    if (!deployedLive || !store) return probeF1(cfg, clock, lastLive);`, `    if (deployedLive) return { state: "on", checked_at: clock().toISOString(), detail: "ok", model_ids: [] };\n    if (!deployedLive || !store) return probeF1(cfg, clock, lastLive);`]],
  f1_per_instance: [[APP, `    if (!deployedLive || !store) return probeF1(cfg, clock, lastLive);`, `    if (true) return probeF1(cfg, clock, lastLive);`]],
  // S6-14 / CH6-14: the key or the code in a response
  key_in_status: [[APP, `      samples: "/api/samples",`, `      samples: "/api/samples",\n      endpoint: cfg.modelBaseUrl,`]],
  code_in_status: [[APP, `      samples: "/api/samples",`, `      samples: "/api/samples",\n      code_hint: cfg.liveAccessCode,`]],
  // J-07: raw store error text in a response
  raw_store_error: [[STORE, `    if (!res.ok || body.error !== undefined) throw new StoreUnavailable(\`shared store refused a command (HTTP \${res.status})\`);`, `    if (!res.ok || body.error !== undefined) throw new StoreUnavailable(String(body.error));`], [APP, `      if (e instanceof StoreUnavailable) return send(res, 503, { status: "rejected", reason_class: "store_unavailable", error: REASONS.store_unavailable }, NO_STORE);`, `      if (e instanceof StoreUnavailable) return send(res, 503, { status: "rejected", reason_class: "store_unavailable", error: e.message }, NO_STORE);`]],
  // J-08: the missing configuration named in the public refusal
  disabled_reason_leak: [[APP, `      if (!deployedLive) return { enabled: false, status: 503, reason: DEPLOYED_LIVE_UNAVAILABLE };`, `      if (!deployedLive) return { enabled: false, status: 503, reason: \`\${DEPLOYED_LIVE_UNAVAILABLE} (missing: \${deployedMissing})\` };`]],
  // CH6-04: no store on Vercel falls back to the in-process store
  vercel_memory_fallback: [[APP, `    : sEnv === null && !deps.liveStore ? "store"`, `    : false ? "store"`], [APP, `(loaded.deployedSite ? (sEnv && deployedLive ? new UpstashRestStore(sEnv.url, sEnv.token) : null) : new MemoryStore(() => clock().getTime()));`, `(loaded.deployedSite ? (sEnv && deployedLive ? new UpstashRestStore(sEnv.url, sEnv.token) : new MemoryStore(() => clock().getTime())) : new MemoryStore(() => clock().getTime()));`]],
  // J-13: job ids from randomUUID
  ids_uuid: [[JOBS, `job_id: randomBytes(16).toString("hex"),`, `job_id: crypto.randomUUID(),`]],
  // J-17: samples not checked against the allow-list
  samples_any_id: [[APP, `    if (!(SAMPLE_IDS as readonly string[]).includes(id)) return send(res, 404, { error: "not found" });`, `    void id;`]],
  // S6-01: deployed live without the access code
  deployed_without_code: [[APP, `    : loaded.liveAccessCode === null ? "code"`, `    : false ? "code"`]],
  // I7: a live label on a stored story
  story_labelled_live: [[APP, `; not live\` };`, `; live\` };`]],
  attempt_not_capped: [["src/web/deadline-reader.ts", `attemptTimeoutMs: Math.min(left, this.cap) });`, `attemptTimeoutMs: this.cap });`]],
  attempt_after_deadline: [["src/web/deadline-reader.ts", `    if (left < MIN_ATTEMPT_MS) throw new ReaderError("timeout", "the job's deadline was reached before this attempt");`, `    void MIN_ATTEMPT_MS;`], ["src/web/deadline-reader.ts", `attemptTimeoutMs: Math.min(left, this.cap) });`, `attemptTimeoutMs: Math.max(1, Math.min(left, this.cap)) });`]],
  provider_text_in_done: [[APP, "      for (const e of rc.errors ?? []) e.detail = `attempt failed (${e.class}); it was retried`;", "      void rc;"]],
  // F6-01: the Lua scripts run by UpstashRestStore (the auditor's S2, and the DEL compare dropped)
  lua_del_no_compare: [[STORE, `"if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end"`, `"if redis.call('get', KEYS[1]) then return redis.call('del', KEYS[1]) else return 0 end"`]],
  // ADV-S6-F01 items 2-8 and c8 (adversary mutate6.py, ported verbatim)
  adv_g6_incr_two_requests: [[STORE, `    const [n] = await this.multi([["INCR", key], ["EXPIRE", key, ttlSeconds]]);\n    return Number(n);`, `    const n = await this.cmd("INCR", key);\n    await this.cmd("EXPIRE", key, ttlSeconds);\n    return Number(n);`]],
  adv_c7_poll_writes: [[JOBS, `    const raw = await this.store.get(KEYS.job(id));\n`, `    await this.store.zremBelow(KEYS.queue, this.pruneBefore());\n    const raw = await this.store.get(KEYS.job(id));\n`]],
  adv_a6_client_key_raw_ip: [[APP, `return createHash("sha256").update(ip, "utf8").digest("hex").slice(0, 32);`, `return ip;`]],
  adv_e1_no_reading_orphan: [[JOBS, `const orphan = (job.state === "reading" && now > Date.parse(job.started_at!) + this.budget.deadlineMs + g)\n      || `, `const orphan = `]],
  adv_c6_no_self_zrem: [[JOBS, `          await this.store.zrem(KEYS.queue, job.job_id);\n          return await fail("queue_timeout");`, `          return await fail("queue_timeout");`]],
  adv_c12_null_rank_admitted: [[JOBS, `if (rankOrNull === null || ahead >= this.budget.maxWaiting + (this.budget.slots - holders.length))`, `if (ahead >= this.budget.maxWaiting + (this.budget.slots - holders.length))`]],
  adv_f5_f1_gate_off: [[APP, "if (f1.state !== \"on\") throw new HttpError(503, `no live endpoint: ${f1.detail}`);", ``]],
  adv_c8_malformed_id_hits_store: [[APP, `if (!JOB_ID.test(id) || !jobs)`, `if (!jobs)`]],
  // R6.4 K-01 / K-02 (candidate 3)
  k01_xff_first_hop: [[APP, `      ? String(req.headers["x-vercel-forwarded-for"] ?? "").trim() || "no-platform-client-address"`, `      ? String(req.headers["x-forwarded-for"] ?? "").split(",")[0]!.trim() || String(req.headers["x-vercel-forwarded-for"] ?? "").trim() || "no-platform-client-address"`]],
  k01_xreal_ip: [[APP, `      ? String(req.headers["x-vercel-forwarded-for"] ?? "").trim() || "no-platform-client-address"`, `      ? String(req.headers["x-real-ip"] ?? "").trim() || String(req.headers["x-vercel-forwarded-for"] ?? "").trim() || "no-platform-client-address"`]],
  k01_no_header_fresh_key: [[APP, `.trim() || "no-platform-client-address"`, `.trim() || req.socket.remoteAddress || String(Math.random())`]],
  k01_container_trusts_xff: [[APP, `      : req.socket.remoteAddress || "unknown";`, `      : String(req.headers["x-forwarded-for"] ?? "").split(",")[0]!.trim() || req.socket.remoteAddress || "unknown";`]],
  k02_global_blocks_correct: [[JOBS, `    return { over: perClient <= 0 || n > perClient, reopens_at: nextHour(d), keys };`, `    const g = Number((await this.store.get(keys.global)) ?? 0);\n    return { over: perClient <= 0 || n > perClient || g >= perClient * 10, reopens_at: nextHour(d), keys };`]],
  k02_global_before_compare: [[APP, `      if (attempt.over) throw new HttpError(429,`, `      await jobs!.recordCodeFailure(attempt);\n      if (attempt.over) throw new HttpError(429,`], [APP, `        await jobs!.recordCodeFailure(attempt);\n        throw new HttpError(403,`, `        throw new HttpError(403,`]],
  k02_global_on_correct: [[APP, `      await jobs!.forgiveCode(attempt);\n    } else if`, `      await jobs!.forgiveCode(attempt);\n      await jobs!.recordCodeFailure(attempt);\n    } else if`]],
  k02_wrong_counted_twice: [[APP, `        await jobs!.recordCodeFailure(attempt);\n        throw new HttpError(403,`, `        await jobs!.recordCodeFailure(attempt);\n        await jobs!.recordCodeFailure(attempt);\n        throw new HttpError(403,`]],
  k02_client_incr_after_compare: [[JOBS, `    const n = await this.store.incr(keys.client, WINDOW_TTL_S);\n    return { over: perClient <= 0 || n > perClient, reopens_at: nextHour(d), keys };`, `    const n = Number((await this.store.get(keys.client)) ?? 0) + 1;\n    await new Promise((r) => setTimeout(r, 5));\n    await this.store.set(keys.client, String(n), WINDOW_TTL_S);\n    return { over: perClient <= 0 || n > perClient, reopens_at: nextHour(d), keys };`]],
  k02_global_not_counted: [[APP, `        await jobs!.recordCodeFailure(attempt);\n        throw new HttpError(403,`, `        throw new HttpError(403,`]],
  forgive_split_requests: [[STORE, `    await this.multi([["DECR", key]]);`, `    await this.cmd("DECR", key);\n    await this.cmd("GET", key);`]],
  kv_fallback_dropped: [[STORE, `  const url = pick(env.UPSTASH_REDIS_REST_URL, env.KV_REST_API_URL);`, `  const url = pick(env.UPSTASH_REDIS_REST_URL, undefined);`]],
  // F7-01: the queue wait is never enforced
  q_timeout_never: [[JOBS, `        if (this.now() - created > this.budget.queueMaxWaitMs) {`, `        if (false && this.now() - created > this.budget.queueMaxWaitMs) {`]],
  internal_as_endpoint: [[JOBS, `.catch((): Outcome => ({ kind: "failed", reason_class: "internal" }))`, `.catch((): Outcome => ({ kind: "failed", reason_class: "endpoint_5xx" }))`]],
};
for (const [file, from, to] of M[id] ?? (() => { console.error(`unknown ${id}`); process.exit(2); })()) {
  const p = path.join(dir, file);
  const s = readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  if (!s.includes(from)) { console.error(`${id}: pattern not found in ${file}`); process.exit(2); }
  writeFileSync(p, s.replace(from, to));
}
console.log(`${id} applied`);
export const IDS = Object.keys(M);
