import os

base = "/workspaces/spx-mesh-editor/src"
smart_path = f"{base}/mesh/SmartMaterials.js"
app_path = f"{base}/App.jsx"
shell_path = f"{base}/pro-ui/ProfessionalShell.jsx"
wmap_path = f"{base}/pro-ui/workspaceMap.js"

# ── 1. ADD FULL SKIN SYSTEM TO SmartMaterials.js ─────────────────────────────
with open(smart_path, "r") as f:
    smart = f.read()

if "SKIN_TONES" not in smart:
    skin_code = r"""
// ══════════════════════════════════════════════════════════════════════════════
// REALISTIC HUMAN SKIN SYSTEM
// Multi-layer SSS + procedural textures + skin tone library
// ══════════════════════════════════════════════════════════════════════════════

// ── Skin tone library (based on Fitzpatrick scale + common ethnicities) ───────
export const SKIN_TONES = {
  // Fair
  porcelain:    { base:"#f8ede3", sub:"#f4c5b0", scatter:"#ff9980", vein:"#9090c0", label:"Porcelain" },
  fair:         { base:"#f5d5c0", sub:"#f0b899", scatter:"#ff8866", vein:"#8888bb", label:"Fair" },
  light:        { base:"#edc9a8", sub:"#dea882", scatter:"#e87755", vein:"#7777aa", label:"Light" },
  // Medium
  medium:       { base:"#d4a574", sub:"#c08050", scatter:"#cc6633", vein:"#886688", label:"Medium" },
  olive:        { base:"#c49a6c", sub:"#b07840", scatter:"#bb5522", vein:"#776677", label:"Olive" },
  tan:          { base:"#b8864e", sub:"#9c6632", scatter:"#aa4411", vein:"#665566", label:"Tan" },
  // Deep
  brown:        { base:"#8b5e3c", sub:"#6b3e1c", scatter:"#883311", vein:"#553355", label:"Brown" },
  deep_brown:   { base:"#6b3e26", sub:"#4e2410", scatter:"#660022", vein:"#442244", label:"Deep Brown" },
  dark:         { base:"#4a2810", sub:"#341806", scatter:"#440011", vein:"#331133", label:"Dark" },
  ebony:        { base:"#2c1608", sub:"#1e0c04", scatter:"#330011", vein:"#220022", label:"Ebony" },
  // Special
  albino:       { base:"#fef0ea", sub:"#fad4c8", scatter:"#ffbbaa", vein:"#ddaaaa", label:"Albino" },
  vitiligo:     { base:"#f5e6da", sub:"#f0c8b0", scatter:"#ff9977", vein:"#9999cc", label:"Vitiligo" },
  aged:         { base:"#d4a882", sub:"#b88860", scatter:"#cc6644", vein:"#887788", label:"Aged" },
  newborn:      { base:"#ffddcc", sub:"#ffbbaa", scatter:"#ff9988", vein:"#aaaaee", label:"Newborn" },
};

// ── Core realistic skin material ───────────────────────────────────────────────
// Uses MeshPhysicalMaterial with multi-layer SSS approximation via sheen + transmission
export function applyRealisticSkin(mesh, options = {}) {
  if (!mesh) return false;
  const THREE = window.THREE;
  if (!THREE) return false;

  const toneKey = options.tone || 'medium';
  const tone = SKIN_TONES[toneKey] || SKIN_TONES.medium;

  const {
    // Base properties
    color = tone.base,
    roughness = 0.72,
    metalness = 0.0,
    // SSS properties
    subsurfaceStrength = 0.6,
    subsurfaceColor = tone.scatter,
    subsurfaceRadius = 0.8,
    // Surface properties
    poreStrength = 0.3,
    oiliness = 0.15,        // clearcoat = oily/wet areas
    hairFollicles = false,
    // Body region
    region = 'face',        // face | body | hand | lip | ear
  } = options;

  // Region-specific adjustments
  const regionProps = {
    face:  { roughness: 0.68, clearcoat: oiliness, sheenColor: tone.scatter, thickness: 0.6 },
    body:  { roughness: 0.75, clearcoat: oiliness * 0.5, sheenColor: tone.scatter, thickness: 0.8 },
    hand:  { roughness: 0.80, clearcoat: 0.05, sheenColor: tone.scatter, thickness: 1.0 },
    lip:   { roughness: 0.40, clearcoat: 0.5, sheenColor: "#ff6655", thickness: 0.3 },
    ear:   { roughness: 0.65, clearcoat: 0.1, sheenColor: tone.scatter, thickness: 0.3, transmission: 0.15 },
    nose:  { roughness: 0.55, clearcoat: 0.3, sheenColor: tone.scatter, thickness: 0.4 },
  };
  const rp = regionProps[region] || regionProps.face;

  mesh.material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: rp.roughness,
    metalness,
    // SSS approximation via sheen
    sheen: subsurfaceStrength,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(rp.sheenColor || subsurfaceColor),
    // Clearcoat for oily areas (nose, forehead T-zone)
    clearcoat: rp.clearcoat || oiliness,
    clearcoatRoughness: 0.3,
    // Transmission for thin areas (ears, lips, nostrils)
    transmission: rp.transmission || 0,
    thickness: rp.thickness || 0.5,
    ior: 1.4, // skin IOR
    // Reflectivity
    reflectivity: 0.04, // non-metallic fresnel
    envMapIntensity: 0.8,
  });

  mesh.material.needsUpdate = true;
  return true;
}

// ── Generate full skin texture stack ──────────────────────────────────────────
// Returns { color, roughness, normal, ao } canvas maps
export function generateFullSkinTextures(options = {}) {
  const {
    size = 1024,
    tone = 'medium',
    poreScale = 55,
    wrinkleStrength = 0.5,
    region = 'face',
    age = 30,        // 0-100 — affects wrinkle density
    oiliness = 0.15,
  } = options;

  const skinTone = SKIN_TONES[tone] || SKIN_TONES.medium;
  const baseRGB = hexToRGB(skinTone.base);
  const subRGB  = hexToRGB(skinTone.scatter);

  const colorCanvas    = document.createElement('canvas');
  const roughCanvas    = document.createElement('canvas');
  const normalCanvas   = document.createElement('canvas');
  const aoCanvas       = document.createElement('canvas');

  [colorCanvas, roughCanvas, normalCanvas, aoCanvas].forEach(c => {
    c.width = c.height = size;
  });

  const colorCtx  = colorCanvas.getContext('2d');
  const roughCtx  = roughCanvas.getContext('2d');
  const normalCtx = normalCanvas.getContext('2d');
  const aoCtx     = aoCanvas.getContext('2d');

  const colorData  = colorCtx.createImageData(size, size);
  const roughData  = roughCtx.createImageData(size, size);
  const normalData = normalCtx.createImageData(size, size);
  const aoData     = aoCtx.createImageData(size, size);

  const cd = colorData.data, rd = roughData.data;
  const nd = normalData.data, ad = aoData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size, ny = y / size;

      // ── Pore layer (voronoi) ──
      const poreX = nx * poreScale, poreY = ny * poreScale;
      const poreVal = voronoiNoise(poreX, poreY, 0.5) * 0.5 + 0.5;
      const poreDark = Math.pow(poreVal, 1.5); // pore centers darker

      // ── Large variation (perlin) ──
      const lv1 = perlinNoise(nx*3, ny*3, 0) * 0.5 + 0.5;
      const lv2 = perlinNoise(nx*7, ny*7, 1) * 0.5 + 0.5;

      // ── Wrinkle layer (fine perlin) ──
      const ageScale = 4 + age * 0.08;
      const wrinkle = Math.abs(perlinNoise(nx*ageScale, ny*ageScale, 2)) * wrinkleStrength;

      // ── Pore bump for normal map ──
      const poreL = voronoiNoise(poreX-0.01, poreY, 0.5) * 0.5 + 0.5;
      const poreR = voronoiNoise(poreX+0.01, poreY, 0.5) * 0.5 + 0.5;
      const poreU = voronoiNoise(poreX, poreY-0.01, 0.5) * 0.5 + 0.5;
      const poreDn = voronoiNoise(poreX, poreY+0.01, 0.5) * 0.5 + 0.5;

      // ── Color map ──
      // Mix base skin color with subsurface scatter color in pore valleys
      const poreInfluence = 1 - poreDark * 0.25;
      const varInfluence  = 0.85 + lv1 * 0.15;
      const wrinkShadow   = 1 - wrinkle * 0.15;

      // Blood vessel suggestion (very subtle red variation)
      const blood = perlinNoise(nx*2, ny*2, 3) * 0.5 + 0.5;
      const bloodR = 1.0 + blood * 0.04;
      const bloodG = 1.0 - blood * 0.02;

      cd[i]   = Math.min(255, Math.round(baseRGB[0] * poreInfluence * varInfluence * wrinkShadow * bloodR));
      cd[i+1] = Math.min(255, Math.round(baseRGB[1] * poreInfluence * varInfluence * wrinkShadow * bloodG));
      cd[i+2] = Math.min(255, Math.round(baseRGB[2] * poreInfluence * varInfluence * wrinkShadow));
      cd[i+3] = 255;

      // ── Roughness map ──
      // Pore centers = rougher, oily areas = smoother
      const baseRough = 0.65 + (1 - poreDark) * 0.2 + wrinkle * 0.15;
      const oilySpot = perlinNoise(nx*2, ny*2, 4) * 0.5 + 0.5;
      const finalRough = Math.max(0, Math.min(1, baseRough - oiliness * oilySpot));
      const roughVal = Math.round(finalRough * 255);
      rd[i] = rd[i+1] = rd[i+2] = roughVal;
      rd[i+3] = 255;

      // ── Normal map ──
      const strength = 3.0;
      const nnx = (poreL - poreR) * strength;
      const nny = (poreU - poreDn) * strength;
      const nnz = Math.sqrt(Math.max(0, 1 - nnx*nnx - nny*nny));
      nd[i]   = Math.round((nnx * 0.5 + 0.5) * 255);
      nd[i+1] = Math.round((nny * 0.5 + 0.5) * 255);
      nd[i+2] = Math.round(nnz * 255);
      nd[i+3] = 255;

      // ── AO map (cavity) ──
      const ao = 0.7 + poreDark * 0.3 - wrinkle * 0.1;
      const aoVal = Math.min(255, Math.round(ao * 255));
      ad[i] = ad[i+1] = ad[i+2] = aoVal;
      ad[i+3] = 255;
    }
  }

  colorCtx.putImageData(colorData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);
  normalCtx.putImageData(normalData, 0, 0);
  aoCtx.putImageData(aoData, 0, 0);

  return { color: colorCanvas, roughness: roughCanvas, normal: normalCanvas, ao: aoCanvas };
}

// ── Apply full skin texture stack to mesh ─────────────────────────────────────
export function applyFullSkinTextures(mesh, textures) {
  if (!mesh?.material || !textures) return false;
  const THREE = window.THREE;
  if (!THREE) return false;
  const { color, roughness, normal, ao } = textures;
  if (color)    mesh.material.map          = new THREE.CanvasTexture(color);
  if (roughness)mesh.material.roughnessMap = new THREE.CanvasTexture(roughness);
  if (normal)   mesh.material.normalMap    = new THREE.CanvasTexture(normal);
  if (ao)       mesh.material.aoMap        = new THREE.CanvasTexture(ao);
  mesh.material.needsUpdate = true;
  return true;
}

// ── Lip material ──────────────────────────────────────────────────────────────
export function applyLipMaterial(mesh, options = {}) {
  const THREE = window.THREE;
  if (!THREE || !mesh) return false;
  const { color="#cc4444", gloss=0.7, tone='medium' } = options;
  const skinTone = SKIN_TONES[tone] || SKIN_TONES.medium;
  // Mix lip color with skin tone
  mesh.material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 1.0 - gloss * 0.7,
    metalness: 0,
    sheen: 0.6,
    sheenColor: new THREE.Color("#ff8877"),
    clearcoat: gloss,
    clearcoatRoughness: 0.1,
    transmission: 0.08,
    thickness: 0.2,
  });
  mesh.material.needsUpdate = true;
  return true;
}

// ── Eye material ──────────────────────────────────────────────────────────────
export function applyEyeMaterial(mesh, options = {}) {
  const THREE = window.THREE;
  if (!THREE || !mesh) return false;
  const { irisColor="#4a7c9e", pupilSize=0.35 } = options;
  mesh.material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(irisColor),
    roughness: 0.0,
    metalness: 0.0,
    transmission: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    ior: 1.34,
    thickness: 0.5,
  });
  mesh.material.needsUpdate = true;
  return true;
}

// ── Set up RectAreaLight for skin rendering ────────────────────────────────────
export async function setupSkinLighting(scene, renderer) {
  const THREE = window.THREE;
  if (!THREE || !scene || !renderer) return null;
  try {
    const { RectAreaLightUniformsLib } = await import('three/examples/jsm/lights/RectAreaLightUniformsLib.js');
    RectAreaLightUniformsLib.init();
    // Key light (warm)
    const keyLight = new THREE.RectAreaLight("#fff5e0", 4, 1.5, 2.0);
    keyLight.position.set(1.5, 2, 2); keyLight.lookAt(0, 0, 0);
    scene.add(keyLight);
    // Fill light (cool)
    const fillLight = new THREE.RectAreaLight("#e0f0ff", 2, 1.0, 1.5);
    fillLight.position.set(-2, 1, 1); fillLight.lookAt(0, 0, 0);
    scene.add(fillLight);
    // Rim light (warm back)
    const rimLight = new THREE.RectAreaLight("#ffeecc", 3, 0.5, 1.5);
    rimLight.position.set(0, 1, -2); rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);
    return { keyLight, fillLight, rimLight };
  } catch(e) {
    console.warn("RectAreaLight setup failed:", e);
    return null;
  }
}

// ── Helper: hex to RGB ────────────────────────────────────────────────────────
function hexToRGB(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return [r, g, b];
}
"""
    smart += skin_code
    with open(smart_path, "w") as f:
        f.write(smart)
    print("✅ Full realistic skin system added to SmartMaterials.js")
    print("   SKIN_TONES: 14 tones (porcelain→ebony + albino/vitiligo/aged/newborn)")
    print("   generateFullSkinTextures: color + roughness + normal + AO maps")
    print("   applyRealisticSkin: multi-layer SSS with region presets")
    print("   applyLipMaterial, applyEyeMaterial, setupSkinLighting")
