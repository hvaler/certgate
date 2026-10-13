// S4-03: METRICS.md is generated from the committed Stage 3 evaluation artifacts and must equal a fresh generation.
// S4-16: it names the run behind the landing figures and shows the auditor's independent run next to it.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";
// @ts-expect-error plain JS tool
import { buildMetricsMd, RUNS } from "../tools/evaluate/metrics-md.mjs";

describe("METRICS.md (S4-03, S4-16)", () => {
  it("equals a fresh generation from the committed artifacts, byte for byte", () => {
    const committed = readFileSync(path.join(ROOT, "METRICS.md"), "utf8").replace(/\r\n/g, "\n");
    expect(committed).toBe(buildMetricsMd());
  });
  it("names the landing run and the auditor's independent run, with the landing figures' run equal to public/figures.json", () => {
    const md = buildMetricsMd();
    const fig = JSON.parse(readFileSync(path.join(ROOT, "public", "figures.json"), "utf8"));
    expect(RUNS[0].dir).toBe(fig.generated_from);
    expect(md).toContain("Implementer run (source of the landing figures)");
    expect(md).toContain("Auditor's independent run");
    expect(md).toContain(`**${fig.false_conforming.broad.n} / ${fig.false_conforming.broad.of}**`);
    expect(md).toContain("cost reported by the endpoint; Token Factory credits are free and have no monetary value");
  });
  it("every figure in the headline table comes from a metrics.json (no digit typed in the generator's table rows)", () => {
    const src = readFileSync(path.join(ROOT, "tools", "evaluate", "metrics-md.mjs"), "utf8");
    const rows = src.split("\n").filter((l) => l.trim().startsWith("row("));
    expect(rows.length).toBeGreaterThan(10);
    for (const r of rows) expect(r.replace(/\(x\) =>[\s\S]*$/, "").replace(/C-\d+|D3-\d+|SHA-256|GET \/usage/g, ""), r).not.toMatch(/\d/);
  });
});
