// Browser checks of the CertGate UI in a real Chromium (S2-04, S2-06, B-09, B-16, B-17, B-21, S2-20).
// Not part of `vitest run` (the image has no browser). Needs Playwright with a Chromium available:
//   npm i --no-save playwright   (or any install where require("playwright") resolves)
//   node test/browser/ui-checks.mjs [outDir]
// It starts its own CertGate server (mock mode, no endpoint) and its own TEST STUB for the B-16 check.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(path.join(process.cwd(), "noop.js"));
const { chromium } = require("playwright");
const { createApp } = await import(pathToFileURL(path.join(ROOT, "dist", "src", "server.js")).href);
const { startStub } = await import(pathToFileURL(path.join(ROOT, "test", "support", "stub-endpoint.mjs")).href);

const out = process.argv[2] || path.join(tmpdir(), "certgate-ui-checks");
mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

async function serve(env) {
  const s = createApp({ env }).listen(0);
  await new Promise((r) => s.once("listening", r));
  return { base: `http://127.0.0.1:${s.address().port}`, close: () => new Promise((r) => { s.closeAllConnections(); s.close(() => r()); }) };
}

const browser = await chromium.launch();
try {
  // ---- mock mode, no endpoint
  const plain = await serve({ LIVE_READS_PER_HOUR: "5" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const external = [];
  page.on("request", (r) => { if (!r.url().startsWith(plain.base) && !r.url().startsWith("blob:") && !r.url().startsWith("data:")) external.push(r.url()); });

  // Release gating (S2-04, A-21)
  await page.goto(`${plain.base}/#/story/cg-002`);
  await page.waitForSelector("#release-btn");
  check("cg-002: Release disabled on a block proposal", await page.locator("#release-btn").isDisabled());
  await page.goto(`${plain.base}/#/story/cg-003`);
  await page.waitForSelector("#release-btn");
  check("cg-003: Release disabled before confirmation", await page.locator("#release-btn").isDisabled());
  const truth = JSON.parse((await (await fetch(`${plain.base}/stories/cg-003.json`)).text())).view.rows.filter((r) => r.critical);
  for (const r of truth) {
    const v = r.field === "mechanical.ReH" ? "358" : r.state === "absent" ? "absent" : r.value;
    await page.fill(`[id="c-${r.field}"]`, v ?? "");
  }
  await page.fill("#confirm-by", "Tech · Quality");
  await page.click("text=Re-run the rules with these values");
  await page.waitForFunction(() => !document.querySelector("#release-btn")?.disabled, null, { timeout: 5000 }).catch(() => {});
  check("cg-003: Release enabled after every critical field confirmed with ReH 358", !(await page.locator("#release-btn").isDisabled()));
  await page.screenshot({ path: path.join(out, "cg-003-confirmed-1280.png"), fullPage: true });

  // B-21: nothing entered on case A carries to case B
  await page.goto(`${plain.base}/#/story/cg-001`);
  await page.waitForSelector("#who");
  await page.fill("#who", "Alice A");
  await page.fill("#why", "case A reason");
  await page.goto(`${plain.base}/#/story/cg-002`);
  await page.waitForSelector("#who");
  check("C12/B-21: decision fields empty on the next case", (await page.inputValue("#who")) === "" && (await page.inputValue("#why")) === "");
  const leaked = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("certgate.")));
  check("C12/B-21: story inputs are not written to browser storage", leaked.length === 0, leaked.join(","));

  // S2-20 + B-09: upload with no endpoint -> C11 endpoint_off, kept in the browser, labelled stored after reload
  await page.goto(`${plain.base}/#/`);
  await page.waitForSelector("#live-pdf");
  await page.setInputFiles("#live-pdf", path.join(ROOT, "data", "cases", "cg-001", "certificate.pdf"));
  await page.setInputFiles("#live-csv", path.join(ROOT, "data", "delivery", "ALB-2026-0917.csv"));
  await page.fill("#live-line", "1");
  await page.click("button:has-text('Read live')");
  await page.waitForFunction(() => location.hash.startsWith("#/local/") && document.querySelector("[data-stored-label]"), null, { timeout: 10000 });
  const t1 = await page.locator("[data-stored-label]").innerText();
  check("S2-20: upload with no endpoint is a live attempt with no reading, review", /live attempt · no reading/.test(t1) && /Review/.test(await page.locator("#proposal").innerText()), t1);
  await page.reload();
  await page.waitForSelector("[data-stored-label]");
  const t2 = await page.locator("[data-stored-label]").innerText();
  check("B-09: reopened from browser storage it is labelled stored, never live", /^Stored in this browser/.test(t2) && t1 === t2 && !/\blive reading\b/.test(t2), t2);
  check("B-17: no third-party request", external.length === 0, external.join(","));
  await page.close();
  await plain.close();

  // ---- B-16: document-derived strings with HTML are rendered as text (through the TEST STUB)
  const doc = JSON.parse((await import("node:fs")).readFileSync(path.join(ROOT, "data", "cases", "cg-001", "reading.json"), "utf8"));
  doc.fields.certificate_no.value = '<img src=x onerror="window.__pwned=1">SV-<b>1</b>';
  doc.fields.dimensions.value = "<script>window.__pwned=2</script>";
  const readingFile = path.join(out, "hostile-reading.json");
  writeFileSync(readingFile, JSON.stringify(doc));
  const stub = await startStub({ readingFile });
  const live = await serve({ MODEL_BASE_URL: stub.url, MODEL_ID: "certgate-test-stub", LIVE_READS_PER_HOUR: "5" });
  const p2 = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await p2.goto(`${live.base}/#/`);
  await p2.waitForSelector("#live-pdf");
  await p2.setInputFiles("#live-pdf", path.join(ROOT, "data", "cases", "cg-001", "certificate.pdf"));
  await p2.click("button:has-text('Read live')");
  await p2.waitForFunction(() => location.hash.startsWith("#/local/") && document.querySelector("#case-title"), null, { timeout: 10000 });
  await p2.waitForTimeout(500);
  const h1 = await p2.locator("#case-title").innerText();
  const pwned = await p2.evaluate(() => window.__pwned ?? null);
  const imgs = await p2.locator("main img").count();
  check("B-16: HTML in document fields is shown as text and never executed", h1.includes("<img src=x") && pwned === null && imgs === 0, h1);
  await p2.screenshot({ path: path.join(out, "b16-hostile-375.png"), fullPage: true });
  await p2.close();
  await live.close();
  await stub.close();
} finally {
  await browser.close();
}
writeFileSync(path.join(out, "ui-checks.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) process.stdout.write(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}\n`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
