# Vendored Brendan Gregg FlameGraph via git submodule

`flamegraph.pl` comes from a git submodule at https://github.com/brendangregg/FlameGraph.git (not PATH, not an npm wrapper). The CLI wraps that script so stage and rehearsal machines get the same generator after `git submodule update --init`.
