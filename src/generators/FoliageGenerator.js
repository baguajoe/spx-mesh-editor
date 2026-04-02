/**
 * FoliageGenerator.js — SPX Mesh Editor
 * L-system & parametric foliage: trees, shrubs, grass, ferns, mushrooms.
 */
import * as THREE from 'three';\n\nconst clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));\nconst lerp  = (a, b, t)   => a + (b - a) * t;\nconst rand  = (lo, hi)    => lo + Math.random() * (hi - lo);\nconst TWO_PI = Math.PI * 2;\n\n\nfunction hash(n) { return Math.sin(n * 127.1 + 311.7) * 43758.5453 % 1; }\n\nexport class FoliageGenerator {\n  constructor(opts = {}) {\n    this.opts = opts;\n    this.seed = opts.seed ?? 1;\n    this._rng = this._mkRng(this.seed);\n  }\n  _mkRng(s) { let n = s; return () => { n = (n * 9301 + 49297) % 233280; return n / 233280; }; }\n  _rn(lo, hi) { return lo + this._rng() * (hi - lo); }\n\n  buildTrunk(height, radius, taper, curve = 0.2, barkColor = '#5a3820') {\n    const segs = 5;\n    const geo  = new THREE.CylinderGeometry(radius * (1 - taper), radius, height, 8, segs, false);\n    const pos  = geo.attributes.position;\n    // Add curve\n    for (let i = 0; i < pos.count; i++) {\n      const y = pos.getY(i);\n      const t = (y + height / 2) / height;\n      const bend = t * t * curve * 0.3;\n      pos.setX(i, pos.getX(i) + bend);\n      // Twist\n      const ang = t * 0.4;\n      const x = pos.getX(i), z = pos.getZ(i);\n      pos.setX(i, x * Math.cos(ang) - z * Math.sin(ang));\n      pos.setZ(i, x * Math.sin(ang) + z * Math.cos(ang));\n    }\n    pos.needsUpdate = true;\n    geo.computeVertexNormals();\n    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: new THREE.Color(barkColor), roughness: 0.9 }));\n  }\n\n  buildLeafCard(size, color1 = '#3a7a20', color2 = '#5a9a30') {\n    const geo = new THREE.PlaneGeometry(size, size * 1.6, 2, 4);\n    const pos = geo.attributes.position;\n    for (let i = 0; i < pos.count; i++) {\n      const y = pos.getY(i);\n      pos.setZ(i, Math.sin((y / size + 0.5) * Math.PI) * size * 0.1);\n    }\n    pos.needsUpdate = true;\n    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({\n      color: new THREE.Color(this._rng() > 0.5 ? color1 : color2),\n      side: THREE.DoubleSide, roughness: 0.9, alphaTest: 0.4,\n    }));\n  }\n\n  buildBranch(len, radius, droop = 0.2) {\n    const pts = [\n      new THREE.Vector3(0, 0, 0),\n      new THREE.Vector3(len * 0.3, len * 0.2 - droop * 0.1, 0),\n      new THREE.Vector3(len, len * 0.1 - droop * len * 0.3, 0),\n    ];\n    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, radius, 5, false);\n  }\n\n  buildCanopy(centerY, spreadR, density, leafSize, color1, color2) {\n    const group = new THREE.Group();\n    const count = Math.round(density * 80);\n    for (let i = 0; i < count; i++) {\n      const theta = this._rn(0, TWO_PI);\n      const phi   = this._rn(0, Math.PI * 0.65);\n      const r     = this._rn(spreadR * 0.2, spreadR);\n      const leaf  = this.buildLeafCard(leafSize ?? 0.14, color1, color2);\n      leaf.position.set(\n        r * Math.sin(phi) * Math.cos(theta),\n        centerY + r * Math.cos(phi) * 0.6,\n        r * Math.sin(phi) * Math.sin(theta),\n      );\n      leaf.rotation.set(this._rn(-0.5, 0.5), this._rn(0, TWO_PI), this._rn(-0.3, 0.3));\n      group.add(leaf);\n    }\n    return group;\n  }\n\n  buildTree(params = {}) {\n    const {\n      trunkH = 0.5, trunkGirth = 0.5, trunkTaper = 0.4, trunkCurve = 0.2,\n      barkColor = '#5a3820', branchCount = 0.6, branchLen = 0.5, branchDroop = 0.2,\n      leafDensity = 0.7, leafSize = 0.5, leafColor = '#3a7a20', leafColor2 = '#5a9a30',\n    } = params;\n    const group  = new THREE.Group();\n    const height = 3 + trunkH * 7;\n    const radius = 0.10 + trunkGirth * 0.20;\n    const trunk  = this.buildTrunk(height, radius, trunkTaper, trunkCurve, barkColor);\n    trunk.position.y = height / 2;\n    group.add(trunk);\n    const branches = Math.round(3 + branchCount * 9);\n    const branchMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(barkColor), roughness: 0.9 });\n    for (let i = 0; i < branches; i++) {\n      const bh  = height * (0.35 + i / branches * 0.55);\n      const ang = (i / branches) * TWO_PI + this._rn(-0.4, 0.4);\n      const bl  = (0.8 + branchLen) * (0.8 + this._rn(-0.2, 0.2));\n      const bGeo = this.buildBranch(bl, radius * 0.35, branchDroop);\n      const b    = new THREE.Mesh(bGeo, branchMat);\n      b.position.set(0, bh, 0);\n      b.rotation.y = ang;\n      b.rotation.z = 0.5 + branchDroop * 0.5;\n      group.add(b);\n    }\n    const canopy = this.buildCanopy(height * 0.82, 1.4 + branchLen, leafDensity, 0.11 + leafSize * 0.07, leafColor, leafColor2);\n    group.add(canopy);\n    group.userData.params = params;\n    return group;\n  }\n\n  buildGrassTuft(params = {}) {\n    const count = 10 + Math.round((params.leafDensity ?? 0.7) * 22);\n    const group = new THREE.Group();\n    const mat   = new THREE.MeshStandardMaterial({ color: new THREE.Color(params.leafColor ?? '#4a8a20'), side: THREE.DoubleSide });\n    for (let i = 0; i < count; i++) {\n      const h   = 0.18 + this._rn(0, 0.28);\n      const geo = new THREE.PlaneGeometry(0.035, h, 1, 5);\n      const pos = geo.attributes.position;\n      for (let j = 0; j < pos.count; j++) {\n        const t = (pos.getY(j) + h / 2) / h;\n        pos.setX(j, pos.getX(j) + Math.sin(t * Math.PI) * 0.04 * this._rn(-1, 1));\n      }\n      pos.needsUpdate = true;\n      const blade = new THREE.Mesh(geo, mat);\n      blade.position.set(this._rn(-0.18, 0.18), h / 2, this._rn(-0.18, 0.18));\n      blade.rotation.y = this._rn(0, TWO_PI);\n      group.add(blade);\n    }\n    return group;\n  }\n\n  buildMushroom(params = {}) {\n    const group  = new THREE.Group();\n    const capColor  = params.primaryColor ?? '#cc3322';\n    const stemColor = '#e8d8c0';\n    const stem  = new THREE.Mesh(\n      new THREE.CylinderGeometry(0.04, 0.06, 0.20, 10),\n      new THREE.MeshStandardMaterial({ color: new THREE.Color(stemColor), roughness: 0.8 })\n    );\n    stem.position.y = 0.10;\n    const cap   = new THREE.Mesh(\n      new THREE.SphereGeometry(0.18, 12, 8, 0, TWO_PI, 0, Math.PI * 0.6),\n      new THREE.MeshStandardMaterial({ color: new THREE.Color(capColor), roughness: 0.7 })\n    );\n    cap.position.y = 0.22;\n    group.add(stem, cap);\n    return group;\n  }\n\n  generate(params = {}) {\n    const type = params.foliageType ?? 'Deciduous Tree';\n    if (type === 'Grass Tuft') return this.buildGrassTuft(params);\n    if (type === 'Mushroom')   return this.buildMushroom(params);
    return this.buildTree(params);
  }

  toJSON() {
    return { seed: this.seed, opts: this.opts };
  }
}

export default FoliageGenerator;
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
