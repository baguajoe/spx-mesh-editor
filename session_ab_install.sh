#!/bin/bash
set -e
cd /workspaces/spx-mesh-editor

echo "=== Session A+B: Writing all mesh files ==="

# ── SceneCreator.js ───────────────────────────────────────────────────────────
cat > src/mesh/SceneCreator.js << 'EOF'
import * as THREE from "three";
export const SCENE_PRESETS={empty:{name:"Empty",lighting:"none",bg:"#06060f"},studio:{name:"Studio",lighting:"studio",bg:"#111111"},outdoor:{name:"Outdoor",lighting:"outdoor",bg:"#87ceeb"},night:{name:"Night",lighting:"night",bg:"#000010"},product:{name:"Product Shot",lighting:"product",bg:"#ffffff"},character:{name:"Character",lighting:"three",bg:"#1a1a2e"}};
export const ENVIRONMENT_PRESETS={none:{type:"color",value:"#06060f"},studio:{type:"gradient",top:"#222",bottom:"#111"},sky:{type:"gradient",top:"#1a6fa8",bottom:"#c8e8f0"},sunset:{type:"gradient",top:"#ff6b35",bottom:"#f7c59f"},night:{type:"gradient",top:"#000010",bottom:"#0d0d2b"},warehouse:{type:"color",value:"#2a2a2a"}};
export function createSceneObject(type,options={}){return{id:crypto.randomUUID(),name:options.name||`${type}_${Date.now()}`,type,position:options.position||[0,0,0],rotation:options.rotation||[0,0,0],scale:options.scale||[1,1,1],visible:true,locked:false,children:[],parent:null,...options};}
export function createScene(name="Untitled Scene"){return{id:crypto.randomUUID(),name,objects:[],collections:[{id:"scene_col",name:"Scene Collection",objects:[],visible:true}],activeObject:null,selectedObjects:[],frame:1,frameStart:1,frameEnd:250,fps:24,environment:{...ENVIRONMENT_PRESETS.none},lighting:"none",metadata:{created:Date.now(),modified:Date.now()}};}
export function addObjectToScene(scene,obj){scene.objects.push(obj);scene.collections[0].objects.push(obj.id);scene.activeObject=obj.id;return scene;}
export function removeObjectFromScene(scene,id){scene.objects=scene.objects.filter(o=>o.id!==id);scene.collections.forEach(c=>{c.objects=c.objects.filter(x=>x!==id);});if(scene.activeObject===id)scene.activeObject=scene.objects.at(-1)?.id||null;return scene;}
export function duplicateObject(scene,id){const src=scene.objects.find(o=>o.id===id);if(!src)return scene;const copy={...JSON.parse(JSON.stringify(src)),id:crypto.randomUUID(),name:src.name+"_copy"};copy.position=[src.position[0]+0.5,src.position[1],src.position[2]+0.5];return addObjectToScene(scene,copy);}
export function parentObjects(scene,childId,parentId){const child=scene.objects.find(o=>o.id===childId),par=scene.objects.find(o=>o.id===parentId);if(!child||!par)return scene;child.parent=parentId;if(!par.children.includes(childId))par.children.push(childId);return scene;}
export function getObjectHierarchy(scene){const build=obj=>({...obj,children:obj.children.map(cid=>build(scene.objects.find(o=>o.id===cid))).filter(Boolean)});return scene.objects.filter(o=>!o.parent).map(build);}
export function createCollection(scene,name){const col={id:crypto.randomUUID(),name,objects:[],visible:true};scene.collections.push(col);return col;}
export function applyLightingSetup(scene,type){const setups={none:[],studio:[{type:"point",pos:[3,4,3],color:"#fff",i:1.5},{type:"point",pos:[-3,2,-3],color:"#aaccff",i:0.8},{type:"ambient",pos:[0,0,0],color:"#fff",i:0.3}],outdoor:[{type:"directional",pos:[5,10,5],color:"#fff5e0",i:2},{type:"ambient",pos:[0,0,0],color:"#87ceeb",i:0.5}],night:[{type:"point",pos:[0,5,0],color:"#4455ff",i:0.5},{type:"ambient",pos:[0,0,0],color:"#000033",i:0.1}],product:[{type:"directional",pos:[3,5,3],color:"#fff",i:1.8},{type:"directional",pos:[-3,3,-2],color:"#fff",i:0.9},{type:"ambient",pos:[0,0,0],color:"#fff",i:0.4}],three:[{type:"directional",pos:[5,5,5],color:"#fff",i:1.5},{type:"directional",pos:[-5,3,0],color:"#aaccff",i:0.6},{type:"directional",pos:[0,0,-5],color:"#ffeedd",i:0.3}]};scene.lighting=type;scene.lightingObjects=(setups[type]||[]).map((l,i)=>createSceneObject("light",{name:`Light_${i}`,position:l.pos,lightType:l.type,color:l.color,intensity:l.i}));return scene;}
export function applyEnvironment(scene,key){scene.environment={...ENVIRONMENT_PRESETS[key]||ENVIRONMENT_PRESETS.none,preset:key};return scene;}
export function buildEnvironmentMesh(preset){if(!preset)return null;const geo=new THREE.SphereGeometry(500,32,16);geo.scale(-1,1,1);let mat;if(preset.type==="color"){mat=new THREE.MeshBasicMaterial({color:new THREE.Color(preset.value),side:THREE.BackSide});}else{const cv=document.createElement("canvas");cv.width=4;cv.height=256;const ctx=cv.getContext("2d");const g=ctx.createLinearGradient(0,0,0,256);g.addColorStop(0,preset.top||"#000");g.addColorStop(1,preset.bottom||"#111");ctx.fillStyle=g;ctx.fillRect(0,0,4,256);mat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),side:THREE.BackSide});}return new THREE.Mesh(geo,mat);}
export function serializeScene(scene){return JSON.stringify({...scene,metadata:{...scene.metadata,modified:Date.now()}},null,2);}
export function deserializeScene(json){try{return JSON.parse(json);}catch{return createScene();}}
export function getSceneStats(scene){return{objects:scene.objects.length,meshes:scene.objects.filter(o=>o.type==="mesh").length,lights:scene.objects.filter(o=>o.type==="light").length,cameras:scene.objects.filter(o=>o.type==="camera").length,collections:scene.collections.length};}
EOF
echo "SceneCreator.js: $(wc -l < src/mesh/SceneCreator.js) lines"

