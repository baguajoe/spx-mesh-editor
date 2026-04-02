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

const CREATURE_PRESETS = {
  "Dragon":      { archetype:"Reptilian", size:"Huge",   limbCount:4, wingType:"Draconic",  tailType:"Spiked",  hornType:"Ram",  skinType:"Scales",  primaryColor:"#2a4a10", accentColor:"#c8a000", biolum:false, armorPlates:true,  fireBreather:true  },
  "Wolf":        { archetype:"Mammalian", size:"Medium", limbCount:4, wingType:"None",       tailType:"Long",    hornType:"None", skinType:"Fur",     primaryColor:"#808080", accentColor:"#c8c8c8", biolum:false, armorPlates:false, fireBreather:false },
  "Giant Spider":{ archetype:"Insectoid", size:"Large",  limbCount:8, wingType:"None",       tailType:"None",    hornType:"None", skinType:"Chitin",  primaryColor:"#1a1a1a", accentColor:"#cc0000", biolum:false, armorPlates:true,  fireBreather:false },
  "Phoenix":     { archetype:"Avian",     size:"Large",  limbCount:2, wingType:"Feathered",  tailType:"Fan",     hornType:"None", skinType:"Feathers",primaryColor:"#cc4400", accentColor:"#f0c000", biolum:true,  armorPlates:false, fireBreather:true  },
  "Deep Sea Beast":{ archetype:"Aquatic", size:"Colossal",limbCount:6,wingType:"None",       tailType:"Whip",    hornType:"Spike",skinType:"Scales",  primaryColor:"#102040", accentColor:"#00ffc8", biolum:true,  armorPlates:false, fireBreather:false },
  "Demon":       { archetype:"Demonic",   size:"Large",  limbCount:4, wingType:"Bat",        tailType:"Spiked",  hornType:"Twisted",skinType:"Scales",primaryColor:"#3a0808", accentColor:"#ff2200", biolum:true,  armorPlates:true,  fireBreather:true  },
  "Golem":       { archetype:"Mechanical",size:"Huge",   limbCount:4, wingType:"None",       tailType:"None",    hornType:"Crown",skinType:"Metallic",primaryColor:"#505060", accentColor:"#00aaff", biolum:true,  armorPlates:true,  fireBreather:false },
  "Forest Spirit":{ archetype:"Fungal",   size:"Medium", limbCount:4, wingType:"Membrane",   tailType:"Long",    hornType:"Antler",skinType:"Bark",   primaryColor:"#2a4a20", accentColor:"#80cc40", biolum:true,  armorPlates:false, fireBreather:false },
};

const ARCHETYPES  = ["Reptilian","Mammalian","Insectoid","Aquatic","Avian","Demonic","Mechanical","Fungal","Celestial","Undead","Eldritch","Crystalline"];
const SIZES       = ["Tiny","Small","Medium","Large","Huge","Colossal"];
const WING_TYPES  = ["None","Bat","Bird","Insect","Membrane","Feathered","Draconic","Mechanical"];
const TAIL_TYPES  = ["None","Short","Long","Spiked","Whip","Armored","Fan","Prehensile"];
const HORN_TYPES  = ["None","Ram","Antler","Spike","Twisted","Crown","Brow Ridge"];
const SKIN_TYPES  = ["Scales","Chitin","Fur","Feathers","Smooth","Bark","Crystal","Metallic","Slime","Bone"];
const HEAD_TYPES  = ["Horned","Crested","Tusked","Beaked","Eyeless","Multi-Eyed","Maned","Finned"];

