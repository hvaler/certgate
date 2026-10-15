// Stage 8 (dispatch 6, amendment 1; register R8.0-R8.2): the closed model set, the identity rule, the offer, the
// three groups, and the probe batch script. Endpoint behaviour is a local TEST STUB (test/support/stub-endpoint.mjs).
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ACK_TEXT, C_REASONS, EXPERIMENTAL_MODELS, MEASURED_MODELS, MODEL_CATALOG, NOT_ENABLED_TEXT, PROBE_OUTCOMES, choiceView, computeOffer,
  defaultModel, modelChoiceRecord, resolveChoice, sameModel, type ModelCatalog,
} from "../src/web/models.js";
import { ROOT } from "./helpers.js";
// @ts-expect-error plain JS helper
import { startStub } from "./support/stub-endpoint.mjs";
// @ts-expect-error plain JS tool
import { classify, PROBE_CASE, runBatch } from "../tools/probe-models.mjs";

// The run artifacts, METRICS.md and the evidence are not in the Docker image (.dockerignore): these checks run in
// every checkout of the repository and are reported as skipped inside the image, like test/stage5-gemma.test.ts.
const REPO = existsSync(path.join(ROOT, "evidence")) && existsSync(path.join(ROOT, "METRICS.md"));
const repoOnly = describe.skipIf(!REPO);

const Q = "Qwen3.8-27B";
const G = "Gemma-4-31B-IT";
const T = "2026-10-15T20:00:00.000Z";
const withExp = (ids: string[], outcomes: ModelCatalog["outcomes"] = []): ModelCatalog => ({
  measured: MEASURED_MODELS,
  experimental: ids.map((id) => ({ id, evidence: `evidence/runs/certgate-001/stage-8/probes/${id}.json`, probed_at: "2026-10-15T21:00:00.000Z" })),
  outcomes,
});

describe("one identity rule (L-C1, CH8-03, CH8-30)", () => {
  it.each([
    [Q, Q, true], [Q, "qwen3.8-27b", true], [Q, "self-dploy/Qwen3.8-27B", true], [Q, "SELF-DPLOY/qwen3.8-27B", true],
    [Q, "Qwen3.8-27B-FP8", false], [Q, "xQwen3.8-27B", false], [Q, "a/b/Qwen3.8-27B", false], [Q, "/Qwen3.8-27B", false],
    [Q, "self-dploy/Qwen3.8-27B-FP8", false], [G, "Gemma-4-31B-IT-v2", false], [Q, "", false], ["", "", false], [Q, " Qwen3.8-27B", false],
  ])("sameModel(%j, %j) is %s", (id, other, want) => {
    expect(sameModel(id, other)).toBe(want);
  });
  it("is ASCII case only: no Unicode folding (U+2011 is not a hyphen, the Kelvin sign is not K)", () => {
    expect(sameModel(Q, "Qwen3.8‑27B")).toBe(false);
    expect(sameModel("K-1", "K-1")).toBe(false);
  });
});

repoOnly("the closed set is tied to METRICS.md and its runs (S8-01, L-16, CH8-16)", () => {
  const metrics = REPO ? readFileSync(path.join(ROOT, "METRICS.md"), "utf8") : "";
  it("exactly Qwen3.8-27B then Gemma-4-31B-IT, each with runs whose recorded model is the entry and that METRICS.md names", () => {
    expect(MEASURED_MODELS.map((m) => m.id)).toEqual([Q, G]);
    for (const m of MEASURED_MODELS) {
      expect(m.runs.length).toBeGreaterThan(0);
      for (const dir of m.runs) {
        const run = JSON.parse(readFileSync(path.join(ROOT, dir, "run.json"), "utf8"));
        expect(run.model_requested, dir).toBe(m.id);
        expect(metrics, dir).toContain(`\`${dir}/\``);
      }
    }
  });
  it("METRICS.md names no other requested model in its run tables", () => {
    const requested = [...metrics.matchAll(/\| (?:Endpoint host · model requested|Model requested) \|([^\n]+)/g)].flatMap((m) => m[1]!.split("|").map((c) => c.replace(/.*· /, "").trim()).filter(Boolean));
    expect(requested.length).toBeGreaterThan(0);
    for (const r of requested) expect(MEASURED_MODELS.map((m) => m.id), r).toContain(r);
  });
});

