/**
 * SPX3DTo2DPipeline.js
 * Converts 3D joint/bone animation data → 2D puppet keyframes (.spxmotion)
 *
 * .spxmotion JSON schema:
 * {
 *   "version": "1.0",
 *   "fps": 30,
 *   "duration": 2.5,          // seconds
 *   "bones": ["head","neck","spine","l_shoulder","r_shoulder",...],
 *   "frames": [
 *     {
 *       "time": 0.0,
 *       "keyframes": {
 *         "head":      { "x": 320, "y": 180, "rotation": 0,   "scale": 1.0 },
 *         "l_hand":    { "x": 200, "y": 280, "rotation": -15, "scale": 1.0 },
 *         ...
 *       }
 *     }, ...
 *   ]
 * }
 *
 * Projection: orthographic — 3D (x,y,z) → 2D (x + z*0, y)
 * Canvas size configurable (default 640×480 for puppet stage)
 */

import * as THREE from 'three';

// Standard SPX bone name mapping from common 3D rigs
const BONE_MAP_3D_TO_2D = {
  // Mixamo / standard humanoid names → SPX Puppet bone names
  'Hips':             'hips',
  'Spine':            'spine',
  'Spine1':           'chest',
  'Spine2':           'upper_chest',
  'Neck':             'neck',
  'Head':             'head',
  'LeftShoulder':     'l_shoulder',
  'LeftArm':          'l_upper_arm',
  'LeftForeArm':      'l_forearm',
  'LeftHand':         'l_hand',
  'RightShoulder':    'r_shoulder',
  'RightArm':         'r_upper_arm',
  'RightForeArm':     'r_forearm',
  'RightHand':        'r_hand',
  'LeftUpLeg':        'l_thigh',
  'LeftLeg':          'l_shin',
  'LeftFoot':         'l_foot',
  'RightUpLeg':       'r_thigh',
  'RightLeg':         'r_shin',
  'RightFoot':        'r_foot',
  // iClone / CC names
  'CC_Base_Hip':      'hips',
  'CC_Base_Spine01':  'spine',
  'CC_Base_Head':     'head',
  'CC_Base_L_Upperarm': 'l_upper_arm',
  'CC_Base_R_Upperarm': 'r_upper_arm',
};

/**
 * Project a 3D world position to 2D canvas coords.
 * Uses simple orthographic projection + canvas centering.
 */
function projectTo2D(worldPos, canvasW=640, canvasH=480, scale=6, offsetY=300) {
  return {
    x: canvasW / 2 + worldPos.x * scale,
    y: offsetY  - worldPos.y * scale,  // Y-flip: 3D up = 2D up
  };
}

/**
 * Extract 2D rotation from 3D bone quaternion.
 * Decomposes to Euler ZXY, returns Z angle in degrees for 2D rotation.
 */
function quatToRotation2D(quaternion) {
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'ZXY');
  return THREE.MathUtils.radToDeg(euler.z);
}

/**
 * Convert a Three.js SkinnedMesh/Skeleton animation (AnimationClip)
 * into .spxmotion format.
 *
 * @param {THREE.AnimationClip} clip
 * @param {THREE.Skeleton} skeleton
 * @param {object} options
 * @returns {object} spxmotion JSON object
 */
