import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";

const S = {
  root:{ background:"#06060f", color:"#e0e0e0", fontFamily:"JetBrains Mono,monospace", padding:12, height:"100%", overflowY:"auto", fontSize:12 },
  h2:{ color:"#00ffc8", fontSize:13, marginBottom:10, letterSpacing:1 },
  sec:{ background:"#0d1117", border:"1px solid #21262d", borderRadius:6, padding:10, marginBottom:8 },
  lbl:{ fontSize:10, color:"#8b949e", display:"block", marginBottom:3 },
  inp:{ width:"100%", accentColor:"#00ffc8", cursor:"pointer", marginBottom:8 },
  btn:{ background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, padding:"7px 14px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:6, marginBottom:6 },
  btnO:{ background:"#FF6600", color:"#fff", border:"none", borderRadius:4, padding:"7px 14px", fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginRight:6, marginBottom:6 },
  badge:(a,v)=>({ padding:"3px 8px", fontSize:9, borderRadius:4, cursor:"pointer", fontWeight:600, marginRight:3, marginBottom:3, background:a===v?"#00ffc8":"#21262d", color:a===v?"#06060f":"#8b949e", border:`1px solid ${a===v?"#00ffc8":"#30363d"}` }),
};

const FORMATIONS = ["Random","Grid","Circle","March","Street","Concert","Stadium"];
const SKIN_TONES = ["#f5c5a0","#e8a87c","#c68642","#8d5524","#4a2c0a"];

function buildPerson(scene, ox, oz, scale, skinTone) {
  const ms = [];
  const skin = new THREE.Color(skinTone);
  const shirt = new THREE.Color(`hsl(${Math.floor(Math.random()*360)},55%,40%)`);
  const pants = new THREE.Color(`hsl(${Math.floor(Math.random()*60)+200},30%,30%)`);
  const hair  = new THREE.Color(`hsl(${Math.floor(Math.random()*40)},35%,${15+Math.floor(Math.random()*35)}%)`);
  const shoe  = new THREE.Color(0x222211);
  const s = scale;

  const add = (geo, x, y, z, color, r=0.8, me=0.0) => {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color, roughness:r, metalness:me}));
    m.position.set(ox+x, y, oz+z); m.castShadow=true; scene.add(m); ms.push(m); return m;
  };

  // Legs
  add(new THREE.CylinderGeometry(0.07*s, 0.065*s, 0.44*s, 8), -0.09*s, 0.62*s, 0, pants);
  add(new THREE.CylinderGeometry(0.065*s, 0.06*s, 0.40*s, 8), -0.09*s, 0.20*s, 0, pants);
  add(new THREE.CylinderGeometry(0.07*s, 0.065*s, 0.44*s, 8),  0.09*s, 0.62*s, 0, pants);
  add(new THREE.CylinderGeometry(0.065*s, 0.06*s, 0.40*s, 8),  0.09*s, 0.20*s, 0, pants);
  // Shoes
  add(new THREE.BoxGeometry(0.13*s, 0.07*s, 0.18*s), -0.09*s, 0.04*s,  0.03*s, shoe);
  add(new THREE.BoxGeometry(0.13*s, 0.07*s, 0.18*s),  0.09*s, 0.04*s,  0.03*s, shoe);
  // Hips
  add(new THREE.BoxGeometry(0.30*s, 0.20*s, 0.20*s), 0, 0.94*s, 0, pants);
  // Torso
  add(new THREE.BoxGeometry(0.32*s, 0.45*s, 0.22*s), 0, 1.22*s, 0, shirt);
  // Arms
  add(new THREE.CylinderGeometry(0.055*s, 0.05*s, 0.38*s, 7), -0.21*s, 1.18*s, 0, shirt);
  add(new THREE.CylinderGeometry(0.05*s, 0.045*s, 0.34*s, 7), -0.21*s, 0.80*s, 0, skin);
  add(new THREE.CylinderGeometry(0.055*s, 0.05*s, 0.38*s, 7),  0.21*s, 1.18*s, 0, shirt);
  add(new THREE.CylinderGeometry(0.05*s, 0.045*s, 0.34*s, 7),  0.21*s, 0.80*s, 0, skin);
  // Hands
  add(new THREE.SphereGeometry(0.052*s, 7, 6), -0.21*s, 0.62*s, 0, skin);
  add(new THREE.SphereGeometry(0.052*s, 7, 6),  0.21*s, 0.62*s, 0, skin);
  // Neck
  add(new THREE.CylinderGeometry(0.055*s, 0.06*s, 0.12*s, 8), 0, 1.56*s, 0, skin);
  // Head
  add(new THREE.SphereGeometry(0.13*s, 10, 8), 0, 1.72*s, 0, skin);
  // Hair
  add(new THREE.SphereGeometry(0.135*s, 10, 6, 0, Math.PI*2, 0, Math.PI*0.55), 0, 1.82*s, 0, hair);

  return ms;
}

