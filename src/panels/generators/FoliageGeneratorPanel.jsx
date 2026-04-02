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
  swatch:{ width:24, height:24, borderRadius:4, border:"1px solid #30363d", cursor:"pointer", display:"inline-block" },
};

const TREE_TYPES = ["Oak","Pine","Palm","Willow","Cherry Blossom","Maple","Birch","Baobab","Cypress","Mangrove","Dead Tree","Cartoon Tree"];
const BUSH_TYPES = ["Roundy","Elongated","Flowering","Thorny","Topiary","Wild","Hedge"];
const GRASS_TYPES = ["Short","Long","Savanna","Tropical","Wheat","Bamboo","Reed"];
const SEASONS   = ["Spring","Summer","Autumn","Winter"];
const CLIMATES  = ["Temperate","Tropical","Desert","Arctic","Mediterranean","Rainforest"];

const TREE_PRESETS = {
  oak:    { trunkHeight:2.0, trunkRadius:0.18, branchCount:8, branchLength:1.2, branchAngle:45, canopyRadius:1.8, canopyDensity:0.85, leafSize:0.18, leafCount:200, rootFlare:0.25 },
  pine:   { trunkHeight:4.0, trunkRadius:0.14, branchCount:12, branchLength:0.8, branchAngle:30, canopyRadius:0.8, canopyDensity:0.95, leafSize:0.06, leafCount:400, rootFlare:0.10 },
  palm:   { trunkHeight:5.0, trunkRadius:0.12, branchCount:8, branchLength:2.0, branchAngle:70, canopyRadius:2.2, canopyDensity:0.60, leafSize:0.40, leafCount:40,  rootFlare:0.08 },
  willow: { trunkHeight:3.0, trunkRadius:0.20, branchCount:10, branchLength:2.5, branchAngle:60, canopyRadius:2.5, canopyDensity:0.70, leafSize:0.12, leafCount:300, rootFlare:0.20 },
  dead:   { trunkHeight:3.5, trunkRadius:0.22, branchCount:6,  branchLength:1.0, branchAngle:50, canopyRadius:1.0, canopyDensity:0.00, leafSize:0.00, leafCount:0,   rootFlare:0.15 },
};

