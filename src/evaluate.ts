// Channel checks, coherence, deterministic rules and the decision proposal.
// Decisions come only from these versioned rules (invariant I1); the model's free text is never consulted.
import { cevCoherent, heatMatches, plausible, recomputeCev, type Plausibility } from "./coherence.js";
import { Dec, decimalTextEqual, parseDecimal, roundCevForCoherence } from "./decimal.js";
import {
  CHEMISTRY, CRITICAL_FIELDS, EXPECTED_UNITS, MAY_BE_ABSENT, MECHANICAL, NUMERIC_FIELDS, normaliseUnit,
  unitsEquivalent, type FieldValue,
} from "./fields.js";
import { limitOf } from "./spec.js";
import type { TextLayerResult } from "./text-layer.js";
import type {
  Certificate, ChannelCheck, Decision, DeliveryLine, FieldConfirmation, Proposal, ReasonEntry, RuleResult, SourceRef, Spec,
} from "./types.js";

export const RULES_VERSION = "certgate-rules-1.0.0";

export interface EffectiveField {
  key: string;
  value: string | null;
  unit: string | null;
  state: "known" | "unknown" | "absent";
  source: "model+text_layer" | "model" | "human_confirmed";
  read_value: string | null;
  refs: SourceRef[];
}

export interface EvaluationInput {
  model: Map<string, FieldValue>;
  textLayer: TextLayerResult;
  deliveryLine: DeliveryLine | null;
  spec: Spec;
  plausibility: Plausibility;
  confirmations: FieldConfirmation[];
}

export interface Evaluation {
  fields: Map<string, EffectiveField>;
  certificate: Certificate;
  channel_checks: ChannelCheck[];
  rule_results: RuleResult[];
  cev_recomputed: string | null;
  decision: Decision;
}

/** Short field name used in reason codes: "chemistry.Mn" -> "Mn". */
export const label = (key: string) => key.split(".").pop()!;

const valuesEqual = (key: string, a: string, b: string) =>
  NUMERIC_FIELDS.has(key) ? decimalTextEqual(a, b) : a.trim() === b.trim();

class Reasons {
  list: ReasonEntry[] = [];
  add(code: string, effect: ReasonEntry["effect"], detail: string) {
    if (!this.list.some((r) => r.code === code)) this.list.push({ code, effect, detail });
  }
}

function resolveChannels(input: EvaluationInput, reasons: Reasons) {
  const { model, textLayer } = input;
  const fields = new Map<string, EffectiveField>();
  const checks: ChannelCheck[] = [];
  const confirmed = new Map(input.confirmations.map((c) => [c.field, c]));
  const pendingConfirmation: string[] = [];

  for (const [key, m] of model) {
    const critical = CRITICAL_FIELDS.includes(key);
    const t = textLayer.fields.get(key);
    const conflict = textLayer.conflicts.get(key);
    const readValue = m.status === "read" ? m.value : null;
    const check: ChannelCheck = {
      field: key, model_value: m.value, model_unit: m.unit, text_layer_value: t?.value ?? null,
      text_layer_unit: t?.unit ?? null, agree: false, channel_available: textLayer.channel_available,
      issue: null, human_confirmed: false, source_refs: [m.source_ref, ...(t ? [t.source_ref] : [])],
    };
    const c = confirmed.get(key);
    if (c) {
      // A person confirmed this field; the confirmed value replaces the reading (register A-07, A-21).
      check.human_confirmed = true;
      check.agree = true;
      // A confirmation without a unit is taken in the field's expected unit (the person confirms the value
      // against the specification); a confirmation with a unit keeps it and goes through the unit check.
      fields.set(key, {
        key, value: c.value, unit: c.unit ?? (EXPECTED_UNITS[key]?.[0] ?? m.unit), state: c.value === null ? "absent" : "known", source: "human_confirmed",
        read_value: readValue,
        refs: [{ channel: "human", page: null, fragment: `confirmed by ${c.confirmed_by} at ${c.confirmed_at}` }],
      });
      if (critical) checks.push(check);
      continue;
    }
    const fromModel = (): EffectiveField => ({
      key, value: m.status === "read" ? m.value : null, unit: m.unit,
      state: m.status === "read" ? "known" : m.status === "absent" ? "absent" : "unknown",
      source: "model", read_value: readValue, refs: [m.source_ref],
    });
    if (!critical) {
      fields.set(key, fromModel());
      continue;
    }
    if (!textLayer.channel_available) {
      // A scan has no second channel: critical fields need human confirmation (invariant I3).
      check.issue = "no_second_channel";
      pendingConfirmation.push(key);
      fields.set(key, fromModel());
      checks.push(check);
      continue;
    }
    const unknownField = (): EffectiveField => ({
      key, value: null, unit: null, state: "unknown", source: "model+text_layer", read_value: readValue,
      refs: check.source_refs,
    });
    if (conflict) {
      check.issue = "text_layer_conflict";
      reasons.add(`TEXT_LAYER_CONFLICT:${label(key)}`, "review", `text layer states several values for ${key}: ${conflict.join(", ")}`);
      fields.set(key, unknownField());
    } else if (m.status === "unknown") {
      fields.set(key, unknownField());
    } else if (m.status === "absent" && (!t || t.status === "absent") && MAY_BE_ABSENT.has(key)) {
      check.agree = true;
      fields.set(key, { ...fromModel(), source: "model+text_layer", refs: check.source_refs });
    } else if (m.status === "read" && t && t.status === "read" && t.value !== null &&
               valuesEqual(key, m.value!, t.value) && (!NUMERIC_FIELDS.has(key) || unitsEquivalent(m.unit, t.unit))) {
      check.agree = true;
      fields.set(key, { ...fromModel(), source: "model+text_layer", refs: check.source_refs });
    } else if (m.status === "read" && (!t || t.status === "unknown")) {
      check.issue = "text_layer_missing";
      reasons.add(`TEXT_LAYER_MISSING:${label(key)}`, "review", `${key} not found in the text layer; model reading not corroborated`);
      fields.set(key, unknownField());
    } else {
      check.issue = "disagree";
      reasons.add(`CHANNEL_DISAGREE:${label(key)}`, "review",
        `${key}: model ${m.value ?? m.status} ${m.unit ?? ""} vs text layer ${t?.value ?? t?.status ?? "none"} ${t?.unit ?? ""}`.trim());
      fields.set(key, unknownField());
    }
    checks.push(check);
  }
  return { fields, checks, pendingConfirmation };
}

