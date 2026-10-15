// Stage 8 (dispatch 6, amendment 1; register R8.0-R8.2): the model choice through HTTP. These tests use the
// product's own model catalog (no test seam, Q-10) and a local TEST STUB that lists chosen model ids
// (test/support/stub-endpoint.mjs): the stub is not a model; it echoes a dataset reading and reports the model it
// is asked for, prefixed like the endpoint does.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import type { AppDeps } from "../src/web/app.js";
import { clearF1Cache } from "../src/web/f1.js";
import { KEYS, REASONS } from "../src/web/live-jobs.js";
import { MemoryStore } from "../src/web/live-store.js";
import { EXPERIMENTAL_MODELS, MEASURED_MODELS, PROBE_OUTCOMES } from "../src/web/models.js";
import { DATA, ROOT } from "./helpers.js";
import { loadApp } from "./support/fake-dom.js";
// @ts-expect-error plain JS helper
import { startStub } from "./support/stub-endpoint.mjs";
// @ts-expect-error plain JS helper
import { isStage8New, STAGE8_MAY_CHANGE, STAGE8_NEW } from "./support/stage8.mjs";
// @ts-expect-error plain JS helper
import { record } from "./support/disabled-golden.mjs";

const Q = MEASURED_MODELS[0]!.id;
const G = MEASURED_MODELS[1]!.id;
const X = EXPERIMENTAL_MODELS[0]!.id;
const X2 = EXPERIMENTAL_MODELS[1]!.id;
const KEY = "sk-stage8-key-sentinel-77a1";
const CODE = "stage8-code-sentinel-4k2q9";
const FAST = { pollMs: 20, queueMaxWaitMs: 20_000, readBudgetMs: 20_000, deadlineMs: 40_000, staleGraceMs: 10_000, leaseTtlMs: 45_000, marginMs: 0 };
const deployedEnv = (url: string, extra: Record<string, string> = {}) => ({ VERCEL: "1", MODEL_BASE_URL: url, MODEL_API_KEY: KEY, MODEL_ID: Q, LIVE_READS_PER_HOUR: "10", LIVE_ACCESS_CODE: CODE, ...extra });
const ALL = [Q, G, ...EXPERIMENTAL_MODELS.map((m) => m.id)].join(",");

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
  const s = await startStub({ caseId: "cg-004", reportedModel: (m: string) => `self-dploy/${m}`, ...opts });
  open.push(s);
  return s;
}
const seen: string[] = [];
async function call(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  seen.push(text, JSON.stringify([...res.headers.entries()]));
  let body: Record<string, any> = {};
  try { body = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, body, text };
}
const cert = (id = "cg-004") => readFileSync(path.join(DATA, "cases", id, "certificate.pdf")).toString("base64");
function post(base: string, extra: Record<string, unknown> = {}, code: string | null = CODE) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (code !== null) headers["x-live-access-code"] = code;
  return call(`${base}/api/live/jobs`, { method: "POST", headers, body: JSON.stringify({ certificate_base64: cert(), synthetic_confirmed: true, ...extra }) });
}
async function poll(base: string, id: string, ms = 20_000) {
  const t0 = Date.now();
  for (;;) {
    const v = await call(`${base}/api/live/jobs/${id}`);
    if (v.body.state === "done" || v.body.state === "failed") return v.body;
    if (Date.now() - t0 > ms) throw new Error(`job ${id} still ${v.body.state}`);
    await new Promise((r) => setTimeout(r, 20));
  }
}
/** Every store key and its value, except the F1 cache and a code-attempt key that the code check counted and gave back. */
function snapshot(store: MemoryStore) {
  const s = store as unknown as { values: Map<string, { v: string }>; zsets: Map<string, Map<string, number>> };
  const values = [...s.values.entries()].filter(([k]) => !k.startsWith(KEYS.f1)).filter(([k, v]) => !(k.includes(":codefail:c:") && v.v === "0")).map(([k, v]) => [k, v.v]);
  const zsets = [...s.zsets.entries()].map(([k, z]) => [k, [...z.keys()]]);
  return JSON.stringify({ values, zsets });
}

