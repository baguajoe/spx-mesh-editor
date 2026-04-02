/**
 * CreatureGenerator.js — SPX Mesh Editor
 * Modular creature mesh assembly: body, head, limbs, wings, tail, skin FX.
 */
import * as THREE from 'three';\n\nconst clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));\nconst lerp  = (a, b, t)   => a + (b - a) * t;\nconst rand  = (lo, hi)    => lo + Math.random() * (hi - lo);\nconst TWO_PI = Math.PI * 2;\n\n\nexport class CreatureGenerator {\n  constructor(opts = {}) {\n    this.opts = opts;\n    this.seed = opts.seed ?? 7;\n    this._rng = this._mkRng(this.seed);\n  }\n  _mkRng(s) { let n = s; return () => { n = (n * 9301 + 49297) % 233280; return n / 233280; }; }\n  _rn(lo, hi) { return lo + this._rng() * (hi - lo); }\n  _mat(hex, rough = 0.7, metal = 0) {\n    return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: metal });\n  }\n\n  buildBody(p) {\n    const W = 0.45 + p.bodyGirth * 0.40;\n    const L = 0.70 + p.bodyLen   * 0.60;\n    const H = 0.35;\n    const geo = new THREE.SphereGeometry(W / 2, 12, 9);\n    const pos = geo.attributes.position;\n    for (let i = 0; i < pos.count; i++) {\n      pos.setZ(i, pos.getZ(i) * (L / W));\n      pos.setY(i, pos.getY(i) * (H / (W / 2)));\n    }\n    pos.needsUpdate = true;\n    geo.computeVertexNormals();\n    return geo;\n  }\n\n  buildHead(p) {\n    const r = 0.22 + this._rn(-0.04, 0.08);\n    return new THREE.SphereGeometry(r, 12, 10);\n  }\n\n  buildHorn(p, index, total) {\n    const h = 0.10 + this._rn(0.04, 0.16);\n    const ang = ((index / Math.max(total, 1)) - 0.5) * Math.PI * 0.7;\n    const pts = [\n      new THREE.Vector3(Math.sin(ang) * 0.03, 0, 0),\n      new THREE.Vector3(Math.sin(ang) * 0.05, h * 0.4, 0),\n      new THREE.Vector3(Math.sin(ang) * 0.02, h, 0),\n    ];\n    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, 0.018 + this._rn(0, 0.012), 6, false);\n  }\n\n  buildLimb(len, thick) {\n    const pts = [\n      new THREE.Vector3(0, 0, 0),\n      new THREE.Vector3(len * 0.3, -len * 0.1, 0),\n      new THREE.Vector3(len, -len * 0.25, 0),\n    ];\n    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, thick / 2, 6, false);\n  }\n\n  buildWing(p) {\n    const span = 0.7 + this._rn(0, 0.5);\n    const pts  = [\n      new THREE.Vector2(0, 0),\n      new THREE.Vector2(span * 0.35, span * 0.28),\n      new THREE.Vector2(span, 0),\n      new THREE.Vector2(span * 0.6, -span * 0.35),\n      new THREE.Vector2(0, 0),\n    ];\n    return new THREE.ShapeGeometry(new THREE.Shape(pts));\n  }\n\n  buildTail(p) {\n    const len  = 0.35 + (p.tailLen ?? 0.6) * 0.80;\n    const segs = 10;\n    const pts  = Array.from({ length: segs }, (_, i) => {\n      const t = i / (segs - 1);\n      return new THREE.Vector3(\n        Math.sin(t * Math.PI * 0.6) * len * 0.18,\n        -t * len * 0.25,\n        t * len\n      );\n    });\n    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs * 2, 0.035 * (1 - 0.75 * (p.tailLen ?? 0.6)), 6, false);\n  }\n\n  assemble(params = {}) {\n    const {\n      archetype = 'Reptilian', primaryColor = '#4a6a30', secondColor = '#2a3a18',\n      accentColor = '#c8a000', bodyLen = 0.5, bodyGirth = 0.5,\n      limbCount = 4, hornCount = 2, wingType = 'None', tailType = 'Long',\n      biolum = false, biolumColor = '#00ffc8', biolumIntensity = 0.6,\n      armorPlates = false, armorColor = '#505060',\n    } = params;\n\n    const group = new THREE.Group();\n    const mat1  = this._mat(primaryColor, 0.7);\n    const mat2  = this._mat(secondColor, 0.8);\n    const matAcc = this._mat(accentColor, 0.4, 0.2);\n    if (biolum) mat1.emissive = new THREE.Color(biolumColor);\n    if (biolum) mat1.emissiveIntensity = biolumIntensity * 0.15;\n\n    // Body\n    const bodyGeo = this.buildBody(params);\n    group.add(new THREE.Mesh(bodyGeo, mat1));\n\n    // Head\n    const headGeo = this.buildHead(params);\n    const head    = new THREE.Mesh(headGeo, mat1);\n    head.position.set(0, 0.10, 0.55 + bodyLen * 0.28);\n    group.add(head);\n\n    // Horns\n    for (let i = 0; i < Math.min(hornCount, 8); i++) {\n      const hGeo = this.buildHorn(params, i, hornCount);\n      const h    = new THREE.Mesh(hGeo, matAcc);\n      const ang  = ((i / Math.max(hornCount, 1)) - 0.5) * Math.PI * 0.7;\n      h.position.set(Math.sin(ang) * 0.10, 0.22, 0.55 + bodyLen * 0.28);\n      group.add(h);\n    }\n\n    // Limbs\n    for (let i = 0; i < Math.min(limbCount, 8); i++) {\n      const side = i % 2 === 0 ? -1 : 1;\n      const row  = Math.floor(i / 2);\n      const lGeo = this.buildLimb(0.28 + bodyGirth * 0.10, 0.06);\n      const limb = new THREE.Mesh(lGeo, mat2);\n      limb.position.set(side * (0.28 + bodyGirth * 0.18), -0.12, -0.15 + row * 0.28);\n      limb.rotation.z = side * 0.45;\n      group.add(limb);\n    }\n\n    // Wings\n    if (wingType !== 'None') {\n      [-1, 1].forEach(side => {\n        const wGeo = this.buildWing(params);\n        const wing = new THREE.Mesh(wGeo, new THREE.MeshStandardMaterial({\n          color: new THREE.Color(primaryColor), transparent: true, opacity: 0.65, side: THREE.DoubleSide,\n        }));\n        wing.position.set(side * 0.45, 0.15, 0);\n        wing.scale.x = side;\n        group.add(wing);\n      });\n    }\n\n    // Tail\n    if (tailType !== 'None') {
      const tGeo = this.buildTail(params);
      const tail = new THREE.Mesh(tGeo, mat2);
      tail.position.set(0, -0.05, -0.38 - bodyLen * 0.18);
      group.add(tail);
    }

    // Armor plates
    if (armorPlates) {
      const armorMat = this._mat(armorColor, 0.4, 0.3);
      for (let i = 0; i < 5; i++) {
        const plate = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4, 0, TWO_PI, 0, Math.PI * 0.5), armorMat);
        plate.position.set(0, 0.18, -0.25 + i * 0.12);
        group.add(plate);
      }
    }

    group.userData.params = params;
    return group;
  }

  generate(params = {}) { return this.assemble(params); }
  toJSON() { return { seed: this.seed, opts: this.opts }; }
}

export default CreatureGenerator;
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
