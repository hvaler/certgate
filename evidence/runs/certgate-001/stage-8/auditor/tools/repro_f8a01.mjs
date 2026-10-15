// Auditor: independent reproduction of adversary finding F8-A01 (legacy /api/live/read without a model_mismatch
// guard), with the auditor's own stub and script, against a built tree in container mode. No endpoint call.
//   node repro_f8a01.mjs <tree> <out.json>
import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [tree, out] = process.argv.slice(2);
const { createApp } = await import(pathToFileURL(path.join(tree, "dist/src/server.js")).href);
const reading = readFileSync(path.join(tree, "data/cases/cg-001/reading.json"), "utf8");
const state = { chat: 0, requested: [] };
const ep = createServer((q, r) => {
  let b = ""; q.on("data", (c) => (b += c)); q.on("end", () => {
    const u = new URL(q.url, "http://x");
    const json = (s, o) => { r.writeHead(s, { "content-type": "application/json" }); r.end(JSON.stringify(o)); };
    if (u.pathname.endsWith("/models")) return json(200, { object: "list", data: [{ id: "Qwen3.8-27B", object: "model" }] });
    if (u.pathname.endsWith("/usage")) return json(200, { daily_cost_used_usd: 0 });
    if (u.pathname.endsWith("/chat/completions")) {
      state.chat++; state.requested.push(JSON.parse(b).model);
      // The endpoint answers with a DIFFERENT model than the one requested.
      return json(200, { id: "aud-1", created: 1760371200, model: "Gemma-4-31B-IT", choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: reading } }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20, cost: 0.0001 } });
    }
    json(404, {});
  });
}).listen(0, "127.0.0.1");
await new Promise((r) => ep.once("listening", r));
const env = { MODEL_BASE_URL: `http://127.0.0.1:${ep.address().port}/v1`, MODEL_API_KEY: "test-key-not-real", MODEL_ID: "Qwen3.8-27B", LIVE_READS_PER_HOUR: "3" };
const s = createApp({ env, backoffBaseMs: 1 }).listen(0, "127.0.0.1");
await new Promise((r) => s.once("listening", r));
const base = `http://127.0.0.1:${s.address().port}`;
const body = {
  certificate_base64: readFileSync(path.join(tree, "data/cases/cg-001/certificate.pdf")).toString("base64"),
  delivery_csv: readFileSync(path.join(tree, "data/delivery/ALB-2026-0917.csv"), "utf8"), delivery_line: "1", synthetic_confirmed: true,
};
const before = await (await fetch(`${base}/api/live/status`)).json();
const res = await fetch(`${base}/api/live/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const j = await res.json().catch(() => null);
const after = await (await fetch(`${base}/api/live/status`)).json();
const result = {
  run_utc: new Date().toISOString(), tree,
  status: res.status, reason_class: j?.reason_class ?? null, error: j?.error ?? null,
  reading_source: j?.view?.reading_source ?? j?.view?.receipt?.reading_source ?? null,
  receipt_requested: j?.view?.receipt?.reader?.requested_model_id ?? null, receipt_reported: j?.view?.receipt?.reader?.model_id ?? null,
  chat_calls: state.chat, models_sent: state.requested,
  used_before: before.used_this_hour ?? before.remaining_this_hour ?? null, used_after: after.used_this_hour ?? after.remaining_this_hour ?? null,
};
writeFileSync(out, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result));
s.closeAllConnections(); s.close(); ep.closeAllConnections(); ep.close();
process.exit(0);