function getPositions(formation, count, spread) {
  const pos = [], sp = spread*2+2;
  if (formation === "Grid") {
    const cols = Math.ceil(Math.sqrt(count));
    for(let i=0;i<count;i++) pos.push([(i%cols-cols/2)*sp, Math.floor(i/cols)*sp-cols/2*sp]);
  } else if (formation === "Circle") {
    for(let i=0;i<count;i++) { const a=i/count*Math.PI*2, r=sp*count*0.12; pos.push([Math.cos(a)*r, Math.sin(a)*r]); }
  } else if (formation === "March") {
    const cols=Math.max(2,Math.floor(Math.sqrt(count)*0.6));
    for(let i=0;i<count;i++) pos.push([(i%cols-cols/2)*sp*0.8, Math.floor(i/cols)*sp]);
  } else if (formation === "Concert") {
    for(let i=0;i<count;i++) { const a=(Math.random()-0.5)*Math.PI*1.2, r=sp*(1+Math.random())*count*0.08; pos.push([Math.cos(a)*r, Math.sin(a)*r*0.5]); }
  } else if (formation === "Stadium") {
    let placed=0; const rings=Math.ceil(Math.sqrt(count/8));
    for(let r=1;r<=rings&&placed<count;r++) { const n=Math.min(Math.round(8*r),count-placed); for(let i=0;i<n;i++){const a=i/n*Math.PI*2; pos.push([Math.cos(a)*r*sp*1.5,Math.sin(a)*r*sp]); placed++;} }
  } else if (formation === "Street") {
    const side=Math.ceil(count/2);
    for(let i=0;i<count;i++) pos.push([(i<side?-1:1)*sp*1.2,(i%side-side/2)*sp*0.9]);
  } else {
    for(let i=0;i<count;i++) pos.push([(Math.random()-0.5)*sp*count*0.18,(Math.random()-0.5)*sp*count*0.18]);
  }
  return pos;
}

