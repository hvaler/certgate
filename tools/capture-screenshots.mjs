// Screenshots of the deployed site for the submission (S7-02, T7-05; challenges CH7-01, CH7-02, CH7-03, CH7-11).
//
// Pinned browser automation: playwright 1.56.1 with its Chromium build 1194, run through npx so nothing is added to
// package.json or package-lock.json (L-13):
//
//   npx -y playwright@1.56.1 install chromium                      (once: downloads Chromium build 1194)
//   npx -y -p playwright@1.56.1 node tools/capture-screenshots.mjs [--site URL] [--commit SHA] [--live]
//
//   --site URL     site to capture (default https://certgate-wheat.vercel.app)
//   --commit SHA   commit the site was deployed from; recorded in the manifest and in every caption
//   --live         also make ONE real live reading of the sample cg-004 (exactly one POST /api/live/jobs) and
//                  capture it queued, reading and done (1280 px only, since the reading is made once)
//
// Output: docs/screenshots/<name>-<width>.png and docs/screenshots/manifest.json with the SHA-256 of the served
// files (/index.html, /app.js, /styles.css, /labels.js, /figures.json, /stories/index.json) fetched at capture time,
// the SHA-256 of every image and its caption.
//
// Secrets (CH7-01, CH7-11). The access code is read only with --live, from the Windows user-level environment
// variable LIVE_ACCESS_CODE (falling back to process.env). It is never printed, never typed into the page: the
// visible access-code input stays empty and the code is added as the x-live-access-code request header of the one
// job POST only, by page.route interception. Before every screenshot the access-code input must be empty and the
// page's document.body.innerText must contain neither the code nor MODEL_API_KEY nor the path part of
// MODEL_BASE_URL (when set in the user environment); a hit aborts the run without printing the value.
//
// CH7-02: no Playwright tracing, no HAR archive, no video recording and no console capture are used, deliberately:
// each could keep request headers (and so the access code) on disk. The browser context gets a viewport only.
//
// The script prints screen names, file names and hashes only. It exits non-zero on any failure.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs", "screenshots");
const PLAYWRIGHT_VERSION = "1.56.1";
const CHROMIUM_BUILD = "1194";
const DEFAULT_SITE = "https://certgate-wheat.vercel.app";
const SERVED_FILES = ["/index.html", "/app.js", "/styles.css", "/labels.js", "/figures.json", "/stories/index.json"];
const VIEWPORTS = [{ width: 1280, height: 800 }, { width: 375, height: 812 }];
const LIVE_WIDTH = 1280;
const LIVE_SAMPLE = "cg-004";
const CODE_HEADER = "x-live-access-code";
const CODE_INPUT = "#live-code";
const LIVE_TIMEOUT_MS = 10 * 60 * 1000;
const SECRET_CHECK_NOTE = "visible-field rule: innerText scanned for the access code and the key; code input empty";

class CaptureError extends Error {}
const fail = (msg) => { throw new CaptureError(msg); };

// ---------------------------------------------------------------- arguments
function parseArgs(argv) {
  const out = { site: DEFAULT_SITE, commit: null, live: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--live") out.live = true;
    else if (a === "--site" && argv[i + 1]) out.site = argv[++i];
    else if (a === "--commit" && argv[i + 1]) out.commit = argv[++i];
    else fail(`unknown or incomplete argument: ${a}`);
  }
  let u;
  try { u = new URL(out.site); } catch { fail("--site is not a URL"); }
  if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") fail("--site must be https (or localhost)");
  out.site = u.origin;
  if (out.commit !== null && !/^[0-9a-f]{7,40}$/i.test(out.commit)) fail("--commit must be a hex commit SHA");
  return out;
}

// ---------------------------------------------------------------- playwright (pinned, from the npx package path)
async function loadPlaywright() {
  const dirs = (process.env.PATH || "").split(path.delimiter).filter((d) => /[\\/]_npx[\\/]/.test(d) && /node_modules[\\/]\.bin[\\/]?$/.test(d));
  for (const bin of dirs) {
    const nodeModules = path.dirname(bin.replace(/[\\/]+$/, ""));
    if (!existsSync(path.join(nodeModules, "playwright", "package.json"))) continue;
    const req = createRequire(path.join(nodeModules, "noop.js"));
    return { pw: req("playwright"), version: req("playwright/package.json").version };
  }
  const pw = await import("playwright");
  const req = createRequire(import.meta.url);
  let version = null;
  try { version = req("playwright/package.json").version; } catch { /* version read below from the pinned check */ }
  return { pw: pw.default ?? pw, version };
}

