// A job's reader with a deadline (Stage 6, R6.3 J-03/J-14 as ruled on W-03). It wraps the unchanged LiveReader: each
// attempt gets a fresh LiveReader whose attempt timeout is min(time left, ADAPTER_ATTEMPT_TIMEOUT_MS), so an attempt
// never runs past the deadline; no attempt starts once the deadline has passed; and the wait between attempts never
// reaches past it. The request, the prompt and the calling discipline of the reading path stay as they are.
import type { PlantedEntry } from "../model-output.js";
import { ReaderError, type ModelReader, type ReadRequest, type RetryPolicy } from "../reader.js";
import { ADAPTER_ATTEMPT_TIMEOUT_MS } from "./limits.js";
import { LiveReader, type LiveCallInfo, type LiveReaderOptions } from "./live-reader.js";

/** Time kept free before the deadline: an attempt with less than this left is not started. */
export const MIN_ATTEMPT_MS = 1_000;

export class DeadlineReader implements ModelReader {
  readonly kind = "live" as const;
  readonly planted: PlantedEntry[] = [];
  private inner: LiveReader;
  private count = 0;
  /** Every attempt of every inner reader, in order (S3-13). */
  readonly attempts: LiveReader["attempts"][number][] = [];
  lastCall: LiveCallInfo | null = null;
  readonly retry: RetryPolicy;

  constructor(private readonly o: Omit<LiveReaderOptions, "attemptTimeoutMs">, private readonly deadlineAt: number, private readonly cap = ADAPTER_ATTEMPT_TIMEOUT_MS, private readonly now: () => number = () => Date.now()) {
    this.inner = new LiveReader({ ...o, attemptTimeoutMs: this.cap });
    const base = this.inner.retry;
    this.retry = {
      retryable: base.retryable,
      maxAttempts: base.maxAttempts,
      delayMs: (attempt, e) => Math.max(0, Math.min(base.delayMs(attempt, e), this.left() - MIN_ATTEMPT_MS)),
    };
  }
  private left() { return this.deadlineAt - this.now(); }
  get reader_id() { return this.inner.reader_id; }
  get model_version() { return this.inner.model_version; }
  get vllm_version() { return this.inner.vllm_version; }
  get rocm_version() { return this.inner.rocm_version; }
  get model_id() { return this.inner.model_id; }
  get requested_model_id() { return this.inner.requested_model_id; }
  get calls() { return this.count; }
  get lastResponse() { return this.inner.lastResponse; }

  async read(req: ReadRequest): Promise<string> {
    this.count++;
    const left = this.left();
    if (left < MIN_ATTEMPT_MS) throw new ReaderError("timeout", "the job's deadline was reached before this attempt");
    const previous = this.inner;
    this.inner = new LiveReader({ ...this.o, attemptTimeoutMs: Math.min(left, this.cap) });
    // Keep the last reply's identity when a later attempt fails without one.
    if (previous.lastCall && !this.inner.lastCall) this.lastCall = previous.lastCall;
    try {
      return await this.inner.read(req);
    } finally {
      this.attempts.push(...this.inner.attempts);
      if (this.inner.lastCall) this.lastCall = this.inner.lastCall;
    }
  }
}