export default function ProceduralCrowdGenerator({ sceneRef, setStatus }) {
  const mountRef   = useRef(null);
  const rendererRef= useRef(null);
  const sceneRef2  = useRef(null);
  const cameraRef  = useRef(null);
  const frameRef   = useRef(null);
  const meshesRef  = useRef([]);

  const [formation, setFormation] = useState("Random");
  const [npcCount,  setNpcCount]  = useState(20);
  const [spread,    setSpread]    = useState(1.5);
  const [bodyScale, setBodyScale] = useState(1.0);
  const [diversity, setDiversity] = useState(true);
  const [skinTone,  setSkinTone]  = useState("#c68642");

  useEffect(() => {
    const mount = mountRef.current; if(!mount) return;
    const W=mount.clientWidth||780, H=320;
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x06060f);
    sceneRef2.current=scene;
    const camera=new THREE.PerspectiveCamera(50,W/H,0.1,500);
    camera.position.set(0,8,18); camera.lookAt(0,1,0);
    cameraRef.current=camera;
    const renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(W,H); renderer.shadowMap.enabled=true;
    mount.appendChild(renderer.domElement);
    rendererRef.current=renderer;
    scene.add(new THREE.AmbientLight(0xffffff,0.7));
    const dir=new THREE.DirectionalLight(0xffeedd,1.2); dir.position.set(10,20,10); dir.castShadow=true; scene.add(dir);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x111a11,roughness:0.95}));
    ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
    scene.add(new THREE.GridHelper(60,30,0x1a2a1a,0x1a2a1a));
    let angle=0;
    function animate(){ frameRef.current=requestAnimationFrame(animate); angle+=0.003; camera.position.set(Math.sin(angle)*22,8+Math.sin(angle*0.4)*2,Math.cos(angle)*22); camera.lookAt(0,1,0); renderer.render(scene,camera); }
    animate();
    generate(scene);
    return ()=>{ cancelAnimationFrame(frameRef.current); renderer.dispose(); if(mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement); };
  },[]);

  function generate(sc) {
    const scene=sc||sceneRef2.current; if(!scene) return;
    meshesRef.current.forEach(m=>{ scene.remove(m); m.geometry?.dispose(); m.material?.dispose(); });
    meshesRef.current=[];
    const positions=getPositions(formation,npcCount,spread);
    const tones=diversity?SKIN_TONES:[skinTone];
    const all=[];
    positions.forEach(([x,z],i)=>{
      const ms=buildPerson(scene,x,z,bodyScale,tones[i%tones.length]);
      all.push(...ms);
    });
    meshesRef.current=all;
    setStatus?.(`✓ ${positions.length} people — ${all.length} meshes`);
  }

  function clear() {
    const scene=sceneRef2.current; if(!scene) return;
    meshesRef.current.forEach(m=>{ scene.remove(m); m.geometry?.dispose(); m.material?.dispose(); });
    meshesRef.current=[];
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>👥 CROWD GENERATOR</div>
      <div ref={mountRef} style={{width:"100%",height:320,borderRadius:6,marginBottom:10,border:"1px solid #21262d",overflow:"hidden"}}/>
      <div style={S.sec}>
        <div style={S.lbl}>Formation</div>
        <div style={{display:"flex",flexWrap:"wrap",marginBottom:8}}>
          {FORMATIONS.map(f=><button key={f} style={S.badge(formation,f)} onClick={()=>setFormation(f)}>{f}</button>)}
        </div>
        <label style={S.lbl}>NPC Count: {npcCount}</label>
        <input style={S.inp} type="range" min={1} max={150} value={npcCount} onChange={e=>setNpcCount(+e.target.value)}/>
        <label style={S.lbl}>Spread: {spread.toFixed(1)}</label>
        <input style={S.inp} type="range" min={0.5} max={5} step={0.1} value={spread} onChange={e=>setSpread(+e.target.value)}/>
        <label style={S.lbl}>Body Scale: {bodyScale.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0.5} max={2} step={0.05} value={bodyScale} onChange={e=>setBodyScale(+e.target.value)}/>
      </div>
      <div style={S.sec}>
        <label style={{...S.lbl,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <input type="checkbox" checked={diversity} onChange={e=>setDiversity(e.target.checked)} style={{accentColor:"#00ffc8"}}/>
          Skin Tone Diversity
        </label>
        {!diversity&&<div style={{display:"flex",gap:6,marginTop:6}}>{SKIN_TONES.map(t=><div key={t} onClick={()=>setSkinTone(t)} style={{width:24,height:24,borderRadius:"50%",background:t,cursor:"pointer",border:skinTone===t?"2px solid #00ffc8":"2px solid transparent"}}/>)}</div>}
      </div>
      <button style={S.btn} onClick={()=>generate()}>⚡ Generate</button>
      <button style={S.btnO} onClick={clear}>🗑 Clear</button>
    </div>
  );
}
