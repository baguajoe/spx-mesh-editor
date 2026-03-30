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