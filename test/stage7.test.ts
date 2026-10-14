// Stage 7 (dispatch 5): "View the original certificate" (S7-04, T7-02, CH7-04, CH7-05), the recorded flag (S7-05,
// T7-04, CH7-07) and the previews (S7-03, T7-03, CH7-06).
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { request } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import type { AppDeps } from "../src/web/app.js";
import { MemoryStore } from "../src/web/live-store.js";
import { ROOT } from "./helpers.js";
// @ts-expect-error plain JS test double
import { startStub, STUB_MODEL_ID } from "./support/stub-endpoint.mjs";
// @ts-expect-error plain JS tool
import { PREVIEW_IDS, preview } from "../tools/previews.mjs";

type Closable = { close: () => Promise<void> };
const open: Closable[] = [];
afterEach(async () => { while (open.length) await open.pop()!.close(); });
async function serve(deps: AppDeps) {
  const server = createApp(deps).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  open.push({ close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) });
  return (server.address() as AddressInfo).port;
}
/** A raw GET: the path goes on the wire exactly as written (fetch would normalise "..", "%2e%2e" and backslashes). */
function raw(port: number, p: string): Promise<{ status: number; type: string; headers: Record<string, unknown>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path: p, method: "GET" }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, type: String(res.headers["content-type"] ?? ""), headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on("error", reject);
    req.end();
  });
}
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const previewFile = (id: string) => readFileSync(path.join(ROOT, "data", "previews", `${id}.png`));
const ALLOWED = ["cg-001", "cg-002", "cg-003", "cg-004", "cg-005", "cg-010"];

