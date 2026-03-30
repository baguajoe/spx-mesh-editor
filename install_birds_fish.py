#!/usr/bin/env python3
# Birds + Fish generators — standalone panels
# python3 install_birds_fish.py && npm run build && git add -A && git commit -m "feat: Bird Generator + Fish Generator" && git push
import os

REPO = "/workspaces/spx-mesh-editor"
P    = f"{REPO}/src/components/panels"
os.makedirs(P, exist_ok=True)

FILES = {}

# ── BIRD GENERATOR ─────────────────────────────────────────
FILES[f"{P}/BirdGeneratorPanel.jsx"] = r"""
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const BIRD_PRESETS = {
  "Eagle/Hawk":    {bodyL:.9,bodyW:.28,bodyH:.32,neckL:.22,headSc:.38,wingSpan:2.2,wingDepth:.55,wingCurve:.3,tailL:.45,tailFan:.5,legL:.35,legW:.06,talonSz:.1,beakL:.18,beakCurve:.5,crestH:0,color:"#553311",wingColor:"#3a2208",bellyColor:"#ccaa88",eyeColor:"#ffaa00"},
  "Owl":           {bodyL:.7,bodyW:.32,bodyH:.38,neckL:.1,headSc:.52,wingSpan:1.5,wingDepth:.5,wingCurve:.2,tailL:.3,tailFan:.3,legL:.22,legW:.07,talonSz:.12,beakL:.08,beakCurve:.8,crestH:.1,color:"#8a7050",wingColor:"#6a5030",bellyColor:"#ddccaa",eyeColor:"#ff8800"},
  "Parrot":        {bodyL:.45,bodyW:.18,bodyH:.22,neckL:.12,headSc:.32,wingSpan:.9,wingDepth:.4,wingCurve:.25,tailL:.55,tailFan:.15,legL:.18,legW:.04,talonSz:.07,beakL:.1,beakCurve:.9,crestH:0,color:"#228822",wingColor:"#1a6618",bellyColor:"#88cc22",eyeColor:"#ffff00"},
  "Flamingo":      {bodyL:.6,bodyW:.18,bodyH:.25,neckL:.7,headSc:.28,wingSpan:1.4,wingDepth:.45,wingCurve:.15,tailL:.25,tailFan:.2,legL:.9,legW:.03,talonSz:.06,beakL:.14,beakCurve:.7,crestH:0,color:"#ffaaaa",wingColor:"#ff8888",bellyColor:"#ffcccc",eyeColor:"#ffff44"},
  "Penguin":       {bodyL:.55,bodyW:.28,bodyH:.45,neckL:.12,headSc:.38,wingSpan:.7,wingDepth:.2,wingCurve:.05,tailL:.1,tailFan:.1,legL:.18,legW:.08,talonSz:.1,beakL:.12,beakCurve:.1,crestH:0,color:"#111111",wingColor:"#111111",bellyColor:"#eeeeee",eyeColor:"#ffffff"},
  "Hummingbird":   {bodyL:.12,bodyW:.06,bodyH:.08,neckL:.05,headSc:.1,wingSpan:.22,wingDepth:.15,wingCurve:.4,tailL:.1,tailFan:.2,legL:.04,legW:.01,talonSz:.02,beakL:.12,beakCurve:.05,crestH:0,color:"#226622",wingColor:"#44aa44",bellyColor:"#ffaa44",eyeColor:"#000000"},
  "Pelican":       {bodyL:.9,bodyW:.35,bodyH:.38,neckL:.38,headSc:.45,wingSpan:2.5,wingDepth:.6,wingCurve:.2,tailL:.3,tailFan:.3,legL:.28,legW:.09,talonSz:.12,beakL:.38,beakCurve:.15,crestH:0,color:"#ddddcc",wingColor:"#bbbbaa",bellyColor:"#ffffff",eyeColor:"#ff4400"},
  "Ostrich":       {bodyL:1.1,bodyW:.5,bodyH:.7,neckL:1.1,headSc:.35,wingSpan:1.0,wingDepth:.3,wingCurve:.1,tailL:.5,tailFan:.6,legL:1.2,legW:.14,talonSz:.16,beakL:.16,beakCurve:.15,crestH:0,color:"#3a2208",wingColor:"#888888",bellyColor:"#cccccc",eyeColor:"#662200"},
  "Peacock":       {bodyL:.8,bodyW:.28,bodyH:.38,neckL:.38,headSc:.35,wingSpan:1.6,wingDepth:.5,wingCurve:.2,tailL:1.4,tailFan:.95,legL:.42,legW:.06,talonSz:.09,beakL:.1,beakCurve:.2,crestH:.2,color:"#224488",wingColor:"#1a3366",bellyColor:"#2255aa",eyeColor:"#00ffff"},
  "Toucan":        {bodyL:.55,bodyW:.2,bodyH:.28,neckL:.15,headSc:.38,wingSpan:1.0,wingDepth:.38,wingCurve:.2,tailL:.38,tailFan:.2,legL:.2,legW:.05,talonSz:.08,beakL:.32,beakCurve:.25,crestH:0,color:"#111111",wingColor:"#111111",bellyColor:"#ffff00",eyeColor:"#00ffff"},
  "Phoenix":       {bodyL:.9,bodyW:.32,bodyH:.38,neckL:.35,headSc:.42,wingSpan:2.5,wingDepth:.7,wingCurve:.4,tailL:1.8,tailFan:.9,legL:.4,legW:.08,talonSz:.14,beakL:.16,beakCurve:.4,crestH:.28,color:"#cc4400",wingColor:"#ff2200",bellyColor:"#ffaa00",eyeColor:"#ffff00"},
  "Raven/Crow":    {bodyL:.55,bodyW:.2,bodyH:.25,neckL:.18,headSc:.32,wingSpan:1.1,wingDepth:.42,wingCurve:.25,tailL:.35,tailFan:.25,legL:.2,legW:.04,talonSz:.07,beakL:.14,beakCurve:.2,crestH:0,color:"#111111",wingColor:"#0a0a0a",bellyColor:"#1a1a1a",eyeColor:"#222222"},
};

function buildBird(scene, cfg) {
  const ms = [];
  const bodyMat  = new THREE.MeshStandardMaterial({color:new THREE.Color(cfg.color),   roughness:.85});
  const wingMat  = new THREE.MeshStandardMaterial({color:new THREE.Color(cfg.wingColor),roughness:.85,side:THREE.DoubleSide});
  const bellyMat = new THREE.MeshStandardMaterial({color:new THREE.Color(cfg.bellyColor),roughness:.8});
  const eyeMat   = new THREE.MeshStandardMaterial({color:new THREE.Color(cfg.eyeColor), roughness:.05,metalness:.3});

  const add = (geo,x,y,z,rx=0,ry=0,rz=0,mat=bodyMat)=>{
    const m=new THREE.Mesh(geo,mat.clone());
    m.position.set(x,y,z);m.rotation.set(rx,ry,rz);
    m.castShadow=true;scene.add(m);ms.push(m);return m;
  };

  const baseY = cfg.legL + .08;
  const bL=cfg.bodyL,bW=cfg.bodyW,bH=cfg.bodyH;

  // Body — slightly egg-shaped using scaled sphere
  const bodyGeo = new THREE.SphereGeometry(.5,12,8);
  const body = new THREE.Mesh(bodyGeo, bodyMat.clone());
  body.scale.set(bW,bH,bL);
  body.position.set(0,baseY+bH/2,0);
  body.castShadow=true; scene.add(body); ms.push(body);

  // Belly patch
  const belGeo = new THREE.SphereGeometry(.45,10,7);
  const bel = new THREE.Mesh(belGeo, bellyMat.clone());
  bel.scale.set(bW*.7,bH*.65,bL*.6);
  bel.position.set(0,baseY+bH*.3,bL*.15);
  scene.add(bel); ms.push(bel);

  // Neck
  if(cfg.neckL>.05){
    add(new THREE.CylinderGeometry(cfg.headSc*.25,cfg.headSc*.3,cfg.neckL,8),0,baseY+bH+cfg.neckL/2,bL/2*.6,-.25,0,0);
  }

  // Head
  const headGeo = new THREE.SphereGeometry(cfg.headSc,10,8);
  const head = new THREE.Mesh(headGeo,bodyMat.clone());
  head.position.set(0,baseY+bH+cfg.neckL+cfg.headSc*.85,bL/2*.5);
  scene.add(head); ms.push(head);

  // Crest
  if(cfg.crestH>.02){
    for(let i=0;i<4;i++){
      const cx=(i-1.5)*.06;
      add(new THREE.ConeGeometry(cfg.headSc*.08,cfg.crestH+i*.03,4),cx,baseY+bH+cfg.neckL+cfg.headSc*1.7+i*.02,bL/2*.5,-.2,0,.1*(i-1.5));
    }
  }

  // Beak
  const beakGeo = new THREE.CylinderGeometry(cfg.headSc*.06,cfg.headSc*.12,cfg.beakL,6);
  const beak = new THREE.Mesh(beakGeo,new THREE.MeshStandardMaterial({color:0xddaa44,roughness:.6}));
  beak.rotation.x = .5*Math.PI + cfg.beakCurve*.4;
  beak.position.set(0,baseY+bH+cfg.neckL+cfg.headSc*.8,bL/2*.5+cfg.headSc+cfg.beakL*.4);
  scene.add(beak); ms.push(beak);

  // Lower beak (pouch for pelican etc)
  if(cfg.beakL>.2){
    const lbGeo = new THREE.CylinderGeometry(cfg.headSc*.05,cfg.headSc*.14,cfg.beakL*.8,6);
    const lb=new THREE.Mesh(lbGeo,new THREE.MeshStandardMaterial({color:0xcc8833,roughness:.7,transparent:true,opacity:.8}));
    lb.rotation.x=.5*Math.PI+cfg.beakCurve*.2+.1;
    lb.position.set(0,baseY+bH+cfg.neckL+cfg.headSc*.65,bL/2*.5+cfg.headSc+cfg.beakL*.35);
    scene.add(lb); ms.push(lb);
  }

  // Eyes
  [-1,1].forEach(s=>{
    add(new THREE.SphereGeometry(cfg.headSc*.18,7,5),s*cfg.headSc*.6,baseY+bH+cfg.neckL+cfg.headSc*.95,bL/2*.5+cfg.headSc*.6,0,0,0,eyeMat);
    add(new THREE.SphereGeometry(cfg.headSc*.09,5,4),s*cfg.headSc*.65,baseY+bH+cfg.neckL+cfg.headSc*.95,bL/2*.5+cfg.headSc*.75,0,0,0,new THREE.MeshStandardMaterial({color:0x000000}));
  });

  // Wings
  [-1,1].forEach(s=>{
    const ws=s*cfg.wingSpan*.5;
    const wd=cfg.wingDepth;
    const curve=cfg.wingCurve;

    // Primary feathers — triangular wing membrane
    const wGeo=new THREE.BufferGeometry();
    const verts=new Float32Array([
      0,0,0,
      ws,curve*wd*.4,-bL*.05,
      ws*.7,wd*.3,-bL*.35,
      0,0,0,
      ws*.7,wd*.3,-bL*.35,
      ws*.25,-wd*.1,-bL*.38,
      0,0,0,
      ws*.25,-wd*.1,-bL*.38,
      0,-wd*.05,-bL*.22,
    ]);
    wGeo.setAttribute("position",new THREE.BufferAttribute(verts,3));
    wGeo.computeVertexNormals();
    const wm=new THREE.Mesh(wGeo,wingMat.clone());
    wm.position.set(s*bW*.45,baseY+bH*.55,0);
    scene.add(wm); ms.push(wm);

    // Wing arm bone
    add(new THREE.CylinderGeometry(.025,.04,cfg.wingSpan*.35,5),
      s*bW*.3+s*cfg.wingSpan*.18,baseY+bH*.65,0,0,0,Math.PI/2);
  });

  // Tail feathers
  if(cfg.tailL>.05){
    const fanAmt=cfg.tailFan;
    const fanCount=Math.max(3,Math.round(fanAmt*9));
    for(let i=0;i<fanCount;i++){
      const angle=(i/(fanCount-1)-.5)*fanAmt*1.2;
      const tGeo=new THREE.BufferGeometry();
      const tl=cfg.tailL, tw=tl*.15;
      const verts=new Float32Array([0,0,0, Math.sin(angle)*tw,tl*.3*fanAmt,-tl*.4, 0,tl*.1,-tl, -Math.sin(angle)*tw,tl*.3*fanAmt,-tl*.4]);
      tGeo.setAttribute("position",new THREE.BufferAttribute(verts,3));
      tGeo.setIndex([0,1,2, 0,2,3]);
      tGeo.computeVertexNormals();
      const tm=new THREE.Mesh(tGeo,wingMat.clone());
      tm.position.set(0,baseY+bH*.3,-bL/2);
      scene.add(tm); ms.push(tm);
    }
  }

  // Legs + feet
  [-1,1].forEach(s=>{
    const lx=s*bW*.25;
    add(new THREE.CylinderGeometry(cfg.legW*.9,cfg.legW*.7,cfg.legL*.55,6),lx,baseY-cfg.legL*.28,0);
    add(new THREE.CylinderGeometry(cfg.legW*.7,cfg.legW*.5,cfg.legL*.45,6),lx,baseY-cfg.legL*.72,bL*.05,.35,0,0);
    // Talons / toes
    for(let t=0;t<3;t++){
      const ta=(t-1)*.5;
      add(new THREE.ConeGeometry(cfg.talonSz*.18,cfg.talonSz*.7,4),
        lx+Math.sin(ta)*cfg.talonSz*.35,.04,Math.cos(ta)*cfg.talonSz*.5+cfg.talonSz*.2,.8,ta,0,
        new THREE.MeshStandardMaterial({color:0x332211,roughness:.7}));
    }
  });

  // Ground + lights
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(15,15),new THREE.MeshStandardMaterial({color:0x0a0a14}));
  gnd.rotation.x=-Math.PI/2; scene.add(gnd); ms.push(gnd);
  if(!scene.getObjectByName("bird_amb")){
    const a=new THREE.AmbientLight(0xffffff,.7);a.name="bird_amb";scene.add(a);ms.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1.1);d.position.set(15,25,10);d.castShadow=true;scene.add(d);ms.push(d);
  }
  return ms;
}

const CTRL=[
  {id:"bodyL",lbl:"Body Length",min:.05,max:1.5,step:.01},
  {id:"bodyW",lbl:"Body Width",min:.03,max:.8,step:.01},
  {id:"bodyH",lbl:"Body Height",min:.03,max:.9,step:.01},
  {id:"neckL",lbl:"Neck Length",min:0,max:1.5,step:.01},
  {id:"headSc",lbl:"Head Scale",min:.06,max:.7,step:.01},
  {id:"wingSpan",lbl:"Wing Span",min:.1,max:4,step:.01},
  {id:"wingDepth",lbl:"Wing Depth",min:.1,max:1,step:.01},
  {id:"wingCurve",lbl:"Wing Curve",min:0,max:.8,step:.01},
  {id:"tailL",lbl:"Tail Length",min:0,max:2,step:.01},
  {id:"tailFan",lbl:"Tail Fan",min:0,max:1,step:.01},
  {id:"legL",lbl:"Leg Length",min:.02,max:1.5,step:.01},
  {id:"legW",lbl:"Leg Width",min:.01,max:.2,step:.01},
  {id:"talonSz",lbl:"Talon Size",min:.01,max:.3,step:.01},
  {id:"beakL",lbl:"Beak Length",min:.03,max:.5,step:.01},
  {id:"beakCurve",lbl:"Beak Curve",min:0,max:1,step:.01},
  {id:"crestH",lbl:"Crest Height",min:0,max:.4,step:.01},
];

export default function BirdGeneratorPanel({ scene }) {
  const [preset,setPreset] = useState("Eagle/Hawk");
  const [cfg,setCfg]       = useState({...BIRD_PRESETS["Eagle/Hawk"]});
  const [colors,setColors] = useState({color:"#553311",wingColor:"#3a2208",bellyColor:"#ccaa88",eyeColor:"#ffaa00"});
  const [status,setStatus] = useState("");
  const meshes = useRef([]);

  function loadPreset(p){ setPreset(p); const pr=BIRD_PRESETS[p]; setCfg({...pr}); setColors({color:pr.color,wingColor:pr.wingColor,bellyColor:pr.bellyColor,eyeColor:pr.eyeColor}); }
  function clear(){ meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();}); meshes.current=[]; setStatus(""); }
  function generate(){
    if(!scene){setStatus("No scene");return;}
    clear();
    const ms=buildBird(scene,{...cfg,...colors});
    meshes.current=ms;
    setStatus(`✓ ${preset} built — ${ms.filter(m=>m.isMesh).length} parts`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🦅 BIRD GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Bird Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(BIRD_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
          {[["color","Body"],["wingColor","Wing"],["bellyColor","Belly"],["eyeColor","Eye"]].map(([k,lbl])=>(
            <div key={k}><label style={{...S.lbl,fontSize:9}}>{lbl}</label>
            <input type="color" value={colors[k]} onChange={e=>setColors(c=>({...c,[k]:e.target.value}))} style={{width:40,height:28,border:"none",background:"none",cursor:"pointer"}}/></div>
          ))}
        </div>
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
"""

