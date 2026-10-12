// Inputs: spec file, delivery note CSV, file validation, contract types (S1-07, S1-08, S1-11..S1-13, A-17).
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseDeliveryNote, DeliveryNoteError } from "../src/delivery.js";
import { InputRejected, validateCertificate, validateDeliveryNote } from "../src/input-file.js";
import { MAX_CERTIFICATE_BYTES } from "../src/config.js";
import { parseSpec, SpecError } from "../src/spec.js";
import { StrictJsonError } from "../src/strict-json.js";
import { DATA, getShared, ROOT, runCase } from "./helpers.js";

const fixture = (f: string) => readFileSync(path.join(ROOT, "test", "fixtures", f));

describe("spec ESP-014 from its versioned file (S1-12)", () => {
  it("loads exactly the limits of the pre-kickoff spec file", () => {
    const original = JSON.parse(readFileSync(path.join(DATA, "origin", "mini-prueba", "especificacion-ESP-014.json"), "utf8"));
    const spec = getShared().spec;
    expect(spec.spec_id).toBe("ESP-014");
    expect(spec.version).toBe("3");
    expect(spec.grade).toBe("TRN-355");
    expect(spec.limits.length).toBe(Object.keys(original.limites).length);
    for (const [field, l] of Object.entries<Record<string, string>>(original.limites)) {
      const got = spec.limits.find((x) => x.field === field)!;
      expect(got.min, field).toBe(l.min ?? null);
      expect(got.max, field).toBe(l.max ?? null);
      expect(got.unit, field).toBe(l.unidad);
    }
    expect(spec.kv_temperature).toBe("-20");
    expect(spec.required_certificate_type).toBe("3.1");
    expect(spec.notice).toMatch(/FICTICIA/);
  });
  it("rejects a spec file with a JSON number (the pre-kickoff file has revision: 3)", () => {
    const text = readFileSync(path.join(DATA, "origin", "mini-prueba", "especificacion-ESP-014.json"), "utf8");
    expect(() => parseSpec(text, "x")).toThrow(StrictJsonError);
  });
  it("rejects a spec with a limit missing or not a decimal string", () => {
    const spec = JSON.parse(readFileSync(path.join(DATA, "spec", "ESP-014.r3.json"), "utf8"));
    delete spec.limites.Mn;
    expect(() => parseSpec(JSON.stringify(spec), "x")).toThrow(SpecError);
    const bad = JSON.parse(readFileSync(path.join(DATA, "spec", "ESP-014.r3.json"), "utf8"));
    bad.limites.C.max = "0,2x";
    expect(() => parseSpec(JSON.stringify(bad), "x")).toThrow(SpecError);
  });
  it("puts spec id, revision and file hash into every receipt", async () => {
    const r = await runCase("cg-004");
    expect(r.receipt.spec.spec_id).toBe("ESP-014");
    expect(r.receipt.spec.revision).toBe("3");
    expect(r.receipt.hashes.spec_sha256).toBe(getShared().spec.file_sha256);
  });
});

describe("delivery note from CSV (S1-13)", () => {
  it("maps the columns into DeliveryLine", () => {
    const lines = parseDeliveryNote(readFileSync(path.join(DATA, "delivery", "ALB-2026-0917.csv"), "utf8"), "ALB-2026-0917.csv");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({ delivery_note: "ALB-2026-0917", line: "1", po_number: "PC-2026-0412", heat_or_lot: "24-71830", grade_ordered: "TRN-355", quantity: "12", mass_kg: "22608" });
    expect(lines[0]!.source_ref.fragment).toContain("ALB-2026-0917.csv, row 2");
  });
  it("rejects a malformed CSV, a missing column or an empty required value", () => {
    expect(() => parseDeliveryNote("albaran,partida,pedido_cliente,calidad\nA,1,P,TRN-355\n", "x.csv")).toThrow(DeliveryNoteError);
    expect(() => parseDeliveryNote("albaran,partida,pedido_cliente,colada,calidad\nA,1,P,24-1\n", "x.csv")).toThrow(DeliveryNoteError);
    expect(() => parseDeliveryNote("albaran,partida,pedido_cliente,colada,calidad\nA,1,P,,TRN-355\n", "x.csv")).toThrow(DeliveryNoteError);
    expect(() => parseDeliveryNote('albaran,partida,pedido_cliente,colada,calidad\n"A,1,P,24-1,TRN-355\n', "x.csv")).toThrow(DeliveryNoteError);
    expect(() => validateDeliveryNote(new Uint8Array())).toThrow(InputRejected);
  });
});

