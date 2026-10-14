# Auditor verdict, Stage 5 candidate 3: ACCEPTED

Candidate `409fb69a8e538efadbf2687862e39e384b73d92b`, tree `b030c6de0ab78540f3f021c46b9b7a92c3d2a294`. This was repair
cycle 2 of 3, the last one used. Register R5.7 (`f0515a6`), with E-17, E-18 and E-19 as the closing condition.
Implementer handoff: msg a13531f4, record 3bd6aa9. Analyst freeze: msg 765a29bc. Adversary bundle: msg 0a5d5b8c (clone `6d13d026`, mutants at `8ca78e0`).
Audited in a fresh clone, `C:\nexus\dev\certgate-audit-s5c3`, from 12:13Z to 12:25Z. Finalized after the adversary bundle, at about 12:40Z.

**Result: ACCEPTED.** Stage 5, the Gemma comparison, is accepted on this exact commit.
- The product is unchanged from the accepted Stage 4 product `b0ec67a6`, except for the E-15 `vercel.json`
  includeFiles line.
- Qwen3.8-27B stays the product model and drives the landing figures, the stories and the deployed site.
- Gemma-4-31B-IT is documented as a comparison run.
- F5-01 and F5-02 are closed.
- S4-10, the live Vercel check, stays **not done** until the human pushes and I check the live URL.

## Lineage

| Candidate | Commit | Verdict | Record |
|---|---|---|---|
| 1 | `ddb75eca` | REJECTED on F5-01 (prize claims survive), plus F5-02 | `VERDICT-S5-candidate-1.md`, 4eed261 |
| 2 | `a848dfae` | REJECTED: F5-01 and F5-02 not closed. The analyst counted it as superseded; the cycle count is the same | `VERDICT-S5-candidate-2.md`, 7919e26 |
| 3 | `409fb69a` | **ACCEPTED** | this record |

## Checks on candidate 3

| Check | Result |
|---|---|
| Diff vs ddb75eca, outside evidence | only `test/support/prize-check.mjs`, `test/stage5-gemma.test.ts`, `test/docs.test.ts` and `CLAIMS.md` (C-75 proof title). Tests and docs only |
| Diff vs b0ec67a6 in src, public, api, data, config, package and container files, tsconfig, vercel.json, evaluation, tools | only `vercel.json` (E-15), the new Gemma run directory, 3 `dev-calls.jsonl` lines and the METRICS generator. The same as candidate 1 |
| Clean clone (`candidate-3/clean-clone.log`) | `npm ci` with 0 dirty files, build, **336/336** with 0 MODEL_*. `metrics-md --check` matches. Claims: 0 unmapped, 0 stale |
| F5-01 closing condition (E-17, E-18, E-19 items 1–4) | `prize-check.mjs` fails closed. Each sentence is normalised: NFKC; U+200B–U+200D and U+FEFF removed (byte check: `0x200b-0x200d`, `0xfeff`); `*`/`_` inside words removed; Cyrillic and Greek look-alikes mapped. A sentence passes only by exact match on `ALLOWED_PRIZE_CLAUSES`. The word list is the E-19 union. A stale-entry test exists, and the 01-REGLAS quote rule is kept |
| My 21 prize mutants (`candidate-3/prize-mutants.log`), each with its own `"none: context"` map entry | **21/21 killed, each by the prize check itself** ("no forbidden claim"): A1–A7, e2–e8, e13–e17, the compete-but-qualifies sentence, plus my extra probes "favourite of the Gemma track" and "ranked first at the hackathon" |
| F5-02 (`candidate-3/identity-mutants.log`) | **4/4 killed** by the extended identity test: Gemma `receipt.reader.model_id` set to Qwen; Gemma `requested_model_id` set to Qwen; Qwen implementer `model_id` set to Gemma; Qwen auditor `requested_model_id` set to Gemma |
| Secrets (`candidate-3/scan-history.txt`; all reachable blobs of the shared repository) | MODEL_API_KEY value 0. Base-URL host and path 0. Only the known classes otherwise: fake `sk-proj-…` (O4-03) and older evidence records with local paths, including the `2566cc8` blob of O5-01 |

### Allow-list review (G-09, E-19 item 1)

