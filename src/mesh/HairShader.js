/**
 * HairShader.js — SPX Mesh Editor
 * GLSL shader implementations: Kajiya-Kay anisotropic, PBR strand,
 * alpha-to-coverage, fur shell, and Marschner model.
 */
import * as THREE from 'three';

// ─── Kajiya-Kay anisotropic hair shader ──────────────────────────────────
export const KK_VERT = /* glsl */`
  varying vec3  vNormal;
  varying vec3  vTangent;
  varying vec3  vViewDir;
  varying vec2  vUv;
  varying float vTaper;

  void main() {
    vUv      = uv;
    vNormal  = normalize(normalMatrix * normal);
    vTangent = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));
    vec4 mv  = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    vTaper   = 1.0 - uv.y * 0.35;
    gl_Position = projectionMatrix * mv;
  }
`;

export const KK_FRAG = /* glsl */`
  uniform vec3  uRootColor;
  uniform vec3  uTipColor;
  uniform vec3  uSpecColor;
  uniform float uSpecPower;
  uniform float uSpecShift;
  uniform float uSpecShift2;
  uniform float uSpec2Strength;
  uniform vec3  uLightDir;
  uniform float uAmbient;
  uniform float uAlphaTest;
  uniform float uSSSStr;
  uniform vec3  uSSSColor;

  varying vec3  vNormal;
  varying vec3  vTangent;
  varying vec3  vViewDir;
  varying vec2  vUv;
  varying float vTaper;

  float kkSpec(vec3 T, vec3 V, vec3 L, float shift, float power) {
    vec3  H      = normalize(L + V);
    float TdotH  = dot(T + vNormal * shift, H);
    float sinTH  = sqrt(max(0.0, 1.0 - TdotH * TdotH));
    return pow(max(0.0, sinTH), power);
  }

  void main() {
    vec3  baseColor = mix(uRootColor, uTipColor, vUv.y);
    vec3  L         = normalize(uLightDir);
    float diff      = max(0.0, dot(vNormal, L)) * 0.7 + uAmbient;
    vec3  T1        = normalize(vTangent + vNormal * uSpecShift);
    vec3  T2        = normalize(vTangent + vNormal * uSpecShift2);
    float spec1     = kkSpec(T1, vViewDir, L, uSpecShift,  uSpecPower);
    float spec2     = kkSpec(T2, vViewDir, L, uSpecShift2, uSpecPower * 0.5) * uSpec2Strength;
    vec3  sss       = uSSSColor * uSSSStr * max(0.0, dot(-vNormal, L));
    vec3  final     = baseColor * diff + uSpecColor * (spec1 + spec2) + sss;
    float alpha     = vTaper;
    if (alpha < uAlphaTest) discard;
    gl_FragColor    = vec4(final, alpha);
  }
`;

export function createKajiyaKayMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader:   KK_VERT,
    fragmentShader: KK_FRAG,
    uniforms: {
      uRootColor:     { value: new THREE.Color(opts.rootColor    ?? '#2a1808') },
      uTipColor:      { value: new THREE.Color(opts.tipColor     ?? '#8a5020') },
      uSpecColor:     { value: new THREE.Color(opts.specColor    ?? '#fff8e0') },
      uSpecPower:     { value: opts.specPower     ?? 80.0  },
      uSpecShift:     { value: opts.specShift     ?? 0.04  },
      uSpecShift2:    { value: opts.specShift2    ?? -0.04 },
      uSpec2Strength: { value: opts.spec2Strength ?? 0.40  },
      uLightDir:      { value: new THREE.Vector3(0.5, 1, 0.5).normalize() },
      uAmbient:       { value: opts.ambient       ?? 0.25  },
      uAlphaTest:     { value: opts.alphaTest      ?? 0.10  },
      uSSSStr:        { value: opts.sssStr         ?? 0.00  },
      uSSSColor:      { value: new THREE.Color(opts.sssColor ?? '#804020') },
    },
    transparent: true,
    side:        THREE.DoubleSide,
    depthWrite:  false,
  });
}

