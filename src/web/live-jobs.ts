// Live-reading jobs (Stage 6, S6-02, S6-03; register R6.3 J-01…J-16): an asynchronous job API over a shared store
// (live-store.ts). POST admits a job and returns at once; the same invocation then waits for one of 2 in-flight slots
// and runs the reading (on Vercel inside waitUntil, in the container as an in-process promise); the browser polls.
// States: queued (with position) -> reading (with elapsed time) -> done | failed (with a reason class).
// A failed or timed-out job never carries a stored result (I7): only "done" has a result, built by the job's own
// reading. This module imports no recorded reader and no story (J-11).
import { randomBytes } from "node:crypto";
import type { LiveStore } from "./live-store.js";
import type { LiveBudget } from "./limits.js";

const P = "certgate:live:";
export const KEYS = {
  job: (id: string) => `${P}job:${id}`,
  queue: `${P}queue`,
  slot: (i: number) => `${P}slot:${i}`,
  reads: (hour: string) => `${P}reads:${hour}`,
  /** J-01: per client (SHA-256 of the client address, never stored raw) and global. */
  codeFailClient: (client: string, hour: string) => `${P}codefail:c:${client}:${hour}`,
  codeFailGlobal: (hour: string) => `${P}codefail:g:${hour}`,
  f1: `${P}f1`,
  f1Last: `${P}f1:last`,
  f1Lock: `${P}f1lock`,
};
export const JOB_TTL_S = 3600;
export const WINDOW_TTL_S = 7200;
/** J-13: 16 random bytes in hex. */
export const JOB_ID = /^[0-9a-f]{32}$/;
/** J-01: the global ceiling of failed codes is 10 x the per-client limit. */
export const GLOBAL_CODE_FAILURE_FACTOR = 10;

/** Reason classes with a fixed text each (J-07): no raw provider, store or fetch error text reaches a response. */
export const REASONS = {
  timeout: "the reading did not finish within the time limit; nothing stored is shown instead",
  queue_timeout: "timed out in queue: no reading slot became free in time",
  busy: "busy: two readings are already waiting; try again in a minute",
  endpoint_429: "the model endpoint is busy (HTTP 429); try again in a minute",
  endpoint_5xx: "the model endpoint failed or could not be reached",
  endpoint_4xx: "the model endpoint refused the request (HTTP 4xx)",
  invalid_model_output: "the model reply could not be used as a reading (not one valid JSON reading)",
  model_mismatch: "the endpoint reported a different model than the one requested; the reading is not shown",
  store_unavailable: "the shared store is unavailable; live reading refused",
} as const;
export type ReasonClass = keyof typeof REASONS;

export type JobState = "queued" | "reading" | "done" | "failed";
export interface JobRecord {
  job_id: string;
  state: JobState;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  model_requested: string;
  reason_class: ReasonClass | null;
  reason: string | null;
  /** Only for state "done": the view and receipt of this job's own reading. */
  result: unknown;
}
export type Outcome = { kind: "done"; result: Record<string, unknown> } | { kind: "failed"; reason_class: ReasonClass };

export class Refusal extends Error {
  constructor(readonly status: number, message: string, readonly extra: Record<string, unknown> = {}) {
    super(message);
  }
}

export const hourKey = (d: Date) => d.toISOString().slice(0, 13);
export function nextHour(d: Date) {
  const n = new Date(d.getTime());
  n.setUTCMinutes(0, 0, 0);
  n.setUTCHours(n.getUTCHours() + 1);
  return n.toISOString();
}