function checkUnitsAndPlausibility(fields: Map<string, EffectiveField>, p: Plausibility, reasons: Reasons) {
  for (const f of fields.values()) {
    if (!NUMERIC_FIELDS.has(f.key) || f.state !== "known") continue;
    const d = parseDecimal(f.value);
    if (d === null) {
      reasons.add(`NOT_A_NUMBER:${label(f.key)}`, "review", `${f.key} value "${f.value}" is not a decimal number`);
      f.state = "unknown";
      f.value = null;
      continue;
    }
    const unit = normaliseUnit(f.unit);
    const expected = EXPECTED_UNITS[f.key] ?? [];
    if (unit === null || !expected.includes(unit)) {
      reasons.add(`UNIT_UNEXPECTED:${label(f.key)}`, "review",
        `${f.key} in ${unit ?? "no unit"}; expected ${expected.join(" or ")}; not converted`);
      f.state = "unknown";
      f.value = null;
      continue;
    }
    if (!plausible(p, f.key, d)) {
      reasons.add(`IMPLAUSIBLE:${label(f.key)}`, "review",
        `${f.key} = ${f.value} ${unit} is outside the band-defined plausibility range (possible scale jump)`);
      f.state = "unknown";
      f.value = null;
    }
  }
}

function limitRule(spec: Spec, field: string, key: string, value: Dec | null, observed: string | null, refs: string[]): RuleResult {
  const l = limitOf(spec, field)!;
  const expected = [l.min !== null ? `>= ${l.min}` : null, l.max !== null ? `<= ${l.max}` : null].filter(Boolean).join(" and ") + ` ${l.unit}`;
  const rule_id = `${spec.spec_id}.r${spec.version}.${field}`;
  if (value === null) {
    return { rule_id, input_field_refs: refs, outcome: "not_evaluable", expected, observed: null, reason: `${key} unknown` };
  }
  // Inclusive limits, exact decimals, no rounding before comparison (register D1-07, S1-27, A-22).
  const belowMin = l.min !== null && value.lt(new Dec(l.min));
  const aboveMax = l.max !== null && value.gt(new Dec(l.max));
  const outcome = belowMin || aboveMax ? "fail" : "pass";
  const reason = outcome === "pass" ? "within limit"
    : belowMin ? `${field} ${observed} is below the minimum ${l.min} ${l.unit}` : `${field} ${observed} is above the maximum ${l.max} ${l.unit}`;
  return { rule_id, input_field_refs: refs, outcome, expected, observed, reason };
}

