# Perfetto first, then aggregated Flamegraph

On stage we first inspect a single Profile in Perfetto, then show fold + Flamegraph over payloads in `profiles/` to motivate aggregation. The CLI writes one Chrome Trace per Profile payload; the speaker chooses which `*.trace.json` to open (usually the live upload). Order is pedagogical: one-trace inspection first, aggregation second.
