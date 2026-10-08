# DADDY DINGY ✳

Local-first SVG-to-TTF dingbat font maker for SparkleBae.

Import Illustrator SVGs, assign ornaments to keyboard keys, tweak placement/size/rotation, preview live typing, save editable projects, and export a real TrueType font.

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

## Illustrator SVG tips

- Export **solid filled paths**, ideally black on white, with generous whitespace between independent ornaments.
- Expand strokes and outline text first. External images, unexpanded stroke-only shapes, masks, and filters aren't converted into font outlines.
- A full-page white background rectangle is ignored by sheet extraction; normal editable backgrounds and compositing are not a font format.
- Gutter detection is **best effort**. Check the highlighted cells before bulk importing, especially on irregular/overlapping sheets.
- Complex sheet SVGs take longer to process; any single extracted glyph must stay under the font's 120,000-point safety limit.
- Save a JSON project as your editable master, particularly with large sheets; browser autosave storage is limited.

