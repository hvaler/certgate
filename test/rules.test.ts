// Deterministic rules, exact decimals, CEV, KV, precedence (S1-25..S1-32, A-02, A-04, A-08, A-20, A-22).
import { describe, expect, it } from "vitest";
import { cevCoherent, recomputeCev } from "../src/coherence.js";
import { Dec, decimalTextEqual, parseDecimal, roundCevForCoherence } from "../src/decimal.js";
import { propose } from "../src/evaluate.js";
import { limitOf } from "../src/spec.js";
import { codes, deliveryLine, evalWith, getShared } from "./helpers.js";

const proposal = (o: Parameters<typeof evalWith>[0]) => evalWith(o).decision.proposal;

describe("exact decimals (I4)", () => {
  it("parses strings to decimals and normalises representation", () => {
    expect(decimalTextEqual("0.02", "0.020")).toBe(true);
    expect(decimalTextEqual("0.02", "0.03")).toBe(false);
    expect(decimalTextEqual("0,16", "0.16")).toBe(true);
    expect(parseDecimal("1e3")).toBeNull();
    expect(parseDecimal("NaN")).toBeNull();
    expect(parseDecimal("0.1")!.plus(parseDecimal("0.2")!).eq(new Dec("0.3"))).toBe(true);
  });
});

describe("inclusive spec limits, no rounding (D1-07, S1-27, A-22)", () => {
  const ok = (field: string, value: string, unit = "%") =>
    proposal({ overrides: { [field]: { value, unit } } });
  it("ReH 355 passes, 354.9 and 354 fail", () => {
    expect(ok("mechanical.ReH", "355", "MPa")).toBe("release");
    expect(ok("mechanical.ReH", "354.9", "MPa")).toBe("block");
    expect(ok("mechanical.ReH", "354", "MPa")).toBe("block");
  });
  it("Mn 1.60 passes, 1.61 and 1.68 block (not review: plausibility ranges contain the limits, A-08)", () => {
    expect(ok("chemistry.Mn", "1.60")).not.toBe("block");
    const e161 = evalWith({ overrides: { "chemistry.Mn": { value: "1.61", unit: "%" } } });
    expect(e161.decision.proposal).toBe("block");
    expect(codes(e161)).toContain("RULE_FAIL:Mn");
    expect(ok("chemistry.Mn", "1.68")).toBe("block");
  });
  it("Rm 470 and 630 pass, 469 and 631 fail", () => {
    expect(ok("mechanical.Rm", "470", "MPa")).toBe("release");
    expect(ok("mechanical.Rm", "630", "MPa")).toBe("release");
    expect(ok("mechanical.Rm", "469", "MPa")).toBe("block");
    expect(ok("mechanical.Rm", "631", "MPa")).toBe("block");
  });
  it("A26: P 0.02500000000000000001 is above 0.025 and blocks; float would round it to 0.025 and release", () => {
    const e = evalWith({ overrides: { "chemistry.P": { value: "0.02500000000000000001", unit: "%" } } });
    expect(e.decision.proposal).toBe("block");
    expect(codes(e)).toContain("RULE_FAIL:P");
    expect(ok("mechanical.ReH", "354.99999999999999999", "MPa")).toBe("block");
  });
  it("A 20 passes, 19.9 fails; P 0.025 passes, 0.0251 fails", () => {
    expect(ok("mechanical.A", "20")).toBe("release");
    expect(ok("mechanical.A", "19.9")).toBe("block");
    expect(ok("chemistry.P", "0.025")).toBe("release");
    expect(ok("chemistry.P", "0.0251")).toBe("block");
  });
  it("each spec limit is a rule naming field, observed value and limit (S1-26)", () => {
    const e = evalWith({ overrides: { "chemistry.Cu": { value: "0.56", unit: "%" } } });
    const r = e.rule_results.find((x) => x.rule_id === "ESP-014.r3.Cu")!;
    expect(r.outcome).toBe("fail");
    expect(r.observed).toBe("0.56");
    expect(r.expected).toContain("0.55");
    expect(r.reason).toMatch(/Cu 0\.56 is above the maximum 0\.55/);
  });
  it("a rule on an unknown value is not_evaluable, never pass", () => {
    const e = evalWith({ overrides: { "chemistry.Si": { value: null, status: "unknown" } } });
    expect(e.rule_results.find((x) => x.rule_id === "ESP-014.r3.Si")!.outcome).toBe("not_evaluable");
    expect(e.decision.proposal).toBe("review");
  });
});

