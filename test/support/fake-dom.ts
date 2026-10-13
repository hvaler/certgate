// Minimal DOM stand-in to run the real public/labels.js and public/app.js in a Node vm (no DOM library is a
// dependency). fetch answers from the committed static files under public/, or from `api` overrides by path.
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

export class FakeNode {
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

export async function loadApp(root: string, api: Record<string, unknown> = {}) {
  const view = new FakeNode("div");
  const byId: Record<string, FakeNode> = { view, "endpoint-text": new FakeNode("span") };
  const document = {
    createElement: (t: string) => new FakeNode(t),
    createTextNode: (t: string) => new FakeNode("#text", t),
    getElementById: (id: string) => byId[id] ?? null,
    querySelector: () => new FakeNode("span"),
    body: new FakeNode("body"),
  };
  const fetch = async (url: string) => {
    const p = String(url).split("?")[0]!;
    if (p in api) return { ok: true, status: 200, json: async () => structuredClone(api[p]) };
    const file = path.join(root, "public", decodeURIComponent(p).replace(/^\/+/, ""));
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
  vm.runInContext(readFileSync(path.join(root, "public", "labels.js"), "utf8"), ctx);
  vm.runInContext(readFileSync(path.join(root, "public", "app.js"), "utf8"), ctx);
  return { ctx: ctx as Record<string, any>, view };
}