describe("the offer (S8-02, S8-03, S8-26, A8-01, L-13, L-28, L-C5)", () => {
  it("without LIVE_MODELS: MODEL_ID alone if it is measured, and no experimental model", () => {
    expect(computeOffer(Q, undefined, withExp(["Exp-1"]))).toMatchObject({ measured: [Q], experimental: [], narrowed: false });
    expect(computeOffer("qwen3.8-27b", "  ", withExp(["Exp-1"]))).toMatchObject({ measured: [Q], experimental: [] });
    expect(computeOffer(G, "", MODEL_CATALOG)).toMatchObject({ measured: [G], experimental: [] });
  });
  it("an unmeasured or unset MODEL_ID gives an empty offer, named in the log only", () => {
    const o = computeOffer("Llama-x", undefined, withExp(["Llama-x"]));
    expect(o).toMatchObject({ measured: [], experimental: [] });
    expect(o.log.join("\n")).toContain("\"Llama-x\" is not a measured model");
    expect(computeOffer(null, undefined)).toMatchObject({ measured: [], experimental: [], log: [] });
  });
  it("LIVE_MODELS narrows both groups in code order, trims, drops empties and duplicates, matches ignoring ASCII case", () => {
    const o = computeOffer(Q, " exp-1 , gemma-4-31b-it,,Qwen3.8-27B,Qwen3.8-27B ", withExp(["Exp-1", "Exp-2"]));
    expect(o).toMatchObject({ measured: [Q, G], experimental: ["Exp-1"], narrowed: true, log: [] });
  });
  it("an id in neither set is ignored and logged by name, even when listed; only unknown ids give an empty offer, never MODEL_ID", () => {
    const o = computeOffer(Q, "Llama-x, ,", withExp(["Exp-1"]));
    expect(o).toMatchObject({ measured: [], experimental: [], narrowed: true });
    expect(o.log).toEqual(["[certgate] LIVE_MODELS: ignored \"Llama-x\" (not a measured or probed model)"]);
  });
  it("measured takes precedence: a measured id in the experimental set is never offered as experimental", () => {
    const o = computeOffer(Q, `${Q},${G}`, withExp([G, "Exp-1"]));
    expect(o).toMatchObject({ measured: [Q, G], experimental: [] });
  });
  it("the log never carries control characters and is capped", () => {
    const o = computeOffer(Q, `bad\u0007id${"x".repeat(300)}`, MODEL_CATALOG);
    expect(o.log[0]).not.toMatch(/[\u0000-\u001f]/);
    expect(o.log[0]!.length).toBeLessThan(200);
  });
});

describe("choice resolution and the default (L-04, S8-05, L-06, L-24)", () => {
  const offer = computeOffer(Q, `${Q},${G},Exp-1`, withExp(["Exp-1"]));
  it("matches exactly ignoring ASCII case and returns the constant's spelling; no trimming, no folding, no non-string", () => {
    expect(resolveChoice(offer, "qwen3.8-27b")).toEqual({ id: Q, group: "measured" });
    expect(resolveChoice(offer, "EXP-1")).toEqual({ id: "Exp-1", group: "experimental" });
    for (const v of [" Qwen3.8-27B ", "Qwen3.8‑27B", ["Qwen3.8-27B"], { toLowerCase: 1 }, 1, null, undefined, "", "self-dploy/Qwen3.8-27B"]) expect(resolveChoice(offer, v), JSON.stringify(v)).toBeNull();
  });
  it("MODEL_ID if offered and listed, else the first listed measured id in code order, never an experimental one", () => {
    expect(defaultModel(offer, Q, [Q, G, "Exp-1"])).toBe(Q);
    expect(defaultModel(offer, Q, [`self-dploy/${G}`, "Exp-1"])).toBe(G);
    expect(defaultModel(offer, G, [Q, G])).toBe(G);
    expect(defaultModel(offer, Q, ["Exp-1"])).toBeNull();
    expect(defaultModel(computeOffer(null, undefined), null, [Q, G])).toBeNull();
  });
  it("Gemma is never a default in the absence of configuration (L-06)", () => {
    expect(defaultModel(computeOffer(Q, undefined), Q, [Q, G])).toBe(Q);
    expect(defaultModel(computeOffer(Q, undefined), Q, [G])).toBeNull();
  });
});

