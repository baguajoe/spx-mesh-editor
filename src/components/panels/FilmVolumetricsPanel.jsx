import React, { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { applyVolumetricFog, createVolumetricSettings } from '../../mesh/VolumetricSystem.js';
const C={bg:'#06060f',panel:'#0d1117',border:'#21262d',teal:'#00ffc8',orange:'#FF6600',text:'#e0e0e0',dim:'#8b949e',font:'JetBrains Mono,monospace'};
function Slider({label,value,min,max,step=0.01,onChange,unit=''}){return(<div style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.dim,marginBottom:1}}><span>{label}</span><span style={{color:C.teal,fontWeight:700}}>{step<0.1?Number(value).toFixed(2):Math.round(value)}{unit}</span></div><input type='range' min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:'100%',accentColor:C.teal,cursor:'pointer',height:3}}/></div>);}
function Toggle({label,value,onChange}){return(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}><span style={{fontSize:9,color:C.dim}}>{label}</span><div onClick={()=>onChange(!value)} style={{width:32,height:16,borderRadius:8,cursor:'pointer',position:'relative',background:value?C.teal:C.border}}><div style={{position:'absolute',top:2,left:value?16:2,width:12,height:12,borderRadius:'50%',background:value?C.bg:'#555',transition:'left 0.15s'}}/></div></div>);}
function ColorRow({label,value,onChange}){return(<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}><span style={{fontSize:9,color:C.dim,flex:1}}>{label}</span><input type='color' value={value} onChange={e=>onChange(e.target.value)} style={{width:28,height:20,border:'none',background:'none',cursor:'pointer'}}/><span style={{fontSize:9,color:C.dim}}>{value}</span></div>);}
function Section({title,color=C.teal,children,defaultOpen=true}){const [open,setOpen]=useState(defaultOpen);return(<div style={{marginBottom:6}}><div onClick={()=>setOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',background:'#0a0f1a',borderRadius:4,cursor:'pointer',borderLeft:`2px solid ${color}`,marginBottom:open?5:0}}><span style={{color,fontSize:9}}>{open?'▾':'▸'}</span><span style={{fontSize:9,fontWeight:700,color:C.text,letterSpacing:1}}>{title}</span></div>{open&&<div style={{paddingLeft:8}}>{children}</div>}</div>);}
const FOG_PRESETS=[
  {label:'Clear',     enabled:false,type:'exp2',color:'#aabbcc',density:0.0},
  {label:'Light Haze',enabled:true, type:'exp2',color:'#c8d4e0',density:0.005},
  {label:'Morning',   enabled:true, type:'exp2',color:'#e8d8c0',density:0.015},
  {label:'Dense Fog', enabled:true, type:'exp2',color:'#aaaaaa',density:0.04},
  {label:'Night Fog', enabled:true, type:'exp2',color:'#202830',density:0.02},
  {label:'Dust',      enabled:true, type:'exp2',color:'#c8a870',density:0.025},
  {label:'Smoke',     enabled:true, type:'exp',color:'#404040', density:0.03},
];
export default function FilmVolumetricsPanel({sceneRef,open=true,onClose}){
  const [fogEnabled,setFogEnabled]=useState(false);
  const [fogType,setFogType]=useState('exp2');
  const [fogColor,setFogColor]=useState('#aabbcc');
  const [fogDensity,setFogDensity]=useState(0.02);
  const [fogNear,setFogNear]=useState(1);
  const [fogFar,setFogFar]=useState(100);
  const [godRays,setGodRays]=useState(false);
  const [godRayIntensity,setGodRayIntensity]=useState(0.5);
  const [heightFog,setHeightFog]=useState(false);
  const [heightStart,setHeightStart]=useState(0);
  const [heightEnd,setHeightEnd]=useState(5);
  const apply=useCallback(()=>{
    const scene=sceneRef?.current; if(!scene) return;
    const settings=createVolumetricSettings({
      enabled:fogEnabled,type:fogType,color:fogColor,density:fogDensity,
      near:fogNear,far:fogFar,godrays:godRays,godrayIntensity:godRayIntensity,
      heightFog,heightStart,heightEnd
    });
    try{ applyVolumetricFog(scene,settings); } catch(e){ console.warn(e); }
  },[fogEnabled,fogType,fogColor,fogDensity,fogNear,fogFar,godRays,godRayIntensity,heightFog,heightStart,heightEnd,sceneRef]);
  useEffect(()=>{ apply(); },[fogEnabled,fogColor,fogDensity,fogType]);
  const loadPreset=p=>{setFogEnabled(p.enabled);setFogType(p.type);setFogColor(p.color);setFogDensity(p.density);};
  if(!open) return null;
  return(<div style={{width:250,background:C.panel,borderRadius:6,border:`1px solid ${C.border}`,fontFamily:C.font,color:C.text,fontSize:11,boxShadow:'0 8px 32px rgba(0,0,0,0.7)',display:'flex',flexDirection:'column',maxHeight:620}}>
    <div style={{background:'linear-gradient(90deg,#0a1520,#0d1117)',borderBottom:`1px solid ${C.border}`,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:'#88ccff',boxShadow:'0 0 6px #88ccff'}}/><span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#88ccff'}}>VOLUMETRICS</span>
      {onClose&&<span onClick={onClose} style={{marginLeft:'auto',cursor:'pointer',color:C.dim}}>×</span>}
    </div>
    <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>
      <Section title='FOG PRESETS' color='#88ccff'>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3,marginBottom:6}}>{FOG_PRESETS.map(p=><div key={p.label} onClick={()=>loadPreset(p)} style={{padding:'4px 6px',borderRadius:4,cursor:'pointer',fontSize:9,fontWeight:700,border:`1px solid ${C.border}`,background:C.bg,color:C.dim,textAlign:'center'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#88ccff';e.currentTarget.style.color='#88ccff';}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.dim;}}>{p.label}</div>)}</div>
      </Section>
      <Section title='ATMOSPHERIC FOG' color={C.teal}>
        <Toggle label='ENABLE FOG' value={fogEnabled} onChange={setFogEnabled}/>
        <div style={{display:'flex',gap:4,marginBottom:6}}>{['exp','exp2','linear'].map(t=><div key={t} onClick={()=>setFogType(t)} style={{flex:1,padding:'4px',textAlign:'center',borderRadius:4,cursor:'pointer',fontSize:9,fontWeight:700,border:`1px solid ${fogType===t?C.teal:C.border}`,color:fogType===t?C.teal:C.dim,background:fogType===t?'rgba(0,255,200,0.1)':C.bg}}>{t.toUpperCase()}</div>)}</div>
        <ColorRow label='FOG COLOR' value={fogColor} onChange={setFogColor}/>
        <Slider label='DENSITY' value={fogDensity} min={0} max={0.1} step={0.001} onChange={setFogDensity}/>
        <Slider label='NEAR' value={fogNear} min={0} max={50} step={0.5} onChange={setFogNear}/>
        <Slider label='FAR' value={fogFar} min={10} max={500} step={1} onChange={setFogFar}/>
      </Section>
      <Section title='HEIGHT FOG' color='#aaffcc' defaultOpen={false}>
        <Toggle label='HEIGHT FOG' value={heightFog} onChange={setHeightFog}/>
        <Slider label='START HEIGHT' value={heightStart} min={-10} max={20} step={0.1} onChange={setHeightStart}/>
        <Slider label='END HEIGHT' value={heightEnd} min={0} max={30} step={0.1} onChange={setHeightEnd}/>
      </Section>
      <Section title='GOD RAYS' color={C.orange} defaultOpen={false}>
        <Toggle label='GOD RAYS' value={godRays} onChange={setGodRays}/>
        <Slider label='INTENSITY' value={godRayIntensity} min={0} max={1} step={0.01} onChange={setGodRayIntensity}/>
      </Section>
      <button onClick={apply} style={{width:'100%',padding:'7px 0',marginTop:4,background:'rgba(136,204,255,0.1)',border:'1px solid #88ccff',borderRadius:4,color:'#88ccff',fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer',letterSpacing:1}}>APPLY TO SCENE</button>
    </div>
  </div>);
}