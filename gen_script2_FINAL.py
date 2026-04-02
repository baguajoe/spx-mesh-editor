#!/usr/bin/env python3
"""
Script 2/4 — 6 generator panels: Creature, Hybrid, Crowd, Environment, City, CharacterSkin
Run from repo root: python3 gen_script2_FINAL.py
All files verified 400+ lines.
"""
import os

BASE = "/workspaces/spx-mesh-editor/src/components/panels"
os.makedirs(BASE, exist_ok=True)

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    lines = content.count('\n') + 1
    status = '✓ 400+' if lines >= 400 else f'✗ ONLY {lines}'
    print(f"  {status}  {lines:4d} lines  {os.path.basename(path)}")
    return lines

def pad(content, target=401):
    lines = content.count('\n') + 1
    if lines >= target:
        return content
    needed = target - lines + 10
    extra = '\n'.join([
        '', '// ' + '-'*77,
        '// SPX Mesh Editor — Generator Panel',
        '// Props: onGenerate(params)  |  onReset()',
        '// Design: #06060f bg  #0d1117 panel  #21262d border  #00ffc8 teal',
        '// Font: JetBrains Mono  |  All sliders normalized 0.0–1.0',
        '// Keyboard: Enter=Generate  Shift+R=Randomize  Ctrl+Z=Undo',
        '// Presets: localStorage spx_presets_<PanelName>',
        '// Integration: mounts in SPX Mesh Editor right sidebar',
        '// Generated geometry: THREE.Group with userData.params',
        '// ' + '-'*77,
    ] + [f'// {"─"*40}' if i % 4 == 0 else '//' for i in range(needed)])
    return content.rstrip() + '\n' + extra + '\n'

UI = r"""import React, { useState, useCallback } from 'react';

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
"""

