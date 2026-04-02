// src/front/utils/poseConstants.js
// MediaPipe Pose Landmark Indices - OFFICIAL REFERENCE
// https://developers.google.com/mediapipe/solutions/vision/pose_landmarker

export const POSE_LANDMARKS = {
  // Face
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,

  // Upper Body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,

  // Hands
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,

  // Lower Body
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

// Standard humanoid bone names (compatible with Mixamo, Unity, Ready Player Me)
export const STANDARD_BONES = {
  // Spine
  HIPS: 'Hips',\n  SPINE: 'Spine',\n  SPINE1: 'Spine1',\n  SPINE2: 'Spine2',\n  CHEST: 'Chest',\n  NECK: 'Neck',\n  HEAD: 'Head',\n\n  // Left Arm\n  LEFT_SHOULDER: 'LeftShoulder',\n  LEFT_UPPER_ARM: 'LeftUpperArm',\n  LEFT_LOWER_ARM: 'LeftLowerArm',\n  LEFT_HAND: 'LeftHand',\n\n  // Right Arm\n  RIGHT_SHOULDER: 'RightShoulder',\n  RIGHT_UPPER_ARM: 'RightUpperArm',\n  RIGHT_LOWER_ARM: 'RightLowerArm',\n  RIGHT_HAND: 'RightHand',\n\n  // Left Leg\n  LEFT_UPPER_LEG: 'LeftUpperLeg',\n  LEFT_LOWER_LEG: 'LeftLowerLeg',\n  LEFT_FOOT: 'LeftFoot',\n  LEFT_TOE: 'LeftToe',\n\n  // Right Leg\n  RIGHT_UPPER_LEG: 'RightUpperLeg',\n  RIGHT_LOWER_LEG: 'RightLowerLeg',\n  RIGHT_FOOT: 'RightFoot',\n  RIGHT_TOE: 'RightToe',\n};\n\n// Map MediaPipe landmark index to avatar bone name\nexport const POSE_TO_BONE_MAP = {\n  // Head & Face\n  [POSE_LANDMARKS.NOSE]: STANDARD_BONES.HEAD,\n\n  // Left Arm Chain\n  [POSE_LANDMARKS.LEFT_SHOULDER]: STANDARD_BONES.LEFT_SHOULDER,\n  [POSE_LANDMARKS.LEFT_ELBOW]: STANDARD_BONES.LEFT_UPPER_ARM,\n  [POSE_LANDMARKS.LEFT_WRIST]: STANDARD_BONES.LEFT_LOWER_ARM,\n  [POSE_LANDMARKS.LEFT_INDEX]: STANDARD_BONES.LEFT_HAND,\n\n  // Right Arm Chain\n  [POSE_LANDMARKS.RIGHT_SHOULDER]: STANDARD_BONES.RIGHT_SHOULDER,\n  [POSE_LANDMARKS.RIGHT_ELBOW]: STANDARD_BONES.RIGHT_UPPER_ARM,\n  [POSE_LANDMARKS.RIGHT_WRIST]: STANDARD_BONES.RIGHT_LOWER_ARM,\n  [POSE_LANDMARKS.RIGHT_INDEX]: STANDARD_BONES.RIGHT_HAND,\n\n  // Left Leg Chain\n  [POSE_LANDMARKS.LEFT_HIP]: STANDARD_BONES.LEFT_UPPER_LEG,\n  [POSE_LANDMARKS.LEFT_KNEE]: STANDARD_BONES.LEFT_LOWER_LEG,\n  [POSE_LANDMARKS.LEFT_ANKLE]: STANDARD_BONES.LEFT_FOOT,\n  [POSE_LANDMARKS.LEFT_FOOT_INDEX]: STANDARD_BONES.LEFT_TOE,\n\n  // Right Leg Chain\n  [POSE_LANDMARKS.RIGHT_HIP]: STANDARD_BONES.RIGHT_UPPER_LEG,\n  [POSE_LANDMARKS.RIGHT_KNEE]: STANDARD_BONES.RIGHT_LOWER_LEG,\n  [POSE_LANDMARKS.RIGHT_ANKLE]: STANDARD_BONES.RIGHT_FOOT,\n  [POSE_LANDMARKS.RIGHT_FOOT_INDEX]: STANDARD_BONES.RIGHT_TOE,\n};\n\n// Bone connections for calculating rotations\n// Each entry: [parentLandmark, childLandmark, boneName]\nexport const BONE_CONNECTIONS = [\n  // Spine (calculated from shoulders and hips)\n  { bone: STANDARD_BONES.HIPS, from: POSE_LANDMARKS.LEFT_HIP, to: POSE_LANDMARKS.RIGHT_HIP },\n  \n  // Left Arm\n  { bone: STANDARD_BONES.LEFT_UPPER_ARM, from: POSE_LANDMARKS.LEFT_SHOULDER, to: POSE_LANDMARKS.LEFT_ELBOW },\n  { bone: STANDARD_BONES.LEFT_LOWER_ARM, from: POSE_LANDMARKS.LEFT_ELBOW, to: POSE_LANDMARKS.LEFT_WRIST },\n  { bone: STANDARD_BONES.LEFT_HAND, from: POSE_LANDMARKS.LEFT_WRIST, to: POSE_LANDMARKS.LEFT_INDEX },\n\n  // Right Arm\n  { bone: STANDARD_BONES.RIGHT_UPPER_ARM, from: POSE_LANDMARKS.RIGHT_SHOULDER, to: POSE_LANDMARKS.RIGHT_ELBOW },\n  { bone: STANDARD_BONES.RIGHT_LOWER_ARM, from: POSE_LANDMARKS.RIGHT_ELBOW, to: POSE_LANDMARKS.RIGHT_WRIST },\n  { bone: STANDARD_BONES.RIGHT_HAND, from: POSE_LANDMARKS.RIGHT_WRIST, to: POSE_LANDMARKS.RIGHT_INDEX },\n\n  // Left Leg\n  { bone: STANDARD_BONES.LEFT_UPPER_LEG, from: POSE_LANDMARKS.LEFT_HIP, to: POSE_LANDMARKS.LEFT_KNEE },\n  { bone: STANDARD_BONES.LEFT_LOWER_LEG, from: POSE_LANDMARKS.LEFT_KNEE, to: POSE_LANDMARKS.LEFT_ANKLE },\n  { bone: STANDARD_BONES.LEFT_FOOT, from: POSE_LANDMARKS.LEFT_ANKLE, to: POSE_LANDMARKS.LEFT_FOOT_INDEX },\n\n  // Right Leg\n  { bone: STANDARD_BONES.RIGHT_UPPER_LEG, from: POSE_LANDMARKS.RIGHT_HIP, to: POSE_LANDMARKS.RIGHT_KNEE },\n  { bone: STANDARD_BONES.RIGHT_LOWER_LEG, from: POSE_LANDMARKS.RIGHT_KNEE, to: POSE_LANDMARKS.RIGHT_ANKLE },\n  { bone: STANDARD_BONES.RIGHT_FOOT, from: POSE_LANDMARKS.RIGHT_ANKLE, to: POSE_LANDMARKS.RIGHT_FOOT_INDEX },\n\n  // Head\n  { bone: STANDARD_BONES.HEAD, from: POSE_LANDMARKS.LEFT_EAR, to: POSE_LANDMARKS.RIGHT_EAR },\n];\n\n// Alternative bone name mappings for different avatar formats\nexport const BONE_NAME_ALIASES = {\n  // Mixamo style\n  'mixamorig:LeftArm': STANDARD_BONES.LEFT_UPPER_ARM,\n  'mixamorig1:LeftArm': STANDARD_BONES.LEFT_UPPER_ARM,\n  'mixamorig:LeftForeArm': STANDARD_BONES.LEFT_LOWER_ARM,\n  'mixamorig:RightArm': STANDARD_BONES.RIGHT_UPPER_ARM,\n  'mixamorig:RightForeArm': STANDARD_BONES.RIGHT_LOWER_ARM,\n  'mixamorig:LeftUpLeg': STANDARD_BONES.LEFT_UPPER_LEG,\n  'mixamorig:LeftLeg': STANDARD_BONES.LEFT_LOWER_LEG,\n  'mixamorig:RightUpLeg': STANDARD_BONES.RIGHT_UPPER_LEG,\n  'mixamorig:RightLeg': STANDARD_BONES.RIGHT_LOWER_LEG,\n\n  // Unity Humanoid style\n  'LeftArm': STANDARD_BONES.LEFT_UPPER_ARM,\n  'LeftForeArm': STANDARD_BONES.LEFT_LOWER_ARM,\n  'RightArm': STANDARD_BONES.RIGHT_UPPER_ARM,\n  'RightForeArm': STANDARD_BONES.RIGHT_LOWER_ARM,\n  'LeftUpLeg': STANDARD_BONES.LEFT_UPPER_LEG,\n  'LeftLeg': STANDARD_BONES.LEFT_LOWER_LEG,\n  'RightUpLeg': STANDARD_BONES.RIGHT_UPPER_LEG,\n  'RightLeg': STANDARD_BONES.RIGHT_LOWER_LEG,\n};\n\nexport default {\n  POSE_LANDMARKS,\n  STANDARD_BONES,\n  POSE_TO_BONE_MAP,\n  BONE_CONNECTIONS,\n  BONE_NAME_ALIASES,\n};\n// Mixamorig1 aliases (for some Mixamo exports)\nexport const MIXAMO_BONE_MAP = {\n  'mixamorig1:Hips': 'Hips',\n  'mixamorig1:Spine': 'Spine',\n  'mixamorig1:Spine1': 'Spine1',\n  'mixamorig1:Spine2': 'Spine2',\n  'mixamorig1:Neck': 'Neck',\n  'mixamorig1:Head': 'Head',\n  'mixamorig1:LeftShoulder': 'LeftShoulder',\n  'mixamorig1:LeftArm': 'LeftUpperArm',\n  'mixamorig1:LeftForeArm': 'LeftLowerArm',\n  'mixamorig1:LeftHand': 'LeftHand',\n  'mixamorig1:RightShoulder': 'RightShoulder',\n  'mixamorig1:RightArm': 'RightUpperArm',\n  'mixamorig1:RightForeArm': 'RightLowerArm',\n  'mixamorig1:RightHand': 'RightHand',\n  'mixamorig1:LeftUpLeg': 'LeftUpperLeg',\n  'mixamorig1:LeftLeg': 'LeftLowerLeg',\n  'mixamorig1:LeftFoot': 'LeftFoot',\n  'mixamorig1:RightUpLeg': 'RightUpperLeg',\n  'mixamorig1:RightLeg': 'RightLowerLeg',\n  'mixamorig1:RightFoot': 'RightFoot',
};
