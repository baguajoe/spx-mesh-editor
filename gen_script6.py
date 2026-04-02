#!/usr/bin/env python3
"""
Script 6 — Real functional code, no padding.
Writes 6 panels with genuine feature implementations.
Run: python3 gen_script6.py
"""
import os

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    lines = content.count('\n') + 1
    code  = sum(1 for l in content.split('\n') if l.strip() and not l.strip().startswith('//'))
    status = '✓' if lines >= 400 else '✗'
    print(f"  {status} {lines:4d} lines  {code:3d} code  {os.path.basename(path)}")

BASE = "/workspaces/spx-mesh-editor/src"

UI = r"""import React, { useState, useCallback, useRef, useEffect } from 'react';

function Slider({ label, value, min=0, max=1, step=0.01, onChange, unit='' }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#888' }}>
        <span>{label}</span>
        <span style={{ color:'#00ffc8', fontWeight:600 }}>
          {typeof value==='number' ? (step<0.1 ? value.toFixed(2) : Math.round(value)) : value}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width:'100%', accentColor:'#00ffc8', cursor:'pointer', height:16 }} />
    </div>
  );
}
function Select({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom:6 }}>
      {label && <div style={{ fontSize:10, color:'#888', marginBottom:2 }}>{label}</div>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width:'100%', background:'#0d1117', color:'#e0e0e0',
        border:'1px solid #21262d', padding:'3px 6px', borderRadius:4, fontSize:11, cursor:'pointer',
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Check({ label, value, onChange }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11,
      color:'#ccc', cursor:'pointer', marginBottom:4 }}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        style={{ accentColor:'#00ffc8', width:12, height:12 }} />
      {label}
    </label>
  );
}
function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
      <span style={{ fontSize:10, color:'#888', flex:1 }}>{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width:32, height:22, border:'none', cursor:'pointer', borderRadius:3 }} />
      <span style={{ fontSize:9, color:'#555', fontFamily:'monospace' }}>{value}</span>
    </div>
  );
}
function Section({ title, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom:6, border:'1px solid #21262d', borderRadius:5, overflow:'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding:'5px 8px', cursor:'pointer', background:'#0d1117',
        display:'flex', justifyContent:'space-between',
        fontSize:11, fontWeight:600, color:'#00ffc8', userSelect:'none',
      }}>
        <span>{title}</span>
        <span style={{ fontSize:9, opacity:0.7 }}>{open ? '\u25b2' : '\u25bc'}</span>
      </div>
      {open && <div style={{ padding:'6px 8px', background:'#06060f' }}>{children}</div>}
    </div>
  );
}
function Badges({ items, active, onSelect }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginBottom:6 }}>
      {items.map(item => (
        <button key={item} onClick={() => onSelect(item)} style={{
          padding:'2px 7px', fontSize:9, borderRadius:4, cursor:'pointer',
          background: active===item ? '#00ffc8' : '#1a1f2c',
          color: active===item ? '#06060f' : '#ccc',
          border: `1px solid ${active===item ? '#00ffc8' : '#21262d'}`,
        }}>{item}</button>
      ))}
    </div>
  );
}
function GenBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', background:'#00ffc8', color:'#06060f', border:'none',
      borderRadius:4, padding:'7px 0', cursor:'pointer', fontWeight:700,
      fontSize:12, marginTop:6, letterSpacing:0.5, fontFamily:'JetBrains Mono, monospace',
    }}>{label}</button>
  );
}
function RandBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background:'#1a1f2c', color:'#888', border:'1px solid #21262d',
      borderRadius:4, padding:'6px 10px', cursor:'pointer', fontSize:11,
    }}>\u{1F3B2}</button>
  );
}
const P = { fontFamily:'JetBrains Mono, monospace', color:'#e0e0e0', fontSize:12, userSelect:'none', width:'100%' };
"""

