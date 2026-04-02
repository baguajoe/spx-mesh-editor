/**
 * HairLOD.js — SPX Mesh Editor
 * Level-of-detail manager for hair: 4 LOD levels reducing card count,
 * segment count, and switching to proxy mesh at far distances.
 */
import * as THREE from 'three';

// ─── LOD Level definitions ────────────────────────────────────────────────────
export const LOD_LEVELS = [
  { name: 'LOD0', distance: 0,   cardFrac: 1.0,  segments: 8,  label: 'Full' },
  { name: 'LOD1', distance: 3,   cardFrac: 0.6,  segments: 5,  label: 'High' },
  { name: 'LOD2', distance: 8,   cardFrac: 0.3,  segments: 3,  label: 'Mid'  },
  { name: 'LOD3', distance: 20,  cardFrac: 0.1,  segments: 2,  label: 'Low'  },
  { name: 'LOD4', distance: 50,  cardFrac: 0.0,  segments: 1,  label: 'Proxy'},
];

// ─── HairLODLevel ─────────────────────────────────────────────────────────────
export class HairLODLevel {
  constructor(def, cards, material) {
    this.def      = def;
    this.group    = new THREE.Group();
    this.group.name = def.name;
    this.cardCount = 0;
    if (def.cardFrac > 0 && cards.length > 0) {
      const count = Math.max(1, Math.round(cards.length * def.cardFrac));
      const step  = Math.floor(cards.length / count);
      for (let i = 0; i < cards.length; i += step) {
        const card = cards[i];
        if (!card.geometry) continue;
        this.group.add(new THREE.Mesh(card.geometry, material));
        this.cardCount++;
      }
    }
  }

  buildProxyMesh(scalp, material) {
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.9, transparent: true, opacity: 0.7 })
    );
    proxy.name = 'HairProxy';
    this.group.add(proxy);
    return this;
  }

  setVisible(v) { this.group.visible = v; }
}

// ─── HairLODManager ───────────────────────────────────────────────────────────
export class HairLODManager {
  constructor(opts = {}) {
    this.levels        = [];
    this.currentLevel  = 0;
    this.enabled       = opts.enabled      ?? true;
    this.distances     = opts.distances    ?? LOD_LEVELS.map(l => l.distance);
    this.hysteresis    = opts.hysteresis   ?? 0.5;  // prevents flickering at boundaries
    this.throttle      = opts.throttle     ?? 3;    // update every N frames
    this._frame        = 0;
    this._lastDist     = 0;
    this.group         = new THREE.Group();
    this.group.name    = 'HairLOD';
    this._onLevelChange = null;
  }

  // Build all LOD levels from a HairCards set + material
  build(hairCards, material) {
    this.levels = [];
    const cards = hairCards.cards;
    for (let i = 0; i < LOD_LEVELS.length; i++) {
      const def   = { ...LOD_LEVELS[i], distance: this.distances[i] ?? LOD_LEVELS[i].distance };
      const level = new HairLODLevel(def, cards, material);
      if (def.cardFrac === 0) level.buildProxyMesh(null, material);
      level.setVisible(i === 0);
      this.group.add(level.group);
      this.levels.push(level);
    }
    return this;
  }

  // Update visible level based on camera distance
  update(camera, targetObject) {
    if (!this.enabled || !this.levels.length) return;
    this._frame++;
    if (this._frame % this.throttle !== 0) return;

    const dist = camera.position.distanceTo(
      targetObject?.position ?? new THREE.Vector3()
    );
    this._lastDist = dist;

    // Find appropriate level
    let newLevel = this.levels.length - 1;
    for (let i = 0; i < this.distances.length; i++) {
      const threshold = this.distances[i] + (this.currentLevel > i ? -this.hysteresis : this.hysteresis);
      if (dist < threshold) { newLevel = i; break; }
    }

    if (newLevel !== this.currentLevel) {
      this.levels[this.currentLevel]?.setVisible(false);
      this.levels[newLevel]?.setVisible(true);
      const prev = this.currentLevel;
      this.currentLevel = newLevel;
      this._onLevelChange?.(newLevel, prev, dist);
    }
  }

  onLevelChange(fn) { this._onLevelChange = fn; return this; }
  getCurrentLevel() { return this.levels[this.currentLevel]?.def ?? null; }
  getCurrentCardCount() { return this.levels[this.currentLevel]?.cardCount ?? 0; }
  getLastDistance()     { return this._lastDist; }

  setEnabled(v)     { this.enabled = v; }
  setDistances(arr) { this.distances = arr; }

  dispose() {
    this.levels.forEach(l => {
      l.group.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });
    });
    this.levels = [];
  }

  toJSON() {
    return { enabled: this.enabled, distances: this.distances,
      currentLevel: this.currentLevel, hysteresis: this.hysteresis };
  }
}

export default HairLODManager;
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
