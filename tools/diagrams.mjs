// Stage 7 S7-01 / T7-06 (challenge CH7-09): ONE definition of the two README diagrams, from which both the
// Mermaid text and a deterministic, hand-laid-out SVG are generated. Every node and every edge names a
// repo-relative `file` and a `symbol` that literally occurs in it, so each element maps to existing code
// (test/stage7-diagrams.test.ts checks this). No dependencies; no timestamps; byte-stable output.
//
//   node tools/diagrams.mjs          writes docs/diagrams/{architecture,flow}.svg and prints both Mermaid blocks
//   node tools/diagrams.mjs --check  exits 1 if the committed SVGs differ from a fresh generation
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const OUT_DIR = path.join(ROOT, "docs", "diagrams");

// col/row place a node on a fixed grid; label is one or more lines.
export const DIAGRAMS = {
  architecture: {
    title: "CertGate architecture",
    nodes: [
      { id: "browser", col: 1, row: 0, label: ["Browser", "public/app.js"], file: "public/app.js", symbol: "doLiveRead" },
      { id: "container", col: 3, row: 0, label: ["Container (other way to run)", "Dockerfile"], file: "Dockerfile", symbol: "FROM node:24.21.0-bookworm-slim" },
      { id: "static", col: 0, row: 1, label: ["Vercel static site", "public/ (outputDirectory)"], file: "vercel.json", symbol: "\"outputDirectory\": \"public\"" },
      { id: "api", col: 1, row: 1, label: ["Vercel function api", "api/index.ts"], file: "api/index.ts", symbol: "export default function handler" },
      { id: "server", col: 3, row: 1, label: ["Node server", "createApp (src/server.ts)"], file: "src/server.ts", symbol: "export function createApp" },
      { id: "handler", col: 2, row: 2, label: ["Request handler", "createHandler (src/web/app.ts)"], file: "src/web/app.ts", symbol: "export function createHandler" },
      { id: "jobs", col: 1, row: 3, label: ["Live-reading queue and limits", "LiveJobs"], file: "src/web/live-jobs.ts", symbol: "export class LiveJobs" },
      { id: "reader", col: 3, row: 3, label: ["Live reader", "DeadlineReader / LiveReader"], file: "src/web/deadline-reader.ts", symbol: "export class DeadlineReader" },
      { id: "store", col: 0, row: 4, label: ["Upstash Redis store", "UpstashRestStore"], file: "src/web/live-store.ts", symbol: "export class UpstashRestStore" },
      { id: "memory", col: 2, row: 4, label: ["In-process store", "MemoryStore"], file: "src/web/live-store.ts", symbol: "export class MemoryStore" },
      { id: "amd", col: 3, row: 4, label: ["AMD Token Factory", "OpenAI-compatible endpoint"], file: "src/web/f1.ts", symbol: "ENDPOINT_NAME = \"AMD Token Factory\"" },
      { id: "gemma", col: 3, row: 5, label: ["Deployed live model", "Gemma-4-31B-IT (MODEL_ID)"], file: "DEPLOY.md", symbol: "Gemma-4-31B-IT" },
      { id: "qwen", col: 4, row: 5, label: ["Evaluated product model", "Qwen3.8-27B"], file: "METRICS.md", symbol: "Qwen3.8-27B" },
    ],
    edges: [
      { from: "browser", to: "static", label: "page, stories", file: "vercel.json", symbol: "\"outputDirectory\": \"public\"" },
      { from: "browser", to: "api", label: "/api/*", file: "vercel.json", symbol: "\"source\": \"/api/(.*)\"" },
      { from: "container", to: "server", label: "dist/src/server.js", file: "Dockerfile", symbol: "CMD [\"node\", \"dist/src/server.js\"]" },
      { from: "api", to: "handler", label: "", file: "api/index.ts", symbol: "createHandler({ defer" },
      { from: "server", to: "handler", label: "", file: "src/server.ts", symbol: "createHandler(deps)" },
      { from: "handler", to: "jobs", label: "queue a job", file: "src/web/app.ts", symbol: "new LiveJobs(store, clock, budget)" },
      { from: "handler", to: "reader", label: "live reading", file: "src/web/app.ts", symbol: "new DeadlineReader(" },
      { from: "jobs", to: "store", label: "deployed site", file: "src/web/app.ts", symbol: "new UpstashRestStore(sEnv.url, sEnv.token)" },
      { from: "jobs", to: "memory", label: "container", file: "src/web/app.ts", symbol: "new MemoryStore(() => clock().getTime())" },
      { from: "reader", to: "amd", label: "/chat/completions", file: "src/web/live-reader.ts", symbol: "/chat/completions" },
      { from: "amd", to: "gemma", label: "MODEL_ID", file: "src/web/config.ts", symbol: "env.MODEL_ID" },
      { from: "amd", to: "qwen", label: "evaluation runs", file: "METRICS.md", symbol: "developer.amd.com.cn · Qwen3.8-27B" },
    ],
  },
  flow: {
    title: "CertGate flow",
    nodes: [
      { id: "upload", col: 0, row: 0, label: ["Upload", "certificate PDF + delivery CSV"], file: "public/app.js", symbol: "doLiveRead" },
      { id: "story", col: 2, row: 0, label: ["Story", "replayStory"], file: "src/tools/build-stories.ts", symbol: "export async function replayStory" },
      { id: "open", col: 1, row: 1, label: ["Certificate opened", "openPdf"], file: "src/pdf.ts", symbol: "export async function openPdf" },
      { id: "textlayer", col: 0, row: 2, label: ["Text-layer channel", "extractTextLayer"], file: "src/text-layer.ts", symbol: "export function extractTextLayer" },
      { id: "model", col: 2, row: 2, label: ["Model reading on AMD", "processCase / readCase"], file: "src/pipeline.ts", symbol: "export async function processCase" },
      { id: "channels", col: 1, row: 3, label: ["Channels compared", "resolveChannels"], file: "src/evaluate.ts", symbol: "function resolveChannels" },
      { id: "config", col: 0, row: 4, label: ["Versioned config", "config/plausibility.v1.json"], file: "config/plausibility.v1.json", symbol: "\"version\": \"plausibility-v1\"" },
      { id: "rules", col: 1, row: 4, label: ["Coherence and rules", "RULES_VERSION"], file: "src/evaluate.ts", symbol: "export const RULES_VERSION" },
      { id: "decimals", col: 2, row: 4, label: ["Exact decimals", "decimal.js"], file: "src/decimal.ts", symbol: "from \"decimal.js\"" },
      { id: "proposal", col: 1, row: 5, label: ["Proposal", "release / block / review"], file: "src/evaluate.ts", symbol: "export function propose" },
      { id: "human", col: 1, row: 6, label: ["A person confirms and decides", "recordHumanDecision"], file: "src/pipeline.ts", symbol: "export function recordHumanDecision" },
      { id: "receipt", col: 1, row: 7, label: ["Run receipt", "exportReceipt"], file: "src/receipt.ts", symbol: "export function exportReceipt" },
    ],
    edges: [
      { from: "upload", to: "open", label: "live job", file: "src/web/app.ts", symbol: "processCase({ ...inputBase, reader, f1 })" },
      { from: "story", to: "open", label: "recorded reply", file: "src/tools/build-stories.ts", symbol: "new RecordedReader(rec)" },
      { from: "open", to: "textlayer", label: "when present", file: "src/pipeline.ts", symbol: "extractTextLayer(cert.pdf.pages)" },
      { from: "open", to: "model", label: "model channel", file: "src/pipeline.ts", symbol: "readWithRetry(input.reader" },
      { from: "textlayer", to: "channels", label: "", file: "src/evaluate.ts", symbol: "textLayer.channel_available" },
      { from: "model", to: "channels", label: "", file: "src/evaluate.ts", symbol: "resolveChannels(input, reasons)" },
      { from: "channels", to: "rules", label: "", file: "src/evaluate.ts", symbol: "checkUnitsAndPlausibility(fields, input.plausibility, reasons)" },
      { from: "config", to: "rules", label: "", file: "src/coherence.ts", symbol: "plausibility.v1.json" },
      { from: "decimals", to: "rules", label: "", file: "src/evaluate.ts", symbol: "from \"./decimal.js\"" },
      { from: "rules", to: "proposal", label: "", file: "src/evaluate.ts", symbol: "propose(reasons.list, pendingConfirmation)" },
      { from: "proposal", to: "human", label: "confirmations", file: "src/web/app.ts", symbol: "parseConfirmations(body.confirmations" },
      { from: "human", to: "receipt", label: "", file: "src/web/app.ts", symbol: "exportReceipt(" },
    ],
  },
};

