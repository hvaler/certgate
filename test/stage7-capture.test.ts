// Static checks over the screenshot capture scripts (S7-02, T7-05; CH7-01, CH7-02, CH7-03, CH7-11).
// The scripts are never run here: they drive a browser against the deployed site.
// Stage 9 (dispatch 7, R9.0 A9-01): the same safeguard checks also cover the Stage 9 capture script, which copies the
// Stage 7 tool's safeguards because the tool cannot be imported (it starts a capture when loaded).
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";

const SCRIPTS = [
  { name: "capture script", file: path.join("tools", "capture-screenshots.mjs"), manifestEnd: 'writeFileSync(path.join(OUT_DIR, "manifest.json")' },
  { name: "Stage 9 capture script", file: path.join("evidence", "runs", "certgate-001", "stage-9", "implementer", "capture-stage9.mjs"), manifestEnd: "writeFileSync(manifestPath" },
];
for (const S of SCRIPTS) {
const text = readFileSync(path.join(ROOT, S.file), "utf8").replace(/\r\n/g, "\n");
const code = text.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
describe(`${S.name}: pinned playwright`, () => {
  it("states the pinned version and Chromium build in its header", () => {
    expect(text).toContain("playwright@1.56.1");
    expect(text).toMatch(/Chromium build 1194/);
    expect(code).toMatch(/createRequire/);
    expect(code).toMatch(/import\("playwright"\)/);
  });
});

describe(`${S.name}: no recording of headers (CH7-02)`, () => {
  for (const banned of ["tracing.start", "recordHar", "recordVideo", 'on("console"', "on('console'"]) {
    it(`never uses ${banned}`, () => expect(text).not.toContain(banned));
  }
});

describe(`${S.name}: access code only as a header of the job POST (CH7-01)`, () => {
  it("intercepts the job POST with page.route and adds x-live-access-code", () => {
    expect(code).toContain("page.route(");
    expect(code).toContain("**/api/live/jobs");
    expect(code).toMatch(/CODE_HEADER = "x-live-access-code"/);
    expect(code).toMatch(/headers\[CODE_HEADER\] = accessCode/);
  });
  it("reads the code from the Windows user environment, falling back to process.env", () => {
    expect(code).toContain("GetEnvironmentVariable");
    expect(code).toContain("'User'");
    expect(code).toContain('userEnv("LIVE_ACCESS_CODE")');
    expect(code).toMatch(/process\.env\[name\]/);
  });
  it("never fills or types into the access-code input", () => {
    expect(code).toMatch(/CODE_INPUT = "#live-code"/);
    expect(code).not.toMatch(/(CODE_INPUT|#live-code|password)[^;\n]*\.(fill|type|pressSequentially)\(/);
    // The only .fill( call is the delivery-line field.
    const fills = code.match(/\.fill\([^)]*\)/g) ?? [];
    expect(code.match(/locator\("[^"]+"\)\.fill\(/g)).toEqual(['locator("#live-line").fill(']);
    expect(fills.length).toBe(1);
    expect(code).not.toMatch(/\.type\(/);
  });
  it('asserts the code input value === "" before every screenshot', () => {
    expect(code).toMatch(/value === ""/);
    const shoot = code.slice(code.indexOf("const shoot = async"));
    const guardAt = shoot.indexOf("await guard(page, screen, secrets)");
    expect(guardAt).toBeGreaterThan(-1);
    const shotAt = shoot.search(/\.screenshot\(/);
    expect(guardAt).toBeLessThan(shotAt);
    // Every screenshot call lives inside shoot().
    expect((code.match(/\.screenshot\(/g) ?? []).length).toBe((shoot.slice(0, shoot.indexOf("};")).match(/\.screenshot\(/g) ?? []).length);
  });
  it("makes exactly one job POST and refuses a second", () => {
    expect(code).toMatch(/job_posts >= 1\) \{ refusedExtra = true; return route\.abort\(\)/);
    expect(code).toMatch(/job_posts !== 1/);
  });
});

describe(`${S.name}: visible-field rule (CH7-11)`, () => {
  it("scans document.body.innerText for the code, the key and the base URL path, without printing them", () => {
    expect(code).toContain("document.body.innerText");
    expect(code).toContain('userEnv("MODEL_API_KEY")');
    expect(code).toContain('userEnv("MODEL_BASE_URL")');
    expect(code).toContain("secret check failed on ${screen}");
    expect(code).toContain('"visible-field rule: innerText scanned for the access code and the key; code input empty"');
  });
  it("never logs the code, the key or the secrets list", () => {
    const logs = code.match(/console\.(log|error|warn|info|debug)\([^;]*\);?/g) ?? [];
    expect(logs.length).toBeGreaterThan(0);
    for (const l of logs) expect(l).not.toMatch(/accessCode|modelKey|modelBasePath|\bsecrets\b|process\.env/);
  });
  it("never writes the code into the manifest", () => {
    const manifest = code.slice(code.indexOf("const manifest = {"), code.indexOf(S.manifestEnd));
    expect(manifest.length).toBeGreaterThan(20);
    expect(manifest).not.toMatch(/accessCode|modelKey|modelBasePath|secrets/);
  });
});

}

describe("Stage 9 capture script: measured models only, one reading, per-image machine time (S9-02, A9-03, A9-05)", () => {
  const s9 = readFileSync(path.join(ROOT, SCRIPTS[1]!.file), "utf8").replace(/\r\n/g, "\n");
  it("accepts only a measured model and stops on a failed reading without retrying", () => {
    expect(s9).toContain('const MEASURED = ["Gemma-4-31B-IT", "Qwen3.8-27B"];');
    expect(s9).toContain("if (!MEASURED.includes(out.model)) fail(");
    expect(s9).toMatch(/seen\("failed"\);\n\s+await page\.unroute\("\*\*\/api\/live\/jobs"\);\n[^\n]*\n\s+return;/);
  });
  it("captions every image with its model, the site commit and its own capture time", () => {
    expect(s9).toContain("caption: `${screen} · model ${args.model} · site commit ${short} · captured ${at}`");
    expect(s9).toContain("const at = new Date().toISOString();");
  });
});

const text = readFileSync(path.join(ROOT, "tools", "capture-screenshots.mjs"), "utf8").replace(/\r\n/g, "\n");
const code = text.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

describe("capture script: manifest with served-file hashes (CH7-03)", () => {
  it("hashes the served files at capture time", () => {
    for (const f of ["/index.html", "/app.js", "/styles.css", "/labels.js", "/figures.json", "/stories/index.json"]) expect(code).toContain(`"${f}"`);
    expect(code).toMatch(/createHash\("sha256"\)/);
  });
  it("writes docs/screenshots/manifest.json with commit, site, time, viewports, version, images and captions", () => {
    expect(code).toMatch(/path\.join\(ROOT, "docs", "screenshots"\)/);
    expect(code).toContain('writeFileSync(path.join(OUT_DIR, "manifest.json")');
    const manifest = code.slice(code.indexOf("const manifest = {"));
    for (const k of ["site:", "site_commit:", "captured_at:", "viewports:", "playwright:", "served_files_sha256:", "secret_check:", "images"]) expect(manifest).toContain(k);
    expect(code).toContain("`${screen} · site commit ${short} · captured ${capturedAt}`");
    expect(code).toContain("`${screen}-${width}.png`");
  });
  it("captures at 1280 and 375 px", () => {
    expect(code).toMatch(/width: 1280/);
    expect(code).toMatch(/width: 375/);
  });
});
