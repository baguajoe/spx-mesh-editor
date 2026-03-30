#!/usr/bin/env python3
"""
SPX Mesh Editor - 9 Panels Install Script
Panels: City Generator, VR Preview Mode, Procedural Crowd Generator,
        Environment Generator, Building Simulator, Physics Simulation,
        Terrain Sculpting, Lighting Studio, Material & Texture Studio
Run from: /workspaces/spx-mesh-editor
"""
import os, sys, subprocess

REPO = os.path.dirname(os.path.abspath(__file__))
COMPONENTS = os.path.join(REPO, "src", "components")
PANELS_DIR = os.path.join(COMPONENTS, "panels")
os.makedirs(PANELS_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────
# PANEL FILES
# ─────────────────────────────────────────────────────────────

panels = {}

# ── 1. CITY GENERATOR ──────────────────────────────────────
panels["CityGeneratorPanel.jsx"] = r'''
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";

const S = {
  root: { background:"#06060f", color:"#e0e0e0", fontFamily:"JetBrains Mono,monospace", padding:16, height:"100%", overflowY:"auto" },
  h2: { color:"#00ffc8", fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:"#aaa", display:"block", marginBottom:4 },
  input: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  select: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  btn: { background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnO: { background:"#FF6600", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  section: { background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:12, marginBottom:12 },
  tag: { display:"inline-block", background:"#1a1a2e", color:"#00ffc8", fontSize:10, padding:"2px 7px", borderRadius:10, margin:"2px" },
  stat: { fontSize:11, color:"#00ffc8", marginBottom:4 },
};

const CITY_STYLES = ["Manhattan Grid","Organic Medieval","Radial European","Sprawl Suburban","Sci-Fi Megacity","Industrial District","Coastal Port"];
const BUILDING_TYPES = ["Skyscrapers","Mid-Rise","Low-Rise","Mixed","Historic","Futuristic"];
const ROAD_PATTERNS = ["Grid","Organic","Radial","Highway+Grid","Cul-de-sac"];

function randRange(min, max){ return Math.random()*(max-min)+min; }

function generateBuilding(scene, x, z, width, depth, height, style){
  const geo = new THREE.BoxGeometry(width, height, depth);
  const colors = { "Sci-Fi Megacity":"#00ffc8", "Futuristic":"#FF6600", default:"#8899aa" };
  const col = colors[style] || colors.default;
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness:0.7, metalness: style==="Sci-Fi Megacity"?0.8:0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, height/2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.type = "building";
  scene.add(mesh);
  // roof details
  if(height > 20){
    const roofGeo = new THREE.BoxGeometry(width*0.3, height*0.15, depth*0.3);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({color:"#FF6600"}));
    roof.position.set(x, height + height*0.075, z);
    scene.add(roof);
  }
  return mesh;
}

function generateRoad(scene, x1, z1, x2, z2){
  const dx = x2-x1, dz = z2-z1;
  const len = Math.sqrt(dx*dx+dz*dz);
  const geo = new THREE.PlaneGeometry(6, len);
  const mat = new THREE.MeshStandardMaterial({ color:"#1a1a2e", roughness:0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI/2;
  mesh.rotation.z = Math.atan2(dx, dz);
  mesh.position.set((x1+x2)/2, 0.05, (z1+z2)/2);
  scene.add(mesh);
}

export default function CityGeneratorPanel({ scene }){
  const [style, setStyle] = useState("Manhattan Grid");
  const [blocks, setBlocks] = useState(8);
  const [density, setDensity] = useState(0.72);
  const [maxH, setMaxH] = useState(80);
  const [minH, setMinH] = useState(8);
  const [bType, setBType] = useState("Mixed");
  const [roads, setRoads] = useState("Grid");
  const [park, setPark] = useState(true);
  const [lights, setLights] = useState(true);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("");
  const generated = useRef([]);

  function clearCity(){
    generated.current.forEach(m=>{ scene.remove(m); m.geometry?.dispose(); m.material?.dispose(); });
    generated.current = [];
    setStats(null);
  }

  function generate(){
    if(!scene){ setStatus("No scene available"); return; }
    clearCity();
    setStatus("Generating city…");
    const meshes = [];
    const blockSize = 40;
    const gap = 8;
    let bCount = 0;

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(blocks*(blockSize+gap)+gap, blocks*(blockSize+gap)+gap);
    const groundMat = new THREE.MeshStandardMaterial({color:"#0a0a14"});
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI/2;
    ground.receiveShadow = true;
    scene.add(ground); meshes.push(ground);

    for(let bx=0; bx<blocks; bx++){
      for(let bz=0; bz<blocks; bz++){
        const ox = (bx - blocks/2)*(blockSize+gap);
        const oz = (bz - blocks/2)*(blockSize+gap);
        // Roads
        if(roads==="Grid" || roads==="Highway+Grid"){
          generateRoad(scene, ox-blockSize/2-gap/2, -blocks*(blockSize+gap)/2, ox-blockSize/2-gap/2, blocks*(blockSize+gap)/2);
          meshes.push(...scene.children.slice(-1));
        }
        // Park chance
        if(park && Math.random()<0.06){ continue; }
        // Buildings in block
        const bPerRow = Math.ceil(density*4);
        const bw = blockSize/bPerRow;
        for(let i=0; i<bPerRow; i++){
          for(let j=0; j<bPerRow; j++){
            if(Math.random()>density) continue;
            const h = randRange(minH, maxH);
            const bx2 = ox + (i-bPerRow/2)*bw + bw/2;
            const bz2 = oz + (j-bPerRow/2)*bw + bw/2;
            const m = generateBuilding(scene, bx2, bz2, bw*0.75, bw*0.75, h, style);
            meshes.push(m);
            bCount++;
          }
        }
      }
    }

    // Ambient + directional lights
    if(lights){
      const amb = new THREE.AmbientLight(0x223344, 0.8);
      scene.add(amb); meshes.push(amb);
      const dir = new THREE.DirectionalLight(0xffeedd, 1.2);
      dir.position.set(100,200,80);
      dir.castShadow = true;
      scene.add(dir); meshes.push(dir);
      // Street lamp point lights
      for(let i=0;i<Math.min(bCount/4,30);i++){
        const pl = new THREE.PointLight(0xFF6600, 0.5, 30);
        pl.position.set(randRange(-blocks*20,blocks*20), 6, randRange(-blocks*20,blocks*20));
        scene.add(pl); meshes.push(pl);
      }
    }

    generated.current = meshes;
    setStats({ buildings: bCount, blocks: blocks*blocks, style, area: `${(blocks*(blockSize+gap)/10).toFixed(0)}×${(blocks*(blockSize+gap)/10).toFixed(0)} units` });
    setStatus(`✓ City generated — ${bCount} buildings`);
  }

  function exportJSON(){
    const data = generated.current.filter(m=>m.userData.type==="building").map(m=>({
      pos: m.position.toArray(), scale: m.scale.toArray()
    }));
    const blob = new Blob([JSON.stringify({style, blocks, buildings:data},null,2)], {type:"application/json"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="city.json"; a.click();
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>🏙 CITY GENERATOR</div>

      <div style={S.section}>
        <label style={S.label}>City Style</label>
        <select style={S.select} value={style} onChange={e=>setStyle(e.target.value)}>
          {CITY_STYLES.map(s=><option key={s}>{s}</option>)}
        </select>
        <label style={S.label}>City Blocks: {blocks}×{blocks}</label>
        <input style={S.input} type="range" min={2} max={16} step={1} value={blocks} onChange={e=>setBlocks(+e.target.value)}/>
        <label style={S.label}>Building Density: {(density*100).toFixed(0)}%</label>
        <input style={S.input} type="range" min={0.2} max={1} step={0.01} value={density} onChange={e=>setDensity(+e.target.value)}/>
      </div>

      <div style={S.section}>
        <label style={S.label}>Building Type</label>
        <select style={S.select} value={bType} onChange={e=>setBType(e.target.value)}>
          {BUILDING_TYPES.map(b=><option key={b}>{b}</option>)}
        </select>
        <label style={S.label}>Min Height: {minH}m</label>
        <input style={S.input} type="range" min={4} max={40} value={minH} onChange={e=>setMinH(+e.target.value)}/>
        <label style={S.label}>Max Height: {maxH}m</label>
        <input style={S.input} type="range" min={10} max={300} value={maxH} onChange={e=>setMaxH(+e.target.value)}/>
        <label style={S.label}>Road Pattern</label>
        <select style={S.select} value={roads} onChange={e=>setRoads(e.target.value)}>
          {ROAD_PATTERNS.map(r=><option key={r}>{r}</option>)}
        </select>
        <div style={{display:"flex",gap:16,marginBottom:8}}>
          <label style={{...S.label,cursor:"pointer"}}><input type="checkbox" checked={park} onChange={e=>setPark(e.target.checked)}/> Parks</label>
          <label style={{...S.label,cursor:"pointer"}}><input type="checkbox" checked={lights} onChange={e=>setLights(e.target.checked)}/> Street Lights</label>
        </div>
      </div>

      <button style={S.btn} onClick={generate}>⚡ Generate City</button>
      <button style={S.btnO} onClick={clearCity}>🗑 Clear</button>
      <button style={S.btn} onClick={exportJSON}>💾 Export JSON</button>

      {status && <div style={{...S.stat, marginTop:8}}>{status}</div>}
      {stats && (
        <div style={S.section}>
          <div style={S.label}>City Stats</div>
          <div style={S.stat}>Buildings: {stats.buildings}</div>
          <div style={S.stat}>Blocks: {stats.blocks}</div>
          <div style={S.stat}>Area: {stats.area}</div>
          <div style={S.stat}>Style: {stats.style}</div>
        </div>
      )}
    </div>
  );
}
'''.strip()

# ── 2. VR PREVIEW MODE ─────────────────────────────────────
panels["VRPreviewPanel.jsx"] = r'''
import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";

const S = {
  root: { background:"#06060f", color:"#e0e0e0", fontFamily:"JetBrains Mono,monospace", padding:16, height:"100%", overflowY:"auto" },
  h2: { color:"#00ffc8", fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:"#aaa", display:"block", marginBottom:4 },
  input: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  select: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  btn: { background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnO: { background:"#FF6600", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnRed: { background:"#cc2200", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  section: { background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:"#00ffc8", marginBottom:4 },
  vr: { background:"#0d0d1a", borderRadius:6, padding:12, marginBottom:12, border:"2px solid #00ffc8" },
};

const HEADSETS = ["Meta Quest 2","Meta Quest 3","Valve Index","HTC Vive Pro 2","PlayStation VR2","Apple Vision Pro","Generic WebXR"];
const VR_MODES = ["Sit-Down 360°","Room-Scale","Standing","Cinematic Viewer"];

export default function VRPreviewPanel({ scene, camera, renderer }){
  const [headset, setHeadset] = useState("Meta Quest 3");
  const [vrMode, setVrMode] = useState("Room-Scale");
  const [ipd, setIpd] = useState(63.5);
  const [fov, setFov] = useState(110);
  const [scale, setScale] = useState(1.0);
  const [comfort, setComfort] = useState(true);
  const [grid, setGrid] = useState(true);
  const [stereoActive, setStereoActive] = useState(false);
  const [xrSupported, setXrSupported] = useState(null);
  const [status, setStatus] = useState("");
  const stereoRef = useRef(null);
  const origCamera = useRef(null);
  const xrSession = useRef(null);
  const gridHelper = useRef(null);

  useEffect(()=>{
    if(navigator.xr){
      navigator.xr.isSessionSupported("immersive-vr").then(ok=>{
        setXrSupported(ok);
        setStatus(ok ? "✓ WebXR immersive-vr supported" : "WebXR not supported — using stereo preview");
      });
    } else {
      setXrSupported(false);
      setStatus("WebXR unavailable — using stereo preview");
    }
  },[]);

  function addFloorGrid(){
    if(!scene) return;
    if(gridHelper.current){ scene.remove(gridHelper.current); gridHelper.current=null; }
    if(grid){
      const g = new THREE.GridHelper(20, 20, 0x00ffc8, 0x1a1a2e);
      g.position.y = 0;
      scene.add(g);
      gridHelper.current = g;
    }
  }

  function enterStereoPreview(){
    if(!camera || !renderer){ setStatus("No camera/renderer"); return; }
    origCamera.current = { fov: camera.fov, aspect: camera.aspect };
    camera.fov = fov;
    camera.aspect = (window.innerWidth/2) / window.innerHeight;
    camera.updateProjectionMatrix();
    setStereoActive(true);
    addFloorGrid();
    setStatus("Stereo preview active — split-screen VR simulation");
  }

  function exitStereoPreview(){
    if(origCamera.current && camera){
      camera.fov = origCamera.current.fov;
      camera.aspect = origCamera.current.aspect;
      camera.updateProjectionMatrix();
    }
    if(gridHelper.current && scene){ scene.remove(gridHelper.current); gridHelper.current=null; }
    setStereoActive(false);
    setStatus("Stereo preview ended");
  }

  async function enterWebXR(){
    if(!navigator.xr || !xrSupported){ setStatus("WebXR not available"); return; }
    try {
      const session = await navigator.xr.requestSession("immersive-vr", {
        requiredFeatures:["local-floor"], optionalFeatures:["bounded-floor","hand-tracking"]
      });
      xrSession.current = session;
      renderer.xr.enabled = true;
      renderer.xr.setSession(session);
      setStatus("✓ WebXR session active");
      session.addEventListener("end", ()=>{ setStatus("WebXR session ended"); xrSession.current=null; renderer.xr.enabled=false; });
    } catch(e){ setStatus("WebXR error: "+e.message); }
  }

  async function exitWebXR(){
    if(xrSession.current){ await xrSession.current.end(); }
  }

  function applyHeadsetProfile(){
    const profiles = {
      "Meta Quest 3": { fov:120, ipd:63.5 },
      "Meta Quest 2": { fov:89, ipd:64 },
      "Valve Index": { fov:130, ipd:63 },
      "HTC Vive Pro 2": { fov:120, ipd:63.5 },
      "PlayStation VR2": { fov:110, ipd:63.5 },
      "Apple Vision Pro": { fov:90, ipd:63 },
      "Generic WebXR": { fov:100, ipd:63.5 },
    };
    const p = profiles[headset] || profiles["Generic WebXR"];
    setFov(p.fov); setIpd(p.ipd);
    setStatus(`✓ ${headset} profile applied — FOV ${p.fov}° IPD ${p.ipd}mm`);
  }

  function exportVRScene(){
    if(!scene) return;
    const data = { headset, vrMode, ipd, fov, scale, objectCount: scene.children.length };
    const b = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="vr_scene.json"; a.click();
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>🥽 VR PREVIEW MODE</div>

      <div style={S.section}>
        <label style={S.label}>Target Headset</label>
        <select style={S.select} value={headset} onChange={e=>setHeadset(e.target.value)}>
          {HEADSETS.map(h=><option key={h}>{h}</option>)}
        </select>
        <button style={S.btn} onClick={applyHeadsetProfile}>Apply Profile</button>

        <label style={S.label}>VR Mode</label>
        <select style={S.select} value={vrMode} onChange={e=>setVrMode(e.target.value)}>
          {VR_MODES.map(m=><option key={m}>{m}</option>)}
        </select>

        <label style={S.label}>IPD: {ipd}mm</label>
        <input style={S.input} type="range" min={54} max={74} step={0.5} value={ipd} onChange={e=>setIpd(+e.target.value)}/>

        <label style={S.label}>FOV: {fov}°</label>
        <input style={S.input} type="range" min={60} max={140} step={1} value={fov} onChange={e=>setFov(+e.target.value)}/>

        <label style={S.label}>World Scale: {scale.toFixed(2)}x</label>
        <input style={S.input} type="range" min={0.1} max={3} step={0.01} value={scale} onChange={e=>setScale(+e.target.value)}/>

        <div style={{display:"flex",gap:16,marginBottom:8}}>
          <label style={{...S.label,cursor:"pointer"}}><input type="checkbox" checked={comfort} onChange={e=>setComfort(e.target.checked)}/> Comfort Mode</label>
          <label style={{...S.label,cursor:"pointer"}}><input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/> Floor Grid</label>
        </div>
      </div>

      <div style={S.vr}>
        <div style={{...S.label,color:"#00ffc8",marginBottom:8}}>XR Status: {status || "Ready"}</div>
        {!stereoActive
          ? <button style={S.btn} onClick={enterStereoPreview}>👁 Enter Stereo Preview</button>
          : <button style={S.btnRed} onClick={exitStereoPreview}>✕ Exit Stereo Preview</button>
        }
        {xrSupported &&
          <button style={S.btnO} onClick={xrSession.current ? exitWebXR : enterWebXR}>
            {xrSession.current ? "✕ Exit WebXR" : "🥽 Enter WebXR"}
          </button>
        }
      </div>

      <button style={S.btn} onClick={exportVRScene}>💾 Export VR Config</button>

      <div style={S.section}>
        <div style={S.label}>VR Optimization Guide</div>
        <div style={{fontSize:10,color:"#888",lineHeight:1.6}}>
          • Target 72–90 FPS for comfort<br/>
          • Keep draw calls under 200<br/>
          • Use baked lighting where possible<br/>
          • Enable frustum culling on all meshes<br/>
          • Poly budget: ~500K tris total scene<br/>
          • Texture atlas to reduce draw calls
        </div>
      </div>
    </div>
  );
}
'''.strip()

# ── 3. PROCEDURAL CROWD GENERATOR ──────────────────────────
panels["CrowdGeneratorPanel.jsx"] = r'''
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";

const S = {
  root: { background:"#06060f", color:"#e0e0e0", fontFamily:"JetBrains Mono,monospace", padding:16, height:"100%", overflowY:"auto" },
  h2: { color:"#00ffc8", fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:"#aaa", display:"block", marginBottom:4 },
  input: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  select: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  btn: { background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnO: { background:"#FF6600", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  section: { background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:"#00ffc8", marginBottom:4 },
};

const BEHAVIORS = ["Random Walk","Follow Path","Crowd Flow","Panic Scatter","Festival Dance","Military March","Protest Rally"];
const FORMATION = ["Random","Circle","Grid","Line","Cluster","Spiral"];

function lerpColor(a, b, t){ return `hsl(${Math.round(a[0]+(b[0]-a[0])*t)},${Math.round(a[1]+(b[1]-a[1])*t)}%,${Math.round(a[2]+(b[2]-a[2])*t)}%)`; }

class Agent {
  constructor(id, pos, behavior, scene){
    this.id = id;
    this.behavior = behavior;
    this.velocity = new THREE.Vector3((Math.random()-0.5)*0.05, 0, (Math.random()-0.5)*0.05);
    this.target = new THREE.Vector3(pos.x+Math.random()*10-5, pos.y, pos.z+Math.random()*10-5);
    const h = Math.floor(Math.random()*20+8);
    const geo = new THREE.CapsuleGeometry(0.25, h*0.06, 4, 8);
    const skinColors = [0xf5cba7, 0xe8a87c, 0xd4876a, 0xc68642, 0x8d5524, 0x4a2c0a];
    const mat = new THREE.MeshStandardMaterial({ color: skinColors[Math.floor(Math.random()*skinColors.length)] });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(pos);
    this.mesh.position.y = h*0.03;
    this.mesh.castShadow = true;
    scene.add(this.mesh);
    // Clothes
    const torsoGeo = new THREE.BoxGeometry(0.4, 0.35, 0.2);
    const clothColors = [0x2244aa, 0xaa2222, 0x22aa44, 0xaaaa22, 0x884400, 0x224466];
    const torso = new THREE.Mesh(torsoGeo, new THREE.MeshStandardMaterial({color:clothColors[Math.floor(Math.random()*clothColors.length)]}));
    torso.position.y = 0.12;
    this.mesh.add(torso);
  }

  update(dt, agents, bounds, behavior){
    const beh = behavior || this.behavior;
    if(beh === "Panic Scatter"){
      const away = this.mesh.position.clone().normalize().multiplyScalar(0.08);
      this.velocity.add(away);
    } else if(beh === "Crowd Flow"){
      this.velocity.x += 0.002;
    } else if(beh === "Military March"){
      this.velocity.set(0,0,0.04);
    } else if(beh === "Festival Dance"){
      this.velocity.x = Math.sin(Date.now()*0.003+this.id)*0.02;
      this.velocity.z = Math.cos(Date.now()*0.003+this.id)*0.02;
    } else {
      // Seek target with separation
      const toTarget = this.target.clone().sub(this.mesh.position);
      if(toTarget.length() < 1.5){
        this.target.set(
          (Math.random()-0.5)*bounds*2,
          0,
          (Math.random()-0.5)*bounds*2
        );
      }
      const seek = toTarget.normalize().multiplyScalar(0.03);
      this.velocity.add(seek);
      // Separation
      for(const other of agents){
        if(other.id === this.id) continue;
        const d = this.mesh.position.distanceTo(other.mesh.position);
        if(d < 1.2 && d > 0){
          const away = this.mesh.position.clone().sub(other.mesh.position).normalize().multiplyScalar(0.05/d);
          this.velocity.add(away);
        }
      }
    }
    this.velocity.clampLength(0, 0.12);
    this.mesh.position.addScaledVector(this.velocity, dt*60);
    // Clamp to bounds
    this.mesh.position.x = Math.max(-bounds, Math.min(bounds, this.mesh.position.x));
    this.mesh.position.z = Math.max(-bounds, Math.min(bounds, this.mesh.position.z));
    this.mesh.position.y = 0;
    // Face direction
    if(this.velocity.length() > 0.001){
      this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
      // Subtle walk bob
      this.mesh.position.y = Math.abs(Math.sin(Date.now()*0.005+this.id))*0.05;
    }
  }

  dispose(scene){ scene.remove(this.mesh); this.mesh.geometry?.dispose(); this.mesh.material?.dispose(); }
}

export default function CrowdGeneratorPanel({ scene }){
  const [count, setCount] = useState(50);
  const [behavior, setBehavior] = useState("Random Walk");
  const [formation, setFormation] = useState("Random");
  const [bounds, setBounds] = useState(20);
  const [animated, setAnimated] = useState(true);
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState(null);
  const agents = useRef([]);
  const raf = useRef(null);
  const lastT = useRef(0);

  function clearCrowd(){
    cancelAnimationFrame(raf.current);
    agents.current.forEach(a=>a.dispose(scene));
    agents.current = [];
    setStats(null); setStatus("");
  }

  function spawnPosition(i, total, form, bounds){
    switch(form){
      case "Circle": { const a=i/total*Math.PI*2, r=bounds*0.6; return new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r); }
      case "Grid": { const w=Math.ceil(Math.sqrt(total)), gx=i%w-w/2, gz=Math.floor(i/w)-w/2; return new THREE.Vector3(gx*2,0,gz*2); }
      case "Line": return new THREE.Vector3((i-total/2)*1.5, 0, 0);
      case "Spiral": { const a=i*0.4, r=i*0.3; return new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r); }
      case "Cluster": { const cx=(Math.random()-0.5)*bounds, cz=(Math.random()-0.5)*bounds; return new THREE.Vector3(cx+(Math.random()-0.5)*4,0,cz+(Math.random()-0.5)*4); }
      default: return new THREE.Vector3((Math.random()-0.5)*bounds*2, 0, (Math.random()-0.5)*bounds*2);
    }
  }

  function generate(){
    if(!scene){ setStatus("No scene"); return; }
    clearCrowd();
    setStatus("Spawning crowd…");
    const newAgents = [];
    for(let i=0; i<count; i++){
      const pos = spawnPosition(i, count, formation, bounds);
      newAgents.push(new Agent(i, pos, behavior, scene));
    }
    agents.current = newAgents;
    setStats({ count, behavior, formation });
    setStatus(`✓ ${count} agents spawned`);

    if(animated){
      const tick = (t)=>{
        const dt = Math.min((t-lastT.current)/1000, 0.05);
        lastT.current = t;
        agents.current.forEach(a=>a.update(dt, agents.current, bounds, behavior));
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    }
  }

  useEffect(()=>()=>{ cancelAnimationFrame(raf.current); },[]);

  function setBehaviorLive(b){ setBehavior(b); agents.current.forEach(a=>a.behavior=b); }

  return (
    <div style={S.root}>
      <div style={S.h2}>👥 CROWD GENERATOR</div>
      <div style={S.section}>
        <label style={S.label}>Agent Count: {count}</label>
        <input style={S.input} type="range" min={5} max={500} step={5} value={count} onChange={e=>setCount(+e.target.value)}/>
        <label style={S.label}>Formation</label>
        <select style={S.select} value={formation} onChange={e=>setFormation(e.target.value)}>
          {FORMATION.map(f=><option key={f}>{f}</option>)}
        </select>
        <label style={S.label}>Behavior</label>
        <select style={S.select} value={behavior} onChange={e=>setBehaviorLive(e.target.value)}>
          {BEHAVIORS.map(b=><option key={b}>{b}</option>)}
        </select>
        <label style={S.label}>Bounds Radius: {bounds}m</label>
        <input style={S.input} type="range" min={5} max={100} value={bounds} onChange={e=>setBounds(+e.target.value)}/>
        <label style={{...S.label,cursor:"pointer"}}><input type="checkbox" checked={animated} onChange={e=>setAnimated(e.target.checked)}/> Animate in Real-Time</label>
      </div>
      <button style={S.btn} onClick={generate}>⚡ Generate Crowd</button>
      <button style={S.btnO} onClick={clearCrowd}>🗑 Clear</button>
      {status && <div style={{...S.stat,marginTop:8}}>{status}</div>}
      {stats && (
        <div style={S.section}>
          <div style={S.stat}>Agents: {stats.count}</div>
          <div style={S.stat}>Behavior: {stats.behavior}</div>
          <div style={S.stat}>Formation: {stats.formation}</div>
        </div>
      )}
      <div style={S.section}>
        <div style={{fontSize:10,color:"#888",lineHeight:1.6}}>
          Steering: seek-target + separation + velocity clamping<br/>
          Each agent: capsule body + colored torso + walk bob<br/>
          Behaviors update live without re-spawning
        </div>
      </div>
    </div>
  );
}
'''.strip()

# ── 4. ENVIRONMENT GENERATOR ────────────────────────────────
panels["EnvironmentGeneratorPanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const S = {
  root: { background:"#06060f", color:"#e0e0e0", fontFamily:"JetBrains Mono,monospace", padding:16, height:"100%", overflowY:"auto" },
  h2: { color:"#00ffc8", fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:"#aaa", display:"block", marginBottom:4 },
  input: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  select: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  btn: { background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnO: { background:"#FF6600", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  section: { background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:"#00ffc8", marginBottom:4 },
};

const BIOMES = ["Temperate Forest","Desert","Arctic Tundra","Tropical Jungle","Volcanic","Ocean Floor","Alien Planet","Swamp","Savanna","Mountain Alpine"];
const SKY_MODES = ["Day Clear","Overcast","Dusk","Night Stars","Stormy","Dawn","Alien Sky"];
const WEATHER = ["None","Light Rain","Heavy Rain","Snow","Fog","Sandstorm","Blizzard"];

function noise2D(x, z, scale=0.05){ return Math.sin(x*scale)*Math.cos(z*scale)*0.5 + Math.sin(x*scale*2.1+0.3)*Math.cos(z*scale*1.7+0.7)*0.25 + Math.sin(x*scale*4.3+1.1)*Math.cos(z*scale*3.9+0.9)*0.125; }

const BIOME_CONFIG = {
  "Temperate Forest": { ground:"#2d5a27", trees:true, rocks:true, water:false, skyCol:0x87ceeb },
  "Desert": { ground:"#c2955a", trees:false, rocks:true, water:false, skyCol:0xf0d090 },
  "Arctic Tundra": { ground:"#ddeeff", trees:false, rocks:true, water:true, skyCol:0xb0d0e0 },
  "Tropical Jungle": { ground:"#1a5c1a", trees:true, rocks:false, water:true, skyCol:0x6bab3a },
  "Volcanic": { ground:"#1a0a00", trees:false, rocks:true, water:false, skyCol:0xff4400 },
  "Ocean Floor": { ground:"#0a2a4a", trees:false, rocks:true, water:true, skyCol:0x001133 },
  "Alien Planet": { ground:"#3a004a", trees:true, rocks:true, water:true, skyCol:0x220033 },
  "Swamp": { ground:"#1e3320", trees:true, rocks:false, water:true, skyCol:0x556655 },
  "Savanna": { ground:"#8b7355", trees:true, rocks:false, water:false, skyCol:0xf0e0a0 },
  "Mountain Alpine": { ground:"#446644", trees:true, rocks:true, water:false, skyCol:0xaaddff },
};

export default function EnvironmentGeneratorPanel({ scene }){
  const [biome, setBiome] = useState("Temperate Forest");
  const [sky, setSky] = useState("Day Clear");
  const [weather, setWeather] = useState("None");
  const [size, setSize] = useState(100);
  const [treeDensity, setTreeDensity] = useState(0.6);
  const [rockDensity, setRockDensity] = useState(0.4);
  const [heightScale, setHeightScale] = useState(12);
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState(null);
  const envMeshes = useRef([]);
  const particleSys = useRef(null);

  function clearEnv(){
    envMeshes.current.forEach(m=>{ scene.remove(m); m.geometry?.dispose(); m.material?.dispose(); });
    envMeshes.current=[];
    if(particleSys.current){ scene.remove(particleSys.current); particleSys.current=null; }
    if(scene.background) scene.background=null;
    if(scene.fog) scene.fog=null;
    setStats(null); setStatus("");
  }

  function addTree(x, z, biome){
    const h = 4 + Math.random()*8;
    const trunkGeo = new THREE.CylinderGeometry(0.2,0.35,h,6);
    const trunkMat = new THREE.MeshStandardMaterial({color: biome==="Alien Planet"?0x440088:0x5c3a1a});
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, h/2, z);
    trunk.castShadow=true;
    const leafColors = { "Temperate Forest":0x2d7a27, "Tropical Jungle":0x0f5c0f, "Alien Planet":0x8800ff, "Swamp":0x2a4a1a, "Savanna":0x7a8a2a, "Mountain Alpine":0x336633 };
    const leafGeo = new THREE.SphereGeometry(h*0.4, 7, 6);
    const leafMat = new THREE.MeshStandardMaterial({color: leafColors[biome]||0x228822});
    const leaves = new THREE.Mesh(leafGeo, leafMat);
    leaves.position.y = h*0.5;
    leaves.castShadow=true;
    trunk.add(leaves);
    scene.add(trunk);
    return trunk;
  }

  function addRock(x, z){
    const s = 0.5+Math.random()*2.5;
    const geo = new THREE.DodecahedronGeometry(s, 0);
    const mat = new THREE.MeshStandardMaterial({color:0x667788, roughness:0.95, metalness:0.05});
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, s*0.4, z);
    m.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    m.castShadow=true;
    scene.add(m);
    return m;
  }

  function applyWeather(w){
    if(w === "None"){ scene.fog=null; return; }
    if(w==="Fog" || w==="Blizzard"){ scene.fog=new THREE.FogExp2(0x889999, 0.025); return; }
    if(w==="Sandstorm"){ scene.fog=new THREE.FogExp2(0xc8a050, 0.03); return; }
    // Rain/Snow particles
    const count = 2000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      pos[i*3] = (Math.random()-0.5)*size;
      pos[i*3+1] = Math.random()*50;
      pos[i*3+2] = (Math.random()-0.5)*size;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    const col = w==="Snow"?0xffffff:0x8888ff;
    const mat = new THREE.PointsMaterial({color:col, size:w==="Snow"?0.3:0.1, transparent:true, opacity:0.7});
    const ps = new THREE.Points(geo, mat);
    scene.add(ps);
    particleSys.current = ps;
  }

  function generate(){
    if(!scene){ setStatus("No scene"); return; }
    clearEnv();
    setStatus("Generating environment…");
    const cfg = BIOME_CONFIG[biome] || BIOME_CONFIG["Temperate Forest"];
    const meshes = [];

    // Terrain
    const res = 64;
    const geo = new THREE.PlaneGeometry(size, size, res, res);
    geo.rotateX(-Math.PI/2);
    const pos = geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i), z=pos.getZ(i);
      pos.setY(i, noise2D(x,z)*heightScale);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: cfg.ground, roughness:0.9 });
    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow=true;
    scene.add(terrain); meshes.push(terrain);

    // Sky
    const skyColors = { "Day Clear":0x87ceeb, "Overcast":0x888899, "Dusk":0xff7744, "Night Stars":0x050510, "Stormy":0x334444, "Dawn":0xffaa66, "Alien Sky":0x220033 };
    scene.background = new THREE.Color(skyColors[sky]||0x87ceeb);

    // Ambient
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb); meshes.push(amb);
    const dir = new THREE.DirectionalLight(0xffeedd, 1.0);
    dir.position.set(50,80,30); dir.castShadow=true;
    scene.add(dir); meshes.push(dir);

    let treeCount=0, rockCount=0;
    const scatter = size/2;
    for(let i=0;i<400;i++){
      const x=(Math.random()-0.5)*size*0.9, z=(Math.random()-0.5)*size*0.9;
      const h = noise2D(x,z)*heightScale;
      if(cfg.trees && Math.random()<treeDensity){ const t=addTree(x,h,biome); meshes.push(t); treeCount++; }
      if(cfg.rocks && Math.random()<rockDensity){ const r=addRock(x,z); r.position.y+=h; meshes.push(r); rockCount++; }
    }

    // Water
    if(cfg.water){
      const wGeo = new THREE.PlaneGeometry(size*0.4, size*0.4);
      wGeo.rotateX(-Math.PI/2);
      const wMat = new THREE.MeshStandardMaterial({color:0x0044aa, transparent:true, opacity:0.75, roughness:0.1, metalness:0.2});
      const water = new THREE.Mesh(wGeo, wMat);
      water.position.y = -1;
      scene.add(water); meshes.push(water);
    }

    applyWeather(weather);
    envMeshes.current = meshes;
    setStats({ biome, trees: treeCount, rocks: rockCount, size: `${size}×${size}`, weather });
    setStatus(`✓ ${biome} generated`);
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>🌍 ENVIRONMENT GENERATOR</div>
      <div style={S.section}>
        <label style={S.label}>Biome</label>
        <select style={S.select} value={biome} onChange={e=>setBiome(e.target.value)}>
          {BIOMES.map(b=><option key={b}>{b}</option>)}
        </select>
        <label style={S.label}>Sky</label>
        <select style={S.select} value={sky} onChange={e=>setSky(e.target.value)}>
          {SKY_MODES.map(s=><option key={s}>{s}</option>)}
        </select>
        <label style={S.label}>Weather</label>
        <select style={S.select} value={weather} onChange={e=>setWeather(e.target.value)}>
          {WEATHER.map(w=><option key={w}>{w}</option>)}
        </select>
        <label style={S.label}>Area Size: {size}m</label>
        <input style={S.input} type="range" min={20} max={500} step={10} value={size} onChange={e=>setSize(+e.target.value)}/>
        <label style={S.label}>Height Scale: {heightScale}m</label>
        <input style={S.input} type="range" min={0} max={60} step={1} value={heightScale} onChange={e=>setHeightScale(+e.target.value)}/>
        <label style={S.label}>Tree Density: {(treeDensity*100).toFixed(0)}%</label>
        <input style={S.input} type="range" min={0} max={1} step={0.01} value={treeDensity} onChange={e=>setTreeDensity(+e.target.value)}/>
        <label style={S.label}>Rock Density: {(rockDensity*100).toFixed(0)}%</label>
        <input style={S.input} type="range" min={0} max={1} step={0.01} value={rockDensity} onChange={e=>setRockDensity(+e.target.value)}/>
      </div>
      <button style={S.btn} onClick={generate}>⚡ Generate</button>
      <button style={S.btnO} onClick={clearEnv}>🗑 Clear</button>
      {status && <div style={{...S.stat,marginTop:8}}>{status}</div>}
      {stats && (
        <div style={S.section}>
          <div style={S.stat}>Biome: {stats.biome}</div>
          <div style={S.stat}>Trees: {stats.trees} | Rocks: {stats.rocks}</div>
          <div style={S.stat}>Area: {stats.size}</div>
          <div style={S.stat}>Weather: {stats.weather}</div>
        </div>
      )}
    </div>
  );
}
'''.strip()

# ── 5. BUILDING SIMULATOR ───────────────────────────────────
panels["BuildingSimulatorPanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const S = {
  root: { background:"#06060f", color:"#e0e0e0", fontFamily:"JetBrains Mono,monospace", padding:16, height:"100%", overflowY:"auto" },
  h2: { color:"#00ffc8", fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:"#aaa", display:"block", marginBottom:4 },
  input: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  select: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  btn: { background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnO: { background:"#FF6600", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  section: { background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:"#00ffc8", marginBottom:4 },
};

const ARCHETYPES = ["Office Tower","Apartment Block","Industrial Warehouse","Gothic Cathedral","Modern House","Pyramid","Pagoda","Brutalist Complex","Victorian Mansion","Futuristic Hub"];
const MATERIALS_B = ["Concrete","Glass Curtain","Brick","Stone","Metal Panels","Wood","Marble","Carbon Fiber"];
const ROOF_TYPES = ["Flat","Sloped Gable","Hip","Pyramid","Dome","Green Roof","Penthouse","Sawtooth"];

function buildFloor(scene, x, z, w, d, y, col){
  const geo = new THREE.BoxGeometry(w, 3.2, d);
  const mat = new THREE.MeshStandardMaterial({color:col, roughness:0.6, metalness:0.1});
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y+1.6, z);
  m.castShadow=true; m.receiveShadow=true;
  scene.add(m);
  // Window strip
  const wGeo = new THREE.BoxGeometry(w*0.9, 1.6, 0.05);
  const wMat = new THREE.MeshStandardMaterial({color:0x88aacc, transparent:true, opacity:0.65, roughness:0.05, metalness:0.3});
  const win = new THREE.Mesh(wGeo, wMat);
  win.position.set(0, 0.3, d/2+0.03);
  m.add(win);
  const win2 = win.clone(); win2.position.z = -d/2-0.03; m.add(win2);
  return m;
}

function addRoof(scene, x, z, w, d, topY, roofType, col){
  if(roofType==="Flat"){
    const geo=new THREE.BoxGeometry(w,0.4,d);
    const m=new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:0x333344}));
    m.position.set(x,topY+0.2,z); scene.add(m); return m;
  }
  if(roofType==="Pyramid"){
    const geo=new THREE.ConeGeometry(Math.max(w,d)*0.6,w*0.5,4);
    const m=new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:col}));
    m.position.set(x,topY+w*0.25,z); m.rotation.y=Math.PI/4; scene.add(m); return m;
  }
  if(roofType==="Dome"){
    const geo=new THREE.SphereGeometry(Math.max(w,d)*0.55,16,8,0,Math.PI*2,0,Math.PI/2);
    const m=new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:0x8899aa,roughness:0.3}));
    m.position.set(x,topY,z); scene.add(m); return m;
  }
  // Default sloped
  const geo=new THREE.CylinderGeometry(0, Math.max(w,d)*0.7, w*0.4, 4);
  const m=new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:0x884422}));
  m.position.set(x,topY+w*0.2,z); m.rotation.y=Math.PI/4; scene.add(m); return m;
}

export default function BuildingSimulatorPanel({ scene }){
  const [archetype, setArchetype] = useState("Office Tower");
  const [floors, setFloors] = useState(12);
  const [width, setWidth] = useState(14);
  const [depth, setDepth] = useState(14);
  const [material, setMaterial] = useState("Glass Curtain");
  const [roofType, setRoofType] = useState("Flat");
  const [color, setColor] = useState("#667799");
  const [setback, setSetback] = useState(false);
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState(null);
  const meshes = useRef([]);

  const MAT_COLORS = { "Concrete":0x888888, "Glass Curtain":0x336699, "Brick":0x884433, "Stone":0x667755, "Metal Panels":0x556677, "Wood":0x7a5c3a, "Marble":0xeeeedd, "Carbon Fiber":0x111122 };

  function clearBuilding(){ meshes.current.forEach(m=>{ scene.remove(m); m.geometry?.dispose(); m.material?.dispose(); }); meshes.current=[]; setStats(null); setStatus(""); }

  function build(){
    if(!scene){ setStatus("No scene"); return; }
    clearBuilding();
    setStatus("Constructing building…");
    const col = MAT_COLORS[material] || parseInt(color.replace("#",""),16);
    const ms = [];
    // Ground
    const groundGeo = new THREE.PlaneGeometry(width+20, depth+20);
    groundGeo.rotateX(-Math.PI/2);
    const gm = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({color:0x111122}));
    gm.receiveShadow=true; scene.add(gm); ms.push(gm);

    let currentW = width, currentD = depth;
    for(let f=0; f<floors; f++){
      if(setback && f>0 && f%4===0){ currentW*=0.88; currentD*=0.88; }
      const fm = buildFloor(scene, 0, 0, currentW, currentD, f*3.2, col);
      ms.push(fm);
    }
    const topY = floors*3.2;
    const rm = addRoof(scene, 0, 0, currentW, currentD, topY, roofType, col);
    ms.push(rm);

    // Lobby entrance
    const lobGeo=new THREE.BoxGeometry(currentW*0.4, 4, 2);
    const lob=new THREE.Mesh(lobGeo, new THREE.MeshStandardMaterial({color:0x8899bb,roughness:0.05,metalness:0.5}));
    lob.position.set(0, 2, currentD/2+1); scene.add(lob); ms.push(lob);

    // Lights
    const amb=new THREE.AmbientLight(0xffffff,0.7); scene.add(amb); ms.push(amb);
    const dir=new THREE.DirectionalLight(0xffeedd,1.1); dir.position.set(30,60,20); dir.castShadow=true; scene.add(dir); ms.push(dir);

    meshes.current=ms;
    const totalHeight = topY;
    setStats({ archetype, floors, width: currentW.toFixed(1), depth: currentD.toFixed(1), height: totalHeight.toFixed(1), material, roofType });
    setStatus(`✓ ${floors}-floor ${archetype} built — ${totalHeight.toFixed(0)}m tall`);
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>🏗 BUILDING SIMULATOR</div>
      <div style={S.section}>
        <label style={S.label}>Archetype</label>
        <select style={S.select} value={archetype} onChange={e=>setArchetype(e.target.value)}>
          {ARCHETYPES.map(a=><option key={a}>{a}</option>)}
        </select>
        <label style={S.label}>Floors: {floors}</label>
        <input style={S.input} type="range" min={1} max={100} value={floors} onChange={e=>setFloors(+e.target.value)}/>
        <label style={S.label}>Width: {width}m</label>
        <input style={S.input} type="range" min={4} max={60} value={width} onChange={e=>setWidth(+e.target.value)}/>
        <label style={S.label}>Depth: {depth}m</label>
        <input style={S.input} type="range" min={4} max={60} value={depth} onChange={e=>setDepth(+e.target.value)}/>
        <label style={S.label}>Facade Material</label>
        <select style={S.select} value={material} onChange={e=>setMaterial(e.target.value)}>
          {MATERIALS_B.map(m=><option key={m}>{m}</option>)}
        </select>
        <label style={S.label}>Roof Type</label>
        <select style={S.select} value={roofType} onChange={e=>setRoofType(e.target.value)}>
          {ROOF_TYPES.map(r=><option key={r}>{r}</option>)}
        </select>
        <label style={S.label}>Accent Color</label>
        <input style={{...S.input,padding:2,height:32}} type="color" value={color} onChange={e=>setColor(e.target.value)}/>
        <label style={{...S.label,cursor:"pointer"}}><input type="checkbox" checked={setback} onChange={e=>setSetback(e.target.checked)}/> Setback per 4 Floors</label>
      </div>
      <button style={S.btn} onClick={build}>⚡ Build</button>
      <button style={S.btnO} onClick={clearBuilding}>🗑 Clear</button>
      {status && <div style={{...S.stat,marginTop:8}}>{status}</div>}
      {stats && (
        <div style={S.section}>
          <div style={S.stat}>Type: {stats.archetype}</div>
          <div style={S.stat}>Floors: {stats.floors} | Height: {stats.height}m</div>
          <div style={S.stat}>Footprint: {stats.width}×{stats.depth}m</div>
          <div style={S.stat}>Material: {stats.material} | Roof: {stats.roofType}</div>
        </div>
      )}
    </div>
  );
}
'''.strip()

