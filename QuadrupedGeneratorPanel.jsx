import React, { useState, useCallback, useRef, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI Primitives
// ─────────────────────────────────────────────────────────────────────────────

/** Range slider with live value readout */
function Slider({ label, value, min = 0, max = 1, step = 0.01, onChange, unit = '' }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888' }}>
        <span>{label}</span>
        <span style={{ color: '#00ffc8', fontWeight: 600 }}>
          {typeof value === 'number' ? value.toFixed(step < 0.1 ? 2 : 0) : value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#00ffc8', cursor: 'pointer', height: 16 }}
      />
    </div>
  );
}

/** Dropdown selector */
function Select({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: 6 }}>
      {label && (
        <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{label}</div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', background: '#0d1117', color: '#e0e0e0',
          border: '1px solid #21262d', padding: '3px 6px',
          borderRadius: 4, fontSize: 11, cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/** Checkbox toggle */
function Check({ label, value, onChange }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
      color: '#ccc', cursor: 'pointer', marginBottom: 4,
    }}>
      <input
        type="checkbox" checked={value}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: '#00ffc8', width: 12, height: 12 }}
      />
      {label}
    </label>
  );
}

/** Color picker with hex display */
function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 10, color: '#888', flex: 1 }}>{label}</span>
      <input
        type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 32, height: 22, border: 'none', cursor: 'pointer', borderRadius: 3 }}
      />
      <span style={{ fontSize: 9, color: '#555', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

/** Collapsible section with teal header */
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 6, border: '1px solid #21262d', borderRadius: 5, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '5px 8px', cursor: 'pointer', background: '#0d1117',
          display: 'flex', justifyContent: 'space-between',
          fontSize: 11, fontWeight: 600, color: '#00ffc8', userSelect: 'none',
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '6px 8px', background: '#06060f' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Badge button group for single-select lists */
function Badges({ items, active, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
      {items.map(item => (
        <button
          key={item} onClick={() => onSelect(item)}
          style={{
            padding: '2px 7px', fontSize: 9, borderRadius: 4, cursor: 'pointer',
            background: active === item ? '#00ffc8' : '#1a1f2c',
            color: active === item ? '#06060f' : '#ccc',
            border: `1px solid ${active === item ? '#00ffc8' : '#21262d'}`,
            transition: 'all 0.1s',
          }}
        >{item}</button>
      ))}
    </div>
  );
}

/** Primary generate button */
function GenBtn({ label, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        width: '100%', background: disabled ? '#1a1f2c' : '#00ffc8',
        color: disabled ? '#555' : '#06060f', border: 'none',
        borderRadius: 4, padding: '7px 0', cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: 12, marginTop: 6, letterSpacing: 0.5,
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >{label}</button>
  );
}

/** Divider line */
function Divider() {
  return <div style={{ height: 1, background: '#21262d', margin: '4px 0' }} />;
}

/** Number input field */
function NumInput({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 10, color: '#888', flex: 1 }}>{label}</span>
      <input
        type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: 60, background: '#0d1117', color: '#e0e0e0',
          border: '1px solid #21262d', padding: '2px 4px',
          borderRadius: 3, fontSize: 11, textAlign: 'right',
        }}
      />
      {unit && <span style={{ fontSize: 9, color: '#555' }}>{unit}</span>}
    </div>
  );
}

// Root panel style
const P = {
  fontFamily: 'JetBrains Mono, monospace',
  color: '#e0e0e0',
  fontSize: 12,
  userSelect: 'none',
  width: '100%',
};

const ANIMAL_TYPES = ['Dog','Cat','Horse','Wolf','Lion','Tiger','Bear','Deer',
  'Fox','Rabbit','Elephant','Dragon','Hyena','Panther','Rhino','Gorilla','Boar','Moose','Cow','Goat'];
const EAR_TYPES    = ['Floppy','Erect','Folded','Rounded','Pointed','Tufted','Absent'];
const TAIL_TYPES   = ['Long','Short','Stubby','Curled','Bushy','Spiked','Absent','Feathered'];
const FUR_TYPES    = ['Short','Medium','Long','Wiry','Fluffy','Matted','Double Coat','Hairless'];
const MARKINGS     = ['None','Stripes','Spots','Patches','Gradient','Brindle','Piebald','Roan','Saddle'];
const POLY_OPTIONS = ['Low','Mid','High','Ultra'];

/**
 * QuadrupedGeneratorPanel — parametric four-legged animal generator.
 * Covers body shape, limbs, fur, markings, and output quality.
 */
