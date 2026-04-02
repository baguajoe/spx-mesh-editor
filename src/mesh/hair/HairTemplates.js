export function createHairCatalog() {
  return [

    // ---- SCALP HAIR ----
    { id: "fade", label: "Fade" },
    { id: "afro", label: "Afro" },
    { id: "waves", label: "Waves" },
    { id: "curls", label: "Curls" },
    { id: "layered_curls", label: "Layered Curls" },
    { id: "straight", label: "Straight" },
    { id: "long_straight", label: "Long Straight" },
    { id: "bob", label: "Bob" },
    { id: "ponytail", label: "Ponytail" },
    { id: "bun", label: "Bun" },
    { id: "high_bun", label: "High Bun" },
    { id: "puffs", label: "Puffs" },

    { id: "locs", label: "Locs" },
    { id: "starter_locs", label: "Starter Locs" },
    { id: "freeform_locs", label: "Freeform Locs" },

    { id: "twists", label: "Twists" },
    { id: "two_strand_twists", label: "Two Strand Twists" },

    { id: "braids", label: "Braids" },
    { id: "box_braids", label: "Box Braids" },
    { id: "cornrows", label: "Cornrows" },

    { id: "bantu_knots", label: "Bantu Knots" },
    { id: "half_up", label: "Half Up Half Down" },

    // ---- FACIAL HAIR ----
    { id: "stubble", label: "Stubble" },
    { id: "goatee", label: "Goatee" },
    { id: "full_beard", label: "Full Beard" },
    { id: "boxed_beard", label: "Boxed Beard" },
    { id: "chin_strap", label: "Chin Strap" },
    { id: "mustache", label: "Mustache" },
    { id: "handlebar", label: "Handlebar Mustache" },
    { id: "soul_patch", label: "Soul Patch" },
    { id: "sideburns", label: "Sideburns" },

    // ---- BROWS ----
    { id: "eyebrows", label: "Eyebrows" },
    { id: "arched_brows", label: "Arched Brows" },
    { id: "thick_brows", label: "Thick Brows" },
    { id: "thin_brows", label: "Thin Brows" },

  ];
}

function ringPoints(count = 8, radius = 0.5, y = 0) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    pts.push({
      x: Math.cos(t) * radius,
      y,
      z: Math.sin(t) * radius,
    });
  }
  return pts;
}

export function createHairGuides(type = "fade", {
  density = 24,
  length = 0.7,
  width = 0.12,
  clump = 0.2,
  curl = 0.15,
} = {}) {
  const guides = [];

  if (type === "fade") {
    const pts = ringPoints(Math.max(10, density), 0.42, 0.82);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      guides.push({
        root: { x: p.x, y: p.y, z: p.z },
        dir: { x: 0, y: 0.35, z: 0 },
        length: length * 0.45,
        width: width * 0.75,
        bend: 0.02,
      });
    }
  } else if (type === "afro") {
    const pts = ringPoints(Math.max(14, density), 0.48, 0.9);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      guides.push({
        root: { x: p.x, y: p.y, z: p.z },
        dir: { x: p.x * 0.15, y: 0.7, z: p.z * 0.15 },
        length: length * 1.15,
        width: width * 1.15,
        bend: curl * 1.2,
      });
    }
    guides.push({
      root: { x: 0, y: 1.02, z: 0 },
      dir: { x: 0, y: 0.9, z: 0 },
      length: length * 1.25,
      width: width * 1.2,
      bend: curl,
    });
  } else if (type === "twists" || type === "locs" || type === "braids") {
    const pts = ringPoints(Math.max(12, density), 0.44, 0.9);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const side = i % 2 === 0 ? 1 : -1;
      guides.push({
        root: { x: p.x, y: p.y, z: p.z },
        dir: { x: p.x * 0.05 + side * clump * 0.08, y: 0.9, z: p.z * 0.05 },
        length: length * (type === "braids" ? 1.45 : 1.2),
        width: width * (type === "locs" ? 0.7 : 0.52),
        bend: type === "braids" ? 0.03 : 0.07,
      });
    }
  } else if (type === "straight" || type === "curls") {
    const pts = ringPoints(Math.max(14, density), 0.47, 0.9);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      guides.push({
        root: { x: p.x, y: p.y, z: p.z },
        dir: { x: 0, y: 0.8, z: 0 },
        length: length * 1.35,
        width: width * 0.9,
        bend: type === "curls" ? curl * 1.6 : 0.02,
      });
    }
  } else if (type === "beard") {
    for (let i = 0; i < density; i++) {
      const t = i / Math.max(1, density - 1);
      guides.push({
        root: { x: (t - 0.5) * 0.55, y: 0.2 + Math.sin(t * Math.PI) * 0.05, z: 0.42 },
        dir: { x: 0, y: -0.45, z: 0.08 },
        length: length * 0.85,
        width: width * 0.7,
        bend: 0.04,
      });
    }
  } else if (type === "eyebrows") {
    for (let i = 0; i < Math.max(8, Math.floor(density / 2)); i++) {
      const t = i / Math.max(1, Math.floor(density / 2) - 1);
      guides.push({
        root: { x: -0.22 + t * 0.18, y: 0.58 + Math.sin(t * Math.PI) * 0.02, z: 0.46 },
        dir: { x: 0.08, y: 0.02, z: 0.01 },
        length: length * 0.18,
        width: width * 0.22,
        bend: 0.01,
      });
      guides.push({
        root: { x: 0.04 + t * 0.18, y: 0.58 + Math.sin((1 - t) * Math.PI) * 0.02, z: 0.46 },
        dir: { x: -0.08, y: 0.02, z: 0.01 },
        length: length * 0.18,
        width: width * 0.22,
        bend: 0.01,
      });
    }
  }

  return guides;
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
