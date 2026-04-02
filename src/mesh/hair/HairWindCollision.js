/**
 * HairWindCollision.js — SPX Mesh Editor
 * Wind field simulation, sphere/capsule colliders, and per-strand
 * constraint-based physics for hair cards and guide curves.
 */
import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t)   => a + (b - a) * t;

// ─── Value noise for wind turbulence ─────────────────────────────────────────
function hash(n) { return Math.sin(n) * 43758.5453 % 1; }
function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const n000 = hash(ix + iy * 57 + iz * 113);
  const n100 = hash(ix + 1 + iy * 57 + iz * 113);
  const n010 = hash(ix + (iy + 1) * 57 + iz * 113);
  const n110 = hash(ix + 1 + (iy + 1) * 57 + iz * 113);
  const n001 = hash(ix + iy * 57 + (iz + 1) * 113);
  const n101 = hash(ix + 1 + iy * 57 + (iz + 1) * 113);
  const n011 = hash(ix + (iy + 1) * 57 + (iz + 1) * 113);
  const n111 = hash(ix + 1 + (iy + 1) * 57 + (iz + 1) * 113);
  return lerp(
    lerp(lerp(n000, n100, ux), lerp(n010, n110, ux), uy),
    lerp(lerp(n001, n101, ux), lerp(n011, n111, ux), uy),
    uz
  );
}

// ─── WindField ───────────────────────────────────────────────────────────────
export class WindField {
  constructor(opts = {}) {
    this.direction    = (opts.direction ?? new THREE.Vector3(1, 0, 0)).clone().normalize();
    this.strength     = opts.strength    ?? 1.0;
    this.turbulence   = opts.turbulence  ?? 0.3;
    this.gustFreq     = opts.gustFreq    ?? 0.5;
    this.gustStr      = opts.gustStr     ?? 0.4;
    this.noiseScale   = opts.noiseScale  ?? 0.8;
    this.noiseSpeed   = opts.noiseSpeed  ?? 0.6;
    this._time        = 0;
  }

  // Sample wind force at world position p at time t
  sample(p, dt = 0.016) {
    this._time += dt;
    const t = this._time;
    const ns = this.noiseScale;
    const nx = noise3(p.x * ns, p.y * ns, t * this.noiseSpeed);
    const ny = noise3(p.y * ns, p.z * ns, t * this.noiseSpeed + 1.5);
    const nz = noise3(p.z * ns, p.x * ns, t * this.noiseSpeed + 3.0);
    const turbVec = new THREE.Vector3(nx - 0.5, ny - 0.5, nz - 0.5)
      .multiplyScalar(this.turbulence * 2);
    // Gust
    const gust = Math.max(0, Math.sin(t * this.gustFreq * Math.PI * 2)) * this.gustStr;
    const base = this.direction.clone().multiplyScalar(this.strength + gust);
    return base.add(turbVec);
  }

  setDirection(v) { this.direction.copy(v).normalize(); }
  setStrength(s)  { this.strength = s; }
}

// ─── Colliders ────────────────────────────────────────────────────────────────
export class SphereCollider {
  constructor(center, radius) {
    this.center = center.clone();
    this.radius = radius;
    this.type   = 'sphere';
  }
  // Push point outside sphere, returns true if collision
  resolve(point, particleRadius = 0.005) {
    const d = point.distanceTo(this.center);
    const r = this.radius + particleRadius;
    if (d < r) {
      const n = point.clone().sub(this.center).normalize();
      point.copy(this.center).add(n.multiplyScalar(r));
      return true;
    }
    return false;
  }
  update(center) { this.center.copy(center); }
  toJSON() { return { type: 'sphere', center: this.center.toArray(), radius: this.radius }; }
}

export class CapsuleCollider {
  constructor(a, b, radius) {
    this.a      = a.clone();
    this.b      = b.clone();
    this.radius = radius;
    this.type   = 'capsule';
  }
  // Closest point on segment a-b to p
  _closestPoint(p) {
    const ab = this.b.clone().sub(this.a);
    const t  = clamp(p.clone().sub(this.a).dot(ab) / ab.lengthSq(), 0, 1);
    return this.a.clone().add(ab.multiplyScalar(t));
  }
  resolve(point, particleRadius = 0.005) {
    const cp = this._closestPoint(point);
    const d  = point.distanceTo(cp);
    const r  = this.radius + particleRadius;
    if (d < r) {
      const n = point.clone().sub(cp).normalize();
      point.copy(cp).add(n.multiplyScalar(r));
      return true;
    }
    return false;
  }
  update(a, b) { this.a.copy(a); this.b.copy(b); }
  toJSON() { return { type: 'capsule', a: this.a.toArray(), b: this.b.toArray(), radius: this.radius }; }
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
