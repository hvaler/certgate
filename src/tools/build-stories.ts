// Generates the three judge-mode stories (S2-14, B-23) by running the product's own mock pipeline on the
// dataset cases and writing the result, with its real receipt and created_at, as versioned static files in
// public/stories/. Run: node dist/src/tools/build-stories.js. The files are committed; the server never
// regenerates them, and their timestamp is the run's created_at, never build time or "now" (B-12).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadDatasetCase, loadShared } from "../cases.js";
import { processCase } from "../pipeline.js";
import { exportReceipt } from "../receipt.js";
import { summary } from "../cli.js";
import { PUBLIC_DIR, STORY_IDS } from "../web/app.js";
import { toView } from "../web/view.js";

const TITLES: Record<string, { title: string; kind: string }> = {
  "cg-001": { title: "Conforming", kind: "conforming digital certificate" },
  "cg-002": { title: "Out of spec", kind: "scanned certificate out of spec" },
  "cg-003": { title: "The scan it refuses to release", kind: "ambiguous scan" },
};

export async function buildStories(outDir = path.join(PUBLIC_DIR, "stories")) {
  mkdirSync(outDir, { recursive: true });
  const shared = loadShared("mock");
  const index = [];
  for (const id of STORY_IDS) {
    const r = await processCase(loadDatasetCase(id, shared));
    const view = toView(r);
    const story = {
      story_schema: "certgate.story/1",
      stored: true,
      stored_at: r.receipt.created_at,
      stored_label: `stored · mock reading, no model · ${r.receipt.created_at}`,
      title: TITLES[id]!.title,
      summary: summary(r),
      view: { ...view, receipt: JSON.parse(exportReceipt(r.receipt, {})) },
    };
    writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(story, null, 2) + "\n");
    index.push({ id, title: TITLES[id]!.title, kind: TITLES[id]!.kind, proposal: r.decision.proposal, stored_at: r.receipt.created_at });
  }
  writeFileSync(path.join(outDir, "index.json"), JSON.stringify({ stories: index }, null, 2) + "\n");
  return index;
}

const entry = process.argv[1] ?? "";
if (entry.replace(/\\/g, "/").endsWith("tools/build-stories.js")) {
  buildStories().then((ix) => process.stdout.write(ix.map((s) => `${s.id} ${s.proposal} ${s.stored_at}`).join("\n") + "\n"));
}
