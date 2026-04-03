import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { initRapier, createPhysicsWorld, addRigidBody, addGroundPlane, stepPhysics, applyImpulse, applyExplosion, removeBody, disposePhysics } from '../../mesh/PhysicsSystem.js';

const C={bg:'#06060f',panel:'#0d1117',border:'#21262d',teal:'#00ffc8',orange:'#FF6600',text:'#e0e0e0',dim:'#8b949e',font:'JetBrains Mono,monospace'};

function Knob({label,value,min,max,step=0.01,onChange,color=C.teal,unit=''}) {
  const pct=Math.min(1,Math.max(0,(value-min)/(max-min)));
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:54}}>
      <div style={{width:44,height:44,borderRadius:'50%',background:`conic-gradient(${color} 0% ${pct*100}%, #1a2030 ${pct*100}% 100%)`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'ns-resize',border:'2px solid #1a2030'}}
        onMouseDown={e=>{const sy=e.clientY,sv=value;const mv=ev=>{const d=(sy-ev.clientY)/80*(max-min);onChange(Math.min(max,Math.max(min,parseFloat((sv+d).toFixed(4)))));};const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);}}>
        <div style={{width:30,height:30,borderRadius:'50%',background:C.panel,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:7,fontWeight:700,color,fontFamily:C.font}}>{value>=100?Math.round(value):value>=1?value.toFixed(1):value.toFixed(2)}{unit}</span>
        </div>
      </div>
      <span style={{fontSize:7,color:C.dim,letterSpacing:0.3,textTransform:'uppercase',textAlign:'center',fontFamily:C.font}}>{label}</span>
    </div>
  );
}

