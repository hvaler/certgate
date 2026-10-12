#!/usr/bin/env bash
# Verify this factory's result from a fresh clone, with the organisers' harness.
#
#   bash setup/verify-from-clone.sh <kickoff-dir> [repo-url]
#
#   <kickoff-dir>  a checkout of band-ai/dark-factory-wearedevs, with its harness
#                  installed (see its README). Tested at commit 803560d2.
#   [repo-url]     the repository to verify; defaults to the public one.
#
# Environment:
#   PYTHON         interpreter that has the harness installed. Defaults to
#                  <kickoff-dir>/.venv/bin/python, then python3.
#
# It clones into a new temporary directory, runs `harness check`, then
# `harness run --all --mode isolated`, and prints the stage each folder claims.
# Nothing outside the temporary directories is written or deleted. Docker must
# be running. The full run takes about five minutes.

set -u

KICKOFF=${1:-}
REPO_URL=${2:-https://github.com/hvaler/four-seats-factory.git}

if [ -z "$KICKOFF" ] || [ ! -d "$KICKOFF/harness" ]; then
    sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
    echo
    echo "error: give the path to a kickoff checkout that contains harness/" >&2
    exit 2
fi
KICKOFF=$(cd "$KICKOFF" && pwd)

if [ -n "${PYTHON:-}" ]; then
    PY=$PYTHON
elif [ -x "$KICKOFF/.venv/bin/python" ]; then
    PY=$KICKOFF/.venv/bin/python
else
    PY=python3
fi
if ! (cd "$KICKOFF" && "$PY" -c "import harness.cli" 2>/dev/null); then
    echo "error: '$PY' cannot import the harness; set PYTHON to the interpreter you installed it into" >&2
    exit 2
fi
if ! docker info >/dev/null 2>&1; then
    echo "error: Docker is not running" >&2
    exit 2
fi

WORK=$(mktemp -d "${TMPDIR:-/tmp}/four-seats-verify.XXXXXX")
CLONE=$WORK/repo
OUT=$WORK/checks

echo "== 1/3  clone $REPO_URL"
git clone --quiet "$REPO_URL" "$CLONE" || exit 1
git -C "$CLONE" log -1 --format='      HEAD %h  %s'

echo "== 2/3  harness check"
(cd "$KICKOFF" && "$PY" -m harness check --track pocketful "$CLONE") || exit 1

echo "== 3/3  harness run --all --mode isolated   (about five minutes)"
(cd "$KICKOFF" && "$PY" -m harness run --track pocketful --repo "$CLONE" --all --mode isolated --out "$OUT") \
    | tee "$WORK/run.log"

echo
echo "== result"
grep -E "claims stage [0-9]" "$WORK/run.log" | sed 's/^ */   /'
CLAIMS=0
for n in 1 2 3 4; do
    grep -q "stage-$n/: claims stage $n " "$WORK/run.log" && CLAIMS=$((CLAIMS + 1))
done
echo
echo "   $CLAIMS of 4 stage folders claim their own stage. Reports: $OUT"
echo "   These are the public checks shipped with the kickoff, not the hidden evaluation."
[ "$CLAIMS" -eq 4 ]
