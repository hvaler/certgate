# Auditor decision — certgate-001 · Stage 1 · candidate 2

- **Run / stage:** certgate-001 · Stage 1 (offline core, **mock path only**)
- **Auditor and seat ID:** auditor-xwz6 (`hugo.valer/auditor-xwz6`), Claude Code, model `claude-opus-5-5`
- **Date UTC:** 2026-10-12T18:14Z
- **Decision:** **ACCEPTED**
- **Product commit and tree:** `9d0449917b237ab5de51ccf1141b772e5c0e7008`, product tree `e65caa5b420d833bac8e9037db45688239f6e4f6` (verified in my own clone `C:\nexus\dev\certgate-audit-s1c2`)
- **Supersedes:** candidate 1 `31335ee13944563a0eb559f6d1125efe94f598c9`, REJECTED in `VERDICT-S1-candidate-1.md` (commit `aa40a9af`). Candidate 1 is preserved; candidate 2 is its repair (cycle 1 of 5: `dbeec4b`, `d17879f`, `9d044991`).
- **Test revisions:**
  - the product suite at the candidate (`test/`, 188 tests);
  - the adversary's independent tests at `19f981df766ec753d9ac0d0539390c4b7ab4d619` (`verification/adversary/stage-1/`), cloned by me to `C:\nexus\dev\certgate-audit-advtests` and run against my own image. The adversary's candidate-2 revision `0f13ae58` adds only its own evidence and re-based mutants.
- **Spec and checksum:** stage-start sources per register R1.5/R1.6 (`SOURCES.sha256`): D `29a203a8…279d`, P `1205bbf4…a012`, R `d3b8ea59…744b`, V `277356fc…d6fb`, mini-prueba as listed. Drift after stage start (A-24; V `cc62a36c…` at 17:42:08Z) was diffed by me and does not touch Stage 1.
- **Register:** R1.6, commit `0daa18947c64bed917faad805a3c382ab8cab0bf`, `OBLIGATIONS.md` SHA-256 `adbae77839e09edfa27c385aadd2df09702d4844b202353f8aa97c7618c2fc9c`. It carries the obligations of R1.5 `f9836f89`.
- **Scope wording (D1-01):** Stage 1 is accepted **on the mock path only**. This is **not** MVP acceptance. It does not satisfy P:L19-20 ("no declarar el MVP terminado si la UI funciona solo con respuestas simuladas"), P:L100-102, or any AMD gate A1–A4. No real model and no AMD hardware were used.

## Commands run by the auditor, and the clean environment

Fresh clone made with `git clone C:\nexus\dev\certgate C:\nexus\dev\certgate-audit-s1c2`, checked out at the candidate, `git status` clean. Host: Windows 11, Docker 29.8.0, Node v24.19.0 (local README run only), Python 3.12.10 run with `-I`.