# ── SculptLayers.js ───────────────────────────────────────────────────────────
cat > src/mesh/SculptLayers.js << 'EOF'
import * as THREE from "three";
export const ADVANCED_BRUSHES={clay:{name:"Clay",radius:0.3,strength:0.5},clayStrip:{name:"Clay Strip",radius:0.2,strength:0.6},polish:{name:"Polish",radius:0.4,strength:0.3},scrape:{name:"Scrape",radius:0.3,strength:0.4},flatten:{name:"Flatten",radius:0.5,strength:0.5},mask:{name:"Mask",radius:0.3,strength:1.0},fill:{name:"Fill",radius:0.5,strength:0.3},pose:{name:"Pose",radius:0.5,strength:0.8}};
export function createSculptLayer(name="Layer",strength=1.0){return{id:crypto.randomUUID(),name,strength,visible:true,locked:false,deltas:new Map()};}
export function addSculptLayer(stack,name,strength=1.0){const l=createSculptLayer(name,strength);stack.push(l);return l;}
export function applyLayerDelta(layer,vi,delta){const e=layer.deltas.get(vi)||{x:0,y:0,z:0};layer.deltas.set(vi,{x:e.x+delta.x,y:e.y+delta.y,z:e.z+delta.z});}
export function captureBasePositions(mesh){if(!mesh?.geometry?.attributes?.position)return;mesh._basePosArray=new Float32Array(mesh.geometry.attributes.position.array);}
export function evaluateSculptLayers(mesh,layers){if(!mesh?.geometry?.attributes?.position)return;const pos=mesh.geometry.attributes.position;if(mesh._basePosArray)for(let i=0;i<pos.array.length;i++)pos.array[i]=mesh._basePosArray[i];for(const layer of layers){if(!layer.visible)continue;const s=layer.strength;layer.deltas.forEach((d,vi)=>{const i3=vi*3;pos.array[i3]+=d.x*s;pos.array[i3+1]+=d.y*s;pos.array[i3+2]+=d.z*s;});}pos.needsUpdate=true;mesh.geometry.computeVertexNormals();}
export function flattenLayerToMesh(mesh,layer){captureBasePositions(mesh);evaluateSculptLayers(mesh,[layer]);captureBasePositions(mesh);layer.deltas.clear();}
export function mergeLayers(layers){if(layers.length<2)return layers;const base=layers[0];for(let i=1;i<layers.length;i++){const l=layers[i];if(!l.visible)continue;l.deltas.forEach((d,vi)=>applyLayerDelta(base,vi,{x:d.x*l.strength,y:d.y*l.strength,z:d.z*l.strength}));}return[base];}
export function getSculptLayerStats(layers){return{count:layers.length,totalDeltas:layers.reduce((s,l)=>s+l.deltas.size,0),visible:layers.filter(l=>l.visible).length};}
function fo(d,r){return Math.pow(1-d/r,2);}
export function applyClayBrush(mesh,hit,opts={}){const{radius=0.3,strength=0.5,invert=false}=opts;const pos=mesh.geometry.attributes.position;const n=hit.face.normal.clone().transformDirection(mesh.matrixWorld).normalize();const sign=invert?-1:1;for(let i=0;i<pos.count;i++){const v=new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));const d=v.distanceTo(hit.point);if(d>radius)continue;const f=fo(d,radius)*strength*sign;pos.setXYZ(i,pos.getX(i)+n.x*f,pos.getY(i)+n.y*f,pos.getZ(i)+n.z*f);}pos.needsUpdate=true;mesh.geometry.computeVertexNormals();}
export function applyScrapeBrush(mesh,hit,opts={}){const{radius=0.3,strength=0.4}=opts;const pos=mesh.geometry.attributes.position;const n=hit.face.normal.clone().transformDirection(mesh.matrixWorld).normalize();for(let i=0;i<pos.count;i++){const v=new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));const d=v.distanceTo(hit.point);if(d>radius)continue;const dp=v.clone().sub(hit.point).dot(n);if(dp>0){const f=fo(d,radius)*strength;pos.setXYZ(i,pos.getX(i)-n.x*dp*f,pos.getY(i)-n.y*dp*f,pos.getZ(i)-n.z*dp*f);}}pos.needsUpdate=true;mesh.geometry.computeVertexNormals();}
export function applyFlattenBrush(mesh,hit,opts={}){const{radius=0.5,strength=0.5}=opts;const pos=mesh.geometry.attributes.position;const n=hit.face.normal.clone().transformDirection(mesh.matrixWorld).normalize();for(let i=0;i<pos.count;i++){const v=new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));const d=v.distanceTo(hit.point);if(d>radius)continue;const dp=v.clone().sub(hit.point).dot(n);const f=fo(d,radius)*strength;pos.setXYZ(i,pos.getX(i)-n.x*dp*f,pos.getY(i)-n.y*dp*f,pos.getZ(i)-n.z*dp*f);}pos.needsUpdate=true;mesh.geometry.computeVertexNormals();}
export function applyMaskBrush(mesh,hit,opts={}){const{radius=0.3,value=1.0,invert=false}=opts;if(!mesh._maskArray)mesh._maskArray=new Float32Array(mesh.geometry.attributes.position.count);const pos=mesh.geometry.attributes.position;const v2=invert?0:value;for(let i=0;i<pos.count;i++){const v=new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));const d=v.distanceTo(hit.point);if(d>radius)continue;const f=fo(d,radius);mesh._maskArray[i]=Math.min(1,Math.max(0,mesh._maskArray[i]+(v2-mesh._maskArray[i])*f));}}
export function clearMask(mesh){if(mesh._maskArray)mesh._maskArray.fill(0);}
export function invertMask(mesh){if(mesh._maskArray)for(let i=0;i<mesh._maskArray.length;i++)mesh._maskArray[i]=1-mesh._maskArray[i];}
export function applySymmetryStroke(mesh,hit,brushFn,opts={}){const{axisX=true,axisY=false,axisZ=false}=opts;brushFn(mesh,hit,opts);const mirror=(axis)=>({...hit,point:hit.point.clone().multiply(new THREE.Vector3(axis==="x"?-1:1,axis==="y"?-1:1,axis==="z"?-1:1))});if(axisX)brushFn(mesh,mirror("x"),opts);if(axisY)brushFn(mesh,mirror("y"),opts);if(axisZ)brushFn(mesh,mirror("z"),opts);}
EOF
echo "SculptLayers.js: $(wc -l < src/mesh/SculptLayers.js) lines"

