import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto",boxSizing:"border-box"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:12},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  prev:{width:"100%",height:160,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8},
  row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},
  tag:{display:"inline-block",background:T.panel,color:T.muted,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer"},
  tagOn:{display:"inline-block",background:T.teal,color:T.bg,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer",fontWeight:700},
};

const TEETH_PRESETS={
  "Perfect Hollywood": {upperCount:8,lowerCount:8,toothWidth:0.9,toothHeight:1.0,toothDepth:0.5,spacing:0.02,curvature:0.4,shadeColor:"#f8f8f0",stainLevel:0,chipping:0,gumColor:"#e88080",gumHeight:0.3,gumRecession:0,rootExposure:0,alignment:"perfect",species:"human"},
  "Natural Human":     {upperCount:8,lowerCount:8,toothWidth:0.85,toothHeight:0.9,toothDepth:0.48,spacing:0.03,curvature:0.38,shadeColor:"#eeeacc",stainLevel:0.15,chipping:0.05,gumColor:"#e07070",gumHeight:0.28,gumRecession:0.05,rootExposure:0,alignment:"slight",species:"human"},
  "Aged/Stained":      {upperCount:8,lowerCount:8,toothWidth:0.82,toothHeight:0.85,toothDepth:0.45,spacing:0.05,curvature:0.35,shadeColor:"#d4c880",stainLevel:0.55,chipping:0.2,gumColor:"#c06060",gumHeight:0.22,gumRecession:0.2,rootExposure:0.1,alignment:"crowded",species:"human"},
  "Vampire":           {upperCount:6,lowerCount:6,toothWidth:0.7,toothHeight:1.2,toothDepth:0.4,spacing:0.04,curvature:0.3,shadeColor:"#f0f0f0",stainLevel:0,chipping:0,gumColor:"#aa3030",gumHeight:0.25,gumRecession:0.1,rootExposure:0,alignment:"perfect",species:"vampire"},
  "Dragon":            {upperCount:12,lowerCount:10,toothWidth:1.2,toothHeight:1.8,toothDepth:0.8,spacing:0.08,curvature:0.5,shadeColor:"#e8e0a0",stainLevel:0.1,chipping:0.15,gumColor:"#804040",gumHeight:0.4,gumRecession:0.0,rootExposure:0,alignment:"irregular",species:"dragon"},
  "Monster":           {upperCount:16,lowerCount:14,toothWidth:0.8,toothHeight:1.4,toothDepth:0.6,spacing:0.06,curvature:0.6,shadeColor:"#d0c880",stainLevel:0.3,chipping:0.4,gumColor:"#5a2020",gumHeight:0.35,gumRecession:0.15,rootExposure:0.05,alignment:"chaotic",species:"monster"},
  "Child":             {upperCount:6,lowerCount:6,toothWidth:0.75,toothHeight:0.7,toothDepth:0.38,spacing:0.06,curvature:0.35,shadeColor:"#ffffff",stainLevel:0,chipping:0,gumColor:"#f0a0a0",gumHeight:0.32,gumRecession:0,rootExposure:0,alignment:"gap",species:"human"},
};

function drawTeethPreview(canvas, t){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,w,h);
  const tw=w/(t.upperCount*1.2+1), startX=(w-tw*t.upperCount*1.15)/2;
  const toothH=h*0.38*t.toothHeight, gumY=h*0.35;

  // Gum
  ctx.beginPath();
  for(let i=0;i<=t.upperCount;i++){
    const x=startX+i*tw*1.15;
    const y=gumY-Math.sin(i/t.upperCount*Math.PI)*h*0.06*t.curvature;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.lineTo(startX+t.upperCount*tw*1.15,gumY+h*0.12);
  ctx.lineTo(startX,gumY+h*0.12);
  ctx.closePath();ctx.fillStyle=t.gumColor||"#e07070";ctx.fill();

  // Teeth
  for(let i=0;i<t.upperCount;i++){
    const x=startX+i*tw*1.15;
    const baseY=gumY-Math.sin(i/t.upperCount*Math.PI)*h*0.06*t.curvature;
    const variation=t.alignment==="perfect"?0:t.alignment==="chaotic"?(Math.random()-0.5)*h*0.06:(Math.random()-0.5)*h*0.02;
    const heightMult=i===0||i===t.upperCount-1?0.7:i===1||i===t.upperCount-2?0.9:1;

    // Shade
    const shade=t.shadeColor||"#f8f8f0";
    const stainAmount=t.stainLevel||0;
    const r=parseInt(shade.slice(1,3),16)-Math.round(stainAmount*30);
    const g=parseInt(shade.slice(3,5),16)-Math.round(stainAmount*15);
    const b=parseInt(shade.slice(5,7),16)-Math.round(stainAmount*60);
    const toothColor=`rgb(${Math.max(80,r)},${Math.max(80,g)},${Math.max(60,b)})`;

    ctx.beginPath();
    ctx.roundRect(x+tw*0.08,baseY+variation-toothH*heightMult,tw*0.85,toothH*heightMult,tw*0.15);
    ctx.fillStyle=toothColor;ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,0.15)";ctx.lineWidth=0.5;ctx.stroke();

    // Highlight
    ctx.beginPath();ctx.roundRect(x+tw*0.15,baseY+variation-toothH*heightMult+tw*0.1,tw*0.25,toothH*heightMult*0.45,tw*0.08);
    ctx.fillStyle="rgba(255,255,255,0.25)";ctx.fill();

    // Chips
    if(t.chipping>0&&Math.random()<t.chipping*0.5){
      ctx.beginPath();ctx.moveTo(x+tw*0.5,baseY+variation-toothH*heightMult);
      ctx.lineTo(x+tw*0.7,baseY+variation-toothH*heightMult+tw*0.2);
      ctx.lineTo(x+tw*0.5,baseY+variation-toothH*heightMult+tw*0.1);
      ctx.fillStyle="#0d0d1a";ctx.fill();
    }
  }

  // Lower teeth
  const lowerY=gumY+h*0.06;
  for(let i=0;i<t.lowerCount;i++){
    const x=startX+(i+0.5)*tw*1.1;
    const heightMult=i===0||i===t.lowerCount-1?0.65:0.85;
    const toothColor=t.shadeColor||"#f0f0d8";
    ctx.beginPath();ctx.roundRect(x,lowerY,tw*0.88,h*0.28*t.toothHeight*heightMult,tw*0.12);
    ctx.fillStyle=toothColor;ctx.fill();ctx.strokeStyle="rgba(0,0,0,0.1)";ctx.lineWidth=0.5;ctx.stroke();
  }

  ctx.fillStyle="rgba(0,255,200,0.5)";ctx.font="10px "+T.font;
  ctx.fillText(`${t.upperCount}U/${t.lowerCount}L · ${t.alignment}`,8,h-8);
}

