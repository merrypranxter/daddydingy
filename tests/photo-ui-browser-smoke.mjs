import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";

const url=process.env.TEST_URL||"http://127.0.0.1:4173/";
const engine=process.env.PLAYWRIGHT_BROWSER==="webkit"?webkit:chromium;
const browser=await engine.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const errors=[];
page.on("pageerror",error=>errors.push(String(error)));
page.on("console",message=>{if(message.type()==="error")errors.push(message.text());});
try{
 await page.goto(url,{waitUntil:"networkidle",timeout:30000});
 await page.locator("#vctPhotoFiles").waitFor({state:"attached",timeout:15000});
 assert.match(await page.locator("#drop").innerText(),/PHOTO/i);
 assert.ok(await page.locator("#vctPhotoButton").count(),"direct photo button exists");
 assert.equal(await page.locator("#vctPhotoFiles").isVisible(),true,"native photo input is visible, not hidden");
 assert.equal(await page.locator("#vctFillKeys").isChecked(),false,"TTF conversion must be opt-in");
 assert.equal(await page.locator("#vctPhotoButton").getAttribute("for"),"vctPhotoFiles");
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
 await page.waitForFunction(()=>document.querySelectorAll("#vctPreviews img").length===9&&document.querySelector("#vctDownload")?.disabled===false&&/COLOR SVGs ready/.test(document.querySelector("#vctStatus")?.textContent||""),null,{timeout:120000});
 const status=await page.locator("#vctStatus").innerText();
 assert.match(status,/9 separate SVGs|9.*ready/i);
 assert.equal(await page.locator("#vctDownload").isDisabled(),false);
 assert.equal(await page.locator("#vctPreviews img").count(),9);

 // ALL artwork inputs must accept a raster JPEG, not only the Foundry's input.
 // Reuse the same JPEG but switch to single illustration to keep this fast.
 await page.locator("#vctLayout").selectOption("single");
 async function expectOneNewAsset(input,prior,label){
   await input.setInputFiles([{name:"route-"+label+".jpeg",mimeType:"image/jpeg",buffer:image}]);
   await page.waitForFunction(count=>document.querySelectorAll("#assetList .svg-tile").length===count
       &&/COLOR SVGs ready/.test(document.querySelector("#vctStatus")?.textContent||""),
       prior+1,{timeout:90000});
   assert.equal(await page.locator("#assetList .svg-tile").count(),prior+1,label+" imported jpeg");
 }
 await expectOneNewAsset(page.locator("#svgFiles"),9,"main");
 await expectOneNewAsset(page.locator("#captureFile"),10,"legacy-clean-capture");
 await page.evaluate(async encoded=>{
   const bytes=Uint8Array.from(atob(encoded),ch=>ch.charCodeAt(0));
   const file=new File([bytes],"dragged-test.jpeg",{type:"image/jpeg"});
   const transfer=new DataTransfer();transfer.items.add(file);
   const event=new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer:transfer});
   document.querySelector("#drop").dispatchEvent(event);
 },image.toString("base64"));
 await page.waitForFunction(()=>document.querySelectorAll("#assetList .svg-tile").length===12
    &&/COLOR SVGs ready/.test(document.querySelector("#vctStatus")?.textContent||""),null,{timeout:90000});
 assert.ok(!(await page.locator("#vctStatus").innerText()).includes("Not a valid SVG"));
 assert.equal(await page.locator("#assetList .svg-tile").count(),12,"dragged JPEG routed once");

 assert.equal(await page.locator("#assetList .svg-tile").count(),12,"9 contact sheet designs and three additional JPEG imports");
 assert.equal(await page.locator("#assetList .svg-tile").first().innerText().then(s=>s.includes("COLOR SVG")),true,"color SVG assets are labeled, not converted into monochrome fonts");

 await page.locator("#vctLayout").selectOption("four");
 assert.equal(await page.locator("#vctLayout").inputValue(),"four","2x2 sheets supported");
 assert.equal(errors.length,0,errors.join("\n"));
 console.log("PASS "+(process.env.PLAYWRIGHT_BROWSER||"chromium")+" iPhone-sized JPEG → nine color SVG assets:",status);
}finally{
 await browser.close();
}
