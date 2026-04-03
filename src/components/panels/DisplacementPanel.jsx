import React, { useState, useCallback } from 'react';
import * as THREE from 'three';
const C={bg:'#06060f',panel:'#0d1117',border:'#21262d',teal:'#00ffc8',orange:'#FF6600',text:'#e0e0e0',dim:'#8b949e',font:'JetBrains Mono,monospace'};
function Slider({label,value,min,max,step=0.01,onChange,unit=''}){return(<div style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.dim,marginBottom:1}}><span>{label}</span><span style={{color:C.teal,fontWeight:700}}>{step<0.1?Number(value).toFixed(2):Math.round(value)}{unit}</span></div><input type='range' min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:'100%',accentColor:C.teal,cursor:'pointer',height:3}}/></div>);}
function Section({title,color=C.teal,children,defaultOpen=true}){const [open,setOpen]=useState(defaultOpen);return(<div style={{marginBottom:6}}><div onClick={()=>setOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',background:'#0a0f1a',borderRadius:4,cursor:'pointer',borderLeft:`2px solid ${color}`,marginBottom:open?5:0}}><span style={{color,fontSize:9}}>{open?'▾':'▸'}</span><span style={{fontSize:9,fontWeight:700,color:C.text,letterSpacing:1}}>{title}</span></div>{open&&<div style={{paddingLeft:8}}>{children}</div>}</div>);}
const DISP_PRESETS=[
  {label:'Skin Pores',  pattern:'noise',scale:40,strength:0.02,octaves:6},
  {label:'Rock',        pattern:'fbm',  scale:8, strength:0.15,octaves:8},
  {label:'Terrain',     pattern:'fbm',  scale:3, strength:0.4, octaves:6},
  {label:'Waves',       pattern:'waves',scale:10,strength:0.08,octaves:2},
  {label:'Fabric',      pattern:'weave',scale:20,strength:0.03,octaves:2},
  {label:'Brick',       pattern:'brick',scale:5, strength:0.05,octaves:1},
];
function generateHeightmap(w,h,pattern,scale,octaves,seed){
  const data=new Float32Array(w*h);
  const hash=(x,y)=>{let v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
  const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return hash(ix,iy)*(1-ux)*(1-uy)+hash(ix+1,iy)*ux*(1-uy)+hash(ix,iy+1)*(1-ux)*uy+hash(ix+1,iy+1)*ux*uy;};
  const fbm=(x,y,oct)=>{let v=0,a=0.5,f=1;for(let i=0;i<oct;i++){v+=a*noise(x*f+seed,y*f+seed);a*=0.5;f*=2;}return v;};
  for(let y=0;y<h;y++){for(let x=0;x<w;x++){const nx=x/w*scale,ny=y/h*scale;let v=0;
    if(pattern==='noise') v=fbm(nx,ny,octaves);
    else if(pattern==='fbm') v=fbm(nx,ny,octaves);
    else if(pattern==='waves') v=(Math.sin(nx*6.28)+Math.sin(ny*6.28))*0.5;
    else if(pattern==='weave') v=Math.abs(Math.sin(nx*6.28)*Math.cos(ny*6.28));
    else if(pattern==='brick'){const bx=nx%1,by=ny%1;const off=(Math.floor(ny))%2*0.5;v=(bx+off)%1<0.9&&by>0.1&&by<0.9?0:1;}
    data[y*w+x]=v;
  }}return data;
}
export default function DisplacementPanel({meshRef,open=true,onClose}){
  const [pattern,setPattern]=useState('fbm');
  const [scale,setScale]=useState(8);
  const [strength,setStrength]=useState(0.15);
  const [octaves,setOctaves]=useState(6);
  const [midlevel,setMidlevel]=useState(0.5);
  const [seed,setSeed]=useState(42);
  const [imageUrl,setImageUrl]=useState(null);
  const [status,setStatus]=useState('');
  const applyDisplacement=useCallback(()=>{
    const mesh=meshRef?.current; if(!mesh||!mesh.geometry){setStatus('No mesh');return;}
    const geo=mesh.geometry;
    const pos=geo.attributes.position;
    if(!geo.userData.origPositions){
      geo.userData.origPositions=new Float32Array(pos.array);
    }
    const orig=geo.userData.origPositions;
    const norms=geo.attributes.normal;
    if(!norms){geo.computeVertexNormals();}
    const applyHeightmap=(hmap,w,h)=>{
      for(let i=0;i<pos.count;i++){
        const ox=orig[i*3],oy=orig[i*3+1],oz=orig[i*3+2];
        const nx=geo.attributes.normal.getX(i);
        const ny=geo.attributes.normal.getY(i);
        const nz=geo.attributes.normal.getZ(i);
        const u=geo.attributes.uv?geo.attributes.uv.getX(i):0.5;
        const v=geo.attributes.uv?geo.attributes.uv.getY(i):0.5;
        const hx=Math.min(Math.floor(u*w),w-1);
        const hy=Math.min(Math.floor(v*h),h-1);
        const hval=(hmap[hy*w+hx]-midlevel)*strength;
        pos.setXYZ(i,ox+nx*hval,oy+ny*hval,oz+nz*hval);
      }
      pos.needsUpdate=true;
      geo.computeVertexNormals();
      setStatus('Applied: '+pos.count+' verts displaced');
    };
    if(imageUrl){
      const img=new Image(); img.src=imageUrl;
      img.onload=()=>{
        const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
        const ctx=c.getContext('2d'); ctx.drawImage(img,0,0);
        const d=ctx.getImageData(0,0,c.width,c.height).data;
        const hmap=new Float32Array(c.width*c.height);
        for(let i=0;i<hmap.length;i++) hmap[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/(3*255);
        applyHeightmap(hmap,c.width,c.height);
      };
    } else {
      const hmap=generateHeightmap(256,256,pattern,scale,octaves,seed);
      applyHeightmap(hmap,256,256);
    }
  },[meshRef,pattern,scale,strength,octaves,midlevel,seed,imageUrl]);
  const resetDisplacement=useCallback(()=>{
    const mesh=meshRef?.current; if(!mesh?.geometry) return;
    const geo=mesh.geometry; const orig=geo.userData.origPositions; if(!orig) return;
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++) pos.setXYZ(i,orig[i*3],orig[i*3+1],orig[i*3+2]);
    pos.needsUpdate=true; geo.computeVertexNormals(); setStatus('Reset');
  },[meshRef]);
  if(!open) return null;
  return(<div style={{width:250,background:C.panel,borderRadius:6,border:`1px solid ${C.border}`,fontFamily:C.font,color:C.text,fontSize:11,boxShadow:'0 8px 32px rgba(0,0,0,0.7)',display:'flex',flexDirection:'column',maxHeight:620}}>
    <div style={{background:'linear-gradient(90deg,#0a1520,#0d1117)',borderBottom:`1px solid ${C.border}`,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:'#cc8844',boxShadow:'0 0 6px #cc8844'}}/><span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#cc8844'}}>DISPLACEMENT</span>
      {onClose&&<span onClick={onClose} style={{marginLeft:'auto',cursor:'pointer',color:C.dim}}>×</span>}
    </div>
    {status&&<div style={{padding:'4px 12px',fontSize:9,color:C.teal,borderBottom:`1px solid ${C.border}`}}>{status}</div>}
    <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>
      <Section title='PRESETS' color='#cc8844'>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3,marginBottom:6}}>{DISP_PRESETS.map(p=><div key={p.label} onClick={()=>{setPattern(p.pattern);setScale(p.scale);setStrength(p.strength);setOctaves(p.octaves);}} style={{padding:'4px 6px',borderRadius:4,cursor:'pointer',fontSize:9,fontWeight:700,border:`1px solid ${C.border}`,background:C.bg,color:C.dim,textAlign:'center'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#cc8844';e.currentTarget.style.color='#cc8844';}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.dim;}}>{p.label}</div>)}</div>
      </Section>
      <Section title='PROCEDURAL' color={C.teal}>
        <div style={{display:'flex',gap:3,marginBottom:6,flexWrap:'wrap'}}>{['noise','fbm','waves','weave','brick'].map(p=><div key={p} onClick={()=>setPattern(p)} style={{padding:'3px 8px',borderRadius:3,cursor:'pointer',fontSize:8,fontWeight:700,border:`1px solid ${pattern===p?C.teal:C.border}`,color:pattern===p?C.teal:C.dim,background:pattern===p?'rgba(0,255,200,0.08)':C.bg}}>{p}</div>)}</div>
        <Slider label='SCALE' value={scale} min={1} max={50} step={0.5} onChange={setScale}/>
        <Slider label='STRENGTH' value={strength} min={0} max={2} step={0.01} onChange={setStrength}/>
        <Slider label='OCTAVES' value={octaves} min={1} max={12} step={1} onChange={setOctaves}/>
        <Slider label='MIDLEVEL' value={midlevel} min={0} max={1} step={0.01} onChange={setMidlevel}/>
        <Slider label='SEED' value={seed} min={0} max={999} step={1} onChange={setSeed}/>
      </Section>
      <Section title='IMAGE MAP' color={C.orange} defaultOpen={false}>
        <label style={{display:'block',padding:'8px',border:`2px dashed ${C.border}`,borderRadius:4,textAlign:'center',cursor:'pointer',fontSize:9,color:C.dim}}>
          <input type='file' accept='image/*' style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f)setImageUrl(URL.createObjectURL(f));}}/>
          {imageUrl?'✓ Image loaded':'📁 Load Height Map'}
        </label>
        {imageUrl&&<button onClick={()=>setImageUrl(null)} style={{width:'100%',marginTop:4,padding:'4px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:3,color:C.dim,fontFamily:C.font,fontSize:8,cursor:'pointer'}}>CLEAR IMAGE</button>}
      </Section>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:8}}>
        <button onClick={applyDisplacement} style={{padding:'7px 0',background:'rgba(204,136,68,0.1)',border:'1px solid #cc8844',borderRadius:4,color:'#cc8844',fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer',letterSpacing:1}}>DISPLACE</button>
        <button onClick={resetDisplacement} style={{padding:'7px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.dim,fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer'}}>RESET</button>
      </div>
    </div>
  </div>);
}