// Loads the versioned purchase specification (fictitious ESP-014) from its file.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { normaliseDecimalText } from "./decimal.js";
import { parseStrictJson } from "./strict-json.js";
import type { Spec, SpecLimit } from "./types.js";

export class SpecError extends Error {}

const REQUIRED_LIMIT_FIELDS = ["C", "Si", "Mn", "P", "S", "Cu", "CEV", "ReH", "Rm", "A", "KV_media"];

function decimalOrNull(v: unknown, where: string): string | null {
  if (v === undefined) return null;
  if (typeof v !== "string" || normaliseDecimalText(v) === null) throw new SpecError(`${where}: not a decimal string`);
  return normaliseDecimalText(v);
}

export function parseSpec(text: string, fileSha256: string): Spec {
  const raw = parseStrictJson(text, "spec") as Record<string, unknown>;
  const limits = raw.limites as Record<string, Record<string, unknown>> | undefined;
  if (typeof raw.id !== "string" || typeof raw.revision !== "string" || typeof raw.calidad !== "string" || !limits) {
    throw new SpecError("spec: missing id, revision, calidad or limites");
  }
  const out: SpecLimit[] = [];
  let kvTemp: string | null = null;
  for (const [field, l] of Object.entries(limits)) {
    if (typeof l.unidad !== "string") throw new SpecError(`spec limit ${field}: missing unidad`);
    const min = decimalOrNull(l.min, `spec limit ${field}.min`);
    const max = decimalOrNull(l.max, `spec limit ${field}.max`);
    if (min === null && max === null) throw new SpecError(`spec limit ${field}: neither min nor max`);
    out.push({ field, min, max, unit: l.unidad });
    if (field === "KV_media") {
      const m = typeof l.temperatura === "string" ? /([-−]?\d+)\s*°\s*C/.exec(l.temperatura) : null;
      if (!m || !m[1]) throw new SpecError("spec limit KV_media: missing temperatura");
      kvTemp = normaliseDecimalText(m[1]);
    }
  }
  for (const f of REQUIRED_LIMIT_FIELDS) {
    if (!out.some((l) => l.field === f)) throw new SpecError(`spec: limit ${f} missing`);
  }
  const required = typeof raw.certificado_exigido === "string" ? /\b(\d\.\d)\b/.exec(raw.certificado_exigido) : null;
  if (!required || !required[1]) throw new SpecError("spec: certificado_exigido does not name a certificate type");
  return {
    spec_id: raw.id,
    version: raw.revision,
    grade: raw.calidad,
    limits: out,
    kv_temperature: kvTemp ?? "",
    required_certificate_type: required[1],
    document_rules: Array.isArray(raw.reglas_de_documento) ? raw.reglas_de_documento.map(String) : [],
    file_sha256: fileSha256,
    notice: typeof raw._aviso === "string" ? raw._aviso : "",
  };
}

export function loadSpec(file: string): Spec {
  const bytes = readFileSync(file);
  return parseSpec(bytes.toString("utf8"), createHash("sha256").update(bytes).digest("hex"));
}

export function limitOf(spec: Spec, field: string): SpecLimit | undefined {
  return spec.limits.find((l) => l.field === field);
}