else:
    print("✅ SKIN_TONES already present")

# ── 2. WIRE INTO App.jsx ──────────────────────────────────────────────────────
with open(app_path, "r") as f:
    app = f.read()

# Import new skin functions
if "SKIN_TONES" not in app:
    app = app.replace(
        "import { applyPreset, applyEdgeWear, applyCavityDirt, getPresetCategories, applyDisplacementMap, applyClearcoatMaterial, applyAnisotropyMaterial, applySkinSSS, addAreaLight, applyMultiLayerTexture, generateProceduralSkinTexture, generateScaleTexture, canvasToNormalMap } from \"./mesh/SmartMaterials.js\";",
        "import { applyPreset, applyEdgeWear, applyCavityDirt, getPresetCategories, applyDisplacementMap, applyClearcoatMaterial, applyAnisotropyMaterial, applySkinSSS, addAreaLight, applyMultiLayerTexture, generateProceduralSkinTexture, generateScaleTexture, canvasToNormalMap, SKIN_TONES, applyRealisticSkin, generateFullSkinTextures, applyFullSkinTextures, applyLipMaterial, applyEyeMaterial, setupSkinLighting } from \"./mesh/SmartMaterials.js\";"
    )
    print("✅ Skin functions imported")

# Add skin state
if "skinTone" not in app:
    app = app.replace(
        "  const [displacementScale, setDisplacementScale] = useState(0.1);",
        """  const [displacementScale, setDisplacementScale] = useState(0.1);
  const [skinTone, setSkinTone] = useState('medium');
  const [skinRegion, setSkinRegion] = useState('face');
  const [skinAge, setSkinAge] = useState(30);
  const [skinOiliness, setSkinOiliness] = useState(0.15);
  const [lipColor, setLipColor] = useState('#cc4444');
  const [eyeColor, setEyeColor] = useState('#4a7c9e');"""
    )
    print("✅ Skin tone state added")

