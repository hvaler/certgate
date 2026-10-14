"""Auditor (stage 5, candidate 1): S5-15 (a)-(d), (f) and E-15 mutants, each a single textual replacement, full suite
after `npm run build`, then reverted with git checkout. Usage: python -I s5_mutants.py <clone> <log>"""
import subprocess, sys, os
repo, log = sys.argv[1], sys.argv[2]
G = '"model": "self-dploy/Gemma-4-31B-IT"'
MUT = [
 ("a1-metrics-gemma-seconds", "METRICS.md", "| 34.5 · 30 · 27 |", "| 24.5 · 30 · 27 |"),
 ("a2-readme-gemma-seconds", "README.md", "mean 34.5, median 30", "mean 24.5, median 30"),
 ("a3-readme-gemma-cost", "README.md", "mean 0.00007789", "mean 0.00006789"),
 ("b1-gemma-reply-qwen-id", "evaluation/runs/real-gemma-04100b9/results.json", G, '"model": "self-dploy/Qwen3.8-27B"'),
 ("b2-gemma-receipt-qwen-id", "evaluation/runs/real-gemma-04100b9/results.json", '"model_id": "self-dploy/Gemma-4-31B-IT"', '"model_id": "self-dploy/Qwen3.8-27B"'),
 ("b3-qwen-reply-gemma-id", "evaluation/runs/real-candidate-dd557fd/results.json", '"model": "self-dploy/Qwen3.8-27B"', G),
 ("c1-request-top_p", "src/web/live-reader.ts", "temperature: 0,\n", "temperature: 0,\n            top_p: 1,\n"),
 ("c2-max-tokens", "src/web/limits.ts", "ADAPTER_MAX_TOKENS = 16_384", "ADAPTER_MAX_TOKENS = 8_192"),
 ("d1-landing-from-gemma", "public/figures.json", '"generated_from": "evaluation/runs/real-candidate-dd557fd"', '"generated_from": "evaluation/runs/real-gemma-04100b9"'),
 ("f1-metrics-drop-cg004-diff", "METRICS.md", "cg-004 (expected release; gemma release; qwen implementer release, qwen auditor review); ", ""),
 ("e15-drop-pdfjs", "vercel.json", ",node_modules/pdfjs-dist}", "}"),
]
env = {k: v for k, v in os.environ.items() if not k.startswith("MODEL_")}
sh = os.name == "nt"
out = []
for mid, f, old, new in MUT:
    p = os.path.join(repo, f); t = open(p, encoding="utf-8", newline="").read()
    if t.count(old) < 1:
        out.append(f"{mid}: NOT APPLIED (anchor missing)"); continue
    open(p, "w", encoding="utf-8", newline="").write(t.replace(old, new, 1))
    b = subprocess.run("npm run build", cwd=repo, env=env, shell=True, capture_output=True, text=True)
    r = subprocess.run("npx vitest run", cwd=repo, env=env, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    summ = [l.strip() for l in r.stdout.splitlines() if "Tests" in l and ("passed" in l or "failed" in l)]
    fails = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith(("×", "×")) or "✗" in l or l.strip().startswith("FAIL")]
    out.append(f"{mid}: {'KILLED' if r.returncode else 'SURVIVED'} | {f} | build rc {b.returncode} | {summ[-1] if summ else '?'}")
    out += ["    " + x for x in fails[:6]]
    subprocess.run(["git", "checkout", "--", f], cwd=repo, check=True)
subprocess.run("npm run build", cwd=repo, env=env, shell=True, capture_output=True)
st = subprocess.run(["git", "status", "--porcelain"], cwd=repo, capture_output=True, text=True).stdout
out.append(f"clone clean after revert: {st.strip() == ''}")
open(log, "w", encoding="utf-8").write("\n".join(out) + "\n"); print("\n".join(out))
