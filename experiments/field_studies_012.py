'''Fresh rasterization of motion-emitted pigment; no recursive image feedback.'''
import cv2 as cv,numpy as np,sys,time
from numba import njit
cv.setNumThreads(3)
@njit(cache=True)
def raster(a,p,d,c,r,l,op):
 H,W,_=a.shape
 for k in range(len(p)):
  x,y=p[k];dx,dy=d[k];R=int(l[k]+r[k]+1)
  for j in range(max(0,int(y)-R),min(H,int(y)+R+1)):
   for i in range(max(0,int(x)-R),min(W,int(x)+R+1)):
    u=((i-x)*dx+(j-y)*dy)/l[k];v=(-(i-x)*dy+(j-y)*dx)/r[k];q=u*u+v*v
    if q<1:
     t=op[k]*(1-q)**1.3
     for z in range(3):a[j,i,z]+=c[k,z]*t
     a[j,i,3]+=t

def render(src,out,seconds,W,mode='flowers'):
 w,h=640,360;H=W*9//16//2*2;sc=W/w;ss=W/1280;rng=np.random.default_rng(411);fps=24
 blur=lambda a,s:cv.GaussianBlur(a,(0,0),s);resize=lambda a:cv.resize(a,(W,H))
 def noise(s):return cv.resize(rng.normal(0,1,(max(3,int(h/s)),max(3,int(w/s)))).astype(np.float32),(w,h),interpolation=cv.INTER_CUBIC)
 cloud=noise(32);mid=noise(12);phase=noise(21);psi=noise(23)+noise(9)*.32;curl=np.stack((cv.Sobel(psi,cv.CV_32F,0,1),-cv.Sobel(psi,cv.CV_32F,1,0)),-1)*.36
 cap=cv.VideoCapture(src);sfps=cap.get(cv.CAP_PROP_FPS);ok,fr=cap.read();assert ok and sfps>0
 def sample(fr):
  hh,ww=fr.shape[:2];c=.48 if mode=='flowers' else 1.;cw=int(min(ww,hh*16/9)*c);ch=int(min(hh,ww*9/16)*c);return cv.resize(fr[(hh-ch)//2:(hh+ch)//2,(ww-cw)//2:(ww+cw)//2],(w,h),interpolation=cv.INTER_AREA)
 def palette(im):
  c=im.astype(np.float32)/255;B,G,R=cv.split(c);l=.0722*B+.7152*G+.2126*R
  if mode!='flowers':return np.clip(.045+.76*l[:,:,None]**.68+(c-l[:,:,None])*.95,.02,.98).astype(np.float32),np.clip(c.max(2)-c.min(2),0,1)
  lab=cv.cvtColor(im,cv.COLOR_BGR2LAB).astype(np.float32);key=blur(np.clip((lab[:,:,1]-119)/15,0,1)*np.clip((B+R-2*G)*4.2+.34,0,1),.7)
  br=np.clip((l-.15)/.65,0,1);cool=np.clip(.46+.40*phase+.20*mid,0,1);pink=np.stack((.44+.35*cool,.27+.07*cool,.78-.44*cool),-1);pink*=np.clip(.32+1.12*br+.27*cloud+.22*mid,.12,1.25)[:,:,None]
  leaf=np.stack((.055+.105*l,.062+.12*l,.055+.09*l),-1)*np.clip(.85+.28*cloud+.19*mid,.32,1.5)[:,:,None]
  return np.clip(leaf*(1-key[:,:,None]**.8)+pink*key[:,:,None]**.8+.022,.018,.97).astype(np.float32),key
 N=int(320000*ss**2);p=np.zeros((N,2),np.float32);col=np.zeros((N,3),np.float32);life=np.zeros(N,np.float32);span=np.ones(N,np.float32);angle=np.zeros(N,np.float32);rad=np.ones(N,np.float32);length=np.ones(N,np.float32);opacity=np.ones(N,np.float32);drift=np.zeros((N,2),np.float32)
 gray=cv.cvtColor(sample(fr),cv.COLOR_BGR2GRAY);dis=cv.DISOpticalFlow_create(cv.DISOPTICAL_FLOW_PRESET_MEDIUM);vel=np.zeros((h,w,2),np.float32);idx=0;writer=cv.VideoWriter(out,cv.VideoWriter_fourcc(*'mp4v'),fps,(W,H));assert writer.isOpened();start=time.time()
 for i in range(-16,int(seconds*fps)):
  while idx<int(max(i,0)*sfps/fps):
   ok,fr=cap.read();idx+=1
   if not ok:break
  if not ok:break
  im=sample(fr);g=cv.cvtColor(im,cv.COLOR_BGR2GRAY);f=dis.calc(gray,g,None) if i>0 else np.zeros_like(vel);change=np.abs(g.astype(np.float32)-gray.astype(np.float32))/255;gray=g
  if mode=='flowers':f-=np.median(f[::4,::4],axis=(0,1))*.7
  f=np.clip(f,-7,7);act=blur(np.clip(np.linalg.norm(f,axis=2)*.8+change*5,0,1),1.4);vel=vel*.54+blur(f,1.25)*.46
  c,key=palette(im);gx=cv.Sobel(g.astype(np.float32)/255,cv.CV_32F,1,0);gy=cv.Sobel(g.astype(np.float32)/255,cv.CV_32F,0,1);theta=.5*np.arctan2(2*blur(gx*gy,1.7),blur(gx*gx-gy*gy,1.7))+np.pi/2
  flow=vel*1.10+curl*(.26+.58*act[:,:,None]);fa=np.arctan2(flow[:,:,1],flow[:,:,0]);strength=np.clip(np.linalg.norm(flow,axis=2)*.7,.18,.88);theta+=.5*np.arctan2(np.sin(2*(fa-theta)),np.cos(2*(fa-theta)))*strength+.24*mid
  dead=life<=0;n=int(dead.sum())
  if n:
   weights=(.06+act*1.8+key*.37)*np.clip(1+.24*cloud+.16*mid,.15,1.7);cdf=np.cumsum(weights.ravel(),dtype=np.float64);ind=np.searchsorted(cdf,rng.random(n)*cdf[-1]);ix=ind%w;iy=ind//w
   p[dead]=np.column_stack((ix+rng.random(n),iy+rng.random(n)))+rng.normal(0,1.2,(n,2))+flow[iy,ix]*rng.uniform(0,2.5,(n,1));col[dead]=np.clip(c[iy,ix]*rng.uniform(.48,1.65,(n,1))+rng.normal(0,.016,(n,3)),0,.99);span[dead]=rng.uniform(7,22,n);life[dead]=span[dead]*(rng.uniform(.1,1,n) if i==-16 else 1);angle[dead]=theta[iy,ix]+rng.normal(0,.34,n);rad[dead]=rng.uniform(.65,1.65,n)*ss;length[dead]=rng.uniform(1.0,2.8,n)*ss;opacity[dead]=rng.uniform(.45,1.1,n);drift[dead]=rng.normal(0,.17,(n,2))
  ix=np.clip(p[:,0].astype(int),0,w-1);iy=np.clip(p[:,1].astype(int),0,h-1);a=theta[iy,ix];angle+=.5*np.arctan2(np.sin(2*(a-angle)),np.cos(2*(a-angle)))*.35;p+=flow[iy,ix]*.92+drift;life-=1;life[(p[:,0]<0)|(p[:,0]>=w-1)|(p[:,1]<0)|(p[:,1]>=h-1)]=0
  if i<0:continue
  age=np.clip(life/span,0,1);fade=np.minimum(1,age*3)*np.minimum(1,(1-age)*5+.22);d=np.column_stack((np.cos(angle),np.sin(angle))).astype(np.float32);acc=np.zeros((H,W,4),np.float32);raster(acc,(p*sc).astype(np.float32),d,col,rad,length,(opacity*fade).astype(np.float32))
  broad=blur(acc,2.8*ss);broad2=blur(acc,8*ss);b=broad[:,:,:3]/np.maximum(broad[:,:,3,None],.04);b2=broad2[:,:,:3]/np.maximum(broad2[:,:,3,None],.06);b=b*.85+b2*.15;ground=resize(blur(c,5))*.65;cov=1-np.exp(-broad[:,:,3]*2.5);b=ground*(1-cov[:,:,None])+b*cov[:,:,None]
  local=acc[:,:,:3]/np.maximum(acc[:,:,3,None],1e-5);cover=1-np.exp(-acc[:,:,3]*2.2);img=b*(1-cover[:,:,None])+local*cover[:,:,None];img+=np.clip(broad[:,:,3,None]-.25,-.18,.35)*b*.32;img*=np.clip(1+resize(cloud)*.10+resize(mid)*.09,.64,1.3)[:,:,None];img=(np.clip(img,0,1)**.94*255).astype(np.uint8);writer.write(img)
  if i%24==0:cv.imwrite(out[:-4]+f'_{i:04}.jpg',img);print(i,'births',n,'elapsed',round(time.time()-start,1),flush=True)
 writer.release();cap.release()
if __name__=='__main__':render(sys.argv[1],sys.argv[2],float(sys.argv[3]),int(sys.argv[4]),sys.argv[5] if len(sys.argv)>5 else 'flowers')
