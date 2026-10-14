// Stage 6: live reading on the deployed site as an asynchronous job API over a shared store (R6.0 S6-01…S6-11;
// R6.1 CH6-01…CH6-19; R6.2 T6-01…T6-10; R6.3 J-01…J-20). Offline: the endpoint is the local test stub, the shared
// store is a MemoryStore (also shared by two handler instances) or a fake Upstash REST server on 127.0.0.1.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import type { AppDeps } from "../src/web/app.js";
import { SAMPLE_IDS } from "../src/web/app.js";
import { clearF1Cache } from "../src/web/f1.js";
import { KEYS, REASONS } from "../src/web/live-jobs.js";
import { CONTAINER_LIVE_BUDGET, DEPLOYED_LIVE_BUDGET, DEPLOYED_LIVE_UNAVAILABLE } from "../src/web/limits.js";
import { COUNT_ATTEMPT_SCRIPT, DEL_IF_EQUALS_SCRIPT, MemoryStore, UpstashRestStore, type LiveStore } from "../src/web/live-store.js";
import { DATA, ROOT } from "./helpers.js";
// @ts-expect-error plain JS test double
import { startStub, STUB_MODEL_ID } from "./support/stub-endpoint.mjs";
// @ts-expect-error plain JS test double
import { startFakeUpstash, VERIFIED_COUNT_ATTEMPT_SCRIPT, VERIFIED_DEL_IF_EQUALS_SCRIPT } from "./support/fake-upstash.mjs";
// @ts-expect-error plain JS helper
import { record } from "./support/disabled-golden.mjs";

const CODE = "sentinel-access-code-7f3a19";
const KEY = "sentinel-model-key-91bd44";
const STORE_TOKEN = "sentinel-store-token-c0de55";
// Generous for a cold start (the first PDF check loads pdf.js); tests of timeouts set their own budgets.
const FAST = { pollMs: 20, queueMaxWaitMs: 20_000, readBudgetMs: 20_000, deadlineMs: 40_000, staleGraceMs: 10_000, leaseTtlMs: 45_000, marginMs: 0 };

type Closable = { close: () => Promise<void> };
const open: Closable[] = [];
beforeEach(() => clearF1Cache());
afterEach(async () => { while (open.length) await open.pop()!.close(); });

