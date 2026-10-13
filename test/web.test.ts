// Stage 2 web backend: F1, live reading, limit, access code, C11 through HTTP, stories, decisions
// (S2-11..S2-26, S2-31, S2-33, S2-36, B-01..B-24). Endpoint tests use the local TEST STUB only (D2-05, B-01).
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import type { AppDeps } from "../src/web/app.js";
import { InMemoryHourlyCounter } from "../src/web/limiter.js";
import { DATA, ROOT, runCase, expected } from "./helpers.js";
import { recordHumanDecision, HumanDecisionError } from "../src/pipeline.js";
// @ts-expect-error plain JS test double
import { startStub, STUB_MODEL_ID } from "./support/stub-endpoint.mjs";
import { buildStories } from "../src/tools/build-stories.js";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { CRITICAL_FIELDS } from "../src/fields.js";

type Stub = { url: string; state: { mode: string; caseId: string; reportedModel: string | null; omitModel: boolean; chatCalls: number; lastAuthorization: string | null; lastModel: string | null }; close: () => Promise<void> };
const open: { close: () => Promise<void> }[] = [];
afterEach(async () => { while (open.length) await open.pop()!.close(); });

async function app(deps: AppDeps) {
  const server = createApp(deps).listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  open.push({ close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) });
  return base;
}
async function stub(mode = "ok"): Promise<Stub> {
  const s = (await startStub({ mode })) as Stub;
  open.push(s);
  return s;
}
const stubEnv = (s: Stub, extra: Record<string, string> = {}) => ({
  MODEL_BASE_URL: s.url, MODEL_ID: STUB_MODEL_ID, MODEL_API_KEY: "sk-stub-secret-123", ...extra,
});
const pdf = (id: string) => readFileSync(path.join(DATA, "cases", id, "certificate.pdf")).toString("base64");
const csv = (note = "ALB-2026-0917.csv") => readFileSync(path.join(DATA, "delivery", note), "utf8");
const liveBody = (extra: Record<string, unknown> = {}) => ({ certificate_base64: pdf("cg-001"), delivery_csv: csv(), delivery_line: "1", synthetic_confirmed: true, ...extra });
const postJson = (url: string, body: unknown) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

class Clock {
  constructor(public t = new Date("2026-10-12T18:20:00.000Z")) {}
  now = () => new Date(this.t.getTime());
  advance(ms: number) { this.t = new Date(this.t.getTime() + ms); }
}

