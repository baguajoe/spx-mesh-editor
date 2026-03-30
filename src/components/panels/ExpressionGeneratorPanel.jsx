
import React, { useState, useRef, useEffect } from "react";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},prev:{width:"100%",height:160,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const EMOTION_PRESETS={
  "Neutral":    {smile:0,mouthOpen:0,eyeOpen:1,squint:0,browRaise:0,browFrown:0,jawDrop:0,snarl:0,asymmetry:0},
  "Happy":      {smile:0.85,mouthOpen:0.3,eyeOpen:0.9,squint:0.3,browRaise:0.4,browFrown:0,jawDrop:0,snarl:0,asymmetry:0.05},
  "Sad":        {smile:-0.6,mouthOpen:0.1,eyeOpen:0.6,squint:0,browRaise:0,browFrown:0.7,jawDrop:0.1,snarl:0,asymmetry:0.1},
  "Angry":      {smile:-0.4,mouthOpen:0.15,eyeOpen:0.7,squint:0.5,browRaise:0,browFrown:0.95,jawDrop:0,snarl:0.4,asymmetry:0.08},
  "Surprised":  {smile:0.1,mouthOpen:0.9,eyeOpen:1.0,squint:0,browRaise:0.95,browFrown:0,jawDrop:0.8,snarl:0,asymmetry:0.05},
  "Fear":       {smile:-0.2,mouthOpen:0.5,eyeOpen:1.0,squint:0,browRaise:0.7,browFrown:0.3,jawDrop:0.3,snarl:0,asymmetry:0.15},
  "Disgust":    {smile:-0.5,mouthOpen:0.1,eyeOpen:0.7,squint:0.4,browRaise:0,browFrown:0.6,jawDrop:0,snarl:0.6,asymmetry:0.2},
  "Confident":  {smile:0.5,mouthOpen:0,eyeOpen:0.85,squint:0.2,browRaise:0,browFrown:0,jawDrop:0,snarl:0,asymmetry:0.03},
  "Villain":    {smile:0.4,mouthOpen:0.2,eyeOpen:0.6,squint:0.6,browRaise:-0.3,browFrown:0.5,jawDrop:0,snarl:0.3,asymmetry:0.25},
  "Smug":       {smile:0.6,mouthOpen:0,eyeOpen:0.7,squint:0.4,browRaise:0.3,browFrown:0,jawDrop:0,snarl:0,asymmetry:0.35},
  "Anguish":    {smile:-0.9,mouthOpen:0.7,eyeOpen:0.8,squint:0.2,browRaise:0.6,browFrown:0.8,jawDrop:0.6,snarl:0.2,asymmetry:0.2},
  "Rage":       {smile:-0.8,mouthOpen:0.6,eyeOpen:0.5,squint:0.7,browRaise:0,browFrown:1.0,jawDrop:0,snarl:0.9,asymmetry:0.1},
};

function drawFacePreview(canvas, expr){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,w,h);
  const cx=w/2,cy=h/2,fr=h*.36;
  // Head
  ctx.beginPath();ctx.ellipse(cx,cy,fr*.8,fr,0,0,Math.PI*2);
  ctx.fillStyle="#c8955a";ctx.fill();ctx.strokeStyle="#00ffc8";ctx.lineWidth=1.5;ctx.stroke();
  // Eyes
  const eyY=cy-fr*.2, eyeOpen=0.15+expr.eyeOpen*.25;
  [-fr*.3,fr*.3].forEach((ex,idx)=>{
    const asym=idx===1?expr.asymmetry*0.05:0;
    const sq=expr.squint*.08;
    ctx.beginPath();ctx.ellipse(cx+ex,eyY+asym,fr*.15,Math.max(.01,eyeOpen-sq),0,0,Math.PI*2);
    ctx.fillStyle="#ffffff";ctx.fill();ctx.strokeStyle="#333";ctx.lineWidth=1;ctx.stroke();
    // pupil
    ctx.beginPath();ctx.arc(cx+ex,eyY+asym,fr*.07,0,Math.PI*2);ctx.fillStyle="#224488";ctx.fill();
    ctx.beginPath();ctx.arc(cx+ex-fr*.02,eyY+asym-fr*.03,fr*.025,0,Math.PI*2);ctx.fillStyle="#ffffff";ctx.fill();
  });
  // Brows
  [-fr*.3,fr*.3].forEach((ex,idx)=>{
    const asym=idx===1?expr.asymmetry*0.04:0;
    const browY=eyY-fr*.22-expr.browRaise*.08+expr.browFrown*(idx===0?-.04:.04)+asym;
    const angle=(expr.browFrown+expr.browRaise*0.3)*(idx===0?-.12:.12);
    ctx.save();ctx.translate(cx+ex,browY);ctx.rotate(angle);
    ctx.beginPath();ctx.moveTo(-fr*.14,0);ctx.quadraticCurveTo(0,-fr*.04,fr*.14,0);
    ctx.strokeStyle="#554433";ctx.lineWidth=fr*.06*(0.5+expr.browFrown*.5+0.3);ctx.lineCap="round";ctx.stroke();
    ctx.restore();
  });
  // Mouth
  const mouthY=cy+fr*.35, mw=fr*(0.35+Math.abs(expr.smile)*.15+expr.mouthOpen*.1);
  const mouthCurve=expr.smile*fr*.18;
  const asym=expr.asymmetry*fr*.06;
  ctx.beginPath();ctx.moveTo(cx-mw,mouthY+asym);
  ctx.quadraticCurveTo(cx,mouthY+mouthCurve,cx+mw,mouthY-asym);
  ctx.strokeStyle="#884433";ctx.lineWidth=2.5;ctx.stroke();
  if(expr.mouthOpen>.1){
    ctx.beginPath();ctx.moveTo(cx-mw*.7,mouthY+asym+mouthCurve*.4);
    ctx.quadraticCurveTo(cx,mouthY+mouthCurve+expr.mouthOpen*fr*.22,cx+mw*.7,mouthY-asym+mouthCurve*.4);
    ctx.lineTo(cx+mw*.7,mouthY-asym+mouthCurve*.4);
    ctx.closePath();ctx.fillStyle="#220a0a";ctx.fill();
    if(expr.jawDrop>.3){ctx.beginPath();ctx.moveTo(cx-mw*.4,mouthY+mouthCurve+expr.mouthOpen*fr*.15);ctx.lineTo(cx+mw*.4,mouthY+mouthCurve+expr.mouthOpen*fr*.15);ctx.strokeStyle="#ddddcc";ctx.lineWidth=4;ctx.stroke();}
  }
  if(expr.snarl>.2){ctx.beginPath();ctx.moveTo(cx-mw*.6,mouthY+asym+mouthCurve*.3);ctx.lineTo(cx-mw*.3,mouthY+asym+mouthCurve*.3-expr.snarl*fr*.1);ctx.strokeStyle="#884433";ctx.lineWidth=2;ctx.stroke();}
  // Nose
  ctx.beginPath();ctx.moveTo(cx-fr*.06,cy+fr*.05);ctx.quadraticCurveTo(cx,cy+fr*.18,cx+fr*.06,cy+fr*.05);
  ctx.strokeStyle="#a07050";ctx.lineWidth=1.5;ctx.stroke();
  // Emotion label
  ctx.fillStyle="rgba(0,255,200,0.6)";ctx.font="10px JetBrains Mono,monospace";
  ctx.fillText("Intensity: "+(expr.smile>0?"happy":"sad/angry"),8,h-8);
}

