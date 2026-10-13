// SHA-256 of every dataset certificate (data/cases/*/certificate.pdf). Without a configured LIVE_ACCESS_CODE, live
// reading is limited to these files (R3.1 C-02 a): a visitor cannot send an arbitrary document to the endpoint.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getDataDir } from "../config.js";

let cached: Set<string> | null = null;

export function datasetCertificateHashes(dataDir = getDataDir()): Set<string> {
  if (cached) return cached;
  const dir = path.join(dataDir, "cases");
  const out = new Set<string>();
  for (const id of readdirSync(dir)) {
    const f = path.join(dir, id, "certificate.pdf");
    if (existsSync(f)) out.add(createHash("sha256").update(readFileSync(f)).digest("hex"));
  }
  return (cached = out);
}
