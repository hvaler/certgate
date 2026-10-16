# Stage 9 re-capture note (R9.4 F9-A03, R9.3 G-1)

Written by implementer-zt7m. These are **local observations, not carried by git**. No run output is committed here: the stdout of the tool run of 2026-10-16T05:58:08.081Z was not saved to a file, and it is not reconstructed.

**What was observed.** Four screenshots written by the unchanged `tools/capture-screenshots.mjs`, in its run of 2026-10-16T05:58:08.081Z (manifest `captured_at`), are byte-identical to their Stage 7 versions at cf97dfad. Those screens did not change between the two deployments.

Their file modification times in the capture worktree (`C:\nexus\dev\certgate-s9impl`) were read with `date -u -r <file>` at about 06:1xZ on 2026-10-16:

| File | mtime (UTC, local file system) | SHA-256 |
|---|---|---|
| docs/screenshots/judge-1280.png | 2026-10-16T05:58:13.666Z | e21ecf3497dfb801ca40ece5fa472b5e5e48f53754a9e68e1042048b3bffdc3c |
| docs/screenshots/story-cg-003-decision-1280.png | 2026-10-16T05:58:14.943Z | 9ff4a9fc004ee86885e07bc725fb6cf8353eefecfabcac92967a2b418652695f |
| docs/screenshots/judge-375.png | 2026-10-16T05:58:19.367Z | f6aa342be3c5a5ba569c01c7aaa0896607ad2191d3b21bbc7da70fbaddbd220f |
| docs/screenshots/story-cg-003-decision-375.png | 2026-10-16T05:58:20.449Z | efc18cd723e7beee6a3ce68b6966adea84ba80f1fb736b2a19604f8a7dd516e5 |

For comparison, a file that changed in the same run: `docs/screenshots/landing-1280.png`, mtime 2026-10-16T05:58:12.185Z.

All four times lie inside the auditor's S9-00 window: BEFORE 2026-10-16T05:57:09.920Z, AFTER 2026-10-16T05:59:43.524Z. The hashes are those in `docs/screenshots/manifest.json`.