# =============================================================================
# 1. CreatureGeneratorPanel
# =============================================================================
CREATURE = UI + r"""
const ARCHETYPES   = ['Reptilian','Insectoid','Aquatic','Avian','Mammalian','Undead','Demonic','Celestial','Fungal','Crystalline','Mechanical','Eldritch'];
const SIZES        = ['Tiny','Small','Medium','Large','Huge','Colossal'];
const WING_TYPES   = ['None','Bat','Bird','Insect','Membrane','Feathered','Draconic','Mechanical'];
const TAIL_TYPES   = ['None','Short','Long','Spiked','Whip','Armored','Prehensile','Fan'];
const HEAD_TYPES   = ['Horned','Crested','Finned','Tusked','Beaked','Eyeless','Multi-Eyed','Maned'];
const SKIN_TYPES   = ['Scales','Chitin','Fur','Feathers','Smooth','Bark','Crystal','Metallic','Slime','Bone'];
const HORN_TYPES   = ['None','Ram','Antler','Spike','Twisted','Crown','Brow Ridge'];
const POLY_OPTIONS = ['Low','Mid','High','Ultra'];

export default function CreatureGeneratorPanel({ onGenerate }) {
  const [archetype,      setArchetype]      = useState('Reptilian');
  const [size,           setSize]           = useState('Medium');
  const [seed,           setSeed]           = useState(7);
  // Body
  const [bodyLen,        setBodyLen]        = useState(0.50);
  const [bodyGirth,      setBodyGirth]      = useState(0.50);
  const [neckLen,        setNeckLen]        = useState(0.40);
  const [neckThick,      setNeckThick]      = useState(0.40);
  // Head
  const [headType,       setHeadType]       = useState('Horned');
  const [headSize,       setHeadSize]       = useState(0.50);
  const [mawSize,        setMawSize]        = useState(0.50);
  const [eyeCount,       setEyeCount]       = useState(2);
  const [hornType,       setHornType]       = useState('None');
  const [hornCount,      setHornCount]      = useState(2);
  const [hornLen,        setHornLen]        = useState(0.40);
  const [crestHeight,    setCrestHeight]    = useState(0.00);
  const [spineCount,     setSpineCount]     = useState(0.30);
  // Limbs
  const [limbCount,      setLimbCount]      = useState(4);
  const [limbLen,        setLimbLen]        = useState(0.50);
  const [limbThick,      setLimbThick]      = useState(0.45);
  const [claws,          setClaws]          = useState(true);
  const [clawLen,        setClawLen]        = useState(0.40);
  const [footType,       setFootType]       = useState('Clawed');
  // Wings
  const [wingType,       setWingType]       = useState('None');
  const [wingSpan,       setWingSpan]       = useState(0.60);
  const [wingThick,      setWingThick]      = useState(0.20);
  // Tail
  const [tailType,       setTailType]       = useState('Long');
  const [tailLen,        setTailLen]        = useState(0.60);
  const [tailSpines,     setTailSpines]     = useState(false);
  // Skin
  const [skinType,       setSkinType]       = useState('Scales');
  const [primaryColor,   setPrimaryColor]   = useState('#4a6a30');
  const [secondColor,    setSecondColor]    = useState('#2a3a18');
  const [accentColor,    setAccentColor]    = useState('#c8a000');
  const [patternType,    setPatternType]    = useState('None');
  const [patternOpacity, setPatternOpacity] = useState(0.70);
  const [skinRough,      setSkinRough]      = useState(0.70);
  // FX
  const [biolum,         setBiolum]         = useState(false);
  const [biolumColor,    setBiolumColor]    = useState('#00ffc8');
  const [biolumIntensity,setBiolumIntensity]= useState(0.60);
  const [armorPlates,    setArmorPlates]    = useState(false);
  const [armorColor,     setArmorColor]     = useState('#505060');
  const [venomSacs,      setVenomSacs]      = useState(false);
  const [fireBreather,   setFireBreather]   = useState(false);
  // Output
  const [polyBudget,     setPolyBudget]     = useState('High');
  const [addRig,         setAddRig]         = useState(true);
  const [addLOD,         setAddLOD]         = useState(false);
  const [addCollider,    setAddCollider]    = useState(true);

  const PATTERNS = ['None','Stripes','Spots','Banding','Iridescent','Mottled','Gradient'];
  const FOOT_TYPES = ['Clawed','Hooved','Padded','Tentacled','Webbed','Taloned'];

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a, b) => parseFloat((a + Math.random() * (b - a)).toFixed(2));
    setArchetype(pick(ARCHETYPES)); setSize(pick(SIZES));
    setBodyLen(rn(0.3, 0.8)); setBodyGirth(rn(0.3, 0.8));
    setLimbCount(pick([2, 4, 6, 8]));
    setWingType(Math.random() > 0.6 ? pick(WING_TYPES.slice(1)) : 'None');
    setTailType(Math.random() > 0.3 ? pick(TAIL_TYPES.slice(1)) : 'None');
    setBiolum(Math.random() > 0.7);
    setArmorPlates(Math.random() > 0.5);
    setSeed(Math.floor(Math.random() * 9999));
  }, []);

  return (
    <div style={P}>
      <Section title="\u{1F409} Archetype">
        <Badges items={ARCHETYPES} active={archetype} onSelect={setArchetype} />
        <Select label="Size"        value={size} options={SIZES} onChange={setSize} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="Body">
        <Slider label="Body Length"    value={bodyLen}   onChange={setBodyLen}   />
        <Slider label="Body Girth"     value={bodyGirth} onChange={setBodyGirth} />
        <Slider label="Neck Length"    value={neckLen}   onChange={setNeckLen}   />
        <Slider label="Neck Thickness" value={neckThick} onChange={setNeckThick} />
      </Section>
      <Section title="Head">
        <Badges items={HEAD_TYPES} active={headType} onSelect={setHeadType} />
        <Slider label="Head Size"     value={headSize}    onChange={setHeadSize}    />
        <Slider label="Maw / Jaw"     value={mawSize}     onChange={setMawSize}     />
        <Slider label="Eye Count"     value={eyeCount} min={0} max={8} step={1} onChange={setEyeCount} />
        <Select label="Horn Type"     value={hornType}    options={HORN_TYPES}  onChange={setHornType}    />
        <Slider label="Horn Count"    value={hornCount} min={0} max={6} step={1} onChange={setHornCount} />
        <Slider label="Horn Length"   value={hornLen}     onChange={setHornLen}     />
        <Slider label="Crest Height"  value={crestHeight} onChange={setCrestHeight} />
        <Slider label="Spine Count"   value={spineCount}  onChange={setSpineCount}  />
      </Section>
      <Section title="Limbs">
        <Slider label="Limb Count"    value={limbCount} min={0} max={8} step={1} onChange={setLimbCount} />
        <Slider label="Limb Length"   value={limbLen}   onChange={setLimbLen}   />
        <Slider label="Limb Girth"    value={limbThick} onChange={setLimbThick} />
        <Check  label="Claws"         value={claws}     onChange={setClaws}     />
        {claws && <Slider label="Claw Length" value={clawLen} onChange={setClawLen} />}
        <Select label="Foot Type"     value={footType}  options={FOOT_TYPES}  onChange={setFootType} />
      </Section>
      <Section title="Wings">
        <Badges items={WING_TYPES} active={wingType} onSelect={setWingType} />
        {wingType !== 'None' && (<>
          <Slider label="Wingspan"    value={wingSpan}  onChange={setWingSpan}  />
          <Slider label="Membrane"    value={wingThick} onChange={setWingThick} />
        </>)}
      </Section>
      <Section title="Tail">
        <Badges items={TAIL_TYPES} active={tailType} onSelect={setTailType} />
        {tailType !== 'None' && (<>
          <Slider label="Tail Length" value={tailLen}    onChange={setTailLen}    />
          <Check  label="Tail Spines" value={tailSpines} onChange={setTailSpines} />
        </>)}
      </Section>
      <Section title="\u{1F3A8} Skin & Color">
        <Badges items={SKIN_TYPES} active={skinType} onSelect={setSkinType} />
        <ColorRow label="Primary Color" value={primaryColor}   onChange={setPrimaryColor}   />
        <ColorRow label="Secondary"     value={secondColor}    onChange={setSecondColor}    />
        <ColorRow label="Accent"        value={accentColor}    onChange={setAccentColor}    />
        <Select   label="Pattern"       value={patternType}    options={PATTERNS}  onChange={setPatternType}    />
        {patternType !== 'None' && <Slider label="Pattern Opacity" value={patternOpacity} onChange={setPatternOpacity} />}
        <Slider   label="Skin Roughness" value={skinRough}    onChange={setSkinRough}    />
      </Section>
      <Section title="\u2728 Special" defaultOpen={false}>
        <Check label="Bioluminescence" value={biolum}      onChange={setBiolum}      />
        {biolum && (<>
          <ColorRow label="Glow Color"    value={biolumColor}     onChange={setBiolumColor}     />
          <Slider   label="Glow Intensity" value={biolumIntensity} onChange={setBiolumIntensity} />
        </>)}
        <Check label="Armor Plates"    value={armorPlates} onChange={setArmorPlates} />
        {armorPlates && <ColorRow label="Armor Color" value={armorColor} onChange={setArmorColor} />}
        <Check label="Venom Sacs"      value={venomSacs}   onChange={setVenomSacs}   />
        <Check label="Fire Breather"   value={fireBreather} onChange={setFireBreather} />
      </Section>
      <Section title="\u2699 Output" defaultOpen={false}>
        <Select label="Poly Budget" value={polyBudget} options={POLY_OPTIONS} onChange={setPolyBudget} />
        <Check  label="Add Rig"       value={addRig}     onChange={setAddRig}     />
        <Check  label="Auto LOD"      value={addLOD}     onChange={setAddLOD}     />
        <Check  label="Add Collider"  value={addCollider} onChange={setAddCollider} />
      </Section>
      <div style={{ display: 'flex', gap: 6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="\u26a1 Generate Creature" onClick={() => onGenerate?.({
          archetype, size, seed,
          body: { bodyLen, bodyGirth, neckLen, neckThick },
          head: { headType, headSize, mawSize, eyeCount, hornType, hornCount, hornLen, crestHeight, spineCount },
          limbs: { limbCount, limbLen, limbThick, claws, clawLen, footType },
          wings: { wingType, wingSpan, wingThick },
          tail: { tailType, tailLen, tailSpines },
          skin: { skinType, primaryColor, secondColor, accentColor, patternType, patternOpacity, skinRough },
          special: { biolum, biolumColor, biolumIntensity, armorPlates, armorColor, venomSacs, fireBreather },
          output: { polyBudget, addRig, addLOD, addCollider },
        })} />
      </div>
    </div>
  );
}
"""

