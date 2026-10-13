"""Auditor (stage 4, S4-05 / R4.3 F-02): independent check that every proof cited in CLAIMS.md exists at this commit.

Usage: python -I check_claims.py <repo> [<vitest-json-report>]
- test:<file>::<fragment> must name an existing test file containing an it()/test() title with that fragment;
  with a vitest JSON report, the matching test must have passed (not skipped).
- file:/evidence:<path> must exist.
"""
import json
import os
import re
import sys

repo = sys.argv[1]
report = json.load(open(sys.argv[2], encoding="utf-8")) if len(sys.argv) > 2 else None
passed = set()
if report:
    for f in report.get("testResults", []):
        for a in f.get("assertionResults", []):
            if a.get("status") == "passed":
                passed.add((os.path.normpath(f["name"]).lower(), a.get("fullName") or a.get("title")))

rows = [l for l in open(os.path.join(repo, "CLAIMS.md"), encoding="utf-8") if re.match(r"\| C-\d+ \|", l)]
problems, n_proofs = [], 0
for r in rows:
    cells = [c.strip() for c in r.strip().strip("|").split("|")]
    cid, proofs = cells[0], cells[-1]
    for p in [x.strip() for x in proofs.split(";") if x.strip()]:
        n_proofs += 1
        kind, _, rest = p.partition(":")
        if kind == "test":
            tfile, _, frag = rest.partition("::")
            path = os.path.join(repo, tfile)
            if not os.path.isfile(path):
                problems.append(f"{cid}: test file missing {tfile}")
                continue
            src = open(path, encoding="utf-8").read()
            titles = re.findall(r"\b(?:it|test)(?:\.\w+)?\(\s*([\"'`])(.*?)\1", src, re.S)
            descr = re.findall(r"\bdescribe(?:\.\w+)?\(\s*([\"'`])(.*?)\1", src, re.S)
            hit = [t for _, t in titles if frag in t] or [t for _, t in descr if frag in t]
            if not hit:
                problems.append(f"{cid}: no test title containing {frag!r} in {tfile}")
            elif report:
                full = os.path.normpath(os.path.abspath(path)).lower()
                if not any(fp == full and frag in (name or "") for fp, name in passed):
                    problems.append(f"{cid}: test {frag!r} in {tfile} not found among PASSED tests of the report")
        elif kind in ("file", "evidence"):
            if not os.path.exists(os.path.join(repo, rest)):
                problems.append(f"{cid}: {kind} path missing {rest}")
        else:
            problems.append(f"{cid}: unknown proof kind {p!r}")
print(json.dumps({"rows": len(rows), "proofs": n_proofs, "problems": problems}, indent=1, ensure_ascii=False))
