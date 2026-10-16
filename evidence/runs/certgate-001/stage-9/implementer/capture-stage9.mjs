// Stage 9 screenshots of the Stage 8 screens on the deployed site (dispatch 7; register R9.0 S9-01, S9-02, S9-05;
// A9-01…A9-05). It runs AFTER tools/capture-screenshots.mjs (re-run unchanged, A9-01) and merges its images into the
// manifest that tool writes.
//
// Pinned browser automation, as in Stage 7: playwright 1.56.1 with its Chromium build 1194, run through npx so nothing
// is added to package.json or package-lock.json:
//
//   npx -y -p playwright@1.56.1 node evidence/runs/certgate-001/stage-9/implementer/capture-stage9.mjs \
//       --commit <site commit> --model Gemma-4-31B-IT|Qwen3.8-27B
//
// It captures, with the site's own page: the model choice (#live-models) at 1280 and 375 px, then ONE real live
// reading of the sample cg-004 with the chosen MEASURED model (exactly one POST /api/live/jobs), queued, reading and
// done, the proposal with its model line, and the receipt (model requested, model as reported, the F1 copy). A failed
// reading is captured and labelled failed, and the run stops: there is no retry and nothing stored is shown instead.
//
// Secrets, as in the Stage 7 tool (CH7-01, CH7-02, CH7-11; this file copies its safeguards, because that tool cannot
// be imported: it starts a capture when loaded). The access code is read from the Windows user-level environment
// variable LIVE_ACCESS_CODE (falling back to process.env), never printed and never typed into the page: the visible
// access-code input stays empty and the code is added as the x-live-access-code request header of the one job POST
// only, by page.route interception. Before every screenshot the access-code input must be empty and the page's
// document.body.innerText must contain neither the code nor MODEL_API_KEY nor the path part of MODEL_BASE_URL; a hit
// aborts the run without printing the value. No Playwright tracing, no HAR archive, no video recording and no
// console capture are used. The script prints screen names, file names, states and hashes only.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
const OUT_DIR = path.join(ROOT, "docs", "screenshots");
const EVIDENCE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLAYWRIGHT_VERSION = "1.56.1";
const DEFAULT_SITE = "https://certgate-wheat.vercel.app";
const SERVED_FILES = ["/index.html", "/app.js", "/styles.css", "/labels.js", "/figures.json", "/stories/index.json"];
/** CH9-05: every file under public/ at the deployed commit, fetched and hashed before and after this run. */
const PUBLIC_FILES = ["/app.js", "/figures.json", "/index.html", "/labels.js", "/stories/cg-001.json", "/stories/cg-001.recording.json", "/stories/cg-002.json", "/stories/cg-002.recording.json", "/stories/cg-003.json", "/stories/cg-003.recording.json", "/stories/index.json", "/styles.css"];
const MEASURED = ["Gemma-4-31B-IT", "Qwen3.8-27B"];
const LIVE_SAMPLE = "cg-004";
const CODE_HEADER = "x-live-access-code";
const CODE_INPUT = "#live-code";
const LIVE_TIMEOUT_MS = 10 * 60 * 1000;
const SECRET_CHECK_NOTE = "visible-field rule: innerText scanned for the access code and the key; code input empty";

class CaptureError extends Error {}
const fail = (msg) => { throw new CaptureError(msg); };

