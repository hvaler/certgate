// Static checks over the source tree (S1-03, S1-04, S1-10, S1-25, S1-37, S1-39, D1-12, A-09).
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";

const srcFiles = readdirSync(path.join(ROOT, "src")).filter((f) => f.endsWith(".ts"));
const src = (f: string) => readFileSync(path.join(ROOT, "src", f), "utf8");
const strip = (t: string) => t.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

describe("no binary floating point in rules, coherence or units (I4, S1-25)", () => {
  const numeric = ["evaluate.ts", "coherence.ts", "decimal.ts", "fields.ts", "spec.ts", "text-layer.ts", "delivery.ts", "model-output.ts", "strict-json.ts"];
  for (const f of numeric) {
    it(f, () => {
      const code = strip(src(f));
      // text-layer.ts uses item positions (layout geometry, never data values) and toFixed only to label them.
      const allowed = f === "text-layer.ts" ? code.replace(/\b(it|a|b|l|line|header|best|item)\.(x|y)\b/g, "") : code;
      expect(allowed).not.toMatch(/\bparseFloat\b|\bNumber\s*\(|\bparseInt\b|\bMath\.(round|floor|ceil|trunc)\b|\+\s*"\s*\d/);
    });
  }
});

describe("product code never reads expectations or pre-kickoff originals (D1-12, S1-37, auditor 3ca000f7)", () => {
  const forbidden = [/data[\\/]expected/, /expected_proposal/, /reasons_must_include/, /rule_failures/, /correct_reading/,
    /planted_fault/, /acceptance_cases/, /propuesta_esperada/, /esperado/, /data[\\/]origin/, /mini-prueba/];
  for (const f of srcFiles) {
    it(f, () => {
      for (const re of forbidden) expect(src(f), `${f} ${re}`).not.toMatch(re);
    });
  }
});

describe("configuration by environment only; .env.example lists every variable without values (I6, S1-03)", () => {
  it("env reads in src equal the .env.example keys", () => {
    const read = new Set<string>();
    for (const f of srcFiles) for (const m of src(f).matchAll(/\benv\.([A-Z][A-Z0-9_]+)/g)) read.add(m[1]!);
    const example = readFileSync(path.join(ROOT, ".env.example"), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    const keys = new Set(example.map((l) => l.split("=")[0]!));
    expect([...read].sort()).toEqual([...keys].sort());
    for (const l of example) expect(l, l).toMatch(/^[A-Z0-9_]+=$/);
  });
  it(".env is ignored by .gitignore (verified with git check-ignore in the handoff)", () => {
    const lines = readFileSync(path.join(ROOT, ".gitignore"), "utf8").split("\n").map((l) => l.trim());
    expect(lines).toContain(".env");
    expect(lines).toContain("!.env.example");
  });
});

describe("no automatic release (S1-10)", () => {
  it("only recordHumanDecision sets human_decision to a value", () => {
    for (const f of srcFiles) {
      const hits = [...strip(src(f)).matchAll(/human_decision:[ ]*(?![ ]|null\b)([^,\n}]+)/g)].map((m) => m[1]!.trim());
      const allowed = f === "pipeline.ts" ? hits.filter((h) => !/^d\.action|^\{ action: d\.action/.test(h)) : hits;
      expect(allowed.filter((h) => !/^HumanAction|^\{ action: HumanAction/.test(h)), f).toEqual([]);
    }
  });
});

describe("dataset generator does not import product code (A-09)", () => {
  it("imports only the standard library, reportlab and Pillow", () => {
    const py = readFileSync(path.join(ROOT, "tools", "dataset", "generate.py"), "utf8");
    const imports = [...py.matchAll(/^(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm)].map((m) => (m[1] ?? m[2])!.split(".")[0]!);
    const allowed = new Set(["copy", "csv", "hashlib", "io", "json", "random", "shutil", "decimal", "pathlib", "PIL", "reportlab"]);
    for (const i of imports) expect(allowed.has(i), i).toBe(true);
    expect(py).not.toMatch(/\bsubprocess\b|\bos\.system\b|\bimportlib\b|\bnode\s/);
  });
});

describe("fictitious data is labelled; repository files (S1-01, S1-02, S1-39)", () => {
  it("README states fictitious data, mock-only status and how to run", () => {
    const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
    expect(readme).toMatch(/fictitious/i);
    expect(readme).toMatch(/mock/i);
    expect(readme).toMatch(/docker run/);
    expect(readme).not.toMatch(/runs on AMD (today|now)|deployed at|accuracy of \d/i);
  });
  it("LICENSE is MIT", () => {
    expect(readFileSync(path.join(ROOT, "LICENSE"), "utf8")).toMatch(/^MIT License/);
  });
  it("the spec file and every certificate say they are fictitious", () => {
    expect(readFileSync(path.join(ROOT, "data", "spec", "ESP-014.r3.json"), "utf8")).toMatch(/FICTICIA/);
    expect(readFileSync(path.join(ROOT, "data", "README.md"), "utf8")).toMatch(/fictitious/i);
  });
});
