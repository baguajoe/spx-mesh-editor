import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { createCloth, stepCloth, applyClothToMesh } from '../../mesh/ClothSystem.js';
const C={bg:'#06060f',panel:'#0d1117',border:'#21262d',teal:'#00ffc8',orange:'#FF6600',text:'#e0e0e0',dim:'#8b949e',font:'JetBrains Mono,monospace'};
function Slider({label,value,min,max,step=0.01,onChange,unit=''}){return(<div style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.dim,marginBottom:1}}><span>{label}</span><span style={{color:C.teal,fontWeight:700}}>{step<0.1?Number(value).toFixed(2):Math.round(value)}{unit}</span></div><input type='range' min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:'100%',accentColor:C.teal,cursor:'pointer',height:3}}/></div>);}
function Toggle({label,value,onChange}){return(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}><span style={{fontSize:9,color:C.dim}}>{label}</span><div onClick={()=>onChange(!value)} style={{width:32,height:16,borderRadius:8,cursor:'pointer',position:'relative',background:value?C.teal:C.border}}><div style={{position:'absolute',top:2,left:value?16:2,width:12,height:12,borderRadius:'50%',background:value?C.bg:'#555',transition:'left 0.15s'}}/></div></div>);}
function Section({title,color=C.teal,children,defaultOpen=true}){const [open,setOpen]=useState(defaultOpen);return(<div style={{marginBottom:6}}><div onClick={()=>setOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',background:'#0a0f1a',borderRadius:4,cursor:'pointer',borderLeft:`2px solid ${color}`,marginBottom:open?5:0}}><span style={{color,fontSize:9}}>{open?'▾':'▸'}</span><span style={{fontSize:9,fontWeight:700,color:C.text,letterSpacing:1}}>{title}</span></div>{open&&<div style={{paddingLeft:8}}>{children}</div>}</div>);}
const FABRIC_PRESETS=[
  {label:'Silk',      stiffness:0.98,shearStiff:0.9, bendStiff:0.1, damping:0.998,gravity:-9.8,mass:0.3},
  {label:'Cotton',    stiffness:0.95,shearStiff:0.8, bendStiff:0.3, damping:0.99, gravity:-9.8,mass:0.8},
  {label:'Denim',     stiffness:0.99,shearStiff:0.95,bendStiff:0.7, damping:0.98, gravity:-9.8,mass:1.5},
  {label:'Leather',   stiffness:0.99,shearStiff:0.99,bendStiff:0.9, damping:0.97, gravity:-9.8,mass:2.5},
  {label:'Chiffon',   stiffness:0.9, shearStiff:0.7, bendStiff:0.05,damping:0.999,gravity:-9.8,mass:0.2},
  {label:'Wool',      stiffness:0.93,shearStiff:0.75,bendStiff:0.4, damping:0.99, gravity:-9.8,mass:1.2},
];
export default function ClothSimPanel({meshRef,sceneRef,open=true,onClose}){
  const [simulating,setSimulating]=useState(false);
  const [stiffness,setStiffness]=useState(0.95);
  const [shearStiff,setShearStiff]=useState(0.8);
  const [bendStiff,setBendStiff]=useState(0.3);
  const [damping,setDamping]=useState(0.99);
  const [gravity,setGravity]=useState(-9.8);
  const [mass,setMass]=useState(0.8);
  const [windX,setWindX]=useState(0);
  const [windY,setWindY]=useState(0);
  const [windZ,setWindZ]=useState(0);
  const [tearing,setTearing]=useState(false);
  const [selfCollision,setSelfCollision]=useState(false);
  const [iterations,setIterations]=useState(12);
  const [pinTop,setPinTop]=useState(true);
  const [status,setStatus]=useState('IDLE');
  const clothRef=useRef(null);
  const rafRef=useRef(null);
  const initCloth=useCallback(()=>{
    const mesh=meshRef?.current; if(!mesh){setStatus('No mesh selected');return;}
    try{
      const cloth=createCloth(mesh,{mass,stiffness,shearStiff,bendStiff,damping,gravity,iterations,windForce:new THREE.Vector3(windX,windY,windZ),tearing,selfCollision});
      if(!cloth){setStatus('Cloth init failed');return;}
      // Pin top row
      if(pinTop&&cloth.particles.length>0){
        const pos=mesh.geometry.attributes.position;
        let maxY=-Infinity;
        cloth.particles.forEach(p=>{if(p.position.y>maxY)maxY=p.position.y;});
        cloth.particles.forEach(p=>{if(Math.abs(p.position.y-maxY)<0.05){p.pinned=true;p.invMass=0;}});
      }
      clothRef.current=cloth;
      setStatus('READY — '+cloth.particles.length+' particles');
    }catch(e){setStatus('Error: '+e.message);console.error(e);}
  },[meshRef,mass,stiffness,shearStiff,bendStiff,damping,gravity,iterations,windX,windY,windZ,tearing,selfCollision,pinTop]);
  const startSim=useCallback(()=>{
    if(!clothRef.current){initCloth();setTimeout(startSim,100);return;}
    setSimulating(true); setStatus('SIMULATING');
    const tick=()=>{
      if(!clothRef.current){setSimulating(false);return;}
      try{
        // Update wind
        clothRef.current.windForce.set(windX,windY,windZ);
        stepCloth(clothRef.current,1/60);
        if(meshRef?.current) applyClothToMesh(clothRef.current,meshRef.current);
      }catch(e){console.error(e);}
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
  },[clothRef,initCloth,meshRef,windX,windY,windZ]);
  const stopSim=useCallback(()=>{
    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    setSimulating(false); setStatus('STOPPED');
  },[]);
  const resetSim=useCallback(()=>{
    stopSim(); clothRef.current=null; setStatus('IDLE');
  },[stopSim]);
  useEffect(()=>()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);},[]);
  const loadPreset=p=>{setStiffness(p.stiffness);setShearStiff(p.shearStiff);setBendStiff(p.bendStiff);setDamping(p.damping);setGravity(p.gravity);setMass(p.mass);};
  if(!open) return null;
  return(<div style={{width:250,background:C.panel,borderRadius:6,border:`1px solid ${C.border}`,fontFamily:C.font,color:C.text,fontSize:11,boxShadow:'0 8px 32px rgba(0,0,0,0.7)',display:'flex',flexDirection:'column',maxHeight:700}}>
    <div style={{background:'linear-gradient(90deg,#0a1520,#0d1117)',borderBottom:`1px solid ${C.border}`,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:'#88ffaa',boxShadow:'0 0 6px #88ffaa'}}/><span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#88ffaa'}}>CLOTH SIM</span>
      {onClose&&<span onClick={onClose} style={{marginLeft:'auto',cursor:'pointer',color:C.dim}}>×</span>}
    </div>
    <div style={{padding:'6px 12px',borderBottom:`1px solid ${C.border}`,fontSize:9,color:simulating?'#88ffaa':C.dim,fontWeight:700,letterSpacing:1}}>{status}</div>
    <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>
      <Section title='FABRIC PRESETS' color='#88ffaa'>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3,marginBottom:6}}>{FABRIC_PRESETS.map(p=><div key={p.label} onClick={()=>loadPreset(p)} style={{padding:'4px 6px',borderRadius:4,cursor:'pointer',fontSize:9,fontWeight:700,border:`1px solid ${C.border}`,background:C.bg,color:C.dim,textAlign:'center'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#88ffaa';e.currentTarget.style.color='#88ffaa';}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.dim;}}>{p.label}</div>)}</div>
      </Section>
      <Section title='PHYSICS' color={C.teal}>
        <Slider label='MASS' value={mass} min={0.1} max={5} step={0.1} onChange={setMass} unit='kg'/>
        <Slider label='STIFFNESS' value={stiffness} min={0.5} max={1} step={0.01} onChange={setStiffness}/>
        <Slider label='SHEAR' value={shearStiff} min={0.1} max={1} step={0.01} onChange={setShearStiff}/>
        <Slider label='BEND' value={bendStiff} min={0} max={1} step={0.01} onChange={setBendStiff}/>
        <Slider label='DAMPING' value={damping} min={0.9} max={1} step={0.001} onChange={setDamping}/>
        <Slider label='GRAVITY' value={gravity} min={-20} max={0} step={0.1} onChange={setGravity}/>
        <Slider label='ITERATIONS' value={iterations} min={4} max={32} step={1} onChange={setIterations}/>
      </Section>
      <Section title='WIND' color={C.orange} defaultOpen={false}>
        <Slider label='WIND X' value={windX} min={-10} max={10} step={0.1} onChange={setWindX}/>
        <Slider label='WIND Y' value={windY} min={-10} max={10} step={0.1} onChange={setWindY}/>
        <Slider label='WIND Z' value={windZ} min={-10} max={10} step={0.1} onChange={setWindZ}/>
      </Section>
      <Section title='OPTIONS' color={C.dim} defaultOpen={false}>
        <Toggle label='PIN TOP ROW' value={pinTop} onChange={setPinTop}/>
        <Toggle label='TEARING' value={tearing} onChange={setTearing}/>
        <Toggle label='SELF COLLISION' value={selfCollision} onChange={setSelfCollision}/>
      </Section>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:4,marginTop:8}}>
        <button onClick={initCloth} style={{padding:'6px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.dim,fontFamily:C.font,fontSize:8,fontWeight:700,cursor:'pointer'}}>INIT</button>
        {!simulating?<button onClick={startSim} style={{padding:'6px 0',background:'rgba(136,255,170,0.1)',border:'1px solid #88ffaa',borderRadius:4,color:'#88ffaa',fontFamily:C.font,fontSize:8,fontWeight:700,cursor:'pointer'}}>▶ PLAY</button>:<button onClick={stopSim} style={{padding:'6px 0',background:'rgba(255,102,0,0.1)',border:`1px solid ${C.orange}`,borderRadius:4,color:C.orange,fontFamily:C.font,fontSize:8,fontWeight:700,cursor:'pointer'}}>■ STOP</button>}
        <button onClick={resetSim} style={{padding:'6px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.dim,fontFamily:C.font,fontSize:8,fontWeight:700,cursor:'pointer'}}>↺ RESET</button>
      </div>
    </div>
  </div>);
}