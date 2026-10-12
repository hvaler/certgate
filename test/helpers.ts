// Test helpers. Tests (unlike src/) may read the dataset's expected outcomes.
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadDatasetCase, loadShared, type Shared } from "../src/cases.js";
import { REPO_ROOT } from "../src/config.js";
import { parseDeliveryNote, findLine } from "../src/delivery.js";
import { evaluate } from "../src/evaluate.js";
import type { FieldValue } from "../src/fields.js";
import { parseModelOutput } from "../src/model-output.js";
import { processCase, type CaseResult } from "../src/pipeline.js";
import type { TextLayerResult } from "../src/text-layer.js";
import type { DeliveryLine, FieldConfirmation } from "../src/types.js";

export const ROOT = REPO_ROOT;
export const DATA = path.join(ROOT, "data");

export interface Expected {
  case_id: string;
  acceptance_cases: string[];
  expected_status: "ok" | "error";
  expected_proposal: "release" | "block" | "review";
  reasons_must_include: string[];
  rule_failures: { field: string; observed: string; max?: string; min?: string }[];
  correct_reading: Record<string, unknown>;
}

export const expected = (id: string): Expected =>
  JSON.parse(readFileSync(path.join(DATA, "expected", `${id}.json`), "utf8")) as Expected;

let shared: Shared | null = null;
export const getShared = () => (shared ??= loadShared("mock"));

export async function runCase(id: string, confirmations: FieldConfirmation[] = []): Promise<CaseResult> {
  return processCase(loadDatasetCase(id, getShared()), confirmations);
}

export function modelFields(id: string): Map<string, FieldValue> {
  return parseModelOutput(readFileSync(path.join(DATA, "cases", id, "reading.json"), "utf8")).fields;
}

export type Override = Partial<Pick<FieldValue, "value" | "unit" | "status">>;

export function withOverrides(base: Map<string, FieldValue>, overrides: Record<string, Override>) {
  const m = new Map([...base].map(([k, v]) => [k, { ...v }]));
  for (const [k, o] of Object.entries(overrides)) {
    const f = m.get(k);
    if (!f) throw new Error(`no field ${k}`);
    Object.assign(f, o);
    if (o.value === null && o.status === undefined) f.status = "unknown";
  }
  return m;
}

/** A text layer that agrees with the given model fields (digital certificate, both channels equal). */
export function agreeingTextLayer(model: Map<string, FieldValue>): TextLayerResult {
  const fields = new Map<string, FieldValue>();
  for (const [k, v] of model) fields.set(k, { ...v, source_ref: { ...v.source_ref, channel: "text_layer" } });
  return { channel_available: true, fields, conflicts: new Map() };
}

export const scanLayer = (): TextLayerResult => ({ channel_available: false, fields: new Map(), conflicts: new Map() });

export function deliveryLine(note = "ALB-2026-0917.csv", line = "1"): DeliveryLine {
  const text = readFileSync(path.join(DATA, "delivery", note), "utf8");
  return findLine(parseDeliveryNote(text, note), line)!;
}

/** Evaluate cg-001 (conforming, digital) with field overrides; text layer agrees unless `scan`. */
export function evalWith(opts: {
  overrides?: Record<string, Override>;
  scan?: boolean;
  line?: DeliveryLine | null;
  confirmations?: FieldConfirmation[];
  base?: string;
} = {}) {
  const model = withOverrides(modelFields(opts.base ?? "cg-001"), opts.overrides ?? {});
  const s = getShared();
  return evaluate({
    model,
    textLayer: opts.scan ? scanLayer() : agreeingTextLayer(model),
    deliveryLine: opts.line === undefined ? deliveryLine() : opts.line,
    spec: s.spec,
    plausibility: s.plausibility,
    confirmations: opts.confirmations ?? [],
  });
}

export const codes = (e: { decision: { reasons: { code: string }[] } }) => e.decision.reasons.map((r) => r.code);

/** Receipt without the fields that legitimately differ between runs. */
export function stableReceipt(r: CaseResult) {
  const { run_id: _r, created_at: _c, timings_ms: _t, ...rest } = r.receipt;
  return rest;
}
