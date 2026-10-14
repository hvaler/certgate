// Stage 4 delivery checks over the documents (R4.0 S4-01…S4-05, S4-11, S4-12; R4.3 F-02, F-06…F-10). Offline:
// they read only committed files.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";
// @ts-expect-error plain JS helper
import { prizeFindings } from "./support/prize-check.mjs";

const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8").replace(/\r\n/g, "\n");
const DOCS = ["README.md", "DEPLOY.md", "METRICS.md", "CLAIMS.md", "EVIDENCE-INDEX.md", ".env.example"];
// These are checks over the repository's delivery documents and evidence. The Docker image carries neither
// (.dockerignore excludes evidence/, and the Dockerfile copies only README.md of the documents), so inside the
// image they are reported as skipped; they run in every checkout of the repository.
const REPO = existsSync(path.join(ROOT, "evidence")) && existsSync(path.join(ROOT, "CLAIMS.md"));
const repoOnly = describe.skipIf(!REPO);

repoOnly("claims table (S4-05, F-02)", () => {
  const rows = () => read("CLAIMS.md").split("\n").filter((l) => /^\| C-\d+ \|/.test(l));
  it("has a row per capability sentence, each with at least one proof", () => {
    expect(rows().length).toBeGreaterThanOrEqual(40);
    for (const r of rows()) {
      const cells = r.split(" | ");
      expect(cells.length, r).toBeGreaterThanOrEqual(4);
      expect(cells.at(-1)!, r).toMatch(/(test|file|evidence):/);
    }
  });
  it("every proof cited in CLAIMS.md exists: test titles are found in their file, paths exist", () => {
    for (const r of rows()) {
      const proof = r.split(" | ").at(-1)!.replace(/ \|$/, "");
      // Items are separated by "; " before the next "test:", "file:" or "evidence:"; titles may contain ";".
      for (const item of proof.split(/;\s*(?=(?:test|file|evidence):)/)) {
        const m = /^(test|file|evidence):(.+)$/.exec(item.trim());
        expect(m, `${r}\n  bad proof item: ${item}`).not.toBeNull();
        if (m![1] === "test") {
          const [file, frag] = m![2]!.split("::");
          expect(existsSync(path.join(ROOT, file!)), file).toBe(true);
          const src = read(file!);
          // Titles are string literals; compare on the unescaped text.
          expect(src.replace(/\\"/g, '"').includes(frag!.trim()), `${file} has no test titled with: ${frag}`).toBe(true);
        } else {
          expect(existsSync(path.join(ROOT, m![2]!.trim())), m![2]).toBe(true);
        }
      }
    }
  });
});

repoOnly("README figures (F-08 b, S4-01)", () => {
  it("README evaluation figures equal the generated metrics of both runs", () => {
    const runs = {
      implementer: JSON.parse(read("evaluation/runs/real-candidate-dd557fd/metrics.json")),
      auditor: JSON.parse(read("evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1/metrics.json")),
    };
    const readme = read("README.md");
    const table = readme.slice(readme.indexOf("## Evaluation (real model)"), readme.indexOf("## Comparison with Gemma-4-31B-IT"));
    const of = (x: { numerator: string; denominator: string }) => `${x.numerator} of ${x.denominator}`;
    for (const m of Object.values(runs)) {
      const h = m.headline;
      expect(table).toContain(`**${of(h.fc_broad)}**`);
      expect(table).toContain(`${h.fc_strict.numerator} of ${h.fc_strict.denominator}`);
      expect(table).toContain(`${of(h.non_conformities_caught)}, all proposed block`);
      expect(table).toContain(of(h.proposal_agreement));
      expect(table).toContain(`${of(m.abstentions.failure)} · ${m.retries.cases_with_retry.length}`);
      expect(table).toContain(of(m.per_field_accuracy.totals.correct));
      expect(table).toContain(`mean ${h.seconds_per_certificate.mean}, median ${h.seconds_per_certificate.median} (N ${h.seconds_per_certificate.n})`);
      expect(table).toContain(`mean ${h.cost_per_certificate.mean}`);
    }
    const fig = JSON.parse(read("public/figures.json"));
    expect(table).toContain(fig.generated_from);
  });
});

repoOnly("environment variables (F-09)", () => {
  const readByCode = () => {
    const names = new Set<string>();
    const walk = (d: string) => {
      for (const e of readdirSync(d)) {
        const p = path.join(d, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith(".ts")) for (const m of readFileSync(p, "utf8").matchAll(/\benv\.([A-Z][A-Z0-9_]+)\b/g)) names.add(m[1]!);
      }
    };
    walk(path.join(ROOT, "src"));
    return names;
  };
  const documented = (f: string) => new Set([...read(f).matchAll(/^\| `([A-Z][A-Z0-9_]+)` \|/gm)].map((m) => m[1]!));
  it("env var names documented in README and DEPLOY.md equal the names read by src (both directions)", () => {
    const code = [...readByCode()].sort();
    expect([...documented("README.md")].sort()).toEqual(code);
    expect([...documented("DEPLOY.md")].sort()).toEqual(code);
    expect(code).toContain("VERCEL");
    expect(read("README.md")).toMatch(/\| `VERCEL` \| set by Vercel \|/);
  });
  it("DEPLOY.md tells the human not to set MODEL_* on Vercel (F-05)", () => {
    const deploy = read("DEPLOY.md");
    for (const v of ["MODEL_BASE_URL", "MODEL_API_KEY", "MODEL_ID"]) expect(deploy).toMatch(new RegExp(`\\| \`${v}\` \\| \\*\\*do not set\\*\\*`));
  });
});

repoOnly("function duration (F-10, S4-02)", () => {
  it("DEPLOY.md duration equals vercel.json maxDuration and cites the Vercel record", () => {
    const vercel = JSON.parse(read("vercel.json"));
    const max = vercel.functions["api/index.ts"].maxDuration;
    expect(max).toBe(300);
    const deploy = read("DEPLOY.md");
    expect(deploy).toContain(`"maxDuration": ${max}`);
    expect(deploy).toContain(`maximum duration to ${max} seconds`);
    expect(deploy).toContain("docs/sources/vercel-limits.md");
    expect(deploy).toContain("https://vercel.com/docs/functions/limitations");
    expect(read("docs/sources/vercel-limits.md")).toContain("Hobby 300s (5 minutes) 300s (5 minutes)");
  });
});

repoOnly("no forbidden claim, no secret, no local path (F-06, F-08 d, F-07, S4-11, S4-12)", () => {
  it("no forbidden claim in README, DEPLOY.md, METRICS.md or public", () => {
    const files = ["README.md", "DEPLOY.md", "METRICS.md", ...readdirSync(path.join(ROOT, "public")).filter((f) => /\.(js|html|css|json)$/.test(f)).map((f) => `public/${f}`)];
    const forbidden = [/MI3\d\d/, /ROCm \d/, /vLLM \d/, /deployed at/i, /\blive at\b/i, /submitted/i, /winner/i, /qualif/i, /own vLLM endpoint/i, /AMD Instinct/i,
      // R4.7 (F-06 extension): no hosted-demo claim or deployment URL. The cited Vercel documentation URL is allowed.
      /vercel\.app/i, /hosted demo/i, /https?:\/\/(?!localhost|127\.|vercel\.com\/docs\/)[^\s)"'`]*(vercel|netlify)/i];
    for (const f of files) for (const re of forbidden) expect(read(f), `${f}: ${re}`).not.toMatch(re);
    // ADV-S4-F06: no positive claim that live reading works on the deployed site, in prose, headings or code
    // comments. The documented negative sentences ("unavailable on the deployed site", "runs from the container,
    // not from the deployed site") are allowed: a match is a finding only if it carries no negation.
    const positive = [
      /live reading(?: (?:also|works|is|available|runs))* (?:on|from) the deployed site/gi,
      /live reading[^.\n]*\b(?:works?|available|runs?|possible)\b[^.\n]*deployed/gi,
    ];
    for (const f of files) {
      const t = read(f).replace(/\s+/g, " ");
      for (const re of positive) for (const m of t.matchAll(re)) expect(m[0], `${f}: positive deployed-site claim`).toMatch(/\b(not|unavailable|never|no)\b/i);
      // E-11: any clause naming a "public site" or "public URL" must be a negative one. Checked line by line and
      // clause by clause (". ; #" end a clause), so that a negation elsewhere cannot excuse a claim.
      for (const line of read(f).split("\n")) {
        for (const m of line.matchAll(/[^.#;]*\bpublic (?:site|url)\b[^.#;]*/gi)) expect(m[0], `${f}: public-site claim`).toMatch(/\b(not|unavailable|never|no)\b/i);
      }
      // Stage 5 (S5-11, G-09): no prize, award, win, eligibility, qualification, entry or submission claim.
      expect(prizeFindings(read(f)), `${f}: prize claim`).toEqual([]);
    }
  });
  it("no secret-looking value in the docs", () => {
    const patterns = [
      /Bearer\s+[A-Za-z0-9._-]{20,}/,
      /sk-[A-Za-z0-9_-]{16,}/,
      // Any NAME_KEY / _TOKEN / _SECRET / _PASSWORD / _CODE followed by = or : and a value on the same line.
      /[A-Z0-9_]*(KEY|TOKEN|SECRET|PASSWORD|CODE)[ \t]*[=:][ \t]*["']?(?!stub-key\b)[A-Za-z0-9+/._-]{6,}/,
      /jury-code-77/,
      /https?:\/\/(?!127\.0\.0\.1|localhost|<site>)[^\s)"'`]*\/v1\b/,
    ];
    // High-entropy token: 24 or more of [A-Za-z0-9_-] with at least 4 letter/digit alternations (as in generated
    // keys), so that file names such as BLOCKER-host-memory-1906Z are not flagged.
    const highEntropy = (t: string) => (t.match(/[A-Za-z0-9_-]{24,}/g) ?? []).filter((w) => (w.match(/[A-Za-z](?=\d)|\d(?=[A-Za-z])/g) ?? []).length >= 4);
    for (const f of DOCS) {
      const t = read(f);
      for (const re of patterns) expect(t, `${f}: ${re}`).not.toMatch(re);
      expect(highEntropy(t), `${f}: high-entropy token`).toEqual([]);
    }
    // The real endpoint values from this host's environment, compared by presence only (never printed).
    for (const v of [process.env.MODEL_API_KEY, process.env.MODEL_BASE_URL, process.env.LIVE_ACCESS_CODE]) {
      if (!v) continue;
      for (const f of DOCS) expect(read(f).includes(v), `${f} contains a real environment value`).toBe(false);
    }
  });
  it("no user-profile path or operator e-mail in any tracked text file at head", () => {
    let files: string[] = [];
    try { files = execFileSync("git", ["ls-files"], { cwd: ROOT }).toString().split("\n").filter(Boolean); } catch { return; }
    const bad = /[A-Za-z]:[\\/]+Users[\\/]+[A-Za-z0-9_.-]+[\\/]|\/c\/Users\/[A-Za-z0-9_.-]+\/|stic\.claude5@/;
    const hits: string[] = [];
    for (const f of files) {
      if (/\.(pdf|png|jpe?g|ico|woff2?|gz|zip)$/i.test(f) || !existsSync(path.join(ROOT, f))) continue;
      const t = readFileSync(path.join(ROOT, f), "utf8");
      if (bad.test(t)) hits.push(f);
    }
    expect(hits).toEqual([]);
  });
});

repoOnly("sentence map (F-02 completeness, ADV-S4-F02)", () => {
  it("every sentence of README, DEPLOY.md and METRICS.md is in the claims map, with a known row or a reason", async () => {
    // @ts-expect-error plain JS tool
    const { allUnits, loadMap } = await import("../tools/claims-units.mjs");
    const map: { doc: string; text: string; row: string }[] = loadMap(ROOT);
    const key = (u: { doc: string; text: string }) => `${u.doc} :: ${u.text}`;
    const mapped = new Map(map.map((m) => [key(m), m.row]));
    const units: { doc: string; text: string }[] = allUnits(ROOT);
    const missing = units.filter((u) => !mapped.has(key(u))).map(key);
    expect(missing, "sentences without a claims-map entry (map them in claims-map.json)").toEqual([]);
    const present = new Set(units.map(key));
    expect(map.filter((m) => !present.has(key(m))).map(key), "stale claims-map entries").toEqual([]);
    const rows = new Set([...read("CLAIMS.md").matchAll(/^\| (C-\d+) \|/gm)].map((m) => m[1]!));
    for (const m of map) {
      if (m.row.startsWith("none:")) expect(m.row.length, key(m)).toBeGreaterThan(10);
      else expect(rows.has(m.row), `${key(m)} cites unknown row ${m.row}`).toBe(true);
    }
  });
});

repoOnly("README facts against their sources (ADV-S4-F01, F-04)", () => {
  const runDirs = {
    implementer: "evaluation/runs/real-candidate-dd557fd",
    auditor: "evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1",
  };
  it("README provenance facts equal the run artifacts and the publisher record", () => {
    const readme = read("README.md");
    const row = readme.split("\n").find((l) => l.startsWith("| Candidate · time (UTC) |"))!;
    const cells = row.split(" | ");
    for (const [i, dir] of [[1, runDirs.implementer], [2, runDirs.auditor]] as const) {
      const run = JSON.parse(read(`${dir}/run.json`));
      const commit = /`([0-9a-f]{7,40})`/.exec(cells[i]!)![1]!;
      expect(run.candidate_commit.startsWith(commit), `${dir}: README says ${commit}`).toBe(true);
      const models = new Set(JSON.parse(read(`${dir}/results.json`)).map((r: any) => r.endpoint_response?.model));
      expect([...models]).toEqual(["self-dploy/Qwen3.8-27B"]);
      expect(run.model_requested).toBe("Qwen3.8-27B");
    }
    const flat = readme.replace(/\s+/g, " ");
    expect(flat).toContain("requested as `Qwen3.8-27B`; every reply reports it as `self-dploy/Qwen3.8-27B`");
    const model = read("docs/sources/model.md");
    const licence = /`([a-z0-9.-]+)` \("License: ([a-z0-9.-]+)"/.exec(model)!;
    expect(licence[1]).toBe(licence[2]);
    expect(flat).toContain(`its licence, as published by the publisher, is ${licence[1]}`);
    expect(model).toContain("| Publisher | Qwen Team");
    expect(readme).toContain("Its publisher is the\n  Qwen Team");
    expect(readme).toContain("https://huggingface.co/Qwen/Qwen3.8-27B, retrieved 2026-10-13");
  });
  it("README reading-time range equals the implementer run's min and max", () => {
    const m = JSON.parse(read(`${runDirs.implementer}/metrics.json`));
    const lo = Math.round(Number(m.time.seconds_per_certificate_processed.min));
    const hi = Math.round(Number(m.time.seconds_per_certificate_processed.max));
    expect(read("README.md").replace(/\s+/g, " ")).toContain(`(${lo}–${hi} s per certificate in the evaluation)`);
    expect(lo).toBeGreaterThanOrEqual(45);
    expect(hi).toBeLessThanOrEqual(240); // "about 1 to 4 minutes"
  });
  it("the retry and failure sentence equals both runs' artifacts", () => {
    const readme = read("README.md");
    for (const dir of Object.values(runDirs)) {
      const m = JSON.parse(read(`${dir}/metrics.json`));
      expect(m.retries.cases_with_retry).toEqual([]);
      expect(m.abstentions.failure.numerator).toBe("0");
    }
    expect(readme.replace(/\s+/g, " ")).toContain("In the band's two evaluation runs there were 0 retries and 0 failures.");
  });
  it("the prompt examples named in the README occur in the instruction and in cg-001's correct reading", () => {
    const src = read("src/web/live-reader.ts");
    const cg1 = JSON.parse(read("data/expected/cg-001.json")).correct_reading;
    expect([cg1.chemistry.C.value, cg1.mechanical.ReH.value, cg1.inspection_stamp.value]).toEqual(["0.16", "392", "QA-07"]);
    for (const v of ["0.16", "392", "QA-07"]) expect(src).toContain(`\\"${v}\\"`);
    expect(read("README.md").replace(/\s+/g, " ")).toContain('reuse values of cg-001 ("0.16", "392", "QA-07")');
  });
});
