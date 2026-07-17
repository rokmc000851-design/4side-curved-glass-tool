import * as THREE from 'three';

const clamp=(value,min,max)=>Math.min(Math.max(value,min),max);

export function makeGlassParams(input){
  const width=Number(input.width),height=Number(input.height),thickness=Number(input.thickness);
  const bendRadius=Math.max(Number(input.bendRadius),.001);
  const requestedDepth=Math.max(Number(input.bendDepth),0);
  const cornerRadius=clamp(Number(input.cornerRadius),0,Math.min(width,height)/2);
  const bendDepth=clamp(requestedDepth,0,bendRadius);
  const bendAngle=bendDepth>0?Math.acos(clamp(1-bendDepth/bendRadius,-1,1)):0;
  const bendLength=bendRadius*Math.sin(bendAngle);
  const detail=Number(input.detail??2);
  const segments=input.segments??[
    {x:28,y:56,boundary:20},{x:44,y:88,boundary:28},{x:68,y:136,boundary:40}
  ][clamp(detail,0,2)];
  return{...input,width,height,thickness,bendRadius,bendDepth,bendAngle,bendLength,cornerRadius,segments};
}

function roundedRectSdf(x,y,halfW,halfH,radius){
  const qx=Math.abs(x)-(halfW-radius),qy=Math.abs(y)-(halfH-radius);
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-radius;
}

function outwardNormal(x,y,p){
  const halfW=p.width/2,halfH=p.height/2,eps=.05;
  const dx=roundedRectSdf(x+eps,y,halfW,halfH,p.cornerRadius)-roundedRectSdf(x-eps,y,halfW,halfH,p.cornerRadius);
  const dy=roundedRectSdf(x,y+eps,halfW,halfH,p.cornerRadius)-roundedRectSdf(x,y-eps,halfW,halfH,p.cornerRadius);
  const length=Math.hypot(dx,dy);
  return length<1e-4?new THREE.Vector2():new THREE.Vector2(dx/length,dy/length);
}

function surfacePoint(x,y,zOffset,p){
  const inward=Math.max(-roundedRectSdf(x,y,p.width/2,p.height/2,p.cornerRadius),0);
  if(p.bendLength<=.001||inward>=p.bendLength)return[x,y,zOffset];
  const theta=Math.asin(clamp((p.bendLength-inward)/p.bendRadius,0,1));
  const projected=p.bendRadius*Math.sin(theta);
  const planarShift=inward-p.bendLength+projected;
  const drop=-p.bendRadius*(1-Math.cos(theta));
  const normal=outwardNormal(x,y,p);
  return[x+normal.x*(planarShift+Math.sin(theta)*zOffset),y+normal.y*(planarShift+Math.sin(theta)*zOffset),drop+Math.cos(theta)*zOffset];
}

function roundedRingPoints(p,inset,counts=p.segments){
  const width=Math.max(p.width-2*inset,.001),height=Math.max(p.height-2*inset,.001);
  const halfW=width/2,halfH=height/2,r=clamp(p.cornerRadius-inset,0,Math.min(halfW,halfH)),points=[];
  const point=(x,y)=>points.push(new THREE.Vector2(x,y));
  const line=(x1,y1,x2,y2,count,includeStart=false)=>{for(let i=includeStart?0:1;i<=count;i++){const t=i/count;point(x1+(x2-x1)*t,y1+(y2-y1)*t)}};
  const arc=(cx,cy,radius,a0,a1,count)=>{for(let i=1;i<=count;i++){const a=a0+(a1-a0)*i/count;point(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius)}};
  point(-halfW+r,halfH);
  line(-halfW+r,halfH,halfW-r,halfH,counts.x);
  arc(halfW-r,halfH-r,r,Math.PI/2,0,counts.boundary);
  line(halfW,halfH-r,halfW,-halfH+r,counts.y);
  arc(halfW-r,-halfH+r,r,0,-Math.PI/2,counts.boundary);
  line(halfW-r,-halfH,-halfW+r,-halfH,counts.x);
  arc(-halfW+r,-halfH+r,r,-Math.PI/2,-Math.PI,counts.boundary);
  line(-halfW,-halfH+r,-halfW,halfH-r,counts.y);
  arc(-halfW+r,halfH-r,r,Math.PI,Math.PI/2,counts.boundary);
  return points;
}

export function buildGlassGeometry(input){
  const p=input.segments?input:makeGlassParams(input),vertices=[],indices=[],topRings=[],bottomRings=[];
  const ringCount=Math.max(12,Math.round(Math.min(p.segments.x,p.segments.y)*.7));
  const maxInset=Math.min(p.width,p.height)/2;
  const counts={x:Math.max(6,p.segments.x),y:Math.max(6,p.segments.y),boundary:Math.max(8,p.segments.boundary)};
  for(let ring=0;ring<ringCount;ring++){
    const inset=maxInset*ring/ringCount,points=roundedRingPoints(p,inset,counts);
    topRings[ring]=[];bottomRings[ring]=[];
    for(const point of points){
      topRings[ring].push(vertices.length/3);vertices.push(...surfacePoint(point.x,point.y,p.thickness/2,p));
      bottomRings[ring].push(vertices.length/3);vertices.push(...surfacePoint(point.x,point.y,-p.thickness/2,p));
    }
  }
  for(let ring=0;ring<ringCount-1;ring++){
    const ot=topRings[ring],it=topRings[ring+1],ob=bottomRings[ring],ib=bottomRings[ring+1];
    for(let i=0;i<ot.length;i++){const n=(i+1)%ot.length;indices.push(ot[i],ot[n],it[i],ot[n],it[n],it[i],ob[i],ib[i],ob[n],ob[n],ib[i],ib[n])}
  }
  const topCenter=vertices.length/3;vertices.push(...surfacePoint(0,0,p.thickness/2,p));
  const bottomCenter=vertices.length/3;vertices.push(...surfacePoint(0,0,-p.thickness/2,p));
  const lt=topRings.at(-1),lb=bottomRings.at(-1);
  for(let i=0;i<lt.length;i++){const n=(i+1)%lt.length;indices.push(lt[i],lt[n],topCenter,lb[i],bottomCenter,lb[n])}
  const ot=topRings[0],ob=bottomRings[0];
  for(let i=0;i<ot.length;i++){const n=(i+1)%ot.length;indices.push(ot[i],ob[i],ot[n],ot[n],ob[i],ob[n])}
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  return geometry;
}
