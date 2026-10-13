// CertGate web UI. Plain browser JavaScript, same-origin requests only. Every value from a document or the
// server is inserted as text (textContent), never as HTML (B-16). Counters, remaining live readings and
// times come only from the server (B-02, B-15). New cases are kept in this browser's storage (F4).
"use strict";

const { readingText, storyLabelDetail, localLabelDetail, releaseAllowed } = window.CertGateLabels;

const STORE_PREFIX = "certgate.case.";
const $view = () => document.getElementById("view");

/** h("div", {class: "x", onclick}, "text", child) builds DOM without any HTML parsing. */
function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

async function api(path, options) {
  const res = await fetch(path, { cache: "no-store", ...(options || {}) });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { ok: res.ok, status: res.status, body };
}

const post = (path, data) => api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });

function render(...nodes) {
  const v = $view();
  v.replaceChildren(...nodes);
  window.scrollTo(0, 0);
}

const PROPOSAL_TITLE = {
  review: "Review — CertGate will not propose release",
  block: "Block — the batch does not meet the spec",
  release: "Release proposed — a person decides",
};

function badge(text, kind) { return h("span", { class: `badge ${kind || ""}` }, text); }

// ---------------------------------------------------------------- endpoint pill and F1 panel (S2-11, S2-12)
let lastF1 = null;
async function refreshF1() {
  const r = await api("/api/f1");
  lastF1 = r.body;
  const text = document.getElementById("endpoint-text");
  const dot = document.querySelector("#endpoint-pill .dot");
  if (!r.ok || !r.body) { text.textContent = "Model endpoint: status unknown"; return lastF1; }
  const on = r.body.state === "on";
  dot.classList.toggle("on", on);
  text.textContent = on
    ? `Model endpoint: on · ${r.body.model_ids.join(", ") || "no model listed"} · checked ${r.body.checked_at}`
    : `Model endpoint: off · last check ${r.body.checked_at}`;
  return lastF1;
}

function f1Panel(f1, title, note) {
  const v = (x) => (x === null || x === undefined || x === "" ? "unknown" : String(x));
  const state = f1.state === "on" ? "ENDPOINT ON" : f1.state === "off" ? "ENDPOINT OFF"
    : f1.state === "not_captured_in_evaluation_run" ? "F1 NOT CAPTURED AT READING TIME" : "NOT APPLICABLE · MOCK";
  return h("aside", { class: "card side stack", id: "f1", "aria-labelledby": "f1-title" },
    h("div", { class: "btns between" }, h("h2", { id: "f1-title" }, title), badge(state)),
    h("p", { class: "muted small" }, note),
    h("dl", { class: "kv" },
      h("dt", {}, "State"), h("dd", {}, `${f1.state} · ${f1.detail}`),
      h("dt", {}, "Checked at"), h("dd", {}, v(f1.checked_at)),
      h("dt", {}, "Endpoint"), h("dd", {}, f1.endpoint_name ? `${f1.endpoint_name} · ${v(f1.endpoint_host)}` : v(f1.endpoint_host)),
      h("dt", {}, "Model(s) listed"), h("dd", {}, f1.model_ids && f1.model_ids.length ? f1.model_ids.join(", ") : "none"),
      h("dt", {}, "Model (as reported)"), h("dd", {}, v(f1.model_reported)),
      h("dt", {}, "GPU"), h("dd", {}, v(f1.gpu)),
      h("dt", {}, "ROCm · vLLM"), h("dd", {}, `${v(f1.rocm_version)} · ${v(f1.vllm_version)}`),
      h("dt", {}, "Probe latency (ms)"), h("dd", {}, v(f1.latency_ms)),
      h("dt", {}, "Last reading (ms)"), h("dd", {}, v(f1.last_reading_ms)),
      h("dt", {}, "Tokens (completion · total)"), h("dd", {}, `${v(f1.completion_tokens)} · ${v(f1.total_tokens)}`),
      h("dt", {}, "Tokens / s"), h("dd", {}, v(f1.tokens_per_second)),
      h("dt", {}, "Cost"), h("dd", {}, `${v(f1.cost_reported)} · ${f1.cost_label || "cost reported by the endpoint"}`),
      h("dt", {}, "Rate limit (req/min · remaining)"), h("dd", {}, `${v(f1.rate_limit_rpm)} · ${v(f1.rate_limit_rpm_remaining)}`),
      h("dt", {}, "Daily spend (limit · used · remaining)"), h("dd", {}, `${v(f1.daily_spend_limit)} · ${v(f1.daily_spend_used)} · ${v(f1.daily_spend_remaining)}`),
      h("dt", {}, "Read from"), h("dd", {}, `${v(f1.usage_source)}${f1.probe_cached ? " · probe cached (at most one probe per 60 s)" : ""}`),
    ),
  );
}

