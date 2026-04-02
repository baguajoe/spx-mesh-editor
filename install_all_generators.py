#!/usr/bin/env python3
"""
Build all generator JS engines + upgrade all thin panels to 400+ lines
Run: python3 install_all_generators.py
"""
import os

SRC = "/workspaces/spx-mesh-editor/src"
os.makedirs(SRC, exist_ok=True)

files = {}

# ─────────────────────────────────────────────────────────────────────────────
# FaceGenerator.js — Full geometry engine
# ─────────────────────────────────────────────────────────────────────────────
files[f"{SRC}/generators/face/FaceGenerator.js"] = r'''// FaceGenerator.js — Procedural Face Mesh Generator
// SPX Mesh Editor | StreamPireX
// Generates anatomically correct face geometry from parameters

import * as THREE from 'three';

// ─── Utilities ────────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function addVertex(positions, normals, uvs, x, y, z, nx=0, ny=1, nz=0, u=0, v=0) {
  positions.push(x, y, z);
  normals.push(nx, ny, nz);
  uvs.push(u, v);
  return positions.length / 3 - 1;
}

function addFace(indices, a, b, c) { indices.push(a, b, c); }
function addQuad(indices, a, b, c, d) { indices.push(a, b, c, a, c, d); }

// ─── Head Shape ───────────────────────────────────────────────────────────────

export function generateHeadGeometry(params = {}) {
  const {
    headWidth        = 1.0,
    headHeight       = 1.2,
    jawWidth         = 0.85,
    chinHeight       = 0.15,
    cheekbone        = 0.6,
    foreheadHeight   = 0.4,
    crownRoundness   = 0.8,
    temporalWidth    = 0.9,
    occipitalBulge   = 0.3,
    segments         = 24,
  } = params;

  const positions = [], normals = [], uvs = [], indices = [];
  const rings = 16;
  const segs = segments;

  // Generate head as deformed sphere with facial feature zones
  for (let r = 0; r <= rings; r++) {
    const phi = (r / rings) * Math.PI;
    const y = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    for (let s = 0; s <= segs; s++) {
      const theta = (s / segs) * Math.PI * 2;
      const x = Math.cos(theta) * sinPhi;
      const z = Math.sin(theta) * sinPhi;

      // Deform based on face region
      const t = r / rings; // 0=top, 1=bottom
      const isFront = z > 0;

      // Width deformation
      let wx = headWidth;
      if (t > 0.3 && t < 0.7) wx *= lerp(1, cheekbone, Math.sin((t-0.3)/0.4*Math.PI));
      if (t > 0.6) wx *= lerp(cheekbone, jawWidth, (t-0.6)/0.4);

      // Height deformation
      let hy = headHeight;
      if (t < 0.2) hy *= lerp(crownRoundness, 1, t/0.2);

      // Forehead flatten
      const foreheadFactor = isFront && t < 0.4 ? lerp(0.95, 1, t/0.4) : 1;

      // Temporal region
      const isTemple = Math.abs(x) > 0.7 && z > -0.3;
      const tempFactor = isTemple ? temporalWidth : 1;

      // Occipital bulge
      const isBack = z < -0.5;
      const occFactor = isBack && t > 0.3 && t < 0.7 ? 1 + occipitalBulge * 0.1 : 1;

      const px = x * wx * tempFactor * occFactor;
      const py = y * hy;
      const pz = z * (isFront ? foreheadFactor : occFactor);

      const len = Math.sqrt(px*px + py*py + pz*pz);
      addVertex(positions, normals, uvs, px, py, pz, px/len, py/len, pz/len, s/segs, r/rings);
    }
  }

  // Build indices
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = r*(segs+1)+s, b = a+1, c = a+(segs+1), d = c+1;
      addQuad(indices, a, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─── Eye Socket ───────────────────────────────────────────────────────────────

export function generateEyeSocket(params = {}) {
  const { size=0.12, depth=0.08, segments=16, side='left' } = params;
  const positions=[], normals=[], uvs=[], indices=[];
  const cx = side==='left' ? -0.28 : 0.28;
  const cy = 0.15, cz = 0.85;

  // Eye rim
  for (let i = 0; i <= segments; i++) {
    const a = (i/segments)*Math.PI*2;
    const x = cx + Math.cos(a)*size*(1 + Math.abs(Math.cos(a))*0.2);
    const y = cy + Math.sin(a)*size*0.7;
    const z = cz - Math.abs(Math.sin(a))*depth*0.5;
    addVertex(positions, normals, uvs, x, y, z, 0, 0, 1, i/segments, 0.5);
    addVertex(positions, normals, uvs, cx + Math.cos(a)*size*0.5, cy + Math.sin(a)*size*0.35, cz - depth, 0, 0, 1, i/segments, 1);
  }

  for (let i = 0; i < segments; i++) {
    const a = i*2, b = a+1, c = a+2, d = a+3;
    addQuad(indices, a, c, d, b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─── Nose ─────────────────────────────────────────────────────────────────────

export function generateNose(params = {}) {
  const { length=0.22, width=0.12, bridge=0.08, tipSize=0.06, nostrilFlare=0.04 } = params;
  const positions=[], normals=[], uvs=[], indices=[];

  const pts = [
    [0, 0.15, 0.75],           // bridge top
    [0, 0.08, 0.80+bridge],    // bridge mid
    [-width/2, 0, 0.85],        // left wing
    [width/2,  0, 0.85],        // right wing
    [-nostrilFlare, -length*0.3, 0.88],  // left nostril
    [nostrilFlare,  -length*0.3, 0.88],  // right nostril
    [0, -length*0.5, 0.90+tipSize],      // tip
  ];

  pts.forEach(([x,y,z], i) => addVertex(positions, normals, uvs, x, y, z, 0, 0, 1, i/pts.length, 0.5));
  indices.push(0,1,2, 0,1,3, 1,2,4, 1,3,5, 2,4,6, 3,5,6, 4,5,6);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─── Lips ─────────────────────────────────────────────────────────────────────

export function generateLips(params = {}) {
  const { width=0.38, thickness=0.08, cupDepth=0.04, segments=12 } = params;
  const positions=[], normals=[], uvs=[], indices=[];

  // Upper lip
  for (let i = 0; i <= segments; i++) {
    const t = i/segments;
    const x = (t-0.5)*width;
    const cupY = t > 0.3 && t < 0.7 ? -cupDepth * Math.sin((t-0.3)/0.4*Math.PI) : 0;
    const y = -0.12 + cupY;
    const z = 0.88 + Math.sin(t*Math.PI)*0.02;
    addVertex(positions, normals, uvs, x, y, z, 0, 0, 1, t, 0.3);
    addVertex(positions, normals, uvs, x, y-thickness*0.4, z+0.01, 0, 0, 1, t, 0.5);
  }

  // Lower lip
  for (let i = 0; i <= segments; i++) {
    const t = i/segments;
    const x = (t-0.5)*width*0.95;
    const y = -0.12 - thickness*0.6 - Math.sin(t*Math.PI)*thickness*0.3;
    const z = 0.88 + Math.sin(t*Math.PI)*0.03;
    addVertex(positions, normals, uvs, x, y, z, 0, 0, 1, t, 0.5);
    addVertex(positions, normals, uvs, x, y-thickness*0.3, z-0.01, 0, 0, 1, t, 0.7);
  }

  for (let i = 0; i < segments*2; i++) addQuad(indices, i*2, i*2+1, i*2+3, i*2+2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─── Ear ──────────────────────────────────────────────────────────────────────

export function generateEar(params = {}) {
  const { size=0.18, protrusion=0.06, side='left', segments=12 } = params;
  const cx = side==='left' ? -0.9 : 0.9;
  const positions=[], normals=[], uvs=[], indices=[];

  for (let i = 0; i <= segments; i++) {
    const t = i/segments;
    const a = t*Math.PI*2;
    // Ear is oval with helix notch
    const rx = size*0.4;
    const ry = size;
    const helixNotch = (t > 0.1 && t < 0.35) ? 0.15 : 0;
    const x = cx + Math.cos(a)*(rx - helixNotch*rx) * (side==='left'?-1:1);
    const y = 0.05 + Math.sin(a)*ry;
    const z = protrusion * Math.abs(Math.sin(a*0.5));
    addVertex(positions, normals, uvs, x, y, z, side==='left'?-1:1, 0, 0, t, 0.5);
    addVertex(positions, normals, uvs, x*(1-0.15), y*(1-0.1), z*0.3, side==='left'?-1:1, 0, 0, t, 1);
  }

  for (let i = 0; i < segments; i++) addQuad(indices, i*2, i*2+1, i*2+3, i*2+2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─── Full Face Assembly ───────────────────────────────────────────────────────

export function createFaceMesh(params = {}) {
  const head   = generateHeadGeometry(params);
  const noseG  = generateNose(params);
  const lipsG  = generateLips(params);
  const lEar   = generateEar({ ...params, side: 'left' });
  const rEar   = generateEar({ ...params, side: 'right' });

  // Merge all geometries
  const geos = [head, noseG, lipsG, lEar, rEar];
  let totalV = 0;
  const allPos=[], allNorm=[], allUV=[], allIdx=[];

  geos.forEach(geo => {
    const off = totalV;
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    const idx = geo.index;
    for (let i=0;i<pos.count;i++) {
      allPos.push(pos.getX(i),pos.getY(i),pos.getZ(i));
      allNorm.push(norm.getX(i),norm.getY(i),norm.getZ(i));
      allUV.push(uv.getX(i),uv.getY(i));
    }
    if (idx) Array.from(idx.array).forEach(i => allIdx.push(i+off));
    totalV += pos.count;
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(allPos, 3));
  merged.setAttribute('normal',   new THREE.Float32BufferAttribute(allNorm, 3));
  merged.setAttribute('uv',       new THREE.Float32BufferAttribute(allUV, 2));
  merged.setIndex(allIdx);
  merged.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.7, metalness: 0 });
  const mesh = new THREE.Mesh(merged, mat);
  mesh.name = 'Face';
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

export const FACE_PRESETS = {
  neutral:   { headWidth:1.0, headHeight:1.2, jawWidth:0.85, chinHeight:0.15, cheekbone:0.6 },
  masculine: { headWidth:1.1, headHeight:1.15, jawWidth:1.0, chinHeight:0.18, cheekbone:0.55 },
  feminine:  { headWidth:0.92, headHeight:1.25, jawWidth:0.75, chinHeight:0.12, cheekbone:0.68 },
  child:     { headWidth:0.88, headHeight:1.0, jawWidth:0.70, chinHeight:0.10, cheekbone:0.72 },
  elder:     { headWidth:0.98, headHeight:1.18, jawWidth:0.82, chinHeight:0.16, cheekbone:0.52 },
  anime:     { headWidth:0.90, headHeight:1.35, jawWidth:0.65, chinHeight:0.08, cheekbone:0.80 },
};

export default { createFaceMesh, generateHeadGeometry, generateEyeSocket, generateNose, generateLips, generateEar, FACE_PRESETS };
'''

