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