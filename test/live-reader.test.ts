// Live reader against RECORDED endpoint replies (S3-02, S3-03, S3-06, R3.1 C-01, C-05, C-12, C-14). The replies in
// test/fixtures/endpoint/ were recorded from AMD Token Factory during development (evaluation/dev-calls.jsonl) and
// are replayed by a local server on 127.0.0.1: this file makes no call to the real endpoint (C-22).
import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadDatasetCase, loadShared } from "../src/cases.js";
import { evaluateCase, readCase } from "../src/pipeline.js";
import { ReaderError } from "../src/reader.js";
import { LiveReader, promptSha256, READING_INSTRUCTION } from "../src/web/live-reader.js";
import { ADAPTER_MAX_ATTEMPTS, ADAPTER_MAX_IN_FLIGHT } from "../src/web/limits.js";
import { DATA, ROOT } from "./helpers.js";

const FIX = path.join(ROOT, "test", "fixtures", "endpoint");
const fixture = (name: string) => JSON.parse(readFileSync(path.join(FIX, `${name}.json`), "utf8"));
const cert = (id: string) => new Uint8Array(readFileSync(path.join(DATA, "cases", id, "certificate.pdf")));

type Reply = { status: number; headers?: Record<string, string>; body: unknown; delayMs?: number };
const open: { close: () => Promise<void> }[] = [];
afterEach(async () => { while (open.length) await open.pop()!.close(); });

