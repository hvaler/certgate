"""Auditor's independent dataset check for certgate-001 Stage 1 (stdlib only, exact Decimal).

Usage: python -I audit_dataset.py <clone-dir> <mini-prueba-dir>
Prints a report; exit 1 when any hard check fails.
"""
import csv
import hashlib
import json
import sys
from decimal import ROUND_HALF_EVEN, Decimal
from pathlib import Path

repo, origin = Path(sys.argv[1]), Path(sys.argv[2])
data = repo / "data"
fail = []
info = []


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


# 1. checksums file
for line in (data / "CHECKSUMS.sha256").read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"):
        continue
    h, name = line.split(None, 1)
    name = name.lstrip("*").strip()
    p = repo / name if (repo / name).exists() else data / name
    if not p.exists():
        fail.append(f"CHECKSUMS: missing file {name}")
    elif sha(p) != h:
        fail.append(f"CHECKSUMS: mismatch {name}")
listed = len([l for l in (data / "CHECKSUMS.sha256").read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")])
info.append(f"CHECKSUMS entries verified: {listed}")

# 2. pre-kickoff copies byte-identical
pairs = {
    "origin/mini-prueba/cert-01-digital-conforme.pdf": "cert-01-digital-conforme.pdf",
    "origin/mini-prueba/cert-02-escaneado-fuera-especificacion.pdf": "cert-02-escaneado-fuera-especificacion.pdf",
    "origin/mini-prueba/cert-03-escaneado-ambiguo.pdf": "cert-03-escaneado-ambiguo.pdf",
    "origin/mini-prueba/esperado.json": "esperado.json",
    "origin/mini-prueba/especificacion-ESP-014.json": "especificacion-ESP-014.json",
    "origin/mini-prueba/albaran-ALB-2026-0917.csv": "albaran-ALB-2026-0917.csv",
    "origin/mini-prueba/generar.py": "generar.py",
    "origin/mini-prueba/README.md": "README.md",
}
for mine, src in pairs.items():
    if sha(data / mine) != sha(origin / src):
        fail.append(f"ORIGIN: {mine} differs from planning workspace {src}")
for i, src in ((1, "cert-01-digital-conforme.pdf"), (2, "cert-02-escaneado-fuera-especificacion.pdf"), (3, "cert-03-escaneado-ambiguo.pdf")):
    if sha(data / "cases" / f"cg-00{i}" / "certificate.pdf") != sha(origin / src):
        fail.append(f"ORIGIN: cg-00{i} certificate differs from {src}")
if (data / "delivery/ALB-2026-0917.csv").read_bytes() != (origin / "albaran-ALB-2026-0917.csv").read_bytes():
    info.append("NOTE: data/delivery/ALB-2026-0917.csv is not byte-identical to the mini-prueba CSV")


# 3. JSON numeric literals anywhere in dataset JSON (S1-25 / A-15)
def walk(o, path, hits):
    if isinstance(o, bool) or o is None:
        return
    if isinstance(o, (int, float)):
        hits.append(path)
    elif isinstance(o, dict):
        for k, v in o.items():
            walk(v, f"{path}.{k}", hits)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            walk(v, f"{path}[{i}]", hits)


for p in sorted(data.rglob("*.json")):
    hits = []
    walk(json.loads(p.read_text(encoding="utf-8"), parse_float=float, parse_int=int), "", hits)
    if hits:
        fail.append(f"JSON-NUMBER: {p.relative_to(repo)} at {hits[:5]}")

# 4. expectations vs register R1.5 mapping
R15 = {
    "cg-001": "release", "cg-004": "release", "cg-002": "block", "cg-005": "block", "cg-006": "block", "cg-007": "block",
    "cg-008": "release", "cg-009": "release", "cg-010": "review", "cg-011": "review", "cg-012": "block",
    "cg-013": "review", "cg-015": "review", "cg-014": None, "cg-003": "review", "cg-016": "review", "cg-017": "review",
    "cg-018": "review", "cg-019": "review", "cg-020": "block", "cg-021": "block", "cg-022": "review",
    "cg-023": "review", "cg-024": "review", "cg-025": "review", "cg-026": "review", "cg-027": "review",
    "cg-028": "review", "cg-029": "review", "cg-030": "review",
}
spec = json.loads((data / "spec/ESP-014.r3.json").read_text(encoding="utf-8"))
lim = spec["limites"]
D = Decimal
CHEM = ["C", "Si", "Mn", "P", "S", "Cr", "Ni", "Mo", "Cu", "V"]
# Auditor's own coarse plausibility bounds, only to detect gross scale jumps; NOT the product's ranges.
PLAUS = {"C": D("2"), "Si": D("5"), "Mn": D("5"), "P": D("1"), "S": D("1"), "Cr": D("5"), "Ni": D("5"), "Mo": D("5"), "Cu": D("5"), "V": D("1")}


def val(f):
    if f is None or f.get("status") != "read" or f.get("value") is None:
        return None
    return D(str(f["value"]).replace(",", "."))


def oracle(cid, case, reading, exp):
    r = exp["correct_reading"]
    planted = reading.get("planted") or []
    planted = planted if isinstance(planted, list) else [planted]
    if any(p.get("kind") == "failure" for p in planted):
        return "review", "error", ["READER_ERROR"]
    digital = case["certificate_kind"] == "digital"
    reasons, block = [], []
    if not digital:
        reasons.append("NO_SECOND_CHANNEL")
    # channel disagreement: model channel (reading.json) vs correct reading (stands in for text layer) on digital
    if digital:
        for p in planted:
            if p.get("kind") == "misread":
                reasons.append(f"CHANNEL_DISAGREE:{p['field']}")
    rows = list(csv.DictReader((data / case["delivery_note"]).open(encoding="utf-8")))
    line = next((x for x in rows if x["partida"] == case["delivery_line"]), None)
    heat = val(r["heat_or_lot"]) if False else (r["heat_or_lot"]["value"] if r["heat_or_lot"].get("status") == "read" else None)
    heat_mismatch = False
    if line is None:
        reasons.append("EVIDENCE_MISSING")
    elif heat is None:
        reasons.append("CRITICAL_UNKNOWN:heat")
    elif heat.strip() != line["colada"].strip():
        heat_mismatch = True
    grade = r["grade"]["value"] if r["grade"].get("status") == "read" else None
    if grade is None:
        reasons.append("CRITICAL_UNKNOWN:grade")
    elif line and (grade != line["calidad"] or grade != spec["calidad"]):
        block.append("GRADE_MISMATCH")
    ct = r["certificate_type"]["value"] if r["certificate_type"].get("status") == "read" else None
    if ct != "3.1":
        reasons.append("CERT_TYPE_NOT_3_1")
    st = r["inspection_stamp"]
    if st.get("status") != "read" or not st.get("value"):
        reasons.append("STAMP_MISSING")
    kt = r["kv_temperature"]
    if kt.get("status") != "read" or str(kt.get("value")).replace("−", "-").strip() != "-20":
        reasons.append("KV_TEMPERATURE_MISMATCH")
    chem = {}
    for el in CHEM:
        f = r["chemistry"].get(el)
        v = val(f)
        if v is None:
            reasons.append(f"CRITICAL_UNKNOWN:{el}")
            chem[el] = None
            continue
        if f.get("unit") != "%":
            reasons.append(f"UNIT_UNEXPECTED:{el}")
            chem[el] = None
            continue
        if v < 0 or v > PLAUS[el]:
            reasons.append(f"IMPLAUSIBLE:{el}")
            chem[el] = None
            continue
        chem[el] = v
        if el in lim and "max" in lim[el] and v > D(lim[el]["max"]):
            block.append(f"RULE_FAIL:{el}")
    mech = {}
    for prop, units in (("ReH", ("MPa", "N/mm²", "N/mm2")), ("Rm", ("MPa", "N/mm²", "N/mm2")), ("A", ("%",))):
        f = r["mechanical"].get(prop)
        v = val(f)
        if v is None:
            reasons.append(f"CRITICAL_UNKNOWN:{prop}")
            continue
        if f.get("unit") not in units:
            reasons.append(f"UNIT_UNEXPECTED:{prop}")
            continue
        mech[prop] = v
        L = lim[prop]
        if ("min" in L and v < D(L["min"])) or ("max" in L and v > D(L["max"])):
            block.append(f"RULE_FAIL:{prop}")
    kvs = []
    for k in ("KV_1", "KV_2", "KV_3"):
        f = r["mechanical"].get(k)
        v = val(f)
        if v is None:
            reasons.append(f"CRITICAL_UNKNOWN:{k}")
        elif f.get("unit") != "J":
            reasons.append(f"UNIT_UNEXPECTED:{k}")
        else:
            kvs.append(v)
    if len(kvs) == 3 and sum(kvs) < 3 * D(lim["KV_media"]["min"]):
        block.append("RULE_FAIL:KV_media")
    printed = val(r["cev_printed"])
    if printed is not None and printed > D(lim["CEV"]["max"]):
        block.append("RULE_FAIL:CEV(printed)")
    if all(chem.get(e) is not None for e in ("C", "Mn", "Cr", "Mo", "V", "Ni", "Cu")):
        c = chem
        cev = c["C"] + c["Mn"] / 6 + (c["Cr"] + c["Mo"] + c["V"]) / 5 + (c["Ni"] + c["Cu"]) / 15
        if cev > D(lim["CEV"]["max"]):
            block.append("RULE_FAIL:CEV(recomputed)")
        if printed is not None and cev.quantize(D("0.01"), rounding=ROUND_HALF_EVEN) != printed:
            reasons.append("CEV_MISMATCH")
    if heat_mismatch:
        return "review", "ok", ["HEAT_MISMATCH"] + block + reasons
    if block:
        return "block", "ok", block + reasons
    if reasons:
        return "review", "ok", reasons
    return "release", "ok", []


rows_out = []
for cdir in sorted((data / "cases").iterdir()):
    cid = cdir.name
    case = json.loads((cdir / "case.json").read_text(encoding="utf-8"))
    reading = json.loads((cdir / "reading.json").read_text(encoding="utf-8"))
    exp = json.loads((data / "expected" / f"{cid}.json").read_text(encoding="utf-8"))
    # circularity: reading.json must not carry expectation keys
    for key in ("expected_proposal", "expected_status", "reasons_must_include", "rule_failures", "propuesta_esperada", "fallos_especificacion", "motivo"):
        if key in json.dumps(reading):
            fail.append(f"CIRCULARITY: {cid} reading.json contains '{key}'")
    # planted only where allowed
    planted = reading.get("planted") or []
    planted = planted if isinstance(planted, list) else [planted]
    kinds = {p.get("kind") for p in planted}
    allowed = {"cg-018": {"misread"}, "cg-021": {"contamination"}, "cg-022": {"contamination"},
               **{f"cg-0{n}": {"failure"} for n in range(23, 28)}}
    if kinds - allowed.get(cid, set()):
        fail.append(f"PLANTED: {cid} has planted kinds {kinds} not allowed for this case")
    # reading == correct reading except planted fields
    if reading["fields"] != exp["correct_reading"]:
        diff = [k for k in exp["correct_reading"] if reading["fields"].get(k) != exp["correct_reading"][k]]
        pf = {str(p.get("field", "")).split(".")[0] for p in planted}
        if set(diff) - pf:
            fail.append(f"READING-DEVIATION: {cid} differs from correct reading in {diff}, planted only {pf}")
        else:
            info.append(f"{cid}: model output deviates only in planted {diff}")
    want = R15.get(cid)
    got = exp["expected_proposal"]
    if want and want != got:
        fail.append(f"REGISTER: {cid} expected file says {got}, R1.5 says {want}")
    op, ost, oreasons = oracle(cid, case, reading, exp)
    mark = "OK " if op == got and ost == exp["expected_status"] else "DIFF"
    if mark == "DIFF":
        fail.append(f"ORACLE: {cid} auditor oracle {op}/{ost} {oreasons} vs expected {got}/{exp['expected_status']} {exp['reasons_must_include']}")
    rows_out.append(f"{mark} {cid} {case['certificate_kind']:7} {case.get('layout_id','-')} expected={got:7} oracle={op:7} {exp['acceptance_cases']} must={exp['reasons_must_include']} oracle_reasons={oreasons}")

print("\n".join(rows_out))
print("--- info")
print("\n".join(info))
print("--- hard findings")
print("\n".join(fail) if fail else "none")
sys.exit(1 if fail else 0)