describe("F1 panel (S2-11, S2-12, S2-36, B-06, B-19)", () => {
  it("no endpoint configured: off with the server's real check time, a later load shows a later time", async () => {
    const c = new Clock();
    const base = await app({ env: {}, clock: c.now });
    const a = await (await fetch(`${base}/api/f1`)).json();
    expect(a).toMatchObject({ state: "off", detail: "no endpoint configured", model_ids: [], gpu: null, checked_at: "2026-10-12T18:20:00.000Z" });
    c.advance(61_000);
    const b = await (await fetch(`${base}/api/f1`)).json();
    expect(Date.parse(b.checked_at)).toBeGreaterThan(Date.parse(a.checked_at));
  });
  it("unreachable endpoint: off", async () => {
    const base = await app({ env: { MODEL_BASE_URL: "http://127.0.0.1:9" } });
    expect((await (await fetch(`${base}/api/f1`)).json()).state).toBe("off");
  });
  it("with the test stub: shows only what the endpoint reports; GPU, ROCm and vLLM not exposed (S3-08..S3-12)", async () => {
    const { clearF1Cache } = await import("../src/web/f1.js");
    clearF1Cache();
    const s = await stub();
    const base = await app({ env: stubEnv(s) });
    const f = await (await fetch(`${base}/api/f1`)).json();
    expect(f.state).toBe("on");
    expect(f.model_ids).toEqual([STUB_MODEL_ID]);
    expect(f.endpoint_name).toBe("AMD Token Factory");
    for (const k of ["gpu", "rocm_version", "vllm_version"]) expect(f[k]).toBe("not exposed by the endpoint");
    expect(f.rate_limit_rpm).toBe("20");
    expect(f.daily_spend_limit).toBe("1");
    expect(f.usage_source).toBe("GET /usage");
    expect(f.cost_label).toBe("cost reported by the endpoint; Token Factory credits are free and have no monetary value");
  });
  it("request parameters, headers or body cannot set the endpoint (B-06)", async () => {
    const s = await stub();
    const base = await app({ env: {} });
    const f = await (await fetch(`${base}/api/f1?base=${encodeURIComponent(s.url)}&MODEL_BASE_URL=${encodeURIComponent(s.url)}`, { headers: { "x-model-base-url": s.url } })).json();
    expect(f.state).toBe("off");
  });
  it("probes are cached server-side: N rapid /api/f1 requests make at most one upstream probe per 60 s (C-06)", async () => {
    const { clearF1Cache, f1UpstreamCalls, F1_CACHE_MS } = await import("../src/web/f1.js");
    clearF1Cache();
    expect(F1_CACHE_MS).toBeGreaterThanOrEqual(60_000);
    const s = await stub();
    const c = new Clock();
    const base = await app({ env: stubEnv(s), clock: c.now });
    const before = f1UpstreamCalls();
    const all = await Promise.all(Array.from({ length: 10 }, () => fetch(`${base}/api/f1`).then((r) => r.json())));
    for (let i = 0; i < 5; i++) await (await fetch(`${base}/api/f1`)).json();
    // One probe = GET /models + GET /usage.
    expect(f1UpstreamCalls() - before).toBeLessThanOrEqual(2);
    expect(all.every((f) => f.state === "on")).toBe(true);
    c.advance(59_000);
    await (await fetch(`${base}/api/f1`)).json();
    expect(f1UpstreamCalls() - before).toBeLessThanOrEqual(2);
    c.advance(2_000);
    await (await fetch(`${base}/api/f1`)).json();
    expect(f1UpstreamCalls() - before).toBeLessThanOrEqual(4);
  });
  it("no price or cost estimate is computed in code: the cost shown is the endpoint's, with the fixed label (S3-10, S2-36)", async () => {
    const f1 = await import("../src/web/f1.js");
    expect((f1 as Record<string, unknown>).costEstimate).toBeUndefined();
    const src = readFileSync(path.join(ROOT, "src", "web", "f1.ts"), "utf8");
    expect(src).not.toMatch(/1\.99|PRICE_PER_HOUR|GPU_INFO_URL|gpu-info/);
  });
});

describe("live reading without an endpoint (S2-15, S2-20, S2-31, B-13)", () => {
  it("status: disabled when LIVE_READS_PER_HOUR is unset, 0 or invalid (fail closed); no-store (B-05)", async () => {
    for (const v of [undefined, "0", "abc", "-3"]) {
      const base = await app({ env: v === undefined ? {} : { LIVE_READS_PER_HOUR: v } });
      const res = await fetch(`${base}/api/live/status`);
      expect(res.headers.get("cache-control")).toBe("no-store");
      const st = await res.json();
      expect(st.enabled, String(v)).toBe(false);
      expect(st.remaining_this_hour).toBe("0");
      expect(st.windows_note).toBe("no live window is announced");
      expect(st.scope_note).toMatch(/per server instance/);
    }
  });
  it("an upload byte-identical to a dataset PDF never reaches MockReader: C11 endpoint_off, live attempt with no reading, not counted", async () => {
    const base = await app({ env: { LIVE_READS_PER_HOUR: "5" } });
    const res = await postJson(`${base}/api/live/read`, liveBody());
    expect(res.headers.get("cache-control")).toBe("no-store");
    const j = await res.json();
    expect(j.counted).toBe(false);
    expect(j.view.status).toBe("error");
    expect(j.view.proposal).toBe("review");
    expect(j.view.reading_source).toBe("live_no_reading");
    expect(j.view.reading_label).toBe("live attempt · no reading");
    expect(j.view.receipt.reader.reader_id).not.toMatch(/mock/);
    expect(j.view.receipt.errors[0].class).toBe("endpoint_off");
    expect(j.view.receipt.f1.state).toBe("off");
    // F2-02: the explanation note follows the reading source; an upload never claims a mock reading.
    expect(j.view.explanation.note).toMatch(/live attempt and nothing was read/);
    expect(j.view.explanation.note).not.toMatch(/mock/);
    expect((await (await fetch(`${base}/api/live/status`)).json()).remaining_this_hour).toBe("5");
  });
  it("web upload limit is below the Vercel body limit and enforced (B-18)", async () => {
    const { WEB_MAX_CERTIFICATE_BYTES, WEB_MAX_REQUEST_BYTES, VERCEL_BODY_LIMIT_BYTES } = await import("../src/web/limits.js");
    expect(WEB_MAX_REQUEST_BYTES).toBeLessThan(VERCEL_BODY_LIMIT_BYTES);
    expect(Math.ceil((WEB_MAX_CERTIFICATE_BYTES * 4) / 3)).toBeLessThan(WEB_MAX_REQUEST_BYTES);
    const base = await app({ env: { LIVE_READS_PER_HOUR: "5" } });
    const over = Buffer.alloc(WEB_MAX_CERTIFICATE_BYTES + 1, 0x41).toString("base64");
    expect((await postJson(`${base}/api/live/read`, { certificate_base64: over })).status).toBe(413);
    const tooBig = "x".repeat(WEB_MAX_REQUEST_BYTES + 10);
    expect((await fetch(`${base}/api/live/read`, { method: "POST", body: tooBig })).status).toBe(413);
  });
  it("invalid input is rejected before anything is counted", async () => {
    const s = await stub();
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "2", LIVE_ACCESS_CODE: "jury-code-77" }) });
    const res = await postJson(`${base}/api/live/read`, { certificate_base64: Buffer.from("not a pdf").toString("base64"), synthetic_confirmed: true, access_code: "jury-code-77" });
    expect(res.status).toBe(400);
    expect((await (await fetch(`${base}/api/live/status`)).json()).remaining_this_hour).toBe("2");
    expect(s.state.chatCalls).toBe(0);
  });
});