| Step | Command (abridged; full lines in the logs) | UTC | Exit | Observed |
|---|---|---|---|---|
| Build | `docker build --no-cache --progress=plain -t certgate-audit:9d04499 <clone>` | 18:01:06–18:01:54 | 0 | image `sha256:a581e8a942037d2495d962a33f0277eb658f4bc4e2a720f0bae73aaf888ee4e3` |
| Suite, offline | `docker run --rm --network none certgate-audit:9d04499 npx vitest run --reporter=verbose` | 18:02:23–18:02:29 | 0 | 9 files, **188 passed, 0 failed, 0 skipped** |
| 30 cases | `… node dist/src/cli.js process --case cg-NNN`, one offline container per case | 18:02:30–18:03:04 | 0 ×30 | `compare_cases_v3.py`: **30/30**, no findings |
| A-21 and human decision | cg-003 with `--confirm`: (a) all 22 critical fields, ReH 358; (b) ReH 358 only; (c) ReH 338. cg-002 with `--decide release --reason … --decided-by auditor-xwz6` | ~18:05 | 0 ×4 | (a) release, 0 pending · (b) review, 21 pending · (c) block · (d) the proposal stays `block`; the human decision is recorded with action, by, at and reason |
| Isolation and health | `isolation_probe.mjs` in one server process, `--network none`, pairs cg-003/001, cg-002/016, cg-024/008 | ~18:05 | 0 ×3 | B after A = B before A = B alone, and A after B = A alone, for all three pairs; `/health` mode mock |
| Real mode | `-e CERTGATE_MODE=real … process --case cg-001` | ~18:05 | 0 | status error, review, `endpoint_not_configured`, `injected:false`; the note says nothing was read by a model; no mock fallback |
| README, Docker | every "Run it" Docker command as written, with my image tag and container name substituted | ~18:06 | 0 | published port + POST → **HTTP 200**, review; offline in-container query → review; CLI → review |
| README, local | `npm ci && npm run build && npm test && node dist/src/cli.js list && node dist/src/cli.js process --case cg-001` in my clone | ~18:07 | 0 ×5 | 188 passed; cg-001 release; working tree still clean |
| Mutation check | the 14 adversary mutant diffs re-applied by me to the candidate's `src/` (M06 and M07 re-based by exact line replacement), each mounted read-only over my image; `npx vitest run --network none` | ~18:04 | 1 ×14 | **14/14 KILLED** by assertion failures. M13 is killed by A26 and M14 by A25 (behavioural) |
| Adversary artifacts | oracle self-tests: `python -I -m unittest discover …` | ~18:06 | 0 | 33 tests OK |
| | `harness.py build`, then `run_cases.sh` inside **my** image with `--network none`, then `harness.py judge` | 18:06:29–18:06:43 | 0 | **0 FAIL of 49** (47 PASS; P18 and P19 OPTIONAL-FAIL, declared beyond contract) |
| | `static_checks.py <my clone>` | ~18:08 | 1 | S1-42, S1-03 and S1-38 PASS. S1-43 FAIL classified by me as a **false positive**: `test/reader.test.ts` passes the literal value "mock-reader" as a fake `MODEL_API_KEY`, to prove the exporter rejects secret values. REVIEW items are classified below |
| History | `git log --format='%H %aI %cI %an' 9d044991` | ~18:00 | 0 | every commit ≥ 2026-10-12T15:00:00Z; earliest `705c857` at 16:45:45Z |
| Post-candidate commits | `git diff --stat 9d044991 main -- . ':!evidence'` | ~18:11 | 0 | **empty**. `4ca5b23` and `d90ba0c` are artifact-only additions under `evidence/`; the product tree is unchanged |
| Secret scan | `git grep` for key, token and private-key patterns over the tracked tree and `evidence/`; image env and filesystem | ~18:08–18:11 | — | no secret. Image env is only PATH, NODE_VERSION, YARN_VERSION, NODE_ENV, CERTGATE_MODE and PORT; no `.env`, key or pem |

## Reports and logs

All under `evidence/runs/certgate-001/stage-1/auditor/`, committed in `1af3428d5906fdb3fefd00471e13508b7c41570f`:

- `run-s1c2/docker-build-no-cache.txt`, `docker-build.meta`
- `run-s1c2/suite-network-none.txt` and `.meta`
- `run-s1c2/cases/cg-001..030.json`, `cases.meta`, `compare-cases-v3.txt`
- `run-s1c2/human/{a,b,c,d}*.json`
- `run-s1c2/isolation-and-health.txt`, `real-mode-cg-001.json`
- `run-s1c2/readme-commands.txt`, `readme-local.txt`
- `run-s1c2/mutants/M01..M14.on-9d044991.diff`, `M*.suite.txt`, `SUMMARY.txt`
- `run-s1c2/adversary-artifacts/{oracle-selftests,harness-build,run-cases,harness-judge,static-checks}.txt`, `static/static-report.json`
- Tools: `compare_cases_v3.py` (new, in the same commit), `compare_cases.py` (v2, unchanged since `b1b15093`), `isolation_probe.mjs`

The SHA-256 of each artifact is that of its blob in `1af3428d` (`git ls-tree -r 1af3428d -- evidence/runs/certgate-001/stage-1/auditor`). They are not restated here, to avoid a self-referential hash.

## Coverage against the register (R1.6 / R1.5)

