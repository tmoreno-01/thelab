"""Motion-driven pigment deposition. Independent implementation.
Usage: python field_studies_002.py source.mp4 output.mp4 [seconds] [width]
"""
import sys, cv2 as cv, numpy as np
from numba import njit
from pathlib import Path
cv.setNumThreads(3)
@njit(cache=True)
def paint(canvas, color, orient, activity, rnd, layer):
    h,w,_=canvas.shape; sh,sw,_=color.shape; factor=w/1280.
    for i in range(len(rnd)):
        u=rnd[i]; x=u[0]*(w-1); y=u[1]*(h-1); ix=min(sw-1,int(x*sw/w)); iy=min(sh-1,int(y*sh/h))
        act=activity[iy,ix]; r,g,b=color[iy,ix,0],color[iy,ix,1],color[iy,ix,2]
        lum=(r+g+b)/3
        if u[2] > (.22+.45*act+.48*min(1.,lum*3.5)): continue
        if layer==0: length=(9+u[3]*24)*factor; width=(2.5+u[4]*7)*factor
        elif layer==1: length=(4+u[3]*12)*factor; width=(.85+u[4]*2.8)*factor
        else: length=(1.8+u[3]*6)*factor; width=(.45+u[4]*1.4)*factor
        length*=.6+.9*act; ang=orient[iy,ix]+(u[5]-.5)*(.85 if layer==0 else 1.05)
        ca=np.cos(ang); sa=np.sin(ang); radius=int(length+width+2)
        light=.53+u[6]*1.13; tint=(u[7]-.5)*.035
        cr=min(1.,max(0.,r*light+tint)); cg=min(1.,max(0.,g*light+tint*.55)); cb=min(1.,max(0.,b*light-tint*.4))
        opacity=(.24+.40*u[8]) if layer==0 else (.36+.55*u[8]); opacity*=.55+.45*act
        for yy in range(max(0,int(y)-radius),min(h,int(y)+radius+1)):
            for xx in range(max(0,int(x)-radius),min(w,int(x)+radius+1)):
                dx=xx-x;dy=yy-y; a=(dx*ca+dy*sa)/length; v=(-dx*sa+dy*ca)/width
                if abs(a)>=1 or abs(v)>1.5:continue
                v-=.24*a*a*np.sin(u[9]*6.283)+.10*np.sin(a*8+u[9]*6.28)
                d=a*a+v*v*(.85+.45*abs(a))
                if d>=1:continue
                bristle=.55+.45*np.sin(v*16+u[9]*30+a*2)
                hashv=((xx*73856093)^(yy*19349663)^(i*83492791)) & 1023
                alpha=opacity*(1-d)**.75*(.38+.62*bristle)*(.6+.4*hashv/1023.)
                canvas[yy,xx,0]+=(cr-canvas[yy,xx,0])*alpha
                canvas[yy,xx,1]+=(cg-canvas[yy,xx,1])*alpha
                canvas[yy,xx,2]+=(cb-canvas[yy,xx,2])*alpha
    return canvas

