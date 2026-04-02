/**
 * HairLayers.js — SPX Mesh Editor
 * Hair layer stack: base, mid, top, flyaway, vellus, highlight,
 * lowlight, streak, undercoat. Each layer has its own card set,
 * material, density, and blend weight.
 */
import * as THREE from 'three';

// ─── Layer type definitions ───────────────────────────────────────────────────
export const LAYER_TYPES = {
  BASE:       { name: 'Base',       blend: 'normal',   density: 1.0,  zOffset: 0.000 },
  MID:        { name: 'Mid',        blend: 'normal',   density: 0.7,  zOffset: 0.002 },
  TOP:        { name: 'Top',        blend: 'normal',   density: 0.5,  zOffset: 0.004 },
  FLYAWAY:    { name: 'Flyaway',    blend: 'normal',   density: 0.15, zOffset: 0.008 },
  VELLUS:     { name: 'Vellus',     blend: 'screen',   density: 0.2,  zOffset: 0.001 },
  HIGHLIGHT:  { name: 'Highlight',  blend: 'screen',   density: 0.3,  zOffset: 0.005 },
  LOWLIGHT:   { name: 'Lowlight',   blend: 'multiply', density: 0.3,  zOffset: 0.003 },
  STREAK:     { name: 'Streak',     blend: 'normal',   density: 0.1,  zOffset: 0.006 },
  UNDERCOAT:  { name: 'Undercoat',  blend: 'normal',   density: 0.4,  zOffset: -0.001 },
};

// ─── HairLayer ────────────────────────────────────────────────────────────────
export class HairLayer {
  constructor(type = 'BASE', opts = {}) {
    this.type        = type;
    this.def         = LAYER_TYPES[type] ?? LAYER_TYPES.BASE;
    this.name        = opts.name       ?? this.def.name;
    this.enabled     = opts.enabled    ?? true;
    this.density     = opts.density    ?? this.def.density;
    this.opacity     = opts.opacity    ?? 1.0;
    this.length      = opts.length     ?? 0.25;
    this.lengthVar   = opts.lengthVar  ?? 0.15;
    this.width       = opts.width      ?? 0.012;
    this.widthVar    = opts.widthVar   ?? 0.3;
    this.curl        = opts.curl       ?? 0.0;
    this.curlVar     = opts.curlVar    ?? 0.1;
    this.wave        = opts.wave       ?? 0.0;
    this.color       = opts.color      ?? '#4a2810';
    this.tipColor    = opts.tipColor   ?? '#8a5020';
    this.stiffness   = opts.stiffness  ?? 0.7;
    this.zOffset     = opts.zOffset    ?? this.def.zOffset;
    this.blendMode   = opts.blendMode  ?? this.def.blend;
    this.cards       = [];
    this.group       = new THREE.Group();
    this.group.name  = `HairLayer_${this.name}`;
  }

  setEnabled(v)  { this.enabled = v;    this.group.visible = v; return this; }
  setOpacity(v)  { this.opacity = v;    this.group.traverse(o => { if (o.isMesh) o.material.opacity = v; }); return this; }
  setDensity(v)  { this.density = v;    return this; }
  setColor(c, t) { this.color = c; if (t) this.tipColor = t; return this; }

  // Populate layer with cards from a HairCards instance
  addCards(hairCards) {
    this.cards = hairCards.cards ?? [];
    this.cards.forEach(card => {
      if (!card.geometry) return;
      const mesh = new THREE.Mesh(card.geometry,
        new THREE.MeshStandardMaterial({ color: new THREE.Color(this.color), transparent: true, opacity: this.opacity, alphaTest: 0.1, side: THREE.DoubleSide })
      );
      mesh.position.y = this.zOffset;
      this.group.add(mesh);
    });
    return this;
  }

  getStats() {
    return { type: this.type, name: this.name, cardCount: this.cards.length,
      density: this.density, opacity: this.opacity, enabled: this.enabled };
  }

  dispose() {
    this.group.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });
    this.cards = [];
  }

  toJSON() {
    return { type: this.type, name: this.name, enabled: this.enabled,
      density: this.density, opacity: this.opacity, length: this.length,
      width: this.width, curl: this.curl, wave: this.wave,
      color: this.color, tipColor: this.tipColor, stiffness: this.stiffness,
      zOffset: this.zOffset, blendMode: this.blendMode };
  }
}

// ─── HairLayerStack ───────────────────────────────────────────────────────────
export class HairLayerStack {
  constructor() {
    this.layers = [];
    this.group  = new THREE.Group();
    this.group.name = 'HairLayerStack';
  }

  // Add a layer (order matters — first added = bottom)
  addLayer(layer) {
    this.layers.push(layer);
    this.group.add(layer.group);
    return this;
  }

  // Create and add a layer by type
  createLayer(type, opts = {}) {
    const layer = new HairLayer(type, opts);
    this.addLayer(layer);
    return layer;
  }

  getLayer(name)  { return this.layers.find(l => l.name === name || l.type === name); }
  getLayers()     { return [...this.layers]; }
  getEnabled()    { return this.layers.filter(l => l.enabled); }

  // Move layer up/down in stack
  moveUp(layer) {
    const i = this.layers.indexOf(layer);
    if (i > 0) {
      [this.layers[i - 1], this.layers[i]] = [this.layers[i], this.layers[i - 1]];
      this._rebuildGroup();
    }
    return this;
  }
  moveDown(layer) {
    const i = this.layers.indexOf(layer);
    if (i < this.layers.length - 1) {
      [this.layers[i], this.layers[i + 1]] = [this.layers[i + 1], this.layers[i]];
      this._rebuildGroup();
    }
    return this;
  }
  _rebuildGroup() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this.layers.forEach(l => this.group.add(l.group));
  }

  removeLayer(layer) {
    const i = this.layers.indexOf(layer);
    if (i >= 0) {
      this.group.remove(layer.group);
      layer.dispose();
      this.layers.splice(i, 1);
    }
    return this;
  }

  // Build a default full stack
  static buildDefault(opts = {}) {
    const stack = new HairLayerStack();
    const layers = [
      ['UNDERCOAT', { color: opts.undercoatColor ?? '#1a0a04', density: 0.4 }],
      ['BASE',      { color: opts.rootColor      ?? '#2a1008', density: 1.0 }],
      ['MID',       { color: opts.midColor       ?? '#4a2810', density: 0.7 }],
      ['TOP',       { color: opts.tipColor       ?? '#8a5020', density: 0.5 }],
      ['FLYAWAY',   { color: opts.flyawayColor   ?? '#c08040', density: 0.15 }],
    ];
    if (opts.addHighlight) layers.push(['HIGHLIGHT', { color: opts.highlightColor ?? '#e0c080', density: 0.25 }]);
    if (opts.addStreaks)   layers.push(['STREAK',    { color: opts.streakColor    ?? '#f0e0a0', density: 0.08 }]);
    layers.forEach(([type, layerOpts]) => stack.createLayer(type, layerOpts));
    return stack;
  }

  getTotalCards() { return this.layers.reduce((n, l) => n + l.cards.length, 0); }
  getStats()      { return this.layers.map(l => l.getStats()); }

  dispose() { this.layers.forEach(l => l.dispose()); this.layers = []; }
  toJSON()  { return { layers: this.layers.map(l => l.toJSON()) }; }
}

export default HairLayerStack;
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
