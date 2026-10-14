#!/bin/bash
# Runs each Stage 7 mutant on a throwaway branch impl-mut7/<id>-on-<base> of the scratch clone (never merged).
# Usage: SCRATCH=<scratch dir> kill6.sh <base> <log> <id>...
S=${SCRATCH:?set SCRATCH to the scratch directory that holds the s4c1 clone and mutate7.mjs}
C=$S/s4c1; BASE=$1; LOG=$2; shift 2
cd $C
echo "base $(git rev-parse $BASE) $(date -u +%FT%TZ)" > $LOG
for id in "$@"; do
  git checkout -q -f $BASE
  git checkout -q -B impl-mut7/$id-on-${BASE:0:7}
  node $S/mutate7.mjs $C $id >> $LOG 2>&1
  git diff --stat | tail -1 | sed "s/^/    diff: /" >> $LOG
  out=$(env -u MODEL_BASE_URL -u MODEL_API_KEY -u MODEL_ID npx vitest run 2>&1)
  echo "$id: $(echo "$out" | grep -E '^\s+Tests' | sed 's/^ *//')" >> $LOG
  echo "$out" | grep -E '^ FAIL ' | sed 's/^/    /' | sort -u >> $LOG
done
git checkout -q -f $BASE
echo "done $(date -u +%FT%TZ)" >> $LOG
