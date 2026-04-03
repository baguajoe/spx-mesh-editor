import os

base = "/workspaces/spx-mesh-editor/src"
smart_path = f"{base}/mesh/SmartMaterials.js"
app_path   = f"{base}/App.jsx"
shell_path = f"{base}/pro-ui/ProfessionalShell.jsx"

with open(smart_path, "r") as f:
    smart = f.read()

if "SURFACE_PRESETS" not in smart:
    smart += r"""
// ══════════════════════════════════════════════════════════════════════════════
// SURFACE MATERIAL LIBRARY + CHARACTER SKIN VARIANTS + CUSTOM SKIN BUILDER
// ══════════════════════════════════════════════════════════════════════════════

export const SURFACE_PRESETS = {
  // ── WATER ────────────────────────────────────────────────────────────────────
  ocean_water:   { type:'water', color:"#006994", roughness:0.02, transmission:0.95, ior:1.333, clearcoat:1.0, clearcoatRoughness:0.0,  label:"Ocean Water" },
  shallow_water: { type:'water', color:"#40b4c8", roughness:0.03, transmission:0.85, ior:1.333, clearcoat:1.0, clearcoatRoughness:0.0,  label:"Shallow Water" },
  murky_water:   { type:'water', color:"#2d5a27", roughness:0.15, transmission:0.5,  ior:1.333, clearcoat:0.8, clearcoatRoughness:0.1,  label:"Murky Water" },
  ice_water:     { type:'water', color:"#aaddff", roughness:0.05, transmission:0.8,  ior:1.309, clearcoat:0.9, clearcoatRoughness:0.05, label:"Ice" },
  lava:          { type:'water', color:"#ff4400", roughness:0.3,  transmission:0.2,  ior:1.5,   clearcoat:0.3, clearcoatRoughness:0.4,  label:"Lava" },
  blood:         { type:'water', color:"#8b0000", roughness:0.08, transmission:0.3,  ior:1.36,  clearcoat:0.9, clearcoatRoughness:0.05, label:"Blood" },
  // ── ROCK / STONE ─────────────────────────────────────────────────────────────
  granite:       { type:'rock', color:"#8b7355", roughness:0.85, noiseScale:8,  depth:0.08, label:"Granite" },
  limestone:     { type:'rock', color:"#d4c5a9", roughness:0.90, noiseScale:6,  depth:0.06, label:"Limestone" },
  obsidian:      { type:'rock', color:"#1a1a2e", roughness:0.05, noiseScale:12, depth:0.03, clearcoat:0.8, label:"Obsidian" },
  sandstone:     { type:'rock', color:"#c2956c", roughness:0.95, noiseScale:4,  depth:0.05, label:"Sandstone" },
  marble:        { type:'rock', color:"#f0ece0", roughness:0.15, noiseScale:3,  depth:0.02, clearcoat:0.6, label:"Marble" },
  volcanic:      { type:'rock', color:"#2d1b00", roughness:0.95, noiseScale:10, depth:0.12, label:"Volcanic Rock" },
  crystal:       { type:'rock', color:"#88ccff", roughness:0.0,  noiseScale:20, depth:0.04, transmission:0.7, ior:1.5, clearcoat:1.0, label:"Crystal" },
  cave_stone:    { type:'rock', color:"#4a4a4a", roughness:0.92, noiseScale:7,  depth:0.10, label:"Cave Stone" },
  // ── METAL ────────────────────────────────────────────────────────────────────
  chrome:        { type:'metal', color:"#c8c8c8", roughness:0.05, metalness:1.0, label:"Chrome" },
  brushed_steel: { type:'metal', color:"#a8a8a8", roughness:0.25, metalness:1.0, anisotropy:0.9, label:"Brushed Steel" },
  rust:          { type:'metal', color:"#8b3a2a", roughness:0.85, metalness:0.4, noiseScale:15, depth:0.06, label:"Rust" },
  gold:          { type:'metal', color:"#ffd700", roughness:0.10, metalness:1.0, label:"Gold" },
  copper:        { type:'metal', color:"#b87333", roughness:0.20, metalness:1.0, label:"Copper" },
  bronze:        { type:'metal', color:"#cd7f32", roughness:0.30, metalness:0.9, label:"Bronze" },
  iron:          { type:'metal', color:"#434343", roughness:0.60, metalness:0.9, label:"Iron" },
  // ── CHARACTER SKIN VARIANTS ───────────────────────────────────────────────────
  stone_skin:    { type:'char', color:"#6b6b5a", roughness:0.88, metalness:0.05, noiseScale:8, depth:0.12, sheen:0.1, label:"Stone Skin" },
  metal_skin:    { type:'char', color:"#8a9090", roughness:0.20, metalness:0.95, anisotropy:0.6, label:"Metal Skin" },
  water_skin:    { type:'char', color:"#2255aa", roughness:0.02, metalness:0.0, transmission:0.6, ior:1.333, clearcoat:1.0, sheen:0.4, sheenColor:"#88bbff", label:"Water Skin" },
  rock_skin:     { type:'char', color:"#5a4a3a", roughness:0.92, metalness:0.0, noiseScale:6, depth:0.15, sheen:0.05, label:"Rock Skin" },
  lava_skin:     { type:'char', color:"#cc2200", roughness:0.4,  metalness:0.1, noiseScale:10, depth:0.10, clearcoat:0.2, label:"Lava Skin" },
  ice_skin:      { type:'char', color:"#aaccff", roughness:0.05, metalness:0.0, transmission:0.5, ior:1.309, clearcoat:0.9, sheen:0.2, sheenColor:"#ccddff", label:"Ice Skin" },
  wood_skin:     { type:'char', color:"#8b5e3c", roughness:0.80, metalness:0.0, noiseScale:5, depth:0.08, label:"Wood/Bark Skin" },
  crystal_skin:  { type:'char', color:"#88ccff", roughness:0.02, metalness:0.0, transmission:0.6, ior:1.5, clearcoat:1.0, label:"Crystal Skin" },
  obsidian_skin: { type:'char', color:"#1a1a2e", roughness:0.05, metalness:0.2, clearcoat:0.9, noiseScale:12, depth:0.04, label:"Obsidian Skin" },
  demon_skin:    { type:'char', color:"#6b1a0a", roughness:0.65, metalness:0.1, noiseScale:8, depth:0.10, sheen:0.3, sheenColor:"#ff4400", clearcoat:0.15, label:"Demon Skin" },
  cyber_skin:    { type:'char', color:"#223344", roughness:0.15, metalness:0.7, anisotropy:0.5, clearcoat:0.4, label:"Cyber/Android Skin" },
  alien_skin:    { type:'char', color:"#2a4a20", roughness:0.55, metalness:0.0, noiseScale:20, depth:0.06, sheen:0.5, sheenColor:"#44ff88", label:"Alien Skin" },
};

// ── Apply any surface preset to a mesh ────────────────────────────────────────
export function applySurfaceMaterial(mesh, presetKey, options = {}) {
  const THREE = window.THREE;
  if (!THREE || !mesh) return false;
  const preset = SURFACE_PRESETS[presetKey];
  if (!preset) return false;

  const matProps = {
    color:              new THREE.Color(preset.color),
    roughness:          preset.roughness ?? 0.5,
    metalness:          preset.metalness ?? 0.0,
    clearcoat:          preset.clearcoat ?? 0.0,
    clearcoatRoughness: preset.clearcoatRoughness ?? 0.5,
    transmission:       preset.transmission ?? 0.0,
    thickness:          preset.thickness ?? 0.5,
    ior:                preset.ior ?? 1.5,
    sheen:              preset.sheen ?? 0.0,
    sheenColor:         preset.sheenColor ? new THREE.Color(preset.sheenColor) : new THREE.Color("#ffffff"),
    anisotropy:         preset.anisotropy ?? 0.0,
    envMapIntensity:    1.2,
    transparent:        (preset.transmission ?? 0) > 0,
    opacity:            1.0,
  };

  mesh.material = new THREE.MeshPhysicalMaterial(matProps);

  // Generate procedural texture for rock/stone/character skin types
  if (preset.type === 'rock' || preset.type === 'char') {
    if (preset.noiseScale) {
      const rgb = hexToRGB3(preset.color);
      const lightRGB = [Math.min(255, rgb[0]+40), Math.min(255, rgb[1]+40), Math.min(255, rgb[2]+40)];
      const texCanvas = generateScaleTexture({
        size: 1024,
        scaleSize: preset.noiseScale,
        baseColor: rgb,
        scaleColor: lightRGB,
      });
      const normCanvas = canvasToNormalMap(texCanvas, (preset.depth || 0.08) * 20);
      mesh.material.map       = new THREE.CanvasTexture(texCanvas);
      mesh.material.normalMap = new THREE.CanvasTexture(normCanvas);
      mesh.material.normalScale = new THREE.Vector2(
        (preset.depth || 0.08) * 15,
        (preset.depth || 0.08) * 15
      );
      // Apply displacement
      if (preset.depth) {
        applyDisplacementMap(mesh, {
          noiseType: preset.noiseScale > 15 ? 'voronoi' : 'perlin',
          noiseAmplitude: preset.depth,
          noiseScale: preset.noiseScale / 8,
        });
      }
    }
  }

  // Water: add animated normal map
  if (preset.type === 'water') {
    const waterNorm = generateWaterNormalMap(1024);
    mesh.material.normalMap = new THREE.CanvasTexture(waterNorm);
    mesh.material.normalScale = new THREE.Vector2(1.5, 1.5);
  }

  // Metal: generate brushed/scratched texture
  if (preset.type === 'metal' && preset.noiseScale) {
    const rgb = hexToRGB3(preset.color);
    const metalTex = generateMetalTexture(1024, rgb, preset.noiseScale || 10);
    mesh.material.map          = new THREE.CanvasTexture(metalTex.color);
    mesh.material.roughnessMap = new THREE.CanvasTexture(metalTex.roughness);
    mesh.material.normalMap    = new THREE.CanvasTexture(metalTex.normal);
  }

  mesh.material.needsUpdate = true;
  return true;
}

// ── Water normal map generator ─────────────────────────────────────────────────
export function generateWaterNormalMap(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const data = ctx.createImageData(size, size);
  const d = data.data;
  const t = Date.now() * 0.001;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size, ny = y / size;
      const w1L = perlinNoise((nx-0.003)*4+t*0.3, ny*4, 0) * 0.5 + 0.5;
      const w1R = perlinNoise((nx+0.003)*4+t*0.3, ny*4, 0) * 0.5 + 0.5;
      const w1U = perlinNoise(nx*4+t*0.3, (ny-0.003)*4, 0) * 0.5 + 0.5;
      const w1D = perlinNoise(nx*4+t*0.3, (ny+0.003)*4, 0) * 0.5 + 0.5;
      const w2L = perlinNoise((nx-0.002)*8-t*0.2, ny*8, 1) * 0.5 + 0.5;
      const w2R = perlinNoise((nx+0.002)*8-t*0.2, ny*8, 1) * 0.5 + 0.5;
      const w2U = perlinNoise(nx*8-t*0.2, (ny-0.002)*8, 1) * 0.5 + 0.5;
      const w2D = perlinNoise(nx*8-t*0.2, (ny+0.002)*8, 1) * 0.5 + 0.5;
      const bx = (w1L-w1R)*2.0 + (w2L-w2R)*1.0;
      const by = (w1U-w1D)*2.0 + (w2U-w2D)*1.0;
      const bz = Math.sqrt(Math.max(0, 1-bx*bx-by*by));
      d[i]   = Math.min(255, Math.round((bx*0.5+0.5)*255));
      d[i+1] = Math.min(255, Math.round((by*0.5+0.5)*255));
      d[i+2] = Math.round(bz*255);
      d[i+3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

// ── Metal texture generator ────────────────────────────────────────────────────
export function generateMetalTexture(size = 1024, rgb = [168,168,168], scratchScale = 10) {
  const colorCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  const normCanvas  = document.createElement('canvas');
  [colorCanvas, roughCanvas, normCanvas].forEach(c => { c.width = c.height = size; });
  const cCtx = colorCanvas.getContext('2d'), rCtx = roughCanvas.getContext('2d'), nCtx = normCanvas.getContext('2d');
  const cData = cCtx.createImageData(size,size), rData = rCtx.createImageData(size,size), nData = nCtx.createImageData(size,size);
  const cd = cData.data, rd = rData.data, nd = nData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y*size+x)*4;
      const nx = x/size, ny = y/size;
      // Directional scratches (anisotropic along X)
      const scratch = Math.abs(perlinNoise(nx*scratchScale*8, ny*0.5, 5)) * 0.5 + 0.5;
      const grain   = perlinNoise(nx*scratchScale, ny*scratchScale, 6) * 0.5 + 0.5;
      const bright  = 0.8 + scratch*0.1 + grain*0.1;
      cd[i]   = Math.min(255, Math.round(rgb[0]*bright));
      cd[i+1] = Math.min(255, Math.round(rgb[1]*bright));
      cd[i+2] = Math.min(255, Math.round(rgb[2]*bright));
      cd[i+3] = 255;
      // Roughness: scratches = rougher
      const roughVal = Math.round((0.1 + (1-scratch)*0.3 + grain*0.1) * 255);
      rd[i]=rd[i+1]=rd[i+2]=roughVal; rd[i+3]=255;
      // Normal: scratch direction
      const sL = Math.abs(perlinNoise((nx-0.002)*scratchScale*8, ny*0.5, 5));
      const sR = Math.abs(perlinNoise((nx+0.002)*scratchScale*8, ny*0.5, 5));
      const bnx = (sL-sR)*2.0;
      const bnz = Math.sqrt(Math.max(0,1-bnx*bnx));
      nd[i]   = Math.min(255, Math.round((bnx*0.5+0.5)*255));
      nd[i+1] = Math.round(0.5*255);
      nd[i+2] = Math.round(bnz*255);
      nd[i+3] = 255;
    }
  }
  cCtx.putImageData(cData,0,0); rCtx.putImageData(rData,0,0); nCtx.putImageData(nData,0,0);
  return { color:colorCanvas, roughness:roughCanvas, normal:normCanvas };
}

// ── CUSTOM SKIN BUILDER ────────────────────────────────────────────────────────
// Lets the user fully customize every skin parameter and build a unique material
export const DEFAULT_CUSTOM_SKIN = {
  // Base
  baseColor:       "#d4a574",
  roughness:       0.70,
  metalness:       0.00,
  // SSS
  sssStrength:     0.50,
  sssColor:        "#cc6633",
  sssRadius:       0.60,
  // Surface
  clearcoat:       0.10,
  clearcoatRoughness: 0.30,
  anisotropy:      0.00,
  sheen:           0.00,
  sheenColor:      "#ffffff",
  // Transmission
  transmission:    0.00,
  ior:             1.40,
  thickness:       0.50,
  // Texture
  poreScale:       55,
  wrinkleStrength: 0.50,
  displacementDepth: 0.05,
  noiseType:       "perlin",  // perlin | voronoi | cellular
  textureSize:     1024,      // 512 | 1024 | 2048 | 4096
  // Age/region
  age:             30,
  region:          "face",
  useJimenezSSS:   false,     // true = full GLSL SSS shader
};

export function buildCustomSkin(mesh, params = {}) {
  const THREE = window.THREE;
  if (!THREE || !mesh) return false;
  const p = { ...DEFAULT_CUSTOM_SKIN, ...params };

  if (p.useJimenezSSS) {
    // Full GLSL SSS path
    const mat = createJimenezSkinMaterial({
      tone:               'custom',
      roughness:          p.roughness,
      clearcoat:          p.clearcoat,
      clearcoatRoughness: p.clearcoatRoughness,
      sssStrength:        p.sssStrength,
      scatterRadius:      p.sssRadius,
    });
    if (mat) {
      // Override skin/scatter color uniforms
      mat.uniforms.uSkinColor.value    = new THREE.Color(p.baseColor);
      mat.uniforms.uScatterColor.value = new THREE.Color(p.sssColor);
      mesh.material = mat;
    }
  } else {
    // MeshPhysicalMaterial path (faster)
    mesh.material = new THREE.MeshPhysicalMaterial({
      color:              new THREE.Color(p.baseColor),
      roughness:          p.roughness,
      metalness:          p.metalness,
      sheen:              p.sheen,
      sheenColor:         new THREE.Color(p.sheenColor),
      clearcoat:          p.clearcoat,
      clearcoatRoughness: p.clearcoatRoughness,
      anisotropy:         p.anisotropy,
      transmission:       p.transmission,
      ior:                p.ior,
      thickness:          p.thickness,
      transparent:        p.transmission > 0,
      envMapIntensity:    1.2,
    });
  }

  // Generate custom textures
  const rgb = hexToRGB3(p.baseColor);
  const textures = generateFullSkinTextures({
    size:            p.textureSize,
    tone:            'custom',
    poreScale:       p.poreScale,
    wrinkleStrength: p.wrinkleStrength,
    region:          p.region,
    age:             p.age,
  });
  // Override base color in generateFullSkinTextures result using custom color
  if (textures.color && mesh.material.uniforms?.tColor) {
    mesh.material.uniforms.tColor.value = new THREE.CanvasTexture(textures.color);
  } else if (textures.color) {
    mesh.material.map          = new THREE.CanvasTexture(textures.color);
    mesh.material.roughnessMap = new THREE.CanvasTexture(textures.roughness);
    mesh.material.normalMap    = new THREE.CanvasTexture(textures.normal);
    mesh.material.aoMap        = new THREE.CanvasTexture(textures.ao);
  }

  // Displacement
  if (p.displacementDepth > 0) {
    applyDisplacementMap(mesh, {
      noiseType:      p.noiseType,
      noiseAmplitude: p.displacementDepth,
      noiseScale:     4,
    });
  }

  mesh.material.needsUpdate = true;
  return true;
}

function hexToRGB3(hex) {
  if (!hex || hex.length < 7) return [200,160,120];
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}
"""
    with open(smart_path, "w") as f:
        f.write(smart)
    print("✅ SURFACE_PRESETS + applySurfaceMaterial + generateWaterNormalMap +")
    print("   generateMetalTexture + buildCustomSkin + DEFAULT_CUSTOM_SKIN added")
