"""Auditor (stage 2, B-23): compare regenerated stored stories with the committed ones (stdlib only).

Usage: python -I compare_stories.py <committed-stories-dir> <regenerated-dir>
Excluded keys (volatile by nature): timestamps, run ids and step durations. Everything else must be equal:
proposal, reasons, values, channel checks, rule results, labels without their timestamp.
"""
import json
import re
import sys
from pathlib import Path

VOLATILE = {"created_at", "stored_at", "run_id", "timings_ms", "checked_at", "decided_at", "confirmed_at",
            "duration_ms", "elapsed_ms", "started_at", "finished_at"}
TS = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z")


def norm(o):
    if isinstance(o, dict):
        return {k: norm(v) for k, v in o.items() if k not in VOLATILE}
    if isinstance(o, list):
        return [norm(v) for v in o]
    if isinstance(o, str):
        return TS.sub("<ts>", o)
    return o


def diff(a, b, path=""):
    if type(a) is not type(b):
        return [f"{path}: type {type(a).__name__} != {type(b).__name__}"]
    if isinstance(a, dict):
        out = []
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                out.append(f"{path}.{k}: only in {'committed' if k in a else 'regenerated'}")
            else:
                out += diff(a[k], b[k], f"{path}.{k}")
        return out
    if isinstance(a, list):
        if len(a) != len(b):
            return [f"{path}: length {len(a)} != {len(b)}"]
        return [d for i, (x, y) in enumerate(zip(a, b)) for d in diff(x, y, f"{path}[{i}]")]
    return [] if a == b else [f"{path}: {a!r} != {b!r}"]


committed, regen = Path(sys.argv[1]), Path(sys.argv[2])
bad = 0
for cid in ("cg-001", "cg-002", "cg-003"):
    a = json.loads((committed / f"{cid}.json").read_text(encoding="utf-8"))
    b = json.loads((regen / f"{cid}.json").read_text(encoding="utf-8"))
    d = diff(norm(a), norm(b))
    ra, rb = a["view"]["receipt"], b["view"]["receipt"]
    ts_ok = a["stored_at"] == ra["created_at"] and a["stored_at"] in a["stored_label"]
    print(f"{cid}: committed created_at={ra['created_at']} stored_at={a['stored_at']} label_has_ts={a['stored_at'] in a['stored_label']} "
          f"| regenerated created_at={rb['created_at']} | proposal {ra['proposal']} == {rb['proposal']} | "
          f"differences outside volatile keys: {len(d)} | stored_at==created_at: {ts_ok}")
    for x in d[:20]:
        print("   ", x)
    bad += len(d) + (0 if ts_ok else 1)
print("RESULT", "EQUAL" if bad == 0 else f"{bad} problem(s)")
sys.exit(1 if bad else 0)