describe("status: the three groups from the cached probe, with the product catalog (S8-04, S8-21…S8-23, Q-10)", () => {
  it("LIVE_MODELS set: measured, experimental and listed-not-offered, every listed id once, with the probe's own time", async () => {
    const s = await stub({ models: [{ id: `self-dploy/${Q}` }, { id: X }, { id: "Txt-Only", output: ["text"], architecture: { input_modalities: ["text"] } }, { id: PROBE_OUTCOMES[0]!.id }, { id: "MinerU2.5-Pro" }, { id: "Never-Probed" }] });
    const base = await serve({ env: deployedEnv(s.url, { LIVE_MODELS: ALL }), liveStore: new MemoryStore(), liveBudget: FAST });
    const f1 = (await call(`${base}/api/f1`)).body;
    const st = (await call(`${base}/api/live/status`)).body;
    expect(st.enabled).toBe(true);
    const m = st.models;
    expect(m.checked_at).toBe(f1.checked_at);
    expect(m.default).toBe(Q);
    expect(m.measured.map((x: any) => [x.id, x.enabled, x.state])).toEqual([[Q, true, `listed by the endpoint, checked ${f1.checked_at}`], [G, false, `not listed by the endpoint now (checked ${f1.checked_at})`]]);
    expect(m.experimental.map((x: any) => x.id)).toEqual(EXPERIMENTAL_MODELS.map((x) => x.id));
    expect(m.experimental.filter((x: any) => x.enabled).map((x: any) => x.id)).toEqual([X]);
    for (const x of m.experimental) expect(x).toMatchObject({ evaluated: false, acknowledgement: "this model is not evaluated; no figure of CertGate applies to it" });
    expect(m.listed_not_offered).toEqual([
      { id: "Txt-Only", reason: "no image probe" }, { id: PROBE_OUTCOMES[0]!.id, reason: "probe failed" }, { id: "MinerU2.5-Pro", reason: "not a chat model" }, { id: "Never-Probed", reason: "no image probe" },
    ]);
    for (const x of m.experimental) expect(Object.keys(x).sort()).toEqual(["acknowledgement", "enabled", "evaluated", "evidence", "id", "label", "probed_at", "state"]);
    expect(JSON.stringify(m.experimental)).not.toMatch(/figures|metrics|evaluation\/runs|real-candidate|real-gemma/i);
  });
  it("LIVE_MODELS unset: only MODEL_ID is selectable; Gemma stays in (a) as not enabled; experimental ids go to (c) as not enabled (A8-14, L-26)", async () => {
    const s = await stub({ models: [Q, G, X] });
    const base = await serve({ env: deployedEnv(s.url), liveStore: new MemoryStore(), liveBudget: FAST });
    const m = (await call(`${base}/api/live/status`)).body.models;
    expect(m.measured.map((x: any) => [x.id, x.enabled, x.state.split(",")[0]])).toEqual([[Q, true, "listed by the endpoint"], [G, false, "not enabled on this site"]]);
    expect(m.experimental).toEqual([]);
    expect(m.listed_not_offered).toEqual([{ id: X, reason: "not enabled on this site" }]);
    expect(m.selectable).toBe(1);
  });
  it("an unmeasured MODEL_ID with LIVE_MODELS unset disables live reading with its reason; the id is in the log, not in a response (L-13)", async () => {
    const s = await stub({ models: [Q, "Llama-x"] });
    const warn: string[] = [];
    const orig = console.warn;
    console.warn = (x: string) => { warn.push(String(x)); };
    let st: Record<string, any>;
    try {
      const base = await serve({ env: deployedEnv(s.url, { MODEL_ID: "Llama-x" }), liveStore: new MemoryStore(), liveBudget: FAST });
      st = (await call(`${base}/api/live/status`)).body;
    } finally { console.warn = orig; }
    expect(st).toMatchObject({ enabled: false, reason: "no measured or probed model is enabled on this site", remaining_this_hour: "0" });
    expect(warn.join("\n")).toContain("\"Llama-x\"");
  });
  it("nothing offered is listed: disabled with the listing reason and its time; an experimental-only listing stays enabled with no default (L-24)", async () => {
    const s = await stub({ models: ["Other"] });
    const base = await serve({ env: deployedEnv(s.url, { LIVE_MODELS: ALL }), liveStore: new MemoryStore(), liveBudget: FAST });
    const st = (await call(`${base}/api/live/status`)).body;
    expect(st.enabled).toBe(false);
    expect(st.reason).toBe(`no offered model is listed by the endpoint now (checked ${st.models.checked_at})`);
    clearF1Cache();
    const s2 = await stub({ models: [X] });
    const base2 = await serve({ env: deployedEnv(s2.url, { LIVE_MODELS: ALL }), liveStore: new MemoryStore(), liveBudget: FAST });
    const st2 = (await call(`${base2}/api/live/status`)).body;
    expect(st2).toMatchObject({ enabled: true, models: { default: null, selectable: 1 } });
  });
  it("with live reading disabled the existing routes answer byte for byte as the golden (L-07), with the product catalog", async () => {
    const golden = JSON.parse(readFileSync(path.join(ROOT, "test", "fixtures", "stage6-disabled-golden.json"), "utf8"));
    const now = await record(createApp);
    for (const k of Object.keys(now)) for (const a of now[k]) if (a.path === "/api/stories/cg-003/evaluate") a.body = a.body.replace(/("reading_source":\s*"live",)\s*"recorded":\s*true,\s*"recorded_at":\s*"<time>",/, "$1");
    expect(now).toEqual(golden);
  });
});

