import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createWeatherSystem, stepWeather, applyWeatherPreset, disposeWeather, WEATHER_PRESETS } from '../../mesh/WeatherSystem.js';

const C = {
  bg:'#06060f', panel:'#0d1117', border:'#21262d',
  teal:'#00ffc8', orange:'#FF6600', text:'#e0e0e0',
  dim:'#8b949e', font:'JetBrains Mono,monospace'
};

const PRESET_META = {
  clear:        { icon:'☀️',  label:'Clear',        color:'#ffdd44' },
  drizzle:      { icon:'🌦',  label:'Drizzle',       color:'#88ccff' },
  lightRain:    { icon:'🌧',  label:'Light Rain',    color:'#88aaff' },
  heavyRain:    { icon:'🌊',  label:'Heavy Rain',    color:'#4466ff' },
  thunderstorm: { icon:'⚡',  label:'Thunderstorm',  color:'#ff88ff' },
  lightSnow:    { icon:'❄️',  label:'Light Snow',    color:'#cceeff' },
  blizzard:     { icon:'🌨',  label:'Blizzard',      color:'#aaddff' },
  hailstorm:    { icon:'🧊',  label:'Hail',          color:'#88ffcc' },
  fog:          { icon:'🌫',  label:'Fog',           color:'#aaaaaa' },
  sandstorm:    { icon:'🌪',  label:'Sandstorm',     color:'#cc8844' },
};

function ValueKnob({ label, value, min, max, step=0.01, onChange, unit='' }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:60}}>
      <div style={{
        width:48,height:48,borderRadius:'50%',
        background:`conic-gradient(${C.teal} 0% ${((value-min)/(max-min)*100)}%, #1a2030 ${((value-min)/(max-min)*100)}% 100%)`,
        display:'flex',alignItems:'center',justifyContent:'center',
        cursor:'ns-resize',border:'2px solid #1a2030',position:'relative'
      }}
        onMouseDown={e=>{
          const startY=e.clientY, startV=value;
          const move=ev=>{
            const delta=(startY-ev.clientY)/100*(max-min);
            onChange(Math.min(max,Math.max(min,Math.round((startV+delta)/step)*step)));
          };
          const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);};
          document.addEventListener('mousemove',move);
          document.addEventListener('mouseup',up);
        }}
      >
        <div style={{width:32,height:32,borderRadius:'50%',background:C.panel,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:9,fontWeight:700,color:C.teal,fontFamily:C.font}}>
            {step<0.1?value.toFixed(2):Math.round(value)}{unit}
          </span>
        </div>
      </div>
      <span style={{fontSize:8,color:C.dim,letterSpacing:0.5,textTransform:'uppercase',textAlign:'center',fontFamily:C.font}}>{label}</span>
    </div>
  );
}

