// Auditor (S8-18, T8-30…T8-37): live checks of Stage 8 against the deployed site.
// The access code (LIVE_ACCESS_CODE), the key (MODEL_API_KEY) and the base URL (MODEL_BASE_URL) are read from the
// environment and are NEVER printed or written: every saved body and the log are checked against the code, its
// SHA-256, the key, its SHA-256 and the base-URL host+path before writing, and a save that would contain one is refused.
//   node live_s8.mjs <site> <repo> <pushed-commit> <out-dir> checks
//   node live_s8.mjs <site> <repo> <pushed-commit> <out-dir> read <model-id> [ack]
// "checks" makes no reading: GETs, refusals that must be refused before any model call, and direct GET /models + GET
// /usage reads at the endpoint (the auditor's lease, L-C4). "read" makes exactly one live reading of the sample cg-004.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const [site0, repo, commit, out, mode, readModel, ackArg] = process.argv.slice(2);
const site = site0.replace(/\/$/, "");
mkdirSync(out, { recursive: true });
const CODE = (process.env.LIVE_ACCESS_CODE || "").trim(), KEY = process.env.MODEL_API_KEY || "", BASE = (process.env.MODEL_BASE_URL || "").replace(/\/$/, "");
if (!CODE || !KEY || !BASE) { console.error("LIVE_ACCESS_CODE / MODEL_API_KEY / MODEL_BASE_URL missing (names only)"); process.exit(2); }
const sha = (b) => createHash("sha256").update(b).digest("hex");
const hostpath = BASE.split("://")[1] || "";
const SECRETS = [CODE, sha(CODE), KEY, sha(KEY), ...(hostpath.includes("/") ? [hostpath] : [])];
const leaks = [];
let exchanges = 0;
const log = [];
const now = () => new Date().toISOString();
const clean = (s) => { for (const x of SECRETS) if (x && s.includes(x)) throw new Error("refusing to write: a secret value would be written"); return s; };
const say = (s) => { clean(s); log.push(s); console.log(s); };
const save = (name, obj) => writeFileSync(path.join(out, name), clean(JSON.stringify(obj, null, 1)));
async function http(method, p, { body, headers = {}, url } = {}) {
  const u = url ?? site + p;
  const init = { method, headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers } };
  if (body !== undefined) init.body = typeof body === "string" ? body : JSON.stringify(body);
  const r = await fetch(u, init);
  const buf = Buffer.from(await r.arrayBuffer());
  exchanges++;
  const blob = buf.toString("latin1") + JSON.stringify([...r.headers]);
  // The endpoint's own replies (direct reads with the key) are not site responses; only site responses are scanned.
  if (!url) for (const x of SECRETS) if (x && blob.includes(x)) leaks.push(`${method} ${p}`);
  let json = null; try { json = JSON.parse(buf.toString("utf8")); } catch { /* not JSON */ }
  return { status: r.status, json, buf, headers: r.headers };
}
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { maxBuffer: 1 << 26 });
const lower = (s) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());
const same = (id, other) => { const a = lower(id), b = lower(other); if (a === b) return true; const i = b.indexOf("/"); return i > 0 && b.indexOf("/", i + 1) < 0 && b.slice(i + 1) === a; };
const directModels = async () => { const r = await http("GET", "", { url: BASE + "/models", headers: { authorization: "Bearer " + KEY } }); return { at: now(), status: r.status, ids: (r.json?.data ?? []).map((m) => m.id) }; };
const directUsage = async () => { const r = await http("GET", "", { url: BASE + "/usage", headers: { authorization: "Bearer " + KEY } }); const b = r.json ?? {}; return { at: now(), status: r.status, daily_cost_used_usd: b.daily_cost_used_usd, total_requests: b.total_requests ?? b.requests ?? null, keys: Object.keys(b) }; };
const statusN = async (n) => { const xs = []; for (let i = 0; i < n; i++) { const s = (await http("GET", "/api/live/status")).json ?? {}; xs.push({ used: s.used_this_hour, cf_client: s.code_failures_this_hour_this_client, cf_global: s.code_failures_this_hour_global }); } return xs; };
const MEASURED = ["Qwen3.8-27B", "Gemma-4-31B-IT"];
const EXPERIMENTAL = ["DeepSeek-V4.1-Flash", "DeepSeek-V4-Flash-Vision-Exp", "MiMo-V2.6-Flash", "Qwen3.8-Flash-Next"];
const LIVE_MODELS = [...MEASURED, ...EXPERIMENTAL];

