import React, { useState, useCallback } from "react";

const S = {
  panel: { background:"#0d1117", color:"#e6edf3", fontFamily:"JetBrains Mono,monospace", fontSize:12, padding:12, overflowY:"auto", maxHeight:"100%", boxSizing:"border-box" },
  h3:    { color:"#00ffc8", fontSize:13, fontWeight:700, marginBottom:10, borderBottom:"1px solid #21262d", paddingBottom:6 },
  section:{ marginBottom:12 },
  label: { display:"flex", justifyContent:"space-between", color:"#8b949e", marginBottom:2 },
  row:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 },
  slider:{ width:"100%", accentColor:"#00ffc8" },
  btn:   { width:"100%", padding:"8px 0", background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginTop:4 },
  btnSec:{ width:"100%", padding:"6px 0", background:"#21262d", color:"#e6edf3", border:"1px solid #30363d", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, cursor:"pointer", marginTop:4 },
  canvas:{ width:"100%", height:180, background:"#06060f", borderRadius:4, border:"1px solid #21262d", display:"block", marginBottom:8 },
  select:{ width:"100%", background:"#21262d", color:"#e6edf3", border:"1px solid #30363d", borderRadius:4, padding:"4px 6px", fontFamily:"JetBrains Mono,monospace", fontSize:11 },
  tag:   { display:"inline-block", background:"#21262d", color:"#8b949e", borderRadius:3, padding:"2px 6px", fontSize:10, marginRight:4, marginBottom:4, cursor:"pointer" },
  tagOn: { display:"inline-block", background:"#00ffc8", color:"#06060f", borderRadius:3, padding:"2px 6px", fontSize:10, marginRight:4, marginBottom:4, cursor:"pointer", fontWeight:700 },
};

const PRESETS = {
  neutral:    { headWidth:1.0, headHeight:1.2, jawWidth:0.85, chinHeight:0.15, cheekbone:0.6, foreheadHeight:0.4, eyeSize:0.12, eyeSpacing:0.28, eyeDepth:0.08, noseLength:0.22, noseWidth:0.12, noseBridge:0.08, lipWidth:0.38, lipThickness:0.08, lipCupDepth:0.04, earSize:0.18, earProtrusion:0.06, browThickness:0.06, browArch:0.04, browSpacing:0.26 },
  masculine:  { headWidth:1.1, headHeight:1.15, jawWidth:1.0, chinHeight:0.18, cheekbone:0.55, foreheadHeight:0.38, eyeSize:0.10, eyeSpacing:0.30, eyeDepth:0.10, noseLength:0.26, noseWidth:0.16, noseBridge:0.10, lipWidth:0.40, lipThickness:0.06, lipCupDepth:0.03, earSize:0.20, earProtrusion:0.08, browThickness:0.08, browArch:0.02, browSpacing:0.28 },
  feminine:   { headWidth:0.92, headHeight:1.25, jawWidth:0.75, chinHeight:0.12, cheekbone:0.68, foreheadHeight:0.42, eyeSize:0.14, eyeSpacing:0.26, eyeDepth:0.06, noseLength:0.18, noseWidth:0.10, noseBridge:0.06, lipWidth:0.36, lipThickness:0.10, lipCupDepth:0.05, earSize:0.16, earProtrusion:0.04, browThickness:0.05, browArch:0.06, browSpacing:0.24 },
  child:      { headWidth:0.88, headHeight:1.0,  jawWidth:0.70, chinHeight:0.10, cheekbone:0.72, foreheadHeight:0.52, eyeSize:0.16, eyeSpacing:0.24, eyeDepth:0.04, noseLength:0.14, noseWidth:0.10, noseBridge:0.04, lipWidth:0.30, lipThickness:0.09, lipCupDepth:0.04, earSize:0.14, earProtrusion:0.04, browThickness:0.04, browArch:0.03, browSpacing:0.22 },
  elder:      { headWidth:0.98, headHeight:1.18, jawWidth:0.82, chinHeight:0.16, cheekbone:0.52, foreheadHeight:0.44, eyeSize:0.10, eyeSpacing:0.29, eyeDepth:0.12, noseLength:0.28, noseWidth:0.14, noseBridge:0.12, lipWidth:0.34, lipThickness:0.05, lipCupDepth:0.03, earSize:0.22, earProtrusion:0.07, browThickness:0.05, browArch:0.01, browSpacing:0.27 },
  anime:      { headWidth:0.90, headHeight:1.35, jawWidth:0.65, chinHeight:0.08, cheekbone:0.80, foreheadHeight:0.55, eyeSize:0.20, eyeSpacing:0.22, eyeDepth:0.03, noseLength:0.12, noseWidth:0.06, noseBridge:0.02, lipWidth:0.28, lipThickness:0.06, lipCupDepth:0.03, earSize:0.14, earProtrusion:0.03, browThickness:0.04, browArch:0.05, browSpacing:0.20 },
};

