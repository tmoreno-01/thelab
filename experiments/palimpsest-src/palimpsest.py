import numpy as np, cv2 as cv, subprocess, sys
from pathlib import Path
S=1080; T=2*np.pi; PI=np.pi
class Ink:
 def __init__(self,n,seed):self.n=n;self.a=np.full((n,n),235,np.uint8);self.r=np.random.default_rng(seed)
 def line(self,p,c=25,w=1,closed=False):cv.polylines(self.a,[np.round(np.asarray(p)*self.n).astype(np.int32)],closed,int(c),max(1,round(w*self.n/420)),cv.LINE_AA)
 def fill(self,p,c=25):cv.fillPoly(self.a,[np.round(np.asarray(p)*self.n).astype(np.int32)],int(c),cv.LINE_AA)
 def curve(self,p,c=25,w=1):
  p=np.asarray(p);q=np.vstack([p[0],p,p[-1]]);t=np.linspace(0,1,12)[:,None];a,b,d,e=q[:-3,None],q[1:-2,None],q[2:-1,None],q[3:,None];z=.5*(2*b+(-a+d)*t+(2*a-5*b+4*d-e)*t*t+(-a+3*b-3*d+e)*t*t*t);self.line(z.reshape(-1,2),c,w)
 def ell(self,x,y,rx,ry,c=25,w=1,rot=0,fill=False):
  t=np.linspace(0,T,90);p=np.column_stack([rx*np.cos(t),ry*np.sin(t)])@np.array([[np.cos(rot),np.sin(rot)],[-np.sin(rot),np.cos(rot)]])+[x,y];self.fill(p,c) if fill else self.line(p,c,w,True)
 def dot(self,x,y,r,c=25):cv.circle(self.a,(round(x*self.n),round(y*self.n)),max(1,round(r*self.n)),int(c),-1,cv.LINE_AA)
 def eye(self,x,y,rx,ry,rot=0):
  def tr(p):return np.asarray(p)*[rx,ry]@np.array([[np.cos(rot),np.sin(rot)],[-np.sin(rot),np.cos(rot)]])+[x,y]
  t=np.linspace(0,PI,80);a=np.column_stack([np.cos(t),-.87*np.sin(t)]);b=np.column_stack([np.cos(t[::-1]),.62*np.sin(t[::-1])]);self.fill(tr(np.vstack([a,b])),236);self.line(tr(a),18,2.5);self.line(tr(b),32,1.5)
  old=self.a.copy();mask=np.zeros_like(old);cv.fillPoly(mask,[np.round(tr(np.vstack([a,b]))*self.n).astype(np.int32)],255)
  rad=ry*.78;self.ell(x,y,rad,rad,20,1.5);self.ell(x,y,rad*.36,rad*.36,16,fill=True)
  for ang in np.linspace(0,T,100,endpoint=False):
   d=np.array([np.cos(ang),np.sin(ang)]);q=np.array([np.cos(ang+.07),np.sin(ang+.07)]);o=np.array([x,y]);self.line([o+d*rad*self.r.uniform(.36,.58),o+q*rad*.72,o+d*rad*self.r.uniform(.85,.99)],self.r.integers(22,95),.7)
  self.dot(x-rad*.22,y-rad*.22,rad*.13,245);self.a=np.where(mask>0,self.a,old)
  for i in range(24):
   z=(i+.5)/24*PI;px=np.cos(z);py=-.87*np.sin(z);self.line(tr([[px,py],[px+.07*np.cos(z),py-.12-self.r.uniform(0,.14)]]),22,.8)
 def face(self):
  p=[(.22,.25),(.29,.13),(.48,.08),(.71,.14),(.82,.29),(.79,.47),(.84,.55),(.76,.60),(.73,.73),(.63,.83),(.48,.88),(.33,.79),(.23,.62),(.18,.45),(.22,.25)];self.fill(p,229);self.curve(p,17,2.3)
  for j in range(27):
   u=j/26;self.curve([(.23+u*.12,.29),(.28+u*.10,.41),(.27+u*.10,.56),(.35+u*.09,.71),(.48+u*.03,.83)],35+int(u*68),.9)
  for j in range(20):
   u=j/19;self.curve([(.80-u*.085,.30),(.76-u*.095,.44),(.73-u*.09,.52),(.69-u*.085,.63),(.63-u*.06,.77)],40+int(u*57),.8)
  for j in range(24):
   u=j/23;self.curve([(.30+u*.012,.23+u*.003),(.44,.15+u*.007),(.59,.15+u*.009),(.72,.22+u*.006)],45+int(u*80),.8)
  self.eye(.375,.405,.125,.067,-.11);self.eye(.667,.385,.105,.061,.08)
  self.curve([(.54,.29),(.51,.44),(.50,.53),(.46,.59),(.51,.63),(.58,.60)],20,2);self.curve([(.57,.42),(.58,.52),(.62,.58),(.59,.61)],30,1.2);self.ell(.50,.61,.022,.011,22,fill=True);self.ell(.59,.60,.018,.008,22,fill=True)
  self.curve([(.40,.703),(.47,.675),(.52,.686),(.57,.665),(.65,.68),(.59,.716),(.51,.732),(.44,.721),(.40,.703)],20,1.9);self.curve([(.40,.703),(.48,.701),(.54,.705),(.59,.691),(.65,.68)],17,1.4)
  for j in range(16):self.line([(.438+j*.012,.708),(.442+j*.012,.722)],45,.7)
  for j in range(13):self.curve([(.40+j*.015,.76),(.49+j*.008,.79),(.53+j*.006,.81)],55+j*5,.75)
  for _ in range(450):
   x,y=self.r.uniform(.30,.72),self.r.uniform(.22,.79)
   if (y<.32 or y>.46) and not (.39<x<.65 and .64<y<.74):self.dot(x,y,self.r.uniform(.0006,.0014),self.r.integers(75,150))
  for j in range(58):
   u=j/57;self.curve([(.17+u*.62,.31),(.16+u*.69,.16),(.24+u*.50,.03),(.40+u*.28,.015),(.57+u*.16,.10)],20+int(u*45),.8)
 def shell(self):
  t=np.linspace(0,7.6*PI,640)
  for i in range(38):
   off=(i-19)/19;r=.012*np.exp(t*.151)*(1+.15*off);self.line(np.column_stack([.48+r*np.cos(t+off*.16),.49+r*np.sin(t+off*.16)*.92]),25+int(abs(off)*65),.8)
  for a in np.arange(2,23.8,.11):
   r=.012*np.exp(a*.151);p=np.array([.48+r*np.cos(a),.49+r*np.sin(a)*.92]);n=np.array([np.cos(a+.22),np.sin(a+.22)]);q=np.array([-n[1],n[0]]);self.curve([p-n*r*.22,p+q*r*.07,p+n*r*.19],20,1)
  for a in np.linspace(0,T,22,endpoint=False):
   x=.5+.39*np.cos(a);y=.5+.39*np.sin(a);self.ell(x,y,.043,.028,30,1,a);self.ell(x,y,.025,.013,40,1,a)
 def architecture(self):
  for j in range(12):
   x=.01+j*.083;y=self.r.uniform(.18,.64);w=self.r.uniform(.057,.12);d=.048;f=[(x,y),(x+w,y+.028),(x+w,.95),(x,.93)];s=[(x+w,y+.028),(x+w+d,y-.019),(x+w+d,.89),(x+w,.95)];r=[(x,y),(x+d,y-.045),(x+w+d,y-.019),(x+w,y+.028)];self.fill(f,228);self.fill(s,81);self.fill(r,210);self.line(f,22,1.4,True);self.line(s,20,1.2,True);self.line(r,20,1,True)
   for k in np.arange(y+.04,.90,.035):self.line([(x,k),(x+w,k+.028)],102,.65);self.line([(x+w,k+.028),(x+w+d,k-.019)],30,.65)
   for yy in np.arange(y+.07,.89,.073):
    for k in range(2):
     xx=x+w*(.17+k*.45);ww=w*.25;hh=.04;self.fill([(xx,yy),(xx+ww,yy+.004),(xx+ww,yy+hh),(xx,yy+hh)],23);self.line([(xx,yy+hh),(xx+ww+.004,yy+hh),(xx+ww+.004,yy)],170,.7)
  for k in range(3):
   y=.16+k*.20
   for j in range(10):
    x=.07+j*.055;yy=y+j*.016;p=[(x,yy),(x+.068,yy+.02),(x+.068,yy+.055),(x,yy+.035)];self.fill(p,219);self.line(p,18,1.2,True)
 def flora(self):
  r=self.r
  def branch(x,y,a,l,d):
   t=np.linspace(0,1,24);b=r.uniform(-.65,.65);p=np.column_stack([x+l*t*np.cos(a+b*t),y+l*t*np.sin(a+b*t)]);self.line(p,22,max(.7,d*.7));end=p[-1]
   if d:
    for f in [.48,.75,1]:branch(*p[int(f*23)],a+b*f+r.choice([-1,1])*r.uniform(.28,.90),l*r.uniform(.48,.70),d-1)
   else:self.ell(*end,l*.29,l*.13,35,.8,a+b)
  for j in range(6):branch(.05+j*.18,.98,-PI/2+r.uniform(-.55,.55),.36,3)
 def labyrinth(self):
  for cx,cy in [(.23,.25),(.70,.32),(.43,.73),(.87,.78)]:
   for j in range(24):
    t=np.linspace(0,T,160);r=(.014+j*.010)*(1+.17*np.sin(t*3+cx*9)+.075*np.sin(t*7+cy*7));self.line(np.column_stack([cx+r*np.cos(t),cy+r*np.sin(t)*.86]),25+j*3,.85,True)
   self.eye(cx,cy,.085,.052,self.r.uniform(-.5,.5))
 def insect(self):
  for side in [-1,1]:
   p=[(.5,.36),(.5+side*.19,.10),(.5+side*.44,.15),(.5+side*.37,.40),(.5+side*.19,.58),(.5+side*.38,.69),(.5+side*.23,.88),(.5,.68)];self.fill(p,225);self.curve(p+[p[0]],20,2)
   for j in range(30):
    u=j/29;self.curve([(.5,.47),(.5+side*(.07+u*.09),.29),(.5+side*(.13+u*.24),.15+u*.30)],28+int(u*70),.85);self.curve([(.5,.58),(.5+side*(.07+u*.12),.64),(.5+side*(.12+u*.19),.83-u*.13)],35+int(u*80),.85)
   for j in range(6):self.ell(.5+side*(.11+j*.034),.30+j*.025,.023,.04,32,1,side*.5);self.ell(.5+side*(.11+j*.034),.30+j*.025,.012,.019,22,fill=True)
  self.ell(.5,.5,.056,.24,23,fill=True)
  for j in range(22):self.ell(.5,.30+j*.019,.052,.012,223,.9)
  self.ell(.5,.25,.071,.068,25,fill=True);self.eye(.47,.24,.031,.022);self.eye(.53,.24,.031,.022)
  for side in [-1,1]:self.curve([(.5+side*.03,.22),(.5+side*.11,.08),(.5+side*.19,.07)],20,1.6)
