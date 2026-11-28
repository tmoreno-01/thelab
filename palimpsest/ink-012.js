/* PALIMPSEST 012 — The Unfamiliar Specimen */
(function(root){
"use strict";
const N=960,H=720,FPS=24,INK="#282722",MID="#817b70",PALE="#c9c1b5",PAPER="#f0ece3",TEAL="#668f88",TEALPALE="#a8beb4",KEY="lifeafterlogic.palimpsest.012.specimens.v2";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
function rng(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
function fmt(v){return Number(v.toFixed(1));}
function pathData(p,smooth=false,closed=false){
 if(!p.length)return "";
 if(!smooth){let d="M"+fmt(p[0][0])+" "+fmt(p[0][1]);for(let i=1;i<p.length;i++)d+=" L"+fmt(p[i][0])+" "+fmt(p[i][1]);if(closed)d+=" Z";return d;}
 if(closed){let a=p[p.length-1],b=p[0],d="M"+fmt((a[0]+b[0])/2)+" "+fmt((a[1]+b[1])/2);for(let i=0;i<p.length;i++){let q=p[i],n=p[(i+1)%p.length];d+=" Q"+fmt(q[0])+" "+fmt(q[1])+" "+fmt((q[0]+n[0])/2)+" "+fmt((q[1]+n[1])/2);}return d+" Z";}
 let d="M"+fmt(p[0][0])+" "+fmt(p[0][1]);for(let i=1;i<p.length-1;i++)d+=" Q"+fmt(p[i][0])+" "+fmt(p[i][1])+" "+fmt((p[i][0]+p[i+1][0])/2)+" "+fmt((p[i][1]+p[i+1][1])/2);let z=p[p.length-1];return d+" L"+fmt(z[0])+" "+fmt(z[1]);
}
function blob(cx,cy,rx,ry,phase,lobes,rough,rotation){
 const p=[];for(let i=0;i<88;i++){const t=i/88*Math.PI*2,a=t+rotation,r=1+rough*.52*Math.sin(lobes*t+phase)+rough*.25*Math.sin((lobes+3)*t-phase*1.7)+rough*.16*Math.sin(3*t+phase*.8);p.push([cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r]);}return p;
}
function shift(p,x,y){return p.map(q=>[q[0]+x,q[1]+y]);}
function scale(p,cx,cy,sx,sy=sx,dx=0,dy=0){return p.map(q=>[cx+(q[0]-cx)*sx+dx,cy+(q[1]-cy)*sy+dy]);}
function path(d,w=1,c=INK,o=1,fill="none",extra=""){return '<path d="'+d+'" fill="'+fill+'" stroke="'+c+'" stroke-width="'+w+'" opacity="'+o+'" stroke-linecap="round" stroke-linejoin="round" '+extra+'/>';}
function line(x1,y1,x2,y2,w=1,c=INK,o=1,extra=""){return path("M"+fmt(x1)+" "+fmt(y1)+" L"+fmt(x2)+" "+fmt(y2),w,c,o,"none",extra);}
function ellipse(x,y,rx,ry,w=1,c=INK,o=1,fill="none",extra=""){return '<ellipse cx="'+fmt(x)+'" cy="'+fmt(y)+'" rx="'+fmt(rx)+'" ry="'+fmt(ry)+'" fill="'+fill+'" stroke="'+c+'" stroke-width="'+w+'" opacity="'+o+'" '+extra+'/>';}
function circle(x,y,r,fill=INK,o=1,stroke="none",sw=0){return '<circle cx="'+fmt(x)+'" cy="'+fmt(y)+'" r="'+fmt(r)+'" fill="'+fill+'" opacity="'+o+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';}
function svg(inner,defs=""){return '<svg xmlns="http://www.w3.org/2000/svg" width="'+N+'" height="'+H+'" viewBox="0 0 '+N+' '+H+'"><defs>'+defs+'</defs>'+inner+'</svg>';}
function baseRegion(p,id){
 const d=pathData(p,true,true),shadow=pathData(shift(p,7,8),true,true),inner=pathData(scale(p,(p.reduce((a,q)=>a+q[0],0)/p.length),(p.reduce((a,q)=>a+q[1],0)/p.length),.965,.955,-2,-2),true,true);
 return '<path d="'+shadow+'" fill="#b9b1a5" opacity=".30" stroke="#b9b1a5" stroke-width="1"/><path d="'+d+'" fill="#f4f0e8" stroke="'+INK+'" stroke-width="2.5" stroke-linejoin="round"/><path d="'+inner+'" fill="none" stroke="'+MID+'" stroke-width=".65" opacity=".72"/>';
}
function regionClip(id,p){return '<clipPath id="'+id+'"><path d="'+pathData(p,true,true)+'"/></clipPath>';}
function clip(id,s){return '<g clip-path="url(#'+id+')">'+s+'</g>';}
function leaf(x,y,angle,len,w){
 const ex=x+Math.cos(angle)*len,ey=y+Math.sin(angle)*len,px=-Math.sin(angle)*w,py=Math.cos(angle)*w;
 const p="M"+fmt(x)+" "+fmt(y)+" Q"+fmt(x+Math.cos(angle)*len*.28+px)+" "+fmt(y+Math.sin(angle)*len*.28+py)+" "+fmt(ex)+" "+fmt(ey)+" Q"+fmt(x+Math.cos(angle)*len*.7-px)+" "+fmt(y+Math.sin(angle)*len*.7-py)+" "+fmt(x)+" "+fmt(y)+" Z";
 return '<path d="'+p+'" fill="#e8e3d9" stroke="'+INK+'" stroke-width=".9"/>'+line(x,y,ex,ey,.55,MID,.8);
}
function hatch(cx,cy,w,h,angle,spacing,clipId,color=INK,opacity=.48){
 let s="",count=Math.ceil((w+h)/spacing),ca=Math.cos(angle),sa=Math.sin(angle);
 for(let i=-count;i<=count;i++){let off=i*spacing,x1=cx-ca*w*.65-sa*off,y1=cy-sa*w*.65+ca*off,x2=cx+ca*w*.65-sa*off,y2=cy+sa*w*.65+ca*off;if(Math.hypot(x2-x1,y2-y1)>w*1.4)continue;let bend=(i%3-1)*2.4,pts=[[x1,y1],[mix(x1,x2,.48)-sa*bend,mix(y1,y2,.48)+ca*bend],[x2,y2]];s+=path(pathData(pts,false,false),.55,color,opacity);}
 return clipId?clip(clipId,s):s;
}
function shellLayer(R,sp){
 const cx=sp.cx,cy=sp.cy,s=baseRegion(sp.p,"shell"),id="shellClip",inner=[];
 inner.push(hatch(cx-60,cy-60,92,70,-.65,5,id,INK,.35));
 for(let i=0;i<34;i++){const a=i/34*Math.PI*2+sp.phase*.13,ex=cx+Math.cos(a)*sp.rx*.91*(.94+.04*Math.sin(i*2)),ey=cy+Math.sin(a)*sp.ry*.91*(.94+.04*Math.cos(i*3)),bend=(R()-.5)*24,pts=[[cx+Math.cos(a)*10,cy+Math.sin(a)*8],[mix(cx,ex,.47)-Math.sin(a)*bend,mix(cy,ey,.47)+Math.cos(a)*bend],[ex,ey]];inner.push(path(pathData(pts,true,false),i%7===0?1.45:.72,i%9===0?TEAL:INK,i%7===0?.82:.62));}
 const spiral=[];for(let i=0;i<170;i++){const t=i/169*Math.PI*5.3,r=2+t*5.8;spiral.push([cx+Math.cos(t+sp.phase)*r,cy+Math.sin(t+sp.phase)*r*.82]);}
 inner.push(path(pathData(spiral,false,false),3.1,INK,.95),path(pathData(spiral.map((p,i)=>[p[0]+Math.sin(i*.07)*2.1,p[1]+Math.cos(i*.07)*2.1]),false,false),.75,MID,.8));
 for(let z=0;z<3;z++){const chamber=[];for(let i=0;i<92;i++){const t=i/91*Math.PI*(3.1+z*.24),r=3+t*(3.8+z*.7);chamber.push([cx+Math.cos(t+sp.phase+z*.42)*r+z*13,cy+Math.sin(t+sp.phase+z*.42)*r*.74-z*5]);}inner.push(path(pathData(chamber,false,false),z===0?1.15:.62,z===1?TEAL:MID,.76));}
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2+sp.phase,x=cx+Math.cos(a)*112,y=cy+Math.sin(a)*89;inner.push(path("M"+fmt(x)+" "+fmt(y)+" q"+fmt(-Math.sin(a)*9)+" "+fmt(Math.cos(a)*9)+" "+fmt(-Math.sin(a)*17)+" "+fmt(Math.cos(a)*17),.72,INK,.62));}
 inner.push(ellipse(cx+52,cy-18,48,31,.9,INK,.72,"none"),ellipse(cx+52,cy-18,33,20,.6,MID,.7,"none"));

 for(let i=0;i<24;i++){const a=i/24*Math.PI*2+sp.phase,rr=sp.rx*.79+(R()-.5)*12,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*sp.ry*.78,rx=R()<.3?5:3.2;inner.push(ellipse(x,y,rx,rx*1.7,.7,INK,.78,"none",'transform="rotate('+fmt(a*180/Math.PI)+' '+fmt(x)+' '+fmt(y)+')"'));}
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=cx+Math.cos(a)*sp.rx*.57,y=cy+Math.sin(a)*sp.ry*.57;inner.push(ellipse(x,y,4.5,7,.65,MID,.6,"none",'transform="rotate('+fmt(a*180/Math.PI)+' '+fmt(x)+' '+fmt(y)+')"'));}
 return svg(s+clip(id,inner.join("")),regionClip(id,sp.p));
}
function podLayer(R,sp){
 const id="podClip",s=baseRegion(sp.p,id),a=[],cx=sp.cx+3,cy=sp.cy-2;
 a.push(path(pathData(blob(cx,cy,108,72,sp.phase,5,.07,.08),true,true),1.05,MID,.8));
 a.push(ellipse(cx,cy,79,48,2.1,INK,.95,"#e9e4da"),ellipse(cx+2,cy,58,33,.9,MID,.9,"none"),ellipse(cx+2,cy,38,23,1.2,INK,.95,"none"));
 a.push(ellipse(cx+5,cy,19,18,1.4,INK,1,"#d0c9bd"),circle(cx+7,cy,10,INK,.95),circle(cx+3,cy-4,3,"#eee9df",.95));
 for(let i=0;i<30;i++){const t=i/30*Math.PI*2,x=cx+Math.cos(t)*88,y=cy+Math.sin(t)*56,len=R()<.22?14:7,ex=x+Math.cos(t)*len,ey=y+Math.sin(t)*len;a.push(line(x,y,ex,ey,i%5===0?1.15:.65,i%8===0?TEAL:INK,.72));}
 for(let k=0;k<3;k++){const x=cx+(k-1)*67+(R()-.5)*10,y=cy+67+(R()-.5)*8,rx=R()*8+7,ry=R()*4+5;a.push(ellipse(x,y,rx,ry,.9,INK,.8,"#e4dfd5"),ellipse(x,y,rx*.45,ry*.45,.65,MID,.75));}
 a.push(hatch(cx+90,cy-48,70,44,-.7,4,id,INK,.4));
 a.push(path("M"+fmt(cx-118)+" "+fmt(cy+8)+" C"+fmt(cx-80)+" "+fmt(cy-32)+" "+fmt(cx-42)+" "+fmt(cy-36)+" "+fmt(cx-16)+" "+fmt(cy-12),1.1,INK,.82));
 a.push(path("M"+fmt(cx+20)+" "+fmt(cy+16)+" Q"+fmt(cx+78)+" "+fmt(cy+62)+" "+fmt(cx+126)+" "+fmt(cy+4),.8,MID,.72));
 a.push(ellipse(cx-108,cy+8,20,13,1.05,INK,.8,"#e8e2d8"),ellipse(cx-108,cy+8,7,5,.6,TEAL,.8));
 a.push(ellipse(cx+112,cy+20,16,10,.85,INK,.76,"none"),ellipse(cx+112,cy+20,5,4,.55,INK,.8,"#d9d2c6"));
 for(let i=0;i<16;i++){const x=cx-125+i*16,y=cy+90+Math.sin(i*.65)*5;a.push(line(x,y,x+6,y-3,.55,MID,.6));}

 for(let i=0;i<18;i++){const x=cx-105+R()*210,y=cy-85+R()*170;if(R()<.48)a.push(circle(x,y,R()*1.2+.4,INK,.52));}
 return svg(s+clip(id,a.join("")),regionClip(id,sp.p));
}
function cuboid(x,y,w,h,d,R){
 const skew=d*.65,top="M"+fmt(x)+" "+fmt(y-h)+" l"+fmt(skew)+" "+fmt(-d*.42)+" l"+fmt(w)+" 0 l"+fmt(-skew)+" "+fmt(d*.42)+" Z";
 const side="M"+fmt(x+w)+" "+fmt(y-h)+" l"+fmt(skew)+" "+fmt(-d*.42)+" v"+fmt(h)+" l"+fmt(-skew)+" "+fmt(d*.42)+" Z";
 const front="M"+fmt(x)+" "+fmt(y-h)+" h"+fmt(w)+" v"+fmt(h)+" h"+fmt(-w)+" Z";
 let s=path(side,1.15,INK,.95,"#d1cabe")+path(top,1.15,INK,.95,"#f7f3ea")+path(front,1.25,INK,.98,"#e9e4da");
 const floors=Math.max(1,Math.floor(h/24)),cols=Math.max(1,Math.floor(w/18));
 for(let row=0;row<floors;row++)for(let col=0;col<cols;col++){if(R()<.13)continue;const ww=R()<.25?4.5:5.8,hh=R()<.25?7.5:9,xw=x+7+col*(w-14)/Math.max(1,cols-1),yw=y-h+12+row*(h-20)/Math.max(1,floors-1);s+='<rect x="'+fmt(xw)+'" y="'+fmt(yw)+'" width="'+fmt(ww)+'" height="'+fmt(hh)+'" fill="'+(R()<.22?TEAL:INK)+'" opacity="'+(R()<.2?.58:.92)+'"/>';}
 for(let i=0;i<Math.floor(w/22);i++)s+=line(x+8+i*18,y-h+5,x+8+i*18+4,y-h+5,.45,MID,.7);
 for(let i=0;i<Math.floor(w/26);i++){const xx=x+8+i*24;s+=line(xx,y-h+18,xx+3,y-h+18,1.1,INK,.72);if(R()<.5)s+=circle(xx+2,y-h+22,1.2,TEAL,.72);}

 return s;
}
function cityLayer(R,sp){
 const id="cityClip",s=baseRegion(sp.p,id),a=[],base=sp.cy+72;
 a.push(hatch(sp.cx-5,sp.cy+15,230,105,.58,5,id,INK,.24));
 const buildings=[
 [sp.cx-142,base,39,78,14],[sp.cx-94,base+5,48,112,17],[sp.cx-36,base+1,43,88,15],
 [sp.cx+16,base+7,55,132,19],[sp.cx+80,base+4,42,95,15],[sp.cx+130,base+12,36,69,13]
 ];
 for(let i=0;i<buildings.length;i++){const b=buildings[i];a.push(cuboid(b[0],b[1],b[2],b[3],b[4],R));}
 a.push(path("M"+fmt(sp.cx-150)+" "+fmt(base-45)+" Q"+fmt(sp.cx-20)+" "+fmt(base-62)+" "+fmt(sp.cx+145)+" "+fmt(base-40),3.2,INK,.95));
 a.push(path("M"+fmt(sp.cx-150)+" "+fmt(base-50)+" Q"+fmt(sp.cx-20)+" "+fmt(base-67)+" "+fmt(sp.cx+145)+" "+fmt(base-45),.7,MID,.85));
 for(let i=0;i<11;i++){const x=sp.cx-132+i*26,y=base-49+Math.sin(i*.8)*4;a.push(line(x,y-7,x,y+7,.8,INK,.85));}
 const low=[ [sp.cx-164,base+34,46,48,15],[sp.cx-111,base+40,38,55,13],[sp.cx-65,base+36,43,43,14],[sp.cx+48,base+38,47,58,15],[sp.cx+103,base+32,42,49,14] ];
 for(const b of low)a.push(cuboid(b[0],b[1],b[2],b[3],b[4],R));
 for(let i=0;i<7;i++){const x=sp.cx-132+i*43,y=base-5+Math.sin(i*.9)*5;a.push(path("M"+fmt(x)+" "+fmt(y)+" q18 -18 34 0",.85,INK,.72));}
 for(let i=0;i<8;i++){const x=sp.cx-150+i*42,y=base-126-R()*24;a.push(line(x,y,x+R()*4,y-18-R()*12,.8,INK,.8));a.push(circle(x+2,y-20,1.4,TEAL,.7));}

 for(let i=0;i<9;i++){const x=sp.cx-160+R()*320,y=sp.cy-110+R()*210;if(R()<.55)a.push(ellipse(x,y,R()*4+2,R()*7+3,.65,MID,.7));}
 a.push(path("M"+fmt(sp.cx-165)+" "+fmt(base+18)+" Q"+fmt(sp.cx-80)+" "+fmt(base+38)+" "+fmt(sp.cx-20)+" "+fmt(base+22)+" T"+fmt(sp.cx+160)+" "+fmt(base+27),1.1,INK,.75));
 return svg(s+clip(id,a.join("")),regionClip(id,sp.p));
}
function wingLayer(R,sp){
 const id="wingClip",s=baseRegion(sp.p,id),a=[],cx=sp.cx,cy=sp.cy;
 const left="M"+fmt(cx)+" "+fmt(cy+4)+" C"+fmt(cx-52)+" "+fmt(cy-73)+" "+fmt(cx-154)+" "+fmt(cy-93)+" "+fmt(cx-165)+" "+fmt(cy-23)+" C"+fmt(cx-176)+" "+fmt(cy+43)+" "+fmt(cx-92)+" "+fmt(cy+82)+" "+fmt(cx-8)+" "+fmt(cy+39)+" Z";
 const right="M"+fmt(cx+5)+" "+fmt(cy+3)+" C"+fmt(cx+62)+" "+fmt(cy-82)+" "+fmt(cx+154)+" "+fmt(cy-86)+" "+fmt(cx+166)+" "+fmt(cy-18)+" C"+fmt(cx+176)+" "+fmt(cy+43)+" "+fmt(cx+87)+" "+fmt(cy+82)+" "+fmt(cx+8)+" "+fmt(cy+40)+" Z";
 a.push(path(left,1.2,INK,.95,"#e6e0d6"),path(right,1.2,INK,.95,"#e6e0d6"));
 for(let i=0;i<13;i++){const t=i/12,xL=cx-10-t*145,yL=cy+26-Math.sin(t*Math.PI)*52+(R()-.5)*7,xR=cx+10+t*145,yR=cy+26-Math.sin(t*Math.PI)*50+(R()-.5)*7;a.push(path("M"+fmt(cx)+" "+fmt(cy+18)+" Q"+fmt(mix(cx,xL,.55))+" "+fmt(mix(cy,yL,.45)-12)+" "+fmt(xL)+" "+fmt(yL),i%4===0?1.3:.7,i%6===0?TEAL:INK,.82));a.push(path("M"+fmt(cx+3)+" "+fmt(cy+18)+" Q"+fmt(mix(cx,xR,.55))+" "+fmt(mix(cy,yR,.45)-12)+" "+fmt(xR)+" "+fmt(yR),i%4===0?1.25:.7,INK,.8));}
 for(let side of [-1,1])for(let i=0;i<3;i++){const x=cx+side*(62+i*37),y=cy-15+(i%2)*35;a.push(ellipse(x,y,10-i,6-i*.45,.9,INK,.9,"none"),ellipse(x,y,3.2,2.2,.5,TEAL,.75,"#b9c7bd"));}
 a.push(path("M"+fmt(cx)+" "+fmt(cy-38)+" C"+fmt(cx-8)+" "+fmt(cy-2)+" "+fmt(cx+8)+" "+fmt(cy+48)+" "+fmt(cx)+" "+fmt(cy+78),4.1,INK,.98));
 a.push(path("M"+fmt(cx-5)+" "+fmt(cy-28)+" Q"+fmt(cx-18)+" "+fmt(cy+18)+" "+fmt(cx-4)+" "+fmt(cy+59),.7,MID,.85));
 for(let i=0;i<20;i++){const x=cx-150+R()*300,y=cy-72+R()*140;if(R()<.45)a.push(circle(x,y,R()*1.4+.45,INK,.55));}
 for(let side of [-1,1])for(let row=0;row<6;row++){const t=.22+row*.105,x1=cx+side*(25+t*145),y1=cy+26-Math.sin(t*Math.PI)*52,x2=cx+side*(25+(t+.07)*145),y2=cy+26-Math.sin((t+.07)*Math.PI)*52;a.push(path("M"+fmt(x1)+" "+fmt(y1)+" Q"+fmt(mix(x1,x2,.45))+" "+fmt((y1+y2)/2+side*7)+" "+fmt(x2)+" "+fmt(y2),.62,MID,.72));}
 for(let i=0;i<12;i++){const x=cx+(R()<.5?-1:1)*(95+R()*55),y=cy-45+R()*88;a.push(ellipse(x,y,3+R()*3,5+R()*4,.55,INK,.65,"none"));}

 return svg(s+clip(id,a.join("")),regionClip(id,sp.p));
}
function latticeLayer(R,sp){
 const id="rootClip",base=baseRegion(sp.p,id),a=[],nodes=[];
 for(let row=0;row<5;row++){nodes[row]=[];for(let col=0;col<5;col++){nodes[row][col]=[sp.cx-112+col*56+(R()-.5)*17,sp.cy-70+row*34+(R()-.5)*13];}}
 for(let row=0;row<5;row++)for(let col=0;col<5;col++){
  const p=nodes[row][col],q=nodes[row][col+1],r=nodes[row+1]?.[col],d=nodes[row+1]?.[col+1];
  if(q)a.push(path("M"+fmt(p[0])+" "+fmt(p[1])+" Q"+fmt((p[0]+q[0])/2)+" "+fmt((p[1]+q[1])/2-5)+" "+fmt(q[0])+" "+fmt(q[1]),1.05,INK,.82));
  if(r)a.push(path("M"+fmt(p[0])+" "+fmt(p[1])+" Q"+fmt((p[0]+r[0])/2+5)+" "+fmt((p[1]+r[1])/2)+" "+fmt(r[0])+" "+fmt(r[1]),.85,MID,.82));
  if(d&&R()<.72)a.push(path("M"+fmt(p[0])+" "+fmt(p[1])+" L"+fmt(d[0])+" "+fmt(d[1]),.55,INK,.55));
  if(R()<.25)a.push(ellipse(p[0],p[1],5+R()*3,4+R()*2,.7,INK,.82,"#e6e1d7"));
  else a.push(circle(p[0],p[1],1.8+R()*1.6,R()<.25?TEAL:INK,.72));
 }
 for(let i=0;i<13;i++){const x=sp.cx-105+R()*210,y=sp.cy-62+R()*124,r=5+R()*9,pts=[];for(let k=0;k<7;k++){const t=k/7*Math.PI*2;pts.push([x+Math.cos(t)*r*(.8+R()*.3),y+Math.sin(t)*r*.72]);}a.push(path(pathData(pts,true,true),.65,INK,.65,"#e9e4da"));}
 a.push(hatch(sp.cx-48,sp.cy+4,75,54,.72,5,id,INK,.3),hatch(sp.cx+58,sp.cy-28,58,43,-.6,5,id,MID,.25));
 return svg(base+clip(id,a.join("")),regionClip(id,sp.p));
}
function spineLayer(R,sp){
 const id="wingClip",base=baseRegion(sp.p,id),a=[],centres=[];
 for(let i=0;i<9;i++){const x=sp.cx-146+i*36.5,y=sp.cy+Math.sin(i*.72)*28+(R()-.5)*5;centres.push([x,y]);}
 for(let i=0;i<centres.length-1;i++){const p=centres[i],q=centres[i+1];a.push(path("M"+fmt(p[0])+" "+fmt(p[1])+" Q"+fmt((p[0]+q[0])/2)+" "+fmt((p[1]+q[1])/2-9)+" "+fmt(q[0])+" "+fmt(q[1]),7.5,INK,.95),path("M"+fmt(p[0])+" "+fmt(p[1]-1)+" Q"+fmt((p[0]+q[0])/2)+" "+fmt((p[1]+q[1])/2-10)+" "+fmt(q[0])+" "+fmt(q[1]-1),1.1,TEALPALE,.8));}
 for(let i=0;i<centres.length;i++){const p=centres[i],angle=Math.atan2((centres[Math.min(8,i+1)][1]-centres[Math.max(0,i-1)][1]),(centres[Math.min(8,i+1)][0]-centres[Math.max(0,i-1)][0]))*180/Math.PI;
  a.push('<g transform="rotate('+fmt(angle)+' '+fmt(p[0])+' '+fmt(p[1])+')">'+ellipse(p[0],p[1],20+R()*2,12+R()*2,1.35,INK,.96,"#e8e3d9")+ellipse(p[0],p[1],12,6,.7,MID,.82,"none")+line(p[0]-9,p[1],p[0]+9,p[1],.6,INK,.8)+circle(p[0],p[1],2.3,i%3===0?TEAL:INK,.82)+'</g>');
  if(i>0&&i<8)a.push(line(p[0],p[1]-12,p[0]+(R()-.5)*9,p[1]-24-R()*8,.8,INK,.72));
 }
 for(let side of [-1,1])for(let i=0;i<3;i++){const p=centres[2+i*2],x=p[0]+side*(16+R()*7),y=p[1]+(R()-.5)*16;a.push(path("M"+fmt(p[0])+" "+fmt(p[1])+" q"+fmt(side*17)+" "+fmt(-18+R()*8)+" "+fmt(side*34)+" "+fmt(-8+R()*16),1.1,INK,.8),ellipse(x+side*18,y-12,6,4,.7,MID,.8,"none"));}
 a.push(hatch(sp.cx-15,sp.cy+65,115,38,.25,id,INK,.26));
 return svg(base+clip(id,a.join("")),regionClip(id,sp.p));
}
function fanLayer(R,sp){
 const id="shellClip",base=baseRegion(sp.p,id),a=[],cx=sp.cx,cy=sp.cy,hinge=[cx,cy+60],start=Math.PI+0.34,end=Math.PI*2-0.34;
 for(let i=0;i<29;i++){const t=i/28,ang=start+t*(end-start),r=145+(R()-.5)*12,ex=cx+Math.cos(ang)*r,ey=cy+Math.sin(ang)*r*.88,bend=(R()-.5)*18,pts=[hinge,[mix(cx,ex,.42)-Math.sin(ang)*bend,mix(cy,ey,.42)+Math.cos(ang)*bend],[ex,ey]];a.push(path(pathData(pts,true,false),i%7===0?1.45:.78,i%9===0?TEAL:INK,.84));}
 for(let band=0;band<5;band++){const pts=[];for(let i=0;i<=42;i++){const t=i/42,ang=start+t*(end-start),r=42+band*22;pts.push([cx+Math.cos(ang)*r,cy+Math.sin(ang)*r*.88]);}a.push(path(pathData(pts,true,false),band===0?1.2:.62,band===2?MID:INK,.78));}
 for(let i=0;i<21;i++){const t=i/20,ang=start+t*(end-start),x=cx+Math.cos(ang)*151,y=cy+Math.sin(ang)*132;a.push(ellipse(x,y,3.3,6,.7,INK,.82,"none",'transform="rotate('+fmt(ang*180/Math.PI+90)+' '+fmt(x)+' '+fmt(y)+')"'));}
 for(let i=0;i<9;i++){const x=cx-82+i*20,y=cy+35+Math.sin(i*.55)*7;a.push(path("M"+fmt(x)+" "+fmt(y)+" q8 12 17 0",.7,MID,.72));}
 a.push(ellipse(cx,cy+60,17,13,1.2,INK,.9,"#d8d1c5"),circle(cx,cy+60,5,TEAL,.85));
 a.push(hatch(cx-78,cy-22,76,55,.62,id,INK,.34));
 return svg(base+clip(id,a.join("")),regionClip(id,sp.p));
}
function vesselLayer(R,sp){
 const id="podClip",base=baseRegion(sp.p,id),a=[],cx=sp.cx,cy=sp.cy;
 const body="M"+fmt(cx-42)+" "+fmt(cy-60)+" C"+fmt(cx-35)+" "+fmt(cy-18)+" "+fmt(cx-100)+" "+fmt(cy+6)+" "+fmt(cx-89)+" "+fmt(cy+65)+" C"+fmt(cx-80)+" "+fmt(cy+116)+" "+fmt(cx-34)+" "+fmt(cy+124)+" "+fmt(cx)+" "+fmt(cy+121)+" C"+fmt(cx+46)+" "+fmt(cy+118)+" "+fmt(cx+88)+" "+fmt(cy+82)+" "+fmt(cx+83)+" "+fmt(cy+43)+" C"+fmt(cx+79)+" "+fmt(cy+3)+" "+fmt(cx+33)+" "+fmt(cy-21)+" "+fmt(cx+40)+" "+fmt(cy-60)+" Z";
 a.push(path(body,1.8,INK,.98,"#e8e3d9"));
 a.push(ellipse(cx,cy-61,51,16,2,INK,.96,"#d3ccc0"),ellipse(cx,cy-63,39,9,1.1,MID,.92,"#262621"),ellipse(cx,cy-64,22,4,.6,TEAL,.75,"#8f887d"));
 a.push(path("M"+fmt(cx-39)+" "+fmt(cy-50)+" C"+fmt(cx-26)+" "+fmt(cy-18)+" "+fmt(cx-52)+" "+fmt(cy+42)+" "+fmt(cx-25)+" "+fmt(cy+98),.8,MID,.8));
 a.push(path("M"+fmt(cx+38)+" "+fmt(cy-50)+" C"+fmt(cx+24)+" "+fmt(cy-12)+" "+fmt(cx+54)+" "+fmt(cy+46)+" "+fmt(cx+25)+" "+fmt(cy+99),.8,MID,.8));
 for(let i=0;i<19;i++){const t=i/18,ang=-1.18+t*2.36,x=cx+Math.sin(ang)*76,y=cy+35+Math.cos(ang)*28;a.push(path("M"+fmt(cx+Math.sin(ang)*37)+" "+fmt(cy+15+Math.cos(ang)*16)+" Q"+fmt(x+Math.sin(ang)*8)+" "+fmt(y-15)+" "+fmt(x)+" "+fmt(y+18),i%5===0?1.1:.58,i%7===0?TEAL:INK,.72));}
 for(let i=0;i<7;i++){const y=cy-28+i*22,x=cx-18+(R()-.5)*5;a.push(line(x,y,x+36,y+1,.65,MID,.55));}
 a.push(path("M"+fmt(cx-86)+" "+fmt(cy+3)+" C"+fmt(cx-132)+" "+fmt(cy-12)+" "+fmt(cx-126)+" "+fmt(cy+54)+" "+fmt(cx-86)+" "+fmt(cy+61),2,INK,.86),path("M"+fmt(cx+81)+" "+fmt(cy+4)+" C"+fmt(cx+126)+" "+fmt(cy-10)+" "+fmt(cx+126)+" "+fmt(cy+55)+" "+fmt(cx+83)+" "+fmt(cy+63),2,INK,.86));
 a.push(ellipse(cx,cy+120,36,8,1.1,INK,.9,"none"),ellipse(cx,cy+120,23,4,.65,TEAL,.7,"none"));
 a.push(hatch(cx-52,cy+55,54,58,-.6,id,INK,.32));
 return svg(base+clip(id,a.join("")),regionClip(id,sp.p));
}
function knotLayer(R,sp){
 const id="cityClip",base=baseRegion(sp.p,id),a=[],cx=sp.cx,cy=sp.cy;
 const loops=[
 "M"+fmt(cx-176)+" "+fmt(cy-16)+" C"+fmt(cx-154)+" "+fmt(cy-152)+" "+fmt(cx+32)+" "+fmt(cy-162)+" "+fmt(cx+151)+" "+fmt(cy-52)+" C"+fmt(cx+247)+" "+fmt(cy+38)+" "+fmt(cx+93)+" "+fmt(cy+147)+" "+fmt(cx-30)+" "+fmt(cy+76)+" C"+fmt(cx-135)+" "+fmt(cy+16)+" "+fmt(cx-70)+" "+fmt(cy-88)+" "+fmt(cx+34)+" "+fmt(cy-53),
 "M"+fmt(cx-86)+" "+fmt(cy-166)+" C"+fmt(cx+65)+" "+fmt(cy-177)+" "+fmt(cx+180)+" "+fmt(cy-45)+" "+fmt(cx+93)+" "+fmt(cy+44)+" C"+fmt(cx+10)+" "+fmt(cy+137)+" "+fmt(cx-130)+" "+fmt(cy+122)+" "+fmt(cx-166)+" "+fmt(cy+14)+" C"+fmt(cx-193)+" "+fmt(cy-74)+" "+fmt(cx-70)+" "+fmt(cy-132)+" "+fmt(cx+16)+" "+fmt(cy-83),
 "M"+fmt(cx-185)+" "+fmt(cy+70)+" C"+fmt(cx-82)+" "+fmt(cy-35)+" "+fmt(cx+44)+" "+fmt(cy-151)+" "+fmt(cx+178)+" "+fmt(cy-44)+" C"+fmt(cx+227)+" "+fmt(cy+13)+" "+fmt(cx+90)+" "+fmt(cy+132)+" "+fmt(cx-44)+" "+fmt(cy+141)
 ];
 for(let i=0;i<loops.length;i++)a.push(path(loops[i],22,INK,.98),path(loops[i],12,i===1?"#e4ded4":"#eee9df",.98));
 const crossings=[[cx-55,cy-42],[cx+54,cy+25],[cx+6,cy-88],[cx-103,cy+49]];
 for(let i=0;i<crossings.length;i++){const q=crossings[i],x=q[0],y=q[1];a.push(ellipse(x,y,18,18,0,"none",1,"#f0ece3"));const d=i%2===0?"M"+fmt(x-24)+" "+fmt(y-8)+" Q"+fmt(x)+" "+fmt(y-20)+" "+fmt(x+26)+" "+fmt(y+8):"M"+fmt(x-24)+" "+fmt(y+7)+" Q"+fmt(x)+" "+fmt(y-18)+" "+fmt(x+24)+" "+fmt(y-6);a.push(path(d,19,INK,.98),path(d,9,"#e6e0d6",.98));}
 for(let i=0;i<26;i++){const t=i/26*Math.PI*2,x=cx+Math.cos(t)*155,y=cy+Math.sin(t)*112;a.push(line(x,y,x+Math.cos(t+1.1)*7,y+Math.sin(t+1.1)*7,.65,MID,.72));}
 for(let i=0;i<18;i++){const x=cx-125+R()*250,y=cy-95+R()*190;if(R()<.6)a.push(circle(x,y,R()*1.6+.5,INK,.62));}
 a.push(hatch(cx-115,cy-102,82,46,.45,id,INK,.3),hatch(cx+98,cy+62,70,38,-.6,id,INK,.3));
 return svg(base+clip(id,a.join("")),regionClip(id,sp.p));
}
function background(R){
 let s='<rect width="'+N+'" height="'+H+'" fill="'+PAPER+'"/><defs><pattern id="papergrain" width="23" height="23" patternUnits="userSpaceOnUse"><circle cx="4" cy="6" r=".55" fill="#8f887d" opacity=".22"/><circle cx="17" cy="15" r=".45" fill="#8f887d" opacity=".18"/><path d="M2 20l4-1M13 3l3-.5" stroke="#9b9387" stroke-width=".35" opacity=".15"/></pattern></defs><rect width="'+N+'" height="'+H+'" fill="url(#papergrain)"/>';
 for(let i=0;i<9;i++){const y=80+i*72,x=R()*N;s+=path("M"+fmt(x)+" "+fmt(y)+" q"+fmt(50+R()*70)+" "+fmt(-20+R()*40)+" "+fmt(110+R()*90)+" "+fmt(-5+R()*25),.45,"#b8b0a4",.32);}
 return svg(s);
}
function overlayLayer(R,sp){
 let a=[];
 // Sparse floating fragments: they act as punctuation, not a second texture field.
 for(let i=0;i<12;i++){const x=65+R()*830,y=45+R()*625,r=3+R()*7;a.push(ellipse(x,y,r*1.2,r*.65,.65,i%4===0?TEAL:MID,.62));if(i%3===0)a.push(line(x-r*2,y+r*1.5,x+r*2,y-r*1.5,.6,INK,.52));}
 for(let i=0;i<5;i++){const x=80+i*185+R()*30,y=70+R()*530,pts=[];for(let j=0;j<9;j++)pts.push([x+j*3,y+Math.sin(j*.9+i)*4]);a.push(path(pathData(pts,true,false),.65,INK,.55));}
 for(let i=0;i<16;i++){const x=60+R()*840,y=48+R()*620,ang=R()*Math.PI*2,len=5+R()*12;a.push(path("M"+fmt(x)+" "+fmt(y)+" q"+fmt(Math.cos(ang)*len*.5)+" "+fmt(Math.sin(ang)*len*.5)+" "+fmt(Math.cos(ang)*len)+" "+fmt(Math.sin(ang)*len),.6,i%5===0?TEAL:MID,.48));}

 a.push(path("M438 85 Q480 53 523 78 Q544 91 565 75",.8,MID,.6),path("M420 648 Q456 625 487 647",.8,MID,.55));
 return svg(a.join(""));
}
function microLayer(R,cx,cy,kind){
 let a=[];
 if(kind===0){
  const nodes=[];for(let i=0;i<6;i++){const t=i/6*Math.PI*2,x=cx+Math.cos(t)*24,y=cy+Math.sin(t)*19;nodes.push([x,y]);}
  for(let i=0;i<nodes.length;i++){const p=nodes[i],q=nodes[(i+1)%nodes.length];a.push(line(p[0],p[1],q[0],q[1],1.1,INK,.8));a.push(circle(p[0],p[1],4,i%3===0?TEAL:"#e4ded4",.9,INK,.7));}
  a.push(path("M"+fmt(cx-12)+" "+fmt(cy)+" Q"+fmt(cx)+" "+fmt(cy-22)+" "+fmt(cx+12)+" "+fmt(cy),.8,MID,.8));
 }else{
  for(let i=0;i<5;i++){const x=cx-28+i*14,y=cy+Math.sin(i*.7)*7;a.push(ellipse(x,y,9,5,1,INK,.86,"#e6e0d6"),ellipse(x,y,4,2,.55,TEAL,.72,"none"));if(i<4)a.push(line(x+8,y,x+15,y+Math.sin((i+1)*.7)*7,.8,INK,.75));}
  a.push(hatch(cx,cy+13,55,18,.25,4,null,INK,.42));
 }
 return svg(a.join(""));
}
function build(seed){
 const R=rng(seed),specs={};
 specs.root={cx:155+R()*18,cy:570+R()*12,rx:150,ry:113,phase:R()*6,lobes:7,rough:.17,rot:-.08};
 specs.wing={cx:770+R()*18,cy:570+R()*14,rx:177,ry:122,phase:R()*6,lobes:6,rough:.15,rot:.05};
 specs.shell={cx:215+R()*18,cy:260+R()*14,rx:196,ry:164,phase:R()*6,lobes:8,rough:.13,rot:-.08};
 specs.pod={cx:730+R()*18,cy:183+R()*12,rx:180,ry:140,phase:R()*6,lobes:6,rough:.15,rot:.06};
 specs.city={cx:505+R()*12,cy:416+R()*12,rx:248,ry:185,phase:R()*6,lobes:9,rough:.13,rot:.02};
 for(const k of Object.keys(specs)){const s=specs[k];s.p=blob(s.cx,s.cy,s.rx,s.ry,s.phase,s.lobes,s.rough,s.rot);}
 const layers=[
  background(R),
  latticeLayer(R,specs.root),
  spineLayer(R,specs.wing),
  fanLayer(R,specs.shell),
  vesselLayer(R,specs.pod),
  knotLayer(R,specs.city),
  overlayLayer(R,specs),
  microLayer(R,472+R()*28,153+R()*18,0),
  microLayer(R,472+R()*28,620+R()*18,1)
 ];
 return layers;
}
function loadSvg(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error("Could not render specimen layer"));im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(src);});}
function create(canvas,seed=(Math.random()*4294967295)>>>0,onStatus=()=>{}){
 canvas.width=N;canvas.height=H;const ctx=canvas.getContext("2d",{alpha:false});
 let originSeed=seed>>>0,frame=0,images=[],readyState=false,reveal=0,microAt=0,memory=[],marks=0,births=0,colourStrokes=34,ready;
 function readMemory(){try{return JSON.parse(localStorage.getItem(KEY)||"[]");}catch(e){return [];}}
 function prepare(s){
  originSeed=s>>>0;frame=0;reveal=0;microAt=0;marks=0;births=0;readyState=false;images=[];ctx.clearRect(0,0,N,H);
  onStatus("012 / assembling a machine for growing things");
  const layers=build(originSeed);
  return Promise.all(layers.map(loadSvg)).then(loaded=>{images=loaded;readyState=true;ctx.clearRect(0,0,N,H);ctx.drawImage(images[0],0,0,N,H);reveal=1;marks=1;if(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches){for(let i=1;i<7;i++)ctx.drawImage(images[i],0,0,N,H);for(let i=7;i<9;i++)ctx.drawImage(images[i],0,0,N,H);reveal=7;microAt=2;births=2;marks=1032;}onStatus("012 / composition ready");}).catch(err=>{onStatus("012 / "+err.message);throw err;});
 }
 ready=prepare(originSeed);
 function step(){
  if(!readyState)return;frame++;
  if(reveal<7&&frame%3===0){ctx.drawImage(images[reveal],0,0,N,H);reveal++;marks+=reveal===6?320:reveal===5?210:reveal===4?170:reveal===3?130:reveal===2?95:70;}
  if(reveal>=7&&microAt<2&&frame>FPS*(microAt===0?5:12)){ctx.drawImage(images[7+microAt],0,0,N,H);microAt++;births++;marks+=18;}
 }
 function reset(s=(Math.random()*4294967295)>>>0){ready=prepare(s>>>0);return ready;}
 function remember(){try{memory=readMemory();memory.unshift({seed:originSeed,created:Date.now()});memory=memory.slice(0,24);localStorage.setItem(KEY,JSON.stringify(memory));return true;}catch(e){return false;}}
 return {get ready(){return ready;},step,reset,remember,get frame(){return frame;},get seconds(){return frame/FPS;},get seed(){return originSeed;},get finished(){return readyState&&reveal>=7&&microAt>=2;},get stats(){memory=readMemory();return{marks,births,lineages:5,colourStrokes,sources:["CELLULAR LATTICE","ARTICULATED SPINE","PLEATED MEMBRANE","HOLLOW VESSEL","BRAIDED KNOT"],palette:"GRAPHITE / BONE / VERDIGRIS",memory:memory.length};}};
}
function preview(seed=12012026){const inner=build(seed).map(s=>s.replace(/^<svg[^>]*>/,"").replace(/<\/svg>$/,"")).join("");return svg(inner);}
function getMemoryCount(){try{return JSON.parse(localStorage.getItem(KEY)||"[]").length;}catch(e){return 0;}}
root.Palimpsest012={create,FPS,SIZE:[N,H],getMemoryCount,preview,build};
})(globalThis);