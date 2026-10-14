"""Auditor (stage 6, S6-13): live DEPLOY.md checks against the deployed site, under the auditor's announced lease.

  python -I live_checks.py <site-url> <repo> <pushed-commit> <out-dir> [--read]

LIVE_ACCESS_CODE, MODEL_BASE_URL and MODEL_API_KEY are read from the environment and are NEVER printed or written: every
saved response is scanned for them (raw value and SHA-256 hex) before it is stored. Without --read, only GETs and the
two refusal attempts are made; with --read, one real live reading of the sample cg-004 is made through the site.
Wrong-code budget: exactly 2 failure units are spent (one request with no code, one with a wrong code).
"""
import base64, hashlib, json, os, subprocess, sys, time, urllib.request, urllib.error
site, repo, commit, out = sys.argv[1].rstrip("/"), sys.argv[2], sys.argv[3], sys.argv[4]
do_read = "--read" in sys.argv
os.makedirs(out, exist_ok=True)
CODE = (os.environ.get("LIVE_ACCESS_CODE") or "").strip()
KEY = os.environ.get("MODEL_API_KEY") or ""
BASE = (os.environ.get("MODEL_BASE_URL") or "").rstrip("/")
assert CODE and KEY and BASE, "LIVE_ACCESS_CODE / MODEL_* missing"
secrets = [CODE.encode(), hashlib.sha256(CODE.encode()).hexdigest().encode(), KEY.encode()]
hostpath = BASE.split("://", 1)[1]
if "/" in hostpath: secrets.append(hostpath.encode())  # host alone is allowed; host+path is not
log, leaks, exchanges = [], [], 0

def now(): return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
def say(s): log.append(s); print(s, flush=True)

def http(method, path, body=None, headers=None, raw=False, url=None):
    global exchanges
    u = url or site + path
    data = None if body is None else (body if isinstance(body, bytes) else json.dumps(body).encode())
    h = {"content-type": "application/json"} if data is not None else {}
    h.update(headers or {})
    req = urllib.request.Request(u, data=data, method=method, headers=h)
    try:
        r = urllib.request.urlopen(req, timeout=60); status, hdrs, b = r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        status, hdrs, b = e.code, dict(e.headers), e.read()
    exchanges += 1
    blob = b + json.dumps(hdrs).encode()
    for s in secrets:
        if s and s in blob: leaks.append(f"{method} {path}: a secret value or digest appeared")
    if raw: return status, hdrs, b
    try: j = json.loads(b)
    except Exception: j = None
    return status, hdrs, j

def save(name, obj):
    t = json.dumps(obj, indent=1, ensure_ascii=False)
    for s in secrets:
        assert s.decode(errors="ignore") not in t, "refusing to save a secret"
    open(os.path.join(out, name), "w", encoding="utf-8").write(t)

def git(*a): return subprocess.run(["git", "-C", repo, *a], capture_output=True, text=True).stdout
say(f"S6-13 live checks on {site} at {now()}; GitHub main = {git('ls-remote', 'https://github.com/hvaler/certgate', 'refs/heads/main').split()[0] if True else ''}; expected pushed commit {commit}")

# 1. Routes and status
st, _, health = http("GET", "/health"); say(f"GET /health {st}: {health}")
st, _, f1 = http("GET", "/api/f1"); save("f1.json", f1); say(f"GET /api/f1 {st}: state={f1.get('state')} model_reported={f1.get('model_reported')} latency_ms={f1.get('latency_ms')} checked_at={f1.get('checked_at')}")
st, _, s0 = http("GET", "/api/live/status"); save("status-before.json", s0)
say(f"GET /api/live/status {st}: enabled={s0.get('enabled')} access_code_required={s0.get('access_code_required')} scope_note={s0.get('scope_note')!r} model_requested={s0.get('model_requested')} used={s0.get('used_this_hour')} in_flight={s0.get('in_flight')} waiting={s0.get('waiting')} codefail client/global={s0.get('code_failures_this_hour_this_client')}/{s0.get('code_failures_this_hour_global')} limit/ceiling={s0.get('code_failure_limit_per_client')}/{s0.get('code_failure_ceiling_global')}")

# 2. Static assets: 200 and byte-equal to the committed public/ at the pushed commit
for f in ["index.html", "app.js", "labels.js", "styles.css", "figures.json", "stories/cg-001.json", "stories/cg-002.json", "stories/cg-003.json", "stories/cg-003.recording.json"]:
    st, _, b = http("GET", "/" + f, raw=True)
    committed = subprocess.run(["git", "-C", repo, "show", f"{commit}:public/{f}"], capture_output=True).stdout
    say(f"/{f} {st} {'MATCH' if hashlib.sha256(b).hexdigest() == hashlib.sha256(committed).hexdigest() else 'DIFF'} {hashlib.sha256(b).hexdigest()[:16]}")
st, _, ev = http("POST", "/api/stories/cg-003/evaluate", {}); say(f"POST cg-003 evaluate {st}: proposal={(ev or {}).get('view', {}).get('proposal') or (ev or {}).get('summary', {}).get('proposal')} note={(ev or {}).get('note', '')[:90]}")

