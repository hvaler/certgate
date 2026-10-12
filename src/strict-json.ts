// Product data files (spec, readings, model outputs, receipts) hold every numeric value as a JSON string
// (register R1.1, S1-25). A JSON number anywhere in them is rejected, so no number is ever read as a float.

export class StrictJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StrictJsonError";
  }
}

/** Parses JSON and rejects the document if it contains any JSON number. */
export function parseStrictJson(text: string, what: string): unknown {
  let found: string | null = null;
  let value: unknown;
  try {
    value = JSON.parse(text, function (key, v) {
      if (typeof v === "number" && found === null) found = key === "" ? "(root)" : key;
      return v;
    });
  } catch (e) {
    throw new StrictJsonError(`${what}: not valid JSON (${(e as Error).message})`);
  }
  if (found !== null) {
    throw new StrictJsonError(`${what}: JSON number found at key "${found}"; numeric values must be strings`);
  }
  return value;
}

/** Throws if any value in the structure is a JavaScript number (used before exporting). */
export function assertNoNumbers(value: unknown, path = "$"): void {
  if (typeof value === "number") throw new StrictJsonError(`number at ${path}; numeric values must be strings`);
  if (Array.isArray(value)) value.forEach((v, i) => assertNoNumbers(v, `${path}[${i}]`));
  else if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) assertNoNumbers(v, `${path}.${k}`);
  }
}
