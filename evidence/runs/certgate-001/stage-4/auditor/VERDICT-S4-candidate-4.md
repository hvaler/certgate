# Stage 4 verdict: candidate 4 (auditor-xwz6)

Run certgate-001 · Stage 4 (delivery) · Register R4.7 (commit `a2440d0`, committed-blob SHA-256 `29ad90ae…4c06`),
with R3.3, R2.2 and R1.6 still in force.

**VERDICT: REJECTED (2026-10-13T22:00Z) on finding F4-03 = ADV-S4-F07.** Two required-class mutants survive, both
reproduced by me (315/315 passing):
- S4M25: a claim in a *trailing* comment on a shell command line;
- S4M26: a claim inside a fence tagged as `text`.

The docs **already contain** real, unmapped capability statements in exactly such trailing comments. Every other
check passed (sections 2–4). The repair is docs and tests only.

## 1. Candidate

| | |
|---|---|
| Candidate / tree | `c57699480d5d251bec93ccf3c4b55dd91bf14f1a` / `8c3fcc82466df15684e9e36bdab80bf3eb09354a` (verified in my clone `certgate-audit-s4c2`) |
| Evidence on top | `373044b` |
| Handoff | implementer msgs 40927a2a … 2919ba0c (14 parts, receipt confirmed 60173e36); analyst freeze 76ee2509 |
| Lineage | 1 `02c5c36b` REJECTED (F4-01, commit `67c5093`) → 2 `ac738ef3` (superseded) → 3 `a130bbf4` REJECTED (F4-02, commit `8210d06`) → **4 `c5769948`** |
| Repair cycles used | 3 of 5 |

## 2. Diff from candidate 3: docs and tests only

- Changed: `tools/claims-units.mjs` (test tooling, imported only by `test/docs.test.ts`), `claims-map.json`, `README.md` (+2, the C-42 sentence), `CLAIMS.md` (C-42), `test/docs.test.ts` (+11).
- No change under `src/`, `public/`, `api/`, `tools/evaluate/`, `data/`, `config/`, the package files, `Dockerfile` or `vercel.json`. The prompt SHA is unchanged.
- The product checks of candidate 1 carry forward unchanged (record `VERDICT-S4-candidate-1.md`).

## 3. Checks on `c5769948`, all pass

| Check | Result |
|---|---|
| Suite, clean clone, `MODEL_*` cleared | **315 / 315, 0 skipped** (`candidate-4/vitest-report.json`) |
| `check_claims.py` with the report | 66 rows, 135 proofs; all exist and pass. C-42 now cites the prose, trailing-text, empty-content and truncation tests |
| `tools/claims-units.mjs` | 0 unmapped, 0 stale (headings, whole-line fenced `#` comments and untagged fence lines are now units) |
| `metrics-md --check` | matches |
| Forbidden-claim grep | 0 |
| Head-tree scan (1166 files) | real key 0, base-URL host+path 0. One generic match: the **fake** S4M13 bait `sk-proj-Ab12…` in implementer and auditor mutant logs. Not a credential |
| Mutants re-applied by me | **KILLED:** S4M23, S4M24 (F4-02 closed), S4M11, S4M11b, S4M12, S4M13, S4M18s, S4M20, S4M21, S4M22, S4M04, S4M01, S4M03, S2M02br, S3M06 |
| Adversary bundle (msg 5de8156c; clone `bc7b7c2c`) | full 27-mutant Stage 4 set killed. F-02 enumeration of the 94 new or changed units found no capability claim filed as "none" |

## 4. Finding F4-03 = ADV-S4-F07 [REJECT; R4.3 F-08 (c), F-02]

| Mutant | Change | Result on `c5769948` |
|---|---|---|
| S4M25 | `docker build --no-cache -t certgate .   # judges also get live AMD reading from the public site` | **SURVIVED** (315/315) |
| S4M26 | a ` ```text ` fence containing "Judges can read their own certificates live from the public site." | **SURVIVED** (315/315) |

**Not hypothetical.** The current README and DEPLOY.md state behaviour in **trailing** comments that are not units today, for example:
- README: `node tools/evaluate/run-eval.mjs …  # endpoint: cg-004..cg-030, GET /usage before and after`;
- README: `# offline: recompute metrics.json from results.json`, `# offline: regenerate METRICS.md (--check to compare)`, `# TEST STUB, not a model; --mode timeout|…`;
- DEPLOY.md §4: `# 200, "state": "off", "detail": "no endpoint configured"`, `# 503`, `# 200, "proposal": "block"`.

I verified each of these as true (Stage 3 runs, the README commands, the DEPLOY checks in `VERCEL=1` shape). They are outside the claims map, though, and a false statement in the same place passes the suite.

**Closing condition (docs and tests only; it closes the class, not the two instances):**
1. **Fail closed.** In README.md, DEPLOY.md and METRICS.md, *every* piece of text is a unit, except the executable part of a line inside a fence tagged `sh`, `bash`, `shell` or `console`. This includes:
   - prose and headings;
   - whole-line **and trailing** `#` comments on any fenced line;
   - **every line** of a fence with any other tag (`text`, `txt`, `plain`, `json`, …) or with no tag.

   Each unit maps to a CLAIMS row or to "none" (with its reason), as now.
2. The trailing-comment statements above map to CLAIMS rows with existing proofs. Examples: C-46 for the DEPLOY checks; the Stage 3 run artifacts and `metrics-md --check` for the evaluate commands; the stub tests for `--mode`.
3. S4M25 and S4M26 must fail the default suite; I will re-apply both. Optional: the analyst may add "public site" to the positive deployed-site patterns.

## 5. Unchanged open items (human-dependent)

- **S4-07 remote head = local head:** not done. It waits for the human's push of the accepted commit.
- **S4-10 Vercel:** not done. No URL has been reported.