// ---------------------------------------------------------------- secrets (values are never printed or written)
function userEnv(name) {
  let v = "";
  if (process.platform === "win32") {
    try {
      v = execFileSync("powershell.exe", ["-NoProfile", "-Command", `[Environment]::GetEnvironmentVariable('${name}','User')`],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], windowsHide: true }).replace(/[\r\n]+$/, "");
    } catch { v = ""; }
  }
  if (!v) v = process.env[name] || "";
  return v;
}

function basePathOf(url) {
  if (!url) return "";
  try {
    const p = new URL(url).pathname.replace(/\/+$/, "");
    return p.length > 1 ? p : "";
  } catch { return ""; }
}

/** Replaces any secret in a message with a marker, so an error text can be printed safely. */
function redact(text, secrets) {
  let s = String(text);
  for (const v of secrets) if (v) s = s.split(v).join("[redacted]");
  return s;
}

// ---------------------------------------------------------------- hashing and served files
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

async function servedHashes(site) {
  const out = {};
  for (const f of SERVED_FILES) {
    const r = await fetch(site + f, { cache: "no-store" });
    if (!r.ok) fail(`served file ${f} answered ${r.status}`);
    out[f] = sha256(Buffer.from(await r.arrayBuffer()));
  }
  return out;
}

// ---------------------------------------------------------------- per-screenshot guards
async function guard(page, screen, secrets) {
  // CH7-01: the visible access-code input (and any password field) must be empty before every screenshot.
  const values = await page.evaluate((sel) => {
    const list = [...document.querySelectorAll(`${sel}, input[type=password]`)];
    return list.map((el) => el.value);
  }, CODE_INPUT);
  for (const value of values) if (!(value === "")) fail(`access-code input not empty on ${screen}`);
  // CH7-11: visible-field rule, checked here in Node; no secret is sent into the page.
  const text = await page.evaluate(() => document.body.innerText);
  for (const v of secrets) if (v && text.includes(v)) fail(`secret check failed on ${screen}`);
}

// ---------------------------------------------------------------- capture
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const accessCode = args.live ? userEnv("LIVE_ACCESS_CODE") : "";
  const modelKey = userEnv("MODEL_API_KEY");
  const modelBasePath = basePathOf(userEnv("MODEL_BASE_URL"));
  const secrets = [accessCode, modelKey, modelBasePath].filter(Boolean);
  const run = { args, secrets };
  try { await capture(run, accessCode); } catch (e) {
    const msg = e instanceof CaptureError ? e.message : `capture failed: ${redact(e && e.message ? e.message.split("\n")[0] : e, secrets)}`;
    console.error(msg);
    process.exitCode = 1;
  }
}

