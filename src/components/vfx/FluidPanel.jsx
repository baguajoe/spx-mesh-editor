import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import {
  createFluidSettings, FLUID_PRESETS,
  stepSPH, emitFluid, buildFluidMesh, updateFluidMesh,
  createPyroEmitter, stepPyro, getFluidStats,
} from "../../mesh/FluidSystem.js";

const C = {
  bg:"#06060f", panel:"#0a0a14", border:"#1a2a3a",
  teal:"#00ffc8", orange:"#FF6600", muted:"#5a7088",
  text:"#ccc", danger:"#ff4444", warn:"#ffaa00",
};

const S = {
  wrap:   { display:"flex", flexDirection:"column", height:"100%", background:C.bg, fontFamily:"JetBrains Mono,monospace", fontSize:11, color:C.text, overflow:"hidden" },
  header: { display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:C.panel, borderBottom:`1px solid ${C.border}`, flexShrink:0 },
  title:  { color:C.teal, fontWeight:700, fontSize:12, letterSpacing:1 },
  close:  { marginLeft:"auto", background:"none", border:`1px solid ${C.border}`, borderRadius:3, color:C.muted, cursor:"pointer", padding:"3px 8px", fontSize:12 },
  tabs:   { display:"flex", background:C.panel, borderBottom:`1px solid ${C.border}`, flexShrink:0 },
  tab:    (a) => ({ padding:"6px 14px", border:"none", borderBottom:`2px solid ${a?C.teal:"transparent"}`, background:"transparent", color:a?C.teal:C.muted, cursor:"pointer", fontSize:10, fontWeight:a?700:400 }),
  body:   { flex:1, overflowY:"auto", padding:10 },
  sec:    { marginBottom:14 },
  sl:     { fontSize:9, color:C.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:5 },
  row:    { display:"flex", gap:6, alignItems:"center", marginBottom:6 },
  label:  { fontSize:10, color:C.muted, minWidth:90, flexShrink:0 },
  val:    { fontSize:10, color:C.teal, minWidth:36, textAlign:"right" },
  slider: { flex:1, accentColor:C.teal, cursor:"pointer" },
  select: { background:C.panel, border:`1px solid ${C.border}`, borderRadius:3, color:C.text, padding:"4px 7px", fontSize:11, fontFamily:"inherit", flex:1, cursor:"pointer" },
  btn:    (col=C.teal, sm=false) => ({ padding:sm?"3px 8px":"5px 12px", border:`1px solid ${col}44`, borderRadius:3, background:`${col}11`, color:col, cursor:"pointer", fontSize:sm?9:10, fontWeight:600, fontFamily:"inherit" }),
  card:   (a) => ({ padding:"8px 10px", borderRadius:4, border:`1px solid ${a?C.teal:C.border}`, background:a?`${C.teal}11`:C.panel, marginBottom:4, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }),
  swatch: (col) => ({ width:18, height:18, borderRadius:3, background:col, flexShrink:0, border:`1px solid #ffffff22` }),
  stat:   { display:"flex", justifyContent:"space-between", padding:"3px 0", fontSize:10, borderBottom:`1px solid ${C.border}22` },
  grid2:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginBottom:8 },
  basin:  (a) => ({ padding:"6px 8px", borderRadius:3, border:`1px solid ${a?C.orange:C.border}`, background:a?`${C.orange}11`:C.panel, cursor:"pointer", textAlign:"center", fontSize:9, color:a?C.orange:C.muted }),
};

const FLUID_TYPES = [
  { id:"water",  label:"Water",   icon:"💧", color:"#2255ff" },
  { id:"lava",   label:"Lava",    icon:"🌋", color:"#ff4400" },
  { id:"honey",  label:"Honey",   icon:"🍯", color:"#ffaa00" },
  { id:"blood",  label:"Blood",   icon:"🩸", color:"#cc0000" },
  { id:"slime",  label:"Slime",   icon:"🟢", color:"#44ff44" },
  { id:"smoke",  label:"Smoke",   icon:"💨", color:"#888888" },
];

const BASIN_SHAPES = [
  { id:"lake",    label:"Lake",         icon:"🏞️" },
  { id:"ocean",   label:"Ocean",        icon:"🌊" },
  { id:"pond",    label:"Pond",         icon:"🦆" },
  { id:"river",   label:"River",        icon:"🌊" },
  { id:"cup",     label:"Cup / Glass",  icon:"🥤" },
  { id:"wound",   label:"Wound / Gore", icon:"🔴" },
];

function KS({ label, value, min, max, step=0.01, unit="", onChange }) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)} style={S.slider} />
      <span style={S.val}>{value}{unit}</span>
    </div>
  );
}

