/**
 * HairSystem.js — SPX Mesh Editor
 * Master orchestrator: ties together HairCards, HairLayers, HairWindCollision,
 * HairLOD, HairGrooming, HairShader, and HairPhysics into a single API.
 */
import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t)   => a + (b - a) * t;

// ─── Event emitter mixin ──────────────────────────────────────────────────────
class EventEmitter {
  constructor() { this._listeners = {}; }
  on(e, fn)   { (this._listeners[e] = this._listeners[e] || []).push(fn); return this; }
  off(e, fn)  { this._listeners[e] = (this._listeners[e] || []).filter(f => f !== fn); }
  emit(e, ...args) { (this._listeners[e] || []).forEach(fn => fn(...args)); }
}

// ─── HairSystemConfig ─────────────────────────────────────────────────────────
export class HairSystemConfig {
  constructor(opts = {}) {
    this.cardCount    = opts.cardCount    ?? 300;
    this.segments     = opts.segments     ?? 8;
    this.cardWidth    = opts.cardWidth    ?? 0.012;
    this.cardLength   = opts.cardLength   ?? 0.25;
    this.rootColor    = opts.rootColor    ?? '#2a1808';
    this.tipColor     = opts.tipColor     ?? '#8a5020';
    this.density      = opts.density      ?? 0.75;
    this.stiffness    = opts.stiffness    ?? 0.70;
    this.damping      = opts.damping      ?? 0.85;
    this.windStr      = opts.windStr      ?? 0.40;
    this.gravity      = opts.gravity      ?? 0.50;
    this.shaderType   = opts.shaderType   ?? 'Kajiya-Kay';
    this.enableLOD    = opts.enableLOD    ?? true;
    this.enablePhysics= opts.enablePhysics?? true;
    this.seed         = opts.seed         ?? 42;
  }
  toJSON() { return { ...this }; }
  static fromJSON(data) { return new HairSystemConfig(data); }
  clone()  { return new HairSystemConfig({ ...this }); }
}