async function serve(deps: AppDeps) {
  const server = createApp(deps).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  open.push({ close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
async function stub(opts: Record<string, unknown> = {}) {
  const s = await startStub(opts);
  open.push(s);
  return s;
}
const cert = (id: string) => readFileSync(path.join(DATA, "cases", id, "certificate.pdf"));
function deployedEnv(stubUrl: string, extra: Record<string, string> = {}) {
  return { VERCEL: "1", MODEL_BASE_URL: stubUrl, MODEL_API_KEY: KEY, MODEL_ID: STUB_MODEL_ID, LIVE_READS_PER_HOUR: "10", LIVE_ACCESS_CODE: CODE, ...extra };
}
/** Every response body and header is kept for the leak scan (CH6-14). */
const seen: string[] = [];
async function call(url: string, init: RequestInit = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  seen.push(text, JSON.stringify([...res.headers.entries()]));
  let body: Record<string, unknown> = {};
  try { body = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, body, text, headers: res.headers };
}
function startJob(base: string, opts: { code?: string | null; id?: string; client?: string; query?: string } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.code !== null) headers["x-live-access-code"] = opts.code ?? CODE;
  if (opts.client) headers["x-forwarded-for"] = opts.client;
  return call(`${base}/api/live/jobs${opts.query ?? ""}`, { method: "POST", headers, body: JSON.stringify({ certificate_base64: cert(opts.id ?? "cg-004").toString("base64"), synthetic_confirmed: true }) });
}
async function poll(base: string, id: string, until: (s: string) => boolean, ms = 30_000) {
  const t0 = Date.now();
  for (;;) {
    const r = await call(`${base}/api/live/jobs/${id}`);
    if (until(String(r.body.state)) || Date.now() - t0 > ms) return r;
    await new Promise((x) => setTimeout(x, 15));
  }
}

describe("job state machine on both store implementations (S6-02, CH6-17, J-11)", () => {
  for (const kind of ["memory", "upstash-rest"] as const) {
    it(`${kind}: queued -> reading -> done, with this job's own live reading, its F1 snapshot and the model as reported`, async () => {
      const s = await stub();
      let store: LiveStore = new MemoryStore();
      if (kind === "upstash-rest") {
        const f = await startFakeUpstash({ token: STORE_TOKEN });
        open.push(f);
        store = new UpstashRestStore(f.url, STORE_TOKEN);
      }
      const base = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
      const st = await call(`${base}/api/live/status`);
      expect(st.body).toMatchObject({ enabled: true, deployed_site: true, job_api: "/api/live/jobs", access_code_header: "x-live-access-code", model_requested: STUB_MODEL_ID });
      expect(st.body.scope_note).toBe("global: counted in the shared store across all instances");
      const r = await startJob(base);
      expect(r.status).toBe(202);
      expect(r.body.state).toBe("queued");
      expect(String(r.body.job_id)).toMatch(/^[0-9a-f]{32}$/);
      const done = await poll(base, String(r.body.job_id), (x) => x === "done" || x === "failed");
      expect(done.body.state, `job ended as ${String(done.body.state)} (${String(done.body.reason_class)})`).toBe("done");
      expect(done.body.position).toBeUndefined(); // the position belongs to a queued job's poll only
      const result = done.body.result as { job_id: string; started_at: string; finished_at: string; view: { receipt: Record<string, any> } };
      expect(result.job_id).toBe(r.body.job_id);
      expect(result.started_at).toBeTruthy();
      expect(result.finished_at).toBeTruthy();
      const rc = result.view.receipt;
      expect(rc.reading_source).toBe("live");
      expect(rc.reader.model_id).toBe(STUB_MODEL_ID);
      expect(rc.reader.requested_model_id).toBe(STUB_MODEL_ID);
      expect(rc.endpoint_response.response_id).toMatch(/^stub-\d+$/);
      expect(rc.f1.state).toBe("on");
      expect(s.state.chatCalls).toBe(1);
      const after = await call(`${base}/api/live/status`);
      expect(after.body.used_this_hour).toBe("1");
      expect(after.body.in_flight).toBe("0");
    });
  }
  it("the container runs the same states with its in-process store, no store variables (S6-05, T6-09)", async () => {
    const s = await stub();
    const base = await serve({ env: { MODEL_BASE_URL: s.url, MODEL_ID: STUB_MODEL_ID, MODEL_API_KEY: KEY, LIVE_READS_PER_HOUR: "3" }, liveBudget: FAST });
    const st = await call(`${base}/api/live/status`);
    expect(st.body.scope_note).toBe("global for this server process: counted in the in-process store");
    const r = await startJob(base, { code: null });
    expect(r.status).toBe(202);
    const done = await poll(base, String(r.body.job_id), (x) => x === "done" || x === "failed");
    expect(done.body.state).toBe("done");
    expect((await call(`${base}/api/live/status`)).body.remaining_this_hour).toBe("2");
  });
});

describe("global limits across two instances sharing one store (S6-03, CH6-05, CH6-06, T6-05)", () => {
  it("4 jobs from 2 instances: at most 2 reading at any time, the others queued with positions; a 5th waiting job is refused as busy", async () => {
    const s = await stub({ delayMs: 1_500 });
    const store = new MemoryStore();
    store.delayMs = 2;
    const a = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
    const b = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
    // Two jobs take the two slots; two more wait behind them; a fifth would be a third waiting job: busy.
    const first = await Promise.all([startJob(a), startJob(b)]);
    for (const [k, r] of first.entries()) expect((await poll(k ? b : a, String(r.body.job_id), (x) => x !== "queued")).body.state).toBe("reading");
    const second = await Promise.all([startJob(a), startJob(b)]);
    const started = [...first, ...second];
    expect(started.map((x) => x.status)).toEqual([202, 202, 202, 202]);
    const busy = await startJob(a);
    expect(busy.status).toBe(429);
    expect(busy.body).toMatchObject({ reason_class: "busy", error: REASONS.busy });
    const ids = started.map((x) => String(x.body.job_id));
    let maxReading = 0;
    let sawQueuedPosition = false;
    // F6-02: bounded by time (45 s), not by an iteration count, so a loaded full suite cannot end the watch early.
    const trace: string[] = [];
    const deadline = Date.now() + 45_000;
    let settled = false;
    while (Date.now() < deadline) {
      const views = await Promise.all(ids.map((id, k) => call(`${k % 2 ? b : a}/api/live/jobs/${id}`)));
      const states = views.map((v) => (v.body.state === "queued" ? `queued@${v.body.position}` : String(v.body.state)));
      if (trace[trace.length - 1] !== states.join(",")) trace.push(states.join(","));
      maxReading = Math.max(maxReading, states.filter((x) => x === "reading").length);
      if (views.some((v) => v.body.state === "queued" && Number(v.body.position) >= 1)) sawQueuedPosition = true;
      if (states.every((x) => x === "done" || x === "failed")) { settled = true; break; }
      await new Promise((x) => setTimeout(x, 10));
    }
    const seen = `state changes seen: ${trace.join(" | ")}`;
    expect(settled, `all 4 jobs settled within 45 s; ${seen}`).toBe(true);
    expect(maxReading, `at most 2 reading at once; ${seen}`).toBeLessThanOrEqual(2);
    expect(maxReading, `both slots used at once; ${seen}`).toBe(2);
    expect(sawQueuedPosition, `a job was seen queued with a position >= 1; ${seen}`).toBe(true);
    expect(s.state.maxInFlight, `endpoint calls in flight at most 2; ${seen}`).toBeLessThanOrEqual(2);
    const views = await Promise.all(ids.map((id) => call(`${a}/api/live/jobs/${id}`)));
    expect(views.map((v) => v.body.state), seen).toEqual(["done", "done", "done", "done"]);
  });
  it("the hourly limit is counted once per job, across instances: the 4th job of a limit of 3 is refused on the other instance", async () => {
    const s = await stub();
    const store = new MemoryStore();
    const a = await serve({ env: deployedEnv(s.url, { LIVE_READS_PER_HOUR: "3" }), liveStore: store, liveBudget: FAST });
    const b = await serve({ env: deployedEnv(s.url, { LIVE_READS_PER_HOUR: "3" }), liveStore: store, liveBudget: FAST });
    for (const base of [a, b]) {
      const r = await startJob(base);
      expect(r.status).toBe(202);
      await poll(base, String(r.body.job_id), (x) => x === "done" || x === "failed");
    }
    expect((await startJob(a)).status).toBe(202);
    const refused = await startJob(b);
    expect(refused.status).toBe(429);
    expect(refused.body.error).toBe("live readings exhausted this hour");
    const st = await call(`${b}/api/live/status`);
    expect(st.body).toMatchObject({ used_this_hour: "4", remaining_this_hour: "0" });
  });
  it("a job that waits too long fails as timed out in queue and keeps its hourly unit; the 2 slots are leases with a token", async () => {
    const s = await stub({ mode: "timeout" });
    const store = new MemoryStore();
    // The queue wait is measured from the request's arrival (J-14), which includes the PDF check at admission.
    const budget = { ...FAST, queueMaxWaitMs: 1_500, deadlineMs: 6_000, readBudgetMs: 4_500, leaseTtlMs: 9_000 };
    const base = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: budget, adapterTimeoutMs: 5_000 });
    const jobs = await Promise.all([startJob(base), startJob(base), startJob(base)]);
    const third = await poll(base, String(jobs[2]!.body.job_id), (x) => x === "failed" || x === "done", 5_000);
    expect(third.body).toMatchObject({ state: "failed", reason_class: "queue_timeout", reason: REASONS.queue_timeout, result: null });
    expect((await call(`${base}/api/live/status`)).body.used_this_hour).toBe("3");
    const firstTwo = await Promise.all(jobs.slice(0, 2).map((j) => call(`${base}/api/live/jobs/${j.body.job_id}`)));
    expect(firstTwo.map((v) => v.body.state)).toEqual(["reading", "reading"]);
    const holders = await Promise.all([store.get(KEYS.slot(0)), store.get(KEYS.slot(1))]);
    expect(holders.sort()).toEqual([jobs[0]!.body.job_id, jobs[1]!.body.job_id].sort());
  });
});