describe("CEV (A-02, A-20, A-22)", () => {
  const cevMax = limitOf(getShared().spec, "CEV")!;
  it("spec CEV maximum is 0.45 and applies to the exact recomputed value without rounding", () => {
    expect(cevMax.max).toBe("0.45");
    // Exact 0.4500 passes; 0.4549, 0.4550, 0.4551 fail. Composition chosen so that CEV = C + rest.
    const base = { Mn: "0", Cr: "0", Mo: "0", V: "0", Ni: "0", Cu: "0" };
    for (const c of ["0.4500", "0.4549", "0.4550", "0.4551"]) {
      expect(recomputeCev({ ...base, C: c })!.eq(new Dec(c))).toBe(true);
    }
    const run = (c: string, printed: string) => evalWith({
      overrides: {
        "chemistry.C": { value: c, unit: "%" }, "chemistry.Mn": { value: "0", unit: "%" }, "chemistry.Cr": { value: "0", unit: "%" },
        "chemistry.Mo": { value: "0", unit: "%" }, "chemistry.V": { value: "0", unit: "%" }, "chemistry.Ni": { value: "0", unit: "%" },
        "chemistry.Cu": { value: "0", unit: "%" }, cev_printed: { value: printed, unit: "%" },
      },
    });
    // C above its own 0.20 max would block anyway; check the CEV rules directly.
    const rec = (c: string, p: string) => run(c, p).rule_results.find((r) => r.rule_id.endsWith("CEV.recomputed"))!.outcome;
    expect(rec("0.4500", "0.45")).toBe("pass");
    expect(rec("0.4549", "0.45")).toBe("fail");
    expect(rec("0.4550", "0.46")).toBe("fail");
    expect(rec("0.4551", "0.46")).toBe("fail");
  });
  it("printed CEV 0.45 passes, 0.46 fails", () => {
    const printedRule = (p: string) => evalWith({ overrides: { cev_printed: { value: p, unit: "%" } } })
      .rule_results.find((r) => r.rule_id.endsWith("CEV.printed"))!.outcome;
    expect(printedRule("0.45")).toBe("pass");
    expect(printedRule("0.46")).toBe("fail");
  });
  it("coherence rounds half-even: 0.425 -> 0.42, 0.435 -> 0.44", () => {
    expect(roundCevForCoherence(new Dec("0.425")).toFixed(2)).toBe("0.42");
    expect(roundCevForCoherence(new Dec("0.435")).toFixed(2)).toBe("0.44");
    expect(cevCoherent("0.42", new Dec("0.425"))).toBe(true);
    expect(cevCoherent("0.43", new Dec("0.425"))).toBe(false);
  });
  it("printed CEV that does not match the composition is a review trigger (C9)", () => {
    const e = evalWith({ overrides: { cev_printed: { value: "0.38", unit: "%" } } });
    expect(codes(e)).toContain("CEV_MISMATCH");
    expect(e.decision.proposal).toBe("review");
  });
  it("printed 0.44 passing with recomputed above 0.45 blocks (A-03)", () => {
    const e = evalWith({ overrides: { "chemistry.Mn": { value: "1.60", unit: "%" }, "chemistry.C": { value: "0.19", unit: "%" }, cev_printed: { value: "0.44", unit: "%" } } });
    expect(codes(e)).toEqual(expect.arrayContaining(["CEV_MISMATCH", "RULE_FAIL:CEV"]));
    expect(e.decision.proposal).toBe("block");
  });
  // Behavioural guards against binary floating point (finding ADV-S1-F01, mutants M13/M14).
  const cevCase = (c: string, mn: string, cu: string, printed: string) => evalWith({
    overrides: {
      "chemistry.C": { value: c, unit: "%" }, "chemistry.Mn": { value: mn, unit: "%" }, "chemistry.Cu": { value: cu, unit: "%" },
      "chemistry.Cr": { value: "0", unit: "%" }, "chemistry.Mo": { value: "0", unit: "%" }, "chemistry.V": { value: "0", unit: "%" },
      "chemistry.Ni": { value: "0", unit: "%" }, cev_printed: { value: printed, unit: "%" },
    },
  });
  it("A25: exact CEV 0.45 (C 0.17 + Mn 1.50/6 + Cu 0.45/15) passes the max; float would give 0.45000000000000007", () => {
    const e = cevCase("0.17", "1.50", "0.45", "0.45");
    expect(e.cev_recomputed).toBe("0.45");
    expect(e.decision.proposal).toBe("release");
  });
  it("A16: exact CEV tie 0.425 printed 0.42 is coherent (half-even); printed 0.43 is not", () => {
    const e = cevCase("0.175", "1.50", "0", "0.42");
    expect(codes(e)).not.toContain("CEV_MISMATCH");
    expect(e.decision.proposal).toBe("release");
    expect(codes(cevCase("0.175", "1.50", "0", "0.43"))).toContain("CEV_MISMATCH");
  });
  it("an unknown CEV input makes the recomputed CEV unknown", () => {
    expect(recomputeCev({ C: "0.1", Mn: "1", Cr: null, Mo: "0", V: "0", Ni: "0", Cu: "0" })).toBeNull();
  });
});

