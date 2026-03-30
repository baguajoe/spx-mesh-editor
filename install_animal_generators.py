#!/usr/bin/env python3
# Animal + Creature + Hybrid Generators + Base Model Starter Library
# python3 install_animal_generators.py && npm run build && git add -A && git commit -m "feat: Quadruped, Creature, Hybrid generators + Base Model Library" && git push
import os

REPO = "/workspaces/spx-mesh-editor"
P    = f"{REPO}/src/components/panels"
os.makedirs(P, exist_ok=True)

FILES = {}

# ════════════════════════════════════════════════════════════
# 1. QUADRUPED GENERATOR
# ════════════════════════════════════════════════════════════
FILES[f"{P}/QuadrupedGeneratorPanel.jsx"] = r"""
import React, { useState, useRef } from "react";
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
  const neckGeo = new THREE.CylinderGeometry(cfg.headSc*0.22, cfg.headSc*0.28, cfg.neckL, 8);
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
      const earGeo = new THREE.ConeGeometry(cfg.earSz*0.5, cfg.earSz, 5);
      const ey = cfg.earUp ? baseY+bH+cfg.neckL+cfg.headSc*0.55 : baseY+bH+cfg.neckL+cfg.headSc*0.3;
      const ez = cfg.earUp ? 0.1 : -0.1;
      add(earGeo, s*cfg.headSc*0.3, ey, bL/2+0.05+ez, cfg.earUp?0:Math.PI/2, 0, s*0.3);
    });
  }
  // 4 Legs
  [[-1,1],[-1,-1],[1,1],[1,-1]].forEach(([sx,sz]) => {
    const lgx = sx*bW/2*0.7, lgz = sz*bL/2*0.65;
    // Upper leg
    add(new THREE.CylinderGeometry(lW*0.9, lW*0.75, lL*0.55, 8), lgx, baseY-lL*0.55/2, lgz);
    // Lower leg
    add(new THREE.CylinderGeometry(lW*0.7, lW*0.55, lL*0.45, 8), lgx, baseY-lL*0.55-lL*0.45/2, lgz);
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
  const eyeGeo = new THREE.SphereGeometry(cfg.headSc*0.06, 6, 4);
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
"""