describe("access code on the deployed site (S6-01, CH6-01, J-01, J-02, J-12)", () => {
  it("count first: 12 parallel wrong codes from one client against a slow store give exactly the limit of 403s, the rest 429; then even the right code is 429", async () => {
    const s = await stub();
    const store = new MemoryStore();
    store.delayMs = 5;
    const base = await serve({ env: deployedEnv(s.url, { LIVE_CODE_FAILURES_PER_HOUR: "5" }), liveStore: store, liveBudget: FAST });
    const rs = await Promise.all(Array.from({ length: 12 }, () => startJob(base, { code: "wrong" })));
    expect(rs.filter((r) => r.status === 403).length).toBe(5);
    expect(rs.filter((r) => r.status === 429).length).toBe(7);
    expect((await startJob(base)).status).toBe(429);
    expect(s.state.chatCalls).toBe(0);
  });
  it("a correct code never counts as a failure; a missing code and a code in the query string are refused without a reading", async () => {
    const s = await stub();
    const store = new MemoryStore();
    const base = await serve({ env: deployedEnv(s.url, { LIVE_CODE_FAILURES_PER_HOUR: "1" }), liveStore: store, liveBudget: FAST });
    for (let i = 0; i < 3; i++) {
      const r = await startJob(base);
      expect(r.status, `correct code ${i}`).toBe(202);
      await poll(base, String(r.body.job_id), (x) => x === "done" || x === "failed");
    }
    const st = await call(`${base}/api/live/status`);
    expect(st.body).toMatchObject({ code_failures_this_hour_global: "0", code_failures_this_hour_this_client: "0" });
    const calls = s.state.chatCalls;
    const q = await startJob(base, { code: null, query: `?access_code=${CODE}` });
    expect(q.status).toBe(403);
    expect(q.body.error).toBe("wrong or missing access code; no live reading was used");
    expect(s.state.chatCalls).toBe(calls);
  });
  it("per client and global: 10 clients each fail once at a limit of 1; the 11th client is refused by the global ceiling", async () => {
    const s = await stub();
    const base = await serve({ env: deployedEnv(s.url, { LIVE_CODE_FAILURES_PER_HOUR: "1" }), liveStore: new MemoryStore(), liveBudget: FAST });
    for (let i = 1; i <= 10; i++) expect((await startJob(base, { code: "wrong", client: `198.51.100.${i}` })).status, `client ${i}`).toBe(403);
    expect((await startJob(base, { code: "wrong", client: "198.51.100.1" })).status).toBe(429);
    expect((await startJob(base, { code: CODE, client: "203.0.113.9" })).status).toBe(429);
    const st = await call(`${base}/api/live/status`, { headers: { "x-forwarded-for": "198.51.100.3" } });
    expect(st.body).toMatchObject({ code_failures_this_hour_global: "11", code_failures_this_hour_this_client: "1", code_failure_limit_per_client: "1", code_failure_ceiling_global: "10" });
  });
});

