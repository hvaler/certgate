// Exact decimal arithmetic for every comparison and computation (invariant I4).
// Values enter as strings and go straight to Decimal; binary floating point is never used for data.
import { Decimal as DecimalJs } from "decimal.js";

export const Dec = DecimalJs.clone({ precision: 50, rounding: DecimalJs.ROUND_HALF_EVEN });
export type Dec = InstanceType<typeof Dec>;

const DECIMAL_TEXT = /^[+-]?\d+(?:[.,]\d+)?$/;

/** Normalises a printed number ("0,16", "−20", " 392 ") to canonical text, or null if it is not a plain decimal. */
export function normaliseDecimalText(raw: string): string | null {
  const s = raw.trim().replace(/−/g, "-").replace(",", ".");
  return DECIMAL_TEXT.test(s) ? s : null;
}

/** Parses a decimal string. Returns null for anything that is not a plain decimal (no exponents, no NaN). */
export function parseDecimal(raw: string | null | undefined): Dec | null {
  if (typeof raw !== "string") return null;
  const s = normaliseDecimalText(raw);
  return s === null ? null : new Dec(s);
}

/** Exact numeric equality after normalising representation ("0.020" equals "0.02"). */
export function decimalTextEqual(a: string, b: string): boolean {
  const x = parseDecimal(a);
  const y = parseDecimal(b);
  return x !== null && y !== null && x.eq(y);
}

/** Rounds to 0.01 with ROUND_HALF_EVEN; used only by the CEV coherence check (register A-20). */
export function roundCevForCoherence(v: Dec): Dec {
  return v.toDecimalPlaces(2, Dec.ROUND_HALF_EVEN);
}
