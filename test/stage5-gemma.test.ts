// Stage 5 (dispatch 3): the Gemma-4-31B-IT comparison run, and the guards that keep the product on Qwen3.8-27B.
// Register R5.0 S5-04, S5-07…S5-11, S5-15; R5.1 E-12…E-14; R5.2 G-01…G-07, G-09. Offline: it reads committed
// files, and the only endpoint is a local server on 127.0.0.1.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LiveReader } from "../src/web/live-reader.js";
import { DATA, ROOT } from "./helpers.js";
// @ts-expect-error plain JS tool
import { buildMetricsMd, fcRootCauses, GEMMA_RUNS, proposalDifferences, QWEN_MODEL, RUNS } from "../tools/evaluate/metrics-md.mjs";
// @ts-expect-error plain JS tool
import { buildFigures } from "../tools/evaluate/figures.mjs";
// @ts-expect-error plain JS helper
import { ALLOWED_PRIZE_CLAUSES, prizeFindings, prizeText } from "./support/prize-check.mjs";

const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8").replace(/\r\n/g, "\n");
const json = (f: string) => JSON.parse(read(f));
// The run artifacts and the evidence are not in the Docker image (.dockerignore), so these checks run in every
// checkout of the repository and are reported as skipped inside the image.
const REPO = existsSync(path.join(ROOT, "evidence")) && existsSync(path.join(ROOT, "METRICS.md"));
const repoOnly = describe.skipIf(!REPO);
/** Product files Stage 6 changes or adds (its handoff lists each with the reason); nothing else may differ. */
export const STAGE6_MAY_CHANGE = new Set([
  "src/web/app.ts", "src/web/limits.ts", "src/web/live-store.ts", "src/web/live-jobs.ts", "api/index.ts",
  "package.json", "package-lock.json", "public/app.js",
]);
type Run = { key: string; dir: string; results: string; model?: RegExp };
type Result = { case_id: string; proposal: string; expected_proposal: string; status: string; endpoint_response?: { model?: string } | null };
const load = (x: Run) => ({ ...x, m: json(`${x.dir}/metrics.json`), r: json(`${x.dir}/run.json`), res: json(`${x.dir}/${x.results}`) as Result[] });

repoOnly("model identity of every run (G-01, S5-04, S5-15 b)", () => {
  it("every reply of the Gemma run reports a Gemma model id and every reply of both Qwen runs reports Qwen3.8-27B, in the reply and in the receipt", () => {
    for (const x of (RUNS as Run[]).map(load)) {
      expect(x.r.model_requested, x.dir).toBe("Qwen3.8-27B");
      expect(x.res.length, x.dir).toBe(27);
      for (const c of x.res) expect(c.endpoint_response?.model ?? "", `${x.dir} ${c.case_id}`).toMatch(QWEN_MODEL);
      // F5-02: the receipt's reader identity agrees with the reply's (reported and requested model ids).
      for (const c of x.res as (Result & { receipt?: { reader?: { model_id?: string; requested_model_id?: string } } })[]) {
        expect(c.receipt?.reader?.model_id ?? "", `${x.dir} ${c.case_id} receipt.reader.model_id`).toMatch(QWEN_MODEL);
        expect(c.receipt?.reader?.requested_model_id, `${x.dir} ${c.case_id} receipt.reader.requested_model_id`).toBe("Qwen3.8-27B");
      }
    }
    expect(GEMMA_RUNS.length).toBeGreaterThan(0);
    for (const x of (GEMMA_RUNS as Run[]).map(load)) {
      expect(x.r.model_requested, x.dir).toBe("Gemma-4-31B-IT");
      expect(x.res.length, x.dir).toBe(27);
      for (const c of x.res) expect(c.endpoint_response?.model ?? "", `${x.dir} ${c.case_id}`).toMatch(/gemma-4-31b/i);
      for (const c of x.res as (Result & { receipt?: { reader?: { model_id?: string; requested_model_id?: string } } })[]) {
        expect(c.receipt?.reader?.model_id ?? "", `${x.dir} ${c.case_id} receipt.reader.model_id`).toMatch(/gemma-4-31b/i);
        expect(c.receipt?.reader?.requested_model_id, `${x.dir} ${c.case_id} receipt.reader.requested_model_id`).toBe("Gemma-4-31B-IT");
      }
      expect(x.r.prompt_sha256).toBe("32fad2f980bcf755841d80bb2385d9601465f83b5b42c1b6c048f3bfe1cfb567");
    }
  });
});