describe("POST refusals before any model call, queue entry or count (S8-06, S8-25, L-04, L-09, L-23, Q-01, Q-03, Q-06)", () => {
  async function setup(models: unknown[] = [Q, X, "Txt-Only", "MinerU2.5-Pro"], extra: Record<string, string> = { LIVE_MODELS: ALL }) {
    const s = await stub({ models });
    const store = new MemoryStore();
    const base = await serve({ env: deployedEnv(s.url, extra), liveStore: store, liveBudget: FAST });
    await call(`${base}/api/f1`);
    return { s, store, base };
  }
  async function refused(ctx: { s: any; store: MemoryStore; base: string }, extra: Record<string, unknown>, cls: keyof typeof REASONS, status: number) {
    const before = snapshot(ctx.store);
    const chats = ctx.s.state.chatCalls;
    const r = await post(ctx.base, extra);
    expect({ status: r.status, body: r.body }, JSON.stringify(extra)).toEqual({ status, body: { status: "rejected", reason_class: cls, error: REASONS[cls] } });
    expect(ctx.s.state.chatCalls, JSON.stringify(extra)).toBe(chats);
    expect(snapshot(ctx.store), JSON.stringify(extra)).toBe(before);
  }
  it("missing, empty or non-string model: model_missing", async () => {
    const c = await setup();
    for (const model of [undefined, "", 123, [Q], { toLowerCase: 1 }, null, true]) await refused(c, model === undefined ? {} : { model }, "model_missing", 400);
  });
  it("a model outside the offer (unmeasured, unprobed, listed-not-offered, padded, look-alike, prefixed): model_not_offered", async () => {
    const c = await setup();
    for (const model of ["Llama-x", "Txt-Only", "MinerU2.5-Pro", PROBE_OUTCOMES[0]!.id, ` ${Q} `, "Qwen3.8‑27B", `self-dploy/${Q}`, `${Q}-FP8`]) await refused(c, { model }, "model_not_offered", 400);
  });
  it("LIVE_MODELS cannot promote a listed id that is in neither set (L-28)", async () => {
    const c = await setup([Q, "Llama-x"], { LIVE_MODELS: `${Q},Llama-x` });
    await refused(c, { model: "Llama-x" }, "model_not_offered", 400);
  });
  it("an experimental model without the acknowledgement, or with anything but true: model_ack_required", async () => {
    const c = await setup();
    for (const ack of [undefined, "true", 1, "yes", false, null, {}]) await refused(c, ack === undefined ? { model: X } : { model: X, not_evaluated_acknowledged: ack }, "model_ack_required", 400);
  });
  it("an offered model the endpoint does not list now: model_unlisted", async () => {
    const c = await setup();
    await refused(c, { model: G }, "model_unlisted", 409);
    await refused(c, { model: X2, not_evaluated_acknowledged: true }, "model_unlisted", 409);
  });
  it("a stale, future-dated or lock-held listing never validates: probe_unavailable (L-01, L-02, Q-03)", async () => {
    const c = await setup();
    const snap = JSON.parse((await c.store.get(KEYS.f1))!);
    await c.store.set(KEYS.f1, JSON.stringify({ ...snap, checked_at: new Date(Date.now() - 61_000).toISOString() }), 60);
    await refused(c, { model: Q }, "probe_unavailable", 503);
    await c.store.set(KEYS.f1, JSON.stringify({ ...snap, checked_at: new Date(Date.now() + 120_000).toISOString() }), 60);
    await refused(c, { model: Q }, "probe_unavailable", 503);
    // Another instance holds the lock and only an old f1:last exists: the POST waits briefly, then refuses.
    const s = await stub({ models: [Q] });
    const store = new MemoryStore();
    await store.setNx(KEYS.f1Lock, "other-instance", 60_000);
    await store.set(KEYS.f1Last, JSON.stringify({ ...snap, checked_at: new Date(Date.now() - 61_000).toISOString() }), 3600);
    const base = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
    await refused({ s, store, base }, { model: Q }, "probe_unavailable", 503);
    expect(s.state.modelsCalls).toBe(0);
  });
  it("the name, offer and acknowledgement checks need no probe: with an empty store they make no GET /models (Q-06)", async () => {
    const s = await stub({ models: [Q, X] });
    const store = new MemoryStore();
    const base = await serve({ env: deployedEnv(s.url, { LIVE_MODELS: ALL }), liveStore: store, liveBudget: FAST });
    for (const extra of [{}, { model: "Llama-x" }, { model: X }]) {
      const r = await post(base, extra);
      expect(r.status).toBe(400);
    }
    expect(s.state.modelsCalls).toBe(0);
    expect(s.state.chatCalls).toBe(0);
  });
  it("code order (CH8-10): a wrong code with a bad model is the code refusal, with no probe; a correct code with a bad model forgives the attempt", async () => {
    const s = await stub({ models: [Q] });
    const store = new MemoryStore();
    const base = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
    const wrong = await post(base, { model: "Llama-x" }, "wrong-code");
    expect(wrong.status).toBe(403);
    expect(s.state.modelsCalls).toBe(0);
    const st = (await call(`${base}/api/live/status`)).body;
    expect(st.code_failures_this_hour_this_client).toBe("1");
    const bad = await post(base, { model: "Llama-x" });
    expect(bad.body.reason_class).toBe("model_not_offered");
    expect((await call(`${base}/api/live/status`)).body.code_failures_this_hour_this_client).toBe("1");
    expect((await call(`${base}/api/live/status`)).body.used_this_hour).toBe("0");
  });
  it("in the container with no code, a non-dataset upload is refused by the upload policy before any model check (CH8-10 d)", async () => {
    const s = await stub({ models: [Q] });
    const base = await serve({ env: { MODEL_BASE_URL: s.url, MODEL_API_KEY: KEY, MODEL_ID: Q, LIVE_READS_PER_HOUR: "3" }, liveBudget: FAST });
    const r = await call(`${base}/api/live/jobs`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ certificate_base64: Buffer.from("%PDF-1.4 not a dataset file").toString("base64"), synthetic_confirmed: true, model: "Llama-x" }) });
    expect(r.status).toBe(403);
    expect(r.body.reason_class).toBeUndefined();
  });
});

