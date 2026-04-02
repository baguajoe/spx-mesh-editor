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
  prev:{width:"100%",height:200,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8,cursor:"crosshair"},
  row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},
  tag:{display:"inline-block",background:T.panel,color:T.muted,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer"},
  tagOn:{display:"inline-block",background:T.teal,color:T.bg,borderRadius:3,padding:"2px 6px",fontSize:10,marginRight:4,marginBottom:4,cursor:"pointer",fontWeight:700},
};

const STYLES_T=["Traditional","Neo Traditional","Realistic","Japanese","Geometric","Tribal","Watercolor","Blackwork","Dotwork","Minimalist","Script","Biomechanical","Celtic","Maori","Floral"];
const MOTIFS=["Dragon","Phoenix","Skull","Rose","Wolf","Tiger","Eagle","Koi","Lotus","Mandala","Anchor","Compass","Samurai","Geisha","Butterfly","Snake","Raven","Lion","Bear","Fox","Medusa","Kraken","Demon","Angel","Serpent"];
const PLACEMENTS=["Full Sleeve","Half Sleeve","Chest","Back","Leg","Neck","Hand","Forearm","Calf","Rib","Shoulder","Wrist","Ankle","Behind Ear","Face"];
const COLOR_SCHEMES=["Black & Grey","Full Color","Monochrome Red","Neo Traditional","Watercolor Splash","Neon","Sepia","Minimal Black"];

function drawTattooPreview(canvas, tattoo, strokes){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.fillStyle="#2a1a0a";ctx.fillRect(0,0,w,h);
  // Skin texture
  for(let i=0;i<200;i++){
    ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,Math.random()*2,0,Math.PI*2);
    ctx.fillStyle="rgba(180,120,80,0.03)";ctx.fill();
  }

  // Draw strokes
  if(strokes.length>1){
    ctx.lineCap="round";ctx.lineJoin="round";
    const color=tattoo.inkColor||"#111111";
    const opacity=tattoo.opacity||0.9;
    ctx.strokeStyle=color.replace("#","rgba(").replace(/(..)(..)(..)$/,(_,r,g,b)=>`${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},${opacity})`)||color;
    ctx.lineWidth=tattoo.brushSize||3;
    ctx.beginPath();
    strokes.forEach((pt,i)=>i===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y));
    ctx.stroke();
  }

  // Style label
  ctx.fillStyle="rgba(0,255,200,0.6)";ctx.font="10px "+T.font;
  ctx.fillText(`${tattoo.style||"Traditional"} · ${tattoo.motif||"Dragon"}`,8,h-8);
}

