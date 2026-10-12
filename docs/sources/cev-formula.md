# Source of the carbon equivalent (CEV) formula

CertGate recomputes the carbon equivalent printed on a certificate from its heat analysis (03-DISENO step 5). The
formula is taken from the source below, **not from memory**, and is implemented in `src/coherence.ts`
(`recomputeCev`).

## Source

- **Document:** Wikipedia, "Equivalent carbon content", revision `1354593332` (2026-05-17T08:32:22Z).
- **URL:** https://en.wikipedia.org/w/index.php?title=Equivalent_carbon_content&oldid=1354593332
- **Retrieved:** 2026-10-12T17:22Z by implementer-xwz4, via
  `https://en.wikipedia.org/w/index.php?title=Equivalent_carbon_content&action=raw`.
- **Primary references cited by that article for this formula:** J.F. Lancaster, *Metallurgy of Welding*, 6th ed.,
  Abington Publishing, 1999, p. 464 (Dearden and O'Neill formula, adopted by the IIW in 1967); V.B. Ginzburg and
  R. Ballas, *Flat Rolling Fundamentals*, CRC Press, 2000, pp. 141–142.

## Quoted text (wikitext of that revision, verbatim)

> The other and most popular formula is the Dearden and O'Neill formula, which was adopted by
> [[International Institute of Welding|IIW]] in 1967. [...] The formula is defined as follows:
>
> `:<math>CE = \%\text{C} + \frac{\%\text{Mn}}{6} + \frac{\%\text{Cr}+\%\text{Mo}+\%\text{V}}{5} + \frac{\%\text{Cu}+\%\text{Ni}}{15}</math>`

That is: **CEV = C + Mn/6 + (Cr + Mo + V)/5 + (Cu + Ni)/15**, with every element in % by mass.

The same article also gives an AWS formula with `(Mn + Si)/6`. CertGate does **not** use it: the fictitious
certificates print the IIW formula, and the pre-kickoff dataset notes (`data/origin/mini-prueba/README.md`) name
the IIW formula.

## How CertGate uses it

- The exact recomputed value (no rounding) is checked against the CEV maximum of the fictitious spec ESP-014
  (register A-02).
- For the coherence check only, the exact value is rounded to 0.01 with ROUND_HALF_EVEN and compared with the
  printed CEV (register A-20). A difference is a review trigger.
- If any input element is unknown, the recomputed CEV is unknown.

This file documents a formula. It does not import any limit from a real standard: the CEV maximum (0.45) belongs
to the fictitious specification ESP-014.
