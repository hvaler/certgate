// GET /usage on the model endpoint with the host's user-level variables; prints and saves only the counters.
// Never prints the base URL or the key. Usage: node usage.mjs <out.json>
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const env = (n) => execFileSync("powershell.exe", ["-NoProfile", "-Command", `[Environment]::GetEnvironmentVariable('${n}','User')`], { encoding: "utf8" }).trim() || process.env[n] || "";
const base = env("MODEL_BASE_URL").replace(/\/+$/, "");
const key = env("MODEL_API_KEY");
if (!base || !key) { console.error("endpoint variables not set"); process.exit(2); }
const r = await fetch(`${base}/usage`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(30_000) });
const body = await r.json();
const pick = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === "string" && (v.includes(key) || v.includes(base)) ? "[redacted]" : v)));
const out = { status: r.status, read_at: new Date().toISOString(), usage: pick(body) };
writeFileSync(process.argv[2], JSON.stringify(out, null, 1) + "\n");
const flat = JSON.stringify(out.usage);
console.log(`usage ${r.status}: ${flat.length > 400 ? flat.slice(0, 400) + "…" : flat}`);
