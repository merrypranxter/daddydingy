# DADDY DINGY ✳

SVG-to-TTF dingbat font maker for SparkleBae.

Import multiple Illustrator SVGs, click an icon and assign it to a keyboard key, tweak position/size/rotation, preview by typing, save and load editable JSON projects, and export a TrueType (.ttf) font.

## Run in Google AI Studio
Import this repository from GitHub. The Vite package runs the single-file app; the font generator works locally in the browser, without any AI API calls or Netlify.

## Run on your own computer
Open `index.html` in a browser. Or run `npm install` and `npm run dev`. Use `npm run build` for a static deployment.

## SVG tips
Export filled vector shapes. Expand strokes and outline text first; complex masks, raster images and filters are not supported as glyph outlines. Fonts are monochrome. Keep your JSON project as the editable master.