const remote = execFileSync("git", ["ls-remote", "https://github.com/hvaler/certgate", "refs/heads/main"]).toString().split(/\s/)[0];
say(`S8-18 ${mode} on ${site} at ${now()}; GitHub main ${remote}; expected pushed commit ${commit}: ${remote === commit ? "EQUAL" : "DIFFERENT"}`);

// sample cg-004 with its own delivery note, from the pushed commit
const cert = git("show", `${commit}:data/cases/cg-004/certificate.pdf`);
const kase = JSON.parse(git("show", `${commit}:data/cases/cg-004/case.json`).toString());
const csv = git("show", `${commit}:data/${kase.delivery_note}`).toString("utf8");
const jobBody = (model, ack) => ({ certificate_base64: cert.toString("base64"), delivery_csv: csv, delivery_line: kase.delivery_line, synthetic_confirmed: true, ...(model !== undefined ? { model } : {}), ...(ack !== undefined ? { not_evaluated_acknowledged: ack } : {}) });
const WITH_CODE = { "x-live-access-code": CODE };

if (mode === "checks") {
  // T8-30 identity and served files
  for (const f of ["index.html", "app.js", "labels.js", "styles.css", "figures.json", "stories/cg-003.json"]) {
    const r = await http("GET", "/" + f);
    const committed = git("show", `${commit}:public/${f}`);
    say(`T8-30 /${f} ${r.status} ${sha(r.buf) === sha(committed) ? "MATCH" : "DIFF"} ${sha(r.buf).slice(0, 16)}`);
  }
  const h = await http("GET", "/health"); say(`T8-30 /health ${h.status} status=${h.json?.status} reader=${h.json?.reader}`);
  const f1 = await http("GET", "/api/f1"); save("f1.json", f1.json); say(`T8-30 /api/f1 ${f1.status} state=${f1.json?.state} checked_at=${f1.json?.checked_at}`);
  const ev = await http("POST", "/api/stories/cg-003/evaluate", { body: {} }); say(`T8-30 cg-003 evaluate ${ev.status} proposal=${ev.json?.view?.proposal?.proposal ?? ev.json?.view?.proposal} recorded=${ev.json?.view?.recorded}`);

  // T8-31 listing at the moment: direct read, site status, direct read
  const d1 = await directModels();
  const st = await http("GET", "/api/live/status"); save("status.json", st.json);
  const d2 = await directModels();
  save("models-direct.json", { before: d1, after: d2 });
  const m = st.json?.models;
  say(`T8-31 direct GET /models ${d1.at}: ${d1.ids.length} ids; ${d2.at}: ${d2.ids.length} ids; equal=${JSON.stringify(d1.ids) === JSON.stringify(d2.ids)}`);
  say(`T8-31 status ${st.status}: enabled=${st.json?.enabled} code_required=${st.json?.access_code_required} reason=${st.json?.reason}; models.checked_at=${m?.checked_at} default=${m?.default} selectable=${m?.selectable}`);
  const shownMeasured = (m?.measured ?? []).map((x) => ({ id: x.id, enabled: x.enabled, state: x.state }));
  const shownExp = (m?.experimental ?? []).map((x) => ({ id: x.id, enabled: x.enabled, state: x.state, label: x.label }));
  const shownC = (m?.listed_not_offered ?? []).map((x) => ({ id: x.id, reason: x.reason }));
  say(`T8-31 measured: ${JSON.stringify(shownMeasured)}`);
  say(`T8-31 experimental: ${JSON.stringify(shownExp)}`);
  say(`T8-31 listed-not-offered: ${JSON.stringify(shownC)} not_shown=${m?.not_shown}`);
  const listed = d1.ids;
  const isListed = (id) => listed.some((l) => same(id, l));
  const problems = [];
  for (const x of shownMeasured) { if (!MEASURED.includes(x.id)) problems.push(`measured group holds ${x.id}`); if (x.enabled !== isListed(x.id)) problems.push(`measured ${x.id} enabled=${x.enabled} but listed=${isListed(x.id)}`); }
  for (const x of shownExp) { if (!EXPERIMENTAL.includes(x.id)) problems.push(`experimental group holds ${x.id}`); if (x.enabled !== isListed(x.id)) problems.push(`experimental ${x.id} enabled=${x.enabled} but listed=${isListed(x.id)}`); if (!/not evaluated/.test(x.label ?? "")) problems.push(`experimental ${x.id} without label`); }
  const claimed = (l) => MEASURED.some((id) => same(id, l)) || shownExp.some((x) => same(x.id, l));
  const expectedC = listed.filter((l) => !claimed(l)).sort();
  const gotC = shownC.map((x) => x.id).sort();
  if (JSON.stringify(expectedC) !== JSON.stringify(gotC)) problems.push(`(c) ${JSON.stringify(gotC)} != listed others ${JSON.stringify(expectedC)}`);
  if (m?.default && !MEASURED.includes(m.default)) problems.push(`default ${m.default} is not measured`);
  const offered = [...shownMeasured, ...shownExp].filter((x) => x.enabled).map((x) => x.id);
  for (const id of offered) if (!LIVE_MODELS.includes(id)) problems.push(`offered ${id} outside measured ∪ probed ∩ LIVE_MODELS`);
  say(`T8-31/T8-32 offered now: ${JSON.stringify(offered)}; group problems: ${problems.length} ${JSON.stringify(problems)}`);

  // T8-33 refusals with the correct code, without spending the limit
  const minute = new Date().getUTCMinutes();
  say(`T8-33 UTC minute ${minute} (must be 3..56 to stay inside one hour)`);
  const u0 = await directUsage();
  const before = await statusN(5);
  const cases = [];
  const cId = shownC.find((x) => !/…|truncated/.test(x.id))?.id ?? null;
  cases.push(["outside the offer (unknown id)", jobBody("Llama-3.3-70B-Instruct"), "model_not_offered"]);
  if (cId) cases.push([`outside the offer (listed, group c: ${cId})`, jobBody(cId), "model_not_offered"]);
  const unlistedOffered = [...shownMeasured, ...shownExp].find((x) => !x.enabled && !/not enabled/.test(x.state))?.id ?? null;
  if (unlistedOffered) cases.push([`offered but unlisted (${unlistedOffered})`, jobBody(unlistedOffered, true), "model_unlisted"]);
  const expOn = shownExp.find((x) => x.enabled)?.id ?? null;
  if (expOn) { cases.push([`experimental ${expOn} without the acknowledgement`, jobBody(expOn), "model_ack_required"]); cases.push([`experimental ${expOn} with "true" (string)`, jobBody(expOn, "true"), "model_ack_required"]); }
  cases.push(["no model", jobBody(), "model_missing"]);
  for (const [name, body, want] of cases) {
    const r = await http("POST", "/api/live/jobs", { body, headers: WITH_CODE });
    say(`T8-33 ${name}: ${r.status} reason_class=${r.json?.reason_class} (want ${want}) ${r.json?.reason_class === want ? "OK" : "WRONG"} job_id=${r.json?.job_id ?? "none"}`);
  }
  const after = await statusN(5);
  const u1 = await directUsage();
  save("t833-counts.json", { before, after, usage_before: u0, usage_after: u1 });
  const flat = (xs) => JSON.stringify(xs.map((x) => [x.used, x.cf_client, x.cf_global]));
  say(`T8-33 status x5 before ${flat(before)} after ${flat(after)}: ${new Set([...before, ...after].map((x) => JSON.stringify(x))).size === 1 ? "ALL EQUAL" : "CHANGED"}`);
  say(`T8-33 /usage daily_cost ${u0.daily_cost_used_usd} -> ${u1.daily_cost_used_usd}; requests ${u0.total_requests} -> ${u1.total_requests}`);

  // T8-37 legacy route
  for (const b of [jobBody(), jobBody("Qwen3.8-27B")]) { const r = await http("POST", "/api/live/read", { body: b, headers: WITH_CODE }); say(`T8-37 POST /api/live/read ${b.model ? "with model" : "without model"}: ${r.status} ${String(r.json?.error ?? "").slice(0, 90)}`); }
  // no code, for completeness of the refusal story (spends one failure unit of the 2 allowed)
}

