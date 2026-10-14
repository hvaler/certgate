#!/bin/bash
# T6-09 for candidate 2: docker build --no-cache from the clean clone, then the image suite twice with --network none
# and no MODEL_*, LIVE_ACCESS_CODE or store variables in the container.
# Usage: docker6c2.sh <clean clone dir> <log>
D=$1; LOG=$2; IMG=certgate-s7c1
cd "$D" || exit 2
echo "docker image of $(git rev-parse HEAD) $(date -u +%FT%TZ)" > "$LOG"
docker build -q --no-cache -t $IMG . >> "$LOG" 2>&1 || { echo "build failed" >> "$LOG"; exit 1; }
echo "--- image suite x2, --network none; first line = count of MODEL_*, LIVE_ACCESS_CODE and store variables in the container ---" >> "$LOG"
for i in 1 2; do
  docker run --rm --network none -e NO_COLOR=1 $IMG sh -c 'env | grep -cE "^(MODEL_|LIVE_ACCESS_CODE|KV_|UPSTASH_|REDIS_)"; npx vitest run 2>&1 | grep -E "^ +(Test Files|Tests) |^ FAIL "' >> "$LOG" 2>&1
done
echo "$(date -u +%FT%TZ)" >> "$LOG"