export default function FluidPanel({ open, onClose, sceneRef, setStatus }) {
  if (!open) return null;

  const [tab, setTab] = useState("simulate");
  const [fluidType, setFluidType] = useState("water");
  const [basinShape, setBasinShape] = useState("lake");
  const [gravity, setGravity] = useState(-9.8);
  const [viscosity, setViscosity] = useState(0.1);
  const [maxParticles, setMaxParticles] = useState(300);
  const [emitRate, setEmitRate] = useState(20);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ particles: 0, max: 300, type: "water" });

  const fluidRef  = useRef(null);
  const ptsRef    = useRef(null);
  const animRef   = useRef(null);
  const runningRef = useRef(false);

  useEffect(() => { runningRef.current = running; }, [running]);

  // Build basin geometry in the shared scene
  const buildBasin = useCallback((shape) => {
    const scene = sceneRef?.current;
    if (!scene) return;
    // Remove old basin
    const old = scene.getObjectByName("fluid_basin");
    if (old) scene.remove(old);

    let geo, mat;
    mat = new THREE.MeshLambertMaterial({ color:"#223344", transparent:true, opacity:0.3, side:THREE.BackSide });

    switch (shape) {
      case "lake":
        geo = new THREE.CylinderGeometry(3, 3, 0.5, 24, 1, true);
        break;
      case "ocean":
        geo = new THREE.BoxGeometry(10, 0.5, 10);
        mat = new THREE.MeshLambertMaterial({ color:"#112233", transparent:true, opacity:0.2 });
        break;
      case "pond":
        geo = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 16, 1, true);
        break;
      case "river":
        geo = new THREE.BoxGeometry(10, 0.3, 1.5);
        break;
      case "cup":
        geo = new THREE.CylinderGeometry(0.4, 0.3, 1.2, 12, 1, true);
        break;
      case "wound":
        geo = new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI*2, 0, Math.PI/2);
        mat = new THREE.MeshLambertMaterial({ color:"#440000", transparent:true, opacity:0.5 });
        break;
      default:
        geo = new THREE.CylinderGeometry(2, 2, 0.4, 16, 1, true);
    }

    const basin = new THREE.Mesh(geo, mat);
    basin.name = "fluid_basin";
    scene.add(basin);
    setStatus?.(`Basin: ${shape}`);
  }, [sceneRef, setStatus]);

  const startSim = useCallback(() => {
    const scene = sceneRef?.current;
    if (!scene) { setStatus?.("No scene — open a mesh first"); return; }

    const preset = FLUID_PRESETS[fluidType] || FLUID_PRESETS.water;
    const fluid = createFluidSettings({
      type: fluidType,
      gravity, viscosity: preset.viscosity,
      maxParticles, enabled: true,
    });
    fluid.enabled = true;
    fluidRef.current = fluid;

    // Remove old points
    if (ptsRef.current) scene.remove(ptsRef.current);

    // Emit initial particles
    const spawnPos = getSpawnPos(basinShape);
    for (let i = 0; i < Math.min(50, maxParticles); i++) {
      emitFluid(fluid, spawnPos.clone().add(
        new THREE.Vector3((Math.random()-0.5)*0.5, Math.random()*0.3, (Math.random()-0.5)*0.5)
      ), 1);
    }

    const pts = buildFluidMesh(fluid);
    if (pts) { scene.add(pts); ptsRef.current = pts; }

    setRunning(true);
    setStatus?.(`${fluidType} simulation started`);
  }, [sceneRef, fluidType, basinShape, gravity, viscosity, maxParticles, setStatus]);

  const stopSim = useCallback(() => {
    setRunning(false);
    cancelAnimationFrame(animRef.current);
    setStatus?.("Fluid simulation stopped");
  }, [setStatus]);

  // Animate loop
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const loop = () => {
      if (!runningRef.current) return;
      animRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const fluid = fluidRef.current;
      const scene = sceneRef?.current;
      if (!fluid || !scene) return;

      // Continuous emit
      const spawnPos = getSpawnPos(basinShape);
      if (fluid.particles.length < maxParticles && Math.random() < 0.5) {
        emitFluid(fluid, spawnPos, Math.floor(emitRate * dt));
      }

      stepSPH(fluid, dt);

      if (ptsRef.current && fluid.particles.length > 0) {
        // Resize geometry if needed
        if (ptsRef.current.geometry.attributes.position?.count !== fluid.particles.length) {
          scene.remove(ptsRef.current);
          const pts = buildFluidMesh(fluid);
          if (pts) { scene.add(pts); ptsRef.current = pts; }
        } else {
          updateFluidMesh(ptsRef.current, fluid);
        }
      }

      setStats(getFluidStats(fluid));
    };
    loop();
    return () => cancelAnimationFrame(animRef.current);
  }, [running, sceneRef, basinShape, maxParticles, emitRate]);

  const clearFluid = () => {
    const scene = sceneRef?.current;
    if (ptsRef.current && scene) { scene.remove(ptsRef.current); ptsRef.current = null; }
    const old = scene?.getObjectByName("fluid_basin");
    if (old) scene.remove(old);
    if (fluidRef.current) fluidRef.current.particles = [];
    setRunning(false);
    setStats({ particles: 0, max: maxParticles, type: fluidType });
    setStatus?.("Fluid cleared");
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={S.title}>💧 FLUID SYSTEM</span>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>

      <div style={S.tabs}>
        {[["simulate","Simulate"],["shape","Basin Shape"],["presets","Presets"]].map(([id,label]) => (
          <button key={id} style={S.tab(tab===id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div style={S.body}>

        {tab === "simulate" && (<>
          <div style={S.sec}>
            <div style={S.sl}>Fluid Type</div>
            <div style={S.grid2}>
              {FLUID_TYPES.map(f => (
                <div key={f.id} style={S.card(fluidType===f.id)} onClick={() => setFluidType(f.id)}>
                  <div style={S.swatch(f.color)} />
                  <span>{f.icon} {f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Physics</div>
            <KS label="Gravity" value={gravity} min={-20} max={0} step={0.1} unit=" m/s²" onChange={setGravity} />
            <KS label="Max Particles" value={maxParticles} min={50} max={1000} step={50} onChange={setMaxParticles} />
            <KS label="Emit Rate" value={emitRate} min={1} max={100} step={1} onChange={setEmitRate} />
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Stats</div>
            {[
              ["Particles", `${stats.particles} / ${stats.max}`],
              ["Type", stats.type],
              ["Status", running ? "● RUNNING" : "■ STOPPED"],
            ].map(([k,v]) => (
              <div key={k} style={S.stat}>
                <span style={{color:C.muted}}>{k}</span>
                <span style={{color: k==="Status" ? (running?C.teal:C.muted) : C.text}}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
            <button style={S.btn(C.teal)} onClick={() => { buildBasin(basinShape); startSim(); }}>▶ START</button>
            <button style={S.btn(C.orange)} onClick={stopSim} disabled={!running}>⏸ STOP</button>
            <button style={S.btn(C.danger)} onClick={clearFluid}>🗑 CLEAR</button>
          </div>
        </>)}

        {tab === "shape" && (<>
          <div style={S.sec}>
            <div style={S.sl}>Basin / Container Shape</div>
            {BASIN_SHAPES.map(b => (
              <div key={b.id} style={S.card(basinShape===b.id)} onClick={() => { setBasinShape(b.id); buildBasin(b.id); }}>
                <span style={{fontSize:18}}>{b.icon}</span>
                <div>
                  <div style={{fontWeight:600, color: basinShape===b.id ? C.teal : C.text}}>{b.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={S.sec}>
            <div style={S.sl}>Manual Shaping Tips</div>
            <div style={{fontSize:9, color:C.muted, lineHeight:1.7}}>
              • Select a mesh in the scene, then start fluid — particles will fill its shape<br/>
              • Use Sculpt mode to shape the basin before running<br/>
              • Cup/Glass works best with a cylinder primitive<br/>
              • River works best with a long plane primitive
            </div>
          </div>
        </>)}

        {tab === "presets" && (<>
          <div style={S.sec}>
            <div style={S.sl}>Quick Presets</div>
            {[
              { label:"Flooding Room",   type:"water",  basin:"ocean",  gravity:-9.8, particles:500 },
              { label:"Lava Flow",       type:"lava",   basin:"river",  gravity:-9.8, particles:200 },
              { label:"Blood Puddle",    type:"blood",  basin:"pond",   gravity:-9.8, particles:150 },
              { label:"Honey Drip",      type:"honey",  basin:"cup",    gravity:-9.8, particles:100 },
              { label:"Slime Pool",      type:"slime",  basin:"lake",   gravity:-9.8, particles:200 },
              { label:"Smoke Rising",    type:"smoke",  basin:"pond",   gravity:0.5,  particles:200 },
              { label:"Rain on Ground",  type:"water",  basin:"ocean",  gravity:-9.8, particles:400 },
            ].map(p => (
              <div key={p.label} style={S.card(false)} onClick={() => {
                setFluidType(p.type);
                setBasinShape(p.basin);
                setGravity(p.gravity);
                setMaxParticles(p.particles);
                buildBasin(p.basin);
                setStatus?.(`Preset: ${p.label}`);
              }}>
                <span style={{fontSize:16}}>{FLUID_TYPES.find(f=>f.id===p.type)?.icon}</span>
                <span style={{fontSize:10}}>{p.label}</span>
              </div>
            ))}
          </div>
        </>)}

      </div>
    </div>
  );
}

function getSpawnPos(basinShape) {
  switch (basinShape) {
    case "cup":    return new THREE.Vector3(0, 0.8, 0);
    case "river":  return new THREE.Vector3(-4, 0.5, 0);
    case "wound":  return new THREE.Vector3(0, 0.3, 0);
    default:       return new THREE.Vector3(0, 1.5, 0);
  }
}
