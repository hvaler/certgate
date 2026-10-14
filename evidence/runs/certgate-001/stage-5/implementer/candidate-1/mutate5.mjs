// Stage 5 killers (S5-15 a-f, E-15, G-04) as exact replacements on a throwaway checkout.
// Usage: node mutate5.mjs <checkout> <id>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const [dir, id] = process.argv.slice(2);
const M = {
  a_metrics: [["METRICS.md", "| 34.5 · 30 · 27 |", "| 24.5 · 30 · 27 |"]],
  a_readme: [["README.md", "| Seconds per certificate | mean 34.5, median 30 (N 27) |", "| Seconds per certificate | mean 24.5, median 30 (N 27) |"]],
  a_readme_fc: [["README.md", "| Non-conformities caught | 6 of 6, 5 of 6 proposed block |", "| Non-conformities caught | 6 of 6, 6 of 6 proposed block |"]],
  b_gemma_as_qwen: [["tools/evaluate/metrics-md.mjs", 'dir: "evaluation/runs/real-gemma-04100b9"', 'dir: "evaluation/runs/real-candidate-dd557fd"']],
  b_qwen_as_gemma: [["tools/evaluate/metrics-md.mjs", 'dir: "evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1"', 'dir: "evaluation/runs/real-gemma-04100b9"']],
  b_run_json: [["evaluation/runs/real-gemma-04100b9/run.json", '"model_requested": "Gemma-4-31B-IT"', '"model_requested": "Qwen3.8-27B"']],
  c_request: [["src/web/live-reader.ts", "            temperature: 0,\n", "            temperature: 0,\n            top_p: 1,\n"]],
  c_max_tokens: [["src/web/limits.ts", "ADAPTER_MAX_TOKENS = 16_384", "ADAPTER_MAX_TOKENS = 8_192"]],
  e_eligible: [["README.md", "This comparison makes no claim about any prize or award.", "CertGate is eligible for the Gemma prize."]],
  e_qualifies: [["README.md", "Every reply reported the model as `self-dploy/Gemma-4-31B-IT`.", "CertGate qualifies for the Google prize. Every reply reported the model as `self-dploy/Gemma-4-31B-IT`."]],
  f_generator: [["tools/evaluate/metrics-md.mjs", "if (q.some((r) => r?.proposal !== g.proposal)) out.push(", "if (q.every((r) => r?.proposal !== g.proposal)) out.push("]],
  f_metrics_hand: [["METRICS.md", "(2): cg-004 (expected release; gemma release; qwen implementer release, qwen auditor review); cg-021", "(1): cg-021"]],
  e15_drop_pdfjs: [["vercel.json", ",node_modules/pdfjs-dist}", "}"]],
  g04_expected: [["data/expected/cg-021.json", '"expected_proposal": "block"', '"expected_proposal": "review"']],
};
for (const [file, from, to] of M[id]) {
  const p = path.join(dir, file);
  const s = readFileSync(p, "utf8");
  const n = s.includes(from) ? s : s.replace(/\r\n/g, "\n");
  if (!n.includes(from)) { console.error(`${id}: pattern not found in ${file}`); process.exit(2); }
  writeFileSync(p, n.replace(from, to));
}
console.log(`${id} applied`);
