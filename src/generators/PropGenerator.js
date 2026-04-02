/**
 * PropGenerator.js — SPX Mesh Editor
 * Procedural prop builder: furniture, containers, weapons, tools, architecture pieces.
 */
import * as THREE from 'three';\n\nconst clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));\nconst lerp  = (a, b, t)   => a + (b - a) * t;\nconst rand  = (lo, hi)    => lo + Math.random() * (hi - lo);\nconst TWO_PI = Math.PI * 2;\n\n\nexport class PropGenerator {\n  constructor(opts = {}) {\n    this.opts = opts;\n    this.seed = opts.seed ?? 1;\n    this._rng = this._mkRng(this.seed);\n  }\n  _mkRng(s) { let n = s; return () => { n = (n * 9301 + 49297) % 233280; return n / 233280; }; }\n  _rn(lo, hi) { return lo + this._rng() * (hi - lo); }\n  _mat(hex, rough = 0.6, metal = 0) {\n    return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex ?? '#8a6030'), roughness: rough, metalness: metal });\n  }\n\n  buildChair(p) {\n    const g = new THREE.Group();\n    const mat = this._mat(p.primaryColor ?? '#8a6030', 0.7);\n    const W = 0.48, H = 0.44, D = 0.48;\n    const seat = new THREE.Mesh(new THREE.BoxGeometry(W, 0.04, D), mat);\n    seat.position.y = H;\n    const back = new THREE.Mesh(new THREE.BoxGeometry(W, 0.48, 0.04), mat);\n    back.position.set(0, H + 0.26, -D / 2 + 0.02);\n    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, H, 6);\n    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([lx, lz]) => {\n      const leg = new THREE.Mesh(legGeo, mat);\n      leg.position.set(lx * (W/2-0.04), H/2, lz * (D/2-0.04));\n      g.add(leg);\n    });\n    g.add(seat, back);\n    return g;\n  }\n\n  buildTable(p) {\n    const g   = new THREE.Group();\n    const mat = this._mat(p.primaryColor ?? '#6a4020', 0.65);\n    const W = 1.0 + this._rn(-0.2, 0.4), H = 0.75, D = 0.6;\n    const top = new THREE.Mesh(new THREE.BoxGeometry(W, 0.05, D), mat);\n    top.position.y = H;\n    const legGeo = new THREE.BoxGeometry(0.05, H, 0.05);\n    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([lx, lz]) => {\n      const leg = new THREE.Mesh(legGeo, mat);\n      leg.position.set(lx * (W/2-0.06), H/2, lz * (D/2-0.06));\n      g.add(leg);\n    });\n    g.add(top);\n    return g;\n  }\n\n  buildBarrel(p) {\n    const mat  = this._mat(p.primaryColor ?? '#6a3010', 0.8);\n    const hoop = this._mat('#888888', 0.3, 0.8);\n    const g    = new THREE.Group();\n    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.75, 16), mat));\n    [-0.28, 0, 0.28].forEach(y => {\n      const r = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.014, 6, 24), hoop);\n      r.position.y = y; r.rotation.x = Math.PI / 2; g.add(r);\n    });\n    return g;\n  }\n\n  buildCrate(p) {\n    const mat   = this._mat(p.primaryColor ?? '#8a6020', 0.85);\n    const plank = this._mat('#5a3a10', 0.9);\n    const g     = new THREE.Group();\n    const S     = 0.55 + this._rn(-0.1, 0.2);\n    g.add(new THREE.Mesh(new THREE.BoxGeometry(S, S, S), mat));\n    for (let i = 0; i < 3; i++) {\n      const strip = new THREE.Mesh(new THREE.BoxGeometry(S + 0.01, 0.04, S + 0.01), plank);\n      strip.position.y = -S/2 + i * (S/2);\n      g.add(strip);\n    }\n    return g;\n  }\n\n  buildSword(p) {\n    const g     = new THREE.Group();\n    const blade = this._mat('#c8c8d0', 0.15, 0.9);\n    const grip  = this._mat(p.primaryColor ?? '#4a2a10', 0.8);\n    const accent = this._mat(p.secondColor ?? '#c8a830', 0.3, 0.8);\n    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.048, 1.05, 0.007), blade), { position: new THREE.Vector3(0, 0.2, 0) }));\n    // Fuller\n    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.85, 0.002), new THREE.MeshStandardMaterial({ color: 0xb8b8c8 })), { position: new THREE.Vector3(0, 0.2, 0.005) }));\n    // Crossguard\n    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.04), accent), { position: new THREE.Vector3(0, -0.42, 0) }));\n    // Grip\n    g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.28, 8), grip), { position: new THREE.Vector3(0, -0.62, 0) }));\n    // Pommel\n    g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), accent), { position: new THREE.Vector3(0, -0.78, 0) }));\n    return g;\n  }\n\n  buildLamp(p) {\n    const g      = new THREE.Group();\n    const mat    = this._mat(p.primaryColor ?? '#c8a830', 0.4, 0.6);\n    const shade  = this._mat(p.secondColor  ?? '#e8d090', 0.7);\n    // Base\n    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 16), mat));\n    // Pole\n    g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.55, 8), mat), { position: new THREE.Vector3(0, 0.31, 0) }));\n    // Shade\n    g.add(Object.assign(new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.22, 12, 1, true), shade), { position: new THREE.Vector3(0, 0.67, 0) }));\n    // Bulb\n    g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6),\n      new THREE.MeshStandardMaterial({ color: 0xfffff0, emissive: 0xffffaa, emissiveIntensity: 0.8 })),\n      { position: new THREE.Vector3(0, 0.58, 0) }));\n    return g;\n  }\n\n  generate(params = {}) {\n    const type = `${params.propCategory}:${params.propType}`;\n    let g;\n    if      (type.includes('Chair'))  g = this.buildChair(params);\n    else if (type.includes('Table'))  g = this.buildTable(params);\n    else if (type.includes('Barrel')) g = this.buildBarrel(params);\n    else if (type.includes('Crate'))  g = this.buildCrate(params);\n    else if (type.includes('Sword'))  g = this.buildSword(params);\n    else if (type.includes('Lamp'))   g = this.buildLamp(params);
    else    g = this.buildCrate(params);
    g.scale.set(params.scaleX ?? 1, params.scaleY ?? 1, params.scaleZ ?? 1);
    g.userData.params = params;
    return g;
  }

  toJSON() { return { seed: this.seed, opts: this.opts }; }
}

export default PropGenerator;
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
