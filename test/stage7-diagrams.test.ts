// Stage 7 register S7-01 / T7-06 (challenge CH7-09): the README diagrams come from ONE definition in
// tools/diagrams.mjs. Every node and edge maps to existing code (file exists, symbol occurs in it), the committed
// SVGs equal a fresh generation byte for byte, the README carries exactly the generated Mermaid, and no label
// names hardware or software the code does not use. Offline: reads files only.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";
import { DIAGRAMS, mermaidBlock, svg } from "../tools/diagrams.mjs";

type Element = { file: string; symbol: string; label: string | string[] };
type Diagram = { nodes: (Element & { id: string })[]; edges: (Element & { from: string; to: string })[] };
const diagrams = DIAGRAMS as Record<string, Diagram>;
const names = Object.keys(diagrams);
const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");

describe("diagrams map to existing code (S7-01, CH7-09)", () => {
  it("defines the architecture and flow diagrams", () => {
    expect(names).toEqual(["architecture", "flow"]);
  });
  for (const name of names) {
    const d = diagrams[name]!;
    const elements: [string, Element][] = [
      ...d.nodes.map((n) => [`node ${n.id}`, n] as [string, Element]),
      ...d.edges.map((e) => [`edge ${e.from} -> ${e.to}`, e] as [string, Element]),
    ];
    for (const [what, el] of elements) {
      it(`${name}: ${what} -> ${el.file} contains ${JSON.stringify(el.symbol)}`, () => {
        expect(el.file).not.toMatch(/^[\\/]|\.\./);
        const file = path.join(ROOT, el.file);
        expect(existsSync(file)).toBe(true);
        expect(el.symbol.length).toBeGreaterThan(0);
        expect(readFileSync(file, "utf8")).toContain(el.symbol);
      });
    }
    it(`${name}: every edge joins two defined nodes`, () => {
      const ids = new Set(d.nodes.map((n) => n.id));
      expect(ids.size).toBe(d.nodes.length);
      for (const e of d.edges) {
        expect(ids.has(e.from)).toBe(true);
        expect(ids.has(e.to)).toBe(true);
      }
    });
  }
});

describe("committed SVGs equal a fresh generation (S7-01)", () => {
  for (const name of names) {
    it(`docs/diagrams/${name}.svg`, () => {
      const committed = readFileSync(path.join(ROOT, "docs", "diagrams", `${name}.svg`), "utf8");
      expect(committed).toBe(svg(name));
      expect(svg(name)).toBe(svg(name));
    });
  }
});

describe("README carries the generated Mermaid (S7-01)", () => {
  for (const name of names) {
    it.skipIf(!readme.includes("<!-- diagram:architecture -->"))(`README ${name} block`, () => {
      const open = `<!-- diagram:${name} -->\n`, close = "\n<!-- /diagram -->";
      const start = readme.indexOf(open);
      expect(start).toBeGreaterThanOrEqual(0);
      const end = readme.indexOf(close, start + open.length);
      expect(end).toBeGreaterThan(start);
      expect(readme.slice(start + open.length, end)).toBe(mermaidBlock(name));
    });
  }
});

describe("labels name only what the code uses (S7-01)", () => {
  for (const name of names) {
    it(`${name}: no vLLM, MI300, Evolus or GPU in node or edge labels`, () => {
      const d = diagrams[name]!;
      for (const n of d.nodes) expect([n.label].flat().join(" ")).not.toMatch(/vLLM|MI300|Evolus|GPU/i);
      for (const e of d.edges) expect([e.label].flat().join(" ")).not.toMatch(/vLLM|MI300|Evolus|GPU/i);
    });
  }
});
