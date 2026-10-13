// F3-01 (Stage 3 repair 1; S3-11, I7): a receipt of a LIVE reading never says the endpoint was "off". A live reading
// made without an F1 probe (the evaluation runner) carries the honest state not_captured_in_evaluation_run, with the
// reply's own values and every other value labelled not captured. Offline: replies are replayed from 127.0.0.1.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadDatasetCase, loadShared } from "../src/cases.js";
import { evaluateCase, notApplicableF1, NOT_CAPTURED, readCase, replyOnlyF1 } from "../src/pipeline.js";
import { LiveReader } from "../src/web/live-reader.js";
import { ROOT } from "./helpers.js";
import { ENDPOINT_NAME, ENDPOINT_SOURCE, NOT_EXPOSED } from "../src/web/f1.js";

// Same transformation as tools/evaluate/regenerate-receipts.mjs, from the source modules (no build needed).
const REGENERATED = "results.f1-regenerated.json";
const regenerate = (results: any[], run: any) => results.map((r) => r.receipt?.reading_source !== "live" ? r : ({
  ...r, receipt: { ...r.receipt, f1: replyOnlyF1(r.endpoint_response, { endpoint_host: run.host, rate_limit: null, endpoint_name: ENDPOINT_NAME, endpoint_source: ENDPOINT_SOURCE, not_exposed: NOT_EXPOSED }) },
}));

const RUN = path.join(ROOT, "evaluation", "runs", "real-candidate-dd557fd");
const open: { close: () => Promise<void> }[] = [];
afterEach(async () => { while (open.length) await open.pop()!.close(); });

async function replayFixture(name: string) {
  const f = JSON.parse(readFileSync(path.join(ROOT, "test", "fixtures", "endpoint", `${name}.json`), "utf8"));
  const server = createServer((req, res) => {
    req.resume();
    req.on("end", () => { res.writeHead(f.status, { "content-type": "application/json", ...f.headers }); res.end(JSON.stringify(f.body)); });
  }).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  open.push({ close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
}

describe("live receipts never say the endpoint was off (F3-01)", () => {
  it("a live reading through the pipeline with no F1 probe: state not_captured_in_evaluation_run, reply values filled", async () => {
    const url = await replayFixture("read-cg-001");
    const input = loadDatasetCase("cg-001", loadShared("real"));
    const r = evaluateCase(await readCase({ ...input, reader: new LiveReader({ baseUrl: url, modelId: "Qwen3.8-27B", apiKey: "x", backoffBaseMs: 1 }) }));
    expect(r.receipt.reading_source).toBe("live");
    expect(r.receipt.f1.state).not.toBe("off");
    expect(r.receipt.f1.state).toBe(NOT_CAPTURED);
    expect(r.receipt.f1.model_reported).toBe("self-dploy/Qwen3.8-27B");
    expect(r.receipt.f1.cost_reported).toBe(r.receipt.endpoint_response!.cost_reported);
    expect(r.receipt.f1.completion_tokens).toBe(r.receipt.endpoint_response!.completion_tokens);
    expect(r.receipt.f1.latency_ms).toBe(NOT_CAPTURED);
    expect(r.receipt.f1.not_captured).toContain("model_ids");
  });
  it("a failed live reading that reached the endpoint (no reply, e.g. timeout) is not_captured, never off; only endpoint_off is off", () => {
    for (const cls of ["endpoint_off", "endpoint_not_configured"]) {
      const off = notApplicableF1("live", null, cls);
      expect(off.state).toBe("off");
      expect(off.detail).toMatch(/nothing was read/);
    }
    for (const cls of ["timeout", "http_429", "http_5xx", "invalid_json", "truncated_output", null]) expect(notApplicableF1("live", null, cls).state, String(cls)).toBe(NOT_CAPTURED);
    const f = notApplicableF1("live", null, "timeout");
    expect(f.state).toBe(NOT_CAPTURED);
    expect(f.model_reported).toBe(NOT_CAPTURED);
    expect(f.cost_reported).toBe(NOT_CAPTURED);
    expect(JSON.stringify(f)).not.toMatch(/"state":"off"/);
  });
  it("rate-limit headers recorded with the reading are carried; missing ones are labelled, not defaulted", () => {
    const f = replyOnlyF1({ model: "m", completion_tokens: "100", elapsed_ms: "2000", total_tokens: "300", cost_reported: "0.0002" },
      { endpoint_host: "h", rate_limit: { "x-ratelimit-limit-user-rpm": "20", "x-ratelimit-remaining-user-daily-usd": "0.9" } });
    expect(f.rate_limit_rpm).toBe("20");
    expect(f.daily_spend_remaining).toBe("0.9");
    expect(f.rate_limit_rpm_remaining).toBe(NOT_CAPTURED);
    expect(f.tokens_per_second).toBe("50");
    expect(f.usage_source).toBe("X-RateLimit headers of this reading");
  });
  it("the evaluation runner stores the reading-time snapshot in every receipt; the regeneration tool uses only recorded data (source check)", () => {
    const tool = readFileSync(path.join(ROOT, "tools", "evaluate", "regenerate-receipts.mjs"), "utf8");
    expect(tool).toContain("replyOnlyF1(r.endpoint_response, { endpoint_host: run.host, rate_limit: null, endpoint_name: ENDPOINT_NAME, endpoint_source: ENDPOINT_SOURCE, not_exposed: NOT_EXPOSED })");
    const src = readFileSync(path.join(ROOT, "tools", "evaluate", "run-eval.mjs"), "utf8");
    expect(src).toMatch(/result\.receipt\.f1 = replyOnlyF1\(reader\.lastResponse, \{ endpoint_host: host, rate_limit: reader\.lastCall\?\.rate_limit/);
  });
  it("the committed regenerated evaluation receipts: all 27 live, none off, equal to an offline regeneration from the preserved results.json", () => {
    const original = JSON.parse(readFileSync(path.join(RUN, "results.json"), "utf8"));
    const run = JSON.parse(readFileSync(path.join(RUN, "run.json"), "utf8"));
    const committed = JSON.parse(readFileSync(path.join(RUN, REGENERATED), "utf8"));
    expect(committed).toHaveLength(27);
    expect(committed).toEqual(regenerate(original, run));
    for (const r of committed) {
      expect(r.receipt.reading_source).toBe("live");
      expect(r.receipt.f1.state).toBe(NOT_CAPTURED);
      expect(r.receipt.f1.model_reported).toBe(r.endpoint_response.model);
      expect(r.receipt.f1.cost_reported).toBe(r.endpoint_response.cost_reported);
      // Rate-limit headers were not recorded by the candidate-1 runner: labelled, never invented.
      expect(r.receipt.f1.rate_limit_rpm).toBe(NOT_CAPTURED);
    }
    // Only the F1 snapshot differs from the preserved original.
    const strip = (x: any) => ({ ...x, receipt: { ...x.receipt, f1: null } });
    expect(committed.map(strip)).toEqual(original.map(strip));
  });
});
