// TEST DOUBLE of the Upstash Redis REST API (docs/sources/upstash-redis.md): POST / with a JSON command array, POST
// /multi-exec with a list of commands (run atomically), Bearer token. It implements only the commands CertGate uses,
// in memory, on 127.0.0.1, so the REST adapter's wire format is tested offline (CH6-17). `down()` makes it answer
// 500 with a body that carries a sentinel, to check that store errors never leak.
import { createServer } from "node:http";
import { DEL_IF_EQUALS_SCRIPT } from "../../src/web/live-store.js";

export async function startFakeUpstash({ token = "fake-store-token", now = () => Date.now() } = {}) {
  const kv = new Map();
  const zs = new Map();
  const state = { commands: 0, multis: 0, down: false, downBody: "store failure (fake)" };
  const live = (k) => { const e = kv.get(k); if (e && e.exp !== null && e.exp <= now()) { kv.delete(k); return undefined; } return e; };
  const z = (k) => { if (!zs.has(k)) zs.set(k, new Map()); return zs.get(k); };
  function run(cmd) {
    state.commands++;
    const [name, ...a] = cmd;
    switch (String(name).toUpperCase()) {
      case "GET": return live(a[0])?.v ?? null;
      case "SET": {
        const [k, v, ...opt] = a;
        const up = opt.map((o) => String(o).toUpperCase());
        if (up.includes("NX") && live(k)) return null;
        let exp = null;
        const ex = up.indexOf("EX"); if (ex >= 0) exp = now() + Number(opt[ex + 1]) * 1000;
        const px = up.indexOf("PX"); if (px >= 0) exp = now() + Number(opt[px + 1]);
        kv.set(k, { v: String(v), exp });
        return "OK";
      }
      case "INCR": case "DECR": {
        const e = live(a[0]);
        const n = (e ? Number(e.v) : 0) + (String(name).toUpperCase() === "INCR" ? 1 : -1);
        kv.set(a[0], { v: String(n), exp: e ? e.exp : null });
        return n;
      }
      case "EXPIRE": { const e = live(a[0]); if (!e) return 0; e.exp = now() + Number(a[1]) * 1000; return 1; }
      case "EVAL": {
        if (a[0] !== DEL_IF_EQUALS_SCRIPT) throw new Error("unknown script");
        const e = live(a[2]);
        if (e && e.v === a[3]) { kv.delete(a[2]); return 1; }
        return 0;
      }
      case "ZADD": z(a[0]).set(a[2], Number(a[1])); return 1;
      case "ZRANK": {
        const s = z(a[0]); if (!s.has(a[1])) return null;
        return [...s.entries()].sort((x, y) => x[1] - y[1] || (x[0] < y[0] ? -1 : 1)).findIndex(([m]) => m === a[1]);
      }
      case "ZCARD": return z(a[0]).size;
      case "ZREM": return z(a[0]).delete(a[1]) ? 1 : 0;
      case "ZREMRANGEBYSCORE": {
        const max = String(a[2]); const lim = max.startsWith("(") ? Number(max.slice(1)) : Number(max);
        let n = 0; for (const [m, s] of z(a[0])) if (max.startsWith("(") ? s < lim : s <= lim) { z(a[0]).delete(m); n++; }
        return n;
      }
      default: throw new Error(`unsupported ${name}`);
    }
  }
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      const reply = (status, obj) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
      if (state.down) return reply(500, { error: state.downBody });
      if (req.headers.authorization !== `Bearer ${token}`) return reply(401, { error: "Unauthorized" });
      let cmds;
      try { cmds = JSON.parse(body); } catch { return reply(400, { error: "bad json" }); }
      try {
        if (req.url === "/multi-exec") { state.multis++; return reply(200, cmds.map((c) => ({ result: run(c) }))); }
        return reply(200, { result: run(cmds) });
      } catch (e) {
        return reply(400, { error: String(e.message) });
      }
    });
  }).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  return {
    url: `http://127.0.0.1:${server.address().port}`, token, state, kv, zs,
    close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }),
  };
}
