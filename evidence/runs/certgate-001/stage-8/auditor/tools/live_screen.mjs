// Auditor (S8-18, S8-04/S8-21…S8-23 live): the deployed live-reading screen in a real browser, GETs only, no reading.
// Takes a screenshot at 1280 and 375 px and extracts the three groups as the page shows them.
//   NODE_PATH=<playwright> node live_screen.mjs <site> <out-dir>
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.cwd(), "noop.js"));
const { chromium } = require("playwright");
const [site, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const res = {};
for (const w of [1280, 375]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  const dialogs = [];
  page.on("dialog", (d) => { dialogs.push(d.message()); d.dismiss(); });
  await page.goto(site + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("#live-models", { timeout: 20000 });
  const g = await page.evaluate(() => {
    const t = (sel) => [...document.querySelectorAll(sel)].map((e) => e.textContent.replace(/\s+/g, " ").trim());
    const radios = [...document.querySelectorAll('#live-models input[type=radio]')].map((r) => ({ value: r.value, disabled: r.disabled, checked: r.checked }));
    return { statement: t("#live-models-statement")[0], measured: t("#live-models-measured li"), experimental: t("#live-models-experimental li"), other: t("#live-models-other li"), radios, ackVisible: !document.querySelector("#live-ack-row")?.hidden };
  });
  await page.locator("#live-models").screenshot({ path: path.join(out, `deployed-live-models-${w}.png`) });
  res[w] = { ...g, dialogs };
  await page.close();
}
await browser.close();
writeFileSync(path.join(out, "deployed-live-screen.json"), JSON.stringify({ site, captured_at: new Date().toISOString(), ...res }, null, 1));
for (const w of [1280, 375]) {
  const r = res[w];
  console.log(`${w}px: radios ${JSON.stringify(r.radios)}; ack row visible=${r.ackVisible}; dialogs=${r.dialogs.length}`);
  console.log(`  measured: ${JSON.stringify(r.measured)}`);
  console.log(`  experimental: ${JSON.stringify(r.experimental).slice(0, 400)}`);
  console.log(`  listed, not offered: ${JSON.stringify(r.other)}`);
}