# ════════════════════════════════════════════════════════════
# 2. FANTASY CREATURE GENERATOR
# ════════════════════════════════════════════════════════════
FILES[f"{P}/CreatureGeneratorPanel.jsx"] = r"""
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const CREATURE_PRESETS = {
  "Dragon":       {bodyL:2.5,bodyW:.9,bodyH:.8,neckL:1.2,headSc:.9,legL:.7,legW:.25,tailL:2.2,tailCurve:.1,wingSpan:3.0,wingH:.9,hornLen:.45,hornCount:2,clawSz:.2,jawLen:.5,spineSpikes:true,color:"#8b1a1a",glowColor:"#ff4400",glow:true},
  "Drake (No Wings)":{bodyL:2.2,bodyW:.85,bodyH:.7,neckL:.9,headSc:.85,legL:.65,legW:.22,tailL:1.8,tailCurve:.08,wingSpan:0,wingH:0,hornLen:.35,hornCount:2,clawSz:.18,jawLen:.45,spineSpikes:true,color:"#2a5a22",glowColor:"#44ff44",glow:false},
  "Griffin":      {bodyL:1.8,bodyW:.7,bodyH:.65,neckL:.8,headSc:.7,legL:.65,legW:.2,tailL:.9,tailCurve:.3,wingSpan:2.5,wingH:.8,hornLen:0,hornCount:0,clawSz:.22,jawLen:.2,spineSpikes:false,color:"#c8a050",glowColor:"#ffdd00",glow:false},
  "Kaiju":        {bodyL:3.5,bodyW:1.5,bodyH:2.0,neckL:.6,headSc:1.3,legL:1.2,legW:.55,tailL:2.5,tailCurve:.05,wingSpan:0,wingH:0,hornLen:.6,hornCount:4,clawSz:.4,jawLen:.55,spineSpikes:true,color:"#1a3322",glowColor:"#00ff88",glow:true},
  "Demon Beast":  {bodyL:1.8,bodyW:.8,bodyH:.9,neckL:.5,headSc:.9,legL:.7,legW:.28,tailL:1.1,tailCurve:.2,wingSpan:2.0,wingH:.7,hornLen:.55,hornCount:2,clawSz:.25,jawLen:.4,spineSpikes:true,color:"#330000",glowColor:"#ff0000",glow:true},
  "Alien Creature":{bodyL:2.0,bodyW:.6,bodyH:.7,neckL:.7,headSc:.65,legL:.8,legW:.15,tailL:1.5,tailCurve:.3,wingSpan:0,wingH:0,hornLen:.3,hornCount:6,clawSz:.15,jawLen:.35,spineSpikes:false,color:"#224422",glowColor:"#00ffaa",glow:true},
  "Sea Monster":  {bodyL:3.0,bodyW:1.0,bodyH:.7,neckL:1.5,headSc:.8,legL:.35,legW:.3,tailL:2.8,tailCurve:.15,wingSpan:0,wingH:0,hornLen:.2,hornCount:3,clawSz:.2,jawLen:.5,spineSpikes:true,color:"#1a4a5a",glowColor:"#00aaff",glow:false},
  "Wyvern":       {bodyL:2.0,bodyW:.7,bodyH:.65,neckL:.9,headSc:.75,legL:.55,legW:.2,tailL:1.6,tailCurve:.1,wingSpan:2.8,wingH:1.0,hornLen:.3,hornCount:1,clawSz:.2,jawLen:.42,spineSpikes:false,color:"#553311",glowColor:"#ff6600",glow:false},
};

function buildCreature(scene, cfg) {
  const ms = [];
  const col = new THREE.Color(cfg.color);
  const mat = new THREE.MeshStandardMaterial({color:col, roughness:.7, metalness:.1,
    emissive: cfg.glow ? new THREE.Color(cfg.glowColor) : new THREE.Color(0), emissiveIntensity: cfg.glow?.3:0});
  const add = (geo, x, y, z, rx=0,ry=0,rz=0) => {
    const m=new THREE.Mesh(geo,mat.clone()); m.position.set(x,y,z); m.rotation.set(rx,ry,rz); m.castShadow=true; scene.add(m); ms.push(m); return m;
  };

  const baseY = cfg.legL + .15;
  // Body
  add(new THREE.BoxGeometry(cfg.bodyW, cfg.bodyH, cfg.bodyL), 0, baseY+cfg.bodyH/2, 0);
  // Neck + head
  add(new THREE.CylinderGeometry(cfg.headSc*.25, cfg.headSc*.32, cfg.neckL, 8), 0, baseY+cfg.bodyH+cfg.neckL/2, cfg.bodyL/2-.1, -.35,0,0);
  add(new THREE.BoxGeometry(cfg.headSc*.8, cfg.headSc*.65, cfg.headSc*(1+cfg.jawLen)), 0, baseY+cfg.bodyH+cfg.neckL+cfg.headSc*.28, cfg.bodyL/2+cfg.headSc*.1);
  // Lower jaw
  add(new THREE.BoxGeometry(cfg.headSc*.7, cfg.headSc*.2, cfg.headSc*cfg.jawLen*.8), 0, baseY+cfg.bodyH+cfg.neckL+cfg.headSc*.02, cfg.bodyL/2+cfg.headSc*.5+cfg.headSc*cfg.jawLen*.1);

  // Horns
  for(let h=0;h<cfg.hornCount;h++){
    const angle = cfg.hornCount>1 ? (h/(cfg.hornCount-1)-.5)*Math.PI*.6 : 0;
    const hx=Math.sin(angle)*cfg.headSc*.3, hz=Math.cos(angle)*cfg.headSc*.1;
    add(new THREE.ConeGeometry(cfg.headSc*.07, cfg.hornLen, 5), hx, baseY+cfg.bodyH+cfg.neckL+cfg.headSc*.7, cfg.bodyL/2+hz, 0,angle,.2*Math.sign(hx||1));
  }

  // 4 Legs with claws
  [[-1,1],[-1,-1],[1,1],[1,-1]].forEach(([sx,sz])=>{
    const lx=sx*cfg.bodyW/2*.75, lz=sz*cfg.bodyL/2*.6;
    add(new THREE.CylinderGeometry(cfg.legW*.9,cfg.legW*.7,cfg.legL*.55,8),lx,baseY-cfg.legL*.55/2,lz);
    add(new THREE.CylinderGeometry(cfg.legW*.7,cfg.legW*.5,cfg.legL*.45,8),lx,baseY-cfg.legL*.55-cfg.legL*.45/2,lz);
    // Claws
    for(let c=0;c<3;c++){
      const ca=(c-1)*.35;
      add(new THREE.ConeGeometry(cfg.clawSz*.2,cfg.clawSz,4),lx+Math.sin(ca)*cfg.clawSz*.5,.08,lz+Math.cos(ca)*cfg.clawSz*.5+cfg.clawSz*.3,.8,ca,0);
    }
  });

  // Tail
  let tx=0,ty=baseY+cfg.bodyH*.4,tz=-cfg.bodyL/2;
  for(let i=0;i<8;i++){
    const r=cfg.tailL/8*(1-i/8*.5);
    add(new THREE.SphereGeometry(Math.max(.03,cfg.bodyW*.22*(1-i/8*.6)),7,5),tx,ty,tz-r*.5);
    tz-=r*.85; ty+=cfg.tailCurve*r;
  }
  if(cfg.spineSpikes){
    for(let i=0;i<6;i++){
      const sz=-cfg.bodyL/2+i*(cfg.bodyL/5);
      add(new THREE.ConeGeometry(cfg.bodyW*.06,cfg.bodyH*.35+i*.02,4),0,baseY+cfg.bodyH+cfg.bodyH*.15,sz,.2,0,0);
    }
  }

  // Wings
  if(cfg.wingSpan>0){
    [-1,1].forEach(s=>{
      // Wing membrane (flat triangular shape)
      const wGeo=new THREE.BufferGeometry();
      const ws=s*cfg.wingSpan*.5, wh=cfg.wingH;
      const verts=new Float32Array([
        0,0,0, ws,wh*.3,-cfg.bodyL*.1, ws*.5,-wh*.1,-cfg.bodyL*.4,
        0,0,0, ws*.5,-wh*.1,-cfg.bodyL*.4, 0,-wh*.05,-cfg.bodyL*.3,
      ]);
      wGeo.setAttribute("position",new THREE.BufferAttribute(verts,3));
      wGeo.computeVertexNormals();
      const wm=new THREE.Mesh(wGeo,new THREE.MeshStandardMaterial({color:col,side:THREE.DoubleSide,transparent:true,opacity:.75,roughness:.6}));
      wm.position.set(s*cfg.bodyW*.45,baseY+cfg.bodyH*.6,cfg.bodyL*.1);
      scene.add(wm); ms.push(wm);
      // Wing arm bone
      add(new THREE.CylinderGeometry(.04,.06,cfg.wingSpan*.5,6),s*cfg.bodyW*.3+s*cfg.wingSpan*.25,baseY+cfg.bodyH*.7,0,0,0,Math.PI/2);
    });
  }

  // Lights
  if(!scene.getObjectByName("cre_amb")){
    const a=new THREE.AmbientLight(0xffffff,.6);a.name="cre_amb";scene.add(a);ms.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1.1);d.position.set(20,40,20);d.castShadow=true;scene.add(d);ms.push(d);
    if(cfg.glow){const pl=new THREE.PointLight(new THREE.Color(cfg.glowColor),.8,8);pl.position.set(0,baseY+cfg.bodyH+cfg.neckL,cfg.bodyL/2+cfg.headSc*.5);scene.add(pl);ms.push(pl);}
  }

  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0x0a0a14}));
  gnd.rotation.x=-Math.PI/2; scene.add(gnd); ms.push(gnd);
  return ms;
}

const CTRL=[
  {id:"bodyL",lbl:"Body Length",min:.5,max:5,step:.01},{id:"bodyW",lbl:"Body Width",min:.2,max:2.5,step:.01},
  {id:"bodyH",lbl:"Body Height",min:.2,max:3,step:.01},{id:"neckL",lbl:"Neck Length",min:.1,max:2,step:.01},
  {id:"headSc",lbl:"Head Scale",min:.2,max:1.8,step:.01},{id:"legL",lbl:"Leg Length",min:.1,max:2,step:.01},
  {id:"legW",lbl:"Leg Width",min:.05,max:.7,step:.01},{id:"tailL",lbl:"Tail Length",min:0,max:3.5,step:.01},
  {id:"tailCurve",lbl:"Tail Curve",min:0,max:.5,step:.01},{id:"wingSpan",lbl:"Wing Span",min:0,max:5,step:.05},
  {id:"wingH",lbl:"Wing Height",min:0,max:2,step:.01},{id:"hornLen",lbl:"Horn Length",min:0,max:1.2,step:.01},
  {id:"hornCount",lbl:"Horn Count",min:0,max:8,step:1},{id:"clawSz",lbl:"Claw Size",min:.05,max:.6,step:.01},
  {id:"jawLen",lbl:"Jaw Length",min:.1,max:1,step:.01},
];

export default function CreatureGeneratorPanel({ scene }) {
  const [preset, setPreset] = useState("Dragon");
  const [cfg, setCfg]       = useState({ ...CREATURE_PRESETS["Dragon"] });
  const [color, setColor]   = useState("#8b1a1a");
  const [glowColor, setGlowColor] = useState("#ff4400");
  const [glow, setGlow]     = useState(true);
  const [spines, setSpines] = useState(true);
  const [status, setStatus] = useState("");
  const meshes = useRef([]);

  function loadPreset(p){ setPreset(p); const pr=CREATURE_PRESETS[p]; setCfg({...pr}); setColor(pr.color); setGlowColor(pr.glowColor||"#ff4400"); setGlow(pr.glow||false); setSpines(pr.spineSpikes||false); }
  function clear(){ meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();}); meshes.current=[]; setStatus(""); }
  function generate(){
    if(!scene){setStatus("No scene");return;}
    clear();
    const ms=buildCreature(scene,{...cfg,color,glowColor,glow,spineSpikes:spines});
    meshes.current=ms;
    setStatus(`✓ ${preset} built — ${ms.filter(m=>m.isMesh).length} parts`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🐉 CREATURE GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Creature Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(CREATURE_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <div style={{display:"flex",gap:12,marginBottom:8}}>
          <div><label style={S.lbl}>Body Color</label><input style={{...S.inp,padding:2,height:32,width:60}} type="color" value={color} onChange={e=>setColor(e.target.value)}/></div>
          <div><label style={S.lbl}>Glow Color</label><input style={{...S.inp,padding:2,height:32,width:60}} type="color" value={glowColor} onChange={e=>setGlowColor(e.target.value)}/></div>
        </div>
        <label style={S.lbl}><input type="checkbox" checked={glow} onChange={e=>setGlow(e.target.checked)}/> Bioluminescent Glow</label>
        <label style={S.lbl}><input type="checkbox" checked={spines} onChange={e=>setSpines(e.target.checked)}/> Spine Spikes</label>
      </div>
      <div style={S.sec}>
        {CTRL.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {typeof cfg[c.id]==="number"?cfg[c.id].toFixed(c.step<.1?2:0):""}</label>
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
"""

