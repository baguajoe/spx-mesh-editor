#!/usr/bin/env python3
# ShapeShifter + Human Skin Expansion + Character Targeting
# python3 install_shapeshifter_and_wiring.py && npm run build && git add -A && git commit -m "feat: ShapeShifter, 20 human skin conditions, character targeting" && git push
import os

REPO = "/workspaces/spx-mesh-editor"
P    = f"{REPO}/src/components/panels"
os.makedirs(P, exist_ok=True)

FILES = {}

# ── SHAPESHIFTER PANEL ────────────────────────────────────────────────────────
FILES[f"{P}/ShapeShifterPanel.jsx"] = r"""
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  card:(a)=>({background:a?"#001a14":"#0d0d1a",border:"1px solid "+(a?T.teal:T.border),borderRadius:6,padding:10,marginBottom:8,cursor:"pointer"}),
  cardTitle:{color:T.teal,fontSize:12,fontWeight:700,marginBottom:4},
  timeline:{width:"100%",height:8,background:T.panel,borderRadius:4,marginBottom:8,position:"relative",cursor:"pointer"},
  thumb:(p)=>({position:"absolute",top:-4,left:`${p*100}%`,width:16,height:16,borderRadius:"50%",background:T.teal,transform:"translateX(-50%)",cursor:"pointer"}),
};

// Morph shape definitions — each defines how the character mesh scales/distorts
const MORPH_FORMS = {
  "Adult Male": {
    headScale:[1,1,1], shoulderScale:[1.3,1,1], hipScale:[0.85,1,0.85],
    torsoScale:[1,1,1], legScale:[1,1,1], armScale:[1,1,1],
    headY:0, spineOffset:0, limbLen:1.0,
    skinTone:"#c8955a", eyeSize:0.9, jawWidth:1.1, browDepth:0.6,
    earSize:1.0, noseWidth:1.0, lipFullness:0.5,
  },
  "Adult Female": {
    headScale:[0.92,0.95,0.92], shoulderScale:[1.0,1,1], hipScale:[1.2,1,1.1],
    torsoScale:[0.88,1,0.9], legScale:[1.05,1,1], armScale:[0.85,1,0.85],
    headY:0, spineOffset:0, limbLen:1.0,
    skinTone:"#d4a878", eyeSize:1.1, jawWidth:0.85, browDepth:0.2,
    earSize:0.9, noseWidth:0.85, lipFullness:0.8,
  },
  "Child": {
    headScale:[1.3,1.3,1.3], shoulderScale:[0.65,1,0.65], hipScale:[0.7,1,0.7],
    torsoScale:[0.65,0.65,0.7], legScale:[0.6,0.6,0.6], armScale:[0.6,0.6,0.6],
    headY:0.15, spineOffset:0, limbLen:0.6,
    skinTone:"#f0c896", eyeSize:1.4, jawWidth:0.7, browDepth:0.1,
    earSize:1.1, noseWidth:0.75, lipFullness:0.6,
  },
  "Elder Male": {
    headScale:[1,0.97,0.98], shoulderScale:[1.1,0.95,1], hipScale:[0.9,1,0.9],
    torsoScale:[0.95,0.92,0.95], legScale:[0.95,0.95,0.95], armScale:[0.9,0.95,0.9],
    headY:-0.05, spineOffset:0.08, limbLen:0.95,
    skinTone:"#b8855a", eyeSize:0.82, jawWidth:0.95, browDepth:0.7,
    earSize:1.1, noseWidth:1.1, lipFullness:0.35,
  },
  "Elder Female": {
    headScale:[0.94,0.92,0.93], shoulderScale:[0.88,0.95,0.9], hipScale:[1.05,1,1],
    torsoScale:[0.85,0.9,0.88], legScale:[0.92,0.92,0.92], armScale:[0.82,0.92,0.82],
    headY:-0.04, spineOffset:0.1, limbLen:0.92,
    skinTone:"#c8a070", eyeSize:0.78, jawWidth:0.8, browDepth:0.5,
    earSize:1.05, noseWidth:1.0, lipFullness:0.3,
  },
  "Wolf/Canine": {
    headScale:[1.15,0.85,1.3], shoulderScale:[1.4,1.1,1.1], hipScale:[0.9,1,1.05],
    torsoScale:[1.1,0.88,1.2], legScale:[1.1,1.15,1.1], armScale:[1.05,1.1,1.05],
    headY:0.05, spineOffset:0.05, limbLen:1.1,
    skinTone:"#888888", eyeSize:1.2, jawWidth:1.4, browDepth:0.8,
    earSize:1.8, noseWidth:1.5, lipFullness:0.3,
  },
  "Feline/Cat": {
    headScale:[0.95,0.82,1.0], shoulderScale:[1.15,0.95,1.0], hipScale:[1.0,1,1.05],
    torsoScale:[0.95,0.85,1.05], legScale:[1.0,1.1,1.0], armScale:[0.9,1.0,0.9],
    headY:0.03, spineOffset:0.03, limbLen:1.05,
    skinTone:"#aa8855", eyeSize:1.3, jawWidth:0.95, browDepth:0.5,
    earSize:1.6, noseWidth:1.1, lipFullness:0.4,
  },
  "Bear": {
    headScale:[1.4,1.2,1.35], shoulderScale:[1.8,1.2,1.3], hipScale:[1.4,1.1,1.3],
    torsoScale:[1.5,1.1,1.4], legScale:[1.3,0.9,1.3], armScale:[1.4,1.0,1.3],
    headY:0, spineOffset:0, limbLen:0.85,
    skinTone:"#4a2c0a", eyeSize:0.7, jawWidth:1.6, browDepth:0.9,
    earSize:0.8, noseWidth:1.8, lipFullness:0.2,
  },
  "Reptile/Dragon": {
    headScale:[1.1,0.75,1.4], shoulderScale:[1.3,1.05,1.1], hipScale:[1.0,1,1.1],
    torsoScale:[1.05,0.9,1.15], legScale:[1.05,1.05,1.05], armScale:[1.0,1.0,1.0],
    headY:0.02, spineOffset:0, limbLen:1.08,
    skinTone:"#3a6632", eyeSize:0.9, jawWidth:1.5, browDepth:0.95,
    earSize:0.3, noseWidth:1.3, lipFullness:0.15,
  },
  "Bird/Avian": {
    headScale:[0.85,0.9,0.85], shoulderScale:[1.5,1.0,0.8], hipScale:[0.7,1,0.8],
    torsoScale:[0.9,0.85,0.75], legScale:[0.7,1.3,0.7], armScale:[1.6,0.9,0.5],
    headY:0.08, spineOffset:-0.05, limbLen:1.15,
    skinTone:"#ddaa55", eyeSize:1.5, jawWidth:0.6, browDepth:0.3,
    earSize:0.2, noseWidth:0.5, lipFullness:0.1,
  },
  "Insect/Arthropod": {
    headScale:[0.7,0.65,0.7], shoulderScale:[1.1,0.8,0.7], hipScale:[1.3,0.8,1.1],
    torsoScale:[0.7,0.7,0.8], legScale:[0.5,1.5,0.5], armScale:[0.5,1.2,0.5],
    headY:0.1, spineOffset:0, limbLen:1.3,
    skinTone:"#334422", eyeSize:2.0, jawWidth:0.8, browDepth:1.0,
    earSize:0.1, noseWidth:0.5, lipFullness:0.05,
  },
  "Aquatic/Fish": {
    headScale:[1.1,0.9,1.2], shoulderScale:[1.0,0.85,0.7], hipScale:[1.2,0.8,1.3],
    torsoScale:[1.1,0.8,1.15], legScale:[0.6,0.9,1.4], armScale:[0.5,0.8,0.3],
    headY:0, spineOffset:0.02, limbLen:0.7,
    skinTone:"#2244aa", eyeSize:1.6, jawWidth:1.1, browDepth:0.3,
    earSize:0.0, noseWidth:0.8, lipFullness:0.2,
  },
};

function lerpMorph(a, b, t) {
  const out = {};
  Object.keys(a).forEach(k => {
    if (Array.isArray(a[k])) {
      out[k] = a[k].map((v,i) => v + (b[k][i]-v)*t);
    } else if (typeof a[k] === 'number') {
      out[k] = a[k] + (b[k]-a[k])*t;
    } else {
      // Color lerp
      const ca = parseInt(a[k].slice(1),16);
      const cb = parseInt(b[k].slice(1),16);
      const r = Math.round(((ca>>16)&255) + (((cb>>16)&255)-((ca>>16)&255))*t);
      const g = Math.round(((ca>>8)&255)  + (((cb>>8)&255) -((ca>>8)&255)) *t);
      const bl= Math.round((ca&255)        + ((cb&255)      -(ca&255))       *t);
      out[k] = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
    }
  });
  return out;
}

function applyMorphToScene(scene, morph, targetName) {
  if (!scene) return 0;
  let n = 0;
  scene.traverse(obj => {
    if (!obj.isMesh) return;
    if (targetName && obj.name !== targetName && obj.userData.charName !== targetName) return;
    const p = obj.parent || obj;
    // Scale head group
    if (obj.userData.part === 'head') { obj.scale.set(...morph.headScale); }
    if (obj.userData.part === 'shoulder') { obj.scale.set(...morph.shoulderScale); }
    if (obj.userData.part === 'hip') { obj.scale.set(...morph.hipScale); }
    if (obj.userData.part === 'torso') { obj.scale.set(...morph.torsoScale); }
    if (obj.userData.part === 'arm') { obj.scale.set(...morph.armScale); }
    if (obj.userData.part === 'leg') { obj.scale.set(...morph.legScale); }
    // Apply skin color
    if (obj.material && morph.skinTone) {
      obj.material.color = new THREE.Color(morph.skinTone);
      obj.material.needsUpdate = true;
    }
    n++;
  });
  return n;
}

const FORM_NAMES = Object.keys(MORPH_FORMS);

export default function ShapeShifterPanel({ scene, selectedMeshName }) {
  const [formA, setFormA]       = useState("Adult Male");
  const [formB, setFormB]       = useState("Wolf/Canine");
  const [blend, setBlend]       = useState(0);
  const [animating, setAnimating] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(0.5);
  const [animMode, setAnimMode]   = useState("A→B→A");
  const [sequence, setSequence]   = useState(["Adult Male","Adult Female","Child","Wolf/Canine"]);
  const [seqIdx, setSeqIdx]       = useState(0);
  const [seqBlend, setSeqBlend]   = useState(0);
  const [mode, setMode]           = useState("Two-Form Blend");
  const [status, setStatus]       = useState("");
  const raf     = useRef(null);
  const lastT   = useRef(0);
  const dir     = useRef(1);
  const seqT    = useRef(0);

  function applyCurrentBlend(b) {
    const mA = MORPH_FORMS[formA];
    const mB = MORPH_FORMS[formB];
    if (!mA || !mB) return;
    const m = lerpMorph(mA, mB, b);
    const n = applyMorphToScene(scene, m, selectedMeshName);
    setStatus(n > 0 ? `✓ Blend ${(b*100).toFixed(0)}% ${formA}→${formB} on ${n} parts` : `Applied (no tagged parts — add userData.part to meshes)`);
  }

  function applySequenceBlend(idx, b) {
    const a = MORPH_FORMS[sequence[idx]];
    const nb = MORPH_FORMS[sequence[(idx+1) % sequence.length]];
    if (!a || !nb) return;
    const m = lerpMorph(a, nb, b);
    applyMorphToScene(scene, m, selectedMeshName);
    setStatus(`Sequence: ${sequence[idx]} → ${sequence[(idx+1)%sequence.length]} @ ${(b*100).toFixed(0)}%`);
  }

  useEffect(() => {
    if (!animating) { cancelAnimationFrame(raf.current); return; }
    const tick = (now) => {
      const dt = Math.min((now - lastT.current)/1000, 0.05);
      lastT.current = now;
      if (mode === "Two-Form Blend") {
        setBlend(prev => {
          let next = prev + dir.current * animSpeed * dt;
          if (next >= 1) { next = 1; if (animMode === "A→B→A") dir.current = -1; else next = 0; }
          if (next <= 0) { next = 0; dir.current = 1; }
          applyCurrentBlend(next);
          return next;
        });
      } else {
        seqT.current += animSpeed * dt;
        if (seqT.current >= 1) {
          seqT.current = 0;
          setSeqIdx(prev => {
            const next = (prev+1) % sequence.length;
            return next;
          });
        }
        setSeqBlend(seqT.current);
        applySequenceBlend(seqIdx, seqT.current);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [animating, animSpeed, animMode, mode, formA, formB, sequence, seqIdx]);

  function addToSequence(form) {
    setSequence(s => [...s, form]);
  }
  function removeFromSequence(i) {
    setSequence(s => s.filter((_,idx) => idx !== i));
  }

  function exportMorphData() {
    const mA = MORPH_FORMS[formA], mB = MORPH_FORMS[formB];
    const blended = lerpMorph(mA, mB, blend);
    const b = new Blob([JSON.stringify({formA,formB,blend,result:blended},null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='shapeshifter_morph.json'; a.click();
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>🔀 SHAPE SHIFTER</div>

      <div style={S.sec}>
        <label style={S.lbl}>Mode</label>
        <select style={S.sel} value={mode} onChange={e=>setMode(e.target.value)}>
          {["Two-Form Blend","Sequence Chain"].map(m=><option key={m}>{m}</option>)}
        </select>
      </div>

      {mode === "Two-Form Blend" && <>
        <div style={S.sec}>
          <label style={S.lbl}>Form A</label>
          <select style={S.sel} value={formA} onChange={e=>setFormA(e.target.value)}>
            {FORM_NAMES.map(f=><option key={f}>{f}</option>)}
          </select>
          <label style={S.lbl}>Form B</label>
          <select style={S.sel} value={formB} onChange={e=>setFormB(e.target.value)}>
            {FORM_NAMES.map(f=><option key={f}>{f}</option>)}
          </select>
          <label style={S.lbl}>Blend A→B: {(blend*100).toFixed(0)}%</label>
          <input style={S.inp} type="range" min={0} max={1} step={0.001} value={blend}
            onChange={e=>{ setBlend(+e.target.value); applyCurrentBlend(+e.target.value); }}/>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <button style={S.btnSm} onClick={()=>{setBlend(0);applyCurrentBlend(0);}}>← Full A</button>
            <button style={S.btnSm} onClick={()=>{setBlend(0.5);applyCurrentBlend(0.5);}}>50/50</button>
            <button style={S.btnSm} onClick={()=>{setBlend(1);applyCurrentBlend(1);}}>Full B →</button>
          </div>
        </div>

        <div style={S.sec}>
          <label style={S.lbl}>Animation Mode</label>
          <select style={S.sel} value={animMode} onChange={e=>setAnimMode(e.target.value)}>
            {["A→B→A","A→B Loop","Pulse"].map(m=><option key={m}>{m}</option>)}
          </select>
          <label style={S.lbl}>Speed: {animSpeed.toFixed(2)}</label>
          <input style={S.inp} type="range" min={0.05} max={3} step={0.05} value={animSpeed} onChange={e=>setAnimSpeed(+e.target.value)}/>
        </div>
      </>}

      {mode === "Sequence Chain" && <div style={S.sec}>
        <div style={S.h3}>Morph Sequence ({sequence.length} forms)</div>
        {sequence.map((f,i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <span style={{fontSize:11,color:seqIdx===i?T.teal:T.muted,flex:1}}>{i+1}. {f}</span>
            <button style={S.btnSm} onClick={()=>removeFromSequence(i)}>✕</button>
          </div>
        ))}
        <label style={S.lbl}>Add Form to Sequence</label>
        <select style={S.sel} onChange={e=>{ if(e.target.value)addToSequence(e.target.value); e.target.value=''; }} defaultValue="">
          <option value="">— pick form —</option>
          {FORM_NAMES.map(f=><option key={f}>{f}</option>)}
        </select>
        <label style={S.lbl}>Sequence Progress: {(seqBlend*100).toFixed(0)}%</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.001} value={seqBlend}
          onChange={e=>{ setSeqBlend(+e.target.value); applySequenceBlend(seqIdx,+e.target.value); }}/>
        <div style={S.stat}>Current: {sequence[seqIdx]} → {sequence[(seqIdx+1)%sequence.length]}</div>
      </div>}

      <div style={S.sec}>
        <div style={S.h3}>Form Cards</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {FORM_NAMES.map(f => (
            <button key={f} style={{
              ...S.btnSm,
              background:(f===formA||f===formB)?T.teal:T.panel,
              color:(f===formA||f===formB)?T.bg:T.teal,
            }} onClick={()=>{ setFormA(formA); setFormB(f); applyCurrentBlend(blend); }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {!animating
        ? <button style={S.btn} onClick={()=>setAnimating(true)}>▶ Animate Shift</button>
        : <button style={{...S.btn,background:"#cc2200",color:"#fff"}} onClick={()=>setAnimating(false)}>⏹ Stop</button>
      }
      <button style={S.btnO} onClick={()=>applyCurrentBlend(blend)}>✓ Apply</button>
      <button style={S.btnSm} onClick={exportMorphData}>💾 Export JSON</button>
      {status && <div style={{...S.stat,marginTop:8}}>{status}</div>}
      {selectedMeshName && <div style={{...S.stat,color:T.orange}}>Target: {selectedMeshName}</div>}
    </div>
  );
}
"""

