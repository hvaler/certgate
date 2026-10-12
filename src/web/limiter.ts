// Server-side global live-read limit per UTC clock hour (S2-16, D2-06, B-02, B-03).
// In-memory, one counter per server instance in this build: a deployment with several instances needs a
// shared store behind this same interface (open item OI-S2-01). The clock is injected only by the test
// harness through the constructor (B-07); nothing reachable over HTTP sets it.

export interface HourlyCounter {
  /** Atomically checks and consumes one unit. JavaScript runs this synchronously, so no two calls interleave. */
  tryConsume(): { ok: boolean; remaining: number; reopens_at: string };
  peek(): { limit: number; remaining: number; reopens_at: string };
}

export function startOfNextUtcHour(now: Date): Date {
  const d = new Date(now.getTime());
  d.setUTCMinutes(0, 0, 0);
  d.setUTCHours(d.getUTCHours() + 1);
  return d;
}

const hourKey = (now: Date) => now.toISOString().slice(0, 13); // e.g. 2026-10-12T18

export class InMemoryHourlyCounter implements HourlyCounter {
  private hour = "";
  private used = 0;

  constructor(private readonly limit: number, private readonly clock: () => Date = () => new Date()) {}

  private roll(now: Date) {
    const key = hourKey(now);
    if (key !== this.hour) {
      this.hour = key;
      this.used = 0;
    }
  }

  tryConsume() {
    const now = this.clock();
    this.roll(now);
    const reopens_at = startOfNextUtcHour(now).toISOString();
    if (this.limit <= 0 || this.used >= this.limit) return { ok: false, remaining: 0, reopens_at };
    this.used++;
    return { ok: true, remaining: this.limit - this.used, reopens_at };
  }

  peek() {
    const now = this.clock();
    this.roll(now);
    return { limit: this.limit, remaining: Math.max(0, this.limit - this.used), reopens_at: startOfNextUtcHour(now).toISOString() };
  }
}