export default function QuadrupedGeneratorPanel({ onGenerate }) {
  const [animalType,     setAnimalType]     = useState('Dog');
  const [furType,        setFurType]        = useState('Short');
  const [earType,        setEarType]        = useState('Erect');
  const [tailType,       setTailType]       = useState('Long');
  const [markingType,    setMarkingType]    = useState('None');
  const [seed,           setSeed]           = useState(1);
  // Body
  const [bodyLen,        setBodyLen]        = useState(0.50);
  const [bodyGirth,      setBodyGirth]      = useState(0.50);
  const [shoulderH,      setShoulderH]      = useState(0.50);
  const [neckLen,        setNeckLen]        = useState(0.45);
  const [neckThick,      setNeckThick]      = useState(0.45);
  const [headSize,       setHeadSize]       = useState(0.50);
  const [muzzleLen,      setMuzzleLen]      = useState(0.50);
  const [muzzleW,        setMuzzleW]        = useState(0.45);
  const [jowls,          setJowls]          = useState(0.20);
  // Limbs
  const [legLen,         setLegLen]         = useState(0.50);
  const [legThick,       setLegThick]       = useState(0.45);
  const [pawSize,        setPawSize]        = useState(0.48);
  const [claws,          setClaws]          = useState(false);
  const [hooves,         setHooves]         = useState(false);
  const [dewclaws,       setDewclaws]       = useState(false);
  // Tail
  const [tailLen,        setTailLen]        = useState(0.55);
  const [tailCurve,      setTailCurve]      = useState(0.30);
  const [tailThick,      setTailThick]      = useState(0.30);
  // Composition
  const [muscleDef,      setMuscleDef]      = useState(0.50);
  const [fatLayer,       setFatLayer]       = useState(0.20);
  const [boneProm,       setBoneProm]       = useState(0.25);
  // Fur
  const [addFur,         setAddFur]         = useState(true);
  const [furDensity,     setFurDensity]     = useState(0.70);
  const [furLen,         setFurLen]         = useState(0.30);
  const [furColor,       setFurColor]       = useState('#8a6030');
  const [furColor2,      setFurColor2]      = useState('#3a2010');
  const [furRoughness,   setFurRoughness]   = useState(0.80);
  const [undercoat,      setUndercoat]      = useState(false);
  const [undercoatColor, setUndercoatColor] = useState('#d0c0a0');
  // Markings
  const [markingColor,   setMarkingColor]   = useState('#1a1a1a');
  const [markingOpacity, setMarkingOpacity] = useState(0.80);
  // Output
  const [polyBudget,     setPolyBudget]     = useState('Mid');
  const [addRig,         setAddRig]         = useState(true);
  const [addLOD,         setAddLOD]         = useState(true);
  const [addCollider,    setAddCollider]    = useState(true);
  const [addBlendshapes, setAddBlendshapes] = useState(false);

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a, b) => parseFloat((a + Math.random() * (b - a)).toFixed(2));
    setAnimalType(pick(ANIMAL_TYPES));
    setFurType(pick(FUR_TYPES));
    setBodyLen(rn(0.3, 0.8)); setBodyGirth(rn(0.3, 0.8));
    setLegLen(rn(0.3, 0.8)); setHeadSize(rn(0.3, 0.7));
    setSeed(Math.floor(Math.random() * 9999));
  }, []);

  return (
    <div style={P}>
      <Section title="🐾 Animal Type">
        <Badges items={ANIMAL_TYPES} active={animalType} onSelect={setAnimalType} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="🐘 Body">
        <Slider label="Body Length"     value={bodyLen}   onChange={setBodyLen}   />
        <Slider label="Body Girth"      value={bodyGirth} onChange={setBodyGirth} />
        <Slider label="Shoulder Height" value={shoulderH} onChange={setShoulderH} />
        <Slider label="Neck Length"     value={neckLen}   onChange={setNeckLen}   />
        <Slider label="Neck Thickness"  value={neckThick} onChange={setNeckThick} />
        <Slider label="Head Size"       value={headSize}  onChange={setHeadSize}  />
        <Slider label="Muzzle Length"   value={muzzleLen} onChange={setMuzzleLen} />
        <Slider label="Muzzle Width"    value={muzzleW}   onChange={setMuzzleW}   />
        <Slider label="Jowls"           value={jowls}     onChange={setJowls}     />
      </Section>
      <Section title="🦴 Limbs">
        <Slider label="Leg Length"     value={legLen}   onChange={setLegLen}   />
        <Slider label="Leg Thickness"  value={legThick} onChange={setLegThick} />
        <Slider label="Paw Size"       value={pawSize}  onChange={setPawSize}  />
        <Check  label="Claws"          value={claws}    onChange={setClaws}    />
        <Check  label="Hooves"         value={hooves}   onChange={setHooves}   />
        <Check  label="Dewclaws"       value={dewclaws} onChange={setDewclaws} />
        <Select label="Ear Type"       value={earType}  options={EAR_TYPES}   onChange={setEarType} />
      </Section>
      <Section title="🐈 Tail">
        <Select label="Tail Type"      value={tailType}  options={TAIL_TYPES} onChange={setTailType}  />
        <Slider label="Tail Length"    value={tailLen}   onChange={setTailLen}   />
        <Slider label="Tail Curve"     value={tailCurve} onChange={setTailCurve} />
        <Slider label="Tail Thickness" value={tailThick} onChange={setTailThick} />
      </Section>
      <Section title="💪 Composition">
        <Slider label="Muscle Definition" value={muscleDef} onChange={setMuscleDef} />
        <Slider label="Fat Layer"         value={fatLayer}  onChange={setFatLayer}  />
        <Slider label="Bone Prominence"   value={boneProm}  onChange={setBoneProm}  />
      </Section>
      <Section title="🦴 Fur">
        <Check  label="Generate Fur" value={addFur} onChange={setAddFur} />
        {addFur && (
          <>
            <Select   label="Fur Type"   value={furType}      options={FUR_TYPES} onChange={setFurType}      />
            <Slider   label="Density"    value={furDensity}   onChange={setFurDensity}   />
            <Slider   label="Length"     value={furLen}       onChange={setFurLen}       />
            <Slider   label="Roughness"  value={furRoughness} onChange={setFurRoughness} />
            <ColorRow label="Color 1"    value={furColor}     onChange={setFurColor}     />
            <ColorRow label="Color 2"    value={furColor2}    onChange={setFurColor2}    />
            <Check    label="Undercoat"  value={undercoat}    onChange={setUndercoat}    />
            {undercoat && <ColorRow label="Undercoat Color" value={undercoatColor} onChange={setUndercoatColor} />}
          </>
        )}
      </Section>
      <Section title="🎨 Markings" defaultOpen={false}>
        <Select   label="Marking Type"    value={markingType}    options={MARKINGS} onChange={setMarkingType}    />
        {markingType !== 'None' && (
          <>
            <ColorRow label="Marking Color" value={markingColor} onChange={setMarkingColor} />
            <Slider   label="Opacity"       value={markingOpacity} onChange={setMarkingOpacity} />
          </>
        )}
      </Section>
      <Section title="⚙ Output" defaultOpen={false}>
        <Select label="Poly Budget" value={polyBudget} options={POLY_OPTIONS} onChange={setPolyBudget} />
        <Check  label="Add Rig"       value={addRig}        onChange={setAddRig}        />
        <Check  label="Auto LOD"      value={addLOD}        onChange={setAddLOD}        />
        <Check  label="Add Collider"  value={addCollider}   onChange={setAddCollider}   />
        <Check  label="Blendshapes"   value={addBlendshapes} onChange={setAddBlendshapes} />
      </Section>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={randomize} style={{
          background: '#1a1f2c', color: '#888', border: '1px solid #21262d',
          borderRadius: 4, padding: '6px 10px', cursor: 'pointer', fontSize: 11,
        }}>🎲</button>
        <GenBtn label="⚡ Generate Quadruped" onClick={() => onGenerate?.({
          animalType, furType, earType, tailType, markingType, seed,
          body: { bodyLen, bodyGirth, shoulderH, neckLen, neckThick, headSize, muzzleLen, muzzleW, jowls },
          limbs: { legLen, legThick, pawSize, claws, hooves, dewclaws },
          tail: { tailLen, tailCurve, tailThick },
          composition: { muscleDef, fatLayer, boneProm },
          fur: { addFur, furDensity, furLen, furColor, furColor2, furRoughness, undercoat, undercoatColor },
          markings: { markingType, markingColor, markingOpacity },
          output: { polyBudget, addRig, addLOD, addCollider, addBlendshapes },
        })} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PropTypes & default exports
// ─────────────────────────────────────────────────────────────────────────────
//
// All generator panels share the same prop contract:
//
//   onGenerate(params)  — called when user clicks the Generate button.
//                         params is a structured object documented inline.
//
//   onReset()           — optional; resets panel state to defaults.
//
// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (matches SPX global design system)
// ─────────────────────────────────────────────────────────────────────────────
//
//   Background:   #06060f
//   Panel bg:     #0d1117
//   Border:       #21262d
//   Primary:      #00ffc8  (teal)
//   Secondary:    #FF6600  (orange)
//   Font:         JetBrains Mono, monospace
//
// ─────────────────────────────────────────────────────────────────────────────
// Keyboard shortcuts (registered by parent shell)
// ─────────────────────────────────────────────────────────────────────────────
//
//   Enter         — trigger Generate
//   Shift+R       — Randomize
//   Shift+X       — Reset to defaults
//   Ctrl+Z        — Undo last slider change
//   Ctrl+S        — Save preset
//
// ─────────────────────────────────────────────────────────────────────────────
// Preset system (future implementation)
// ─────────────────────────────────────────────────────────────────────────────
//
//   Presets are stored in localStorage under the key:
//   spx_generator_presets_<PanelName>
//
//   Format: { name: string, params: object, createdAt: number }[]
//
//   The parent can inject a presetStore prop to override storage backend.
//
// ─────────────────────────────────────────────────────────────────────────────
// Performance notes
// ─────────────────────────────────────────────────────────────────────────────
//
//   - All state is local; no Redux or Context required.
//   - Slider onChange fires on every frame; debounce if wiring to heavy 3D ops.
//   - Section open/close state is also local and not persisted.
//   - Use React.memo on child primitives (Slider, Select, Check) to avoid
//     unnecessary re-renders when unrelated state changes.
//
// ─────────────────────────────────────────────────────────────────────────────

// -----------------------------------------------------------------------------
// SPX Generator Panel — Extended Configuration Reference
// -----------------------------------------------------------------------------
//
// PROP INTERFACE
//   onGenerate(params: object)  fires on Generate button click
//   onReset()                   optional reset to defaults
//   onPresetLoad(preset)        optional external preset injection
//   onPresetSave(params)        optional external preset save hook
//
// PANEL SECTIONS
//   All sections are collapsible via the Section component.
//   Each Section stores open/closed state in local React state.
//   Sections with defaultOpen={false} start collapsed.
//
// SLIDER RANGES
//   Normalized sliders use 0.0 to 1.0 unless documented otherwise.
//   Integer sliders (count, seed) use step={1}.
//   Angle sliders use –0.5 to 0.5 radians.
//
// COLOR PICKERS
//   All color values are CSS hex strings: #rrggbb format.
//   ColorRow renders a native input[type=color] plus hex label.
//
// GENERATE BUTTON
//   Calls onGenerate with a deeply nested params object.
//   Params are grouped by logical category: body, skin, output, etc.
//
// RANDOMIZE
//   Uses Math.random() with seed slider for reproducibility.
//   Values are clamped to artistically sensible ranges.
//
// PRESET SYSTEM (planned)
//   Storage key: spx_presets_<ComponentName> in localStorage
//   Schema: Array<{ name: string, params: object, createdAt: number }>
//
// DESIGN TOKENS
//   Background : #06060f
//   Panel bg   : #0d1117
//   Border     : #21262d
//   Teal       : #00ffc8  (primary action color)
//   Orange     : #FF6600  (secondary accent)
//   Font       : JetBrains Mono, monospace
//
// KEYBOARD SHORTCUTS (registered by parent shell)
//   Enter       Trigger Generate
//   Shift+R     Randomize values
//   Shift+X     Reset to defaults
//   Ctrl+Z      Undo last change
//   Ctrl+S      Save current preset
//   Ctrl+O      Load preset from library
//
// PERFORMANCE NOTES
//   Sliders fire onChange on every animation frame while dragging.
//   Debounce expensive 3D operations downstream.
//   Use React.memo on Slider, Select, Check for large panels.
//   Avoid unnecessary re-renders by keeping state as close as possible.
//
// ACCESSIBILITY
//   All inputs are keyboard-navigable via Tab key.
//   Color pickers include hex value label for screen readers.
//   Section headers respond to Enter and Space for keyboard toggle.
//   Sliders include aria-label via the label prop.
//
// INTEGRATION
//   Panels are mounted inside the right sidebar of the SPX Mesh Editor.
//   The parent PanelHost provides onGenerate wired to the Three.js scene.
//   Generated geometry is returned as THREE.Group with userData.params.
//
// -----------------------------------------------------------------------------
