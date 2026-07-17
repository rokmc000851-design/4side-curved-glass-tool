import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = id => document.getElementById(id);
const INPUT_IDS = ['X','Y','t','R','D','Rc','PO','DS','OCA_T','PANEL_T'];
const SHARED_KEY = 'four-side-curved-display:shared-inputs:v1';
const canvas = $('presetView');

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .92;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd7e0ea);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const camera = new THREE.OrthographicCamera(-100,100,100,-100,0.1,1000);
camera.position.set(0,0,250);
camera.up.set(0,1,0);
camera.lookAt(0,0,0);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.screenSpacePanning = true;
controls.zoomToCursor = true;
controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
controls.touches.ONE = THREE.TOUCH.ROTATE;
controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;

scene.add(new THREE.HemisphereLight(0xffffff,0x64748b,1.45));
const key = new THREE.DirectionalLight(0xffffff,3.2); key.position.set(-80,110,160); scene.add(key);
const rim = new THREE.DirectionalLight(0x9ec5ff,2.1); rim.position.set(120,-40,90); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff,1.1); fill.position.set(-100,-120,50); scene.add(fill);

const modelRoot = new THREE.Group();
scene.add(modelRoot);
let grid;
let params;
let stackValid = true;

function readInputs(){
  const p={}; for(const id of INPUT_IDS)p[id]=Number($(id).value);
  p.theta=Math.acos(1-p.D/p.R);
  p.Lb=Math.sqrt(Math.max(0,2*p.R*p.D-p.D*p.D));
  p.Sb=p.R*p.theta;
  p.Rf=p.Rc-p.Lb;
  p.DR=p.R>0?p.D/p.R:NaN;
  p.Shrinkage=p.Sb>0?(p.Sb-p.Lb)/p.Sb:0;
  p.panelAlpha=p.theta-p.PO/p.R;
  p.deadAlpha=p.panelAlpha-p.DS/p.R;
  p.panelMaxS=p.R*Math.sin(Math.max(0,p.panelAlpha));
  const panelBottomRadius=p.R-p.OCA_T-p.PANEL_T;
  p.PhysicalBorder=Math.abs((p.R+p.t)*Math.sin(p.theta)-panelBottomRadius*Math.sin(p.deadAlpha));
  return p;
}

function validate(p){
  const core=[];
  if(![p.X,p.Y,p.t,p.R,p.D,p.Rc].every(Number.isFinite))core.push('모든 Glass 입력은 유한한 숫자여야 합니다.');
  if(!(p.X>0&&p.Y>0))core.push('X와 Y는 0보다 커야 합니다.');
  if(!(p.t>=0))core.push('Glass Thickness는 0 이상이어야 합니다.');
  if(!(p.R>0&&p.D>=0&&p.D<=2*p.R))core.push('R > 0, 0 ≤ D ≤ 2R 조건이 필요합니다.');
  if(!(p.Rf>=0))core.push('Rc는 Lb 이상이어야 합니다.');
  const stack=[];
  if(!(p.OCA_T>=0&&p.PANEL_T>=0))stack.push('OCA/Panel Thickness는 0 이상이어야 합니다.');
  if(!(p.PO>=0&&p.PO<=p.Sb))stack.push('Panel Size Offset은 Glass Arc Length Sb 이하여야 합니다.');
  if(!(p.DS>=0&&p.DS<=Math.max(0,p.Sb-p.PO)))stack.push('Panel Dead Space가 사용 가능한 Bending Arc보다 큽니다.');
  return{core,stack};
}

function roundedContour(p,delta,z,arcSteps=20){
  const flatW=p.X-2*p.Lb,flatH=p.Y-2*p.Lb,r=Math.max(0,p.Rf+delta),hx=flatW/2+delta,hy=flatH/2+delta;
  const centers=[[hx-r,hy-r],[-hx+r,hy-r],[-hx+r,-hy+r],[hx-r,-hy+r]],starts=[0,Math.PI/2,Math.PI,Math.PI*1.5],out=[];
  for(let c=0;c<4;c++)for(let i=0;i<=arcSteps;i++){
    const a=starts[c]+Math.PI*.5*i/arcSteps;
    out.push(new THREE.Vector3(centers[c][0]+r*Math.cos(a),centers[c][1]+r*Math.sin(a),z));
  }
  return out;
}

