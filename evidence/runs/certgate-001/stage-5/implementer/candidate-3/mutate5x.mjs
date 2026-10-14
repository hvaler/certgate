// Stage 5 repair 2 mutants: each README sentence is inserted as a bullet together with its own claims-map entry
// ("none: context"), so that only the prize check can kill it; b2/b2q edit one receipt model id of a run.
// Usage: node mutate5x.mjs <checkout> <id>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const [dir, id] = process.argv.slice(2);
const SENT = {
  A1: "CertGate is eligible for the Gemma prize.",
  A2: "CertGate is not just a comparison: it is eligible for the Gemma prize.",
  A3: "CertGate never invents a value and is eligible for the Gemma prize.",
  A4_e3: "CertGate is a strong contender for Google's Gemma challenge on AMD.",
  A5: "CertGate won the Gemma track.",
  A6: "CertGate is a finalist in the hackathon.",
  A7: "CertGate placed first in the Gemma category.",
  e4: "With no doubt CertGate is eligible for the Gemma prize.",
  e5: "CertGate never fails to qualify for the Gemma prize.",
  e6: "Not only is CertGate eligible for the Gemma prize, it is a likely winner.",
  e7: "CertGate is a frontrunner in Google's Gemma track on AMD.",
  e8: "Without question CertGate deserves the Gemma prize.",
  neg: "CertGate does not compete for any prize.",
  neg_but: "CertGate does not compete for any prize, but it qualifies for the Gemma award.",
  // E-18 probes (adversary b246d6ef): appended claim, look-alikes, emphasis, zero-width.
  e13: "This comparison makes no claim about any prize or award, although CertGate is eligible for one.",
  e14: "CertGate is eligible for the Gemma prіze.",
  e14b: "CertGate takes the Gemma prіze.",
  e15: "CertGate is elіgible for Gemma on AMD.",
  e16: "CertGate is eli**gible** for Gemma on AMD.",
  e17: "CertGate is eli​gible for Gemma on AMD.",
};
const rw = (f, fn) => { const p = path.join(dir, f); writeFileSync(p, fn(readFileSync(p, "utf8").replace(/\r\n/g, "\n"))); };
if (SENT[id]) {
  const anchor = "- The seconds and tokens come from runs";
  rw("README.md", (s) => { if (!s.includes(anchor)) throw new Error("anchor"); return s.replace(anchor, `- ${SENT[id]}\n${anchor}`); });
  rw("claims-map.json", (s) => { const m = JSON.parse(s); m.push({ doc: "README.md", text: SENT[id], row: "none: context" }); return JSON.stringify(m, null, 1) + "\n"; });
} else if (id === "stale_allow") {
  // The allow-listed README sentence is reworded (no prize word left), so the allow-list entry becomes stale;
  // the claims map follows the new text so that only the stale-entry test can kill it.
  const from = "This comparison makes no claim about any prize or award.", to = "This comparison makes no claim of any kind about the event.";
  rw("README.md", (t) => { if (!t.includes(from)) throw new Error("stale"); return t.replace(from, to); });
  rw("claims-map.json", (t) => t.split(JSON.stringify(from)).join(JSON.stringify(to)));
} else if (id === "b2_gemma_receipt") {
  rw("evaluation/runs/real-gemma-04100b9/results.json", (s) => { const i = s.indexOf('"model_id": "self-dploy/Gemma-4-31B-IT"'); if (i < 0) throw new Error("b2"); return s.slice(0, i) + '"model_id": "self-dploy/Qwen3.8-27B"' + s.slice(i + '"model_id": "self-dploy/Gemma-4-31B-IT"'.length); });
} else if (id === "b2q_qwen_requested") {
  rw("evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1/results.json", (s) => { const k = '"requested_model_id": "Qwen3.8-27B"'; const i = s.indexOf(k); if (i < 0) throw new Error("b2q"); return s.slice(0, i) + '"requested_model_id": "Gemma-4-31B-IT"' + s.slice(i + k.length); });
} else { console.error(`unknown ${id}`); process.exit(2); }
console.log(`${id} applied`);