if (mode === "read") {
  const ack = ackArg === "ack" ? true : undefined;
  const u0 = await directUsage();
  const d0 = await directModels();
  const before = await statusN(5);
  say(`T8-34 ${readModel}: listed by direct GET /models at ${d0.at}: ${d0.ids.some((l) => same(readModel, l))}; usage before ${u0.daily_cost_used_usd}; used ${before.map((x) => x.used).join(",")}`);
  const t0 = Date.now();
  const p = await http("POST", "/api/live/jobs", { body: jobBody(readModel, ack), headers: WITH_CODE });
  save(`read-${readModel}-post.json`, p.json);
  say(`T8-34 POST ${p.status} ${JSON.stringify({ job_id: p.json?.job_id, state: p.json?.state, model_requested: p.json?.model_requested, model_group: p.json?.model_group, evaluated: p.json?.evaluated, listing_checked_at: p.json?.listing_checked_at, reason_class: p.json?.reason_class })}`);
  let v = null; const states = []; let last = "";
  if (p.status === 202) {
    while (Date.now() - t0 < 320_000) {
      await new Promise((r) => setTimeout(r, 2000));
      v = (await http("GET", p.json.poll)).json;
      const k = `${v?.state}/${v?.position ?? ""}`;
      if (k !== last) { states.push(`${Math.round((Date.now() - t0) / 1000)}s ${k}`); last = k; }
      if (v?.state === "done" || v?.state === "failed") break;
    }
  }
  save(`read-${readModel}-final.json`, v);
  say(`T8-34 states: ${states.join(" | ")}; final state=${v?.state} reason_class=${v?.reason_class ?? null}`);
  if (v?.state === "done") {
    const rc = v.result.view.receipt, mc = rc.model_choice ?? {}, f = rc.f1 ?? {};
    say(`T8-34 receipt: reading_source=${rc.reading_source} recorded=${v.result.view.recorded ?? null} reader.model_id=${rc.reader?.model_id} requested=${rc.reader?.requested_model_id} proposal=${rc.proposal?.proposal ?? rc.proposal}`);
    say(`T8-34 model_choice: ${JSON.stringify(mc)}`);
    say(`T8-34 F1 copy: state=${f.state} model_requested=${f.model_requested} model_reported=${f.model_reported} model_evaluated=${f.model_evaluated} model_probe_evidence=${f.model_probe_evidence ?? null} checked_at=${f.checked_at}`);
    say(`T8-34 identity: requested ${mc.requested} reported ${mc.reported} strict-same=${same(String(mc.requested), String(mc.reported))}`);
    const html = JSON.stringify(v.result.view);
    say(`T8-34 figures next to it: ${/0 of 18|figures of record|0\.00020/.test(html) ? "PRESENT" : "none"}`);
  }
  await new Promise((r) => setTimeout(r, 3000));
  const after = await statusN(5);
  const u1 = await directUsage();
  save(`read-${readModel}-counts.json`, { before, after, usage_before: u0, usage_after: u1 });
  say(`T8-34 used before ${before.map((x) => x.used).join(",")} after ${after.map((x) => x.used).join(",")}; usage delta ${(Number(u1.daily_cost_used_usd) - Number(u0.daily_cost_used_usd)).toFixed(10)}; reply cost ${v?.result?.view?.receipt?.endpoint_response?.usage?.cost ?? v?.result?.view?.receipt?.f1?.cost ?? "see final.json"}`);
}

say(`T8-36 secret scan over ${exchanges} exchanges (site bodies and headers; code, SHA-256(code), key, SHA-256(key), base-URL host+path): ${leaks.length} hit(s) ${JSON.stringify(leaks)}`);
writeFileSync(path.join(out, `live-${mode}${readModel ? "-" + readModel : ""}.log`), clean(log.join("\n") + "\n"));
