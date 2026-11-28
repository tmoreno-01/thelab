#!/usr/bin/env python3
"""Train the compact neural paper-light model used by Lantern Field.

This is a neural PRT prototype: a small squared-ReLU MLP learns the response
of thin warm paper to three fixed interior light lobes as a function of local
position, surface normal, view direction and paper thickness.

The training targets are a physically based synthetic thin-sheet scattering
reference (Beer-Lambert absorption + angular transmission + forward scatter),
not Blender Cycles ground truth. This keeps the first browser experiment
self-contained and reproducible. Replace the target generator with Cycles
multi-light-group renders for a higher-fidelity production bake.
"""
from __future__ import annotations
import base64, json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "prt-weights.json"

def samples(count=60000):
    rng=np.random.default_rng(20261128)
    y=rng.uniform(-.88,.88,count).astype(np.float32)
    th=rng.uniform(0,2*np.pi,count).astype(np.float32)
    c=np.cos(th); s=np.sin(th); expo=2/2.55
    sx=np.sign(c)*np.abs(c)**expo
    sz=np.sign(s)*np.abs(s)**expo
    v=(y+.88)/1.76
    rad=(.405*(1-.055*y)+.045*np.sin(np.pi*v)).astype(np.float32)
    drdy=-.405*.055+.045*np.pi/1.76*np.cos(np.pi*v)
    n=np.stack([sx,-drdy,sz],axis=1)
    n/=np.linalg.norm(n,axis=1,keepdims=True)
    pos=np.stack([rad*sx,y,rad*sz],axis=1).astype(np.float32)
    view=rng.normal(size=(count,3)).astype(np.float32)
    view[:,1]*=.75
    view+=n*rng.uniform(.25,1.4,(count,1)).astype(np.float32)
    view/=np.linalg.norm(view,axis=1,keepdims=True)
    thick=(.65+.20*np.sin(th*7+.8)+.09*np.sin(th*31+y*18)+.06*rng.random(count)).astype(np.float32)
    sources=np.array([[0,-.62,0],[0,-.10,0],[.08,-.38,.05]],dtype=np.float32)
    absorb=np.array([1.55,1.9,1.7],dtype=np.float32)
    tints=np.array([[1,.40,.12],[1,.64,.30],[1,.52,.20]],dtype=np.float32)
    targets=[]
    for j,src in enumerate(sources):
        lv=src[None,:]-pos
        dist=np.linalg.norm(lv,axis=1,keepdims=True)
        l=lv/np.maximum(dist,1e-5)
        ci=np.clip(np.sum(-n*l,axis=1),0,1)
        cv=np.clip(np.sum(n*view,axis=1),0,1)
        phase=np.clip(np.sum(-l*view,axis=1),0,1)
        trans=np.exp(-absorb[j]*thick/np.maximum(ci,.13))
        diffuse=.20+.80*np.sqrt(ci)
        forward=.24+.76*phase**1.8
        edge=.10+.90*(1-cv)**1.6
        broad=.14+.28*(1-ci)**2
        energy=trans*diffuse*(.35+.65*forward)*(1+broad)
        energy+=.025*edge*np.exp(-1.3*thick)
        col=energy[:,None]*tints[j][None,:]
        col[:,2]*=.76+.12*cv
        targets.append(col)
    X=np.concatenate([pos/np.array([.5,1,.5],dtype=np.float32),n,view,((thick-.7)/.3)[:,None]],axis=1).astype(np.float32)
    Y=np.concatenate(targets,axis=1).astype(np.float32)
    return X,Y

def train():
    X,Y=samples()
    rng=np.random.default_rng(7731)
    dims=[10,16,16,9]
    params=[]
    for ni,no in zip(dims[:-1],dims[1:]):
        params.append((rng.normal(size=(ni,no))*np.sqrt(1.2/ni)).astype(np.float32))
        params.append(np.zeros(no,dtype=np.float32))
    m=[np.zeros_like(p) for p in params]
    v=[np.zeros_like(p) for p in params]
    for step in range(1,2201):
        ids=rng.integers(0,len(X),size=768)
        xb,yb=X[ids],Y[ids]
        z1=xb@params[0]+params[1]; a1=.5*np.maximum(z1,0)**2
        z2=a1@params[2]+params[3]; a2=.5*np.maximum(z2,0)**2
        pred=a2@params[4]+params[5]
        diff=pred-yb; dp=2*diff/diff.size
        grads=[None,None,None,None,None,None]
        dz2=(dp@params[4].T)*np.maximum(z2,0)
        grads[2]=a1.T@dz2; grads[3]=dz2.sum(0)
        da1=dz2@params[2].T
        dz1=da1*np.maximum(z1,0)
        grads[0]=xb.T@dz1; grads[1]=dz1.sum(0)
        grads[4]=a2.T@dp; grads[5]=dp.sum(0)
        for k,(p,g) in enumerate(zip(params,grads)):
            m[k]=.9*m[k]+.1*g; v[k]=.999*v[k]+.001*g*g
            mh=m[k]/(1-.9**step); vh=v[k]/(1-.999**step)
            p-=.0018*mh/(np.sqrt(vh)+1e-8)
        if step%500==0:
            print(f"step {step}: MSE {float(np.mean(diff**2)):.6f}")
    # held-out error
    z1=X[10000:]@params[0]+params[1]; a1=.5*np.maximum(z1,0)**2
    z2=a1@params[2]+params[3]; a2=.5*np.maximum(z2,0)**2
    pred=a2@params[4]+params[5]
    rel=float(np.mean(np.abs(pred-Y[10000:]))/np.mean(Y[10000:]))
    flat=np.concatenate([p.ravel() for p in params]).astype("<f4")
    data={
      "format":"base64-f32le","architecture":dims,
      "activation":"0.5 * max(x,0)^2","weights":int(len(flat)),
      "training":{"samples":len(X),"steps":2200,"heldOutRelativeMAE":rel,
        "target":"three-source thin-paper transmission model",
        "note":"Physically based synthetic thin-sheet scattering reference; not Blender Cycles ground truth."},
      "data":base64.b64encode(flat.tobytes()).decode("ascii")
    }
    OUT.write_text(json.dumps(data,separators=(",",":")))
    print("Saved",OUT,"held-out relative MAE",round(rel,4))

if __name__=="__main__": train()
