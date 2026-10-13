// Replay of a RECORDED real reading (S3-18, D3-08). A judge-mode story stores the endpoint's reply (the message
// content only; reasoning is never stored) together with its response identity and usage. This reader returns that
// stored reply so the product's own pipeline can re-evaluate the story offline (tests, confirmations in judge
// mode) without calling the endpoint. It is not a model and not the mock: it can only return what the real
// endpoint answered at recording time, and every receipt built from it is labelled recorded with that date.
import { readFileSync } from "node:fs";
import type { PlantedEntry } from "../model-output.js";
import { ReaderError, type ModelReader, type ReadRequest, type RetryPolicy } from "../reader.js";
import type { F1Snapshot } from "../types.js";

export interface StoryRecording {
  recording_schema: "certgate.story-recording/1";
  case_id: string;
  recorded_at: string;
  certificate_sha256: string;
  prompt_sha256: string;
  requested_model_id: string;
  model_reported: string | null;
  endpoint_host: string;
  endpoint_response: Record<string, string | null> | null;
  attempts: { started_at: string; elapsed_ms: string; outcome: string; http_status: string | null; detail: string | null }[];
  /** The message content returned by the endpoint, verbatim; null when the reading failed (C11). */
  model_output: string | null;
  /** C11 class and detail of the final failure when model_output is null. */
  failure: { class: string; detail: string } | null;
  f1: F1Snapshot | null;
}

export const RECORDED_READER_ID = "recorded-real-reading (replay of the stored endpoint reply)";

export class RecordedReader implements ModelReader {
  readonly kind = "live" as const;
  readonly reader_id = RECORDED_READER_ID;
  readonly model_id: string;
  readonly requested_model_id: string;
  readonly model_version = "as reported by the endpoint at recording time";
  readonly vllm_version = "not exposed by the endpoint";
  readonly rocm_version = "not exposed by the endpoint";
  readonly planted: PlantedEntry[] = [];
  readonly retry: RetryPolicy = { retryable: new Set(), maxAttempts: 1, delayMs: () => 0 };
  private count = 0;

  constructor(readonly recording: StoryRecording) {
    this.model_id = recording.model_reported ?? "unknown (not reported by the endpoint)";
    this.requested_model_id = recording.requested_model_id;
  }

  static fromFile(file: string): RecordedReader {
    return new RecordedReader(JSON.parse(readFileSync(file, "utf8")) as StoryRecording);
  }

  get calls() { return this.count; }
  get lastResponse() { return this.recording.endpoint_response; }

  async read(_req: ReadRequest): Promise<string> {
    this.count++;
    if (this.recording.model_output === null) {
      const f = this.recording.failure ?? { class: "invalid_json", detail: "recorded reading failed" };
      throw new ReaderError(f.class as ConstructorParameters<typeof ReaderError>[0], f.detail);
    }
    return this.recording.model_output;
  }
}