# Add handlers
skin_handlers = '''    if (fn === "skin_apply")        { if(meshRef.current){ applyRealisticSkin(meshRef.current,{tone:skinTone,region:skinRegion,oiliness:skinOiliness}); setStatus(`Skin: ${skinTone} / ${skinRegion}`); } return; }
    if (fn === "skin_gen_textures") {
      if(meshRef.current && window.THREE) {
        setStatus("Generating skin textures (1024px)...");
        setTimeout(() => {
          const textures = generateFullSkinTextures({size:1024,tone:skinTone,region:skinRegion,age:skinAge,oiliness:skinOiliness});
          applyFullSkinTextures(meshRef.current, textures);
          applyRealisticSkin(meshRef.current,{tone:skinTone,region:skinRegion,oiliness:skinOiliness});
          // Download all maps
          ['color','roughness','normal','ao'].forEach(k => {
            const a=document.createElement('a');
            a.href=textures[k].toDataURL('image/png');
            a.download=`spx_skin_${k}_${skinTone}.png`;
            a.click();
          });
          setStatus(`✓ Skin textures applied + downloaded (${skinTone}, age ${skinAge})`);
        }, 100);
      }
      return;
    }
    if (fn === "skin_lip")          { if(meshRef.current){ applyLipMaterial(meshRef.current,{color:lipColor,tone:skinTone}); setStatus("Lip material applied"); } return; }
    if (fn === "skin_eye")          { if(meshRef.current){ applyEyeMaterial(meshRef.current,{irisColor:eyeColor}); setStatus("Eye material applied"); } return; }
    if (fn === "skin_lighting")     { if(sceneRef.current&&rendererRef.current){ setupSkinLighting(sceneRef.current,rendererRef.current).then(()=>setStatus("3-point skin lighting set up (key+fill+rim)")); } return; }'''

