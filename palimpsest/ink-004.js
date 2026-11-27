/* PALIMPSEST 004. Whole-page, multi-scale, persistent ink. */
(function(root){"use strict";
const N=1000,FPS=24,INK="#201d19",PAPER="#eee9dc",WHITE="#f0ebdf",MID="#71665a",TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
function rng(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
function create(canvas,seed=(Math.random()*4294967295)>>>0){
 canvas.width=canvas.height=N;const ctx=canvas.getContext("2d",{alpha:false,willReadFrequently:true});
 let random,frame,tracks,regions,field,marks,seed0,grid,epoch,counts,history,globalPolarity;
 const G=100,C=N/G;const R=(a,b)=>mix(a,b,random()),pick=a=>a[Math.floor(random()*a.length)];
 function point(x,y){return [x,y];}
 function inside(p){return p[0]>-30&&p[0]<1030&&p[1]>-30&&p[1]<1030;}
 function angle(x,y){let a=.72*Math.sin(x*.007+field[0])+1.05*Math.cos(y*.006+field[1])+.55*Math.sin((x+y)*.009+field[2])+field[3];for(const v of field[4]){let dx=x-v.x,dy=y-v.y,d=Math.hypot(dx,dy),w=Math.exp(-d*d/(2*v.r*v.r))*.8;let b=Math.atan2(dy,dx)+v.twist; a+=Math.atan2(Math.sin(b-a),Math.cos(b-a))*w;}return a;}
 function trace(x,y,a,L,bend=0){let p=[[x,y]],heading=a;let n=Math.max(8,Math.ceil(L/5)),h=L/n;for(let j=1;j<=n;j++){let f=j/n,target=angle(x,y)+bend*Math.sin(f*Math.PI);let delta=Math.atan2(Math.sin(target-heading),Math.cos(target-heading));if(Math.abs(delta)>Math.PI/2)delta-=Math.sign(delta)*Math.PI;heading+=clamp(delta*.10,-.12,.12)+bend*.012;x+=Math.cos(heading)*h;y+=Math.sin(heading)*h;p.push([x,y]);}return p;}
 function offset(p,w){return p.map(([x,y],i)=>{let a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;let z=typeof w==="function"?w(i/(p.length-1)):w;return[x-dy/l*z,y+dx/l*z];});}
 function operation(p,w,c){return{p,w,c,phase:R(0,TAU)};}
 function tint(c){return c===INK?WHITE:INK;}
 function sample(x,y){let ix=Math.floor(x/C),iy=Math.floor(y/C);if(ix<0||iy<0||ix>=G||iy>=G)return .5;return grid[iy*G+ix];}
 function density(x,y,rad=30){let d=0,n=0;for(let j=-rad;j<=rad;j+=10)for(let i=-rad;i<=rad;i+=10)if(i*i+j*j<=rad*rad){d+=sample(x+i,y+j);n++;}return d/n;}
 function put(x,y,w,c){let v=c===INK?1:c===WHITE?0:.48,rad=Math.max(2,w*.45);for(let j=Math.floor((y-rad)/C);j<=Math.floor((y+rad)/C);j++)for(let i=Math.floor((x-rad)/C);i<=Math.floor((x+rad)/C);i++){if(i<0||j<0||i>=G||j>=G)continue;let dx=(i+.5)*C-x,dy=(j+.5)*C-y;if(Math.hypot(dx,dy)>rad+C*.6)continue;let k=j*G+i;grid[k]=mix(grid[k],v,clamp(w*.07,.09,1));}}
 function paint(o,from=0,to=1){let p=o.p,n=p.length-1,a=Math.floor(from*n),b=Math.min(n,Math.floor(to*n));if(a>=b)return;ctx.strokeStyle=o.c;ctx.lineCap="round";ctx.lineJoin="round";for(let i=a;i<b;){let j=Math.min(i+5,b),u=(i+j)*.5/n,w=o.w*(.78+.22*Math.sin(Math.PI*u)+.10*Math.sin(o.phase+i*.8));ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(...p[i]);for(let k=i+1;k<=j;k++){ctx.lineTo(...p[k]);let len=Math.hypot(p[k][0]-p[k-1][0],p[k][1]-p[k-1][1]);let steps=Math.max(1,Math.ceil(len/6));for(let q=1;q<=steps;q++)put(mix(p[k-1][0],p[k][0],q/steps),mix(p[k-1][1],p[k][1],q/steps),w,o.c);}ctx.stroke();i=j;}}
 function paper(){ctx.fillStyle=PAPER;ctx.fillRect(0,0,N,N);const im=ctx.getImageData(0,0,N,N),d=im.data;let r=rng(seed0^874);for(let y=0;y<N;y++)for(let x=0;x<N;x++){let z=(r()-.5)*14+2.8*Math.sin(x*.019+y*.012)+1.4*Math.cos(x*.04-y*.03),i=(y*N+x)*4;for(let k=0;k<3;k++)d[i+k]=clamp(d[i+k]+z,0,255);}ctx.putImageData(im,0,0);}
 function line(a,b,w,c){return operation([a,b],w,c);}
 function dots(p,n,c,rad=12){const out=[];for(let i=0;i<n;i++){let q=pick(p),x=q[0]+R(-rad,rad),y=q[1]+R(-rad,rad);out.push(line([x,y],[x+.15,y+.14],R(.65,2.4),c));}return out;}
 function ribbon(p,width,c,style="engrave",fill=true){
  const out=[],other=tint(c),shape=t=>width*(.22+.78*Math.pow(Math.sin(Math.PI*t),.62))*(1+.12*Math.sin(t*10+field[0]));
  if(fill){ // build opaque paint using neighbouring pen/brush tracks, rather than replacing a patch.
   let gap=width>35?5:3;
   for(let u=-1;u<=1.001;u+=gap/width)out.push(operation(offset(p,t=>u*shape(t)),gap*1.5,c));
  }
  for(let side of [-1,1]){out.push(operation(offset(p,t=>side*shape(t)),1.7,other));out.push(operation(offset(p,t=>side*(shape(t)-3)),.75,other));}
  if(style==="engrave"||style==="vein"){
   let n=style==="engrave"?Math.max(4,Math.round(width/3)):Math.max(4,Math.round(width/7));
   for(let j=0;j<n;j++){let u=(j+.5)/n*2-1;out.push(operation(offset(p,t=>u*shape(t)+1.3*Math.sin(t*14+u*3)),R(.55,1.35),other));}
  }
  if(style==="rib"||style==="vein"||style==="stitch"){
   for(let i=2;i<p.length-2;i+=style==="stitch"?3:2){let t=i/(p.length-1),q=p[i],d=shape(t),l=offset(p,d)[i],r=offset(p,-d)[i];if(style==="vein"){out.push(operation([l,p[Math.min(i+2,p.length-1)],r],R(.7,1.3),other));}else if(style==="stitch"){out.push(line(l,q,1,other),line(q,r,.7,other));}else out.push(operation([l,[q[0]+R(-2,2),q[1]+R(-2,2)],r],R(.65,1.25),other));}
  }
  if(style==="grain")out.push(...dots(p,Math.round(p.length*2.6),other,width*.7));
  if(style==="eyelet"){for(let i=4;i<p.length-4;i+=7){let q=p[i],r=shape(i/(p.length-1))*.58;if(r<4)continue;out.push(...ring(q[0],q[1],r,other,c));}}
  return out;
 }
 function ring(x,y,r,c,b){let out=[];for(let j=0;j<3;j++){let p=[];for(let i=0;i<=32;i++){let a=i/32*TAU,f=r*(1-j*.2)*(1+.035*Math.sin(a*5+x));p.push([x+f*Math.cos(a),y+f*.83*Math.sin(a)]);}out.push(operation(p,j===0?1.5:.85,c));}out.push(line([x-.15,y],[x+.15,y],r*.55,c),line([x-r*.13,y-r*.15],[x-r*.13+.2,y-r*.15],r*.15,b));return out;}
 function texture(p,w,c){let out=[];for(let i=0;i<8;i++){let q=offset(p,(i-3.5)*w/4);out.push(operation(q,R(.65,1.25),c));}return out;}
 function chooseColor(x,y){let d=density(x,y,40);return d>.56?WHITE:d<.30?INK:random()<.5?WHITE:INK;}
 function motif(type,p,a,L,c){
  // Shared anatomical/architectural vocabulary, now placed within continuous ink fields.
  let m=root.Palimpsest003.makeMotif(type,p,a,L,(random()*4294967295)>>>0,c===WHITE);
  return m.ops.map(o=>({...o,c:o.c==="#211e19"?INK:o.c==="#f1ece1"?WHITE:o.c}));
 }
 function score(p,a,L){let n=0,d=0;for(let i=0;i<10;i++){let u=(i+.5)/10,x=p[0]+Math.cos(a)*L*u,y=p[1]+Math.sin(a)*L*u;if(x<10||x>990||y<10||y>990)d-=.3;else{let q=density(x,y,20);d+=.4-Math.abs(q-.50);n++;}}return d+n*.02;}
 function enqueue(region,ops,instant=false,kind="ribbon"){
  if(instant){for(const o of ops)paint(o);return;}
  // Many simultaneous operations, with short staggered starts and real partial strokes.
  let cursor=0,rate=R(2.8,6.8),items=ops.map(o=>{let len=0;for(let j=1;j<o.p.length;j++)len+=Math.hypot(o.p[j][0]-o.p[j-1][0],o.p[j][1]-o.p[j-1][1]);let t=cursor;cursor+=1/rate;return{o,start:Math.floor(t),dur:Math.max(1,Math.min(7,Math.ceil(len/R(40,100)))),last:0};});
  tracks.push({id:region.id,items,cursor:0,live:[],age:0,kind});region.last=frame;region.kind=kind;counts[kind]=(counts[kind]||0)+1;
 }
 function center(region){let p=region.anchor;return[p[0]+R(-region.r*.65,region.r*.65),p[1]+R(-region.r*.65,region.r*.65)];}
 function plan(region,initial=false){
  let p=center(region),a=angle(...p)+R(-.75,.75),L=R(region.r*.90,region.r*1.85),c=chooseColor(...p);if(initial)c=random()<.70?INK:WHITE;
  // Inherit direction from the most recent stroke bundle, but allow discontinuities and opposing marks.
  if(region.end&&random()<.53){p=[mix(p[0],region.end[0],.58),mix(p[1],region.end[1],.58)];a=region.a+R(-1.15,1.15);}
  if(!inside(p))p=region.anchor.slice();
  let best={p,a,L,s:-Infinity};for(let j=0;j<8;j++){let q=j===0?p:[p[0]+R(-35,35),p[1]+R(-35,35)],aa=a+R(-.65,.65),ll=L*R(.78,1.2),s=score(q,aa,ll)+random()*.7;if(s>best.s)best={p:q,a:aa,L:ll,s};}
  p=best.p;a=best.a;L=best.L;c=initial?c:chooseColor(...p);
  let path=trace(p[0],p[1],a,L,R(-1.1,1.1)),w=R(9,region.r*.35),ops=[],kind;
  let u=random();
  if(initial||u<.46){kind="ribbon";ops=ribbon(path,w,c,pick(["engrave","rib","vein","grain","eyelet","stitch"]),true);}
  else if(u<.67){kind="cutback";ops=ribbon(path,w*.85,c,pick(["rib","engrave","grain"]),true);let q=path[Math.floor(path.length*.45)];ops.push(...ring(q[0],q[1],Math.max(5,w*.38),tint(c),c));}
  else if(u<.82){kind="detail";ops=texture(path,w,tint(c));ops.push(...dots(path,Math.round(R(22,60)),tint(c),w*.55));}
  else{kind="figure";let types=["profile","mask","bird","eye","insect","shell","arch","stairs","fold","feather","root","chamber"],prev=region.type;let type=pick(types.filter(x=>x!==prev));region.type=type;
   // First carve a coherent elongated ground, then articulate the new figure using the same axis.
   let ground=trace(p[0],p[1],a,L*.92,R(-.35,.35));ops=ribbon(ground,w*1.5,c,"grain",true);let q=ground[Math.floor(ground.length*.12)];ops.push(...motif(type,q,a,L*.77,tint(c)));}
  region.end=path[path.length-1];region.a=a;enqueue(region,ops,initial,kind);
 }
 function reset(s=seed0){seed0=s>>>0;random=rng(seed0);frame=marks=epoch=0;counts={};history=[];tracks=[];regions=[];grid=new Float32Array(G*G);globalPolarity=0;
 field=[R(0,TAU),R(0,TAU),R(0,TAU),R(-1,1),Array.from({length:4},()=>({x:R(100,900),y:R(100,900),r:R(120,270),twist:pick([.7,1.5,-1.3])}))];paper();
 // Whole-page scaffold: overlapping curving panels and varied black masses from edge to edge.
 for(let y=0;y<5;y++)for(let x=0;x<5;x++){let p=[(x+.5)*200+R(-52,52),(y+.5)*200+R(-52,52)],r=R(112,153);regions.push({id:y*5+x,anchor:p,r,last:-999,a:angle(...p),end:null});}
 for(let pass=0;pass<2;pass++)for(const region of regions){let p=center(region),a=angle(...p)+R(-.55,.55)+(pass===1?Math.PI:0),L=R(170,300),w=R(30,65),path=trace(p[0],p[1],a,L,R(-1,1));for(const o of ribbon(path,w,pass===0?INK:chooseColor(...p),pick(["engrave","vein","rib","grain","stitch"]),true))paint(o);region.end=path.at(-1);region.a=a;}
 // A single dominant figurative structure embedded into the page, not a blank background with stickers.
 let head=pick(["profile","mask"]),a=R(-.35,.35),L=R(410,510),p=[R(230,310),R(460,550)];let pp=trace(p[0],p[1],a,L*.95,R(-.3,.3));
 for(const o of ribbon(pp,L*.36,INK,"grain",true))paint(o);
 for(const o of motif(head,p,a,L,WHITE))paint(o);
 // Secondary scales: surrounding existing structures carry smaller engraved forms.
 for(const region of regions){if(random()<.38){let p=region.anchor,a=angle(...p),L=R(75,135);for(const o of motif(pick(["eye","shell","feather","arch","insect"]),p,a,L,chooseColor(...p)))paint(o);}}
 // Begin with 14 independently active regions, selected from different areas of the page.
 const order=regions.slice().sort((a,b)=>a.id-b.id);for(let i=order.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}for(const r of order.slice(0,14))plan(r);
 }
 function step(){frame++;
  // Global compositional movement: modify the common field gradually, never the existing pixels.
  if(frame%144===0){epoch++;field[0]+=R(-.25,.25);field[1]+=R(-.28,.28);field[3]+=R(-.16,.16);for(const v of field[4]){v.x=clamp(v.x+R(-60,60),60,940);v.y=clamp(v.y+R(-60,60),60,940);}}
  let touched=new Set();for(const q of tracks){q.age++;while(q.cursor<q.items.length&&q.items[q.cursor].start<=q.age)q.live.push(q.items[q.cursor++]);for(const o of q.live){let f=clamp((q.age-o.start)/o.dur,0,1);if(f>o.last){paint(o.o,o.last,f);touched.add(q.id);}o.last=f;if(f===1)marks++;}q.live=q.live.filter(o=>o.last<1);}
  tracks=tracks.filter(q=>q.cursor<q.items.length||q.live.length);
  let used=new Set(tracks.map(q=>q.id));let available=regions.filter(r=>!used.has(r.id)).sort((a,b)=>a.last-b.last);
  while(tracks.length<14&&available.length){let n=Math.min(5,available.length),i=Math.floor(random()*n),r=available.splice(i,1)[0];plan(r);}
  history.push(touched.size);if(history.length>120)history.shift();return true;
 }
 reset(seed);
 return {step,reset,get frame(){return frame},get seconds(){return frame/FPS},get seed(){return seed0},get finished(){return false},get stats(){return{marks,active:tracks.length,regions:regions.length,avgChanged:history.reduce((a,b)=>a+b,0)/Math.max(1,history.length),counts:{...counts}}}};
}
root.Palimpsest004={create,FPS,SIZE:N};
})(globalThis);