describe("readings: the chosen model, its receipt, no fallback (S8-07, S8-08, S8-24, L-11, L-12, L-25, L-C1, L-C2, Q-05)", () => {
  it("a measured model named in any ASCII case is read with the constant's id; the receipt and its F1 copy say requested, reported and evaluated", async () => {
    const s = await stub({ models: [`self-dploy/${Q}`] });
    const store = new MemoryStore();
    const base = await serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST });
    const r = await post(base, { model: "qwen3.8-27b" });
    expect(r.status).toBe(202);
    expect(r.body).toMatchObject({ model_requested: Q, model_group: "measured", evaluated: true });
    const v = await poll(base, r.body.job_id);
    expect(v).toMatchObject({ state: "done", model_requested: Q, model_group: "measured", evaluated: true, model_reported: `self-dploy/${Q}`, listing_checked_at: r.body.listing_checked_at });
    expect(s.state.requestedModels).toEqual([Q]);
    const rc = v.result.view.receipt;
    expect(rc.model_choice).toEqual({ requested: Q, reported: `self-dploy/${Q}`, group: "measured", evaluated: true, label: "evaluated: measured model", figures: { metrics_section: MEASURED_MODELS[0]!.metrics_section, runs: [...MEASURED_MODELS[0]!.runs] }, probe_evidence: null, listing_checked_at: r.body.listing_checked_at });
    expect(rc.f1).toMatchObject({ model_requested: Q, model_evaluated: true, model_probe_evidence: null, model_reported: `self-dploy/${Q}` });
    expect(rc.reader).toMatchObject({ requested_model_id: Q, model_id: `self-dploy/${Q}` });
    expect(rc.reading_source).toBe("live");
    // The shared cached F1 copy never carries a job's model choice (L-11).
    expect(await store.get(KEYS.f1)).not.toMatch(/model_requested|model_evaluated/);
  });
  it("an experimental model with the acknowledgement is read and labelled not evaluated, with its probe evidence and no figure", async () => {
    const s = await stub({ models: [Q, X] });
    const base = await serve({ env: deployedEnv(s.url, { LIVE_MODELS: ALL }), liveStore: new MemoryStore(), liveBudget: FAST });
    const r = await post(base, { model: X, not_evaluated_acknowledged: true });
    expect(r.status).toBe(202);
    const v = await poll(base, r.body.job_id);
    expect(v).toMatchObject({ state: "done", model_group: "experimental", evaluated: false });
    const rc = v.result.view.receipt;
    expect(rc.model_choice).toMatchObject({ requested: X, group: "experimental", evaluated: false, label: "not evaluated", figures: null, probe_evidence: EXPERIMENTAL_MODELS[0]!.evidence });
    expect(rc.f1).toMatchObject({ model_requested: X, model_evaluated: false, model_probe_evidence: EXPERIMENTAL_MODELS[0]!.evidence });
    expect(JSON.stringify(v)).not.toMatch(/real-candidate-dd557fd|real-gemma|figures\.json|Headline/);
    expect(s.state.requestedModels).toEqual([X]);
  });
  it("two concurrent jobs, one per model: each receipt carries its own requested and reported model", async () => {
    const s = await stub({ models: [Q, X], delayMs: 100 });
    const base = await serve({ env: deployedEnv(s.url, { LIVE_MODELS: ALL }), liveStore: new MemoryStore(), liveBudget: FAST });
    const [a, b] = await Promise.all([post(base, { model: Q }), post(base, { model: X, not_evaluated_acknowledged: true })]);
    const [va, vb] = await Promise.all([poll(base, a.body.job_id), poll(base, b.body.job_id)]);
    expect([va.result.view.receipt.model_choice.requested, va.result.view.receipt.model_choice.reported, va.result.view.receipt.f1.model_requested]).toEqual([Q, `self-dploy/${Q}`, Q]);
    expect([vb.result.view.receipt.model_choice.requested, vb.result.view.receipt.model_choice.reported, vb.result.view.receipt.f1.model_requested]).toEqual([X, `self-dploy/${X}`, X]);
  });
  it("a near-miss reported id is model_mismatch, keeping the reported id; the prefix form passes (L-C1)", async () => {
    const s = await stub({ models: [Q], reportedModel: (m: string) => `${m}-FP8` });
    const base = await serve({ env: deployedEnv(s.url), liveStore: new MemoryStore(), liveBudget: FAST });
    const v = await poll(base, (await post(base, { model: Q })).body.job_id);
    expect(v).toMatchObject({ state: "failed", reason_class: "model_mismatch", model_reported: `${Q}-FP8`, result: null });
  });
  it("a refusal by the endpoint (4xx) fails the job; no other model is ever asked and nothing stored is shown (S8-07)", async () => {
    const s = await stub({ models: [Q, X], mode: "http_4xx" });
    const base = await serve({ env: deployedEnv(s.url, { LIVE_MODELS: ALL }), liveStore: new MemoryStore(), liveBudget: FAST, backoffBaseMs: 1 });
    const v = await poll(base, (await post(base, { model: X, not_evaluated_acknowledged: true })).body.job_id);
    expect(v).toMatchObject({ state: "failed", reason_class: "endpoint_4xx", result: null, model_reported: null });
    expect(new Set(s.state.requestedModels)).toEqual(new Set([X]));
  });
  it("a job that fails before any reply records reported null (A8-07)", async () => {
    const s = await stub({ models: [Q], mode: "http_5xx" });
    const base = await serve({ env: deployedEnv(s.url), liveStore: new MemoryStore(), liveBudget: FAST, backoffBaseMs: 1 });
    const v = await poll(base, (await post(base, { model: Q })).body.job_id);
    expect(v).toMatchObject({ state: "failed", reason_class: "endpoint_5xx", model_reported: null, model_requested: Q });
  });
  it("the time budget does not depend on the model: a slow reading times out honestly at the deadline for every offered model (S8-14, L-14, L-29)", async () => {
    const budget = { ...FAST, readBudgetMs: 300, deadlineMs: 600 };
    for (const [model, ack] of [[Q, undefined], [G, undefined], [X, true]] as const) {
      clearF1Cache();
      const s = await stub({ models: [Q, G, X], delayMs: 2_000 });
      const base = await serve({ env: deployedEnv(s.url, { LIVE_MODELS: ALL }), liveStore: new MemoryStore(), liveBudget: budget, backoffBaseMs: 1 });
      const r = await post(base, { model, ...(ack ? { not_evaluated_acknowledged: true } : {}) });
      const t0 = Date.now();
      const v = await poll(base, r.body.job_id, 5_000);
      expect(v, model).toMatchObject({ state: "failed", reason_class: "timeout", result: null });
      expect(Date.now() - t0, model).toBeLessThan(1_500);
      expect(new Set(s.state.requestedModels ?? [model]), model).toEqual(new Set([model]));
    }
  });
});

