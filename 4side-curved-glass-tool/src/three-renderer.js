import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildGlassGeometry, buildRoundedBoundaryGeometry, makeGlassParams } from './glass-geometry.js';

const $ = id => document.getElementById(id);
const INPUT_IDS = ['X','Y','t','R','D','Rc','PO','DS','OCA_T','PANEL_T'];
const SHARED_KEY = 'four-side-curved-display:shared-inputs:v1';
const canvas = $('presetView');

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101418);

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

scene.add(new THREE.AmbientLight(0x8ea8b8,1.4));
const key = new THREE.SpotLight(0xfff8ee,4.4,0,.1,.8,0);key.position.set(-90,120,150);key.target.position.set(-16,8,0);scene.add(key,key.target);
const fill = new THREE.DirectionalLight(0x9ed9ff,.42); fill.position.set(-80,90,70); scene.add(fill);

const modelRoot = new THREE.Group();
scene.add(modelRoot);
let grid;
const axes=new THREE.AxesHelper(28);axes.visible=false;scene.add(axes);
let params;
let stackValid = true;
let cameraTween = null;
const glassStyles={
  aqua:{color:0x70e5da,roughness:.16,clearcoat:.75,clearcoatRoughness:.18,transmission:.34,opacity:.62},
  clear:{color:0xd8fbff,roughness:.06,clearcoat:.95,clearcoatRoughness:.08,transmission:.58,opacity:.42},
  graphite:{color:0x8ba6ad,roughness:.22,clearcoat:.6,clearcoatRoughness:.22,transmission:.18,opacity:.72},
  warm:{color:0xd8c29a,roughness:.14,clearcoat:.8,clearcoatRoughness:.16,transmission:.28,opacity:.58}
};

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

function roundedContour(p,delta,z,arcSteps=48){
  const flatW=p.X-2*p.Lb,flatH=p.Y-2*p.Lb,r=Math.max(0,p.Rf+delta),hx=flatW/2+delta,hy=flatH/2+delta;
  const centers=[[hx-r,hy-r],[-hx+r,hy-r],[-hx+r,-hy+r],[hx-r,-hy+r]],starts=[0,Math.PI/2,Math.PI,Math.PI*1.5],out=[];
  for(let c=0;c<4;c++)for(let i=0;i<arcSteps;i++){
    const a=starts[c]+Math.PI*.5*i/arcSteps;
    const v=new THREE.Vector3(centers[c][0]+r*Math.cos(a),centers[c][1]+r*Math.sin(a),z);
    v.nx=Math.cos(a);v.ny=Math.sin(a);out.push(v);
  }
  return out;
}

function surfaceContour(p,s,h,arcSteps){
  const alpha=Math.asin(Math.min(1,Math.max(0,s/p.R)));
  const delta=s+h*Math.sin(alpha);
  const z=-p.R*(1-Math.cos(alpha))+h*Math.cos(alpha);
  const contour=roundedContour(p,delta,z,arcSteps);
  for(const v of contour)v.alpha=alpha;
  return contour;
}

