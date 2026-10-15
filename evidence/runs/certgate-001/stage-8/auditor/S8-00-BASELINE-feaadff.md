# Auditor record S8-00 — Stage 8 starting point: diff 2158016 → feaadff

- **Seat:** auditor-zt7p (`hugo.valer/auditor-zt7p`, Band agent `ada214b7-bea9-4a21-b5e8-74baa0a4791d`), Claude Code, model `claude-opus-5-5`.
- **Dispatch 6:** room msg `42b2a37d-9da8-45bf-871a-dd047100f569` from hugo.valer. The dispatch asks the auditor to "confirm by diff that nothing else changed".
- **Required reading done:** DISPATCH-1..5.txt, STAGE-REGISTER.md, FACTORY.md, CLAIMS.md, and the final report addenda for dispatches 3, 4 and 5.
- **This is not a verdict on any Stage 8 candidate.** It fixes the baseline that Stage 8 diffs will be measured against.

## 1. Identities

| | Commit | Tree |
|---|---|---|
| Stage 7 push target (accepted) | `21580169aa6fbee9c0e840407601281eb4b90fc7` | `e09fe1c2d26a75ae93326f85040948a6cdc49789` |
| Stage 8 start, main | `feaadff8c90d4dc7bc913f83bf956b2d28bfae66` | `f995935304c0e2bde5abdb6e969a922d8eb9f09b` |

Local main equals origin/main at feaadff (`git status -sb`: `## main...origin/main`).

## 2. Commits in 2158016..feaadff

| Commit | Author | Files | Nature |
|---|---|---|---|
| a27cbbc | analyst-xwz3 | stage-7/analyst/LOG.md (+1 line) | Stage 7 evidence log line |
| bcaee78 | analyst-xwz3 | stage-7/analyst/LOG.md (+1 line) | Stage 7 evidence log line |
| d3dd58d | operator | final/room.json (+39,213 lines, new) | room export |
| e0de5c7 | operator | final/room.json (39 lines changed) | lease redaction |
| feaadff | operator | DEPLOY.md, README.md, claims-map.json, docs/diagrams/architecture.svg, tools/diagrams.mjs | records the live-model change |

The dispatch describes these as "operator commits that only redact the room export and record the live-model change". Two of them (a27cbbc, bcaee78) are the previous analyst's Stage 7 log lines, not operator commits. They are evidence only and change no product file.

## 3. Product paths

`git diff --stat 2158016 feaadff -- src public api config data evaluation vercel.json package.json package-lock.json Dockerfile tsconfig.json test tools/evaluate` is **empty**. Every changed path in the range is one of: README.md, DEPLOY.md, claims-map.json, docs/, tools/diagrams.mjs, or evidence/.

**Content of feaadff, read line by line:**
- **DEPLOY.md:** only the `MODEL_ID` row changes, to `Qwen3.8-27B`, with the dated Gemma record.
- **README.md:**
  - the live-model sentence is split in two, and the new second sentence carries the dated Gemma record;
  - the Mermaid node label changes to `Qwen3.8-27B (MODEL_ID)`.
- **claims-map.json:** the edited sentences are re-mapped to their existing rows (C-85, C-89), and one unit is added for the new sentence (C-85).
- **tools/diagrams.mjs and architecture.svg:** the `gemma` node label changes and its symbol anchor becomes ``set: `Qwen3.8-27B` `` in DEPLOY.md. The node id stays `gemma`.

**Conclusion:** the statement in dispatch 6 holds for the product. No source, served file, data, configuration, evaluation, test or package changed.

## 4. Room export (final/room.json at feaadff)

| Check | Result |
|---|---|
| Unredacted `jrx_<hex>` receiver leases | 0 |
| `Users\hugo…` profile paths | 0 |
| `Bearer`/`sk-`/`MODEL_API_KEY=`/`LIVE_ACCESS_CODE=` value patterns | 13 hits, all prose or redacted scan output; no value |

E-mail addresses found:
- `auditor-xwz6@certgate.local`, a seat identity;
- `devcloudrequests@amd.com`, a public AMD address;
- `n@hugo.valer`, a fragment of a handle;
- `hvaler@comillas.edu`, once, as a git author line inside quoted `git log` output (line 5809).

`hvaler@comillas.edu` is already the author address of 262 commits in this repository's history, so the export reveals nothing new. Noted for the operator; no action owed by the band.

This scan can only look for patterns. The key and the access code values are not known to this seat, so it cannot prove their absence directly. Their absence is the operator's statement in d3dd58d.

## 5. Baseline suite at feaadff (fresh clone, fresh process)

- **Clone:** `git clone --no-hardlinks C:\nexus\dev\certgate`, checked out at feaadff8c90d4dc7bc913f83bf956b2d28bfae66, in the auditor's scratchpad; `git status --porcelain` showed 0 lines.
- **Tools:** Node v24.19.0, npm 11.17.0, Docker 29.8.0 (not used in this baseline).
- **Commands:**
  - `npm ci --no-audit --no-fund`: 67 packages, 19:17:29Z → 19:17:40Z;
  - `npx vitest run`: exit 0.
- **Result:** Test Files 24 passed (24); **Tests 486 passed (486)**; no skipped and no failed lines; duration 32.48 s. This is the same count as the Stage 7 acceptance.
- **Log:** the original has SHA-256 `b35a2b9a4f37e9fec34e375898a6ab6ba0b099536204fe5b3fb84da2555f1a34`. The committed copy is `S8-00-vitest-feaadff.log`, SHA-256 `be0c3b713a4d00e6290c708ad0d717e43a673d36035832d8fe3f9b94e052f66b`. It differs from the original in one place: on line 2, the user-profile segment of the vitest run directory is replaced by `<user>`, as in the room export. Nothing else changed.
- **Not run here:** Docker `--network none`. That runs on the Stage 8 candidate.

## 6. Documentation staleness the operator commit leaves (for Stage 8 scope)

feaadff updated README, DEPLOY.md and claims-map.json, but not the rows of **CLAIMS.md**, which still describe Gemma as the deployed model:
- **C-85:** "The deployed live model is the one set in Vercel's MODEL_ID (Gemma-4-31B-IT per dispatch 4) …"
- **C-89:** "… the deployed model Gemma-4-31B-IT and the evaluated model Qwen3.8-27B …"

No test checks the wording of a CLAIMS.md row; the docs test checks only that each cited proof exists. So the suite is green, but these two rows no longer match the documents they back. Stage 8 rewrites C-85 anyway (model choice), so the auditor expects both rows to be corrected there. Any Stage 8 claims audit will check them.

## 7. Dispatch text note

The dispatch roster says `analyst {{ANALYST_HANDLE}}, implementer {{IMPLEMENTER_HANDLE}}, adversary {{ADVERSARY_HANDLE}}, auditor {{AUDITOR_HANDLE}}`, and its first token is also `{{ANALYST_HANDLE}}`: these are unresolved template placeholders. The trailing mentions resolve the seats: analyst-zt7k, implementer-zt7m, adversary-zt7n, auditor-zt7p. These are the five members of the room, with hugo.valer as owner. DISPATCH-6.txt should be copied verbatim, placeholders included, with the resolved roster recorded beside it.
