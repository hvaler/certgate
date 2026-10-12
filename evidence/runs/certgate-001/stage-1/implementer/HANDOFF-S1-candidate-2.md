# Stage 1 candidate 2 (repair cycle 1 of 5): implementer handoff record

To: @hugo.valer/analyst-xwz3, @hugo.valer/adversary-xwz5, @hugo.valer/auditor-xwz6 · From: @hugo.valer/implementer-xwz4
Run certgate-001 · Stage 1 · Register **R1.6** (commit 0daa1894, SHA-256 adbae778…fc9c; obligations as in R1.5)
Repair task: analyst msgs 8e511ad4 … c55dd273 (parts 1–7) and addendum 902fef8f. Findings: auditor verdict
aa40a9af (F-01, F-02), addendum 33c884aa (F-05 = ADV-S1-F01), adversary bundle 90b39eda (ADV-S1-F01..F03).

The complete task and specification travel with the room handoff, which has 7 numbered parts. A success statement
here is a claim, not acceptance.

## Candidate (FROZEN)

| | |
|---|---|
| Candidate commit | `9d0449917b237ab5de51ccf1141b772e5c0e7008` |
| Product tree | `e65caa5b420d833bac8e9037db45688239f6e4f6` |
| Input revision (preserved, not rewritten) | candidate 1 `31335ee13944563a0eb559f6d1125efe94f598c9` |
| Repair commits on top of 31335ee1 | `dbeec4b` (F-01, F-02, F-04), `d17879f` (F-03, evidence only), `9d044991` (ADV-S1-F01/F-05, ADV-S1-F02, O1) |
| Dataset commit | unchanged: `4ebd95333e3bb486cb79c62fc6bd7a2e025379e9` (no `data/` file changed since) |
| Commit date | 9d044991 at 2026-10-12T17:56:19Z, after kickoff |
| Working tree | clean for product paths |

## Findings and repairs

| Finding | Reproduced on 31335ee1 | Cause | Repair | Regression test (fails on 31335ee1, passes on 9d044991) |
|---|---|---|---|---|
| **F-01** [REJECT] / ADV-S1-F03: injected failures not labelled planted | yes. cg-023 and cg-027: `reading_source mock`, `planted 0` | receipt took `planted` only from the model output, which is null when the reader fails | `ModelReader.planted` declares the reader's planted deviations. Receipts of injected failures have `reading_source: "planted"` (top level and `reader`), the `failure` entry in `planted[]`, `errors[].injected: true` and detail prefix `INJECTED (mock, planted)`. Real-mode errors: `injected: false`, `planted: []` | reader.test "… labels the injected failure as planted in structural fields (finding F-01)", ×5 classes; real-mode assertions |
| **F-02** [REJECT]: README `--network none -p` + curl | yes, by reading. No port can be published with `--network none` | doc error | Published-port example without `--network none`; separate fully offline example querying from inside the container | static.test "no README command publishes a port under --network none (finding F-02)", plus **every README command run as written**: `repair-1/readme-commands.txt` |
| **F-03** (non-blocking): cited logs ignored by `*.log` | yes. `git check-ignore -v` → `.gitignore:22:*.log` | — | candidate-1 logs force-added in d17879f, unchanged (hashes as cited). New logs use `.txt` | `git ls-files evidence/runs/certgate-001/stage-1/implementer` (listed in the room handoff) |
| **F-04** (non-blocking): real-mode CLI note says MOCK | yes | fixed note string | note derived from `reading_source` and mode | entrypoints.test "in real mode the summary note does not claim a MOCK reading (finding F-04)", "mock and planted notes say MOCK" |
| **F-05 = ADV-S1-F01** [REJECT]: mutants M13 and M14 survive | yes, per adversary and auditor (175/175 pass under both) | float detection relied on a token scan only | behavioural tests A26, A25 and A16 | rules.test "A26 …", "A25 …", "A16 …". **Kill check:** each mutant's diff applied to 9d044991 on throwaway branch `throwaway/mutant-check` in my scratch clone (never committed or merged). M13 → 1 failed (A26), M14 → 1 failed (A25). Logs `repair-1/mutant-*-on-9d044991.txt`, diffs `repair-1/mutant-*.diff` |
| **ADV-S1-F02** (low): malformed external `reading.json` → exit 1, no receipt | yes (by cause: constructor parse outside the reader-error path) | MockReader parsed in its constructor | routed into the reader-error path (I5 "model output is invalid"). A JSON number gives `READER_ERROR:invalid_output`, invalid JSON gives `READER_ERROR:invalid_json`. Both have status error, review, a receipt, exit 0 (processed), `injected: false`. README exit-code text unchanged: a processed case includes reader errors | entrypoints.test "a mock output with a JSON number or invalid JSON is invalid model output …" |
| **O1** (optional, taken): `persistent:false` ignored | — | — | non-persistent injected failure fails the first call only, so a bounded retry succeeds | reader.test "a non-persistent injected failure succeeds on retry: 2 calls …" |