function surfaceContour(p,s,h,arcSteps){
  const alpha=Math.asin(Math.min(1,Math.max(0,s/p.R)));
  const delta=s+h*Math.sin(alpha);
  const z=-p.R*(1-Math.cos(alpha))+h*Math.cos(alpha);
  return roundedContour(p,delta,z,arcSteps);
}

function appendSurface(positions,indices,p,h,maxS,reverse,rings=24,arcSteps=20){
  const ringStarts=[],contours=[];
  for(let j=0;j<=rings;j++){
    const s=maxS*j/rings,contour=surfaceContour(p,s,h,arcSteps),start=positions.length/3;
    ringStarts.push(start); contours.push(contour);
    for(const v of contour)positions.push(v.x,v.y,v.z);
  }
  const count=contours[0].length;
  const flat2=contours[0].map(v=>new THREE.Vector2(v.x,v.y));
  const faces=THREE.ShapeUtils.triangulateShape(flat2,[]);
  for(const f of faces){const a=ringStarts[0]+f[0],b=ringStarts[0]+f[1],c=ringStarts[0]+f[2];reverse?indices.push(c,b,a):indices.push(a,b,c)}
  for(let j=0;j<rings;j++)for(let i=0;i<count;i++){
    const n=(i+1)%count,a=ringStarts[j]+i,b=ringStarts[j]+n,c=ringStarts[j+1]+n,d=ringStarts[j+1]+i;
    reverse?indices.push(c,b,a,d,c,a):indices.push(a,b,c,a,c,d);
  }
  return contours.at(-1);
}

