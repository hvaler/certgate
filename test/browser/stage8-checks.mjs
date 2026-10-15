// Stage 8 browser checks of the model choice in a real Chromium at 375 px and 1280 px (S8-04, S8-21…S8-25, L-08,
// L-15, L-25). Not part of `vitest run`. Needs Playwright with Chromium, as test/browser/ui-checks.mjs:
//   npx -y -p playwright@1.56.1 node test/browser/stage8-checks.mjs [outDir]   (or NODE_PATH to that install)
// It starts its own CertGate server (container shape, the product's own model catalog) and its own TEST STUB.
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

const out = process.argv[2] || path.join(tmpdir(), "certgate-stage8-checks");
mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

const browser = await chromium.launch();
try {

  // ---- Stage 8 (S8-04, S8-21…S8-24, L-08, L-15, L-25): the model choice at 375 px and 1280 px, through the TEST STUB,
  // with the product's own model catalog (no seam). The stub lists a measured model, an experimental one, a text-only
  // id, an id carrying HTML and a 250-character id; it echoes a dataset reading and reports the model it is asked for.
  {
    const { EXPERIMENTAL_MODELS } = await import(pathToFileURL(path.join(ROOT, "dist", "src", "web", "models.js")).href);
    const X = EXPERIMENTAL_MODELS[0].id;
    const long = "L".repeat(250);
    const s8 = await startStub({ caseId: "cg-004", reportedModel: (m) => `self-dploy/${m}`, models: ["Qwen3.8-27B", X, { id: "Txt-Only", output: ["text"], architecture: { input_modalities: ["text"] } }, "<img src=x onerror=\"window.__pwned=3\">", long] });
    const ms = createApp({ env: { MODEL_BASE_URL: s8.url, MODEL_ID: "Qwen3.8-27B", LIVE_READS_PER_HOUR: "5", LIVE_MODELS: `Qwen3.8-27B,Gemma-4-31B-IT,${X}` } }).listen(0);
    await new Promise((r) => ms.once("listening", r));
    const base8 = `http://127.0.0.1:${ms.address().port}`;
    for (const width of [375, 1280]) {
      const p = await browser.newPage({ viewport: { width, height: 900 } });
      const dialogs = [];
      p.on("dialog", (d) => { dialogs.push(d.message()); d.dismiss(); });
      await p.goto(`${base8}/#/`);
      await p.waitForSelector("#live-models");
      const groups = await p.locator("#live-models").innerText();
      check(`S8-21 (${width}): the three groups, the probe time and the 200-character note are shown`, /MEASURED/.test(groups) && /NOT EVALUATED · EXPERIMENTAL/.test(groups) && /LISTED, NOT OFFERED/.test(groups) && /checked \d{4}-\d{2}-\d{2}T/.test(groups) && /Model ids longer than 200 characters are not shown\./.test(groups), groups.slice(0, 300));
      check(`L-08 (${width}): an endpoint id with HTML is shown as text and never runs; the 250-character id is not shown`, groups.includes("<img src=x onerror=\"window.__pwned=3\">") && (await p.evaluate(() => window.__pwned ?? null)) === null && dialogs.length === 0 && !groups.includes(long));
      check(`S8-04 (${width}): Qwen3.8-27B is the checked default; Gemma-4-31B-IT is disabled as not listed`, await p.locator("input[name=live-model][value='Qwen3.8-27B']").isChecked() && await p.locator("input[name=live-model][value='Gemma-4-31B-IT']").isDisabled() && /Gemma-4-31B-IT · not listed by the endpoint now \(checked/.test(groups));
      check(`S8-23 (${width}): a listed-not-offered id is text with its reason, never a choice`, /Txt-Only · no image probe/.test(groups) && (await p.locator("input[name=live-model][value='Txt-Only']").count()) === 0);
      check(`S8-22 (${width}): no acknowledgement box is shown while a measured model is chosen`, !(await p.locator("#live-ack-row").isVisible()));
      await p.check(`input[name=live-model][value='${X}']`);
      check(`S8-22 (${width}): choosing the experimental model shows its acknowledgement`, await p.locator("#live-ack-row").isVisible() && /this model is not evaluated; no figure of CertGate applies to it/.test(await p.locator("#live-ack-row").innerText()));
      await p.setInputFiles("#live-pdf", path.join(ROOT, "data", "cases", "cg-004", "certificate.pdf"));
      await p.check("#live-confirm");
      await p.click("button:has-text('Read live')");
      check(`S8-25 (${width}): without the acknowledgement the page sends nothing`, /Confirm first that this model is not evaluated/.test(await p.locator("#live-msg").innerText()) && !p.url().includes("#/local/"));
      await p.check("#live-ack");
      await p.click("button:has-text('Read live')");
      await p.waitForFunction(() => location.hash.startsWith("#/local/") && document.querySelector("#model-choice"), null, { timeout: 20000 });
      const line = await p.locator("#model-choice").innerText();
      check(`S8-24 (${width}): the experimental reading is labelled not evaluated next to the proposal, with no figure`, /^not evaluated/.test(line) && line.includes(X) && /No figure of CertGate applies to this model/.test(line) && !/0 \/ 18|false conforming/i.test(line), line);
      await p.screenshot({ path: path.join(out, `s8-experimental-result-${width}.png`), fullPage: true });
      await p.goto(`${base8}/#/`);
      await p.waitForSelector("#live-models");
      await p.screenshot({ path: path.join(out, `s8-live-models-${width}.png`), fullPage: true });
      await p.close();
    }
    await new Promise((r) => { ms.closeAllConnections(); ms.close(() => r()); });
    await s8.close();
  }
} finally {
  await browser.close();
}
writeFileSync(path.join(out, "stage8-checks.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) process.stdout.write(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}\n`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