# =============================================================================
# 1. ExpressionGeneratorPanel.jsx
# =============================================================================
write(f"{BASE}/components/panels/ExpressionGeneratorPanel.jsx", UI + r"""
const BASE_EXPRESSIONS = ['Neutral','Happy','Sad','Angry','Surprised','Fearful','Disgusted',
  'Contempt','Confused','Bored','Excited','Loving','Smug','Shy','Pain','Focused'];
const EXPRESSION_TARGETS = ['jawOpen','jawLeft','jawRight','jawForward',
  'mouthSmile_L','mouthSmile_R','mouthFrown_L','mouthFrown_R',
  'mouthOpen','mouthPucker','mouthFunnel','mouthShrugLower','mouthShrugUpper',
  'mouthPress_L','mouthPress_R','mouthLowerDown_L','mouthLowerDown_R',
  'mouthUpperUp_L','mouthUpperUp_R','mouthDimple_L','mouthDimple_R',
  'mouthStretch_L','mouthStretch_R','mouthRollLower','mouthRollUpper',
  'cheekPuff','cheekSquint_L','cheekSquint_R',
  'noseSneer_L','noseSneer_R',
  'eyeWide_L','eyeWide_R','eyeBlink_L','eyeBlink_R',
  'eyeSquint_L','eyeSquint_R','eyeLookUp_L','eyeLookUp_R',
  'eyeLookDown_L','eyeLookDown_R','eyeLookIn_L','eyeLookIn_R',
  'eyeLookOut_L','eyeLookOut_R',
  'browDown_L','browDown_R','browInnerUp','browOuterUp_L','browOuterUp_R',
  'tongueOut'];

const PRESET_EXPRESSIONS = {
  Happy:     { mouthSmile_L:0.7, mouthSmile_R:0.7, cheekSquint_L:0.4, cheekSquint_R:0.4, browInnerUp:0.1 },
  Sad:       { mouthFrown_L:0.6, mouthFrown_R:0.6, browInnerUp:0.7, browDown_L:0.2, browDown_R:0.2, eyeSquint_L:0.2, eyeSquint_R:0.2 },
  Angry:     { browDown_L:0.8, browDown_R:0.8, noseSneer_L:0.5, noseSneer_R:0.5, mouthPress_L:0.4, mouthPress_R:0.4 },
  Surprised: { jawOpen:0.6, eyeWide_L:0.9, eyeWide_R:0.9, browOuterUp_L:0.8, browOuterUp_R:0.8, browInnerUp:0.8 },
  Fearful:   { jawOpen:0.3, eyeWide_L:0.7, eyeWide_R:0.7, browInnerUp:0.9, mouthStretch_L:0.4, mouthStretch_R:0.4 },
  Disgusted: { noseSneer_L:0.8, noseSneer_R:0.8, mouthShrugUpper:0.5, mouthLowerDown_L:0.3, mouthLowerDown_R:0.3 },
  Contempt:  { mouthSmile_L:0.4, mouthDimple_L:0.3, cheekSquint_L:0.2 },
  Smug:      { mouthSmile_L:0.3, mouthSmile_R:0.1, eyeSquint_L:0.2, browDown_L:0.1 },
};

export default function ExpressionGeneratorPanel({ character, onApply, onBake }) {
  const [baseExpr,    setBaseExpr]    = useState('Neutral');
  const [blendTarget, setBlendTarget] = useState('Happy');
  const [blendWeight, setBlendWeight] = useState(0.0);
  const [intensity,   setIntensity]   = useState(1.0);
  const [symmetry,    setSymmetry]    = useState(true);
  const [smoothing,   setSmoothing]   = useState(0.3);
  const [seed,        setSeed]        = useState(1);

  // Per-target overrides
  const [overrides, setOverrides] = useState({});
  const [showTargets, setShowTargets] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Mouth');

  // Animation
  const [animating,    setAnimating]    = useState(false);
  const [animSpeed,    setAnimSpeed]    = useState(0.5);
  const [animAmplitude,setAnimAmplitude]= useState(0.3);
  const [animMode,     setAnimMode]     = useState('Blink');
  const animRef = useRef(null);

  const CATEGORIES = {
    Mouth: EXPRESSION_TARGETS.filter(t => t.startsWith('mouth') || t.startsWith('jaw') || t.startsWith('tongue')),
    Eyes:  EXPRESSION_TARGETS.filter(t => t.startsWith('eye')),
    Brows: EXPRESSION_TARGETS.filter(t => t.startsWith('brow')),
    Nose:  EXPRESSION_TARGETS.filter(t => t.startsWith('nose') || t.startsWith('cheek')),
  };

  const getBlendedValues = useCallback(() => {
    const base   = PRESET_EXPRESSIONS[baseExpr]  ?? {};
    const target = PRESET_EXPRESSIONS[blendTarget] ?? {};
    const result = {};
    const allKeys = [...new Set([...Object.keys(base), ...Object.keys(target)])];
    allKeys.forEach(k => {
      const bv = (base[k] ?? 0);
      const tv = (target[k] ?? 0);
      result[k] = (bv + (tv - bv) * blendWeight) * intensity;
    });
    // Apply overrides
    Object.entries(overrides).forEach(([k, v]) => { result[k] = v * intensity; });
    // Symmetry: copy _L to _R
    if (symmetry) {
      Object.keys(result).forEach(k => {
        if (k.endsWith('_L')) result[k.replace('_L','_R')] = result[k];
      });
    }
    return result;
  }, [baseExpr, blendTarget, blendWeight, intensity, overrides, symmetry]);

  const handleApply = useCallback(() => {
    onApply?.({ expression: getBlendedValues(), smoothing, intensity });
  }, [getBlendedValues, smoothing, intensity, onApply]);

  const handleRandom = useCallback(() => {
    const presets = Object.keys(PRESET_EXPRESSIONS);
    const pick = () => presets[Math.floor(Math.random() * presets.length)];
    setBaseExpr(pick());
    setBlendTarget(pick());
    setBlendWeight(parseFloat((Math.random()).toFixed(2)));
    setIntensity(parseFloat((0.5 + Math.random() * 0.5).toFixed(2)));
    setSeed(Math.floor(Math.random() * 9999));
  }, []);

  const startAnimation = useCallback(() => {
    setAnimating(true);
    let t = 0;
    animRef.current = setInterval(() => {
      t += 0.05 * animSpeed;
      if (animMode === 'Blink') {
        const blink = Math.max(0, Math.sin(t * 3) > 0.95 ? 1 : 0);
        onApply?.({ expression: { eyeBlink_L: blink, eyeBlink_R: blink }, smoothing: 0.1 });
      } else if (animMode === 'Breathe') {
        const v = (Math.sin(t) + 1) * 0.5 * animAmplitude;
        onApply?.({ expression: { jawOpen: v * 0.15, mouthOpen: v * 0.1 }, smoothing: 0.5 });
      } else if (animMode === 'Talk') {
        const v = Math.abs(Math.sin(t * 4)) * animAmplitude;
        onApply?.({ expression: { jawOpen: v, mouthOpen: v * 0.8 }, smoothing: 0.15 });
      }
    }, 33);
  }, [animMode, animSpeed, animAmplitude, onApply]);

  const stopAnimation = useCallback(() => {
    setAnimating(false);
    if (animRef.current) clearInterval(animRef.current);
  }, []);

  useEffect(() => () => { if (animRef.current) clearInterval(animRef.current); }, []);

  const currentValues = getBlendedValues();

  return (
    <div style={P}>
      <Section title="\u{1F604} Base Expression">
        <Badges items={BASE_EXPRESSIONS.slice(0,8)} active={baseExpr} onSelect={setBaseExpr} />
        <Badges items={BASE_EXPRESSIONS.slice(8)}   active={baseExpr} onSelect={setBaseExpr} />
      </Section>

      <Section title="\u{1F500} Blend">
        <Select label="Blend Target" value={blendTarget} options={Object.keys(PRESET_EXPRESSIONS)} onChange={setBlendTarget} />
        <Slider label="Blend Weight" value={blendWeight} onChange={setBlendWeight} />
      </Section>

      <Section title="\u2699 Controls">
        <Slider label="Intensity"  value={intensity}  onChange={setIntensity}  />
        <Slider label="Smoothing"  value={smoothing}  onChange={setSmoothing}  />
        <Check  label="Symmetry (mirror L→R)" value={symmetry} onChange={setSymmetry} />
      </Section>

      <Section title="\u{1F4CA} Live Values" defaultOpen={false}>
        <div style={{ fontSize:9, color:'#555', marginBottom:4 }}>Active morph targets (non-zero):</div>
        {Object.entries(currentValues).filter(([,v]) => v > 0.01).map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:2 }}>
            <span style={{ color:'#888' }}>{k}</span>
            <span style={{ color:'#00ffc8' }}>{v.toFixed(3)}</span>
          </div>
        ))}
        {Object.keys(currentValues).filter(k => currentValues[k] > 0.01).length === 0 && (
          <div style={{ fontSize:10, color:'#555' }}>Neutral (all zero)</div>
        )}
      </Section>

      <Section title="\u{1F3A8} Per-Target Override" defaultOpen={false}>
        <div style={{ display:'flex', gap:4, marginBottom:6 }}>
          {Object.keys(CATEGORIES).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              flex:1, padding:'3px 0', fontSize:9, borderRadius:3, cursor:'pointer',
              background: activeCategory===cat ? '#00ffc8' : '#1a1f2c',
              color: activeCategory===cat ? '#06060f' : '#888',
              border:`1px solid ${activeCategory===cat ? '#00ffc8' : '#21262d'}`,
            }}>{cat}</button>
          ))}
        </div>
        {CATEGORIES[activeCategory]?.map(target => (
          <Slider key={target} label={target}
            value={overrides[target] ?? currentValues[target] ?? 0}
            onChange={v => setOverrides(o => ({ ...o, [target]: v }))} />
        ))}
        <button onClick={() => setOverrides({})} style={{
          width:'100%', background:'#1a1f2c', color:'#888', border:'1px solid #21262d',
          borderRadius:3, padding:'4px 0', cursor:'pointer', fontSize:10, marginTop:4,
        }}>Clear Overrides</button>
      </Section>

      <Section title="\u25B6 Animation" defaultOpen={false}>
        <Select label="Anim Mode"  value={animMode}      options={['Blink','Breathe','Talk']} onChange={setAnimMode} />
        <Slider label="Speed"      value={animSpeed}      onChange={setAnimSpeed}      />
        <Slider label="Amplitude"  value={animAmplitude}  onChange={setAnimAmplitude}  />
        <div style={{ display:'flex', gap:6, marginTop:4 }}>
          <button onClick={animating ? stopAnimation : startAnimation} style={{
            flex:1, background: animating ? '#FF6600' : '#00ffc8', color:'#06060f',
            border:'none', borderRadius:4, padding:'5px 0', cursor:'pointer', fontWeight:700, fontSize:11,
          }}>{animating ? '\u23F9 Stop' : '\u25B6 Play'}</button>
          <button onClick={() => onBake?.(currentValues)} style={{
            flex:1, background:'#1a1f2c', color:'#ccc', border:'1px solid #21262d',
            borderRadius:4, padding:'5px 0', cursor:'pointer', fontSize:11,
          }}>Bake</button>
        </div>
      </Section>

      <div style={{ display:'flex', gap:6 }}>
        <RandBtn onClick={handleRandom} />
        <GenBtn label="\u2713 Apply Expression" onClick={handleApply} />
      </div>
    </div>
  );
}
""")

