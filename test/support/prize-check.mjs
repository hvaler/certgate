// Prize check (Stage 5, S5-11, R5.2 G-09): no README, DEPLOY.md, METRICS.md or public sentence may claim a prize,
// an award, a win, eligibility, qualification, an entry, a submission or a place in a challenge or competition.
// It is checked per line and per clause; ". ; # : ," and "but" end a clause. A clause is accepted only when a
// negation comes before the first prize word in that clause (ADV-S5-F01), so a negation of something else cannot
// excuse a claim. The kickoff quote is accepted only inside quotation marks on a line that names its source (01-REGLAS).
export const PRIZE_WORDS = /\b(?:prizes?|awards?|awarded|winners?|win|wins|winning|eligib\w*|qualif\w*|entered|entry|submission|submitted|best use|google prize|contenders?|challenges?|compet(?:e|es|ing|ition|itions|itor|itors)?)\b/i;
const NEGATION = /\b(?:not|no|never|without)\b/i;

/** Every clause of the text that names a prize-family word without a negation before it. */
export function prizeFindings(text) {
  const out = [];
  for (const raw of String(text).replace(/\r\n/g, "\n").split("\n")) {
    const line = /01-REGLAS/.test(raw) ? raw.replace(/"[^"]*"|“[^”]*”/g, "") : raw;
    for (const clause of line.split(/[.;#:,]|\bbut\b/i)) {
      const m = PRIZE_WORDS.exec(clause);
      if (m && !NEGATION.test(clause.slice(0, m.index))) out.push(clause.trim());
    }
  }
  return out;
}
