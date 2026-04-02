/**
 * HairAdvancedEditing.js — SPX Mesh Editor
 * Advanced hair editing: guide curve interpolation, strand clustering,
 * symmetry, spline shaping, select-by-mask, and advanced cut operations.
 */
import * as THREE from 'three';\n\nconst clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));\nconst lerp  = (a, b, t)   => a + (b - a) * t;\n\n// ─── Catmull-Rom interpolation for guide curves ───────────────────────────\nexport function catmullRomPoint(p0, p1, p2, p3, t) {\n  const t2 = t * t, t3 = t * t * t;\n  return new THREE.Vector3(\n    0.5 * ((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),\n    0.5 * ((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3),\n    0.5 * ((2*p1.z) + (-p0.z+p2.z)*t + (2*p0.z-5*p1.z+4*p2.z-p3.z)*t2 + (-p0.z+3*p1.z-3*p2.z+p3.z)*t3),\n  );\n}\n\nexport function buildGuideCurve(controlPoints, segments = 20) {\n  if (controlPoints.length < 2) return controlPoints;\n  const pts = [];\n  for (let i = 0; i < controlPoints.length - 1; i++) {\n    const p0 = controlPoints[Math.max(0, i-1)];\n    const p1 = controlPoints[i];\n    const p2 = controlPoints[Math.min(controlPoints.length-1, i+1)];\n    const p3 = controlPoints[Math.min(controlPoints.length-1, i+2)];\n    for (let s = 0; s < segments; s++) {\n      pts.push(catmullRomPoint(p0, p1, p2, p3, s / segments));\n    }\n  }\n  pts.push(controlPoints[controlPoints.length-1]);\n  return pts;\n}\n\n// ─── Strand interpolation ─────────────────────────────────────────────────\nexport function interpolateStrandsToGuide(strands, guide, strength = 0.5) {\n  return strands.map(strand => {\n    const newCurve = strand.curve.map((pt, i) => {\n      const t       = i / (strand.curve.length - 1);\n      const guidePt = sampleCurveAt(guide, t);\n      return pt.clone().lerp(guidePt, strength);\n    });\n    return { ...strand, curve: newCurve };\n  });\n}\n\nexport function sampleCurveAt(curve, t) {\n  if (curve.length === 0) return new THREE.Vector3();\n  if (curve.length === 1) return curve[0].clone();\n  const idx = clamp(t * (curve.length - 1), 0, curve.length - 1);\n  const lo  = Math.floor(idx), hi = Math.ceil(idx);\n  const frac = idx - lo;\n  return curve[lo].clone().lerp(curve[hi] ?? curve[lo], frac);\n}\n\n// ─── Strand clustering ────────────────────────────────────────────────────\nexport function clusterStrands(strands, clumpCount, strength = 0.4) {\n  if (clumpCount <= 0 || strands.length === 0) return strands;\n  const k = Math.min(clumpCount, strands.length);\n  // K-means centers (init from evenly-spaced strands)\n  let centers = Array.from({ length: k }, (_, i) =>\n    strands[Math.floor((i / k) * strands.length)].rootPos.clone()\n  );\n  // One pass of assignment + centroid update\n  const assignments = new Array(strands.length).fill(0);\n  strands.forEach((s, si) => {\n    let best = 0, bestDist = Infinity;\n    centers.forEach((c, ci) => {\n      const d = s.rootPos.distanceTo(c);\n      if (d < bestDist) { bestDist = d; best = ci; }\n    });\n    assignments[si] = best;\n  });\n  const newCenters = centers.map(() => new THREE.Vector3());\n  const counts     = new Array(k).fill(0);\n  strands.forEach((s, si) => { newCenters[assignments[si]].add(s.rootPos); counts[assignments[si]]++; });\n  newCenters.forEach((c, i) => { if (counts[i]) c.divideScalar(counts[i]); });\n  // Move strands toward their cluster center\n  return strands.map((strand, si) => {\n    const center = newCenters[assignments[si]];\n    const newCurve = strand.curve.map((pt, pi) => {\n      if (pi === 0) return pt.clone();\n      const t = pi / (strand.curve.length - 1);\n      return pt.clone().add(center.clone().sub(strand.rootPos).multiplyScalar(strength * t * 0.3));\n    });\n    return { ...strand, curve: newCurve };\n  });\n}\n\n// ─── Symmetry ─────────────────────────────────────────────────────────────\nexport class HairSymmetry {\n  constructor(axis = 'X', threshold = 0.02) {\n    this.axis      = axis;\n    this.threshold = threshold;\n  }\n  findMirror(strand, strands) {\n    const mp = this._mirrorPos(strand.rootPos);\n    return strands.find(s => s.rootPos.distanceTo(mp) < this.threshold && s.id !== strand.id);\n  }\n  _mirrorPos(pos) {\n    const m = pos.clone();\n    if (this.axis === 'X') m.x = -m.x;\n    if (this.axis === 'Y') m.y = -m.y;\n    if (this.axis === 'Z') m.z = -m.z;
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

