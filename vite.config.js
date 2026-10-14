// Vite does not bundle classic <script src="./file.js"> entries.
// Daddy Dingy deliberately keeps its tracer scripts non-module so they can
// access the existing global loadSVGFiles state. Ship them explicitly to dist.
// Without these files, a development smoke test passes but Netlify production
// silently loses the raster importer.
import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot=dirname(fileURLToPath(import.meta.url));
const classicScripts=['color-trace-engine.js','color-trace-ui.js'];

export default defineConfig({
  plugins:[{
    name:'daddy-dingy-ship-tracer',
    apply:'build',
    generateBundle(){
      for(const file of classicScripts){
        this.emitFile({
          type:'asset',
          fileName:file,
          source:readFileSync(join(repoRoot,file))
        });
      }
    }
  }]
});
