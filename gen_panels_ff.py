#!/usr/bin/env python3
"""
gen_panels_ff.py — Production-quality Face and Foliage generator panels.
Run: python3 gen_panels_ff.py
"""
import os

BASE = "/workspaces/spx-mesh-editor/src/panels/generators"
os.makedirs(BASE, exist_ok=True)

def write(path, content):
    with open(path, 'w') as f:
        f.write(content)
    lines = content.count('\n') + 1
    code  = sum(1 for l in content.split('\n')
                if l.strip() and not l.strip().startswith('//') and l.strip() != '')
    print(f"  {lines:4d} lines  {code:3d} code  {os.path.basename(path)}")

# =============================================================================
# FaceGeneratorPanel.jsx
# =============================================================================
write(f"{BASE}/FaceGeneratorPanel.jsx", r'''import React, { useState, useCallback } from "react";

function Slider({ label, value, min=0, max=1, step=0.01, onChange, unit="" }) {
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#8b949e", marginBottom:2 }}>
        <span>{label}</span>
        <span style={{ color:"#00ffc8", fontWeight:700 }}>
          {typeof value==="number" ? (step<0.1 ? value.toFixed(2) : Math.round(value)) : value}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width:"100%", accentColor:"#00ffc8", cursor:"pointer", height:16 }} />
    </div>
  );
}
function Select({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom:6 }}>
      {label && <div style={{ fontSize:10, color:"#8b949e", marginBottom:2 }}>{label}</div>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width:"100%", background:"#161b22", color:"#e6edf3",
        border:"1px solid #30363d", borderRadius:4, padding:"4px 8px", fontSize:11, cursor:"pointer"
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Check({ label, value, onChange }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, color:"#c9d1d9", cursor:"pointer", marginBottom:5 }}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        style={{ accentColor:"#00ffc8", width:13, height:13 }} />
      {label}
    </label>
  );
}
function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
      <span style={{ fontSize:10, color:"#8b949e", flex:1 }}>{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width:32, height:22, border:"none", cursor:"pointer", borderRadius:3 }} />
      <span style={{ fontSize:9, color:"#555", fontFamily:"monospace" }}>{value}</span>
    </div>
  );
}
function Badges({ items, active, onSelect }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:8 }}>
      {items.map(item => (
        <button key={item} onClick={() => onSelect(item)} style={{
          padding:"3px 9px", fontSize:9, borderRadius:4, cursor:"pointer", fontWeight:600,
          background: active===item ? "#00ffc8" : "#21262d",
          color:      active===item ? "#0d1117" : "#8b949e",
          border:     `1px solid ${active===item ? "#00ffc8" : "#30363d"}`,
        }}>{item}</button>
      ))}
    </div>
  );
}
function Section({ title, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom:8, border:"1px solid #21262d", borderRadius:6, overflow:"hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{
        background:"#161b22", padding:"6px 10px", cursor:"pointer",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        fontSize:11, fontWeight:700, color:"#00ffc8", userSelect:"none",
      }}>
        <span>{title}</span>
        <span style={{ fontSize:9, opacity:0.7 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ padding:"8px 10px", background:"#0d1117" }}>{children}</div>}
    </div>
  );
}
const GenBtn = ({ label, onClick }) => (
  <button onClick={onClick} style={{
    width:"100%", background:"#00ffc8", color:"#0d1117", border:"none",
    borderRadius:6, padding:"9px 0", cursor:"pointer", fontWeight:700,
    fontSize:13, marginTop:8, letterSpacing:0.5, fontFamily:"JetBrains Mono,monospace",
  }}>{label}</button>
);
const RandBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    background:"#21262d", color:"#8b949e", border:"1px solid #30363d",
    borderRadius:4, padding:"7px 12px", cursor:"pointer", fontSize:12, marginTop:8, marginRight:6,
  }}>🎲</button>
);
const P = { fontFamily:"JetBrains Mono,monospace", color:"#e6edf3", fontSize:12, userSelect:"none", width:"100%" };

const FACE_PRESETS = {
  "Young Male":    { gender:"Male",       age:24, ethnicity:"Mixed",       faceShape:"Oval",    skinTone:"#c8905a", jawWidth:0.55, cheekbone:0.50, foreheadH:0.50, eyeSize:0.50, noseW:0.50, lipThick:0.40, asymmetry:0.04, wrinkles:0.00 },
  "Young Female":  { gender:"Female",     age:22, ethnicity:"Mixed",       faceShape:"Heart",   skinTone:"#d4a070", jawWidth:0.38, cheekbone:0.60, foreheadH:0.52, eyeSize:0.60, noseW:0.42, lipThick:0.58, asymmetry:0.03, wrinkles:0.00 },
  "Elder Male":    { gender:"Male",       age:68, ethnicity:"European",    faceShape:"Square",  skinTone:"#b07848", jawWidth:0.60, cheekbone:0.45, foreheadH:0.55, eyeSize:0.42, noseW:0.58, lipThick:0.35, asymmetry:0.08, wrinkles:0.75 },
  "Elder Female":  { gender:"Female",     age:65, ethnicity:"Asian",       faceShape:"Oval",    skinTone:"#c89060", jawWidth:0.40, cheekbone:0.50, foreheadH:0.48, eyeSize:0.45, noseW:0.42, lipThick:0.40, asymmetry:0.06, wrinkles:0.70 },
  "East Asian":    { gender:"Non-Binary", age:28, ethnicity:"East Asian",  faceShape:"Round",   skinTone:"#d4a878", jawWidth:0.45, cheekbone:0.55, foreheadH:0.48, eyeSize:0.52, noseW:0.44, lipThick:0.48, asymmetry:0.03, wrinkles:0.00 },
  "African":       { gender:"Male",       age:30, ethnicity:"African",     faceShape:"Oval",    skinTone:"#5a3010", jawWidth:0.58, cheekbone:0.62, foreheadH:0.52, eyeSize:0.56, noseW:0.60, lipThick:0.65, asymmetry:0.04, wrinkles:0.05 },
  "Anime Style":   { gender:"Female",     age:18, ethnicity:"East Asian",  faceShape:"Heart",   skinTone:"#f0d0b0", jawWidth:0.30, cheekbone:0.45, foreheadH:0.60, eyeSize:0.90, noseW:0.28, lipThick:0.45, asymmetry:0.00, wrinkles:0.00 },
  "Stylized Hero": { gender:"Male",       age:32, ethnicity:"Mixed",       faceShape:"Square",  skinTone:"#c07848", jawWidth:0.72, cheekbone:0.68, foreheadH:0.58, eyeSize:0.48, noseW:0.52, lipThick:0.38, asymmetry:0.05, wrinkles:0.10 },
};

const FACE_SHAPES  = ["Oval","Round","Square","Heart","Diamond","Oblong","Triangle"];
const ETHNICITIES  = ["Mixed","East Asian","South Asian","African","European","Latino","Middle Eastern","Scandinavian"];
const GENDERS      = ["Male","Female","Non-Binary","Masculine","Feminine"];
const EYE_SHAPES   = ["Almond","Round","Hooded","Monolid","Upturned","Downturned","Wide","Narrow"];
const NOSE_TYPES   = ["Straight","Button","Aquiline","Snub","Bulbous","Flat","Hawk","Greek"];
const LIP_TYPES    = ["Thin","Medium","Full","Heart","Bow","Wide","Downturned"];
const BROW_TYPES   = ["Straight","Arched","Flat","Bushy","Thin","Angular"];
const EXPRESSIONS  = ["Neutral","Smile","Serious","Concerned","Surprised","Smug"];

export default function FaceGeneratorPanel({ onGenerate }) {
  const [activePreset,   setActivePreset]   = useState("Young Male");
  const [faceShape,      setFaceShape]      = useState("Oval");
  const [ethnicity,      setEthnicity]      = useState("Mixed");
  const [gender,         setGender]         = useState("Male");
  const [age,            setAge]            = useState(24);
  const [expression,     setExpression]     = useState("Neutral");
  const [skinTone,       setSkinTone]       = useState("#c8905a");
  const [asymmetry,      setAsymmetry]      = useState(0.04);
  const [seed,           setSeed]           = useState(42);
  // Head structure
  const [jawWidth,       setJawWidth]       = useState(0.55);
  const [jawSharpness,   setJawSharpness]   = useState(0.40);
  const [cheekbone,      setCheekbone]      = useState(0.50);
  const [foreheadH,      setForeheadH]      = useState(0.50);
  const [foreheadW,      setForeheadW]      = useState(0.50);
  const [chinPoint,      setChinPoint]      = useState(0.50);
  const [faceLength,     setFaceLength]     = useState(0.50);
  // Eyes
  const [eyeShape,       setEyeShape]       = useState("Almond");
  const [eyeSpacing,     setEyeSpacing]     = useState(0.50);
  const [eyeSize,        setEyeSize]        = useState(0.50);
  const [eyeAngle,       setEyeAngle]       = useState(0.00);
  const [eyeDepth,       setEyeDepth]       = useState(0.40);
  const [irisColor,      setIrisColor]      = useState("#4a7acc");
  const [pupilSize,      setPupilSize]      = useState(0.40);
  // Brows
  const [browType,       setBrowType]       = useState("Arched");
  const [browHeight,     setBrowHeight]     = useState(0.50);
  const [browThickness,  setBrowThickness]  = useState(0.40);
  const [browColor,      setBrowColor]      = useState("#2a1a08");
  // Nose
  const [noseType,       setNoseType]       = useState("Straight");
  const [noseBridge,     setNoseBridge]     = useState(0.50);
  const [noseWidth,      setNoseWidth]      = useState(0.50);
  const [nostrilFlare,   setNostrilFlare]   = useState(0.40);
  const [noseLength,     setNoseLength]     = useState(0.50);
  const [noseTip,        setNoseTip]        = useState(0.50);
  // Lips
  const [lipType,        setLipType]        = useState("Medium");
  const [lipThickness,   setLipThickness]   = useState(0.50);
  const [lipWidth,       setLipWidth]       = useState(0.50);
  const [lipColor,       setLipColor]       = useState("#b06070");
  const [mouthAngle,     setMouthAngle]     = useState(0.00);
  // Skin detail
  const [wrinkles,       setWrinkles]       = useState(0.00);
  const [pores,          setPores]          = useState(0.30);
  const [freckles,       setFreckles]       = useState(0.00);
  const [subsurface,     setSubsurface]     = useState(0.60);
  // Output
  const [polyLevel,      setPolyLevel]      = useState("High");
  const [addBlendshapes, setAddBlendshapes] = useState(true);
  const [addTeeth,       setAddTeeth]       = useState(true);
  const [addEyelashes,   setAddEyelashes]   = useState(true);

  const applyPreset = useCallback((name) => {
    const p = FACE_PRESETS[name];
    if (!p) return;
    setActivePreset(name);
    setGender(p.gender);         setAge(p.age);
    setEthnicity(p.ethnicity);   setFaceShape(p.faceShape);
    setSkinTone(p.skinTone);     setJawWidth(p.jawWidth);
    setCheekbone(p.cheekbone);   setForeheadH(p.foreheadH);
    setEyeSize(p.eyeSize);       setNoseWidth(p.noseW);
    setLipThickness(p.lipThick); setAsymmetry(p.asymmetry);
    setWrinkles(p.wrinkles);
  }, []);

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a,b) => parseFloat((a + Math.random()*(b-a)).toFixed(2));
    setFaceShape(pick(FACE_SHAPES));   setEthnicity(pick(ETHNICITIES));
    setGender(pick(GENDERS));         setExpression(pick(EXPRESSIONS));
    setAge(Math.round(18 + Math.random()*55));
    setJawWidth(rn(0.3,0.75));        setCheekbone(rn(0.3,0.8));
    setEyeSize(rn(0.35,0.75));        setNoseWidth(rn(0.3,0.7));
    setLipThickness(rn(0.3,0.8));     setAsymmetry(rn(0,0.15));
    setEyeShape(pick(EYE_SHAPES));    setNoseType(pick(NOSE_TYPES));
    setLipType(pick(LIP_TYPES));      setBrowType(pick(BROW_TYPES));
    setSeed(Math.floor(Math.random()*9999));
  }, []);

  const handleGenerate = useCallback(() => {
    onGenerate?.({
      base:      { faceShape, ethnicity, gender, age, expression, skinTone, asymmetry, seed },
      structure: { jawWidth, jawSharpness, cheekbone, foreheadH, foreheadW, chinPoint, faceLength },
      eyes:      { eyeShape, eyeSpacing, eyeSize, eyeAngle, eyeDepth, irisColor, pupilSize },
      brows:     { browType, browHeight, browThickness, browColor },
      nose:      { noseType, noseBridge, noseWidth, nostrilFlare, noseLength, noseTip },
      lips:      { lipType, lipThickness, lipWidth, lipColor, mouthAngle },
      skin:      { wrinkles, pores, freckles, subsurface },
      output:    { polyLevel, addBlendshapes, addTeeth, addEyelashes },
    });
  }, [faceShape, ethnicity, gender, age, expression, skinTone, asymmetry, seed,
      jawWidth, jawSharpness, cheekbone, foreheadH, foreheadW, chinPoint, faceLength,
      eyeShape, eyeSpacing, eyeSize, eyeAngle, eyeDepth, irisColor, pupilSize,
      browType, browHeight, browThickness, browColor,
      noseType, noseBridge, noseWidth, nostrilFlare, noseLength, noseTip,
      lipType, lipThickness, lipWidth, lipColor, mouthAngle,
      wrinkles, pores, freckles, subsurface,
      polyLevel, addBlendshapes, addTeeth, addEyelashes, onGenerate]);

  return (
    <div style={P}>
      {/* Presets */}
      <Section title="👤 Presets">
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {Object.keys(FACE_PRESETS).map(name => (
            <button key={name} onClick={() => applyPreset(name)} style={{
              padding:"4px 9px", fontSize:9, borderRadius:4, cursor:"pointer", fontWeight:600,
              background: activePreset===name ? "#00ffc8" : "#21262d",
              color:      activePreset===name ? "#0d1117" : "#8b949e",
              border:     `1px solid ${activePreset===name ? "#00ffc8" : "#30363d"}`,
            }}>{name}</button>
          ))}
        </div>
      </Section>

      {/* Base */}
      <Section title="🧬 Base">
        <Badges items={FACE_SHAPES}  active={faceShape}  onSelect={setFaceShape}  />
        <Select label="Ethnicity"    value={ethnicity}   options={ETHNICITIES}    onChange={setEthnicity}   />
        <Select label="Gender"       value={gender}      options={GENDERS}        onChange={setGender}      />
        <Select label="Expression"   value={expression}  options={EXPRESSIONS}    onChange={setExpression}  />
        <Slider label="Age"          value={age} min={5} max={95} step={1} onChange={setAge} unit=" yrs" />
        <ColorRow label="Skin Tone"  value={skinTone}    onChange={setSkinTone}   />
        <Slider label="Asymmetry"    value={asymmetry} min={0} max={0.3} step={0.005} onChange={setAsymmetry} />
        <Slider label="Random Seed"  value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>

      {/* Head Structure */}
      <Section title="💀 Head Structure">
        <Slider label="Jaw Width"       value={jawWidth}     onChange={setJawWidth}     />
        <Slider label="Jaw Sharpness"   value={jawSharpness} onChange={setJawSharpness} />
        <Slider label="Cheekbone"       value={cheekbone}    onChange={setCheekbone}    />
        <Slider label="Forehead Height" value={foreheadH}    onChange={setForeheadH}    />
        <Slider label="Forehead Width"  value={foreheadW}    onChange={setForeheadW}    />
        <Slider label="Face Length"     value={faceLength}   onChange={setFaceLength}   />
        <Slider label="Chin Point"      value={chinPoint}    onChange={setChinPoint}    />
      </Section>

      {/* Eyes */}
      <Section title="👁 Eyes">
        <Badges   items={EYE_SHAPES}  active={eyeShape}  onSelect={setEyeShape}  />
        <Slider   label="Spacing"     value={eyeSpacing} onChange={setEyeSpacing} />
        <Slider   label="Size"        value={eyeSize}    onChange={setEyeSize}    />
        <Slider   label="Tilt"        value={eyeAngle} min={-0.3} max={0.3} step={0.01} onChange={setEyeAngle} />
        <Slider   label="Depth"       value={eyeDepth}   onChange={setEyeDepth}   />
        <Slider   label="Pupil Size"  value={pupilSize}  onChange={setPupilSize}  />
        <ColorRow label="Iris Color"  value={irisColor}  onChange={setIrisColor}  />
      </Section>

      {/* Brows */}
      <Section title="Brows">
        <Badges   items={BROW_TYPES}   active={browType}      onSelect={setBrowType}      />
        <Slider   label="Height"       value={browHeight}     onChange={setBrowHeight}     />
        <Slider   label="Thickness"    value={browThickness}  onChange={setBrowThickness}  />
        <ColorRow label="Brow Color"   value={browColor}      onChange={setBrowColor}      />
      </Section>

      {/* Nose */}
      <Section title="👃 Nose">
        <Badges items={NOSE_TYPES}     active={noseType}      onSelect={setNoseType}      />
        <Slider label="Bridge"         value={noseBridge}     onChange={setNoseBridge}     />
        <Slider label="Width"          value={noseWidth}      onChange={setNoseWidth}      />
        <Slider label="Length"         value={noseLength}     onChange={setNoseLength}     />
        <Slider label="Tip"            value={noseTip}        onChange={setNoseTip}        />
        <Slider label="Nostril Flare"  value={nostrilFlare}   onChange={setNostrilFlare}   />
      </Section>

      {/* Lips */}
      <Section title="👄 Lips">
        <Badges   items={LIP_TYPES}    active={lipType}       onSelect={setLipType}       />
        <Slider   label="Thickness"    value={lipThickness}   onChange={setLipThickness}   />
        <Slider   label="Width"        value={lipWidth}       onChange={setLipWidth}       />
        <Slider   label="Mouth Angle"  value={mouthAngle} min={-0.2} max={0.2} step={0.01} onChange={setMouthAngle} />
        <ColorRow label="Lip Color"    value={lipColor}       onChange={setLipColor}       />
      </Section>

      {/* Skin Detail */}
      <Section title="🔬 Skin Detail" defaultOpen={false}>
        <Slider label="Wrinkles"    value={wrinkles}   onChange={setWrinkles}   />
        <Slider label="Pore Detail" value={pores}      onChange={setPores}      />
        <Slider label="Freckles"    value={freckles}   onChange={setFreckles}   />
        <Slider label="Subsurface"  value={subsurface} onChange={setSubsurface} />
      </Section>

      {/* Output */}
      <Section title="⚙ Output" defaultOpen={false}>
        <Select label="Poly Budget"  value={polyLevel} options={["Low","Mid","High","Ultra"]} onChange={setPolyLevel} />
        <Check  label="Blendshapes"  value={addBlendshapes} onChange={setAddBlendshapes} />
        <Check  label="Teeth"        value={addTeeth}       onChange={setAddTeeth}       />
        <Check  label="Eyelashes"    value={addEyelashes}   onChange={setAddEyelashes}   />
      </Section>

      <div style={{ display:"flex", gap:6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="⚡ Generate Face" onClick={handleGenerate} />
      </div>
    </div>
  );
}
''')

