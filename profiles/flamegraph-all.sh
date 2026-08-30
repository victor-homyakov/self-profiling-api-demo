# Generate SVGs from folded stackcollapse files in this directory.
# Prefer: npm run process-profile -- fold profiles
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PL="$ROOT/tools/FlameGraph/flamegraph.pl"

if [ ! -f "$PL" ]; then
  echo "Missing $PL. Run: npm run init:submodules" >&2
  exit 1
fi

cd "$(dirname "$0")" || exit 1
for file in *-folded-*.txt; do
  [ -f "$file" ] || continue
  echo "$file"
  perl "$PL" --width 1500 "$file" >"${file%.txt}.svg"
done
