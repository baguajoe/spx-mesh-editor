
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const MORPH_PRESETS={
  "Realistic Human":   {jawW:.45,jawLen:.4,chinSz:.35,cheekH:.5,cheekFull:.5,browDepth:.3,foreheadSlope:.3,skullW:.5,realismBal:.9,heroicExag:0,ageMorph:.2,wrinkle:.1,creatureAmt:0,demonAmt:0,dragonAmt:0,monsterAmt:0,kaijuAmt:0,asymmetry:.05},
  "Stylized Hero":     {jawW:.6,jawLen:.5,chinSz:.45,cheekH:.65,cheekFull:.4,browDepth:.5,foreheadSlope:.2,skullW:.55,realismBal:.6,heroicExag:.6,ageMorph:.1,wrinkle:0,creatureAmt:0,demonAmt:0,dragonAmt:0,monsterAmt:0,kaijuAmt:0,asymmetry:.03},
  "Demon":             {jawW:.7,jawLen:.6,chinSz:.55,cheekH:.8,cheekFull:.2,browDepth:.9,foreheadSlope:.6,skullW:.6,realismBal:.4,heroicExag:.3,ageMorph:0,wrinkle:.3,creatureAmt:.2,demonAmt:.85,dragonAmt:0,monsterAmt:.2,kaijuAmt:0,asymmetry:.15},
  "Dragon Humanoid":   {jawW:.75,jawLen:.85,chinSz:.4,cheekH:.6,cheekFull:.15,browDepth:.7,foreheadSlope:.8,skullW:.7,realismBal:.2,heroicExag:.4,ageMorph:0,wrinkle:0,creatureAmt:.5,demonAmt:.1,dragonAmt:.9,monsterAmt:.1,kaijuAmt:0,asymmetry:.05},
  "Monster Hybrid":    {jawW:.8,jawLen:.7,chinSz:.3,cheekH:.5,cheekFull:.6,browDepth:.75,foreheadSlope:.5,skullW:.75,realismBal:.15,heroicExag:.2,ageMorph:0,wrinkle:.2,creatureAmt:.6,demonAmt:.2,dragonAmt:.1,monsterAmt:.9,kaijuAmt:.1,asymmetry:.2},
  "Kaiju Humanoid":    {jawW:.95,jawLen:.9,chinSz:.5,cheekH:.7,cheekFull:.5,browDepth:.95,foreheadSlope:.7,skullW:.95,realismBal:.05,heroicExag:.5,ageMorph:0,wrinkle:.4,creatureAmt:.8,demonAmt:.1,dragonAmt:.2,monsterAmt:.5,kaijuAmt:.95,asymmetry:.1},
  "Elderly":           {jawW:.35,jawLen:.38,chinSz:.3,cheekH:.3,cheekFull:.25,browDepth:.4,foreheadSlope:.35,skullW:.45,realismBal:.95,heroicExag:0,ageMorph:.9,wrinkle:.85,creatureAmt:0,demonAmt:0,dragonAmt:0,monsterAmt:0,kaijuAmt:0,asymmetry:.12},
};

const FACIAL_CTRL=[
  {id:"jawW",lbl:"Jaw Width"},{id:"jawLen",lbl:"Jaw Length"},{id:"chinSz",lbl:"Chin Size"},
  {id:"cheekH",lbl:"Cheekbone Height"},{id:"cheekFull",lbl:"Cheek Fullness"},
  {id:"browDepth",lbl:"Brow Depth"},{id:"foreheadSlope",lbl:"Forehead Slope"},
  {id:"skullW",lbl:"Skull Width"},
];
const STYLE_CTRL=[
  {id:"realismBal",lbl:"Realism Balance"},{id:"heroicExag",lbl:"Heroic Exaggeration"},
  {id:"ageMorph",lbl:"Age Morph"},{id:"wrinkle",lbl:"Wrinkle Intensity"},{id:"asymmetry",lbl:"Facial Asymmetry"},
];
const CREATURE_CTRL=[
  {id:"creatureAmt",lbl:"Creature Morph"},{id:"demonAmt",lbl:"Demon Morph"},
  {id:"dragonAmt",lbl:"Dragon Morph"},{id:"monsterAmt",lbl:"Monster Morph"},{id:"kaijuAmt",lbl:"Kaiju Morph"},
];