describe("KV mean as an exact sum (D1-09, A-05)", () => {
  const kv = (a: string, b: string, c: string) => evalWith({
    overrides: { "mechanical.KV_1": { value: a, unit: "J" }, "mechanical.KV_2": { value: b, unit: "J" }, "mechanical.KV_3": { value: c, unit: "J" } },
  });
  it("sum exactly 81 passes, 80 fails, cert-01's 193 passes", () => {
    expect(kv("27", "27", "27").decision.proposal).toBe("release");
    expect(kv("27", "27", "26").decision.proposal).toBe("block");
    expect(kv("64", "71", "58").rule_results.find((r) => r.rule_id.endsWith("KV_media"))!.observed).toBe("sum 193");
  });
  it("fewer than three known values is not evaluable (review)", () => {
    const e = evalWith({ overrides: { "mechanical.KV_3": { value: null, status: "unknown" } } });
    expect(e.rule_results.find((r) => r.rule_id.endsWith("KV_media"))!.outcome).toBe("not_evaluable");
    expect(e.decision.proposal).toBe("review");
  });
  it("impact temperature must be -20 °C; other or missing values give review", () => {
    for (const v of ["-20", "−20"]) expect(proposal({ overrides: { kv_temperature: { value: v, unit: "°C" } } })).toBe("release");
    const e = evalWith({ overrides: { kv_temperature: { value: "0", unit: "°C" } } });
    expect(codes(e)).toContain("KV_TEMPERATURE_MISMATCH");
    expect(e.decision.proposal).toBe("review");
    expect(proposal({ overrides: { kv_temperature: { value: null, status: "absent" } } })).toBe("review");
  });
});

describe("document rules", () => {
  it("wrong grade blocks with both grades shown (C5)", () => {
    const e = evalWith({ overrides: { grade: { value: "TRN-275" } } });
    expect(e.decision.proposal).toBe("block");
    const r = e.decision.reasons.find((x) => x.code === "GRADE_MISMATCH")!;
    expect(r.detail).toContain("TRN-275");
    expect(r.detail).toContain("TRN-355");
  });
  it("missing stamp gives review; illegible stamp gives review (C13, S1-30)", () => {
    expect(codes(evalWith({ overrides: { inspection_stamp: { value: null, status: "absent" } } }))).toContain("STAMP_MISSING");
    expect(proposal({ overrides: { inspection_stamp: { value: null, status: "unknown" } } })).toBe("review");
    expect(proposal({ scan: true, overrides: { inspection_stamp: { value: null, status: "absent" } } })).toBe("review");
  });
  it("certificate type 2.2 or absent gives review (A-06)", () => {
    expect(codes(evalWith({ overrides: { certificate_type: { value: "2.2" } } }))).toContain("CERT_TYPE_NOT_3_1");
    expect(proposal({ overrides: { certificate_type: { value: null, status: "absent" } } })).toBe("review");
  });
});

describe("heat or lot against the delivery line (S1-21, A-04, A-12, D1-14)", () => {
  it("mismatch gives review with both heats visible", () => {
    const e = evalWith({ line: deliveryLine("ALB-2026-0917.csv", "2") });
    expect(e.decision.proposal).toBe("review");
    const r = e.decision.reasons.find((x) => x.code === "HEAT_MISMATCH")!;
    expect(r.detail).toContain("24-71830");
    expect(r.detail).toContain("24-71902");
  });
  it("heat mismatch means review even when a rule fails or the grade is wrong (A-04)", () => {
    const e = evalWith({ line: deliveryLine("ALB-2026-0917.csv", "2"), overrides: { "chemistry.Mn": { value: "1.70", unit: "%" }, grade: { value: "TRN-275" } } });
    expect(e.decision.proposal).toBe("review");
    expect(e.decision.reasons.find((x) => x.code === "RULE_FAIL:Mn")!.effect).toBe("info");
  });
  it("scan with a heat mismatch gives review", () => {
    expect(proposal({ scan: true, line: deliveryLine("ALB-2026-0917.csv", "3") })).toBe("review");
  });
  it("whitespace is trimmed, nothing else is normalised", () => {
    expect(proposal({ overrides: { heat_or_lot: { value: " 24-71830 " } } })).toBe("release");
    expect(proposal({ overrides: { heat_or_lot: { value: "24-71830A" } } })).toBe("review");
  });
  it("no paired delivery line is missing evidence: review", () => {
    const e = evalWith({ line: null });
    expect(codes(e)).toContain("EVIDENCE_MISSING:delivery_line");
    expect(e.decision.proposal).toBe("review");
  });
});

