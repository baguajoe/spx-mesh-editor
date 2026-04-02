/**
 * HairAccessories.js — SPX Mesh Editor
 * Hair accessories: clip, band, bobby pin, ribbon, flower, scrunchie.
 * Each builds a THREE.Group with physics spring metadata.
 */
import * as THREE from 'three';\n\nconst lerp = (a, b, t) => a + (b - a) * t;\n\n// ─── Base class ────────────────────────────────────────────────────────────────\nclass HairAccessory {\n  constructor(opts = {}) {\n    this.id       = opts.id       ?? 0;\n    this.position = opts.position ?? new THREE.Vector3();\n    this.rotation = opts.rotation ?? new THREE.Euler();\n    this.color    = opts.color    ?? '#c0a080';\n    this.color2   = opts.color2   ?? '#806040';\n    this.scale    = opts.scale    ?? 1.0;\n    this.group    = null;\n    this.spring   = { stiffness: 0.8, damping: 0.85, mass: 0.02 };\n  }\n  build() { return new THREE.Group(); }\n  _mat(hex, rough = 0.5, metal = 0.1) {\n    return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: metal });\n  }\n  attach(parentMesh) {\n    this.group = this.build();\n    this.group.position.copy(this.position);\n    this.group.rotation.copy(this.rotation);\n    this.group.scale.setScalar(this.scale);\n    parentMesh.add(this.group);\n    return this;\n  }\n  dispose() {\n    this.group?.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });\n  }\n  toJSON() {\n    return { id: this.id, type: this.constructor.name,\n      position: this.position.toArray(), color: this.color, scale: this.scale };\n  }\n}\n\n// ─── HairClip ──────────────────────────────────────────────────────────────────\nexport class HairClip extends HairAccessory {\n  constructor(opts = {}) { super(opts); this.length = opts.length ?? 0.08; }\n  build() {\n    const g = new THREE.Group();\n    const mat  = this._mat(this.color, 0.3, 0.6);\n    const mat2 = this._mat(this.color2, 0.6, 0.0);\n    // Top arm\n    const top = new THREE.Mesh(new THREE.BoxGeometry(this.length, 0.005, 0.012), mat);\n    top.position.y = 0.004;\n    // Bottom arm\n    const bot = new THREE.Mesh(new THREE.BoxGeometry(this.length, 0.005, 0.012), mat);\n    bot.position.y = -0.004;\n    // Hinge\n    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.015, 8), mat2);\n    hinge.position.x = this.length * 0.5;\n    hinge.rotation.z = Math.PI / 2;\n    // Spring detail\n    const spring = new THREE.Mesh(new THREE.TorusGeometry(0.005, 0.001, 6, 12), mat2);\n    spring.position.x = this.length * 0.5;\n    g.add(top, bot, hinge, spring);\n    this.group = g;\n    return g;\n  }\n}\n\n// ─── HairBand ─────────────────────────────────────────────────────────────────\nexport class HairBand extends HairAccessory {\n  constructor(opts = {}) {\n    super(opts);\n    this.radius    = opts.radius    ?? 0.05;\n    this.thickness = opts.thickness ?? 0.008;\n    this.segments  = opts.segments  ?? 32;\n    this.type      = opts.type      ?? 'elastic';  // elastic | scrunchie\n  }\n  build() {\n    const g   = new THREE.Group();\n    const mat = this._mat(this.color, this.type === 'scrunchie' ? 0.9 : 0.4);\n    if (this.type === 'scrunchie') {\n      // Gathered fabric look: multiple torus segments offset\n      for (let i = 0; i < 8; i++) {\n        const angle = (i / 8) * Math.PI * 2;\n        const torus = new THREE.Mesh(\n          new THREE.TorusGeometry(this.radius, this.thickness * 1.4, 6, 8, Math.PI * 0.3),\n          mat\n        );\n        torus.rotation.y = angle;\n        torus.position.set(Math.cos(angle) * 0.002, 0, Math.sin(angle) * 0.002);\n        g.add(torus);\n      }\n    } else {\n      const band = new THREE.Mesh(\n        new THREE.TorusGeometry(this.radius, this.thickness, 8, this.segments),\n        mat\n      );\n      g.add(band);\n    }\n    this.group = g;\n    return g;\n  }\n}\n\n// ─── BobbyPin ─────────────────────────────────────────────────────────────────\nexport class BobbyPin extends HairAccessory {\n  constructor(opts = {}) { super(opts); this.length = opts.length ?? 0.065; }\n  build() {\n    const g   = new THREE.Group();\n    const mat = this._mat(this.color, 0.2, 0.8);\n    const r   = 0.0015;\n    // Two parallel wires\n    const wire1Geo = new THREE.CylinderGeometry(r, r, this.length, 6);\n    const wire1 = new THREE.Mesh(wire1Geo, mat);\n    wire1.position.x = -0.004;\n    // Crimped wire (slightly wavy)\n    const pts = Array.from({ length: 8 }, (_, i) => {\n      const t = i / 7;\n      return new THREE.Vector3(0.004, (t - 0.5) * this.length, Math.sin(t * Math.PI * 4) * 0.001);\n    });\n    const wire2 = new THREE.Mesh(\n      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, r, 6, false),\n      mat\n    );\n    // Round tip\n    const tip = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5, 6, 6), mat);\n    tip.position.set(-0.004, this.length / 2, 0);\n    // Join at bottom\n    const join = new THREE.Mesh(new THREE.TorusGeometry(0.004, r, 6, 12, Math.PI), mat);\n    join.position.y = -this.length / 2;\n    g.add(wire1, wire2, tip, join);\n    this.group = g;\n    return g;\n  }\n}\n\n// ─── HairRibbon ───────────────────────────────────────────────────────────────\nexport class HairRibbon extends HairAccessory {\n  constructor(opts = {}) {\n    super(opts);\n    this.width  = opts.width  ?? 0.02;\n    this.length = opts.length ?? 0.15;\n  }\n  build() {\n    const g   = new THREE.Group();\n    const mat = this._mat(this.color, 0.8, 0.0);\n    // Main ribbon strip\n    const strip = new THREE.Mesh(\n      new THREE.PlaneGeometry(this.length, this.width, 8, 2),\n      new THREE.MeshStandardMaterial({ color: new THREE.Color(this.color), roughness: 0.8, side: THREE.DoubleSide })\n    );\n    // Knot bow (two folded loops)\n    [-1, 1].forEach(side => {\n      const pts = [\n        new THREE.Vector3(side * 0.005, 0, 0),\n        new THREE.Vector3(side * 0.025, 0.012, 0.005),\n        new THREE.Vector3(side * 0.03, 0, 0),\n        new THREE.Vector3(side * 0.025, -0.012, 0.005),\n        new THREE.Vector3(side * 0.005, 0, 0),\n      ];\n      const loop = new THREE.Mesh(\n        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 12, 0.005, 6, true),\n        this._mat(this.color, 0.8)\n      );\n      g.add(loop);\n    });\n    g.add(strip);\n    this.group = g;\n    return g;\n  }\n}\n\n// ─── HairFlower ───────────────────────────────────────────────────────────────\nexport class HairFlower extends HairAccessory {\n  constructor(opts = {}) {\n    super(opts);\n    this.petalCount = opts.petalCount ?? 6;\n    this.radius     = opts.radius     ?? 0.025;\n    this.centerColor = opts.centerColor ?? '#f0e020';
  }
  build() {
    const g       = new THREE.Group();
    const petalMat = this._mat(this.color, 0.8);
    const centerMat = this._mat(this.centerColor, 0.6);
    for (let i = 0; i < this.petalCount; i++) {
      const angle = (i / this.petalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(this.radius * 0.5, 8, 6),
        petalMat
      );
      petal.scale.set(0.5, 1, 0.3);
      petal.position.set(Math.cos(angle) * this.radius * 0.6, Math.sin(angle) * this.radius * 0.6, 0);
      g.add(petal);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(this.radius * 0.25, 10, 8), centerMat);
    g.add(center);
    this.group = g;
    return g;
  }
}

// ─── HairAccessoryManager ─────────────────────────────────────────────────────
export class HairAccessoryManager {
  constructor() {
    this.accessories = [];
    this._clock      = new THREE.Clock(false);
  }

  add(accessory, parent) {
    accessory.attach(parent);
    this.accessories.push(accessory);
    return this;
  }

  remove(id) {
    const idx = this.accessories.findIndex(a => a.id === id);
    if (idx >= 0) {
      this.accessories[idx].dispose();
      this.accessories.splice(idx, 1);
    }
    return this;
  }

  // Spring physics jiggle update
  update(dt) {
    const t = this._clock.running
      ? this._clock.getDelta()
      : (dt ?? 0.016);
    for (const acc of this.accessories) {
      if (!acc.group) continue;
      const amp = 0.002 * (1 - acc.spring.stiffness);
      const freq = 8;
      const jiggle = Math.sin(Date.now() * 0.001 * freq) * amp;
      acc.group.rotation.z += (jiggle - acc.group.rotation.z) * acc.spring.damping;
    }
  }

  dispose() {
    this.accessories.forEach(a => a.dispose());
    this.accessories = [];
  }

  toJSON() { return this.accessories.map(a => a.toJSON()); }
}

export default HairAccessoryManager;
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