# ── 6. PHYSICS SIMULATION ────────────────────────────────────
panels["PhysicsSimulationPanel.jsx"] = r'''
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";

const S = {
  root: { background:"#06060f", color:"#e0e0e0", fontFamily:"JetBrains Mono,monospace", padding:16, height:"100%", overflowY:"auto" },
  h2: { color:"#00ffc8", fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:"#aaa", display:"block", marginBottom:4 },
  input: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  select: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  btn: { background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnO: { background:"#FF6600", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnRed: { background:"#cc2200", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  section: { background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:"#00ffc8", marginBottom:4 },
};

const SIM_TYPES = ["Rigid Body Drop","Domino Chain","Ball Pit","Cloth Simulation","Spring Chain","Pendulum Array","Wrecking Ball","Avalanche"];
const SHAPES = ["Box","Sphere","Cylinder","Cone","Torus"];

// Simple Verlet physics engine (no external lib needed)
class PhysicsBody {
  constructor(mesh, mass=1, restitution=0.5, friction=0.4){
    this.mesh=mesh; this.mass=mass; this.restitution=restitution; this.friction=friction;
    this.vel=new THREE.Vector3(); this.acc=new THREE.Vector3(); this.isStatic=mass===0;
    this.angVel=new THREE.Vector3((Math.random()-0.5)*0.2,(Math.random()-0.5)*0.2,(Math.random()-0.5)*0.2);
  }
  step(dt, gravity=-9.81){
    if(this.isStatic) return;
    this.acc.y = gravity;
    this.vel.addScaledVector(this.acc, dt);
    this.vel.multiplyScalar(0.995); // damping
    this.mesh.position.addScaledVector(this.vel, dt);
    this.mesh.rotation.x += this.angVel.x*dt;
    this.mesh.rotation.y += this.angVel.y*dt;
    this.mesh.rotation.z += this.angVel.z*dt;
    this.angVel.multiplyScalar(0.98);
    // Floor collision
    const r = this.mesh.geometry?.boundingSphere?.radius||0.5;
    if(this.mesh.position.y - r < 0){
      this.mesh.position.y = r;
      this.vel.y = -this.vel.y * this.restitution;
      this.vel.x *= (1-this.friction);
      this.vel.z *= (1-this.friction);
      this.angVel.multiplyScalar(0.7);
    }
  }
}

class ClothNode {
  constructor(x,y,z,pinned=false){
    this.pos=new THREE.Vector3(x,y,z); this.prev=this.pos.clone(); this.pinned=pinned;
  }
  integrate(dt,gravity=-9.81){
    if(this.pinned) return;
    const vel=this.pos.clone().sub(this.prev);
    this.prev.copy(this.pos);
    this.pos.add(vel.multiplyScalar(0.99));
    this.pos.y+=gravity*dt*dt;
  }
  constrain(other, restLen){
    const delta=other.pos.clone().sub(this.pos);
    const dist=delta.length();
    if(dist===0) return;
    const diff=(dist-restLen)/dist*0.5;
    const corr=delta.multiplyScalar(diff);
    if(!this.pinned) this.pos.add(corr);
    if(!other.pinned) other.pos.sub(corr);
  }
}

export default function PhysicsSimulationPanel({ scene }){
  const [simType, setSimType] = useState("Rigid Body Drop");
  const [shape, setShape] = useState("Box");
  const [count, setCount] = useState(20);
  const [gravity, setGravity] = useState(-9.81);
  const [restitution, setRestitution] = useState(0.5);
  const [friction, setFriction] = useState(0.4);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [frameCount, setFrameCount] = useState(0);
  const bodies = useRef([]);
  const clothNodes = useRef([]);
  const clothMesh = useRef(null);
  const simMeshes = useRef([]);
  const raf = useRef(null);
  const lastT = useRef(0);
  const fc = useRef(0);

  function geoForShape(sh){
    switch(sh){
      case "Sphere": return new THREE.SphereGeometry(0.5,8,8);
      case "Cylinder": return new THREE.CylinderGeometry(0.4,0.4,1,8);
      case "Cone": return new THREE.ConeGeometry(0.5,1,8);
      case "Torus": return new THREE.TorusGeometry(0.4,0.15,6,12);
      default: return new THREE.BoxGeometry(1,1,1);
    }
  }

  function clearSim(){
    cancelAnimationFrame(raf.current);
    bodies.current=[];
    clothNodes.current=[];
    simMeshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();});
    simMeshes.current=[];
    clothMesh.current=null;
    setRunning(false); setStatus(""); setFrameCount(0); fc.current=0;
  }

  function setupRigidDrop(){
    const ms=[];
    // Floor
    const flGeo=new THREE.BoxGeometry(30,0.5,30);
    const fl=new THREE.Mesh(flGeo,new THREE.MeshStandardMaterial({color:0x1a1a2e}));
    fl.position.y=-0.25; fl.receiveShadow=true; scene.add(fl); ms.push(fl);
    bodies.current.push(new PhysicsBody(fl,0)); // static
    // Objects
    for(let i=0;i<count;i++){
      const geo=geoForShape(shape);
      geo.computeBoundingSphere();
      const col=new THREE.Color().setHSL(i/count,0.8,0.5);
      const mat=new THREE.MeshStandardMaterial({color:col,roughness:0.6});
      const m=new THREE.Mesh(geo,mat);
      m.position.set((Math.random()-0.5)*8,10+i*1.5,(Math.random()-0.5)*8);
      m.castShadow=true;
      scene.add(m); ms.push(m);
      const b=new PhysicsBody(m,1,restitution,friction);
      b.vel.set((Math.random()-0.5)*2,0,(Math.random()-0.5)*2);
      bodies.current.push(b);
    }
    return ms;
  }

  function setupDomino(){
    const ms=[];
    const flGeo=new THREE.BoxGeometry(40,0.5,10);
    const fl=new THREE.Mesh(flGeo,new THREE.MeshStandardMaterial({color:0x1a1a2e}));
    fl.position.y=-0.25; scene.add(fl); ms.push(fl);
    bodies.current.push(new PhysicsBody(fl,0));
    for(let i=0;i<Math.min(count,30);i++){
      const geo=new THREE.BoxGeometry(0.5,2,1);
      const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(i/30,0.8,0.5)}));
      m.position.set(-15+i*1.1,1,0);
      scene.add(m); ms.push(m);
      const b=new PhysicsBody(m,1,restitution*0.3,0.6);
      bodies.current.push(b);
    }
    // Tip first domino
    if(bodies.current.length>1){ bodies.current[1].vel.x=3; bodies.current[1].angVel.z=-2; }
    return ms;
  }

  function setupCloth(){
    const ms=[];
    const res=12; const restLen=0.5;
    const nodes=[];
    for(let y=0;y<res;y++){
      for(let x=0;x<res;x++){
        const pinned=y===0;
        nodes.push(new ClothNode((x-res/2)*restLen, 6-(y*restLen), 0, pinned));
      }
    }
    clothNodes.current=nodes;
    // Cloth mesh via BufferGeometry
    const geo=new THREE.BufferGeometry();
    const positions=new Float32Array(res*res*3);
    const indices=[];
    for(let y=0;y<res-1;y++) for(let x=0;x<res-1;x++){
      const a=y*res+x, b=a+1, c=a+res, d=c+1;
      indices.push(a,b,c, b,d,c);
    }
    geo.setAttribute("position",new THREE.BufferAttribute(positions,3));
    geo.setIndex(indices);
    const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x4488cc,side:THREE.DoubleSide,wireframe:false}));
    scene.add(m); ms.push(m);
    clothMesh.current=m;
    return ms;
  }

  function start(){
    if(!scene){ setStatus("No scene"); return; }
    clearSim();
    setStatus(`Starting ${simType}…`);
    let ms=[];
    if(simType==="Cloth Simulation"){ ms=setupCloth(); }
    else if(simType==="Domino Chain"){ ms=setupDomino(); }
    else { ms=setupRigidDrop(); }
    // Ball Pit override
    if(simType==="Ball Pit"){ bodies.current.forEach(b=>{ if(!b.isStatic){ b.vel.y=0; b.mesh.position.y=8; } }); }
    const amb=new THREE.AmbientLight(0xffffff,0.7); scene.add(amb); ms.push(amb);
    const dir=new THREE.DirectionalLight(0xffeedd,1); dir.position.set(20,40,15); dir.castShadow=true; scene.add(dir); ms.push(dir);
    simMeshes.current=ms;
    setRunning(true);
    const tick=(t)=>{
      const dt=Math.min((t-lastT.current)/1000,0.033);
      lastT.current=t;
      // Rigid bodies
      bodies.current.forEach(b=>b.step(dt,gravity));
      // Cloth
      if(clothMesh.current && clothNodes.current.length){
        clothNodes.current.forEach(n=>n.integrate(dt,gravity));
        // Constraints (iterations)
        const res=12;
        for(let iter=0;iter<5;iter++){
          for(let y=0;y<res;y++) for(let x=0;x<res;x++){
            const i=y*res+x;
            if(x<res-1) clothNodes.current[i].constrain(clothNodes.current[i+1],0.5);
            if(y<res-1) clothNodes.current[i].constrain(clothNodes.current[i+res],0.5);
          }
          // Floor
          clothNodes.current.forEach(n=>{ if(n.pos.y<0.1) n.pos.y=0.1; });
        }
        const pos=clothMesh.current.geometry.attributes.position;
        clothNodes.current.forEach((n,i)=>{ pos.setXYZ(i,n.pos.x,n.pos.y,n.pos.z); });
        pos.needsUpdate=true;
        clothMesh.current.geometry.computeVertexNormals();
      }
      fc.current++;
      if(fc.current%10===0) setFrameCount(fc.current);
      raf.current=requestAnimationFrame(tick);
    };
    raf.current=requestAnimationFrame(tick);
    setStatus(`✓ ${simType} running`);
  }

  function pause(){ cancelAnimationFrame(raf.current); setRunning(false); setStatus("Paused"); }

  useEffect(()=>()=>cancelAnimationFrame(raf.current),[]);

  return (
    <div style={S.root}>
      <div style={S.h2}>⚛ PHYSICS SIMULATION</div>
      <div style={S.section}>
        <label style={S.label}>Simulation Type</label>
        <select style={S.select} value={simType} onChange={e=>setSimType(e.target.value)}>
          {SIM_TYPES.map(s=><option key={s}>{s}</option>)}
        </select>
        <label style={S.label}>Shape</label>
        <select style={S.select} value={shape} onChange={e=>setShape(e.target.value)}>
          {SHAPES.map(s=><option key={s}>{s}</option>)}
        </select>
        <label style={S.label}>Object Count: {count}</label>
        <input style={S.input} type="range" min={2} max={100} value={count} onChange={e=>setCount(+e.target.value)}/>
        <label style={S.label}>Gravity: {gravity.toFixed(2)} m/s²</label>
        <input style={S.input} type="range" min={-30} max={5} step={0.1} value={gravity} onChange={e=>setGravity(+e.target.value)}/>
        <label style={S.label}>Restitution (Bounce): {restitution.toFixed(2)}</label>
        <input style={S.input} type="range" min={0} max={1} step={0.01} value={restitution} onChange={e=>setRestitution(+e.target.value)}/>
        <label style={S.label}>Friction: {friction.toFixed(2)}</label>
        <input style={S.input} type="range" min={0} max={1} step={0.01} value={friction} onChange={e=>setFriction(+e.target.value)}/>
      </div>
      {!running
        ? <button style={S.btn} onClick={start}>▶ Start Sim</button>
        : <button style={S.btnRed} onClick={pause}>⏸ Pause</button>
      }
      <button style={S.btnO} onClick={clearSim}>🗑 Reset</button>
      {status && <div style={{...S.stat,marginTop:8}}>{status}</div>}
      {running && <div style={S.stat}>Frame: {frameCount}</div>}
    </div>
  );
}
'''.strip()

