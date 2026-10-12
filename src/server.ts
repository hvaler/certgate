// Minimal local HTTP service (Stage 1). No outbound calls in mock mode. Stage 2 adds the web UI.
//   GET  /health                       liveness and mode
//   GET  /api/cases                    dataset case ids
//   POST /api/cases/<id>/process       process a dataset case; returns summary and receipt
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { pathToFileURL } from "node:url";
import { CaseInputError, listDatasetCases, loadDatasetCase, loadShared } from "./cases.js";
import { summary } from "./cli.js";
import { getMode, getPort } from "./config.js";
import { InputRejected } from "./input-file.js";
import { processCase } from "./pipeline.js";
import { exportReceipt } from "./receipt.js";

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(typeof body === "string" ? body : JSON.stringify(body, null, 2) + "\n");
}

export function createApp(): Server {
  const mode = getMode();
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      if (req.method === "GET" && url.pathname === "/health") {
        return send(res, 200, { status: "ok", mode, reader: mode === "mock" ? "MOCK (no model)" : "live (not configured)", notice: "All data is fictitious." });
      }
      if (req.method === "GET" && url.pathname === "/api/cases") return send(res, 200, { cases: listDatasetCases() });
      const m = /^\/api\/cases\/([A-Za-z0-9_-]+)\/process$/.exec(url.pathname);
      if (req.method === "POST" && m) {
        // Each request builds its own reader and evaluation: no state is shared between cases (C12).
        const result = await processCase(loadDatasetCase(m[1]!, loadShared(mode)));
        const receipt = JSON.parse(exportReceipt(result.receipt));
        return send(res, 200, { summary: summary(result), receipt });
      }
      return send(res, 404, { error: "not found" });
    } catch (e) {
      if (e instanceof CaseInputError || e instanceof InputRejected) return send(res, 400, { status: "rejected", error: e.message });
      return send(res, 500, { status: "internal_error", error: (e as Error).message });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = getPort();
  createApp().listen(port, () => process.stdout.write(`CertGate listening on port ${port} (mode ${getMode()})\n`));
}
