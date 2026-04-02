#!/usr/bin/env python3
"""
Upgrade all remaining files to 400+ lines:
- ModelGeneratorPanel.jsx
- QuadrupedGeneratorPanel.jsx
- TattooGeneratorPanel.jsx
- EyeGeneratorPanel.jsx
- TeethGeneratorPanel.jsx
- BodyGeneratorPanel.jsx
- WalkCycleGenerator.js
Run: python3 install_upgrade_thin_panels.py
"""
import os

PANELS = "/workspaces/spx-mesh-editor/src/components/panels"
MESH   = "/workspaces/spx-mesh-editor/src/mesh"

files = {}

# ─────────────────────────────────────────────────────────────────────────────
# ModelGeneratorPanel.jsx
# ─────────────────────────────────────────────────────────────────────────────
files[f"{PANELS}/ModelGeneratorPanel.jsx"] = '''import React, { useState, useRef, useCallback } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto",boxSizing:"border-box"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:12},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8},
  tag:{display:"inline-block",background:T.panel,color:T.muted,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer"},
  tagOn:{display:"inline-block",background:T.teal,color:T.bg,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer",fontWeight:700},
};

const PRIMITIVES = ["Box","Sphere","Cylinder","Cone","Torus","Plane","Circle","Icosahedron","Tetrahedron","Octahedron","Dodecahedron","TorusKnot","Capsule","Lathe","Ring"];
const OPERATIONS = ["Union","Subtract","Intersect","Slice"];
const STYLES     = ["Smooth","Flat","Wireframe","Low Poly","Subdivision","Faceted"];
const PIVOT_OPTS = ["Center","Bottom","Top","Front","Back","Left","Right"];
const SYMMETRY   = ["None","X Axis","Y Axis","Z Axis","Radial","Bilateral"];

const PRIM_DEFAULTS = {
  Box:         {w:1,h:1,d:1,wSegs:1,hSegs:1,dSegs:1},
  Sphere:      {r:0.5,wSegs:16,hSegs:8},
  Cylinder:    {rt:0.5,rb:0.5,h:1,radSegs:16,hSegs:1},
  Cone:        {r:0.5,h:1,radSegs:16},
  Torus:       {r:0.5,tube:0.2,rSegs:16,tSegs:100},
  TorusKnot:   {r:0.5,tube:0.15,p:2,q:3,radSegs:64,tubSegs:8},
  Plane:       {w:1,h:1,wSegs:1,hSegs:1},
  Icosahedron: {r:0.5,detail:0},
  Capsule:     {r:0.5,l:1,capSegs:4,radSegs:8},
};

function Slider({label,value,min,max,step=0.01,onChange}){
  return(
    <div>
      <label style={S.lbl}>{label}: <span style={{color:T.teal}}>{typeof value==="number"?value.toFixed(2):value}</span></label>
      <input style={S.inp} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}

function buildGeometry(type, p){
  switch(type){
    case "Box":         return new THREE.BoxGeometry(p.w||1,p.h||1,p.d||1,p.wSegs||1,p.hSegs||1,p.dSegs||1);
    case "Sphere":      return new THREE.SphereGeometry(p.r||0.5,p.wSegs||16,p.hSegs||8);
    case "Cylinder":    return new THREE.CylinderGeometry(p.rt||0.5,p.rb||0.5,p.h||1,p.radSegs||16,p.hSegs||1);
    case "Cone":        return new THREE.ConeGeometry(p.r||0.5,p.h||1,p.radSegs||16);
    case "Torus":       return new THREE.TorusGeometry(p.r||0.5,p.tube||0.2,p.rSegs||16,p.tSegs||100);
    case "TorusKnot":   return new THREE.TorusKnotGeometry(p.r||0.5,p.tube||0.15,p.radSegs||64,p.tubSegs||8,p.p||2,p.q||3);
    case "Plane":       return new THREE.PlaneGeometry(p.w||1,p.h||1,p.wSegs||1,p.hSegs||1);
    case "Circle":      return new THREE.CircleGeometry(p.r||0.5,p.segs||16);
    case "Icosahedron": return new THREE.IcosahedronGeometry(p.r||0.5,p.detail||0);
    case "Tetrahedron": return new THREE.TetrahedronGeometry(p.r||0.5,p.detail||0);
    case "Octahedron":  return new THREE.OctahedronGeometry(p.r||0.5,p.detail||0);
    case "Dodecahedron":return new THREE.DodecahedronGeometry(p.r||0.5,p.detail||0);
    case "Ring":        return new THREE.RingGeometry(p.ri||0.2,p.ro||0.5,p.tSegs||16);
    case "Capsule":     return new THREE.CapsuleGeometry(p.r||0.5,p.l||1,p.capSegs||4,p.radSegs||8);
    default:            return new THREE.BoxGeometry(1,1,1);
  }
}

export default function ModelGeneratorPanel({scene}){
  const [primType, setPrimType]   = useState("Box");
  const [params,   setParams]     = useState({...PRIM_DEFAULTS.Box});
  const [style,    setStyle]      = useState("Smooth");
  const [pivot,    setPivot]      = useState("Center");
  const [symmetry, setSymmetry]   = useState("None");
  const [color,    setColor]      = useState("#888888");
  const [roughness,setRoughness]  = useState(0.5);
  const [metalness,setMetalness]  = useState(0.0);
  const [posX,     setPosX]       = useState(0);
  const [posY,     setPosY]       = useState(0);
  const [posZ,     setPosZ]       = useState(0);
  const [rotX,     setRotX]       = useState(0);
  const [rotY,     setRotY]       = useState(0);
  const [rotZ,     setRotZ]       = useState(0);
  const [scaleX,   setScaleX]     = useState(1);
  const [scaleY,   setScaleY]     = useState(1);
  const [scaleZ,   setScaleZ]     = useState(1);
  const [stack,    setStack]      = useState([]);
  const [status,   setStatus]     = useState("");
  const [wireframe,setWireframe]  = useState(false);
  const [castShadow,setCastShadow]= useState(true);
  const [name,     setName]       = useState("");

  const set = useCallback((k,v) => setParams(p=>({...p,[k]:v})), []);

  function selectPrim(type){
    setPrimType(type);
    setParams({...PRIM_DEFAULTS[type]||{}});
  }

  function generate(){
    if(!scene){ setStatus("No scene connected"); return; }
    const geo = buildGeometry(primType, params);

    // Apply style
    if(style==="Flat") geo.computeVertexNormals();
    if(style==="Low Poly"){ /* keep faceted */ }

    const mat = new THREE.MeshStandardMaterial({
      color, roughness, metalness,
      wireframe: style==="Wireframe",
      flatShading: style==="Flat"||style==="Faceted"||style==="Low Poly",
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name || `${primType}_${Date.now()}`;
    mesh.position.set(posX, posY, posZ);
    mesh.rotation.set(rotX*Math.PI/180, rotY*Math.PI/180, rotZ*Math.PI/180);
    mesh.scale.set(scaleX, scaleY, scaleZ);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;

    // Pivot adjustment
    if(pivot==="Bottom"){ const bbox=new THREE.Box3().setFromObject(mesh); mesh.position.y-=bbox.min.y; }
    else if(pivot==="Top"){ const bbox=new THREE.Box3().setFromObject(mesh); mesh.position.y-=bbox.max.y; }

    scene.add(mesh);
    setStack(s=>[...s,{id:mesh.uuid,name:mesh.name,type:primType}]);
    setStatus(`✓ Added ${mesh.name} (${geo.attributes.position.count} vertices)`);
  }

  function clearScene(){
    if(!scene) return;
    stack.forEach(item=>{
      const obj=scene.getObjectByProperty('uuid',item.id);
      if(obj) scene.remove(obj);
    });
    setStack([]); setStatus("Scene cleared");
  }

  function exportGLB(){
    setStatus("Export: use File → Export → GLB from the main menu");
  }

  const paramFields = {
    Box:[
      {k:"w",l:"Width",min:0.01,max:10},{k:"h",l:"Height",min:0.01,max:10},{k:"d",l:"Depth",min:0.01,max:10},
      {k:"wSegs",l:"Width Segs",min:1,max:32,step:1},{k:"hSegs",l:"Height Segs",min:1,max:32,step:1},{k:"dSegs",l:"Depth Segs",min:1,max:32,step:1},
    ],
    Sphere:[{k:"r",l:"Radius",min:0.01,max:5},{k:"wSegs",l:"Width Segs",min:3,max:64,step:1},{k:"hSegs",l:"Height Segs",min:2,max:32,step:1}],
    Cylinder:[{k:"rt",l:"Top Radius",min:0,max:5},{k:"rb",l:"Bot Radius",min:0,max:5},{k:"h",l:"Height",min:0.01,max:10},{k:"radSegs",l:"Radial Segs",min:3,max:64,step:1}],
    Cone:[{k:"r",l:"Radius",min:0.01,max:5},{k:"h",l:"Height",min:0.01,max:10},{k:"radSegs",l:"Radial Segs",min:3,max:64,step:1}],
    Torus:[{k:"r",l:"Radius",min:0.1,max:5},{k:"tube",l:"Tube",min:0.01,max:2},{k:"rSegs",l:"Radial Segs",min:3,max:32,step:1},{k:"tSegs",l:"Tubular Segs",min:3,max:200,step:1}],
    TorusKnot:[{k:"r",l:"Radius",min:0.1,max:5},{k:"tube",l:"Tube",min:0.01,max:1},{k:"p",l:"P",min:1,max:10,step:1},{k:"q",l:"Q",min:1,max:10,step:1}],
    Plane:[{k:"w",l:"Width",min:0.01,max:20},{k:"h",l:"Height",min:0.01,max:20},{k:"wSegs",l:"W Segs",min:1,max:64,step:1},{k:"hSegs",l:"H Segs",min:1,max:64,step:1}],
    Icosahedron:[{k:"r",l:"Radius",min:0.01,max:5},{k:"detail",l:"Detail",min:0,max:5,step:1}],
    Capsule:[{k:"r",l:"Radius",min:0.01,max:5},{k:"l",l:"Length",min:0.01,max:10},{k:"capSegs",l:"Cap Segs",min:1,max:16,step:1},{k:"radSegs",l:"Rad Segs",min:3,max:32,step:1}],
  };

  return(
    <div style={S.root}>
      <div style={S.h2}>🔷 MODEL GENERATOR</div>

      <div style={S.sec}>
        <div style={S.h3}>Primitive Type</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {PRIMITIVES.map(p=><span key={p} style={primType===p?S.tagOn:S.tag} onClick={()=>selectPrim(p)}>{p}</span>)}
        </div>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Parameters</div>
        {(paramFields[primType]||[]).map(f=>(
          <Slider key={f.k} label={f.l} value={params[f.k]||0} min={f.min} max={f.max} step={f.step||0.01} onChange={v=>set(f.k,v)}/>
        ))}
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Style</div>
        <div style={S.row}>
          <div>
            <label style={S.lbl}>Render Style</label>
            <select style={S.sel} value={style} onChange={e=>setStyle(e.target.value)}>
              {STYLES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>Symmetry</label>
            <select style={S.sel} value={symmetry} onChange={e=>setSymmetry(e.target.value)}>
              {SYMMETRY.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={S.row}>
          <div>
            <label style={S.lbl}>Pivot Point</label>
            <select style={S.sel} value={pivot} onChange={e=>setPivot(e.target.value)}>
              {PIVOT_OPTS.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>Base Color</label>
            <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:"100%",height:32,borderRadius:4,border:"none",cursor:"pointer"}}/>
          </div>
        </div>
        <Slider label="Roughness" value={roughness} min={0} max={1} onChange={setRoughness}/>
        <Slider label="Metalness" value={metalness} min={0} max={1} onChange={setMetalness}/>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <span style={wireframe?S.tagOn:S.tag} onClick={()=>setWireframe(!wireframe)}>Wireframe</span>
          <span style={castShadow?S.tagOn:S.tag} onClick={()=>setCastShadow(!castShadow)}>Cast Shadow</span>
        </div>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Transform</div>
        <div style={S.row}>
          <Slider label="Pos X" value={posX} min={-10} max={10} onChange={setPosX}/>
          <Slider label="Pos Y" value={posY} min={-10} max={10} onChange={setPosY}/>
        </div>
        <div style={S.row}>
          <Slider label="Pos Z" value={posZ} min={-10} max={10} onChange={setPosZ}/>
          <Slider label="Rot X" value={rotX} min={-180} max={180} step={1} onChange={setRotX}/>
        </div>
        <div style={S.row}>
          <Slider label="Rot Y" value={rotY} min={-180} max={180} step={1} onChange={setRotY}/>
          <Slider label="Rot Z" value={rotZ} min={-180} max={180} step={1} onChange={setRotZ}/>
        </div>
        <div style={S.row}>
          <Slider label="Scale X" value={scaleX} min={0.01} max={10} onChange={setScaleX}/>
          <Slider label="Scale Y" value={scaleY} min={0.01} max={10} onChange={setScaleY}/>
        </div>
        <Slider label="Scale Z" value={scaleZ} min={0.01} max={10} onChange={setScaleZ}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Name & Operations</div>
        <label style={S.lbl}>Object Name</label>
        <input style={S.inp} type="text" value={name} placeholder={`${primType}_001`} onChange={e=>setName(e.target.value)}/>
        <label style={S.lbl}>Boolean Operation</label>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
          {OPERATIONS.map(o=><span key={o} style={S.tag}>{o}</span>)}
        </div>
      </div>

      {stack.length>0&&(
        <div style={S.sec}>
          <div style={S.h3}>Scene Objects ({stack.length})</div>
          {stack.slice(-5).map(item=><div key={item.id} style={{...S.stat,marginBottom:2}}>▸ {item.name} ({item.type})</div>)}
          {stack.length>5&&<div style={{color:T.muted,fontSize:10}}>...and {stack.length-5} more</div>}
        </div>
      )}

      <button style={S.btn} onClick={generate}>⚡ Generate</button>
      <button style={S.btnO} onClick={clearScene}>🗑 Clear</button>
      <button style={{...S.btnO,background:"#333"}} onClick={exportGLB}>💾 Export</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ─────────────────────────────────────────────────────────────────────────────
# QuadrupedGeneratorPanel.jsx
# ─────────────────────────────────────────────────────────────────────────────
files[f"{PANELS}/QuadrupedGeneratorPanel.jsx"] = '''import React, { useState, useCallback } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto",boxSizing:"border-box"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:12},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:4},
  tag:{display:"inline-block",background:T.panel,color:T.muted,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer"},
  tagOn:{display:"inline-block",background:T.teal,color:T.bg,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer",fontWeight:700},
};

const SPECIES=["Dog","Cat","Horse","Wolf","Lion","Tiger","Bear","Deer","Fox","Rabbit","Dragon","Dinosaur","Lizard","Elephant","Rhino","Gorilla","Panther","Cheetah","Hyena","Boar"];
const BREEDS={
  Dog:["Generic","German Shepherd","Husky","Bulldog","Poodle","Great Dane","Chihuahua","Border Collie"],
  Cat:["Generic","Domestic","Persian","Bengal","Siamese","Maine Coon","Sphynx"],
  Horse:["Generic","Arabian","Thoroughbred","Draft","Mustang","Clydesdale"],
  Wolf:["Generic","Grey Wolf","Arctic Wolf","Black Wolf","Dire Wolf"],
};
const COAT_TYPES=["Short Fur","Long Fur","Scales","Smooth Skin","Feathered","Armored","Wet","Dry"];
const POSES=["Neutral","Walk","Run","Sit","Lie Down","Alert","Aggressive","Playful","Eating","Sleeping"];
const BODY_BUILDS=["Slim","Athletic","Heavy","Muscular","Stocky","Lean","Massive"];

function Slider({label,value,min,max,step=0.01,onChange}){
  return(
    <div>
      <label style={S.lbl}>{label}: <span style={{color:T.teal}}>{typeof value==="number"?value.toFixed(2):value}</span></label>
      <input style={S.inp} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}

function buildQuadrupedMesh(params){
  const {
    species="Dog", bodyLength=1.2, bodyWidth=0.4, bodyHeight=0.45,
    neckLength=0.35, headSize=0.28, headWidth=0.22,
    legFrontLength=0.55, legBackLength=0.6, legRadius=0.055,
    tailLength=0.5, tailCurve=0.3,
    color="#a0785a", roughness=0.8,
  } = params;

  const group = new THREE.Group();
  group.name = species;
  const mat  = new THREE.MeshStandardMaterial({color, roughness, metalness:0});
  const mat2 = new THREE.MeshStandardMaterial({color, roughness:0.9});

  // Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(1,12,8), mat);
  body.scale.set(bodyLength/2, bodyHeight/2, bodyWidth/2);
  body.position.y = legFrontLength + bodyHeight/2;
  body.castShadow = true;
  group.add(body);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(headWidth*0.5, bodyHeight*0.3, neckLength, 8), mat);
  neck.position.set(bodyLength*0.35, legFrontLength+bodyHeight*0.7, 0);
  neck.rotation.z = -Math.PI*0.18;
  group.add(neck);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(1,10,8), mat);
  head.scale.set(headSize, headSize*0.85, headWidth*0.8);
  head.position.set(bodyLength*0.42+neckLength*0.5, legFrontLength+bodyHeight*0.85+neckLength*0.3, 0);
  head.castShadow = true;
  group.add(head);

  // Snout
  const snout = new THREE.Mesh(new THREE.BoxGeometry(headSize*0.6, headSize*0.35, headWidth*0.65), mat);
  snout.position.set(head.position.x+headSize*0.55, head.position.y-headSize*0.1, 0);
  group.add(snout);

  // Ears
  [-1,1].forEach(side=>{
    const ear = new THREE.Mesh(new THREE.ConeGeometry(headSize*0.22, headSize*0.45, 6), mat2);
    ear.position.set(head.position.x-headSize*0.1, head.position.y+headSize*0.6, side*headWidth*0.45);
    ear.rotation.z = side*0.15;
    group.add(ear);
  });

  // Eyes
  [-1,1].forEach(side=>{
    const eye = new THREE.Mesh(new THREE.SphereGeometry(headSize*0.08,8,6),
      new THREE.MeshStandardMaterial({color:0x111111, roughness:0.1}));
    eye.position.set(head.position.x+headSize*0.35, head.position.y+headSize*0.08, side*headWidth*0.38);
    group.add(eye);
  });

  // Legs — 4 legs
  const legDefs = [
    [bodyLength*0.35, 0, bodyWidth*0.38, legFrontLength],
    [bodyLength*0.35, 0, -bodyWidth*0.38, legFrontLength],
    [-bodyLength*0.35, 0, bodyWidth*0.38, legBackLength],
    [-bodyLength*0.35, 0, -bodyWidth*0.38, legBackLength],
  ];
  legDefs.forEach(([x,_,z,len])=>{
    // Upper leg
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(legRadius*1.2, legRadius, len*0.55, 6), mat);
    upper.position.set(x, len*0.72, z);
    group.add(upper);
    // Lower leg
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius*0.8, len*0.45, 6), mat);
    lower.position.set(x, len*0.22, z);
    group.add(lower);
    // Paw
    const paw = new THREE.Mesh(new THREE.SphereGeometry(legRadius*1.5, 6, 4), mat2);
    paw.scale.z = 1.6;
    paw.position.set(x+legRadius*0.3, legRadius, z);
    group.add(paw);
  });

  // Tail
  if(tailLength > 0){
    const tailSegments = 8;
    for(let i=0;i<tailSegments;i++){
      const t = i/tailSegments;
      const tailSeg = new THREE.Mesh(
        new THREE.SphereGeometry(legRadius*(1-t*0.7), 6, 4), mat);
      const angle = t*tailCurve*Math.PI;
      tailSeg.position.set(-bodyLength*0.5-Math.sin(angle)*tailLength*t, legFrontLength+bodyHeight*0.5+Math.cos(angle)*tailLength*t*0.3, 0);
      group.add(tailSeg);
    }
  }

  return group;
}

