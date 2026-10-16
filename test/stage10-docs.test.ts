// Stage 10 (README and the lablab form text for a judge; R10.0 S10-01…S10-08, R10.1 X-01…X-14, R10.3 Z-01…Z-10).
// Repository-only, like the other docs checks: the evidence and the run artifacts are not in the Docker image.
// Every figure is computed here from the committed artifacts, never typed into the test.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";
// @ts-expect-error plain JS helper
import { prizeFindings, prizeText } from "./support/prize-check.mjs";

const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8").replace(/\r\n/g, "\n");
const LABLAB = "docs/submission/lablab.md";
const RUNS = {
  implementer: "evaluation/runs/real-candidate-dd557fd",
  auditor: "evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1",
} as const;
const REPO = existsSync(path.join(ROOT, "evidence")) && existsSync(path.join(ROOT, LABLAB)) && existsSync(path.join(ROOT, RUNS.auditor));
const repoOnly = describe.skipIf(!REPO);
const flat = (s: string) => s.replace(/\s+/g, " ");
type Result = { case_id: string; proposal: string; expected_proposal: string; reasons: string[]; fields: Record<string, { category: string; model: string | null; correct: string | null }> };
const results = (dir: string): Result[] => JSON.parse(read(`${dir}/results.json`));
const metrics = (dir: string) => JSON.parse(read(`${dir}/metrics.json`));
const frac = (x: { numerator: string; denominator: string }) => `${x.numerator}/${x.denominator}`;

/** The top block: the lines between the H1 and the first blank line (S10-01, X-06). */
const topBlock = (readme: string) => {
  const lines = readme.split("\n");
  expect(lines[0]).toBe("# CertGate");
  expect(lines[1]).toBe("");
  const end = lines.indexOf("", 2);
  return { lines: lines.slice(2, end), after: lines.slice(end + 1) };
};

/** Utility of one run, from its results (S10-02, X-05). */
const utility = (dir: string) => {
  const rel = results(dir).filter((r) => r.expected_proposal === "release");
  return {
    n: rel.length,
    release: rel.filter((r) => r.proposal === "release").length,
    review: rel.filter((r) => r.proposal === "review"),
    block: rel.filter((r) => r.proposal === "block").length,
  };
};

/** The lablab form fields (S10-07, X-08): the text under each fixed heading, trimmed. */
const field = (t: string, h: string) => {
  const i = t.indexOf(`\n## ${h}\n`);
  expect(i, `heading ${h}`).toBeGreaterThan(-1);
  const r = t.slice(i + h.length + 5);
  const j = r.indexOf("\n## ");
  return (j < 0 ? r : r.slice(0, j)).trim();
};

