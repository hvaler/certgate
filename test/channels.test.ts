// Text-layer channel and channel comparison (S1-14, S1-15, S1-16, A-10, A-11, A-16, D1-20).
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CRITICAL_FIELDS } from "../src/fields.js";
import { openPdf } from "../src/pdf.js";
import { extractTextLayer } from "../src/text-layer.js";
import { decimalTextEqual } from "../src/decimal.js";
import { codes, DATA, evalWith, expected, getShared, modelFields, runCase } from "./helpers.js";
import { evaluate } from "../src/evaluate.js";
import { deliveryLine, withOverrides, agreeingTextLayer } from "./helpers.js";

async function textLayerOf(id: string) {
  const pdf = await openPdf(readFileSync(path.join(DATA, "cases", id, "certificate.pdf")));
  return extractTextLayer(pdf.pages);
}

function truth(id: string, key: string): { value: string | null; status: string } {
  const r = expected(id).correct_reading as Record<string, any>;
  const [g, n] = key.split(".");
  return n ? r[g!][n] : r[g!];
}

describe("text-layer extraction without any model", () => {
  const digital = ["cg-001", "cg-004", "cg-005", "cg-009", "cg-014", "cg-019", "cg-028", "cg-029", "cg-030"];
  for (const id of digital) {
    it(`${id}: every critical field equals the correct reading`, async () => {
      const tl = await textLayerOf(id);
      expect(tl.channel_available).toBe(true);
      expect(tl.conflicts.size).toBe(0);
      for (const key of CRITICAL_FIELDS) {
        const t = truth(id, key);
        const got = tl.fields.get(key);
        if (t.status === "absent") {
          expect(got === undefined || got.status === "absent", `${id} ${key}`).toBe(true);
          continue;
        }
        expect(got?.status, `${id} ${key}`).toBe("read");
        const same = /^(chemistry|mechanical)\.|cev_printed|kv_temperature/.test(key)
          ? decimalTextEqual(got!.value!, t.value!) : got!.value === t.value;
        expect(same, `${id} ${key}: ${got?.value} vs ${t.value}`).toBe(true);
      }
    });
  }

  it("layout B uses a decimal comma, which is normalised (A-10)", async () => {
    const tl = await textLayerOf("cg-006");
    expect(tl.fields.get("chemistry.P")!.value).toBe("0.031");
  });

  it("units printed in headers apply to the values under them (A-11)", async () => {
    const tl = await textLayerOf("cg-013");
    expect(tl.fields.get("mechanical.ReH")!.unit).toBe("ksi");
    expect(tl.fields.get("chemistry.Mn")!.unit).toBe("%");
    expect((await textLayerOf("cg-014")).fields.get("mechanical.Rm")!.unit).toBe("N/mm²");
  });

  it("a spoofed duplicate field in free text is a conflict (A-16)", async () => {
    const tl = await textLayerOf("cg-022");
    expect(tl.conflicts.get("mechanical.ReH")).toEqual(expect.arrayContaining(["340", "400"]));
  });

  it("an approval instruction in the text layer never becomes a field value (C10)", async () => {
    const tl = await textLayerOf("cg-021");
    expect(tl.conflicts.size).toBe(0);
    expect(tl.fields.get("chemistry.Si")!.value).toBe("0.62");
  });

  it("the C8 text-layer Mn comes from the PDF bytes, not from the planted misread (D1-20)", async () => {
    expect((await textLayerOf("cg-018")).fields.get("chemistry.Mn")!.value).toBe("1.43");
    const mock = JSON.parse(readFileSync(path.join(DATA, "cases", "cg-018", "reading.json"), "utf8"));
    expect(mock.fields.chemistry.Mn.value).toBe("1.48");
  });

  for (const id of ["cg-002", "cg-003", "cg-016", "cg-017", "cg-025"]) {
    it(`${id}: a scan yields "no channel available", not an error (S1-15)`, async () => {
      const tl = await textLayerOf(id);
      expect(tl.channel_available).toBe(false);
      const r = await runCase(id);
      expect(r.receipt.channel_available).toBe(false);
      expect(r.receipt.errors.filter((e) => e.class !== "http_429")).toEqual([]);
      if (id !== "cg-025") {
        expect(r.decision.human_confirmation_required.length).toBe(CRITICAL_FIELDS.length);
        expect(r.evaluation!.channel_checks.every((c) => !c.channel_available && c.issue === "no_second_channel")).toBe(true);
      }
    });
  }
});

describe("channel comparison (I3)", () => {
  it("disagreement makes the field unknown, keeps both readings and proposes review (C8)", async () => {
    const r = await runCase("cg-018");
    const check = r.evaluation!.channel_checks.find((c) => c.field === "chemistry.Mn")!;
    expect(check.agree).toBe(false);
    expect(check.model_value).toBe("1.48");
    expect(check.text_layer_value).toBe("1.43");
    expect(r.evaluation!.fields.get("chemistry.Mn")!.value).toBeNull();
    expect(r.decision.proposal).toBe("review");
    expect(r.receipt.channel_checks.find((c) => c.field === "chemistry.Mn")!.text_layer_value).toBe("1.43");
  });

  it("equality is exact-decimal, not string equality", () => {
    const s = getShared();
    const model = modelFields("cg-001");
    const tl = agreeingTextLayer(withOverrides(model, { "chemistry.P": { value: "0.0120" } }));
    const e = evaluate({ model, textLayer: tl, deliveryLine: deliveryLine(), spec: s.spec, plausibility: s.plausibility, confirmations: [] });
    expect(e.decision.proposal).toBe("release");
    const tl2 = agreeingTextLayer(withOverrides(model, { "chemistry.P": { value: "0.013" } }));
    const e2 = evaluate({ model, textLayer: tl2, deliveryLine: deliveryLine(), spec: s.spec, plausibility: s.plausibility, confirmations: [] });
    expect(codes(e2)).toContain("CHANNEL_DISAGREE:P");
  });

  it("a field missing from the text layer is not corroborated: review", () => {
    const s = getShared();
    const model = modelFields("cg-001");
    const tl = agreeingTextLayer(model);
    tl.fields.delete("mechanical.Rm");
    const e = evaluate({ model, textLayer: tl, deliveryLine: deliveryLine(), spec: s.spec, plausibility: s.plausibility, confirmations: [] });
    expect(codes(e)).toContain("TEXT_LAYER_MISSING:Rm");
    expect(e.decision.proposal).toBe("review");
  });

  it("an unknown model value is never replaced by the text layer's value (I2)", () => {
    const e = evalWith({ overrides: { "mechanical.ReH": { value: null, status: "unknown" } } });
    expect(e.fields.get("mechanical.ReH")!.value).toBeNull();
  });
});
