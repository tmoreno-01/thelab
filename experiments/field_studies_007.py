'''Keyed pigment transport with directional microtexture, independently reconstructed from the process film.'''
import cv2 as cv, numpy as np,sys,time
cv.setNumThreads(3);cv.setRNGSeed(7)
def render(src,out,seconds,W,mode='natural'):
 w,h=480,270;H=W*9//16//2*2;scale=W/w;rng=np.random.default_rng(873);fps=24
 X,Y=np.meshgrid(np.arange(w,dtype=np.float32),np.arange(h,dtype=np.float32));XX,YY=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32));blur=lambda z,s:cv.GaussianBlur(z,(0,0),s);resize=lambda z:cv.resize(z,(W,H));rem=lambda z,x,y:cv.remap(z,x.astype(np.float32),y.astype(np.float32),cv.INTER_LINEAR,borderMode=cv.BORDER_REFLECT101)
 def noise(sw,sh,s):return cv.resize(rng.normal(0,1,(max(3,int(sh/s)),max(3,int(sw/s)))).astype(np.float32),(sw,sh),interpolation=cv.INTER_CUBIC)
 cap=cv.VideoCapture(src);sfps=cap.get(cv.CAP_PROP_FPS);ok,fr=cap.read();assert ok and sfps>0
 def sample(fr):
  hh,ww=fr.shape[:2];crop=.76 if mode=='flowers' else 1.;cw=int(min(ww,hh*16/9)*crop);ch=int(min(hh,ww*9/16)*crop);return cv.resize(fr[(hh-ch)//2:(hh+ch)//2,(ww-cw)//2:(ww+cw)//2],(w,h),interpolation=cv.INTER_AREA)
 first=sample(fr);lab=cv.cvtColor(first,cv.COLOR_BGR2LAB).astype(np.float32);_,_,centers=cv.kmeans(lab.reshape(-1,3)[::3].copy(),14,None,(cv.TERM_CRITERIA_EPS+cv.TERM_CRITERIA_MAX_ITER,25,.25),2,cv.KMEANS_PP_CENTERS);base=cv.cvtColor(centers[None].astype(np.uint8),cv.COLOR_LAB2BGR)[0].astype(np.float32)/255
 l=base@np.array([.0722,.7152,.2126],np.float32);ch=base-l[:,None]
 if mode=='flowers':
  floral=np.clip((base[:,0]+base[:,2]-2*base[:,1])*5+.15,0,1);v=.068+.38*l**1.45+.43*floral*l**.65;colors=v[:,None]+ch*(.24+1.65*floral[:,None])+floral[:,None]*np.array([.105,-.025,.14],np.float32)
 else:colors=(.055+.77*l**.68)[:,None]+ch*.9
 colors=np.clip(colors,.025,.96).astype(np.float32)
 def keys(im):
  lab=cv.cvtColor(im,cv.COLOR_BGR2LAB).astype(np.float32);d=lab[:,:,None,:]-centers[None,None,:,:];d[:,:,:,0]*=.75;dist=np.sum(d*d,axis=3);weight=np.exp(-(dist-dist.min(2,keepdims=True))/85);return (weight/weight.sum(2,keepdims=True)).astype(np.float32)
 coarse=noise(w,h,22);medium=noise(w,h,8);grain=noise(W,H,1.5);grain2=noise(W,H,4);grain3=noise(W,H,9)
 old=cv.cvtColor(first,cv.COLOR_BGR2GRAY);dis=cv.DISOpticalFlow_create(cv.DISOPTICAL_FLOW_PRESET_MEDIUM);vel=np.zeros((h,w,2),np.float32);orient=None
 pigment=resize(blur(keys(first),1.15));idx=0;writer=cv.VideoWriter(out,cv.VideoWriter_fourcc(*'mp4v'),fps,(W,H));assert writer.isOpened();start=time.time()
 for i in range(int(seconds*fps)):
  while idx<int(i*sfps/fps):
   ok,fr=cap.read();idx+=1
   if not ok:break
  if not ok:break
  im=sample(fr);gray=cv.cvtColor(im,cv.COLOR_BGR2GRAY);flow=-dis.calc(gray,old,None) if i else np.zeros_like(vel);change=np.abs(gray.astype(np.float32)-old.astype(np.float32))/255;old=gray
  flow=np.clip(flow,-8,8);activity=blur(np.clip(np.linalg.norm(flow,axis=-1)*.75+change*4,0,1),1.6);vel=vel*.57+blur(flow,1.1)*.43
  g=blur(gray.astype(np.float32)/255,1.0);gx=cv.Sobel(g,cv.CV_32F,1,0)*.25;gy=cv.Sobel(g,cv.CV_32F,0,1)*.25;theta=.5*np.arctan2(2*blur(gx*gy,2),blur(gx*gx-gy*gy,2))+np.pi/2;fa=np.arctan2(vel[:,:,1],vel[:,:,0]);strength=np.clip(np.linalg.norm(vel,axis=-1)*.75,0,.85);theta+=.5*np.arctan2(np.sin(2*(fa-theta)),np.cos(2*(fa-theta)))*strength+.23*medium
  ax=np.stack((np.cos(theta*2),np.sin(theta*2)),-1);orient=orient*.38+ax*.62 if i else ax
  V=resize(vel)*scale*.80;mid=rem(V,XX-V[:,:,0]*.5,YY-V[:,:,1]*.5);qx=XX-mid[:,:,0];qy=YY-mid[:,:,1]
  if i:
   pigment=rem(pigment,qx,qy);grain=rem(grain,qx,qy)*.77+noise(W,H,1.5)*.23;grain2=rem(grain2,qx,qy)*.90+noise(W,H,4)*.10;grain3=rem(grain3,qx,qy)*.98+noise(W,H,9)*.02
  target=resize(blur(keys(im),1.05));act=resize(activity);injection=np.clip(.025+act*.16,0,.22)*np.clip(.90+grain2*.23,.25,1.5);pigment=pigment*(1-injection[:,:,None])+target*injection[:,:,None]
  t=.5*np.arctan2(resize(orient[:,:,1]),resize(orient[:,:,0]));dx=np.cos(t);dy=np.sin(t);L=resize(np.clip(1.8+np.linalg.norm(vel,axis=-1)*2.7+coarse*1.6,1,8))*scale
  wx=XX+grain3*2.6*scale+grain2*1.2*scale;wy=YY+rem(grain3,XX+13,YY+9)*2.6*scale+grain*.95*scale
  pp=np.maximum(pigment,0)**1.35;pp/=np.maximum(pp.sum(2,keepdims=True),1e-6);color=pp@colors;painted=rem(color,wx,wy);detail=grain.copy();detail2=grain2.copy();total=1.
  for sign in [-1,1]:
   px=wx.copy();py=wy.copy();ux=dx*sign;uy=dy*sign
   for j in range(1,4):
    px+=ux*L*.33;py+=uy*L*.33;nx=rem(dx,px,py);ny=rem(dy,px,py);flip=np.where(nx*ux+ny*uy<0,-1.,1.);ux=nx*flip;uy=ny*flip;wt=1-j*.15;painted+=rem(color,px,py)*wt;detail+=rem(grain,px,py)*wt;detail2+=rem(grain2,px,py)*wt;total+=wt
  painted=painted/total*.88+rem(color,wx,wy)*.12;detail/=total;detail2/=total;rough=(detail-blur(detail,2.3))*.90+detail2*.37+grain3*.10;cloud=resize(coarse);mixlight=np.clip(1+cloud*.23+grain3*.13,.48,1.5);rgb=painted*mixlight[:,:,None]*(1+rough[:,:,None])+rough[:,:,None]*.022
  height=detail*.035;nx=cv.Sobel(height,cv.CV_32F,1,0);ny=cv.Sobel(height,cv.CV_32F,0,1);light=np.clip(1+(-nx*.11+ny*.08),.85,1.15);image=(np.clip(rgb*light[:,:,None],0,1)**.94*255).astype(np.uint8);writer.write(image)
  if i%24==0:cv.imwrite(out[:-4]+f'_{i:04}.jpg',image);print(i,round(time.time()-start,1),flush=True)
 writer.release();cap.release()
if __name__=='__main__':render(sys.argv[1],sys.argv[2],float(sys.argv[3]),int(sys.argv[4]),sys.argv[5] if len(sys.argv)>5 else 'natural')
