// Auditor (T8-22): the auditor's own mutants on the Stage 8 guards, applied one at a time to a clean clone of the
// candidate, never committed or merged. Each mutant is an exact string replacement that must occur exactly once.
// For each: apply, run the named test files, record the exit code and the failing tests, restore with git checkout.
//   node s8_mutants.mjs <candidate-clone> <out.json> [mutant-id ...]
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const [repo, out, ...only] = process.argv.slice(2);
const APP = "src/web/app.ts", MODELS = "src/web/models.ts";
const TESTS = ["test/stage8-live.test.ts", "test/stage8-models.test.ts", "test/stage6-live.test.ts", "test/web.test.ts"];

const M = [
  { id: "M8-01", what: "offer = union: LIVE_MODELS no longer narrows the measured set", file: MODELS,
    from: "measured: measuredIds.filter((id) => wanted.has(id)),", to: "measured: measuredIds," },
  { id: "M8-02", what: "an id outside both sets is accepted (canonical returns the given string)", file: MODELS,
    from: "return ids.find((id) => asciiLower(id) === g) ?? null;", to: "return ids.find((id) => asciiLower(id) === g) ?? (given as string);" },
  { id: "M8-03", what: "an unlisted offered measured model is shown enabled", file: MODELS,
    from: "id: m.id, enabled: offered && isOn,", to: "id: m.id, enabled: offered," },
  { id: "M8-04", what: "the server listing check on POST is removed", file: APP,
    from: "if (!isListed(choice.id, f1.model_ids)) throw new Refusal(409, REASONS.model_unlisted, { reason_class: \"model_unlisted\" });",
    to: "if (false) throw new Refusal(409, REASONS.model_unlisted, { reason_class: \"model_unlisted\" });" },
  { id: "M8-05", what: "the listing check runs after admission (after the queue entry and the hourly INCR)", file: APP,
    from: "if (!isListed(choice.id, f1.model_ids)) throw new Refusal(409, REASONS.model_unlisted, { reason_class: \"model_unlisted\" });\n    const listingCheckedAt: string = f1.checked_at;",
    to: "const listingCheckedAt: string = f1.checked_at;",
    from2: "    const requested = choice.id;\n", to2: "    if (!isListed(choice.id, f1.model_ids)) throw new Refusal(409, REASONS.model_unlisted, { reason_class: \"model_unlisted\" });\n    const requested = choice.id;\n" },
  { id: "M8-06", what: "a stale listing is accepted (freshness limit multiplied by 1000)", file: APP,
    from: "age > F1_CACHE_MS ||", to: "age > F1_CACHE_MS * 1000 ||" },
  { id: "M8-07", what: "the mismatch guard compares against MODEL_ID instead of the chosen model", file: APP,
    from: "if (!sameModel(requested, reported))", to: "if (!sameModel(cfg.modelId ?? \"\", reported))" },
  { id: "M8-08", what: "the job reads with MODEL_ID instead of the chosen model (a second model id reaches the endpoint)", file: APP,
    from: "new DeadlineReader({ baseUrl: cfg.modelBaseUrl!, modelId: requested,", to: "new DeadlineReader({ baseUrl: cfg.modelBaseUrl!, modelId: cfg.modelId ?? requested," },
  { id: "M8-09a", what: "the requested model is dropped from the receipt's F1 copy", file: APP,
    from: "model_requested: mc.requested, model_evaluated", to: "model_requested: null, model_evaluated" },
  { id: "M8-09b", what: "the requested model is dropped from the receipt's model_choice", file: MODELS,
    from: "    requested: choice.id,\n    reported,", to: "    requested: null,\n    reported," },
  { id: "M8-10", what: "a missing model silently defaults to MODEL_ID", file: APP,
    from: "if (typeof body.model !== \"string\" || body.model === \"\") throw new Refusal(400, REASONS.model_missing, { reason_class: \"model_missing\" });",
    to: "if (typeof body.model !== \"string\" || body.model === \"\") body.model = cfg.modelId;" },
  { id: "M8-11", what: "the default falls through to an experimental model", file: MODELS,
    from: "return offer.measured.find((id) => isListed(id, listed)) ?? null;", to: "return offer.measured.find((id) => isListed(id, listed)) ?? offer.experimental.find((id) => isListed(id, listed)) ?? null;" },
  { id: "M8-12a", what: "the acknowledgement is not checked on the server", file: APP,
    from: "if (choice.group === \"experimental\" && body.not_evaluated_acknowledged !== true)", to: "if (false && choice.group === \"experimental\" && body.not_evaluated_acknowledged !== true)" },
  { id: "M8-12b", what: "the acknowledgement is checked as truthy, not === true", file: APP,
    from: "body.not_evaluated_acknowledged !== true)", to: "!body.not_evaluated_acknowledged)" },
  { id: "M8-13", what: "an experimental reading is recorded as evaluated", file: MODELS,
    from: "    evaluated: measured,\n", to: "    evaluated: true,\n" },
  { id: "M8-14", what: "an id without passing probe evidence is added to the experimental set", file: MODELS,
    from: "  { id: \"Qwen3.8-Flash-Next\",", to: "  { id: \"MiniCPM5-2B\", evidence: `${PROBES}/MiniCPM5-2B.json`, probed_at: \"2026-10-15T19:50:06.821Z\" },\n  { id: \"Qwen3.8-Flash-Next\"," },
  { id: "M8-15", what: "the identity rule reverted to a substring test", file: MODELS,
    from: "  if (a === b) return true;\n  const slash", to: "  return b.includes(a);\n  const slash" },
  { id: "M8-16", what: "a future-dated listing is accepted (clock-skew tolerance removed)", file: APP,
    from: "|| age < -LISTING_FUTURE_TOLERANCE_MS)", to: "|| false)" },
  { id: "M8-17", what: "measured precedence removed: a measured id may also be offered as experimental", file: MODELS,
    from: "const experimentalIds = catalog.experimental.map((m) => m.id).filter((id) => canonical(measuredIds, id) === null);",
    to: "const experimentalIds = catalog.experimental.map((m) => m.id);" },
  { id: "M8-18", what: "the legacy route reads with MODEL_ID unchecked (no offer, no listing)", file: APP,
    from: "const legacyChoice = resolveChoice({ ...offer, experimental: [] }, cfg.modelId ?? \"\");",
    to: "const legacyChoice = { id: cfg.modelId ?? \"unknown\", group: \"measured\" as const }; if (false) resolveChoice(offer, \"\");" },
  { id: "M8-19", what: "figures attached to an experimental reading", file: MODELS,
    from: "    figures: measured ? { metrics_section: m!.metrics_section, runs: [...m!.runs] } : null,",
    to: "    figures: { metrics_section: m?.metrics_section ?? \"Qwen3.8-27B\", runs: [...(m?.runs ?? [\"evaluation/runs/real-candidate-dd557fd\"])] }," },
  { id: "M8-20", what: "the experimental label dropped from the choice view", file: MODELS,
    from: "label: `${NOT_EVALUATED_LABEL} · experimental · probed ${x.probed_at.slice(0, 10)}`,", to: "label: `experimental`," },
  // Candidate 2 (F8-A01 repair): the legacy route's mismatch guard.
  { id: "M8-21", what: "legacy route: the model_mismatch guard removed (F8-A01)", file: APP, since: "c2",
    from: "if (reader.lastCall && !sameModel(legacyModel, reader.lastCall.model_reported ?? \"\")) {",
    to: "if (false && reader.lastCall && !sameModel(legacyModel, reader.lastCall.model_reported ?? \"\")) {" },
  { id: "M8-22", what: "legacy route: the guard reverted to a case-insensitive substring test", file: APP, since: "c2",
    from: "if (reader.lastCall && !sameModel(legacyModel, reader.lastCall.model_reported ?? \"\")) {",
    to: "if (reader.lastCall && !(reader.lastCall.model_reported ?? \"\").toLowerCase().includes(legacyModel.toLowerCase())) {" },
  { id: "M8-23", what: "legacy route: on mismatch the reading is shown anyway (guard answers but after the view is built: status 200)", file: APP, since: "c2",
    from: "      throw new HttpError(502, REASONS.model_mismatch, { reason_class: \"model_mismatch\" });\n    }\n    if (reader.lastCall) {",
    to: "      void 0;\n    }\n    if (reader.lastCall) {" },
];

