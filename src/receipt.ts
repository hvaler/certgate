// Receipt export (03-DISENO step 9): JSON, without secrets, every numeric value a string.
import { assertNoNumbers } from "./strict-json.js";
import type { RunReceipt } from "./types.js";

export class ReceiptExportError extends Error {}

const SECRET_NAME = /(KEY|SECRET|TOKEN|PASSWORD|PASSWD|ACCESS_CODE|CREDENTIAL)/i;

/** Values of secret-looking environment variables; none of them may appear in an exported receipt. */
function secretValues(env: NodeJS.ProcessEnv): string[] {
  return Object.entries(env)
    .filter(([k, v]) => SECRET_NAME.test(k) && typeof v === "string" && v.length >= 6)
    .map(([, v]) => v as string);
}

export function exportReceipt(receipt: RunReceipt, env: NodeJS.ProcessEnv = process.env): string {
  const r = receipt as Partial<RunReceipt>;
  if (!["mock", "planted", "live", "live_no_reading"].includes(r.reading_source as string)) {
    throw new ReceiptExportError("receipt has no valid reading_source (mock, planted, live or live_no_reading)");
  }
  if (r.reader?.reading_source !== r.reading_source) throw new ReceiptExportError("receipt reader.reading_source mismatch");
  if ((r.reading_source === "mock" || r.reading_source === "planted") && !/^MOCK/.test(r.reader?.model_id ?? "")) {
    throw new ReceiptExportError("a mock receipt must carry the MOCK model label");
  }
  assertNoNumbers(receipt);
  const json = JSON.stringify(receipt, null, 2);
  for (const s of secretValues(env)) {
    if (json.includes(s)) throw new ReceiptExportError("receipt contains the value of a secret environment variable");
  }
  return json + "\n";
}
