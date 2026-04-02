/**
 * FaceGenerator.js — SPX Mesh Editor
 * Procedural face mesh with morphable skull, nose, eyes, lips, and blendshape targets.
 */
import * as THREE from 'three';\n\nconst clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));\nconst lerp  = (a, b, t)   => a + (b - a) * t;\nconst rand  = (lo, hi)    => lo + Math.random() * (hi - lo);\nconst TWO_PI = Math.PI * 2;\n\n\nconst MORPH_TARGETS = ['jawOpen','mouthSmile','mouthFrown','eyeBlink_L','eyeBlink_R',\n  'browUp_L','browUp_R','browDown_L','browDown_R','cheekPuff_L','cheekPuff_R',\n  'noseSneer_L','noseSneer_R','tongueOut','surprise','anger','disgust','fear','contempt'];\n\nexport class FaceGenerator {\n  constructor(opts = {}) {\n    this.seed      = opts.seed      ?? Math.random() * 9999 | 0;\n    this.polyLevel = opts.polyLevel ?? 'High';\n    this.opts      = opts;\n    this._rng      = this._mkRng(this.seed);\n  }\n\n  _mkRng(s) { let n = s; return () => { n = (n * 9301 + 49297) % 233280; return n / 233280; }; }\n  _rn(lo, hi) { return lo + this._rng() * (hi - lo); }\n\n  _polyCount() {\n    return { 'Low (800)': 800, 'Mid (3.2K)': 3200, 'High (12K)': 12000, 'Ultra (48K)': 48000 }[this.polyLevel] ?? 12000;\n  }\n\n  buildSkull(params = {}) {\n    const { foreheadH = 0.5, jawWidth = 0.5, cheekbone = 0.5, chinPoint = 0.5, faceLen = 0.5 } = params;\n    const segs = Math.round(Math.sqrt(this._polyCount() / 2));\n    const geo  = new THREE.SphereGeometry(1, Math.min(segs, 48), Math.min(segs, 32));\n    const pos  = geo.attributes.position;\n    for (let i = 0; i < pos.count; i++) {\n      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);\n      // Jaw narrowing\n      if (y < -0.2) {\n        const t = clamp((-y - 0.2) / 0.8, 0, 1);\n        pos.setX(i, x * lerp(1, jawWidth * 0.7, t));\n        pos.setZ(i, z * lerp(1, 0.7, t));\n      }\n      // Chin projection\n      if (y < -0.7) pos.setY(i, y * (1 + chinPoint * 0.25));\n      // Forehead expansion\n      if (y > 0.5)  pos.setY(i, y * (1 + foreheadH * 0.12));\n      // Cheekbone\n      if (Math.abs(y) < 0.25 && Math.abs(x) > 0.5) pos.setX(i, x * (1 + cheekbone * 0.18));\n      // Face length\n      pos.setY(i, pos.getY(i) * (0.85 + faceLen * 0.3));\n    }\n    pos.needsUpdate = true;\n    geo.computeVertexNormals();\n    return geo;\n  }\n\n  buildNose(params = {}) {\n    const { noseBridge = 0.5, noseW = 0.5, nostrilFlare = 0.4, noseLen = 0.5, noseTip = 0.5 } = params;\n    const pts = [\n      new THREE.Vector3(0, 0.22, 0.78),\n      new THREE.Vector3(0, 0.12, 0.92 + noseBridge * 0.06),\n      new THREE.Vector3(0, 0.02, 0.96 + noseBridge * 0.04),\n      new THREE.Vector3(0, -0.08, 0.88 + noseTip * 0.04),\n      new THREE.Vector3(0, -0.18, 0.80 + nostrilFlare * 0.04),\n    ];\n    const r = lerp(0.055, 0.09, noseW);\n    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, r, 8, false);\n  }\n\n  buildEye(params = {}, side = 1) {\n    const { eyeSize = 0.5, eyeSpacing = 0.5, eyeDepth = 0.4, irisColor = '#3a7acc' } = params;\n    const g    = new THREE.Group();\n    const xOff = (0.28 + eyeSpacing * 0.08) * side;\n    const yOff = 0.10;\n    const zOff = 0.72 + eyeDepth * 0.05;\n    const r    = 0.10 + eyeSize * 0.03;\n    // Eyeball\n    const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12),\n      new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.1 }));\n    ball.position.set(xOff, yOff, zOff);\n    // Iris\n    const iris = new THREE.Mesh(new THREE.CircleGeometry(r * 0.55, 20),\n      new THREE.MeshStandardMaterial({ color: new THREE.Color(irisColor) }));\n    iris.position.set(xOff, yOff, zOff + r * 0.98);\n    // Pupil\n    const pupil = new THREE.Mesh(new THREE.CircleGeometry(r * 0.28, 16),\n      new THREE.MeshStandardMaterial({ color: 0x080808 }));\n    pupil.position.set(xOff, yOff, zOff + r * 0.99);\n    g.add(ball, iris, pupil);\n    return g;\n  }\n\n  buildLips(params = {}) {\n    const { lipThick = 0.5, lipWidth = 0.5, mouthAngle = 0, lipColor = '#c06070' } = params;\n    const w  = 0.16 + lipWidth * 0.06;\n    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(lipColor), roughness: 0.5 });\n    const upper = new THREE.Mesh(new THREE.TorusGeometry(w, 0.03 + lipThick * 0.02, 6, 16, Math.PI), mat);\n    upper.position.set(0, -0.22, 0.80);\n    upper.rotation.x = -0.3 + mouthAngle * 0.5;\n    const lower = new THREE.Mesh(new THREE.TorusGeometry(w * 0.9, 0.035 + lipThick * 0.025, 6, 16, Math.PI), mat);\n    lower.position.set(0, -0.27, 0.79);\n    lower.rotation.x = 0.3 - mouthAngle * 0.5;\n    return { upper, lower };\n  }\n\n  buildMorphTargets(baseGeo) {\n    return MORPH_TARGETS.map(name => ({\n      name,\n      data: new Float32Array(baseGeo.attributes.position.array.length),\n    }));\n  }\n\n  generate(params = {}) {\n    const skull  = this.buildSkull(params);\n    const nose   = this.buildNose(params);\n    const eyeL   = this.buildEye(params, -1);\n    const eyeR   = this.buildEye(params,  1);\n    const { upper, lower } = this.buildLips(params);\n    const morphs = this.buildMorphTargets(skull);\n    const group  = new THREE.Group();\n    const skinMat = new THREE.MeshStandardMaterial({\n      color: new THREE.Color(params.skinTone ?? '#c8906a'), roughness: 0.6, metalness: 0,
    });
    group.add(new THREE.Mesh(skull, skinMat));
    group.add(new THREE.Mesh(nose,  skinMat));
    group.add(upper, lower, eyeL, eyeR);
    group.userData.morphTargets = morphs;
    group.userData.params = params;
    return group;
  }

  toJSON() {
    return { seed: this.seed, polyLevel: this.polyLevel, opts: this.opts };
  }
}

export default FaceGenerator;
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