# ── 7. TERRAIN SCULPTING ────────────────────────────────────
panels["TerrainSculptingPanel.jsx"] = r'''
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";

const S = {
  root: { background:"#06060f", color:"#e0e0e0", fontFamily:"JetBrains Mono,monospace", padding:16, height:"100%", overflowY:"auto" },
  h2: { color:"#00ffc8", fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:"#aaa", display:"block", marginBottom:4 },
  input: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  select: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  btn: { background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnO: { background:"#FF6600", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  section: { background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:"#00ffc8", marginBottom:4 },
  toolBtn: (active) => ({ background:active?"#00ffc8":"#1a1a2e", color:active?"#06060f":"#e0e0e0", border:"1px solid #00ffc8", borderRadius:4, padding:"5px 12px", fontFamily:"JetBrains Mono,monospace", fontSize:11, cursor:"pointer", marginRight:6, marginBottom:6 }),
};

const BRUSHES = ["Raise","Lower","Smooth","Flatten","Noise","Plateau","Crater","Ridge"];
const TERRAIN_PRESETS = ["Flat Plain","Rolling Hills","Mountain Range","Canyon","Volcanic Island","Coastal","Desert Dunes","Arctic"];

function noise(x,z,oct=4){ let v=0,amp=1,freq=1; for(let i=0;i<oct;i++){ v+=Math.sin(x*freq*0.05+i)*Math.cos(z*freq*0.05+i*0.7)*amp; amp*=0.5; freq*=2; } return v; }

export default function TerrainSculptingPanel({ scene, camera }){
  const [brush, setBrush] = useState("Raise");
  const [brushSize, setBrushSize] = useState(3);
  const [brushStr, setBrushStr] = useState(0.5);
  const [falloff, setFalloff] = useState(0.7);
  const [resolution, setResolution] = useState(64);
  const [preset, setPreset] = useState("Rolling Hills");
  const [wireframe, setWireframe] = useState(false);
  const [status, setStatus] = useState("");
  const terrainRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const sculpting = useRef(false);

  function applyPreset(p, geo){
    const pos = geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i), z=pos.getZ(i);
      let h=0;
      switch(p){
        case "Rolling Hills": h=noise(x,z,3)*5; break;
        case "Mountain Range": h=Math.abs(noise(x,z,5))*18; break;
        case "Canyon": h=Math.max(0,Math.abs(noise(x,z,2))*10-4); break;
        case "Volcanic Island": { const d=Math.sqrt(x*x+z*z); h=Math.max(0,8-d*0.3)+noise(x,z,4)*2; break; }
        case "Coastal": h=Math.max(-2, noise(x,z,3)*6-1); break;
        case "Desert Dunes": h=Math.abs(Math.sin(x*0.15))*4+noise(x,z,2)*2; break;
        case "Arctic": h=noise(x,z,3)*3+Math.abs(noise(x*0.03,z*0.03,2))*8; break;
        default: h=0;
      }
      pos.setY(i,h);
    }
    geo.computeVertexNormals();
  }

  function createTerrain(){
    if(terrainRef.current){ scene.remove(terrainRef.current); terrainRef.current.geometry.dispose(); terrainRef.current.material.dispose(); terrainRef.current=null; }
    const geo=new THREE.PlaneGeometry(60,60,resolution,resolution);
    geo.rotateX(-Math.PI/2);
    applyPreset(preset, geo);
    const mat=new THREE.MeshStandardMaterial({ color:0x336633, wireframe, roughness:0.9, vertexColors:false });
    const m=new THREE.Mesh(geo,mat);
    m.receiveShadow=true; m.castShadow=true;
    scene.add(m); terrainRef.current=m;
    // Lights
    if(!scene.getObjectByName("terr_amb")){
      const a=new THREE.AmbientLight(0xffffff,0.6); a.name="terr_amb"; scene.add(a);
      const d=new THREE.DirectionalLight(0xffeedd,1); d.name="terr_dir"; d.position.set(30,50,20); d.castShadow=true; scene.add(d);
    }
    setStatus(`✓ ${preset} terrain — res ${resolution}×${resolution}`);
  }

  function sculpt(x,z,b,str){
    if(!terrainRef.current) return;
    const geo=terrainRef.current.geometry;
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const vx=pos.getX(i), vz=pos.getZ(i);
      const dist=Math.sqrt((vx-x)*(vx-x)+(vz-z)*(vz-z));
      if(dist>brushSize) continue;
      const w=Math.pow(1-dist/brushSize,falloff)*str*0.3;
      const cy=pos.getY(i);
      switch(b){
        case "Raise": pos.setY(i,cy+w); break;
        case "Lower": pos.setY(i,cy-w); break;
        case "Smooth": {
          let avg=0,cnt=0;
          for(let j=0;j<pos.count;j++){
            const d2=Math.sqrt((pos.getX(j)-vx)**2+(pos.getZ(j)-vz)**2);
            if(d2<brushSize){ avg+=pos.getY(j); cnt++; }
          }
          pos.setY(i,cy+(avg/cnt-cy)*w*0.5);
          break;
        }
        case "Flatten": pos.setY(i,cy+(0-cy)*w*0.3); break;
        case "Noise": pos.setY(i,cy+(Math.random()-0.5)*w*3); break;
        case "Plateau": { if(cy>3) pos.setY(i,cy+(5-cy)*w*0.5); break; }
        case "Crater": { const cw=1-dist/brushSize; pos.setY(i,cy-cw*cw*w*5+dist*w*0.5); break; }
        case "Ridge": pos.setY(i,cy+Math.abs(Math.sin(dist*1.5))*w*2); break;
      }
    }
    geo.computeVertexNormals();
    geo.attributes.position.needsUpdate=true;
  }

  function onSceneClick(e){
    if(!terrainRef.current || !camera) return;
    const canvas=e.target; if(!canvas) return;
    const rect=canvas.getBoundingClientRect();
    const nx=((e.clientX-rect.left)/rect.width)*2-1;
    const ny=-((e.clientY-rect.top)/rect.height)*2+1;
    const ray=raycasterRef.current;
    ray.setFromCamera({x:nx,y:ny},camera);
    const hits=ray.intersectObject(terrainRef.current,false);
    if(hits.length){ const p=hits[0].point; sculpt(p.x,p.z,brush,brushStr); }
  }

  useEffect(()=>{
    if(terrainRef.current) terrainRef.current.material.wireframe=wireframe;
  },[wireframe]);

  function smoothAll(){
    if(!terrainRef.current) return;
    const geo=terrainRef.current.geometry;
    const pos=geo.attributes.position;
    const copy=new Float32Array(pos.array);
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),z=pos.getZ(i);
      let avg=0,cnt=0;
      for(let j=0;j<pos.count;j++){
        const d=Math.sqrt((copy[j*3]-x)**2+(copy[j*3+2]-z)**2);
        if(d<2){ avg+=copy[j*3+1]; cnt++; }
      }
      pos.setY(i,avg/cnt);
    }
    geo.computeVertexNormals(); geo.attributes.position.needsUpdate=true;
    setStatus("Global smooth applied");
  }

  function exportHeightmap(){
    if(!terrainRef.current){ setStatus("No terrain"); return; }
    const geo=terrainRef.current.geometry;
    const pos=geo.attributes.position;
    const data=[]; let minH=Infinity,maxH=-Infinity;
    for(let i=0;i<pos.count;i++){ const y=pos.getY(i); minH=Math.min(minH,y); maxH=Math.max(maxH,y); }
    for(let i=0;i<pos.count;i++) data.push(((pos.getY(i)-minH)/(maxH-minH||1)*255)>>0);
    const json={resolution, size:60, minH, maxH, data};
    const b=new Blob([JSON.stringify(json)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="heightmap.json"; a.click();
    setStatus("Heightmap exported");
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>⛰ TERRAIN SCULPTING</div>
      <div style={S.section}>
        <label style={S.label}>Preset</label>
        <select style={S.select} value={preset} onChange={e=>setPreset(e.target.value)}>
          {TERRAIN_PRESETS.map(p=><option key={p}>{p}</option>)}
        </select>
        <label style={S.label}>Resolution: {resolution}×{resolution}</label>
        <input style={S.input} type="range" min={16} max={128} step={16} value={resolution} onChange={e=>setResolution(+e.target.value)}/>
        <button style={S.btn} onClick={createTerrain}>⚡ Generate Terrain</button>
        <label style={{...S.label,cursor:"pointer",marginTop:6}}><input type="checkbox" checked={wireframe} onChange={e=>setWireframe(e.target.checked)}/> Wireframe</label>
      </div>
      <div style={S.section}>
        <div style={S.label}>Brush Tool</div>
        <div style={{display:"flex",flexWrap:"wrap"}}>
          {BRUSHES.map(b=><button key={b} style={S.toolBtn(brush===b)} onClick={()=>setBrush(b)}>{b}</button>)}
        </div>
        <label style={S.label}>Brush Size: {brushSize}</label>
        <input style={S.input} type="range" min={0.5} max={15} step={0.5} value={brushSize} onChange={e=>setBrushSize(+e.target.value)}/>
        <label style={S.label}>Strength: {brushStr.toFixed(2)}</label>
        <input style={S.input} type="range" min={0.01} max={2} step={0.01} value={brushStr} onChange={e=>setBrushStr(+e.target.value)}/>
        <label style={S.label}>Falloff: {falloff.toFixed(2)}</label>
        <input style={S.input} type="range" min={0.1} max={3} step={0.05} value={falloff} onChange={e=>setFalloff(+e.target.value)}/>
        <div style={{fontSize:10,color:"#888",marginTop:6}}>Click viewport to sculpt with active brush</div>
      </div>
      <button style={S.btn} onClick={smoothAll}>🌊 Global Smooth</button>
      <button style={S.btnO} onClick={exportHeightmap}>💾 Export Heightmap</button>
      {status && <div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''.strip()

# ── 8. LIGHTING STUDIO ──────────────────────────────────────
panels["LightingStudioPanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const S = {
  root: { background:"#06060f", color:"#e0e0e0", fontFamily:"JetBrains Mono,monospace", padding:16, height:"100%", overflowY:"auto" },
  h2: { color:"#00ffc8", fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:"#aaa", display:"block", marginBottom:4 },
  input: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  select: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  btn: { background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnO: { background:"#FF6600", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnSm: { background:"#1a1a2e", color:"#00ffc8", border:"1px solid #00ffc8", borderRadius:4, padding:"3px 10px", fontFamily:"JetBrains Mono,monospace", fontSize:10, cursor:"pointer", marginLeft:6 },
  section: { background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:"#00ffc8", marginBottom:4 },
  lightRow: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #0d0d1a" },
};

const LIGHT_TYPES = ["Directional","Point","Spot","Hemisphere","Rect Area","Ambient"];
const PRESETS_L = ["Studio 3-Point","HDRI Outdoor Day","Night Scene","Sunset Golden Hour","Horror Dark","Sci-Fi Neon","Cinematic Dramatic","Overcast Soft"];
const SHADOW_MAPS = ["Basic","PCF","PCFSoft","VSM"];

export default function LightingStudioPanel({ scene, renderer }){
  const [lights, setLights] = useState([]);
  const [type, setType] = useState("Directional");
  const [color, setColor] = useState("#ffffff");
  const [intensity, setIntensity] = useState(1);
  const [castShadow, setCastShadow] = useState(true);
  const [posX, setPosX] = useState(10);
  const [posY, setPosY] = useState(20);
  const [posZ, setPosZ] = useState(10);
  const [preset, setPreset] = useState("Studio 3-Point");
  const [shadowMap, setShadowMap] = useState("PCFSoft");
  const [status, setStatus] = useState("");
  const lightRefs = useRef({});
  const helperRefs = useRef({});
  const nextId = useRef(0);

  function applyRendererShadow(sm){
    if(!renderer) return;
    renderer.shadowMap.enabled=true;
    const types={"Basic":THREE.BasicShadowMap,"PCF":THREE.PCFShadowMap,"PCFSoft":THREE.PCFSoftShadowMap,"VSM":THREE.VSMShadowMap};
    renderer.shadowMap.type=types[sm]||THREE.PCFSoftShadowMap;
    renderer.shadowMap.needsUpdate=true;
  }

  function addLight(){
    if(!scene){ setStatus("No scene"); return; }
    applyRendererShadow(shadowMap);
    const id=nextId.current++;
    const col=new THREE.Color(color);
    let light;
    switch(type){
      case "Point": light=new THREE.PointLight(col,intensity,50); break;
      case "Spot": light=new THREE.SpotLight(col,intensity,80,Math.PI/4,0.2); break;
      case "Hemisphere": light=new THREE.HemisphereLight(col,0x333344,intensity); break;
      case "Ambient": light=new THREE.AmbientLight(col,intensity); break;
      default: light=new THREE.DirectionalLight(col,intensity);
    }
    light.position.set(posX,posY,posZ);
    if(castShadow && light.shadow) light.castShadow=true;
    scene.add(light);
    lightRefs.current[id]=light;
    // Helper
    let helper=null;
    if(type==="Directional"){ helper=new THREE.DirectionalLightHelper(light,3); scene.add(helper); helperRefs.current[id]=helper; }
    else if(type==="Point"){ helper=new THREE.PointLightHelper(light,1); scene.add(helper); helperRefs.current[id]=helper; }
    else if(type==="Spot"){ helper=new THREE.SpotLightHelper(light); scene.add(helper); helperRefs.current[id]=helper; }
    const entry={id,type,color,intensity,castShadow,pos:[posX,posY,posZ]};
    setLights(prev=>[...prev,entry]);
    setStatus(`✓ ${type} light #${id} added`);
  }

  function removeLight(id){
    const l=lightRefs.current[id]; if(l){ scene.remove(l); }
    const h=helperRefs.current[id]; if(h){ scene.remove(h); }
    delete lightRefs.current[id]; delete helperRefs.current[id];
    setLights(prev=>prev.filter(l=>l.id!==id));
  }

  function clearAll(){
    lights.forEach(l=>removeLight(l.id));
    setLights([]); setStatus("All lights cleared");
  }

  function applyPreset(p){
    clearAll();
    setTimeout(()=>{
      const configs = {
        "Studio 3-Point": [
          {type:"Directional",color:"#fff8ee",intensity:1.2,pos:[10,20,10]},
          {type:"Point",color:"#aaccff",intensity:0.5,pos:[-10,10,-5]},
          {type:"Point",color:"#ffeedd",intensity:0.3,pos:[0,5,15]},
        ],
        "HDRI Outdoor Day": [
          {type:"Hemisphere",color:"#87ceeb",intensity:0.8,pos:[0,1,0]},
          {type:"Directional",color:"#fff8dd",intensity:1.5,pos:[50,80,30]},
        ],
        "Night Scene": [
          {type:"Ambient",color:"#111133",intensity:0.3,pos:[0,0,0]},
          {type:"Point",color:"#4466ff",intensity:0.8,pos:[5,8,5]},
          {type:"Point",color:"#FF6600",intensity:0.4,pos:[-8,3,-3]},
        ],
        "Sunset Golden Hour": [
          {type:"Directional",color:"#ff8820",intensity:1.4,pos:[-30,5,10]},
          {type:"Hemisphere",color:"#ffddaa",intensity:0.6,pos:[0,1,0]},
        ],
        "Horror Dark": [
          {type:"Ambient",color:"#050508",intensity:0.2,pos:[0,0,0]},
          {type:"Point",color:"#300000",intensity:0.6,pos:[0,3,0]},
          {type:"Spot",color:"#ff2200",intensity:0.3,pos:[0,10,0]},
        ],
        "Sci-Fi Neon": [
          {type:"Ambient",color:"#000022",intensity:0.3,pos:[0,0,0]},
          {type:"Point",color:"#00ffc8",intensity:1,pos:[5,5,5]},
          {type:"Point",color:"#FF6600",intensity:0.8,pos:[-5,3,-5]},
          {type:"Spot",color:"#8800ff",intensity:0.6,pos:[0,15,0]},
        ],
        "Cinematic Dramatic": [
          {type:"Directional",color:"#fff5ee",intensity:2,pos:[15,25,5]},
          {type:"Ambient",color:"#111118",intensity:0.2,pos:[0,0,0]},
        ],
        "Overcast Soft": [
          {type:"Hemisphere",color:"#ccddee",intensity:1,pos:[0,1,0]},
          {type:"Ambient",color:"#aabbcc",intensity:0.4,pos:[0,0,0]},
        ],
      };
      const cfg=configs[p]||configs["Studio 3-Point"];
      cfg.forEach(c=>{
        setType(c.type); setColor(c.color); setIntensity(c.intensity);
        setPosX(c.pos[0]); setPosY(c.pos[1]); setPosZ(c.pos[2]);
        setCastShadow(true);
        // Direct add
        const id=nextId.current++;
        const col=new THREE.Color(c.color);
        let light;
        switch(c.type){
          case "Point": light=new THREE.PointLight(col,c.intensity,50); break;
          case "Spot": light=new THREE.SpotLight(col,c.intensity,80,Math.PI/4,0.2); break;
          case "Hemisphere": light=new THREE.HemisphereLight(col,0x333344,c.intensity); break;
          case "Ambient": light=new THREE.AmbientLight(col,c.intensity); break;
          default: light=new THREE.DirectionalLight(col,c.intensity);
        }
        light.position.set(...c.pos);
        if(light.shadow) light.castShadow=true;
        scene.add(light);
        lightRefs.current[id]=light;
        setLights(prev=>[...prev,{id,type:c.type,color:c.color,intensity:c.intensity,castShadow:true,pos:c.pos}]);
      });
      setStatus(`✓ ${p} preset applied`);
    },0);
  }

  function exportSetup(){
    const data=lights.map(l=>({...l}));
    const b=new Blob([JSON.stringify({preset,shadowMap,lights:data},null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="lighting.json"; a.click();
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>💡 LIGHTING STUDIO</div>
      <div style={S.section}>
        <label style={S.label}>Preset</label>
        <select style={S.select} value={preset} onChange={e=>{setPreset(e.target.value); applyPreset(e.target.value);}}>
          {PRESETS_L.map(p=><option key={p}>{p}</option>)}
        </select>
        <label style={S.label}>Shadow Map Type</label>
        <select style={S.select} value={shadowMap} onChange={e=>{setShadowMap(e.target.value); applyRendererShadow(e.target.value);}}>
          {SHADOW_MAPS.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={S.section}>
        <label style={S.label}>Light Type</label>
        <select style={S.select} value={type} onChange={e=>setType(e.target.value)}>
          {LIGHT_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <label style={S.label}>Color</label>
        <input style={{...S.input,padding:2,height:32}} type="color" value={color} onChange={e=>setColor(e.target.value)}/>
        <label style={S.label}>Intensity: {intensity.toFixed(2)}</label>
        <input style={S.input} type="range" min={0} max={5} step={0.05} value={intensity} onChange={e=>setIntensity(+e.target.value)}/>
        <label style={S.label}>Position X:{posX} Y:{posY} Z:{posZ}</label>
        <input style={S.input} type="range" min={-50} max={50} value={posX} onChange={e=>setPosX(+e.target.value)}/>
        <input style={S.input} type="range" min={0} max={100} value={posY} onChange={e=>setPosY(+e.target.value)}/>
        <input style={S.input} type="range" min={-50} max={50} value={posZ} onChange={e=>setPosZ(+e.target.value)}/>
        <label style={{...S.label,cursor:"pointer"}}><input type="checkbox" checked={castShadow} onChange={e=>setCastShadow(e.target.checked)}/> Cast Shadow</label>
        <button style={S.btn} onClick={addLight}>+ Add Light</button>
      </div>
      {lights.length>0 && (
        <div style={S.section}>
          <div style={S.label}>Active Lights ({lights.length})</div>
          {lights.map(l=>(
            <div key={l.id} style={S.lightRow}>
              <span style={{fontSize:10}}>#{l.id} {l.type} <span style={{color:l.color}}>■</span> {l.intensity.toFixed(1)}</span>
              <button style={S.btnSm} onClick={()=>removeLight(l.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <button style={S.btnO} onClick={clearAll}>🗑 Clear All</button>
      <button style={S.btn} onClick={exportSetup}>💾 Export</button>
      {status && <div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''.strip()

# ── 9. MATERIAL & TEXTURE STUDIO ────────────────────────────
panels["MaterialTexturePanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const S = {
  root: { background:"#06060f", color:"#e0e0e0", fontFamily:"JetBrains Mono,monospace", padding:16, height:"100%", overflowY:"auto" },
  h2: { color:"#00ffc8", fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:"#aaa", display:"block", marginBottom:4 },
  input: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  select: { width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", color:"#e0e0e0", padding:"4px 8px", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, marginBottom:10, boxSizing:"border-box" },
  btn: { background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  btnO: { background:"#FF6600", color:"#fff", border:"none", borderRadius:4, padding:"7px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:8, marginBottom:8 },
  section: { background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:"#00ffc8", marginBottom:4 },
  prev: { width:80, height:80, borderRadius:6, border:"2px solid #00ffc8", display:"inline-block", verticalAlign:"middle", marginRight:10 },
};

const MAT_PRESETS = {
  "PBR Metal": { color:"#667788", roughness:0.1, metalness:1.0, envMapIntensity:1.0 },
  "Rough Stone": { color:"#667766", roughness:0.95, metalness:0.0 },
  "Glossy Plastic": { color:"#ff4444", roughness:0.2, metalness:0.0 },
  "Gold": { color:"#ffd700", roughness:0.15, metalness:1.0 },
  "Skin": { color:"#e8a87c", roughness:0.7, metalness:0.0 },
  "Glass": { color:"#88ccff", roughness:0.0, metalness:0.0, transparent:true, opacity:0.25 },
  "Carbon Fiber": { color:"#111122", roughness:0.3, metalness:0.8 },
  "Velvet": { color:"#6633aa", roughness:1.0, metalness:0.0 },
  "Neon Teal": { color:"#00ffc8", roughness:0.4, metalness:0.5, emissive:"#00ffc8", emissiveIntensity:0.4 },
  "Lava": { color:"#ff4400", roughness:0.8, metalness:0.0, emissive:"#ff2200", emissiveIntensity:0.6 },
  "Ice": { color:"#aaddff", roughness:0.05, metalness:0.0, transparent:true, opacity:0.8 },
  "Wood Oak": { color:"#8b6340", roughness:0.85, metalness:0.0 },
};

const TEXTURE_PATTERNS = ["Checker","Bricks","Perlin Noise","Grid","Voronoi","Gradient","Marble","Hexagons","Wood Grain","Circuit Board"];

function generateTextureCanvas(pattern, col1, col2, size=256){
  const canvas=document.createElement("canvas"); canvas.width=canvas.height=size;
  const ctx=canvas.getContext("2d");
  const c1=col1||"#00ffc8", c2=col2||"#06060f";
  ctx.fillStyle=c2; ctx.fillRect(0,0,size,size);
  switch(pattern){
    case "Checker": {
      const s=size/8;
      for(let y=0;y<8;y++) for(let x=0;x<8;x++){
        if((x+y)%2===0){ ctx.fillStyle=c1; ctx.fillRect(x*s,y*s,s,s); }
      }
      break;
    }
    case "Bricks": {
      ctx.fillStyle=c1;
      const bw=size/6, bh=size/10;
      for(let row=0;row<10;row++){
        const offset=(row%2)*bw/2;
        for(let col=-1;col<7;col++){
          ctx.fillRect(offset+col*bw+1, row*bh+1, bw-2, bh-2);
        }
      }
      break;
    }
    case "Grid": {
      ctx.strokeStyle=c1; ctx.lineWidth=1;
      const step=size/16;
      for(let i=0;i<=size;i+=step){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke(); }
      break;
    }
    case "Perlin Noise": {
      const id=ctx.createImageData(size,size);
      for(let i=0;i<size*size;i++){
        const x=i%size, y=Math.floor(i/size);
        const v=(Math.sin(x*0.05)*Math.cos(y*0.05)*0.5+Math.sin(x*0.1+y*0.08)*0.3+Math.sin(x*0.02+1)*Math.cos(y*0.03+0.5)*0.2+1)*0.5;
        const r=parseInt(c1.slice(1,3),16)*v+parseInt(c2.slice(1,3),16)*(1-v);
        const g=parseInt(c1.slice(3,5),16)*v+parseInt(c2.slice(3,5),16)*(1-v);
        const b=parseInt(c1.slice(5,7),16)*v+parseInt(c2.slice(5,7),16)*(1-v);
        id.data[i*4]=r; id.data[i*4+1]=g; id.data[i*4+2]=b; id.data[i*4+3]=255;
      }
      ctx.putImageData(id,0,0);
      break;
    }
    case "Gradient": {
      const grad=ctx.createLinearGradient(0,0,size,size);
      grad.addColorStop(0,c1); grad.addColorStop(1,c2);
      ctx.fillStyle=grad; ctx.fillRect(0,0,size,size);
      break;
    }
    case "Marble": {
      const id=ctx.createImageData(size,size);
      for(let i=0;i<size*size;i++){
        const x=i%size,y=Math.floor(i/size);
        const v=Math.sin((x+y*Math.sin(y*0.02))*0.05+Math.sin(x*0.03)*3)*0.5+0.5;
        id.data[i*4]=200+v*55; id.data[i*4+1]=200+v*55; id.data[i*4+2]=210+v*45; id.data[i*4+3]=255;
      }
      ctx.putImageData(id,0,0);
      break;
    }
    case "Hexagons": {
      const hw=size/8, hh=hw*Math.sqrt(3)/2;
      ctx.strokeStyle=c1; ctx.lineWidth=2;
      for(let row=0;row<12;row++) for(let col=0;col<12;col++){
        const cx=(col+(row%2)*0.5)*hw*2; const cy=row*hh*2;
        ctx.beginPath();
        for(let i=0;i<6;i++){ const a=i*Math.PI/3; ctx.lineTo(cx+hw*Math.cos(a),cy+hw*Math.sin(a)); }
        ctx.closePath(); ctx.stroke();
      }
      break;
    }
    case "Circuit Board": {
      ctx.strokeStyle=c1; ctx.lineWidth=2;
      const step=size/12;
      for(let i=0;i<12;i++){
        ctx.beginPath(); ctx.moveTo(i*step,0); ctx.lineTo(i*step,size); ctx.stroke();
        if(Math.random()>0.4){ ctx.beginPath(); ctx.moveTo(i*step,Math.random()*size); ctx.lineTo((i+Math.round(Math.random()*4))*step,Math.random()*size); ctx.stroke(); }
      }
      for(let j=0;j<20;j++){
        const x=Math.random()*size,y=Math.random()*size,r=2+Math.random()*4;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=c1; ctx.fill();
      }
      break;
    }
    default: { ctx.fillStyle=c1; ctx.fillRect(0,0,size,size); }
  }
  return canvas;
}

export default function MaterialTexturePanel({ scene }){
  const [selectedPreset, setSelectedPreset] = useState("PBR Metal");
  const [color, setColor] = useState("#667788");
  const [roughness, setRoughness] = useState(0.1);
  const [metalness, setMetalness] = useState(1.0);
  const [emissive, setEmissive] = useState("#000000");
  const [emissiveInt, setEmissiveInt] = useState(0);
  const [transparent, setTransparent] = useState(false);
  const [opacity, setOpacity] = useState(1.0);
  const [wireframe, setWireframe] = useState(false);
  const [flatShade, setFlatShade] = useState(false);
  const [pattern, setPattern] = useState("Checker");
  const [texCol1, setTexCol1] = useState("#00ffc8");
  const [texCol2, setTexCol2] = useState("#06060f");
  const [texPreview, setTexPreview] = useState(null);
  const [status, setStatus] = useState("");
  const previewRef = useRef(null);
  const previewScene = useRef(null);
  const previewMesh = useRef(null);

  function loadPreset(p){
    setSelectedPreset(p);
    const cfg=MAT_PRESETS[p];
    if(!cfg) return;
    setColor(cfg.color||"#888888");
    setRoughness(cfg.roughness??0.5);
    setMetalness(cfg.metalness??0);
    setEmissive(cfg.emissive||"#000000");
    setEmissiveInt(cfg.emissiveIntensity||0);
    setTransparent(cfg.transparent||false);
    setOpacity(cfg.opacity??1);
  }

  function buildMaterial(tex=null){
    const mat=new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness, metalness,
      emissive: new THREE.Color(emissive),
      emissiveIntensity: emissiveInt,
      transparent, opacity, wireframe,
      flatShading: flatShade,
    });
    if(tex) mat.map=tex;
    return mat;
  }

  function applyToSelected(){
    if(!scene){ setStatus("No scene"); return; }
    let count=0;
    scene.traverse(obj=>{
      if(obj.isMesh && obj.userData.selected){
        obj.material=buildMaterial();
        obj.material.needsUpdate=true;
        count++;
      }
    });
    if(count===0){
      // Apply to all meshes if nothing selected
      scene.traverse(obj=>{ if(obj.isMesh){ obj.material=buildMaterial(); obj.material.needsUpdate=true; count++; } });
    }
    setStatus(`✓ Material applied to ${count} mesh(es)`);
  }

  function generateTexture(){
    const canvas=generateTextureCanvas(pattern,texCol1,texCol2);
    const url=canvas.toDataURL();
    setTexPreview(url);
    setStatus(`✓ ${pattern} texture generated`);
    return canvas;
  }

  function applyTexture(){
    const canvas=generateTextureCanvas(pattern,texCol1,texCol2);
    const tex=new THREE.CanvasTexture(canvas);
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
    tex.repeat.set(2,2);
    if(!scene){ setStatus("No scene"); return; }
    let count=0;
    scene.traverse(obj=>{
      if(obj.isMesh){ obj.material=buildMaterial(tex); obj.material.needsUpdate=true; count++; }
    });
    setStatus(`✓ ${pattern} texture applied to ${count} mesh(es)`);
  }

  function downloadTexture(){
    const canvas=generateTextureCanvas(pattern,texCol1,texCol2,512);
    const a=document.createElement("a"); a.href=canvas.toDataURL("image/png"); a.download=`spx_${pattern.replace(/ /g,"_").toLowerCase()}.png`; a.click();
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>🎨 MATERIAL & TEXTURE STUDIO</div>
      <div style={S.section}>
        <label style={S.label}>Material Preset</label>
        <select style={S.select} value={selectedPreset} onChange={e=>loadPreset(e.target.value)}>
          {Object.keys(MAT_PRESETS).map(p=><option key={p}>{p}</option>)}
        </select>
        <label style={S.label}>Base Color</label>
        <input style={{...S.input,padding:2,height:32}} type="color" value={color} onChange={e=>setColor(e.target.value)}/>
        <label style={S.label}>Roughness: {roughness.toFixed(2)}</label>
        <input style={S.input} type="range" min={0} max={1} step={0.01} value={roughness} onChange={e=>setRoughness(+e.target.value)}/>
        <label style={S.label}>Metalness: {metalness.toFixed(2)}</label>
        <input style={S.input} type="range" min={0} max={1} step={0.01} value={metalness} onChange={e=>setMetalness(+e.target.value)}/>
        <label style={S.label}>Emissive Color</label>
        <input style={{...S.input,padding:2,height:32}} type="color" value={emissive} onChange={e=>setEmissive(e.target.value)}/>
        <label style={S.label}>Emissive Intensity: {emissiveInt.toFixed(2)}</label>
        <input style={S.input} type="range" min={0} max={3} step={0.01} value={emissiveInt} onChange={e=>setEmissiveInt(+e.target.value)}/>
        <div style={{display:"flex",gap:16,marginBottom:8}}>
          <label style={{...S.label,cursor:"pointer"}}><input type="checkbox" checked={transparent} onChange={e=>setTransparent(e.target.checked)}/> Transparent</label>
          <label style={{...S.label,cursor:"pointer"}}><input type="checkbox" checked={wireframe} onChange={e=>setWireframe(e.target.checked)}/> Wireframe</label>
          <label style={{...S.label,cursor:"pointer"}}><input type="checkbox" checked={flatShade} onChange={e=>setFlatShade(e.target.checked)}/> Flat Shade</label>
        </div>
        {transparent && <>
          <label style={S.label}>Opacity: {opacity.toFixed(2)}</label>
          <input style={S.input} type="range" min={0} max={1} step={0.01} value={opacity} onChange={e=>setOpacity(+e.target.value)}/>
        </>}
        <button style={S.btn} onClick={applyToSelected}>✓ Apply Material</button>
      </div>
      <div style={S.section}>
        <label style={S.label}>Procedural Texture</label>
        <select style={S.select} value={pattern} onChange={e=>setPattern(e.target.value)}>
          {TEXTURE_PATTERNS.map(p=><option key={p}>{p}</option>)}
        </select>
        <div style={{display:"flex",gap:12,marginBottom:8}}>
          <div>
            <label style={{...S.label,fontSize:10}}>Color A</label>
            <input type="color" value={texCol1} onChange={e=>setTexCol1(e.target.value)} style={{width:48,height:28,border:"none",background:"none"}}/>
          </div>
          <div>
            <label style={{...S.label,fontSize:10}}>Color B</label>
            <input type="color" value={texCol2} onChange={e=>setTexCol2(e.target.value)} style={{width:48,height:28,border:"none",background:"none"}}/>
          </div>
        </div>
        {texPreview && <img src={texPreview} style={{width:80,height:80,borderRadius:4,border:"2px solid #00ffc8",marginBottom:8,display:"block"}} alt="preview"/>}
        <button style={S.btn} onClick={generateTexture}>👁 Preview</button>
        <button style={S.btn} onClick={applyTexture}>✓ Apply Texture</button>
        <button style={S.btnO} onClick={downloadTexture}>💾 Download PNG</button>
      </div>
      {status && <div style={{...S.stat,marginTop:4}}>{status}</div>}
    </div>
  );
}
'''.strip()

