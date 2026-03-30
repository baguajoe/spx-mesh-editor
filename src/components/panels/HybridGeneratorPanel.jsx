
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const HYBRID_PRESETS = {
  "Werewolf":       {humanRatio:.45,creatureType:"Wolf",height:2.1,shoulderW:.55,headMix:.7,handMix:.8,legMix:.75,tailLen:.8,tailCurve:.2,hornLen:0,wingSpan:0,clawSz:.22,furAmt:.85,scaleAmt:0,color:"#5a3a22",glowColor:"#ff4400",glow:false},
  "Dragon Humanoid":{humanRatio:.55,creatureType:"Dragon",height:2.2,shoulderW:.5,headMix:.6,handMix:.5,legMix:.55,tailLen:1.4,tailCurve:.08,hornLen:.4,wingSpan:1.8,clawSz:.2,furAmt:0,scaleAmt:.9,color:"#8b1a1a",glowColor:"#ff4400",glow:true},
  "Demon Beast":    {humanRatio:.6,creatureType:"Demon",height:2.3,shoulderW:.58,headMix:.65,handMix:.55,legMix:.5,tailLen:.9,tailCurve:.15,hornLen:.5,wingSpan:1.5,clawSz:.18,furAmt:.2,scaleAmt:.4,color:"#330000",glowColor:"#ff0000",glow:true},
  "Lizard Man":     {humanRatio:.65,creatureType:"Reptile",height:1.9,shoulderW:.44,headMix:.55,handMix:.45,legMix:.45,tailLen:1.0,tailCurve:.06,hornLen:.15,wingSpan:0,clawSz:.16,furAmt:0,scaleAmt:.95,color:"#2a5a22",glowColor:"#44ff44",glow:false},
  "Minotaur":       {humanRatio:.5,creatureType:"Bull",height:2.5,shoulderW:.7,headMix:.8,handMix:.3,legMix:.6,tailLen:.6,tailCurve:.1,hornLen:.7,wingSpan:0,clawSz:.12,furAmt:.5,scaleAmt:0,color:"#5c3a18",glowColor:"#ff6600",glow:false},
  "Vampire Lord":   {humanRatio:.82,creatureType:"Bat",height:1.95,shoulderW:.44,headMix:.3,handMix:.2,legMix:.15,tailLen:0,tailCurve:0,hornLen:.05,wingSpan:2.2,clawSz:.12,furAmt:0,scaleAmt:0,color:"#1a0a0a",glowColor:"#ff0033",glow:true},
  "Harpy":          {humanRatio:.6,creatureType:"Bird",height:1.8,shoulderW:.42,headMix:.35,handMix:.9,legMix:.55,tailLen:.5,tailCurve:.2,hornLen:0,wingSpan:2.5,clawSz:.2,furAmt:0,scaleAmt:.2,color:"#aa8833",glowColor:"#ffdd00",glow:false},
  "Naga":           {humanRatio:.55,creatureType:"Serpent",height:2.0,shoulderW:.4,headMix:.5,handMix:.3,legMix:.0,tailLen:2.5,tailCurve:.1,hornLen:.1,wingSpan:0,clawSz:.1,furAmt:0,scaleAmt:.9,color:"#1a5a3a",glowColor:"#00ffaa",glow:false},
};

