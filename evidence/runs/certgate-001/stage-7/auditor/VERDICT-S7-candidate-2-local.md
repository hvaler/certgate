# Auditor verdict, Stage 7 candidate 2 (phase A, local acceptance): ACCEPTED

Candidate `dc228d10636cc3cf7b12f3b1226e88027cce12b2`, tree `cf0dcba04e9b0c2e041a8955b0e107b313311149`.
- Register R7.1. Implementer handoff: msg 6a934b13, record 6dd741e. Analyst ruling 37110f21 (option b: the auditor's
  slot covers the checks the host stopped).
- Audited in a fresh clone, `C:\nexus\dev\certgate-audit-s7c2`, from 19:40Z to 19:58Z, with vitest at
  `--maxWorkers=4`.
- No endpoint call was made. The code was read only from the user-level registry, inside the scanner, and never
  printed.

**Result: candidate 2 is ACCEPTED for phase A (local acceptance).** It is not the final Stage 7 verdict. That follows
the human's push and deployment report: the S7-09 live checks, every README link live, and the phase B screenshots
(T7-05). Repair cycles used: 1 of 3.

## F7-01 is closed

| Check | Result |
|---|---|
| Diff vs 4ef04b27 | `test/stage6-live.test.ts` only (+31/−11): the queue-timeout test on an injected app clock, the W-03 waits bounded by time (30 s), and the 4-jobs busy test holding each slot 8 s. **Tests only** |
| 5 cold clean runs (`candidate-2/clean-clone.log`) | `npm ci` (0 dirty), build, then **485/485 in all 5 runs**. METRICS check matches. `previews --check` ok. `diagrams --check` ok. Claims: 0 unmapped, 0 stale |
| Docker (`candidate-2/docker.log`), 9.6 GB free | `--no-cache` build; 1 run with `--network none` and 0 MODEL_*, code or store variables: **402 passed, 83 skipped (repo-only), 0 failed**. **`previews --check` inside the image: ok (CH7-06)** |
| My mutants (`candidate-2/s7-mutants.log`), **13/13 killed** | Q1 `q_timeout_never` (2 failed), plus the 12 Stage 7 mutants of candidate 1 (R1–R4, F1–F3, C1, D1, D2, S1, P1), re-confirmed on this candidate |
| Secrets (`candidate-2/scan-code-digest.txt`, `scan-head-tree-and-dist.txt`) | With the **rotated** code read from the registry: code value 0, code SHA-256 hex 0, in 1529 files (tree, `dist/`, `docs/`) and 1675 history blobs. MODEL_API_KEY 0. Base-URL path 0. Generic hits are only the known fakes: O4-03 `sk-proj-…`, and the O6-01 sentinels in `test/stage6-live.test.ts` and `test/stage7.test.ts` |

## Carried forward from candidate 1 (record ed05391; identical product, docs and tools)

- T7-01: the diff is empty on the reading path, the prompt, the queue and limits, config, evaluation, figures,
  METRICS, `vercel.json` and the package files.
- The T7-02 guard code; T7-03 previews (6/6 byte-stable, hashes listed, no metadata chunks); the T7-04 flag; T7-06
  diagrams; T7-07 (37/37 relative links, the prize check); the capture script, statically.
- The adversary's 19/19 Stage 7 mutants and its P1–P15 and P7 probes (2e46c108).
- The README "How it was built and verified" counts match `STAGE-REGISTER.md`. They are checked by
  `test/stage7.test.ts`. My Stage 5 independent run is not listed, which is optional (msg 9c4e1277).

## Remaining for the final Stage 7 verdict (after the human's deployment report)

- **S7-09 live:**
  - "View the original certificate" answers 200 for cg-001, cg-002, cg-003 and one sample, with bytes equal to
    `data/previews`;
  - unknown ids, cg-020 and traversal answer 404;
  - every README link answers 200;
  - the recorded flag is present on the live story JSON.
- **T7-05 phase B:**
  - the captions name the deployed commit;
  - the served-file manifest equals that commit;
  - the code input is empty in every capture;
  - `innerText` has no secret;
  - no HAR, trace or video;
  - at most 1 reading under an announced lease.
