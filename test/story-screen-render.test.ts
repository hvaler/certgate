// ADV-S3-F02 (Stage 3 repair 3; S3-26, I7): the RENDERED story screen and its receipt screen say "not live". The
// real public/labels.js and public/app.js run in a Node vm with a minimal DOM stand-in (no DOM library is a
// dependency), and fetch answers from the committed static files. Kills S2M02br (suffix cut off the story label)
// and the same mutation on the receipt label. No network.
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";

class FakeNode {
  children: FakeNode[] = [];
  attrs: Record<string, string> = {};
  listeners: Record<string, ((e: unknown) => void)[]> = {};
  className = "";
  value = "";
  disabled = false;
  checked = false;
  classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
  constructor(public tag: string, private text: string | null = null) {}
  get textContent(): string { return this.text ?? this.children.map((c) => c.textContent).join(""); }
  set textContent(v: string) { this.text = String(v); this.children = []; }
  append(...xs: FakeNode[]) { this.children.push(...xs); }
  replaceChildren(...xs: FakeNode[]) { this.children = xs; }
  setAttribute(k: string, v: string) { this.attrs[k] = v; }
  getAttribute(k: string) { return this.attrs[k] ?? null; }
  addEventListener(t: string, f: (e: unknown) => void) { (this.listeners[t] ??= []).push(f); }
  scrollIntoView() {}
  find(pred: (n: FakeNode) => boolean): FakeNode[] {
    return [...(pred(this) ? [this] : []), ...this.children.flatMap((c) => c.find(pred))];
  }
}

async function loadApp() {
  const view = new FakeNode("div");
  const byId: Record<string, FakeNode> = { view, "endpoint-text": new FakeNode("span") };
  const document = {
    createElement: (t: string) => new FakeNode(t),
    createTextNode: (t: string) => new FakeNode("#text", t),
    getElementById: (id: string) => byId[id] ?? null,
    querySelector: () => null,
    body: new FakeNode("body"),
  };
  const fetch = async (url: string) => {
    const file = path.join(ROOT, "public", decodeURIComponent(String(url).split("?")[0]!).replace(/^\/+/, ""));
    let body: unknown = null;
    let ok = true;
    try { body = JSON.parse(readFileSync(file, "utf8")); } catch { ok = false; }
    return { ok, status: ok ? 200 : 404, json: async () => body };
  };
  const store: Record<string, string> = {};
  const ctx: Record<string, unknown> = {
    document, fetch, console, setTimeout, clearTimeout,
    location: { hash: "#/" }, localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } },
    addEventListener() {}, scrollTo() {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(path.join(ROOT, "public", "labels.js"), "utf8"), ctx);
  vm.runInContext(readFileSync(path.join(ROOT, "public", "app.js"), "utf8"), ctx);
  return { ctx: ctx as Record<string, any>, view };
}

const storedLabel = (root: FakeNode) => root.find((n) => n.attrs["data-stored-label"] !== undefined).map((n) => n.textContent);

describe("rendered story labels say not live (ADV-S3-F02, S3-26, I7)", () => {
  for (const id of ["cg-001", "cg-002", "cg-003"]) {
    it(`${id}: the story screen label and the receipt screen label end with "not live"`, async () => {
      const { ctx, view } = await loadApp();
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
    const { ctx, view } = await loadApp();
    const story = JSON.parse(readFileSync(path.join(ROOT, "public", "stories", "cg-003.json"), "utf8"));
    await ctx.storyScreen("cg-003");
    const expected = ctx.CertGateLabels.storyLabelDetail({ storedAt: story.recorded_at, model: story.model_reported, evaluatedAt: null });
    expect(storedLabel(view)[0]).toBe(`Recorded reading · ${expected}`);
  });
});