// ---------------------------------------------------------------- landing (S2-01, S2-30) and judge mode (F2)
async function landing(focus) {
  const [stories, status, figs] = await Promise.all([api("/stories/index.json"), api("/api/live/status"), api("/figures.json")]);
  const list = (stories.body && stories.body.stories) || [];
  const fg = figs.ok ? figs.body : null;
  const model = fg && fg.model_reported && fg.model_reported.length ? fg.model_reported.join(", ") : "the configured model";
  const hero = h("section", { class: "card stack", "aria-labelledby": "hero" },
    h("div", { class: "eyebrow" }, "FOR QUALITY ENGINEERS RECEIVING CERTIFIED STEEL"),
    h("h1", { id: "hero" }, "Catch the out-of-spec batch before it enters production"),
    h("p", {}, "Every batch of steel arrives with a mill certificate. Someone in Quality checks it by hand against the purchase spec: different mills, different layouts, often scanned. CertGate puts every value next to the spec and its place in the document, and proposes release, block or review. ",
      h("strong", {}, "A person decides.")),
    h("p", { class: "note" }, "Where AMD fits: each certificate page is read, as an image, by the open model ", h("strong", {}, model),
      " (as reported by the endpoint), served by AMD Token Factory. The model only reads; it never explains or decides. GPU, ROCm and vLLM versions are not exposed by the endpoint, so none is claimed here."),
    h("div", { class: "btns" },
      h("a", { class: "btn primary", href: "#/story/cg-003" }, "See the case it refuses to release"),
      h("a", { class: "btn", href: "#/judge" }, "All three recorded runs")),
  );
  const figures = fg ? h("section", { class: "card stack", "aria-labelledby": "figs" },
    h("h2", { id: "figs", class: "eyebrow" }, `MEASURED ON ${fg.evaluated_cases} FICTITIOUS CERTIFICATES · REAL MODEL`),
    h("div", { class: "figures", "data-figures": "evaluation" },
      fig(`${fg.false_conforming.broad.n} of ${fg.false_conforming.broad.of}`, `false conforming (released when the expected proposal was not release) · strict: ${fg.false_conforming.strict.n} of ${fg.false_conforming.strict.of} expected block`),
      fig(`${fg.non_conformities_caught.n} / ${fg.non_conformities_caught.of}`, `non-conformities caught (not released) · ${fg.non_conformities_caught.blocked} blocked`),
      fig(`${fg.seconds_per_certificate.mean} s`, `seconds per certificate · mean, median ${fg.seconds_per_certificate.median} s · N = ${fg.seconds_per_certificate.n} processed`),
      fig(fg.cost_per_certificate.mean === null ? "unknown" : fg.cost_per_certificate.mean, `cost per certificate · mean over N = ${fg.cost_per_certificate.n} · ${fg.cost_per_certificate.label}`)),
    h("p", { class: "muted small" }, `Generated from the evaluation artifacts in ${fg.generated_from} (candidate ${String(fg.candidate_commit).slice(0, 7)}, run ${fg.run_started_utc}); cases ${fg.excluded_cases.join(", ")} were used to tune the prompt and are excluded. Failures: ${fg.failures.n} of ${fg.failures.of}.`),
  ) : h("section", { class: "card stack", "aria-labelledby": "figs" },
    h("h2", { id: "figs", class: "eyebrow" }, "EVALUATION FIGURES"),
    h("p", { class: "muted small" }, "No evaluation figures are available in this build."));
  const judge = h("section", { class: "stack", id: "judge", "aria-labelledby": "judge-title" },
    h("h2", { id: "judge-title" }, "Judge mode · three recorded real runs"),
    h("p", { class: "muted" }, "Real readings by the model, recorded with their receipt and endpoint data, and stored. They are not re-read live. Judge mode has no limit and makes no model call."),
    h("div", { class: "cards" }, list.map((s) => h("a", { class: "card story", href: `#/story/${s.id}` },
      badge(s.proposal === "release" ? "RELEASE PROPOSED" : s.proposal.toUpperCase(), s.proposal),
      h("strong", {}, s.title),
      h("span", { class: "muted small" }, s.kind),
      h("span", { class: "small mono" }, `${s.id} · recorded real reading · ${s.model_reported || "model not reported"} · ${s.stored_at} · not live`)))),
  );
  const nodes = [hero, figures, judge, await liveSection(status.body), explainSection()];
  render(...nodes);
  if (focus) document.getElementById(focus)?.scrollIntoView();
}