export default function WeatherPanel({ sceneRef, cameraRef, open=true, onClose }) {
  const [activePreset, setActivePreset] = useState(null);
  const [running, setRunning] = useState(false);
  const [rain, setRain]       = useState(0);
  const [snow, setSnow]       = useState(0);
  const [fog,  setFog]        = useState(0);
  const [wind, setWind]       = useState(0.1);
  const [lightning, setLightning] = useState(0);
  const [hail, setHail]       = useState(0);
  const [particles, setParticles] = useState(6000);
  const [stats, setStats]     = useState('');
  const systemRef = useRef(null);
  const rafRef    = useRef(null);

  const initSystem = useCallback(() => {
    const scene = sceneRef?.current;
    if (!scene) return;
    if (systemRef.current) disposeWeather(systemRef.current);
    systemRef.current = createWeatherSystem(scene, { maxParticles: particles, spread: 50, height: 25 });
    Object.assign(systemRef.current, { rain, snow, fog, wind, lightning, hail });
    systemRef.current.enabled = true;
  }, [sceneRef, particles, rain, snow, fog, wind, lightning, hail]);

  const startSim = useCallback(() => {
    initSystem();
    setRunning(true);
    let frame = 0;
    const tick = () => {
      if (!systemRef.current) return;
      Object.assign(systemRef.current, { rain, snow, fog, wind, lightning, hail });
      stepWeather(systemRef.current, 1/60, cameraRef?.current);
      frame++;
      if (frame % 30 === 0) {
        const r = Math.round(rain * systemRef.current.maxParticles);
        const s = Math.round(snow * systemRef.current.maxParticles);
        setStats(`${r+s} particles active`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [initSystem, rain, snow, fog, wind, lightning, hail, cameraRef]);

  const stopSim = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRunning(false);
    setStats('');
  }, []);

  const clearWeather = useCallback(() => {
    stopSim();
    if (systemRef.current) disposeWeather(systemRef.current);
    systemRef.current = null;
    setActivePreset(null);
  }, [stopSim]);

  const loadPreset = useCallback((name) => {
    const p = WEATHER_PRESETS[name];
    if (!p) return;
    setRain(p.rain); setSnow(p.snow); setFog(p.fog);
    setWind(p.wind); setLightning(p.lightning); setHail(p.hail);
    setActivePreset(name);
  }, []);

  useEffect(() => () => { stopSim(); if(systemRef.current) disposeWeather(systemRef.current); }, []);

  if (!open) return null;

  return (
    <div style={{width:320,background:C.panel,borderRadius:8,border:`1px solid ${C.border}`,
      fontFamily:C.font,color:C.text,boxShadow:'0 16px 48px rgba(0,0,0,0.8)',
      display:'flex',flexDirection:'column',maxHeight:700,overflow:'hidden'}}>

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#0a1020,#0d1117)',borderBottom:`1px solid ${C.border}`,
        padding:'10px 14px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:'#88ccff',boxShadow:'0 0 10px #88ccff'}}/>
        <span style={{fontSize:12,fontWeight:700,letterSpacing:3,color:'#88ccff'}}>WEATHER SYSTEM</span>
        <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
          {stats&&<span style={{fontSize:9,color:C.dim}}>{stats}</span>}
          {onClose&&<span onClick={onClose} style={{cursor:'pointer',color:C.dim,fontSize:14}}>×</span>}
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>

        {/* Presets grid */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,fontWeight:700,color:C.dim,letterSpacing:2,marginBottom:8}}>PRESETS</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:4}}>
            {Object.entries(PRESET_META).map(([key,meta])=>(
              <div key={key} onClick={()=>loadPreset(key)} style={{
                padding:'8px 4px',borderRadius:6,cursor:'pointer',textAlign:'center',
                border:`1px solid ${activePreset===key?meta.color:C.border}`,
                background:activePreset===key?`${meta.color}15`:C.bg,
                transition:'all 0.15s'
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=meta.color;e.currentTarget.style.background=`${meta.color}10`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=activePreset===key?meta.color:C.border;e.currentTarget.style.background=activePreset===key?`${meta.color}15`:C.bg;}}
              >
                <div style={{fontSize:16,marginBottom:2}}>{meta.icon}</div>
                <div style={{fontSize:7,color:activePreset===key?meta.color:C.dim,fontWeight:700,letterSpacing:0.3}}>{meta.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Knob controls */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,fontWeight:700,color:C.dim,letterSpacing:2,marginBottom:10}}>PARAMETERS</div>
          <div style={{display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:8}}>
            <ValueKnob label="Rain"      value={rain}      min={0} max={1} step={0.01} onChange={setRain}/>
            <ValueKnob label="Snow"      value={snow}      min={0} max={1} step={0.01} onChange={setSnow}/>
            <ValueKnob label="Fog"       value={fog}       min={0} max={1} step={0.01} onChange={setFog}/>
            <ValueKnob label="Wind"      value={wind}      min={0} max={2} step={0.05} onChange={setWind}/>
            <ValueKnob label="Lightning" value={lightning} min={0} max={1} step={0.01} onChange={setLightning}/>
            <ValueKnob label="Hail"      value={hail}      min={0} max={1} step={0.01} onChange={setHail}/>
          </div>
        </div>

        {/* Particle count */}
        <div style={{marginBottom:14,padding:'10px 12px',background:'#0a0f1a',borderRadius:6,border:`1px solid ${C.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:9,color:C.dim,letterSpacing:1}}>MAX PARTICLES</span>
            <span style={{fontSize:11,color:C.teal,fontWeight:700}}>{particles.toLocaleString()}</span>
          </div>
          <div style={{display:'flex',gap:4}}>
            {[2000,4000,6000,10000,16000].map(n=>(
              <div key={n} onClick={()=>setParticles(n)} style={{
                flex:1,padding:'4px 0',textAlign:'center',borderRadius:3,cursor:'pointer',
                fontSize:8,fontWeight:700,
                border:`1px solid ${particles===n?C.teal:C.border}`,
                color:particles===n?C.teal:C.dim,
                background:particles===n?'rgba(0,255,200,0.08)':C.bg
              }}>{n>=1000?`${n/1000}K`:n}</div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
          {!running
            ?<button onClick={startSim} style={{padding:'8px 0',background:'rgba(136,204,255,0.1)',border:'1px solid #88ccff',borderRadius:5,color:'#88ccff',fontFamily:C.font,fontSize:10,fontWeight:700,cursor:'pointer',letterSpacing:1}}>▶ START</button>
            :<button onClick={stopSim}  style={{padding:'8px 0',background:'rgba(255,102,0,0.1)',border:`1px solid ${C.orange}`,borderRadius:5,color:C.orange,fontFamily:C.font,fontSize:10,fontWeight:700,cursor:'pointer'}}>■ STOP</button>
          }
          <button onClick={initSystem} style={{padding:'8px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,color:C.dim,fontFamily:C.font,fontSize:10,cursor:'pointer'}}>↺ RESET</button>
          <button onClick={clearWeather} style={{padding:'8px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,color:C.dim,fontFamily:C.font,fontSize:10,cursor:'pointer'}}>✕ CLEAR</button>
        </div>

      </div>
    </div>
  );
}
