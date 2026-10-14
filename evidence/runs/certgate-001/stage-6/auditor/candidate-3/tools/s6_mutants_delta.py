"""Auditor (stage 6, candidate 3): independent mutants of the Stage 6 guards, each a single textual replacement,
full suite after `npm run build`, reverted with git checkout. Usage: python -I s6_mutants.py <clone> <log>"""
import subprocess, sys, os
repo, log = sys.argv[1], sys.argv[2]
J, A, L, S = "src/web/live-jobs.ts", "src/web/app.ts", "src/web/limits.ts", "src/web/live-store.ts"
MUT = [
 ("A1-lockout-ignored", A, "if (attempt.over) throw new HttpError(429", "if (false) throw new HttpError(429"),
 ("A2-code-bypass", A, "if (!codeMatches(req.headers[ACCESS_CODE_HEADER], cfg.liveAccessCode)) {", "if (false) {"),
 ("A8-no-forgive-on-correct", A, "await jobs!.forgiveCode(attempt);", ""),
 ("D1-del-script-always-deletes", S, "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1])", "if true then return redis.call('del', KEYS[1])"),
 ("K1-key-from-xff", A, 'String(req.headers["x-vercel-forwarded-for"] ?? "")', 'String(req.headers["x-forwarded-for"] ?? "").split(",")[0]!'),
 ("K1b-key-from-x-real-ip", A, 'String(req.headers["x-vercel-forwarded-for"] ?? "")', 'String(req.headers["x-real-ip"] ?? "")'),
 ("K1c-container-trusts-header", A, ': req.socket.remoteAddress || "unknown";', ': String(req.headers["x-forwarded-for"] ?? "") || req.socket.remoteAddress || "unknown";'),
 ("K2-global-before-compare", A, "const attempt = await jobs!.countCodeAttempt(client, cfg.liveCodeFailuresPerHour);", "const attempt = await jobs!.countCodeAttempt(client, cfg.liveCodeFailuresPerHour); await jobs!.recordCodeFailure(attempt);"),
 ("K2b-global-also-on-correct", A, "      await jobs!.forgiveCode(attempt);", "      await jobs!.recordCodeFailure(attempt); await jobs!.forgiveCode(attempt);"),
 ("K3-global-ceiling-blocks-correct", J, "return { over: perClient <= 0 || n > perClient,", "return { over: perClient <= 0 || n > perClient || Number((await this.store.get(keys.global)) ?? 0) >= 3,"),
 ("K4-wrong-code-not-counted-globally", A, "        await jobs!.recordCodeFailure(attempt);\n", ""),
 ("K5-incr-two-requests", S, 'const [n] = await this.multi([["INCR", key], ["EXPIRE", key, ttlSeconds]]);', 'const n = await this.cmd("INCR", key); await this.cmd("EXPIRE", key, ttlSeconds);'),
 ("K6-kv-fallback-dropped", S, "const url = pick(env.UPSTASH_REDIS_REST_URL, env.KV_REST_API_URL);", "const url = pick(env.UPSTASH_REDIS_REST_URL, undefined);"),
]
env = {k: v for k, v in os.environ.items() if not (k.startswith("MODEL_") or k == "LIVE_ACCESS_CODE")}
out = []
for mid, f, old, new in MUT:
    p = os.path.join(repo, f); t = open(p, encoding="utf-8", newline="").read()
    if old not in t:
        out.append(f"{mid}: NOT APPLIED (anchor missing in {f})"); continue
    open(p, "w", encoding="utf-8", newline="").write(t.replace(old, new, 1))
    b = subprocess.run("npm run build", cwd=repo, env=env, shell=True, capture_output=True, text=True)
    r = subprocess.run("npx vitest run --maxWorkers=4", cwd=repo, env=env, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
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
