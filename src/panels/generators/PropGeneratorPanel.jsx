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

const PROP_CATEGORIES = {
  "Furniture":   ["Chair","Table","Desk","Sofa","Bed","Bookshelf","Cabinet","Wardrobe","Stool","Bench"],
  "Containers":  ["Barrel","Crate","Box","Chest","Bag","Bucket","Vase","Jar","Bottle","Can"],
  "Weapons":     ["Sword","Axe","Spear","Shield","Bow","Dagger","Mace","Staff","Crossbow","Hammer"],
  "Tools":       ["Hammer","Wrench","Saw","Shovel","Pickaxe","Lantern","Key","Lock","Rope","Chain"],
  "Electronics": ["Computer","TV","Radio","Phone","Camera","Speaker","Lamp","Clock","Keyboard","Monitor"],
  "Architecture":["Door","Window","Column","Arch","Stairs","Railing","Fence","Wall","Pillar","Beam"],
  "Nature":      ["Rock","Log","Stump","Boulder","Crystal","Mushroom","Root","Branch","Stone","Pebble"],
  "Fantasy":     ["Magic Orb","Potion","Scroll","Tome","Rune Stone","Amulet","Crown","Scepter","Candle","Altar"],
};

const PROP_PRESETS = {
  "Wooden Chair":   { category:"Furniture", propType:"Chair",   primaryColor:"#8a5520", secondColor:"#6a3a10", material:"Wood",   roughness:0.80, metalness:0.00, scaleX:1.0, scaleY:1.0, scaleZ:1.0, worn:0.20, damaged:0.00 },
  "Metal Barrel":   { category:"Containers",propType:"Barrel",  primaryColor:"#556055", secondColor:"#888888", material:"Metal",  roughness:0.50, metalness:0.80, scaleX:1.0, scaleY:1.0, scaleZ:1.0, worn:0.40, damaged:0.10 },
  "Iron Sword":     { category:"Weapons",   propType:"Sword",   primaryColor:"#c0c8d0", secondColor:"#8a6030", material:"Metal",  roughness:0.20, metalness:0.90, scaleX:1.0, scaleY:1.0, scaleZ:1.0, worn:0.15, damaged:0.00 },
  "Stone Boulder":  { category:"Nature",    propType:"Boulder", primaryColor:"#888880", secondColor:"#606058", material:"Stone",  roughness:0.95, metalness:0.00, scaleX:1.2, scaleY:0.9, scaleZ:1.1, worn:0.60, damaged:0.20 },
  "Magic Crystal":  { category:"Fantasy",   propType:"Crystal", primaryColor:"#6080ff", secondColor:"#4060cc", material:"Glass",  roughness:0.05, metalness:0.30, scaleX:1.0, scaleY:1.4, scaleZ:1.0, worn:0.00, damaged:0.00 },
  "Wooden Crate":   { category:"Containers",propType:"Crate",   primaryColor:"#a07040", secondColor:"#705020", material:"Wood",   roughness:0.85, metalness:0.00, scaleX:1.0, scaleY:1.0, scaleZ:1.0, worn:0.35, damaged:0.15 },
  "Desk Lamp":      { category:"Electronics",propType:"Lamp",   primaryColor:"#c8a830", secondColor:"#222222", material:"Metal",  roughness:0.30, metalness:0.85, scaleX:1.0, scaleY:1.0, scaleZ:1.0, worn:0.05, damaged:0.00 },
  "Ancient Altar":  { category:"Fantasy",   propType:"Altar",   primaryColor:"#504840", secondColor:"#c8a830", material:"Stone",  roughness:0.90, metalness:0.10, scaleX:1.0, scaleY:1.0, scaleZ:1.0, worn:0.70, damaged:0.30 },
};

const MATERIALS     = ["Wood","Metal","Stone","Fabric","Plastic","Glass","Ceramic","Leather","Bone","Crystal","Rust","Gold","Silver"];
const SURFACE_TYPES = ["Smooth","Rough","Carved","Worn","Polished","Painted","Rusted","Mossy","Cracked","Burnt"];

