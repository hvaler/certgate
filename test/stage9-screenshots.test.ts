// Stage 9 (dispatch 7; R9.0 S9-02…S9-05, R9.1 V-02…V-09, R9.2 W-01…W-04): the screenshot manifest and the saved
// records of the live reading, checked against the images, git and each other. Repository-only: the image files and
// the evidence are not in the Docker image (.dockerignore), so these checks are skipped there, like Stage 7's.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";

const SHOTS = path.join(ROOT, "docs", "screenshots");
const EVID = path.join(ROOT, "evidence", "runs", "certgate-001", "stage-9", "implementer");
const REPO = existsSync(path.join(ROOT, "evidence")) && existsSync(path.join(SHOTS, "manifest.json")) && existsSync(path.join(ROOT, ".git"));
const repoOnly = describe.skipIf(!REPO);
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
/** Screens taken by the Stage 9 script; every other screen comes from the unchanged Stage 7 tool. */
const STAGE9_SCREENS = new Set(["live-models", "live-queued", "live-reading", "live-done", "live-receipt", "live-failed", "live-mismatch"]);
type Img = { file: string; screen: string; width: number; sha256: string; caption: string; captured_at?: string; url?: string; visible_field?: { code_input_present: boolean; code_input_empty: boolean; secret_hits: number } };
const load = () => JSON.parse(readFileSync(path.join(SHOTS, "manifest.json"), "utf8"));
const sameModel = (id: string, other: string) => {
  const a = id.toLowerCase(); const b = String(other ?? "").toLowerCase();
  if (a === b) return true;
  const i = b.indexOf("/");
  return i > 0 && i === b.lastIndexOf("/") && b.slice(i + 1) === a;
};

repoOnly("Stage 9 screenshot manifest (S9-05, V-05, V-06, W-01, W-02)", () => {
  it("lists every PNG under docs/screenshots/, no missing and no extra, each with its hash", () => {
    const m = load();
    const pngs = readdirSync(SHOTS).filter((f) => f.endsWith(".png")).sort();
    expect((m.images as Img[]).map((i) => i.file).sort()).toEqual(pngs);
    for (const im of m.images as Img[]) expect(sha(readFileSync(path.join(SHOTS, im.file))), im.file).toBe(im.sha256);
  });
  it("lists the 12 files under public/ at the site commit, with the SHA-256 of their committed bytes", () => {
    const m = load();
    const listed = execFileSync("git", ["ls-tree", "-r", "--name-only", m.site_commit, "public/"], { cwd: ROOT }).toString().trim().split("\n");
    expect(Object.keys(m.served_files_sha256).sort()).toEqual(listed.map((p) => p.slice("public".length)).sort());
    for (const p of listed) {
      const blob = execFileSync("git", ["show", `${m.site_commit}:${p}`], { cwd: ROOT });
      expect(m.served_files_sha256[p.slice("public".length)], p).toBe(sha(blob));
    }
    expect(Object.keys(m.served_files_fetched_at).length).toBe(listed.length);
  });
  it("every caption names site commit 37938b2 and no other commit, and is built whole from the manifest", () => {
    const m = load();
    expect(m.site_commit).toBe("37938b251189fed7be636fc2187e6fbd1fe778fa");
    for (const im of m.images as Img[]) {
      expect(im.caption, im.file).not.toMatch(/c040e82|cf97dfa|d1aaa3e/);
      if (STAGE9_SCREENS.has(im.screen)) {
        expect(im.captured_at, `${im.file} must carry its own capture time`).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        const state = im.screen === "live-models" ? "" : im.screen === "live-failed" || im.screen === "live-mismatch" ? ` · failed (${m.live.failure.reason_class})` : ` · ${im.screen === "live-done" || im.screen === "live-receipt" ? "done" : im.screen.slice("live-".length)}`;
        const fallback = m.live.model_requested === "Qwen3.8-27B" ? / · fallback: Gemma-4-31B-IT (unlisted|failed: [a-z0-9_]+)/.exec(im.caption)?.[0] ?? "<missing fallback note>" : "";
        expect(im.caption, im.file).toBe(`${im.screen}${state} · model ${m.live.model_requested}${fallback} · site commit 37938b2 · captured ${im.captured_at}`);
      } else {
        expect(im.captured_at, `${im.file} is a tool image and takes the run time`).toBeUndefined();
        expect(im.caption, im.file).toBe(`${im.screen} · site commit 37938b2 · captured ${m.captured_at}`);
      }
    }
  });
  it("every Stage 9 time lies after the tool run started and inside the Stage 9 run", () => {
    const m = load();
    const run = m.runs.find((r: { script: string }) => r.script.endsWith("capture-stage9.mjs"));
    for (const im of (m.images as Img[]).filter((i) => STAGE9_SCREENS.has(i.screen))) {
      expect(im.captured_at! >= m.captured_at, im.file).toBe(true);
      expect(im.captured_at! >= run.started_at && im.captured_at! <= run.finished_at, im.file).toBe(true);
    }
    for (const f of Object.keys(run.public_files_sha256_before)) expect(run.public_files_sha256_after[f], f).toBe(run.public_files_sha256_before[f]);
  });
  it("records the access-code field of every Stage 9 image: empty wherever present, and no secret hit (V-02, W-09)", () => {
    const m = load();
    for (const im of (m.images as Img[]).filter((i) => STAGE9_SCREENS.has(i.screen))) {
      expect(im.visible_field, im.file).toBeDefined();
      if (im.visible_field!.code_input_present) expect(im.visible_field!.code_input_empty, im.file).toBe(true);
      expect(im.visible_field!.secret_hits, im.file).toBe(0);
    }
  });
});

