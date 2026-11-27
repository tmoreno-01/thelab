/* PALIMPSEST 003 — persistent ink, spatial grammar and adaptive composition.
   No network, frame images, or fixed animation sequence. */
(function(root){"use strict";
const N=1000,FPS=12,INK="#211e19",PAPER="#eee9dd",ERASE="#f1ece1";
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function rng(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
function spline(p){if(p.length<3)return p;let q=[p[0],...p,p[p.length-1]],out=[];for(let i=0;i<p.length-1;i++){let [a,b,c,d]=q.slice(i,i+4),n=Math.max(4,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/3));for(let j=0;j<n;j++){let t=j/n;out.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)));}}out.push(p[p.length-1]);return out;}
const grammar={
 profile:["bird","mask","arch","feather","root","chamber","eye","fold"],
 bird:["feather","root","profile","insect","fold","shell"],
 arch:["stairs","arch","root","eye","chamber","profile"],
 stairs:["arch","fold","chamber","root","mask"],
 root:["bird","feather","insect","chamber","eye","shell"],
 feather:["bird","fold","root","insect","shell"],
 eye:["profile","mask","arch","shell","chamber"],
 shell:["eye","root","fold","insect","arch"],
 fold:["profile","root","bird","stairs","feather"],
 chamber:["arch","profile","eye","shell","stairs"],
 mask:["eye","profile","bird","chamber","fold"],
 insect:["feather","shell","root","bird","mask"]
};
const spread={profile:.62,bird:.48,arch:.48,stairs:.45,root:.55,feather:.38,eye:.38,shell:.56,fold:.54,chamber:.52,mask:.57,insect:.63};
function makeMotif(type,origin,a,L,seed,white=false){
 const random=rng(seed),R=(x,y)=>x+(y-x)*random(),C=white?ERASE:INK,W=white?INK:ERASE;let ops=[],ports=[];
 const flip=random()<.5?-1:1,skew=R(-.12,.12),sy=R(.82,1.18)*flip;
 const tr=([u,v])=>[origin[0]+L*((u+skew*v)*Math.cos(a)-v*sy*Math.sin(a)),origin[1]+L*((u+skew*v)*Math.sin(a)+v*sy*Math.cos(a))];
 function line(p,w=1.3,c=C,smooth=true){let pts=p.map(tr);pts=smooth?spline(pts):pts;let phase=R(0,TAU),rough=R(.16,.5);pts=pts.map(([x,y],i)=>[x+rough*Math.sin(phase+i*1.7),y+rough*Math.cos(phase+i*1.2)]);let len=0;for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(len<.06)return;ops.push({p:pts,w:w*clamp(Math.sqrt(L/130),.7,1.55),c,phase,len});}
 function dot(x,y,w=1.5,c=C){line([[x,y],[x+.002,y+.001]],w,c,false);}
 function port(u,v,da,k=type){ports.push({p:tr([u,v]),a:a+da*flip,type:k});}
 function ell(x,y,rx,ry,w=1,c=C,rot=0,start=0,end=TAU){let p=[],n=Math.max(22,Math.ceil(L*Math.max(rx,ry)*Math.abs(end-start)/3));for(let i=0;i<=n;i++){let t=start+(end-start)*i/n,f=1+.018*Math.sin(7*t+x*13)+.011*Math.sin(t*11+y*9),xx=rx*Math.cos(t)*f,yy=ry*Math.sin(t)*f;p.push([x+xx*Math.cos(rot)-yy*Math.sin(rot),y+xx*Math.sin(rot)+yy*Math.cos(rot)]);}line(p,w,c,false);}
 function hatch(poly,space=.029,angle=.9,w=.9,c=C){const dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx,vs=poly.map(p=>p[0]*nx+p[1]*ny);for(let d=Math.min(...vs)+space*.5;d<Math.max(...vs);d+=space*R(.8,1.2)){let cut=[];for(let i=0;i<poly.length;i++){let p=poly[i],q=poly[(i+1)%poly.length],u=p[0]*nx+p[1]*ny,v=q[0]*nx+q[1]*ny;if((u<=d&&v>d)||(v<=d&&u>d)){let f=(d-u)/(v-u);cut.push((p[0]+f*(q[0]-p[0]))*dx+(p[1]+f*(q[1]-p[1]))*dy);}}cut.sort((a,b)=>a-b);for(let i=0;i+1<cut.length;i+=2){let x=cut[i],y=cut[i+1];if(y-x<.008)continue;let p=t=>[t*dx+d*nx,t*dy+d*ny],m=p((x+y)/2);m[0]+=nx*R(-.006,.006);m[1]+=ny*R(-.006,.006);line([p(x),m,p(y)],w*R(.75,1.15),c);}}}
 function solid(poly,w=5,c=C){hatch(poly,Math.max(.009,w*.52/L),R(.5,1.1),w,c);}
 function eye(x,y,rx,ry,c=C,back=W){let top=[[x-rx,y],[x-rx*.55,y-ry*.8],[x,y-ry],[x+rx*.63,y-ry*.67],[x+rx,y+.05*ry]],bottom=[[x+rx,y+.05*ry],[x+rx*.45,y+ry*.63],[x-rx*.15,y+ry*.7],[x-rx*.65,y+ry*.32],[x-rx,y]];line(top,2,c);line(bottom,1.3,c);for(let j=0;j<3;j++)line(top.map(([u,v])=>[u,v-ry*(.19+j*.19)]),.7,c);let rr=Math.min(rx*.41,ry*.76),cx=x+rx*.12;ell(cx,y,rr,rr,1,c);for(let k=0;k<32;k++){let t=k*TAU/32;line([[cx+rr*.28*Math.cos(t),y+rr*.28*Math.sin(t)],[cx+rr*.95*Math.cos(t+.05),y+rr*.95*Math.sin(t+.05)]],.65,c,false);}dot(cx,y,rr*L*.70,c);dot(cx-rr*.2,y-rr*.23,rr*L*.18,back);for(let j=0;j<12;j++){let u=-1+j*2/11,v=-Math.sqrt(Math.max(0,1-u*u))*.8;line([[x+rx*u,y+ry*v],[x+rx*(u+.07*u),y+ry*(v-.19-R(0,.13))]],.8,c,false);}}
 function ribs(p,q,n=16,w=.75,c=C){for(let i=0;i<n;i++){let f=(i+.5)/n;let interp=(a,t)=>{let z=t*(a.length-1),j=Math.min(a.length-2,Math.floor(z)),u=z-j;return[a[j][0]*(1-u)+a[j+1][0]*u,a[j][1]*(1-u)+a[j+1][1]*u]};let b=interp(p,f),e=interp(q,f);line([b,[(b[0]+e[0])/2+R(-.012,.012),(b[1]+e[1])/2+R(-.014,.014)],e],w,c);}}
 switch(type){
 case "profile":{
 // A side-on anatomical profile. The first mark attaches at the neck.
 let contour=[[0,0],[.14,-.05],[.23,-.26],[.37,-.43],[.57,-.48],[.75,-.38],[.81,-.20],[.82,-.08],[.98,.01],[.87,.07],[.86,.15],[.93,.20],[.85,.25],[.77,.34],[.61,.36],[.45,.27],[.31,.29],[.18,.19],[0,0]];
 line(contour,2.2);line([[.39,-.08],[.44,-.16],[.52,-.11],[.52,.02],[.43,.08],[.42,-.01],[.47,-.055]],1.4);eye(.72,-.10,.10,.065);line([[.65,-.21],[.72,-.235],[.79,-.17]],2.4);line([[.79,-.08],[.80,.0],[.88,.035]],1.15);line([[.79,.19],[.87,.20],[.83,.25],[.76,.27]],1.25);line([[.60,.36],[.53,.31],[.48,.23],[.45,.14]],1.25);
 let hair=[[.12,-.05],[.23,-.26],[.37,-.43],[.57,-.48],[.75,-.38],[.72,-.30],[.56,-.34],[.40,-.29],[.32,-.13],[.25,.10],[.17,.19]];
 solid(hair,4.1);ribs([[.22,-.11],[.35,-.34],[.55,-.44],[.69,-.39]],[[.28,-.07],[.39,-.28],[.57,-.36],[.72,-.30]],23,.72,W);
 hatch([[.30,.02],[.37,.12],[.46,.18],[.55,.29],[.45,.27],[.31,.29],[.24,.18]],.026,.85,.8);
 hatch([[.56,-.03],[.64,-.01],[.71,.04],[.75,.11],[.67,.15],[.59,.10]],.022,1.2,.73);
 port(.75,-.38,-.9);port(.98,.01,.1,"bird");port(.61,.36,.85);port(.23,-.26,-1.8,"root");break;}
 case "bird":{
 let upper=[[0,0],[.15,-.14],[.30,-.30],[.46,-.35],[.64,-.29],[.76,-.15],[.84,-.04],[1,.01],[.83,.08],[.68,.10],[.55,.20],[.43,.39],[.18,.43],[0,0]];
 line(upper,2.1);line([[.75,-.14],[.81,-.05],[1,.01],[.80,.03],[.69,.10]],1.3);eye(.61,-.13,.10,.076);line([[.20,-.09],[.31,-.19],[.48,-.25]],1.3);
 let outer=[[.06,.03],[.20,.20],[.35,.37],[.43,.39]],inner=[[.18,-.04],[.31,.08],[.46,.19],[.55,.20]];
 ribs(outer,inner,25,.8);hatch([[.20,-.14],[.30,-.30],[.46,-.35],[.55,-.29],[.38,-.21],[.27,-.09]],.025,.8,.8);
 port(.43,.39,.8,"feather");port(1,.01,.15);port(.30,-.30,-1.2);break;}
 case "mask":{
 let p=[[0,0],[.17,-.32],[.43,-.48],[.75,-.38],[.93,-.10],[.90,.15],[.71,.39],[.41,.49],[.18,.26],[0,0]];line(p,2.5);for(let i=1;i<5;i++){let f=1-i*.067;line(p.map(([x,y])=>[.48+(x-.48)*f,y*f]),.75);}
 eye(.40,-.14,.16,.095);eye(.69,-.11,.12,.075);line([[.56,-.07],[.52,.07],[.60,.16],[.65,.11]],1.65);line([[.39,.23],[.49,.18],[.61,.20],[.72,.17],[.63,.30],[.49,.31],[.39,.23]],1.5);for(let i=0;i<13;i++)line([[.44+i*.017,.24],[.44+i*.017,.28]],.65);
 hatch([[.10,-.02],[.22,-.25],[.29,-.14],[.24,.01],[.28,.20],[.36,.36],[.18,.26]],.025,.95,.9);port(.43,-.48,-1.15);port(.93,-.1,.1);port(.71,.39,.9);break;}
 case "eye":{
 line([[0,0],[.18,-.25],[.52,-.39],[.81,-.22],[1,0],[.77,.25],[.48,.35],[.17,.21],[0,0]],1.6);eye(.50,0,.43,.25);for(let j=0;j<12;j++){let f=j/11;line([[.13+f*.7,.28*Math.sin(f*Math.PI)],[.12+f*.75,.35*Math.sin(f*Math.PI)+.05]],.65);}port(.50,-.39,-1.2);port(1,0,0);port(.48,.35,1.3);break;}
 case "arch":case "chamber":{
 let x=.08,y=-.35,w=.79,h=.69,d=.13;line([[0,0],[x,y],[x+w,y],[x+w+d,y+d],[x+w+d,y+h],[x+d,y+h],[0,0]],1.8,C,false);line([[x,y],[x+d,y+d],[x+w+d,y+d]],1.1);line([[x+d,y+d],[x+d,y+h]],1.1);
 for(let i=0;i<4;i++){let u=.18+i*.17;let top=-.14-R(0,.06);line([[u,.28],[u,top],[u+.07,top-.08],[u+.14,top],[u+.14,.28]],1.25);line([[u+.04,.26],[u+.04,top+.03],[u+.07,top-.025],[u+.10,top+.03],[u+.10,.26]],.9);if(i%2===0)hatch([[u+.045,.25],[u+.045,top+.03],[u+.10,top+.03],[u+.10,.25]],.018,1.3,.9);}
 for(let i=0;i<7;i++){let v=-.25+i*.09;line([[x,v],[x+d,v+d],[x+w+d,v+d]],.7);}
 hatch([[x,y],[x+d,y+d],[x+d,y+h],[x,y+h-d]],.022,1.1,.8);port(.51,-.35,-1.1,"root");port(1,.05,0);port(.64,.34,1.25,"stairs");break;}
 case "stairs":{
 let p=[[0,0]];let n=8+Math.floor(R(0,5));for(let i=0;i<n;i++){let u=i/n,v=-i*.055;p.push([u+.07,v],[u+.07,v-.055],[u+1/n,v-.055]);}line(p,1.7,C,false);let q=p.map(([x,y])=>[x,y+.28]);line(q,1.2,C,false);for(let i=1;i<p.length;i+=3){let b=p[i];line([b,[b[0],b[1]+.28]],.9,C,false);}
 line([[0,.28],[.33,.27],[.70,.1],[1,-n*.055+.28]],1.6);hatch([[.05,.05],[.30,-.13],[.66,-.32],[.95,-.49],[.95,-.20],[.05,.28]],.034,.98,.68);port(.96,-n*.055,-.25,"arch");port(.33,.27,1.3);break;}
 case "root":{
 function branch(x,y,ang,l,dep){let b=R(-.55,.55),p=[];for(let i=0;i<=20;i++){let u=i/20;p.push([x+l*u*Math.cos(ang+b*u),y+l*u*Math.sin(ang+b*u)]);}line(p,.65+dep*.55);if(dep>0){for(let i=0;i<3;i++){let u=.38+i*.28,q=p[Math.round(u*20)];branch(q[0],q[1],ang+b*u+(i%2?1:-1)*R(.35,.85),l*R(.36,.51),dep-1);}}else{let e=p[p.length-1],aa=ang+b;line([e,[e[0]+Math.cos(aa-.4)*l*.40,e[1]+Math.sin(aa-.4)*l*.40],[e[0]+Math.cos(aa)*l*.65,e[1]+Math.sin(aa)*l*.65],[e[0]+Math.cos(aa+.4)*l*.40,e[1]+Math.sin(aa+.4)*l*.40],e],.7);}}
 branch(0,0,0,.76,3);branch(.18,0,-.55,.40,2);port(.78,0,0);port(.48,-.28,-.9);port(.47,.27,.9);break;}
 case "feather":{
 let p=[[0,0],[.28,-.22],[.58,-.30],[.85,-.19],[1,0],[.70,.25],[.39,.24],[.13,.08],[0,0]];line(p,1.6);let stem=[[0,0],[.29,-.03],[.61,.025],[1,0]];line(stem,2.1);ribs(stem,[[.08,-.06],[.28,-.22],[.58,-.30],[.85,-.19],[1,0]],29,.75);ribs(stem,[[.08,.03],[.23,.18],[.52,.26],[.78,.19],[1,0]],26,.78);port(1,0,.05);port(.58,-.30,-1.1);break;}
 case "shell":{
 let p=[];for(let i=0;i<150;i++){let t=i/149*TAU*2.65,rr=.018*Math.exp(t*.205);p.push([.48+rr*Math.cos(t+1.1),rr*.91*Math.sin(t+1.1)]);}line([[0,0],...p.slice().reverse()],1.6);
 for(let j=0;j<9;j++){let f=.86+j*.036;line(p.map(([x,y])=>[.48+(x-.48)*f,y*f]),.75);}
 for(let t=2;t<16.6;t+=.27){let rr=.018*Math.exp(t*.205),ang=t+1.1;let x=.48+rr*Math.cos(ang),y=rr*.91*Math.sin(ang);line([[x-rr*.12*Math.cos(ang),y-rr*.12*Math.sin(ang)],[x+rr*.12*Math.cos(ang),y+rr*.12*Math.sin(ang)]],.72);}
 port(.84,.06,.25);port(.47,-.49,-1.3);break;}
 case "fold":{
 let p=[[0,0],[.22,-.17],[.37,-.39],[.60,-.37],[.73,-.13],[.88,-.07],[1,.12],[.76,.34],[.52,.27],[.35,.05],[.18,.12],[0,0]];
 line(p,1.6);for(let i=1;i<18;i++){let f=i/18;line(p.map(([x,y],j)=>[x*.88+.06*f,y*(1-.65*f)+.13*f*Math.sin(j*.9)]),R(.65,1.1));}
 hatch([[.36,-.34],[.60,-.37],[.73,-.13],[.63,-.16],[.50,-.24]],.023,1.3,.9);port(.60,-.37,-1);port(1,.12,.2);port(.76,.34,1.2);break;}
 case "insect":{
 let p=[[0,0],[.22,-.07],[.35,-.29],[.54,-.42],[.78,-.36],[.91,-.13],[.96,.06],[.77,.38],[.53,.43],[.32,.25],[.22,.07],[0,0]];
 line(p,1.9);ell(.29,0,.17,.105,1.5);ell(.51,0,.19,.14,1.3);ell(.73,.02,.20,.17,1.3);eye(.77,.01,.10,.065);for(let j=0;j<14;j++){let u=j/13;line([[.36+u*.35,-.09],[.39+u*.38,-.22],[.52+u*.26,-.36]],.78);line([[.36+u*.35,.11],[.39+u*.38,.24],[.52+u*.26,.39]],.78);}for(let j=0;j<3;j++){let x=.32+j*.17;line([[x,.12],[x-.08,.29],[x-.01,.46]],1.2);line([[x,-.12],[x-.08,-.29],[x-.01,-.46]],1.2);}port(.96,.06,.2);port(.52,.43,1.3);port(.54,-.42,-1.2);break;}
 }
 // A small share of stippled ink along one existing contour, no random scatter across the page.
 const base=ops[0]?.p||[];for(let j=0;j<Math.min(20,base.length);j++){let q=base[Math.floor(random()*base.length)];if(q){let u=[q[0]+R(-2,2),q[1]+R(-2,2)];ops.push({p:[u,[u[0]+.22,u[1]+.18]],w:R(.65,1.5),c:C,phase:R(0,TAU),len:.28});}}
 return {ops,ports,type};
}
function create(canvas,seed=(Math.random()*4294967295)>>>0,options={}){
 canvas.width=canvas.height=N;const ctx=canvas.getContext("2d",{alpha:false});let R,frame,grid,ports,queues,history,lastPlan,plans,edits,serial,originSeed,stats,marks,active;
 const G=100,CELL=N/G;const pick=(a)=>a[Math.floor(R()*a.length)],between=(a,b)=>a+(b-a)*R();
 function bg(){ctx.fillStyle=PAPER;ctx.fillRect(0,0,N,N);let im=ctx.getImageData(0,0,N,N),d=im.data,s=827;for(let y=0;y<N;y++)for(let x=0;x<N;x++){s=(Math.imul(s,1664525)+1013904223)>>>0;let z=((s>>>24)/255-.5)*10+2.3*Math.sin(x*.019+y*.013)+1.8*Math.cos(x*.041-y*.036),i=(y*N+x)*4;for(let k=0;k<3;k++)d[i+k]=clamp(d[i+k]+z,0,255);}ctx.putImageData(im,0,0);}
 function at(x,y){let ix=Math.floor(x/CELL),iy=Math.floor(y/CELL);if(ix<0||ix>=G||iy<0||iy>=G)return 1;return grid[iy*G+ix];}
 function mark(x,y,w,white){let ix=Math.floor(x/CELL),iy=Math.floor(y/CELL);if(ix<0||ix>=G||iy<0||iy>=G)return;let i=iy*G+ix;grid[i]=clamp(grid[i]+(white?-1:1)*Math.min(.42,w*.047),0,1);}
 function paint(o,from,to){let p=o.p,n=p.length-1,a=Math.floor(from*n),b=Math.min(n,Math.floor(to*n));if(a>=b)return;ctx.strokeStyle=o.c;ctx.lineCap="round";ctx.lineJoin="round";for(let i=a;i<b;){let j=Math.min(b,i+4),u=(i+j)*.5/n,w=o.w*(.76+.24*Math.sin(Math.PI*u)+.13*Math.sin(i*.61+o.phase));ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(...p[i]);for(let k=i+1;k<=j;k++){ctx.lineTo(...p[k]);let len=Math.hypot(p[k][0]-p[k-1][0],p[k][1]-p[k-1][1]),steps=Math.max(1,Math.ceil(len/5));for(let l=1;l<=steps;l++)mark(p[k-1][0]+(p[k][0]-p[k-1][0])*l/steps,p[k-1][1]+(p[k][1]-p[k-1][1])*l/steps,w,o.c===ERASE);}ctx.stroke();i=j;}}
 function density(x,y,rad=35){let d=0,n=0;for(let j=-rad;j<=rad;j+=10)for(let i=-rad;i<=rad;i+=10){if(i*i+j*j<=rad*rad){d+=at(x+i,y+j);n++;}}return d/n;}
 function globalDensity(){let sum=0;for(const v of grid)sum+=v;return sum/grid.length;}
 function addPorts(m){for(const p of m.ports){if(p.p[0]<45||p.p[0]>955||p.p[1]<45||p.p[1]>955)continue;ports.push({...p,age:frame,uses:0,id:serial++});}if(ports.length>180)ports=ports.slice(-180);}
 function enqueue(m,instant=false){if(instant){for(const o of m.ops)paint(o,0,1);addPorts(m);return;}let speed=between(.8,1.5),gap=between(.8,1.8),t=0;let items=m.ops.map(o=>{let start=t;t+=gap*between(.65,1.35);return {o,start:Math.floor(start),dur:Math.max(1,Math.min(8,Math.ceil(o.len/(between(15,36)*speed)))),last:0};});queues.push({m,items,cursor:0,live:[],age:0});}
 function candidate(port,type,a,L,white=false){let width=spread[type],d=0,n=0,edge=0,whiteSupport=0,near=0;for(let u=.20;u<=1.0;u+=.16)for(let v=-width;v<=width+.01;v+=width/2){if((u-.56)*(u-.56)/.32+v*v/(width*width) >1.3)continue;let x=port.p[0]+L*(u*Math.cos(a)-v*Math.sin(a)),y=port.p[1]+L*(u*Math.sin(a)+v*Math.cos(a));if(x<38||x>962||y<38||y>962)edge++;let o=at(x,y);d+=o;n++;if(o>.36)whiteSupport++;if(u<.4)near+=o;}
 let occupancy=d/Math.max(1,n),cx=port.p[0]+.55*L*Math.cos(a),cy=port.p[1]+.55*L*Math.sin(a);
 let central=Math.hypot(cx-500,cy-500)/650,proximity=queues.reduce((sum,q)=>sum+(Math.hypot(cx-q.cx,cy-q.cy)<(L+q.L)*.47?1:0),0);
 let recent=history.slice(-7).filter(x=>x===type).length;
 let score=white?whiteSupport/n*2.3+occupancy*.8:1.7*(1-occupancy)-Math.max(0,occupancy-.23)*2.8;
 score+=.25*(1-central)+R()*.68-.85*edge-1.25*proximity-.36*recent-.20*port.uses;
 if(port.type===type)score-=.4;
 if(white&&occupancy<.22)score-=2;
 return {port,type,a,L,white,score,cx,cy,occupancy};}
 function plan(){if(queues.length>=3||!ports.length)return;let best=null,coverage=globalDensity(),wantWhite=coverage>.23?R()<.65:R()<.22;for(let i=0;i<110;i++){let p=pick(ports);if(p.uses>=4||density(...p.p,20)<.012)continue;let type=pick(grammar[p.type]||Object.keys(grammar));let white=wantWhite&&R()<.72;let a=p.a+between(-1.1,1.1)+(white?Math.PI+between(-.4,.4):0),L=white?between(55,130):between(75,215);let c=candidate(p,type,a,L,white);if(c.score>(best?.score??-Infinity))best=c;}
 if(!best||best.score<-.4){ // Re-open a crowded area, using a handful of opaque correction strokes, never a canvas reset.
 let p=ports.reduce((a,b)=>density(...a.p,45)>density(...b.p,45)?a:b),x=p.p[0],y=p.p[1],a=between(0,TAU),L=between(26,62),ops=[];
 for(let j=0;j<12;j++){let o=(j-5.5)*3,dx=Math.cos(a),dy=Math.sin(a);ops.push({p:[[x-dx*L*.5-dy*o,y-dy*L*.5+dx*o],[x+dx*L*.45-dy*o,y+dy*L*.45+dx*o]],w:between(3,6),c:ERASE,phase:between(0,TAU),len:L});}
 enqueue({ops,ports:[{p:[x,y],a:a+Math.PI*.5,type:"fold"}],type:"correction"});Object.assign(queues[queues.length-1],{cx:x,cy:y,L:70});edits++;lastPlan="correction";return;}
 best.port.uses++;let m=makeMotif(best.type,best.port.p,best.a,best.L,(R()*4294967295)>>>0,best.white);enqueue(m);Object.assign(queues[queues.length-1],{cx:best.cx,cy:best.cy,L:best.L});history.push(best.type);if(history.length>40)history.shift();plans++;if(best.white)edits++;lastPlan=(best.white?"white ":"")+best.port.type+" → "+best.type;}
 function reset(s=originSeed){originSeed=s>>>0;R=rng(originSeed);frame=0;grid=new Float32Array(G*G);ports=[];queues=[];history=[];plans=edits=serial=marks=0;lastPlan="initial composition";bg();
 // Three linked founding forms, different orientation, scale and family for each seed.
 const a=between(-.52,.52),kind=pick(["profile","mask","bird"]),L=between(360,465),p=[between(220,285),between(470,560)];let first=makeMotif(kind,p,a,L,(R()*4294967295)>>>0);enqueue(first,true);history.push(kind);
 for(let j=0;j<3;j++){let best=null;for(let k=0;k<50;k++){let p=pick(ports),type=pick(grammar[p.type]),a=p.a+between(-.9,.9),L=between(125,245),c=candidate(p,type,a,L,false);if(c.score>(best?.score??-Infinity))best=c;}if(best){let m=makeMotif(best.type,best.port.p,best.a,best.L,(R()*4294967295)>>>0);enqueue(m,true);best.port.uses++;history.push(best.type);}}
 plan();}
 function step(){frame++;if(frame%11===0&&queues.length<3)plan();for(const q of queues){q.age++;while(q.cursor<q.items.length&&q.items[q.cursor].start<=q.age){q.live.push(q.items[q.cursor++]);}for(const x of q.live){let f=clamp((q.age-x.start)/x.dur,0,1);paint(x.o,x.last,f);x.last=f;if(f===1)marks++;}q.live=q.live.filter(x=>x.last<1);}
 let done=queues.filter(q=>q.cursor===q.items.length&&!q.live.length);for(const q of done)addPorts(q.m);queues=queues.filter(q=>q.cursor<q.items.length||q.live.length);return true;}
 reset(seed);return {step,reset,get frame(){return frame},get seconds(){return frame/FPS},get finished(){return false},get seed(){return originSeed},get stats(){return {plans,edits,marks,ports:ports.length,active:queues.length,coverage:globalDensity(),lastPlan,history:history.slice()}}};
}
root.Palimpsest003={create,makeMotif,FPS,SIZE:N};
})(globalThis);