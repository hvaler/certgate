"""Auditor (stage 6, T6-02): scan files and every git blob for the SHA-256 hex (and raw value) of LIVE_ACCESS_CODE,
read from the environment and never printed. Usage: python -I scan_code_digest.py <repo> <dir> [<dir> ...]"""
import hashlib, os, subprocess, sys
code = (os.environ.get("LIVE_ACCESS_CODE") or "").strip()
if not code: sys.exit("LIVE_ACCESS_CODE not set")
needles = {"code value": code.encode(), "sha256 hex": hashlib.sha256(code.encode()).hexdigest().encode(),
           "sha256 hex upper": hashlib.sha256(code.encode()).hexdigest().upper().encode()}
hits = {k: 0 for k in needles}; scanned = 0
repo, dirs = sys.argv[1], sys.argv[2:]
for d in dirs:
    for root, _, files in os.walk(d):
        if "node_modules" in root.split(os.sep): continue
        for f in files:
            try: b = open(os.path.join(root, f), "rb").read()
            except OSError: continue
            scanned += 1
            for k, n in needles.items():
                if n in b: hits[k] += 1
objs = subprocess.run(["git", "-C", repo, "rev-list", "--all", "--objects"], capture_output=True, text=True).stdout.split("\n")
blobs = 0
for line in objs:
    sha = line.split(" ")[0]
    if not sha: continue
    t = subprocess.run(["git", "-C", repo, "cat-file", "-t", sha], capture_output=True, text=True).stdout.strip()
    if t != "blob": continue
    b = subprocess.run(["git", "-C", repo, "cat-file", "-p", sha], capture_output=True).stdout
    blobs += 1
    for k, n in needles.items():
        if n in b: hits[k] += 1
print(f"files scanned {scanned}, blobs scanned {blobs}; " + "; ".join(f"{k}: {v} hit(s)" for k, v in hits.items()))
