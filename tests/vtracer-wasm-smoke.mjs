import test from "node:test";
import assert from "node:assert/strict";
import init,{trace} from "../vendor/rastertrace/pkg/rastertrace_wasm.js";
import {browserVtracerWasm} from "../vendor/rastertrace/pkg/wasm-inline.js";
import {quantize,modeFilter,removeBackground} from "../vendor/rastertrace/js/preprocess.js";

function fixture(){
 const w=96,h=96,pixels=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let color=[255,255,255];
  const d=Math.hypot(x-48,y-48);
  if(d<33)color=[255,20,180];
  if(x>50&&x<76&&y>36&&y<60)color=[20,220,240];
  if(d<10)color=[255,255,255]; // deliberate white hole
  pixels.set([...color,255],(y*w+x)*4);
 }
 return {data:pixels,width:w,height:h};
}
test("vendored offline WASM module compiles in Node",async()=>{
 const bytes=browserVtracerWasm();
 assert.ok(bytes.byteLength>100000);
 assert.equal(String.fromCharCode(...new Uint8Array(bytes).slice(0,4)),"\0asm");
 await init({module_or_path:bytes});
});
test("VTracer converts five-color-ready pixels to real SVG paths",async()=>{
 const img=fixture();
 // Match real worker preprocessing path.
 quantize(img,6);modeFilter(img);
 const removed=removeBackground(img,"#ffffff",16,true);
 assert.ok(removed!==undefined);
 const svg=trace(new Uint8Array(img.data.buffer),img.width,img.height,"spline","cutout","color",0,8,0,60,4,10,45,3);
 assert.match(svg,/<svg/);
 assert.match(svg,/<path/);
 assert.ok(svg.length<2_000_000);
 assert.ok(!svg.includes("<image"),"must contain genuine vector geometry, not a bitmap");
 console.log("VTracer curve trace: "+svg.length+" bytes; "+(svg.match(/<path\b/g)||[]).length+" paths");
});