# ── EXPANDED HUMAN SKIN CONDITIONS ────────────────────────────────────────────
# Patch CharacterSkinStudioPanel to add 20 more human conditions
EXTRA_HUMAN_SKINS_PATCH = r"""
import os

path = "/workspaces/spx-mesh-editor/src/components/panels/CharacterSkinStudioPanel.jsx"
content = open(path).read()

EXTRA_HUMANS = '''
  "Albinism":           {base:"#f8f0e8",mid:"#efe0d0",deep:"#ddd0c0",lip:"#ffaaaa",cheek:"#ffcccc",vein:"#cc99cc",pore:0.2,roughness:0.45,sss:0.98},
  "Vitiligo Light":     {base:"#f0d8b0",mid:"#cc9960",deep:"#996633",lip:"#cc7755",cheek:"#dd9966",vein:"#9999bb",pore:0.4,roughness:0.52,sss:0.88,vitiligo:true},
  "Vitiligo Dark":      {base:"#704828",mid:"#503018",deep:"#38200c",lip:"#661122",cheek:"#772222",vein:"#556688",pore:0.5,roughness:0.58,sss:0.79,vitiligo:true},
  "Rosacea":            {base:"#f0b8a8",mid:"#e09888",deep:"#c07060",lip:"#dd6655",cheek:"#ff8877",vein:"#dd7766",pore:0.55,roughness:0.58,sss:0.88},
  "Albino Dark Heritage":{base:"#f0e8d8",mid:"#e0d0b8",deep:"#d0b890",lip:"#ffbbaa",cheek:"#ffccbb",vein:"#cc99aa",pore:0.25,roughness:0.46,sss:0.97},
  "Melasma":            {base:"#c8955a",mid:"#a87040",deep:"#885030",lip:"#993344",cheek:"#bb6655",vein:"#7788aa",pore:0.5,roughness:0.55,sss:0.84,melasma:true},
  "Sun Damaged":        {base:"#c89060",mid:"#a06838",deep:"#784820",lip:"#aa5533",cheek:"#cc7744",vein:"#998877",pore:0.7,roughness:0.7,sss:0.75},
  "Burn Scar":          {base:"#aa6644",mid:"#884422",deep:"#662200",lip:"#882222",cheek:"#993333",vein:"#664433",pore:0.8,roughness:0.85,sss:0.6},
  "Keloid Scar":        {base:"#b87858",mid:"#985838",deep:"#783818",lip:"#882233",cheek:"#993333",vein:"#667788",pore:0.6,roughness:0.75,sss:0.7},
  "Psoriasis":          {base:"#d8a888",mid:"#b88860",deep:"#986840",lip:"#cc7766",cheek:"#ee9988",vein:"#aaaacc",pore:0.65,roughness:0.72,sss:0.8},
  "Eczema":             {base:"#e8b898",mid:"#c89870",deep:"#a87848",lip:"#cc8877",cheek:"#ddaaaa",vein:"#bbaacc",pore:0.6,roughness:0.68,sss:0.82},
  "Acne Prone":         {base:"#e8b898",mid:"#c89070",deep:"#a87050",lip:"#cc7766",cheek:"#ee9988",vein:"#9999bb",pore:0.75,roughness:0.65,sss:0.83},
  "Oily Skin":          {base:"#d8a880",mid:"#b88860",deep:"#986640",lip:"#bb7755",cheek:"#cc8866",vein:"#9999bb",pore:0.6,roughness:0.2,sss:0.87},
  "Hyperpigmentation":  {base:"#a06840",mid:"#805030",deep:"#603820",lip:"#882233",cheek:"#994444",vein:"#667799",pore:0.5,roughness:0.57,sss:0.81},
  "Newborn":            {base:"#f8c8b0",mid:"#f0a888",deep:"#d08060",lip:"#ff9999",cheek:"#ffbbbb",vein:"#cc99cc",pore:0.1,roughness:0.4,sss:0.99},
  "Pregnancy Glow":     {base:"#f0c898",mid:"#d8a870",deep:"#b88850",lip:"#cc8877",cheek:"#ffaaaa",vein:"#aaaadd",pore:0.3,roughness:0.48,sss:0.94},
  "Post-Workout Flush": {base:"#e8a888",mid:"#d08868",deep:"#b06848",lip:"#cc5544",cheek:"#ff7766",vein:"#cc8888",pore:0.5,roughness:0.45,sss:0.9},
  "Jaundice":           {base:"#d4c860",mid:"#b4a840",deep:"#948820",lip:"#aa8833",cheek:"#ccaa44",vein:"#888833",pore:0.4,roughness:0.5,sss:0.87},
  "Anemia/Pale":        {base:"#f0e0d0",mid:"#e0c8b8",deep:"#d0a888",lip:"#cc9999",cheek:"#ddbbbb",vein:"#aaaadd",pore:0.25,roughness:0.46,sss:0.96},
  "Cyanosis":           {base:"#9898d8",mid:"#7878b8",deep:"#585898",lip:"#7777cc",cheek:"#8888cc",vein:"#5555aa",pore:0.4,roughness:0.52,sss:0.88},
'''

# Insert extra presets before closing brace of HUMAN_PRESETS
marker = '"Mixed Ancestry":{base'
if marker in content and "Albinism" not in content:
    insert_point = content.rfind("};", content.find("HUMAN_PRESETS"), content.find("CREATURE_SKINS"))
    content = content[:insert_point] + EXTRA_HUMANS.strip() + "\n" + content[insert_point:]
    open(path, "w").write(content)
    print("✓ Added 20 human skin conditions to CharacterSkinStudioPanel")
else:
    print("⚠ Already patched or marker not found — skipping")
"""