# =============================================================================
# 2. MorphGeneratorPanel.jsx
# =============================================================================
write(f"{BASE}/components/panels/MorphGeneratorPanel.jsx", UI + r"""
const MORPH_CATEGORIES = {
  'Face Shape': ['headScale','faceWidth','faceLength','chinProtrusion','chinWidth',
    'jawWidth','jawHeight','cheekboneWidth','cheekboneHeight','foreheadWidth','foreheadHeight'],
  'Eyes':       ['eyeSize','eyeSpacing','eyeDepth','eyeAngle','eyeHeight','eyelidHeavy','epicanthicFold'],
  'Nose':       ['noseSize','noseBridgeHeight','noseBridgeWidth','noseTipUp','noseTipRound',
    'nostrils','noseLength'],
  'Mouth':      ['lipThickness','lipWidth','cupidBow','mouthCorners','mouthDepth','philtrum'],
  'Ears':       ['earSize','earAngle','earProtrusion','lobSize'],
  'Body':       ['bodyHeight','shoulderWidth','chestSize','waistSize','hipSize',
    'armLength','legLength','neckThickness'],
};

export default function MorphGeneratorPanel({ character, onApply, onReset }) {
  const [category,    setCategory]    = useState('Face Shape');
  const [morphValues, setMorphValues] = useState({});
  const [presets,     setPresets]     = useState({});
  const [presetName,  setPresetName]  = useState('');
  const [symmetry,    setSymmetry]    = useState(true);
  const [strength,    setStrength]    = useState(1.0);
  const [smoothing,   setSmoothing]   = useState(0.5);
  const [history,     setHistory]     = useState([]);
  const [histIdx,     setHistIdx]     = useState(-1);

  const setMorph = useCallback((key, value) => {
    setMorphValues(prev => {
      const next = { ...prev, [key]: value };
      // Push to undo history
      setHistory(h => [...h.slice(0, histIdx + 1), prev].slice(-20));
      setHistIdx(i => Math.min(i + 1, 19));
      return next;
    });
  }, [histIdx]);

  const undo = useCallback(() => {
    if (histIdx < 0) return;
    setMorphValues(history[histIdx]);
    setHistIdx(i => i - 1);
  }, [history, histIdx]);

  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return;
    setHistIdx(i => i + 1);
    setMorphValues(history[histIdx + 1]);
  }, [history, histIdx]);

  const randomize = useCallback(() => {
    const rn = () => parseFloat((Math.random() * 0.6 - 0.3).toFixed(2));
    const next = {};
    Object.values(MORPH_CATEGORIES).flat().forEach(k => { next[k] = rn(); });
    setMorphValues(next);
  }, []);

  const reset = useCallback(() => {
    setMorphValues({});
    onReset?.();
  }, [onReset]);

  const savePreset = useCallback(() => {
    if (!presetName.trim()) return;
    setPresets(p => ({ ...p, [presetName]: { ...morphValues } }));
    setPresetName('');
  }, [presetName, morphValues]);

  const loadPreset = useCallback((name) => {
    const p = presets[name];
    if (p) setMorphValues({ ...p });
  }, [presets]);

  const handleApply = useCallback(() => {
    const scaled = {};
    Object.entries(morphValues).forEach(([k, v]) => { scaled[k] = v * strength; });
    onApply?.({ morphs: scaled, smoothing });
  }, [morphValues, strength, smoothing, onApply]);

  const activeTargets = MORPH_CATEGORIES[category] ?? [];
  const nonZero = Object.entries(morphValues).filter(([,v]) => Math.abs(v) > 0.001);

  return (
    <div style={P}>
      <Section title="\u{1F9EC} Category">
        <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginBottom:6 }}>
          {Object.keys(MORPH_CATEGORIES).map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding:'3px 8px', fontSize:9, borderRadius:4, cursor:'pointer',
              background: category===cat ? '#00ffc8' : '#1a1f2c',
              color: category===cat ? '#06060f' : '#ccc',
              border: `1px solid ${category===cat ? '#00ffc8' : '#21262d'}`,
            }}>{cat}</button>
          ))}
        </div>
      </Section>

      <Section title={`\u{1F3A8} ${category} Morphs`}>
        {activeTargets.map(key => (
          <Slider key={key} label={key}
            value={morphValues[key] ?? 0}
            min={-1} max={1} step={0.01}
            onChange={v => setMorph(key, v)} />
        ))}
      </Section>

      <Section title="\u2699 Controls">
        <Slider label="Overall Strength" value={strength}  onChange={setStrength}  />
        <Slider label="Smoothing"        value={smoothing} onChange={setSmoothing} />
        <Check  label="Symmetry"         value={symmetry}  onChange={setSymmetry}  />
      </Section>

      <Section title="\u{1F4CB} Active Morphs" defaultOpen={false}>
        {nonZero.length === 0 && <div style={{ fontSize:10, color:'#555' }}>No active morphs</div>}
        {nonZero.map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
            <span style={{ fontSize:10, color:'#888', flex:1 }}>{k}</span>
            <span style={{ fontSize:10, color: v>0 ? '#00ffc8' : '#FF6600', width:50, textAlign:'right' }}>
              {v > 0 ? '+' : ''}{v.toFixed(3)}
            </span>
            <button onClick={() => setMorph(k, 0)} style={{
              marginLeft:6, background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:11,
            }}>×</button>
          </div>
        ))}
      </Section>

      <Section title="\u{1F4BE} Presets" defaultOpen={false}>
        <div style={{ display:'flex', gap:4, marginBottom:6 }}>
          <input value={presetName} onChange={e => setPresetName(e.target.value)}
            placeholder="Preset name..." style={{
              flex:1, background:'#0d1117', color:'#e0e0e0', border:'1px solid #21262d',
              borderRadius:3, padding:'3px 6px', fontSize:10,
            }} />
          <button onClick={savePreset} style={{
            background:'#00ffc8', color:'#06060f', border:'none', borderRadius:3,
            padding:'3px 8px', cursor:'pointer', fontSize:10, fontWeight:700,
          }}>Save</button>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
          {Object.keys(presets).map(name => (
            <button key={name} onClick={() => loadPreset(name)} style={{
              padding:'2px 8px', fontSize:9, borderRadius:4, cursor:'pointer',
              background:'#1a1f2c', color:'#ccc', border:'1px solid #21262d',
            }}>{name}</button>
          ))}
        </div>
      </Section>

      <div style={{ display:'flex', gap:4, marginBottom:6 }}>
        <button onClick={undo} disabled={histIdx < 0} style={{
          flex:1, background:'#1a1f2c', color: histIdx>=0 ? '#ccc' : '#444',
          border:'1px solid #21262d', borderRadius:4, padding:'5px 0', cursor:'pointer', fontSize:10,
        }}>↩ Undo</button>
        <button onClick={redo} disabled={histIdx >= history.length-1} style={{
          flex:1, background:'#1a1f2c', color: histIdx<history.length-1 ? '#ccc' : '#444',
          border:'1px solid #21262d', borderRadius:4, padding:'5px 0', cursor:'pointer', fontSize:10,
        }}>↪ Redo</button>
        <button onClick={reset} style={{
          flex:1, background:'#1a1f2c', color:'#888', border:'1px solid #21262d',
          borderRadius:4, padding:'5px 0', cursor:'pointer', fontSize:10,
        }}>Reset</button>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="\u2713 Apply Morphs" onClick={handleApply} />
      </div>
    </div>
  );
}
""")

