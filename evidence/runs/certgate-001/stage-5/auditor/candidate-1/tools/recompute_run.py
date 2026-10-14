# Auditor (stage 5, candidate 1): independent recomputation of a run's headline figures from results.json + usage files.
# python recompute_run.py <run-dir>
import json, sys, statistics, os
from decimal import Decimal
d = sys.argv[1]
r = json.load(open(os.path.join(d, "results.json"), encoding="utf-8"))
nonrel = [c for c in r if c["expected_proposal"] != "release"]
block = [c for c in r if c["expected_proposal"] == "block"]
fc_b = [c["case_id"] for c in nonrel if c["proposal"] == "release"]
fc_s = [c["case_id"] for c in block if c["proposal"] == "release"]
caught = [c for c in block if c["proposal"] != "release"]
cat = {}
for c in r:
    for f, v in c["fields"].items():
        cat[v["category"]] = cat.get(v["category"], 0) + 1
secs = [int(c["endpoint_response"]["elapsed_ms"]) / 1000 for c in r]
toks = [int(c["endpoint_response"]["total_tokens"]) for c in r]
costs = [Decimal(c["endpoint_response"]["cost_reported"]) for c in r]
out = {
  "run": d, "cases": len(r),
  "FC_broad": f"{len(fc_b)} / {len(nonrel)}", "FC_broad_cases": fc_b,
  "FC_strict": f"{len(fc_s)} / {len(block)}",
  "caught": f"{len(caught)} / {len(block)}", "caught_block": sum(1 for c in caught if c["proposal"] == "block"),
  "as_expected": f"{sum(c['proposal']==c['expected_proposal'] for c in r)} / {len(r)}",
  "mismatches": [[c["case_id"], c["proposal"], c["expected_proposal"]] for c in r if c["proposal"] != c["expected_proposal"]],
  "proposals": {c["case_id"]: c["proposal"] for c in r},
  "field_categories": cat, "fields_total": sum(cat.values()),
  "not_correct": [[c["case_id"], f, v["category"], v["model"], v["correct"]] for c in r for f, v in c["fields"].items() if v["category"] not in ("correct",)],
  "failures": sum(c["status"] != "processed" for c in r),
  "retries": sum(len(c["attempts"]) - 1 for c in r),
  "models": sorted({c["endpoint_response"]["model"] for c in r} | {c["receipt"]["reader"]["model_id"] for c in r}),
  "reading_sources": sorted({c["receipt"]["reading_source"] for c in r}),
  "finish": sorted({c["endpoint_response"]["finish_reason"] for c in r}),
  "sec_mean": round(statistics.mean(secs), 1), "sec_median": round(statistics.median(secs), 1),
  "tokens_mean": round(statistics.mean(toks)),
  "cost_mean": f"{(sum(costs) / len(costs)):.8f}", "cost_sum": str(sum(costs)),
}
try:
    ub = json.load(open(os.path.join(d, "usage-before.json"), encoding="utf-8"))
    ua = json.load(open(os.path.join(d, "usage-after.json"), encoding="utf-8"))
    def find(o, k):
        if isinstance(o, dict):
            if k in o: return o[k]
            for v in o.values():
                x = find(v, k)
                if x is not None: return x
        if isinstance(o, list):
            for v in o:
                x = find(v, k)
                if x is not None: return x
    b, a = Decimal(str(find(ub, "daily_cost_used"))), Decimal(str(find(ua, "daily_cost_used")))
    out["usage_delta"] = str(a - b); out["usage_delta_minus_sum"] = str(a - b - sum(costs))
except Exception as e:
    out["usage_error"] = repr(e)
print(json.dumps(out, indent=1))
