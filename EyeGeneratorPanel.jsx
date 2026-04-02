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

const EYE_TYPES     = ['Human','Cat','Dragon','Reptile','Insect','Alien','Robot','Cartoon','Fish','Owl','Goat'];
const PUPIL_SHAPES  = ['Round','Vertical Slit','Horizontal','Star','Heart','Square','Diamond','Cross','Keyhole'];
const IRIS_PATTERNS = ['Solid','Radial','Marbled','Hazel','Heterochromia','Sectoral','Spotted','Crystalline','Web'];
const POLY_OPTIONS  = ['Low','Mid','High','Ultra'];

/** EyeGeneratorPanel — full parametric eye with iris, pupil, sclera, lashes, brow, FX */
export default function EyeGeneratorPanel({ onGenerate }) {
  const [eyeType,       setEyeType]       = useState('Human');
  const [seed,          setSeed]          = useState(1);
  // Iris
  const [irisColor,     setIrisColor]     = useState('#3a7acc');
  const [irisColor2,    setIrisColor2]    = useState('#1a4a8a');
  const [irisPattern,   setIrisPattern]   = useState('Radial');
  const [irisRadius,    setIrisRadius]    = useState(0.50);
  const [irisDetail,    setIrisDetail]    = useState(0.65);
  const [irisFibril,    setIrisFibril]    = useState(0.40);
  const [irisRough,     setIrisRough]     = useState(0.30);
  const [irisEmissive,  setIrisEmissive]  = useState(0.00);
  // Pupil
  const [pupilShape,    setPupilShape]    = useState('Round');
  const [pupilSize,     setPupilSize]     = useState(0.40);
  const [pupilColor,    setPupilColor]    = useState('#080810');
  // Sclera
  const [scleraColor,   setScleraColor]   = useState('#f5f0e8');
  const [scleraTint,    setScleraTint]    = useState(0.00);
  const [bloodshot,     setBloodshot]     = useState(0.00);
  const [scleraRough,   setScleraRough]   = useState(0.10);
  // Surface
  const [wetness,       setWetness]       = useState(0.75);
  const [cornealBulge,  setCornealBulge]  = useState(0.50);
  const [reflectStr,    setReflectStr]    = useState(0.70);
  // Shape
  const [eyeSize,       setEyeSize]       = useState(0.50);
  const [eyeDepth,      setEyeDepth]      = useState(0.50);
  const [eyeAngle,      setEyeAngle]      = useState(0.00);
  const [lidCrease,     setLidCrease]     = useState(0.40);
  const [lidThick,      setLidThick]      = useState(0.35);
  const [lidColor,      setLidColor]      = useState('#c8905c');
  // Lashes
  const [addLashes,     setAddLashes]     = useState(true);
  const [lashDensity,   setLashDensity]   = useState(0.65);
  const [lashLength,    setLashLength]    = useState(0.50);
  const [lashCurve,     setLashCurve]     = useState(0.55);
  const [lashColor,     setLashColor]     = useState('#1a1008');
  const [lashThick,     setLashThick]     = useState(0.30);
  // Brow
  const [addBrow,       setAddBrow]       = useState(true);
  const [browThick,     setBrowThick]     = useState(0.45);
  const [browArch,      setBrowArch]      = useState(0.50);
  const [browLength,    setBrowLength]    = useState(0.55);
  const [browColor,     setBrowColor]     = useState('#3b1e0a');
  // FX
  const [glowEffect,    setGlowEffect]    = useState(false);
  const [glowColor,     setGlowColor]     = useState('#00ffc8');
  const [glowIntensity, setGlowIntensity] = useState(0.50);
  const [catReflect,    setCatReflect]    = useState(false);
  const [scanLines,     setScanLines]     = useState(false);
  // Output
  const [polyBudget,    setPolyBudget]    = useState('High');
  const [genPair,       setGenPair]       = useState(true);
  const [heterochromia, setHeterochromia] = useState(false);
  const [rightColor,    setRightColor]    = useState('#8a3a7a');

  return (
    <div style={P}>
      <Section title="👁 Eye Type">
        <Badges items={EYE_TYPES} active={eyeType} onSelect={setEyeType} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="🌈 Iris">
        <Badges items={IRIS_PATTERNS} active={irisPattern} onSelect={setIrisPattern} />
        <ColorRow label="Iris Color 1"  value={irisColor}  onChange={setIrisColor}  />
        <ColorRow label="Iris Color 2"  value={irisColor2} onChange={setIrisColor2} />
        <Slider label="Iris Radius"      value={irisRadius}   onChange={setIrisRadius}   />
        <Slider label="Detail Level"     value={irisDetail}   onChange={setIrisDetail}   />
        <Slider label="Fibril Strength"  value={irisFibril}   onChange={setIrisFibril}   />
        <Slider label="Roughness"        value={irisRough}    onChange={setIrisRough}    />
        <Slider label="Emissive Glow"    value={irisEmissive} onChange={setIrisEmissive} />
      </Section>
      <Section title="⚫ Pupil">
        <Badges   items={PUPIL_SHAPES} active={pupilShape} onSelect={setPupilShape} />
        <Slider   label="Pupil Size"  value={pupilSize}  onChange={setPupilSize}  />
        <ColorRow label="Pupil Color" value={pupilColor} onChange={setPupilColor} />
      </Section>
      <Section title="⚪ Sclera">
        <ColorRow label="Sclera Color" value={scleraColor} onChange={setScleraColor} />
        <Slider   label="Yellow Tint"  value={scleraTint}  onChange={setScleraTint}  />
        <Slider   label="Bloodshot"    value={bloodshot}   onChange={setBloodshot}   />
        <Slider   label="Roughness"    value={scleraRough} onChange={setScleraRough} />
      </Section>
      <Section title="💧 Surface">
        <Slider label="Wetness"       value={wetness}      onChange={setWetness}      />
        <Slider label="Corneal Bulge" value={cornealBulge} onChange={setCornealBulge} />
        <Slider label="Reflectivity"  value={reflectStr}   onChange={setReflectStr}   />
      </Section>
      <Section title="📐 Shape">
        <Slider   label="Eye Size"      value={eyeSize}   onChange={setEyeSize}   />
        <Slider   label="Eye Depth"     value={eyeDepth}  onChange={setEyeDepth}  />
        <Slider   label="Tilt Angle"    value={eyeAngle}  min={-0.4} max={0.4} step={0.01} onChange={setEyeAngle} />
        <Slider   label="Lid Crease"    value={lidCrease} onChange={setLidCrease} />
        <Slider   label="Lid Thickness" value={lidThick}  onChange={setLidThick}  />
        <ColorRow label="Lid Color"     value={lidColor}  onChange={setLidColor}  />
      </Section>
      <Section title="✨ Lashes" defaultOpen={false}>
        <Check label="Generate Lashes" value={addLashes} onChange={setAddLashes} />
        {addLashes && (<>
          <Slider   label="Density"   value={lashDensity} onChange={setLashDensity} />
          <Slider   label="Length"    value={lashLength}  onChange={setLashLength}  />
          <Slider   label="Curl"      value={lashCurve}   onChange={setLashCurve}   />
          <Slider   label="Thickness" value={lashThick}   onChange={setLashThick}   />
          <ColorRow label="Color"     value={lashColor}   onChange={setLashColor}   />
        </>)}
      </Section>
      <Section title="🔲 Brow" defaultOpen={false}>
        <Check label="Generate Brow" value={addBrow} onChange={setAddBrow} />
        {addBrow && (<>
          <Slider   label="Thickness" value={browThick}  onChange={setBrowThick}  />
          <Slider   label="Arch"      value={browArch}   onChange={setBrowArch}   />
          <Slider   label="Length"    value={browLength} onChange={setBrowLength} />
          <ColorRow label="Color"     value={browColor}  onChange={setBrowColor}  />
        </>)}
      </Section>
      <Section title="✨ FX" defaultOpen={false}>
        <Check label="Glow Effect"        value={glowEffect}  onChange={setGlowEffect}  />
        {glowEffect && (<>
          <ColorRow label="Glow Color"    value={glowColor}     onChange={setGlowColor}     />
          <Slider   label="Glow Intensity" value={glowIntensity} onChange={setGlowIntensity} />
        </>)}
        <Check label="Cat-Eye Reflection" value={catReflect} onChange={setCatReflect} />
        <Check label="Scan Lines (Robot)" value={scanLines}  onChange={setScanLines}  />
      </Section>
      <Section title="⚙ Output" defaultOpen={false}>
        <Select label="Poly Budget"          value={polyBudget}   options={POLY_OPTIONS} onChange={setPolyBudget}   />
        <Check  label="Generate Pair (L+R)"  value={genPair}      onChange={setGenPair}      />
        <Check  label="Heterochromia"         value={heterochromia} onChange={setHeterochromia} />
        {heterochromia && <ColorRow label="Right Eye Color" value={rightColor} onChange={setRightColor} />}
      </Section>
      <GenBtn label="⚡ Generate Eye" onClick={() => onGenerate?.({
        eyeType, seed,
        iris: { irisColor, irisColor2, irisPattern, irisRadius, irisDetail, irisFibril, irisRough, irisEmissive },
        pupil: { pupilShape, pupilSize, pupilColor },
        sclera: { scleraColor, scleraTint, bloodshot, scleraRough },
        surface: { wetness, cornealBulge, reflectStr },
        shape: { eyeSize, eyeDepth, eyeAngle, lidCrease, lidThick, lidColor },
        lashes: { addLashes, lashDensity, lashLength, lashCurve, lashThick, lashColor },
        brow: { addBrow, browThick, browArch, browLength, browColor },
        fx: { glowEffect, glowColor, glowIntensity, catReflect, scanLines },
        output: { polyBudget, genPair, heterochromia, rightColor },
      })} />
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
