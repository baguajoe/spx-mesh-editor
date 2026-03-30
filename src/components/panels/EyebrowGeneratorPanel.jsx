
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},prev:{width:"100%",height:100,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const BROW_PRESETS={
  "Natural":    {thickness:.5,width:.7,archH:.4,archSharp:.3,length:.7,tailLen:.5,density:.7,asymmetry:.05,browRidge:0,angelicCurve:0,demonAngle:0},
  "Thick":      {thickness:.85,width:.8,archH:.3,archSharp:.2,length:.8,tailLen:.6,density:.9,asymmetry:.05,browRidge:0,angelicCurve:.1,demonAngle:0},
  "Thin":       {thickness:.2,width:.65,archH:.5,archSharp:.5,length:.6,tailLen:.4,density:.5,asymmetry:.08,browRidge:0,angelicCurve:.2,demonAngle:0},
  "Sculpted":   {thickness:.55,width:.7,archH:.65,archSharp:.6,length:.68,tailLen:.5,density:.75,asymmetry:.03,browRidge:0,angelicCurve:.15,demonAngle:0},
  "Villain":    {thickness:.6,width:.68,archH:.2,archSharp:.8,length:.65,tailLen:.55,density:.8,asymmetry:.2,browRidge:.4,angelicCurve:0,demonAngle:.7},
  "Demon Brow": {thickness:.9,width:.85,archH:.1,archSharp:.9,length:.85,tailLen:.8,density:.95,asymmetry:.15,browRidge:.9,angelicCurve:0,demonAngle:.9},
  "Heavy Ridge":{thickness:.95,width:.9,archH:.15,archSharp:.7,length:.88,tailLen:.7,density:1,asymmetry:.1,browRidge:.95,angelicCurve:0,demonAngle:.5},
  "Angular":    {thickness:.65,width:.72,archH:.3,archSharp:.95,length:.7,tailLen:.5,density:.8,asymmetry:.1,browRidge:.3,angelicCurve:0,demonAngle:.6},
};

function drawBrowPreview(canvas,brow,color){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,w,h);
  const drawBrow=(cx,flip)=>{
    const bw=brow.width*w*.35,bh=brow.thickness*h*.35;
    const archY=-brow.archH*h*.18;
    const angle=(brow.demonAngle*.3)*(flip?-1:1);
    ctx.save();ctx.translate(cx,h*.42);ctx.rotate(angle);
    // brow ridge
    if(brow.browRidge>.1){ctx.beginPath();ctx.ellipse(0,-bh*.5,bw*.55,bh*(.5+brow.browRidge*.5),0,0,Math.PI*2);ctx.fillStyle="rgba(100,60,40,"+brow.browRidge*.4+")";ctx.fill();}
    // brow hair
    for(let i=0;i<Math.round(brow.density*25);i++){
      const t=i/25,lx=-bw*.45+t*bw*.9+brow.tailLen*bw*.1;
      const larch=Math.sin(t*Math.PI)*archY;
      const lthick=bh*(.7+Math.sin(t*Math.PI)*brow.density*.3);
      const angle2=(Math.random()-.5)*.3+brow.demonAngle*.2;
      ctx.strokeStyle=color||"#554433";ctx.lineWidth=1+brow.thickness*2;ctx.globalAlpha=.7+Math.random()*.3;
      ctx.beginPath();ctx.moveTo(lx,larch);ctx.lineTo(lx+Math.sin(angle2)*2,larch-lthick*.4);ctx.stroke();
    }
    ctx.globalAlpha=1;
    // main shape
    ctx.beginPath();ctx.moveTo(-bw*.45,0);
    ctx.quadraticCurveTo(-bw*.1,archY-bh*.3*brow.archSharp,bw*.5+brow.tailLen*bw*.2,bh*.2);
    ctx.quadraticCurveTo(bw*.2,archY+bh*.5,- bw*.45,bh*.25);
    ctx.closePath();ctx.fillStyle=color||"#443322";ctx.globalAlpha=.7;ctx.fill();ctx.globalAlpha=1;
    ctx.restore();
  };
  const asym=brow.asymmetry*h*.04;
  drawBrow(w*.3,false);
  ctx.save();ctx.translate(w*.7,asym);drawBrow(0,true);ctx.restore();
}

export default function EyebrowGeneratorPanel({scene}){
  const [preset,setPreset]=useState("Natural");
  const [brow,setBrow]=useState({...BROW_PRESETS["Natural"]});
  const [browColor,setBrowColor]=useState("#443322");
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);

  function loadPreset(p){setPreset(p);setBrow({...BROW_PRESETS[p]});setTimeout(()=>{if(prevRef.current)drawBrowPreview(prevRef.current,BROW_PRESETS[p],browColor);},50);}
  function preview(){if(prevRef.current)drawBrowPreview(prevRef.current,brow,browColor);}

  function applyToScene(){
    if(!scene){setStatus("No scene");return;}
    const c=document.createElement("canvas");c.width=c.height=256;drawBrowPreview(c,brow,browColor);
    const tex=new THREE.CanvasTexture(c);let n=0;
    scene.traverse(o=>{if(o.isMesh&&(o.name.toLowerCase().includes("brow")||o.userData.isBrow)){o.material=new THREE.MeshStandardMaterial({map:tex,roughness:.9,transparent:true});n++;}});
    setStatus(`✓ Applied to ${n} eyebrow mesh(es)`);
  }

  const CTRL=[
    {id:"thickness",lbl:"Thickness"},{id:"width",lbl:"Width"},{id:"archH",lbl:"Arch Height"},
    {id:"archSharp",lbl:"Arch Sharpness"},{id:"length",lbl:"Length"},{id:"tailLen",lbl:"Tail Length"},
    {id:"density",lbl:"Hair Density"},{id:"asymmetry",lbl:"Asymmetry"},
    {id:"browRidge",lbl:"Brow Ridge Depth"},{id:"demonAngle",lbl:"Demon Angle"},
  ];

  return(
    <div style={S.root}>
      <div style={S.h2}>🪶 EYEBROW GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Brow Preset</label>
        <select style={S.sel} value={preset} onChange={e=>loadPreset(e.target.value)}>{Object.keys(BROW_PRESETS).map(p=><option key={p}>{p}</option>)}</select>
        <canvas ref={prevRef} width={300} height={100} style={S.prev}/>
        <button style={{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:8}} onClick={preview}>👁 Preview</button>
        <label style={S.lbl}>Brow Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={browColor} onChange={e=>{setBrowColor(e.target.value);preview();}}/>
      </div>
      <div style={S.sec}>
        {CTRL.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {brow[c.id]?.toFixed(2)}</label>
            <input style={S.inp} type="range" min={0} max={1} step={0.01} value={brow[c.id]||0} onChange={e=>{setBrow(b=>({...b,[c.id]:+e.target.value}));preview();}}/>
          </div>
        ))}
      </div>
      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
