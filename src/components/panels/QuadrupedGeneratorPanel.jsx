
import React, { useState, useRef } from "react";
import { PolyQualityBar, Q, estimateTris, formatTris } from './PolyQualityUtil';
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const PRESETS = {
  "Dog/Wolf":    {bodyL:1.2,bodyW:0.45,bodyH:0.38,neckL:0.35,headSc:0.55,legL:0.55,legW:0.12,pawSz:0.14,tailL:0.7,tailCurve:0.4,earSz:0.18,earUp:true,snoutL:0.28,color:"#886644",furColor:"#aa8855"},
  "Cat":         {bodyL:0.9,bodyW:0.32,bodyH:0.28,neckL:0.25,headSc:0.45,legL:0.38,legW:0.09,pawSz:0.1,tailL:0.85,tailCurve:0.7,earSz:0.12,earUp:true,snoutL:0.14,color:"#aa8855",furColor:"#cc9966"},
  "Lion":        {bodyL:1.6,bodyW:0.65,bodyH:0.58,neckL:0.45,headSc:0.78,legL:0.65,legW:0.2,pawSz:0.22,tailL:0.9,tailCurve:0.2,earSz:0.14,earUp:true,snoutL:0.22,color:"#c8a050",furColor:"#d4aa55"},
  "Tiger":       {bodyL:1.7,bodyW:0.62,bodyH:0.55,neckL:0.4,headSc:0.75,legL:0.62,legW:0.22,pawSz:0.24,tailL:0.85,tailCurve:0.15,earSz:0.13,earUp:true,snoutL:0.24,color:"#c87830",furColor:"#dd9944"},
  "Horse":       {bodyL:2.2,bodyW:0.7,bodyH:0.75,neckL:0.9,headSc:0.7,legL:1.1,legW:0.18,pawSz:0.16,tailL:1.2,tailCurve:0.1,earSz:0.16,earUp:true,snoutL:0.42,color:"#885533",furColor:"#996644"},
  "Bear":        {bodyL:1.8,bodyW:0.9,bodyH:0.8,neckL:0.28,headSc:0.85,legL:0.55,legW:0.32,pawSz:0.35,tailL:0.1,tailCurve:0,earSz:0.16,earUp:true,snoutL:0.2,color:"#4a2c0a",furColor:"#5c3a18"},
  "Deer":        {bodyL:1.5,bodyW:0.45,bodyH:0.55,neckL:0.65,headSc:0.5,legL:0.9,legW:0.1,pawSz:0.1,tailL:0.2,tailCurve:0.1,earSz:0.22,earUp:true,snoutL:0.25,color:"#aa7744",furColor:"#bb8855"},
  "Elephant":    {bodyL:2.8,bodyW:1.4,bodyH:1.6,neckL:0.3,headSc:1.2,legL:0.9,legW:0.5,pawSz:0.45,tailL:0.6,tailCurve:0.05,earSz:0.7,earUp:false,snoutL:0.0,color:"#778888",furColor:"#889999"},
  "Crocodile":   {bodyL:2.5,bodyW:0.6,bodyH:0.22,neckL:0.35,headSc:0.65,legL:0.28,legW:0.18,pawSz:0.2,tailL:1.4,tailCurve:0.05,earSz:0.04,earUp:false,snoutL:0.55,color:"#3a5a32",furColor:"#2a4a22"},
  "Dinosaur":    {bodyL:3.0,bodyW:0.9,bodyH:1.0,neckL:0.8,headSc:0.9,legL:0.9,legW:0.35,pawSz:0.3,tailL:2.0,tailCurve:0.05,earSz:0.05,earUp:false,snoutL:0.45,color:"#556633",furColor:"#447722"},
};

