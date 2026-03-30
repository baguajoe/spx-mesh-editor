
import React, { useState, useRef } from "react";
import { PolyQualityBar, Q, estimateTris, formatTris } from './PolyQualityUtil';
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const ARCHETYPES=["Realistic Human","Stylized Human","Hero/Superhero","Creature Humanoid","Demon Humanoid","Dragon Humanoid","Kaiju Humanoid","Vampire","Monster Hybrid","Robot/Android","Elder/Ancient","Child/Youth"];
const ANCESTRY=["African Inspired","East Asian Inspired","South Asian Inspired","Middle Eastern Inspired","European Inspired","Afro-Brazilian Inspired","Nordic Inspired","Mixed/Global Neutral","Fantasy Heritage","Alien Heritage"];
const PROPORTIONS=["Realistic","Heroic (8-head)","Stylized (7-head)","Exaggerated","Chibi (4-head)","Elongated","Hulking"];
const TOPOLOGY=["Animation Ready","High Detail","Low Poly Game","Base Mesh","Hero Topology","Creature Ready"];
const GENDER=["Masculine","Feminine","Neutral/Androgynous","Non-binary Custom"];

const PROP_DATA={
  "Realistic":       {headRatio:7.5, shoulderW:1.5, hipW:1.2, torsoLen:1.0, legLen:1.0, armLen:1.0},
  "Heroic (8-head)": {headRatio:8,   shoulderW:2.0, hipW:1.3, torsoLen:1.1, legLen:1.15, armLen:1.1},
  "Stylized (7-head)":{headRatio:7,  shoulderW:1.6, hipW:1.25,torsoLen:1.0, legLen:1.0, armLen:1.0},
  "Exaggerated":     {headRatio:6,   shoulderW:2.4, hipW:1.4, torsoLen:0.9, legLen:1.3, armLen:1.2},
  "Chibi (4-head)":  {headRatio:4,   shoulderW:1.2, hipW:1.1, torsoLen:0.6, legLen:0.55,armLen:0.7},
  "Elongated":       {headRatio:9,   shoulderW:1.3, hipW:1.0, torsoLen:1.2, legLen:1.4, armLen:1.2},
  "Hulking":         {headRatio:7,   shoulderW:2.8, hipW:1.5, torsoLen:1.1, legLen:1.0, armLen:1.15},
};

function buildCharacterMesh(scene, cfg) {
  const meshes = [];
  const p = PROP_DATA[cfg.proportions] || PROP_DATA["Realistic"];
  const h = cfg.height;
  const headH = h / p.headRatio;
  const genderFem = cfg.gender === "Feminine" ? 1 : 0;
  const matCol = new THREE.Color(0xc8955a);
  const mat = new THREE.MeshStandardMaterial({ color: matCol, roughness: 0.6 });

  const add = (geo, px, py, pz, rx=0, ry=0, rz=0) => {
    const m = new THREE.Mesh(geo, mat.clone());
    m.position.set(px, py, pz);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    scene.add(m); meshes.push(m); return m;
  };

  // Head
  add(new THREE.SphereGeometry(headH * 0.5,Q(quality).sphere,Q(quality).sphereH), 0, h - headH * 0.5, 0);
  // Neck
  add(new THREE.CylinderGeometry(headH*0.18, headH*0.22, headH*0.35,Q(quality).cylinder), 0, h - headH - headH*0.175, 0);
  // Torso
  const tw = headH * p.shoulderW, th = headH * 2.2 * p.torsoLen;
  const torsoGeo = new THREE.BoxGeometry(tw, th, headH * 0.7);
  add(torsoGeo, 0, h - headH - headH*0.35 - th*0.5, 0);
  // Hips
  const hw = headH * (p.hipW + genderFem * 0.2), hh = headH * 0.6;
  add(new THREE.BoxGeometry(hw, hh, headH * 0.6), 0, h - headH - headH*0.35 - th - hh*0.5, 0);
  // Upper arms
  const armW = headH * 0.22, armH = headH * 1.3 * p.armLen;
  [-1, 1].forEach(side => {
    add(new THREE.CylinderGeometry(armW, armW*0.9, armH,Q(quality).cylinder), side*(tw/2+armW), h-headH-headH*.4-armH*.5, 0);
    // Forearm
    add(new THREE.CylinderGeometry(armW*0.85, armW*0.7, armH*0.9,Q(quality).cylinder), side*(tw/2+armW), h-headH-headH*.4-armH-armH*.9*.5, 0);
    // Hand
    add(new THREE.BoxGeometry(headH*0.25, headH*0.3, headH*0.15), side*(tw/2+armW), h-headH-headH*.4-armH-armH*.9-headH*.15, 0);
  });
  // Legs
  const legW = headH * 0.26, legH = headH * 2.3 * p.legLen;
  const hipY = h - headH - headH*0.35 - th - hh;
  [-1, 1].forEach(side => {
    // Thigh
    add(new THREE.CylinderGeometry(legW*1.1, legW*0.9, legH,Q(quality).cylinder), side*headH*0.3, hipY - legH*0.5, 0);
    // Shin
    add(new THREE.CylinderGeometry(legW*0.9, legW*0.7, legH*0.95,Q(quality).cylinder), side*headH*0.3, hipY - legH - legH*.95*.5, 0);
    // Foot
    add(new THREE.BoxGeometry(headH*0.35, headH*0.18, headH*0.55), side*headH*0.3, hipY - legH - legH*.95 - headH*.09, headH*0.15);
  });

  // Eyes
  const eyeY = h - headH*0.55, eyeGeo = new THREE.SphereGeometry(headH*0.1,Q(quality).sphere,Q(quality).sphereH);
  [-1,1].forEach(s=>{const em=add(eyeGeo,s*headH*0.2,eyeY,headH*0.42);em.material=new THREE.MeshStandardMaterial({color:cfg.eyeColor||0x224488,roughness:0.05,metalness:0.3});});

  // Creature / demon extras
  if(cfg.archetype.includes("Dragon")||cfg.archetype.includes("Kaiju")){
    const tailGeo=new THREE.CylinderGeometry(headH*0.15,headH*0.05,headH*2,Q(quality).cylinder);
    add(tailGeo,0,hipY-headH*0.5,-(headH*0.5),0.8,0,0);
  }
  if(cfg.archetype.includes("Demon")){
    [[-.25,.35,.22],[.25,.35,.22]].forEach(([x,y,z])=>{
      const hg=new THREE.ConeGeometry(headH*.1,headH*.4,Q(quality).cone);
      const hm=add(hg,x*headH,(h-headH*.15+y*headH),z*headH);
      hm.material=new THREE.MeshStandardMaterial({color:0x442200,roughness:0.7});
    });
  }

  // Ambient + directional lights
  if(!scene.getObjectByName("model_amb")){
    const a=new THREE.AmbientLight(0xffffff,.7);a.name="model_amb";scene.add(a);meshes.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1);d.position.set(20,40,20);d.castShadow=true;scene.add(d);meshes.push(d);
  }

  return meshes;
}