function buildHybrid(scene, cfg) {
  const ms=[];
  const col=new THREE.Color(cfg.color);
  const mat=new THREE.MeshStandardMaterial({color:col,roughness:.65,metalness:.1,
    emissive:cfg.glow?new THREE.Color(cfg.glowColor):new THREE.Color(0),emissiveIntensity:cfg.glow?.35:0});
  const add=(geo,x,y,z,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,mat.clone());m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;scene.add(m);ms.push(m);return m;
  };
  const h=cfg.height, hr=cfg.humanRatio;
  const headH=h/7.5, sw=cfg.shoulderW;

  // More human = taller upright torso
  const torsoH=headH*2.2, hipH=headH*.6;
  const legH=cfg.legMix>0.3 ? h*.38*(1+cfg.legMix*.3) : h*.3;
  const baseY=legH+.1;

  // Head (mix of human and creature)
  const hsx=1+cfg.headMix*.3, hsy=1-cfg.headMix*.15, hsz=1+cfg.headMix*.2;
  add(new THREE.BoxGeometry(headH*.8*hsx,headH*.85*hsy,headH*.9*hsz),0,baseY+torsoH+hipH+headH*.4,0);
  // Horns
  if(cfg.hornLen>.05){
    [-1,1].forEach(s=>add(new THREE.ConeGeometry(headH*.08,cfg.hornLen,4),s*headH*.25,baseY+torsoH+hipH+headH*.85,0,0,0,s*.3));
  }
  // Neck
  add(new THREE.CylinderGeometry(headH*.2,headH*.25,headH*.4,8),0,baseY+torsoH+hipH+headH*.15,0);
  // Torso
  add(new THREE.BoxGeometry(sw*2,torsoH,headH*.75),0,baseY+torsoH/2,0);
  // Hips
  add(new THREE.BoxGeometry(sw*1.6,hipH,headH*.65),0,baseY+torsoH+hipH/2-torsoH+torsoH/2,0);

  // Arms — more creature = claws/wings
  [-1,1].forEach(s=>{
    const ax=s*(sw+headH*.15), ay=baseY+torsoH*.78;
    const armW=headH*(cfg.handMix>.5?.28:.2);
    add(new THREE.CylinderGeometry(armW,armW*.85,headH*1.3,8),ax,ay,0);
    add(new THREE.CylinderGeometry(armW*.8,armW*.6,headH*1.1,8),ax,ay-headH*1.3,0);
    // Claws or hands
    if(cfg.clawSz>.1){
      for(let c=0;c<3;c++){const ca=(c-1)*.3; add(new THREE.ConeGeometry(cfg.clawSz*.15,cfg.clawSz*.7,4),ax+Math.sin(ca)*cfg.clawSz*.3,ay-headH*2.5,Math.cos(ca)*cfg.clawSz*.2,.8,ca,0);}
    } else {
      add(new THREE.BoxGeometry(headH*.3,headH*.38,headH*.18),ax,ay-headH*2.55,0);
    }
  });

  // Legs — mix determines shape
  const hipY=baseY;
  [-1,1].forEach(s=>{
    const lx=s*sw*.55;
    if(cfg.legMix<.3){
      // Normal human legs
      add(new THREE.CylinderGeometry(headH*.28,headH*.24,legH*.5,8),lx,hipY-legH*.25,0);
      add(new THREE.CylinderGeometry(headH*.22,headH*.18,legH*.5,8),lx,hipY-legH*.75,0);
      add(new THREE.BoxGeometry(headH*.38,.12,headH*.55),lx,.06,headH*.12);
    } else {
      // Creature digitigrade legs
      add(new THREE.CylinderGeometry(headH*.3,headH*.25,legH*.4,8),lx,hipY-legH*.2,0);
      add(new THREE.CylinderGeometry(headH*.22,headH*.18,legH*.35,8),lx,hipY-legH*.55,.15,-.4,0,0);
      add(new THREE.CylinderGeometry(headH*.18,headH*.14,legH*.25,8),lx,hipY-legH*.85,.3,.5,0,0);
      add(new THREE.BoxGeometry(headH*.35,.1,headH*.5*(1+cfg.legMix)),lx,.05,headH*.15);
    }
  });

  // Tail
  if(cfg.tailLen>.1){
    let tx=0,ty=baseY-.1,tz=-.3;
    for(let i=0;i<7;i++){
      const r=cfg.tailLen/7*(1-i/7*.4);
      add(new THREE.SphereGeometry(Math.max(.03,sw*.18*(1-i/7*.5)),6,4),tx,ty,tz-r*.5);
      tz-=r*.8; ty+=cfg.tailCurve*r;
    }
  }

  // Wings
  if(cfg.wingSpan>.1){
    [-1,1].forEach(s=>{
      const ws=s*cfg.wingSpan*.5;
      const wGeo=new THREE.BufferGeometry();
      const verts=new Float32Array([0,0,0, ws,.3*cfg.wingSpan*.2,-.1, ws*.4,-.1,-.5, 0,0,0, ws*.4,-.1,-.5, 0,-.05,-.4]);
      wGeo.setAttribute("position",new THREE.BufferAttribute(verts,3));
      wGeo.computeVertexNormals();
      const wm=new THREE.Mesh(wGeo,new THREE.MeshStandardMaterial({color:col,side:THREE.DoubleSide,transparent:true,opacity:.7}));
      wm.position.set(s*sw*.4,baseY+torsoH*.7,0);
      scene.add(wm);ms.push(wm);
    });
  }

  // Ground + lights
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshStandardMaterial({color:0x0a0a14}));
  gnd.rotation.x=-Math.PI/2;scene.add(gnd);ms.push(gnd);
  if(!scene.getObjectByName("hyb_amb")){
    const a=new THREE.AmbientLight(0xffffff,.65);a.name="hyb_amb";scene.add(a);ms.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1.1);d.position.set(20,35,15);d.castShadow=true;scene.add(d);ms.push(d);
    if(cfg.glow){const pl=new THREE.PointLight(new THREE.Color(cfg.glowColor),.7,6);pl.position.set(0,baseY+torsoH+headH,.3);scene.add(pl);ms.push(pl);}
  }
  return ms;
}