export function evaluate(input: EvaluationInput): Evaluation {
  const reasons = new Reasons();
  const { fields, checks, pendingConfirmation } = resolveChannels(input, reasons);
  checkUnitsAndPlausibility(fields, input.plausibility, reasons);
  const get = (k: string) => fields.get(k)!;
  const known = (k: string) => (get(k).state === "known" ? get(k).value : null);

  // Critical fields that ended unknown (I2).
  for (const key of CRITICAL_FIELDS) {
    const f = get(key);
    if (f.state === "unknown") reasons.add(`CRITICAL_UNKNOWN:${label(key)}`, "review", `${key} could not be read with confidence`);
    if (f.state === "absent" && !MAY_BE_ABSENT.has(key)) {
      reasons.add(`CRITICAL_UNKNOWN:${label(key)}`, "review", `${key} is not on the certificate`);
    }
  }

  // Scans: release needs every critical field confirmed by a person (I3, register A-21).
  if (pendingConfirmation.length > 0) {
    reasons.add("NO_SECOND_CHANNEL", "review",
      `no text layer: ${pendingConfirmation.length} critical field(s) need human confirmation`);
  }

  // Heat or lot against the paired delivery line (S1-21, A-04, A-12).
  const line = input.deliveryLine;
  if (!line) reasons.add("EVIDENCE_MISSING:delivery_line", "review", "no paired delivery line");
  const heat = known("heat_or_lot");
  if (line && heat !== null && !heatMatches(heat, line.heat_or_lot)) {
    reasons.add("HEAT_MISMATCH", "review",
      `certificate heat ${heat} does not match heat ${line.heat_or_lot} of delivery line ${line.line} (${line.delivery_note})`);
  }

  // Certificate type, impact test temperature, inspection stamp (A-06, A-05, S1-30).
  const type = get("certificate_type");
  if (type.state === "absent" || (type.state === "known" && type.value!.trim() !== input.spec.required_certificate_type)) {
    reasons.add("CERT_TYPE_NOT_3_1", "review",
      `certificate type ${type.value ?? "not stated"}; required ${input.spec.required_certificate_type} (EN 10204)`);
  }
  const kvt = get("kv_temperature");
  const kvtValue = kvt.state === "known" ? parseDecimal(kvt.value) : null;
  if (kvt.state === "absent" || (kvtValue !== null && !kvtValue.eq(new Dec(input.spec.kv_temperature)))) {
    reasons.add("KV_TEMPERATURE_MISMATCH", "review",
      `impact test at ${kvt.value ?? "unstated"} °C; required ${input.spec.kv_temperature} °C`);
  }
  if (get("inspection_stamp").state === "absent") reasons.add("STAMP_MISSING", "review", "no inspection stamp on the certificate");

  // CEV: exact recomputation; coherence with the printed value (C9, A-20).
  const chem: Record<string, string | null> = Object.fromEntries(CHEMISTRY.map((e) => [e, known(`chemistry.${e}`)]));
  const cev = recomputeCev(chem);
  const printed = known("cev_printed");
  if (printed !== null && cev !== null && !cevCoherent(printed, cev)) {
    reasons.add("CEV_MISMATCH", "review",
      `printed CEV ${printed} differs from recomputed ${cev.toSignificantDigits(8).toString()} (rounded ${roundCevForCoherence(cev).toFixed(2)})`);
  }

  // Deterministic rules against the specification.
  const rules: RuleResult[] = [];
  for (const e of ["C", "Si", "Mn", "P", "S", "Cu"]) {
    const v = known(`chemistry.${e}`);
    rules.push(limitRule(input.spec, e, `chemistry.${e}`, parseDecimal(v), v, [`chemistry.${e}`]));
  }
  for (const m of ["ReH", "Rm", "A"]) {
    const v = known(`mechanical.${m}`);
    rules.push(limitRule(input.spec, m, `mechanical.${m}`, parseDecimal(v), v, [`mechanical.${m}`]));
  }
  // CEV maximum applies to the printed value and to the exact recomputed value (register A-02).
  if (printed !== null || cev === null) {
    const r = limitRule(input.spec, "CEV", "cev_printed", parseDecimal(printed), printed, ["cev_printed"]);
    rules.push({ ...r, rule_id: `${r.rule_id}.printed` });
  }
  {
    const r = limitRule(input.spec, "CEV", "CEV recomputed", cev, cev?.toString() ?? null, CEV_REFS);
    rules.push({ ...r, rule_id: `${r.rule_id}.recomputed` });
  }
  // KV mean >= min, compared as sum >= 3 x min, exactly (register D1-09).
  {
    const kv = MECHANICAL.filter((m) => m.startsWith("KV_")).map((m) => parseDecimal(known(`mechanical.${m}`)));
    const l = limitOf(input.spec, "KV_media")!;
    const rule_id = `${input.spec.spec_id}.r${input.spec.version}.KV_media`;
    const expected = `mean of 3 >= ${l.min} ${l.unit} (sum >= ${new Dec(l.min!).times(3).toString()})`;
    if (kv.some((v) => v === null)) {
      rules.push({ rule_id, input_field_refs: KV_REFS, outcome: "not_evaluable", expected, observed: null, reason: "an impact value is unknown" });
    } else {
      const sum = kv.reduce((a, b) => a!.plus(b!), new Dec(0))!;
      const ok = sum.gte(new Dec(l.min!).times(3));
      rules.push({ rule_id, input_field_refs: KV_REFS, outcome: ok ? "pass" : "fail", expected, observed: `sum ${sum.toString()}`,
        reason: ok ? "within limit" : `KV sum ${sum.toString()} is below 3 x ${l.min} J` });
    }
  }
  // Grade: certified = ordered = specified (S1-29).
  {
    const g = known("grade");
    const rule_id = `${input.spec.spec_id}.r${input.spec.version}.grade`;
    const expected = `${input.spec.grade} (spec) and ${line?.grade_ordered ?? "?"} (ordered)`;
    if (g === null || !line) {
      rules.push({ rule_id, input_field_refs: ["grade"], outcome: "not_evaluable", expected, observed: g, reason: "grade or delivery line unknown" });
    } else {
      const ok = g.trim() === input.spec.grade && g.trim() === line.grade_ordered.trim();
      rules.push({ rule_id, input_field_refs: ["grade", "delivery_line.grade_ordered"], outcome: ok ? "pass" : "fail", expected, observed: g,
        reason: ok ? "grade matches" : `certified grade ${g}; ordered ${line.grade_ordered}; specified ${input.spec.grade}` });
      if (!ok) reasons.add("GRADE_MISMATCH", "block", `certified grade ${g}, ordered ${line.grade_ordered}, specified ${input.spec.grade}`);
    }
  }
  for (const r of rules) {
    const field = r.rule_id.split(".")[2]!;
    if (r.outcome === "fail" && field !== "grade") reasons.add(`RULE_FAIL:${field}`, "block", r.reason);
    if (r.outcome === "not_evaluable") reasons.add(`RULE_NOT_EVALUABLE:${field}`, "review", r.reason);
  }

  const decision = propose(reasons.list, pendingConfirmation);
  return {
    fields, certificate: toCertificate(fields), channel_checks: checks, rule_results: rules,
    cev_recomputed: cev?.toString() ?? null, decision,
  };
}

