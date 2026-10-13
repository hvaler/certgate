"""Auditor (stage 4, S4-09 / S4-12): scan for secret values and user-profile paths (stdlib only).

Usage:
  python -I scan_secrets.py history <repo>      every blob reachable from any ref (the repository is public)
  python -I scan_secrets.py tree <dir> [...]    every file under one or more directories (head tree, dist/, image fs)

Secret values come from the environment (MODEL_API_KEY; MODEL_BASE_URL host+path) and are never printed. The bare host
name is allowed by the dispatch and is not a finding. User-profile paths (C:\\Users\\..., C:/Users/...) are reported
separately (R4.2 E-04). The jury-code-77 fixture is reported with its locations (allowed only in tests/fixtures).
"""
import os
import re
import subprocess
import sys

key = os.environ.get("MODEL_API_KEY") or ""
base = (os.environ.get("MODEL_BASE_URL") or "").rstrip("/")
if not key or not base:
    sys.exit("MODEL_API_KEY / MODEL_BASE_URL missing: cannot scan for their values")
base_hostpath = base.split("://", 1)[1]
host = base_hostpath.split("/", 1)[0]
path_part = base_hostpath[len(host):]
needles = {"MODEL_API_KEY value": key.encode()}
# the base URL counts as a finding only with its path (host alone is allowed)
if path_part not in ("", "/"):
    needles["MODEL_BASE_URL host+path value"] = base_hostpath.encode()
access = os.environ.get("LIVE_ACCESS_CODE") or ""
if access:
    needles["LIVE_ACCESS_CODE value"] = access.encode()
# R4.3 F-07: user-profile paths in any spelling; the local user name and operator e-mail come from the environment
# (AUDIT_LOCAL_USER, AUDIT_OPERATOR_EMAIL) so that they are never written into this committed script.
user_path = re.compile(rb"([A-Za-z]:(\\\\|\\|/)+Users(\\\\|\\|/))|(/c/Users/)", re.I)
extra_ids = [v.encode() for v in (os.environ.get("AUDIT_LOCAL_USER"), os.environ.get("AUDIT_OPERATOR_EMAIL")) if v]
# R4.3 F-04 generic patterns (counted, never printed)
generic = {
    "Bearer token-like": re.compile(rb"Bearer\s+[A-Za-z0-9._\-]{20,}"),
    "sk- key-like": re.compile(rb"\bsk-[A-Za-z0-9]{16,}"),
    "KEY/TOKEN/SECRET = long value": re.compile(rb"(?i)(api[_-]?key|token|secret)[\"']?\s*[:=]\s*[\"']?[A-Za-z0-9+/_\-]{24,}"),
}
fixture = b"jury-code-77"
generic_hits = {k: [] for k in generic}
id_hits = []

found = {k: [] for k in needles}
paths, fixtures = [], []
count = 0


def check(name, data):
    global count
    count += 1
    for label, n in needles.items():
        if n in data:
            found[label].append(name)
    if user_path.search(data):
        paths.append(name)
    if any(v in data for v in extra_ids):
        id_hits.append(name)
    for label, rx in generic.items():
        if rx.search(data):
            generic_hits[label].append(name)
    if fixture in data:
        fixtures.append(name)


mode = sys.argv[1]
if mode == "history":
    repo = sys.argv[2]
    objs = subprocess.run(["git", "-C", repo, "rev-list", "--all", "--objects"], capture_output=True, check=True).stdout.decode().splitlines()
    seen = set()
    names = {}
    for line in objs:
        sha, _, name = line.partition(" ")
        names.setdefault(sha, name)
    batch = subprocess.run(["git", "-C", repo, "cat-file", "--batch-check=%(objectname) %(objecttype)"], input="\n".join(names).encode(), capture_output=True, check=True).stdout.decode().splitlines()
    blobs = [l.split()[0] for l in batch if l.endswith(" blob")]
    p = subprocess.Popen(["git", "-C", repo, "cat-file", "--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    for sha in blobs:
        p.stdin.write(sha.encode() + b"\n"); p.stdin.flush()
        header = p.stdout.readline().split()
        size = int(header[2])
        data = p.stdout.read(size); p.stdout.read(1)
        check(f"{names.get(sha, '?')}@{sha[:10]}", data)
    p.stdin.close(); p.wait()
else:
    for root in sys.argv[2:]:
        for dp, dn, fn in os.walk(root):
            dn[:] = [d for d in dn if d not in (".git",)]
            for f in fn:
                fp = os.path.join(dp, f)
                try:
                    with open(fp, "rb") as fh:
                        check(os.path.relpath(fp, root), fh.read())
                except OSError:
                    pass

print(f"mode={mode} objects_scanned={count}")
for label, hits in found.items():
    print(f"{label}: {len(hits)} hit(s)" + ("" if not hits else " -> " + ", ".join(sorted(set(hits))[:50])))
print(f"LIVE_ACCESS_CODE: {'scanned' if access else 'not set on this host: cannot be scanned for'}")
for label, hits in generic_hits.items():
    print(f"generic {label}: {len(set(hits))} file(s)" + ("" if not hits else " -> " + ", ".join(sorted(set(hits))[:40])))
print(f"local user name / operator e-mail: {len(set(id_hits))} file(s)" + ("" if not id_hits else " -> " + ", ".join(sorted(set(id_hits))[:60])))
print(f"user-profile paths: {len(set(paths))} file(s)" + ("" if not paths else " -> " + ", ".join(sorted(set(paths))[:80])))
print(f"jury-code-77 fixture: {len(set(fixtures))} file(s)" + ("" if not fixtures else " -> " + ", ".join(sorted(set(fixtures))[:80])))