function buildClosedLayer(p,{top,bottom,maxS}){
  const positions=[],indices=[];
  const topOuter=appendSurface(positions,indices,p,top,maxS,false);
  const bottomOuter=appendSurface(positions,indices,p,bottom,maxS,true);
  const count=topOuter.length,sideTop=positions.length/3;
  for(const v of topOuter)positions.push(v.x,v.y,v.z);
  const sideBottom=positions.length/3;
  for(const v of bottomOuter)positions.push(v.x,v.y,v.z);
  for(let i=0;i<count;i++){
    const n=(i+1)%count,a=sideTop+i,b=sideTop+n,c=sideBottom+n,d=sideBottom+i;
    indices.push(a,b,c,a,c,d);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function materials(p){
  return{
    Glass:new THREE.MeshPhysicalMaterial({color:0x5f7f9d,roughness:.2,metalness:0,transmission:.015,thickness:Math.max(.01,p.t),ior:1.5,clearcoat:1,clearcoatRoughness:.055,reflectivity:1,specularIntensity:1,specularColor:0xffffff,side:THREE.DoubleSide,envMapIntensity:2.1}),
    OCA:new THREE.MeshPhysicalMaterial({color:0x8fd9ed,roughness:.22,metalness:0,transmission:.42,thickness:Math.max(.01,p.OCA_T),ior:1.47,transparent:true,opacity:.78,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:1.25}),
    Panel:new THREE.MeshStandardMaterial({color:0x1e293b,roughness:.34,metalness:.08,side:THREE.DoubleSide})
  };
}

function clearModel(){
  while(modelRoot.children.length){const child=modelRoot.children.pop();child.geometry?.dispose();child.material?.dispose()}
}

function rebuildModel(){
  if(!params)return;
  clearModel();
  const mats=materials(params),defs=[
    {name:'Panel',top:-params.OCA_T,bottom:-params.OCA_T-params.PANEL_T,maxS:params.panelMaxS},
    {name:'OCA',top:0,bottom:-params.OCA_T,maxS:params.panelMaxS},
    {name:'Glass',top:params.t,bottom:0,maxS:params.Lb}
  ];
  for(const def of defs){
    if(def.name!=='Glass'&&!stackValid)continue;
    if(!$('show'+def.name).checked)continue;
    const mesh=new THREE.Mesh(buildClosedLayer(params,def),mats[def.name]);
    mesh.name=def.name; mesh.renderOrder=def.name==='Glass'?3:def.name==='OCA'?2:1; modelRoot.add(mesh);
  }
}

function updateGrid(){
  if(grid){scene.remove(grid);grid.geometry.dispose();grid.material.dispose()}
  const size=Math.ceil(Math.max(params.X,params.Y)/20)*40;
  grid=new THREE.GridHelper(size,Math.max(12,Math.round(size/10)),0x9aa9ba,0xcbd5e1);
  grid.rotation.x=Math.PI/2; grid.position.z=-params.D-4; grid.material.transparent=true;grid.material.opacity=.52;scene.add(grid);
}

function fitCamera(reset=true){
  if(!params)return;
  const rect=canvas.getBoundingClientRect(),aspect=Math.max(.1,rect.width/Math.max(1,rect.height)),span=Math.max(params.Y*1.14,params.X*1.25/aspect);
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
  if(reset){camera.position.set(0,0,Math.max(params.X,params.Y)*2.2);camera.zoom=1;controls.target.set(0,0,0);camera.updateProjectionMatrix();controls.update();controls.saveState()}
}

function resize(){
  const rect=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
  if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
  fitCamera(false);
}

function updateOutputs(p){
  const value=(n,d=3,s='')=>Number.isFinite(n)?n.toFixed(d)+s:'-';
  $('theta').textContent=value(p.theta*180/Math.PI,3,'°');$('Lb').textContent=value(p.Lb,3,' mm');$('Sb').textContent=value(p.Sb,3,' mm');$('Rf').textContent=value(p.Rf,3,' mm');$('DR').textContent=value(p.DR,2);$('Shrinkage').textContent=value(p.Shrinkage*100,3,' %');$('PhysicalBorder').textContent=value(p.PhysicalBorder,3,' mm');$('VisibleBorder').textContent='N/A';
}

function showMessage(title,detail){
  clearModel();
  let box=$('webglMessage');
  if(!box){box=document.createElement('div');box.id='webglMessage';box.style.cssText='position:absolute;left:28px;top:28px;padding:14px 16px;border-radius:8px;background:#fff;color:#b91c1c;box-shadow:0 2px 10px #0002;font:13px Arial;z-index:3';canvas.parentElement.style.position='relative';canvas.parentElement.appendChild(box)}
  box.innerHTML=`<b>${title}</b><br><span style="color:#64748b">${detail}</span>`;
}
function clearMessage(){$('webglMessage')?.remove()}

function update(){
  const p=readInputs(),validation=validate(p),status=$('status');
  updateOutputs(p);
  if(validation.core.length){status.className='status bad';status.innerHTML='<b>Input 확인 필요</b><br>'+validation.core.join('<br>');params=null;showMessage('Glass geometry cannot be rendered','X, Y, t, R, D, Rc 값을 확인하세요.');return}
  params=p;stackValid=validation.stack.length===0;
  if(stackValid){status.className='status ok';status.innerHTML='<b>Geometry valid</b><br>Three.js Parametric Surface · Smooth vertex normals<br>Glass / OCA / Panel normal-offset layers';}
  else{status.className='status bad';status.innerHTML='<b>Input 확인 필요</b><br>'+validation.stack.join('<br>')+'<br><b>Glass만 계속 표시합니다.</b>';}
  clearMessage();rebuildModel();updateGrid();fitCamera(false);
}

function saveShared(){const values={};for(const id of INPUT_IDS)values[id]=$(id).value;localStorage.setItem(SHARED_KEY,JSON.stringify({values,updatedAt:Date.now()}))}
function loadShared(raw=localStorage.getItem(SHARED_KEY)){if(!raw)return;try{const values=(JSON.parse(raw).values||JSON.parse(raw));for(const id of INPUT_IDS)if(values[id]!==undefined)$(id).value=values[id]}catch(error){console.warn(error)}}

for(const id of INPUT_IDS)$(id).addEventListener('input',()=>{update();saveShared()});
for(const id of ['showGlass','showOCA','showPanel'])$(id).addEventListener('input',rebuildModel);
$('layerOpacity').addEventListener('input',()=>{const opacity=Number($('layerOpacity').value);for(const mesh of modelRoot.children){mesh.material.opacity=mesh.name==='Glass'?1:opacity;mesh.material.transparent=opacity<1||mesh.name==='OCA';mesh.material.needsUpdate=true}});
window.addEventListener('storage',event=>{if(event.key===SHARED_KEY){loadShared(event.newValue);update()}});
canvas.addEventListener('dblclick',()=>{fitCamera(true);controls.reset()});
new ResizeObserver(resize).observe(canvas);

loadShared();update();fitCamera(true);resize();
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