# ── NgonSupport.js ────────────────────────────────────────────────────────────
cat > src/mesh/NgonSupport.js << 'EOF'
import * as THREE from "three";
export function triangulateNgon(verts){const tris=[];for(let i=1;i<verts.length-1;i++)tris.push([verts[0],verts[i],verts[i+1]]);return tris;}
export function buildNgonGeometry(ngons){const pos=[],nrm=[],uvs=[],idx=[];let off=0;for(const ng of ngons){for(const[a,b,c]of triangulateNgon(ng)){const n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();for(const v of[a,b,c]){pos.push(v.x,v.y,v.z);nrm.push(n.x,n.y,n.z);uvs.push(0.5,0.5);}idx.push(off,off+1,off+2);off+=3;}}const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));geo.setAttribute("normal",new THREE.Float32BufferAttribute(nrm,3));geo.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(idx);return geo;}
export function addNgonFace(hem,vertIndices){if(!hem.ngonFaces)hem.ngonFaces=[];hem.ngonFaces.push({verts:[...vertIndices],id:crypto.randomUUID()});}
export function getNgonFaces(hem){return hem.ngonFaces||[];}
export function dissolveEdge(hem,edgeId){if(!hem._dissolvedEdges)hem._dissolvedEdges=new Set();hem._dissolvedEdges.add(edgeId);return hem;}
export function bridgeFaces(hem,faceIdA,faceIdB){if(!hem.ngonFaces)hem.ngonFaces=[];const a=hem.ngonFaces.find(f=>f.id===faceIdA),b=hem.ngonFaces.find(f=>f.id===faceIdB);if(!a||!b)return hem;hem.ngonFaces.push({verts:[...a.verts,...b.verts],id:crypto.randomUUID(),bridged:true});return hem;}
export function gridFill(hem,edgeLoop){if(!hem.ngonFaces)hem.ngonFaces=[];const n=edgeLoop.length,half=Math.floor(n/2);for(let i=0;i<half-1;i++)hem.ngonFaces.push({verts:[edgeLoop[i],edgeLoop[i+1],edgeLoop[n-i-2],edgeLoop[n-i-1]],id:crypto.randomUUID(),type:"quad"});return hem;}
export function getNgonStats(hem){const ng=hem.ngonFaces||[];return{total:ng.length,quads:ng.filter(f=>f.verts.length===4).length,tris:ng.filter(f=>f.verts.length===3).length,ngons:ng.filter(f=>f.verts.length>4).length};}
export function convertNgonsToTris(hem){const tris=[];for(const f of(hem.ngonFaces||[]))for(const t of triangulateNgon(f.verts))tris.push({verts:t,id:crypto.randomUUID(),type:"tri"});hem.triFaces=[...(hem.triFaces||[]),...tris];return hem;}
EOF
echo "NgonSupport.js: $(wc -l < src/mesh/NgonSupport.js) lines"

# ── VertexColorAdvanced.js ────────────────────────────────────────────────────
cat > src/mesh/VertexColorAdvanced.js << 'EOF'
import * as THREE from "three";
export const VC_BLEND_MODES=["normal","multiply","screen","overlay","add","subtract","darken","lighten"];
function lerp(a,b,t){return a+(b-a)*t;}
function fo(d,r){return Math.pow(1-d/r,2);}
export function initVCAdvanced(mesh){const n=mesh.geometry.attributes.position.count;if(!mesh.geometry.attributes.color)mesh.geometry.setAttribute("color",new THREE.BufferAttribute(new Float32Array(n*4).fill(1),4));if(!mesh._vcLayers)mesh._vcLayers=[{id:crypto.randomUUID(),name:"Base",opacity:1.0,visible:true,blendMode:"normal",data:new Float32Array(n*4).fill(1)}];return mesh;}
export function addVCLayer(mesh,name="Layer"){if(!mesh._vcLayers)initVCAdvanced(mesh);const n=mesh.geometry.attributes.position.count;const layer={id:crypto.randomUUID(),name,opacity:1.0,visible:true,blendMode:"normal",data:new Float32Array(n*4).fill(0)};mesh._vcLayers.push(layer);return layer;}
export function removeVCLayer(mesh,id){if(mesh._vcLayers)mesh._vcLayers=mesh._vcLayers.filter(l=>l.id!==id);}
export function paintVCAdvanced(mesh,hit,opts={}){const{radius=0.15,strength=1.0,color=[1,0,0,1],blendMode="normal",layerIndex=0}=opts;const layer=mesh._vcLayers?.[layerIndex];if(!layer)return;const pos=mesh.geometry.attributes.position;for(let i=0;i<pos.count;i++){const v=new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));const d=v.distanceTo(hit.point);if(d>radius)continue;const t=fo(d,radius)*strength;const b=i*4;const[r,g,bv,a]=color;switch(blendMode){case"multiply":layer.data[b]=lerp(layer.data[b],layer.data[b]*r,t);layer.data[b+1]=lerp(layer.data[b+1],layer.data[b+1]*g,t);layer.data[b+2]=lerp(layer.data[b+2],layer.data[b+2]*bv,t);break;case"screen":layer.data[b]=lerp(layer.data[b],1-(1-layer.data[b])*(1-r),t);layer.data[b+1]=lerp(layer.data[b+1],1-(1-layer.data[b+1])*(1-g),t);layer.data[b+2]=lerp(layer.data[b+2],1-(1-layer.data[b+2])*(1-bv),t);break;case"add":layer.data[b]=Math.min(1,layer.data[b]+r*t);layer.data[b+1]=Math.min(1,layer.data[b+1]+g*t);layer.data[b+2]=Math.min(1,layer.data[b+2]+bv*t);break;default:layer.data[b]=lerp(layer.data[b],r,t);layer.data[b+1]=lerp(layer.data[b+1],g,t);layer.data[b+2]=lerp(layer.data[b+2],bv,t);layer.data[b+3]=lerp(layer.data[b+3],a,t);}}flattenVCLayers(mesh);}
export function fillVCLayer(mesh,layerIndex=0,color=[1,1,1,1]){const layer=mesh._vcLayers?.[layerIndex];if(!layer)return;for(let i=0;i<layer.data.length/4;i++){const b=i*4;[layer.data[b],layer.data[b+1],layer.data[b+2],layer.data[b+3]]=color;}flattenVCLayers(mesh);}
export function flattenVCLayers(mesh){if(!mesh._vcLayers||!mesh.geometry.attributes.color)return;const col=mesh.geometry.attributes.color;for(let i=0;i<col.count;i++){let r=0,g=0,b=0,a=1;for(const layer of mesh._vcLayers){if(layer.visible===false)continue;const base=i*4;const op=layer.opacity??1;r=lerp(r,layer.data[base],op);g=lerp(g,layer.data[base+1],op);b=lerp(b,layer.data[base+2],op);a=lerp(a,layer.data[base+3],op);}col.setXYZW(i,r,g,b,a);}col.needsUpdate=true;}
export function smearVC(mesh,hit,opts={}){const{radius=0.2,strength=0.5,layerIndex=0}=opts;const layer=mesh._vcLayers?.[layerIndex];if(!layer)return;const pos=mesh.geometry.attributes.position;let sr=0,sg=0,sb=0,sa=0;const samples=[];for(let i=0;i<pos.count;i++){const v=new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));const d=v.distanceTo(hit.point);if(d>radius/2)continue;const b=i*4;sr+=layer.data[b];sg+=layer.data[b+1];sb+=layer.data[b+2];sa+=layer.data[b+3];samples.push(i);}if(!samples.length)return;const avg=[sr/samples.length,sg/samples.length,sb/samples.length,sa/samples.length];paintVCAdvanced(mesh,hit,{radius,strength,color:avg,layerIndex});}
export function getVCStats(mesh){return{layers:mesh._vcLayers?.length||0,hasColor:!!mesh.geometry.attributes.color};}
EOF
echo "VertexColorAdvanced.js: $(wc -l < src/mesh/VertexColorAdvanced.js) lines"