| Entry | Where | Ruling |
|---|---|---|
| "This comparison makes no claim about any prize or award." | README.md line 152, Gemma section | **approved.** It is the S5-10 disclaimer and makes no claim |
| "Enter at least one value." | `public/app.js` line 330, UI validation message (`msg.textContent`) | **approved.** "Enter" means type in a value; product code is not changed in Stage 5 |

Checking only string literals in `public/*.js` is accepted: identifiers such as `Object.entries` are not page text.
Whole-text checking still applies to README, DEPLOY, METRICS and the html, css and json files of `public/`.

## Carried forward from candidate 1 (identical product; record 4eed261)

- Product byte-identity vs b0ec67a6; the expectations and the Qwen artifacts are unchanged.
- E-16 bundle simulation. Without pdfjs-dist, the import fails with the operator's error. With it, even without
  `@napi-rs/canvas`, every DEPLOY.md expectation holds.
- Request bodies. The Qwen bodies are byte-identical between builds. The Gemma body differs only in `model`.
- Docker `--no-cache` with `--network none` and 0 MODEL_*: 305 passed, 27 repo-only skipped. The adversary got the
  same result.
- Gemma figures equal my independent recompute: FC 0/18 and 0/6; caught 6/6 (5 block); 26/27; 34.5 s; 0.00007789;
  /usage reconciled.
- My own Gemma run (f258d0d) is identical case by case to the run of record.
- The METRICS Qwen prefix is byte-identical to b0ec67a6.
- The Gemma licence and publisher match the publisher's card.
- The README facts are true.
- 10 S5-15 and E-15 mutants killed: a1–a3, b1, b3, c1, c2, d1, f1 and the E-15 drop.

## Adversary bundle (msg 0a5d5b8c)

- Diff verified as tests and docs only. Suite 336/336. Docker, the E-16 simulation, the Gemma recompute and the
  static scans carry forward from candidate 1, in agreement with mine.
- 39 mutants: **34 killed**. This includes every binding probe (A1–A7 equivalents, S5M-e2…e8, e13, e16), e14, e15,
  e17, the F5-02 probes b4 and b5, and the 24 earlier mutants.
- **5 survived. None is binding** under the acceptance rule I fixed before this cycle (msg c0cf6624) and register
  E-18 (65912eaf):
  - e18 (no listed word);
  - e20, U+00AD soft hyphen;
  - e21, U+2060 word joiner;
  - e22, the HTML entity `elig&#105;ble`;
  - e23, inline markup `eli<b>gible</b>`.

  E-18 names exactly U+200B–U+200D and U+FEFF, and the candidate strips exactly those. e20–e23 are recorded as
  O5-04 below.

## Observations (not blocking; recorded for the final report)

- **O5-03, residual limits of the word list.** These are the class E-18 accepts for e18
  (`candidate-3/residual-probes.txt`). Each of the following passes the prize check:
  - "CertGate is the obvious pick for the Gemma judges on AMD." (e18);
  - "CertGate is a prizewinning tool." (one compound word);
  - "CertGate took first place on AMD." (the list has "place(d) first", not "first place");
  - "CertGate earned a trophy for Gemma on AMD.";
  - hyphen- or space-split words such as "eli-gible" and "p r i z e".

  The barrier for these is the fail-closed claims map: any new README, DEPLOY or METRICS sentence needs an entry,
  which the auditor and the adversary review. I state them so the human knows the check's scope. Today the
  documents contain no such sentence.
- **O5-01** stays as recorded. The local path was removed at head in b93b237, but remains in the history blob of
  2566cc8. It is not a secret.
- **S4-10, the live Vercel check:** not done. After the human pushes this candidate and Vercel redeploys, I run the
  DEPLOY.md checks against the live URL and record them under `stage-5/auditor/vercel/`.
- **O5-04: invisible characters and markup that the normalisation does not cover** (adversary e20–e23). A soft
  hyphen, a word joiner, an HTML numeric entity or inline HTML tags inside a prize word get past the check, though
  they render as the word on GitHub. These are in the same class as O5-03: each needs a deliberate claims-map entry,
  so the fail-closed map and its review are the barrier. A future tests-only hardening is suggested: strip
  U+00AD, U+2060–U+2064 and U+180E, and decode entities and remove inline tags before matching. It is not required
  for this stage.
- **O5-05: `public/stories/*.json` is not read by the prize check.** These are the recorded Qwen readings shown in
  judge mode. They are guarded instead by the byte-identity test against b0ec67a6, so any change to them fails the
  suite.
