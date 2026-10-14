// Auditor (stage 5, candidate 3): residual-limit probes of the fail-closed prize check (recorded, not binding).
import path from "node:path";
import { pathToFileURL } from "node:url";
const { prizeFindings } = await import(pathToFileURL(path.join(process.argv[2], "test", "support", "prize-check.mjs")).href);
const probes = [
  "CertGate is the obvious pick for the Gemma judges on AMD.",
  "CertGate is a prizewinning tool.",
  "CertGate took first place on AMD.",
  "CertGate earned a trophy for Gemma on AMD.",
  "CertGate is eli-gible for the Gemma pri-ze.",
  "CertGate is e l i g i b l e for the Gemma p r i z e.",
  "CertGate is award-winning.",
  "CertGate is eligible-ish for the Gemma prize.",
  "Enter at least one value.",
  "This comparison makes no claim about any prize or award.",
];
for (const p of probes) console.log(`${prizeFindings(p).length ? "FLAGGED " : "PASSES  "} ${p}`);
