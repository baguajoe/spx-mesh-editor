import React, { useState, useCallback } from 'react';

function Slider({ label, value, min = 0, max = 1, step = 0.01, onChange, unit = '' }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888' }}>
        <span>{label}</span>
        <span style={{ color: '#00ffc8', fontWeight: 600 }}>
          {typeof value === 'number' ? (step < 0.1 ? value.toFixed(2) : Math.round(value)) : value}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#00ffc8', cursor: 'pointer', height: 16 }} />
    </div>
  );
}
function Select({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: 6 }}>
      {label && <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{label}</div>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', background: '#0d1117', color: '#e0e0e0',
        border: '1px solid #21262d', padding: '3px 6px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Check({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
      color: '#ccc', cursor: 'pointer', marginBottom: 4 }}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: '#00ffc8', width: 12, height: 12 }} />
      {label}
    </label>
  );
}
function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 10, color: '#888', flex: 1 }}>{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 32, height: 22, border: 'none', cursor: 'pointer', borderRadius: 3 }} />
      <span style={{ fontSize: 9, color: '#555', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 6, border: '1px solid #21262d', borderRadius: 5, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding: '5px 8px', cursor: 'pointer', background: '#0d1117',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, fontWeight: 600, color: '#00ffc8', userSelect: 'none',
      }}>
        <span>{title}</span>
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? '\u25b2' : '\u25bc'}</span>
      </div>
      {open && <div style={{ padding: '6px 8px', background: '#06060f' }}>{children}</div>}
    </div>
  );
}
function Badges({ items, active, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
      {items.map(item => (
        <button key={item} onClick={() => onSelect(item)} style={{
          padding: '2px 7px', fontSize: 9, borderRadius: 4, cursor: 'pointer',
          background: active === item ? '#00ffc8' : '#1a1f2c',
          color: active === item ? '#06060f' : '#ccc',
          border: `1px solid ${active === item ? '#00ffc8' : '#21262d'}`,
        }}>{item}</button>
      ))}
    </div>
  );
}
function NumInput({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 10, color: '#888', flex: 1 }}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: 60, background: '#0d1117', color: '#e0e0e0',
          border: '1px solid #21262d', padding: '2px 4px', borderRadius: 3, fontSize: 11, textAlign: 'right' }} />
      {unit && <span style={{ fontSize: 9, color: '#555' }}>{unit}</span>}
    </div>
  );
}
function GenBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: '#00ffc8', color: '#06060f', border: 'none',
      borderRadius: 4, padding: '7px 0', cursor: 'pointer', fontWeight: 700,
      fontSize: 12, marginTop: 6, letterSpacing: 0.5, fontFamily: 'JetBrains Mono, monospace',
    }}>{label}</button>
  );
}
function RandBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: '#1a1f2c', color: '#888', border: '1px solid #21262d',
      borderRadius: 4, padding: '6px 10px', cursor: 'pointer', fontSize: 11,
    }}>🎲</button>
  );
}
const P = { fontFamily: 'JetBrains Mono, monospace', color: '#e0e0e0', fontSize: 12, userSelect: 'none', width: '100%' };

const FOLIAGE_TYPES = ['Deciduous Tree','Conifer','Palm Tree','Oak','Willow','Birch','Dead Tree',
  'Bamboo','Cactus','Fern','Tropical Shrub','Flower Bush','Grass Tuft','Mushroom','Vine',
  'Seaweed','Coral','Bonsai','Mangrove','Cypress','Baobab','Cherry Blossom'];
const LEAF_SHAPES   = ['Oval','Maple','Fan','Pine Needle','Tropical','Compound','Fern Frond','Heart','Lance','Lobed'];
const BARK_TYPES    = ['Smooth','Rough','Peeling','Cracked','Mossy','Scaly','Fibrous','Cork','Birch White'];
const SEASONS       = ['Spring','Summer','Autumn','Winter','Tropical','Desert','Arctic','Eternal'];
const POLY_OPTIONS  = ['Low','Mid','High','Ultra'];

