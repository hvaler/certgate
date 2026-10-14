// TEST DOUBLE, NOT A MODEL (register D2-05, B-01). A local stand-in for an OpenAI-compatible endpoint shaped like
// AMD Token Factory (GET /models, GET /usage, POST /chat/completions with usage.cost and X-RateLimit headers), used
// only by tests and by reviewers to exercise F1, the live-read limit and the C11 paths. It calls nothing upstream.
// It identifies itself as model "certgate-test-stub"; it never reads a certificate. Its chat reply is the mock
// model output of the dataset case named in the request (or cg-001), relabelled as stub output.
//
// Run:  node test/support/stub-endpoint.mjs --port 8001 [--mode ok|timeout|http_429|http_5xx|invalid_json|huge]
//         [--case cg-001 | --reading <file with a mock model output>]
// Then: MODEL_BASE_URL=http://127.0.0.1:8001 MODEL_ID=certgate-test-stub GPU_INFO_URL=http://127.0.0.1:8001/gpu-info \
//       LIVE_READS_PER_HOUR=3 node dist/src/server.js
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const STUB_MODEL_ID = "certgate-test-stub";

export function startStub({ port = 0, mode = "ok", caseId = "cg-001", readingFile = null, reportedModel = null, delayMs = 0, errorText = null, failFirst = 0, failMode = "http_429" } = {}) {
  // reportedModel: the "model" field of the chat reply (null => STUB_MODEL_ID; "" => omitted is not supported here).
  // delayMs: the chat reply waits this long (concurrency tests); inFlight/maxInFlight count open chat requests.
  // errorText: the body text of the http_429/http_5xx replies (leak tests put sentinel values there).
  // failFirst: the first N chat replies use failMode, then the configured mode (deterministic retry tests).
  const state = { mode, caseId, readingFile, reportedModel, omitModel: false, chatCalls: 0, lastAuthorization: null, lastModel: null, delayMs, errorText, inFlight: 0, maxInFlight: 0, modelsCalls: 0, failFirst, failMode };
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://stub");
    const json = (status, body, headers = {}) => { res.writeHead(status, { "content-type": "application/json", ...headers }); res.end(JSON.stringify(body)); };
    if (url.pathname === "/v1/models") { state.modelsCalls++; return json(200, { object: "list", data: [{ id: STUB_MODEL_ID, object: "model" }] }); }
    if (url.pathname === "/v1/usage") {
      state.usageCalls = (state.usageCalls ?? 0) + 1;
      return json(200, { rpm_limit: 20, daily_cost_limit_usd: 1, daily_cost_used_usd: 0.001 * state.chatCalls, daily_cost_remaining_usd: 1 - 0.001 * state.chatCalls });
    }
    if (url.pathname === "/v1/chat/completions" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", async () => {
        state.chatCalls++;
        state.inFlight++;
        state.maxInFlight = Math.max(state.maxInFlight, state.inFlight);
        res.on("close", () => { state.inFlight--; });
        if (state.delayMs > 0) await new Promise((r) => setTimeout(r, state.delayMs));
        state.lastAuthorization = req.headers.authorization ?? null;
        try { state.lastModel = JSON.parse(body).model ?? null; } catch { state.lastModel = null; }
        const current = state.failFirst > 0 ? (state.failFirst--, state.failMode) : state.mode;
        switch (current) {
          case "timeout": return; // never answers
          case "http_429": return json(429, { error: state.errorText ?? "rate limited (stub)" });
          case "http_5xx": return json(503, { error: state.errorText ?? "unavailable (stub)" });
          case "http_4xx": return json(404, { detail: { error: state.errorText ?? "not found (stub)" } });
          case "invalid_json": res.writeHead(200, { "content-type": "application/json" }); return res.end("{ not json");
          case "huge": res.writeHead(200, { "content-type": "application/json" }); return res.end("x".repeat(2 * 1024 * 1024));
          default: {
            const output = readFileSync(state.readingFile ?? path.join(ROOT, "data", "cases", state.caseId, "reading.json"), "utf8");
            return json(200, {
              id: `stub-${state.chatCalls}`, created: 1760371200, ...(state.omitModel ? {} : { model: state.reportedModel ?? STUB_MODEL_ID }),
              choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: output } }],
              usage: { prompt_tokens: 1800, completion_tokens: 420, total_tokens: 2220, completion_tokens_details: { reasoning_tokens: 300 }, cost: 0.001 },
            }, { "x-ratelimit-limit-user-rpm": "20", "x-ratelimit-remaining-user-rpm": "19", "x-ratelimit-limit-user-daily-usd": "1", "x-ratelimit-remaining-user-daily-usd": String(1 - 0.001 * state.chatCalls) });
          }
        }
      });
      return;
    }
    json(404, { error: "not found (stub)" });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => {
    resolve({ server, state, url: `http://127.0.0.1:${server.address().port}/v1`, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }) });
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
  startStub({ port: Number.parseInt(arg("port", "8001"), 10), mode: arg("mode", "ok"), caseId: arg("case", "cg-001"), readingFile: arg("reading", null) })
    .then((s) => process.stdout.write(`TEST STUB (not a model) listening on ${s.url}, mode ${s.state.mode}\n`));
}
