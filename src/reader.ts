// Model channel. ModelReader is the interface a real adapter will implement in a later dispatch; in this
// dispatch only MockReader exists, and it is labelled as mock everywhere it is used (invariant I7).
import { readFileSync } from "node:fs";
import type { PlantedEntry } from "./model-output.js";
import { parseStrictJson } from "./strict-json.js";

export type ReaderErrorClass =
  | "endpoint_off"
  | "timeout"
  | "http_429"
  | "http_5xx"
  | "invalid_json"
  | "invalid_output"
  | "endpoint_not_configured";

export const RETRYABLE: ReadonlySet<ReaderErrorClass> = new Set(["timeout", "http_429", "http_5xx"]);
export const MAX_RETRIES = 2;

export class ReaderError extends Error {
  constructor(readonly errorClass: ReaderErrorClass, message: string) {
    super(message);
    this.name = "ReaderError";
  }
}

export interface ReadRequest {
  case_id: string;
  certificate: Uint8Array;
}

export interface ModelReader {
  readonly kind: "mock" | "live";
  readonly reader_id: string;
  readonly model_id: string;
  readonly model_version: string;
  readonly vllm_version: string;
  readonly rocm_version: string;
  /** Returns the raw text the model channel produced; the pipeline parses and validates it. */
  read(req: ReadRequest): Promise<string>;
  /** Number of read() calls made so far on this instance. */
  readonly calls: number;
  /**
   * Deviations the reader itself declares as planted (dataset mock only). They are known even when read()
   * fails, so a receipt of an injected failure is still labelled planted (register A-01, D1-05, finding F-01).
   */
  readonly planted: PlantedEntry[];
}

export const MOCK_LABEL = "MOCK (no model; dataset reading)";
const NOT_APPLICABLE = "not applicable (mock)";

const FAILURE_CLASSES = new Set(["endpoint_off", "timeout", "http_429", "http_5xx", "invalid_json"]);

/**
 * Returns the dataset's mock model output for one case. It never calls a network or a model. Failure
 * injection (register D1-05) comes from the output file's `mock_failure` entry.
 */
export class MockReader implements ModelReader {
  readonly kind = "mock" as const;
  readonly reader_id = "mock-reader";
  readonly model_id = MOCK_LABEL;
  readonly model_version = NOT_APPLICABLE;
  readonly vllm_version = NOT_APPLICABLE;
  readonly rocm_version = NOT_APPLICABLE;
  private count = 0;
  private readonly failure: ReaderErrorClass | null;
  /** false: the injected failure happens on the first call only, so a retry can succeed (D1-05). */
  private readonly persistent: boolean;
  /** Set when the mock output file itself cannot be used; read() then reports it as invalid model output. */
  private readonly unusable: { cls: ReaderErrorClass; detail: string } | null = null;
  readonly planted: PlantedEntry[] = [];

  constructor(private readonly outputText: string) {
    let parsed: { mock_failure?: { class?: unknown; persistent?: unknown }; planted?: { kind?: unknown; field?: unknown; note?: unknown }[] };
    try {
      parsed = parseStrictJson(outputText, "mock model output") as typeof parsed;
    } catch (e) {
      // A broken mock output is model output that fails validation (I5): it goes through the reader-error
      // path and yields a receipt, never an internal error (finding ADV-S1-F02).
      const cls: ReaderErrorClass = /not valid JSON/.test((e as Error).message) ? "invalid_json" : "invalid_output";
      this.unusable = { cls, detail: (e as Error).message };
      this.failure = null;
      this.persistent = true;
      return;
    }
    if (Array.isArray(parsed.planted)) {
      this.planted = parsed.planted.map((p) => ({ kind: String(p.kind), field: typeof p.field === "string" ? p.field : null, note: String(p.note ?? "") }));
    }
    const cls = parsed.mock_failure?.class;
    if (cls !== undefined && (typeof cls !== "string" || !FAILURE_CLASSES.has(cls))) {
      this.unusable = { cls: "invalid_output", detail: `mock model output: unknown mock_failure class ${String(cls)}` };
    }
    this.failure = this.unusable ? null : ((cls as ReaderErrorClass | undefined) ?? null);
    this.persistent = parsed.mock_failure?.persistent !== false;
    if (this.failure && !this.planted.some((p) => p.kind === "failure")) {
      this.planted.push({ kind: "failure", field: null, note: `injected reader failure ${this.failure}` });
    }
  }

  static fromFile(file: string): MockReader {
    return new MockReader(readFileSync(file, "utf8"));
  }

  get calls() {
    return this.count;
  }

  async read(_req: ReadRequest): Promise<string> {
    this.count++;
    if (this.unusable) throw new ReaderError(this.unusable.cls, this.unusable.detail);
    const failing = this.failure !== null && (this.persistent || this.count === 1) ? this.failure : null;
    switch (failing) {
      case null:
        return this.outputText;
      case "invalid_json":
        // Simulates a reply that is cut off or is not JSON.
        return this.outputText.slice(0, Math.floor(this.outputText.length / 2));
      default:
        throw new ReaderError(failing, `mock reader: injected failure ${failing}`);
    }
  }
}

/**
 * CERTGATE_MODE=real in this dispatch: no adapter exists and no endpoint is configured. It fails visibly and
 * never falls back to the mock (register S1-19, D1-15).
 */
export class UnconfiguredLiveReader implements ModelReader {
  readonly kind = "live" as const;
  readonly reader_id = "live-reader-unconfigured";
  readonly model_id = "none (model endpoint not configured)";
  readonly model_version = "unknown";
  readonly vllm_version = "unknown";
  readonly rocm_version = "unknown";
  readonly planted: PlantedEntry[] = [];
  private count = 0;

  get calls() {
    return this.count;
  }

  async read(_req: ReadRequest): Promise<string> {
    this.count++;
    throw new ReaderError("endpoint_not_configured", "model endpoint not configured: no live reading in this build");
  }
}
