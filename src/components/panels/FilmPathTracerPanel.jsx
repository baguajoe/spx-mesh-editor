import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
const C={bg:'#06060f',panel:'#0d1117',border:'#21262d',teal:'#00ffc8',orange:'#FF6600',text:'#e0e0e0',dim:'#8b949e',font:'JetBrains Mono,monospace'};
function Slider({label,value,min,max,step=1,onChange,unit=''}){return(<div style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.dim,marginBottom:1}}><span>{label}</span><span style={{color:C.teal,fontWeight:700}}>{step<0.1?Number(value).toFixed(2):Math.round(value)}{unit}</span></div><input type='range' min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:'100%',accentColor:C.teal,cursor:'pointer',height:3}}/></div>);}
function Toggle({label,value,onChange}){return(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}><span style={{fontSize:9,color:C.dim}}>{label}</span><div onClick={()=>onChange(!value)} style={{width:32,height:16,borderRadius:8,cursor:'pointer',position:'relative',background:value?C.teal:C.border}}><div style={{position:'absolute',top:2,left:value?16:2,width:12,height:12,borderRadius:'50%',background:value?C.bg:'#555',transition:'left 0.15s'}}/></div></div>);}
function Section({title,color=C.teal,children,defaultOpen=true}){const [open,setOpen]=useState(defaultOpen);return(<div style={{marginBottom:6}}><div onClick={()=>setOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',background:'#0a0f1a',borderRadius:4,cursor:'pointer',borderLeft:`2px solid ${color}`,marginBottom:open?5:0}}><span style={{color,fontSize:9}}>{open?'▾':'▸'}</span><span style={{fontSize:9,fontWeight:700,color:C.text,letterSpacing:1}}>{title}</span></div>{open&&<div style={{paddingLeft:8}}>{children}</div>}</div>);}
export default function FilmPathTracerPanel({rendererRef,sceneRef,cameraRef,open=true,onClose}){
  const [samples,setSamples]=useState(256);
  const [bounces,setBounces]=useState(8);
  const [rendering,setRendering]=useState(false);
  const [progress,setProgress]=useState(0);
  const [preview,setPreview]=useState(null);
  const [renderTime,setRenderTime]=useState(null);
  const [resolution,setResolution]=useState(1);
  const [denoise,setDenoise]=useState(true);
  const [gi,setGi]=useState(true);
  const [caustics,setCaustics]=useState(false);
  const ptRef=useRef(null);
  const RESOLUTIONS=[{label:'Preview',w:960,h:540},{label:'1080p',w:1920,h:1080},{label:'2K',w:2048,h:1152},{label:'4K',w:3840,h:2160}];
  const startRender=useCallback(async()=>{
    const r=rendererRef?.current; const s=sceneRef?.current; const c=cameraRef?.current;
    if(!r||!s||!c) return;
    setRendering(true); setProgress(0); setRenderTime(null);
    const t0=performance.now();
    const res=RESOLUTIONS[resolution];
    const origSize=new THREE.Vector2(); r.getSize(origSize);
    r.setSize(res.w,res.h);
    try {
      // Try GPU path tracer first
      const {PathTracingRenderer,PhysicalCamera,BlinnPhongMaterial}=await import('three-gpu-pathtracer');
      if(ptRef.current) { ptRef.current.dispose?.(); ptRef.current=null; }
      const pt=new PathTracingRenderer({renderer:r});
      pt.camera=c;
      pt.alpha=false;
      pt.material.bounces=bounces;
      pt.material.physicalCamera=new PhysicalCamera();
      pt.setScene(s,c).then(()=>{
        let sampleCount=0;
        const tick=()=>{
          if(sampleCount>=samples){
            const url=r.domElement.toDataURL('image/png');
            setPreview(url); setRendering(false);
            setRenderTime(((performance.now()-t0)/1000).toFixed(1));
            setProgress(100);
            r.setSize(origSize.x,origSize.y);
            return;
          }
          pt.update();
          sampleCount++;
          setProgress(Math.round(sampleCount/samples*100));
          requestAnimationFrame(tick);
        };
        tick();
      });
      ptRef.current=pt;
    } catch(e) {
      console.warn('GPU path tracer failed, falling back to WebGL render:', e);
      // Fallback: high-quality WebGL render
      r.render(s,c);
      const url=r.domElement.toDataURL('image/png');
      setPreview(url); setRendering(false);
      setRenderTime(((performance.now()-t0)/1000).toFixed(1));
      setProgress(100);
      r.setSize(origSize.x,origSize.y);
    }
  },[rendererRef,sceneRef,cameraRef,samples,bounces,resolution]);
  const cancelRender=useCallback(()=>{
    ptRef.current?.dispose?.(); ptRef.current=null;
    setRendering(false); setProgress(0);
  },[]);
  const downloadRender=useCallback(()=>{
    if(!preview) return;
    const a=document.createElement('a'); a.href=preview;
    a.download=`spx_pathrender_${Date.now()}.png`; a.click();
  },[preview]);
  if(!open) return null;
  return(<div style={{width:260,background:C.panel,borderRadius:6,border:`1px solid ${C.border}`,fontFamily:C.font,color:C.text,fontSize:11,boxShadow:'0 8px 32px rgba(0,0,0,0.7)',display:'flex',flexDirection:'column',maxHeight:700}}>
    <div style={{background:'linear-gradient(90deg,#0a1520,#0d1117)',borderBottom:`1px solid ${C.border}`,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:'#ffff44',boxShadow:'0 0 8px #ffff44'}}/><span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#ffff44'}}>PATH TRACER</span>
      {onClose&&<span onClick={onClose} style={{marginLeft:'auto',cursor:'pointer',color:C.dim}}>×</span>}
    </div>
    <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>
      <Section title='RENDER SETTINGS' color='#ffff44'>
        <Slider label='SAMPLES' value={samples} min={16} max={2048} step={16} onChange={setSamples}/>
        <Slider label='BOUNCES' value={bounces} min={1} max={32} step={1} onChange={setBounces}/>
        <div style={{display:'flex',flexDirection:'column',gap:3,marginBottom:6}}>{RESOLUTIONS.map((res,i)=><div key={i} onClick={()=>setResolution(i)} style={{padding:'4px 8px',borderRadius:4,cursor:'pointer',fontSize:9,fontWeight:700,border:`1px solid ${resolution===i?'#ffff44':C.border}`,color:resolution===i?'#ffff44':C.dim,background:resolution===i?'rgba(255,255,68,0.08)':C.bg,display:'flex',justifyContent:'space-between'}}><span>{res.label}</span><span style={{color:C.dim}}>{res.w}×{res.h}</span></div>)}</div>
        <Toggle label='GLOBAL ILLUMINATION' value={gi} onChange={setGi}/>
        <Toggle label='CAUSTICS' value={caustics} onChange={setCaustics}/>
        <Toggle label='DENOISE' value={denoise} onChange={setDenoise}/>
      </Section>
      {rendering&&<div style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.dim,marginBottom:3}}><span>RENDERING...</span><span style={{color:'#ffff44'}}>{progress}%</span></div><div style={{height:4,background:C.border,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${progress}%`,background:'linear-gradient(90deg,#ffff44,#00ffc8)',transition:'width 0.3s'}}/></div></div>}
      {preview&&<img src={preview} style={{width:'100%',borderRadius:4,marginBottom:6,border:`1px solid ${C.border}`}} alt='path trace preview'/>}
      {renderTime&&<div style={{fontSize:9,color:C.dim,marginBottom:6,textAlign:'center'}}>Rendered in {renderTime}s</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        {!rendering?<button onClick={startRender} style={{padding:'8px 0',background:'rgba(255,255,68,0.1)',border:'1px solid #ffff44',borderRadius:4,color:'#ffff44',fontFamily:C.font,fontSize:10,fontWeight:700,cursor:'pointer',letterSpacing:1}}>▶ RENDER</button>:<button onClick={cancelRender} style={{padding:'8px 0',background:'rgba(255,102,0,0.1)',border:`1px solid ${C.orange}`,borderRadius:4,color:C.orange,fontFamily:C.font,fontSize:10,fontWeight:700,cursor:'pointer'}}>■ CANCEL</button>}
        <button onClick={downloadRender} disabled={!preview} style={{padding:'8px 0',background:'rgba(0,255,200,0.1)',border:`1px solid ${C.teal}`,borderRadius:4,color:C.teal,fontFamily:C.font,fontSize:10,fontWeight:700,cursor:'pointer',opacity:preview?1:0.4}}>↓ SAVE</button>
      </div>
    </div>
  </div>);
}