repoOnly("README top block (S10-01, X-06, Z-02, Z-05, Z-06, Z-07)", () => {
  it("sits directly after the H1, before any heading, in at most 6 non-empty lines, followed by the unchanged notice", () => {
    const readme = read("README.md");
    const { lines, after } = topBlock(readme);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.filter((l) => l.trim()).length).toBeLessThanOrEqual(6);
    for (const l of lines) expect(l, "no heading inside the block").not.toMatch(/^#/);
    expect(readme.indexOf("\n## ")).toBeGreaterThan(readme.indexOf(lines.at(-1)!));
    expect(after[0]).toBe("> **All data in this repository is fictitious.** Siderúrgica Valdemora S.A. (the mill), Talleres Ribera Norte");
  });
  it("names the problem, the user, how it works and the evaluated model", () => {
    const b = topBlock(read("README.md")).lines.join(" ");
    for (const w of ["mill certificate", "EN 10204 3.1", "goods-in or Quality technician", "deterministic versioned rules", "a person decides", "never releases material on its own", "fictitious"]) expect(b, w).toContain(w);
    expect(b).toMatch(/Qwen3\.8-27B, the evaluated model, for every figure below/);
    expect(b).toMatch(/live reading also offers other measured and experimental models/);
    expect(b, "no Gemma figure in the top block").not.toContain("Gemma");
  });
  it("every figure equals its run's metrics and METRICS.md, each with its run label in the same clause", () => {
    const b = topBlock(read("README.md")).lines.join(" ");
    const im = metrics(RUNS.implementer).headline;
    const au = metrics(RUNS.auditor).headline;
    const fi = metrics(RUNS.implementer).per_field_accuracy.totals.correct;
    const fa = metrics(RUNS.auditor).per_field_accuracy.totals.correct;
    expect(frac(im.fc_broad)).toBe(frac(au.fc_broad));
    expect(frac(fi)).toBe(frac(fa));
    expect(b).toContain(`false conforming **${frac(im.fc_broad)}** in both runs`);
    expect(b).toContain(`**${frac(im.proposal_agreement)}** (implementer run)`);
    expect(b).toContain(`**${frac(au.proposal_agreement)}** (auditor's independent run)`);
    expect(b).toContain(`fields read correctly **${frac(fi)}** in both runs`);
    expect(b).toContain("(2 Qwen3.8-27B runs)");
    expect(b).toContain(`Results on the ${im.proposal_agreement.denominator} evaluated fictitious certificates`);
    const md = read("METRICS.md");
    const slash = (x: { numerator: string; denominator: string }) => `${x.numerator} / ${x.denominator}`;
    expect(md).toContain(`| **False conforming, FC-broad** (released where the expected proposal was not release) | **${slash(im.fc_broad)}** | **${slash(au.fc_broad)}** |`);
    expect(md).toContain(`| Proposal equal to the expected proposal | ${slash(im.proposal_agreement)} | ${slash(au.proposal_agreement)} |`);
    expect(md).toContain(`| correct | ${slash(fi)} | ${slash(fa)} |`);
  });
  it("the utility figures equal the runs' results, each with its run label", () => {
    const b = topBlock(read("README.md")).lines.join(" ");
    const i = utility(RUNS.implementer);
    const a = utility(RUNS.auditor);
    expect([i.block, a.block]).toEqual([0, 0]);
    expect(b).toContain(`Utility, of the ${i.n} cases whose expected proposal is release:`);
    expect(b).toContain(`proposed release **${i.release}/${i.n}** (implementer run) and **${a.release}/${a.n}** (auditor's run)`);
    // F10-A01: each utility figure carries its own run label in its clause.
    expect(b).toContain(`sent to review without need **${i.review.length}/${i.n}** (implementer run) and **${a.review.length}/${a.n}** (auditor's run, ${a.review.map((r) => r.case_id).join(", ")}:`);
  });
  it("links the deployed site, judge mode and the screenshots, and the judge route exists", () => {
    const b = topBlock(read("README.md")).lines.join(" ");
    expect(b).toContain("[Deployed site](https://certgate-wheat.vercel.app) · [judge mode](https://certgate-wheat.vercel.app/#/judge) · [screenshots](#screenshots)");
    expect(read("README.md")).toContain("\n## Screenshots\n");
    expect(read("public/app.js")).toContain('if (hash === "#/judge")');
  });
});

repoOnly("cg-004, the one release case sent to review (S10-02, X-04)", () => {
  it("is the auditor run's only one, for the decimal comma caught by the channel check, and the README and lablab.md say so", () => {
    const a = utility(RUNS.auditor);
    expect(a.review.map((r) => r.case_id)).toEqual(["cg-004"]);
    const c = a.review[0]!;
    expect(c.reasons).toContain("CHANNEL_DISAGREE:cev_printed");
    expect(c.fields.cev_printed!.category).toBe("wrong");
    expect(c.fields.cev_printed!.model).toContain(",");
    const model = c.fields.cev_printed!.model!;
    const correct = c.fields.cev_printed!.correct!;
    expect(model.replace(",", ".")).toBe(correct);
    expect(flat(read("README.md"))).toContain(`cg-004: the model read the printed CEV with a decimal comma, "${model}", the text layer read ${correct}, and the channel check disagreed)`);
    expect(flat(read(LABLAB))).toContain("(cg-004, where the model read the printed carbon equivalent with a decimal comma and the channel check disagreed with the text layer)");
  });
});