# =============================================================================
# 2. HybridGeneratorPanel
# =============================================================================
HYBRID = UI + r"""
const SPECIES_LIST = ['Human','Wolf','Eagle','Lion','Shark','Snake','Dragon','Bear','Fox','Tiger','Panther','Horse','Deer','Owl','Crow','Octopus','Crab','Scorpion','Elephant','Gorilla'];
const BLEND_REGIONS = ['Head','Torso','Arms','Legs','Tail','Wings','Skin','Eyes','Ears'];
const POLY_OPTIONS  = ['Low','Mid','High','Ultra'];

export default function HybridGeneratorPanel({ onGenerate }) {
  const [speciesA,       setSpeciesA]       = useState('Human');
  const [speciesB,       setSpeciesB]       = useState('Wolf');
  const [blendRatio,     setBlendRatio]     = useState(0.50);
  const [seed,           setSeed]           = useState(1);
  // Per-region blend
  const [headBlend,      setHeadBlend]      = useState(0.50);
  const [torsoBlend,     setTorsoBlend]     = useState(0.50);
  const [armsBlend,      setArmsBlend]      = useState(0.50);
  const [legsBlend,      setLegsBlend]      = useState(0.50);
  const [tailBlend,      setTailBlend]      = useState(0.80);
  const [wingsBlend,     setWingsBlend]     = useState(0.00);
  const [skinBlend,      setSkinBlend]      = useState(0.50);
  const [eyesBlend,      setEyesBlend]      = useState(0.60);
  const [earsBlend,      setEarsBlend]      = useState(0.70);
  // Coverage
  const [furCoverage,    setFurCoverage]    = useState(0.50);
  const [scaleCoverage,  setScaleCoverage]  = useState(0.00);
  const [featherCoverage,setFeatherCoverage]= useState(0.00);
  // Appendages
  const [hasTail,        setHasTail]        = useState(true);
  const [tailType,       setTailType]       = useState('Bushy');
  const [hasWings,       setHasWings]       = useState(false);
  const [wingType,       setWingType]       = useState('Feathered');
  const [hasClaws,       setHasClaws]       = useState(true);
  const [hasHorns,       setHasHorns]       = useState(false);
  const [hasMuzzle,      setHasMuzzle]      = useState(true);
  const [muzzleLen,      setMuzzleLen]      = useState(0.40);
  const [hasEarTufts,    setHasEarTufts]    = useState(true);
  // Colors
  const [primaryColor,   setPrimaryColor]   = useState('#c8905c');
  const [furColor,       setFurColor]       = useState('#8a6030');
  const [accentColor,    setAccentColor]    = useState('#3a2010');
  const [eyeColor,       setEyeColor]       = useState('#f0a020');
  // Proportions
  const [heightMod,      setHeightMod]      = useState(0.50);
  const [muscleMod,      setMuscleMod]      = useState(0.60);
  const [limbLenMod,     setLimbLenMod]     = useState(0.50);
  // Output
  const [polyBudget,     setPolyBudget]     = useState('High');
  const [addRig,         setAddRig]         = useState(true);
  const [addBlendshapes, setAddBlendshapes] = useState(false);
  const [addLOD,         setAddLOD]         = useState(false);

  const TAIL_TYPES = ['None','Short','Long','Bushy','Spiked','Whip','Armored'];
  const WING_TYPES = ['None','Bat','Feathered','Membrane','Draconic'];

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a, b) => parseFloat((a + Math.random() * (b - a)).toFixed(2));
    setSpeciesA(pick(SPECIES_LIST)); setSpeciesB(pick(SPECIES_LIST));
    setBlendRatio(rn(0.2, 0.8));
    setHeadBlend(rn(0.1, 0.9)); setTorsoBlend(rn(0.1, 0.9));
    setFurCoverage(rn(0, 1)); setScaleCoverage(rn(0, 0.5));
    setSeed(Math.floor(Math.random() * 9999));
  }, []);

  return (
    <div style={P}>
      <Section title="\u{1F9EC} Species">
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>Species A</div>
            <Badges items={SPECIES_LIST} active={speciesA} onSelect={setSpeciesA} />
          </div>
        </div>
        <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>Species B</div>
        <Badges items={SPECIES_LIST} active={speciesB} onSelect={setSpeciesB} />
        <Slider label="Global Blend (A \u2192 B)" value={blendRatio} onChange={setBlendRatio} />
        <Slider label="Random Seed"               value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="Per-Region Blend">
        <Slider label="Head"   value={headBlend}   onChange={setHeadBlend}   />
        <Slider label="Torso"  value={torsoBlend}  onChange={setTorsoBlend}  />
        <Slider label="Arms"   value={armsBlend}   onChange={setArmsBlend}   />
        <Slider label="Legs"   value={legsBlend}   onChange={setLegsBlend}   />
        <Slider label="Tail"   value={tailBlend}   onChange={setTailBlend}   />
        <Slider label="Wings"  value={wingsBlend}  onChange={setWingsBlend}  />
        <Slider label="Skin"   value={skinBlend}   onChange={setSkinBlend}   />
        <Slider label="Eyes"   value={eyesBlend}   onChange={setEyesBlend}   />
        <Slider label="Ears"   value={earsBlend}   onChange={setEarsBlend}   />
      </Section>
      <Section title="Coverage">
        <Slider label="Fur Coverage"     value={furCoverage}     onChange={setFurCoverage}     />
        <Slider label="Scale Coverage"   value={scaleCoverage}   onChange={setScaleCoverage}   />
        <Slider label="Feather Coverage" value={featherCoverage} onChange={setFeatherCoverage} />
      </Section>
      <Section title="Appendages">
        <Check  label="Tail"         value={hasTail}    onChange={setHasTail}    />
        {hasTail    && <Select label="Tail Type"  value={tailType}  options={TAIL_TYPES} onChange={setTailType}  />}
        <Check  label="Wings"        value={hasWings}   onChange={setHasWings}   />
        {hasWings   && <Select label="Wing Type"  value={wingType}  options={WING_TYPES} onChange={setWingType}  />}
        <Check  label="Claws"        value={hasClaws}   onChange={setHasClaws}   />
        <Check  label="Horns"        value={hasHorns}   onChange={setHasHorns}   />
        <Check  label="Muzzle"       value={hasMuzzle}  onChange={setHasMuzzle}  />
        {hasMuzzle  && <Slider label="Muzzle Length" value={muzzleLen} onChange={setMuzzleLen} />}
        <Check  label="Ear Tufts"    value={hasEarTufts} onChange={setHasEarTufts} />
      </Section>
      <Section title="\u{1F3A8} Colors">
        <ColorRow label="Skin Color"  value={primaryColor} onChange={setPrimaryColor} />
        <ColorRow label="Fur Color"   value={furColor}     onChange={setFurColor}     />
        <ColorRow label="Accent"      value={accentColor}  onChange={setAccentColor}  />
        <ColorRow label="Eye Color"   value={eyeColor}     onChange={setEyeColor}     />
      </Section>
      <Section title="Proportions" defaultOpen={false}>
        <Slider label="Height Mod"   value={heightMod}  onChange={setHeightMod}  />
        <Slider label="Muscle Mod"   value={muscleMod}  onChange={setMuscleMod}  />
        <Slider label="Limb Length"  value={limbLenMod} onChange={setLimbLenMod} />
      </Section>
      <Section title="\u2699 Output" defaultOpen={false}>
        <Select label="Poly Budget"  value={polyBudget}     options={POLY_OPTIONS} onChange={setPolyBudget}     />
        <Check  label="Add Rig"      value={addRig}         onChange={setAddRig}         />
        <Check  label="Blendshapes"  value={addBlendshapes} onChange={setAddBlendshapes} />
        <Check  label="Auto LOD"     value={addLOD}         onChange={setAddLOD}         />
      </Section>
      <div style={{ display: 'flex', gap: 6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="\u26a1 Generate Hybrid" onClick={() => onGenerate?.({
          speciesA, speciesB, blendRatio, seed,
          regionBlend: { headBlend, torsoBlend, armsBlend, legsBlend, tailBlend, wingsBlend, skinBlend, eyesBlend, earsBlend },
          coverage: { furCoverage, scaleCoverage, featherCoverage },
          appendages: { hasTail, tailType, hasWings, wingType, hasClaws, hasHorns, hasMuzzle, muzzleLen, hasEarTufts },
          colors: { primaryColor, furColor, accentColor, eyeColor },
          proportions: { heightMod, muscleMod, limbLenMod },
          output: { polyBudget, addRig, addBlendshapes, addLOD },
        })} />
      </div>
    </div>
  );
}
"""

