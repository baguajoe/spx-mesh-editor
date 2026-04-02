/**
 * HairMaterials.js — SPX Mesh Editor
 * Kajiya-Kay anisotropic hair shader, PBR card material, wet material,
 * fur shell material, and a preset color library.
 */
import * as THREE from 'three';\n\n// ─── Color presets ────────────────────────────────────────────────────────────\nexport const HAIR_COLOR_PRESETS = {\n  jetBlack:      { root: '#0a0808', tip: '#1a1010', specular: '#ffffff' },\n  darkBrown:     { root: '#2a1808', tip: '#4a2810', specular: '#ffe0b0' },\n  mediumBrown:   { root: '#4a2810', tip: '#8a5020', specular: '#ffd090' },\n  lightBrown:    { root: '#8a5020', tip: '#c08040', specular: '#fff0c0' },\n  dirtyBlonde:   { root: '#b08040', tip: '#d0b060', specular: '#fffff0' },\n  blonde:        { root: '#d0b060', tip: '#f0d890', specular: '#ffffff' },\n  platinumBlonde:{ root: '#e8e0c0', tip: '#f8f4e8', specular: '#ffffff' },\n  ashBlonde:     { root: '#c0b890', tip: '#d8cca8', specular: '#ffffff' },\n  strawberry:    { root: '#c07050', tip: '#e09070', specular: '#fff0e8' },\n  auburn:        { root: '#6a2818', tip: '#a04830', specular: '#ffd0b0' },\n  red:           { root: '#8a1808', tip: '#c83018', specular: '#ffb090' },\n  copper:        { root: '#a04018', tip: '#d07030', specular: '#ffc080' },\n  grey:          { root: '#888880', tip: '#b8b8b0', specular: '#ffffff' },\n  white:         { root: '#d8d8d8', tip: '#f8f8f8', specular: '#ffffff' },\n  blue:          { root: '#101840', tip: '#2030a0', specular: '#80c0ff' },\n  pink:          { root: '#c04060', tip: '#f080a0', specular: '#ffc0d0' },\n  purple:        { root: '#401860', tip: '#8030c0', specular: '#d0a0ff' },\n  green:         { root: '#104020', tip: '#208040', specular: '#80ffa0' },\n};\n\n// ─── Kajiya-Kay anisotropic GLSL ─────────────────────────────────────────────\nconst KK_VERT = /* glsl */ `\n  varying vec3 vNormal;\n  varying vec3 vTangent;\n  varying vec3 vViewDir;\n  varying vec2 vUv;\n  varying float vAlpha;\n\n  void main() {\n    vUv        = uv;\n    vNormal    = normalize(normalMatrix * normal);\n    vTangent   = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));\n    vec4 mv    = modelViewMatrix * vec4(position, 1.0);\n    vViewDir   = normalize(-mv.xyz);\n    vAlpha     = 1.0 - uv.y * 0.4;  // tip fade\n    gl_Position = projectionMatrix * mv;\n  }\n`;\nconst KK_FRAG = /* glsl */ `\n  uniform vec3  uRootColor;\n  uniform vec3  uTipColor;\n  uniform vec3  uSpecColor;\n  uniform float uSpecPower;\n  uniform float uSpecShift;\n  uniform float uSpecShift2;\n  uniform float uSpec2Strength;\n  uniform vec3  uLightDir;\n  uniform float uAlphaTest;\n\n  varying vec3  vNormal;\n  varying vec3  vTangent;\n  varying vec3  vViewDir;\n  varying vec2  vUv;\n  varying float vAlpha;\n\n  // Kajiya-Kay specular term\n  float kkSpec(vec3 T, vec3 V, vec3 L, float shift, float power) {\n    vec3  H     = normalize(L + V);\n    float TdotH = dot(T, H);\n    float sinTH = sqrt(max(0.0, 1.0 - TdotH * TdotH));\n    return pow(max(0.0, sinTH), power);\n  }\n\n  void main() {\n    vec3 color  = mix(uRootColor, uTipColor, vUv.y);\n    vec3 T      = normalize(vTangent + vNormal * uSpecShift);\n    vec3 T2     = normalize(vTangent + vNormal * uSpecShift2);\n    vec3 L      = normalize(uLightDir);\n    float diff  = max(0.0, dot(vNormal, L)) * 0.7 + 0.3;\n    float spec1 = kkSpec(T,  vViewDir, L, uSpecShift,  uSpecPower);\n    float spec2 = kkSpec(T2, vViewDir, L, uSpecShift2, uSpecPower * 0.5) * uSpec2Strength;\n    vec3  final = color * diff + uSpecColor * (spec1 + spec2);\n    gl_FragColor = vec4(final, vAlpha);\n    if (gl_FragColor.a < uAlphaTest) discard;\n  }\n`;\n\nexport function createKajiyaKayMaterial(opts = {}) {\n  const preset = HAIR_COLOR_PRESETS[opts.preset ?? 'darkBrown'];\n  return new THREE.ShaderMaterial({\n    vertexShader:   KK_VERT,\n    fragmentShader: KK_FRAG,\n    uniforms: {\n      uRootColor:     { value: new THREE.Color(opts.rootColor ?? preset.root)     },\n      uTipColor:      { value: new THREE.Color(opts.tipColor  ?? preset.tip)      },\n      uSpecColor:     { value: new THREE.Color(opts.specColor ?? preset.specular) },\n      uSpecPower:     { value: opts.specPower    ?? 80.0  },\n      uSpecShift:     { value: opts.specShift    ?? 0.05  },\n      uSpecShift2:    { value: opts.specShift2   ?? -0.05 },\n      uSpec2Strength: { value: opts.spec2Strength ?? 0.5  },\n      uLightDir:      { value: new THREE.Vector3(0.5, 1, 0.5).normalize() },\n      uAlphaTest:     { value: opts.alphaTest ?? 0.1 },\n    },\n    transparent: true,\n    side: THREE.DoubleSide,\n    depthWrite: false,\n  });\n}\n\n// ─── PBR card material ────────────────────────────────────────────────────────\nexport function createPBRCardMaterial(opts = {}) {\n  const preset = HAIR_COLOR_PRESETS[opts.preset ?? 'mediumBrown'];\n  const mat = new THREE.MeshStandardMaterial({\n    color:       new THREE.Color(opts.color ?? preset.root),\n    roughness:   opts.roughness   ?? 0.75,\n    metalness:   opts.metalness   ?? 0.0,\n    transparent: true,\n    alphaTest:   opts.alphaTest   ?? 0.1,\n    side:        THREE.DoubleSide,\n    depthWrite:  false,\n  });\n  if (opts.map)         mat.map         = opts.map;\n  if (opts.alphaMap)    mat.alphaMap    = opts.alphaMap;\n  if (opts.normalMap)   mat.normalMap   = opts.normalMap;\n  return mat;\n}\n\n// ─── Wet hair material ────────────────────────────────────────────────────────\nconst WET_VERT = /* glsl */ `\n  varying vec3 vNormal;\n  varying vec3 vViewDir;\n  varying vec2 vUv;\n  uniform float uTime;\n  uniform float uWetness;\n  void main() {\n    vUv      = uv;\n    vNormal  = normalize(normalMatrix * normal);\n    vec4 mv  = modelViewMatrix * vec4(position, 1.0);\n    vViewDir = normalize(-mv.xyz);\n    // Clumping: pull verts toward strand center\n    vec3 clumped = position + normal * (-uWetness * 0.003 * (1.0 - uv.y));\n    gl_Position  = projectionMatrix * modelViewMatrix * vec4(clumped, 1.0);\n  }\n`;\nconst WET_FRAG = /* glsl */ `\n  uniform vec3  uBaseColor;\n  uniform float uWetness;\n  uniform float uTime;\n  varying vec3  vNormal;\n  varying vec3  vViewDir;\n  varying vec2  vUv;\n  void main() {\n    float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 3.0);\n    vec3  wet     = uBaseColor * (1.0 - uWetness * 0.4);\n    float gloss   = fresnel * uWetness;\n    // Drip animation\n    float drip    = smoothstep(0.6, 0.7, fract(vUv.y - uTime * 0.3)) * uWetness;\n    gl_FragColor  = vec4(mix(wet, vec3(0.8, 0.9, 1.0), gloss + drip * 0.3), 1.0 - vUv.y * 0.2);\n  }\n`;\n\nexport function createWetHairMaterial(opts = {}) {\n  return new THREE.ShaderMaterial({\n    vertexShader:   WET_VERT,\n    fragmentShader: WET_FRAG,\n    uniforms: {\n      uBaseColor: { value: new THREE.Color(opts.color ?? '#1a1010') },\n      uWetness:   { value: opts.wetness ?? 0.8 },\n      uTime:      { value: 0 },\n    },\n    transparent: true,\n    side: THREE.DoubleSide,\n  });\n}\n\n// ─── Fur shell material ───────────────────────────────────────────────────────\nexport function createFurShellMaterial(shellIndex, totalShells, opts = {}) {\n  const t = shellIndex / totalShells;\n  return new THREE.MeshStandardMaterial({\n    color:       new THREE.Color(opts.color ?? '#8a6030'),
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
