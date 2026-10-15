// Stage 8 (dispatch 6, amendment 1; R8.2 §8, L-17, CH8-17): the only product files that differ from feaadff under
// src/, public/, api/, data/ and config/, and the only new ones. test/stage8-live.test.ts pins every other file to its
// feaadff blob (test/fixtures/stage8-baseline.json) and checks that these sets equal the actual difference exactly.
// The earlier guards (b0ec67a6, 409fb69a) accept these files and nothing else.
export const STAGE8_MAY_CHANGE = new Set(["src/types.ts", "src/web/app.ts", "src/web/live-jobs.ts", "public/app.js"]);
export const STAGE8_NEW = new Set(["src/web/models.ts"]);
export const isStage8New = (p) => STAGE8_NEW.has(p);
