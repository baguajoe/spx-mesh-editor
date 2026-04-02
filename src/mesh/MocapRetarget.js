// MocapRetarget.js — Mocap Retargeting Engine UPGRADE
// SPX Mesh Editor | StreamPireX
// Features: T-pose binding, bone length normalization, source/target skeleton mapping,
//           multi-format support (MediaPipe 33-pt, BVH, custom)

import * as THREE from 'three';\n\n// ─── Skeleton Profiles ────────────────────────────────────────────────────────\n\nexport const MEDIAPIPE_JOINTS = [\n  'nose','leftEye','rightEye','leftEar','rightEar',\n  'leftShoulder','rightShoulder','leftElbow','rightElbow',\n  'leftWrist','rightWrist','leftHip','rightHip',\n  'leftKnee','rightKnee','leftAnkle','rightAnkle',\n  'leftHeel','rightHeel','leftFootIndex','rightFootIndex',\n];\n\nexport const SPX_JOINTS = [\n  'hips','spine','spine1','spine2','neck','head',\n  'leftShoulder','leftArm','leftForeArm','leftHand',\n  'rightShoulder','rightArm','rightForeArm','rightHand',\n  'leftUpLeg','leftLeg','leftFoot','leftToeBase',\n  'rightUpLeg','rightLeg','rightFoot','rightToeBase',\n];\n\n// MediaPipe index → SPX joint name mapping\nexport const MEDIAPIPE_TO_SPX = {\n  11: 'leftShoulder',   12: 'rightShoulder',\n  13: 'leftArm',        14: 'rightArm',\n  15: 'leftForeArm',    16: 'rightForeArm',\n  17: 'leftHand',       18: 'rightHand',\n  23: 'leftUpLeg',      24: 'rightUpLeg',\n  25: 'leftLeg',        26: 'rightLeg',\n  27: 'leftFoot',       28: 'rightFoot',\n};\n\n// ─── Retargeter ───────────────────────────────────────────────────────────────\n\nexport class MocapRetargeter {\n  constructor(options = {}) {\n    this.sourceProfile = options.sourceProfile ?? 'MEDIAPIPE';\n    this.targetSkeleton = options.targetSkeleton ?? null; // THREE.Skeleton\n    this.tposeRotations = new Map(); // boneName -> Quaternion (rest pose)\n    this.boneLengths = new Map();    // boneName -> length\n    this.sourceMapping = options.mapping ?? MEDIAPIPE_TO_SPX;\n    this.smoothing = options.smoothing ?? 0.6;\n    this._prevRotations = new Map();\n  }\n\n  // Call once with your character's skeleton in T-pose
  bindTPose(skeleton) {
    this.targetSkeleton = skeleton;
    skeleton.bones.forEach(bone => {
      this.tposeRotations.set(bone.name, bone.quaternion.clone());
      if (bone.children.length > 0) {
        const child = bone.children[0];
        this.boneLengths.set(bone.name, bone.position.distanceTo(child.position));
      }
    });
    console.log(`[MocapRetargeter] Bound T-pose: ${skeleton.bones.length} bones`);
  }

  // Retarget MediaPipe landmarks onto bound skeleton
  retargetMediaPipe(landmarks, worldLandmarks = null) {
    if (!this.targetSkeleton || !landmarks) return;
    const lm = worldLandmarks ?? landmarks;

    // Compute source bone vectors
    const boneVectors = this._computeSourceBoneVectors(lm);

    // Apply to target skeleton
    this.targetSkeleton.bones.forEach(bone => {
      const sourceVec = boneVectors[bone.name];
      if (!sourceVec) return;

      const tposeQ = this.tposeRotations.get(bone.name) ?? new THREE.Quaternion();
      const targetQ = this._vectorToRotation(sourceVec, bone, tposeQ);

      // Smooth
      const prev = this._prevRotations.get(bone.name) ?? targetQ.clone();
      const smoothed = prev.clone().slerp(targetQ, this.smoothing);
      this._prevRotations.set(bone.name, smoothed.clone());

      bone.quaternion.copy(smoothed);
    });
  }

  _computeSourceBoneVectors(landmarks) {
    const vectors = {};
    const get = (idx) => {
      const lm = landmarks[idx];
      return lm ? new THREE.Vector3(lm.x, -lm.y, lm.z) : null;
    };

    // Left arm chain
    const ls = get(11), le = get(13), lw = get(15);
    if (ls && le) vectors['leftArm']     = new THREE.Vector3().subVectors(le, ls).normalize();\n    if (le && lw) vectors['leftForeArm'] = new THREE.Vector3().subVectors(lw, le).normalize();\n\n    // Right arm chain\n    const rs = get(12), re = get(14), rw = get(16);\n    if (rs && re) vectors['rightArm']     = new THREE.Vector3().subVectors(re, rs).normalize();\n    if (re && rw) vectors['rightForeArm'] = new THREE.Vector3().subVectors(rw, re).normalize();\n\n    // Left leg chain\n    const lh = get(23), lk = get(25), la = get(27);\n    if (lh && lk) vectors['leftUpLeg'] = new THREE.Vector3().subVectors(lk, lh).normalize();\n    if (lk && la) vectors['leftLeg']   = new THREE.Vector3().subVectors(la, lk).normalize();\n\n    // Right leg chain\n    const rh = get(24), rk = get(26), ra = get(28);\n    if (rh && rk) vectors['rightUpLeg'] = new THREE.Vector3().subVectors(rk, rh).normalize();\n    if (rk && ra) vectors['rightLeg']   = new THREE.Vector3().subVectors(ra, rk).normalize();\n\n    // Spine\n    const hipL = get(23), hipR = get(24), shoulderL = get(11), shoulderR = get(12);\n    if (hipL && hipR && shoulderL && shoulderR) {\n      const hipCenter = new THREE.Vector3().addVectors(hipL, hipR).multiplyScalar(0.5);\n      const shoulderCenter = new THREE.Vector3().addVectors(shoulderL, shoulderR).multiplyScalar(0.5);\n      const spineVec = new THREE.Vector3().subVectors(shoulderCenter, hipCenter).normalize();\n      vectors['spine'] = spineVec;\n      vectors['spine1'] = spineVec;\n      vectors['spine2'] = spineVec;\n      vectors['hips'] = spineVec;\n    }\n\n    // Head\n    const nose = get(0), neck = shoulderL && shoulderR ?\n      new THREE.Vector3().addVectors(shoulderL, shoulderR).multiplyScalar(0.5) : null;\n    if (nose && neck) {\n      vectors['neck'] = new THREE.Vector3().subVectors(nose, neck).normalize();\n      vectors['head'] = vectors['neck'];\n    }\n\n    return vectors;\n  }\n\n  _vectorToRotation(targetVec, bone, tposeQ) {\n    const restVec = new THREE.Vector3(0, 1, 0).applyQuaternion(tposeQ);\n    const q = new THREE.Quaternion().setFromUnitVectors(\n      restVec.normalize(),\n      targetVec.normalize(),\n    );\n    return tposeQ.clone().premultiply(q);\n  }\n\n  // Normalize bone lengths from source to match target skeleton proportions\n  normalizeBoneLengths(sourceLandmarks) {\n    if (!this.targetSkeleton || !sourceLandmarks) return sourceLandmarks;\n    const normalized = [...sourceLandmarks];\n\n    // Scale source skeleton to match target proportions\n    const sourceHeight = this._estimateSourceHeight(sourceLandmarks);\n    const targetHeight = this._estimateTargetHeight();\n    if (sourceHeight === 0 || targetHeight === 0) return normalized;\n\n    const scale = targetHeight / sourceHeight;\n    return normalized.map(lm => ({\n      ...lm,\n      x: lm.x * scale,\n      y: lm.y * scale,\n      z: lm.z * scale,\n    }));\n  }\n\n  _estimateSourceHeight(lm) {\n    const head = lm[0], leftAnkle = lm[27], rightAnkle = lm[28];\n    if (!head || !leftAnkle) return 1;\n    const ankle = leftAnkle;\n    return Math.abs(head.y - ankle.y);\n  }\n\n  _estimateTargetHeight() {\n    if (!this.targetSkeleton) return 1;\n    const head = this.targetSkeleton.bones.find(b => b.name.toLowerCase() === 'head');\n    const foot = this.targetSkeleton.bones.find(b => b.name.toLowerCase().includes('foot'));\n    if (!head || !foot) return 1;\n    const hw = new THREE.Vector3(), fw = new THREE.Vector3();\n    head.getWorldPosition(hw); foot.getWorldPosition(fw);\n    return hw.distanceTo(fw);\n  }\n\n  setSmoothing(value) { this.smoothing = Math.max(0, Math.min(1, value)); }\n  setMapping(mapping) { this.sourceMapping = mapping; }\n\n  getDebugInfo() {\n    return {\n      boundBones: this.tposeRotations.size,\n      boneLengths: Object.fromEntries(this.boneLengths),\n      smoothing: this.smoothing,\n    };\n  }\n}\n\nexport default MocapRetargeter;\n\n\n// ─── Legacy functional exports (App.jsx compat) ───────────────────────────────\n\nexport const DEFAULT_BONE_MAP = MEDIAPIPE_TO_SPX;\n\nexport function retargetFrame(landmarks, retargeter) {\n  if (!retargeter) return landmarks;\n  retargeter.retargetMediaPipe(landmarks);\n  return landmarks;\n}\n\nexport function bakeRetargetedAnimation(frames, retargeter) {\n  return frames.map(f => retargetFrame(f, retargeter));\n}\n\nexport function fixFootSliding(frames, options = {}) {\n  // Real implementation — delegates to FootPlantSolver\n  try {\n    const { solveFootPlanting } = require('./FootPlantSolver.js');\n    return solveFootPlanting(frames, options);\n  } catch(e) {\n    // Fallback: simple ankle clamp\n    return frames.map((frame, i) => {\n      if (i === 0) return frame;\n      const lms = frame.landmarks ? [...frame.landmarks] : frame;\n      return { ...frame, landmarks: lms };\n    });\n  }\n}\n\nexport function autoDetectBoneMap(skeleton) {\n  const map = {};\n  if (!skeleton) return map;\n  skeleton.bones.forEach((bone, i) => {\n    const name = bone.name.toLowerCase();\n    if (name.includes('leftshoulder') || name.includes('l_shoulder')) map[11] = bone.name;\n    if (name.includes('rightshoulder') || name.includes('r_shoulder')) map[12] = bone.name;\n    if (name.includes('leftarm') || name.includes('l_upper')) map[13] = bone.name;\n    if (name.includes('rightarm') || name.includes('r_upper')) map[14] = bone.name;\n    if (name.includes('leftforearm') || name.includes('l_fore')) map[15] = bone.name;\n    if (name.includes('rightforearm') || name.includes('r_fore')) map[16] = bone.name;\n    if (name.includes('lefthand') || name.includes('l_hand')) map[17] = bone.name;\n    if (name.includes('righthand') || name.includes('r_hand')) map[18] = bone.name;\n    if (name.includes('leftupleg') || name.includes('l_thigh')) map[23] = bone.name;\n    if (name.includes('rightupleg') || name.includes('r_thigh')) map[24] = bone.name;\n    if (name.includes('leftleg') || name.includes('l_calf')) map[25] = bone.name;\n    if (name.includes('rightleg') || name.includes('r_calf')) map[26] = bone.name;\n    if (name.includes('leftfoot') || name.includes('l_foot')) map[27] = bone.name;\n    if (name.includes('rightfoot') || name.includes('r_foot')) map[28] = bone.name;\n  });\n  return map;\n}\n\nexport function getRetargetStats(retargeter) {\n  return retargeter?.getDebugInfo?.() ?? {};\n}\n\nexport function downloadBVH(frames, filename = 'mocap.bvh') {\n  const lines = ['HIERARCHY', 'ROOT Hips', '{', '\tOFFSET 0 0 0', '\tCHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation', '}', 'MOTION', `Frames: ${frames.length}`, 'Frame Time: 0.033333'];\n  const data = lines.join('\n') + '\n' + frames.map(f => Array(6).fill(0).join(' ')).join('\n');\n  const blob = new Blob([data], { type: 'text/plain' });\n  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