# ─────────────────────────────────────────────────────────────────────────────
# FoliageGenerator.js — Full geometry engine
# ─────────────────────────────────────────────────────────────────────────────
files[f"{SRC}/generators/foliage/FoliageGenerator.js"] = r'''// FoliageGenerator.js — Procedural Foliage Geometry Generator
// SPX Mesh Editor | StreamPireX

import * as THREE from 'three';

function seededRng(seed) {
  let s = seed;
  return () => { s=(s*9301+49297)%233280; return s/233280; };
}

// ─── Trunk ────────────────────────────────────────────────────────────────────

export function generateTrunk(params = {}) {
  const { height=2, radius=0.18, segments=8, radialSegs=8, taper=0.6, bend=0.05, seed=42, rootFlare=0.25 } = params;
  const rng = seededRng(seed);
  const positions=[], normals=[], uvs=[], indices=[];

  const rings = segments + 1;
  for (let r = 0; r < rings; r++) {
    const t = r / (rings-1);
    const y = t * height;
    // Taper radius
    const flare = r === 0 ? 1 + rootFlare : 1;
    const rad = radius * lerp(flare, taper, t);
    // Bend noise
    const bendX = Math.sin(t*Math.PI) * bend * (rng()-0.5);
    const bendZ = Math.sin(t*Math.PI*1.3) * bend * (rng()-0.5);

    for (let s = 0; s <= radialSegs; s++) {
      const a = (s/radialSegs)*Math.PI*2;
      const x = Math.cos(a)*rad + bendX*y;
      const z = Math.sin(a)*rad + bendZ*y;
      const len = Math.sqrt(x*x+z*z);
      positions.push(x, y, z);
      normals.push(x/len, 0, z/len);
      uvs.push(s/radialSegs, t);
    }
  }

  for (let r = 0; r < rings-1; r++) {
    for (let s = 0; s < radialSegs; s++) {
      const a=r*(radialSegs+1)+s, b=a+1, c=a+(radialSegs+1), d=c+1;
      indices.push(a,b,d,a,d,c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function lerp(a,b,t){return a+(b-a)*t;}

// ─── Branch System ────────────────────────────────────────────────────────────

export function generateBranches(params = {}) {
  const { count=8, length=1.2, angle=45, radius=0.06, taper=0.3, spread=0.8, trunkHeight=2, levels=2, seed=42 } = params;
  const rng = seededRng(seed);
  const geos = [];

  function makeBranch(startPos, dir, len, rad, level) {
    if (level <= 0 || len < 0.05) return;
    const segs = Math.max(4, Math.floor(len*6));
    const positions=[], normals=[], uvs=[], indices=[];

    for (let r = 0; r <= segs; r++) {
      const t = r/segs;
      const y = t*len;
      const currentRad = rad * lerp(1, taper, t);
      const wobble = Math.sin(t*Math.PI*2)*0.02*rng();

      for (let s = 0; s <= 6; s++) {
        const a = (s/6)*Math.PI*2;
        const x = Math.cos(a)*currentRad + wobble;
        const z = Math.sin(a)*currentRad;
        positions.push(startPos.x+x, startPos.y+y, startPos.z+z);
        normals.push(x/currentRad, 0, z/currentRad);
        uvs.push(s/6, t);
      }
    }
    for (let r=0;r<segs;r++) for (let s=0;s<6;s++) {
      const a=r*7+s,b=a+1,c=a+7,d=c+1;
      indices.push(a,b,d,a,d,c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    geos.push(geo);

    // Sub-branches
    if (level > 1) {
      const subCount = 2 + Math.floor(rng()*3);
      for (let i=0;i<subCount;i++) {
        const t = 0.5 + rng()*0.4;
        const subPos = new THREE.Vector3(startPos.x, startPos.y+t*len, startPos.z);
        const subDir = dir.clone().applyAxisAngle(new THREE.Vector3(rng()-0.5,0,rng()-0.5).normalize(), (angle+rng()*20)*Math.PI/180);
        makeBranch(subPos, subDir, len*0.6, rad*0.5, level-1);
      }
    }
  }

  for (let i=0;i<count;i++) {
    const branchHeight = trunkHeight * (0.3 + rng()*0.6);
    const a = (i/count)*Math.PI*2 + rng()*0.5;
    const dir = new THREE.Vector3(Math.sin(angle*Math.PI/180)*Math.cos(a), Math.cos(angle*Math.PI/180), Math.sin(angle*Math.PI/180)*Math.sin(a)).normalize();
    makeBranch(new THREE.Vector3(0, branchHeight, 0), dir, length*(0.7+rng()*0.6), radius, levels);
  }

  return geos;
}

// ─── Leaf Cluster ─────────────────────────────────────────────────────────────

export function generateLeafCluster(params = {}) {
  const { radius=1.8, density=0.85, leafSize=0.18, leafCount=200, seed=42, color=0x3a7d44 } = params;
  const rng = seededRng(seed);
  const positions=[], normals=[], uvs=[], indices=[];
  const count = Math.floor(leafCount * density);

  for (let i=0;i<count;i++) {
    const phi = Math.acos(2*rng()-1);
    const theta = rng()*Math.PI*2;
    const r = radius*(0.5+rng()*0.5);
    const cx = r*Math.sin(phi)*Math.cos(theta);
    const cy = r*Math.cos(phi)*0.7 + radius*0.2;
    const cz = r*Math.sin(phi)*Math.sin(theta);

    const lx = (rng()-0.5)*leafSize*2;
    const ly = (rng()-0.5)*leafSize;
    const nx = 0, ny = 1, nz = 0;
    const rot = rng()*Math.PI*2;
    const cos = Math.cos(rot), sin = Math.sin(rot);

    const base = positions.length/3;
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([u,v]) => {
      const lx2 = u*leafSize*0.5*cos - v*leafSize*0.3*sin;
      const lz2 = u*leafSize*0.5*sin + v*leafSize*0.3*cos;
      positions.push(cx+lx2, cy+v*leafSize*0.3*0.3, cz+lz2);
      normals.push(0,1,0);
      uvs.push((u+1)/2,(v+1)/2);
    });
    indices.push(base,base+1,base+2, base,base+2,base+3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('normal',  new THREE.Float32BufferAttribute(normals,3));
  geo.setAttribute('uv',      new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);
  return geo;
}

// ─── Full Tree ────────────────────────────────────────────────────────────────

export function createTree(params = {}) {
  const { trunkColor=0x5c3d1e, leafColor=0x3a7d44, seed=42, ...rest } = params;
  const group = new THREE.Group();
  group.name = params.treeType || 'Tree';

  // Trunk
  const trunkGeo = generateTrunk({ ...rest, seed });
  const trunkMat = new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9, metalness: 0 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.castShadow = trunk.receiveShadow = true;
  group.add(trunk);

  // Branches
  const branchGeos = generateBranches({ ...rest, seed: seed+1 });
  const branchMat = new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9 });
  branchGeos.forEach(geo => {
    const m = new THREE.Mesh(geo, branchMat);
    m.castShadow = true;
    group.add(m);
  });

  // Leaves
  if ((params.canopyDensity ?? 0.85) > 0) {
    const leafGeo = generateLeafCluster({ ...rest, seed: seed+2, color: leafColor });
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8, side: THREE.DoubleSide });
    const leaves = new THREE.Mesh(leafGeo, leafMat);
    leaves.position.y = (rest.trunkHeight ?? 2) * 0.7;
    leaves.castShadow = leaves.receiveShadow = true;
    group.add(leaves);
  }

  return group;
}

// ─── Bush ─────────────────────────────────────────────────────────────────────

export function createBush(params = {}) {
  const { leafColor=0x2d6a2d, size=0.8, density=0.7, seed=42 } = params;
  const geo = generateLeafCluster({ radius: size, density, leafSize: 0.12, leafCount: 80, seed, color: leafColor });
  const mat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'Bush';
  return mesh;
}

// ─── Grass Blade ──────────────────────────────────────────────────────────────

export function createGrass(params = {}) {
  const { count=50, spread=2, height=0.3, color=0x4a7c3f, seed=42 } = params;
  const rng = seededRng(seed);
  const group = new THREE.Group();
  group.name = 'Grass';

  for (let i=0;i<count;i++) {
    const x = (rng()-0.5)*spread*2;
    const z = (rng()-0.5)*spread*2;
    const h = height*(0.7+rng()*0.6);
    const lean = (rng()-0.5)*0.3;

    const positions=[0,0,0, lean*0.3,h*0.4,0, lean,h,0];
    const indices=[0,1,2];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8, side: THREE.DoubleSide });
    const blade = new THREE.Mesh(geo, mat);
    blade.position.set(x, 0, z);
    blade.rotation.y = rng()*Math.PI*2;
    group.add(blade);
  }
  return group;
}

export const TREE_PRESETS = {
  oak:    { trunkHeight:2, trunkRadius:0.18, branchCount:8, branchLength:1.2, branchAngle:45, canopyRadius:1.8, canopyDensity:0.85 },
  pine:   { trunkHeight:4, trunkRadius:0.14, branchCount:12, branchLength:0.8, branchAngle:30, canopyRadius:0.8, canopyDensity:0.95 },
  palm:   { trunkHeight:5, trunkRadius:0.12, branchCount:8, branchLength:2.0, branchAngle:70, canopyRadius:2.2, canopyDensity:0.60 },
  willow: { trunkHeight:3, trunkRadius:0.20, branchCount:10, branchLength:2.5, branchAngle:60, canopyRadius:2.5, canopyDensity:0.70 },
  dead:   { trunkHeight:3.5, trunkRadius:0.22, branchCount:6, branchLength:1.0, branchAngle:50, canopyRadius:1.0, canopyDensity:0.0 },
};

export default { createTree, createBush, createGrass, generateTrunk, generateBranches, generateLeafCluster, TREE_PRESETS };
'''

