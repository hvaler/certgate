// Local HTTP service: serves the web UI (public/) and the stateless API on PORT. No outbound call in mock
// mode; with no endpoint configured, F1 says "endpoint off" (S2-12, S2-24).
import { createServer, type Server } from "node:http";
import { pathToFileURL } from "node:url";
import { getMode, getPort } from "./config.js";
import { createHandler, type AppDeps } from "./web/app.js";

export function createApp(deps: AppDeps = {}): Server {
  const handle = createHandler(deps);
  return createServer((req, res) => void handle(req, res));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = getPort();
  createApp().listen(port, () => process.stdout.write(`CertGate listening on http://localhost:${port} (mode ${getMode()})\n`));
}