def main():
    cap=cv.VideoCapture(sys.argv[1]); path=sys.argv[2]; seconds=float(sys.argv[3]) if len(sys.argv)>3 else 10; W=int(sys.argv[4]) if len(sys.argv)>4 else 1920; H=W*9//16//2*2
    w,h=480,270; fps=24; rng=np.random.default_rng(937); X,Y=np.meshgrid(np.arange(w,dtype=np.float32),np.arange(h,dtype=np.float32)); XX,YY=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32))
    blur=lambda a,s:cv.GaussianBlur(a,(0,0),s); rem=lambda a,x,y:cv.remap(a,x.astype(np.float32),y.astype(np.float32),cv.INTER_LINEAR,borderMode=cv.BORDER_REFLECT101)
    def noise(s):return cv.resize(rng.normal(0,1,(max(3,int(h/s)),max(3,int(w/s)))).astype(np.float32),(w,h),interpolation=cv.INTER_CUBIC)
    coarse=noise(32); medium=noise(10); fine=noise(4); psi=coarse*.8+medium*.35+fine*.1; curl=np.stack((cv.Sobel(psi,cv.CV_32F,0,1),-cv.Sobel(psi,cv.CV_32F,1,0)),-1)*.17
    kx,ky=np.meshgrid(np.fft.rfftfreq(w)*2*np.pi,np.fft.fftfreq(h)*2*np.pi); norm=kx*kx+ky*ky;norm[0,0]=1
    def project(v):
        u=np.fft.rfft2(v[:,:,0]); z=np.fft.rfft2(v[:,:,1]); d=(kx*u+ky*z)/norm
        return np.stack((np.fft.irfft2(u-kx*d,s=(h,w)),np.fft.irfft2(z-ky*d,s=(h,w))),-1).astype(np.float32)
    def grade(im):
        c=im.astype(np.float32)/255.; b,g,r=cv.split(c); lum=.0722*b+.7152*g+.2126*r
        mag=np.clip((r+b-2*g)*3+.12,0,1); floral=blur(mag,1.4); value=np.clip((lum-.12)/.72,0,1)**1.32
        cool=np.clip(.5+coarse*.32+medium*.12,0,1); gold=np.clip((g-b)*1.8,0,.7)*value; base=np.stack((.08+.36*value+.36*floral+.26*floral*cool, .07+.29*value+.19*floral+.31*gold, .075+.34*value+.40*floral-.21*floral*cool+.47*gold),-1)
        chrom=c-lum[:,:,None]; out=base+chrom*(.33+.63*floral[:,:,None]); mask=np.clip(.36+.70*floral+.45*value+.18*coarse, .12,1)
        return np.clip(out*mask[:,:,None]+.012,0,.92).astype(np.float32)
    ok,fr=cap.read(); assert ok; old=None; vel=np.zeros((h,w,2),np.float32); axes=None; canvas=None; dis=cv.DISOpticalFlow_create(cv.DISOPTICAL_FLOW_PRESET_MEDIUM)
    out=cv.VideoWriter(path,cv.VideoWriter_fourcc(*'mp4v'),fps,(W,H)); assert out.isOpened(); sourcefps=cap.get(cv.CAP_PROP_FPS); idx=0
    for i in range(int(seconds*fps)):
        while idx<int(i*sourcefps/fps):
            ok,fr=cap.read();idx+=1
            if not ok:break
        if not ok:break
        im=cv.resize(fr,(w,h),interpolation=cv.INTER_AREA); gray=cv.cvtColor(im,cv.COLOR_BGR2GRAY); flow=dis.calc(old,gray,None) if old is not None else np.zeros_like(vel);diff=np.abs(gray.astype(np.float32)-old.astype(np.float32))/255 if old is not None else np.zeros((h,w),np.float32);old=gray
        flow=np.clip(flow,-6,6);act=blur(np.clip(np.linalg.norm(flow,axis=-1)*.65+diff*3,0,1),2)
        vel=project(rem(vel,X-vel[:,:,0],Y-vel[:,:,1])*.94+blur(flow,2)*.25+curl*.18);vel=np.clip(vel,-3.5,3.5)
        g=gray.astype(np.float32)/255; gx=cv.Sobel(g,cv.CV_32F,1,0);gy=cv.Sobel(g,cv.CV_32F,0,1); theta=.5*np.arctan2(2*blur(gx*gy,3),blur(gx*gx-gy*gy,3))+np.pi/2
        va=np.arctan2(vel[:,:,1],vel[:,:,0]); weight=np.clip(np.linalg.norm(vel,axis=-1)*.8,0,.8); theta+=.5*np.arctan2(np.sin(2*(va-theta)),np.cos(2*(va-theta)))*weight+.25*medium+.12*coarse
        ax=np.stack((np.cos(2*theta),np.sin(2*theta)),-1);axes=ax if axes is None else axes*.80+ax*.20;theta=.5*np.arctan2(axes[:,:,1],axes[:,:,0]); color=grade(im)
        if canvas is None:canvas=cv.resize(blur(color,5),(W,H))*.75
        else:
            V=cv.resize(vel,(W,H)); canvas=rem(canvas,XX-V[:,:,0]*(W/w)*.85,YY-V[:,:,1]*(H/h)*.85); canvas*=.998
        for layer,count in enumerate((8500,23000,42000) if i==0 else (650,2200,6200)):
            paint(canvas,blur(color, 2.6 if layer==0 else 1.2 if layer==1 else .4),theta,act,rng.random((int(count*W/1280),10),dtype=np.float32),layer)
        frame=np.clip(canvas*255,0,255).astype(np.uint8);out.write(frame)
        if i in (0,24,48,96,144):cv.imwrite(str(Path(path).with_suffix(''))+f'_{i:04}.jpg',frame)
        if i%24==0:print('frame',i,flush=True)
    out.release();cap.release()
if __name__=='__main__':main()
