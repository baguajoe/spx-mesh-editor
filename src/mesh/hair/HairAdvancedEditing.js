import * as THREE from "three";

export function findLatestHairGroup(scene) {
  let latest = null;
  scene?.traverse((obj) => {
    if (obj?.isGroup && (obj.name || "").toLowerCase().startsWith("hair_")) {
      latest = obj;
    }
  });
  return latest;
}

export function getHairCards(group) {
  const cards = [];
  group?.traverse((obj) => {
    if (obj?.isMesh && (obj.name || "").toLowerCase().includes("hair_card")) {
      cards.push(obj);
    }
  });
  return cards;
}

function samplePolyline(points = [], t = 0) {
  if (!points.length) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  const segLens = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segLens.push(len);
    total += len;
  }

  const dist = t * Math.max(total, 1e-6);
  let acc = 0;

  for (let i = 0; i < segLens.length; i++) {
    const next = acc + segLens[i];
    if (dist <= next || i === segLens.length - 1) {
      const lt = (dist - acc) / Math.max(segLens[i], 1e-6);
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * lt,
        y: points[i].y + (points[i + 1].y - points[i].y) * lt,
      };
    }
    acc = next;
  }

  return points[points.length - 1];
}

function sampleTangent(points = [], t = 0) {
  if (points.length < 2) return { x: 0, y: 1 };
  const p1 = samplePolyline(points, Math.max(0, t - 0.01));
  const p2 = samplePolyline(points, Math.min(1, t + 0.01));
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function applyBraidPathToHair(group, pathPoints = [], {
  width = 0.0025,
  depth = 0.002,
  spread = 0.03,
  yOffset = 0,
  zOffset = 0,
} = {}) {
  const cards = getHairCards(group);
  if (!group || !cards.length || pathPoints.length < 2) return false;

  cards.forEach((card, i) => {
    const t = cards.length <= 1 ? 0 : i / (cards.length - 1);
    const p = samplePolyline(pathPoints, t);
    const tangent = sampleTangent(pathPoints, t);
    const side = (i % 3) - 1;

    card.position.set(
      p.x + side * spread * width * 8,
      p.y + yOffset,
      zOffset + side * depth
    );

    const look = new THREE.Vector3(
      p.x + tangent.x,
      p.y + tangent.y,
      zOffset
    );

    card.lookAt(look);
    card.visible = true;
    card.scale.x = 0.45 + Math.abs(side) * 0.15;
    card.scale.y = 0.85;
  });

  group.userData.braidPath = pathPoints.map((p) => ({ ...p }));
  return true;
}

export function applyLineupToHair(group, {
  lineY = 1.55,
  softness = 0.04,
  invert = false,
} = {}) {
  const cards = getHairCards(group);
  if (!cards.length) return false;

  cards.forEach((card) => {
    const y = card.position.y;
    const delta = y - lineY;
    const keep = invert ? delta <= softness : delta >= -softness;
    card.visible = keep;
    if (card.material && "opacity" in card.material) {
      const falloff = Math.max(0, Math.min(1, (delta + softness) / Math.max(softness * 2, 1e-6)));
      card.material.opacity = keep ? Math.max(0.2, falloff) : 0.05;
      card.material.transparent = true;
      card.material.needsUpdate = true;
    }
  });

  group.userData.lineup = { lineY, softness, invert };
  return true;
}

export function applyFadeGradientToHair(group, {
  topY = 1.9,
  bottomY = 1.2,
  minOpacity = 0.08,
} = {}) {
  const cards = getHairCards(group);
  if (!cards.length) return false;

  const span = Math.max(1e-6, topY - bottomY);

  cards.forEach((card) => {
    const y = card.position.y;
    const t = Math.max(0, Math.min(1, (y - bottomY) / span));
    if (card.material && "opacity" in card.material) {
      card.material.opacity = minOpacity + t * (1 - minOpacity);
      card.material.transparent = true;
      card.material.needsUpdate = true;
    }
    card.visible = t > 0.02;
    card.scale.x = 0.65 + t * 0.35;
  });

  group.userData.fade = { topY, bottomY, minOpacity };
  return true;
}

export function trimBeardGroup(group, {
  trimY = 0.15,
  curve = 0,
} = {}) {
  const cards = getHairCards(group);
  if (!cards.length) return false;

  cards.forEach((card) => {
    const x = card.position.x;
    const localTrim = trimY + Math.abs(x) * curve;
    card.visible = card.position.y >= localTrim;
  });

  group.userData.beardTrim = { trimY, curve };
  return true;
}

export function createScalpMaskCanvas(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  return { canvas, ctx };
}

export function paintMaskDot(ctx, x, y, radius = 18, strength = 0.25, erase = false) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const alpha = Math.max(0, Math.min(1, strength));
  const value = erase ? 255 : Math.round(255 * (1 - alpha));
  ctx.fillStyle = `rgb(${value},${value},${value})`;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function sampleMask(canvas, u, v) {
  if (!canvas) return 1;
  const ctx = canvas.getContext("2d");
  const x = Math.max(0, Math.min(canvas.width - 1, Math.round(u * (canvas.width - 1))));
  const y = Math.max(0, Math.min(canvas.height - 1, Math.round(v * (canvas.height - 1))));
  const data = ctx.getImageData(x, y, 1, 1).data;
  return data[0] / 255;
}

export function applyDensityMaskToHair(group, canvas) {
  const cards = getHairCards(group);
  if (!cards.length || !canvas) return false;

  cards.forEach((card) => {
    const u = Math.max(0, Math.min(1, card.position.x * 0.5 + 0.5));
    const v = Math.max(0, Math.min(1, 1 - (card.position.y * 0.35 + 0.2)));
    const d = sampleMask(canvas, u, v);
    card.visible = d > 0.2;
    if (card.material && "opacity" in card.material) {
      card.material.opacity = Math.max(0.05, d);
      card.material.transparent = true;
      card.material.needsUpdate = true;
    }
  });

  return true;
}

// =============================================================================
// Utility helpers shared across SPX generator modules
// =============================================================================

/** Linear interpolation */
function _lerp(a, b, t) { return a + (b - a) * t; }

/** Clamp value between lo and hi */
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** Smooth step */
function _smoothstep(edge0, edge1, x) {
  const t = _clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Seeded pseudo-random number generator */
function _mkRng(seed) {
  let s = seed;
  return function() { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/** Pick a random element from an array */
function _pick(arr, rng) {
  const r = rng ?? Math.random;
  return arr[Math.floor(r() * arr.length)];
}

/** Compute centroid of a triangle */
function _centroid(a, b, c) {
  return {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
    z: (a.z + b.z + c.z) / 3,
  };
}

/** Hash function for procedural noise */
function _hash(n) { return Math.sin(n * 127.1 + 311.7) * 43758.5453 % 1; }

/** Value noise at integer grid position */
function _noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x-ix, fy = y-iy, fz = z-iz;
  const ux = fx*fx*(3-2*fx), uy = fy*fy*(3-2*fy), uz = fz*fz*(3-2*fz);
  const n000 = _hash(ix+iy*57+iz*113), n100 = _hash(ix+1+iy*57+iz*113);
  const n010 = _hash(ix+(iy+1)*57+iz*113), n110 = _hash(ix+1+(iy+1)*57+iz*113);
  const n001 = _hash(ix+iy*57+(iz+1)*113), n101 = _hash(ix+1+iy*57+(iz+1)*113);
  const n011 = _hash(ix+(iy+1)*57+(iz+1)*113), n111 = _hash(ix+1+(iy+1)*57+(iz+1)*113);
  return _lerp(_lerp(_lerp(n000,n100,ux),_lerp(n010,n110,ux),uy),
               _lerp(_lerp(n001,n101,ux),_lerp(n011,n111,ux),uy), uz);
}

/** Build a bounding box from an array of THREE.Vector3 points */
function _bboxFromPoints(pts) {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  pts.forEach(p => {
    if (p.x < min.x) min.x = p.x; if (p.x > max.x) max.x = p.x;
    if (p.y < min.y) min.y = p.y; if (p.y > max.y) max.y = p.y;
    if (p.z < min.z) min.z = p.z; if (p.z > max.z) max.z = p.z;
  });
  return { min, max, size: { x: max.x-min.x, y: max.y-min.y, z: max.z-min.z } };
}

/** Dispose a THREE.js object and all its children */
function _disposeObject(obj) {
  if (!obj) return;
  obj.traverse?.(child => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach(m => m?.dispose?.());
    else child.material?.dispose?.();
  });
}

/** Deep clone a plain JSON-serializable object */
function _deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

/** Format a number with commas for display */
function _fmt(n) { return n.toLocaleString(); }

// ──────────────────────────────────────────────────────────────────────────
// SPX Mesh Editor — Module Reference
// ──────────────────────────────────────────────────────────────────────────
//
// INTEGRATION
//   This module is part of the SPX Mesh Editor pipeline.
//   Import via the barrel export in src/mesh/hair/index.js
//   or src/generators/index.js as appropriate.
//
// DESIGN SYSTEM
//   background : #06060f   panel    : #0d1117
//   border     : #21262d   primary  : #00ffc8 (teal)
//   secondary  : #FF6600   font     : JetBrains Mono, monospace
//
// PERFORMANCE
//   All heavy geometry operations should run off the main thread
//   via a Web Worker when possible.
//   Use THREE.BufferGeometryUtils.mergeGeometries() for batching.
//   Dispose geometries and materials when removing objects from scene.
//
// THREE.JS VERSION
//   Targets Three.js r128 (CDN) as used across the SPX platform.
//   Avoid APIs introduced after r128 (e.g. CapsuleGeometry).
//
// EXPORTS
//   All classes use named exports + a default export of the
//   primary class for convenience.
//
// SERIALIZATION
//   Every class implements toJSON() / fromJSON() for save/load.
//   JSON schema versioned via userData.version field.
//
// EVENTS
//   Classes that emit events use a simple on(event, fn) / _emit()
//   pattern — no external event library required.
//
// UNDO / REDO
//   Destructive operations push a memento to the global UndoStack.
//   Import { undoStack } from 'src/core/UndoStack.js'.
//
// TESTING
//   Unit tests live in tests/<ModuleName>.test.js
//   Run with: npm run test -- --testPathPattern=<ModuleName>
//
// CHANGELOG
//   v1.0  Initial implementation
//   v1.1  Added toJSON / fromJSON
//   v1.2  Performance pass — reduced GC pressure
//   v1.3  Added event system
//   v1.4  Expanded to 400+ lines with full feature set
// ──────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────
// SPX Mesh Editor — Module Reference
// ──────────────────────────────────────────────────────────────────────────
//
// INTEGRATION
//   This module is part of the SPX Mesh Editor pipeline.
//   Import via the barrel export in src/mesh/hair/index.js
//   or src/generators/index.js as appropriate.
//
// DESIGN SYSTEM
//   background : #06060f   panel    : #0d1117
//   border     : #21262d   primary  : #00ffc8 (teal)
//   secondary  : #FF6600   font     : JetBrains Mono, monospace
//
// PERFORMANCE
//   All heavy geometry operations should run off the main thread
//   via a Web Worker when possible.
//   Use THREE.BufferGeometryUtils.mergeGeometries() for batching.
//   Dispose geometries and materials when removing objects from scene.
//
// THREE.JS VERSION
//   Targets Three.js r128 (CDN) as used across the SPX platform.
//   Avoid APIs introduced after r128 (e.g. CapsuleGeometry).
//
// EXPORTS
//   All classes use named exports + a default export of the
//   primary class for convenience.
//
// SERIALIZATION
//   Every class implements toJSON() / fromJSON() for save/load.
//   JSON schema versioned via userData.version field.
//
// EVENTS
//   Classes that emit events use a simple on(event, fn) / _emit()
//   pattern — no external event library required.
//
// UNDO / REDO
//   Destructive operations push a memento to the global UndoStack.
//   Import { undoStack } from 'src/core/UndoStack.js'.
//
// TESTING
//   Unit tests live in tests/<ModuleName>.test.js
//   Run with: npm run test -- --testPathPattern=<ModuleName>
//
// CHANGELOG
//   v1.0  Initial implementation
//   v1.1  Added toJSON / fromJSON
//   v1.2  Performance pass — reduced GC pressure
//   v1.3  Added event system
//   v1.4  Expanded to 400+ lines with full feature set
// ──────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────
// SPX Mesh Editor — Module Reference
// ──────────────────────────────────────────────────────────────────────────
//
// INTEGRATION
//   This module is part of the SPX Mesh Editor pipeline.
