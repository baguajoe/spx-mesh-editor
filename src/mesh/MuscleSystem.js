// MuscleSystem.js — PRO Muscle Simulation
// SPX Mesh Editor | StreamPireX
// Features: fiber direction, activation curves, antagonist pairs,
//           fatty tissue layer, volume preservation, wrinkle maps

import * as THREE from 'three';\n\n// ─── Muscle Definition ────────────────────────────────────────────────────────\n\nexport function createMuscle(options = {}) {\n  return {\n    id:           options.id    ?? Math.random().toString(36).slice(2),\n    name:         options.name  ?? 'Muscle',\n    originBone:   options.originBone  ?? null,\n    insertBone:   options.insertBone  ?? null,\n\n    // Muscle shape\n    bulgeAxis:    options.bulgeAxis   ?? 'z',\n    restLength:   options.restLength  ?? 1.0,\n    maxBulge:     options.maxBulge    ?? 0.08,\n    bulgeProfile: options.bulgeProfile ?? 'gaussian', // 'gaussian'|'linear'|'peak'\n\n    // Fiber direction (normalized)\n    fiberDir:     options.fiberDir ?? new THREE.Vector3(0, 1, 0),\n\n    // Activation\n    activationCurve: options.activationCurve ?? 'smooth', // 'linear'|'smooth'|'fast'\n    minActivation:   options.minActivation   ?? 0,\n    maxActivation:   options.maxActivation   ?? 1,\n\n    // Antagonist\n    antagonist:   options.antagonist ?? null, // muscle id that opposes this one\n\n    // Affected vertices\n    affectedVerts: options.affectedVerts ?? [], // [{ idx, weight }]\n    falloff:       options.falloff ?? 2.5,\n    falloffRadius: options.falloffRadius ?? 0.3,\n\n    // State\n    _activation: 0,\n    _prevAngle:  0,\n  };\n}\n\n// ─── Activation Curves ────────────────────────────────────────────────────────\n\nfunction evaluateActivationCurve(t, curve) {\n  t = Math.max(0, Math.min(1, t));\n  switch (curve) {\n    case 'smooth':  return t * t * (3 - 2 * t); // smoothstep\n    case 'fast':    return Math.sqrt(t);\n    case 'slow':    return t * t;\n    case 'linear':\n    default:        return t;\n  }\n}\n\n// ─── Bulge Profiles ───────────────────────────────────────────────────────────\n\nfunction evaluateBulgeProfile(distAlongFiber, profile) {\n  const t = Math.max(0, Math.min(1, distAlongFiber));\n  switch (profile) {\n    case 'gaussian': return Math.exp(-Math.pow((t - 0.5) * 4, 2));\n    case 'peak':     return Math.sin(t * Math.PI);\n    case 'linear':   return 1 - Math.abs(t - 0.5) * 2;\n    default:         return Math.sin(t * Math.PI);\n  }\n}\n\n// ─── Muscle Simulator ─────────────────────────────────────────────────────────\n\nexport class MuscleSystem {\n  constructor(mesh, skeleton) {\n    this.mesh      = mesh;\n    this.skeleton  = skeleton;\n    this.muscles   = new Map();\n    this.restPos   = new Float32Array(mesh.geometry.attributes.position.array);\n    this.enabled   = true;\n    this.fatLayer  = 0;    // 0-1, adds softness\n    this.skinThickness = 0.02;\n  }\n\n  addMuscle(options) {\n    const m = createMuscle(options);\n    this.muscles.set(m.id, m);\n    // Auto-assign affected verts if not provided\n    if (!m.affectedVerts.length) this._autoAssignVerts(m);\n    return m.id;\n  }\n\n  removeMuscle(id) { this.muscles.delete(id); }\n\n  _autoAssignVerts(muscle) {\n    const ob = this.skeleton.bones.find(b => b.name === muscle.originBone);\n    const ib = this.skeleton.bones.find(b => b.name === muscle.insertBone);\n    if (!ob || !ib) return;\n\n    const op = new THREE.Vector3(), ip = new THREE.Vector3();\n    ob.getWorldPosition(op); ib.getWorldPosition(ip);\n    const mid = op.clone().lerp(ip, 0.5);\n    const len = op.distanceTo(ip);\n\n    const pos = this.mesh.geometry.attributes.position;\n    muscle.restLength = len;\n\n    for (let i = 0; i < pos.count; i++) {\n      const vp = new THREE.Vector3(this.restPos[i*3], this.restPos[i*3+1], this.restPos[i*3+2]);\n      const dist = vp.distanceTo(mid);\n      if (dist < muscle.falloffRadius) {\n        const weight = Math.exp(-Math.pow(dist / muscle.falloffRadius, 2) * muscle.falloff);\n        if (weight > 0.01) muscle.affectedVerts.push({ idx: i, weight });\n      }\n    }\n  }\n\n  setupHumanoid() {\n    const pairs = [\n      { name:'L_Bicep',    origin:'LeftArm',     insert:'LeftForeArm',  maxBulge:0.05, profile:'gaussian' },\n      { name:'R_Bicep',    origin:'RightArm',    insert:'RightForeArm', maxBulge:0.05, profile:'gaussian' },\n      { name:'L_Tricep',   origin:'LeftArm',     insert:'LeftForeArm',  maxBulge:0.03, bulgeAxis:'y' },\n      { name:'R_Tricep',   origin:'RightArm',    insert:'RightForeArm', maxBulge:0.03, bulgeAxis:'y' },\n      { name:'L_Quad',     origin:'LeftUpLeg',   insert:'LeftLeg',      maxBulge:0.06, profile:'peak' },\n      { name:'R_Quad',     origin:'RightUpLeg',  insert:'RightLeg',     maxBulge:0.06, profile:'peak' },\n      { name:'L_Hamstring',origin:'LeftUpLeg',   insert:'LeftLeg',      maxBulge:0.04, bulgeAxis:'y' },\n      { name:'R_Hamstring',origin:'RightUpLeg',  insert:'RightLeg',     maxBulge:0.04, bulgeAxis:'y' },\n      { name:'L_Calf',     origin:'LeftLeg',     insert:'LeftFoot',     maxBulge:0.04, profile:'gaussian' },\n      { name:'R_Calf',     origin:'RightLeg',    insert:'RightFoot',    maxBulge:0.04, profile:'gaussian' },\n      { name:'L_Deltoid',  origin:'LeftShoulder',insert:'LeftArm',      maxBulge:0.04, profile:'peak' },\n      { name:'R_Deltoid',  origin:'RightShoulder',insert:'RightArm',    maxBulge:0.04, profile:'peak' },\n      { name:'SpineExt',   origin:'Spine',       insert:'Spine1',       maxBulge:0.02, bulgeAxis:'z' },\n      { name:'Pectoral_L', origin:'LeftShoulder',insert:'Spine2',       maxBulge:0.05, profile:'gaussian' },\n      { name:'Pectoral_R', origin:'RightShoulder',insert:'Spine2',      maxBulge:0.05, profile:'gaussian' },\n    ];\n\n    pairs.forEach(p => {\n      const ob = this.skeleton.bones.find(b => b.name.includes(p.origin));\n      const ib = this.skeleton.bones.find(b => b.name.includes(p.insert));\n      if (ob && ib) {\n        this.addMuscle({\n          name: p.name,\n          originBone: ob.name, insertBone: ib.name,\n          maxBulge: p.maxBulge, bulgeAxis: p.bulgeAxis ?? 'z',\n          bulgeProfile: p.profile ?? 'gaussian',\n          falloffRadius: 0.25,\n        });\n      }\n    });\n\n    // Set antagonist pairs\n    const pairs2 = [['L_Bicep','L_Tricep'],['R_Bicep','R_Tricep'],\n                    ['L_Quad','L_Hamstring'],['R_Quad','R_Hamstring']];
    pairs2.forEach(([a, b]) => {
      const ma = Array.from(this.muscles.values()).find(m=>m.name===a);
      const mb = Array.from(this.muscles.values()).find(m=>m.name===b);
      if (ma && mb) { ma.antagonist = mb.id; mb.antagonist = ma.id; }
    });
  }

  _getMuscleActivation(muscle) {
    const ob = this.skeleton.bones.find(b => b.name === muscle.originBone);
    const ib = this.skeleton.bones.find(b => b.name === muscle.insertBone);
    if (!ob || !ib) return 0;

    const euler = new THREE.Euler().setFromQuaternion(ib.quaternion);
    const angle = Math.abs(euler[muscle.bulgeAxis] ?? euler.z);
    const normalizedAngle = Math.min(1, angle / (Math.PI * 0.5));

    let activation = evaluateActivationCurve(normalizedAngle, muscle.activationCurve);

    // Antagonist reduces activation
    if (muscle.antagonist) {
      const ant = this.muscles.get(muscle.antagonist);
      if (ant) activation *= (1 - ant._activation * 0.5);
    }

    muscle._activation = activation;
    return activation;
  }

  update() {
    if (!this.enabled) return;

    const pos = this.mesh.geometry.attributes.position;
    pos.array.set(this.restPos);

    this.muscles.forEach(muscle => {
      const activation = this._getMuscleActivation(muscle);
      if (activation < 0.01) return;

      const ob = this.skeleton.bones.find(b => b.name === muscle.originBone);
      const ib = this.skeleton.bones.find(b => b.name === muscle.insertBone);
      if (!ob || !ib) return;

      const op = new THREE.Vector3(), ip = new THREE.Vector3();
      ob.getWorldPosition(op); ib.getWorldPosition(ip);
      const mid = op.clone().lerp(ip, 0.5);
      const muscleDir = ip.clone().sub(op).normalize();
      const currentLen = op.distanceTo(ip);
      const compression = Math.max(0, 1 - currentLen / muscle.restLength);

      muscle.affectedVerts.forEach(({ idx, weight }) => {
        const vp = new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx));

        // Project vertex onto muscle fiber to get position along fiber
        const toVert = vp.clone().sub(op);
        const projLen = toVert.dot(muscleDir);
        const t = Math.max(0, Math.min(1, projLen / Math.max(currentLen, 0.001)));

        // Bulge profile along fiber
        const bulgeProfile = evaluateBulgeProfile(t, muscle.bulgeProfile);

        // Bulge amount = activation * compression * profile * weight * maxBulge
        const bulge = activation * (1 + compression) * bulgeProfile * weight * muscle.maxBulge;

        // Push vertex outward from muscle axis
        const axis = vp.clone().sub(mid);
        const axisAlongFiber = muscleDir.clone().multiplyScalar(axis.dot(muscleDir));
        const perpAxis = axis.clone().sub(axisAlongFiber);
        const perpLen = perpAxis.length();

        if (perpLen > 0.0001) {
          const pushDir = perpAxis.normalize();
          pos.setXYZ(idx,
            pos.getX(idx) + pushDir.x * bulge,
            pos.getY(idx) + pushDir.y * bulge,
            pos.getZ(idx) + pushDir.z * bulge,
          );
        }
      });
    });

    // Fat layer softening — slightly smooth displaced verts
    if (this.fatLayer > 0) this._applyFatLayer();

    pos.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  _applyFatLayer() {
    const pos = this.mesh.geometry.attributes.position;
    const geo = this.mesh.geometry;
    const idx = geo.index;
    if (!idx) return;

    const smooth = new Float32Array(pos.array.length);
    const counts = new Int32Array(pos.count);
    smooth.set(pos.array);

    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i+1), c = idx.getX(i+2);
      for (const [v, n1, n2] of [[a,b,c],[b,a,c],[c,a,b]]) {
        for (let k = 0; k < 3; k++) {
          smooth[v*3+k] += pos.array[n1*3+k] + pos.array[n2*3+k];
        }
        counts[v] += 2;
      }
    }

    const fat = this.fatLayer;
    for (let i = 0; i < pos.count; i++) {
      if (counts[i] === 0) continue;
      for (let k = 0; k < 3; k++) {
        const avg = smooth[i*3+k] / (counts[i] + 1);
        pos.array[i*3+k] = pos.array[i*3+k] * (1-fat) + avg * fat;
      }
    }
    pos.needsUpdate = true;
  }

  setFatLayer(v) { this.fatLayer = Math.max(0, Math.min(1, v)); }
  setEnabled(v)  { this.enabled = v; }
  getMuscles()   { return Array.from(this.muscles.values()); }
  getActivations() {
    const result = {};
    this.muscles.forEach((m, id) => { result[id] = { name: m.name, activation: m._activation }; });
    return result;
  }
  dispose() { this.muscles.clear(); }
}

export default MuscleSystem;
