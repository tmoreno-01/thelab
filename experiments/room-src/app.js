import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as Mu from '@meimu/mutracer';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),loading=document.querySelector('#loading');
const scene=new THREE.Scene(),objects=[],loader=new GLTFLoader(),textures=new THREE.TextureLoader(),missing=[];
const M=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const oak=M(0x9b7450,.53),white=M(0xd7d0c4,.85),metal=M(0x2c2b2a,.36,.55),brass=M(0x9c793b,.28,.85),paper=M(0xd6ccba,.91);
function mesh(geo,mat,x,y,z,p=scene){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);p.add(m);return m}
function box(w,h,d,m,x,y,z,p=scene){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,p)}
function group(n,x,y,z,a=0){const g=new THREE.Group();g.name=n;g.position.set(x,y,z);g.rotation.y=a;scene.add(g);objects.push(g);return g}
function lathe(profile,m,g,x=0,y=0,z=0){return mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),48),m,x,y,z,g)}
let assets={models:{},textures:{}};
async function texture(url,space,repeat){const t=await textures.loadAsync(url);t.colorSpace=space;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);return t}
async function surface(id,m,repeat){const a=assets.textures[id];if(!a)return m;try{m=m.clone();if(a.diff){m.map=await texture(a.diff,THREE.SRGBColorSpace,repeat);m.color.setHex(0xffffff)}if(a.nor){m.normalMap=await texture(a.nor,THREE.NoColorSpace,repeat);m.normalScale.set(.45,.45)}if(a.rough)m.roughnessMap=await texture(a.rough,THREE.NoColorSpace,repeat);return m}catch(e){missing.push(id);return m}}
async function model(id,n,x,y,z,width,rot,fallback){const g=group(n,x,y,z,rot);try{if(!assets.models[id])throw Error('missing model');const a=(await loader.loadAsync(assets.models[id])).scene;a.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(a),s=b.getSize(new THREE.Vector3());a.scale.multiplyScalar(width/Math.max(s.x,s.z));a.updateMatrixWorld(true);b.setFromObject(a);const c=b.getCenter(new THREE.Vector3());a.position.add(new THREE.Vector3(-c.x,-b.min.y,-c.z));g.add(a)}catch(e){missing.push(n);fallback(g)}return g}
function vase(g){lathe([[0,0],[.07,0],[.11,.08],[.11,.15],[.075,.23],[.045,.27],[.05,.30],[.035,.30],[.028,.25],[0,.03]],M(0xb89377,.35),g)}
function chair(g){box(.8,.18,.73,M(0x554639,.9),0,.47,0,g);let b=box(.78,.7,.16,M(0x554639,.9),0,.87,-.3,g);b.rotation.x=-.15;for(let x of [-.39,.39]){box(.06,.48,.75,oak,x,.24,0,g);box(.06,.07,.75,oak,x,.67,0,g)}}
function table(g){box(1.24,.075,.67,M(0xa79b89,.45),0,.43,0,g);for(let x of [-.52,.52])for(let z of [-.24,.24])box(.055,.41,.055,oak,x,.21,z,g)}
function plant(g){lathe([[0,0],[.16,0],[.21,.28],[.19,.30],[0,.30]],M(0x946444,.85),g);for(let j=0;j<8;j++){let a=j*2.4,p=mesh(new THREE.SphereGeometry(.14,24,16),M(0x3a5335,.65),Math.cos(a)*.16,.34+j*.06,Math.sin(a)*.16,g);p.scale.set(.6,1.5,.24);p.rotation.z=Math.cos(a)*.8}}
function book(n,x,y,z,c,w=.25,h=.035,d=.17,rot=0){let g=group(n,x,y,z,rot),m=M(c,.8);box(w,.006,d,m,0,.003,0,g);box(w,.006,d,m,0,h-.003,0,g);box(w-.012,h-.012,d-.008,paper,.005,h/2,0,g);box(.012,h,d,m,-w/2+.006,h/2,0,g)}
function art(n,x,y,w,h,seed){const g=group(n,x,y,-2.83);box(w+.06,h+.06,.04,oak,0,0,0,g);box(w,h,.045,paper,0,0,.005,g);let c=document.createElement('canvas');c.width=512;c.height=640;let ctx=c.getContext('2d'),s=seed;function r(){s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}ctx.fillStyle='#d4c9b8';ctx.fillRect(0,0,512,640);for(let j=0;j<50;j++){ctx.fillStyle=['#383b39','#b8876c','#999b8e','#e1d6c6','#54473e'][Math.floor(r()*5)];ctx.globalAlpha=.2+r()*.65;ctx.beginPath();ctx.ellipse(r()*512,r()*640,30+r()*180,20+r()*150,r()*6,0,Math.PI*2);ctx.fill()}let t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;box(w*.81,h*.83,.05,new THREE.MeshStandardMaterial({map:t,roughness:.8}),0,0,.014,g)}
async function start(){try{
try{assets=await fetch('./assets-local/manifest.json').then(r=>{if(!r.ok)throw Error('manifest');return r.json()})}catch(e){missing.push('asset library')}
loading.textContent='Loading physically based surface textures…';
const [floor,wall,rug]=await Promise.all([surface('wood_floor',M(0x8b7157,.63),[4,4]),surface('white_plaster_02',white,[2,2]),surface('fabric_pattern_07',M(0xb7ab9b,.92),[3,2])]);
box(7.6,.16,7,floor,0,-.08,0);box(7.6,3.5,.16,wall,0,1.75,-3);box(.16,3.5,7,wall,3.72,1.75,0);box(7.6,.16,7,white,0,3.55,0);
box(7.5,.10,.05,white,0,.05,-2.88);box(.05,.10,7,white,3.61,.05,0);
box(.16,3.5,1.65,wall,-3.72,1.75,-2.72);box(.16,3.5,1.75,wall,-3.72,1.75,2.63);box(.16,.4,3.65,wall,-3.72,.2,0);box(.16,.42,3.65,wall,-3.72,3.29,0);
for(let z of [-1.8,0,1.8])box(.1,2.69,.05,white,-3.63,1.74,z);
let rg=group('woven rug',-.55,0,.55,.02);box(3.5,.018,2.5,rug,0,.012,0,rg);
loading.textContent='Loading textured furnishings…';
await Promise.all([model('modern_arm_chair_01','leather armchair',-1.36,.03,.24,1.03,-.34,chair),model('modern_coffee_table_01','stone coffee table',.35,.03,.65,1.25,.03,table),model('potted_plant_02','potted plant',2.72,.01,-.95,.65,.5,plant)]);
let shelf=group('oak shelving',1.48,0,-2.47);for(let h of [.12,.64,1.16,1.68,2.2])box(2.6,.045,.47,oak,0,h,0,shelf);for(let x of [-1.22,1.22])for(let z of [-.19,.19])box(.035,2.25,.035,metal,x,1.125,z,shelf);
await Promise.all([model('ceramic_vase_04','shelf jug',.72,1.704,-2.47,.22,.3,vase),model('ceramic_vase_04','small vessel',2.48,2.224,-2.47,.17,-.7,vase),model('ceramic_vase_04','table vase',.62,.48,.52,.16,-.2,vase)]);
for(let j=0;j<7;j++)book('shelf book '+(j+1),.34+j*.10,.663,-2.46,[0x574b38,0xb1a18a,0x403a36,0x9e715e,0x6e7773,0xc3b6a2,0x343e46][j],.085,.22,.20);
book('table book',.04,.48,.78,0x5b5246,.31,.045,.23,.12);book('small table book',.04,.525,.78,0xc0b5a4,.23,.032,.17,-.05);
for(let j=0;j<3;j++)book('stack book '+(j+1),2.24,.143+j*.044,-2.45,[0x8c7d6b,0xb2a999,0x575b51][j],.33,.044,.25,j*.04);
art('large framed artwork',-1.71,1.81,.82,1.12,275);art('small framed artwork',-.48,1.86,.49,.67,172);
let lamp=group('floor lamp',-2.65,0,.38,.2);mesh(new THREE.CylinderGeometry(.23,.23,.035,64),metal,0,.02,0,lamp);mesh(new THREE.CylinderGeometry(.012,.012,1.65,24),metal,0,.84,0,lamp);let arm=mesh(new THREE.CylinderGeometry(.012,.012,.65,24),metal,.30,1.64,0,lamp);arm.rotation.z=Math.PI/2;lathe([[.04,0],[.18,0],[.20,.025],[.115,.20],[.04,.20]],brass,lamp,.60,1.42,0);
let sculpt=group('brass sculpture',1.78,1.184,-2.47);mesh(new THREE.TorusKnotGeometry(.13,.034,112,16),brass,0,.17,0,sculpt).rotation.x=.6;box(.25,.045,.22,metal,0,.022,0,sculpt);
let glass=group('glass tumbler',.68,.48,.84);lathe([[0,0],[.052,0],[.059,.008],[.065,.12],[.06,.12],[.054,.014],[0,.014]],new THREE.MeshPhysicalMaterial({color:0xf1ffff,roughness:.065,transmission:1,thickness:.012,ior:1.5}),glass);
objects.forEach(g=>{g.userData.home={p:g.position.clone(),q:g.quaternion.clone()}});
const daylight=new THREE.RectAreaLight(0xfff3e6,12,3.4,2.55);daylight.position.set(-3.50,1.78,0);daylight.lookAt(0,1.2,0);scene.add(daylight);const fill=new THREE.RectAreaLight(0xe4edff,1.6,3,2.5);fill.position.set(.1,2.4,3.3);fill.lookAt(0,1,-1.4);scene.add(fill);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);camera.position.set(2.5,2.05,5.3);const controls=new OrbitControls(camera,canvas);controls.target.set(0,1.14,-.6);controls.minDistance=2.7;controls.maxDistance=9;controls.maxPolarAngle=Math.PI*.49;controls.minAzimuthAngle=-.42;controls.maxAzimuthAngle=.66;controls.update();
function resize(){canvas.width=Math.min(Math.round(innerWidth*Math.min(devicePixelRatio,1.5)),1920);canvas.height=Math.round(canvas.width*innerHeight/innerWidth);camera.aspect=canvas.width/canvas.height;camera.updateProjectionMatrix()}resize();addEventListener('resize',resize);
loading.textContent='Compiling MuTracer path-tracing shaders…';if(!Mu.THREESync)throw Error('Renderer version lacks THREESync');
const engine=new Mu.Engine({canvas});engine.on?.('error',e=>{status.textContent='Renderer: '+String(e);console.error(e)});const sync=new Mu.THREESync(engine,{scene,camera,controls});const loop=new Mu.RenderLoop(engine,{sync});try{loop.final.setDenoiser({type:'jnlm'})}catch(e){console.warn(e)}loop.start();
let selected=null,drag=null,move=true;const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(),hit=new THREE.Vector3();
function cast(e){let r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);camera.updateMatrixWorld();scene.updateMatrixWorld(true);ray.setFromCamera(ndc,camera)}
function select(g){selected=g;status.textContent=g?'Selected: '+g.name+' — drag / rotate / lift':'Select a furnishing · drag empty space to orbit'}
canvas.addEventListener('pointerdown',e=>{if(!move||e.button!==0)return;cast(e);let hits=ray.intersectObjects(objects,true);if(!hits.length){select(null);return}let g=hits[0].object;while(g.parent&&!objects.includes(g))g=g.parent;if(!objects.includes(g))return;select(g);controls.enabled=false;plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,1,0),g.position);if(ray.ray.intersectPlane(plane,hit))drag={g,offset:g.position.clone().sub(hit)};canvas.setPointerCapture(e.pointerId);e.stopImmediatePropagation()},true);
canvas.addEventListener('pointermove',e=>{if(!drag)return;cast(e);if(ray.ray.intersectPlane(plane,hit)){let p=hit.clone().add(drag.offset);drag.g.position.x=THREE.MathUtils.clamp(p.x,-3.1,3.1);drag.g.position.z=THREE.MathUtils.clamp(p.z,-2.72,2.85)}e.stopImmediatePropagation()},true);
function release(){drag=null;controls.enabled=true}canvas.addEventListener('pointerup',release,true);canvas.addEventListener('pointercancel',release,true);
document.querySelector('#mode').onclick=e=>{move=!move;e.target.textContent=move?'move object':'orbit camera';select(null)};
for(let [id,fn] of [['left',g=>g.rotation.y-=Math.PI/12],['right',g=>g.rotation.y+=Math.PI/12],['up',g=>g.position.y+=.075],['down',g=>g.position.y=Math.max(0,g.position.y-.075)]])document.querySelector('#'+id).onclick=()=>{if(selected)fn(selected)};
document.querySelector('#reset').onclick=()=>{objects.forEach(g=>{g.position.copy(g.userData.home.p);g.quaternion.copy(g.userData.home.q)});select(null)};
document.querySelector('#full').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
loading.hidden=true;status.textContent='Select and drag furnishings · MuTracer'+(missing.length?' · '+missing.length+' asset fallbacks':'');window.roomTest={objects,engine,loop,select,missing};
}catch(e){loading.hidden=false;loading.textContent='Room could not start:\n'+String(e);console.error(e)}}
start();