# 3. Samples
st, _, sm = http("GET", "/api/samples"); save("samples.json", sm)
ids = [x["id"] for x in sm["samples"]]; say(f"GET /api/samples {st}: {ids}")
c4 = next(x for x in sm["samples"] if x["id"] == "cg-004")
st, _, pdf = http("GET", c4["certificate"], raw=True)
data_pdf = subprocess.run(["git", "-C", repo, "show", f"{commit}:data/cases/cg-004/certificate.pdf"], capture_output=True).stdout
say(f"cg-004 certificate {st}: sha256 {hashlib.sha256(pdf).hexdigest()[:16]} == listed {c4['certificate_sha256'][:16]} == data/ {hashlib.sha256(data_pdf).hexdigest()[:16]}")
st, _, csv = http("GET", c4["delivery_note"], raw=True); say(f"cg-004 delivery note {st}: {len(csv)} bytes")
job_body = {"certificate_base64": base64.b64encode(pdf).decode(), "delivery_csv": csv.decode("utf-8"), "delivery_line": c4["delivery_line"], "synthetic_confirmed": True}

# 4. Refusals (exactly 2 failure units): no code, then a wrong code
st, _, r1 = http("POST", "/api/live/jobs", job_body); say(f"POST /api/live/jobs without code: {st} {(r1 or {}).get('error')}")
st, _, r2 = http("POST", "/api/live/jobs", job_body, {"x-live-access-code": "auditor-wrong-code-0000"}); say(f"POST /api/live/jobs with a wrong code: {st} {(r2 or {}).get('error')}")
st, _, s1 = http("GET", "/api/live/status"); save("status-after-refusals.json", s1)
say(f"after refusals: codefail client/global {s0.get('code_failures_this_hour_this_client')}->{s1.get('code_failures_this_hour_this_client')} / {s0.get('code_failures_this_hour_global')}->{s1.get('code_failures_this_hour_global')}; used {s0.get('used_this_hour')}->{s1.get('used_this_hour')}")

if do_read:
    # 5. Usage before, then one real reading through the site, then usage after
    st, _, ub = http("GET", "", url=BASE + "/usage", headers={"authorization": "Bearer " + KEY}); save("usage-before.json", ub)
    say(f"GET /usage before {st}: used {ub.get('daily_cost_used_usd')} remaining {ub.get('daily_cost_remaining_usd')}")
    counts_before = [http("GET", "/api/live/status")[2].get("used_this_hour") for _ in range(10)]
    say(f"10 status GETs before the reading: used_this_hour = {counts_before}")
    t0 = time.time()
    st, _, job = http("POST", "/api/live/jobs", job_body, {"x-live-access-code": CODE}); save("job-post.json", job)
    say(f"POST /api/live/jobs with the code: {st} {job}")
    states, last = [], None
    while time.time() - t0 < 320:
        time.sleep(2)
        st, _, v = http("GET", job["poll"])
        key = (v.get("state"), v.get("position"))
        if key != last: states.append(f"{round(time.time() - t0)}s {v.get('state')} pos={v.get('position')} elapsed_s={v.get('elapsed_s')}"); last = key
        if v.get("state") in ("done", "failed"): break
    save("job-final.json", v)
    say("job states: " + " | ".join(states))
    say(f"final: state={v.get('state')} reason_class={v.get('reason_class')} reason={v.get('reason')}")
    if v.get("state") == "done":
        res = v["result"]; rc = res["view"]["receipt"]; rd = rc.get("reader", {})
        f1s = rc.get("f1") or {}
        say(f"receipt: reading_source={rc.get('reading_source')} mode={rc.get('mode')} reader.model_id={rd.get('model_id')} requested={rd.get('requested_model_id')} status={rc.get('status')} proposal={rc.get('proposal')} job_id_in_result={res.get('job_id') == job['job_id']}")
        say(f"F1 snapshot in receipt: state={f1s.get('state')} model_reported={f1s.get('model_reported')} latency_ms={f1s.get('latency_ms')} checked_at={f1s.get('checked_at')}")
        say(f"case expected proposal (dataset): {json.loads(subprocess.run(['git', '-C', repo, 'show', f'{commit}:data/cases/cg-004/case.json'], capture_output=True, text=True).stdout).get('expected_proposal')}")
    time.sleep(3)
    counts_after = [http("GET", "/api/live/status")[2].get("used_this_hour") for _ in range(10)]
    say(f"10 status GETs after the reading: used_this_hour = {counts_after}")
    st, _, ua = http("GET", "", url=BASE + "/usage", headers={"authorization": "Bearer " + KEY}); save("usage-after.json", ua)
    say(f"GET /usage after {st}: used {ua.get('daily_cost_used_usd')} delta {round(float(ua.get('daily_cost_used_usd', 0)) - float(ub.get('daily_cost_used_usd', 0)), 10)}")

st, _, sz = http("GET", "/api/live/status"); save("status-final.json", sz)
say(f"secret scan over {exchanges} exchanges (bodies and headers; code value, code SHA-256, key, base URL host+path): {len(leaks)} hit(s) {leaks}")
open(os.path.join(out, "live-checks.log"), "w", encoding="utf-8").write("\n".join(log) + "\n")
