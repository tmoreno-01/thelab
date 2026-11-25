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
  hh,ww=im.shape[:2];cw=int(min(ww,hh*16/9));ch=int(min(hh,ww*9/16));im=im[(hh-ch)//2:(hh+ch)//2,(ww-cw)//2:(ww+cw)//2];im=cv.resize(im,(w,h),interpolation=cv.INTER_AREA);g=cv.cvtColor(im,cv.COLOR_BGR2GRAY)
  if old is None:f=np.zeros((h,w,2),np.float32);d=np.zeros((h,w),np.float32)
  else:
   f=dis.calc(old,g,None);b=dis.calc(g,old,None);f*=np.exp(-np.linalg.norm(f+rem(b,X+f[:,:,0],Y+f[:,:,1]),axis=-1)*.5)[:,:,None];d=np.abs(g.astype(np.float32)-old.astype(np.float32))/255
  gf=g.astype(np.float32)/255;gx=cv.Sobel(gf,cv.CV_32F,1,0);gy=cv.Sobel(gf,cv.CV_32F,0,1);ang=.5*np.arctan2(2*blur(gx*gy,2.5),blur(gx*gx-gy*gy,2.5))+np.pi/2;structures.append(np.stack((np.cos(2*ang),np.sin(2*ang)),-1).astype(np.float16));old=g;frames.append(im);flows.append(f.astype(np.float16));changes.append((d*255).astype(np.uint8))
 c.release();assert len(frames)>2;np.savez_compressed(out,color=frames,motion=flows,change=changes,structure=structures);print('Extracted',len(frames),'observations',flush=True)

if __name__=='__main__': analyze(sys.argv[1],sys.argv[2])
