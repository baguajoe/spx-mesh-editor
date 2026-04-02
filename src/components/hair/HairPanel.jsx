import React, { useState, useCallback, useRef, useEffect } from 'react';

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