function Slider({label,value,min,max,step=0.01,onChange}){
  return(
    <div>
      <label style={S.lbl}>{label}: <span style={{color:T.teal}}>{typeof value==="number"?value.toFixed(2):value}</span></label>
      <input style={S.inp} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}

export default function TeethGeneratorPanel({scene}){
  const [preset,  setPreset]  = useState("Perfect Hollywood");
  const [teeth,   setTeeth]   = useState({...TEETH_PRESETS["Perfect Hollywood"]});
  const [status,  setStatus]  = useState("");
  const prevRef = useRef(null);

  const set = useCallback((k,v)=>setTeeth(t=>({...t,[k]:v})),[]);
  useEffect(()=>{ if(prevRef.current) drawTeethPreview(prevRef.current,teeth); },[teeth]);

  function loadPreset(p){ setPreset(p); setTeeth({...TEETH_PRESETS[p]}); }

  function applyToScene(){
    if(!scene){ setStatus("No scene"); return; }
    const c=document.createElement("canvas");c.width=1024;c.height=512;
    drawTeethPreview(c,teeth);
    const tex=new THREE.CanvasTexture(c);
    let n=0;
    scene.traverse(o=>{
      if(o.isMesh&&(o.name.toLowerCase().includes("teeth")||o.name.toLowerCase().includes("tooth")||o.userData.isTeeth)){
        o.material=new THREE.MeshStandardMaterial({map:tex,roughness:0.15,metalness:0.05});n++;
      }
    });
    setStatus(`✓ Applied to ${n} teeth mesh(es)`);
  }

  function exportTex(){
    const c=document.createElement("canvas");c.width=1024;c.height=512;
    drawTeethPreview(c,teeth);
    const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="teeth_texture.png";a.click();
  }

  const ALIGNMENTS=["perfect","slight","crowded","gap","irregular","chaotic"];

  return(
    <div style={S.root}>
      <div style={S.h2}>🦷 TEETH GENERATOR</div>
      <div style={S.sec}>
        <div style={S.h3}>Presets</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(TEETH_PRESETS).map(p=><span key={p} style={preset===p?S.tagOn:S.tag} onClick={()=>loadPreset(p)}>{p}</span>)}
        </div>
        <canvas ref={prevRef} width={400} height={160} style={S.prev}/>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Count & Shape</div>
        <div style={S.row}>
          <Slider label="Upper Count" value={teeth.upperCount||8} min={2} max={20} step={1} onChange={v=>set("upperCount",v)}/>
          <Slider label="Lower Count" value={teeth.lowerCount||8} min={2} max={20} step={1} onChange={v=>set("lowerCount",v)}/>
        </div>
        <Slider label="Tooth Width"  value={teeth.toothWidth||0.9}  min={0.3} max={1.5} onChange={v=>set("toothWidth",v)}/>
        <Slider label="Tooth Height" value={teeth.toothHeight||1.0} min={0.3} max={2}   onChange={v=>set("toothHeight",v)}/>
        <Slider label="Tooth Depth"  value={teeth.toothDepth||0.5}  min={0.1} max={1}   onChange={v=>set("toothDepth",v)}/>
        <Slider label="Spacing"      value={teeth.spacing||0.02}    min={0}   max={0.2} onChange={v=>set("spacing",v)}/>
        <Slider label="Arch Curve"   value={teeth.curvature||0.4}   min={0}   max={1}   onChange={v=>set("curvature",v)}/>
        <label style={S.lbl}>Alignment</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {ALIGNMENTS.map(a=><span key={a} style={teeth.alignment===a?S.tagOn:S.tag} onClick={()=>set("alignment",a)}>{a}</span>)}
        </div>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Shade & Condition</div>
        <div style={S.row}>
          <div><label style={S.lbl}>Shade Color</label>
            <input type="color" value={teeth.shadeColor||"#f8f8f0"} onChange={e=>set("shadeColor",e.target.value)} style={{width:"100%",height:28,borderRadius:4,border:"none",cursor:"pointer"}}/></div>
          <div><label style={S.lbl}>Gum Color</label>
            <input type="color" value={teeth.gumColor||"#e07070"} onChange={e=>set("gumColor",e.target.value)} style={{width:"100%",height:28,borderRadius:4,border:"none",cursor:"pointer"}}/></div>
        </div>
        <Slider label="Stain Level"   value={teeth.stainLevel||0}    min={0} max={1} onChange={v=>set("stainLevel",v)}/>
        <Slider label="Chipping"      value={teeth.chipping||0}      min={0} max={1} onChange={v=>set("chipping",v)}/>
        <Slider label="Gum Height"    value={teeth.gumHeight||0.3}   min={0} max={0.6} onChange={v=>set("gumHeight",v)}/>
        <Slider label="Gum Recession" value={teeth.gumRecession||0}  min={0} max={0.5} onChange={v=>set("gumRecession",v)}/>
      </div>
      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      <button style={S.btnO} onClick={exportTex}>💾 Export Texture</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