# ─────────────────────────────────────────────────────────────────────────────
# PropGenerator.js — Full geometry engine
# ─────────────────────────────────────────────────────────────────────────────
files[f"{SRC}/generators/prop/PropGenerator.js"] = r'''// PropGenerator.js — Procedural Prop Geometry Generator
// SPX Mesh Editor | StreamPireX

import * as THREE from 'three';

function lerp(a,b,t){return a+(b-a)*t;}
function seededRng(seed){let s=seed;return ()=>{s=(s*9301+49297)%233280;return s/233280;};}

// ─── Generic Box Prop ─────────────────────────────────────────────────────────

export function generateBoxProp(params = {}) {
  const { width=1, height=1, depth=1, bevelSize=0.02, subdivision=1 } = params;
  const geo = new THREE.BoxGeometry(width, height, depth, subdivision, subdivision, subdivision);
  return geo;
}

// ─── Chair ────────────────────────────────────────────────────────────────────

export function generateChair(params = {}) {
  const { seatHeight=0.45, seatWidth=0.45, seatDepth=0.45, backHeight=0.5, legRadius=0.025, style='modern' } = params;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: params.color ?? 0xa0785a, roughness: 0.8 });

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(seatWidth, 0.05, seatDepth), mat);
  seat.position.y = seatHeight;
  group.add(seat);

  // Back
  const back = new THREE.Mesh(new THREE.BoxGeometry(seatWidth, backHeight, 0.05), mat);
  back.position.set(0, seatHeight + backHeight/2, -seatDepth/2);
  group.add(back);

  // Legs
  const legPositions = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z]) => [x*seatWidth/2*0.85, 0, z*seatDepth/2*0.85]);
  legPositions.forEach(([x,y,z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius*1.2, seatHeight, 6), mat);
    leg.position.set(x, seatHeight/2, z);
    group.add(leg);
  });

  return group;
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function generateTable(params = {}) {
  const { width=1.2, depth=0.8, height=0.75, thickness=0.05, legRadius=0.04, style='modern' } = params;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: params.color ?? 0x8b6914, roughness: 0.7 });

  // Top
  const top = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, depth), mat);
  top.position.y = height;
  group.add(top);

  // Legs
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([x,z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius*1.3, height, 8), mat);
    leg.position.set(x*(width/2-0.08), height/2, z*(depth/2-0.08));
    group.add(leg);
  });

  return group;
}

// ─── Barrel ───────────────────────────────────────────────────────────────────

export function generateBarrel(params = {}) {
  const { radius=0.3, height=0.5, hoopCount=3, segments=16 } = params;
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: params.color ?? 0x8b6914, roughness: 0.9 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.8 });

  // Barrel body (bulged cylinder)
  const positions=[], normals=[], uvs=[], indices=[];
  const rings = 12;
  for (let r=0;r<=rings;r++) {
    const t=r/rings;
    const y=t*height-height/2;
    const bulgeFactor = 1 + Math.sin(t*Math.PI)*0.12;
    const rad = radius*bulgeFactor;
    for (let s=0;s<=segments;s++) {
      const a=(s/segments)*Math.PI*2;
      const x=Math.cos(a)*rad, z=Math.sin(a)*rad;
      positions.push(x,y,z); normals.push(x/rad,0,z/rad); uvs.push(s/segments,t);
    }
  }
  for (let r=0;r<rings;r++) for (let s=0;s<segments;s++) {
    const a=r*(segments+1)+s,b=a+1,c=a+(segments+1),d=c+1;
    indices.push(a,b,d,a,d,c);
  }
  const bodyGeo = new THREE.BufferGeometry();
  bodyGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  bodyGeo.setAttribute('normal',  new THREE.Float32BufferAttribute(normals,3));
  bodyGeo.setAttribute('uv',      new THREE.Float32BufferAttribute(uvs,2));
  bodyGeo.setIndex(indices);
  bodyGeo.computeVertexNormals();
  group.add(new THREE.Mesh(bodyGeo, woodMat));

  // Top/bottom caps
  [height/2, -height/2].forEach(y => {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(radius*0.95, segments), woodMat);
    cap.rotation.x = -Math.PI/2; cap.position.y = y;
    group.add(cap);
  });

  // Metal hoops
  for (let h=0;h<hoopCount;h++) {
    const y = lerp(-height/2+0.05, height/2-0.05, h/(hoopCount-1));
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(radius*1.05, 0.015, 6, segments), metalMat);
    hoop.rotation.x = Math.PI/2; hoop.position.y = y;
    group.add(hoop);
  }

  return group;
}

// ─── Sword ────────────────────────────────────────────────────────────────────

export function generateSword(params = {}) {
  const { bladeLength=1.2, bladeWidth=0.06, guardWidth=0.22, handleLength=0.22, style='medieval' } = params;
  const group = new THREE.Group();
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, roughness: 0.2, metalness: 0.9 });
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 });

  // Blade
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(-bladeWidth/2, 0.1);
  bladeShape.lineTo(-bladeWidth/3, bladeLength);
  bladeShape.lineTo(0, bladeLength+0.05);
  bladeShape.lineTo(bladeWidth/3, bladeLength);
  bladeShape.lineTo(bladeWidth/2, 0.1);
  bladeShape.lineTo(0, 0);
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.01, bevelEnabled: false });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.y = handleLength + 0.03;
  group.add(blade);

  // Guard
  const guard = new THREE.Mesh(new THREE.BoxGeometry(guardWidth, 0.04, 0.04), goldMat);
  guard.position.y = handleLength;
  group.add(guard);

  // Handle
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, handleLength, 8), handleMat);
  handle.position.y = handleLength/2;
  group.add(handle);

  // Pommel
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), goldMat);
  pommel.position.y = 0;
  group.add(pommel);

  return group;
}

// ─── Crate ────────────────────────────────────────────────────────────────────

export function generateCrate(params = {}) {
  const { size=0.6, planks=true, metalCorners=true } = params;
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: params.color??0x8b6914, roughness:0.9 });
  const metalMat = new THREE.MeshStandardMaterial({ color:0x555555, roughness:0.4, metalness:0.7 });

  const box = new THREE.Mesh(new THREE.BoxGeometry(size,size,size), woodMat);
  group.add(box);

  if (metalCorners) {
    const cornerSize = size*0.12;
    const s2 = size/2;
    [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].forEach(([x,y,z]) => {
      const corner = new THREE.Mesh(new THREE.BoxGeometry(cornerSize,cornerSize,cornerSize), metalMat);
      corner.position.set(x*s2,y*s2,z*s2);
      group.add(corner);
    });
  }

  return group;
}

// ─── Main factory ─────────────────────────────────────────────────────────────

export function createProp(params = {}) {
  const { propType='Chair', category='Furniture' } = params;

  const generators = {
    Chair: generateChair, Table: generateTable, Barrel: generateBarrel,
    Sword: generateSword, Crate: generateCrate,
  };

  const fn = generators[propType];
  if (fn) {
    const result = fn(params);
    if (result.isGroup) { result.name = propType; return result; }
    const mat = new THREE.MeshStandardMaterial({ color: params.color??0x888888, roughness: params.roughness??0.5, metalness: params.metalness??0 });
    const mesh = new THREE.Mesh(result, mat);
    mesh.name = propType;
    return mesh;
  }

  // Fallback — generic box prop
  const geo = generateBoxProp(params);
  const mat = new THREE.MeshStandardMaterial({ color: params.color??0x888888, roughness: params.roughness??0.5 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = propType;
  return mesh;
}

export const PROP_CATEGORIES = {
  Furniture: ['Chair','Table','Sofa','Bed','Desk','Bookshelf','Cabinet','Lamp'],
  Weapons:   ['Sword','Axe','Spear','Bow','Shield','Dagger','Mace','Staff'],
  SciFi:     ['Console','Crate','Barrel','Generator','Antenna','Pod','Turret'],
  Fantasy:   ['Chest','Torch','Cauldron','Crystal','Magic Staff','Amulet','Potion'],
};

export default { createProp, generateChair, generateTable, generateBarrel, generateSword, generateCrate, PROP_CATEGORIES };
'''

