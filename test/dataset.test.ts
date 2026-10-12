// Every dataset case through the mock path yields its expected proposal (S1-34, S1-41 preview), and the
// dataset itself keeps its integrity rules (S1-37, S1-38, A-01, A-20, D1-20).
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { recomputeCev } from "../src/coherence.js";
import { roundCevForCoherence } from "../src/decimal.js";
import { parseStrictJson } from "../src/strict-json.js";
import { DATA, expected, runCase } from "./helpers.js";

const ids = readdirSync(path.join(DATA, "cases")).sort();

describe("dataset composition", () => {
  it("has 20-30 cases, digital and scanned, covering C1-C13", () => {
    expect(ids.length).toBeGreaterThanOrEqual(20);
    expect(ids.length).toBeLessThanOrEqual(30);
    const kinds = ids.map((id) => JSON.parse(readFileSync(path.join(DATA, "cases", id, "case.json"), "utf8")).certificate_kind);
    expect(kinds).toContain("digital");
    expect(kinds).toContain("scan");
    const covered = new Set(ids.flatMap((id) => expected(id).acceptance_cases));
    for (const c of ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C13"]) expect(covered).toContain(c);
  });

  it("matches CHECKSUMS.sha256 for every dataset file", () => {
    const lines = readFileSync(path.join(DATA, "CHECKSUMS.sha256"), "utf8").trim().split("\n");
    expect(lines.length).toBeGreaterThan(100);
    for (const l of lines) {
      const [hash, rel] = l.split(/\s{2}/);
      const actual = createHash("sha256").update(readFileSync(path.join(DATA, rel!))).digest("hex");
      expect(actual, rel).toBe(hash);
    }
  });

  it("keeps the three pre-kickoff certificates byte-identical (S1-38)", () => {
    const originals: Record<string, string> = {
      "cg-001": "55c15e2e23d2928af427c633c19ef1605f9e4145ba330c0aec1b469d19eca4c6",
      "cg-002": "c9df9fac7e26217426d7d99a689912e2849f56ea026a969c7070efc2e8de968e",
      "cg-003": "40899aa26ccec1e0a2e62d63a7abac8098ee0debc38df7c7b7ea121ac3619c01",
    };
    for (const [id, hash] of Object.entries(originals)) {
      const h = createHash("sha256").update(readFileSync(path.join(DATA, "cases", id, "certificate.pdf"))).digest("hex");
      expect(h).toBe(hash);
    }
  });

  it("stores every numeric value in inputs as a JSON string (S1-25)", () => {
    for (const id of ids) {
      for (const f of ["case.json", "reading.json"]) {
        expect(() => parseStrictJson(readFileSync(path.join(DATA, "cases", id, f), "utf8"), f)).not.toThrow();
      }
      expect(() => parseStrictJson(readFileSync(path.join(DATA, "expected", `${id}.json`), "utf8"), id)).not.toThrow();
    }
    expect(() => parseStrictJson(readFileSync(path.join(DATA, "spec", "ESP-014.r3.json"), "utf8"), "spec")).not.toThrow();
  });

  it("mock output equals the correct reading except for labelled planted deviations (A-01, D1-20)", () => {
    for (const id of ids) {
      const mock = JSON.parse(readFileSync(path.join(DATA, "cases", id, "reading.json"), "utf8"));
      const exp = expected(id);
      const plantedFields = (mock.planted as { kind: string; field: string | null }[])
        .filter((p) => p.kind === "misread").map((p) => p.field);
      if (plantedFields.length > 0) expect(exp.acceptance_cases, id).toContain("C8");
      const strip = (f: Record<string, unknown>) => {
        const copy = structuredClone(f) as Record<string, Record<string, unknown>>;
        for (const pf of plantedFields) {
          const [g, n] = pf!.split(".");
          delete copy[g!]![n!];
        }
        return copy;
      };
      expect(strip(mock.fields), id).toEqual(strip(exp.correct_reading));
    }
  });

  it("prints CEV as the half-even rounding of the exact recomputed value, except planted cases (A-20, A-23)", () => {
    const exceptions = new Set(["cg-015", "cg-019", "cg-020"]);
    for (const id of ids) {
      if (exceptions.has(id)) continue;
      const r = expected(id).correct_reading as { chemistry: Record<string, { value: string }>; cev_printed: { value: string } };
      const chem = Object.fromEntries(Object.entries(r.chemistry).map(([k, v]) => [k, v.value]));
      const cev = recomputeCev(chem)!;
      expect(roundCevForCoherence(cev).toFixed(2), id).toBe(r.cev_printed.value);
    }
  });
});

describe("every dataset case yields its expected outcome through the mock path", () => {
  for (const id of ids) {
    it(id, async () => {
      const exp = expected(id);
      const r = await runCase(id);
      expect(r.decision.proposal).toBe(exp.expected_proposal);
      expect(r.readings.case.status).toBe(exp.expected_status === "error" ? "error" : "processed");
      expect(r.decision.human_required).toBe(true);
      const got = r.decision.reasons.map((x) => x.code);
      for (const code of exp.reasons_must_include) expect(got, `${id} reasons`).toContain(code);
      for (const f of exp.rule_failures) {
        expect(got).toContain(`RULE_FAIL:${f.field}`);
        const failing = r.evaluation!.rule_results.filter((x) => x.outcome === "fail" && x.rule_id.split(".")[2] === f.field);
        expect(failing.length, `${id} ${f.field}`).toBeGreaterThan(0);
        expect(failing.some((x) => x.observed !== null && x.observed.startsWith(f.observed.slice(0, 7)))).toBe(true);
      }
      if (exp.expected_proposal !== "release") expect(r.decision.proposal).not.toBe("release");
      expect(r.receipt.reader.model_id).toMatch(/^MOCK/);
    });
  }
});
