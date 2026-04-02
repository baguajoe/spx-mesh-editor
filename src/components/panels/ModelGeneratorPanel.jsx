import React, { useState, useRef, useCallback } from "react";
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
