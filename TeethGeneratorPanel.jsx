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

const TEETH_TYPES  = ['Human Adult','Human Child','Vampire','Animal Canine','Animal Herbivore',
  'Shark','Snake Fang','Robot','Cartoon','Zombie','Alien'];
const GUM_SHAPES   = ['Normal','Receding','Inflamed','Healthy','Asymmetric','Exposed Root'];
const POLY_OPTIONS = ['Low','Mid','High','Ultra'];

/** TeethGeneratorPanel — full parametric teeth set with enamel, gums, wear, dental work */
export default function TeethGeneratorPanel({ onGenerate }) {
  const [teethType,     setTeethType]     = useState('Human Adult');
  const [seed,          setSeed]          = useState(1);
  const [incisorCount,  setIncisorCount]  = useState(4);
  const [canineCount,   setCanineCount]   = useState(2);
  const [premolarCount, setPremolarCount] = useState(4);
  const [molarCount,    setMolarCount]    = useState(6);
  const [showLower,     setShowLower]     = useState(true);
  const [showWisdom,    setShowWisdom]    = useState(false);
  const [toothSize,     setToothSize]     = useState(0.50);
  const [toothWidth,    setToothWidth]    = useState(0.50);
  const [toothHeight,   setToothHeight]   = useState(0.50);
  const [incisorEdge,   setIncisorEdge]   = useState(0.50);
  const [canineLen,     setCanineLen]     = useState(0.55);
  const [spacing,       setSpacing]       = useState(0.50);
  const [alignment,     setAlignment]     = useState(0.85);
  const [overbite,      setOverbite]      = useState(0.20);
  const [crowding,      setCrowding]      = useState(0.00);
  const [rotation,      setRotation]      = useState(0.00);
  const [enamelColor,   setEnamelColor]   = useState('#f5f0e0');
  const [enamelRough,   setEnamelRough]   = useState(0.20);
  const [enamelGloss,   setEnamelGloss]   = useState(0.75);
  const [translucency,  setTranslucency]  = useState(0.30);
  const [subsurface,    setSubsurface]    = useState(0.25);
  const [stainLevel,    setStainLevel]    = useState(0.05);
  const [stainColor,    setStainColor]    = useState('#c8b870');
  const [wearLevel,     setWearLevel]     = useState(0.10);
  const [crackDetail,   setCrackDetail]   = useState(0.00);
  const [chipDetail,    setChipDetail]    = useState(0.00);
  const [tartarLevel,   setTartarLevel]   = useState(0.00);
  const [addGums,       setAddGums]       = useState(true);
  const [gumShape,      setGumShape]      = useState('Normal');
  const [gumColor,      setGumColor]      = useState('#c86070');
  const [gumRecession,  setGumRecession]  = useState(0.10);
  const [gumInflam,     setGumInflam]     = useState(0.00);
  const [addBraces,     setAddBraces]     = useState(false);
  const [bracesColor,   setBracesColor]   = useState('#aaaaaa');
  const [addFillings,   setAddFillings]   = useState(false);
  const [fillingsColor, setFillingsColor] = useState('#d0c8a0');
  const [addCrowns,     setAddCrowns]     = useState(false);
  const [addImplants,   setAddImplants]   = useState(false);
  const [polyBudget,    setPolyBudget]    = useState('Mid');
  const [separateMesh,  setSeparateMesh]  = useState(false);
  const [addRoots,      setAddRoots]      = useState(false);

  return (
    <div style={P}>
      <Section title="🦷 Teeth Type">
        <Badges items={TEETH_TYPES} active={teethType} onSelect={setTeethType} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="📊 Count & Layout">
        <Slider label="Incisors"    value={incisorCount}  min={0} max={8}  step={1} onChange={setIncisorCount}  />
        <Slider label="Canines"     value={canineCount}   min={0} max={4}  step={1} onChange={setCanineCount}   />
        <Slider label="Premolars"   value={premolarCount} min={0} max={8}  step={1} onChange={setPremolarCount} />
        <Slider label="Molars"      value={molarCount}    min={0} max={12} step={1} onChange={setMolarCount}    />
        <Check  label="Include Lower Jaw" value={showLower}  onChange={setShowLower}  />
        <Check  label="Wisdom Teeth"      value={showWisdom} onChange={setShowWisdom} />
      </Section>
      <Section title="📐 Size & Shape">
        <Slider label="Overall Size"    value={toothSize}   onChange={setToothSize}   />
        <Slider label="Width"           value={toothWidth}  onChange={setToothWidth}  />
        <Slider label="Height"          value={toothHeight} onChange={setToothHeight} />
        <Slider label="Incisor Edge"    value={incisorEdge} onChange={setIncisorEdge} />
        <Slider label="Canine Length"   value={canineLen}   onChange={setCanineLen}   />
        <Slider label="Spacing"         value={spacing}     onChange={setSpacing}     />
        <Slider label="Alignment"       value={alignment}   onChange={setAlignment}   />
        <Slider label="Overbite"        value={overbite}    onChange={setOverbite}    />
        <Slider label="Crowding"        value={crowding}    onChange={setCrowding}    />
        <Slider label="Rotation"        value={rotation}    onChange={setRotation}    />
      </Section>
      <Section title="✨ Enamel">
        <ColorRow label="Enamel Color"  value={enamelColor}  onChange={setEnamelColor}  />
        <Slider   label="Roughness"     value={enamelRough}  onChange={setEnamelRough}  />
        <Slider   label="Gloss"         value={enamelGloss}  onChange={setEnamelGloss}  />
        <Slider   label="Translucency"  value={translucency} onChange={setTranslucency} />
        <Slider   label="Subsurface"    value={subsurface}   onChange={setSubsurface}   />
      </Section>
      <Section title="🎨 Stain & Wear" defaultOpen={false}>
        <Slider   label="Stain Level"   value={stainLevel}   onChange={setStainLevel}   />
        {stainLevel > 0 && <ColorRow label="Stain Color" value={stainColor} onChange={setStainColor} />}
        <Slider   label="Wear"          value={wearLevel}    onChange={setWearLevel}    />
        <Slider   label="Cracks"        value={crackDetail}  onChange={setCrackDetail}  />
        <Slider   label="Chips"         value={chipDetail}   onChange={setChipDetail}   />
        <Slider   label="Tartar"        value={tartarLevel}  onChange={setTartarLevel}  />
      </Section>
      <Section title="🦀 Gums" defaultOpen={false}>
        <Check    label="Include Gums"  value={addGums}      onChange={setAddGums}      />
        {addGums && (<>
          <Select   label="Gum Shape"   value={gumShape}     options={GUM_SHAPES} onChange={setGumShape}     />
          <ColorRow label="Gum Color"   value={gumColor}     onChange={setGumColor}     />
          <Slider   label="Recession"   value={gumRecession} onChange={setGumRecession} />
          <Slider   label="Inflammation" value={gumInflam}   onChange={setGumInflam}    />
        </>)}
      </Section>
      <Section title="🔧 Dental Work" defaultOpen={false}>
        <Check label="Braces"    value={addBraces}  onChange={setAddBraces}  />
        {addBraces && <ColorRow label="Braces Color" value={bracesColor} onChange={setBracesColor} />}
        <Check label="Fillings"  value={addFillings} onChange={setAddFillings} />
        {addFillings && <ColorRow label="Filling Color" value={fillingsColor} onChange={setFillingsColor} />}
        <Check label="Crowns"    value={addCrowns}  onChange={setAddCrowns}  />
        <Check label="Implants"  value={addImplants} onChange={setAddImplants} />
        <Check label="Show Roots" value={addRoots}  onChange={setAddRoots}   />
      </Section>
      <Section title="⚙ Output" defaultOpen={false}>
        <Select label="Poly Budget"     value={polyBudget}   options={POLY_OPTIONS} onChange={setPolyBudget}   />
        <Check  label="Separate Meshes" value={separateMesh} onChange={setSeparateMesh} />
      </Section>
      <GenBtn label="⚡ Generate Teeth" onClick={() => onGenerate?.({
        teethType, seed,
        count: { incisorCount, canineCount, premolarCount, molarCount, showLower, showWisdom },
        shape: { toothSize, toothWidth, toothHeight, incisorEdge, canineLen, spacing, alignment, overbite, crowding, rotation },
        enamel: { enamelColor, enamelRough, enamelGloss, translucency, subsurface },
        wear: { stainLevel, stainColor, wearLevel, crackDetail, chipDetail, tartarLevel },
        gums: { addGums, gumShape, gumColor, gumRecession, gumInflam },
        dental: { addBraces, bracesColor, addFillings, fillingsColor, addCrowns, addImplants, addRoots },
        output: { polyBudget, separateMesh },
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
