// Auditor (T10-03…T10-07): independent text checks of README.md and docs/submission/lablab.md at a candidate,
// written by the auditor, not reusing the candidate's tests. Read-only.
//   node t10_text.mjs <repo>
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const repo = process.argv[2];
const readme = readFileSync(path.join(repo, "README.md"), "utf8").replace(/\r\n/g, "\n");
const labPath = path.join(repo, "docs/submission/lablab.md");
const lab = existsSync(labPath) ? readFileSync(labPath, "utf8").replace(/\r\n/g, "\n") : null;
const out = [];
const say = (k, v) => out.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);

// --- top block: lines after the H1, before the first blank line that precedes the notice / first heading
const lines = readme.split("\n");
const h1 = lines.findIndex((l) => /^# CertGate\s*$/.test(l));
let i = h1 + 1;
while (i < lines.length && lines[i].trim() === "") i++;
const block = [];
while (i < lines.length && lines[i].trim() !== "") block.push(lines[i++]);
const firstH2 = lines.findIndex((l) => /^## /.test(l));
say("top block: non-empty source lines", block.length);
say("top block before the first ## heading", h1 >= 0 && i <= firstH2);
const tb = block.join("\n");
for (const w of ["mill certificate", "EN 10204 3.1", "a person decides", "deterministic", "versioned"]) say(`top block has "${w}"`, tb.includes(w));
for (const f of ["0/18", "27/27", "26/27", "591/594", "9/9", "8/9", "0/9", "1/9", "cg-004"]) say(`top block has ${f}`, tb.includes(f));
say("top block links", [...tb.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]));

// --- sentences: split README and lablab into sentences / table rows for the model-and-run rule
function sentences(text) {
  const res = [];
  for (const raw of text.split("\n")) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith("|")) { res.push(l); continue; }
    for (const s of l.split(/(?<=[.;])\s+(?=[A-Z(*`"])/)) res.push(s);
  }
  return res;
}
const durRe = /\b\d+(?:[.,]\d+)?\s?(?:s|sec|seconds?|min|minutes?)\b/;
const models = /Qwen3\.8-27B|Gemma-4-31B-IT|Qwen3\.8-Flash-Next|DeepSeek|MiMo|Qwen\b|Gemma\b/;
const runs = /implementer run|auditor'?s? (?:independent )?run|auditor run|comparison run|both Qwen|Stage 5|landing figures|run of record|evaluation run|in the evaluation/i;
function durationCheck(name, text) {
  const hits = sentences(text).filter((s) => durRe.test(s));
  const noModel = hits.filter((s) => !models.test(s));
  const noRun = hits.filter((s) => models.test(s) && !runs.test(s));
  say(`${name}: sentences/rows with a duration`, hits.length);
  say(`${name}: durations WITHOUT a model (each must be a limit, Y-07, or a finding)`, noModel.map((s) => s.slice(0, 160)));
  say(`${name}: durations with a model but no run label (judge each)`, noRun.map((s) => s.slice(0, 160)));
}
durationCheck("README", readme);
if (lab) durationCheck("lablab", lab);

// --- figures beside their runs: each Qwen time value appears with the right run
for (const [v, label] of [["89.6", "implementer"], ["80.6", "implementer"], ["77.1", "auditor"], ["76.9", "auditor"], ["34.5", "Gemma"]]) {
  const where = sentences(readme + "\n" + (lab ?? "")).filter((s) => s.includes(v));
  say(`time ${v} occurrences, each naming ${label}`, where.map((s) => (new RegExp(label, "i").test(s) ? "ok" : "MISSING " + s.slice(0, 120))));
}

// --- scan counts must name their set
const scanSent = sentences(readme + "\n" + (lab ?? "")).filter((s) => /\bscans?\b/i.test(s) && /\b\d+\b/.test(s) && /\bof (the )?\d+\b|\d+ of \d+|\d+\s*\/\s*\d+/.test(s));
say("scan-count sentences", scanSent.map((s) => s.slice(0, 200)));
say("any '5 … 27' scan claim (wrong)", scanSent.filter((s) => /\b5\b[^.]*\b27\b/.test(s) && /scan/i.test(s) && !/30/.test(s)).map((s) => s.slice(0, 160)));

// --- jargon (T10-06), link targets stripped
const visible = readme.replace(/\]\(([^)]+)\)/g, "]()");
const jar = [/\bO\d-\d\d\b/g, /\bF\d-\d\d\b/g, /\bOI-S\d-\d\d\b/g, /\bI[1-7]\b/g, /03-DISENO/g, /\b[Dd]ispatch(es)?\b/g, /\bthe band\b/gi, /\bthe human\b/gi,
  /\b(?:S|T|D|A|C|E|L|R|CH|DN|V|W|Q|P|X|Y|G|H|J|K|M|B)\d+[-.]\d+\b/g];
for (const re of jar) say(`README jargon ${re}`, [...new Set(visible.match(re) ?? [])]);
say("README mentions 'One endpoint and one model'", readme.includes("One endpoint and one model"));
say("README dated Gemma re-listing (04:21:59Z and 04:23:34.429Z)", readme.includes("04:21:59") && readme.includes("04:23:34.429"));

// --- lablab fields and lengths (T10-05, T10-07)
if (lab) {
  const field = (h) => { const m = lab.match(new RegExp(`^#+\\s*${h}\\s*\\n([\\s\\S]*?)(?=\\n#+\\s|(?![\\s\\S]))`, "mi")); return m ? m[1].trim() : null; };
  const title = field("Title"), short = field("Short description"), long = field("Long description");
  say("lablab title code points (<= 50)", title === null ? "MISSING" : [...title].length);
  say("lablab short code points (<= 255)", short === null ? "MISSING" : [...short].length);
  say("lablab long words (>= 100)", long === null ? "MISSING" : long.split(/\s+/).filter(Boolean).length);
  for (const w of ["EN 10204 3.1", "a person decides", "Additional Information"]) say(`lablab has "${w}"`, lab.includes(w));
  for (const f of ["0/18", "27/27", "26/27", "591/594", "9/9", "8/9", "0/9", "1/9"]) say(`lablab has ${f}`, lab.includes(f));
  say("lablab prize-family words", [...new Set(lab.match(/\b(prize|win|wins|won|winner|winning|award|qualif\w*|finalist|trophy)\b/gi) ?? [])]);
  say("lablab second-channel scope stated", /two fictitious layouts|two .*layouts/i.test(lab));
} else say("lablab.md", "MISSING");
console.log(out.join("\n"));
