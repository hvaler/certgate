// Auditor (stage 5, R5.1 E-14 / T5-03): capture the exact chat-completions request body that a candidate's real
// reader (dist/src/web/live-reader.js, LiveReader) sends for one dataset case, using a local capture stub. No
// endpoint call is made: MODEL_BASE_URL points at 127.0.0.1 and the key is a dummy.
//
//   node capture_request_body.mjs <repo-with-dist> <case-id> <model-id> <out.json>
//
// The stub answers with a minimal valid reply. Only the request body matters here. It is stored canonically
// (JSON.stringify of the parsed body) and also raw, so it can be compared byte for byte between models or builds.
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [repo, caseId, modelId, out] = process.argv.slice(2);
const dist = (p) => import(pathToFileURL(path.join(repo, "dist", "src", p)).href);
let captured = null;
const server = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => { body += c; });
  req.on("end", () => {
    if (req.url.endsWith("/chat/completions") && captured === null) captured = body;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id: "stub", created: 0, model: modelId, choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "{}" } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }));
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const { LiveReader } = await dist("web/live-reader.js");
const { loadDatasetCase, loadShared } = await dist("cases.js");
const { readCase } = await dist("pipeline.js");
const reader = new LiveReader({ baseUrl: `http://127.0.0.1:${port}/v1`, modelId, apiKey: "dummy-key" });
const shared = loadShared();
const input = loadDatasetCase(caseId, shared);
try { await readCase({ ...input, reader, mode: "real" }); } catch { /* the reply content is not a valid reading; only the request matters */ }
server.close();
if (captured === null) { console.error("no request captured"); process.exit(1); }
const parsed = JSON.parse(captured);
writeFileSync(out, JSON.stringify({ case_id: caseId, model_id: modelId, raw: captured, keys: Object.keys(parsed), canonical: JSON.stringify(parsed) }, null, 1));
console.log(`${caseId} ${modelId}: ${captured.length} bytes; keys ${Object.keys(parsed).join(",")}`);
