# Auditor: README screenshot links on GitHub (closes the open item of VERDICT-S7-FINAL)

**Remote head at check time** (`git ls-remote https://github.com/hvaler/certgate refs/heads/main`, 2026-10-15 ~05:27Z):
`2aa14ed19cea74183d0b0827a1f3f28352d29d68`.
- This head contains the accepted candidate cf97dfad.
- `README.md` and `docs/` do not change between 2aa14ed and the final push target fff1f0c (0 files). This result
  therefore holds for fff1f0c.

**Log:** `live/readme-links-github-2aa14ed.log` (tool `tools/live_s709.py`, GETs only, plus one recorded evaluate POST).

| Check | Result |
|---|---|
| README screenshot links (14 PNGs and `manifest.json` under `docs/screenshots/`) and `tools/capture-screenshots.mjs` on raw.githubusercontent at 2aa14ed | **16/16 answer 200** |
| Other README links and URLs | 200, except 3 directory links that raw.githubusercontent cannot serve. All 3 answer **200 as github.com tree URLs** at 2aa14ed. This is the same handling as S4-07 |
| Deployed site (repeat of S7-09) | 8/8 served files equal dc228d10. Originals match `data/previews`. Bad ids (including cg-020) are refused. `recorded:true` is live. 17 MATCH, 0 DIFF |
| Secrets (`scan_secrets.py` over the log) | 0 hits |

**Result:** the README screenshot links answer 200 on GitHub, so **the open item of VERDICT-S7-FINAL is closed.**
One step remains: after the human pushes fff1f0c, I confirm `ls-remote` equals fff1f0c. That push changes
evidence files only.