export default function MorphGeneratorPanel({scene,targetMesh}){
  const [preset,setPreset]=useState("Realistic Human");
  const [morph,setMorph]=useState({...MORPH_PRESETS["Realistic Human"]});
  const [blendPresetA,setBlendPA]=useState("Realistic Human");
  const [blendPresetB,setBlendPB]=useState("Demon");
  const [blendAmt,setBlendAmt]=useState(0.5);
  const [status,setStatus]=useState("");

  function loadPreset(p){setPreset(p);setMorph({...MORPH_PRESETS[p]});}

  function blendPresets(){
    const a=MORPH_PRESETS[blendPresetA],b=MORPH_PRESETS[blendPresetB];
    if(!a||!b)return;
    const blended={};
    Object.keys(a).forEach(k=>{blended[k]=a[k]+(b[k]-a[k])*blendAmt;});
    setMorph(blended);setPreset("Custom Blend");
    setStatus(`Blend: ${blendPresetA} + ${blendPresetB} @ ${(blendAmt*100).toFixed(0)}%`);
  }

  function applyToMesh(){
    if(!scene){setStatus("No scene");return;}
    let n=0;
    scene.traverse(o=>{
      if(!o.isMesh||!o.morphTargetInfluences)return;
      const dict=o.morphTargetDictionary||{};
      Object.entries(morph).forEach(([k,v])=>{if(dict[k]!==undefined)o.morphTargetInfluences[dict[k]]=v;});
      n++;
    });
    setStatus(n>0?`✓ Morphs applied to ${n} mesh(es)`:"No morph target meshes found");
  }

  function exportMorphs(){
    const b=new Blob([JSON.stringify(morph,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="morph_data.json";a.click();
  }

  const renderCtrl=(ctrls)=>ctrls.map(c=>(
    <div key={c.id}>
      <label style={S.lbl}>{c.lbl}: {morph[c.id]?.toFixed(2)}</label>
      <input style={S.inp} type="range" min={0} max={1} step={0.01} value={morph[c.id]||0} onChange={e=>setMorph(m=>({...m,[c.id]:+e.target.value}))}/>
    </div>
  ));

  return(
    <div style={S.root}>
      <div style={S.h2}>🧬 MORPH GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Morph Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(MORPH_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Blend Presets</div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <select style={{...S.inp,marginBottom:0}} value={blendPresetA} onChange={e=>setBlendPA(e.target.value)}>{Object.keys(MORPH_PRESETS).map(p=><option key={p}>{p}</option>)}</select>
          <select style={{...S.inp,marginBottom:0}} value={blendPresetB} onChange={e=>setBlendPB(e.target.value)}>{Object.keys(MORPH_PRESETS).map(p=><option key={p}>{p}</option>)}</select>
        </div>
        <label style={S.lbl}>Blend: {(blendAmt*100).toFixed(0)}% B</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={blendAmt} onChange={e=>setBlendAmt(+e.target.value)}/>
        <button style={S.btnSm} onClick={blendPresets}>⚡ Blend</button>
      </div>
      <div style={S.sec}><div style={S.h3}>Facial Structure</div>{renderCtrl(FACIAL_CTRL)}</div>
      <div style={S.sec}><div style={S.h3}>Stylization</div>{renderCtrl(STYLE_CTRL)}</div>
      <div style={S.sec}><div style={S.h3}>Creature Morphs</div>{renderCtrl(CREATURE_CTRL)}</div>
      <button style={S.btn} onClick={applyToMesh}>✓ Apply Morphs</button>
      <button style={S.btnO} onClick={exportMorphs}>💾 Export JSON</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