const get = (name) => {
  const d = DIAGRAMS[name];
  if (!d) throw new Error(`unknown diagram: ${name}`);
  return d;
};

// ---------- Mermaid ----------
const mq = (s) => s.replace(/"/g, "#quot;");

/** The Mermaid `flowchart` text (no fences), ending with a newline. */
export function mermaid(name) {
  const d = get(name);
  const lines = ["flowchart TB"];
  for (const n of d.nodes) lines.push(`  ${n.id}["${mq(n.label.join("<br/>"))}"]`);
  for (const e of d.edges) lines.push(e.label ? `  ${e.from} -->|"${mq(e.label)}"| ${e.to}` : `  ${e.from} --> ${e.to}`);
  return lines.join("\n") + "\n";
}

/** The fenced block that goes between the README markers. */
export function mermaidBlock(name) {
  return "```mermaid\n" + mermaid(name) + "```";
}

/** The marker-wrapped block as printed by the CLI and placed in README.md. */
export function readmeSection(name) {
  return `<!-- diagram:${name} -->\n${mermaidBlock(name)}\n<!-- /diagram -->`;
}

// ---------- SVG ----------
const BOX_W = 220, BOX_H = 52, PITCH_X = 260, PITCH_Y = 104, MARGIN = 24, TITLE_H = 36;
const FONT = "Arial, sans-serif";
const xe = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = (v) => {
  const r = Math.round(v * 10) / 10;
  return Object.is(r, -0) ? "0" : String(r);
};

function center(n) {
  return { x: MARGIN + n.col * PITCH_X + BOX_W / 2, y: TITLE_H + MARGIN + n.row * PITCH_Y + BOX_H / 2 };
}

// Point where the segment from the box centre towards (dx, dy) leaves the box, pushed out by `pad`.
function exitPoint(c, dx, dy, pad) {
  const hw = BOX_W / 2 + pad, hh = BOX_H / 2 + pad;
  const t = Math.min(dx === 0 ? Infinity : hw / Math.abs(dx), dy === 0 ? Infinity : hh / Math.abs(dy));
  return { x: c.x + dx * t, y: c.y + dy * t };
}

/** The SVG document for one diagram, ending with a newline. */
export function svg(name) {
  const d = get(name);
  const byId = new Map(d.nodes.map((n) => [n.id, n]));
  const maxCol = Math.max(...d.nodes.map((n) => n.col));
  const maxRow = Math.max(...d.nodes.map((n) => n.row));
  const width = MARGIN * 2 + maxCol * PITCH_X + BOX_W;
  const height = TITLE_H + MARGIN * 2 + maxRow * PITCH_Y + BOX_H;
  const marker = `arrow-${name}`;
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}">`);
  out.push(`  <title>${xe(d.title)}</title>`);
  out.push(`  <defs><marker id="${marker}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#333333"/></marker></defs>`);
  out.push(`  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>`);
  out.push(`  <text x="${MARGIN}" y="${MARGIN + 6}" font-size="16" font-weight="bold" fill="#111111">${xe(d.title)}</text>`);
  for (const e of d.edges) {
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b) throw new Error(`${name}: edge ${e.from} -> ${e.to} names a missing node`);
    const ca = center(a), cb = center(b);
    const dx = cb.x - ca.x, dy = cb.y - ca.y;
    const p = exitPoint(ca, dx, dy, 2), q = exitPoint(cb, -dx, -dy, 3);
    out.push(`  <line x1="${num(p.x)}" y1="${num(p.y)}" x2="${num(q.x)}" y2="${num(q.y)}" stroke="#333333" stroke-width="1.5" marker-end="url(#${marker})"/>`);
    if (e.label) {
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, lw = e.label.length * 6 + 10;
      out.push(`  <rect x="${num(mx - lw / 2)}" y="${num(my - 9)}" width="${num(lw)}" height="18" rx="3" fill="#ffffff" stroke="#bbbbbb" stroke-width="0.5"/>`);
      out.push(`  <text x="${num(mx)}" y="${num(my + 4)}" font-size="11" text-anchor="middle" fill="#333333">${xe(e.label)}</text>`);
    }
  }
  for (const n of d.nodes) {
    const c = center(n);
    out.push(`  <rect x="${num(c.x - BOX_W / 2)}" y="${num(c.y - BOX_H / 2)}" width="${BOX_W}" height="${BOX_H}" rx="6" fill="#eef3fb" stroke="#2f5d9e" stroke-width="1.5"/>`);
    const lineH = 15, first = c.y - ((n.label.length - 1) * lineH) / 2 + 4;
    n.label.forEach((l, i) => {
      const weight = i === 0 ? ` font-weight="bold"` : "";
      out.push(`  <text x="${num(c.x)}" y="${num(first + i * lineH)}" font-size="12"${weight} text-anchor="middle" fill="#111111">${xe(l)}</text>`);
    });
  }
  out.push("</svg>");
  return out.join("\n") + "\n";
}

export const svgPath = (name) => path.join(OUT_DIR, `${name}.svg`);

function main(argv) {
  const names = Object.keys(DIAGRAMS);
  if (argv.includes("--check")) {
    const stale = names.filter((n) => {
      try { return readFileSync(svgPath(n), "utf8") !== svg(n); } catch { return true; }
    });
    for (const n of stale) process.stderr.write(`stale or missing: docs/diagrams/${n}.svg (run node tools/diagrams.mjs)\n`);
    return stale.length ? 1 : 0;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const n of names) writeFileSync(svgPath(n), svg(n));
  process.stdout.write(names.map(readmeSection).join("\n\n") + "\n");
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
