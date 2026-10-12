// Configuration comes only from environment variables (invariant I6). Every variable read here is listed,
// without a value, in .env.example; a test checks that the two lists match.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type Mode = "mock" | "real";

/** Repository root: the nearest ancestor holding package.json (works from src/ and from dist/src/). */
export const REPO_ROOT = (() => {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (!existsSync(path.join(dir, "package.json"))) {
    const up = path.dirname(dir);
    if (up === dir) throw new Error("repository root not found");
    dir = up;
  }
  return dir;
})();

/** Limits checked before any reading (register S1-11). */
export const MAX_CERTIFICATE_BYTES = 10 * 1024 * 1024;
export const MAX_DELIVERY_NOTE_BYTES = 1024 * 1024;

export function getMode(env: NodeJS.ProcessEnv = process.env): Mode {
  const m = (env.CERTGATE_MODE ?? "mock").trim().toLowerCase();
  if (m === "mock" || m === "real") return m;
  throw new Error(`CERTGATE_MODE must be "mock" or "real", got "${m}"`);
}

export function getPort(env: NodeJS.ProcessEnv = process.env): number {
  const raw = (env.PORT ?? "3000").trim();
  if (!/^\d{1,5}$/.test(raw)) throw new Error(`PORT must be an integer, got "${raw}"`);
  return Number.parseInt(raw, 10);
}

export function getDataDir(env: NodeJS.ProcessEnv = process.env): string {
  return path.resolve(env.CERTGATE_DATA_DIR ?? path.join(REPO_ROOT, "data"));
}

export function getConfigDir(): string {
  return path.join(REPO_ROOT, "config");
}