export default function ExpressionGeneratorPanel({morphTargets}){
  const [expr,setExpr]=useState({smile:0,mouthOpen:0,eyeOpen:1,squint:0,browRaise:0,browFrown:0,jawDrop:0,snarl:0,asymmetry:0});
  const [preset,setPreset]=useState("Neutral");
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);

  useEffect(()=>{if(prevRef.current)drawFacePreview(prevRef.current,expr);},[expr]);

  function loadPreset(p){setPreset(p);const e=EMOTION_PRESETS[p];if(e)setExpr(e);}

  function applyMorphs(){
    if(!morphTargets){setStatus("No morph targets connected");return;}
    Object.entries(expr).forEach(([k,v])=>{if(morphTargets[k]!==undefined)morphTargets[k]=v;});
    setStatus("✓ Expression applied to morph targets");
  }

  const CONTROLS=[
    {id:"smile",lbl:"Smile / Frown",min:-1,max:1},
    {id:"mouthOpen",lbl:"Mouth Open",min:0,max:1},
    {id:"eyeOpen",lbl:"Eye Openness",min:0,max:1},
    {id:"squint",lbl:"Squint",min:0,max:1},
    {id:"browRaise",lbl:"Brow Raise",min:0,max:1},
    {id:"browFrown",lbl:"Brow Frown",min:0,max:1},
    {id:"jawDrop",lbl:"Jaw Drop",min:0,max:1},
    {id:"snarl",lbl:"Snarl",min:0,max:1},
    {id:"asymmetry",lbl:"Asymmetry",min:0,max:1},
  ];

  return(
    <div style={S.root}>
      <div style={S.h2}>😐 EXPRESSION GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Emotion Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(EMOTION_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <canvas ref={prevRef} width={300} height={160} style={S.prev}/>
      </div>
      <div style={S.sec}>
        {CONTROLS.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {expr[c.id]?.toFixed(2)}</label>
            <input style={S.inp} type="range" min={c.min} max={c.max} step={0.01} value={expr[c.id]||0} onChange={e=>setExpr(ex=>({...ex,[c.id]:+e.target.value}))}/>
          </div>
        ))}
      </div>
      <button style={S.btn} onClick={applyMorphs}>✓ Apply Morphs</button>
      <button style={{...S.btnO}} onClick={()=>{const b=new Blob([JSON.stringify(expr,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="expression.json";a.click();}}>💾 Export JSON</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
