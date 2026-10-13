// Stage 4 repair 1 (F4-01 a–f, ADV-S4-F05): behaviour behind README and DEPLOY.md sentences that had no test.
// Offline; the only endpoint is the local test stub.
import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { EXIT, main } from "../src/cli.js";
import { MAX_DELIVERY_NOTE_BYTES } from "../src/config.js";
import { InputRejected, validateDeliveryNote } from "../src/input-file.js";
import { confirmFields } from "../src/pipeline.js";
import { createApp } from "../src/server.js";
import type { AppDeps } from "../src/web/app.js";
import { WEB_MAX_DELIVERY_BYTES } from "../src/web/limits.js";
import { DATA, ROOT, runCase } from "./helpers.js";
// @ts-expect-error plain JS test double
import { startStub, STUB_MODEL_ID } from "./support/stub-endpoint.mjs";
import { loadApp } from "./support/fake-dom.js";
import { readFileSync } from "node:fs";

const open: { close: () => Promise<void> }[] = [];
afterEach(async () => { while (open.length) await open.pop()!.close(); });
async function app(deps: AppDeps) {
  const server = createApp(deps).listen(0);
  await new Promise((r) => server.once("listening", r));
  open.push({ close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
const postJson = (url: string, body: unknown) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const pdf = (id: string) => readFileSync(path.join(DATA, "cases", id, "certificate.pdf")).toString("base64");

describe("input limits (F4-01 a)", () => {
  it("delivery note: over 1 MiB is rejected in the CLI/container path", () => {
    expect(MAX_DELIVERY_NOTE_BYTES).toBe(1024 * 1024);
    expect(() => validateDeliveryNote(new Uint8Array(MAX_DELIVERY_NOTE_BYTES + 1))).toThrow(InputRejected);
  });
  it("delivery note: over 256 KiB is rejected by the web upload with 413", async () => {
    expect(WEB_MAX_DELIVERY_BYTES).toBe(256 * 1024);
    const base = await app({ env: { LIVE_READS_PER_HOUR: "5" } });
    const r = await postJson(`${base}/api/live/read`, { certificate_base64: pdf("cg-001"), delivery_csv: "x".repeat(WEB_MAX_DELIVERY_BYTES + 1), synthetic_confirmed: true });
    expect(r.status).toBe(413);
  });
});

describe("access-code failures default to 5 per hour (F4-01 c)", () => {
  it("without LIVE_CODE_FAILURES_PER_HOUR, 5 wrong codes are refused (403) and the 6th is rejected (429)", async () => {
    const s = await startStub({}); open.push(s);
    const base = await app({ env: { MODEL_BASE_URL: s.url, MODEL_ID: STUB_MODEL_ID, MODEL_API_KEY: "k", LIVE_READS_PER_HOUR: "5", LIVE_ACCESS_CODE: "jury-code-77" } });
    const body = { certificate_base64: pdf("cg-001"), synthetic_confirmed: true, access_code: "wrong" };
    for (let i = 0; i < 5; i++) expect((await postJson(`${base}/api/live/read`, body)).status, `attempt ${i + 1}`).toBe(403);
    expect((await postJson(`${base}/api/live/read`, body)).status).toBe(429);
    expect(s.state.chatCalls).toBe(0);
  });
});

describe("CLI exit codes 0, 2 and 1 (F4-01 d)", () => {
  async function cli(args: string[], env: Record<string, string> = {}) {
    const saved: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(env)) { saved[k] = process.env[k]; process.env[k] = v; }
    let out = "";
    try { return { code: await main(args, (s) => { out += s; }), out }; } finally {
      for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    }
  }
  it("0 processed, 2 input rejected, 1 internal error (a dataset directory whose spec file is not valid JSON)", async () => {
    expect((await cli(["process", "--case", "cg-001"])).code).toBe(EXIT.processed);
    expect(EXIT.processed).toBe(0);
    expect((await cli(["process", "--case", "zz"])).code).toBe(EXIT.rejected);
    expect(EXIT.rejected).toBe(2);
    const dir = mkdtempSync(path.join(tmpdir(), "certgate-broken-"));
    cpSync(DATA, dir, { recursive: true });
    writeFileSync(path.join(dir, "spec", "ESP-014.r3.json"), "{ broken");
    const broken = await cli(["process", "--case", "cg-001"], { CERTGATE_DATA_DIR: dir });
    expect(broken.code).toBe(EXIT.internal);
    expect(EXIT.internal).toBe(1);
    expect(JSON.parse(broken.out).status).toBe("internal_error");
  });
});

describe("a confirmation without a unit takes the field's expected unit (F4-01 e)", () => {
  it("ReH 358 confirmed with no unit is MPa; Mn 1.43 with no unit is %", async () => {
    const at = "2026-10-13T20:00:00.000Z";
    const r = confirmFields(await runCase("cg-003"), [
      { field: "mechanical.ReH", value: "358", unit: null, confirmed_by: "q", confirmed_at: at },
      { field: "chemistry.Mn", value: "1.43", unit: null, confirmed_by: "q", confirmed_at: at },
    ]);
    const v = (f: string) => r.receipt.values.find((x) => x.field === f)!;
    expect(v("mechanical.ReH")).toMatchObject({ value: "358", unit: "MPa" });
    expect(v("chemistry.Mn")).toMatchObject({ value: "1.43", unit: "%" });
  });
});

describe("LIVE_WINDOWS is shown as text (F4-01 f)", () => {
  it("configured: the status carries the text as is, and the landing shows it while the endpoint is off", async () => {
    const text = "Oct 16, 18:00-20:00 UTC (live demo from the container)";
    const base = await app({ env: { LIVE_READS_PER_HOUR: "5", LIVE_WINDOWS: text } });
    const st = await (await fetch(`${base}/api/live/status`)).json();
    expect(st.windows).toBe(text);
    expect(st.windows_note).toBe("announced live windows (configured)");
    const { ctx, view } = await loadApp(ROOT, {
      "/api/live/status": st,
      "/api/f1": { state: "off", detail: "no endpoint configured", checked_at: "2026-10-13T20:00:00.000Z", model_ids: [] },
    });
    await ctx.landing();
    expect(view.find((n) => n.attrs.id === "live")[0]!.textContent).toContain(text);
  });
  it("unset: no window is announced", async () => {
    const base = await app({ env: { LIVE_READS_PER_HOUR: "5" } });
    const st = await (await fetch(`${base}/api/live/status`)).json();
    expect(st.windows).toBeNull();
    expect(st.windows_note).toBe("no live window is announced");
  });
});

describe("/health with an endpoint but no model id (ADV-S4-F05)", () => {
  it("MODEL_BASE_URL set without MODEL_ID reports reader off", async () => {
    const base = await app({ env: { MODEL_BASE_URL: "http://127.0.0.1:9/v1" } });
    expect((await (await fetch(`${base}/health`)).json()).reader).toBe("off");
  });
});

describe("DEPLOY.md post-deploy checks, in the Vercel shape (C-46, E-11)", () => {
  it("VERCEL=1 without MODEL_*: health ok, f1 off, live status disabled with the deployed-site reason, live read 503, stories, recordings and figures 200, story evaluate block", async () => {
    const base = await app({ env: { VERCEL: "1" } });
    const health = await fetch(`${base}/health`);
    expect(health.status).toBe(200);
    expect((await health.json()).status).toBe("ok");
    const f1 = await (await fetch(`${base}/api/f1`)).json();
    expect(f1).toMatchObject({ state: "off", detail: "no endpoint configured" });
    const st = await (await fetch(`${base}/api/live/status`)).json();
    expect(st).toMatchObject({ enabled: false, deployed_site: true, reason: "live reading unavailable on the deployed site; live demonstration from the container" });
    for (const p of ["/stories/cg-003.json", "/stories/cg-003.recording.json", "/figures.json"]) expect((await fetch(`${base}${p}`)).status, p).toBe(200);
    const ev = await postJson(`${base}/api/stories/cg-003/evaluate`, {});
    expect(ev.status).toBe(200);
    expect((await ev.json()).view.proposal).toBe("block");
    expect((await postJson(`${base}/api/live/read`, { certificate_base64: "", synthetic_confirmed: true })).status).toBe(503);
  });
});

describe("README test-stub modes (C-67)", () => {
  it("the stub answers each documented --mode as the README says", async () => {
    for (const mode of ["timeout", "http_429", "http_5xx", "invalid_json", "huge"]) {
      const s = await startStub({ mode }); open.push(s);
      expect(s.state.mode).toBe(mode);
    }
    const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
    expect(readme).toContain("# TEST STUB, not a model; --mode timeout|http_429|http_5xx|invalid_json|huge");
    expect(readFileSync(path.join(ROOT, "test", "support", "stub-endpoint.mjs"), "utf8")).toMatch(/TEST DOUBLE, NOT A MODEL/);
  });
});
