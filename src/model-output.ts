// Parses and validates the model channel's output (invariant I5: invalid model output never yields release).
import { CHEMISTRY, MECHANICAL, type FieldValue } from "./fields.js";
import { ReaderError } from "./reader.js";
import { parseStrictJson, StrictJsonError } from "./strict-json.js";

export interface PlantedEntry {
  kind: string;
  field: string | null;
  note: string;
}

export interface ModelReading {
  fields: Map<string, FieldValue>;
  /** Model free text. Kept for the record; it never influences the proposal (invariant I1). */
  explanation: { text: string; planted: boolean; references: string[] } | null;
  planted: PlantedEntry[];
}

const SCALARS = ["issuer", "certificate_no", "certificate_type", "date", "heat_or_lot", "grade", "dimensions",
  "cev_printed", "kv_temperature", "inspection_stamp"];
const STATUSES = new Set(["read", "unknown", "absent"]);

function invalid(msg: string): never {
  throw new ReaderError("invalid_output", `model output does not match the reading schema: ${msg}`);
}

function parseField(key: string, raw: unknown): FieldValue {
  if (raw === null || typeof raw !== "object") invalid(`${key} is not an object`);
  const f = raw as Record<string, unknown>;
  if (typeof f.status !== "string" || !STATUSES.has(f.status)) invalid(`${key}.status`);
  if (f.value !== null && typeof f.value !== "string") invalid(`${key}.value must be a string or null`);
  if (f.unit !== null && f.unit !== undefined && typeof f.unit !== "string") invalid(`${key}.unit`);
  if (f.status === "read" && (f.value === null || (f.value as string).trim() === "")) invalid(`${key}: read without value`);
  if (f.status !== "read" && f.value !== null) invalid(`${key}: ${String(f.status)} with a value`);
  const sr = (f.source_ref ?? {}) as Record<string, unknown>;
  return {
    value: f.value as string | null,
    unit: (f.unit as string | null | undefined) ?? null,
    status: f.status as FieldValue["status"],
    source_ref: {
      channel: "model",
      page: typeof sr.page === "string" ? sr.page : null,
      fragment: typeof sr.fragment === "string" ? sr.fragment : "",
    },
    note: typeof f.note === "string" ? f.note : undefined,
    planted: f.planted === true ? true : undefined,
  };
}

export function parseModelOutput(text: string): ModelReading {
  let doc: Record<string, unknown>;
  try {
    doc = parseStrictJson(text, "model output") as Record<string, unknown>;
  } catch (e) {
    if (e instanceof StrictJsonError && /not valid JSON/.test(e.message)) {
      throw new ReaderError("invalid_json", e.message);
    }
    throw new ReaderError("invalid_output", (e as Error).message);
  }
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) invalid("root is not an object");
  const fields = doc.fields as Record<string, unknown> | undefined;
  if (!fields || typeof fields !== "object") invalid("fields missing");
  const out = new Map<string, FieldValue>();
  for (const k of SCALARS) {
    if (!(k in fields)) invalid(`field ${k} missing`);
    out.set(k, parseField(k, fields[k]));
  }
  const chem = fields.chemistry as Record<string, unknown> | undefined;
  const mech = fields.mechanical as Record<string, unknown> | undefined;
  if (!chem || typeof chem !== "object") invalid("chemistry missing");
  if (!mech || typeof mech !== "object") invalid("mechanical missing");
  for (const e of CHEMISTRY) {
    if (!(e in chem)) invalid(`chemistry.${e} missing`);
    out.set(`chemistry.${e}`, parseField(`chemistry.${e}`, chem[e]));
  }
  for (const m of MECHANICAL) {
    if (!(m in mech)) invalid(`mechanical.${m} missing`);
    out.set(`mechanical.${m}`, parseField(`mechanical.${m}`, mech[m]));
  }
  let explanation: ModelReading["explanation"] = null;
  if (doc.explanation !== null && doc.explanation !== undefined) {
    const e = doc.explanation as Record<string, unknown>;
    if (typeof e.text !== "string") invalid("explanation.text");
    const refs = Array.isArray(e.references) ? e.references.filter((r): r is string => typeof r === "string") : [];
    explanation = { text: e.text, planted: e.planted === true, references: refs };
  }
  const planted: PlantedEntry[] = Array.isArray(doc.planted)
    ? doc.planted.map((p) => {
        const r = p as Record<string, unknown>;
        return { kind: String(r.kind), field: typeof r.field === "string" ? r.field : null, note: String(r.note ?? "") };
      })
    : [];
  return { fields: out, explanation, planted };
}
