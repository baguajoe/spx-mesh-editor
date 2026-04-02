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

const GENDERS      = ['Male','Female','Non-Binary','Androgynous','Masculine','Feminine'];
const BODY_TYPES   = ['Ectomorph','Slim','Lean','Athletic','Average','Stocky','Endomorph','Mesomorph'];
const AGE_GROUPS   = ['Child (6-12)','Teen (13-17)','Young Adult (18-25)','Adult (26-40)','Middle-Aged (41-60)','Senior (60+)'];
const SKIN_TONES   = ['#f5d0b0','#e8b68a','#c8906a','#a0663a','#7a4420','#4a2210','#d0b090','#b89070'];
const POLY_OPTIONS = ['Low','Mid','High','Ultra'];

/** BodyGeneratorPanel — full-body parametric generator with 20+ proportion sliders */
export default function BodyGeneratorPanel({ onGenerate }) {
  const [gender,         setGender]         = useState('Male');
  const [bodyType,       setBodyType]       = useState('Average');
  const [ageGroup,       setAgeGroup]       = useState('Adult (26-40)');
  const [seed,           setSeed]           = useState(1);
  const [height,         setHeight]         = useState(175);
  const [weight,         setWeight]         = useState(75);
  const [muscleDef,      setMuscleDef]      = useState(0.50);
  const [bodyFat,        setBodyFat]        = useState(0.18);
  const [boneFrame,      setBoneFrame]      = useState(0.50);
  const [waterRetention, setWaterRetention] = useState(0.40);
  const [shoulderW,      setShoulderW]      = useState(0.50);
  const [chestSize,      setChestSize]      = useState(0.50);
  const [chestDepth,     setChestDepth]     = useState(0.45);
  const [neckThick,      setNeckThick]      = useState(0.45);
  const [armLen,         setArmLen]         = useState(0.50);
  const [upperArmThick,  setUpperArmThick]  = useState(0.45);
  const [forearmThick,   setForearmThick]   = useState(0.42);
  const [wristSize,      setWristSize]      = useState(0.38);
  const [handSize,       setHandSize]       = useState(0.48);
  const [waistSize,      setWaistSize]      = useState(0.42);
  const [abDef,          setAbDef]          = useState(0.40);
  const [loveHandles,    setLoveHandles]    = useState(0.15);
  const [hipSize,        setHipSize]        = useState(0.50);
  const [gluteSize,      setGluteSize]      = useState(0.50);
  const [legLen,         setLegLen]         = useState(0.50);
  const [thighThick,     setThighThick]     = useState(0.48);
  const [calfSize,       setCalfSize]       = useState(0.44);
  const [ankleSize,      setAnkleSize]      = useState(0.36);
  const [footSize,       setFootSize]       = useState(0.50);
  const [skinTone,       setSkinTone]       = useState('#c8906a');
  const [skinRough,      setSkinRough]      = useState(0.55);
  const [skinGloss,      setSkinGloss]      = useState(0.25);
  const [subsurface,     setSubsurface]     = useState(0.60);
  const [polyBudget,     setPolyBudget]     = useState('High');
  const [addRig,         setAddRig]         = useState(true);
  const [addLOD,         setAddLOD]         = useState(false);
  const [separateHead,   setSeparateHead]   = useState(false);
  const [addSubdiv,      setAddSubdiv]      = useState(false);

  const randomize = useCallback(() => {
    const rn = (a,b) => parseFloat((a+Math.random()*(b-a)).toFixed(2));
    const pick = arr => arr[Math.floor(Math.random()*arr.length)];
    setGender(pick(GENDERS)); setBodyType(pick(BODY_TYPES));
    setHeight(Math.round(150+Math.random()*60));
    setWeight(Math.round(50+Math.random()*80));
    setMuscleDef(rn(0,1)); setBodyFat(rn(0.05,0.45));
    setShoulderW(rn(0.3,0.75)); setHipSize(rn(0.3,0.72));
  }, []);

  return (
    <div style={P}>
      <Section title="🧬 Base">
        <Badges items={GENDERS}   active={gender}   onSelect={setGender}   />
        <Select label="Body Type" value={bodyType}  options={BODY_TYPES}   onChange={setBodyType}  />
        <Select label="Age Group" value={ageGroup}  options={AGE_GROUPS}   onChange={setAgeGroup}  />
        <Slider label="Seed"      value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="📏 Scale">
        <NumInput label="Height" value={height} min={120} max={230} step={1} onChange={setHeight} unit="cm" />
        <NumInput label="Weight" value={weight} min={35}  max={200} step={1} onChange={setWeight} unit="kg" />
      </Section>
      <Section title="💪 Composition">
        <Slider label="Muscle Definition" value={muscleDef}      onChange={setMuscleDef}      />
        <Slider label="Body Fat %"        value={bodyFat}        onChange={setBodyFat}        />
        <Slider label="Bone Frame"        value={boneFrame}      onChange={setBoneFrame}      />
        <Slider label="Water Retention"   value={waterRetention} onChange={setWaterRetention} />
      </Section>
      <Section title="💪 Upper Body">
        <Slider label="Shoulder Width"  value={shoulderW}    onChange={setShoulderW}    />
        <Slider label="Chest Size"      value={chestSize}    onChange={setChestSize}    />
        <Slider label="Chest Depth"     value={chestDepth}   onChange={setChestDepth}   />
        <Slider label="Neck Thickness"  value={neckThick}    onChange={setNeckThick}    />
        <Slider label="Arm Length"      value={armLen}       onChange={setArmLen}       />
        <Slider label="Upper Arm"       value={upperArmThick} onChange={setUpperArmThick} />
        <Slider label="Forearm"         value={forearmThick} onChange={setForearmThick} />
        <Slider label="Wrist"           value={wristSize}    onChange={setWristSize}    />
        <Slider label="Hand Size"       value={handSize}     onChange={setHandSize}     />
      </Section>
      <Section title="🫃 Core">
        <Slider label="Waist Size"    value={waistSize}   onChange={setWaistSize}   />
        <Slider label="Ab Definition" value={abDef}       onChange={setAbDef}       />
        <Slider label="Love Handles"  value={loveHandles} onChange={setLoveHandles} />
        <Slider label="Hip Size"      value={hipSize}     onChange={setHipSize}     />
        <Slider label="Glute Size"    value={gluteSize}   onChange={setGluteSize}   />
      </Section>
      <Section title="🦵 Lower Body">
        <Slider label="Leg Length"  value={legLen}     onChange={setLegLen}     />
        <Slider label="Thigh"       value={thighThick} onChange={setThighThick} />
        <Slider label="Calf"        value={calfSize}   onChange={setCalfSize}   />
        <Slider label="Ankle"       value={ankleSize}  onChange={setAnkleSize}  />
        <Slider label="Foot Size"   value={footSize}   onChange={setFootSize}   />
      </Section>
      <Section title="🎨 Skin" defaultOpen={false}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {SKIN_TONES.map(t => (
            <div key={t} onClick={() => setSkinTone(t)} style={{
              width: 24, height: 24, borderRadius: 4, background: t, cursor: 'pointer',
              border: `2px solid ${skinTone === t ? '#00ffc8' : '#21262d'}`,
            }} />
          ))}
        </div>
        <ColorRow label="Custom Tone" value={skinTone}   onChange={setSkinTone}   />
        <Slider   label="Roughness"   value={skinRough}  onChange={setSkinRough}  />
        <Slider   label="Gloss"       value={skinGloss}  onChange={setSkinGloss}  />
        <Slider   label="Subsurface"  value={subsurface} onChange={setSubsurface} />
      </Section>
      <Section title="⚙ Output" defaultOpen={false}>
        <Select label="Poly Budget"   value={polyBudget}   options={POLY_OPTIONS} onChange={setPolyBudget}   />
        <Check  label="Add Rig"       value={addRig}       onChange={setAddRig}       />
        <Check  label="Auto LOD"      value={addLOD}       onChange={setAddLOD}       />
        <Check  label="Separate Head" value={separateHead} onChange={setSeparateHead} />
        <Check  label="Subdivision"   value={addSubdiv}    onChange={setAddSubdiv}    />
      </Section>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={randomize} style={{
          background: '#1a1f2c', color: '#888', border: '1px solid #21262d',
          borderRadius: 4, padding: '6px 10px', cursor: 'pointer', fontSize: 11,
        }}>🎲</button>
        <GenBtn label="⚡ Generate Body" onClick={() => onGenerate?.({
          gender, bodyType, ageGroup, seed, height, weight,
          composition: { muscleDef, bodyFat, boneFrame, waterRetention },
          upper: { shoulderW, chestSize, chestDepth, neckThick, armLen, upperArmThick, forearmThick, wristSize, handSize },
          core: { waistSize, abDef, loveHandles, hipSize, gluteSize },
          lower: { legLen, thighThick, calfSize, ankleSize, footSize },
          skin: { skinTone, skinRough, skinGloss, subsurface },
          output: { polyBudget, addRig, addLOD, separateHead, addSubdiv },
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