describe("live upload policy and deployed site (R3.1 C-02, C-07, S3-24)", () => {
  // A synthetic PDF that is not in the dataset: cg-001's certificate with bytes appended after %%EOF.
  const foreign = () => { const b = readFileSync(path.join(DATA, "cases", "cg-001", "certificate.pdf")); return Buffer.concat([b, Buffer.from(" %x ")]).toString("base64"); };
  it("without LIVE_ACCESS_CODE an uploaded file that is not a dataset certificate is refused before anything is counted or sent (C-02 a)", async () => {
    const s = await stub();
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "3" }) });
    const r = await postJson(`${base}/api/live/read`, liveBody({ certificate_base64: foreign() }));
    expect(r.status).toBe(403);
    expect((await r.json()).error).toMatch(/needs the access code/);
    expect(s.state.chatCalls).toBe(0);
    expect((await (await fetch(`${base}/api/live/status`)).json()).remaining_this_hour).toBe("3");
    expect((await postJson(`${base}/api/live/read`, liveBody())).status).toBe(200);
    expect(s.state.chatCalls).toBe(1);
  });
  it("with LIVE_ACCESS_CODE configured and given, an uploaded synthetic file can be read (C-02 a)", async () => {
    const s = await stub();
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "3", LIVE_ACCESS_CODE: "jury-code-77" }) });
    expect((await postJson(`${base}/api/live/read`, liveBody({ certificate_base64: foreign() }))).status).toBe(403);
    expect((await postJson(`${base}/api/live/read`, liveBody({ certificate_base64: foreign(), access_code: "jury-code-77" }))).status).toBe(200);
    expect(s.state.chatCalls).toBe(1);
  });
  it("no live reading without the confirmed third-party notice; the notice names AMD Token Factory, ~2 days and synthetic (C-02 b)", async () => {
    const s = await stub();
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "3" }) });
    for (const v of [undefined, false, "true", 1]) {
      const r = await postJson(`${base}/api/live/read`, liveBody({ synthetic_confirmed: v }));
      expect(r.status, String(v)).toBe(400);
    }
    expect(s.state.chatCalls).toBe(0);
    const st = await (await fetch(`${base}/api/live/status`)).json();
    expect(st.notice).toMatch(/AMD Token Factory/);
    expect(st.notice).toMatch(/about 2 days/);
    expect(st.notice).toMatch(/synthetic/);
    const appJs = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(appJs).toMatch(/synthetic_confirmed: confirm\.checked/);
    expect(appJs).toMatch(/st\.notice/);
  });
  it("the live limit is per instance: two instances with LIVE_READS_PER_HOUR=2 on one endpoint give 4 readings, not 2 (S3-23, measured)", async () => {
    const s = await stub();
    const a = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "2" }) });
    const b = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "2" }) });
    const statuses = [];
    for (const base of [a, b, a, b, a, b]) statuses.push((await postJson(`${base}/api/live/read`, liveBody())).status);
    expect(statuses).toEqual([200, 200, 200, 200, 429, 429]);
    expect(s.state.chatCalls).toBe(4);
    const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
    expect(readme).toMatch(/with N instances the real ceiling\s+is N × 20 live readings per\s+hour/);
  });
  it("time budget: the worst-case live reading does not fit the deployed function, so the deployed site has no live reading (C-07)", async () => {
    const L = await import("../src/web/limits.js");
    expect(L.LIVE_WORST_CASE_MS).toBe(L.ADAPTER_ATTEMPT_TIMEOUT_MS * L.ADAPTER_MAX_ATTEMPTS + L.ADAPTER_BACKOFF_CAP_MS * (L.ADAPTER_MAX_ATTEMPTS - 1));
    expect(L.LIVE_WORST_CASE_MS).toBe(1_140_000);
    expect(L.VERCEL_MAX_DURATION_MS).toBe(300_000);
    expect(L.LIVE_FITS_DEPLOYED_FUNCTION).toBe(false);
    const vercel = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
    expect(vercel.functions["api/index.ts"].maxDuration * 1000).toBe(L.VERCEL_MAX_DURATION_MS);
    const s = await stub();
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "20", VERCEL: "1" }) });
    const st = await (await fetch(`${base}/api/live/status`)).json();
    expect(st.enabled).toBe(false);
    expect(st.reason).toBe("live reading unavailable on the deployed site; live demonstration from the container");
    const r = await postJson(`${base}/api/live/read`, liveBody());
    expect(r.status).toBe(503);
    expect(s.state.chatCalls).toBe(0);
  });
});

