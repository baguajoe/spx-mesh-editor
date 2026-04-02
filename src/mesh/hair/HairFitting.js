/**
 * HairFitting.js — SPX Mesh Editor
 * Fits hair cards to a scalp mesh using BVH-accelerated triangle sampling,
 * barycentric projection, and shrink-wrap snapping.
 */
import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Simple BVH node for triangle acceleration ────────────────────────────────
class BVHNode {
  constructor(tris, depth = 0) {
    this.bbox  = new THREE.Box3();
    this.left  = null;
    this.right = null;
    this.tris  = null;
    tris.forEach(t => {
      this.bbox.expandByPoint(t.a);
      this.bbox.expandByPoint(t.b);
      this.bbox.expandByPoint(t.c);
    });
    if (tris.length <= 4 || depth > 16) { this.tris = tris; return; }
    const sz   = this.bbox.getSize(new THREE.Vector3());
    const axis = sz.x > sz.y && sz.x > sz.z ? 'x' : sz.y > sz.z ? 'y' : 'z';
    const mid  = (this.bbox.min[axis] + this.bbox.max[axis]) * 0.5;
    const L    = tris.filter(t => t.centroid[axis] <= mid);
    const R    = tris.filter(t => t.centroid[axis] >  mid);
    if (L.length && R.length) {
      this.left  = new BVHNode(L, depth + 1);
      this.right = new BVHNode(R, depth + 1);
    } else {
      this.tris = tris;
    }
  }

  // Closest point on triangle abc to p
  _triClosest(p, a, b, c) {
    const ab = b.clone().sub(a), ac = c.clone().sub(a), ap = p.clone().sub(a);
    const d1 = ab.dot(ap), d2 = ac.dot(ap);
    if (d1 <= 0 && d2 <= 0) return { pt: a.clone(), bary: new THREE.Vector3(1, 0, 0) };
    const bp  = p.clone().sub(b);
    const d3  = ab.dot(bp), d4 = ac.dot(bp);
    if (d3 >= 0 && d4 <= d3) return { pt: b.clone(), bary: new THREE.Vector3(0, 1, 0) };
    const cp  = p.clone().sub(c);
    const d5  = ab.dot(cp), d6 = ac.dot(cp);
    if (d6 >= 0 && d5 <= d6) return { pt: c.clone(), bary: new THREE.Vector3(0, 0, 1) };
    const vc  = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v = d1 / (d1 - d3);
      return { pt: a.clone().add(ab.multiplyScalar(v)), bary: new THREE.Vector3(1 - v, v, 0) };
    }
    const vb  = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w = d2 / (d2 - d6);
      return { pt: a.clone().add(ac.multiplyScalar(w)), bary: new THREE.Vector3(1 - w, 0, w) };
    }
    const va  = d3 * d6 - d5 * d4;
    if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
      const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
      return { pt: b.clone().add(c.clone().sub(b).multiplyScalar(w)), bary: new THREE.Vector3(0, 1 - w, w) };
    }
    const denom = 1 / (va + vb + vc);
    const v = vb * denom, w = vc * denom;
    const pt = a.clone().add(ab.clone().multiplyScalar(v)).add(ac.clone().multiplyScalar(w));
    return { pt, bary: new THREE.Vector3(1 - v - w, v, w) };
  }

  closestPoint(p) {
    if (this.tris) {
      let best = null, bestDist = Infinity;
      for (const t of this.tris) {
        const { pt, bary } = this._triClosest(p, t.a, t.b, t.c);
        const d = pt.distanceToSquared(p);
        if (d < bestDist) { bestDist = d; best = { pt, bary, tri: t, dist: Math.sqrt(d) }; }
      }
      return best;
    }
    const dL = this.left  ? this.left.bbox.distanceToPoint(p)  : Infinity;
    const dR = this.right ? this.right.bbox.distanceToPoint(p) : Infinity;
    const [first, second] = dL < dR
      ? [this.left, this.right] : [this.right, this.left];
    let best = first?.closestPoint(p) ?? null;
    if (second && second.bbox.distanceToPoint(p) < (best?.dist ?? Infinity)) {
      const r = second.closestPoint(p);
      if (r && (!best || r.dist < best.dist)) best = r;
    }
    return best;
  }
}