describe("the request body through the job path differs from the Stage 7 request only in the model id (S8-12, A8-06, T8-02)", () => {
  async function builderBody(modelId: string, caseId: string) {
    const { LiveReader } = await import("../src/web/live-reader.js");
    let seen = "";
    const { createServer } = await import("node:http");
    const server = createServer((req, res) => { let b = ""; req.on("data", (c) => { b += c; }); req.on("end", () => { seen ||= b; res.writeHead(500); res.end("{}"); }); }).listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    const reader = new LiveReader({ baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`, modelId, apiKey: "x", backoffBaseMs: 1 });
    await reader.read({ case_id: `upload-${createHash("sha256").update(readFileSync(path.join(DATA, "cases", caseId, "certificate.pdf"))).digest("hex").slice(0, 12)}`, certificate: new Uint8Array(readFileSync(path.join(DATA, "cases", caseId, "certificate.pdf"))) }).catch(() => undefined);
    await new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); });
    return seen;
  }
  it("for Qwen3.8-27B, Gemma-4-31B-IT and an experimental model, on cg-004 and cg-021: the body sent equals the unchanged builder's body for that id", async () => {
    for (const caseId of ["cg-004", "cg-021"]) {
      for (const [model, ack] of [[Q, undefined], [G, undefined], [X, true]] as const) {
        clearF1Cache();
        const s = await stub({ models: [Q, G, X] });
        const base = await serve({ env: deployedEnv(s.url, { LIVE_MODELS: ALL }), liveStore: new MemoryStore(), liveBudget: FAST });
        const r = await call(`${base}/api/live/jobs`, { method: "POST", headers: { "content-type": "application/json", "x-live-access-code": CODE }, body: JSON.stringify({ certificate_base64: cert(caseId), synthetic_confirmed: true, model, ...(ack ? { not_evaluated_acknowledged: true } : {}) }) });
        await poll(base, r.body.job_id);
        expect(s.state.bodies.length, `${caseId} ${model}`).toBe(1);
        expect(s.state.bodies[0], `${caseId} ${model}`).toBe(await builderBody(model, caseId));
        expect(JSON.parse(s.state.bodies[0]).model).toBe(model);
      }
    }
  });
});

describe("the legacy one-request route (L-05, CF-07, T8-37)", () => {
  const body = () => JSON.stringify({ certificate_base64: cert(), synthetic_confirmed: true, model: X });
  it("in the container it reads only MODEL_ID canonicalised against the measured set, listed now; otherwise refused with no call and nothing counted", async () => {
    for (const env of [{ MODEL_ID: "Llama-x" }, { MODEL_ID: "" }, { MODEL_ID: G }]) {
      clearF1Cache();
      const s = await stub({ models: [Q, "Llama-x", X] });
      const base = await serve({ env: { MODEL_BASE_URL: s.url, MODEL_API_KEY: KEY, LIVE_READS_PER_HOUR: "3", LIVE_MODELS: ALL, ...env } });
      const r = await call(`${base}/api/live/read`, { method: "POST", headers: { "content-type": "application/json" }, body: body() });
      expect(r.status, JSON.stringify(env)).toBe(409);
      expect(s.state.chatCalls, JSON.stringify(env)).toBe(0);
      expect((await call(`${base}/api/live/status`)).body.used_this_hour, JSON.stringify(env)).toBe("0");
    }
    clearF1Cache();
    const s = await stub({ models: [Q, X] });
    const base = await serve({ env: { MODEL_BASE_URL: s.url, MODEL_API_KEY: KEY, LIVE_READS_PER_HOUR: "3", MODEL_ID: "qwen3.8-27b" } });
    const r = await call(`${base}/api/live/read`, { method: "POST", headers: { "content-type": "application/json" }, body: body() });
    expect(r.status).toBe(200);
    expect(s.state.requestedModels).toEqual([Q]);
  });
  it("a reply that names another model is model_mismatch on the legacy route too: 502, nothing read is shown (F8-A01)", async () => {
    for (const reported of [G, `${Q}-FP8`, `xQwen3.8-27B`]) {
      clearF1Cache();
      const s = await stub({ models: [Q], reportedModel: reported });
      const base = await serve({ env: { MODEL_BASE_URL: s.url, MODEL_API_KEY: KEY, MODEL_ID: Q, LIVE_READS_PER_HOUR: "3" } });
      const r = await call(`${base}/api/live/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ certificate_base64: cert(), synthetic_confirmed: true }) });
      expect({ status: r.status, body: r.body }, reported).toEqual({ status: 502, body: { status: "rejected", reason_class: "model_mismatch", error: REASONS.model_mismatch } });
      expect(s.state.chatCalls, reported).toBe(1);
      expect(r.text, reported).not.toMatch(/"view"|"receipt"|reading_source/);
    }
    clearF1Cache();
    const s = await stub({ models: [Q] });
    const base = await serve({ env: { MODEL_BASE_URL: s.url, MODEL_API_KEY: KEY, MODEL_ID: Q, LIVE_READS_PER_HOUR: "3" } });
    const ok = await call(`${base}/api/live/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ certificate_base64: cert(), synthetic_confirmed: true }) });
    expect(ok.status).toBe(200);
    expect(ok.body.view.receipt.reader.model_id).toBe(`self-dploy/${Q}`);
  });
  it("on the deployed site it stays 503, with or without a model in the body", async () => {
    const s = await stub({ models: [Q] });
    const base = await serve({ env: deployedEnv(s.url), liveStore: new MemoryStore(), liveBudget: FAST });
    for (const b of [body(), JSON.stringify({ certificate_base64: cert(), synthetic_confirmed: true })]) {
      const r = await call(`${base}/api/live/read`, { method: "POST", headers: { "content-type": "application/json" }, body: b });
      expect(r.status).toBe(503);
    }
    expect(s.state.chatCalls).toBe(0);
  });
});

describe("one GET /models per period across instances, with the shortened copy and the released lock (Q-02, DN8-01)", () => {
  it("3 instances on one store, traffic every 5 s for 10 simulated minutes: at most 11 upstream probes", async () => {
    let t = Date.parse("2026-10-15T20:00:00.000Z");
    const clock = () => new Date(t);
    const store = new MemoryStore(() => t);
    // Separate stubs give each instance its own in-process probe cache, as separate Vercel instances have.
    const stubs = await Promise.all([0, 1, 2].map(() => stub({ models: [Q] })));
    const bases = await Promise.all(stubs.map((s) => serve({ env: deployedEnv(s.url), liveStore: store, liveBudget: FAST, clock })));
    for (let tick = 0; tick <= 120; tick++) {
      for (const [i, base] of bases.entries()) {
        await call(`${base}/api/f1`);
        if (tick % 3 === i) await call(`${base}/api/live/status`);
      }
      t += 5_000;
    }
    const probes = stubs.reduce((n, s) => n + s.state.modelsCalls, 0);
    expect(probes).toBeLessThanOrEqual(11);
    expect(probes).toBeGreaterThanOrEqual(10);
  });
  it("a store copy taken from a 59 s old in-process probe expires within a second and does not double the probes in that period", async () => {
    let t = Date.parse("2026-10-15T20:00:00.000Z");
    const clock = () => new Date(t);
    const store = new MemoryStore(() => t);
    const [sa, sb] = await Promise.all([stub({ models: [Q] }), stub({ models: [Q] })]);
    const [a, b] = await Promise.all([serve({ env: deployedEnv(sa.url), liveStore: store, liveBudget: FAST, clock }), serve({ env: deployedEnv(sb.url), liveStore: store, liveBudget: FAST, clock })]);
    await call(`${a}/api/f1`); // A probes at t0
    t += 59_000;
    // The store copy of t0 has expired at t0+60 only; at t0+59 a reads it. Force B's own probe first at t0+59.
    await call(`${b}/api/f1`);
    const before = sa.state.modelsCalls + sb.state.modelsCalls;
    t += 1_000;
    for (let i = 0; i < 10; i++) { await call(`${a}/api/f1`); await call(`${b}/api/f1`); t += 1_000; }
    expect(sa.state.modelsCalls + sb.state.modelsCalls - before).toBeLessThanOrEqual(1);
  });
});

describe("guards (S8-12, L-17, A8-11, Q-10)", () => {
  it("every file under src/ public/ api/ data/ config/ equals its feaadff blob except STAGE8_MAY_CHANGE, which equals the actual difference exactly, plus STAGE8_NEW", () => {
    const base = JSON.parse(readFileSync(path.join(ROOT, "test", "fixtures", "stage8-baseline.json"), "utf8")) as { roots: string[]; blobs: Record<string, string> };
    const sha = (b: Buffer) => createHash("sha1").update(`blob ${b.length}\0`).update(b).digest("hex");
    const blob = (p: string, id: string) => {
      const b = readFileSync(path.join(ROOT, p));
      if (sha(b) === id || /\.(png|jpe?g|gif|ico|pdf|zip|gz)$/i.test(p)) return sha(b);
      return sha(Buffer.from(b.toString("latin1").replace(/\r\n/g, "\n"), "latin1"));
    };
    const changed: string[] = [];
    for (const [p, id] of Object.entries(base.blobs)) if (blob(p, id) !== id) changed.push(p);
    expect(changed.sort()).toEqual([...STAGE8_MAY_CHANGE].sort());
    const present: string[] = [];
    const walk = (p: string) => { const abs = path.join(ROOT, p); if (statSync(abs).isDirectory()) { for (const e of readdirSync(abs)) if (e !== ".sonar") walk(`${p}/${e}`); } else present.push(p); };
    for (const r of base.roots) if (existsSync(path.join(ROOT, r))) walk(r);
    expect(present.filter((p) => !(p in base.blobs)).sort()).toEqual([...STAGE8_NEW].sort());
    expect(present.filter((p) => isStage8New(p))).toEqual([...STAGE8_NEW]);
  });
  it("the reading path, the pipeline and the request builder are untouched: live-reader, deadline-reader, f1, pipeline, receipt, model-output", () => {
    for (const p of ["src/web/live-reader.ts", "src/web/deadline-reader.ts", "src/web/f1.ts", "src/pipeline.ts", "src/receipt.ts", "src/model-output.ts", "src/strict-json.ts", "src/reader.ts"]) expect(STAGE8_MAY_CHANGE.has(p), p).toBe(false);
  });
  it("the entry points never pass the test-only model catalog (Q-10)", () => {
    for (const f of ["api/index.ts", "src/server.ts"]) expect(readFileSync(path.join(ROOT, f), "utf8"), f).not.toMatch(/modelCatalog|STUB_CATALOG/);
    const app = readFileSync(path.join(ROOT, "src", "web", "app.ts"), "utf8");
    expect(app).toMatch(/const catalog = deps\.modelCatalog \?\? MODEL_CATALOG;/);
    expect(app).not.toMatch(/certgate-test-stub/);
  });
  it.skipIf(!existsSync(path.join(ROOT, "Dockerfile")))("no default path yields Gemma or an experimental model in the absence of configuration (L-06)", () => {
    expect(readFileSync(path.join(ROOT, "src", "web", "config.ts"), "utf8")).not.toMatch(/gemma|qwen/i);
    expect(readFileSync(path.join(ROOT, "Dockerfile"), "utf8")).not.toMatch(/MODEL_ID=.*(gemma|deepseek|mimo|flash)/i);
  });
});

// ---- the rendered page (public/app.js in a Node vm with a minimal DOM; no network)
function statusWith(models: unknown) {
  return { enabled: true, reason: "open within the limit", deployed_site: true, upload_policy: "any synthetic PDF, with the access code", notice: "notice", limit_per_hour: "10", remaining_this_hour: "10", reopens_at: "2026-10-15T21:00:00.000Z", access_code_required: true, endpoint_configured: true, windows: null, windows_note: "", scope_note: "global", job_api: "/api/live/jobs", access_code_header: "x-live-access-code", poll_interval_s: "2", model_requested: Q, samples: "/api/samples", models };
}
describe("the live screen and the case file render the choice and the label (S8-04, S8-24, L-08, L-25, Q-04, Q-12)", () => {
  const T = "2026-10-15T20:00:00.000Z";
  const models = {
    checked_at: T, statement: "You can choose only the models CertGate has measured, and experimental models that passed a probe in this stage, and only while AMD Token Factory lists them now. The figures of CertGate apply only to the measured models.", default: Q, selectable: 2,
    measured: [{ id: Q, enabled: true, state: `listed by the endpoint, checked ${T}`, evaluated: true, metrics_section: "METRICS.md: Runs", runs: ["evaluation/runs/real-candidate-dd557fd"] }, { id: G, enabled: false, state: `not listed by the endpoint now (checked ${T})`, evaluated: true, metrics_section: "m", runs: [] }],
    experimental: [{ id: X, enabled: true, state: `listed by the endpoint, checked ${T}`, evaluated: false, label: "not evaluated · experimental · probed 2026-10-15", acknowledgement: "this model is not evaluated; no figure of CertGate applies to it", evidence: "e.json", probed_at: T }],
    listed_not_offered: [{ id: "<img src=x onerror=alert(1)>", reason: "no image probe" }], not_shown: 3,
  };
  it("three groups, the probe time, the 200-character note, (c) ids as text and never as a choice, Gemma disabled, the default checked", async () => {
    const { ctx } = await loadApp(ROOT, { "/api/f1": { state: "on", model_ids: [Q] }, "/api/samples": { note: "", samples: [] } });
    const node = await ctx.liveSection(statusWith(models));
    const text = node.textContent;
    for (const s of ["MEASURED", "NOT EVALUATED · EXPERIMENTAL", "LISTED, NOT OFFERED", `checked ${T}`, "Model ids longer than 200 characters are not shown.", "+3 more listed, not shown", "<img src=x onerror=alert(1)> · no image probe", "not evaluated · experimental · probed 2026-10-15", models.statement]) expect(text, s).toContain(s);
    const radios = node.find((n: any) => n.tag === "input" && n.attrs.type === "radio");
    expect(radios.map((r: any) => [r.attrs.value, r.attrs.disabled !== undefined, r.attrs.checked !== undefined])).toEqual([[Q, false, true], [G, true, false], [X, false, false]]);
    expect(node.find((n: any) => n.tag === "img")).toEqual([]);
  });
  it("an experimental reading shows the not-evaluated label next to the proposal, and no figure; a measured one names its runs", async () => {
    const story = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", "cg-001.json"), "utf8"));
    const mc = { requested: X, reported: `self-dploy/${X}`, group: "experimental", evaluated: false, label: "not evaluated", figures: null, probe_evidence: "evidence/x.json", listing_checked_at: T };
    const held = (choice: unknown) => JSON.stringify({ kept_at_receipt_time: T, view: { ...story.view, receipt: { ...story.view.receipt, model_choice: choice } }, decision: null, original: { own: true } });
    const { ctx, view } = await loadApp(ROOT);
    ctx.localStorage.setItem("certgate.case.k1", held(mc));
    ctx.localScreen("k1");
    const line = view.find((n: any) => n.attrs.id === "model-choice")[0]!;
    expect(line.textContent).toMatch(/^not evaluated Read by DeepSeek-V4\.1-Flash \(experimental; reported as self-dploy\/DeepSeek-V4\.1-Flash\)\. No figure of CertGate applies to this model; probe evidence evidence\/x\.json\./);
    const fig = JSON.parse(readFileSync(path.join(ROOT, "public", "figures.json"), "utf8"));
    expect(view.textContent).not.toContain(String(fig.run ?? "real-candidate-dd557fd"));
    ctx.localStorage.setItem("certgate.case.k2", held({ ...mc, requested: Q, group: "measured", evaluated: true, label: "evaluated: measured model", figures: { metrics_section: "METRICS.md: Runs", runs: ["r"] }, probe_evidence: null }));
    ctx.localScreen("k2");
    expect(view.find((n: any) => n.attrs.id === "model-choice")[0]!.textContent).toMatch(/^Read by Qwen3\.8-27B, a measured model/);
  });
  it("a browser-held receipt from before Stage 8 (no model_choice) renders as before: no label and no crash (Q-12)", async () => {
    const story = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", "cg-001.json"), "utf8"));
    const { ctx, view } = await loadApp(ROOT);
    ctx.localStorage.setItem("certgate.case.old", JSON.stringify({ kept_at_receipt_time: T, view: story.view, decision: null }));
    ctx.localScreen("old");
    expect(view.find((n: any) => n.attrs.id === "model-choice")).toEqual([]);
    expect(view.textContent).not.toContain("not evaluated");
    for (const v of [{ evaluated: "false" }, { evaluated: 0 }, {}]) {
      ctx.localStorage.setItem("certgate.case.odd", JSON.stringify({ kept_at_receipt_time: T, view: { ...story.view, receipt: { ...story.view.receipt, model_choice: v } }, decision: null }));
      ctx.localScreen("odd");
      expect(view.find((n: any) => n.attrs.id === "model-choice"), JSON.stringify(v)).toEqual([]);
    }
  });
  it("the receipt screen shows the model requested and the model as reported, and whether it is evaluated", async () => {
    const story = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", "cg-001.json"), "utf8"));
    const { ctx, view } = await loadApp(ROOT);
    const rc = { ...story.view.receipt, reader: { ...story.view.receipt.reader, requested_model_id: X }, model_choice: { requested: X, reported: `self-dploy/${X}`, group: "experimental", evaluated: false, label: "not evaluated", figures: null, probe_evidence: "evidence/x.json", listing_checked_at: T } };
    ctx.receiptScreen({ ...story.view, receipt: rc }, { kind: "local" });
    const byId = (id: string) => view.find((n: any) => n.attrs.id === id)[0]!.textContent;
    expect(byId("receipt-model-requested")).toBe(X);
    expect(byId("receipt-model-reported")).toBe(`self-dploy/${X}`);
    expect(byId("receipt-model-evaluated")).toBe("not evaluated: experimental model; probe evidence evidence/x.json; no figure of CertGate applies");
  });
  it("the page never builds HTML from strings, and the acknowledgement is sent only for an experimental choice", () => {
    const js = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
    expect(js).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML/);
    expect(js).toMatch(/if \(pickNow\.chosen\.group === "experimental"\) body\.not_evaluated_acknowledged = pickNow\.acknowledged === true;/);
    expect(js).toMatch(/mc\.evaluated === false/);
  });
});

describe("the secrets stay on the server in every Stage 8 answer (S8-13)", () => {
  it("no key or code appears in any body or header seen in this file", () => {
    expect(seen.length).toBeGreaterThan(40);
    for (const t of seen) for (const v of [KEY, CODE]) expect(t.includes(v), v).toBe(false);
  });
});

// Keeps the import of execFileSync used where git is available (provenance of the probe evidence, P-07).
describe("probe evidence provenance (P-07, T8-21)", () => {
  it.skipIf(!existsSync(path.join(ROOT, ".git")) || !existsSync(path.join(ROOT, "evidence")))("the probe batch ran at an ancestor commit where live-reader.ts and model-output.ts equal feaadff", () => {
    const batch = JSON.parse(readFileSync(path.join(ROOT, "evidence", "runs", "certgate-001", "stage-8", "probes", "BATCH.json"), "utf8"));
    const c = batch.provenance.commit as string;
    expect(c).toMatch(/^[0-9a-f]{40}$/);
    expect(batch.provenance.product_tree_dirty).toBe(false);
    const git = (...a: string[]) => execFileSync("git", a, { cwd: ROOT }).toString().trim();
    expect(() => git("merge-base", "--is-ancestor", c, "HEAD")).not.toThrow();
    expect(git("diff", "--name-only", "feaadff8c90d4dc7bc913f83bf956b2d28bfae66", c, "--", "src/web/live-reader.ts", "src/model-output.ts")).toBe("");
  });
});
