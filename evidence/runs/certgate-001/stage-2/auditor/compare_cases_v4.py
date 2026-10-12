"""Auditor (v4, stage 2): compare CLI outputs of every dataset case against the committed expectations (stdlib only).

Usage: python -I compare_cases.py <clone-dir> <outputs-dir>
"""
import json
import re
import sys
from pathlib import Path

repo, outdir = Path(sys.argv[1]), Path(sys.argv[2])
fails, rows = [], []
STATUS = {"ok": "processed", "error": "error"}


def numbers(o, path=""):
    if isinstance(o, bool) or o is None:
        return []
    if isinstance(o, (int, float)):
        return [path]
    if isinstance(o, dict):
        return [p for k, v in o.items() for p in numbers(v, f"{path}.{k}")]
    if isinstance(o, list):
        return [p for i, v in enumerate(o) for p in numbers(v, f"{path}[{i}]")]
    return []


# v4 (stage 2): "token" only as a key/assignment with a non-null value, so the F1 field "tokens_per_second" is not a hit.
SECRET = re.compile(r'(api[_-]?key|secret|password|"token"\s*:\s*"[^"]+"|token=\S+|bearer\s+\S+|sk-[A-Za-z0-9]{8,}|[A-Za-z]:\\\\Users)', re.I)

for f in sorted(outdir.glob("cg-*.json")):
    cid = f.stem
    text = f.read_text(encoding="utf-8")
    out = json.loads(text)
    exp = json.loads((repo / "data/expected" / f"{cid}.json").read_text(encoding="utf-8"))
    s, r = out["summary"], out["receipt"]
    problems = []
    if s["proposal"] != exp["expected_proposal"]:
        problems.append(f"proposal {s['proposal']} != {exp['expected_proposal']}")
    if s["status"] != STATUS[exp["expected_status"]]:
        problems.append(f"status {s['status']} != {exp['expected_status']}")
    missing = [x for x in exp["reasons_must_include"] if x not in s["reasons"]]
    if missing:
        problems.append(f"missing reasons {missing}")
    if s["human_required"] is not True or r["human_required"] is not True:
        problems.append("human_required not true")
    if r["human_decision"] not in (None, {}):
        problems.append("human_decision set without a person")
    if s["proposal"] != r["proposal"]:
        problems.append("summary/receipt proposal differ")
    nums = numbers(r)
    if nums:
        problems.append(f"JSON numbers in receipt {nums[:3]}")
    if r["reading_source"] not in ("mock", "planted"):
        problems.append(f"reading_source {r['reading_source']}")
    if "MOCK" not in r["reader"]["model_id"]:
        problems.append("model_id not labelled MOCK")
    # v3 (candidate 2, F-01 strict): model-output deviations (C8 misread, C10 contamination) and injected reader
    # failures (C11) must all be labelled: reading_source "planted" at top level and in reader, the planted entry
    # listed, and for failures errors[].injected true. cg-022's hostility is in the PDF text layer only.
    failure_case = cid in {f"cg-0{n}" for n in range(23, 28)}
    planted_case = cid in ("cg-018", "cg-021") or failure_case
    if bool(r.get("planted")) != planted_case:
        problems.append(f"planted list {r.get('planted')!r} unexpected")
    want_src = "planted" if planted_case else "mock"
    if r["reading_source"] != want_src or r["reader"]["reading_source"] != want_src:
        problems.append(f"reading_source {r['reading_source']}/{r['reader']['reading_source']} != {want_src}")
    if failure_case:
        errs = r.get("errors") or []
        if not errs or not all(e.get("injected") is True for e in errs) or not any(p.get("kind") == "failure" for p in r["planted"]):
            problems.append(f"injected failure not structurally labelled: errors={errs!r}")
    elif any(e.get("injected") for e in (r.get("errors") or [])):
        problems.append("injected flag on a non-failure case")
    if "MOCK" not in s.get("note", ""):
        problems.append("summary note does not say MOCK")
    if SECRET.search(text):
        problems.append(f"secret-like token: {SECRET.search(text).group(0)}")
    for k in ("propuesta_esperada", "expected_proposal", "reasons_must_include", "correct_reading"):
        if k in text:
            problems.append(f"expectation key {k} in output")
    mark = "PASS" if not problems else "FAIL"
    if problems:
        fails.append(f"{cid}: {problems}")
    rows.append(f"{mark} {cid} {exp['acceptance_cases']} status={s['status']} proposal={s['proposal']} expected={exp['expected_proposal']} reading_source={r['reading_source']} reasons={s['reasons']}")

print("\n".join(rows))
print(f"--- {len(rows) - len(fails)}/{len(rows)} cases pass")
print("\n".join(fails) if fails else "no findings")
sys.exit(1 if fails or len(rows) != 30 else 0)


