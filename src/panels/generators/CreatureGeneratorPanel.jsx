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

const CREATURE_TYPES  = ["Dragon","Wolf","Bear","Lion","Tiger","Eagle","Shark","Octopus","Scorpion","Spider","Serpent","Dinosaur","Griffon","Chimera","Phoenix","Golem","Undead","Demon","Angel","Alien"];
const BODY_TYPES      = ["Quadruped","Biped","Serpentine","Aquatic","Insectoid","Avian","Hybrid"];
const SKIN_TYPES      = ["Scales","Fur","Feathers","Smooth","Armored","Slime","Stone","Bark","Chitin","Ethereal"];
const LOCOMOTION      = ["Walk","Fly","Swim","Burrow","Crawl","Teleport","Slither"];
const ABILITIES       = ["Fire Breath","Ice Breath","Venom","Electroshock","Acid Spit","Camouflage","Regeneration","Flight","Burrowing","Psychic","Shadow Form","Time Warp"];
const SIZE_PRESETS    = { Tiny:0.2, Small:0.5, Medium:1.0, Large:2.0, Huge:4.0, Colossal:10.0 };

function Slider({ label, value, min, max, step=0.01, onChange }) {
  return (
    <div style={S.section}>
      <div style={S.label}><span>{label}</span><span style={{color:"#00ffc8"}}>{typeof value==="number"?value.toFixed(2):value}</span></div>
      <input type="range" style={S.slider} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function CreatureGeneratorPanel({ addObject }) {
  const [creatureType, setCreatureType]   = useState("Dragon");
  const [bodyType, setBodyType]           = useState("Quadruped");
  const [skinType, setSkinType]           = useState("Scales");
  const [locomotion, setLocomotion]       = useState("Walk");
  const [abilities, setAbilities]         = useState(["Fire Breath"]);
  const [size, setSize]                   = useState(1.0);
  const [headSize, setHeadSize]           = useState(1.0);
  const [neckLength, setNeckLength]       = useState(0.5);
  const [bodyLength, setBodyLength]       = useState(1.0);
  const [bodyWidth, setBodyWidth]         = useState(0.6);
  const [legLength, setLegLength]         = useState(0.8);
  const [legCount, setLegCount]           = useState(4);
  const [wingSpan, setWingSpan]           = useState(0);
  const [tailLength, setTailLength]       = useState(1.0);
  const [hornCount, setHornCount]         = useState(2);
  const [hornLength, setHornLength]       = useState(0.3);
  const [spineCount, setSpineCount]       = useState(0);
  const [primaryColor, setPrimaryColor]   = useState("#2d5a1b");
  const [secondaryColor, setSecondaryColor] = useState("#1a3a0a");
  const [eyeColor, setEyeColor]           = useState("#ff4400");
  const [agression, setAgression]         = useState(0.7);
  const [intelligence, setIntelligence]   = useState(0.5);
  const [showAdvanced, setShowAdvanced]   = useState(false);

  const toggleAbility = (a) => setAbilities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const generate = () => {
    if (!addObject) return;
    addObject({
      type: "creature",
      creatureType, bodyType, skinType, locomotion, abilities,
      params: { size, headSize, neckLength, bodyLength, bodyWidth, legLength, legCount, wingSpan, tailLength, hornCount, hornLength, spineCount },
      colors: { primary: primaryColor, secondary: secondaryColor, eye: eyeColor },
      stats: { agression, intelligence },
      name: `${creatureType}_${bodyType}_${Date.now()}`,
    });
  };

  const randomize = () => {
    setCreatureType(CREATURE_TYPES[Math.floor(Math.random() * CREATURE_TYPES.length)]);
    setBodyType(BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)]);
    setSkinType(SKIN_TYPES[Math.floor(Math.random() * SKIN_TYPES.length)]);
    setSize(0.3 + Math.random() * 4);
    setHeadSize(0.5 + Math.random());
    setNeckLength(Math.random());
    setBodyLength(0.5 + Math.random() * 1.5);
    setBodyWidth(0.3 + Math.random() * 0.8);
    setLegLength(0.3 + Math.random());
    setLegCount([2,4,6,8][Math.floor(Math.random()*4)]);
    setWingSpan(Math.random() * 3);
    setTailLength(Math.random() * 2);
    setHornCount(Math.floor(Math.random() * 5));
    setPrimaryColor(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}`);
    setSecondaryColor(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}`);
    setAgression(Math.random());
    setIntelligence(Math.random());
  };

  return (
    <div style={S.panel}>
      <div style={S.h3}>🐉 Creature Generator</div>

      {/* Type */}
      <div style={S.row}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Creature</span></div>
          <select style={S.select} value={creatureType} onChange={e => setCreatureType(e.target.value)}>
            {CREATURE_TYPES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Body Type</span></div>
          <select style={S.select} value={bodyType} onChange={e => setBodyType(e.target.value)}>
            {BODY_TYPES.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div style={S.row}>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Skin Type</span></div>
          <select style={S.select} value={skinType} onChange={e => setSkinType(e.target.value)}>
            {SKIN_TYPES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={{...S.label, marginBottom:4}}><span>Locomotion</span></div>
          <select style={S.select} value={locomotion} onChange={e => setLocomotion(e.target.value)}>
            {LOCOMOTION.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Size */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Size</span></div>
      <div style={{display:"flex", flexWrap:"wrap", gap:4, marginBottom:8}}>
        {Object.entries(SIZE_PRESETS).map(([name, val]) => (
          <span key={name} style={size===val ? S.tagOn : S.tag} onClick={() => setSize(val)}>{name}</span>
        ))}
      </div>
      <Slider label="Size"          value={size}       min={0.1} max={12}  onChange={setSize} />

      {/* Body */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Body</span></div>
      <Slider label="Head Size"     value={headSize}   min={0.3} max={2}   onChange={setHeadSize} />
      <Slider label="Neck Length"   value={neckLength} min={0}   max={2}   onChange={setNeckLength} />
      <Slider label="Body Length"   value={bodyLength} min={0.3} max={4}   onChange={setBodyLength} />
      <Slider label="Body Width"    value={bodyWidth}  min={0.2} max={2}   onChange={setBodyWidth} />
      <Slider label="Tail Length"   value={tailLength} min={0}   max={4}   onChange={setTailLength} />

      {/* Limbs */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Limbs</span></div>
      <div style={S.row}>
        <div><div style={{...S.label, marginBottom:4}}><span>Legs</span></div>
          <select style={S.select} value={legCount} onChange={e => setLegCount(Number(e.target.value))}>
            {[0,2,4,6,8].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <Slider label="Leg Length"  value={legLength}  min={0.1} max={3} onChange={setLegLength} />
      </div>
      <Slider label="Wing Span"     value={wingSpan}   min={0}   max={8}   onChange={setWingSpan} />

      {/* Features */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Features</span></div>
      <div style={S.row}>
        <Slider label="Horns"        value={hornCount}   min={0} max={8} step={1} onChange={setHornCount} />
        <Slider label="Horn Length"  value={hornLength}  min={0} max={1.5}        onChange={setHornLength} />
      </div>
      <Slider label="Spine Count"   value={spineCount} min={0} max={20} step={1} onChange={setSpineCount} />

      {/* Colors */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Colors</span></div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:8}}>
        {[["Primary",primaryColor,setPrimaryColor],["Secondary",secondaryColor,setSecondaryColor],["Eyes",eyeColor,setEyeColor]].map(([label,val,setter]) => (
          <div key={label}>
            <div style={{...S.label, marginBottom:4}}><span>{label}</span></div>
            <input type="color" value={val} onChange={e => setter(e.target.value)} style={{width:"100%", height:24, borderRadius:4, border:"none", cursor:"pointer"}} />
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Stats</span></div>
      <Slider label="Aggression"    value={agression}    min={0} max={1} onChange={setAgression} />
      <Slider label="Intelligence"  value={intelligence} min={0} max={1} onChange={setIntelligence} />

      {/* Abilities */}
      <div style={{...S.label, marginBottom:6, marginTop:4}}><span style={{color:"#00ffc8"}}>Abilities</span></div>
      <div style={{display:"flex", flexWrap:"wrap"}}>
        {ABILITIES.map(a => (
          <span key={a} style={abilities.includes(a) ? S.tagOn : S.tag} onClick={() => toggleAbility(a)}>{a}</span>
        ))}
      </div>

      <button style={S.btn} onClick={generate}>Generate Creature</button>
      <button style={S.btnSec} onClick={randomize}>🎲 Randomize</button>
    </div>
  );
}