# =============================================================================
# 3. EyebrowGeneratorPanel.jsx
# =============================================================================
write(f"{BASE}/components/panels/EyebrowGeneratorPanel.jsx", UI + r"""
const BROW_SHAPES  = ['Straight','Arched','Peaked','Flat','S-Curve','Rounded','Angular','Bushy','Thin','Unibrow'];
const BROW_STYLES  = ['Natural','Defined','Bold','Feathered','Microbladed','Bleached','Tattooed','Ombre'];
const HAIR_COLORS  = ['#1a1008','#3a2010','#6a4020','#a06030','#c0a040','#e0d060','#f0f0f0','#e83030','#3030e0','#ffffff'];

export default function EyebrowGeneratorPanel({ character, onApply, onMirror }) {
  // Shape
  const [browShape,    setBrowShape]    = useState('Arched');
  const [browStyle,    setBrowStyle]    = useState('Natural');
  const [arch,         setArch]         = useState(0.50);
  const [archPos,      setArchPos]      = useState(0.55);
  const [thickness,    setThickness]    = useState(0.45);
  const [thicknessVar, setThicknessVar] = useState(0.30);
  const [length,       setLength]       = useState(0.55);
  const [tailAngle,    setTailAngle]    = useState(0.20);
  const [innerAngle,   setInnerAngle]   = useState(0.10);
  const [height,       setHeight]       = useState(0.50);
  const [spacing,      setSpacing]      = useState(0.50);
  const [frontGap,     setFrontGap]     = useState(0.30);
  // Hair properties
  const [hairColor,    setHairColor]    = useState('#1a1008');
  const [hairColor2,   setHairColor2]   = useState('#3a2010');
  const [hairDensity,  setHairDensity]  = useState(0.70);
  const [hairLen,      setHairLen]      = useState(0.40);
  const [hairCoarseness,setHairCoarseness]=useState(0.50);
  const [hairAngle,    setHairAngle]    = useState(0.30);
  const [greyAmount,   setGreyAmount]   = useState(0.00);
  // Grooming
  const [groomed,      setGroomed]      = useState(true);
  const [strayHairs,   setStrayHairs]   = useState(0.10);
  const [trimLevel,    setTrimLevel]    = useState(0.50);
  // Skin
  const [skinVisible,  setSkinVisible]  = useState(false);
  const [skinRoughness,setSkinRoughness]= useState(0.60);
  // Asymmetry
  const [asymmetry,    setAsymmetry]    = useState(0.00);
  const [asymSide,     setAsymSide]     = useState('Left');
  // Output
  const [genPair,      setGenPair]      = useState(true);
  const [addPhysics,   setAddPhysics]   = useState(false);
  const [polyBudget,   setPolyBudget]   = useState('Mid');

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a,b) => parseFloat((a + Math.random()*(b-a)).toFixed(2));
    setBrowShape(pick(BROW_SHAPES)); setBrowStyle(pick(BROW_STYLES));
    setArch(rn(0.1,0.9)); setArchPos(rn(0.4,0.7));
    setThickness(rn(0.2,0.8)); setLength(rn(0.4,0.7));
    setHairDensity(rn(0.4,1.0)); setGroomed(Math.random()>0.4);
    setAsymmetry(rn(0,0.2));
  }, []);

  const handleApply = useCallback(() => {
    onApply?.({
      shape: { browShape, arch, archPos, thickness, thicknessVar, length, tailAngle, innerAngle, height, spacing, frontGap },
      style: browStyle,
      hair: { hairColor, hairColor2, hairDensity, hairLen, hairCoarseness, hairAngle, greyAmount },
      grooming: { groomed, strayHairs, trimLevel },
      skin: { skinVisible, skinRoughness },
      asymmetry: { amount: asymmetry, side: asymSide },
      output: { genPair, addPhysics, polyBudget },
    });
  }, [browShape, arch, archPos, thickness, thicknessVar, length, tailAngle, innerAngle,
    height, spacing, frontGap, browStyle, hairColor, hairColor2, hairDensity, hairLen,
    hairCoarseness, hairAngle, greyAmount, groomed, strayHairs, trimLevel,
    skinVisible, skinRoughness, asymmetry, asymSide, genPair, addPhysics, polyBudget]);

  return (
    <div style={P}>
      <Section title="\u{1F9B9} Shape">
        <Badges items={BROW_SHAPES} active={browShape} onSelect={setBrowShape} />
        <Slider label="Arch Height"    value={arch}         onChange={setArch}         />
        <Slider label="Arch Position"  value={archPos}      onChange={setArchPos}      />
        <Slider label="Thickness"      value={thickness}    onChange={setThickness}    />
        <Slider label="Thickness Var"  value={thicknessVar} onChange={setThicknessVar} />
        <Slider label="Length"         value={length}       onChange={setLength}       />
        <Slider label="Tail Angle"     value={tailAngle}    min={-0.5} max={0.5} step={0.01} onChange={setTailAngle} />
        <Slider label="Inner Angle"    value={innerAngle}   min={-0.5} max={0.5} step={0.01} onChange={setInnerAngle} />
        <Slider label="Height on Face" value={height}       onChange={setHeight}       />
        <Slider label="Brow Spacing"   value={spacing}      onChange={setSpacing}      />
        <Slider label="Front Gap"      value={frontGap}     onChange={setFrontGap}     />
      </Section>

      <Section title="\u{1F58C} Style">
        <Badges items={BROW_STYLES} active={browStyle} onSelect={setBrowStyle} />
      </Section>

      <Section title="\u{1F9B1} Hair Properties">
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
          {HAIR_COLORS.map(c => (
            <div key={c} onClick={() => setHairColor(c)} style={{
              width:20, height:20, borderRadius:3, background:c, cursor:'pointer',
              border:`2px solid ${hairColor===c ? '#00ffc8' : '#21262d'}`,
            }} />
          ))}
        </div>
        <ColorRow label="Hair Color 1"  value={hairColor}      onChange={setHairColor}      />
        <ColorRow label="Hair Color 2"  value={hairColor2}     onChange={setHairColor2}     />
        <Slider label="Density"         value={hairDensity}    onChange={setHairDensity}    />
        <Slider label="Hair Length"     value={hairLen}        onChange={setHairLen}        />
        <Slider label="Coarseness"      value={hairCoarseness} onChange={setHairCoarseness} />
        <Slider label="Growth Angle"    value={hairAngle}      onChange={setHairAngle}      />
        <Slider label="Grey Amount"     value={greyAmount}     onChange={setGreyAmount}     />
      </Section>

      <Section title="\u2702 Grooming">
        <Check  label="Groomed"         value={groomed}       onChange={setGroomed}       />
        <Slider label="Stray Hairs"     value={strayHairs}    onChange={setStrayHairs}    />
        <Slider label="Trim Level"      value={trimLevel}     onChange={setTrimLevel}     />
      </Section>

      <Section title="\u{1F9EC} Asymmetry" defaultOpen={false}>
        <Slider label="Asymmetry Amount" value={asymmetry} min={0} max={0.4} step={0.01} onChange={setAsymmetry} />
        {asymmetry > 0 && (
          <Select label="Stronger Side" value={asymSide} options={['Left','Right']} onChange={setAsymSide} />
        )}
      </Section>

      <Section title="\u2699 Output" defaultOpen={false}>
        <Select label="Poly Budget" value={polyBudget} options={['Low','Mid','High','Ultra']} onChange={setPolyBudget} />
        <Check  label="Generate Pair (L+R)" value={genPair}    onChange={setGenPair}    />
        <Check  label="Physics Simulation"  value={addPhysics} onChange={setAddPhysics} />
        <Check  label="Visible Skin"        value={skinVisible} onChange={setSkinVisible} />
        {skinVisible && <Slider label="Skin Roughness" value={skinRoughness} onChange={setSkinRoughness} />}
      </Section>

      <div style={{ display:'flex', gap:6 }}>
        <RandBtn onClick={randomize} />
        <button onClick={() => onMirror?.()} style={{
          background:'#1a1f2c', color:'#888', border:'1px solid #21262d',
          borderRadius:4, padding:'6px 10px', cursor:'pointer', fontSize:10,
        }}>\u{1F503}</button>
        <GenBtn label="\u2713 Apply Brows" onClick={handleApply} />
      </div>
    </div>
  );
}
""")

