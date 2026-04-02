/**
 * SkinningSystem.js — SPX Mesh Editor
 * Linear blend skinning (LBS), dual-quaternion skinning (DQS),
 * corrective shapes, per-vertex weight painting, and skin transfer.
 */
import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Weight map ───────────────────────────────────────────────────────────
export class VertexWeightMap {
  constructor(vertexCount, boneCount) {
    this.vertexCount = vertexCount;
    this.boneCount   = boneCount;
    this.maxInfluences = 4;
    this.boneIndices = new Uint16Array(vertexCount * this.maxInfluences);
    this.boneWeights = new Float32Array(vertexCount * this.maxInfluences);
  }

  setWeights(vertexIdx, influences) {
    const base = vertexIdx * this.maxInfluences;
    const sorted = [...influences].sort((a, b) => b.weight - a.weight).slice(0, this.maxInfluences);
    const total  = sorted.reduce((s, i) => s + i.weight, 0) || 1;
    sorted.forEach((inf, i) => {
      this.boneIndices[base + i] = inf.boneIndex;
      this.boneWeights[base + i] = inf.weight / total;
    });
    for (let i = sorted.length; i < this.maxInfluences; i++) {
      this.boneIndices[base + i] = 0;
      this.boneWeights[base + i] = 0;
    }
  }

  getWeights(vertexIdx) {
    const base = vertexIdx * this.maxInfluences;
    const result = [];
    for (let i = 0; i < this.maxInfluences; i++) {
      const w = this.boneWeights[base + i];
      if (w > 0.001) result.push({ boneIndex: this.boneIndices[base + i], weight: w });
    }
    return result;
  }

  normalize() {
    for (let v = 0; v < this.vertexCount; v++) {
      const base  = v * this.maxInfluences;
      const total = Array.from({ length:this.maxInfluences }, (_,i) => this.boneWeights[base+i]).reduce((s,w)=>s+w,0);
      if (total > 0) for (let i = 0; i < this.maxInfluences; i++) this.boneWeights[base+i] /= total;
    }
  }

  paintWeight(vertexIdx, boneIndex, weight, brushFalloff = 1.0) {
    const influences = this.getWeights(vertexIdx);
    const existing   = influences.find(i => i.boneIndex === boneIndex);
    if (existing) existing.weight = clamp(existing.weight + weight * brushFalloff, 0, 1);
    else influences.push({ boneIndex, weight: clamp(weight * brushFalloff, 0, 1) });
    this.setWeights(vertexIdx, influences);
  }

  smoothWeights(vertexIdx, neighbors, iterations = 1) {
    for (let iter = 0; iter < iterations; iter++) {
      const allInfluences = new Map();
      neighbors.forEach(nb => {
        this.getWeights(nb).forEach(({ boneIndex, weight }) => {
          allInfluences.set(boneIndex, (allInfluences.get(boneIndex) ?? 0) + weight / neighbors.length);
        });
      });
      const current = this.getWeights(vertexIdx);
      const smoothed = current.map(({ boneIndex, weight }) => ({
        boneIndex, weight: lerp(weight, allInfluences.get(boneIndex) ?? 0, 0.5),
      }));
      this.setWeights(vertexIdx, smoothed);
    }
  }

  toBufferAttributes() {
    return {
      skinIndex:  new THREE.Uint16BufferAttribute(this.boneIndices, this.maxInfluences),
      skinWeight: new THREE.Float32BufferAttribute(this.boneWeights, this.maxInfluences),
    };
  }

  toJSON() {
    return { vertexCount: this.vertexCount, boneCount: this.boneCount,
      indices: Array.from(this.boneIndices), weights: Array.from(this.boneWeights) };
  }

  static fromJSON(data) {
    const wm = new VertexWeightMap(data.vertexCount, data.boneCount);
    wm.boneIndices.set(data.indices);
    wm.boneWeights.set(data.weights);
    return wm;
  }
}

const lerp = (a, b, t) => a + (b - a) * t;

// ─── LBS (Linear Blend Skinning) ─────────────────────────────────────────
export function computeLBS(restPos, skeleton, weightMap, vertexIdx) {
  const influences = weightMap.getWeights(vertexIdx);
  const result     = new THREE.Vector3();
  influences.forEach(({ boneIndex, weight }) => {
    const bone = skeleton.bones[boneIndex];
    if (!bone) return;
    const skinned = restPos.clone().applyMatrix4(
      bone.matrixWorld.clone().multiply(skeleton.boneInverses[boneIndex])
    );
    result.add(skinned.multiplyScalar(weight));
  });
  return result;
}

// ─── Dual quaternion skinning ─────────────────────────────────────────────
export class DualQuaternion {
  constructor() {
    this.real = new THREE.Quaternion();
    this.dual = new THREE.Quaternion(0, 0, 0, 0);
  }

  fromMatrix(mat) {
    const pos  = new THREE.Vector3().setFromMatrixPosition(mat);
    const quat = new THREE.Quaternion().setFromRotationMatrix(mat);
    this.real.copy(quat);
    const t = new THREE.Quaternion(pos.x * 0.5, pos.y * 0.5, pos.z * 0.5, 0);
    this.dual.copy(t).premultiply(quat);
    return this;
  }

