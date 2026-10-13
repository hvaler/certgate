"""Auditor (stage 3, candidate 2): independent check of the F3-01 offline regeneration (stdlib only).

Usage: python -I check_regenerated_f1.py <run-dir>
Checks, for every case of results.json vs results.f1-regenerated.json:
  1. the two files differ only in receipt.f1 (everything else byte-equal as parsed JSON);
  2. no live receipt has f1.state "off"; live receipts carry state not_captured_in_evaluation_run;
  3. each captured F1 value equals the value recorded at reading time in endpoint_response
     (model, completion/total tokens, cost, elapsed) or the run's host; tokens/s = completion / (elapsed/1000), 2 dp;
  4. every value not recorded at reading time is the literal not_captured_in_evaluation_run and is listed in not_captured.
"""
import json
import os
import sys
from decimal import Decimal, ROUND_HALF_UP

NC = "not_captured_in_evaluation_run"
d = sys.argv[1]
orig = json.load(open(os.path.join(d, "results.json"), encoding="utf-8"))
regen = json.load(open(os.path.join(d, "results.f1-regenerated.json"), encoding="utf-8"))
run = json.load(open(os.path.join(d, "run.json"), encoding="utf-8"))
problems = []
states = {}
if len(orig) != len(regen):
    problems.append(f"case count {len(orig)} vs {len(regen)}")
for o, r in zip(orig, regen):
    cid = o["case_id"]
    o2 = json.loads(json.dumps(o)); r2 = json.loads(json.dumps(r))
    o2["receipt"].pop("f1", None); r2["receipt"].pop("f1", None)
    if o2 != r2:
        problems.append(f"{cid}: differs outside receipt.f1")
    f1 = r["receipt"]["f1"]
    states[f1["state"]] = states.get(f1["state"], 0) + 1
    if r["receipt"].get("reading_source") != "live":
        continue
    if f1["state"] != NC:
        problems.append(f"{cid}: live receipt state {f1['state']}")
    er = o.get("endpoint_response") or {}
    expect = {
        "model_reported": er.get("model"),
        "completion_tokens": er.get("completion_tokens"),
        "total_tokens": er.get("total_tokens"),
        "cost_reported": er.get("cost_reported"),
        "last_reading_ms": er.get("elapsed_ms"),
        "endpoint_host": run.get("host"),
    }
    if er.get("completion_tokens") and er.get("elapsed_ms") and int(er["elapsed_ms"]) > 0:
        tps = (Decimal(er["completion_tokens"]) / (Decimal(er["elapsed_ms"]) / 1000)).quantize(Decimal("0.01"), ROUND_HALF_UP)
        expect["tokens_per_second"] = str(tps.normalize()) if tps == tps.to_integral() else str(tps)
    for k, v in expect.items():
        want = NC if v in (None, "") else str(v)
        got = f1.get(k)
        if k == "tokens_per_second" and want != NC and got != NC and Decimal(got) == Decimal(want):
            continue
        if got != want:
            problems.append(f"{cid}: f1.{k} = {got!r}, recorded {want!r}")
    for k in ("checked_at", "latency_ms", "rate_limit_rpm", "rate_limit_rpm_remaining", "daily_spend_limit",
              "daily_spend_used", "daily_spend_remaining", "usage_source"):
        if f1.get(k) != NC:
            problems.append(f"{cid}: f1.{k} = {f1.get(k)!r}, expected {NC} (not recorded at reading time)")
        if k not in (f1.get("not_captured") or []):
            problems.append(f"{cid}: {k} missing from not_captured")
    if f1.get("model_ids") not in ([], None) or "model_ids" not in (f1.get("not_captured") or []):
        problems.append(f"{cid}: model_ids not labelled not captured")
    for k in ("gpu", "rocm_version", "vllm_version"):
        if not str(f1.get(k) or "").startswith("not exposed"):
            problems.append(f"{cid}: f1.{k} = {f1.get(k)!r}")
print(json.dumps({"cases": len(regen), "f1_states": states, "problems": problems}, indent=1, ensure_ascii=False))