function parseArgs(argv) {
  const out = { site: DEFAULT_SITE, commit: null, model: null, fallback: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--site" && argv[i + 1]) out.site = argv[++i];
    else if (a === "--commit" && argv[i + 1]) out.commit = argv[++i];
    else if (a === "--model" && argv[i + 1]) out.model = argv[++i];
    // CH9-03, A9-03: a Qwen run after Gemma was unlisted or failed names that in every caption,
    // e.g. --fallback "Gemma-4-31B-IT unlisted" or --fallback "Gemma-4-31B-IT failed: endpoint_5xx".
    else if (a === "--fallback" && argv[i + 1]) out.fallback = argv[++i];
    else fail(`unknown or incomplete argument: ${a}`);
  }
  if (out.fallback !== null && !/^Gemma-4-31B-IT (unlisted|failed: [a-z0-9_]+)$/.test(out.fallback)) fail("--fallback must be \"Gemma-4-31B-IT unlisted\" or \"Gemma-4-31B-IT failed: <reason_class>\"");
  if (out.fallback !== null && out.model !== "Qwen3.8-27B") fail("--fallback is only for the declared Qwen3.8-27B fallback");
  let u;
  try { u = new URL(out.site); } catch { fail("--site is not a URL"); }
  if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") fail("--site must be https (or localhost)");
  out.site = u.origin;
  if (out.commit === null || !/^[0-9a-f]{7,40}$/i.test(out.commit)) fail("--commit must be a hex commit SHA");
  if (!MEASURED.includes(out.model)) fail(`--model must be one of ${MEASURED.join(", ")} (a measured model)`);
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
  try { version = req("playwright/package.json").version; } catch { /* checked below */ }
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
  try { const p = new URL(url).pathname.replace(/\/+$/, ""); return p.length > 1 ? p : ""; } catch { return ""; }
}
function redact(text, secrets) {
  let s = String(text);
  for (const v of secrets) if (v) s = s.split(v).join("[redacted]");
  return s;
}

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

/** Returns the visible-field record of this screen (CH9-02); the code is never typed, so the input must be empty. */
const fetchedAt = {};
async function publicHashes(site, label) {
  const out = {};
  for (const f of PUBLIC_FILES) {
    const r = await fetch(site + f, { cache: "no-store" });
    if (!r.ok) fail(`public file ${f} answered ${r.status}`);
    out[f] = sha256(Buffer.from(await r.arrayBuffer()));
    (fetchedAt[label] ??= {})[f] = new Date().toISOString();
  }
  return out;
}

async function guard(page, screen, secrets) {
  const values = await page.evaluate((sel) => [...document.querySelectorAll(`${sel}, input[type=password]`)].map((el) => el.value), CODE_INPUT);
  for (const value of values) if (!(value === "")) fail(`access-code input not empty on ${screen}`);
  const text = await page.evaluate(() => document.body.innerText);
  for (const v of secrets) if (v && text.includes(v)) fail(`secret check failed on ${screen}`);
  return { code_input_present: values.length > 0, code_input_empty: values.every((v) => v === ""), secret_hits: 0 };
}

/** The strict identity rule of the product (src/web/models.ts sameModel, L-C1), restated for the capture check. */
function sameModel(id, other) {
  const a = id.toLowerCase(); const b = String(other ?? "").toLowerCase();
  if (a === b) return true;
  const i = b.indexOf("/");
  return i > 0 && i === b.lastIndexOf("/") && b.slice(i + 1) === a;
}

// ---------------------------------------------------------------- capture
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const accessCode = userEnv("LIVE_ACCESS_CODE");
  const modelKey = userEnv("MODEL_API_KEY");
  const modelBasePath = basePathOf(userEnv("MODEL_BASE_URL"));
  const secrets = [accessCode, modelKey, modelBasePath].filter(Boolean);
  try { await capture(args, accessCode, secrets); } catch (e) {
    const msg = e instanceof CaptureError ? e.message : `capture failed: ${redact(e && e.message ? e.message.split("\n")[0] : e, secrets)}`;
    console.error(msg);
    process.exitCode = 1;
  }
}

