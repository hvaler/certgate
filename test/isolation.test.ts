// Isolation between consecutive cases in one process (C12, S1-36, A-13).
import { describe, expect, it } from "vitest";
import { getShared, runCase, stableReceipt } from "./helpers.js";

describe("consecutive cases do not contaminate each other", () => {
  // A has unknowns and a reader failure path nearby; B is clean.
  const A = ["cg-003", "cg-024"];
  const B = "cg-001";

  it("A -> B, B -> A and B alone give identical receipts for B (minus ids and timings)", async () => {
    const specBefore = structuredClone(getShared().spec);
    const alone = stableReceipt(await runCase(B));
    for (const a of A) await runCase(a);
    const afterA = stableReceipt(await runCase(B));
    const first = stableReceipt(await runCase(B));
    for (const a of A) await runCase(a);
    expect(afterA).toEqual(alone);
    expect(first).toEqual(alone);
    expect(getShared().spec).toEqual(specBefore);
  });

  it("every dataset case gives the same receipt in sequence and alone", async () => {
    const ids = ["cg-002", "cg-018", "cg-022", "cg-011", "cg-016"];
    const seq = [];
    for (const id of ids) seq.push(stableReceipt(await runCase(id)));
    for (const [i, id] of [...ids].reverse().entries()) {
      expect(stableReceipt(await runCase(id))).toEqual(seq[ids.length - 1 - i]);
    }
  });

  it("no value of the first case appears in the second", async () => {
    const a = await runCase("cg-005");
    const b = await runCase("cg-008");
    const json = JSON.stringify(b.receipt);
    expect(json).not.toContain(a.readings.case.certificate_file_hash);
    expect(json).not.toContain("24-73117");
    expect(json).not.toContain("1.65");
  });
});
