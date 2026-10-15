"""Auditor (stage 7, T7-05 + candidate-3 scope): checks a docs/tools candidate's screenshots and manifest.
  python -I check_t705.py <repo> <candidate> <base-candidate> <deployed-commit> <out-log>
The access code is read from the user-level registry by the caller (env LIVE_ACCESS_CODE) and never printed."""
import hashlib, json, os, re, struct, subprocess, sys
repo, cand, base, deployed, out = sys.argv[1:6]
log = []
def say(s): log.append(s); print(s, flush=True)
def git(*a, text=True): return subprocess.run(["git", "-C", repo, *a], capture_output=True, text=text, encoding="utf-8" if text else None).stdout
code = (os.environ.get("LIVE_ACCESS_CODE") or "").strip()
key = os.environ.get("MODEL_API_KEY") or ""
base_url = (os.environ.get("MODEL_BASE_URL") or "").rstrip("/")
secrets = [s.encode() for s in [code, hashlib.sha256(code.encode()).hexdigest() if code else "", key] if s]
hp = base_url.split("://", 1)[-1]
if "/" in hp: secrets.append(hp.encode())
say(f"T7-05 check of {cand} (base {base}, deployed {deployed}); secrets checked: code value + code sha256 + key + base-URL path ({len(secrets)} needles)")
# 1. scope
changed = git("diff", "--name-status", base, cand, "--", ".", ":!evidence").strip().splitlines()
product = [l for l in changed if re.search(r"\t(src/|api/|public/|data/|config/|evaluation/|vercel\.json|package|Dockerfile)", l)]
say(f"files changed outside evidence: {len(changed)}; product files among them: {product or 'none'}")
for l in changed: say("  " + l)
# 2. forbidden artefacts anywhere in the candidate tree
tree = git("ls-tree", "-r", "--name-only", cand).splitlines()
bad = [p for p in tree if re.search(r"\.(har|webm|trace|zip)$|trace\.json$|/traces?/", p)]
say(f"HAR/trace/video files in tree: {bad or 'none'}")
# 3. screenshots and manifest
shots = [p for p in tree if p.startswith("docs/screenshots/") and p.endswith(".png")]
say(f"screenshots: {len(shots)}")
man = json.loads(git("show", f"{cand}:docs/screenshots/manifest.json"))
say("manifest keys: " + ", ".join(man.keys()))
blob = json.dumps(man).encode()
say(f"manifest secret hits: {sum(1 for s in secrets if s in blob)}")
site_commit = man.get("site_commit") or man.get("commit")
say(f"manifest site commit: {site_commit} (deployed {deployed}: {'MATCH' if site_commit and deployed.startswith(site_commit[:7]) else 'MISMATCH'})")
served = man.get("served") or man.get("served_files") or {}
mism = 0
for f, h in (served.items() if isinstance(served, dict) else []):
    committed = subprocess.run(["git", "-C", repo, "show", f"{deployed}:public/{f.lstrip('/')}" if not f.startswith("public/") else f"{deployed}:{f}"], capture_output=True).stdout
    ok = hashlib.sha256(committed).hexdigest() == (h if isinstance(h, str) else h.get("sha256"))
    mism += 0 if ok else 1
    say(f"  served {f}: {'MATCH' if ok else 'DIFF'}")
say(f"served-file manifest mismatches vs {deployed}: {mism}")
for p in shots:
    b = subprocess.run(["git", "-C", repo, "show", f"{cand}:{p}"], capture_output=True).stdout
    i, chunks = 8, []
    while i < len(b):
        n = struct.unpack(">I", b[i:i + 4])[0]; t = b[i + 4:i + 8]
        if t in (b"tEXt", b"iTXt", b"zTXt"): chunks.append(t.decode())
        i += 12 + n
    hits = sum(1 for s in secrets if s in b)
    say(f"  {p}: {len(b)} bytes, text chunks {chunks or 'none'}, byte-level secret hits {hits}")
# 4. README captions
readme = git("show", f"{cand}:README.md")
sec = readme[readme.find("## Screenshots"):]
sec = sec[:sec.find("\n## ", 5)] if "\n## " in sec[5:] else sec
say(f"README screenshot section names {deployed[:7]}: {deployed[:7] in sec}; ISO times present: {len(re.findall(r'20\d\d-\d\d-\d\dT\d\d:\d\d', sec))}")
say(f"README screenshot section secret hits: {sum(1 for s in secrets if s in sec.encode())}")
for kw in ["endpoint_5xx", "05:15", "not shown", "queued", "done"]:
    say(f"  README screenshot section mentions '{kw}': {kw in sec}")
open(out, "w", encoding="utf-8").write("\n".join(log) + "\n")
