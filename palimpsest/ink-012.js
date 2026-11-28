/* PALIMPSEST 012 — 010 source-atlas ecology with geometric intrusions */
(function(root){"use strict";
const N=960,FPS=24,W=160,H=160,G=72,INK="#171613",PAPER="#eee9de",WHITE="#f4f0e7",KEY="lifeafterlogic.palimpsest.memory.v2",PALETTE_KEY="lifeafterlogic.palimpsest.012.palette";
const SOURCES=[
{id:"flowers-07",label:"Flowers 07",family:"botanical",url:"../media/field-studies-007-flowers.jpg"},
{id:"london-07",label:"London 07",family:"urban",url:"../media/field-studies-007-london.jpg"},
{id:"taipei-07",label:"Taipei 07",family:"urban",url:"../media/field-studies-007-taipei.jpg"},
{id:"flowers-08",label:"Flowers 08",family:"botanical",url:"../media/field-studies-008-flowers.jpg"},
{id:"flowers-09",label:"Flowers 09",family:"botanical",url:"../media/field-studies-009-flowers.jpg"},
{id:"flowers-10",label:"Flowers 10",family:"botanical",url:"../media/field-studies-010-flowers.jpg"},
{id:"flowers-11",label:"Flowers 11",family:"botanical",url:"../media/field-studies-011-flowers.jpg"},
{id:"flowers-12",label:"Flowers 12",family:"botanical",url:"../media/field-studies-012-flowers.jpg"},
{id:"london-field",label:"London field study",family:"urban",url:"../media/field-studies-london.jpg"},
{id:"taipei-field",label:"Taipei field study",family:"urban",url:"../media/field-studies-taipei.jpg"},
{id:"ink-study",label:"Ink study",family:"drawn",url:"./palimpsest-001-detail.jpg"},
{id:"plant-surface",label:"Plant surface",family:"botanical",url:"../room/assets-local/potted_plant_02/potted_plant_02_leaves_diff_2k.jpg"},
{id:"ceramic-form",label:"Ceramic form",family:"object",url:"../room/assets-local/ceramic_vase_04/ceramic_vase_04_diff_2k.jpg"},
{id:"lab-4d",label:"4D splat study",family:"particle",url:"../media/4d-splats-preview.svg"},
{id:"lab-room",label:"Room study",family:"architectural",url:"../media/room-preview.svg"},
{id:"lab-anima",label:"Anima study",family:"organic",url:"../media/anima-preview.svg"},
{id:"lab-after",label:"After All That",family:"abstract",url:"../media/after-all-that-preview.svg"},
{id:"palimpsest-002",label:"Earlier ink study 002",family:"drawn",url:"./preview-002.svg"},
{id:"palimpsest-003",label:"Earlier ink study 003",family:"drawn",url:"./preview-003.svg"},
{id:"palimpsest-004",label:"Earlier ink study 004",family:"drawn",url:"./preview-004.svg"}
];
const SCHEMES=[
 {name:"Iron & petrol",hues:[8,192,35],sat:[56,49,54]},
 {name:"Bruised lilac",hues:[278,328,46],sat:[44,52,48]},
 {name:"Glacial mineral",hues:[204,173,226],sat:[58,43,55]},
 {name:"Burnt botanical",hues:[76,29,12],sat:[43,65,49]},
 {name:"Ochre & indigo",hues:[43,235,22],sat:[69,52,62]},
 {name:"Ceramic glaze",hues:[167,211,51],sat:[48,57,49]},
 {name:"Faded vermilion",hues:[2,21,350],sat:[63,54,43]},
 {name:"Forest ink",hues:[142,97,178],sat:[43,46,49]},
 {name:"Electric dusk",hues:[252,212,326],sat:[58,60,42]},
 {name:"Copper patina",hues:[31,159,186],sat:[59,47,53]},
 {name:"Dried rose",hues:[344,12,276],sat:[45,52,35]},
 {name:"Sulphur & slate",hues:[55,221,188],sat:[60,35,42]}
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
 const long=out.filter(p=>p.len>24).sort((a,b)=>b.len-a.len).slice(0,68),longSet=new Set(long),small=out.filter(p=>!longSet.has(p));let seed=91827;const R=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);for(let i=small.length-1;i>0;i--){let j=Math.floor(R()*(i+1));[small[i],small[j]]=[small[j],small[i]];}const keep=long.concat(small.slice(0,Math.max(0,190-long.length)));return keep;
}
function extract(im,meta,variant=0){
 const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d",{willReadFrequently:true});const zoom=variant===0?1:1.52,scale=Math.max(W/im.width,H/im.height)*zoom,dw=im.width*scale,dh=im.height*scale,fx=variant===0?.5:variant===1?.31:.68,fy=variant===0?.5:variant===1?.38:.64;x.drawImage(im,(W-dw)*fx,(H-dh)*fy,dw,dh);
 const data=x.getImageData(0,0,W,H).data,gray=new Uint8Array(W*H);let mean=0,edge=0,orientX=0,orientY=0;
 for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){let i=(y*W+xx)*4,v=Math.round(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]);gray[y*W+xx]=v;mean+=v;}
 mean/=W*H;
 for(let y=1;y<H-1;y+=2)for(let xx=1;xx<W-1;xx+=2){let i=y*W+xx,gx=-gray[i-W-1]+gray[i-W+1]-2*gray[i-1]+2*gray[i+1]-gray[i+W-1]+gray[i+W+1],gy=-gray[i-W-1]-2*gray[i-W]-gray[i-W+1]+gray[i+W-1]+2*gray[i+W]+gray[i+W+1],m=Math.hypot(gx,gy);if(m>90)edge++;orientX+=gx*gx-gy*gy;orientY+=2*gx*gy;}
 const paths=contours(gray,W,H);const feature={mean:mean/255,edge:edge/(W*H/4),orientation:Math.atan2(orientY,orientX)*.5,complexity:paths.length/200,variance:0};
 let variance=0;for(let i=0;i<gray.length;i+=3)variance+=(gray[i]-mean)*(gray[i]-mean);feature.variance=Math.sqrt(variance/(gray.length/3))/255;
 return {...meta,id:meta.id+"-plate-"+(variant+1),label:meta.label+" / "+(variant===0?"whole":"detail"),sourceId:meta.id,variant,paths,feature};
}
function create(canvas,seed=(Math.random()*4294967295)>>>0,onStatus=()=>{}){
 canvas.width=canvas.height=N;const ctx=canvas.getContext("2d",{alpha:false});const paperCanvas=document.createElement("canvas");paperCanvas.width=paperCanvas.height=N;const paperCtx=paperCanvas.getContext("2d",{alpha:false});const inkCanvas=document.createElement("canvas");inkCanvas.width=inkCanvas.height=N;const inkCtx=inkCanvas.getContext("2d",{alpha:true});
 let R=rng(seed),originSeed=seed>>>0,frame=0,marks=0,bundles=0,atlas=[],session=[],tracks=[],density=new Float32Array(G*G),history=[],field=[0,0,0,0],recent=[],memory=readMemory(),readyState=false,failed=0,lastSources=[],previousSources=[],pendingSeed=originSeed,anchors=[],engravings=0,morphs=0,nestedForms=0,strokes=0,slowStrokes=0,colourStrokes=0,colourBundles=0,motifEchoes=0,counterpoints=0,fastStrokes=0,geometryEvents=0,geometryStrokes=0,sessionPalette=null,hybrids=0,shapeHistory=[],lineages=[],lineageSerial=0,births=0,mutations=0,splits=0,chapters=0,branches=0,fractures=0,grafts=0,erasures=0,nextBirthFrame=0,nextChapterFrame=0,nextErosionFrame=0,phase="emergence",coverage=0,compositionBalance=1,weatheredSites=[];
 const rand=(a,b)=>mix(a,b,R()),pick=a=>a[Math.floor(R()*a.length)];
 function genome(parent=null,grammar=null){return{id:++lineageSerial,parent:parent?parent.id:null,generation:parent?parent.generation+1:0,grammar:grammar||pick(GRAMMARS),family:parent?parent.family:pick(["botanical","urban","drawn","organic","architectural","object","abstract","particle"]),scale:parent?clamp(parent.scale*rand(.78,1.24),.52,1.72):rand(.68,1.38),aspect:parent?clamp(parent.aspect*rand(.74,1.28),.28,1.92):rand(.38,1.58),angle:parent?parent.angle+rand(-.88,.88):rand(-Math.PI,Math.PI),warp:parent?clamp(parent.warp+rand(-5.5,5.5),2,29):rand(4,18),fragment:parent?clamp(parent.fragment+rand(-.13,.13),.08,.76):rand(.16,.48),graft:parent?clamp(parent.graft+rand(-.12,.12),.08,.68):rand(.20,.48),branch:parent?clamp(parent.branch+rand(-.12,.12),.06,.62):rand(.12,.34),weave:parent?clamp(parent.weave+rand(-.10,.10),.06,.58):rand(.10,.32),strata:parent?clamp(parent.strata+rand(-.12,.12),.05,.52):rand(.08,.28),tempo:parent?clamp(parent.tempo*rand(.78,1.25),.52,1.85):rand(.72,1.38),births:0,activity:0,born:frame};}
 function initialiseLineages(saved){lineages=[];lineageSerial=0;if(saved&&Array.isArray(saved.lineages))for(const old of saved.lineages.slice(0,3)){const g=genome(null,old.grammar);Object.assign(g,old,{id:++lineageSerial,parent:null,births:0,activity:0,born:frame});lineages.push(g);}const opening=["graft","branch","fracture","weave","strata"];while(lineages.length<5)lineages.push(genome(null,opening[lineages.length]));}
 function chooseLineage(){if(!lineages.length)initialiseLineages(null);const weights=lineages.map(g=>1/(1+g.births*.24+g.activity*.012)+R()*.22);let n=R()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<lineages.length;i++){n-=weights[i];if(n<=0)return lineages[i];}return lineages[0];}
 function evolveLineage(){if(!lineages.length)return;const parent=pick(lineages),grammar=R()<.78?pick(GRAMMARS.filter(x=>x!==parent.grammar)):parent.grammar;const child=genome(parent,grammar);lineages.push(child);mutations++;splits++;if(lineages.length>7){const candidates=lineages.filter(g=>g.id!==child.id);candidates.sort((a,b)=>(a.activity+a.births*.5)-(b.activity+b.births*.5));lineages.splice(lineages.indexOf(candidates[0]),1);}}
 function compositionMetrics(){let total=0,cx=0,cy=0;const q=[0,0,0,0],qn=[0,0,0,0];for(let y=0;y<G;y++)for(let x=0;x<G;x++){const v=density[y*G+x];total+=v;cx+=v*(x+.5);cy+=v*(y+.5);const k=(x>=G/2?1:0)+(y>=G/2?2:0);q[k]+=v;qn[k]++;}for(let i=0;i<4;i++)q[i]/=qn[i]||1;const mean=q.reduce((a,b)=>a+b,0)/4,max=Math.max(...q),min=Math.min(...q);coverage=total/(G*G);compositionBalance=1-(max-min)/(max+.0001);const centroid=total>.001?[cx/total/G,cy/total/G]:[.5,.5];phase=coverage<.035?"emergence":coverage<.085?"interweaving":coverage<.16?"consolidation":coverage<.25?"reinscription":"micro-detail";return{coverage,balance:compositionBalance,quadrants:q,mean,centroid};}
 function branchFrom(host,donor,fraction,angle,scale){if(host.length<5||donor.length<5)return[];const base=resample(host,Math.max(24,Math.min(72,host.length))),idx=clamp(Math.floor(fraction*(base.length-1)),3,base.length-4),anchor=base[idx],tangent=Math.atan2(base[idx+3][1]-base[idx-3][1],base[idx+3][0]-base[idx-3][0]);const part=fragment(donor,rand(.04,.28),rand(.68,.96));if(part.length<4)return[];const sourceAngle=Math.atan2(part[Math.min(3,part.length-1)][1]-part[0][1],part[Math.min(3,part.length-1)][0]-part[0][0]),rot=tangent+angle-sourceAngle,c=Math.cos(rot),sn=Math.sin(rot);return[anchor,...part.slice(1).map(p=>{const x=(p[0]-part[0][0])*scale,y=(p[1]-part[0][1])*scale;return[anchor[0]+x*c-y*sn,anchor[1]+x*sn+y*c];})];}
 function fracturePath(path,count){const pts=resample(path,Math.max(30,Math.min(90,path.length*2))),out=[];let at=rand(0,.08);for(let i=0;i<count&&at<.96;i++){const start=clamp(at,0,.94),end=clamp(start+rand(.10,.28),start+.06,.99),part=pts.slice(Math.floor(start*(pts.length-1)),Math.max(Math.floor(start*(pts.length-1))+4,Math.ceil(end*(pts.length-1))+1));if(part.length>3)out.push(part);at=end+rand(.025,.09);}return out;}
 function offsetPath(path,offset){const out=[];for(let i=0;i<path.length;i++){const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;out.push([path[i][0]-dy/d*offset,path[i][1]+dx/d*offset]);}return out;}
 function erodeRegion(){const old=anchors.filter(a=>frame-a.age>FPS*48);if(!old.length)return false;const anchor=pick(old),patches=2+Math.floor(R()*3),sites=[];inkCtx.save();inkCtx.globalCompositeOperation="destination-out";for(let i=0;i<patches;i++){const cx=anchor.x+rand(-anchor.rx*.34,anchor.rx*.34),cy=anchor.y+rand(-anchor.rx*.34,anchor.rx*.34),radius=rand(15,42),points=10+Math.floor(R()*7);inkCtx.globalAlpha=rand(.12,.24);inkCtx.beginPath();for(let j=0;j<points;j++){const a=j/points*Math.PI*2,r=radius*rand(.66,1.28),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(j===0)inkCtx.moveTo(x,y);else inkCtx.lineTo(x,y);}inkCtx.closePath();inkCtx.fill();sites.push({x:cx,y:cy,r:radius});const gx0=Math.max(0,Math.floor((cx-radius)/N*G)),gx1=Math.min(G-1,Math.ceil((cx+radius)/N*G)),gy0=Math.max(0,Math.floor((cy-radius)/N*G)),gy1=Math.min(G-1,Math.ceil((cy+radius)/N*G));for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){const px=(gx+.5)*N/G,py=(gy+.5)*N/G;if(Math.hypot(px-cx,py-cy)<radius)density[gy*G+gx]*=.38;}}inkCtx.restore();weatheredSites.push(...sites.map(p=>({...p,age:frame})));weatheredSites=weatheredSites.slice(-12);erasures++;render();return true;}
 function isColour(c){return !!c&&!([INK,WHITE,PAPER].includes(c));}
 function selectPalette(){
  let last=sessionPalette?.name||"";try{last=localStorage.getItem(PALETTE_KEY)||last;}catch(e){}
  const scheme=pick(SCHEMES.filter(p=>p.name!==last)),offset=rand(-12,12);
  const colours=scheme.hues.map((h,i)=>"hsl("+Math.round((h+offset+360)%360)+", "+Math.round(scheme.sat[i]+rand(-7,7))+"%, "+Math.round(rand(32,47))+"%)");
  try{localStorage.setItem(PALETTE_KEY,scheme.name);}catch(e){}
  return {name:scheme.name,colours};
 }
 function chooseLineColour(base,role,palette,enabled,strength=1){
  if(!enabled||!palette||role==="outline")return base;
  const rates={primary:.035,engrave:.055,crosshatch:.035,nested:.045,echo:.035,morph:.075,splice:.075,geometry:.16,geometryDetail:.085};
  if(R()>(rates[role]||.03)*strength)return base;
  return pick(palette.colours);
 }
 function readMemory(){try{let m=JSON.parse(localStorage.getItem(KEY)||"{}");return{directions:Array.isArray(m.directions)?m.directions.slice(0,12):[],recent:Array.isArray(m.recent)?m.recent.slice(0,16):[]};}catch(e){return{directions:[],recent:[]};}}
 function writeMemory(){try{localStorage.setItem(KEY,JSON.stringify(memory));return true;}catch(e){return false;}}
 function paper(){paperCtx.fillStyle=PAPER;paperCtx.fillRect(0,0,N,N);const tile=document.createElement("canvas");tile.width=128;tile.height=128;const t=tile.getContext("2d"),im=t.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){let n=rand(-10,10);im.data[i]=238+n;im.data[i+1]=233+n;im.data[i+2]=220+n;im.data[i+3]=255;}t.putImageData(im,0,0);paperCtx.fillStyle=paperCtx.createPattern(tile,"repeat");paperCtx.globalAlpha=.25;paperCtx.fillRect(0,0,N,N);paperCtx.globalAlpha=1;inkCtx.clearRect(0,0,N,N);}
 function densityAt(x,y,r=24){let sum=0,n=0;const step=14;for(let yy=-r;yy<=r;yy+=step)for(let xx=-r;xx<=r;xx+=step){if(xx*xx+yy*yy>r*r)continue;let gx=Math.floor((x+xx)/N*G),gy=Math.floor((y+yy)/N*G);if(gx<0||gy<0||gx>=G||gy>=G)continue;sum+=density[gy*G+gx];n++;}return n?sum/n:0;}
 function touchDensity(x,y,w,color){let v=color===INK?1:isColour(color)?.73:0,rad=Math.max(2,w*.8),x0=Math.max(0,Math.floor((x-rad)/N*G)),x1=Math.min(G-1,Math.ceil((x+rad)/N*G)),y0=Math.max(0,Math.floor((y-rad)/N*G)),y1=Math.min(G-1,Math.ceil((y+rad)/N*G));for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){let px=(gx+.5)*N/G,py=(gy+.5)*N/G;if(Math.hypot(px-x,py-y)<rad+N/G*.45){let k=gy*G+gx;density[k]=mix(density[k],v,.12);}}}
 function warp(x,y,amount=12){let fx=field[0],fy=field[1],f=field[2];return[x+Math.sin(y*.009+fx)*amount+Math.sin((x+y)*.014+f)*amount*.32,y+Math.cos(x*.008+fy)*amount+Math.sin((x-y)*.012+f)*amount*.28];}
 function transformPath(path,cx,cy,rx,ry,angle,flip,amount){const ca=Math.cos(angle),sa=Math.sin(angle),out=[];for(const p of path.pts){let u=(p[0]/W-.5)*2*(flip?-1:1),v=(p[1]/H-.5)*2,xx=u*rx,yy=v*ry,x=cx+xx*ca-yy*sa,y=cy+xx*sa+yy*ca;out.push(warp(x,y,amount));}return out;}
 function chooseSession(){
  const usable=atlas.filter(a=>a.paths.length),fav=memory.directions.length&&R()<.30?pick(memory.directions):null;
  let ids=fav?fav.sources.filter(id=>usable.some(a=>a.id===id)):[];
  let pool=usable.filter(a=>!ids.includes(a.id));for(let i=pool.length-1;i>0;i--){let j=Math.floor(R()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  while(ids.length<Math.min(5,usable.length)&&pool.length){let candidate=pool.shift();if(ids.length&&ids.every(id=>usable.find(a=>a.id===id)?.family===candidate.family)&&R()<.72){pool.push(candidate);if(pool.length===1)break;continue;}ids.push(candidate.id);}
  if(ids.length<3)ids=usable.slice(0,Math.min(5,usable.length)).map(a=>a.id);
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
 function candidatePlacement(genomeHint){let best=null;const m=compositionMetrics(),target=m.coverage<.035?.105:m.coverage<.10?.075:m.coverage<.20?.045:.022,relationRoll=R(),relation=relationRoll<.26?"echo":relationRoll<.53?"counterpoint":"independent";for(let i=0;i<76;i++){const x=rand(64,896),y=rand(64,896),d=densityAt(x,y,rand(28,88)),quadrant=(x>N/2?1:0)+(y>N/2?2:0);const gx=densityAt(x+30,y,24)-densityAt(x-30,y,24),gy=densityAt(x,y+30,24)-densityAt(x,y-30,24),edge=Math.hypot(gx,gy),orientation=Math.atan2(gy,gx)+Math.PI*.5;let nearest=null,nearestDistance=Infinity;for(const a of anchors){const dist=distance([x,y],[a.x,a.y]);if(dist<nearestDistance){nearestDistance=dist;nearest=a;}}const near=anchors.reduce((n,a)=>n+Math.exp(-distance([x,y],[a.x,a.y])/155)*Math.exp(-(frame-a.age)/(FPS*150)),0);const quadrantNeed=(m.mean-m.quadrants[quadrant])*2.1,edgeBalance=Math.min(1,edge*3.2),whiteSpace=clamp((.20-d)/.20,0,1),spacing=nearest?Math.exp(-Math.abs(nearestDistance-(genomeHint?.scale||1)*165)/150):.12,centroidPull=Math.hypot(x/N-m.centroid[0],y/N-m.centroid[1]),weathered=weatheredSites.reduce((n,p)=>n+Math.exp(-distance([x,y],[p.x,p.y])/(p.r*2.8))*Math.exp(-(frame-p.age)/(FPS*55)),0),relationScore=nearest?(relation==="echo"?spacing*.22:relation==="counterpoint"?clamp(nearestDistance/520,0,1)*.16:0):0,score=1-Math.abs(d-target)*3.5-near*.13+quadrantNeed+edgeBalance*.13+whiteSpace*.08+relationScore+weathered*.22+centroidPull*.035+R()*.26;if(!best||score>best.score)best={x,y,d,edge,orientation,score,nearest,nearestDistance,relation,quadrant};}return best||{x:480,y:480,d:0,edge:0,orientation:0,nearest:null,relation:"independent",quadrant:0};}
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
   return Math.min(2.2,.45+p.len/75)*(q.coil?.045:q.round>.65?.10:q.round>.42?.45:1.2)*(p.closed?.75:1.35)*(.72+q.complexity*.8)/(1+repeats*.48);});
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
  if(role==="primary"){speed=rand(2.2,10.8);min=7;max=150;factor+=curve*1.05+large*.24;}
  else if(role==="engrave"){speed=rand(.75,4.5);min=10;max=168;factor+=curve*.52;}
  else if(role==="crosshatch"){speed=rand(1.1,7.8);min=8;max=126;factor+=curve*.36;}
  else if(role==="nested"){speed=rand(1.2,8.6);min=8;max=132;factor+=curve*.65;}
  else if(role==="echo"){speed=rand(3.5,18);min=6;max=76;}
  else if(role==="morph"){speed=rand(1.4,10.2);min=8;max=142;factor+=curve*.58;}
  else if(role==="branch"){speed=rand(1.0,5.8);min=9;max=132;factor+=curve*.7;}
  else if(role==="fracture"){speed=rand(2.2,13.5);min=6;max=92;}
  else if(role==="strata"){speed=rand(1.3,7.5);min=8;max=118;}
  else if(role==="geometry"){speed=rand(2.0,9.6);min=7;max=112;factor+=.12;}
  else if(role==="geometryDetail"){speed=rand(.9,4.4);min=8;max=142;factor+=.18;}
  else{speed=rand(3.0,12.8);min=7;max=110;}
  const tempo=R()<.12?.46:R()<.30?.70:R()<.86?1:1.62;
  speed*=tempo*(meta.tempo||1)*rand(.78,1.28);
  const dur=Math.round(clamp(len/Math.max(.1,speed)*factor,min,max));
  ops.push({p,w,color,start,dur,fill:false,role});strokes++;if(dur>=48)slowStrokes++;if(dur<=15)fastStrokes++;if(isColour(color))colourStrokes++;
  return dur;
 }

 function geometryIntrusion(ops,cx,cy,rx,ry,ang,baseColor,palette,colourOn,colourStrength,startOffset=0){
  const family=pick(["broken-grid","folded-polyhedron","impossible-frame","instrument-fragment","staircase-splice","triangular-mesh","cutaway"]);
  const size=clamp(rand(.28,.52)*Math.min(rx,ry),28,132),ox=clamp(cx+rand(-rx*.30,rx*.30),42,918),oy=clamp(cy+rand(-ry*.30,ry*.30),42,918);
  const theta=ang+rand(-1.72,1.72),ca=Math.cos(theta),sa=Math.sin(theta),main=baseColor===INK?INK:WHITE,cut=main===INK?WHITE:INK;
  const baseDelay=startOffset+Math.floor(rand(12,46)),accent=palette&&colourOn&&R()<.30?pick(palette.colours):main;
  const P=(u,v)=>[ox+u*size*ca-v*size*sa,oy+u*size*sa+v*size*ca];
  const meta={palette,colourOn,colourStrength,tempo:rand(.62,1.34),curvature:0};
  const emitWorld=(points,width=1,color=main,delay=0,role="geometry")=>{if(points.length<2)return;queueStroke(ops,points,width,color,baseDelay+delay,role,meta);geometryStrokes++;};
  const emit=(points,width=1,color=main,delay=0,role="geometry")=>emitWorld(points.map(p=>P(p[0],p[1])),width,color,delay,role);
  const polygon=(points,width=1,color=main,delay=0,role="geometry")=>emit(points.concat([points[0]]),width,color,delay,role);
  const node=(u,v,r=.035,color=accent,delay=24)=>polygon([[u-r,v-r],[u+r,v-r],[u+r,v+r],[u-r,v+r]],.9,color,delay,"geometryDetail");
  if(family==="broken-grid"){
   const rows=5,cols=5,nodes=[];
   for(let y=0;y<rows;y++){nodes[y]=[];for(let x=0;x<cols;x++)nodes[y][x]=[-.94+x*.47+(R()-.5)*.13,-.72+y*.36+(R()-.5)*.12];}
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const p=nodes[y][x],q=nodes[y][x+1],r=nodes[y+1]?.[x],d=nodes[y+1]?.[x+1];if(q&&R()>.16)emit([p,q],R()<.16?1.65:.8,main,rand(0,26));if(r&&R()>.13)emit([p,r],R()<.13?1.5:.72,cut,rand(4,30));if(d&&R()<.36)emit([p,d],.62,accent,rand(10,38),"geometryDetail");}
   polygon([nodes[0][0],nodes[0][4],nodes[4][4],nodes[4][0]],1.15,main,4);
   for(let i=0;i<4;i++){const p=nodes[i][(i*2)%5];node(p[0],p[1],.035,i===2?accent:cut,32+i*3);}
  }else if(family==="folded-polyhedron"){
   const n=5+Math.floor(R()*3),front=[],back=[],phase=rand(-.5,.5);
   for(let i=0;i<n;i++){const a=phase+i/n*Math.PI*2,r=rand(.66,1.03);front.push([Math.cos(a)*r,Math.sin(a)*r*.76]);back.push([Math.cos(a+.12)*r*.78+.43,Math.sin(a+.12)*r*.74-.34]);}
   polygon(front,1.25,main,0);polygon(back,.9,cut,13);
   for(let i=0;i<n;i++)if(R()>.12)emit([front[i],back[i]],R()<.22?1.5:.75,i%3===0?accent:main,rand(5,32));
   for(let i=0;i<n;i++)if(R()<.52)emit([front[i],front[(i+2)%n],back[(i+1)%n]],.62,cut,rand(18,42),"geometryDetail");
   const face=front.slice(0,4).map(p=>P(p[0],p[1]));for(const h of hatchPolygon(face,rand(7,11),theta+rand(-.5,.5),cut,.65,8))emitWorld(h,.55,cut,rand(24,48),"geometryDetail");
   node(.02,-.02,.045,accent,42);
  }else if(family==="impossible-frame"){
   const frames=[[[-.96,-.66],[.36,-.84],[.82,-.12],[-.42,.12]],[[-.58,-.34],[.74,-.52],[1.02,.22],[-.18,.43]],[[-.78,.12],[.20,-.08],[.52,.62],[-.48,.84]]];
   frames.forEach((f,i)=>polygon(f,i===1?1.35:.82,i===1?main:cut,i*10));
   for(let i=0;i<4;i++){emit([frames[0][i],frames[1][(i+1)%4]],1.05,i%2?accent:main,8+i*4);if(R()<.8)emit([frames[1][i],frames[2][(i+2)%4]],.68,cut,24+i*3,"geometryDetail");}
   emit([frames[0][0],frames[2][2],frames[1][1],frames[0][3]],.72,accent,35,"geometryDetail");node(-.78,-.66,.04,main,30);node(.74,-.52,.035,accent,36);
  }else if(family==="instrument-fragment"){
   const centre=[rand(-.12,.12),rand(-.12,.12)],start=rand(-1.8,-.8),span=rand(3.25,4.75);
   for(let ring=0;ring<3;ring++){const pts=[],r=.42+ring*.22;for(let i=0;i<=38;i++){const a=start+span*i/38;pts.push([centre[0]+Math.cos(a)*r,centre[1]+Math.sin(a)*r*.78]);}emit(pts,ring===1?1.25:.68,ring===1?main:cut,ring*12);}
   for(let i=0;i<19;i++){const a=start+span*i/18,r1=.78,r2=r1+(i%3===0?.13:.055);emit([[centre[0]+Math.cos(a)*r1,centre[1]+Math.sin(a)*r1*.78],[centre[0]+Math.cos(a)*r2,centre[1]+Math.sin(a)*r2*.78]],i%3===0?1:.55,i%5===0?accent:main,rand(4,34),"geometryDetail");}
   polygon([[-.16,-.20],[.26,-.32],[.42,.08],[.02,.29]],.9,main,18);emit([[-.82,.48],[-.32,.48],[-.18,.62],[.42,.62]],.75,cut,34);node(centre[0],centre[1],.045,accent,38);
  }else if(family==="staircase-splice"){
   const steps=6,walk=[[-.95,.64]];for(let i=0;i<steps;i++){const x=-.95+i*.30,y=.64-i*.20;walk.push([x+.30,y],[x+.30,y-.20]);}
   emit(walk,1.55,main,0);emit(walk.map(([x,y])=>[x+.16,y-.11]),.72,cut,16);
   for(let i=0;i<steps;i++){const x=-.95+i*.30,y=.64-i*.20;emit([[x+.30,y-.20],[x+.46,y-.31]],.7,i%2?accent:main,24+i*3,"geometryDetail");}
   polygon([[-.88,-.76],[-.22,-.76],[-.22,-.49],[-.88,-.49]],.82,cut,30);emit([[-.22,-.62],[.16,-.62],[.16,-.34],[.54,-.34],[.54,-.06]],.95,main,42);node(.54,-.06,.04,accent,52);
  }else if(family==="triangular-mesh"){
   const nodes=[];for(let y=0;y<4;y++){nodes[y]=[];for(let x=0;x<4;x++)nodes[y][x]=[-.84+x*.56+(R()-.5)*.17,-.68+y*.45+(R()-.5)*.14];}
   for(let y=0;y<4;y++)for(let x=0;x<4;x++){const p=nodes[y][x],q=nodes[y][x+1],r=nodes[y+1]?.[x],d=nodes[y+1]?.[x+1];if(q)emit([p,q],.78,main,rand(0,22));if(r)emit([p,r],.72,cut,rand(4,26));if(d&&R()<.68)emit([p,d],R()<.2?1.25:.58,accent,rand(10,38),"geometryDetail");}
   polygon([nodes[0][0],nodes[0][3],nodes[3][3],nodes[3][0]],.9,main,4);for(let i=0;i<5;i++){const p=nodes[Math.floor(R()*3)][Math.floor(R()*3)];node(p[0],p[1],.027,i%2?cut:accent,32+i*3);}
  }else{
   const outer=[[-.95,-.25],[-.56,-.86],[.28,-.96],[.94,-.38],[.72,.55],[.02,.88],[-.82,.48]],inner=outer.map(([x,y],i)=>[x*.52+(i%2?.13:-.10),y*.48+(i%3?.08:-.08)]);
   polygon(outer,1.15,main,0);polygon(inner,.82,cut,18);
   for(let i=0;i<outer.length;i++)if(i%2===0||R()<.35)emit([outer[i],inner[(i+2)%inner.length]],.78,i%3===0?accent:main,rand(8,34));
   emit([outer[1],inner[3],outer[4],inner[0],outer[1]],.72,cut,36,"geometryDetail");
   const face=[outer[0],outer[1],inner[1],inner[0]].map(p=>P(p[0],p[1]));for(const h of hatchPolygon(face,rand(8,12),theta+.7,cut,.6,7))emitWorld(h,.5,cut,40,"geometryDetail");
  }
  geometryEvents++;
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
  const count=Math.floor(rand(15,27)*(place.d>.20?.72:place.d<.08?1.18:1)*complexity),polarity=place.d>.36?WHITE:INK;
  const palette=sessionPalette;
  const colourOn=!initial&&R()<.32,colourStrength=rand(.65,1.15);
  const startOffset=initial?0:Math.floor(rand(0,22));
  for(let i=0;i<count;i++){
   const source=R()<.20?b:R()<.13?c:a,pa=choosePath(source,source===a?usedA:source===b?usedB:usedC);if(!pa)continue;const q=pa.shape||(pa.shape=describeShape(pa));if(q.coil&&R()<.94)continue;
   let raw=transformPath(pa,cx,cy,rx,ry,ang,flip,warpAmount),closed=pa.closed;
   if((q.round>.62&&R()<.86)||(pa.closed&&R()<.25)){raw=fragment(raw,rand(0,.24),rand(.55,.91));closed=false;}
   if(raw.length<5||pathLength(raw)<7)continue;
   const mid=raw[Math.floor(raw.length*.5)]||[cx,cy],local=densityAt(mid[0],mid[1],22),toneColor=pa.level<112?INK:pa.level>178?WHITE:(R()<.5?INK:WHITE),color=R()<.16?(polarity===INK?WHITE:INK):local>.44?WHITE:local<.17?INK:(R()<.72?toneColor:(toneColor===INK?WHITE:INK));
   const width=clamp(.62+pa.len/105+rand(-.48,1.05),.52,4.1),start=startOffset+Math.floor(rand(0,38));
    let primaryDur=0;
    if(lineage.grammar==="fracture"&&R()<lineage.fragment){const pieces=fracturePath(raw,2+Math.floor(R()*3));for(const piece of pieces){const d=queueStroke(ops,piece,width*rand(.78,1.08),color,start+Math.floor(rand(0,8)),"fracture",{...pa,palette,colourOn,colourStrength,tempo:lineage.tempo});if(!primaryDur)primaryDur=d;}fractures+=pieces.length;}
    else primaryDur=queueStroke(ops,raw,width,color,start,"primary",{...pa,palette,colourOn,colourStrength,tempo:lineage.tempo});
    if(lineage.grammar==="strata"&&R()<lineage.strata){for(let k=0;k<1+Math.floor(R()*2);k++){const shifted=offsetPath(fragment(raw,rand(0,.06),rand(.66,.98)),rand(-13,13));if(shifted.length>5)queueStroke(ops,shifted,Math.max(.52,width*rand(.35,.62)),color===INK?WHITE:INK,start+Math.floor(rand(8,32)),"strata",{...pa,palette,colourOn,colourStrength,tempo:lineage.tempo});}}
    if(lineage.grammar==="branch"&&R()<lineage.branch){const donor=choosePath(b,usedB)||choosePath(c,usedC);if(donor){const donorRaw=transformPath(donor,cx+rand(-rx*.24,rx*.24),cy+rand(-ry*.24,ry*.24),rx*rand(.40,.82),ry*rand(.40,.82),ang+rand(-1.4,1.4),R()<.5,warpAmount*.8),branch=branchFrom(raw,donorRaw,rand(.18,.82),rand(-1.2,1.2),rand(.55,1.12));if(branch.length>5){queueStroke(ops,branch,Math.max(.55,width*rand(.42,.74)),color,start+primaryDur+Math.floor(rand(3,22)),"branch",{...pa,palette,colourOn,colourStrength,tempo:lineage.tempo});branches++;}}}
    if(closed&&q.round<.58&&pa.area>85&&R()<.16){ops.push({p:raw,w:width,color,start:start+Math.floor(rand(0,5)),dur:primaryDur,fill:true,closed:true});}
   if(closed&&q.round<.65&&pa.area>70&&R()<(lineage.weave+(lineage.grammar==="weave"?.32:0))){const hatchColor=color===INK?WHITE:INK,hatchAngle=ang+pa.orientation+rand(-.42,.42),hatches=hatchPolygon(raw,rand(7,12),hatchAngle,hatchColor,rand(.55,1.0),18);for(const hatch of hatches)queueStroke(ops,hatch,rand(.55,.95),hatchColor,start+Math.floor(rand(8,38)),"engrave",{...pa,palette,colourOn,colourStrength});if(hatches.length&&R()<.28){const cross=hatchPolygon(raw,rand(11,16),hatchAngle+Math.PI*.5,color,rand(.5,.8),10);for(const hatch of cross)queueStroke(ops,hatch,rand(.5,.78),color,start+Math.floor(rand(18,46)),"crosshatch",{...pa,palette,colourOn,colourStrength});}if(hatches.length)engravings++;}
   if(R()<(lineage.graft+(lineage.grammar==="graft"?.18:0))&&pathLength(raw)>28){
    const partner=R()<.50?b:c,pb=choosePath(partner,new Set());
    if(pb){const other=transformPath(pb,cx+rand(-rx*.30,rx*.30),cy+rand(-ry*.30,ry*.30),rx*rand(.48,1.12),ry*rand(.48,1.12),ang+rand(-1.5,1.5),R()<.5,warpAmount);
     let joined=graft(raw,other);if(R()<.30){const pc=choosePath(a,new Set());if(pc)joined=graft(joined,transformPath(pc,cx,cy,rx*.65,ry*.65,ang+rand(-2,2),R()<.5,warpAmount));}
     if(pathLength(joined)>15){queueStroke(ops,joined,Math.max(.65,width*rand(.56,1.0)),local>.38?WHITE:INK,start+primaryDur+Math.floor(rand(2,28)),"splice",{...pa,palette,colourOn,colourStrength,tempo:lineage.tempo});hybrids++;grafts++;}
    }
   }
   if(R()<.13&&raw.length>10){const echo=fragment(raw,rand(0,.20),rand(.50,.90)).map(([x,y])=>[x+rand(-5,5),y+rand(-5,5)]);queueStroke(ops,echo,Math.max(.55,width*.48),color===INK?WHITE:INK,start+Math.floor(rand(3,24)),"echo",{...pa,palette,colourOn,colourStrength});}
   if(R()<.27){
    const pb=matchPath(b,pa,usedB);
    if(pb){let rb=transformPath(pb,cx+rand(-rx*.13,rx*.13),cy+rand(-ry*.13,ry*.13),rx*rand(.88,1.13),ry*rand(.88,1.13),ang+rand(-.24,.24),R()<.5,warpAmount*.7),morphStart=start+Math.floor(rand(18,42)),tone=R()<.42?(color===INK?WHITE:INK):color,gap=Math.floor(rand(9,23));if(pb.closed&&(pb.shape||(pb.shape=describeShape(pb))).round>.56)rb=fragment(rb,rand(0,.2),rand(.65,.91));
     queueStroke(ops,raw,width+1.05,WHITE,morphStart,"outline",{...pa,palette,colourOn,colourStrength});
     const stages=R()<.22?[rand(.28,.43),rand(.66,.85)]:[rand(.28,.76)];for(let stage=0;stage<stages.length;stage++){const morph=interpolatePath(raw,rb,stages[stage]);queueStroke(ops,morph,Math.max(.62,width*(.88-stage*.10)),stage===1?tone:color,morphStart+stage*gap,"morph",{...pa,palette,colourOn,colourStrength});}
     if(R()<.76)queueStroke(ops,rb,Math.max(.7,width*.68),tone===INK?WHITE:INK,morphStart+gap*3+Math.floor(rand(3,12)),"morph",{...pb,palette,colourOn,colourStrength});morphs++;
    }
   }
  }
  if(R()<(initial?.22:.32))geometryIntrusion(ops,cx,cy,rx,ry,ang,polarity,palette,colourOn,colourStrength,startOffset);
  if(!initial&&R()<.075)geometryIntrusion(ops,cx,cy,rx,ry,ang,polarity,palette,colourOn,colourStrength,startOffset+rand(8,24));
  if(!ops.length)return;
  ops.sort((x,y)=>x.start-y.start);if(ops.some(op=>isColour(op.color)))colourBundles++;if(inherited&&place.relation==="echo")motifEchoes++;if(inherited&&place.relation==="counterpoint")counterpoints++;const track={age:0,cursor:0,live:[],items:ops,center:[cx,cy],sources:[a.id,b.id,c.id],family:[a.family,b.family],palette:palette.name,lineageId:lineage.id,grammar:lineage.grammar};tracks.push(track);anchors.push({x:cx,y:cy,age:frame,angle:ang,rx,family:a.family,partner:b.family,palette:palette.name,lineageId:lineage.id,grammar:lineage.grammar});if(anchors.length>48)anchors.shift();recent.push(a.id,b.id,c.id);if(recent.length>36)recent=recent.slice(-36);bundles++;births++;lineage.births++;lineage.activity+=1;history.push([a.id,b.id]);if(history.length>30)history.shift();
  if(initial){for(const op of ops)paint(op,0,1);slowStrokes-=ops.filter(op=>!op.fill&&op.dur>=48).length;fastStrokes-=ops.filter(op=>!op.fill&&op.dur<=15).length;colourStrokes-=ops.filter(op=>!op.fill&&isColour(op.color)).length;if(ops.some(op=>isColour(op.color)))colourBundles--;track.cursor=ops.length;track.live=[];}
 }
 function paint(op,from,to){
  const p=op.p,n=p.length-1;if(n<1)return;const lo=Math.max(0,Math.floor(from*n)),hi=Math.min(n,Math.ceil(to*n));if(to<=from)return;const at=t=>{const v=clamp(t*n,0,n),i=Math.min(n-1,Math.floor(v)),f=v-i;return [mix(p[i][0],p[i+1][0],f),mix(p[i][1],p[i+1][1],f)];};
  inkCtx.globalCompositeOperation="source-over";inkCtx.globalAlpha=1;inkCtx.strokeStyle=op.color;inkCtx.fillStyle=op.color;inkCtx.lineCap="round";inkCtx.lineJoin="round";
  if(op.fill&&to>=1){inkCtx.beginPath();inkCtx.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)inkCtx.lineTo(p[i][0],p[i][1]);inkCtx.closePath();inkCtx.fill();}
  inkCtx.lineWidth=op.w;inkCtx.beginPath();const aa=at(from),bb=at(to);inkCtx.moveTo(aa[0],aa[1]);for(let i=lo+1;i<hi;i++)inkCtx.lineTo(p[i][0],p[i][1]);inkCtx.lineTo(bb[0],bb[1]);inkCtx.stroke();
  const stride=Math.max(1,Math.floor((hi-lo)/28));for(let i=lo+1;i<hi;i+=stride)touchDensity(p[i][0],p[i][1],op.w,op.color);touchDensity(bb[0],bb[1],op.w,op.color);if(to>=1)marks++;
 }
 function render(){ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";ctx.clearRect(0,0,N,N);ctx.drawImage(paperCanvas,0,0);ctx.drawImage(inkCanvas,0,0);ctx.restore();}
 function initialise(s){
   originSeed=s>>>0;R=rng(originSeed);sessionPalette=selectPalette();shapeHistory=[];hybrids=branches=fractures=grafts=erasures=births=mutations=splits=chapters=0;frame=marks=bundles=engravings=morphs=nestedForms=strokes=slowStrokes=colourStrokes=colourBundles=motifEchoes=counterpoints=fastStrokes=0;geometryEvents=geometryStrokes=0;tracks=[];anchors=[];weatheredSites=[];density=new Float32Array(G*G);history=[];recent=[];field=[rand(0,6),rand(0,6),rand(0,6),rand(0,6)];phase="emergence";coverage=0;compositionBalance=1;paper();const fav=chooseSession();initialiseLineages(fav);
   const placements=[[rand(220,365),rand(230,390)],[rand(610,780),rand(200,360)],[rand(320,560),rand(570,760)],[rand(690,850),rand(640,820)]];
   for(const [x,y] of placements)makeBundle(true,{x,y});
   for(let i=0;i<2;i++)makeBundle(true);
   nextBirthFrame=Math.round(FPS*rand(3.2,5.1));nextChapterFrame=Math.round(FPS*rand(42,62));nextErosionFrame=Math.round(FPS*rand(68,92));render();
  }
 async function buildAtlas(){
  onStatus("012 / loading source atlas");
  for(let i=0;i<SOURCES.length;i++){const meta=SOURCES[i],im=await loadImage(meta.url);if(im){try{atlas.push(extract(im,meta,0));atlas.push(extract(im,meta,1));}catch(e){failed++;}}else failed++;onStatus("012 / analysing image "+(i+1)+" of "+SOURCES.length);await new Promise(resolve=>requestAnimationFrame(resolve));}
  if(atlas.filter(a=>a.paths.length).length<2)throw Error("The local source-image atlas could not be loaded.");
  initialise(pendingSeed);readyState=true;onStatus("012 / source atlas ready");
 }
 function reset(s=(Math.random()*4294967295)>>>0){pendingSeed=s>>>0;if(readyState)initialise(pendingSeed);}
 function remember(){if(!readyState)return false;const direction={sources:session.map(s=>s.id),families:session.map(s=>s.family),lineages:lineages.map(g=>({grammar:g.grammar,family:g.family,scale:g.scale,aspect:g.aspect,angle:g.angle,warp:g.warp,fragment:g.fragment,graft:g.graft,branch:g.branch,weave:g.weave,strata:g.strata,tempo:g.tempo,generation:g.generation})),seed:originSeed,created:Date.now()};memory.directions.unshift(direction);memory.directions=memory.directions.slice(0,12);memory.recent=recent.slice(-16);writeMemory();return true;}
 function step(){if(!readyState)return;frame++;field[0]+=(R()-.5)*.012;field[1]+=(R()-.5)*.012;field[2]+=(R()-.5)*.009;field[3]+=(R()-.5)*.009;
   for(const g of lineages)g.activity*=.9992;
   for(const t of tracks){t.age++;while(t.cursor<t.items.length&&t.items[t.cursor].start<=t.age)t.live.push({...t.items[t.cursor++],last:0});for(const op of t.live){let f=clamp((t.age-op.start)/op.dur,0,1);if(f>op.last)paint(op,op.last,f);op.last=f;}t.live=t.live.filter(o=>o.last<1);}
   tracks=tracks.filter(t=>t.cursor<t.items.length||t.live.length);
   if(frame%FPS===0)compositionMetrics();
   if(frame>=nextBirthFrame&&tracks.length<9){makeBundle(false);if(coverage<.055&&R()<.24)makeBundle(false);const interval=coverage<.05?rand(4.0,6.2):coverage<.13?rand(5.2,8.0):coverage<.23?rand(6.8,10.2):rand(8.5,12.5);nextBirthFrame=frame+Math.round(FPS*interval);}
   if(frame>=nextChapterFrame){evolveLineage();chapters++;nextChapterFrame=frame+Math.round(FPS*rand(48,82));}
   if(frame>=nextErosionFrame){if(coverage>.025)erodeRegion();nextErosionFrame=frame+Math.round(FPS*rand(58,96));}
   render();
  }
 const ready=buildAtlas();
 return{ready,step,reset,remember,get frame(){return frame},get seconds(){return frame/FPS},get seed(){return originSeed},get finished(){return false},get stats(){return{marks,bundles,births,active:tracks.length,engravings,nestedForms,morphs,strokes,slowStrokes,fastStrokes,geometryEvents,geometryStrokes,colourStrokes,colourBundles,motifEchoes,counterpoints,hybrids,branches,fractures,grafts,erasures,mutations,splits,chapters,lineages:lineages.length,grammar:[...new Set(lineages.map(g=>g.grammar))],phase,coverage,compositionBalance,palette:sessionPalette?.name||"",paletteColours:sessionPalette?.colours||[],sources:session.map(s=>s.label),families:[...new Set(session.map(s=>s.family))],memory:memory.directions.length,atlas:atlas.length,contours:atlas.reduce((n,a)=>n+a.paths.length,0),images:SOURCES.length,failed}}};
}
function getMemoryCount(){try{return JSON.parse(localStorage.getItem(KEY)||"{}").directions?.length||0;}catch(e){return 0;}}
root.Palimpsest012={create,FPS,SIZE:N,SOURCES,getMemoryCount};
})(globalThis);