O2 (real mode reading_source "live") is unchanged. It is known gap 3 and goes to Stage 2 (I7). O3 (lowercase `mpa`, duplicate JSON keys) is not taken, being beyond contract.

## Commands

As candidate 1, with candidate `9d0449917b237ab5de51ccf1141b772e5c0e7008`:

```sh
git clone C:\nexus\dev\certgate certgate-review && cd certgate-review && git checkout 9d0449917b237ab5de51ccf1141b772e5c0e7008
npm ci && npm run build && npx vitest run
docker build --no-cache -t certgate:9d04499 .
docker run --rm --network none certgate:9d04499 npx vitest run                                    # (a) suite in image, offline
docker run --rm --network none certgate:9d04499 node dist/src/cli.js process --case cg-003        # (b) named case
docker run --rm --network none -v <dir>:/case:ro certgate:9d04499 node dist/src/cli.js process --case-dir /case --line <n>
```

The README "Run it" block was run as written: `repair-1/readme-commands.txt`.

## Own results (implementer; not independent verification)

| Run | Result | Artifact (SHA-256) |
|---|---|---|
| Clean clone at 9d044991: `npm ci && npm run build && npx vitest run` | 9 files, **188 passed**, 0 failed, 0 skipped | `repair-1/local-clean-clone-tests.txt` `5388b4a314d8323df4f334ad1b6a625f9785cd5eaf2970fe2976fc7e5ebacbc0` |
| `docker build --no-cache -t certgate .` | exit 0, image `sha256:23b7ebb6…09f4` | `repair-1/docker-build-no-cache.txt` `58cb1692915841d32c95f6843e387b959ccef3330821ef7a2a269f32e252166d` |
| Every README command (published port + curl, offline in-container query, CLI case, suite in image `--network none`, local npm and CLI) | all exit 0. Suite in image: **188 passed**. curl and in-container query return proposal review for cg-003 | `repair-1/readme-commands.txt` `81b97e75d9ec795a5d2fa775c66630ce0b84fb752a9e4fb2e330f9546f1feb8c` |
| M13 diff on 9d044991 | **killed**: 1 failed (A26) | `repair-1/mutant-M13-stealth-float-limits-on-9d044991.txt` `adef44737d90c086212dd8993e7ddd64ec003615fdb62a7a34349b13be78d323` |
| M14 diff on 9d044991 | **killed**: 1 failed (A25) | `repair-1/mutant-M14-stealth-float-cev-on-9d044991.txt` `0b3d8787e5ed913d49fdbea2675174eac65ae5106a5ce5aa143cace48c3f0b81` |
| New regression tests on 31335ee1 source | 9 failed, 174 passed (F-01 ×5, real-mode labels, F-02, F-04 ×2). Run in scratch clone of 31335ee1; not committed | reported in room msg 0bcc2775 |

## Mapping changes since candidate 1

S1-18/A-18 and S1-20/D1-05/A-14 gain F-01, O1 and ADV-S1-F02 (src/reader.ts, src/pipeline.ts, src/types.ts
`errors[].injected`). S1-25/S1-40 gain behavioural float guards (test/rules.test.ts A25, A26, A16). S1-01 gains
the README run block (F-02). S1-45 gains committed logs (F-03). All other rows are as in HANDOFF-S1-candidate-1.md.

## Known gaps

Unchanged from candidate 1, items 1–9, with item 3 (real-mode `reading_source: "live"`) now also adversary O2.

## Time and usage

Candidate 2 committed at 17:56:19Z; clean-clone verification started at 17:57:57Z and finished by about 18:05Z. Stage 1
implementer total is about 62 minutes. Token and cost usage: unknown, because there is no per-seat meter. Model: claude-opus-5-5.
