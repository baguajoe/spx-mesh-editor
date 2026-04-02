import React, { useState, useCallback } from "react";

// ── Shared primitives ─────────────────────────────────────────────────────
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

// ── Presets ───────────────────────────────────────────────────────────────
const VEHICLE_PRESETS = {
  "Sports Car":    { vehicleClass:"Car", bodyStyle:"Coupe",    bodyLength:0.55, bodyHeight:0.35, bodyWidth:0.55, wheelSize:0.45, wheelWidth:0.50, chassisHeight:0.25, windowTint:0.40, roughness:0.20, metalness:0.85, spoiler:true,  groundClearance:0.15, wheelCount:4, primaryColor:"#cc2200", secondColor:"#c0c0c0" },
  "SUV":           { vehicleClass:"Car", bodyStyle:"SUV",      bodyLength:0.70, bodyHeight:0.60, bodyWidth:0.65, wheelSize:0.55, wheelWidth:0.55, chassisHeight:0.40, windowTint:0.30, roughness:0.30, metalness:0.70, spoiler:false, groundClearance:0.35, wheelCount:4, primaryColor:"#1a3a5a", secondColor:"#888888" },
  "Pickup Truck":  { vehicleClass:"Truck", bodyStyle:"Pickup", bodyLength:0.85, bodyHeight:0.55, bodyWidth:0.65, wheelSize:0.60, wheelWidth:0.60, chassisHeight:0.45, windowTint:0.25, roughness:0.50, metalness:0.60, spoiler:false, groundClearance:0.40, wheelCount:4, primaryColor:"#3a3a2a", secondColor:"#555544" },
  "Semi Truck":    { vehicleClass:"Truck", bodyStyle:"Semi",   bodyLength:1.00, bodyHeight:0.80, bodyWidth:0.70, wheelSize:0.65, wheelWidth:0.65, chassisHeight:0.50, windowTint:0.20, roughness:0.60, metalness:0.50, spoiler:false, groundClearance:0.45, wheelCount:18,primaryColor:"#aa2211", secondColor:"#888888" },
  "Motorcycle":    { vehicleClass:"Motorcycle", bodyStyle:"Sport", bodyLength:0.45, bodyHeight:0.50, bodyWidth:0.25, wheelSize:0.40, wheelWidth:0.30, chassisHeight:0.30, windowTint:0.50, roughness:0.25, metalness:0.80, spoiler:false, groundClearance:0.20, wheelCount:2, primaryColor:"#111111", secondColor:"#cc4400" },
  "Muscle Car":    { vehicleClass:"Car", bodyStyle:"Muscle",   bodyLength:0.65, bodyHeight:0.40, bodyWidth:0.60, wheelSize:0.50, wheelWidth:0.55, chassisHeight:0.28, windowTint:0.35, roughness:0.15, metalness:0.90, spoiler:true,  groundClearance:0.18, wheelCount:4, primaryColor:"#222244", secondColor:"#c8a830" },
  "Off-Road 4x4":  { vehicleClass:"Truck", bodyStyle:"SUV",   bodyLength:0.72, bodyHeight:0.65, bodyWidth:0.68, wheelSize:0.65, wheelWidth:0.62, chassisHeight:0.55, windowTint:0.25, roughness:0.70, metalness:0.40, spoiler:false, groundClearance:0.50, wheelCount:4, primaryColor:"#3a4a2a", secondColor:"#8a7050" },
  "Supercar":      { vehicleClass:"Car", bodyStyle:"Coupe",    bodyLength:0.58, bodyHeight:0.28, bodyWidth:0.58, wheelSize:0.48, wheelWidth:0.55, chassisHeight:0.18, windowTint:0.55, roughness:0.10, metalness:0.95, spoiler:true,  groundClearance:0.10, wheelCount:4, primaryColor:"#f0c000", secondColor:"#111111" },
};

