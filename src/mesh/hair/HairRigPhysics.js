/**
 * HairRigPhysics.js — SPX Mesh Editor
 * Rig-attached hair physics: bone-driven hair cards, spring bones,
 * secondary motion for ponytails, braids, and accessory jiggle.
 */
import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t)   => a + (b - a) * t;

// ─── Spring bone ──────────────────────────────────────────────────────────
export class SpringBone {
  constructor(opts = {}) {
    this.name        = opts.name       ?? 'SpringBone';
    this.stiffness   = opts.stiffness  ?? 0.7;
    this.damping     = opts.damping    ?? 0.85;
    this.gravity     = opts.gravity    ?? 0.3;
    this.windStr     = opts.windStr    ?? 0.2;
    this.radius      = opts.radius     ?? 0.02;
    this.length      = opts.length     ?? 0.15;
    this.mass        = opts.mass       ?? 0.05;
    this._pos        = new THREE.Vector3();
    this._vel        = new THREE.Vector3();
    this._restDir    = new THREE.Vector3(0, -1, 0);
    this._parentMat  = new THREE.Matrix4();
  }

  setParentMatrix(mat) { this._parentMat.copy(mat); }

  getRestWorldPos() {
    return this._restDir.clone()
      .transformDirection(this._parentMat)
      .multiplyScalar(this.length)
      .add(new THREE.Vector3().setFromMatrixPosition(this._parentMat));
  }

  step(dt, windForce = new THREE.Vector3()) {
    const parentPos  = new THREE.Vector3().setFromMatrixPosition(this._parentMat);
    const restPos    = this.getRestWorldPos();
    const toRest     = restPos.clone().sub(this._pos).multiplyScalar(this.stiffness);
    const gravity    = new THREE.Vector3(0, -9.8 * this.gravity, 0).multiplyScalar(this.mass);
    const wind       = windForce.clone().multiplyScalar(this.windStr);
    const force      = toRest.add(gravity).add(wind);
    this._vel.add(force.multiplyScalar(dt));
    this._vel.multiplyScalar(this.damping);
    this._pos.add(this._vel.clone().multiplyScalar(dt));
    // Keep at correct distance from parent
    const d = this._pos.distanceTo(parentPos);
    if (d > this.length * 1.01) {
      const dir = this._pos.clone().sub(parentPos).normalize();
      this._pos.copy(parentPos).add(dir.multiplyScalar(this.length));
    }
  }

  getWorldMatrix() {
    const parentPos = new THREE.Vector3().setFromMatrixPosition(this._parentMat);
    const dir       = this._pos.clone().sub(parentPos).normalize();
    const up        = new THREE.Vector3(0, 1, 0);
    const mat       = new THREE.Matrix4();
    const quat      = new THREE.Quaternion().setFromUnitVectors(up, dir);
    mat.makeRotationFromQuaternion(quat);
    mat.setPosition(parentPos);
    return mat;
  }

  toJSON() {
    return { name:this.name, stiffness:this.stiffness, damping:this.damping,
      gravity:this.gravity, windStr:this.windStr, length:this.length };
  }
}

// ─── Spring chain (ponytail, braid segments) ──────────────────────────────
export class SpringChain {
  constructor(rootBone, segmentCount = 6, opts = {}) {
    this.rootBone  = rootBone;
    this.segments  = [];
    this.stiffness = opts.stiffness ?? 0.6;
    this.damping   = opts.damping   ?? 0.82;
    this.segLen    = opts.segLen    ?? 0.06;
    this.gravity   = opts.gravity   ?? 0.5;
    this._time     = 0;
    for (let i = 0; i < segmentCount; i++) {
      this.segments.push(new SpringBone({
        name:      `${rootBone}_seg_${i}`,
        stiffness: this.stiffness * (1 - i * 0.05),
        damping:   this.damping,
        gravity:   this.gravity * (1 + i * 0.1),
        length:    this.segLen,
        mass:      0.04 + i * 0.005,
      }));
    }
  }

  step(dt, windForce = new THREE.Vector3()) {
    this._time += dt;
    let prevMat = new THREE.Matrix4();
    this.segments.forEach((seg, i) => {
      if (i === 0) {
        seg.setParentMatrix(prevMat);
      } else {
        seg.setParentMatrix(this.segments[i-1].getWorldMatrix());
      }
      seg.step(dt, windForce);
      prevMat = seg.getWorldMatrix();
    });
  }

  getChainPositions() {
    return this.segments.map(s => s._pos.clone());
  }