describe("the three groups (S8-04, S8-21…S8-23, L-08, L-26, Q-04)", () => {
  it("every listed id appears exactly once, measured always in (a), with its state and the probe's own time", () => {
    const cat = withExp(["Exp-1", "Exp-2"], [{ id: "Bad-1", outcome: "probe_failed", evidence: "x" }, { id: "Ocr-1", outcome: "not_chat", evidence: "y" }]);
    const offer = computeOffer(Q, `${Q},Exp-1`, cat);
    const listed = [`self-dploy/${Q}`, G, "Exp-1", "Exp-2", "Bad-1", "Ocr-1", "Other-1"];
    const v = choiceView(offer, Q, listed, T, cat);
    expect(v.checked_at).toBe(T);
    expect(v.measured).toMatchObject([
      { id: Q, enabled: true, state: `listed by the endpoint, checked ${T}`, evaluated: true },
      { id: G, enabled: false, state: NOT_ENABLED_TEXT, evaluated: true },
    ]);
    expect(v.experimental).toMatchObject([{ id: "Exp-1", enabled: true, evaluated: false, acknowledgement: ACK_TEXT }]);
    expect(v.experimental[0]!.label).toMatch(/^not evaluated · experimental · probed 2026-10-15$/);
    expect(v.listed_not_offered).toEqual([
      { id: "Exp-2", reason: C_REASONS.not_enabled }, { id: "Bad-1", reason: "probe failed" }, { id: "Ocr-1", reason: "not a chat model" }, { id: "Other-1", reason: "no image probe" },
    ]);
    expect(v.default).toBe(Q);
    expect(v.selectable).toBe(2);
  });
  it("unlisted offered models are disabled with the unlisted text; nothing listed means nothing selectable", () => {
    const cat = withExp(["Exp-1"]);
    const v = choiceView(computeOffer(Q, `${Q},${G},Exp-1`, cat), Q, [], T, cat);
    for (const m of [...v.measured, ...v.experimental]) expect(m).toMatchObject({ enabled: false, state: `not listed by the endpoint now (checked ${T})` });
    expect(v.selectable).toBe(0);
    expect(v.default).toBeNull();
  });
  it("no measured model listed but an experimental one: selectable with no default (L-24)", () => {
    const cat = withExp(["Exp-1"]);
    const v = choiceView(computeOffer(Q, `${Q},Exp-1`, cat), Q, ["Exp-1"], T, cat);
    expect(v.default).toBeNull();
    expect(v.selectable).toBe(1);
  });
  it("caps what the endpoint lists: 100 ids shown with the rest counted, each id truncated at 200 characters, nothing measured in (c)", () => {
    const many = Array.from({ length: 500 }, (_, i) => `m-${i}`);
    const v = choiceView(computeOffer(Q, undefined), Q, [Q, "y".repeat(250), ...many], T);
    expect(v.listed_not_offered.length).toBe(100);
    expect(v.not_shown).toBe(401);
    expect(v.listed_not_offered[0]!.id).toBe(`${"y".repeat(200)}… (truncated)`);
    expect(v.listed_not_offered.some((x) => sameModel(Q, x.id))).toBe(false);
  });
  it("the receipt record: measured carries its figures; experimental is not evaluated, with its evidence and no figure", () => {
    const cat = withExp(["Exp-1"]);
    expect(modelChoiceRecord({ id: Q, group: "measured" }, `self-dploy/${Q}`, T, cat)).toMatchObject({ requested: Q, reported: `self-dploy/${Q}`, evaluated: true, probe_evidence: null, listing_checked_at: T, figures: { runs: MEASURED_MODELS[0]!.runs } });
    const x = modelChoiceRecord({ id: "Exp-1", group: "experimental" }, "Exp-1", T, cat);
    expect(x).toMatchObject({ group: "experimental", evaluated: false, label: "not evaluated", figures: null, probe_evidence: "evidence/runs/certgate-001/stage-8/probes/Exp-1.json" });
    const deep = (o: unknown): boolean => typeof o === "number" || (o !== null && typeof o === "object" && Object.values(o).some(deep));
    expect(deep(x)).toBe(false);
  });
});