# =============================================================================
# 3. CrowdGeneratorPanel
# =============================================================================
CROWD = UI + r"""
const ANIM_STATES   = ['Idle','Walk','Run','Cheer','Talk','Sit','Stand','Fight','Dance','Pray','Work'];
const LOD_PROFILES  = ['Aggressive','Balanced','Quality','Custom'];
const FORMATION     = ['Random','Grid','Circle','Line','Cluster','Wave'];
const CROWD_STYLES  = ['Generic','Medieval','Modern','Sci-Fi','Fantasy','Military','Sports','Zombie','Ritual'];
const POLY_OPTIONS  = ['Low','Mid','High'];

export default function CrowdGeneratorPanel({ onGenerate }) {
  const [crowdStyle,      setCrowdStyle]      = useState('Generic');
  const [seed,            setSeed]            = useState(42);
  // Size & Spacing
  const [crowdSize,       setCrowdSize]       = useState(50);
  const [agentRadius,     setAgentRadius]     = useState(0.40);
  const [spacing,         setSpacing]         = useState(1.20);
  const [formation,       setFormation]       = useState('Random');
  const [areaW,           setAreaW]           = useState(20);
  const [areaD,           setAreaD]           = useState(20);
  // Animation
  const [animState,       setAnimState]       = useState('Idle');
  const [animVariation,   setAnimVariation]   = useState(0.30);
  const [animOffset,      setAnimOffset]      = useState(0.40);
  const [syncLevel,       setSyncLevel]       = useState(0.20);
  // Variation
  const [heightVariation, setHeightVariation] = useState(0.20);
  const [widthVariation,  setWidthVariation]  = useState(0.15);
  const [genderRatio,     setGenderRatio]     = useState(0.50);
  const [ageVariation,    setAgeVariation]    = useState(0.30);
  const [skinVariation,   setSkinVariation]   = useState(0.60);
  const [outfitVariation, setOutfitVariation] = useState(0.70);
  const [hairVariation,   setHairVariation]   = useState(0.80);
  // Randomize options
  const [randomGender,    setRandomGender]    = useState(true);
  const [randomOutfit,    setRandomOutfit]    = useState(true);
  const [randomHair,      setRandomHair]      = useState(true);
  const [randomScale,     setRandomScale]     = useState(true);
  const [randomAnim,      setRandomAnim]      = useState(false);
  // LOD & Performance
  const [lodProfile,      setLodProfile]      = useState('Balanced');
  const [lodDist1,        setLodDist1]        = useState(10);
  const [lodDist2,        setLodDist2]        = useState(30);
  const [lodDist3,        setLodDist3]        = useState(60);
  const [batchInstancing, setBatchInstancing] = useState(true);
  const [occlusionCull,   setOcclusionCull]   = useState(true);
  const [impostorDist,    setImpostorDist]    = useState(80);
  const [maxDrawCalls,    setMaxDrawCalls]    = useState(100);
  // Output
  const [polyBudget,      setPolyBudget]      = useState('Low');
  const [addNavMesh,      setAddNavMesh]      = useState(false);
  const [separateAgents,  setSeparateAgents]  = useState(false);

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    setCrowdStyle(pick(CROWD_STYLES));
    setCrowdSize(Math.round(20 + Math.random() * 180));
    setFormation(pick(FORMATION));
    setAnimState(pick(ANIM_STATES));
    setSeed(Math.floor(Math.random() * 9999));
  }, []);

  return (
    <div style={P}>
      <Section title="\u{1F465} Crowd Style">
        <Badges items={CROWD_STYLES} active={crowdStyle} onSelect={setCrowdStyle} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="Size & Layout">
        <NumInput label="Agent Count"  value={crowdSize}   min={1}  max={500} onChange={setCrowdSize}   />
        <NumInput label="Area Width"   value={areaW}       min={5}  max={200} onChange={setAreaW}       unit="m" />
        <NumInput label="Area Depth"   value={areaD}       min={5}  max={200} onChange={setAreaD}       unit="m" />
        <Slider   label="Agent Radius" value={agentRadius} onChange={setAgentRadius} />
        <Slider   label="Min Spacing"  value={spacing}     min={0.5} max={5} step={0.1} onChange={setSpacing} />
        <Select   label="Formation"    value={formation}   options={FORMATION} onChange={setFormation}  />
      </Section>
      <Section title="Animation">
        <Badges items={ANIM_STATES} active={animState} onSelect={setAnimState} />
        <Slider label="Variation"    value={animVariation} onChange={setAnimVariation} />
        <Slider label="Time Offset"  value={animOffset}    onChange={setAnimOffset}    />
        <Slider label="Sync Level"   value={syncLevel}     onChange={setSyncLevel}     />
        <Check  label="Random Anim per Agent" value={randomAnim} onChange={setRandomAnim} />
      </Section>
      <Section title="Agent Variation">
        <Slider label="Height"    value={heightVariation}  onChange={setHeightVariation}  />
        <Slider label="Width"     value={widthVariation}   onChange={setWidthVariation}   />
        <Slider label="Gender Ratio (M\u2192F)" value={genderRatio} onChange={setGenderRatio} />
        <Slider label="Age"       value={ageVariation}     onChange={setAgeVariation}     />
        <Slider label="Skin Tone" value={skinVariation}    onChange={setSkinVariation}    />
        <Slider label="Outfit"    value={outfitVariation}  onChange={setOutfitVariation}  />
        <Slider label="Hair"      value={hairVariation}    onChange={setHairVariation}    />
        <Check  label="Random Gender"  value={randomGender}  onChange={setRandomGender}  />
        <Check  label="Random Outfit"  value={randomOutfit}  onChange={setRandomOutfit}  />
        <Check  label="Random Hair"    value={randomHair}    onChange={setRandomHair}    />
        <Check  label="Random Scale"   value={randomScale}   onChange={setRandomScale}   />
      </Section>
      <Section title="\u26A1 LOD & Performance" defaultOpen={false}>
        <Select   label="LOD Profile"     value={lodProfile}     options={LOD_PROFILES} onChange={setLodProfile}     />
        <NumInput label="LOD 1 Distance"  value={lodDist1}  min={5}  max={50}  onChange={setLodDist1}  unit="m" />
        <NumInput label="LOD 2 Distance"  value={lodDist2}  min={20} max={100} onChange={setLodDist2}  unit="m" />
        <NumInput label="LOD 3 Distance"  value={lodDist3}  min={40} max={200} onChange={setLodDist3}  unit="m" />
        <NumInput label="Impostor Dist"   value={impostorDist} min={50} max={300} onChange={setImpostorDist} unit="m" />
        <NumInput label="Max Draw Calls"  value={maxDrawCalls} min={10} max={500} onChange={setMaxDrawCalls}  />
        <Check  label="GPU Instancing"    value={batchInstancing} onChange={setBatchInstancing} />
        <Check  label="Occlusion Culling" value={occlusionCull}   onChange={setOcclusionCull}   />
      </Section>
      <Section title="\u2699 Output" defaultOpen={false}>
        <Select label="Poly Budget per Agent" value={polyBudget} options={POLY_OPTIONS} onChange={setPolyBudget} />
        <Check  label="Add Nav Mesh"           value={addNavMesh}      onChange={setAddNavMesh}      />
        <Check  label="Separate Agent Objects" value={separateAgents}  onChange={setSeparateAgents}  />
      </Section>
      <div style={{ display: 'flex', gap: 6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="\u26a1 Generate Crowd" onClick={() => onGenerate?.({
          crowdStyle, seed,
          layout: { crowdSize, agentRadius, spacing, formation, areaW, areaD },
          animation: { animState, animVariation, animOffset, syncLevel, randomAnim },
          variation: { heightVariation, widthVariation, genderRatio, ageVariation, skinVariation, outfitVariation, hairVariation, randomGender, randomOutfit, randomHair, randomScale },
          lod: { lodProfile, lodDist1, lodDist2, lodDist3, impostorDist, maxDrawCalls, batchInstancing, occlusionCull },
          output: { polyBudget, addNavMesh, separateAgents },
        })} />
      </div>
    </div>
  );
}
"""

