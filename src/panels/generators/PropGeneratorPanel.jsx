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

const CATEGORIES = {
  Furniture: ["Chair","Table","Sofa","Bed","Desk","Bookshelf","Cabinet","Lamp","Wardrobe","Stool"],
  Kitchen:   ["Pot","Pan","Cup","Plate","Bowl","Knife","Fork","Spoon","Bottle","Vase"],
  Weapons:   ["Sword","Axe","Spear","Bow","Shield","Dagger","Mace","Staff","Crossbow","Hammer"],
  SciFi:     ["Console","Terminal","Crate","Barrel","Generator","Antenna","Pod","Turret","Scanner","Drone"],
  Fantasy:   ["Chest","Torch","Cauldron","Scroll","Crystal","Rune Stone","Magic Staff","Amulet","Potion","Tome"],
  Street:    ["Bench","Mailbox","Fire Hydrant","Traffic Cone","Trash Can","Street Light","Bus Stop","Newspaper Box","Bike Rack","Planter"],
  Nature:    ["Rock","Boulder","Log","Stump","Mushroom","Flower","Bush","Pebble","Stick","Leaf Pile"],
  Tech:      ["Laptop","Phone","TV","Speaker","Keyboard","Monitor","Router","Camera","Tablet","Headphones"],
};

const MATERIALS = ["Wood","Metal","Plastic","Stone","Fabric","Glass","Ceramic","Leather","Rubber","Gold","Silver","Bronze","Carbon Fiber","Marble"];
const STYLES    = ["Realistic","Cartoon","Low Poly","Stylized","Worn","Rusted","Futuristic","Medieval","Modern","Antique"];
const DAMAGE    = ["None","Scratched","Dented","Cracked","Burnt","Rusted","Broken","Weathered","Battle Worn"];

