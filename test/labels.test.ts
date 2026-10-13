// UI labels and release gating (S2-04, S2-14, I7, B-09, B-14, F2-01) — kills Stage 2 mutants S2M01, S2M02 and
// S2M08 through behaviour (auditor F2-05), plus static guards on app.js.
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { readingLabel, toView } from "../src/web/view.js";
import { ROOT, runCase } from "./helpers.js";

type Labels = {
  readingText: (rc: { reading_source: string }) => string;
  storyLabelDetail: (s: { storedAt: string; evaluatedAt: string | null; model?: string | null }) => string;
  localLabelDetail: (v: { reading_label: string; receipt: { created_at: string } }) => string;
  releaseAllowed: (v: { proposal: string; status: string } | null) => boolean;
};

function loadLabels(): Labels {
  const ctx: Record<string, unknown> = {};
  vm.runInNewContext(readFileSync(path.join(ROOT, "public", "labels.js"), "utf8"), ctx);
  return ctx.CertGateLabels as Labels;
}
const appJs = readFileSync(path.join(ROOT, "public", "app.js"), "utf8");

describe("reading labels never present a mock or stored reading as live (S2M01)", () => {
  it("view labels per reading source", () => {
    expect(readingLabel("mock")).toBe("mock reading · no model");
    expect(readingLabel("planted")).toMatch(/^mock reading · no model/);
    expect(readingLabel("live_no_reading")).toBe("live attempt · no reading");
    expect(readingLabel("live")).toBe("live reading from the configured endpoint");
  });
  it("a mock run's view is labelled mock, and nothing mock says live", async () => {
    for (const id of ["cg-001", "cg-002", "cg-003", "cg-018"]) {
      const v = toView(await runCase(id));
      expect(v.reading_label).toMatch(/^mock reading · no model/);
      expect(v.reading_label).not.toMatch(/live/);
      expect(v.steps[1]!.name).toMatch(/mock \(no model\)/);
    }
  });
  it("client receipt labels follow reading_source; an unknown source is never upgraded to live", () => {
    const L = loadLabels();
    expect(L.readingText({ reading_source: "mock" })).toBe("mock reading · no model");
    expect(L.readingText({ reading_source: "live_no_reading" })).toBe("live attempt · no reading");
    expect(L.readingText({ reading_source: "weird" })).not.toMatch(/^live/);
  });
});

describe("stored-story labels (S2M02, F2-01, B-09, B-12)", () => {
  const L = loadLabels();
  it("a recorded story shows its recording time and model, says recorded and not live (S3-18)", () => {
    const s = L.storyLabelDetail({ storedAt: "2026-10-13T18:35:51.742Z", evaluatedAt: null, model: "self-dploy/Qwen3.8-27B" });
    expect(s).toBe("recorded real reading · self-dploy/Qwen3.8-27B · recorded 2026-10-13T18:35:51.742Z · not live");
  });
  it("a re-evaluated story keeps the recording time and adds the re-evaluation time", () => {
    const s = L.storyLabelDetail({ storedAt: "2026-10-13T18:35:51.742Z", evaluatedAt: "2026-10-13T19:10:00.000Z", model: "m" });
    expect(s).toContain("recorded 2026-10-13T18:35:51.742Z");
    expect(s).toContain("re-evaluated by the server at 2026-10-13T19:10:00.000Z from the recorded reading");
    expect(s).toMatch(/^recorded real reading/);
    expect(s).toMatch(/not live$/);
  });
  it("every story label in app.js says not live: the judge cards and the story screen (S3-26, kills S2M02b)", () => {
    // S2M02b dropped " · not live" from the judge-card story label in app.js; this test fails on that mutant.
    const card = /`\$\{s\.id\} · recorded real reading · [^`]*`/.exec(appJs);
    expect(card, "judge card label").not.toBeNull();
    expect(card![0]).toMatch(/ · not live`$/);
    expect(appJs).toMatch(/storedDetail: storyLabelDetail\(s\)/);
    expect(appJs).toMatch(/recorded: read from the endpoint at \$\{rc\.created_at\}; stored, not live/);
  });
  it("a case held in the browser keeps its reading label and receipt time, never live", () => {
    const s = L.localLabelDetail({ reading_label: "live attempt · no reading", receipt: { created_at: "2026-10-12T19:00:00.000Z" } });
    expect(s).toBe("live attempt · no reading · 2026-10-12T19:00:00.000Z · not live");
  });
  it("every stored label in app.js is used exactly as labels.js returns it: no suffix cut, nothing appended (ADV-S3-F02, kills S2M02br)", () => {
    // Every call of a label builder, outside the import line.
    const calls = [...appJs.matchAll(/\b(storyLabelDetail|localLabelDetail)\(/g)].filter((m) => !appJs.slice(Math.max(0, m.index! - 40), m.index!).includes("const {"));
    expect(calls.length).toBeGreaterThanOrEqual(3);
    for (const m of calls) {
      const rest = appJs.slice(m.index!, m.index! + 60);
      // The call is closed and directly followed by "," "}" or ")": no .slice/.replace/+/[…] on the label.
      expect(rest, rest).toMatch(/^(storyLabelDetail\(s\)|localLabelDetail\(view\))\s*[,})]/);
    }
    expect(appJs).toMatch(/storedDetail: storyLabelDetail\(s\) \}/);
    expect(appJs).toMatch(/storyLabel: storyLabelDetail\(s\) \}/);
    expect(appJs).toMatch(/storedDetail: localLabelDetail\(view\) \}/);
  });
  it("app.js builds every stored label through labels.js and writes no live label or clock time of its own", () => {
    expect(appJs).toMatch(/storedDetail: storyLabelDetail\(s\)/);
    expect(appJs).toMatch(/storedDetail: localLabelDetail\(view\)/);
    // Result labels ("live reading · …", "live reading from …") live only in labels.js; feature text about live reading may stay.
    expect(appJs).not.toMatch(/live reading ·|live reading from|"live reading"/i);
    expect(appJs).not.toMatch(/storedDetail:\s*`/);
    expect(appJs.match(/new Date\(\)/g) ?? []).toHaveLength(1); // only the browser-held decision time, labelled browser time
  });
});

describe("release gating in the UI (S2M08, S2-04, B-14)", () => {
  const L = loadLabels();
  it("release is offered only for a release proposal that is not an error", () => {
    expect(L.releaseAllowed({ proposal: "release", status: "processed" })).toBe(true);
    expect(L.releaseAllowed({ proposal: "block", status: "processed" })).toBe(false);
    expect(L.releaseAllowed({ proposal: "review", status: "processed" })).toBe(false);
    expect(L.releaseAllowed({ proposal: "release", status: "error" })).toBe(false);
    expect(L.releaseAllowed(null)).toBe(false);
  });
  it("on the stored stories: disabled for cg-002 and cg-003, enabled for cg-001", async () => {
    for (const [id, ok] of [["cg-001", true], ["cg-002", false], ["cg-003", false]] as const) {
      const st = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", `${id}.json`), "utf8"));
      expect(L.releaseAllowed(st.view), id).toBe(ok);
    }
  });
  it("app.js gates the Release button and the browser-held decision only through releaseAllowed", () => {
    expect(appJs).toMatch(/const releaseOk = releaseAllowed\(view\);/);
    expect(appJs).toMatch(/disabled: !releaseOk/);
    expect(appJs).not.toMatch(/releaseOk\s*=\s*true/);
    expect(appJs).toMatch(/d\.action === "release" && !releaseAllowed\(view\)/);
  });
});