# ── CHARACTER TARGETING SYSTEM ────────────────────────────────────────────────
FILES[f"{REPO}/src/components/panels/CharacterTargetingPanel.jsx"] = r"""
import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"6px 14px",fontFamily:T.font,fontSize:11,fontWeight:700,cursor:"pointer",marginRight:6,marginBottom:6},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"6px 14px",fontFamily:T.font,fontSize:11,fontWeight:700,cursor:"pointer",marginRight:6,marginBottom:6},
  btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 8px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:4,marginBottom:4},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  meshRow:(sel)=>({display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 8px",borderRadius:4,marginBottom:3,background:sel?"#001a14":"transparent",border:"1px solid "+(sel?T.teal:"transparent"),cursor:"pointer"}),
  meshName:(sel)=>({fontSize:11,color:sel?T.teal:T.text,fontWeight:sel?700:400}),
  tag:{fontSize:9,color:T.orange,background:"#1a0800",border:"1px solid "+T.orange,borderRadius:3,padding:"1px 4px",marginLeft:4},
};

export default function CharacterTargetingPanel({ scene, onTargetChange }) {
  const [meshList, setMeshList]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [showAll, setShowAll]       = useState(false);
  const outlineRef = useRef(null);

  // Scan scene for meshes
  function scanScene() {
    if (!scene) return;
    const found = [];
    scene.traverse(obj => {
      if (!obj.isMesh) return;
      found.push({
        id:       obj.uuid,
        name:     obj.name || `Mesh_${found.length}`,
        hasSkeleton: !!obj.skeleton,
        hasMorphs:   !!(obj.morphTargetInfluences?.length),
        polyCount:   obj.geometry?.attributes?.position?.count || 0,
        userData:    obj.userData,
      });
    });
    setMeshList(found);
  }

  useEffect(() => { scanScene(); }, [scene]);

  function selectMesh(id) {
    setSelectedId(id);
    if (!scene) return;
    // Highlight selected
    scene.traverse(obj => {
      if (!obj.isMesh) return;
      if (obj.uuid === id) {
        obj.userData.spxSelected = true;
        // Add outline effect via emissive
        if (obj.material) {
          obj.material.emissive = new THREE.Color(0x003322);
          obj.material.emissiveIntensity = 0.3;
          obj.material.needsUpdate = true;
        }
        onTargetChange && onTargetChange({ mesh: obj, name: obj.name, uuid: obj.uuid, skeleton: obj.skeleton });
      } else {
        if (obj.userData.spxSelected) {
          obj.userData.spxSelected = false;
          if (obj.material) {
            obj.material.emissive = new THREE.Color(0x000000);
            obj.material.emissiveIntensity = 0;
            obj.material.needsUpdate = true;
          }
        }
      }
    });
  }

  function clearSelection() {
    setSelectedId(null);
    scene?.traverse(obj => {
      if (obj.isMesh && obj.material) {
        obj.material.emissive = new THREE.Color(0x000000);
        obj.material.emissiveIntensity = 0;
        obj.material.needsUpdate = true;
        obj.userData.spxSelected = false;
      }
    });
    onTargetChange && onTargetChange(null);
  }

  function tagAsCharacter(id) {
    scene?.traverse(obj => {
      if (obj.isMesh && obj.uuid === id) {
        obj.userData.isCharacter = true;
        obj.name = obj.name || "Character";
      }
    });
    scanScene();
  }

  const filtered = meshList.filter(m =>
    (showAll || m.hasSkeleton || m.hasMorphs || m.userData?.isCharacter) &&
    m.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const selected = meshList.find(m => m.id === selectedId);

  return (
    <div style={S.root}>
      <div style={S.h2}>🎯 CHARACTER TARGETING</div>

      <div style={S.sec}>
        <div style={S.stat}>
          {selectedId ? `✓ Target: ${selected?.name}` : "No target selected — click mesh below"}
        </div>
        {selectedId && (
          <div style={{marginBottom:8}}>
            {selected?.hasSkeleton && <span style={S.tag}>RIGGED</span>}
            {selected?.hasMorphs   && <span style={S.tag}>MORPHS</span>}
            {selected?.userData?.isCharacter && <span style={S.tag}>CHARACTER</span>}
            <div style={{fontSize:10,color:T.muted,marginTop:4}}>{selected?.polyCount?.toLocaleString()} verts</div>
          </div>
        )}
        <button style={S.btn} onClick={scanScene}>🔍 Scan Scene</button>
        {selectedId && <button style={S.btnO} onClick={clearSelection}>✕ Clear Target</button>}
      </div>

      <div style={S.sec}>
        <input
          style={{...S.stat,width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"}}
          placeholder="Filter meshes..."
          value={filterText}
          onChange={e=>setFilterText(e.target.value)}
        />
        <label style={{...S.lbl,cursor:"pointer",marginBottom:8}}>
          <input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/> Show all meshes
        </label>

        {filtered.length === 0 && (
          <div style={{fontSize:11,color:T.muted}}>
            {showAll ? "No meshes in scene" : "No rigged/morph meshes found — enable 'Show all meshes'"}
          </div>
        )}

        {filtered.map(m => (
          <div key={m.id} style={S.meshRow(m.id===selectedId)} onClick={()=>selectMesh(m.id)}>
            <div>
              <span style={S.meshName(m.id===selectedId)}>{m.name}</span>
              {m.hasSkeleton && <span style={S.tag}>RIG</span>}
              {m.hasMorphs   && <span style={S.tag}>MORPH</span>}
              {m.userData?.isCharacter && <span style={S.tag}>CHAR</span>}
            </div>
            <button style={S.btnSm} onClick={e=>{e.stopPropagation();tagAsCharacter(m.id);}}>Tag</button>
          </div>
        ))}
      </div>

      <div style={S.sec}>
        <div style={S.h3}>How to Use</div>
        <div style={{fontSize:10,color:"#888",lineHeight:1.7}}>
          1. Click "Scan Scene" to list meshes<br/>
          2. Click a mesh to select it as target<br/>
          3. Open any generator panel — it will apply to this mesh only<br/>
          4. "Tag" marks a mesh as a character for quick filtering<br/>
          5. Import GLB/FBX → scan → select → apply generators<br/>
          6. Rigged meshes show RIG tag — generators pass skeleton prop
        </div>
      </div>
    </div>
  );
}
"""

# Write all files
print("Writing files...")
for path, content in FILES.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    short = path.replace("/workspaces/spx-mesh-editor/","")
    print(f"  ✓ {short}")

# Run the skin patch
exec(EXTRA_HUMAN_SKINS_PATCH)

print(f"\n✅ Done — {len(FILES)} files written + skin patch applied")
print("Run: npm run build && git add -A && git commit -m 'feat: ShapeShifter + 20 human skin conditions + character targeting' && git push")