export default function PropGeneratorPanel({ onGenerate }) {
  const [category,       setCategory]       = useState("Furniture");
  const [propType,       setPropType]       = useState("Chair");
  const [activePreset,   setActivePreset]   = useState("Wooden Chair");
  const [seed,           setSeed]           = useState(1);
  // Scale
  const [scaleX,         setScaleX]         = useState(1.0);
  const [scaleY,         setScaleY]         = useState(1.0);
  const [scaleZ,         setScaleZ]         = useState(1.0);
  const [uniformScale,   setUniformScale]   = useState(false);
  // Material
  const [material,       setMaterial]       = useState("Wood");
  const [primaryColor,   setPrimaryColor]   = useState("#8a5520");
  const [secondColor,    setSecondColor]    = useState("#6a3a10");
  const [accentColor,    setAccentColor]    = useState("#c8a830");
  const [roughness,      setRoughness]      = useState(0.80);
  const [metalness,      setMetalness]      = useState(0.00);
  const [surfaceType,    setSurfaceType]    = useState("Rough");
  // Wear
  const [worn,           setWorn]           = useState(0.20);
  const [damaged,        setDamaged]        = useState(0.00);
  const [dirty,          setDirty]          = useState(0.00);
  const [mossy,          setMossy]          = useState(0.00);
  const [burnt,          setBurnt]          = useState(0.00);
  // Details
  const [addDecals,      setAddDecals]      = useState(false);
  const [decalType,      setDecalType]      = useState("Graffiti");
  const [addPhysics,     setAddPhysics]     = useState(false);
  const [breakable,      setBreakable]      = useState(false);
  const [glowing,        setGlowing]        = useState(false);
  const [glowColor,      setGlowColor]      = useState("#00ffc8");
  const [glowIntensity,  setGlowIntensity]  = useState(0.50);
  const [animated,       setAnimated]       = useState(false);
  const [animType,       setAnimType]       = useState("Idle Float");
  // Variation
  const [variation,      setVariation]      = useState(0.00);
  const [randomRotation, setRandomRotation] = useState(false);
  const [batchCount,     setBatchCount]     = useState(1);
  // Output
  const [polyBudget,     setPolyBudget]     = useState("Mid");
  const [addLOD,         setAddLOD]         = useState(true);
  const [addCollider,    setAddCollider]    = useState(true);

  const applyPreset = useCallback((name) => {
    const p = PROP_PRESETS[name];
    if (!p) return;
    setActivePreset(name);
    setCategory(p.category);     setPropType(p.propType);
    setPrimaryColor(p.primaryColor); setSecondColor(p.secondColor);
    setMaterial(p.material);     setRoughness(p.roughness);
    setMetalness(p.metalness);   setScaleX(p.scaleX);
    setScaleY(p.scaleY);         setScaleZ(p.scaleZ);
    setWorn(p.worn);             setDamaged(p.damaged);
  }, []);

  // Apply default preset on mount
  useEffect(() => { applyPreset("Wooden Chair"); }, []);

  const randomize = useCallback(() => {
    const cats = Object.keys(PROP_CATEGORIES);
    const cat  = cats[Math.floor(Math.random() * cats.length)];
    const types = PROP_CATEGORIES[cat];
    setCategory(cat);
    setPropType(types[Math.floor(Math.random() * types.length)]);
    setMaterial(MATERIALS[Math.floor(Math.random() * MATERIALS.length)]);
    setPrimaryColor(`#${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0")}`);
    const rn = (a,b) => parseFloat((a + Math.random()*(b-a)).toFixed(2));
    setRoughness(rn(0.1,1.0)); setMetalness(rn(0,0.9));
    setWorn(rn(0,0.7)); setDamaged(rn(0,0.5));
    setScaleX(rn(0.7,1.5)); setScaleY(rn(0.7,1.5)); setScaleZ(rn(0.7,1.5));
    setVariation(rn(0,0.3)); setSeed(Math.floor(Math.random()*9999));
  }, []);

  const handleGenerate = useCallback(() => {
    onGenerate?.({
      identity:  { category, propType, seed },
      scale:     { scaleX, scaleY, scaleZ, uniformScale },
      material:  { material, primaryColor, secondColor, accentColor, roughness, metalness, surfaceType },
      wear:      { worn, damaged, dirty, mossy, burnt },
      details:   { addDecals, decalType, addPhysics, breakable, glowing, glowColor, glowIntensity, animated, animType },
      variation: { variation, randomRotation, batchCount },
      output:    { polyBudget, addLOD, addCollider },
    });
  }, [category, propType, seed, scaleX, scaleY, scaleZ, uniformScale, material, primaryColor,
      secondColor, accentColor, roughness, metalness, surfaceType, worn, damaged, dirty, mossy, burnt,
      addDecals, decalType, addPhysics, breakable, glowing, glowColor, glowIntensity, animated, animType,
      variation, randomRotation, batchCount, polyBudget, addLOD, addCollider, onGenerate]);

  return (
    <div style={P}>
      {/* Presets */}
      <Section title="📦 Presets">
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {Object.keys(PROP_PRESETS).map(name => (
            <button key={name} onClick={() => applyPreset(name)} style={{
              padding:"4px 9px", fontSize:9, borderRadius:4, cursor:"pointer", fontWeight:600,
              background: activePreset===name ? "#00ffc8" : "#21262d",
              color:      activePreset===name ? "#0d1117" : "#8b949e",
              border:     `1px solid ${activePreset===name ? "#00ffc8" : "#30363d"}`,
            }}>{name}</button>
          ))}
        </div>
      </Section>

      {/* Category & Type */}
      <Section title="🗂 Category & Type">
        <Select label="Category" value={category} options={Object.keys(PROP_CATEGORIES)}
          onChange={v => { setCategory(v); setPropType(PROP_CATEGORIES[v][0]); }} />
        <Badges items={PROP_CATEGORIES[category] ?? []} active={propType} onSelect={setPropType} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>

      {/* Scale */}
      <Section title="📏 Scale">
        <Check label="Uniform Scale" value={uniformScale} onChange={setUniformScale} />
        <Slider label="Scale X" value={scaleX} min={0.1} max={5} step={0.05}
          onChange={v => { setScaleX(v); if(uniformScale){setScaleY(v);setScaleZ(v);} }} />
        <Slider label="Scale Y" value={scaleY} min={0.1} max={5} step={0.05}
          onChange={v => { setScaleY(v); if(uniformScale){setScaleX(v);setScaleZ(v);} }} />
        <Slider label="Scale Z" value={scaleZ} min={0.1} max={5} step={0.05}
          onChange={v => { setScaleZ(v); if(uniformScale){setScaleX(v);setScaleY(v);} }} />
      </Section>

      {/* Material */}
      <Section title="🎨 Material & Color">
        <Badges items={MATERIALS} active={material} onSelect={setMaterial} />
        <Badges items={SURFACE_TYPES} active={surfaceType} onSelect={setSurfaceType} />
        <ColorRow label="Primary Color" value={primaryColor} onChange={setPrimaryColor} />
        <ColorRow label="Secondary"     value={secondColor}  onChange={setSecondColor}  />
        <ColorRow label="Accent"        value={accentColor}  onChange={setAccentColor}  />
        <Slider label="Roughness"       value={roughness}    onChange={setRoughness}    />
        <Slider label="Metalness"       value={metalness}    onChange={setMetalness}    />
      </Section>

      {/* Wear & Damage */}
      <Section title="💥 Wear & Damage">
        <Slider label="Worn"    value={worn}    onChange={setWorn}    />
        <Slider label="Damaged" value={damaged} onChange={setDamaged} />
        <Slider label="Dirty"   value={dirty}   onChange={setDirty}   />
        <Slider label="Mossy"   value={mossy}   onChange={setMossy}   />
        <Slider label="Burnt"   value={burnt}   onChange={setBurnt}   />
      </Section>

      {/* Details */}
      <Section title="✨ Details" defaultOpen={false}>
        <Check  label="Add Decals"    value={addDecals}   onChange={setAddDecals}   />
        {addDecals && <Select label="Decal Type" value={decalType} options={["Graffiti","Labels","Runes","Insignia","Scratches","Bullet Holes"]} onChange={setDecalType} />}
        <Check  label="Physics"       value={addPhysics}  onChange={setAddPhysics}  />
        <Check  label="Breakable"     value={breakable}   onChange={setBreakable}   />
        <Check  label="Glowing"       value={glowing}     onChange={setGlowing}     />
        {glowing && <>
          <ColorRow label="Glow Color"    value={glowColor}     onChange={setGlowColor}     />
          <Slider   label="Glow Intensity" value={glowIntensity} onChange={setGlowIntensity} />
        </>}
        <Check  label="Animated"      value={animated}    onChange={setAnimated}    />
        {animated && <Select label="Anim Type" value={animType} options={["Idle Float","Spin","Bob","Pulse","Open/Close","Flicker"]} onChange={setAnimType} />}
      </Section>

      {/* Variation */}
      <Section title="🔀 Variation" defaultOpen={false}>
        <Slider   label="Variation Amount" value={variation} onChange={setVariation} />
        <Check    label="Random Rotation"  value={randomRotation} onChange={setRandomRotation} />
        <NumInput label="Batch Count"      value={batchCount} min={1} max={100} onChange={setBatchCount} />
      </Section>

      {/* Output */}
      <Section title="⚙ Output" defaultOpen={false}>
        <Select label="Poly Budget"  value={polyBudget} options={["Low","Mid","High","Ultra"]} onChange={setPolyBudget} />
        <Check  label="Auto LOD"     value={addLOD}     onChange={setAddLOD}     />
        <Check  label="Add Collider" value={addCollider} onChange={setAddCollider} />
      </Section>

      <div style={{ display:"flex", gap:6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="⚡ Generate Prop" onClick={handleGenerate} />
      </div>
    </div>
  );
}
