'''Bristle-based pigment transport, Technical reference: David Li Fluid Paint (MIT). Input observation NPZ from field_studies_003.py analyze.'''
import numpy as np, cv2 as cv, sys,time
from numba import njit
cv.setNumThreads(3)
@njit(cache=True)
def splat(rgb, mass, pts, old, colors, widths, opacity):
 H,W=mass.shape
 for n in range(len(pts)):
  x,y=pts[n]; px,py=old[n]; dx=x-px;dy=y-py;d=dx*dx+dy*dy+1e-6;r=widths[n];o=opacity[n]
  for j in range(max(0,int(min(y,py)-r-1)),min(H,int(max(y,py)+r+2))):
   for i in range(max(0,int(min(x,px)-r-1)),min(W,int(max(x,px)+r+2))):
    t=max(0.,min(1.,((i-px)*dx+(j-py)*dy)/d));q=((i-px-dx*t)**2+(j-py-dy*t)**2)**.5/r
    if q>=1:continue
    a=o*(1-q)**.8
    for k in range(3):rgb[j,i,k]+=(colors[n,k]-rgb[j,i,k])*a
    mass[j,i]=min(2.,mass[j,i]+a*.16)
def main():
 data=np.load(sys.argv[1]);out=sys.argv[2];secs=float(sys.argv[3]);W=int(sys.argv[4]);H=W*9//16//2*2;w,h=480,270;scale=W/w;rng=np.random.default_rng(212)
 F=data['motion'].astype(np.float32);C=data['color'].astype(np.float32)/255;D=data['change'].astype(np.float32)/255
 X,Y=np.meshgrid(np.arange(w,dtype=np.float32),np.arange(h,dtype=np.float32));XX,YY=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32));blur=lambda a,s:cv.GaussianBlur(a,(0,0),s);rem=lambda a,x,y:cv.remap(a,x.astype(np.float32),y.astype(np.float32),cv.INTER_LINEAR,borderMode=cv.BORDER_REFLECT101)
 def noise(s):return cv.resize(rng.normal(0,1,(max(3,h//s),max(3,w//s))).astype(np.float32),(w,h),interpolation=cv.INTER_CUBIC)
 a,b,c=noise(48),noise(18),noise(6);psi=a*2.4+b*.9+c*.17;curl=np.stack((cv.Sobel(psi,cv.CV_32F,0,1),-cv.Sobel(psi,cv.CV_32F,1,0)),-1)*.60
 kx,ky=np.meshgrid(np.fft.rfftfreq(w)*2*np.pi,np.fft.fftfreq(h)*2*np.pi);norm=kx*kx+ky*ky;norm[0,0]=1
 def proj(v):
  u=np.fft.rfft2(v[:,:,0]);z=np.fft.rfft2(v[:,:,1]);p=(kx*u+ky*z)/norm;return np.stack((np.fft.irfft2(u-kx*p,s=(h,w)),np.fft.irfft2(z-ky*p,s=(h,w))),-1).astype(np.float32)
 im=C[5];B,G,R=cv.split(im);lum=.0722*B+.7152*G+.2126*R;flower=blur(np.clip((B+R-2*G)*6+.04,0,1),1.0);gold=blur(np.clip((G-B)*2.7,0,1),1);light=np.clip((lum-.16)/.65,0,1);cool=np.clip(.5+a*.46+b*.18,0,1);goldmask=np.clip(.3+b*.4+a*.3,0,1)
 purple=np.stack((.32+.43*cool,.23+.20*(1-cool),.68-.30*cool),-1);leaf=np.stack((.024+.12*gold*goldmask,.027+.23*gold*goldmask,.023+.34*gold*goldmask),-1);palette=leaf*(1-flower[:,:,None])+purple*flower[:,:,None];illumination=np.clip(.44+a*.28+b*.19+c*.06,.035,1.0);palette=np.clip(palette*(.25+light[:,:,None]*1.15)*illumination[:,:,None]*1.65+.008,0,.95).astype(np.float32)
 activity=blur(np.clip(np.linalg.norm(F,axis=-1).mean(0)*1.35+D.mean(0)*5,0,1),1.5);v=proj(F.mean(0)*.35+curl*.55)
 N=int(12000*scale);K=5;life=np.zeros(N,np.float32);p=np.zeros((N,2),np.float32);col=np.zeros((N,3),np.float32);axis=np.zeros(N,np.float32);length=np.ones(N,np.float32);width=np.ones(N,np.float32);pressure=np.ones(N,np.float32);phase=rng.uniform(0,6.28,N).astype(np.float32);br=rng.normal(0,1,(N,K)).astype(np.float32);brush=rng.uniform(.25,1,(N,K)).astype(np.float32)
 rgb=cv.resize(blur(palette,5),(W,H))*.32;mass=np.zeros((H,W),np.float32);writer=cv.VideoWriter(out,cv.VideoWriter_fourcc(*'mp4v'),24,(W,H));assert writer.isOpened();start=time.time()
 for i in range(-12,int(secs*24)):
  j=max(0,int(i*15/24))%(len(F)-1);f=F[j];drive=.17 if i<24 else .04;v=proj(rem(v,X-v[:,:,0],Y-v[:,:,1])*.94+blur(f,1.8)*drive+curl*.15);v=np.clip(v,-3,3)
  V=cv.resize(v,(W,H))*scale*.38;mid=rem(V,XX-V[:,:,0]*.5,YY-V[:,:,1]*.5);rgb=rem(rgb,XX-mid[:,:,0],YY-mid[:,:,1])*.998;mass=rem(mass,XX-mid[:,:,0],YY-mid[:,:,1])*.972
  dead=life<=0;n=dead.sum()
  if n:
   px=rng.uniform(0,w-1,n*4);py=rng.uniform(0,h-1,n*4);ix=px.astype(int);iy=py.astype(int);weight=.10+.45*activity[iy,ix]+.8*palette[iy,ix].max(1);sel=rng.choice(n*4,n,replace=False,p=weight/weight.sum());ix=ix[sel];iy=iy[sel];p[dead]=np.stack((px[sel],py[sel]),-1);col[dead]=np.clip(palette[iy,ix]*rng.uniform(.48,1.6,(n,1))+rng.normal(0,.012,(n,3)),0,1);life[dead]=rng.uniform(12,60,n);axis[dead]=rng.uniform(-np.pi,np.pi,n);length[dead]=rng.uniform(.25,1.6,n);width[dead]=rng.uniform(.15,1.05,n);pressure[dead]=rng.uniform(.15,.55,n)
  ix=np.clip(p[:,0].astype(int),0,w-1);iy=np.clip(p[:,1].astype(int),0,h-1);vv=v[iy,ix];angle=np.arctan2(vv[:,1],vv[:,0]);axis+=np.arctan2(np.sin(angle-axis),np.cos(angle-axis))*.20;motion=vv*.32+np.stack((np.cos(axis),np.sin(axis)),-1)*length[:,None]*.46
  old=p.copy();p+=motion;life-=1;life[(p[:,0]<0)|(p[:,0]>=w-1)|(p[:,1]<0)|(p[:,1]>=h-1)]=0;p[:,0]=np.clip(p[:,0],0,w-1);p[:,1]=np.clip(p[:,1],0,h-1)
  normal=np.stack((-np.sin(axis),np.cos(axis)),-1);offset=normal[:,None,:]*br[:,:,None]*width[:,None,None]*1.3;bend=np.sin(phase+i*.09)[:,None,None]*offset*.2;aa=(old[:,None,:]+offset-bend)*scale;bb=(p[:,None,:]+offset+bend)*scale
  splat(rgb,mass,bb.reshape(-1,2),aa.reshape(-1,2),np.repeat(col,K,axis=0),np.clip((width[:,None]*brush*.35+.19)*scale,.48,2.8).reshape(-1),np.clip(pressure[:,None]*brush,0,1).reshape(-1))
  if i<0:continue
  gx=cv.Sobel(mass,cv.CV_32F,1,0)*.65;gy=cv.Sobel(mass,cv.CV_32F,0,1)*.65;nz=1/np.sqrt(1+gx*gx+gy*gy);nd=np.clip((-.45*gx+.28*gy+.848)*nz,0,1);nh=np.clip((-.235*gx+.145*gy+.96)*nz,0,1);rough=.68;spec=(rough**2/(np.pi*(nh*nh*(rough**2-1)+1)**2))*.025;image=np.clip(rgb*(.64+.52*nd[:,:,None])+spec[:,:,None]*np.minimum(1,mass[:,:,None]),0,1);image=(image**.93*255).astype(np.uint8);writer.write(image)
  if i%24==0:cv.imwrite(out[:-4]+f'_{i:04}.jpg',image);print(i,round(time.time()-start,1),flush=True)
 writer.release()
if __name__=='__main__':main()
