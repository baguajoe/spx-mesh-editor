/**
 * HairAdvancedEditing.js — SPX Mesh Editor
 * Advanced hair editing: guide curve interpolation, strand clustering,
 * symmetry, spline shaping, select-by-mask, and advanced cut operations.
 */
import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t)   => a + (b - a) * t;

// ─── Catmull-Rom interpolation for guide curves ───────────────────────────
export function catmullRomPoint(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t * t * t;
  return new THREE.Vector3(
    0.5 * ((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
    0.5 * ((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
    0.5 * ((2*p1.z) + (-p0.z+p2.z)*t + (2*p0.z-5*p1.z+4*p2.z-p3.z)*t2 + (-p0.z+3*p1.z-3*p2.z+p3.z)*t3),
  );
}

export function buildGuideCurve(controlPoints, segments = 20) {
  if (controlPoints.length < 2) return controlPoints;
  const pts = [];
  for (let i = 0; i < controlPoints.length - 1; i++) {
    const p0 = controlPoints[Math.max(0, i-1)];
    const p1 = controlPoints[i];
    const p2 = controlPoints[Math.min(controlPoints.length-1, i+1)];
    const p3 = controlPoints[Math.min(controlPoints.length-1, i+2)];
    for (let s = 0; s < segments; s++) {
      pts.push(catmullRomPoint(p0, p1, p2, p3, s / segments));
    }
  }
  pts.push(controlPoints[controlPoints.length-1]);
  return pts;
}

// ─── Strand interpolation ─────────────────────────────────────────────────
export function interpolateStrandsToGuide(strands, guide, strength = 0.5) {
  return strands.map(strand => {
    const newCurve = strand.curve.map((pt, i) => {
      const t       = i / (strand.curve.length - 1);
      const guidePt = sampleCurveAt(guide, t);
      return pt.clone().lerp(guidePt, strength);
    });
    return { ...strand, curve: newCurve };
  });
}

export function sampleCurveAt(curve, t) {
  if (curve.length === 0) return new THREE.Vector3();
  if (curve.length === 1) return curve[0].clone();
  const idx = clamp(t * (curve.length - 1), 0, curve.length - 1);
  const lo  = Math.floor(idx), hi = Math.ceil(idx);
  const frac = idx - lo;
  return curve[lo].clone().lerp(curve[hi] ?? curve[lo], frac);
}

// ─── Strand clustering ────────────────────────────────────────────────────
export function clusterStrands(strands, clumpCount, strength = 0.4) {
  if (clumpCount <= 0 || strands.length === 0) return strands;
  const k = Math.min(clumpCount, strands.length);
  // K-means centers (init from evenly-spaced strands)
  let centers = Array.from({ length: k }, (_, i) =>
    strands[Math.floor((i / k) * strands.length)].rootPos.clone()
  );
  // One pass of assignment + centroid update
  const assignments = new Array(strands.length).fill(0);
  strands.forEach((s, si) => {
    let best = 0, bestDist = Infinity;
    centers.forEach((c, ci) => {
      const d = s.rootPos.distanceTo(c);
      if (d < bestDist) { bestDist = d; best = ci; }
    });
    assignments[si] = best;
  });
  const newCenters = centers.map(() => new THREE.Vector3());
  const counts     = new Array(k).fill(0);
  strands.forEach((s, si) => { newCenters[assignments[si]].add(s.rootPos); counts[assignments[si]]++; });
  newCenters.forEach((c, i) => { if (counts[i]) c.divideScalar(counts[i]); });
  // Move strands toward their cluster center
  return strands.map((strand, si) => {
    const center = newCenters[assignments[si]];
    const newCurve = strand.curve.map((pt, pi) => {
      if (pi === 0) return pt.clone();
      const t = pi / (strand.curve.length - 1);
      return pt.clone().add(center.clone().sub(strand.rootPos).multiplyScalar(strength * t * 0.3));
    });
    return { ...strand, curve: newCurve };
  });
}

// ─── Symmetry ─────────────────────────────────────────────────────────────
export class HairSymmetry {
  constructor(axis = 'X', threshold = 0.02) {
    this.axis      = axis;
    this.threshold = threshold;
  }
  findMirror(strand, strands) {
    const mp = this._mirrorPos(strand.rootPos);
    return strands.find(s => s.rootPos.distanceTo(mp) < this.threshold && s.id !== strand.id);
  }
  _mirrorPos(pos) {
    const m = pos.clone();
    if (this.axis === 'X') m.x = -m.x;
    if (this.axis === 'Y') m.y = -m.y;
    if (this.axis === 'Z') m.z = -m.z;
    return m;
  }
  mirrorAll(strands) {
    return strands.map(strand => {
      const mirror = this.findMirror(strand, strands);
      if (!mirror) return strand;
      const newCurve = strand.curve.map((pt, i) => {
        const mPt = mirror.curve[i] ?? pt;
        return this._mirrorPos(mPt);
      });
      return { ...strand, curve: newCurve };
    });
  }
}

// ─── Spline shaper ────────────────────────────────────────────────────────
export class SplineHairShaper {
  constructor() {
    this.controlPts = [];
  }
  addControlPoint(pt) { this.controlPts.push(pt.clone()); return this; }
  removeControlPoint(idx) { this.controlPts.splice(idx, 1); return this; }
  moveControlPoint(idx, pos) { if (this.controlPts[idx]) this.controlPts[idx].copy(pos); return this; }

  apply(strands, strength = 1.0) {
    if (this.controlPts.length < 2) return strands;
    const guide = buildGuideCurve(this.controlPts, 30);
    return interpolateStrandsToGuide(strands, guide, strength);
  }

  toJSON() { return { controlPts: this.controlPts.map(p => p.toArray()) }; }
  fromJSON(data) {
    this.controlPts = data.controlPts.map(p => new THREE.Vector3(...p));
    return this;
  }
}

// ─── Selection mask ───────────────────────────────────────────────────────
export class StrandSelectionMask {
  constructor(strands) {
    this.mask = new Float32Array(strands.length).fill(1);
    this.strands = strands;
  }
  selectAll()  { this.mask.fill(1); }
  selectNone() { this.mask.fill(0); }
  invert()     { this.mask = this.mask.map(v => 1 - v); }

  selectByLength(minLen, maxLen) {
    this.strands.forEach((s, i) => {
      this.mask[i] = s.length >= minLen && s.length <= maxLen ? 1 : 0;
    });
  }
  selectByAngle(maxAngle, up = new THREE.Vector3(0, 1, 0)) {
    this.strands.forEach((s, i) => {
      const dot = Math.abs(s.rootNormal.dot(up));
      this.mask[i] = Math.acos(clamp(dot, 0, 1)) <= maxAngle ? 1 : 0;
    });
  }
  selectByRadius(center, radius) {
    this.strands.forEach((s, i) => {
      this.mask[i] = s.rootPos.distanceTo(center) <= radius ? 1 : 0;
    });
  }
  selectRandom(density) {
    this.strands.forEach((_, i) => { this.mask[i] = Math.random() < density ? 1 : 0; });
  }
  getSelected() { return this.strands.filter((_, i) => this.mask[i] > 0.5); }
  getCount()    { return this.mask.filter(v => v > 0.5).length; }
  applyWeight(fn) { return (strands, ...args) => fn(this.getSelected(), ...args).concat(this.strands.filter((_,i)=>this.mask[i]<=0.5)); }
}

// ─── Advanced cut ─────────────────────────────────────────────────────────
export function cutToLength(strands, targetLength, mask = null) {
  return strands.map((strand, i) => {
    if (mask && mask.mask[i] <= 0.5) return strand;
    if (strand.length <= targetLength) return strand;
    const ratio = targetLength / strand.length;
    const newCurve = strand.curve.map((pt, pi) => {
      const t = pi / (strand.curve.length - 1);
      if (t <= ratio) return pt.clone();
      const root = strand.rootPos;
      const dir  = strand.curve[strand.curve.length-1].clone().sub(root).normalize();
      return root.clone().add(dir.multiplyScalar(targetLength * t));
    });
    return { ...strand, curve: newCurve, length: targetLength };
  });
}

export function cutByPlane(strands, planeNormal, planePoint, mask = null) {
  return strands.map((strand, i) => {
    if (mask && mask.mask[i] <= 0.5) return strand;
    const newCurve = [];
    for (let j = 0; j < strand.curve.length; j++) {
      const pt   = strand.curve[j];
      const side = pt.clone().sub(planePoint).dot(planeNormal);
      if (side >= 0) newCurve.push(pt.clone());
      else {
        if (j > 0) {
          const prev  = strand.curve[j-1];
          const dPrev = prev.clone().sub(planePoint).dot(planeNormal);
          const t     = dPrev / (dPrev - side);
          newCurve.push(prev.clone().lerp(pt, t));
        }
        break;
      }
    }
    if (newCurve.length < 2) return strand;
    const newLen = newCurve[0].distanceTo(newCurve[newCurve.length-1]);
    return { ...strand, curve: newCurve, length: newLen };
  });
}

export default { buildGuideCurve, clusterStrands, HairSymmetry, SplineHairShaper, StrandSelectionMask, cutToLength, cutByPlane };
