// ADV-S3-F02 (Stage 3 repair 3; S3-26, I7): the RENDERED story screen and its receipt screen say "not live". The
// real public/labels.js and public/app.js run in a Node vm with a minimal DOM stand-in (test/support/fake-dom.ts),
// and fetch answers from the committed static files. Kills S2M02br (suffix cut off the story label) and the same
// mutation on the receipt label. No network.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";
import { type FakeNode, loadApp } from "./support/fake-dom.js";

const storedLabel = (root: FakeNode) => root.find((n) => n.attrs["data-stored-label"] !== undefined).map((n) => n.textContent);

describe("rendered story labels say not live (ADV-S3-F02, S3-26, I7)", () => {
  for (const id of ["cg-001", "cg-002", "cg-003"]) {
    it(`${id}: the story screen label and the receipt screen label end with "not live"`, async () => {
      const { ctx, view } = await loadApp(ROOT);
      const story = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", `${id}.json`), "utf8"));
      await ctx.storyScreen(id);
      const labels = storedLabel(view);
      expect(labels).toHaveLength(1);
      expect(labels[0]).toMatch(/^Recorded reading/);
      expect(labels[0]).toContain(`recorded ${story.recorded_at}`);
      expect(labels[0]).toMatch(/ · not live$/);
      // Open the receipt from the story screen, as a visitor would.
      const link = view.find((n) => n.tag === "a" && n.textContent === "Open the receipt")[0]!;
      for (const f of link.listeners.click ?? []) await f({ preventDefault() {} });
      const receipt = storedLabel(view);
      expect(receipt).toHaveLength(1);
      expect(receipt[0]).toMatch(/ · not live$/);
    });
  }
  it("the rendered label is exactly labels.js storyLabelDetail of the story, with nothing cut or added", async () => {
    const { ctx, view } = await loadApp(ROOT);
    const story = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", "cg-003.json"), "utf8"));
    await ctx.storyScreen("cg-003");
    const expected = ctx.CertGateLabels.storyLabelDetail({ storedAt: story.recorded_at, model: story.model_reported, evaluatedAt: null });
    expect(storedLabel(view)[0]).toBe(`Recorded reading · ${expected}`);
  });
});

// R4.5 E-08 (Stage 4): the "Runs on AMD" screen states only what the F1 state supports, in both states.
describe("Runs on AMD screen text follows the F1 state (R4.5 E-08)", () => {
  const state = (view: FakeNode) => view.find((n) => n.attrs.id === "amd-state")[0]!.textContent;
  it("endpoint off: says off with the server's detail, never that an endpoint or AMD hardware is used", async () => {
    for (const detail of ["no endpoint configured", "endpoint unreachable"]) {
      const { ctx, view } = await loadApp(ROOT, { "/api/f1": { state: "off", detail, checked_at: "2026-10-13T20:00:00.000Z", model_ids: [] } });
      await ctx.amdScreen();
      expect(state(view)).toBe(`Endpoint off (${detail}): judge mode shows the recorded readings only.`);
      expect(JSON.stringify(view.textContent)).not.toMatch(/sidecar|no AMD hardware|In this build no endpoint/);
    }
  });
  it("endpoint on: names AMD Token Factory, values as reported, and makes no GPU, ROCm or vLLM claim", async () => {
    const { ctx, view } = await loadApp(ROOT, { "/api/f1": { state: "on", detail: "read from the configured endpoint", checked_at: "2026-10-13T20:00:00.000Z", model_ids: ["Qwen3.8-27B"], gpu: "not exposed by the endpoint", rocm_version: "not exposed by the endpoint", vllm_version: "not exposed by the endpoint", endpoint_name: "AMD Token Factory", cost_label: "cost reported by the endpoint; Token Factory credits are free and have no monetary value" } });
    await ctx.amdScreen();
    expect(state(view)).toBe("Endpoint on: AMD Token Factory. The values above are as reported by the endpoint.");
    expect(state(view)).not.toMatch(/GPU|ROCm|vLLM|MI\d/);
    expect(view.textContent).not.toMatch(/sidecar/);
  });
});

// Stage 4 repair 2 (README C-15): the panel's GPU, ROCm and vLLM rows in both states, as rendered.
describe("Runs on AMD panel rows for GPU, ROCm and vLLM in both states (README C-15)", () => {
  const rowValue = (view: FakeNode, label: string) => {
    const dts = view.find((n) => n.tag === "dt");
    const i = dts.findIndex((n) => n.textContent === label);
    const dd = view.find((n) => n.tag === "dd")[i];
    return dd ? dd.textContent : null;
  };
  it("endpoint on: GPU and ROCm · vLLM say \"not exposed by the endpoint\"", async () => {
    const { ctx, view } = await loadApp(ROOT, { "/api/f1": { state: "on", detail: "read from the configured endpoint", checked_at: "2026-10-13T21:00:00.000Z", model_ids: ["Qwen3.8-27B"], endpoint_name: "AMD Token Factory", endpoint_host: "h", gpu: "not exposed by the endpoint", rocm_version: "not exposed by the endpoint", vllm_version: "not exposed by the endpoint", cost_label: "cost reported by the endpoint; Token Factory credits are free and have no monetary value" } });
    await ctx.amdScreen();
    expect(rowValue(view, "GPU")).toBe("not exposed by the endpoint");
    expect(rowValue(view, "ROCm · vLLM")).toBe("not exposed by the endpoint · not exposed by the endpoint");
  });
  it("endpoint off: GPU, ROCm · vLLM and every other endpoint value show \"unknown\"", async () => {
    const off = { state: "off", detail: "no endpoint configured", checked_at: "2026-10-13T21:00:00.000Z", endpoint_name: null, endpoint_host: null, model_ids: [], model_reported: null, gpu: null, rocm_version: null, vllm_version: null, latency_ms: null, last_reading_ms: null, completion_tokens: null, total_tokens: null, tokens_per_second: null, cost_reported: null, cost_label: "cost reported by the endpoint; Token Factory credits are free and have no monetary value", rate_limit_rpm: null, rate_limit_rpm_remaining: null, daily_spend_limit: null, daily_spend_used: null, daily_spend_remaining: null, usage_source: null, probe_cached: false };
    const { ctx, view } = await loadApp(ROOT, { "/api/f1": off });
    await ctx.amdScreen();
    expect(rowValue(view, "GPU")).toBe("unknown");
    expect(rowValue(view, "ROCm · vLLM")).toBe("unknown · unknown");
    expect(rowValue(view, "Model(s) listed")).toBe("none");
    for (const label of ["Model (as reported)", "Probe latency (ms)", "Last reading (ms)", "Tokens / s"]) expect(rowValue(view, label), label).toBe("unknown");
    expect(view.textContent).not.toMatch(/not exposed by the endpoint/);
  });
});
