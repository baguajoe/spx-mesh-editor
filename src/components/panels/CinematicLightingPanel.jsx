import React, { useState, useCallback } from 'react';
import * as THREE from 'three';
const C={bg:'#06060f',panel:'#0d1117',border:'#21262d',teal:'#00ffc8',orange:'#FF6600',text:'#e0e0e0',dim:'#8b949e',font:'JetBrains Mono,monospace'};
function Slider({label,value,min,max,step=0.01,onChange,unit=''}){return(<div style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.dim,marginBottom:1}}><span>{label}</span><span style={{color:C.teal,fontWeight:700}}>{step<0.1?Number(value).toFixed(2):Math.round(value)}{unit}</span></div><input type='range' min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:'100%',accentColor:C.teal,cursor:'pointer',height:3}}/></div>);}
function ColorRow({label,value,onChange}){return(<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}><span style={{fontSize:9,color:C.dim,flex:1}}>{label}</span><input type='color' value={value} onChange={e=>onChange(e.target.value)} style={{width:28,height:20,border:'none',background:'none',cursor:'pointer'}}/></div>);}
function Section({title,color=C.teal,children,defaultOpen=true}){const [open,setOpen]=useState(defaultOpen);return(<div style={{marginBottom:6}}><div onClick={()=>setOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',background:'#0a0f1a',borderRadius:4,cursor:'pointer',borderLeft:`2px solid ${color}`,marginBottom:open?5:0}}><span style={{color,fontSize:9}}>{open?'▾':'▸'}</span><span style={{fontSize:9,fontWeight:700,color:C.text,letterSpacing:1}}>{title}</span></div>{open&&<div style={{paddingLeft:8}}>{children}</div>}</div>);}
const RIGS=[
  {label:'3-Point',     desc:'Key + Fill + Rim. Standard film setup.',
   lights:[{type:'dir',color:'#fff5e0',intensity:3,pos:[3,5,3],   name:'Key'},
           {type:'dir',color:'#c0d8ff',intensity:1,pos:[-3,2,2],  name:'Fill'},
           {type:'dir',color:'#ffffff',intensity:2,pos:[-2,3,-4], name:'Rim'}]},
  {label:'Rembrandt',   desc:'Single key at 45° above. Classic dramatic.',
   lights:[{type:'dir',color:'#fff0d0',intensity:4,pos:[3,4,2],   name:'Key'},
           {type:'dir',color:'#101820',intensity:0.3,pos:[-2,1,2],name:'Fill'}]},
  {label:'Butterfly',   desc:'Key above nose. Beauty/glamour lighting.',
   lights:[{type:'dir',color:'#fff8f0',intensity:4,pos:[0,5,3],   name:'Key'},
           {type:'dir',color:'#d0e8ff',intensity:0.8,pos:[0,-2,2],name:'Fill'}]},
  {label:'Split',       desc:'Half face lit, half dark. Dramatic.',
   lights:[{type:'dir',color:'#fff0e0',intensity:4,pos:[4,2,0],   name:'Key'}]},
  {label:'Loop',        desc:'Shadow of nose loops to corner of mouth.',
   lights:[{type:'dir',color:'#fff5e0',intensity:3.5,pos:[2,4,2], name:'Key'},
           {type:'dir',color:'#c8d8ff',intensity:0.6,pos:[-2,1,2],name:'Fill'}]},
  {label:'Neon Night',  desc:'Cyberpunk dual color fill.',
   lights:[{type:'point',color:'#ff00aa',intensity:3,pos:[3,2,2], name:'Neon1'},
           {type:'point',color:'#00aaff',intensity:3,pos:[-3,2,2],name:'Neon2'},
           {type:'amb',  color:'#050510',intensity:0.2,pos:[0,0,0],name:'Amb'}]},
  {label:'Golden Hour', desc:'Warm low sun. Cinematic outdoor.',
   lights:[{type:'dir',color:'#ff9933',intensity:2,pos:[5,1,2],   name:'Sun'},
           {type:'dir',color:'#4466aa',intensity:0.5,pos:[-3,3,-2],name:'Sky'},
           {type:'amb',color:'#331a00',intensity:0.3,pos:[0,0,0], name:'Amb'}]},
  {label:'Horror',      desc:'Under-lighting. Eerie upward shadows.',
   lights:[{type:'point',color:'#00ff44',intensity:2,pos:[0,-2,2],name:'Under'},
           {type:'amb', color:'#050505',intensity:0.1,pos:[0,0,0],name:'Amb'}]},
  {label:'Studio White',desc:'Clean even lighting. Product/portrait.',
   lights:[{type:'dir',color:'#ffffff',intensity:2,pos:[3,5,3],   name:'Key'},
           {type:'dir',color:'#f0f8ff',intensity:1.5,pos:[-3,4,3],name:'Fill'},
           {type:'amb',color:'#e8f0ff',intensity:0.8,pos:[0,0,0], name:'Amb'}]},
  {label:'Noir',        desc:'High contrast single source. Deep shadows.',
   lights:[{type:'spot',color:'#fff8e0',intensity:5,pos:[2,6,2],  name:'Key'},
           {type:'amb', color:'#000000',intensity:0.0,pos:[0,0,0],name:'Amb'}]},
];
export default function CinematicLightingPanel({sceneRef,open=true,onClose}){
  const [activeRig,setActiveRig]=useState(null);
  const [intensity,setIntensity]=useState(1.0);
  const [warmth,setWarmth]=useState(0);
  const [shadowSoft,setShadowSoft]=useState(4096);
  const lightGroupRef=useState(()=>null);
  const applyRig=useCallback((rig,idx)=>{
    const scene=sceneRef?.current; if(!scene) return;
    // Remove old rig lights
    const toRemove=[];
    scene.traverse(obj=>{if(obj.userData.cinLight) toRemove.push(obj);});
    toRemove.forEach(obj=>scene.remove(obj));
    // Add new rig
    rig.lights.forEach(l=>{
      let light;
      const col=new THREE.Color(l.color);
      // Apply warmth shift
      if(warmth!==0){col.r=Math.min(1,col.r+warmth*0.1);col.b=Math.max(0,col.b-warmth*0.1);}
      const intens=l.intensity*intensity;
      if(l.type==='dir'){light=new THREE.DirectionalLight(col,intens);light.castShadow=true;light.shadow.mapSize.setScalar(shadowSoft);light.shadow.bias=-0.0003;}
      else if(l.type==='point'){light=new THREE.PointLight(col,intens,50);light.castShadow=true;light.shadow.mapSize.setScalar(1024);}
      else if(l.type==='spot'){light=new THREE.SpotLight(col,intens,50,Math.PI/6,0.3);light.castShadow=true;light.shadow.mapSize.setScalar(2048);}
      else if(l.type==='amb'){light=new THREE.AmbientLight(col,intens);}
      if(light){light.position.set(l.pos[0],l.pos[1],l.pos[2]);light.name=l.name;light.userData.cinLight=true;light.userData.rigName=rig.label;scene.add(light);}
    });
    setActiveRig(idx);
  },[sceneRef,intensity,warmth,shadowSoft]);
  const updateIntensity=useCallback((v)=>{
    setIntensity(v);
    const scene=sceneRef?.current; if(!scene) return;
    scene.traverse(obj=>{if(obj.userData.cinLight&&obj.intensity!==undefined) obj.intensity*=(v/intensity);});
  },[sceneRef,intensity]);
  if(!open) return null;
  return(<div style={{width:260,background:C.panel,borderRadius:6,border:`1px solid ${C.border}`,fontFamily:C.font,color:C.text,fontSize:11,boxShadow:'0 8px 32px rgba(0,0,0,0.7)',display:'flex',flexDirection:'column',maxHeight:680}}>
    <div style={{background:'linear-gradient(90deg,#0a1520,#0d1117)',borderBottom:`1px solid ${C.border}`,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:'#ffdd44',boxShadow:'0 0 6px #ffdd44'}}/><span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#ffdd44'}}>CINEMATIC LIGHTING</span>
      {onClose&&<span onClick={onClose} style={{marginLeft:'auto',cursor:'pointer',color:C.dim}}>×</span>}
    </div>
    <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>
      <Section title='LIGHTING RIGS' color='#ffdd44'>
        <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:6}}>
          {RIGS.map((rig,i)=>(
            <div key={rig.label} onClick={()=>applyRig(rig,i)} style={{padding:'6px 10px',borderRadius:5,cursor:'pointer',border:`1px solid ${activeRig===i?'#ffdd44':C.border}`,background:activeRig===i?'rgba(255,221,68,0.08)':C.bg,transition:'all 0.1s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#ffdd44';}} onMouseLeave={e=>{e.currentTarget.style.borderColor=activeRig===i?'#ffdd44':C.border;}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:10,fontWeight:700,color:activeRig===i?'#ffdd44':C.text}}>{rig.label}</span>
                <span style={{fontSize:8,color:C.dim}}>{rig.lights.length} lights</span>
              </div>
              <div style={{fontSize:8,color:C.dim,marginTop:2}}>{rig.desc}</div>
              <div style={{display:'flex',gap:3,marginTop:4}}>{rig.lights.map(l=><div key={l.name} style={{width:12,height:12,borderRadius:2,background:l.color,border:'1px solid #333'}} title={l.name}/>)}</div>
            </div>
          ))}
        </div>
      </Section>
      <Section title='ADJUST' color={C.orange}>
        <Slider label='OVERALL INTENSITY' value={intensity} min={0.1} max={5} step={0.05} onChange={updateIntensity}/>
        <Slider label='WARMTH' value={warmth} min={-1} max={1} step={0.05} onChange={setWarmth}/>
        <div style={{fontSize:9,color:C.dim,marginBottom:4}}>SHADOW QUALITY</div>
        <div style={{display:'flex',gap:3}}>{[512,1024,2048,4096].map(s=><div key={s} onClick={()=>setShadowSoft(s)} style={{flex:1,padding:'3px',textAlign:'center',borderRadius:3,cursor:'pointer',fontSize:8,fontWeight:700,border:`1px solid ${shadowSoft===s?C.teal:C.border}`,color:shadowSoft===s?C.teal:C.dim,background:shadowSoft===s?'rgba(0,255,200,0.08)':C.bg}}>{s}</div>)}</div>
      </Section>
      <button onClick={()=>{const scene=sceneRef?.current;if(!scene)return;const tr=[];scene.traverse(o=>{if(o.userData.cinLight)tr.push(o);});tr.forEach(o=>scene.remove(o));setActiveRig(null);}} style={{width:'100%',marginTop:8,padding:'6px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.dim,fontFamily:C.font,fontSize:9,cursor:'pointer'}}>CLEAR ALL LIGHTS</button>
    </div>
  </div>);
}