import os, re

base = "/workspaces/spx-mesh-editor/src"
app_path = f"{base}/App.jsx"
css_path = f"{base}/styles/pro-dark.css"
shell_path = f"{base}/pro-ui/ProfessionalShell.jsx"
wmap_path = f"{base}/pro-ui/workspaceMap.js"
smart_path = f"{base}/mesh/SmartMaterials.js"

changes = 0

# ── 1. FIX TIMELINE TEXT VISIBILITY ──────────────────────────────────────────
with open(css_path, "r") as f:
    css = f.read()

# Make timeline frame labels and range inputs more visible
css = css.replace(
    ".tl-frame-label { font-size: 9px; color: var(--t3); letter-spacing: 0.06em; }",
    ".tl-frame-label { font-size: 9px; color: var(--t1); letter-spacing: 0.06em; font-weight: 500; }"
)
css = css.replace(
    "  color: var(--t2); font-family: var(--mono);\n  font-size: 9px; padding: 2px 4px; text-align: center;",
    "  color: var(--t1); font-family: var(--mono);\n  font-size: 9px; padding: 2px 4px; text-align: center;"
)
# Make timeline track labels brighter
css = css.replace(
    ".tl-track-label {",
    ".tl-track-label { color: var(--t1) !important;"
)
# Make frame numbers on timeline ruler more visible
if ".tl-ruler-label" in css:
    css = css.replace(
        ".tl-ruler-label {",
        ".tl-ruler-label { color: var(--t1) !important; font-weight: 500 !important;"
    )
else:
    css += "\n.tl-ruler-label { color: var(--t1) !important; font-size: 9px; font-weight: 500; }"

# Make timeline keyframe dots more visible
css += """
/* ── Timeline visibility improvements ───────────────────────────────────── */
.tl-frame-label       { color: var(--t1) !important; font-weight: 500 !important; }
.tl-range-input       { color: var(--t0) !important; }
.tl-track-name        { color: var(--t1) !important; font-size: 10px !important; }
.tl-keyframe          { opacity: 1 !important; }
.tl-scrubber          { background: var(--ac) !important; }
.tl-timecode          { color: var(--t0) !important; font-weight: 600 !important; font-size: 11px !important; }
.spx-timeline-frame   { color: var(--t1) !important; }
.spx-frame-num        { color: var(--t1) !important; font-weight: 500 !important; }
"""

with open(css_path, "w") as f:
    f.write(css)
changes += 1
print("✅ Timeline text visibility fixed")

# ── 2. ADD DISPLACEMENT + PROCEDURAL TEXTURES TO SmartMaterials.js ───────────
with open(smart_path, "r") as f:
    smart = f.read()

