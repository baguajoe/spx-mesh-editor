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

export const MARSCHNER_FRAG = /* glsl */`
  uniform vec3  uHairColor;
  uniform float uLongitudinalWidth;
  uniform float uAzimuthalWidth;
  uniform float uAlphaR;
  uniform float uAlphaTT;
  uniform float uAlphaTRT;
  varying vec3  vTangent;
  varying vec3  vViewDir;
  varying vec2  vUv;

  float gaussian(float x, float sigma) {
    return exp(-x*x/(2.0*sigma*sigma)) / (sigma * 2.5066);
  }

  void main() {
    vec3  L       = normalize(vec3(0.5, 1.0, 0.5));
    float thetaD  = asin(clamp(dot(vTangent, vViewDir), -1.0, 1.0));
    float thetaH  = asin(clamp(dot(vTangent, L), -1.0, 1.0));
    float phi     = acos(clamp(dot(vViewDir, L), -1.0, 1.0));
    float MR      = gaussian(thetaH - uAlphaR,   uLongitudinalWidth);
    float MTT     = gaussian(thetaH - uAlphaTT,  uLongitudinalWidth);
    float MTRT    = gaussian(thetaH - uAlphaTRT, uLongitudinalWidth);
    float NR      = 0.25 * cos(phi * 0.5);
    float NTT     = gaussian(phi - 0.0, uAzimuthalWidth);
    float NTRT    = gaussian(phi - 3.14159 * 0.33, uAzimuthalWidth * 2.0);
    float scatter = MR*NR*0.6 + MTT*NTT*0.3 + MTRT*NTRT*0.4;
    vec3  color   = mix(uHairColor, vec3(1.0), scatter * 0.3);
    gl_FragColor  = vec4(color, 1.0 - vUv.y * 0.25);
  }
`;

export function createMarschnerMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader:   KK_VERT,
    fragmentShader: MARSCHNER_FRAG,
    uniforms: {
      uHairColor:          { value: new THREE.Color(opts.color ?? '#4a2810') },
      uLongitudinalWidth:  { value: opts.longWidth  ?? 0.05 },
      uAzimuthalWidth:     { value: opts.aziWidth   ?? 0.15 },
      uAlphaR:             { value: opts.alphaR     ?? -0.0523 },
      uAlphaTT:            { value: opts.alphaTT    ?? 0.0262 },
      uAlphaTRT:           { value: opts.alphaTRT   ?? 0.0785 },
    },
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
  });
}

export function getMaterialForType(type, opts = {}) {
  switch(type) {
    case 'Kajiya-Kay': return createKajiyaKayMaterial(opts);
    case 'Fur Shell':  return createFurShellMaterial(opts.shellIndex??0, opts.totalShells??16, opts);
    case 'ATC':        return createATCMaterial(opts);
    case 'Marschner':  return createMarschnerMaterial(opts);
    default: return new THREE.MeshStandardMaterial({ color: new THREE.Color(opts.color ?? '#4a2810'), roughness:0.8, side:THREE.DoubleSide });
  }
}

export function disposeHairMaterial(material) {
  if (!material) return;
  Object.values(material.uniforms ?? {}).forEach(u => { u.value?.dispose?.(); });
  material.dispose();
}

export function cloneHairMaterial(material) {
  if (!material?.isShaderMaterial) return material?.clone?.() ?? material;
  const clone = material.clone();
  clone.uniforms = Object.fromEntries(
    Object.entries(material.uniforms).map(([k, u]) => [k, { value: u.value?.clone ? u.value.clone() : u.value }])
  );
  return clone;
}

export function setHairShaderLOD(material, lodLevel) {
  if (!material?.uniforms) return;
  const qualityMap = { 0:1.0, 1:0.8, 2:0.5, 3:0.2 };
  const q = qualityMap[lodLevel] ?? 1.0;
  if (material.uniforms.uSpec2Strength) material.uniforms.uSpec2Strength.value *= q;
  if (material.uniforms.uSSSStr)        material.uniforms.uSSSStr.value        *= q;
}