describe("live reading through the test stub (S2-16, S2-17, S2-25, B-02..B-05, B-24)", () => {
  it("reads through the adapter: reading_source live, model id as reported by configuration, key only sent to the endpoint", async () => {
    const s = await stub();
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "3" }) });
    const res = await postJson(`${base}/api/live/read`, liveBody());
    const text = await res.text();
    const j = JSON.parse(text);
    expect(j.counted).toBe(true);
    expect(j.view.reading_source).toBe("live");
    expect(j.view.receipt.reader.model_id).toBe(STUB_MODEL_ID);
    expect(j.view.proposal).toBe("release");
    expect(j.view.receipt.f1.state).toBe("on");
    expect(j.view.receipt.f1.tokens_per_second).not.toBeNull();
    expect(s.state.lastAuthorization).toBe("Bearer sk-stub-secret-123");
    expect(s.state.lastModel).toBe(STUB_MODEL_ID);
    expect(text).not.toContain("sk-stub-secret-123");
  });
  it("limit: exhausted is rejected by the server with the reopening time; reopens at the next UTC hour", async () => {
    const s = await stub();
    const c = new Clock(new Date("2026-10-12T18:59:30.000Z"));
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "2" }), clock: c.now });
    expect((await postJson(`${base}/api/live/read`, liveBody())).status).toBe(200);
    expect((await postJson(`${base}/api/live/read`, liveBody())).status).toBe(200);
    const third = await postJson(`${base}/api/live/read`, liveBody());
    expect(third.status).toBe(429);
    expect((await third.json()).reopens_at).toBe("2026-10-12T19:00:00.000Z");
    const st = await (await fetch(`${base}/api/live/status`)).json();
    expect(st.remaining_this_hour).toBe("0");
    c.advance(31_000);
    expect((await postJson(`${base}/api/live/read`, liveBody())).status).toBe(200);
    expect(s.state.chatCalls).toBe(3);
  });
  it("check-and-consume is atomic: with k = 3 remaining, 8 parallel requests give exactly 3 readings", async () => {
    const s = await stub();
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "3" }) });
    const results = await Promise.all(Array.from({ length: 8 }, () => postJson(`${base}/api/live/read`, liveBody())));
    expect(results.filter((r) => r.status === 200).length).toBe(3);
    expect(results.filter((r) => r.status === 429).length).toBe(5);
    expect(s.state.chatCalls).toBe(3);
  });
  it("client headers, cookies or body fields cannot change the count", async () => {
    const s = await stub();
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "1" }) });
    await postJson(`${base}/api/live/read`, liveBody());
    const r = await fetch(`${base}/api/live/read`, {
      method: "POST", headers: { "content-type": "application/json", cookie: "remaining=99", "x-remaining": "99", "x-forwarded-for": "10.0.0.9" },
      body: JSON.stringify(liveBody({ remaining: "99", limit: "99" })),
    });
    expect(r.status).toBe(429);
  });
  it("a client-sent remaining_this_hour is ignored: 10 parallel reads against a limit of 3 give exactly 3 (S2M04)", async () => {
    const s = await stub();
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "3" }) });
    const results = await Promise.all(Array.from({ length: 10 }, () =>
      postJson(`${base}/api/live/read`, liveBody({ remaining_this_hour: "999", limit_per_hour: "999", counted: false }))));
    expect(results.filter((r) => r.status === 200).length).toBe(3);
    expect(s.state.chatCalls).toBe(3);
    const st = await (await fetch(`${base}/api/live/status`)).json();
    expect(st.remaining_this_hour).toBe("0");
  });
  it("model id: the receipt shows the id the endpoint reported, the configured one only as requested (F2-03)", async () => {
    const s = await stub();
    s.state.reportedModel = "adv-stub-model-7f3a";
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "3", MODEL_ID: "configured-name-not-from-endpoint" }) });
    const j = await (await postJson(`${base}/api/live/read`, liveBody())).json();
    expect(j.view.receipt.reader.model_id).toBe("adv-stub-model-7f3a");
    expect(j.view.receipt.reader.requested_model_id).toBe("configured-name-not-from-endpoint");
    expect(j.summary.note).toContain("model as reported by the endpoint: adv-stub-model-7f3a");
    expect(j.summary.note).toContain("requested: configured-name-not-from-endpoint");
    expect(JSON.stringify(j.view.rows)).not.toContain("configured-name-not-from-endpoint");
    s.state.omitModel = true;
    const k = await (await postJson(`${base}/api/live/read`, liveBody())).json();
    expect(k.view.receipt.reader.model_id).toMatch(/^unknown/);
  });
  it("a reply carrying explanation text is never displayed as an explanation; kept only as untrusted text (R3.1 C-04, cg-021 contamination)", async () => {
    const s = await stub();
    s.state.caseId = "cg-021";
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "3" }) });
    const body = { certificate_base64: pdf("cg-021"), delivery_csv: csv("ALB-2026-1003.csv"), delivery_line: "18", synthetic_confirmed: true };
    const text = await (await postJson(`${base}/api/live/read`, body)).text();
    const j = JSON.parse(text);
    expect(j.view.reading_source).toBe("live");
    expect(j.view.proposal).toBe("block");
    expect(j.view.explanation.available).toBe(false);
    expect(j.view.explanation.text).toBeNull();
    expect(j.view.explanation.note).toMatch(/only reads the certificate here; it never explains or decides/);
    expect(j.view.receipt.model_text).toMatchObject({ untrusted: true, used_for_decision: false });
    expect(JSON.stringify(j.view.rows) + JSON.stringify(j.view.reasons)).not.toMatch(/approved without human review/);
  });
  it("even an explanation whose references all name read fields is not shown (R3.1 C-04)", async () => {
    const doc = JSON.parse(readFileSync(path.join(DATA, "cases", "cg-005", "reading.json"), "utf8"));
    doc.explanation = { text: "Mn 1.65 % is above the 1.60 % maximum of ESP-014.", references: ["chemistry.Mn"] };
    const f = path.join(mkdtempSync(path.join(tmpdir(), "certgate-expl-")), "reading.json");
    writeFileSync(f, JSON.stringify(doc));
    const good = await startStub({ readingFile: f }) as Stub; open.push(good);
    const base = await app({ env: stubEnv(good, { LIVE_READS_PER_HOUR: "3" }) });
    const body = { certificate_base64: pdf("cg-005"), delivery_csv: csv("ALB-2026-1003.csv"), delivery_line: "2", synthetic_confirmed: true };
    const j = await (await postJson(`${base}/api/live/read`, body)).json();
    expect(j.view.explanation.available).toBe(false);
    expect(j.view.explanation.text).toBeNull();
  });
  it("access code: wrong code rejected without consuming; throttled after repeated failures; never echoed", async () => {
    const s = await stub();
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "2", LIVE_ACCESS_CODE: "jury-code-77", LIVE_CODE_FAILURES_PER_HOUR: "2" }) });
    const st = await (await fetch(`${base}/api/live/status`)).text();
    expect(st).not.toContain("jury-code-77");
    expect(JSON.parse(st).access_code_required).toBe(true);
    expect((await postJson(`${base}/api/live/read`, liveBody({ access_code: "nope" }))).status).toBe(403);
    expect((await postJson(`${base}/api/live/read`, liveBody())).status).toBe(403);
    const throttled = await postJson(`${base}/api/live/read`, liveBody({ access_code: "nope" }));
    expect(throttled.status).toBe(429);
    expect((await (await fetch(`${base}/api/live/status`)).json()).remaining_this_hour).toBe("2");
    expect(s.state.chatCalls).toBe(0);
    const ok = await postJson(`${base}/api/live/read`, liveBody({ access_code: "jury-code-77" }));
    expect(ok.status).toBe(200);
    expect(await ok.text()).not.toContain("jury-code-77");
  });
  // S3-02: only 429 and 5xx are retried (at most 3 attempts); a timeout or an invalid reply is not.
  const c11: [string, string, number][] = [["timeout", "timeout", 1], ["http_429", "http_429", 3], ["http_5xx", "http_5xx", 3], ["invalid_json", "invalid_json", 1], ["huge", "invalid_json", 1]];
  for (const [mode, cls, calls] of c11) {
    it(`C11 through HTTP, stub mode ${mode}: status error, review, ${calls} call(s), counted once, no secret`, async () => {
      const s = await stub(mode);
      const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "5" }), adapterTimeoutMs: 300 });
      const text = await (await postJson(`${base}/api/live/read`, liveBody())).text();
      const j = JSON.parse(text);
      expect(j.counted).toBe(true);
      expect(j.view.status).toBe("error");
      expect(j.view.proposal).toBe("review");
      expect(j.view.reading_source).toBe("live_no_reading");
      expect(j.view.receipt.errors.at(-1).class).toBe(cls);
      expect(j.view.receipt.reader.calls).toBe(String(calls));
      expect(s.state.chatCalls).toBe(calls);
      expect(text).not.toContain("sk-stub-secret-123");
      expect((await (await fetch(`${base}/api/live/status`)).json()).remaining_this_hour).toBe("4");
    });
  }
});