if "applyDisplacement" not in smart:
    displacement_code = r"""
// ── DISPLACEMENT MAP ──────────────────────────────────────────────────────────
export function applyDisplacementMap(mesh, options = {}) {
  if (!mesh?.geometry) return false;
  const {
    texture = null,
    scale = 0.1,
    bias = 0.0,
    noiseType = 'perlin',
    noiseScale = 4.0,
    noiseOctaves = 4,
    noiseAmplitude = 0.15,
  } = options;

  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  if (!pos) return false;

  // Generate displacement values
  const displace = new Float32Array(pos.count);

  if (texture) {
    // Use texture pixel data
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(texture.image, 0, 0, 256, 256);
    const imgData = ctx.getImageData(0, 0, 256, 256).data;
    const uvs = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const u = uvs ? uvs.getX(i) : (i / pos.count);
      const v = uvs ? uvs.getY(i) : 0.5;
      const px = Math.floor(u * 255) * 4;
      const py = Math.floor((1 - v) * 255) * 256 * 4;
      const idx = px + py;
      displace[i] = (imgData[idx] / 255) * scale + bias;
    }
  } else {
    // Procedural noise displacement
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      let val = 0;
      let amp = noiseAmplitude, freq = noiseScale;
      for (let o = 0; o < noiseOctaves; o++) {
        val += amp * simplexNoise(x * freq, y * freq, z * freq, noiseType);
        amp *= 0.5; freq *= 2.0;
      }
      displace[i] = val;
    }
  }

  // Apply displacement along normals
  const normals = geo.attributes.normal;
  if (!normals) { geo.computeVertexNormals(); }
  const nrm = geo.attributes.normal;

  for (let i = 0; i < pos.count; i++) {
    const d = displace[i];
    pos.setXYZ(
      i,
      pos.getX(i) + (nrm ? nrm.getX(i) : 0) * d,
      pos.getY(i) + (nrm ? nrm.getY(i) : 0) * d,
      pos.getZ(i) + (nrm ? nrm.getZ(i) : 0) * d,
    );
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return true;
}

// ── SIMPLE NOISE FUNCTIONS ────────────────────────────────────────────────────
function simplexNoise(x, y, z, type = 'perlin') {
  switch (type) {
    case 'voronoi': return voronoiNoise(x, y, z);
    case 'cellular': return cellularNoise(x, y, z);
    case 'perlin': default: return perlinNoise(x, y, z);
  }
}

function fade(t) { return t*t*t*(t*(t*6-15)+10); }
function lerp(a, b, t) { return a + t*(b-a); }
function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y, v = h < 4 ? y : h===12||h===14 ? x : z;
  return ((h&1)===0?u:-u) + ((h&2)===0?v:-v);
}
const P = new Uint8Array(512);
for (let i=0;i<256;i++) P[i]=P[i+256]=Math.floor(Math.random()*256);

function perlinNoise(x, y, z) {
  const X=Math.floor(x)&255, Y=Math.floor(y)&255, Z=Math.floor(z)&255;
  x-=Math.floor(x); y-=Math.floor(y); z-=Math.floor(z);
  const u=fade(x), v=fade(y), w=fade(z);
  const A=P[X]+Y, AA=P[A]+Z, AB=P[A+1]+Z, B=P[X+1]+Y, BA=P[B]+Z, BB=P[B+1]+Z;
  return lerp(lerp(lerp(grad(P[AA],x,y,z),grad(P[BA],x-1,y,z),u),
    lerp(grad(P[AB],x,y-1,z),grad(P[BB],x-1,y-1,z),u),v),
    lerp(lerp(grad(P[AA+1],x,y,z-1),grad(P[BA+1],x-1,y,z-1),u),
    lerp(grad(P[AB+1],x,y-1,z-1),grad(P[BB+1],x-1,y-1,z-1),u),v),w);
}

function voronoiNoise(x, y, z) {
  let minDist = 1e10;
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  for (let dx=-1;dx<=1;dx++) for (let dy=-1;dy<=1;dy++) for (let dz=-1;dz<=1;dz++) {
    const cx = xi+dx, cy = yi+dy, cz = zi+dz;
    const rx = cx + Math.sin(cx*127.1+cy*311.7)*0.5+0.5;
    const ry = cy + Math.sin(cx*269.5+cy*183.3)*0.5+0.5;
    const rz = cz + Math.sin(cx*419.2+cy*371.9)*0.5+0.5;
    const d = Math.sqrt((x-rx)**2+(y-ry)**2+(z-rz)**2);
    if (d < minDist) minDist = d;
  }
  return Math.min(minDist, 1.0) * 2 - 1;
}

function cellularNoise(x, y, z) {
  let f1 = 1e10, f2 = 1e10;
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  for (let dx=-1;dx<=1;dx++) for (let dy=-1;dy<=1;dy++) for (let dz=-1;dz<=1;dz++) {
    const cx=xi+dx, cy=yi+dy, cz=zi+dz;
    const rx=cx+Math.sin(cx*127.1+cy*311.7)*0.5+0.5;
    const ry=cy+Math.sin(cx*269.5+cy*183.3)*0.5+0.5;
    const rz=cz+Math.sin(cx*419.2+cy*371.9)*0.5+0.5;
    const d=Math.sqrt((x-rx)**2+(y-ry)**2+(z-rz)**2);
    if (d < f1) { f2=f1; f1=d; } else if (d < f2) { f2=d; }
  }
  return (f2-f1)*2-1;
}

// ── CLEARCOAT MATERIAL ────────────────────────────────────────────────────────
export function applyClearcoatMaterial(mesh, options = {}) {
  if (!mesh) return false;
  const THREE = window.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  if (!THREE) return false;
  const { clearcoat=1.0, clearcoatRoughness=0.1, color="#ffffff",
    roughness=0.3, metalness=0.0, wetness=false } = options;
  mesh.material = new THREE.MeshPhysicalMaterial({
    color, roughness, metalness,
    clearcoat, clearcoatRoughness,
    reflectivity: wetness ? 1.0 : 0.5,
    envMapIntensity: wetness ? 2.0 : 1.0,
  });
  mesh.material.needsUpdate = true;
  return true;
}

// ── ANISOTROPY MATERIAL ───────────────────────────────────────────────────────
export function applyAnisotropyMaterial(mesh, options = {}) {
  if (!mesh) return false;
  const THREE = window.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  if (!THREE) return false;
  const { anisotropy=1.0, anisotropyRotation=0.0, color="#c0c0c0",
    roughness=0.2, metalness=0.8 } = options;
  mesh.material = new THREE.MeshPhysicalMaterial({
    color, roughness, metalness,
    anisotropy, anisotropyRotation,
  });
  mesh.material.needsUpdate = true;
  return true;
}

// ── TRANSMISSION (SKIN/TRANSLUCENT) ──────────────────────────────────────────
export function applySkinSSS(mesh, options = {}) {
  if (!mesh) return false;
  const THREE = window.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  if (!THREE) return false;
  const { color="#ffcc99", roughness=0.7, subsurface=0.4,
    subsurfaceRadius=[1.0, 0.2, 0.1], thickness=0.5 } = options;
  mesh.material = new THREE.MeshPhysicalMaterial({
    color, roughness, metalness: 0,
    sheen: subsurface, sheenColor: subsurfaceRadius[0] > 0.5 ? "#ff8866" : "#ffaaaa",
    transmission: 0.05, thickness,
    clearcoat: 0.1, clearcoatRoughness: 0.4,
  });
  mesh.material.needsUpdate = true;
  return true;
}

// ── AREA LIGHT ────────────────────────────────────────────────────────────────
export function addAreaLight(scene, options = {}) {
  const THREE = window.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  if (!THREE || !scene) return null;
  const { color="#ffffff", intensity=2.0, width=2, height=2,
    position=[0,3,0], target=[0,0,0] } = options;
  const light = new THREE.RectAreaLight(color, intensity, width, height);
  light.position.set(...position);
  light.lookAt(...target);
  scene.add(light);
  // Visual helper
  const geo = new THREE.PlaneGeometry(width, height);
  const mat = new THREE.MeshBasicMaterial({
    color, side: THREE.DoubleSide, transparent: true, opacity: 0.3,
  });
  const helper = new THREE.Mesh(geo, mat);
  helper.position.set(...position);
  helper.lookAt(...target);
  scene.add(helper);
  return { light, helper };
}

// ── MULTI-LAYER TEXTURE BLEND ─────────────────────────────────────────────────
export function applyMultiLayerTexture(mesh, layers = {}) {
  if (!mesh?.material) return false;
  const THREE = window.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  if (!THREE) return false;
  // layers: { base, cavity, curvature, colorVariation, roughness }
  // Apply each map to the appropriate material slot
  if (layers.cavity) mesh.material.aoMap = layers.cavity;
  if (layers.colorVariation) mesh.material.map = layers.colorVariation;
  if (layers.roughness) mesh.material.roughnessMap = layers.roughness;
  if (layers.normal) mesh.material.normalMap = layers.normal;
  if (layers.displacement) mesh.material.displacementMap = layers.displacement;
  mesh.material.needsUpdate = true;
  return true;
}

// ── PROCEDURAL SKIN TEXTURE ────────────────────────────────────────────────────
// Generates a realistic skin-like procedural texture on a canvas
export function generateProceduralSkinTexture(options = {}) {
  const { size=1024, baseColor=[255,180,140], poreScale=60,
    wrinkleScale=8, variation=0.15 } = options;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const d = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size * poreScale, ny = y / size * poreScale;
      // Voronoi for pores
      const pore = voronoiNoise(nx, ny, 0) * 0.5 + 0.5;
      // Perlin for large variation
      const lv = perlinNoise(x/size*wrinkleScale, y/size*wrinkleScale, 0.5) * 0.5 + 0.5;
      // Combine
      const skin = pore * 0.3 + lv * 0.7;
      const vari = 1.0 - skin * variation;
      d[i]   = Math.min(255, Math.round(baseColor[0] * vari));
      d[i+1] = Math.min(255, Math.round(baseColor[1] * vari * 0.95));
      d[i+2] = Math.min(255, Math.round(baseColor[2] * vari * 0.9));
      d[i+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// ── PROCEDURAL SCALE TEXTURE (for creatures like Godzilla) ───────────────────
export function generateScaleTexture(options = {}) {
  const { size=1024, scaleSize=20, depth=0.8,
    baseColor=[40,60,40], scaleColor=[60,90,50] } = options;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const d = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size * scaleSize, ny = y / size * scaleSize;
      // Voronoi for scale cells
      const cell = voronoiNoise(nx, ny, 0) * 0.5 + 0.5;
      // Edge detection (dark at cell borders)
      const edge = Math.pow(cell, 0.3);
      // Large noise for variation
      const lv = perlinNoise(x/size*4, y/size*4, 0) * 0.5 + 0.5;

      const t = edge * (0.7 + lv * 0.3);
      d[i]   = Math.round(baseColor[0] + (scaleColor[0]-baseColor[0]) * t);
      d[i+1] = Math.round(baseColor[1] + (scaleColor[1]-baseColor[1]) * t);
      d[i+2] = Math.round(baseColor[2] + (scaleColor[2]-baseColor[2]) * t);
      d[i+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// ── GENERATE NORMAL MAP FROM CANVAS ───────────────────────────────────────────
export function canvasToNormalMap(canvas, strength = 2.0) {
  const size = canvas.width;
  const ctx = canvas.getContext('2d');
  const src = ctx.getImageData(0, 0, size, size).data;
  const out = document.createElement('canvas');
  out.width = out.height = size;
  const octx = out.getContext('2d');
  const outData = octx.createImageData(size, size);
  const d = outData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y*size+x)*4;
      const l = src[((y*size+Math.max(0,x-1))*4)];
      const r = src[((y*size+Math.min(size-1,x+1))*4)];
      const u = src[((Math.max(0,y-1)*size+x)*4)];
      const dn = src[((Math.min(size-1,y+1)*size+x)*4)];
      const nx = (l-r)/255 * strength;
      const ny = (u-dn)/255 * strength;
      const nz = Math.sqrt(Math.max(0, 1-nx*nx-ny*ny));
      d[i]   = Math.round((nx*0.5+0.5)*255);
      d[i+1] = Math.round((ny*0.5+0.5)*255);
      d[i+2] = Math.round(nz*255);
      d[i+3] = 255;
    }
  }
  octx.putImageData(outData, 0, 0);
  return out;
}
"""
    smart += displacement_code
    with open(smart_path, "w") as f:
        f.write(smart)
    changes += 1
    print("✅ Displacement, procedural textures (Perlin/Voronoi/Cellular), clearcoat,")
    print("   anisotropy, SSS skin, area light, multi-layer blend, skin/scale texture,")
    print("   normal map generator added to SmartMaterials.js")