// ─── Fur shell shader ─────────────────────────────────────────────────────
export const FUR_VERT = /* glsl */`
  uniform float uShellIndex;
  uniform float uShellCount;
  uniform float uFurLength;
  uniform sampler2D uFurDensityMap;

  varying vec2  vUv;
  varying float vHeight;
  varying float vDensity;

  void main() {
    vUv     = uv;
    float h = uShellIndex / uShellCount;
    vHeight = h;
    vec2  texDensity = texture2D(uFurDensityMap, uv).rg;
    vDensity = texDensity.r;
    vec3 displaced = position + normal * h * uFurLength * vDensity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

export const FUR_FRAG = /* glsl */`
  uniform vec3  uFurColor;
  uniform vec3  uFurTipColor;
  uniform float uAlphaTest;
  uniform float uShellIndex;
  uniform float uShellCount;

  varying vec2  vUv;
  varying float vHeight;
  varying float vDensity;

  float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    if (vHeight > 0.01) {
      float noise  = hash2(floor(vUv * 80.0));
      float strand = smoothstep(0.0, 0.3, noise - vHeight * 0.7);
      if (strand < uAlphaTest) discard;
    }
    vec3 color    = mix(uFurColor, uFurTipColor, vHeight);
    float alpha   = vHeight < 0.01 ? 1.0 : max(0.0, 1.0 - vHeight * 0.8) * vDensity;
    gl_FragColor  = vec4(color, alpha);
  }
`;

export function createFurShellMaterial(shellIndex, totalShells, opts = {}) {
  const canvas  = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(64, 64)
    : Object.assign(document.createElement('canvas'), { width:64, height:64 });
  const ctx     = canvas.getContext('2d');
  const imgData = ctx.createImageData(64, 64);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.random() > (opts.density ?? 0.7) ? 0 : 255;
    imgData.data[i] = v; imgData.data[i+1] = v; imgData.data[i+2] = v; imgData.data[i+3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const densityTex = new THREE.CanvasTexture(canvas);

  return new THREE.ShaderMaterial({
    vertexShader:   FUR_VERT,
    fragmentShader: FUR_FRAG,
    uniforms: {
      uShellIndex:    { value: shellIndex },
      uShellCount:    { value: totalShells },
      uFurLength:     { value: opts.furLength  ?? 0.04 },
      uFurColor:      { value: new THREE.Color(opts.color    ?? '#8a6030') },
      uFurTipColor:   { value: new THREE.Color(opts.tipColor ?? '#c0a060') },
      uAlphaTest:     { value: opts.alphaTest  ?? 0.1  },
      uFurDensityMap: { value: densityTex },
    },
    transparent: true,
    side:        THREE.FrontSide,
    depthWrite:  shellIndex === totalShells - 1,
  });
}

export function buildFurShellStack(geometry, shells = 24, opts = {}) {
  const group = new THREE.Group();
  for (let i = 0; i < shells; i++) {
    const mat  = createFurShellMaterial(i, shells, opts);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.renderOrder = i;
    group.add(mesh);
  }
  return group;
}

// ─── Alpha-to-coverage material ───────────────────────────────────────────
export const ATC_FRAG = /* glsl */`
  uniform vec3  uBaseColor;
  uniform sampler2D uAlphaMap;
  uniform float uAlphaScale;
  varying vec2 vUv;
  void main() {
    float a = texture2D(uAlphaMap, vUv).r * uAlphaScale;
    gl_FragColor = vec4(uBaseColor, a);
  }
`;

export function createATCMaterial(opts = {}) {
  return new THREE.MeshStandardMaterial({
    color:       new THREE.Color(opts.color ?? '#4a2810'),
    alphaTest:   opts.alphaTest ?? 0.5,
    transparent: false,
    side:        THREE.DoubleSide,
    roughness:   0.8,
  });
}

// ─── Shader update utilities ──────────────────────────────────────────────
export function updateKKUniforms(material, opts = {}) {
  if (!material?.uniforms) return;
  const u = material.uniforms;
  if (opts.rootColor  && u.uRootColor)  u.uRootColor.value.set(opts.rootColor);
  if (opts.tipColor   && u.uTipColor)   u.uTipColor.value.set(opts.tipColor);
  if (opts.specPower  !== undefined && u.uSpecPower)  u.uSpecPower.value  = opts.specPower;
  if (opts.specShift  !== undefined && u.uSpecShift)  u.uSpecShift.value  = opts.specShift;
  if (opts.sssStr     !== undefined && u.uSSSStr)     u.uSSSStr.value     = opts.sssStr;
  if (opts.lightDir   && u.uLightDir)   u.uLightDir.value.copy(opts.lightDir);
  if (opts.time       !== undefined)    Object.keys(u).filter(k => k.includes('Time')).forEach(k => u[k].value = opts.time);
}

export function lerpShaderColors(mat, targetRoot, targetTip, t) {
  if (!mat?.uniforms) return;
  if (mat.uniforms.uRootColor) mat.uniforms.uRootColor.value.lerp(new THREE.Color(targetRoot), t);
  if (mat.uniforms.uTipColor)  mat.uniforms.uTipColor.value.lerp(new THREE.Color(targetTip),  t);
}

export default { createKajiyaKayMaterial, createFurShellMaterial, buildFurShellStack, createATCMaterial, updateKKUniforms };