// ---- the probe batch script, against the TEST STUB (L-20…L-22, L-33, L-34, P-01…P-07, Q-07…Q-11)
const loadSrc = (p: string) => import(path.join(ROOT, "src", p.replace(/\.js$/, ".ts")));
const KEY = "probe-test-key-not-real-5d1c9e";
const open: { close: () => Promise<void> }[] = [];
afterEach(async () => { while (open.length) await open.pop()!.close(); });
async function batch(stubOpts: Record<string, unknown>, opts: Record<string, unknown> = {}) {
  const s = await startStub({ caseId: PROBE_CASE, reportedModel: (m: string) => `self-dploy/${m}`, ...stubOpts });
  open.push(s);
  const out = mkdtempSync(path.join(tmpdir(), "cg-probe-"));
  const summary = await runBatch({ base: s.url, key: KEY, out, load: loadSrc, distDir: path.join(ROOT, "src"), backoffBaseMs: 1, log: () => undefined, ...opts });
  const file = (n: string) => JSON.parse(readFileSync(path.join(out, n), "utf8"));
  return { s, out, summary, file };
}
const VIS = { id: "Vis-A", output: ["text"], architecture: { input_modalities: ["text", "image"] } };

describe("probe batch script (tools/probe-models.mjs)", () => {
  it("classifies from present fields only: measured skipped, output without text = not chat, input without image = no image probe, missing fields = probe (Q-07)", () => {
    const ids = [Q, G];
    expect(classify({ id: "self-dploy/Qwen3.8-27B" }, ids, sameModel).action).toBe("measured");
    expect(classify({ id: "O", output: ["ocr"] }, ids, sameModel)).toMatchObject({ action: "not_chat", field: "output = [\"ocr\"]" });
    expect(classify({ id: "T", output: ["text"], architecture: { input_modalities: ["text"] } }, ids, sameModel).action).toBe("no_image_input");
    expect(classify({ id: "Bare" }, ids, sameModel).action).toBe("probe");
    expect(classify({ id: "NoArch", output: ["text"] }, ids, sameModel).action).toBe("probe");
    expect(classify(VIS, ids, sameModel).action).toBe("probe");
  });
  it("probes each image-input id once with the product request, records the evidence fields, and writes no secret", async () => {
    const { s, out, summary, file } = await batch({ models: [{ id: Q }, VIS, { id: "Txt-B", output: ["text"], architecture: { input_modalities: ["text"] } }, { id: "Ocr-C", output: ["ocr"] }, { id: "Bare-D" }] });
    expect(summary.listed.map((l: { action: string }) => l.action)).toEqual(["measured", "probe", "no_image_input", "not_chat", "probe"]);
    expect(summary.experimental_set).toEqual(["Vis-A", "Bare-D"]);
    expect(s.state.chatCalls).toBe(2);
    expect(s.state.requestedModels).toEqual(expect.arrayContaining(["Vis-A", "Bare-D"]));
    const r = file("Vis-A.json");
    expect(r).toMatchObject({ model_requested: "Vis-A", model_reported: "self-dploy/Vis-A", result: "passed", failure_class: null, chat_calls: "1", certificate: { case_id: "cg-016" }, prompt_sha256: "32fad2f980bcf755841d80bb2385d9601465f83b5b42c1b6c048f3bfe1cfb567" });
    expect(r.checks).toEqual({ http_200: true, schema_parsed: true, same_model: true, within_reading_budget: true });
    expect(r.request_body_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r.request_body_masked_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r.note).toMatch(/correctness of the values read is NOT judged/);
    expect(typeof r.reply_content).toBe("string");
    for (const f of readdirSync(out)) {
      const t = readFileSync(path.join(out, f), "utf8");
      expect(t, f).not.toContain(KEY);
      expect(t, f).not.toMatch(/authorization|bearer /i);
    }
    expect(readdirSync(out).sort()).toEqual(["BATCH.json", "BATCH.md", "Bare-D.json", "Vis-A.json", "models-snapshot.json", "usage-after.json", "usage-before.json"]);
  });
  it("a reported near-miss id fails as model_mismatch and stays out of the set (CH8-30)", async () => {
    const { summary, file } = await batch({ models: [VIS], reportedModel: (m: string) => `${m}-FP8` });
    expect(summary.experimental_set).toEqual([]);
    expect(file("Vis-A.json")).toMatchObject({ result: "failed", failure_class: "model_mismatch", model_reported: "Vis-A-FP8" });
  });
  it("a reply that fails the response schema fails the probe", async () => {
    const { file } = await batch({ models: [VIS], mode: "invalid_json" });
    expect(file("Vis-A.json")).toMatchObject({ result: "failed" });
  });
  it("one probe per id, at most 3 attempts on 5xx, never a fourth call; the cap stops the batch and the rest is infrastructure (L-33, Q-09, CH8-33)", async () => {
    const { s, summary, file } = await batch({ models: [VIS, { id: "Vis-B" }], mode: "http_5xx" }, { cap: 4 });
    expect(s.state.chatCalls).toBe(4);
    expect(summary.chat_calls).toBe("4");
    const a = file("Vis-A.json");
    const b = file("Vis-B.json");
    // Two probes run in parallel, so the cap falls inside both; each stays within the 3 D2 attempts.
    const calls = [a, b].map((r) => Number(r.chat_calls));
    expect(calls.reduce((x, y) => x + y, 0)).toBe(4);
    for (const c of calls) expect(c).toBeLessThanOrEqual(3);
    expect([a.failure_class, b.failure_class]).toContain("infrastructure, cap reached");
    for (const r of [a, b]) expect(["endpoint http_5xx (HTTP 503)", "infrastructure, cap reached"]).toContain(r.failure_class);
    expect(summary.experimental_set).toEqual([]);
  });
  it("a single id that keeps failing on 5xx gets exactly 3 attempts and no fourth call (Q-09)", async () => {
    const { s, file } = await batch({ models: [VIS], mode: "http_5xx" });
    expect(s.state.chatCalls).toBe(3);
    expect(file("Vis-A.json")).toMatchObject({ result: "failed", chat_calls: "3", failure_class: "endpoint http_5xx (HTTP 503)" });
  });
  it("the cap can only be lowered: a larger value still means 18", async () => {
    const { summary } = await batch({ models: [VIS] }, { cap: 1000 });
    expect(summary.call_cap).toBe("18");
  });
  it("a probe whose whole read, retries included, exceeds the reading budget fails (L-29, Q-08)", async () => {
    const { file } = await batch({ models: [VIS], delayMs: 150, failFirst: 1, failMode: "http_5xx" }, { budgetMsForTest: 200 });
    const r = file("Vis-A.json");
    expect(Number(r.chat_calls)).toBe(2);
    expect(r).toMatchObject({ result: "failed", failure_class: "slower than the 210 s reading budget" });
    expect(r.checks.within_reading_budget).toBe(false);
  });
});

