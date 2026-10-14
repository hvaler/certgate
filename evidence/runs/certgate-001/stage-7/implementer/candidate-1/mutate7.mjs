// Stage 7 mutants (T7-02 route guard, T7-04 flag, CH7-04 sample by bytes, CH7-05, S7-03), exact replacements.
// Usage: node mutate7.mjs <checkout> <id>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const [dir, id] = process.argv.slice(2);
const APP = "src/web/app.ts", STORIES = "src/tools/build-stories.ts", UI = "public/app.js", PREV = "tools/previews.mjs";
const M = {
  // T7-02: the request id reaches the filesystem
  g1_path_from_request: [[APP, "    const file = ORIGINALS.get(id);\n    if (file === undefined) return send(res, 404, { error: \"not found\" });", "    const file = path.join(getDataDir(), \"previews\", `${decodeURIComponent(id)}.png`);"]],
  g2_case_insensitive: [[APP, "    const file = ORIGINALS.get(id);", "    const file = ORIGINALS.get(id.toLowerCase());"]],
  g3_every_dataset_id: [[APP, "[...STORY_IDS, ...SAMPLE_IDS].map((id) => [id, path.join(getDataDir(), \"previews\", `${id}.png`)])", "readdirSync(path.join(getDataDir(), \"cases\")).map((id) => [id, path.join(getDataDir(), \"cases\", id, \"certificate.pdf\")] as [string, string])"], [APP, "import { existsSync, readFileSync, statSync } from \"node:fs\";", "import { existsSync, readdirSync, readFileSync, statSync } from \"node:fs\";"]],
  g4_suffix_stripped: [[APP, "const original = /^\\/api\\/originals\\/([^/]+)$/.exec(p);", "const original = /^\\/api\\/originals\\/([^/.]+)(?:\\.png)?$/.exec(p);"]],
  g5_no_nosniff: [[APP, "\"x-content-sha256\": createHash(\"sha256\").update(png).digest(\"hex\"), ...SECURITY_HEADERS });", "\"x-content-sha256\": createHash(\"sha256\").update(png).digest(\"hex\") });"]],
  g6_wrong_type: [[APP, "res.writeHead(200, { \"content-type\": \"image/png\", \"cache-control\": \"public, max-age=300\", \"x-content-sha256\"", "res.writeHead(200, { \"content-type\": \"application/octet-stream\", \"cache-control\": \"public, max-age=300\", \"x-content-sha256\""]],
  // CH7-04: the live original by a client id, or for any dataset hash
  b1_by_client_id: [[APP, "if (m === \"GET\" && bySha) return originalFile(ORIGINAL_BY_SHA256.get(bySha[1]!) ?? \"\", res);", "if (m === \"GET\" && bySha) return originalFile(ORIGINAL_BY_SHA256.get(bySha[1]!) ?? bySha[1]!, res);"]],
  b2_story_hashes_too: [[APP, "const ORIGINAL_BY_SHA256 = new Map<string, string>(SAMPLE_IDS.map(", "const ORIGINAL_BY_SHA256 = new Map<string, string>([...STORY_IDS, ...SAMPLE_IDS].map("]],
  b3_ui_every_upload_a_sample: [[UI, "sampleHashes.includes(sha) ? { by_certificate: sha } : { own: true }", "{ by_certificate: sha }"]],
  b4_ui_own_file_shows_image: [[UI, "if (!original || original.own) {", "if (!original) {"]],
  // T7-04 / CH7-07: the flag dropped, misplaced, or put on a live result
  f1_flag_dropped: [[STORIES, "    if (k === \"reading_source\") { out.recorded = true; out.recorded_at = rec.recorded_at; }\n", ""]],
  f2_flag_appended_on_evaluate: [[APP, "view: { ...sv, ...out.view, ...sv }", "view: { ...out.view, ...sv }"]],
  f3_flag_on_live: [[APP, "      return { kind: \"done\", result: { counted: true, ...out } };", "      return { kind: \"done\", result: { counted: true, ...out, view: { ...out.view, recorded: true } } };"]],
  f4_wrong_date: [[STORIES, "out.recorded_at = rec.recorded_at;", "out.recorded_at = new Date(0).toISOString();"]],
  // S7-03: previews no longer from the PDF's own page image
  p1_scan_rendered: [[PREV, "c.certificate_kind === \"scan\" ? await pageImage(page, lib) : await pageRender(page)", "await pageRender(page)"]],
};
for (const [file, from, to] of M[id] ?? (() => { console.error(`unknown ${id}`); process.exit(2); })()) {
  const p = path.join(dir, file);
  const s = readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  if (!s.includes(from)) { console.error(`${id}: pattern not found in ${file}`); process.exit(2); }
  writeFileSync(p, s.replace(from, to));
}
console.log(`${id} applied`);
