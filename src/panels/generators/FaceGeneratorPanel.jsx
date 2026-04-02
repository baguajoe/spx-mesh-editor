import React, { useState, useCallback, useEffect } from "react";

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

  // Apply default preset on mount
  useEffect(() => { applyPreset("Young Male"); }, []);

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
