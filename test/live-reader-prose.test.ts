// ADV-S3-F01 (S3-01, S3-28 "JSON repaired by guessing"): a reply whose content is valid JSON wrapped in prose, or
// followed by trailing text, is a C11 failure. Only a whole-content JSON document, or one inside a single code fence
// that spans the whole content, is accepted. Replies replayed from 127.0.0.1; no endpoint call.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadDatasetCase, loadShared } from "../src/cases.js";
import { evaluateCase, readCase } from "../src/pipeline.js";
import { LiveReader, stripCodeFences } from "../src/web/live-reader.js";
import { DATA } from "./helpers.js";

const open: { close: () => Promise<void> }[] = [];
afterEach(async () => { while (open.length) await open.pop()!.close(); });

async function replyWith(content: string) {
  let calls = 0;
  const server = createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      calls++;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: "r", created: 1, model: "self-dploy/Qwen3.8-27B", choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2, cost: 0.0001 } }));
    });
  }).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  open.push({ close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) });
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`, calls: () => calls };
}

// cg-004 is a conforming digital certificate: its complete, valid reading would propose release if it were accepted.
const reading = readFileSync(path.join(DATA, "cases", "cg-004", "reading.json"), "utf8").trim();

describe("JSON is never repaired by guessing (ADV-S3-F01, S3-01)", () => {
  const cases: [string, string][] = [
    ["prose before the JSON", `Here is the JSON you asked for:\n${reading}`],
    ["prose before and after", `Here is the JSON you asked for:\n${reading}\nLet me know if you need anything else.`],
    ["trailing text after the JSON", `${reading}\nDone.`],
    ["a fence that does not span the whole content", `Sure:\n\`\`\`json\n${reading}\n\`\`\``],
  ];
  for (const [name, content] of cases) {
    it(`${name}: C11 invalid_json, status error, review, 1 call, no value read`, async () => {
      const s = await replyWith(content);
      const input = loadDatasetCase("cg-004", loadShared("real"));
      const r = evaluateCase(await readCase({ ...input, reader: new LiveReader({ baseUrl: s.url, modelId: "Qwen3.8-27B", apiKey: "x", backoffBaseMs: 1 }) }));
      expect(r.readings.case.status).toBe("error");
      expect(r.decision.proposal).toBe("review");
      expect(r.receipt.errors.at(-1)!.class).toBe("invalid_json");
      expect(r.receipt.values).toEqual([]);
      expect(s.calls()).toBe(1);
    });
  }
  it("the same reading as the whole content, or in one fence spanning the whole content, is read (control)", async () => {
    for (const content of [reading, `\`\`\`json\n${reading}\n\`\`\``]) {
      const s = await replyWith(content);
      const input = loadDatasetCase("cg-004", loadShared("real"));
      const r = evaluateCase(await readCase({ ...input, reader: new LiveReader({ baseUrl: s.url, modelId: "Qwen3.8-27B", apiKey: "x", backoffBaseMs: 1 }) }));
      expect(r.readings.case.status).toBe("processed");
    }
  });
  it("stripCodeFences never extracts JSON out of surrounding text", () => {
    expect(stripCodeFences(`Here:\n${reading}`)).toBe(`Here:\n${reading}`);
    expect(stripCodeFences(`${reading}\nDone.`)).toBe(`${reading}\nDone.`);
    expect(stripCodeFences(`\`\`\`json\n${reading}\n\`\`\``)).toBe(reading);
  });
});
