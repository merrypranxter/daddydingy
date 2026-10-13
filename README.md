# DADDY DINGY ✳

Local-first SVG-to-TTF dingbat font maker for SparkleBae.

Import Illustrator SVGs, assign ornaments to keyboard keys, tweak placement/size/rotation, preview live typing, save editable projects, and export a real TrueType font.


## 🌈 COLOR VECTOR FOUNDRY — no Adobe Capture required

**Drop the original AI-generated contact sheet directly into Daddy Dingy's THE PILE.** The app now accepts **PNG, JPG, WebP, and SVG**. All raster tracing runs inside the browser on your device — no external API key, no model calls, no subscription.

### Fast path for your nine-design, three-to-five-color sheets

1. Make the usual square **3×3 contact sheet**, with nine reasonably separated ornaments, in an image generator. Save as PNG (recommended), JPG, or WebP.
2. In **THE PILE**, open **🌈 COLOR VECTOR FOUNDRY**; leave the defaults at **3×3** / **5 colors** / **Detailed** / **Normal white removal**.
3. Drop your image. Daddy Dingy cuts it into **nine equal cells** and traces each one's visible pixels into **real SVG path elements** (not embedded bitmap images).
4. The resulting nine full-color vector assets automatically appear in the pile. They are also assigned to available keyboard keys when their outlines meet the font converter's point limits. Font export remains monochrome.
5. Click **↓ Download last traced SVGs · ZIP** for individually named, transparent SVGs. Or use **↓ Selected SVG** / **↓ All SVGs · ZIP** in the pile.

### Controls and important differences

- **White becomes transparent**, including white internal accents and cutouts, rather than turning into another paint color. Threshold is adjustable for off-white photo backgrounds.
- **3, 4, 5, 6, or 8 colors**: automatically identify distinct dominant flat colors within each design; preserve the brighter input colors rather than muddying them with antialias fringe.
- **Compact / Detailed / Maximum detail**: choose tracing resolution and path simplification; finer detail takes more memory and creates larger SVGs.
- **Single design mode** for an image containing just one illustration instead of nine.
- **Existing proper SVG files remain vector by default.** To replace over-complicated Adobe Capture vectors with new, flatter colored paths, deliberately turn on **Re-trace SVGs too**. This raster-samples the SVG and converts the samples back to new paths, so precision will be limited by selected resolution.
- Existing optimization attempts to bring individual files below **2 MB** without deleting their paths. The target is **not a guarantee**, but DingWings can handle larger SVGs.
- All operations happen locally, even on an iPhone; very large sheets, very intricate art, and high-detail settings may use significant memory and take longer.

**Quality limitation:** Converting a raster image to SVG cannot perfectly reconstruct the unknown original mathematical Bézier curves. This local tracer follows color-region boundaries and simplifies them into vector polygons. It is intended for *flat-color decorative art*, not photos, gradients, tiny text, or complicated layered shadows. Inspect small linework, fine detached dots, and cell boundaries on your first real sheet. Keep the original AI image as your master.

## 🌈 Individual multicolor SVG export (new — review branch)

The **Sheet Harvester** now supports flat-color SVG sheets (including 3×3 designs traced in Adobe Capture). **Fonts stay black-and-white** because TrueType outlines do not encode arbitrary SVG color layers; independent SVG exports preserve paint.

- From THE PILE, select a design and use **↓ Selected SVG**.
- Use **↓ All SVGs · ZIP** to obtain each extracted design separately.
- Keep **Preserve original colors** enabled in the Sheet Harvester.
- The harvester detects bright colored shapes (including yellow and cyan), and attempts to separate compound paths from different cells without removing curves or dots.
- Export mode **Auto** aims for **under 2 MB per SVG** by dropping nonvisual metadata and reducing path-coordinate decimal precision only when useful. It does not delete anchor points. Other modes: **Maximum fidelity** and **Compact (3 decimals)**.
- If an individual SVG stays above 2 MB, Daddy Dingy **reports the size and preserves the artwork** instead of silently wrecking it. DingWings accepts larger files (up to 35 MB, device performance permitting).
- Dense SVGs which cannot be converted to font outlines stay in the pile as **SVG ONLY** and can still be exported or saved inside a project JSON. Don't assign SVG-only art to font keys.
- **🪚 Clean Capture SVG** removes extra comments and metadata from a downloaded original SVG without reducing its point count. It won't fix geometry-heavy files by itself.

