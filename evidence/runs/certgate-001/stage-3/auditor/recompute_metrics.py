"""Auditor (stage 3): independent recomputation of the evaluation metrics from results.json (stdlib only).

Usage: python -I recompute_metrics.py <run-dir> [<expectations-real-run.json> <dataset-expected-dir>]
Definitions follow register R3.0 D3-05 as amended by R3.1 C-08..C-11 and R3.2 C-19:
  FC-broad  = proposal release where expected != release   (denominator: cases with expected != release)
  FC-strict = proposal release where expected == block      (denominator: cases with expected == block)
  non-conformities caught = expected block and proposal != release (subset: proposal block)
  rule abstention = proposal review with status processed; failure = status error (by class)
  per-field categories recomputed here from the correct reading and the model value: numeric values compared as
  decimals after normalising a decimal comma; a missing unit is NOT treated as a wrong value here (reported apart).
The script also re-derives each case's expected proposal from the committed expectation files, independently of
the expected_proposal written into results.json, when those paths are given.
"""
import json
import os
import statistics
import sys
from decimal import Decimal, InvalidOperation

run = sys.argv[1]
results = json.load(open(os.path.join(run, "results.json"), encoding="utf-8"))
exp_override = {}
exp_dir = None
if len(sys.argv) >= 4:
    raw = open(sys.argv[2], encoding="utf-8-sig").read()
    exp_override = json.loads(raw).get("cases", {})
    exp_dir = sys.argv[3]

problems = []


def dec(s):
    if s is None:
        return None
    try:
        return Decimal(str(s).strip().replace("−", "-").replace(",", "."))
    except InvalidOperation:
        return None


def expected_for(c):
    if not exp_dir:
        return c["expected_proposal"]
    if c["case_id"] in exp_override:
        return exp_override[c["case_id"]]["expected_proposal"]
    return json.load(open(os.path.join(exp_dir, c["case_id"] + ".json"), encoding="utf-8"))["expected_proposal"]


n = len(results)
rows = []
for c in results:
    e = expected_for(c)
    if e != c["expected_proposal"]:
        problems.append(f"{c['case_id']}: results.json expected {c['expected_proposal']} but committed files say {e}")
    rows.append((c, e))

not_release = [(c, e) for c, e in rows if e != "release"]
block_exp = [(c, e) for c, e in rows if e == "block"]
fc_broad = [c["case_id"] for c, e in not_release if c["proposal"] == "release"]
fc_strict = [c["case_id"] for c, e in block_exp if c["proposal"] == "release"]
caught = [c["case_id"] for c, e in block_exp if c["proposal"] != "release"]
blocked = [c["case_id"] for c, e in block_exp if c["proposal"] == "block"]
mismatch = [(c["case_id"], c["proposal"], e) for c, e in rows if c["proposal"] != e]
processed = [c for c, e in rows if c["status"] != "error"]
rule_abst = [c["case_id"] for c, e in rows if c["proposal"] == "review" and c["status"] == "processed"]
failures = {}
for c, e in rows:
    if c["status"] == "error":
        cls = (c.get("receipt", {}).get("errors") or [{}])[0].get("class", "unknown")
        failures.setdefault(cls, []).append(c["case_id"])

# per-field, recomputed
cats = {"correct": 0, "correct_unknown": 0, "correct_absent": 0, "wrong_value": 0, "unit_missing_value_right": 0,
        "invented": 0, "confident_on_illegible": 0, "missed": 0}
detail = []
disagree_with_reported = []
for c, e in rows:
    if c["status"] == "error":
        continue
    for fname, f in c["fields"].items():
        cs, ms = f["correct_status"], f["model_status"]
        cv, mv = f["correct"], f["model"]
        if cs == "read":
            if ms == "read":
                dc, dm = dec(cv), dec(mv)
                same = (dc is not None and dm is not None and dc == dm) or (str(cv).strip() == str(mv).strip())
                if same:
                    # numerically equal; a different textual form (e.g. decimal comma) is still the right value
                    cat = "correct" if str(cv).strip() == str(mv).strip() else "unit_missing_value_right" if f.get("model_unit") is None else "correct"
                else:
                    cat = "wrong_value"
            else:
                cat = "missed"
        elif cs == "absent":
            cat = "correct_absent" if ms == "absent" else ("invented" if ms == "read" else "missed")
        else:  # correct reading unknown (illegible)
            cat = "correct_unknown" if ms != "read" else "confident_on_illegible"
        cats[cat] += 1
        rep = f.get("category")
        norm_rep = {"wrong": "wrong_value"}.get(rep, rep)
        if norm_rep != cat:
            disagree_with_reported.append((c["case_id"], fname, rep, cat, cv, mv, f.get("model_unit")))