export function subdivideStrand(strand, times = 1) {
  let curve = strand.curve;
  for (let t = 0; t < times; t++) {
    const newCurve = [curve[0].clone()];
    for (let i = 0; i < curve.length - 1; i++) {
      newCurve.push(curve[i].clone().lerp(curve[i+1], 0.5));
      newCurve.push(curve[i+1].clone());
    }
    curve = newCurve;
  }
  return { ...strand, curve };
}

export function decimateStrand(strand, targetSegments) {
  const current = strand.curve.length - 1;
  if (current <= targetSegments) return strand;
  const step = current / targetSegments;
  const newCurve = Array.from({ length: targetSegments + 1 }, (_, i) => {
    const idx = Math.min(Math.round(i * step), strand.curve.length - 1);
    return strand.curve[idx].clone();
  });
  return { ...strand, curve: newCurve };
}

export function offsetStrandRoot(strand, offset) {
  const newCurve = strand.curve.map(p => p.clone().add(offset));
  return { ...strand, rootPos: strand.rootPos.clone().add(offset), curve: newCurve };
}

export function rotateStrandAroundRoot(strand, axis, angle) {
  const newCurve = strand.curve.map((p, i) => {
    if (i === 0) return p.clone();
    return p.clone().sub(strand.rootPos).applyAxisAngle(axis, angle).add(strand.rootPos);
  });
  return { ...strand, curve: newCurve };
}

export function mergeStrandSets(setA, setB) {
  const maxId = Math.max(...setA.map(s => s.id), 0);
  const reindexed = setB.map((s, i) => ({ ...s, id: maxId + 1 + i }));
  return [...setA, ...reindexed];
}

export function splitStrandSet(strands, predicate) {
  const matching    = strands.filter(predicate);
  const nonMatching = strands.filter(s => !predicate(s));
  return { matching, nonMatching };
}