repoOnly("scan counts name their set (S10-04, X-01)", () => {
  const kinds = () => Object.fromEntries(readdirSync(path.join(ROOT, "data", "cases")).filter((d) => /^cg-\d{3}$/.test(d)).map((d) => [d, JSON.parse(read(`data/cases/${d}/case.json`)).certificate_kind]));
  it("the counts equal the data, and every scan count in README and lablab.md names its set", () => {
    const k = kinds();
    const all = Object.keys(k);
    const evaluated = results(RUNS.implementer).map((r) => r.case_id).sort();
    expect(results(RUNS.auditor).map((r) => r.case_id).sort()).toEqual(evaluated);
    const scans = (ids: string[]) => ids.filter((id) => k[id] === "scan").length;
    const sentence = `Of the ${evaluated.length} evaluated certificates, ${scans(evaluated)} are scans; of the ${all.length} in the dataset, ${scans(all)}.`;
    expect(sentence).toBe("Of the 27 evaluated certificates, 3 are scans; of the 30 in the dataset, 5.");
    for (const f of ["README.md", LABLAB]) {
      const t = flat(read(f));
      expect(t, f).toContain(sentence);
      // Any other scan count must be the dataset's own line, which names the 30.
      for (const m of t.matchAll(/\b(\d+) (?:are )?scan(?:s|ned)\b/g)) {
        const at = t.slice(Math.max(0, m.index! - 80), m.index! + 40);
        expect(at, `${f}: "${m[0]}" names its set`).toMatch(/evaluated certificates|30 fictitious certificates/);
      }
    }
    expect(flat(read("README.md"))).toContain(`The dataset has ${all.length} fictitious certificates with planted faults, ${all.length - scans(all)} digital and ${scans(all)} scanned.`);
  });
  it("the second-channel scope is in Problem and user, and the limitation line stays", () => {
    const readme = read("README.md");
    const sec = flat(readme.slice(readme.indexOf("## Problem and user"), readme.indexOf("## What it does")));
    expect(sec).toContain("The model-free text-layer parser covers the two fictitious layouts of the dataset, not arbitrary mill certificates.");
    expect(sec).toContain("A real digital PDF in another layout gets no second channel and goes to review, like a scan: this is safe, but it reduces the saving.");
    expect(flat(readme)).toContain("- **Text-layer parser.** It covers the two fictitious certificate layouts of the dataset, not arbitrary mill certificates.");
  });
});