describe("recorded stories (S3-18, D3-08, R3.3 C-23, B-12, B-23)", () => {
  const ids = ["cg-001", "cg-002", "cg-003"];
  const story = (id: string) => JSON.parse(readFileSync(path.join(ROOT, "public", "stories", `${id}.json`), "utf8"));
  const recording = (id: string) => JSON.parse(readFileSync(path.join(ROOT, "public", "stories", `${id}.recording.json`), "utf8"));
  it("are recorded real runs: labelled recorded with their date and the model as reported, never live; receipt and F1 snapshot kept", () => {
    for (const id of ids) {
      const st = story(id);
      const rec = recording(id);
      expect(st.stored).toBe(true);
      expect(st.recorded).toBe(true);
      expect(st.recorded_at).toBe(rec.recorded_at);
      expect(st.view.receipt.created_at).toBe(rec.recorded_at);
      expect(st.stored_label).toBe(`recorded real reading · ${rec.model_reported} via AMD Token Factory · ${rec.recorded_at} · not live`);
      expect(st.view.reading_label).toBe(st.stored_label);
      // No step of a story says live (I7): the reading step names the recording.
      expect(JSON.stringify(st.view.steps)).not.toMatch(/live endpoint|live reading from/);
      expect(st.view.steps.find((x: any) => x.name.startsWith("Model reading")).note).toBe(`read by the endpoint at ${rec.recorded_at}; stored, not live`);
      expect(st.view.reading_source).toBe("live");
      expect(st.view.receipt.reader.model_id).toBe(rec.model_reported);
      expect(rec.model_reported).not.toMatch(/MOCK|stub/i);
      expect(st.view.receipt.endpoint_response).toEqual(rec.endpoint_response);
      expect(st.view.receipt.f1.state).toBe("on");
      expect(st.view.receipt.f1.endpoint_name).toBe("AMD Token Factory");
      expect(rec.prompt_sha256).toBe("32fad2f980bcf755841d80bb2385d9601465f83b5b42c1b6c048f3bfe1cfb567");
      // The story shows whatever its recorded run proposed (C-23): no comparison with the dataset expectation here.
      expect(st.view.proposal).toBe(story(id).view.proposal);
    }
  });
  it("recordings keep the reply content only: no reasoning, no key, no endpoint URL value", () => {
    for (const id of ids) {
      const t = readFileSync(path.join(ROOT, "public", "stories", `${id}.recording.json`), "utf8");
      expect(t).not.toMatch(/"reasoning(_content)?"\s*:/);
      expect(t).not.toMatch(/Bearer |sk-|https?:\/\/(?!localhost)[^"<]*\/v1/);
    }
  });
  it("equal a replay of each recorded reply through the candidate's own pipeline (no endpoint call)", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "certgate-stories-"));
    await buildStories(dir);
    const strip = (s: any) => {
      const v = s.view;
      const r = v.receipt;
      return {
        proposal: v.proposal, reasons: v.reasons, rows: v.rows, label: s.stored_label, created_at: r.created_at,
        values: r.values, rule_results: r.rule_results, channel_checks: r.channel_checks, hashes: r.hashes,
        endpoint_response: r.endpoint_response, f1: r.f1, model_id: r.reader.model_id,
      };
    };
    for (const id of ids) {
      const fresh = JSON.parse(readFileSync(path.join(dir, `${id}.json`), "utf8"));
      expect(strip(fresh), id).toEqual(strip(story(id)));
    }
  });
  it("the cg-003 card makes no claim about which digit the model read (C-23)", () => {
    const texts = [readFileSync(path.join(ROOT, "public", "app.js"), "utf8"), readFileSync(path.join(ROOT, "public", "stories", "index.json"), "utf8")];
    for (const t of texts) expect(t).not.toMatch(/358 or 338|338 or 358/);
  });
  it("the served story file keeps its timestamp across loads; stories may be cached, the API not", async () => {
    const base = await app({ env: {} });
    const a = await fetch(`${base}/stories/cg-003.json`);
    expect(a.headers.get("cache-control")).toMatch(/max-age/);
    const t1 = (await a.json()).stored_at;
    const t2 = (await (await fetch(`${base}/stories/cg-003.json`)).json()).stored_at;
    expect(t1).toBe(t2);
  });
});

