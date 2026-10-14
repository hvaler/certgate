"""Auditor (stage 5, candidate 3): F5-02 identity mutants on run artifacts (receipt model ids), full suite each, reverted.
Usage: python -I s5_identity_mutants.py <clone> <log>"""
import subprocess, sys, os
repo, log = sys.argv[1], sys.argv[2]
G = "evaluation/runs/real-gemma-04100b9/results.json"; Q = "evaluation/runs/real-candidate-dd557fd/results.json"
A = "evidence/runs/certgate-001/stage-3/auditor/candidate-3/real-run/eval-retry1/results.json"
MUT = [
 ("b2-gemma-receipt-model_id-qwen", G, '"model_id": "self-dploy/Gemma-4-31B-IT"', '"model_id": "self-dploy/Qwen3.8-27B"'),
 ("b4-gemma-receipt-requested-qwen", G, '"requested_model_id": "Gemma-4-31B-IT"', '"requested_model_id": "Qwen3.8-27B"'),
 ("b5-qwen-impl-receipt-model_id-gemma", Q, '"model_id": "self-dploy/Qwen3.8-27B"', '"model_id": "self-dploy/Gemma-4-31B-IT"'),
 ("b6-qwen-auditor-receipt-requested-gemma", A, '"requested_model_id": "Qwen3.8-27B"', '"requested_model_id": "Gemma-4-31B-IT"'),
]
env = {k: v for k, v in os.environ.items() if not k.startswith("MODEL_")}
out = []
for mid, f, old, new in MUT:
    p = os.path.join(repo, f); t = open(p, encoding="utf-8", newline="").read()
    if old not in t: out.append(f"{mid}: NOT APPLIED (anchor missing in {f})"); continue
    open(p, "w", encoding="utf-8", newline="").write(t.replace(old, new, 1))
    r = subprocess.run("npx vitest run", cwd=repo, env=env, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    summ = [l.strip() for l in r.stdout.splitlines() if "Tests" in l and ("passed" in l or "failed" in l)]
    fails = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith(("×", "\u00d7")) or "\u2717" in l]
    out.append(f"{mid}: {'KILLED' if r.returncode else 'SURVIVED'} | {f} | {summ[-1] if summ else '?'}"); out += ["    " + x for x in fails[:4]]
    subprocess.run(["git", "checkout", "--", f], cwd=repo, check=True)
st = subprocess.run(["git", "status", "--porcelain"], cwd=repo, capture_output=True, text=True).stdout
out.append(f"clone clean after revert: {st.strip() == ''}")
open(log, "w", encoding="utf-8").write("\n".join(out) + "\n"); print("\n".join(out))
