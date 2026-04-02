/**
 * HairMaterials.js — SPX Mesh Editor
 * Kajiya-Kay anisotropic hair shader, PBR card material, wet material,
 * fur shell material, and a preset color library.
 */
import * as THREE from 'three';

// ─── Color presets ────────────────────────────────────────────────────────────
export const HAIR_COLOR_PRESETS = {
  jetBlack:      { root: '#0a0808', tip: '#1a1010', specular: '#ffffff' },
  darkBrown:     { root: '#2a1808', tip: '#4a2810', specular: '#ffe0b0' },
  mediumBrown:   { root: '#4a2810', tip: '#8a5020', specular: '#ffd090' },
  lightBrown:    { root: '#8a5020', tip: '#c08040', specular: '#fff0c0' },
  dirtyBlonde:   { root: '#b08040', tip: '#d0b060', specular: '#fffff0' },
  blonde:        { root: '#d0b060', tip: '#f0d890', specular: '#ffffff' },
  platinumBlonde:{ root: '#e8e0c0', tip: '#f8f4e8', specular: '#ffffff' },
  ashBlonde:     { root: '#c0b890', tip: '#d8cca8', specular: '#ffffff' },
  strawberry:    { root: '#c07050', tip: '#e09070', specular: '#fff0e8' },
  auburn:        { root: '#6a2818', tip: '#a04830', specular: '#ffd0b0' },
  red:           { root: '#8a1808', tip: '#c83018', specular: '#ffb090' },
  copper:        { root: '#a04018', tip: '#d07030', specular: '#ffc080' },
  grey:          { root: '#888880', tip: '#b8b8b0', specular: '#ffffff' },
  white:         { root: '#d8d8d8', tip: '#f8f8f8', specular: '#ffffff' },
  blue:          { root: '#101840', tip: '#2030a0', specular: '#80c0ff' },
  pink:          { root: '#c04060', tip: '#f080a0', specular: '#ffc0d0' },
  purple:        { root: '#401860', tip: '#8030c0', specular: '#d0a0ff' },
  green:         { root: '#104020', tip: '#208040', specular: '#80ffa0' },
};

// ─── Kajiya-Kay anisotropic GLSL ─────────────────────────────────────────────
const KK_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vTangent;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    vUv        = uv;
    vNormal    = normalize(normalMatrix * normal);
    vTangent   = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));
    vec4 mv    = modelViewMatrix * vec4(position, 1.0);
    vViewDir   = normalize(-mv.xyz);
    vAlpha     = 1.0 - uv.y * 0.4;  // tip fade
    gl_Position = projectionMatrix * mv;
  }
`;
const KK_FRAG = /* glsl */ `
  uniform vec3  uRootColor;
  uniform vec3  uTipColor;
  uniform vec3  uSpecColor;
  uniform float uSpecPower;
  uniform float uSpecShift;
  uniform float uSpecShift2;
  uniform float uSpec2Strength;
  uniform vec3  uLightDir;
  uniform float uAlphaTest;

  varying vec3  vNormal;
  varying vec3  vTangent;
  varying vec3  vViewDir;
  varying vec2  vUv;
  varying float vAlpha;

  // Kajiya-Kay specular term
  float kkSpec(vec3 T, vec3 V, vec3 L, float shift, float power) {
    vec3  H     = normalize(L + V);
    float TdotH = dot(T, H);
    float sinTH = sqrt(max(0.0, 1.0 - TdotH * TdotH));
    return pow(max(0.0, sinTH), power);
  }

  void main() {
    vec3 color  = mix(uRootColor, uTipColor, vUv.y);
    vec3 T      = normalize(vTangent + vNormal * uSpecShift);
    vec3 T2     = normalize(vTangent + vNormal * uSpecShift2);
    vec3 L      = normalize(uLightDir);
    float diff  = max(0.0, dot(vNormal, L)) * 0.7 + 0.3;
    float spec1 = kkSpec(T,  vViewDir, L, uSpecShift,  uSpecPower);
    float spec2 = kkSpec(T2, vViewDir, L, uSpecShift2, uSpecPower * 0.5) * uSpec2Strength;
    vec3  final = color * diff + uSpecColor * (spec1 + spec2);
    gl_FragColor = vec4(final, vAlpha);
    if (gl_FragColor.a < uAlphaTest) discard;
  }
