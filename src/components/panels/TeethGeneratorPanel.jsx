
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},prev:{width:"100%",height:120,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const TOOTH_TYPES=["Natural Human","Perfect Human","Creature Fangs","Vampire","Demon Multi-Row","Predator","Dragon","Shark","Werewolf","Crocodilian"];
const TOOTH_PRESETS={
  "Natural Human":  {toothCount:8,toothW:.85,toothH:.9,toothTaper:.3,fangLen:0,fangCurve:0,spacing:.05,yellowTint:.2,imperfect:.4,multiRow:false},
  "Perfect Human":  {toothCount:8,toothW:.88,toothH:.92,toothTaper:.2,fangLen:0,fangCurve:0,spacing:.03,yellowTint:.0,imperfect:.05,multiRow:false},
  "Creature Fangs": {toothCount:6,toothW:.7,toothH:1.2,toothTaper:.7,fangLen:.6,fangCurve:.3,spacing:.08,yellowTint:.4,imperfect:.5,multiRow:false},
  "Vampire":        {toothCount:8,toothW:.82,toothH:.95,toothTaper:.4,fangLen:.85,fangCurve:.15,spacing:.04,yellowTint:.05,imperfect:.1,multiRow:false},
  "Demon Multi-Row":{toothCount:10,toothW:.6,toothH:1.1,toothTaper:.8,fangLen:.5,fangCurve:.4,spacing:.06,yellowTint:.5,imperfect:.7,multiRow:true},
  "Predator":       {toothCount:7,toothW:.65,toothH:1.3,toothTaper:.85,fangLen:.7,fangCurve:.5,spacing:.1,yellowTint:.35,imperfect:.4,multiRow:false},
  "Dragon":         {toothCount:12,toothW:.7,toothH:1.5,toothTaper:.9,fangLen:1.0,fangCurve:.6,spacing:.12,yellowTint:.3,imperfect:.2,multiRow:true},
  "Shark":          {toothCount:14,toothW:.6,toothH:1.0,toothTaper:.95,fangLen:.3,fangCurve:.1,spacing:.04,yellowTint:.1,imperfect:.1,multiRow:true},
  "Werewolf":       {toothCount:8,toothW:.75,toothH:1.2,toothTaper:.7,fangLen:.8,fangCurve:.35,spacing:.08,yellowTint:.45,imperfect:.6,multiRow:false},
  "Crocodilian":    {toothCount:16,toothW:.55,toothH:1.1,toothTaper:.6,fangLen:.4,fangCurve:.05,spacing:.15,yellowTint:.4,imperfect:.35,multiRow:true},
};

function drawTeethPreview(canvas,t){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.fillStyle="#0a0008";ctx.fillRect(0,0,w,h);
  // Gums
  ctx.beginPath();ctx.ellipse(w/2,h*.35,w*.42,h*.22,0,0,Math.PI*2);
  ctx.fillStyle="#cc3344";ctx.fill();
  const toothBaseY=h*.42,toothBaseW=w*.75,toothW=(toothBaseW/t.toothCount)*(1-t.spacing);
  const yellowMix=t.yellowTint;
  const toothColor=`rgb(${Math.round(255)},${Math.round(255-yellowMix*60)},${Math.round(255-yellowMix*120)})`;
  for(let i=0;i<t.toothCount;i++){
    const tx=w*.12+i*(toothBaseW/t.toothCount)+t.spacing*4;
    const isFang=(i===1||i===t.toothCount-2);
    const tH=(isFang&&t.fangLen>0)?h*(0.15+t.fangLen*.25):h*(0.12+t.toothH*.1);
    const taper=t.toothTaper*.3;
    const impOff=t.imperfect*(Math.random()-.5)*4;
    ctx.beginPath();ctx.moveTo(tx,toothBaseY+impOff);
    ctx.lineTo(tx+toothW,toothBaseY+impOff);
    ctx.lineTo(tx+toothW*taper,toothBaseY+tH+impOff);
    ctx.lineTo(tx+toothW*(1-taper),toothBaseY+tH+impOff);
    ctx.closePath();
    ctx.fillStyle=isFang&&t.fangLen>.3?"#fff8ee":toothColor;ctx.fill();
    ctx.strokeStyle="#ccccaa";ctx.lineWidth=.5;ctx.stroke();
    if(t.multiRow&&i%2===0&&i>0&&i<t.toothCount-1){
      ctx.beginPath();ctx.moveTo(tx+toothW*.1,toothBaseY-h*.04+impOff*.5);
      ctx.lineTo(tx+toothW*.9,toothBaseY-h*.04+impOff*.5);
      ctx.lineTo(tx+toothW*.7,toothBaseY+tH*.7+impOff*.5);
      ctx.lineTo(tx+toothW*.3,toothBaseY+tH*.7+impOff*.5);
      ctx.closePath();ctx.fillStyle=toothColor;ctx.fill();ctx.stroke();
    }
  }
  if(t.fangLen>0){[w*.25,w*.75].forEach(fx=>{
    ctx.beginPath();ctx.moveTo(fx-8,toothBaseY);ctx.lineTo(fx+8,toothBaseY);
    ctx.lineTo(fx+4*(1-t.fangCurve*.5),toothBaseY+h*(0.15+t.fangLen*.3));
    ctx.lineTo(fx-4*(1-t.fangCurve*.5),toothBaseY+h*(0.15+t.fangLen*.3));
    ctx.closePath();ctx.fillStyle="#fffbf0";ctx.fill();ctx.strokeStyle="#ccccaa";ctx.lineWidth=.8;ctx.stroke();
  });}
}

export default function TeethGeneratorPanel({scene}){
  const [type,setType]=useState("Natural Human");
  const [teeth,setTeeth]=useState({...TOOTH_PRESETS["Natural Human"]});
  const [gumColor,setGumColor]=useState("#cc3344");
  const [brightness,setBrightness]=useState(0.9);
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);

  function loadPreset(t){setType(t);setTeeth({...TOOTH_PRESETS[t]});setTimeout(()=>{if(prevRef.current)drawTeethPreview(prevRef.current,TOOTH_PRESETS[t]);},50);}

  function preview(){if(prevRef.current)drawTeethPreview(prevRef.current,teeth);}

  function buildTeethMesh(){
    if(!scene){setStatus("No scene");return;}
    const group=new THREE.Group();group.name="SPXTeeth";
    const toothMat=new THREE.MeshStandardMaterial({color:new THREE.Color(1,1-teeth.yellowTint*.3,1-teeth.yellowTint*.5),roughness:.15,metalness:.05});
    const gumMat=new THREE.MeshStandardMaterial({color:new THREE.Color(gumColor)});
    // Gum
    const gumGeo=new THREE.TorusGeometry(.04,.012,6,12,Math.PI);const gum=new THREE.Mesh(gumGeo,gumMat);gum.rotation.z=Math.PI;group.add(gum);
    for(let i=0;i<teeth.toothCount;i++){
      const angle=(i/(teeth.toothCount-1)-0.5)*Math.PI*.7;
      const x=Math.sin(angle)*.035,z=Math.cos(angle)*.035-0.035;
      const h=0.008+teeth.toothH*.012+(i===1||i===teeth.toothCount-2?teeth.fangLen*.015:0);
      const w=0.005+teeth.toothW*.004;
      const geo=new THREE.BoxGeometry(w,h,w*.6);
      const tm=new THREE.Mesh(geo,toothMat.clone());
      tm.position.set(x,-h/2,z);tm.rotation.y=angle;
      group.add(tm);
    }
    scene.add(group);
    setStatus(`✓ ${type} teeth built — ${teeth.toothCount} teeth`);
  }

  const CTRL=[
    {id:"toothCount",lbl:"Tooth Count",min:4,max:20,step:1},
    {id:"toothW",lbl:"Tooth Width",min:.3,max:1.2,step:.01},
    {id:"toothH",lbl:"Tooth Height",min:.3,max:2,step:.01},
    {id:"toothTaper",lbl:"Taper/Sharpness",min:0,max:1,step:.01},
    {id:"fangLen",lbl:"Fang Length",min:0,max:1.5,step:.01},
    {id:"fangCurve",lbl:"Fang Curve",min:0,max:1,step:.01},
    {id:"spacing",lbl:"Spacing",min:0,max:.4,step:.01},
    {id:"yellowTint",lbl:"Yellow Tint",min:0,max:1,step:.01},
    {id:"imperfect",lbl:"Imperfections",min:0,max:1,step:.01},
  ];

  return(
    <div style={S.root}>
      <div style={S.h2}>🦷 TEETH GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Tooth Type</label>
        <select style={S.sel} value={type} onChange={e=>loadPreset(e.target.value)}>{TOOTH_TYPES.map(t=><option key={t}>{t}</option>)}</select>
        <canvas ref={prevRef} width={300} height={120} style={S.prev}/>
        <button style={{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer"}} onClick={preview}>👁 Preview</button>
        <label style={S.lbl}><input type="checkbox" checked={teeth.multiRow} onChange={e=>setTeeth(t=>({...t,multiRow:e.target.checked}))}/> Multi-Row Teeth</label>
      </div>
      <div style={S.sec}>
        {CTRL.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {typeof teeth[c.id]==="number"?teeth[c.id].toFixed(c.step<.1?2:0):""}</label>
            <input style={S.inp} type="range" min={c.min} max={c.max} step={c.step} value={teeth[c.id]||0} onChange={e=>setTeeth(t=>({...t,[c.id]:+e.target.value}))}/>
          </div>
        ))}
        <label style={S.lbl}>Gum Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={gumColor} onChange={e=>setGumColor(e.target.value)}/>
      </div>
      <button style={S.btn} onClick={buildTeethMesh}>⚡ Build Teeth</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
