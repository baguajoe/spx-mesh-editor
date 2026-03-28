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

// ── Convert captured MediaPipe frames → BVH ──────────────────
export function framesToBVH(frames, fps = 30) {
  if (!frames?.length) return null;
  const JOINTS = [
    { name:'Hips', channels:['Xposition','Yposition','Zposition','Zrotation','Xrotation','Yrotation'], lA:23, lB:24, root:true },
    { name:'Spine',         channels:['Zrotation','Xrotation','Yrotation'], lA:23, lB:11 },
    { name:'Neck',          channels:['Zrotation','Xrotation','Yrotation'], lA:11, lB:0  },
    { name:'Head',          channels:['Zrotation','Xrotation','Yrotation'], lA:0,  lB:0  },
    { name:'LeftShoulder',  channels:['Zrotation','Xrotation','Yrotation'], lA:11, lB:13 },
    { name:'LeftArm',       channels:['Zrotation','Xrotation','Yrotation'], lA:13, lB:15 },
    { name:'LeftForeArm',   channels:['Zrotation','Xrotation','Yrotation'], lA:15, lB:15 },
    { name:'LeftHand',      channels:['Zrotation','Xrotation','Yrotation'], lA:15, lB:15 },
    { name:'RightShoulder', channels:['Zrotation','Xrotation','Yrotation'], lA:12, lB:14 },
    { name:'RightArm',      channels:['Zrotation','Xrotation','Yrotation'], lA:14, lB:16 },
    { name:'RightForeArm',  channels:['Zrotation','Xrotation','Yrotation'], lA:16, lB:16 },
    { name:'RightHand',     channels:['Zrotation','Xrotation','Yrotation'], lA:16, lB:16 },
    { name:'LeftUpLeg',     channels:['Zrotation','Xrotation','Yrotation'], lA:23, lB:25 },
    { name:'LeftLeg',       channels:['Zrotation','Xrotation','Yrotation'], lA:25, lB:27 },
    { name:'LeftFoot',      channels:['Zrotation','Xrotation','Yrotation'], lA:27, lB:27 },
    { name:'RightUpLeg',    channels:['Zrotation','Xrotation','Yrotation'], lA:24, lB:26 },
    { name:'RightLeg',      channels:['Zrotation','Xrotation','Yrotation'], lA:26, lB:28 },
    { name:'RightFoot',     channels:['Zrotation','Xrotation','Yrotation'], lA:28, lB:28 },
  ];
  const t = (n) => '\t'.repeat(n);
  let hier = 'HIERARCHY\n';
  JOINTS.forEach((j, i) => {
    const tag = i === 0 ? 'ROOT' : 'JOINT';
    hier += t(i===0?0:1) + tag + ' ' + j.name + '\n';
    hier += t(i===0?0:1) + '{\n';
    hier += t(i===0?1:2) + 'OFFSET 0.00 0.00 0.00\n';
    hier += t(i===0?1:2) + 'CHANNELS ' + j.channels.length + ' ' + j.channels.join(' ') + '\n';
    if (i > 0) {
      hier += t(2) + 'End Site\n' + t(2) + '{\n' + t(3) + 'OFFSET 0.00 5.00 0.00\n' + t(2) + '}\n';
    }
    hier += t(i===0?0:1) + '}\n';
  });
  const RAD = 180 / Math.PI;
  let motion = 'MOTION\nFrames: ' + frames.length + '\nFrame Time: ' + (1/fps).toFixed(6) + '\n';
  frames.forEach(({ landmarks: lms }) => {
    if (!lms) { motion += JOINTS.flatMap(j => j.channels.map(() => '0.000')).join(' ') + '\n'; return; }
    const row = [];
    JOINTS.forEach((j, ji) => {
      if (ji === 0) {
        row.push((((lms[23].x+lms[24].x)/2-0.5)*200).toFixed(3));
        row.push((-((lms[23].y+lms[24].y)/2-0.5)*200).toFixed(3));
        row.push((-((lms[23].z+lms[24].z)/2)*200).toFixed(3));
      }
      const A = lms[j.lA], B = lms[j.lB];
      if (A && B && j.lA !== j.lB) {
        const dx=B.x-A.x, dy=-(B.y-A.y), dz=-(B.z-A.z);
        row.push('0.000', (Math.atan2(dy,Math.sqrt(dx*dx+dz*dz))*RAD).toFixed(3), (Math.atan2(dx,dz)*RAD).toFixed(3));
      } else { row.push('0.000','0.000','0.000'); }
    });
    motion += row.join(' ') + '\n';
  });
  return hier + motion;
}

export function downloadBVH(frames, filename = 'mocap.bvh', fps = 30) {
  const bvh = framesToBVH(frames, fps);
  if (!bvh) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([bvh], { type: 'text/plain' }));
  a.download = filename; a.click();
}
