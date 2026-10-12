// Loads a delivery note (albarán) from CSV into DeliveryLine records. Values stay strings.
import type { DeliveryLine } from "./types.js";

export class DeliveryNoteError extends Error {}

const REQUIRED = ["albaran", "partida", "pedido_cliente", "colada", "calidad"] as const;

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, LF or CRLF line ends. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (quoted) throw new DeliveryNoteError("CSV: unterminated quoted field");
  if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

export function parseDeliveryNote(text: string, fileName: string): DeliveryLine[] {
  const rows = parseCsv(text);
  const header = rows[0];
  if (!header) throw new DeliveryNoteError(`${fileName}: empty delivery note`);
  const idx = (name: string) => header.indexOf(name);
  for (const col of REQUIRED) {
    if (idx(col) < 0) throw new DeliveryNoteError(`${fileName}: missing column "${col}"`);
  }
  return rows.slice(1).map((r, n) => {
    if (r.length !== header.length) {
      throw new DeliveryNoteError(`${fileName}: row ${n + 2} has ${r.length} fields, header has ${header.length}`);
    }
    const get = (c: string) => (idx(c) >= 0 ? (r[idx(c)] ?? "").trim() : "");
    for (const col of REQUIRED) {
      if (get(col) === "") throw new DeliveryNoteError(`${fileName}: row ${n + 2} has an empty "${col}"`);
    }
    return {
      delivery_note: get("albaran"),
      line: get("partida"),
      po_number: get("pedido_cliente"),
      heat_or_lot: get("colada"),
      grade_ordered: get("calidad"),
      quantity: get("piezas") || null,
      mass_kg: get("masa_kg") || null,
      source_ref: { channel: "delivery_note", page: null, fragment: `${fileName}, row ${n + 2} (partida ${get("partida")})` },
    };
  });
}

export function findLine(lines: DeliveryLine[], line: string): DeliveryLine | null {
  return lines.find((l) => l.line === line.trim()) ?? null;
}
