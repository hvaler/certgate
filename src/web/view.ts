// View model for the web UI: everything the screens show, derived from a CaseResult. All values are strings;
// the browser renders them as text only (B-16). Durations come from the receipt's measured timings (S2-02).
import { label } from "../evaluate.js";
import { CHEMISTRY, CRITICAL_FIELDS } from "../fields.js";
import { limitOf } from "../spec.js";
import type { CaseResult } from "../pipeline.js";
import type { RunReceipt } from "../types.js";

export interface ViewRow {
  field: string;
  label: string;
  value: string | null;
  unit: string | null;
  state: "known" | "unknown" | "absent";
  value_source: string;
  model_value: string | null;
  text_layer_value: string | null;
  channels: "agree" | "disagree" | "text_layer_missing" | "text_layer_conflict" | "no_second_channel" | "human_confirmed" | "n/a";
  spec: string;
  source: string;
  result: "pass" | "fail" | "unknown" | "info";
  critical: boolean;
}

export interface ViewStep {
  name: string;
  status: "done" | "error" | "not_available" | "skipped";
  duration_ms: string | null;
  note: string;
}

export interface CaseView {
  view_schema: "certgate.view/1";
  case_id: string;
  status: string;
  proposal: string;
  reasons: { code: string; effect: string; detail: string }[];
  human_confirmation_required: string[];
  reading_source: RunReceipt["reading_source"];
  reading_label: string;
  certificate: { kind: string; certificate_no: string | null; heat: string | null; issuer: string | null; dimensions: string | null };
  delivery: { delivery_note: string; line: string } | null;
  rows: ViewRow[];
  counts: { checks: string; pass: string; fail: string; unknown: string };
  steps: ViewStep[];
  explanation: { available: boolean; text: string | null; note: string };
  receipt: RunReceipt;
}

const NAMES: Record<string, string> = {
  certificate_type: "Certificate type", heat_or_lot: "Heat no.", grade: "Grade", cev_printed: "CEV (printed)",
  kv_temperature: "KV test temperature", inspection_stamp: "Inspection stamp", "mechanical.KV_1": "KV specimen 1",
  "mechanical.KV_2": "KV specimen 2", "mechanical.KV_3": "KV specimen 3",
};

export function readingLabel(src: RunReceipt["reading_source"]): string {
  switch (src) {
    case "mock": return "mock reading · no model";
    case "planted": return "mock reading · no model · planted deviation (test case)";
    case "live": return "live reading from the configured endpoint";
    case "live_no_reading": return "live attempt · no reading";
  }
}

