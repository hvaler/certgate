// Human decision and per-field human confirmation (S1-09, S1-10, S1-48, A-07, A-21).
import { describe, expect, it } from "vitest";
import { CRITICAL_FIELDS } from "../src/fields.js";
import { confirmFields, ConfirmationError, HumanDecisionError, recordHumanDecision } from "../src/pipeline.js";
import type { FieldConfirmation } from "../src/types.js";
import { expected, runCase } from "./helpers.js";

const AT = "2026-10-12T18:00:00.000Z";
const confirm = (field: string, value: string | null): FieldConfirmation =>
  ({ field, value, unit: null, confirmed_by: "quality.tech", confirmed_at: AT });

/** Confirmations of every critical field of a case, using its correct reading, with overrides. */
function confirmAll(id: string, overrides: Record<string, string>): FieldConfirmation[] {
  const r = expected(id).correct_reading as Record<string, any>;
  return CRITICAL_FIELDS.map((key) => {
    const [g, n] = key.split(".");
    const f = n ? r[g!][n] : r[g!];
    return confirm(key, overrides[key] ?? f.value);
  });
}

describe("per-field human confirmation re-runs coherence and rules (A-07, A-21)", () => {
  it("(a) cert-03 with every critical field confirmed and ReH 358 proposes release", async () => {
    const r = confirmFields(await runCase("cg-003"), confirmAll("cg-003", { "mechanical.ReH": "358" }));
    expect(r.decision.proposal).toBe("release");
    expect(r.decision.human_confirmation_required).toEqual([]);
    expect(r.decision.human_required).toBe(true);
  });
  it("(b) cert-03 with only ReH confirmed as 358 stays review: no second channel", async () => {
    const r = confirmFields(await runCase("cg-003"), [confirm("mechanical.ReH", "358")]);
    expect(r.decision.proposal).toBe("review");
    expect(r.decision.reasons.map((x) => x.code)).toContain("NO_SECOND_CHANNEL");
  });
  it("(c) ReH confirmed as 338 blocks, even with other fields unconfirmed", async () => {
    const r = confirmFields(await runCase("cg-003"), [confirm("mechanical.ReH", "338")]);
    expect(r.decision.proposal).toBe("block");
    expect(r.decision.reasons.map((x) => x.code)).toContain("RULE_FAIL:ReH");
  });
  it("a confirmation may change a confident reading; the receipt keeps both values", async () => {
    const r = confirmFields(await runCase("cg-016"), [confirm("chemistry.Mn", "1.70")]);
    expect(r.decision.proposal).toBe("block");
    const c = r.receipt.confirmations.find((x) => x.field === "chemistry.Mn")!;
    expect(c.read_value).toBe("1.42");
    expect(c.value).toBe("1.70");
    expect(c.confirmed_by).toBe("quality.tech");
    expect(c.confirmed_at).toBe(AT);
    expect(c.reading_source).toBe("mock");
    expect(r.receipt.values.find((v) => v.field === "chemistry.Mn")!.source).toContain("human_confirmed");
  });
  it("confirming a field resolves a channel disagreement on a digital certificate", async () => {
    const r = confirmFields(await runCase("cg-018"), [confirm("chemistry.Mn", "1.43")]);
    expect(r.decision.proposal).toBe("release");
  });
  it("rejects a confirmation without who, when, or with a non-decimal value", async () => {
    const base = await runCase("cg-003");
    expect(() => confirmFields(base, [{ ...confirm("mechanical.ReH", "358"), confirmed_by: "" }])).toThrow(ConfirmationError);
    expect(() => confirmFields(base, [{ ...confirm("mechanical.ReH", "358"), confirmed_at: "" }])).toThrow(ConfirmationError);
    expect(() => confirmFields(base, [confirm("mechanical.ReH", "35x")])).toThrow(ConfirmationError);
    expect(() => confirmFields(base, [confirm("not.a.field", "1")])).toThrow(ConfirmationError);
  });
});

describe("human decision: release, block or request a new certificate (S1-09, S1-10)", () => {
  it("records who, when and why without changing the proposal", async () => {
    const r = await runCase("cg-002");
    const d = recordHumanDecision(r, { action: "request_new_certificate", reason: "Mn out of spec; ask the mill", decided_by: "q.manager", decided_at: AT });
    expect(d.decision.proposal).toBe("block");
    expect(d.decision.human_decision).toBe("request_new_certificate");
    expect(d.decision.decided_by).toBe("q.manager");
    expect(d.decision.decided_at).toBe(AT);
    expect(d.decision.decision_reason).toBe("Mn out of spec; ask the mill");
    expect(d.receipt.human_decision).toEqual({ action: "request_new_certificate", by: "q.manager", at: AT, reason: "Mn out of spec; ask the mill" });
  });
  it("without a human decision the case stays proposal-only", async () => {
    const r = await runCase("cg-001");
    expect(r.decision.proposal).toBe("release");
    expect(r.decision.human_decision).toBeNull();
    expect(r.receipt.human_decision).toBeNull();
  });
  it("rejects a decision without a reason, a person or a valid action", async () => {
    const r = await runCase("cg-001");
    expect(() => recordHumanDecision(r, { action: "release", reason: " ", decided_by: "x", decided_at: AT })).toThrow(HumanDecisionError);
    expect(() => recordHumanDecision(r, { action: "release", reason: "ok", decided_by: "", decided_at: AT })).toThrow(HumanDecisionError);
    expect(() => recordHumanDecision(r, { action: "approve" as never, reason: "ok", decided_by: "x", decided_at: AT })).toThrow(HumanDecisionError);
  });
});
