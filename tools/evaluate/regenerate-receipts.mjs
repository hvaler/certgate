// F3-01 repair (Stage 3 repair 1): regenerates, OFFLINE, the F1 snapshot of each receipt of an evaluation run that
// was made before the runner stored one. Only data recorded at reading time is used: each case's
// endpoint_response (model, id, created, usage, cost, elapsed) and the run's host (run.json). The rate-limit headers
// and the probe values (GET /models, GET /usage) were not recorded, so they are labelled
// not_captured_in_evaluation_run, never reconstructed or defaulted. No endpoint call is made.
//
//   npm run build && node tools/evaluate/regenerate-receipts.mjs evaluation/runs/<name>
//
// Writes results.f1-regenerated.json next to the untouched results.json and prints both SHA-256.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dist = (p) => import(pathToFileURL(path.join(ROOT, "dist", "src", p)).href);
const { replyOnlyF1 } = await dist("pipeline.js");
const { ENDPOINT_NAME, ENDPOINT_SOURCE, NOT_EXPOSED } = await dist("web/f1.js");

export const REGENERATED = "results.f1-regenerated.json";

export function regenerate(results, run) {
  return results.map((r) => {
    if (r.receipt?.reading_source !== "live") return r;
    const f1 = replyOnlyF1(r.endpoint_response, { endpoint_host: run.host, rate_limit: null, endpoint_name: ENDPOINT_NAME, endpoint_source: ENDPOINT_SOURCE, not_exposed: NOT_EXPOSED });
    return { ...r, receipt: { ...r.receipt, f1 } };
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.resolve(process.argv[2] ?? "");
  const raw = readFileSync(path.join(dir, "results.json"));
  const out = regenerate(JSON.parse(raw.toString("utf8")), JSON.parse(readFileSync(path.join(dir, "run.json"), "utf8")));
  const text = JSON.stringify(out, null, 2) + "\n";
  writeFileSync(path.join(dir, REGENERATED), text);
  const sha = (b) => createHash("sha256").update(b).digest("hex");
  console.log(`results.json (original, unchanged) ${sha(raw)}`);
  console.log(`${REGENERATED} ${sha(Buffer.from(text))}`);
}
