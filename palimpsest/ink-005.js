/* PALIMPSEST 005 — source-atlas / adaptive motion drawing */
(function(root){"use strict";
const N=960,FPS=24,W=160,H=160,G=72,INK="#171613",PAPER="#eee9de",WHITE="#f4f0e7",KEY="lifeafterlogic.palimpsest.memory.v1";
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
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
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
 canvas.width=canvas.height=N;const ctx=canvas.getContext("2d",{alpha:false});
 let R=rng(seed),originSeed=seed>>>0,frame=0,marks=0,bundles=0,atlas=[],session=[],tracks=[],density=new Float32Array(G*G),history=[],field=[0,0,0,0],recent=[],memory=readMemory(),readyState=false,failed=0,lastSources=[],previousSources=[],pendingSeed=originSeed;
 const rand=(a,b)=>mix(a,b,R()),pick=a=>a[Math.floor(R()*a.length)];
 function readMemory(){try{let m=JSON.parse(localStorage.getItem(KEY)||"{}");return{directions:Array.isArray(m.directions)?m.directions.slice(0,12):[],recent:Array.isArray(m.recent)?m.recent.slice(0,16):[]};}catch(e){return{directions:[],recent:[]};}}
 function writeMemory(){try{localStorage.setItem(KEY,JSON.stringify(memory));return true;}catch(e){return false;}}
 function paper(){ctx.fillStyle=PAPER;ctx.fillRect(0,0,N,N);const tile=document.createElement("canvas");tile.width=128;tile.height=128;const t=tile.getContext("2d"),im=t.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){let n=rand(-10,10);im.data[i]=238+n;im.data[i+1]=233+n;im.data[i+2]=220+n;im.data[i+3]=255;}t.putImageData(im,0,0);ctx.fillStyle=ctx.createPattern(tile,"repeat");ctx.globalAlpha=.25;ctx.fillRect(0,0,N,N);ctx.globalAlpha=1;}
 function densityAt(x,y,r=24){let sum=0,n=0;const step=14;for(let yy=-r;yy<=r;yy+=step)for(let xx=-r;xx<=r;xx+=step){if(xx*xx+yy*yy>r*r)continue;let gx=Math.floor((x+xx)/N*G),gy=Math.floor((y+yy)/N*G);if(gx<0||gy<0||gx>=G||gy>=G)continue;sum+=density[gy*G+gx];n++;}return n?sum/n:0;}
 function touchDensity(x,y,w,color){let v=color===INK?1:0,rad=Math.max(2,w*.8),x0=Math.max(0,Math.floor((x-rad)/N*G)),x1=Math.min(G-1,Math.ceil((x+rad)/N*G)),y0=Math.max(0,Math.floor((y-rad)/N*G)),y1=Math.min(G-1,Math.ceil((y+rad)/N*G));for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){let px=(gx+.5)*N/G,py=(gy+.5)*N/G;if(Math.hypot(px-x,py-y)<rad+N/G*.45){let k=gy*G+gx;density[k]=mix(density[k],v,.12);}}}
 function warp(x,y,amount=12){let fx=field[0],fy=field[1],f=field[2];return[x+Math.sin(y*.009+fx)*amount+Math.sin((x+y)*.014+f)*amount*.32,y+Math.cos(x*.008+fy)*amount+Math.sin((x-y)*.012+f)*amount*.28];}
 function transformPath(path,cx,cy,rx,ry,angle,flip,amount){const ca=Math.cos(angle),sa=Math.sin(angle),out=[];for(const p of path.pts){let u=(p[0]/W-.5)*2*(flip?-1:1),v=(p[1]/H-.5)*2,xx=u*rx,yy=v*ry,x=cx+xx*ca-yy*sa,y=cy+xx*sa+yy*ca;out.push(warp(x,y,amount));}return out;}
 function chooseSession(){
  const fav=memory.directions.length&&R()<.30?pick(memory.directions):null;
  let ids=fav?fav.sources.filter(id=>atlas.some(a=>a.id===id)):[];
  let pool=atlas.filter(a=>!ids.includes(a.id));for(let i=pool.length-1;i>0;i--){let j=Math.floor(R()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  while(ids.length<Math.min(5,atlas.length)&&pool.length){let candidate=pool.shift();if(ids.length&&ids.every(id=>atlas.find(a=>a.id===id)?.family===candidate.family)&&R()<.72){pool.push(candidate);if(pool.length===1)break;continue;}ids.push(candidate.id);}
  if(ids.length<3)ids=usable.slice(0,Math.min(5,usable.length)).map(a=>a.id);
  previousSources=memory.recent.slice(0,16);session=ids.map(id=>atlas.find(a=>a.id===id)).filter(Boolean);lastSources=session.map(s=>s.id);memory.recent=lastSources.concat(previousSources).slice(0,16);writeMemory();
  return fav;
 }
 function chooseSource(exclude){let options=session.filter(s=>s.paths.length&&(!exclude||s.id!==exclude));if(!options.length)options=session.filter(s=>s.paths.length);let weights=options.map(s=>{let rec=recent.slice(-10).filter(x=>x===s.id).length+(previousSources.slice(0,10).filter(x=>x===s.id).length*.9);let novelty=1/(1+rec*1.8);let complexity=.6+s.feature.complexity*.7;return novelty*complexity*(s.family==="drawn"?.8:1);});let total=weights.reduce((a,b)=>a+b,0),v=R()*total;for(let i=0;i<options.length;i++){v-=weights[i];if(v<=0)return options[i];}return options[0];}
 function matchPath(source,target,used){if(!source||!source.paths.length)return null;let best=[],targetAspect=target.aspect||1,targetCurvature=target.curvature||0;for(let i=0;i<source.paths.length;i++){if(used.has(i))continue;let p=source.paths[i];if(p.len<7)continue;let score=Math.abs(Math.log((p.len+1)/(target.len+1)))*.38+Math.abs(Math.log((p.aspect||1)/targetAspect))*.72+Math.abs((p.curvature||0)-targetCurvature)*.34+(p.closed===target.closed?0:.42)+Math.abs(p.level-target.level)/255*.16+R()*.22;best.push({p,i,score});}if(!best.length)return choosePath(source,used);best.sort((a,b)=>a.score-b.score);let choice=best[Math.floor(Math.pow(R(),1.8)*Math.min(8,best.length))];used.add(choice.i);return choice.p;}
 function candidatePlacement(){let best=null;for(let i=0;i<22;i++){let x=rand(90,870),y=rand(90,870),d=densityAt(x,y,rand(38,88)),target=d>.48?.19:.34,near=tracks.reduce((n,t)=>n+(distance([x,y],t.center)<150?1:0),0),score=1-Math.abs(d-target)*2.2-near*.16+R()*.65;if(!best||score>best.score)best={x,y,d,score};}return best||{x:480,y:480,d:0};}
 function choosePath(source,used){if(!source||!source.paths.length)return null;let pool=source.paths.filter((p,i)=>!used.has(i)&&p.len>7);if(!pool.length){used.clear();pool=source.paths;}let weights=pool.map(p=>Math.min(1.8,.35+p.len/85)*(p.closed&&p.area>25?1.25:1)*(p.level>50&&p.level<210?1.1:.85));let sum=weights.reduce((a,b)=>a+b,0),v=R()*sum;for(let i=0;i<pool.length;i++){v-=weights[i];if(v<=0){let index=source.paths.indexOf(pool[i]);used.add(index);return pool[i];}}return pool[0];}
 function resample(path,n){if(path.length<2)return path;let lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+distance(path[i-1],path[i]));let total=lengths[lengths.length-1]||1,out=[];for(let j=0;j<n;j++){let d=total*j/(n-1),i=1;while(i<lengths.length-1&&lengths[i]<d)i++;let t=(d-lengths[i-1])/(lengths[i]-lengths[i-1]||1);out.push([mix(path[i-1][0],path[i][0],t),mix(path[i-1][1],path[i][1],t)]);}return out;}
 function interpolatePath(a,b,t){let n=Math.max(12,Math.min(44,Math.max(a.length,b.length))),aa=resample(a,n),bb=resample(b,n);return aa.map((p,i)=>[mix(p[0],bb[i][0],t),mix(p[1],bb[i][1],t)]);}
 function makeBundle(initial=false){
  const place=candidatePlacement(),a=chooseSource(),b=chooseSource(a.id),cx=place.x,cy=place.y,rx=rand(125,310),ry=rx*rand(.52,1.22),ang=rand(-Math.PI,Math.PI),flip=R()<.5,warpAmount=rand(3,22),ops=[],usedA=new Set(),usedB=new Set(),count=Math.floor(rand(26,48)),polarity=place.d>.44?WHITE:INK;
  const startOffset=initial?0:Math.floor(rand(0,22));
  for(let i=0;i<count;i++){
   const pa=choosePath(a,usedA);if(!pa)continue;const raw=transformPath(pa,cx,cy,rx,ry,ang,flip,warpAmount);if(raw.length<5||pathLength(raw)<7)continue;
   const mid=raw[Math.floor(raw.length*.5)]||[cx,cy],local=densityAt(mid[0],mid[1],22),toneColor=pa.level<112?INK:pa.level>178?WHITE:(R()<.5?INK:WHITE),color=R()<.16?(polarity===INK?WHITE:INK):local>.44?WHITE:local<.17?INK:(R()<.72?toneColor:(toneColor===INK?WHITE:INK));
   const width=clamp(.65+pa.len/92+rand(-.45,1.2),.55,4.4),start=startOffset+Math.floor(rand(0,62)),dur=Math.floor(clamp(pathLength(raw)/rand(28,65),4,18));
   if(pa.closed&&pa.area>85&&R()<.18){ops.push({p:raw,w:width,color,start:start+Math.floor(rand(0,4)),dur:Math.max(4,dur),fill:true,closed:true});}
   ops.push({p:raw,w:width,color,start,dur,fill:false});
   if(R()<.27){const echo=raw.map(([x,y])=>[x+rand(-7,7),y+rand(-7,7)]);ops.push({p:echo,w:Math.max(.55,width*.48),color:color===INK?WHITE:INK,start:start+Math.floor(rand(3,16)),dur:Math.max(4,dur),fill:false});}
   if(R()<.31){
    const pb=matchPath(b,pa,usedB),rb=transformPath(pb,cx+rand(-rx*.13,rx*.13),cy+rand(-ry*.13,ry*.13),rx*rand(.88,1.13),ry*rand(.88,1.13),ang+rand(-.24,.24),R()<.5,warpAmount*.7);
    const n=Math.max(12,Math.min(38,Math.max(raw.length,rb.length))),morph=interpolatePath(raw,rb,.48+R()*.24),morphStart=start+Math.floor(rand(12,28));
    ops.push({p:raw,w:width+1.1,color:WHITE,start:morphStart,dur:Math.max(4,dur*.6),fill:false});
    ops.push({p:morph,w:width*.9,color,start:morphStart+3,dur:Math.max(4,dur),fill:false});
    if(R()<.65)ops.push({p:rb,w:Math.max(.7,width*.72),color:color===INK?WHITE:INK,start:morphStart+Math.floor(rand(7,18)),dur:Math.max(4,dur),fill:false});
   }
  }
  if(!ops.length)return;
  ops.sort((x,y)=>x.start-y.start);const track={age:0,cursor:0,live:[],items:ops,center:[cx,cy],sources:[a.id,b.id],family:[a.family,b.family]};tracks.push(track);recent.push(a.id,b.id);if(recent.length>32)recent=recent.slice(-32);bundles++;history.push([a.id,b.id]);if(history.length>24)history.shift();
  if(initial){for(const op of ops)paint(op,0,1);track.cursor=ops.length;track.live=[];}
 }
 function paint(op,from,to){
  const p=op.p,n=p.length-1;if(n<1)return;const lo=Math.max(0,Math.floor(from*n)),hi=Math.min(n,Math.ceil(to*n));if(hi<=lo)return;
  ctx.strokeStyle=op.color;ctx.fillStyle=op.color;ctx.lineCap="round";ctx.lineJoin="round";
  if(op.fill&&to>=1){ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)ctx.lineTo(p[i][0],p[i][1]);ctx.closePath();ctx.fill();}
  ctx.lineWidth=op.w;ctx.beginPath();ctx.moveTo(p[lo][0],p[lo][1]);for(let i=lo+1;i<=hi;i++)ctx.lineTo(p[i][0],p[i][1]);ctx.stroke();
  const stride=Math.max(1,Math.floor((hi-lo)/28));for(let i=lo;i<=hi;i+=stride)touchDensity(p[i][0],p[i][1],op.w,op.color);if(to>=1)marks++;
 }
 function initialise(s){
  originSeed=s>>>0;R=rng(originSeed);frame=marks=bundles=0;tracks=[];density=new Float32Array(G*G);history=[];recent=[];field=[rand(0,6),rand(0,6),rand(0,6),rand(0,6)];paper();chooseSession();
  // Four overlapping source plates establish a continuous page, not isolated stickers.
  const placements=[[rand(240,370),rand(250,390)],[rand(600,760),rand(220,370)],[rand(350,600),rand(560,740)],[rand(700,840),rand(650,810)]];
  for(const [x,y] of placements)makeBundle(true);
  for(let i=0;i<2;i++)makeBundle(true);
 }
 async function buildAtlas(){
  onStatus("005 / loading source atlas");
  for(let i=0;i<SOURCES.length;i++){const meta=SOURCES[i],im=await loadImage(meta.url);if(im){try{atlas.push(extract(im,meta,0));atlas.push(extract(im,meta,1));}catch(e){failed++;}}else failed++;onStatus("005 / analysing image "+(i+1)+" of "+SOURCES.length);await new Promise(resolve=>requestAnimationFrame(resolve));}
  if(atlas.filter(a=>a.paths.length).length<2)throw Error("The local source-image atlas could not be loaded.");
  initialise(pendingSeed);readyState=true;onStatus("005 / source atlas ready");
 }
 function reset(s=(Math.random()*4294967295)>>>0){pendingSeed=s>>>0;if(readyState)initialise(pendingSeed);}
 function remember(){if(!readyState)return false;const direction={sources:session.map(s=>s.id),families:session.map(s=>s.family),seed:originSeed,created:Date.now()};memory.directions.unshift(direction);memory.directions=memory.directions.slice(0,12);memory.recent=recent.slice(-16);writeMemory();return true;}
 function step(){if(!readyState)return;frame++;if(frame%180===0){field[0]+=rand(-.5,.5);field[1]+=rand(-.5,.5);field[2]+=rand(-.4,.4);field[3]+=rand(-.4,.4);}
  for(const t of tracks){t.age++;while(t.cursor<t.items.length&&t.items[t.cursor].start<=t.age)t.live.push({...t.items[t.cursor++],last:0});for(const op of t.live){let f=clamp((t.age-op.start)/op.dur,0,1);if(f>op.last)paint(op,op.last,f);op.last=f;}t.live=t.live.filter(o=>o.last<1);}
  tracks=tracks.filter(t=>t.cursor<t.items.length||t.live.length);if(frame%17===0&&tracks.length<15)makeBundle(false);if(frame%41===0&&tracks.length<13)makeBundle(false);
 }
 const ready=buildAtlas();
 return{ready,step,reset,remember,get frame(){return frame},get seconds(){return frame/FPS},get seed(){return originSeed},get finished(){return false},get stats(){return{marks,bundles,active:tracks.length,sources:session.map(s=>s.label),families:[...new Set(session.map(s=>s.family))],memory:memory.directions.length,atlas:atlas.length,contours:atlas.reduce((n,a)=>n+a.paths.length,0),images:SOURCES.length,failed}}};
}
function getMemoryCount(){try{return JSON.parse(localStorage.getItem(KEY)||"{}").directions?.length||0;}catch(e){return 0;}}
root.Palimpsest005={create,FPS,SIZE:N,SOURCES,getMemoryCount};
})(globalThis);