describe("request body (G-03, S5-02, S5-15 c)", () => {
  const open: { close: () => Promise<void> }[] = [];
  afterEach(async () => { while (open.length) await open.pop()!.close(); });
  async function capture(modelId: string) {
    const seen: string[] = [];
    const server = createServer((req, res) => {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => { seen.push(body); res.writeHead(500, { "content-type": "application/json" }); res.end("{}"); });
    }).listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    open.push({ close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) });
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
    const reader = new LiveReader({ baseUrl: url, modelId, apiKey: "test-key-not-real", backoffBaseMs: 1 });
    await reader.read({ case_id: "cg-004", certificate: new Uint8Array(readFileSync(path.join(DATA, "cases", "cg-004", "certificate.pdf"))) }).catch(() => undefined);
    return JSON.parse(seen[0]!);
  }
  // The page images are replaced by a fixed marker, so the hash covers the builder (model, parameters, prompt,
  // message structure), not the JPEG encoder of the platform.
  const golden = (body: { messages: { content: unknown }[] }) => {
    const b = structuredClone(body) as { messages: { content: unknown }[] };
    const parts = b.messages[1]!.content as { type: string; image_url?: { url: string } }[];
    for (const p of parts) if (p.type === "image_url") p.image_url = { url: "<page image>" };
    return createHash("sha256").update(JSON.stringify(b)).digest("hex");
  };
  it("the Qwen request body for cg-004 hashes to its value at b0ec67a6", async () => {
    const q = await capture("Qwen3.8-27B");
    expect(golden(q)).toBe("69cb47715bc59b6383f3442bf2a6449043de92b07d9161c5429240102771655e");
    expect(q).toMatchObject({ model: "Qwen3.8-27B", temperature: 0, max_tokens: 16384, response_format: { type: "json_object" } });
  });
  it("the Gemma request body equals the Qwen request body except the model id, with no thinking control", async () => {
    const q = await capture("Qwen3.8-27B");
    const g = await capture("Gemma-4-31B-IT");
    expect(g.model).toBe("Gemma-4-31B-IT");
    expect({ ...g, model: "Qwen3.8-27B" }).toEqual(q);
    expect(Object.keys(g).sort()).toEqual(["max_tokens", "messages", "model", "response_format", "temperature"]);
  });
});

repoOnly("Qwen stays the product (E-13, G-04, CH5-07, S5-09, S5-15 d)", () => {
  it("public/, src/, api/, data/, config/, the package and container files (vercel.json apart), the expectations, the Qwen run artifacts and the stage-3 evidence are byte-identical to b0ec67a6", () => {
    const base = json("test/fixtures/stage5-baseline.json") as { roots: string[]; blobs: Record<string, string> };
    // A file equals its b0ec67a6 blob as it is, or, for a checkout made with CRLF line endings, once CRLF is turned
    // back into LF as git stores text (.gitattributes "* text=auto eol=lf"; a few source files keep CRLF in git).
    const sha = (b: Buffer) => createHash("sha1").update(`blob ${b.length}\0`).update(b).digest("hex");
    const blob = (p: string, id: string) => {
      const b = readFileSync(path.join(ROOT, p));
      if (sha(b) === id || /\.(png|jpe?g|gif|ico|pdf|zip|gz)$/i.test(p)) return sha(b);
      return sha(Buffer.from(b.toString("latin1").replace(/\r\n/g, "\n"), "latin1"));
    };
    // Stage 6 (dispatch 4) may change exactly these product files (live jobs on the deployed site); the reading path,
    // data, config, evaluation, figures and stories stay pinned here and in test/stage6-live.test.ts (S6-09).
    for (const [p, id] of Object.entries(base.blobs)) if (!STAGE6_MAY_CHANGE.has(p)) expect(blob(p, id), p).toBe(id);
    const present: string[] = [];
    const walk = (p: string) => { const abs = path.join(ROOT, p); if (statSync(abs).isDirectory()) for (const e of readdirSync(abs)) walk(`${p}/${e}`); else present.push(p); };
    for (const r of base.roots) walk(r);
    expect(present.filter((p) => !STAGE6_MAY_CHANGE.has(p)).sort()).toEqual(Object.keys(base.blobs).filter((p) => !STAGE6_MAY_CHANGE.has(p)).sort());
  });
  it("vercel.json differs from b0ec67a6 only in the includeFiles value that E-15 authorises", () => {
    const before = json("test/fixtures/stage5-baseline.json").vercel_json_at_b0ec67a6;
    const now = json("vercel.json");
    expect(now.functions["api/index.ts"].includeFiles).toBe("{data,config,public/stories,node_modules/pdfjs-dist}/**");
    now.functions["api/index.ts"].includeFiles = before.functions["api/index.ts"].includeFiles;
    expect(now).toEqual(before);
  });
  it("the landing figures are generated from the Qwen implementer run, never from a Gemma run", () => {
    const fig = json("public/figures.json");
    expect(fig.generated_from).toBe(RUNS[0].dir);
    expect(fig).toEqual(buildFigures(path.join(ROOT, RUNS[0].dir)));
    for (const m of fig.model_reported) expect(m).toMatch(QWEN_MODEL);
    for (const g of GEMMA_RUNS) expect(fig.generated_from).not.toBe(g.dir);
    for (const f of readdirSync(path.join(ROOT, "public", "stories")).filter((n) => n.endsWith(".recording.json"))) {
      expect(json(`public/stories/${f}`).model_reported, f).toMatch(QWEN_MODEL);
    }
  });
});