export default function CreatureGeneratorPanel({ onGenerate }) {
  const [archetype,      setArchetype]      = useState("Reptilian");
  const [size,           setSize]           = useState("Medium");
  const [activePreset,   setActivePreset]   = useState("Dragon");
  const [seed,           setSeed]           = useState(7);
  // Body
  const [bodyLength,     setBodyLength]     = useState(0.50);
  const [bodyGirth,      setBodyGirth]      = useState(0.50);
  const [neckLength,     setNeckLength]     = useState(0.40);
  const [neckThickness,  setNeckThickness]  = useState(0.40);
  // Head
  const [headType,       setHeadType]       = useState("Horned");
  const [headSize,       setHeadSize]       = useState(0.50);
  const [mawSize,        setMawSize]        = useState(0.50);
  const [eyeCount,       setEyeCount]       = useState(2);
  const [hornType,       setHornType]       = useState("Ram");
  const [hornCount,      setHornCount]      = useState(2);
  const [hornLength,     setHornLength]     = useState(0.40);
  const [crestHeight,    setCrestHeight]    = useState(0.00);
  // Limbs
  const [limbCount,      setLimbCount]      = useState(4);
  const [limbLength,     setLimbLength]     = useState(0.50);
  const [limbThickness,  setLimbThickness]  = useState(0.45);
  const [hasClaws,       setHasClaws]       = useState(true);
  const [clawLength,     setClawLength]     = useState(0.40);
  const [footType,       setFootType]       = useState("Clawed");
  // Wings
  const [wingType,       setWingType]       = useState("Draconic");
  const [wingSpan,       setWingSpan]       = useState(0.70);
  // Tail
  const [tailType,       setTailType]       = useState("Spiked");
  const [tailLength,     setTailLength]     = useState(0.60);
  const [tailSpines,     setTailSpines]     = useState(false);
  // Skin
  const [skinType,       setSkinType]       = useState("Scales");
  const [primaryColor,   setPrimaryColor]   = useState("#2a4a10");
  const [secondaryColor, setSecondaryColor] = useState("#1a2a08");
  const [accentColor,    setAccentColor]    = useState("#c8a000");
  const [skinRoughness,  setSkinRoughness]  = useState(0.70);
  const [patternType,    setPatternType]    = useState("None");
  // Special
  const [biolum,         setBiolum]         = useState(false);
  const [biolumColor,    setBiolumColor]    = useState("#00ffc8");
  const [armorPlates,    setArmorPlates]    = useState(true);
  const [armorColor,     setArmorColor]     = useState("#505060");
  const [venomSacs,      setVenomSacs]      = useState(false);
  const [fireBreather,   setFireBreather]   = useState(true);
  const [spineRow,       setSpineRow]       = useState(false);
  const [spineCount,     setSpineCount]     = useState(8);
  // Output
  const [polyBudget,     setPolyBudget]     = useState("High");
  const [addRig,         setAddRig]         = useState(true);
  const [addLOD,         setAddLOD]         = useState(false);
  const [addCollider,    setAddCollider]    = useState(true);

  const applyPreset = useCallback((name) => {
    const p = CREATURE_PRESETS[name];
    if (!p) return;
    setActivePreset(name);
    setArchetype(p.archetype);       setSize(p.size);
    setLimbCount(p.limbCount);       setWingType(p.wingType);
    setTailType(p.tailType);         setHornType(p.hornType);
    setSkinType(p.skinType);         setPrimaryColor(p.primaryColor);
    setAccentColor(p.accentColor);   setBiolum(p.biolum);
    setArmorPlates(p.armorPlates);   setFireBreather(p.fireBreather);
  }, []);

  // Apply default preset on mount
  useEffect(() => { applyPreset("Dragon"); }, []);

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn   = (a,b) => parseFloat((a + Math.random()*(b-a)).toFixed(2));
    setArchetype(pick(ARCHETYPES));  setSize(pick(SIZES));
    setBodyLength(rn(0.3,0.8));      setBodyGirth(rn(0.3,0.8));
    setLimbCount(pick([2,4,6,8]));   setWingType(Math.random()>0.5 ? pick(WING_TYPES.slice(1)) : "None");
    setTailType(Math.random()>0.3  ? pick(TAIL_TYPES.slice(1))  : "None");
    setHornType(Math.random()>0.4  ? pick(HORN_TYPES.slice(1))  : "None");
    setSkinType(pick(SKIN_TYPES));
    setPrimaryColor(`#${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0")}`);
    setBiolum(Math.random()>0.6);    setArmorPlates(Math.random()>0.5);
    setFireBreather(Math.random()>0.7);
    setSeed(Math.floor(Math.random()*9999));
  }, []);

  const handleGenerate = useCallback(() => {
    onGenerate?.({
      identity:  { archetype, size, seed },
      body:      { bodyLength, bodyGirth, neckLength, neckThickness },
      head:      { headType, headSize, mawSize, eyeCount, hornType, hornCount, hornLength, crestHeight },
      limbs:     { limbCount, limbLength, limbThickness, hasClaws, clawLength, footType },
      wings:     { wingType, wingSpan },
      tail:      { tailType, tailLength, tailSpines },
      skin:      { skinType, primaryColor, secondaryColor, accentColor, skinRoughness, patternType },
      special:   { biolum, biolumColor, armorPlates, armorColor, venomSacs, fireBreather, spineRow, spineCount },
      output:    { polyBudget, addRig, addLOD, addCollider },
    });
  }, [archetype, size, seed, bodyLength, bodyGirth, neckLength, neckThickness, headType, headSize,
      mawSize, eyeCount, hornType, hornCount, hornLength, crestHeight, limbCount, limbLength,
      limbThickness, hasClaws, clawLength, footType, wingType, wingSpan, tailType, tailLength,
      tailSpines, skinType, primaryColor, secondaryColor, accentColor, skinRoughness, patternType,
      biolum, biolumColor, armorPlates, armorColor, venomSacs, fireBreather, spineRow, spineCount,
      polyBudget, addRig, addLOD, addCollider, onGenerate]);

  return (
    <div style={P}>
      {/* Presets */}
      <Section title="🐉 Presets">
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {Object.keys(CREATURE_PRESETS).map(name => (
            <button key={name} onClick={() => applyPreset(name)} style={{
              padding:"4px 9px", fontSize:9, borderRadius:4, cursor:"pointer", fontWeight:600,
              background: activePreset===name ? "#00ffc8" : "#21262d",
              color:      activePreset===name ? "#0d1117" : "#8b949e",
              border:     `1px solid ${activePreset===name ? "#00ffc8" : "#30363d"}`,
            }}>{name}</button>
          ))}
        </div>
      </Section>

      {/* Archetype */}
      <Section title="🧬 Archetype">
        <Badges items={ARCHETYPES} active={archetype} onSelect={setArchetype} />
        <Select label="Size"        value={size} options={SIZES} onChange={setSize} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>

      {/* Body */}
      <Section title="Body">
        <Slider label="Body Length"    value={bodyLength}    onChange={setBodyLength}    />
        <Slider label="Body Girth"     value={bodyGirth}     onChange={setBodyGirth}     />
        <Slider label="Neck Length"    value={neckLength}    onChange={setNeckLength}    />
        <Slider label="Neck Thickness" value={neckThickness} onChange={setNeckThickness} />
      </Section>

      {/* Head */}
      <Section title="Head">
        <Badges items={HEAD_TYPES} active={headType} onSelect={setHeadType} />
        <Slider    label="Head Size"   value={headSize}   onChange={setHeadSize}   />
        <Slider    label="Maw / Jaw"   value={mawSize}    onChange={setMawSize}    />
        <Slider    label="Eye Count"   value={eyeCount}   min={0} max={8} step={1} onChange={setEyeCount} />
        <Select    label="Horn Type"   value={hornType}   options={HORN_TYPES}     onChange={setHornType}   />
        <Slider    label="Horn Count"  value={hornCount}  min={0} max={6} step={1} onChange={setHornCount}  />
        <Slider    label="Horn Length" value={hornLength} onChange={setHornLength} />
        <Slider    label="Crest"       value={crestHeight}onChange={setCrestHeight}/>
      </Section>

      {/* Limbs */}
      <Section title="Limbs">
        <Slider label="Limb Count"    value={limbCount}     min={0} max={8} step={1} onChange={setLimbCount}     />
        <Slider label="Limb Length"   value={limbLength}    onChange={setLimbLength}    />
        <Slider label="Limb Girth"    value={limbThickness} onChange={setLimbThickness} />
        <Check  label="Claws"         value={hasClaws}      onChange={setHasClaws}      />
        {hasClaws && <Slider label="Claw Length" value={clawLength} onChange={setClawLength} />}
        <Select label="Foot Type"     value={footType}      options={["Clawed","Hooved","Padded","Tentacled","Webbed","Taloned"]} onChange={setFootType} />
      </Section>

      {/* Wings */}
      <Section title="Wings">
        <Badges items={WING_TYPES} active={wingType} onSelect={setWingType} />
        {wingType !== "None" && <Slider label="Wingspan" value={wingSpan} onChange={setWingSpan} />}
      </Section>

      {/* Tail */}
      <Section title="Tail">
        <Badges items={TAIL_TYPES} active={tailType} onSelect={setTailType} />
        {tailType !== "None" && <>
          <Slider label="Tail Length" value={tailLength} onChange={setTailLength} />
          <Check  label="Tail Spines" value={tailSpines} onChange={setTailSpines} />
        </>}
      </Section>

      {/* Skin */}
      <Section title="🎨 Skin & Color">
        <Badges   items={SKIN_TYPES}   active={skinType}    onSelect={setSkinType}    />
        <ColorRow label="Primary Color" value={primaryColor}  onChange={setPrimaryColor}  />
        <ColorRow label="Secondary"     value={secondaryColor}onChange={setSecondaryColor}/>
        <ColorRow label="Accent"        value={accentColor}   onChange={setAccentColor}   />
        <Select   label="Pattern"       value={patternType}   options={["None","Stripes","Spots","Banding","Iridescent","Mottled","Gradient"]} onChange={setPatternType} />
        <Slider   label="Skin Roughness" value={skinRoughness} onChange={setSkinRoughness} />
      </Section>

      {/* Special */}
      <Section title="✨ Special Abilities" defaultOpen={false}>
        <Check label="Bioluminescence"  value={biolum}       onChange={setBiolum}       />
        {biolum && <ColorRow label="Glow Color" value={biolumColor} onChange={setBiolumColor} />}
        <Check label="Armor Plates"     value={armorPlates}  onChange={setArmorPlates}  />
        {armorPlates && <ColorRow label="Armor Color" value={armorColor} onChange={setArmorColor} />}
        <Check label="Venom Sacs"       value={venomSacs}    onChange={setVenomSacs}    />
        <Check label="Fire Breather"    value={fireBreather} onChange={setFireBreather} />
        <Check label="Spine Row"        value={spineRow}     onChange={setSpineRow}     />
        {spineRow && <Slider label="Spine Count" value={spineCount} min={2} max={30} step={1} onChange={setSpineCount} />}
      </Section>

      {/* Output */}
      <Section title="⚙ Output" defaultOpen={false}>
        <Select label="Poly Budget"  value={polyBudget} options={["Low","Mid","High","Ultra"]} onChange={setPolyBudget} />
        <Check  label="Add Rig"      value={addRig}     onChange={setAddRig}     />
        <Check  label="Auto LOD"     value={addLOD}     onChange={setAddLOD}     />
        <Check  label="Add Collider" value={addCollider} onChange={setAddCollider} />
      </Section>

      <div style={{ display:"flex", gap:6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="⚡ Generate Creature" onClick={handleGenerate} />
      </div>
    </div>
  );
}