describe("code and lease guards that only show across instances or over time (S6-14, J-02, J-03, CH6-06)", () => {
  // F6-01: the deployed site runs these two Lua scripts on Upstash. The fake store emulates only its own verbatim copies,
  // which are the texts the auditor ran on real Redis 7.4.10 (stage-6/auditor/candidate-1/lua-real-redis.log, whose
  // SHA-1 prefixes 5f010c665661 and e9f69f2beb75 are the SHA-1 of these texts). A changed script fails here, and every
  // test that goes through the fake fails too, because the fake refuses any other text.
  it("the two Lua scripts in src/ are exactly the texts verified on real Redis (pinned SHA-256)", () => {
    const sha256 = (x: string) => createHash("sha256").update(x).digest("hex");
    const sha1 = (x: string) => createHash("sha1").update(x).digest("hex");
    expect(sha256(COUNT_ATTEMPT_SCRIPT), "COUNT_ATTEMPT_SCRIPT changed: re-verify on real Redis before re-pinning").toBe("210382f3def5e863033e2f2023dd8148017f41b17cd6e0c9cd933dd05a239abc");
    expect(sha256(DEL_IF_EQUALS_SCRIPT), "DEL_IF_EQUALS_SCRIPT changed: re-verify on real Redis before re-pinning").toBe("58c1e79c3e95626750ef05e2e74a7f650a45d44acbee56a3fa9df61b30d58631");
    expect(COUNT_ATTEMPT_SCRIPT).toBe(VERIFIED_COUNT_ATTEMPT_SCRIPT);
    expect(DEL_IF_EQUALS_SCRIPT).toBe(VERIFIED_DEL_IF_EQUALS_SCRIPT);
    expect(sha1(VERIFIED_COUNT_ATTEMPT_SCRIPT).slice(0, 12)).toBe("5f010c665661");
    expect(sha1(VERIFIED_DEL_IF_EQUALS_SCRIPT).slice(0, 12)).toBe("e9f69f2beb75");
  });
  it("the fake store refuses a script that is not one of the verified texts", async () => {
    const f = await startFakeUpstash({ token: STORE_TOKEN });
    open.push(f);
    const r = await fetch(f.url, { method: "POST", headers: { authorization: `Bearer ${STORE_TOKEN}` }, body: JSON.stringify(["EVAL", VERIFIED_DEL_IF_EQUALS_SCRIPT.replace("== ARGV[1]", "~= nil"), 1, "k", "v"]) });
    expect(r.status).toBe(400);
    expect(String((await r.json()).error)).toMatch(/unknown script/);
  });
  it("the compare is constant-time over equal-length digests", () => {
    const src = readFileSync(path.join(ROOT, "src", "web", "app.ts"), "utf8");
    expect(src).toMatch(/return typeof given === "string" && timingSafeEqual\(digest\(given\), digest\(expected\)\);/);
    expect(src).toMatch(/codeMatches\(req\.headers\[ACCESS_CODE_HEADER\], cfg\.liveAccessCode\)/);
  });
  it("a client's wrong codes are counted across instances: limit 2, alternating instances, the 3rd attempt is refused", async () => {
    const s = await stub();
    const store = new MemoryStore();
    const env = deployedEnv(s.url, { LIVE_CODE_FAILURES_PER_HOUR: "2" });
    const a = await serve({ env, liveStore: store, liveBudget: FAST });
    const b = await serve({ env, liveStore: store, liveBudget: FAST });
    expect([(await startJob(a, { code: "x" })).status, (await startJob(b, { code: "x" })).status, (await startJob(a, { code: "x" })).status]).toEqual([403, 403, 429]);
  });
  it("a crashed holder's slot comes back through its lease TTL (fake clock): a job whose holder hangs forever cannot block the slot past the TTL", async () => {
    let now = Date.parse("2026-10-14T13:00:00.000Z");
    const store = new MemoryStore(() => now);
    const { LiveJobs } = await import("../src/web/live-jobs.js");
    const budget = { ...DEPLOYED_LIVE_BUDGET, slots: 1, pollMs: 5 };
    const jobs = new LiveJobs(store, () => new Date(now), budget);
    const hung = await jobs.admit(5, STUB_MODEL_ID, new Date(now));
    void jobs.run(hung, () => new Promise(() => undefined)); // the holder never finishes: a crashed instance
    while ((await store.get(KEYS.slot(0))) !== hung.job_id) await new Promise((r) => setTimeout(r, 5));
    now += budget.leaseTtlMs + 1;
    const next = await jobs.admit(5, STUB_MODEL_ID, new Date(now));
    const ran = jobs.run(next, async () => ({ kind: "failed", reason_class: "timeout" }));
    for (let i = 0; i < 200 && (await store.get(KEYS.slot(0))) !== next.job_id && JSON.parse((await store.get(KEYS.job(next.job_id)))!).state === "queued"; i++) await new Promise((r) => setTimeout(r, 5));
    await ran;
    expect(JSON.parse((await store.get(KEYS.job(next.job_id)))!).started_at).not.toBeNull();
  });
  it("one client over its limit cannot lock the others out: 10 x the limit of wrong codes from A, then B's right code is accepted (W-01)", async () => {
    const s = await stub();
    const base = await serve({ env: deployedEnv(s.url, { LIVE_CODE_FAILURES_PER_HOUR: "2" }), liveStore: new MemoryStore(), liveBudget: FAST });
    for (let i = 0; i < 20; i++) await startJob(base, { code: "wrong", client: "198.51.100.77" });
    const st = await call(`${base}/api/live/status`);
    expect(st.body.code_failures_this_hour_global).toBe("2");
    expect((await startJob(base, { client: "203.0.113.5" })).status).toBe(202);
  });
  it("an idle system admits 4 simultaneous jobs from 4 clients (2 to read, 2 to wait); busy is never claimed when it is false (W-07)", async () => {
    const s = await stub({ delayMs: 300 });
    const store = new MemoryStore();
    store.delayMs = 5;
    const base = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
    const rs = await Promise.all([1, 2, 3, 4].map((i) => startJob(base, { client: `198.51.100.${i}` })));
    expect(rs.map((r) => r.status), JSON.stringify(rs.map((r) => r.body.error))).toEqual([202, 202, 202, 202]);
    for (const r of rs) expect((await poll(base, String(r.body.job_id), (x) => x === "done" || x === "failed")).body.state).toBe("done");
  });
  it("past the job's deadline the reader starts no attempt: it refuses before any request (W-03)", async () => {
    const s = await stub();
    const { DeadlineReader } = await import("../src/web/deadline-reader.js");
    const r = new DeadlineReader({ baseUrl: s.url, modelId: STUB_MODEL_ID, apiKey: KEY, backoffBaseMs: 1 }, Date.now() - 1);
    await expect(r.read({ case_id: "cg-004", certificate: cert("cg-004") })).rejects.toMatchObject({ errorClass: "timeout", message: "the job's deadline was reached before this attempt" });
    expect(s.state.chatCalls).toBe(0);
  });
  it("an internal error during a job is reported as internal, never as an endpoint failure (W-06)", async () => {
    const { LiveJobs } = await import("../src/web/live-jobs.js");
    const store = new MemoryStore();
    const jobs = new LiveJobs(store, () => new Date(), { ...DEPLOYED_LIVE_BUDGET, pollMs: 5 });
    const job = await jobs.admit(10, STUB_MODEL_ID, new Date());
    await jobs.run(job, () => Promise.reject(new Error("a bug in the receipt export")));
    expect(JSON.parse((await store.get(KEYS.job(job.job_id)))!)).toMatchObject({ state: "failed", reason_class: "internal", reason: REASONS.internal, result: null });
  });
  it("two workers that look for a slot at the same moment on a slow store take two different slots: admission is atomic SET NX, never read-then-write (CH6-06)", async () => {
    const { LiveJobs } = await import("../src/web/live-jobs.js");
    const store = new MemoryStore();
    store.delayMs = 20;
    const jobs = new LiveJobs(store, () => new Date(), { ...DEPLOYED_LIVE_BUDGET, pollMs: 5 });
    const a = await jobs.admit(10, STUB_MODEL_ID, new Date());
    const b = await jobs.admit(10, STUB_MODEL_ID, new Date());
    const hang = () => new Promise<never>(() => undefined);
    void jobs.run(a, hang);
    void jobs.run(b, hang);
    // F6-02: bounded by time (30 s), not by an iteration count.
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const [s0, s1] = await Promise.all([store.get(KEYS.slot(0)), store.get(KEYS.slot(1))]);
      if (s0 && s1) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    const holders = [await store.get(KEYS.slot(0)), await store.get(KEYS.slot(1))];
    expect(holders.sort(), `slot holders within 30 s: ${JSON.stringify(holders)}`).toEqual([a.job_id, b.job_id].sort());
  });
  it("the worst interleaving over-admits by at most the number of slots: 4 waiting at most (maxWaiting + slots), then busy", async () => {
    // Two queued jobs take both slots exactly between two concurrent admissions' read of the holders and their rank.
    const { LiveJobs } = await import("../src/web/live-jobs.js");
    let t = Date.parse("2026-10-14T13:00:00.000Z");
    const seed = ["j1", "j2", "w1", "w2"].map((x) => x.padEnd(32, "0"));
    let arrivals: (() => void)[] = [];
    let injected = false;
    class Interleaving extends MemoryStore {
      override async zrank(key: string, member: string) {
        if (key === KEYS.queue && !seed.includes(member) && !injected) {
          // Barrier: wait until two new admissions have both read the slot holders.
          await new Promise<void>((r) => { arrivals.push(r); if (arrivals.length === 2) { injected = true; for (const a of arrivals) a(); } });
          if (arrivals.length === 2 && !(await super.get(KEYS.slot(0)))) {
            for (const [i, id] of seed.slice(0, 2).entries()) { await super.setNx(KEYS.slot(i), id, 300_000); await super.zrem(KEYS.queue, id); }
          }
        }
        return super.zrank(key, member);
      }
    }
    const store = new Interleaving(() => t);
    for (const [i, id] of seed.entries()) await store.zadd(KEYS.queue, t - 1_000 + i, id);
    const jobs = new LiveJobs(store, () => new Date((t += 1)), DEPLOYED_LIVE_BUDGET);
    const both = await Promise.allSettled([jobs.admit(10, STUB_MODEL_ID, new Date(t)), jobs.admit(10, STUB_MODEL_ID, new Date(t))]);
    expect(both.map((x) => x.status)).toEqual(["fulfilled", "fulfilled"]);
    const waiting = await store.zcard(KEYS.queue);
    expect(waiting).toBe(DEPLOYED_LIVE_BUDGET.maxWaiting + DEPLOYED_LIVE_BUDGET.slots);
    arrivals = [];
    await expect(jobs.admit(10, STUB_MODEL_ID, new Date(t))).rejects.toMatchObject({ status: 429, extra: { reason_class: "busy" } });
    expect(await store.zcard(KEYS.queue)).toBe(waiting);
  });
  it("an earlier arrival that reaches admission later cannot overfill or jump the queue: 2 waiting, a 3rd with an older arrival is busy, FIFO by admission (A-01)", async () => {
    let t = Date.parse("2026-10-14T13:00:00.000Z");
    const clock = () => new Date((t += 5));
    const store = new MemoryStore(() => t);
    const { LiveJobs } = await import("../src/web/live-jobs.js");
    const jobs = new LiveJobs(store, clock, DEPLOYED_LIVE_BUDGET);
    // Two readings hold both slots, so the queue may hold exactly 2 waiting jobs.
    await store.setNx(KEYS.slot(0), "reading-1", 300_000);
    await store.setNx(KEYS.slot(1), "reading-2", 300_000);
    const a = await jobs.admit(10, STUB_MODEL_ID, new Date(t));
    const b = await jobs.admit(10, STUB_MODEL_ID, new Date(t));
    await expect(jobs.admit(10, STUB_MODEL_ID, new Date(t - 5_000))).rejects.toMatchObject({ status: 429, extra: { reason_class: "busy" } });
    expect([await store.zrank(KEYS.queue, a.job_id), await store.zrank(KEYS.queue, b.job_id)]).toEqual([0, 1]);
    expect(await store.zcard(KEYS.queue)).toBe(2);
    expect(await store.get(KEYS.reads("2026-10-14T13"))).toBe("2");
  });
  it("a late finisher never frees another job's slot: release is compare-and-delete on the job's own token", async () => {
    const store = new MemoryStore();
    const { LiveJobs } = await import("../src/web/live-jobs.js");
    const jobs = new LiveJobs(store, () => new Date(), { ...DEPLOYED_LIVE_BUDGET, pollMs: 5 });
    const job = await jobs.admit(5, STUB_MODEL_ID, new Date());
    let finish!: () => void;
    const work = () => new Promise<{ kind: "failed"; reason_class: "timeout" }>((r) => { finish = () => r({ kind: "failed", reason_class: "timeout" }); });
    const running = jobs.run(job, work);
    while ((await store.get(KEYS.slot(0))) !== job.job_id) await new Promise((r) => setTimeout(r, 5));
    // The lease expired and another job took the slot while this reading still ran.
    await store.set(KEYS.slot(0), "other-job-token", 300);
    finish();
    await running;
    expect(await store.get(KEYS.slot(0))).toBe("other-job-token");
  });
});

