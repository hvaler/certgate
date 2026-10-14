// Shared state for live reading (Stage 6, S6-03, S6-04, S6-05). One interface, two stores:
// - UpstashRestStore: Upstash Redis through its documented REST API (POST a JSON command array, Bearer token),
//   with fetch only and no client library (docs/sources/upstash-redis.md). Used on the deployed site, where
//   instances share no memory (OI-S2-01).
// - MemoryStore: the same operations in process, for the container (no store variables) and as the fake shared
//   store in the tests (two handler instances over one MemoryStore).
// Every operation the limits rely on is atomic on its own: INCR, SET NX PX, ZADD, and compare-and-delete.

export interface LiveStore {
  readonly kind: "upstash" | "memory";
  /** INCR key and EXPIRE it, in one atomic request (J-16). Returns the new value. */
  incr(key: string, ttlSeconds: number): Promise<number>;
  /** Gives one unit back on a counter that `incr` counted, keeping its expiry (J-02: a correct code is forgiven). */
  forgive(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  /** SET key value NX PX ttl: true when this call took the key. */
  setNx(key: string, value: string, ttlMs: number): Promise<boolean>;
  /** Deletes the key only when it still holds value (atomic compare-and-delete). */
  delIfEquals(key: string, value: string): Promise<boolean>;
  zadd(key: string, score: number, member: string): Promise<void>;
  /** 0-based rank by score, or null. */
  zrank(key: string, member: string): Promise<number | null>;
  zcard(key: string): Promise<number>;
  zrem(key: string, member: string): Promise<void>;
  /** Removes members with score < maxExclusive. */
  zremBelow(key: string, maxExclusive: number): Promise<void>;
}

export class StoreUnavailable extends Error {}

/** In-process store with the same semantics; the clock is injected only by tests. */
export class MemoryStore implements LiveStore {
  readonly kind = "memory" as const;
  private values = new Map<string, { v: string; exp: number }>();
  private zsets = new Map<string, Map<string, number>>();
  /** Optional artificial delay per operation, for interleaving tests (CH6-06). */
  delayMs = 0;
  constructor(private readonly now: () => number = () => Date.now()) {}
  private async tick() {
    if (this.delayMs > 0) await new Promise((r) => setTimeout(r, this.delayMs));
  }
  private live(key: string) {
    const e = this.values.get(key);
    if (e && e.exp <= this.now()) { this.values.delete(key); return undefined; }
    return e;
  }
  async incr(key: string, ttlSeconds: number) {
    await this.tick();
    return this.incrNow(key, ttlSeconds);
  }
  async forgive(key: string) {
    await this.tick();
    const e = this.live(key);
    if (e) this.values.set(key, { v: String(Number(e.v) - 1), exp: e.exp });
  }
  private incrNow(key: string, ttlSeconds: number) {
    const e = this.live(key);
    const n = (e ? Number(e.v) : 0) + 1;
    this.values.set(key, { v: String(n), exp: this.now() + ttlSeconds * 1000 });
    return n;
  }
  async get(key: string) {
    await this.tick();
    return this.live(key)?.v ?? null;
  }
  async set(key: string, value: string, ttlSeconds: number) {
    await this.tick();
    this.values.set(key, { v: value, exp: this.now() + ttlSeconds * 1000 });
  }
  async setNx(key: string, value: string, ttlMs: number) {
    await this.tick();
    if (this.live(key)) return false;
    this.values.set(key, { v: value, exp: this.now() + ttlMs });
    return true;
  }
  async delIfEquals(key: string, value: string) {
    await this.tick();
    const e = this.live(key);
    if (!e || e.v !== value) return false;
    this.values.delete(key);
    return true;
  }
  private z(key: string) {
    let s = this.zsets.get(key);
    if (!s) { s = new Map(); this.zsets.set(key, s); }
    return s;
  }
  async zadd(key: string, score: number, member: string) {
    await this.tick();
    this.z(key).set(member, score);
  }
  async zrank(key: string, member: string) {
    await this.tick();
    const s = this.z(key);
    if (!s.has(member)) return null;
    const sorted = [...s.entries()].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1));
    return sorted.findIndex(([m]) => m === member);
  }
  async zcard(key: string) {
    await this.tick();
    return this.z(key).size;
  }
  async zrem(key: string, member: string) {
    await this.tick();
    this.z(key).delete(member);
  }
  async zremBelow(key: string, maxExclusive: number) {
    await this.tick();
    const s = this.z(key);
    for (const [m, score] of s) if (score < maxExclusive) s.delete(m);
  }
}