export const SHADER_PERFORMANCE = {
  'Kajiya-Kay': { relCost:1.0, notes:'Best quality/perf balance' },
  'PBR':        { relCost:1.3, notes:'Use for integration with PBR pipeline' },
  'Fur Shell':  { relCost:1.8, notes:'High cost — use low shell count' },
  'Marschner':  { relCost:2.0, notes:'Most physically accurate, expensive' },
  'ATC':        { relCost:0.7, notes:'Fastest — best for LOD 2+' },
};
export function getShaderRecommendation(cardCount, lodLevel) {
  if (lodLevel >= 3 || cardCount < 100) return 'ATC';
  if (lodLevel === 2) return 'PBR';
  return 'Kajiya-Kay';
}
export function buildShaderVariants(rootColor, tipColor) {
  return {
    lod0: createKajiyaKayMaterial({ rootColor, tipColor, specPower:80 }),
    lod1: createKajiyaKayMaterial({ rootColor, tipColor, specPower:40 }),
    lod2: createATCMaterial({ color: rootColor }),
    lod3: new THREE.MeshBasicMaterial({ color: new THREE.Color(rootColor) }),
  };
}
export function updateShaderTime(material, time) {
  if (material?.uniforms?.uTime) material.uniforms.uTime.value = time;
}
export function setShaderWetness(material, wetness) {
  if (material?.uniforms?.uWetness) material.uniforms.uWetness.value = wetness;
}
export function getShaderCapabilities(type) {
  const caps = {
    'Kajiya-Kay': { sss:false,wet:true,fur:false,aniso:true  },
    PBR:          { sss:true, wet:true,fur:false,aniso:false },
    'Fur Shell':  { sss:false,wet:false,fur:true,aniso:false },
    Marschner:    { sss:true, wet:true,fur:false,aniso:true  },
    ATC:          { sss:false,wet:false,fur:false,aniso:false },
  };
  return caps[type] ?? caps.ATC;
}

export const HAIR_SHADER_VARIANTS = ['Kajiya-Kay','PBR','Fur Shell','Marschner','ATC'];
export function createShaderFromPreset(presetName) {
  const presets = {
    'Dark Natural':   { type:'Kajiya-Kay', rootColor:'#1a1008', tipColor:'#2a1808', specPower:70  },
    'Brown Natural':  { type:'Kajiya-Kay', rootColor:'#4a2810', tipColor:'#8a5020', specPower:80  },
    'Blonde Shiny':   { type:'Kajiya-Kay', rootColor:'#c08040', tipColor:'#e8d080', specPower:110 },
    'Red Vibrant':    { type:'Kajiya-Kay', rootColor:'#6a1008', tipColor:'#cc2808', specPower:85  },
    'White Silver':   { type:'Kajiya-Kay', rootColor:'#c8c0b0', tipColor:'#f0e8e0', specPower:120 },
    'Short Fur':      { type:'Fur Shell',  color:'#8a6030',     furLength:0.025, furShells:16      },
    'Long Fur':       { type:'Fur Shell',  color:'#6a4020',     furLength:0.08,  furShells:28      },
    'Realistic PBR':  { type:'PBR',        color:'#4a2810',     roughness:0.75                     },
  };
  const p = presets[presetName] ?? presets['Brown Natural'];
  return getMaterialForType(p.type, p);
}
export function buildHairShaderLibrary() {
  return Object.fromEntries(
    Object.entries({
      kk_dark:   { type:'Kajiya-Kay', rootColor:'#1a1008', tipColor:'#2a1808' },
      kk_brown:  { type:'Kajiya-Kay', rootColor:'#4a2810', tipColor:'#8a5020' },
      kk_blonde: { type:'Kajiya-Kay', rootColor:'#c08040', tipColor:'#e8d080' },
      fur_short: { type:'Fur Shell',  color:'#8a6030', furLength:0.025, furShells:16 },
      fur_long:  { type:'Fur Shell',  color:'#6a4020', furLength:0.08,  furShells:28 },
      atc_fast:  { type:'ATC',        color:'#4a2810' },
    }).map(([k, opts]) => [k, getMaterialForType(opts.type, opts)])
  );
}
export function transitionShaderColors(material, from, to, progress) {
  if (!material?.uniforms) return;
  const lerp = (a,b,t) => {
    const ca=new THREE.Color(a), cb=new THREE.Color(b);
    return ca.lerp(cb,t);
  };
  if (material.uniforms.uRootColor) material.uniforms.uRootColor.value.copy(lerp(from.rootColor,to.rootColor,progress));
  if (material.uniforms.uTipColor)  material.uniforms.uTipColor.value.copy(lerp(from.tipColor, to.tipColor, progress));
}
export function getShaderUniforms(material) {
  if (!material?.uniforms) return {};
  return Object.fromEntries(
    Object.entries(material.uniforms).map(([k,u]) => [k, u.value?.isColor ? '#'+u.value.getHexString() : u.value])
  );
}
export function isHairShaderMaterial(material) {
  return material?.isShaderMaterial && (material.vertexShader === KK_VERT || material.vertexShader === FUR_VERT);
}