export class LiveJobs {
  constructor(
    readonly store: LiveStore,
    private readonly clock: () => Date,
    readonly budget: LiveBudget,
    private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  private now() { return this.clock().getTime(); }
  /** J-04: queue entries older than the longest queue wait (+10 s) belong to dead jobs. */
  private pruneBefore() { return this.now() - (this.budget.queueMaxWaitMs + 10_000); }

  /**
   * J-02, count first: every code attempt INCRs the per-client and the global counter in one atomic request before
   * any comparison. Over either limit: refused, no comparison. The caller DECRs both (`forgiveCode`) on a correct code.
   */
  async countCodeAttempt(client: string, perClient: number): Promise<{ over: boolean; reopens_at: string }> {
    const d = this.clock();
    const [c, g] = await this.store.incrPair(KEYS.codeFailClient(client, hourKey(d)), KEYS.codeFailGlobal(hourKey(d)), WINDOW_TTL_S);
    return { over: perClient <= 0 || c > perClient || g > perClient * GLOBAL_CODE_FAILURE_FACTOR, reopens_at: nextHour(d) };
  }
  async forgiveCode(client: string): Promise<void> {
    const h = hourKey(this.clock());
    await this.store.decrPair(KEYS.codeFailClient(client, h), KEYS.codeFailGlobal(h));
  }

  /**
   * Admission (CH6-05, CH6-08, J-16): refuse when 2 jobs already wait (busy: not a job, not counted); otherwise count
   * the job in the fixed UTC-hour window with one atomic INCR+EXPIRE, then create it. `arrivedAt` is the request's
   * arrival, from which the deadline is measured (J-14).
   */
  async admit(readsPerHour: number, modelRequested: string, arrivedAt: Date): Promise<JobRecord & { position: number }> {
    const d = this.clock();
    await this.store.zremBelow(KEYS.queue, this.pruneBefore());
    if ((await this.store.zcard(KEYS.queue)) >= this.budget.maxWaiting) throw new Refusal(429, REASONS.busy, { reason_class: "busy" });
    const n = await this.store.incr(KEYS.reads(hourKey(d)), WINDOW_TTL_S);
    if (readsPerHour <= 0 || n > readsPerHour) throw new Refusal(429, "live readings exhausted this hour", { reopens_at: nextHour(d) });
    const job: JobRecord = {
      job_id: randomBytes(16).toString("hex"), state: "queued", created_at: arrivedAt.toISOString(), started_at: null, finished_at: null,
      model_requested: modelRequested, reason_class: null, reason: null, result: null,
    };
    await this.store.set(KEYS.job(job.job_id), JSON.stringify(job), JOB_TTL_S);
    await this.store.zadd(KEYS.queue, arrivedAt.getTime(), job.job_id);
    return { ...job, position: ((await this.store.zrank(KEYS.queue, job.job_id)) ?? 0) + 1 };
  }

  private async save(job: JobRecord) {
    await this.store.set(KEYS.job(job.job_id), JSON.stringify(job), JOB_TTL_S);
  }

  /**
   * Runs an admitted job: waits for a slot (FIFO among the first `slots` waiting; one look every pollMs), then runs
   * `work` with the time left as its attempt timeout, raced against the deadline. The slot is released by
   * compare-and-delete on the job's own token when the work settles; if the deadline fires first the slot is kept and
   * expires by its TTL, so no third reading can start while a provider request may still run.
   */
  async run(admitted: JobRecord & { position?: number }, work: (attemptTimeoutMs: number) => Promise<Outcome>): Promise<void> {
    // The queue position is computed on each poll; it is never stored with the job.
    const { position: _position, ...stored } = admitted;
    let job: JobRecord = stored;
    const created = Date.parse(job.created_at);
    const fail = async (reason_class: ReasonClass) => {
      await this.save({ ...job, state: "failed", finished_at: this.clock().toISOString(), reason_class, reason: REASONS[reason_class], result: null });
    };
    let slot = -1;
    try {
      while (slot < 0) {
        if (this.now() - created > this.budget.queueMaxWaitMs) {
          await this.store.zrem(KEYS.queue, job.job_id);
          return await fail("queue_timeout");
        }
        await this.store.zremBelow(KEYS.queue, this.pruneBefore());
        const rank = await this.store.zrank(KEYS.queue, job.job_id);
        if (rank !== null && rank < this.budget.slots) {
          for (let i = 0; i < this.budget.slots && slot < 0; i++) if (await this.store.setNx(KEYS.slot(i), job.job_id, this.budget.leaseTtlMs)) slot = i;
        }
        if (slot < 0) await this.sleep(this.budget.pollMs);
      }
      await this.store.zrem(KEYS.queue, job.job_id);
    } catch {
      // J-15: a store error at a slot attempt fails the job; it never runs without the limits.
      if (slot >= 0) await this.store.delIfEquals(KEYS.slot(slot), job.job_id).catch(() => false);
      return await fail("store_unavailable").catch(() => undefined);
    }
    const startedAt = this.clock();
    job = { ...job, state: "reading", started_at: startedAt.toISOString() };
    try {
      await this.save(job);
    } catch {
      await this.store.delIfEquals(KEYS.slot(slot), job.job_id).catch(() => false);
      return;
    }
    const remaining = Math.max(1_000, created + this.budget.deadlineMs - startedAt.getTime());
    const reading = work(Math.min(remaining, this.budget.readBudgetMs))
      .catch((): Outcome => ({ kind: "failed", reason_class: "endpoint_5xx" }))
      .finally(() => this.store.delIfEquals(KEYS.slot(slot), job.job_id).catch(() => false));
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<"deadline">((r) => { timer = setTimeout(() => r("deadline"), remaining); });
    const first = await Promise.race([reading, deadline]);
    clearTimeout(timer);
    try {
      if (first === "deadline") return await fail("timeout");
      if (first.kind === "done") {
        const finished_at = this.clock().toISOString();
        // J-11: the result carries this job's id and times next to the receipt of its own reading.
        await this.save({ ...job, state: "done", finished_at, result: { ...first.result, job_id: job.job_id, started_at: job.started_at, finished_at } });
      } else {
        await fail(first.reason_class);
      }
    } catch {
      // The store went away after the reading: the poll derives "failed" (J-06), never "done".
    }
  }

  /**
   * The job as a poll sees it (J-05): one GET, plus one ZRANK while queued; no writes. J-06: a job is reported as
   * failed (timed out) when it is reading past started_at + deadline + 10 s, queued past created_at + queue wait +
   * 10 s, or not finished past created_at + 300 s.
   */
  async view(id: string): Promise<(JobRecord & { position?: number; elapsed_s?: number }) | null> {
    const raw = await this.store.get(KEYS.job(id));
    if (raw === null) return null;
    const job = JSON.parse(raw) as JobRecord;
    const now = this.now();
    const created = Date.parse(job.created_at);
    const g = this.budget.staleGraceMs;
    const orphan = (job.state === "reading" && now > Date.parse(job.started_at!) + this.budget.deadlineMs + g)
      || (job.state === "queued" && now > created + this.budget.queueMaxWaitMs + g)
      || ((job.state === "queued" || job.state === "reading") && now > created + Math.max(300_000, this.budget.deadlineMs + g));
    if (orphan) {
      const reason_class: ReasonClass = job.state === "queued" ? "queue_timeout" : "timeout";
      return { ...job, state: "failed", reason_class, reason: REASONS[reason_class], result: null };
    }
    if (job.state === "queued") return { ...job, position: ((await this.store.zrank(KEYS.queue, id)) ?? 0) + 1 };
    if (job.state === "reading") return { ...job, elapsed_s: Math.max(0, Math.round((now - Date.parse(job.started_at!)) / 1000)) };
    return job;
  }

  /** Store-backed counts for /api/live/status (T6-05, J-01). */
  async counts(perClient: number, client: string) {
    const d = this.clock();
    const h = hourKey(d);
    const slots = await Promise.all(Array.from({ length: this.budget.slots }, (_, i) => this.store.get(KEYS.slot(i))));
    const [used, global, mine, waiting] = await Promise.all([
      this.store.get(KEYS.reads(h)), this.store.get(KEYS.codeFailGlobal(h)), this.store.get(KEYS.codeFailClient(client, h)), this.store.zcard(KEYS.queue),
    ]);
    return {
      used_this_hour: Number(used ?? 0),
      in_flight: slots.filter((s) => s !== null).length,
      waiting,
      code_failures_this_hour_global: Number(global ?? 0),
      code_failures_this_hour_this_client: Number(mine ?? 0),
      code_failure_limit_per_client: perClient,
      code_failure_ceiling_global: perClient * GLOBAL_CODE_FAILURE_FACTOR,
      reopens_at: nextHour(d),
    };
  }
}