# ════════════════════════════════════════════════════════════
# 3. HYBRID GENERATOR
# ════════════════════════════════════════════════════════════
FILES[f"{P}/HybridGeneratorPanel.jsx"] = r"""
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const HYBRID_PRESETS = {
  "Werewolf":       {humanRatio:.45,creatureType:"Wolf",height:2.1,shoulderW:.55,headMix:.7,handMix:.8,legMix:.75,tailLen:.8,tailCurve:.2,hornLen:0,wingSpan:0,clawSz:.22,furAmt:.85,scaleAmt:0,color:"#5a3a22",glowColor:"#ff4400",glow:false},
  "Dragon Humanoid":{humanRatio:.55,creatureType:"Dragon",height:2.2,shoulderW:.5,headMix:.6,handMix:.5,legMix:.55,tailLen:1.4,tailCurve:.08,hornLen:.4,wingSpan:1.8,clawSz:.2,furAmt:0,scaleAmt:.9,color:"#8b1a1a",glowColor:"#ff4400",glow:true},
  "Demon Beast":    {humanRatio:.6,creatureType:"Demon",height:2.3,shoulderW:.58,headMix:.65,handMix:.55,legMix:.5,tailLen:.9,tailCurve:.15,hornLen:.5,wingSpan:1.5,clawSz:.18,furAmt:.2,scaleAmt:.4,color:"#330000",glowColor:"#ff0000",glow:true},
  "Lizard Man":     {humanRatio:.65,creatureType:"Reptile",height:1.9,shoulderW:.44,headMix:.55,handMix:.45,legMix:.45,tailLen:1.0,tailCurve:.06,hornLen:.15,wingSpan:0,clawSz:.16,furAmt:0,scaleAmt:.95,color:"#2a5a22",glowColor:"#44ff44",glow:false},
  "Minotaur":       {humanRatio:.5,creatureType:"Bull",height:2.5,shoulderW:.7,headMix:.8,handMix:.3,legMix:.6,tailLen:.6,tailCurve:.1,hornLen:.7,wingSpan:0,clawSz:.12,furAmt:.5,scaleAmt:0,color:"#5c3a18",glowColor:"#ff6600",glow:false},
  "Vampire Lord":   {humanRatio:.82,creatureType:"Bat",height:1.95,shoulderW:.44,headMix:.3,handMix:.2,legMix:.15,tailLen:0,tailCurve:0,hornLen:.05,wingSpan:2.2,clawSz:.12,furAmt:0,scaleAmt:0,color:"#1a0a0a",glowColor:"#ff0033",glow:true},
  "Harpy":          {humanRatio:.6,creatureType:"Bird",height:1.8,shoulderW:.42,headMix:.35,handMix:.9,legMix:.55,tailLen:.5,tailCurve:.2,hornLen:0,wingSpan:2.5,clawSz:.2,furAmt:0,scaleAmt:.2,color:"#aa8833",glowColor:"#ffdd00",glow:false},
  "Naga":           {humanRatio:.55,creatureType:"Serpent",height:2.0,shoulderW:.4,headMix:.5,handMix:.3,legMix:.0,tailLen:2.5,tailCurve:.1,hornLen:.1,wingSpan:0,clawSz:.1,furAmt:0,scaleAmt:.9,color:"#1a5a3a",glowColor:"#00ffaa",glow:false},
};

function buildHybrid(scene, cfg) {
  const ms=[];
  const col=new THREE.Color(cfg.color);
  const mat=new THREE.MeshStandardMaterial({color:col,roughness:.65,metalness:.1,
    emissive:cfg.glow?new THREE.Color(cfg.glowColor):new THREE.Color(0),emissiveIntensity:cfg.glow?.35:0});
  const add=(geo,x,y,z,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,mat.clone());m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;scene.add(m);ms.push(m);return m;
  };
  const h=cfg.height, hr=cfg.humanRatio;
  const headH=h/7.5, sw=cfg.shoulderW;

  // More human = taller upright torso
  const torsoH=headH*2.2, hipH=headH*.6;
  const legH=cfg.legMix>0.3 ? h*.38*(1+cfg.legMix*.3) : h*.3;
  const baseY=legH+.1;

  // Head (mix of human and creature)
  const hsx=1+cfg.headMix*.3, hsy=1-cfg.headMix*.15, hsz=1+cfg.headMix*.2;
  add(new THREE.BoxGeometry(headH*.8*hsx,headH*.85*hsy,headH*.9*hsz),0,baseY+torsoH+hipH+headH*.4,0);
  // Horns
  if(cfg.hornLen>.05){
    [-1,1].forEach(s=>add(new THREE.ConeGeometry(headH*.08,cfg.hornLen,4),s*headH*.25,baseY+torsoH+hipH+headH*.85,0,0,0,s*.3));
  }
  // Neck
  add(new THREE.CylinderGeometry(headH*.2,headH*.25,headH*.4,8),0,baseY+torsoH+hipH+headH*.15,0);
  // Torso
  add(new THREE.BoxGeometry(sw*2,torsoH,headH*.75),0,baseY+torsoH/2,0);
  // Hips
  add(new THREE.BoxGeometry(sw*1.6,hipH,headH*.65),0,baseY+torsoH+hipH/2-torsoH+torsoH/2,0);

  // Arms — more creature = claws/wings
  [-1,1].forEach(s=>{
    const ax=s*(sw+headH*.15), ay=baseY+torsoH*.78;
    const armW=headH*(cfg.handMix>.5?.28:.2);
    add(new THREE.CylinderGeometry(armW,armW*.85,headH*1.3,8),ax,ay,0);
    add(new THREE.CylinderGeometry(armW*.8,armW*.6,headH*1.1,8),ax,ay-headH*1.3,0);
    // Claws or hands
    if(cfg.clawSz>.1){
      for(let c=0;c<3;c++){const ca=(c-1)*.3; add(new THREE.ConeGeometry(cfg.clawSz*.15,cfg.clawSz*.7,4),ax+Math.sin(ca)*cfg.clawSz*.3,ay-headH*2.5,Math.cos(ca)*cfg.clawSz*.2,.8,ca,0);}
    } else {
      add(new THREE.BoxGeometry(headH*.3,headH*.38,headH*.18),ax,ay-headH*2.55,0);
    }
  });

  // Legs — mix determines shape
  const hipY=baseY;
  [-1,1].forEach(s=>{
    const lx=s*sw*.55;
    if(cfg.legMix<.3){
      // Normal human legs
      add(new THREE.CylinderGeometry(headH*.28,headH*.24,legH*.5,8),lx,hipY-legH*.25,0);
      add(new THREE.CylinderGeometry(headH*.22,headH*.18,legH*.5,8),lx,hipY-legH*.75,0);
      add(new THREE.BoxGeometry(headH*.38,.12,headH*.55),lx,.06,headH*.12);
    } else {
      // Creature digitigrade legs
      add(new THREE.CylinderGeometry(headH*.3,headH*.25,legH*.4,8),lx,hipY-legH*.2,0);
      add(new THREE.CylinderGeometry(headH*.22,headH*.18,legH*.35,8),lx,hipY-legH*.55,.15,-.4,0,0);
      add(new THREE.CylinderGeometry(headH*.18,headH*.14,legH*.25,8),lx,hipY-legH*.85,.3,.5,0,0);
      add(new THREE.BoxGeometry(headH*.35,.1,headH*.5*(1+cfg.legMix)),lx,.05,headH*.15);
    }
  });

  // Tail
  if(cfg.tailLen>.1){
    let tx=0,ty=baseY-.1,tz=-.3;
    for(let i=0;i<7;i++){
      const r=cfg.tailLen/7*(1-i/7*.4);
      add(new THREE.SphereGeometry(Math.max(.03,sw*.18*(1-i/7*.5)),6,4),tx,ty,tz-r*.5);
      tz-=r*.8; ty+=cfg.tailCurve*r;
    }
  }

  // Wings
  if(cfg.wingSpan>.1){
    [-1,1].forEach(s=>{
      const ws=s*cfg.wingSpan*.5;
      const wGeo=new THREE.BufferGeometry();
      const verts=new Float32Array([0,0,0, ws,.3*cfg.wingSpan*.2,-.1, ws*.4,-.1,-.5, 0,0,0, ws*.4,-.1,-.5, 0,-.05,-.4]);
      wGeo.setAttribute("position",new THREE.BufferAttribute(verts,3));
      wGeo.computeVertexNormals();
      const wm=new THREE.Mesh(wGeo,new THREE.MeshStandardMaterial({color:col,side:THREE.DoubleSide,transparent:true,opacity:.7}));
      wm.position.set(s*sw*.4,baseY+torsoH*.7,0);
      scene.add(wm);ms.push(wm);
    });
  }

  // Ground + lights
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshStandardMaterial({color:0x0a0a14}));
  gnd.rotation.x=-Math.PI/2;scene.add(gnd);ms.push(gnd);
  if(!scene.getObjectByName("hyb_amb")){
    const a=new THREE.AmbientLight(0xffffff,.65);a.name="hyb_amb";scene.add(a);ms.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1.1);d.position.set(20,35,15);d.castShadow=true;scene.add(d);ms.push(d);
    if(cfg.glow){const pl=new THREE.PointLight(new THREE.Color(cfg.glowColor),.7,6);pl.position.set(0,baseY+torsoH+headH,.3);scene.add(pl);ms.push(pl);}
  }
  return ms;
}

const CTRL=[
  {id:"humanRatio",lbl:"Human ↔ Creature",min:0,max:1,step:.01},
  {id:"height",lbl:"Height",min:.8,max:3.5,step:.01},
  {id:"shoulderW",lbl:"Shoulder Width",min:.2,max:.9,step:.01},
  {id:"headMix",lbl:"Head Creature Mix",min:0,max:1,step:.01},
  {id:"handMix",lbl:"Hand Creature Mix",min:0,max:1,step:.01},
  {id:"legMix",lbl:"Leg Creature Mix",min:0,max:1,step:.01},
  {id:"tailLen",lbl:"Tail Length",min:0,max:3,step:.01},
  {id:"tailCurve",lbl:"Tail Curve",min:0,max:.5,step:.01},
  {id:"hornLen",lbl:"Horn Length",min:0,max:1,step:.01},
  {id:"wingSpan",lbl:"Wing Span",min:0,max:4,step:.05},
  {id:"clawSz",lbl:"Claw Size",min:0,max:.5,step:.01},
  {id:"furAmt",lbl:"Fur Amount",min:0,max:1,step:.01},
  {id:"scaleAmt",lbl:"Scale Amount",min:0,max:1,step:.01},
];

export default function HybridGeneratorPanel({ scene }) {
  const [preset,setPreset]=useState("Werewolf");
  const [cfg,setCfg]=useState({...HYBRID_PRESETS["Werewolf"]});
  const [color,setColor]=useState("#5a3a22");
  const [glowColor,setGlowColor]=useState("#ff4400");
  const [glow,setGlow]=useState(false);
  const [status,setStatus]=useState("");
  const meshes=useRef([]);

  function loadPreset(p){setPreset(p);const pr=HYBRID_PRESETS[p];setCfg({...pr});setColor(pr.color);setGlowColor(pr.glowColor||"#ff4400");setGlow(pr.glow||false);}
  function clear(){meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();});meshes.current=[];setStatus("");}
  function generate(){
    if(!scene){setStatus("No scene");return;}
    clear();
    const ms=buildHybrid(scene,{...cfg,color,glowColor,glow});
    meshes.current=ms;
    setStatus(`✓ ${preset} built — ${ms.filter(m=>m.isMesh).length} parts`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🧬 HYBRID GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Hybrid Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(HYBRID_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <div style={{display:"flex",gap:12,marginBottom:8}}>
          <div><label style={S.lbl}>Body Color</label><input style={{...S.inp,padding:2,height:32,width:60}} type="color" value={color} onChange={e=>setColor(e.target.value)}/></div>
          <div><label style={S.lbl}>Glow Color</label><input style={{...S.inp,padding:2,height:32,width:60}} type="color" value={glowColor} onChange={e=>setGlowColor(e.target.value)}/></div>
        </div>
        <label style={S.lbl}><input type="checkbox" checked={glow} onChange={e=>setGlow(e.target.checked)}/> Bioluminescent Glow</label>
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
"""