const git = (...a) => execFileSync("git", ["-C", repo, ...a]).toString();
const once = (src, s, id) => { const n = src.split(s).length - 1; if (n !== 1) throw new Error(`${id}: pattern occurs ${n} times`); };
const results = [];
for (const m of M.filter((x) => only.length === 0 || only.includes(x.id))) {
  const f = path.join(repo, m.file);
  const orig = readFileSync(f, "utf8");
  let src = orig;
  once(src, m.from, m.id); src = src.replace(m.from, m.to);
  if (m.from2) { once(src, m.from2, m.id + "/2"); src = src.replace(m.from2, m.to2); }
  writeFileSync(f, src);
  const t0 = Date.now();
  const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["vitest", "run", ...TESTS, "--reporter=json", "--outputFile=" + path.join(repo, ".mut-result.json")], { cwd: repo, encoding: "utf8", shell: process.platform === "win32" });
  let failed = [];
  let typeError = null;
  try {
    const j = JSON.parse(readFileSync(path.join(repo, ".mut-result.json"), "utf8"));
    for (const tf of j.testResults) {
      for (const a of tf.assertionResults) if (a.status === "failed") failed.push(`${path.basename(tf.name)}::${a.title}`);
      if (tf.status === "failed" && tf.assertionResults.length === 0) failed.push(`${path.basename(tf.name)}::(file failed to load: ${String(tf.message).slice(0, 120)})`);
    }
  } catch (e) { typeError = String(e.message).slice(0, 120); }
  git("checkout", "--", m.file);
  const restored = readFileSync(f, "utf8") === orig;
  if (!restored) throw new Error(`${m.id}: restore failed`);
  const killed = r.status !== 0 && failed.length > 0;
  results.push({ id: m.id, what: m.what, file: m.file, exit: r.status, killed, killers: failed.slice(0, 8), killer_count: failed.length, seconds: Math.round((Date.now() - t0) / 1000), note: typeError });
  console.log(`${m.id} ${killed ? "KILLED" : "SURVIVED"} exit=${r.status} killers=${failed.length} ${failed[0] ?? ""}`);
}
writeFileSync(out, JSON.stringify({ repo_head: git("rev-parse", "HEAD").trim(), tests: TESTS, results }, null, 1));
const surv = results.filter((r) => !r.killed);
console.log(`killed ${results.length - surv.length}/${results.length}${surv.length ? "; SURVIVORS: " + surv.map((s) => s.id).join(", ") : ""}`);
