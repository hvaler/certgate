// Stage 4 delivery checks over the documents (R4.0 S4-01…S4-05, S4-11, S4-12; R4.3 F-02, F-06…F-10). Offline:
// they read only committed files.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";

const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8").replace(/\r\n/g, "\n");
const DOCS = ["README.md", "DEPLOY.md", "METRICS.md", "CLAIMS.md", "EVIDENCE-INDEX.md", ".env.example"];

describe("claims table (S4-05, F-02)", () => {
  const rows = read("CLAIMS.md").split("\n").filter((l) => /^\| C-\d+ \|/.test(l));
  it("has a row per capability sentence, each with at least one proof", () => {
    expect(rows.length).toBeGreaterThanOrEqual(40);
    for (const r of rows) {
      const cells = r.split(" | ");
      expect(cells.length, r).toBeGreaterThanOrEqual(4);
      expect(cells.at(-1)!, r).toMatch(/(test|file|evidence):/);
    }
  });
  it("every proof cited in CLAIMS.md exists: test titles are found in their file, paths exist", () => {
    for (const r of rows) {
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

describe("README figures (F-08 b, S4-01)", () => {
  const runs = {
    implementer: JSON.parse(read("evaluation/runs/real-candidate-dd557fd/metrics.json")),
    auditor: JSON.parse(read("evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1/metrics.json")),
  };
  it("README evaluation figures equal the generated metrics of both runs", () => {
    const readme = read("README.md");
    const table = readme.slice(readme.indexOf("## Evaluation (real model)"), readme.indexOf("## Demo procedure"));
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

describe("environment variables (F-09)", () => {
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

describe("function duration (F-10, S4-02)", () => {
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

describe("no forbidden claim, no secret, no local path (F-06, F-08 d, F-07, S4-11, S4-12)", () => {
  it("no forbidden claim in README, DEPLOY.md, METRICS.md or public", () => {
    const files = ["README.md", "DEPLOY.md", "METRICS.md", ...readdirSync(path.join(ROOT, "public")).filter((f) => /\.(js|html|css|json)$/.test(f)).map((f) => `public/${f}`)];
    const forbidden = [/MI3\d\d/, /ROCm \d/, /vLLM \d/, /deployed at/i, /\blive at\b/i, /submitted/i, /winner/i, /qualif/i, /own vLLM endpoint/i, /AMD Instinct/i];
    for (const f of files) for (const re of forbidden) expect(read(f), `${f}: ${re}`).not.toMatch(re);
  });
  it("no secret-looking value in the docs", () => {
    const patterns = [/Bearer\s+[A-Za-z0-9._-]{20,}/, /\bsk-[A-Za-z0-9]{10,}/, /\b(KEY|TOKEN|SECRET|PASSWORD|CODE)\s*[=:]\s*["']?[A-Za-z0-9+/._-]{16,}/, /jury-code-77/,
      /https?:\/\/(?!127\.0\.0\.1|localhost|<site>)[^\s)"'`]*\/v1\b/];
    for (const f of DOCS) for (const re of patterns) expect(read(f), `${f}: ${re}`).not.toMatch(re);
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
