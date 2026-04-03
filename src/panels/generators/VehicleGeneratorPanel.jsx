import React, { useState, useCallback, useEffect, useRef } from 'react';
import { buildCurvedVehicle, VEHICLE_CURVE_PRESETS } from '../../mesh/VehicleCurves.js';
import * as THREE from 'three';

function Slider({label,value,min=0,max=1,step=0.01,onChange,unit=''}) {
  return <div style={{marginBottom:5}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#888'}}>
      <span>{label}</span><span style={{color:'#00ffc8',fontWeight:600}}>{step<0.1?value.toFixed(2):Math.round(value)}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:'100%',accentColor:'#00ffc8',cursor:'pointer'}}/>
  </div>;
}
function ColorRow({label,value,onChange}) {
  return <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
    <span style={{fontSize:10,color:'#888',flex:1}}>{label}</span>
    <input type="color" value={value} onChange={e=>onChange(e.target.value)} style={{width:32,height:22,border:'none',cursor:'pointer',borderRadius:3}}/>
  </div>;
}
function Check({label,value,onChange}) {
  return <label style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#ccc',cursor:'pointer',marginBottom:4}}>
    <input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)} style={{accentColor:'#00ffc8'}}/>
    {label}
  </label>;
}
function Section({title,children,defaultOpen=true}) {
  const [open,setOpen]=useState(defaultOpen);
  return <div style={{marginBottom:6,border:'1px solid #21262d',borderRadius:5,overflow:'hidden'}}>
    <div onClick={()=>setOpen(o=>!o)} style={{padding:'5px 8px',cursor:'pointer',background:'#0d1117',display:'flex',justifyContent:'space-between',fontSize:11,fontWeight:600,color:'#00ffc8',userSelect:'none'}}>
      <span>{title}</span><span style={{fontSize:9,opacity:0.7}}>{open?'▲':'▼'}</span>
    </div>
    {open&&<div style={{padding:'6px 8px',background:'#06060f'}}>{children}</div>}
  </div>;
}
function Badges({items,active,onSelect}) {
  return <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:6}}>
    {items.map(item=><button key={item} onClick={()=>onSelect(item)} style={{padding:'2px 7px',fontSize:9,borderRadius:4,cursor:'pointer',background:active===item?'#00ffc8':'#1a1f2c',color:active===item?'#06060f':'#ccc',border:`1px solid ${active===item?'#00ffc8':'#21262d'}`}}>{item}</button>)}
  </div>;
}

const PRESETS = { ...VEHICLE_CURVE_PRESETS, ...{
  'Sports Car':  {bodyLength:0.45,bodyHeight:0.22,bodyWidth:0.52,wheelSize:0.42,spoiler:true, groundClearance:0.08,primaryColor:'#cc2200',wheelCount:4},
  'SUV':         {bodyLength:0.80,bodyHeight:0.72,bodyWidth:0.72,wheelSize:0.62,spoiler:false,groundClearance:0.42,primaryColor:'#1a3a5a',wheelCount:4},
  'Pickup Truck':{bodyLength:0.95,bodyHeight:0.58,bodyWidth:0.68,wheelSize:0.65,spoiler:false,groundClearance:0.45,primaryColor:'#3a3a2a',wheelCount:4},
  'Motorcycle':  {bodyLength:0.38,bodyHeight:0.55,bodyWidth:0.18,wheelSize:0.45,spoiler:false,groundClearance:0.22,primaryColor:'#111111',wheelCount:2},
  'Muscle Car':  {bodyLength:0.70,bodyHeight:0.30,bodyWidth:0.62,wheelSize:0.52,spoiler:true, groundClearance:0.12,primaryColor:'#222244',wheelCount:4},
  'Semi Truck':  {bodyLength:1.20,bodyHeight:0.90,bodyWidth:0.75,wheelSize:0.70,spoiler:false,groundClearance:0.50,primaryColor:'#aa2211',wheelCount:18},
  'Supercar':    {bodyLength:0.50,bodyHeight:0.18,bodyWidth:0.56,wheelSize:0.46,spoiler:true, groundClearance:0.06,primaryColor:'#f0c000',wheelCount:4},
  'Off-Road':    {bodyLength:0.78,bodyHeight:0.78,bodyWidth:0.75,wheelSize:0.78,spoiler:false,groundClearance:0.62,primaryColor:'#3a4a2a',wheelCount:4},
}};