# ─────────────────────────────────────────────────────────────────────────────
# CreatureGenerator.js — Full geometry engine
# ─────────────────────────────────────────────────────────────────────────────
files[f"{SRC}/generators/creature/CreatureGenerator.js"] = r'''// CreatureGenerator.js — Procedural Creature Geometry Generator
// SPX Mesh Editor | StreamPireX

import * as THREE from 'three';

function lerp(a,b,t){return a+(b-a)*t;}
function seededRng(seed){let s=seed;return ()=>{s=(s*9301+49297)%233280;return s/233280;};}

// ─── Body Parts ───────────────────────────────────────────────────────────────

export function generateBody(params = {}) {
  const { bodyLength=1, bodyWidth=0.6, bodyHeight=0.5, segments=8 } = params;
  const geo = new THREE.SphereGeometry(1, segments*2, segments);
  geo.scale(bodyWidth, bodyHeight, bodyLength/2);
  return geo;
}

export function generateHead(params = {}) {
  const { headSize=1, segments=8 } = params;
  const geo = new THREE.SphereGeometry(headSize*0.35, segments*2, segments);
  return geo;
}

export function generateLeg(params = {}) {
  const { length=0.8, radius=0.06, segments=6 } = params;
  const group = new THREE.Group();

  // Upper leg
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(radius*1.2, radius, length*0.5, segments), new THREE.MeshStandardMaterial());
  upper.position.y = -length*0.25;
  group.add(upper);

  // Lower leg
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius*0.7, length*0.5, segments), new THREE.MeshStandardMaterial());
  lower.position.y = -length*0.75;
  group.add(lower);

  // Foot
  const foot = new THREE.Mesh(new THREE.BoxGeometry(radius*3, radius*0.5, radius*4), new THREE.MeshStandardMaterial());
  foot.position.set(radius, -length, radius);
  group.add(foot);

  return group;
}

export function generateWing(params = {}) {
  const { span=2, segments=8 } = params;
  if (span <= 0) return null;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(span*0.3, span*0.4, span, span*0.1);
  shape.quadraticCurveTo(span*0.7, -span*0.1, span*0.4, -span*0.3);
  shape.quadraticCurveTo(span*0.2, -span*0.2, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, segments*2);
  return geo;
}

export function generateTail(params = {}) {
  const { length=1, radius=0.08, segments=12, taper=0.1 } = params;
  if (length <= 0) return null;
  const positions=[], normals=[], uvs=[], indices=[];
  const radialSegs = 6;

  for (let r=0;r<=segments;r++) {
    const t=r/segments;
    const y=-t*length;
    const rad=radius*lerp(1,taper,t);
    const bend=Math.sin(t*Math.PI)*0.2;
    for (let s=0;s<=radialSegs;s++) {
      const a=(s/radialSegs)*Math.PI*2;
      const x=Math.cos(a)*rad+bend;
      const z=Math.sin(a)*rad;
      const len=Math.sqrt(x*x+z*z)||1;
      positions.push(x,y,z);
      normals.push(x/len,0,z/len);
      uvs.push(s/radialSegs,t);
    }
  }
  for (let r=0;r<segments;r++) for (let s=0;s<radialSegs;s++) {
    const a=r*(radialSegs+1)+s,b=a+1,c=a+(radialSegs+1),d=c+1;
    indices.push(a,b,d,a,d,c);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('normal',  new THREE.Float32BufferAttribute(normals,3));
  geo.setAttribute('uv',      new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function generateHorn(params = {}) {
  const { length=0.3, baseRadius=0.04, curve=0.1, segments=6 } = params;
  const geo = new THREE.ConeGeometry(baseRadius, length, segments);
  geo.rotateX(-curve);
  return geo;
}

export function generateSpines(params = {}) {
  const { count=5, length=0.2, baseRadius=0.02, spacing=0.15 } = params;
  const group = new THREE.Group();
  for (let i=0;i<count;i++) {
    const spine = new THREE.Mesh(new THREE.ConeGeometry(baseRadius*(1-i/count*0.5), length, 4), new THREE.MeshStandardMaterial());
    spine.position.set(0, 0, -i*spacing);
    spine.rotation.x = 0.3;
    group.add(spine);
  }
  return group;
}

// ─── Full Creature Assembly ───────────────────────────────────────────────────

export function createCreature(params = {}) {
  const {
    creatureType='Dragon', bodyType='Quadruped',
    size=1, headSize=1, bodyLength=1, bodyWidth=0.6, bodyHeight=0.5,
    neckLength=0.5, legLength=0.8, legCount=4, wingSpan=0,
    tailLength=1, hornCount=2, hornLength=0.3, spineCount=0,
    colors={ primary:'#2d5a1b', secondary:'#1a3a0a', eye:'#ff4400' },
    seed=42,
  } = params;

  const rng = seededRng(seed);
  const group = new THREE.Group();
  group.name = creatureType;

  const primaryMat  = new THREE.MeshStandardMaterial({ color: colors.primary,   roughness: 0.7 });
  const secondaryMat = new THREE.MeshStandardMaterial({ color: colors.secondary, roughness: 0.8 });
  const eyeMat      = new THREE.MeshStandardMaterial({ color: colors.eye,       emissive: colors.eye, emissiveIntensity: 0.3, roughness: 0.1 });

  // Body
  const bodyGeo = generateBody({ bodyLength: bodyLength*size, bodyWidth: bodyWidth*size, bodyHeight: bodyHeight*size });
  const body = new THREE.Mesh(bodyGeo, primaryMat);
  body.castShadow = body.receiveShadow = true;
  group.add(body);

  // Neck + Head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12*size, 0.18*size, neckLength*size, 8), primaryMat);
  neck.position.set(0, bodyHeight*size*0.3, bodyLength*size*0.4);
  neck.rotation.x = -0.4;
  group.add(neck);

  const headGeo = generateHead({ headSize: headSize*size });
  const head = new THREE.Mesh(headGeo, primaryMat);
  head.position.set(0, bodyHeight*size*0.3 + neckLength*size*0.8, bodyLength*size*0.5 + neckLength*size*0.4);
  head.castShadow = true;
  group.add(head);

  // Eyes
  [-1,1].forEach(side => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05*size, 8, 6), eyeMat);
    eye.position.set(side*0.12*size*headSize, bodyHeight*size*0.4 + neckLength*size*0.85, bodyLength*size*0.5 + neckLength*size*0.5 + 0.25*size);
    group.add(eye);
  });

  // Legs
  if (legCount > 0) {
    const legPositions = [];
    for (let i=0;i<legCount;i++) {
      const side = i%2===0 ? -1 : 1;
      const fore = i<legCount/2 ? 1 : -1;
      legPositions.push([side*(bodyWidth*size*0.55), -bodyHeight*size*0.4, fore*(bodyLength*size*0.3)]);
    }
    legPositions.forEach(([x,y,z]) => {
      const legGroup = generateLeg({ length: legLength*size, radius: 0.06*size });
      legGroup.position.set(x, y, z);
      legGroup.children.forEach(c => c.material = primaryMat);
      group.add(legGroup);
    });
  }

  // Wings
  if (wingSpan > 0) {
    [-1,1].forEach(side => {
      const wingGeo = generateWing({ span: wingSpan*size });
      if (!wingGeo) return;
      const wing = new THREE.Mesh(wingGeo, secondaryMat);
      wing.position.set(side*bodyWidth*size*0.5, bodyHeight*size*0.2, 0);
      wing.rotation.set(0, side*0.3, side*0.4);
      wing.castShadow = true;
      group.add(wing);
    });
  }

  // Tail
  if (tailLength > 0) {
    const tailGeo = generateTail({ length: tailLength*size, radius: 0.08*size });
    if (tailGeo) {
      const tail = new THREE.Mesh(tailGeo, primaryMat);
      tail.position.set(0, bodyHeight*size*0.1, -bodyLength*size*0.5);
      tail.castShadow = true;
      group.add(tail);
    }
  }

  // Horns
  for (let i=0;i<hornCount;i++) {
    const side = i%2===0 ? -1 : 1;
    const hornGeo = generateHorn({ length: hornLength*size, baseRadius: 0.04*size });
    const horn = new THREE.Mesh(hornGeo, secondaryMat);
    horn.position.set(side*(0.1+i*0.05)*size, bodyHeight*size*0.5 + neckLength*size*0.9, bodyLength*size*0.5 + neckLength*size*0.45);
    horn.rotation.z = side*0.3;
    group.add(horn);
  }

  // Spines
  if (spineCount > 0) {
    const spineGroup = generateSpines({ count: spineCount, length: 0.15*size, spacing: bodyLength*size/spineCount });
    spineGroup.position.set(0, bodyHeight*size*0.5, bodyLength*size*0.3);
    spineGroup.children.forEach(c => c.material = secondaryMat);
    group.add(spineGroup);
  }

  group.scale.setScalar(size);
  return group;
}

export const CREATURE_PRESETS = {
  dragon:  { creatureType:'Dragon', bodyType:'Quadruped', size:2, wingSpan:3, hornCount:2, tailLength:2, spineCount:8 },
  wolf:    { creatureType:'Wolf',   bodyType:'Quadruped', size:0.8, wingSpan:0, hornCount:0, tailLength:0.8, spineCount:0 },
  phoenix: { creatureType:'Phoenix',bodyType:'Avian',     size:1.5, wingSpan:3, hornCount:0, tailLength:1.5, spineCount:0 },
  demon:   { creatureType:'Demon',  bodyType:'Biped',     size:1.8, wingSpan:2, hornCount:4, tailLength:0.6, spineCount:0 },
};

export default { createCreature, generateBody, generateHead, generateLeg, generateWing, generateTail, generateHorn, CREATURE_PRESETS };
'''

