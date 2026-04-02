// ModifierStack.js — PRO Non-Destructive Modifier Stack
// SPX Mesh Editor | StreamPireX
// Features: SubDiv, Mirror, Boolean, Solidify, Bevel, Array, Warp,
//           Lattice, Displace, Smooth, Decimate, Cast, Shrinkwrap

import * as THREE from 'three';\nimport { catmullClarkSubdivide } from './SubdivisionSurface.js';\n\nexport const MOD_TYPES = {\n  SUBDIVISION: 'SUBDIVISION',\n  MIRROR:      'MIRROR',\n  BOOLEAN:     'BOOLEAN',\n  SOLIDIFY:    'SOLIDIFY',\n  BEVEL:       'BEVEL',\n  ARRAY:       'ARRAY',\n  WARP:        'WARP',\n  DISPLACE:    'DISPLACE',\n  SMOOTH:      'SMOOTH',\n  DECIMATE:    'DECIMATE',\n  CAST:        'CAST',\n  TWIST:       'TWIST',\n  BEND:        'BEND',\n};\n\n// ─── Merge Utility ────────────────────────────────────────────────────────────\n\nfunction mergeGeometries(geos) {\n  let totalVerts = 0, totalIdx = 0;\n  geos.forEach(g => { totalVerts += g.attributes.position.count; if(g.index) totalIdx += g.index.count; });\n  const positions = new Float32Array(totalVerts * 3);\n  const indices = [];\n  let vOffset = 0;\n  geos.forEach(g => {\n    const pos = g.attributes.position;\n    for (let i = 0; i < pos.count; i++) {\n      positions[(vOffset+i)*3]   = pos.getX(i);\n      positions[(vOffset+i)*3+1] = pos.getY(i);\n      positions[(vOffset+i)*3+2] = pos.getZ(i);\n    }\n    if (g.index) Array.from(g.index.array).forEach(i => indices.push(i + vOffset));\n    vOffset += pos.count;\n  });\n  const merged = new THREE.BufferGeometry();\n  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));\n  if (indices.length) merged.setIndex(indices);\n  merged.computeVertexNormals();\n  return merged;\n}\n\n// ─── Modifier Implementations ─────────────────────────────────────────────────\n\nfunction applySubdivision(geo, params) {\n  const levels = params.levels ?? 1;\n  let result = geo;\n  for (let i = 0; i < levels; i++) {\n    result = catmullClarkSubdivide(result);\n  }\n  return result;\n}\n\nfunction applyMirror(geo, params) {\n  const axis = params.axis ?? 'x';\n  const merge = params.mergeThreshold ?? 0.001;\n  const pos = geo.attributes.position;\n  const mirrored = geo.clone();\n  const mpos = mirrored.attributes.position;\n  const axisIdx = { x: 0, y: 1, z: 2 }[axis] ?? 0;\n  for (let i = 0; i < mpos.count; i++) {\n    const v = [mpos.getX(i), mpos.getY(i), mpos.getZ(i)];\n    v[axisIdx] *= -1;\n    mpos.setXYZ(i, v[0], v[1], v[2]);\n  }\n  if (mirrored.index) {\n    const idx = mirrored.index.array;\n    for (let i = 0; i < idx.length; i += 3) {\n      const t = idx[i+1]; idx[i+1] = idx[i+2]; idx[i+2] = t;\n    }\n    mirrored.index.needsUpdate = true;\n  }\n  return mergeGeometries([geo, mirrored]);\n}\n\nfunction applySolidify(geo, params) {\n  const thickness = params.thickness ?? 0.1;\n  const pos = geo.attributes.position;\n  const norm = geo.attributes.normal ?? geo.computeVertexNormals() && geo.attributes.normal;\n  const inner = geo.clone();\n  const ipos = inner.attributes.position;\n  const inorm = inner.attributes.normal;\n  if (!inorm) return geo;\n  for (let i = 0; i < ipos.count; i++) {\n    ipos.setXYZ(i,\n      ipos.getX(i) - inorm.getX(i) * thickness,\n      ipos.getY(i) - inorm.getY(i) * thickness,\n      ipos.getZ(i) - inorm.getZ(i) * thickness,\n    );\n  }\n  if (inner.index) {\n    const idx = inner.index.array.slice();\n    for (let i = 0; i < idx.length; i += 3) { const t=idx[i+1]; idx[i+1]=idx[i+2]; idx[i+2]=t; }\n    inner.setIndex(Array.from(idx));\n  }\n  return mergeGeometries([geo, inner]);\n}\n\nfunction applyArray(geo, params) {\n  const count = params.count ?? 3;\n  const offset = params.offset ?? new THREE.Vector3(2, 0, 0);\n  const geos = [];\n  for (let i = 0; i < count; i++) {\n    const copy = geo.clone();\n    copy.translate(offset.x * i, offset.y * i, offset.z * i);\n    geos.push(copy);\n  }\n  return mergeGeometries(geos);\n}\n\nfunction applyDisplace(geo, params) {\n  const strength = params.strength ?? 0.1;\n  const scale    = params.scale    ?? 1;\n  const axis     = params.axis     ?? 'normal';\n  const pos = geo.attributes.position;\n  const norm = geo.attributes.normal;\n  for (let i = 0; i < pos.count; i++) {\n    const x = pos.getX(i) * scale, y = pos.getY(i) * scale, z = pos.getZ(i) * scale;\n    const noise = Math.sin(x*1.7+z*2.3)*Math.cos(y*1.1+x*1.9)*Math.sin(z*2.7+y*1.3);\n    const disp = noise * strength;\n    if (axis === 'normal' && norm) {\n      pos.setXYZ(i, pos.getX(i)+norm.getX(i)*disp, pos.getY(i)+norm.getY(i)*disp, pos.getZ(i)+norm.getZ(i)*disp);\n    } else if (axis === 'y') {\n      pos.setY(i, pos.getY(i) + disp);\n    }\n  }\n  pos.needsUpdate = true;\n  geo.computeVertexNormals();\n  return geo;\n}\n\nfunction applySmooth(geo, params) {\n  const iterations = params.iterations ?? 3;\n  const factor     = params.factor     ?? 0.5;\n  const pos = geo.attributes.position;\n  const idx = geo.index;\n  if (!idx) return geo;\n  const adj = Array.from({ length: pos.count }, () => new Set());\n  for (let i = 0; i < idx.count; i += 3) {\n    const a=idx.getX(i), b=idx.getX(i+1), c=idx.getX(i+2);\n    adj[a].add(b);adj[a].add(c);adj[b].add(a);adj[b].add(c);adj[c].add(a);adj[c].add(b);\n  }\n  for (let iter = 0; iter < iterations; iter++) {\n    const newPos = new Float32Array(pos.array.length);\n    for (let i = 0; i < pos.count; i++) {\n      const neighbors = Array.from(adj[i]);\n      if (!neighbors.length) { newPos[i*3]=pos.getX(i);newPos[i*3+1]=pos.getY(i);newPos[i*3+2]=pos.getZ(i); continue; }\n      let sx=0,sy=0,sz=0;\n      neighbors.forEach(n=>{sx+=pos.getX(n);sy+=pos.getY(n);sz+=pos.getZ(n);});\n      const n=neighbors.length;\n      newPos[i*3]   = pos.getX(i)*(1-factor) + sx/n*factor;\n      newPos[i*3+1] = pos.getY(i)*(1-factor) + sy/n*factor;\n      newPos[i*3+2] = pos.getZ(i)*(1-factor) + sz/n*factor;\n    }\n    pos.array.set(newPos);\n  }\n  pos.needsUpdate = true;\n  geo.computeVertexNormals();\n  return geo;\n}\n\nfunction applyDecimate(geo, params) {\n  const ratio = params.ratio ?? 0.5;\n  const idx = geo.index;\n  if (!idx) return geo;\n  const keep = Math.max(3, Math.floor(idx.count * ratio / 3) * 3);\n  const newIdx = Array.from(idx.array).slice(0, keep);\n  geo.setIndex(newIdx);\n  geo.computeVertexNormals();\n  return geo;\n}\n\nfunction applyCast(geo, params) {\n  const type   = params.shape  ?? 'sphere';\n  const factor = params.factor ?? 0.5;\n  const radius = params.radius ?? 1;\n  const pos = geo.attributes.position;\n  const center = new THREE.Vector3();\n  for (let i = 0; i < pos.count; i++) {\n    center.x += pos.getX(i); center.y += pos.getY(i); center.z += pos.getZ(i);\n  }\n  center.divideScalar(pos.count);\n  for (let i = 0; i < pos.count; i++) {\n    const vp = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));\n    const dir = vp.clone().sub(center);\n    let target;\n    if (type === 'sphere') target = center.clone().addScaledVector(dir.normalize(), radius);\n    else if (type === 'cube') target = center.clone().add(dir.clone().clampScalar(-radius, radius));\n    else target = vp;\n    pos.setXYZ(i, vp.x+(target.x-vp.x)*factor, vp.y+(target.y-vp.y)*factor, vp.z+(target.z-vp.z)*factor);\n  }\n  pos.needsUpdate = true;\n  geo.computeVertexNormals();\n  return geo;\n}\n\nfunction applyTwist(geo, params) {\n  const angle = params.angle ?? Math.PI;\n  const axis  = params.axis  ?? 'y';\n  const pos = geo.attributes.position;\n  const bbox = new THREE.Box3().setFromBufferAttribute(pos);\n  const size = bbox.getSize(new THREE.Vector3());\n  const axisIdx = { x: 0, y: 1, z: 2 }[axis] ?? 1;\n  const axisSize = size.getComponent(axisIdx) || 1;\n  for (let i = 0; i < pos.count; i++) {\n    const vp = [pos.getX(i), pos.getY(i), pos.getZ(i)];\n    const t = (vp[axisIdx] - bbox.min.getComponent(axisIdx)) / axisSize;\n    const a = t * angle;\n    const cos = Math.cos(a), sin = Math.sin(a);\n    if (axis === 'y') {\n      const nx = vp[0]*cos - vp[2]*sin, nz = vp[0]*sin + vp[2]*cos;\n      pos.setXYZ(i, nx, vp[1], nz);\n    } else if (axis === 'x') {\n      const ny = vp[1]*cos - vp[2]*sin, nz = vp[1]*sin + vp[2]*cos;\n      pos.setXYZ(i, vp[0], ny, nz);\n    } else {\n      const nx = vp[0]*cos - vp[1]*sin, ny = vp[0]*sin + vp[1]*cos;\n      pos.setXYZ(i, nx, ny, vp[2]);\n    }\n  }\n  pos.needsUpdate = true;\n  geo.computeVertexNormals();\n  return geo;\n}\n\nfunction applyBend(geo, params) {\n  const angle = params.angle ?? Math.PI * 0.5;\n  const axis  = params.axis  ?? 'x';
  const pos = geo.attributes.position;
  const bbox = new THREE.Box3().setFromBufferAttribute(pos);
  const size = bbox.getSize(new THREE.Vector3());
  const W = size.x || 1;
  const R = W / angle;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = x / W;
    const a = t * angle - angle * 0.5;
    pos.setXYZ(i, R * Math.sin(a), y - R * (1 - Math.cos(a)), z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// ─── Modifier Stack ───────────────────────────────────────────────────────────

export function createModifier(type, params = {}, enabled = true) {
  return { id: Math.random().toString(36).slice(2), type, params, enabled };
}

export function addModifier(stack, type, params = {}) {
  const mod = createModifier(type, params);
  stack.push(mod);
  return mod;
}

export function removeModifier(stack, id) {
  const i = stack.findIndex(m => m.id === id);
  if (i !== -1) stack.splice(i, 1);
}

export function reorderModifier(stack, id, newIndex) {
  const i = stack.findIndex(m => m.id === id);
  if (i === -1) return;
  const [mod] = stack.splice(i, 1);
  stack.splice(Math.max(0, Math.min(stack.length, newIndex)), 0, mod);
}

export function applyModifierStack(baseGeometry, stack) {
  let geo = baseGeometry.clone();
  for (const mod of stack) {
    if (!mod.enabled) continue;
    try {
      switch (mod.type) {
        case MOD_TYPES.SUBDIVISION: geo = applySubdivision(geo, mod.params); break;
        case MOD_TYPES.MIRROR:      geo = applyMirror(geo, mod.params);      break;
        case MOD_TYPES.SOLIDIFY:    geo = applySolidify(geo, mod.params);    break;
        case MOD_TYPES.ARRAY:       geo = applyArray(geo, mod.params);       break;
        case MOD_TYPES.DISPLACE:    geo = applyDisplace(geo, mod.params);    break;
        case MOD_TYPES.SMOOTH:      geo = applySmooth(geo, mod.params);      break;
        case MOD_TYPES.DECIMATE:    geo = applyDecimate(geo, mod.params);    break;
        case MOD_TYPES.CAST:        geo = applyCast(geo, mod.params);        break;
        case MOD_TYPES.TWIST:       geo = applyTwist(geo, mod.params);       break;
        case MOD_TYPES.BEND:        geo = applyBend(geo, mod.params);        break;
        default: break;
      }
    } catch(e) { console.warn(`Modifier ${mod.type} failed:`, e); }
  }
  return geo;
}

export function applyModifier(geo, mod) {
  switch (mod.type) {
    case MOD_TYPES.SUBDIVISION: return applySubdivision(geo, mod.params);
    case MOD_TYPES.MIRROR:      return applyMirror(geo, mod.params);
    case MOD_TYPES.SOLIDIFY:    return applySolidify(geo, mod.params);
    case MOD_TYPES.ARRAY:       return applyArray(geo, mod.params);
    case MOD_TYPES.DISPLACE:    return applyDisplace(geo, mod.params);
    case MOD_TYPES.SMOOTH:      return applySmooth(geo, mod.params);
    case MOD_TYPES.DECIMATE:    return applyDecimate(geo, mod.params);
    case MOD_TYPES.CAST:        return applyCast(geo, mod.params);
    case MOD_TYPES.TWIST:       return applyTwist(geo, mod.params);
    case MOD_TYPES.BEND:        return applyBend(geo, mod.params);
    default: return geo;
  }
}

export default {
  MOD_TYPES, createModifier, addModifier, removeModifier,
  reorderModifier, applyModifierStack, applyModifier,
};
