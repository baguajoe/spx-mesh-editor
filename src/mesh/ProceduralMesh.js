import * as THREE from "three";

// ── Pipe ──────────────────────────────────────────────────────────────────────
export function createPipe({ radius = 0.3, innerRadius = 0.2, height = 2, segments = 32 } = {}) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height, bevelEnabled: false, curveSegments: segments,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

// ── Staircase ─────────────────────────────────────────────────────────────────
export function createStaircase({ steps = 8, width = 2, stepHeight = 0.2, stepDepth = 0.3 } = {}) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (let i = 0; i < steps; i++) {
    shape.lineTo(i * stepDepth, i * stepHeight);
    shape.lineTo((i + 1) * stepDepth, i * stepHeight);
    shape.lineTo((i + 1) * stepDepth, (i + 1) * stepHeight);
  }
  shape.lineTo(0, steps * stepHeight);
  shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width, bevelEnabled: false,
  });
  geo.rotateY(Math.PI / 2);
  geo.center();
  return geo;
}

// ── Arch ──────────────────────────────────────────────────────────────────────
export function createArch({ width = 2, height = 2, thickness = 0.3, depth = 0.4, segments = 32 } = {}) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  // Outer arch
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, height - hw);
  shape.absarc(0, height - hw, hw, Math.PI, 0, false);
  shape.lineTo(hw, 0);
  shape.lineTo(hw - thickness, 0);
  shape.lineTo(hw - thickness, height - hw);
  const innerR = hw - thickness;
  shape.absarc(0, height - hw, innerR, 0, Math.PI, true);
  shape.lineTo(-hw + thickness, 0);
  shape.lineTo(-hw, 0);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: false, curveSegments: segments,
  });
  geo.center();
  return geo;
}

// ── Gear ──────────────────────────────────────────────────────────────────────
export function createGear({ teeth = 12, radius = 1, toothHeight = 0.2, toothWidth = 0.15, depth = 0.3 } = {}) {
  const shape = new THREE.Shape();
  const angleStep = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a1 = i * angleStep;
    const a2 = a1 + angleStep * toothWidth;
    const a3 = a1 + angleStep * (toothWidth + 0.1);
    const a4 = a1 + angleStep * (1 - toothWidth - 0.1);
    const a5 = a1 + angleStep * (1 - toothWidth);
    const r  = radius;
    const rt = radius + toothHeight;
    if (i === 0) shape.moveTo(Math.cos(a1) * r, Math.sin(a1) * r);
    else shape.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    shape.lineTo(Math.cos(a2) * rt, Math.sin(a2) * rt);
    shape.lineTo(Math.cos(a3) * rt, Math.sin(a3) * rt);
    shape.lineTo(Math.cos(a4) * rt, Math.sin(a4) * rt);
    shape.lineTo(Math.cos(a5) * rt, Math.sin(a5) * rt);
    shape.lineTo(Math.cos(a1 + angleStep) * r, Math.sin(a1 + angleStep) * r);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.center();
  return geo;
}

// ── Helix ─────────────────────────────────────────────────────────────────────
export function createHelix({ turns = 3, radius = 1, height = 3, tubeRadius = 0.1, segments = 200, tubeSegments = 12 } = {}) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      t * height - height / 2,
      Math.sin(angle) * radius,
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, segments, tubeRadius, tubeSegments, false);
}

// ── Lathe (spin profile around Y) ─────────────────────────────────────────────
export function createLathe({ points = null, segments = 32, phiStart = 0, phiLength = Math.PI * 2 } = {}) {
  const pts = points || [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.5, 0.2),
    new THREE.Vector2(0.8, 0.5),
    new THREE.Vector2(0.6, 1.0),
    new THREE.Vector2(0.3, 1.5),
    new THREE.Vector2(0.2, 2.0),
  ];
  return new THREE.LatheGeometry(pts, segments, phiStart, phiLength);
}

// ── Build mesh from geometry ───────────────────────────────────────────────────
export function buildProceduralMesh(geo, color = "#888888") {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

export function createAssetLibrary() {
    return {
        categories: ['Primitives', 'Characters', 'Architecture', 'Nature'],
        assets: [],
        lastSync: Date.now()
    };
}

export function createTourState() {
    return {
        isActive: false,
        currentStep: 0,
        anchors: []
    };
}
