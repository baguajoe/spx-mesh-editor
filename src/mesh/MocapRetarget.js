import * as THREE from "three";

// ── Bone name mapping — BVH → SPX rig ────────────────────────────────────────
export const DEFAULT_BONE_MAP = {
  // Spine
  "Hips":          "Root",
  "Spine":         "Spine",
  "Spine1":        "Spine1",
  "Spine2":        "Chest",
  "Neck":          "Neck",
  "Head":          "Head",
  // Left arm
  "LeftShoulder":  "L_Shoulder",
  "LeftArm":       "L_UpperArm",
  "LeftForeArm":   "L_LowerArm",
  "LeftHand":      "L_Hand",
  // Right arm
  "RightShoulder": "R_Shoulder",
  "RightArm":      "R_UpperArm",
  "RightForeArm":  "R_LowerArm",
  "RightHand":     "R_Hand",
  // Left leg
  "LeftUpLeg":     "L_Thigh",
  "LeftLeg":       "L_Shin",
  "LeftFoot":      "L_Foot",
  "LeftToeBase":   "L_Toe",
  // Right leg
  "RightUpLeg":    "R_Thigh",
  "RightLeg":      "R_Shin",
  "RightFoot":     "R_Foot",
  "RightToeBase":  "R_Toe",
};

// ── Retarget BVH frame to SPX armature ───────────────────────────────────────
export function retargetFrame(bvh, boneMap, armature, frameIndex) {
  if (frameIndex >= bvh.frames.length) return;
  const frame  = bvh.frames[frameIndex];
  const joints = bvh.joints;
  let   offset = 0;

  joints.forEach(joint => {
    const spxBoneName = boneMap[joint.name];
    const spxBone     = armature.userData.bones?.find(b => b.name === spxBoneName);

    // Read channel values
    const vals = {};
    joint.channels.forEach(ch => { vals[ch] = frame[offset++] || 0; });

    if (!spxBone) return;

    // Apply rotation
    if (vals.Xrotation !== undefined) {
      spxBone.rotation.x = THREE.MathUtils.degToRad(vals.Xrotation);
    }
    if (vals.Yrotation !== undefined) {
      spxBone.rotation.y = THREE.MathUtils.degToRad(vals.Yrotation);
    }
    if (vals.Zrotation !== undefined) {
      spxBone.rotation.z = THREE.MathUtils.degToRad(vals.Zrotation);
    }

    // Apply position (root only)
    if (vals.Xposition !== undefined && spxBone.name === "Root") {
      spxBone.position.x = vals.Xposition * 0.01;
      spxBone.position.y = vals.Yposition * 0.01;
      spxBone.position.z = vals.Zposition * 0.01;
    }
  });
}

// ── Bake retargeted animation to keyframes ────────────────────────────────────
export function bakeRetargetedAnimation(bvh, boneMap, armature) {
  const keys = {};
  const fps  = 1 / bvh.frameTime;

  bvh.frames.forEach((_, frameIndex) => {
    retargetFrame(bvh, boneMap, armature, frameIndex);
    const frame = Math.round(frameIndex);

    armature.userData.bones?.forEach(bone => {
      const id = bone.userData.boneId;
      if (!keys[id]) keys[id] = { rx:{}, ry:{}, rz:{} };
      keys[id].rx[frame] = bone.rotation.x;
      keys[id].ry[frame] = bone.rotation.y;
      keys[id].rz[frame] = bone.rotation.z;
    });
  });

  return { keys, frameCount: bvh.frames.length, fps };
}

// ── Fix foot sliding (simple height lock) ─────────────────────────────────────
export function fixFootSliding(armature, footBoneName = "L_Foot", floorY = 0) {
  const foot = armature.userData.bones?.find(b => b.name === footBoneName);
  if (!foot) return;
  const worldPos = new THREE.Vector3();
  foot.getWorldPosition(worldPos);
  if (worldPos.y < floorY) {
    const diff = floorY - worldPos.y;
    armature.position.y += diff;
  }
}

// ── Auto-detect bone map from BVH joint names ─────────────────────────────────
export function autoDetectBoneMap(bvhJoints, armatureBones) {
  const map = {};
  bvhJoints.forEach(joint => {
    // Try exact match first
    const exact = armatureBones.find(b => b.name === joint.name);
    if (exact) { map[joint.name] = exact.name; return; }
    // Try fuzzy match
    const fuzzy = armatureBones.find(b =>
      b.name.toLowerCase().includes(joint.name.toLowerCase()) ||
      joint.name.toLowerCase().includes(b.name.toLowerCase())
    );
    if (fuzzy) map[joint.name] = fuzzy.name;
    else if (DEFAULT_BONE_MAP[joint.name]) map[joint.name] = DEFAULT_BONE_MAP[joint.name];
  });
  return map;
}

// ── Preview retargeting stats ─────────────────────────────────────────────────
export function getRetargetStats(bvh, boneMap, armature) {
  const bvhJoints   = bvh.joints.length;
  const mapped      = Object.keys(boneMap).filter(k => boneMap[k]).length;
  const armBones    = armature.userData.bones?.length || 0;
  const coverage    = Math.round(mapped/bvhJoints*100);
  return { bvhJoints, mapped, armBones, coverage };
}
