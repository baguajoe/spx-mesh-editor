
import React, { useState } from "react";
import { PolyQualityBar, Q, estimateTris, formatTris } from './PolyQualityUtil';
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const BODY_PRESETS={
  "Slim":       {height:1.78,bodyMass:0.25,bodyFat:0.15,muscle:0.3,shoulderW:0.22,chestSz:0.3,waistSz:0.22,hipW:0.26,thighTk:0.28,armTk:0.22},
  "Athletic":   {height:1.8, bodyMass:0.6, bodyFat:0.12,muscle:0.7,shoulderW:0.28,chestSz:0.45,waistSz:0.26,hipW:0.28,thighTk:0.35,armTk:0.3},
  "Muscular":   {height:1.82,bodyMass:0.85,bodyFat:0.1, muscle:0.95,shoulderW:0.36,chestSz:0.6,waistSz:0.3,hipW:0.32,thighTk:0.45,armTk:0.42},
  "Curvy":      {height:1.68,bodyMass:0.5, bodyFat:0.4, muscle:0.4,shoulderW:0.25,chestSz:0.5,waistSz:0.28,hipW:0.42,thighTk:0.44,armTk:0.28},
  "Heavyset":   {height:1.72,bodyMass:0.9, bodyFat:0.65,muscle:0.4,shoulderW:0.34,chestSz:0.65,waistSz:0.48,hipW:0.5,thighTk:0.52,armTk:0.4},
  "Hero Build": {height:1.88,bodyMass:0.9, bodyFat:0.08,muscle:0.98,shoulderW:0.4, chestSz:0.68,waistSz:0.28,hipW:0.3,thighTk:0.46,armTk:0.45},
  "Elderly":    {height:1.65,bodyMass:0.35,bodyFat:0.35,muscle:0.25,shoulderW:0.22,chestSz:0.35,waistSz:0.35,hipW:0.3,thighTk:0.28,armTk:0.22},
  "Child":      {height:1.2, bodyMass:0.2, bodyFat:0.3, muscle:0.15,shoulderW:0.18,chestSz:0.22,waistSz:0.2,hipW:0.22,thighTk:0.22,armTk:0.18},
};

const CTRL=[
  {id:"height",    lbl:"Height (m)",    min:.8, max:3.0, step:.01},
  {id:"bodyMass",  lbl:"Body Mass",     min:0,  max:1,   step:.01},
  {id:"bodyFat",   lbl:"Body Fat",      min:0,  max:1,   step:.01},
  {id:"muscle",    lbl:"Muscle Mass",   min:0,  max:1,   step:.01},
  {id:"shoulderW", lbl:"Shoulder Width",min:.1, max:.6,  step:.01},
  {id:"chestSz",   lbl:"Chest Size",    min:.1, max:.9,  step:.01},
  {id:"waistSz",   lbl:"Waist Size",    min:.1, max:.7,  step:.01},
  {id:"hipW",      lbl:"Hip Width",     min:.1, max:.7,  step:.01},
  {id:"thighTk",   lbl:"Thigh Thickness",min:.1,max:.7,  step:.01},
  {id:"armTk",     lbl:"Arm Thickness", min:.1, max:.6,  step:.01},
];

