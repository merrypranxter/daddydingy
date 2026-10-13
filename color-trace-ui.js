/* Daddy Dingy — one-step color contact-sheet importer. */
(function(){
"use strict";
const $id=id=>document.getElementById(id);
function initColorFoundry(){
 const pile=$id("drop");
 if(!pile||!window.DaddyDingyTraceColors)return;
 const css=document.createElement("style");
 css.textContent="#colorFoundry{border:1px solid #725184;background:#170c29;border-radius:13px;padding:11px;margin:0 0 12px}"
  +"#colorFoundry summary{color:#d5ff4b;font-size:13px;cursor:pointer;font-weight:900}"
  +"#colorFoundry .trace-note{color:#bcacd0;font-size:11px;line-height:1.5;margin:8px 0}"
  +"#colorFoundry label{display:block;font-size:12px;color:#e9ddfa;font-weight:700;margin:8px 0 4px}"
  +"#colorFoundry select{width:100%;background:#0e0820;color:white;border:1px solid #51416f;border-radius:8px;padding:8px}"
  +"#colorFoundry button{width:100%;margin-top:8px}"
  +"#vctPreviews{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:8px}"
  +"#vctPreviews img{width:100%;aspect-ratio:1;object-fit:contain;background:repeating-conic-gradient(#443f50 0 25%,#292338 0 50%) 50% / 14px 14px;border:1px solid #776087;border-radius:5px}";
 document.head.appendChild(css);
 const panel=document.createElement("details");
 panel.id="colorFoundry";panel.open=true;
 panel.innerHTML=[
 '<summary>🌈 COLOR VECTOR FOUNDRY · NO CAPTURE NEEDED</summary>',
 '<label id="vctPhotoButton" for="vctPhotoFiles" class="mint" style="display:block;text-align:center;width:100%;margin-top:12px;padding:12px;cursor:pointer">📸 Choose Photo / Contact Sheet</label>',
 '<input id="vctPhotoFiles" type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif" multiple style="display:block;width:100%;max-width:100%;margin-top:9px" aria-label="Choose photos to trace">',
 '<div class="trace-note">Choose a JPG or PNG from Photos, or drop one here. It becomes separate <b>COLOR SVGs</b> with transparent white. No Adobe Capture, no API fee. If using an experimental tracing engine, pick it below.</div>',
 '<label for="vctEngine">Trace engine · compare results</label>',
 '<select id="vctEngine"><option value="legacy">Current fast polygon tracer · baseline</option><option value="vtracer">VTracer 1.0 curves · experimental browser WASM</option></select>',
 '<label for="vctLayout">Artwork layout</label>',
 '<select id="vctLayout"><option value="nine">3×3 contact sheet — nine SVGs</option><option value="four">2×2 contact sheet — four SVGs</option><option value="single">Single design — one SVG</option></select>',
 '<label for="vctColors">Maximum flat colors per design</label>',
 '<select id="vctColors"><option value="3">3</option><option value="4">4</option><option value="5" selected>5</option><option value="6">6</option><option value="8">8</option></select>',
 '<label for="vctResolution">Trace detail</label>',
 '<select id="vctResolution"><option value="260">Compact — smaller files</option><option value="360" selected>Detailed — recommended</option><option value="480">Maximum detail — slower</option><option value="1024">High fidelity · 1024 px (VTracer only)</option></select>',
 '<label for="vctWhite">Make white transparent</label>',
 '<select id="vctWhite"><option value="236">Aggressive near-white removal</option><option value="245" selected>Normal — recommended</option><option value="253">Only very close to white</option></select>',
 '<label><input type="checkbox" id="vctRetraceSVG"> Re-trace SVGs too (optional; reduces overly dense geometry)</label>',
 '<label><input type="checkbox" id="vctFillKeys"> Also convert to black-and-white TTF glyphs (slower)</label>',
 '<button id="vctDownload" type="button" class="mint" disabled>↓ Download last traced SVGs · ZIP</button>',
 '<div id="vctStatus" class="trace-note" role="status" aria-live="polite">Ready: upload a PNG, JPG, WebP, or SVG using the drop area above.</div>',
 '<div id="vctPreviews"></div>',
 '<div class="trace-note">Real SVG vector shapes are preserved instead of re-traced unless you select that option. A flat-color trace approximates an image; photographic gradients cannot be perfectly reconstructed.</div>'
 ].join("");
 pile.after(panel);
 const picker=$id("svgFiles");
 picker.accept=".svg,image/svg+xml,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";
 pile.querySelector("b").textContent="⊕ DROP COLOR IMAGES OR SVGs";
 pile.querySelector("small").textContent="Photos, PNG, JPG, WebP and SVG · automatic vector tracing";
 const notify=message=>{$id("vctStatus").textContent=message;};
 const imageRe=/\.(png|jpe?g|webp|heic|heif|avif)$/i;
 let lastBatch=[];
 async function readImage(file){
  const url=URL.createObjectURL(file),img=new Image();
  try{
   await new Promise((resolve,reject)=>{
    img.onload=resolve;img.onerror=()=>reject(Error("Could not decode this photo. On iPhone, try saving or exporting it as PNG or JPEG first."));
    img.src=url;
   });
   if(!img.naturalWidth||!img.naturalHeight)throw Error("Empty image.");
   if(img.naturalWidth*img.naturalHeight>40000000)throw Error("Over 40 million image pixels; please resize the source image.");
   // Keep the underlying Blob URL alive through every canvas draw on iOS Safari.
   // Revoking immediately after onload can leave drawImage with no usable pixels.
   img._dingObjectUrl=url;
   return img;
  }catch(err){URL.revokeObjectURL(url);throw err;}
 }
 function cleanBase(name){
  return name.replace(/\.[^.]+$/,"").replace(/[^A-Za-z0-9_-]+/g,"-").slice(0,55)||"ding";
 }
 async function vectorizeFile(file){
  if(file.size>35000000)throw Error("Over 35 MB. Please resize the original contact sheet.");
  notify("Received "+file.name+" ("+(file.size/1024).toFixed(0)+" KB). Decoding photo…");
  const image=await readImage(file);
  try{
  const layout=$id("vctLayout").value;
  const n=layout==="nine"?9:layout==="four"?4:1;
  const cols=layout==="nine"?3:layout==="four"?2:1;
  const engine=$id("vctEngine").value;
  const detail=engine==="legacy"?Math.min(480,+$id("vctResolution").value):+$id("vctResolution").value;
  const colors=+$id("vctColors").value;
  const white=+$id("vctWhite").value;
  const simplify=detail===260?.95:detail===360?.65:.40;
  const thumbs=$id("vctPreviews");
  thumbs.replaceChildren();
  const batch=[],base=cleanBase(file.name);
  notify("Tracing "+n+" design"+(n===1?"":"s")+" locally…");
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  for(let k=0;k<n;k++){
   const col=k%cols,row=Math.floor(k/cols);
   const x0=Math.round(image.naturalWidth*col/cols),x1=Math.round(image.naturalWidth*(col+1)/cols);
   const y0=Math.round(image.naturalHeight*row/cols),y1=Math.round(image.naturalHeight*(row+1)/cols);
   const sw=Math.max(1,x1-x0),sh=Math.max(1,y1-y0);
   const scale=Math.min(1,detail/Math.max(sw,sh));
   const w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));
   const canvas=document.createElement("canvas");
   canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext("2d",{willReadFrequently:true});
   if(!ctx)throw Error("This browser cannot use 2D canvas.");
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(image,x0,y0,sw,sh,0,0,w,h);
   let traced;
   try{
    const img=ctx.getImageData(0,0,w,h);
    if(engine==="vtracer"){
      if(!window.DaddyDingyVTracer)throw Error("VTracer adapter not loaded.");
      const result=await window.DaddyDingyVTracer.trace(img,{
        colors,fuzz:white===236?25:white===253?8:16,
        onProgress:stage=>notify("VTracer "+(k+1)+"/"+n+" · "+stage)
      });
      traced={
        svg:result.svg,bytes:new TextEncoder().encode(result.svg).length,
        layers:(result.svg.match(/<path\b/g)||[]).length,ms:result.ms
      };
    }else{
      const start=performance.now();
      traced=window.DaddyDingyTraceColors.trace(img.data,w,h,colors,white,simplify);
      traced.ms=Math.round(performance.now()-start);
    }
    if(!traced.svg||!traced.svg.includes("<path"))throw Error("No vector paths in result.");
   }catch(e){
    notify("Design "+(k+1)+" · "+engine+" engine failed: "+e.message);
    toast("Trace error: "+e.message);
    await new Promise(resolve=>requestAnimationFrame(resolve));continue;
   }
   const label=String(k+1).padStart(2,"0"),id="g"+(++idCounter);
   const convertFont=$id("vctFillKeys").checked;
   // Keep the fast multicolor SVG workflow separate from monochrome font
   // outlines. A complex traced sheet should never block nine color exports
   // simply because an unrelated TTF converter exceeds its point budget.
   let asset;
   if(convertFont){
     asset=restoreSvgAsset({id,name:base+" · "+label,svg:traced.svg});
   }else{
     const doc=new DOMParser().parseFromString(traced.svg,"image/svg+xml");
     const view=(doc.documentElement.getAttribute("viewBox")||"0 0 "+w+" "+h).split(/[\s,]+/).map(Number);
     const [vx,vy,vw,vh]=view.length===4&&view.every(Number.isFinite)?view:[0,0,w,h];
     asset={id,name:base+" · "+label,svg:traced.svg,contours:[],warnings:[],
       colorOnly:true,box:{x0:vx,y0:vy,x1:vx+vw,y1:vy+vh,w:vw,h:vh}};
   }
   state.assets.push(asset);
   if(convertFont&&asset.contours.length){
    const key=[..."abcdefghijklmnopqrstuvwxyz1234567890"].find(char=>!state.slots[char]);
    if(key)state.slots[key]={id,x:0,y:0,scale:100,rotation:0};
   }
   batch.push({name:base+"-"+label+".svg",asset});
   const picture=document.createElement("img");
   picture.alt="Vector design "+label;
   picture.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(traced.svg);
   thumbs.append(picture);
   notify("Vectorized "+(k+1)+"/"+n+" · "+engine+" · "+(traced.bytes/1000).toFixed(0)+" KB SVG · "+traced.layers+" paths · "+(traced.ms??"?")+" ms.");
   await new Promise(resolve=>requestAnimationFrame(resolve));
  }
  if(!batch.length)throw Error("Nothing could be traced. Try a different white threshold or the Single option.");
  lastBatch=batch;$id("vctDownload").disabled=false;
  state.activeAsset=null;render();saveLocal();
  notify("✓ "+batch.length+" COLOR SVGs from "+engine+" ready. White transparent. Download ZIP below.");
  }finally{
    if(image._dingObjectUrl)URL.revokeObjectURL(image._dingObjectUrl);
    image.src="";
  }
 }
 // Catch image drops before the older SVG-only drop handler, so a
 // photo is never silently discarded if the file picker reports a JPEG.
 pile.addEventListener("drop",event=>{
  const files=Array.from(event.dataTransfer?.files||[]);
  if(!files.some(file=>file.type.startsWith("image/")||imageRe.test(file.name)))return;
  event.preventDefault();event.stopImmediatePropagation();
  notify("Photo dropped: "+files.length+" file(s). Starting color tracing…");
  loadSVGFiles(files).catch(err=>{notify("Photo import error: "+err.message);toast(err.message);});
 },true);
 const earlier=loadSVGFiles;
 loadSVGFiles=async function(input){
  const uploads=Array.from(input||[]);
  for(const file of uploads){
   const isRaster=imageRe.test(file.name)||(file.type.startsWith("image/")&&file.type!=="image/svg+xml");
   const isSvg=/\.svg$/i.test(file.name)||file.type==="image/svg+xml";
   if(isRaster||(isSvg&&$id("vctRetraceSVG").checked)){
    notify("Importing "+file.name+" as "+(isSvg?"re-traced SVG":"photo")+"…");
    try{await vectorizeFile(file);}catch(err){notify("⚠ "+file.name+": "+err.message);toast(err.message);}
   }else if(isSvg){await earlier([file]);}
  }
 };
 $id("vctPhotoButton").onclick=()=>{
  // Native LABEL handles the file picker; no synthetic Safari click.
  notify("Choose a JPG or PNG from Photos…");
 };
 $id("vctPhotoFiles").onchange=async event=>{
  const files=Array.from(event.target.files||[]);
  event.target.value="";
  if(!files.length){notify("No photo selected. Choose a JPG or PNG contact sheet.");return;}
  notify("Photo selected: "+files.map(f=>f.name).join(", ")+". Starting…");
  try{await loadSVGFiles(files);}catch(err){notify("Photo upload failed: "+err.message);toast(err.message);}
 };
 $id("vctDownload").onclick=()=>{
  if(!lastBatch.length)return;
  try{
   const files=lastBatch.map(x=>({filename:x.name,svg:optimizedDing(x.asset).svg}));
   download(packDingSvgZip(files),"daddy-dingy-traced-svg-assets.zip","application/zip");
   const large=files.filter(x=>x.svg.length>2000000).length;
   notify("Exported "+files.length+" individual SVGs as a ZIP"+(large?" · "+large+" still above 2 MB, kept intact":" · each under 2 MB")+".");
  }catch(e){notify("ZIP export failed: "+e.message);}
 };
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initColorFoundry);
else initColorFoundry();
})();