// Auditor (stage 5, candidate 1, R5.4 E-16): simulate the Vercel function bundle of api/index.ts.
//   node sim_bundle.mjs <clone-with-dist-and-node_modules> <empty-bundle-dir> <pdfjs:0|1> <canvas:0|1>
// The bundle mirrors /var/task: package.json, the compiled product (dist/src -> src), api/index.js transpiled from
// api/index.ts with the clone's own TypeScript, the includeFiles directories data, config and public/stories, and
// node_modules with or without pdfjs-dist (and with or without @napi-rs/canvas). It then runs the handler with
// VERCEL=1, no MODEL_* variables, in a child process whose cwd is the bundle, and calls the DEPLOY.md function routes.
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const [clone, out, withPdf, withCanvas] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
cpSync(path.join(clone, "package.json"), path.join(out, "package.json"));
cpSync(path.join(clone, "dist", "src"), path.join(out, "src"), { recursive: true });
for (const d of ["data", "config", path.join("public", "stories")]) cpSync(path.join(clone, d), path.join(out, d), { recursive: true });
const ts = createRequire(path.join(clone, "package.json"))("typescript");
const src = readFileSync(path.join(clone, "api", "index.ts"), "utf8");
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2023 } }).outputText;
mkdirSync(path.join(out, "api"), { recursive: true });
writeFileSync(path.join(out, "api", "index.js"), js);
const nm = path.join(clone, "node_modules");
for (const e of readdirSync(nm)) {
  if (e === ".bin" || e === ".package-lock.json") continue;
  if (e === "pdfjs-dist" && withPdf !== "1") continue;
  if (e === "@napi-rs" && withCanvas !== "1") continue;
  cpSync(path.join(nm, e), path.join(out, "node_modules", e), { recursive: true });
}
const runner = `
import http from "node:http";
const { default: handler } = await import("./api/index.js").catch((e) => { console.log(JSON.stringify({ import_error: String(e && e.message) })); process.exit(0); });
const srv = http.createServer((q, s) => handler(q, s));
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + srv.address().port;
const out = {};
for (const [m, p, b] of [["GET", "/health"], ["GET", "/api/f1"], ["GET", "/api/live/status"], ["POST", "/api/stories/cg-003/evaluate", "{}"],
  ["POST", "/api/live/read", JSON.stringify({ certificate_base64: "", synthetic_confirmed: true })]]) {
  const r = await fetch(base + p, { method: m, body: b, headers: b ? { "content-type": "application/json" } : {} });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {}
  out[m + " " + p] = { status: r.status, summary: j ? { status: j.status, mode: j.mode, reader: j.reader, state: j.state, detail: j.detail, enabled: j.enabled, deployed_site: j.deployed_site, proposal: j.proposal ?? j.view?.proposal ?? j.summary?.proposal, error: j.error } : t.slice(0, 200) };
}
console.log(JSON.stringify(out, null, 1));
srv.close();
`;
writeFileSync(path.join(out, "sim-runner.mjs"), runner);
const env = { ...process.env, VERCEL: "1" };
for (const k of Object.keys(env)) if (k.startsWith("MODEL_") || k === "LIVE_ACCESS_CODE") delete env[k];
const r = spawnSync(process.execPath, ["sim-runner.mjs"], { cwd: out, env, encoding: "utf8" });
console.log(`bundle ${out} pdfjs-dist=${withPdf} @napi-rs/canvas=${withCanvas} pdfjs present=${existsSync(path.join(out, "node_modules", "pdfjs-dist"))}`);
console.log(r.stdout); if (r.stderr) console.log("stderr:", r.stderr.split("\n").filter((l) => /Cannot find|Error|error/.test(l)).slice(0, 8).join("\n"));
