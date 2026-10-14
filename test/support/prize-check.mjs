// Prize check (Stage 5, S5-11, R5.2 G-09, R5.5 E-17): fails closed. In README.md, DEPLOY.md, METRICS.md and
// public/, every sentence that contains a prize word is a finding, unless its exact text is on ALLOWED, the
// allow-list the auditor reviews. A negation never excuses a sentence. The kickoff quote is accepted only inside
// quotation marks on a line that names its source (01-REGLAS). A sentence wrapped over two lines is checked line by
// line, so each part is a fragment that is not on the allow-list and fails.
export const PRIZE_WORDS = new RegExp(
  "\\b(?:" + [
    "prizes?", "awards?", "awarded", "win(?:s|ning|ner|ners)?", "won", "eligib\\w*", "qualif\\w*", "entered", "entry",
    "submission", "submitted", "finalists?", "shortlist\\w*", "contenders?", "front-?runners?", "favou?rites?",
    "challenges?", "compet\\w*", "runners?-up", "podium", "rank\\w*", "placed", "honou?rable mentions?",
    "deserv\\w*", "track", "hackathon", "best use",
  ].join("|") + ")\\b",
  "i",
);

/** Exact sentences that may contain a prize word, each with its reason. Reviewed by the auditor (G-09, E-17). */
export const ALLOWED = new Map([
  ["This comparison makes no claim about any prize or award.", "README, Gemma section: states that no prize claim is made (S5-10)"],
]);

/** Every sentence (or line fragment) of the text that contains a prize word and is not on the allow-list. */
export function prizeFindings(text) {
  const out = [];
  for (const raw of String(text).replace(/\r\n/g, "\n").split("\n")) {
    const line = /01-REGLAS/.test(raw) ? raw.replace(/"[^"]*"|“[^”]*”/g, "") : raw;
    for (const s of line.split(/(?<=[.!?])\s+/)) {
      const sentence = s.trim();
      if (PRIZE_WORDS.test(sentence) && !ALLOWED.has(sentence)) out.push(sentence);
    }
  }
  return out;
}