function appendSurface(positions,normals,indices,p,h,maxS,reverse,rings=48,arcSteps=48){
  const ringStarts=[],contours=[];
  for(let j=0;j<=rings;j++){
    const s=maxS*j/rings,contour=surfaceContour(p,s,h,arcSteps),start=positions.length/3;
    ringStarts.push(start); contours.push(contour);
    for(const v of contour){
      positions.push(v.x,v.y,v.z);
      const sign=reverse?-1:1;
      normals.push(sign*v.nx*Math.sin(v.alpha),sign*v.ny*Math.sin(v.alpha),sign*Math.cos(v.alpha));
    }
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
  const positions=[],normals=[],indices=[];
  const topOuter=appendSurface(positions,normals,indices,p,top,maxS,false);
  const bottomOuter=appendSurface(positions,normals,indices,p,bottom,maxS,true);
  const count=topOuter.length,sideTop=positions.length/3;
  for(const v of topOuter){positions.push(v.x,v.y,v.z);normals.push(v.nx*Math.cos(v.alpha),v.ny*Math.cos(v.alpha),-Math.sin(v.alpha))}
  const sideBottom=positions.length/3;
  for(const v of bottomOuter){positions.push(v.x,v.y,v.z);normals.push(v.nx*Math.cos(v.alpha),v.ny*Math.cos(v.alpha),-Math.sin(v.alpha))}
  for(let i=0;i<count;i++){
    const n=(i+1)%count,a=sideTop+i,b=sideTop+n,c=sideBottom+n,d=sideBottom+i;
    indices.push(a,b,c,a,c,d);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function materials(p){
  const setting=name=>({color:$(name+'Color').value,opacity:Number($(name+'Opacity').value)});
  const style=glassStyles[$('glassStyle').value]||glassStyles.aqua;
  const glass={...style,opacity:Number($('glassOpacity').value)},oca=setting('oca'),panel=setting('panel');
  return{
    Glass:new THREE.MeshPhysicalMaterial({color:glass.color,roughness:glass.roughness,metalness:0,transmission:glass.transmission,thickness:Math.max(.01,p.t),ior:1.5,clearcoat:glass.clearcoat,clearcoatRoughness:glass.clearcoatRoughness,transparent:true,opacity:glass.opacity,side:THREE.DoubleSide,depthWrite:false}),
    OCA:new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.16,metalness:0,transmission:.82,thickness:Math.max(.01,p.OCA_T),attenuationColor:new THREE.Color(oca.color),attenuationDistance:10,ior:1.47,transparent:oca.opacity<1,opacity:oca.opacity,side:THREE.FrontSide,depthWrite:oca.opacity>.92,envMapIntensity:.5}),
    Panel:new THREE.MeshStandardMaterial({color:panel.color,roughness:.42,metalness:.05,transparent:panel.opacity<1,opacity:panel.opacity,side:THREE.FrontSide,depthWrite:true})
  };
}

function clearModel(){
  while(modelRoot.children.length){const child=modelRoot.children.pop();child.traverse(object=>{object.geometry?.dispose();if(Array.isArray(object.material))object.material.forEach(material=>material.dispose());else object.material?.dispose()})}
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
    let geometry;
    let glassParams;
    if(def.name==='Glass'){
      glassParams=makeGlassParams({width:params.X,height:params.Y,thickness:params.t,bendRadius:params.R,bendDepth:params.D,cornerRadius:params.Rc,detail:2});
      geometry=buildGlassGeometry(glassParams);
      geometry.translate(0,0,params.t/2);
    }else geometry=buildClosedLayer(params,def);
    const mesh=new THREE.Mesh(geometry,mats[def.name]);
    mesh.name=def.name; mesh.renderOrder=def.name==='Glass'?3:def.name==='OCA'?2:1; modelRoot.add(mesh);
    if(def.name==='Glass'){
      const outline=new THREE.Group();outline.name='GlassOutline';
      const outerMaterial=new THREE.LineBasicMaterial({color:0xf2ba4b,transparent:true,opacity:.9,depthTest:false});
      const flatMaterial=new THREE.LineBasicMaterial({color:0x7ee7ff,transparent:true,opacity:.95,depthTest:false});
      const outer=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,28),outerMaterial);
      const flatGeometry=buildRoundedBoundaryGeometry(glassParams,glassParams.bendLength,glassParams.thickness/2);flatGeometry.translate(0,0,params.t/2);
      const flat=new THREE.LineLoop(flatGeometry,flatMaterial);
      outline.add(outer,flat);outline.visible=$('showOutline').checked;outline.renderOrder=10;modelRoot.add(outline);
    }
  }
}

function updateGrid(){
  if(grid){scene.remove(grid);grid.geometry.dispose();grid.material.dispose()}
  const size=Math.ceil(Math.max(params.X,params.Y)/20)*40;
  const mode=$('backgroundMode').value,palette=mode==='black'?[0x526674,0x34444f]:mode==='gray'?[0x8d99a3,0x737f89]:[0xaeb8c1,0xd4dae0];
  grid=new THREE.GridHelper(size,Math.max(12,Math.round(size/10)),palette[0],palette[1]);
  grid.rotation.x=Math.PI/2; grid.position.z=-Math.max(18,params.D+4); grid.material.transparent=true;grid.material.opacity=mode==='black'?.38:.3;grid.visible=$('showGrid').checked;scene.add(grid);
}

function fitCamera(reset=true){
  if(!params)return;
  const rect=canvas.getBoundingClientRect(),aspect=Math.max(.1,rect.width/Math.max(1,rect.height)),span=Math.max(params.Y*1.14,params.X*1.25/aspect);
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
  if(reset){camera.position.set(0,0,Math.max(params.X,params.Y)*2.2);camera.zoom=1;controls.target.set(0,0,0);camera.updateProjectionMatrix();controls.update();controls.saveState()}
}

