// Prize check (Stage 5, S5-11, R5.2 G-09; R5.5 E-17, R5.6 E-18, R5.7 E-19): fails closed. In README.md, DEPLOY.md,
// METRICS.md and public/, every sentence that contains a prize-family word is a finding, unless its exact text is
// on ALLOWED_PRIZE_CLAUSES, the allow-list the auditor reviews. A negation never excuses a sentence.
// - Each sentence is normalised before matching (E-18): Unicode NFKC; zero-width characters removed; markdown
//   emphasis markers inside a word removed; common Cyrillic and Greek look-alikes mapped to Latin letters. The
//   allow-list match is on the whole normalised sentence, exactly, so a listed sentence with anything added fails.
// - A sentence wrapped over two lines is checked line by line, so each part is a fragment that is not listed.
// - In public/*.js only string literals are checked (what the page can show); identifiers such as Object.entries
//   are code, not text (E-19 analyst note).
// - The kickoff quote is accepted only inside quotation marks on a line that names its source (01-REGLAS).
export const PRIZE_WORDS = new RegExp(
  "\\b(?:" + [
    "prizes?", "awards?", "awarded", "win", "wins", "won", "winning", "winners?", "eligib\\w*", "qualif\\w*",
    "enter", "entered", "entry", "entries", "submission", "submitted", "best use", "google prize",
    "contenders?", "challenges?", "compet\\w*", "finalists?", "shortlist\\w*", "runners?-up", "podium",
    "front-?runners?", "favou?rites?", "deserv\\w*", "rank\\w*", "placed", "place[ds]? (?:first|second|third|1st|2nd|3rd)",
    "honou?rable mentions?", "track", "hackathon",
  ].join("|") + ")\\b",
  "i",
);

// Cyrillic and Greek letters that look like Latin ones (lower and upper case).
const LOOKALIKE = {
  а: "a", в: "b", е: "e", к: "k", м: "m", н: "h", о: "o", р: "p", с: "c", т: "t", у: "y", х: "x", і: "i", ї: "i",
  ј: "j", ѕ: "s", ԁ: "d", ԛ: "q", ԝ: "w", ɡ: "g",
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H", О: "O", Р: "P", С: "C", Т: "T", У: "Y", Х: "X", І: "I", Ј: "J",
  Ѕ: "S", α: "a", β: "b", ε: "e", ι: "i", κ: "k", ν: "v", ο: "o", ρ: "p", τ: "t", υ: "u", χ: "x", γ: "y",
  Α: "A", Β: "B", Ε: "E", Ζ: "Z", Η: "H", Ι: "I", Κ: "K", Μ: "M", Ν: "N", Ο: "O", Ρ: "P", Τ: "T", Υ: "Y", Χ: "X",
};

/** E-18 normalisation of one sentence. */
export function normalise(s) {
  return String(s)
    .normalize("NFKC")
    .replace(/[​-‍﻿]/g, "")
    .replace(/[Ͱ-ϿЀ-ӿԀ-ԯɡ]/g, (c) => LOOKALIKE[c] ?? c)
    .replace(/(?<=[\p{L}\p{N}])[*_]+(?=[\p{L}\p{N}])/gu, "")
    .trim();
}

/** Exact (normalised) sentences that may contain a prize-family word, each with its reason. Reviewed by the auditor. */
export const ALLOWED_PRIZE_CLAUSES = new Map([
  ["This comparison makes no claim about any prize or award.", "README.md, Gemma section: states that no prize claim is made (S5-10)"],
  ["Enter at least one value.", "public/app.js: UI validation message of the confirmation form (\"enter\" = type in a value); product code is not changed in Stage 5"],
]);

/** The text of a checked file that the prize check reads: string literals only for public/*.js, else everything. */
export function prizeText(file, content) {
  const text = String(content).replace(/\r\n/g, "\n");
  if (!/\.m?js$/i.test(file)) return text;
  return [...text.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g)].map((m) => m[0].slice(1, -1)).join("\n");
}

/** Every sentence of the text, normalised, as the check sees it. */
export function prizeSentences(text) {
  const out = [];
  for (const raw of String(text).replace(/\r\n/g, "\n").split("\n")) {
    const line = /01-REGLAS/.test(raw) ? raw.replace(/"[^"]*"|“[^”]*”/g, "") : raw;
    for (const s of normalise(line).split(/(?<=[.!?])\s+/)) if (s.trim()) out.push(s.trim());
  }
  return out;
}

/** Every sentence (or line fragment) that contains a prize-family word and is not on the allow-list. */
export function prizeFindings(text) {
  return prizeSentences(text).filter((s) => PRIZE_WORDS.test(s) && !ALLOWED_PRIZE_CLAUSES.has(s));
}
