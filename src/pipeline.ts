// The case pipeline: validate inputs, read both channels, evaluate, propose, and build the run receipt.
import { randomUUID } from "node:crypto";
import { CEV_FORMULA_SOURCE, type Plausibility } from "./coherence.js";
import { findLine, parseDeliveryNote } from "./delivery.js";
import { evaluate, readerErrorDecision, RULES_VERSION, type Evaluation } from "./evaluate.js";
import { CRITICAL_FIELDS, NUMERIC_FIELDS } from "./fields.js";
import { sha256, validateCertificate, validateDeliveryNote } from "./input-file.js";
import { parseModelOutput, type ModelReading, type PlantedEntry } from "./model-output.js";
import { MAX_RETRIES, ReaderError, RETRYABLE, type ModelReader } from "./reader.js";
import { extractTextLayer, type TextLayerResult } from "./text-layer.js";
import type { Case, Decision, DeliveryLine, FieldConfirmation, HumanAction, RunReceipt, Spec } from "./types.js";
import { normaliseDecimalText } from "./decimal.js";

export const FICTITIOUS_NOTICE =
  "All data is fictitious: Siderúrgica Valdemora S.A., Talleres Ribera Norte S.L., grade TRN-355 and spec ESP-014 are invented for this demo.";

export interface CaseInput {
  case_id: string;
  certificate: Uint8Array;
  delivery_note: { name: string; bytes: Uint8Array } | null;
  delivery_line: string | null;
  reader: ModelReader;
  spec: Spec;
  plausibility: Plausibility;
  mode: string;
  now?: () => Date;
}

/** Everything read for one case. Evaluation can be re-run on it (human confirmation) without re-reading. */
export interface CaseReadings {
  case: Case;
  delivery_line: DeliveryLine | null;
  text_layer: TextLayerResult;
  model: ModelReading | null;
  model_output_sha256: string | null;
  reader_error: { class: string; detail: string; injected: boolean } | null;
  reader: { reader_id: string; kind: "mock" | "live"; model_id: string; model_version: string; vllm_version: string; rocm_version: string; calls: number; planted: PlantedEntry[] };
  timings: Record<string, string>;
  spec: Spec;
  plausibility: Plausibility;
  mode: string;
}

export interface CaseResult {
  readings: CaseReadings;
  evaluation: Evaluation | null;
  decision: Decision;
  confirmations: FieldConfirmation[];
  receipt: RunReceipt;
  explanation: { text: string; planted: boolean; used_for_decision: false } | null;
}

/** Elapsed milliseconds as a decimal string with microsecond precision (integer arithmetic only). */
const ms = (t0: bigint) => {
  const us = (process.hrtime.bigint() - t0) / 1000n;
  return `${us / 1000n}.${(us % 1000n).toString().padStart(3, "0")}`;
};

async function readWithRetry(reader: ModelReader, req: { case_id: string; certificate: Uint8Array }) {
  for (let attempt = 0; ; attempt++) {
    try {
      const text = await reader.read(req);
      return { text, model: parseModelOutput(text) };
    } catch (e) {
      if (!(e instanceof ReaderError)) throw e;
      if (RETRYABLE.has(e.errorClass) && attempt < MAX_RETRIES) continue;
      throw e;
    }
  }
}

