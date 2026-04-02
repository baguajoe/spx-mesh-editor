import React, { useState, useCallback, useRef, useEffect } from "react";
import * as THREE from "three";

function Slider({ label, value, min=0, max=1, step=0.01, onChange, unit="" }) {
  return (
    <div style={{ marginBottom:5 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#8b949e" }}>
        <span>{label}</span><span style={{ color:"#00ffc8", fontWeight:700 }}>{step<0.1?value.toFixed(2):Math.round(value)}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{ width:"100%", accentColor:"#00ffc8", cursor:"pointer" }}/>
    </div>
  );
}
function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
      <span style={{ fontSize:10, color:"#8b949e", flex:1 }}>{label}</span>
      <input type="color" value={value} onChange={e=>onChange(e.target.value)} style={{ width:32, height:22, border:"none", cursor:"pointer", borderRadius:3 }}/>
    </div>
  );
}
function Section({ title, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom:6, border:"1px solid #21262d", borderRadius:5, overflow:"hidden" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ padding:"5px 8px", cursor:"pointer", background:"#0d1117", display:"flex", justifyContent:"space-between", fontSize:11, fontWeight:600, color:"#00ffc8", userSelect:"none" }}>
        <span>{title}</span><span style={{ fontSize:9, opacity:0.7 }}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{ padding:"6px 8px", background:"#06060f" }}>{children}</div>}
    </div>
  );
}
function Badges({ items, active, onSelect }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:6 }}>
      {items.map(item=>(
        <button key={item} onClick={()=>onSelect(item)} style={{ padding:"3px 8px", fontSize:9, borderRadius:4, cursor:"pointer", fontWeight:600, background:active===item?"#00ffc8":"#21262d", color:active===item?"#0d1117":"#8b949e", border:`1px solid ${active===item?"#00ffc8":"#30363d"}` }}>{item}</button>
      ))}
    </div>
  );
}

const PRESETS = {
  "Dragon":   { bodyScale:1.0, bodyLen:0.85, headSz:0.55, neckLen:0.7, armLen:0.7, legLen:0.7, tailLen:0.9, horns:4, wings:0.9, spines:6, skinColor:"#7a1a08", accentColor:"#ff8800", scaleTexture:true },
  "Goblin":   { bodyScale:0.4, bodyLen:0.45, headSz:0.6,  neckLen:0.3, armLen:0.6, legLen:0.45,tailLen:0.0, horns:0, wings:0.0, spines:0, skinColor:"#3a6a20", accentColor:"#2a4a10", scaleTexture:false },
  "Orc":      { bodyScale:0.8, bodyLen:0.6,  headSz:0.65, neckLen:0.35,armLen:0.7, legLen:0.6, tailLen:0.0, horns:2, wings:0.0, spines:0, skinColor:"#2a5020", accentColor:"#8a4422", scaleTexture:false },
  "Demon":    { bodyScale:0.9, bodyLen:0.65, headSz:0.55, neckLen:0.4, armLen:0.75,legLen:0.65,tailLen:0.7, horns:2, wings:0.65,spines:4, skinColor:"#550a0a", accentColor:"#ff3300", scaleTexture:false },
  "Alien":    { bodyScale:0.65,bodyLen:0.55, headSz:0.7,  neckLen:0.55,armLen:0.85,legLen:0.55,tailLen:0.3, horns:0, wings:0.0, spines:0, skinColor:"#224433", accentColor:"#00ff88", scaleTexture:false },
  "Werewolf": { bodyScale:0.9, bodyLen:0.7,  headSz:0.65, neckLen:0.38,armLen:0.8, legLen:0.7, tailLen:0.55,horns:0, wings:0.0, spines:0, skinColor:"#4a2a18", accentColor:"#1a0a04", scaleTexture:false },
  "Spider":   { bodyScale:0.7, bodyLen:0.7,  headSz:0.45, neckLen:0.2, armLen:0.9, legLen:0.8, tailLen:0.0, horns:0, wings:0.0, spines:0, skinColor:"#111111", accentColor:"#cc0000", scaleTexture:false },
  "Troll":    { bodyScale:1.1, bodyLen:0.75, headSz:0.7,  neckLen:0.3, armLen:0.85,legLen:0.55,tailLen:0.0, horns:1, wings:0.0, spines:0, skinColor:"#3a5a30", accentColor:"#8a7a50", scaleTexture:false },
};

