"""Auditor (stage 3): compare the auditor's recorded stories with the committed (implementer) stories, and check each
story's F1 snapshot against the auditor's raw captures (stdlib only).

Usage: python -I story_compare.py <auditor-stories-dir> <committed-stories-dir> <capture-before.json> <capture-after.json>
"""
import glob
import json
import os
import sys

mine, theirs, cap_b, cap_a = sys.argv[1:5]
NOT_EXPOSED_PREFIX = "not exposed"


def load_story(d, cid):
    s = json.load(open(os.path.join(d, cid + ".json"), encoding="utf-8"))
    rc = s.get("view", {}).get("receipt") or s.get("receipt") or {}
    return s, rc


def reh(rc):
    for m in rc.get("certificate", {}).get("mechanical", []) or []:
        if m.get("property") in ("ReH", "reh"):
            return m.get("value")
    return None


caps = [json.load(open(p, encoding="utf-8")) for p in (cap_b, cap_a)]
cap_models = [set(c.get("model_ids") or []) for c in caps]
out = {"stories": [], "problems": []}
for cid in ("cg-001", "cg-002", "cg-003"):
    s_m, rc_m = load_story(mine, cid)
    s_t, rc_t = load_story(theirs, cid)
    f1 = rc_m.get("f1", {})
    er = rc_m.get("endpoint_response") or {}
    row = {
        "case": cid,
        "proposal_auditor": rc_m.get("proposal"), "proposal_committed": rc_t.get("proposal"),
        "reasons_auditor": rc_m.get("reasons") or rc_m.get("reason_codes"),
        "reh_auditor": reh(rc_m), "reh_committed": reh(rc_t),
        "reading_source": rc_m.get("reading_source"),
        "f1_state": f1.get("state"), "f1_model_reported": f1.get("model_reported"),
        "reply_model": er.get("model"),
        "f1_model_ids_in_capture": sorted(set(f1.get("model_ids") or []) - (cap_models[0] | cap_models[1])) or "all present",
        "gpu_rocm_vllm": [f1.get("gpu"), f1.get("rocm_version"), f1.get("vllm_version")],
        "tokens_per_second": f1.get("tokens_per_second"),
        "tps_recomputed": None,
        "cost_f1": f1.get("cost_reported"), "cost_reply": er.get("cost_reported"),
        "stored_label": s_m.get("stored_label"),
    }
    try:
        row["tps_recomputed"] = round(int(er["completion_tokens"]) / (int(er["elapsed_ms"]) / 1000), 2)
    except (KeyError, TypeError, ValueError, ZeroDivisionError):
        pass
    if row["proposal_auditor"] != row["proposal_committed"]:
        out["problems"].append(f"{cid}: proposal {row['proposal_auditor']} vs committed {row['proposal_committed']}")
    if row["reading_source"] != "live":
        out["problems"].append(f"{cid}: reading_source {row['reading_source']}")
    if f1.get("state") != "on":
        out["problems"].append(f"{cid}: story F1 state {f1.get('state')}")
    if f1.get("model_reported") != er.get("model"):
        out["problems"].append(f"{cid}: F1 model {f1.get('model_reported')} != reply model {er.get('model')}")
    if row["f1_model_ids_in_capture"] != "all present":
        out["problems"].append(f"{cid}: F1 model ids not in auditor's raw captures: {row['f1_model_ids_in_capture']}")
    if not all(str(v or "").startswith(NOT_EXPOSED_PREFIX) for v in row["gpu_rocm_vllm"]):
        out["problems"].append(f"{cid}: GPU/ROCm/vLLM {row['gpu_rocm_vllm']}")
    if str(f1.get("cost_reported")) != str(er.get("cost_reported")):
        out["problems"].append(f"{cid}: F1 cost {f1.get('cost_reported')} != reply cost {er.get('cost_reported')}")
    out["stories"].append(row)
print(json.dumps(out, indent=1, ensure_ascii=False, default=str))
