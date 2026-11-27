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
 canvas.width=canvas.height=N;const ctx=canvas.getContext("2d",{alpha:false});const inkCanvas=document.createElement("canvas");inkCanvas.width=inkCanvas.height=N;const inkCtx=inkCanvas.getContext("2d",{alpha:false});
 let R=rng(seed),originSeed=seed>>>0,frame=0,marks=0,bundles=0,atlas=[],session=[],tracks=[],density=new Float32Array(G*G),history=[],field=[0,0,0,0],recent=[],memory=readMemory(),readyState=false,failed=0,lastSources=[],previousSources=[],pendingSeed=originSeed,motion=[],anchors=[],motionEvents=0,nextMotionEvent=0;
 const rand=(a,b)=>mix(a,b,R()),pick=a=>a[Math.floor(R()*a.length)];
 function readMemory(){try{let m=JSON.parse(localStorage.getItem(KEY)||"{}");return{directions:Array.isArray(m.directions)?m.directions.slice(0,12):[],recent:Array.isArray(m.recent)?m.recent.slice(0,16):[]};}catch(e){return{directions:[],recent:[]};}}
 function writeMemory(){try{localStorage.setItem(KEY,JSON.stringify(memory));return true;}catch(e){return false;}}
 function paper(){inkCtx.fillStyle=PAPER;inkCtx.fillRect(0,0,N,N);const tile=document.createElement("canvas");tile.width=128;tile.height=128;const t=tile.getContext("2d"),im=t.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){let n=rand(-10,10);im.data[i]=238+n;im.data[i+1]=233+n;im.data[i+2]=220+n;im.data[i+3]=255;}t.putImageData(im,0,0);inkCtx.fillStyle=inkCtx.createPattern(tile,"repeat");inkCtx.globalAlpha=.25;inkCtx.fillRect(0,0,N,N);inkCtx.globalAlpha=1;}
 function densityAt(x,y,r=24){let sum=0,n=0;const step=14;for(let yy=-r;yy<=r;yy+=step)for(let xx=-r;xx<=r;xx+=step){if(xx*xx+yy*yy>r*r)continue;let gx=Math.floor((x+xx)/N*G),gy=Math.floor((y+yy)/N*G);if(gx<0||gy<0||gx>=G||gy>=G)continue;sum+=density[gy*G+gx];n++;}return n?sum/n:0;}
 function touchDensity(x,y,w,color){let v=color===INK?1:0,rad=Math.max(2,w*.8),x0=Math.max(0,Math.floor((x-rad)/N*G)),x1=Math.min(G-1,Math.ceil((x+rad)/N*G)),y0=Math.max(0,Math.floor((y-rad)/N*G)),y1=Math.min(G-1,Math.ceil((y+rad)/N*G));for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){let px=(gx+.5)*N/G,py=(gy+.5)*N/G;if(Math.hypot(px-x,py-y)<rad+N/G*.45){let k=gy*G+gx;density[k]=mix(density[k],v,.12);}}}
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
 function chooseSource(exclude){let options=session.filter(s=>s.paths.length&&(!exclude||s.id!==exclude));if(!options.length)options=session.filter(s=>s.paths.length);let weights=options.map(s=>{let rec=recent.slice(-10).filter(x=>x===s.id).length+(previousSources.slice(0,10).filter(x=>x===s.id).length*.9);let novelty=1/(1+rec*1.8);let complexity=.6+s.feature.complexity*.7;return novelty*complexity*(s.family==="drawn"?.8:1);});let total=weights.reduce((a,b)=>a+b,0),v=R()*total;for(let i=0;i<options.length;i++){v-=weights[i];if(v<=0)return options[i];}return options[0];}
 function matchPath(source,target,used){if(!source||!source.paths.length)return null;let best=[],targetAspect=target.aspect||1,targetCurvature=target.curvature||0;for(let i=0;i<source.paths.length;i++){if(used.has(i))continue;let p=source.paths[i];if(p.len<7)continue;let score=Math.abs(Math.log((p.len+1)/(target.len+1)))*.38+Math.abs(Math.log((p.aspect||1)/targetAspect))*.72+Math.abs((p.curvature||0)-targetCurvature)*.34+(p.closed===target.closed?0:.42)+Math.abs(p.level-target.level)/255*.16+R()*.22;best.push({p,i,score});}if(!best.length)return choosePath(source,used);best.sort((a,b)=>a.score-b.score);let choice=best[Math.floor(Math.pow(R(),1.8)*Math.min(8,best.length))];used.add(choice.i);return choice.p;}
 function candidatePlacement(){let best=null,coverage=density.reduce((a,b)=>a+b,0)/density.length,target=coverage>.24?.105:coverage>.13?.19:.29;for(let i=0;i<34;i++){let x=rand(85,875),y=rand(85,875),d=densityAt(x,y,rand(34,82)),gx=densityAt(x+30,y,26)-densityAt(x-30,y,26),gy=densityAt(x,y+30,26)-densityAt(x,y-30,26),edge=Math.hypot(gx,gy),near=anchors.reduce((n,a)=>n+Math.exp(-distance([x,y],[a.x,a.y])/125)*Math.exp(-(frame-a.age)/560),0),moving=motion.reduce((n,m)=>n+Math.exp(-distance([x,y],m.center)/145)*.6,0),quadrant=(x>N/2?1:0)+(y>N/2?2:0),qCount=anchors.filter(a=>((a.x>N/2?1:0)+(a.y>N/2?2:0))===quadrant&&frame-a.age<900).length,score=1-Math.abs(d-target)*2.5-near*.2-moving*.14-qCount*.045+edge*.22+R()*.38;if(!best||score>best.score)best={x,y,d,score};}return best||{x:480,y:480,d:0};}
 function choosePath(source,used){if(!source||!source.paths.length)return null;let pool=source.paths.filter((p,i)=>!used.has(i)&&p.len>7);if(!pool.length){used.clear();pool=source.paths;}let weights=pool.map(p=>Math.min(1.8,.35+p.len/85)*(p.closed&&p.area>25?1.25:1)*(p.level>50&&p.level<210?1.1:.85));let sum=weights.reduce((a,b)=>a+b,0),v=R()*sum;for(let i=0;i<pool.length;i++){v-=weights[i];if(v<=0){let index=source.paths.indexOf(pool[i]);used.add(index);return pool[i];}}return pool[0];}
 function resample(path,n){if(path.length<2)return path;let lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+distance(path[i-1],path[i]));let total=lengths[lengths.length-1]||1,out=[];for(let j=0;j<n;j++){let d=total*j/(n-1),i=1;while(i<lengths.length-1&&lengths[i]<d)i++;let t=(d-lengths[i-1])/(lengths[i]-lengths[i-1]||1);out.push([mix(path[i-1][0],path[i][0],t),mix(path[i-1][1],path[i][1],t)]);}return out;}
 function interpolatePath(a,b,t){let n=Math.max(12,Math.min(44,Math.max(a.length,b.length))),aa=resample(a,n),bb=resample(b,n);return aa.map((p,i)=>[mix(p[0],bb[i][0],t),mix(p[1],bb[i][1],t)]);}
 function centroid(path){let x=0,y=0;for(const p of path){x+=p[0];y+=p[1];}return[x/Math.max(1,path.length),y/Math.max(1,path.length)];}
 function addMotion(pathA,pathB,color,width,sourceIds=[]){
  if(!pathA||pathA.length<5)return;const ca=centroid(pathA),cb=centroid(pathB&&pathB.length>4?pathB:pathA),n=clamp(Math.max(pathA.length,pathB?.length||0),18,52),aa=resample(pathA,n).map(p=>[p[0]-ca[0],p[1]-ca[1]]),bb=resample(pathB&&pathB.length>4?pathB:pathA,n).map(p=>[p[0]-cb[0],p[1]-cb[1]]),centre=[(ca[0]+cb[0])*.5,(ca[1]+cb[1])*.5],crowd=densityAt(centre[0],centre[1],36),types=crowd<.2?["orbit","drift","fold","ripple","knot","pulse","vortex"]:["shear","fracture","vortex","fold","ripple","orbit","knot"];
  motion.push({a:aa,b:bb,center:centre,type:pick(types),age:0,life:Math.floor(rand(145,310)),phase:rand(0,Math.PI*2),cycles:rand(.7,2.4),speed:rand(.018,.052),spin:rand(-.014,.014),amplitude:rand(7,39),width:clamp(width*rand(.48,.9),.65,2.5),color:color||INK,echo:R()<.58,nodes:R()<.32,oscillate:R()<.42,settle:R()<.62,sourceIds});
  if(motion.length>20)motion.shift();
 }
 function motionGeometry(m,forcedProgress=null){
  const t=forcedProgress===null?clamp(m.age/m.life,0,1):clamp(forcedProgress,0,1),phase=m.phase+m.age*m.speed,mt=m.oscillate?.5-.5*Math.cos(t*Math.PI*2*m.cycles):t*t*(3-2*t),n=m.a.length,out=[],centreX=m.center[0]+Math.cos(phase*.73)*m.amplitude*.26,centreY=m.center[1]+Math.sin(phase*.61)*m.amplitude*.22;
  for(let i=0;i<n;i++){const ax=m.a[i],bx=m.b[i],u=mix(ax[0],bx[0],mt),v=mix(ax[1],bx[1],mt),along=i/(n-1),wave=Math.sin(along*Math.PI*2*m.cycles+phase),chunk=Math.floor(along*5),radius=Math.hypot(u,v),baseAngle=Math.atan2(v,u);let x=u,y=v,angle=0,sx=1,sy=1;
   if(m.type==="orbit"){angle=Math.sin(phase+t*Math.PI*2*m.cycles)*.62+m.spin*m.age;x+=Math.cos(phase+t*4)*m.amplitude*.36;y+=Math.sin(phase+t*3.1)*m.amplitude*.3;}
   else if(m.type==="shear"){x+=Math.sin(v*.023+phase)*m.amplitude;y+=Math.cos(u*.019-phase*.8)*m.amplitude*.36;angle=Math.sin(phase+t*5)*.12;}
   else if(m.type==="fold"){sx=Math.cos(phase+t*Math.PI*2*m.cycles);sy=.72+.28*Math.sin(phase*.7+t*Math.PI*2);x*=sx;y*=sy;angle=Math.sin(phase+t*3)*.16;}
   else if(m.type==="vortex"){angle=(.25+.95*Math.sin(phase+t*5))*Math.exp(-radius/Math.max(30,m.amplitude*4));}
   else if(m.type==="fracture"){x+=Math.sin(phase+chunk*2.13)*m.amplitude*.52;y+=Math.cos(phase*.8+chunk*1.71)*m.amplitude*.42;angle=Math.sin(phase+chunk)*.12;}
   else if(m.type==="ripple"){const prev=m.a[Math.max(0,i-1)],next=m.a[Math.min(n-1,i+1)],tx=next[0]-prev[0],ty=next[1]-prev[1],len=Math.hypot(tx,ty)||1,offset=wave*m.amplitude*.62;x+=-ty/len*offset;y+=tx/len*offset;}
   else if(m.type==="drift"){x+=Math.cos(phase+t*4)*m.amplitude*.5;y+=Math.sin(phase+t*3)*m.amplitude*.42;angle=Math.sin(phase+t*2)*.22;}
   else if(m.type==="knot"){angle=Math.sin(phase+t*4)*.5+(radius/Math.max(40,m.amplitude*5))*.8*Math.sin(phase*.6);}
   else if(m.type==="pulse"){sx=sy=1+Math.sin(phase+t*Math.PI*2*m.cycles)*.28;angle=Math.sin(phase+t*3)*.1;}
   const c=Math.cos(angle),s=Math.sin(angle),rx=x*sx*c-y*sy*s,ry=x*sx*s+y*sy*c,globalWave=Math.sin(along*Math.PI*2+phase*.7)*m.amplitude*.12;out.push([centreX+rx+Math.cos(baseAngle+Math.PI/2)*globalWave,centreY+ry+Math.sin(baseAngle+Math.PI/2)*globalWave]);
  }return out;
 }
 function render(){
  ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";ctx.drawImage(inkCanvas,0,0);
  for(const m of motion){const t=clamp(m.age/m.life,0,1),fade=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.62);if(fade<.015)continue;const p=motionGeometry(m),n=p.length;if(n<3)continue;ctx.save();ctx.globalAlpha=fade*(m.echo?.66:.9);ctx.strokeStyle=m.color;ctx.lineWidth=m.width*(.82+.18*Math.sin(m.age*.08+m.phase));ctx.lineCap="round";ctx.lineJoin="round";if(ctx.setLineDash){ctx.setLineDash(m.type==="fracture"?[4,2]:m.type==="ripple"?[2,2]:[]);ctx.lineDashOffset=-m.age*1.7;}ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);for(let i=1;i<n;i++)ctx.lineTo(p[i][0],p[i][1]);ctx.stroke();if(m.echo){ctx.globalAlpha=fade*.24;ctx.strokeStyle=m.color===INK?WHITE:INK;ctx.lineWidth=Math.max(.55,m.width*.55);ctx.beginPath();ctx.moveTo(p[0][0]+2,p[0][1]-2);for(let i=1;i<n;i++)ctx.lineTo(p[i][0]+2,p[i][1]-2);ctx.stroke();}if(m.nodes){ctx.globalAlpha=fade*.72;ctx.fillStyle=m.color;for(let i=3;i<n;i+=Math.max(5,Math.floor(n/5))){ctx.beginPath();ctx.arc(p[i][0],p[i][1],1.1+(i%3)*.35,0,Math.PI*2);ctx.fill();}}ctx.restore();}
  ctx.restore();
 }
 function launchMotionBurst(){
  const place=candidatePlacement(),a=chooseSource(),b=chooseSource(a.id),pa=choosePath(a,new Set());if(!pa)return;const pb=matchPath(b,pa,new Set()),cx=place.x,cy=place.y,rx=rand(95,240),ry=rx*rand(.52,1.18),angle=rand(-Math.PI,Math.PI),rawA=transformPath(pa,cx,cy,rx,ry,angle,R()<.5,rand(7,28)),rawB=pb?transformPath(pb,cx+rand(-24,24),cy+rand(-24,24),rx*rand(.86,1.12),ry*rand(.86,1.12),angle+rand(-.35,.35),R()<.5,rand(5,22)):rawA,local=densityAt(cx,cy,34),color=local>.39?WHITE:INK,count=R()<.28?2:1;
  for(let i=0;i<count;i++)addMotion(rawA,rawB,color,rand(1,2.8),[a.id,b.id]);motionEvents++;
 }
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
    const pb=matchPath(b,pa,usedB);
    if(pb){const rb=transformPath(pb,cx+rand(-rx*.13,rx*.13),cy+rand(-ry*.13,ry*.13),rx*rand(.88,1.13),ry*rand(.88,1.13),ang+rand(-.24,.24),R()<.5,warpAmount*.7),morph=interpolatePath(raw,rb,.48+R()*.24),morphStart=start+Math.floor(rand(12,28));
     ops.push({p:raw,w:width+1.1,color:WHITE,start:morphStart,dur:Math.max(4,dur*.6),fill:false});
     ops.push({p:morph,w:width*.9,color,start:morphStart+3,dur:Math.max(4,dur),fill:false});
     if(R()<.65)ops.push({p:rb,w:Math.max(.7,width*.72),color:color===INK?WHITE:INK,start:morphStart+Math.floor(rand(7,18)),dur:Math.max(4,dur),fill:false});
    }
   }
  }
  if(!ops.length)return;
  ops.sort((x,y)=>x.start-y.start);const track={age:0,cursor:0,live:[],items:ops,center:[cx,cy],sources:[a.id,b.id],family:[a.family,b.family]};tracks.push(track);anchors.push({x:cx,y:cy,age:frame});if(anchors.length>36)anchors.shift();recent.push(a.id,b.id);if(recent.length>32)recent=recent.slice(-32);bundles++;history.push([a.id,b.id]);if(history.length>24)history.shift();const candidates=ops.filter(o=>!o.fill&&o.p.length>8),motionCount=initial?2:(R()<.3?2:1);for(let i=0;i<motionCount&&candidates.length;i++){const first=pick(candidates),alternates=candidates.filter(o=>o!==first),second=alternates.length?pick(alternates):first;addMotion(first.p,second.p,R()<.36?(first.color===INK?WHITE:INK):first.color,first.w,[a.id,b.id]);}
  if(initial){for(const op of ops)paint(op,0,1);track.cursor=ops.length;track.live=[];}
 }
 function paint(op,from,to){
  const p=op.p,n=p.length-1;if(n<1)return;const lo=Math.max(0,Math.floor(from*n)),hi=Math.min(n,Math.ceil(to*n));if(hi<=lo)return;
  inkCtx.strokeStyle=op.color;inkCtx.fillStyle=op.color;inkCtx.lineCap="round";inkCtx.lineJoin="round";
  if(op.fill&&to>=1){inkCtx.beginPath();inkCtx.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)inkCtx.lineTo(p[i][0],p[i][1]);inkCtx.closePath();inkCtx.fill();}
  inkCtx.lineWidth=op.w;inkCtx.beginPath();inkCtx.moveTo(p[lo][0],p[lo][1]);for(let i=lo+1;i<=hi;i++)inkCtx.lineTo(p[i][0],p[i][1]);inkCtx.stroke();
  const stride=Math.max(1,Math.floor((hi-lo)/28));for(let i=lo;i<=hi;i+=stride)touchDensity(p[i][0],p[i][1],op.w,op.color);if(to>=1)marks++;
 }
 function initialise(s){
  originSeed=s>>>0;R=rng(originSeed);frame=marks=bundles=motionEvents=0;tracks=[];motion=[];anchors=[];nextMotionEvent=Math.floor(rand(55,110));density=new Float32Array(G*G);history=[];recent=[];field=[rand(0,6),rand(0,6),rand(0,6),rand(0,6)];paper();chooseSession();
  // Four overlapping source plates establish a continuous page, not isolated stickers.
  const placements=[[rand(240,370),rand(250,390)],[rand(600,760),rand(220,370)],[rand(350,600),rand(560,740)],[rand(700,840),rand(650,810)]];
  for(const [x,y] of placements)makeBundle(true);
  for(let i=0;i<2;i++)makeBundle(true);render();
 }
 async function buildAtlas(){
  onStatus("005 / loading source atlas");
  for(let i=0;i<SOURCES.length;i++){const meta=SOURCES[i],im=await loadImage(meta.url);if(im){try{atlas.push(extract(im,meta,0));atlas.push(extract(im,meta,1));}catch(e){failed++;}}else failed++;onStatus("005 / analysing image "+(i+1)+" of "+SOURCES.length);await new Promise(resolve=>requestAnimationFrame(resolve));}
  if(atlas.filter(a=>a.paths.length).length<2)throw Error("The local source-image atlas could not be loaded.");
  initialise(pendingSeed);readyState=true;onStatus("005 / source atlas ready");
 }
 function reset(s=(Math.random()*4294967295)>>>0){pendingSeed=s>>>0;if(readyState)initialise(pendingSeed);}
 function remember(){if(!readyState)return false;const direction={sources:session.map(s=>s.id),families:session.map(s=>s.family),seed:originSeed,created:Date.now()};memory.directions.unshift(direction);memory.directions=memory.directions.slice(0,12);memory.recent=recent.slice(-16);writeMemory();return true;}
 function step(){if(!readyState)return;frame++;field[0]+=(R()-.5)*.025;field[1]+=(R()-.5)*.025;field[2]+=(R()-.5)*.018;field[3]+=(R()-.5)*.018;
  for(const t of tracks){t.age++;while(t.cursor<t.items.length&&t.items[t.cursor].start<=t.age)t.live.push({...t.items[t.cursor++],last:0});for(const op of t.live){let f=clamp((t.age-op.start)/op.dur,0,1);if(f>op.last)paint(op,op.last,f);op.last=f;}t.live=t.live.filter(o=>o.last<1);}
  for(const m of motion)m.age++;const expired=motion.filter(m=>m.age>=m.life);for(const m of expired)if(m.settle&&R()<.68){const finalPath=motionGeometry(m,1);paint({p:finalPath,w:m.width*.82,color:m.color,fill:false},0,1);}motion=motion.filter(m=>m.age<m.life);
  tracks=tracks.filter(t=>t.cursor<t.items.length||t.live.length);if(frame>=nextMotionEvent){launchMotionBurst();nextMotionEvent=frame+Math.floor(rand(76,174));}if(frame%17===0&&tracks.length<15)makeBundle(false);if(frame%41===0&&tracks.length<13)makeBundle(false);render();
 }
 const ready=buildAtlas();
 return{ready,step,reset,remember,get frame(){return frame},get seconds(){return frame/FPS},get seed(){return originSeed},get finished(){return false},get stats(){return{marks,bundles,active:tracks.length,moving:motion.length,events:motionEvents,sources:session.map(s=>s.label),families:[...new Set(session.map(s=>s.family))],memory:memory.directions.length,atlas:atlas.length,contours:atlas.reduce((n,a)=>n+a.paths.length,0),images:SOURCES.length,failed}}};
}
function getMemoryCount(){try{return JSON.parse(localStorage.getItem(KEY)||"{}").directions?.length||0;}catch(e){return 0;}}
root.Palimpsest005={create,FPS,SIZE:N,SOURCES,getMemoryCount};
})(globalThis);