import React, { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
const C={bg:'#06060f',panel:'#0d1117',border:'#21262d',teal:'#00ffc8',orange:'#FF6600',text:'#e0e0e0',dim:'#8b949e',font:'JetBrains Mono,monospace'};
function Slider({label,value,min,max,step=0.01,onChange,unit=''}){return(<div style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.dim,marginBottom:1}}><span>{label}</span><span style={{color:C.teal,fontWeight:700}}>{step<0.1?Number(value).toFixed(2):Math.round(value)}{unit}</span></div><input type='range' min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:'100%',accentColor:C.teal,cursor:'pointer',height:3}}/></div>);}
function Toggle({label,value,onChange}){return(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}><span style={{fontSize:9,color:C.dim}}>{label}</span><div onClick={()=>onChange(!value)} style={{width:32,height:16,borderRadius:8,cursor:'pointer',position:'relative',background:value?C.teal:C.border}}><div style={{position:'absolute',top:2,left:value?16:2,width:12,height:12,borderRadius:'50%',background:value?C.bg:'#555',transition:'left 0.15s'}}/></div></div>);}
function Section({title,color=C.teal,children,defaultOpen=true}){const [open,setOpen]=useState(defaultOpen);return(<div style={{marginBottom:6}}><div onClick={()=>setOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',background:'#0a0f1a',borderRadius:4,cursor:'pointer',borderLeft:`2px solid ${color}`,marginBottom:open?5:0}}><span style={{color,fontSize:9}}>{open?'▾':'▸'}</span><span style={{fontSize:9,fontWeight:700,color:C.text,letterSpacing:1}}>{title}</span></div>{open&&<div style={{paddingLeft:8}}>{children}</div>}</div>);}
const FILM_GATES=[{label:'Full Frame 35mm',w:36,h:24},{label:'Super 35',w:24.89,h:18.67},{label:'IMAX 70mm',w:70.41,h:52.63},{label:'Anamorphic 2x',w:36,h:24},{label:'16mm',w:12.52,h:7.41},{label:'2.39:1 Scope',w:36,h:15.05}];
const FOCAL_PRESETS=[{label:'14mm',v:14},{label:'24mm',v:24},{label:'35mm',v:35},{label:'50mm',v:50},{label:'85mm',v:85},{label:'135mm',v:135},{label:'200mm',v:200}];
export default function FilmCameraPanel({cameraRef,rendererRef,sceneRef,open=true,onClose}){
  const [fov,setFov]=useState(55);
  const [focalLength,setFocalLength]=useState(35);
  const [filmGate,setFilmGate]=useState(0);
  const [near,setNear]=useState(0.01);
  const [far,setFar]=useState(1000);
  const [dofEnabled,setDofEnabled]=useState(false);
  const [dofFocus,setDofFocus]=useState(5.0);
  const [dofAperture,setDofAperture]=useState(0.025);
  const [dofMaxBlur,setDofMaxBlur]=useState(0.01);
  const [bookmarks,setBookmarks]=useState([]);
  const [exposure,setExposure]=useState(1.1);
  const cam=useCallback(()=>cameraRef?.current,[cameraRef]);
  // Focal length → FOV conversion
  const focalToFov=useCallback((fl,gateIdx)=>{
    const gate=FILM_GATES[gateIdx]||FILM_GATES[0];
    return 2*Math.atan(gate.h/(2*fl))*(180/Math.PI);
  },[]);
  useEffect(()=>{
    const c=cam(); if(!c) return;
    const newFov=focalToFov(focalLength,filmGate);
    setFov(newFov);
    c.fov=newFov; c.near=near; c.far=far;
    c.updateProjectionMatrix();
    c.userData.dofEnabled=dofEnabled;
    c.userData.dofFocus=dofFocus;
    c.userData.dofAperture=dofAperture;
    c.userData.dofMaxBlur=dofMaxBlur;
    // Wire DOF to BokehPass if composer has it
    const composer=rendererRef?.current?._composer;
    if(composer){
      const bokeh=composer.passes?.find?.(p=>p.constructor?.name==='BokehPass');
      if(bokeh){bokeh.enabled=dofEnabled;bokeh.uniforms?.focus?.value&&(bokeh.uniforms.focus.value=dofFocus);bokeh.uniforms?.aperture?.value&&(bokeh.uniforms.aperture.value=dofAperture);bokeh.uniforms?.maxblur?.value&&(bokeh.uniforms.maxblur.value=dofMaxBlur);}
    }
    if(rendererRef?.current) rendererRef.current.toneMappingExposure=exposure;
  },[focalLength,filmGate,near,far,dofEnabled,dofFocus,dofAperture,dofMaxBlur,exposure]);
  const saveBookmark=useCallback(()=>{
    const c=cam(); if(!c) return;
    setBookmarks(b=>[...b,{id:Date.now(),name:`Cam ${b.length+1}`,pos:c.position.clone(),rot:c.rotation.clone(),fov:c.fov}]);
  },[cam]);
  const restoreBookmark=useCallback((bm)=>{
    const c=cam(); if(!c) return;
    c.position.copy(bm.pos); c.rotation.copy(bm.rot);
    c.fov=bm.fov; c.updateProjectionMatrix();
    setFov(bm.fov);
  },[cam]);
  if(!open) return null;
  return(<div style={{width:250,background:C.panel,borderRadius:6,border:`1px solid ${C.border}`,fontFamily:C.font,color:C.text,fontSize:11,boxShadow:'0 8px 32px rgba(0,0,0,0.7)',display:'flex',flexDirection:'column',maxHeight:680}}>
    <div style={{background:'linear-gradient(90deg,#0a1520,#0d1117)',borderBottom:`1px solid ${C.border}`,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:'#ffaa00',boxShadow:'0 0 6px #ffaa00'}}/><span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#ffaa00'}}>FILM CAMERA</span>
      {onClose&&<span onClick={onClose} style={{marginLeft:'auto',cursor:'pointer',color:C.dim}}>×</span>}
    </div>
    <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>
      <Section title='FOCAL LENGTH' color='#ffaa00'>
        <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:8}}>{FOCAL_PRESETS.map(p=><div key={p.v} onClick={()=>setFocalLength(p.v)} style={{padding:'3px 8px',borderRadius:3,cursor:'pointer',fontSize:9,fontWeight:700,border:`1px solid ${focalLength===p.v?'#ffaa00':C.border}`,color:focalLength===p.v?'#ffaa00':C.dim,background:focalLength===p.v?'rgba(255,170,0,0.1)':C.bg}}>{p.label}</div>)}</div>
        <Slider label='FOCAL LENGTH' value={focalLength} min={8} max={500} step={1} onChange={setFocalLength} unit='mm'/>
        <Slider label='FOV' value={fov} min={5} max={120} step={0.1} onChange={v=>{setFov(v);const c=cam();if(c){c.fov=v;c.updateProjectionMatrix();}}}/>
      </Section>
      <Section title='FILM GATE' color='#aaaaff'>
        <div style={{display:'flex',flexDirection:'column',gap:3}}>{FILM_GATES.map((g,i)=><div key={i} onClick={()=>setFilmGate(i)} style={{padding:'4px 8px',borderRadius:4,cursor:'pointer',fontSize:9,fontWeight:700,border:`1px solid ${filmGate===i?'#aaaaff':C.border}`,color:filmGate===i?'#aaaaff':C.dim,background:filmGate===i?'rgba(170,170,255,0.1)':C.bg,display:'flex',justifyContent:'space-between'}}><span>{g.label}</span><span style={{color:C.dim}}>{g.w}×{g.h}mm</span></div>)}</div>
      </Section>
      <Section title='DEPTH OF FIELD' color='#ff88cc'>
        <Toggle label='ENABLE DOF' value={dofEnabled} onChange={setDofEnabled}/>
        <Slider label='FOCUS DISTANCE' value={dofFocus} min={0.1} max={100} step={0.1} onChange={setDofFocus} unit='m'/>
        <Slider label='APERTURE (f/)' value={dofAperture} min={0.001} max={0.1} step={0.001} onChange={setDofAperture}/>
        <Slider label='MAX BLUR' value={dofMaxBlur} min={0.001} max={0.05} step={0.001} onChange={setDofMaxBlur}/>
      </Section>
      <Section title='EXPOSURE' color={C.orange}>
        <Slider label='EXPOSURE' value={exposure} min={0.1} max={4} step={0.05} onChange={setExposure}/>
        <Slider label='NEAR CLIP' value={near} min={0.001} max={1} step={0.001} onChange={setNear}/>
        <Slider label='FAR CLIP' value={far} min={10} max={10000} step={10} onChange={setFar}/>
      </Section>
      <Section title='CAMERA BOOKMARKS' color={C.teal} defaultOpen={false}>
        <button onClick={saveBookmark} style={{width:'100%',padding:'6px 0',marginBottom:6,background:'rgba(0,255,200,0.1)',border:`1px solid ${C.teal}`,borderRadius:4,color:C.teal,fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer'}}>+ SAVE POSITION</button>
        {bookmarks.map(bm=><div key={bm.id} onClick={()=>restoreBookmark(bm)} style={{padding:'4px 8px',marginBottom:3,borderRadius:4,cursor:'pointer',border:`1px solid ${C.border}`,background:C.bg,fontSize:9,color:C.dim,display:'flex',justifyContent:'space-between'}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.teal} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}><span>{bm.name}</span><span>FOV {Math.round(bm.fov)}°</span></div>)}
      </Section>
    </div>
  </div>);
}