function buildCreature(scene, p, meshesRef) {
  meshesRef.current.forEach(m=>{ scene.remove(m); m.geometry?.dispose(); m.material?.dispose(); });
  meshesRef.current=[];
  const ms=[];

  // Lights
  if(!scene.getObjectByName("cr_amb")){
    const a=new THREE.AmbientLight(0xffffff,0.5); a.name="cr_amb"; scene.add(a); ms.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1.3); d.name="cr_dir"; d.position.set(8,15,8); d.castShadow=true; scene.add(d); ms.push(d);
    const b=new THREE.DirectionalLight(0x4488ff,0.4); b.position.set(-8,5,-5); scene.add(b); ms.push(b);
  }

  // Ground
  const g=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:0x111811,roughness:0.95}));
  g.rotation.x=-Math.PI/2; g.receiveShadow=true; scene.add(g); ms.push(g);
  scene.add(new THREE.GridHelper(30,15,0x1a2a1a,0x1a2a1a));

  const col=new THREE.Color(p.skinColor);
  const acc=new THREE.Color(p.accentColor);
  const sc=0.6+p.bodyScale*1.4;
  const bL=(0.5+p.bodyLen*0.9)*sc;
  const bG=0.28*sc;
  const hS=(0.18+p.headSz*0.28)*sc;
  const nL=(0.12+p.neckLen*0.38)*sc;
  const aL=(0.25+p.armLen*0.55)*sc;
  const lL=(0.35+p.legLen*0.65)*sc;
  const baseY=lL+bG*0.4;

  const skinMat=new THREE.MeshStandardMaterial({color:col,roughness:0.75,metalness:0.05});
  const accMat =new THREE.MeshStandardMaterial({color:acc,roughness:0.5,metalness:0.1});
  const darkMat=new THREE.MeshStandardMaterial({color:new THREE.Color(p.skinColor).multiplyScalar(0.5),roughness:0.9});

  const add=(geo,x,y,z,mat=skinMat,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.set(rx,ry,rz);
    m.castShadow=true; m.receiveShadow=true; scene.add(m); ms.push(m); return m;
  };

  // ── TORSO ──────────────────────────────────────────────────────────────────
  // Main body — tapered box
  add(new THREE.BoxGeometry(bG*2.2, bL*0.55, bG*1.6), 0, baseY, 0);
  // Chest muscles (two bumps)
  for(const sx of[-1,1]) add(new THREE.SphereGeometry(bG*0.55,10,8), sx*bG*0.55, baseY+bL*0.1, bG*0.55, skinMat);
  // Belly
  add(new THREE.SphereGeometry(bG*0.7,10,8), 0, baseY-bL*0.1, bG*0.55, skinMat);
  // Hips
  add(new THREE.BoxGeometry(bG*2.4, bL*0.22, bG*1.5), 0, baseY-bL*0.32, 0);
  // Spine ridge
  for(let i=0;i<4;i++) add(new THREE.SphereGeometry(bG*0.12,6,5), 0, baseY+bL*0.2-i*bL*0.12, -bG*0.7, darkMat);

  // ── NECK ───────────────────────────────────────────────────────────────────
  add(new THREE.CylinderGeometry(hS*0.5,bG*0.55,nL,10), 0, baseY+bL*0.32+nL*0.5, 0);
  // Neck muscles
  for(const sx of[-1,1]) add(new THREE.BoxGeometry(bG*0.25,nL*0.8,bG*0.2), sx*hS*0.35, baseY+bL*0.32+nL*0.5, 0, darkMat);

  // ── HEAD ───────────────────────────────────────────────────────────────────
  const hy=baseY+bL*0.35+nL+hS;
  add(new THREE.SphereGeometry(hS,16,12), 0, hy, 0);
  // Cranium bump
  add(new THREE.SphereGeometry(hS*0.7,12,8), 0, hy+hS*0.5, -hS*0.1, skinMat);
  // Brow ridge
  add(new THREE.BoxGeometry(hS*1.5,hS*0.22,hS*0.3), 0, hy+hS*0.3, hS*0.7, darkMat);
  // Cheekbones
  for(const sx of[-1,1]) add(new THREE.SphereGeometry(hS*0.3,8,6), sx*hS*0.6, hy-hS*0.1, hS*0.55, darkMat);
  // Jaw
  add(new THREE.BoxGeometry(hS*1.1,hS*0.4,hS*0.7), 0, hy-hS*0.55, 0, darkMat);
  // Snout/Muzzle
  add(new THREE.BoxGeometry(hS*0.65,hS*0.42,hS*0.55), 0, hy-hS*0.2, hS*0.7, skinMat);
  // Nostrils
  for(const sx of[-1,1]) add(new THREE.SphereGeometry(hS*0.1,6,5), sx*hS*0.18, hy-hS*0.22, hS*0.98, darkMat);
  // Eyes — deep set with glow
  for(const sx of[-1,1]){
    add(new THREE.SphereGeometry(hS*0.22,10,8), sx*hS*0.42, hy+hS*0.18, hS*0.7, new THREE.MeshStandardMaterial({color:new THREE.Color("#ffcc00"),emissive:new THREE.Color("#ff8800"),emissiveIntensity:0.5,roughness:0.1}));
    add(new THREE.SphereGeometry(hS*0.12,8,6), sx*hS*0.42, hy+hS*0.18, hS*0.82, new THREE.MeshStandardMaterial({color:0x000000,roughness:0.0}));
  }
  // Teeth/fangs
  for(const sx of[-1,0,1]) add(new THREE.ConeGeometry(hS*0.07,hS*0.22,6), sx*hS*0.25, hy-hS*0.42, hS*0.88, new THREE.MeshStandardMaterial({color:0xeeeedd,roughness:0.2}), Math.PI,0,0);
  // Ears
  for(const sx of[-1,1]) add(new THREE.ConeGeometry(hS*0.22,hS*0.5,8), sx*hS*0.88, hy+hS*0.55, 0, darkMat, 0,0,sx*0.5);

  // ── ARMS ───────────────────────────────────────────────────────────────────
  for(const sx of[-1,1]){
    const ax=sx*(bG*1.2+aL*0.12);
    // Shoulder ball
    add(new THREE.SphereGeometry(bG*0.38,10,8), sx*(bG+bG*0.28), baseY+bL*0.2, 0, skinMat);
    // Upper arm
    add(new THREE.CylinderGeometry(bG*0.3,bG*0.25,aL*0.5,10), ax, baseY+bL*0.1, 0);
    // Elbow
    add(new THREE.SphereGeometry(bG*0.24,8,6), ax+sx*aL*0.05, baseY-bL*0.08, 0, darkMat);
    // Forearm
    add(new THREE.CylinderGeometry(bG*0.24,bG*0.2,aL*0.45,10), ax+sx*aL*0.08, baseY-bL*0.25, 0);
    // Hand/claw base
    add(new THREE.BoxGeometry(bG*0.5,bG*0.25,bG*0.4), ax+sx*aL*0.15, baseY-bL*0.45, 0, skinMat);
    // Claws
    for(let c=0;c<3;c++){
      const cx=ax+sx*aL*0.15+sx*(c-1)*bG*0.15;
      add(new THREE.ConeGeometry(bG*0.06,bG*0.35,5), cx, baseY-bL*0.6, 0, accMat, Math.PI,0,0);
    }
    // Arm spines
    if(p.spines>0) for(let s=0;s<2;s++) add(new THREE.ConeGeometry(bG*0.07,bG*0.3,5), ax, baseY+bL*0.1-s*aL*0.2, -bG*0.3, accMat, -0.4,0,0);
  }

  // ── LEGS ───────────────────────────────────────────────────────────────────
  for(const sx of[-1,1]){
    const lx=sx*bG*0.88;
    // Hip ball
    add(new THREE.SphereGeometry(bG*0.38,10,8), lx, baseY-bL*0.32, 0, skinMat);
    // Thigh
    add(new THREE.CylinderGeometry(bG*0.35,bG*0.28,lL*0.5,10), lx, lL*0.72, 0);
    // Knee
    add(new THREE.SphereGeometry(bG*0.28,8,6), lx, lL*0.44, 0, darkMat);
    // Shin
    add(new THREE.CylinderGeometry(bG*0.27,bG*0.2,lL*0.46,10), lx, lL*0.2, 0);
    // Ankle
    add(new THREE.SphereGeometry(bG*0.2,8,6), lx, bG*0.18, 0, darkMat);
    // Foot
    add(new THREE.BoxGeometry(bG*0.55,bG*0.22,bG*0.7), lx, bG*0.1, bG*0.1, skinMat);
    // Toe claws
    for(let c=0;c<2;c++) add(new THREE.ConeGeometry(bG*0.07,bG*0.3,5), lx+(c-0.5)*bG*0.2, bG*0.05, bG*0.5, accMat, Math.PI*0.6,0,0);
  }

  // ── TAIL ───────────────────────────────────────────────────────────────────
  if(p.tailLen>0.1){
    const segs=7;
    for(let i=0;i<segs;i++){
      const t=i/segs, r=(1-t)*bG*0.45*p.tailLen+0.02*sc;
      const ty=baseY-bL*0.35-i*p.tailLen*0.22*sc;
      const tz=-(i*p.tailLen*0.18+bG*0.6)*sc;
      add(new THREE.SphereGeometry(Math.max(0.02,r),8,6), 0, ty, tz, i%2===0?skinMat:accMat);
    }
    // Tail spike
    add(new THREE.ConeGeometry(bG*0.12,bG*0.5,6), 0, baseY-bL*0.35-segs*p.tailLen*0.22*sc, -(segs*p.tailLen*0.18+bG*0.6)*sc-bG*0.4, accMat, -0.4,0,0);
  }

  // ── WINGS ──────────────────────────────────────────────────────────────────
  if(p.wings>0.1){
    const wS=p.wings*3.0*sc;
    for(const sx of[-1,1]){
      // Wing membrane — flat triangle shape
      const wGeo=new THREE.BufferGeometry();
      const verts=new Float32Array([
        0,0,0,
        sx*wS,wS*0.3,-wS*0.2,
        sx*wS*0.6,-wS*0.4,-wS*0.5,
        sx*wS*0.2,-wS*0.5,0,
      ]);
      const idx=new Uint16Array([0,1,2, 0,2,3]);
      wGeo.setAttribute("position",new THREE.BufferAttribute(verts,3));
      wGeo.setIndex(new THREE.BufferAttribute(idx,1));
      wGeo.computeVertexNormals();
      const wMat=new THREE.MeshStandardMaterial({color:acc,side:THREE.DoubleSide,transparent:true,opacity:0.85,roughness:0.6});
      const wing=new THREE.Mesh(wGeo,wMat);
      wing.position.set(sx*bG, baseY+bL*0.25, -bG*0.3);
      wing.castShadow=true; scene.add(wing); ms.push(wing);
      // Wing bones
      add(new THREE.CylinderGeometry(0.03*sc,0.02*sc,wS*0.9,6), sx*(bG+wS*0.35), baseY+bL*0.2+wS*0.12, -wS*0.08, accMat, 0,0,sx*0.45);
    }
  }

  // ── HORNS ──────────────────────────────────────────────────────────────────
  for(let i=0;i<Math.min(p.horns,6);i++){
    const a=(i/Math.max(1,p.horns-1))*Math.PI-Math.PI*0.5;
    const curve=i%2===0?0.3:-0.2;
    add(new THREE.ConeGeometry(hS*0.12,hS*0.6+i*0.02*sc,8), Math.cos(a)*hS*0.6, hy+hS*1.1, Math.sin(a)*hS*0.25, accMat, curve,0,0);
  }

  // ── BACK SPINES ────────────────────────────────────────────────────────────
  for(let i=0;i<p.spines;i++){
    const sy=baseY+bL*0.28-i*(bL*0.5/Math.max(1,p.spines));
    add(new THREE.ConeGeometry(bG*0.09,bG*0.55+i*0.01,6), 0, sy, -bG*0.65, accMat, -0.35,0,0);
  }

  meshesRef.current=ms;
  return ms.filter(m=>m.isMesh).length;
}