/** Steps 1-4: validation (throws InputRejected), text layer, model reading with bounded retry. */
export async function readCase(input: CaseInput): Promise<CaseReadings> {
  const now = input.now ?? (() => new Date());
  const timings: Record<string, string> = {};
  let t0 = process.hrtime.bigint();
  const cert = await validateCertificate(input.certificate);
  let delivery: { text: string; sha256: string } | null = null;
  let line: DeliveryLine | null = null;
  if (input.delivery_note) {
    delivery = validateDeliveryNote(input.delivery_note.bytes);
    const lines = parseDeliveryNote(delivery.text, input.delivery_note.name);
    line = input.delivery_line === null ? null : findLine(lines, input.delivery_line);
  }
  timings.validate = ms(t0);

  t0 = process.hrtime.bigint();
  const textLayer = extractTextLayer(cert.pdf.pages);
  timings.text_layer = ms(t0);

  t0 = process.hrtime.bigint();
  let model: ModelReading | null = null;
  let modelSha: string | null = null;
  let readerError: CaseReadings["reader_error"] = null;
  try {
    const r = await readWithRetry(input.reader, { case_id: input.case_id, certificate: cert.bytes });
    model = r.model;
    modelSha = sha256(new TextEncoder().encode(r.text));
  } catch (e) {
    if (!(e instanceof ReaderError)) throw e;
    const injected = input.reader.planted.some((p) => p.kind === "failure");
    readerError = { class: e.errorClass, detail: injected ? `INJECTED (mock, planted): ${e.message}` : e.message, injected };
  }
  timings.model_reading = ms(t0);

  const c: Case = {
    case_id: input.case_id,
    run_id: randomUUID(),
    created_at: now().toISOString(),
    status: readerError ? "error" : "processed",
    certificate_file_hash: cert.sha256,
    certificate_file_size: cert.size,
    delivery_file_hash: delivery?.sha256 ?? null,
    source_refs: [
      { channel: "model", page: null, fragment: `certificate.pdf sha256 ${cert.sha256}` },
      ...(line ? [line.source_ref] : []),
    ],
  };
  const reader = input.reader;
  return {
    case: c, delivery_line: line, text_layer: textLayer, model, model_output_sha256: modelSha, reader_error: readerError,
    reader: { reader_id: reader.reader_id, kind: reader.kind, model_id: reader.model_id, model_version: reader.model_version,
      vllm_version: reader.vllm_version, rocm_version: reader.rocm_version, calls: reader.calls, planted: reader.planted },
    timings, spec: input.spec, plausibility: input.plausibility, mode: input.mode,
  };
}

/** Steps 5-9: channels, coherence, rules, proposal, receipt. Pure with respect to its inputs. */
export function evaluateCase(readings: CaseReadings, confirmations: FieldConfirmation[] = []): CaseResult {
  for (const c of confirmations) validateConfirmation(c);
  const timings = { ...readings.timings };
  const t0 = process.hrtime.bigint();
  let evaluation: Evaluation | null = null;
  let decision: Decision;
  if (readings.model === null) {
    const err = readings.reader_error!;
    decision = readerErrorDecision(err.class, err.detail);
  } else {
    evaluation = evaluate({
      model: readings.model.fields, textLayer: readings.text_layer, deliveryLine: readings.delivery_line,
      spec: readings.spec, plausibility: readings.plausibility, confirmations,
    });
    decision = evaluation.decision;
  }
  timings.evaluation = ms(t0);
  const explanation = readings.model?.explanation
    ? { ...readings.model.explanation, used_for_decision: false as const }
    : null;
  const result: CaseResult = { readings, evaluation, decision, confirmations, explanation, receipt: undefined as never };
  result.receipt = buildReceipt(result, timings);
  return result;
}

export async function processCase(input: CaseInput, confirmations: FieldConfirmation[] = []): Promise<CaseResult> {
  return evaluateCase(await readCase(input), confirmations);
}

export class ConfirmationError extends Error {}

function validateConfirmation(c: FieldConfirmation) {
  if (!CRITICAL_FIELDS.includes(c.field)) throw new ConfirmationError(`cannot confirm unknown field "${c.field}"`);
  if (!c.confirmed_by?.trim()) throw new ConfirmationError("confirmation needs confirmed_by");
  if (!c.confirmed_at?.trim() || Number.isNaN(Date.parse(c.confirmed_at))) throw new ConfirmationError("confirmation needs confirmed_at (ISO time)");
  if (c.value !== null && NUMERIC_FIELDS.has(c.field) && normaliseDecimalText(c.value) === null) {
    throw new ConfirmationError(`confirmed value for ${c.field} must be a decimal string`);
  }
}