async function capture(run, accessCode) {
  const { args, secrets } = run;
  const { pw, version } = await loadPlaywright();
  if (version !== PLAYWRIGHT_VERSION) fail(`playwright ${version ?? "unknown"} found; ${PLAYWRIGHT_VERSION} is pinned`);
  mkdirSync(OUT_DIR, { recursive: true });

  const capturedAt = new Date().toISOString();
  const short = args.commit ? args.commit.slice(0, 7) : "unknown";
  const caption = (screen) => `${screen} · site commit ${short} · captured ${capturedAt}`;
  const served = await servedHashes(args.site);
  for (const [f, h] of Object.entries(served)) console.log(`${h}  served ${f}`);

  const images = [];
  const browser = await pw.chromium.launch({ headless: true });
  const live = { requested: args.live, job_posts: 0, states_observed: [] };
  try {
    const shoot = async (page, screen, width, opts) => {
      await guard(page, screen, secrets);
      const file = `${screen}-${width}.png`;
      const target = path.join(OUT_DIR, file);
      if (opts && opts.locator) await opts.locator.screenshot({ path: target, animations: "disabled" });
      else await page.screenshot({ path: target, animations: "disabled", fullPage: !!(opts && opts.fullPage), clip: opts && opts.clip });
      const hash = sha256(readFileSync(target));
      images.push({ file, screen, width, sha256: hash, caption: caption(screen) });
      console.log(`${hash}  ${file}`);
    };

    for (const vp of VIEWPORTS) {
      // Deliberately only a viewport and a scale factor: see CH7-02 in the header.
      const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
      const page = await context.newPage();
      // Each screen is loaded from a fresh document. A hash-only navigation lets an earlier screen's slow async
      // render land on top of the next one (seen on the deployed site: the landing overwrote story cg-003 about
      // 3 s later), so screens never follow one another by hash change here.
      const go = async (hash) => {
        await page.goto("about:blank");
        await page.goto(`${args.site}/${hash}`, { waitUntil: "networkidle" });
      };

      // Landing with its evaluation figures.
      await go("#/");
      await page.locator('[data-figures="evaluation"]').waitFor();
      await shoot(page, "landing", vp.width, { fullPage: false });

      // Judge mode: the three recorded runs.
      await go("#/judge");
      await page.locator("#judge .card.story").first().waitFor();
      await page.locator("#judge").scrollIntoViewIfNeeded();
      await shoot(page, "judge", vp.width, { locator: page.locator("#judge") });

      // Story cg-003: the ReH row and the Block proposal.
      await go("#/story/cg-003");
      await page.locator("#proposal").waitFor();
      if (!/^Block/.test((await page.locator("#proposal").innerText()).trim())) fail("story-cg-003 does not show the Block proposal");
      if ((await page.locator("tbody th", { hasText: "ReH" }).count()) < 1) fail("story-cg-003 has no ReH row");
      await shoot(page, "story-cg-003", vp.width, { fullPage: true });

      // Confirmation (when the case asks for it) and decision section of the same story.
      await page.locator("#decide").waitFor();
      const clip = await page.evaluate(() => {
        const secs = ["#confirm-title", "#decide"].map((s) => document.querySelector(s)?.closest("section")).filter(Boolean);
        const boxes = secs.map((el) => el.getBoundingClientRect());
        const top = Math.min(...boxes.map((b) => b.top)) + window.scrollY - 8;
        const bottom = Math.max(...boxes.map((b) => b.bottom)) + window.scrollY + 8;
        return { x: 0, y: Math.max(0, top), width: document.documentElement.clientWidth, height: bottom - Math.max(0, top) };
      });
      await shoot(page, "story-cg-003-decision", vp.width, { fullPage: true, clip });

      // Runs on AMD panel.
      await go("#/amd");
      await page.locator("#amd-state").waitFor();
      await shoot(page, "amd", vp.width, { fullPage: true });

      // Live-reading screen (nothing is sent).
      await go("#/");
      await page.locator("#live").waitFor();
      await page.locator("#live").scrollIntoViewIfNeeded();
      await shoot(page, "live", vp.width, { locator: page.locator("#live") });

      if (args.live && vp.width === LIVE_WIDTH) await liveReading(page, args, accessCode, live, shoot, vp.width);
      await context.close();
    }
  } finally {
    await browser.close();
  }

  // The site must not have changed during the capture.
  const after = await servedHashes(args.site);
  for (const f of SERVED_FILES) if (after[f] !== served[f]) fail(`served file ${f} changed during the capture`);

  const manifest = {
    site: args.site,
    site_commit: args.commit,
    captured_at: capturedAt,
    viewports: VIEWPORTS.map((v) => v.width),
    playwright: PLAYWRIGHT_VERSION,
    chromium_build: CHROMIUM_BUILD,
    served_files_sha256: served,
    secret_check: SECRET_CHECK_NOTE,
    live: live.requested ? { sample: LIVE_SAMPLE, width: LIVE_WIDTH, job_posts: live.job_posts, job_id: live.job_id ?? null, post_status: live.post_status ?? null, states_observed: live.states_observed, timeline: live.timeline ?? [], outcome: live.failure ? "failed" : live.states_observed.includes("done") ? "done" : "not run", failure: live.failure ?? null } : null,
    images,
  };
  writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`${sha256(readFileSync(path.join(OUT_DIR, "manifest.json")))}  manifest.json`);
}