const CTRL=[
  {id:"humanRatio",lbl:"Human ↔ Creature",min:0,max:1,step:.01},
  {id:"height",lbl:"Height",min:.8,max:3.5,step:.01},
  {id:"shoulderW",lbl:"Shoulder Width",min:.2,max:.9,step:.01},
  {id:"headMix",lbl:"Head Creature Mix",min:0,max:1,step:.01},
  {id:"handMix",lbl:"Hand Creature Mix",min:0,max:1,step:.01},
  {id:"legMix",lbl:"Leg Creature Mix",min:0,max:1,step:.01},
  {id:"tailLen",lbl:"Tail Length",min:0,max:3,step:.01},
  {id:"tailCurve",lbl:"Tail Curve",min:0,max:.5,step:.01},
  {id:"hornLen",lbl:"Horn Length",min:0,max:1,step:.01},
  {id:"wingSpan",lbl:"Wing Span",min:0,max:4,step:.05},
  {id:"clawSz",lbl:"Claw Size",min:0,max:.5,step:.01},
  {id:"furAmt",lbl:"Fur Amount",min:0,max:1,step:.01},
  {id:"scaleAmt",lbl:"Scale Amount",min:0,max:1,step:.01},
];

export default function HybridGeneratorPanel({ scene }) {
  const [preset,setPreset]=useState("Werewolf");
  const [cfg,setCfg]=useState({...HYBRID_PRESETS["Werewolf"]});
  const [color,setColor]=useState("#5a3a22");
  const [glowColor,setGlowColor]=useState("#ff4400");
  const [glow,setGlow]=useState(false);
  const [status,setStatus]=useState("");
  const meshes=useRef([]);

  function loadPreset(p){setPreset(p);const pr=HYBRID_PRESETS[p];setCfg({...pr});setColor(pr.color);setGlowColor(pr.glowColor||"#ff4400");setGlow(pr.glow||false);}
  function clear(){meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();});meshes.current=[];setStatus("");}
  function generate(){
    if(!scene){setStatus("No scene");return;}
    clear();
    const ms=buildHybrid(scene,{...cfg,color,glowColor,glow});
    meshes.current=ms;
    setStatus(`✓ ${preset} built — ${ms.filter(m=>m.isMesh).length} parts`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🧬 HYBRID GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Hybrid Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(HYBRID_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <div style={{display:"flex",gap:12,marginBottom:8}}>
          <div><label style={S.lbl}>Body Color</label><input style={{...S.inp,padding:2,height:32,width:60}} type="color" value={color} onChange={e=>setColor(e.target.value)}/></div>
          <div><label style={S.lbl}>Glow Color</label><input style={{...S.inp,padding:2,height:32,width:60}} type="color" value={glowColor} onChange={e=>setGlowColor(e.target.value)}/></div>
        </div>
        <label style={S.lbl}><input type="checkbox" checked={glow} onChange={e=>setGlow(e.target.checked)}/> Bioluminescent Glow</label>
      </div>
      <div style={S.sec}>
        {CTRL.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {cfg[c.id]?.toFixed(2)}</label>
            <input style={S.inp} type="range" min={c.min} max={c.max} step={c.step} value={cfg[c.id]||0} onChange={e=>setCfg(p=>({...p,[c.id]:+e.target.value}))}/>
          </div>
        ))}
      </div>
      <button style={S.btn} onClick={generate}>⚡ Generate</button>
      <button style={S.btnO} onClick={clear}>🗑 Clear</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