# ─────────────────────────────────────────────────────────────
# WRITE PANEL FILES
# ─────────────────────────────────────────────────────────────
print("Writing panel files...")
for filename, content in panels.items():
    dest = os.path.join(PANELS_DIR, filename)
    with open(dest, "w") as f:
        f.write(content)
    print(f"  ✓ {filename}")

# ─────────────────────────────────────────────────────────────
# PATCH MeshEditorApp.jsx  (or App.jsx) to import + render panels
# ─────────────────────────────────────────────────────────────
APP_CANDIDATES = [
    os.path.join(REPO, "src", "MeshEditorApp.jsx"),
    os.path.join(REPO, "src", "App.jsx"),
    os.path.join(REPO, "src", "components", "MeshEditorApp.jsx"),
]
app_file = None
for c in APP_CANDIDATES:
    if os.path.exists(c):
        app_file = c; break

PANEL_IMPORTS = "\n".join([
    f"import CityGeneratorPanel from './panels/CityGeneratorPanel';",
    f"import VRPreviewPanel from './panels/VRPreviewPanel';",
    f"import CrowdGeneratorPanel from './panels/CrowdGeneratorPanel';",
    f"import EnvironmentGeneratorPanel from './panels/EnvironmentGeneratorPanel';",
    f"import BuildingSimulatorPanel from './panels/BuildingSimulatorPanel';",
    f"import PhysicsSimulationPanel from './panels/PhysicsSimulationPanel';",
    f"import TerrainSculptingPanel from './panels/TerrainSculptingPanel';",
    f"import LightingStudioPanel from './panels/LightingStudioPanel';",
    f"import MaterialTexturePanel from './panels/MaterialTexturePanel';",
])

if app_file:
    with open(app_file, "r") as f:
        src = f.read()
    if "CityGeneratorPanel" not in src:
        # Inject after last existing import block
        import re
        last_import = list(re.finditer(r"^import .+", src, re.MULTILINE))
        if last_import:
            end = last_import[-1].end()
            src = src[:end] + "\n" + PANEL_IMPORTS + src[end:]
        else:
            src = PANEL_IMPORTS + "\n" + src
        with open(app_file, "w") as f:
            f.write(src)
        print(f"\n✓ Imports injected into {app_file}")
    else:
        print(f"\n⚠ Imports already present in {app_file}")
else:
    print("\n⚠ App file not found — imports NOT auto-injected.")
    print("  Add these manually to your main app file:")
    print(PANEL_IMPORTS)

print("\n✅ All 9 panels installed to", PANELS_DIR)
print("Run: npm run build")
