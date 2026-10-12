// Auditor probe (stage 2), run INSIDE the candidate image with --network none, mounted read-only at /probe.
// Exercises the server-side live-read path against the candidate's own TEST STUB (D2-05, not a model):
// S2-11/S2-12 F1, S2-16/B-02/B-03 limit and atomicity, B-05 no-store, S2-17/B-04 access code, B-06 override
// attempts, S2-25 C11 through HTTP, S2-26 secrets in responses, S2-31/I7 labels, B-13 upload never mock.
// Usage: node /probe/live_probe.mjs [--with-timeout]
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const results = [];
const check = (id, ok, detail) => { results.push({ id, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"} ${id} :: ${detail}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const procs = [];
function start(cmd, args, env) {
  const p = spawn(cmd, args, { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"], cwd: "C:/nexus/dev/certgate-audit-s2c2" });
  let out = ""; p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (out += d));
  procs.push(p); p.logs = () => out; return p;
}
async function up(url) { for (let i = 0; i < 60; i++) { try { const r = await fetch(url); if (r.status < 500) return; } catch {} await sleep(100); } throw new Error("not up " + url); }
const SECRET_KEY = "auditor-fake-key-7f3a9c";
const CODE = "auditor-code-51ab";
const cert = readFileSync("C:/nexus/dev/certgate-audit-s2c2/data/cases/cg-001/certificate.pdf").toString("base64");
const csv = readFileSync("C:/nexus/dev/certgate-audit-s2c2/data/delivery/ALB-2026-0917.csv", "utf8");
const body = (extra = {}) => JSON.stringify({ certificate_base64: cert, delivery_csv: csv, delivery_line: "1", ...extra });
const post = (base, path, b, headers = {}) => fetch(base + path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: b });

async function server(port, env) {
  const s = start("node", ["dist/src/server.js"], { PORT: String(port), CERTGATE_MODE: "mock", ...env });
  await up(`http://127.0.0.1:${port}/health`); return `http://127.0.0.1:${port}`;
}

// --- A. no endpoint configured (S2-12, S2-15, S2-20, B-13, S2-31)
{
  const base = await server(5101, { LIVE_READS_PER_HOUR: "3" });
  const f1a = await (await fetch(base + "/api/f1")).json();
  await sleep(1100);
  const f1b = await (await fetch(base + "/api/f1")).json();
  check("S2-12 off", f1a.state === "off" && !JSON.stringify(f1a).match(/certgate-test-stub|MI300|Instinct/), `state=${f1a.state} detail=${f1a.detail}`);
  check("B-19 last check advances", f1a.checked_at && f1b.checked_at && f1b.checked_at > f1a.checked_at, `${f1a.checked_at} -> ${f1b.checked_at}`);
  const r = await post(base, "/api/live/read", body()); const j = await r.json(); const rc = j.view?.receipt ?? {};
  check("S2-20/B-13 upload no endpoint", r.status === 200 && j.summary?.proposal === "review" && rc.status === "error" && rc.reading_source === "live_no_reading" && !/MOCK|mock-reader/.test(rc.reader?.model_id ?? "") && j.counted === false,
    `http=${r.status} proposal=${j.summary?.proposal} status=${rc.status} reading_source=${rc.reading_source} model_id=${rc.reader?.model_id} counted=${j.counted}`);
  const st = await fetch(base + "/api/live/status"); const sj = await st.json();
  check("S2-15 windows + not consumed", sj.remaining_this_hour === "3" && /no live window/.test(sj.windows_note), `remaining=${sj.remaining_this_hour} windows_note=${sj.windows_note}`);
}

// --- B. stub up, limit 3 (S2-11, S2-16, B-02, B-03, B-05, B-06, S2-26)
{
  start("node", ["test/support/stub-endpoint.mjs", "--port", "8101", "--mode", "ok"], {});
  await up("http://127.0.0.1:8101/v1/models");
  const base = await server(5102, { LIVE_READS_PER_HOUR: "3", MODEL_BASE_URL: "http://127.0.0.1:8101", MODEL_ID: "certgate-test-stub",
    GPU_INFO_URL: "http://127.0.0.1:8101/gpu-info", MODEL_API_KEY: SECRET_KEY });
  const f1 = await (await fetch(base + "/api/f1")).json();
  check("S2-11 F1 shows endpoint values verbatim", f1.state === "on" && JSON.stringify(f1.model_ids) === JSON.stringify(["certgate-test-stub"]) && /TEST STUB/.test(JSON.stringify(f1.gpu)),
    `state=${f1.state} models=${JSON.stringify(f1.model_ids)} gpu=${JSON.stringify(f1.gpu)} rocm=${f1.rocm_version}`);
  check("S2-36 cost unknown without price", f1.cost_estimate_usd === null || /unknown/i.test(String(f1.cost_estimate_usd)), `cost=${JSON.stringify(f1.cost_estimate_usd)}`);
  // B-06: try to override the endpoint through query, header and body
  const o = await post(base, "/api/live/read?model_base_url=http://127.0.0.1:9/&model=evil", body({ model_base_url: "http://127.0.0.1:9/", model_id: "evil-model", endpoint: "http://127.0.0.1:9/" }),
    { "x-model-base-url": "http://127.0.0.1:9/", "x-model-id": "evil-model" });
  const oj = await o.json(); const orc = oj.view?.receipt ?? {};
  check("B-06 override ignored", o.status === 200 && orc.reader?.model_id === "certgate-test-stub" && !JSON.stringify(oj).includes("evil-model"),
    `http=${o.status} model_id=${orc.reader?.model_id} reading_source=${orc.reading_source} proposal=${oj.summary?.proposal}`);
  check("I7 stub reading labelled as stub", orc.reading_source === "live" && orc.reader?.model_id === "certgate-test-stub" && !/AMD|Instinct|MI300/.test(JSON.stringify(orc.reader)),
    `reading_source=${orc.reading_source} reader=${JSON.stringify(orc.reader)}`);
  check("B-05 no-store on live read", o.headers.get("cache-control") === "no-store", `cache-control=${o.headers.get("cache-control")}`);
  const stH = await fetch(base + "/api/live/status");
  check("B-05 no-store on status", stH.headers.get("cache-control") === "no-store", `cache-control=${stH.headers.get("cache-control")}`);
  // 1 used by the override probe; 2 remain. Fire 8 in parallel: exactly 2 accepted.
  const par = await Promise.all(Array.from({ length: 8 }, () => post(base, "/api/live/read", body()).then(async (r) => ({ s: r.status, j: await r.json() }))));
  const okN = par.filter((x) => x.s === 200 && x.j.counted === true).length, rej = par.filter((x) => x.s === 429);
  const reopen = rej[0]?.j?.reopens_at; const now = new Date(); const next = new Date(now); next.setUTCMinutes(0, 0, 0); next.setUTCHours(next.getUTCHours() + 1);
  check("B-02 atomic: exactly remaining accepted", okN === 2 && rej.length === 6, `accepted=${okN} rejected429=${rej.length} statuses=${par.map((x) => x.s).join(",")}`);
  check("S2-16 reopens at next UTC hour", reopen === next.toISOString(), `reopens_at=${reopen} expected=${next.toISOString()}`);
  const st2 = await (await fetch(base + "/api/live/status")).json();
  check("S2-16 status exhausted", st2.remaining_this_hour === "0" && st2.reason === "limit reached this hour", `remaining=${st2.remaining_this_hour} reason=${st2.reason}`);
  // client-side bypass attempts: headers, cookies, query that might reset counters
  const by = await post(base, "/api/live/read?remaining=99&reset=1", body({ remaining_this_hour: "99", limit_per_hour: "99" }),
    { cookie: "remaining=99; live_reads=0", "x-forwarded-for": "10.9.9.9", "x-live-remaining": "99" });
  check("S2-19 bypass attempts rejected", by.status === 429, `http=${by.status}`);
  const all = JSON.stringify(par.map((x) => x.j)) + JSON.stringify(oj) + JSON.stringify(f1) + JSON.stringify(st2);
  check("S2-26 no key or code in responses", !all.includes(SECRET_KEY), `key-present=${all.includes(SECRET_KEY)}`);
}

// --- C. access code (S2-17, B-04)
{
  start("node", ["test/support/stub-endpoint.mjs", "--port", "8102", "--mode", "ok"], {});
  await up("http://127.0.0.1:8102/v1/models");
  const base = await server(5103, { LIVE_READS_PER_HOUR: "2", MODEL_BASE_URL: "http://127.0.0.1:8102", MODEL_ID: "certgate-test-stub",
    GPU_INFO_URL: "http://127.0.0.1:8102/gpu-info", LIVE_ACCESS_CODE: CODE, LIVE_CODE_FAILURES_PER_HOUR: "3" });
  const w = await post(base, "/api/live/read", body({ access_code: "wrong" })); const wj = await w.json();
  const st = await (await fetch(base + "/api/live/status")).json();
  check("S2-17 wrong code rejected, not consumed", w.status === 403 && st.remaining_this_hour === "2" && st.access_code_required === true, `http=${w.status} remaining=${st.remaining_this_hour}`);
  check("S2-17 code never echoed", !JSON.stringify(wj).includes(CODE) && !JSON.stringify(st).includes(CODE), "searched responses for the code");
  const m = await post(base, "/api/live/read", body()); check("S2-17 missing code rejected", m.status === 403, `http=${m.status}`);
  const t = await post(base, "/api/live/read", body({ access_code: "wrong2" })); const t2 = await post(base, "/api/live/read", body({ access_code: "wrong3" }));
  check("B-04 throttle after repeated failures", t2.status === 429, `statuses=${w.status},${m.status},${t.status},${t2.status}`);
  const g = await post(base, "/api/live/read", body({ access_code: CODE }));
  check("S2-17 correct code accepted", g.status === 200 && (await g.json()).counted === true, `http=${g.status}`);
}

// --- D. C11 through HTTP (S2-25, B-22)
const modes = process.argv.includes("--with-timeout") ? ["http_429", "http_5xx", "invalid_json", "huge", "timeout"] : ["http_429", "http_5xx", "invalid_json", "huge"];
let port = 8110, sport = 5110;
for (const mode of modes) {
  start("node", ["test/support/stub-endpoint.mjs", "--port", String(port), "--mode", mode], {});
  await up(`http://127.0.0.1:${port}/v1/models`);
  const base = await server(sport, { LIVE_READS_PER_HOUR: "5", MODEL_BASE_URL: `http://127.0.0.1:${port}`, MODEL_ID: "certgate-test-stub", GPU_INFO_URL: `http://127.0.0.1:${port}/gpu-info` });
  const t0 = Date.now();
  const r = await post(base, "/api/live/read", body()); const j = await r.json(); const rc = j.view?.receipt ?? {};
  check(`S2-25 C11 ${mode}`, r.status === 200 && rc.status === "error" && j.summary?.proposal === "review" && rc.reading_source === "live_no_reading",
    `http=${r.status} status=${rc.status} proposal=${j.summary?.proposal} errors=${JSON.stringify((rc.errors ?? []).map((e) => e.class))} calls=${rc.reader?.calls} reading_source=${rc.reading_source} ms=${Date.now() - t0}`);
  port++; sport++;
}

for (const p of procs) p.kill();
const fails = results.filter((r) => !r.ok).length;
console.log(`SUMMARY ${results.length - fails}/${results.length} PASS`);
process.exit(fails ? 1 : 0);

