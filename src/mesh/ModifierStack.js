// ModifierStack.js — Non-Destructive Modifier Stack (SubDiv + Mirror + Boolean + more)
// SPX Mesh Editor | StreamPireX

import * as THREE from 'three';
import { catmullClarkSubdivide } from './SubdivisionSurface.js';

export const MOD_TYPES = {
  SUBDIVISION: 'SUBDIVISION',
  MIRROR:      'MIRROR',
  BOOLEAN:     'BOOLEAN',
  SOLIDIFY:    'SOLIDIFY',
  BEVEL:       'BEVEL',
};

function mergeGeometries(geos) {
  let totalVerts = 0;
  geos.forEach(g => { totalVerts += g.attributes.position.count; });
  const positions = new Float32Array(totalVerts * 3);
  const indices = [];
  let vOffset = 0;
  geos.forEach(g => {
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      positions[(vOffset + i) * 3]     = pos.getX(i);
      positions[(vOffset + i) * 3 + 1] = pos.getY(i);
      positions[(vOffset + i) * 3 + 2] = pos.getZ(i);
    }
    if (g.index) Array.from(g.index.array).forEach(i => indices.push(i + vOffset));
    vOffset += pos.count;
  });
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (indices.length) merged.setIndex(indices);
  merged.computeVertexNormals();
  return merged;
}

function applySubdivision(geo, params) {
  return catmullClarkSubdivide(geo, params.levels ?? 1);
}

function applyMirror(geo, params) {
  const axis = params.axis ?? 'x';
  const original = geo.clone();
  const mirrored = geo.clone();
  const pos = mirrored.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (axis === 'x') pos.setX(i, -pos.getX(i));
    if (axis === 'y') pos.setY(i, -pos.getY(i));
    if (axis === 'z') pos.setZ(i, -pos.getZ(i));
  }
  pos.needsUpdate = true;
  if (mirrored.index) {
    const idx = mirrored.index.array;
    for (let i = 0; i < idx.length; i += 3) {
      const tmp = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = tmp;
    }
    mirrored.index.needsUpdate = true;
  }
  return mergeGeometries([original, mirrored]);
}

function applyBoolean(geo, params) {
  if (!params.targetGeometry) return geo;
  console.warn('[ModifierStack] Boolean: wire three-bvh-csg for full CSG ops');
  return geo;
}

function applySolidify(geo, params) {
  const thickness = params.thickness ?? 0.05;
  const g = geo.clone();
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const norm = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      pos.getX(i) + norm.getX(i) * thickness,
      pos.getY(i) + norm.getY(i) * thickness,
      pos.getZ(i) + norm.getZ(i) * thickness,
    );
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

function applyBevel(geo, params) {
  const amount = params.amount ?? 0.02;
  const g = geo.clone();
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const norm = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      pos.getX(i) + norm.getX(i) * amount * 0.5,
      pos.getY(i) + norm.getY(i) * amount * 0.5,
      pos.getZ(i) + norm.getZ(i) * amount * 0.5,
    );
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

const APPLIERS = {
  [MOD_TYPES.SUBDIVISION]: applySubdivision,
  [MOD_TYPES.MIRROR]:      applyMirror,
  [MOD_TYPES.BOOLEAN]:     applyBoolean,
  [MOD_TYPES.SOLIDIFY]:    applySolidify,
  [MOD_TYPES.BEVEL]:       applyBevel,
};

export class ModifierStack {
  constructor(mesh) {
    this.mesh = mesh;
    this.originalGeometry = mesh.geometry.clone();
    this.modifiers = [];
    this._idCounter = 0;
    this.onChange = null;
  }

  add(type, params = {}, label = null) {
    const mod = { id: ++this._idCounter, type, label: label || this._defaultLabel(type), enabled: true, params };
    this.modifiers.push(mod);
    this.apply();
    return mod.id;
  }

  remove(id) { this.modifiers = this.modifiers.filter(m => m.id !== id); this.apply(); }
  toggle(id, enabled) { const m = this.modifiers.find(m => m.id === id); if (m) { m.enabled = enabled; this.apply(); } }
  updateParams(id, params) { const m = this.modifiers.find(m => m.id === id); if (m) { Object.assign(m.params, params); this.apply(); } }
  moveUp(id) { const i = this.modifiers.findIndex(m => m.id === id); if (i > 0) { [this.modifiers[i-1], this.modifiers[i]] = [this.modifiers[i], this.modifiers[i-1]]; this.apply(); } }
  moveDown(id) { const i = this.modifiers.findIndex(m => m.id === id); if (i < this.modifiers.length - 1) { [this.modifiers[i], this.modifiers[i+1]] = [this.modifiers[i+1], this.modifiers[i]]; this.apply(); } }

  apply() {
    let geo = this.originalGeometry.clone();
    for (const mod of this.modifiers) {
      if (!mod.enabled) continue;
      const fn = APPLIERS[mod.type];
      if (fn) { try { geo = fn(geo, mod.params) || geo; } catch(e) { console.error(`[ModifierStack] ${mod.type} failed:`, e); } }
    }
    this.mesh.geometry.dispose();
    this.mesh.geometry = geo;
    if (this.onChange) this.onChange(this.modifiers);
  }

  updateOriginal(newGeo) { this.originalGeometry.dispose(); this.originalGeometry = newGeo.clone(); this.apply(); }
  applyAll() { this.originalGeometry.dispose(); this.originalGeometry = this.mesh.geometry.clone(); this.modifiers = []; if (this.onChange) this.onChange([]); }
  serialize() { return this.modifiers.map(m => ({ ...m, params: { ...m.params, targetGeometry: undefined } })); }
  dispose() { this.originalGeometry.dispose(); }
  _defaultLabel(type) { return { SUBDIVISION:'Subdivision Surface', MIRROR:'Mirror', BOOLEAN:'Boolean', SOLIDIFY:'Solidify', BEVEL:'Bevel' }[type] || type; }
}

export default ModifierStack;