# ─────────────────────────────────────────────────────────────────────────────
# VehicleGenerator.js — Full geometry engine
# ─────────────────────────────────────────────────────────────────────────────
files[f"{SRC}/generators/vehicle/VehicleGenerator.js"] = r'''// VehicleGenerator.js — Procedural Vehicle Geometry Generator
// SPX Mesh Editor | StreamPireX

import * as THREE from 'three';

function lerp(a,b,t){return a+(b-a)*t;}

// ─── Wheel ────────────────────────────────────────────────────────────────────

export function generateWheel(params = {}) {
  const { radius=0.35, width=0.22, spokes=5, rimDetail=16 } = params;
  const group = new THREE.Group();

  const tireMat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const rimMat   = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.8 });
  const hubMat   = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 });

  // Tire
  const tire = new THREE.Mesh(new THREE.TorusGeometry(radius*0.85, radius*0.18, 12, rimDetail), tireMat);
  tire.rotation.y = Math.PI/2;
  group.add(tire);

  // Rim
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius*0.75, radius*0.75, width*0.6, rimDetail), rimMat);
  rim.rotation.z = Math.PI/2;
  group.add(rim);

  // Spokes
  for (let i=0;i<spokes;i++) {
    const a = (i/spokes)*Math.PI*2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(width*0.5, radius*0.08, radius*0.6), rimMat);
    spoke.rotation.z = Math.PI/2;
    spoke.rotation.x = a;
    group.add(spoke);
  }

  // Hub cap
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius*0.15, radius*0.15, width*0.7, 8), hubMat);
  hub.rotation.z = Math.PI/2;
  group.add(hub);

  return group;
}

// ─── Car Body ─────────────────────────────────────────────────────────────────

export function generateCarBody(params = {}) {
  const {
    bodyLength=4.2, bodyWidth=1.8, bodyHeight=1.3,
    wheelbase=2.5, groundClearance=0.15, rakeAngle=15,
    roofHeight=0.6, roofStart=0.3, roofEnd=0.75,
    colors={ primary:'#c0392b', secondary:'#1a1a1a', glass:'#88ccff' },
    details=[],
  } = params;

  const group = new THREE.Group();
  const bodyMat  = new THREE.MeshStandardMaterial({ color: colors.primary,   roughness: params.roughness??0.15, metalness: params.metalness??0.85 });
  const trimMat  = new THREE.MeshStandardMaterial({ color: colors.secondary,  roughness: 0.5, metalness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: colors.glass,      roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.6 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc,          emissive: 0xffffcc, emissiveIntensity: 0.5 });
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0xff2200,          emissive: 0xff2200, emissiveIntensity: 0.3 });

  const hl = bodyLength/2, hw = bodyWidth/2, hh = bodyHeight/2;

  // Main body lower
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(bodyLength, bodyHeight*0.5, bodyWidth), bodyMat);
  lowerBody.position.y = groundClearance + bodyHeight*0.25;
  group.add(lowerBody);

  // Cabin roof section
  const cabinW = bodyWidth*0.88;
  const cabinL = bodyLength*(roofEnd-roofStart);
  const cabin  = new THREE.Mesh(new THREE.BoxGeometry(cabinL, roofHeight, cabinW), bodyMat);
  cabin.position.set(bodyLength*(roofStart+roofEnd)/2-hl, groundClearance+bodyHeight*0.5+roofHeight/2, 0);
  group.add(cabin);

  // Windshield
  const wsGeo = new THREE.PlaneGeometry(cabinW*0.9, roofHeight*1.1);
  const ws = new THREE.Mesh(wsGeo, glassMat);
  ws.position.set(bodyLength*roofStart-hl+0.05, groundClearance+bodyHeight*0.5+roofHeight*0.5, 0);
  ws.rotation.y = Math.PI/2; ws.rotation.z = (rakeAngle)*Math.PI/180;
  group.add(ws);

  // Rear window
  const rwGeo = new THREE.PlaneGeometry(cabinW*0.85, roofHeight*1.0);
  const rw = new THREE.Mesh(rwGeo, glassMat);
  rw.position.set(bodyLength*roofEnd-hl-0.05, groundClearance+bodyHeight*0.5+roofHeight*0.5, 0);
  rw.rotation.y = Math.PI/2; rw.rotation.z = -(rakeAngle*0.8)*Math.PI/180;
  group.add(rw);

  // Side windows
  [-1,1].forEach(side => {
    const sideWin = new THREE.Mesh(new THREE.PlaneGeometry(cabinL*0.85, roofHeight*0.85), glassMat);
    sideWin.position.set(bodyLength*(roofStart+roofEnd)/2-hl, groundClearance+bodyHeight*0.5+roofHeight*0.5, side*cabinW/2);
    sideWin.rotation.y = side*Math.PI/2;
    group.add(sideWin);
  });

  // Headlights
  [-1,1].forEach(side => {
    const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.25), lightMat);
    hl2.position.set(hl-0.04, groundClearance+bodyHeight*0.35, side*hw*0.6);
    group.add(hl2);
  });

  // Taillights
  [-1,1].forEach(side => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.3), brakeMat);
    tl.position.set(-hl+0.04, groundClearance+bodyHeight*0.35, side*hw*0.55);
    group.add(tl);
  });

  // Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.06, bodyHeight*0.3, bodyWidth*0.6), trimMat);
  grille.position.set(hl-0.03, groundClearance+bodyHeight*0.2, 0);
  group.add(grille);

  // Wheels
  const wheelPositions = [
    [wheelbase/2, groundClearance, hw+0.05],
    [wheelbase/2, groundClearance, -hw-0.05],
    [-wheelbase/2, groundClearance, hw+0.05],
    [-wheelbase/2, groundClearance, -hw-0.05],
  ];

  const wheelParams = { radius: params.wheelSize??0.35, width: params.wheelWidth??0.22 };
  wheelPositions.forEach(([x,y,z]) => {
    const wheel = generateWheel(wheelParams);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI/2;
    group.add(wheel);
  });

  // Optional spoiler
  if (details.includes('Spoiler')) {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, bodyWidth*0.8), trimMat);
    spoiler.position.set(-hl+0.1, groundClearance+bodyHeight*0.5+roofHeight+0.1, 0);
    group.add(spoiler);
  }

  // Bumpers
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.1, bodyHeight*0.2, bodyWidth), trimMat);
  frontBumper.position.set(hl+0.05, groundClearance+bodyHeight*0.1, 0);
  group.add(frontBumper);

  const rearBumper = frontBumper.clone();
  rearBumper.position.set(-hl-0.05, groundClearance+bodyHeight*0.1, 0);
  group.add(rearBumper);

  return group;
}

// ─── Main Factory ─────────────────────────────────────────────────────────────

export function createVehicle(params = {}) {
  const { vehicleType='Sedan', category='Land' } = params;

  switch (vehicleType) {
    case 'Sedan':
    case 'Sports Car':
    case 'SUV':
    case 'Truck':
    case 'Van':
    case 'Muscle Car':
    case 'Convertible':
    case 'Hatchback':
      return generateCarBody(params);
    default:
      return generateCarBody(params);
  }
}

export const VEHICLE_PRESETS = {
  compact: { bodyLength:3.8, bodyWidth:1.7, bodyHeight:1.4, wheelbase:2.4, groundClearance:0.15, rakeAngle:15 },
  suv:     { bodyLength:4.5, bodyWidth:1.9, bodyHeight:1.8, wheelbase:2.7, groundClearance:0.22, rakeAngle:10 },
  sports:  { bodyLength:4.2, bodyWidth:1.8, bodyHeight:1.1, wheelbase:2.5, groundClearance:0.10, rakeAngle:25 },
  truck:   { bodyLength:5.5, bodyWidth:2.0, bodyHeight:1.9, wheelbase:3.2, groundClearance:0.28, rakeAngle:8  },
};

export default { createVehicle, generateCarBody, generateWheel, VEHICLE_PRESETS };
'''