# ── ShapeKeysAdvanced.js ──────────────────────────────────────────────────────
cat > src/mesh/ShapeKeysAdvanced.js << 'EOF'
import * as THREE from "three";
export function createAdvancedShapeKey(name,mesh,opts={}){const pos=mesh.geometry.attributes.position;const data=new Float32Array(pos.array);return{id:crypto.randomUUID(),name,data,value:0,mute:false,locked:false,relativeKey:opts.relativeKey||"Basis",driver:opts.driver||null,range:opts.range||[0,1]};}
export function addAdvancedShapeKey(keys,name,mesh,opts={}){const k=createAdvancedShapeKey(name,mesh,opts);keys.push(k);return k;}
export function evaluateShapeKeysAdvanced(mesh,keys){if(!keys?.length||!mesh?.geometry?.attributes?.position)return;const pos=mesh.geometry.attributes.position;const basis=keys.find(k=>k.name==="Basis");if(!basis)return;for(let i=0;i<pos.array.length;i++)pos.array[i]=basis.data[i];for(const key of keys){if(key.name==="Basis"||key.mute||key.value===0)continue;const ref=key.relativeKey&&key.relativeKey!=="Basis"?keys.find(k=>k.name===key.relativeKey):basis;if(!ref)continue;const v=Math.min(key.range[1],Math.max(key.range[0],key.value));for(let i=0;i<pos.array.length;i++)pos.array[i]+=(key.data[i]-ref.data[i])*v;}pos.needsUpdate=true;mesh.geometry.computeVertexNormals();}
export function mirrorShapeKey(key,axis="x"){const copy={...key,id:crypto.randomUUID(),name:key.name+".mirror",data:new Float32Array(key.data)};const axIdx={x:0,y:1,z:2}[axis]??0;for(let i=0;i<copy.data.length/3;i++)copy.data[i*3+axIdx]*=-1;return copy;}
export function blendShapeKeys(keys,names,weights){if(!keys.length)return null;const base=keys[0];const result=new Float32Array(base.data.length);for(let ki=0;ki<names.length;ki++){const key=keys.find(k=>k.name===names[ki]);if(!key)continue;const w=weights[ki]||0;for(let i=0;i<result.length;i++)result[i]+=key.data[i]*w;}return{id:crypto.randomUUID(),name:"Blend_"+names.join("_"),data:result,value:1,mute:false,locked:false,relativeKey:"Basis",range:[0,1]};}
export function driverShapeKey(key,driverFn){key.driver=driverFn;return key;}
export function updateDriverKeys(keys,context={}){for(const k of keys)if(k.driver)k.value=Math.min(k.range[1],Math.max(k.range[0],k.driver(context)));}
export function exportShapeKeysGLTF(keys){return keys.filter(k=>k.name!=="Basis").map(k=>({name:k.name,weights:[k.value],targetNames:[k.name]}));}
export function getShapeKeyStats(keys){return{count:keys.length,active:keys.filter(k=>k.value>0&&!k.mute).length,driven:keys.filter(k=>k.driver).length};}
EOF
echo "ShapeKeysAdvanced.js: $(wc -l < src/mesh/ShapeKeysAdvanced.js) lines"