total_fields = sum(cats.values())
walls = [int(c["case_wall_ms"]) for c in processed]
lat = [int(a["elapsed_ms"]) for c in processed for a in c["attempts"]]
costs = [Decimal(c["endpoint_response"]["cost_reported"]) for c in processed if c.get("endpoint_response", {}).get("cost_reported") not in (None, "")]
tot_tok = [int(c["endpoint_response"]["total_tokens"]) for c in processed]
comp_tok = [int(c["endpoint_response"]["completion_tokens"]) for c in processed]
reas_tok = [int(c["endpoint_response"].get("reasoning_tokens") or 0) for c in processed]
models = sorted({c["endpoint_response"]["model"] for c in processed})
retries = sum(max(0, len(c["attempts"]) - 1) for c, _ in rows)
attempts = sum(len(c["attempts"]) for c, _ in rows)

ub = json.loads(json.load(open(os.path.join(run, "usage-before.json"), encoding="utf-8"))["raw"])
ua = json.loads(json.load(open(os.path.join(run, "usage-after.json"), encoding="utf-8"))["raw"])
usage_delta = Decimal(str(ua["daily_cost_used_usd"])) - Decimal(str(ub["daily_cost_used_usd"]))
req_delta = ua["all_time"]["requests"] - ub["all_time"]["requests"]

out = {
    "cases": n,
    "FC_broad": f"{len(fc_broad)} / {len(not_release)}", "FC_broad_cases": fc_broad,
    "FC_broad_over_all": f"{len(fc_broad)} / {n}",
    "FC_strict": f"{len(fc_strict)} / {len(block_exp)}", "FC_strict_cases": fc_strict,
    "nonconformities_caught": f"{len(caught)} / {len(block_exp)}", "blocked": f"{len(blocked)} / {len(block_exp)}", "nonconforming_cases": [c["case_id"] for c, e in block_exp],
    "proposal_equals_expected": f"{n - len(mismatch)} / {n}", "mismatches": mismatch,
    "rule_abstention": f"{len(rule_abst)} / {n}", "failures": {k: f"{len(v)} / {n}" for k, v in failures.items()} or "0 / %d" % n,
    "per_field": {**cats, "total": total_fields},
    "per_field_disagreements_with_reported_category": disagree_with_reported,
    "seconds_per_certificate": {"mean": round(statistics.mean(walls) / 1000, 1), "median": round(statistics.median(walls) / 1000, 1), "min": round(min(walls) / 1000, 1), "max": round(max(walls) / 1000, 1), "N": len(walls)},
    "latency_ms": {"mean": round(statistics.mean(lat)), "median": round(statistics.median(lat)), "N": len(lat)},
    "tokens_per_certificate": {"total_mean": round(statistics.mean(tot_tok)), "completion_mean": round(statistics.mean(comp_tok)), "reasoning_mean": round(statistics.mean(reas_tok))},
    "cost_per_certificate": {"mean": str((sum(costs) / len(costs)).quantize(Decimal("0.00000001"))), "median": str(Decimal(statistics.median(costs)).quantize(Decimal("0.00000001"))), "N": len(costs), "unknown": len(processed) - len(costs), "sum": str(sum(costs))},
    "attempts": attempts, "retries": retries,
    "usage_delta_cost": str(usage_delta), "sum_reply_costs": str(sum(costs)), "usage_delta_minus_sum": str(usage_delta - sum(costs)),
    "usage_delta_requests": req_delta,
    "models_reported": models,
    "problems": problems,
}
print(json.dumps(out, indent=1, ensure_ascii=False, default=str))