export function convertClipToSPXMotion(clip, skeleton, options = {}) {
  const {
    fps = 30,
    canvasW = 640,
    canvasH = 480,
    projectionScale = 6,
    projectionOffsetY = 300,
  } = options;

  const duration   = clip.duration;
  const frameCount = Math.ceil(duration * fps);
  const mixer      = new THREE.AnimationMixer(skeleton.bones[0].parent || skeleton.bones[0]);
  const action     = mixer.clipAction(clip);
  action.play();

  // Collect bone names (mapped to SPX names)
  const usedBones = [];
  skeleton.bones.forEach(bone => {
    const spxName = BONE_MAP_3D_TO_2D[bone.name] || bone.name.toLowerCase();
    usedBones.push({ bone, spxName });
  });

  const frames = [];
  for (let f = 0; f < frameCount; f++) {
    const time = f / fps;
    mixer.setTime(time);

    const keyframes = {};
    usedBones.forEach(({ bone, spxName }) => {
      const worldPos = new THREE.Vector3();
      bone.getWorldPosition(worldPos);
      const worldQuat = new THREE.Quaternion();
      bone.getWorldQuaternion(worldQuat);

      const pos2D   = projectTo2D(worldPos, canvasW, canvasH, projectionScale, projectionOffsetY);
      const rot2D   = quatToRotation2D(worldQuat);
      const worldScale = new THREE.Vector3();
      bone.getWorldScale(worldScale);

      keyframes[spxName] = {
        x:        Math.round(pos2D.x * 10) / 10,
        y:        Math.round(pos2D.y * 10) / 10,
        rotation: Math.round(rot2D * 10) / 10,
        scale:    Math.round(worldScale.y * 100) / 100,
      };
    });

    frames.push({ time: Math.round(time * 1000) / 1000, keyframes });
  }

  action.stop();

  return {
    version:  '1.0',
    format:   'spxmotion',
    name:     clip.name || 'unnamed',
    fps,
    duration: Math.round(duration * 1000) / 1000,
    canvasW,
    canvasH,
    bones:    usedBones.map(b => b.spxName),
    frames,
  };
}

/**
 * Convert raw bone position arrays (non-THREE workflow, e.g. from BVH)
 * into .spxmotion. boneFrames = { boneName: [ {time, x,y,z, qx,qy,qz,qw}, ... ] }
 */
export function convertRawBonesToSPXMotion(boneFrames, options = {}) {
  const {
    fps = 30,
    canvasW = 640,
    canvasH = 480,
    projectionScale = 6,
    projectionOffsetY = 300,
  } = options;

  const boneNames = Object.keys(boneFrames);
  const allTimes  = new Set();
  boneNames.forEach(b => boneFrames[b].forEach(f => allTimes.add(f.time)));
  const sortedTimes = Array.from(allTimes).sort((a,b) => a-b);

  const frames = sortedTimes.map(time => {
    const keyframes = {};
    boneNames.forEach(rawName => {
      const spxName = BONE_MAP_3D_TO_2D[rawName] || rawName.toLowerCase();
      // Find closest frame
      const arr = boneFrames[rawName];
      const frame = arr.reduce((prev, cur) => Math.abs(cur.time-time) < Math.abs(prev.time-time) ? cur : prev);

      const worldPos = new THREE.Vector3(frame.x || 0, frame.y || 0, frame.z || 0);
      const quat     = new THREE.Quaternion(frame.qx||0, frame.qy||0, frame.qz||0, frame.qw||1);
      const pos2D    = projectTo2D(worldPos, canvasW, canvasH, projectionScale, projectionOffsetY);
      const rot2D    = quatToRotation2D(quat);

      keyframes[spxName] = {
        x:        Math.round(pos2D.x * 10) / 10,
        y:        Math.round(pos2D.y * 10) / 10,
        rotation: Math.round(rot2D * 10) / 10,
        scale:    1.0,
      };
    });
    return { time: Math.round(time * 1000) / 1000, keyframes };
  });

  const duration = sortedTimes[sortedTimes.length - 1] || 0;

  return {
    version: '1.0',
    format:  'spxmotion',
    name:    'converted',
    fps,
    duration,
    canvasW,
    canvasH,
    bones: [...new Set(boneNames.map(n => BONE_MAP_3D_TO_2D[n] || n.toLowerCase()))],
    frames,
  };
}

/**
 * Download .spxmotion file
 */
export function downloadSPXMotion(spxmotionObj, filename = 'animation.spxmotion') {
  const blob = new Blob([JSON.stringify(spxmotionObj, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { BONE_MAP_3D_TO_2D, projectTo2D, quatToRotation2D };