export function computeStrandBounds(strands) {
  if (!strands.length) return null;
  const min = new THREE.Vector3( Infinity,  Infinity,  Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  strands.forEach(s => s.curve.forEach(p => { min.min(p); max.max(p); }));
  return { min, max, center: min.clone().add(max).multiplyScalar(0.5), size: max.clone().sub(min) };
}

export function normalizeStrandLengths(strands, targetLength) {
  return strands.map(strand => {
    const actual = strand.curve.reduce((s, p, i) => i===0 ? 0 : s + p.distanceTo(strand.curve[i-1]), 0);
    if (Math.abs(actual - targetLength) < 0.001) return strand;
    const scale    = targetLength / Math.max(actual, 0.001);
    const newCurve = strand.curve.map((p, i) => {
      if (i === 0) return p.clone();
      const dir = p.clone().sub(strand.rootPos);
      return strand.rootPos.clone().add(dir.multiplyScalar(scale));
    });
    return { ...strand, curve: newCurve, length: targetLength };
  });
}

export function computeHairBoundingCapsule(strands) {
  const bounds = computeStrandBounds(strands);
  if (!bounds) return null;
  const height = bounds.size.y;
  const radius = Math.max(bounds.size.x, bounds.size.z) * 0.5;
  return { center: bounds.center, height, radius };
}

export function projectStrandsOntoSphere(strands, radius) {
  return strands.map(strand => {
    const newCurve = strand.curve.map((pt, i) => {
      if (i === 0) return pt.clone().normalize().multiplyScalar(radius);
      return pt.clone();
    });
    return { ...strand, rootPos: strand.rootPos.clone().normalize().multiplyScalar(radius), curve: newCurve };
  });
}
export function jitterStrandRoots(strands, amount, seed=42) {
  let s = seed;
  const rng = () => { s=(s*9301+49297)%233280; return s/233280-0.5; };
  return strands.map(strand => {
    const jitter = new THREE.Vector3(rng()*amount, rng()*amount*0.5, rng()*amount);
    const newPos  = strand.rootPos.clone().add(jitter);
    const newCurve = strand.curve.map((p,i) => i===0 ? newPos.clone() : p.clone().add(jitter));
    return { ...strand, rootPos: newPos, curve: newCurve };
  });
}
export function alignStrandsToNormal(strands, normal) {
  const n = normal.clone().normalize();
  return strands.map(strand => {
    const currentDir = strand.curve[strand.curve.length-1].clone().sub(strand.rootPos).normalize();
    const angle  = currentDir.angleTo(n);
    if (angle < 0.01) return strand;
    const axis   = currentDir.clone().cross(n).normalize();
    const newCurve = strand.curve.map((p,i) => {
      if (i===0) return p.clone();
      return p.clone().sub(strand.rootPos).applyAxisAngle(axis, angle * 0.5).add(strand.rootPos);
    });
    return { ...strand, curve: newCurve };
  });
}
export function getStrandDistribution(strands, resolution=10) {
  const grid = new Array(resolution*resolution).fill(0);
  strands.forEach(s => {
    const u = Math.floor(Math.min(0.999, (s.rootPos.x+1)*0.5)*resolution);
    const v = Math.floor(Math.min(0.999, (s.rootPos.z+1)*0.5)*resolution);
    grid[v*resolution+u]++;
  });
  return { grid, resolution, min:Math.min(...grid), max:Math.max(...grid) };
}

export function snapToGrid(strands, gridSize=0.01) {
  return strands.map(s=>({
    ...s,
    rootPos: new THREE.Vector3(
      Math.round(s.rootPos.x/gridSize)*gridSize,
      Math.round(s.rootPos.y/gridSize)*gridSize,
      Math.round(s.rootPos.z/gridSize)*gridSize,
    ),
  }));
}
export function createStrandFromPoints(id, points, normalDir) {
  const rootPos    = points[0].clone();
  const rootNormal = normalDir ?? points[points.length-1].clone().sub(rootPos).normalize();
  const length     = points.reduce((s,p,i)=>i===0?0:s+p.distanceTo(points[i-1]),0);
  return { id, rootPos, rootNormal, curve: points.map(p=>p.clone()), length };
}
export function applyNoiseToStrands(strands, strength, frequency, seed=1) {
  let s=seed; const rng=()=>{s=(s*9301+49297)%233280;return s/233280-0.5;};
  return strands.map(strand=>({
    ...strand,
    curve: strand.curve.map((p,i)=>{
      if(i===0) return p.clone();
      const t = i/(strand.curve.length-1);
      return p.clone().add(new THREE.Vector3(rng(),rng(),rng()).multiplyScalar(strength*t));
    }),
  }));
}
export function computeHairFlowField(strands, resolution=20) {
  const grid = new Array(resolution*resolution).fill(null).map(()=>new THREE.Vector3());
  const counts = new Array(resolution*resolution).fill(0);
  strands.forEach(s=>{
    const u = Math.floor(Math.min(0.999,(s.rootPos.x+1)*0.5)*resolution);
    const v = Math.floor(Math.min(0.999,(s.rootPos.z+1)*0.5)*resolution);
    const idx = v*resolution+u;
    const dir = s.curve[s.curve.length-1].clone().sub(s.rootPos).normalize();
    grid[idx].add(dir);
    counts[idx]++;
  });
  grid.forEach((g,i)=>{if(counts[i]>0) g.divideScalar(counts[i]);});
  return { grid, counts, resolution };
}
export function filterStrandsByMask(strands, mask) {
  return strands.filter((_,i)=>(mask[i]??1)>0.5);
}
export function getStrandRoot(strand) { return strand.rootPos.clone(); }
export function getStrandTip(strand) { return strand.curve[strand.curve.length-1]?.clone()??strand.rootPos.clone(); }
export function setStrandLength(strand, targetLen) {
  const dir = getStrandTip(strand).sub(strand.rootPos).normalize();
  const newCurve = strand.curve.map((_,i)=>{
    const t = i/(strand.curve.length-1);
    return strand.rootPos.clone().add(dir.clone().multiplyScalar(targetLen*t));
  });
  return {...strand, curve:newCurve, length:targetLen};
}

export function buildHairEditingAPI(strands) {
  let current=[...strands];
  const history=[];
  return {
    get strands() { return current; },
    exec(fn,...args) { history.push(current.map(s=>({...s,curve:s.curve.map(p=>p.clone()),rootPos:s.rootPos.clone()}))); current=fn(current,...args); return this; },
    undo() { if(history.length) current=history.pop(); return this; },
    canUndo() { return history.length>0; },
    select(pred) { return current.filter(pred); },
    count() { return current.length; },
  };
}
export function randomizeStrandCurls(strands, minCurl, maxCurl, seed=42) {
  let s=seed; const rng=()=>{s=(s*9301+49297)%233280;return s/233280;};
  return strands.map(strand=>{
    const curlAmt=minCurl+rng()*(maxCurl-minCurl);
    const freq=2+rng()*3;
    const right=strand.rootNormal.clone().cross(new THREE.Vector3(0,1,0)).normalize();
    const newCurve=strand.curve.map((pt,i)=>{
      if(i===0) return pt.clone();
      const t=i/(strand.curve.length-1);
      const offset=right.clone().multiplyScalar(Math.sin(t*Math.PI*2*freq)*curlAmt*t*0.04);
      return pt.clone().add(offset);
    });
    return {...strand,curve:newCurve};
  });
}
export function getEditingStats(strands) {
  const bounds=computeStrandBounds(strands);
  const stats=strands.reduce((acc,s)=>{
    const len=s.curve.reduce((sum,p,i)=>i===0?0:sum+p.distanceTo(s.curve[i-1]),0);
    acc.totalLength+=len; acc.minLength=Math.min(acc.minLength,len); acc.maxLength=Math.max(acc.maxLength,len);
    return acc;
  },{totalLength:0,minLength:Infinity,maxLength:-Infinity});
  return {...stats,avgLength:stats.totalLength/Math.max(1,strands.length),bounds,count:strands.length};
}