`;

export function createKajiyaKayMaterial(opts = {}) {
  const preset = HAIR_COLOR_PRESETS[opts.preset ?? 'darkBrown'];
  return new THREE.ShaderMaterial({
    vertexShader:   KK_VERT,
    fragmentShader: KK_FRAG,
    uniforms: {
      uRootColor:     { value: new THREE.Color(opts.rootColor ?? preset.root)     },
      uTipColor:      { value: new THREE.Color(opts.tipColor  ?? preset.tip)      },
      uSpecColor:     { value: new THREE.Color(opts.specColor ?? preset.specular) },
      uSpecPower:     { value: opts.specPower    ?? 80.0  },
      uSpecShift:     { value: opts.specShift    ?? 0.05  },
      uSpecShift2:    { value: opts.specShift2   ?? -0.05 },
      uSpec2Strength: { value: opts.spec2Strength ?? 0.5  },
      uLightDir:      { value: new THREE.Vector3(0.5, 1, 0.5).normalize() },
      uAlphaTest:     { value: opts.alphaTest ?? 0.1 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

// ─── PBR card material ────────────────────────────────────────────────────────
export function createPBRCardMaterial(opts = {}) {
  const preset = HAIR_COLOR_PRESETS[opts.preset ?? 'mediumBrown'];
  const mat = new THREE.MeshStandardMaterial({
    color:       new THREE.Color(opts.color ?? preset.root),
    roughness:   opts.roughness   ?? 0.75,
    metalness:   opts.metalness   ?? 0.0,
    transparent: true,
    alphaTest:   opts.alphaTest   ?? 0.1,
    side:        THREE.DoubleSide,
    depthWrite:  false,
  });
  if (opts.map)         mat.map         = opts.map;
  if (opts.alphaMap)    mat.alphaMap    = opts.alphaMap;
  if (opts.normalMap)   mat.normalMap   = opts.normalMap;
  return mat;
}

// ─── Wet hair material ────────────────────────────────────────────────────────
const WET_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uWetness;
  void main() {
    vUv      = uv;
    vNormal  = normalize(normalMatrix * normal);
    vec4 mv  = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    // Clumping: pull verts toward strand center
    vec3 clumped = position + normal * (-uWetness * 0.003 * (1.0 - uv.y));
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(clumped, 1.0);
  }
`;
const WET_FRAG = /* glsl */ `
  uniform vec3  uBaseColor;
  uniform float uWetness;
  uniform float uTime;
  varying vec3  vNormal;
  varying vec3  vViewDir;
  varying vec2  vUv;
  void main() {
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 3.0);
    vec3  wet     = uBaseColor * (1.0 - uWetness * 0.4);
    float gloss   = fresnel * uWetness;
    // Drip animation
    float drip    = smoothstep(0.6, 0.7, fract(vUv.y - uTime * 0.3)) * uWetness;
    gl_FragColor  = vec4(mix(wet, vec3(0.8, 0.9, 1.0), gloss + drip * 0.3), 1.0 - vUv.y * 0.2);
  }
`;

export function createWetHairMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader:   WET_VERT,
    fragmentShader: WET_FRAG,
    uniforms: {
      uBaseColor: { value: new THREE.Color(opts.color ?? '#1a1010') },
      uWetness:   { value: opts.wetness ?? 0.8 },
      uTime:      { value: 0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
  });
}

// ─── Fur shell material ───────────────────────────────────────────────────────
export function createFurShellMaterial(shellIndex, totalShells, opts = {}) {
  const t = shellIndex / totalShells;
  return new THREE.MeshStandardMaterial({
    color:       new THREE.Color(opts.color ?? '#8a6030'),
    roughness:   0.9,
    transparent: true,
    alphaTest:   0.5,
    depthWrite:  shellIndex === totalShells - 1,
    side:        THREE.FrontSide,
  });
}

export function buildFurShellStack(geo, shells = 16, opts = {}) {
  const meshes = [];
  for (let i = 0; i < shells; i++) {
    const mat  = createFurShellMaterial(i, shells, opts);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = (i / shells) * (opts.furLength ?? 0.05);
    meshes.push(mesh);
  }
  return meshes;
}

export default { createKajiyaKayMaterial, createPBRCardMaterial, createWetHairMaterial, createFurShellMaterial, buildFurShellStack, HAIR_COLOR_PRESETS };
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
