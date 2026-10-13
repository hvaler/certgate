// Evaluation metrics (D3-05 as amended by R3.1 C-08..C-11, C-15). Pure: computed only from the per-case results
// written by run-eval.mjs and the two GET /usage bodies, so any seat can recompute them from the artifacts:
//
//   node tools/evaluate/metrics.mjs evaluation/runs/<name>        (rewrites metrics.json from results.json)
//
// Every figure carries its numerator and denominator as strings; no float is rounded into a figure.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frac = (num, den) => ({ numerator: String(num), denominator: String(den), cases: undefined });
const withCases = (list, den) => ({ numerator: String(list.length), denominator: String(den), cases: list });
const dec = (x, places = 3) => (x === null || !Number.isFinite(x) ? null : places === 0 ? x.toFixed(0) : x.toFixed(places).replace(/0+$/, "").replace(/\.$/, ""));

function median(xs) {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

/** Top-level numeric field of a raw JSON body, exact text (no float round trip). */
function rawField(body, key) {
  const m = new RegExp(`"${key}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`).exec(body ?? "");
  return m ? m[1] : null;
}

export function computeMetrics({ results, usageBefore, usageAfter, run }) {
  const evaluated = results.map((r) => r.case_id);
  const N = results.length;
  const notRelease = results.filter((r) => r.expected_proposal !== "release");
  const expBlock = results.filter((r) => r.expected_proposal === "block");
  const processed = results.filter((r) => r.status !== "error");

  // C-08: FC-strict (release where expected = block), FC-broad (release where expected != release).
  const fcStrict = expBlock.filter((r) => r.proposal === "release").map((r) => r.case_id);
  const fcBroad = notRelease.filter((r) => r.proposal === "release").map((r) => r.case_id);
  // D3-05: non-conformities caught = expected block with proposal != release; block subset separately.
  const caught = expBlock.filter((r) => r.proposal !== "release").map((r) => r.case_id);
  const caughtBlock = expBlock.filter((r) => r.proposal === "block").map((r) => r.case_id);
  // C-09: rule abstention (review, processed) vs failure (status error) by class.
  const ruleAbst = results.filter((r) => r.proposal === "review" && r.status === "processed").map((r) => r.case_id);
  const failures = results.filter((r) => r.status === "error");
  const failByClass = {};
  for (const r of failures) {
    const cls = r.receipt?.errors?.find((e) => !e.recovered)?.class ?? r.receipt?.errors?.at(-1)?.class ?? "unknown";
    (failByClass[cls] ??= []).push(r.case_id);
  }
  const mismatches = results.filter((r) => r.proposal !== r.expected_proposal)
    .map((r) => ({ case_id: r.case_id, proposal: r.proposal, expected: r.expected_proposal, reasons: r.reasons, status: r.status }));
  const agree = results.filter((r) => r.proposal === r.expected_proposal).map((r) => r.case_id);

  // D3-05 / C-10: per-field accuracy on the model channel.
  const perField = {};
  const totals = {};
  for (const r of results) {
    if (r.status === "error") continue; // no model reading to measure
    for (const [k, f] of Object.entries(r.fields)) {
      perField[k] ??= {};
      perField[k][f.category] ??= [];
      perField[k][f.category].push(r.case_id);
      totals[f.category] = (totals[f.category] ?? 0) + 1;
    }
  }
  const fieldTable = Object.fromEntries(Object.entries(perField).map(([k, cats]) => {
    const den = Object.values(cats).reduce((a, l) => a + l.length, 0);
    return [k, Object.fromEntries(Object.entries(cats).map(([c, l]) => [c, withCases(l, den)]))];
  }));
  const fieldDen = Object.values(totals).reduce((a, b) => a + b, 0);
  const confidentOnIllegible = [];
  for (const r of results) for (const [k, f] of Object.entries(r.fields))
    if (f.category === "confident_on_illegible") confidentOnIllegible.push({ case_id: r.case_id, field: k, model: f.model, correct: f.correct });

  // Time per certificate (wall, case start to proposal) and per-request latency.
  const secs = processed.map((r) => Number(r.case_wall_ms) / 1000);
  const allSecs = results.map((r) => Number(r.case_wall_ms) / 1000);
  const latencies = results.flatMap((r) => (r.attempts ?? []).map((a) => num(a.elapsed_ms)).filter((x) => x !== null));
  // C-11: cost over processed cases; a missing usage.cost is unknown, never zero.
  const costs = processed.map((r) => num(r.endpoint_response?.cost_reported));
  const knownCosts = costs.filter((c) => c !== null);
  const tokens = processed.map((r) => num(r.endpoint_response?.total_tokens)).filter((x) => x !== null);
  const completion = processed.map((r) => num(r.endpoint_response?.completion_tokens)).filter((x) => x !== null);
  const reasoning = processed.map((r) => num(r.endpoint_response?.reasoning_tokens)).filter((x) => x !== null);
  const retries = Object.fromEntries(results.map((r) => [r.case_id, String(Math.max(0, (r.attempts?.length ?? 1) - 1))]));
  const requests = results.reduce((a, r) => a + (r.attempts?.length ?? 0), 0);

  // C-15: GET /usage delta vs the sum of per-request usage in the artifacts.
  const sumCostAll = results.map((r) => num(r.endpoint_response?.cost_reported)).filter((x) => x !== null);
  const usedBefore = num(rawField(usageBefore, "daily_cost_used_usd"));
  const usedAfter = num(rawField(usageAfter, "daily_cost_used_usd"));
  const delta = usedBefore !== null && usedAfter !== null ? usedAfter - usedBefore : null;
  const sumCost = sumCostAll.reduce((a, b) => a + b, 0);

  return {
    schema: "certgate.evaluation-metrics/1",
    definitions: "D3-05 as amended by R3.1 C-08 (FC-strict/FC-broad), C-09 (rule abstention vs failure), C-10 (confident-on-illegible), C-11 (cost/time over processed cases; missing cost = unknown), C-15 (usage reconciliation)",
    run: { candidate_commit: run?.candidate_commit ?? null, prompt_sha256: run?.prompt_sha256 ?? null, started_utc: run?.started_utc ?? null, finished_utc: run?.finished_utc ?? null, blocked: run?.blocked ?? null },
    evaluated_cases: { count: String(N), cases: evaluated, excluded: run?.excluded ?? [] },
    headline: {
      fc_broad: withCases(fcBroad, notRelease.length),
      fc_strict: withCases(fcStrict, expBlock.length),
      fc_broad_over_all: frac(fcBroad.length, N),
      non_conformities_caught: withCases(caught, expBlock.length),
      non_conformities_blocked: withCases(caughtBlock, expBlock.length),
      proposal_agreement: withCases(agree, N),
      seconds_per_certificate: { mean: dec(mean(secs), 1), median: dec(median(secs), 1), n: String(secs.length), over: "processed cases (status != error)" },
      cost_per_certificate: { mean: dec(mean(knownCosts), 8), median: dec(median(knownCosts), 8), n: String(knownCosts.length), unknown: String(costs.length - knownCosts.length), over: "processed cases with a reported cost", label: "cost reported by the endpoint; Token Factory credits are free and have no monetary value" },
    },
    false_conforming_root_causes: fcBroad.map((id) => ({ case_id: id, root_cause: "TO BE WRITTEN IN THE REPORT (C-08)" })),
    proposal_mismatches: mismatches,
    abstentions: {
      rule_abstention: withCases(ruleAbst, N),
      failure: withCases(failures.map((r) => r.case_id), N),
      failure_by_class: Object.fromEntries(Object.entries(failByClass).map(([c, l]) => [c, withCases(l, N)])),
    },
    per_field_accuracy: { over: "critical fields of processed cases, model channel vs correct reading", totals: Object.fromEntries(Object.entries(totals).map(([c, n]) => [c, frac(n, fieldDen)])), by_field: fieldTable, confident_on_illegible: confidentOnIllegible },
    time: {
      seconds_per_certificate_processed: { mean: dec(mean(secs), 1), median: dec(median(secs), 1), min: dec(Math.min(...secs), 1), max: dec(Math.max(...secs), 1), n: String(secs.length) },
      seconds_per_certificate_all: { mean: dec(mean(allSecs), 1), median: dec(median(allSecs), 1), n: String(allSecs.length) },
      latency_ms_per_request: { mean: dec(mean(latencies), 0), median: dec(median(latencies), 0), min: dec(Math.min(...latencies), 0), max: dec(Math.max(...latencies), 0), n: String(latencies.length) },
    },
    tokens: {
      total_per_certificate: { mean: dec(mean(tokens), 0), median: dec(median(tokens), 0), n: String(tokens.length) },
      completion_per_certificate: { mean: dec(mean(completion), 0), n: String(completion.length) },
      reasoning_per_certificate: { mean: dec(mean(reasoning), 0), n: String(reasoning.length) },
    },
    retries: { per_case: retries, requests: String(requests), cases_with_retry: Object.entries(retries).filter(([, v]) => v !== "0").map(([k]) => k) },
    usage_reconciliation: {
      usage_before_daily_cost_used: rawField(usageBefore, "daily_cost_used_usd"),
      usage_after_daily_cost_used: rawField(usageAfter, "daily_cost_used_usd"),
      usage_after_daily_cost_remaining: rawField(usageAfter, "daily_cost_remaining_usd"),
      usage_delta: dec(delta, 8),
      sum_of_per_request_cost: dec(sumCost, 8),
      responses_with_reported_cost: String(sumCostAll.length),
      requests_in_artifacts: String(requests),
      difference: delta === null ? null : dec(delta - sumCost, 8),
      note: "GET /usage reports the key's daily cost; it is read once before and once after the run. Any difference is reported, not hidden (C-15); the per-request sum covers the last response of each case (failed attempts carry no usage); the two GET /usage reads are not in it.",
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.resolve(process.argv[2] ?? ".");
  const read = (f) => readFileSync(path.join(dir, f), "utf8");
  const results = JSON.parse(read("results.json"));
  const run = JSON.parse(read("run.json"));
  const m = computeMetrics({ results, usageBefore: JSON.parse(read("usage-before.json")).raw, usageAfter: JSON.parse(read("usage-after.json")).raw, run });
  const prev = (() => { try { return JSON.parse(read("metrics.json")); } catch { return null; } })();
  if (prev?.false_conforming_root_causes) m.false_conforming_root_causes = prev.false_conforming_root_causes.filter((x) => m.headline.fc_broad.cases.includes(x.case_id)).concat(m.false_conforming_root_causes.filter((x) => !prev.false_conforming_root_causes.some((p) => p.case_id === x.case_id)));
  writeFileSync(path.join(dir, "metrics.json"), JSON.stringify(m, null, 2) + "\n");
  console.log(JSON.stringify(m.headline, null, 1));
}