else:
    print("✅ Displacement already present in SmartMaterials")

# ── 3. WIRE EVERYTHING INTO App.jsx ──────────────────────────────────────────
with open(app_path, "r") as f:
    app = f.read()

# Import new functions
if "applyDisplacementMap" not in app:
    app = app.replace(
        'import { applyPreset, applyEdgeWear, applyCavityDirt, getPresetCategories } from "./mesh/SmartMaterials.js";',
        'import { applyPreset, applyEdgeWear, applyCavityDirt, getPresetCategories, applyDisplacementMap, applyClearcoatMaterial, applyAnisotropyMaterial, applySkinSSS, addAreaLight, applyMultiLayerTexture, generateProceduralSkinTexture, generateScaleTexture, canvasToNormalMap } from "./mesh/SmartMaterials.js";'
    )
    changes += 1
    print("✅ New SmartMaterials functions imported")

# Add state for new features
if "displacementScale" not in app:
    app = app.replace(
        "  const [displacementOpen, setDisplacementOpen] = useState(false);",
        """  const [displacementOpen, setDisplacementOpen] = useState(false);
  const [displacementScale, setDisplacementScale] = useState(0.1);
  const [displacementType, setDisplacementType] = useState('perlin');
  const [clearcoatVal, setClearcoatVal] = useState(1.0);
  const [clearcoatRoughVal, setClearcoatRoughVal] = useState(0.1);
  const [anisotropyVal, setAnisotropyVal] = useState(1.0);
  const [areaLights, setAreaLights] = useState([]);"""
    )
    changes += 1
    print("✅ Displacement/clearcoat/anisotropy state added")

