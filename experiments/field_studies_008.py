'''Fine filament pigment transport. Original footage is the source, not the reference film.'''
import cv2 as cv,numpy as np,sys,time
from numba import njit
cv.setNumThreads(3)
@njit(cache=True)
def deposit(paint,old,new,col,rad,alpha):
 H,W,_=paint.shape
 for k in range(len(old)):
  x0,y0=old[k];x1,y1=new[k];dx=x1-x0;dy=y1-y0;den=dx*dx+dy*dy+1e-7;r=rad[k];a=alpha[k]
  for y in range(max(0,int(min(y0,y1)-r)),min(H,int(max(y0,y1)+r+1))):
   for x in range(max(0,int(min(x0,x1)-r)),min(W,int(max(x0,x1)+r+1))):
    t=max(0.,min(1.,((x-x0)*dx+(y-y0)*dy)/den));d=((x-x0-t*dx)**2+(y-y0-t*dy)**2)**.5
    if d<r:
     q=a*(1-d/r)**1.25*(.6+.4*np.sin(t*np.pi))
     for c in range(3):paint[y,x,c]+=(col[k,c]-paint[y,x,c])*q

def main(src,out,seconds=4,W=1280,mode='flowers'):
 H=W*9//16//2*2;w,h=640,360;sc=W/w;fps=24;rng=np.random.default_rng(624);X,Y=np.meshgrid(np.arange(w,dtype=np.float32),np.arange(h,dtype=np.float32));XX,YY=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32));blur=lambda a,s:cv.GaussianBlur(a,(0,0),s);resize=lambda a:cv.resize(a,(W,H));rem=lambda a,x,y:cv.remap(a,x.astype(np.float32),y.astype(np.float32),cv.INTER_LINEAR,borderMode=cv.BORDER_REFLECT101)
 def noise(s):return cv.resize(rng.normal(0,1,(max(3,int(h/s)),max(3,int(w/s)))).astype(np.float32),(w,h),interpolation=cv.INTER_CUBIC)
 cloud=noise(34);medium=noise(10);small=noise(3.5);hue=noise(24);shear=noise(18)
 cap=cv.VideoCapture(src);sfps=cap.get(cv.CAP_PROP_FPS);ok,fr=cap.read();assert ok and sfps>0
 def sample(fr):
  hh,ww=fr.shape[:2];crop=.60 if mode=='flowers' else 1.;cw=int(min(ww,hh*16/9)*crop);ch=int(min(hh,ww*9/16)*crop);return cv.resize(fr[(hh-ch)//2:(hh+ch)//2,(ww-cw)//2:(ww+cw)//2],(w,h),interpolation=cv.INTER_AREA)
 def grade(im):
  c=im.astype(np.float32)/255;B,G,R=cv.split(c);l=.0722*B+.7152*G+.2126*R
  if mode!='flowers':return np.clip(.065+.77*l[:,:,None]**.70+(c-l[:,:,None])*.95,.025,.97).astype(np.float32)
  key=blur(np.clip((B+R-2*G)*4.5+.10,0,1),.7);bright=np.clip((l-.10)/.67,0,1);cool=np.clip(.48+.36*hue+.25*medium,0,1)
  violet=np.stack((.40+.46*cool,.27+.20*(1-cool),.86-.49*cool),-1);v=(.30+1.13*bright**.76)*( .87+.24*cloud+.15*medium)
  leaf=np.stack((.072+.12*l,.075+.15*l,.068+.11*l+.035*np.clip(cloud+.3,0,1)),-1)
  leaf*=np.clip(.83+.32*cloud+.20*medium,.44,1.55)[:,:,None];base=leaf*(1-key[:,:,None])+violet*key[:,:,None]*v[:,:,None];base+=.028+(c-l[:,:,None])*.20
  return np.clip(base,.024,.95).astype(np.float32)
 im=sample(fr);gray=cv.cvtColor(im,cv.COLOR_BGR2GRAY);oldgray=gray;palette=grade(im);paint=resize(blur(palette,1.2));dis=cv.DISOpticalFlow_create(cv.DISOPTICAL_FLOW_PRESET_MEDIUM);v=np.zeros((h,w,2),np.float32);axisfield=None
 N=int(230000*(W/1280)**2);p=np.zeros((N,2),np.float32);color=np.zeros((N,3),np.float32);life=np.zeros(N,np.float32);direction=np.zeros(N,np.float32);speed=np.ones(N,np.float32);rad=np.ones(N,np.float32);alpha=np.ones(N,np.float32);variation=np.ones(N,np.float32)
 writer=cv.VideoWriter(out,cv.VideoWriter_fourcc(*'mp4v'),fps,(W,H));assert writer.isOpened();idx=0;start=time.time()
 for i in range(-12,int(seconds*fps)):
  while idx<int(max(i,0)*sfps/fps):
   ok,fr=cap.read();idx+=1
   if not ok:break
  if not ok:break
  im=sample(fr);gray=cv.cvtColor(im,cv.COLOR_BGR2GRAY);flow=dis.calc(oldgray,gray,None) if i>0 else np.zeros_like(v);diff=np.abs(gray.astype(np.float32)-oldgray.astype(np.float32))/255;oldgray=gray
  flow=np.clip(flow,-7,7);v=v*.65+blur(flow,1.15)*.35;act=blur(np.clip(np.linalg.norm(v,axis=-1)*.8+diff*4,0,1),1.4)
  g=blur(gray.astype(np.float32)/255,.7);gx=cv.Sobel(g,cv.CV_32F,1,0);gy=cv.Sobel(g,cv.CV_32F,0,1);theta=.5*np.arctan2(2*blur(gx*gy,1.6),blur(gx*gx-gy*gy,1.6))+np.pi/2;fa=np.arctan2(v[:,:,1],v[:,:,0]);mix=np.clip(np.linalg.norm(v,axis=-1)*.65,0,.85);theta+=.5*np.arctan2(np.sin(2*(fa-theta)),np.cos(2*(fa-theta)))*mix+.34*shear+.17*small;af=np.stack((np.cos(theta*2),np.sin(theta*2)),-1);axisfield=af if axisfield is None else axisfield*.52+af*.48
  V=resize(v)*sc*.55;mid=rem(V,XX-V[:,:,0]*.5,YY-V[:,:,1]*.5);paint=rem(paint,XX-mid[:,:,0],YY-mid[:,:,1]);palette=palette*.72+grade(im)*.28
  target=resize(blur(palette,1.2));inj=.021+resize(act)*.065;paint=paint*(1-inj[:,:,None])+target*inj[:,:,None]
  dead=life<=0;n=int(dead.sum())
  if n:
   px=rng.uniform(0,w-1,n*2);py=rng.uniform(0,h-1,n*2);ix=px.astype(int);iy=py.astype(int);weight=.45+.4*act[iy,ix]+.55*palette[iy,ix].max(1);sel=rng.choice(n*2,n,replace=False,p=weight/weight.sum());ix=ix[sel];iy=iy[sel];p[dead]=np.stack((px[sel],py[sel]),-1);col=palette[iy,ix];val=rng.uniform(.52,1.65,(n,1));color[dead]=np.clip(col*val+rng.normal(0,.016,(n,3)),0,1);life[dead]=rng.uniform(2.5,8.5,n);direction[dead]=theta[iy,ix]+rng.choice([0,np.pi],n)+rng.normal(0,.42,n);speed[dead]=rng.uniform(.5,2.1,n);rad[dead]=rng.uniform(.48,.92,n);alpha[dead]=rng.uniform(.35,.76,n);variation[dead]=rng.uniform(.85,1.15,n)
  ix=np.clip(p[:,0].astype(int),0,w-1);iy=np.clip(p[:,1].astype(int),0,h-1);ang=.5*np.arctan2(axisfield[iy,ix,1],axisfield[iy,ix,0]);direction+=.5*np.arctan2(np.sin(2*(ang-direction)),np.cos(2*(ang-direction)))*.32;step=np.stack((np.cos(direction),np.sin(direction)),-1)*speed[:,None]+v[iy,ix]*.24
  previous=p.copy();p+=step;life-=1;life[(p[:,0]<0)|(p[:,0]>=w-1)|(p[:,1]<0)|(p[:,1]>=h-1)]=0;p[:,0]=np.clip(p[:,0],0,w-1);p[:,1]=np.clip(p[:,1],0,h-1)
  deposit(paint,previous*sc,p*sc,color,rad*(W/1280),alpha)
  if i<0:continue
  image=(np.clip(paint,0,1)**.93*255).astype(np.uint8);writer.write(image)
  if i%24==0:cv.imwrite(out[:-4]+f'_{i:04}.jpg',image);print(i,round(time.time()-start,1),flush=True)
 writer.release();cap.release()
if __name__=='__main__':main(sys.argv[1],sys.argv[2],float(sys.argv[3]),int(sys.argv[4]),sys.argv[5] if len(sys.argv)>5 else 'flowers')