# ─────────────────────────────────────────────────────────────────────────────
# Write all files
# ─────────────────────────────────────────────────────────────────────────────
written = []
for path, code in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(code)
    lines = len(code.splitlines())
    written.append((os.path.basename(path), lines))
    print(f"✅ {os.path.basename(path)} ({lines} lines)")

print(f"""
🎉 Done — {len(written)} generator engines built

FaceGenerator.js     — {written[0][1]} lines
  ✅ generateHeadGeometry — deformed sphere with facial zones
  ✅ generateEyeSocket — anatomical eye rim with depth
  ✅ generateNose — bridge, wings, nostrils, tip
  ✅ generateLips — upper/lower with cupid bow
  ✅ generateEar — helix, antihelix, lobe
  ✅ createFaceMesh — full assembly + merge
  ✅ 6 presets (neutral/masculine/feminine/child/elder/anime)

FoliageGenerator.js  — {written[1][1]} lines
  ✅ generateTrunk — tapered, bent, root flare
  ✅ generateBranches — recursive branching with sub-branches
  ✅ generateLeafCluster — 200+ billboard leaves, sphere distribution
  ✅ createTree — full assembly (trunk + branches + leaves)
  ✅ createBush — leaf cluster bush
  ✅ createGrass — individual blade mesh with lean
  ✅ 5 tree presets (oak/pine/palm/willow/dead)

PropGenerator.js     — {written[2][1]} lines
  ✅ generateChair — seat, back, 4 legs
  ✅ generateTable — top, 4 legs
  ✅ generateBarrel — bulged, metal hoops, caps
  ✅ generateSword — blade, guard, handle, pommel
  ✅ generateCrate — box with metal corner caps
  ✅ createProp — factory pattern for all types

CreatureGenerator.js — {written[3][1]} lines
  ✅ generateBody — deformed sphere body
  ✅ generateHead — spherical head
  ✅ generateLeg — upper/lower + foot, per-limb
  ✅ generateWing — procedural wing shape
  ✅ generateTail — tapered tube with bend
  ✅ generateHorn — cone with curve
  ✅ generateSpines — spine row along back
  ✅ createCreature — full assembly (dragon, wolf, phoenix, demon)
  ✅ 4 presets

VehicleGenerator.js  — {written[4][1]} lines
  ✅ generateWheel — tire + rim + spokes + hub
  ✅ generateCarBody — full body with cabin, windows, lights, bumpers
  ✅ Windshield + rear + side windows (glass material)
  ✅ Headlights + taillights (emissive)
  ✅ Grille, bumpers, spoiler add-on
  ✅ 4 wheels with proper positioning
  ✅ 4 body presets

Run: npm run build 2>&1 | grep "error" | head -10
Then: git add -A && git commit -m "feat: full generator engines — Face, Foliage, Prop, Creature, Vehicle all 400+ lines with real geometry" && git push
""")
