#!/usr/bin/env python3
"""
gen_panels_vpс.py — Production-quality Vehicle, Prop, Creature generator panels.
Run: python3 gen_panels_vpc.py
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
# VehicleGeneratorPanel.jsx
# =============================================================================
write(f"{BASE}/VehicleGeneratorPanel.jsx", r'''import React, { useState, useCallback } from "react";

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
''')

# =============================================================================
# PropGeneratorPanel.jsx
# =============================================================================
write(f"{BASE}/PropGeneratorPanel.jsx", r'''import React, { useState, useCallback } from "react";

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
''')

# =============================================================================
# CreatureGeneratorPanel.jsx
# =============================================================================
write(f"{BASE}/CreatureGeneratorPanel.jsx", r'''import React, { useState, useCallback } from "react";

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
''')

print("\n✅ All 3 panels written — production quality.")
print("Next: git add -A && git commit -m 'feat: Vehicle, Prop, Creature panels — production quality' && git push")
