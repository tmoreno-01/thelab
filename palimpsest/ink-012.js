/* PALIMPSEST 012 — cartographic micro-ecologies */
(function(root){"use strict";
const N=960,HOUT=720,FPS=24,W=192,H=144,G=72,INK="#292720",PAPER="#eee9df",WHITE="#eee9df",KEY="lifeafterlogic.palimpsest.memory.v4",PALETTE_KEY="lifeafterlogic.palimpsest.012.palette";
const SOURCES=[
{id:"cartography-main",label:"Cartography / whole field",family:"cartographic",url:"./cartography-reference.svg",crop:0},
{id:"cartography-detail",label:"Cartography / micro-detail",family:"geological",url:"./cartography-reference.svg",crop:1},
{id:"flowers-12",label:"Botanical field",family:"botanical",url:"../media/field-studies-012-flowers.jpg"},
{id:"flowers-10",label:"Botanical detail",family:"botanical",url:"../media/field-studies-010-flowers.jpg"},
{id:"plant-surface",label:"Plant surface",family:"botanical",url:"../room/assets-local/potted_plant_02/potted_plant_02_leaves_diff_2k.jpg"},
{id:"london-field",label:"Urban strata",family:"urban",url:"../media/field-studies-london.jpg"},
{id:"ink-study",label:"Ink study",family:"drawn",url:"./palimpsest-001-detail.jpg"}
];
const SCHEMES=[
 {name:"Graphite & verdigris",colours:["#568a83","#7da69d","#a8b8ae","#7b766c"]},
 {name:"Petrol sediment",colours:["#3f7773","#67958d","#a0b4a9","#8c8375"]},
 {name:"Mineral wash",colours:["#6c9c92","#93b1a7","#557d79","#aaa596"]}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
 const GRAMMARS=["graft","branch","fracture","weave","strata"];
function rng(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
function key(p){return Math.round(p[0]*1000)+","+Math.round(p[1]*1000);}
function distance(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
function pathLength(p){let n=0;for(let i=1;i<p.length;i++)n+=distance(p[i-1],p[i]);return n;}
function area(p){let a=0;for(let i=0;i<p.length;i++){let q=p[(i+1)%p.length];a+=p[i][0]*q[1]-q[0]*p[i][1];}return Math.abs(a*.5);}
function loadImage(src){return new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src;});}
function joinSegments(segments,level){
 const adj=new Map(),used=new Uint8Array(segments.length);
 const add=(k,i)=>{let a=adj.get(k);if(!a)adj.set(k,a=[]);a.push(i);};
 for(let i=0;i<segments.length;i++){add(key(segments[i][0]),i);add(key(segments[i][1]),i);}
 function walk(start,first){let pts=[],at=start,si=first,guard=0,closed=false;while(si!==undefined&&!used[si]&&guard++<segments.length+2){const s=segments[si],ka=key(s[0]),kb=key(s[1]),next=ka===at?s[1]:s[0],nk=key(next);used[si]=1;if(!pts.length)pts.push(ka===at?s[0]:s[1]);pts.push(next);at=nk;if(at===start&&pts.length>4){closed=true;break;}const choices=(adj.get(at)||[]).filter(i=>!used[i]);si=choices.length?choices[0]:undefined;}return{pts,closed,level};}
 const out=[];for(const [k,list] of adj){if(list.length===1&&!used[list[0]])out.push(walk(k,list[0]));}
 for(let i=0;i<segments.length;i++)if(!used[i])out.push(walk(key(segments[i][0]),i));
 return out;
}
function contours(gray,w,h){
 const out=[],levels=[30,58,86,114,142,170,198,222];
 for(const level of levels){const segs=[];for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++){
  const a=gray[y*w+x],b=gray[y*w+x+1],c=gray[(y+1)*w+x+1],d=gray[(y+1)*w+x],hits=[];
  function cross(v1,v2,p1,p2){if((v1<level)===(v2<level))return;let t=(level-v1)/(v2-v1);hits.push([mix(p1[0],p2[0],t),mix(p1[1],p2[1],t)]);}
  cross(a,b,[x,y],[x+1,y]);cross(b,c,[x+1,y],[x+1,y+1]);cross(c,d,[x+1,y+1],[x,y+1]);cross(d,a,[x,y+1],[x,y]);
  if(hits.length===2)segs.push(hits);
  else if(hits.length===4){const mid=(a+b+c+d)*.25;if(mid<level)segs.push([hits[0],hits[1]],[hits[2],hits[3]]);else segs.push([hits[0],hits[3]],[hits[1],hits[2]]);}
 }
  const lines=joinSegments(segs,level);for(const q of lines){if(q.pts.length<5)continue;let len=pathLength(q.pts);if(len<5)continue;let pts=q.pts;if(pts.length>110){const reduced=[];for(let i=0;i<110;i++)reduced.push(pts[Math.round(i*(pts.length-1)/109)]);pts=reduced;}let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,turn=0;for(let j=0;j<pts.length;j++){const p=pts[j],n=pts[(j+1)%pts.length];minX=Math.min(minX,p[0]);minY=Math.min(minY,p[1]);maxX=Math.max(maxX,p[0]);maxY=Math.max(maxY,p[1]);if(j>0&&j<pts.length-1){const u=pts[j-1],v=[p[0]-u[0],p[1]-u[1]],w=[n[0]-p[0],n[1]-p[1]];turn+=Math.abs(Math.atan2(v[0]*w[1]-v[1]*w[0],v[0]*w[0]+v[1]*w[1]));}}const bw=maxX-minX,bh=maxY-minY;out.push({pts,closed:q.closed,len,level,area:q.closed?area(pts):0,aspect:Math.max(bw,bh)/(Math.min(bw,bh)+1),orientation:Math.atan2(pts[pts.length-1][1]-pts[0][1],pts[pts.length-1][0]-pts[0][0]),curvature:turn/Math.max(1,pts.length-2)});}
 }
 const long=out.filter(p=>p.len>20).sort((a,b)=>b.len-a.len).slice(0,92),longSet=new Set(long),small=out.filter(p=>!longSet.has(p));let seed=91827;const R=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);for(let i=small.length-1;i>0;i--){let j=Math.floor(R()*(i+1));[small[i],small[j]]=[small[j],small[i]];}const keep=long.concat(small.slice(0,Math.max(0,250-long.length)));return keep;
}
function extract(im,meta,variant=0){
 const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d",{willReadFrequently:true});const zoom=variant===0?1:1.68,scale=Math.max(W/im.width,H/im.height)*zoom,dw=im.width*scale,dh=im.height*scale,fx=variant===0?.5:variant===1?.27:variant===2?.73:.52,fy=variant===0?.5:variant===1?.28:variant===2?.72:.74;x.drawImage(im,(W-dw)*fx,(H-dh)*fy,dw,dh);
 const data=x.getImageData(0,0,W,H).data,gray=new Uint8Array(W*H);let mean=0,edge=0,orientX=0,orientY=0;
 for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){let i=(y*W+xx)*4,v=Math.round(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]);gray[y*W+xx]=v;mean+=v;}
 mean/=W*H;
 for(let y=1;y<H-1;y+=2)for(let xx=1;xx<W-1;xx+=2){let i=y*W+xx,gx=-gray[i-W-1]+gray[i-W+1]-2*gray[i-1]+2*gray[i+1]-gray[i+W-1]+gray[i+W+1],gy=-gray[i-W-1]-2*gray[i-W]-gray[i-W+1]+gray[i+W-1]+2*gray[i+W]+gray[i+W+1],m=Math.hypot(gx,gy);if(m>90)edge++;orientX+=gx*gx-gy*gy;orientY+=2*gx*gy;}
 const paths=contours(gray,W,H);const feature={mean:mean/255,edge:edge/(W*H/4),orientation:Math.atan2(orientY,orientX)*.5,complexity:paths.length/200,variance:0};
 let variance=0;for(let i=0;i<gray.length;i+=3)variance+=(gray[i]-mean)*(gray[i]-mean);feature.variance=Math.sqrt(variance/(gray.length/3))/255;
 return {...meta,id:meta.id+"-plate-"+(variant+1),label:meta.label+" / "+(variant===0?"whole":"detail"),sourceId:meta.id,variant,paths,feature};
}
function create(canvas,seed=(Math.random()*4294967295)>>>0,onStatus=()=>{}){
 canvas.width=N;canvas.height=HOUT;const ctx=canvas.getContext("2d",{alpha:false});const paperCanvas=document.createElement("canvas");paperCanvas.width=N;paperCanvas.height=HOUT;const paperCtx=paperCanvas.getContext("2d",{alpha:false});const washCanvas=document.createElement("canvas");washCanvas.width=N;washCanvas.height=HOUT;const washCtx=washCanvas.getContext("2d",{alpha:true});const inkCanvas=document.createElement("canvas");inkCanvas.width=N;inkCanvas.height=HOUT;const inkCtx=inkCanvas.getContext("2d",{alpha:true});
 let R=rng(seed),originSeed=seed>>>0,frame=0,marks=0,bundles=0,atlas=[],session=[],tracks=[],density=new Float32Array(G*G),history=[],field=[0,0,0,0],recent=[],memory=readMemory(),readyState=false,failed=0,lastSources=[],previousSources=[],pendingSeed=originSeed,anchors=[],engravings=0,morphs=0,nestedForms=0,strokes=0,slowStrokes=0,colourStrokes=0,colourBundles=0,motifEchoes=0,counterpoints=0,fastStrokes=0,sessionPalette=null,hybrids=0,shapeHistory=[],lineages=[],lineageSerial=0,births=0,mutations=0,splits=0,chapters=0,branches=0,fractures=0,grafts=0,erasures=0,nextBirthFrame=0,nextChapterFrame=0,nextErosionFrame=0,phase="emergence",coverage=0,compositionBalance=1,weatheredSites=[];
 const rand=(a,b)=>mix(a,b,R()),pick=a=>a[Math.floor(R()*a.length)];
 function genome(parent=null,grammar=null){return{id:++lineageSerial,parent:parent?parent.id:null,generation:parent?parent.generation+1:0,grammar:grammar||pick(GRAMMARS),family:parent?parent.family:pick(["cartographic","geological","botanical","organic","drawn","marine","urban","architectural","object","abstract"]),scale:parent?clamp(parent.scale*rand(.78,1.24),.52,1.72):rand(.68,1.38),aspect:parent?clamp(parent.aspect*rand(.74,1.28),.28,1.92):rand(.38,1.58),angle:parent?parent.angle+rand(-.88,.88):rand(-Math.PI,Math.PI),warp:parent?clamp(parent.warp+rand(-5.5,5.5),2,29):rand(4,18),fragment:parent?clamp(parent.fragment+rand(-.13,.13),.08,.76):rand(.16,.48),graft:parent?clamp(parent.graft+rand(-.12,.12),.08,.68):rand(.20,.48),branch:parent?clamp(parent.branch+rand(-.12,.12),.06,.62):rand(.12,.34),weave:parent?clamp(parent.weave+rand(-.10,.10),.06,.58):rand(.10,.32),strata:parent?clamp(parent.strata+rand(-.12,.12),.05,.52):rand(.08,.28),tempo:parent?clamp(parent.tempo*rand(.78,1.25),.52,1.85):rand(.72,1.38),births:0,activity:0,born:frame};}
 function initialiseLineages(saved){lineages=[];lineageSerial=0;if(saved&&Array.isArray(saved.lineages))for(const old of saved.lineages.slice(0,3)){const g=genome(null,old.grammar);Object.assign(g,old,{id:++lineageSerial,parent:null,births:0,activity:0,born:frame});lineages.push(g);}const opening=["graft","branch","fracture","weave","strata"];while(lineages.length<5)lineages.push(genome(null,opening[lineages.length]));}
 function chooseLineage(){if(!lineages.length)initialiseLineages(null);const weights=lineages.map(g=>1/(1+g.births*.24+g.activity*.012)+R()*.22);let n=R()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<lineages.length;i++){n-=weights[i];if(n<=0)return lineages[i];}return lineages[0];}
 function evolveLineage(){if(!lineages.length)return;const parent=pick(lineages),grammar=R()<.78?pick(GRAMMARS.filter(x=>x!==parent.grammar)):parent.grammar;const child=genome(parent,grammar);lineages.push(child);mutations++;splits++;if(lineages.length>7){const candidates=lineages.filter(g=>g.id!==child.id);candidates.sort((a,b)=>(a.activity+a.births*.5)-(b.activity+b.births*.5));lineages.splice(lineages.indexOf(candidates[0]),1);}}
 function compositionMetrics(){let total=0,cx=0,cy=0;const q=[0,0,0,0],qn=[0,0,0,0];for(let y=0;y<G;y++)for(let x=0;x<G;x++){const v=density[y*G+x];total+=v;cx+=v*(x+.5);cy+=v*(y+.5);const k=(x>=G/2?1:0)+(y>=G/2?2:0);q[k]+=v;qn[k]++;}for(let i=0;i<4;i++)q[i]/=qn[i]||1;const mean=q.reduce((a,b)=>a+b,0)/4,max=Math.max(...q),min=Math.min(...q);coverage=total/(G*G);compositionBalance=1-(max-min)/(max+.0001);const centroid=total>.001?[cx/total/G,cy/total/G]:[.5,.5];phase=coverage<.035?"emergence":coverage<.085?"interweaving":coverage<.16?"consolidation":coverage<.25?"reinscription":"micro-detail";return{coverage,balance:compositionBalance,quadrants:q,mean,centroid};}
 function branchFrom(host,donor,fraction,angle,scale){if(host.length<5||donor.length<5)return[];const base=resample(host,Math.max(24,Math.min(72,host.length))),idx=clamp(Math.floor(fraction*(base.length-1)),3,base.length-4),anchor=base[idx],tangent=Math.atan2(base[idx+3][1]-base[idx-3][1],base[idx+3][0]-base[idx-3][0]);const part=fragment(donor,rand(.04,.28),rand(.68,.96));if(part.length<4)return[];const sourceAngle=Math.atan2(part[Math.min(3,part.length-1)][1]-part[0][1],part[Math.min(3,part.length-1)][0]-part[0][0]),rot=tangent+angle-sourceAngle,c=Math.cos(rot),sn=Math.sin(rot);return[anchor,...part.slice(1).map(p=>{const x=(p[0]-part[0][0])*scale,y=(p[1]-part[0][1])*scale;return[anchor[0]+x*c-y*sn,anchor[1]+x*sn+y*c];})];}
 function fracturePath(path,count){const pts=resample(path,Math.max(30,Math.min(90,path.length*2))),out=[];let at=rand(0,.08);for(let i=0;i<count&&at<.96;i++){const start=clamp(at,0,.94),end=clamp(start+rand(.10,.28),start+.06,.99),part=pts.slice(Math.floor(start*(pts.length-1)),Math.max(Math.floor(start*(pts.length-1))+4,Math.ceil(end*(pts.length-1))+1));if(part.length>3)out.push(part);at=end+rand(.025,.09);}return out;}
 function offsetPath(path,offset){const out=[];for(let i=0;i<path.length;i++){const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;out.push([path[i][0]-dy/d*offset,path[i][1]+dx/d*offset]);}return out;}
 function erodeRegion(){const old=anchors.filter(a=>frame-a.age>FPS*48);if(!old.length)return false;const anchor=pick(old),patches=2+Math.floor(R()*3),sites=[];washCtx.save();washCtx.globalCompositeOperation="destination-out";inkCtx.save();inkCtx.globalCompositeOperation="destination-out";for(let i=0;i<patches;i++){const cx=anchor.x+rand(-anchor.rx*.34,anchor.rx*.34),cy=anchor.y+rand(-anchor.rx*.34,anchor.rx*.34),radius=rand(15,42),points=10+Math.floor(R()*7);inkCtx.globalAlpha=rand(.12,.24);inkCtx.beginPath();for(let j=0;j<points;j++){const a=j/points*Math.PI*2,r=radius*rand(.66,1.28),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(j===0)inkCtx.moveTo(x,y);else inkCtx.lineTo(x,y);}inkCtx.closePath();inkCtx.fill();sites.push({x:cx,y:cy,r:radius});const gx0=Math.max(0,Math.floor((cx-radius)/N*G)),gx1=Math.min(G-1,Math.ceil((cx+radius)/N*G)),gy0=Math.max(0,Math.floor((cy-radius)/HOUT*G)),gy1=Math.min(G-1,Math.ceil((cy+radius)/HOUT*G));for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){const px=(gx+.5)*N/G,py=(gy+.5)*HOUT/G;if(Math.hypot(px-cx,py-cy)<radius)density[gy*G+gx]*=.38;}}inkCtx.restore();washCtx.restore();weatheredSites.push(...sites.map(p=>({...p,age:frame})));weatheredSites=weatheredSites.slice(-12);erasures++;render();return true;}
 function isColour(c){return !!c&&!([INK,WHITE,PAPER].includes(c));}
 function selectPalette(){
  let last=sessionPalette?.name||"";try{last=localStorage.getItem(PALETTE_KEY)||last;}catch(e){}
  const options=SCHEMES.filter(p=>p.name!==last),scheme=pick(options.length?options:SCHEMES),colours=scheme.colours.slice();
  try{localStorage.setItem(PALETTE_KEY,scheme.name);}catch(e){}
  return {name:scheme.name,colours};
 }
 function chooseLineColour(base,role,palette,enabled,strength=1){
  if(!enabled||!palette||role==="outline")return base;
  const rates={primary:.16,engrave:.12,crosshatch:.14,nested:.12,echo:.10,morph:.19,splice:.18,branch:.15,fracture:.12,strata:.14};
  if(R()>(rates[role]||.06)*strength)return base;
  return pick(palette.colours);
 }
 function readMemory(){try{let m=JSON.parse(localStorage.getItem(KEY)||"{}");return{directions:Array.isArray(m.directions)?m.directions.slice(0,12):[],recent:Array.isArray(m.recent)?m.recent.slice(0,16):[]};}catch(e){return{directions:[],recent:[]};}}
 function writeMemory(){try{localStorage.setItem(KEY,JSON.stringify(memory));return true;}catch(e){return false;}}
 function paper(){paperCtx.fillStyle=PAPER;paperCtx.fillRect(0,0,N,HOUT);const tile=document.createElement("canvas");tile.width=128;tile.height=128;const t=tile.getContext("2d"),im=t.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){let n=rand(-10,10);im.data[i]=238+n;im.data[i+1]=233+n;im.data[i+2]=220+n;im.data[i+3]=255;}t.putImageData(im,0,0);paperCtx.fillStyle=paperCtx.createPattern(tile,"repeat");paperCtx.globalAlpha=.25;paperCtx.fillRect(0,0,N,N);paperCtx.globalAlpha=1;washCtx.clearRect(0,0,N,HOUT);inkCtx.clearRect(0,0,N,HOUT);}
 function densityAt(x,y,r=24){let sum=0,n=0;const step=14;for(let yy=-r;yy<=r;yy+=step)for(let xx=-r;xx<=r;xx+=step){if(xx*xx+yy*yy>r*r)continue;let gx=Math.floor((x+xx)/N*G),gy=Math.floor((y+yy)/HOUT*G);if(gx<0||gy<0||gx>=G||gy>=G)continue;sum+=density[gy*G+gx];n++;}return n?sum/n:0;}
 function touchDensity(x,y,w,color){let v=color===INK?1:isColour(color)?.73:0,rad=Math.max(2,w*.8),x0=Math.max(0,Math.floor((x-rad)/N*G)),x1=Math.min(G-1,Math.ceil((x+rad)/N*G)),y0=Math.max(0,Math.floor((y-rad)/HOUT*G)),y1=Math.min(G-1,Math.ceil((y+rad)/HOUT*G));for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){let px=(gx+.5)*N/G,py=(gy+.5)*HOUT/G;if(Math.hypot(px-x,py-y)<rad+N/G*.45){let k=gy*G+gx;density[k]=mix(density[k],v,.12);}}}
 function warp(x,y,amount=12){let fx=field[0],fy=field[1],f=field[2];return[x+Math.sin(y*.009+fx)*amount+Math.sin((x+y)*.014+f)*amount*.32,y+Math.cos(x*.008+fy)*amount+Math.sin((x-y)*.012+f)*amount*.28];}
 function transformPath(path,cx,cy,rx,ry,angle,flip,amount){const ca=Math.cos(angle),sa=Math.sin(angle),out=[];for(const p of path.pts){let u=(p[0]/W-.5)*2*(flip?-1:1),v=(p[1]/H-.5)*2,xx=u*rx,yy=v*ry,x=cx+xx*ca-yy*sa,y=cy+xx*sa+yy*ca;out.push(warp(x,y,amount));}return out;}
 function chooseSession(){
  const usable=atlas.filter(a=>a.paths.length),fav=memory.directions.length&&R()<.22?pick(memory.directions):null;
  let ids=fav?fav.sources.filter(id=>usable.some(a=>a.id===id)):[];
  const required=usable.filter(a=>a.family==="cartographic"||a.family==="geological");
  for(const a of required.slice(0,2))if(!ids.includes(a.id))ids.push(a.id);
  let pool=usable.filter(a=>!ids.includes(a.id));for(let i=pool.length-1;i>0;i--){let j=Math.floor(R()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  while(ids.length<Math.min(6,usable.length)&&pool.length){let candidate=pool.shift(),same=ids.some(id=>usable.find(a=>a.id===id)?.family===candidate.family);if(same&&R()<.38&&pool.length>1){pool.push(candidate);continue;}ids.push(candidate.id);}
  if(ids.length<3)ids=usable.slice(0,Math.min(6,usable.length)).map(a=>a.id);
  previousSources=memory.recent.slice(0,16);session=ids.map(id=>usable.find(a=>a.id===id)).filter(Boolean);lastSources=session.map(s=>s.id);memory.recent=lastSources.concat(previousSources).slice(0,16);writeMemory();
  return fav;
 }
 function chooseSource(exclude,familyHint){let options=session.filter(s=>s.paths.length&&(!exclude||s.id!==exclude));if(!options.length)options=session.filter(s=>s.paths.length);let weights=options.map(s=>{let rec=recent.slice(-10).filter(x=>x===s.id).length+(previousSources.slice(0,10).filter(x=>x===s.id).length*.9);let novelty=1/(1+rec*1.8);let complexity=.6+s.feature.complexity*.7,familyBias=familyHint?(s.family===familyHint?1.48:.86):1;return novelty*complexity*familyBias*(s.family==="drawn"?.8:1);});let total=weights.reduce((a,b)=>a+b,0),v=R()*total;for(let i=0;i<options.length;i++){v-=weights[i];if(v<=0)return options[i];}return options[0];}
 function chooseCounterSource(source){
  const options=session.filter(s=>s.id!==source.id&&s.paths.length);
  if(!options.length)return chooseSource(source.id);
  const affinity={
   botanical:{urban:1.5,architectural:1.45,object:1.25,drawn:1.08,particle:1.35,abstract:1.2,organic:.92},
   urban:{botanical:1.5,organic:1.35,object:1.2,architectural:1.02,particle:1.35,drawn:1.12,abstract:1.25},
   object:{botanical:1.3,urban:1.2,architectural:1.15,drawn:1.4,organic:1.35,particle:1.2,abstract:1.25},
   drawn:{object:1.4,botanical:1.12,urban:1.1,architectural:1.2,particle:1.1,abstract:1.3,organic:1.15},
   particle:{urban:1.35,botanical:1.35,object:1.2,architectural:1.2,organic:1.2,abstract:1.3,drawn:1.1},
   architectural:{botanical:1.45,organic:1.4,object:1.15,drawn:1.2,particle:1.2,abstract:1.2,urban:1.04},
   organic:{urban:1.35,architectural:1.4,object:1.25,particle:1.2,botanical:1.1,drawn:1.1,abstract:1.25},
   abstract:{botanical:1.2,urban:1.25,object:1.25,drawn:1.3,particle:1.3,organic:1.25,architectural:1.15}
  };
  const weights=options.map(s=>{
   const rec=recent.slice(-10).filter(x=>x===s.id).length+previousSources.slice(0,10).filter(x=>x===s.id).length*.9;
   const pairRecency=history.slice(-10).filter(pair=>(pair[0]===source.id&&pair[1]===s.id)||(pair[1]===source.id&&pair[0]===s.id)).length,novelty=1/(1+rec*1.35+pairRecency*1.8),contrast=s.family===source.family?.28:(affinity[source.family]?.[s.family]||1.15);
   const featureDistance=Math.abs(s.feature.mean-source.feature.mean)*.35+Math.abs(s.feature.variance-source.feature.variance)*.35+Math.abs(s.feature.edge-source.feature.edge)*.5;
   return novelty*contrast*(.85+featureDistance*.75)*(.85+s.feature.complexity*.3);
  });
  let total=weights.reduce((a,b)=>a+b,0),v=R()*total;
  for(let i=0;i<options.length;i++){v-=weights[i];if(v<=0)return options[i];}
  return options[0];
 }
 function matchPath(source,target,used){if(!source||!source.paths.length)return null;let best=[],targetAspect=target.aspect||1,targetCurvature=target.curvature||0;for(let i=0;i<source.paths.length;i++){if(used.has(i))continue;let p=source.paths[i];if(p.len<7)continue;const q=p.shape||(p.shape=describeShape(p));let score=(q.coil?3:0)+q.round*q.round*1.25+Math.abs(Math.log((p.len+1)/(target.len+1)))*.34+Math.abs(Math.log((p.aspect||1)/targetAspect))*.68+Math.abs((p.curvature||0)-targetCurvature)*.38+(p.closed===target.closed?0:.42)+(p.closed&&target.closed?Math.abs(Math.log((p.area+30)/(target.area+30)))*.18:0)+Math.abs(p.level-target.level)/255*.14+R()*.12;best.push({p,i,score});}if(!best.length)return choosePath(source,used);best.sort((a,b)=>a.score-b.score);let choice=best[Math.floor(Math.pow(R(),1.8)*Math.min(8,best.length))];used.add(choice.i);return choice.p;}
 function candidatePlacement(genomeHint){let best=null;const m=compositionMetrics(),target=m.coverage<.035?.105:m.coverage<.10?.075:m.coverage<.20?.045:.022,relationRoll=R(),relation=relationRoll<.26?"echo":relationRoll<.53?"counterpoint":"independent";for(let i=0;i<76;i++){const x=rand(64,N-64),y=rand(48,HOUT-48),d=densityAt(x,y,rand(28,88)),quadrant=(x>N/2?1:0)+(y>HOUT/2?2:0);const gx=densityAt(x+30,y,24)-densityAt(x-30,y,24),gy=densityAt(x,y+30,24)-densityAt(x,y-30,24),edge=Math.hypot(gx,gy),orientation=Math.atan2(gy,gx)+Math.PI*.5;let nearest=null,nearestDistance=Infinity;for(const a of anchors){const dist=distance([x,y],[a.x,a.y]);if(dist<nearestDistance){nearestDistance=dist;nearest=a;}}const near=anchors.reduce((n,a)=>n+Math.exp(-distance([x,y],[a.x,a.y])/155)*Math.exp(-(frame-a.age)/(FPS*150)),0);const quadrantNeed=(m.mean-m.quadrants[quadrant])*2.1,edgeBalance=Math.min(1,edge*3.2),whiteSpace=clamp((.20-d)/.20,0,1),spacing=nearest?Math.exp(-Math.abs(nearestDistance-(genomeHint?.scale||1)*165)/150):.12,centroidPull=Math.hypot(x/N-m.centroid[0],y/N-m.centroid[1]),weathered=weatheredSites.reduce((n,p)=>n+Math.exp(-distance([x,y],[p.x,p.y])/(p.r*2.8))*Math.exp(-(frame-p.age)/(FPS*55)),0),relationScore=nearest?(relation==="echo"?spacing*.22:relation==="counterpoint"?clamp(nearestDistance/520,0,1)*.16:0):0,score=1-Math.abs(d-target)*3.5-near*.13+quadrantNeed+edgeBalance*.13+whiteSpace*.08+relationScore+weathered*.22+centroidPull*.035+R()*.26;if(!best||score>best.score)best={x,y,d,edge,orientation,score,nearest,nearestDistance,relation,quadrant};}return best||{x:480,y:480,d:0,edge:0,orientation:0,nearest:null,relation:"independent",quadrant:0};}
 function describeShape(p){
  const pts=p.pts,len=Math.max(1,p.len),end=distance(pts[0],pts[pts.length-1]);let pos=0,neg=0,turn=0;
  for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1],v=Math.atan2((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]),(b[0]-a[0])*(c[0]-b[0])+(b[1]-a[1])*(c[1]-b[1]));turn+=Math.abs(v);if(v>.10)pos+=v;else if(v<-.10)neg-=v;}
  const coherence=Math.abs(pos-neg)/Math.max(.01,pos+neg),round=p.closed?clamp(4*Math.PI*p.area/(len*len),0,1):0;
  const coil=coherence>.67&&turn>Math.PI*2.1&&end/len<.30;
  return {round,coil,turn,complexity:clamp((1-coherence)*turn/12,0,2),key:[p.closed?1:0,Math.round(Math.log1p(len)*2),Math.round(Math.log1p(p.aspect)*2),Math.round(round*4),Math.round(coherence*3)].join(":")};
 }
 function choosePath(source,used){if(!source||!source.paths.length)return null;
  let pool=source.paths.filter((p,i)=>!used.has(i)&&p.len>7);if(!pool.length){used.clear();pool=source.paths;}
  const weights=pool.map(p=>{const q=p.shape||(p.shape=describeShape(p)),repeats=shapeHistory.filter(k=>k===q.key).length;
   return Math.min(2.2,.45+p.len/75)*(q.coil?.24:q.round>.65?.48:q.round>.42?.78:1.2)*(p.closed?.96:1.18)*(.72+q.complexity*.8)/(1+repeats*.48);});
  let v=R()*weights.reduce((a,b)=>a+b,0),choice=pool[pool.length-1];for(let i=0;i<pool.length;i++){v-=weights[i];if(v<=0){choice=pool[i];break;}}
  used.add(source.paths.indexOf(choice));const q=choice.shape||(choice.shape=describeShape(choice));shapeHistory.push(q.key);if(shapeHistory.length>54)shapeHistory.shift();return choice;
 }
 function resample(path,n){if(path.length<2)return path;let lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+distance(path[i-1],path[i]));let total=lengths[lengths.length-1]||1,out=[];for(let j=0;j<n;j++){let d=total*j/(n-1),i=1;while(i<lengths.length-1&&lengths[i]<d)i++;let t=(d-lengths[i-1])/(lengths[i]-lengths[i-1]||1);out.push([mix(path[i-1][0],path[i][0],t),mix(path[i-1][1],path[i][1],t)]);}return out;}
 function interpolatePath(a,b,t){let n=Math.max(12,Math.min(64,Math.max(a.length,b.length))),aa=resample(a,n),bb=resample(b,n);if(distance(aa[0],bb[n-1])+distance(aa[n-1],bb[0])<distance(aa[0],bb[0])+distance(aa[n-1],bb[n-1]))bb.reverse();return aa.map((p,i)=>[mix(p[0],bb[i][0],t),mix(p[1],bb[i][1],t)]);}
 function fragment(path,lo,hi){const p=resample(path,36);return p.slice(Math.floor(lo*35),Math.max(Math.floor(lo*35)+3,Math.ceil(hi*35)+1));}
 function graft(a,b){
  const cut=fragment(a,rand(0,.16),rand(.52,.86)),tail=fragment(b,rand(.03,.30),rand(.67,1));if(R()<.5)tail.reverse();
  const join=cut[cut.length-1],prev=cut[cut.length-3],head=tail[0],next=tail[Math.min(3,tail.length-1)],rot=Math.atan2(join[1]-prev[1],join[0]-prev[0])-Math.atan2(next[1]-head[1],next[0]-head[0])+rand(-.9,1.05),c=Math.cos(rot),s=Math.sin(rot),scale=rand(.46,1.28);
  const moved=tail.slice(1).map(p=>{const x=(p[0]-head[0])*scale,y=(p[1]-head[1])*scale;return[join[0]+x*c-y*s,join[1]+x*s+y*c];});
  return cut.concat(moved);
 }
 function pathCentre(path){let x=0,y=0;for(const p of path){x+=p[0];y+=p[1];}return[x/Math.max(1,path.length),y/Math.max(1,path.length)];}
 function nestedContour(path,scale,cx,cy){return path.map(p=>[cx+(p[0]-cx)*scale,cy+(p[1]-cy)*scale]);}
 function hatchPolygon(path,spacing,angle,color,width,maxLines=18){
  if(path.length<5)return[];const ca=Math.cos(angle),sa=Math.sin(angle),nx=-sa,ny=ca,dx=ca,dy=sa,values=path.map(p=>p[0]*nx+p[1]*ny),lo=Math.min(...values),hi=Math.max(...values);spacing=Math.max(spacing,(hi-lo)/maxLines);const ops=[];
  for(let k=lo+spacing*.5;k<hi;k+=spacing){const hits=[];for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1],u=a[0]*nx+a[1]*ny-k,v=b[0]*nx+b[1]*ny-k;if((u<=0&&v>0)||(v<=0&&u>0)){const t=u/(u-v),x=mix(a[0],b[0],t),y=mix(a[1],b[1],t);hits.push(x*dx+y*dy);}}hits.sort((a,b)=>a-b);for(let j=0;j+1<hits.length;j+=2){const lo=hits[j],hi=hits[j+1];if(hi-lo<7)continue;ops.push([[lo*dx+k*nx,lo*dy+k*ny],[hi*dx+k*nx,hi*dy+k*ny]]);}}
  return ops;
 }
 function queueStroke(ops,p,w,color,start,role,meta={}){
  color=chooseLineColour(color,role,meta.palette,meta.colourOn,meta.colourStrength);
  const len=pathLength(p),curve=clamp((meta.curvature||0)*7,0,1),large=meta.closed&&meta.area>180?1:0;
  let speed,min,max,factor=1;
  if(role==="primary"){speed=rand(9,25);min=2;max=30;factor+=curve*.32+large*.08;}
  else if(role==="engrave"){speed=rand(7,20);min=2;max=28;factor+=curve*.18;}
  else if(role==="crosshatch"){speed=rand(8,23);min=2;max=26;factor+=curve*.12;}
  else if(role==="nested"){speed=rand(7,22);min=2;max=28;factor+=curve*.22;}
  else if(role==="echo"){speed=rand(12,34);min=2;max=18;}
  else if(role==="morph"){speed=rand(9,25);min=2;max=26;factor+=curve*.16;}
  else if(role==="branch"){speed=rand(7,20);min=2;max=28;factor+=curve*.2;}
  else if(role==="fracture"){speed=rand(12,30);min=2;max=20;}
  else if(role==="strata"){speed=rand(8,22);min=2;max=24;}
  else{speed=rand(9,26);min=2;max=26;}
  const tempo=R()<.12?1.25:R()<.30?1.08:1.0;
  speed*=tempo*clamp(meta.tempo||1,.8,1.55)*rand(.92,1.32);
  const dur=Math.round(clamp(len/Math.max(.1,speed)*factor,min,max));
  ops.push({p,w,color,start,dur,fill:false,role});strokes++;if(dur>=18)slowStrokes++;if(dur<=8)fastStrokes++;if(isColour(color))colourStrokes++;
  return dur;
 }
 function microMotif(ops,cx,cy,size,angle,palette,colourOn,colourStrength,tempo){
  const kind=pick(["cells","fan","shell","coral","stipple","hatch"]),base=pick([INK,INK,INK,...palette.colours]),start=Math.floor(rand(0,24)),meta={palette,colourOn,colourStrength,tempo};
  const line=(p,w=rand(.45,.95),c=base,role="engrave",delay=start)=>queueStroke(ops,p,w,c,delay,role,meta);
  if(kind==="cells"){
   const count=Math.floor(rand(18,42));
   for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),d=Math.sqrt(R())*size*.72,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d*.66,r=rand(2.2,7.2),ry=r*rand(.55,1.3),rot=rand(-1,1),p=[];for(let k=0;k<11;k++){const t=k/10*Math.PI*2,rr=1+Math.sin(t*3+i)*.08+rand(-.035,.035);p.push([x+Math.cos(t)*r*rr*Math.cos(rot)-Math.sin(t)*ry*rr*Math.sin(rot),y+Math.cos(t)*r*rr*Math.sin(rot)+Math.sin(t)*ry*rr*Math.cos(rot)]);}p.push(p[0]);line(p,rand(.4,.82),R()<.16?pick(palette.colours):INK,"nested");if(R()<.24)line([[x-r*.18,y],[x+r*.18,y+rand(-.5,.5)]],.55,pick(palette.colours),"echo");}
  }else if(kind==="fan"){
   const count=Math.floor(rand(9,17)),span=rand(.7,1.9);
   for(let i=0;i<count;i++){const a=angle-span*.5+span*i/(count-1),len=rand(size*.38,size),pts=[];for(let k=0;k<9;k++){const t=k/8,bend=Math.sin(t*Math.PI)*rand(-.12,.12);pts.push([cx+Math.cos(a+bend)*len*t,cy+Math.sin(a+bend)*len*t]);}line(pts,rand(.45,1.1),INK,"branch");if(i%2===0){const end=pts[pts.length-1];line([[end[0]-Math.cos(a)*4,end[1]-Math.sin(a)*4],[end[0]+Math.cos(a+1)*rand(3,7),end[1]+Math.sin(a+1)*rand(3,7)]],.55,pick(palette.colours),"echo");}}
   const arc=[];for(let i=0;i<=24;i++){const a=angle-span*.5+span*i/24;arc.push([cx+Math.cos(a)*size*.42,cy+Math.sin(a)*size*.42]);}line(arc,rand(.55,.9),INK,"nested");
  }else if(kind==="shell"){
   const spirals=Math.floor(rand(1,3));for(let z=0;z<spirals;z++){const pts=[],phase=rand(0,6),turns=rand(1.4,3.4),grow=rand(1.8,3.6);for(let i=0;i<100;i++){const t=i/99*turns*Math.PI*2,r=2+grow*t,aa=t+phase+angle;pts.push([cx+Math.cos(aa)*r,cy+Math.sin(aa)*r*.78]);}line(pts,rand(.55,1.2),z===0?INK:pick(palette.colours),"nested");}
  }else if(kind==="coral"){
   function grow(x,y,a,len,depth,w){const pts=[];let px=x,py=y,dir=a;for(let k=0;k<8;k++){dir+=rand(-.13,.13);px+=Math.cos(dir)*len/8;py+=Math.sin(dir)*len/8;pts.push([px,py]);}line([[x,y],...pts],w,INK,"branch");const end=pts[pts.length-1];if(depth<=0){for(let j=0;j<3;j++){const aa=dir+rand(-.9,.9),ll=rand(3,8);line([[end[0],end[1]],[end[0]+Math.cos(aa)*ll,end[1]+Math.sin(aa)*ll]],.48,pick(palette.colours),"echo");}return;}const n=depth===1?2:Math.floor(rand(2,4));for(let j=0;j<n;j++){const t=rand(.42,.92),at=pts[Math.floor(t*7)],side=R()<.5?-1:1;grow(at[0],at[1],dir+side*rand(.48,1.1),len*rand(.34,.62),depth-1,w*.72);}}
   const roots=Math.floor(rand(2,4));for(let i=0;i<roots;i++)grow(cx+rand(-size*.25,size*.25),cy+rand(-size*.18,size*.18),angle+rand(-1.4,1.4),size*rand(.42,.82),2,rand(.75,1.25));
  }else if(kind==="stipple"){
   const count=Math.floor(rand(55,115));for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),d=Math.sqrt(R())*size,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d*.7,r=rand(.35,1.5),p=[[x-r,y],[x,y-r*rand(.6,1.5)],[x+r,y+rand(-.4,.4)]];line(p,rand(.35,.7),R()<.12?pick(palette.colours):INK,"echo");}
  }else{
   const lines=Math.floor(rand(12,24)),span=size*rand(.55,.9),spacing=size*rand(.035,.065);for(let j=0;j<lines;j++){const off=(j-(lines-1)*.5)*spacing,pts=[];for(let k=0;k<18;k++){const t=k/17,along=(t-.5)*span,wave=Math.sin(t*6+off*.05)*size*.035+Math.sin(t*13+j)*size*.012,x=cx+Math.cos(angle)*along-Math.sin(angle)*(off+wave),y=cy+Math.sin(angle)*along+Math.cos(angle)*(off+wave);pts.push([x,y]);}line(pts,rand(.35,.7),R()<.08?pick(palette.colours):INK,"engrave");}
  }
 }
 function makeBundle(initial=false,forcedSite=null){
  const lineage=chooseLineage(),place=forcedSite?{...candidatePlacement(lineage),x:forcedSite.x,y:forcedSite.y,nearest:anchors.find(a=>a.lineageId===forcedSite.lineageId)||null,relation:"echo"}:candidatePlacement(lineage);
  const inherited=!!place.nearest&&place.relation!=="independent"&&R()<.76;
  const familyHint=lineage.family||(inherited&&place.relation==="echo"?place.nearest.family:null);
  const a=chooseSource(null,familyHint),b=chooseCounterSource(a),c=chooseCounterSource(b),cx=place.x,cy=place.y;
  const scaleBias=place.d<.12?1.16:place.d>.25?.82:1;
  const inheritedRadius=inherited&&place.nearest.rx?place.nearest.rx*rand(.76,1.28):(R()<.23?rand(65,125):R()<.20?rand(290,410):rand(130,290));
  const rx=clamp(inheritedRadius*scaleBias*lineage.scale,52,430),ry=rx*lineage.aspect*rand(.78,1.22);
  const inheritedAngle=inherited?place.nearest.angle+(place.relation==="counterpoint"?Math.PI*.5:0)+rand(-.48,.48):place.orientation+rand(-.85,.85);
  const ang=inherited&&R()<.65?inheritedAngle:inheritedAngle+lineage.angle*.28+rand(-.7,.7);
  const flip=R()<.5,warpAmount=clamp(lineage.warp+rand(-4,6)+Math.min(5,place.edge*20),2,32),ops=[],usedA=new Set(),usedB=new Set(),usedC=new Set();
  const complexity=clamp(.82+(a.feature.complexity+b.feature.complexity)*.18,.82,1.34);
  const count=Math.floor(rand(initial?42:30,initial?74:56)*(place.d>.20?.82:place.d<.08?1.12:1)*complexity),polarity=place.d>.36?WHITE:INK;
  const palette=sessionPalette;
  const colourOn=R()<.82,colourStrength=rand(.8,1.35);
  const startOffset=initial?0:Math.floor(rand(0,8));
  for(let i=0;i<count;i++){
   const source=R()<.20?b:R()<.13?c:a,pa=choosePath(source,source===a?usedA:source===b?usedB:usedC);if(!pa)continue;const q=pa.shape||(pa.shape=describeShape(pa));if(q.coil&&R()<.48)continue;
   let raw=transformPath(pa,cx,cy,rx,ry,ang,flip,warpAmount),closed=pa.closed;
   if((q.round>.62&&R()<.86)||(pa.closed&&R()<.25)){raw=fragment(raw,rand(0,.24),rand(.55,.91));closed=false;}
   if(raw.length<5||pathLength(raw)<7)continue;
   const mid=raw[Math.floor(raw.length*.5)]||[cx,cy],local=densityAt(mid[0],mid[1],22),toneColor=pa.level<112?INK:pa.level>178?WHITE:(R()<.5?INK:WHITE),color=R()<.16?(polarity===INK?WHITE:INK):local>.44?WHITE:local<.17?INK:(R()<.72?toneColor:(toneColor===INK?WHITE:INK));
   const width=clamp(.58+pa.len/125+rand(-.42,1.15),.42,3.6),start=startOffset+Math.floor(rand(0,initial?16:22));
    let primaryDur=0;
    if(lineage.grammar==="fracture"&&R()<lineage.fragment){const pieces=fracturePath(raw,2+Math.floor(R()*3));for(const piece of pieces){const d=queueStroke(ops,piece,width*rand(.78,1.08),color,start+Math.floor(rand(0,8)),"fracture",{...pa,palette,colourOn,colourStrength,tempo:lineage.tempo});if(!primaryDur)primaryDur=d;}fractures+=pieces.length;}
    else primaryDur=queueStroke(ops,raw,width,color,start,"primary",{...pa,palette,colourOn,colourStrength,tempo:lineage.tempo});
    if(lineage.grammar==="strata"&&R()<lineage.strata){for(let k=0;k<1+Math.floor(R()*2);k++){const shifted=offsetPath(fragment(raw,rand(0,.06),rand(.66,.98)),rand(-13,13));if(shifted.length>5)queueStroke(ops,shifted,Math.max(.52,width*rand(.35,.62)),color===INK?WHITE:INK,start+Math.floor(rand(8,32)),"strata",{...pa,palette,colourOn,colourStrength,tempo:lineage.tempo});}}
    if(lineage.grammar==="branch"&&R()<lineage.branch){const donor=choosePath(b,usedB)||choosePath(c,usedC);if(donor){const donorRaw=transformPath(donor,cx+rand(-rx*.24,rx*.24),cy+rand(-ry*.24,ry*.24),rx*rand(.40,.82),ry*rand(.40,.82),ang+rand(-1.4,1.4),R()<.5,warpAmount*.8),branch=branchFrom(raw,donorRaw,rand(.18,.82),rand(-1.2,1.2),rand(.55,1.12));if(branch.length>5){queueStroke(ops,branch,Math.max(.55,width*rand(.42,.74)),color,start+primaryDur+Math.floor(rand(2,12)),"branch",{...pa,palette,colourOn,colourStrength,tempo:lineage.tempo});branches++;}}}
    if(closed&&q.round<.58&&pa.area>85&&R()<.16){ops.push({p:raw,w:width,color,start:start+Math.floor(rand(0,5)),dur:primaryDur,fill:true,closed:true});}
   if(closed&&q.round<.65&&pa.area>70&&R()<Math.min(.94,lineage.weave+(lineage.grammar==="weave"?.42:.14))){const hatchColor=color===INK?WHITE:INK,hatchAngle=ang+pa.orientation+rand(-.42,.42),hatches=hatchPolygon(raw,rand(7,12),hatchAngle,hatchColor,rand(.55,1.0),18);for(const hatch of hatches)queueStroke(ops,hatch,rand(.55,.95),hatchColor,start+Math.floor(rand(2,18)),"engrave",{...pa,palette,colourOn,colourStrength});if(hatches.length&&R()<.28){const cross=hatchPolygon(raw,rand(11,16),hatchAngle+Math.PI*.5,color,rand(.5,.8),10);for(const hatch of cross)queueStroke(ops,hatch,rand(.5,.78),color,start+Math.floor(rand(5,18)),"crosshatch",{...pa,palette,colourOn,colourStrength});}if(hatches.length)engravings++;}
   if(R()<(lineage.graft+(lineage.grammar==="graft"?.18:0))&&pathLength(raw)>28){
    const partner=R()<.50?b:c,pb=choosePath(partner,new Set());
    if(pb){const other=transformPath(pb,cx+rand(-rx*.30,rx*.30),cy+rand(-ry*.30,ry*.30),rx*rand(.48,1.12),ry*rand(.48,1.12),ang+rand(-1.5,1.5),R()<.5,warpAmount);
     let joined=graft(raw,other);if(R()<.30){const pc=choosePath(a,new Set());if(pc)joined=graft(joined,transformPath(pc,cx,cy,rx*.65,ry*.65,ang+rand(-2,2),R()<.5,warpAmount));}
     if(pathLength(joined)>15){queueStroke(ops,joined,Math.max(.65,width*rand(.56,1.0)),local>.38?WHITE:INK,start+primaryDur+Math.floor(rand(2,28)),"splice",{...pa,palette,colourOn,colourStrength,tempo:lineage.tempo});hybrids++;grafts++;}
    }
   }
   if(R()<.13&&raw.length>10){const echo=fragment(raw,rand(0,.20),rand(.50,.90)).map(([x,y])=>[x+rand(-5,5),y+rand(-5,5)]);queueStroke(ops,echo,Math.max(.55,width*.48),color===INK?WHITE:INK,start+Math.floor(rand(2,12)),"echo",{...pa,palette,colourOn,colourStrength});}
   if(R()<.34){
    const pb=matchPath(b,pa,usedB);
    if(pb){let rb=transformPath(pb,cx+rand(-rx*.13,rx*.13),cy+rand(-ry*.13,ry*.13),rx*rand(.88,1.13),ry*rand(.88,1.13),ang+rand(-.24,.24),R()<.5,warpAmount*.7),morphStart=start+Math.floor(rand(8,20)),tone=R()<.42?(color===INK?WHITE:INK):color,gap=Math.floor(rand(9,23));if(pb.closed&&(pb.shape||(pb.shape=describeShape(pb))).round>.56)rb=fragment(rb,rand(0,.2),rand(.65,.91));
     queueStroke(ops,raw,width+1.05,WHITE,morphStart,"outline",{...pa,palette,colourOn,colourStrength});
     const stages=R()<.22?[rand(.28,.43),rand(.66,.85)]:[rand(.28,.76)];for(let stage=0;stage<stages.length;stage++){const morph=interpolatePath(raw,rb,stages[stage]);queueStroke(ops,morph,Math.max(.62,width*(.88-stage*.10)),stage===1?tone:color,morphStart+stage*gap,"morph",{...pa,palette,colourOn,colourStrength});}
     if(R()<.76)queueStroke(ops,rb,Math.max(.7,width*.68),tone===INK?WHITE:INK,morphStart+gap*3+Math.floor(rand(3,12)),"morph",{...pb,palette,colourOn,colourStrength});morphs++;
    }
   }
  }
  for(let m=0;m<Math.floor(rand(initial?2:1,initial?5:3));m++){const mx=cx+rand(-rx*.52,rx*.52),my=cy+rand(-ry*.52,ry*.52);microMotif(ops,mx,my,rand(12,Math.max(18,Math.min(rx,ry)*.34)),ang+rand(-2.4,2.4),palette,colourOn,colourStrength,lineage.tempo);}
  if(!ops.length)return;
  ops.sort((x,y)=>x.start-y.start);if(ops.some(op=>isColour(op.color)))colourBundles++;if(inherited&&place.relation==="echo")motifEchoes++;if(inherited&&place.relation==="counterpoint")counterpoints++;const track={age:0,cursor:0,live:[],items:ops,center:[cx,cy],sources:[a.id,b.id,c.id],family:[a.family,b.family],palette:palette.name,lineageId:lineage.id,grammar:lineage.grammar};tracks.push(track);anchors.push({x:cx,y:cy,age:frame,angle:ang,rx,family:a.family,partner:b.family,palette:palette.name,lineageId:lineage.id,grammar:lineage.grammar});if(anchors.length>48)anchors.shift();recent.push(a.id,b.id,c.id);if(recent.length>36)recent=recent.slice(-36);bundles++;births++;lineage.births++;lineage.activity+=1;history.push([a.id,b.id]);if(history.length>30)history.shift();
  
 }
 function paint(op,from,to){
  const p=op.p,n=p.length-1;if(n<1)return;const lo=Math.max(0,Math.floor(from*n)),hi=Math.min(n,Math.ceil(to*n));if(to<=from)return;const at=t=>{const v=clamp(t*n,0,n),i=Math.min(n-1,Math.floor(v)),f=v-i;return [mix(p[i][0],p[i+1][0],f),mix(p[i][1],p[i+1][1],f)];};
  const aa=at(from),bb=at(to),target=op.wash?washCtx:inkCtx;target.save();target.globalCompositeOperation="source-over";target.globalAlpha=op.alpha===undefined?1:op.alpha;target.filter=op.wash?"blur(2.4px)":"none";target.strokeStyle=op.color;target.fillStyle=op.color;target.lineCap="round";target.lineJoin="round";
  if(op.fill&&to>=1){target.beginPath();target.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)target.lineTo(p[i][0],p[i][1]);target.closePath();target.fill();}
  if(op.w>0){target.lineWidth=op.w;target.beginPath();target.moveTo(aa[0],aa[1]);for(let i=lo+1;i<hi;i++)target.lineTo(p[i][0],p[i][1]);target.lineTo(bb[0],bb[1]);target.stroke();}
  target.restore();if(!op.wash){const stride=Math.max(1,Math.floor((hi-lo)/28));for(let i=lo+1;i<hi;i+=stride)touchDensity(p[i][0],p[i][1],op.w,op.color);touchDensity(bb[0],bb[1],op.w,op.color);}if(to>=1)marks++;
 }
 function render(){ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";ctx.clearRect(0,0,N,HOUT);ctx.drawImage(paperCanvas,0,0);ctx.drawImage(washCanvas,0,0);ctx.drawImage(inkCanvas,0,0);ctx.restore();}
 function initialise(s){
   originSeed=s>>>0;R=rng(originSeed);sessionPalette=selectPalette();shapeHistory=[];hybrids=branches=fractures=grafts=erasures=births=mutations=splits=chapters=0;frame=marks=bundles=engravings=morphs=nestedForms=strokes=slowStrokes=colourStrokes=colourBundles=motifEchoes=counterpoints=fastStrokes=0;tracks=[];anchors=[];weatheredSites=[];density=new Float32Array(G*G);history=[];recent=[];field=[rand(0,6),rand(0,6),rand(0,6),rand(0,6)];phase="emergence";coverage=0;compositionBalance=1;paper();const fav=chooseSession();initialiseLineages(fav);
   const placements=[[rand(100,235),rand(85,185)],[rand(365,535),rand(80,190)],[rand(710,875),rand(100,220)],[rand(115,260),rand(280,410)],[rand(385,560),rand(280,430)],[rand(700,865),rand(285,440)],[rand(105,265),rand(515,650)],[rand(445,640),rand(500,645)]];
   for(const [x,y] of placements)makeBundle(true,{x,y});
   for(let i=0;i<2;i++)makeBundle(true);
   nextBirthFrame=Math.round(FPS*rand(1.8,2.8));nextChapterFrame=Math.round(FPS*rand(26,38));nextErosionFrame=Math.round(FPS*rand(58,82));render();
  }
 async function buildAtlas(){
  onStatus("012 / loading cartographic reference atlas");
  for(let i=0;i<SOURCES.length;i++){const meta=SOURCES[i],im=await loadImage(meta.url);if(im){try{const first=meta.crop===undefined?0:meta.crop,second=meta.crop===undefined?1:(meta.crop===0?1:meta.crop===1?2:3);atlas.push(extract(im,meta,first));atlas.push(extract(im,meta,second));}catch(e){failed++;}}else failed++;onStatus("012 / analysing visual source "+(i+1)+" of "+SOURCES.length);await new Promise(resolve=>requestAnimationFrame(resolve));}
  if(atlas.filter(a=>a.paths.length).length<2)throw Error("The local source-image atlas could not be loaded.");
  initialise(pendingSeed);readyState=true;onStatus("012 / cartographic atlas ready");
 }
 function reset(s=(Math.random()*4294967295)>>>0){pendingSeed=s>>>0;if(readyState)initialise(pendingSeed);}
 function remember(){if(!readyState)return false;const direction={sources:session.map(s=>s.id),families:session.map(s=>s.family),lineages:lineages.map(g=>({grammar:g.grammar,family:g.family,scale:g.scale,aspect:g.aspect,angle:g.angle,warp:g.warp,fragment:g.fragment,graft:g.graft,branch:g.branch,weave:g.weave,strata:g.strata,tempo:g.tempo,generation:g.generation})),seed:originSeed,created:Date.now()};memory.directions.unshift(direction);memory.directions=memory.directions.slice(0,12);memory.recent=recent.slice(-16);writeMemory();return true;}
 function step(){if(!readyState)return;frame++;field[0]+=(R()-.5)*.012;field[1]+=(R()-.5)*.012;field[2]+=(R()-.5)*.009;field[3]+=(R()-.5)*.009;
   for(const g of lineages)g.activity*=.9992;
   for(const t of tracks){t.age++;while(t.cursor<t.items.length&&t.items[t.cursor].start<=t.age)t.live.push({...t.items[t.cursor++],last:0});for(const op of t.live){let f=clamp((t.age-op.start)/op.dur,0,1);if(f>op.last)paint(op,op.last,f);op.last=f;}t.live=t.live.filter(o=>o.last<1);}
   tracks=tracks.filter(t=>t.cursor<t.items.length||t.live.length);
   if(frame%FPS===0)compositionMetrics();
   if(frame>=nextBirthFrame&&tracks.length<9){makeBundle(false);if(coverage<.055&&R()<.24)makeBundle(false);const interval=coverage<.05?rand(1.8,2.8):coverage<.13?rand(2.2,3.4):coverage<.23?rand(2.8,4.0):rand(3.4,4.8);nextBirthFrame=frame+Math.round(FPS*interval);}
   if(frame>=nextChapterFrame){evolveLineage();chapters++;nextChapterFrame=frame+Math.round(FPS*rand(48,82));}
   if(frame>=nextErosionFrame){if(coverage>.025)erodeRegion();nextErosionFrame=frame+Math.round(FPS*rand(58,96));}
   render();
  }
 const ready=buildAtlas();
 return{ready,step,reset,remember,get frame(){return frame},get seconds(){return frame/FPS},get seed(){return originSeed},get finished(){return false},get stats(){return{marks,bundles,births,active:tracks.length,engravings,nestedForms,morphs,strokes,slowStrokes,fastStrokes,colourStrokes,colourBundles,motifEchoes,counterpoints,hybrids,branches,fractures,grafts,erasures,mutations,splits,chapters,lineages:lineages.length,grammar:[...new Set(lineages.map(g=>g.grammar))],phase,coverage,compositionBalance,palette:sessionPalette?.name||"",paletteColours:sessionPalette?.colours||[],sources:session.map(s=>s.label),families:[...new Set(session.map(s=>s.family))],memory:memory.directions.length,atlas:atlas.length,contours:atlas.reduce((n,a)=>n+a.paths.length,0),images:SOURCES.length,failed}}};
}
function getMemoryCount(){try{return JSON.parse(localStorage.getItem(KEY)||"{}").directions?.length||0;}catch(e){return 0;}}
root.Palimpsest012={create,FPS,SIZE:[N,HOUT],SOURCES,getMemoryCount};
})(globalThis);