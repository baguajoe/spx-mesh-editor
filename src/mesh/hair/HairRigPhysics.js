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

export function buildPonytailChain(rootBoneName, segments, opts = {}) {
  const physics = new HairRigPhysics(opts);
  const chain   = physics.addSpringChain('ponytail', rootBoneName, segments, {
    stiffness: opts.stiffness ?? 0.55,
    damping:   opts.damping   ?? 0.80,
    segLen:    opts.segLen    ?? 0.08,
    gravity:   opts.gravity   ?? 0.55,
  });
  return { physics, chain };
}

export function buildBraidChains(rootBoneNames, segmentsEach, opts = {}) {
  const physics = new HairRigPhysics(opts);
  rootBoneNames.forEach((name, i) => {
    physics.addSpringChain(`braid_${i}`, name, segmentsEach, {
      stiffness: (opts.stiffness ?? 0.60) + i * 0.01,
      damping:   opts.damping   ?? 0.82,
      segLen:    opts.segLen    ?? 0.06,
      gravity:   opts.gravity   ?? 0.50,
    });
  });
  return physics;
}

export function buildHairAccessoryJiggle(accessoryNames, opts = {}) {
  const physics = new HairRigPhysics(opts);
  accessoryNames.forEach(name => {
    physics.addJiggleBone(name, {
      stiffness: opts.stiffness ?? 0.75,
      damping:   opts.damping   ?? 0.70,
      maxAngle:  opts.maxAngle  ?? Math.PI * 0.2,
    });
  });
  return physics;
}

export function getChainWorldPositions(physics, chainId) {
  const chain = physics.getChain(chainId);
  if (!chain) return [];
  return chain.getChainPositions();
}

export function applyChainToMeshCurve(physics, chainId, meshCurve) {
  const chain = physics.getChain(chainId);
  if (!chain) return meshCurve;
  return chain.applyToHairCurve(meshCurve);
}

export function computeChainKineticEnergy(chain) {
  if (!chain?.segments?.length) return 0;
  return chain.segments.reduce((total, seg) => {
    const speed = seg._vel?.length() ?? 0;
    return total + 0.5 * seg.mass * speed * speed;
  }, 0);
}

export function isChainAtRest(physics, chainId, threshold = 0.002) {
  const ke = computeChainKineticEnergy(physics.getChain(chainId));
  return ke < threshold;
}

export function serializeRigPhysicsState(physics) {
  return JSON.stringify({
    springBones:  physics.springBones.size,
    springChains: physics.springChains.size,
    jiggleBones:  physics.jiggleBones.size,
    windForce:    physics.windForce.toArray(),
  });
}

export function buildFullHeadHairRig(opts={}) {
  const physics = new HairRigPhysics(opts);
  const regions = ['crown','left_temple','right_temple','left_side','right_side','nape','fringe'];
  regions.forEach(region => {
    physics.addSpringChain(region, `Head_${region}`, opts.segments??5, {
      stiffness: (opts.stiffness??0.60) + (region==='crown'?0.1:0),
      damping:   opts.damping??0.82,
      segLen:    opts.segLen??0.07,
      gravity:   opts.gravity??0.50,
    });
  });
  return physics;
}
export function syncRigPhysicsToHairSystem(rigPhysics, hairSystem) {
  rigPhysics.springChains.forEach((chain, id) => {
    const positions = chain.getChainPositions();
    if (!positions.length) return;
    hairSystem._cards.filter(c => c.groupId === [...rigPhysics.springChains.keys()].indexOf(id))
      .forEach(card => {
        if (card.curve && positions.length) {
          card.curve[card.curve.length-1].lerp(positions[positions.length-1], 0.3);
        }
      });
  });
}
export function getRigPhysicsDebugLines(physics) {
  const lines = [];
  physics.springChains.forEach((chain, id) => {
    const pts = chain.getChainPositions();
    for (let i=0; i<pts.length-1; i++) lines.push({from:pts[i], to:pts[i+1], id});
  });
  physics.springBones.forEach((bone, id) => {
    lines.push({ from: new THREE.Vector3().setFromMatrixPosition(bone._parentMat), to: bone._pos.clone(), id });
  });
  return lines;
}
export function computeRigPhysicsEnergy(physics) {
  let total = 0;
  physics.springChains.forEach(chain => { total += computeChainKineticEnergy(chain); });
  physics.springBones.forEach(bone => {
    const spd = bone._vel?.length()??0;
    total += 0.5 * bone.mass * spd * spd;
  });
  return total;
}

