import * as THREE from "three";

// ── Material preset library ───────────────────────────────────────────────────
export const MATERIAL_PRESETS = {
  // Metals
  chrome:      { color:"#c0c0c0", roughness:0.05, metalness:1.0, clearcoat:1.0, clearcoatRoughness:0.05, label:"Chrome" },
  gold:        { color:"#ffd700", roughness:0.1,  metalness:1.0, label:"Gold" },
  copper:      { color:"#b87333", roughness:0.2,  metalness:0.9, label:"Copper" },
  iron:        { color:"#888888", roughness:0.6,  metalness:0.8, label:"Iron" },
  brushedMetal:{ color:"#aaaaaa", roughness:0.4,  metalness:0.9, label:"Brushed Metal" },
  // Stone
  marble:      { color:"#f0f0f0", roughness:0.2,  metalness:0.0, clearcoat:0.8, clearcoatRoughness:0.1, label:"Marble" },
  granite:     { color:"#888060", roughness:0.7,  metalness:0.0, label:"Granite" },
  concrete:    { color:"#888888", roughness:0.9,  metalness:0.0, label:"Concrete" },
  slate:       { color:"#445566", roughness:0.8,  metalness:0.0, label:"Slate" },
  // Organic
  skin:        { color:"#ffcc99", roughness:0.7,  metalness:0.0, sheen:0.4, label:"Skin" },
  wood:        { color:"#8b4513", roughness:0.8,  metalness:0.0, label:"Wood" },
  leather:     { color:"#4a2f1a", roughness:0.6,  metalness:0.0, label:"Leather" },
  rubber:      { color:"#222222", roughness:0.9,  metalness:0.0, label:"Rubber" },
  // Glass/Plastic
  glass:       { color:"#aaccff", roughness:0.0,  metalness:0.0, transmission:1.0, ior:1.5, thickness:0.5, transparent:true, opacity:1.0, label:"Glass" },
  plastic:     { color:"#ff4444", roughness:0.3,  metalness:0.0, label:"Plastic" },
  ceramic:     { color:"#ffffff", roughness:0.1,  metalness:0.0, label:"Ceramic" },
  // Special
  emissiveTeal:{ color:"#00ffc8", roughness:0.5,  metalness:0.0, emissive:"#00ffc8", emissiveIntensity:0.5, label:"Emissive Teal" },
  emissiveOrange:{ color:"#FF6600", roughness:0.5, metalness:0.0, emissive:"#FF6600", emissiveIntensity:0.5, label:"Emissive Orange" },
  holographic: { color:"#88ffff", roughness:0.0,  metalness:1.0, label:"Holographic" },
  lava:        { color:"#ff4400", roughness:0.8,  metalness:0.0, emissive:"#ff2200", emissiveIntensity:0.8, label:"Lava" },
  ice:         { color:"#aaddff", roughness:0.05, metalness:0.0, transmission:0.9, ior:1.31, thickness:1.0, transparent:true, opacity:1.0, label:"Ice" },
  clay2:       { color:"#cc8866", roughness:0.9,  metalness:0.0, label:"Clay" },
};

// ── Apply preset to mesh ──────────────────────────────────────────────────────
export function applyPreset(mesh, presetKey) {
  const preset = MATERIAL_PRESETS[presetKey];
  if (!preset || !mesh) return;

  const mat = new THREE.MeshPhysicalMaterial({
    color:             new THREE.Color(preset.color),
    roughness:         preset.roughness,
    metalness:         preset.metalness,
    transparent:       preset.transparent || false,
    opacity:           preset.opacity !== undefined ? preset.opacity : 1.0,
    emissive:          preset.emissive ? new THREE.Color(preset.emissive) : new THREE.Color(0),
    emissiveIntensity: preset.emissiveIntensity || 0,
  });

  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map(() => mat.clone());
  } else {
    mesh.material = mat;
  }
  mesh.material.needsUpdate = true;
}

// ── Edge wear — darken edges ──────────────────────────────────────────────────
export function applyEdgeWear(mesh, { strength = 0.5, threshold = 0.3 } = {}) {
  const geo = mesh.geometry;
  if (!geo.attributes.color) {
    const count  = geo.attributes.position.count;
    const colors = new Float32Array(count * 3).fill(1);
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  // Detect edges by curvature (simplified — use normal difference)
  const pos     = geo.attributes.position;
  const normals = geo.attributes.normal;
  const colors  = geo.attributes.color;
  const idx     = geo.index;
  if (!normals || !idx) return;

  const arr = idx.array;
  for (let i = 0; i < arr.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const ai = arr[i+k], bi = arr[i+(k+1)%3];
      const na = new THREE.Vector3(normals.getX(ai), normals.getY(ai), normals.getZ(ai));
      const nb = new THREE.Vector3(normals.getX(bi), normals.getY(bi), normals.getZ(bi));
      const diff = 1 - na.dot(nb);
      if (diff > threshold) {
        const wear = 1 - diff * strength;
        colors.setXYZ(ai, wear, wear, wear);
        colors.setXYZ(bi, wear, wear, wear);
      }
    }
  }
  colors.needsUpdate = true;
  if (mesh.material) { mesh.material.vertexColors = true; mesh.material.needsUpdate = true; }
}

// ── Cavity dirt — darken concave areas ───────────────────────────────────────
export function applyCavityDirt(mesh, { strength = 0.8, blur = 2 } = {}) {
  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  if (!pos || !nor) return;

  if (!geo.attributes.color) {
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3).fill(1), 3));
  }
  const colors = geo.attributes.color;
  const idx    = geo.index;
  if (!idx) return;

  // Compute concavity per vertex
  const concavity = new Float32Array(pos.count).fill(0);
  const counts    = new Uint32Array(pos.count).fill(0);
  const arr       = idx.array;

  for (let i = 0; i < arr.length; i += 3) {
    const [a, b, c] = [arr[i], arr[i+1], arr[i+2]];
    const pa = new THREE.Vector3(pos.getX(a), pos.getY(a), pos.getZ(a));
    const pb = new THREE.Vector3(pos.getX(b), pos.getY(b), pos.getZ(b));
    const pc = new THREE.Vector3(pos.getX(c), pos.getY(c), pos.getZ(c));
    const center = pa.clone().add(pb).add(pc).divideScalar(3);
    [a, b, c].forEach(vi => {
      const vp = new THREE.Vector3(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
      const vn = new THREE.Vector3(nor.getX(vi), nor.getY(vi), nor.getZ(vi));
      const toCenter = center.clone().sub(vp);
      const dot = toCenter.dot(vn);
      if (dot > 0) { concavity[vi] += dot; counts[vi]++; }
    });
  }

  for (let i = 0; i < pos.count; i++) {
    const c = counts[i] > 0 ? Math.min(1, concavity[i] / counts[i] * strength) : 0;
    const v = 1 - c;
    colors.setXYZ(i, v, v, v);
  }
  colors.needsUpdate = true;
  if (mesh.material) { mesh.material.vertexColors = true; mesh.material.needsUpdate = true; }
}

// ── Get preset categories ─────────────────────────────────────────────────────
export function getPresetCategories() {
  return {
    Metals:   ["chrome","gold","copper","iron","brushedMetal"],
    Stone:    ["marble","granite","concrete","slate"],
    Organic:  ["skin","wood","leather","rubber"],
    Glass:    ["glass","plastic","ceramic"],
    Special:  ["emissiveTeal","emissiveOrange","holographic","lava","ice","clay2"],
  };
}

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