/** Atomic compare-and-delete, run by the store (Upstash REST API: Scripting supported). */
export const DEL_IF_EQUALS_SCRIPT = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

/** Upstash Redis REST API through fetch (no client library). The token is never logged or returned. */
export class UpstashRestStore implements LiveStore {
  readonly kind = "upstash" as const;
  constructor(private readonly url: string, private readonly token: string, private readonly timeoutMs = 5_000) {}
  private async cmd(...args: (string | number)[]): Promise<unknown> {
    let res: Response;
    try {
      res = await fetch(this.url, {
        method: "POST",
        headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
        body: JSON.stringify(args.map(String)),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new StoreUnavailable("shared store unreachable");
    }
    let body: { result?: unknown; error?: unknown };
    try {
      body = (await res.json()) as { result?: unknown; error?: unknown };
    } catch {
      throw new StoreUnavailable(`shared store answered ${res.status} without JSON`);
    }
    // Only the status travels in the message: the store's own error text is not passed on (CH6-10).
    if (!res.ok || body.error !== undefined) throw new StoreUnavailable(`shared store refused a command (HTTP ${res.status})`);
    return body.result ?? null;
  }
  /** A transaction: POST <url>/multi-exec with the commands; all run atomically (docs/sources/upstash-redis.md). */
  private async multi(cmds: (string | number)[][]): Promise<unknown[]> {
    let res: Response;
    try {
      res = await fetch(`${this.url}/multi-exec`, {
        method: "POST",
        headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
        body: JSON.stringify(cmds.map((c) => c.map(String))),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new StoreUnavailable("shared store unreachable");
    }
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new StoreUnavailable(`shared store answered ${res.status} without JSON`);
    }
    if (!res.ok || !Array.isArray(body) || body.some((r) => (r as { error?: unknown }).error !== undefined)) {
      throw new StoreUnavailable(`shared store refused a transaction (HTTP ${res.status})`);
    }
    return body.map((r) => (r as { result?: unknown }).result ?? null);
  }
  async incr(key: string, ttlSeconds: number) {
    const [n] = await this.multi([["INCR", key], ["EXPIRE", key, ttlSeconds]]);
    return Number(n);
  }
  async forgive(key: string) {
    await this.multi([["DECR", key]]);
  }
  async get(key: string) {
    const r = await this.cmd("GET", key);
    return r === null ? null : String(r);
  }
  async set(key: string, value: string, ttlSeconds: number) {
    await this.cmd("SET", key, value, "EX", ttlSeconds);
  }
  async setNx(key: string, value: string, ttlMs: number) {
    return (await this.cmd("SET", key, value, "NX", "PX", ttlMs)) === "OK";
  }
  async delIfEquals(key: string, value: string) {
    return Number(await this.cmd("EVAL", DEL_IF_EQUALS_SCRIPT, 1, key, value)) === 1;
  }
  async zadd(key: string, score: number, member: string) {
    await this.cmd("ZADD", key, score, member);
  }
  async zrank(key: string, member: string) {
    const r = await this.cmd("ZRANK", key, member);
    return r === null ? null : Number(r);
  }
  async zcard(key: string) {
    return Number(await this.cmd("ZCARD", key));
  }
  async zrem(key: string, member: string) {
    await this.cmd("ZREM", key, member);
  }
  async zremBelow(key: string, maxExclusive: number) {
    await this.cmd("ZREMRANGEBYSCORE", key, "-inf", `(${maxExclusive}`);
  }
}

/**
 * The store variables the Upstash integration injects, in the order Upstash's own Redis.fromEnv() reads them
 * (docs/sources/upstash-redis.md): UPSTASH_REDIS_REST_URL / _TOKEN, else KV_REST_API_URL / _TOKEN. The read-only
 * token is never used (CH6-15).
 */
export function storeEnv(env: NodeJS.ProcessEnv): { url: string; token: string } | null {
  const pick = (a: string | undefined, b: string | undefined) => (a && a.trim() ? a.trim() : b && b.trim() ? b.trim() : null);
  const url = pick(env.UPSTASH_REDIS_REST_URL, env.KV_REST_API_URL);
  const token = pick(env.UPSTASH_REDIS_REST_TOKEN, env.KV_REST_API_TOKEN);
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}