  applyToHairCurve(hairCurve) {
    const chainPts = this.getChainPositions();
    return hairCurve.map((pt, i) => {
      const t        = i / (hairCurve.length - 1);
      const chainIdx = Math.floor(t * (chainPts.length - 1));
      const chainFrac = t * (chainPts.length - 1) - chainIdx;
      const chainPt  = chainPts[chainIdx]?.clone()
        .lerp(chainPts[Math.min(chainIdx+1, chainPts.length-1)] ?? chainPts[chainIdx], chainFrac)
        ?? pt;
      return pt.clone().lerp(chainPt, 0.6);
    });
  }

  toJSON() {
    return { segmentCount: this.segments.length, stiffness: this.stiffness,
      damping: this.damping, segLen: this.segLen, gravity: this.gravity };
  }
}

// ─── Jiggle bone (for accessories) ────────────────────────────────────────
export class JiggleBone {
  constructor(opts = {}) {
    this.name       = opts.name      ?? 'JiggleBone';
    this.stiffness  = opts.stiffness ?? 0.8;
    this.damping    = opts.damping   ?? 0.75;
    this.maxAngle   = opts.maxAngle  ?? Math.PI * 0.25;
    this._angle     = new THREE.Euler();
    this._angVel    = new THREE.Vector3();
    this._restEuler = new THREE.Euler();
  }

  step(dt, parentAccel = new THREE.Vector3()) {
    const accelTorque = new THREE.Vector3(
      parentAccel.z * this.stiffness,
      0,
      -parentAccel.x * this.stiffness,
    );
    const restoring = new THREE.Vector3(
      -this._angle.x * this.stiffness * 8,
      -this._angle.y * this.stiffness * 8,
      -this._angle.z * this.stiffness * 8,
    );
    this._angVel.add(accelTorque.add(restoring).multiplyScalar(dt));
    this._angVel.multiplyScalar(this.damping);
    this._angle.x = clamp(this._angle.x + this._angVel.x * dt, -this.maxAngle, this.maxAngle);
    this._angle.y = clamp(this._angle.y + this._angVel.y * dt, -this.maxAngle, this.maxAngle);
    this._angle.z = clamp(this._angle.z + this._angVel.z * dt, -this.maxAngle, this.maxAngle);
  }

  getRotation() { return this._angle.clone(); }
  reset() { this._angle.set(0,0,0); this._angVel.set(0,0,0); }

  applyToMesh(mesh) {
    if (!mesh) return;
    mesh.rotation.x += (this._angle.x - mesh.rotation.x) * 0.5;
    mesh.rotation.z += (this._angle.z - mesh.rotation.z) * 0.5;
  }

  toJSON() {
    return { name:this.name, stiffness:this.stiffness, damping:this.damping, maxAngle:this.maxAngle };
  }
}

// ─── HairRigPhysics manager ───────────────────────────────────────────────
export class HairRigPhysics {
  constructor(opts = {}) {
    this.springBones  = new Map();
    this.springChains = new Map();
    this.jiggleBones  = new Map();
    this.windForce    = new THREE.Vector3();
    this.gravity      = opts.gravity    ?? 0.5;
    this._clock       = new THREE.Clock(false);
    this._paused      = false;
  }

  addSpringBone(id, opts = {}) {
    const bone = new SpringBone({ ...opts, gravity: this.gravity });
    this.springBones.set(id, bone);
    return bone;
  }

  addSpringChain(id, rootBone, segments = 6, opts = {}) {
    const chain = new SpringChain(rootBone, segments, { ...opts, gravity: this.gravity });
    this.springChains.set(id, chain);
    return chain;
  }

  addJiggleBone(id, opts = {}) {
    const bone = new JiggleBone(opts);
    this.jiggleBones.set(id, bone);
    return bone;
  }

  setWind(dir, strength) { this.windForce.copy(dir).normalize().multiplyScalar(strength); }

  start() { this._clock.start(); this._paused = false; }
  pause() { this._paused = true; }

  update() {
    if (this._paused) return;
    const dt = Math.min(this._clock.getDelta(), 0.05);
    this.springBones.forEach(bone => bone.step(dt, this.windForce));
    this.springChains.forEach(chain => chain.step(dt, this.windForce));
    this.jiggleBones.forEach(bone => bone.step(dt));
  }

  getChain(id)    { return this.springChains.get(id); }
  getBone(id)     { return this.springBones.get(id); }
  getJiggle(id)   { return this.jiggleBones.get(id); }

  dispose() {
    this.springBones.clear();
    this.springChains.clear();
    this.jiggleBones.clear();
  }

  toJSON() {
    return {
      springBones:  [...this.springBones.entries()].map(([id,b])  => [id, b.toJSON()]),
      springChains: [...this.springChains.entries()].map(([id,c]) => [id, c.toJSON()]),
      jiggleBones:  [...this.jiggleBones.entries()].map(([id,j])  => [id, j.toJSON()]),
    };
  }
}

export default HairRigPhysics;
