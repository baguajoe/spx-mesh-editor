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