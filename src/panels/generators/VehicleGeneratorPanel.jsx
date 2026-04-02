import React, { useState, useCallback } from "react";

const S = {
  panel: { background:"#0d1117", color:"#e6edf3", fontFamily:"JetBrains Mono,monospace", fontSize:12, padding:12, overflowY:"auto", maxHeight:"100%", boxSizing:"border-box" },
  h3:    { color:"#00ffc8", fontSize:13, fontWeight:700, marginBottom:10, borderBottom:"1px solid #21262d", paddingBottom:6 },
  section:{ marginBottom:10 },
  label: { display:"flex", justifyContent:"space-between", color:"#8b949e", marginBottom:2 },
  row:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 },
  slider:{ width:"100%", accentColor:"#00ffc8" },
  btn:   { width:"100%", padding:"8px 0", background:"#00ffc8", color:"#06060f", border:"none", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:12, fontWeight:700, cursor:"pointer", marginTop:4 },
  btnSec:{ width:"100%", padding:"6px 0", background:"#21262d", color:"#e6edf3", border:"1px solid #30363d", borderRadius:4, fontFamily:"JetBrains Mono,monospace", fontSize:11, cursor:"pointer", marginTop:4 },
  select:{ width:"100%", background:"#21262d", color:"#e6edf3", border:"1px solid #30363d", borderRadius:4, padding:"4px 6px", fontFamily:"JetBrains Mono,monospace", fontSize:11 },
  tag:   { display:"inline-block", background:"#21262d", color:"#8b949e", borderRadius:3, padding:"2px 6px", fontSize:10, marginRight:4, marginBottom:4, cursor:"pointer" },
  tagOn: { display:"inline-block", background:"#00ffc8", color:"#06060f", borderRadius:3, padding:"2px 6px", fontSize:10, marginRight:4, marginBottom:4, cursor:"pointer", fontWeight:700 },
};

const VEHICLE_CATEGORIES = {
  Land:    ["Sedan","SUV","Truck","Muscle Car","Sports Car","Van","Bus","Motorcycle","Bicycle","Tank","APC","Jeep","Pickup","Convertible","Hatchback"],
  Air:     ["Fighter Jet","Bomber","Helicopter","Biplane","Drone","UFO","Airship","Transport","Stealth","Space Shuttle"],
  Sea:     ["Speedboat","Sailboat","Yacht","Submarine","Destroyer","Aircraft Carrier","Fishing Boat","Cruise Ship","Kayak","Hovercraft"],
  Space:   ["Rocket","Shuttle","Station","Probe","Fighter","Freighter","Battleship","Scout","Colony Ship","Mech"],
  Fantasy: ["Dragon Ship","Flying Carpet","Steampunk Airship","Mech Walker","Magic Chariot","Cloud Rider","Pirate Ship","Viking Longboat"],
};

const ERAS = ["Modern","Futuristic","Retro/50s","Post-Apocalyptic","Steampunk","Medieval","Cyberpunk","Classic"];
const CONDITIONS = ["Brand New","Clean","Used","Damaged","Battle Worn","Rusted","Off-Road Modified","Race Modified","Armored"];
const DRIVE_TYPES = ["Front Wheel","Rear Wheel","All Wheel","Hover","Tracks","Legs","Jet","Warp Drive"];

const BODY_PRESETS = {
  compact:  { bodyLength:3.8, bodyWidth:1.7, bodyHeight:1.4, wheelbase:2.4, groundClearance:0.15, rakeAngle:15 },
  suv:      { bodyLength:4.5, bodyWidth:1.9, bodyHeight:1.8, wheelbase:2.7, groundClearance:0.22, rakeAngle:10 },
  sports:   { bodyLength:4.2, bodyWidth:1.8, bodyHeight:1.1, wheelbase:2.5, groundClearance:0.10, rakeAngle:25 },
  truck:    { bodyLength:5.5, bodyWidth:2.0, bodyHeight:1.9, wheelbase:3.2, groundClearance:0.28, rakeAngle:8 },
  van:      { bodyLength:5.0, bodyWidth:1.95, bodyHeight:2.1, wheelbase:3.0, groundClearance:0.16, rakeAngle:5 },
};

