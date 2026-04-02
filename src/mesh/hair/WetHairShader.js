/**
 * WetHairShader.js — SPX Mesh Editor
 * Wet hair shader with clumping, drip animation, Fresnel gloss,
 * environment reflection, and a WetHairController for animated updates.
 */
import * as THREE from 'three';

// ─── GLSL ─────────────────────────────────────────────────────────────────────
const WET_VERT = /* glsl */ `
  uniform float uWetness;
  uniform float uClumpStr;
  uniform float uTime;
  varying vec3  vNormal;
  varying vec3  vViewDir;
  varying vec2  vUv;
  varying float vWet;

  void main() {
    vUv     = uv;
    vWet    = uWetness;
    // Clumping: pull strands toward base along normal
    float clump    = uClumpStr * uWetness * (1.0 - uv.y) * 0.8;
    vec3  clumped  = position - normal * clump * 0.006;
    vec4  mv       = modelViewMatrix * vec4(clumped, 1.0);
    vNormal        = normalize(normalMatrix * normal);
    vViewDir       = normalize(-mv.xyz);
    gl_Position    = projectionMatrix * mv;
  }
`;

const WET_FRAG = /* glsl */ `
  uniform vec3  uBaseColor;
  uniform vec3  uWetColor;
  uniform vec3  uEnvColor;
  uniform float uWetness;
  uniform float uGloss;
  uniform float uTime;
  uniform float uDripSpeed;
  uniform float uFresnelPow;

  varying vec3  vNormal;
  varying vec3  vViewDir;
  varying vec2  vUv;
  varying float vWet;

  float fresnel(vec3 N, vec3 V, float power) {
    return pow(1.0 - max(0.0, dot(N, V)), power);
  }

  float drip(vec2 uv, float t, float speed) {
    float y = fract(uv.y - t * speed);
    float x = sin(uv.x * 12.0) * 0.04;
    float drop = smoothstep(0.05, 0.0, abs(y - 0.5 + x));
    drop *= smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
    return drop;
  }

  void main() {
    // Base color darkens when wet
    vec3  color   = mix(uBaseColor, uWetColor, uWetness * 0.6);
    // Fresnel gloss
    float fr      = fresnel(vNormal, vViewDir, uFresnelPow) * uGloss * uWetness;
    // Drip animation
    float dp      = drip(vUv, uTime, uDripSpeed) * uWetness * 0.5;
    // Env reflection approximation
    vec3  refl    = uEnvColor * (fr + dp);
    // Combine
    vec3  final   = color + refl;
    float alpha   = 1.0 - vUv.y * 0.15 * (1.0 - uWetness * 0.3);
    gl_FragColor  = vec4(final, alpha);
  }
`;

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createWetHairMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader:   WET_VERT,
    fragmentShader: WET_FRAG,
    uniforms: {
      uBaseColor:  { value: new THREE.Color(opts.baseColor  ?? '#1a1010') },
      uWetColor:   { value: new THREE.Color(opts.wetColor   ?? '#0a0808') },
      uEnvColor:   { value: new THREE.Color(opts.envColor   ?? '#8899bb') },
      uWetness:    { value: opts.wetness    ?? 0.8 },
      uGloss:      { value: opts.gloss      ?? 0.9 },
      uClumpStr:   { value: opts.clumpStr   ?? 0.6 },
      uDripSpeed:  { value: opts.dripSpeed  ?? 0.3 },
      uFresnelPow: { value: opts.fresnelPow ?? 3.0 },
      uTime:       { value: 0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

// ─── WetHairController ────────────────────────────────────────────────────────
export class WetHairController {
  constructor(opts = {}) {
    this.materials    = [];
    this.wetness      = opts.wetness     ?? 0.0;
    this.dryRate      = opts.dryRate     ?? 0.05;  // per second
    this.wetRate      = opts.wetRate     ?? 1.0;   // per second
    this.envColor     = opts.envColor    ?? new THREE.Color('#8899bb');
    this._drying      = false;
    this._wetting     = false;
    this._clock       = new THREE.Clock(false);
  }

  // Register a material for control
  addMaterial(mat) {
    this.materials.push(mat);
    this._sync(mat);
    return this;
  }

  removeMaterial(mat) {
    this.materials = this.materials.filter(m => m !== mat);
  }

  // Instantly wet all materials
  soak(level = 1.0) {
    this.wetness  = Math.min(1, level);
    this._wetting = false;
    this._drying  = false;
    this._syncAll();
    return this;
  }

  // Trigger gradual wetting
  startWetting() {
    this._wetting = true;
    this._drying  = false;
    if (!this._clock.running) this._clock.start();
    return this;
  }

  // Trigger gradual drying
  startDrying() {
    this._drying  = true;
    this._wetting = false;
    if (!this._clock.running) this._clock.start();
    return this;
  }

  setEnvColor(color) {
    this.envColor = new THREE.Color(color);
    this.materials.forEach(m => {
      if (m.uniforms?.uEnvColor) m.uniforms.uEnvColor.value.copy(this.envColor);
    });
    return this;
  }

  update() {
    const dt = this._clock.running ? this._clock.getDelta() : 0.016;
    const t  = (this.materials[0]?.uniforms?.uTime?.value ?? 0) + dt;

    if (this._wetting) {
      this.wetness = Math.min(1, this.wetness + dt * this.wetRate);
      if (this.wetness >= 1) this._wetting = false;
    }
    if (this._drying) {
      this.wetness = Math.max(0, this.wetness - dt * this.dryRate);
      if (this.wetness <= 0) this._drying = false;
    }

    this.materials.forEach(m => {
      if (!m.uniforms) return;
      if (m.uniforms.uTime)    m.uniforms.uTime.value    = t;
      if (m.uniforms.uWetness) m.uniforms.uWetness.value = this.wetness;
    });
  }

  _sync(mat) {
    if (!mat.uniforms) return;
    if (mat.uniforms.uWetness)  mat.uniforms.uWetness.value  = this.wetness;
    if (mat.uniforms.uEnvColor) mat.uniforms.uEnvColor.value.copy(this.envColor);
  }
  _syncAll() { this.materials.forEach(m => this._sync(m)); }

  getWetness()  { return this.wetness; }
  isDrying()    { return this._drying; }
  isWetting()   { return this._wetting; }

  toJSON() {
    return { wetness: this.wetness, dryRate: this.dryRate, wetRate: this.wetRate };
  }
}

export default WetHairController;
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