describe("confirmations and decisions through the API (S2-04, A-21, B-14, B-15)", () => {
  const confirmAll = (id: string, over: Record<string, string>) => {
    const r = expected(id).correct_reading as any;
    return CRITICAL_FIELDS.map((k) => { const [g, n] = k.split("."); const f = n ? r[g!][n] : r[g!]; return { field: k, value: over[k] ?? f.value }; });
  };
  it("cg-003 with every critical field confirmed and ReH 358 proposes release; only ReH stays review; 338 blocks", async () => {
    const base = await app({ env: {} });
    const all = await (await postJson(`${base}/api/stories/cg-003/evaluate`, { confirmations: confirmAll("cg-003", { "mechanical.ReH": "358" }), confirmed_by: "tech" })).json();
    expect(all.view.proposal).toBe("release");
    const one = await (await postJson(`${base}/api/stories/cg-003/evaluate`, { confirmations: [{ field: "mechanical.ReH", value: "358" }], confirmed_by: "tech" })).json();
    expect(one.view.proposal).toBe("review");
    const low = await (await postJson(`${base}/api/stories/cg-003/evaluate`, { confirmations: [{ field: "mechanical.ReH", value: "338" }], confirmed_by: "tech" })).json();
    expect(low.view.proposal).toBe("block");
  });
  it("release is rejected below the UI when the proposal is not release (API 409, core error)", async () => {
    const base = await app({ env: {} });
    const r = await postJson(`${base}/api/stories/cg-002/evaluate`, { decision: { action: "release", reason: "force", decided_by: "x" } });
    expect(r.status).toBe(409);
    const core = await runCase("cg-002");
    expect(() => recordHumanDecision(core, { action: "release", reason: "x", decided_by: "y", decided_at: "2026-10-12T18:00:00Z" })).toThrow(HumanDecisionError);
    const ok = await postJson(`${base}/api/stories/cg-002/evaluate`, { decision: { action: "block", reason: "Mn out of spec", decided_by: "q.manager" } });
    expect(ok.status).toBe(200);
  });
  it("decided_at and confirmed_at are stamped by the server clock, not the client", async () => {
    const c = new Clock();
    const base = await app({ env: {}, clock: c.now });
    const j = await (await postJson(`${base}/api/stories/cg-001/evaluate`, { decision: { action: "release", reason: "ok", decided_by: "q", decided_at: "1999-01-01T00:00:00Z" } })).json();
    expect(j.view.receipt.human_decision.at).toBe("2026-10-12T18:20:00.000Z");
  });
  it("unknown story ids are not served", async () => {
    const base = await app({ env: {} });
    expect((await postJson(`${base}/api/stories/cg-010/evaluate`, {})).status).toBe(404);
  });
});

