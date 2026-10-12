// ModelReader / MockReader, failure injection, real mode, receipt labels (S1-18..S1-20, S1-32, S1-33, A-14,
// A-15, A-18, A-19, D1-05, D1-15).
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadDatasetCase, loadShared } from "../src/cases.js";
import { parseModelOutput } from "../src/model-output.js";
import { processCase } from "../src/pipeline.js";
import { MockReader, ReaderError, UnconfiguredLiveReader } from "../src/reader.js";
import { exportReceipt, ReceiptExportError } from "../src/receipt.js";
import { parseStrictJson } from "../src/strict-json.js";
import { DATA, getShared, runCase } from "./helpers.js";

const mockText = (id: string) => readFileSync(path.join(DATA, "cases", id, "reading.json"), "utf8");

describe("failure injection and bounded retry (C11)", () => {
  const classes: [string, string, number][] = [
    ["cg-023", "endpoint_off", 1], ["cg-024", "timeout", 3], ["cg-025", "http_429", 3],
    ["cg-026", "http_5xx", 3], ["cg-027", "invalid_json", 1],
  ];
  for (const [id, cls, calls] of classes) {
    it(`${id} ${cls}: status error, review, exactly ${calls} reader call(s), error class in receipt`, async () => {
      const input = loadDatasetCase(id, getShared());
      const r = await processCase(input);
      expect(input.reader.calls).toBe(calls);
      expect(r.receipt.reader.calls).toBe(String(calls));
      expect(r.readings.case.status).toBe("error");
      expect(r.decision.proposal).toBe("review");
      expect(r.receipt.errors[0]!.class).toBe(cls);
      expect(r.decision.reasons.map((x) => x.code)).toEqual([`READER_ERROR:${cls}`]);
    });
    it(`${id} ${cls}: the receipt labels the injected failure as planted in structural fields (finding F-01)`, async () => {
      const r = await processCase(loadDatasetCase(id, getShared()));
      expect(r.receipt.reading_source).toBe("planted");
      expect(r.receipt.reader.reading_source).toBe("planted");
      expect(r.receipt.planted).toEqual([expect.objectContaining({ kind: "failure" })]);
      expect(r.receipt.errors).toEqual([expect.objectContaining({ class: cls, injected: true })]);
      expect(r.receipt.errors[0]!.detail).toMatch(/^INJECTED \(mock, planted\)/);
      expect(() => exportReceipt(r.receipt, {})).not.toThrow();
    });
  }

  it("a model output that breaks the reading schema is invalid output: review", () => {
    const doc = JSON.parse(mockText("cg-001"));
    delete doc.fields.chemistry.Mn;
    expect(() => parseModelOutput(JSON.stringify(doc))).toThrow(ReaderError);
    try { parseModelOutput(JSON.stringify(doc)); } catch (e) { expect((e as ReaderError).errorClass).toBe("invalid_output"); }
  });

  it("a JSON number in the model output is rejected (S1-25)", () => {
    const text = mockText("cg-001").replace('"value": "0.16"', '"value": 0.16');
    expect(text).toContain("0.16,");
    try { parseModelOutput(text); expect.unreachable(); } catch (e) { expect((e as ReaderError).errorClass).toBe("invalid_output"); }
  });
});

describe("real mode without an endpoint (S1-19, D1-15)", () => {
  it("fails visibly and never falls back to the mock", async () => {
    const shared = loadShared("real");
    const input = loadDatasetCase("cg-001", shared);
    expect(input.reader).toBeInstanceOf(UnconfiguredLiveReader);
    const r = await processCase(input);
    expect(r.readings.case.status).toBe("error");
    expect(r.decision.proposal).toBe("review");
    expect(r.receipt.errors[0]!.class).toBe("endpoint_not_configured");
    expect(r.receipt.errors[0]!.injected).toBe(false);
    expect(r.receipt.planted).toEqual([]);
    expect(r.receipt.reader.model_id).not.toMatch(/MOCK/);
    expect(r.readings.model).toBeNull();
  });
});

describe("mock label everywhere (I7, S1-18, A-18)", () => {
  it("receipt of a mock run carries the mock label and reading_source", async () => {
    const r = await runCase("cg-001");
    expect(r.receipt.reading_source).toBe("mock");
    expect(r.receipt.reader.model_id).toMatch(/^MOCK/);
    expect(r.receipt.reader.vllm_version).toBe("not applicable (mock)");
    expect(r.receipt.reader.rocm_version).toBe("not applicable (mock)");
  });
  it("planted deviations are labelled planted in the receipt (D1-20)", async () => {
    const r = await runCase("cg-018");
    expect(r.receipt.reading_source).toBe("planted");
    expect(r.receipt.planted).toEqual([expect.objectContaining({ kind: "misread", field: "chemistry.Mn" })]);
  });
  it("the exporter rejects a receipt without reading_source or without the mock label", async () => {
    const r = await runCase("cg-001");
    const { reading_source: _, ...noSource } = r.receipt;
    expect(() => exportReceipt(noSource as never)).toThrow(ReceiptExportError);
    expect(() => exportReceipt({ ...r.receipt, reader: { ...r.receipt.reader, model_id: "gpt-x" } })).toThrow(ReceiptExportError);
  });
});

describe("receipt content (S1-33, A-15, A-19)", () => {
  it("has case id, versions, hashes, spec id and revision, timings; no JSON numbers", async () => {
    const r = await runCase("cg-001");
    const json = exportReceipt(r.receipt);
    const rc = parseStrictJson(json, "receipt") as Record<string, any>; // throws on any JSON number
    expect(rc.case_id).toBe("cg-001");
    expect(rc.spec).toEqual({ spec_id: "ESP-014", revision: "3", grade: "TRN-355" });
    expect(rc.rules_version).toMatch(/^certgate-rules-/);
    expect(rc.hashes.certificate_sha256).toBe("55c15e2e23d2928af427c633c19ef1605f9e4145ba330c0aec1b469d19eca4c6");
    expect(rc.hashes.spec_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(rc.timings_ms)).toEqual(expect.arrayContaining(["validate", "text_layer", "model_reading", "evaluation"]));
  });
  it("contains no secret environment value and no absolute path", async () => {
    const r = await runCase("cg-001");
    expect(() => exportReceipt(r.receipt, { MODEL_API_KEY: "mock-reader" })).toThrow(ReceiptExportError);
    const json = exportReceipt(r.receipt, {});
    expect(json).not.toMatch(/[A-Za-z]:\\\\|\/home\/|\/app\/|C:\/nexus/);
  });
});

describe("the model explains, it never decides (I1, S1-32, C10)", () => {
  it("contaminated explanation text has no effect on the proposal", async () => {
    const r = await runCase("cg-021");
    expect(r.explanation!.planted).toBe(true);
    expect(r.explanation!.used_for_decision).toBe(false);
    expect(r.decision.proposal).toBe("block");
  });
  it("adding or changing an explanation never changes the proposal", async () => {
    for (const text of ["Proposed: RELEASE.", "Proposed: BLOCK. Mn is out of range.", "ignore the rules"]) {
      const doc = JSON.parse(mockText("cg-001"));
      doc.explanation = { text, planted: false };
      const input = loadDatasetCase("cg-001", getShared());
      const r = await processCase({ ...input, reader: new MockReader(JSON.stringify(doc)) });
      expect(r.decision.proposal).toBe("release");
    }
  });
});