export function createAccessoryJiggle(mesh, stiffness=0.8, damping=0.72) {
  const jiggle = new JiggleBone({ stiffness, damping });
  return {
    jiggle,
    update() { jiggle.step(0.016); jiggle.applyToMesh(mesh); },
    applyAcceleration(accel) { jiggle.step(0.016, accel); },
    reset() { jiggle.reset(); },
  };
}
export function buildHairPhysicsProfile(style) {
  const profiles = {
    Straight: { stiffness:0.75, damping:0.88, segLen:0.06, gravity:0.55 },
    Wavy:     { stiffness:0.60, damping:0.83, segLen:0.07, gravity:0.50 },
    Curly:    { stiffness:0.45, damping:0.78, segLen:0.08, gravity:0.42 },
    Afro:     { stiffness:0.30, damping:0.65, segLen:0.06, gravity:0.25 },
    Buzzcut:  { stiffness:0.98, damping:0.99, segLen:0.02, gravity:0.08 },
    Ponytail: { stiffness:0.55, damping:0.80, segLen:0.08, gravity:0.60 },
    Dread:    { stiffness:0.70, damping:0.87, segLen:0.10, gravity:0.58 },
  };
  return profiles[style] ?? profiles.Straight;
}
export function getSpringChainPositions(physics, chainId) {
  return physics.getChain(chainId)?.getChainPositions() ?? [];
}
export function updateSpringChainParentMatrix(physics, chainId, matrix) {
  const chain = physics.getChain(chainId);
  if (!chain?.segments?.length) return;
  chain.segments[0].setParentMatrix(matrix);
}
export function blendRigPhysicsResults(physicsA, physicsB, blend, chainId) {
  const posA = getSpringChainPositions(physicsA, chainId);
  const posB = getSpringChainPositions(physicsB, chainId);
  if (!posA.length || !posB.length) return posA.length ? posA : posB;
  const len = Math.min(posA.length, posB.length);
  return Array.from({length:len}, (_,i) => posA[i].clone().lerp(posB[i], blend));
}
export function getPhysicsSimulationHealth(physics) {
  const energy = computeRigPhysicsEnergy(physics);
  return { energy: energy.toFixed(4), stable: energy < 1.0,
    chainCount: physics.springChains.size,
    boneCount:  physics.springBones.size,
    status: energy < 0.01 ? 'At Rest' : energy < 0.5 ? 'Settling' : energy < 2.0 ? 'Active' : 'Unstable' };
}
export function resetAllChains(physics) {
  physics.springChains.forEach(chain => {
    chain.segments.forEach(seg => { seg._vel.set(0,0,0); });
  });
}

export function createSimpleJiggleSetup(mesh, opts={}) {
  const j=new JiggleBone({stiffness:opts.stiffness??0.75, damping:opts.damping??0.70, maxAngle:opts.maxAngle??Math.PI*0.2});
  let lastPos=new THREE.Vector3();
  return {
    jiggle:j,
    update(dt, currentPos) {
      const accel=currentPos.clone().sub(lastPos).divideScalar(dt||0.016);
      lastPos.copy(currentPos);
      j.step(dt,accel);
      j.applyToMesh(mesh);
    },
    getRotation() { return j.getRotation(); },
    reset() { j.reset(); lastPos.set(0,0,0); },
  };
}
export function addWindResponseToChain(chain, windDir, windStr) {
  const force=windDir.clone().normalize().multiplyScalar(windStr);
  chain.segments.forEach((seg,i)=>{
    if(!seg._vel) return;
    const t=i/Math.max(1,chain.segments.length-1);
    seg._vel.add(force.clone().multiplyScalar(t*0.001));
  });
}
export function interpolateChainPositions(positionsA, positionsB, t) {
  const len=Math.min(positionsA.length,positionsB.length);
  return Array.from({length:len},(_,i)=>positionsA[i].clone().lerp(positionsB[i],t));
}
export function getChainTipPosition(physics, chainId) {
  const pts=getSpringChainPositions(physics,chainId);
  return pts.length ? pts[pts.length-1] : new THREE.Vector3();
}
export function setChainGravity(physics, chainId, gravityScale) {
  const chain=physics.getChain(chainId);
  if(chain) chain.segments.forEach(seg=>{seg.gravity=gravityScale;});
}
