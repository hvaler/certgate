// PDF access through pdf.js (pdfjs-dist), a text extractor with no model involved. Runs fully offline.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

export interface TextItem {
  str: string;
  x: number; // layout geometry only; never used as data values
  y: number;
}

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
let pdfjsPromise: Promise<PdfJs> | null = null;

function pdfjs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    const require = createRequire(import.meta.url);
    const entry = require.resolve("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjsPromise = import(pathToFileURL(entry).href) as Promise<PdfJs>;
  }
  return pdfjsPromise;
}

export class PdfOpenError extends Error {
  constructor(message: string, readonly kind: "encrypted" | "no_pages" | "unreadable") {
    super(message);
  }
}

export interface OpenedPdf {
  numPages: number;
  pages: TextItem[][];
}

export async function openPdf(bytes: Uint8Array): Promise<OpenedPdf> {
  const lib = await pdfjs();
  const task = lib.getDocument({
    data: new Uint8Array(bytes),
    verbosity: 0,
    disableFontFace: true,
    useSystemFonts: false,
    stopAtErrors: true,
  });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    const name = (e as { name?: string }).name ?? "";
    if (name === "PasswordException") throw new PdfOpenError("certificate PDF is encrypted", "encrypted");
    throw new PdfOpenError(`certificate PDF cannot be opened: ${(e as Error).message}`, "unreadable");
  }
  try {
    if (doc.numPages < 1) throw new PdfOpenError("certificate PDF has no pages", "no_pages");
    const pages: TextItem[][] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const items: TextItem[] = [];
      for (const it of content.items) {
        if ("str" in it && it.str.trim() !== "") {
          items.push({ str: it.str, x: it.transform[4] as number, y: it.transform[5] as number });
        }
      }
      pages.push(items);
    }
    return { numPages: doc.numPages, pages };
  } finally {
    await task.destroy();
  }
}