/** One real reading of the sample cg-004: exactly one job POST, captured queued, reading and done. */
async function liveReading(page, args, accessCode, live, shoot, width) {
  const status = await (await page.request.get(`${args.site}/api/live/status`)).json();
  if (!status || !status.enabled || !status.job_api) fail("live reading is not enabled on the site");
  if (status.access_code_required && !accessCode) fail("the site needs the access code and LIVE_ACCESS_CODE is not set");
  const list = await (await page.request.get(`${args.site}/api/samples`)).json();
  const sample = (list.samples || []).find((s) => s.id === LIVE_SAMPLE);
  if (!sample) fail(`sample ${LIVE_SAMPLE} is not offered`);
  const pdf = await (await page.request.get(args.site + sample.certificate)).body();
  if (sha256(pdf) !== sample.certificate_sha256) fail(`sample ${LIVE_SAMPLE} certificate hash differs from /api/samples`);
  const csv = await (await page.request.get(args.site + sample.delivery_note)).body();

  // The header is added to the job POST only; the visible code input is never filled. A second POST is refused.
  let refusedExtra = false;
  await page.route("**/api/live/jobs", async (route) => {
    const req = route.request();
    if (req.method() !== "POST") return route.continue();
    if (live.job_posts >= 1) { refusedExtra = true; return route.abort(); }
    live.job_posts += 1;
    const headers = { ...req.headers() };
    if (accessCode) headers[CODE_HEADER] = accessCode;
    return route.continue({ headers });
  });

  // Every state seen, with its machine-recorded UTC time (manifest; no header value, no code).
  const seen = (state) => { live.states_observed.push(state); (live.timeline ??= []).push({ state, at: new Date().toISOString() }); };
  // The job id from the POST's answer (it is not a secret), so that a failed job's reason can be read back.
  page.on("response", async (r) => {
    if (r.request().method() === "POST" && r.url().endsWith("/api/live/jobs")) {
      try { const b = await r.json(); live.job_id = typeof b.job_id === "string" ? b.job_id : null; live.post_status = r.status(); } catch { /* not JSON */ }
    }
  });
  await page.locator("#live-pdf").setInputFiles({ name: `${LIVE_SAMPLE}-certificate.pdf`, mimeType: "application/pdf", buffer: pdf });
  await page.locator("#live-csv").setInputFiles({ name: `${LIVE_SAMPLE}-delivery.csv`, mimeType: "text/csv", buffer: csv });
  await page.locator("#live-line").fill(String(sample.delivery_line));
  await page.locator("#live-confirm").check();
  const btn = page.getByRole("button", { name: "Read live", exact: true });
  if (await btn.isDisabled()) fail("Read live is disabled on the site");
  await btn.click();

  const msg = page.locator("#live-msg");
  const deadline = Date.now() + LIVE_TIMEOUT_MS;
  for (;;) {
    if (Date.now() > deadline) fail("live reading did not finish in time");
    if (refusedExtra) fail("a second job POST was attempted and refused");
    if (/^#\/local\//.test(await page.evaluate(() => location.hash))) break;
    const text = (await msg.innerText().catch(() => "")).trim();
    if (/^Queued/.test(text) && !live.states_observed.includes("queued")) {
      seen("queued");
      await shoot(page, "live-queued", width, { locator: page.locator("#live") });
    } else if (/^Reading at AMD/.test(text) && !live.states_observed.includes("reading")) {
      seen("reading");
      await shoot(page, "live-reading", width, { locator: page.locator("#live") });
    } else if (/failed|Refused|No reading was made|could not be read/.test(text)) {
      // A failed reading is recorded, not hidden: the failure screen, then the job's final state and reason class
      // from a read-only poll (no reading is spent). Its fixed reason text carries no provider text (W-02).
      await shoot(page, "live-failed", width, { locator: page.locator("#live") });
      if (live.job_id) {
        const j = await (await page.request.get(`${args.site}/api/live/jobs/${live.job_id}`)).json().catch(() => ({}));
        live.failure = { job_id: live.job_id, state: j.state ?? null, reason_class: j.reason_class ?? null, reason: j.reason ?? null, polled_at: new Date().toISOString() };
      } else {
        live.failure = { job_id: null, state: null, reason_class: null, reason: null, polled_at: new Date().toISOString() };
      }
      seen("failed");
      await page.unroute("**/api/live/jobs");
      console.log(`live reading failed on the site: job ${live.failure.job_id ?? "unknown"} · state ${live.failure.state ?? "unknown"} · reason_class ${live.failure.reason_class ?? "unknown"}`);
      return;
    }
    await page.waitForTimeout(250);
  }
  await page.locator("#proposal").waitFor();
  seen("done");
  await shoot(page, "live-done", width, { fullPage: true });
  // The same done screen at 375 px: the one reading is made once, so the viewport is narrowed on the same page.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await shoot(page, "live-done", 375, { fullPage: true });
  await page.unroute("**/api/live/jobs");
  if (live.job_posts !== 1) fail("expected exactly one job POST");
  for (const s of ["queued", "reading"]) if (!live.states_observed.includes(s)) console.log(`state not observed: ${s}`);
}

await main();
