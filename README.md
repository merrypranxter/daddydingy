# DADDY DINGY ✳

Local-first SVG-to-TTF dingbat font maker for SparkleBae.

Import Illustrator SVGs, assign ornaments to keyboard keys, tweak placement/size/rotation, preview live typing, save editable projects, and export a real TrueType font.


## ⬜ Remove a white SVG background on iPhone

A quick browser-only alternative to installing a vector editor: in **THE PILE**, select the colorful SVG, then tap **⬜ Remove white backing**. Daddy Dingy inspects the actual vector objects and exports a separate `-transparent.svg`. The existing source and font mapping stay unchanged.

- Works when the apparent white background is a **white vector shape covering practically the entire SVG canvas**.
- Does **not** erase white lines, holes, highlights, tiny dots, or internal white artwork just because those objects are white.
- It deliberately refuses to delete ambiguous, multi-part white compound paths; removing them could damage internal white details.
- If the preview is white but the SVG already has no background shape, nothing will be removed. Check it against a checkerboard.
- A white bitmap embedded inside an SVG isn't a removable vector backdrop. Convert the source or inspect the actual file.
- To manually select/delete an unusual white shape on iPhone, a true vector editor such as Amadine or Linearity Curve is useful.

No rasterization, no paid APIs, and no destructive edits. This is in the same review PR as the multicolor SVG extraction.

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