const CEV_REFS = ["chemistry.C", "chemistry.Mn", "chemistry.Cr", "chemistry.Mo", "chemistry.V", "chemistry.Ni", "chemistry.Cu"];
const KV_REFS = ["mechanical.KV_1", "mechanical.KV_2", "mechanical.KV_3"];

/**
 * Precedence (register D1-03 amended by A-04): a heat mismatch means review whatever the rules say (failing
 * rules become information); otherwise block > review > release. Release only when no I5 condition holds.
 */
export function propose(reasons: ReasonEntry[], pendingConfirmation: string[] = []): Decision {
  const heatMismatch = reasons.some((r) => r.code === "HEAT_MISMATCH");
  const list = heatMismatch ? reasons.map((r) => (r.effect === "block" ? { ...r, effect: "info" as const } : r)) : reasons;
  let proposal: Proposal = "release";
  if (list.some((r) => r.effect === "block")) proposal = "block";
  else if (list.some((r) => r.effect === "review")) proposal = "review";
  return {
    proposal, reasons: list, evidence_refs: list.map((r) => r.code), human_required: true,
    human_confirmation_required: pendingConfirmation, human_decision: null, decided_by: null, decided_at: null,
    decision_reason: null,
  };
}

export function readerErrorDecision(errorClass: string, detail: string): Decision {
  return propose([{ code: `READER_ERROR:${errorClass}`, effect: "review", detail }]);
}

function toCertificate(fields: Map<string, EffectiveField>): Certificate {
  const v = (k: string) => fields.get(k)?.value ?? null;
  const ref = (k: string): SourceRef => fields.get(k)?.refs[0] ?? { channel: "model", page: null, fragment: "" };
  return {
    issuer: v("issuer"), certificate_no: v("certificate_no"), certificate_type: v("certificate_type"),
    heat_or_lot: v("heat_or_lot"), grade: v("grade"), dimensions: v("dimensions"),
    chemistry: CHEMISTRY.map((e) => ({ element: e, value: v(`chemistry.${e}`), unit: fields.get(`chemistry.${e}`)?.unit ?? null, source_ref: ref(`chemistry.${e}`) })),
    cev_printed: v("cev_printed"),
    mechanical: MECHANICAL.map((m) => ({ property: m, value: v(`mechanical.${m}`), unit: fields.get(`mechanical.${m}`)?.unit ?? null, source_ref: ref(`mechanical.${m}`) })),
    kv_temperature: v("kv_temperature"), inspection_stamp: v("inspection_stamp"),
  };
}