function Slider({label,value,min,max,step=0.01,onChange}){
  return(
    <div>
      <label style={S.lbl}>{label}: <span style={{color:T.teal}}>{typeof value==="number"?value.toFixed(2):value}</span></label>
      <input style={S.inp} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
}

export default function TattooGeneratorPanel({scene}){
  const [style,     setStyle]    = useState("Traditional");
  const [motif,     setMotif]    = useState("Dragon");
  const [placement, setPlacement]= useState("Full Sleeve");
  const [colorScheme,setScheme]  = useState("Black & Grey");
  const [inkColor,  setInkColor] = useState("#111111");
  const [opacity,   setOpacity]  = useState(0.9);
  const [brushSize, setBrushSize]= useState(3);
  const [lineWeight,setWeight]   = useState(0.6);
  const [detailLevel,setDetail]  = useState(0.7);
  const [aging,     setAging]    = useState(0);
  const [coverage,  setCoverage] = useState(0.7);
  const [scaleX,    setScaleX]   = useState(1);
  const [scaleY,    setScaleY]   = useState(1);
  const [rotation,  setRotation] = useState(0);
  const [posX,      setPosX]     = useState(0);
  const [posY,      setPosY]     = useState(0);
  const [strokes,   setStrokes]  = useState([]);
  const [drawing,   setDrawing]  = useState(false);
  const [status,    setStatus]   = useState("");
  const prevRef = useRef(null);

  useEffect(()=>{ if(prevRef.current) drawTattooPreview(prevRef.current,{style,motif,inkColor,opacity,brushSize},strokes); },[style,motif,inkColor,opacity,brushSize,strokes]);

  const handleMouseDown=(e)=>{
    setDrawing(true);
    const rect=prevRef.current.getBoundingClientRect();
    const scl=prevRef.current.width/rect.width;
    setStrokes(s=>[...s,{x:(e.clientX-rect.left)*scl,y:(e.clientY-rect.top)*scl}]);
  };
  const handleMouseMove=(e)=>{
    if(!drawing) return;
    const rect=prevRef.current.getBoundingClientRect();
    const scl=prevRef.current.width/rect.width;
    setStrokes(s=>[...s,{x:(e.clientX-rect.left)*scl,y:(e.clientY-rect.top)*scl}]);
  };
  const handleMouseUp=()=>setDrawing(false);

  function clearCanvas(){ setStrokes([]); }

  function applyToScene(){
    if(!scene){ setStatus("No scene"); return; }
    const c=document.createElement("canvas");c.width=1024;c.height=1024;
    drawTattooPreview(c,{style,motif,inkColor,opacity,brushSize:brushSize*2},strokes.map(s=>({x:s.x*1024/400,y:s.y*1024/200})));
    const tex=new THREE.CanvasTexture(c);
    let n=0;
    scene.traverse(o=>{
      if(o.isMesh&&(o.name.toLowerCase().includes("skin")||o.userData.isSkin||o.userData.acceptsTattoo)){
        const mat=new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:0.8});
        o.material=mat;n++;
      }
    });
    setStatus(n>0?`✓ Applied tattoo to ${n} mesh(es)`:"No skin meshes found — tag meshes with userData.acceptsTattoo=true");
  }

  function exportTex(){
    const c=document.createElement("canvas");c.width=1024;c.height=1024;
    drawTattooPreview(c,{style,motif,inkColor,opacity,brushSize:brushSize*2},strokes.map(s=>({x:s.x*2.56,y:s.y*5.12})));
    const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download=`tattoo_${motif}_${style}.png`;a.click();
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🎨 TATTOO GENERATOR</div>
      <div style={S.sec}>
        <div style={S.h3}>Draw Tattoo</div>
        <canvas ref={prevRef} width={400} height={200} style={S.prev}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}/>
        <button style={{...S.btnO,fontSize:10,padding:"3px 10px"}} onClick={clearCanvas}>🗑 Clear Canvas</button>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Style & Motif</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {STYLES_T.map(s=><span key={s} style={style===s?S.tagOn:S.tag} onClick={()=>setStyle(s)}>{s}</span>)}
        </div>
        <label style={S.lbl}>Motif</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {MOTIFS.map(m=><span key={m} style={motif===m?S.tagOn:S.tag} onClick={()=>setMotif(m)}>{m}</span>)}
        </div>
        <label style={S.lbl}>Color Scheme</label>
        <select style={S.sel} value={colorScheme} onChange={e=>setScheme(e.target.value)}>
          {COLOR_SCHEMES.map(c=><option key={c}>{c}</option>)}
        </select>
        <label style={S.lbl}>Placement</label>
        <select style={S.sel} value={placement} onChange={e=>setPlacement(e.target.value)}>
          {PLACEMENTS.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Brush & Ink</div>
        <div style={S.row}>
          <div><label style={S.lbl}>Ink Color</label>
            <input type="color" value={inkColor} onChange={e=>setInkColor(e.target.value)} style={{width:"100%",height:28,borderRadius:4,border:"none",cursor:"pointer"}}/></div>
          <div><label style={S.lbl}>Brush Size: {brushSize}</label>
            <input style={S.inp} type="range" min={1} max={20} step={0.5} value={brushSize} onChange={e=>setBrushSize(Number(e.target.value))}/></div>
        </div>
        <Slider label="Opacity"      value={opacity}     min={0.1} max={1}   onChange={setOpacity}/>
        <Slider label="Line Weight"  value={lineWeight}  min={0.1} max={1}   onChange={setWeight}/>
        <Slider label="Detail Level" value={detailLevel} min={0.1} max={1}   onChange={setDetail}/>
        <Slider label="Coverage"     value={coverage}    min={0.1} max={1}   onChange={setCoverage}/>
        <Slider label="Aging/Fading" value={aging}       min={0}   max={1}   onChange={setAging}/>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Transform</div>
        <div style={S.row}>
          <Slider label="Scale X" value={scaleX} min={0.1} max={3} onChange={setScaleX}/>
          <Slider label="Scale Y" value={scaleY} min={0.1} max={3} onChange={setScaleY}/>
        </div>
        <div style={S.row}>
          <Slider label="Pos X"  value={posX}     min={-1}   max={1}   onChange={setPosX}/>
          <Slider label="Pos Y"  value={posY}     min={-1}   max={1}   onChange={setPosY}/>
        </div>
        <Slider label="Rotation" value={rotation} min={-180} max={180} step={1} onChange={setRotation}/>
      </div>
      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      <button style={S.btnO} onClick={exportTex}>💾 Export PNG</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