# ── FISH GENERATOR ─────────────────────────────────────────
FILES[f"{P}/FishGeneratorPanel.jsx"] = r"""
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const FISH_PRESETS = {
  "Tropical Fish":    {bodyL:.45,bodyW:.1,bodyH:.4,headSc:.32,tailL:.25,tailFan:.7,dorsalH:.3,dorsalL:.35,pectoralSz:.18,pelvicSz:.1,analFinH:.15,jawL:.08,jawGape:.2,mouthPos:.5,eyeSz:.1,spines:false,barbels:false,color:"#ff8800",stripeColor:"#ffffff",finColor:"#ff4400",eyeColor:"#000000",transparent:false,biolum:false},
  "Shark":            {bodyL:2.0,bodyW:.35,bodyH:.4,headSc:.55,tailL:.7,tailFan:.4,dorsalH:.45,dorsalL:.4,pectoralSz:.55,pelvicSz:.22,analFinH:.12,jawL:.28,jawGape:.6,mouthPos:.3,eyeSz:.1,spines:false,barbels:false,color:"#778899",stripeColor:"#445566",finColor:"#556677",eyeColor:"#1a1a1a",transparent:false,biolum:false},
  "Clownfish":        {bodyL:.18,bodyW:.06,bodyH:.18,headSc:.16,tailL:.1,tailFan:.55,dorsalH:.18,dorsalL:.2,pectoralSz:.1,pelvicSz:.06,analFinH:.1,jawL:.04,jawGape:.15,mouthPos:.55,eyeSz:.08,spines:true,barbels:false,color:"#ff5500",stripeColor:"#ffffff",finColor:"#ff3300",eyeColor:"#000000",transparent:false,biolum:false},
  "Anglerfish":       {bodyL:.5,bodyW:.22,bodyH:.45,headSc:.52,tailL:.18,tailFan:.35,dorsalH:.15,dorsalL:.25,pectoralSz:.25,pelvicSz:.12,analFinH:.12,jawL:.35,jawGape:.8,mouthPos:.35,eyeSz:.12,spines:false,barbels:true,color:"#3a2a1a",stripeColor:"#220a00",finColor:"#552a00",eyeColor:"#ffaa00",transparent:false,biolum:true},
  "Betta/Siamese":    {bodyL:.22,bodyW:.06,bodyH:.2,headSc:.18,tailL:.35,tailFan:.9,dorsalH:.35,dorsalL:.3,pectoralSz:.12,pelvicSz:.18,analFinH:.3,jawL:.06,jawGape:.25,mouthPos:.55,eyeSz:.08,spines:false,barbels:false,color:"#2244cc",stripeColor:"#cc2244",finColor:"#8844ff",eyeColor:"#ff4400",transparent:false,biolum:false},
  "Pufferfish":       {bodyL:.3,bodyW:.28,bodyH:.28,headSc:.38,tailL:.12,tailFan:.3,dorsalH:.12,dorsalL:.2,pectoralSz:.12,pelvicSz:.0,analFinH:.1,jawL:.08,jawGape:.1,mouthPos:.6,eyeSz:.14,spines:true,barbels:false,color:"#cc8822",stripeColor:"#884400",finColor:"#aa6600",eyeColor:"#000000",transparent:false,biolum:false},
  "Manta Ray":        {bodyL:.5,bodyW:2.0,bodyH:.15,headSc:.3,tailL:1.2,tailFan:.05,dorsalH:.08,dorsalL:.15,pectoralSz:0,pelvicSz:0,analFinH:0,jawL:.12,jawGape:.4,mouthPos:.45,eyeSz:.07,spines:false,barbels:false,color:"#223344",stripeColor:"#112233",finColor:"#112233",eyeColor:"#1a1a1a",transparent:false,biolum:false},
  "Seahorse":         {bodyL:.06,bodyW:.05,bodyH:.35,headSc:.14,tailL:.4,tailFan:.05,dorsalH:.1,dorsalL:.12,pectoralSz:.06,pelvicSz:0,analFinH:.04,jawL:.12,jawGape:.05,mouthPos:.9,eyeSz:.06,spines:true,barbels:false,color:"#cc8833",stripeColor:"#aa5500",finColor:"#ffaa44",eyeColor:"#000000",transparent:false,biolum:false},
  "Koi":              {bodyL:.7,bodyW:.18,bodyH:.28,headSc:.28,tailL:.35,tailFan:.65,dorsalH:.28,dorsalL:.4,pectoralSz:.2,pelvicSz:.1,analFinH:.15,jawL:.06,jawGape:.2,mouthPos:.55,eyeSz:.08,spines:false,barbels:true,color:"#ff6600",stripeColor:"#ffffff",finColor:"#ff4400",eyeColor:"#000000",transparent:false,biolum:false},
  "Deep Sea Creature":{bodyL:.8,bodyW:.18,bodyH:.3,headSc:.45,tailL:.3,tailFan:.4,dorsalH:.2,dorsalL:.3,pectoralSz:.22,pelvicSz:.1,analFinH:.15,jawL:.3,jawGape:.75,mouthPos:.35,eyeSz:.18,spines:false,barbels:true,color:"#050510",stripeColor:"#0a0a1a",finColor:"#001133",eyeColor:"#00aaff",transparent:true,biolum:true},
  "Jellyfish":        {bodyL:.02,bodyW:.5,bodyH:.5,headSc:.5,tailL:1.2,tailFan:.02,dorsalH:0,dorsalL:0,pectoralSz:0,pelvicSz:0,analFinH:0,jawL:0,jawGape:0,mouthPos:.5,eyeSz:0,spines:false,barbels:true,color:"#aaccff",stripeColor:"#8899ff",finColor:"#aaaaff",eyeColor:"#ffffff",transparent:true,biolum:true},
  "Eel":              {bodyL:2.5,bodyW:.06,bodyH:.12,headSc:.22,tailL:.5,tailFan:.15,dorsalH:.08,dorsalL:2.0,pectoralSz:.06,pelvicSz:0,analFinH:.07,jawL:.18,jawGape:.4,mouthPos:.4,eyeSz:.07,spines:false,barbels:false,color:"#334422",stripeColor:"#223311",finColor:"#445533",eyeColor:"#ffaa00",transparent:false,biolum:false},
};

function buildFish(scene, cfg) {
  const ms=[];
  const col=new THREE.Color(cfg.color);
  const finCol=new THREE.Color(cfg.finColor);
  const mat=new THREE.MeshStandardMaterial({color:col,roughness:.4,metalness:.2,transparent:cfg.transparent,opacity:cfg.transparent?.6:1,
    emissive:cfg.biolum?new THREE.Color(cfg.eyeColor):new THREE.Color(0),emissiveIntensity:cfg.biolum?.3:0});
  const finMat=new THREE.MeshStandardMaterial({color:finCol,roughness:.3,side:THREE.DoubleSide,transparent:true,opacity:.8});

  const add=(geo,x,y,z,rx=0,ry=0,rz=0,m=mat)=>{
    const mesh=new THREE.Mesh(geo,m.clone());
    mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,rz);
    mesh.castShadow=true;scene.add(mesh);ms.push(mesh);return mesh;
  };

  // Jellyfish special case
  if(cfg.bodyW>1 && cfg.bodyH>.4 && cfg.bodyL<.1){
    // Bell
    const bellGeo=new THREE.SphereGeometry(cfg.bodyW*.5,14,8,0,Math.PI*2,0,Math.PI*.55);
    add(bellGeo,0,.5,0,0,0,0,new THREE.MeshStandardMaterial({color:col,transparent:true,opacity:.5,side:THREE.DoubleSide,emissive:new THREE.Color(cfg.eyeColor),emissiveIntensity:.4}));
    // Tentacles
    for(let t=0;t<12;t++){
      const a=t/12*Math.PI*2, r=cfg.bodyW*.38;
      for(let s=0;s<8;s++){
        const tGeo=new THREE.SphereGeometry(.015,4,3);
        const tm=add(tGeo,Math.cos(a)*r*.8,-.2-s*.14,Math.sin(a)*r*.8,0,0,0,new THREE.MeshStandardMaterial({color:finCol,transparent:true,opacity:.6+Math.random()*.3,emissive:new THREE.Color(cfg.eyeColor),emissiveIntensity:.2}));
      }
    }
    if(scene.getObjectByName("fish_amb"))return ms;
    const a=new THREE.AmbientLight(0x112233,.5);a.name="fish_amb";scene.add(a);ms.push(a);
    const d=new THREE.DirectionalLight(0x4488aa,.8);d.position.set(5,10,5);scene.add(d);ms.push(d);
    if(cfg.biolum){const pl=new THREE.PointLight(new THREE.Color(cfg.eyeColor),.6,3);pl.position.set(0,.5,0);scene.add(pl);ms.push(pl);}
    return ms;
  }

  // Seahorse special case — vertical body
  const isSeahorse = cfg.bodyH > cfg.bodyL*3;
  const bL=cfg.bodyL, bW=cfg.bodyW, bH=cfg.bodyH;

  if(isSeahorse){
    // Vertical body segments
    for(let i=0;i<8;i++){
      const y=i*.045+.1, r=.025*(1-i/8*.5)+.01;
      const bumpX=Math.sin(i*.5)*.02;
      add(new THREE.SphereGeometry(r,7,5),bumpX,y,0,0,0,0,mat);
    }
    // Curved neck
    add(new THREE.CylinderGeometry(.018,.025,.12,7),.04,.52,0,0,0,.3);
    // Head
    add(new THREE.BoxGeometry(.06,.05,.08),.06,.6,0);
    // Snout
    add(new THREE.CylinderGeometry(.006,.012,cfg.jawL,5),.06,.61,cfg.jawL*.5+.04,Math.PI/2,0,0);
    // Dorsal fin
    const dfGeo=new THREE.PlaneGeometry(cfg.dorsalH*.5,cfg.dorsalL*.5);
    add(dfGeo,.03+cfg.dorsalH*.25,.3,0,0,Math.PI/2,0,finMat);
    // Tail curl
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*.7, r=.06;
      add(new THREE.SphereGeometry(.015*(1-i/6*.5),5,4),Math.cos(a)*r,-.02-Math.sin(a)*r,0);
    }
    if(!scene.getObjectByName("fish_amb")){const a=new THREE.AmbientLight(0xffffff,.7);a.name="fish_amb";scene.add(a);ms.push(a);const d=new THREE.DirectionalLight(0xffeedd,1);d.position.set(8,15,8);d.castShadow=true;scene.add(d);ms.push(d);}
    return ms;
  }

  // Standard fish — body
  const bodyGeo=new THREE.SphereGeometry(.5,12,8);
  const body=new THREE.Mesh(bodyGeo,mat.clone());
  body.scale.set(bW,bH,bL); body.position.set(0,.3,0); body.castShadow=true; scene.add(body); ms.push(body);

  // Head
  const headGeo=new THREE.SphereGeometry(cfg.headSc,10,8);
  const head=new THREE.Mesh(headGeo,mat.clone());
  head.scale.set(1,1,1.15); head.position.set(0,.3,bL*.45); scene.add(head); ms.push(head);

  // Jaw/mouth
  if(cfg.jawL>.02){
    // Upper jaw
    add(new THREE.BoxGeometry(cfg.headSc*.9,cfg.headSc*.15,cfg.jawL),0,.3+cfg.headSc*(cfg.mouthPos-.5)*.4,bL*.45+cfg.headSc+cfg.jawL/2);
    // Lower jaw
    add(new THREE.BoxGeometry(cfg.headSc*.85,cfg.headSc*.12,cfg.jawL*.9),0,.3+cfg.headSc*(cfg.mouthPos-.5)*.4-cfg.headSc*cfg.jawGape*.25,bL*.45+cfg.headSc+cfg.jawL*.45);
  }

  // Eyes
  if(cfg.eyeSz>.02){
    [-1,1].forEach(s=>{
      add(new THREE.SphereGeometry(cfg.eyeSz,8,6),s*cfg.headSc*.65,.3+cfg.headSc*.18,bL*.45+cfg.headSc*.55,0,0,0,
        new THREE.MeshStandardMaterial({color:0xffffff,roughness:.05,emissive:cfg.biolum?new THREE.Color(cfg.eyeColor):new THREE.Color(0),emissiveIntensity:cfg.biolum?.6:0}));
      add(new THREE.SphereGeometry(cfg.eyeSz*.55,6,5),s*cfg.headSc*.7,.3+cfg.headSc*.18,bL*.45+cfg.headSc*.65,0,0,0,
        new THREE.MeshStandardMaterial({color:new THREE.Color(cfg.eyeColor)}));
    });
  }

  // Dorsal fin
  if(cfg.dorsalH>.02){
    const dGeo=new THREE.BufferGeometry();
    const dl=cfg.dorsalL, dh=cfg.dorsalH;
    const spk=cfg.spines?4:0;
    const verts=[];
    for(let i=0;i<=8;i++){
      const t=i/8;
      verts.push(-dl/2+t*dl,0,0, -dl/2+t*dl,dh*Math.sin(t*Math.PI)*(1+Math.random()*.1*(spk>0?1:0)),0);
    }
    for(let i=0;i<8;i++) { const b=i*2; dGeo.setIndex([...(dGeo.index?.array||[]),b,b+1,b+2,b+1,b+3,b+2]); }
    const pArr=new Float32Array(verts);
    dGeo.setAttribute("position",new THREE.BufferAttribute(pArr,3));
    // Simple plane instead
    const dfGeo=new THREE.PlaneGeometry(cfg.dorsalL,cfg.dorsalH);
    add(dfGeo,0,.3+bH/2+cfg.dorsalH/2,0,0,0,0,finMat);
  }

  // Pectoral fins
  if(cfg.pectoralSz>.02){
    [-1,1].forEach(s=>{
      const pfGeo=new THREE.EllipseCurve ? new THREE.PlaneGeometry(cfg.pectoralSz,cfg.pectoralSz*.55) : new THREE.PlaneGeometry(cfg.pectoralSz,cfg.pectoralSz*.55);
      add(pfGeo,s*(bW/2+cfg.pectoralSz*.4),.3,bL*.1,s*.4,0,s*.3,finMat);
    });
  }

  // Pelvic fins
  if(cfg.pelvicSz>.02){
    [-1,1].forEach(s=>add(new THREE.PlaneGeometry(cfg.pelvicSz*.7,cfg.pelvicSz),s*(bW/2+cfg.pelvicSz*.25),.3-bH*.2,-bL*.05,s*.5,0,s*.2,finMat));
  }

  // Anal fin
  if(cfg.analFinH>.02){
    add(new THREE.PlaneGeometry(bL*.3,cfg.analFinH),0,.3-bH/2-cfg.analFinH*.4,-bL*.15,0,0,0,finMat);
  }

  // Tail fin
  if(cfg.tailL>.05){
    const fan=cfg.tailFan;
    const tGeo=new THREE.BufferGeometry();
    const verts=new Float32Array([
      0,0,0, -cfg.tailL*fan*.5,cfg.tailL*.55,-cfg.tailL*.3,  cfg.tailL*fan*.5,cfg.tailL*.55,-cfg.tailL*.3,
      0,0,0, -cfg.tailL*fan*.45,-cfg.tailL*.5,-cfg.tailL*.3, cfg.tailL*fan*.45,-cfg.tailL*.5,-cfg.tailL*.3,
    ]);
    tGeo.setAttribute("position",new THREE.BufferAttribute(verts,3));
    tGeo.setIndex([0,1,2,3,4,5]);
    tGeo.computeVertexNormals();
    const tm=new THREE.Mesh(tGeo,finMat.clone());
    tm.position.set(0,.3,-bL*.5);
    scene.add(tm); ms.push(tm);
  }

  // Spine spikes
  if(cfg.spines){
    for(let i=0;i<5;i++){
      const sz=-bL*.1+i*bL*.08;
      add(new THREE.ConeGeometry(bW*.04,cfg.dorsalH*.4,4),0,.3+bH/2+cfg.dorsalH*.5+i*.01,sz,.1,0,0,
        new THREE.MeshStandardMaterial({color:new THREE.Color(cfg.finColor),roughness:.6}));
    }
  }

  // Barbels (whiskers — catfish, koi, anglerfish lure)
  if(cfg.barbels){
    const isAnglerfish = cfg.biolum && cfg.jawGape>.7;
    if(isAnglerfish){
      // Lure on dorsal spine
      add(new THREE.CylinderGeometry(.01,.008,.35,5),0,.3+bH/2+.4,bL*.2,.3,0,0);
      add(new THREE.SphereGeometry(.04,7,5),0,.3+bH/2+.75,bL*.2+.05,0,0,0,
        new THREE.MeshStandardMaterial({color:0x00ffaa,emissive:new THREE.Color(0x00ffaa),emissiveIntensity:.8,roughness:.1}));
      if(cfg.biolum){const pl=new THREE.PointLight(0x00ffaa,.5,1.2);pl.position.set(0,.3+bH/2+.78,bL*.2+.06);scene.add(pl);ms.push(pl);}
    } else {
      // Barbels around mouth
      for(let b=0;b<4;b++){
        const bx=(b%2===0?-1:1)*(b<2?.06:.03), blen=.08+Math.random()*.06;
        add(new THREE.CylinderGeometry(.004,.003,blen,4),bx,.3+cfg.headSc*(cfg.mouthPos-.5)*.4-.03,bL*.45+cfg.headSc+cfg.jawL*.5+blen*.3,-.2,0,.2*(b<2?1:-1),
          new THREE.MeshStandardMaterial({color:new THREE.Color(cfg.color),roughness:.9}));
      }
    }
  }

  // Stripe pattern overlay
  if(cfg.stripeColor !== cfg.color){
    for(let s=0;s<2;s++){
      const sg=new THREE.SphereGeometry(.49,10,6);
      const sm=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({color:new THREE.Color(cfg.stripeColor),transparent:true,opacity:.7,roughness:.4,metalness:.2}));
      sm.scale.set(bW*.85,bH*.3,bL*.25);
      sm.position.set(0,.3,bL*(s-.25)*.6);
      scene.add(sm); ms.push(sm);
    }
  }

  // Water ambient lighting
  if(!scene.getObjectByName("fish_amb")){
    const a=new THREE.AmbientLight(0x112244,.6);a.name="fish_amb";scene.add(a);ms.push(a);
    const d=new THREE.DirectionalLight(0x88ccff,.9);d.position.set(5,15,8);d.castShadow=true;scene.add(d);ms.push(d);
    if(cfg.biolum){const pl=new THREE.PointLight(new THREE.Color(cfg.eyeColor),.5,3);pl.position.set(0,.3,bL*.3);scene.add(pl);ms.push(pl);}
  }
  return ms;
}

const CTRL=[
  {id:"bodyL",lbl:"Body Length",min:.02,max:3,step:.01},
  {id:"bodyW",lbl:"Body Width",min:.02,max:2.5,step:.01},
  {id:"bodyH",lbl:"Body Height",min:.02,max:1,step:.01},
  {id:"headSc",lbl:"Head Scale",min:.05,max:.8,step:.01},
  {id:"tailL",lbl:"Tail Length",min:0,max:1.5,step:.01},
  {id:"tailFan",lbl:"Tail Fan",min:.02,max:1,step:.01},
  {id:"dorsalH",lbl:"Dorsal Fin Height",min:0,max:.7,step:.01},
  {id:"dorsalL",lbl:"Dorsal Fin Length",min:0,max:1,step:.01},
  {id:"pectoralSz",lbl:"Pectoral Fin",min:0,max:.8,step:.01},
  {id:"pelvicSz",lbl:"Pelvic Fin",min:0,max:.4,step:.01},
  {id:"analFinH",lbl:"Anal Fin",min:0,max:.4,step:.01},
  {id:"jawL",lbl:"Jaw Length",min:0,max:.5,step:.01},
  {id:"jawGape",lbl:"Jaw Gape",min:0,max:1,step:.01},
  {id:"mouthPos",lbl:"Mouth Position",min:.2,max:.8,step:.01},
  {id:"eyeSz",lbl:"Eye Size",min:0,max:.25,step:.01},
];

export default function FishGeneratorPanel({ scene }) {
  const [preset,setPreset] = useState("Tropical Fish");
  const [cfg,setCfg]       = useState({...FISH_PRESETS["Tropical Fish"]});
  const [colors,setColors] = useState({color:"#ff8800",stripeColor:"#ffffff",finColor:"#ff4400",eyeColor:"#000000"});
  const [spines,setSpines] = useState(false);
  const [barbels,setBarbels]= useState(false);
  const [transparent,setTransparent]=useState(false);
  const [biolum,setBiolum] = useState(false);
  const [status,setStatus] = useState("");
  const meshes = useRef([]);

  function loadPreset(p){
    setPreset(p);const pr=FISH_PRESETS[p];setCfg({...pr});
    setColors({color:pr.color,stripeColor:pr.stripeColor,finColor:pr.finColor,eyeColor:pr.eyeColor});
    setSpines(pr.spines||false);setBarbels(pr.barbels||false);
    setTransparent(pr.transparent||false);setBiolum(pr.biolum||false);
  }
  function clear(){ meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();}); meshes.current=[]; setStatus(""); }
  function generate(){
    if(!scene){setStatus("No scene");return;}
    clear();
    const ms=buildFish(scene,{...cfg,...colors,spines,barbels,transparent,biolum});
    meshes.current=ms;
    setStatus(`✓ ${preset} built — ${ms.filter(m=>m.isMesh).length} parts`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🐟 FISH GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Fish/Aquatic Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(FISH_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
          {[["color","Body"],["stripeColor","Stripe"],["finColor","Fin"],["eyeColor","Eye"]].map(([k,lbl])=>(
            <div key={k}><label style={{...S.lbl,fontSize:9}}>{lbl}</label>
            <input type="color" value={colors[k]} onChange={e=>setColors(c=>({...c,[k]:e.target.value}))} style={{width:40,height:28,border:"none",background:"none",cursor:"pointer"}}/></div>
          ))}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
          {[["spines","Dorsal Spines",spines,setSpines],["barbels","Barbels/Lure",barbels,setBarbels],["transparent","Transparent",transparent,setTransparent],["biolum","Bioluminescent",biolum,setBiolum]].map(([k,lbl,val,set])=>(
            <label key={k} style={{...S.lbl,cursor:"pointer"}}><input type="checkbox" checked={val} onChange={e=>set(e.target.checked)}/> {lbl}</label>
          ))}
        </div>
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
"""

# Write
print("Writing files...")
for path, content in FILES.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    print(f"  ✓ {path.replace('/workspaces/spx-mesh-editor/','')}")

print(f"\n✅ Done — {len(FILES)} files")
print("Run: npm run build && git add -A && git commit -m 'feat: Bird Generator + Fish Generator' && git push")