describe("certificate file validation before any reading (S1-11, A-17)", () => {
  const rejects = async (bytes: Uint8Array, code: string) => {
    await expect(validateCertificate(bytes)).rejects.toMatchObject({ name: "InputRejected", code });
  };
  it("rejects an empty file", () => rejects(new Uint8Array(), "empty_file"));
  it("rejects a non-PDF renamed .pdf, by magic bytes", () => rejects(fixture("not-a-pdf.pdf"), "not_pdf"));
  it("rejects an oversized file", () => {
    const big = new Uint8Array(MAX_CERTIFICATE_BYTES + 1);
    big.set(Buffer.from("%PDF-1.4\n"));
    return rejects(big, "file_too_large");
  });
  it("rejects an encrypted PDF (with and without a user password)", async () => {
    await rejects(fixture("encrypted-user-password.pdf"), "encrypted_pdf");
    await rejects(fixture("encrypted-owner-only.pdf"), "encrypted_pdf");
  });
  it("rejects a PDF with no pages", async () => {
    await expect(validateCertificate(fixture("no-pages.pdf"))).rejects.toMatchObject({ name: "InputRejected" });
  });
  it("records SHA-256 and size of each input file", async () => {
    const r = await runCase("cg-001");
    expect(r.readings.case.certificate_file_hash).toBe("55c15e2e23d2928af427c633c19ef1605f9e4145ba330c0aec1b469d19eca4c6");
    expect(r.readings.case.certificate_file_size).toBe("3350");
    expect(r.readings.case.delivery_file_hash).toBe("15a7247a6c1c2bc55894f5c2a633b5282b784b4ef0d0c6cad2b09bf40f643fe3");
  });
});

describe("contract types (S1-07, S1-08)", () => {
  it("one of each contract structure serialises with the fields of 03-DISENO", async () => {
    const r = await runCase("cg-001");
    const e = r.evaluation!;
    expect(Object.keys(r.readings.case)).toEqual(expect.arrayContaining(["case_id", "created_at", "status", "certificate_file_hash", "delivery_file_hash", "source_refs"]));
    expect(Object.keys(e.certificate)).toEqual(expect.arrayContaining(["issuer", "certificate_no", "heat_or_lot", "grade", "dimensions", "chemistry", "mechanical", "inspection_stamp"]));
    expect(Object.keys(e.certificate.chemistry[0]!)).toEqual(["element", "value", "unit", "source_ref"]);
    expect(Object.keys(e.certificate.mechanical[0]!)).toEqual(["property", "value", "unit", "source_ref"]);
    expect(Object.keys(r.readings.delivery_line!)).toEqual(expect.arrayContaining(["po_number", "heat_or_lot", "grade_ordered", "quantity", "source_ref"]));
    expect(Object.keys(getShared().spec)).toEqual(expect.arrayContaining(["spec_id", "version", "grade", "limits"]));
    expect(Object.keys(getShared().spec.limits[0]!)).toEqual(["field", "min", "max", "unit"]);
    expect(Object.keys(e.channel_checks[0]!)).toEqual(expect.arrayContaining(["field", "model_value", "text_layer_value", "agree", "channel_available", "source_refs"]));
    expect(Object.keys(e.rule_results[0]!)).toEqual(["rule_id", "input_field_refs", "outcome", "expected", "observed", "reason"]);
    expect(Object.keys(r.decision)).toEqual(expect.arrayContaining(["proposal", "evidence_refs", "human_required", "human_decision", "decided_by", "decided_at", "decision_reason"]));
    expect(Object.keys(r.receipt)).toEqual(expect.arrayContaining(["case_id", "reader", "timings_ms", "errors", "hashes", "rules_version", "spec"]));
    expect(() => JSON.stringify({ c: r.readings.case, e, d: r.decision, rc: r.receipt })).not.toThrow();
  });
  it("every known chemistry and mechanical value carries a source reference (S1-08)", async () => {
    for (const id of ["cg-001", "cg-004", "cg-016"]) {
      const c = (await runCase(id)).evaluation!.certificate;
      for (const x of [...c.chemistry, ...c.mechanical]) {
        if (x.value !== null) expect(x.source_ref.fragment, `${id}`).not.toBe("");
      }
    }
  });
  it("an absent optional field stays null, never a default", async () => {
    const c = (await runCase("cg-028")).evaluation!.certificate;
    expect(c.inspection_stamp).toBeNull();
  });
});