/** Re-runs coherence and rules with per-field human confirmations (register A-07, A-21). */
export function confirmFields(result: CaseResult, confirmations: FieldConfirmation[]): CaseResult {
  const merged = new Map(result.confirmations.map((c) => [c.field, c]));
  for (const c of confirmations) merged.set(c.field, c);
  return evaluateCase(result.readings, [...merged.values()]);
}

export class HumanDecisionError extends Error {}

/** Records the person's decision. The proposal is never changed by this; nothing else sets human_decision. */
export function recordHumanDecision(
  result: CaseResult,
  d: { action: HumanAction; reason: string; decided_by: string; decided_at: string },
): CaseResult {
  if (!["release", "block", "request_new_certificate"].includes(d.action)) throw new HumanDecisionError(`unknown action ${d.action}`);
  if (!d.reason?.trim()) throw new HumanDecisionError("a human decision needs a reason");
  if (!d.decided_by?.trim()) throw new HumanDecisionError("a human decision needs decided_by");
  if (Number.isNaN(Date.parse(d.decided_at))) throw new HumanDecisionError("a human decision needs decided_at (ISO time)");
  const decision: Decision = {
    ...result.decision, human_decision: d.action, decided_by: d.decided_by.trim(), decided_at: d.decided_at,
    decision_reason: d.reason.trim(),
  };
  const next: CaseResult = { ...result, decision };
  next.receipt = {
    ...result.receipt,
    human_decision: { action: d.action, by: decision.decided_by!, at: d.decided_at, reason: decision.decision_reason! },
  };
  return next;
}

function buildReceipt(r: CaseResult, timings: Record<string, string>): RunReceipt {
  const rd = r.readings;
  // The reader's own declaration covers failures, where no model output exists (finding F-01).
  const planted = rd.model?.planted ?? rd.reader.planted;
  const readingSource: RunReceipt["reading_source"] =
    rd.reader.kind === "live" ? "live" : planted.length > 0 ? "planted" : "mock";
  const fields = r.evaluation?.fields;
  return {
    receipt_schema: "certgate.receipt/1",
    case_id: rd.case.case_id,
    run_id: rd.case.run_id,
    created_at: rd.case.created_at,
    mode: rd.mode,
    reading_source: readingSource,
    reader: {
      reader_id: rd.reader.reader_id, reading_source: readingSource, model_id: rd.reader.model_id,
      model_version: rd.reader.model_version, vllm_version: rd.reader.vllm_version, rocm_version: rd.reader.rocm_version,
      calls: String(rd.reader.calls),
    },
    planted,
    status: rd.case.status,
    proposal: r.decision.proposal,
    reasons: r.decision.reasons,
    human_required: true,
    human_confirmation_required: r.decision.human_confirmation_required,
    human_decision: null,
    confirmations: r.confirmations.map((c) => ({
      ...c, read_value: fields?.get(c.field)?.read_value ?? null, reading_source: readingSource,
    })),
    channel_available: rd.text_layer.channel_available,
    timings_ms: timings,
    errors: rd.reader_error ? [rd.reader_error] : [],
    hashes: {
      certificate_sha256: rd.case.certificate_file_hash,
      certificate_size: rd.case.certificate_file_size,
      delivery_note_sha256: rd.case.delivery_file_hash,
      model_output_sha256: rd.model_output_sha256,
      spec_sha256: rd.spec.file_sha256,
    },
    rules_version: RULES_VERSION,
    plausibility_version: rd.plausibility.version,
    cev_formula_source: CEV_FORMULA_SOURCE,
    spec: { spec_id: rd.spec.spec_id, revision: rd.spec.version, grade: rd.spec.grade },
    delivery: rd.delivery_line ? { delivery_note: rd.delivery_line.delivery_note, line: rd.delivery_line.line } : null,
    values: fields
      ? [...fields.values()].map((f) => ({ field: f.key, value: f.value, unit: f.unit, source: `${f.state} (${f.source})` }))
      : [],
    channel_checks: r.evaluation?.channel_checks ?? [],
    rule_results: r.evaluation?.rule_results ?? [],
    notice: FICTITIOUS_NOTICE,
  };
}
