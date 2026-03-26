import * as THREE from "three";

// ── Material preset library ───────────────────────────────────────────────────
export const MATERIAL_PRESETS = {
  // Metals
  chrome:      { color:"#c0c0c0", roughness:0.05, metalness:1.0, label:"Chrome" },
  gold:        { color:"#ffd700", roughness:0.1,  metalness:1.0, label:"Gold" },
  copper:      { color:"#b87333", roughness:0.2,  metalness:0.9, label:"Copper" },
  iron:        { color:"#888888", roughness:0.6,  metalness:0.8, label:"Iron" },
  brushedMetal:{ color:"#aaaaaa", roughness:0.4,  metalness:0.9, label:"Brushed Metal" },
  // Stone
  marble:      { color:"#f0f0f0", roughness:0.2,  metalness:0.0, label:"Marble" },
  granite:     { color:"#888060", roughness:0.7,  metalness:0.0, label:"Granite" },
  concrete:    { color:"#888888", roughness:0.9,  metalness:0.0, label:"Concrete" },
  slate:       { color:"#445566", roughness:0.8,  metalness:0.0, label:"Slate" },
  // Organic
  skin:        { color:"#ffcc99", roughness:0.7,  metalness:0.0, label:"Skin" },
  wood:        { color:"#8b4513", roughness:0.8,  metalness:0.0, label:"Wood" },
  leather:     { color:"#4a2f1a", roughness:0.6,  metalness:0.0, label:"Leather" },
  rubber:      { color:"#222222", roughness:0.9,  metalness:0.0, label:"Rubber" },
  // Glass/Plastic
  glass:       { color:"#aaccff", roughness:0.0,  metalness:0.0, transparent:true, opacity:0.3, label:"Glass" },
  plastic:     { color:"#ff4444", roughness:0.3,  metalness:0.0, label:"Plastic" },
  ceramic:     { color:"#ffffff", roughness:0.1,  metalness:0.0, label:"Ceramic" },
  // Special
  emissiveTeal:{ color:"#00ffc8", roughness:0.5,  metalness:0.0, emissive:"#00ffc8", emissiveIntensity:0.5, label:"Emissive Teal" },
  emissiveOrange:{ color:"#FF6600", roughness:0.5, metalness:0.0, emissive:"#FF6600", emissiveIntensity:0.5, label:"Emissive Orange" },
  holographic: { color:"#88ffff", roughness:0.0,  metalness:1.0, label:"Holographic" },
  lava:        { color:"#ff4400", roughness:0.8,  metalness:0.0, emissive:"#ff2200", emissiveIntensity:0.8, label:"Lava" },
  ice:         { color:"#aaddff", roughness:0.0,  metalness:0.0, transparent:true, opacity:0.7, label:"Ice" },
  clay2:       { color:"#cc8866", roughness:0.9,  metalness:0.0, label:"Clay" },
};

// ── Apply preset to mesh ──────────────────────────────────────────────────────
export function applyPreset(mesh, presetKey) {
  const preset = MATERIAL_PRESETS[presetKey];
  if (!preset || !mesh) return;

  const mat = new THREE.MeshStandardMaterial({
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
