# Self-profiling Demo

Demo app and processing pipeline for a HolyJS talk about the JS Self-Profiling API: capture profiles in the browser, process them, and show flamegraphs.

## Language

**Scenario**:
A scripted profiling session shown on stage (e.g. page-load, INP, scroll). One Scenario produces one or more Profiles.
_Avoid_: Demo case, use case, example (when meaning a profiling session)

**Profile**:
One Self-Profiling API recording after stop/process — samples, resources, stacks, plus optional input events.
_Avoid_: Trace (reserved for Chrome Trace export), dump

**Flamegraph**:
An SVG visualization of folded stacks from one or more Profiles. Live path: generated on the demo server and opened in the app. On stage, Flamegraph comes *after* a single-Profile Perfetto view, to motivate aggregation. Fallback Flamegraphs for disaster recovery live outside the app (slides / local files). Overview Scenario visuals for the short talk segment may also live on slides; `/flamegraph` shows only the latest pipeline SVGs.
_Avoid_: Chart, heatmap, flame chart (Chrome DevTools term)

**Profile payload**:
The downloaded/uploaded file is compressed base64 (often `.txt`). After decompress/decode on the server it becomes Profile JSON. The processing CLI reads many such files from `profiles/` (client uploads).
_Avoid_: “JSON download” (when meaning the wire file)

**INP Scenario**:
The one full live Scenario on stage (`/inp`): heavy interaction, input-event listeners, strip of samples outside those events, then automatic upload of the Profile payload (no download/upload buttons). Processing uses that live Profile plus several pre-saved payloads already in `profiles/`, with a talk mention of production aggregation.
_Avoid_: “heavy render demo” as the Scenario name (that’s the UI widget inside the Scenario)

**Load Scenario**:
Scenario route `/load`: Profiler auto-starts and stops on load; samples are not stripped to input events. Talk shows it briefly; capture is optional.
_Avoid_: “page open”, startup profiling (unqualified)

**Scroll Scenario**:
Scenario route `/scroll`: heavy scroll/virtual-list interaction inside a recording window; little or no event-based strip. Talk shows it briefly; capture is optional.
_Avoid_: “smoothness demo” as the Scenario name

**Chrome Trace**:
A Profile exported for Perfetto (`*.trace.json`). The CLI emits one Chrome Trace per Profile payload in `profiles/`; on stage the speaker picks which file to open in Perfetto (typically the live take). Flamegraph aggregation is a separate step over the same folder.
_Avoid_: Trace (unqualified), DevTools Performance export

**Stage build**:
The talk serves a normal production Vite build under `preview`, with source maps and `Document-Policy: js-profiling`. It does not use the `react-dom/profiling` alias for the main demo path.
_Avoid_: “profiling build” (ambiguous — Document-Policy vs react-dom profiling alias)