  add(other, weight) {
    this.real.x += other.real.x * weight; this.real.y += other.real.y * weight;
    this.real.z += other.real.z * weight; this.real.w += other.real.w * weight;
    this.dual.x += other.dual.x * weight; this.dual.y += other.dual.y * weight;
    this.dual.z += other.dual.z * weight; this.dual.w += other.dual.w * weight;
    return this;
  }

  normalize() {
    const len = this.real.length();
    if (len < 0.0001) return this;
    this.real.x/=len; this.real.y/=len; this.real.z/=len; this.real.w/=len;
    this.dual.x/=len; this.dual.y/=len; this.dual.z/=len; this.dual.w/=len;
    return this;
  }

  transformPoint(pt) {
    const r = this.real;
    const d = this.dual;
    const tx = 2.0 * (-d.w*r.x + d.x*r.w - d.y*r.z + d.z*r.y);
    const ty = 2.0 * (-d.w*r.y + d.x*r.z + d.y*r.w - d.z*r.x);
    const tz = 2.0 * (-d.w*r.z - d.x*r.y + d.y*r.x + d.z*r.w);
    return pt.clone().applyQuaternion(r).add(new THREE.Vector3(tx, ty, tz));
  }
}

// ─── Corrective shapes ────────────────────────────────────────────────────
export class CorrectiveShapeDriver {
  constructor(bones) {
    this.bones  = bones;
    this.shapes = [];
  }

  addShape(name, triggerBone, triggerAngle, deltaPositions, weight = 1.0) {
    this.shapes.push({ name, triggerBone, triggerAngle, deltaPositions, weight });
  }

  evaluate(geometry) {
    const pos = geometry.attributes.position;
    this.shapes.forEach(shape => {
      const bone = this.bones.find(b => b.name === shape.triggerBone);
      if (!bone) return;
      const angle  = bone.rotation.x;
      const blend  = clamp(Math.abs(angle) / Math.max(Math.abs(shape.triggerAngle), 0.001), 0, 1) * shape.weight;
      if (blend < 0.001) return;
      shape.deltaPositions.forEach(({ index, delta }) => {
        pos.setXYZ(index,
          pos.getX(index) + delta.x * blend,
          pos.getY(index) + delta.y * blend,
          pos.getZ(index) + delta.z * blend,
        );
      });
    });
    pos.needsUpdate = true;
  }

  toJSON() { return { shapes: this.shapes.map(s => ({ ...s, deltaPositions: s.deltaPositions.slice(0, 5) })) }; }
}

// ─── Skin transfer ────────────────────────────────────────────────────────
export function transferWeights(sourceWeightMap, sourceGeometry, targetGeometry, k = 4) {
  const srcPos = sourceGeometry.attributes.position;
  const tgtPos = targetGeometry.attributes.position;
  const result = new VertexWeightMap(tgtPos.count, sourceWeightMap.boneCount);
  for (let vi = 0; vi < tgtPos.count; vi++) {
    const tp = new THREE.Vector3().fromBufferAttribute(tgtPos, vi);
    const distances = [];
    for (let si = 0; si < srcPos.count; si++) {
      const sp = new THREE.Vector3().fromBufferAttribute(srcPos, si);
      distances.push({ idx: si, dist: tp.distanceTo(sp) });
    }
    distances.sort((a, b) => a.dist - b.dist);
    const nearest = distances.slice(0, k);
    const totalInvDist = nearest.reduce((s, n) => s + (n.dist < 0.0001 ? 1e6 : 1/n.dist), 0);
    const blended = new Map();
    nearest.forEach(n => {
      const w = n.dist < 0.0001 ? 1e6 : 1/n.dist;
      sourceWeightMap.getWeights(n.idx).forEach(({ boneIndex, weight }) => {
        blended.set(boneIndex, (blended.get(boneIndex) ?? 0) + weight * w / totalInvDist);
      });
    });
    result.setWeights(vi, [...blended.entries()].map(([boneIndex, weight]) => ({ boneIndex, weight })));
  }
  return result;
}

// ─── SkinningSystem ───────────────────────────────────────────────────────
export class SkinningSystem {
  constructor(skeleton, opts = {}) {
    this.skeleton    = skeleton;
    this.mode        = opts.mode       ?? 'LBS';
    this.weightMap   = null;
    this.correctives = null;
    this._enabled    = true;
  }

  attachGeometry(geometry, weightMap) {
    this.weightMap = weightMap;
    const attrs = weightMap.toBufferAttributes();
    geometry.setAttribute('skinIndex',  attrs.skinIndex);
    geometry.setAttribute('skinWeight', attrs.skinWeight);
    return this;
  }

  addCorrectives(driver) { this.correctives = driver; return this; }

  update(geometry) {
    if (!this._enabled) return;
    this.correctives?.evaluate(geometry);
  }

  setMode(mode) { this.mode = mode; }
  enable()      { this._enabled = true;  }
  disable()     { this._enabled = false; }

  toJSON() {
    return { mode: this.mode, boneCount: this.skeleton?.bones?.length ?? 0,
      hasWeightMap: !!this.weightMap, hasCorrectiveShapes: !!this.correctives };
  }
}

export default SkinningSystem;
