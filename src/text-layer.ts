// Text-layer channel: extracts the critical fields from a PDF's text layer by layout analysis, without any
// model (03-DISENO step 4, invariant I3). A field it cannot locate is unknown, never guessed. A text layer
// that states two different values for one field marks that field as a conflict (register A-16).
//
// Layout coverage (declared known gap): the label vocabulary below covers the two fictitious certificate
// layouts of the dataset (A: Spanish/English labels, decimal point; B: English labels, other order, decimal
// comma). It is not a general parser for arbitrary mill certificates.
import { normaliseDecimalText, decimalTextEqual } from "./decimal.js";
import { CHEMISTRY, NUMERIC_FIELDS, normaliseUnit, type FieldValue } from "./fields.js";
import type { TextItem } from "./pdf.js";

export const MIN_TEXT_CHARS = 20;

interface Line {
  y: number;
  items: TextItem[];
  text: string;
  page: number;
}

export interface TextLayerResult {
  channel_available: boolean;
  fields: Map<string, FieldValue>;
  conflicts: Map<string, string[]>;
}

const SCALAR_LABELS: Record<string, RegExp> = {
  heat_or_lot: /^(colada \/ heat no\.?|heat number|heat no\.?)$/i,
  grade: /^(calidad \/ grade|steel grade|grade)$/i,
  certificate_no: /^(nº certificado \/ certificate no\.?|certificate number)$/i,
};

const MECH_HEADERS: [string, RegExp][] = [
  ["ReH", /^(ReH|Yield strength)\s*(?:\(([^)]*)\))?$/i],
  ["Rm", /^(Rm|Tensile strength)\s*(?:\(([^)]*)\))?$/i],
  ["A", /^(A|Elongation(?: A5)?)\s*(?:\(([^)]*)\))?$/i],
];

/** Labels a hostile paragraph could use to state a duplicate value (register A-16). */
const DUPLICATE_LABELS: [string, string][] = [
  ...CHEMISTRY.map((e): [string, string] => [`chemistry.${e}`, e]),
  ["cev_printed", "CEV"],
  ["mechanical.ReH", "ReH|Yield strength"],
  ["mechanical.Rm", "Rm|Tensile strength"],
  ["mechanical.A", "A|Elongation(?: A5)?"],
];

function groupLines(pages: TextItem[][]): Line[] {
  const lines: Line[] = [];
  pages.forEach((items, p) => {
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
    for (const it of sorted) {
      const last = lines[lines.length - 1];
      if (last && last.page === p + 1 && Math.abs(last.y - it.y) <= 2) last.items.push(it);
      else lines.push({ y: it.y, items: [it], text: "", page: p + 1 });
    }
  });
  for (const l of lines) {
    l.items.sort((a, b) => a.x - b.x);
    l.text = l.items.map((i) => i.str.trim()).join(" ");
  }
  return lines;
}

function ref(line: Line, fragment: string, item?: TextItem) {
  return {
    channel: "text_layer" as const,
    page: String(line.page),
    fragment,
    x: item ? item.x.toFixed(1) : undefined,
    y: item ? item.y.toFixed(1) : line.y.toFixed(1),
  };
}

class Collector {
  fields = new Map<string, FieldValue>();
  conflicts = new Map<string, string[]>();

  add(key: string, fv: FieldValue) {
    const prev = this.fields.get(key);
    if (!prev) {
      this.fields.set(key, fv);
      return;
    }
    const same = NUMERIC_FIELDS.has(key)
      ? prev.value !== null && fv.value !== null && decimalTextEqual(prev.value, fv.value)
      : prev.value === fv.value;
    if (!same) {
      const vals = this.conflicts.get(key) ?? [String(prev.value)];
      vals.push(String(fv.value));
      this.conflicts.set(key, vals);
    }
  }
}

/** Values below a header line: the nearest line beneath it that holds numbers, matched by column x. */
function valuesUnder(lines: Line[], header: Line): Line | undefined {
  const i = lines.indexOf(header);
  for (let j = i + 1; j < lines.length; j++) {
    const l = lines[j]!;
    if (l.page !== header.page || header.y - l.y > 30) return undefined;
    if (l.items.some((it) => normaliseDecimalText(it.str) !== null)) return l;
  }
  return undefined;
}

function nearestItem(row: Line, x: number): TextItem | undefined {
  let best: TextItem | undefined;
  for (const it of row.items) {
    if (Math.abs(it.x - x) <= 20 && (!best || Math.abs(it.x - x) < Math.abs(best.x - x))) best = it;
  }
  return best;
}

function headingAbove(lines: Line[], header: Line): Line | undefined {
  const i = lines.indexOf(header);
  for (let j = i - 1; j >= 0; j--) {
    const l = lines[j]!;
    if (l.page !== header.page || l.y - header.y > 40) return undefined;
    if (/[A-ZÁÉÍÓÚ]{4,}/.test(l.text)) return l;
  }
  return undefined;
}

function numericField(raw: string | undefined, unit: string | null, r: ReturnType<typeof ref>): FieldValue {
  const v = raw === undefined ? null : normaliseDecimalText(raw);
  return v === null
    ? { value: null, unit, status: "unknown", source_ref: r, note: raw === undefined ? "no value under header" : `not a number: ${raw}` }
    : { value: v, unit, status: "read", source_ref: r };
}