describe("units and scale jumps (S1-22, S1-23, A-08, A-11)", () => {
  it("MPa and N/mm² are accepted; ksi or no unit gives review without conversion", () => {
    expect(proposal({ overrides: { "mechanical.ReH": { value: "392", unit: "N/mm²" } } })).toBe("release");
    const e = evalWith({ overrides: { "mechanical.ReH": { value: "56.9", unit: "ksi" } } });
    expect(codes(e)).toContain("UNIT_UNEXPECTED:ReH");
    expect(e.fields.get("mechanical.ReH")!.value).toBeNull();
    expect(proposal({ overrides: { "mechanical.Rm": { value: "538", unit: null } } })).toBe("review");
  });
  it("a value outside the plausibility range is a scale jump: review, not block", () => {
    const e = evalWith({ overrides: { "chemistry.C": { value: "16", unit: "%" } } });
    expect(codes(e)).toContain("IMPLAUSIBLE:C");
    expect(e.decision.proposal).toBe("review");
  });
  it("every plausibility range strictly contains its spec limits", () => {
    const { spec, plausibility } = getShared();
    const key = (f: string) => (["ReH", "Rm", "A"].includes(f) ? `mechanical.${f}` : f === "CEV" ? "cev_printed" : `chemistry.${f}`);
    for (const l of spec.limits.filter((x) => x.field !== "KV_media")) {
      const r = plausibility.ranges[key(l.field)]!;
      if (l.max !== null) expect(new Dec(r.max).gt(new Dec(l.max)), l.field).toBe(true);
      if (l.min !== null) expect(new Dec(r.min).lt(new Dec(l.min)), l.field).toBe(true);
    }
    const kv = plausibility.ranges["mechanical.KV_1"]!;
    expect(new Dec(kv.min).lt(new Dec(limitOf(spec, "KV_media")!.min!))).toBe(true);
  });
});

describe("decision precedence and I5 (S1-31, D1-03)", () => {
  it("block > review > release, and human_required is always true", () => {
    expect(propose([]).proposal).toBe("release");
    expect(propose([{ code: "X", effect: "review", detail: "" }]).proposal).toBe("review");
    expect(propose([{ code: "X", effect: "review", detail: "" }, { code: "Y", effect: "block", detail: "" }]).proposal).toBe("block");
    expect(propose([]).human_required).toBe(true);
  });
  it("each I5 trigger alone prevents release", () => {
    const triggers: Parameters<typeof evalWith>[0][] = [
      { line: null }, // evidence missing
      { line: deliveryLine("ALB-2026-0917.csv", "2") }, // heat mismatch
      { overrides: { "chemistry.S": { value: "0.03", unit: "%" } } }, // rule fails
      { overrides: { "mechanical.A": { value: "26", unit: "mm" } } }, // unit inconsistent
      { overrides: { inspection_stamp: { value: null, status: "absent" } } }, // stamp missing
      { scan: true }, // no second channel
    ];
    for (const t of triggers) expect(proposal(t)).not.toBe("release");
    // Channel disagreement and invalid model output: see channels.test.ts and reader.test.ts.
  });
  it("a scan with every value in spec is review, never release (D1-04)", () => {
    const e = evalWith({ scan: true });
    expect(e.decision.proposal).toBe("review");
    expect(codes(e)).toContain("NO_SECOND_CHANNEL");
  });
  it("a scan with a known failing value blocks (D1-03)", () => {
    expect(proposal({ scan: true, overrides: { "chemistry.Mn": { value: "1.68", unit: "%" } } })).toBe("block");
  });
  it("an unknown critical field forces review and names the field (S1-17)", () => {
    const e = evalWith({ overrides: { "mechanical.ReH": { value: null, status: "unknown" } } });
    expect(e.decision.proposal).toBe("review");
    expect(codes(e)).toContain("CRITICAL_UNKNOWN:ReH");
  });
});
