// Validates input files before any reading (register S1-11, A-17): type by magic bytes, size limits,
// encryption, page count. Records SHA-256 and size of each file.
import { createHash } from "node:crypto";
import { MAX_CERTIFICATE_BYTES, MAX_DELIVERY_NOTE_BYTES } from "./config.js";
import { openPdf, PdfOpenError, type OpenedPdf } from "./pdf.js";

export class InputRejected extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "InputRejected";
  }
}

export const sha256 = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

export interface ValidatedCertificate {
  bytes: Uint8Array;
  sha256: string;
  size: string;
  pdf: OpenedPdf;
}

const PDF_MAGIC = "%PDF-";

export async function validateCertificate(bytes: Uint8Array): Promise<ValidatedCertificate> {
  if (bytes.length === 0) throw new InputRejected("certificate file is empty", "empty_file");
  if (bytes.length > MAX_CERTIFICATE_BYTES) {
    throw new InputRejected(`certificate file exceeds ${MAX_CERTIFICATE_BYTES} bytes`, "file_too_large");
  }
  const head = Buffer.from(bytes.subarray(0, 1024)).toString("latin1");
  if (!head.startsWith(PDF_MAGIC)) throw new InputRejected("certificate is not a PDF (magic bytes)", "not_pdf");
  // An encrypted PDF may open without a password in pdf.js; reject it by its trailer entry as well.
  if (/\/Encrypt\s/.test(Buffer.from(bytes).toString("latin1"))) {
    throw new InputRejected("certificate PDF is encrypted", "encrypted_pdf");
  }
  let pdf: OpenedPdf;
  try {
    pdf = await openPdf(bytes);
  } catch (e) {
    if (e instanceof PdfOpenError) {
      const code = e.kind === "encrypted" ? "encrypted_pdf" : e.kind === "no_pages" ? "pdf_no_pages" : "pdf_unreadable";
      throw new InputRejected(e.message, code);
    }
    throw e;
  }
  return { bytes, sha256: sha256(bytes), size: String(bytes.length), pdf };
}

export function validateDeliveryNote(bytes: Uint8Array): { text: string; sha256: string } {
  if (bytes.length === 0) throw new InputRejected("delivery note is empty", "empty_file");
  if (bytes.length > MAX_DELIVERY_NOTE_BYTES) {
    throw new InputRejected(`delivery note exceeds ${MAX_DELIVERY_NOTE_BYTES} bytes`, "file_too_large");
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new InputRejected("delivery note is not UTF-8 text", "not_text");
  }
  if (text.includes("\u0000")) throw new InputRejected("delivery note is not text", "not_text");
  return { text, sha256: sha256(bytes) };
}
