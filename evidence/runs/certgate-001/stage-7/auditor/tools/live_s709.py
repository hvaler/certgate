"""Auditor (stage 7, S7-09 / T7-02 live / T7-07 live): read-only GET checks of the deployed site. No reading, no code.
  python -I live_s709.py <site> <repo> <candidate-commit> <readme-commit> <out-log>
"""
import hashlib, json, re, subprocess, sys, time, urllib.request, urllib.error
site, repo, cand, readme_commit, out = sys.argv[1].rstrip("/"), sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
log = []
def say(s): log.append(s); print(s, flush=True)
def get(url, method="GET"):
    req = urllib.request.Request(url, method=method, headers={"user-agent": "certgate-auditor/1"})
    try:
        r = urllib.request.urlopen(req, timeout=60); return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()
    except Exception as e:
        return None, {}, str(e).encode()
def git_show(path): return subprocess.run(["git", "-C", repo, "show", f"{cand}:{path}"], capture_output=True).stdout
say(f"S7-09 live GET checks on {site} at {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}; candidate {cand}; README at {readme_commit}")
# 1. Served app files equal the candidate (deployment identity)
for f in ["index.html", "app.js", "labels.js", "styles.css", "figures.json", "stories/cg-001.json", "stories/cg-002.json", "stories/cg-003.json"]:
    st, _, b = get(f"{site}/{f}")
    say(f"/{f} {st} {'MATCH' if hashlib.sha256(b).digest() == hashlib.sha256(git_show('public/' + f)).digest() else 'DIFF'}")
# 2. Originals: allow-listed ids
for i in ["cg-001", "cg-002", "cg-003", "cg-004", "cg-005", "cg-010"]:
    st, h, b = get(f"{site}/api/originals/{i}")
    ok = hashlib.sha256(b).hexdigest() == hashlib.sha256(git_show(f"data/previews/{i}.png")).hexdigest()
    say(f"/api/originals/{i} {st} {h.get('Content-Type') or h.get('content-type')} nosniff={(h.get('X-Content-Type-Options') or h.get('x-content-type-options'))} bytes={'MATCH data/previews' if ok else 'DIFF'}")
# 3. Refusals
bad = ["cg-020", "cg-017", "CG-003", "cg-003.png", "cg-0031", "..", "%2e%2e", "..%2fpackage.json", "%2e%2e%2fpackage.json", "..%5cpackage.json",
       "%00", "__proto__", "constructor", "cg-003%2fcase.json", "cg-003/case.json"]
for i in bad:
    st, h, _ = get(f"{site}/api/originals/{i}")
    say(f"/api/originals/{i} -> {st}")
for path in ["/api/originals/../../package.json", "/api/originals/by-certificate/" + "0" * 64, "/api/originals/by-certificate/../cg-003"]:
    st, _, _ = get(site + path); say(f"{path} -> {st}")
# 4. by-certificate: sample hashes 200, story hashes 404
for i in ["cg-004", "cg-005", "cg-010", "cg-001", "cg-003"]:
    sha = hashlib.sha256(git_show(f"data/cases/{i}/certificate.pdf")).hexdigest()
    st, _, b = get(f"{site}/api/originals/by-certificate/{sha}")
    say(f"/api/originals/by-certificate/<sha256 of {i}> -> {st}{' bytes=' + ('MATCH' if hashlib.sha256(b).hexdigest() == hashlib.sha256(git_show(f'data/previews/{i}.png')).hexdigest() else 'DIFF') if st == 200 else ''}")
# 5. Recorded flag on the story JSON and evaluate
for i in ["cg-001", "cg-002", "cg-003"]:
    st, _, b = get(f"{site}/stories/{i}.json"); j = json.loads(b); v = j.get("view", j)
    keys = list(v.keys()); k = keys.index("reading_source") if "reading_source" in keys else -1
    say(f"/stories/{i}.json recorded={v.get('recorded')} recorded_at={v.get('recorded_at')} next_to_reading_source={keys[k+1:k+3] if k >= 0 else None}")
req = urllib.request.Request(f"{site}/api/stories/cg-003/evaluate", data=b"{}", method="POST", headers={"content-type": "application/json"})
j = json.loads(urllib.request.urlopen(req, timeout=60).read()); v = j["view"]
say(f"POST cg-003 evaluate: proposal={v.get('proposal')} reading_source={v.get('reading_source')} recorded={v.get('recorded')} recorded_at={v.get('recorded_at')}")
# 6. README links (as published on GitHub at readme_commit): relative -> raw.githubusercontent; absolute -> as is
readme = subprocess.run(["git", "-C", repo, "show", f"{readme_commit}:README.md"], capture_output=True, text=True, encoding="utf-8").stdout
links = sorted(set(re.findall(r'\]\(([^)\s]+)\)', readme)) | set(re.findall(r'src="([^"]+)"', readme)))
fails = 0
for l in links:
    if l.startswith("#") or l.startswith("mailto:"): continue
    url = l if l.startswith("http") else f"https://raw.githubusercontent.com/hvaler/certgate/{readme_commit}/{l.split('#')[0]}"
    if "localhost" in url or "127.0.0.1" in url: continue
    st, _, _ = get(url)
    if st != 200: fails += 1
    say(f"README link {l} -> {st}")
for u in sorted(set(re.findall(r"https://[^\s)`\"<>,]+", readme))):
    if u.rstrip(".") in links: continue
    st, _, _ = get(u.rstrip("."), "GET"); say(f"README URL {u.rstrip('.')} -> {st}")
    if st != 200: fails += 1
say(f"README links/URLs not answering 200: {fails}")
open(out, "w", encoding="utf-8").write("\n".join(log) + "\n")
