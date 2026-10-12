// Field catalogue shared by both reading channels.
import type { FieldStatus, SourceRef } from "./types.js";

export const CHEMISTRY = ["C", "Si", "Mn", "P", "S", "Cr", "Ni", "Mo", "Cu", "V"] as const;
export const MECHANICAL = ["ReH", "Rm", "A", "KV_1", "KV_2", "KV_3"] as const;

/** Critical fields: every field feeding a rule or a coherence check (D1-10, A-05, A-06). */
export const CRITICAL_FIELDS: readonly string[] = [
  "certificate_type",
  "heat_or_lot",
  "grade",
  ...CHEMISTRY.map((e) => `chemistry.${e}`),
  "cev_printed",
  ...MECHANICAL.map((m) => `mechanical.${m}`),
  "kv_temperature",
  "inspection_stamp",
];

export const NUMERIC_FIELDS = new Set<string>([
  ...CHEMISTRY.map((e) => `chemistry.${e}`),
  "cev_printed",
  ...MECHANICAL.map((m) => `mechanical.${m}`),
  "kv_temperature",
]);

/** Fields that may legitimately be absent from a certificate without becoming unknown. */
export const MAY_BE_ABSENT = new Set<string>(["cev_printed", "inspection_stamp"]);

/** Expected units (D1-11). MPa and N/mm² are equivalent; anything else is unexpected. */
export const EXPECTED_UNITS: Record<string, string[]> = {
  ...Object.fromEntries(CHEMISTRY.map((e) => [`chemistry.${e}`, ["%"]])),
  cev_printed: ["%"],
  "mechanical.ReH": ["MPa", "N/mm²"],
  "mechanical.Rm": ["MPa", "N/mm²"],
  "mechanical.A": ["%"],
  "mechanical.KV_1": ["J"],
  "mechanical.KV_2": ["J"],
  "mechanical.KV_3": ["J"],
  kv_temperature: ["°C"],
};

export function normaliseUnit(u: string | null): string | null {
  if (u === null) return null;
  const s = u.trim().replace(/\s+/g, "");
  if (s === "") return null;
  if (/^N\/mm(²|2|\^2)$/i.test(s)) return "N/mm²";
  if (/^MPa$/i.test(s)) return "MPa";
  if (s === "%" || /^wt%$/i.test(s)) return "%";
  if (/^°?C$/.test(s) || s === "ºC") return "°C";
  if (s === "J") return "J";
  return s;
}

/** Units that mean the same quantity for channel comparison. */
export function unitsEquivalent(a: string | null, b: string | null): boolean {
  const x = normaliseUnit(a);
  const y = normaliseUnit(b);
  if (x === y) return true;
  const mpa = new Set(["MPa", "N/mm²"]);
  return x !== null && y !== null && mpa.has(x) && mpa.has(y);
}

export interface FieldValue {
  value: string | null;
  unit: string | null;
  status: FieldStatus;
  source_ref: SourceRef;
  note?: string;
  planted?: boolean;
}
