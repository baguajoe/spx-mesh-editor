import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import {
  createFluidSettings, emitFluid, stepSPH,
  buildFluidMesh, updateFluidMesh, getFluidStats, createPyroEmitter, stepPyro
} from '../../mesh/FluidSystem.js';

const C = {
  bg:'#06060f', panel:'#0d1117', border:'#21262d',
  teal:'#00ffc8', orange:'#FF6600', text:'#e0e0e0',
  dim:'#8b949e', font:'JetBrains Mono,monospace'
};

const FLUID_PRESETS = [
  { label:'Water',    color:'#2288ff', smoothRadius:0.4, restDensity:1000, stiffness:200,  viscosity:0.01,  gravity:-9.8,  tension:0.07 },
  { label:'Honey',    color:'#ffaa00', smoothRadius:0.5, restDensity:1400, stiffness:150,  viscosity:0.08,  gravity:-9.8,  tension:0.04 },
  { label:'Lava',     color:'#ff4400', smoothRadius:0.6, restDensity:2800, stiffness:300,  viscosity:0.12,  gravity:-9.8,  tension:0.02 },
  { label:'Mercury',  color:'#aabbcc', smoothRadius:0.3, restDensity:13600,stiffness:800,  viscosity:0.001, gravity:-9.8,  tension:0.48 },
  { label:'Oil',      color:'#336622', smoothRadius:0.45,restDensity:870,  stiffness:180,  viscosity:0.05,  gravity:-9.8,  tension:0.03 },
  { label:'Blood',    color:'#880000', smoothRadius:0.4, restDensity:1060, stiffness:220,  viscosity:0.04,  gravity:-9.8,  tension:0.06 },
  { label:'Smoke',    color:'#444444', smoothRadius:0.8, restDensity:1.2,  stiffness:10,   viscosity:0.001, gravity:0.2,   tension:0 },
  { label:'Fire',     color:'#ff6600', smoothRadius:0.7, restDensity:0.8,  stiffness:8,    viscosity:0.0005,gravity:0.5,   tension:0 },
];

function ValueKnob({ label, value, min, max, step=0.01, onChange, unit='', color=C.teal }) {
  const pct = Math.min(1, Math.max(0, (value-min)/(max-min)));
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:54}}>
      <div style={{
        width:44,height:44,borderRadius:'50%',
        background:`conic-gradient(${color} 0% ${pct*100}%, #1a2030 ${pct*100}% 100%)`,
        display:'flex',alignItems:'center',justifyContent:'center',
        cursor:'ns-resize',border:'2px solid #1a2030',userSelect:'none'
      }}
        onMouseDown={e=>{
          const startY=e.clientY, startV=value;
          const move=ev=>{
            const delta=(startY-ev.clientY)/80*(max-min);
            onChange(Math.min(max,Math.max(min,parseFloat((startV+delta).toFixed(4)))));
          };
          const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);};
          document.addEventListener('mousemove',move);
          document.addEventListener('mouseup',up);
        }}
      >
        <div style={{width:30,height:30,borderRadius:'50%',background:C.panel,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:7,fontWeight:700,color,fontFamily:C.font,textAlign:'center',lineHeight:1.1}}>
            {value>=100?Math.round(value):value>=1?value.toFixed(1):value.toFixed(3)}{unit}
          </span>
        </div>
      </div>
      <span style={{fontSize:7,color:C.dim,letterSpacing:0.3,textTransform:'uppercase',textAlign:'center',fontFamily:C.font,maxWidth:54}}>{label}</span>
    </div>
  );
}

