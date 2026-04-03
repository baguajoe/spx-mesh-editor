import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { createDestructionSystem, fractureMesh, explode, stepDestruction, resetDestruction } from '../../mesh/DestructionSystem.js';

const C={bg:'#06060f',panel:'#0d1117',border:'#21262d',teal:'#00ffc8',orange:'#FF6600',text:'#e0e0e0',dim:'#8b949e',font:'JetBrains Mono,monospace'};

function Knob({label,value,min,max,step=1,onChange,color=C.teal,unit=''}) {
  const pct=Math.min(1,Math.max(0,(value-min)/(max-min)));
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:54}}>
      <div style={{width:44,height:44,borderRadius:'50%',background:`conic-gradient(${color} 0% ${pct*100}%, #1a2030 ${pct*100}% 100%)`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'ns-resize',border:'2px solid #1a2030'}}
        onMouseDown={e=>{const sy=e.clientY,sv=value;const mv=ev=>{const d=(sy-ev.clientY)/80*(max-min);onChange(Math.min(max,Math.max(min,Math.round((sv+d)/step)*step)));};const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);}}>
        <div style={{width:30,height:30,borderRadius:'50%',background:C.panel,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:8,fontWeight:700,color,fontFamily:C.font}}>{Math.round(value)}{unit}</span>
        </div>
      </div>
      <span style={{fontSize:7,color:C.dim,letterSpacing:0.3,textTransform:'uppercase',textAlign:'center',fontFamily:C.font}}>{label}</span>
    </div>
  );
}

export default function DestructionPanel({sceneRef,meshRef,open=true,onClose}) {
  const [pieces,setPieces]=useState(12);
  const [strength,setStrength]=useState(25);
  const [radius,setRadius]=useState(6);
  const [simulating,setSimulating]=useState(false);
  const [status,setStatus]=useState('Select a mesh and fracture');
  const [fragCount,setFragCount]=useState(0);
  const systemRef=useRef(null);
  const rafRef=useRef(null);

  const initSystem=useCallback(async()=>{
    const scene=sceneRef?.current; if(!scene) return;
    setStatus('Initializing Rapier...');
    try {
      systemRef.current=await createDestructionSystem(scene);
      setStatus('Ready — select mesh to fracture');
    } catch(e) { setStatus('Error: '+e.message); }
  },[sceneRef]);

  const doFracture=useCallback(()=>{
    const mesh=meshRef?.current;
    const scene=sceneRef?.current;
    if(!mesh||!scene){setStatus('No mesh selected');return;}
    if(!systemRef.current){setStatus('Init first');return;}
    try {
      const frags=fractureMesh(systemRef.current,mesh,{pieces});
      setFragCount(frags.length);
      setStatus(`Fractured into ${frags.length} pieces`);
    } catch(e){setStatus('Fracture error: '+e.message);}
  },[meshRef,sceneRef,pieces]);

  const doExplode=useCallback(()=>{
    if(!systemRef.current){setStatus('Init & fracture first');return;}
    explode(systemRef.current,new THREE.Vector3(0,0,0),strength,radius);
    if(!simulating) startSim();
  },[simulating,strength,radius]);

  const startSim=useCallback(()=>{
    if(!systemRef.current) return;
    setSimulating(true);
    const tick=()=>{stepDestruction(systemRef.current);rafRef.current=requestAnimationFrame(tick);};
    rafRef.current=requestAnimationFrame(tick);
  },[]);

  const stopSim=useCallback(()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);setSimulating(false);},[]);

  const reset=useCallback(()=>{
    stopSim();
    if(systemRef.current){resetDestruction(systemRef.current);}
    setFragCount(0); setStatus('Reset');
  },[stopSim]);

  useEffect(()=>{initSystem();},[]);
  useEffect(()=>()=>{stopSim();},[]);
  if(!open) return null;

  return (
    <div style={{width:300,background:C.panel,borderRadius:8,border:`1px solid ${C.border}`,fontFamily:C.font,color:C.text,boxShadow:'0 16px 48px rgba(0,0,0,0.8)',display:'flex',flexDirection:'column',maxHeight:580}}>
      <div style={{background:'linear-gradient(135deg,#0a1020,#0d1117)',borderBottom:`1px solid ${C.border}`,padding:'10px 14px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:'#ff4400',boxShadow:'0 0 10px #ff4400'}}/>
        <span style={{fontSize:12,fontWeight:700,letterSpacing:3,color:'#ff4400'}}>DESTRUCTION</span>
        {onClose&&<span onClick={onClose} style={{marginLeft:'auto',cursor:'pointer',color:C.dim,fontSize:14}}>×</span>}
      </div>
      <div style={{padding:'5px 14px',fontSize:9,color:C.dim,borderBottom:`1px solid ${C.border}`}}>{status}{fragCount>0&&` | ${fragCount} fragments`}</div>
      <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>
        <div style={{fontSize:9,fontWeight:700,color:C.dim,letterSpacing:2,marginBottom:10}}>FRACTURE SETTINGS</div>
        <div style={{display:'flex',justifyContent:'space-around',gap:10,marginBottom:14}}>
          <Knob label="Pieces"   value={pieces}   min={4}  max={64} step={1}  onChange={setPieces}   color='#ff4400'/>
          <Knob label="Strength" value={strength} min={1}  max={100}step={1}  onChange={setStrength} color={C.orange}/>
          <Knob label="Radius"   value={radius}   min={1}  max={20} step={0.5}onChange={setRadius}   color='#ffaa44'/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6}}>
          <button onClick={doFracture} style={{padding:'8px 0',background:'rgba(255,68,0,0.1)',border:'1px solid #ff4400',borderRadius:5,color:'#ff4400',fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer',letterSpacing:1}}>💥 FRACTURE</button>
          <button onClick={doExplode} style={{padding:'8px 0',background:'rgba(255,102,0,0.1)',border:`1px solid ${C.orange}`,borderRadius:5,color:C.orange,fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer'}}>🔥 EXPLODE</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
          {!simulating?<button onClick={startSim} style={{padding:'7px 0',background:'rgba(0,255,200,0.08)',border:`1px solid ${C.teal}`,borderRadius:5,color:C.teal,fontFamily:C.font,fontSize:9,cursor:'pointer'}}>▶ SIM</button>
          :<button onClick={stopSim} style={{padding:'7px 0',background:'rgba(255,102,0,0.1)',border:`1px solid ${C.orange}`,borderRadius:5,color:C.orange,fontFamily:C.font,fontSize:9,cursor:'pointer'}}>■ STOP</button>}
          <button onClick={reset} style={{padding:'7px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,color:C.dim,fontFamily:C.font,fontSize:9,cursor:'pointer'}}>↺ RESET</button>
          <button onClick={initSystem} style={{padding:'7px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,color:C.dim,fontFamily:C.font,fontSize:9,cursor:'pointer'}}>⚙ INIT</button>
        </div>
      </div>
    </div>
  );
}
