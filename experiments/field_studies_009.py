'''Frame-local motion-gated pigment emission. Original footage is the source, not the reference film.'''
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
 H=W*9//16//2*2;w,h=480,270;sc=W/w;fps=24;rng=np.random.default_rng(624);X,Y=np.meshgrid(np.arange(w,dtype=np.float32),np.arange(h,dtype=np.float32));XX,YY=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32));blur=lambda a,s:cv.GaussianBlur(a,(0,0),s);resize=lambda a:cv.resize(a,(W,H));rem=lambda a,x,y:cv.remap(a,x.astype(np.float32),y.astype(np.float32),cv.INTER_LINEAR,borderMode=cv.BORDER_REFLECT101)
 def noise(s):return cv.resize(rng.normal(0,1,(max(3,int(h/s)),max(3,int(w/s)))).astype(np.float32),(w,h),interpolation=cv.INTER_CUBIC)
 cloud=noise(34);medium=noise(10);small=noise(3.5);hue=noise(24);shear=noise(18)
 cap=cv.VideoCapture(src);sfps=cap.get(cv.CAP_PROP_FPS);ok,fr=cap.read();assert ok and sfps>0
 def sample(fr):
  hh,ww=fr.shape[:2];crop=.62 if mode=='flowers' else 1.;cw=int(min(ww,hh*16/9)*crop);ch=int(min(hh,ww*9/16)*crop);return cv.resize(fr[(hh-ch)//2:(hh+ch)//2,(ww-cw)//2:(ww+cw)//2],(w,h),interpolation=cv.INTER_AREA)
 def grade(im):
  c=im.astype(np.float32)/255;B,G,R=cv.split(c);l=.0722*B+.7152*G+.2126*R
  if mode!='flowers':return np.clip(.065+.77*l[:,:,None]**.70+(c-l[:,:,None])*.95,.025,.97).astype(np.float32)
  key=blur(np.clip((B+R-2*G)*4.5+.10,0,1),.7);bright=np.clip((l-.10)/.67,0,1);cool=np.clip(.48+.36*hue+.25*medium,0,1)
  violet=np.stack((.40+.46*cool,.27+.20*(1-cool),.86-.49*cool),-1);v=(.32+1.28*bright**.76)*( .87+.24*cloud+.15*medium)
  leaf=np.stack((.072+.12*l,.075+.15*l,.068+.11*l+.035*np.clip(cloud+.3,0,1)),-1)
  leaf*=np.clip(.83+.32*cloud+.20*medium,.44,1.55)[:,:,None];base=leaf*(1-key[:,:,None])+violet*key[:,:,None]*v[:,:,None];base+=.04+(c-l[:,:,None])*.20
  return np.clip(base,.024,.95).astype(np.float32)
 im=sample(fr);gray=cv.cvtColor(im,cv.COLOR_BGR2GRAY);oldgray=gray;palette=grade(im);paint=resize(blur(palette,1.8))*.9;dis=cv.DISOpticalFlow_create(cv.DISOPTICAL_FLOW_PRESET_MEDIUM);v=np.zeros((h,w,2),np.float32);axisfield=None
 # Each frame creates new independent deposits; no persistent particle state.
 N=int(175000*(W/1280)**2);activity=np.zeros((h,w),np.float32);floor=np.array([.058,.055,.048],np.float32)
 warp_x=noise(14);warp_y=noise(14)
 writer=cv.VideoWriter(out,cv.VideoWriter_fourcc(*'mp4v'),fps,(W,H));assert writer.isOpened();idx=0;start=time.time()
 for i in range(-16,int(seconds*fps)):
  while idx<int(max(i,0)*sfps/fps):
   ok,fr=cap.read();idx+=1
   if not ok:break
  if not ok:break
  im=sample(fr);gray=cv.cvtColor(im,cv.COLOR_BGR2GRAY);flow=dis.calc(oldgray,gray,None) if i>0 else np.zeros_like(v);diff=np.abs(gray.astype(np.float32)-oldgray.astype(np.float32))/255;oldgray=gray
  flow=np.clip(flow,-7,7);v=v*.42+blur(flow,1.15)*.58;act=blur(np.clip(np.linalg.norm(v,axis=-1)*.8+diff*4,0,1),1.4)
  g=blur(gray.astype(np.float32)/255,.7);gx=cv.Sobel(g,cv.CV_32F,1,0);gy=cv.Sobel(g,cv.CV_32F,0,1);theta=.5*np.arctan2(2*blur(gx*gy,1.6),blur(gx*gx-gy*gy,1.6))+np.pi/2;fa=np.arctan2(v[:,:,1],v[:,:,0]);mix=np.clip(np.linalg.norm(v,axis=-1)*.65,0,.85);theta+=.5*np.arctan2(np.sin(2*(fa-theta)),np.cos(2*(fa-theta)))*mix+.28*shear+.17*small;af=np.stack((np.cos(theta*2),np.sin(theta*2)),-1);axisfield=af if axisfield is None else axisfield*.52+af*.48
  activity=activity*.43+act*.57
  # Colour keys seed a low-frequency underpainting, independent of the micro-deposits.
  palette=grade(im);V=resize(v)*sc*.36;paint=rem(paint,XX-V[:,:,0],YY-V[:,:,1]);paint=paint*.991+floor*.009
  target=resize(blur(palette,1.4));inj=.009+resize(activity)*.018;paint=paint*(1-inj[:,:,None])+target*inj[:,:,None]
  # Fresh births at every step. Strong motion receives a much higher birth density.
  sal=np.clip(palette.max(2)-palette.min(2),0,1);edge=np.clip(np.hypot(gx,gy),0,1)
  weights=(.018+1.45*activity+.16*sal+.08*edge)*np.clip(1+.40*cloud+.25*medium,.18,1.8)
  count=int(N*(.55+.75*min(1.,float(activity.mean())*3)))
  cdf=np.cumsum(weights.ravel(),dtype=np.float64);ind=np.searchsorted(cdf,rng.random(count)*cdf[-1]);ix=ind%w;iy=ind//w;local=activity[iy,ix]
  ang=.5*np.arctan2(axisfield[iy,ix,1],axisfield[iy,ix,0])+rng.normal(0,.40,count)
  vel=v[iy,ix];spread=(.45+1.5*local);offset=rng.normal(0,1,(count,2))*spread[:,None]
  p=np.column_stack((ix+rng.random(count)+warp_x[iy,ix]*1.8,iy+rng.random(count)+warp_y[iy,ix]*1.8))+vel*rng.uniform(.0,2.9,(count,1))+offset
  step=np.column_stack((np.cos(ang),np.sin(ang)))*rng.uniform(2.0,5.7,(count,1))*(W/1280)
  pos=p*sc;col=np.clip(palette[iy,ix]*rng.uniform(.53,1.62,(count,1))+rng.normal(0,.017,(count,3)),0,1).astype(np.float32)
  rad=(rng.uniform(.34,.67,count)*(W/1280)).astype(np.float32);alpha=(rng.uniform(.26,.65,count)*(.68+.32*local)).astype(np.float32)
  deposit(paint,(pos-step*.5).astype(np.float32),(pos+step*.5).astype(np.float32),col,rad,alpha)
  if i<0:continue
  image=(np.clip(paint,0,1)**.93*255).astype(np.uint8);writer.write(image)
  if i%24==0:cv.imwrite(out[:-4]+f'_{i:04}.jpg',image);print(i,'fresh splats',count,'motion',round(float(activity.mean()),3),'elapsed',round(time.time()-start,1),flush=True)
 writer.release();cap.release()
if __name__=='__main__':main(sys.argv[1],sys.argv[2],float(sys.argv[3]),int(sys.argv[4]),sys.argv[5] if len(sys.argv)>5 else 'flowers')
