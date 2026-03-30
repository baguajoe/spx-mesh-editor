
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const CREATURE_PRESETS = {
  "Dragon":       {bodyL:2.5,bodyW:.9,bodyH:.8,neckL:1.2,headSc:.9,legL:.7,legW:.25,tailL:2.2,tailCurve:.1,wingSpan:3.0,wingH:.9,hornLen:.45,hornCount:2,clawSz:.2,jawLen:.5,spineSpikes:true,color:"#8b1a1a",glowColor:"#ff4400",glow:true},
  "Drake (No Wings)":{bodyL:2.2,bodyW:.85,bodyH:.7,neckL:.9,headSc:.85,legL:.65,legW:.22,tailL:1.8,tailCurve:.08,wingSpan:0,wingH:0,hornLen:.35,hornCount:2,clawSz:.18,jawLen:.45,spineSpikes:true,color:"#2a5a22",glowColor:"#44ff44",glow:false},
  "Griffin":      {bodyL:1.8,bodyW:.7,bodyH:.65,neckL:.8,headSc:.7,legL:.65,legW:.2,tailL:.9,tailCurve:.3,wingSpan:2.5,wingH:.8,hornLen:0,hornCount:0,clawSz:.22,jawLen:.2,spineSpikes:false,color:"#c8a050",glowColor:"#ffdd00",glow:false},
  "Kaiju":        {bodyL:3.5,bodyW:1.5,bodyH:2.0,neckL:.6,headSc:1.3,legL:1.2,legW:.55,tailL:2.5,tailCurve:.05,wingSpan:0,wingH:0,hornLen:.6,hornCount:4,clawSz:.4,jawLen:.55,spineSpikes:true,color:"#1a3322",glowColor:"#00ff88",glow:true},
  "Demon Beast":  {bodyL:1.8,bodyW:.8,bodyH:.9,neckL:.5,headSc:.9,legL:.7,legW:.28,tailL:1.1,tailCurve:.2,wingSpan:2.0,wingH:.7,hornLen:.55,hornCount:2,clawSz:.25,jawLen:.4,spineSpikes:true,color:"#330000",glowColor:"#ff0000",glow:true},
  "Alien Creature":{bodyL:2.0,bodyW:.6,bodyH:.7,neckL:.7,headSc:.65,legL:.8,legW:.15,tailL:1.5,tailCurve:.3,wingSpan:0,wingH:0,hornLen:.3,hornCount:6,clawSz:.15,jawLen:.35,spineSpikes:false,color:"#224422",glowColor:"#00ffaa",glow:true},
  "Sea Monster":  {bodyL:3.0,bodyW:1.0,bodyH:.7,neckL:1.5,headSc:.8,legL:.35,legW:.3,tailL:2.8,tailCurve:.15,wingSpan:0,wingH:0,hornLen:.2,hornCount:3,clawSz:.2,jawLen:.5,spineSpikes:true,color:"#1a4a5a",glowColor:"#00aaff",glow:false},
  "Wyvern":       {bodyL:2.0,bodyW:.7,bodyH:.65,neckL:.9,headSc:.75,legL:.55,legW:.2,tailL:1.6,tailCurve:.1,wingSpan:2.8,wingH:1.0,hornLen:.3,hornCount:1,clawSz:.2,jawLen:.42,spineSpikes:false,color:"#553311",glowColor:"#ff6600",glow:false},
};

