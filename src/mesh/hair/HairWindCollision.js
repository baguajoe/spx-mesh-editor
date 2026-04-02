/**
 * HairWindCollision.js — SPX Mesh Editor
 * Wind field simulation, sphere/capsule colliders, and per-strand
 * constraint-based physics for hair cards and guide curves.
 */
import * as THREE from 'three';\n\nconst clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));\nconst lerp  = (a, b, t)   => a + (b - a) * t;\n\n// ─── Value noise for wind turbulence ─────────────────────────────────────────\nfunction hash(n) { return Math.sin(n) * 43758.5453 % 1; }\nfunction noise3(x, y, z) {\n  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);\n  const fx = x - ix, fy = y - iy, fz = z - iz;\n  const ux = fx * fx * (3 - 2 * fx);\n  const uy = fy * fy * (3 - 2 * fy);\n  const uz = fz * fz * (3 - 2 * fz);\n  const n000 = hash(ix + iy * 57 + iz * 113);\n  const n100 = hash(ix + 1 + iy * 57 + iz * 113);\n  const n010 = hash(ix + (iy + 1) * 57 + iz * 113);\n  const n110 = hash(ix + 1 + (iy + 1) * 57 + iz * 113);\n  const n001 = hash(ix + iy * 57 + (iz + 1) * 113);\n  const n101 = hash(ix + 1 + iy * 57 + (iz + 1) * 113);\n  const n011 = hash(ix + (iy + 1) * 57 + (iz + 1) * 113);\n  const n111 = hash(ix + 1 + (iy + 1) * 57 + (iz + 1) * 113);\n  return lerp(\n    lerp(lerp(n000, n100, ux), lerp(n010, n110, ux), uy),\n    lerp(lerp(n001, n101, ux), lerp(n011, n111, ux), uy),\n    uz\n  );\n}\n\n// ─── WindField ───────────────────────────────────────────────────────────────\nexport class WindField {\n  constructor(opts = {}) {\n    this.direction    = (opts.direction ?? new THREE.Vector3(1, 0, 0)).clone().normalize();\n    this.strength     = opts.strength    ?? 1.0;\n    this.turbulence   = opts.turbulence  ?? 0.3;\n    this.gustFreq     = opts.gustFreq    ?? 0.5;\n    this.gustStr      = opts.gustStr     ?? 0.4;\n    this.noiseScale   = opts.noiseScale  ?? 0.8;\n    this.noiseSpeed   = opts.noiseSpeed  ?? 0.6;\n    this._time        = 0;\n  }\n\n  // Sample wind force at world position p at time t\n  sample(p, dt = 0.016) {\n    this._time += dt;\n    const t = this._time;\n    const ns = this.noiseScale;\n    const nx = noise3(p.x * ns, p.y * ns, t * this.noiseSpeed);\n    const ny = noise3(p.y * ns, p.z * ns, t * this.noiseSpeed + 1.5);\n    const nz = noise3(p.z * ns, p.x * ns, t * this.noiseSpeed + 3.0);\n    const turbVec = new THREE.Vector3(nx - 0.5, ny - 0.5, nz - 0.5)\n      .multiplyScalar(this.turbulence * 2);\n    // Gust\n    const gust = Math.max(0, Math.sin(t * this.gustFreq * Math.PI * 2)) * this.gustStr;\n    const base = this.direction.clone().multiplyScalar(this.strength + gust);\n    return base.add(turbVec);\n  }\n\n  setDirection(v) { this.direction.copy(v).normalize(); }\n  setStrength(s)  { this.strength = s; }\n}\n\n// ─── Colliders ────────────────────────────────────────────────────────────────\nexport class SphereCollider {\n  constructor(center, radius) {\n    this.center = center.clone();\n    this.radius = radius;\n    this.type   = 'sphere';\n  }\n  // Push point outside sphere, returns true if collision\n  resolve(point, particleRadius = 0.005) {\n    const d = point.distanceTo(this.center);\n    const r = this.radius + particleRadius;\n    if (d < r) {\n      const n = point.clone().sub(this.center).normalize();\n      point.copy(this.center).add(n.multiplyScalar(r));\n      return true;\n    }\n    return false;\n  }\n  update(center) { this.center.copy(center); }\n  toJSON() { return { type: 'sphere', center: this.center.toArray(), radius: this.radius }; }\n}\n\nexport class CapsuleCollider {\n  constructor(a, b, radius) {\n    this.a      = a.clone();\n    this.b      = b.clone();\n    this.radius = radius;\n    this.type   = 'capsule';\n  }\n  // Closest point on segment a-b to p\n  _closestPoint(p) {\n    const ab = this.b.clone().sub(this.a);\n    const t  = clamp(p.clone().sub(this.a).dot(ab) / ab.lengthSq(), 0, 1);\n    return this.a.clone().add(ab.multiplyScalar(t));\n  }\n  resolve(point, particleRadius = 0.005) {\n    const cp = this._closestPoint(point);\n    const d  = point.distanceTo(cp);\n    const r  = this.radius + particleRadius;\n    if (d < r) {\n      const n = point.clone().sub(cp).normalize();\n      point.copy(cp).add(n.multiplyScalar(r));\n      return true;\n    }\n    return false;\n  }\n  update(a, b) { this.a.copy(a); this.b.copy(b); }\n  toJSON() { return { type: 'capsule', a: this.a.toArray(), b: this.b.toArray(), radius: this.radius }; }
}