export default function FoliageGeneratorPanel({ onGenerate }) {
  const [foliageType,  setFoliageType]  = useState('Deciduous Tree');
  const [season,       setSeason]       = useState('Summer');
  const [seed,         setSeed]         = useState(42);
  // Trunk
  const [trunkH,       setTrunkH]       = useState(0.50);
  const [trunkGirth,   setTrunkGirth]   = useState(0.50);
  const [trunkTaper,   setTrunkTaper]   = useState(0.40);
  const [trunkCurve,   setTrunkCurve]   = useState(0.20);
  const [barkType,     setBarkType]     = useState('Rough');
  const [barkColor,    setBarkColor]    = useState('#5a3820');
  const [barkColor2,   setBarkColor2]   = useState('#3a2010');
  const [barkRough,    setBarkRough]    = useState(0.90);
  const [showRoots,    setShowRoots]    = useState(false);
  const [rootSpread,   setRootSpread]   = useState(0.30);
  const [rootDepth,    setRootDepth]    = useState(0.20);
  // Branches
  const [branchCount,    setBranchCount]    = useState(0.60);
  const [branchLen,      setBranchLen]      = useState(0.50);
  const [branchAngle,    setBranchAngle]    = useState(0.50);
  const [branchDroop,    setBranchDroop]    = useState(0.20);
  const [branchRecurse,  setBranchRecurse]  = useState(3);
  const [branchTaper,    setBranchTaper]    = useState(0.70);
  const [branchRandness, setBranchRandness] = useState(0.30);
  // Leaves
  const [leafShape,      setLeafShape]      = useState('Oval');
  const [leafDensity,    setLeafDensity]    = useState(0.70);
  const [leafSize,       setLeafSize]       = useState(0.50);
  const [leafColor,      setLeafColor]      = useState('#3a7a20');
  const [leafColor2,     setLeafColor2]     = useState('#5a9a30');
  const [leafColor3,     setLeafColor3]     = useState('#8ab040');
  const [leafGloss,      setLeafGloss]      = useState(0.30);
  const [leafTranslucency, setLeafTranslucency] = useState(0.40);
  const [leafTwist,      setLeafTwist]      = useState(0.10);
  // Wind
  const [windResp,       setWindResp]       = useState(0.50);
  const [windFreq,       setWindFreq]       = useState(0.50);
  const [windTurbulence, setWindTurbulence] = useState(0.30);
  // Extras
  const [flowerDensity,  setFlowerDensity]  = useState(0.00);
  const [flowerColor,    setFlowerColor]    = useState('#ff88cc');
  const [fruitDensity,   setFruitDensity]   = useState(0.00);
  const [fruitColor,     setFruitColor]     = useState('#dd3322');
  const [mossCoverage,   setMossCoverage]   = useState(0.00);
  const [snowCoverage,   setSnowCoverage]   = useState(0.00);
  // Output
  const [polyLevel,      setPolyLevel]      = useState('Mid');
  const [addLOD,         setAddLOD]         = useState(true);
  const [addCollider,    setAddCollider]    = useState(true);
  const [billboard,      setBillboard]      = useState(true);
  const [separateMeshes, setSeparateMeshes] = useState(false);
  const [windReadyRig,   setWindReadyRig]   = useState(true);

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a, b) => parseFloat((a + Math.random() * (b - a)).toFixed(2));
    setFoliageType(pick(FOLIAGE_TYPES)); setSeason(pick(SEASONS));
    setTrunkH(rn(0.2, 0.9)); setTrunkGirth(rn(0.2, 0.8));
    setBranchCount(rn(0.3, 0.9)); setLeafDensity(rn(0.4, 1.0));
    setSeed(Math.floor(Math.random() * 9999));
  }, []);

  return (
    <div style={P}>
      <Section title="🌳 Foliage Type">
        <Badges items={FOLIAGE_TYPES} active={foliageType} onSelect={setFoliageType} />
        <Select label="Season"      value={season} options={SEASONS} onChange={setSeason} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="🪵 Trunk">
        <Slider label="Height"          value={trunkH}     onChange={setTrunkH}     />
        <Slider label="Girth"           value={trunkGirth}  onChange={setTrunkGirth}  />
        <Slider label="Taper"           value={trunkTaper}  onChange={setTrunkTaper}  />
        <Slider label="Curve"           value={trunkCurve}  onChange={setTrunkCurve}  />
        <Badges items={BARK_TYPES} active={barkType} onSelect={setBarkType} />
        <ColorRow label="Bark Color 1"  value={barkColor}   onChange={setBarkColor}   />
        <ColorRow label="Bark Color 2"  value={barkColor2}  onChange={setBarkColor2}  />
        <Slider label="Bark Roughness"  value={barkRough}   onChange={setBarkRough}   />
        <Check  label="Surface Roots"   value={showRoots}   onChange={setShowRoots}   />
        {showRoots && <>
          <Slider label="Root Spread" value={rootSpread} onChange={setRootSpread} />
          <Slider label="Root Depth"  value={rootDepth}  onChange={setRootDepth}  />
        </>}
      </Section>
      <Section title="Branches">
        <Slider label="Count"       value={branchCount}    onChange={setBranchCount}    />
        <Slider label="Length"      value={branchLen}      onChange={setBranchLen}      />
        <Slider label="Spread Angle" value={branchAngle}   onChange={setBranchAngle}    />
        <Slider label="Droop"       value={branchDroop}    onChange={setBranchDroop}    />
        <Slider label="Recursion"   value={branchRecurse} min={0} max={6} step={1} onChange={setBranchRecurse} />
        <Slider label="Taper"       value={branchTaper}    onChange={setBranchTaper}    />
        <Slider label="Randomness"  value={branchRandness} onChange={setBranchRandness} />
      </Section>
      <Section title="🍃 Leaves">
        <Badges items={LEAF_SHAPES} active={leafShape} onSelect={setLeafShape} />
        <Slider label="Density"      value={leafDensity}       onChange={setLeafDensity}       />
        <Slider label="Size"         value={leafSize}          onChange={setLeafSize}          />
        <Slider label="Gloss"        value={leafGloss}         onChange={setLeafGloss}         />
        <Slider label="Translucency" value={leafTranslucency}  onChange={setLeafTranslucency}  />
        <Slider label="Twist"        value={leafTwist}         onChange={setLeafTwist}         />
        <ColorRow label="Leaf Color 1" value={leafColor}  onChange={setLeafColor}  />
        <ColorRow label="Leaf Color 2" value={leafColor2} onChange={setLeafColor2} />
        <ColorRow label="Leaf Color 3" value={leafColor3} onChange={setLeafColor3} />
      </Section>
      <Section title="💨 Wind" defaultOpen={false}>
        <Slider label="Response"   value={windResp}       onChange={setWindResp}       />
        <Slider label="Frequency"  value={windFreq}       onChange={setWindFreq}       />
        <Slider label="Turbulence" value={windTurbulence} onChange={setWindTurbulence} />
      </Section>
      <Section title="\u2728 Extras" defaultOpen={false}>
        <Slider   label="Flowers"      value={flowerDensity} onChange={setFlowerDensity} />
        {flowerDensity > 0 && <ColorRow label="Flower Color" value={flowerColor} onChange={setFlowerColor} />}
        <Slider   label="Fruit"        value={fruitDensity}  onChange={setFruitDensity}  />
        {fruitDensity  > 0 && <ColorRow label="Fruit Color"  value={fruitColor}  onChange={setFruitColor}  />}
        <Slider   label="Moss"         value={mossCoverage}  onChange={setMossCoverage}  />
        <Slider   label="Snow"         value={snowCoverage}  onChange={setSnowCoverage}  />
      </Section>
      <Section title="\u2699 Output" defaultOpen={false}>
        <Select label="Poly Budget"      value={polyLevel}      options={POLY_OPTIONS} onChange={setPolyLevel}      />
        <Check  label="Auto LOD"         value={addLOD}         onChange={setAddLOD}         />
        <Check  label="Collider"         value={addCollider}    onChange={setAddCollider}    />
        <Check  label="Billboard LOD"    value={billboard}      onChange={setBillboard}      />
        <Check  label="Separate Meshes"  value={separateMeshes} onChange={setSeparateMeshes} />
        <Check  label="Wind-Ready Rig"   value={windReadyRig}   onChange={setWindReadyRig}   />
      </Section>
      <div style={{ display: 'flex', gap: 6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="\u26a1 Generate Foliage" onClick={() => onGenerate?.({
          foliageType, season, seed,
          trunk: { trunkH, trunkGirth, trunkTaper, trunkCurve, barkType, barkColor, barkColor2, barkRough, showRoots, rootSpread, rootDepth },
          branches: { branchCount, branchLen, branchAngle, branchDroop, branchRecurse, branchTaper, branchRandness },
          leaves: { leafShape, leafDensity, leafSize, leafColor, leafColor2, leafColor3, leafGloss, leafTranslucency, leafTwist },
          wind: { windResp, windFreq, windTurbulence },
          extras: { flowerDensity, flowerColor, fruitDensity, fruitColor, mossCoverage, snowCoverage },
          output: { polyLevel, addLOD, addCollider, billboard, separateMeshes, windReadyRig },
        })} />
      </div>
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
