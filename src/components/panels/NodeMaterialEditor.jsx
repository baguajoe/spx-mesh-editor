import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
const C={bg:'#06060f',panel:'#0d1117',border:'#21262d',teal:'#00ffc8',orange:'#FF6600',text:'#e0e0e0',dim:'#8b949e',font:'JetBrains Mono,monospace'};
const NODE_TYPES={
  Output:    {color:'#ff6600',inputs:['Surface','Volume','Displacement'],outputs:[]},
  Principled:{color:'#4488ff',inputs:['BaseColor','Metallic','Roughness','IOR','Alpha','Normal','Clearcoat','ClearcoatRoughness','Emission','EmissionStrength','Transmission','Sheen'],outputs:['BSDF']},
  Emission:  {color:'#ffaa00',inputs:['Color','Strength'],outputs:['Emission']},
  Diffuse:   {color:'#44aa44',inputs:['Color','Roughness','Normal'],outputs:['BSDF']},
  Glossy:    {color:'#aaaaff',inputs:['Color','Roughness','Normal'],outputs:['BSDF']},
  Glass:     {color:'#88ccff',inputs:['Color','Roughness','IOR','Normal'],outputs:['BSDF']},
  MixShader: {color:'#ff44aa',inputs:['Fac','Shader1','Shader2'],outputs:['Shader']},
  AddShader: {color:'#ffaaff',inputs:['Shader1','Shader2'],outputs:['Shader']},
  ImageTex:  {color:'#aa44aa',inputs:['Vector'],outputs:['Color','Alpha']},
  NoiseTex:  {color:'#884400',inputs:['Vector','Scale','Detail','Roughness'],outputs:['Fac','Color']},
  MixRGB:    {color:'#226622',inputs:['Fac','Color1','Color2'],outputs:['Color']},
  Math:      {color:'#446644',inputs:['Value1','Value2'],outputs:['Value']},
  NormalMap: {color:'#4466aa',inputs:['Color','Strength'],outputs:['Normal']},
  Bump:      {color:'#445566',inputs:['Height','Distance','Normal'],outputs:['Normal']},
  Fresnel:   {color:'#66aaff',inputs:['IOR'],outputs:['Fac']},
  ColorRamp: {color:'#aa6622',inputs:['Fac'],outputs:['Color','Alpha']},
  RGB:       {color:'#cc4444',inputs:[],outputs:['Color']},
  Value:     {color:'#888844',inputs:[],outputs:['Value']},
  Displacement:{color:'#cc8844',inputs:['Height','Midlevel','Scale','Normal'],outputs:['Displacement']},
};
let _nid=0;
function mkNode(type,x,y){const def=NODE_TYPES[type]||{color:'#888',inputs:[],outputs:[]};return{id:++_nid,type,x,y,w:160,color:def.color,inputs:def.inputs.map((n,i)=>({id:`${_nid}_i${i}`,name:n,connected:null,value:type==='RGB'?'#ffffff':type==='Value'?1.0:null})),outputs:def.outputs.map((n,i)=>({id:`${_nid}_o${i}`,name:n})),params:{color:'#ffffff',value:1.0,scale:5,blend:'MIX',imageUrl:null}};}
export default function NodeMaterialEditor({meshRef,open=true,onClose}){
  const [nodes,setNodes]=useState(()=>[mkNode('Output',400,200),mkNode('Principled',100,150)]);
  const [links,setLinks]=useState([]);
  const [drag,setDrag]=useState(null);
  const [linkDrag,setLinkDrag]=useState(null);
  const [selected,setSelected]=useState(null);
  const [pan,setPan]=useState({x:0,y:0});
  const [zoom,setZoom]=useState(1);
  const svgRef=useRef(null);
  const addNode=useCallback((type)=>{setNodes(n=>[...n,mkNode(type,200-pan.x,200-pan.y)]);},[pan]);
  const deleteNode=useCallback((id)=>{setNodes(n=>n.filter(x=>x.id!==id));setLinks(l=>l.filter(x=>x.fromNode!==id&&x.toNode!==id));},[]);
  const onMouseDown=useCallback((e,node)=>{e.stopPropagation();setSelected(node.id);setDrag({id:node.id,ox:e.clientX-node.x,oy:e.clientY-node.y});},[]);
  const onMouseMove=useCallback((e)=>{
    if(drag){setNodes(n=>n.map(x=>x.id===drag.id?{...x,x:e.clientX-drag.ox,y:e.clientY-drag.oy}:x));}
    if(linkDrag){setLinkDrag(l=>({...l,ex:e.clientX,ey:e.clientY}));}
  },[drag,linkDrag]);
  const onMouseUp=useCallback(()=>{setDrag(null);setLinkDrag(null);},[]);
  const startLink=useCallback((e,nodeId,outId)=>{e.stopPropagation();const r=e.target.getBoundingClientRect();setLinkDrag({fromNode:nodeId,fromOut:outId,sx:r.left+r.width/2,sy:r.top+r.height/2,ex:r.left,ey:r.top});},[]);
  const finishLink=useCallback((e,nodeId,inId)=>{e.stopPropagation();if(!linkDrag) return;setLinks(l=>[...l,{id:Date.now(),fromNode:linkDrag.fromNode,fromOut:linkDrag.fromOut,toNode:nodeId,toIn:inId}]);setLinkDrag(null);},[linkDrag]);
  const applyToMesh=useCallback(()=>{
    const mesh=meshRef?.current; if(!mesh) return;
    const principled=nodes.find(n=>n.type==='Principled');
    if(!principled) return;
    const mat=new THREE.MeshPhysicalMaterial({color:new THREE.Color(principled.params.color||'#ffffff'),roughness:parseFloat(principled.params.roughness||0.5),metalness:parseFloat(principled.params.metalness||0),clearcoat:parseFloat(principled.params.clearcoat||0),envMapIntensity:1.2});
    // Apply image textures from linked ImageTex nodes
    links.forEach(lk=>{
      const fromNode=nodes.find(n=>n.id===lk.fromNode);
      if(fromNode?.type==='ImageTex'&&fromNode.params.imageUrl){
        const tex=new THREE.TextureLoader().load(fromNode.params.imageUrl);
        const toNode=nodes.find(n=>n.id===lk.toNode);
        const inSlot=toNode?.inputs.find(i=>i.id===lk.toIn);
        if(inSlot?.name==='BaseColor') mat.map=tex;
        else if(inSlot?.name==='Normal') mat.normalMap=tex;
        else if(inSlot?.name==='Roughness') mat.roughnessMap=tex;
        else if(inSlot?.name==='Metallic') mat.metalnessMap=tex;
      }
    });
    mat.needsUpdate=true;
    mesh.material=mat;
  },[nodes,links,meshRef]);
  const selNode=nodes.find(n=>n.id===selected);
  if(!open) return null;
  return(<div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,0.85)',display:'flex',flexDirection:'column',fontFamily:C.font}}>
    {/* Header */}
    <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:'6px 12px',display:'flex',alignItems:'center',gap:8,height:40,flexShrink:0}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:C.teal,boxShadow:`0 0 6px ${C.teal}`}}/>
      <span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:C.teal}}>NODE MATERIAL EDITOR</span>
      <div style={{marginLeft:16,display:'flex',gap:4,flexWrap:'wrap'}}>
        {Object.keys(NODE_TYPES).map(t=><button key={t} onClick={()=>addNode(t)} style={{padding:'3px 8px',background:C.bg,border:`1px solid ${NODE_TYPES[t].color}`,borderRadius:3,color:NODE_TYPES[t].color,fontFamily:C.font,fontSize:8,fontWeight:700,cursor:'pointer'}}>{t}</button>)}
      </div>
      <div style={{marginLeft:'auto',display:'flex',gap:6}}>
        <button onClick={applyToMesh} style={{padding:'4px 12px',background:'rgba(0,255,200,0.1)',border:`1px solid ${C.teal}`,borderRadius:4,color:C.teal,fontFamily:C.font,fontSize:10,fontWeight:700,cursor:'pointer'}}>APPLY TO MESH</button>
        <button onClick={onClose} style={{padding:'4px 12px',background:'rgba(255,102,0,0.1)',border:`1px solid ${C.orange}`,borderRadius:4,color:C.orange,fontFamily:C.font,fontSize:10,fontWeight:700,cursor:'pointer'}}>CLOSE</button>
      </div>
    </div>
    {/* Canvas */}
    <div style={{flex:1,position:'relative',overflow:'hidden',background:'#050810'}} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      {/* Grid */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
        <defs><pattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'><path d='M 40 0 L 0 0 0 40' fill='none' stroke='#1a1a2a' strokeWidth='0.5'/></pattern></defs>
        <rect width='100%' height='100%' fill='url(#grid)'/>
        {/* Links */}
        {links.map(lk=>{
          const fn=nodes.find(n=>n.id===lk.fromNode);
          const tn=nodes.find(n=>n.id===lk.toNode);
          if(!fn||!tn) return null;
          const oi=fn.outputs.findIndex(o=>o.id===lk.fromOut);
          const ii=tn.inputs.findIndex(i=>i.id===lk.toIn);
          const x1=fn.x+fn.w, y1=fn.y+32+oi*22;
          const x2=tn.x,       y2=tn.y+32+ii*22;
          const cx=(x1+x2)/2;
          return(<g key={lk.id}><path d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`} fill='none' stroke={C.teal} strokeWidth='1.5' opacity='0.7'/><circle cx={x1} cy={y1} r='4' fill={C.teal}/><circle cx={x2} cy={y2} r='4' fill={C.teal}/></g>);
        })}
        {linkDrag&&<path d={`M${linkDrag.sx},${linkDrag.sy} C${(linkDrag.sx+linkDrag.ex)/2},${linkDrag.sy} ${(linkDrag.sx+linkDrag.ex)/2},${linkDrag.ey} ${linkDrag.ex},${linkDrag.ey}`} fill='none' stroke='#ffffff' strokeWidth='1' strokeDasharray='4'/>}
      </svg>
      {/* Nodes */}
      {nodes.map(node=>(
        <div key={node.id} style={{position:'absolute',left:node.x,top:node.y,width:node.w,background:C.panel,border:`1px solid ${selected===node.id?node.color:C.border}`,borderRadius:6,userSelect:'none',boxShadow:selected===node.id?`0 0 8px ${node.color}40`:'none'}} onMouseDown={e=>onMouseDown(e,node)}>
          <div style={{background:node.color+'22',borderBottom:`1px solid ${node.color}44`,padding:'4px 8px',borderRadius:'5px 5px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'grab'}}>
            <span style={{fontSize:9,fontWeight:700,color:node.color,letterSpacing:1}}>{node.type.toUpperCase()}</span>
            <span onClick={e=>{e.stopPropagation();deleteNode(node.id);}} style={{color:C.dim,cursor:'pointer',fontSize:10,lineHeight:1}}>×</span>
          </div>
          {/* Inputs */}
          {node.inputs.map((inp,i)=>(<div key={inp.id} style={{display:'flex',alignItems:'center',gap:4,padding:'2px 6px',position:'relative'}} onMouseUp={e=>finishLink(e,node.id,inp.id)}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#333',border:`1px solid ${C.teal}`,cursor:'crosshair',flexShrink:0}}/>
            <span style={{fontSize:8,color:C.dim}}>{inp.name}</span>
          </div>))}
          {/* Outputs */}
          {node.outputs.map((out,i)=>(<div key={out.id} style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4,padding:'2px 6px'}}>
            <span style={{fontSize:8,color:C.dim}}>{out.name}</span>
            <div style={{width:8,height:8,borderRadius:'50%',background:node.color,cursor:'crosshair',flexShrink:0}} onMouseDown={e=>startLink(e,node.id,out.id)}/>
          </div>))}
          {/* Params for leaf nodes */}
          {(node.type==='RGB'||node.type==='Value'||node.type==='ImageTex'||node.type==='NoiseTex')&&(
            <div style={{padding:'4px 6px',borderTop:`1px solid ${C.border}`}}>
              {node.type==='RGB'&&<input type='color' value={node.params.color} onChange={e=>{const v=e.target.value;setNodes(n=>n.map(x=>x.id===node.id?{...x,params:{...x.params,color:v}}:x));}} style={{width:'100%',height:20,border:'none',cursor:'pointer'}}/>}
              {node.type==='Value'&&<input type='range' min={0} max={1} step={0.01} value={node.params.value} onChange={e=>{const v=parseFloat(e.target.value);setNodes(n=>n.map(x=>x.id===node.id?{...x,params:{...x.params,value:v}}:x));}} style={{width:'100%',accentColor:C.teal}}/>}
              {node.type==='ImageTex'&&<label style={{fontSize:8,color:C.dim,cursor:'pointer',display:'block',padding:'2px',border:`1px dashed ${C.border}`,textAlign:'center',borderRadius:3}}><input type='file' accept='image/*' style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){const url=URL.createObjectURL(f);setNodes(n=>n.map(x=>x.id===node.id?{...x,params:{...x.params,imageUrl:url}}:x));}}}/>📁 Load Image</label>}
              {node.type==='NoiseTex'&&<input type='range' min={0.1} max={20} step={0.1} value={node.params.scale} onChange={e=>{const v=parseFloat(e.target.value);setNodes(n=>n.map(x=>x.id===node.id?{...x,params:{...x.params,scale:v}}:x));}} style={{width:'100%',accentColor:C.teal}}/>}
            </div>
          )}
        </div>
      ))}
    </div>
    {/* Props panel for selected node */}
    {selNode&&selNode.type==='Principled'&&(<div style={{position:'absolute',right:0,top:40,width:200,height:'calc(100% - 40px)',background:C.panel,borderLeft:`1px solid ${C.border}`,padding:'10px',overflowY:'auto'}}>
      <div style={{fontSize:9,fontWeight:700,color:C.teal,letterSpacing:1,marginBottom:8}}>PRINCIPLED BSDF</div>
      {[['color','Base Color','color'],['roughness','Roughness','range'],['metalness','Metalness','range'],['clearcoat','Clearcoat','range'],['transmission','Transmission','range'],['ior','IOR','number'],['emissiveIntensity','Emit Strength','range']].map(([key,label,type])=>(<div key={key} style={{marginBottom:6}}><div style={{fontSize:8,color:C.dim,marginBottom:2}}>{label}</div>{type==='color'?<input type='color' value={selNode.params[key]||'#ffffff'} onChange={e=>{const v=e.target.value;setNodes(n=>n.map(x=>x.id===selNode.id?{...x,params:{...x.params,[key]:v}}:x));}} style={{width:'100%',height:22,border:'none',cursor:'pointer'}}/>:<input type='range' min={type==='number'?1:0} max={type==='number'?3:1} step={0.01} value={selNode.params[key]||0} onChange={e=>{const v=parseFloat(e.target.value);setNodes(n=>n.map(x=>x.id===selNode.id?{...x,params:{...x.params,[key]:v}}:x));}} style={{width:'100%',accentColor:C.teal}}/>}</div>))}
      <button onClick={applyToMesh} style={{width:'100%',marginTop:8,padding:'7px 0',background:'rgba(0,255,200,0.1)',border:`1px solid ${C.teal}`,borderRadius:4,color:C.teal,fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer'}}>APPLY</button>
    </div>)}
  </div>);
}