function buildQuadruped(scene, cfg) {
  const ms = [];
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.color), roughness: 0.8 });
  const add = (geo, x, y, z, rx=0, ry=0, rz=0, m=mat) => {
    const mesh = new THREE.Mesh(geo, m.clone());
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    scene.add(mesh); ms.push(mesh); return mesh;
  };

  const bL=cfg.bodyL, bW=cfg.bodyW, bH=cfg.bodyH;
  const lL=cfg.legL, lW=cfg.legW;
  const baseY = lL + 0.1;

  // Body
  add(new THREE.BoxGeometry(bW, bH, bL), 0, baseY + bH/2, 0);
  // Neck
  const neckGeo = new THREE.CylinderGeometry(cfg.headSc*0.22, cfg.headSc*0.28, cfg.neckL,Q(quality).cylinder);
  add(neckGeo, 0, baseY+bH+cfg.neckL/2, bL/2-0.1, -0.3, 0, 0);
  // Head
  const headGeo = new THREE.BoxGeometry(cfg.headSc*0.7, cfg.headSc*0.6, cfg.headSc*0.85);
  add(headGeo, 0, baseY+bH+cfg.neckL+cfg.headSc*0.25, bL/2+cfg.headSc*0.1);
  // Snout
  if (cfg.snoutL > 0.05) {
    const snoutGeo = new THREE.BoxGeometry(cfg.headSc*0.4, cfg.headSc*0.28, cfg.snoutL);
    add(snoutGeo, 0, baseY+bH+cfg.neckL+cfg.headSc*0.05, bL/2+cfg.headSc*0.85/2+cfg.snoutL/2+0.05);
  }
  // Ears
  if (cfg.earSz > 0.05) {
    [-1,1].forEach(s => {
      const earGeo = new THREE.ConeGeometry(cfg.earSz*0.5, cfg.earSz,Q(quality).cone);
      const ey = cfg.earUp ? baseY+bH+cfg.neckL+cfg.headSc*0.55 : baseY+bH+cfg.neckL+cfg.headSc*0.3;
      const ez = cfg.earUp ? 0.1 : -0.1;
      add(earGeo, s*cfg.headSc*0.3, ey, bL/2+0.05+ez, cfg.earUp?0:Math.PI/2, 0, s*0.3);
    });
  }
  // 4 Legs
  [[-1,1],[-1,-1],[1,1],[1,-1]].forEach(([sx,sz]) => {
    const lgx = sx*bW/2*0.7, lgz = sz*bL/2*0.65;
    // Upper leg
    add(new THREE.CylinderGeometry(lW*0.9, lW*0.75, lL*0.55,Q(quality).cylinder), lgx, baseY-lL*0.55/2, lgz);
    // Lower leg
    add(new THREE.CylinderGeometry(lW*0.7, lW*0.55, lL*0.45,Q(quality).cylinder), lgx, baseY-lL*0.55-lL*0.45/2, lgz);
    // Paw
    add(new THREE.BoxGeometry(cfg.pawSz, cfg.pawSz*0.35, cfg.pawSz*1.1), lgx, 0.08, lgz+cfg.pawSz*0.1);
  });
  // Tail
  if (cfg.tailL > 0.08) {
    const tailSegs = 6;
    let tx=0, ty=baseY+bH*0.5, tz=-bL/2-0.05;
    for (let i=0; i<tailSegs; i++) {
      const r = cfg.tailL/tailSegs * (1-i/tailSegs*0.4);
      const tGeo = new THREE.SphereGeometry(Math.max(0.02, lW*0.5*(1-i/tailSegs*0.7)), 6, 4);
      add(tGeo, tx, ty, tz - r/2);
      tz -= r*0.9;
      ty += cfg.tailCurve * r;
    }
  }
  // Eyes
  const eyeGeo = new THREE.SphereGeometry(cfg.headSc*0.06,Q(quality).sphere,Q(quality).sphereH);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x224488, roughness: 0.05 });
  [-1,1].forEach(s => add(eyeGeo, s*cfg.headSc*0.22, baseY+bH+cfg.neckL+cfg.headSc*0.18, bL/2+cfg.headSc*0.75, 0,0,0, eyeMat));

  // Ground + lights
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.MeshStandardMaterial({color:0x0a0a14}));
  gnd.rotation.x=-Math.PI/2; scene.add(gnd); ms.push(gnd);
  if (!scene.getObjectByName("quad_amb")) {
    const a=new THREE.AmbientLight(0xffffff,.7);a.name="quad_amb";scene.add(a);ms.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1.1);d.position.set(20,30,15);d.castShadow=true;scene.add(d);ms.push(d);
  }
  return ms;
}

const CTRL = [
  {id:"bodyL",lbl:"Body Length",min:.3,max:4,step:.01},
  {id:"bodyW",lbl:"Body Width",min:.1,max:2,step:.01},
  {id:"bodyH",lbl:"Body Height",min:.1,max:2,step:.01},
  {id:"neckL",lbl:"Neck Length",min:.05,max:1.5,step:.01},
  {id:"headSc",lbl:"Head Scale",min:.2,max:1.5,step:.01},
  {id:"legL",lbl:"Leg Length",min:.1,max:2,step:.01},
  {id:"legW",lbl:"Leg Width",min:.04,max:.6,step:.01},
  {id:"pawSz",lbl:"Paw Size",min:.04,max:.6,step:.01},
  {id:"tailL",lbl:"Tail Length",min:0,max:2.5,step:.01},
  {id:"tailCurve",lbl:"Tail Curve",min:0,max:1,step:.01},
  {id:"earSz",lbl:"Ear Size",min:0,max:.8,step:.01},
  {id:"snoutL",lbl:"Snout Length",min:0,max:.8,step:.01},
];

export default function QuadrupedGeneratorPanel({ scene }) {
  const [preset, setPreset] = useState("Dog/Wolf");
  const [quality, setQuality] = useState('Mid');
  const [cfg, setCfg]       = useState({ ...PRESETS["Dog/Wolf"] });
  const [color, setColor]   = useState("#886644");
  const [status, setStatus] = useState("");
  const meshes = useRef([]);

  function loadPreset(p) { setPreset(p); setCfg({...PRESETS[p]}); setColor(PRESETS[p].color); }
  function clear() { meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();}); meshes.current=[]; setStatus(""); }
  function generate() {
    if (!scene) { setStatus("No scene"); return; }
    clear();
    const ms = buildQuadruped(scene, { ...cfg, color });
    meshes.current = ms;
    setStatus(`✓ ${preset} built — ${ms.filter(m=>m.isMesh).length} parts`);
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>🐾 QUADRUPED GENERATOR</div>
      
      <PolyQualityBar quality={quality} onChange={setQuality}/>
<div style={S.sec}>
        <label style={S.lbl}>Animal Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <label style={S.lbl}>Base Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={color} onChange={e=>setColor(e.target.value)}/>
      </div>
      <div style={S.sec}>
        {CTRL.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {cfg[c.id]?.toFixed(2)}</label>
            <input style={S.inp} type="range" min={c.min} max={c.max} step={c.step} value={cfg[c.id]||0} onChange={e=>setCfg(p=>({...p,[c.id]:+e.target.value}))}/>
          </div>
        ))}
      </div>
      <button style={S.btn} onClick={generate}>⚡ Generate</button>
      <button style={S.btnO} onClick={clear}>🗑 Clear</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
