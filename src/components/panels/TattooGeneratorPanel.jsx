
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},prev:{width:"100%",height:140,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const PLACEMENTS=["Face","Neck","Chest","Back","Left Arm","Right Arm","Left Hand","Right Hand","Left Leg","Right Leg","Full Body Sleeve"];
const STYLES=["Tribal","Geometric","Minimal Line Art","Traditional Bold","Watercolor","Blackwork","Dotwork","Japanese Irezumi","Fantasy Runes","Magical Markings","Creature Markings","Circuit/Tech","Celtic Knotwork","Biomechanical","Script/Text"];

function drawTattooPreview(canvas, cfg){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,w,h);
  const col=cfg.color||"#111111";
  const fade=cfg.inkFade||0;
  const bw=w*.7,bh=h*.8,bx=w*.15,by=h*.1;
  // Body silhouette
  ctx.beginPath();ctx.ellipse(w/2,h/2,bw/2,bh/2,0,0,Math.PI*2);ctx.fillStyle="rgba(200,140,90,.3)";ctx.fill();
  ctx.strokeStyle="rgba(200,140,90,.5)";ctx.lineWidth=1;ctx.stroke();
  ctx.globalAlpha=1-fade*.5;
  // Draw style
  const style=cfg.style||"Tribal";
  const sc=cfg.scale||1;
  ctx.strokeStyle=col;ctx.fillStyle=col;
  ctx.save();ctx.translate(w/2,h/2);ctx.scale(sc,sc);
  if(style==="Tribal"){
    for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(i*Math.PI/3)*50,Math.sin(i*Math.PI/3)*50);ctx.lineTo(Math.cos(i*Math.PI/3+.3)*40,Math.sin(i*Math.PI/3+.3)*40);ctx.closePath();ctx.lineWidth=3;ctx.stroke();}
  }else if(style==="Geometric"){
    for(let i=0;i<4;i++){ctx.beginPath();const r=15+i*15;ctx.arc(0,0,r,0,Math.PI*2);ctx.lineWidth=1.5;ctx.stroke();}
    for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(Math.cos(i/6*Math.PI*2)*10,Math.sin(i/6*Math.PI*2)*10);ctx.lineTo(Math.cos(i/6*Math.PI*2)*55,Math.sin(i/6*Math.PI*2)*55);ctx.lineWidth=1;ctx.stroke();}
  }else if(style==="Fantasy Runes"){
    ctx.font="bold 18px serif";ctx.textAlign="center";
    ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ"].forEach((r,i)=>{ctx.fillText(r,(i%3-1)*25,Math.floor(i/3)*28-14);});
  }else if(style==="Magical Markings"){
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,40,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;ctx.beginPath();ctx.moveTo(Math.cos(a)*40,Math.sin(a)*40);ctx.lineTo(Math.cos(a+Math.PI*4/5)*40,Math.sin(a+Math.PI*4/5)*40);ctx.stroke();}
  }else if(style==="Circuit/Tech"){
    ctx.lineWidth=1.5;
    let px=0,py=0;
    for(let i=0;i<10;i++){const nx=px+(Math.random()-.5)*50,ny=py+(Math.random()-.5)*50;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(nx,py);ctx.lineTo(nx,ny);ctx.stroke();ctx.beginPath();ctx.arc(nx,ny,2,0,Math.PI*2);ctx.fill();px=nx;py=ny;}
  }else if(style==="Creature Markings"){
    ctx.lineWidth=2;
    for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-40+i*20,-(30-Math.abs(i-2)*8));ctx.quadraticCurveTo(0,40,40-i*20,-(30-Math.abs(i-2)*8));ctx.stroke();}
  }else if(style==="Watercolor"){
    for(let i=0;i<8;i++){ctx.globalAlpha=(1-fade*.5)*.3;ctx.beginPath();ctx.arc((Math.random()-.5)*60,(Math.random()-.5)*60,10+Math.random()*25,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();}
    ctx.globalAlpha=1-fade*.5;
  }else{
    // Generic lines
    ctx.lineWidth=2;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-45+i*30,-30+i*20);ctx.quadraticCurveTo(0,0,45-i*30,30-i*20);ctx.stroke();}
  }
  ctx.restore();ctx.globalAlpha=1;
}

