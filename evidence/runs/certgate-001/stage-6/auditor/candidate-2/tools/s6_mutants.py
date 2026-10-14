"""Auditor (stage 6, candidate 2): independent mutants of the Stage 6 guards, each a single textual replacement,
full suite after `npm run build`, reverted with git checkout. Usage: python -I s6_mutants.py <clone> <log>"""
import subprocess, sys, os
repo, log = sys.argv[1], sys.argv[2]
J, A, L, S = "src/web/live-jobs.ts", "src/web/app.ts", "src/web/limits.ts", "src/web/live-store.ts"
MUT = [
 ("A1-lockout-ignored", A, "if (attempt.over) throw new HttpError(429", "if (false) throw new HttpError(429"),
 ("A2-code-bypass", A, "if (!codeMatches(req.headers[ACCESS_CODE_HEADER], cfg.liveAccessCode)) throw", "if (false) throw"),
 ("A3-code-from-body-too", A, "codeMatches(req.headers[ACCESS_CODE_HEADER], cfg.liveAccessCode)", "codeMatches(req.headers[ACCESS_CODE_HEADER] ?? body.access_code, cfg.liveAccessCode)"),
 ("A4-deployed-without-code", A, ": loaded.liveAccessCode === null ? \"code\"", ": false ? \"code\""),
 ("A5-provider-text-kept", A, "for (const e of rc.errors ?? []) e.detail = `attempt failed (${e.class}); it was retried`;", ""),
 ("A6-model-mismatch-ignored", A, "if (!reported.toLowerCase().includes(requested.toLowerCase())) return", "if (false) return"),
 ("A7-store-memory-fallback-on-vercel", A, "(sEnv && deployedLive ? new UpstashRestStore(sEnv.url, sEnv.token) : null)", "(sEnv && deployedLive ? new UpstashRestStore(sEnv.url, sEnv.token) : new MemoryStore(() => clock().getTime()))"),
 ("A8-no-forgive-on-correct", A, "await jobs!.forgiveCode(attempt);", ""),
 ("J1-failed-carries-stored", J, "reason: REASONS[reason_class], result: null });\n    };", "reason: REASONS[reason_class], result: { view: { note: \"recorded real reading\" } } });\n    };"),
 ("J2-lease-short", J, "this.store.setNx(KEYS.slot(i), job.job_id, this.budget.leaseTtlMs)", "this.store.setNx(KEYS.slot(i), job.job_id, 50)"),
 ("J3-queue-unbounded", J, "ahead >= this.budget.maxWaiting + (this.budget.slots - holders.length)", "ahead >= 99"),
 ("J4-queue-by-arrival", J, "await this.store.zadd(KEYS.queue, this.now(), job.job_id);", "await this.store.zadd(KEYS.queue, arrivedAt.getTime(), job.job_id);"),
 ("J5-no-orphan", J, "    if (orphan) {", "    if (false) {"),
 ("J6-deadline-ignored", J, "if (first === \"deadline\") return await fail(\"timeout\");", "if (first === \"deadline\") return;"),
 ("J7-slot-released-at-deadline", J, "      if (first === \"deadline\") return await fail(\"timeout\");", "      if (first === \"deadline\") { await this.store.delIfEquals(KEYS.slot(slot), job.job_id); return await fail(\"timeout\"); }"),
 ("J8-hourly-not-counted", J, "const n = await this.store.incr(KEYS.reads(hourKey(d)), WINDOW_TTL_S);", "const n = 0;"),
 ("L1-deadline-no-margin", L, "deadlineMs: 270_000,", "deadlineMs: 300_000,"),
 ("S1-global-over-limit-counted", S, "if (c <= perClient) return { client: c, global: this.incrNow(global, ttlSeconds), countedGlobal: true };", "return { client: c, global: this.incrNow(global, ttlSeconds), countedGlobal: true };"),
 ("S2-lua-global-over-limit", S, "if c <= tonumber(ARGV[2]) then g = redis.call('incr', KEYS[2])", "if true then g = redis.call('incr', KEYS[2])"),
 ("D1-del-script-always-deletes", S, "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1])", "if true then return redis.call('del', KEYS[1])"),
 ("S3-lua-no-expire", S, "local c = redis.call('incr', KEYS[1]); redis.call('expire', KEYS[1], ARGV[1]);", "local c = redis.call('incr', KEYS[1]);"),
]
env = {k: v for k, v in os.environ.items() if not (k.startswith("MODEL_") or k == "LIVE_ACCESS_CODE")}
out = []
for mid, f, old, new in MUT:
    p = os.path.join(repo, f); t = open(p, encoding="utf-8", newline="").read()
    if old not in t:
        out.append(f"{mid}: NOT APPLIED (anchor missing in {f})"); continue
    open(p, "w", encoding="utf-8", newline="").write(t.replace(old, new, 1))
    b = subprocess.run("npm run build", cwd=repo, env=env, shell=True, capture_output=True, text=True)
    r = subprocess.run("npx vitest run", cwd=repo, env=env, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    summ = [l.strip() for l in r.stdout.splitlines() if "Tests" in l and ("passed" in l or "failed" in l)]
    fails = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith(("×", "×"))]
    out.append(f"{mid}: {'KILLED' if r.returncode else 'SURVIVED'} | {f} | build rc {b.returncode} | {summ[-1] if summ else '?'}")
    out += ["    " + x[:200] for x in fails[:4]]
    subprocess.run(["git", "checkout", "--", f], cwd=repo, check=True)
    print(out[-1 - min(4, len(fails))], flush=True)
subprocess.run("npm run build", cwd=repo, env=env, shell=True, capture_output=True)
st = subprocess.run(["git", "status", "--porcelain"], cwd=repo, capture_output=True, text=True).stdout
out.append(f"clone clean after revert: {st.strip() == ''}")
open(log, "w", encoding="utf-8").write("\n".join(out) + "\n")
