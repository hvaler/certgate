// Models a live reading may use (Stage 8, dispatch 6 and its amendment 1; register R8.0-R8.1). This is the one module
// under src/ and public/ that names a model id other than the configured MODEL_ID (A8-11, A8-18, L-06): the closed
// set of MEASURED models (an evaluation run in METRICS.md each), the EXPERIMENTAL models that passed one real probe in
// this stage (evidence under evidence/runs/certgate-001/stage-8/probes/), and the committed probe outcomes that give
// the "listed, not offered" reasons. Nothing here is read from the endpoint or the request: a model the endpoint
// lists, or a visitor names, can only be matched against these constants.

/** A measured model: its METRICS.md section and the evaluation runs that measured it (S8-01, L-16). */
export interface MeasuredModel {
  readonly id: string;
  readonly metrics_section: string;
  readonly runs: readonly string[];
}
/** An experimental model: one passing probe in this stage (S8-22, L-20); no CertGate figure applies to it. */
export interface ExperimentalModel {
  readonly id: string;
  readonly evidence: string;
  readonly probed_at: string;
}
/** A committed probe outcome that keeps a listed id out of the offer (A8-13, L-22, L-26). */
export interface ProbeOutcome {
  readonly id: string;
  readonly outcome: "probe_failed" | "not_chat";
  readonly evidence: string;
}

/** Code order is the offer order (A8-05): Qwen3.8-27B first (figures of record), then Gemma-4-31B-IT. */
export const MEASURED_MODELS: readonly MeasuredModel[] = [
  {
    id: "Qwen3.8-27B",
    metrics_section: "METRICS.md: Runs, Headline (the figures of record)",
    runs: ["evaluation/runs/real-candidate-dd557fd", "evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1"],
  },
  {
    id: "Gemma-4-31B-IT",
    metrics_section: "METRICS.md: Comparison run: Gemma-4-31B-IT (Stage 5)",
    runs: ["evaluation/runs/real-gemma-04100b9"],
  },
];

/** Filled only from probes that passed (tools/probe-models.mjs); a test ties every entry to its evidence file. */
export const EXPERIMENTAL_MODELS: readonly ExperimentalModel[] = [];

/** Probes that failed, and ids the committed /models snapshot marks as not a chat model. */
export const PROBE_OUTCOMES: readonly ProbeOutcome[] = [];

export const MODEL_CATALOG = { measured: MEASURED_MODELS, experimental: EXPERIMENTAL_MODELS, outcomes: PROBE_OUTCOMES };
export type ModelCatalog = { measured: readonly MeasuredModel[]; experimental: readonly ExperimentalModel[]; outcomes: readonly ProbeOutcome[] };

const asciiLower = (s: string) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());

/**
 * L-C1: the one identity rule for listing, the model_mismatch guard and the probe pass. `other` names `id` when the
 * two are equal ignoring ASCII case, or when `other` is exactly one `<provider>/` prefix followed by `id`. Nothing
 * else: "Qwen3.8-27B-FP8", "xQwen3.8-27B" and "a/b/Qwen3.8-27B" do not name "Qwen3.8-27B".
 */
export function sameModel(id: string, other: string): boolean {
  if (typeof id !== "string" || typeof other !== "string" || id === "") return false;
  const a = asciiLower(id);
  const b = asciiLower(other);
  if (a === b) return true;
  const slash = b.indexOf("/");
  return slash > 0 && slash === b.lastIndexOf("/") && b.slice(slash + 1) === a;
}

/** Exact match ignoring ASCII case, no trimming or folding (L-04); the constant's spelling is returned. */
function canonical(ids: readonly string[], given: unknown): string | null {
  if (typeof given !== "string" || given === "") return null;
  const g = asciiLower(given);
  return ids.find((id) => asciiLower(id) === g) ?? null;
}

/** Printable form of an id for the server log: never a control character, at most 100 characters. */
const logName = (s: string) => JSON.stringify(s.replace(/[^\x20-\x7e]/g, "?").slice(0, 100));

