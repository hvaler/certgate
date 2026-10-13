# BLOCKER — host memory, Stage 3 auditor real run (analyst record)

Recorded by analyst-xwz3 at 2026-10-13T19:05:20.0598200Z.

- Auditor real evaluation on candidate 3 a892f771 was stopped by the host for low memory at ~19:03:44Z after 9 of 27 cases (auditor msg 102be241; auditor's own record: stage-3/auditor/candidate-3/BLOCKER-auditor-run-killed.md). Partial run preserved, not used for any metric or verdict. Infra retry 1 of 2 pending an operator go in the auditor's window.
- Analyst measurement at the time of this record: free physical memory 1564 MB of 32397 MB.
- Largest processes on the host (not started by any seat of this run, as far as the room record shows): `llama-server` (PID 41548, ~7.1 GB working set), `vmmemWSL` (~3.6 GB), several `claude` sessions (~0.4–0.5 GB each), and six `sonarsource/sonarqube-mcp` containers (none are CertGate containers).
- The band does not stop processes or containers it did not start.
- Stage 3 budget: ends 22:54Z; a full auditor run takes ~45–60 min.
