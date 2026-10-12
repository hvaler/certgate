// Loads case inputs: a dataset case (data/cases/<id>) or an external case directory.
// Product code reads only inputs: certificate, delivery note, pairing and the mock model output. It never
// reads the dataset's expected outcomes or the pre-kickoff originals (register D1-12, auditor msg 3ca000f7).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadPlausibility, type Plausibility } from "./coherence.js";
import { getDataDir, type Mode } from "./config.js";
import { MockReader, UnconfiguredLiveReader, type ModelReader } from "./reader.js";
import { loadSpec } from "./spec.js";
import { parseStrictJson } from "./strict-json.js";
import type { CaseInput } from "./pipeline.js";
import type { Spec } from "./types.js";

export class CaseInputError extends Error {}

const FORBIDDEN_DIRS = ["expected", "origin"];

export const SPEC_FILE = "spec/ESP-014.r3.json";

function insideData(dataDir: string, rel: string): string {
  const full = path.resolve(dataDir, rel);
  const relative = path.relative(dataDir, full);
  const first = relative.split(path.sep)[0] ?? "";
  if (relative.startsWith("..") || path.isAbsolute(relative) || FORBIDDEN_DIRS.includes(first)) {
    throw new CaseInputError(`case input path not allowed: ${rel}`);
  }
  return full;
}

export function loadDefaultSpec(dataDir = getDataDir()): Spec {
  return loadSpec(insideData(dataDir, SPEC_FILE));
}

export function listDatasetCases(dataDir = getDataDir()): string[] {
  const dir = path.join(dataDir, "cases");
  return existsSync(dir) ? readdirSync(dir).filter((d) => existsSync(path.join(dir, d, "case.json"))).sort() : [];
}

function readerFor(mode: Mode, readingFile: string): ModelReader {
  // Real mode never falls back to the mock (register S1-19, D1-15).
  if (mode === "real") return new UnconfiguredLiveReader();
  if (!existsSync(readingFile)) throw new CaseInputError(`mock model output not found: ${path.basename(readingFile)}`);
  return MockReader.fromFile(readingFile);
}

export interface Shared {
  spec: Spec;
  plausibility: Plausibility;
  mode: Mode;
}

export function loadShared(mode: Mode, dataDir = getDataDir()): Shared {
  return { spec: loadDefaultSpec(dataDir), plausibility: loadPlausibility(), mode };
}

/** A dataset case: data/cases/<id>/{certificate.pdf, case.json, reading.json}. */
export function loadDatasetCase(id: string, shared: Shared, dataDir = getDataDir()): CaseInput {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new CaseInputError(`bad case id ${id}`);
  const dir = insideData(dataDir, path.join("cases", id));
  if (!existsSync(path.join(dir, "case.json"))) throw new CaseInputError(`unknown case ${id}`);
  const meta = parseStrictJson(readFileSync(path.join(dir, "case.json"), "utf8"), `${id}/case.json`) as Record<string, unknown>;
  const cert = typeof meta.certificate === "string" ? meta.certificate : "certificate.pdf";
  const note = typeof meta.delivery_note === "string" ? meta.delivery_note : null;
  const notePath = note ? insideData(dataDir, note) : null;
  return {
    case_id: id,
    certificate: readFileSync(path.join(dir, path.basename(cert))),
    delivery_note: notePath ? { name: path.basename(notePath), bytes: readFileSync(notePath) } : null,
    delivery_line: typeof meta.delivery_line === "string" ? meta.delivery_line : null,
    reader: readerFor(shared.mode, path.join(dir, "reading.json")),
    spec: shared.spec,
    plausibility: shared.plausibility,
    mode: shared.mode,
  };
}

/**
 * An external case directory: <dir>/certificate.pdf, <dir>/delivery.csv (or --delivery), <dir>/reading.json
 * (mock model output, same schema as the dataset). The paired line comes from --line or <dir>/case.json.
 */
export function loadExternalCase(
  dir: string,
  shared: Shared,
  opts: { line?: string | null; delivery?: string | null; caseId?: string | null } = {},
): CaseInput {
  const abs = path.resolve(dir);
  const certFile = path.join(abs, "certificate.pdf");
  if (!existsSync(certFile)) throw new CaseInputError("certificate.pdf not found in case directory");
  let line = opts.line ?? null;
  const metaFile = path.join(abs, "case.json");
  if (line === null && existsSync(metaFile)) {
    const meta = parseStrictJson(readFileSync(metaFile, "utf8"), "case.json") as Record<string, unknown>;
    if (typeof meta.delivery_line === "string") line = meta.delivery_line;
  }
  const deliveryFile = opts.delivery ? path.resolve(opts.delivery) : path.join(abs, "delivery.csv");
  return {
    case_id: opts.caseId ?? path.basename(abs),
    certificate: readFileSync(certFile),
    delivery_note: existsSync(deliveryFile) ? { name: path.basename(deliveryFile), bytes: readFileSync(deliveryFile) } : null,
    delivery_line: line,
    reader: readerFor(shared.mode, path.join(abs, "reading.json")),
    spec: shared.spec,
    plausibility: shared.plausibility,
    mode: shared.mode,
  };
}
