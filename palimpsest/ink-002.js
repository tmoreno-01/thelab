/* PALIMPSEST 002: incremental ink, not animated image masks. */
(function(root){
"use strict";
const SIZE=1000,FPS=12,DURATION=43,BLACK="#191815",PAPER="#eeeae0",WHITE="#f0ede5";
function makeScore(seed=7319){
 let s=seed>>>0;const r=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296),R=(a,b)=>a+(b-a)*r();
 const ops=[]; let group=[];
 const TAU=Math.PI*2;
 function spline(p){if(p.length<3)return p;const q=[p[0],...p,p[p.length-1]],out=[];for(let k=0;k<p.length-1;k++){const [a,b,c,d]=q.slice(k,k+4),n=Math.max(4,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/3));for(let j=0;j<n;j++){const t=j/n,t2=t*t,t3=t2*t;out.push([0,1].map(i=>.5*(2*b[i]+(-a[i]+c[i])*t+(2*a[i]-5*b[i]+4*c[i]-d[i])*t2+(-a[i]+3*b[i]-3*c[i]+d[i])*t3)));}}out.push(p[p.length-1]);return out;}
 function stroke(p,w=1.3,c=BLACK,rough=.45,smooth=true){let a=smooth?spline(p):p;let length=0;for(let i=1;i<a.length;i++)length+=Math.hypot(a[i][0]-a[i-1][0],a[i][1]-a[i-1][1]);if(length<.1)return; // fixed physical mark, pressure recorded once
 let phase=R(0,TAU);a=a.map(([x,y],i)=>[x+Math.sin(i*1.87+phase)*rough+R(-rough*.3,rough*.3),y+Math.cos(i*1.33+phase)*rough+R(-rough*.3,rough*.3)]);
 group.push({p:a,w,c,len:length,phase});}
 function dot(x,y,w=2,c=BLACK){stroke([[x,y],[x+.35,y+.3]],w,c,.15,false);}
 function ellipse(x,y,rx,ry,rot=0,w=1.3,c=BLACK,from=0,to=TAU){const p=[];let n=Math.max(24,Math.ceil(Math.max(rx,ry)*Math.abs(to-from)/3));for(let i=0;i<=n;i++){let a=from+(to-from)*i/n,f=1+.025*Math.sin(a*7+x*.04)+.012*Math.sin(a*13+y);let xx=rx*f*Math.cos(a),yy=ry*f*Math.sin(a);p.push([x+xx*Math.cos(rot)-yy*Math.sin(rot),y+xx*Math.sin(rot)+yy*Math.cos(rot)]);}stroke(p,w,c,.35,false);}
 function schedule(start,end,shuffle=false){if(!group.length)return;const g=group;group=[];if(shuffle){for(let i=g.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[g[i],g[j]]=[g[j],g[i]];}}g.forEach((o,i)=>{const t=start+(end-start)*i/g.length+R(0,.055);const dur=start<0?0:Math.max(.085,Math.min(.65,o.len/R(220,500)));ops.push({...o,t:Math.max(start,t),dur});});}
 function hatch(poly,spacing,angle,w=.8,c=BLACK){const dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx;const v=poly.map(p=>p[0]*nx+p[1]*ny),lo=Math.min(...v),hi=Math.max(...v);
 for(let d=lo+R(0,spacing);d<hi;d+=spacing*R(.82,1.18)){const cuts=[];for(let k=0;k<poly.length;k++){const a=poly[k],b=poly[(k+1)%poly.length],u=a[0]*nx+a[1]*ny,z=b[0]*nx+b[1]*ny;if((u<=d&&z>d)||(z<=d&&u>d)){let f=(d-u)/(z-u);cuts.push((a[0]+f*(b[0]-a[0]))*dx+(a[1]+f*(b[1]-a[1]))*dy);}}cuts.sort((a,b)=>a-b);for(let i=0;i+1<cuts.length;i+=2){let a=cuts[i]+R(.2,1.5),b=cuts[i+1]-R(.2,1.5);if(b-a<1)continue;let p=t=>[dx*t+nx*d,dy*t+ny*d];let m=p((a+b)/2);m[0]+=nx*R(-2,2);m[1]+=ny*R(-2,2);stroke([p(a),m,p(b)],w*R(.65,1.3),c,.4);}}}
 function solid(poly,c=BLACK,width=7,angle=.22){hatch(poly,width*.55,angle,width,c);}
 function stipple(poly,count,c=BLACK){const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);function inside(x,y){let b=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!=(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)b=!b;}return b;}for(let i=0,k=0;i<count&&k<count*10;k++){let x=R(Math.min(...xs),Math.max(...xs)),y=R(Math.min(...ys),Math.max(...ys));if(inside(x,y)){dot(x,y,R(.6,2),c);i++;}}}
 function eye(x,y,rx,ry,rot=0,c=BLACK,bg=WHITE){
  const tr=([u,v])=>[x+u*rx*Math.cos(rot)-v*ry*Math.sin(rot),y+u*rx*Math.sin(rot)+v*ry*Math.cos(rot)];
  const top=[[-1,0],[-.68,-.54],[-.12,-.86],[.45,-.7],[1,.08]],bottom=[[1,.08],[.54,.50],[-.05,.64],[-.64,.40],[-1,0]];
  stroke(top.map(tr),2.5,c);stroke(bottom.map(tr),1.6,c);
  for(let i=0;i<4;i++)stroke(top.map(([a,b])=>tr([a,b-.13-i*.09])),.7,c);
  const iris=Math.min(rx*.36,ry*.72);ellipse(x+rx*.13,y,iris,iris,0,1.1,c);
  solid(Array.from({length:22},(_,i)=>[x+rx*.13+iris*.37*Math.cos(i*TAU/22),y+iris*.37*Math.sin(i*TAU/22)]),c,3,.35);
  for(let i=0;i<55;i++){let a=i*TAU/55+R(-.025,.025);let v=[Math.cos(a),Math.sin(a)];stroke([[x+rx*.13+v[0]*iris*R(.42,.61),y+v[1]*iris*.44],[x+rx*.13+v[0]*iris*.94,y+v[1]*iris*.94]],.65,c,.25,false);}
  dot(x+rx*.13-iris*.15,y-iris*.19,Math.max(1.7,iris*.18),bg);
  for(let i=0;i<18;i++){let a=-1+2*i/17,b=-.75*Math.sqrt(Math.max(0,1-a*a));stroke([tr([a,b]),tr([a+.05*a,b-R(.12,.28)])],.85,c,.28,false);}
 }
 function frond(x,y,a,L,depth,c=BLACK){
  let bend=R(-.52,.52),p=[];for(let i=0;i<=20;i++){let u=i/20;p.push([x+L*u*Math.cos(a+bend*u),y+L*u*Math.sin(a+bend*u)]);}stroke(p,depth*.68+.6,c,.6,false);
  if(depth>0)for(let j=0;j<4;j++){let u=.32+j*.20;let q=p[Math.round(u*20)];let aa=a+bend*u+(j%2?1:-1)*R(.36,.87);frond(q[0],q[1],aa,L*R(.38,.53),depth-1,c);}
  else{const e=p[p.length-1],u=[Math.cos(a+bend),Math.sin(a+bend)],n=[-u[1],u[0]],l=L*.35;stroke([e,[e[0]+u[0]*l+n[0]*l*.36,e[1]+u[1]*l+n[1]*l*.36],[e[0]+u[0]*l*1.7,e[1]+u[1]*l*1.7],[e[0]+u[0]*l-n[0]*l*.36,e[1]+u[1]*l-n[1]*l*.36],e],.85,c);}
 }
 function building(x,y,w,h,skew=15,c=BLACK){
  const roof=[[x,y],[x+w*.60,y-skew],[x+w,y-skew*.38],[x+w*.43,y+skew*.64],[x,y]];
  stroke(roof,1.7,c);stroke([[x,y],[x,y+h],[x+w*.43,y+h+skew*.64],[x+w,y+h-skew*.38],[x+w,y-skew*.38]],1.6,c);stroke([[x+w*.43,y+skew*.64],[x+w*.43,y+h+skew*.64]],1.6,c);
  for(let yy=y+12;yy<y+h-5;yy+=R(13,19)){
   stroke([[x,yy],[x+w*.43,yy+skew*.64],[x+w,yy-skew*.38]],.75,c,.35,false);
   for(let i=0;i<2;i++){let xx=x+5+i*w*.19;let q=yy+(xx-x)*skew*.64/(w*.43);stroke([[xx,q+2],[xx,q+10],[xx+w*.10,q+11],[xx+w*.10,q+3],[xx,q+2]],1.05,c,.3,false);stroke([[xx+2,q+4],[xx+2,q+8]],2.7,c,.2,false);}
  }
  hatch([[x+w*.43,y+skew*.64],[x+w,y-skew*.38],[x+w,y+h-skew*.38],[x+w*.43,y+h+skew*.64]],4,1.15,.75,c);
 }
 // The initial page: an incomplete engraved profile, paper texture separate.
 const outline=[[282,803],[326,721],[352,664],[334,600],[302,539],[289,460],[299,378],[327,305],[383,239],[453,205],[527,200],[593,218],[633,252],[649,293],[643,330],[669,376],[696,400],[709,417],[688,432],[665,435],[668,459],[687,477],[668,490],[680,510],[661,540],[618,562],[581,568],[568,623],[584,695],[639,781],[705,836]];
 stroke(outline,2.8);
 for(let i=0;i<9;i++){let a=i*5;stroke([[316+a,483],[315+a,408],[334+a,344],[378+a,280],[434+a,248],[486+a,238]],.9);}
 stroke([[457,825],[423,745],[419,676],[434,609],[465,568],[495,537]],1.7);
 stroke([[382,807],[383,753],[396,696],[395,630],[365,575]],1.8);
 stroke([[561,799],[529,724],[521,644],[548,588],[581,569]],1.5);
 eye(590,365,45,25,-.08);
 stroke([[553,332],[577,319],[608,324],[632,339]],3.4);
 stroke([[637,344],[631,375],[648,405],[676,418],[686,422]],1.5);
 stroke([[647,455],[664,465],[678,477],[654,478],[637,481]],1.6);
 stroke([[633,490],[654,497],[671,504],[657,520],[637,529]],1.2);
 stroke([[611,556],[583,553],[562,539],[547,521]],1.4);
 stroke([[408,448],[395,429],[400,397],[425,384],[450,398],[446,430],[425,467],[412,451],[425,425],[414,413]],2.2);
 for(let i=0;i<19;i++){let u=i/18;stroke([[441+u*10,473],[478+u*10,495],[523+u*9,501],[551+u*8,484]],.85);}
 hatch([[322,367],[388,316],[379,400],[371,480],[393,548],[426,588],[397,648],[352,608],[319,545],[302,466]],4,1.23,.95);
 hatch([[537,404],[572,395],[611,409],[633,448],[618,465],[581,455],[548,437]],4.5,.65,.83);
 hatch([[530,568],[567,572],[555,625],[572,700],[608,760],[553,752],[516,684],[505,628]],4,1.16,.9);
 stipple([[478,310],[548,280],[612,305],[628,321],[578,315],[545,352],[509,382],[468,371]],230);
 // A torn, dark arch and roots around the portrait, with reserved breathing room.
 const hair=[[304,416],[280,358],[294,285],[349,209],[430,158],[520,144],[590,165],[641,211],[624,244],[579,220],[523,212],[452,226],[398,267],[357,334],[337,406],[329,474],[300,496]];
 solid(hair,BLACK,7,1.16);
 for(let i=0;i<27;i++){let u=i/26;stroke([[296+u*33,422],[306+u*31,340],[360+u*36,246],[437+u*38,187],[513+u*28,170],[587+u*21,190]],R(.55,1.2),WHITE,.5);}
 for(let i=0;i<9;i++){let u=i/8;frond(322+u*98,722+u*48,2.3+u*.4,100+R(0,65),2);}
 for(let i=0;i<6;i++){let u=i/5;frond(398+u*95,193-u*12,-1.9+u*.65,R(64,123),1);}
 for(let i=0;i<28;i++){let u=i/27;stroke([[282-u*23,804+u*2],[344+u*12,833+u*2],[430+u*8,854+u*1],[538+u*6,853+u*2],[634+u*11,844+u*3]],.7);}
 // Fine background marginalia, irregular clusters not a tiled texture.
 for(const [x,y,a] of [[177,300,1.3],[790,626,2.8],[201,666,-1.5],[729,164,.4]]){
  for(let i=0;i<14;i++){let u=i*3;stroke([[x+u*Math.cos(a),y+u*Math.sin(a)],[x+u*Math.cos(a)+R(10,35),y+u*Math.sin(a)+R(-20,20)]],.7);}
 }
 schedule(-2,-1);
 // 00–08: Existing brow grows into a staircase and tower; foundations drawn one by one.
 for(let i=0;i<18;i++){let x=412+i*9,y=274-i*5;stroke([[x,y],[x+13,y+4],[x+13,y-7],[x+23,y-4]],1.4,BLACK,.5,false);}
 for(let j=0;j<3;j++)building(475+j*42,216-j*26,43+j*9,85+j*12,13);
 building(614,168,42,100,13);
 stroke([[459,289],[479,300],[521,288],[557,274],[592,253],[631,250]],2.1);
 for(let i=0;i<26;i++){let u=i/25;stroke([[461+u*160,291-u*42],[463+u*160,301-u*42]],.9);}
 for(let i=0;i<7;i++){let x=455+i*24;stroke([[x,279],[x,261],[x+7,254],[x+13,261],[x+13,274]],.9);}
 schedule(.1,7.7);
 // 07–16: the same nose line is extended into a bird's head; no image replacement.
 stroke([[643,331],[667,307],[704,293],[749,303],[774,325],[788,356],[814,371],[862,380],[824,392],[795,398],[763,420],[730,447],[687,432]],2.6);
 stroke([[790,357],[806,374],[862,380],[817,383],[795,389]],1.5);
 stroke([[762,421],[779,438],[793,467],[777,503],[744,528],[712,554],[687,603],[665,660],[630,705]],2.2);
 eye(748,347,29,20,.13);
 for(let j=0;j<26;j++){let u=j/25;stroke([[687+u*32,315],[692+u*40,329],[707+u*44,338],[718+u*41,338]],.8);}
 for(let j=0;j<31;j++){let u=j/30;stroke([[773+u*10,432+u*17],[745+u*12,463+u*70],[694+u*16,522+u*92],[660+u*25,604+u*73]],R(.75,1.25));}
 hatch([[779,400],[802,395],[775,434],[746,454],[708,445],[689,435]],3,.9,.85);
 stipple([[715,306],[752,309],[776,329],[774,344],[762,324],[728,323]],105);
 schedule(7.2,15.6);
 // 13–22: wing grows out of shoulder contours, individual barbs laid down along shafts.
 for(let j=0;j<13;j++){let u=j/12,x=635+u*27,y=704-u*63;let e=[790+u*53,782-u*200];let mid=[720+u*75,755-u*145];
 stroke([[x,y],mid,e,[e[0]-8,e[1]+22],[mid[0]-13,mid[1]+17],[x,y]],1.5);
 for(let k=1;k<=11;k++){let f=k/12;let p=[x+(e[0]-x)*f,y+(e[1]-y)*f];stroke([p,[p[0]-15-u*9,p[1]+14+u*4]],.77);}
 }
 schedule(13.8,22.6);
 // 17–25: black ink consumes the cheek via individually visible brush gestures.
 const voidPoly=[[356,484],[398,455],[451,470],[489,504],[513,548],[511,592],[484,626],[446,646],[399,625],[363,581],[341,535]];
 solid(voidPoly,BLACK,10,.82);
 schedule(17.6,25.1);
 // 24–32: an eye and second profile are cut back out of the ink in correction-fluid strokes.
 stroke([[389,604],[402,580],[404,554],[389,535],[403,517],[427,508],[456,514],[473,531],[477,550],[495,563],[480,570],[475,587],[460,603],[442,606],[438,625]],2.5,WHITE);
 eye(449,548,24,15,-.2,WHITE,BLACK);
 stroke([[469,579],[480,582],[469,590],[459,590]],1.3,WHITE);
 for(let i=0;i<22;i++){let u=i/21;stroke([[369+u*20,509+u*4],[374+u*22,535+u*4],[385+u*15,563+u*9],[400+u*9,589+u*10]],.8,WHITE);}
 for(let i=0;i<14;i++){let u=i/13;stroke([[445+u*7,607],[453+u*13,617],[464+u*14,622]],.8,WHITE);}
 for(let i=0;i<65;i++){let a=R(.7,2.1),x=R(379,478),y=R(485,506);stroke([[x,y],[x+Math.cos(a)*R(3,7),y+Math.sin(a)*R(3,7)]],.7,WHITE,.3,false);}
 schedule(24.3,32.0);
 // 29–39: architecture becomes a botanical structure, old tower edges become roots.
 for(let i=0;i<6;i++){let x=482+i*29,y=210-i*5;frond(x,y,-1.8+i*.12,78+i*5,2);}
 for(let i=0;i<19;i++){let u=i/18;stroke([[514+u*46,187],[502+u*55,157],[518+u*61,129],[534+u*55,112]],.83);}
 for(let j=0;j<4;j++){const x=185+j*27,y=435+j*28;frond(x,y,-1.1+j*.19,80,2);}
 schedule(29.0,38.8);
 // 36–43: remaining marks make the portrait, wing and architecture read as one page.
 for(let i=0;i<32;i++){let u=i/31;stroke([[582+u*36,704],[572+u*58,742],[609+u*55,788],[660+u*45,817]],.83);}
 for(let i=0;i<24;i++){let u=i/23;stroke([[314+u*17,689],[303+u*15,733],[283+u*33,773]],.9);}
 stipple([[580,576],[613,567],[647,553],[663,580],[633,621],[598,646],[575,622]],125);
 schedule(36.0,42.4,true);
 return ops.sort((a,b)=>a.t-b.t);
}
function paper(ctx){const n=SIZE;ctx.fillStyle=PAPER;ctx.fillRect(0,0,n,n);const im=ctx.getImageData(0,0,n,n),d=im.data;let s=483;for(let y=0;y<n;y++)for(let x=0;x<n;x++){s=(Math.imul(s,1664525)+1013904223)>>>0;let p=(y*n+x)*4,v=((s>>>24)/255-.5)*12+2.7*Math.sin(x*.017+y*.013)+2*Math.cos(x*.043-y*.038);for(let k=0;k<3;k++)d[p+k]=Math.max(0,Math.min(255,d[p+k]+v));}ctx.putImageData(im,0,0);}
function paint(ctx,o,from,to){const p=o.p,n=p.length-1;if(n<1)return;const a=Math.floor(from*n),b=Math.min(n,Math.floor(to*n));if(b<=a)return;ctx.strokeStyle=o.c;ctx.lineCap="round";ctx.lineJoin="round"; // pressure along the actual path
 for(let i=a;i<b;){let end=Math.min(b,i+4),u=(i+end)*.5/n;ctx.lineWidth=o.w*(.76+.24*Math.sin(Math.PI*u)+.14*Math.sin(i*.61+o.phase));ctx.beginPath();ctx.moveTo(p[i][0],p[i][1]);for(let j=i+1;j<=end;j++)ctx.lineTo(p[j][0],p[j][1]);ctx.stroke();i=end;}
}
function create(canvas,seed=7319){canvas.width=canvas.height=SIZE;const ctx=canvas.getContext("2d",{alpha:false});let ops=makeScore(seed),cursor=0,active=[],frame=0;function reset(next=seed){seed=next;ops=makeScore(seed);cursor=0;active=[];frame=0;paper(ctx);while(cursor<ops.length&&ops[cursor].t<0)paint(ctx,ops[cursor++],0,1);}
 function step(){if(frame>=DURATION*FPS)return false;frame++;const t=frame/FPS;while(cursor<ops.length&&ops[cursor].t<=t){active.push({o:ops[cursor++],last:0});}
 for(const a of active){const f=Math.max(0,Math.min(1,(t-a.o.t)/a.o.dur));paint(ctx,a.o,a.last,f);a.last=f;}active=active.filter(a=>a.last<1);return true;}
 reset();return {step,reset,get frame(){return frame},get seconds(){return frame/FPS},get finished(){return frame>=DURATION*FPS}};
}
root.Palimpsest002={makeScore,create,SIZE,FPS,DURATION};
})(globalThis);