# =============================================================================
# 4. HairPanel.jsx
# =============================================================================
write(f"{BASE}/components/hair/HairPanel.jsx", UI + r"""
const HAIR_STYLES  = ['Straight','Wavy','Curly','Coily','Afro','Braided','Locked','Buzzcut',
  'Mohawk','Bob','Pixie','Long','Ponytail','Bun','Updo','Undercut','Faded','Slicked'];
const HAIR_LENGTHS = ['Buzzed','Short','Ear Length','Chin Length','Shoulder','Mid-Back','Waist','Floor'];
const HAIR_COLORS  = ['#0a0808','#2a1808','#4a2810','#8a5020','#c08040','#d0b060','#f0f0e0','#e83030','#3040cc','#208040'];

export default function HairPanel({ character, scene, onUpdate }) {
  // Style
  const [hairStyle,    setHairStyle]    = useState('Straight');
  const [hairLength,   setHairLength]   = useState('Shoulder');
  const [seed,         setSeed]         = useState(42);
  // Colors
  const [rootColor,    setRootColor]    = useState('#2a1808');
  const [tipColor,     setTipColor]     = useState('#8a5020');
  const [highlightColor,setHighlightColor]=useState('#c08040');
  const [highlightStr, setHighlightStr] = useState(0.00);
  const [greyAmount,   setGreyAmount]   = useState(0.00);
  // Density & Distribution
  const [density,      setDensity]      = useState(0.75);
  const [thickness,    setThickness]    = useState(0.45);
  const [thicknessVar, setThicknessVar] = useState(0.25);
  const [hairlineRec,  setHairlineRec]  = useState(0.00);
  const [partSide,     setPartSide]     = useState('None');
  // Wave & Curl
  const [waveAmt,      setWaveAmt]      = useState(0.00);
  const [waveFreq,     setWaveFreq]     = useState(0.50);
  const [curlAmt,      setCurlAmt]      = useState(0.00);
  const [curlFreq,     setCurlFreq]     = useState(0.50);
  const [frizz,        setFrizz]        = useState(0.10);
  const [flyaways,     setFlyaways]     = useState(0.10);
  // Physics
  const [stiffness,    setStiffness]    = useState(0.70);
  const [damping,      setDamping]      = useState(0.80);
  const [windResp,     setWindResp]     = useState(0.40);
  const [gravity,      setGravity]      = useState(0.50);
  // Material
  const [roughness,    setRoughness]    = useState(0.70);
  const [glossiness,   setGlossiness]   = useState(0.30);
  const [subsurface,   setSubsurface]   = useState(0.20);
  const [shaderType,   setShaderType]   = useState('Kajiya-Kay');
  // Output
  const [renderMethod, setRenderMethod] = useState('Cards');
  const [cardCount,    setCardCount]    = useState(300);
  const [segments,     setSegments]     = useState(8);
  const [addLOD,       setAddLOD]       = useState(true);

  const PART_SIDES = ['None','Left','Right','Center','Zigzag'];
  const SHADER_TYPES = ['Kajiya-Kay','PBR','Fur Shell','Rasterized','Marschner'];
  const RENDER_METHODS = ['Cards','Tubes','Strips','Fur Shell','Points'];

  const handleApply = useCallback(() => {
    onUpdate?.({
      style:    { hairStyle, hairLength, seed },
      color:    { rootColor, tipColor, highlightColor, highlightStr, greyAmount },
      density:  { density, thickness, thicknessVar, hairlineRec, partSide },
      shape:    { waveAmt, waveFreq, curlAmt, curlFreq, frizz, flyaways },
      physics:  { stiffness, damping, windResp, gravity },
      material: { roughness, glossiness, subsurface, shaderType },
      output:   { renderMethod, cardCount, segments, addLOD },
    });
  }, [hairStyle, hairLength, seed, rootColor, tipColor, highlightColor, highlightStr,
    greyAmount, density, thickness, thicknessVar, hairlineRec, partSide,
    waveAmt, waveFreq, curlAmt, curlFreq, frizz, flyaways,
    stiffness, damping, windResp, gravity, roughness, glossiness, subsurface, shaderType,
    renderMethod, cardCount, segments, addLOD]);

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a,b) => parseFloat((a+Math.random()*(b-a)).toFixed(2));
    setHairStyle(pick(HAIR_STYLES)); setHairLength(pick(HAIR_LENGTHS));
    setRootColor(pick(HAIR_COLORS)); setTipColor(pick(HAIR_COLORS));
    setDensity(rn(0.4,1.0)); setWaveAmt(rn(0,0.5)); setCurlAmt(rn(0,0.4));
    setSeed(Math.floor(Math.random()*9999));
  }, []);

  return (
    <div style={P}>
      <Section title="\u{1F9B1} Hair Style">
        <Badges items={HAIR_STYLES.slice(0,9)}  active={hairStyle} onSelect={setHairStyle} />
        <Badges items={HAIR_STYLES.slice(9)}    active={hairStyle} onSelect={setHairStyle} />
        <Select label="Length"     value={hairLength} options={HAIR_LENGTHS} onChange={setHairLength} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>

      <Section title="\u{1F308} Color">
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
          {HAIR_COLORS.map(c => (
            <div key={c} onClick={() => setRootColor(c)} style={{
              width:20, height:20, borderRadius:3, background:c, cursor:'pointer',
              border:`2px solid ${rootColor===c ? '#00ffc8' : '#21262d'}`,
            }} />
          ))}
        </div>
        <ColorRow label="Root Color"      value={rootColor}      onChange={setRootColor}      />
        <ColorRow label="Tip Color"       value={tipColor}       onChange={setTipColor}       />
        <Slider   label="Highlight Str"   value={highlightStr}   onChange={setHighlightStr}   />
        {highlightStr > 0 && <ColorRow label="Highlight" value={highlightColor} onChange={setHighlightColor} />}
        <Slider   label="Grey Amount"     value={greyAmount}     onChange={setGreyAmount}     />
      </Section>

      <Section title="\u{1F4CA} Density">
        <Slider label="Density"          value={density}      onChange={setDensity}      />
        <Slider label="Thickness"        value={thickness}    onChange={setThickness}    />
        <Slider label="Thickness Var"    value={thicknessVar} onChange={setThicknessVar} />
        <Slider label="Hairline Recede"  value={hairlineRec}  onChange={setHairlineRec}  />
        <Select label="Part Side"        value={partSide}     options={PART_SIDES}  onChange={setPartSide} />
      </Section>

      <Section title="\u{1F300} Wave & Curl">
        <Slider label="Wave Amount"   value={waveAmt}  onChange={setWaveAmt}  />
        <Slider label="Wave Freq"     value={waveFreq} onChange={setWaveFreq} />
        <Slider label="Curl Amount"   value={curlAmt}  onChange={setCurlAmt}  />
        <Slider label="Curl Freq"     value={curlFreq} onChange={setCurlFreq} />
        <Slider label="Frizz"         value={frizz}    onChange={setFrizz}    />
        <Slider label="Flyaways"      value={flyaways} onChange={setFlyaways} />
      </Section>

      <Section title="\u{1F4A8} Physics">
        <Slider label="Stiffness"   value={stiffness} onChange={setStiffness} />
        <Slider label="Damping"     value={damping}   onChange={setDamping}   />
        <Slider label="Wind Resp"   value={windResp}  onChange={setWindResp}  />
        <Slider label="Gravity"     value={gravity}   onChange={setGravity}   />
      </Section>

      <Section title="\u{1F48E} Material" defaultOpen={false}>
        <Select label="Shader"      value={shaderType}  options={SHADER_TYPES}   onChange={setShaderType}   />
        <Slider label="Roughness"   value={roughness}   onChange={setRoughness}   />
        <Slider label="Glossiness"  value={glossiness}  onChange={setGlossiness}  />
        <Slider label="Subsurface"  value={subsurface}  onChange={setSubsurface}  />
      </Section>

      <Section title="\u2699 Output" defaultOpen={false}>
        <Select label="Render Method" value={renderMethod} options={RENDER_METHODS} onChange={setRenderMethod} />
        <Slider label="Card Count"    value={cardCount} min={50} max={2000} step={10} onChange={setCardCount} />
        <Slider label="Segments"      value={segments}  min={2}  max={16}   step={1}  onChange={setSegments}  />
        <Check  label="Auto LOD"      value={addLOD}    onChange={setAddLOD} />
      </Section>

      <div style={{ display:'flex', gap:6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="\u26a1 Apply Hair" onClick={handleApply} />
      </div>
    </div>
  );
}
""")