# =============================================================================
# FoliageGeneratorPanel.jsx
# =============================================================================
write(f"{BASE}/FoliageGeneratorPanel.jsx", r'''import React, { useState, useCallback } from "react";

function Slider({ label, value, min=0, max=1, step=0.01, onChange, unit="" }) {
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#8b949e", marginBottom:2 }}>
        <span>{label}</span>
        <span style={{ color:"#00ffc8", fontWeight:700 }}>
          {typeof value==="number" ? (step<0.1 ? value.toFixed(2) : Math.round(value)) : value}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width:"100%", accentColor:"#00ffc8", cursor:"pointer", height:16 }} />
    </div>
  );
}
function Select({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom:6 }}>
      {label && <div style={{ fontSize:10, color:"#8b949e", marginBottom:2 }}>{label}</div>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width:"100%", background:"#161b22", color:"#e6edf3",
        border:"1px solid #30363d", borderRadius:4, padding:"4px 8px", fontSize:11, cursor:"pointer"
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Check({ label, value, onChange }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, color:"#c9d1d9", cursor:"pointer", marginBottom:5 }}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        style={{ accentColor:"#00ffc8", width:13, height:13 }} />
      {label}
    </label>
  );
}
function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
      <span style={{ fontSize:10, color:"#8b949e", flex:1 }}>{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width:32, height:22, border:"none", cursor:"pointer", borderRadius:3 }} />
      <span style={{ fontSize:9, color:"#555", fontFamily:"monospace" }}>{value}</span>
    </div>
  );
}
function Badges({ items, active, onSelect }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:8 }}>
      {items.map(item => (
        <button key={item} onClick={() => onSelect(item)} style={{
          padding:"3px 9px", fontSize:9, borderRadius:4, cursor:"pointer", fontWeight:600,
          background: active===item ? "#00ffc8" : "#21262d",
          color:      active===item ? "#0d1117" : "#8b949e",
          border:     `1px solid ${active===item ? "#00ffc8" : "#30363d"}`,
        }}>{item}</button>
      ))}
    </div>
  );
}
function Section({ title, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom:8, border:"1px solid #21262d", borderRadius:6, overflow:"hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{
        background:"#161b22", padding:"6px 10px", cursor:"pointer",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        fontSize:11, fontWeight:700, color:"#00ffc8", userSelect:"none",
      }}>
        <span>{title}</span>
        <span style={{ fontSize:9, opacity:0.7 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ padding:"8px 10px", background:"#0d1117" }}>{children}</div>}
    </div>
  );
}
function NumInput({ label, value, min, max, step=1, onChange, unit="" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
      <span style={{ fontSize:10, color:"#8b949e", flex:1 }}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width:64, background:"#161b22", color:"#e6edf3", border:"1px solid #30363d",
          padding:"3px 5px", borderRadius:3, fontSize:11, textAlign:"right" }} />
      {unit && <span style={{ fontSize:9, color:"#555" }}>{unit}</span>}
    </div>
  );
}
const GenBtn = ({ label, onClick }) => (
  <button onClick={onClick} style={{
    width:"100%", background:"#00ffc8", color:"#0d1117", border:"none",
    borderRadius:6, padding:"9px 0", cursor:"pointer", fontWeight:700,
    fontSize:13, marginTop:8, letterSpacing:0.5, fontFamily:"JetBrains Mono,monospace",
  }}>{label}</button>
);
const RandBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    background:"#21262d", color:"#8b949e", border:"1px solid #30363d",
    borderRadius:4, padding:"7px 12px", cursor:"pointer", fontSize:12, marginTop:8, marginRight:6,
  }}>🎲</button>
);
const P = { fontFamily:"JetBrains Mono,monospace", color:"#e6edf3", fontSize:12, userSelect:"none", width:"100%" };

const FOLIAGE_PRESETS = {
  "Oak Tree":        { foliageType:"Deciduous Tree", season:"Summer",  trunkH:0.65, trunkGirth:0.55, trunkCurve:0.20, branchCount:0.75, branchLen:0.55, leafDensity:0.80, leafSize:0.45, barkColor:"#5a3820", leafColor:"#2a6010", leafColor2:"#4a8020" },
  "Pine Tree":       { foliageType:"Conifer",        season:"Winter",  trunkH:0.80, trunkGirth:0.35, trunkCurve:0.05, branchCount:0.85, branchLen:0.40, leafDensity:0.90, leafSize:0.30, barkColor:"#4a2a10", leafColor:"#1a4010", leafColor2:"#2a5a20" },
  "Palm Tree":       { foliageType:"Palm Tree",      season:"Tropical",trunkH:0.90, trunkGirth:0.25, trunkCurve:0.30, branchCount:0.30, branchLen:0.70, leafDensity:0.70, leafSize:0.70, barkColor:"#8a6030", leafColor:"#3a7020", leafColor2:"#4a9030" },
  "Cherry Blossom":  { foliageType:"Cherry Blossom", season:"Spring",  trunkH:0.55, trunkGirth:0.40, trunkCurve:0.35, branchCount:0.70, branchLen:0.50, leafDensity:0.85, leafSize:0.35, barkColor:"#6a3828", leafColor:"#f0b0c0", leafColor2:"#e080a0" },
  "Willow Tree":     { foliageType:"Willow",         season:"Summer",  trunkH:0.70, trunkGirth:0.50, trunkCurve:0.40, branchCount:0.80, branchLen:0.80, leafDensity:0.75, leafSize:0.30, barkColor:"#6a5030", leafColor:"#6a9030", leafColor2:"#4a7020" },
  "Dead Tree":       { foliageType:"Dead Tree",      season:"Winter",  trunkH:0.60, trunkGirth:0.45, trunkCurve:0.50, branchCount:0.60, branchLen:0.45, leafDensity:0.00, leafSize:0.20, barkColor:"#303028", leafColor:"#303028", leafColor2:"#303028" },
  "Tropical Bush":   { foliageType:"Tropical Shrub", season:"Tropical",trunkH:0.20, trunkGirth:0.60, trunkCurve:0.15, branchCount:0.90, branchLen:0.35, leafDensity:0.95, leafSize:0.55, barkColor:"#4a3820", leafColor:"#207020", leafColor2:"#309030" },
  "Autumn Oak":      { foliageType:"Deciduous Tree", season:"Autumn",  trunkH:0.60, trunkGirth:0.55, trunkCurve:0.25, branchCount:0.70, branchLen:0.55, leafDensity:0.65, leafSize:0.48, barkColor:"#5a3820", leafColor:"#c05010", leafColor2:"#e08020" },
};

const FOLIAGE_TYPES = ["Deciduous Tree","Conifer","Palm Tree","Oak","Willow","Birch","Dead Tree",
  "Bamboo","Cactus","Fern","Tropical Shrub","Flower Bush","Grass Tuft","Mushroom","Vine","Cherry Blossom","Baobab","Cypress"];
const SEASONS       = ["Spring","Summer","Autumn","Winter","Tropical","Desert","Arctic"];
const BARK_TYPES    = ["Smooth","Rough","Peeling","Cracked","Mossy","Scaly","Fibrous","Birch White"];
const LEAF_SHAPES   = ["Oval","Maple","Fan","Pine Needle","Tropical","Compound","Fern Frond","Heart","Lance"];

export default function FoliageGeneratorPanel({ onGenerate }) {
  const [activePreset,   setActivePreset]   = useState("Oak Tree");
  const [foliageType,    setFoliageType]    = useState("Deciduous Tree");
  const [season,         setSeason]         = useState("Summer");
  const [seed,           setSeed]           = useState(42);
  // Trunk
  const [trunkH,         setTrunkH]         = useState(0.65);
  const [trunkGirth,     setTrunkGirth]     = useState(0.55);
  const [trunkTaper,     setTrunkTaper]     = useState(0.40);
  const [trunkCurve,     setTrunkCurve]     = useState(0.20);
  const [barkType,       setBarkType]       = useState("Rough");
  const [barkColor,      setBarkColor]      = useState("#5a3820");
  const [barkColor2,     setBarkColor2]     = useState("#3a2010");
  const [showRoots,      setShowRoots]      = useState(false);
  const [rootSpread,     setRootSpread]     = useState(0.30);
  // Branches
  const [branchCount,    setBranchCount]    = useState(0.75);
  const [branchLen,      setBranchLen]      = useState(0.55);
  const [branchAngle,    setBranchAngle]    = useState(0.50);
  const [branchDroop,    setBranchDroop]    = useState(0.20);
  const [branchRecurse,  setBranchRecurse]  = useState(3);
  const [branchRandom,   setBranchRandom]   = useState(0.30);
  // Leaves
  const [leafShape,      setLeafShape]      = useState("Oval");
  const [leafDensity,    setLeafDensity]    = useState(0.80);
  const [leafSize,       setLeafSize]       = useState(0.45);
  const [leafColor,      setLeafColor]      = useState("#2a6010");
  const [leafColor2,     setLeafColor2]     = useState("#4a8020");
  const [leafColor3,     setLeafColor3]     = useState("#6a9030");
  const [leafGloss,      setLeafGloss]      = useState(0.30);
  const [leafTranslucency,setLeafTranslucency]=useState(0.40);
  const [leafTwist,      setLeafTwist]      = useState(0.10);
  // Wind
  const [windResponse,   setWindResponse]   = useState(0.50);
  const [windFrequency,  setWindFrequency]  = useState(0.50);
  const [windTurbulence, setWindTurbulence] = useState(0.30);
  // Extras
  const [flowerDensity,  setFlowerDensity]  = useState(0.00);
  const [flowerColor,    setFlowerColor]    = useState("#ff88cc");
  const [fruitDensity,   setFruitDensity]   = useState(0.00);
  const [fruitColor,     setFruitColor]     = useState("#dd3322");
  const [mossCoverage,   setMossCoverage]   = useState(0.00);
  const [snowCoverage,   setSnowCoverage]   = useState(0.00);
  // Output
  const [polyLevel,      setPolyLevel]      = useState("Mid");
  const [addLOD,         setAddLOD]         = useState(true);
  const [addCollider,    setAddCollider]    = useState(true);
  const [billboard,      setBillboard]      = useState(true);
  const [windReadyRig,   setWindReadyRig]   = useState(true);

  const applyPreset = useCallback((name) => {
    const p = FOLIAGE_PRESETS[name];
    if (!p) return;
    setActivePreset(name);
    setFoliageType(p.foliageType); setSeason(p.season);
    setTrunkH(p.trunkH);           setTrunkGirth(p.trunkGirth);
    setTrunkCurve(p.trunkCurve);   setBranchCount(p.branchCount);
    setBranchLen(p.branchLen);     setLeafDensity(p.leafDensity);
    setLeafSize(p.leafSize);       setBarkColor(p.barkColor);
    setLeafColor(p.leafColor);     setLeafColor2(p.leafColor2);
  }, []);

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a,b) => parseFloat((a + Math.random()*(b-a)).toFixed(2));
    setFoliageType(pick(FOLIAGE_TYPES)); setSeason(pick(SEASONS));
    setTrunkH(rn(0.2,0.9));   setTrunkGirth(rn(0.2,0.8));
    setBranchCount(rn(0.3,0.95)); setBranchLen(rn(0.3,0.8));
    setLeafDensity(rn(0.4,1.0));  setLeafSize(rn(0.2,0.7));
    setBarkType(pick(BARK_TYPES)); setLeafShape(pick(LEAF_SHAPES));
    setFlowerDensity(Math.random()>0.7 ? rn(0.2,0.6) : 0);
    setSeed(Math.floor(Math.random()*9999));
  }, []);

  const handleGenerate = useCallback(() => {
    onGenerate?.({
      identity: { foliageType, season, seed },
      trunk:    { trunkH, trunkGirth, trunkTaper, trunkCurve, barkType, barkColor, barkColor2, showRoots, rootSpread },
      branches: { branchCount, branchLen, branchAngle, branchDroop, branchRecurse, branchRandom },
      leaves:   { leafShape, leafDensity, leafSize, leafColor, leafColor2, leafColor3, leafGloss, leafTranslucency, leafTwist },
      wind:     { windResponse, windFrequency, windTurbulence },
      extras:   { flowerDensity, flowerColor, fruitDensity, fruitColor, mossCoverage, snowCoverage },
      output:   { polyLevel, addLOD, addCollider, billboard, windReadyRig },
    });
  }, [foliageType, season, seed, trunkH, trunkGirth, trunkTaper, trunkCurve, barkType, barkColor,
      barkColor2, showRoots, rootSpread, branchCount, branchLen, branchAngle, branchDroop,
      branchRecurse, branchRandom, leafShape, leafDensity, leafSize, leafColor, leafColor2,
      leafColor3, leafGloss, leafTranslucency, leafTwist, windResponse, windFrequency, windTurbulence,
      flowerDensity, flowerColor, fruitDensity, fruitColor, mossCoverage, snowCoverage,
      polyLevel, addLOD, addCollider, billboard, windReadyRig, onGenerate]);

  return (
    <div style={P}>
      {/* Presets */}
      <Section title="🌳 Presets">
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {Object.keys(FOLIAGE_PRESETS).map(name => (
            <button key={name} onClick={() => applyPreset(name)} style={{
              padding:"4px 9px", fontSize:9, borderRadius:4, cursor:"pointer", fontWeight:600,
              background: activePreset===name ? "#00ffc8" : "#21262d",
              color:      activePreset===name ? "#0d1117" : "#8b949e",
              border:     `1px solid ${activePreset===name ? "#00ffc8" : "#30363d"}`,
            }}>{name}</button>
          ))}
        </div>
      </Section>

      {/* Type */}
      <Section title="🌿 Foliage Type">
        <Badges items={FOLIAGE_TYPES.slice(0,9)}  active={foliageType} onSelect={setFoliageType} />
        <Badges items={FOLIAGE_TYPES.slice(9)}    active={foliageType} onSelect={setFoliageType} />
        <Select label="Season"      value={season} options={SEASONS} onChange={setSeason} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>

      {/* Trunk */}
      <Section title="🪵 Trunk">
        <Slider   label="Height"         value={trunkH}     onChange={setTrunkH}     />
        <Slider   label="Girth"          value={trunkGirth}  onChange={setTrunkGirth}  />
        <Slider   label="Taper"          value={trunkTaper}  onChange={setTrunkTaper}  />
        <Slider   label="Curve"          value={trunkCurve}  onChange={setTrunkCurve}  />
        <Badges   items={BARK_TYPES}     active={barkType}   onSelect={setBarkType}    />
        <ColorRow label="Bark Color 1"   value={barkColor}   onChange={setBarkColor}   />
        <ColorRow label="Bark Color 2"   value={barkColor2}  onChange={setBarkColor2}  />
        <Check    label="Surface Roots"  value={showRoots}   onChange={setShowRoots}   />
        {showRoots && <Slider label="Root Spread" value={rootSpread} onChange={setRootSpread} />}
      </Section>

      {/* Branches */}
      <Section title="Branches">
        <Slider   label="Count"          value={branchCount}   onChange={setBranchCount}   />
        <Slider   label="Length"         value={branchLen}     onChange={setBranchLen}     />
        <Slider   label="Spread Angle"   value={branchAngle}   onChange={setBranchAngle}   />
        <Slider   label="Droop"          value={branchDroop}   onChange={setBranchDroop}   />
        <Slider   label="Recursion"      value={branchRecurse} min={0} max={6} step={1} onChange={setBranchRecurse} />
        <Slider   label="Randomness"     value={branchRandom}  onChange={setBranchRandom}  />
      </Section>

      {/* Leaves */}
      <Section title="🍃 Leaves">
        <Badges   items={LEAF_SHAPES}    active={leafShape}        onSelect={setLeafShape}        />
        <Slider   label="Density"        value={leafDensity}       onChange={setLeafDensity}       />
        <Slider   label="Size"           value={leafSize}          onChange={setLeafSize}          />
        <Slider   label="Gloss"          value={leafGloss}         onChange={setLeafGloss}         />
        <Slider   label="Translucency"   value={leafTranslucency}  onChange={setLeafTranslucency}  />
        <Slider   label="Twist"          value={leafTwist}         onChange={setLeafTwist}         />
        <ColorRow label="Leaf Color 1"   value={leafColor}         onChange={setLeafColor}         />
        <ColorRow label="Leaf Color 2"   value={leafColor2}        onChange={setLeafColor2}        />
        <ColorRow label="Leaf Color 3"   value={leafColor3}        onChange={setLeafColor3}        />
      </Section>

      {/* Wind */}
      <Section title="💨 Wind" defaultOpen={false}>
        <Slider label="Response"   value={windResponse}   onChange={setWindResponse}   />
        <Slider label="Frequency"  value={windFrequency}  onChange={setWindFrequency}  />
        <Slider label="Turbulence" value={windTurbulence} onChange={setWindTurbulence} />
      </Section>

      {/* Extras */}
      <Section title="✨ Extras" defaultOpen={false}>
        <Slider   label="Flowers"       value={flowerDensity} onChange={setFlowerDensity} />
        {flowerDensity > 0 && <ColorRow label="Flower Color" value={flowerColor} onChange={setFlowerColor} />}
        <Slider   label="Fruit"         value={fruitDensity}  onChange={setFruitDensity}  />
        {fruitDensity  > 0 && <ColorRow label="Fruit Color"  value={fruitColor}  onChange={setFruitColor}  />}
        <Slider   label="Moss"          value={mossCoverage}  onChange={setMossCoverage}  />
        <Slider   label="Snow"          value={snowCoverage}  onChange={setSnowCoverage}  />
      </Section>

      {/* Output */}
      <Section title="⚙ Output" defaultOpen={false}>
        <Select label="Poly Budget"    value={polyLevel}    options={["Low","Mid","High","Ultra"]} onChange={setPolyLevel}    />
        <Check  label="Auto LOD"       value={addLOD}       onChange={setAddLOD}       />
        <Check  label="Collider"       value={addCollider}  onChange={setAddCollider}  />
        <Check  label="Billboard LOD"  value={billboard}    onChange={setBillboard}    />
        <Check  label="Wind-Ready Rig" value={windReadyRig} onChange={setWindReadyRig} />
      </Section>

      <div style={{ display:"flex", gap:6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="⚡ Generate Foliage" onClick={handleGenerate} />
      </div>
    </div>
  );
}
''')

print("\n✅ Face and Foliage panels rewritten — production quality, zero padding.")
print("Next: git add -A && git commit -m 'feat: Face, Foliage panels — production quality rewrite' && git push")