repoOnly("reading times name their model (S10-03, X-03, Z-04, Z-08)", () => {
  // Durations that are limits, not reading times (reviewed by the auditor, Z-08): full sentences or table rows.
  const LIMITS = new Set([
    "**Not evaluated · experimental:** models that, in one real probe on 2026-10-15, accepted CertGate's request (the page image of the scan cg-016 and the frozen prompt) and returned a reply that passed the response schema, named the requested model and finished within 210 s. Four passed: DeepSeek-V4.1-Flash, DeepSeek-V4-Flash-Vision-Exp, MiMo-V2.6-Flash and Qwen3.8-Flash-Next ([probe evidence](evidence/runs/certgate-001/stage-8/probes/BATCH.md)).",
    '| `GET /api/f1` | "Runs on AMD" data from the configured endpoint, probed at most once per 60 s (`no-store`) |',
    "**Model list.** The list on the live screen is the endpoint's own, checked at most once per 60 s; a model can disappear between that check and a reading, and the server then refuses it.",
    "CertGate keeps at most 2 requests in flight, retries only 429 and 5xx (at most 3 attempts, Retry-After honoured), and waits up to 300 s per attempt.",
    'A job waits at most 60 s for one of the two reading slots and then has at most 210 s to read, inside the 300 s function duration; a reading that does not finish in time fails as "timed out" and offers a retry.',
  ]);
  const DURATION = /\b\d+(\.\d+)?\s?(s|sec|seconds?|min|minutes?)\b|seconds per certificate|reading took|reading takes/i;
  it("every duration in README and lablab.md has its model in the same sentence or row, and every exemption still occurs", async () => {
    // @ts-expect-error plain JS tool
    const { units } = await import("../tools/claims-units.mjs");
    const seen = new Set<string>();
    for (const f of ["README.md", LABLAB]) {
      for (const u of units(read(f)) as string[]) {
        if (!DURATION.test(u)) continue;
        if (LIMITS.has(u)) { seen.add(u); continue; }
        expect(u, `${f}: a duration without its model`).toMatch(/Qwen3\.8-27B|Gemma-4-31B-IT/);
      }
    }
    for (const s of LIMITS) expect(seen.has(s), `stale exemption: ${s}`).toBe(true);
  });
  it("the implementer-run times and the reading range equal the artifacts", () => {
    const t = metrics(RUNS.implementer).time.seconds_per_certificate_processed;
    const lo = Math.round(Number(t.min));
    const hi = Math.round(Number(t.max));
    const secs = results(RUNS.implementer).map((r) => (r as unknown as { case_wall_ms: number }).case_wall_ms / 1000);
    expect(Math.round(Math.min(...secs))).toBeLessThanOrEqual(lo + 1);
    expect(flat(read("README.md"))).toContain(`With Qwen3.8-27B, one reading takes about 1 to 4 minutes (${lo}–${hi} s per certificate in the implementer run).`);
    expect(flat(read(LABLAB))).toContain(`Reading took ${t.mean} s mean and ${t.median} s median per certificate with Qwen3.8-27B in the implementer run.`);
  });
});

repoOnly("plain words for a judge (S10-06, X-07, Z-03)", () => {
  const BANNED = [/\bO\d-\d\d\b/, /\bF\d-\d\d\b/, /OI-S\d/, /\bI[1-7]\b/, /03-DISENO/, /\bdispatch(es)?\b/i, /\bthe band\b/i, /\bband's\b/i, /\bthe human\b/i, /\bhuman's\b/i];
  // Link targets under evidence/ may hold a code in a path; link text never may (Y-04).
  const text = (f: string) => read(f).replace(/\]\((evidence\/[^)]*)\)/g, "]()");
  it("README.md and lablab.md carry no internal code and no in-house word", () => {
    for (const f of ["README.md", LABLAB]) for (const re of BANNED) expect(text(f), `${f}: ${re}`).not.toMatch(re);
  });
  it("the Gemma listing history is dated, including the re-listing of 2026-10-16", () => {
    expect(flat(read("README.md"))).toContain("Token Factory listed Gemma-4-31B-IT again on 2026-10-16 (operator observation at 04:21:59Z; the auditor's direct GET /models at 04:23:34.429Z), which is why the screenshots show a live Gemma-4-31B-IT reading.");
    expect(read("evidence/runs/certgate-001/stage-8/auditor/VERDICT-S8-FINAL.md")).toContain("Direct GET /models at 04:23:34.429Z");
    expect(read("evidence/runs/certgate-001/stage-8/OBLIGATIONS.md")).toContain("Gemma-4-31B-IT is listed again (04:21:59Z)");
  });
  it("the failed Stage 7 reading stays disclosed, with its record linked", () => {
    expect(flat(read("README.md"))).toContain("their one live reading failed at the endpoint (HTTP 5xx; [Stage 7 record](evidence/runs/certgate-001/stage-7/))");
    expect(existsSync(path.join(ROOT, "evidence/runs/certgate-001/stage-7"))).toBe(true);
  });
  it("the evaluation limitation says what is true: one evaluated model, a Gemma comparison run, and a live choice", () => {
    const t = flat(read("README.md"));
    expect(t).not.toContain("One endpoint and one model");
    expect(t).toContain("- **The evaluation figures are for one model.** They apply to Qwen3.8-27B on AMD Token Factory, as reported on 2026-10-13; Gemma-4-31B-IT has its own comparison run, and live reading offers a choice of models, to which those figures do not apply.");
  });
  it("every stage the register records as rejected has a plain-word line naming it and the word rejected (Z-01)", () => {
    const register = read("evidence/runs/certgate-001/STAGE-REGISTER.md");
    // F10-A02: the set is derived from the register, and every stage whose auditor verdict file rejected a candidate
    // must be in it (so a stage missing from the register cannot silently drop out of the README).
    const rejected = [...new Set(register.split("\n").filter((l) => /^\| \d \| /.test(l) && /REJECTED/.test(l)).map((l) => l.slice(2, 3)))].sort();
    const base = path.join(ROOT, "evidence", "runs", "certgate-001");
    const byVerdict = readdirSync(base).filter((d) => /^stage-\d$/.test(d)).filter((d) => {
      const dir = path.join(base, d, "auditor");
      return existsSync(dir) && readdirSync(dir).filter((f) => /^VERDICT-S\d-candidate-.*\.md$/.test(f)).some((f) => {
        const first = readFileSync(path.join(dir, f), "utf8").split("\n").find((l) => /REJECTED|ACCEPTED/.test(l)) ?? "";
        return /REJECTED/.test(first);
      });
    }).map((d) => d.slice("stage-".length)).sort();
    expect(byVerdict.length).toBeGreaterThanOrEqual(8);
    expect(rejected).toEqual(byVerdict);
    const readme = read("README.md");
    const sec = readme.slice(readme.indexOf("## How it was built and verified"), readme.indexOf("## License"));
    for (const s of rejected) {
      const line = sec.split("\n").find((l) => l.startsWith(`| ${s} · `) || l.startsWith(`- Stage ${s} (`));
      expect(line, `stage ${s}`).toBeDefined();
      expect(line!, `stage ${s}`).toMatch(/\brejected\b/);
    }
  });
});