| Rows | Evidence (my runs) | Result |
|---|---|---|
| C1 (cg-001, 004) · C2 (cg-002, 005–007) · C3 (cg-008, 009) · C4 (cg-010, 011) · C5 (cg-012) · C6 (cg-013–015) · C7 (cg-003, 016, 017) · C8 (cg-018) · C9 (cg-019, 020) · C10 (cg-021, 022) · C11 (cg-023–027) · C13 (cg-028) · A-05 (cg-029) · A-06 (cg-030) | 30 dataset cases; harness A01–A26 and P01–P21 | all expected proposals, statuses and required reasons |
| C12 / S1-36 / A-13 | isolation probe (3 pairs, both orders) and the suite's isolation tests | identical |
| C14 | — | **N/A** (Evolus out of scope, D1-12); not counted as a pass |
| S1-01 README (fictitious data, mock-only status, no AMD claim, working run commands) · S1-02 MIT · S1-03 `.env.example` (3 keys, no values) · S1-04 `.gitignore` · S1-05 Docker on PORT with no runtime network · S1-06 stack | README read and every command run; LICENSE; static S1-03; image run with `--network none` | met |
| S1-07…S1-11 contract, source refs, human decision (who, when, why), proposal only, file validation (N01/N02 exit 2; candidate fixtures) | code review; suite; probe (d); harness | met |
| S1-12/S1-13/S1-49 spec and delivery note | suite; receipts carry ESP-014 r3 and the spec SHA-256 | met |
| S1-14…S1-20, D1-15, D1-20, A-14, A-18 channels, scans, disagreement, unknown, mock labelling, real mode, failure injection | 30 cases; P01–P17, P20, P21; real-mode run | met. Call counts 3/3/3/1/1 per the suite and the harness |
| S1-21…S1-24, A-02/A-03/A-08/A-11/A-12/A-20/A-23 coherence, units, plausibility, CEV (citation `docs/sources/cev-formula.md`, Wikipedia rev 1354593332, quoted) | cases; A-series fixtures; code review | met |
| S1-25…S1-31, A-04, D1-03 exact decimals, limits, KV sum, grade, stamp, precedence | suite; M04/M05/M13/M14 killed; A25/A26; code review (decimal.js precision 50, half-even; strict JSON) | met |
| S1-32 (I1) · S1-33 receipt without secrets | cg-021 contaminated explanation leaves the result `block`; receipt scan (no numbers, no secrets, no absolute paths) | met |
| S1-34…S1-39 dataset, expectations before code, provenance, fictitious labelling | `DATASET-PRECHECK.md` (`0cc05f77`/`6eb264a4`); `data/` unchanged since `4ebd9533`; `src/` never reads `data/expected` or `data/origin` | met |
| S1-40 mutation | 14/14 killed (my reproduction); adversary report `74cb25e5…` | met |
| S1-41 clean-clone, fresh-container reproduction | this record | met |
| S1-42 dates | git log | met |
| S1-43 secrets | tree, image and evidence scanned. **Room: stated limitation**, no full-history export | met for repo, image and evidence |
| S1-44 tests without network | suite under `--network none` | met |
| S1-45 evidence records | this folder; implementer and adversary records with blob hashes | met (see observations) |
| S1-46/S1-47/S1-48 (A-05, A-06, A-21) | cg-029, cg-030; A-21 (a), (b) and (c) | met |

**Invariants:**
- I1: proposals come only from `evaluate.propose` over versioned rules.
- I2: unknown critical fields force review.
- I3: no second channel ⇒ confirmation of every critical field; disagreement ⇒ unknown + review.
- I4: exact decimals; behavioural float guards kill M04/M05/M13/M14.
- I5: no release under any trigger in 30 cases and 49 probes.
- I6: no secrets in tree, image or evidence; room limitation stated.
- I7 for the mock path: every receipt is labelled MOCK; planted deviations and injected failures are labelled in structural fields (F-01 repaired). See ADV-S1-F04 below for the one optional path where this does not hold.

**Classification of the adversary static REVIEW items** (rerun on my clone):
- **S1-25 float heuristics (54), checked line by line:**
  - 34 are in `tools/dataset/generate.py` and 15 in `data/origin/mini-prueba/generar.py`: the Python dataset generators, which are not product code.
  - The 5 in `src/` are:
    - `evaluate.ts:15`, the rules version string;
    - `evaluate.ts:234`, the display formatting of a Decimal in a reason text (`toSignificantDigits`/`toFixed` of decimal.js, string output);
    - `reader.ts:117`, the mock truncation index for `invalid_json`;
    - `text-layer.ts:70-71`, PDF layout geometry.
  - None is in rules, coherence or units.
- **S1-25 JSON numbers (1):** `data/origin/mini-prueba/especificacion-ESP-014.json` `"revision": 3`, the byte-exact pre-kickoff copy. `src/cases.ts` forbids `expected/` and `origin/`, and the product spec is `data/spec/ESP-014.r3.json` (string revision).
- **D1-12 expectation reads (44):** they are in `test/`, `tools/` and the comments of `src/cases.ts` declaring the forbidden directories. No product read was found by my own grep.