def motif(kind,n,seed):
 d=Ink(n,seed);r=d.r
 for j in range(120):
  x,y=r.uniform(-.15,1.15,2);ang=r.uniform(0,T);v=np.array([np.cos(ang),np.sin(ang)]);q=np.array([-v[1],v[0]]);p=np.array([x,y]);l=r.uniform(.035,.20)
  for k in range(r.integers(4,12)):
   b=p+q*k*.005;d.curve([b,b+v*l*.45+q*.012,b+v*l],r.integers(55,150),.65)
 getattr(d,kind)();return d.a
def patch(kind,cx,cy,rx,ry,seed,rot=0):
 a=motif(kind,int(max(rx,ry)*2.2),seed);a=cv.resize(a,(int(rx*2),int(ry*2)),interpolation=cv.INTER_AREA);h,w=a.shape;yy,xx=np.mgrid[:h,:w].astype(np.float32);x=(xx-w*.5)/(w*.5);y=(yy-h*.5)/(h*.5);ang=np.arctan2(y,x);dist=1+.07*np.sin(ang*5+seed)+.04*np.sin(ang*11+seed*.4)+.025*np.cos(ang*19)-np.sqrt(x*x+y*y);mask=(dist>.015).astype(np.uint8)*255;a[np.abs(dist-.028)<.009]=24;a[np.abs(dist-.061)<.004]=55
 if rot:
  M=cv.getRotationMatrix2D((w/2,h/2),rot,1);a=cv.warpAffine(a,M,(w,h),borderValue=235);mask=cv.warpAffine(mask,M,(w,h),flags=cv.INTER_NEAREST)
 x0=int(cx-w/2);y0=int(cy-h/2);x1=max(0,x0);y1=max(0,y0);x2=min(S,x0+w);y2=min(S,y0+h);sl=(slice(y1,y2),slice(x1,x2));sub=(slice(y1-y0,y2-y0),slice(x1-x0,x2-x0));return sl,mask[sub]>0,a[sub]