async function capture(args, accessCode, secrets) {
  const { pw, version } = await loadPlaywright();
  if (version !== PLAYWRIGHT_VERSION) fail(`playwright ${version ?? "unknown"} found; ${PLAYWRIGHT_VERSION} is pinned`);
  const manifestPath = path.join(OUT_DIR, "manifest.json");
  if (!existsSync(manifestPath)) fail("run tools/capture-screenshots.mjs first: its manifest.json is merged here");
  const base = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (base.site !== args.site || base.site_commit !== args.commit) fail("the tool's manifest names another site or commit");

  const startedAt = new Date().toISOString();
  const short = args.commit.slice(0, 7);
  const served = await servedHashes(args.site);
  for (const f of SERVED_FILES) if (served[f] !== base.served_files_sha256[f]) fail(`served file ${f} differs from the tool run's`);
  const publicBefore = await publicHashes(args.site, "before");
  for (const f of SERVED_FILES) if (publicBefore[f] !== served[f]) fail(`public file ${f} differs between the two reads`);
  for (const [f, h] of Object.entries(served)) console.log(`${h}  served ${f}`);

  const images = [];
  let aborted = null;
  const live = { requested: true, sample: LIVE_SAMPLE, width: 1280, model_requested: args.model, job_posts: 0, states_observed: [], timeline: [] };
  const browser = await pw.chromium.launch({ headless: true });
  try {
    const note = args.fallback ? ` · fallback: ${args.fallback}` : "";
    const shoot = async (page, screen, width, opts) => {
      const visible = await guard(page, screen, secrets);
      const file = `${screen}-${width}.png`;
      const target = path.join(OUT_DIR, file);
      const at = new Date().toISOString();
      if (opts && opts.locator) await opts.locator.screenshot({ path: target, animations: "disabled" });
      else await page.screenshot({ path: target, animations: "disabled", fullPage: !!(opts && opts.fullPage) });
      const hash = sha256(readFileSync(target));
      const state = opts && opts.state ? ` · ${opts.state}` : "";
      images.push({ file, screen, width, sha256: hash, captured_at: at, url: page.url(), visible_field: visible, caption: `${screen}${state} · model ${args.model}${note} · site commit ${short} · captured ${at}` });
      console.log(`${hash}  ${file}`);
    };

    // The model choice, at both widths (nothing is sent).
    for (const vp of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
      const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
      const page = await context.newPage();
      await page.goto(`${args.site}/#/`, { waitUntil: "networkidle" });
      await page.locator("#live-models").waitFor();
      const groups = await page.locator("#live-models").innerText();
      for (const g of ["MEASURED", "NOT EVALUATED · EXPERIMENTAL", "LISTED, NOT OFFERED"]) if (!groups.includes(g)) fail(`#live-models lacks the group ${g}`);
      if (!/checked \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(groups)) fail("#live-models shows no probe time");
      await page.locator("#live-models").scrollIntoViewIfNeeded();
      await shoot(page, "live-models", vp.width, { locator: page.locator("#live-models") });
      if (vp.width === 1280) {
        try {
          await liveReading(page, args, accessCode, live, shoot);
        } catch (e) {
          // W-04: an attempt that failed a check after its job POST keeps its record: the current screen, the job's
          // own record (one read-only GET) and its outcome are written before the run exits non-zero.
          aborted = e;
          if (live.job_posts > 0 && !live.failure) {
            const j = live.job_id ? await (await page.request.get(`${args.site}/api/live/jobs/${live.job_id}`)).json().catch(() => ({})) : {};
            live.job_record = j;
            live.failure = { job_id: live.job_id ?? null, state: j.state ?? null, reason_class: j.reason_class ?? "capture_check_failed", reason: j.reason ?? null, check: e instanceof CaptureError ? e.message : "capture error", polled_at: new Date().toISOString() };
            await page.unroute("**/api/live/jobs").catch(() => undefined);
            await shoot(page, "live-mismatch", 1280, { fullPage: true, state: `failed (${live.failure.reason_class})` }).catch(() => undefined);
          }
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const after = await servedHashes(args.site);
  for (const f of SERVED_FILES) if (after[f] !== served[f]) fail(`served file ${f} changed during the capture`);
  const publicAfter = await publicHashes(args.site, "after");
  for (const f of PUBLIC_FILES) if (publicAfter[f] !== publicBefore[f]) fail(`public file ${f} changed during the capture`);
  const finishedAt = new Date().toISOString();

  const manifest = {
    ...base,
    // V-05: all 12 files under public/ at the deployed commit, as fetched in this window (the tool hashes 6 of them;
    // those 6 must agree, checked above).
    served_files_sha256: { ...base.served_files_sha256, ...publicBefore },
    served_files_fetched_at: fetchedAt.before,
    runs: [
      { script: "tools/capture-screenshots.mjs (unchanged)", captured_at: base.captured_at, served_files_sha256: base.served_files_sha256 },
      { script: "evidence/runs/certgate-001/stage-9/implementer/capture-stage9.mjs", started_at: startedAt, finished_at: finishedAt, served_files_sha256_before: served, served_files_sha256_after: after, public_files_sha256_before: publicBefore, public_files_sha256_after: publicAfter, public_files_fetched_at: fetchedAt },
    ],
    secret_check: SECRET_CHECK_NOTE,
    live: { sample: live.sample, width: live.width, model_requested: live.model_requested, model_reported: live.model_reported ?? null, evaluated: live.evaluated ?? null, listing_checked_at: live.listing_checked_at ?? null, job_posts: live.job_posts, job_id: live.job_id ?? null, post_status: live.post_status ?? null, states_observed: live.states_observed, timeline: live.timeline, outcome: live.failure ? "failed" : live.states_observed.includes("done") ? "done" : live.unlisted ? "not run: model not listed" : "not run", failure: live.failure ?? null },
    images: [...base.images.filter((i) => !images.some((n) => n.file === i.file)), ...images],
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  // CH9-04: each reading attempt keeps its own record: the run, its images, and the job's own record with its receipt
  // as the API returned it (it carries no access code, key or provider text, W-02).
  writeFileSync(path.join(EVIDENCE_DIR, `capture-${args.model}.json`), JSON.stringify({ started_at: startedAt, finished_at: finishedAt, fallback: args.fallback, live: manifest.live, status_models: live.status_models ?? null, job_record: live.job_record ?? null, images }, null, 2) + "\n");
  console.log(`${sha256(readFileSync(manifestPath))}  manifest.json`);
  console.log(`live reading: ${manifest.live.outcome}`);
  if (aborted) throw aborted;
}

/** One real reading of cg-004 with the chosen measured model: exactly one job POST. */
async function liveReading(page, args, accessCode, live, shoot) {
  const status = await (await page.request.get(`${args.site}/api/live/status`)).json();
  if (!status || !status.enabled || !status.job_api) fail("live reading is not enabled on the site");
  if (status.access_code_required && !accessCode) fail("the site needs the access code and LIVE_ACCESS_CODE is not set");
  // W-05: the model block of the status (no code in it) is kept, so an "unlisted" fallback has its evidence beside the
  // live-models-1280 image taken just before.
  live.status_models = status.models ?? null;
  const radio = page.locator(`input[name=live-model][value="${args.model}"]`);
  if ((await radio.count()) === 0 || (await radio.isDisabled())) {
    live.unlisted = true;
    console.log(`model ${args.model} is not selectable on the site now (not listed); no reading is made`);
    return;
  }
  const list = await (await page.request.get(`${args.site}/api/samples`)).json();
  const sample = (list.samples || []).find((s) => s.id === LIVE_SAMPLE);
  if (!sample) fail(`sample ${LIVE_SAMPLE} is not offered`);
  const pdf = await (await page.request.get(args.site + sample.certificate)).body();
  if (sha256(pdf) !== sample.certificate_sha256) fail(`sample ${LIVE_SAMPLE} certificate hash differs from /api/samples`);
  const csv = await (await page.request.get(args.site + sample.delivery_note)).body();

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
  const seen = (state) => { live.states_observed.push(state); live.timeline.push({ state, at: new Date().toISOString() }); };
  page.on("response", async (r) => {
    if (r.request().method() === "POST" && r.url().endsWith("/api/live/jobs")) {
      try { const b = await r.json(); live.job_id = typeof b.job_id === "string" ? b.job_id : null; live.post_status = r.status(); } catch { /* not JSON */ }
    }
  });
  await radio.check();
  await page.locator("#live-pdf").setInputFiles({ name: `${LIVE_SAMPLE}-certificate.pdf`, mimeType: "application/pdf", buffer: pdf });
  await page.locator("#live-csv").setInputFiles({ name: `${LIVE_SAMPLE}-delivery.csv`, mimeType: "text/csv", buffer: csv });
  await page.locator("#live-line").fill(String(sample.delivery_line));
  await page.locator("#live-confirm").check();
  const btn = page.getByRole("button", { name: "Read live", exact: true });
  if (await btn.isDisabled()) fail("Read live is disabled on the site");
  seen("posted");
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
      await shoot(page, "live-queued", 1280, { locator: page.locator("#live"), state: "queued" });
    } else if (/^Reading at AMD/.test(text) && !live.states_observed.includes("reading")) {
      seen("reading");
      await shoot(page, "live-reading", 1280, { locator: page.locator("#live"), state: "reading" });
    } else if (/failed|Refused|No reading was made|could not be read/.test(text)) {
      // CH9-03: the caption is made from the job's own final record, read first (read-only; no model call).
      const j = live.job_id ? await (await page.request.get(`${args.site}/api/live/jobs/${live.job_id}`)).json().catch(() => ({})) : {};
      live.failure = { job_id: live.job_id ?? null, state: j.state ?? null, reason_class: j.reason_class ?? null, reason: j.reason ?? null, polled_at: new Date().toISOString() };
      live.job_record = j;
      await shoot(page, "live-failed", 1280, { locator: page.locator("#live"), state: `failed (${live.failure.reason_class ?? "unknown"})` });
      seen("failed");
      await page.unroute("**/api/live/jobs");
      console.log(`live reading failed: job ${live.failure.job_id ?? "unknown"} · state ${live.failure.state ?? "unknown"} · reason_class ${live.failure.reason_class ?? "unknown"}`);
      return;
    }
    await page.waitForTimeout(250);
  }
  await page.locator("#proposal").waitFor();
  seen("done");
  const line = (await page.locator("#model-choice").innerText().catch(() => "")).trim();
  if (!line.startsWith(`Read by ${args.model}, a measured model (reported as `)) fail("the proposal has no model line for the chosen measured model");
  // The job's own record, read back once (read-only; no model call), before the done captions are written.
  const j = await (await page.request.get(`${args.site}/api/live/jobs/${live.job_id}`)).json();
  live.job_record = j;
  live.model_reported = j.model_reported ?? null;
  live.evaluated = j.evaluated ?? null;
  live.listing_checked_at = j.listing_checked_at ?? null;
  const rc = j.result && j.result.view && j.result.view.receipt;
  if (j.state !== "done" || j.model_requested !== args.model || !sameModel(args.model, j.model_reported) || j.evaluated !== true) fail("the job record does not show a done reading of the chosen measured model");
  if (!rc || rc.reading_source !== "live" || !rc.model_choice || rc.model_choice.requested !== args.model || rc.model_choice.evaluated !== true) fail("the job's receipt is not a live reading of the chosen measured model");
  await shoot(page, "live-done", 1280, { fullPage: true, state: "done" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await shoot(page, "live-done", 375, { fullPage: true, state: "done" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(300);

  // The receipt, opened with the page's own link.
  await page.getByRole("link", { name: "Open the receipt" }).click();
  await page.locator("#receipt-model-requested").waitFor();
  const requested = (await page.locator("#receipt-model-requested").innerText()).trim();
  const reported = (await page.locator("#receipt-model-reported").innerText()).trim();
  if (requested !== args.model || !sameModel(args.model, reported)) fail("the receipt does not show the requested and the reported model");
  await shoot(page, "live-receipt", 1280, { fullPage: true, state: "done" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await shoot(page, "live-receipt", 375, { fullPage: true, state: "done" });
  await page.unroute("**/api/live/jobs");
  if (live.job_posts !== 1) fail("expected exactly one job POST");
}

await main();