export interface Offer {
  /** Offered measured ids, in code order. */
  measured: string[];
  /** Offered experimental ids, in code order; never a measured id (L-C5). */
  experimental: string[];
  /** LIVE_MODELS was set (non-empty after trimming). */
  narrowed: boolean;
  /** Server-log lines naming ignored ids (S8-02); never sent in a response. */
  log: string[];
}

/**
 * S8-02, S8-03, S8-26, A8-01, L-13, L-28: without LIVE_MODELS the offer is MODEL_ID alone, if it is measured;
 * with it, the measured and experimental sets intersected with it. An empty intersection stays empty.
 */
export function computeOffer(modelId: string | null, liveModels: string | undefined, catalog: ModelCatalog = MODEL_CATALOG): Offer {
  const measuredIds = catalog.measured.map((m) => m.id);
  const experimentalIds = catalog.experimental.map((m) => m.id).filter((id) => canonical(measuredIds, id) === null);
  const log: string[] = [];
  const entries = [...new Set((liveModels ?? "").split(",").map((s) => s.trim()).filter((s) => s !== ""))];
  if (entries.length === 0) {
    const m = modelId === null ? null : canonical(measuredIds, modelId);
    if (modelId !== null && m === null) log.push(`[certgate] MODEL_ID ${logName(modelId)} is not a measured model; it is not offered for live reading`);
    return { measured: m ? [m] : [], experimental: [], narrowed: false, log };
  }
  const wanted = new Set<string>();
  for (const e of entries) {
    const c = canonical(measuredIds, e) ?? canonical(experimentalIds, e);
    if (c === null) log.push(`[certgate] LIVE_MODELS: ignored ${logName(e)} (not a measured or probed model)`);
    else wanted.add(c);
  }
  return {
    measured: measuredIds.filter((id) => wanted.has(id)),
    experimental: experimentalIds.filter((id) => wanted.has(id)),
    narrowed: true,
    log,
  };
}

/** The offered id a visitor's value names, with its group; null when it names none (L-04). */
export function resolveChoice(offer: Offer, given: unknown): { id: string; group: "measured" | "experimental" } | null {
  const m = canonical(offer.measured, given);
  if (m) return { id: m, group: "measured" };
  const x = canonical(offer.experimental, given);
  return x ? { id: x, group: "experimental" } : null;
}

export const isListed = (id: string, listed: readonly string[]) => listed.some((l) => sameModel(id, l));

/** S8-05, L-06, L-24: MODEL_ID if offered and listed, else the first listed measured id in code order; never (b). */
export function defaultModel(offer: Offer, modelId: string | null, listed: readonly string[]): string | null {
  const preferred = modelId === null ? null : canonical(offer.measured, modelId);
  if (preferred && isListed(preferred, listed)) return preferred;
  return offer.measured.find((id) => isListed(id, listed)) ?? null;
}

export const LISTED_TEXT = (t: string) => `listed by the endpoint, checked ${t}`;
export const UNLISTED_TEXT = (t: string) => `not listed by the endpoint now (checked ${t})`;
export const NOT_ENABLED_TEXT = "not enabled on this site";
export const NOT_EVALUATED_LABEL = "not evaluated";
export const ACK_TEXT = "this model is not evaluated; no figure of CertGate applies to it";
export const CHOICE_STATEMENT = "You can choose only the models CertGate has measured, and experimental models that passed a probe in this stage, and only while AMD Token Factory lists them now. The figures of CertGate apply only to the measured models.";
export const C_REASONS = {
  not_enabled: NOT_ENABLED_TEXT,
  probe_failed: "probe failed",
  not_chat: "not a chat model",
  no_image_probe: "no image probe",
} as const;
/** L-08: display caps for ids that come from the endpoint. */
export const MAX_SHOWN_IDS = 100;
export const MAX_ID_CHARS = 200;
const shown = (id: string) => (id.length > MAX_ID_CHARS ? `${id.slice(0, MAX_ID_CHARS)}… (truncated)` : id);

