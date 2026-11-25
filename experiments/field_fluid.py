import cv2 as cv, numpy as np, sys,time
cv.setNumThreads(3); cap=cv.VideoCapture(sys.argv[1]); output=sys.argv[2]; n=int(float(sys.argv[3])*24)
w,h=480,270; W,H=960,540; rng=np.random.default_rng(42)
X,Y=np.meshgrid(np.arange(w,dtype=np.float32),np.arange(h,dtype=np.float32)); XX,YY=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32))
kx,ky=np.meshgrid(np.fft.rfftfreq(w)*2*np.pi,np.fft.fftfreq(h)*2*np.pi); norm=kx*kx+ky*ky;norm[0,0]=1
blur=lambda x,s:cv.GaussianBlur(x,(0,0),s); resize=lambda c:cv.resize(c,(W,H)); rem=lambda x,u,v:cv.remap(x,u.astype(np.float32),v.astype(np.float32),cv.INTER_LINEAR,borderMode=cv.BORDER_REFLECT_101)
def noise(w,h,s):return cv.resize(rng.normal(0,1,(max(3,int(h/s)+1),max(3,int(w/s)+1))).astype(np.float32),(w,h),interpolation=cv.INTER_CUBIC)
def project(v):
 u=np.fft.rfft2(v[:,:,0]); z=np.fft.rfft2(v[:,:,1]); d=(kx*u+ky*z)/norm
 return np.stack((np.fft.irfft2(u-kx*d,s=(h,w)),np.fft.irfft2(z-ky*d,s=(h,w))),-1).astype(np.float32)
def grade(bgr):
 c=bgr.astype(np.float32)/255; b,g,r=cv.split(c); l=.2126*r+.7152*g+.0722*b; purple=np.clip((r+b-2*g)*3+.17,0,1); green=np.clip((g-(r+b)*.5)*2.2,0,1)
 c=np.clip(l[:,:,None]+(c-l[:,:,None])*1.8,0,1); light=np.clip((l-.12)/.73,0,1)**1.5*(.30+.95*purple+.09*green)
 c=c*.86+np.stack((purple*.26+green*.035,purple*.015+green*.045,purple*.19+green*.025),-1)
 return np.clip(c*light[:,:,None]*2.1+np.array([.025,.020,.020],np.float32),0,1).astype(np.float32)
ok,fr=cap.read();assert ok; src=cv.resize(fr,(w,h),interpolation=cv.INTER_AREA);old=cv.cvtColor(src,cv.COLOR_BGR2GRAY); dis=cv.DISOpticalFlow_create(cv.DISOPTICAL_FLOW_PRESET_MEDIUM)
vel=np.zeros((h,w,2),np.float32); pigment=resize(blur(grade(src),3.5)); tex=noise(W,H,2.2); coarse=noise(w,h,19); psi=coarse*.65+noise(w,h,6)*.23+noise(w,h,50)*.4; curl=np.stack((cv.Sobel(psi,cv.CV_32F,0,1),-cv.Sobel(psi,cv.CV_32F,1,0)),-1)*.27
writer=cv.VideoWriter(output,cv.VideoWriter_fourcc(*'mp4v'),24,(W,H));assert writer.isOpened(); origfps=cap.get(cv.CAP_PROP_FPS);prevIdx=0;start=time.time()
for i in range(n):
 target=int(i*origfps/24)
 while prevIdx<target:
  ok,fr=cap.read();prevIdx+=1
  if not ok:break
 if not ok:break
 src=cv.resize(fr,(w,h),interpolation=cv.INTER_AREA); gray=cv.cvtColor(src,cv.COLOR_BGR2GRAY);flow=dis.calc(old,gray,None) if i else np.zeros_like(vel); diff=np.abs(gray.astype(np.float32)-old.astype(np.float32))/255;old=gray
 flow=np.clip(flow,-7,7); activity=blur(np.clip(np.linalg.norm(flow,axis=-1)*.75+diff*3.5,0,1),2)
 adv=rem(vel,X-vel[:,:,0],Y-vel[:,:,1]);vel=np.clip(project(adv*.95+blur(flow,2.2)*.23+curl*.12),-4.5,4.5)
 V=resize(vel); U=V[:,:,0]*2; VV=V[:,:,1]*2; pigment=rem(pigment,XX-U*1.2,YY-VV*1.2); tex=rem(tex,XX-U*.82,YY-VV*.82)*.90+noise(W,H,1.6)*.10
 col=resize(blur(grade(src),1.2)); act=resize(activity); inject=(.009+act*.095)*np.clip(.8+tex*.7,.08,1.55); pigment=pigment*(1-inject[:,:,None])+col*inject[:,:,None]
 g=blur(gray.astype(np.float32)/255,1.1);gx=cv.Sobel(g,cv.CV_32F,1,0);gy=cv.Sobel(g,cv.CV_32F,0,1); ang=.5*np.arctan2(2*blur(gx*gy,3),blur(gx*gx-gy*gy,3))+np.pi/2; va=np.arctan2(vel[:,:,1],vel[:,:,0]); strength=np.clip(np.linalg.norm(vel,axis=-1)*1.2,0,.9);orient=ang+.5*np.arctan2(np.sin(2*(va-ang)),np.cos(2*(va-ang)))*strength
 theta=.5*np.arctan2(resize(np.sin(2*orient)),resize(np.cos(2*orient)));dx=np.cos(theta);dy=np.sin(theta);length=resize(np.clip(3.5+np.linalg.norm(vel,axis=-1)*3.5+coarse*2.8,2,15))
 texture=tex.copy();strokes=pigment.copy(); weight=1.
 for k in (-1,-.58,-.29,.29,.58,1):
  sx=XX+dx*length*k;sy=YY+dy*length*k;wt=1-abs(k)*.38;texture+=rem(tex,sx,sy)*wt;strokes+=rem(pigment,sx,sy)*wt;weight+=wt
 texture/=weight;strokes/=weight;detail=(texture-blur(texture,3.5))*1.65+texture*.32;relief=(cv.Sobel(texture,cv.CV_32F,1,0)-cv.Sobel(texture,cv.CV_32F,0,1))*.09
 out=np.clip(strokes*(1+detail[:,:,None]*1.65)+relief[:,:,None]*.026,0,1); image=(out**.93*255).astype(np.uint8);writer.write(image)
 if i in (0,48,96,n-1):cv.imwrite(output[:-4]+f'_{i:04}.jpg',image)
 if i%48==0:print(i,round(time.time()-start,1),flush=True)
writer.release();cap.release()
