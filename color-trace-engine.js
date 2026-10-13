/* Daddy Dingy Color Vector Foundry — offline tracing, no API calls. */
(function(){
"use strict";
function distance(a,b){const r=a[0]-b[0],g=a[1]-b[1],bl=a[2]-b[2];return .30*r*r+.59*g*g+.11*bl*bl;}
function paletteFor(data,w,h,k,white){
 const hist=new Map(),bins=[];let count=0;
 for(let i=0;i<w*h;i++){
  const n=i*4,r=data[n],g=data[n+1],b=data[n+2];
  if(data[n+3]<80||Math.min(r,g,b)>=white)continue;
  count++;
  const key=((r>>4)<<8)|((g>>4)<<4)|(b>>4);
  let item=hist.get(key);
  if(!item){item={count:0,sums:[0,0,0],rgb:[r,g,b]};hist.set(key,item);}
  item.count++;item.sums[0]+=r;item.sums[1]+=g;item.sums[2]+=b;
 }
 if(!count)return [];
 for(const item of hist.values()){item.rgb=item.sums.map(v=>v/item.count);bins.push(item);}
 bins.sort((a,b)=>b.count-a.count);
 const eligible=bins.filter(b=>b.count>=Math.max(1,Math.floor(count*.0008))),seeds=[bins[0].rgb];
 while(seeds.length<k && seeds.length<eligible.length){
  let best=0,choice=null;
  for(const b of eligible){
   const nearest=Math.min(...seeds.map(s=>distance(s,b.rgb)));
   const score=nearest*Math.sqrt(b.count);
   if(score>best){best=score;choice=b;}
  }
  if(!choice||best<120)break;
  seeds.push(choice.rgb);
 }
 for(let round=0;round<8;round++){
  const totals=seeds.map(()=>({count:0,sums:[0,0,0]}));
  for(const b of bins){
   let nearest=0,min=Infinity;
   for(let j=0;j<seeds.length;j++){const d=distance(b.rgb,seeds[j]);if(d<min){min=d;nearest=j;}}
   const t=totals[nearest];t.count+=b.count;
   for(let j=0;j<3;j++)t.sums[j]+=b.sums[j];
  }
  for(let j=0;j<seeds.length;j++)if(totals[j].count)seeds[j]=totals[j].sums.map(v=>v/totals[j].count);
 }
 const modes=seeds.map(()=>null);
 for(const b of bins){
  let nearest=0,min=Infinity;
  for(let j=0;j<seeds.length;j++){const d=distance(b.rgb,seeds[j]);if(d<min){min=d;nearest=j;}}
  if(!modes[nearest]||b.count>modes[nearest].count)modes[nearest]=b;
 }
 return modes.filter(Boolean).map(b=>b.rgb.map(Math.round));
}
function segmentDistance(p,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1],square=dx*dx+dy*dy;
 const t=square?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/square)):0;
 return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
