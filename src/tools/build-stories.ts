// The three judge-mode stories (S3-18, D3-08): RECORDED real runs of cg-001, cg-002 and cg-003 through the
// product's own live pipeline, stored as versioned static files in public/stories/ with their receipt, F1
// snapshot and recording date. They are never presented as live (I7).
//
//   node dist/src/tools/build-stories.js record   real endpoint (MODEL_BASE_URL, MODEL_API_KEY, MODEL_ID); run
//                                                  only under the room's endpoint lease (D3-02); 3 readings
//   node dist/src/tools/build-stories.js           offline: rebuilds the story files from the stored recordings
//
// "record" writes <id>.recording.json (the endpoint's message content verbatim, response identity, usage, attempts,
// F1 snapshot; never the key, the base-URL value or the model's reasoning) and the story files. The offline build
// replays each recording through the same pipeline, so a test can check that the stored stories are what the
// candidate's pipeline produces from the recorded replies. Whatever a recorded run proposes is what its story
// shows (R3.3 C-23); nothing is re-run or selected.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadDatasetCase, loadShared } from "../cases.js";
import { processCase, type CaseResult } from "../pipeline.js";
import { ReaderError, type ModelReader } from "../reader.js";
import { exportReceipt } from "../receipt.js";
import { summary } from "../cli.js";
import { PUBLIC_DIR, STORY_IDS } from "../web/app.js";
import { loadWebConfig } from "../web/config.js";
import { probeF1 } from "../web/f1.js";
import { LiveReader, promptSha256 } from "../web/live-reader.js";
import { RecordedReader, type StoryRecording } from "../web/recorded-reader.js";
import { ENDPOINT_NAME } from "../web/f1.js";
import { toView } from "../web/view.js";

export const STORIES_DIR = path.join(PUBLIC_DIR, "stories");

const TITLES: Record<string, { title: string; kind: string }> = {
  "cg-001": { title: "Conforming", kind: "conforming digital certificate" },
  "cg-002": { title: "Out of spec", kind: "scanned certificate out of spec" },
  "cg-003": { title: "The ambiguous scan", kind: "ambiguous scan (smudged digit)" },
};

export function recordingFile(id: string, dir = STORIES_DIR) {
  return path.join(dir, `${id}.recording.json`);
}

/** The story label: recorded, with the reporting model, the endpoint and the recording date; never "live". */
export function storyLabel(rec: StoryRecording): string {
  return `recorded real reading · ${rec.model_reported ?? "model not reported"} via ${ENDPOINT_NAME} · ${rec.recorded_at} · not live`;
}

/** The view of a story run, relabelled as recorded (I7): the reading came from the endpoint at recording time. */
export function storyView(r: CaseResult, rec: StoryRecording) {
  const view = toView(r);
  const steps = view.steps.map((s) => s.name.startsWith("Model reading")
    ? { ...s, name: "Model reading · recorded real reading", note: `read by the endpoint at ${rec.recorded_at}; stored, not live` }
    : s);
  return { ...view, steps, reading_label: storyLabel(rec), receipt: JSON.parse(exportReceipt(r.receipt, {})) };
}

function storyFile(id: string, r: CaseResult, rec: StoryRecording) {
  return {
    story_schema: "certgate.story/2",
    stored: true,
    recorded: true,
    stored_at: rec.recorded_at,
    recorded_at: rec.recorded_at,
    stored_label: storyLabel(rec),
    model_reported: rec.model_reported,
    title: TITLES[id]!.title,
    summary: summary(r),
    recording: path.basename(recordingFile(id)),
    view: storyView(r, rec),
  };
}

function writeStories(outDir: string, runs: { id: string; r: CaseResult; rec: StoryRecording }[]) {
  mkdirSync(outDir, { recursive: true });
  const index = runs.map(({ id, r, rec }) => {
    writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(storyFile(id, r, rec), null, 2) + "\n");
    return { id, title: TITLES[id]!.title, kind: TITLES[id]!.kind, proposal: r.decision.proposal, stored_at: rec.recorded_at, recorded: true, model_reported: rec.model_reported };
  });
  writeFileSync(path.join(outDir, "index.json"), JSON.stringify({ stories: index }, null, 2) + "\n");
  return index;
}

