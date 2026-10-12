// TEST DOUBLE, NOT A MODEL (register D2-05, B-01). A local stand-in for an OpenAI-compatible vLLM endpoint and
// its GPU sidecar, used only by tests and by reviewers to exercise F1, the live-read limit and the C11 paths.
// It identifies itself as model "certgate-test-stub"; it never reads a certificate. Its chat reply is the mock
// model output of the dataset case named in the request (or cg-001), relabelled as stub output.
//
// Run:  node test/support/stub-endpoint.mjs --port 8001 [--mode ok|timeout|http_429|http_5xx|invalid_json|huge]
// Then: MODEL_BASE_URL=http://127.0.0.1:8001 MODEL_ID=certgate-test-stub GPU_INFO_URL=http://127.0.0.1:8001/gpu-info \
//       LIVE_READS_PER_HOUR=3 node dist/src/server.js
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const STUB_MODEL_ID = "certgate-test-stub";

export function startStub({ port = 0, mode = "ok", caseId = "cg-001" } = {}) {
  const state = { mode, caseId, chatCalls: 0, lastAuthorization: null, lastModel: null };
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://stub");
    const json = (status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
    if (url.pathname === "/v1/models") return json(200, { object: "list", data: [{ id: STUB_MODEL_ID, object: "model" }] });
    if (url.pathname === "/gpu-info") return json(200, { gpu: "TEST STUB (no GPU)", rocm_version: "stub-0", vllm_version: "stub-0" });
    if (url.pathname === "/v1/chat/completions" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => {
        state.chatCalls++;
        state.lastAuthorization = req.headers.authorization ?? null;
        try { state.lastModel = JSON.parse(body).model ?? null; } catch { state.lastModel = null; }
        switch (state.mode) {
          case "timeout": return; // never answers
          case "http_429": return json(429, { error: "rate limited (stub)" });
          case "http_5xx": return json(503, { error: "unavailable (stub)" });
          case "invalid_json": res.writeHead(200, { "content-type": "application/json" }); return res.end("{ not json");
          case "huge": res.writeHead(200, { "content-type": "application/json" }); return res.end("x".repeat(2 * 1024 * 1024));
          default: {
            const output = readFileSync(path.join(ROOT, "data", "cases", state.caseId, "reading.json"), "utf8");
            return json(200, { choices: [{ message: { role: "assistant", content: output } }], usage: { completion_tokens: 420 } });
          }
        }
      });
      return;
    }
    json(404, { error: "not found (stub)" });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => {
    resolve({ server, state, url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }) });
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
  startStub({ port: Number.parseInt(arg("port", "8001"), 10), mode: arg("mode", "ok"), caseId: arg("case", "cg-001") })
    .then((s) => process.stdout.write(`TEST STUB (not a model) listening on ${s.url}, mode ${s.state.mode}\n`));
}