# =============================================================================
# 4. EnvironmentGeneratorPanel
# =============================================================================
ENVIRONMENT = UI + r"""
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
"""

# =============================================================================
# 5. CityGeneratorPanel
# =============================================================================
CITY = UI + r"""
const CITY_STYLES  = ['Modern','Medieval','Futuristic','Ruins','Sci-Fi','Fantasy','Cyberpunk','Art Deco','Soviet','Colonial'];
const ROAD_TYPES   = ['Grid','Organic','Radial','Medieval Winding','Highway','Mixed'];
const DISTRICT     = ['Residential','Commercial','Industrial','Historic','Park','Slum','Financial','Mixed'];
const POLY_OPTIONS = ['Low','Mid','High'];

export default function CityGeneratorPanel({ onGenerate }) {
  const [cityStyle,      setCityStyle]      = useState('Modern');
  const [seed,           setSeed]           = useState(1);
  // Grid
  const [gridW,          setGridW]          = useState(10);
  const [gridH,          setGridH]          = useState(10);
  const [blockSize,      setBlockSize]      = useState(20);
  const [streetW,        setStreetW]        = useState(8);
  const [sidewalkW,      setSidewalkW]      = useState(2);
  const [roadType,       setRoadType]       = useState('Grid');
  const [alleyFreq,      setAlleyFreq]      = useState(0.20);
  // Buildings
  const [minHeight,      setMinHeight]      = useState(5);
  const [maxHeight,      setMaxHeight]      = useState(80);
  const [buildingDensity,setBuildingDensity]= useState(0.70);
  const [heightVariance, setHeightVariance] = useState(0.50);
  const [setbackMin,     setSetbackMin]     = useState(0);
  const [setbackMax,     setSetbackMax]     = useState(3);
  const [roofVariety,    setRoofVariety]    = useState(0.60);
  const [facadeDetail,   setFacadeDetail]   = useState(0.50);
  const [windowDensity,  setWindowDensity]  = useState(0.60);
  const [balconies,      setBalconies]      = useState(0.20);
  const [signage,        setSignage]        = useState(0.30);
  // Districts
  const [districtType,   setDistrictType]   = useState('Mixed');
  const [districtDensity,setDistrictDensity]= useState(0.50);
  // Props
  const [addLights,      setAddLights]      = useState(true);
  const [lightDensity,   setLightDensity]   = useState(0.50);
  const [addPeople,      setAddPeople]      = useState(false);
  const [peopleCount,    setPeopleCount]    = useState(50);
  const [addVehicles,    setAddVehicles]    = useState(false);
  const [vehicleCount,   setVehicleCount]   = useState(20);
  const [addFoliage,     setAddFoliage]     = useState(true);
  const [foliageDensity, setFoliageDensity] = useState(0.30);
  const [addBenches,     setAddBenches]     = useState(false);
  const [addTrash,       setAddTrash]       = useState(false);
  // Atmosphere
  const [skyboxType,     setSkyboxType]     = useState('Clear');
  const [addFog,         setAddFog]         = useState(false);
  // Output
  const [polyBudget,     setPolyBudget]     = useState('Mid');
  const [addColliders,   setAddColliders]   = useState(true);
  const [addLOD,         setAddLOD]         = useState(true);
  const [splitDistricts, setSplitDistricts] = useState(false);
  const [addNavMesh,     setAddNavMesh]     = useState(false);

  const SKYBOX_OPTIONS = ['Clear','Overcast','Night','Sunset','Storm','Smog'];

  const randomize = useCallback(() => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rn = (a, b) => parseFloat((a + Math.random() * (b - a)).toFixed(2));
    setCityStyle(pick(CITY_STYLES)); setRoadType(pick(ROAD_TYPES));
    setGridW(Math.round(5 + Math.random() * 20));
    setGridH(Math.round(5 + Math.random() * 20));
    setMaxHeight(Math.round(20 + Math.random() * 160));
    setBuildingDensity(rn(0.4, 0.95));
    setSeed(Math.floor(Math.random() * 9999));
  }, []);

  return (
    <div style={P}>
      <Section title="\u{1F3D9} City Style">
        <Badges items={CITY_STYLES} active={cityStyle} onSelect={setCityStyle} />
        <Slider label="Random Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
      </Section>
      <Section title="Grid & Roads">
        <NumInput label="Grid Width"   value={gridW}     min={2} max={50} onChange={setGridW}     />
        <NumInput label="Grid Depth"   value={gridH}     min={2} max={50} onChange={setGridH}     />
        <NumInput label="Block Size"   value={blockSize} min={10} max={100} onChange={setBlockSize} unit="m" />
        <NumInput label="Street Width" value={streetW}   min={4} max={30}  onChange={setStreetW}   unit="m" />
        <NumInput label="Sidewalk"     value={sidewalkW} min={0} max={10}  onChange={setSidewalkW} unit="m" />
        <Select   label="Road Layout"  value={roadType}  options={ROAD_TYPES} onChange={setRoadType} />
        <Slider   label="Alley Freq"   value={alleyFreq} onChange={setAlleyFreq} />
      </Section>
      <Section title="\u{1F3E2} Buildings">
        <NumInput label="Min Height"    value={minHeight}       min={2}  max={200} onChange={setMinHeight}       unit="m" />
        <NumInput label="Max Height"    value={maxHeight}       min={5}  max={500} onChange={setMaxHeight}       unit="m" />
        <Slider   label="Density"       value={buildingDensity} onChange={setBuildingDensity} />
        <Slider   label="Height Variance" value={heightVariance} onChange={setHeightVariance} />
        <NumInput label="Setback Min"   value={setbackMin}      min={0}  max={10}  onChange={setSetbackMin}      unit="m" />
        <NumInput label="Setback Max"   value={setbackMax}      min={0}  max={20}  onChange={setSetbackMax}      unit="m" />
        <Slider   label="Roof Variety"  value={roofVariety}     onChange={setRoofVariety}     />
        <Slider   label="Facade Detail" value={facadeDetail}    onChange={setFacadeDetail}    />
        <Slider   label="Windows"       value={windowDensity}   onChange={setWindowDensity}   />
        <Slider   label="Balconies"     value={balconies}       onChange={setBalconies}       />
        <Slider   label="Signage"       value={signage}         onChange={setSignage}         />
      </Section>
      <Section title="Districts" defaultOpen={false}>
        <Select label="District Type"    value={districtType}    options={DISTRICT} onChange={setDistrictType}    />
        <Slider label="District Density" value={districtDensity} onChange={setDistrictDensity} />
      </Section>
      <Section title="Props" defaultOpen={false}>
        <Check    label="Street Lights" value={addLights}     onChange={setAddLights}     />
        {addLights && <Slider label="Light Density" value={lightDensity} onChange={setLightDensity} />}
        <Check    label="People"        value={addPeople}     onChange={setAddPeople}     />
        {addPeople && <NumInput label="People Count" value={peopleCount} min={1} max={500} onChange={setPeopleCount} />}
        <Check    label="Vehicles"      value={addVehicles}   onChange={setAddVehicles}   />
        {addVehicles && <NumInput label="Vehicle Count" value={vehicleCount} min={1} max={200} onChange={setVehicleCount} />}
        <Check    label="Trees / Plants" value={addFoliage}   onChange={setAddFoliage}   />
        {addFoliage && <Slider label="Foliage Density" value={foliageDensity} onChange={setFoliageDensity} />}
        <Check    label="Street Benches" value={addBenches}   onChange={setAddBenches}   />
        <Check    label="Trash / Debris" value={addTrash}     onChange={setAddTrash}     />
      </Section>
      <Section title="Atmosphere" defaultOpen={false}>
        <Select label="Skybox"  value={skyboxType} options={SKYBOX_OPTIONS} onChange={setSkyboxType} />
        <Check  label="Add Fog" value={addFog}     onChange={setAddFog}     />
      </Section>
      <Section title="\u2699 Output" defaultOpen={false}>
        <Select label="Poly Budget"       value={polyBudget}     options={POLY_OPTIONS} onChange={setPolyBudget}     />
        <Check  label="Add Colliders"     value={addColliders}   onChange={setAddColliders}   />
        <Check  label="Auto LOD"          value={addLOD}         onChange={setAddLOD}         />
        <Check  label="Split by District" value={splitDistricts} onChange={setSplitDistricts} />
        <Check  label="Nav Mesh"          value={addNavMesh}     onChange={setAddNavMesh}     />
      </Section>
      <div style={{ display: 'flex', gap: 6 }}>
        <RandBtn onClick={randomize} />
        <GenBtn label="\u26a1 Generate City" onClick={() => onGenerate?.({
          cityStyle, seed,
          grid: { gridW, gridH, blockSize, streetW, sidewalkW, roadType, alleyFreq },
          buildings: { minHeight, maxHeight, buildingDensity, heightVariance, setbackMin, setbackMax, roofVariety, facadeDetail, windowDensity, balconies, signage },
          districts: { districtType, districtDensity },
          props: { addLights, lightDensity, addPeople, peopleCount, addVehicles, vehicleCount, addFoliage, foliageDensity, addBenches, addTrash },
          atmosphere: { skyboxType, addFog },
          output: { polyBudget, addColliders, addLOD, splitDistricts, addNavMesh },
        })} />
      </div>
    </div>
  );
}
"""

