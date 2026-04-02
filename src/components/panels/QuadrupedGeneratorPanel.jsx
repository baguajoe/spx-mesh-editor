import React, { useState, useCallback } from "react";
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
