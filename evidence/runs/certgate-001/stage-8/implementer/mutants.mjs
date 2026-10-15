// Stage 8 implementer mutants (S8-16, R8.2 §10; not product code). Each mutant edits one product or tool file in
// place, runs the named test files, records whether a test failed and which ones, and restores the file with
// `git checkout -- <file>`. Run from a clean tree at the candidate commit:
//   node evidence/runs/certgate-001/stage-8/implementer/mutants.mjs [id ...]
// Writes mutants-result.json next to this script.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..", "..");
const S8 = ["test/stage8-models.test.ts", "test/stage8-live.test.ts"];
const S6 = [...S8, "test/stage6-live.test.ts"];
const A = "src/web/app.ts", M = "src/web/models.ts", J = "src/web/live-jobs.ts", P = "public/app.js", T = "tools/probe-models.mjs";
export const MUTANTS = [
  { id: "M01", what: "acknowledgement truthy instead of === true", file: A, find: "body.not_evaluated_acknowledged !== true", repl: "!body.not_evaluated_acknowledged", tests: S8 },
  { id: "M02", what: "acknowledgement not checked on the server", file: A, find: '    if (choice.group === "experimental" && body.not_evaluated_acknowledged !== true) throw new Refusal(400, REASONS.model_ack_required, { reason_class: "model_ack_required" });\n', repl: "", tests: S8 },
  { id: "M03", what: "a missing model defaults to MODEL_ID", file: A, find: 'if (typeof body.model !== "string" || body.model === "") throw new Refusal(400, REASONS.model_missing, { reason_class: "model_missing" });', repl: 'if (typeof body.model !== "string" || body.model === "") body.model = cfg.modelId;', tests: S8 },
  { id: "M04", what: "listing freshness ignored (stale and f1:last accepted)", file: A, find: "age > F1_CACHE_MS || age < -LISTING_FUTURE_TOLERANCE_MS", repl: "false", tests: S8 },
  { id: "M05", what: "a future-dated listing accepted", file: A, find: " || age < -LISTING_FUTURE_TOLERANCE_MS", repl: "", tests: S8 },
  { id: "M06", what: "the server listing check removed", file: A, find: '    if (!isListed(choice.id, f1.model_ids)) throw new Refusal(409, REASONS.model_unlisted, { reason_class: "model_unlisted" });\n', repl: "", tests: S8 },
  { id: "M07", what: "mismatch guard reverted to a substring test", file: A, find: "!sameModel(requested, reported)", repl: "!reported.toLowerCase().includes(requested.toLowerCase())", tests: S8 },
  { id: "M08", what: "mismatch guard compares against MODEL_ID", file: A, find: "!sameModel(requested, reported)", repl: '!sameModel(cfg.modelId ?? "", reported)', tests: S8 },
  { id: "M09", what: "model_choice dropped from the receipt", file: A, find: "      r.receipt.model_choice = mc;\n", repl: "", tests: S8 },
  { id: "M10", what: "requested model dropped from the receipt's F1 copy", file: A, find: "model_requested: mc.requested, ", repl: "", tests: S8 },
  { id: "M11", what: "the client's string sent uncanonicalised", file: A, find: "    const requested = choice.id;", repl: "    const requested = String(body.model);", tests: S8 },
  { id: "M12", what: "legacy route unguarded (MODEL_ID or the default read whatever it is)", file: A, find: "    if (legacyChoice === null || !isListed(legacyChoice.id, f1.model_ids)) {", repl: "    if (false) {", extra: [["    const legacyModel = legacyChoice.id;", '    const legacyModel = legacyChoice?.id ?? cfg.modelId ?? "unknown";']], tests: S8 },
  { id: "M13", what: "the test stub catalog used by default", file: A, find: "const catalog = deps.modelCatalog ?? MODEL_CATALOG;", repl: 'const catalog = deps.modelCatalog ?? { ...MODEL_CATALOG, measured: [...MODEL_CATALOG.measured, { id: "certgate-test-stub", metrics_section: "", runs: [] }] };', tests: S8 },
  { id: "M14", what: "listing check moved after admission (after the hourly count)", file: A, find: '    if (!isListed(choice.id, f1.model_ids)) throw new Refusal(409, REASONS.model_unlisted, { reason_class: "model_unlisted" });\n', repl: "", extra: [["    const requested = choice.id;", '    const requested = choice.id;\n    if (!isListed(choice.id, f1.model_ids)) throw new Refusal(409, REASONS.model_unlisted, { reason_class: "model_unlisted" });']], tests: S8 },
  { id: "M15", what: "the shared F1 copy carries a requested model", file: A, find: "      await store.set(KEYS.f1, JSON.stringify(snap), ttl);", repl: "      await store.set(KEYS.f1, JSON.stringify({ ...snap, model_requested: cfg.modelId }), ttl);", tests: S8 },
  { id: "M16", what: "offer checks moved after the probe (ack before probe broken)", file: A, find: '    if (choice.group === "experimental" && body.not_evaluated_acknowledged !== true) throw new Refusal(400, REASONS.model_ack_required, { reason_class: "model_ack_required" });\n', repl: "", extra: [["    const listingCheckedAt: string = f1.checked_at;", '    if (choice.group === "experimental" && body.not_evaluated_acknowledged !== true) throw new Refusal(400, REASONS.model_ack_required, { reason_class: "model_ack_required" });\n    const listingCheckedAt: string = f1.checked_at;']], tests: S8 },
  { id: "M17", what: "legacy route mismatch guard removed (F8-A01)", file: A, find: '    if (reader.lastCall && !sameModel(legacyModel, reader.lastCall.model_reported ?? "")) {\n      throw new HttpError(502, REASONS.model_mismatch, { reason_class: "model_mismatch" });\n    }\n', repl: "", tests: [...S8, "test/web.test.ts"] },
  { id: "M18", what: "legacy route mismatch guard reverted to a substring test", file: A, find: '!sameModel(legacyModel, reader.lastCall.model_reported ?? "")', repl: '!(reader.lastCall.model_reported ?? "").toLowerCase().includes(legacyModel.toLowerCase())', tests: [...S8, "test/web.test.ts"] },
  { id: "M20", what: "offer = all measured (union, LIVE_MODELS ignored)", file: M, find: "    measured: measuredIds.filter((id) => wanted.has(id)),", repl: "    measured: measuredIds,", tests: S8 },
  { id: "M21", what: "an unknown LIVE_MODELS id offered", file: M, find: "    experimental: experimentalIds.filter((id) => wanted.has(id)),", repl: "    experimental: [...experimentalIds.filter((id) => wanted.has(id)), ...entries.filter((e) => canonical(measuredIds, e) === null && canonical(experimentalIds, e) === null)],", tests: S8 },
  { id: "M22", what: "an empty intersection falls back to MODEL_ID", file: M, find: "    measured: measuredIds.filter((id) => wanted.has(id)),", repl: "    measured: wanted.size ? measuredIds.filter((id) => wanted.has(id)) : (modelId ? [modelId] : []),", tests: S8 },
  { id: "M23", what: "an unmeasured MODEL_ID offered", file: M, find: "    return { measured: m ? [m] : [], experimental: [], narrowed: false, log };", repl: "    return { measured: m ? [m] : modelId ? [modelId] : [], experimental: [], narrowed: false, log };", tests: S8 },
  { id: "M24", what: "sameModel reverted to a substring test", file: M, find: '  return slash > 0 && slash === b.lastIndexOf("/") && b.slice(slash + 1) === a;', repl: "  return b.includes(a);", tests: S8 },
  { id: "M25", what: "the default falls through to an experimental model", file: M, find: "  return offer.measured.find((id) => isListed(id, listed)) ?? null;", repl: "  return offer.measured.find((id) => isListed(id, listed)) ?? offer.experimental.find((id) => isListed(id, listed)) ?? null;", tests: S8 },
  { id: "M26", what: "MODEL_ID preference dropped from the default", file: M, find: "  if (preferred && isListed(preferred, listed)) return preferred;\n", repl: "", tests: S8 },
  { id: "M27", what: "an unlisted measured model shown enabled", file: M, find: "      id: m.id, enabled: offered && isOn,", repl: "      id: m.id, enabled: offered,", tests: S8 },
  { id: "M28", what: "evaluated true on an experimental reading", file: M, find: "    evaluated: measured,", repl: "    evaluated: true,", tests: S8 },
  { id: "M29", what: "the not-evaluated label dropped from the receipt", file: M, find: '    label: measured ? "evaluated: measured model" : NOT_EVALUATED_LABEL,', repl: '    label: "evaluated: measured model",', tests: S8 },
  { id: "M30", what: "measured precedence removed (a measured id offered as experimental)", file: M, find: ".filter((id) => canonical(measuredIds, id) === null)", repl: "", tests: S8 },
  { id: "M31", what: "a hard-coded check time", file: M, find: "export const LISTED_TEXT = (t: string) => `listed by the endpoint, checked ${t}`;", repl: "export const LISTED_TEXT = (t: string) => `listed by the endpoint, checked 2026-10-15T00:00:00.000Z`;", tests: S8 },
  { id: "M32", what: "an experimental id in the set without evidence", file: M, find: '  { id: "Qwen3.8-Flash-Next",', repl: '  { id: "Fake-Probe-Model", evidence: `${PROBES}/Fake-Probe-Model.json`, probed_at: "2026-10-15T19:50:06.821Z" },\n  { id: "Qwen3.8-Flash-Next",', tests: S8 },
  { id: "M33", what: "a listed-not-offered id accepted on POST", file: M, find: "  const x = canonical(offer.experimental, given);", repl: '  const x = canonical(offer.experimental, given) ?? (typeof given === "string" && given !== "" ? given : null);', tests: S8 },
  { id: "M34", what: "figures attached to an experimental reading", file: M, find: "    figures: measured ? { metrics_section: m!.metrics_section, runs: [...m!.runs] } : null,", repl: "    figures: { metrics_section: MEASURED_MODELS[0]!.metrics_section, runs: [...MEASURED_MODELS[0]!.runs] },", tests: S8 },
  { id: "M40", what: "badge test truthy instead of === false", file: P, find: "  if (mc.evaluated === false) {", repl: "  if (!mc.evaluated) {", tests: S8 },
  { id: "M41", what: "the not-evaluated badge dropped from the page", file: P, find: 'badge("not evaluated", "review"),', repl: "", tests: S8 },
  { id: "M42", what: "the acknowledgement always sent as true", file: P, find: "body.not_evaluated_acknowledged = pickNow.acknowledged === true;", repl: "body.not_evaluated_acknowledged = true;", tests: S8 },
  { id: "M43", what: "a listed-not-offered id rendered as a choice", file: P, find: '      h("ul", { class: "small muted", id: "live-models-other" }, m.listed_not_offered.map((x) => h("li", {}, h("span", { class: "mono" }, x.id), ` · ${x.reason}`)),', repl: '      h("ul", { class: "small muted", id: "live-models-other" }, m.listed_not_offered.map((x) => h("li", {}, h("input", { type: "radio", name: "live-model", value: x.id }), h("span", { class: "mono" }, x.id), ` · ${x.reason}`)),', tests: S8 },
  { id: "M50", what: "the reported model dropped from a mismatch job", file: J, find: "        await fail(first.reason_class, first.model_reported);", repl: "        await fail(first.reason_class);", tests: S8 },
  { id: "M60", what: "the probe pass uses a substring test", file: T, find: "      same_model: reported !== null && sameModel(id, reported),", repl: "      same_model: reported !== null && reported.includes(id),", tests: S8 },
  { id: "M61", what: "the probe time budget ignored", file: T, find: "      within_reading_budget: elapsed <= budgetMs,", repl: "      within_reading_budget: true,", tests: S8 },
  { id: "M62", what: "the probe call cap ignored", file: T, find: "      if (calls >= callCap) {", repl: "      if (false) {", tests: S8 },
  { id: "M63", what: "a non-chat model probed", file: T, find: '  if (Array.isArray(entry.output) && !entry.output.includes("text")) return', repl: '  if (false) return', tests: S8 },
];

