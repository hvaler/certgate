// PNG previews of the dataset certificates the site shows as "the original" (S7-03, S7-04, T7-03).
// - Scanned certificates: the PDF's own page image, the embedded image XObject decoded by pdf.js, re-encoded as PNG
//   without scaling or drawing.
// - Digital certificates: page 1 rendered by the pinned pdf.js (package-lock.json) at scale 2 on @napi-rs/canvas,
//   with pdf.js's bundled standard fonts and no system fonts; the same renderer as src/pdf.ts.
// The output is deterministic: run it twice and the bytes are identical. A test compares a fresh run with the files
// committed under data/previews/ and with the hashes listed in README.md.
//
//   node tools/previews.mjs            write data/previews/<id>.png and print "<sha256>  <id>.png" lines
//   node tools/previews.mjs --check    exit 1 if any committed preview differs from a fresh generation
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
/** The ids the site serves as originals: the three stories and the three sample certificates (S7-04 allow-list). */
export const PREVIEW_IDS = ["cg-001", "cg-002", "cg-003", "cg-004", "cg-005", "cg-010"];
const STANDARD_FONTS = path.join(path.dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts").replace(/\\/g, "/") + "/";

async function pdfjs() {
  return import(pathToFileURL(require.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href);
}

function toPng(width, height, rgba) {
  const { createCanvas } = require("@napi-rs/canvas");
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(width, height);
  img.data.set(rgba);
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

/** pdf.js image objects carry RGB (kind 2), RGBA (kind 3) or 1-bit (kind 1) data; returns RGBA. */
function rgbaOf(obj) {
  const { width, height, data, kind } = obj;
  if (kind === 3) return data;
  const out = new Uint8ClampedArray(width * height * 4);
  if (kind === 2) {
    for (let i = 0, j = 0; i < width * height; i++, j += 3) { out[i * 4] = data[j]; out[i * 4 + 1] = data[j + 1]; out[i * 4 + 2] = data[j + 2]; out[i * 4 + 3] = 255; }
    return out;
  }
  const rowBytes = (width + 7) >> 3;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const v = (data[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1 ? 255 : 0;
    const k = (y * width + x) * 4; out[k] = out[k + 1] = out[k + 2] = v; out[k + 3] = 255;
  }
  return out;
}

async function pageImage(page, lib) {
  const ops = await page.getOperatorList();
  const at = ops.fnArray.findIndex((f) => f === lib.OPS.paintImageXObject);
  if (at < 0) throw new Error("scanned certificate without a page image");
  const name = ops.argsArray[at][0];
  const obj = await new Promise((resolve) => (page.objs.has(name) ? resolve(page.objs.get(name)) : page.objs.get(name, resolve)));
  return toPng(obj.width, obj.height, rgbaOf(obj));
}

async function pageRender(page) {
  const { createCanvas } = require("@napi-rs/canvas");
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas.toBuffer("image/png");
}

export async function preview(id) {
  const c = JSON.parse(readFileSync(path.join(ROOT, "data", "cases", id, "case.json"), "utf8"));
  const lib = await pdfjs();
  const task = lib.getDocument({ data: new Uint8Array(readFileSync(path.join(ROOT, "data", "cases", id, "certificate.pdf"))), verbosity: 0, standardFontDataUrl: STANDARD_FONTS, useSystemFonts: false });
  try {
    const page = await (await task.promise).getPage(1);
    const png = c.certificate_kind === "scan" ? await pageImage(page, lib) : await pageRender(page);
    return { id, kind: c.certificate_kind === "scan" ? "scan: the PDF's own page image" : "digital: rendered by pdf.js", png };
  } finally {
    await task.destroy();
  }
}

const sha = (b) => createHash("sha256").update(b).digest("hex");

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  const dir = path.join(ROOT, "data", "previews");
  mkdirSync(dir, { recursive: true });
  let bad = 0;
  for (const id of PREVIEW_IDS) {
    const { png, kind } = await preview(id);
    const file = path.join(dir, `${id}.png`);
    if (check) {
      const same = existsSync(file) && Buffer.compare(readFileSync(file), png) === 0;
      if (!same) bad++;
      console.log(`${same ? "ok  " : "DIFF"} ${sha(png)}  ${id}.png (${kind})`);
    } else {
      writeFileSync(file, png);
      console.log(`${sha(png)}  ${id}.png (${kind})`);
    }
  }
  if (bad) process.exit(1);
}
