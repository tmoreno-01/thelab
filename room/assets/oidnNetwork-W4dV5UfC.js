import{V as Cn}from"./version-E-4C4Wkf.js";class En{dims=[];paddedDims=[];layout="x";dataType="Float32";getByteSize(){let e=1;for(const t of this.paddedDims)e*=t;return this.dataType==="Float32"?e*=4:this.dataType==="Float16"&&(e*=2),e}}class An{desc;data;constructor(e,t){this.desc=e,this.data=t}}class On{_view;offset=0;constructor(e){this._view=e}read(e){const t=this._view,i=this.offset;switch(this.offset+=e,e){case 1:return t.getUint8(i);case 2:return t.getUint16(i,!0);case 4:return t.getUint32(i,!0);case 8:return Number(t.getBigUint64(i,!0));default:throw new Error("unsupported read size")}}}function Mn(n){const e=new Uint8Array(n),t=new On(new DataView(n));if(t.read(2)!==16855)throw new Error("invalid or corrupted weights blob");const r=t.read(1);if(t.read(1),r!==2)throw new Error("unsupported weights blob version");const o=t.read(8);t.offset=o;const a=t.read(4),u=new Map;for(let s=0;s<a;++s){const l=new En,p=t.read(2),c=new TextDecoder().decode(e.subarray(t.offset,t.offset+p));t.offset+=p;const d=t.read(1);for(let w=0;w<d;++w)l.dims.push(t.read(4));l.paddedDims=[...l.dims],new TextDecoder().decode(e.subarray(t.offset,t.offset+d))==="oihw"&&(l.layout="oihw"),t.offset+=d;const f=String.fromCharCode(t.read(1));if(f==="f")l.dataType="Float32";else if(f==="h")l.dataType="Float16";else throw new Error("invalid tensor data type");const g=t.read(8),_=e.slice(g,g+l.getByteSize());u.set(c,new An(l,_))}return u}function Nn(n,e){return n.channels===e.channels}const Ne=8;class Ue{autoUpdateOutputBuffer=!0;_label;_device;_outputBuffers={};_pipeline;_bindGroups=[];_needsUpdatePipeline=!0;_needsResizeBuffer=!0;_inputs=[];_outputs=[];_uniforms=[];_uniformBuffers={};_width=10;_height=10;_execWidth;_execHeight;_csCode="";_csMain;_csDefine;_groupOffsets={inputs:0,uniforms:1,outputs:2};constructor(e,t,i){this._label=e,this._device=t,this._csMain=i.csMain,this._csDefine=i.csDefine,this._inputs=i.inputs,this._outputs=i.outputs,this._uniforms=i.uniforms,this.autoUpdateOutputBuffer=i.autoUpdateOutputBuffer??!0,i.uniforms.forEach(r=>{this._uniformBuffers[r.label]=t.createBuffer({label:this._label,size:r.data.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._device.queue.writeBuffer(this._uniformBuffers[r.label],0,r.data)})}setCSCode({csDefine:e,csMain:t}){this._csDefine=e,this._csMain=t,this._needsUpdatePipeline=!0}setSize(e,t){e=Math.ceil(e),t=Math.ceil(t);const i=e!==this._width||t!==this._height;this._width=e,this._height=t,i&&(this._needsResizeBuffer=!0,this._needsUpdatePipeline=!0)}setExecuteSize(e,t){e=Math.ceil(e),t=Math.ceil(t),this._execWidth=e,this._execHeight=t}setOutputParams(e){this.autoUpdateOutputBuffer&&this._updateOutputBuffers(e),this._needsUpdatePipeline=!0}setOutputBuffers(e){this._outputBuffers=Object.keys(e).reduce((t,i)=>(t[i]={buffer:e[i],params:{channels:4}},t),{})}setUniform(e,t){const i=this._uniformBuffers[e];this._device.queue.writeBuffer(i,0,t)}getOutput(e){return this._needsResizeBuffer&&this.autoUpdateOutputBuffer&&(this._resizeOutputBuffers(),this._needsResizeBuffer=!1),this._outputBuffers[e].buffer}dispose(e=!0){Object.keys(this._uniformBuffers).forEach(t=>{this._uniformBuffers[t].destroy()}),e&&Object.keys(this._outputBuffers).forEach(t=>{this._outputBuffers[t].buffer.destroy()})}_createBuffer(e){const t=this._width*this._height*4*4;return this._device.createBuffer({label:this._label,size:Math.max(t,80),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}_resizeOutputBuffers(){const e=this._outputBuffers;for(const t in e){const{buffer:i,params:r}=e[t];i.destroy(),e[t].buffer=this._createBuffer(r)}}_updateOutputBuffers(e){const t=this._outputBuffers;for(const i in e){const r=e[i];if(!Nn(r,t[i]?.params||{})){t[i]?.buffer.destroy();const o=this._createBuffer(r);t[i]={buffer:o,params:r}}}}_updatePipeline(e,t){if(!this._needsUpdatePipeline)return;this._needsUpdatePipeline=!1;const i=this._device,r=this._getFullCs(e,t);r!==this._csCode&&(this._csCode=r,this._pipeline=i.createComputePipeline({label:this._label,layout:"auto",compute:{module:i.createShaderModule({label:this._label,code:r}),entryPoint:"main"}}),this._updateBindGroups())}_getFullCs(e,t){const i=this._inputs,r=this._uniforms;let o=0;const a=this._groupOffsets={inputs:0,uniforms:0,outputs:0};return i.length>0&&o++,r.length>0&&(a.uniforms=o,o++),a.outputs=o,`
${i.sort().map((s,l)=>{const p=`@group(${a.inputs}) @binding(${l}) `,c=`in_${s}`;return t[s]==="texture"?`${p} var ${c}: texture_2d<f32>;`:`${p} var<storage, read> ${c}: array<vec${e[s].channels}f>;`}).join(`
`)}
${this._uniforms.map((s,l)=>`@group(${a.uniforms}) @binding(${l}) var<uniform> ${s.label}: ${s.type};`).join(`
`)}

${this._outputs.map((s,l)=>`@group(${a.outputs}) @binding(${l}) var<storage, read_write> out_${s}: array<vec${this._outputBuffers[s].params.channels}f>;`).join(`
`)}
${this._csDefine??""}
@compute @workgroup_size(${Ne}, ${Ne}, 1)
fn main(@builtin(global_invocation_id) globalId: vec3u) {
${this._csMain}
}
`}_updateBindGroups(){const e=[],t=this._device,i=this._groupOffsets;this._uniforms.length>0&&(e[i.uniforms]=t.createBindGroup({label:this._label,layout:this._pipeline.getBindGroupLayout(i.uniforms),entries:this._uniforms.map((r,o)=>({binding:o,resource:{buffer:this._uniformBuffers[r.label]}}))})),this._bindGroups=e}createPass(e,t){this._needsResizeBuffer&&this.autoUpdateOutputBuffer&&(this._resizeOutputBuffers(),this._needsResizeBuffer=!1);const i=this._inputs.reduce((a,u)=>(a[u]=t[u].buffer?"buffer":"texture",a),{});this._updatePipeline(t,i);const r=this._groupOffsets;this._inputs.length>0&&(this._bindGroups[r.inputs]=this._device.createBindGroup({label:this._label,layout:this._pipeline.getBindGroupLayout(r.inputs),entries:this._inputs.map((a,u)=>({binding:u,resource:t[a].buffer?{buffer:t[a].buffer}:t[a].texture.createView()}))})),this._bindGroups[r.outputs]=this._device.createBindGroup({label:this._label,layout:this._pipeline.getBindGroupLayout(r.outputs),entries:this._outputs.map((a,u)=>({binding:u,resource:{buffer:this._outputBuffers[a].buffer}}))});const o=e.beginComputePass();o.setPipeline(this._pipeline),this._bindGroups.forEach((a,u)=>{o.setBindGroup(u,a)}),o.dispatchWorkgroups(Math.ceil((this._execWidth??this._width)/Ne),Math.ceil((this._execHeight??this._height)/Ne),1),o.end()}}const yi=1412.83765,wi=1.64593172,vi=.431384981,xi=-.00294139609,bi=.192653254,$i=.00626026094,ki=.998620152,Un=15794576e-13,zn=.0322087631,Ln=.00223151711,Dn=.370974749,Ii=65504,Ti=Pi(Ii),Wn=1/Ti,Rn=Ti,Bi=Math.log(Ii+1),Gn=1/Bi;function Pi(n){return n<=Un?yi*n:n<=zn?wi*Math.pow(n,vi)+xi:bi*Math.log(n+$i)+ki}function Yn(n){return n<=Ln?n/yi:n<=Dn?Math.pow((n-xi)/wi,1/vi):Math.exp((n-ki)/bi)-$i}function Xn(n,e){return e==="log"?Math.log(n+1)*Gn:Pi(n)*Wn}function Fn(n,e){return e==="log"?Math.exp(n*Bi)-1:Yn(n*Rn)}function Vn({data:n,channels:e,inputScale:t,transfer:i="pu"}){const r=new Float32Array(n);for(let o=0;o<r.length;o+=e)for(let a=0;a<3;a++)r[o+a]=Xn(r[o+a]*t,i);return r}function Hn({data:n,channels:e,inputScale:t,transfer:i="pu"}){const r=new Float32Array(n),o=1/t;for(let a=0;a<r.length;a+=e)for(let u=0;u<3;u++)r[a+u]=Fn(r[a+u],i)*o;return r}const Si=1412.83765,Ci=1.64593172,Ei=.431384981,Ai=-.00294139609,Oi=.192653254,Mi=.00626026094,Ni=.998620152,Ui=15794576e-13,zi=.0322087631,jn=.00223151711,Kn=.370974749;function qn(n){return n<=Ui?n=Si*n:n<=zi?n=Ci*Math.pow(n,Ei)+Ai:n=Oi*Math.log(n+Mi)+Ni,n}const Li=65504,Di=qn(Li),Zn=1/Di,Jn=Di,mt=Math.log(Li+1),Qn=1/mt;class ut{x;y;width;height;constructor(e,t,i,r){this.x=e,this.y=t,this.width=i,this.height=r}}function er({data:n,channels:e}){let t=0;for(let a=0;a<n.length;a+=e){const u=n[a],s=n[a+1],l=n[a+2],p=.212671*u+.71516*s+.072169*l;t+=Math.log2(p+1e-4)}const i=n.length/e,r=t/i;return .18/Math.pow(2,r)}const Dt=`
const a = ${Si};
const b = ${Ci};
const c = ${Ei};
const d = ${Ai};
const e = ${Oi};
const f = ${Mi};
const g = ${Ni};
const y0 =${Ui};
const y1 =${zi};
const x0 =${jn};
const x1 =${Kn};

const normScale = ${Zn};
const rcpNormScale = ${Jn};
`;class tr{_device;_isHDR;_hdrTransfer;_inputPassAux;_inputPassColor;_outputPass;_copyPass;_isInputTexture;constructor(e,t,i="pu"){this._device=e,this._isHDR=t,this._hdrTransfer=i;const r=[{label:"inputScale",type:"f32",data:new Float32Array([1])},{label:"inputSize",type:"vec2i",data:new Int32Array(2)},{label:"outputSize",type:"vec2i",data:new Int32Array(2)},{label:"inputOffset",type:"vec2i",data:new Int32Array(2)}];this._inputPassAux=new Ue("inputPassAux",this._device,{inputs:["color","albedo","normal"],outputs:["color","albedo","normal"],uniforms:r,csDefine:"",csMain:""}),this._inputPassColor=new Ue("inputPassColor",this._device,{inputs:["color"],outputs:["color"],uniforms:r,csDefine:"",csMain:""}),this._outputPass=new Ue("outputPass",this._device,{inputs:["color","raw"],outputs:["color"],uniforms:[{label:"inputScale",type:"f32",data:new Float32Array([1])},{label:"inputSize",type:"vec2i",data:new Int32Array(2)},{label:"outputSize",type:"vec2i",data:new Int32Array(2)},{label:"imageSize",type:"vec2i",data:new Int32Array(2)},{label:"inputOffset",type:"vec2i",data:new Int32Array(2)},{label:"outputOffset",type:"vec2i",data:new Int32Array(2)}],csDefine:"",csMain:""}),this._copyPass=new Ue("copyPass",this._device,{inputs:["color"],outputs:["color"],autoUpdateOutputBuffer:!1,uniforms:[{label:"size",type:"vec2i",data:new Int32Array(2)}],csMain:`
let outIdx = i32(globalId.x + globalId.y * u32(size.x));
out_color[outIdx] = textureLoad(in_color, globalId.xy, 0);
`}),this._inputPassAux.setOutputParams({color:{channels:3},albedo:{channels:3},normal:{channels:3}}),this._inputPassColor.setOutputParams({color:{channels:3}}),this._outputPass.setOutputParams({color:{channels:4}})}_updatePasses(e,t=!1){if(this._isInputTexture!=null&&this._isInputTexture===e)return;this._isInputTexture=e;const i=this._isHDR,r=this._hdrTransfer==="log"?"fn HDRForward(y: f32) -> f32 { return log(y + 1.0) * logNormScale; }":`fn HDRForward(y: f32) -> f32 {
  if (y <= y0) { return a * y * normScale; }
  else if (y <= y1) { return (b * pow(y, c) + d) * normScale; }
  else { return (e * log(y + f) + g) * normScale; }
}`,o=this._hdrTransfer==="log"?"fn HDRInverse(x: f32) -> f32 { return exp(x * logXMax) - 1.0; }":`fn HDRInverse(x: f32) -> f32 {
  let y = x * rcpNormScale;
  if (y <= x0) { return y / a; }
  else if (y <= x1) { return pow((y - d) / b, 1 / c); }
  else { return exp((y - g) / e) - f; }
}`,a=`
${Dt}
const logXMax = ${mt};
const logNormScale = ${Qn};
${r}`;function u(l){return e?`textureLoad(in_${l}, vec2u(inputPosition), 0)`:`in_${l}[inIdx]`}const s=`
let x = i32(globalId.x);
let y = i32(globalId.y);
let inputPosition = clamp(
  vec2i(x, y) + inputOffset,
  vec2i(0),
  inputSize - vec2i(1)
);
let inIdx = inputPosition.y * inputSize.x + inputPosition.x;
let col = ${u("color")};

let outIdx = y * outputSize.x + x;

if (${t}) {
  // Denoise the inversed alpha. Or the anti aliased edge will be too dark after denoised
  out_color[outIdx] = vec3f(1.0 - col.a);
}
else if (${i}) {
  out_color[outIdx] = vec3f(HDRForward(col.r * inputScale), HDRForward(col.g * inputScale), HDRForward(col.b * inputScale));
}
else {
  out_color[outIdx] = col.rgb;
}
`;this._inputPassAux.setCSCode({csDefine:a,csMain:`
${s}
let alb = ${u("albedo")};
let nor = ${u("normal")};
out_normal[outIdx] = nor.rgb;
out_albedo[outIdx] = alb.rgb;
  `}),this._inputPassColor.setCSCode({csDefine:a,csMain:`
${s}
`}),this._outputPass.setCSCode({csDefine:`
${Dt}
const logXMax = ${mt};
${o}
`,csMain:`
let x = i32(globalId.x);
let y = i32(globalId.y);
if (x >= outputSize.x || y >= outputSize.y) {
  return;
}
let inIdx = (y + inputOffset.y) * inputSize.x + x + inputOffset.x;
let outIdx = (y + outputOffset.y) * imageSize.x + x + outputOffset.x;
let col = in_color[inIdx];
let raw = ${e?"textureLoad(in_raw, globalId.xy + vec2u(outputOffset), 0)":"in_raw[outIdx]"};

if (${t}) {
  out_color[outIdx] = vec4f(raw.rgb, 1.0 - col.r);
}
else if (${i}) {
  out_color[outIdx] = vec4f(
    vec3f(HDRInverse(col.r), HDRInverse(col.g), HDRInverse(col.b)) / inputScale,
    // Pick the alpha
    raw.a
  );
}
else {
  out_color[outIdx] = vec4f(col.rgb, raw.a);
}
`})}setImageSize(e,t){this._inputPassAux.setUniform("inputSize",new Int32Array([e,t])),this._inputPassColor.setUniform("inputSize",new Int32Array([e,t])),this._outputPass.setUniform("imageSize",new Int32Array([e,t])),this._outputPass.setSize(e,t),this._copyPass.setSize(e,t),this._copyPass.setUniform("size",new Int32Array([e,t]))}setInputTile(e){const t=new Int32Array([e.width,e.height]);[this._inputPassAux,this._inputPassColor].forEach(i=>{i.setUniform("inputOffset",new Int32Array([e.x,e.y])),i.setUniform("outputSize",t),i.setSize(t[0],t[1])}),this._outputPass.setUniform("inputSize",t)}setOutputTile(e,t){const i=this._outputPass,r=new Int32Array([e.width,e.height]),o=e.x-t.x,a=e.y-t.y;i.setUniform("outputSize",r),i.setUniform("inputOffset",new Int32Array([o,a])),i.setUniform("outputOffset",new Int32Array([e.x,e.y])),i.setExecuteSize(r[0],r[1])}forward(e,t,i,r){const o=e instanceof GPUTexture;this._updatePasses(o,r);const a=this._inputPassAux,u=this._inputPassColor,s=this._device.createCommandEncoder();function l(p){return p instanceof GPUTexture?{texture:p,channels:4}:{buffer:p,channels:4}}return t&&i?a.createPass(s,{color:l(e),albedo:l(t),normal:l(i)}):u.createPass(s,{color:l(e)}),this._device.queue.submit([s.finish()]),t&&i?{color:a.getOutput("color"),albedo:a.getOutput("albedo"),normal:a.getOutput("normal")}:{color:u.getOutput("color")}}inverse(e,t){const r=this._device.createCommandEncoder(),o=this._outputPass;return o.createPass(r,{color:{buffer:e,channels:4},raw:t instanceof GPUBuffer?{buffer:t,channels:4}:{texture:t,channels:4}}),this._device.queue.submit([r.finish()]),o.getOutput("color")}copyInputDataToOutput(e){const t=this._device.createCommandEncoder(),r=this._outputPass.getOutput("color"),o=this._copyPass;e instanceof GPUTexture?(o.setOutputBuffers({color:r}),o.createPass(t,{color:{texture:e,channels:4}})):t.copyBufferToBuffer(e,0,r,0,r.size),this._device.queue.submit([t.finish()])}dispose(){this._outputPass.dispose(),this._inputPassAux.dispose(),this._inputPassColor.dispose(),this._copyPass.dispose(!1)}}const ir=256,nr=432,rr=16,or=16,L=16;function ye(n,e){return Math.ceil(n/e)*e}function Wi(n,e){return Math.floor(n/e)*e}function Wt(n,e,t){const i=Math.round(t*n/e),r=Math.round((t+1)*n/e);return{start:i,end:r}}function ze(n,e,t,i=0){const r=e-n,o=Math.max(i,ye(r,L));let a=n-Math.floor((o-r)/2);return a=Ye(a,0,Math.max(0,t-o)),{start:a,end:a+o}}function Rt(n,e,t,i){if(!Number.isInteger(n)||n<=0||!Number.isInteger(e)||e<=0)throw new Error("Tile grid dimensions must be positive integers");if(!Number.isFinite(t)||t<=0)throw new Error("Maximum tile size must be positive");if(!Number.isFinite(i)||i<0)throw new Error("Tile overlap must be non-negative");const r=Math.max(L,Wi(t,L)),o=ye(i,L),a=Math.max(1,Math.ceil(n/r)),u=Math.max(1,Math.ceil(e/r)),s=[];let l=0,p=0;for(let f=0;f<u;f++){const g=Wt(e,u,f);for(let _=0;_<a;_++){const w=Wt(n,a,_),m={start:_===0?w.start:Math.max(0,w.start-o),end:_===a-1?w.end:Math.min(n,w.end+o)},y={start:f===0?g.start:Math.max(0,g.start-o),end:f===u-1?g.end:Math.min(e,g.end+o)},B=ze(m.start,m.end,n),v=ze(y.start,y.end,e),k={x:w.start,y:g.start,width:w.end-w.start,height:g.end-g.start},$={x:B.start,y:v.start,width:B.end-B.start,height:v.end-v.start};l=Math.max(l,k.width),p=Math.max(p,k.height),s.push({column:_,row:f,input:$,output:k})}}const c=()=>new Set(s.map(({input:f})=>`${f.width}x${f.height}`));if(c().size>2){const f=Math.max(...s.map(({input:m})=>m.width)),g=Math.max(...s.map(({input:m})=>m.height)),_=s.reduce((m,{input:y})=>m+f*y.height,0),w=s.reduce((m,{input:y})=>m+y.width*g,0);if(_<=w)for(const m of s){const y=ze(m.input.x,m.input.x+m.input.width,n,f);m.input.x=y.start,m.input.width=y.end-y.start}else for(const m of s){const y=ze(m.input.y,m.input.y+m.input.height,e,g);m.input.y=y.start,m.input.height=y.end-y.start}}const d=c(),h=s.reduce((f,{input:g})=>f+g.width*g.height,0);return{columns:a,rows:u,overlap:o,maxOutputWidth:l,maxOutputHeight:p,inputPixelCount:h,inputShapeCount:d.size,tiles:s}}function Ye(n,e,t){return Math.min(Math.max(n,e),t)}function ar(n,e){const t=[...n].sort((i,r)=>i-r);return t[Math.ceil(t.length*e)-1]}class sr{enabled;maxTileSize;minTileSize;targetTileTimeMs;_tileSize;_adjustmentStep;_smoothedTileTimeMs;_completeExecutionsSinceChange=0;constructor(e,t=!0){const i=typeof t=="object"?t:{};this.enabled=t!==!1,this.maxTileSize=Math.max(L,Wi(e,L)),this.minTileSize=Ye(ye(i.minTileSize??ir,L),L,this.maxTileSize),this.targetTileTimeMs=Math.max(1,i.targetTileTimeMs??rr),this._adjustmentStep=Math.max(L,ye(i.adjustmentStep??or,L)),this._tileSize=this.enabled?Ye(ye(i.initialTileSize??nr,L),this.minTileSize,this.maxTileSize):this.maxTileSize}get tileSize(){return this._tileSize}observe(e){if(!this.enabled||e.length===0)return!1;const t=e.filter(a=>Number.isFinite(a)&&a>=0);if(t.length===0)return!1;const i=t.length>=3?t.slice(1):t,r=ar(i,.75);if(this._smoothedTileTimeMs=this._smoothedTileTimeMs===void 0?r:this._smoothedTileTimeMs*.65+r*.35,this._completeExecutionsSinceChange++,this._completeExecutionsSinceChange<2)return!1;let o=this._tileSize;return this._smoothedTileTimeMs>this.targetTileTimeMs*1.25?o-=this._adjustmentStep:this._smoothedTileTimeMs<this.targetTileTimeMs*.65&&(o+=this._adjustmentStep),o=Ye(ye(o,L),this.minTileSize,this.maxTileSize),o===this._tileSize?!1:(this._tileSize=o,this._smoothedTileTimeMs=void 0,this._completeExecutionsSinceChange=0,!0)}}function b(n,e){return{op:"conv2d",id:n,input:e,weight:`${n}.weight`,bias:`${n}.bias`,activation:"relu",padding:"same"}}function se(n,e){return{op:"maxPool2d",id:n,input:e,size:2,stride:2,padding:"same"}}function ue(n,e){return{op:"upsample2d",id:n,input:e,scale:2,mode:"nearest"}}function ce(n,e,t){return{op:"concat",id:n,inputs:[e,t],axis:"channels"}}const ur={schemaVersion:1,id:"oidn-unet-small-v1",family:"oidn-unet-small",input:"input",output:"dec_conv0",receptiveField:174,nodes:[b("enc_conv0","input"),b("enc_conv1","enc_conv0"),se("pool1","enc_conv1"),b("enc_conv2","pool1"),se("pool2","enc_conv2"),b("enc_conv3","pool2"),se("pool3","enc_conv3"),b("enc_conv4","pool3"),se("pool4","enc_conv4"),b("enc_conv5a","pool4"),b("enc_conv5b","enc_conv5a"),ue("up4","enc_conv5b"),ce("concat4","up4","pool3"),b("dec_conv4a","concat4"),b("dec_conv4b","dec_conv4a"),ue("up3","dec_conv4b"),ce("concat3","up3","pool2"),b("dec_conv3a","concat3"),b("dec_conv3b","dec_conv3a"),ue("up2","dec_conv3b"),ce("concat2","up2","pool1"),b("dec_conv2a","concat2"),b("dec_conv2b","dec_conv2a"),ue("up1","dec_conv2b"),ce("concat1","up1","input"),b("dec_conv1a","concat1"),b("dec_conv1b","dec_conv1a"),b("dec_conv0","dec_conv1b")]},cr={schemaVersion:1,id:"oidn-unet-large-v1",family:"oidn-unet-large",input:"input",output:"dec_conv1c",receptiveField:202,nodes:[b("enc_conv1a","input"),b("enc_conv1b","enc_conv1a"),se("pool1","enc_conv1b"),b("enc_conv2a","pool1"),b("enc_conv2b","enc_conv2a"),se("pool2","enc_conv2b"),b("enc_conv3a","pool2"),b("enc_conv3b","enc_conv3a"),se("pool3","enc_conv3b"),b("enc_conv4a","pool3"),b("enc_conv4b","enc_conv4a"),se("pool4","enc_conv4b"),b("enc_conv5a","pool4"),b("enc_conv5b","enc_conv5a"),ue("up4","enc_conv5b"),ce("concat4","up4","pool3"),b("dec_conv4a","concat4"),b("dec_conv4b","dec_conv4a"),ue("up3","dec_conv4b"),ce("concat3","up3","pool2"),b("dec_conv3a","concat3"),b("dec_conv3b","dec_conv3a"),ue("up2","dec_conv3b"),ce("concat2","up2","pool1"),b("dec_conv2a","concat2"),b("dec_conv2b","dec_conv2a"),ue("up1","dec_conv2b"),ce("concat1","up1","input"),b("dec_conv1a","concat1"),b("dec_conv1b","dec_conv1a"),b("dec_conv1c","dec_conv1b")]},lr=[ur,cr];function Ri(n){const e=new Set;for(const t of n.nodes)t.op==="conv2d"&&(e.add(t.weight),e.add(t.bias));return e}function Gt(n){return n.desc.getByteSize()}function Gi(n){return[...n].sort().join(", ")}function Yi(n,e=lr){const t=e.filter(i=>{const r=Ri(i);return[...r].some(o=>!n.has(o))?!1:i.allowAdditionalTensors===!0||[...n.keys()].every(o=>r.has(o))});if(t.length===1)return t[0];throw t.length>1?new Error(`Ambiguous OIDN model topology: ${t.map(i=>i.id).join(", ")}`):new Error(`Unsupported OIDN model topology. TZA tensors: ${Gi(n.keys())}`)}function Yt(n,e,t){const i=n.get(e);if(!i)throw new Error(`Model ${t} is missing tensor ${e}`);if(i.data.byteLength!==Gt(i))throw new Error(`Tensor ${e} has ${i.data.byteLength} bytes, expected ${Gt(i)}`);return i}function pr(n,e=Yi(n)){if(e.schemaVersion!==1)throw new Error(`Unsupported model descriptor schema ${e.schemaVersion}`);const t=Ri(e);if(!e.allowAdditionalTensors){const c=[...n.keys()].filter(d=>!t.has(d));if(c.length>0)throw new Error(`Model ${e.id} has unexpected tensors: ${Gi(c)}`)}const i=new Map,r=new Map,o=new Map,a=new Set([e.input]);let u,s;const l=(c,d)=>{const h=i.get(c);if(h===void 0)throw new Error(`Model ${e.id} node ${d} reads unknown or forward value ${c}`);return h};for(const c of e.nodes){if(a.has(c.id))throw new Error(`Model ${e.id} produces duplicate value ${c.id}`);if(c.op==="conv2d"){const d=Yt(n,c.weight,e.id),h=Yt(n,c.bias,e.id),f=d.desc.dims;if(d.desc.layout!=="oihw"||f.length!==4)throw new Error(`Tensor ${c.weight} must use OIHW layout`);if(f[2]!==3||f[3]!==3)throw new Error(`Tensor ${c.weight} must use a 3x3 kernel`);if(h.desc.layout!=="x"||h.desc.dims.length!==1)throw new Error(`Tensor ${c.bias} must be a one-dimensional bias`);if(h.desc.dims[0]!==f[0])throw new Error(`Tensor ${c.bias} has ${h.desc.dims[0]} channels, expected ${f[0]}`);if(d.desc.dataType!==h.desc.dataType)throw new Error(`Weight and bias dtype differ for ${c.id}`);if(s&&s!==d.desc.dataType)throw new Error(`Mixed tensor dtypes are not supported by model ${e.id}`);s=d.desc.dataType,c.input===e.input&&u===void 0&&(u=f[1],i.set(e.input,u));const g=l(c.input,c.id);if(g!==f[1])throw new Error(`Tensor ${c.weight} expects ${f[1]} input channels, but ${c.input} provides ${g}`);i.set(c.id,f[0]),r.set(c.id,{weight:d,bias:h,inputChannels:f[1],outputChannels:f[0],kernelHeight:f[2],kernelWidth:f[3]}),o.set(c.id,{inputChannels:f[1],outputChannels:f[0]})}else if(c.op==="concat"){if(c.inputs.length<2)throw new Error(`Concat ${c.id} requires at least two inputs`);const d=c.inputs.reduce((h,f)=>h+l(f,c.id),0);i.set(c.id,d)}else i.set(c.id,l(c.input,c.id));a.add(c.id)}if(u===void 0||s===void 0)throw new Error(`Model ${e.id} has no convolution reading its input`);const p=i.get(e.output);if(p===void 0)throw new Error(`Model ${e.id} output ${e.output} is not produced`);if(p!==3)throw new Error(`Model ${e.id} must produce 3 channels, got ${p}`);return{spec:e,inputChannels:u,outputChannels:p,tensorDataType:s,channelsByValue:i,convChannels:o,convTensors:r}}const dr="This is not an object",hr="This is not a Float16Array object",Xt="This constructor is not a subclass of Float16Array",Xi="The constructor property value is not an object",fr="Species constructor didn't return TypedArray object",gr="Derived constructor created TypedArray object which was too small length",Se="Attempting to access detached ArrayBuffer",_t="Cannot convert undefined or null to object",yt="Cannot mix BigInt and other types, use explicit conversions",Ft="@@iterator property is not callable",Vt="Reduce of empty array with no initial value",mr="The comparison function must be either a function or undefined",ct="Offset is out of bounds";function E(n){return(e,...t)=>V(n,e,t)}function $e(n,e){return E(ve(n,e).get)}const{apply:V,construct:Pe,defineProperty:Ht,get:lt,getOwnPropertyDescriptor:ve,getPrototypeOf:Ae,has:wt,ownKeys:Fi,set:jt,setPrototypeOf:Vi}=Reflect,_r=Proxy,{EPSILON:yr,MAX_SAFE_INTEGER:Kt,isFinite:Hi,isNaN:xe}=Number,{iterator:ie,species:wr,toStringTag:Bt,for:vr}=Symbol,be=Object,{create:Je,defineProperty:Oe,freeze:xr,is:qt}=be,vt=be.prototype,br=vt.__lookupGetter__?E(vt.__lookupGetter__):(n,e)=>{if(n==null)throw O(_t);let t=be(n);do{const i=ve(t,e);if(i!==void 0)return ae(i,"get")?i.get:void 0}while((t=Ae(t))!==null)},ae=be.hasOwn||E(vt.hasOwnProperty),ji=Array,Ki=ji.isArray,Qe=ji.prototype,$r=E(Qe.join),kr=E(Qe.push),Ir=E(Qe.toLocaleString),Pt=Qe[ie],Tr=E(Pt),{abs:Br,trunc:qi}=Math,et=ArrayBuffer,Pr=et.isView,Zi=et.prototype,Sr=E(Zi.slice),Cr=$e(Zi,"byteLength"),xt=typeof SharedArrayBuffer<"u"?SharedArrayBuffer:null,Er=xt&&$e(xt.prototype,"byteLength"),St=Ae(Uint8Array),Ar=St.from,G=St.prototype,Or=G[ie],Mr=E(G.keys),Nr=E(G.values),Ur=E(G.entries),zr=E(G.set),Zt=E(G.reverse),Lr=E(G.fill),Dr=E(G.copyWithin),Jt=E(G.sort),Te=E(G.slice),Wr=E(G.subarray),R=$e(G,"buffer"),de=$e(G,"byteOffset"),T=$e(G,"length"),Ji=$e(G,Bt),Rr=Uint8Array,j=Uint16Array,Qt=(...n)=>V(Ar,j,n),Ct=Uint32Array,Gr=Float32Array,me=Ae([][ie]()),tt=E(me.next),Yr=E((function*(){})().next),Xr=Ae(me),O=TypeError,pt=RangeError,Qi=WeakSet,en=Qi.prototype,Fr=E(en.add),Vr=E(en.has),it=WeakMap,Et=it.prototype,Fe=E(Et.get),Hr=E(Et.has),At=E(Et.set),tn=new it,jr=Je(null,{next:{value:function(){const e=Fe(tn,this);return tt(e)}},[ie]:{value:function(){return this}}});function Le(n){if(n[ie]===Pt&&me.next===tt)return n;const e=Je(jr);return At(tn,e,Tr(n)),e}const nn=new it,rn=Je(Xr,{next:{value:function(){const e=Fe(nn,this);return Yr(e)},writable:!0,configurable:!0}});for(const n of Fi(me))n!=="next"&&Oe(rn,n,ve(me,n));function ei(n){const e=Je(rn);return At(nn,e,n),e}function Ve(n){return n!==null&&typeof n=="object"||typeof n=="function"}function ti(n){return n!==null&&typeof n=="object"}function He(n){return Ji(n)!==void 0}function bt(n){const e=Ji(n);return e==="BigInt64Array"||e==="BigUint64Array"}function Kr(n){try{return Ki(n)?!1:(Cr(n),!0)}catch{return!1}}function on(n){if(xt===null)return!1;try{return Er(n),!0}catch{return!1}}function qr(n){return Kr(n)||on(n)}function ii(n){return Ki(n)?n[ie]===Pt&&me.next===tt:!1}function Zr(n){return He(n)?n[ie]===Or&&me.next===tt:!1}function De(n){if(typeof n!="string")return!1;const e=+n;return n!==e+""||!Hi(e)?!1:e===qi(e)}const je=vr("__Float16Array__");function Jr(n){if(!ti(n))return!1;const e=Ae(n);if(!ti(e))return!1;const t=e.constructor;if(t===void 0)return!1;if(!Ve(t))throw O(Xi);return wt(t,je)}const $t=1/yr;function Qr(n){return n+$t-$t}const an=6103515625e-14,eo=65504,sn=.0009765625,ni=sn*an,to=sn*$t;function io(n){const e=+n;if(!Hi(e)||e===0)return e;const t=e>0?1:-1,i=Br(e);if(i<an)return t*Qr(i/ni)*ni;const r=(1+to)*i,o=r-(r-i);return o>eo||xe(o)?t*(1/0):t*o}const un=new et(4),cn=new Gr(un),ln=new Ct(un),q=new j(512),Z=new Rr(512);for(let n=0;n<256;++n){const e=n-127;e<-24?(q[n]=0,q[n|256]=32768,Z[n]=24,Z[n|256]=24):e<-14?(q[n]=1024>>-e-14,q[n|256]=1024>>-e-14|32768,Z[n]=-e-1,Z[n|256]=-e-1):e<=15?(q[n]=e+15<<10,q[n|256]=e+15<<10|32768,Z[n]=13,Z[n|256]=13):e<128?(q[n]=31744,q[n|256]=64512,Z[n]=24,Z[n|256]=24):(q[n]=31744,q[n|256]=64512,Z[n]=13,Z[n|256]=13)}function ee(n){cn[0]=io(n);const e=ln[0],t=e>>23&511;return q[t]+((e&8388607)>>Z[t])}const Ot=new Ct(2048);for(let n=1;n<1024;++n){let e=n<<13,t=0;for(;(e&8388608)===0;)e<<=1,t-=8388608;e&=-8388609,t+=947912704,Ot[n]=e|t}for(let n=1024;n<2048;++n)Ot[n]=939524096+(n-1024<<13);const ke=new Ct(64);for(let n=1;n<31;++n)ke[n]=n<<23;ke[31]=1199570944;ke[32]=2147483648;for(let n=33;n<63;++n)ke[n]=2147483648+(n-32<<23);ke[63]=3347054592;const pn=new j(64);for(let n=1;n<64;++n)n!==32&&(pn[n]=1024);function P(n){const e=n>>10;return ln[0]=Ot[pn[e]+(n&1023)]+ke[e],cn[0]}function oe(n){const e=+n;return xe(e)||e===0?0:qi(e)}function dt(n){const e=oe(n);return e<0?0:e<Kt?e:Kt}function We(n,e){if(!Ve(n))throw O(dr);const t=n.constructor;if(t===void 0)return e;if(!Ve(t))throw O(Xi);const i=t[wr];return i??e}function Ce(n){if(on(n))return!1;try{return Sr(n,0,0),!1}catch{}return!0}function ri(n,e){const t=xe(n),i=xe(e);if(t&&i)return 0;if(t)return 1;if(i||n<e)return-1;if(n>e)return 1;if(n===0&&e===0){const r=qt(n,0),o=qt(e,0);if(!r&&o)return-1;if(r&&!o)return 1}return 0}const Mt=2,Ke=new it;function we(n){return Hr(Ke,n)||!Pr(n)&&Jr(n)}function I(n){if(!we(n))throw O(hr)}function Re(n,e){const t=we(n),i=He(n);if(!t&&!i)throw O(fr);if(typeof e=="number"){let r;if(t){const o=x(n);r=T(o)}else r=T(n);if(r<e)throw O(gr)}if(bt(n))throw O(yt)}function x(n){const e=Fe(Ke,n);if(e!==void 0){const r=R(e);if(Ce(r))throw O(Se);return e}const t=n.buffer;if(Ce(t))throw O(Se);const i=Pe(S,[t,n.byteOffset,n.length],n.constructor);return Fe(Ke,i)}function oi(n){const e=T(n),t=[];for(let i=0;i<e;++i)t[i]=P(n[i]);return t}const dn=new Qi;for(const n of Fi(G)){if(n===Bt)continue;const e=ve(G,n);ae(e,"get")&&typeof e.get=="function"&&Fr(dn,e.get)}const no=xr({get(n,e,t){return De(e)&&ae(n,e)?P(lt(n,e)):Vr(dn,br(n,e))?lt(n,e):lt(n,e,t)},set(n,e,t,i){return De(e)&&ae(n,e)?jt(n,e,ee(t)):jt(n,e,t,i)},getOwnPropertyDescriptor(n,e){if(De(e)&&ae(n,e)){const t=ve(n,e);return t.value=P(t.value),t}return ve(n,e)},defineProperty(n,e,t){return De(e)&&ae(n,e)&&ae(t,"value")&&(t.value=ee(t.value)),Ht(n,e,t)}});class S{constructor(e,t,i){let r;if(we(e))r=Pe(j,[x(e)],new.target);else if(Ve(e)&&!qr(e)){let a,u;if(He(e)){a=e,u=T(e);const s=R(e);if(Ce(s))throw O(Se);if(bt(e))throw O(yt);const l=new et(u*Mt);r=Pe(j,[l],new.target)}else{const s=e[ie];if(s!=null&&typeof s!="function")throw O(Ft);s!=null?ii(e)?(a=e,u=e.length):(a=[...e],u=a.length):(a=e,u=dt(a.length)),r=Pe(j,[u],new.target)}for(let s=0;s<u;++s)r[s]=ee(a[s])}else r=Pe(j,arguments,new.target);const o=new _r(r,no);return At(Ke,o,r),o}static from(e,...t){const i=this;if(!wt(i,je))throw O(Xt);if(i===S){if(we(e)&&t.length===0){const p=x(e),c=new j(R(p),de(p),T(p));return new S(R(Te(c)))}if(t.length===0)return new S(R(Qt(e,ee)));const s=t[0],l=t[1];return new S(R(Qt(e,function(p,...c){return ee(V(s,this,[p,...Le(c)]))},l)))}let r,o;const a=e[ie];if(a!=null&&typeof a!="function")throw O(Ft);if(a!=null)ii(e)?(r=e,o=e.length):Zr(e)?(r=e,o=T(e)):(r=[...e],o=r.length);else{if(e==null)throw O(_t);r=be(e),o=dt(r.length)}const u=new i(o);if(t.length===0)for(let s=0;s<o;++s)u[s]=r[s];else{const s=t[0],l=t[1];for(let p=0;p<o;++p)u[p]=V(s,l,[r[p],p])}return u}static of(...e){const t=this;if(!wt(t,je))throw O(Xt);const i=e.length;if(t===S){const o=new S(i),a=x(o);for(let u=0;u<i;++u)a[u]=ee(e[u]);return o}const r=new t(i);for(let o=0;o<i;++o)r[o]=e[o];return r}keys(){I(this);const e=x(this);return Mr(e)}values(){I(this);const e=x(this);return ei((function*(){for(const t of Nr(e))yield P(t)})())}entries(){I(this);const e=x(this);return ei((function*(){for(const[t,i]of Ur(e))yield[t,P(i)]})())}at(e){I(this);const t=x(this),i=T(t),r=oe(e),o=r>=0?r:i+r;if(!(o<0||o>=i))return P(t[o])}with(e,t){I(this);const i=x(this),r=T(i),o=oe(e),a=o>=0?o:r+o,u=+t;if(a<0||a>=r)throw pt(ct);const s=new j(R(i),de(i),T(i)),l=new S(R(Te(s))),p=x(l);return p[a]=ee(u),l}map(e,...t){I(this);const i=x(this),r=T(i),o=t[0],a=We(i,S);if(a===S){const s=new S(r),l=x(s);for(let p=0;p<r;++p){const c=P(i[p]);l[p]=ee(V(e,o,[c,p,this]))}return s}const u=new a(r);Re(u,r);for(let s=0;s<r;++s){const l=P(i[s]);u[s]=V(e,o,[l,s,this])}return u}filter(e,...t){I(this);const i=x(this),r=T(i),o=t[0],a=[];for(let l=0;l<r;++l){const p=P(i[l]);V(e,o,[p,l,this])&&kr(a,p)}const u=We(i,S),s=new u(a);return Re(s),s}reduce(e,...t){I(this);const i=x(this),r=T(i);if(r===0&&t.length===0)throw O(Vt);let o,a;t.length===0?(o=P(i[0]),a=1):(o=t[0],a=0);for(let u=a;u<r;++u)o=e(o,P(i[u]),u,this);return o}reduceRight(e,...t){I(this);const i=x(this),r=T(i);if(r===0&&t.length===0)throw O(Vt);let o,a;t.length===0?(o=P(i[r-1]),a=r-2):(o=t[0],a=r-1);for(let u=a;u>=0;--u)o=e(o,P(i[u]),u,this);return o}forEach(e,...t){I(this);const i=x(this),r=T(i),o=t[0];for(let a=0;a<r;++a)V(e,o,[P(i[a]),a,this])}find(e,...t){I(this);const i=x(this),r=T(i),o=t[0];for(let a=0;a<r;++a){const u=P(i[a]);if(V(e,o,[u,a,this]))return u}}findIndex(e,...t){I(this);const i=x(this),r=T(i),o=t[0];for(let a=0;a<r;++a){const u=P(i[a]);if(V(e,o,[u,a,this]))return a}return-1}findLast(e,...t){I(this);const i=x(this),r=T(i),o=t[0];for(let a=r-1;a>=0;--a){const u=P(i[a]);if(V(e,o,[u,a,this]))return u}}findLastIndex(e,...t){I(this);const i=x(this),r=T(i),o=t[0];for(let a=r-1;a>=0;--a){const u=P(i[a]);if(V(e,o,[u,a,this]))return a}return-1}every(e,...t){I(this);const i=x(this),r=T(i),o=t[0];for(let a=0;a<r;++a)if(!V(e,o,[P(i[a]),a,this]))return!1;return!0}some(e,...t){I(this);const i=x(this),r=T(i),o=t[0];for(let a=0;a<r;++a)if(V(e,o,[P(i[a]),a,this]))return!0;return!1}set(e,...t){I(this);const i=x(this),r=oe(t[0]);if(r<0)throw pt(ct);if(e==null)throw O(_t);if(bt(e))throw O(yt);if(we(e))return zr(x(this),x(e),r);if(He(e)){const s=R(e);if(Ce(s))throw O(Se)}const o=T(i),a=be(e),u=dt(a.length);if(r===1/0||u+r>o)throw pt(ct);for(let s=0;s<u;++s)i[s+r]=ee(a[s])}reverse(){I(this);const e=x(this);return Zt(e),this}toReversed(){I(this);const e=x(this),t=new j(R(e),de(e),T(e)),i=new S(R(Te(t))),r=x(i);return Zt(r),i}fill(e,...t){I(this);const i=x(this);return Lr(i,ee(e),...Le(t)),this}copyWithin(e,t,...i){I(this);const r=x(this);return Dr(r,e,t,...Le(i)),this}sort(e){I(this);const t=x(this),i=e!==void 0?e:ri;return Jt(t,(r,o)=>i(P(r),P(o))),this}toSorted(e){I(this);const t=x(this);if(e!==void 0&&typeof e!="function")throw new O(mr);const i=e!==void 0?e:ri,r=new j(R(t),de(t),T(t)),o=new S(R(Te(r))),a=x(o);return Jt(a,(u,s)=>i(P(u),P(s))),o}slice(e,t){I(this);const i=x(this),r=We(i,S);if(r===S){const f=new j(R(i),de(i),T(i));return new S(R(Te(f,e,t)))}const o=T(i),a=oe(e),u=t===void 0?o:oe(t);let s;a===-1/0?s=0:a<0?s=o+a>0?o+a:0:s=o<a?o:a;let l;u===-1/0?l=0:u<0?l=o+u>0?o+u:0:l=o<u?o:u;const p=l-s>0?l-s:0,c=new r(p);if(Re(c,p),p===0)return c;const d=R(i);if(Ce(d))throw O(Se);let h=0;for(;s<l;)c[h]=P(i[s]),++s,++h;return c}subarray(e,t){I(this);const i=x(this),r=We(i,S),o=new j(R(i),de(i),T(i)),a=Wr(o,e,t),u=new r(R(a),de(a),T(a));return Re(u),u}indexOf(e,...t){I(this);const i=x(this),r=T(i);let o=oe(t[0]);if(o===1/0)return-1;o<0&&(o+=r,o<0&&(o=0));for(let a=o;a<r;++a)if(ae(i,a)&&P(i[a])===e)return a;return-1}lastIndexOf(e,...t){I(this);const i=x(this),r=T(i);let o=t.length>=1?oe(t[0]):r-1;if(o===-1/0)return-1;o>=0?o=o<r-1?o:r-1:o+=r;for(let a=o;a>=0;--a)if(ae(i,a)&&P(i[a])===e)return a;return-1}includes(e,...t){I(this);const i=x(this),r=T(i);let o=oe(t[0]);if(o===1/0)return!1;o<0&&(o+=r,o<0&&(o=0));const a=xe(e);for(let u=o;u<r;++u){const s=P(i[u]);if(a&&xe(s)||s===e)return!0}return!1}join(e){I(this);const t=x(this),i=oi(t);return $r(i,e)}toLocaleString(...e){I(this);const t=x(this),i=oi(t);return Ir(i,...Le(e))}get[Bt](){if(we(this))return"Float16Array"}}Oe(S,"BYTES_PER_ELEMENT",{value:Mt});Oe(S,je,{});Vi(S,St);const qe=S.prototype;Oe(qe,"BYTES_PER_ELEMENT",{value:Mt});Oe(qe,ie,{value:qe.values,writable:!0,configurable:!0});Vi(qe,G);const Q=8,fe=Q+2,hn=9;function ai(n,e,t=!1){const i=n==="fp16"?2:4,r=fe*fe*e,o=t?hn*e*4:0;return(r+o)*4*i}function ro(n){return n==="fp16"?"vec4<f16>":"vec4<f32>"}function oo(n){return n==="fp16"?`enable f16;
`:""}function ao(n,e,t){const i=r=>`${t}[weightBase + ${r}u]`;return n==="fp16"?`
        let inputValue = vec4<f16>(${e});
        var partial = vec4<f16>(0.0h);
        partial = fma(${i(0)}, vec4<f16>(inputValue.x), partial);
        partial = fma(${i(1)}, vec4<f16>(inputValue.y), partial);
        partial = fma(${i(2)}, vec4<f16>(inputValue.z), partial);
        partial = fma(${i(3)}, vec4<f16>(inputValue.w), partial);
        acc += vec4<f32>(partial);
`:`
        let inputValue = vec4<f32>(${e});
        acc = fma(vec4<f32>(${i(0)}), vec4<f32>(inputValue.x), acc);
        acc = fma(vec4<f32>(${i(1)}), vec4<f32>(inputValue.y), acc);
        acc = fma(vec4<f32>(${i(2)}), vec4<f32>(inputValue.z), acc);
        acc = fma(vec4<f32>(${i(3)}), vec4<f32>(inputValue.w), acc);
`}function so(n,e,t,i=!1){if(!Number.isInteger(t)||t<1)throw new Error(`Final RGB shader requires positive input blocks, got ${t}`);const r=ro(n),o="vec4<f32>",a=fe*fe*t,u=hn*t*4,s=e==="relu"?"max(acc, vec4<f32>(0.0))":"acc",l=ao(n,"inputTile[patchBase + inputBlock]",i?"weightTile":"weights");return`${oo(n)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}

@group(0) @binding(0) var<storage, read> inputData: array<${r}>;
@group(0) @binding(1) var<storage, read> weights: array<${r}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${o}>;
@group(0) @binding(4) var<uniform> params: Params;

var<workgroup> inputTile: array<${r}, ${a}>;
${i?`var<workgroup> weightTile: array<${r}, ${u}>;`:""}

@compute @workgroup_size(${Q}, ${Q}, 1)
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(global_invocation_id) gid: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let localLinear = localId.y * ${Q}u + localId.x;
  for (
    var loadIndex = localLinear;
    loadIndex < ${a}u;
    loadIndex += ${Q*Q}u
  ) {
    let tilePixel = loadIndex / ${t}u;
    let inputBlock = loadIndex % ${t}u;
    let tileX = tilePixel % ${fe}u;
    let tileY = tilePixel / ${fe}u;
    let inputX = i32(workgroupId.x * ${Q}u + tileX) - 1;
    let inputY = i32(workgroupId.y * ${Q}u + tileY) - 1;
    var value = ${r}(0.0);
    if (
      inputX >= 0 && inputX < i32(params.inputWidth) &&
      inputY >= 0 && inputY < i32(params.inputHeight)
    ) {
      let inputIndex =
        (u32(inputY) * params.inputWidth + u32(inputX)) *
        ${t}u + inputBlock;
      value = inputData[inputIndex];
    }
    inputTile[loadIndex] = value;
  }

${i?`  for (
    var loadIndex = localLinear;
    loadIndex < ${u}u;
    loadIndex += ${Q*Q}u
  ) {
    weightTile[loadIndex] = weights[loadIndex];
  }

`:""}  // Out-of-range invocations must reach this barrier before returning.
  workgroupBarrier();

  let outputInBounds =
    gid.x < params.outputWidth &&
    gid.y < params.outputHeight &&
    gid.z < params.outputBlocks;
  if (!outputInBounds) {
    return;
  }

  var acc = bias[gid.z];
  for (var ky = 0u; ky < 3u; ky++) {
    let inputY = i32(gid.y) + i32(ky) - 1;
    if (inputY < 0 || inputY >= i32(params.inputHeight)) {
      continue;
    }
    for (var kx = 0u; kx < 3u; kx++) {
      let inputX = i32(gid.x) + i32(kx) - 1;
      if (inputX < 0 || inputX >= i32(params.inputWidth)) {
        continue;
      }
      let patchBase =
        ((localId.y + ky) * ${fe}u + localId.x + kx) *
        ${t}u;
      for (var inputBlock = 0u; inputBlock < ${t}u; inputBlock++) {
        let weightBase =
          ((ky * 3u + kx) * ${t}u + inputBlock) * 4u;
        ${l}
      }
    }
  }

  let outputIndex =
    (gid.y * params.outputWidth + gid.x) * 1u + gid.z;
  outputData[outputIndex] = ${s};
}
`}function uo(n){return n.op==="concat"?n.inputs:[n.input]}function co(n){const e=new Map;for(const t of n.nodes)for(const i of uo(t)){const r=e.get(i)??[];r.push(t),e.set(i,r)}return e}function ht(n,e,t){const i=n.get(e);if(!(i?.length!==1||i[0].op!==t))return i[0]}function kt(n,e={}){const t=n.spec,i=co(t),r=new Map(t.nodes.map(p=>[p.id,p])),o=new Set,a=new Map;let u=0,s=0;if(e.fuseConvPool!==!1)for(const p of t.nodes){if(p.op!=="conv2d"||p.activation!=="relu")continue;const c=ht(i,p.id,"maxPool2d");!c||c.size!==2||c.stride!==2||(o.add(p.id),a.set(c.id,{op:"fusedConvReluMaxPool2d",id:c.id,input:p.input,conv:p,pool:c}),u++)}if(e.fuseUpsampleConcatConv!==!1)for(const p of t.nodes){if(p.op!=="conv2d")continue;const c=r.get(p.input);if(c?.op!=="concat"||c.inputs.length!==2||ht(i,c.id,"conv2d")!==p)continue;const d=n.channelsByValue.get(c.inputs[0]);if(d===void 0||d%4!==0)continue;const h=c.inputs.map(g=>{const _=r.get(g);return _?.op==="upsample2d"&&_.scale===2&&_.mode==="nearest"&&ht(i,_.id,"concat")===c?{value:_.input,upsample:_}:{value:g}});if(h.filter(g=>g.upsample).length===1){o.add(c.id);for(const g of c.inputs){const _=r.get(g);_?.op==="upsample2d"&&o.add(_.id)}a.set(p.id,{op:"fusedUpsampleConcatConv2d",id:p.id,inputs:h,conv:p}),s++}}const l=[];for(const p of t.nodes){const c=a.get(p.id);c?l.push(c):o.has(p.id)||l.push(p)}return{spec:t,nodes:l,fusions:{convPool:u,upsampleConcatConv:s}}}function lo(n){return n.op==="concat"?n.inputs:n.op==="fusedUpsampleConcatConv2d"?n.inputs.map(e=>e.value):[n.input]}function si(n,e){return n.width===e.width&&n.height===e.height}function po(n,e,t,i){if(!Number.isInteger(e)||e<=0||!Number.isInteger(t)||t<=0)throw new Error(`Invalid model input size ${e}x${t}`);const r=kt(n,i),o={width:e,height:t,channels:n.inputChannels},a=new Map([[n.spec.input,o]]),u=[],s=(c,d)=>{const h=a.get(c);if(!h)throw new Error(`Planned node ${d} reads missing value ${c}`);return h};for(const c of r.nodes){let d;if(c.op==="conv2d"){const h=s(c.input,c.id);d={width:h.width,height:h.height,channels:n.convChannels.get(c.id).outputChannels}}else if(c.op==="maxPool2d"){const h=s(c.input,c.id);d={width:Math.ceil(h.width/2),height:Math.ceil(h.height/2),channels:h.channels}}else if(c.op==="upsample2d"){const h=s(c.input,c.id);d={width:h.width*2,height:h.height*2,channels:h.channels}}else if(c.op==="concat"){const h=c.inputs.map(f=>s(f,c.id));if(h.some(f=>!si(f,h[0])))throw new Error(`Concat ${c.id} has mismatched spatial shapes`);d={width:h[0].width,height:h[0].height,channels:h.reduce((f,g)=>f+g.channels,0)}}else if(c.op==="fusedConvReluMaxPool2d"){const h=s(c.input,c.id);d={width:Math.ceil(h.width/2),height:Math.ceil(h.height/2),channels:n.convChannels.get(c.conv.id).outputChannels}}else{const h=c.inputs.map(f=>{const g=s(f.value,c.id);return f.upsample?{...g,width:g.width*2,height:g.height*2}:g});if(h.some(f=>!si(f,h[0])))throw new Error(`Fused decoder ${c.id} has mismatched spatial shapes`);d={width:h[0].width,height:h[0].height,channels:n.convChannels.get(c.conv.id).outputChannels}}a.set(c.id,d),u.push(d)}const l=new Map;r.nodes.forEach((c,d)=>{for(const h of lo(c))l.set(h,d)}),l.set(n.spec.output,r.nodes.length);const p=r.nodes.map((c,d)=>({node:c,outputShape:u[d],lastUse:l.get(c.id)??d}));return{...r,inputShape:o,valueShapes:a,plannedNodes:p}}class fn{_stats=new Map;track(e,t){let i=this._stats.get(e);return i||(i={created:0,destroyed:0,live:0,peakLive:0,resources:new Set},this._stats.set(e,i)),i.resources.has(t)||(i.resources.add(t),i.created++,i.live++,i.peakLive=Math.max(i.peakLive,i.live)),t}release(e,t,i){if(!t)return!1;const r=this._stats.get(e);if(!r?.resources.delete(t))return!1;try{i()}finally{r.destroyed++,r.live--}return!0}snapshot(e=0){let t=0,i=0,r=0,o=0;const a={};for(const[u,s]of this._stats){const l={created:s.created,destroyed:s.destroyed,live:s.live,peakLive:s.peakLive};a[u]=l,t+=l.live,i+=l.created,r+=l.destroyed,o+=l.peakLive}return{live:t,created:i,destroyed:r,peakLive:o,pending:e,byKind:a}}}const ui=new WeakMap;function ho(n){let e=ui.get(n);return e||(e={ready:new Map,pending:new Map},ui.set(n,e)),e}const D=8,gn=8,N=8,K=N+2;function te(n){const[e,t]=n.workgroupSize;return{workgroupX:e,workgroupY:t,rowsPerThread:n.rowsPerThread,tileM:t*n.rowsPerThread,tileNBlocks:e,tileKBlocks:gn}}function ge(n){const e=te(n),t=n.sharedLayout==="padded"||n.sharedLayout==="padded-input",i=n.sharedLayout==="padded"||n.sharedLayout==="padded-weights";return{input:e.tileM*e.tileKBlocks+(t?e.workgroupY:0),weights:e.tileKBlocks*e.tileNBlocks*(i?5:4)}}function nt(n,e){return e.sharedLayout==="padded"||e.sharedLayout==="padded-input"?`(${n}) + (${n}) / ${e.rowsPerThread*gn}u`:n}function mn(n,e){return e.sharedLayout==="padded"||e.sharedLayout==="padded-weights"?`(${n}) + (${n}) / 4u`:n}function Nt(n,e){return Math.ceil(n/e)*e}function A(n){return Math.ceil(n/4)}function fo(n,e){return n.width*n.height*A(n.channels)*4*e}let Be;function _n(n){const e=n&32768?-1:1,t=n>>>10&31,i=n&1023;return t===0?e*i*2**-24:t===31?i===0?e*(1/0):NaN:e*(1+i/1024)*2**(t-15)}function go(){if(!Be){Be=new Float32Array(65536);for(let n=0;n<Be.length;n++)Be[n]=_n(n)}return Be}function ci(n){if(n.desc.dataType==="Float32")return new Float32Array(n.data.buffer,n.data.byteOffset,n.data.byteLength/4);const e=new Uint16Array(n.data.buffer,n.data.byteOffset,n.data.byteLength/2),t=new Float32Array(e.length);if(e.length<4096)for(let i=0;i<e.length;i++)t[i]=_n(e[i]);else{const i=go();for(let r=0;r<e.length;r++)t[r]=i[e[r]]}return t}function It(n,e,t,i){const r=Nt(t.byteLength,4),o=n.createBuffer({label:e,size:r,usage:i,mappedAtCreation:!0});return new Uint8Array(o.getMappedRange()).set(new Uint8Array(t.buffer,t.byteOffset,t.byteLength)),o.unmap(),o}function li(n,e,t){const i=new Uint32Array(Nt(t.length,4));return i.set(t),It(n,e,i,GPUBufferUsage.UNIFORM)}function mo(n,e,t,i,r){const o=A(t.inputChannels),a=A(t.outputChannels),u=a*t.kernelHeight*t.kernelWidth*o*4*4,s=i==="fp16"&&t.weight.desc.dataType==="Float16",l=s?new Uint16Array(u):i==="fp16"?new S(u):new Float32Array(u),p=s?new Uint16Array(t.weight.data.buffer,t.weight.data.byteOffset,t.weight.data.byteLength/2):ci(t.weight);for(let h=0;h<a;h++)for(let f=0;f<t.kernelHeight;f++)for(let g=0;g<t.kernelWidth;g++)for(let _=0;_<o;_++)for(let w=0;w<4;w++){const m=h*4+w;for(let y=0;y<4;y++){const B=_*4+y,k=(r==="k-major"?(((f*t.kernelWidth+g)*o+_)*a+h)*16:(((h*t.kernelHeight+f)*t.kernelWidth+g)*o+_)*16)+y*4+w;if(m<t.outputChannels&&B<t.inputChannels){const $=((m*t.inputChannels+B)*t.kernelHeight+f)*t.kernelWidth+g;l[k]=p[$]}}}const c=new Float32Array(a*4);c.set(ci(t.bias));const d=It(n,`oidn/${e}/weights/${i}/${r}`,l,GPUBufferUsage.STORAGE);try{return{weights:d,weightLayout:r,bias:It(n,`oidn/${e}/bias`,c,GPUBufferUsage.STORAGE)}}catch(h){throw d.destroy(),h}}function z(n){return n==="fp16"?"vec4<f16>":"vec4<f32>"}function ne(n){return n==="fp16"?`enable f16;
`:""}function re(n,e){return e==="fp16"?`vec4<f16>(${n})`:n}function pe(n,e){return e==="relu"?`max(${n}, vec4<f32>(0.0))`:n}function Me(n,e,t){return t==="fp32"?`
let inputValue = vec4<f32>(${n});
let weightBase = ${e};
acc = fma(vec4<f32>(weights[weightBase]), vec4<f32>(inputValue.x), acc);
acc = fma(vec4<f32>(weights[weightBase + 1u]), vec4<f32>(inputValue.y), acc);
acc = fma(vec4<f32>(weights[weightBase + 2u]), vec4<f32>(inputValue.z), acc);
acc = fma(vec4<f32>(weights[weightBase + 3u]), vec4<f32>(inputValue.w), acc);
`:`
let inputValue = vec4<f16>(${n});
let weightBase = ${e};
var partial = vec4<f16>(0.0h);
partial = fma(weights[weightBase], vec4<f16>(inputValue.x), partial);
partial = fma(weights[weightBase + 1u], vec4<f16>(inputValue.y), partial);
partial = fma(weights[weightBase + 2u], vec4<f16>(inputValue.z), partial);
partial = fma(weights[weightBase + 3u], vec4<f16>(inputValue.w), partial);
acc += vec4<f32>(partial);
`}function _o(n,e,t){const i=t==="fp16"?"vec4<f16>":"vec4<f32>",r=t==="fp16"?`var partial = vec4<f16>(0.0h);
partial = fma(subgroupBroadcast(weights[weightBase], 0u), ${i}(inputValue.x), partial);
partial = fma(subgroupBroadcast(weights[weightBase + 1u], 0u), ${i}(inputValue.y), partial);
partial = fma(subgroupBroadcast(weights[weightBase + 2u], 0u), ${i}(inputValue.z), partial);
partial = fma(subgroupBroadcast(weights[weightBase + 3u], 0u), ${i}(inputValue.w), partial);
acc += vec4<f32>(partial);`:`acc = fma(subgroupBroadcast(weights[weightBase], 0u), vec4<f32>(inputValue.x), acc);
acc = fma(subgroupBroadcast(weights[weightBase + 1u], 0u), vec4<f32>(inputValue.y), acc);
acc = fma(subgroupBroadcast(weights[weightBase + 2u], 0u), vec4<f32>(inputValue.z), acc);
acc = fma(subgroupBroadcast(weights[weightBase + 3u], 0u), vec4<f32>(inputValue.w), acc);`;return`
let inputValue = ${i}(${n});
let weightBase = ${e};
${r}
`}function Ze(n,e,t){return n==="fp16"&&(e.loadMode==="packed-all"||t&&e.loadMode==="packed-weights")}function Ee(n,e){return e?`bitcast<vec4<f16>>(${n})`:n}function yn(n,e){const{rowsPerThread:t,tileNBlocks:i,tileKBlocks:r}=te(e),o=nt(`tileSpatial * ${r}u + tileK`,e),a=`(tileK * ${i}u + localId.x) * ${e.sharedLayout==="padded"||e.sharedLayout==="padded-weights"?5:4}u`;if(e.accumulationOrder==="row-major"){const u=z(n),s=n==="fp16"?"partial":"acc[row]";return`
    for (var row = 0u; row < ${t}u; row++) {
      ${n==="fp16"?"var partial = vec4<f16>(0.0h);":""}
      let tileSpatial = localId.y * ${t}u + row;
      for (var tileK = 0u; tileK < ${r}u; tileK++) {
        let weightBase = ${a};
        let inputValue = inputTile[${o}];
        ${s} = fma(weightTile[weightBase], ${u}(inputValue.x), ${s});
        ${s} = fma(weightTile[weightBase + 1u], ${u}(inputValue.y), ${s});
        ${s} = fma(weightTile[weightBase + 2u], ${u}(inputValue.z), ${s});
        ${s} = fma(weightTile[weightBase + 3u], ${u}(inputValue.w), ${s});
      }
      ${n==="fp16"?"acc[row] += vec4<f32>(partial);":""}
    }
`}return n==="fp16"?`
    var partial: array<vec4<f16>, ${t}>;
    for (var row = 0u; row < ${t}u; row++) {
      partial[row] = vec4<f16>(0.0h);
    }
    for (var tileK = 0u; tileK < ${r}u; tileK++) {
      let weightBase =
        ${a};
      for (var row = 0u; row < ${t}u; row++) {
        let tileSpatial =
          localId.y * ${t}u + row;
        let inputValue =
          inputTile[${o}];
        partial[row] = fma(
          weightTile[weightBase],
          vec4<f16>(inputValue.x),
          partial[row]
        );
        partial[row] = fma(
          weightTile[weightBase + 1u],
          vec4<f16>(inputValue.y),
          partial[row]
        );
        partial[row] = fma(
          weightTile[weightBase + 2u],
          vec4<f16>(inputValue.z),
          partial[row]
        );
        partial[row] = fma(
          weightTile[weightBase + 3u],
          vec4<f16>(inputValue.w),
          partial[row]
        );
      }
    }
    for (var row = 0u; row < ${t}u; row++) {
      acc[row] += vec4<f32>(partial[row]);
    }
`:`
    for (var tileK = 0u; tileK < ${r}u; tileK++) {
      let weightBase =
        ${a};
      for (var row = 0u; row < ${t}u; row++) {
        let tileSpatial =
          localId.y * ${t}u + row;
        let inputValue =
          inputTile[${o}];
        acc[row] = fma(
          weightTile[weightBase],
          vec4<f32>(inputValue.x),
          acc[row]
        );
        acc[row] = fma(
          weightTile[weightBase + 1u],
          vec4<f32>(inputValue.y),
          acc[row]
        );
        acc[row] = fma(
          weightTile[weightBase + 2u],
          vec4<f32>(inputValue.z),
          acc[row]
        );
        acc[row] = fma(
          weightTile[weightBase + 3u],
          vec4<f32>(inputValue.w),
          acc[row]
        );
      }
    }
`}function yo(n,e,t,i,r){const o=z(n),a=z(n),u=z(e),s=re(pe("acc",t),e);return`${ne(n)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}

@group(0) @binding(0) var<storage, read> inputData: array<${o}>;
@group(0) @binding(1) var<storage, read> weights: array<${a}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${u}>;
@group(0) @binding(4) var<uniform> params: Params;

@compute @workgroup_size(${D}, ${D}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.outputWidth || gid.y >= params.outputHeight || gid.z >= ${r}u) {
    return;
  }
  var acc = bias[gid.z];
  for (var ky = 0u; ky < 3u; ky++) {
    let inputY = i32(gid.y) + i32(ky) - 1;
    if (inputY < 0 || inputY >= i32(params.inputHeight)) { continue; }
    for (var kx = 0u; kx < 3u; kx++) {
      let inputX = i32(gid.x) + i32(kx) - 1;
      if (inputX < 0 || inputX >= i32(params.inputWidth)) { continue; }
      let pixelBase = (u32(inputY) * params.inputWidth + u32(inputX)) * ${i}u;
      for (var inputBlock = 0u; inputBlock < ${i}u; inputBlock++) {
        ${Me("inputData[pixelBase + inputBlock]",`((((gid.z * 3u + ky) * 3u + kx) * ${i}u + inputBlock) * 4u)`,n)}
      }
    }
  }
  let outputIndex = (gid.y * params.outputWidth + gid.x) * ${r}u + gid.z;
  outputData[outputIndex] = ${s};
}
`}function wo(n,e,t,i,r){const o=z(n),a=z(n),u=z(e),s=re(pe("acc",t),e);return`${ne(n)}
enable subgroups;
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}
@group(0) @binding(0) var<storage, read> inputData: array<${o}>;
@group(0) @binding(1) var<storage, read> weights: array<${a}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${u}>;
@group(0) @binding(4) var<uniform> params: Params;

@compute @workgroup_size(${D}, ${D}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let outputInBounds =
    gid.x < params.outputWidth && gid.y < params.outputHeight;
  var acc = bias[gid.z];
  for (var ky = 0u; ky < 3u; ky++) {
    let inputY = i32(gid.y) + i32(ky) - 1;
    let clampedY = u32(clamp(inputY, 0, i32(params.inputHeight) - 1));
    for (var kx = 0u; kx < 3u; kx++) {
      let inputX = i32(gid.x) + i32(kx) - 1;
      let clampedX = u32(clamp(inputX, 0, i32(params.inputWidth) - 1));
      let inputInBounds =
        outputInBounds && inputX >= 0 && inputY >= 0 &&
        inputX < i32(params.inputWidth) && inputY < i32(params.inputHeight);
      let pixelBase =
        (clampedY * params.inputWidth + clampedX) * ${i}u;
      for (var inputBlock = 0u; inputBlock < ${i}u; inputBlock++) {
        ${_o(`select(${o}(0.0), inputData[pixelBase + inputBlock], inputInBounds)`,`((((gid.z * 3u + ky) * 3u + kx) * ${i}u + inputBlock) * 4u)`,n)}
      }
    }
  }
  if (outputInBounds) {
    let outputIndex =
      (gid.y * params.outputWidth + gid.x) * ${r}u + gid.z;
    outputData[outputIndex] = ${s};
  }
}
`}function vo(n,e,t,i,r){const o=z(n),a=z(e),u=re(pe("acc",t),e),s=K*K*i,l=N*N;return`${ne(n)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}
@group(0) @binding(0) var<storage, read> inputData: array<${o}>;
@group(0) @binding(1) var<storage, read> weights: array<${o}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${a}>;
@group(0) @binding(4) var<uniform> params: Params;

var<workgroup> inputPatch: array<${o}, ${s}>;

@compute @workgroup_size(${N}, ${N}, 1)
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let localLinear =
    localId.y * ${N}u + localId.x;
  for (
    var loadIndex = localLinear;
    loadIndex < ${s}u;
    loadIndex += ${l}u
  ) {
    let patchPixel = loadIndex / ${i}u;
    let inputBlock = loadIndex % ${i}u;
    let patchX = patchPixel % ${K}u;
    let patchY = patchPixel / ${K}u;
    let inputX =
      i32(workgroupId.x * ${N}u + patchX) - 1;
    let inputY =
      i32(workgroupId.y * ${N}u + patchY) - 1;
    var value = ${o}(0.0);
    if (
      inputX >= 0 && inputX < i32(params.inputWidth) &&
      inputY >= 0 && inputY < i32(params.inputHeight)
    ) {
      let inputIndex =
        (u32(inputY) * params.inputWidth + u32(inputX)) *
        ${i}u + inputBlock;
      value = inputData[inputIndex];
    }
    inputPatch[loadIndex] = value;
  }
  workgroupBarrier();

  let outputX =
    workgroupId.x * ${N}u + localId.x;
  let outputY =
    workgroupId.y * ${N}u + localId.y;
  let outputBlock = workgroupId.z;
  if (
    outputX >= params.outputWidth || outputY >= params.outputHeight ||
    outputBlock >= ${r}u
  ) {
    return;
  }

  var acc = bias[outputBlock];
  for (var ky = 0u; ky < 3u; ky++) {
    for (var kx = 0u; kx < 3u; kx++) {
      let patchBase =
        ((localId.y + ky) * ${K}u + localId.x + kx) *
        ${i}u;
      for (var inputBlock = 0u; inputBlock < ${i}u; inputBlock++) {
        ${Me("inputPatch[patchBase + inputBlock]",`((((outputBlock * 3u + ky) * 3u + kx) * ${i}u + inputBlock) * 4u)`,n)}
      }
    }
  }
  let outputIndex =
    (outputY * params.outputWidth + outputX) * ${r}u + outputBlock;
  outputData[outputIndex] = ${u};
}
`}function wn(n,e,t,i){const{workgroupX:r,workgroupY:o,tileM:a,tileKBlocks:u}=te(t),s=e?"params.outputWidth":"params.inputWidth",l=e?"params.outputHeight":"params.inputHeight",p=t.addressMode==="base-offset",c=i?i.blocks.map((h,f)=>`cachedBase${f}[load] = (${f===i.upsampled?"y / 2u":"y"} * params.source${f}Width + ${f===i.upsampled?"x / 2u":"x"}) * ${h}u;`).join(`
    `):`cachedBase0[load] = (y * params.inputWidth + x) * ${n}u;`,d=a*u/(r*o);return`
  ${p?`var cachedBase0: array<u32, ${d}>;
  ${i?`var cachedBase1: array<u32, ${d}>;`:""}`:`var cachedX: array<u32, ${d}>;
  var cachedY: array<u32, ${d}>;`}
  var cachedMask: array<u32, ${d}>;
  for (var load = 0u; load < ${d}u; load++) {
    let loadIndex = localLinear + load * ${r*o}u;
    let spatial = workgroupId.x * ${a}u + loadIndex / ${u}u;
    let x = spatial % params.outputWidth;
    let y = spatial / params.outputWidth;
    ${p?c:`cachedX[load] = x;
    cachedY[load] = y;`}
    let columns =
      select(0u, 0x049u, x > 0u && x - 1u < ${s}) |
      select(0u, 0x092u, x < ${s}) |
      select(0u, 0x124u, x + 1u < ${s});
    let rows =
      select(0u, 0x007u, y > 0u && y - 1u < ${l}) |
      select(0u, 0x038u, y < ${l}) |
      select(0u, 0x1c0u, y + 1u < ${l});
    cachedMask[load] = select(0u, columns & rows, spatial < spatialCount)${p&&i?" | ((x & 1u) << 9u) | ((y & 1u) << 10u)":""};
  }
  var channelBlock = (localLinear % ${u}u) % ${n}u;
  var filterPosition = (localLinear % ${u}u) / ${n}u;
`}function vn(n,e){const{tileKBlocks:t}=te(e);return`
    channelBlock += ${t%n}u;
    let carry = channelBlock >= ${n}u;
    channelBlock -= select(0u, ${n}u, carry);
    filterPosition += ${Math.floor(t/n)}u + select(0u, 1u, carry);
`}function Xe(n,e,t){const{workgroupX:i,workgroupY:r,tileM:o,tileKBlocks:a}=te(t);return`
    let inputBlock = channelBlock;
    let kernelY = filterPosition / 3u;
    let kernelX = filterPosition % 3u;
    for (var load = 0u; load < ${o*a/(i*r)}u; load++) {
      let loadIndex = localLinear + load * ${i*r}u;
      var value = ${n}(0.0);
      if (filterPosition < 9u && (cachedMask[load] & (1u << filterPosition)) != 0u) {
        ${t.addressMode==="base-offset"?"":`let inputX = i32(cachedX[load]) + i32(kernelX) - 1;
        let inputY = i32(cachedY[load]) + i32(kernelY) - 1;`}
        ${e}
      }
      inputTile[${nt("loadIndex",t)}] = value;
    }
`}function xo(n,e,t,i,r,o){const{workgroupX:a,workgroupY:u,rowsPerThread:s,tileM:l,tileNBlocks:p,tileKBlocks:c}=te(o),{addressMode:d,weightLayout:h}=o,f=z(n),g=z(e),_=Ze(n,o,!1),w=Ze(n,o,!0),m=_?"vec2<u32>":f,y=w?"vec2<u32>":f,B=re(pe("acc",t),e),v=a*u,k=l*c,$=c*p*4;return`${ne(n)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}
@group(0) @binding(0) var<storage, read> inputData: array<${m}>;
@group(0) @binding(1) var<storage, read> weights: array<${y}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${g}>;
@group(0) @binding(4) var<uniform> params: Params;

var<workgroup> inputTile: array<${f}, ${ge(o).input}>;
var<workgroup> weightTile: array<${f}, ${ge(o).weights}>;

@compute @workgroup_size(${a}, ${u}, 1)
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let spatialBase =
    workgroupId.x * ${l}u +
    localId.y * ${s}u;
  let outputBlock =
    workgroupId.y * ${p}u + localId.x;
  let spatialCount = params.outputWidth * params.outputHeight;
  var acc: array<vec4<f32>, ${s}>;
  if (outputBlock < ${r}u) {
    for (var row = 0u; row < ${s}u; row++) {
      acc[row] = bias[outputBlock];
    }
  }

  let localLinear =
    localId.y * ${a}u + localId.x;
  ${d!=="analytic"?wn(i,!1,o):""}
  let totalK = ${i*9}u;
  for (var kBase = 0u; kBase < totalK; kBase += ${c}u) {
    ${d!=="analytic"?Xe(f,`
        ${d==="base-offset"?`let offset = (i32(kernelY) - 1) * i32(params.inputWidth) + i32(kernelX) - 1;
        let inputIndex = cachedBase0[load] + u32(offset * ${i}) + inputBlock;`:`let inputIndex = (u32(inputY) * params.inputWidth + u32(inputX)) *
          ${i}u + inputBlock;`}
        value = ${Ee("inputData[inputIndex]",_)};
    `,o):`
    for (
      var loadIndex = localLinear;
      loadIndex < ${k}u;
      loadIndex += ${v}u
    ) {
      let tileSpatial = loadIndex / ${c}u;
      let tileK = loadIndex % ${c}u;
      let inputSpatialIndex =
        workgroupId.x * ${l}u + tileSpatial;
      let kIndex = kBase + tileK;
      var value = ${f}(0.0);
      if (inputSpatialIndex < spatialCount && kIndex < totalK) {
        let outputY = inputSpatialIndex / params.outputWidth;
        let outputX = inputSpatialIndex % params.outputWidth;
        let inputBlock = kIndex % ${i}u;
        let kernelIndex = kIndex / ${i}u;
        let kernelY = kernelIndex / 3u;
        let kernelX = kernelIndex % 3u;
        let inputY = i32(outputY) + i32(kernelY) - 1;
        let inputX = i32(outputX) + i32(kernelX) - 1;
        if (
          inputY >= 0 && inputY < i32(params.inputHeight) &&
          inputX >= 0 && inputX < i32(params.inputWidth)
        ) {
          let inputIndex =
            (u32(inputY) * params.inputWidth + u32(inputX)) *
            ${i}u + inputBlock;
          value = ${Ee("inputData[inputIndex]",_)};
        }
      }
      inputTile[${nt("loadIndex",o)}] = value;
    }
    `}

    for (
      var loadIndex = localLinear;
      loadIndex < ${$}u;
      loadIndex += ${v}u
    ) {
      let tileK = loadIndex / ${p*4}u;
      let outputRemainder = loadIndex % ${p*4}u;
      let tileOutputBlock = outputRemainder / 4u;
      let outputLane = outputRemainder % 4u;
      let loadedOutputBlock =
        workgroupId.y * ${p}u + tileOutputBlock;
      let kIndex = kBase + tileK;
      var value = ${f}(0.0);
      if (loadedOutputBlock < ${r}u && kIndex < totalK) {
        ${h==="k-major"?`
        let weightIndex = (kIndex * ${r}u + loadedOutputBlock) * 4u + outputLane;
        `:d!=="analytic"?`
        let weightIndex = (loadedOutputBlock * ${i*9}u + kIndex) * 4u + outputLane;
        `:`
        let inputBlock = kIndex % ${i}u;
        let kernelIndex = kIndex / ${i}u;
        let kernelY = kernelIndex / 3u;
        let kernelX = kernelIndex % 3u;
        let weightIndex =
          ((((loadedOutputBlock * 3u + kernelY) * 3u + kernelX) *
            ${i}u + inputBlock) * 4u + outputLane);
        `}
        value = ${Ee("weights[weightIndex]",w)};
      }
      weightTile[${mn("loadIndex",o)}] = value;
    }

    workgroupBarrier();
    ${yn(n,o)}
    workgroupBarrier();
    ${d!=="analytic"?vn(i,o):""}
  }

  if (outputBlock < ${r}u) {
    for (var row = 0u; row < ${s}u; row++) {
      let spatialIndex = spatialBase + row;
      if (spatialIndex < spatialCount) {
        let outputIndex = spatialIndex * ${r}u + outputBlock;
        outputData[outputIndex] = ${B.replaceAll("acc","acc[row]")};
      }
    }
  }
}
`}function bo(n,e,t,i){const r=z(n),o=pe("acc",e);return`${ne(n)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  inputBlocks: u32,
  outputBlocks: u32,
}
@group(0) @binding(0) var<storage, read> inputData: array<${r}>;
@group(0) @binding(1) var<storage, read> weights: array<${r}>;
@group(0) @binding(2) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData: array<${r}>;
@group(0) @binding(4) var<uniform> params: Params;

@compute @workgroup_size(${D}, ${D}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.outputWidth || gid.y >= params.outputHeight || gid.z >= ${i}u) {
    return;
  }
  var pooled = vec4<f32>(-3.402823466e+38);
  for (var py = 0u; py < 2u; py++) {
    let centerY = gid.y * 2u + py;
    if (centerY >= params.inputHeight) { continue; }
    for (var px = 0u; px < 2u; px++) {
      let centerX = gid.x * 2u + px;
      if (centerX >= params.inputWidth) { continue; }
      var acc = bias[gid.z];
      for (var ky = 0u; ky < 3u; ky++) {
        let inputY = i32(centerY) + i32(ky) - 1;
        if (inputY < 0 || inputY >= i32(params.inputHeight)) { continue; }
        for (var kx = 0u; kx < 3u; kx++) {
          let inputX = i32(centerX) + i32(kx) - 1;
          if (inputX < 0 || inputX >= i32(params.inputWidth)) { continue; }
          let pixelBase = (u32(inputY) * params.inputWidth + u32(inputX)) * ${t}u;
          for (var inputBlock = 0u; inputBlock < ${t}u; inputBlock++) {
            ${Me("inputData[pixelBase + inputBlock]",`((((gid.z * 3u + ky) * 3u + kx) * ${t}u + inputBlock) * 4u)`,n)}
          }
        }
      }
      pooled = max(pooled, ${o});
    }
  }
  let outputIndex = (gid.y * params.outputWidth + gid.x) * ${i}u + gid.z;
  outputData[outputIndex] = ${re("pooled",n)};
}
`}function $o(n,e,t){const i=z(n);return`${ne(n)}
struct Params {
  inputWidth: u32,
  inputHeight: u32,
  outputWidth: u32,
  outputHeight: u32,
  outputBlocks: u32,
}
@group(0) @binding(0) var<storage, read> inputData: array<${i}>;
@group(0) @binding(1) var<storage, read_write> outputData: array<${i}>;
@group(0) @binding(2) var<uniform> params: Params;

@compute @workgroup_size(${D}, ${D}, 1)
fn main(
  @builtin(global_invocation_id) gid: vec3<u32>${t?`,
  @builtin(num_workgroups) groupCount: vec3<u32>`:""}
) {
  ${t?`let linearX = gid.x + gid.z * groupCount.x * ${D}u;
  let outputBlock = linearX % ${e}u;
  let outputX = linearX / ${e}u;`:`let outputBlock = gid.z;
  let outputX = gid.x;`}
  if (
    outputX >= params.outputWidth ||
    gid.y >= params.outputHeight ||
    outputBlock >= ${e}u
  ) {
    return;
  }
  var pooled = vec4<f32>(-3.402823466e+38);
  for (var py = 0u; py < 2u; py++) {
    let inputY = gid.y * 2u + py;
    if (inputY >= params.inputHeight) { continue; }
    for (var px = 0u; px < 2u; px++) {
      let inputX = outputX * 2u + px;
      if (inputX >= params.inputWidth) { continue; }
      let inputIndex =
        (inputY * params.inputWidth + inputX) * ${e}u + outputBlock;
      pooled = max(pooled, vec4<f32>(inputData[inputIndex]));
    }
  }
  let outputIndex =
    (gid.y * params.outputWidth + outputX) * ${e}u + outputBlock;
  outputData[outputIndex] = ${re("pooled",n)};
}
`}function ko(n,e,t,i,r,o,a){const{workgroupX:u,workgroupY:s,rowsPerThread:l,tileM:p,tileNBlocks:c,tileKBlocks:d}=te(a),{addressMode:h,weightLayout:f}=a,g=z(n),_=z(e),w=Ze(n,a,!1),m=Ze(n,a,!0),y=w?"vec2<u32>":g,B=m?"vec2<u32>":g,v=i[0]+i[1],k=re(pe("acc[row]",t),e),$=u*s,C=p*d,U=d*c*4,Y=(M,_e)=>`
          {
            let sourceBlock = ${_e};
            ${h==="base-offset"?`let dx = ${M===r?"(i32((cachedMask[load] >> 9u) & 1u) + i32(kernelX) - 1) >> 1u":"i32(kernelX) - 1"};
            let dy = ${M===r?"(i32((cachedMask[load] >> 10u) & 1u) + i32(kernelY) - 1) >> 1u":"i32(kernelY) - 1"};
            let offset = (dy * i32(params.source${M}Width) + dx) * ${i[M]};
            let sourceIndex = cachedBase${M}[load] + u32(offset) + sourceBlock;`:`let sourceX = ${M===r?"u32(inputX) / 2u":"u32(inputX)"};
            let sourceY = ${M===r?"u32(inputY) / 2u":"u32(inputY)"};
            let sourceIndex =
              (sourceY * params.source${M}Width + sourceX) *
              ${i[M]}u + sourceBlock;`}
            value = ${Ee(`input${M}[sourceIndex]`,w)};
          }`;return`${ne(n)}
struct Params {
  outputWidth: u32,
  outputHeight: u32,
  outputBlocks: u32,
  inputBlocks: u32,
  source0Width: u32,
  source0Height: u32,
  source1Width: u32,
  source1Height: u32,
}
@group(0) @binding(0) var<storage, read> input0: array<${y}>;
@group(0) @binding(1) var<storage, read> input1: array<${y}>;
@group(0) @binding(2) var<storage, read> weights: array<${B}>;
@group(0) @binding(3) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> outputData: array<${_}>;
@group(0) @binding(5) var<uniform> params: Params;

var<workgroup> inputTile: array<${g}, ${ge(a).input}>;
var<workgroup> weightTile: array<${g}, ${ge(a).weights}>;

@compute @workgroup_size(${u}, ${s}, 1)
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let spatialBase =
    workgroupId.x * ${p}u +
    localId.y * ${l}u;
  let outputBlock =
    workgroupId.y * ${c}u + localId.x;
  let spatialCount = params.outputWidth * params.outputHeight;
  var acc: array<vec4<f32>, ${l}>;
  if (outputBlock < ${o}u) {
    for (var row = 0u; row < ${l}u; row++) {
      acc[row] = bias[outputBlock];
    }
  }

  let localLinear =
    localId.y * ${u}u + localId.x;
  ${h!=="analytic"?wn(v,!0,a,{blocks:i,upsampled:r}):""}
  let totalK = ${v*9}u;
  for (var kBase = 0u; kBase < totalK; kBase += ${d}u) {
    ${h!=="analytic"?a.decoderLoad==="source-first"?`
    if (channelBlock < ${i[0]}u) {
      ${Xe(g,Y(0,"inputBlock"),a)}
    } else {
      ${Xe(g,Y(1,`inputBlock - ${i[0]}u`),a)}
    }
    `:Xe(g,`
        if (inputBlock < ${i[0]}u) {
          ${Y(0,"inputBlock")}
        } else {
          ${Y(1,`inputBlock - ${i[0]}u`)}
        }
    `,a):`
    for (
      var loadIndex = localLinear;
      loadIndex < ${C}u;
      loadIndex += ${$}u
    ) {
      let tileSpatial = loadIndex / ${d}u;
      let tileK = loadIndex % ${d}u;
      let outputSpatialIndex =
        workgroupId.x * ${p}u + tileSpatial;
      let kIndex = kBase + tileK;
      var value = ${g}(0.0);
      if (outputSpatialIndex < spatialCount && kIndex < totalK) {
        let outputY = outputSpatialIndex / params.outputWidth;
        let outputX = outputSpatialIndex % params.outputWidth;
        let inputBlock = kIndex % ${v}u;
        let kernelIndex = kIndex / ${v}u;
        let kernelY = kernelIndex / 3u;
        let kernelX = kernelIndex % 3u;
        let inputY = i32(outputY) + i32(kernelY) - 1;
        let inputX = i32(outputX) + i32(kernelX) - 1;
        if (
          inputY >= 0 && inputY < i32(params.outputHeight) &&
          inputX >= 0 && inputX < i32(params.outputWidth)
        ) {
          if (inputBlock < ${i[0]}u) {
            ${Y(0,"inputBlock")}
          } else {
            ${Y(1,`inputBlock - ${i[0]}u`)}
          }
        }
      }
      inputTile[${nt("loadIndex",a)}] = value;
    }
    `}

    for (
      var loadIndex = localLinear;
      loadIndex < ${U}u;
      loadIndex += ${$}u
    ) {
      let tileK = loadIndex / ${c*4}u;
      let outputRemainder = loadIndex % ${c*4}u;
      let tileOutputBlock = outputRemainder / 4u;
      let outputLane = outputRemainder % 4u;
      let loadedOutputBlock =
        workgroupId.y * ${c}u + tileOutputBlock;
      let kIndex = kBase + tileK;
      var value = ${g}(0.0);
      if (loadedOutputBlock < ${o}u && kIndex < totalK) {
        ${f==="k-major"?`
        let weightIndex = (kIndex * ${o}u + loadedOutputBlock) * 4u + outputLane;
        `:h!=="analytic"?`
        let weightIndex = (loadedOutputBlock * ${v*9}u + kIndex) * 4u + outputLane;
        `:`
        let inputBlock = kIndex % ${v}u;
        let kernelIndex = kIndex / ${v}u;
        let kernelY = kernelIndex / 3u;
        let kernelX = kernelIndex % 3u;
        let weightIndex =
          ((((loadedOutputBlock * 3u + kernelY) * 3u + kernelX) *
            ${v}u + inputBlock) * 4u + outputLane);
        `}
        value = ${Ee("weights[weightIndex]",m)};
      }
      weightTile[${mn("loadIndex",a)}] = value;
    }

    workgroupBarrier();
    ${yn(n,a)}
    workgroupBarrier();
    ${h!=="analytic"?vn(v,a):""}
  }

  if (outputBlock < ${o}u) {
    for (var row = 0u; row < ${l}u; row++) {
      let spatialIndex = spatialBase + row;
      if (spatialIndex < spatialCount) {
        let outputIndex = spatialIndex * ${o}u + outputBlock;
        outputData[outputIndex] = ${k};
      }
    }
  }
}
`}function Io(n,e,t,i,r,o){const a=z(n),u=z(e),s=i[0]+i[1],l=(c,d)=>{const h=c===r;return`
      {
        let sourceX = ${h?"u32(inputX) / 2u":"u32(inputX)"};
        let sourceY = ${h?"u32(inputY) / 2u":"u32(inputY)"};
        let sourcePixelBase = (sourceY * params.source${c}Width + sourceX) * ${i[c]}u;
        for (var sourceBlock = 0u; sourceBlock < ${i[c]}u; sourceBlock++) {
          let inputBlock = ${d}u + sourceBlock;
          ${Me(`input${c}[sourcePixelBase + sourceBlock]`,`((((gid.z * 3u + ky) * 3u + kx) * ${s}u + inputBlock) * 4u)`,n)}
        }
      }
`},p=re(pe("acc",t),e);return`${ne(n)}
struct Params {
  outputWidth: u32,
  outputHeight: u32,
  outputBlocks: u32,
  inputBlocks: u32,
  source0Width: u32,
  source0Height: u32,
  source1Width: u32,
  source1Height: u32,
}
@group(0) @binding(0) var<storage, read> input0: array<${a}>;
@group(0) @binding(1) var<storage, read> input1: array<${a}>;
@group(0) @binding(2) var<storage, read> weights: array<${a}>;
@group(0) @binding(3) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> outputData: array<${u}>;
@group(0) @binding(5) var<uniform> params: Params;

@compute @workgroup_size(${D}, ${D}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.outputWidth || gid.y >= params.outputHeight || gid.z >= ${o}u) {
    return;
  }
  var acc = bias[gid.z];
  for (var ky = 0u; ky < 3u; ky++) {
    let inputY = i32(gid.y) + i32(ky) - 1;
    if (inputY < 0 || inputY >= i32(params.outputHeight)) { continue; }
    for (var kx = 0u; kx < 3u; kx++) {
      let inputX = i32(gid.x) + i32(kx) - 1;
      if (inputX < 0 || inputX >= i32(params.outputWidth)) { continue; }
      ${l(0,0)}
      ${l(1,i[0])}
    }
  }
  let outputIndex = (gid.y * params.outputWidth + gid.x) * ${o}u + gid.z;
  outputData[outputIndex] = ${p};
}
`}function To(n,e,t,i,r,o){const a=z(n),u=z(e),s=i[0]+i[1],l=K*K*s,p=N*N,c=re(pe("acc",t),e),d=(h,f)=>`
      let sourceBlock = ${f};
      let sourceIndex =
        (${h===r?"u32(inputY) / 2u":"u32(inputY)"} * params.source${h}Width + ${h===r?"u32(inputX) / 2u":"u32(inputX)"}) *
        ${i[h]}u + sourceBlock;
      value = input${h}[sourceIndex];`;return`${ne(n)}
struct Params {
  outputWidth: u32,
  outputHeight: u32,
  outputBlocks: u32,
  inputBlocks: u32,
  source0Width: u32,
  source0Height: u32,
  source1Width: u32,
  source1Height: u32,
}
@group(0) @binding(0) var<storage, read> input0: array<${a}>;
@group(0) @binding(1) var<storage, read> input1: array<${a}>;
@group(0) @binding(2) var<storage, read> weights: array<${a}>;
@group(0) @binding(3) var<storage, read> bias: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> outputData: array<${u}>;
@group(0) @binding(5) var<uniform> params: Params;

var<workgroup> inputPatch: array<${a}, ${l}>;

@compute @workgroup_size(${N}, ${N}, 1)
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let localLinear =
    localId.y * ${N}u + localId.x;
  for (
    var loadIndex = localLinear;
    loadIndex < ${l}u;
    loadIndex += ${p}u
  ) {
    let patchPixel = loadIndex / ${s}u;
    let inputBlock = loadIndex % ${s}u;
    let patchX = patchPixel % ${K}u;
    let patchY = patchPixel / ${K}u;
    let inputX =
      i32(workgroupId.x * ${N}u + patchX) - 1;
    let inputY =
      i32(workgroupId.y * ${N}u + patchY) - 1;
    var value = ${a}(0.0);
    if (
      inputX >= 0 && inputX < i32(params.outputWidth) &&
      inputY >= 0 && inputY < i32(params.outputHeight)
    ) {
      if (inputBlock < ${i[0]}u) {
        ${d(0,"inputBlock")}
      } else {
        ${d(1,`inputBlock - ${i[0]}u`)}
      }
    }
    inputPatch[loadIndex] = value;
  }
  workgroupBarrier();

  let outputX =
    workgroupId.x * ${N}u + localId.x;
  let outputY =
    workgroupId.y * ${N}u + localId.y;
  let outputBlock = workgroupId.z;
  if (
    outputX >= params.outputWidth || outputY >= params.outputHeight ||
    outputBlock >= ${o}u
  ) {
    return;
  }

  var acc = bias[outputBlock];
  for (var ky = 0u; ky < 3u; ky++) {
    for (var kx = 0u; kx < 3u; kx++) {
      let patchBase =
        ((localId.y + ky) * ${K}u + localId.x + kx) *
        ${s}u;
      for (var inputBlock = 0u; inputBlock < ${s}u; inputBlock++) {
        ${Me("inputPatch[patchBase + inputBlock]",`((((outputBlock * 3u + ky) * 3u + kx) * ${s}u + inputBlock) * 4u)`,n)}
      }
    }
  }
  let outputIndex =
    (outputY * params.outputWidth + outputX) * ${o}u + outputBlock;
  outputData[outputIndex] = ${c};
}
`}function pi(n,e){const t=z(n),i=Array.from({length:e},(u,s)=>`@group(0) @binding(${s}) var<storage, read> input${s}: array<vec4<f32>>;`).join(`
`),r=Array.from({length:e},(u,s)=>{const l=s*3;return`if (channel < ${l+3}u) { return input${s}[pixel][channel - ${l}u]; }`}).join(`
  `),o=e,a=e+1;return`${ne(n)}
struct Params {
  width: u32,
  height: u32,
  outputBlocks: u32,
  inputChannels: u32,
}
${i}
@group(0) @binding(${o}) var<storage, read_write> outputData: array<${t}>;
@group(0) @binding(${a}) var<uniform> params: Params;

fn readChannel(pixel: u32, channel: u32) -> f32 {
  ${r}
  return 0.0;
}

@compute @workgroup_size(${D}, ${D}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height || gid.z >= params.outputBlocks) {
    return;
  }
  let pixel = gid.y * params.width + gid.x;
  let firstChannel = gid.z * 4u;
  let value = vec4<f32>(
    readChannel(pixel, firstChannel),
    readChannel(pixel, firstChannel + 1u),
    readChannel(pixel, firstChannel + 2u),
    readChannel(pixel, firstChannel + 3u)
  );
  outputData[pixel * params.outputBlocks + gid.z] = ${re("value",n)};
}
`}function Bo(n){return n.op==="concat"?n.inputs:n.op==="fusedUpsampleConcatConv2d"?n.inputs.map(e=>e.value):[n.input]}function Po(n,e="auto"){const t=n.features.has("shader-f16");if(e==="fp16"&&!t)throw new Error("OIDN FP16 was requested but the GPUDevice does not have shader-f16 enabled");return e==="auto"?t?"fp16":"fp32":e}class So{_device;precision;kernelSetting;gemm;maxSpatialInputBlocks;subgroupsAvailable;_model;_gemmByOutputBlocks=new Map;_packedConvs=new Map;_pipelineCache;_pipelinePromises;_executionCache=new Map;_retiredExecutions=new Set;_clock=0;_shapeCacheSize;_profileNextExecution=!1;_lastExecutionProfile;_profileOperations=0;_resources=new fn;_disposed=!1;constructor(e,t,i={}){this._device=e;const r=ho(e);this._pipelineCache=r.ready,this._pipelinePromises=r.pending,this.precision=Po(e,i.precision??"auto"),this.kernelSetting=i.kernel??"auto";const o=i.gemm?.workgroupSize??[8,8];if(this.gemm=Object.freeze({tilePolicy:i.gemm?.tilePolicy??(i.gemm?.workgroupSize?"fixed":"output-aligned"),decoderLoad:i.gemm?.decoderLoad??"per-load",poolLayout:i.gemm?.poolLayout??"channels",sharedLayout:i.gemm?.sharedLayout??(this.precision==="fp16"?"padded-input":"padded"),accumulationOrder:i.gemm?.accumulationOrder??"k-major",finalLayer:i.gemm?.finalLayer??"shared-auto",loadMode:i.gemm?.loadMode??"native",addressMode:i.gemm?.addressMode??"incremental",weightLayout:i.gemm?.weightLayout??"k-major",rowsPerThread:i.gemm?.rowsPerThread??8,workgroupSize:Object.freeze([o[0],o[1]])}),!["fixed","output-aligned"].includes(this.gemm.tilePolicy))throw new Error(`Unsupported GEMM tile policy: ${this.gemm.tilePolicy}`);if(!["per-load","source-first"].includes(this.gemm.decoderLoad))throw new Error(`Unsupported GEMM decoder load: ${this.gemm.decoderLoad}`);if(!["spatial","channels"].includes(this.gemm.poolLayout))throw new Error(`Unsupported GEMM pool layout: ${this.gemm.poolLayout}`);if(!["linear","padded","padded-input","padded-weights"].includes(this.gemm.sharedLayout))throw new Error(`Unsupported GEMM shared layout: ${this.gemm.sharedLayout}`);if(!["k-major","row-major"].includes(this.gemm.accumulationOrder))throw new Error(`Unsupported GEMM accumulation order: ${this.gemm.accumulationOrder}`);if(!["direct","shared-input","shared-input-weights","shared-auto"].includes(this.gemm.finalLayer))throw new Error(`Unsupported GEMM final layer: ${this.gemm.finalLayer}`);if(!["native","packed-weights","packed-all"].includes(this.gemm.loadMode))throw new Error(`Unsupported GEMM load mode: ${this.gemm.loadMode}`);if(!["analytic","incremental","base-offset"].includes(this.gemm.addressMode))throw new Error(`Unsupported GEMM address mode: ${this.gemm.addressMode}`);if(!["output-major","k-major"].includes(this.gemm.weightLayout))throw new Error(`Unsupported GEMM weight layout: ${this.gemm.weightLayout}`);const a=te(this.gemm),u=(ge(this.gemm).input+ge(this.gemm).weights)*4*(this.precision==="fp16"?2:4);if(![2,4,8].includes(a.rowsPerThread)||![4,8,16].includes(a.workgroupX)||![4,8].includes(a.workgroupY)||o.length!==2||a.workgroupX>e.limits.maxComputeWorkgroupSizeX||a.workgroupY>e.limits.maxComputeWorkgroupSizeY||a.workgroupX*a.workgroupY>e.limits.maxComputeInvocationsPerWorkgroup||u>e.limits.maxComputeWorkgroupStorageSize)throw new Error("Unsupported GEMM tile configuration for this GPUDevice");if(this.subgroupsAvailable=e.features.has("subgroups"),this.maxSpatialInputBlocks=this.precision==="fp16"&&e.limits.maxComputeInvocationsPerWorkgroup>=N*N&&e.limits.maxComputeWorkgroupSizeX>=N&&e.limits.maxComputeWorkgroupSizeY>=N?Math.floor(e.limits.maxComputeWorkgroupStorageSize/(K*K*4*2)):0,this._shapeCacheSize=Math.max(1,i.shapeCacheSize??2),t.inputChannels%3!==0||t.inputChannels<3||t.inputChannels>9)throw new Error(`Native OIDN expects 3, 6, or 9 input channels, got ${t.inputChannels}`);this._model={spec:t.spec,inputChannels:t.inputChannels,outputChannels:t.outputChannels,channelsByValue:new Map(t.channelsByValue),convChannels:new Map(t.convChannels)};for(const s of kt(this._model,{fuseConvPool:!1}).nodes)if(s.op!=="conv2d"&&s.op!=="maxPool2d"&&s.op!=="fusedConvReluMaxPool2d"&&s.op!=="fusedUpsampleConcatConv2d")throw new Error(`Native OIDN descriptor ${t.spec.id} leaves unsupported ${s.op} node ${s.id} after graph optimization`);try{for(const[s,l]of t.convTensors){const c=this._selectConvKernel(A(l.inputChannels),s===t.spec.output)==="implicit-gemm"?this.gemm.weightLayout:"output-major",d=mo(e,s,l,this.precision,c);this._resources.track("gpu-buffer",d.weights),this._resources.track("gpu-buffer",d.bias),this._packedConvs.set(s,d)}}catch(s){for(const l of this._packedConvs.values())this._releaseBuffer(l.weights),this._releaseBuffer(l.bias);throw this._packedConvs.clear(),s}}_pipeline(e,t){let i=this._pipelineCache.get(e);return i||(i=this._device.createComputePipeline({label:`oidn/${e}`,layout:"auto",compute:{module:this._device.createShaderModule({label:`oidn/${e}`,code:t}),entryPoint:"main"}}),this._pipelineCache.set(e,i)),i}_pipelineAsync(e,t){const i=this._pipelineCache.get(e);if(i)return Promise.resolve(i);const r=this._pipelinePromises.get(e);if(r)return r;const o=this._device.createComputePipelineAsync({label:`oidn/${e}`,layout:"auto",compute:{module:this._device.createShaderModule({label:`oidn/${e}`,code:t}),entryPoint:"main"}}).then(a=>(this._pipelineCache.set(e,a),this._pipelinePromises.delete(e),a),a=>{throw this._pipelinePromises.delete(e),a});return this._pipelinePromises.set(e,o),o}_nodePipelineSpec(e,t){if(e.op==="conv2d"){const i=t?"fp32":this.precision,r=A(this._model.convChannels.get(e.id).inputChannels),o=A(this._model.convChannels.get(e.id).outputChannels),a=this._gemmForOutput(o),u=this._selectConvKernel(r,t),s=a.finalLayer==="shared-input-weights"||a.finalLayer==="shared-auto"&&ai(this.precision,r,!0)<=this._device.limits.maxComputeWorkgroupStorageSize;return t&&this._model.convChannels.get(e.id).outputChannels===3&&(this.kernelSetting==="auto"||this.kernelSetting==="implicit-gemm")&&a.finalLayer!=="direct"&&this._device.limits.maxComputeWorkgroupSizeX>=8&&this._device.limits.maxComputeWorkgroupSizeY>=8&&this._device.limits.maxComputeInvocationsPerWorkgroup>=64&&ai(this.precision,r,s)<=this._device.limits.maxComputeWorkgroupStorageSize?{key:`conv-final-rgb/${this.precision}/${e.activation}/in${r}/weights-${s?"shared":"storage"}`,kernel:"direct",code:so(this.precision,e.activation,r,s)}:{key:`conv-${u}/${this.precision}/${i}/${e.activation}/in${r}/out${o}`+(u==="implicit-gemm"?`/address-${a.addressMode}/weights-${a.weightLayout}-v1/tile-${a.workgroupSize.join("x")}-r${a.rowsPerThread}/loads-${a.loadMode}/shared-${a.sharedLayout}/acc-${a.accumulationOrder}`:""),kernel:u,code:u==="implicit-gemm"?xo(this.precision,i,e.activation,r,o,a):u==="spatial"?vo(this.precision,i,e.activation,r,o):u==="subgroup"?wo(this.precision,i,e.activation,r,o):yo(this.precision,i,e.activation,r,o)}}if(e.op==="maxPool2d"){const i=A(this._model.channelsByValue.get(e.id)),r=this._coalescedPool();return{key:`max-pool/${this.precision}/out${i}/${r?"channels":"spatial"}`,kernel:"direct",code:$o(this.precision,i,r)}}if(e.op==="fusedConvReluMaxPool2d"){const i=A(this._model.convChannels.get(e.conv.id).inputChannels),r=A(this._model.convChannels.get(e.conv.id).outputChannels);return{key:`conv-pool/${this.precision}/${e.conv.activation}/in${i}/out${r}`,kernel:"direct",code:bo(this.precision,e.conv.activation,i,r)}}if(e.op==="fusedUpsampleConcatConv2d"){if(e.inputs.length!==2)throw new Error(`Native fused decoder ${e.id} requires two inputs`);const i=e.inputs.map(d=>A(this._model.channelsByValue.get(d.value))),r=e.inputs.findIndex(d=>d.upsample);if(r!==0&&r!==1)throw new Error(`Native fused decoder ${e.id} has no upsample input`);const o=i[0]+i[1],a=t?"fp32":this.precision,u=this._selectConvKernel(o,t),s=u==="subgroup"?"direct":u,l=A(this._model.convChannels.get(e.conv.id).outputChannels),p=this._gemmForOutput(l);return{key:`decoder-${s}/${this.precision}/${a}/${e.conv.activation}/${i.join("+")}/out${l}/up${r}`+(s==="implicit-gemm"?`/address-${p.addressMode}/weights-${p.weightLayout}-v1/tile-${p.workgroupSize.join("x")}-r${p.rowsPerThread}/loads-${p.loadMode}/shared-${p.sharedLayout}/acc-${p.accumulationOrder}/decoder-${p.decoderLoad}`:""),kernel:s,code:s==="implicit-gemm"?ko(this.precision,a,e.conv.activation,i,r,l,p):s==="spatial"?To(this.precision,a,e.conv.activation,i,r,l):Io(this.precision,a,e.conv.activation,i,r,l)}}throw new Error(`Native OIDN does not implement unfused ${e.op} node ${e.id}`)}_gemmForOutput(e){if(this.gemm.tilePolicy!=="output-aligned"||this.gemm.workgroupSize[0]!==8||e<=0||e%16!==0)return this.gemm;const t=this._gemmByOutputBlocks.get(e);if(t)return t;const i=Object.freeze({...this.gemm,workgroupSize:Object.freeze([16,this.gemm.workgroupSize[1]])}),r=te(i),o=ge(i),a=this._device.limits,s=r.workgroupX<=a.maxComputeWorkgroupSizeX&&r.workgroupY<=a.maxComputeWorkgroupSizeY&&r.workgroupX*r.workgroupY<=a.maxComputeInvocationsPerWorkgroup&&(o.input+o.weights)*4*(this.precision==="fp16"?2:4)<=a.maxComputeWorkgroupStorageSize?i:this.gemm;return this._gemmByOutputBlocks.set(e,s),s}_coalescedPool(){return this.gemm.poolLayout==="channels"&&(this.kernelSetting==="auto"||this.kernelSetting==="implicit-gemm")}_selectConvKernel(e,t){const i=this.precision==="fp16"&&e<=this.maxSpatialInputBlocks;return this.kernelSetting==="direct"?"direct":this.kernelSetting==="spatial"?i?"spatial":"direct":this.kernelSetting==="implicit-gemm"?t?"direct":"implicit-gemm":this.kernelSetting==="subgroup"?this.subgroupsAvailable?"subgroup":"direct":t?"direct":"implicit-gemm"}_nodePipeline(e,t){const{key:i,code:r}=this._nodePipelineSpec(e,t);return this._pipeline(i,r)}async prepare(){if(this._disposed)throw new Error("Native OIDN executor is disposed");const e=kt(this._model,{fuseConvPool:!1}),t=this._model.inputChannels/3,i=[{key:`pack/${this.precision}/${t}`,code:pi(this.precision,t)},...e.nodes.map(r=>this._nodePipelineSpec(r,r.id===e.spec.output))];await Promise.all(i.map(({key:r,code:o})=>this._pipelineAsync(r,o)))}_createExecution(e,t){const i=po(this._model,e,t,{fuseConvPool:!1}),r=new Map,o=[],a=new Map;i.nodes.forEach((l,p)=>{for(const c of Bo(l))a.set(c,p)}),a.set(i.spec.output,i.nodes.length);const u=[],s=l=>(u.push(l),this._resources.track("gpu-buffer",l));try{const l=(m,y,B,v)=>{for(const C of o)C.activeValue&&(a.get(C.activeValue)??-1)<v&&(C.activeValue=void 0);const k=fo(y,B);let $=o.filter(C=>!C.activeValue&&C.capacity>=k).sort((C,U)=>C.capacity-U.capacity)[0];$||($={buffer:s(this._device.createBuffer({label:`oidn/activation/${e}x${t}/${o.length}`,size:Nt(k,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),capacity:k},o.push($)),$.activeValue=m,r.set(m,$.buffer)};l(i.spec.input,i.inputShape,this.precision==="fp16"?2:4,-1),i.plannedNodes.forEach(({node:m,outputShape:y},B)=>{const v=m.id===i.spec.output;l(m.id,y,v||this.precision==="fp32"?4:2,B)});const p=this._model.inputChannels/3,c=`pack/${this.precision}/${p}`,d=this._pipeline(c,pi(this.precision,p)),h=[],f=[],g=[],_=[];i.plannedNodes.forEach(({node:m,outputShape:y},B)=>{const v=m.id===i.spec.output,k=this._nodePipelineSpec(m,v),$=this._pipeline(k.key,k.code);h.push($),f.push(k.kernel??"direct");const C=r.get(m.id);let U,Y,M;if(m.op==="conv2d"){const W=i.valueShapes.get(m.input);M=m.id,Y=[W.width,W.height,y.width,y.height,A(W.channels),A(y.channels)];const H=this._packedConvs.get(M);U=[{binding:0,resource:{buffer:r.get(m.input)}},{binding:1,resource:{buffer:H.weights}},{binding:2,resource:{buffer:H.bias}},{binding:3,resource:{buffer:C}}]}else if(m.op==="maxPool2d"){const W=i.valueShapes.get(m.input);Y=[W.width,W.height,y.width,y.height,A(y.channels)],U=[{binding:0,resource:{buffer:r.get(m.input)}},{binding:1,resource:{buffer:C}}]}else if(m.op==="fusedConvReluMaxPool2d"){const W=i.valueShapes.get(m.input);M=m.conv.id,Y=[W.width,W.height,y.width,y.height,A(W.channels),A(y.channels)];const H=this._packedConvs.get(M);U=[{binding:0,resource:{buffer:r.get(m.input)}},{binding:1,resource:{buffer:H.weights}},{binding:2,resource:{buffer:H.bias}},{binding:3,resource:{buffer:C}}]}else if(m.op==="fusedUpsampleConcatConv2d"){M=m.conv.id;const W=i.valueShapes.get(m.inputs[0].value),H=i.valueShapes.get(m.inputs[1].value);Y=[y.width,y.height,A(y.channels),A(this._model.convChannels.get(M).inputChannels),W.width,W.height,H.width,H.height];const Ie=this._packedConvs.get(M);U=[{binding:0,resource:{buffer:r.get(m.inputs[0].value)}},{binding:1,resource:{buffer:r.get(m.inputs[1].value)}},{binding:2,resource:{buffer:Ie.weights}},{binding:3,resource:{buffer:Ie.bias}},{binding:4,resource:{buffer:C}}]}else throw new Error(`Unexpected native node ${m.op}`);const _e=s(li(this._device,`oidn/${m.id}/params/${e}x${t}`,Y));_.push(_e),U.push({binding:U.length,resource:{buffer:_e}}),g.push(this._device.createBindGroup({label:`oidn/${m.id}/bindings`,layout:$.getBindGroupLayout(0),entries:U}))});const w=s(li(this._device,`oidn/input/params/${e}x${t}`,[e,t,A(this._model.inputChannels),this._model.inputChannels]));return _.push(w),{plan:i,valueBuffers:r,slots:o,nodeBindings:g,nodePipelines:h,nodeKernels:f,inputPipeline:d,inputUniform:w,ownedBuffers:_,lastUsed:++this._clock}}catch(l){for(const p of u)this._releaseBuffer(p);throw l}}_execution(e,t){if(this._disposed)throw new Error("Native OIDN executor is disposed");const i=`${e}x${t}`;let r=this._executionCache.get(i);if(!r&&(r=this._createExecution(e,t),this._executionCache.set(i,r),this._executionCache.size>this._shapeCacheSize)){const o=[...this._executionCache.entries()].filter(([a])=>a!==i).sort((a,u)=>a[1].lastUsed-u[1].lastUsed)[0];o&&(this._executionCache.delete(o[0]),this._retiredExecutions.add(o[1]),this._device.queue.onSubmittedWorkDone().catch(()=>{}).then(()=>{this._retiredExecutions.delete(o[1]),this._destroyExecution(o[1])}))}return r.lastUsed=++this._clock,r}prewarm(e){for(const t of e)this._execution(t.width,t.height)}profileNextExecution(){return this._device.features.has("timestamp-query")?(this._profileNextExecution=!0,!0):!1}getLastExecutionProfile(){return this._lastExecutionProfile}execute(e,t,i){const r=this._model.inputChannels/3;if(e.length!==r)throw new Error(`Native OIDN expected ${r} input buffers, got ${e.length}`);const o=this._execution(t,i),a=["input-pack",...o.plan.nodes.map(f=>f.id)],u=this._profileNextExecution&&this._device.features.has("timestamp-query");this._profileNextExecution=!1;const s=a.length*2,l=u?this._resources.track("gpu-query-set",this._device.createQuerySet({type:"timestamp",count:s})):void 0,p=s*8;let c,d;try{c=u?this._resources.track("gpu-buffer",this._device.createBuffer({label:`oidn/profile/resolve/${t}x${i}`,size:p,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC})):void 0,d=u?this._resources.track("gpu-buffer",this._device.createBuffer({label:`oidn/profile/readback/${t}x${i}`,size:p,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ})):void 0}catch(f){throw this._releaseBuffer(d),this._releaseBuffer(c),this._releaseQuerySet(l),f}const h=(f,g)=>({label:f,...l?{timestampWrites:{querySet:l,beginningOfPassWriteIndex:g*2,endOfPassWriteIndex:g*2+1}}:{}});try{const f=this._device.createCommandEncoder({label:`oidn/native/${t}x${i}`}),g=e.map((w,m)=>({binding:m,resource:{buffer:w}}));g.push({binding:r,resource:{buffer:o.valueBuffers.get(o.plan.spec.input)}}),g.push({binding:r+1,resource:{buffer:o.inputUniform}});const _=this._device.createBindGroup({label:"oidn/input/bindings",layout:o.inputPipeline.getBindGroupLayout(0),entries:g});{const w=f.beginComputePass(h("oidn/input-pack",0));w.setPipeline(o.inputPipeline),w.setBindGroup(0,_),w.dispatchWorkgroups(Math.ceil(t/D),Math.ceil(i/D),A(this._model.inputChannels)),w.end()}o.plan.plannedNodes.forEach(({node:w,outputShape:m},y)=>{const B=f.beginComputePass(h(`oidn/${o.plan.nodes[y].id}`,y+1));if(B.setPipeline(o.nodePipelines[y]),B.setBindGroup(0,o.nodeBindings[y]),w.op==="maxPool2d"&&this._coalescedPool()){const v=Math.ceil(m.width*A(m.channels)/D),k=this._device.limits.maxComputeWorkgroupsPerDimension;B.dispatchWorkgroups(Math.min(v,k),Math.ceil(m.height/D),Math.ceil(v/k))}else if(o.nodeKernels[y]==="implicit-gemm"){const v=te(this._gemmForOutput(A(m.channels)));B.dispatchWorkgroups(Math.ceil(m.width*m.height/v.tileM),Math.ceil(A(m.channels)/v.tileNBlocks),1)}else B.dispatchWorkgroups(Math.ceil(m.width/D),Math.ceil(m.height/D),A(m.channels));B.end()}),l&&(f.resolveQuerySet(l,0,s,c,0),f.copyBufferToBuffer(c,0,d,0,p)),this._device.queue.submit([f.finish()])}catch(f){throw this._releaseBuffer(d),this._releaseBuffer(c),this._releaseQuerySet(l),f}return l&&(this._profileOperations++,this._lastExecutionProfile=(async()=>{try{await d.mapAsync(GPUMapMode.READ);const f=new BigUint64Array(d.getMappedRange()),g=a.map((_,w)=>({id:_,durationMs:Number(f[w*2+1]-f[w*2])/1e6}));return{totalMs:g.reduce((_,w)=>_+w.durationMs,0),layers:g}}finally{d.mapState==="mapped"&&d.unmap(),this._releaseQuerySet(l),this._releaseBuffer(c),this._releaseBuffer(d),this._profileOperations--}})()),o.valueBuffers.get(o.plan.spec.output)}async executeCPU(e,t,i){const r=t*i*this._model.inputChannels;if(e.length!==r)throw new Error(`Native OIDN CPU input has ${e.length} values, expected ${r}`);const o=this._execution(t,i),a=this._model.inputChannels/3,u=t*i;o.cpuInputBuffers||(o.cpuInputBuffers=Array.from({length:a},(d,h)=>{const f=this._device.createBuffer({label:`oidn/cpu-input/${t}x${i}/${h}`,size:u*16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});return this._resources.track("gpu-buffer",f),o.ownedBuffers.push(f),f}),o.cpuReadbackBuffer=this._device.createBuffer({label:`oidn/cpu-readback/${t}x${i}`,size:u*16,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this._resources.track("gpu-buffer",o.cpuReadbackBuffer),o.ownedBuffers.push(o.cpuReadbackBuffer));for(let d=0;d<a;d++){const h=new Float32Array(u*4);for(let f=0;f<u;f++){const g=f*this._model.inputChannels+d*3,_=f*4;h[_]=e[g],h[_+1]=e[g+1],h[_+2]=e[g+2]}this._device.queue.writeBuffer(o.cpuInputBuffers[d],0,h)}const s=this.execute(o.cpuInputBuffers,t,i),l=this._device.createCommandEncoder({label:`oidn/cpu-readback/${t}x${i}`});l.copyBufferToBuffer(s,0,o.cpuReadbackBuffer,0,u*16),this._device.queue.submit([l.finish()]),await o.cpuReadbackBuffer.mapAsync(GPUMapMode.READ);const p=new Float32Array(o.cpuReadbackBuffer.getMappedRange()),c=new Float32Array(u*3);for(let d=0;d<u;d++)c[d*3]=p[d*4],c[d*3+1]=p[d*4+1],c[d*3+2]=p[d*4+2];return o.cpuReadbackBuffer.unmap(),c}_releaseBuffer(e){this._resources.release("gpu-buffer",e,()=>e.destroy())}_releaseQuerySet(e){this._resources.release("gpu-query-set",e,()=>e.destroy())}_destroyExecution(e){e.slots.forEach(t=>this._releaseBuffer(t.buffer)),e.ownedBuffers.forEach(t=>this._releaseBuffer(t))}getResourceInfo(){return this._resources.snapshot(this._retiredExecutions.size+this._profileOperations)}dispose(){if(!this._disposed){this._disposed=!0;for(const e of this._packedConvs.values())this._releaseBuffer(e.weights),this._releaseBuffer(e.bias);this._packedConvs.clear();for(const e of this._executionCache.values())this._destroyExecution(e);this._executionCache.clear();for(const e of this._retiredExecutions)this._destroyExecution(e);this._retiredExecutions.clear()}}}const di=new WeakMap;function Co(n,e){let t=di.get(n);t||(t=new Map,di.set(n,t));let i=t.get(e);if(!i){const r=n.createShaderModule({label:`oidn/webnn/input-pack/${e}`,code:Oo(e)}),o=n.createShaderModule({label:"oidn/webnn/output-unpack",code:Mo()});i={input:n.createComputePipeline({label:`oidn/webnn/input-pack/${e}`,layout:"auto",compute:{module:r,entryPoint:"main"}}),output:n.createComputePipeline({label:"oidn/webnn/output-unpack",layout:"auto",compute:{module:o,entryPoint:"main"}})},t.set(e,i)}return i}const le=8;function xn(n,e){return Math.ceil(n/e)*e}function Eo(n,e,t,i){const r=n.createBuffer({label:e,size:xn(t.byteLength,4),usage:i,mappedAtCreation:!0});return new Uint8Array(r.getMappedRange()).set(new Uint8Array(t.buffer,t.byteOffset,t.byteLength)),r.unmap(),r}function hi(n,e,t){const i=new Uint32Array(xn(t.length,4));return i.set(t),Eo(n,e,i,GPUBufferUsage.UNIFORM)}function ft(n,e,t,i){return!!n?.[e]?.[t]?.dataTypes?.includes?.(i)}function Ao(n,e){if(e==="fp16"&&n.desc.dataType==="Float16")return new Uint8Array(n.data.buffer,n.data.byteOffset,n.data.byteLength);if(e==="fp32"&&n.desc.dataType==="Float32")return new Uint8Array(n.data.buffer,n.data.byteOffset,n.data.byteLength);const t=n.desc.dataType==="Float32"?new Float32Array(n.data.buffer,n.data.byteOffset,n.data.byteLength/4):new S(n.data.buffer,n.data.byteOffset,n.data.byteLength/2),i=e==="fp16"?new S(t):new Float32Array(t);return new Uint8Array(i.buffer,i.byteOffset,i.byteLength)}function Oo(n){const e=Array.from({length:n},(i,r)=>`@group(0) @binding(${r}) var<storage, read> input${r}: array<vec4<f32>>;`).join(`
`),t=Array.from({length:n},(i,r)=>{const o=r*3;return`if (channel < ${o+3}u) {
      return input${r}[pixel][channel - ${o}u];
    }`}).join(`
  `);return`enable f16;
struct Params { width: u32, height: u32, channels: u32, padding: u32 }
${e}
@group(0) @binding(${n}) var<storage, read_write> outputData: array<f16>;
@group(0) @binding(${n+1}) var<uniform> params: Params;

fn readChannel(pixel: u32, channel: u32) -> f32 {
  ${t}
  return 0.0;
}

@compute @workgroup_size(${le}, ${le}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height || gid.z >= params.channels) {
    return;
  }
  let pixel = gid.y * params.width + gid.x;
  let outputIndex = (gid.z * params.height + gid.y) * params.width + gid.x;
  outputData[outputIndex] = f16(readChannel(pixel, gid.z));
}
`}function Mo(){return`enable f16;
struct Params { width: u32, height: u32, padding0: u32, padding1: u32 }
@group(0) @binding(0) var<storage, read> inputData: array<f16>;
@group(0) @binding(1) var<storage, read_write> outputData: array<vec4<f32>>;
@group(0) @binding(2) var<uniform> params: Params;

@compute @workgroup_size(${le}, ${le}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height) { return; }
  let pixel = gid.y * params.width + gid.x;
  let plane = params.width * params.height;
  outputData[pixel] = vec4<f32>(
    f32(inputData[pixel]),
    f32(inputData[plane + pixel]),
    f32(inputData[plane * 2u + pixel]),
    0.0
  );
}
`}function No(n,e){if(e==="fp32")throw new Error("OIDN WebNN GPU interop currently requires FP16 exportable tensors");if(!n.features.has("shader-f16"))throw new Error("OIDN WebNN requires shader-f16 on the shared GPUDevice");return"fp16"}function Uo(n,e,t){return t==="relu"?n.relu(e):e}class zo{_device;_model;precision;support;_context;_builderConstructor;_shapeCache=new Map;_shapePromises=new Map;_retiredExecutions=new Set;_pendingCreationCount=0;_shapeCacheSize;_clock=0;_inputPipeline;_outputPipeline;_resources=new fn;_disposed=!1;constructor(e,t,i={}){this._device=e,this._model=t,this.precision=No(e,i.precision??"auto"),this._shapeCacheSize=Math.max(1,i.shapeCacheSize??2),this.support={available:!1,fp16Conv:!1,gpuInterop:!1};const r=Co(e,t.inputChannels/3);this._inputPipeline=r.input,this._outputPipeline=r.output}async prepare(){if(this._disposed)throw new Error("OIDN WebNN executor is disposed");const e=globalThis.navigator?.ml,t=globalThis.MLGraphBuilder;if(!e?.createContext||typeof t!="function")throw this.support.reason="WebNN is not exposed by this browser",new Error(this.support.reason);this._builderConstructor=t;try{try{this._context=await e.createContext({deviceType:"gpu",powerPreference:"high-performance"})}catch{this._context=await e.createContext({deviceType:"gpu"})}if(this._resources.track("ml-context",this._context),this._disposed)throw new Error("OIDN WebNN executor is disposed");if(typeof this._context.createExportableTensor!="function"||typeof this._context.exportToGPU!="function")throw this.support.reason="WebNN WebGPU tensor interop is unavailable",new Error(this.support.reason);const i=this._context.opSupportLimits?.()??{};if(this.support.fp16Conv=ft(i,"conv2d","input","float16")&&ft(i,"conv2d","filter","float16")&&ft(i,"conv2d","output","float16"),!this.support.fp16Conv)throw this.support.reason="WebNN does not support FP16 conv2d",new Error(this.support.reason);let r,o;try{r=this._resources.track("ml-tensor",await this._context.createExportableTensor({dataType:"float16",shape:[4]},this._device)),o=this._resources.track("gpu-buffer",await this._context.exportToGPU(r)),this.support.gpuInterop=!0}catch(a){throw this.support.reason=`WebNN FP16 WebGPU interop failed: ${String(a)}`,new Error(this.support.reason)}finally{this._releaseBuffer(o),this._releaseTensor(r)}this.support.available=!0}catch(i){throw this._releaseContext(),i}}_constant(e,t){return e.constant({dataType:"float16",shape:[...t.desc.dims]},Ao(t,this.precision))}async _createExecution(e,t){if(this._disposed)throw new Error("OIDN WebNN executor is disposed");const i=new this._builderConstructor(this._context),r=new Map,o=new Map;r.set(this._model.spec.input,i.input("input",{dataType:"float16",shape:[1,this._model.inputChannels,t,e]})),o.set(this._model.spec.input,[this._model.inputChannels,t,e]);for(const d of this._model.spec.nodes){let h,f;if(d.op==="conv2d"){const g=o.get(d.input),_=this._model.convTensors.get(d.id),w=i.conv2d(r.get(d.input),this._constant(i,_.weight),{bias:this._constant(i,_.bias),padding:[1,1,1,1],inputLayout:"nchw",filterLayout:"oihw"});h=Uo(i,w,d.activation),f=[_.outputChannels,g[1],g[2]]}else if(d.op==="maxPool2d"){const g=o.get(d.input);h=i.maxPool2d(r.get(d.input),{windowDimensions:[2,2],strides:[2,2],padding:[0,g[1]%2,0,g[2]%2],layout:"nchw"}),f=[g[0],Math.ceil(g[1]/2),Math.ceil(g[2]/2)]}else if(d.op==="upsample2d"){const g=o.get(d.input);h=i.resample2d(r.get(d.input),{mode:"nearest-neighbor",axes:[2,3],scales:[2,2]}),f=[g[0],g[1]*2,g[2]*2]}else{const g=d.inputs.map(_=>o.get(_));if(g.some(_=>_[1]!==g[0][1]||_[2]!==g[0][2]))throw new Error(`WebNN concat ${d.id} has mismatched spatial shapes`);h=i.concat(d.inputs.map(_=>r.get(_)),1),f=[g.reduce((_,w)=>_+w[0],0),g[0][1],g[0][2]]}r.set(d.id,h),o.set(d.id,f)}let a,u,s,l,p,c;try{return a=this._resources.track("ml-graph",await i.build({output:r.get(this._model.spec.output)})),u=this._resources.track("ml-tensor",await this._context.createExportableTensor({dataType:"float16",shape:[1,this._model.inputChannels,t,e],writable:!0},this._device)),s=this._resources.track("ml-tensor",await this._context.createExportableTensor({dataType:"float16",shape:[1,this._model.outputChannels,t,e],readable:!0},this._device)),l=this._resources.track("gpu-buffer",this._device.createBuffer({label:`oidn/webnn/output/${e}x${t}`,size:e*t*4*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),p=this._resources.track("gpu-buffer",hi(this._device,`oidn/webnn/input/${e}x${t}`,[e,t,this._model.inputChannels])),c=this._resources.track("gpu-buffer",hi(this._device,`oidn/webnn/output/${e}x${t}`,[e,t])),{graph:a,inputTensor:u,outputTensor:s,outputBuffer:l,inputUniform:p,outputUniform:c,width:e,height:t,lastUsed:++this._clock}}catch(d){throw this._releaseBuffer(c),this._releaseBuffer(p),this._releaseBuffer(l),this._releaseTensor(s),this._releaseTensor(u),this._releaseGraph(a),d}}async _execution(e,t){const i=`${e}x${t}`;let r=this._shapeCache.get(i);if(!r){let o=this._shapePromises.get(i);o||(o=(async()=>{this._pendingCreationCount++;try{return await this._createExecution(e,t)}finally{this._pendingCreationCount--}})(),this._shapePromises.set(i,o));try{if(r=await o,this._disposed)throw this._destroyExecution(r),new Error("OIDN WebNN executor is disposed");this._shapeCache.set(i,r)}finally{this._shapePromises.get(i)===o&&this._shapePromises.delete(i)}if(this._shapeCache.size>this._shapeCacheSize){const a=[...this._shapeCache.entries()].filter(([u])=>u!==i).sort((u,s)=>u[1].lastUsed-s[1].lastUsed)[0];a&&(this._shapeCache.delete(a[0]),this._retireExecution(a[1]))}}return r.lastUsed=++this._clock,r}async prewarm(e){for(const t of e)await this._execution(t.width,t.height)}async execute(e,t,i){const r=this._model.inputChannels/3;if(e.length!==r)throw new Error(`OIDN WebNN expected ${r} input buffers, got ${e.length}`);const o=await this._execution(t,i),a=this._resources.track("gpu-buffer",await this._context.exportToGPU(o.inputTensor));try{const s=e.map((d,h)=>({binding:h,resource:{buffer:d}}));s.push({binding:r,resource:{buffer:a}}),s.push({binding:r+1,resource:{buffer:o.inputUniform}});const l=this._device.createBindGroup({label:"oidn/webnn/input-bindings",layout:this._inputPipeline.getBindGroupLayout(0),entries:s}),p=this._device.createCommandEncoder({label:"oidn/webnn/input-pack"}),c=p.beginComputePass();c.setPipeline(this._inputPipeline),c.setBindGroup(0,l),c.dispatchWorkgroups(Math.ceil(t/le),Math.ceil(i/le),this._model.inputChannels),c.end(),this._device.queue.submit([p.finish()])}finally{this._releaseBuffer(a)}this._context.dispatch(o.graph,{input:o.inputTensor},{output:o.outputTensor});const u=this._resources.track("gpu-buffer",await this._context.exportToGPU(o.outputTensor));try{const s=this._device.createBindGroup({label:"oidn/webnn/output-bindings",layout:this._outputPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:{buffer:o.outputBuffer}},{binding:2,resource:{buffer:o.outputUniform}}]}),l=this._device.createCommandEncoder({label:"oidn/webnn/output-unpack"}),p=l.beginComputePass();p.setPipeline(this._outputPipeline),p.setBindGroup(0,s),p.dispatchWorkgroups(Math.ceil(t/le),Math.ceil(i/le)),p.end(),this._device.queue.submit([l.finish()])}finally{this._releaseBuffer(u)}return o.outputBuffer}async executeCPU(e,t,i){const r=await this._execution(t,i),o=t*i,a=new S(o*this._model.inputChannels);for(let l=0;l<o;l++)for(let p=0;p<this._model.inputChannels;p++)a[p*o+l]=e[l*this._model.inputChannels+p];this._context.writeTensor(r.inputTensor,a),this._context.dispatch(r.graph,{input:r.inputTensor},{output:r.outputTensor});const u=new S(await this._context.readTensor(r.outputTensor)),s=new Float32Array(o*this._model.outputChannels);for(let l=0;l<o;l++)for(let p=0;p<this._model.outputChannels;p++)s[l*this._model.outputChannels+p]=u[p*o+l];return s}_destroyExecution(e){this._releaseGraph(e.graph),this._releaseTensor(e.inputTensor),this._releaseTensor(e.outputTensor),this._releaseBuffer(e.outputBuffer),this._releaseBuffer(e.inputUniform),this._releaseBuffer(e.outputUniform)}_retireExecution(e){this._retiredExecutions.add(e),this._device.queue.onSubmittedWorkDone().catch(()=>{}).then(()=>{this._retiredExecutions.delete(e),this._destroyExecution(e)})}_releaseBuffer(e){this._resources.release("gpu-buffer",e,()=>e.destroy())}_releaseTensor(e){this._resources.release("ml-tensor",e,()=>e.destroy())}_releaseGraph(e){this._resources.release("ml-graph",e,()=>e.destroy?.())}_releaseContext(){this._resources.release("ml-context",this._context,()=>this._context.destroy?.())}getResourceInfo(){return this._resources.snapshot(this._pendingCreationCount+this._retiredExecutions.size)}dispose(){if(!this._disposed){this._disposed=!0;for(const e of this._shapeCache.values())this._destroyExecution(e);this._shapeCache.clear();for(const e of this._retiredExecutions)this._destroyExecution(e);this._retiredExecutions.clear(),this._shapePromises.clear(),this._releaseContext()}}}const Lo=100;function he(n,e){return Math.ceil(n/e)*e}function Ge(n){return n.data instanceof GPUBuffer||n.data instanceof GPUTexture}class Do{_device;_aux;_hdr;_hdrTransfer;_dataProcessGPU;_nativeExecutor;_webNNExecutor;_modelSpec;_inputChannels;_engine;_dynamicTileController;_lastExecution;_activeExecutionFailures=new Set;_deviceLostObserved=!1;_deviceLostSettled=!1;_deviceLostReason;constructor(e,t,i={}){this._aux=i.aux||!1,this._hdr=i.hdr||!1,this._hdrTransfer=i.hdrTransfer??"pu",this._engine=i.engine??"auto";const r=i.modelSpec??Yi(e),o=pr(e,r);this._modelSpec=o.spec,this._inputChannels=o.inputChannels;const a=this._aux?9:3;if(o.inputChannels!==a)throw new Error(`OIDN model expects ${o.inputChannels} input channels, but aux=${this._aux} provides ${a}`);this._dynamicTileController=new sr(i.maxTileSize??512,i.dynamicTile),this._device=t,this._observeDeviceLoss(),this._engine==="webnn"?this._webNNExecutor=new zo(this._device,o,{precision:i.precision}):this._nativeExecutor=new So(this._device,o,{precision:i.precision,kernel:i.kernel,gemm:i.gemm})}getDevice(){return this._device}async prepare(){if(this._webNNExecutor){await this._webNNExecutor.prepare();const e=he(this._modelSpec.receptiveField/2,L),t=[this._dynamicTileController.tileSize,this._dynamicTileController.minTileSize];await this._webNNExecutor.prewarm([...new Set(t)].map(i=>({width:i+2*e,height:i+2*e})));return}await this._nativeExecutor.prepare()}async prepareForImage(e,t,i={}){const r=he(this._modelSpec.receptiveField/2,L),o=i.tileOverlap===void 0?r:he(Math.max(0,i.tileOverlap),L),a=Rt(e,t,i.wholeImage?he(Math.max(e,t),L):this._dynamicTileController.tileSize,o),u=[...new Map(a.tiles.map(({input:s})=>[`${s.width}x${s.height}`,{width:s.width,height:s.height}])).values()];await this._webNNExecutor?.prewarm(u),this._nativeExecutor?.prewarm(u)}getRuntimeInfo(){return{configuredEngine:this._engine,gpuEngine:this._webNNExecutor?"webnn":"wgsl",precision:(this._webNNExecutor??this._nativeExecutor).precision,kernel:this._nativeExecutor?{configured:this._nativeExecutor.kernelSetting,gemm:this._nativeExecutor.gemm,maxSpatialInputBlocks:this._nativeExecutor.maxSpatialInputBlocks,subgroupsAvailable:this._nativeExecutor.subgroupsAvailable}:void 0,webnn:this._webNNExecutor?.support,resources:(this._webNNExecutor??this._nativeExecutor).getResourceInfo(),model:this._modelSpec.id,modelFamily:this._modelSpec.family,inputChannels:this._inputChannels,hdrTransfer:this._hdrTransfer,dynamicTile:{enabled:this._dynamicTileController.enabled,currentTileSize:this._dynamicTileController.tileSize,minTileSize:this._dynamicTileController.minTileSize,maxTileSize:this._dynamicTileController.maxTileSize,targetTileTimeMs:this._dynamicTileController.targetTileTimeMs},lastExecution:this._lastExecution,activeExecutionCount:this._activeExecutionFailures.size}}_observeDeviceLoss(){if(this._activeExecutionFailures??=new Set,this._deviceLostObserved)return;this._deviceLostObserved=!0;const e=this._device.lost;if(!e)return;const t=i=>{if(this._deviceLostSettled)return;this._deviceLostSettled=!0,this._deviceLostReason=i;const r=[...this._activeExecutionFailures];this._activeExecutionFailures.clear();for(const o of r)o(i)};e.then(i=>t(new Error(`WebGPU device lost: ${i.message}`)),t)}_registerExecutionFailure(e){return this._observeDeviceLoss(),this._activeExecutionFailures.add(e),this._deviceLostSettled&&(this._activeExecutionFailures.delete(e),queueMicrotask(()=>e(this._deviceLostReason))),()=>this._activeExecutionFailures.delete(e)}profileNextExecution(){return this._nativeExecutor?.profileNextExecution()??!1}getLastExecutionProfile(){return this._nativeExecutor?.getLastExecutionProfile()}_processImageData(e,t,i,r){const o=e.data,a=o.length/4,u=this._aux?9:3,s=new Float32Array(a*u);if(t&&!i||i&&!t)throw new Error("Normal map and albedo map are both required");if(t&&i&&(t.width!==i.width||t.height!==i.height||e.width!==t.width||e.height!==t.height))throw new Error("Image size mismatch");const l=t?.data,p=i?.data;for(let c=0;c<o.length;c+=4){const d=c/4*u;for(let h=0;h<3;h++)r?s[d+h]=o[c+h]:s[d+h]=o[c+h]/255,l&&(s[d+h+3]=l[c+h]/255),p&&(s[d+h+6]=p[c+h]/255)}return s}_readTile(e,t,i,r){const o=new Float32Array(i.width*i.height*t),a=e.length/(r*t);for(let u=0;u<i.height;u++)for(let s=0;s<i.width;s++){const l=Math.min(r-1,s+i.x),c=(Math.min(a-1,u+i.y)*r+l)*t,d=(u*i.width+s)*t;for(let h=0;h<t;h++)o[d+h]=e[c+h]}return o}_writeTile(e,t,i,r,o,a){const{data:u,width:s}=e,l=i.x-t.x,p=i.y-t.y;for(let c=0;c<i.height;c++)for(let d=0;d<i.width;d++){const h=((c+p)*o+d+l)*3,f=((c+i.y)*s+(d+i.x))*4;for(let g=0;g<3;g++)a?u[f+g]=r[h+g]:u[f+g]=Math.min(Math.max(r[h+g]*255,0),255);e.data[f+3]=a?1:255}}async _executeTile(e,t,i,r,o,a,u,s,l){const p=this._aux?9:3,c=new ut(r.input.x,r.input.y,r.input.width,r.input.height),d=new ut(r.output.x,r.output.y,r.output.width,r.output.height),h=c.width,f=c.height;let g,_,w=1;const m=this._device;let y=this._dataProcessGPU;if(e instanceof Float32Array){let v=this._readTile(e,p,c,a);s&&(w=er({data:v,channels:p}),v=Vn({data:v,channels:p,inputScale:w,transfer:this._hdrTransfer})),_=await(this._webNNExecutor??this._nativeExecutor).executeCPU(v,h,f)}else{y||(y=this._dataProcessGPU=new tr(m,s,this._hdrTransfer)),y.setImageSize(a,u),y.setInputTile(c),o&&y.copyInputDataToOutput(e.color);const{color:v,albedo:k,normal:$}=y.forward(e.color,this._aux?e.albedo:void 0,this._aux?e.normal:void 0,l);g=await(this._webNNExecutor??this._nativeExecutor).execute(this._aux?[v,k,$]:[v],h,f)}let B;if(e instanceof Float32Array){s&&(_=Hn({data:_,channels:3,inputScale:w,transfer:this._hdrTransfer})),this._writeTile(i,c,d,_,c.width,s);for(let v=0;v<d.height;v++)for(let k=0;k<d.width;k++){const $=(v*d.width+k)*4,C=((v+d.y)*a+(k+d.x))*4;for(let U=0;U<4;U++)t.data[$+U]=i.data[C+U]}}else y.setOutputTile(d,c),B=y.inverse(g,e.color);return B}tileExecute({color:e,albedo:t,normal:i,done:r,progress:o,denoiseAlpha:a,tileOverlap:u,wholeImage:s,scheduling:l="event-loop",error:p}){if(this._aux&&(!t||!i))throw new Error("Normal map and albedo map are both required");if(!this._aux&&(t||i))throw new Error("Normal map and albedo map are not required");const c=e.width,d=e.height,h=this._dynamicTileController.tileSize,f=s?he(Math.max(c,d),L):h,g=he(this._modelSpec.receptiveField/2,L),_=u===void 0?g:he(Math.max(0,u),L),w=Rt(c,d,f,_),m=w.tiles.length>1,y=this._hdr||!1;let B;Ge(e)||(B=this._processImageData(e,t,i,y));function v(X,F){return y?{data:new Float32Array(X*F*4),width:X,height:F}:new ImageData(X,F)}const k=Ge(e)?void 0:v(c,d);let $="active",C,U,Y=()=>!1;const M=()=>typeof performance>"u"?Date.now():performance.now(),_e=M(),W=[],H=()=>{C!==void 0&&(clearTimeout(C),C=void 0),U!==void 0&&typeof cancelAnimationFrame<"u"&&(cancelAnimationFrame(U),U=void 0)},Ie=X=>{console.error("OIDN error callback failed",X)},rt=X=>{if($==="active")if($="settled",H(),Y(),p)try{Promise.resolve(p(X)).catch(Ie)}catch(F){Ie(F)}else console.error("OIDN execution failed",X)},In=X=>{if(l==="event-loop"||typeof requestAnimationFrame>"u")C=setTimeout(()=>{C=void 0,X()},0);else{const F=()=>{H(),X()};U=requestAnimationFrame(F),C=setTimeout(F,Lo)}},Ut=async X=>{if($!=="active")return;const F=w.tiles[X],zt=Ge(e)?void 0:v(F.output.width,F.output.height),Tn=M(),Bn=await this._executeTile(Ge(e)?{color:e.data,albedo:t?.data,normal:i?.data}:B,zt,k,F,X===0,c,d,y,a);if($!=="active")return;const Lt=k||{data:Bn,width:c,height:d};if(o&&await o(Lt,zt,new ut(F.output.x,F.output.y,F.output.width,F.output.height),X,w.tiles.length),$!=="active")return;const Pn=X+1<w.tiles.length;if(await this._device.queue.onSubmittedWorkDone(),$!=="active")return;await(async()=>{if(W.push(M()-Tn),$==="active")if(Pn)In(()=>{$==="active"&&Ut(X+1).catch(rt)});else{const J=[...W].sort((at,st)=>at-st),ot=Math.floor(J.length/2),Sn=J.length%2?J[ot]:(J[ot-1]+J[ot])/2;this._lastExecution={width:c,height:d,tileCount:w.tiles.length,tileColumns:w.columns,tileRows:w.rows,tileOverlap:w.overlap,inputPixelCount:w.inputPixelCount,inputShapeCount:w.inputShapeCount,durationMs:M()-_e,tileTimeMs:{min:J[0],median:Sn,mean:J.reduce((at,st)=>at+st,0)/J.length,max:J[J.length-1]}},m&&this._dynamicTileController.observe(W),Y(),await r(Lt),$==="active"&&($="settled")}})()};return Y=this._registerExecutionFailure(rt),Ut(0).catch(rt),()=>{$==="active"&&($="aborted",H(),Y())}}dispose(){this._dataProcessGPU?.dispose(),this._nativeExecutor?.dispose(),this._webNNExecutor?.dispose()}}async function Wo(){if(!navigator.gpu)throw new Error("WebGPU is not available");const n={powerPreference:"high-performance"},e=await navigator.gpu.requestAdapter(n);if(!e)throw new Error("No WebGPU adapter is available");const t={},i=[];e.features.has("timestamp-query")&&i.push("timestamp-query"),e.features.has("bgra8unorm-storage")&&i.push("bgra8unorm-storage"),e.features.has("shader-f16")&&i.push("shader-f16"),t.requiredFeatures=i;const r=e.limits;return t.requiredLimits={maxComputeWorkgroupStorageSize:r.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:r.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:r.maxStorageBufferBindingSize,maxBufferSize:r.maxBufferSize,maxComputeWorkgroupSizeX:r.maxComputeWorkgroupSizeX,maxComputeInvocationsPerWorkgroup:r.maxComputeInvocationsPerWorkgroup},e.requestDevice(t)}async function gt(n,e,t){const i=e?.device??await Wo(),r=Mn(n),o=new Do(r,i,t);return await o.prepare(),o}const Ro=new URL(""+new URL("rt_hdr_alb_nrm-BtuxMGcR.tza",import.meta.url).href,import.meta.url),Go=new URL(""+new URL("rt_hdr_alb_nrm_small-BpT3xeWa.tza",import.meta.url).href,import.meta.url),Yo={small:"rt_hdr_alb_nrm_small.tza",standard:"rt_hdr_alb_nrm.tza",cleanAuxLarge:"rt_hdr_calb_cnrm_large.tza"},fi={albedo:"rt_alb_large.tza",normal:"rt_nrm_large.tza"},bn="oidn-weights",Xo="2.3.0-1",$n=`https://cdn.jsdelivr.net/npm/${bn}@${Xo}/`,Fo=`https://cdn.jsdelivr.net/npm/@meimu/mutracer@${Cn}/oidn/weights/`;function gi(n,e){if(e===void 0){if(n==="standard")return String(Ro);if(n==="small")return String(Go)}const t=String(e??$n);return`${t}${t.endsWith("/")?"":"/"}${Yo[n]}`}function mi(n=$n){const e=String(n),t=`${e}${e.endsWith("/")?"":"/"}`;return{albedo:`${t}${fi.albedo}`,normal:`${t}${fi.normal}`}}async function Tt(n,e){const t=await fetch(String(n),{signal:e});if(!t.ok)throw new Error(`Failed to load OIDN weights from ${n}: ${t.status} ${t.statusText}`);const i=await t.arrayBuffer(),r=new Uint8Array(i);if(r[0]!==215||r[1]!==65)throw new Error(`Invalid OIDN TZA weights from ${n}: expected magic D7 41 (received non-TZA content).`);return i}async function kn(n,e,t={},i=Tt){await n.init();const r=n.device;if(n.backend!=="webgpu"||!r)throw new Error("OIDN requires a WebGPU engine.");const o=t.auxiliaryModelUrls,a=await Promise.all([n._getWeights(String(e),()=>i(e,t.signal)),...o?[n._getWeights(String(o.albedo),()=>i(o.albedo,t.signal)),n._getWeights(String(o.normal),()=>i(o.normal,t.signal))]:[]]),u={device:r},s={hdrTransfer:t.hdrTransfer??"pu",maxTileSize:t.maxTileSize,engine:t.engine,precision:t.precision,dynamicTile:t.dynamicTile};let l,p;try{if(l=await gt(a[0],u,{aux:t.aux??!0,hdr:t.hdr??!0,...s}),o){p=await gt(a[1],u,{aux:!1,hdr:!1,...s});const c=await gt(a[2],u,{aux:!1,hdr:!1,...s});l.auxiliaryDenoisers={albedo:p,normal:c}}}catch(c){throw p?.dispose(),l?.dispose(),c}return l}function Vo(n,e,t={}){return kn(n,e,t)}let _i=!1;function Ho(n,e={}){const{model:t="standard",weightsBaseUrl:i,auxiliaryModelUrls:r,...o}=e,a=gi(t,i),u=i===void 0&&t!=="cleanAuxLarge",s=new Set(i===void 0&&t==="cleanAuxLarge"?[a,...r?[]:Object.values(mi()).map(String)]:[]),l=async(p,c)=>{try{return await Tt(p,c)}catch(d){if(c?.aborted)throw d;if(u&&String(p)===a)return _i||(_i=!0,console.warn('Bundled OIDN weights failed to load; falling back to jsDelivr. In Vite development add optimizeDeps: { exclude: ["@meimu/mutracer"] }, or pass weightsBaseUrl to self-host the weights.',d)),Tt(gi(t,Fo),c);throw s.has(String(p))?new Error(`Failed to load ${bn} network from ${p}. Self-host node_modules/oidn-weights/*.tza and pass weightsBaseUrl. ${d instanceof Error?d.message:String(d)}`):d}};return kn(n,a,{...o,auxiliaryModelUrls:r??(t==="cleanAuxLarge"?mi(i):void 0)},l)}function qo(n,e){return e.weightsUrl!==void 0?Vo(n,e.weightsUrl,e):Ho(n,e)}export{qo as loadOIDNNetwork};