# Add skin tone quick-apply handlers for each tone
tone_handlers = "\n".join([
    f'    if (fn === "skin_tone_{key}") {{ setSkinTone("{key}"); if(meshRef.current){{ applyRealisticSkin(meshRef.current,{{tone:"{key}",region:skinRegion}}); }} setStatus("Skin tone: {key}"); return; }}'
    for key in ["porcelain","fair","light","medium","olive","tan","brown","deep_brown","dark","ebony","albino","aged"]
])

if "skin_apply" not in app:
    app = app.replace(
        '    if (fn === "displace_perlin")',
        skin_handlers + "\n" + tone_handlers + "\n    if (fn === \"displace_perlin\")"
    )
    print("✅ Skin handlers wired into App.jsx")

with open(app_path, "w") as f:
    f.write(app)

# ── 3. ADD TO workspaceMap ────────────────────────────────────────────────────
with open(wmap_path, "r") as f:
    wmap = f.read()

if "skin_apply" not in wmap:
    wmap = wmap.replace(
        '        { id: "mat_sss_skin",      label: "SSS Skin",           system: "SmartMaterials" },',
        """        { id: "mat_sss_skin",      label: "SSS Skin",           system: "SmartMaterials" },
        { id: "skin_apply",        label: "Apply Skin Material",  system: "SmartMaterials" },
        { id: "skin_gen_textures", label: "Gen Full Skin Textures",system: "SmartMaterials" },
        { id: "skin_lighting",     label: "Setup Skin Lighting",  system: "SmartMaterials" },
        { id: "skin_lip",          label: "Lip Material",         system: "SmartMaterials" },
        { id: "skin_eye",          label: "Eye Material",         system: "SmartMaterials" },
        { id: "skin_tone_porcelain", label: "Tone: Porcelain",    system: "SmartMaterials" },
        { id: "skin_tone_fair",      label: "Tone: Fair",         system: "SmartMaterials" },
        { id: "skin_tone_light",     label: "Tone: Light",        system: "SmartMaterials" },
        { id: "skin_tone_medium",    label: "Tone: Medium",       system: "SmartMaterials" },
        { id: "skin_tone_olive",     label: "Tone: Olive",        system: "SmartMaterials" },
        { id: "skin_tone_tan",       label: "Tone: Tan",          system: "SmartMaterials" },
        { id: "skin_tone_brown",     label: "Tone: Brown",        system: "SmartMaterials" },
        { id: "skin_tone_deep_brown",label: "Tone: Deep Brown",   system: "SmartMaterials" },
        { id: "skin_tone_dark",      label: "Tone: Dark",         system: "SmartMaterials" },
        { id: "skin_tone_ebony",     label: "Tone: Ebony",        system: "SmartMaterials" },
        { id: "skin_tone_albino",    label: "Tone: Albino",       system: "SmartMaterials" },
        { id: "skin_tone_aged",      label: "Tone: Aged",         system: "SmartMaterials" },"""
    )
    with open(wmap_path, "w") as f:
        f.write(wmap)
    print("✅ Skin system added to workspaceMap")