repoOnly("METRICS.md comparison section (G-05, G-06, S5-07, S5-08, S5-15 f)", () => {
  it("the per-case difference list equals the set of cases whose Gemma proposal differs from a Qwen run, and METRICS.md lists every one", () => {
    const qwen = (RUNS as Run[]).map(load);
    const md = buildMetricsMd();
    for (const g of (GEMMA_RUNS as Run[]).map(load)) {
      const expected = g.res.filter((c) => qwen.some((q) => q.res.find((r) => r.case_id === c.case_id)?.proposal !== c.proposal)).map((c) => c.case_id).sort();
      const listed = proposalDifferences(qwen, g).map((d: { case_id: string }) => d.case_id).sort();
      expect(listed).toEqual(expected);
      const line = md.split("\n").find((l: string) => l.startsWith(`Every case where the ${g.key} proposal differs from a Qwen run`))!;
      expect(line).toContain(`(${expected.length}):`);
      for (const id of expected) expect(line).toContain(`${id} (expected`);
    }
  });
  it("a false conforming gets a generated root-cause line: case, field read vs correct, rule path", () => {
    const run = { res: [{
      case_id: "cg-x", proposal: "release", expected_proposal: "block", reasons: [],
      fields: { "chemistry.Si": { category: "wrong", model: "0.52", model_unit: "%", correct: "0.62", correct_status: "read" }, grade: { category: "correct", model: "TRN-355", correct: "TRN-355" } },
      receipt: { rule_results: [{ rule_id: "ESP-014.r3.Si", input_field_refs: ["chemistry.Si"], outcome: "pass", expected: "<= 0.55 %", observed: "0.52" }, { rule_id: "ESP-014.r3.C", input_field_refs: ["chemistry.C"], outcome: "pass", expected: "<= 0.20 %", observed: "0.16" }] },
    }] };
    expect(fcRootCauses(run, () => [{ field: "Si" }])).toEqual([
      "cg-x: expected block, proposed release; `chemistry.Si` read `0.52` %, correct `0.62` (wrong); rule path: ESP-014.r3.Si pass (limit <= 0.55 %, observed 0.52); reasons: none.",
    ]);
  });
  it("the comparison section follows the Qwen sections, which are unchanged from b0ec67a6", () => {
    const md = buildMetricsMd();
    const at = md.indexOf("## Comparison run: Gemma-4-31B-IT (Stage 5)");
    expect(at).toBeGreaterThan(0);
    const qwenPart = md.slice(0, at);
    expect(createHash("sha256").update(qwenPart).digest("hex")).toBe("fcd2d6fc9f78dddd558d49d0e22b9e6411a79f91c81e1c3dbfbc20e887967b21");
  });
});

