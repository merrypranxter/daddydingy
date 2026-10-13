# Daddy Dingy: curve tracer bake-off (experimental, **not** production default)

This branch preserves the old polygon tracer as the default and adds **VTracer 1.0.0-alpha.4** via the browser-ready, MIT-licensed RasterTrace WebAssembly wrapper.

## Why

The previous tracer emits straight-edged polygon paths, caps raster input at 260–480 px per design and runs synchronously. We want smooth Béziers, smaller SVGs, better holes/filigree, and UI responsiveness on iPhone—without cloud API fees or breaking the existing nine-design sheet/ZIP pipeline.

## Try it on an iPhone or desktop

1. Deploy this branch to a preview URL (or serve the repo with `npm run dev`; module Workers don't reliably run over file://).
2. Open **Color Vector Foundry → Trace engine**.
3. Select **Current fast polygon tracer**. Upload the original 3×3 sheet and export its nine SVGs; keep this as the baseline.
4. Select **VTracer 1.0 curves · experimental browser WASM**. Upload the exact same image, with matching colors and resolution, and export again. At first use, the browser loads the same-origin WASM.
5. Inspect on a checkerboard and against a black background. Zoom into holes, tiny dots, thin tentacles, filigree, shared color edges and corner sharpness. Compare file sizes, path counts, elapsed tracing time, and DingWings behavior.
6. Try a **single ornament** with **High fidelity 1024px** to stress the curve engine. Try all nine at lower resolution on iPhone before attempting nine high-detail cells.

**The browser benchmark has not yet been run on real user images or physical iPhone hardware.** A clean Node test doesn't prove mobile Worker performance.

## Engine sources (pinned)

- [RasterTrace](https://github.com/bradsec/rastertrace), MIT. Vendored files:
  - `vendor/rastertrace/js/preprocess.js` (upstream blob `a9c1dbf340c5105c58e7e6263c8e7cdfffc8760d`)
  - `vendor/rastertrace/js/worker.js` (derived from upstream blob `d2dcc2e8be912ba46b3f3f04f402d1d51b00b593`, modified only to use same-origin inline WASM).
  - `vendor/rastertrace/pkg/rastertrace_wasm.js` (upstream blob `5efc8bc7ec647e7ea968bcb0c3bb826d54ddeca3`)
  - `vendor/rastertrace/pkg/wasm-inline.js` (exact bytes from upstream binary blob `5c79c5cd9224f7521dd04e998ebfe66ba75fcf7b`, encoded into UTF-8 Base64 only because GitHub's current connector file editor supports text files).
  - `LICENSES/RASTERTRACE-LICENSE.txt` and `LICENSES/RASTERTRACE-THIRD-PARTY.txt`.
- [VTracer 1.0.0-alpha.4](https://github.com/visioncortex/vtracer), MIT. The underlying Rust/WASM engine. Alpha release rather than a declared final/stable 1.0.

**Do not introduce external CDN or cloud inference dependencies.** The included WASM build is local/offline. For production, ship a normal `.wasm` binary using a conventional build/deploy pipeline instead of the Base64 experiment.

## Implementation

- `tracing-vtracer.js`: worker adapter; converts browser ImageData to transferable typed-array; listens for status and completion; exposes cancellation; fixed spline/cutout profile.
- `color-trace-ui.js`: new engine dropdown, VTracer timings and path statistics; current generator remains available.
- `tests/vtracer-wasm-smoke.mjs`: executable WASM initialization and traced colors/hole fixture.
- `.github/workflows/vtracer-bakeoff.yml`: automatic Node smoke plus Vite build.

## Test metrics and exit criteria

Prioritize tiny dots/holes, thin spirals, shared edges, original colors, 95th-percentile shape error, and iPhone performance. SVG byte size matters but must not override correctness. An SVG that contains `<path>` isn't enough; need inspect Bézier segments, correct transparent negative space, no unwanted white paint, and no embedded image.

After a successful bake-off:
- Add visual A/B comparisons and alpha-mask render-diff tests.
- Improve 3×3 gutter detection and manual correction for raster imports.
- Introduce a normalized region/palette SVG structure appropriate for DingWings.
- Evaluate [Trazor](https://github.com/PhenX/Trazor) against exactly the same fixture corpus.
- Only switch the default tracer after a real-device QA pass.

This experiment does **not** claim to replace the SVG sanitizer, font contour handling, sheet harvester, or ZIP export. No Google API requests are needed.
