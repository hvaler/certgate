// Internal contract of CertGate (03-DISENO, "Contrato interno inicial"). These are product types, not a claim
// about any Evolus or vLLM schema. Every numeric value is a decimal string; absent optional data is null.

export interface SourceRef {
  /** "model" = model channel, "text_layer" = PDF text layer, "delivery_note", "spec", "human" */
  channel: "model" | "text_layer" | "delivery_note" | "spec" | "human";
  page: string | null;
  fragment: string;
  /** Position on the page for text-layer values (points, origin bottom-left), as strings. */
  x?: string;
  y?: string;
}

export type FieldStatus = "read" | "unknown" | "absent";

export interface ChemistryEntry {
  element: string;
  value: string | null;
  unit: string | null;
  source_ref: SourceRef;
}

export interface MechanicalEntry {
  property: string;
  value: string | null;
  unit: string | null;
  source_ref: SourceRef;
}

export interface Case {
  case_id: string;
  run_id: string;
  created_at: string;
  status: "processed" | "error" | "rejected";
  certificate_file_hash: string;
  certificate_file_size: string;
  delivery_file_hash: string | null;
  source_refs: SourceRef[];
}

/** The effective certificate after channel checks, coherence and human confirmation. Unknown = null. */
export interface Certificate {
  issuer: string | null;
  certificate_no: string | null;
  certificate_type: string | null;
  heat_or_lot: string | null;
  grade: string | null;
  dimensions: string | null;
  chemistry: ChemistryEntry[];
  cev_printed: string | null;
  mechanical: MechanicalEntry[];
  kv_temperature: string | null;
  inspection_stamp: string | null;
}

export interface DeliveryLine {
  delivery_note: string;
  line: string;
  po_number: string;
  heat_or_lot: string;
  grade_ordered: string;
  quantity: string | null;
  mass_kg: string | null;
  source_ref: SourceRef;
}

export interface SpecLimit {
  field: string;
  min: string | null;
  max: string | null;
  unit: string;
}

export interface Spec {
  spec_id: string;
  version: string;
  grade: string;
  limits: SpecLimit[];
  kv_temperature: string;
  required_certificate_type: string;
  document_rules: string[];
  file_sha256: string;
  notice: string;
}

export interface ChannelCheck {
  field: string;
  model_value: string | null;
  model_unit: string | null;
  text_layer_value: string | null;
  text_layer_unit: string | null;
  agree: boolean;
  channel_available: boolean;
  /** Why the field ended unknown or needs a person, when it does. */
  issue: "disagree" | "text_layer_missing" | "text_layer_conflict" | "no_second_channel" | null;
  human_confirmed: boolean;
  source_refs: SourceRef[];
}

export type RuleOutcome = "pass" | "fail" | "not_evaluable";

export interface RuleResult {
  rule_id: string;
  input_field_refs: string[];
  outcome: RuleOutcome;
  expected: string;
  observed: string | null;
  reason: string;
}

export type Proposal = "release" | "block" | "review";
export type HumanAction = "release" | "block" | "request_new_certificate";

export interface ReasonEntry {
  code: string;
  effect: "block" | "review" | "info";
  detail: string;
}

export interface FieldConfirmation {
  field: string;
  value: string | null;
  unit: string | null;
  confirmed_by: string;
  confirmed_at: string;
}

export interface Decision {
  proposal: Proposal;
  reasons: ReasonEntry[];
  evidence_refs: string[];
  /** Always true: CertGate only proposes; a person decides. */
  human_required: true;
  /** Scans: the critical fields still waiting for human confirmation (I3). */
  human_confirmation_required: string[];
  human_decision: HumanAction | null;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
}

export interface ReaderInfo {
  reader_id: string;
  reading_source: ReadingSource;
  /** For a mock: the MOCK label. For a live reading: the model id the endpoint reported, verbatim. */
  model_id: string;
  /** Live readings: the configured model id that was requested; null otherwise. */
  requested_model_id: string | null;
  model_version: string;
  vllm_version: string;
  rocm_version: string;
  calls: string;
}