repoOnly("each probe's request_body_sha256 equals a fresh local capture of the product request (L-21, Q-11, CH8-21)", () => {
  it("for every committed probe record, the full body hash and the image-masked hash are reproduced by LiveReader on cg-016", async () => {
    const { LiveReader } = await import("../src/web/live-reader.js");
    const { createServer } = await import("node:http");
    const { createHash } = await import("node:crypto");
    // @ts-expect-error plain JS tool
    const { maskedBodySha256 } = await import("../tools/probe-models.mjs");
    const dir = path.join(ROOT, "evidence", "runs", "certgate-001", "stage-8", "probes");
    const certificate = new Uint8Array(readFileSync(path.join(ROOT, "data", "cases", PROBE_CASE, "certificate.pdf")));
    const records = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8"))).filter((r) => r.schema === "certgate.model-probe/1");
    expect(records.length).toBe(6);
    for (const rec of records) {
      let seen = "";
      const server = createServer((req, res) => { let b = ""; req.on("data", (c) => { b += c; }); req.on("end", () => { seen ||= b; res.writeHead(500); res.end("{}"); }); }).listen(0, "127.0.0.1");
      await new Promise((r) => server.once("listening", r));
      const reader = new LiveReader({ baseUrl: `http://127.0.0.1:${(server.address() as { port: number }).port}/v1`, modelId: rec.model_requested, apiKey: "capture-not-a-key", backoffBaseMs: 1 });
      await reader.read({ case_id: PROBE_CASE, certificate }).catch(() => undefined);
      await new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); });
      expect(createHash("sha256").update(Buffer.from(seen, "utf8")).digest("hex"), rec.model_requested).toBe(rec.request_body_sha256);
      expect(maskedBodySha256(seen), rec.model_requested).toBe(rec.request_body_masked_sha256);
      expect(rec.certificate.sha256).toBe(createHash("sha256").update(certificate).digest("hex"));
    }
  });
});

