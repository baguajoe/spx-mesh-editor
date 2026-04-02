/**
 * WetHairShader.js — SPX Mesh Editor
 * Wet hair shader with clumping, drip animation, Fresnel gloss,
 * environment reflection, and a WetHairController for animated updates.
 */
import * as THREE from 'three';\n\n// ─── GLSL ─────────────────────────────────────────────────────────────────────\nconst WET_VERT = /* glsl */ `\n  uniform float uWetness;\n  uniform float uClumpStr;\n  uniform float uTime;\n  varying vec3  vNormal;\n  varying vec3  vViewDir;\n  varying vec2  vUv;\n  varying float vWet;\n\n  void main() {\n    vUv     = uv;\n    vWet    = uWetness;\n    // Clumping: pull strands toward base along normal\n    float clump    = uClumpStr * uWetness * (1.0 - uv.y) * 0.8;\n    vec3  clumped  = position - normal * clump * 0.006;\n    vec4  mv       = modelViewMatrix * vec4(clumped, 1.0);\n    vNormal        = normalize(normalMatrix * normal);\n    vViewDir       = normalize(-mv.xyz);\n    gl_Position    = projectionMatrix * mv;\n  }\n`;\n\nconst WET_FRAG = /* glsl */ `\n  uniform vec3  uBaseColor;\n  uniform vec3  uWetColor;\n  uniform vec3  uEnvColor;\n  uniform float uWetness;\n  uniform float uGloss;\n  uniform float uTime;\n  uniform float uDripSpeed;\n  uniform float uFresnelPow;\n\n  varying vec3  vNormal;\n  varying vec3  vViewDir;\n  varying vec2  vUv;\n  varying float vWet;\n\n  float fresnel(vec3 N, vec3 V, float power) {\n    return pow(1.0 - max(0.0, dot(N, V)), power);\n  }\n\n  float drip(vec2 uv, float t, float speed) {\n    float y = fract(uv.y - t * speed);\n    float x = sin(uv.x * 12.0) * 0.04;\n    float drop = smoothstep(0.05, 0.0, abs(y - 0.5 + x));\n    drop *= smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);\n    return drop;\n  }\n\n  void main() {\n    // Base color darkens when wet\n    vec3  color   = mix(uBaseColor, uWetColor, uWetness * 0.6);\n    // Fresnel gloss\n    float fr      = fresnel(vNormal, vViewDir, uFresnelPow) * uGloss * uWetness;\n    // Drip animation\n    float dp      = drip(vUv, uTime, uDripSpeed) * uWetness * 0.5;\n    // Env reflection approximation\n    vec3  refl    = uEnvColor * (fr + dp);\n    // Combine\n    vec3  final   = color + refl;\n    float alpha   = 1.0 - vUv.y * 0.15 * (1.0 - uWetness * 0.3);\n    gl_FragColor  = vec4(final, alpha);\n  }\n`;\n\n// ─── Factory ──────────────────────────────────────────────────────────────────\nexport function createWetHairMaterial(opts = {}) {\n  return new THREE.ShaderMaterial({\n    vertexShader:   WET_VERT,\n    fragmentShader: WET_FRAG,\n    uniforms: {\n      uBaseColor:  { value: new THREE.Color(opts.baseColor  ?? '#1a1010') },\n      uWetColor:   { value: new THREE.Color(opts.wetColor   ?? '#0a0808') },\n      uEnvColor:   { value: new THREE.Color(opts.envColor   ?? '#8899bb') },\n      uWetness:    { value: opts.wetness    ?? 0.8 },\n      uGloss:      { value: opts.gloss      ?? 0.9 },\n      uClumpStr:   { value: opts.clumpStr   ?? 0.6 },\n      uDripSpeed:  { value: opts.dripSpeed  ?? 0.3 },\n      uFresnelPow: { value: opts.fresnelPow ?? 3.0 },\n      uTime:       { value: 0 },\n    },\n    transparent: true,\n    side: THREE.DoubleSide,\n    depthWrite: false,\n  });\n}\n\n// ─── WetHairController ────────────────────────────────────────────────────────\nexport class WetHairController {\n  constructor(opts = {}) {\n    this.materials    = [];\n    this.wetness      = opts.wetness     ?? 0.0;\n    this.dryRate      = opts.dryRate     ?? 0.05;  // per second\n    this.wetRate      = opts.wetRate     ?? 1.0;   // per second\n    this.envColor     = opts.envColor    ?? new THREE.Color('#8899bb');
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