export default function BodyGeneratorPanel({scene}){
  const [preset,setPreset]=useState("Athletic");
  const [quality, setQuality] = useState('Mid');
  const [body,setBody]=useState({...BODY_PRESETS["Athletic"]});
  const [age,setAge]=useState(25);
  const [genderBal,setGenderBal]=useState(0.5);
  const [status,setStatus]=useState("");
  const meshes=React.useRef([]);

  function loadPreset(p){setPreset(p);setBody({...BODY_PRESETS[p]});}

  function clear(){meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();});meshes.current=[];setStatus("");}

  function generate(){
    if(!scene){setStatus("No scene");return;}
    clear();
    const h=body.height, ms=[], mat=new THREE.MeshStandardMaterial({color:0xc8955a,roughness:0.6});
    const headH=h/7.5;
    const add=(geo,px,py,pz)=>{const m=new THREE.Mesh(geo,mat.clone());m.position.set(px,py,pz);m.castShadow=true;scene.add(m);ms.push(m);return m;};
    // Head
    add(new THREE.SphereGeometry(headH*.5,Q(quality).sphere,Q(quality).sphereH),0,h-headH*.5,0);
    // Torso
    const tw=body.shoulderW*2, tth=headH*2.2;
    add(new THREE.BoxGeometry(tw,tth,body.chestSz),0,h-headH-tth*.5,0);
    // Belly/waist
    const wh=headH*.8;
    add(new THREE.CylinderGeometry(body.waistSz*.9,body.waistSz,wh,Q(quality).cylinder),0,h-headH-tth-wh*.5,0);
    // Hips
    const hipH=headH*.6;
    add(new THREE.BoxGeometry(body.hipW*2,hipH,body.chestSz*.85+(genderBal*.15)),0,h-headH-tth-wh-hipH*.5,0);
    const hipY=h-headH-tth-wh-hipH;
    // Arms
    const armH=headH*2.5;
    [-1,1].forEach(s=>{
      add(new THREE.CylinderGeometry(body.armTk*.5,body.armTk*.45,armH*.55,Q(quality).cylinder),s*(tw*.5+body.armTk*.5),h-headH-armH*.15,0);
      add(new THREE.CylinderGeometry(body.armTk*.42,body.armTk*.35,armH*.45,Q(quality).cylinder),s*(tw*.5+body.armTk*.5),h-headH-armH*.15-armH*.45*.5-armH*.55*.5,0);
    });
    // Legs
    const legH=hipY*.5;
    [-1,1].forEach(s=>{
      add(new THREE.CylinderGeometry(body.thighTk*.55,body.thighTk*.45,legH,Q(quality).cylinder),s*body.hipW*.6,hipY-legH*.5,0);
      add(new THREE.CylinderGeometry(body.thighTk*.4,body.thighTk*.3,legH*.9,Q(quality).cylinder),s*body.hipW*.6,hipY-legH-legH*.9*.5,0);
      add(new THREE.BoxGeometry(body.thighTk*.7,.12,body.thighTk*1.2),s*body.hipW*.6,hipY-legH-legH*.9-.06,body.thighTk*.25);
    });
    // Lights
    if(!scene.getObjectByName("body_amb")){const a=new THREE.AmbientLight(0xffffff,.7);a.name="body_amb";scene.add(a);ms.push(a);const d=new THREE.DirectionalLight(0xffeedd,1);d.position.set(20,40,20);d.castShadow=true;scene.add(d);ms.push(d);}
    meshes.current=ms;
    setStatus(`✓ Body built — ${ms.filter(m=>m.isMesh).length} parts`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>💪 BODY GENERATOR</div>
      
      <PolyQualityBar quality={quality} onChange={setQuality}/>
<div style={S.sec}>
        <label style={S.lbl}>Body Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(BODY_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <label style={S.lbl}>Age: {age}</label>
        <input style={S.inp} type="range" min={1} max={90} value={age} onChange={e=>setAge(+e.target.value)}/>
        <label style={S.lbl}>Gender Balance — Masc ↔ Fem: {(genderBal*100).toFixed(0)}%</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={genderBal} onChange={e=>setGenderBal(+e.target.value)}/>
      </div>
      <div style={S.sec}>
        {CTRL.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {body[c.id]?.toFixed(2)}</label>
            <input style={S.inp} type="range" min={c.min} max={c.max} step={c.step} value={body[c.id]||0} onChange={e=>setBody(b=>({...b,[c.id]:+e.target.value}))}/>
          </div>
        ))}
      </div>
      <button style={S.btn} onClick={generate}>⚡ Generate Body</button>
      <button style={S.btnO} onClick={clear}>🗑 Clear</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
