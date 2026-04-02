import React, { useState, useCallback } from "react";

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
