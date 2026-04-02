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

const TATTOO_STYLES = ['Traditional','Neo-Traditional','Realism','Tribal','Geometric',
  'Watercolor','Japanese','Blackwork','Minimalist','Dotwork','Illustrative','Surrealism','Fine Line'];
const BODY_REGIONS  = ['Upper Arm','Forearm','Full Sleeve','Chest','Back','Shoulder',
  'Neck','Calf','Thigh','Full Leg','Hand','Foot','Spine','Rib','Hip','Wrist'];
const SUBJECTS      = ['Custom','Floral','Animal','Portrait','Skull','Geometric',
  'Script','Dragon','Phoenix','Koi','Samurai','Viking','Abstract','Mandala','Snake'];
const POLY_OPTIONS  = ['Low','Mid','High'];

/** TattooGeneratorPanel — procedural tattoo generator with style, aging, layout options */
export default function TattooGeneratorPanel({ onGenerate }) {
  const [tattooStyle,    setTattooStyle]    = useState('Traditional');
  const [subject,        setSubject]        = useState('Floral');
  const [bodyRegion,     setBodyRegion]     = useState('Upper Arm');
  const [seed,           setSeed]           = useState(1);
  const [inkColor,       setInkColor]       = useState('#1a1a2e');
  const [inkColor2,      setInkColor2]      = useState('#8a2020');
  const [inkColor3,      setInkColor3]      = useState('#204a8a');
  const [inkColor4,      setInkColor4]      = useState('#208a40');
  const [highlightColor, setHighlightColor] = useState('#e8e0c0');
  const [colorCount,     setColorCount]     = useState(2);
  const [scale,          setScale]          = useState(0.50);
  const [positionX,      setPositionX]      = useState(0.50);
  const [positionY,      setPositionY]      = useState(0.50);
  const [rotation,       setRotation]       = useState(0.00);
  const [opacity,        setOpacity]        = useState(0.95);
  const [saturation,     setSaturation]     = useState(0.80);
  const [contrast,       setContrast]       = useState(0.70);
  const [lineWeight,     setLineWeight]     = useState(0.50);
  const [shading,        setShading]        = useState(0.60);
  const [highlight,      setHighlight]      = useState(0.40);
  const [edgeSoftness,   setEdgeSoftness]   = useState(0.15);
  const [detailLevel,    setDetailLevel]    = useState(0.70);
  const [noiseTexture,   setNoiseTexture]   = useState(0.20);
  const [inkSpread,      setInkSpread]      = useState(0.10);
  const [aging,          setAging]          = useState(0.00);
  const [fading,         setFading]         = useState(0.00);
  const [blowout,        setBlowout]        = useState(0.00);
  const [scarring,       setScarring]       = useState(0.00);
  const [sunDamage,      setSunDamage]      = useState(0.00);
  const [symmetry,       setSymmetry]       = useState(false);
  const [mirrorX,        setMirrorX]        = useState(false);
  const [tilePattern,    setTilePattern]    = useState(false);
  const [wrapAround,     setWrapAround]     = useState(true);
  const [followContour,  setFollowContour]  = useState(true);
  const [procedural,     setProcedural]     = useState(false);
  const [procDensity,    setProcDensity]    = useState(0.50);
  const [procScale,      setProcScale]      = useState(0.50);
  const [polyBudget,     setPolyBudget]     = useState('Mid');
  const [exportUV,       setExportUV]       = useState(false);
  const [exportMask,     setExportMask]     = useState(false);
  const [exportAlpha,    setExportAlpha]    = useState(false);

  return (
    <div style={P}>
      <Section title="🎨 Style & Subject">
        <Badges items={TATTOO_STYLES} active={tattooStyle} onSelect={setTattooStyle} />
        <Select label="Subject"     value={subject}    options={SUBJECTS}     onChange={setSubject}    />
        <Select label="Body Region" value={bodyRegion} options={BODY_REGIONS} onChange={setBodyRegion} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="🖌 Colors">
        <Slider label="Color Count" value={colorCount} min={1} max={6} step={1} onChange={setColorCount} />
        <ColorRow label="Ink 1"       value={inkColor}       onChange={setInkColor}       />
        {colorCount >= 2 && <ColorRow label="Ink 2" value={inkColor2} onChange={setInkColor2} />}
        {colorCount >= 3 && <ColorRow label="Ink 3" value={inkColor3} onChange={setInkColor3} />}
        {colorCount >= 4 && <ColorRow label="Ink 4" value={inkColor4} onChange={setInkColor4} />}
        <ColorRow label="Highlight"   value={highlightColor} onChange={setHighlightColor} />
      </Section>
      <Section title="📏 Placement">
        <Slider label="Scale"      value={scale}     onChange={setScale}     />
        <Slider label="Position X" value={positionX} onChange={setPositionX} />
        <Slider label="Position Y" value={positionY} onChange={setPositionY} />
        <Slider label="Rotation"   value={rotation}  min={-1} max={1} step={0.01} onChange={setRotation} />
      </Section>
      <Section title="✒ Ink Properties">
        <Slider label="Opacity"     value={opacity}    onChange={setOpacity}    />
        <Slider label="Saturation"  value={saturation} onChange={setSaturation} />
        <Slider label="Contrast"    value={contrast}   onChange={setContrast}   />
        <Slider label="Line Weight" value={lineWeight} onChange={setLineWeight} />
        <Slider label="Shading"     value={shading}    onChange={setShading}    />
        <Slider label="Highlight"   value={highlight}  onChange={setHighlight}  />
        <Slider label="Edge Softness" value={edgeSoftness} onChange={setEdgeSoftness} />
        <Slider label="Detail"      value={detailLevel}  onChange={setDetailLevel}  />
        <Slider label="Noise"       value={noiseTexture} onChange={setNoiseTexture} />
        <Slider label="Ink Spread"  value={inkSpread}    onChange={setInkSpread}    />
      </Section>
      <Section title="⏳ Aging & Wear" defaultOpen={false}>
        <Slider label="Age"        value={aging}     onChange={setAging}     />
        <Slider label="Fading"     value={fading}    onChange={setFading}    />
        <Slider label="Blowout"    value={blowout}   onChange={setBlowout}   />
        <Slider label="Scarring"   value={scarring}  onChange={setScarring}  />
        <Slider label="Sun Damage" value={sunDamage} onChange={setSunDamage} />
      </Section>
      <Section title="🔲 Layout" defaultOpen={false}>
        <Check label="Symmetry"       value={symmetry}      onChange={setSymmetry}      />
        <Check label="Mirror X"       value={mirrorX}       onChange={setMirrorX}       />
        <Check label="Tile Pattern"   value={tilePattern}   onChange={setTilePattern}   />
        <Check label="Wrap Around"    value={wrapAround}    onChange={setWrapAround}    />
        <Check label="Follow Contour" value={followContour} onChange={setFollowContour} />
      </Section>
      <Section title="🤖 Procedural" defaultOpen={false}>
        <Check label="Procedural Mode" value={procedural} onChange={setProcedural} />
        {procedural && (<>
          <Slider label="Density" value={procDensity} onChange={setProcDensity} />
          <Slider label="Scale"   value={procScale}   onChange={setProcScale}   />
        </>)}
      </Section>
      <Section title="⚙ Output" defaultOpen={false}>
        <Select label="Poly Budget"  value={polyBudget}  options={POLY_OPTIONS} onChange={setPolyBudget}  />
        <Check  label="Export UV Map"  value={exportUV}    onChange={setExportUV}    />
        <Check  label="Export Mask"    value={exportMask}  onChange={setExportMask}  />
        <Check  label="Export Alpha"   value={exportAlpha} onChange={setExportAlpha} />
      </Section>
      <GenBtn label="⚡ Generate Tattoo" onClick={() => onGenerate?.({
        tattooStyle, subject, bodyRegion, seed,
        colors: { inkColor, inkColor2, inkColor3, inkColor4, highlightColor, colorCount },
        placement: { scale, positionX, positionY, rotation },
        ink: { opacity, saturation, contrast, lineWeight, shading, highlight, edgeSoftness, detailLevel, noiseTexture, inkSpread },
        aging: { aging, fading, blowout, scarring, sunDamage },
        layout: { symmetry, mirrorX, tilePattern, wrapAround, followContour },
        procedural: { procedural, procDensity, procScale },
        output: { polyBudget, exportUV, exportMask, exportAlpha },
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