function buildCreature(scene, cfg) {
  const ms = [];
  const col = new THREE.Color(cfg.color);
  const mat = new THREE.MeshStandardMaterial({color:col, roughness:.7, metalness:.1,
    emissive: cfg.glow ? new THREE.Color(cfg.glowColor) : new THREE.Color(0), emissiveIntensity: cfg.glow?.3:0});
  const add = (geo, x, y, z, rx=0,ry=0,rz=0) => {
    const m=new THREE.Mesh(geo,mat.clone()); m.position.set(x,y,z); m.rotation.set(rx,ry,rz); m.castShadow=true; scene.add(m); ms.push(m); return m;
  };

  const baseY = cfg.legL + .15;
  // Body
  add(new THREE.BoxGeometry(cfg.bodyW, cfg.bodyH, cfg.bodyL), 0, baseY+cfg.bodyH/2, 0);
  // Neck + head
  add(new THREE.CylinderGeometry(cfg.headSc*.25, cfg.headSc*.32, cfg.neckL, 8), 0, baseY+cfg.bodyH+cfg.neckL/2, cfg.bodyL/2-.1, -.35,0,0);
  add(new THREE.BoxGeometry(cfg.headSc*.8, cfg.headSc*.65, cfg.headSc*(1+cfg.jawLen)), 0, baseY+cfg.bodyH+cfg.neckL+cfg.headSc*.28, cfg.bodyL/2+cfg.headSc*.1);
  // Lower jaw
  add(new THREE.BoxGeometry(cfg.headSc*.7, cfg.headSc*.2, cfg.headSc*cfg.jawLen*.8), 0, baseY+cfg.bodyH+cfg.neckL+cfg.headSc*.02, cfg.bodyL/2+cfg.headSc*.5+cfg.headSc*cfg.jawLen*.1);

  // Horns
  for(let h=0;h<cfg.hornCount;h++){
    const angle = cfg.hornCount>1 ? (h/(cfg.hornCount-1)-.5)*Math.PI*.6 : 0;
    const hx=Math.sin(angle)*cfg.headSc*.3, hz=Math.cos(angle)*cfg.headSc*.1;
    add(new THREE.ConeGeometry(cfg.headSc*.07, cfg.hornLen, 5), hx, baseY+cfg.bodyH+cfg.neckL+cfg.headSc*.7, cfg.bodyL/2+hz, 0,angle,.2*Math.sign(hx||1));
  }

  // 4 Legs with claws
  [[-1,1],[-1,-1],[1,1],[1,-1]].forEach(([sx,sz])=>{
    const lx=sx*cfg.bodyW/2*.75, lz=sz*cfg.bodyL/2*.6;
    add(new THREE.CylinderGeometry(cfg.legW*.9,cfg.legW*.7,cfg.legL*.55,8),lx,baseY-cfg.legL*.55/2,lz);
    add(new THREE.CylinderGeometry(cfg.legW*.7,cfg.legW*.5,cfg.legL*.45,8),lx,baseY-cfg.legL*.55-cfg.legL*.45/2,lz);
    // Claws
    for(let c=0;c<3;c++){
      const ca=(c-1)*.35;
      add(new THREE.ConeGeometry(cfg.clawSz*.2,cfg.clawSz,4),lx+Math.sin(ca)*cfg.clawSz*.5,.08,lz+Math.cos(ca)*cfg.clawSz*.5+cfg.clawSz*.3,.8,ca,0);
    }
  });

  // Tail
  let tx=0,ty=baseY+cfg.bodyH*.4,tz=-cfg.bodyL/2;
  for(let i=0;i<8;i++){
    const r=cfg.tailL/8*(1-i/8*.5);
    add(new THREE.SphereGeometry(Math.max(.03,cfg.bodyW*.22*(1-i/8*.6)),7,5),tx,ty,tz-r*.5);
    tz-=r*.85; ty+=cfg.tailCurve*r;
  }
  if(cfg.spineSpikes){
    for(let i=0;i<6;i++){
      const sz=-cfg.bodyL/2+i*(cfg.bodyL/5);
      add(new THREE.ConeGeometry(cfg.bodyW*.06,cfg.bodyH*.35+i*.02,4),0,baseY+cfg.bodyH+cfg.bodyH*.15,sz,.2,0,0);
    }
  }

  // Wings
  if(cfg.wingSpan>0){
    [-1,1].forEach(s=>{
      // Wing membrane (flat triangular shape)
      const wGeo=new THREE.BufferGeometry();
      const ws=s*cfg.wingSpan*.5, wh=cfg.wingH;
      const verts=new Float32Array([
        0,0,0, ws,wh*.3,-cfg.bodyL*.1, ws*.5,-wh*.1,-cfg.bodyL*.4,
        0,0,0, ws*.5,-wh*.1,-cfg.bodyL*.4, 0,-wh*.05,-cfg.bodyL*.3,
      ]);
      wGeo.setAttribute("position",new THREE.BufferAttribute(verts,3));
      wGeo.computeVertexNormals();
      const wm=new THREE.Mesh(wGeo,new THREE.MeshStandardMaterial({color:col,side:THREE.DoubleSide,transparent:true,opacity:.75,roughness:.6}));
      wm.position.set(s*cfg.bodyW*.45,baseY+cfg.bodyH*.6,cfg.bodyL*.1);
      scene.add(wm); ms.push(wm);
      // Wing arm bone
      add(new THREE.CylinderGeometry(.04,.06,cfg.wingSpan*.5,6),s*cfg.bodyW*.3+s*cfg.wingSpan*.25,baseY+cfg.bodyH*.7,0,0,0,Math.PI/2);
    });
  }

  // Lights
  if(!scene.getObjectByName("cre_amb")){
    const a=new THREE.AmbientLight(0xffffff,.6);a.name="cre_amb";scene.add(a);ms.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1.1);d.position.set(20,40,20);d.castShadow=true;scene.add(d);ms.push(d);
    if(cfg.glow){const pl=new THREE.PointLight(new THREE.Color(cfg.glowColor),.8,8);pl.position.set(0,baseY+cfg.bodyH+cfg.neckL,cfg.bodyL/2+cfg.headSc*.5);scene.add(pl);ms.push(pl);}
  }

  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0x0a0a14}));
  gnd.rotation.x=-Math.PI/2; scene.add(gnd); ms.push(gnd);
  return ms;
}