# Wire SSAO into renderer
if "SSAOPass" not in app and "ssaoPassRef" not in app:
    app = app.replace(
        "  const [ssaoEnabled, setSsaoEnabled] = useState(false);",
        """  const [ssaoEnabled, setSsaoEnabled] = useState(false);
  const ssaoPassRef = useRef(null);
  const composerRef = useRef(null);"""
    )
    changes += 1
    print("✅ SSAO refs added")

# Add handlers for all new features
new_handlers = '''    if (fn === "displace_perlin")   { if(meshRef.current){ applyDisplacementMap(meshRef.current,{noiseType:'perlin',noiseAmplitude:displacementScale,noiseScale:4}); setStatus("Perlin displacement applied"); } return; }
    if (fn === "displace_voronoi")  { if(meshRef.current){ applyDisplacementMap(meshRef.current,{noiseType:'voronoi',noiseAmplitude:displacementScale,noiseScale:4}); setStatus("Voronoi displacement applied"); } return; }
    if (fn === "displace_cellular") { if(meshRef.current){ applyDisplacementMap(meshRef.current,{noiseType:'cellular',noiseAmplitude:displacementScale,noiseScale:4}); setStatus("Cellular displacement applied"); } return; }
    if (fn === "mat_clearcoat")     { if(meshRef.current){ applyClearcoatMaterial(meshRef.current,{clearcoat:clearcoatVal,clearcoatRoughness:clearcoatRoughVal}); setStatus("Clearcoat applied"); } return; }
    if (fn === "mat_wet_clearcoat") { if(meshRef.current){ applyClearcoatMaterial(meshRef.current,{clearcoat:1.0,clearcoatRoughness:0.0,wetness:true}); setStatus("Wet clearcoat applied"); } return; }
    if (fn === "mat_anisotropy")    { if(meshRef.current){ applyAnisotropyMaterial(meshRef.current,{anisotropy:anisotropyVal}); setStatus("Anisotropy material applied"); } return; }
    if (fn === "mat_sss_skin")      { if(meshRef.current){ applySkinSSS(meshRef.current,{subsurface:0.4}); setStatus("SSS skin applied"); } return; }
    if (fn === "mat_sss_wax")       { if(meshRef.current){ applySkinSSS(meshRef.current,{color:"#ffe4b5",subsurface:0.8,roughness:0.3}); setStatus("SSS wax applied"); } return; }
    if (fn === "add_area_light")    { if(sceneRef.current){ const al=addAreaLight(sceneRef.current,{position:[0,3,2],intensity:3.0}); if(al) setStatus("Area light added"); } return; }
    if (fn === "gen_skin_tex")      {
      const canvas = generateProceduralSkinTexture({size:1024});
      if(meshRef.current?.material && window.THREE) {
        const tex = new window.THREE.CanvasTexture(canvas);
        meshRef.current.material.map = tex;
        meshRef.current.material.needsUpdate = true;
        setStatus("Procedural skin texture applied (1024px)");
      }
      const a=document.createElement('a'); a.href=canvas.toDataURL('image/png');
      a.download='spx_skin_texture.png'; a.click();
      return;
    }
    if (fn === "gen_scale_tex")     {
      const canvas = generateScaleTexture({size:1024,scaleSize:20});
      if(meshRef.current?.material && window.THREE) {
        const tex = new window.THREE.CanvasTexture(canvas);
        meshRef.current.material.map = tex;
        meshRef.current.material.needsUpdate = true;
        setStatus("Procedural scale texture applied (1024px Voronoi)");
      }
      const normCanvas = canvasToNormalMap(canvas, 3.0);
      if(meshRef.current?.material && window.THREE) {
        const normTex = new window.THREE.CanvasTexture(normCanvas);
        meshRef.current.material.normalMap = normTex;
        meshRef.current.material.needsUpdate = true;
      }
      const a=document.createElement('a'); a.href=canvas.toDataURL('image/png');
      a.download='spx_scale_texture.png'; a.click();
      return;
    }
    if (fn === "gen_wrinkle_tex")   {
      const canvas = generateProceduralSkinTexture({size:1024,poreScale:20,wrinkleScale:4,variation:0.25});
      const normCanvas = canvasToNormalMap(canvas, 4.0);
      if(meshRef.current?.material && window.THREE) {
        const normTex = new window.THREE.CanvasTexture(normCanvas);
        meshRef.current.material.normalMap = normTex;
        meshRef.current.material.normalScale = new window.THREE.Vector2(2,2);
        meshRef.current.material.needsUpdate = true;
        setStatus("Wrinkle normal map applied");
      }
      return;
    }'''