export function toView(r: CaseResult): CaseView {
  const e = r.evaluation;
  const spec = r.readings.spec;
  const line = r.readings.delivery_line;
  const rules = e?.rule_results ?? [];
  const ruleFor = (field: string) => rules.filter((x) => x.rule_id.split(".")[2] === field);
  const checks = new Map((e?.channel_checks ?? []).map((c) => [c.field, c]));
  const rows: ViewRow[] = [];
  const keys = e ? [...e.fields.keys()].filter((k) => CRITICAL_FIELDS.includes(k)) : [];
  for (const key of keys) {
    const f = e!.fields.get(key)!;
    const c = checks.get(key);
    const short = label(key);
    let specText = "—";
    let result: ViewRow["result"] = f.state === "unknown" ? "unknown" : "info";
    const ruleField = key === "cev_printed" ? "CEV" : short;
    const lim = limitOf(spec, ruleField);
    if (lim) specText = [lim.min !== null ? `≥ ${lim.min}` : null, lim.max !== null ? `≤ ${lim.max}` : null].filter(Boolean).join(" and ") + ` ${lim.unit}`;
    const rr = ruleFor(ruleField).filter((x) => key !== "cev_printed" || x.rule_id.endsWith(".printed"));
    if (rr.length > 0 && f.state !== "unknown") result = rr.some((x) => x.outcome === "fail") ? "fail" : rr.every((x) => x.outcome === "pass") ? "pass" : "unknown";
    const codes = r.decision.reasons.map((x) => x.code);
    if (key === "heat_or_lot") {
      specText = line ? `= delivery line ${line.line}: ${line.heat_or_lot}` : "delivery line missing";
      if (f.state === "known") result = codes.includes("HEAT_MISMATCH") ? "fail" : "pass";
    } else if (key === "grade") {
      specText = `${spec.grade}${line ? ` (ordered ${line.grade_ordered})` : ""}`;
      if (f.state === "known") result = codes.includes("GRADE_MISMATCH") ? "fail" : "pass";
    } else if (key === "certificate_type") {
      specText = `${spec.required_certificate_type} (EN 10204)`;
      if (f.state !== "unknown") result = codes.includes("CERT_TYPE_NOT_3_1") ? "fail" : "pass";
    } else if (key === "kv_temperature") {
      specText = `${spec.kv_temperature} °C`;
      if (f.state !== "unknown") result = codes.includes("KV_TEMPERATURE_MISMATCH") ? "fail" : "pass";
    } else if (key === "inspection_stamp") {
      specText = "required";
      if (f.state !== "unknown") result = codes.includes("STAMP_MISSING") ? "fail" : "pass";
    } else if (key.startsWith("mechanical.KV_")) {
      const kv = ruleFor("KV_media")[0];
      specText = kv ? kv.expected : "—";
      if (f.state === "known" && kv) result = kv.outcome === "fail" ? "fail" : kv.outcome === "pass" ? "pass" : "unknown";
    } else if (key.startsWith("chemistry.") && !lim) {
      specText = "no limit in ESP-014 (used for CEV)";
      if (f.state === "known") result = "info";
    }
    if (c && !c.agree && f.state === "unknown") result = "unknown";
    const channels: ViewRow["channels"] = !c ? "n/a" : c.human_confirmed ? "human_confirmed" : c.issue ?? (c.agree ? "agree" : "disagree");
    const ref = f.refs[0];
    rows.push({
      field: key, label: NAMES[key] ?? `${short}${f.unit ? ` (${f.unit})` : ""}`, value: f.value, unit: f.unit, state: f.state,
      value_source: f.source, model_value: c?.model_value ?? null, text_layer_value: c?.text_layer_value ?? null, channels,
      spec: specText, source: ref ? `page ${ref.page ?? "?"} · ${ref.fragment}` : "—", result, critical: true,
    });
  }
  if (e?.cev_recomputed) {
    const rr = ruleFor("CEV").find((x) => x.rule_id.endsWith(".recomputed"));
    rows.push({
      // Shown to 6 decimals for reading; the exact value is in the receipt (rule_results) and is what the rule uses.
      field: "cev_recomputed", label: "CEV (recomputed; exact value in the receipt)", value: shortDecimal(e.cev_recomputed), unit: "%", state: "known", value_source: "computed",
      model_value: null, text_layer_value: null, channels: "n/a", spec: rr?.expected ?? "—",
      source: `computed from ${CHEMISTRY.filter((x) => ["C", "Mn", "Cr", "Mo", "V", "Ni", "Cu"].includes(x)).join(", ")} (IIW formula, cited)`,
      result: rr?.outcome === "fail" ? "fail" : rr?.outcome === "pass" ? "pass" : "unknown", critical: false,
    });
  }
  const t = r.receipt.timings_ms;
  const reading = r.receipt.reading_source;
  const steps: ViewStep[] = [
    { name: "Case created", status: "done", duration_ms: t.validate ?? null, note: "file type and size checked, hash recorded" },
    {
      name: reading === "mock" || reading === "planted" ? "Model reading · mock (no model)" : "Model reading · live endpoint",
      status: r.readings.case.status === "error" ? "error" : "done", duration_ms: t.model_reading ?? null,
      note: r.readings.reader_error ? `${r.readings.reader_error.class}: no reading` : readingLabel(reading),
    },
    {
      name: "Text layer", status: r.readings.text_layer.channel_available ? "done" : "not_available", duration_ms: t.text_layer ?? null,
      note: r.readings.text_layer.channel_available ? "second channel, read without any model" : "not available: scan, no text layer",
    },
    {
      name: "Internal coherence and rules against ESP-014", status: e ? "done" : "skipped", duration_ms: t.evaluation ?? null,
      note: e ? "measured together: heat, units, CEV recomputed; versioned rules in exact decimals" : "skipped: no reading",
    },
    { name: "Proposal", status: "done", duration_ms: null, note: `${r.decision.proposal} · a person decides` },
  ];
  const results = rows.filter((x) => x.critical);
  const n = (k: ViewRow["result"]) => String(results.filter((x) => x.result === k).length);
  const cert = e?.certificate;
  const expl = r.explanation;
  return {
    view_schema: "certgate.view/1",
    case_id: r.readings.case.case_id,
    status: r.readings.case.status,
    proposal: r.decision.proposal,
    reasons: r.decision.reasons,
    human_confirmation_required: r.decision.human_confirmation_required,
    reading_source: reading,
    reading_label: readingLabel(reading),
    certificate: {
      kind: r.readings.text_layer.channel_available ? "digital PDF with a text layer" : "scanned PDF, no text layer",
      certificate_no: cert?.certificate_no ?? null, heat: cert?.heat_or_lot ?? null, issuer: cert?.issuer ?? null, dimensions: cert?.dimensions ?? null,
    },
    delivery: line ? { delivery_note: line.delivery_note, line: line.line } : null,
    rows,
    counts: { checks: String(results.length), pass: n("pass"), fail: n("fail"), unknown: n("unknown") },
    steps,
    explanation: expl && reading === "live"
      ? { available: true, text: expl.text, note: "model explanation; it never decides (I1)" }
      : { available: false, text: null, note: explanationNote(reading) },
    receipt: r.receipt,
  };
}


/** Display form of an exact decimal: at most 6 decimals, marked when shortened. Display only, never compared. */
export function shortDecimal(s: string): string {
  const m = /^(-?\d+)\.(\d+)$/.exec(s);
  if (!m || m[2]!.length <= 6) return s;
  return `${m[1]}.${m[2]!.slice(0, 6)}…`;
}

/** The explanation note follows the reading source (F2-02): never "mock" for a live attempt. */
export function explanationNote(src: RunReceipt["reading_source"]): string {
  switch (src) {
    case "mock": return "There is no model explanation: this is a mock reading, no model was used.";
    case "planted": return "There is no model explanation: this is a mock reading (test case with a planted deviation), no model was used.";
    case "live": return "The model gave no explanation for this reading.";
    case "live_no_reading": return "There is no model explanation: this was a live attempt and nothing was read.";
  }
}