function Slider({ label, value, min, max, step=0.01, onChange }) {
  return (
    <div style={S.section}>
      <div style={S.label}><span>{label}</span><span style={{color:"#00ffc8"}}>{typeof value==="number"?value.toFixed(2):value}</span></div>
      <input type="range" style={S.slider} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function PropGeneratorPanel({ addObject }) {
  const [category, setCategory]   = useState("Furniture");
  const [propType, setPropType]   = useState("Chair");
  const [material, setMaterial]   = useState("Wood");
  const [style, setStyle]         = useState("Realistic");
  const [damage, setDamage]       = useState("None");
  const [scaleX, setScaleX]       = useState(1.0);
  const [scaleY, setScaleY]       = useState(1.0);
  const [scaleZ, setScaleZ]       = useState(1.0);
  const [uniformScale, setUniformScale] = useState(1.0);
  const [lockScale, setLockScale] = useState(true);
  const [roughness, setRoughness] = useState(0.5);
  const [metalness, setMetalness] = useState(0.0);
  const [color, setColor]         = useState("#a0785a");
  const [uvScale, setUvScale]     = useState(1.0);
  const [subdivision, setSubdivision] = useState(1);
  const [count, setCount]         = useState(1);
  const [scatter, setScatter]     = useState(0);
  const [seed, setSeed]           = useState(42);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [detailLevel, setDetailLevel] = useState("Medium");

  const generate = () => {
    if (!addObject) return;
    for (let i = 0; i < count; i++) {
      addObject({
        type: "prop",
        category, propType, material, style, damage,
        scale: lockScale ? [uniformScale, uniformScale, uniformScale] : [scaleX, scaleY, scaleZ],
        roughness, metalness, color, uvScale, subdivision, detailLevel,
        name: `${propType}_${material}_${Date.now()}_${i}`,
        scatter: scatter > 0 ? { radius: scatter, seed: seed + i } : null,
      });
    }
  };

  const randomize = () => {
    const cats = Object.keys(CATEGORIES);
    const cat  = cats[Math.floor(Math.random() * cats.length)];
    const props = CATEGORIES[cat];
    setCategory(cat);
    setPropType(props[Math.floor(Math.random() * props.length)]);
    setMaterial(MATERIALS[Math.floor(Math.random() * MATERIALS.length)]);
    setStyle(STYLES[Math.floor(Math.random() * STYLES.length)]);
    setDamage(DAMAGE[Math.floor(Math.random() * DAMAGE.length)]);
    setRoughness(Math.random());
    setMetalness(Math.random() * 0.5);
    setUniformScale(0.5 + Math.random() * 2);
    setSeed(Math.floor(Math.random() * 9999));
  };

  return (
    <div style={S.panel}>
      <div style={S.h3}>📦 Prop Generator</div>

      {/* Category */}
      <div style={S.section}>
        <div style={{...S.label, marginBottom:4}}><span>Category</span></div>
        <div style={{display:"flex", flexWrap:"wrap", gap:4, marginBottom:6}}>
          {Object.keys(CATEGORIES).map(c => (
            <span key={c} style={category===c ? S.tagOn : S.tag} onClick={() => { setCategory(c); setPropType(CATEGORIES[c][0]); }}>{c}</span>
          ))}
        </div>
      </div>

      {/* Type */}
      <div style={S.row}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Prop Type</span></div>
          <select style={S.select} value={propType} onChange={e => setPropType(e.target.value)}>
            {(CATEGORIES[category] || []).map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Style</span></div>
          <select style={S.select} value={style} onChange={e => setStyle(e.target.value)}>
            {STYLES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={S.row}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Material</span></div>
          <select style={S.select} value={material} onChange={e => setMaterial(e.target.value)}>
            {MATERIALS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Damage</span></div>
          <select style={S.select} value={damage} onChange={e => setDamage(e.target.value)}>
            {DAMAGE.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Scale */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Scale</span>
        <span style={lockScale ? S.tagOn : S.tag} onClick={() => setLockScale(!lockScale)}>🔒 Lock</span>
      </div>
      {lockScale ? (
        <Slider label="Uniform Scale" value={uniformScale} min={0.1} max={5} onChange={setUniformScale} />
      ) : (
        <>
          <Slider label="Scale X" value={scaleX} min={0.1} max={5} onChange={setScaleX} />
          <Slider label="Scale Y" value={scaleY} min={0.1} max={5} onChange={setScaleY} />
          <Slider label="Scale Z" value={scaleZ} min={0.1} max={5} onChange={setScaleZ} />
        </>
      )}

      {/* Material props */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Material Properties</span></div>
      <div style={{...S.row, alignItems:"center", marginBottom:8}}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Base Color</span></div>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{width:"100%", height:28, borderRadius:4, border:"none", cursor:"pointer"}} />
        </div>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Detail</span></div>
          <select style={S.select} value={detailLevel} onChange={e => setDetailLevel(e.target.value)}>
            {["Low","Medium","High","Ultra"].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <Slider label="Roughness"   value={roughness} min={0} max={1} onChange={setRoughness} />
      <Slider label="Metalness"   value={metalness} min={0} max={1} onChange={setMetalness} />
      <Slider label="UV Scale"    value={uvScale}   min={0.1} max={4} onChange={setUvScale} />

      {/* Count */}
      <div style={S.row}>
        <div><div style={{...S.label, marginBottom:4}}><span>Count</span></div>
          <input type="number" min={1} max={50} value={count} onChange={e => setCount(Number(e.target.value))} style={{...S.select}} /></div>
        <div><div style={{...S.label, marginBottom:4}}><span>Subdivision</span></div>
          <input type="number" min={0} max={3} value={subdivision} onChange={e => setSubdivision(Number(e.target.value))} style={{...S.select}} /></div>
      </div>

      {/* Advanced */}
      <div style={{...S.label, cursor:"pointer", marginBottom:6}} onClick={() => setShowAdvanced(!showAdvanced)}>
        <span style={{color:"#00ffc8"}}>Advanced {showAdvanced?"▲":"▼"}</span>
      </div>
      {showAdvanced && (
        <>
          <Slider label="Scatter Radius" value={scatter} min={0} max={20} onChange={setScatter} />
          <Slider label="Random Seed"    value={seed}    min={0} max={9999} step={1} onChange={setSeed} />
        </>
      )}

      <button style={S.btn} onClick={generate}>Generate {count > 1 ? `${count} Props` : "Prop"}</button>
      <button style={S.btnSec} onClick={randomize}>🎲 Randomize</button>
    </div>
  );
}
