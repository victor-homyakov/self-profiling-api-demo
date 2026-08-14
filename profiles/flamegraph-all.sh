for file in *.txt; do
  echo "$file"
  ../../../FlameGraph/flamegraph.pl --width 1500 "$file" >"${file%.txt}.svg"
done
