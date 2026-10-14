// Prize check (Stage 5, S5-11, R5.2 G-09): no README, DEPLOY.md, METRICS.md or public sentence may claim a prize,
// an award, a win, eligibility, qualification, an entry or a submission. Like the E-10 rule, it is checked per line
// and per clause (". ; #" end a clause), and a clause is accepted only when it carries a negation. The kickoff
// quote is accepted only inside quotation marks on a line that names its source (01-REGLAS).
export const PRIZE_WORDS = /\b(?:prizes?|awards?|awarded|winners?|win|wins|winning|eligib\w*|qualif\w*|entered|entry|submission|submitted|best use|google prize)\b/i;
const NEGATION = /\b(?:not|no|never|unavailable)\b/i;

/** Every clause of the text that names a prize-family word without a negation. */
export function prizeFindings(text) {
  const out = [];
  for (const raw of String(text).replace(/\r\n/g, "\n").split("\n")) {
    const line = /01-REGLAS/.test(raw) ? raw.replace(/"[^"]*"|“[^”]*”/g, "") : raw;
    for (const clause of line.split(/[.;#]/)) if (PRIZE_WORDS.test(clause) && !NEGATION.test(clause)) out.push(clause.trim());
  }
  return out;
}