function simplifyLine(points,tol){
 if(points.length<3)return points;
 const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;
 const work=[[0,points.length-1]];
 while(work.length){
  const [a,b]=work.pop();let max=tol,index=-1;
  for(let i=a+1;i<b;i++){const d=segmentDistance(points[i],points[a],points[b]);if(d>max){max=d;index=i;}}
  if(index>=0){keep[index]=1;work.push([a,index],[index,b]);}
 }
 return points.filter((p,i)=>keep[i]);
}
function simplifyRing(loop,tolerance){
 const list=loop.slice(0,-1),sharp=[];
 for(let i=0;i<list.length;i++){
  const p=list[i],a=list[(i+list.length-1)%list.length],b=list[(i+1)%list.length];
  if((p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]))sharp.push(p);
 }
 if(sharp.length<4)return sharp;
 let greatest=-1,split=1;
 for(let i=1;i<sharp.length;i++){
  const d=(sharp[i][0]-sharp[0][0])**2+(sharp[i][1]-sharp[0][1])**2;
  if(d>greatest){greatest=d;split=i;}
 }
 const left=simplifyLine(sharp.slice(0,split+1),tolerance);
 const right=simplifyLine(sharp.slice(split).concat([sharp[0]]),tolerance);
 return left.slice(0,-1).concat(right.slice(0,-1));
}
function outline(labels,w,h,target,tol){
 const edges=[],at=new Map(),stride=w+1;
 function push(x,y,xx,yy,dir){
  const start=y*stride+x,end=yy*stride+xx,id=edges.length;
  edges.push({start,end,x,y,dir,used:false});
  if(!at.has(start))at.set(start,[]);
  at.get(start).push(id);
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const n=y*w+x;if(labels[n]!==target)continue;
  if(y===0||labels[n-w]!==target)push(x,y,x+1,y,0);
  if(x===w-1||labels[n+1]!==target)push(x+1,y,x+1,y+1,1);
  if(y===h-1||labels[n+w]!==target)push(x+1,y+1,x,y+1,2);
  if(x===0||labels[n-1]!==target)push(x,y+1,x,y,3);
 }
 let path="";
 for(let i=0;i<edges.length;i++){
  if(edges[i].used)continue;
  const start=edges[i].start,ring=[];let next=i,closed=false;
  for(let turns=0;turns<=edges.length;turns++){
   const e=edges[next];if(e.used)break;
   e.used=true;ring.push([e.x,e.y]);
   if(e.end===start){closed=true;break;}
   const choices=(at.get(e.end)||[]).filter(j=>!edges[j].used);
   if(!choices.length)break;
   const preference=[(e.dir+1)%4,e.dir,(e.dir+3)%4,(e.dir+2)%4];
   choices.sort((a,b)=>preference.indexOf(edges[a].dir)-preference.indexOf(edges[b].dir));
   next=choices[0];
  }
  if(!closed||ring.length<4)continue;
  ring.push(ring[0]);
  const vertices=simplifyRing(ring,tol);if(vertices.length<3)continue;
  let area=0;for(let j=0;j<vertices.length;j++){
   const a=vertices[j],b=vertices[(j+1)%vertices.length];
   area+=a[0]*b[1]-b[0]*a[1];
  }
  if(Math.abs(area)<2)continue;
  path+="M"+vertices.map(p=>p[0]+" "+p[1]).join("L")+"Z";
 }
 return path;
}
function trace(data,w,h,maxColors,whiteCutoff,tolerance){
 const palette=paletteFor(data,w,h,maxColors,whiteCutoff);
 if(!palette.length)throw Error("No colored artwork detected. Adjust the white threshold.");
 const labels=new Int16Array(w*h);labels.fill(-1);
 let x0=w,y0=h,x1=0,y1=0,visible=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,p=i*4,r=data[p],g=data[p+1],b=data[p+2];
  if(data[p+3]<80||Math.min(r,g,b)>=whiteCutoff)continue;
  let nearest=0,best=Infinity;
  for(let j=0;j<palette.length;j++){
   const d=distance([r,g,b],palette[j]);if(d<best){best=d;nearest=j;}
  }
  labels[i]=nearest;visible++;
  x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);
 }
 if(!visible)throw Error("No colored pixels remain.");
 const pad=Math.max(2,Math.round(Math.min(w,h)*.04));
 x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(w,x1+pad);y1=Math.min(h,y1+pad);
 let shapes="",layers=0;
 for(let j=0;j<palette.length;j++){
  const d=outline(labels,w,h,j,tolerance);if(!d)continue;
  const hex="#"+palette[j].map(v=>Math.round(v).toString(16).padStart(2,"0")).join("");
  shapes+='<path fill="'+hex+'" fill-rule="evenodd" d="'+d+'"/>';layers++;
 }
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+[x0,y0,x1-x0,y1-y0].join(" ")+'" data-ding-traced="1">'+shapes+'</svg>';
 return {svg,palette,layers,visible,bytes:svg.length};
}
window.DaddyDingyTraceColors={trace,paletteFor};
})();