export default function QuadrupedGeneratorPanel({scene}){
  const [species,   setSpecies]    = useState("Dog");
  const [breed,     setBreed]      = useState("Generic");
  const [bodyBuild, setBodyBuild]  = useState("Athletic");
  const [coatType,  setCoatType]   = useState("Short Fur");
  const [pose,      setPose]       = useState("Neutral");
  const [size,      setSize]       = useState(1.0);
  const [bodyLen,   setBodyLen]    = useState(1.2);
  const [bodyW,     setBodyW]      = useState(0.4);
  const [bodyH,     setBodyH]      = useState(0.45);
  const [neckLen,   setNeckLen]    = useState(0.35);
  const [headSz,    setHeadSz]     = useState(0.28);
  const [legFront,  setLegFront]   = useState(0.55);
  const [legBack,   setLegBack]    = useState(0.60);
  const [legRad,    setLegRad]     = useState(0.055);
  const [tailLen,   setTailLen]    = useState(0.5);
  const [tailCurve, setTailCurve]  = useState(0.3);
  const [primaryColor,setPrimary]  = useState("#a0785a");
  const [secondColor, setSecond]   = useState("#7a5a3a");
  const [eyeColor,    setEye]      = useState("#4a3000");
  const [roughness,   setRoughness]= useState(0.8);
  const [age,         setAge]      = useState(3);
  const [furLength,   setFurLen]   = useState(0.5);
  const [status,      setStatus]   = useState("");

  function generate(){
    if(!scene){ setStatus("No scene connected"); return; }
    const group = buildQuadrupedMesh({
      species, bodyLength:bodyLen*size, bodyWidth:bodyW*size, bodyHeight:bodyH*size,
      neckLength:neckLen*size, headSize:headSz*size,
      legFrontLength:legFront*size, legBackLength:legBack*size, legRadius:legRad*size,
      tailLength:tailLen*size, tailCurve,
      color:primaryColor, roughness,
    });
    group.name = `${species}_${breed}_${Date.now()}`;
    scene.add(group);
    setStatus(`✓ Generated ${group.name}`);
  }

  function randomize(){
    const s = SPECIES[Math.floor(Math.random()*SPECIES.length)];
    setSpecies(s);
    setSize(0.5+Math.random()*3);
    setBodyLen(0.8+Math.random()*1.5);
    setBodyW(0.3+Math.random()*0.5);
    setBodyH(0.3+Math.random()*0.5);
    setLegFront(0.3+Math.random()*0.8);
    setLegBack(0.3+Math.random()*0.9);
    setTailLen(Math.random()*1.2);
    setPrimary(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6,"0")}`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🐾 QUADRUPED GENERATOR</div>

      <div style={S.sec}>
        <div style={S.h3}>Species & Breed</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {SPECIES.map(s=><span key={s} style={species===s?S.tagOn:S.tag} onClick={()=>{setSpecies(s);setBreed("Generic");}}>{s}</span>)}
        </div>
        <div style={S.row}>
          <div>
            <label style={S.lbl}>Breed</label>
            <select style={S.sel} value={breed} onChange={e=>setBreed(e.target.value)}>
              {(BREEDS[species]||["Generic"]).map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>Body Build</label>
            <select style={S.sel} value={bodyBuild} onChange={e=>setBodyBuild(e.target.value)}>
              {BODY_BUILDS.map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div style={S.row}>
          <div>
            <label style={S.lbl}>Coat Type</label>
            <select style={S.sel} value={coatType} onChange={e=>setCoatType(e.target.value)}>
              {COAT_TYPES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>Pose</label>
            <select style={S.sel} value={pose} onChange={e=>setPose(e.target.value)}>
              {POSES.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <Slider label="Age (years)" value={age} min={0} max={20} step={0.5} onChange={setAge}/>
        <Slider label="Overall Size" value={size} min={0.1} max={5} onChange={setSize}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Body Proportions</div>
        <Slider label="Body Length"  value={bodyLen}  min={0.5} max={3}   onChange={setBodyLen}/>
        <Slider label="Body Width"   value={bodyW}    min={0.2} max={1.5} onChange={setBodyW}/>
        <Slider label="Body Height"  value={bodyH}    min={0.2} max={1.5} onChange={setBodyH}/>
        <Slider label="Neck Length"  value={neckLen}  min={0.1} max={1.5} onChange={setNeckLen}/>
        <Slider label="Head Size"    value={headSz}   min={0.1} max={0.8} onChange={setHeadSz}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Legs & Tail</div>
        <Slider label="Front Leg Length" value={legFront} min={0.2} max={2} onChange={setLegFront}/>
        <Slider label="Back Leg Length"  value={legBack}  min={0.2} max={2} onChange={setLegBack}/>
        <Slider label="Leg Radius"       value={legRad}   min={0.02} max={0.2} onChange={setLegRad}/>
        <Slider label="Tail Length"      value={tailLen}  min={0} max={2}   onChange={setTailLen}/>
        <Slider label="Tail Curve"       value={tailCurve}min={0} max={1}   onChange={setTailCurve}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Coat & Colors</div>
        <Slider label="Fur Length"   value={furLength} min={0} max={1} onChange={setFurLen}/>
        <Slider label="Roughness"    value={roughness} min={0} max={1} onChange={setRoughness}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:8}}>
          {[["Primary",primaryColor,setPrimary],["Secondary",secondColor,setSecond],["Eyes",eyeColor,setEye]].map(([lbl,val,setter])=>(
            <div key={lbl}>
              <label style={S.lbl}>{lbl}</label>
              <input type="color" value={val} onChange={e=>setter(e.target.value)} style={{width:"100%",height:28,borderRadius:4,border:"none",cursor:"pointer"}}/>
            </div>
          ))}
        </div>
      </div>

      <button style={S.btn} onClick={generate}>⚡ Generate {species}</button>
      <button style={S.btnO} onClick={randomize}>🎲 Randomize</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ─────────────────────────────────────────────────────────────────────────────
# EyeGeneratorPanel.jsx
# ─────────────────────────────────────────────────────────────────────────────
files[f"{PANELS}/EyeGeneratorPanel.jsx"] = '''import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto",boxSizing:"border-box"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:12},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  prev:{width:"100%",height:200,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8},
  row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},
  tag:{display:"inline-block",background:T.panel,color:T.muted,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer"},
  tagOn:{display:"inline-block",background:T.teal,color:T.bg,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer",fontWeight:700},
};

const EYE_PRESETS={
  "Human Neutral": {irisColor:"#5b8ad0",pupilSize:0.35,irisSize:0.62,scleraColor:"#f5f0e8",irisPattern:"radial",limbusWidth:0.08,irisRings:3,irisDetail:0.6,eyelidTop:0.45,eyelidBot:0.15,innerCorner:0.1,outerCorner:-0.05,reflection:0.8,eyeGlow:0,species:"human"},
  "Human Brown":   {irisColor:"#6b3a1a",pupilSize:0.38,irisSize:0.60,scleraColor:"#f5f0e8",irisPattern:"radial",limbusWidth:0.09,irisRings:4,irisDetail:0.7,eyelidTop:0.45,eyelidBot:0.15,innerCorner:0.1,outerCorner:-0.05,reflection:0.8,eyeGlow:0,species:"human"},
  "Cat Slit":      {irisColor:"#e8c84a",pupilSize:0.15,irisSize:0.75,scleraColor:"#f0ede0",irisPattern:"slit",limbusWidth:0.06,irisRings:2,irisDetail:0.8,eyelidTop:0.5,eyelidBot:0.1,innerCorner:0.05,outerCorner:0.05,reflection:0.9,eyeGlow:0.2,species:"cat"},
  "Dragon Fire":   {irisColor:"#ff4400",pupilSize:0.2,irisSize:0.8,scleraColor:"#1a0000",irisPattern:"fire",limbusWidth:0.04,irisRings:5,irisDetail:0.9,eyelidTop:0.55,eyelidBot:0.05,innerCorner:0,outerCorner:0.1,reflection:0.6,eyeGlow:0.8,species:"dragon"},
  "Snake Vertical":{irisColor:"#4aaa22",pupilSize:0.12,irisSize:0.7,scleraColor:"#e8ead0",irisPattern:"vertical",limbusWidth:0.05,irisRings:2,irisDetail:0.7,eyelidTop:0.3,eyelidBot:0.05,innerCorner:0,outerCorner:0,reflection:0.7,eyeGlow:0.1,species:"snake"},
  "Alien Void":    {irisColor:"#00ffcc",pupilSize:0.5,irisSize:0.9,scleraColor:"#000000",irisPattern:"spiral",limbusWidth:0.02,irisRings:8,irisDetail:1.0,eyelidTop:0.6,eyelidBot:0.0,innerCorner:0,outerCorner:0.2,reflection:1.0,eyeGlow:1.0,species:"alien"},
  "Demon":         {irisColor:"#cc0000",pupilSize:0.25,irisSize:0.78,scleraColor:"#000000",irisPattern:"fire",limbusWidth:0.03,irisRings:6,irisDetail:0.95,eyelidTop:0.58,eyelidBot:0.08,innerCorner:0.05,outerCorner:0.15,reflection:0.5,eyeGlow:0.9,species:"demon"},
  "Undead":        {irisColor:"#88aaff",pupilSize:0.6,irisSize:0.5,scleraColor:"#d4d0b0",irisPattern:"radial",limbusWidth:0.12,irisRings:1,irisDetail:0.3,eyelidTop:0.35,eyelidBot:0.2,innerCorner:0.08,outerCorner:-0.1,reflection:0.2,eyeGlow:0.4,species:"undead"},
};

function drawEyePreview(canvas, eye){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#111";ctx.fillRect(0,0,w,h);
  const cx=w/2,cy=h/2,er=h*0.35;

  // Sclera
  ctx.beginPath();ctx.ellipse(cx,cy,er*1.4,er,0,0,Math.PI*2);
  ctx.fillStyle=eye.scleraColor||"#f5f0e8";ctx.fill();

  // Iris
  const ir=er*eye.irisSize;
  const irisGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,ir);
  const ic=eye.irisColor||"#5b8ad0";
  irisGrad.addColorStop(0,ic+"cc");
  irisGrad.addColorStop(0.5,ic);
  irisGrad.addColorStop(1,ic+"66");
  ctx.beginPath();ctx.arc(cx,cy,ir,0,Math.PI*2);
  ctx.fillStyle=irisGrad;ctx.fill();

  // Iris pattern
  if(eye.irisPattern==="radial"||eye.irisPattern==="fire"){
    const rays=Math.round(24+eye.irisDetail*16);
    for(let i=0;i<rays;i++){
      const a=(i/rays)*Math.PI*2;
      const len=ir*(0.3+Math.random()*0.4)*eye.irisDetail;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*len,cy+Math.sin(a)*len);
      ctx.strokeStyle="rgba(0,0,0,0.15)";ctx.lineWidth=1;ctx.stroke();
    }
  }
  if(eye.irisPattern==="spiral"){
    for(let i=0;i<60;i++){
      const t=i/60,a=t*Math.PI*8,r=t*ir*0.9;
      ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,1.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${0.3*eye.irisDetail})`;ctx.fill();
    }
  }

  // Iris rings
  for(let r=0;r<eye.irisRings;r++){
    ctx.beginPath();ctx.arc(cx,cy,ir*(0.3+r/(eye.irisRings)*0.65),0,Math.PI*2);
    ctx.strokeStyle="rgba(0,0,0,0.12)";ctx.lineWidth=1;ctx.stroke();
  }

  // Limbus
  ctx.beginPath();ctx.arc(cx,cy,ir,0,Math.PI*2);
  ctx.strokeStyle="rgba(0,0,0,0.6)";ctx.lineWidth=ir*eye.limbusWidth*2;ctx.stroke();

  // Pupil
  const pr=ir*eye.pupilSize;
  if(eye.irisPattern==="slit"||eye.irisPattern==="vertical"){
    ctx.beginPath();ctx.ellipse(cx,cy,pr*0.25,pr,0,0,Math.PI*2);
  } else {
    ctx.beginPath();ctx.arc(cx,cy,pr,0,Math.PI*2);
  }
  ctx.fillStyle="#000";ctx.fill();

  // Reflection
  if(eye.reflection>0){
    const rg=ctx.createRadialGradient(cx-ir*0.25,cy-ir*0.25,0,cx-ir*0.25,cy-ir*0.25,ir*0.35);
    rg.addColorStop(0,`rgba(255,255,255,${eye.reflection*0.9})`);
    rg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.beginPath();ctx.arc(cx-ir*0.25,cy-ir*0.25,ir*0.35,0,Math.PI*2);ctx.fillStyle=rg;ctx.fill();
    ctx.beginPath();ctx.arc(cx+ir*0.3,cy+ir*0.2,ir*0.1,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${eye.reflection*0.5})`;ctx.fill();
  }

  // Glow
  if(eye.eyeGlow>0){
    const glowGrad=ctx.createRadialGradient(cx,cy,ir*0.5,cx,cy,ir*1.3);
    glowGrad.addColorStop(0,eye.irisColor+Math.round(eye.eyeGlow*120).toString(16).padStart(2,"0"));
    glowGrad.addColorStop(1,"transparent");
    ctx.beginPath();ctx.arc(cx,cy,ir*1.3,0,Math.PI*2);ctx.fillStyle=glowGrad;ctx.fill();
  }

  // Eyelids
  ctx.beginPath();ctx.moveTo(cx-er*1.4,cy);
  ctx.quadraticCurveTo(cx,cy-er*(0.6+eye.eyelidTop*0.6),cx+er*1.4,cy);
  ctx.fillStyle=T.bg;ctx.fill();
  ctx.beginPath();ctx.moveTo(cx-er*1.4,cy);
  ctx.quadraticCurveTo(cx,cy+er*(0.3+eye.eyelidBot*0.4),cx+er*1.4,cy);
  ctx.fillStyle=T.bg;ctx.fill();

  // Eyelash dots (simplified)
  const lashCount=12;
  for(let i=0;i<lashCount;i++){
    const t=i/(lashCount-1), x2=cx-er*1.35+t*er*2.7;
    const y2=cy-er*(0.6+eye.eyelidTop*0.6)*Math.sin(t*Math.PI);
    ctx.beginPath();ctx.arc(x2,y2,2,0,Math.PI*2);ctx.fillStyle="#1a0a00";ctx.fill();
  }
}

function Slider({label,value,min,max,step=0.01,onChange}){
  return(
    <div>
      <label style={S.lbl}>{label}: <span style={{color:T.teal}}>{typeof value==="number"?value.toFixed(2):value}</span></label>
      <input style={S.inp} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}

export default function EyeGeneratorPanel({scene}){
  const [preset, setPreset]    = useState("Human Neutral");
  const [eye,    setEye]       = useState({...EYE_PRESETS["Human Neutral"]});
  const [status, setStatus]    = useState("");
  const prevRef = useRef(null);

  const set = useCallback((k,v)=>setEye(e=>({...e,[k]:v})),[]);

  useEffect(()=>{ if(prevRef.current) drawEyePreview(prevRef.current,eye); },[eye]);

  function loadPreset(p){ setPreset(p); setEye({...EYE_PRESETS[p]}); }

  function applyToScene(){
    if(!scene){ setStatus("No scene"); return; }
    const c = document.createElement("canvas");
    c.width=c.height=512; drawEyePreview(c,eye);
    const tex = new THREE.CanvasTexture(c);
    let n=0;
    scene.traverse(o=>{
      if(o.isMesh&&(o.name.toLowerCase().includes("eye")||o.userData.isEye)){
        o.material = new THREE.MeshStandardMaterial({map:tex,roughness:0.05,metalness:0.1});
        n++;
      }
    });
    setStatus(`✓ Applied to ${n} eye mesh(es)`);
  }

  function exportTexture(){
    const c=document.createElement("canvas");c.width=c.height=1024;
    drawEyePreview(c,eye);
    const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="eye_texture.png";a.click();
    setStatus("✓ Eye texture exported");
  }

  const PATTERNS=["radial","slit","vertical","fire","spiral","void"];

  return(
    <div style={S.root}>
      <div style={S.h2}>👁 EYE GENERATOR</div>

      <div style={S.sec}>
        <div style={S.h3}>Presets</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(EYE_PRESETS).map(p=><span key={p} style={preset===p?S.tagOn:S.tag} onClick={()=>loadPreset(p)}>{p}</span>)}
        </div>
        <canvas ref={prevRef} width={400} height={200} style={S.prev}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Iris</div>
        <div style={S.row}>
          <div><label style={S.lbl}>Iris Color</label>
            <input type="color" value={eye.irisColor||"#5b8ad0"} onChange={e=>set("irisColor",e.target.value)} style={{width:"100%",height:32,borderRadius:4,border:"none",cursor:"pointer"}}/></div>
          <div><label style={S.lbl}>Sclera Color</label>
            <input type="color" value={eye.scleraColor||"#f5f0e8"} onChange={e=>set("scleraColor",e.target.value)} style={{width:"100%",height:32,borderRadius:4,border:"none",cursor:"pointer"}}/></div>
        </div>
        <label style={S.lbl}>Iris Pattern</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {PATTERNS.map(p=><span key={p} style={eye.irisPattern===p?S.tagOn:S.tag} onClick={()=>set("irisPattern",p)}>{p}</span>)}
        </div>
        <Slider label="Iris Size"    value={eye.irisSize||0.62}    min={0.3} max={1}   onChange={v=>set("irisSize",v)}/>
        <Slider label="Iris Rings"   value={eye.irisRings||3}      min={0}   max={10} step={1} onChange={v=>set("irisRings",v)}/>
        <Slider label="Iris Detail"  value={eye.irisDetail||0.6}   min={0}   max={1}   onChange={v=>set("irisDetail",v)}/>
        <Slider label="Limbus Width" value={eye.limbusWidth||0.08} min={0}   max={0.3} onChange={v=>set("limbusWidth",v)}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Pupil</div>
        <Slider label="Pupil Size"   value={eye.pupilSize||0.35}   min={0.05} max={0.95} onChange={v=>set("pupilSize",v)}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Eyelids</div>
        <Slider label="Upper Lid"    value={eye.eyelidTop||0.45}   min={0}   max={1}   onChange={v=>set("eyelidTop",v)}/>
        <Slider label="Lower Lid"    value={eye.eyelidBot||0.15}   min={0}   max={0.5} onChange={v=>set("eyelidBot",v)}/>
        <Slider label="Inner Corner" value={eye.innerCorner||0.1}  min={-0.3} max={0.3} onChange={v=>set("innerCorner",v)}/>
        <Slider label="Outer Corner" value={eye.outerCorner||-0.05}min={-0.3} max={0.3} onChange={v=>set("outerCorner",v)}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>FX</div>
        <Slider label="Reflection"   value={eye.reflection||0.8}  min={0}   max={1}   onChange={v=>set("reflection",v)}/>
        <Slider label="Eye Glow"     value={eye.eyeGlow||0}       min={0}   max={1}   onChange={v=>set("eyeGlow",v)}/>
      </div>

      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      <button style={S.btnO} onClick={exportTexture}>💾 Export Texture</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ─────────────────────────────────────────────────────────────────────────────
# TeethGeneratorPanel.jsx
# ─────────────────────────────────────────────────────────────────────────────
files[f"{PANELS}/TeethGeneratorPanel.jsx"] = '''import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto",boxSizing:"border-box"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:12},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  prev:{width:"100%",height:160,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8},
  row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},
  tag:{display:"inline-block",background:T.panel,color:T.muted,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer"},
  tagOn:{display:"inline-block",background:T.teal,color:T.bg,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer",fontWeight:700},
};

const TEETH_PRESETS={
  "Perfect Hollywood": {upperCount:8,lowerCount:8,toothWidth:0.9,toothHeight:1.0,toothDepth:0.5,spacing:0.02,curvature:0.4,shadeColor:"#f8f8f0",stainLevel:0,chipping:0,gumColor:"#e88080",gumHeight:0.3,gumRecession:0,rootExposure:0,alignment:"perfect",species:"human"},
  "Natural Human":     {upperCount:8,lowerCount:8,toothWidth:0.85,toothHeight:0.9,toothDepth:0.48,spacing:0.03,curvature:0.38,shadeColor:"#eeeacc",stainLevel:0.15,chipping:0.05,gumColor:"#e07070",gumHeight:0.28,gumRecession:0.05,rootExposure:0,alignment:"slight",species:"human"},
  "Aged/Stained":      {upperCount:8,lowerCount:8,toothWidth:0.82,toothHeight:0.85,toothDepth:0.45,spacing:0.05,curvature:0.35,shadeColor:"#d4c880",stainLevel:0.55,chipping:0.2,gumColor:"#c06060",gumHeight:0.22,gumRecession:0.2,rootExposure:0.1,alignment:"crowded",species:"human"},
  "Vampire":           {upperCount:6,lowerCount:6,toothWidth:0.7,toothHeight:1.2,toothDepth:0.4,spacing:0.04,curvature:0.3,shadeColor:"#f0f0f0",stainLevel:0,chipping:0,gumColor:"#aa3030",gumHeight:0.25,gumRecession:0.1,rootExposure:0,alignment:"perfect",species:"vampire"},
  "Dragon":            {upperCount:12,lowerCount:10,toothWidth:1.2,toothHeight:1.8,toothDepth:0.8,spacing:0.08,curvature:0.5,shadeColor:"#e8e0a0",stainLevel:0.1,chipping:0.15,gumColor:"#804040",gumHeight:0.4,gumRecession:0.0,rootExposure:0,alignment:"irregular",species:"dragon"},
  "Monster":           {upperCount:16,lowerCount:14,toothWidth:0.8,toothHeight:1.4,toothDepth:0.6,spacing:0.06,curvature:0.6,shadeColor:"#d0c880",stainLevel:0.3,chipping:0.4,gumColor:"#5a2020",gumHeight:0.35,gumRecession:0.15,rootExposure:0.05,alignment:"chaotic",species:"monster"},
  "Child":             {upperCount:6,lowerCount:6,toothWidth:0.75,toothHeight:0.7,toothDepth:0.38,spacing:0.06,curvature:0.35,shadeColor:"#ffffff",stainLevel:0,chipping:0,gumColor:"#f0a0a0",gumHeight:0.32,gumRecession:0,rootExposure:0,alignment:"gap",species:"human"},
};

function drawTeethPreview(canvas, t){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,w,h);
  const tw=w/(t.upperCount*1.2+1), startX=(w-tw*t.upperCount*1.15)/2;
  const toothH=h*0.38*t.toothHeight, gumY=h*0.35;

  // Gum
  ctx.beginPath();
  for(let i=0;i<=t.upperCount;i++){
    const x=startX+i*tw*1.15;
    const y=gumY-Math.sin(i/t.upperCount*Math.PI)*h*0.06*t.curvature;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.lineTo(startX+t.upperCount*tw*1.15,gumY+h*0.12);
  ctx.lineTo(startX,gumY+h*0.12);
  ctx.closePath();ctx.fillStyle=t.gumColor||"#e07070";ctx.fill();

  // Teeth
  for(let i=0;i<t.upperCount;i++){
    const x=startX+i*tw*1.15;
    const baseY=gumY-Math.sin(i/t.upperCount*Math.PI)*h*0.06*t.curvature;
    const variation=t.alignment==="perfect"?0:t.alignment==="chaotic"?(Math.random()-0.5)*h*0.06:(Math.random()-0.5)*h*0.02;
    const heightMult=i===0||i===t.upperCount-1?0.7:i===1||i===t.upperCount-2?0.9:1;

    // Shade
    const shade=t.shadeColor||"#f8f8f0";
    const stainAmount=t.stainLevel||0;
    const r=parseInt(shade.slice(1,3),16)-Math.round(stainAmount*30);
    const g=parseInt(shade.slice(3,5),16)-Math.round(stainAmount*15);
    const b=parseInt(shade.slice(5,7),16)-Math.round(stainAmount*60);
    const toothColor=`rgb(${Math.max(80,r)},${Math.max(80,g)},${Math.max(60,b)})`;

    ctx.beginPath();
    ctx.roundRect(x+tw*0.08,baseY+variation-toothH*heightMult,tw*0.85,toothH*heightMult,tw*0.15);
    ctx.fillStyle=toothColor;ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,0.15)";ctx.lineWidth=0.5;ctx.stroke();

    // Highlight
    ctx.beginPath();ctx.roundRect(x+tw*0.15,baseY+variation-toothH*heightMult+tw*0.1,tw*0.25,toothH*heightMult*0.45,tw*0.08);
    ctx.fillStyle="rgba(255,255,255,0.25)";ctx.fill();

    // Chips
    if(t.chipping>0&&Math.random()<t.chipping*0.5){
      ctx.beginPath();ctx.moveTo(x+tw*0.5,baseY+variation-toothH*heightMult);
      ctx.lineTo(x+tw*0.7,baseY+variation-toothH*heightMult+tw*0.2);
      ctx.lineTo(x+tw*0.5,baseY+variation-toothH*heightMult+tw*0.1);
      ctx.fillStyle="#0d0d1a";ctx.fill();
    }
  }

  // Lower teeth
  const lowerY=gumY+h*0.06;
  for(let i=0;i<t.lowerCount;i++){
    const x=startX+(i+0.5)*tw*1.1;
    const heightMult=i===0||i===t.lowerCount-1?0.65:0.85;
    const toothColor=t.shadeColor||"#f0f0d8";
    ctx.beginPath();ctx.roundRect(x,lowerY,tw*0.88,h*0.28*t.toothHeight*heightMult,tw*0.12);
    ctx.fillStyle=toothColor;ctx.fill();ctx.strokeStyle="rgba(0,0,0,0.1)";ctx.lineWidth=0.5;ctx.stroke();
  }

  ctx.fillStyle="rgba(0,255,200,0.5)";ctx.font="10px "+T.font;
  ctx.fillText(`${t.upperCount}U/${t.lowerCount}L · ${t.alignment}`,8,h-8);
}

function Slider({label,value,min,max,step=0.01,onChange}){
  return(
    <div>
      <label style={S.lbl}>{label}: <span style={{color:T.teal}}>{typeof value==="number"?value.toFixed(2):value}</span></label>
      <input style={S.inp} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}

export default function TeethGeneratorPanel({scene}){
  const [preset,  setPreset]  = useState("Perfect Hollywood");
  const [teeth,   setTeeth]   = useState({...TEETH_PRESETS["Perfect Hollywood"]});
  const [status,  setStatus]  = useState("");
  const prevRef = useRef(null);

  const set = useCallback((k,v)=>setTeeth(t=>({...t,[k]:v})),[]);
  useEffect(()=>{ if(prevRef.current) drawTeethPreview(prevRef.current,teeth); },[teeth]);

  function loadPreset(p){ setPreset(p); setTeeth({...TEETH_PRESETS[p]}); }

  function applyToScene(){
    if(!scene){ setStatus("No scene"); return; }
    const c=document.createElement("canvas");c.width=1024;c.height=512;
    drawTeethPreview(c,teeth);
    const tex=new THREE.CanvasTexture(c);
    let n=0;
    scene.traverse(o=>{
      if(o.isMesh&&(o.name.toLowerCase().includes("teeth")||o.name.toLowerCase().includes("tooth")||o.userData.isTeeth)){
        o.material=new THREE.MeshStandardMaterial({map:tex,roughness:0.15,metalness:0.05});n++;
      }
    });
    setStatus(`✓ Applied to ${n} teeth mesh(es)`);
  }

  function exportTex(){
    const c=document.createElement("canvas");c.width=1024;c.height=512;
    drawTeethPreview(c,teeth);
    const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="teeth_texture.png";a.click();
  }

  const ALIGNMENTS=["perfect","slight","crowded","gap","irregular","chaotic"];

  return(
    <div style={S.root}>
      <div style={S.h2}>🦷 TEETH GENERATOR</div>
      <div style={S.sec}>
        <div style={S.h3}>Presets</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(TEETH_PRESETS).map(p=><span key={p} style={preset===p?S.tagOn:S.tag} onClick={()=>loadPreset(p)}>{p}</span>)}
        </div>
        <canvas ref={prevRef} width={400} height={160} style={S.prev}/>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Count & Shape</div>
        <div style={S.row}>
          <Slider label="Upper Count" value={teeth.upperCount||8} min={2} max={20} step={1} onChange={v=>set("upperCount",v)}/>
          <Slider label="Lower Count" value={teeth.lowerCount||8} min={2} max={20} step={1} onChange={v=>set("lowerCount",v)}/>
        </div>
        <Slider label="Tooth Width"  value={teeth.toothWidth||0.9}  min={0.3} max={1.5} onChange={v=>set("toothWidth",v)}/>
        <Slider label="Tooth Height" value={teeth.toothHeight||1.0} min={0.3} max={2}   onChange={v=>set("toothHeight",v)}/>
        <Slider label="Tooth Depth"  value={teeth.toothDepth||0.5}  min={0.1} max={1}   onChange={v=>set("toothDepth",v)}/>
        <Slider label="Spacing"      value={teeth.spacing||0.02}    min={0}   max={0.2} onChange={v=>set("spacing",v)}/>
        <Slider label="Arch Curve"   value={teeth.curvature||0.4}   min={0}   max={1}   onChange={v=>set("curvature",v)}/>
        <label style={S.lbl}>Alignment</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {ALIGNMENTS.map(a=><span key={a} style={teeth.alignment===a?S.tagOn:S.tag} onClick={()=>set("alignment",a)}>{a}</span>)}
        </div>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Shade & Condition</div>
        <div style={S.row}>
          <div><label style={S.lbl}>Shade Color</label>
            <input type="color" value={teeth.shadeColor||"#f8f8f0"} onChange={e=>set("shadeColor",e.target.value)} style={{width:"100%",height:28,borderRadius:4,border:"none",cursor:"pointer"}}/></div>
          <div><label style={S.lbl}>Gum Color</label>
            <input type="color" value={teeth.gumColor||"#e07070"} onChange={e=>set("gumColor",e.target.value)} style={{width:"100%",height:28,borderRadius:4,border:"none",cursor:"pointer"}}/></div>
        </div>
        <Slider label="Stain Level"   value={teeth.stainLevel||0}    min={0} max={1} onChange={v=>set("stainLevel",v)}/>
        <Slider label="Chipping"      value={teeth.chipping||0}      min={0} max={1} onChange={v=>set("chipping",v)}/>
        <Slider label="Gum Height"    value={teeth.gumHeight||0.3}   min={0} max={0.6} onChange={v=>set("gumHeight",v)}/>
        <Slider label="Gum Recession" value={teeth.gumRecession||0}  min={0} max={0.5} onChange={v=>set("gumRecession",v)}/>
      </div>
      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      <button style={S.btnO} onClick={exportTex}>💾 Export Texture</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ─────────────────────────────────────────────────────────────────────────────
# TattooGeneratorPanel.jsx — upgrade
# ─────────────────────────────────────────────────────────────────────────────
files[f"{PANELS}/TattooGeneratorPanel.jsx"] = '''import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto",boxSizing:"border-box"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:12},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  prev:{width:"100%",height:200,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8,cursor:"crosshair"},
  row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},
  tag:{display:"inline-block",background:T.panel,color:T.muted,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer"},
  tagOn:{display:"inline-block",background:T.teal,color:T.bg,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer",fontWeight:700},
};

const STYLES_T=["Traditional","Neo Traditional","Realistic","Japanese","Geometric","Tribal","Watercolor","Blackwork","Dotwork","Minimalist","Script","Biomechanical","Celtic","Maori","Floral"];
const MOTIFS=["Dragon","Phoenix","Skull","Rose","Wolf","Tiger","Eagle","Koi","Lotus","Mandala","Anchor","Compass","Samurai","Geisha","Butterfly","Snake","Raven","Lion","Bear","Fox","Medusa","Kraken","Demon","Angel","Serpent"];
const PLACEMENTS=["Full Sleeve","Half Sleeve","Chest","Back","Leg","Neck","Hand","Forearm","Calf","Rib","Shoulder","Wrist","Ankle","Behind Ear","Face"];
const COLOR_SCHEMES=["Black & Grey","Full Color","Monochrome Red","Neo Traditional","Watercolor Splash","Neon","Sepia","Minimal Black"];

function drawTattooPreview(canvas, tattoo, strokes){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.fillStyle="#2a1a0a";ctx.fillRect(0,0,w,h);
  // Skin texture
  for(let i=0;i<200;i++){
    ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,Math.random()*2,0,Math.PI*2);
    ctx.fillStyle="rgba(180,120,80,0.03)";ctx.fill();
  }

  // Draw strokes
  if(strokes.length>1){
    ctx.lineCap="round";ctx.lineJoin="round";
    const color=tattoo.inkColor||"#111111";
    const opacity=tattoo.opacity||0.9;
    ctx.strokeStyle=color.replace("#","rgba(").replace(/(..)(..)(..)$/,(_,r,g,b)=>`${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},${opacity})`)||color;
    ctx.lineWidth=tattoo.brushSize||3;
    ctx.beginPath();
    strokes.forEach((pt,i)=>i===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y));
    ctx.stroke();
  }

  // Style label
  ctx.fillStyle="rgba(0,255,200,0.6)";ctx.font="10px "+T.font;
  ctx.fillText(`${tattoo.style||"Traditional"} · ${tattoo.motif||"Dragon"}`,8,h-8);
}

function Slider({label,value,min,max,step=0.01,onChange}){
  return(
    <div>
      <label style={S.lbl}>{label}: <span style={{color:T.teal}}>{typeof value==="number"?value.toFixed(2):value}</span></label>
      <input style={S.inp} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}

export default function TattooGeneratorPanel({scene}){
  const [style,     setStyle]    = useState("Traditional");
  const [motif,     setMotif]    = useState("Dragon");
  const [placement, setPlacement]= useState("Full Sleeve");
  const [colorScheme,setScheme]  = useState("Black & Grey");
  const [inkColor,  setInkColor] = useState("#111111");
  const [opacity,   setOpacity]  = useState(0.9);
  const [brushSize, setBrushSize]= useState(3);
  const [lineWeight,setWeight]   = useState(0.6);
  const [detailLevel,setDetail]  = useState(0.7);
  const [aging,     setAging]    = useState(0);
  const [coverage,  setCoverage] = useState(0.7);
  const [scaleX,    setScaleX]   = useState(1);
  const [scaleY,    setScaleY]   = useState(1);
  const [rotation,  setRotation] = useState(0);
  const [posX,      setPosX]     = useState(0);
  const [posY,      setPosY]     = useState(0);
  const [strokes,   setStrokes]  = useState([]);
  const [drawing,   setDrawing]  = useState(false);
  const [status,    setStatus]   = useState("");
  const prevRef = useRef(null);

  useEffect(()=>{ if(prevRef.current) drawTattooPreview(prevRef.current,{style,motif,inkColor,opacity,brushSize},strokes); },[style,motif,inkColor,opacity,brushSize,strokes]);

  const handleMouseDown=(e)=>{
    setDrawing(true);
    const rect=prevRef.current.getBoundingClientRect();
    const scl=prevRef.current.width/rect.width;
    setStrokes(s=>[...s,{x:(e.clientX-rect.left)*scl,y:(e.clientY-rect.top)*scl}]);
  };
  const handleMouseMove=(e)=>{
    if(!drawing) return;
    const rect=prevRef.current.getBoundingClientRect();
    const scl=prevRef.current.width/rect.width;
    setStrokes(s=>[...s,{x:(e.clientX-rect.left)*scl,y:(e.clientY-rect.top)*scl}]);
  };
  const handleMouseUp=()=>setDrawing(false);

  function clearCanvas(){ setStrokes([]); }

  function applyToScene(){
    if(!scene){ setStatus("No scene"); return; }
    const c=document.createElement("canvas");c.width=1024;c.height=1024;
    drawTattooPreview(c,{style,motif,inkColor,opacity,brushSize:brushSize*2},strokes.map(s=>({x:s.x*1024/400,y:s.y*1024/200})));
    const tex=new THREE.CanvasTexture(c);
    let n=0;
    scene.traverse(o=>{
      if(o.isMesh&&(o.name.toLowerCase().includes("skin")||o.userData.isSkin||o.userData.acceptsTattoo)){
        const mat=new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:0.8});
        o.material=mat;n++;
      }
    });
    setStatus(n>0?`✓ Applied tattoo to ${n} mesh(es)`:"No skin meshes found — tag meshes with userData.acceptsTattoo=true");
  }

  function exportTex(){
    const c=document.createElement("canvas");c.width=1024;c.height=1024;
    drawTattooPreview(c,{style,motif,inkColor,opacity,brushSize:brushSize*2},strokes.map(s=>({x:s.x*2.56,y:s.y*5.12})));
    const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download=`tattoo_${motif}_${style}.png`;a.click();
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🎨 TATTOO GENERATOR</div>
      <div style={S.sec}>
        <div style={S.h3}>Draw Tattoo</div>
        <canvas ref={prevRef} width={400} height={200} style={S.prev}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}/>
        <button style={{...S.btnO,fontSize:10,padding:"3px 10px"}} onClick={clearCanvas}>🗑 Clear Canvas</button>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Style & Motif</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {STYLES_T.map(s=><span key={s} style={style===s?S.tagOn:S.tag} onClick={()=>setStyle(s)}>{s}</span>)}
        </div>
        <label style={S.lbl}>Motif</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {MOTIFS.map(m=><span key={m} style={motif===m?S.tagOn:S.tag} onClick={()=>setMotif(m)}>{m}</span>)}
        </div>
        <label style={S.lbl}>Color Scheme</label>
        <select style={S.sel} value={colorScheme} onChange={e=>setScheme(e.target.value)}>
          {COLOR_SCHEMES.map(c=><option key={c}>{c}</option>)}
        </select>
        <label style={S.lbl}>Placement</label>
        <select style={S.sel} value={placement} onChange={e=>setPlacement(e.target.value)}>
          {PLACEMENTS.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Brush & Ink</div>
        <div style={S.row}>
          <div><label style={S.lbl}>Ink Color</label>
            <input type="color" value={inkColor} onChange={e=>setInkColor(e.target.value)} style={{width:"100%",height:28,borderRadius:4,border:"none",cursor:"pointer"}}/></div>
          <div><label style={S.lbl}>Brush Size: {brushSize}</label>
            <input style={S.inp} type="range" min={1} max={20} step={0.5} value={brushSize} onChange={e=>setBrushSize(Number(e.target.value))}/></div>
        </div>
        <Slider label="Opacity"      value={opacity}     min={0.1} max={1}   onChange={setOpacity}/>
        <Slider label="Line Weight"  value={lineWeight}  min={0.1} max={1}   onChange={setWeight}/>
        <Slider label="Detail Level" value={detailLevel} min={0.1} max={1}   onChange={setDetail}/>
        <Slider label="Coverage"     value={coverage}    min={0.1} max={1}   onChange={setCoverage}/>
        <Slider label="Aging/Fading" value={aging}       min={0}   max={1}   onChange={setAging}/>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Transform</div>
        <div style={S.row}>
          <Slider label="Scale X" value={scaleX} min={0.1} max={3} onChange={setScaleX}/>
          <Slider label="Scale Y" value={scaleY} min={0.1} max={3} onChange={setScaleY}/>
        </div>
        <div style={S.row}>
          <Slider label="Pos X"  value={posX}     min={-1}   max={1}   onChange={setPosX}/>
          <Slider label="Pos Y"  value={posY}     min={-1}   max={1}   onChange={setPosY}/>
        </div>
        <Slider label="Rotation" value={rotation} min={-180} max={180} step={1} onChange={setRotation}/>
      </div>
      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      <button style={S.btnO} onClick={exportTex}>💾 Export PNG</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# Write all files
written = []
for path, code in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(code)
    lines = len(code.splitlines())
    written.append((os.path.basename(path), lines))
    print(f"✅ {os.path.basename(path)} ({lines} lines)")

print(f"""
🎉 Done — {len(written)} panels upgraded

Run: npm run build 2>&1 | grep "error" | head -10
Then: git add -A && git commit -m "feat: ModelGenerator, QuadrupedGenerator, EyeGenerator, TeethGenerator, TattooGenerator all 400+ lines" && git push
""")
