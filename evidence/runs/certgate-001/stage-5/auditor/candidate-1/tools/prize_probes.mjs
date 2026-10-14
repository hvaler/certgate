// Auditor (stage 5, candidate 1): direct probes of the committed prize check (test/support/prize-check.mjs).
//   node prize_probes.mjs <repo>
import path from "node:path";
import { pathToFileURL } from "node:url";
const { prizeFindings } = await import(pathToFileURL(path.join(process.argv[2], "test", "support", "prize-check.mjs")).href);
const probes = [
  "CertGate is eligible for the Gemma prize.",
  "CertGate qualifies for the Gemma prize.",
  "CertGate is not just a comparison: it is eligible for the Gemma prize.",
  "CertGate, with no extra setup, qualifies for the Gemma award.",
  "CertGate never invents a value and is eligible for the Gemma prize.",
  "CertGate is a strong contender for Google's Gemma challenge on AMD.",
  "CertGate won the Gemma track.",
  "CertGate is a finalist in the hackathon.",
  "CertGate placed first in the Gemma category.",
  "We submitted CertGate to the Gemma category.",
  "CertGate is the Gemma prize winner.",
  "<!-- CertGate is eligible for the Gemma prize -->",
  "| Gemma prize | eligible |",
  "This comparison makes no claim about any prize or award.",
];
for (const p of probes) console.log(`${prizeFindings(p).length ? "FLAGGED " : "PASSES  "} ${p}`);
