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
  btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  prev:{width:"100%",height:200,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8},
  row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},
  tag:{display:"inline-block",background:T.panel,color:T.muted,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer"},
  tagOn:{display:"inline-block",background:T.teal,color:T.bg,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer",fontWeight:700},
};

const EYE_PRESETS={
  "Human Neutral": {irisColor:"#5b8ad0",pupilSize:0.35,irisSize:0.62,scleraColor:"#f5f0e8",irisPattern:"radial",limbusWidth:0.08,irisRings:3,irisDetail:0.6,eyelidTop:0.45,eyelidBot:0.15,innerCorner:0.1,outerCorner:-0.05,reflection:0.8,eyeGlow:0,species:"human"},
  "Human Brown":   {irisColor:"#6b3a1a",pupilSize:0.38,irisSize:0.60,scleraColor:"#f5f0e8",irisPattern:"radial",limbusWidth:0.09,irisRings:4,irisDetail:0.7,eyelidTop:0.45,eyelidBot:0.15,innerCorner:0.1,outerCorner:-0.05,reflection:0.8,eyeGlow:0,species:"human"},
  "Cat Slit":      {irisColor:"#e8c84a",pupilSize:0.15,irisSize:0.75,scleraColor:"#f0ede0",irisPattern:"slit",limbusWidth:0.06,irisRings:2,irisDetail:0.8,eyelidTop:0.5,eyelidBot:0.1,innerCorner:0.05,outerCorner:0.05,reflection:0.9,eyeGlow:0.2,species:"cat"},
  "Dragon Fire":   {irisColor:"#ff4400",pupilSize:0.2,irisSize:0.8,scleraColor:"#1a0000",irisPattern:"fire",limbusWidth:0.04,irisRings:5,irisDetail:0.9,eyelidTop:0.55,eyelidBot:0.05,innerCorner:0,outerCorner:0.1,reflection:0.6,eyeGlow:0.8,species:"dragon"},
  "Snake Vertical":{irisColor:"#4aaa22",pupilSize:0.12,irisSize:0.7,scleraColor:"#e8ead0",irisPattern:"vertical",limbusWidth:0.05,irisRings:2,irisDetail:0.7,eyelidTop:0.3,eyelidBot:0.05,innerCorner:0,outerCorner:0,reflection:0.7,eyeGlow:0.1,species:"snake"},
  "Alien Void":    {irisColor:"#00ffcc",pupilSize:0.5,irisSize:0.9,scleraColor:"#000000",irisPattern:"spiral",limbusWidth:0.02,irisRings:8,irisDetail:1.0,eyelidTop:0.6,eyelidBot:0.0,innerCorner:0,outerCorner:0.2,reflection:1.0,eyeGlow:1.0,species:"alien"},
  "Demon":         {irisColor:"#cc0000",pupilSize:0.25,irisSize:0.78,scleraColor:"#000000",irisPattern:"fire",limbusWidth:0.03,irisRings:6,irisDetail:0.95,eyelidTop:0.58,eyelidBot:0.08,innerCorner:0.05,outerCorner:0.15,reflection:0.5,eyeGlow:0.9,species:"demon"},
  "Undead":        {irisColor:"#88aaff",pupilSize:0.6,irisSize:0.5,scleraColor:"#d4d0b0",irisPattern:"radial",limbusWidth:0.12,irisRings:1,irisDetail:0.3,eyelidTop:0.35,eyelidBot:0.2,innerCorner:0.08,outerCorner:-0.1,reflection:0.2,eyeGlow:0.4,species:"undead"},
};

function drawEyePreview(canvas, eye){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#111";ctx.fillRect(0,0,w,h);
  const cx=w/2,cy=h/2,er=h*0.35;

  // Sclera
  ctx.beginPath();ctx.ellipse(cx,cy,er*1.4,er,0,0,Math.PI*2);
  ctx.fillStyle=eye.scleraColor||"#f5f0e8";ctx.fill();

  // Iris
  const ir=er*eye.irisSize;
  const irisGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,ir);
  const ic=eye.irisColor||"#5b8ad0";
  irisGrad.addColorStop(0,ic+"cc");
  irisGrad.addColorStop(0.5,ic);
  irisGrad.addColorStop(1,ic+"66");
  ctx.beginPath();ctx.arc(cx,cy,ir,0,Math.PI*2);
  ctx.fillStyle=irisGrad;ctx.fill();

  // Iris pattern
  if(eye.irisPattern==="radial"||eye.irisPattern==="fire"){
    const rays=Math.round(24+eye.irisDetail*16);
    for(let i=0;i<rays;i++){
      const a=(i/rays)*Math.PI*2;
      const len=ir*(0.3+Math.random()*0.4)*eye.irisDetail;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*len,cy+Math.sin(a)*len);
      ctx.strokeStyle="rgba(0,0,0,0.15)";ctx.lineWidth=1;ctx.stroke();
    }
  }
  if(eye.irisPattern==="spiral"){
    for(let i=0;i<60;i++){
      const t=i/60,a=t*Math.PI*8,r=t*ir*0.9;
      ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,1.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${0.3*eye.irisDetail})`;ctx.fill();
    }
  }

  // Iris rings
  for(let r=0;r<eye.irisRings;r++){
    ctx.beginPath();ctx.arc(cx,cy,ir*(0.3+r/(eye.irisRings)*0.65),0,Math.PI*2);
    ctx.strokeStyle="rgba(0,0,0,0.12)";ctx.lineWidth=1;ctx.stroke();
  }

  // Limbus
  ctx.beginPath();ctx.arc(cx,cy,ir,0,Math.PI*2);
  ctx.strokeStyle="rgba(0,0,0,0.6)";ctx.lineWidth=ir*eye.limbusWidth*2;ctx.stroke();

  // Pupil
  const pr=ir*eye.pupilSize;
  if(eye.irisPattern==="slit"||eye.irisPattern==="vertical"){
    ctx.beginPath();ctx.ellipse(cx,cy,pr*0.25,pr,0,0,Math.PI*2);
  } else {
    ctx.beginPath();ctx.arc(cx,cy,pr,0,Math.PI*2);
  }
  ctx.fillStyle="#000";ctx.fill();

  // Reflection
  if(eye.reflection>0){
    const rg=ctx.createRadialGradient(cx-ir*0.25,cy-ir*0.25,0,cx-ir*0.25,cy-ir*0.25,ir*0.35);
    rg.addColorStop(0,`rgba(255,255,255,${eye.reflection*0.9})`);
    rg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.beginPath();ctx.arc(cx-ir*0.25,cy-ir*0.25,ir*0.35,0,Math.PI*2);ctx.fillStyle=rg;ctx.fill();
    ctx.beginPath();ctx.arc(cx+ir*0.3,cy+ir*0.2,ir*0.1,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${eye.reflection*0.5})`;ctx.fill();
  }

  // Glow
  if(eye.eyeGlow>0){
    const glowGrad=ctx.createRadialGradient(cx,cy,ir*0.5,cx,cy,ir*1.3);
    glowGrad.addColorStop(0,eye.irisColor+Math.round(eye.eyeGlow*120).toString(16).padStart(2,"0"));
    glowGrad.addColorStop(1,"transparent");
    ctx.beginPath();ctx.arc(cx,cy,ir*1.3,0,Math.PI*2);ctx.fillStyle=glowGrad;ctx.fill();
  }

  // Eyelids
  ctx.beginPath();ctx.moveTo(cx-er*1.4,cy);
  ctx.quadraticCurveTo(cx,cy-er*(0.6+eye.eyelidTop*0.6),cx+er*1.4,cy);
  ctx.fillStyle=T.bg;ctx.fill();
  ctx.beginPath();ctx.moveTo(cx-er*1.4,cy);
  ctx.quadraticCurveTo(cx,cy+er*(0.3+eye.eyelidBot*0.4),cx+er*1.4,cy);
  ctx.fillStyle=T.bg;ctx.fill();

  // Eyelash dots (simplified)
  const lashCount=12;
  for(let i=0;i<lashCount;i++){
    const t=i/(lashCount-1), x2=cx-er*1.35+t*er*2.7;
    const y2=cy-er*(0.6+eye.eyelidTop*0.6)*Math.sin(t*Math.PI);
    ctx.beginPath();ctx.arc(x2,y2,2,0,Math.PI*2);ctx.fillStyle="#1a0a00";ctx.fill();
  }
}