describe("timeout, failure and model paths: no stored result, fixed reasons, nothing leaked (S6-02, CH6-07, CH6-10, CH6-12, CH6-14, J-06, J-07, J-10)", () => {
  it("a reading that outlives the deadline fails as timed out; the attempt ends at the deadline, no attempt starts after it, and the slot comes back (W-03)", async () => {
    const s = await stub({ mode: "timeout" });
    const store = new MemoryStore();
    const base = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: { ...FAST, deadlineMs: 1_500, readBudgetMs: 1_500, leaseTtlMs: 5_000 }, adapterTimeoutMs: 60_000, backoffBaseMs: 1 });
    const r = await startJob(base);
    const f = await poll(base, String(r.body.job_id), (x) => x === "failed" || x === "done", 5_000);
    expect(f.body).toMatchObject({ state: "failed", reason_class: "timeout", reason: REASONS.timeout, result: null });
    for (let i = 0; i < 100 && (await store.get(KEYS.slot(0))) !== null; i++) await new Promise((x) => setTimeout(x, 20));
    await new Promise((x) => setTimeout(x, 300));
    expect(s.state.inFlight, "no provider request is left open after the deadline").toBe(0);
    expect(s.state.chatCalls, "no attempt starts after the deadline").toBe(1);
    expect(await store.get(KEYS.slot(0))).toBeNull();
    expect((await call(`${base}/api/live/status`)).body.in_flight).toBe("0");
  });
  it("a done job carries no provider text: a 429 whose body has a marker and a path, then a good reply (W-02)", async () => {
    const s = await stub({ failFirst: 1, failMode: "http_429", errorText: "marker-q7 /private-base-path-x" });
    const base = await serve({ env: deployedEnv(s.url), liveStore: new MemoryStore(), liveBudget: FAST, backoffBaseMs: 1 });
    const r = await startJob(base);
    const d = await poll(base, String(r.body.job_id), (x) => x === "done" || x === "failed");
    expect(d.body.state).toBe("done");
    expect(s.state.chatCalls).toBeGreaterThan(1);
    expect(d.text).not.toContain("marker-q7");
    expect(d.text).not.toContain("private-base-path-x");
    const errs = ((d.body.result as { view: { receipt: { errors: { class: string; detail: string }[] } } }).view.receipt.errors);
    expect(errs.length).toBeGreaterThan(0);
    for (const e of errs) expect(e.detail).toBe(`attempt failed (${e.class}); it was retried`);
  });
  for (const [mode, cls] of [["http_5xx", "endpoint_5xx"], ["http_429", "endpoint_429"], ["http_4xx", "endpoint_4xx"], ["invalid_json", "invalid_model_output"]] as const) {
    it(`${mode} -> failed ${cls} with its fixed text; the provider's error text (with sentinels) never reaches a response`, async () => {
      const s = await stub({ mode, errorText: `upstream said ${KEY} at /private-path-z` });
      const base = await serve({ env: deployedEnv(s.url), liveStore: new MemoryStore(), liveBudget: FAST, backoffBaseMs: 1 });
      const r = await startJob(base);
      const f = await poll(base, String(r.body.job_id), (x) => x === "failed" || x === "done");
      expect(f.body).toMatchObject({ state: "failed", reason_class: cls, reason: REASONS[cls], result: null });
      expect(f.text).not.toContain(KEY);
      expect(f.text).not.toContain("private-path-z");
    });
  }
  it("a reported model other than the requested one fails as model_mismatch, and the reading is not shown", async () => {
    const s = await stub({ reportedModel: "someone/another-model" });
    const base = await serve({ env: deployedEnv(s.url), liveStore: new MemoryStore(), liveBudget: FAST });
    const r = await startJob(base);
    const f = await poll(base, String(r.body.job_id), (x) => x === "failed" || x === "done");
    expect(f.body).toMatchObject({ state: "failed", reason_class: "model_mismatch", result: null });
  });
  it("the requested model may be reported with a provider prefix (self-dploy/<id>)", async () => {
    const s = await stub({ reportedModel: `self-dploy/${STUB_MODEL_ID}` });
    const base = await serve({ env: deployedEnv(s.url), liveStore: new MemoryStore(), liveBudget: FAST });
    const r = await startJob(base);
    expect((await poll(base, String(r.body.job_id), (x) => x === "failed" || x === "done")).body.state).toBe("done");
  });
  it("orphaned jobs: a poll derives failed (timed out) without writing, for reading, queued and too-old jobs (fake clock)", async () => {
    let now = Date.parse("2026-10-14T13:00:00.000Z");
    const store = new MemoryStore(() => now);
    const s = await stub();
    const base = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: DEPLOYED_LIVE_BUDGET, clock: () => new Date(now) });
    const t0 = new Date(now).toISOString();
    const rec = (id: string, state: string) => JSON.stringify({ job_id: id, state, created_at: t0, started_at: state === "reading" ? t0 : null, finished_at: null, model_requested: STUB_MODEL_ID, reason_class: null, reason: null, result: null });
    const R = "a".repeat(32), Q = "b".repeat(32);
    await store.set(KEYS.job(R), rec(R, "reading"), 3600);
    await store.set(KEYS.job(Q), rec(Q, "queued"), 3600);
    now += DEPLOYED_LIVE_BUDGET.queueMaxWaitMs + 10_001;
    expect((await call(`${base}/api/live/jobs/${Q}`)).body).toMatchObject({ state: "failed", reason_class: "queue_timeout" });
    expect((await call(`${base}/api/live/jobs/${R}`)).body.state).toBe("reading");
    now += DEPLOYED_LIVE_BUDGET.deadlineMs;
    expect((await call(`${base}/api/live/jobs/${R}`)).body).toMatchObject({ state: "failed", reason_class: "timeout", result: null });
    expect(JSON.parse((await store.get(KEYS.job(R)))!).state).toBe("reading");
    expect(JSON.parse((await store.get(KEYS.job(Q)))!).state).toBe("queued");
  });
  it("dead queue entries are pruned at admission: two ghosts ahead do not block a new job (J-04)", async () => {
    const s = await stub();
    const store = new MemoryStore();
    const base = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
    const old = Date.now() - (FAST.queueMaxWaitMs + 11_000);
    await store.zadd(KEYS.queue, old, "c".repeat(32));
    await store.zadd(KEYS.queue, old + 1, "d".repeat(32));
    const r = await startJob(base);
    expect(r.status).toBe(202);
    expect((await poll(base, String(r.body.job_id), (x) => x === "done" || x === "failed")).body.state).toBe("done");
  });
  it("polls reject malformed and unknown ids with 404 before the store is read for a job (J-05)", async () => {
    const s = await stub();
    const store = new MemoryStore();
    const base = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
    for (const id of ["..%2F..%2Fetc", "abc", "Z".repeat(32), "e".repeat(32)]) expect((await call(`${base}/api/live/jobs/${id}`)).status, id).toBe(404);
  });
  it("a store that fails at admission refuses with store_unavailable: no job, no endpoint call, nothing of the store's reply leaked (J-15)", async () => {
    const s = await stub();
    const f = await startFakeUpstash({ token: STORE_TOKEN });
    open.push(f);
    f.state.downBody = `store said ${STORE_TOKEN}`;
    f.state.down = true;
    const base = await serve({ env: deployedEnv(s.url), liveStore: new UpstashRestStore(f.url, STORE_TOKEN), liveBudget: FAST });
    const r = await startJob(base);
    expect(r.status).toBe(503);
    expect(r.body).toMatchObject({ reason_class: "store_unavailable", error: REASONS.store_unavailable });
    expect(r.text).not.toContain(STORE_TOKEN);
    expect(s.state.chatCalls).toBe(0);
  });
  it("no sentinel value (key, code, store token, base URL) appears in any response body or header seen in this file (CH6-14)", () => {
    expect(seen.length).toBeGreaterThan(50);
    for (const t of seen) for (const v of [KEY, CODE, STORE_TOKEN]) expect(t.includes(v), v).toBe(false);
    expect(seen.some((t) => /127\.0\.0\.1:\d+\/v1/.test(t)), "a response carries the endpoint base URL").toBe(false);
  });
});

