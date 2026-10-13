// Sentence map for the claims table (R4.3 F-02, ADV-S4-F02). Splits README.md, DEPLOY.md and METRICS.md into
// units (each sentence of prose and list items, each table row, each heading, each `#` comment line in a code
// block and each line of a language-less code block; shell commands and HTML comments are not units).
// claims-map.json assigns every unit either a CLAIMS.md row ("C-nn") or "none: <why it is not a
// capability>". test/docs.test.ts fails when a unit is missing from the map, when a map entry no longer occurs, or
// when a row is unknown: a sentence that is added or changed must be mapped again.
//
//   node tools/claims-units.mjs            list every unit not in claims-map.json (JSON lines)
//   node tools/claims-units.mjs --stale    list map entries that no longer occur
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CLAIM_DOCS = ["README.md", "DEPLOY.md", "METRICS.md"];
export const MAP_FILE = path.join(ROOT, "claims-map.json");

const norm = (s) => s.replace(/\s+/g, " ").trim();

export function units(text) {
  const out = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let inFence = false;
  let fenceLang = "";
  let inComment = false;
  let block = [];
  const flush = () => {
    if (block.length === 0) return;
    const joined = norm(block.join(" "));
    block = [];
    // A sentence ends at ". ", "! " or "? " after two lowercase letters, digits or closing marks, so that
    // abbreviations such as "S.A." or "e.g." do not split a sentence.
    for (const s of joined.split(/(?<=[a-z0-9)`*"'²%]{2}[.!?])\s+(?=[A-Z0-9*`"(\[])/)) if (norm(s)) out.push(norm(s));
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const fence = /^\s*```\s*([A-Za-z0-9_-]*)/.exec(line);
    if (fence) { flush(); inFence = !inFence; fenceLang = inFence ? fence[1] : ""; continue; }
    if (inFence) {
      // Inside code: a "#" comment line is prose a reader takes as a statement (ADV-S4-F06), and a fenced block
      // with no language (CLI usage, layout) is text, so each of its non-empty lines is a unit. Commands are not.
      const comment = /^\s*#\s+(.*\S)/.exec(line);
      if (comment) out.push(norm(comment[1]));
      else if (fenceLang === "" && line.trim() !== "") out.push(norm(line));
      continue;
    }
    if (/^\s*<!--/.test(line)) { flush(); inComment = !line.includes("-->"); continue; }
    if (inComment) { if (line.includes("-->")) inComment = false; continue; }
    if (line.trim() === "") { flush(); continue; }
    const heading = /^#{1,6}\s+(.*\S)/.exec(line);
    if (heading) { flush(); out.push(norm(heading[1])); continue; }
    if (/^\s*\|/.test(line)) {
      flush();
      if (/^\s*\|[\s|:-]+\|\s*$/.test(line)) continue; // separator row
      out.push(norm(line));
      continue;
    }
    const item = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(line);
    if (item) { flush(); block.push(item[1]); continue; }
    block.push(line.replace(/^\s*>\s?/, ""));
  }
  flush();
  return out;
}

export function allUnits(root = ROOT) {
  return CLAIM_DOCS.flatMap((doc) => units(readFileSync(path.join(root, doc), "utf8")).map((text) => ({ doc, text })));
}

export function loadMap(root = ROOT) {
  return JSON.parse(readFileSync(path.join(root, "claims-map.json"), "utf8"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let map = [];
  try { map = loadMap(); } catch { /* no map yet */ }
  const key = (u) => `${u.doc}\u0000${u.text}`;
  const known = new Set(map.map(key));
  const present = new Set(allUnits().map(key));
  if (process.argv.includes("--stale")) {
    for (const m of map) if (!present.has(key(m))) console.log(JSON.stringify(m));
  } else {
    for (const u of allUnits()) if (!known.has(key(u))) console.log(JSON.stringify(u));
  }
}