function Slider({ label, value, min, max, step=0.01, onChange }) {
  return (
    <div style={S.section}>
      <div style={S.label}><span>{label}</span><span style={{color:"#00ffc8"}}>{typeof value === "number" ? value.toFixed(2) : value}</span></div>
      <input type="range" style={S.slider} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function FoliageGeneratorPanel({ addObject }) {
  const [mode, setMode] = useState("tree");
  const [treeType, setTreeType] = useState("Oak");
  const [bushType, setBushType] = useState("Roundy");
  const [grassType, setGrassType] = useState("Short");
  const [season, setSeason] = useState("Summer");
  const [climate, setClimate] = useState("Temperate");
  const [params, setParams] = useState(TREE_PRESETS.oak);
  const [leafColor, setLeafColor] = useState("#3a7d44");
  const [trunkColor, setTrunkColor] = useState("#5c3d1e");
  const [windEffect, setWindEffect] = useState(false);
  const [showRoots, setShowRoots] = useState(false);
  const [count, setCount] = useState(1);
  const [scatter, setScatter] = useState(0);
  const [seed, setSeed] = useState(42);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = useCallback((key, val) => setParams(p => ({ ...p, [key]: val })), []);

  const generate = () => {
    if (!addObject) return;
    for (let i = 0; i < count; i++) {
      addObject({
        type: "foliage",
        subType: mode,
        params: { ...params, leafColor, trunkColor, windEffect, showRoots, season, climate, treeType, bushType, grassType },
        name: `${mode}_${treeType}_${Date.now()}_${i}`,
        scatter: scatter > 0 ? { radius: scatter, seed: seed + i } : null,
      });
    }
  };

  const randomize = () => {
    setSeed(Math.floor(Math.random() * 9999));
    setParams({
      trunkHeight: 1 + Math.random() * 5,
      trunkRadius: 0.08 + Math.random() * 0.25,
      branchCount: Math.floor(4 + Math.random() * 12),
      branchLength: 0.5 + Math.random() * 2,
      branchAngle:  20 + Math.random() * 60,
      canopyRadius: 0.5 + Math.random() * 3,
      canopyDensity:0.3 + Math.random() * 0.7,
      leafSize:     0.05 + Math.random() * 0.35,
      leafCount:    Math.floor(50 + Math.random() * 400),
      rootFlare:    0.05 + Math.random() * 0.3,
    });
  };

  return (
    <div style={S.panel}>
      <div style={S.h3}>🌿 Foliage Generator</div>

      {/* Mode tabs */}
      <div style={{display:"flex", gap:4, marginBottom:10}}>
        {["tree","bush","grass","scatter"].map(m => (
          <span key={m} style={mode===m ? S.tagOn : S.tag} onClick={() => setMode(m)}>{m}</span>
        ))}
      </div>

      {/* Type selector */}
      <div style={S.row}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>{mode === "tree" ? "Tree Type" : mode === "bush" ? "Bush Type" : "Grass Type"}</span></div>
          <select style={S.select} value={mode==="tree" ? treeType : mode==="bush" ? bushType : grassType}
            onChange={e => { if(mode==="tree") setTreeType(e.target.value); else if(mode==="bush") setBushType(e.target.value); else setGrassType(e.target.value); }}>
            {(mode==="tree" ? TREE_TYPES : mode==="bush" ? BUSH_TYPES : GRASS_TYPES).map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Season</span></div>
          <select style={S.select} value={season} onChange={e => setSeason(e.target.value)}>
            {SEASONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={S.row}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Climate</span></div>
          <select style={S.select} value={climate} onChange={e => setClimate(e.target.value)}>
            {CLIMATES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Count</span></div>
          <input type="number" min={1} max={50} value={count} onChange={e => setCount(Number(e.target.value))}
            style={{...S.select, width:"100%"}} />
        </div>
      </div>

      {/* Quick presets */}
      <div style={S.section}>
        <div style={{...S.label, marginBottom:4}}><span>Quick Presets</span></div>
        <div style={{display:"flex", flexWrap:"wrap", gap:4}}>
          {Object.keys(TREE_PRESETS).map(p => (
            <span key={p} style={S.tag} onClick={() => setParams(TREE_PRESETS[p])}>{p}</span>
          ))}
        </div>
      </div>

      {/* Trunk */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Trunk</span></div>
      <Slider label="Height"      value={params.trunkHeight} min={0.5} max={10}  onChange={v => set("trunkHeight", v)} />
      <Slider label="Radius"      value={params.trunkRadius} min={0.04} max={0.5} onChange={v => set("trunkRadius", v)} />
      <Slider label="Root Flare"  value={params.rootFlare}   min={0} max={0.5}   onChange={v => set("rootFlare", v)} />

      {/* Branches */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Branches</span></div>
      <Slider label="Count"       value={params.branchCount}  min={2}  max={24} step={1} onChange={v => set("branchCount", v)} />
      <Slider label="Length"      value={params.branchLength} min={0.2} max={4}  onChange={v => set("branchLength", v)} />
      <Slider label="Angle"       value={params.branchAngle}  min={10}  max={80} step={1} onChange={v => set("branchAngle", v)} />

      {/* Canopy */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Canopy / Leaves</span></div>
      <Slider label="Canopy Radius"  value={params.canopyRadius}  min={0.2} max={5}   onChange={v => set("canopyRadius", v)} />
      <Slider label="Density"        value={params.canopyDensity} min={0}   max={1}   onChange={v => set("canopyDensity", v)} />
      <Slider label="Leaf Size"      value={params.leafSize}      min={0.02} max={0.6} onChange={v => set("leafSize", v)} />
      <Slider label="Leaf Count"     value={params.leafCount}     min={0}   max={600} step={10} onChange={v => set("leafCount", v)} />

      {/* Colors */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Colors</span></div>
      <div style={{...S.row, alignItems:"center"}}>
        <div><div style={{...S.label, marginBottom:4}}><span>Leaves</span></div>
          <input type="color" value={leafColor} onChange={e => setLeafColor(e.target.value)} style={{width:"100%", height:28, borderRadius:4, border:"none", cursor:"pointer"}} /></div>
        <div><div style={{...S.label, marginBottom:4}}><span>Trunk</span></div>
          <input type="color" value={trunkColor} onChange={e => setTrunkColor(e.target.value)} style={{width:"100%", height:28, borderRadius:4, border:"none", cursor:"pointer"}} /></div>
      </div>

      {/* Options */}
      <div style={{display:"flex", flexWrap:"wrap", gap:4, marginBottom:8}}>
        <span style={windEffect ? S.tagOn : S.tag} onClick={() => setWindEffect(!windEffect)}>💨 Wind</span>
        <span style={showRoots ? S.tagOn : S.tag} onClick={() => setShowRoots(!showRoots)}>🌱 Roots</span>
      </div>

      {/* Advanced */}
      <div style={{...S.label, cursor:"pointer", marginBottom:6}} onClick={() => setShowAdvanced(!showAdvanced)}>
        <span style={{color:"#00ffc8"}}>Advanced {showAdvanced ? "▲" : "▼"}</span>
      </div>
      {showAdvanced && (
        <>
          <Slider label="Scatter Radius" value={scatter} min={0} max={20} onChange={setScatter} />
          <Slider label="Random Seed"    value={seed}    min={0} max={9999} step={1} onChange={setSeed} />
        </>
      )}

      <button style={S.btn} onClick={generate}>Generate {count > 1 ? `${count} Plants` : "Plant"}</button>
      <button style={S.btnSec} onClick={randomize}>🎲 Randomize</button>
    </div>
  );
}