describe("deployed site with live reading disabled answers as at 409fb69a (S6-01, CH6-03, CH6-04, J-08, T6-03)", () => {
  it("every existing route answers byte for byte as the 409fb69a build did, in three disabled configurations", async () => {
    const golden = JSON.parse(readFileSync(path.join(ROOT, "test", "fixtures", "stage6-disabled-golden.json"), "utf8"));
    const now = await record(createApp);
    expect(Object.keys(now)).toEqual(Object.keys(golden));
    for (const k of Object.keys(golden)) expect(now[k], k).toEqual(golden[k]);
  });
  it("with the store, the limit and the endpoint all configured but no access code, live reading stays off on the deployed site (S6-01)", async () => {
    const s = await stub();
    const env: Record<string, string> = deployedEnv(s.url);
    delete env.LIVE_ACCESS_CODE;
    const base = await serve({ env, liveStore: new MemoryStore(), liveBudget: FAST });
    expect((await call(`${base}/api/live/status`)).body).toMatchObject({ enabled: false, reason: DEPLOYED_LIVE_UNAVAILABLE });
    expect((await call(`${base}/health`)).body.reader).toBe("off");
    const r = await startJob(base, { code: null });
    expect({ status: r.status, body: r.body }).toEqual({ status: 503, body: { status: "rejected", error: DEPLOYED_LIVE_UNAVAILABLE } });
    expect(s.state.chatCalls).toBe(0);
  });
  it("the new live routes give one identical refusal with no code header, an empty one or a wrong one; nothing is called", async () => {
    const s = await stub();
    for (const env of [{ VERCEL: "1" }, deployedEnv(s.url, { LIVE_ACCESS_CODE: "" }), { ...deployedEnv(s.url) }]) {
      const base = await serve({ env, liveBudget: FAST });
      const answers = [];
      for (const code of [null, "", "wrong", CODE]) answers.push(await startJob(base, { code }));
      answers.push(await call(`${base}/api/live/jobs/${"f".repeat(32)}`));
      for (const a of answers) expect({ status: a.status, body: a.body }).toEqual({ status: 503, body: { status: "rejected", error: DEPLOYED_LIVE_UNAVAILABLE } });
    }
    expect(s.state.chatCalls).toBe(0);
  });
});