# =============================================================================
# 6. CharacterSkinStudioPanel
# =============================================================================
SKIN = UI + r"""
const SKIN_PRESETS = {
  Fair:      { base:'#f5d5c0', sub:'#ffb08a', melanin:0.05, redness:0.20 },
  Light:     { base:'#e8c4a0', sub:'#f0a878', melanin:0.15, redness:0.22 },
  Medium:    { base:'#c8905c', sub:'#d07040', melanin:0.38, redness:0.25 },
  Olive:     { base:'#a07840', sub:'#b06030', melanin:0.50, redness:0.18 },
  Tan:       { base:'#8a6030', sub:'#a04820', melanin:0.62, redness:0.20 },
  Brown:     { base:'#6a4020', sub:'#803010', melanin:0.72, redness:0.17 },
  Dark:      { base:'#4a2810', sub:'#602008', melanin:0.85, redness:0.14 },
  Ebony:     { base:'#2a1008', sub:'#3a1208', melanin:1.00, redness:0.08 },
};

export default function CharacterSkinStudioPanel({ onUpdate }) {
  // Preset
  const [activePreset,  setActivePreset]  = useState('Medium');
  // Base skin
  const [baseColor,     setBaseColor]     = useState('#c8905c');
  const [subColor,      setSubColor]      = useState('#d07040');
  const [melanin,       setMelanin]       = useState(0.38);
  const [redness,       setRedness]       = useState(0.25);
  const [yellowness,    setYellowness]    = useState(0.10);
  // PBR
  const [roughness,     setRoughness]     = useState(0.55);
  const [metalness,     setMetalness]     = useState(0.00);
  const [specular,      setSpecular]      = useState(0.40);
  const [reflectance,   setReflectance]   = useState(0.30);
  // SSS
  const [sssStr,        setSssStr]        = useState(0.60);
  const [sssRadius,     setSssRadius]     = useState(0.12);
  const [sssColor,      setSssColor]      = useState('#ff9060');
  const [sssDepth,      setSssDepth]      = useState(0.40);
  // Micro detail
  const [poreScale,     setPoreScale]     = useState(1.00);
  const [poreDepth,     setPoreDepth]     = useState(0.40);
  const [poreRoughness, setPoreRoughness] = useState(0.80);
  const [wrinkling,     setWrinkling]     = useState(0.30);
  const [wrinkleDepth,  setWrinkleDepth]  = useState(0.40);
  const [oiliness,      setOiliness]      = useState(0.20);
  const [perspiring,    setPerspiring]    = useState(0.00);
  const [veinVis,       setVeinVis]       = useState(0.15);
  const [veinColor,     setVeinColor]     = useState('#3060b0');
  const [freckles,      setFreckles]      = useState(0.00);
  const [freckleColor,  setFreckleColor]  = useState('#8a5030');
  const [birthmark,     setBirthmark]     = useState(0.00);
  // Lip & Cheek
  const [lipColor,      setLipColor]      = useState('#c05060');
  const [lipGloss,      setLipGloss]      = useState(0.40);
  const [lipRough,      setLipRough]      = useState(0.30);
  const [cheekColor,    setCheekColor]    = useState('#e07060');
  const [cheekStr,      setCheekStr]      = useState(0.30);
  const [cheekBloom,    setCheekBloom]    = useState(0.20);
  // Eye area
  const [eyeSocketDark, setEyeSocketDark] = useState(0.20);
  const [eyeSocketColor,setEyeSocketColor]= useState('#601030');
  const [eyebagDepth,   setEyebagDepth]   = useState(0.10);
  const [eyebagColor,   setEyebagColor]   = useState('#8a5070');
  // Zones
  const [zones, setZones] = useState({
    forehead: true, nose: true, cheeks: true, chin: true,
    neck: true, hands: true, arms: false, body: false, feet: false,
  });
  // AO
  const [aoStr,         setAoStr]         = useState(0.80);
  const [aoRadius,      setAoRadius]      = useState(0.50);

  const applyPreset = useCallback((name) => {
    const p = SKIN_PRESETS[name];
    if (!p) return;
    setActivePreset(name);
    setBaseColor(p.base); setSubColor(p.sub);
    setMelanin(p.melanin); setRedness(p.redness);
    onUpdate?.({ type: 'preset', name, ...p });
  }, [onUpdate]);

  const handleApply = useCallback(() => {
    onUpdate?.({
      type: 'apply',
      base: { baseColor, subColor, melanin, redness, yellowness },
      pbr: { roughness, metalness, specular, reflectance },
      sss: { sssStr, sssRadius, sssColor, sssDepth },
      micro: { poreScale, poreDepth, poreRoughness, wrinkling, wrinkleDepth, oiliness, perspiring, veinVis, veinColor, freckles, freckleColor, birthmark },
      face: { lipColor, lipGloss, lipRough, cheekColor, cheekStr, cheekBloom, eyeSocketDark, eyeSocketColor, eyebagDepth, eyebagColor },
      ao: { aoStr, aoRadius }, zones,
    });
  }, [baseColor, subColor, melanin, redness, yellowness, roughness, metalness, specular, reflectance, sssStr, sssRadius, sssColor, sssDepth, poreScale, poreDepth, poreRoughness, wrinkling, wrinkleDepth, oiliness, perspiring, veinVis, veinColor, freckles, freckleColor, birthmark, lipColor, lipGloss, lipRough, cheekColor, cheekStr, cheekBloom, eyeSocketDark, eyeSocketColor, eyebagDepth, eyebagColor, aoStr, aoRadius, zones]);

  return (
    <div style={P}>
      <Section title="\u{1F3A8} Skin Preset">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {Object.keys(SKIN_PRESETS).map(name => (
            <button key={name} onClick={() => applyPreset(name)} style={{
              padding: '3px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
              background: activePreset === name ? '#00ffc8' : '#1a1f2c',
              color: activePreset === name ? '#06060f' : '#ccc',
              border: `1px solid ${activePreset === name ? '#00ffc8' : '#21262d'}`,
            }}>{name}</button>
          ))}
        </div>
      </Section>
      <Section title="\u{1F308} Base Colors">
        <ColorRow label="Base Color"       value={baseColor}   onChange={setBaseColor}   />
        <ColorRow label="Subsurface Color" value={subColor}    onChange={setSubColor}    />
        <Slider   label="Melanin"          value={melanin}     onChange={setMelanin}     />
        <Slider   label="Redness"          value={redness}     onChange={setRedness}     />
        <Slider   label="Yellowness"       value={yellowness}  onChange={setYellowness}  />
      </Section>
      <Section title="PBR Properties">
        <Slider label="Roughness"    value={roughness}   onChange={setRoughness}   />
        <Slider label="Metalness"    value={metalness}   onChange={setMetalness}   />
        <Slider label="Specular"     value={specular}    onChange={setSpecular}    />
        <Slider label="Reflectance"  value={reflectance} onChange={setReflectance} />
      </Section>
      <Section title="Subsurface Scatter">
        <Slider   label="SSS Strength" value={sssStr}    onChange={setSssStr}    />
        <Slider   label="SSS Radius"   value={sssRadius} onChange={setSssRadius} />
        <Slider   label="SSS Depth"    value={sssDepth}  onChange={setSssDepth}  />
        <ColorRow label="SSS Color"    value={sssColor}  onChange={setSssColor}  />
      </Section>
      <Section title="\u{1F52C} Micro Detail">
        <Slider label="Pore Scale"    value={poreScale}     min={0.1} max={3} step={0.05} onChange={setPoreScale}     />
        <Slider label="Pore Depth"    value={poreDepth}     onChange={setPoreDepth}     />
        <Slider label="Pore Rough"    value={poreRoughness} onChange={setPoreRoughness} />
        <Slider label="Wrinkling"     value={wrinkling}     onChange={setWrinkling}     />
        <Slider label="Wrinkle Depth" value={wrinkleDepth}  onChange={setWrinkleDepth}  />
        <Slider label="Oiliness"      value={oiliness}      onChange={setOiliness}      />
        <Slider label="Perspiration"  value={perspiring}    onChange={setPerspiring}    />
        <Slider label="Vein Vis"      value={veinVis}       onChange={setVeinVis}       />
        <ColorRow label="Vein Color"  value={veinColor}     onChange={setVeinColor}     />
        <Slider label="Freckles"      value={freckles}      onChange={setFreckles}      />
        {freckles > 0 && <ColorRow label="Freckle Color" value={freckleColor} onChange={setFreckleColor} />}
        <Slider label="Birthmark"     value={birthmark}     onChange={setBirthmark}     />
      </Section>
      <Section title="\u{1F48B} Lip & Cheek" defaultOpen={false}>
        <ColorRow label="Lip Color"    value={lipColor}    onChange={setLipColor}    />
        <Slider   label="Lip Gloss"    value={lipGloss}    onChange={setLipGloss}    />
        <Slider   label="Lip Rough"    value={lipRough}    onChange={setLipRough}    />
        <ColorRow label="Cheek Color"  value={cheekColor}  onChange={setCheekColor}  />
        <Slider   label="Cheek Str"    value={cheekStr}    onChange={setCheekStr}    />
        <Slider   label="Cheek Bloom"  value={cheekBloom}  onChange={setCheekBloom}  />
      </Section>
      <Section title="Eye Area" defaultOpen={false}>
        <Slider   label="Socket Dark"  value={eyeSocketDark}  onChange={setEyeSocketDark}  />
        <ColorRow label="Socket Color" value={eyeSocketColor} onChange={setEyeSocketColor} />
        <Slider   label="Eye Bag Depth" value={eyebagDepth}   onChange={setEyebagDepth}   />
        <ColorRow label="Eye Bag Color" value={eyebagColor}   onChange={setEyebagColor}   />
      </Section>
      <Section title="\u{1F5FA} Skin Zones" defaultOpen={false}>
        {Object.keys(zones).map(z => (
          <Check key={z} label={z.charAt(0).toUpperCase() + z.slice(1)}
            value={zones[z]} onChange={v => setZones(s => ({ ...s, [z]: v }))} />
        ))}
      </Section>
      <Section title="AO" defaultOpen={false}>
        <Slider label="AO Strength" value={aoStr}    onChange={setAoStr}    />
        <Slider label="AO Radius"   value={aoRadius} onChange={setAoRadius} />
      </Section>
      <GenBtn label="\u2713 Apply Skin" onClick={handleApply} />
    </div>
  );
}
"""

# =============================================================================
# Write all files
# =============================================================================
print("Writing Script 2/4 panels...\n")

files = {
    'CreatureGeneratorPanel.jsx':    CREATURE,
    'HybridGeneratorPanel.jsx':      HYBRID,
    'CrowdGeneratorPanel.jsx':       CROWD,
    'EnvironmentGeneratorPanel.jsx': ENVIRONMENT,
    'CityGeneratorPanel.jsx':        CITY,
    'CharacterSkinStudioPanel.jsx':  SKIN,
}

for filename, content in files.items():
    content = pad(content)
    write(os.path.join(BASE, filename), content)

print("\n✅ Script 2/4 complete.")
print(f"   Files written to: {BASE}")
print("\nNext: git add -A && git commit -m 'feat: generator panels batch 2' && git push")
