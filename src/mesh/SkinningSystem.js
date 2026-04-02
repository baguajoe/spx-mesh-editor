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

export function buildAutomaticWeights(geometry, skeleton, maxInfluences = 4) {
  const pos     = geometry.attributes.position;
  const wm      = new VertexWeightMap(pos.count, skeleton.bones.length);
  for (let vi = 0; vi < pos.count; vi++) {
    const vp     = new THREE.Vector3().fromBufferAttribute(pos, vi);
    const dists  = skeleton.bones.map((bone, bi) => ({
      boneIndex: bi,
      dist:      vp.distanceTo(new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld)),
    })).sort((a, b) => a.dist - b.dist).slice(0, maxInfluences);
    const totalInv = dists.reduce((s, d) => s + (d.dist < 0.001 ? 1e6 : 1/d.dist), 0);
    wm.setWeights(vi, dists.map(d => ({
      boneIndex: d.boneIndex,
      weight: d.dist < 0.001 ? 1e6/totalInv : (1/d.dist)/totalInv,
    })));
  }
  return wm;
}

export function visualizeWeights(geometry, weightMap, boneIndex) {
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let vi = 0; vi < geometry.attributes.position.count; vi++) {
    const weights  = weightMap.getWeights(vi);
    const boneW    = weights.find(w => w.boneIndex === boneIndex)?.weight ?? 0;
    const r = boneW, g = 0.1, b = 1 - boneW;
    colors[vi*3]=r; colors[vi*3+1]=g; colors[vi*3+2]=b;
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

export function getHeaviestBone(weightMap, vertexIdx) {
  const weights = weightMap.getWeights(vertexIdx);
  if (!weights.length) return null;
  return weights.reduce((best, w) => w.weight > best.weight ? w : best);
}

export function computeWeightVariance(weightMap, boneIndex) {
  let sum = 0, sumSq = 0, count = 0;
  for (let vi = 0; vi < weightMap.vertexCount; vi++) {
    const w = weightMap.getWeights(vi).find(inf => inf.boneIndex === boneIndex)?.weight ?? 0;
    if (w > 0.001) { sum += w; sumSq += w*w; count++; }
  }
  if (!count) return { mean:0, variance:0, stddev:0 };
  const mean = sum / count;
  return { mean, variance: sumSq/count - mean*mean, stddev: Math.sqrt(sumSq/count - mean*mean) };
}

export function mirrorWeights(weightMap, geometry, axis = 'X', threshold = 0.01) {
  const pos     = geometry.attributes.position;
  const mirrored = new VertexWeightMap(weightMap.vertexCount, weightMap.boneCount);
  for (let vi = 0; vi < weightMap.vertexCount; vi++) {
    const vp    = new THREE.Vector3().fromBufferAttribute(pos, vi);
    const mirrorPos = vp.clone();
    if (axis === 'X') mirrorPos.x = -mirrorPos.x;
    let closest = -1, closestDist = Infinity;
    for (let vj = 0; vj < pos.count; vj++) {
      const d = new THREE.Vector3().fromBufferAttribute(pos, vj).distanceTo(mirrorPos);
      if (d < closestDist && d < threshold) { closestDist = d; closest = vj; }
    }
    if (closest >= 0) mirrored.setWeights(vi, weightMap.getWeights(closest));
    else              mirrored.setWeights(vi, weightMap.getWeights(vi));
  }
  return mirrored;
}

export function getSkinningReport(skinningSystem, weightMap) {
  const unweighted = [], multiInfluence = [];
  for (let vi = 0; vi < weightMap.vertexCount; vi++) {
    const w = weightMap.getWeights(vi);
    if (!w.length)  unweighted.push(vi);
    if (w.length>2) multiInfluence.push(vi);
  }
  return {
    totalVertices:      weightMap.vertexCount,
    unweightedVertices: unweighted.length,
    multiInfluenceVerts:multiInfluence.length,
    mode:               skinningSystem.mode,
    hasCorrectiveShapes:!!skinningSystem.correctives,
  };
}

export function computeBoneInfluenceZones(skeleton, geometry, radius=0.15) {
  const pos    = geometry.attributes.position;
  const zones  = new Map();
  skeleton.bones.forEach((bone, bi) => {
    const bonePos = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
    const verts   = [];
    for (let vi=0; vi<pos.count; vi++) {
      const vp = new THREE.Vector3().fromBufferAttribute(pos, vi);
      if (vp.distanceTo(bonePos) <= radius) verts.push(vi);
    }
    zones.set(bi, verts);
  });
  return zones;
}
export function validateSkinning(weightMap, geometry) {
  const pos    = geometry.attributes.position;
  const errors = [];
  for (let vi=0; vi<pos.count; vi++) {
    const ws = weightMap.getWeights(vi);
    if (!ws.length) errors.push({type:'unweighted', vertex:vi});
    const total = ws.reduce((s,w)=>s+w.weight,0);
    if (Math.abs(total-1.0) > 0.01) errors.push({type:'unnormalized', vertex:vi, total});
  }
  return {valid:errors.length===0, errors, vertexCount:pos.count};
}
export function getWeightPaintInfo(weightMap, boneIndex) {
  const colored=[], uncolored=[];
  for (let vi=0; vi<weightMap.vertexCount; vi++) {
    const ws = weightMap.getWeights(vi);
    const w  = ws.find(x=>x.boneIndex===boneIndex);
    if (w) colored.push({vertex:vi, weight:w.weight});
    else   uncolored.push(vi);
  }
  return { colored, uncolored, coverage: colored.length/weightMap.vertexCount };
}
export function cloneSkinningSystem(original, newGeometry) {
  const clone = new SkinningSystem(original.skeleton, { mode: original.mode });
  if (original.weightMap) clone.attachGeometry(newGeometry, original.weightMap);
  return clone;
}
export function serializeSkinningSystem(system) {
  return JSON.stringify({ mode:system.mode, hasWeightMap:!!system.weightMap,
    boneCount:system.skeleton?.bones?.length??0, version:1 });
}

export function computeSkinningInfluenceStats(weightMap) {
  const influenceCounts = new Array(weightMap.maxInfluences+1).fill(0);
  for (let vi=0; vi<weightMap.vertexCount; vi++) {
    const count = weightMap.getWeights(vi).length;
    influenceCounts[Math.min(count, weightMap.maxInfluences)]++;
  }
  return { influenceCounts, maxInfluences: weightMap.maxInfluences,
    totalVertices: weightMap.vertexCount };
}
export function pruneWeights(weightMap, threshold=0.05) {
  for (let vi=0; vi<weightMap.vertexCount; vi++) {
    const ws = weightMap.getWeights(vi).filter(w=>w.weight>=threshold);
    const total = ws.reduce((s,w)=>s+w.weight,0)||1;
    weightMap.setWeights(vi, ws.map(w=>({...w, weight:w.weight/total})));
  }
  return weightMap;
}
export function getSkinningMode(geometry) {
  return geometry.attributes.skinIndex ? 'skinned' : 'rigid';
}
export function buildRigidBinding(geometry, boneIndex) {
  const count = geometry.attributes.position.count;
  const wm    = new VertexWeightMap(count, boneIndex+1);
  for (let vi=0; vi<count; vi++) wm.setWeights(vi, [{boneIndex, weight:1.0}]);
  return wm;
}
export function getPerBoneVertexCount(weightMap, boneCount) {
  const counts = new Array(boneCount).fill(0);
  for (let vi=0; vi<weightMap.vertexCount; vi++) {
    weightMap.getWeights(vi).forEach(({boneIndex})=>{ if(boneIndex<boneCount) counts[boneIndex]++; });
  }
  return counts;
}
export function exportWeightMapAsCSV(weightMap) {
  const rows = ['vertex,bone,weight'];
  for (let vi=0; vi<weightMap.vertexCount; vi++) {
    weightMap.getWeights(vi).forEach(({boneIndex,weight})=>{ rows.push(`${vi},${boneIndex},${weight.toFixed(4)}`); });
  }
  return rows.join('\n');
}

export function applyMorphAndSkin(geometry, morphValues, skinningSystem, weightMap) {
  if(morphValues) {
    const morphPos=geometry.morphAttributes?.position;
    if(morphPos) {
      geometry.morphTargetInfluences=geometry.morphTargetInfluences??new Array(morphPos.length).fill(0);
      Object.entries(morphValues).forEach(([name,val])=>{
        const idx=geometry.morphTargetDictionary?.[name];
        if(idx!==undefined) geometry.morphTargetInfluences[idx]=val;
      });
    }
  }
  skinningSystem?.update(geometry);
  return geometry;
}
export function buildDefaultSkinningSystem(skeleton) {
  return new SkinningSystem(skeleton, {mode:'LBS'});
}
export function getSkinningPerformanceTier(weightMap) {
  const maxInf=weightMap.maxInfluences;
  if(maxInf<=1) return {tier:'A',label:'Rigid',cost:1.0};
  if(maxInf<=2) return {tier:'B',label:'Smooth',cost:1.5};
  if(maxInf<=4) return {tier:'C',label:'Full',cost:2.0};
  return {tier:'D',label:'Heavy',cost:3.0};
}
export function computeBindPose(skeleton) {
  return skeleton.bones.map(bone=>({
    name:bone.name,
    worldMatrix:bone.matrixWorld.clone(),
    localMatrix:bone.matrix.clone(),
  }));
}
export function restoreBindPose(skeleton, bindPose) {
  bindPose.forEach(({name,localMatrix})=>{
    const bone=skeleton.bones.find(b=>b.name===name);
    if(bone) bone.matrix.copy(localMatrix);
  });
  skeleton.update?.();
}
