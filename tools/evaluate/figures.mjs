// Landing figures (S3-19, C-08, C-11): generated only from an evaluation run's committed artifacts, never typed
// by hand. Writes public/figures.json, which the landing page shows as is.
//
//   node tools/evaluate/figures.mjs evaluation/runs/<name>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const FIGURES_FILE = path.join(ROOT, "public", "figures.json");

export function buildFigures(runDir) {
  const read = (f) => JSON.parse(readFileSync(path.join(runDir, f), "utf8"));
  const m = read("metrics.json");
  const run = read("run.json");
  const results = read("results.json");
  const models = [...new Set(results.map((r) => r.endpoint_response?.model).filter(Boolean))];
  const h = m.headline;
  return {
    figures_schema: "certgate.figures/1",
    generated_from: path.relative(ROOT, runDir).replace(/\\/g, "/"),
    candidate_commit: run.candidate_commit,
    prompt_sha256: run.prompt_sha256,
    run_started_utc: run.started_utc,
    run_finished_utc: run.finished_utc,
    blocked: run.blocked ?? null,
    evaluated_cases: m.evaluated_cases.count,
    excluded_cases: m.evaluated_cases.excluded,
    model_reported: models,
    endpoint: "AMD Token Factory",
    false_conforming: {
      broad: { n: h.fc_broad.numerator, of: h.fc_broad.denominator, label: "false conforming: released when the expected proposal was not release" },
      strict: { n: h.fc_strict.numerator, of: h.fc_strict.denominator, label: "of them, released when the expected proposal was block" },
    },
    non_conformities_caught: { n: h.non_conformities_caught.numerator, of: h.non_conformities_caught.denominator, blocked: h.non_conformities_blocked.numerator },
    seconds_per_certificate: { mean: h.seconds_per_certificate.mean, median: h.seconds_per_certificate.median, n: h.seconds_per_certificate.n, over: h.seconds_per_certificate.over },
    cost_per_certificate: { mean: h.cost_per_certificate.mean, median: h.cost_per_certificate.median, n: h.cost_per_certificate.n, unknown: h.cost_per_certificate.unknown, label: h.cost_per_certificate.label },
    failures: { n: m.abstentions.failure.numerator, of: m.abstentions.failure.denominator },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.resolve(process.argv[2] ?? "");
  const fig = buildFigures(dir);
  writeFileSync(FIGURES_FILE, JSON.stringify(fig, null, 2) + "\n");
  console.log(JSON.stringify(fig, null, 1));
}
