import assert from "node:assert/strict";
import { chromium } from "playwright";

const url=process.env.TEST_URL||"http://127.0.0.1:4173/";
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const errors=[];
page.on("pageerror",error=>errors.push(String(error)));
page.on("console",message=>{if(message.type()==="error")errors.push(message.text());});
try{
 await page.goto(url,{waitUntil:"networkidle",timeout:30000});
 await page.locator("#vctPhotoFiles").waitFor({state:"attached",timeout:15000});
 assert.match(await page.locator("#drop").innerText(),/PHOTO/i);
 assert.ok(await page.locator("#vctPhotoButton").count(),"direct photo button exists");
 const pngData=await page.evaluate(()=>{
   const canvas=document.createElement("canvas");canvas.width=1254;canvas.height=1254;
   const context=canvas.getContext("2d");context.fillStyle="white";context.fillRect(0,0,1254,1254);
   const colors=["#ef219f","#19d9e9","#c4ff25","#6a12cc","#ff6215"];
   for(let k=0;k<9;k++){
      const cx=(k%3)*418+209,cy=Math.floor(k/3)*418+209;
      context.fillStyle=colors[k%5];
      context.beginPath();context.arc(cx,cy,125,0,Math.PI*2);context.fill();
      context.fillStyle=colors[(k+2)%5];
      context.beginPath();context.arc(cx+65,cy,40,0,Math.PI*2);context.fill();
      context.fillStyle="white";
      context.beginPath();context.arc(cx,cy,20,0,Math.PI*2);context.fill();
   }
   return canvas.toDataURL("image/jpeg",0.92).split(",")[1];
 });
 const image=Buffer.from(pngData,"base64");
 await page.locator("#vctPhotoFiles").setInputFiles([{name:"nine-tentacle-test.jpeg",mimeType:"image/jpeg",buffer:image}]);
 await page.waitForFunction(()=>document.querySelectorAll("#vctPreviews img").length===9,null,{timeout:120000});
 const status=await page.locator("#vctStatus").innerText();
 assert.match(status,/9 separate SVGs|9.*ready/i);
 assert.equal(await page.locator("#vctDownload").isDisabled(),false);
 assert.equal(await page.locator("#vctPreviews img").count(),9);
 assert.equal(errors.length,0,errors.join("\n"));
 console.log("PASS mobile-sized raster → 9 SVG preview assets:",status);
}finally{
 await browser.close();
}
