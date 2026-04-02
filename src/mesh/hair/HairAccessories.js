/**
 * HairAccessories.js — SPX Mesh Editor
 * Hair accessories: clip, band, bobby pin, ribbon, flower, scrunchie.
 * Each builds a THREE.Group with physics spring metadata.
 */
import * as THREE from 'three';

const lerp = (a, b, t) => a + (b - a) * t;

// ─── Base class ────────────────────────────────────────────────────────────────
class HairAccessory {
  constructor(opts = {}) {
    this.id       = opts.id       ?? 0;
    this.position = opts.position ?? new THREE.Vector3();
    this.rotation = opts.rotation ?? new THREE.Euler();
    this.color    = opts.color    ?? '#c0a080';
    this.color2   = opts.color2   ?? '#806040';
    this.scale    = opts.scale    ?? 1.0;
    this.group    = null;
    this.spring   = { stiffness: 0.8, damping: 0.85, mass: 0.02 };
  }
  build() { return new THREE.Group(); }
  _mat(hex, rough = 0.5, metal = 0.1) {
    return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: metal });
  }
  attach(parentMesh) {
    this.group = this.build();
    this.group.position.copy(this.position);
    this.group.rotation.copy(this.rotation);
    this.group.scale.setScalar(this.scale);
    parentMesh.add(this.group);
    return this;
  }
  dispose() {
    this.group?.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });
  }
  toJSON() {
    return { id: this.id, type: this.constructor.name,
      position: this.position.toArray(), color: this.color, scale: this.scale };
  }
}

// ─── HairClip ──────────────────────────────────────────────────────────────────
export class HairClip extends HairAccessory {
  constructor(opts = {}) { super(opts); this.length = opts.length ?? 0.08; }
  build() {
    const g = new THREE.Group();
    const mat  = this._mat(this.color, 0.3, 0.6);
    const mat2 = this._mat(this.color2, 0.6, 0.0);
    // Top arm
    const top = new THREE.Mesh(new THREE.BoxGeometry(this.length, 0.005, 0.012), mat);
    top.position.y = 0.004;
    // Bottom arm
    const bot = new THREE.Mesh(new THREE.BoxGeometry(this.length, 0.005, 0.012), mat);
    bot.position.y = -0.004;
    // Hinge
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.015, 8), mat2);
    hinge.position.x = this.length * 0.5;
    hinge.rotation.z = Math.PI / 2;
    // Spring detail
    const spring = new THREE.Mesh(new THREE.TorusGeometry(0.005, 0.001, 6, 12), mat2);
    spring.position.x = this.length * 0.5;
    g.add(top, bot, hinge, spring);
    this.group = g;
    return g;
  }
}

// ─── HairBand ─────────────────────────────────────────────────────────────────
export class HairBand extends HairAccessory {
  constructor(opts = {}) {
    super(opts);
    this.radius    = opts.radius    ?? 0.05;
    this.thickness = opts.thickness ?? 0.008;
    this.segments  = opts.segments  ?? 32;
    this.type      = opts.type      ?? 'elastic';  // elastic | scrunchie
  }
  build() {
    const g   = new THREE.Group();
    const mat = this._mat(this.color, this.type === 'scrunchie' ? 0.9 : 0.4);
    if (this.type === 'scrunchie') {
      // Gathered fabric look: multiple torus segments offset
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const torus = new THREE.Mesh(
          new THREE.TorusGeometry(this.radius, this.thickness * 1.4, 6, 8, Math.PI * 0.3),
          mat
        );
        torus.rotation.y = angle;
        torus.position.set(Math.cos(angle) * 0.002, 0, Math.sin(angle) * 0.002);
        g.add(torus);
      }
    } else {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(this.radius, this.thickness, 8, this.segments),
        mat
      );
      g.add(band);
    }
    this.group = g;
    return g;
  }
}

// ─── BobbyPin ─────────────────────────────────────────────────────────────────
export class BobbyPin extends HairAccessory {
  constructor(opts = {}) { super(opts); this.length = opts.length ?? 0.065; }
  build() {
    const g   = new THREE.Group();
    const mat = this._mat(this.color, 0.2, 0.8);
    const r   = 0.0015;
    // Two parallel wires
    const wire1Geo = new THREE.CylinderGeometry(r, r, this.length, 6);
    const wire1 = new THREE.Mesh(wire1Geo, mat);
    wire1.position.x = -0.004;
    // Crimped wire (slightly wavy)
    const pts = Array.from({ length: 8 }, (_, i) => {
      const t = i / 7;
      return new THREE.Vector3(0.004, (t - 0.5) * this.length, Math.sin(t * Math.PI * 4) * 0.001);
    });
    const wire2 = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, r, 6, false),
      mat
    );
    // Round tip
    const tip = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5, 6, 6), mat);
    tip.position.set(-0.004, this.length / 2, 0);
    // Join at bottom
    const join = new THREE.Mesh(new THREE.TorusGeometry(0.004, r, 6, 12, Math.PI), mat);
    join.position.y = -this.length / 2;
    g.add(wire1, wire2, tip, join);
    this.group = g;
    return g;
  }
}

// ─── HairRibbon ───────────────────────────────────────────────────────────────
export class HairRibbon extends HairAccessory {
  constructor(opts = {}) {
    super(opts);
    this.width  = opts.width  ?? 0.02;
    this.length = opts.length ?? 0.15;
  }
  build() {
    const g   = new THREE.Group();
    const mat = this._mat(this.color, 0.8, 0.0);
    // Main ribbon strip
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(this.length, this.width, 8, 2),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(this.color), roughness: 0.8, side: THREE.DoubleSide })
    );
    // Knot bow (two folded loops)
    [-1, 1].forEach(side => {
      const pts = [
        new THREE.Vector3(side * 0.005, 0, 0),
        new THREE.Vector3(side * 0.025, 0.012, 0.005),
        new THREE.Vector3(side * 0.03, 0, 0),
        new THREE.Vector3(side * 0.025, -0.012, 0.005),
        new THREE.Vector3(side * 0.005, 0, 0),
      ];
      const loop = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 12, 0.005, 6, true),
        this._mat(this.color, 0.8)
      );
      g.add(loop);
    });
    g.add(strip);
    this.group = g;
    return g;
  }
}

// ─── HairFlower ───────────────────────────────────────────────────────────────
export class HairFlower extends HairAccessory {
  constructor(opts = {}) {
    super(opts);
    this.petalCount = opts.petalCount ?? 6;
    this.radius     = opts.radius     ?? 0.025;
    this.centerColor = opts.centerColor ?? '#f0e020';
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