export default function TattooGeneratorPanel({scene}){
  const [placement,setPlacement]=useState("Left Arm");
  const [style,setStyle]=useState("Tribal");
  const [color,setColor]=useState("#111111");
  const [scale,setScale]=useState(1);
  const [rotation,setRotation]=useState(0);
  const [opacity,setOpacity]=useState(0.9);
  const [inkFade,setInkFade]=useState(0.1);
  const [blur,setBlur]=useState(0);
  const [layers,setLayers]=useState([]);
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);

  function preview(){if(prevRef.current)drawTattooPreview(prevRef.current,{style,color,scale,inkFade});}

  function addLayer(){
    setLayers(l=>[...l,{style,color,placement,scale,opacity,inkFade,id:Date.now()}]);
    setStatus(`Layer added — ${layers.length+1} total`);
  }

  function applyToScene(){
    if(!scene){setStatus("No scene");return;}
    const allLayers=layers.length?layers:[{style,color,placement,scale,opacity,inkFade}];
    let n=0;
    allLayers.forEach((layer,idx)=>{
      const c=document.createElement("canvas");c.width=c.height=512;
      drawTattooPreview(c,layer);
      const tex=new THREE.CanvasTexture(c);
      tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
      const mat=new THREE.MeshStandardMaterial({map:tex,transparent:true,opacity:layer.opacity||.9,roughness:.9,alphaTest:.05});
      scene.traverse(o=>{if(o.isMesh&&!o.userData.isTattoo){
        const decal=new THREE.Mesh(new THREE.BoxGeometry(.001,.2,.1),mat.clone());
        decal.position.copy(o.position);decal.position.y+=.3*(idx*.1);
        decal.userData.isTattoo=true;scene.add(decal);n++;
      }});
    });
    setStatus(`✓ ${allLayers.length} tattoo layer(s) applied`);
  }

  function downloadTexture(){
    const c=document.createElement("canvas");c.width=c.height=512;drawTattooPreview(c,{style,color,scale,inkFade});
    const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download=`tattoo_${style.replace(/ /g,"_")}.png`;a.click();
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>💉 TATTOO GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Placement Zone</label>
        <select style={S.sel} value={placement} onChange={e=>setPlacement(e.target.value)}>{PLACEMENTS.map(p=><option key={p}>{p}</option>)}</select>
        <label style={S.lbl}>Tattoo Style</label>
        <select style={S.sel} value={style} onChange={e=>{setStyle(e.target.value);setTimeout(preview,50);}}>
          {STYLES.map(s=><option key={s}>{s}</option>)}
        </select>
        <canvas ref={prevRef} width={300} height={140} style={S.prev}/>
        <button style={{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer"}} onClick={preview}>👁 Preview</button>
      </div>
      <div style={S.sec}>
        <label style={S.lbl}>Ink Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={color} onChange={e=>{setColor(e.target.value);preview();}}/>
        <label style={S.lbl}>Scale: {scale.toFixed(2)}</label>
        <input style={S.inp} type="range" min={.2} max={3} step={.01} value={scale} onChange={e=>{setScale(+e.target.value);preview();}}/>
        <label style={S.lbl}>Rotation: {rotation}°</label>
        <input style={S.inp} type="range" min={0} max={360} value={rotation} onChange={e=>setRotation(+e.target.value)}/>
        <label style={S.lbl}>Opacity: {opacity.toFixed(2)}</label>
        <input style={S.inp} type="range" min={.1} max={1} step={.01} value={opacity} onChange={e=>setOpacity(+e.target.value)}/>
        <label style={S.lbl}>Ink Fade: {inkFade.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={.01} value={inkFade} onChange={e=>{setInkFade(+e.target.value);preview();}}/>
        <label style={S.lbl}>Blur: {blur.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={.01} value={blur} onChange={e=>setBlur(+e.target.value)}/>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Layers ({layers.length})</div>
        <button style={S.btnSm} onClick={addLayer}>+ Add Layer</button>
        <button style={S.btnSm} onClick={()=>{setLayers([]);setStatus("Layers cleared");}}>Clear Layers</button>
        {layers.map((l,i)=><div key={l.id} style={{fontSize:10,color:"#888",padding:"2px 0"}}>{i+1}. {l.style} on {l.placement}</div>)}
      </div>
      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      <button style={S.btnO} onClick={downloadTexture}>💾 Download PNG</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