export function extractTextLayer(pages: TextItem[][]): TextLayerResult {
  const chars = pages.flat().reduce((n, it) => n + it.str.replace(/\s/g, "").length, 0);
  if (chars < MIN_TEXT_CHARS) return { channel_available: false, fields: new Map(), conflicts: new Map() };

  const lines = groupLines(pages);
  const out = new Collector();
  const tableLines = new Set<Line>();

  // Scalar label / value rows.
  for (const line of lines) {
    for (const [key, re] of Object.entries(SCALAR_LABELS)) {
      const label = line.items.find((it) => re.test(it.str.trim()));
      if (!label) continue;
      const rest = line.items.filter((it) => it.x > label.x).map((it) => it.str.trim()).join(" ").trim();
      let value: string | null = rest || null;
      if (key === "grade" && value) value = /\b[A-Z]{2,}-\d{2,}\b/.exec(value)?.[0] ?? null;
      out.add(key, value === null
        ? { value: null, unit: null, status: "unknown", source_ref: ref(line, label.str.trim(), label) }
        : { value, unit: null, status: "read", source_ref: ref(line, label.str.trim(), label) });
    }
  }

  // Chemistry table: a header row holding most element symbols.
  const elementSet = new Set<string>(CHEMISTRY);
  for (const line of lines) {
    const heads = line.items.filter((it) => elementSet.has(it.str.trim()) || /^CEV(\s*\(IIW\))?$/.test(it.str.trim()));
    if (heads.length < 8) continue;
    tableLines.add(line);
    const heading = headingAbove(lines, line);
    const unit = heading && /%/.test(heading.text) ? "%" : null;
    const row = valuesUnder(lines, line);
    if (row) tableLines.add(row);
    for (const h of heads) {
      const name = h.str.trim().startsWith("CEV") ? "CEV" : h.str.trim();
      const key = name === "CEV" ? "cev_printed" : `chemistry.${name}`;
      const cell = row ? nearestItem(row, h.x) : undefined;
      out.add(key, numericField(cell?.str, unit, ref(line, `heat analysis header ${name}`, h)));
    }
  }

  // Mechanical table: headers carry their unit, which applies to the value below (register A-11).
  for (const line of lines) {
    const heads = line.items
      .map((it) => ({ it, m: MECH_HEADERS.map(([k, re]) => [k, re.exec(it.str.trim())] as const).find(([, m]) => m) }))
      .filter((h) => h.m);
    if (heads.length < 2) continue;
    tableLines.add(line);
    const row = valuesUnder(lines, line);
    if (row) tableLines.add(row);
    for (const { it, m } of heads) {
      const [prop, match] = m!;
      const unit = normaliseUnit(match?.[2] ?? null);
      const cell = row ? nearestItem(row, it.x) : undefined;
      out.add(`mechanical.${prop}`, numericField(cell?.str, unit, ref(line, `mechanical header ${it.str.trim()}`, it)));
    }
  }

  // Impact test table: specimen columns; temperature and unit come from the section heading.
  for (const line of lines) {
    const heads = line.items
      .map((it) => ({ it, m: /^(Probeta|Specimen)\s*([123])$/i.exec(it.str.trim()) }))
      .filter((h) => h.m);
    if (heads.length < 3) continue;
    tableLines.add(line);
    const heading = headingAbove(lines, line);
    const unit = heading && /\(J\)/.test(heading.text) ? "J" : null;
    const row = valuesUnder(lines, line);
    if (row) tableLines.add(row);
    for (const { it, m } of heads) {
      const cell = row ? nearestItem(row, it.x) : undefined;
      out.add(`mechanical.KV_${m![2]}`, numericField(cell?.str, unit, ref(line, `impact header ${it.str.trim()}`, it)));
    }
    const t = heading ? /([-−]?\s?\d+)\s*°\s*C/.exec(heading.text) : null;
    if (heading) tableLines.add(heading);
    out.add("kv_temperature", t
      ? numericField(t[1]!.replace(/\s/g, ""), "°C", ref(heading!, "impact test heading"))
      : { value: null, unit: null, status: "unknown", source_ref: ref(line, "impact test heading"), note: "no temperature" });
  }

  // Inspection stamp: "Sello: X" / "Stamp: X". Not printed at all = absent.
  let stampSeen = false;
  for (const line of lines) {
    const m = /\b(?:Sello|Stamp)\s*:\s*(\S+)/i.exec(line.text);
    if (m) {
      stampSeen = true;
      out.add("inspection_stamp", { value: m[1]!, unit: null, status: "read", source_ref: ref(line, "signature block") });
    }
  }
  if (!stampSeen) {
    out.fields.set("inspection_stamp", {
      value: null, unit: null, status: "absent", source_ref: { channel: "text_layer", page: "1", fragment: "signature block" },
      note: "no stamp in the text layer",
    });
  }

  // Certificate type (EN 10204 type label): numbers like 3.1 / 2.2 in the document title.
  for (const line of lines) {
    for (const it of line.items) {
      if (!/(certifica|informe|report|10204)/i.test(it.str)) continue;
      for (const m of it.str.matchAll(/(?<![\d.])(\d\.\d)(?![\d.])/g)) {
        out.add("certificate_type", { value: m[1]!, unit: null, status: "read", source_ref: ref(line, "document title", it) });
      }
    }
  }

  // Spoofed duplicates: a field label followed by a number outside the tables (register A-16).
  for (const line of lines) {
    if (tableLines.has(line)) continue;
    for (const [key, labels] of DUPLICATE_LABELS) {
      const re = new RegExp(`(?:^|\\s)(?:${labels})(?![\\p{L}\\d])(?:\\s*\\(([^)]*)\\))?\\s*[:=]?\\s*([-\\u2212]?\\d+(?:[.,]\\d+)?)(?=\\s|$)`, "u");
      const m = re.exec(line.text);
      if (!m) continue;
      out.add(key, numericField(m[2], normaliseUnit(m[1] ?? null), ref(line, "free text outside the tables")));
    }
  }

  return { channel_available: true, fields: out.fields, conflicts: out.conflicts };
}