export default function CreatureGeneratorPanel({ sceneRef, setStatus, onGenerate }) {
  const scene=sceneRef?.current;
  const meshesRef=useRef([]);

  const [activePreset, setActivePreset] = useState("Dragon");
  const [bodyScale,    setBodyScale]    = useState(1.0);
  const [bodyLen,      setBodyLen]      = useState(0.85);
  const [headSz,       setHeadSz]       = useState(0.55);
  const [neckLen,      setNeckLen]      = useState(0.7);
  const [armLen,       setArmLen]       = useState(0.7);
  const [legLen,       setLegLen]       = useState(0.7);
  const [tailLen,      setTailLen]      = useState(0.9);
  const [horns,        setHorns]        = useState(4);
  const [wings,        setWings]        = useState(0.9);
  const [spines,       setSpines]       = useState(6);
  const [skinColor,    setSkinColor]    = useState("#7a1a08");
  const [accentColor,  setAccentColor]  = useState("#ff8800");

  function getParams(){ return {bodyScale,bodyLen,headSz,neckLen,armLen,legLen,tailLen,horns,wings,spines,skinColor,accentColor}; }

  function applyPreset(name){
    const p=PRESETS[name]; if(!p) return; setActivePreset(name);
    setBodyScale(p.bodyScale); setBodyLen(p.bodyLen); setHeadSz(p.headSz); setNeckLen(p.neckLen);
    setArmLen(p.armLen); setLegLen(p.legLen); setTailLen(p.tailLen); setHorns(p.horns);
    setWings(p.wings); setSpines(p.spines); setSkinColor(p.skinColor); setAccentColor(p.accentColor);
  }

  function generate(){
    if(!scene){ setStatus?.("No scene"); return; }
    const n=buildCreature(scene,getParams(),meshesRef);
    setStatus?.(`✓ ${activePreset} — ${n} parts`);
    onGenerate?.(getParams());
  }

  function clear(){ meshesRef.current.forEach(m=>{ scene?.remove(m); m.geometry?.dispose(); m.material?.dispose(); }); meshesRef.current=[]; setStatus?.("Cleared"); }

  const randomize=useCallback(()=>{
    const keys=Object.keys(PRESETS); applyPreset(keys[Math.floor(Math.random()*keys.length)]);
  },[]);

  const P={ fontFamily:"JetBrains Mono,monospace", color:"#e0e0e0", fontSize:12, userSelect:"none", width:"100%" };

  return (
    <div style={P}>
      <Section title="👾 Presets">
        <Badges items={Object.keys(PRESETS)} active={activePreset} onSelect={applyPreset}/>
      </Section>
      <Section title="🧬 Body">
        <Slider label="Body Scale"  value={bodyScale} onChange={setBodyScale}/>
        <Slider label="Body Length" value={bodyLen}   onChange={setBodyLen}/>
        <Slider label="Head Size"   value={headSz}    onChange={setHeadSz}/>
        <Slider label="Neck Length" value={neckLen}   onChange={setNeckLen}/>
      </Section>
      <Section title="💪 Limbs">
        <Slider label="Arm Length"  value={armLen}  onChange={setArmLen}/>
        <Slider label="Leg Length"  value={legLen}  onChange={setLegLen}/>
        <Slider label="Tail Length" value={tailLen} onChange={setTailLen}/>
      </Section>
      <Section title="✨ Features">
        <Slider label="Wings"  value={wings}  onChange={setWings}/>
        <Slider label="Horns"  value={horns}  min={0} max={6} step={1} onChange={setHorns}/>
        <Slider label="Spines" value={spines} min={0} max={12} step={1} onChange={setSpines}/>
      </Section>
      <Section title="🎨 Colors">
        <ColorRow label="Skin Color"   value={skinColor}   onChange={setSkinColor}/>
        <ColorRow label="Accent Color" value={accentColor} onChange={setAccentColor}/>
      </Section>
      <div style={{ display:"flex", gap:6, marginTop:8 }}>
        <button onClick={randomize} style={{ background:"#1a1f2c", color:"#888", border:"1px solid #21262d", borderRadius:4, padding:"6px 10px", cursor:"pointer", fontSize:11 }}>🎲</button>
        <button onClick={generate} style={{ flex:1, background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 0", cursor:"pointer", fontWeight:700, fontSize:12 }}>⚡ Generate Creature</button>
      </div>
      <button onClick={clear} style={{ width:"100%", marginTop:6, background:"#1a1f2c", color:"#ff4444", border:"1px solid #ff4444", borderRadius:4, padding:"5px 0", cursor:"pointer", fontSize:11 }}>🗑 Clear</button>
    </div>
  );
}