// ─── HairWindCollision ────────────────────────────────────────────────────────
export class HairWindCollision {
  constructor(opts = {}) {
    this.wind        = opts.wind       ?? new WindField();
    this.colliders   = opts.colliders  ?? [];
    this.gravity     = opts.gravity    ?? new THREE.Vector3(0, -9.8, 0);
    this.damping     = opts.damping    ?? 0.92;
    this.stiffness   = opts.stiffness  ?? 0.6;
    this.iterations  = opts.iterations ?? 4;
    this.dt          = 1 / 60;
    this._particles  = new Map();  // cardId → [{pos, prev, mass}]
  }

  addCollider(c)    { this.colliders.push(c); return this; }
  removeCollider(c) { this.colliders = this.colliders.filter(x => x !== c); }

  // Initialize particle chain for a card
  initCard(card) {
    const pts = card._curve ?? card.buildCurve();
    const particles = pts.map((p, i) => ({
      pos:    p.clone(),
      prev:   p.clone(),
      mass:   i === 0 ? Infinity : card.mass,
      pinned: i === 0,
    }));
    this._particles.set(card.id, particles);
  }

  // Step simulation for all registered cards
  step(cards, dt) {
    const h = dt ?? this.dt;
    const g = this.gravity.clone().multiplyScalar(h * h);

    for (const card of cards) {
      const pts = this._particles.get(card.id);
      if (!pts) continue;

      const windForce = this.wind.sample(pts[0].pos, h).multiplyScalar(h * h / card.mass);

      // Verlet integration
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const vel = p.pos.clone().sub(p.prev).multiplyScalar(this.damping);
        p.prev.copy(p.pos);
        p.pos.add(vel).add(g).add(windForce);
      }

      // Distance constraints
      const restLen = card.length / (pts.length - 1);
      for (let iter = 0; iter < this.iterations; iter++) {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          const diff = b.pos.clone().sub(a.pos);
          const dist = diff.length();
          if (dist < 0.0001) continue;
          const corr = diff.multiplyScalar((dist - restLen) / dist * 0.5);
          if (!a.pinned) a.pos.add(corr);
          if (!b.pinned) b.pos.sub(corr);
        }
      }

      // Stiffness toward rest shape
      const rest = card._curve;
      if (rest) {
        for (let i = 1; i < pts.length; i++) {
          pts[i].pos.lerp(rest[i], this.stiffness * 0.05);
        }
      }

      // Collider resolution
      for (const collider of this.colliders) {
        for (let i = 1; i < pts.length; i++) {
          collider.resolve(pts[i].pos, 0.005);
        }
      }
    }
  }

  // Apply simulated positions back to card geometries
  applyToCards(cards) {
    for (const card of cards) {
      const pts = this._particles.get(card.id);
      if (!pts || !card.geometry) continue;
      const pos = card.geometry.attributes.position;
      const N   = pts.length;
      for (let i = 0; i < N; i++) {
        const p = pts[i].pos;
        const right = card.rootTangent.clone().cross(card.rootNormal).normalize();
        const t = i / (N - 1);
        const w = card.width * (1 - t * (1 - card.widthTaper)) * 0.5;
        const base = i * 2;
        pos.setXYZ(base,     p.x - right.x * w, p.y - right.y * w, p.z - right.z * w);
        pos.setXYZ(base + 1, p.x + right.x * w, p.y + right.y * w, p.z + right.z * w);
      }
      pos.needsUpdate = true;
    }
  }

  dispose() { this._particles.clear(); }
  toJSON()  { return { damping: this.damping, stiffness: this.stiffness, iterations: this.iterations }; }
}

export default HairWindCollision;
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