function buildCurvedVehicle(scene, p, meshesRef) {
  meshesRef.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();});
  meshesRef.current=[];
  const ms=[];
  if(!scene.getObjectByName('veh_amb')){
    const a=new THREE.AmbientLight(0xffffff,0.6);a.name='veh_amb';scene.add(a);ms.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1.2);d.name='veh_dir';d.position.set(8,15,8);d.castShadow=true;scene.add(d);ms.push(d);
  }
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshPhysicalMaterial({color:0x111811,roughness:0.95}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);ms.push(ground);
  const col=new THREE.Color(p.primaryColor);
  const mat=(c,r=0.3,me=0.7)=>new THREE.MeshPhysicalMaterial({color:c,roughness:r,metalness:me});
  const add=(geo,x,y,z,m=mat(col))=>{const mesh=new THREE.Mesh(geo,m);mesh.position.set(x,y,z);mesh.castShadow=true;scene.add(mesh);ms.push(mesh);return mesh;};
  const bL=3+p.bodyLength*4, bH=0.6+p.bodyHeight*1.5, bW=1.2+p.bodyWidth*1.2;
  const wR=0.25+p.wheelSize*0.35, gC=p.groundClearance*1.2+wR;
  // Chassis
  add(new THREE.BoxGeometry(bW,bH*0.45,bL),0,gC+bH*0.22,0);
  // Cabin
  if(p.wheelCount!==2){
    add(new THREE.BoxGeometry(bW*0.85,bH*0.55,bL*0.48),0,gC+bH*0.72,-bL*0.05);
    add(new THREE.BoxGeometry(bW*0.82,bH*0.5,0.08),0,gC+bH*0.68,bL*0.19,mat(0x88aabb,0.05,0.3));
    add(new THREE.BoxGeometry(0.06,bH*0.42,bL*0.44),bW*0.43,gC+bH*0.7,-bL*0.05,mat(0x88aabb,0.05,0.3));
    add(new THREE.BoxGeometry(0.06,bH*0.42,bL*0.44),-bW*0.43,gC+bH*0.7,-bL*0.05,mat(0x88aabb,0.05,0.3));
  }
  // Headlights
  add(new THREE.BoxGeometry(bW*0.3,bH*0.12,0.08),bW*0.28,gC+bH*0.28,bL*0.5,mat(0xffffaa,0.1,0.0));
  add(new THREE.BoxGeometry(bW*0.3,bH*0.12,0.08),-bW*0.28,gC+bH*0.28,bL*0.5,mat(0xffffaa,0.1,0.0));
  // Taillights
  add(new THREE.BoxGeometry(bW*0.25,bH*0.10,0.06),bW*0.3,gC+bH*0.28,-bL*0.5,mat(0xff2200,0.2,0.0));
  add(new THREE.BoxGeometry(bW*0.25,bH*0.10,0.06),-bW*0.3,gC+bH*0.28,-bL*0.5,mat(0xff2200,0.2,0.0));
  // Spoiler
  if(p.spoiler){
    add(new THREE.BoxGeometry(bW*0.9,0.06,0.35),0,gC+bH*0.82,-bL*0.45,mat(0x111111,0.3,0.6));
    add(new THREE.BoxGeometry(0.06,0.28,0.35),bW*0.38,gC+bH*0.68,-bL*0.45,mat(0x111111,0.3,0.6));
    add(new THREE.BoxGeometry(0.06,0.28,0.35),-bW*0.38,gC+bH*0.68,-bL*0.45,mat(0x111111,0.3,0.6));
  }
  // Wheels
  const wMat=mat(0x111111,0.95,0.0), rMat=mat(0x888888,0.3,0.8);
  const wPos=p.wheelCount===2?[[0,bL*0.38],[0,-bL*0.38]]:[[-bW*0.54,bL*0.34],[bW*0.54,bL*0.34],[-bW*0.54,-bL*0.34],[bW*0.54,-bL*0.34]];
  wPos.forEach(([wx,wz])=>{
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(wR,wR,wR*0.7,16),wMat);
    tire.rotation.z=Math.PI/2;tire.position.set(wx,wR*0.9,wz);tire.castShadow=true;scene.add(tire);ms.push(tire);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(wR*0.55,wR*0.55,wR*0.72,10),rMat);
    rim.rotation.z=Math.PI/2;rim.position.set(wx,wR*0.9,wz);scene.add(rim);ms.push(rim);
  });
  meshesRef.current=ms;
  return ms.filter(m=>m.isMesh).length;
}

