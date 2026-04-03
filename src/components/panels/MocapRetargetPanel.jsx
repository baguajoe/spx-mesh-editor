import React, { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MocapRetargeter, SPX_JOINTS, MEDIAPIPE_TO_SPX } from '../../mesh/MocapRetarget.js';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';
const C={bg:'#06060f',panel:'#0d1117',border:'#21262d',teal:'#00ffc8',orange:'#FF6600',text:'#e0e0e0',dim:'#8b949e',font:'JetBrains Mono,monospace'};
function Toggle({label,value,onChange}){return(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}><span style={{fontSize:9,color:C.dim}}>{label}</span><div onClick={()=>onChange(!value)} style={{width:32,height:16,borderRadius:8,cursor:'pointer',position:'relative',background:value?C.teal:C.border}}><div style={{position:'absolute',top:2,left:value?16:2,width:12,height:12,borderRadius:'50%',background:value?C.bg:'#555',transition:'left 0.15s'}}/></div></div>);}
function Slider({label,value,min,max,step=0.01,onChange,unit=''}){return(<div style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.dim,marginBottom:1}}><span>{label}</span><span style={{color:C.teal,fontWeight:700}}>{step<0.1?Number(value).toFixed(2):Math.round(value)}{unit}</span></div><input type='range' min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:'100%',accentColor:C.teal,cursor:'pointer',height:3}}/></div>);}
function Section({title,color=C.teal,children,defaultOpen=true}){const [open,setOpen]=useState(defaultOpen);return(<div style={{marginBottom:6}}><div onClick={()=>setOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',background:'#0a0f1a',borderRadius:4,cursor:'pointer',borderLeft:`2px solid ${color}`,marginBottom:open?5:0}}><span style={{color,fontSize:9}}>{open?'▾':'▸'}</span><span style={{fontSize:9,fontWeight:700,color:C.text,letterSpacing:1}}>{title}</span></div>{open&&<div style={{paddingLeft:8}}>{children}</div>}</div>);}
export default function MocapRetargetPanel({sceneRef,open=true,onClose}){
  const [bvhFile,setBvhFile]=useState(null);
  const [bvhName,setBvhName]=useState('');
  const [targetName,setTargetName]=useState('');
  const [playing,setPlaying]=useState(false);
  const [frame,setFrame]=useState(0);
  const [totalFrames,setTotalFrames]=useState(0);
  const [smoothing,setSmoothing]=useState(0.6);
  const [scaleBody,setScaleBody]=useState(true);
  const [status,setStatus]=useState('Load a BVH file');
  const [skeletonNames,setSkeletonNames]=useState([]);
  const retargeterRef=useRef(null);
  const bvhDataRef=useRef(null);
  const rafRef=useRef(null);
  const loadBVH=useCallback((file)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const loader=new BVHLoader();
        const result=loader.parse(e.target.result);
        bvhDataRef.current=result;
        setBvhName(file.name);
        const frames=result.clip?.tracks?.[0]?.times?.length||0;
        setTotalFrames(frames);
        setStatus('BVH loaded: '+frames+' frames');
      }catch(err){setStatus('BVH parse error: '+err.message);}
    };
    reader.readAsText(file);
  },[]);
  const findSkeletons=useCallback(()=>{
    const scene=sceneRef?.current; if(!scene) return;
    const names=[];
    scene.traverse(obj=>{if(obj.isSkinnedMesh&&obj.skeleton) names.push(obj.name||obj.uuid.slice(0,8));});
    setSkeletonNames(names);
    setStatus(names.length+' skinned meshes found');
  },[sceneRef]);
  const bindRetargeter=useCallback(()=>{
    const scene=sceneRef?.current; if(!scene){setStatus('No scene');return;}
    let targetMesh=null;
    scene.traverse(obj=>{if(obj.isSkinnedMesh&&!targetMesh) targetMesh=obj;});
    if(!targetMesh){setStatus('No skinned mesh in scene');return;}
    const rt=new MocapRetargeter({smoothing});
    rt.bindTPose(targetMesh.skeleton);
    retargeterRef.current=rt;
    setTargetName(targetMesh.name||'Mesh');
    setStatus('Bound to: '+targetMesh.name+' ('+targetMesh.skeleton.bones.length+' bones)');
  },[sceneRef,smoothing]);
  const applyFrame=useCallback((f)=>{
    const rt=retargeterRef.current; const bvh=bvhDataRef.current;
    if(!rt||!bvh||!bvh.clip) return;
    const tracks=bvh.clip.tracks;
    const fps=bvh.clip.duration/(totalFrames||1);
    const time=f*fps;
    // Apply each bone track
    if(rt.targetSkeleton){
      tracks.forEach(track=>{
        const boneName=track.name.split('.')[0];
        const prop=track.name.split('.')[1];
        const bone=rt.targetSkeleton.bones.find(b=>b.name.toLowerCase()===boneName.toLowerCase());
        if(!bone) return;
        const idx=Math.min(Math.floor(time/bvh.clip.duration*track.times.length),track.times.length-1);
        if(prop==='quaternion'&&track.values.length>=idx*4+4){
          const q=new THREE.Quaternion(track.values[idx*4],track.values[idx*4+1],track.values[idx*4+2],track.values[idx*4+3]);
          const tpose=rt.tposeRotations.get(bone.name)||new THREE.Quaternion();
          bone.quaternion.slerpQuaternions(bone.quaternion,tpose.clone().multiply(q),1-smoothing);
        } else if(prop==='position'&&track.values.length>=idx*3+3){
          if(bone.name.toLowerCase().includes('hip')||bone.name.toLowerCase().includes('root')){
            bone.position.set(track.values[idx*3],track.values[idx*3+1],track.values[idx*3+2]);
          }
        }
      });
    }
  },[totalFrames,smoothing]);
  const play=useCallback(()=>{
    setPlaying(true);
    let f=frame;
    const tick=()=>{
      f=(f+1)%Math.max(1,totalFrames);
      setFrame(f); applyFrame(f);
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
  },[frame,totalFrames,applyFrame]);
  const stop=useCallback(()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);setPlaying(false);},[]);
  if(!open) return null;
  return(<div style={{width:260,background:C.panel,borderRadius:6,border:`1px solid ${C.border}`,fontFamily:C.font,color:C.text,fontSize:11,boxShadow:'0 8px 32px rgba(0,0,0,0.7)',display:'flex',flexDirection:'column',maxHeight:680}}>
    <div style={{background:'linear-gradient(90deg,#0a1520,#0d1117)',borderBottom:`1px solid ${C.border}`,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:'#ff88ff',boxShadow:'0 0 6px #ff88ff'}}/><span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#ff88ff'}}>MOCAP RETARGET</span>
      {onClose&&<span onClick={onClose} style={{marginLeft:'auto',cursor:'pointer',color:C.dim}}>×</span>}
    </div>
    <div style={{padding:'5px 12px',fontSize:9,color:C.dim,borderBottom:`1px solid ${C.border}`}}>{status}</div>
    <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>
      <Section title='BVH SOURCE' color='#ff88ff'>
        <label style={{display:'block',padding:'8px',border:`2px dashed ${C.border}`,borderRadius:4,textAlign:'center',cursor:'pointer',fontSize:9,color:C.dim,marginBottom:6}}>
          <input type='file' accept='.bvh' style={{display:'none'}} onChange={e=>e.target.files[0]&&loadBVH(e.target.files[0])}/>
          {bvhName?'✓ '+bvhName:'📁 Load BVH File'}
        </label>
        {totalFrames>0&&<div style={{fontSize:9,color:C.teal,marginBottom:4}}>{totalFrames} frames loaded</div>}
      </Section>
      <Section title='TARGET SKELETON' color={C.teal}>
        <button onClick={findSkeletons} style={{width:'100%',marginBottom:4,padding:'5px',background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.dim,fontFamily:C.font,fontSize:9,cursor:'pointer'}}>SCAN SCENE FOR SKELETONS</button>
        {skeletonNames.map(n=><div key={n} onClick={()=>setTargetName(n)} style={{padding:'4px 8px',marginBottom:3,borderRadius:4,cursor:'pointer',fontSize:9,border:`1px solid ${targetName===n?C.teal:C.border}`,color:targetName===n?C.teal:C.dim,background:targetName===n?'rgba(0,255,200,0.08)':C.bg}}>{n}</div>)}
        <button onClick={bindRetargeter} style={{width:'100%',marginTop:4,padding:'5px',background:'rgba(0,255,200,0.1)',border:`1px solid ${C.teal}`,borderRadius:4,color:C.teal,fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer'}}>BIND T-POSE</button>
      </Section>
      <Section title='PLAYBACK' color={C.orange}>
        <Slider label='SMOOTHING' value={smoothing} min={0} max={0.99} step={0.01} onChange={setSmoothing}/>
        <Toggle label='SCALE BODY' value={scaleBody} onChange={setScaleBody}/>
        {totalFrames>0&&<><input type='range' min={0} max={Math.max(0,totalFrames-1)} step={1} value={frame} onChange={e=>{const f=parseInt(e.target.value);setFrame(f);applyFrame(f);}} style={{width:'100%',accentColor:C.teal,marginBottom:4}}/><div style={{fontSize:9,color:C.dim,textAlign:'center',marginBottom:6}}>Frame {frame} / {totalFrames}</div></>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
          {!playing?<button onClick={play} style={{padding:'6px 0',background:'rgba(255,136,255,0.1)',border:'1px solid #ff88ff',borderRadius:4,color:'#ff88ff',fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer'}}>▶ PLAY</button>:<button onClick={stop} style={{padding:'6px 0',background:'rgba(255,102,0,0.1)',border:`1px solid ${C.orange}`,borderRadius:4,color:C.orange,fontFamily:C.font,fontSize:9,fontWeight:700,cursor:'pointer'}}>■ STOP</button>}
          <button onClick={()=>{setFrame(0);applyFrame(0);}} style={{padding:'6px 0',background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.dim,fontFamily:C.font,fontSize:9,cursor:'pointer'}}>↺ RESET</button>
        </div>
      </Section>
    </div>
  </div>);
}