/** Local replay server: answers each POST with the next reply (the last one repeats); records request bodies. */
async function replay(replies: Reply[]) {
  const seen: { body: string; at: number }[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      const r = replies[Math.min(seen.length, replies.length - 1)]!;
      seen.push({ body, at: Date.now() });
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      setTimeout(() => {
        inFlight--;
        res.writeHead(r.status, { "content-type": "application/json", ...(r.headers ?? {}) });
        res.end(typeof r.body === "string" ? r.body : JSON.stringify(r.body));
      }, r.delayMs ?? 0);
    });
  }).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  open.push({ close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) });
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`, seen, maxInFlight: () => maxInFlight };
}
const fromFixture = (name: string): Reply => { const f = fixture(name); return { status: f.status, headers: f.headers, body: f.body }; };
const reader = (url: string, extra: Partial<ConstructorParameters<typeof LiveReader>[0]> = {}) =>
  new LiveReader({ baseUrl: url, modelId: "Qwen3.8-27B", apiKey: "test-key-not-real", backoffBaseMs: 1, ...extra });
const okReply = (content: unknown, extra: Record<string, unknown> = {}): Reply => ({
  status: 200, body: { id: "r-1", created: 1791911507, model: "self-dploy/Qwen3.8-27B", choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content, ...extra } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, cost: 0.0001 } },
});

describe("request shape (C-01, C-12, S3-02)", () => {
  it("sends only rendered page images: no text-layer string, no PDF bytes; temperature 0; the frozen instruction", async () => {
    const s = await replay([fromFixture("read-cg-001")]);
    await reader(s.url).read({ case_id: "cg-004", certificate: cert("cg-004") });
    const body = s.seen[0]!.body;
    const req = JSON.parse(body);
    expect(req.temperature).toBe(0);
    expect(req.model).toBe("Qwen3.8-27B");
    expect(req.messages[0]).toEqual({ role: "system", content: READING_INSTRUCTION });
    const parts = req.messages[1].content as { type: string; text?: string; image_url?: { url: string } }[];
    expect(parts.filter((p) => p.type === "image_url").length).toBeGreaterThan(0);
    for (const p of parts) {
      if (p.type === "image_url") expect(p.image_url!.url).toMatch(/^data:image\/jpeg;base64,/);
      else expect(p.text).toBe(`Certificate cg-004: ${parts.length - 1} page image(s).`);
    }
    // Strings of cg-004's text layer (certificate number, heat, issuer, a chemistry value) never travel.
    for (const t of ["SV-2026-118601", "24-73104", "Valdemora", "2026-09-28"]) expect(body, t).not.toContain(t);
    expect(body).not.toMatch(/JVBERi0|application\/pdf/); // base64 of "%PDF-", or a PDF data URL
    expect(promptSha256()).toBe("32fad2f980bcf755841d80bb2385d9601465f83b5b42c1b6c048f3bfe1cfb567");
  });
});

describe("recorded replies (S3-06, C-14)", () => {
  it("a recorded real reading parses and carries response id, created, model and usage as returned", async () => {
    const f = fixture("read-cg-001");
    const s = await replay([fromFixture("read-cg-001")]);
    const r = reader(s.url);
    const text = await r.read({ case_id: "cg-001", certificate: cert("cg-001") });
    expect(text.trim().startsWith("{")).toBe(true);
    expect(r.model_id).toBe("self-dploy/Qwen3.8-27B");
    expect(r.lastResponse).toMatchObject({ response_id: f.body.id, created: String(f.body.created), model: "self-dploy/Qwen3.8-27B", finish_reason: "stop", input: "page_images" });
    expect(r.lastResponse!.cost_reported).not.toBeNull();
    expect(r.lastResponse!.reasoning_tokens).not.toBeNull();
    expect(r.lastCall!.rate_limit["x-ratelimit-limit-user-rpm"]).toBe("20");
  });
  it("the recorded cg-001 reply through the pipeline gives the recorded proposal; the receipt copies the response identity", async () => {
    const s = await replay([fromFixture("read-cg-001")]);
    const input = loadDatasetCase("cg-001", loadShared("real"));
    const r = evaluateCase(await readCase({ ...input, reader: reader(s.url) }));
    expect(r.readings.case.status).toBe("processed");
    expect(["release", "review"]).toContain(r.decision.proposal);
    expect(r.receipt.endpoint_response).toMatchObject({ response_id: fixture("read-cg-001").body.id, model: "self-dploy/Qwen3.8-27B" });
    expect(r.receipt.f1.cost_label).toBe("cost reported by the endpoint; Token Factory credits are free and have no monetary value");
  });
  it("error shape {\"detail\":{\"error\":…}} (unknown model, 404): C11, message kept, not retried", async () => {
    const s = await replay([fromFixture("error-unknown-model")]);
    const r = reader(s.url);
    const e = await r.read({ case_id: "cg-004", certificate: cert("cg-004") }).catch((x) => x);
    expect(e).toBeInstanceOf(ReaderError);
    expect(e.message).toMatch(/404: Model certgate-no-such-model is not available/);
    expect(r.retry.retryable.has(e.errorClass)).toBe(false);
  });
  it("error shape {\"error\":…} (invalid key, 401): C11, message kept, not retried, key never in the message", async () => {
    const s = await replay([fromFixture("error-invalid-key")]);
    const input = loadDatasetCase("cg-004", loadShared("real"));
    const r = evaluateCase(await readCase({ ...input, reader: reader(s.url) }));
    expect(r.readings.case.status).toBe("error");
    expect(r.decision.proposal).toBe("review");
    expect(s.seen.length).toBe(1);
    expect(r.receipt.errors.at(-1)!.detail).toMatch(/401: Unauthorized: Invalid LLMGateway API token/);
    expect(JSON.stringify(r.receipt)).not.toContain("test-key-not-real");
  });
});

describe("C11 under the real reader (S3-03, C-05)", () => {
  it("finish_reason length is a C11 failure (truncated_output), even with content", async () => {
    const rep = okReply("{\"schema\":\"certgate.model-output/1\"");
    (rep.body as any).choices[0].finish_reason = "length";
    const s = await replay([rep]);
    const e = await reader(s.url).read({ case_id: "cg-004", certificate: cert("cg-004") }).catch((x) => x);
    expect(e.errorClass).toBe("truncated_output");
    expect(s.seen.length).toBe(1);
  });
  it("empty content with the JSON only in the reasoning is a C11 failure; the reasoning is never used (C-05)", async () => {
    const reading = readFileSync(path.join(DATA, "cases", "cg-004", "reading.json"), "utf8");
    for (const field of ["reasoning", "reasoning_content"]) {
      const s = await replay([okReply("", { [field]: reading })]);
      const input = loadDatasetCase("cg-004", loadShared("real"));
      const r = evaluateCase(await readCase({ ...input, reader: reader(s.url) }));
      expect(r.readings.case.status, field).toBe("error");
      expect(r.decision.proposal).toBe("review");
      expect(r.receipt.values).toEqual([]);
      expect(JSON.stringify(r.receipt)).not.toContain("certgate.model-output/1");
    }
  });
});

describe("calling discipline (S3-02)", () => {
  it("429 is retried, honouring Retry-After, at most 3 attempts in all", async () => {
    const s = await replay([{ status: 429, headers: { "retry-after": "1" }, body: { error: { message: "rate limited" } } }]);
    const input = loadDatasetCase("cg-004", loadShared("real"));
    const r = evaluateCase(await readCase({ ...input, reader: reader(s.url) }));
    expect(s.seen.length).toBe(ADAPTER_MAX_ATTEMPTS);
    expect(r.readings.case.status).toBe("error");
    expect(r.receipt.errors.at(-1)!.class).toBe("http_429");
    // Retry-After: 1 s between attempts (the base backoff here is 1 ms).
    expect(s.seen[1]!.at - s.seen[0]!.at).toBeGreaterThanOrEqual(950);
  }, 20_000);
  it("5xx then success: retried and read on the second attempt", async () => {
    const reading = readFileSync(path.join(DATA, "cases", "cg-004", "reading.json"), "utf8");
    const s = await replay([{ status: 503, body: { error: { message: "busy" } } }, okReply(reading)]);
    const input = loadDatasetCase("cg-004", loadShared("real"));
    const r = evaluateCase(await readCase({ ...input, reader: reader(s.url) }));
    expect(s.seen.length).toBe(2);
    expect(r.readings.case.status).toBe("processed");
  });
  it("backoff is exponential and capped; Retry-After wins when larger", () => {
    const r = new LiveReader({ baseUrl: "http://127.0.0.1:9/v1", modelId: "m", apiKey: null });
    const e = new ReaderError("http_5xx", "x");
    expect([1, 2, 3].map((n) => r.retry.delayMs(n, e))).toEqual([2000, 4000, 8000]);
    expect(r.retry.delayMs(1, new ReaderError("http_429", "x", 30_000))).toBe(30_000);
    expect(r.retry.delayMs(1, new ReaderError("http_429", "x", 10_000_000))).toBe(120_000);
    expect([...r.retry.retryable].sort()).toEqual(["http_429", "http_5xx"]);
    expect(r.retry.maxAttempts).toBe(3);
  });
  it(`at most ${ADAPTER_MAX_IN_FLIGHT} requests in flight, across readers`, async () => {
    const reading = readFileSync(path.join(DATA, "cases", "cg-004", "reading.json"), "utf8");
    const s = await replay([{ ...okReply(reading), delayMs: 150 }]);
    await Promise.all(Array.from({ length: 6 }, () => reader(s.url).read({ case_id: "cg-004", certificate: cert("cg-004") })));
    expect(s.seen.length).toBe(6);
    expect(s.maxInFlight()).toBe(ADAPTER_MAX_IN_FLIGHT);
  }, 30_000);
});

describe("default test command makes no endpoint call (C-22)", () => {
  it("no test reads the real endpoint variables, and every test URL is local", () => {
    const dir = path.join(ROOT, "test");
    const files = ["web.test.ts", "live-reader.test.ts", "reader.test.ts", "static.test.ts"].map((f) => readFileSync(path.join(dir, f), "utf8"));
    for (const t of files) {
      expect(t).not.toMatch(/process\.env\.(MODEL_BASE_URL|MODEL_API_KEY|MODEL_ID)/);
      // The cited event page appears only as expected text in a static-file test; it is never requested.
      for (const u of (t.match(/https?:\/\/[^\s"'`)]+/g) ?? []).filter((x) => x !== "https://notebooks.amd.com/tokenfactory")) {
        expect(u).toMatch(/^http:\/\/(127\.0\.0\.1|localhost)/);
      }
    }
  });
});