repoOnly("mutation checks at every stage (O10-A02)", () => {
  it("the README gives a mutation line for every accepted stage, each figure found in that stage's register row", () => {
    const register = read("evidence/runs/certgate-001/STAGE-REGISTER.md");
    // One physical line of the register may carry two rows (as in test/stage7.test.ts).
    const rows = register.split("\n").flatMap((l) => l.split(/(?=\| \d \| )/)).filter((l) => /^\| \d \| /.test(l));
    const accepted = [...new Set(rows.filter((l) => /\*\*ACCEPTED\*\*/.test(l)).map((l) => l.slice(2, 3)))].sort();
    expect(accepted).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
    const readme = read("README.md");
    const sec = readme.slice(readme.indexOf("**Mutation checks**"), readme.indexOf("**Independent auditor runs:**"));
    // Each README figure "n of m" (or "n … mutants") and the register fragment that records it.
    const facts: Record<string, [string, string][]> = {
      "5": [["the auditor's 21 claim-wording and 4 identity mutants killed", "auditor 21 prize + 4 identity"], ["the adversary's 34 of 39, with 5 recorded as non-binding", "adversary 34/39 (5 non-binding residuals"]],
      "7": [["the auditor's 13 of 13", "auditor 12/12 then 13/13"], ["the adversary's 19 of 19", "adversary 19/19"]],
      "8": [["the auditor's 25 of 25", "auditor 25/25"], ["the adversary's 29 of 29", "adversary S8 29/29"]],
      "9": [["the adversary's 20 of 20", "adversary 20/20"]],
    };
    for (const s of accepted) {
      const line = sec.split("\n").find((l) => l.startsWith(`- Stage ${s}: `));
      expect(line, `stage ${s} has a mutation line`).toBeDefined();
      for (const [text, fragment] of facts[s] ?? []) {
        expect(line!, `stage ${s}`).toContain(text);
        const row = rows.filter((l) => l.startsWith(`| ${s} | `) && /\*\*ACCEPTED\*\*/.test(l)).join("\n");
        expect(row, `stage ${s} register: ${fragment}`).toContain(fragment);
      }
    }
    expect(flat(read(LABLAB))).toContain("mutation checks at every stage");
  });
});