**Reality checks:** A truly enormous original can still overload a phone; complex SVG masks, embedded bitmap images, unsupported SVG filters, and artwork spanning multiple grid cells may not separate faithfully. Inspect the nine exports, especially fine holes and overlapping shapes. Color SVG processing is best effort, and export does not guarantee a 2 MB result for arbitrarily complex paths.

**Keep your original master file.** For giant batches, use **Save project** manually; browser localStorage autosave may run out of quota.

## ✂ Sheet Harvester

**No individual export marathon required.**

1. Drop a **single SVG containing a whole sheet of separate symbols** into THE PILE.
2. Daddy Dingy scans a temporary image preview to find empty white gutters between columns and rows. **The extracted artwork and exported font remain vector** (polygonal outlines, no raster glyphs).
3. A preview opens with numbered selection regions. Tap a numbered region and **HARVEST SELECTED** to add one design; keep selecting from the same sheet.
4. Or hit **HARVEST ALL + FILL KEYS** to bring in every unharvested design and populate the next empty keys automatically.
5. Turn off **Auto-fill next EMPTY keyboard keys** to import designs into THE PILE without assigning them.
6. If the sheet has an irregular layout or the detector misses a design, use **Draw a custom box** and **Add drawn design**. You can also choose **Import whole SVG as ONE icon** to bypass slicing.

Automatic assignment prioritizes `a–z`, then the remaining normal keyboard characters, then SHIFT equivalents. Existing key assignments are **never overwritten by the harvester**. A design made of many separate vector outlines is kept as **one glyph** based on its position within its sheet cell.

Single-design SVG imports still work as before; manual keyboard stamping remains available.

## Run

- **Google AI Studio:** Import the repository from GitHub; Vite launches the browser-based app.
- **Local browser:** Open `index.html` by itself. The harvester is included in the same standalone file, with no separate JS dependency.
- **Vite:** Run `npm install`, `npm run dev`, or `npm run build`.

Everything runs in your browser. No AI API, backend, uploads to a server, or account required.

## ✨ High-fidelity font export

Daddy Dingy now writes its TrueType outlines on a **4096-unit grid** instead of rounding every ornament to 1000 font units. The same keyboard mapping and glyph sizing are retained, but fine counters, tight curves, and small decorative details survive export with about four times the coordinate precision.

**Important:** You must **export a NEW .ttf from your editable project or original SVGs** to benefit. An already-exported low-detail .ttf cannot regain missing outlines just by enlarging the font size in SparkleBae.

In SparkleBae, give the regenerated font a **new family name** (for example, `Astral Trash Dings HD`), then load that fresh file. This avoids accidentally selecting the older font with the same name. The higher precision improves outlines; details smaller than the font's rendering resolution, unsupported SVG effects, and features already flattened away by sheet extraction may still be absent.

## Illustrator SVG tips

- Export **solid filled paths**, ideally black on white, with generous whitespace between independent ornaments.
- Expand strokes and outline text first. External images, unexpanded stroke-only shapes, masks, and filters aren't converted into font outlines.
- A full-page white background rectangle is ignored by sheet extraction; normal editable backgrounds and compositing are not a font format.
- Gutter detection is **best effort**. Check the highlighted cells before bulk importing, especially on irregular/overlapping sheets.
- Complex sheet SVGs take longer to process; any single extracted glyph must stay under the font's 120,000-point safety limit.
- Save a JSON project as your editable master, particularly with large sheets; browser autosave storage is limited.

