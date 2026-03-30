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