# ── GLTFAdvanced.js ───────────────────────────────────────────────────────────
cat > src/mesh/GLTFAdvanced.js << 'EOF'
import * as THREE from "three";
export const GLTF_EXTENSIONS={KHR_draco_mesh_compression:"KHR_draco_mesh_compression",KHR_materials_unlit:"KHR_materials_unlit",KHR_materials_clearcoat:"KHR_materials_clearcoat",KHR_materials_transmission:"KHR_materials_transmission",KHR_materials_ior:"KHR_materials_ior",KHR_materials_sheen:"KHR_materials_sheen",KHR_mesh_quantization:"KHR_mesh_quantization",EXT_mesh_gpu_instancing:"EXT_mesh_gpu_instancing"};
export async function loadGLTFAdvanced(url,opts={}){const{GLTFLoader}=await import(/* @vite-ignore */"three/examples/jsm/loaders/GLTFLoader.js").catch(()=>({}));if(!GLTFLoader){console.warn("GLTFLoader not available");return null;}const loader=new GLTFLoader();if(opts.draco){const{DRACOLoader}=await import(/* @vite-ignore */"three/examples/jsm/loaders/DRACOLoader.js").catch(()=>({}));if(DRACOLoader){const d=new DRACOLoader();d.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");loader.setDRACOLoader(d);}}return new Promise((res,rej)=>loader.load(url,res,undefined,rej));}
export async function exportGLTFAdvanced(scene,opts={}){const{GLTFExporter}=await import(/* @vite-ignore */"three/examples/jsm/exporters/GLTFExporter.js").catch(()=>({}));if(!GLTFExporter){console.warn("GLTFExporter not available");return null;}const exporter=new GLTFExporter();const options={binary:opts.binary??false,trs:opts.trs??false,onlyVisible:opts.onlyVisible??true,maxTextureSize:opts.maxTextureSize??4096,animations:opts.animations||[]};return new Promise((res,rej)=>exporter.parse(scene,(result)=>{if(opts.binary){const blob=new Blob([result],{type:"application/octet-stream"});const url=URL.createObjectURL(blob);if(opts.download){const a=document.createElement("a");a.href=url;a.download=(opts.filename||"export")+".glb";a.click();}res({blob,url});}else{const json=JSON.stringify(result,null,2);const blob=new Blob([json],{type:"application/json"});const url=URL.createObjectURL(blob);if(opts.download){const a=document.createElement("a");a.href=url;a.download=(opts.filename||"export")+".gltf";a.click();}res({json,blob,url});}},err=>rej(err),options));}
export function buildGLTFMorphTargets(mesh,shapeKeys){if(!shapeKeys?.length)return;const basis=shapeKeys.find(k=>k.name==="Basis");if(!basis)return;const targets=shapeKeys.filter(k=>k.name!=="Basis").map(key=>{const delta=new Float32Array(basis.data.length);for(let i=0;i<delta.length;i++)delta[i]=key.data[i]-basis.data[i];return{position:new THREE.Float32BufferAttribute(delta,3),name:key.name};});mesh.geometry.morphAttributes.position=targets.map(t=>t.position);mesh.morphTargetInfluences=targets.map(()=>0);mesh.morphTargetDictionary=Object.fromEntries(targets.map((t,i)=>[t.name,i]));}
export function applyGLTFMorphWeights(mesh,weights={}){if(!mesh.morphTargetDictionary)return;for(const[name,val]of Object.entries(weights)){const idx=mesh.morphTargetDictionary[name];if(idx!==undefined)mesh.morphTargetInfluences[idx]=val;}}
export function extractGLTFAnimations(gltf){if(!gltf?.animations?.length)return[];return gltf.animations.map(clip=>({name:clip.name,duration:clip.duration,tracks:clip.tracks.map(t=>({name:t.name,type:t.constructor.name,times:Array.from(t.times),values:Array.from(t.values)})),}));}
export function getGLTFStats(gltf){if(!gltf?.scene)return{};let meshCount=0,matCount=0,triCount=0;gltf.scene.traverse(obj=>{if(!obj.isMesh)return;meshCount++;if(obj.material)matCount++;if(obj.geometry?.index)triCount+=obj.geometry.index.count/3;else if(obj.geometry?.attributes?.position)triCount+=obj.geometry.attributes.position.count/3;});return{meshes:meshCount,materials:matCount,triangles:Math.round(triCount),animations:gltf.animations?.length||0};}
EOF
echo "GLTFAdvanced.js: $(wc -l < src/mesh/GLTFAdvanced.js) lines"

# ── SkeletalBinding.js ────────────────────────────────────────────────────────
cat > src/mesh/SkeletalBinding.js << 'EOF'
import * as THREE from "three";
export function heatMapWeights(mesh,armature){const pos=mesh.geometry.attributes.position;const bones=armature.bones||[];const weights=Array.from({length:pos.count},()=>[]);for(let vi=0;vi<pos.count;vi++){const v=new THREE.Vector3(pos.getX(vi),pos.getY(vi),pos.getZ(vi));const dists=bones.map((bone,bi)=>{const bp=new THREE.Vector3(bone.position[0],bone.position[1],bone.position[2]);return{bi,d:v.distanceTo(bp)};});dists.sort((a,b)=>a.d-b.d);const top=dists.slice(0,4);const total=top.reduce((s,e)=>s+1/(e.d+0.0001),0);weights[vi]=top.map(e=>({boneIndex:e.bi,weight:(1/(e.d+0.0001))/total}));}mesh._boneWeights=weights;return weights;}
export function dualQuatFromBone(bone){const q=new THREE.Quaternion();const pos=new THREE.Vector3(bone.position[0],bone.position[1],bone.position[2]);const dual=new THREE.Quaternion(0.5*(pos.x*q.w+pos.y*q.z-pos.z*q.y),0.5*(-pos.x*q.z+pos.y*q.w+pos.z*q.x),0.5*(pos.x*q.y-pos.y*q.x+pos.z*q.w),-0.5*(pos.x*q.x+pos.y*q.y+pos.z*q.z));return{real:q,dual};}
export function blendDualQuats(dqs,weights){let rw=0,rx=0,ry=0,rz=0,dw=0,dx=0,dy=0,dz=0;const pivot=dqs[0]?.real||{w:1,x:0,y:0,z:0};for(let i=0;i<dqs.length;i++){const w=weights[i]||0;const dq=dqs[i];const dot=pivot.w*dq.real.w+pivot.x*dq.real.x+pivot.y*dq.real.y+pivot.z*dq.real.z;const s=dot<0?-w:w;rw+=s*dq.real.w;rx+=s*dq.real.x;ry+=s*dq.real.y;rz+=s*dq.real.z;dw+=s*dq.dual.w;dx+=s*dq.dual.x;dy+=s*dq.dual.y;dz+=s*dq.dual.z;}const len=Math.sqrt(rw*rw+rx*rx+ry*ry+rz*rz)||1;return{real:new THREE.Quaternion(rx/len,ry/len,rz/len,rw/len),dual:new THREE.Quaternion(dx/len,dy/len,dz/len,dw/len)};}
export function createBoneEnvelope(bone,opts={}){return{boneId:bone.id||crypto.randomUUID(),headRadius:opts.headRadius||0.2,tailRadius:opts.tailRadius||0.15,distance:opts.distance||0.3,weight:opts.weight||1.0};}
export function weighByEnvelope(mesh,armature,envelopes){const pos=mesh.geometry.attributes.position;const weights=Array.from({length:pos.count},()=>[]);for(let vi=0;vi<pos.count;vi++){const v=new THREE.Vector3(pos.getX(vi),pos.getY(vi),pos.getZ(vi));let total=0;const contrib=[];for(let bi=0;bi<(armature.bones||[]).length;bi++){const env=envelopes[bi]||createBoneEnvelope(armature.bones[bi]);const bp=new THREE.Vector3(...(armature.bones[bi].position||[0,0,0]));const d=v.distanceTo(bp);if(d<env.distance){const w=(1-d/env.distance)*env.weight;contrib.push({boneIndex:bi,weight:w});total+=w;}}if(total>0)weights[vi]=contrib.map(c=>({...c,weight:c.weight/total}));}mesh._boneWeights=weights;return weights;}
export function bindSkeletonAdvanced(mesh,armature,opts={}){const method=opts.method||"heat";const weights=method==="envelope"?weighByEnvelope(mesh,armature,opts.envelopes||[]):heatMapWeights(mesh,armature);const skinIndices=[],skinWeights=[];for(const vw of weights){const top=vw.slice(0,4);while(top.length<4)top.push({boneIndex:0,weight:0});const sum=top.reduce((s,e)=>s+e.weight,0)||1;skinIndices.push(...top.map(e=>e.boneIndex));skinWeights.push(...top.map(e=>e.weight/sum));}mesh.geometry.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(skinIndices,4));mesh.geometry.setAttribute("skinWeight",new THREE.Float32BufferAttribute(skinWeights,4));return{weights,boneCount:(armature.bones||[]).length};}
export function normalizeAllWeights(mesh){if(!mesh._boneWeights)return;for(const vw of mesh._boneWeights){const total=vw.reduce((s,e)=>s+e.weight,0)||1;vw.forEach(e=>e.weight/=total);}}
export function getBindingStats(mesh){return{hasSkinIndex:!!mesh.geometry.attributes.skinIndex,hasSkinWeight:!!mesh.geometry.attributes.skinWeight,boneWeights:mesh._boneWeights?.length||0};}
EOF
echo "SkeletalBinding.js: $(wc -l < src/mesh/SkeletalBinding.js) lines"

# ── DoppelflexRig.js ──────────────────────────────────────────────────────────
cat > src/mesh/DoppelflexRig.js << 'EOF'
import * as THREE from "three";
export const DOPPELFLEX_LANDMARK_MAP={root:"hips",hips:"hips",spine:"spine",spine1:"spine1",spine2:"spine2",neck:"neck",head:"head",leftShoulder:"shoulder.L",leftArm:"upper_arm.L",leftForeArm:"forearm.L",leftHand:"hand.L",rightShoulder:"shoulder.R",rightArm:"upper_arm.R",rightForeArm:"forearm.R",rightHand:"hand.R",leftUpLeg:"thigh.L",leftLeg:"shin.L",leftFoot:"foot.L",leftToeBase:"toe.L",rightUpLeg:"thigh.R",rightLeg:"shin.R",rightFoot:"foot.R",rightToeBase:"toe.R"};
export const DOPPELFLEX_BONE_HIERARCHY=[{name:"hips",parent:null,pos:[0,1.0,0]},{name:"spine",parent:"hips",pos:[0,1.1,0]},{name:"spine1",parent:"spine",pos:[0,1.3,0]},{name:"spine2",parent:"spine1",pos:[0,1.5,0]},{name:"neck",parent:"spine2",pos:[0,1.65,0]},{name:"head",parent:"neck",pos:[0,1.75,0]},{name:"shoulder.L",parent:"spine2",pos:[-0.15,1.55,0]},{name:"upper_arm.L",parent:"shoulder.L",pos:[-0.3,1.5,0]},{name:"forearm.L",parent:"upper_arm.L",pos:[-0.55,1.2,0]},{name:"hand.L",parent:"forearm.L",pos:[-0.7,1.0,0]},{name:"shoulder.R",parent:"spine2",pos:[0.15,1.55,0]},{name:"upper_arm.R",parent:"shoulder.R",pos:[0.3,1.5,0]},{name:"forearm.R",parent:"upper_arm.R",pos:[0.55,1.2,0]},{name:"hand.R",parent:"forearm.R",pos:[0.7,1.0,0]},{name:"thigh.L",parent:"hips",pos:[-0.1,0.85,0]},{name:"shin.L",parent:"thigh.L",pos:[-0.12,0.45,0]},{name:"foot.L",parent:"shin.L",pos:[-0.12,0.08,0.05]},{name:"toe.L",parent:"foot.L",pos:[-0.12,0.02,0.15]},{name:"thigh.R",parent:"hips",pos:[0.1,0.85,0]},{name:"shin.R",parent:"thigh.R",pos:[0.12,0.45,0]},{name:"foot.R",parent:"shin.R",pos:[0.12,0.08,0.05]},{name:"toe.R",parent:"foot.R",pos:[0.12,0.02,0.15]}];
export function buildRigFromDoppelflex(landmarks={},opts={}){const scale=opts.scale||1.0;const bones=DOPPELFLEX_BONE_HIERARCHY.map(b=>{const lm=landmarks[DOPPELFLEX_LANDMARK_MAP[b.name]]||landmarks[b.name];const pos=lm?[lm.x*scale,lm.y*scale,lm.z*scale]:b.pos.map(v=>v*scale);return{id:crypto.randomUUID(),name:b.name,parent:b.parent,position:pos,rotation:[0,0,0],scale:[1,1,1],children:[]};});const boneMap=Object.fromEntries(bones.map(b=>[b.name,b]));for(const bone of bones)if(bone.parent&&boneMap[bone.parent])boneMap[bone.parent].children.push(bone.name);return{id:crypto.randomUUID(),name:opts.name||"DoppelflexRig",bones,boneMap,source:"doppelflex",landmarks:{...landmarks},metadata:{created:Date.now(),scale}};}
export function applyDoppelflexFrame(armature,frameData={}){for(const[boneName,transform]of Object.entries(frameData)){const bone=armature.boneMap?.[boneName];if(!bone)continue;if(transform.position)bone.position=[...transform.position];if(transform.rotation)bone.rotation=[...transform.rotation];if(transform.quaternion){const q=new THREE.Quaternion(...transform.quaternion);const e=new THREE.Euler().setFromQuaternion(q);bone.rotation=[e.x,e.y,e.z];}}return armature;}
export function retargetDoppelflexToSPX(frames,spxArmature){return frames.map(frame=>{const out={};for(const[dname,transform]of Object.entries(frame)){const spxName=DOPPELFLEX_LANDMARK_MAP[dname]||dname;if(spxArmature.boneMap?.[spxName])out[spxName]={...transform};}return out;});}
export function buildThreeSkeletonFromRig(rig){const threeBones={};const boneArray=[];for(const b of rig.bones){const tb=new THREE.Bone();tb.name=b.name;tb.position.set(...b.position);threeBones[b.name]=tb;boneArray.push(tb);}for(const b of rig.bones)if(b.parent&&threeBones[b.parent])threeBones[b.parent].add(threeBones[b.name]);const skeleton=new THREE.Skeleton(boneArray);return{skeleton,bones:threeBones};}
export function getRigStats(rig){return{bones:rig.bones?.length||0,source:rig.source,name:rig.name};}
EOF
echo "DoppelflexRig.js: $(wc -l < src/mesh/DoppelflexRig.js) lines"

# ── NodeCompositor.js ─────────────────────────────────────────────────────────
cat > src/mesh/NodeCompositor.js << 'EOF'
export const COMPOSITOR_NODE_TYPES={INPUT:["RenderLayer","Image","Texture","Value","RGB"],OUTPUT:["Composite","Viewer","FileOutput"],COLOR:["AlphaOver","BrightContrast","ColorBalance","HueSat","Mix","Invert","Gamma","Tonemap"],FILTER:["Blur","Glare","Bokeh","Sharpen","Denoise"],MATTE:["AlphaConvert","SetAlpha","IDMask"],TRANSFORM:["Scale","Transform","Rotate","Flip"],UTILITIES:["Math","SeparateRGBA","CombineRGBA"]};
function buildInputs(type){const m={Mix:[{name:"Fac",type:"value"},{name:"Image1",type:"image"},{name:"Image2",type:"image"}],Blur:[{name:"Image",type:"image"},{name:"Size",type:"value"}],AlphaOver:[{name:"Fac",type:"value"},{name:"Image1",type:"image"},{name:"Image2",type:"image"}],BrightContrast:[{name:"Image",type:"image"},{name:"Bright",type:"value"},{name:"Contrast",type:"value"}],Glare:[{name:"Image",type:"image"}],Denoise:[{name:"Image",type:"image"},{name:"Normal",type:"image"},{name:"Albedo",type:"image"}],ColorBalance:[{name:"Fac",type:"value"},{name:"Image",type:"image"}],HueSat:[{name:"Hue",type:"value"},{name:"Sat",type:"value"},{name:"Val",type:"value"},{name:"Image",type:"image"}],Composite:[{name:"Image",type:"image"},{name:"Alpha",type:"value"}],Viewer:[{name:"Image",type:"image"}]};return(m[type]||[{name:"Image",type:"image"}]).map(i=>({...i,id:crypto.randomUUID(),connected:null}));}
function buildOutputs(type){const m={RenderLayer:[{name:"Image"},{name:"Alpha"},{name:"Z"},{name:"Normal"},{name:"Diffuse"}],Mix:[{name:"Image"}],Blur:[{name:"Image"}],Glare:[{name:"Image"}],Denoise:[{name:"Image"}],Composite:[]};return(m[type]||[{name:"Image"}]).map(o=>({...o,id:crypto.randomUUID(),type:"image"}));}
function buildParams(type,overrides={}){const d={Mix:{blendType:"MIX",use_alpha:false},Blur:{sizeX:3,sizeY:3,filterType:"GAUSS"},Glare:{glareType:"BLOOM",quality:"MEDIUM",threshold:1.0,size:8},BrightContrast:{bright:0,contrast:0},HueSat:{hue:0.5,saturation:1,value:1},ColorBalance:{lift:[1,1,1],gamma:[1,1,1],gain:[1,1,1]},Denoise:{use_hdr:false}};return{...(d[type]||{}),...overrides};}
export function createCompositorNode(type,opts={}){return{id:crypto.randomUUID(),type,label:opts.label||type,position:opts.position||{x:0,y:0},inputs:buildInputs(type),outputs:buildOutputs(type),params:buildParams(type,opts.params||{}),mute:false,preview:null};}
export function createCompositorGraph(){return{id:crypto.randomUUID(),nodes:[],connections:[],active:true};}
export function addCompositorNode(graph,type,opts={}){const node=createCompositorNode(type,opts);graph.nodes.push(node);return node;}
export function connectCompositorNodes(graph,fromNodeId,fromOutput,toNodeId,toInput){const conn={id:crypto.randomUUID(),fromNodeId,fromOutput,toNodeId,toInput};graph.connections.push(conn);const toNode=graph.nodes.find(n=>n.id===toNodeId);if(toNode){const inp=toNode.inputs.find(i=>i.name===toInput);if(inp)inp.connected=conn.id;}return conn;}
export function removeCompositorNode(graph,id){graph.nodes=graph.nodes.filter(n=>n.id!==id);graph.connections=graph.connections.filter(c=>c.fromNodeId!==id&&c.toNodeId!==id);return graph;}
export function evaluateCompositorGraph(graph){const composite=graph.nodes.find(n=>n.type==="Composite");if(!composite)return null;const input=graph.connections.find(c=>c.toNodeId===composite.id&&c.toInput==="Image");return{evaluated:true,outputNode:composite.id,inputConnection:input};}
export function getCompositorStats(graph){return{nodes:graph.nodes.length,connections:graph.connections.length,active:graph.active};}
export const COMPOSITOR_PRESETS={};
export function applyCompositorPreset(name){const graph=createCompositorGraph();const presets={bloom:(g)=>{const rl=addCompositorNode(g,"RenderLayer",{position:{x:0,y:0}});const gl=addCompositorNode(g,"Glare",{position:{x:200,y:0}});const mx=addCompositorNode(g,"Mix",{position:{x:400,y:0},params:{blendType:"ADD"}});const out=addCompositorNode(g,"Composite",{position:{x:600,y:0}});connectCompositorNodes(g,rl.id,"Image",gl.id,"Image");connectCompositorNodes(g,rl.id,"Image",mx.id,"Image1");connectCompositorNodes(g,gl.id,"Image",mx.id,"Image2");connectCompositorNodes(g,mx.id,"Image",out.id,"Image");return g;},denoise:(g)=>{const rl=addCompositorNode(g,"RenderLayer",{position:{x:0,y:0}});const dn=addCompositorNode(g,"Denoise",{position:{x:200,y:0}});const out=addCompositorNode(g,"Composite",{position:{x:400,y:0}});connectCompositorNodes(g,rl.id,"Image",dn.id,"Image");connectCompositorNodes(g,rl.id,"Normal",dn.id,"Normal");connectCompositorNodes(g,rl.id,"Diffuse",dn.id,"Albedo");connectCompositorNodes(g,dn.id,"Image",out.id,"Image");return g;}};const fn=presets[name];if(fn)fn(graph);return graph;}
EOF
echo "NodeCompositor.js: $(wc -l < src/mesh/NodeCompositor.js) lines"

echo ""
echo "=== All mesh files written. Running patch script ==="

# ── App.jsx patch ─────────────────────────────────────────────────────────────
python3 - << 'PY'
from pathlib import Path

p = Path("src/App.jsx")
src = p.read_text()
orig_len = len(src.splitlines())

# Anchor — last import line
ANCHOR = 'import { createSPHParticle, createFluidSettings, FLUID_PRESETS, stepSPH, emitFluid, buildFluidMesh, updateFluidMesh, createPyroEmitter, stepPyro, getFluidStats } from "./mesh/FluidSystem.js";'

NEW_IMPORTS = '''import { createSPHParticle, createFluidSettings, FLUID_PRESETS, stepSPH, emitFluid, buildFluidMesh, updateFluidMesh, createPyroEmitter, stepPyro, getFluidStats } from "./mesh/FluidSystem.js";
import { SCENE_PRESETS, ENVIRONMENT_PRESETS, createScene, createSceneObject, addObjectToScene, removeObjectFromScene, duplicateObject, parentObjects, getObjectHierarchy, createCollection, applyLightingSetup, applyEnvironment, buildEnvironmentMesh, serializeScene, deserializeScene, getSceneStats } from "./mesh/SceneCreator.js";
import { ADVANCED_BRUSHES, createSculptLayer, addSculptLayer, applyLayerDelta, captureBasePositions, evaluateSculptLayers, flattenLayerToMesh, mergeLayers, getSculptLayerStats, applyClayBrush, applyScrapeBrush, applyFlattenBrush, applyMaskBrush, clearMask, invertMask, applySymmetryStroke } from "./mesh/SculptLayers.js";
import { triangulateNgon, buildNgonGeometry, addNgonFace, getNgonFaces, dissolveEdge, bridgeFaces, gridFill, getNgonStats, convertNgonsToTris } from "./mesh/NgonSupport.js";
import { VC_BLEND_MODES, initVCAdvanced, addVCLayer, removeVCLayer, paintVCAdvanced, fillVCLayer, flattenVCLayers, smearVC, getVCStats } from "./mesh/VertexColorAdvanced.js";
import { createAdvancedShapeKey, addAdvancedShapeKey, evaluateShapeKeysAdvanced, mirrorShapeKey, blendShapeKeys, driverShapeKey, updateDriverKeys, exportShapeKeysGLTF, getShapeKeyStats } from "./mesh/ShapeKeysAdvanced.js";
import { GLTF_EXTENSIONS, loadGLTFAdvanced, exportGLTFAdvanced, buildGLTFMorphTargets, applyGLTFMorphWeights, extractGLTFAnimations, getGLTFStats } from "./mesh/GLTFAdvanced.js";
import { heatMapWeights, dualQuatFromBone, blendDualQuats, createBoneEnvelope, weighByEnvelope, bindSkeletonAdvanced, normalizeAllWeights, getBindingStats } from "./mesh/SkeletalBinding.js";
import { DOPPELFLEX_LANDMARK_MAP, DOPPELFLEX_BONE_HIERARCHY, buildRigFromDoppelflex, applyDoppelflexFrame, retargetDoppelflexToSPX, buildThreeSkeletonFromRig, getRigStats } from "./mesh/DoppelflexRig.js";
import { COMPOSITOR_NODE_TYPES, createCompositorNode, createCompositorGraph, addCompositorNode, connectCompositorNodes, removeCompositorNode, evaluateCompositorGraph, getCompositorStats, applyCompositorPreset } from "./mesh/NodeCompositor.js";'''

if ANCHOR in src:
    src = src.replace(ANCHOR, NEW_IMPORTS, 1)
    print(f"Imports injected. {orig_len} -> {len(src.splitlines())} lines")
else:
    print("ERROR: anchor not found")
    import sys; sys.exit(1)

# Dedupe imports
lines = src.split('\n')
seen_imports = set()
out = []
for l in lines:
    s = l.strip()
    if s.startswith('import {'):
        if s in seen_imports:
            continue
        seen_imports.add(s)
    out.append(l)
src = '\n'.join(out)
print(f"After dedup: {len(out)} lines")

p.write_text(src)
print("Done.")
PY

echo ""
echo "=== Building ==="
npm run build 2>&1 | grep -E "built in|error" | head -5