describe("View the original certificate: an allow-list of case ids, nothing else (S7-04, T7-02, CH7-05)", () => {
  it("the three stories and the three samples answer 200 with image/png, nosniff, and exactly the committed preview bytes", async () => {
    const port = await serve({ env: {} });
    for (const id of ALLOWED) {
      const r = await raw(port, `/api/originals/${id}`);
      expect(r.status, id).toBe(200);
      expect(r.type, id).toBe("image/png");
      expect(r.headers["x-content-type-options"], id).toBe("nosniff");
      expect(sha(r.body), id).toBe(sha(previewFile(id)));
      expect(r.headers["x-content-sha256"], id).toBe(sha(previewFile(id)));
    }
  });
  it("traversal, unknown ids, case variants, suffixes, other dataset files and a real dataset id outside the allow-list all answer 404", async () => {
    const port = await serve({ env: {} });
    const refused = [
      "/api/originals/..", "/api/originals/..%2fcases", "/api/originals/%2e%2e", "/api/originals/%2e%2e%2fexpected", "/api/originals/..%5ccases",
      "/api/originals/cg-003%2f..%2f..%2fcase.json", "/api/originals/%2fetc%2fpasswd", "/api/originals/C:%5cWindows", "/api/originals/cg-003\\..\\..\\expected",
      "/api/originals/CG-003", "/api/originals/cg-003.png", "/api/originals/cg-003%00", "/api/originals/cg-003/case.json", "/api/originals/cg-003/certificate.pdf",
      "/api/originals/cg-020", "/api/originals/cg-030", "/api/originals/", "/api/originals/constructor", "/api/originals/__proto__", "/api/originals/toString",
      "/api/originals/by-certificate/", "/api/originals/by-certificate/cg-004", "/api/originals/by-certificate/" + "0".repeat(64),
    ];
    for (const p of refused) {
      const r = await raw(port, p);
      expect(r.status, p).toBe(404);
      expect(r.type, p).not.toBe("image/png");
    }
  });
  it("a live result's original is chosen by the certificate bytes (SHA-256): each sample maps to its own preview; a story's or another case's hash is 404 (CH7-04)", async () => {
    const port = await serve({ env: {} });
    for (const id of ["cg-004", "cg-005", "cg-010"]) {
      const h = sha(readFileSync(path.join(ROOT, "data", "cases", id, "certificate.pdf")));
      const r = await raw(port, `/api/originals/by-certificate/${h}`);
      expect(r.status, id).toBe(200);
      expect(sha(r.body), id).toBe(sha(previewFile(id)));
    }
    for (const id of ["cg-003", "cg-020"]) {
      const h = sha(readFileSync(path.join(ROOT, "data", "cases", id, "certificate.pdf")));
      expect((await raw(port, `/api/originals/by-certificate/${h}`)).status, id).toBe(404);
    }
  });
  it("the route reads the filesystem only through the fixed map built from the allow-list; the request id is only a key", () => {
    const src = readFileSync(path.join(ROOT, "src", "web", "app.ts"), "utf8");
    const fn = src.slice(src.indexOf("const ORIGINALS = "), src.indexOf("async function storyEvaluate"));
    expect(fn).toMatch(/new Map<string, string>\(\[\.\.\.STORY_IDS, \.\.\.SAMPLE_IDS\]\.map\(\(id\) => \[id, path\.join\(getDataDir\(\), "previews", `\$\{id\}\.png`\)\]\)\)/);
    expect(fn).toMatch(/const file = ORIGINALS\.get\(id\);\n\s+if \(file === undefined\) return send\(res, 404/);
    expect(fn).toMatch(/SAMPLE_IDS\.map\(\(id\) => \[createHash\("sha256"\)/);
    // The only readFileSync on a request is of the mapped file.
    expect((fn.match(/readFileSync\([^)]*\)/g) ?? []).filter((x) => !x.startsWith("readFileSync(path.join(getDataDir()"))).toEqual(["readFileSync(file)"]);
    expect(fn).toMatch(/readFileSync\(path\.join\(getDataDir\(\), "cases", id, "certificate\.pdf"\)\)/);
  });
  it("the page offers the original beside the values for every story, by bytes for a sample live result, and says plainly that a non-sample upload is the user's own file", () => {
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(js).toMatch(/"View the original certificate"/);
    expect(js).toMatch(/ctx\.original = \{ src: `\/api\/originals\/\$\{encodeURIComponent\(s\.id\)\}`/);
    expect(js).toMatch(/sampleHashes\.includes\(sha\) \? \{ by_certificate: sha \} : \{ own: true \}/);
    expect(js).toMatch(/The original is your own file/);
    // A non-sample upload requests nothing: the own-file branch renders text only, and every own case takes it.
    expect(js).toContain("if (!original || original.own) {");
    const own =js.slice(js.indexOf("if (!original || original.own)"), js.indexOf("return h(\"section\", { class: \"card stack\", \"aria-labelledby\": \"original-title\", id: \"original\" }, head,\n    h(\"details\""));
    expect(own).not.toMatch(/api\(|fetch\(|img|src/);
  });
});

describe("a recorded story says it is recorded, next to reading_source; a live result never does (S7-05, T7-04, CH7-07)", () => {
  it("each story file and the story list carry recorded: true with the recording date, next to reading_source", () => {
    const index = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", "index.json"), "utf8"));
    for (const id of ["cg-001", "cg-002", "cg-003"]) {
      const s = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", `${id}.json`), "utf8"));
      const keys = Object.keys(s.view);
      expect(keys.slice(keys.indexOf("reading_source"), keys.indexOf("reading_source") + 3), id).toEqual(["reading_source", "recorded", "recorded_at"]);
      expect(s.view.recorded, id).toBe(true);
      expect(s.view.recorded_at, id).toBe(s.recorded_at);
      expect(index.stories.find((x: { id: string }) => x.id === id).recorded, id).toBe(true);
    }
  });
  it("the evaluate route carries the same flag and date", async () => {
    const port = await serve({ env: {} });
    for (const id of ["cg-001", "cg-002", "cg-003"]) {
      const r = await fetch(`http://127.0.0.1:${port}/api/stories/${id}/evaluate`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const b = await r.json();
      const keys = Object.keys(b.view);
      expect(keys.slice(keys.indexOf("reading_source"), keys.indexOf("reading_source") + 3), id).toEqual(["reading_source", "recorded", "recorded_at"]);
      expect(b.view.recorded_at, id).toBe(JSON.parse(readFileSync(path.join(ROOT, "public", "stories", `${id}.json`), "utf8")).recorded_at);
    }
  });
  it("a live job result never carries the flag", async () => {
    const s = await startStub({});
    open.push(s);
    const port = await serve({ env: { MODEL_BASE_URL: s.url, MODEL_ID: STUB_MODEL_ID, MODEL_API_KEY: "sentinel-model-key-91bd44", LIVE_READS_PER_HOUR: "3" }, liveStore: new MemoryStore(), liveBudget: { pollMs: 20, queueMaxWaitMs: 20_000, readBudgetMs: 20_000, deadlineMs: 40_000, staleGraceMs: 10_000, leaseTtlMs: 45_000, marginMs: 0 } });
    const base = `http://127.0.0.1:${port}`;
    const cert = readFileSync(path.join(ROOT, "data", "cases", "cg-004", "certificate.pdf")).toString("base64");
    const j = await (await fetch(`${base}/api/live/jobs`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ certificate_base64: cert, synthetic_confirmed: true }) })).json();
    let v: { state: string; result?: { view: Record<string, unknown> } } = { state: "queued" };
    const until = Date.now() + 30_000;
    while (Date.now() < until && v.state !== "done" && v.state !== "failed") {
      v = await (await fetch(`${base}${j.poll}`)).json();
      await new Promise((r) => setTimeout(r, 20));
    }
    expect(v.state).toBe("done");
    expect(v.result!.view).not.toHaveProperty("recorded");
    expect(v.result!.view).not.toHaveProperty("recorded_at");
    expect(v.result!.view.reading_source).toBe("live");
  });
});

describe("previews regenerate byte-identical from the committed PDFs (S7-03, T7-03, CH7-06)", () => {
  it("a fresh run of tools/previews.mjs equals every committed PNG; the README lists each hash next to its PDF", async () => {
    expect(readdirSync(path.join(ROOT, "data", "previews")).filter((f) => f.endsWith(".png")).sort()).toEqual(PREVIEW_IDS.map((id: string) => `${id}.png`).sort());
    const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
    for (const id of PREVIEW_IDS) {
      const { png } = await preview(id);
      expect(sha(png), id).toBe(sha(previewFile(id)));
      expect(readme, id).toContain(`[${id}.png](data/previews/${id}.png)`);
      expect(readme, id).toContain(sha(png));
    }
  }, 120_000);
  it("the PNGs carry no time, text or software chunks", () => {
    for (const id of PREVIEW_IDS) {
      const b = previewFile(id);
      const types: string[] = [];
      for (let i = 8; i < b.length; ) { const len = b.readUInt32BE(i); types.push(b.toString("latin1", i + 4, i + 8)); i += 12 + len; }
      expect(types.filter((t) => ["tIME", "tEXt", "iTXt", "zTXt"].includes(t)), id).toEqual([]);
    }
  });
});

describe("the README for a judge (S7-06, T7-07, CH7-08, CH7-10)", () => {
  const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
  const register = readFileSync(path.join(ROOT, "evidence", "runs", "certgate-001", "STAGE-REGISTER.md"), "utf8");
  it("the sections come in the dispatch order", () => {
    const order = ["## Try it", "## What runs on AMD", "## Evaluation (real model)", "## Comparison with Gemma-4-31B-IT", "## Architecture and certificate flow", "## Screenshots", "## Run it", "## Limitations", "## How it was built and verified"];
    const at = order.map((h) => readme.indexOf(`\n${h}`));
    expect(at.every((x) => x > 0), JSON.stringify(at)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });
  it("\"How it was built and verified\" states only what the stage register records", () => {
    const sec = readme.slice(readme.indexOf("## How it was built and verified"), readme.indexOf("## License"));
    const rows = [...sec.matchAll(/^\| (\d) · [^|]+\| `([0-9a-f]{8})` \| (\d of \d) \|/gm)];
    expect(rows.map((r) => r[1])).toEqual(["1", "2", "3", "4", "5", "6"]);
    for (const [, stage, commit, cycles] of rows) {
      // A register row is "| <stage> | … **ACCEPTED** … <commit> …" (one physical line may carry two rows).
      const line = register.split("\n").flatMap((l) => l.split(/(?=\| \d \| )/)).find((l) => l.startsWith(`| ${stage} |`) && l.includes("**ACCEPTED**") && l.includes(commit!));
      expect(line, `stage ${stage}: ${commit}`).toBeDefined();
      expect(line, `stage ${stage}: repair cycle ${cycles}`).toContain(`repair cycle ${cycles}`);
    }
    for (const [n, fragment] of [["14 of 14", "14/14 killed"], ["29 of 29", "auditor 29/29 killed"], ["12 of 12", "S3 12/12"], ["38 of 38", "adversary 38/38"], ["13 of 13", "R6.4 delta 13/13"], ["9 of 9", "k1–k9 9/9"]] as const) {
      expect(sec, n).toContain(n);
      expect(register, fragment).toContain(fragment);
    }
  });
  it("Try it never contains an access code; it names the code only as the one given to the judges", () => {
    const sec = readme.slice(readme.indexOf("## Try it"), readme.indexOf("## What runs on AMD"));
    expect(sec).toMatch(/the access code given to the\s+judges/);
    expect(sec).not.toMatch(/LIVE_ACCESS_CODE|access code is|code: /i);
  });
});