export default function ModelGeneratorPanel({scene}){
  const [archetype,setArchetype]=useState("Realistic Human");
  const [quality, setQuality] = useState('Mid');
  const [ancestry,setAncestry]=useState("Mixed/Global Neutral");
  const [proportions,setProportions]=useState("Realistic");
  const [topology,setTopology]=useState("Animation Ready");
  const [gender,setGender]=useState("Neutral/Androgynous");
  const [height,setHeight]=useState(1.75);
  const [realism,setRealism]=useState(0.8);
  const [mascFem,setMascFem]=useState(0.5);
  const [eyeColor,setEyeColor]=useState("#224488");
  const [status,setStatus]=useState("");
  const [stats,setStats]=useState(null);
  const meshes=useRef([]);

  function clear(){meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();});meshes.current=[];setStats(null);}

  function generate(){
    if(!scene){setStatus("No scene");return;}
    clear();setStatus("Building character…");
    const cfg={archetype,ancestry,proportions,topology,gender,height,realism,mascFem,eyeColor:new THREE.Color(eyeColor)};
    const ms=buildCharacterMesh(scene,cfg);
    meshes.current=ms;
    setStats({archetype,proportions,gender,height,meshCount:ms.filter(m=>m.isMesh).length});
    setStatus(`✓ ${archetype} built — ${ms.filter(m=>m.isMesh).length} meshes`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🧍 MODEL GENERATOR</div>
      
      <PolyQualityBar quality={quality} onChange={setQuality}/>
<div style={S.sec}>
        <label style={S.lbl}>Archetype</label>
        <select style={S.sel} value={archetype} onChange={e=>setArchetype(e.target.value)}>{ARCHETYPES.map(a=><option key={a}>{a}</option>)}</select>
        <label style={S.lbl}>Ancestry / Heritage</label>
        <select style={S.sel} value={ancestry} onChange={e=>setAncestry(e.target.value)}>{ANCESTRY.map(a=><option key={a}>{a}</option>)}</select>
        <label style={S.lbl}>Proportions</label>
        <select style={S.sel} value={proportions} onChange={e=>setProportions(e.target.value)}>{PROPORTIONS.map(p=><option key={p}>{p}</option>)}</select>
        <label style={S.lbl}>Topology</label>
        <select style={S.sel} value={topology} onChange={e=>setTopology(e.target.value)}>{TOPOLOGY.map(t=><option key={t}>{t}</option>)}</select>
        <label style={S.lbl}>Gender Expression</label>
        <select style={S.sel} value={gender} onChange={e=>setGender(e.target.value)}>{GENDER.map(g=><option key={g}>{g}</option>)}</select>
        <label style={S.lbl}>Height: {height.toFixed(2)}m</label>
        <input style={S.inp} type="range" min={.9} max={3.5} step={.01} value={height} onChange={e=>setHeight(+e.target.value)}/>
        <label style={S.lbl}>Realism ↔ Stylized: {(realism*100).toFixed(0)}%</label>
        <input style={S.inp} type="range" min={0} max={1} step={.01} value={realism} onChange={e=>setRealism(+e.target.value)}/>
        <label style={S.lbl}>Masculine ↔ Feminine: {(mascFem*100).toFixed(0)}%</label>
        <input style={S.inp} type="range" min={0} max={1} step={.01} value={mascFem} onChange={e=>setMascFem(+e.target.value)}/>
        <label style={S.lbl}>Eye Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={eyeColor} onChange={e=>setEyeColor(e.target.value)}/>
      </div>
      <button style={S.btn} onClick={generate}>⚡ Generate</button>
      <button style={S.btnO} onClick={clear}>🗑 Clear</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
      {stats&&<div style={S.sec}><div style={S.stat}>Type: {stats.archetype}</div><div style={S.stat}>Proportions: {stats.proportions}</div><div style={S.stat}>Gender: {stats.gender}</div><div style={S.stat}>Height: {stats.height}m | Meshes: {stats.meshCount}</div></div>}
    </div>
  );
}
