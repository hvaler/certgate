// Auditor: count text-layer items and image operators per page of a PDF, with the repo's pdfjs-dist.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const [repo, pdfPath] = process.argv.slice(2);
const req = createRequire(repo + "/package.json");
const pdfjs = await import(pathToFileURL(req.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href);
const data = new Uint8Array(readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, useSystemFonts: false, isEvalSupported: false }).promise;
const OPS = pdfjs.OPS;
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  const text = tc.items.map((i) => i.str || "").join("").trim();
  const ol = await page.getOperatorList();
  const imgs = ol.fnArray.filter((f) => f === OPS.paintImageXObject || f === OPS.paintInlineImageXObject).length;
  console.log(JSON.stringify({ page: p, text_items: tc.items.length, text_chars: text.length, image_ops: imgs }));
}
console.log(JSON.stringify({ pages: doc.numPages }));