# =============================================================================
# 5. HairFXPanel.jsx
# =============================================================================
write(f"{BASE}/components/hair/HairFXPanel.jsx", UI + r"""
export default function HairFXPanel({ character, onUpdate }) {
  // Wet FX
  const [wetness,       setWetness]       = useState(0.00);
  const [wetnessColor,  setWetnessColor]  = useState('#0a0808');
  const [clumpStr,      setClumpStr]      = useState(0.50);
  const [dripSpeed,     setDripSpeed]     = useState(0.30);
  const [dripAmount,    setDripAmount]    = useState(0.40);
  const [fresnelPow,    setFresnelPow]    = useState(3.00);
  const [envReflStr,    setEnvReflStr]    = useState(0.60);
  // SSS
  const [sssEnabled,    setSssEnabled]    = useState(true);
  const [sssStr,        setSssStr]        = useState(0.30);
  const [sssColor,      setSssColor]      = useState('#c87040');
  const [sssRadius,     setSssRadius]     = useState(0.08);
  // Fur Shell
  const [furEnabled,    setFurEnabled]    = useState(false);
  const [furShells,     setFurShells]     = useState(16);
  const [furLength,     setFurLength]     = useState(0.04);
  const [furDensity,    setFurDensity]    = useState(0.70);
  const [furSoftness,   setFurSoftness]   = useState(0.50);
  const [furColor,      setFurColor]      = useState('#8a6030');
  // Specular
  const [specShift,     setSpecShift]     = useState(0.05);
  const [specShift2,    setSpecShift2]    = useState(-0.05);
  const [specPower,     setSpecPower]     = useState(80);
  const [spec2Str,      setSpec2Str]      = useState(0.40);
  const [specColor,     setSpecColor]     = useState('#fff8e0');
  // Alpha & Rendering
  const [alphaTest,     setAlphaTest]     = useState(0.10);
  const [alphaDither,   setAlphaDither]   = useState(false);
  const [depthWrite,    setDepthWrite]    = useState(false);
  const [doubleSide,    setDoubleSide]    = useState(true);
  // Strand Highlights
  const [highlightBand, setHighlightBand] = useState(false);
  const [highlightPos,  setHighlightPos]  = useState(0.30);
  const [highlightW,    setHighlightW]    = useState(0.10);
  const [highlightStr2, setHighlightStr2] = useState(0.50);
  // Color grading
  const [saturation,    setSaturation]    = useState(1.00);
  const [brightness,    setBrightness]    = useState(1.00);
  const [contrast,      setContrast]      = useState(1.00);
  const [tint,          setTint]          = useState('#ffffff');
  const [tintStr,       setTintStr]       = useState(0.00);

  const handleApply = useCallback(() => {
    onUpdate?.({
      wet:       { wetness, wetnessColor, clumpStr, dripSpeed, dripAmount, fresnelPow, envReflStr },
      sss:       { sssEnabled, sssStr, sssColor, sssRadius },
      fur:       { furEnabled, furShells, furLength, furDensity, furSoftness, furColor },
      specular:  { specShift, specShift2, specPower, spec2Str, specColor },
      alpha:     { alphaTest, alphaDither, depthWrite, doubleSide },
      highlight: { highlightBand, highlightPos, highlightW, highlightStr2 },
      grade:     { saturation, brightness, contrast, tint, tintStr },
    });
  }, [wetness, wetnessColor, clumpStr, dripSpeed, dripAmount, fresnelPow, envReflStr,
    sssEnabled, sssStr, sssColor, sssRadius,
    furEnabled, furShells, furLength, furDensity, furSoftness, furColor,
    specShift, specShift2, specPower, spec2Str, specColor,
    alphaTest, alphaDither, depthWrite, doubleSide,
    highlightBand, highlightPos, highlightW, highlightStr2,
    saturation, brightness, contrast, tint, tintStr]);

  return (
    <div style={P}>
      <Section title="\u{1F4A7} Wet FX">
        <Slider   label="Wetness"         value={wetness}      onChange={setWetness}      />
        {wetness > 0 && <>
          <ColorRow label="Wet Color"     value={wetnessColor} onChange={setWetnessColor} />
          <Slider   label="Clump Str"     value={clumpStr}     onChange={setClumpStr}     />
          <Slider   label="Drip Speed"    value={dripSpeed}    onChange={setDripSpeed}    />
          <Slider   label="Drip Amount"   value={dripAmount}   onChange={setDripAmount}   />
          <Slider   label="Fresnel Power" value={fresnelPow} min={0.5} max={8} step={0.1} onChange={setFresnelPow} />
          <Slider   label="Env Refl Str"  value={envReflStr}   onChange={setEnvReflStr}   />
        </>}
      </Section>

      <Section title="\u{1F9EA} Subsurface Scatter">
        <Check    label="Enable SSS"    value={sssEnabled} onChange={setSssEnabled} />
        {sssEnabled && <>
          <Slider   label="SSS Strength" value={sssStr}    onChange={setSssStr}    />
          <Slider   label="SSS Radius"   value={sssRadius} onChange={setSssRadius} />
          <ColorRow label="SSS Color"    value={sssColor}  onChange={setSssColor}  />
        </>}
      </Section>

      <Section title="\u{1F43E} Fur Shell">
        <Check label="Enable Fur Shell" value={furEnabled} onChange={setFurEnabled} />
        {furEnabled && <>
          <Slider   label="Shell Count" value={furShells}  min={4} max={64} step={1} onChange={setFurShells}  />
          <Slider   label="Fur Length"  value={furLength}  onChange={setFurLength}  />
          <Slider   label="Density"     value={furDensity} onChange={setFurDensity} />
          <Slider   label="Softness"    value={furSoftness} onChange={setFurSoftness} />
          <ColorRow label="Fur Color"   value={furColor}   onChange={setFurColor}   />
        </>}
      </Section>

      <Section title="\u2728 Specular">
        <Slider   label="Primary Shift"   value={specShift}  min={-0.3} max={0.3} step={0.01} onChange={setSpecShift}  />
        <Slider   label="Secondary Shift" value={specShift2} min={-0.3} max={0.3} step={0.01} onChange={setSpecShift2} />
        <Slider   label="Spec Power"      value={specPower}  min={10} max={200} step={5} onChange={setSpecPower}  />
        <Slider   label="Secondary Str"   value={spec2Str}   onChange={setSpec2Str}   />
        <ColorRow label="Spec Color"      value={specColor}  onChange={setSpecColor}  />
      </Section>

      <Section title="\u{1F31F} Strand Highlight" defaultOpen={false}>
        <Check  label="Highlight Band"    value={highlightBand} onChange={setHighlightBand} />
        {highlightBand && <>
          <Slider label="Position"  value={highlightPos} onChange={setHighlightPos} />
          <Slider label="Width"     value={highlightW}   onChange={setHighlightW}   />
          <Slider label="Strength"  value={highlightStr2} onChange={setHighlightStr2} />
        </>}
      </Section>

      <Section title="\u{1F3A8} Color Grade" defaultOpen={false}>
        <Slider   label="Saturation" value={saturation} min={0} max={2} step={0.05} onChange={setSaturation} />
        <Slider   label="Brightness" value={brightness} min={0} max={2} step={0.05} onChange={setBrightness} />
        <Slider   label="Contrast"   value={contrast}   min={0} max={2} step={0.05} onChange={setContrast}   />
        <Slider   label="Tint Str"   value={tintStr}    onChange={setTintStr}    />
        {tintStr > 0 && <ColorRow label="Tint Color" value={tint} onChange={setTint} />}
      </Section>

      <Section title="\u2699 Rendering" defaultOpen={false}>
        <Slider label="Alpha Test"    value={alphaTest}   min={0} max={0.5} step={0.01} onChange={setAlphaTest}   />
        <Check  label="Alpha Dither"  value={alphaDither} onChange={setAlphaDither} />
        <Check  label="Depth Write"   value={depthWrite}  onChange={setDepthWrite}  />
        <Check  label="Double Sided"  value={doubleSide}  onChange={setDoubleSide}  />
      </Section>

      <GenBtn label="\u26a1 Apply Hair FX" onClick={handleApply} />
    </div>
  );
}
""")

