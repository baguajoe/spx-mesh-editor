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

const FACE_SHAPES  = ['Oval','Round','Square','Heart','Diamond','Oblong','Triangle','Pear'];
const ETHNICITIES  = ['Mixed','East Asian','South Asian','African','European','Latino','Middle Eastern','Indigenous','Scandinavian','Slavic'];
const GENDERS      = ['Male','Female','Non-Binary','Masculine','Feminine'];
const EXPRESSIONS  = ['Neutral','Smile','Frown','Surprised','Angry','Sad','Disgust','Fear','Smirk'];
const EYE_SHAPES   = ['Almond','Round','Hooded','Monolid','Upturned','Downturned','Wide','Narrow'];
const NOSE_TYPES   = ['Straight','Button','Aquiline','Snub','Bulbous','Flat','Hawk','Greek'];
const LIP_TYPES    = ['Thin','Medium','Full','Heart','Bow','Wide','Downturned'];
const BROW_TYPES   = ['Straight','Arched','Flat','Bushy','Thin','Angular','Unibrow'];
const POLY_OPTIONS = ['Low (800)','Mid (3.2K)','High (12K)','Ultra (48K)'];

export default function FaceGeneratorPanel({ onGenerate }) {
  const [faceShape,    setFaceShape]    = useState('Oval');
  const [ethnicity,    setEthnicity]    = useState('Mixed');
  const [gender,       setGender]       = useState('Non-Binary');
  const [age,          setAge]          = useState(28);
  const [expression,   setExpression]   = useState('Neutral');
  const [skinTone,     setSkinTone]     = useState('#c8906a');
  const [asymmetry,    setAsymmetry]    = useState(0.05);
  const [seed,         setSeed]         = useState(42);
  // Head structure
  const [jawWidth,     setJawWidth]     = useState(0.50);
  const [jawSharp,     setJawSharp]     = useState(0.40);
  const [cheekbone,    setCheekbone]    = useState(0.50);
  const [foreheadH,    setForeheadH]    = useState(0.50);
  const [foreheadW,    setForeheadW]    = useState(0.50);
  const [chinPoint,    setChinPoint]    = useState(0.50);
  const [chinW,        setChinW]        = useState(0.40);
  const [faceLen,      setFaceLen]      = useState(0.50);
  // Eyes
  const [eyeShape,     setEyeShape]     = useState('Almond');
  const [eyeSpacing,   setEyeSpacing]   = useState(0.50);
  const [eyeSize,      setEyeSize]      = useState(0.50);
  const [eyeAngle,     setEyeAngle]     = useState(0.00);
  const [eyeDepth,     setEyeDepth]     = useState(0.40);
  const [irisColor,    setIrisColor]    = useState('#3a7acc');
  const [pupilSize,    setPupilSize]    = useState(0.40);
  // Brows
  const [browType,     setBrowType]     = useState('Arched');
  const [browHeight,   setBrowHeight]   = useState(0.50);
  const [browThick,    setBrowThick]    = useState(0.40);
  const [browColor,    setBrowColor]    = useState('#2a1a08');
  // Nose
  const [noseType,     setNoseType]     = useState('Straight');
  const [noseBridge,   setNoseBridge]   = useState(0.50);
  const [noseW,        setNoseW]        = useState(0.50);
  const [nostrilFlare, setNostrilFlare] = useState(0.40);
  const [noseLen,      setNoseLen]      = useState(0.50);
  const [noseTip,      setNoseTip]      = useState(0.50);
  // Lips
  const [lipType,      setLipType]      = useState('Medium');
  const [lipThick,     setLipThick]     = useState(0.50);
  const [lipWidth,     setLipWidth]     = useState(0.50);
  const [lipColor,     setLipColor]     = useState('#c06070');
  const [mouthAngle,   setMouthAngle]   = useState(0.00);
  const [philtrum,     setPhiltrum]     = useState(0.40);
  // Ears
  const [earSize,      setEarSize]      = useState(0.50);
  const [earAngle,     setEarAngle]     = useState(0.20);
  // Skin detail
  const [wrinkles,     setWrinkles]     = useState(0.00);
  const [pores,        setPores]        = useState(0.30);
  const [freckles,     setFreckles]     = useState(0.00);
  const [subsurface,   setSubsurface]   = useState(0.60);
  const [oiliness,     setOiliness]     = useState(0.30);
  // Output
  const [polyLevel,    setPolyLevel]    = useState('High (12K)');
  const [blendshapes,  setBlendshapes]  = useState(true);
  const [addTeeth,     setAddTeeth]     = useState(true);
  const [addTongue,    setAddTongue]    = useState(false);
  const [addEyelashes, setAddEyelashes] = useState(true);
  const [separateParts,setSeparateParts]= useState(false);
  const [exportUDIMs,  setExportUDIMs]  = useState(false);

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a, b) => parseFloat((a + Math.random() * (b - a)).toFixed(2));
    setFaceShape(pick(FACE_SHAPES)); setEthnicity(pick(ETHNICITIES));
    setGender(pick(GENDERS)); setExpression(pick(EXPRESSIONS));
    setAge(Math.round(18 + Math.random() * 55));
    setJawWidth(rn(0.3, 0.75)); setCheekbone(rn(0.3, 0.8));
    setEyeSize(rn(0.35, 0.7)); setNoseW(rn(0.3, 0.7));
    setLipThick(rn(0.3, 0.8)); setAsymmetry(rn(0, 0.15));
    setSeed(Math.floor(Math.random() * 9999));
  }, []);

  return (
    <div style={P}>
      <Section title="\u{1F9EC} Base">
        <Badges items={FACE_SHAPES} active={faceShape} onSelect={setFaceShape} />
        <Select label="Ethnicity"  value={ethnicity}  options={ETHNICITIES}  onChange={setEthnicity}  />
        <Select label="Gender"     value={gender}     options={GENDERS}      onChange={setGender}     />
        <Select label="Expression" value={expression} options={EXPRESSIONS}  onChange={setExpression} />
        <Slider label="Age"        value={age} min={5} max={95} step={1} onChange={setAge} unit=" yrs" />
        <ColorRow label="Skin Tone" value={skinTone} onChange={setSkinTone} />
        <Slider label="Asymmetry"  value={asymmetry} min={0} max={0.3} step={0.005} onChange={setAsymmetry} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="\u{1F480} Head Structure">
        <Slider label="Jaw Width"        value={jawWidth}   onChange={setJawWidth}   />
        <Slider label="Jaw Sharpness"    value={jawSharp}   onChange={setJawSharp}   />
        <Slider label="Cheekbone"        value={cheekbone}  onChange={setCheekbone}  />
        <Slider label="Forehead Height"  value={foreheadH}  onChange={setForeheadH}  />
        <Slider label="Forehead Width"   value={foreheadW}  onChange={setForeheadW}  />
        <Slider label="Face Length"      value={faceLen}    onChange={setFaceLen}    />
        <Slider label="Chin Point"       value={chinPoint}  onChange={setChinPoint}  />
        <Slider label="Chin Width"       value={chinW}      onChange={setChinW}      />
      </Section>
      <Section title="\u{1F441} Eyes">
        <Badges items={EYE_SHAPES} active={eyeShape} onSelect={setEyeShape} />
        <Slider label="Spacing"    value={eyeSpacing} onChange={setEyeSpacing} />
        <Slider label="Size"       value={eyeSize}    onChange={setEyeSize}    />
        <Slider label="Tilt"       value={eyeAngle} min={-0.3} max={0.3} step={0.01} onChange={setEyeAngle} />
        <Slider label="Depth"      value={eyeDepth}   onChange={setEyeDepth}   />
        <Slider label="Pupil Size" value={pupilSize}  onChange={setPupilSize}  />
        <ColorRow label="Iris Color" value={irisColor} onChange={setIrisColor} />
      </Section>
      <Section title="Brows">
        <Badges items={BROW_TYPES} active={browType} onSelect={setBrowType} />
        <Slider   label="Height"    value={browHeight} onChange={setBrowHeight} />
        <Slider   label="Thickness" value={browThick}  onChange={setBrowThick}  />
        <ColorRow label="Color"     value={browColor}  onChange={setBrowColor}  />
      </Section>
      <Section title="\u{1F443} Nose">
        <Badges items={NOSE_TYPES} active={noseType} onSelect={setNoseType} />
        <Slider label="Bridge"        value={noseBridge}   onChange={setNoseBridge}   />
        <Slider label="Width"         value={noseW}        onChange={setNoseW}        />
        <Slider label="Length"        value={noseLen}      onChange={setNoseLen}      />
        <Slider label="Tip"           value={noseTip}      onChange={setNoseTip}      />
        <Slider label="Nostril Flare" value={nostrilFlare} onChange={setNostrilFlare} />
      </Section>
      <Section title="\u{1F444} Lips">
        <Badges items={LIP_TYPES} active={lipType} onSelect={setLipType} />
        <Slider   label="Thickness"   value={lipThick}   onChange={setLipThick}   />
        <Slider   label="Width"       value={lipWidth}   onChange={setLipWidth}   />
        <Slider   label="Mouth Angle" value={mouthAngle} min={-0.2} max={0.2} step={0.01} onChange={setMouthAngle} />
        <Slider   label="Philtrum"    value={philtrum}   onChange={setPhiltrum}   />
        <ColorRow label="Lip Color"   value={lipColor}   onChange={setLipColor}   />
      </Section>
      <Section title="Ears">
        <Slider label="Ear Size"  value={earSize}  onChange={setEarSize}  />
        <Slider label="Ear Angle" value={earAngle} onChange={setEarAngle} />
      </Section>
      <Section title="\u{1F52C} Skin Detail" defaultOpen={false}>
        <Slider label="Wrinkles"    value={wrinkles}   onChange={setWrinkles}   />
        <Slider label="Pore Detail" value={pores}      onChange={setPores}      />
        <Slider label="Freckles"    value={freckles}   onChange={setFreckles}   />
        <Slider label="Subsurface"  value={subsurface} onChange={setSubsurface} />
        <Slider label="Oiliness"    value={oiliness}   onChange={setOiliness}   />
      </Section>
      <Section title="\u2699 Output" defaultOpen={false}>
        <Select label="Poly Budget" value={polyLevel} options={POLY_OPTIONS} onChange={setPolyLevel} />
        <Check label="Blendshapes"    value={blendshapes}   onChange={setBlendshapes}   />
        <Check label="Teeth"          value={addTeeth}      onChange={setAddTeeth}      />
        <Check label="Tongue"         value={addTongue}     onChange={setAddTongue}     />
        <Check label="Eyelashes"      value={addEyelashes}  onChange={setAddEyelashes}  />
        <Check label="Separate Parts" value={separateParts} onChange={setSeparateParts} />
        <Check label="Export UDIMs"   value={exportUDIMs}   onChange={setExportUDIMs}   />
      </Section>
      <div style={{ display: 'flex', gap: 6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="\u26a1 Generate Face" onClick={() => onGenerate?.({
          faceShape, ethnicity, gender, age, expression, skinTone, asymmetry, seed,
          jaw: { jawWidth, jawSharp }, cheekbone, forehead: { foreheadH, foreheadW },
          chin: { chinPoint, chinW }, faceLen,
          eye: { eyeShape, eyeSpacing, eyeSize, eyeAngle, eyeDepth, irisColor, pupilSize },
          brow: { browType, browHeight, browThick, browColor },
          nose: { noseType, noseBridge, noseW, nostrilFlare, noseLen, noseTip },
          lip: { lipType, lipThick, lipWidth, lipColor, mouthAngle, philtrum },
          ear: { earSize, earAngle },
          skin: { wrinkles, pores, freckles, subsurface, oiliness },
          output: { polyLevel, blendshapes, addTeeth, addTongue, addEyelashes, separateParts, exportUDIMs },
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