export default function FluidPanel({ sceneRef, open=true, onClose }) {
  const [mode, setMode]           = useState('sph');
  const [activePreset, setPreset] = useState(0);
  const [simulating, setSim]      = useState(false);
  const [stats, setStats]         = useState('');
  // SPH params
  const [smoothRadius, setSmoothRadius] = useState(0.4);
  const [restDensity, setRestDensity]   = useState(1000);
  const [stiffness, setStiffness]       = useState(200);
  const [viscosity, setViscosity]       = useState(0.01);
  const [gravity, setGravity]           = useState(-9.8);
  const [emitRate, setEmitRate]         = useState(20);
  const [maxParts, setMaxParts]         = useState(2000);
  const [fluidColor, setFluidColor]     = useState('#2288ff');
  // Pyro params
  const [pyroTemp, setPyroTemp]         = useState(1200);
  const [pyroBuoyancy, setPyroBuoyancy] = useState(0.5);
  const [pyroTurb, setPyroTurb]         = useState(0.3);

  const fluidRef  = useRef(null);
  const meshRef   = useRef(null);
  const rafRef    = useRef(null);
  const pyroRef   = useRef(null);
  const frameRef  = useRef(0);

  const initFluid = useCallback(() => {
    const scene = sceneRef?.current;
    if (!scene) return;
    if (meshRef.current) { scene.remove(meshRef.current); meshRef.current.geometry.dispose(); meshRef.current.material.dispose(); }
    fluidRef.current = createFluidSettings({ smoothRadius, restDensity, stiffness, viscosity, gravity, maxParticles: maxParts });
    fluidRef.current.enabled = true;
    const pts = buildFluidMesh(fluidRef.current);
    pts.material.color.set(fluidColor);
    scene.add(pts);
    meshRef.current = pts;
    setStats('SPH initialized');
  }, [sceneRef, smoothRadius, restDensity, stiffness, viscosity, gravity, maxParts, fluidColor]);

  const initPyro = useCallback(() => {
    const scene = sceneRef?.current;
    if (!scene) return;
    pyroRef.current = createPyroEmitter(new THREE.Vector3(0, 0, 0), { temperature: pyroTemp, buoyancy: pyroBuoyancy, turbulence: pyroTurb });
    setStats('Pyro initialized');
  }, [sceneRef, pyroTemp, pyroBuoyancy, pyroTurb]);

  const startSim = useCallback(() => {
    if (mode === 'sph') { if (!fluidRef.current) initFluid(); }
    else { if (!pyroRef.current) initPyro(); }
    setSim(true);
    const tick = () => {
      frameRef.current++;
      if (mode === 'sph' && fluidRef.current) {
        if (frameRef.current % 3 === 0) emitFluid(fluidRef.current, new THREE.Vector3((Math.random()-0.5)*0.5, 2, (Math.random()-0.5)*0.5), emitRate);
        stepSPH(fluidRef.current, 1/60);
        if (meshRef.current) updateFluidMesh(meshRef.current, fluidRef.current);
        if (frameRef.current % 30 === 0) {
          const s = getFluidStats(fluidRef.current);
          setStats(`${s.activeParticles}/${s.maxParticles} particles`);
        }
      } else if (mode === 'pyro' && pyroRef.current) {
        stepPyro(pyroRef.current, 1/60);
        if (frameRef.current % 30 === 0) setStats(`${pyroRef.current.particles?.filter?.(p=>p.active)?.length||0} pyro particles`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [mode, initFluid, initPyro, emitRate]);

  const stopSim = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setSim(false);
  }, []);

  const clearSim = useCallback(() => {
    stopSim();
    const scene = sceneRef?.current;
    if (scene && meshRef.current) { scene.remove(meshRef.current); meshRef.current = null; }
    fluidRef.current = null; pyroRef.current = null;
    setStats(''); frameRef.current = 0;
  }, [stopSim, sceneRef]);

  const loadPreset = (i) => {
    const p = FLUID_PRESETS[i];
    setPreset(i); setFluidColor(p.color);
    setSmoothRadius(p.smoothRadius); setRestDensity(p.restDensity);
    setStiffness(p.stiffness); setViscosity(p.viscosity); setGravity(p.gravity);
    if (p.label === 'Smoke' || p.label === 'Fire') setMode('pyro'); else setMode('sph');
  };

  useEffect(() => () => { stopSim(); }, []);

  if (!open) return null;

  return (
    <div style={{width:340,background:C.panel,borderRadius:8,border:`1px solid ${C.border}`,
      fontFamily:C.font,color:C.text,boxShadow:'0 16px 48px rgba(0,0,0,0.8)',
      display:'flex',flexDirection:'column',maxHeight:720,overflow:'hidden'}}>

      <div style={{background:'linear-gradient(135deg,#0a1020,#0d1117)',borderBottom:`1px solid ${C.border}`,
        padding:'10px 14px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:'#2288ff',boxShadow:'0 0 10px #2288ff'}}/>
        <span style={{fontSize:12,fontWeight:700,letterSpacing:3,color:'#2288ff'}}>FLUID SIM</span>
        <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
          {stats&&<span style={{fontSize:9,color:simulating?C.teal:C.dim}}>{stats}</span>}
          {onClose&&<span onClick={onClose} style={{cursor:'pointer',color:C.dim,fontSize:14}}>×</span>}
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>

        {/* Mode toggle */}
        <div style={{display:'flex',gap:4,marginBottom:12,padding:'3px',background:'#0a0f1a',borderRadius:6}}>
          {['sph','pyro'].map(m=>(
            <div key={m} onClick={()=>setMode(m)} style={{
              flex:1,padding:'5px 0',textAlign:'center',borderRadius:4,cursor:'pointer',
              fontSize:9,fontWeight:700,letterSpacing:1,
              background:mode===m?'#1a2535':'transparent',
              color:mode===m?C.teal:C.dim,
              border:`1px solid ${mode===m?C.teal:'transparent'}`
            }}>{m==='sph'?'SPH LIQUID':'PYRO SMOKE/FIRE'}</div>
          ))}
        </div>

        {/* Presets */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:C.dim,letterSpacing:2,marginBottom:6}}>FLUID TYPE</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:3}}>
            {FLUID_PRESETS.map((p,i)=>(
              <div key={p.label} onClick={()=>loadPreset(i)} style={{
                padding:'6px 4px',borderRadius:5,cursor:'pointer',textAlign:'center',
                border:`1px solid ${activePreset===i?p.color:C.border}`,
                background:activePreset===i?`${p.color}18`:C.bg,
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=p.color;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=activePreset===i?p.color:C.border;}}
              >
                <div style={{width:16,height:16,borderRadius:'50%',background:p.color,margin:'0 auto 3px',boxShadow:`0 0 6px ${p.color}88`}}/>
                <div style={{fontSize:7,color:activePreset===i?p.color:C.dim,fontWeight:700}}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Knobs */}
        {mode === 'sph' ? (
          <>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,letterSpacing:2,marginBottom:10}}>PARAMETERS</div>
            <div style={{display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:10,marginBottom:12}}>
              <ValueKnob label="Smooth R" value={smoothRadius} min={0.1} max={1.5} step={0.01} onChange={setSmoothRadius} color='#44aaff'/>
              <ValueKnob label="Density"  value={restDensity}  min={0.5} max={15000} step={10} onChange={setRestDensity} color='#88ccff'/>
              <ValueKnob label="Stiffness"value={stiffness}    min={1}   max={2000}  step={1}  onChange={setStiffness}  color={C.teal}/>
              <ValueKnob label="Viscosity"value={viscosity}    min={0}   max={0.5}   step={0.001} onChange={setViscosity} color='#aaffaa'/>
              <ValueKnob label="Gravity"  value={gravity}      min={-20} max={2}     step={0.1} onChange={setGravity}   color={C.orange}/>
              <ValueKnob label="Emit/s"   value={emitRate}     min={1}   max={100}   step={1}  onChange={setEmitRate}   color='#ffdd44'/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,padding:'8px 10px',background:'#0a0f1a',borderRadius:5,border:`1px solid ${C.border}`}}>
              <span style={{fontSize:9,color:C.dim,letterSpacing:1}}>COLOR</span>
              <input type='color' value={fluidColor} onChange={e=>setFluidColor(e.target.value)} style={{width:32,height:24,border:'none',borderRadius:3,cursor:'pointer',background:'none'}}/>
              <span style={{fontSize:9,color:C.dim}}>{fluidColor}</span>
              <span style={{fontSize:9,color:C.dim,marginLeft:'auto',letterSpacing:1}}>MAX</span>
              <div style={{display:'flex',gap:3}}>
                {[500,1000,2000,4000].map(n=>(
                  <div key={n} onClick={()=>setMaxParts(n)} style={{padding:'3px 6px',borderRadius:3,cursor:'pointer',fontSize:8,fontWeight:700,border:`1px solid ${maxParts===n?C.teal:C.border}`,color:maxParts===n?C.teal:C.dim,background:maxParts===n?'rgba(0,255,200,0.08)':C.bg}}>{n>=1000?`${n/1000}K`:n}</div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,letterSpacing:2,marginBottom:10}}>PYRO PARAMETERS</div>
            <div style={{display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:10,marginBottom:12}}>
              <ValueKnob label="Temp °K"   value={pyroTemp}     min={300} max={3000} step={10}  onChange={setPyroTemp}     color='#ff4400'/>
              <ValueKnob label="Buoyancy"  value={pyroBuoyancy} min={0}   max={2}    step={0.05} onChange={setPyroBuoyancy} color='#ffaa00'/>
              <ValueKnob label="Turbulence"value={pyroTurb}     min={0}   max={1}    step={0.01} onChange={setPyroTurb}     color='#ff8844'/>
            </div>
          </>
        )}

        {/* Controls */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
          {!simulating
            ?<button onClick={startSim} style={{padding:'8px 0',background:'rgba(34,136,255,0.1)',border:'1px solid #2288ff',borderRadius:5,color:'#2288ff',fontFamily:C.font,fontSize:10,fontWeight:700,cursor:'pointer',letterSpacing:1}}>▶ SIMULATE</button>
            :<button onClick={stopSim}  style={{padding:'8px 0',background:'rgba(255,102,0,0.1)',border:`1px solid ${C.orange}`,borderRadius:5,color:C.orange,fontFamily:C.font,fontSize:10,fontWeight:700,cursor:'pointer'}}>■ STOP</button>
          }
          <button onClick={mode==='sph'?initFluid:initPyro} style={{padding:'8px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,color:C.dim,fontFamily:C.font,fontSize:10,cursor:'pointer'}}>↺ RESET</button>
          <button onClick={clearSim} style={{padding:'8px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,color:C.dim,fontFamily:C.font,fontSize:10,cursor:'pointer'}}>✕ CLEAR</button>
        </div>

      </div>
    </div>
  );
}
