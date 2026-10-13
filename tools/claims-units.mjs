// Sentence map for the claims table (R4.3 F-02, ADV-S4-F02). Splits README.md, DEPLOY.md and METRICS.md into
// units, failing closed (E-11): every piece of text is a unit except the executable part of a shell-fence line
// and table separator rows (see units()).
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

// Fences whose lines are shell commands: only their comments are units, the executable part is not (E-11).
const SHELL_FENCES = new Set(["sh", "bash", "shell", "console"]);

/**
 * Fail closed (register E-11): every piece of text is a unit, except the executable part of a line inside a shell
 * fence and the separator rows of tables. Prose sentences, list items, headings, table rows, HTML comments, every
 * line of a fence with any other tag or none, and whole-line or trailing "#" comments in shell fences are units.
 */
export function units(text) {
  const out = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let inFence = false;
  let fenceLang = "";
  let comment = null;
  let block = [];
  const push = (s) => { const t = norm(s); if (t) out.push(t); };
  const flush = () => {
    if (block.length === 0) return;
    const joined = norm(block.join(" "));
    block = [];
    // A sentence ends at ". ", "! " or "? " after two lowercase letters, digits or closing marks, so that
    // abbreviations such as "S.A." or "e.g." do not split a sentence.
    for (const s of joined.split(/(?<=[a-z0-9)`*"'²%]{2}[.!?])\s+(?=[A-Z0-9*`"(\[])/)) push(s);
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (comment !== null) {
      const close = line.indexOf("-->");
      if (close >= 0) { comment.push(line.slice(0, close)); push(comment.join(" ")); comment = null; push(line.slice(close + 3)); }
      else comment.push(line);
      continue;
    }
    const fence = /^\s*```\s*([A-Za-z0-9_+.-]*)/.exec(line);
    if (fence) { flush(); inFence = !inFence; fenceLang = inFence ? fence[1].toLowerCase() : ""; continue; }
    if (inFence) {
      if (line.trim() === "") continue;
      if (SHELL_FENCES.has(fenceLang)) {
        const whole = /^\s*#+\s*(.*)$/.exec(line);
        if (whole) { push(whole[1]); continue; }
        const trailing = /^.*?\s#+\s*(.*\S)\s*$/.exec(line);
        if (trailing) push(trailing[1]);
        continue; // the executable part of a shell line is not a unit
      }
      push(line); // any other fence: every line is text
      continue;
    }
    const open = line.indexOf("<!--");
    if (open >= 0) {
      flush();
      push(line.slice(0, open));
      const rest = line.slice(open + 4);
      const close = rest.indexOf("-->");
      if (close >= 0) { push(rest.slice(0, close)); push(rest.slice(close + 3)); }
      else comment = [rest];
      continue;
    }
    if (line.trim() === "") { flush(); continue; }
    const heading = /^#{1,6}\s+(.*\S)/.exec(line);
    if (heading) { flush(); push(heading[1]); continue; }
    if (/^\s*\|/.test(line)) {
      flush();
      if (/^\s*\|[\s|:-]+\|\s*$/.test(line)) continue; // separator row: no text
      push(line);
      continue;
    }
    const item = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (item) { flush(); block.push(item[1]); continue; }
    block.push(line.replace(/^\s*>\s?/, ""));
  }
  flush();
  if (comment !== null) push(comment.join(" "));
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