describe("static UI files (S2-01, S2-08, S2-14, S2-26, S2-30, B-08, B-11, B-16, B-17, B-20)", () => {
  const files = ["index.html", "app.js", "styles.css", "figures.json", "stories/index.json", "stories/cg-001.json", "stories/cg-002.json", "stories/cg-003.json"];
  const all = files.map((f) => [f, readFileSync(path.join(ROOT, "public", f), "utf8")] as const);
  it("no HTML injection sinks in the client (B-16)", () => {
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(js).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/);
  });
  it("no third-party URL in any page or asset (B-17)", () => {
    // A cited source stored as text in receipts (the F1 endpoint source) is data shown with textContent, never fetched.
    const CITED = new Set(["https://notebooks.amd.com/tokenfactory"]);
    for (const [f, t] of all) expect((t.match(/https?:\/\/(?!localhost)[^\s"')\\]+/g) ?? []).filter((u) => !CITED.has(u)), f).toEqual([]);
  });
  it("no hardware claim the endpoint does not expose: only 'Runs on AMD' and 'AMD Token Factory' name AMD (B-11, S3-09, S3-12)", () => {
    for (const [f, t] of all) {
      expect(t, f).not.toMatch(/AMD Instinct|MI300|MI325|MI355|Model \(AMD\)|read on AMD|LIVE reading on AMD|AMD endpoint: on|ROCm \d|vLLM \d/i);
      expect(t.replace(/Runs on AMD/g, ""), f).not.toMatch(/on AMD/);
    }
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(js).toMatch(/GPU, ROCm and vLLM versions are not exposed by the endpoint/);
  });
  it("the endpoint pill says on only when the server's F1 state is on (B-11)", () => {
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(js).toMatch(/const on = r\.body\.state === "on";[\s\S]{0,200}text\.textContent = on\s*\? `Model endpoint: on/);
  });
  it("landing figures come only from public/figures.json, which regenerates byte-for-byte from the committed evaluation artifacts (S3-19, C-08, C-11)", async () => {
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    // Every figure slot is a template over fg.*: no figure value or denominator is typed in the page.
    const figs = [...js.matchAll(/^\s+fig\((.*)\)[,)]*$/gm)].map((m) => m[1]!);
    expect(figs.length).toBe(4);
    for (const f of figs) expect(f.replace(/fg\.[A-Za-z_.]+/g, "")).not.toMatch(/\d/);
    expect(js).toMatch(/api\("\/figures\.json"\)/);
    const committed = JSON.parse(readFileSync(path.join(ROOT, "public", "figures.json"), "utf8"));
    // @ts-expect-error plain JS tool
    const { buildFigures } = await import("../tools/evaluate/figures.mjs");
    expect(buildFigures(path.join(ROOT, committed.generated_from))).toEqual(committed);
    // FC-broad is shown with FC-strict beside it (C-08); cost is the endpoint's, with the fixed label.
    expect(js).toMatch(/fg\.false_conforming\.broad\.n[\s\S]{0,200}fg\.false_conforming\.strict\.n/);
    expect(committed.cost_per_certificate.label).toBe("cost reported by the endpoint; Token Factory credits are free and have no monetary value");
    expect(committed.evaluated_cases).toBe("27");
    expect(committed.excluded_cases).toEqual(["cg-001", "cg-002", "cg-003"]);
  });
  it("states where AMD fits (the model served by AMD Token Factory) and that the model only reads; limit is per instance (S2-30, S3-21, C-04, B-08)", () => {
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(js).toMatch(/served by AMD Token Factory/);
    expect(js).toMatch(/The model only reads; it never explains or decides/);
    expect(js).not.toMatch(/In this build no AMD hardware is used/);
    expect(js).not.toMatch(/mock reader stands in/);
    expect(js).toMatch(/per server instance in this build/);
    expect(js).not.toMatch(/guarantee/i);
  });
  it("every screen carries the fictitious-data notice (S2-07)", () => {
    expect(readFileSync(path.join(ROOT, "public", "index.html"), "utf8")).toMatch(/Fictitious demo data[\s\S]*TRN-355[\s\S]*ESP-014/);
  });
  it("the browser receives no key or code: none in static files; responses checked above (S2-26)", () => {
    for (const [f, t] of all) expect(t, f).not.toMatch(/MODEL_API_KEY|LIVE_ACCESS_CODE/);
  });
});
