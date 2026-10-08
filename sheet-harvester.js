/* Daddy Dingy Sheet Harvester — browser-only; vector extraction, never raster exports. */
(function () {
  'use strict';
  const previousLoad = loadSVGFiles;
  const style = document.createElement('style');
  style.textContent = [
    '.harvest-backdrop[hidden]{display:none!important}',
    '.harvest-backdrop{position:fixed;inset:0;background:#05020cdd;z-index:900;display:flex;align-items:center;justify-content:center;padding:12px}',
    '.harvest-dialog{width:min(1050px,100%);max-height:95dvh;overflow:auto;border:2px solid #ff4bd4;border-radius:18px;background:#180e2b;box-shadow:0 20px 80px #000d;padding:15px}',
    '.harvest-head{display:flex;align-items:start;justify-content:space-between;gap:12px}',
    '.harvest-head h2{margin:0;color:#ff4bd4;font-size:clamp(19px,4vw,29px)}',
    '.harvest-head p{margin:3px 0 12px;color:#cfc0e2;font-size:12px}',
    '.harvest-work{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,245px);gap:15px;align-items:start}',
    '.harvest-picture{position:relative;background:white;margin:0 auto;width:min(100%,640px);border:2px solid #8b759e;border-radius:7px;overflow:hidden;touch-action:none}',
    '.harvest-picture img{display:block;width:100%;height:100%;pointer-events:none}',
    '.harvest-hit{position:absolute;border:2px solid #39ccde;background:#19e6f51a;color:#10212e;padding:0;border-radius:0;display:flex;align-items:flex-start;justify-content:flex-start;font:bold 13px sans-serif;min-width:0;overflow:hidden}',
    '.harvest-hit span{margin:3px;padding:2px 5px;background:#39ebef;color:#0e1023;border-radius:3px;pointer-events:none}',
    '.harvest-hit:not(.chosen){background:#fa399839;border-color:#ff578a;border-style:dashed;opacity:.5}',
    '.harvest-hit:not(.chosen) span{background:#ff9ca5}',
    '.harvest-manual{position:absolute;inset:0;z-index:5;cursor:crosshair;touch-action:none}',
    '.harvest-drawn{position:absolute;border:2px dashed #ff278e;background:#ff278e33;pointer-events:none;z-index:6}',
    '.harvest-tools{display:grid;gap:9px;align-content:start}',
    '.harvest-tools button{width:100%;white-space:normal}',
    '.harvest-tools label{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#e5d9f6;cursor:pointer}',
    '.harvest-tools input{accent-color:#ff4bd4}',
    '.harvest-tools .help{font-size:12px;line-height:1.45}',
    '.harvest-choice{color:#d5ff4b;font-weight:800;font-size:13px}',
    '@media(max-width:700px){.harvest-work{grid-template-columns:1fr}.harvest-tools{grid-template-columns:repeat(2,minmax(0,1fr))}.harvest-tools .help,.harvest-tools label,.harvest-choice{grid-column:1/-1}.harvest-dialog{padding:10px;max-height:97dvh}}'
  ].join('\n');
  document.head.append(style);
  const shell = document.createElement('div');
  shell.className = 'harvest-backdrop';
  shell.hidden = true;
  shell.innerHTML = '<div class="harvest-dialog" role="dialog" aria-modal="true" aria-label="SVG sheet harvester">' +
    '<div class="harvest-head"><div><h2>✂ THE SHEET HARVESTER</h2><p id="shSummary">One sheet. Many dings. No individual SVG exports.</p></div><button id="shClose" aria-label="Close sheet">✕</button></div>' +
    '<div class="harvest-work"><div class="harvest-picture" id="shPicture"><img id="shImage" alt="Full vector sheet"><div id="shRegions"></div><div class="harvest-manual" id="shManual" hidden></div><div class="harvest-drawn" id="shDrawn" hidden></div></div>' +
    '<div class="harvest-tools"><div class="harvest-choice" id="shCount">0 selected</div>' +
    '<label><input id="shFill" type="checkbox" checked> Auto-fill next EMPTY keyboard keys (lowercase first, then SHIFT). Never replace assigned keys.</label>' +
    '<button class="primary" id="shHarvest">✳ HARVEST SELECTED</button><button class="mint" id="shAll">⚡ HARVEST ALL + FILL KEYS</button>' +
    '<button id="shToggle">✎ Draw a custom box</button><button id="shAddBox" disabled>＋ Add drawn design</button>' +
    '<button id="shAsOne">Import whole SVG as ONE icon</button><button id="shCancel">Skip this sheet</button>' +
    '<p class="help">Tap numbered designs to include/exclude them. Draw a box if automatic separation missed something. Artwork remains vector — the preview scan only finds white gutters.</p></div></div></div>';
  document.body.append(shell);
  const q = id => shell.querySelector('#' + id);
  let current = null, drawStart = null;
  const number = n => Math.round(n * 100) / 100;
  function done() {
    const job = current;
    current = null; drawStart = null; shell.hidden = true;
    q('shManual').hidden = true;
    if (job) job.resolve();
  }
  function report() {
    if (!current) return;
    const count = current.selected.size;
    q('shCount').textContent = count + ' of ' + current.cells.length + ' designs selected';
    q('shHarvest').disabled = !count;
  }
  function boxPixels(region) {
    const v = current.view;
    return {
      left: (region.x - v.x) / v.w * 100,
      top: (region.y - v.y) / v.h * 100,
      width: region.w / v.w * 100,
      height: region.h / v.h * 100
    };
  }
  function setBoxStyle(el, region) {
    const v = boxPixels(region);
    el.style.left = v.left + '%';
    el.style.top = v.top + '%';
    el.style.width = v.width + '%';
    el.style.height = v.height + '%';
  }
  function renderRegions() {
    if (!current) return;
    const regionLayer = q('shRegions');
    regionLayer.replaceChildren();
    current.cells.forEach((region, index) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'harvest-hit' + (current.selected.has(index) ? ' chosen' : '');
      b.title = 'Toggle design ' + (index + 1);
      b.setAttribute('aria-pressed', current.selected.has(index) ? 'true' : 'false');
      b.innerHTML = '<span>' + (index + 1) + '</span>';
      setBoxStyle(b, region);
      b.onclick = () => {
        if (current.selected.has(index)) current.selected.delete(index);
        else current.selected.add(index);
        renderRegions();
      };
      regionLayer.append(b);
    });
    report();
  }
  function getRootView(svg) {
    const root = cleanSVG(svg).documentElement;
    const v = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (v.length === 4 && v.every(Number.isFinite) && v[2] > 0 && v[3] > 0)
      return {x:v[0], y:v[1], w:v[2], h:v[3]};
    const w = parseFloat(root.getAttribute('width')), h = parseFloat(root.getAttribute('height'));
    if (w > 0 && h > 0) return {x:0,y:0,w,h};
    throw Error('This sheet needs an SVG viewBox or numeric width and height.');
  }
  function bands(counts, other, size) {
    const minInk = Math.max(2, Math.round(other * .004));
    const runs = [];
    let from = -1;
    for (let i = 0; i <= counts.length; i++) {
      const on = i < counts.length && counts[i] >= minInk;
      if (on && from < 0) from = i;
      else if (!on && from >= 0) {runs.push([from,i]);from = -1;}
    }
    const joined = [];
    const gap = Math.max(3, Math.floor(size * .012));
    for (const run of runs) {
      if (joined.length && run[0] - joined[joined.length-1][1] <= gap)
        joined[joined.length-1][1] = run[1];
      else joined.push(run.slice());
    }
    const threshold = Math.max(5,Math.floor(size*.045));
    return joined.filter(r => r[1]-r[0]>=threshold);
  }
  function partitions(runs, max) {
    if (!runs.length) return [[0,max]];
    return runs.map((r,i) => [
      i ? Math.floor((runs[i-1][1]+r[0])/2) : 0,
      i < runs.length-1 ? Math.ceil((r[1]+runs[i+1][0])/2) : max
    ]);
  }
  async function scanSheet(svg) {
    const view = getRootView(svg);
    const img = new Image();
    const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await new Promise((resolve,reject) => {
      const timeout = setTimeout(() => reject(Error('SVG preview timed out')),12000);
      img.onload = () => {clearTimeout(timeout);resolve();};
      img.onerror = () => {clearTimeout(timeout);reject(Error('SVG image could not render'));};
      img.src = src;
    });
    const factor = Math.min(1, 670/view.w, 1000/view.h);
    const width = Math.max(60,Math.round(view.w*factor)),height = Math.max(60,Math.round(view.h*factor));
    const canvas = document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if (!ctx) throw Error('Canvas unavailable');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);
    ctx.drawImage(img,0,0,width,height);
    const pix=ctx.getImageData(0,0,width,height).data;
    const xs=new Uint32Array(width),ys=new Uint32Array(height),mask=new Uint8Array(width*height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const j=(y*width+x),i=j*4;
      if(pix[i]+pix[i+1]+pix[i+2]<610){
        xs[x]++;ys[y]++;mask[j]=1;
      }
    }
    const xr=bands(xs,height,width),yr=bands(ys,width,height);
    const columns=partitions(xr,width),rows=partitions(yr,height);
    let cells=[];
    if(columns.length <= 15 && rows.length <= 25 && columns.length * rows.length <= 180){
      for(const yb of rows)for(const xb of columns){
        let black=0;
        for(let y=yb[0];y<yb[1];y++)for(let x=xb[0];x<xb[1];x++)black+=mask[y*width+x];
        if(black < 14) continue;
        cells.push({x:view.x+xb[0]/width*view.w,y:view.y+yb[0]/height*view.h,w:(xb[1]-xb[0])/width*view.w,h:(yb[1]-yb[0])/height*view.h});
      }
    }
    if(!cells.length) cells=[view];
    return {src,view,cells,columns:columns.length,rows:rows.length};
  }
  function show(file,text,detected) {
    return new Promise(resolve=>{
      current = {file,text,resolve,view:detected.view,cells:detected.cells,selected:new Set(detected.cells.map((_,i)=>i)),manualRegion:null};
      q('shSummary').textContent=file.name + ' · ' + detected.columns + ' columns × ' + detected.rows + ' rows · ' + detected.cells.length + ' candidate dings';
      q('shImage').src=detected.src;
      q('shPicture').style.aspectRatio=detected.view.w+' / '+detected.view.h;
      q('shFill').checked = true;
      q('shToggle').textContent='✎ Draw a custom box';
      q('shManual').hidden=true;
      q('shDrawn').hidden=true;
      q('shAddBox').disabled=true;
      shell.hidden=false;
      renderRegions();
    });
  }
  function makeSVG(contours) {
    const bb=bbox(contours);
    const pad=Math.max(bb.w,bb.h)*.022 || 1;
    const bbpath=contours.map(c => 'M'+c.points.map(p=>number(p.x)+' '+number(p.y)).join('L')+'Z').join(' ');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+
      [number(bb.x0-pad),number(bb.y0-pad),number(bb.w+2*pad),number(bb.h+2*pad)].join(' ')+'">'+
      '<path fill="#000000" fill-rule="evenodd" d="'+bbpath+'"/></svg>';
  }
  const keySequence = (function(){
    const all = 'abcdefghijklmnopqrstuvwxyz'.split('').concat(rows.join('').split(''), rows.join('').split('').map(k=>displayKey(k,true)));
    return Array.from(new Set(all)).filter(k=>k!==' ');
  })();
  function harvest(regions, forceFill) {
    if(!current || !regions.length) return;
    let data;
    try { data=svgToContours(current.text,1200000,3); }
    catch(e){ toast('Sheet needs simpler SVG outlines: '+e.message);return; }
    const sourceBox=current.view;
    const minx=sourceBox.x,miny=sourceBox.y,maxx=minx+sourceBox.w,maxy=miny+sourceBox.h;
    const artwork=data.contours.filter(c=>{
      const b=bbox([c]);
      return !(b.w>sourceBox.w*.92 && b.h>sourceBox.h*.92 && b.x0<=minx+sourceBox.w*.05 && b.y0<=miny+sourceBox.h*.05 && b.x1>=maxx-sourceBox.w*.05 && b.y1>=maxy-sourceBox.h*.05);
    });
    let imported=0,assigned=0,skipped=0;
    let next=0;
    const fill = forceFill || q('shFill').checked;
    for(const region of regions){
      const selected=artwork.filter(c=>{
        const b=bbox([c]), x=(b.x0+b.x1)/2,y=(b.y0+b.y1)/2;
        return x>=region.x && x<=region.x+region.w && y>=region.y && y<=region.y+region.h;
      });
      const points=selected.reduce((n,c)=>n+c.points.length,0);
      if(!points || points>120000){skipped++;continue;}
      try{
        const svg=makeSVG(selected);
        const name=current.file.name.replace(/\.svg$/i,'')+' · '+String(imported+1).padStart(2,'0');
        const id='g'+(++idCounter);
        state.assets.push({id,name,svg,contours:selected,box:bbox(selected),warnings:[]});
        imported++;
        if(fill){
          while(next<keySequence.length && state.slots[keySequence[next]])next++;
          if(next<keySequence.length){
            state.slots[keySequence[next++]]={id,x:0,y:0,scale:100,rotation:0};
            assigned++;
          }
        }
      }catch(e){console.warn('Skipped a glyph',e);skipped++;}
    }
    state.activeAsset=null;
    render();saveLocal();
    toast(imported+' vector dings harvested · '+assigned+' keyboard keys filled'+(skipped?' · '+skipped+' skipped':'')+'.');
    if(imported) done();
  }
  q('shHarvest').onclick=()=> harvest([...current.selected].sort((a,b)=>a-b).map(i=>current.cells[i]),false);
  q('shAll').onclick=()=> {q('shFill').checked=true;harvest(current.cells,true);};
  q('shCancel').onclick=done;
  q('shClose').onclick=done;
  q('shAsOne').onclick=async()=>{const f=current.file;await previousLoad([f]);done();};
  q('shToggle').onclick=()=>{
    const layer=q('shManual');
    layer.hidden=!layer.hidden;
    q('shToggle').textContent=layer.hidden?'✎ Draw a custom box':'✓ Finish drawing / back to cells';
  };
  function coord(e){
    const rect=q('shPicture').getBoundingClientRect(),v=current.view;
    return {x:v.x+Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width))*v.w,
      y:v.y+Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))*v.h};
  }
  q('shManual').addEventListener('pointerdown',e=>{
    if(!current)return;
    e.preventDefault();drawStart=coord(e);
    q('shManual').setPointerCapture(e.pointerId);
    q('shAddBox').disabled=true;
    q('shDrawn').hidden=false;
  });
  q('shManual').addEventListener('pointermove',e=>{
    if(!current||!drawStart)return;
    const p=coord(e);
    const r={x:Math.min(drawStart.x,p.x),y:Math.min(drawStart.y,p.y),
      w:Math.abs(drawStart.x-p.x),h:Math.abs(drawStart.y-p.y)};
    current.manualRegion=r;setBoxStyle(q('shDrawn'),r);
  });
  q('shManual').addEventListener('pointerup',()=>{
    if(!drawStart||!current)return;
    drawStart=null;
    const r=current.manualRegion;
    q('shAddBox').disabled=!r || r.w<current.view.w*.008 || r.h<current.view.h*.008;
  });
  q('shManual').addEventListener('pointercancel',()=>{drawStart=null;});
  q('shAddBox').onclick=()=>{
    if(!current?.manualRegion)return;
    harvest([current.manualRegion],false);
  };
  loadSVGFiles=async function(files){
    for(const file of Array.from(files||[])){
      if(!/\.svg$/i.test(file.name) && file.type!=='image/svg+xml')continue;
      try{
        const text=await file.text();
        const scan=await scanSheet(text);
        if(scan.cells.length>=2) await show(file,text,scan);
        else await previousLoad([file]);
      }catch(e){
        console.warn('Sheet detection failed; trying regular SVG import',e);
        await previousLoad([file]);
      }
    }
  };
  $('drop').querySelector('b').textContent='⊕ DROP SINGLE SVGs OR FULL SHEETS';
  $('drop').querySelector('small').textContent='auto-slice sheets · auto-fill empty keyboard keys';
})();
