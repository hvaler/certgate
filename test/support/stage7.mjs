// Stage 7 (dispatch 5, R7.1 S7-07 / T7-01): the only changes the earlier byte-identity guards accept.
// - the recorded flag (T7-04): exactly two lines in the view of each story file, next to reading_source;
// - the new previews under data/previews/ (S7-03);
// - src/tools/build-stories.ts, which writes the flag (storyView).
// Everything else stays pinned as before.
export const STAGE7_MAY_CHANGE = new Set(["src/tools/build-stories.ts"]);
export const isStage7New = (p) => p.startsWith("data/previews/");
const STORY = /^public\/stories\/cg-00[123]\.json$/;
const FLAG = /\n {4}"reading_source": "live",\n {4}"recorded": true,\n {4}"recorded_at": "[^"\n]+",/;

/** The file's bytes as they were before Stage 7: for a story file, the two T7-04 lines removed (once, and only there). */
export function beforeStage7(p, buf) {
  if (!STORY.test(p)) return buf;
  const s = buf.toString("utf8");
  if (!FLAG.test(s)) return buf;
  return Buffer.from(s.replace(FLAG, '\n    "reading_source": "live",'), "utf8");
}

/** The evaluate body of the disabled-site golden, as it was before Stage 7 (the flag removed once, from the view). */
export function evaluateBeforeStage7(text) {
  return text.replace(/("reading_source":\s*"live",)\s*"recorded":\s*true,\s*"recorded_at":\s*"<time>",/, "$1");
}
