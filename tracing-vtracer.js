/* Optional browser VTracer adapter for Daddy Dingy's engine bake-off.
 * Third-party VTracer/RasterTrace sources in vendor/rastertrace/.
 * Real work runs in a dedicated module Web Worker, never via API calls.
 */
(function(){
"use strict";
let worker=null,serial=0;
const pending=new Map();
function start(){
  if(!("Worker" in window))throw Error("This browser has no Web Worker support.");
  worker=new Worker("./vendor/rastertrace/js/worker.js",{type:"module"});
  worker.onmessage=e=>{
    const data=e.data||{},item=pending.get(data.id);
    if(!item)return;
    if(data.stage!==undefined){item.onProgress?.(data.stage);return;}
    pending.delete(data.id);
    if(data.error)item.reject(new Error(data.error));
    else item.resolve({svg:data.svg,ms:data.ms,knockedOut:data.knockedOut});
  };
  worker.onerror=e=>{
    const err=new Error("VTracer Worker unavailable. Check that bundled WASM loads: "+(e.message||"module error"));
    for(const item of pending.values())item.reject(err);
    pending.clear();worker?.terminate();worker=null;
  };
}
function cancel(){
  if(worker){worker.terminate();worker=null;}
  for(const item of pending.values())item.reject(new Error("Trace canceled."));
  pending.clear();
}
async function trace(imageData,options={}){
  if(!worker)start();
  const width=imageData.width,height=imageData.height;
  if(!width||!height||width*height>3_000_000)throw Error("VTracer: cell exceeds 3 million pixels; lower trace detail.");
  const colors=Math.max(2,Math.min(64,+options.colors||5));
  // Background white uses one quantized slot; N requested painted colors + 1.
  const settings={
    mode:"spline",hierarchical:"cutout",
    colors:colors+1,
    speckle:0,layerDiff:0,
    cornerThreshold:60,lengthThreshold:4,
    spliceThreshold:45,pathPrecision:3,
    transparent:"#ffffff",fuzz:Math.max(4,Math.min(40,+(options.fuzz??16))),
    edgeTrim:0,defringe:0,straighten:0,
    stencil:false,grayscale:false,denoise:false
  };
  const data=new Uint8ClampedArray(imageData.data);
  const id=++serial;
  const promise=new Promise((resolve,reject)=>{
    pending.set(id,{resolve,reject,onProgress:options.onProgress});
  });
  worker.postMessage({id,img:{data,width,height},settings,sourceWidth:width,sourceHeight:height},[data.buffer]);
  const output=await promise;
  if(typeof output.svg!=="string"||!output.svg.includes("<svg"))throw Error("VTracer did not return SVG markup.");
  const svg=output.svg.replace(/<svg\b/,'<svg data-ding-trace-engine="vtracer-1.0-alpha.4"');
  return {...output,svg};
}
window.DaddyDingyVTracer={trace,cancel};
})();