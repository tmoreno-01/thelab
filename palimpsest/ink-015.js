/* PALIMPSEST 015 — Surface / Subsurface
   An independent, persistent painting engine. Canvas 2D, no assets or dependencies.
   A seeded composition planner lays down pigmented knife swathes, dry drag,
   overpainting, local abrasion and excavations into earlier strata. */
(function(root){"use strict";
const N=1200,FPS=24,TAU=Math.PI*2,KEY="lifeafterlogic.palimpsest.015";
const PALETTES=[
{name:"Oxide / ultramarine",ground:"#d4c7ae",dark:"#211f22",body:["#b73a24","#d05d35","#9d3426","#263b80","#5b6b9a"],light:["#e8d9b9","#eee5d3","#d8a65e"],accent:["#e6bd35","#3548b3","#f1e6d1"]},
{name:"Cobalt / cadmium",ground:"#e4ddc9",dark:"#202633",body:["#254caa","#163a78","#6179ae","#c85b28","#bb372c"],light:["#e8e2d2","#d2c6a9","#b8c3d1"],accent:["#eaba28","#d53526","#e9e4d8"]},
{name:"Carbon / sulphur",ground:"#c9c7af",dark:"#202721",body:["#414e3d","#62694a","#8e8a5c","#b6a23b","#d2b645"],light:["#e1dec2","#a7aa91","#e5d9b0"],accent:["#e8ca3b","#bf5030","#bac7b1"]},
{name:"Oxblood / chalk",ground:"#cbb9ac",dark:"#2e2029",body:["#782b3a","#a34752","#512c49","#bc6a55","#51655f"],light:["#e5d3b9","#e8dfd2","#b9a9a6"],accent:["#dfaa51","#d16b41","#b8d0c2"]},
{name:"Prussian / rust",ground:"#c4d0c7",dark:"#192c30",body:["#153f51","#2b6670","#72968b","#a34b31","#cb7651"],light:["#e1e0c9","#c5d6d0","#d9b98f"],accent:["#d8ad47","#ba3c26","#e5e4d6"]},
{name:"Violet / citron",ground:"#d4cdbd",dark:"#292332",body:["#5b487e","#7c729e","#342a55","#797d43","#aca85e"],light:["#e2d9c7","#ccc6ce","#e8dbad"],accent:["#e0c34c","#b24d42","#d7ddba"]},
{name:"Bone / ink",ground:"#d5cdbb",dark:"#211f1a",body:["#3c3b36","#62625b","#98968a","#a26e50","#73513c"],light:["#e9e1d0","#c4beb1","#b8b29d"],accent:["#bf402a","#314f70","#d6a345"]}
];
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
const mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>t*t*(3-2*t);
function rgb(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
function tint(hex,v){const c=rgb(hex);return "rgb("+c.map(n=>Math.round(clamp(n+v,0,255))).join(",")+")";}
function path(ctx,pts,closed=false){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);if(closed)ctx.closePath();}
function fill(ctx,pts,col){path(ctx,pts,true);ctx.fillStyle=col;ctx.fill();}
function line(ctx,pts,col,w){path(ctx,pts);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke();}
function surface(){const c=document.createElement("canvas");c.width=c.height=N;return c;}
function create(canvas,seed=(Math.random()*4294967295)>>>0,onStatus=()=>{}){
 canvas.width=canvas.height=N;
 const ctx=canvas.getContext("2d",{alpha:false}),base=surface(),bed=surface(),layer=surface();
 const b=base.getContext("2d",{alpha:false}),u=bed.getContext("2d",{alpha:false}),l=layer.getContext("2d");
 let R=rng(seed),origin=seed>>>0,frame=0,epoch=0,palette,plan,active=null,next=0,marks=0,excavations=0,coats=0,scuffs=0,history=[],lastKind="",memory=[];
 const rand=(a,b)=>mix(a,b,R()),pick=a=>a[Math.floor(R()*a.length)];
 try{memory=JSON.parse(localStorage.getItem(KEY)||"[]");if(!Array.isArray(memory))memory=[];}catch(e){memory=[];}
 // The composition has deliberately unequally weighted regions; each seed chooses
 // a different spatial grammar, hierarchy, directional tension and focal area.
 function composition(){
  const kind=pick(["oblique fault","vertical rupture","offset horizon","cross pressure","edge mass","split field"]);
  const phi=kind==="vertical rupture"?rand(1.27,1.9):kind==="offset horizon"?rand(-.17,.17):kind==="edge mass"?rand(.8,1.4):rand(-.85,.85);
  const x=rand(.35,.65)*N,y=rand(.30,.66)*N,side=R()<.5?-1:1;
  const centers=[[x,y],[clamp(x+Math.cos(phi+Math.PI*.5)*side*N*.27,N*.05,N*.95),clamp(y+Math.sin(phi+Math.PI*.5)*side*N*.27,N*.05,N*.95)],[clamp(x-Math.cos(phi)*N*.32,N*.02,N*.98),clamp(y-Math.sin(phi)*N*.32,N*.02,N*.98)]];
  return{kind,phi,centers,side,dominant:pick(palette.body.slice(0,3)),secondary:pick(palette.body.slice(3)),accent:pick(palette.accent),weight:rand(.72,1.25)};
 }
 function paper(){
  b.fillStyle=palette.ground;b.fillRect(0,0,N,N);
  const tile=document.createElement("canvas");tile.width=tile.height=256;const g=tile.getContext("2d"),im=g.createImageData(256,256),rgb0=rgb(palette.ground);
  for(let i=0;i<im.data.length;i+=4){const grain=rand(-17,17)+(R()<.035?rand(-22,22):0);im.data[i]=rgb0[0]+grain;im.data[i+1]=rgb0[1]+grain;im.data[i+2]=rgb0[2]+grain;im.data[i+3]=255;}
  g.putImageData(im,0,0);b.fillStyle=b.createPattern(tile,"repeat");b.globalAlpha=.58;b.fillRect(0,0,N,N);b.globalAlpha=1;
 }
 function colour(role){if(role==="accent")return plan.accent;if(role==="dark")return palette.dark;if(role==="light")return pick(palette.light);return R()<.72?plan.dominant:plan.secondary;}
 // A broad, irregular paint-knife contact patch. Centerline corners are hard;
 // the cross-section is compressed asymmetrically by pressure and blade tilt.
 function ribbon(cx,cy,len,width,angle,kind){
  const n=clamp(Math.ceil(len/12),22,100),c=Math.cos(angle),s=Math.sin(angle),p0=rand(0,TAU),p1=rand(0,TAU),bias=rand(-.25,.25),bend=rand(-.2,.2)*width;
  const stations=[rand(-.09,.09)*width,rand(-.16,.16)*width,rand(-.14,.14)*width,rand(-.10,.10)*width,rand(-.08,.08)*width];
  const A=[],B=[];
  for(let i=0;i<=n;i++){
   const t=i/n,k=Math.min(3,Math.floor(t*4)),f=t*4-k,off=mix(stations[k],stations[k+1],f)+Math.sin(Math.PI*t)*bend;
   // Blunt starts, torn irregular endings, occasional pointed knife lift.
   let envelope=kind==="gesture"?.23+.77*Math.pow(Math.sin(Math.PI*t),.55):.78+.16*Math.sin(t*TAU+p0)+.07*Math.sin(t*13+p1);
   if(kind!=="gesture"){if(t>.87)envelope*=mix(1,.33,(t-.87)/.13);if(t<.045)envelope*=mix(.68,1,t/.045);}
   const edgeA=rand(-1,1)*Math.min(7,width*.035)+Math.sin(t*79+p0)*Math.min(4,width*.025),edgeB=rand(-1,1)*Math.min(6,width*.035)+Math.sin(t*61+p1)*Math.min(5,width*.027);
   const along=(t-.5)*len,x=cx+c*along-s*off,y=cy+s*along+c*off,wa=width*envelope*(.5+bias)+edgeA,wb=width*envelope*(.5-bias)+edgeB;
   A.push([x-s*wa,y+c*wa]);B.push([x+s*wb,y-c*wb]);
  }
  const point=(t,v)=>{const z=clamp(t,0,1)*n,i=Math.min(n-1,Math.floor(z)),f=z-i,a=[mix(A[i][0],A[i+1][0],f),mix(A[i][1],A[i+1][1],f)],b=[mix(B[i][0],B[i+1][0],f),mix(B[i][1],B[i+1][1],f)];return[mix(a[0],b[0],v),mix(a[1],b[1],v)];};
  return{A,B,polygon:A.concat(B.slice().reverse()),point,c,s,cx,cy,len,width};
 }
 function strand(r,t0,t1,v,wobble=0){
  const n=clamp(Math.ceil((t1-t0)*r.len/17),2,55),p=[],ph=rand(0,TAU);
  for(let i=0;i<=n;i++){let t=mix(t0,t1,i/n);p.push(r.point(t,clamp(v+Math.sin(t*31+ph)*wobble,0,1)));}
  return p;
 }
 function makeStroke(spec){
  const {kind,col,cx,cy,len,width,angle}=spec,r=ribbon(cx,cy,len,width,angle,kind);
  l.clearRect(0,0,N,N);l.globalCompositeOperation="source-over";l.globalAlpha=1;l.lineCap="butt";l.lineJoin="bevel";
  l.save();path(l,r.polygon,true);l.clip();
  if(kind==="excavate"){
   // Re-expose an actual earlier paint layer, leaving torn traces of the old top coat.
   l.drawImage(bed,0,0);
  }else{
   l.fillStyle=col;l.fillRect(0,0,N,N);
   // Several coherent zones of lighter and darker pigment within each swathe,
   // instead of a smooth digital gradient.
   const bands=width>100?Math.floor(rand(5,10)):Math.floor(rand(2,5));
   for(let k=0;k<bands;k++){
    const a=rand(-.07,.95),z=clamp(a+rand(.05,.26),0,1),v=rand(0,.88),w=rand(.045,.42),p=[];
    for(let i=0;i<=12;i++){const t=mix(a,z,i/12);p.push(r.point(t,clamp(v+.035*Math.sin(i*.7+k),0,1)));}
    for(let i=12;i>=0;i--){const t=mix(a,z,i/12);p.push(r.point(t,clamp(v+w+.06*Math.sin(i*.46+k),0,1)));}
    l.globalAlpha=rand(.22,.65);fill(l,p,tint(col,rand(-42,43)));
   }
  }
  // Knife ridges follow the physical direction of application. Mostly broken,
  // clustered marks; thick paint catches a narrow light edge and dark shoulder.
  const num=clamp(Math.ceil(width*1.05+len*.025),16,330);
  for(let i=0;i<num;i++){
   const v=R(),a=rand(0,.96),z=Math.min(1,a+Math.pow(R(),2)*.65+.018),w=rand(.25,1.65)*(R()<.09?3.2:1),pts=strand(r,a,z,v,rand(.001,.016));
   if(kind==="excavate"){l.globalCompositeOperation="source-over";l.globalAlpha=rand(.12,.42);line(l,pts,tint(col,rand(-25,25)),w);}
   else{l.globalAlpha=rand(.11,.49);line(l,pts,tint(col,rand(-55,54)),w);}
  }
  // Dense, localised powder and pigment grains, with the same orientation as
  // the swathe. Sizes span fine dust through to visibly chunky paint flakes.
  const grains=clamp(Math.floor(len*width/135),45,2200);
  for(let i=0;i<grains;i++){
   const t=R(),v=R();if(Math.sin(t*17+v*8)> .66&&R()<.7)continue;
   const q=r.point(t,v),w=rand(.4,2.1)*(R()<.07?2.8:1),height=w*rand(.23,1.3);
   l.globalAlpha=rand(.09,.39);l.fillStyle=tint(col,rand(-65,62));l.fillRect(q[0],q[1],w,height);
  }
  // Real holes in the new paint: the persistent canvas below remains visible.
  l.globalCompositeOperation="destination-out";
  const scratches=kind==="dry"?Math.floor(rand(90,190)):kind==="excavate"?Math.floor(rand(55,105)):Math.floor(rand(15,65));
  for(let k=0;k<scratches;k++){
   const v=R(),a=rand(0,.96),z=Math.min(1,a+rand(.008,kind==="dry"?.65:.27)),w=kind==="dry"?rand(.4,4.2):rand(.25,2.8);
   l.globalAlpha=kind==="dry"?rand(.55,1):rand(.37,.95);line(l,strand(r,a,z,v,rand(0,.008)),"#000",w);
  }
  if(kind==="dry"||kind==="excavate"){
   for(let k=0;k<32;k++){
    const t=R(),v=R(),q=r.point(t,v),w=rand(1,10);l.globalAlpha=rand(.55,1);l.fillStyle="#000";l.fillRect(q[0],q[1],w,rand(.6,3));
   }
  }
  l.restore();l.globalCompositeOperation="source-over";l.globalAlpha=1;
  // Small raised lip on selected heavy swathes, never a closed digital outline.
  if(kind==="knife"&&width>75){
   const edge=R()<.5?0:1,a=rand(.12,.50),z=rand(.58,.91);
   l.globalAlpha=.35;line(l,strand(r,a,z,edge),tint(col,38),rand(.8,2.5));l.globalAlpha=1;
  }
  return r;
 }
 function event(kind,role,location,scale=1){
  const center=location||pick(plan.centers),i=plan.centers.indexOf(center);
  const fine=kind==="scratch",wide=kind==="field",thin=kind==="dry",exc=kind==="excavate";
  const len=(wide?rand(800,1450):fine?rand(60,410):thin?rand(180,650):exc?rand(140,550):kind==="gesture"?rand(320,870):rand(280,1000))*scale;
  const width=(wide?rand(230,510):fine?rand(2,14):thin?rand(15,95):exc?rand(25,185):kind==="gesture"?rand(15,85):rand(75,310))*scale;
  let angle=plan.phi+rand(-.25,.25);
  if(fine||exc||plan.kind==="cross pressure"&&i===1)angle+=rand(.65,1.6)*(R()<.5?-1:1);
  else if(R()<.17)angle+=rand(-.8,.8);
  return{kind,col:colour(role),cx:center[0]+rand(-1,1)*(wide?210:125),cy:center[1]+rand(-1,1)*(wide?180:125),len,width,angle};
 }
 function commit(spec){
  makeStroke(spec);b.drawImage(layer,0,0);marks++;if(spec.kind==="excavate")excavations++;else if(spec.kind==="dry"||spec.kind==="scratch")scuffs++;else coats++;
  history.push({kind:spec.kind,x:spec.cx,y:spec.cy});if(history.length>18)history.shift();
 }
 function refreshBed(){u.drawImage(base,0,0);}
 function opening(){
  paper();
  // Base fields partly leave the original ground intact, with a dominant mass,
  // one opposing plane, and a contrasting narrow cut rather than uniform coverage.
  commit(event("field","dark",plan.centers[2],1.15));
  commit(event("field","body",plan.centers[0],1.14));
  if(plan.kind==="split field"||plan.kind==="offset horizon")commit(event("field","light",plan.centers[1],1.1));
  else commit(event("knife","light",plan.centers[1],1.18));
  commit(event("knife","body",plan.centers[1],.9));
  refreshBed();
  commit(event("knife","dark",plan.centers[0],.72));
  commit(event("knife","light",plan.centers[0],.72));
  commit(event("knife","accent",plan.centers[0],.48));
  commit(event("dry","body",plan.centers[2],1));
  commit(event("excavate","dark",plan.centers[0],.8));
  commit(event("gesture","dark",plan.centers[0],.7));
  for(let i=0;i<5;i++)commit(event(i%2?"scratch":"dry",i%3===0?"accent":i%3===1?"light":"dark",i<3?plan.centers[0]:plan.centers[1],rand(.35,.8)));
 }
 function chooseEvent(){
  // Avoid aimless accretion. A painting chapter alternates large structural
  // interventions with detail, and regularly removes paint instead of adding it.
  const phase=epoch%11;let kind,role,scale=1;
  if(phase===0){kind="knife";role=pick(["body","dark","light"]);scale=rand(.8,1.2);}
  else if(phase===1||phase===5||phase===9){kind="excavate";role=pick(["dark","body"]);scale=rand(.75,1.15);}
  else if(phase===2||phase===6){kind="dry";role=pick(["light","dark","body"]);scale=rand(.6,1);}
  else if(phase===3||phase===8){kind="gesture";role=pick(["dark","body"]);scale=rand(.6,1);}
  else if(phase===4||phase===7){kind="scratch";role=phase===4?"accent":"light";scale=rand(.5,1.1);}
  else{kind="knife";role="accent";scale=rand(.35,.65);}
  const spot=phase===0?pick(plan.centers):R()<.77?plan.centers[0]:pick(plan.centers);
  // Rare changes of the dominant region preserve continuity but shift balance.
  if(phase===0&&epoch>0&&R()<.45){plan.centers.reverse();plan.phi+=rand(-.32,.32);}
  if(epoch%22===11)refreshBed();
  return event(kind,role,spot,scale);
 }
 function start(){
  const spec=chooseEvent(),r=makeStroke(spec);active={spec,r,age:0,dur:Math.floor(rand(spec.kind==="scratch"?18:35,spec.kind==="scratch"?35:85))};lastKind=spec.kind;epoch++;
 }
 function render(){
  ctx.drawImage(base,0,0);
  if(!active)return;
  const {r,age,dur}=active,t=smooth(clamp(age/dur,0,1));
  // A moving blade edge reveals only the current paint contact patch, while
  // the older canvas stays perfectly stable. No global zoom or fade.
  const lead=(t-.5)*r.len+mix(-18,18,t),x=r.cx+r.c*lead,y=r.cy+r.s*lead,reach=N*2;
  const corners=[[x-r.s*reach,y+r.c*reach],[x+r.s*reach,y-r.c*reach],[x+r.s*reach-r.c*reach,y-r.c*reach-r.s*reach],[x-r.s*reach-r.c*reach,y+r.c*reach-r.s*reach]];
  ctx.save();path(ctx,corners,true);ctx.clip();ctx.drawImage(layer,0,0);ctx.restore();
 }
 function reset(s=(Math.random()*4294967295)>>>0){
  origin=s>>>0;R=rng(origin);frame=epoch=marks=excavations=coats=scuffs=0;active=null;next=FPS;history=[];
  const saved=memory.find(m=>m.seed===origin);
  palette=saved?PALETTES.find(p=>p.name===saved.palette)||pick(PALETTES):pick(PALETTES);
  plan=composition();opening();lastKind="initial strata";render();
 }
 function step(){
  frame++;
  if(active){
   active.age++;if(active.age>=active.dur){b.drawImage(layer,0,0);marks++;if(active.spec.kind==="excavate")excavations++;else if(active.spec.kind==="dry"||active.spec.kind==="scratch")scuffs++;else coats++;
    active=null;next=frame+Math.floor(rand(8,38));
   }
  }else if(frame>=next)start();
  render();
 }
 function remember(){try{memory.unshift({seed:origin,palette:palette.name});memory=memory.slice(0,12);localStorage.setItem(KEY,JSON.stringify(memory));return true;}catch(e){return false;}}
 reset(origin);onStatus("015 / surface ready");
 return{ready:Promise.resolve(),step,reset,remember,get seconds(){return frame/FPS;},get seed(){return origin;},get stats(){return{marks,excavations,coats,scuffs,palette:palette.name,composition:plan.kind,phase:lastKind,memory:memory.length};}};
}
root.Palimpsest015={create,FPS,SIZE:N};
})(globalThis);