function setPreset(name){
  if(!params)return;
  const d=Math.max(params.X,params.Y)*2.2;
  const corner=new THREE.Vector3(params.X/2-params.Rc*.28,-params.Y/2+params.Rc*.28,-params.D*.58);
  const cornerDistance=Math.max(params.Rc*2.6,params.Lb*3,24);
  const views={
    top:{target:new THREE.Vector3(0,0,0),offset:new THREE.Vector3(0,0,d),zoom:1,up:new THREE.Vector3(0,1,0)},
    isoOverview:{target:new THREE.Vector3(0,0,-params.D*.35),offset:new THREE.Vector3(Math.max(params.X,params.Y)*.8,-Math.max(params.X,params.Y)*1.35,Math.max(params.X,params.Y)*.62),zoom:1,up:new THREE.Vector3(0,0,1)},
    bottom:{target:new THREE.Vector3(0,0,-params.D/2),offset:new THREE.Vector3(0,0,-d),zoom:1,up:new THREE.Vector3(0,-1,0)},
    topCorner:{target:corner,offset:new THREE.Vector3(0,0,cornerDistance*1.35),zoom:4.2},
    frontCorner:{target:corner,offset:new THREE.Vector3(0,-d,0),zoom:4,up:new THREE.Vector3(0,0,1)},
    sideCorner:{target:corner,offset:new THREE.Vector3(d,0,0),zoom:4,up:new THREE.Vector3(0,0,1)},
    isoCorner:{target:corner,offset:new THREE.Vector3(cornerDistance*.9,-cornerDistance*1.05,cornerDistance*.65),zoom:3.4}
  };
  const view=views[name]||views.top;
  const endPosition=view.target.clone().add(view.offset);
  cameraTween={start:performance.now(),duration:1200,fromPosition:camera.position.clone(),toPosition:endPosition,fromTarget:controls.target.clone(),toTarget:view.target.clone(),fromZoom:camera.zoom,toZoom:view.zoom,fromUp:camera.up.clone(),toUp:(view.up||new THREE.Vector3(0,1,0)).clone(),arc:name==='bottom'?view.target.clone().add(new THREE.Vector3(d,0,0)):null};
}

function updateCameraTween(now){
  if(!cameraTween)return;
  const raw=Math.min(1,(now-cameraTween.start)/cameraTween.duration),t=raw<.5?4*raw*raw*raw:1-Math.pow(-2*raw+2,3)/2;
  if(cameraTween.arc){const a=cameraTween.fromPosition.clone().lerp(cameraTween.arc,t),b=cameraTween.arc.clone().lerp(cameraTween.toPosition,t);camera.position.lerpVectors(a,b,t)}else camera.position.lerpVectors(cameraTween.fromPosition,cameraTween.toPosition,t);
  controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,t);camera.up.lerpVectors(cameraTween.fromUp,cameraTween.toUp,t).normalize();camera.zoom=THREE.MathUtils.lerp(cameraTween.fromZoom,cameraTween.toZoom,t);camera.lookAt(controls.target);camera.updateProjectionMatrix();
  if(raw>=1)cameraTween=null;
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
  if(stackValid){status.className='status ok';status.innerHTML='<b>Geometry valid</b><br>Unified rounded-ring Glass topology<br>Glass / OCA / Panel normal-offset layers';}
  else{status.className='status bad';status.innerHTML='<b>Input 확인 필요</b><br>'+validation.stack.join('<br>')+'<br><b>Glass만 계속 표시합니다.</b>';}
  clearMessage();rebuildModel();updateGrid();fitCamera(false);
}

function saveShared(){const values={};for(const id of INPUT_IDS)values[id]=$(id).value;localStorage.setItem(SHARED_KEY,JSON.stringify({values,updatedAt:Date.now()}))}
function loadShared(raw=localStorage.getItem(SHARED_KEY)){if(!raw)return;try{const values=(JSON.parse(raw).values||JSON.parse(raw));for(const id of INPUT_IDS)if(values[id]!==undefined)$(id).value=values[id]}catch(error){console.warn(error)}}

for(const id of INPUT_IDS)$(id).addEventListener('input',()=>{update();saveShared()});
for(const id of ['showGlass','showOCA','showPanel','glassOpacity','ocaColor','ocaOpacity','panelColor','panelOpacity'])$(id).addEventListener('input',rebuildModel);
$('glassStyle').addEventListener('change',()=>{$('glassOpacity').value=(glassStyles[$('glassStyle').value]||glassStyles.aqua).opacity;rebuildModel()});
$('showGrid').addEventListener('input',()=>{if(grid)grid.visible=$('showGrid').checked});
$('showAxes').addEventListener('input',()=>{axes.visible=$('showAxes').checked});
$('showOutline').addEventListener('input',()=>{const outline=modelRoot.getObjectByName('GlassOutline');if(outline)outline.visible=$('showOutline').checked});
$('backgroundMode').addEventListener('change',()=>{const mode=$('backgroundMode').value;scene.background.set(mode==='white'?0xf4f6f8:mode==='gray'?0x626b74:0x101418);if(params)updateGrid()});
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>setPreset(button.dataset.view));
window.addEventListener('storage',event=>{if(event.key===SHARED_KEY){loadShared(event.newValue);update()}});
canvas.addEventListener('pointerdown',()=>{cameraTween=null});
canvas.addEventListener('dblclick',()=>{fitCamera(true);controls.reset()});
new ResizeObserver(resize).observe(canvas);

loadShared();update();fitCamera(true);resize();
const initialView=new URLSearchParams(location.search).get('view');
if(initialView)setPreset(initialView);
renderer.setAnimationLoop(time=>{updateCameraTween(time);controls.update();renderer.render(scene,camera)});