repoOnly("README Gemma section (S5-10, G-05, G-08, S5-15 a)", () => {
  const section = () => { const r = read("README.md"); return r.slice(r.indexOf("## Comparison with Gemma-4-31B-IT"), r.indexOf("## Demo procedure")); };
  it("README Gemma figures equal the generated metrics of the Gemma run", () => {
    const t = section();
    const m = json(`${GEMMA_RUNS[0].dir}/metrics.json`);
    const h = m.headline;
    const of = (x: { numerator: string; denominator: string }) => `${x.numerator} of ${x.denominator}`;
    expect(t).toContain(`[${GEMMA_RUNS[0].dir}/](${GEMMA_RUNS[0].dir}/)`);
    expect(t).toContain(`**${of(h.fc_broad)}** (strict, expected block: ${of(h.fc_strict)})`);
    expect(t).toContain(`| Non-conformities caught | ${of(h.non_conformities_caught)}, ${of(h.non_conformities_blocked)} proposed block |`);
    const mm = m.proposal_mismatches.map((p: { case_id: string; proposal: string; expected: string }) => `${p.case_id}: ${p.proposal}, expected ${p.expected}`).join("; ");
    expect(t).toContain(`| Proposal as expected | ${of(h.proposal_agreement)} (${mm}) |`);
    expect(t).toContain(`| Failures · retries | ${of(m.abstentions.failure)} · ${m.retries.cases_with_retry.length} |`);
    const tot = m.per_field_accuracy.totals;
    const z = (c: string) => (tot[c] ? of(tot[c]) : `0 of ${tot.correct.denominator}`);
    expect(t).toContain(`| Field readings correct | ${of(tot.correct)} |`);
    expect(t).toContain(`| Confident on illegible · unknown · wrong | ${z("confident_on_illegible")} · ${z("unknown")} · ${z("wrong")} |`);
    expect(t).toContain(`| Seconds per certificate | mean ${h.seconds_per_certificate.mean}, median ${h.seconds_per_certificate.median} (N ${h.seconds_per_certificate.n}) |`);
    expect(t).toContain(`| Cost per certificate | mean ${h.cost_per_certificate.mean} |`);
    expect(t).toContain(`no false conforming (${of(h.fc_broad)})`);
    expect(t).toContain(`(${z("confident_on_illegible")}, cg-017)`);
  });
  it("the Gemma publisher and licence are stated as the publisher's page states them, with link and date", () => {
    const t = section();
    const src = read("docs/sources/gemma.md");
    expect(t).toContain("its licence, as published by the\npublisher, is apache-2.0");
    expect(t).toContain("https://huggingface.co/google/gemma-4-31b-it,\nretrieved 2026-10-14");
    expect(src).toContain("license: apache-2.0");
    expect(src).toContain("https://ai.google.dev/gemma/docs/gemma_4_license");
    expect(src).toContain("https://huggingface.co/google/gemma-4-31b-it, retrieved 2026-10-14");
    expect(t).not.toMatch(/open[- ]source/i);
  });
  it("the cg-003 Gemma reading cited by the README is evidence only, and reports Gemma", () => {
    const f = "evidence/runs/certgate-001/stage-5/implementer/endpoint/gemma-read-cg-003.json";
    expect(section()).toContain(`(${f})`);
    const rec = json(f);
    expect(rec.body.model).toMatch(/gemma-4-31b/i);
    expect(JSON.parse(rec.body.choices[0].message.content).fields.mechanical.ReH.value).toBe("338");
    expect(readdirSync(path.join(ROOT, "public", "stories")).join(" ")).not.toMatch(/gemma/i);
  });
});

