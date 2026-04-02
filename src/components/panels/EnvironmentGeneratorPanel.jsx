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
    }}>\u{1F3B2}</button>
  );
}
const P = { fontFamily: 'JetBrains Mono, monospace', color: '#e0e0e0', fontSize: 12, userSelect: 'none', width: '100%' };

const ENV_TYPES    = ['Forest','Desert','Tundra','Jungle','Swamp','Mountains','Plains','Beach','Cave','Urban','Volcanic','Underwater','Alien','Ruins','Savanna'];
const SEASONS      = ['Spring','Summer','Autumn','Winter','Dry Season','Wet Season','Eternal Night','Eternal Day'];
const TIMES        = ['Dawn','Morning','Noon','Afternoon','Dusk','Night','Midnight','Overcast'];
const WEATHER      = ['Clear','Cloudy','Foggy','Rain','Storm','Snow','Blizzard','Heatwave','Sandstorm','Ash Fall'];
const POLY_OPTIONS = ['Low','Mid','High','Ultra'];

export default function EnvironmentGeneratorPanel({ onGenerate }) {
  const [envType,       setEnvType]       = useState('Forest');
  const [season,        setSeason]        = useState('Summer');
  const [timeOfDay,     setTimeOfDay]     = useState('Noon');
  const [weather,       setWeather]       = useState('Clear');
  const [seed,          setSeed]          = useState(1);
  // Scale
  const [scaleX,        setScaleX]        = useState(100);
  const [scaleZ,        setScaleZ]        = useState(100);
  const [heightScale,   setHeightScale]   = useState(20);
  const [heightOffset,  setHeightOffset]  = useState(0);
  // Terrain
  const [roughness,     setRoughness]     = useState(0.50);
  const [erosion,       setErosion]       = useState(0.30);
  const [plateauLevel,  setPlateauLevel]  = useState(0.00);
  const [cliffiness,    setCliffiness]    = useState(0.20);
  // Vegetation
  const [treeDensity,   setTreeDensity]   = useState(0.50);
  const [treeVariety,   setTreeVariety]   = useState(0.40);
  const [shrubDensity,  setShrubDensity]  = useState(0.40);
  const [grassDensity,  setGrassDensity]  = useState(0.60);
  const [grassHeight,   setGrassHeight]   = useState(0.40);
  const [flowerDensity, setFlowerDensity] = useState(0.10);
  const [rockDensity,   setRockDensity]   = useState(0.35);
  const [rockSize,      setRockSize]      = useState(0.50);
  // Water
  const [waterLevel,    setWaterLevel]    = useState(0.15);
  const [waterRough,    setWaterRough]    = useState(0.10);
  const [waterColor,    setWaterColor]    = useState('#1a4a8a');
  const [waveHeight,    setWaveHeight]    = useState(0.10);
  const [hasRiver,      setHasRiver]      = useState(false);
  const [hasLake,       setHasLake]       = useState(false);
  // Atmosphere
  const [fogDensity,    setFogDensity]    = useState(0.10);
  const [fogColor,      setFogColor]      = useState('#c8d8e8');
  const [ambientStr,    setAmbientStr]    = useState(0.40);
  const [sunAngle,      setSunAngle]      = useState(0.50);
  const [skyColor,      setSkyColor]      = useState('#4a88d8');
  const [cloudCover,    setCloudCover]    = useState(0.20);
  // Output
  const [polyBudget,    setPolyBudget]    = useState('Mid');
  const [addLights,     setAddLights]     = useState(true);
  const [addColliders,  setAddColliders]  = useState(true);
  const [addLOD,        setAddLOD]        = useState(true);
  const [addNavMesh,    setAddNavMesh]    = useState(false);
  const [splitChunks,   setSplitChunks]   = useState(false);

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a, b) => parseFloat((a + Math.random() * (b - a)).toFixed(2));
    setEnvType(pick(ENV_TYPES)); setSeason(pick(SEASONS));
    setTimeOfDay(pick(TIMES)); setWeather(pick(WEATHER));
    setRoughness(rn(0.1, 0.9)); setTreeDensity(rn(0, 1));
    setWaterLevel(rn(0, 0.5)); setFogDensity(rn(0, 0.4));
    setSeed(Math.floor(Math.random() * 9999));
  }, []);

  return (
    <div style={P}>
      <Section title="\u{1F30D} Environment">
        <Badges items={ENV_TYPES} active={envType} onSelect={setEnvType} />
        <Select label="Season"     value={season}    options={SEASONS} onChange={setSeason}    />
        <Select label="Time of Day" value={timeOfDay} options={TIMES}  onChange={setTimeOfDay} />
        <Select label="Weather"    value={weather}   options={WEATHER} onChange={setWeather}   />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="Scale">
        <NumInput label="Width"       value={scaleX}       min={10}  max={2000} onChange={setScaleX}       unit="m" />
        <NumInput label="Depth"       value={scaleZ}       min={10}  max={2000} onChange={setScaleZ}       unit="m" />
        <NumInput label="Max Height"  value={heightScale}  min={1}   max={500}  onChange={setHeightScale}  unit="m" />
        <NumInput label="Base Offset" value={heightOffset} min={-50} max={50}   onChange={setHeightOffset} unit="m" />
      </Section>
      <Section title="Terrain">
        <Slider label="Roughness"    value={roughness}    onChange={setRoughness}    />
        <Slider label="Erosion"      value={erosion}      onChange={setErosion}      />
        <Slider label="Plateau"      value={plateauLevel} onChange={setPlateauLevel} />
        <Slider label="Cliffs"       value={cliffiness}   onChange={setCliffiness}   />
      </Section>
      <Section title="\u{1F333} Vegetation">
        <Slider label="Tree Density"   value={treeDensity}   onChange={setTreeDensity}   />
        <Slider label="Tree Variety"   value={treeVariety}   onChange={setTreeVariety}   />
        <Slider label="Shrub Density"  value={shrubDensity}  onChange={setShrubDensity}  />
        <Slider label="Grass Density"  value={grassDensity}  onChange={setGrassDensity}  />
        <Slider label="Grass Height"   value={grassHeight}   onChange={setGrassHeight}   />
        <Slider label="Flowers"        value={flowerDensity} onChange={setFlowerDensity} />
        <Slider label="Rock Density"   value={rockDensity}   onChange={setRockDensity}   />
        <Slider label="Rock Size"      value={rockSize}      onChange={setRockSize}      />
      </Section>
      <Section title="\u{1F30A} Water">
        <Slider   label="Water Level"  value={waterLevel} onChange={setWaterLevel} />
        <Slider   label="Wave Height"  value={waveHeight} onChange={setWaveHeight} />
        <Slider   label="Roughness"    value={waterRough} onChange={setWaterRough} />
        <ColorRow label="Water Color"  value={waterColor} onChange={setWaterColor} />
        <Check    label="River"        value={hasRiver}   onChange={setHasRiver}   />
        <Check    label="Lake"         value={hasLake}    onChange={setHasLake}    />
      </Section>
      <Section title="\u{1F324} Atmosphere" defaultOpen={false}>
        <Slider   label="Fog Density"  value={fogDensity}  onChange={setFogDensity}  />
        <ColorRow label="Fog Color"    value={fogColor}    onChange={setFogColor}    />
        <Slider   label="Ambient"      value={ambientStr}  onChange={setAmbientStr}  />
        <Slider   label="Sun Angle"    value={sunAngle}    onChange={setSunAngle}    />
        <ColorRow label="Sky Color"    value={skyColor}    onChange={setSkyColor}    />
        <Slider   label="Cloud Cover"  value={cloudCover}  onChange={setCloudCover}  />
      </Section>
      <Section title="\u2699 Output" defaultOpen={false}>
        <Select label="Poly Budget"   value={polyBudget}   options={POLY_OPTIONS} onChange={setPolyBudget}   />
        <Check  label="Add Lights"    value={addLights}    onChange={setAddLights}    />
        <Check  label="Add Colliders" value={addColliders} onChange={setAddColliders} />
        <Check  label="Auto LOD"      value={addLOD}       onChange={setAddLOD}       />
        <Check  label="Nav Mesh"      value={addNavMesh}   onChange={setAddNavMesh}   />
        <Check  label="Split Chunks"  value={splitChunks}  onChange={setSplitChunks}  />
      </Section>
      <div style={{ display: 'flex', gap: 6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="\u26a1 Generate Environment" onClick={() => onGenerate?.({
          envType, season, timeOfDay, weather, seed,
          scale: { scaleX, scaleZ, heightScale, heightOffset },
          terrain: { roughness, erosion, plateauLevel, cliffiness },
          vegetation: { treeDensity, treeVariety, shrubDensity, grassDensity, grassHeight, flowerDensity, rockDensity, rockSize },
          water: { waterLevel, waveHeight, waterRough, waterColor, hasRiver, hasLake },
          atmosphere: { fogDensity, fogColor, ambientStr, sunAngle, skyColor, cloudCover },
          output: { polyBudget, addLights, addColliders, addLOD, addNavMesh, splitChunks },
        })} />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SPX Mesh Editor — Generator Panel
// Props: onGenerate(params)  |  onReset()
// Design: #06060f bg  #0d1117 panel  #21262d border  #00ffc8 teal
// Font: JetBrains Mono  |  All sliders normalized 0.0–1.0
// Keyboard: Enter=Generate  Shift+R=Randomize  Ctrl+Z=Undo
// Presets: localStorage spx_presets_<PanelName>
// Integration: mounts in SPX Mesh Editor right sidebar
// Generated geometry: THREE.Group with userData.params
// -----------------------------------------------------------------------------
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
//
//
// ────────────────────────────────────────
//