function apply(m) {
  const abs = path.join(ROOT, m.file);
  let src = readFileSync(abs, "utf8");
  for (const [find, repl] of [[m.find, m.repl], ...(m.extra ?? [])]) {
    const n = src.split(find).length - 1;
    if (n !== 1) throw new Error(`${m.id}: expected the text once in ${m.file}, found ${n}`);
    src = src.replace(find, repl);
  }
  writeFileSync(abs, src);
}

const only = process.argv.slice(2);
const dirty = execFileSync("git", ["status", "--porcelain", "--", "src", "public", "tools", "test"], { cwd: ROOT }).toString().trim();
if (dirty) { console.error(`the tree is not clean:\n${dirty}`); process.exit(2); }
const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString().trim();
const results = [];
for (const m of MUTANTS.filter((x) => only.length === 0 || only.includes(x.id))) {
  const out = path.join(HERE, `.vitest-${m.id}.json`);
  try {
    apply(m);
    const r = spawnSync(process.execPath, [path.join(ROOT, "node_modules", "vitest", "vitest.mjs"), "run", ...m.tests, "--reporter=json", `--outputFile=${out}`], { cwd: ROOT, encoding: "utf8", timeout: 600_000 });
    let failed = [];
    try {
      const j = JSON.parse(readFileSync(out, "utf8"));
      failed = j.testResults.flatMap((f) => f.assertionResults.filter((a) => a.status === "failed").map((a) => `${path.basename(f.name)}::${a.title}`));
    } catch { failed = r.status === 0 ? [] : [`(no report; exit ${r.status})`]; }
    results.push({ id: m.id, what: m.what, file: m.file, killed: r.status !== 0 && failed.length > 0, killers: failed.slice(0, 5), killer_count: String(failed.length) });
    console.log(`${m.id} ${r.status !== 0 && failed.length > 0 ? "killed" : "SURVIVED"} (${failed.length}) ${m.what}`);
  } finally {
    execFileSync("git", ["checkout", "--", m.file], { cwd: ROOT });
    rmSync(out, { force: true });
  }
}
writeFileSync(path.join(HERE, only.length ? "mutants-result-partial.json" : "mutants-result.json"), JSON.stringify({ schema: "certgate.implementer-mutants/1", commit: head, run_utc: new Date().toISOString(), results }, null, 2) + "\n");
console.log(`${results.filter((r) => r.killed).length}/${results.length} killed`);
