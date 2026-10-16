// Auditor (dispatch 7, Stage 9): the files the deployed site serves equal the committed public/ at a given commit.
// GETs only, no endpoint call, no access code. Every file under public/ at <commit> is fetched from <site>/<path>
// and its SHA-256 compared with the committed blob. Also records GitHub main from ls-remote.
//   node served_check.mjs <site> <repo> <commit> <out.json> [label]
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const [site0, repo, commit, out, label = "check"] = process.argv.slice(2);
const site = site0.replace(/\/$/, "");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { maxBuffer: 1 << 26 });
const remote = execFileSync("git", ["ls-remote", "https://github.com/hvaler/certgate", "refs/heads/main"]).toString().split(/\s/)[0];
const files = git("ls-tree", "-r", "--name-only", commit, "--", "public").toString().split("\n").filter(Boolean);
const rows = [];
for (const f of files) {
  const rel = f.replace(/^public\//, "");
  const committed = git("show", `${commit}:${f}`);
  const r = await fetch(`${site}/${rel}`);
  const served = Buffer.from(await r.arrayBuffer());
  rows.push({ path: rel, status: r.status, served_sha256: sha(served), committed_sha256: sha(committed), match: r.status === 200 && sha(served) === sha(committed) });
}
const h = await fetch(`${site}/health`).then((r) => r.json()).catch(() => null);
const result = { label, at: new Date().toISOString(), site, commit, github_main: remote, health: h?.status ?? null, files: rows.length, matched: rows.filter((r) => r.match).length, rows };
writeFileSync(out, JSON.stringify(result, null, 1));
console.log(`${label} ${result.at}: GitHub main ${remote}; ${result.matched}/${result.files} served files equal ${commit} public/; health ${result.health}`);
for (const r of rows) if (!r.match) console.log(`  MISMATCH ${r.path} ${r.status} served ${r.served_sha256.slice(0, 16)} committed ${r.committed_sha256.slice(0, 16)}`);