repoOnly("the committed experimental set and probe outcomes are tied to their evidence (S8-22, L-20, T8-21)", () => {
  const dir = path.join(ROOT, "evidence", "runs", "certgate-001", "stage-8", "probes");
  it("every experimental id has one passing probe file naming it; no failed probe is in the set; the outcomes match their files", () => {
    for (const x of EXPERIMENTAL_MODELS) {
      const rec = JSON.parse(readFileSync(path.join(ROOT, x.evidence), "utf8"));
      expect(rec, x.id).toMatchObject({ model_requested: x.id, result: "passed", started_utc: x.probed_at });
      expect(sameModel(x.id, rec.model_reported), x.id).toBe(true);
      expect(Object.values(rec.checks).every(Boolean), x.id).toBe(true);
      expect(MEASURED_MODELS.some((m) => sameModel(m.id, x.id)), x.id).toBe(false);
    }
    for (const o of PROBE_OUTCOMES) {
      const rec = JSON.parse(readFileSync(path.join(ROOT, o.evidence), "utf8"));
      if (o.outcome === "probe_failed") expect(rec, o.id).toMatchObject({ model_requested: o.id, result: "failed" });
      else expect(JSON.stringify(rec.body?.data ?? []), o.id).toContain(`"id":${JSON.stringify(o.id)}`);
      expect(EXPERIMENTAL_MODELS.some((x) => sameModel(x.id, o.id)), o.id).toBe(false);
    }
    let files: string[] = [];
    try { files = readdirSync(dir).filter((f) => f.endsWith(".json") && !["BATCH.json", "models-snapshot.json", "models-sizing.json", "usage-before.json", "usage-after.json"].includes(f)); } catch { /* no batch yet */ }
    for (const f of files) {
      const rec = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
      const inSet = EXPERIMENTAL_MODELS.some((x) => x.id === rec.model_requested);
      expect(inSet, f).toBe(rec.result === "passed");
      if (rec.result === "failed") expect(PROBE_OUTCOMES.some((o) => o.id === rec.model_requested && o.outcome === "probe_failed"), f).toBe(true);
    }
  });
});
