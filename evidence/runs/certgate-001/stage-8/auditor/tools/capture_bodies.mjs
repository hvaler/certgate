// Auditor (T8-02, T8-21): capture the exact POST /chat/completions body that the repository's own LiveReader builds,
// against a local capture server (no endpoint call). Prints, per (model id, case), the SHA-256 of the full body and
// the image-masked hash used by test/stage5-gemma.test.ts.
//   node capture_bodies.mjs <repo-with-dist> <out.json> <modelId>[,<modelId>...] <case>[,<case>...]
import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
const [repo, out, models, cases] = process.argv.slice(2);
const { LiveReader } = await import(pathToFileURL(path.join(repo, "dist/src/web/live-reader.js")).href);
const sha = (s) => createHash("sha256").update(s).digest("hex");
const masked = (body) => {
  const b = structuredClone(body);
  for (const p of b.messages[1].content) if (p.type === "image_url") p.image_url = { url: "<page image>" };
  return sha(JSON.stringify(b));
};
const seen = [];
const server = createServer((req, res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { seen.push(b); res.writeHead(500, { "content-type": "application/json" }); res.end("{}"); }); }).listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const url = `http://127.0.0.1:${server.address().port}/v1`;
const rows = [];
for (const m of models.split(",")) for (const c of cases.split(",")) {
  seen.length = 0;
  const reader = new LiveReader({ baseUrl: url, modelId: m, apiKey: "test-key-not-real", backoffBaseMs: 1, maxAttempts: 1 });
  const cert = readFileSync(path.join(repo, "data", "cases", c, "certificate.pdf"));
  await reader.read({ case_id: c, certificate: new Uint8Array(cert) }).catch(() => undefined);
  const raw = seen[0]; const body = JSON.parse(raw);
  rows.push({ model: m, case_id: c, certificate_sha256: sha(cert), attempts_seen: seen.length, body_sha256: sha(raw), body_masked_sha256: masked(body), body_model: body.model, keys: Object.keys(body).sort().join(",") });
}
server.closeAllConnections(); server.close();
writeFileSync(out, JSON.stringify(rows, null, 1));
for (const r of rows) console.log(`${r.model}\t${r.case_id}\tfull=${r.body_sha256.slice(0, 16)}\tmasked=${r.body_masked_sha256.slice(0, 16)}\tattempts=${r.attempts_seen}\tkeys=${r.keys}`);
