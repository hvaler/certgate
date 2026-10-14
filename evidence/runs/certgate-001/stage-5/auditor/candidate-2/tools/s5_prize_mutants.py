"""Auditor (stage 5, candidate 2): README prize-claim mutants that also add their own claims-map entry
("none: context"), so the fail-closed sentence map does not kill them; each runs the full suite, then is reverted.
Usage: python -I s5_prize_mutants.py <clone> <log>"""
import json, subprocess, sys, os
repo, log = sys.argv[1], sys.argv[2]
ANCHOR = "This comparison makes no claim about any prize or award."
MUTANTS = {
 "A1-plain-eligible": "CertGate is eligible for the Gemma prize.",
 "A2-negation-elsewhere": "CertGate is not just a comparison: it is eligible for the Gemma prize.",
 "A3-never-elsewhere": "CertGate never invents a value and is eligible for the Gemma prize.",
 "A4-contender": "CertGate is a strong contender for Google's Gemma challenge on AMD.",
 "A5-won": "CertGate won the Gemma track.",
 "A6-finalist": "CertGate is a finalist in the hackathon.",
 "A7-placed-first": "CertGate placed first in the Gemma category.",
 "e4-with-no-doubt": "With no doubt CertGate is eligible for the Gemma prize.",
 "e5-never-fails-to-qualify": "CertGate never fails to qualify for the Gemma prize.",
 "e6-not-only": "Not only is CertGate eligible for the Gemma prize, it is a likely winner.",
 "e7-frontrunner": "CertGate is a frontrunner in Google's Gemma track on AMD.",
 "e8-without-question": "Without question CertGate deserves the Gemma prize.",
}
env = {k: v for k, v in os.environ.items() if not k.startswith("MODEL_")}
npx = "npx.cmd" if os.name == "nt" else "npx"
out = []
for mid, sentence in MUTANTS.items():
    readme = os.path.join(repo, "README.md"); cmap = os.path.join(repo, "claims-map.json")
    t = open(readme, encoding="utf-8").read()
    assert t.count(ANCHOR) == 1
    open(readme, "w", encoding="utf-8", newline="").write(t.replace(ANCHOR, sentence + "\n" + ANCHOR))
    m = json.load(open(cmap, encoding="utf-8"))
    m.append({"doc": "README.md", "text": sentence, "row": "none: context"})
    open(cmap, "w", encoding="utf-8", newline="").write(json.dumps(m, indent=1, ensure_ascii=False) + "\n")
    r = subprocess.run([npx, "vitest", "run"], cwd=repo, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
    fails = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith(("×", "FAIL")) or " ✗ " in l]
    summary = [l.strip() for l in r.stdout.splitlines() if "Tests" in l and ("passed" in l or "failed" in l)]
    verdict = "KILLED" if r.returncode != 0 else "SURVIVED"
    out.append(f"{mid}: {verdict} | {sentence} | {summary[-1] if summary else '?'}")
    out += ["    " + f for f in fails[:6]]
    subprocess.run(["git", "checkout", "--", "README.md", "claims-map.json"], cwd=repo, check=True)
st = subprocess.run(["git", "status", "--porcelain"], cwd=repo, capture_output=True, text=True).stdout
out.append(f"clone clean after revert: {st.strip() == ''}")
open(log, "w", encoding="utf-8").write("\n".join(out) + "\n")
print("\n".join(out))