const CTRL=[
  {id:"bodyL",lbl:"Body Length",min:.5,max:5,step:.01},{id:"bodyW",lbl:"Body Width",min:.2,max:2.5,step:.01},
  {id:"bodyH",lbl:"Body Height",min:.2,max:3,step:.01},{id:"neckL",lbl:"Neck Length",min:.1,max:2,step:.01},
  {id:"headSc",lbl:"Head Scale",min:.2,max:1.8,step:.01},{id:"legL",lbl:"Leg Length",min:.1,max:2,step:.01},
  {id:"legW",lbl:"Leg Width",min:.05,max:.7,step:.01},{id:"tailL",lbl:"Tail Length",min:0,max:3.5,step:.01},
  {id:"tailCurve",lbl:"Tail Curve",min:0,max:.5,step:.01},{id:"wingSpan",lbl:"Wing Span",min:0,max:5,step:.05},
  {id:"wingH",lbl:"Wing Height",min:0,max:2,step:.01},{id:"hornLen",lbl:"Horn Length",min:0,max:1.2,step:.01},
  {id:"hornCount",lbl:"Horn Count",min:0,max:8,step:1},{id:"clawSz",lbl:"Claw Size",min:.05,max:.6,step:.01},
  {id:"jawLen",lbl:"Jaw Length",min:.1,max:1,step:.01},
];

export default function CreatureGeneratorPanel({ scene }) {
  const [preset, setPreset] = useState("Dragon");
  const [cfg, setCfg]       = useState({ ...CREATURE_PRESETS["Dragon"] });
  const [color, setColor]   = useState("#8b1a1a");
  const [glowColor, setGlowColor] = useState("#ff4400");
  const [glow, setGlow]     = useState(true);
  const [spines, setSpines] = useState(true);
  const [status, setStatus] = useState("");
  const meshes = useRef([]);

  function loadPreset(p){ setPreset(p); const pr=CREATURE_PRESETS[p]; setCfg({...pr}); setColor(pr.color); setGlowColor(pr.glowColor||"#ff4400"); setGlow(pr.glow||false); setSpines(pr.spineSpikes||false); }
  function clear(){ meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();}); meshes.current=[]; setStatus(""); }
  function generate(){
    if(!scene){setStatus("No scene");return;}
    clear();
    const ms=buildCreature(scene,{...cfg,color,glowColor,glow,spineSpikes:spines});
    meshes.current=ms;
    setStatus(`✓ ${preset} built — ${ms.filter(m=>m.isMesh).length} parts`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🐉 CREATURE GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Creature Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(CREATURE_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <div style={{display:"flex",gap:12,marginBottom:8}}>
          <div><label style={S.lbl}>Body Color</label><input style={{...S.inp,padding:2,height:32,width:60}} type="color" value={color} onChange={e=>setColor(e.target.value)}/></div>
          <div><label style={S.lbl}>Glow Color</label><input style={{...S.inp,padding:2,height:32,width:60}} type="color" value={glowColor} onChange={e=>setGlowColor(e.target.value)}/></div>
        </div>
        <label style={S.lbl}><input type="checkbox" checked={glow} onChange={e=>setGlow(e.target.checked)}/> Bioluminescent Glow</label>
        <label style={S.lbl}><input type="checkbox" checked={spines} onChange={e=>setSpines(e.target.checked)}/> Spine Spikes</label>
      </div>
      <div style={S.sec}>
        {CTRL.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {typeof cfg[c.id]==="number"?cfg[c.id].toFixed(c.step<.1?2:0):""}</label>
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