repoOnly("Stage 9 live reading: the images follow the job's own record (V-03, V-04, V-08, V-09, W-03, W-04)", () => {
  const records = REPO ? readdirSync(EVID).filter((f) => /^capture-.+\.json$/.test(f)).map((f) => ({ f, r: JSON.parse(readFileSync(path.join(EVID, f), "utf8")) })) : [];
  it("each capture run made at most one job POST and has an outcome; at most 3 readings in the stage", () => {
    expect(records.length).toBeGreaterThan(0);
    expect(records.length).toBeLessThanOrEqual(3);
    for (const { f, r } of records) {
      expect(r.live.job_posts, f).toBeLessThanOrEqual(1);
      expect(["done", "failed", "not run: model not listed"], f).toContain(r.live.outcome);
    }
  });
  it("the manifest's live block is the last run's, and done or failed is shown with exactly its own images", () => {
    const m = load();
    const last = records.find(({ r }) => r.live.job_id === m.live.job_id)!;
    expect(last, "the manifest names a recorded job").toBeDefined();
    expect(m.live).toEqual(last.r.live);
    const screens = new Set((m.images as Img[]).map((i) => i.screen));
    if (m.live.outcome === "done") {
      for (const s of ["live-done", "live-receipt"]) expect(screens.has(s), s).toBe(true);
      expect(screens.has("live-failed")).toBe(false);
      expect(sameModel(m.live.model_requested, m.live.model_reported)).toBe(true);
      expect(m.live.failure).toBeNull();
    } else if (m.live.outcome === "failed") {
      expect(screens.has("live-failed") || screens.has("live-mismatch")).toBe(true);
      for (const s of ["live-done", "live-receipt"]) expect(screens.has(s), s).toBe(false);
    }
  });
  it("a done reading's saved receipt is live, of the requested measured model as reported, evaluated, and its listing is fresh", () => {
    for (const { f, r } of records.filter(({ r }) => r.live.outcome === "done")) {
      const j = r.job_record;
      const rc = j.result.view.receipt;
      expect(j.job_id, f).toBe(r.live.job_id);
      expect(j.state, f).toBe("done");
      expect(["Gemma-4-31B-IT", "Qwen3.8-27B"], f).toContain(j.model_requested);
      if (j.model_requested === "Qwen3.8-27B") expect(r.fallback, `${f}: a Qwen reading is a declared fallback`).toMatch(/^Gemma-4-31B-IT (unlisted|failed: [a-z0-9_]+)$/);
      expect(rc.reading_source, f).toBe("live");
      expect(rc.model_choice).toMatchObject({ requested: j.model_requested, evaluated: true, group: "measured" });
      expect(sameModel(j.model_requested, rc.model_choice.reported), f).toBe(true);
      expect(rc.f1.model_requested, f).toBe(j.model_requested);
      // The listing that validated the POST is at most 60 s older than the POST, and the F1 copy is no later than done.
      const posted = r.live.timeline.find((t: { state: string }) => t.state === "posted").at;
      const done = r.live.timeline.find((t: { state: string }) => t.state === "done").at;
      expect(Date.parse(posted) - Date.parse(j.listing_checked_at), f).toBeLessThanOrEqual(60_000);
      expect(rc.f1.checked_at <= done, f).toBe(true);
      for (const im of r.images.filter((i: Img) => i.screen === "live-done" || i.screen === "live-receipt")) expect(im.caption, im.file).toContain(` · done · model ${j.model_requested}`);
    }
  });
  it("a failed reading is labelled failed with its reason class from the job record", () => {
    for (const { f, r } of records.filter(({ r }) => r.live.outcome === "failed")) {
      expect(r.live.failure.reason_class, f).toBeTruthy();
      for (const im of r.images.filter((i: Img) => i.screen === "live-failed" || i.screen === "live-mismatch")) expect(im.caption, im.file).toContain(` · failed (${r.live.failure.reason_class})`);
      expect(r.images.some((i: Img) => i.screen === "live-done"), f).toBe(false);
    }
  });
});