const VEHICLE_CLASSES  = ["Car","Truck","Motorcycle","Bus","Van","Tractor","Tank","Aircraft","Boat","Spacecraft"];
const BODY_STYLES      = ["Sedan","Coupe","Hatchback","SUV","Pickup","Semi","Muscle","Convertible","Sport","Van","Bus","Custom"];
const DAMAGE_LEVELS    = ["None","Light Scratches","Dented","Battle-Worn","Destroyed"];
const EXHAUST_TYPES    = ["Single","Dual","Quad","Side Pipes","None"];
const RIM_STYLES       = ["5-Spoke","10-Spoke","Mesh","Turbine","Split","Solid","Off-Road","Racing"];
const PAINT_FINISHES   = ["Glossy","Matte","Satin","Metallic","Pearl","Chrome","Brushed","Rusty"];

export default function VehicleGeneratorPanel({ onGenerate }) {
  // Identity
  const [vehicleClass,   setVehicleClass]   = useState("Car");
  const [bodyStyle,      setBodyStyle]      = useState("Sedan");
  const [activePreset,   setActivePreset]   = useState("Sports Car");
  const [seed,           setSeed]           = useState(1);
  // Body proportions
  const [bodyLength,     setBodyLength]     = useState(0.55);
  const [bodyHeight,     setBodyHeight]     = useState(0.40);
  const [bodyWidth,      setBodyWidth]      = useState(0.55);
  const [chassisHeight,  setChassisHeight]  = useState(0.28);
  const [groundClearance,setGroundClearance]= useState(0.20);
  const [roofSlant,      setRoofSlant]      = useState(0.40);
  const [hoodLength,     setHoodLength]     = useState(0.45);
  const [trunkLength,    setTrunkLength]    = useState(0.35);
  // Wheels
  const [wheelCount,     setWheelCount]     = useState(4);
  const [wheelSize,      setWheelSize]      = useState(0.45);
  const [wheelWidth,     setWheelWidth]     = useState(0.50);
  const [rimStyle,       setRimStyle]       = useState("5-Spoke");
  const [rimColor,       setRimColor]       = useState("#888888");
  const [tireProfile,    setTireProfile]    = useState(0.50);
  const [tireTread,      setTireTread]      = useState("Street");
  // Paint & materials
  const [primaryColor,   setPrimaryColor]   = useState("#cc2200");
  const [secondColor,    setSecondColor]    = useState("#c0c0c0");
  const [accentColor,    setAccentColor]    = useState("#111111");
  const [paintFinish,    setPaintFinish]    = useState("Glossy");
  const [roughness,      setRoughness]      = useState(0.20);
  const [metalness,      setMetalness]      = useState(0.85);
  const [windowTint,     setWindowTint]     = useState(0.40);
  const [windowColor,    setWindowColor]    = useState("#223344");
  // Details
  const [spoiler,        setSpoiler]        = useState(false);
  const [spoilerSize,    setSpoilerSize]    = useState(0.40);
  const [bodyKit,        setBodyKit]        = useState(false);
  const [raisedSuspension,setRaisedSuspension]=useState(false);
  const [exhaustType,    setExhaustType]    = useState("Dual");
  const [exhaustColor,   setExhaustColor]   = useState("#888888");
  const [headlightStyle, setHeadlightStyle] = useState("LED");
  const [underglow,      setUnderglow]      = useState(false);
  const [underglowColor, setUnderglowColor] = useState("#00ffc8");
  const [roofRack,       setRoofRack]       = useState(false);
  const [bullBar,        setBullBar]        = useState(false);
  // Damage
  const [damageLevel,    setDamageLevel]    = useState("None");
  const [rustAmount,     setRustAmount]     = useState(0.00);
  const [dirtAmount,     setDirtAmount]     = useState(0.00);
  // Output
  const [polyBudget,     setPolyBudget]     = useState("High");
  const [addLOD,         setAddLOD]         = useState(true);
  const [addCollider,    setAddCollider]    = useState(true);
  const [addRig,         setAddRig]         = useState(false);
  const [separateParts,  setSeparateParts]  = useState(false);

  const applyPreset = useCallback((name) => {
    const p = VEHICLE_PRESETS[name];
    if (!p) return;
    setActivePreset(name);
    setVehicleClass(p.vehicleClass);     setBodyStyle(p.bodyStyle);
    setBodyLength(p.bodyLength);         setBodyHeight(p.bodyHeight);
    setBodyWidth(p.bodyWidth);           setChassisHeight(p.chassisHeight);
    setGroundClearance(p.groundClearance); setWheelSize(p.wheelSize);
    setWheelWidth(p.wheelWidth);         setWheelCount(p.wheelCount);
    setWindowTint(p.windowTint);         setRoughness(p.roughness);
    setMetalness(p.metalness);           setSpoiler(p.spoiler);
    setPrimaryColor(p.primaryColor);     setSecondColor(p.secondColor);
  }, []);

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a,b) => parseFloat((a + Math.random()*(b-a)).toFixed(2));
    setVehicleClass(pick(VEHICLE_CLASSES.slice(0,5)));
    setBodyStyle(pick(BODY_STYLES));
    setBodyLength(rn(0.3,0.9)); setBodyHeight(rn(0.25,0.75));
    setBodyWidth(rn(0.4,0.75)); setPrimaryColor(`#${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0")}`);
    setWheelSize(rn(0.35,0.65)); setRoughness(rn(0.1,0.8)); setMetalness(rn(0.3,1.0));
    setSpoiler(Math.random()>0.5); setUnderglow(Math.random()>0.7);
    setDamageLevel(pick(DAMAGE_LEVELS)); setSeed(Math.floor(Math.random()*9999));
  }, []);

  const handleGenerate = useCallback(() => {
    onGenerate?.({
      identity:  { vehicleClass, bodyStyle, seed },
      body:      { bodyLength, bodyHeight, bodyWidth, chassisHeight, groundClearance, roofSlant, hoodLength, trunkLength },
      wheels:    { wheelCount, wheelSize, wheelWidth, rimStyle, rimColor, tireProfile, tireTread },
      paint:     { primaryColor, secondColor, accentColor, paintFinish, roughness, metalness, windowTint, windowColor },
      details:   { spoiler, spoilerSize, bodyKit, raisedSuspension, exhaustType, exhaustColor, headlightStyle, underglow, underglowColor, roofRack, bullBar },
      damage:    { damageLevel, rustAmount, dirtAmount },
      output:    { polyBudget, addLOD, addCollider, addRig, separateParts },
    });
  }, [vehicleClass, bodyStyle, seed, bodyLength, bodyHeight, bodyWidth, chassisHeight, groundClearance,
      roofSlant, hoodLength, trunkLength, wheelCount, wheelSize, wheelWidth, rimStyle, rimColor,
      tireProfile, tireTread, primaryColor, secondColor, accentColor, paintFinish, roughness, metalness,
      windowTint, windowColor, spoiler, spoilerSize, bodyKit, raisedSuspension, exhaustType, exhaustColor,
      headlightStyle, underglow, underglowColor, roofRack, bullBar, damageLevel, rustAmount, dirtAmount,
      polyBudget, addLOD, addCollider, addRig, separateParts, onGenerate]);

  return (
    <div style={P}>
      {/* Presets */}
      <Section title="🚗 Presets">
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {Object.keys(VEHICLE_PRESETS).map(name => (
            <button key={name} onClick={() => applyPreset(name)} style={{
              padding:"4px 9px", fontSize:9, borderRadius:4, cursor:"pointer", fontWeight:600,
              background: activePreset===name ? "#00ffc8" : "#21262d",
              color:      activePreset===name ? "#0d1117" : "#8b949e",
              border:     `1px solid ${activePreset===name ? "#00ffc8" : "#30363d"}`,
            }}>{name}</button>
          ))}
        </div>
      </Section>

      {/* Class & Style */}
      <Section title="🏗 Class & Body">
        <Select label="Vehicle Class" value={vehicleClass} options={VEHICLE_CLASSES} onChange={setVehicleClass} />
        <Badges items={BODY_STYLES} active={bodyStyle} onSelect={setBodyStyle} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>

      {/* Proportions */}
      <Section title="📐 Proportions">
        <Slider label="Body Length"      value={bodyLength}      onChange={setBodyLength}      />
        <Slider label="Body Height"      value={bodyHeight}      onChange={setBodyHeight}      />
        <Slider label="Body Width"       value={bodyWidth}       onChange={setBodyWidth}       />
        <Slider label="Chassis Height"   value={chassisHeight}   onChange={setChassisHeight}   />
        <Slider label="Ground Clearance" value={groundClearance} onChange={setGroundClearance} />
        <Slider label="Roof Slant"       value={roofSlant}       onChange={setRoofSlant}       />
        <Slider label="Hood Length"      value={hoodLength}      onChange={setHoodLength}      />
        <Slider label="Trunk Length"     value={trunkLength}     onChange={setTrunkLength}     />
      </Section>

      {/* Wheels */}
      <Section title="⚙ Wheels & Tires">
        <NumInput label="Wheel Count" value={wheelCount} min={2} max={18} onChange={setWheelCount} />
        <Slider   label="Wheel Size"  value={wheelSize}  onChange={setWheelSize}  />
        <Slider   label="Wheel Width" value={wheelWidth} onChange={setWheelWidth} />
        <Slider   label="Tire Profile" value={tireProfile} onChange={setTireProfile} />
        <Select   label="Rim Style"   value={rimStyle}   options={RIM_STYLES} onChange={setRimStyle} />
        <ColorRow label="Rim Color"   value={rimColor}   onChange={setRimColor}   />
        <Select   label="Tire Tread"  value={tireTread}  options={["Street","Performance","Off-Road","Slick","Winter"]} onChange={setTireTread} />
      </Section>

      {/* Paint */}
      <Section title="🎨 Paint & Materials">
        <Badges   items={PAINT_FINISHES} active={paintFinish} onSelect={setPaintFinish} />
        <ColorRow label="Primary Color"  value={primaryColor}  onChange={setPrimaryColor}  />
        <ColorRow label="Secondary"      value={secondColor}   onChange={setSecondColor}   />
        <ColorRow label="Accent"         value={accentColor}   onChange={setAccentColor}   />
        <Slider   label="Roughness"      value={roughness}     onChange={setRoughness}     />
        <Slider   label="Metalness"      value={metalness}     onChange={setMetalness}     />
        <Slider   label="Window Tint"    value={windowTint}    onChange={setWindowTint}    />
        <ColorRow label="Window Color"   value={windowColor}   onChange={setWindowColor}   />
      </Section>

      {/* Details */}
      <Section title="✨ Details & Extras">
        <Check label="Spoiler"           value={spoiler}           onChange={setSpoiler}           />
        {spoiler && <Slider label="Spoiler Size" value={spoilerSize} onChange={setSpoilerSize} />}
        <Check label="Body Kit"          value={bodyKit}           onChange={setBodyKit}           />
        <Check label="Raised Suspension" value={raisedSuspension}  onChange={setRaisedSuspension}  />
        <Check label="Roof Rack"         value={roofRack}          onChange={setRoofRack}          />
        <Check label="Bull Bar"          value={bullBar}           onChange={setBullBar}           />
        <Select label="Exhaust Type"     value={exhaustType}       options={EXHAUST_TYPES} onChange={setExhaustType} />
        <ColorRow label="Exhaust Color"  value={exhaustColor}      onChange={setExhaustColor}      />
        <Select label="Headlights"       value={headlightStyle}    options={["LED","Halogen","HID","Neon","Off"]} onChange={setHeadlightStyle} />
        <Check label="Underglow"         value={underglow}         onChange={setUnderglow}         />
        {underglow && <ColorRow label="Underglow Color" value={underglowColor} onChange={setUnderglowColor} />}
      </Section>

      {/* Damage */}
      <Section title="💥 Damage & Wear" defaultOpen={false}>
        <Badges items={DAMAGE_LEVELS} active={damageLevel} onSelect={setDamageLevel} />
        <Slider label="Rust Amount" value={rustAmount} onChange={setRustAmount} />
        <Slider label="Dirt Amount" value={dirtAmount} onChange={setDirtAmount} />
      </Section>

      {/* Output */}
      <Section title="⚙ Output" defaultOpen={false}>
        <Select label="Poly Budget"    value={polyBudget}    options={["Low","Mid","High","Ultra"]} onChange={setPolyBudget} />
        <Check  label="Auto LOD"       value={addLOD}        onChange={setAddLOD}        />
        <Check  label="Add Collider"   value={addCollider}   onChange={setAddCollider}   />
        <Check  label="Add Rig"        value={addRig}        onChange={setAddRig}        />
        <Check  label="Separate Parts" value={separateParts} onChange={setSeparateParts} />
      </Section>

      <div style={{ display:"flex", gap:6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="⚡ Generate Vehicle" onClick={handleGenerate} />
      </div>
    </div>
  );
}