export function applyShaderPreset(material, presetName) {
  const presets={
    Glossy:{specPower:120,specShift:0.06,specShift2:-0.06},
    Matte: {specPower:20, specShift:0.01,specShift2:-0.01},
    Silky: {specPower:150,specShift:0.07,specShift2:-0.03},
    Coarse:{specPower:35, specShift:0.02,specShift2:-0.02},
  };
  const p=presets[presetName];
  if(!p||!material?.uniforms) return;
  if(material.uniforms.uSpecPower)  material.uniforms.uSpecPower.value=p.specPower;
  if(material.uniforms.uSpecShift)  material.uniforms.uSpecShift.value=p.specShift;
  if(material.uniforms.uSpecShift2) material.uniforms.uSpecShift2.value=p.specShift2;
}
export function buildShaderDebugMaterial(mode='normals') {
  const modes={
    normals:  'gl_FragColor=vec4(vNormal*0.5+0.5,1.0);',
    uv:       'gl_FragColor=vec4(vUv,0.0,1.0);',
    tangent:  'gl_FragColor=vec4(vTangent*0.5+0.5,1.0);',
    depth:    'float d=gl_FragCoord.z; gl_FragColor=vec4(d,d,d,1.0);',
  };
  return new THREE.ShaderMaterial({
    vertexShader: KK_VERT,
    fragmentShader: `varying vec3 vNormal,vTangent,vViewDir; varying vec2 vUv; void main(){${modes[mode]??modes.normals}}`,
    side: THREE.DoubleSide,
  });
}
export function getShaderLightingMode(material) {
  if (!material) return 'none';
  if (material.isShaderMaterial) return 'custom';
  if (material.isMeshStandardMaterial) return 'pbr';
  if (material.isMeshLambertMaterial)  return 'lambert';
  return 'basic';
}
export function hotswapShaderColors(material, rootColor, tipColor, transitionMs=500) {
  if (!material?.uniforms) return;
  const startTime = Date.now();
  const fromRoot  = material.uniforms.uRootColor?.value.clone();
  const fromTip   = material.uniforms.uTipColor?.value.clone();
  const targetRoot= new THREE.Color(rootColor);
  const targetTip = new THREE.Color(tipColor);
  return function tick() {
    const t = Math.min(1,(Date.now()-startTime)/transitionMs);
    if(material.uniforms.uRootColor) material.uniforms.uRootColor.value.copy(fromRoot.clone().lerp(targetRoot,t));
    if(material.uniforms.uTipColor)  material.uniforms.uTipColor.value.copy(fromTip.clone().lerp(targetTip,t));
    return t<1;
  };
}