function Slider({ label, value, min, max, step=0.01, onChange }) {
  return (
    <div style={S.section}>
      <div style={S.label}><span>{label}</span><span style={{color:"#00ffc8"}}>{typeof value==="number"?value.toFixed(2):value}</span></div>
      <input type="range" style={S.slider} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function VehicleGeneratorPanel({ addObject }) {
  const [category, setCategory]     = useState("Land");
  const [vehicleType, setVehicleType] = useState("Sedan");
  const [era, setEra]               = useState("Modern");
  const [condition, setCondition]   = useState("Clean");
  const [driveType, setDriveType]   = useState("All Wheel");
  const [params, setParams]         = useState(BODY_PRESETS.compact);
  const [wheelCount, setWheelCount] = useState(4);
  const [wheelSize, setWheelSize]   = useState(0.35);
  const [wheelWidth, setWheelWidth] = useState(0.22);
  const [primaryColor, setPrimaryColor] = useState("#c0392b");
  const [secondaryColor, setSecondaryColor] = useState("#1a1a1a");
  const [glassColor, setGlassColor] = useState("#88ccff");
  const [roughness, setRoughness]   = useState(0.15);
  const [metalness, setMetalness]   = useState(0.85);
  const [details, setDetails]       = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = useCallback((key, val) => setParams(p => ({ ...p, [key]: val })), []);

  const DETAIL_OPTIONS = ["Spoiler","Roof Rack","Bull Bar","Side Skirts","Hood Scoop","Roll Cage","Turbo","Exhaust Tips","Fog Lights","Roof Lights","Armor Plates","Weaponry"];

  const toggleDetail = (d) => setDetails(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const generate = () => {
    if (!addObject) return;
    addObject({
      type: "vehicle",
      category, vehicleType, era, condition, driveType,
      body: params,
      wheels: { count: wheelCount, size: wheelSize, width: wheelWidth },
      colors: { primary: primaryColor, secondary: secondaryColor, glass: glassColor },
      material: { roughness, metalness },
      details,
      name: `${era}_${vehicleType}_${Date.now()}`,
    });
  };

  const randomize = () => {
    const cats = Object.keys(VEHICLE_CATEGORIES);
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const types = VEHICLE_CATEGORIES[cat];
    setCategory(cat);
    setVehicleType(types[Math.floor(Math.random() * types.length)]);
    setEra(ERAS[Math.floor(Math.random() * ERAS.length)]);
    setCondition(CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]);
    const presets = Object.values(BODY_PRESETS);
    setParams(presets[Math.floor(Math.random() * presets.length)]);
    setWheelSize(0.25 + Math.random() * 0.35);
    setPrimaryColor(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}`);
    setRoughness(Math.random() * 0.5);
    setMetalness(0.5 + Math.random() * 0.5);
  };

  return (
    <div style={S.panel}>
      <div style={S.h3}>🚗 Vehicle Generator</div>

      {/* Category tabs */}
      <div style={{display:"flex", flexWrap:"wrap", gap:4, marginBottom:8}}>
        {Object.keys(VEHICLE_CATEGORIES).map(c => (
          <span key={c} style={category===c ? S.tagOn : S.tag}
            onClick={() => { setCategory(c); setVehicleType(VEHICLE_CATEGORIES[c][0]); }}>{c}</span>
        ))}
      </div>

      {/* Type + Era */}
      <div style={S.row}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Vehicle</span></div>
          <select style={S.select} value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
            {(VEHICLE_CATEGORIES[category]||[]).map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Era</span></div>
          <select style={S.select} value={era} onChange={e => setEra(e.target.value)}>
            {ERAS.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <div style={S.row}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Condition</span></div>
          <select style={S.select} value={condition} onChange={e => setCondition(e.target.value)}>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Drive Type</span></div>
          <select style={S.select} value={driveType} onChange={e => setDriveType(e.target.value)}>
            {DRIVE_TYPES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Body presets */}
      <div style={S.section}>
        <div style={{...S.label, marginBottom:4}}><span>Body Presets</span></div>
        <div style={{display:"flex", flexWrap:"wrap", gap:4}}>
          {Object.keys(BODY_PRESETS).map(p => (
            <span key={p} style={S.tag} onClick={() => setParams(BODY_PRESETS[p])}>{p}</span>
          ))}
        </div>
      </div>

      {/* Body dimensions */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Body Dimensions</span></div>
      <Slider label="Length"         value={params.bodyLength}      min={1} max={20}  onChange={v => set("bodyLength", v)} />
      <Slider label="Width"          value={params.bodyWidth}       min={0.8} max={6} onChange={v => set("bodyWidth", v)} />
      <Slider label="Height"         value={params.bodyHeight}      min={0.5} max={5} onChange={v => set("bodyHeight", v)} />
      <Slider label="Wheelbase"      value={params.wheelbase}       min={1} max={10}  onChange={v => set("wheelbase", v)} />
      <Slider label="Ground Clearance" value={params.groundClearance} min={0.05} max={1} onChange={v => set("groundClearance", v)} />
      <Slider label="Rake Angle"     value={params.rakeAngle}       min={0} max={45} step={1} onChange={v => set("rakeAngle", v)} />

      {/* Wheels */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Wheels</span></div>
      <div style={S.row}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Count</span></div>
          <select style={S.select} value={wheelCount} onChange={e => setWheelCount(Number(e.target.value))}>
            {[2,3,4,6,8,10,12,16].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <Slider label="Size" value={wheelSize} min={0.15} max={1.5} onChange={setWheelSize} />
      </div>
      <Slider label="Wheel Width"    value={wheelWidth} min={0.1} max={0.6} onChange={setWheelWidth} />

      {/* Colors */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Colors</span></div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:8}}>
        {[["Body",primaryColor,setPrimaryColor],["Trim",secondaryColor,setSecondaryColor],["Glass",glassColor,setGlassColor]].map(([label,val,setter]) => (
          <div key={label}>
            <div style={{...S.label, marginBottom:4}}><span>{label}</span></div>
            <input type="color" value={val} onChange={e => setter(e.target.value)} style={{width:"100%", height:24, borderRadius:4, border:"none", cursor:"pointer"}} />
          </div>
        ))}
      </div>
      <Slider label="Paint Roughness" value={roughness} min={0} max={1} onChange={setRoughness} />
      <Slider label="Metalness"       value={metalness} min={0} max={1} onChange={setMetalness} />

      {/* Details */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Add-ons</span></div>
      <div style={{display:"flex", flexWrap:"wrap"}}>
        {DETAIL_OPTIONS.map(d => (
          <span key={d} style={details.includes(d) ? S.tagOn : S.tag} onClick={() => toggleDetail(d)}>{d}</span>
        ))}
      </div>

      <button style={S.btn} onClick={generate}>Generate Vehicle</button>
      <button style={S.btnSec} onClick={randomize}>🎲 Randomize</button>
    </div>
  );
}