function fig(val, label) {
  return h("div", { class: "figure" }, h("div", { class: "val" }, val), h("div", { class: "small" }, label));
}

function explainSection() {
  return h("section", { class: "card stack", "aria-labelledby": "who" },
    h("h2", { id: "who" }, "What decides, what reads, who signs"),
    h("p", {}, h("strong", {}, "The model"), " reads the certificate page images and reports each value with the place it says it found it (as reported by the model). It never explains and never decides."),
    h("p", {}, h("strong", {}, "The text layer"), ", read without any model, checks the critical fields when the PDF has one."),
    h("p", {}, h("strong", {}, "Versioned rules"), " compare each value with spec ESP-014 in exact decimals."),
    h("p", {}, h("strong", {}, "A person"), " releases, blocks or asks for a new certificate."));
}

async function liveSection(st) {
  await refreshF1();
  const on = lastF1 && lastF1.state === "on";
  const msg = h("p", { class: "small", id: "live-msg", role: "status" });
  const pdf = h("input", { id: "live-pdf", type: "file", accept: "application/pdf" });
  const csv = h("input", { id: "live-csv", type: "file", accept: ".csv,text/csv" });
  const line = h("input", { id: "live-line", type: "text", inputmode: "numeric", placeholder: "e.g. 1" });
  const code = st && st.access_code_required ? h("input", { id: "live-code", type: "password", autocomplete: "off" }) : null;
  const exhausted = st && st.enabled && st.remaining_this_hour === "0";
  const canRead = !!(st && st.enabled && !exhausted);
  const confirm = h("input", { id: "live-confirm", type: "checkbox" });
  const btn = h("button", { class: "btn primary", type: "button", disabled: !canRead, onclick: () => doLiveRead(pdf, csv, line, code, confirm, msg, btn) }, "Read live");
  const why = !st ? "Live status unavailable."
    : st.deployed_site && !st.enabled ? `${st.reason}.`
    : !st.enabled ? "Live reading is disabled on this server (no hourly limit configured)."
    : exhausted ? `Live readings for this hour are used up. Read live reopens at ${st.reopens_at}.`
    : on ? "The model endpoint is up." : "The model endpoint is off right now: a reading would not happen, and nothing is counted.";
  return h("section", { class: "card stack", id: "live", "aria-labelledby": "live-title" },
    h("div", { class: "btns between" }, h("h2", { id: "live-title" }, "Read a certificate live"), badge("LIVE · needs the model endpoint")),
    h("p", { class: "muted" }, on ? "" : "When the endpoint is off, live reading opens during the announced windows: ",
      on ? "" : h("strong", {}, st && st.windows ? st.windows : "no live window is announced"), on ? "" : ". The three recorded runs work at any time."),
    h("div", { class: "row" },
      h("div", { class: "field" }, h("label", { for: "live-pdf" }, "Mill certificate (PDF)"), pdf),
      h("div", { class: "field" }, h("label", { for: "live-csv" }, "Delivery note (CSV)"), csv),
      h("div", { class: "field" }, h("label", { for: "live-line" }, "Delivery note line (partida)"), line),
      code ? h("div", { class: "field" }, h("label", { for: "live-code" }, "Access code for live reading"), code) : null),
    h("p", { class: "small" }, "Live readings are limited to ", h("strong", {}, st ? st.limit_per_hour : "?"), " per hour for everyone, counted on the server, per server instance in this build. Remaining this hour: ",
      h("strong", { id: "live-remaining" }, st ? st.remaining_this_hour : "?"), ". Judge mode has no limit."),
    h("p", { class: "small" }, "What can be read live here: ", h("strong", {}, st ? st.upload_policy : "?"), "."),
    h("p", { class: "note", id: "live-notice" }, st ? st.notice : ""),
    h("label", { class: "check", for: "live-confirm" }, confirm, h("span", {}, "I have read the notice: the file is synthetic and may be sent to AMD Token Factory.")),
    h("p", { class: "small" }, why),
    h("div", { class: "btns" }, btn), msg);
}

