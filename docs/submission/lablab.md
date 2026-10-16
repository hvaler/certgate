# Text for the lablab form

The operator pastes each field below as it stands. Every sentence is in claims-map.json with its proof.

## Title

CertGate: mill certificates, a person decides

## Short description

CertGate reads a steel mill certificate (EN 10204 3.1) on AMD Token Factory, checks it against the purchase specification with deterministic rules and proposes release, block or review; a person decides. False conforming 0 of 18 in both Qwen3.8-27B runs.

## Long description

When steel arrives at a plant, it comes with a mill certificate, an inspection certificate of the EN 10204 3.1 kind. A goods-in or Quality technician must check by hand that it belongs to the batch and that every value meets the purchase specification.

CertGate prepares that check. The open model Qwen3.8-27B, served by AMD Token Factory, reads the page images of the certificate; live reading also offers Gemma-4-31B-IT and experimental models. On a digital PDF, a second channel without any model reads the text layer, and any disagreement sends the case to review. Deterministic, versioned rules with exact decimals then propose release, block or review, and a person decides.

On 27 evaluated fictitious certificates, in two independent Qwen3.8-27B runs, false conforming was 0 of 18 in both runs. Proposals equal to the expected proposal were 27 of 27 in the implementer run and 26 of 27 in the auditor's independent run. Fields read correctly were 591 of 594 in both runs. Of the 9 cases whose expected proposal is release, 9 of 9 were proposed release in the implementer run and 8 of 9 in the auditor's run. Sent to review without need: 0 of 9 in the implementer run and 1 of 9 in the auditor's run (cg-004, a decimal comma caught by the channel check). In a comparison run on AMD Token Factory, Gemma-4-31B-IT gave false conforming 0 of 18, 26 of 27 as expected and 591 of 594 fields correct.

The text-layer parser covers the two fictitious layouts of the dataset, not arbitrary mill certificates. A digital PDF in another layout gets no second channel and goes to review, like a scan: this is safe, but it reduces the saving.

Four agent seats built and verified CertGate with Claude Code: an analyst, an implementer, an adversary and an independent auditor, with the expected outcomes committed before any product code, mutation checks at every stage, the auditor's own real evaluation run, and a claims table linking every sentence to its proof. All data is fictitious.

## Additional Information

The operator gives the access code for live reading in this field of the form. It is not written in this repository.