/** Re-runs a story offline from its recording (judge mode, tests). Makes no endpoint call. */
export async function replayStory(id: string, confirmations: Parameters<typeof processCase>[1] = [], dir = STORIES_DIR, now: (() => Date) | null = null) {
  const rec = RecordedReader.fromFile(recordingFile(id, dir)).recording;
  const input = loadDatasetCase(id, loadShared("real"));
  const sha = createHash("sha256").update(input.certificate).digest("hex");
  if (sha !== rec.certificate_sha256) throw new Error(`${id}: recording is for another certificate`);
  const r = await processCase({ ...input, reader: new RecordedReader(rec), f1: rec.f1, now: now ?? (() => new Date(rec.recorded_at)) }, confirmations);
  return { r, rec };
}

/** Offline build from the stored recordings. */
export async function buildStories(outDir = STORIES_DIR, recordingsDir = STORIES_DIR) {
  const runs = [];
  for (const id of STORY_IDS) runs.push({ id, ...(await replayStory(id, [], recordingsDir)) });
  return writeStories(outDir, runs);
}

/** Records the three stories from the real endpoint. */
export async function recordStories(env: NodeJS.ProcessEnv = process.env, outDir = STORIES_DIR) {
  const cfg = loadWebConfig(env);
  if (!cfg.modelBaseUrl || !cfg.modelId) throw new Error("MODEL_BASE_URL and MODEL_ID must be set; stories are never recorded from the mock");
  const clock = () => new Date();
  const runs = [];
  for (const id of STORY_IDS) {
    const input = loadDatasetCase(id, loadShared("real"));
    const live = new LiveReader({ baseUrl: cfg.modelBaseUrl, modelId: cfg.modelId, apiKey: cfg.modelApiKey });
    let output: string | null = null;
    let failure: StoryRecording["failure"] = null;
    const capturing: ModelReader = {
      kind: live.kind, reader_id: live.reader_id, model_version: live.model_version, vllm_version: live.vllm_version,
      rocm_version: live.rocm_version, planted: live.planted, retry: live.retry,
      get model_id() { return live.model_id; },
      get requested_model_id() { return live.requested_model_id; },
      get calls() { return live.calls; },
      get lastResponse() { return live.lastResponse; },
      async read(req) {
        try {
          output = await live.read(req);
          failure = null;
          return output;
        } catch (e) {
          if (e instanceof ReaderError) failure = { class: e.errorClass, detail: e.message };
          throw e;
        }
      },
    };
    const recordedAt = clock().toISOString();
    const f1Before = await probeF1(cfg, clock, null);
    const r = await processCase({ ...input, reader: capturing, f1: f1Before, now: () => new Date(recordedAt) });
    const f1 = live.lastCall ? await probeF1(cfg, clock, live.lastCall) : f1Before;
    r.receipt.f1 = f1;
    const rec: StoryRecording = {
      recording_schema: "certgate.story-recording/1",
      case_id: id,
      recorded_at: recordedAt,
      certificate_sha256: createHash("sha256").update(input.certificate).digest("hex"),
      prompt_sha256: promptSha256(),
      requested_model_id: cfg.modelId,
      model_reported: live.lastCall?.model_reported ?? null,
      endpoint_host: new URL(cfg.modelBaseUrl).host,
      endpoint_response: live.lastResponse,
      attempts: live.attempts,
      model_output: output,
      failure: output === null ? failure : null,
      f1,
    };
    writeFileSync(recordingFile(id, outDir), JSON.stringify(rec, null, 2) + "\n");
    runs.push({ id, r, rec });
    process.stdout.write(`${id} ${r.readings.case.status} ${r.decision.proposal} [${r.decision.reasons.map((x) => x.code).join(", ")}] ${recordedAt}\n`);
  }
  return writeStories(outDir, runs);
}

const entry = process.argv[1] ?? "";
if (entry.replace(/\\/g, "/").endsWith("tools/build-stories.js")) {
  const job = process.argv[2] === "record" ? recordStories() : buildStories();
  job.then((ix) => process.stdout.write(ix.map((s) => `${s.id} ${s.proposal} ${s.stored_at}`).join("\n") + "\n"));
}