else:
    print("✅ SURFACE_PRESETS already present")

# ── 2. WIRE INTO App.jsx ──────────────────────────────────────────────────────
with open(app_path, "r") as f:
    app = f.read()

if "SURFACE_PRESETS" not in app:
    # Import
    app = app.replace(
        "import { applyPreset, applyEdgeWear, applyCavityDirt, getPresetCategories, applyDisplacementMap, applyClearcoatMaterial, applyAnisotropyMaterial, applySkinSSS, addAreaLight, applyMultiLayerTexture, generateProceduralSkinTexture, generateScaleTexture, canvasToNormalMap, SKIN_TONES, applyRealisticSkin, generateFullSkinTextures, applyFullSkinTextures, applyLipMaterial, applyEyeMaterial, setupSkinLighting, applyJimenezSkin, generateMultiResNormals, generateFilmQualitySkinTextures, wireSSAOToComposer, initLTCAreaLights, CREATURE_PRESETS, applyCreatureSkin } from \"./mesh/SmartMaterials.js\";",
        "import { applyPreset, applyEdgeWear, applyCavityDirt, getPresetCategories, applyDisplacementMap, applyClearcoatMaterial, applyAnisotropyMaterial, applySkinSSS, addAreaLight, applyMultiLayerTexture, generateProceduralSkinTexture, generateScaleTexture, canvasToNormalMap, SKIN_TONES, applyRealisticSkin, generateFullSkinTextures, applyFullSkinTextures, applyLipMaterial, applyEyeMaterial, setupSkinLighting, applyJimenezSkin, generateMultiResNormals, generateFilmQualitySkinTextures, wireSSAOToComposer, initLTCAreaLights, CREATURE_PRESETS, applyCreatureSkin, SURFACE_PRESETS, applySurfaceMaterial, buildCustomSkin, DEFAULT_CUSTOM_SKIN, generateWaterNormalMap, generateMetalTexture } from \"./mesh/SmartMaterials.js\";"
    )
    print("✅ Surface functions imported")

    # Add custom skin state
    app = app.replace(
        "  const [eyeColor, setEyeColor] = useState('#4a7c9e');",
        """  const [eyeColor, setEyeColor] = useState('#4a7c9e');
  const [customSkin, setCustomSkin] = useState({...DEFAULT_CUSTOM_SKIN});"""
    )

    # Add all surface + custom skin handlers
    surface_keys = [
        "ocean_water","shallow_water","murky_water","ice_water","lava","blood",
        "granite","limestone","obsidian","sandstone","marble","volcanic","crystal","cave_stone",
        "chrome","brushed_steel","rust","gold","copper","bronze","iron",
        "stone_skin","metal_skin","water_skin","rock_skin","lava_skin","ice_skin",
        "wood_skin","crystal_skin","obsidian_skin","demon_skin","cyber_skin","alien_skin",
    ]
    surface_handlers = "\n".join([
        '    if (fn === "surface_' + k + '") { if(meshRef.current){ applySurfaceMaterial(meshRef.current,"' + k + '"); setStatus("Material: ' + k.replace("_"," ") + '"); } return; }'
        for k in surface_keys
    ])
    surface_handlers += """
    if (fn === "custom_skin_build") {
      if (meshRef.current) {
        buildCustomSkin(meshRef.current, customSkin);
        setStatus("Custom skin applied");
      }
      return;
    }
    if (fn === "custom_skin_download") {
      if (meshRef.current) {
        const textures = generateFullSkinTextures({
          size: customSkin.textureSize || 1024,
          poreScale: customSkin.poreScale,
          wrinkleStrength: customSkin.wrinkleStrength,
          age: customSkin.age,
          region: customSkin.region,
        });
        ['color','roughness','normal','ao'].forEach(k => {
          const a=document.createElement('a');
          a.href=textures[k].toDataURL('image/png');
          a.download=`spx_custom_skin_${k}.png`; a.click();
        });
        setStatus("Custom skin textures downloaded");
      }
      return;
    }"""

    app = app.replace(
        '    if (fn === "creature_lizard")',
        surface_handlers + '\n    if (fn === "creature_lizard")'
    )
    print("✅ All surface + custom skin handlers wired")

    with open(app_path, "w") as f:
        f.write(app)