if "displace_perlin" not in app:
    app = app.replace(
        '    if (fn === "mat_glass")',
        new_handlers + '\n    if (fn === "mat_glass")'
    )
    changes += 1
    print("✅ All realism handlers wired into App.jsx")

with open(app_path, "w") as f:
    f.write(app)

# ── 4. ADD TO workspaceMap ────────────────────────────────────────────────────
with open(wmap_path, "r") as f:
    wmap = f.read()

if "displace_perlin" not in wmap:
    wmap = wmap.replace(
        '        { id: "smart_uv",        label: "Smart UV Unwrap", system: "UVUnwrap"    },',
        """        { id: "smart_uv",        label: "Smart UV Unwrap", system: "UVUnwrap"    },
        { id: "displace_perlin",   label: "Displace: Perlin",   system: "SmartMaterials" },
        { id: "displace_voronoi",  label: "Displace: Voronoi",  system: "SmartMaterials" },
        { id: "displace_cellular", label: "Displace: Cellular", system: "SmartMaterials" },
        { id: "mat_clearcoat",     label: "Clearcoat",          system: "SmartMaterials" },
        { id: "mat_wet_clearcoat", label: "Wet Clearcoat",      system: "SmartMaterials" },
        { id: "mat_anisotropy",    label: "Anisotropy",         system: "SmartMaterials" },
        { id: "mat_sss_skin",      label: "SSS Skin",           system: "SmartMaterials" },
        { id: "mat_sss_wax",       label: "SSS Wax",            system: "SmartMaterials" },
        { id: "add_area_light",    label: "Add Area Light",     system: "SmartMaterials" },
        { id: "gen_skin_tex",      label: "Gen Skin Texture",   system: "SmartMaterials" },
        { id: "gen_scale_tex",     label: "Gen Scale Texture",  system: "SmartMaterials" },
        { id: "gen_wrinkle_tex",   label: "Gen Wrinkle Normal", system: "SmartMaterials" },"""
    )
    with open(wmap_path, "w") as f:
        f.write(wmap)
    changes += 1
    print("✅ All realism tools added to workspaceMap")