const ETHNICITIES = ["Generic","East Asian","South Asian","African","European","Latino","Middle Eastern","Southeast Asian"];
const EXPRESSIONS = ["Neutral","Smile","Frown","Surprise","Anger","Fear","Disgust","Contempt"];
const FACE_FEATURES = ["Freckles","Dimples","Cleft Chin","Wide Nose","Hooded Eyes","Monolid","Strong Jaw","High Cheekbones","Bushy Brows","Full Lips"];

function Slider({ label, value, min, max, step=0.01, onChange }) {
  return (
    <div style={S.section}>
      <div style={S.label}><span>{label}</span><span style={{color:"#00ffc8"}}>{value.toFixed(2)}</span></div>
      <input type="range" style={S.slider} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function FaceGeneratorPanel({ addObject }) {
  const [params, setParams] = useState(PRESETS.neutral);
  const [ethnicity, setEthnicity] = useState("Generic");
  const [expression, setExpression] = useState("Neutral");
  const [features, setFeatures] = useState([]);
  const [age, setAge] = useState(25);
  const [asymmetry, setAsymmetry] = useState(0.0);
  const [subdivision, setSubdivision] = useState(2);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = useCallback((key, val) => setParams(p => ({ ...p, [key]: val })), []);

  const applyPreset = (name) => setParams(PRESETS[name]);

  const toggleFeature = (f) => setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const generate = () => {
    if (!addObject) return;
    addObject({
      type: "face",
      params: { ...params, ethnicity, expression, features, age, asymmetry, subdivision },
      name: `Face_${ethnicity}_${expression}_${Date.now()}`,
    });
  };

  const randomize = () => {
    const keys = Object.keys(PRESETS.neutral);
    const rand = {};
    keys.forEach(k => {
      const base = PRESETS.neutral[k];
      rand[k] = Math.max(0.01, base + (Math.random() - 0.5) * 0.3);
    });
    setParams(rand);
    setAge(Math.floor(Math.random() * 60) + 10);
    setAsymmetry(Math.random() * 0.1);
  };

  return (
    <div style={S.panel}>
      <div style={S.h3}>👤 Face Generator</div>

      {/* Presets */}
      <div style={S.section}>
        <div style={{...S.label, marginBottom:6}}><span>Presets</span></div>
        <div style={{display:"flex", flexWrap:"wrap", gap:4}}>
          {Object.keys(PRESETS).map(p => (
            <span key={p} style={S.tag} onClick={() => applyPreset(p)}>{p}</span>
          ))}
        </div>
      </div>

      {/* Ethnicity + Expression */}
      <div style={S.row}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Ethnicity</span></div>
          <select style={S.select} value={ethnicity} onChange={e => setEthnicity(e.target.value)}>
            {ETHNICITIES.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Expression</span></div>
          <select style={S.select} value={expression} onChange={e => setExpression(e.target.value)}>
            {EXPRESSIONS.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <Slider label="Age" value={age} min={5} max={90} step={1} onChange={v => setAge(v)} />

      {/* Head Shape */}
      <div style={{...S.label, marginBottom:6, marginTop:8}}><span style={{color:"#00ffc8"}}>Head Shape</span></div>
      <Slider label="Head Width"       value={params.headWidth}      min={0.7} max={1.3} onChange={v => set("headWidth", v)} />
      <Slider label="Head Height"      value={params.headHeight}     min={0.8} max={1.6} onChange={v => set("headHeight", v)} />
      <Slider label="Jaw Width"        value={params.jawWidth}       min={0.5} max={1.2} onChange={v => set("jawWidth", v)} />
      <Slider label="Chin Height"      value={params.chinHeight}     min={0.05} max={0.3} onChange={v => set("chinHeight", v)} />
      <Slider label="Cheekbone"        value={params.cheekbone}      min={0.3} max={0.9} onChange={v => set("cheekbone", v)} />
      <Slider label="Forehead Height"  value={params.foreheadHeight} min={0.2} max={0.7} onChange={v => set("foreheadHeight", v)} />

      {/* Eyes */}
      <div style={{...S.label, marginBottom:6, marginTop:8}}><span style={{color:"#00ffc8"}}>Eyes</span></div>
      <Slider label="Eye Size"         value={params.eyeSize}     min={0.06} max={0.22} onChange={v => set("eyeSize", v)} />
      <Slider label="Eye Spacing"      value={params.eyeSpacing}  min={0.18} max={0.40} onChange={v => set("eyeSpacing", v)} />
      <Slider label="Eye Depth"        value={params.eyeDepth}    min={0.0}  max={0.16} onChange={v => set("eyeDepth", v)} />

      {/* Nose */}
      <div style={{...S.label, marginBottom:6, marginTop:8}}><span style={{color:"#00ffc8"}}>Nose</span></div>
      <Slider label="Nose Length"      value={params.noseLength}  min={0.08} max={0.36} onChange={v => set("noseLength", v)} />
      <Slider label="Nose Width"       value={params.noseWidth}   min={0.06} max={0.22} onChange={v => set("noseWidth", v)} />
      <Slider label="Nose Bridge"      value={params.noseBridge}  min={0.02} max={0.16} onChange={v => set("noseBridge", v)} />

      {/* Lips */}
      <div style={{...S.label, marginBottom:6, marginTop:8}}><span style={{color:"#00ffc8"}}>Lips</span></div>
      <Slider label="Lip Width"        value={params.lipWidth}      min={0.20} max={0.55} onChange={v => set("lipWidth", v)} />
      <Slider label="Lip Thickness"    value={params.lipThickness}  min={0.02} max={0.16} onChange={v => set("lipThickness", v)} />
      <Slider label="Cupid Bow Depth"  value={params.lipCupDepth}   min={0.0}  max={0.10} onChange={v => set("lipCupDepth", v)} />

      {/* Brows */}
      <div style={{...S.label, marginBottom:6, marginTop:8}}><span style={{color:"#00ffc8"}}>Eyebrows</span></div>
      <Slider label="Brow Thickness"   value={params.browThickness} min={0.02} max={0.12} onChange={v => set("browThickness", v)} />
      <Slider label="Brow Arch"        value={params.browArch}      min={0.0}  max={0.12} onChange={v => set("browArch", v)} />
      <Slider label="Brow Spacing"     value={params.browSpacing}   min={0.18} max={0.38} onChange={v => set("browSpacing", v)} />

      {/* Ears */}
      <div style={{...S.label, marginBottom:6, marginTop:8}}><span style={{color:"#00ffc8"}}>Ears</span></div>
      <Slider label="Ear Size"         value={params.earSize}       min={0.08} max={0.30} onChange={v => set("earSize", v)} />
      <Slider label="Ear Protrusion"   value={params.earProtrusion} min={0.0}  max={0.14} onChange={v => set("earProtrusion", v)} />

      {/* Advanced */}
      <div style={{...S.label, marginBottom:6, marginTop:8, cursor:"pointer"}} onClick={() => setShowAdvanced(!showAdvanced)}>
        <span style={{color:"#00ffc8"}}>Advanced {showAdvanced ? "▲" : "▼"}</span>
      </div>
      {showAdvanced && (
        <>
          <Slider label="Asymmetry"     value={asymmetry}    min={0} max={0.2} onChange={setAsymmetry} />
          <Slider label="Subdivision"   value={subdivision}  min={0} max={4} step={1} onChange={setSubdivision} />
          <div style={{...S.label, marginBottom:6, marginTop:8}}><span>Face Features</span></div>
          <div style={{display:"flex", flexWrap:"wrap"}}>
            {FACE_FEATURES.map(f => (
              <span key={f} style={features.includes(f) ? S.tagOn : S.tag} onClick={() => toggleFeature(f)}>{f}</span>
            ))}
          </div>
        </>
      )}

      <button style={S.btn} onClick={generate}>Generate Face</button>
      <button style={S.btnSec} onClick={randomize}>🎲 Randomize</button>
      <button style={S.btnSec} onClick={() => setParams(PRESETS.neutral)}>Reset</button>
    </div>
  );
}
