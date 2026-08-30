# Production preview with source maps, not react-dom/profiling

On stage we serve a normal production build (`vite preview`) with `Document-Policy: js-profiling` and source maps enabled — not the `preview:profiling` path that aliases `react-dom/client` → `react-dom/profiling`. The talk prioritizes a production-like bundle and mapped names for Flamegraphs over DevTools-oriented profiling builds.
