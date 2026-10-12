// Internal coherence of the document, without any model (03-DISENO step 5).
import { readFileSync } from "node:fs";
import path from "node:path";
import { getConfigDir } from "./config.js";
import { Dec, parseDecimal, roundCevForCoherence } from "./decimal.js";
import { parseStrictJson } from "./strict-json.js";

export const CEV_FORMULA_SOURCE =
  "IIW (Dearden and O'Neill): CEV = C + Mn/6 + (Cr+Mo+V)/5 + (Cu+Ni)/15; cited in docs/sources/cev-formula.md";

export const CEV_INPUTS = ["C", "Mn", "Cr", "Mo", "V", "Ni", "Cu"] as const;

/** Exact IIW carbon equivalent (docs/sources/cev-formula.md). Null if any input is unknown. */
export function recomputeCev(chem: Record<string, string | null>): Dec | null {
  const v: Record<string, Dec> = {};
  for (const e of CEV_INPUTS) {
    const d = parseDecimal(chem[e] ?? null);
    if (d === null) return null;
    v[e] = d;
  }
  return v.C!.plus(v.Mn!.div(6))
    .plus(v.Cr!.plus(v.Mo!).plus(v.V!).div(5))
    .plus(v.Cu!.plus(v.Ni!).div(15));
}

/** Coherence: printed CEV equals the recomputed value rounded to 0.01 half-even (register A-20). */
export function cevCoherent(printed: string, recomputed: Dec): boolean {
  const p = parseDecimal(printed);
  return p !== null && roundCevForCoherence(recomputed).eq(p);
}

export interface PlausibilityRange {
  min: string;
  max: string;
  unit: string;
}

export interface Plausibility {
  version: string;
  ranges: Record<string, PlausibilityRange>;
}

export function loadPlausibility(file = path.join(getConfigDir(), "plausibility.v1.json")): Plausibility {
  const raw = parseStrictJson(readFileSync(file, "utf8"), "plausibility ranges") as {
    version?: unknown;
    ranges?: Record<string, PlausibilityRange>;
  };
  if (typeof raw.version !== "string" || !raw.ranges) throw new Error("plausibility ranges: missing version or ranges");
  for (const [k, r] of Object.entries(raw.ranges)) {
    if (parseDecimal(r.min) === null || parseDecimal(r.max) === null) throw new Error(`plausibility ${k}: bad bounds`);
  }
  return { version: raw.version, ranges: raw.ranges };
}

export function plausible(p: Plausibility, key: string, value: Dec): boolean {
  const r = p.ranges[key];
  if (!r) return true;
  return value.gte(new Dec(r.min)) && value.lte(new Dec(r.max));
}

/** Exact comparison of two heat or lot numbers: equal after trimming whitespace only (S1-21). */
export function heatMatches(certificateHeat: string, deliveryHeat: string): boolean {
  return certificateHeat.trim() === deliveryHeat.trim();
}
