/**
 * HairLayers.js — SPX Mesh Editor
 * Hair layer stack: base, mid, top, flyaway, vellus, highlight,
 * lowlight, streak, undercoat. Each layer has its own card set,
 * material, density, and blend weight.
 */
import * as THREE from 'three';\n\n// ─── Layer type definitions ───────────────────────────────────────────────────\nexport const LAYER_TYPES = {\n  BASE:       { name: 'Base',       blend: 'normal',   density: 1.0,  zOffset: 0.000 },\n  MID:        { name: 'Mid',        blend: 'normal',   density: 0.7,  zOffset: 0.002 },\n  TOP:        { name: 'Top',        blend: 'normal',   density: 0.5,  zOffset: 0.004 },\n  FLYAWAY:    { name: 'Flyaway',    blend: 'normal',   density: 0.15, zOffset: 0.008 },\n  VELLUS:     { name: 'Vellus',     blend: 'screen',   density: 0.2,  zOffset: 0.001 },\n  HIGHLIGHT:  { name: 'Highlight',  blend: 'screen',   density: 0.3,  zOffset: 0.005 },\n  LOWLIGHT:   { name: 'Lowlight',   blend: 'multiply', density: 0.3,  zOffset: 0.003 },\n  STREAK:     { name: 'Streak',     blend: 'normal',   density: 0.1,  zOffset: 0.006 },\n  UNDERCOAT:  { name: 'Undercoat',  blend: 'normal',   density: 0.4,  zOffset: -0.001 },\n};\n\n// ─── HairLayer ────────────────────────────────────────────────────────────────\nexport class HairLayer {\n  constructor(type = 'BASE', opts = {}) {\n    this.type        = type;\n    this.def         = LAYER_TYPES[type] ?? LAYER_TYPES.BASE;\n    this.name        = opts.name       ?? this.def.name;\n    this.enabled     = opts.enabled    ?? true;\n    this.density     = opts.density    ?? this.def.density;\n    this.opacity     = opts.opacity    ?? 1.0;\n    this.length      = opts.length     ?? 0.25;\n    this.lengthVar   = opts.lengthVar  ?? 0.15;\n    this.width       = opts.width      ?? 0.012;\n    this.widthVar    = opts.widthVar   ?? 0.3;\n    this.curl        = opts.curl       ?? 0.0;\n    this.curlVar     = opts.curlVar    ?? 0.1;\n    this.wave        = opts.wave       ?? 0.0;\n    this.color       = opts.color      ?? '#4a2810';\n    this.tipColor    = opts.tipColor   ?? '#8a5020';\n    this.stiffness   = opts.stiffness  ?? 0.7;\n    this.zOffset     = opts.zOffset    ?? this.def.zOffset;\n    this.blendMode   = opts.blendMode  ?? this.def.blend;\n    this.cards       = [];\n    this.group       = new THREE.Group();\n    this.group.name  = `HairLayer_${this.name}`;\n  }\n\n  setEnabled(v)  { this.enabled = v;    this.group.visible = v; return this; }\n  setOpacity(v)  { this.opacity = v;    this.group.traverse(o => { if (o.isMesh) o.material.opacity = v; }); return this; }\n  setDensity(v)  { this.density = v;    return this; }\n  setColor(c, t) { this.color = c; if (t) this.tipColor = t; return this; }\n\n  // Populate layer with cards from a HairCards instance\n  addCards(hairCards) {\n    this.cards = hairCards.cards ?? [];\n    this.cards.forEach(card => {\n      if (!card.geometry) return;\n      const mesh = new THREE.Mesh(card.geometry,\n        new THREE.MeshStandardMaterial({ color: new THREE.Color(this.color), transparent: true, opacity: this.opacity, alphaTest: 0.1, side: THREE.DoubleSide })\n      );\n      mesh.position.y = this.zOffset;\n      this.group.add(mesh);\n    });\n    return this;\n  }\n\n  getStats() {\n    return { type: this.type, name: this.name, cardCount: this.cards.length,\n      density: this.density, opacity: this.opacity, enabled: this.enabled };\n  }\n\n  dispose() {\n    this.group.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });\n    this.cards = [];\n  }\n\n  toJSON() {\n    return { type: this.type, name: this.name, enabled: this.enabled,\n      density: this.density, opacity: this.opacity, length: this.length,\n      width: this.width, curl: this.curl, wave: this.wave,\n      color: this.color, tipColor: this.tipColor, stiffness: this.stiffness,\n      zOffset: this.zOffset, blendMode: this.blendMode };\n  }\n}\n\n// ─── HairLayerStack ───────────────────────────────────────────────────────────\nexport class HairLayerStack {\n  constructor() {\n    this.layers = [];\n    this.group  = new THREE.Group();\n    this.group.name = 'HairLayerStack';\n  }\n\n  // Add a layer (order matters — first added = bottom)\n  addLayer(layer) {\n    this.layers.push(layer);\n    this.group.add(layer.group);\n    return this;\n  }\n\n  // Create and add a layer by type\n  createLayer(type, opts = {}) {\n    const layer = new HairLayer(type, opts);\n    this.addLayer(layer);\n    return layer;\n  }\n\n  getLayer(name)  { return this.layers.find(l => l.name === name || l.type === name); }\n  getLayers()     { return [...this.layers]; }\n  getEnabled()    { return this.layers.filter(l => l.enabled); }\n\n  // Move layer up/down in stack\n  moveUp(layer) {\n    const i = this.layers.indexOf(layer);\n    if (i > 0) {\n      [this.layers[i - 1], this.layers[i]] = [this.layers[i], this.layers[i - 1]];\n      this._rebuildGroup();\n    }\n    return this;\n  }\n  moveDown(layer) {\n    const i = this.layers.indexOf(layer);\n    if (i < this.layers.length - 1) {\n      [this.layers[i], this.layers[i + 1]] = [this.layers[i + 1], this.layers[i]];\n      this._rebuildGroup();\n    }\n    return this;\n  }\n  _rebuildGroup() {\n    while (this.group.children.length) this.group.remove(this.group.children[0]);\n    this.layers.forEach(l => this.group.add(l.group));\n  }\n\n  removeLayer(layer) {\n    const i = this.layers.indexOf(layer);\n    if (i >= 0) {\n      this.group.remove(layer.group);\n      layer.dispose();\n      this.layers.splice(i, 1);\n    }\n    return this;\n  }\n\n  // Build a default full stack\n  static buildDefault(opts = {}) {\n    const stack = new HairLayerStack();\n    const layers = [\n      ['UNDERCOAT', { color: opts.undercoatColor ?? '#1a0a04', density: 0.4 }],\n      ['BASE',      { color: opts.rootColor      ?? '#2a1008', density: 1.0 }],\n      ['MID',       { color: opts.midColor       ?? '#4a2810', density: 0.7 }],\n      ['TOP',       { color: opts.tipColor       ?? '#8a5020', density: 0.5 }],\n      ['FLYAWAY',   { color: opts.flyawayColor   ?? '#c08040', density: 0.15 }],\n    ];\n    if (opts.addHighlight) layers.push(['HIGHLIGHT', { color: opts.highlightColor ?? '#e0c080', density: 0.25 }]);\n    if (opts.addStreaks)   layers.push(['STREAK',    { color: opts.streakColor    ?? '#f0e0a0', density: 0.08 }]);
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