export default function VehicleGeneratorPanel({sceneRef,setStatus,onGenerate}) {
  const scene=sceneRef?.current;
  const meshesRef=useRef([]);
  const [activePreset,setActivePreset]=useState('Sports Car');
  const [bodyLength,setBodyLength]=useState(0.55);
  const [bodyHeight,setBodyHeight]=useState(0.32);
  const [bodyWidth,setBodyWidth]=useState(0.55);
  const [wheelSize,setWheelSize]=useState(0.45);
  const [wheelCount,setWheelCount]=useState(4);
  const [spoiler,setSpoiler]=useState(true);
  const [groundClearance,setGroundClearance]=useState(0.12);
  const [primaryColor,setPrimaryColor]=useState('#cc2200');
  const [roughness,setRoughness]=useState(0.20);
  const [metalness,setMetalness]=useState(0.85);

  function getParams(){return{bodyLength,bodyHeight,bodyWidth,wheelSize,wheelCount,spoiler,groundClearance,primaryColor,roughness,metalness};}

  function applyPreset(name){
    const p=PRESETS[name];if(!p)return;setActivePreset(name);
    setBodyLength(p.bodyLength);setBodyHeight(p.bodyHeight);setBodyWidth(p.bodyWidth);
    setWheelSize(p.wheelSize);setSpoiler(p.spoiler);setGroundClearance(p.groundClearance);
    setPrimaryColor(p.primaryColor);setWheelCount(p.wheelCount);
    // Rebuild immediately with preset values
    if(sceneRef?.current) setTimeout(()=>buildCurvedVehicle(sceneRef.current,{
      bodyLength:p.bodyLength,bodyHeight:p.bodyHeight,bodyWidth:p.bodyWidth,
      wheelSize:p.wheelSize,wheelCount:p.wheelCount,spoiler:p.spoiler,
      groundClearance:p.groundClearance,primaryColor:p.primaryColor,roughness:0.20,metalness:0.85
    },meshesRef),10);
  }

  function generate(){
    if(!scene){setStatus?.('No scene');return;}
    const n=buildCurvedVehicle(scene,getParams(),meshesRef);
    setStatus?.(`✓ ${activePreset} — ${n} parts`);
    onGenerate?.(getParams());
  }

  function clear(){meshesRef.current.forEach(m=>{scene?.remove(m);m.geometry?.dispose();m.material?.dispose();});meshesRef.current=[];setStatus?.('Cleared');}

  useEffect(()=>{applyPreset('Sports Car');},[]);

  // Rebuild live when sliders change
  useEffect(()=>{
    if(sceneRef?.current) buildCurvedVehicle(sceneRef.current, getParams(), meshesRef);
  },[bodyLength,bodyHeight,bodyWidth,wheelSize,wheelCount,spoiler,groundClearance,primaryColor]);

  const P={fontFamily:'JetBrains Mono,monospace',color:'#e0e0e0',fontSize:12,userSelect:'none',width:'100%'};
  return (
    <div style={P}>
      <Section title="🚗 Presets"><Badges items={Object.keys(PRESETS)} active={activePreset} onSelect={applyPreset}/></Section>
      <Section title="📐 Body">
        <Slider label="Body Length"      value={bodyLength}      onChange={setBodyLength}/>
        <Slider label="Body Height"      value={bodyHeight}      onChange={setBodyHeight}/>
        <Slider label="Body Width"       value={bodyWidth}       onChange={setBodyWidth}/>
        <Slider label="Ground Clearance" value={groundClearance} onChange={setGroundClearance}/>
      </Section>
      <Section title="⚙ Wheels">
        <Slider label="Wheel Size"  value={wheelSize}  onChange={setWheelSize}/>
        <Slider label="Wheel Count" value={wheelCount} min={2} max={18} step={1} onChange={setWheelCount}/>
      </Section>
      <Section title="🎨 Paint">
        <ColorRow label="Primary Color" value={primaryColor} onChange={setPrimaryColor}/>
        <Slider label="Roughness" value={roughness} onChange={setRoughness}/>
        <Slider label="Metalness" value={metalness} onChange={setMetalness}/>
      </Section>
      <Section title="✨ Details" defaultOpen={false}>
        <Check label="Spoiler" value={spoiler} onChange={setSpoiler}/>
      </Section>
      <div style={{display:'flex',gap:6,marginTop:8}}>
        <button onClick={generate} style={{flex:1,background:'#00ffc8',color:'#06060f',border:'none',borderRadius:4,padding:'7px 0',cursor:'pointer',fontWeight:700,fontSize:12}}>⚡ Generate Vehicle</button>
      </div>
      <button onClick={clear} style={{width:'100%',marginTop:6,background:'#1a1f2c',color:'#ff4444',border:'1px solid #ff4444',borderRadius:4,padding:'5px 0',cursor:'pointer',fontSize:11}}>🗑 Clear</button>
    </div>
  );
}
