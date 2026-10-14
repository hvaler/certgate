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
  code_bypass: [[APP, `if (!codeMatches(req.headers[ACCESS_CODE_HEADER], cfg.liveAccessCode)) throw new HttpError(403,`, `if (false && !codeMatches(req.headers[ACCESS_CODE_HEADER], cfg.liveAccessCode)) throw new HttpError(403,`]],
  code_not_constant_time: [[APP, `return typeof given === "string" && timingSafeEqual(digest(given), digest(expected));`, `return typeof given === "string" && given === expected;`]],
  // J-02: compare first, count after a failure only (check-then-act)
  code_count_after_compare: [[JOBS, `    const n = await this.store.countAttempt(keys.client, keys.global, perClient, WINDOW_TTL_S);`, `    const n = { client: Number((await this.store.get(keys.client)) ?? 0) + 1, global: Number((await this.store.get(keys.global)) ?? 0) + 1, countedGlobal: true };
    await this.store.incr(keys.client, WINDOW_TTL_S);
    await this.store.incr(keys.global, WINDOW_TTL_S);`]],
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
  global_counts_over_limit: [[JOBS, `    const n = await this.store.countAttempt(keys.client, keys.global, perClient, WINDOW_TTL_S);`, `    const n = { client: await this.store.incr(keys.client, WINDOW_TTL_S), global: await this.store.incr(keys.global, WINDOW_TTL_S), countedGlobal: true };`]],
  attempt_not_capped: [["src/web/deadline-reader.ts", `attemptTimeoutMs: Math.min(left, this.cap) });`, `attemptTimeoutMs: this.cap });`]],
  attempt_after_deadline: [["src/web/deadline-reader.ts", `    if (left < MIN_ATTEMPT_MS) throw new ReaderError("timeout", "the job's deadline was reached before this attempt");`, `    void MIN_ATTEMPT_MS;`], ["src/web/deadline-reader.ts", `attemptTimeoutMs: Math.min(left, this.cap) });`, `attemptTimeoutMs: Math.max(1, Math.min(left, this.cap)) });`]],
  provider_text_in_done: [[APP, "      for (const e of rc.errors ?? []) e.detail = `attempt failed (${e.class}); it was retried`;", "      void rc;"]],
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
