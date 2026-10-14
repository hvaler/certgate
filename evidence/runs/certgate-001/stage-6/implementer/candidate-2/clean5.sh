#!/bin/bash
# F6-02: a cold clean clone of <commit>, `npm ci`, build, then the full suite N times in a row with MODEL_* unset.
# Usage: clean5.sh <commit> <dir> <log> <runs>
set -u
C=$1; D=$2; LOG=$3; N=$4
git clone -q /c/nexus/dev/certgate "$D" && cd "$D" && git checkout -q "$C" || exit 2
echo "clean clone $(git rev-parse HEAD) tree $(git rev-parse HEAD^{tree}) $(date -u +%FT%TZ)" > "$LOG"
npm ci --no-audit --no-fund 2>&1 | grep -E "^added" >> "$LOG"
echo "dirty files after npm ci: $(git status --porcelain | wc -l)" >> "$LOG"
npm run -s build >> "$LOG" 2>&1 && echo "build ok" >> "$LOG"
echo >> "$LOG"
for i in $(seq 1 "$N"); do
  out=$(env -u MODEL_BASE_URL -u MODEL_API_KEY -u MODEL_ID npx vitest run 2>&1)
  echo "suite run $i ($(date -u +%TZ)):" >> "$LOG"
  echo "$out" | grep -E "^ +(Test Files|Tests) " >> "$LOG"
  echo "$out" | grep -E "^ FAIL |AssertionError|state changes seen" | sort -u | sed 's/^/    /' >> "$LOG"
  echo "$out" | grep -E "4 jobs from 2 instances" | sed 's/^/    /' | head -2 >> "$LOG"
done
node tools/evaluate/metrics-md.mjs --check >> "$LOG" 2>&1 && echo "METRICS.md matches a fresh generation" >> "$LOG"
echo "unmapped $(node tools/claims-units.mjs | wc -l) stale $(node tools/claims-units.mjs --stale | wc -l)" >> "$LOG"
echo "done $(date -u +%FT%TZ)" >> "$LOG"