// ─── HairSystem ───────────────────────────────────────────────────────────────
export class HairSystem extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.config     = opts.config ?? new HairSystemConfig(opts);
    this.scene      = opts.scene  ?? null;
    this.scalp      = opts.scalp  ?? null;
    this.group      = new THREE.Group();
    this.group.name = 'HairSystem';
    this._cards     = [];
    this._layers    = [];
    this._material  = null;
    this._lod       = null;
    this._physics   = null;
    this._wind      = null;
    this._clock     = new THREE.Clock(false);
    this._built     = false;
    this._paused    = false;
    this._frameIdx  = 0;
    this._stats     = { fps: 0, cardCount: 0, polyCount: 0, physicsMs: 0 };
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  async build() {
    this._buildMaterial();
    this._buildCards();
    this._buildLayers();
    if (this.config.enableLOD)     this._buildLOD();
    if (this.config.enablePhysics) this._buildPhysics();
    this._buildWind();
    this.scene?.add(this.group);
    this._built = true;
    this._clock.start();
    this.emit('built', this);
    return this;
  }

  _buildMaterial() {
    this._material = new THREE.MeshStandardMaterial({
      color:       new THREE.Color(this.config.rootColor),
      roughness:   0.75,
      transparent: true,
      alphaTest:   0.1,
      side:        THREE.DoubleSide,
      depthWrite:  false,
    });
  }

  _buildCards() {
    const rng = this._mkRng(this.config.seed);
    const N   = Math.round(this.config.cardCount * this.config.density);
    this._cards = [];
    for (let i = 0; i < N; i++) {
      const theta = rng() * Math.PI * 2;
      const phi   = rng() * Math.PI * 0.4;
      const r     = 0.95 + rng() * 0.05;
      const rootPos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
      const card = {
        id:         i,
        rootPos,
        rootNormal: rootPos.clone().normalize(),
        length:     this.config.cardLength * (0.85 + rng() * 0.30),
        width:      this.config.cardWidth  * (0.80 + rng() * 0.40),
        stiffness:  this.config.stiffness  * (0.90 + rng() * 0.20),
        groupId:    Math.floor(i / Math.max(1, N / 8)),
        curve:      null,
        geometry:   null,
        mesh:       null,
      };
      card.curve = this._buildCardCurve(card, rng);
      card.geometry = this._buildCardGeometry(card);
      card.mesh = new THREE.Mesh(card.geometry, this._material);
      this.group.add(card.mesh);
      this._cards.push(card);
    }
    this._stats.cardCount = this._cards.length;
    this._stats.polyCount = this._cards.length * this.config.segments * 2;
  }

  _buildCardCurve(card, rng) {
    const pts = [];
    const normal = card.rootNormal.clone();
    const curl   = rng() * 0.02;
    const wave   = rng() * 0.008;
    const right  = new THREE.Vector3(1, 0, 0)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(normal.z, normal.x));
    for (let s = 0; s <= this.config.segments; s++) {
      const t = s / this.config.segments;
      const p = card.rootPos.clone().add(normal.clone().multiplyScalar(t * card.length));
      if (curl > 0) p.add(right.clone().multiplyScalar(Math.sin(t * Math.PI * 2) * curl * t));
      if (wave > 0) p.add(right.clone().multiplyScalar(Math.sin(t * Math.PI * 4) * wave));
      pts.push(p);
    }
    return pts;
  }

  _buildCardGeometry(card) {
    const pts     = card.curve;
    const N       = pts.length;
    const positions = [], normals = [], uvs = [], indices = [];
    const right = card.rootNormal.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const w = card.width * (1 - t * 0.5) * 0.5;
      const p = pts[i];
      positions.push(p.x - right.x*w, p.y - right.y*w, p.z - right.z*w);
      positions.push(p.x + right.x*w, p.y + right.y*w, p.z + right.z*w);
      normals.push(card.rootNormal.x, card.rootNormal.y, card.rootNormal.z);
      normals.push(card.rootNormal.x, card.rootNormal.y, card.rootNormal.z);
      uvs.push(0, t, 1, t);
      if (i < N - 1) {
        const b = i * 2;
        indices.push(b, b+1, b+2, b+1, b+3, b+2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
    geo.setIndex(indices);
    return geo;
  }

  _buildLayers() {
    const LAYER_TYPES = ['Base','Mid','Top','Flyaway'];
    this._layers = LAYER_TYPES.map(type => ({
      type,
      group:   new THREE.Group(),
      enabled: true,
      opacity: 1.0,
    }));
  }

  _buildLOD() {
    this._lod = {
      currentLevel: 0,
      distances:    [0, 3, 8, 20, 50],
      fractions:    [1.0, 0.6, 0.3, 0.1, 0],
      update: (camera, target) => {
        const dist = camera.position.distanceTo(target?.position ?? new THREE.Vector3());
        let level  = this._lod.distances.length - 1;
        for (let i = 0; i < this._lod.distances.length; i++) {
          if (dist < this._lod.distances[i+1] ?? Infinity) { level = i; break; }
        }
        if (level !== this._lod.currentLevel) {
          this._lod.currentLevel = level;
          this.emit('lodChange', level, dist);
        }
      },
    };
  }

  _buildPhysics() {
    this._physics = {
      particles:   new Map(),
      gravity:     new THREE.Vector3(0, -9.8 * this.config.gravity, 0),
      damping:     this.config.damping,
      iterations:  4,
      init: (card) => {
        const pts = card.curve.map((p, i) => ({
          pos: p.clone(), prev: p.clone(),
          mass: i === 0 ? Infinity : 0.1,
          pinned: i === 0,
        }));
        this._physics.particles.set(card.id, pts);
      },
      step: (card, dt, windForce) => {
        const pts = this._physics.particles.get(card.id);
        if (!pts) return;
        const g    = this._physics.gravity.clone().multiplyScalar(dt * dt);
        const wf   = windForce.clone().multiplyScalar(dt * dt * 0.1);
        for (let i = 1; i < pts.length; i++) {
          const p   = pts[i];
          const vel = p.pos.clone().sub(p.prev).multiplyScalar(this._physics.damping);
          p.prev.copy(p.pos);
          p.pos.add(vel).add(g).add(wf);
        }
        const restLen = card.length / (pts.length - 1);
        for (let iter = 0; iter < this._physics.iterations; iter++) {
          for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i+1];
            const diff = b.pos.clone().sub(a.pos);
            const dist = diff.length() || 0.0001;
            const corr = diff.multiplyScalar((dist - restLen) / dist * 0.5);
            if (!a.pinned) a.pos.add(corr);
            if (!b.pinned) b.pos.sub(corr);
          }
        }
        for (let i = 1; i < pts.length; i++) {
          pts[i].pos.lerp(card.curve[i], card.stiffness * 0.06);
        }
      },
    };
    this._cards.forEach(c => this._physics.init(c));
  }

  _buildWind() {
    this._wind = {
      direction: new THREE.Vector3(1, 0, 0),
      strength:  this.config.windStr,
      time:      0,
      sample: (dt) => {
        this._wind.time += dt;
        const t  = this._wind.time;
        const nx = Math.sin(t * 0.7) * this._wind.strength;
        const nz = Math.cos(t * 0.5) * this._wind.strength * 0.5;
        return new THREE.Vector3(nx, 0, nz);
      },
    };
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  update(camera) {
    if (!this._built || this._paused) return;
    this._frameIdx++;
    const dt = Math.min(this._clock.getDelta(), 0.05);
    const t0 = performance.now();

    if (this.config.enablePhysics && this._frameIdx % 2 === 0) {
      const wind = this._wind?.sample(dt) ?? new THREE.Vector3();
      this._cards.forEach(card => {
        this._physics?.step(card, dt, wind);
        this._applyPhysicsToGeometry(card);
      });
    }

    if (this.config.enableLOD && camera && this._frameIdx % 3 === 0) {
      this._lod?.update(camera, this.group);
    }

    this._stats.physicsMs = performance.now() - t0;
    this.emit('update', dt, this._stats);
  }

  _applyPhysicsToGeometry(card) {
    const pts = this._physics?.particles.get(card.id);
    if (!pts || !card.geometry) return;
    const pos   = card.geometry.attributes.position;
    const right = card.rootNormal.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i].pos;
      const t = i / (pts.length - 1);
      const w = card.width * (1 - t * 0.5) * 0.5;
      const b = i * 2;
      pos.setXYZ(b,   p.x - right.x*w, p.y - right.y*w, p.z - right.z*w);
      pos.setXYZ(b+1, p.x + right.x*w, p.y + right.y*w, p.z + right.z*w);
    }
    pos.needsUpdate = true;
  }

  // ── Controls ──────────────────────────────────────────────────────────────
  pause()   { this._paused = true;  this.emit('pause'); }
  resume()  { this._paused = false; this.emit('resume'); }
  setWind(direction, strength) {
    if (this._wind) { this._wind.direction.copy(direction); this._wind.strength = strength; }
  }
  setConfig(partial) {
    Object.assign(this.config, partial);
    if (partial.rootColor && this._material) this._material.color.set(partial.rootColor);
    this.emit('configChange', this.config);
  }

  // ── Stats & Info ──────────────────────────────────────────────────────────
  getStats() { return { ...this._stats, built: this._built, paused: this._paused }; }
  getCardCount()  { return this._cards.length; }
  getLODLevel()   { return this._lod?.currentLevel ?? 0; }

  // ── Utilities ─────────────────────────────────────────────────────────────
  _mkRng(seed) {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  // ── Dispose ───────────────────────────────────────────────────────────────
  dispose() {
    this._cards.forEach(c => { c.geometry?.dispose(); });
    this._material?.dispose();
    this._physics?.particles.clear();
    this.scene?.remove(this.group);
    this._built = false;
    this.emit('dispose');
  }

  toJSON() { return { config: this.config.toJSON(), cardCount: this._cards.length }; }
}

export default HairSystem;
