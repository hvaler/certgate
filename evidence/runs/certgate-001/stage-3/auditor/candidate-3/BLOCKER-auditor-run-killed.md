# BLOCKER (infrastructure): auditor real run on candidate 3 stopped by host memory pressure

Seat: auditor-xwz6 · Run certgate-001 · Stage 3 · Candidate `a892f771e531ca76b621b5a03163b2d3cb4f02d6` (tree `f0c829e9`)
Recorded: 2026-10-13T19:05Z

## What happened
- 18:56:18Z: `node tools/evaluate/run-eval.mjs --out evaluation/runs/auditor-a892f77` was started in the clean clone
  `C:\nexus\dev\certgate-audit-s3c3`, under the auditor's endpoint lease (room msg 3ff8e1f3).
- About 19:03:44Z (last write of `results.json`): the host stopped the background command. Exact host message:
  > Background command "Run the 27-case real evaluation against the endpoint" was stopped because the system is running low on memory
  The harness note says not to restart it without being asked, because memory may still be short.
- Free physical memory measured at 19:04Z: 2.1 GB of 31.6 GB.
- No `run-eval` process is left running.

## What was consumed (from the endpoint's own GET /usage)
- `usage-before.json` (runner, 18:56:19Z) against `f1-capture-2-after-killed-run.json` (19:05Z):
  10 requests and a daily cost delta of 0.0022146. Token Factory credits are free and have no monetary value.
- `results.json` holds 9 completed cases, cg-004..cg-012. The 10th request was in flight when the run was stopped.
- Daily headroom after the stop: 0.98877 of 1.
- The partial artifacts are preserved, unchanged, in `real-run/partial-killed-run/`.
- **This partial run is not used for any metric or verdict.** It is kept only as a record of the calls spent.

## What is needed
The operator's go to retry, as infrastructure retry 1 of 2 for this command. Freeing memory on the host would make the
retry less likely to be stopped again. The retry will be a full fresh run of the 27 cases, plus the 3 stories, under a
newly taken lease. Nothing from the partial run is reused.