# ── 5. ADD TO ProfessionalShell menus ────────────────────────────────────────
with open(shell_path, "r") as f:
    shell = f.read()

if "displace_perlin" not in shell:
    shell = shell.replace(
        '    { label: "HDRI from File",       fn: "hdri_from_file",     key: "" },',
        """    { label: "HDRI from File",       fn: "hdri_from_file",     key: "" },
    { label: "─", fn: null },
    { label: "── DISPLACEMENT ──",    fn: null },
    { label: "Displace: Perlin",     fn: "displace_perlin",    key: "" },
    { label: "Displace: Voronoi",    fn: "displace_voronoi",   key: "" },
    { label: "Displace: Cellular",   fn: "displace_cellular",  key: "" },
    { label: "─", fn: null },
    { label: "── MATERIALS ──",       fn: null },
    { label: "Clearcoat",            fn: "mat_clearcoat",      key: "" },
    { label: "Wet Clearcoat",        fn: "mat_wet_clearcoat",  key: "" },
    { label: "Anisotropy",           fn: "mat_anisotropy",     key: "" },
    { label: "SSS Skin",             fn: "mat_sss_skin",       key: "" },
    { label: "SSS Wax",              fn: "mat_sss_wax",        key: "" },
    { label: "─", fn: null },
    { label: "── LIGHTS ──",          fn: null },
    { label: "Add Area Light",       fn: "add_area_light",     key: "" },
    { label: "─", fn: null },
    { label: "── PROCEDURAL TEX ──",  fn: null },
    { label: "Gen Skin Texture",     fn: "gen_skin_tex",       key: "" },
    { label: "Gen Scale Texture",    fn: "gen_scale_tex",      key: "" },
    { label: "Gen Wrinkle Normal",   fn: "gen_wrinkle_tex",    key: "" },"""
    )
    with open(shell_path, "w") as f:
        f.write(shell)
    changes += 1
    print("✅ All realism tools added to Render menu in ProfessionalShell")

print(f"\n── Done — {changes} changes ──")
print("""
REALISM FEATURES ADDED:
  Displacement: Render > Displace Perlin/Voronoi/Cellular
  Materials:    Render > Clearcoat / Wet Clearcoat / Anisotropy / SSS Skin / SSS Wax
  Lights:       Render > Add Area Light
  Textures:     Render > Gen Skin Texture / Gen Scale Texture / Gen Wrinkle Normal
  Timeline:     Text visibility fixed (t3 → t1, font-weight 500)
""")
