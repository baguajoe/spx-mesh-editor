import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';

const C = {
  bg:'#06060f', panel:'#0d1117', border:'#21262d',
  teal:'#00ffc8', orange:'#FF6600', text:'#e0e0e0', dim:'#8b949e',
  font:'JetBrains Mono,monospace', section:'#0a0f1a'
};

function Slider({ label, value, min, max, step=0.01, onChange, unit='' }) {
  return (
    <div style={{marginBottom:6}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.dim,marginBottom:2}}>
        <span>{label}</span>
        <span style={{color:C.teal,fontWeight:700}}>{step<0.1?Number(value).toFixed(2):Math.round(value)}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(parseFloat(e.target.value))}
        style={{width:'100%',accentColor:C.teal,cursor:'pointer',height:3}}/>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
      <span style={{fontSize:10,color:C.dim}}>{label}</span>
      <div onClick={()=>onChange(!value)} style={{
        width:32,height:16,borderRadius:8,cursor:'pointer',position:'relative',
        background:value?C.teal:C.border,transition:'background 0.2s'
      }}>
        <div style={{
          position:'absolute',top:2,left:value?16:2,width:12,height:12,
          borderRadius:'50%',background:value?C.bg:'#555',transition:'left 0.2s'
        }}/>
      </div>
    </div>
  );
}

function Section({ title, color=C.teal, children, defaultOpen=true }) {
  const [open,setOpen] = useState(defaultOpen);
  return (
    <div style={{marginBottom:8}}>
      <div onClick={()=>setOpen(v=>!v)} style={{
        display:'flex',alignItems:'center',gap:6,padding:'5px 8px',
        background:C.section,borderRadius:4,cursor:'pointer',
        borderLeft:`2px solid ${color}`,marginBottom:open?6:0
      }}>
        <span style={{color,fontSize:9,fontWeight:700}}>{open?'▾':'▸'}</span>
        <span style={{fontSize:10,fontWeight:700,color:C.text,fontFamily:C.font,letterSpacing:1}}>{title}</span>
      </div>
      {open && <div style={{paddingLeft:8}}>{children}</div>}
    </div>
  );
}

const TONE_MODES = [
  {key:'aces',  label:'ACES Filmic', val: THREE.ACESFilmicToneMapping},
  {key:'reinhard',label:'Reinhard', val: THREE.ReinhardToneMapping},
  {key:'cineon', label:'Cineon',    val: THREE.CineonToneMapping},
  {key:'agx',    label:'AgX',       val: THREE.AgXToneMapping || THREE.ACESFilmicToneMapping},
  {key:'linear', label:'Linear',    val: THREE.LinearToneMapping},
];

const HDRI_PRESETS = [
  {key:'sunset',  label:'Sunset',      top:'#0d1b3e', mid:'#e8c090', bot:'#1a1208', sunY:1.35},
  {key:'overcast',label:'Overcast',    top:'#1a2030', mid:'#8090a0', bot:'#404850', sunY:0.0},
  {key:'studio',  label:'Studio',      top:'#111318', mid:'#2a2e38', bot:'#0a0a0a', sunY:0.0},
  {key:'day',     label:'Daylight',    top:'#0a1a3a', mid:'#5090d0', bot:'#1a3010', sunY:1.6},
  {key:'night',   label:'Night',       top:'#000008', mid:'#050510', bot:'#020202', sunY:0.0},
  {key:'golden',  label:'Golden Hour', top:'#0d1020', mid:'#ff8830', bot:'#200800', sunY:1.45},
];