export interface RunReceipt {
  receipt_schema: "certgate.receipt/1";
  case_id: string;
  run_id: string;
  created_at: string;
  mode: string;
  reading_source: ReadingSource;
  reader: ReaderInfo;
  planted: { kind: string; field: string | null; note: string }[];
  status: Case["status"];
  proposal: Proposal;
  reasons: ReasonEntry[];
  human_required: true;
  human_confirmation_required: string[];
  human_decision: { action: HumanAction; by: string; at: string; reason: string } | null;
  confirmations: (FieldConfirmation & { read_value: string | null; reading_source: string })[];
  channel_available: boolean;
  timings_ms: Record<string, string>;
  /** injected = true when the failure was planted by the mock (C11), never a real endpoint error. */
  /** Every failed reader attempt; recovered = a later bounded retry succeeded. */
  errors: { class: string; detail: string; injected: boolean; recovered: boolean }[];
  hashes: {
    certificate_sha256: string;
    certificate_size: string;
    delivery_note_sha256: string | null;
    model_output_sha256: string | null;
    spec_sha256: string;
  };
  rules_version: string;
  plausibility_version: string;
  cev_formula_source: string;
  spec: { spec_id: string; revision: string; grade: string };
  delivery: { delivery_note: string; line: string } | null;
  values: { field: string; value: string | null; unit: string | null; source: string }[];
  /** Both channels per critical field; disagreements stay visible (C8). */
  channel_checks: ChannelCheck[];
  rule_results: RuleResult[];
  /** Copy of the F1 panel data at reading time (S2-13). */
  f1: F1Snapshot;
  /** Live readings: the endpoint response id, created, model and usage as returned (R3.1 C-14); null for mock. */
  endpoint_response: Record<string, string | null> | null;
  /** Free text from the model channel, kept only as untrusted text; never used by the decision (I1, F2-04). */
  model_text: { text: string; references: string[]; planted: boolean; untrusted: true; used_for_decision: false } | null;
  notice: string;
}

/**
 * mock = MockReader, dataset reading; planted = mock with labelled planted deviations; live = a live endpoint
 * returned a reading; live_no_reading = a live attempt that read nothing (S2-31).
 */
export type ReadingSource = "mock" | "planted" | "live" | "live_no_reading";

/**
 * F1 "Runs on AMD" data. Every value is read from the configured endpoint (GET /models, GET /usage, the last
 * reading's reply); what the endpoint does not expose is said so, never filled from code (S3-08, S3-09).
 */
export interface F1Snapshot {
  /**
   * "not_captured_in_evaluation_run": a live reading whose F1 probe (GET /models, GET /usage) was not taken at
   * reading time. The reply's own values (model, tokens, cost, timing, rate-limit headers when recorded) are filled;
   * every other value says not_captured_in_evaluation_run. A live reading is never "off" (F3-01, I7).
   */
  state: "on" | "off" | "not_applicable_mock" | "not_captured_in_evaluation_run";
  /** Values not recorded at reading time (state not_captured_in_evaluation_run). */
  not_captured?: string[];
  checked_at: string | null;
  detail: string;
  /** Cited fact, not a measurement: the endpoint is AMD Token Factory, the AMD compute named by the event page. */
  endpoint_name: string | null;
  endpoint_source: string | null;
  endpoint_host: string | null;
  model_ids: string[];
  /** Model id in the last reading's reply, verbatim. */
  model_reported: string | null;
  gpu: string | null;
  rocm_version: string | null;
  vllm_version: string | null;
  latency_ms: string | null;
  last_reading_ms: string | null;
  completion_tokens: string | null;
  total_tokens: string | null;
  tokens_per_second: string | null;
  /** usage.cost of the last reading as reported by the endpoint; null when not reported (never zero). */
  cost_reported: string | null;
  cost_label: string;
  rate_limit_rpm: string | null;
  rate_limit_rpm_remaining: string | null;
  daily_spend_limit: string | null;
  daily_spend_used: string | null;
  daily_spend_remaining: string | null;
  usage_source: string | null;
  probe_cached: boolean;
}