describe("prize check, fail closed (S5-11, G-09, R5.5 E-17, R5.6 E-18, R5.7 E-19, S5-15 e)", () => {
  const I = "\u0456"; // Cyrillic i, a look-alike of Latin i
  it("flags every sentence with a prize word that is not on the allow-list, negated or not", () => {
    const flagged = [
      // F5-01 (auditor verdicts e0b691a0, 2e8c019d) A1-A7; S5M-e2/e3 (adversary 31240af4); e4-e8 (adversary 18a5af25).
      "CertGate is eligible for the Gemma prize.",
      "CertGate is not just a comparison: it is eligible for the Gemma prize.",
      "CertGate never invents a value and is eligible for the Gemma prize.",
      "CertGate is a strong contender for Google's Gemma challenge on AMD.",
      "CertGate won the Gemma track.",
      "CertGate is a finalist in the hackathon.",
      "CertGate placed first in the Gemma category.",
      "With no doubt CertGate is eligible for the Gemma prize.",
      "CertGate never fails to qualify for the Gemma prize.",
      "Not only is CertGate eligible for the Gemma prize, it is a likely winner.",
      "CertGate is a frontrunner in Google's Gemma track on AMD.",
      "Without question CertGate deserves the Gemma prize.",
      // E-19 item 4.
      "CertGate does not compete for any prize, but it qualifies for the Gemma award.",
      "CertGate does not compete for any prize.",
      "not a toy, it is eligible for the prize",
      "CertGate qualifies for the Gemma prize.",
      "We entered the Google prize; it is the best use of Gemma.",
      "CertGate is ranked second; it places third in the Gemma category and earned an honourable mention.",
      "CertGate was shortlisted as a runner-up on the podium.",
    ];
    for (const s of flagged) expect(prizeFindings(s), s).not.toEqual([]);
  });
  it("normalises before matching: an appended claim, look-alike letters, emphasis and zero-width characters do not hide a prize word (E-18, e13-e17)", () => {
    const flagged = [
      // e13: the allowed sentence with a claim appended is not the allowed sentence.
      "This comparison makes no claim about any prize or award, although CertGate is eligible for one.",
      // e14, e15: Cyrillic i (U+0456) inside "prize" and "eligible", as the only prize words.
      `CertGate takes the Gemma pr${I}ze.`,
      `CertGate is el${I}gible for Gemma on AMD.`,
      `CertGate is eligible for the Gemma pr${I}ze.`,
      // e16: markdown emphasis splitting a word.
      "CertGate is eli**gible** for Gemma on AMD.",
      "CertGate is eli_gible_ for Gemma on AMD.",
      // e17: a zero-width space inside a word.
      "CertGate is eli\u200Bgible for Gemma on AMD.",
      "CertGate is el\uFEFFigible for Gemma on AMD.",
      // Greek look-alikes and full-width letters (NFKC).
      "CertGate is the w\u03B9nner on AMD.",
      "CertGate is ｅｌｉｇｉｂｌｅ for Gemma.",
    ];
    for (const s of flagged) expect(prizeFindings(s), JSON.stringify(s)).not.toEqual([]);
  });
  it("accepts exactly the allow-listed sentences, and nothing about windows", () => {
    expect([...ALLOWED_PRIZE_CLAUSES.keys()]).toEqual(["This comparison makes no claim about any prize or award.", "Enter at least one value."]);
    for (const s of ALLOWED_PRIZE_CLAUSES.keys()) expect(prizeFindings(s), s).toEqual([]);
    for (const reason of ALLOWED_PRIZE_CLAUSES.values()) expect(reason.length).toBeGreaterThan(10);
    expect(prizeFindings("Announced live windows are shown as text; the window is configured.")).toEqual([]);
  });
  it("in public JavaScript only string literals are checked: identifiers are code, strings are text", () => {
    expect(prizeFindings(prizeText("public/app.js", "for (const [k, v] of Object.entries(props)) {}"))).toEqual([]);
    expect(prizeFindings(prizeText("public/app.js", 'show("Enter at least one value.");'))).toEqual([]);
    expect(prizeFindings(prizeText("public/app.js", 'show("CertGate is eligible for the Gemma prize.");'))).not.toEqual([]);
    expect(prizeFindings(prizeText("public/app.js", "const t = `Winner on AMD`;"))).not.toEqual([]);
  });
  it("accepts the kickoff quote only inside quotation marks with its source", () => {
    const q = 'The kickoff said "the best use of Gemma models challenge" (01-REGLAS, "Kickoff en directo").';
    expect(prizeFindings(q)).toEqual([]);
    expect(prizeFindings("the best use of Gemma models challenge")).not.toEqual([]);
  });
});
