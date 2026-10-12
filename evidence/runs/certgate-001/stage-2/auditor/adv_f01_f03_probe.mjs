// Auditor reproduction of ADV-S2-F01 (configured MODEL_ID shown as endpoint-reported) and ADV-S2-F03 (unreferenced
// contaminated explanation displayed), run INSIDE the candidate image with --network none (mounted at /probe).
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const procs = [];
const start = (args, env) => { const p = spawn("node", args, { cwd: "/app", env: { ...process.env, ...env }, stdio: "ignore" }); procs.push(p); return p; };
async function up(u) { for (let i = 0; i < 60; i++) { try { await fetch(u); return; } catch {} await sleep(100); } throw new Error("down " + u); }

start(["test/support/stub-endpoint.mjs", "--port", "8201", "--mode", "ok", "--reading", "/app/data/cases/cg-021/reading.json"], {});
await up("http://127.0.0.1:8201/v1/models");
const models = await (await fetch("http://127.0.0.1:8201/v1/models")).json();
start(["dist/src/server.js"], { PORT: "5201", LIVE_READS_PER_HOUR: "3", MODEL_BASE_URL: "http://127.0.0.1:8201",
  MODEL_ID: "configured-name-not-from-endpoint", GPU_INFO_URL: "http://127.0.0.1:8201/gpu-info" });
await up("http://127.0.0.1:5201/health");
const f1 = await (await fetch("http://127.0.0.1:5201/api/f1")).json();
const body = JSON.stringify({ certificate_base64: readFileSync("/app/data/cases/cg-021/certificate.pdf").toString("base64"),
  delivery_csv: readFileSync("/app/data/delivery/ALB-2026-1003.csv", "utf8"), delivery_line: "18" });
const r = await fetch("http://127.0.0.1:5201/api/live/read", { method: "POST", headers: { "content-type": "application/json" }, body });
const j = await r.json();
const rc = j.view?.receipt ?? {};
const out = {
  endpoint_models: models.data.map((m) => m.id), f1_model_ids: f1.model_ids,
  receipt_reader_model_id: rc.reader?.model_id, receipt_model_version: rc.reader?.model_version, summary_note: j.summary?.note,
  proposal: j.summary?.proposal, reading_source: rc.reading_source,
  view_explanation: j.view?.explanation,
};
console.log(JSON.stringify(out, null, 2));
const f01 = out.receipt_reader_model_id !== out.endpoint_models[0] && /as reported by the endpoint/.test(out.summary_note ?? "");
const ex = JSON.stringify(out.view_explanation ?? {});
const f03 = /approved without human review|Proposed: RELEASE/i.test(ex) && out.proposal === "block";
console.log(`ADV-S2-F01 reproduced: ${f01}`);
console.log(`ADV-S2-F03 reproduced: ${f03}`);
for (const p of procs) p.kill();