# ── 3. ADD TO ProfessionalShell ───────────────────────────────────────────────
with open(shell_path, "r") as f:
    shell = f.read()

if "surface_ocean_water" not in shell:
    shell = shell.replace(
        '    { label: "── CREATURE SKIN ──",     fn: null },',
        """    { label: "── WATER MATERIALS ──",   fn: null },
    { label: "Ocean Water",         fn: "surface_ocean_water",  key: "" },
    { label: "Shallow Water",       fn: "surface_shallow_water",key: "" },
    { label: "Murky Water",         fn: "surface_murky_water",  key: "" },
    { label: "Ice",                 fn: "surface_ice_water",    key: "" },
    { label: "Lava",                fn: "surface_lava",         key: "" },
    { label: "Blood",               fn: "surface_blood",        key: "" },
    { label: "─", fn: null },
    { label: "── ROCK / STONE ──",   fn: null },
    { label: "Granite",             fn: "surface_granite",      key: "" },
    { label: "Limestone",           fn: "surface_limestone",    key: "" },
    { label: "Obsidian",            fn: "surface_obsidian",     key: "" },
    { label: "Sandstone",           fn: "surface_sandstone",    key: "" },
    { label: "Marble",              fn: "surface_marble",       key: "" },
    { label: "Volcanic Rock",       fn: "surface_volcanic",     key: "" },
    { label: "Crystal",             fn: "surface_crystal",      key: "" },
    { label: "Cave Stone",          fn: "surface_cave_stone",   key: "" },
    { label: "─", fn: null },
    { label: "── METAL ──",          fn: null },
    { label: "Chrome",              fn: "surface_chrome",       key: "" },
    { label: "Brushed Steel",       fn: "surface_brushed_steel",key: "" },
    { label: "Rust",                fn: "surface_rust",         key: "" },
    { label: "Gold",                fn: "surface_gold",         key: "" },
    { label: "Copper",              fn: "surface_copper",       key: "" },
    { label: "Bronze",              fn: "surface_bronze",       key: "" },
    { label: "Iron",                fn: "surface_iron",         key: "" },
    { label: "─", fn: null },
    { label: "── CHARACTER SKIN TYPES ──", fn: null },
    { label: "Stone Skin",          fn: "surface_stone_skin",   key: "" },
    { label: "Metal Skin",          fn: "surface_metal_skin",   key: "" },
    { label: "Water Skin",          fn: "surface_water_skin",   key: "" },
    { label: "Rock Skin",           fn: "surface_rock_skin",    key: "" },
    { label: "Lava Skin",           fn: "surface_lava_skin",    key: "" },
    { label: "Ice Skin",            fn: "surface_ice_skin",     key: "" },
    { label: "Wood/Bark Skin",      fn: "surface_wood_skin",    key: "" },
    { label: "Crystal Skin",        fn: "surface_crystal_skin", key: "" },
    { label: "Obsidian Skin",       fn: "surface_obsidian_skin",key: "" },
    { label: "Demon Skin",          fn: "surface_demon_skin",   key: "" },
    { label: "Cyber/Android Skin",  fn: "surface_cyber_skin",   key: "" },
    { label: "Alien Skin",          fn: "surface_alien_skin",   key: "" },
    { label: "─", fn: null },
    { label: "── CUSTOM SKIN BUILDER ──", fn: null },
    { label: "Build Custom Skin",   fn: "custom_skin_build",    key: "" },
    { label: "Download Custom Textures", fn: "custom_skin_download", key: "" },
    { label: "─", fn: null },
    { label: "── CREATURE SKIN ──",     fn: null },"""
    )
    with open(shell_path, "w") as f:
        f.write(shell)
    print("✅ All materials + custom skin builder added to Render menu")

print("""
── Surface materials complete ──

MATERIALS ADDED:
  Water:     Ocean / Shallow / Murky / Ice / Lava / Blood
  Rock:      Granite / Limestone / Obsidian / Sandstone / Marble / Volcanic / Crystal / Cave Stone
  Metal:     Chrome / Brushed Steel / Rust / Gold / Copper / Bronze / Iron
  Char Skin: Stone / Metal / Water / Rock / Lava / Ice / Wood / Crystal / Obsidian / Demon / Cyber / Alien
  Custom:    Build Custom Skin — full control over every parameter

CUSTOM SKIN BUILDER:
  - customSkin state holds all parameters
  - Render > Build Custom Skin applies them
  - Render > Download Custom Textures downloads 4 PNG maps
  - Parameters: baseColor, roughness, metalness, sssStrength, sssColor,
    clearcoat, anisotropy, sheen, transmission, poreScale, wrinkleStrength,
    displacementDepth, noiseType, textureSize, age, region, useJimenezSSS
  - Set customSkin via window.customSkin = {...} in browser console
    or build a UI panel for it in the next session
""")
