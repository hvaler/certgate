// Auditor (T10-08): value scan, in memory, counts only. Prints no value and no property of a value (D8-04).
//   node t10_secrets.mjs <repo> <base> <cand>
// Needles come from the process: MODEL_API_KEY, MODEL_BASE_URL, and S10_CODE (set by the caller from the
// user-level registry LIVE_ACCESS_CODE). A missing needle is reported as "unavailable", never as 0.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const [repo, base, cand] = process.argv.slice(2);
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "buffer", maxBuffer: 1 << 30 });
const sha = (s) => createHash("sha256").update(s).digest("hex");
const code = process.env.S10_CODE || "";
const key = process.env.MODEL_API_KEY || "";
const url = process.env.MODEL_BASE_URL || "";
let hostPath = "";
try { const u = new URL(url); hostPath = (u.host + u.pathname).replace(/\/+$/, ""); if (!/\/./.test(hostPath)) hostPath = ""; } catch {}
const needles = { "base-URL host+path": hostPath, key, "SHA-256(key)": key && sha(key), "access code": code, "SHA-256(code)": code && sha(code) };
const count = (hay, n) => { let c = 0, i = 0; while ((i = hay.indexOf(n, i)) >= 0) { c++; i += n.length; } return c; };
const scan = (label, buf) => {
  const s = buf.toString("latin1");
  const row = Object.entries(needles).map(([k, n]) => `${k}=${n ? count(s, Buffer.from(n).toString("latin1")) : "unavailable"}`);
  console.log(`${label}: ${row.join(", ")}`);
};
const changed = git("diff", "--name-only", `${base}..${cand}`).toString().split("\n").filter(Boolean);
let all = Buffer.alloc(0);
for (const f of changed) { try { all = Buffer.concat([all, git("show", `${cand}:${f}`)]); } catch {} }
scan(`changed files at ${cand.slice(0, 7)} (${changed.length})`, all);
scan(`history delta ${base.slice(0, 7)}..${cand.slice(0, 7)} (patches)`, git("log", "-p", "--binary", `${base}..${cand}`));
scan("commit messages of the delta", git("log", "--format=%B", `${base}..${cand}`));
// Every tracked blob, by object id (long Windows paths cannot be read by name).
const blobs = git("ls-tree", "-r", cand).toString().split("\n").filter(Boolean).map((l) => l.split(/\s+/)[2]);
const tr = execFileSync("git", ["-C", repo, "cat-file", "--batch"], { input: blobs.join("\n") + "\n", maxBuffer: 2 ** 31 });
scan(`every tracked file at ${cand.slice(0, 7)} (${blobs.length})`, tr);