def ground():
 d=Ink(S,901);r=d.r;d.a.fill(227)
 for j in range(92):
  cx,cy=r.uniform(-.12,1.12,2);rx,ry=r.uniform(.025,.16,2);t=np.linspace(0,T,100);rr=1+.14*np.sin(t*3+j)+.07*np.cos(t*7+j)
  if j%5==0:d.fill(np.column_stack([cx+rx*rr*np.cos(t),cy+ry*rr*np.sin(t)]),r.integers(20,55))
  for k in range(r.integers(6,22)):
   f=1-k*.036;d.line(np.column_stack([cx+rx*f*rr*np.cos(t),cy+ry*f*rr*np.sin(t)]),r.integers(28,115),.55,True)
 return d.a
def render(out):
 base=ground();layout=[('architecture',200,200,270,235,8),('flora',820,190,270,235,-15),('shell',910,730,270,305,12),('labyrinth',240,820,315,280,-9),('insect',565,930,220,190,10),('face',530,495,324,410,-4),('architecture',940,410,198,170,12),('shell',135,515,189,189,-10)]
 for j,(kind,x,y,rx,ry,rot) in enumerate(layout):
  sl,m,a=patch(kind,x,y,rx,ry,120+j,rot);base[sl][m]=a[m]
 r=np.random.default_rng(899);paper=np.clip(1+r.normal(0,.018,(S,S))+cv.resize(r.normal(0,.019,(24,24)).astype(np.float32),(S,S),interpolation=cv.INTER_CUBIC),.86,1.10).astype(np.float32)
 def photo(a):
  g=np.clip(a.astype(np.float32)*paper,0,255);return np.clip(np.stack([g*.92,g*.965,g],-1),0,255).astype(np.uint8)
 cv.imwrite(str(Path(out).with_suffix('.jpg')),photo(base));p=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{S}x{S}','-r','24','-i','-','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',out],stdin=subprocess.PIPE)
 events=[];kinds=['architecture','face','shell','insect','flora','labyrinth'];centres=[(200,260),(800,260),(540,500),(830,750),(300,760),(540,900),(900,430),(160,540)]
 for frame in range(192):
  if frame%12==0:
   idx=frame//12;cx,cy=centres[idx%8];cx+=r.integers(-50,51);cy+=r.integers(-50,51);rx=int(r.integers(140,265));ry=int(r.integers(150,265));kind=kinds[(idx*5+2)%6];sl,m,a=patch(kind,cx,cy,rx,ry,310+idx,int(r.integers(-18,19)));h,w=m.shape;yy,xx=np.mgrid[:h,:w].astype(np.float32);xx=(xx-w*.5)/(w*.5);yy=(yy-h*.5)/(h*.5);ang=np.arctan2(yy,xx);dist=np.sqrt(xx*xx+yy*yy);field=dist+.10*np.sin(ang*8+dist*15+idx)+.045*np.sin(xx*31+yy*23)+.035*r.random((h,w));events.append([frame,sl,m,a,field,np.zeros_like(m)])
  for ev in events[:]:
   start,sl,m,a,field,done=ev;t=(frame-start+1)/30;new=m&(field<t*1.28)&~done;base[sl][new]=a[new];done|=new
   if t>=1:base[sl][m&~done]=a[m&~done];events.remove(ev)
  if frame%2==0:
   for _ in range(10):
    x,y=r.integers(20,S-20,2);cv.line(base,(int(x),int(y)),(int(x+r.integers(4,15)),int(y+r.integers(-8,9))),int(r.choice([25,225])),1,cv.LINE_AA)
  img=photo(base);p.stdin.write(img.tobytes())
  if frame in [48,96,144,191]:cv.imwrite(str(Path(out).with_suffix(''))+f'_{frame:03d}.jpg',img)
 p.stdin.close();assert p.wait()==0
if __name__=='__main__':render(sys.argv[1])