function readFileAs(file, kind) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    if (kind === "base64") r.readAsDataURL(file); else r.readAsText(file);
  });
}

async function doLiveRead(pdf, csv, line, code, confirm, msg, btn) {
  msg.textContent = "";
  if (!pdf.files[0]) { msg.textContent = "Choose a certificate PDF first."; return; }
  if (!confirm.checked) { msg.textContent = "Confirm the notice first: the file goes to a third-party service and must be synthetic."; return; }
  btn.disabled = true;
  msg.textContent = "Sending… the server checks the file, the endpoint and the limit. A real reading takes about one to four minutes.";
  try {
    const dataUrl = await readFileAs(pdf.files[0], "base64");
    const body = {
      certificate_base64: String(dataUrl).split(",")[1] || "",
      delivery_csv: csv.files[0] ? await readFileAs(csv.files[0], "text") : null,
      delivery_line: line.value.trim() || null,
      access_code: code ? code.value : undefined,
      synthetic_confirmed: confirm.checked,
    };
    const r = await post("/api/live/read", body);
    if (!r.ok) {
      msg.textContent = `${r.body && r.body.error ? r.body.error : `Rejected (${r.status})`}${r.body && r.body.reopens_at ? `. Reopens at ${r.body.reopens_at}.` : ""}`;
      btn.disabled = false;
      return;
    }
    const key = `${r.body.view.case_id}-${r.body.view.receipt.run_id}`;
    saveLocal(key, r.body.view);
    location.hash = `#/local/${key}`;
  } catch (e) {
    msg.textContent = "The request failed.";
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------- browser-held cases (F4, B-09, B-21)
function saveLocal(key, view) {
  try { localStorage.setItem(STORE_PREFIX + key, JSON.stringify({ kept_at_receipt_time: view.receipt.created_at, view, decision: null })); } catch { /* storage full or blocked */ }
}
function loadLocal(key) {
  try { return JSON.parse(localStorage.getItem(STORE_PREFIX + key) || "null"); } catch { return null; }
}

// ---------------------------------------------------------------- case file (S2-02 .. S2-05, S2-10)
const RESULT_TEXT = { pass: "✓ Pass", fail: "✗ Fail", unknown: "UNKNOWN", info: "info" };

function caseFile(view, ctx) {
  const rc = view.receipt;
  const top = h("section", { class: "row between", "aria-labelledby": "case-title" },
    h("div", { class: "stack tight" },
      h("div", { class: "small mono muted" }, `Case ${view.case_id}${view.delivery ? ` · Delivery note ${view.delivery.delivery_note} · line ${view.delivery.line}` : " · no paired delivery line"}`),
      h("h1", { id: "case-title" }, `Certificate ${view.certificate.certificate_no || "unknown"} · heat ${view.certificate.heat || "unknown"}`),
      h("div", { class: "muted" }, [view.certificate.issuer, view.certificate.dimensions, view.certificate.kind].filter(Boolean).join(" · "))),
    h("div", { class: "stored", "data-stored-label": "true" }, h("strong", {}, ctx.storedTitle), ` · ${ctx.storedDetail}`),
  );
  const prop = h("section", { class: `proposal ${view.proposal}`, "aria-labelledby": "proposal" },
    h("div", { class: "eyebrow" }, "CERTGATE PROPOSES"),
    h("h2", { id: "proposal" }, PROPOSAL_TITLE[view.proposal] || view.proposal),
    view.status === "error" ? h("p", {}, "The reading failed: no value was read, nothing is guessed, and no positive proposal is made.") : null,
    h("ul", {}, view.reasons.map((r) => h("li", {}, h("span", { class: "mono small" }, r.code), ` — ${r.detail}`))),
    view.reasons.length === 0 ? h("p", {}, "No rule fails and no review trigger holds. A person in Quality still decides.") : null,
  );
  const steps = h("section", { class: "card stack", "aria-labelledby": "steps-title" },
    h("div", { class: "btns between" }, h("h2", { id: "steps-title" }, "Steps of this run"), badge(view.reading_label)),
    h("ol", { class: "steps" }, view.steps.map((s) => h("li", {},
      h("span", { class: "name" }, s.name), badge(s.status.replace("_", " ")),
      h("span", { class: "mono small" }, s.duration_ms !== null ? `${s.duration_ms} ms` : "—"),
      h("span", { class: "muted small full" }, s.note)))),
    h("p", { class: "muted small" }, "Durations are the measured timings of this run, from its receipt."),
  );
  const table = h("section", { class: "card stack grow", "aria-labelledby": "values" },
    h("div", { class: "btns between" },
      h("h2", { id: "values" }, `Values against purchase spec ${rc.spec.spec_id} rev. ${rc.spec.revision}`),
      h("span", { class: "muted small" }, `${view.counts.checks} critical fields · ${view.counts.pass} pass · ${view.counts.unknown} unknown · ${view.counts.fail} fail`)),
    h("div", { class: "tablebox" }, h("table", {},
      h("thead", {}, h("tr", {}, ["FIELD", "READ", "CHANNELS", "SPEC", "SOURCE", "RESULT"].map((x) => h("th", { scope: "col" }, x)))),
      h("tbody", {}, view.rows.map((r) => h("tr", { class: r.result === "unknown" ? "hl" : r.result === "fail" ? "hl-fail" : "" },
        h("th", { scope: "row" }, r.label),
        h("td", {}, r.state === "known" ? `${r.value}${r.unit ? ` ${r.unit}` : ""}` : r.state === "absent" ? "absent (not on the document)" : "unknown"),
        h("td", {}, channelText(r)),
        h("td", {}, r.spec),
        h("td", {}, r.source),
        h("td", { class: `res-${r.result}` }, RESULT_TEXT[r.result])))))),
    h("div", { class: "note" }, h("strong", {}, "Reading channels. "),
      view.reading_label, ". Text layer: ", view.certificate.kind.startsWith("digital") ? "available (read without any model)." : h("strong", {}, "not available (scan)."),
      view.human_confirmation_required.length ? ` Without a second channel, ${view.human_confirmation_required.length} critical fields need a person to confirm them on the original.` : ""),
  );
  const expl = h("section", { class: "card stack", "aria-labelledby": "expl-title" },
    h("h2", { id: "expl-title" }, "Explanation"),
    view.explanation.available ? h("p", {}, view.explanation.text) : null,
    h("p", { class: "muted small" }, view.explanation.note));
  return [top, prop, steps, h("div", { class: "row" }, table, f1Panel(rc.f1, "Runs on AMD", "Copy of the endpoint data at reading time, stored in the receipt. Never typed by hand.")), expl];
}

function channelText(r) {
  switch (r.channels) {
    case "agree": return "model and text layer agree";
    case "disagree": return `disagree: model ${r.model_value ?? "—"} · text layer ${r.text_layer_value ?? "—"}`;
    case "text_layer_missing": return `text layer has no value (model ${r.model_value ?? "—"})`;
    case "text_layer_conflict": return "text layer states several values";
    case "no_second_channel": return "one channel only (scan): needs confirmation";
    case "human_confirmed": return `confirmed by a person (read ${r.model_value ?? "unknown"})`;
    default: return "—";
  }
}

// ---------------------------------------------------------------- confirmations and decision (S2-04, A-21, B-14, B-15)
function decisionForm(view, onSubmit, opts) {
  const who = h("input", { id: "who", type: "text", placeholder: "[Name] · Quality", autocomplete: "off" });
  const why = h("textarea", { id: "why", rows: "3", placeholder: "What you checked and why you decide this" });
  const msg = h("p", { class: "small", role: "status" });
  const go = (action) => async () => {
    msg.textContent = "";
    if (!who.value.trim() || !why.value.trim()) { msg.textContent = "Name and reason are required."; return; }
    msg.textContent = await onSubmit({ action, decided_by: who.value.trim(), reason: why.value.trim() });
  };
  const releaseOk = releaseAllowed(view);
  return h("section", { class: "card stack", "aria-labelledby": "decide" },
    h("h2", { id: "decide" }, "Decision · a person decides"),
    h("p", { class: "muted small" }, "CertGate proposes; it never releases material. Your name and reason go into the receipt.", opts.clientTime ? " This case is held in your browser: the decision is recorded with your browser's time, not verified by a server." : " The time is stamped by the server."),
    h("div", { class: "row" }, h("div", { class: "field" }, h("label", { for: "who" }, "Your name and role"), who)),
    h("div", { class: "field" }, h("label", { for: "why" }, "Reason"), why),
    h("div", { class: "btns" },
      h("button", { class: "btn block", type: "button", onclick: go("block") }, "Block batch"),
      h("button", { class: "btn", type: "button", onclick: go("request_new_certificate") }, "Request new certificate"),
      h("button", { class: "btn", type: "button", id: "release-btn", disabled: !releaseOk, "aria-describedby": "release-note", onclick: go("release") }, "Release batch")),
    h("p", { id: "release-note", class: "muted small" }, releaseOk ? "Release is available because the current proposal is release." : "Release is not offered while the proposal is not release. For a scan, every critical field must first be confirmed on the original."),
    msg);
}

function confirmForm(view, onConfirm) {
  const fields = view.rows.filter((r) => r.critical);
  const inputs = fields.map((r) => ({ r, input: h("input", { id: `c-${r.field}`, type: "text", placeholder: r.state === "known" ? `read: ${r.value}` : "unknown: read the original" }) }));
  const by = h("input", { id: "confirm-by", type: "text", placeholder: "[Name] · Quality", autocomplete: "off" });
  const msg = h("p", { class: "small", role: "status" });
  return h("section", { class: "card stack", "aria-labelledby": "confirm-title" },
    h("h2", { id: "confirm-title" }, "Confirm the critical fields on the original"),
    h("p", { class: "muted small" }, `This certificate has no second reading channel. Type each value as printed on the original (all ${fields.length} critical fields; write "absent" for a field that is not on the document). The rules are then run again on your values.`),
    h("div", { class: "grid-confirm" }, inputs.map(({ r, input }) => h("div", { class: "field" }, h("label", { for: input.id }, r.label), input))),
    h("div", { class: "row" }, h("div", { class: "field" }, h("label", { for: "confirm-by" }, "Confirmed by"), by)),
    h("div", { class: "btns" }, h("button", { class: "btn primary", type: "button", onclick: async () => {
      const list = inputs.filter(({ input }) => input.value.trim() !== "").map(({ r, input }) => ({ field: r.field, value: input.value.trim() === "absent" ? null : input.value.trim() }));
      if (!by.value.trim()) { msg.textContent = "Say who confirms."; return; }
      if (list.length === 0) { msg.textContent = "Enter at least one value."; return; }
      msg.textContent = await onConfirm(list, by.value.trim());
    } }, "Re-run the rules with these values")),
    msg);
}

// ---------------------------------------------------------------- screens
const session = { story: null }; // per-tab state for the story being viewed; reset on every navigation (B-21)

async function storyScreen(id) {
  const r = await api(`/stories/${encodeURIComponent(id)}.json`);
  if (!r.ok) return render(h("p", { class: "error" }, "Unknown story."));
  const story = r.body;
  // storedAt is the static file's created_at and never changes, even after a server re-evaluation (F2-01, B-12).
  session.story = { id, view: story.view, storedAt: story.recorded_at || story.stored_at, model: story.model_reported, confirmations: [], by: "", evaluatedAt: null };
  drawStory();
}

function drawStory() {
  const s = session.story;
  const view = s.view;
  const ctx = { storedTitle: "Recorded reading", storedDetail: storyLabelDetail(s) };
  const evaluate = async (extra) => {
    const r = await post(`/api/stories/${s.id}/evaluate`, { confirmations: s.confirmations, confirmed_by: s.by, ...extra });
    if (!r.ok) return r.body && r.body.error ? r.body.error : `Rejected (${r.status})`;
    s.view = r.body.view;
    s.evaluatedAt = r.body.view.receipt.created_at;
    drawStory();
    return "";
  };
  const nodes = [...caseFile(view, ctx)];
  if (view.human_confirmation_required.length > 0 || s.confirmations.length > 0) {
    nodes.push(confirmForm(view, async (list, by) => { s.confirmations = list; s.by = by; return evaluate({}); }));
  }
  if (view.receipt.human_decision) {
    nodes.push(h("section", { class: "card stack" }, h("h2", {}, "Decision recorded"),
      h("p", {}, `${view.receipt.human_decision.action} · by ${view.receipt.human_decision.by} · at ${view.receipt.human_decision.at} (server time) · reason: ${view.receipt.human_decision.reason}`)));
  } else {
    nodes.push(decisionForm(view, (d) => evaluate({ decision: d }), { clientTime: false }));
  }
  nodes.push(h("p", {}, h("a", { href: "#/receipt", onclick: (e) => { e.preventDefault(); receiptScreen(view, { kind: "story", storyLabel: storyLabelDetail(s) }); } }, "Open the receipt")));
  render(...nodes);
}

function localScreen(key) {
  const held = loadLocal(key);
  if (!held) return render(h("p", { class: "error" }, "This case is not in this browser's storage."));
  const view = held.view;
  const ctx = { storedTitle: "Stored in this browser", storedDetail: localLabelDetail(view) };
  const nodes = [...caseFile(view, ctx)];
  if (held.decision) {
    nodes.push(h("section", { class: "card stack" }, h("h2", {}, "Decision recorded in this browser"),
      h("p", {}, `${held.decision.action} · by ${held.decision.by} · at ${held.decision.at} (browser time, not verified by a server) · reason: ${held.decision.reason}`)));
  } else {
    nodes.push(decisionForm(view, async (d) => {
      if (d.action === "release" && !releaseAllowed(view)) return "Release is not allowed for this proposal.";
      held.decision = { action: d.action, by: d.decided_by, reason: d.reason, at: new Date().toISOString(), time_source: "browser clock" };
      try { localStorage.setItem(STORE_PREFIX + key, JSON.stringify(held)); } catch { /* ignore */ }
      localScreen(key);
      return "";
    }, { clientTime: true }));
  }
  nodes.push(h("p", {}, h("a", { href: "#/receipt", onclick: (e) => { e.preventDefault(); receiptScreen(view, { kind: "local", decision: held.decision }); } }, "Open the receipt")));
  render(...nodes);
}

function receiptScreen(view, opts) {
  const rc = view.receipt;
  const download = () => {
    const out = opts.kind === "local"
      ? { ...rc, client_held_copy: true, client_note: "Copy held in a browser; not verified by the server.", client_decision: opts.decision || null }
      : rc;
    const blob = new Blob([JSON.stringify(out, null, 2) + "\n"], { type: "application/json" });
    const a = h("a", { href: URL.createObjectURL(blob), download: `certgate-receipt-${rc.case_id}.json` });
    document.body.append(a);
    a.click();
    a.remove();
  };
  const hd = rc.human_decision || (opts.decision ? { action: opts.decision.action, by: opts.decision.by, at: `${opts.decision.at} (browser time)`, reason: opts.decision.reason } : null);
  render(
    h("section", { class: "row between" },
      h("h1", {}, `Receipt · case ${rc.case_id}`),
      h("div", { class: "btns" }, h("button", { class: "btn primary", type: "button", onclick: download }, "Download JSON"))),
    h("div", { class: "stored", "data-stored-label": "true" }, h("strong", {}, opts.kind === "local" ? "Stored in this browser" : "Stored reading"),
      ` · ${opts.storyLabel ?? `${readingText(rc)} · ${rc.created_at} · not live`}`),
    h("section", { class: "row" },
      h("div", { class: "card side stack" }, h("div", { class: "eyebrow" }, "CERTGATE PROPOSED"), h("h2", {}, rc.proposal),
        h("p", { class: "small mono" }, rc.reasons.map((r) => r.code).join(" · ") || "no rule fails")),
      h("div", { class: "card side stack" }, h("div", { class: "eyebrow" }, "PERSON DECIDED"),
        hd ? h("p", {}, `${hd.action} · ${hd.by} · ${hd.at} · reason: ${hd.reason}`) : h("p", { class: "muted" }, "No decision recorded yet."))),
    h("section", { class: "card stack" }, h("h2", {}, "Documents and versions"),
      h("dl", { class: "kv" },
        h("dt", {}, "Certificate SHA-256"), h("dd", {}, rc.hashes.certificate_sha256),
        h("dt", {}, "Delivery note SHA-256"), h("dd", {}, rc.hashes.delivery_note_sha256 || "none"),
        h("dt", {}, "Spec"), h("dd", {}, `${rc.spec.spec_id} rev. ${rc.spec.revision} · SHA-256 ${rc.hashes.spec_sha256}`),
        h("dt", {}, "Rules version"), h("dd", {}, rc.rules_version),
        h("dt", {}, "Reader"), h("dd", {}, `${rc.reader.model_id} · calls ${rc.reader.calls}`),
        h("dt", {}, "Reading source"), h("dd", {}, opts.kind === "story" ? `recorded: read from the endpoint at ${rc.created_at}; stored, not live` : readingText(rc)))),
    h("section", { class: "card stack" }, h("h2", {}, "Values, channels and rules"),
      h("div", { class: "tablebox" }, h("table", {},
        h("thead", {}, h("tr", {}, ["Field", "Value", "Model channel", "Text layer", "Result"].map((x) => h("th", { scope: "col" }, x)))),
        h("tbody", {}, view.rows.map((r) => h("tr", {}, h("th", { scope: "row" }, r.label), h("td", {}, r.state === "known" ? r.value : r.state),
          h("td", {}, r.model_value ?? "—"), h("td", {}, r.text_layer_value ?? "—"), h("td", { class: `res-${r.result}` }, RESULT_TEXT[r.result]))))))),
    f1Panel(rc.f1, "Runs on AMD · copy at reading time", "Stored in the receipt when the certificate was read."),
  );
}


async function amdScreen() {
  const f1 = await refreshF1();
  render(h("div", { class: "row" }, f1Panel(f1 || { state: "off", detail: "status unavailable", model_ids: [] }, "Runs on AMD",
    "Read now from the configured model endpoint (GET /models and GET /usage, probed at most once per 60 s). With no endpoint configured, it says endpoint off with the time of this check. Nothing is typed by hand.")),
    h("p", { class: "muted", id: "amd-state" }, f1 && f1.state === "on"
      ? "Endpoint on: AMD Token Factory. The values above are as reported by the endpoint."
      : `Endpoint off (${f1 && f1.detail ? f1.detail : "status unavailable"}): judge mode shows the recorded readings only.`));
}

async function route() {
  session.story = null;
  const hash = location.hash || "#/";
  const m = /^#\/(story|local)\/([A-Za-z0-9_.-]+)$/.exec(hash);
  try {
    if (m && m[1] === "story") return await storyScreen(m[2]);
    if (m && m[1] === "local") return localScreen(m[2]);
    if (hash === "#/judge") return await landing("judge");
    if (hash === "#/amd") return await amdScreen();
    return await landing(null);
  } catch (e) {
    render(h("p", { class: "error" }, "Something went wrong loading this screen."));
  }
}

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", () => { refreshF1(); route(); });
