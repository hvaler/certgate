# CertGate

**CertGate prepares the review of a steel mill inspection certificate against a purchase specification, and
proposes release, block or review. A person in Quality decides.** CertGate never releases material on its own.

> **All data in this repository is fictitious.** Siderúrgica Valdemora S.A. (the mill), Talleres Ribera Norte
> S.L. (the buyer), the grade TRN-355 and the purchase specification ESP-014 are invented for the demo. The limits
> in ESP-014 belong to that fictitious company and are **not** the limits of any real standard.

## Problem and user

When a batch of steel arrives at a plant, it comes with a mill certificate (an inspection certificate of the
EN 10204 3.1 kind): heat or lot, grade, chemical composition and measured mechanical properties. Someone in
goods-in or Quality must check that the certificate belongs to that batch and that the values meet the purchase
specification. Today this is done by hand, with certificates in different layouts and sometimes scanned. Material
out of spec that reaches production means scrap, claims or a recall.

- **Primary user:** goods-in or Quality technician at a mid-size plant that buys certified material.
- **Who decides:** the Quality manager who signs the release or the block.

## What it does

For each case (certificate PDF plus its delivery-note line), CertGate:

1. Validates the files (PDF by magic bytes, size limits, not encrypted, has pages) and records their SHA-256.
2. Reads the certificate through two channels:
   - the **model channel** (`ModelReader`). **In this build it is a `MockReader` only**: it returns the dataset's
     prepared reading, and every output, receipt and log says `MOCK`. No model is called.
   - the **text layer** of a digital PDF, extracted without any model. A scan has no text layer, so its critical
     fields need human confirmation, and CertGate says so.
3. Compares the channels. A disagreement makes the field unknown and the case goes to review.
4. Checks internal coherence: heat or lot against the delivery note, expected units and scale jumps, and the
   printed carbon equivalent against one recomputed from the composition. The formula's source is cited in
   [docs/sources/cev-formula.md](docs/sources/cev-formula.md).
5. Applies deterministic, versioned rules against the spec, with exact decimals (never binary floating point).
6. Proposes `release`, `block` or `review`, records the person's decision (who, when, why) and exports a run
   receipt without secrets.

Proposal precedence: a heat mismatch means review; otherwise block > review > release. Release is proposed only
when no review or block condition holds. A scan is never proposed for release until a person has confirmed every
critical field.

## Status of this build (run certgate-001, Stage 1)

- Offline core only. **No real model and no AMD hardware are used.** `CERTGATE_MODE=real` has no adapter yet and
  fails visibly ("model endpoint not configured"); it never falls back to the mock.
- No web UI yet (Stage 2). No deployment. No evaluation metrics are claimed.
- The text-layer parser covers the two fictitious certificate layouts of the dataset, not arbitrary mill
  certificates (known gap).

## Run it

Requirements: Node.js 24 (local run) or Docker.

```sh
# Docker (no network needed at runtime)
docker build --no-cache -t certgate .
docker run --rm --network none -p 3000:3000 -e PORT=3000 certgate
curl -X POST http://localhost:3000/api/cases/cg-003/process

# One dataset case through the CLI, inside the image
docker run --rm --network none certgate node dist/src/cli.js process --case cg-003

# The full test suite inside the image
docker run --rm --network none certgate npx vitest run

# Local
npm ci
npm run build
npm test
node dist/src/cli.js list
node dist/src/cli.js process --case cg-001
```

### CLI

```
certgate list
certgate process --case <id>                              dataset case data/cases/<id>
certgate process --case-dir <dir> [--line <n>] [--delivery <csv>]
    <dir>/certificate.pdf, <dir>/reading.json (mock model output), <dir>/delivery.csv (or --delivery);
    the paired delivery line from --line or <dir>/case.json "delivery_line"
options:
  --out <file>                 also write the output to a file
  --receipt-only               print only the receipt JSON
  --confirm <field>=<value>    human confirmation of a critical field (repeatable; value "absent" = not on document)
  --confirmed-by <name>
  --decide <release|block|request_new_certificate> --reason <text> --decided-by <name>
exit codes: 0 processed (any proposal, including reader errors), 2 input rejected, 1 internal error
```

Field names for `--confirm`: `certificate_type`, `heat_or_lot`, `grade`, `chemistry.<C|Si|Mn|P|S|Cr|Ni|Mo|Cu|V>`,
`cev_printed`, `mechanical.<ReH|Rm|A|KV_1|KV_2|KV_3>`, `kv_temperature`, `inspection_stamp`. A confirmation
without a unit is taken in the field's expected unit.

### HTTP

| Method and path | Result |
|---|---|
| `GET /health` | status and mode |
| `GET /api/cases` | dataset case ids |
| `POST /api/cases/<id>/process` | summary and receipt of one dataset case |

### Configuration

Environment variables only; see [.env.example](.env.example) (no values in it; `.env` is ignored by git).

| Variable | Default | Meaning |
|---|---|---|
| `CERTGATE_MODE` | `mock` | `mock` (offline, dataset readings) or `real` (no adapter in this build) |
| `PORT` | `3000` | HTTP port |
| `CERTGATE_DATA_DIR` | `<repo>/data` | dataset directory |

Input limits: certificate PDF up to 10 MiB, delivery note up to 1 MiB.

## Dataset

30 fictitious certificates with planted faults, 25 digital and 5 scanned. The expected outcomes were written and
committed before any product code. Three certificates predate the kickoff; 27 were generated in this run. See
[data/README.md](data/README.md) for provenance, coverage and checksums.

## Reason codes

The codes of [data/expected/README.md](data/expected/README.md), plus these, raised by the product:

| Code | When | Effect |
|---|---|---|
| `TEXT_LAYER_MISSING:<field>` | The model channel read a field that the text layer does not contain | review |
| `RULE_NOT_EVALUABLE:<field>` | A spec rule's input is unknown | review |
| `NOT_A_NUMBER:<field>` | A numeric field holds text that is not a decimal | review |
| `READER_ERROR:invalid_output` | Model output parses as JSON but breaks the reading schema | review, status error |
| `READER_ERROR:endpoint_not_configured` | `CERTGATE_MODE=real` without an adapter | review, status error |

## Repository layout

```
src/        product code (TypeScript, Node 24)
test/       implementation tests (vitest), runnable offline
config/     band-defined plausibility ranges (not from any standard)
data/       fictitious dataset, spec ESP-014 r3, delivery notes
docs/       cited sources
tools/      dataset generator (Python, dev-time only)
```

## How it was built

CertGate is built by a four-seat band (analyst, implementer, adversary, auditor) of Claude Code agents. Claude
Code is how it is built. In the full product, the model that reads certificates is meant to run on AMD hardware;
this build contains no such reading.

## License

[MIT](LICENSE).