# ════════════════════════════════════════════════════════════
# 4. BASE MODEL STARTER LIBRARY
# ════════════════════════════════════════════════════════════
FILES[f"{P}/BaseModelLibraryPanel.jsx"] = r"""
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},card:{background:"#06060f",border:"1px solid #1a1a2e",borderRadius:6,padding:10,marginBottom:8,cursor:"pointer",transition:"border-color .15s"},cardH:{color:T.teal,fontSize:12,fontWeight:700,marginBottom:2},cardD:{fontSize:10,color:"#888",lineHeight:1.5},badge:{display:"inline-block",background:"#1a1a2e",color:T.orange,fontSize:9,padding:"1px 5px",borderRadius:3,marginRight:4,marginTop:3}};

const CATEGORIES = [
  {
    label:"🧍 Humanoid",
    models:[
      {id:"human_neutral",  name:"Human Neutral",    desc:"Gender-neutral bipedal base. Animation-ready topology.",         tags:["biped","animation","rigging"]},
      {id:"human_male",     name:"Human Male",        desc:"Masculine proportions. 8-head heroic ratio.",                    tags:["biped","male","hero"]},
      {id:"human_female",   name:"Human Female",      desc:"Feminine proportions. Realistic ratio.",                         tags:["biped","female","realistic"]},
      {id:"human_child",    name:"Child",             desc:"4-head ratio. Large head, short limbs.",                         tags:["biped","child","chibi-adjacent"]},
      {id:"human_elder",    name:"Elder",             desc:"Aged proportions. Slight stoop, thinner limbs.",                 tags:["biped","elder","aged"]},
      {id:"human_hero",     name:"Hero Build",        desc:"Exaggerated heroic. Wide shoulders, narrow waist.",             tags:["biped","hero","stylized"]},
      {id:"human_heavyset", name:"Heavyset",          desc:"Full-figured proportions. Grounded, solid build.",              tags:["biped","heavyset","realistic"]},
      {id:"human_athletic", name:"Athletic",          desc:"Lean, muscular. Runner/fighter proportions.",                    tags:["biped","athletic","fit"]},
    ]
  },
  {
    label:"🐾 Quadruped",
    models:[
      {id:"quad_canine",    name:"Canine Base",       desc:"Dog/wolf proportions. 4-legged, medium build.",                 tags:["quad","animal","canine"]},
      {id:"quad_feline",    name:"Feline Base",       desc:"Cat/lion proportions. Lithe, flexible spine.",                  tags:["quad","animal","feline"]},
      {id:"quad_equine",    name:"Equine Base",       desc:"Horse proportions. Long legs, deep chest.",                     tags:["quad","animal","horse"]},
      {id:"quad_reptile",   name:"Reptile Base",      desc:"Crocodile/lizard. Low body, long tail, short legs.",            tags:["quad","reptile","low"]},
      {id:"quad_heavy",     name:"Heavy Beast",       desc:"Bear/rhino proportions. Massive, stocky.",                      tags:["quad","animal","heavy"]},
    ]
  },
  {
    label:"🐉 Creature",
    models:[
      {id:"cre_dragon",     name:"Dragon Base",       desc:"Winged, 4-legged dragon. Long neck and tail.",                  tags:["creature","dragon","wings"]},
      {id:"cre_wyvern",     name:"Wyvern Base",       desc:"2-legged dragon with wings. Smaller than dragon.",              tags:["creature","wyvern","wings"]},
      {id:"cre_kaiju",      name:"Kaiju Base",        desc:"Massive bipedal monster. Thick, heavy proportions.",            tags:["creature","kaiju","giant"]},
      {id:"cre_serpent",    name:"Serpent/Naga",      desc:"Long body, no legs. Coiled or extended pose.",                  tags:["creature","serpent","naga"]},
    ]
  },
  {
    label:"🧬 Hybrid",
    models:[
      {id:"hyb_werewolf",   name:"Werewolf Base",     desc:"60% human, 40% wolf. Digitigrade legs, muzzle.",               tags:["hybrid","werewolf","wolf"]},
      {id:"hyb_dragonman",  name:"Dragon Humanoid",   desc:"Bipedal dragon. Tail, wings, horns, scales.",                  tags:["hybrid","dragon","humanoid"]},
      {id:"hyb_demon",      name:"Demon Humanoid",    desc:"Human with wings, horns, and tail. Dark fantasy.",             tags:["hybrid","demon","dark"]},
      {id:"hyb_lizardman",  name:"Lizard Man",        desc:"Reptile humanoid. Scales, claws, digitigrade legs.",            tags:["hybrid","lizard","reptile"]},
    ]
  },
];

// Maps model IDs to generator panel + preset to launch
const MODEL_ROUTES = {
  "human_neutral":  {panel:"ModelGenerator",   preset:"Realistic Human",   gender:"Neutral/Androgynous"},
  "human_male":     {panel:"ModelGenerator",   preset:"Realistic Human",   gender:"Masculine"},
  "human_female":   {panel:"ModelGenerator",   preset:"Realistic Human",   gender:"Feminine"},
  "human_child":    {panel:"BodyGenerator",    preset:"Child"},
  "human_elder":    {panel:"BodyGenerator",    preset:"Elderly"},
  "human_hero":     {panel:"ModelGenerator",   preset:"Hero/Superhero",    gender:"Masculine"},
  "human_heavyset": {panel:"BodyGenerator",    preset:"Heavyset"},
  "human_athletic": {panel:"BodyGenerator",    preset:"Athletic"},
  "quad_canine":    {panel:"QuadrupedGenerator",preset:"Dog/Wolf"},
  "quad_feline":    {panel:"QuadrupedGenerator",preset:"Cat"},
  "quad_equine":    {panel:"QuadrupedGenerator",preset:"Horse"},
  "quad_reptile":   {panel:"QuadrupedGenerator",preset:"Crocodile"},
  "quad_heavy":     {panel:"QuadrupedGenerator",preset:"Bear"},
  "cre_dragon":     {panel:"CreatureGenerator", preset:"Dragon"},
  "cre_wyvern":     {panel:"CreatureGenerator", preset:"Wyvern"},
  "cre_kaiju":      {panel:"CreatureGenerator", preset:"Kaiju"},
  "cre_serpent":    {panel:"HybridGenerator",   preset:"Naga"},
  "hyb_werewolf":   {panel:"HybridGenerator",   preset:"Werewolf"},
  "hyb_dragonman":  {panel:"HybridGenerator",   preset:"Dragon Humanoid"},
  "hyb_demon":      {panel:"HybridGenerator",   preset:"Demon Beast"},
  "hyb_lizardman":  {panel:"HybridGenerator",   preset:"Lizard Man"},
};

function buildQuickMesh(scene, id) {
  // Lightweight placeholder mesh so user sees something immediately
  // Full model built when they open the specific generator
  const mat = new THREE.MeshStandardMaterial({color:0x00ffc8,roughness:.7,wireframe:false});
  const meshes = [];
  const add=(geo,x,y,z)=>{const m=new THREE.Mesh(geo,mat.clone());m.position.set(x,y,z);m.castShadow=true;scene.add(m);meshes.push(m);};

  if(id.startsWith("human")||id.startsWith("hyb")){
    // Simple humanoid T-pose
    add(new THREE.SphereGeometry(.22,8,6),0,1.75,0); // head
    add(new THREE.BoxGeometry(.38,.55,.22),0,1.25,0); // torso
    add(new THREE.BoxGeometry(.32,.4,.18),0,.78,0);   // hips
    [-.25,.25].forEach(x=>{
      add(new THREE.CylinderGeometry(.07,.06,.5,6),x,1.0,0); // upper arm
      add(new THREE.CylinderGeometry(.06,.05,.45,6),x,.48,0); // forearm
      add(new THREE.CylinderGeometry(.09,.08,.45,6),x*.7,.42,0); // thigh
      add(new THREE.CylinderGeometry(.07,.06,.42,6),x*.7,.0,0);   // shin
    });
  } else if(id.startsWith("quad")){
    add(new THREE.BoxGeometry(.5,.38,1.2),0,.65,0);
    add(new THREE.SphereGeometry(.22,7,5),0,.75,.65);
    [-.2,.2].forEach(x=>[-.45,.45].forEach(z=>{add(new THREE.CylinderGeometry(.07,.06,.55,6),x,.28,z);}));
  } else if(id.startsWith("cre")){
    add(new THREE.BoxGeometry(.9,.8,2.5),0,.9,0);
    add(new THREE.SphereGeometry(.38,8,6),0,1.1,1.4);
    add(new THREE.CylinderGeometry(.12,.08,1.2,6),0,.9,-1.6,0,.4,0);
    [-.5,.5].forEach(x=>{add(new THREE.CylinderGeometry(.12,.1,.65,6),x,.6,.8);});
    [-.5,.5].forEach(x=>{add(new THREE.CylinderGeometry(.12,.1,.65,6),x,.6,-.8);});
  }

  // Ground + lights
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.MeshStandardMaterial({color:0x0a0a14}));
  gnd.rotation.x=-Math.PI/2;scene.add(gnd);meshes.push(gnd);
  if(!scene.getObjectByName("lib_amb")){
    const a=new THREE.AmbientLight(0xffffff,.7);a.name="lib_amb";scene.add(a);meshes.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1);d.position.set(10,20,10);d.castShadow=true;scene.add(d);meshes.push(d);
  }
  return meshes;
}

export default function BaseModelLibraryPanel({ scene, onLaunchGenerator }) {
  const [filter, setFilter]     = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [status, setStatus]     = useState("");
  const meshes = useRef([]);

  function clear(){ meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();}); meshes.current=[]; }

  function selectModel(model) {
    setSelected(model.id);
    if (!scene) { setStatus("No scene"); return; }
    clear();
    const ms = buildQuickMesh(scene, model.id);
    meshes.current = ms;
    setStatus(`Preview: ${model.name} — open generator to build full version`);
  }

  function launchGenerator(modelId) {
    const route = MODEL_ROUTES[modelId];
    if (!route) return;
    onLaunchGenerator && onLaunchGenerator(route);
    setStatus(`✓ Launching ${route.panel} with ${route.preset} preset`);
  }

  const cats = ["All", ...CATEGORIES.map(c=>c.label)];
  const allModels = CATEGORIES.flatMap(c=>c.models.map(m=>({...m,category:c.label})));
  const shown = allModels.filter(m=>{
    const matchCat = category==="All" || m.category===category;
    const matchFilter = !filter || m.name.toLowerCase().includes(filter.toLowerCase()) || m.tags.some(t=>t.includes(filter.toLowerCase()));
    return matchCat && matchFilter;
  });

  return(
    <div style={S.root}>
      <div style={S.h2}>📚 BASE MODEL LIBRARY</div>
      <div style={{fontSize:10,color:"#888",marginBottom:12,lineHeight:1.6}}>
        Don't know where to start? Pick a base model below.<br/>
        Click Preview to see it, then Open Generator to fully customize.
      </div>

      <div style={S.sec}>
        <input
          style={{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"5px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"}}
          placeholder="Search models, tags..."
          value={filter} onChange={e=>setFilter(e.target.value)}
        />
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {cats.map(c=>(
            <button key={c} style={{...S.btnO,padding:"2px 8px",fontSize:10,background:category===c?T.teal:T.panel,color:category===c?T.bg:T.muted,border:"1px solid "+(category===c?T.teal:"#333")}} onClick={()=>setCategory(c)}>
              {c.replace(/[🧍🐾🐉🧬]\s/,"")}
            </button>
          ))}
        </div>
      </div>

      {shown.map(model=>(
        <div key={model.id} style={{...S.card,borderColor:selected===model.id?T.teal:T.border}} onClick={()=>selectModel(model)}>
          <div style={S.cardH}>{model.name}</div>
          <div style={S.cardD}>{model.desc}</div>
          <div style={{marginTop:4}}>
            {model.tags.map(t=><span key={t} style={S.badge}>{t}</span>)}
          </div>
          {selected===model.id && (
            <button style={{...S.btn,marginTop:8,padding:"4px 12px",fontSize:11}}
              onClick={e=>{e.stopPropagation();launchGenerator(model.id);}}>
              ⚡ Open Generator
            </button>
          )}
        </div>
      ))}

      {status && <div style={{...S.stat,marginTop:4}}>{status}</div>}
    </div>
  );
}
"""

# Write files
print("Writing files...")
for path, content in FILES.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    short = path.replace("/workspaces/spx-mesh-editor/","")
    print(f"  ✓ {short}")

print(f"\n✅ Done — {len(FILES)} files written")
print("Run: npm run build && git add -A && git commit -m 'feat: Quadruped, Creature, Hybrid generators + Base Model Library' && git push")