## Earlier findings (candidate 1), status on candidate 2

| Finding | Status | Evidence |
|---|---|---|
| F-01 injected failures not labelled planted | **resolved** | cg-023..027 receipts: `reading_source: "planted"` (top level and reader), the failure entry in `planted[]`, `errors[].injected: true`. Example: cg-027 detail `INJECTED (mock, planted): …` |
| F-02 README run did not work | **resolved** | `readme-commands.txt`, `readme-local.txt` |
| F-03 implementer logs ignored | **resolved** | force-added in `d17879f`; new logs use `.txt` |
| F-04 real-mode note said MOCK | **resolved** | `real-mode-cg-001.json` note |
| F-05 = ADV-S1-F01, surviving float mutants | **resolved** | M13 and M14 KILLED (`run-s1c2/mutants/`) |
| ADV-S1-F02 malformed external reading.json, exit 1 | **resolved** | P14/P15: error, review, receipt, exit 0 |

## Non-blocking findings and observations (open, carried to Stage 2)

1. **ADV-S1-F04 [low; I7/A-01 labelling]**, reproduced by me in my harness run (`run-s1c2/adversary-artifacts`, probe P20). A **non-persistent** injected failure (`mock_failure {class: timeout, persistent: false}`) that recovers on retry gives a receipt indistinguishable from a clean mock run: `reading_source: "mock"`, `planted: []`, `errors: []`, `calls: 2`.
   - Why it does not block: the path is reachable only through an external mock input using the optional O1 feature. No dataset case uses it, so A-01's scope (dataset cases) is satisfied. The reading is the correct mock reading, labelled MOCK, and no proposal is created by the deviation.
   - It must be fixed before Stage 2 acceptance, where I7 is central. The receipt of a run with any injected or retried failure must show it (planted entry and the retried error with `injected`).
2. **cg-022 / A-16 (from the dataset pre-check):** a hostile duplicate in the text layer turns a would-be `block` (true ReH 340 < 355) into `review`. That follows the register, never gives release, and should be stated in the final report.
3. **Optional robustness, beyond contract (A-19):** lowercase `mpa` is accepted (P18); duplicate JSON keys keep the last value (P19). Not defects.
4. **Public-repo hygiene:** some committed evidence logs contain local Windows paths (`C:\Users\…`): implementer `repair-1/*.txt`, `local-clean-clone-tests.log`, and analyst `SOURCE-DRIFT-1735Z.diff`. Not secrets. They should be considered before the human makes the repo public.
5. **Known gaps declared by the implementer** (text-layer parser limited to layouts A/B; MockReader only; real-mode receipts say `reading_source: "live"` with no reading; no push, D1-19) are accepted as declared limitations of a mock-only Stage 1.

## Result of the next-stage probe

None run. Stage 2 has not started.

## Ledger events and room messages

- Candidate 2 handoff: `896ef1ab`, `8c1f5282`, `0002e3d5`, `c7351029`, `9872aad2`, `6fa1abd5`, `a31b2afb`; my acknowledgement `04046a8d`.
- Adversary bundles: `90b39eda` (candidate 1), `2f4495c0` (candidate 2).
- My candidate 1 decisions: interim `f2637abc`, verdict `483351ad`, mutation addendum `33c884aa`.
- Register: R1.6 `a64c429c`.
- The checkpoint that publishes this record links its own message ID.

## Remaining budgets (at 18:14Z)

- Stage 1: about 82 of 300 min used, about 218 left (ends 21:52Z).
- Repair cycles: 1 of 5 used.
- Run total: until 2026-10-13T02:52Z. Hard stop: 2026-10-14T20:00Z.
- Infrastructure retries used by the auditor: 0. One analyst send retry was reported in `1658ac08`.
- Token and cost usage of this seat: unknown (no meter available).

## Next action authorised by the dispatch

Stage 2 may start from this accepted commit `9d044991` without asking the human. Stage 2 re-hashes the sources at its start (A-24) and must resolve ADV-S1-F04.

ACCEPTED is internal acceptance of the identified candidate `9d0449917b237ab5de51ccf1141b772e5c0e7008` (tree `e65caa5b…`) only. It is not a statement about hidden tests or an official event result. Any later change to the product tree voids this acceptance until it is rechecked.