describe("DEPLOY.md section 5 checks, in the deployed shape with live reading enabled (S6-10)", () => {
  it("health ok and reader live, f1 on, status enabled with the code required and the counts, stories and figures 200, story evaluate block, the sample PDF, and 403 without the code", async () => {
    const s = await stub();
    const base = await serve({ env: deployedEnv(s.url), liveStore: new MemoryStore(), liveBudget: FAST });
    expect((await call(`${base}/health`)).body).toMatchObject({ status: "ok", reader: "live" });
    expect((await call(`${base}/api/f1`)).body.state).toBe("on");
    const st = (await call(`${base}/api/live/status`)).body;
    expect(st).toMatchObject({ enabled: true, access_code_required: true, used_this_hour: "0", in_flight: "0" });
    for (const p of ["/stories/cg-003.json", "/figures.json"]) expect((await fetch(base + p)).status, p).toBe(200);
    const ev = await call(`${base}/api/stories/cg-003/evaluate`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    expect((ev.body.view as { proposal: string }).proposal).toBe("block");
    const pdf = await fetch(`${base}/api/samples/cg-004/certificate.pdf`);
    expect([pdf.status, pdf.headers.get("content-type")]).toEqual([200, "application/pdf"]);
    expect((await startJob(base, { code: null })).status).toBe(403);
    expect(s.state.chatCalls).toBe(0);
  });
});

describe("F1 on the deployed site is one probe per period across instances (S6-07, H-11, J-09)", () => {
  it("10 concurrent /api/f1 calls on two instances sharing one store make one GET /models", async () => {
    const s = await stub();
    const store = new MemoryStore();
    const a = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
    const b = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
    const rs = await Promise.all(Array.from({ length: 10 }, (_, i) => call(`${i % 2 ? a : b}/api/f1`)));
    for (const r of rs) expect(r.body.state).toBe("on");
    expect(s.state.modelsCalls).toBe(1);
    // A separate instance has its own process memory: drop this process's F1 cache, so that only the shared store
    // can keep the second instance from probing again.
    clearF1Cache();
    const again = await Promise.all(Array.from({ length: 5 }, () => call(`${b}/api/f1`)));
    for (const r of again) expect(r.body.state).toBe("on");
    expect(s.state.modelsCalls).toBe(1);
  });
});

describe("sample certificates (S6-06, CH6-16, J-17)", () => {
  it("three allow-listed dataset certificates and their delivery notes, byte for byte as in the dataset checksums", async () => {
    const base = await serve({ env: {} });
    const list = await call(`${base}/api/samples`);
    const samples = list.body.samples as { id: string; certificate: string; certificate_sha256: string; delivery_note: string }[];
    expect(samples.map((x) => x.id)).toEqual([...SAMPLE_IDS]);
    const sums = readFileSync(path.join(DATA, "CHECKSUMS.sha256"), "utf8");
    for (const x of samples) {
      const pdf = Buffer.from(await (await fetch(base + x.certificate)).arrayBuffer());
      const sha = createHash("sha256").update(pdf).digest("hex");
      expect(sha).toBe(x.certificate_sha256);
      expect(sums).toContain(`${sha}  cases/${x.id}/certificate.pdf`);
      const res = await fetch(base + x.delivery_note);
      expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
      const c = JSON.parse(readFileSync(path.join(DATA, "cases", x.id, "case.json"), "utf8"));
      expect(Buffer.from(await res.arrayBuffer()).equals(readFileSync(path.join(DATA, c.delivery_note)))).toBe(true);
    }
    for (const p of ["/api/samples/cg-001/certificate.pdf", "/api/samples/..%2F..%2Fpackage.json/certificate.pdf", "/api/samples/cg-004/reading.json"]) {
      expect((await fetch(base + p)).status, p).toBe(404);
    }
  });
});

describe("time budget and constants (S6-03, CH6-05, J-03, J-14, T6-06)", () => {
  it("queue wait + reading + margin fit vercel.json maxDuration with at least 30 s to spare; leases outlive the budget", () => {
    const v = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
    const max = v.functions["api/index.ts"].maxDuration * 1000;
    expect(max).toBe(300_000);
    const d = DEPLOYED_LIVE_BUDGET;
    expect(d.marginMs).toBeGreaterThanOrEqual(30_000);
    expect(d.deadlineMs).toBe(d.queueMaxWaitMs + d.readBudgetMs);
    expect(d.deadlineMs + d.marginMs).toBeLessThanOrEqual(max);
    expect(d.leaseTtlMs).toBe(310_000);
    expect(d.leaseTtlMs).toBeGreaterThan(max);
    expect(d.pollMs).toBeGreaterThanOrEqual(2_000);
    expect([d.slots, d.maxWaiting]).toEqual([2, 2]);
    expect(CONTAINER_LIVE_BUDGET.leaseTtlMs).toBeGreaterThanOrEqual(Math.max(1_200_000, CONTAINER_LIVE_BUDGET.deadlineMs));
  });
});

describe("what stays the same, and what the browser gets (S6-08, S6-09, T6-01, T6-10, J-11, J-19)", () => {
  it("the reading path, data/, config/, evaluation/, figures.json and the stories are byte-identical to 409fb69a", () => {
    const base = JSON.parse(readFileSync(path.join(ROOT, "test", "fixtures", "stage6-baseline.json"), "utf8")) as { roots: string[]; blobs: Record<string, string> };
    const sha = (b: Buffer) => createHash("sha1").update(`blob ${b.length}\0`).update(b).digest("hex");
    const blob = (p: string, id: string) => {
      const b = readFileSync(path.join(ROOT, p));
      if (sha(b) === id || /\.(png|jpe?g|gif|ico|pdf|zip|gz)$/i.test(p)) return sha(b);
      return sha(Buffer.from(b.toString("latin1").replace(/\r\n/g, "\n"), "latin1"));
    };
    for (const [p, id] of Object.entries(base.blobs)) expect(blob(p, id), p).toBe(id);
    const present: string[] = [];
    const walk = (p: string) => { const abs = path.join(ROOT, p); if (statSync(abs).isDirectory()) for (const e of readdirSync(abs)) walk(`${p}/${e}`); else present.push(p); };
    for (const r of base.roots) if (existsSync(path.join(ROOT, r))) walk(r);
    expect(present.sort()).toEqual(Object.keys(base.blobs).sort());
  });
  it("no Gemma model id is a default anywhere in src/ or public/; the live model comes from MODEL_ID only", () => {
    const files: string[] = [];
    const walk = (d: string) => { for (const e of readdirSync(d)) { const p = path.join(d, e); if (statSync(p).isDirectory()) { if (e !== "stories") walk(p); } else if (/\.(ts|js|html|json|css)$/.test(e)) files.push(p); } };
    walk(path.join(ROOT, "src"));
    walk(path.join(ROOT, "public"));
    for (const f of files) expect(readFileSync(f, "utf8"), f).not.toMatch(/gemma-4-31b/i);
  });
  it("the job module imports no recorded reader and no story; the browser sends the code in a header, never in a URL", () => {
    const jobs = readFileSync(path.join(ROOT, "src", "web", "live-jobs.ts"), "utf8");
    expect(jobs).not.toMatch(/recorded-reader|RecordedReader|stories|build-stories/);
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(js).toMatch(/headers\[st\.access_code_header\] = code\.value/);
    expect(js).not.toMatch(/access_code=/);
    expect(js).toMatch(/Math\.max\(2, Number\(r\.body\.poll_interval_s\) \|\| 2\) \* 1000/);
  });
});
