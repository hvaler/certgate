# Auditor pass/fail rules T10 — Stage 10 (dispatch 8: README and submission text for a judge)

- **Seat:** auditor-zt7p, Claude Code, `claude-opus-5-5`. Written 2026-10-16 ~10:20Z.
- **Specification:** DISPATCH-8 (msg fca8944b) and register R10.0. Dispatches 1–7 and amendment 1 still apply.
- **Byte-identity reference:** 4e5b9fe7b123ef3090daec7aeffddb51ceb2a548.

A rule passes only on evidence this seat produced or re-ran itself.

## Reference values, recomputed by the auditor at 4e5b9fe (10:14:20Z) from the committed artifacts

**Runs:**
- implementer: `evaluation/runs/real-candidate-dd557fd/results.json`;
- auditor: `evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1/results.json`;
- Gemma: `evaluation/runs/real-gemma-04100b9/results.json`.

| Figure | Implementer (Qwen) | Auditor (Qwen) | Gemma comparison |
|---|---|---|---|
| False conforming, FC-broad | 0/18 | 0/18 | 0/18 |
| FC-strict | 0/6 | 0/6 | 0/6 |
| Proposal equal to expected | 27/27 | 26/27 | 26/27 |
| Expected release → proposed release | **9/9** | **8/9** | 9/9 |
| Expected release → sent to review | **0/9** | **1/9 (cg-004)** | 0/9 |
| Non-conformities blocked | 6/6 | 6/6 | 5/6 |
| Fields correct (METRICS.md:98, :190) | 591/594 | 591/594 | 591/594 |
| Seconds per certificate (METRICS.md) | mean 89.6, median 80.6 | mean 77.1, median 76.9 | mean 34.5, median 30 |

**Scans** (from `data/cases/*/case.json` `certificate_kind`):
- **5/30 in the dataset:** cg-002, cg-003, cg-016, cg-017, cg-025;
- **3/27 in the evaluated set cg-004…cg-030:** cg-016, cg-017, cg-025.

## T10-01 Byte identity (S10-09)

`git diff --stat 4e5b9fe <cand>` is **empty** over:
- `src/`, `public/`, `api/`, `data/`, `config/`, `evaluation/`, **`tools/`**;
- `package.json`, `package-lock.json`, `vercel.json`, `Dockerfile`, `tsconfig.json`, `vitest.config.ts`.

Every changed path lies within `README.md`, `CLAIMS.md`, `claims-map.json`, `docs/`, the docs tests and `evidence/`.

## T10-02 Suite and checks (S10-08)

**Fresh clone at the candidate:**
- `npm ci`, typecheck and build;
- `npx vitest run` **×2**: exit 0, 0 failed, 0 skipped;
- metrics-md, previews and diagrams `--check`;
- claims **0 unmapped / 0 stale**, including every sentence of `docs/submission/lablab.md`;
- the prize check passes.

**Existing test hunks (A10-02):**
- each is listed with its reason;
- an assertion that named a code (for example O7-01) may be **replaced** by its plain-word equivalent plus a link, as long as the protected property is still asserted (for example: the failed Stage 7 reading is disclosed and linked);
- removal without a replacement, a skip, or a broader regex is a finding;
- the `expect` counts per existing file must not drop.

## T10-03 Every figure recomputed (S10-01, S10-02, S10-04)

**Each figure** in the README top block, the utility sentence, the second-channel paragraph and `lablab.md` must:
- **equal** the reference table above;
- carry its **denominator**;
- name its **run** (implementer / auditor / "both Qwen runs" / Gemma comparison) as A10-05 requires.

**Further rules:**
- A scan count must say **which set** it counts: "5 of the 30 dataset certificates", or "3 of the 27 evaluated". See challenge C10-1.
- The utility counts must be **tied to the artifacts by a test** (A10-06); a mutant changing one must be killed.
- A figure that differs from the artifacts is an **automatic rejection**.

## T10-04 Reading time names its model (S10-03)

- **What is searched:** every occurrence in README.md and lablab.md of a duration in seconds or minutes, matched by `/\b\d+(\.\d+)?\s?(s|sec|seconds?|min|minutes?)\b/` plus "per certificate" phrases.
- **Pass:** each must name its model in the same sentence or table row, and its run where it is an evaluation figure.
- **Values:** Qwen 89.6/80.6 (implementer run), Qwen 77.1/76.9 (auditor run), Gemma 34.5/30. The live-reading durations in the screenshot rows name their model already.
- **A duration without its model is an automatic rejection.**

## T10-05 Length limits (S10-07)

Counted by the auditor in its own script over `docs/submission/lablab.md`:
- **title ≤ 50 characters** (Unicode code points);
- **short description ≤ 255 characters**;
- **long description ≥ 100 words** (whitespace-separated tokens).

The test must kill an over-limit mutant.

## T10-06 Judge read (S10-06)

The auditor reads README.md top to bottom, and lablab.md whole. **Grep, for the record:**
- `O\d-\d\d`, `F\d-\d\d`, `OI-S\d`, `\bI[1-7]\b`, `03-DISENO`;
- register ids `\b(S|T|D|A|C|E|L|R|CH|DN|V|W|Q|P)\d+[-.]\d+\b` outside the claims-table links;
- `dispatch`, `the band`, `the human`.

Each remaining hit is **listed** and judged, against S10-06, a code a judge must decode, or allowed with a reason (for example, a link target path under `evidence/`). Contradictions are listed too:
- the model statements;
- the Gemma listing history, which must include the dated re-listing on 2026-10-16 (operator 04:21:59Z, auditor 04:23:34.429Z);
- the "One endpoint and one model" wording.

## T10-07 Submission text content (S10-07)

`lablab.md` must contain:
- EN 10204 3.1;
- "a person decides";
- the utility figures;
- the second-channel scope;
- one process sentence;
- where the access code goes (Additional Information, given by the operator).

It must **not** contain the code, the key or the base-URL path. Prize words appear only in exact allow-list sentences (A10-04), and the auditor reviews each one. A prize claim is an **automatic rejection**.

## T10-08 Secrets

**Values compared in memory, counts only:** the code, SHA-256(code), the key, SHA-256(key), the base-URL path.

**0 hits** required in every changed file, the history delta 4e5b9fe..cand and the commit messages. A secret is an **automatic rejection**.

## Verdict

- **ACCEPTED:** only if T10-01…T10-08 all pass.
- **REJECTED:** names each unmet rule.

The verdict is bound to the candidate commit.

## Challenges to R10.0

- **C10-1 (A10-01, S10-04), the scan count.** The data gives **5/30 in the dataset** but **3/27 in the evaluated set** (cg-002 and cg-003 are tuning and story cases, excluded from the evaluation). Dispatch 8's wording "the evaluation set has 5 scans of 30 certificates" would therefore be **wrong** if written as is. The text must say "5 of the 30 dataset certificates are scans; 3 of the 27 evaluated", or one of the two, each labelled. A10-01 already says the data wins; this records the discrepancy for the analyst, as A10-01 requires.
- **C10-2 (A10-05):** "591/594" holds for both Qwen runs **and** for the Gemma run. The top block must say "both Qwen runs" (or name one run), so that it is not read as covering Gemma by default.
- **C10-3 (S10-02):** the Gemma run also gives 9/9 releases proposed. If the README states Gemma utility, it is labelled Gemma comparison. The top block stays Qwen (A10-05).
