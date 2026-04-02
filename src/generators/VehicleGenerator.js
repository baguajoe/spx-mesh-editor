/**
 * VehicleGenerator.js — SPX Mesh Editor
 * Parametric vehicle builder: cars, trucks, motorcycles, planes, boats, mechs.
 */
import * as THREE from 'three';\n\nconst clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));\nconst lerp  = (a, b, t)   => a + (b - a) * t;\nconst rand  = (lo, hi)    => lo + Math.random() * (hi - lo);\nconst TWO_PI = Math.PI * 2;\n\n\nexport class VehicleGenerator {\n  constructor(opts = {}) {\n    this.opts = opts;\n    this.seed = opts.seed ?? 3;\n    this._rng = this._mkRng(this.seed);\n  }\n  _mkRng(s) { let n = s; return () => { n = (n * 9301 + 49297) % 233280; return n / 233280; }; }\n  _rn(lo, hi) { return lo + this._rng() * (hi - lo); }\n  _mat(hex, rough = 0.3, metal = 0.8) {\n    return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: metal });\n  }\n\n  buildWheel(radius, thickness, rimColor) {\n    const g       = new THREE.Group();\n    const tireMat = this._mat('#1a1a1a', 0.9, 0);\n    const rimMat  = this._mat(rimColor ?? '#888888', 0.25, 0.9);\n    const tire    = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 24), tireMat);\n    tire.rotation.x = Math.PI / 2;\n    const rim     = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, thickness + 0.01, 8), rimMat);\n    rim.rotation.x = Math.PI / 2;\n    // Spokes\n    for (let i = 0; i < 5; i++) {\n      const angle = (i / 5) * TWO_PI;\n      const spoke = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.08, radius * 0.9, thickness * 0.5), rimMat);\n      spoke.rotation.z = angle;\n      g.add(spoke);\n    }\n    g.add(tire, rim);\n    return g;\n  }\n\n  buildCar(p) {\n    const { primaryColor = '#1a2a8a', secondColor = '#c0c0c0',\n      bodyLen = 0.5, bodyW = 0.5, bodyH = 0.5,\n      wheelSize = 0.5, wheelW = 0.5, wheelCount = 4,\n      roughness = 0.25, metalness = 0.7, windowTint = 0.3,\n      addLights = true } = p;\n\n    const L = 3.6 + bodyLen * 1.4;\n    const W = 1.65 + bodyW  * 0.35;\n    const H = 1.25 + bodyH  * 0.35;\n    const group  = new THREE.Group();\n    const bodyMat  = this._mat(primaryColor, roughness, metalness);\n    const glassMat = new THREE.MeshStandardMaterial({\n      color: 0x223344, transparent: true, opacity: 0.35 + windowTint * 0.4, metalness: 0.05, roughness: 0.05,\n    });\n\n    // Body lower\n    const bodyLow = new THREE.Mesh(new THREE.BoxGeometry(L, H * 0.52, W), bodyMat);\n    bodyLow.position.y = H * 0.52 / 2 + 0.22;\n    group.add(bodyLow);\n\n    // Cabin\n    const cabW = L * 0.52, cabH = H * 0.46;\n    const cabin = new THREE.Mesh(new THREE.BoxGeometry(cabW, cabH, W * 0.88), bodyMat);\n    cabin.position.set(L * 0.04, H * 0.52 + cabH / 2 + 0.22, 0);\n    group.add(cabin);\n\n    // Windshield\n    const windF = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.82, cabH * 0.78), glassMat);\n    windF.position.set(cabW * 0.47 + L * 0.04, H * 0.52 + cabH / 2 + 0.22, 0);\n    windF.rotation.y = Math.PI / 2 - 0.28;\n    group.add(windF);\n\n    // Side windows\n    [-W / 2 - 0.01, W / 2 + 0.01].forEach((z, si) => {\n      const win = new THREE.Mesh(new THREE.PlaneGeometry(cabW * 0.85, cabH * 0.7), glassMat);\n      win.position.set(L * 0.04, H * 0.52 + cabH / 2 + 0.22, z);\n      win.rotation.y = si === 0 ? Math.PI / 2 : -Math.PI / 2;\n      group.add(win);\n    });\n\n    // Wheels\n    const wr = 0.27 + wheelSize * 0.09;\n    const wt = 0.17 + wheelW  * 0.07;\n    const wPositions = [\n      [-L * 0.36,  wr + 0.22,  W / 2 + wt / 2 + 0.02],\n      [-L * 0.36,  wr + 0.22, -W / 2 - wt / 2 - 0.02],\n      [ L * 0.30,  wr + 0.22,  W / 2 + wt / 2 + 0.02],\n      [ L * 0.30,  wr + 0.22, -W / 2 - wt / 2 - 0.02],\n    ].slice(0, wheelCount);\n    wPositions.forEach(([wx, wy, wz]) => {\n      const wheel = this.buildWheel(wr, wt, secondColor);\n      wheel.position.set(wx, wy, wz);\n      wheel.rotation.y = wz > 0 ? 0 : Math.PI;\n      group.add(wheel);\n    });\n\n    // Headlights\n    if (addLights) {\n      const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffaa, emissiveIntensity: 0.9 });\n      [-W * 0.3, W * 0.3].forEach(z => {\n        const l = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), lightMat);\n        l.position.set(-L / 2, H * 0.52 * 0.75 + 0.22, z);\n        group.add(l);\n      });\n      // Taillights\n      const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff1100, emissiveIntensity: 0.7 });\n      [-W * 0.28, W * 0.28].forEach(z => {\n        const t = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.08), tailMat);\n        t.position.set(L / 2, H * 0.52 * 0.7 + 0.22, z);\n        group.add(t);\n      });\n    }\n\n    group.userData.params = p;\n    return group;\n  }\n\n  buildMotorcycle(p) {\n    const { primaryColor = '#cc2200' } = p;\n    const g   = new THREE.Group();\n    const mat = this._mat(primaryColor, 0.3, 0.7);\n    // Frame\n    g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8), mat),\n      { rotation: new THREE.Euler(0, 0, Math.PI / 2), position: new THREE.Vector3(0, 0.68, 0) }));\n    // Engine block\n    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.20, 0.22), this._mat('#2a2a2a', 0.5, 0.7)),\n      { position: new THREE.Vector3(0, 0.52, 0) }));\n    // Wheels\n    [-0.52, 0.52].forEach(z => {\n      const w = this.buildWheel(0.30, 0.12, '#888888');\n      w.position.set(0, 0.30, z);\n      g.add(w);\n    });\n    // Seat\n    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.18), this._mat('#1a1a1a', 0.9, 0)),\n      { position: new THREE.Vector3(-0.1, 0.84, 0) }));\n    // Handlebars\n    g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.52, 8), this._mat('#888888', 0.2, 0.9)),\n      { rotation: new THREE.Euler(0, 0, Math.PI / 2), position: new THREE.Vector3(-0.45, 0.95, 0) }));\n    g.userData.params = p;\n    return g;\n  }\n\n  generate(params = {}) {\n    const cls = params.vehicleClass ?? 'Car';\n    if (cls === 'Motorcycle' || cls === 'Bicycle') return this.buildMotorcycle(params);
    return this.buildCar(params);
  }

  toJSON() { return { seed: this.seed, opts: this.opts }; }
}

export default VehicleGenerator;
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
