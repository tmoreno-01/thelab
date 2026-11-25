"""Two-stage observation / autonomous synthesis. Independent reconstruction."""
import cv2 as cv, numpy as np, sys
from pathlib import Path
from numba import njit
cv.setNumThreads(3)
blur=lambda a,s:cv.GaussianBlur(a,(0,0),s)
rem=lambda a,x,y:cv.remap(a,x.astype(np.float32),y.astype(np.float32),cv.INTER_LINEAR,borderMode=cv.BORDER_REFLECT101)
w,h=480,270; X,Y=np.meshgrid(np.arange(w,dtype=np.float32),np.arange(h,dtype=np.float32))
def analyze(src,out):
 c=cv.VideoCapture(src);fps=c.get(cv.CAP_PROP_FPS);assert fps>0;dis=cv.DISOpticalFlow_create(cv.DISOPTICAL_FLOW_PRESET_MEDIUM);frames=[];flows=[];changes=[];structures=[];old=None;i=0
 while len(frames)<90:
  ok,im=c.read();i+=1
  if not ok:break
  if (i-1)/fps+1e-6<len(frames)/15:continue
  hh,ww=im.shape[:2];cw=int(ww*.62);ch=int(hh*.62);im=im[(hh-ch)//2:(hh+ch)//2,(ww-cw)//2:(ww+cw)//2];im=cv.resize(im,(w,h),interpolation=cv.INTER_AREA);g=cv.cvtColor(im,cv.COLOR_BGR2GRAY)
  if old is None:f=np.zeros((h,w,2),np.float32);d=np.zeros((h,w),np.float32)
  else:
   f=dis.calc(old,g,None);b=dis.calc(g,old,None);f*=np.exp(-np.linalg.norm(f+rem(b,X+f[:,:,0],Y+f[:,:,1]),axis=-1)*.5)[:,:,None];d=np.abs(g.astype(np.float32)-old.astype(np.float32))/255
  gf=g.astype(np.float32)/255;gx=cv.Sobel(gf,cv.CV_32F,1,0);gy=cv.Sobel(gf,cv.CV_32F,0,1);ang=.5*np.arctan2(2*blur(gx*gy,2.5),blur(gx*gx-gy*gy,2.5))+np.pi/2;structures.append(np.stack((np.cos(2*ang),np.sin(2*ang)),-1).astype(np.float16));old=g;frames.append(im);flows.append(f.astype(np.float16));changes.append((d*255).astype(np.uint8))
 c.release();assert len(frames)>2;np.savez_compressed(out,color=frames,motion=flows,change=changes,structure=structures);print('Extracted',len(frames),'observations',flush=True)
@njit(cache=True)
def stamp(rgb,depth,p,scale):
 H,W,_=rgb.shape
 for x,y,a,l,b,c0,c1,c2,op,s in p:
  x*=scale;y*=scale;l*=scale;b*=scale;ca=np.cos(a);sa=np.sin(a);R=int(l+b+2)
  for j in range(max(0,int(y)-R),min(H,int(y)+R+1)):
   for i in range(max(0,int(x)-R),min(W,int(x)+R+1)):
    u=((i-x)*ca+(j-y)*sa)/l;v=(-(i-x)*sa+(j-y)*ca)/b
    if abs(u)>=1 or abs(v)>1.4:continue
    v-=.23*np.sin(u*2.4+s*6.28)+.07*np.sin(u*9+s*23);z=abs(v)/max(.15,1-u*u)**.42
    if z>=1:continue
    br=.35+.65*(.5+.5*np.sin(v*25+s*31+np.sin(u*3)*2+np.sin(v*11+s*17)*1.5))**1.3
    alpha=op*(1-z*z)**.7*(1-abs(u)**3)*br
    rgb[j,i,0]+=(c0-rgb[j,i,0])*alpha;rgb[j,i,1]+=(c1-rgb[j,i,1])*alpha;rgb[j,i,2]+=(c2-rgb[j,i,2])*alpha;depth[j,i]=depth[j,i]*(1-alpha*.45)+alpha*.5

def render(src,out,seconds=5,W=960):
 d=np.load(src);F=d['motion'].astype(np.float32);C=d['color'];D=d['change'].astype(np.float32)/255;S=d['structure'][0].astype(np.float32);H=W*9//16//2*2;sc=W/w;XX,YY=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32));rng=np.random.default_rng(82)
 def noise(s):return cv.resize(rng.normal(0,1,(max(3,h//s),max(3,w//s))).astype(np.float32),(w,h),interpolation=cv.INTER_CUBIC)
 a,b,c=noise(75),noise(24),noise(7);psi=a*1.6+b*.7+c*.12;curl=np.stack((cv.Sobel(psi,cv.CV_32F,0,1),-cv.Sobel(psi,cv.CV_32F,1,0)),-1)*.22
 kx,ky=np.meshgrid(np.fft.rfftfreq(w)*2*np.pi,np.fft.fftfreq(h)*2*np.pi);k2=kx*kx+ky*ky;k2[0,0]=1
 def project(v):
  u=np.fft.rfft2(v[:,:,0]);z=np.fft.rfft2(v[:,:,1]);q=(kx*u+ky*z)/k2;return np.stack((np.fft.irfft2(u-kx*q,s=(h,w)),np.fft.irfft2(z-ky*q,s=(h,w))),-1).astype(np.float32)
 # Observed colors and local motion intensity provide initial data.
 base=C[0].astype(np.float32)/255;B,G,R=cv.split(base);l=.0722*B+.7152*G+.2126*R;fl=blur(np.clip((B+R-2*G)*5+.10,0,1),1.2);val=np.clip((l-.08)/.82,0,1);cool=np.clip(.5+a*.45+b*.25,0,1);gold=np.clip((G-B)*2.5,0,1);mask=np.clip(.45+a*.38+b*.17,0,1)
 petals=np.stack((.38+.50*cool,.29+.24*(1-cool),.91-.48*cool),-1);leaf=np.stack((.025+.12*val,.025+.13*val+.19*gold*val,.025+.12*val+.31*gold*val),-1)
 palette=np.clip((leaf*(1-fl[:,:,None])+petals*fl[:,:,None])*(.22+mask[:,:,None]*1.1)*(.48+val[:,:,None]*1.30)+.009,0,.95).astype(np.float32)
 energy=blur(np.clip(np.mean(np.linalg.norm(F,axis=-1),0)*1.6+D.mean(0)*5,0,1),2);vel=project(F.mean(0)*.5+curl)
 rgb=np.zeros((H,W,3),np.float32)+.012;depth=np.zeros((H,W),np.float32);writer=cv.VideoWriter(out,cv.VideoWriter_fourcc(*'mp4v'),24,(W,H));assert writer.isOpened()
 for i in range(int(seconds*24)):
  # No video frames read here. Observed motion fades to zero; pigment evolves independently.
  influence=max(0,1-i/60);f=F[min(len(F)-1,int(i*15/24))];vel=project(rem(vel,X-vel[:,:,0],Y-vel[:,:,1])*.976+blur(f,2)*.22*influence+curl*.11);vel=np.clip(vel,-4,4)
  V=cv.resize(vel,(W,H));qx=XX-V[:,:,0]*sc*.38;qy=YY-V[:,:,1]*sc*.38
  if i:rgb=rem(rgb,qx,qy)*.998;depth=rem(depth,qx,qy)*.98;palette=rem(palette,X-vel[:,:,0]*.38,Y-vel[:,:,1]*.38)
  va=np.arctan2(vel[:,:,1],vel[:,:,0]);theta=.5*np.arctan2(S[:,:,1],S[:,:,0]);wt=np.clip(np.linalg.norm(vel,axis=-1)*.8+.25,.25,.9);angle=theta+.5*np.arctan2(np.sin(2*(va-theta)),np.cos(2*(va-theta)))*wt+b*.30+c*.35;activity=np.clip(energy*.7+np.linalg.norm(vel,axis=-1)*.3,0,1)
  for layer,n in enumerate((12000,32000,65000) if not i else (1100,3800,7900)):
   u=rng.random((n,10),dtype=np.float32);x=u[:,0]*(w-1);y=u[:,1]*(h-1);ix=x.astype(int);iy=y.astype(int);m=mask[iy,ix];act=activity[iy,ix];k=u[:,2]<.20+.35*m+.35*act;u=u[k];x=x[k];y=y[k];ix=ix[k];iy=iy[k];m=m[k];act=act[k]
   L=(4+u[:,3]*12 if layer==0 else 2+u[:,3]*6 if layer==1 else .7+u[:,3]*3.5)*(.6+.6*act+.5*m);B=(1.6+u[:,4]*4 if layer==0 else .65+u[:,4]*1.7 if layer==1 else .28+u[:,4]*.8);ang=angle[iy,ix]+(u[:,5]-.5)*(.8+.65*(1-m));col=np.clip(palette[iy,ix]*(.43+u[:,6,None]*1.35)+(u[:,7,None]-.5)*.04,0,1);op=(.40+.55*u[:,8])*(.7+.3*act)
   stamp(rgb,depth,np.column_stack((x,y,ang,L,B,col,op,u[:,9])).astype(np.float32),sc)
  relief=(cv.Sobel(depth,cv.CV_32F,1,0)-cv.Sobel(depth,cv.CV_32F,0,1))*.06;img=(np.clip(rgb*(1+relief[:,:,None])+relief[:,:,None]*.025,0,1)**.9*255).astype(np.uint8);writer.write(img)
  if i%24==0:cv.imwrite(out[:-4]+f'_{i:04}.jpg',img);print('frame',i,'forcing',round(influence,2),flush=True)
 writer.release()
if __name__=='__main__':
 if sys.argv[1]=='analyze':analyze(sys.argv[2],sys.argv[3])
 elif sys.argv[1]=='render':render(sys.argv[2],sys.argv[3],float(sys.argv[4]),int(sys.argv[5]))
