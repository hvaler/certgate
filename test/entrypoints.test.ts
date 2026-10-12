// CLI and HTTP entry points (S1-05, S1-41 entry points, adversary msg 0a960033).
import { cpSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { EXIT, main } from "../src/cli.js";
import { createApp } from "../src/server.js";
import { DATA, ROOT } from "./helpers.js";

async function cli(args: string[]) {
  let out = "";
  const code = await main(args, (s) => { out += s; });
  return { code, out };
}

describe("CLI", () => {
  it("processes a named dataset case and prints proposal and receipt (exit 0)", async () => {
    const { code, out } = await cli(["process", "--case", "cg-002"]);
    expect(code).toBe(EXIT.processed);
    const j = JSON.parse(out);
    expect(j.summary.proposal).toBe("block");
    expect(j.receipt.case_id).toBe("cg-002");
    expect(j.receipt.reader.model_id).toMatch(/^MOCK/);
  });
  it("a reader failure is still a processed case (exit 0) with status error", async () => {
    const { code, out } = await cli(["process", "--case", "cg-024"]);
    expect(code).toBe(EXIT.processed);
    expect(JSON.parse(out).summary.status).toBe("error");
  });
  it("processes an external case directory", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "certgate-ext-"));
    cpSync(path.join(DATA, "cases", "cg-005", "certificate.pdf"), path.join(dir, "certificate.pdf"));
    cpSync(path.join(DATA, "cases", "cg-005", "reading.json"), path.join(dir, "reading.json"));
    cpSync(path.join(DATA, "delivery", "ALB-2026-1003.csv"), path.join(dir, "delivery.csv"));
    const { code, out } = await cli(["process", "--case-dir", dir, "--line", "2"]);
    expect(code).toBe(EXIT.processed);
    expect(JSON.parse(out).summary.proposal).toBe("block");
    const other = await cli(["process", "--case-dir", dir, "--line", "1"]);
    expect(JSON.parse(other.out).summary.reasons).toContain("HEAT_MISMATCH");
  });
  it("rejects bad input with exit 2", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "certgate-bad-"));
    cpSync(path.join(ROOT, "test", "fixtures", "not-a-pdf.pdf"), path.join(dir, "certificate.pdf"));
    cpSync(path.join(DATA, "cases", "cg-001", "reading.json"), path.join(dir, "reading.json"));
    const r = await cli(["process", "--case-dir", dir, "--line", "1"]);
    expect(r.code).toBe(EXIT.rejected);
    expect(JSON.parse(r.out).code).toBe("not_pdf");
    expect((await cli(["process", "--case", "nope"])).code).toBe(EXIT.rejected);
    expect((await cli(["process", "--case", "../expected/cg-001"])).code).toBe(EXIT.rejected);
  });
  it("confirmation and human decision from the CLI", async () => {
    const r = await cli(["process", "--case", "cg-003", "--confirm", "mechanical.ReH=338", "--confirmed-by", "tech",
      "--decide", "block", "--reason", "ReH below spec", "--decided-by", "manager"]);
    const j = JSON.parse(r.out);
    expect(j.summary.proposal).toBe("block");
    expect(j.receipt.human_decision.action).toBe("block");
    expect(j.receipt.confirmations[0].field).toBe("mechanical.ReH");
  });
  it("writes the output file with --out", async () => {
    const f = path.join(mkdtempSync(path.join(tmpdir(), "certgate-out-")), "r.json");
    await cli(["process", "--case", "cg-001", "--receipt-only", "--out", f]);
    expect(JSON.parse(readFileSync(f, "utf8")).case_id).toBe("cg-001");
  });
});

describe("HTTP service", () => {
  it("answers /health and processes a dataset case", async () => {
    const server = createApp().listen(0);
    await new Promise((r) => server.once("listening", r));
    const port = (server.address() as AddressInfo).port;
    try {
      const h = await (await fetch(`http://127.0.0.1:${port}/health`)).json();
      expect(h).toMatchObject({ status: "ok", mode: "mock" });
      const list = await (await fetch(`http://127.0.0.1:${port}/api/cases`)).json();
      expect(list.cases).toHaveLength(30);
      const res = await fetch(`http://127.0.0.1:${port}/api/cases/cg-016/process`, { method: "POST" });
      const j = await res.json();
      expect(j.summary.proposal).toBe("review");
      expect(j.receipt.reading_source).toBe("mock");
      expect((await fetch(`http://127.0.0.1:${port}/api/cases/zz/process`, { method: "POST" })).status).toBe(400);
    } finally {
      server.close();
    }
  });
});
