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
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { CRITICAL_FIELDS } from "../src/fields.js";

type Stub = { url: string; state: { mode: string; chatCalls: number; lastAuthorization: string | null; lastModel: string | null }; close: () => Promise<void> };
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
  MODEL_BASE_URL: s.url, MODEL_ID: STUB_MODEL_ID, GPU_INFO_URL: `${s.url}/gpu-info`, MODEL_API_KEY: "sk-stub-secret-123", ...extra,
});
const pdf = (id: string) => readFileSync(path.join(DATA, "cases", id, "certificate.pdf")).toString("base64");
const csv = (note = "ALB-2026-0917.csv") => readFileSync(path.join(DATA, "delivery", note), "utf8");
const liveBody = (extra: Record<string, unknown> = {}) => ({ certificate_base64: pdf("cg-001"), delivery_csv: csv(), delivery_line: "1", ...extra });
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
  it("with the test stub: shows exactly what the endpoint and sidecar report; cost unknown without a price", async () => {
    const s = await stub();
    const base = await app({ env: stubEnv(s) });
    const f = await (await fetch(`${base}/api/f1`)).json();
    expect(f.state).toBe("on");
    expect(f.model_ids).toEqual([STUB_MODEL_ID]);
    expect(f.gpu).toBe("TEST STUB (no GPU)");
    expect(f.rocm_version).toBe("stub-0");
    expect(f.cost_estimate_usd).toBeNull();
  });
  it("request parameters, headers or body cannot set the endpoint (B-06)", async () => {
    const s = await stub();
    const base = await app({ env: {} });
    const f = await (await fetch(`${base}/api/f1?base=${encodeURIComponent(s.url)}&MODEL_BASE_URL=${encodeURIComponent(s.url)}`, { headers: { "x-model-base-url": s.url } })).json();
    expect(f.state).toBe("off");
  });
  it("cost estimate uses only the configured price (S2-36)", async () => {
    const { costEstimate } = await import("../src/web/f1.js");
    expect(costEstimate("3600000", "1.99")).toBe("1.99");
    expect(costEstimate("1800", null)).toBeNull();
    const src = readFileSync(path.join(ROOT, "src", "web", "f1.ts"), "utf8");
    expect(src).not.toMatch(/1\.99/);
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
    const base = await app({ env: stubEnv(s, { LIVE_READS_PER_HOUR: "2" }) });
    const res = await postJson(`${base}/api/live/read`, { certificate_base64: Buffer.from("not a pdf").toString("base64") });
    expect(res.status).toBe(400);
    expect((await (await fetch(`${base}/api/live/status`)).json()).remaining_this_hour).toBe("2");
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
  const c11: [string, string, number][] = [["timeout", "timeout", 3], ["http_429", "http_429", 3], ["http_5xx", "http_5xx", 3], ["invalid_json", "invalid_json", 1], ["huge", "invalid_json", 1]];
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

describe("stored stories (S2-14, B-12, B-23)", () => {
  const ids = ["cg-001", "cg-002", "cg-003"];
  it("are versioned static files labelled stored and mock, with the run's own created_at", () => {
    for (const id of ids) {
      const st = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", `${id}.json`), "utf8"));
      expect(st.stored).toBe(true);
      expect(st.stored_at).toBe(st.view.receipt.created_at);
      expect(st.stored_label).toBe(`stored · mock reading, no model · ${st.view.receipt.created_at}`);
      expect(st.view.reading_source).toBe("mock");
      expect(st.view.receipt.reader.model_id).toMatch(/^MOCK/);
      expect(st.view.receipt.f1.state).toBe("not_applicable_mock");
      expect(st.view.proposal).toBe(expected(id).expected_proposal);
    }
  });
  it("equal a fresh run of the candidate's own pipeline, apart from ids, timestamps and timings", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "certgate-stories-"));
    await buildStories(dir);
    const strip = (s: any) => {
      const v = structuredClone(s.view);
      for (const k of ["run_id", "created_at", "timings_ms"]) delete v.receipt[k];
      v.steps = v.steps.map((x: any) => ({ ...x, duration_ms: null }));
      return { proposal: v.proposal, reasons: v.reasons, rows: v.rows, receipt: v.receipt };
    };
    for (const id of ids) {
      const committed = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", `${id}.json`), "utf8"));
      const fresh = JSON.parse(readFileSync(path.join(dir, `${id}.json`), "utf8"));
      expect(strip(fresh)).toEqual(strip(committed));
    }
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
  const files = ["index.html", "app.js", "styles.css", "stories/index.json", "stories/cg-001.json", "stories/cg-002.json", "stories/cg-003.json"];
  const all = files.map((f) => [f, readFileSync(path.join(ROOT, "public", f), "utf8")] as const);
  it("no HTML injection sinks in the client (B-16)", () => {
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(js).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/);
  });
  it("no third-party URL in any page or asset (B-17)", () => {
    for (const [f, t] of all) expect(t.match(/https?:\/\/(?!localhost)[^\s"')]+/g) ?? [], f).toEqual([]);
  });
  it("no AMD-run claims: only the panel name 'Runs on AMD' (B-11, D2-02)", () => {
    for (const [f, t] of all) {
      expect(t, f).not.toMatch(/real runs|AMD Instinct|Model \(AMD\)|read on AMD|LIVE reading on AMD|AMD endpoint: on/i);
      expect(t.replace(/Runs on AMD/g, ""), f).not.toMatch(/on AMD/);
    }
  });
  it("the endpoint pill says on only when the server's F1 state is on (B-11)", () => {
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(js).toMatch(/const on = r\.body\.state === "on";[\s\S]{0,200}text\.textContent = on\s*\? `Model endpoint: on/);
  });
  it("landing figures are placeholders with no digit in any figure slot (S2-01, B-20)", () => {
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    const figs = [...js.matchAll(/fig\("([^"]*)",\s*"([^"]*)"\)/g)];
    expect(figs.length).toBe(4);
    for (const [, val, label] of figs) {
      expect(val).toMatch(/^\[[^\]]+\]$/);
      expect(val + label).not.toMatch(/\d/);
    }
    expect(js).toContain("MEASURED ON [N] FICTITIOUS CERTIFICATES");
  });
  it("states where AMD fits and that nothing runs on AMD in this build; limit is per instance (S2-30, B-08)", () => {
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(js).toMatch(/In this build no AMD hardware is used/);
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