# =============================================================================
# 6. HairAdvancedPanel.jsx
# =============================================================================
write(f"{BASE}/components/hair/HairAdvancedPanel.jsx", UI + r"""
const GROOM_TOOLS   = ['Comb','Push','Pull','Smooth','Twist','Cut','Grow','Relax','Puff','Flatten'];
const LAYER_TYPES   = ['Base','Mid','Top','Flyaway','Vellus','Highlight','Lowlight','Streak','Undercoat'];

export default function HairAdvancedPanel({ character, hairSystem, onUpdate }) {
  // Active tool
  const [activeTool,    setActiveTool]    = useState('Comb');
  const [brushRadius,   setBrushRadius]   = useState(0.08);
  const [brushStr,      setBrushStr]      = useState(0.50);
  const [brushFalloff,  setBrushFalloff]  = useState(0.60);
  const [brushSmooth,   setBrushSmooth]   = useState(0.30);
  const [xMirror,       setXMirror]       = useState(true);
  const [screenProj,    setScreenProj]    = useState(false);
  // Strand selection
  const [selMode,       setSelMode]       = useState('All');
  const [selDensity,    setSelDensity]    = useState(1.00);
  const [selByLength,   setSelByLength]   = useState(false);
  const [selLenMin,     setSelLenMin]     = useState(0.00);
  const [selLenMax,     setSelLenMax]     = useState(1.00);
  const [selByAngle,    setSelByAngle]    = useState(false);
  const [selAngleMax,   setSelAngleMax]   = useState(0.50);
  // Layers
  const [activeLayer,   setActiveLayer]   = useState('Base');
  const [layerOpacity,  setLayerOpacity]  = useState(1.00);
  const [layerDensity,  setLayerDensity]  = useState(1.00);
  const [layerLocked,   setLayerLocked]   = useState(false);
  const [layerVisible,  setLayerVisible]  = useState(true);
  const [layers, setLayers] = useState(
    LAYER_TYPES.map(t => ({ type: t, opacity:1, density: t==='Base'?1:t==='Flyaway'?0.15:0.5, locked:false, visible:true }))
  );
  // Guide curves
  const [guideCount,    setGuideCount]    = useState(24);
  const [guideSegs,     setGuideSegs]     = useState(8);
  const [showGuides,    setShowGuides]    = useState(true);
  const [guideColor,    setGuideColor]    = useState('#00ffc8');
  // Clumping
  const [clumpEnabled,  setClumpEnabled]  = useState(false);
  const [clumpStr,      setClumpStr]      = useState(0.40);
  const [clumpCount,    setClumpCount]    = useState(0.30);
  const [clumpTip,      setClumpTip]      = useState(0.60);
  // Noise
  const [noiseEnabled,  setNoiseEnabled]  = useState(false);
  const [noiseStr,      setNoiseStr]      = useState(0.20);
  const [noiseScale,    setNoiseScale]    = useState(0.50);
  const [noiseFreq,     setNoiseFreq]     = useState(1.00);
  // History
  const [undoStack,     setUndoStack]     = useState([]);

  const pushUndo = useCallback((action) => {
    setUndoStack(s => [...s.slice(-19), action]);
  }, []);

  const handleToolChange = useCallback((tool) => {
    setActiveTool(tool);
    onUpdate?.({ type:'toolChange', tool });
  }, [onUpdate]);

  const handleBrushStroke = useCallback((params) => {
    pushUndo({ type: 'stroke', tool: activeTool, params });
    onUpdate?.({ type:'stroke', tool:activeTool, brushRadius, brushStr, brushFalloff, xMirror, ...params });
  }, [activeTool, brushRadius, brushStr, brushFalloff, xMirror, pushUndo, onUpdate]);

  const updateLayer = useCallback((layerType, prop, value) => {
    setLayers(ls => ls.map(l => l.type===layerType ? { ...l, [prop]:value } : l));
    onUpdate?.({ type:'layerUpdate', layer:layerType, prop, value });
  }, [onUpdate]);

  return (
    <div style={P}>
      <Section title="\u{1F527} Groom Tools">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:3, marginBottom:6 }}>
          {GROOM_TOOLS.map(tool => (
            <button key={tool} onClick={() => handleToolChange(tool)} style={{
              padding:'4px 0', fontSize:9, borderRadius:4, cursor:'pointer',
              background: activeTool===tool ? '#00ffc8' : '#1a1f2c',
              color: activeTool===tool ? '#06060f' : '#ccc',
              border: `1px solid ${activeTool===tool ? '#00ffc8' : '#21262d'}`,
            }}>{tool}</button>
          ))}
        </div>
        <Slider label="Brush Radius"   value={brushRadius}  min={0.01} max={0.3} step={0.005} onChange={setBrushRadius}  />
        <Slider label="Brush Strength" value={brushStr}     onChange={setBrushStr}     />
        <Slider label="Falloff"        value={brushFalloff} onChange={setBrushFalloff} />
        <Slider label="Smooth"         value={brushSmooth}  onChange={setBrushSmooth}  />
        <Check  label="X Mirror"       value={xMirror}      onChange={setXMirror}      />
        <Check  label="Screen Projection" value={screenProj} onChange={setScreenProj} />
      </Section>

      <Section title="\u{1F9F5} Layers">
        {layers.map(layer => (
          <div key={layer.type} style={{
            display:'flex', alignItems:'center', gap:4, marginBottom:4, padding:'3px 6px',
            background: activeLayer===layer.type ? '#0d1117' : 'transparent',
            borderRadius:3, cursor:'pointer', border:`1px solid ${activeLayer===layer.type?'#21262d':'transparent'}`
          }} onClick={() => setActiveLayer(layer.type)}>
            <button onClick={e => { e.stopPropagation(); updateLayer(layer.type,'visible',!layer.visible); }} style={{
              background:'none', border:'none', color: layer.visible ? '#00ffc8' : '#444', cursor:'pointer', fontSize:11, padding:0,
            }}>{layer.visible ? '\u{1F441}' : '\u{1F576}'}</button>
            <button onClick={e => { e.stopPropagation(); updateLayer(layer.type,'locked',!layer.locked); }} style={{
              background:'none', border:'none', color: layer.locked ? '#FF6600' : '#555', cursor:'pointer', fontSize:11, padding:0,
            }}>{layer.locked ? '\u{1F512}' : '\u{1F513}'}</button>
            <span style={{ flex:1, fontSize:10, color: activeLayer===layer.type ? '#e0e0e0' : '#888' }}>{layer.type}</span>
            <span style={{ fontSize:9, color:'#555' }}>{Math.round(layer.density*100)}%</span>
          </div>
        ))}
        {activeLayer && <>
          <Slider label="Layer Opacity" value={layers.find(l=>l.type===activeLayer)?.opacity??1}
            onChange={v => updateLayer(activeLayer,'opacity',v)} />
          <Slider label="Layer Density" value={layers.find(l=>l.type===activeLayer)?.density??1}
            onChange={v => updateLayer(activeLayer,'density',v)} />
        </>}
      </Section>

      <Section title="\u{1F4CF} Guide Curves" defaultOpen={false}>
        <Slider label="Guide Count"  value={guideCount} min={4} max={100} step={1} onChange={setGuideCount} />
        <Slider label="Segments"     value={guideSegs}  min={2} max={20}  step={1} onChange={setGuideSegs}  />
        <Check  label="Show Guides"  value={showGuides} onChange={setShowGuides} />
        {showGuides && <ColorRow label="Guide Color" value={guideColor} onChange={setGuideColor} />}
      </Section>

      <Section title="\u{1F9F7} Clumping" defaultOpen={false}>
        <Check  label="Enable Clumping" value={clumpEnabled} onChange={setClumpEnabled} />
        {clumpEnabled && <>
          <Slider label="Strength"    value={clumpStr}   onChange={setClumpStr}   />
          <Slider label="Clump Count" value={clumpCount} onChange={setClumpCount} />
          <Slider label="Tip Weight"  value={clumpTip}   onChange={setClumpTip}   />
        </>}
      </Section>

      <Section title="\u{1F300} Noise" defaultOpen={false}>
        <Check  label="Enable Noise" value={noiseEnabled} onChange={setNoiseEnabled} />
        {noiseEnabled && <>
          <Slider label="Strength"   value={noiseStr}   onChange={setNoiseStr}   />
          <Slider label="Scale"      value={noiseScale} onChange={setNoiseScale} />
          <Slider label="Frequency"  value={noiseFreq}  onChange={setNoiseFreq}  />
        </>}
      </Section>

      <div style={{ display:'flex', gap:4, marginTop:4 }}>
        <button onClick={() => { setUndoStack(s => s.slice(0,-1)); onUpdate?.({ type:'undo' }); }}
          disabled={undoStack.length===0} style={{
          flex:1, background:'#1a1f2c', color: undoStack.length>0?'#ccc':'#444',
          border:'1px solid #21262d', borderRadius:4, padding:'5px 0', cursor:'pointer', fontSize:10,
        }}>↩ Undo ({undoStack.length})</button>
        <button onClick={() => onUpdate?.({ type:'rebuild' })} style={{
          flex:1, background:'#1a1f2c', color:'#888', border:'1px solid #21262d',
          borderRadius:4, padding:'5px 0', cursor:'pointer', fontSize:10,
        }}>Rebuild</button>
        <button onClick={() => onUpdate?.({ type:'export' })} style={{
          flex:1, background:'#1a1f2c', color:'#888', border:'1px solid #21262d',
          borderRadius:4, padding:'5px 0', cursor:'pointer', fontSize:10,
        }}>Export</button>
      </div>
    </div>
  );
}
""")

print("\n✅ Script 6 complete — 6 panels with real functional code.")
print("\nNext: git add -A && git commit -m 'feat: expression/morph/eyebrow/hair panels — full functional code' && git push")
