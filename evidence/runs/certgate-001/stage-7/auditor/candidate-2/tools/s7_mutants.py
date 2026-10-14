"""Auditor (stage 7, candidate 2): mutants of the Stage 7 guards, each a single textual replacement (or a binary
append), full suite after `npm run build`, reverted with git checkout. Usage: python -I s7_mutants.py <clone> <log>"""
import subprocess, sys, os
repo, log = sys.argv[1], sys.argv[2]
A, B, J, R, DG, CS = "src/web/app.ts", "src/tools/build-stories.ts", "public/app.js", "README.md", "tools/diagrams.mjs", "tools/capture-screenshots.mjs"
MUT = [
 ("Q1-queue-timeout-never", "src/web/live-jobs.ts", "if (this.now() - created > this.budget.queueMaxWaitMs) {", "if (false) {"),
 ("R1-allowlist-gains-cg-020", A, "[...STORY_IDS, ...SAMPLE_IDS].map((id) => [id, path.join(getDataDir(), \"previews\", `${id}.png`)])", "[...STORY_IDS, ...SAMPLE_IDS, \"cg-020\"].map((id) => [id, path.join(getDataDir(), \"previews\", `${id}.png`)])"),
 ("R2-request-path-reaches-fs", A, "const file = ORIGINALS.get(id);", "const file = ORIGINALS.get(id) ?? path.join(getDataDir(), decodeURIComponent(id));"),
 ("R3-by-cert-maps-stories-too", A, "new Map<string, string>(SAMPLE_IDS.map((id) => [createHash", "new Map<string, string>([...STORY_IDS, ...SAMPLE_IDS].map((id) => [createHash"),
 ("R4-nosniff-dropped", A, "\"x-content-sha256\": createHash(\"sha256\").update(png).digest(\"hex\"), ...SECURITY_HEADERS });", "\"x-content-sha256\": createHash(\"sha256\").update(png).digest(\"hex\") });"),
 ("F1-flag-dropped-from-evaluate", A, "view: { ...sv, ...out.view, ...sv }", "view: { ...out.view, steps: sv.steps, reading_label: sv.reading_label, receipt: sv.receipt }"),
 ("F2-flag-dropped-from-storyView", B, "if (k === \"reading_source\") { out.recorded = true; out.recorded_at = rec.recorded_at; }", ""),
 ("F3-flag-on-live-result", A, "return { kind: \"done\", result: { counted: true, ...out } };", "return { kind: \"done\", result: { counted: true, ...out, view: { ...out.view, recorded: true } } };"),
 ("C1-client-always-dataset-original", J, "sampleHashes.includes(sha) ? { by_certificate: sha } : { own: true }", "{ by_certificate: sha }"),
 ("D1-fake-diagram-node", DG, "  { id: \"browser\", col: 1, row: 0,", "  { id: \"vllm\", col: 4, row: 3, label: [\"vLLM on MI300X\"], file: \"src/web/app.ts\", symbol: \"vLLM on MI300X\" },\n      { id: \"browser\", col: 1, row: 0,"),
 ("D2-readme-mermaid-edited", R, "amd[\"AMD Token Factory<br/>OpenAI-compatible endpoint\"]", "amd[\"AMD Instinct MI300X<br/>own vLLM endpoint\"]"),
 ("S1-capture-records-har", CS, "browser.newContext({ viewport: vp, deviceScaleFactor: 1 })", "browser.newContext({ viewport: vp, deviceScaleFactor: 1, recordHar: { path: \"capture.har\" } })"),
]
BIN = [("P1-preview-byte-changed", "data/previews/cg-003.png")]
env = {k: v for k, v in os.environ.items() if not (k.startswith("MODEL_") or k == "LIVE_ACCESS_CODE")}
def suite():
    b = subprocess.run("npm run build", cwd=repo, env=env, shell=True, capture_output=True, text=True)
    r = subprocess.run("npx vitest run --maxWorkers=4", cwd=repo, env=env, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    summ = [l.strip() for l in r.stdout.splitlines() if "Tests" in l and ("passed" in l or "failed" in l)]
    fails = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith(("×", "×"))]
    return b.returncode, r.returncode, (summ[-1] if summ else "?"), fails
out = []
for mid, f, old, new in MUT:
    p = os.path.join(repo, f); t = open(p, encoding="utf-8", newline="").read()
    if old not in t: out.append(f"{mid}: NOT APPLIED (anchor missing in {f})"); print(out[-1], flush=True); continue
    open(p, "w", encoding="utf-8", newline="").write(t.replace(old, new, 1))
    brc, rc, summ, fails = suite()
    out.append(f"{mid}: {'KILLED' if rc else 'SURVIVED'} | {f} | build rc {brc} | {summ}"); out += ["    " + x[:200] for x in fails[:4]]
    print(out[-1 - min(4, len(fails))], flush=True)
    subprocess.run(["git", "checkout", "--", f], cwd=repo, check=True)
for mid, f in BIN:
    p = os.path.join(repo, f); b = open(p, "rb").read(); open(p, "wb").write(b[:-1] + bytes([b[-1] ^ 1]))
    brc, rc, summ, fails = suite()
    out.append(f"{mid}: {'KILLED' if rc else 'SURVIVED'} | {f} | {summ}"); out += ["    " + x[:200] for x in fails[:4]]
    print(out[-1 - min(4, len(fails))], flush=True)
    subprocess.run(["git", "checkout", "--", f], cwd=repo, check=True)
subprocess.run("npm run build", cwd=repo, env=env, shell=True, capture_output=True)
st = subprocess.run(["git", "status", "--porcelain"], cwd=repo, capture_output=True, text=True).stdout
out.append(f"clone clean after revert: {st.strip() == ''}")
open(log, "w", encoding="utf-8").write("\n".join(out) + "\n")