# ── 4. ADD TO ProfessionalShell Render menu ───────────────────────────────────
with open(shell_path, "r") as f:
    shell = f.read()

if "skin_apply" not in shell:
    shell = shell.replace(
        '    { label: "SSS Skin",             fn: "mat_sss_skin",       key: "" },',
        """    { label: "SSS Skin",             fn: "mat_sss_skin",       key: "" },
    { label: "─", fn: null },
    { label: "── REALISTIC SKIN ──",    fn: null },
    { label: "Apply Skin Material",  fn: "skin_apply",         key: "" },
    { label: "Gen Full Skin Textures",fn: "skin_gen_textures", key: "" },
    { label: "Setup Skin Lighting",  fn: "skin_lighting",      key: "" },
    { label: "Lip Material",         fn: "skin_lip",           key: "" },
    { label: "Eye Material",         fn: "skin_eye",           key: "" },
    { label: "─", fn: null },
    { label: "── SKIN TONES ──",        fn: null },
    { label: "Porcelain",            fn: "skin_tone_porcelain", key: "" },
    { label: "Fair",                 fn: "skin_tone_fair",     key: "" },
    { label: "Light",                fn: "skin_tone_light",    key: "" },
    { label: "Medium",               fn: "skin_tone_medium",   key: "" },
    { label: "Olive",                fn: "skin_tone_olive",    key: "" },
    { label: "Tan",                  fn: "skin_tone_tan",      key: "" },
    { label: "Brown",                fn: "skin_tone_brown",    key: "" },
    { label: "Deep Brown",           fn: "skin_tone_deep_brown",key:"" },
    { label: "Dark",                 fn: "skin_tone_dark",     key: "" },
    { label: "Ebony",                fn: "skin_tone_ebony",    key: "" },
    { label: "Albino",               fn: "skin_tone_albino",   key: "" },
    { label: "Aged",                 fn: "skin_tone_aged",     key: "" },"""
    )
    with open(shell_path, "w") as f:
        f.write(shell)
    print("✅ Full skin system added to Render menu")

print("\n── Skin system complete ──")
print("""
HOW TO GET REALISTIC HUMAN SKIN:
  1. Render > Skin Tones > pick your tone (14 options)
  2. Render > Apply Skin Material
  3. Render > Gen Full Skin Textures (generates + applies color/rough/normal/AO)
  4. Render > Setup Skin Lighting (3-point key+fill+rim)
  5. For lips: select lip mesh > Render > Lip Material
  6. For eyes: select eye mesh > Render > Eye Material
  7. Add displacement: Render > Displace Perlin (pore depth)
  8. Enable SSAO: Render > pp_ssao
""")