export default function PhysicsPanel({sceneRef,open=true,onClose}) {
  const [ready,setReady]=useState(false);
  const [running,setRunning]=useState(false);
  const [gravity,setGravity]=useState(9.81);
  const [restitution,setRestitution]=useState(0.3);
  const [friction,setFriction]=useState(0.5);
  const [density,setDensity]=useState(1.0);
  const [linDamp,setLinDamp]=useState(0.1);
  const [bodyCount,setBodyCount]=useState(0);
  const [status,setStatus]=useState('Click INIT to load Rapier');
  const physRef=useRef(null);
  const rafRef=useRef(null);

  const initPhysics=useCallback(async()=>{
    const scene=sceneRef?.current; if(!scene) return;
    setStatus('Loading Rapier WASM...');
    try {
      await initRapier();
      physRef.current=createPhysicsWorld({x:0,y:-gravity,z:0});
      addGroundPlane(physRef.current,0);
      // Auto-register all meshes in scene
      let count=0;
      scene.traverse(obj=>{
        if(obj.isMesh&&!obj.userData.isHelper&&!obj.userData.weatherParticle&&!obj.userData.isFragment) {
          try { addRigidBody(physRef.current,obj,{type:'dynamic',restitution,friction,density,linearDamping:linDamp}); count++; } catch(e){}
        }
      });
      setBodyCount(count);
      setReady(true);
      setStatus(`Rapier ready — ${count} bodies registered`);
    } catch(e) { setStatus('Error: '+e.message); }
  },[sceneRef,gravity,restitution,friction,density,linDamp]);

  const startSim=useCallback(()=>{
    if(!physRef.current){setStatus('Init first');return;}
    setRunning(true);
    const tick=()=>{ try{stepPhysics(physRef.current);}catch(e){} rafRef.current=requestAnimationFrame(tick); };
    rafRef.current=requestAnimationFrame(tick);
  },[]);

  const stopSim=useCallback(()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);setRunning(false);},[]);

  const shootImpulse=useCallback(()=>{
    const scene=sceneRef?.current; if(!scene||!physRef.current) return;
    scene.traverse(obj=>{
      if(obj.isMesh&&!obj.userData.isHelper) {
        applyImpulse(physRef.current,obj,{x:(Math.random()-0.5)*10,y:5+Math.random()*10,z:(Math.random()-0.5)*10});
      }
    });
  },[sceneRef]);

  const explode=useCallback(()=>{
    if(!physRef.current) return;
    applyExplosion(physRef.current,new THREE.Vector3(0,0,0),30,8);
  },[]);

  useEffect(()=>()=>{stopSim();if(physRef.current)disposePhysics(physRef.current);},[]);
  if(!open) return null;

  return (
    <div style={{width:300,background:C.panel,borderRadius:8,border:`1px solid ${C.border}`,fontFamily:C.font,color:C.text,boxShadow:'0 16px 48px rgba(0,0,0,0.8)',display:'flex',flexDirection:'column',maxHeight:600}}>
      <div style={{background:'linear-gradient(135deg,#0a1020,#0d1117)',borderBottom:`1px solid ${C.border}`,padding:'10px 14px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:'#ff8844',boxShadow:'0 0 10px #ff8844'}}/>
        <span style={{fontSize:12,fontWeight:700,letterSpacing:3,color:'#ff8844'}}>RIGID BODY</span>
        {onClose&&<span onClick={onClose} style={{marginLeft:'auto',cursor:'pointer',color:C.dim,fontSize:14}}>×</span>}
      </div>
      <div style={{padding:'6px 14px',fontSize:9,color:ready?C.teal:C.dim,borderBottom:`1px solid ${C.border}`}}>{status}</div>
      <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>
        <div style={{fontSize:9,fontWeight:700,color:C.dim,letterSpacing:2,marginBottom:10}}>PHYSICS PARAMETERS</div>
        <div style={{display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:10,marginBottom:14}}>
          <Knob label="Gravity"     value={gravity}     min={0}   max={20}  step={0.1}  onChange={setGravity}     color='#ff4444' unit='m/s²'/>
          <Knob label="Restitution" value={restitution} min={0}   max={1}   step={0.01} onChange={setRestitution} color={C.teal}/>
          <Knob label="Friction"    value={friction}    min={0}   max={1}   step={0.01} onChange={setFriction}    color='#ffaa44'/>
          <Knob label="Density"     value={density}     min={0.1} max={10}  step={0.1}  onChange={setDensity}     color='#44aaff' unit='kg/m³'/>
          <Knob label="Lin Damp"    value={linDamp}     min={0}   max={1}   step={0.01} onChange={setLinDamp}     color='#aaaaff'/>
        </div>
        {bodyCount>0&&<div style={{fontSize:9,color:C.dim,marginBottom:10,textAlign:'center'}}>{bodyCount} rigid bodies in world</div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6}}>
          <button onClick={initPhysics} style={{padding:'8px 0',background:'rgba(255,136,68,0.1)',border:'1px solid #ff8844',borderRadius:5,color:'#ff8844',fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer',letterSpacing:1}}>⚙ INIT RAPIER</button>
          {!running?<button onClick={startSim} disabled={!ready} style={{padding:'8px 0',background:ready?'rgba(0,255,200,0.1)':C.bg,border:`1px solid ${ready?C.teal:C.border}`,borderRadius:5,color:ready?C.teal:C.dim,fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer'}}>▶ SIMULATE</button>
          :<button onClick={stopSim} style={{padding:'8px 0',background:'rgba(255,102,0,0.1)',border:`1px solid ${C.orange}`,borderRadius:5,color:C.orange,fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer'}}>■ STOP</button>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          <button onClick={shootImpulse} disabled={!ready} style={{padding:'7px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,color:C.dim,fontFamily:C.font,fontSize:9,cursor:'pointer'}}>↑ IMPULSE ALL</button>
          <button onClick={explode} disabled={!ready} style={{padding:'7px 0',background:'rgba(255,68,0,0.08)',border:'1px solid #ff4400',borderRadius:5,color:'#ff4400',fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer'}}>💥 EXPLODE</button>
        </div>
      </div>
    </div>
  );
}
