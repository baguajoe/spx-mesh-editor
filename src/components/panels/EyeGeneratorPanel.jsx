
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},prev:{width:"100%",height:120,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const EYE_TYPES=["Natural Human","Heroic","Reptile/Snake","Dragon Slit","Demon Glow","Cyber/Cyberpunk","Undead","Shark","Feline","Owl/Bird","Insect Compound","Alien","Void/Cosmic","Sharingan","Byakugan"];
const PRESETS={
  "Natural Human":  {irisColor:"#5588aa",pupilType:"round",scleraColor:"#f5f0e8",wetness:0.9,glow:false,pupilSize:0.35,limbal:0.7},
  "Heroic":         {irisColor:"#3366cc",pupilType:"round",scleraColor:"#f8f5f0",wetness:0.95,glow:false,pupilSize:0.3,limbal:0.9},
  "Reptile/Snake":  {irisColor:"#88aa22",pupilType:"vertical_slit",scleraColor:"#dde8cc",wetness:0.6,glow:false,pupilSize:0.2,limbal:0.3},
  "Dragon Slit":    {irisColor:"#ff4400",pupilType:"vertical_slit",scleraColor:"#ccaa88",wetness:0.5,glow:true,glowColor:"#ff6600",pupilSize:0.15,limbal:0.2},
  "Demon Glow":     {irisColor:"#ff0000",pupilType:"round",scleraColor:"#220000",wetness:0.4,glow:true,glowColor:"#ff2200",pupilSize:0.5,limbal:0.0},
  "Cyber/Cyberpunk":{irisColor:"#00ffc8",pupilType:"crosshair",scleraColor:"#111122",wetness:0.3,glow:true,glowColor:"#00ffaa",pupilSize:0.4,limbal:0.0},
  "Undead":         {irisColor:"#aabb88",pupilType:"round",scleraColor:"#ccddbb",wetness:0.1,glow:false,pupilSize:0.4,limbal:0.0},
  "Feline":         {irisColor:"#ddaa22",pupilType:"vertical_slit",scleraColor:"#f0eecc",wetness:0.85,glow:false,pupilSize:0.25,limbal:0.4},
  "Alien":          {irisColor:"#aa00ff",pupilType:"horizontal_slit",scleraColor:"#220033",wetness:0.7,glow:true,glowColor:"#cc00ff",pupilSize:0.3,limbal:0.0},
  "Void/Cosmic":    {irisColor:"#000000",pupilType:"void",scleraColor:"#050510",wetness:0.0,glow:true,glowColor:"#4400ff",pupilSize:0.9,limbal:0.0},
};

function drawEyePreview(canvas, cfg){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#06060f";ctx.fillRect(0,0,w,h);
  // Draw two eyes
  [w*.3, w*.7].forEach((cx,idx)=>{
    const cy=h*.5, r=h*.32;
    // Sclera
    ctx.beginPath();ctx.ellipse(cx,cy,r*1.2,r,0,0,Math.PI*2);
    ctx.fillStyle=cfg.scleraColor||"#f5f0e8";ctx.fill();
    // Iris
    ctx.beginPath();ctx.arc(cx,cy,r*.6,0,Math.PI*2);
    ctx.fillStyle=cfg.irisColor||"#5588aa";
    if(cfg.glow){ctx.shadowBlur=16;ctx.shadowColor=cfg.glowColor||cfg.irisColor;}
    ctx.fill();ctx.shadowBlur=0;
    // Pupil
    ctx.fillStyle="#000000";
    ctx.beginPath();
    if(cfg.pupilType==="vertical_slit"){ctx.ellipse(cx,cy,r*.08,r*.45,0,0,Math.PI*2);}
    else if(cfg.pupilType==="horizontal_slit"){ctx.ellipse(cx,cy,r*.4,r*.1,0,0,Math.PI*2);}
    else if(cfg.pupilType==="crosshair"){ctx.fillRect(cx-r*.04,cy-r*.4,r*.08,r*.8);ctx.fillRect(cx-r*.4,cy-r*.04,r*.8,r*.08);}
    else if(cfg.pupilType==="void"){ctx.arc(cx,cy,r*.5,0,Math.PI*2);}
    else{ctx.arc(cx,cy,r*(cfg.pupilSize||.35)*.7,0,Math.PI*2);}
    ctx.fill();
    // Limbal ring
    if(cfg.limbal>0){ctx.beginPath();ctx.arc(cx,cy,r*.6,0,Math.PI*2);ctx.strokeStyle=`rgba(0,0,0,${cfg.limbal*.8})`;ctx.lineWidth=r*.08;ctx.stroke();}
    // Wetness highlight
    if(cfg.wetness>0){ctx.beginPath();ctx.arc(cx-r*.2,cy-r*.2,r*.15,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${cfg.wetness*.8})`;ctx.fill();}
    // Asymmetry label
    if(idx===1&&cfg.asymmetry>0){ctx.beginPath();ctx.arc(cx,cy+r*.08,r*.55,0,Math.PI*2);ctx.strokeStyle="rgba(255,100,0,.3)";ctx.lineWidth=1;ctx.stroke();}
  });
}

export default function EyeGeneratorPanel({scene}){
  const [eyeType,setEyeType]=useState("Natural Human");
  const [irisColor,setIrisColor]=useState("#5588aa");
  const [scleraColor,setScleraColor]=useState("#f5f0e8");
  const [glowColor,setGlowColor]=useState("#ff6600");
  const [pupilType,setPupilType]=useState("round");
  const [pupilSize,setPupilSize]=useState(0.35);
  const [wetness,setWetness]=useState(0.9);
  const [limbal,setLimbal]=useState(0.7);
  const [glow,setGlow]=useState(false);
  const [asymmetry,setAsymmetry]=useState(0);
  const [redness,setRedness]=useState(0);
  const [veins,setVeins]=useState(0);
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);

  function loadPreset(type){
    setEyeType(type);const p=PRESETS[type];if(!p)return;
    setIrisColor(p.irisColor);setScleraColor(p.scleraColor);setPupilType(p.pupilType);
    setPupilSize(p.pupilSize);setWetness(p.wetness);setLimbal(p.limbal);setGlow(p.glow||false);
    if(p.glowColor)setGlowColor(p.glowColor);
    setTimeout(()=>{if(prevRef.current)drawEyePreview(prevRef.current,{irisColor:p.irisColor,scleraColor:p.scleraColor,pupilType:p.pupilType,pupilSize:p.pupilSize,wetness:p.wetness,limbal:p.limbal,glow:p.glow,glowColor:p.glowColor,asymmetry});},50);
  }

  function preview(){if(prevRef.current)drawEyePreview(prevRef.current,{irisColor,scleraColor,pupilType,pupilSize,wetness,limbal,glow,glowColor,asymmetry});}

  function applyToScene(){
    if(!scene){setStatus("No scene");return;}
    const c=document.createElement("canvas");c.width=c.height=256;
    drawEyePreview(c,{irisColor,scleraColor,pupilType,pupilSize,wetness,limbal,glow,glowColor,asymmetry});
    const tex=new THREE.CanvasTexture(c);
    let n=0;
    scene.traverse(o=>{if(o.isMesh&&(o.name.toLowerCase().includes("eye")||o.userData.isEye)){o.material=new THREE.MeshStandardMaterial({map:tex,roughness:glow?0.05:wetness>0.7?0.08:0.3,metalness:0.1,emissive:glow?new THREE.Color(glowColor):new THREE.Color(0),emissiveIntensity:glow?0.5:0});n++;}});
    setStatus(`✓ Eye shader applied to ${n} mesh(es)`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>👁 EYE GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Eye Type Preset</label>
        <select style={S.sel} value={eyeType} onChange={e=>loadPreset(e.target.value)}>{EYE_TYPES.map(t=><option key={t}>{t}</option>)}</select>
        <canvas ref={prevRef} width={300} height={120} style={S.prev}/>
        <button style={{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer"}} onClick={preview}>👁 Preview</button>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Iris</div>
        <label style={S.lbl}>Iris Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={irisColor} onChange={e=>{setIrisColor(e.target.value);preview();}}/>
        <label style={S.lbl}>Pupil Type</label>
        <select style={S.sel} value={pupilType} onChange={e=>{setPupilType(e.target.value);preview();}}>
          {["round","vertical_slit","horizontal_slit","crosshair","void"].map(t=><option key={t}>{t}</option>)}
        </select>
        <label style={S.lbl}>Pupil Size: {pupilSize.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0.05} max={0.9} step={0.01} value={pupilSize} onChange={e=>{setPupilSize(+e.target.value);preview();}}/>
        <label style={S.lbl}>Limbal Ring: {limbal.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={limbal} onChange={e=>{setLimbal(+e.target.value);preview();}}/>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Sclera & Surface</div>
        <label style={S.lbl}>Sclera Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={scleraColor} onChange={e=>{setScleraColor(e.target.value);preview();}}/>
        <label style={S.lbl}>Eye Wetness: {wetness.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={wetness} onChange={e=>{setWetness(+e.target.value);preview();}}/>
        <label style={S.lbl}>Redness: {redness.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={redness} onChange={e=>setRedness(+e.target.value)}/>
        <label style={S.lbl}>Veins: {veins.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={veins} onChange={e=>setVeins(+e.target.value)}/>
        <label style={S.lbl}><input type="checkbox" checked={glow} onChange={e=>{setGlow(e.target.checked);preview();}} /> Fantasy Glow</label>
        {glow&&<><label style={S.lbl}>Glow Color</label><input style={{...S.inp,padding:2,height:32}} type="color" value={glowColor} onChange={e=>{setGlowColor(e.target.value);preview();}}/></>}
        <label style={S.lbl}>Asymmetry: {asymmetry.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={asymmetry} onChange={e=>{setAsymmetry(+e.target.value);preview();}}/>
      </div>
      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