function Slider({label,value,min,max,step=0.01,onChange}){
  return(
    <div>
      <label style={S.lbl}>{label}: <span style={{color:T.teal}}>{typeof value==="number"?value.toFixed(2):value}</span></label>
      <input style={S.inp} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}

export default function EyeGeneratorPanel({scene}){
  const [preset, setPreset]    = useState("Human Neutral");
  const [eye,    setEye]       = useState({...EYE_PRESETS["Human Neutral"]});
  const [status, setStatus]    = useState("");
  const prevRef = useRef(null);

  const set = useCallback((k,v)=>setEye(e=>({...e,[k]:v})),[]);

  useEffect(()=>{ if(prevRef.current) drawEyePreview(prevRef.current,eye); },[eye]);

  function loadPreset(p){ setPreset(p); setEye({...EYE_PRESETS[p]}); }

  function applyToScene(){
    if(!scene){ setStatus("No scene"); return; }
    const c = document.createElement("canvas");
    c.width=c.height=512; drawEyePreview(c,eye);
    const tex = new THREE.CanvasTexture(c);
    let n=0;
    scene.traverse(o=>{
      if(o.isMesh&&(o.name.toLowerCase().includes("eye")||o.userData.isEye)){
        o.material = new THREE.MeshStandardMaterial({map:tex,roughness:0.05,metalness:0.1});
        n++;
      }
    });
    setStatus(`✓ Applied to ${n} eye mesh(es)`);
  }

  function exportTexture(){
    const c=document.createElement("canvas");c.width=c.height=1024;
    drawEyePreview(c,eye);
    const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="eye_texture.png";a.click();
    setStatus("✓ Eye texture exported");
  }

  const PATTERNS=["radial","slit","vertical","fire","spiral","void"];

  return(
    <div style={S.root}>
      <div style={S.h2}>👁 EYE GENERATOR</div>

      <div style={S.sec}>
        <div style={S.h3}>Presets</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(EYE_PRESETS).map(p=><span key={p} style={preset===p?S.tagOn:S.tag} onClick={()=>loadPreset(p)}>{p}</span>)}
        </div>
        <canvas ref={prevRef} width={400} height={200} style={S.prev}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Iris</div>
        <div style={S.row}>
          <div><label style={S.lbl}>Iris Color</label>
            <input type="color" value={eye.irisColor||"#5b8ad0"} onChange={e=>set("irisColor",e.target.value)} style={{width:"100%",height:32,borderRadius:4,border:"none",cursor:"pointer"}}/></div>
          <div><label style={S.lbl}>Sclera Color</label>
            <input type="color" value={eye.scleraColor||"#f5f0e8"} onChange={e=>set("scleraColor",e.target.value)} style={{width:"100%",height:32,borderRadius:4,border:"none",cursor:"pointer"}}/></div>
        </div>
        <label style={S.lbl}>Iris Pattern</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {PATTERNS.map(p=><span key={p} style={eye.irisPattern===p?S.tagOn:S.tag} onClick={()=>set("irisPattern",p)}>{p}</span>)}
        </div>
        <Slider label="Iris Size"    value={eye.irisSize||0.62}    min={0.3} max={1}   onChange={v=>set("irisSize",v)}/>
        <Slider label="Iris Rings"   value={eye.irisRings||3}      min={0}   max={10} step={1} onChange={v=>set("irisRings",v)}/>
        <Slider label="Iris Detail"  value={eye.irisDetail||0.6}   min={0}   max={1}   onChange={v=>set("irisDetail",v)}/>
        <Slider label="Limbus Width" value={eye.limbusWidth||0.08} min={0}   max={0.3} onChange={v=>set("limbusWidth",v)}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Pupil</div>
        <Slider label="Pupil Size"   value={eye.pupilSize||0.35}   min={0.05} max={0.95} onChange={v=>set("pupilSize",v)}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>Eyelids</div>
        <Slider label="Upper Lid"    value={eye.eyelidTop||0.45}   min={0}   max={1}   onChange={v=>set("eyelidTop",v)}/>
        <Slider label="Lower Lid"    value={eye.eyelidBot||0.15}   min={0}   max={0.5} onChange={v=>set("eyelidBot",v)}/>
        <Slider label="Inner Corner" value={eye.innerCorner||0.1}  min={-0.3} max={0.3} onChange={v=>set("innerCorner",v)}/>
        <Slider label="Outer Corner" value={eye.outerCorner||-0.05}min={-0.3} max={0.3} onChange={v=>set("outerCorner",v)}/>
      </div>

      <div style={S.sec}>
        <div style={S.h3}>FX</div>
        <Slider label="Reflection"   value={eye.reflection||0.8}  min={0}   max={1}   onChange={v=>set("reflection",v)}/>
        <Slider label="Eye Glow"     value={eye.eyeGlow||0}       min={0}   max={1}   onChange={v=>set("eyeGlow",v)}/>
      </div>

      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      <button style={S.btnO} onClick={exportTexture}>💾 Export Texture</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
