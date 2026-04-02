/**
 * HairCardUV.js — SPX Mesh Editor
 * UV packing for hair card atlases: slot assignment, planar unwrap,
 * cylindrical unwrap, and seam marking.
 */
import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── UV slot ──────────────────────────────────────────────────────────────────
export class UVSlot {
  constructor(col, row, cols, rows) {
    this.col   = col;
    this.row   = row;
    this.cols  = cols;
    this.rows  = rows;
    this.u     = col / cols;
    this.v     = row / rows;
    this.uw    = 1 / cols;
    this.vh    = 1 / rows;
    this.used  = false;
    this.cardId = null;
  }
  center() { return new THREE.Vector2(this.u + this.uw * 0.5, this.v + this.vh * 0.5); }
  toArray() { return [this.u, this.v, this.uw, this.vh]; }
  toJSON()  { return { col: this.col, row: this.row, cardId: this.cardId, u: this.u, v: this.v, uw: this.uw, vh: this.vh }; }
}

// ─── HairCardUVPacker ─────────────────────────────────────────────────────────
export class HairCardUVPacker {
  constructor(cols = 4, rows = 4, padding = 0.01) {
    this.cols    = cols;
    this.rows    = rows;
    this.padding = padding;
    this.slots   = [];
    this._build();
  }

  _build() {
    this.slots = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.slots.push(new UVSlot(col, row, this.cols, this.rows));
      }
    }
  }

  get totalSlots()  { return this.slots.length; }
  get usedSlots()   { return this.slots.filter(s => s.used).length; }
  get freeSlots()   { return this.slots.filter(s => !s.used).length; }

  // Allocate a slot for a card, returns slot or null
  allocate(cardId) {
    const slot = this.slots.find(s => !s.used);
    if (!slot) return null;
    slot.used   = true;
    slot.cardId = cardId;
    return slot;
  }

  free(cardId) {
    const slot = this.slots.find(s => s.cardId === cardId);
    if (slot) { slot.used = false; slot.cardId = null; }
    return this;
  }

  // Apply UV slot to a card's BufferGeometry
  applyToCard(card, slot) {
    if (!card.geometry) return;
    const uv  = card.geometry.attributes.uv;
    if (!uv)  return;
    const p   = this.padding;
    const u0  = slot.u + p * slot.uw;
    const u1  = slot.u + slot.uw - p * slot.uw;
    const v0  = slot.v + p * slot.vh;
    const v1  = slot.v + slot.vh - p * slot.vh;
    // Remap existing UVs (0-1) into slot space
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i);
      uv.setXY(i, u0 + u * (u1 - u0), v0 + v * (v1 - v0));
    }
    uv.needsUpdate = true;
    card.uvOffset.set(u0, v0);
    card.uvScale.set(u1 - u0, v1 - v0);
  }

  // Pack all cards in a HairCards instance
  packAll(hairCards) {
    this._build();  // Reset
    for (const card of hairCards.cards) {
      const slot = this.allocate(card.id);
      if (!slot) break;
      this.applyToCard(card, slot);
    }
    return this;
  }

  getSlotForCard(cardId) { return this.slots.find(s => s.cardId === cardId) ?? null; }

  toJSON() {
    return { cols: this.cols, rows: this.rows, padding: this.padding,
      used: this.usedSlots, total: this.totalSlots,
      slots: this.slots.filter(s => s.used).map(s => s.toJSON()) };
  }
}

// ─── Planar UV unwrap ─────────────────────────────────────────────────────────
export function planarUnwrap(geo, axis = 'y') {
  const pos = geo.attributes.position;
  const bb  = new THREE.Box3().setFromBufferAttribute(pos);
  const sz  = bb.getSize(new THREE.Vector3());
  const uvArr = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let u, v;
    if (axis === 'y') { u = (x - bb.min.x) / (sz.x || 1); v = (z - bb.min.z) / (sz.z || 1); }
    else if (axis === 'x') { u = (z - bb.min.z) / (sz.z || 1); v = (y - bb.min.y) / (sz.y || 1); }
    else { u = (x - bb.min.x) / (sz.x || 1); v = (y - bb.min.y) / (sz.y || 1); }
    uvArr[i * 2] = u; uvArr[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
  return geo;
}

// ─── Cylindrical UV unwrap ────────────────────────────────────────────────────
export function cylindricalUnwrap(geo, axis = 'y') {
  const pos = geo.attributes.position;
  const bb  = new THREE.Box3().setFromBufferAttribute(pos);
  const sz  = bb.getSize(new THREE.Vector3());
  const uvArr = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let u, v;
    if (axis === 'y') {
      u = (Math.atan2(z, x) + Math.PI) / (Math.PI * 2);
      v = (y - bb.min.y) / (sz.y || 1);
    } else {
      u = (Math.atan2(z, y) + Math.PI) / (Math.PI * 2);
      v = (x - bb.min.x) / (sz.x || 1);
    }
    uvArr[i * 2] = u; uvArr[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
  return geo;
}

// ─── Seam detection ───────────────────────────────────────────────────────────
export function detectUVSeams(geo) {
  const pos = geo.attributes.position;
  const uv  = geo.attributes.uv;
  const idx = geo.index?.array;
  if (!idx || !uv) return [];
  const seams = [];
  const map   = new Map();
  for (let i = 0; i < idx.length; i += 3) {
    for (let e = 0; e < 3; e++) {
      const a = idx[i + e], b = idx[i + (e + 1) % 3];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ a, b, face: i / 3 });
    }
  }
  map.forEach((edges, key) => {
    if (edges.length < 2) return;
    const [e0, e1] = edges;
    const ua0 = uv.getX(e0.a), va0 = uv.getY(e0.a);
    const ua1 = uv.getX(e1.a), va1 = uv.getY(e1.a);
    if (Math.abs(ua0 - ua1) > 0.01 || Math.abs(va0 - va1) > 0.01) seams.push(key);
  });
  return seams;
}

export default HairCardUVPacker;
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