// ─── ScalpSampler ─────────────────────────────────────────────────────────────
export class ScalpSampler {
  constructor(scalpGeo) {
    this._bvh = null;
    if (scalpGeo) this.build(scalpGeo);
  }

  build(geo) {
    const pos = geo.attributes.position;
    const idx = geo.index?.array;
    const N   = idx ? idx.length / 3 : pos.count / 3;
    const tris = [];
    for (let i = 0; i < N; i++) {
      const i0 = idx ? idx[i*3]   : i*3;
      const i1 = idx ? idx[i*3+1] : i*3+1;
      const i2 = idx ? idx[i*3+2] : i*3+2;
      const a  = new THREE.Vector3().fromBufferAttribute(pos, i0);
      const b  = new THREE.Vector3().fromBufferAttribute(pos, i1);
      const c  = new THREE.Vector3().fromBufferAttribute(pos, i2);
      tris.push({ a, b, c, centroid: a.clone().add(b).add(c).divideScalar(3), normal: new THREE.Triangle(a, b, c).getNormal(new THREE.Vector3()) });
    }
    this._bvh = new BVHNode(tris);
    return this;
  }

  // Project a point onto the scalp
  project(point) {
    return this._bvh?.closestPoint(point) ?? null;
  }

  // Sample N random positions on the scalp surface
  sampleRandom(count, seed = 42) {
    let s = seed;
    const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const results = [];
    if (!this._bvh) return results;
    const tris = this._collectTris(this._bvh);
    // Weighted random by triangle area
    const areas = tris.map(t => new THREE.Triangle(t.a, t.b, t.c).getArea());
    const total = areas.reduce((a, b) => a + b, 0);
    for (let n = 0; n < count; n++) {
      let r = rng() * total, i = 0;
      while (i < areas.length - 1 && r > areas[i]) { r -= areas[i++]; }
      const t = tris[i];
      const u = rng(), v = rng() * (1 - u);
      const pt = t.a.clone()
        .multiplyScalar(1 - u - v)
        .add(t.b.clone().multiplyScalar(u))
        .add(t.c.clone().multiplyScalar(v));
      results.push({ pos: pt, normal: t.normal.clone(), tri: t });
    }
    return results;
  }

  _collectTris(node) {
    if (node.tris) return node.tris;
    return [
      ...(node.left  ? this._collectTris(node.left)  : []),
      ...(node.right ? this._collectTris(node.right) : []),
    ];
  }
}

// ─── HairFitter ────────────────────────────────────────────────────────────────
export class HairFitter {
  constructor(opts = {}) {
    this.sampler      = opts.sampler ?? null;
    this.snapStrength = opts.snapStrength ?? 0.8;
    this.normalOffset = opts.normalOffset ?? 0.002;  // lift off scalp
  }

  // Fit card root positions to the scalp
  fitCards(cards) {
    if (!this.sampler) return cards;
    for (const card of cards) {
      const hit = this.sampler.project(card.rootPos);
      if (!hit) continue;
      card.rootPos.copy(hit.pt)
        .add(hit.tri.normal.clone().multiplyScalar(this.normalOffset));
      card.rootNormal.copy(hit.tri.normal);
    }
    return cards;
  }

  // Shrink-wrap all curve points toward the scalp
  shrinkWrap(cards, iterations = 2) {
    if (!this.sampler) return cards;
    for (let iter = 0; iter < iterations; iter++) {
      for (const card of cards) {
        const pts = card._curve;
        if (!pts) continue;
        for (let i = 0; i < pts.length; i++) {
          const hit = this.sampler.project(pts[i]);
          if (!hit) continue;
          const t = i / (pts.length - 1);
          const str = this.snapStrength * (1 - t * 0.8);
          pts[i].lerp(hit.pt.add(hit.tri.normal.clone().multiplyScalar(this.normalOffset)), str);
        }
      }
    }
    return cards;
  }

  toJSON() {
    return { snapStrength: this.snapStrength, normalOffset: this.normalOffset };
  }
}

export default HairFitter;
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