function buildHDRI(renderer, preset) {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size*4; c.height = size*2;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0,0,0,size*2);
  g.addColorStop(0,   preset.top);
  g.addColorStop(0.5, preset.mid);
  g.addColorStop(1,   preset.bot);
  ctx.fillStyle = g; ctx.fillRect(0,0,size*4,size*2);
  if (preset.sunY > 0) {
    const sx=size*2, sy=size*preset.sunY;
    const sg = ctx.createRadialGradient(sx,sy,0,sx,sy,90);
    sg.addColorStop(0,  'rgba(255,240,200,1)');
    sg.addColorStop(0.3,'rgba(255,180,80,0.6)');
    sg.addColorStop(1,  'rgba(255,80,0,0)');
    ctx.fillStyle=sg; ctx.fillRect(0,0,size*4,size*2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose(); tex.dispose();
  return env;
}

export default function FilmPostPanel({ rendererRef, sceneRef, open=true }) {
  // Bloom
  const [bloomOn,       setBloomOn]       = useState(true);
  const [bloomStrength, setBloomStrength] = useState(0.4);
  const [bloomRadius,   setBloomRadius]   = useState(0.5);
  const [bloomThresh,   setBloomThresh]   = useState(0.85);
  // SSAO
  const [ssaoOn,        setSsaoOn]        = useState(true);
  const [ssaoRadius,    setSsaoRadius]    = useState(0.6);
  const [ssaoMin,       setSsaoMin]       = useState(0.001);
  const [ssaoMax,       setSsaoMax]       = useState(0.08);
  // Tone + exposure
  const [toneMode,      setToneMode]      = useState('aces');
  const [exposure,      setExposure]      = useState(1.1);
  // HDRI
  const [hdriPreset,    setHdriPreset]    = useState('sunset');
  const [envIntensity,  setEnvIntensity]  = useState(0.8);
  // Vignette (CSS overlay)
  const [vigOn,         setVigOn]         = useState(true);
  const [vigIntensity,  setVigIntensity]  = useState(0.35);
  // Chromatic aberration toggle (future pass)
  const [caOn,          setCaOn]          = useState(false);
  // Film grain overlay
  const [grainOn,       setGrainOn]       = useState(true);
  const [grainAmt,      setGrainAmt]      = useState(0.04);

  const vigRef  = useRef(null);
  const grainRef= useRef(null);
  const grainAnimRef = useRef(null);

  // ── Get composer pass by index ──────────────────────────────────────────────
  const getComposer = useCallback(()=> rendererRef?.current?._composer, [rendererRef]);
  const getPass = useCallback((idx)=> getComposer()?.passes?.[idx], [getComposer]);
  // Pass indices from FilmRenderer: 0=RenderPass, 1=SSAO, 2=Bloom, 3=SMAA, 4=Output

  // ── Bloom ───────────────────────────────────────────────────────────────────
  useEffect(()=>{
    const p = getPass(2); if(!p) return;
    p.enabled   = bloomOn;
    p.strength  = bloomStrength;
    p.radius    = bloomRadius;
    p.threshold = bloomThresh;
  },[bloomOn,bloomStrength,bloomRadius,bloomThresh]);

  // ── SSAO ────────────────────────────────────────────────────────────────────
  useEffect(()=>{
    const p = getPass(1); if(!p) return;
    p.enabled      = ssaoOn;
    p.kernelRadius = ssaoRadius;
    p.minDistance  = ssaoMin;
    p.maxDistance  = ssaoMax;
  },[ssaoOn,ssaoRadius,ssaoMin,ssaoMax]);

  // ── Tone mapping + exposure ─────────────────────────────────────────────────
  useEffect(()=>{
    const r = rendererRef?.current; if(!r) return;
    const mode = TONE_MODES.find(m=>m.key===toneMode);
    if(mode) r.toneMapping = mode.val;
    r.toneMappingExposure = exposure;
  },[toneMode,exposure]);

  // ── HDRI swap ───────────────────────────────────────────────────────────────
  const applyHDRI = useCallback(()=>{
    const r = rendererRef?.current;
    const s = sceneRef?.current;
    if(!r||!s) return;
    const preset = HDRI_PRESETS.find(h=>h.key===hdriPreset);
    if(!preset) return;
    try {
      const env = buildHDRI(r, preset);
      if(s.environment) s.environment.dispose?.();
      s.environment = env;
      s.environmentIntensity = envIntensity;
    } catch(e){ console.warn('HDRI swap failed',e); }
  },[hdriPreset,envIntensity,rendererRef,sceneRef]);

  useEffect(()=>{ applyHDRI(); },[hdriPreset]);

  useEffect(()=>{
    const s = sceneRef?.current; if(!s) return;
    s.environmentIntensity = envIntensity;
  },[envIntensity]);

  // ── Vignette overlay ────────────────────────────────────────────────────────
  useEffect(()=>{
    const el = vigRef.current; if(!el) return;
    el.style.display = vigOn ? 'block' : 'none';
    el.style.opacity = vigIntensity;
  },[vigOn,vigIntensity]);

  // ── Film grain canvas overlay ───────────────────────────────────────────────
  useEffect(()=>{
    if(grainAnimRef.current) cancelAnimationFrame(grainAnimRef.current);
    const el = grainRef.current; if(!el) return;
    el.style.display = grainOn ? 'block' : 'none';
    if(!grainOn) return;
    const ctx = el.getContext('2d');
    const draw = ()=>{
      const w=el.width||el.offsetWidth||800, h=el.height||el.offsetHeight||600;
      if(w!==el.width||h!==el.height){el.width=w;el.height=h;}
      const img = ctx.createImageData(w,h);
      for(let i=0;i<img.data.length;i+=4){
        const v = (Math.random()-0.5)*grainAmt*255;
        img.data[i]=img.data[i+1]=img.data[i+2]=128+v;
        img.data[i+3]=Math.abs(v)*2.5;
      }
      ctx.putImageData(img,0,0);
      grainAnimRef.current = requestAnimationFrame(draw);
    };
    draw();
    return ()=>cancelAnimationFrame(grainAnimRef.current);
  },[grainOn,grainAmt]);

  if(!open) return null;

  return (
    <div style={{
      width:240,background:C.panel,borderRadius:6,border:`1px solid ${C.border}`,
      fontFamily:C.font,color:C.text,fontSize:11,overflow:'hidden',
      boxShadow:'0 8px 32px rgba(0,0,0,0.7)'
    }}>
      {/* Header */}
      <div style={{
        background:'linear-gradient(90deg,#0a1520,#0d1117)',
        borderBottom:`1px solid ${C.border}`,padding:'8px 12px',
        display:'flex',alignItems:'center',gap:8
      }}>
        <div style={{width:6,height:6,borderRadius:'50%',background:C.teal,boxShadow:`0 0 6px ${C.teal}`}}/>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:C.teal}}>FILM POST</span>
        <span style={{marginLeft:'auto',fontSize:9,color:C.dim}}>DAY 2</span>
      </div>

      <div style={{padding:'10px 12px',maxHeight:600,overflowY:'auto'}}>

        {/* HDRI */}
        <Section title="HDRI ENVIRONMENT" color={C.teal}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginBottom:8}}>
            {HDRI_PRESETS.map(h=>(
              <div key={h.key} onClick={()=>setHdriPreset(h.key)} style={{
                padding:'5px 6px',borderRadius:4,cursor:'pointer',fontSize:9,fontWeight:700,
                border:`1px solid ${hdriPreset===h.key?C.teal:C.border}`,
                color:hdriPreset===h.key?C.teal:C.dim,
                background:hdriPreset===h.key?'rgba(0,255,200,0.08)':C.bg,
                textAlign:'center',letterSpacing:0.5
              }}>{h.label}</div>
            ))}
          </div>
          <Slider label="ENV INTENSITY" value={envIntensity} min={0} max={3} step={0.05} onChange={setEnvIntensity}/>
          <button onClick={applyHDRI} style={{
            width:'100%',padding:'5px 0',marginTop:4,background:'rgba(0,255,200,0.1)',
            border:`1px solid ${C.teal}`,borderRadius:4,color:C.teal,
            fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer',letterSpacing:1
          }}>↺ REBUILD HDRI</button>
        </Section>

        {/* Tone Mapping */}
        <Section title="TONE MAPPING" color={C.orange}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginBottom:8}}>
            {TONE_MODES.map(m=>(
              <div key={m.key} onClick={()=>setToneMode(m.key)} style={{
                padding:'5px 6px',borderRadius:4,cursor:'pointer',fontSize:9,fontWeight:700,
                border:`1px solid ${toneMode===m.key?C.orange:C.border}`,
                color:toneMode===m.key?C.orange:C.dim,
                background:toneMode===m.key?'rgba(255,102,0,0.08)':C.bg,
                textAlign:'center',letterSpacing:0.5
              }}>{m.label}</div>
            ))}
          </div>
          <Slider label="EXPOSURE" value={exposure} min={0.1} max={3} step={0.05} onChange={setExposure}/>
        </Section>

        {/* Bloom */}
        <Section title="BLOOM" color="#ff88ff">
          <Toggle label="ENABLED" value={bloomOn} onChange={setBloomOn}/>
          <Slider label="STRENGTH"  value={bloomStrength} min={0} max={3}   step={0.05} onChange={setBloomStrength}/>
          <Slider label="RADIUS"    value={bloomRadius}   min={0} max={1}   step={0.01} onChange={setBloomRadius}/>
          <Slider label="THRESHOLD" value={bloomThresh}   min={0} max={1}   step={0.01} onChange={setBloomThresh}/>
        </Section>

        {/* SSAO */}
        <Section title="AMBIENT OCCLUSION" color="#88aaff">
          <Toggle label="ENABLED" value={ssaoOn} onChange={setSsaoOn}/>
          <Slider label="RADIUS"   value={ssaoRadius} min={0.1} max={4}    step={0.05} onChange={setSsaoRadius}/>
          <Slider label="MIN DIST" value={ssaoMin}    min={0.0001} max={0.01} step={0.0001} onChange={setSsaoMin}/>
          <Slider label="MAX DIST" value={ssaoMax}    min={0.01} max={0.5}  step={0.005} onChange={setSsaoMax}/>
        </Section>

        {/* Vignette */}
        <Section title="VIGNETTE" color="#aaffcc" defaultOpen={false}>
          <Toggle label="ENABLED" value={vigOn} onChange={setVigOn}/>
          <Slider label="INTENSITY" value={vigIntensity} min={0} max={1} step={0.01} onChange={setVigIntensity}/>
        </Section>

        {/* Film Grain */}
        <Section title="FILM GRAIN" color="#ffcc44" defaultOpen={false}>
          <Toggle label="ENABLED" value={grainOn} onChange={setGrainOn}/>
          <Slider label="AMOUNT" value={grainAmt} min={0} max={0.2} step={0.005} onChange={setGrainAmt}/>
        </Section>

      </div>

      {/* Vignette CSS overlay — injected into viewport parent */}
      <div ref={vigRef} style={{
        position:'fixed',inset:0,pointerEvents:'none',zIndex:998,display:vigOn?'block':'none',
        background:`radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vigIntensity}) 100%)`,
        opacity:vigIntensity
      }}/>
      {/* Film grain canvas overlay */}
      <canvas ref={grainRef} style={{
        position:'fixed',inset:0,pointerEvents:'none',zIndex:997,
        display:grainOn?'block':'none',mixBlendMode:'overlay',opacity:0.6,
        width:'100%',height:'100%'
      }}/>
    </div>
  );
}