export interface ChoiceView {
  checked_at: string;
  statement: string;
  default: string | null;
  selectable: number;
  measured: { id: string; enabled: boolean; state: string; evaluated: true; metrics_section: string; runs: readonly string[] }[];
  experimental: { id: string; enabled: boolean; state: string; evaluated: false; label: string; acknowledgement: string; evidence: string; probed_at: string }[];
  listed_not_offered: { id: string; reason: string }[];
  not_shown: number;
}

/** The three groups of the live-reading screen from one probe snapshot (S8-04, S8-21…S8-23, L-26). */
export function choiceView(offer: Offer, modelId: string | null, listed: readonly string[], checkedAt: string, catalog: ModelCatalog = MODEL_CATALOG): ChoiceView {
  const measured = catalog.measured.map((m) => {
    const offered = offer.measured.includes(m.id);
    const isOn = isListed(m.id, listed);
    return {
      id: m.id, enabled: offered && isOn,
      state: !offered ? NOT_ENABLED_TEXT : isOn ? LISTED_TEXT(checkedAt) : UNLISTED_TEXT(checkedAt),
      evaluated: true as const, metrics_section: m.metrics_section, runs: m.runs,
    };
  });
  const experimental = catalog.experimental.filter((x) => offer.experimental.includes(x.id)).map((x) => {
    const isOn = isListed(x.id, listed);
    return {
      id: x.id, enabled: isOn, state: isOn ? LISTED_TEXT(checkedAt) : UNLISTED_TEXT(checkedAt), evaluated: false as const,
      label: `${NOT_EVALUATED_LABEL} · experimental · probed ${x.probed_at.slice(0, 10)}`, acknowledgement: ACK_TEXT, evidence: x.evidence, probed_at: x.probed_at,
    };
  });
  const claimed = (l: string) => catalog.measured.some((m) => sameModel(m.id, l)) || offer.experimental.some((id) => sameModel(id, l));
  const others = listed.filter((l) => !claimed(l));
  const reason = (l: string) => {
    if (catalog.experimental.some((x) => sameModel(x.id, l))) return C_REASONS.not_enabled;
    const o = catalog.outcomes.find((p) => sameModel(p.id, l));
    return o ? C_REASONS[o.outcome] : C_REASONS.no_image_probe;
  };
  const dflt = defaultModel(offer, modelId, listed);
  return {
    checked_at: checkedAt,
    statement: CHOICE_STATEMENT,
    default: dflt,
    selectable: measured.filter((m) => m.enabled).length + experimental.filter((x) => x.enabled).length,
    measured, experimental,
    listed_not_offered: others.slice(0, MAX_SHOWN_IDS).map((l) => ({ id: shown(l), reason: reason(l) })),
    not_shown: Math.max(0, others.length - MAX_SHOWN_IDS),
  };
}

/** The receipt's record of the model choice (S8-08, S8-24, L-C2, L-25). */
export function modelChoiceRecord(choice: { id: string; group: "measured" | "experimental" }, reported: string | null, listingCheckedAt: string, catalog: ModelCatalog = MODEL_CATALOG) {
  const m = catalog.measured.find((x) => x.id === choice.id);
  const x = catalog.experimental.find((e) => e.id === choice.id);
  const measured = choice.group === "measured" && m !== undefined;
  return {
    requested: choice.id,
    reported,
    group: measured ? "measured" as const : "experimental" as const,
    evaluated: measured,
    label: measured ? "evaluated: measured model" : NOT_EVALUATED_LABEL,
    figures: measured ? { metrics_section: m!.metrics_section, runs: [...m!.runs] } : null,
    probe_evidence: measured ? null : x?.evidence ?? null,
    listing_checked_at: listingCheckedAt,
  };
}