repoOnly("the lablab form text (S10-07, X-08, X-09, Z-09)", () => {
  it("has the three fields within their limits, as plain text", () => {
    const t = read(LABLAB);
    const title = field(t, "Title");
    const short = field(t, "Short description");
    const long = field(t, "Long description");
    expect([...title].length).toBeLessThanOrEqual(50);
    expect([...short].length).toBeLessThanOrEqual(255);
    expect(long.split(/\s+/).filter(Boolean).length).toBeGreaterThanOrEqual(100);
    for (const [n, s] of [["title", title], ["short", short], ["long", long]] as const) {
      expect(s.length, n).toBeGreaterThan(0);
      expect(s, `${n}: no markdown markup`).not.toMatch(/[*`#[\]_]|^\s*[-+>]\s/m);
    }
  });
  it("carries the figures, models, utility, scope, stance and process of the README", () => {
    const im = metrics(RUNS.implementer).headline;
    const au = metrics(RUNS.auditor).headline;
    const fi = metrics(RUNS.implementer).per_field_accuracy.totals.correct;
    const i = utility(RUNS.implementer);
    const a = utility(RUNS.auditor);
    const t = read(LABLAB);
    const short = field(t, "Short description");
    const long = flat(field(t, "Long description"));
    expect(short).toContain("EN 10204 3.1");
    expect(short).toContain("a person decides");
    expect(short).toContain(`False conforming ${im.fc_broad.numerator} of ${im.fc_broad.denominator} in both Qwen3.8-27B runs.`);
    for (const s of [
      "an inspection certificate of the EN 10204 3.1 kind",
      "and a person decides",
      `false conforming was ${im.fc_broad.numerator} of ${im.fc_broad.denominator} in both runs`,
      `${im.proposal_agreement.numerator} of ${im.proposal_agreement.denominator} in the implementer run and ${au.proposal_agreement.numerator} of ${au.proposal_agreement.denominator} in the auditor's independent run`,
      `Fields read correctly were ${fi.numerator} of ${fi.denominator} in both runs.`,
      `${i.release} of ${i.n} were proposed release in the implementer run and ${a.release} of ${a.n} in the auditor's run`,
      `Sent to review without need: ${i.review.length} of ${i.n} in the implementer run and ${a.review.length} of ${a.n} in the auditor's run`,
      "The text-layer parser covers the two fictitious layouts of the dataset, not arbitrary mill certificates.",
      "Four agent seats built and verified CertGate with Claude Code",
      "the evaluated model behind every figure below",
    ]) expect(long, s).toContain(s);
  });
  it("names no code, key or endpoint path, and says where the access code goes", () => {
    const t = read(LABLAB);
    expect(flat(field(t, "Additional Information"))).toBe("The operator gives the access code for live reading in this field of the form. It is not written in this repository.");
    expect(t).not.toMatch(/https?:\/\/(?!certgate-wheat\.vercel\.app\b)/);
    expect(t).not.toMatch(/\/v1\b|Bearer|\bsk-|MODEL_API_KEY|MODEL_BASE_URL|LIVE_ACCESS_CODE/i);
    // An access code is never shown, quoted or exemplified ("Claude Code:" is the tool's name).
    expect(t).not.toMatch(/\b(access )?code(:| is [^gn]| ["'`])/);
    for (const v of [process.env.MODEL_API_KEY, process.env.MODEL_BASE_URL, process.env.LIVE_ACCESS_CODE]) if (v) expect(t.includes(v)).toBe(false);
  });
  it("passes the prize check with no allow-listed sentence", () => {
    expect(prizeFindings(prizeText(LABLAB, read(LABLAB)))).toEqual([]);
  });
});
