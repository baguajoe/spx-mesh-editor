#!/usr/bin/env python3
"""Fix missing exports — UVUnwrap.js, GeometryNodes.js, MocapRetarget.js, AutoRetopo.js, EnvironmentProbes.js"""
import os

BASE = "/workspaces/spx-mesh-editor/src/mesh"

# ── 1. Append missing exports to UVUnwrap.js ─────────────────────────────────
uv_append = r'''
// ─── Legacy projection exports (App.jsx compat) ───────────────────────────────

export function uvPlanarProject(geometry, axis = 'z') {
  const geo = geometry.clone();
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    if (axis === 'z')      { uvs[i*2] = pos.getX(i) * 0.5 + 0.5; uvs[i*2+1] = pos.getY(i) * 0.5 + 0.5; }
    else if (axis === 'y') { uvs[i*2] = pos.getX(i) * 0.5 + 0.5; uvs[i*2+1] = pos.getZ(i) * 0.5 + 0.5; }
    else                   { uvs[i*2] = pos.getZ(i) * 0.5 + 0.5; uvs[i*2+1] = pos.getY(i) * 0.5 + 0.5; }
  }
  geo.setAttribute('uv', new (require('three').BufferAttribute)(uvs, 2));
  return geo;
}

export function uvBoxProject(geometry) {
  const geo = geometry.clone();
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(norm.getX(i)), ny = Math.abs(norm.getY(i)), nz = Math.abs(norm.getZ(i));
    if (nx >= ny && nx >= nz)      { uvs[i*2] = pos.getZ(i)*0.5+0.5; uvs[i*2+1] = pos.getY(i)*0.5+0.5; }
    else if (ny >= nx && ny >= nz) { uvs[i*2] = pos.getX(i)*0.5+0.5; uvs[i*2+1] = pos.getZ(i)*0.5+0.5; }
    else                           { uvs[i*2] = pos.getX(i)*0.5+0.5; uvs[i*2+1] = pos.getY(i)*0.5+0.5; }
  }
  geo.setAttribute('uv', new (require('three').BufferAttribute)(uvs, 2));
  return geo;
}

export function uvSphereProject(geometry) {
  const geo = geometry.clone();
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const len = Math.sqrt(x*x + y*y + z*z) || 1;
    uvs[i*2]   = 0.5 + Math.atan2(z/len, x/len) / (2 * Math.PI);
    uvs[i*2+1] = 0.5 - Math.asin(y/len) / Math.PI;
  }
  geo.setAttribute('uv', new (require('three').BufferAttribute)(uvs, 2));
  return geo;
}
'''

# Use proper THREE import instead of require
uv_append_clean = uv_append.replace("new (require('three').BufferAttribute)", "new THREE.BufferAttribute")

uv_path = os.path.join(BASE, "UVUnwrap.js")
with open(uv_path, 'r') as f:
    content = f.read()

if 'uvPlanarProject' not in content:
    # Add THREE import reference at top if not present, then append
    if "import * as THREE" not in content:
        content = "import * as THREE from 'three';\n" + content
    content += "\n" + uv_append_clean
    with open(uv_path, 'w') as f:
        f.write(content)
    print(f"✅ UVUnwrap.js — added uvPlanarProject, uvBoxProject, uvSphereProject")
else:
    print(f"⏭  UVUnwrap.js — exports already present")

# ── 2. Append missing exports to GeometryNodes.js ────────────────────────────
geo_append = r'''
// ─── Legacy functional exports (App.jsx compat) ───────────────────────────────

export function createNode(type, params = {}, position = { x: 0, y: 0 }) {
  const graph = new GeometryNodeGraph();
  return { nodeId: graph.addNode(type, params, position), graph };
}

export function createGraph() {
  return new GeometryNodeGraph();
}

export function addNode(graph, type, params = {}, position = { x: 0, y: 0 }) {
  return graph.addNode(type, params, position);
}

export function connectNodes(graph, fromId, fromPort, toId, toPort) {
  graph.connect(fromId, fromPort, toId, toPort);
}

export function evaluateGraph(graph, rootId, inputs = {}) {
  return graph.execute(rootId, inputs);
}
'''

geo_path = os.path.join(BASE, "GeometryNodes.js")
with open(geo_path, 'r') as f:
    content = f.read()

if 'createNode' not in content:
    content += "\n" + geo_append
    with open(geo_path, 'w') as f:
        f.write(content)
    print(f"✅ GeometryNodes.js — added createNode, createGraph, addNode, connectNodes, evaluateGraph")
else:
    print(f"⏭  GeometryNodes.js — exports already present")

# ── 3. Append missing exports to MocapRetarget.js ────────────────────────────
mocap_append = r'''
// ─── Legacy functional exports (App.jsx compat) ───────────────────────────────

export const DEFAULT_BONE_MAP = MEDIAPIPE_TO_SPX;

export function retargetFrame(landmarks, retargeter) {
  if (!retargeter) return landmarks;
  retargeter.retargetMediaPipe(landmarks);
  return landmarks;
}

export function bakeRetargetedAnimation(frames, retargeter) {
  return frames.map(f => retargetFrame(f, retargeter));
}

export function fixFootSliding(frames, threshold = 0.01) {
  // Simple foot plant: if foot Y delta < threshold, clamp to prev
  return frames.map((frame, i) => {
    if (i === 0) return frame;
    return frame.map((lm, j) => {
      if (!lm) return lm;
      const prev = frames[i-1][j];
      if (!prev) return lm;
      const isAnkle = j === 27 || j === 28;
      if (isAnkle && Math.abs(lm.y - prev.y) < threshold) {
        return { ...lm, y: prev.y };
      }
      return lm;
    });
  });
}

export function autoDetectBoneMap(skeleton) {
  const map = {};
  if (!skeleton) return map;
  skeleton.bones.forEach((bone, i) => {
    const name = bone.name.toLowerCase();
    if (name.includes('leftshoulder') || name.includes('l_shoulder')) map[11] = bone.name;
    if (name.includes('rightshoulder') || name.includes('r_shoulder')) map[12] = bone.name;
    if (name.includes('leftarm') || name.includes('l_upper')) map[13] = bone.name;
    if (name.includes('rightarm') || name.includes('r_upper')) map[14] = bone.name;
    if (name.includes('leftforearm') || name.includes('l_fore')) map[15] = bone.name;
    if (name.includes('rightforearm') || name.includes('r_fore')) map[16] = bone.name;
    if (name.includes('lefthand') || name.includes('l_hand')) map[17] = bone.name;
    if (name.includes('righthand') || name.includes('r_hand')) map[18] = bone.name;
    if (name.includes('leftupleg') || name.includes('l_thigh')) map[23] = bone.name;
    if (name.includes('rightupleg') || name.includes('r_thigh')) map[24] = bone.name;
    if (name.includes('leftleg') || name.includes('l_calf')) map[25] = bone.name;
    if (name.includes('rightleg') || name.includes('r_calf')) map[26] = bone.name;
    if (name.includes('leftfoot') || name.includes('l_foot')) map[27] = bone.name;
    if (name.includes('rightfoot') || name.includes('r_foot')) map[28] = bone.name;
  });
  return map;
}

export function getRetargetStats(retargeter) {
  return retargeter?.getDebugInfo?.() ?? {};
}
'''

mocap_path = os.path.join(BASE, "MocapRetarget.js")
with open(mocap_path, 'r') as f:
    content = f.read()

if 'DEFAULT_BONE_MAP' not in content:
    content += "\n" + mocap_append
    with open(mocap_path, 'w') as f:
        f.write(content)
    print(f"✅ MocapRetarget.js — added DEFAULT_BONE_MAP, retargetFrame, bakeRetargetedAnimation, fixFootSliding, autoDetectBoneMap, getRetargetStats")
else:
    print(f"⏭  MocapRetarget.js — exports already present")

# ── 4. Append missing exports to AutoRetopo.js ───────────────────────────────
retopo_append = r'''
// ─── Legacy functional exports (App.jsx compat) ───────────────────────────────

export function quadDominantRetopo(sourceMesh, targetPolyCount = 2000) {
  return autoRetopo(sourceMesh, targetPolyCount);
}

export function detectHardEdges(geometry, angleThreshold = Math.PI / 4) {
  const { SeamManager } = require('./UVUnwrap.js');
  const sm = new SeamManager();
  sm.markSharpEdgesAsSeams(geometry, angleThreshold);
  return Array.from(sm.seams);
}

export function applySymmetryRetopo(geometry, axis = 'x') {
  const geo = geometry.clone();
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (axis === 'x' && pos.getX(i) < 0) pos.setX(i, Math.abs(pos.getX(i)));
    if (axis === 'y' && pos.getY(i) < 0) pos.setY(i, Math.abs(pos.getY(i)));
    if (axis === 'z' && pos.getZ(i) < 0) pos.setZ(i, Math.abs(pos.getZ(i)));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function getRetopoStats(geometry) {
  const pos = geometry?.attributes?.position;
  const idx = geometry?.index;
  return {
    vertices: pos?.count ?? 0,
    faces: idx ? idx.count / 3 : (pos?.count ?? 0) / 3,
    edges: idx ? idx.count / 2 : 0,
  };
}
'''

retopo_path = os.path.join(BASE, "AutoRetopo.js")
with open(retopo_path, 'r') as f:
    content = f.read()

if 'quadDominantRetopo' not in content:
    content += "\n" + retopo_append
    with open(retopo_path, 'w') as f:
        f.write(content)
    print(f"✅ AutoRetopo.js — added quadDominantRetopo, detectHardEdges, applySymmetryRetopo, getRetopoStats")
else:
    print(f"⏭  AutoRetopo.js — exports already present")

# ── 5. Append missing exports to EnvironmentProbes.js ────────────────────────
probes_append = r'''
// ─── Legacy functional exports (App.jsx compat) ───────────────────────────────

export function createReflectionProbe(scene, position, options = {}) {
  const volume = new ProbeVolume(scene, options.renderer);
  const id = volume.addProbe({ ...options, position: position.toArray?.() ?? position, type: PROBE_TYPES.REFLECTION });
  return { volume, id };
}

export function updateReflectionProbe(probeRef) {
  probeRef?.volume?.captureAll();
}

export function applyProbeToScene(probeRef, scene) {
  scene.traverse(obj => {
    if (obj.isMesh) probeRef?.volume?.applyBestProbe(obj);
  });
}

export function createIrradianceProbe(scene, position, options = {}) {
  const volume = new ProbeVolume(scene, options.renderer);
  const id = volume.addProbe({ ...options, position: position.toArray?.() ?? position, type: PROBE_TYPES.IRRADIANCE });
  return { volume, id };
}

export function applySSR(renderer, scene, camera) {
  // SSR requires post-processing pass — stub for shader pipeline integration
  console.info('[EnvironmentProbes] SSR: wire into PostProcessing.js RenderPass chain');
}

export function bakeEnvironment(probeRef, mesh) {
  probeRef?.volume?.applyBestProbe(mesh);
}

export function createProbeManager(scene, renderer) {
  return new ProbeVolume(scene, renderer);
}
'''

probes_path = os.path.join(BASE, "EnvironmentProbes.js")
with open(probes_path, 'r') as f:
    content = f.read()

if 'createReflectionProbe' not in content:
    content += "\n" + probes_append
    with open(probes_path, 'w') as f:
        f.write(content)
    print(f"✅ EnvironmentProbes.js — added createReflectionProbe, updateReflectionProbe, applyProbeToScene, createIrradianceProbe, applySSR, bakeEnvironment, createProbeManager")
else:
    print(f"⏭  EnvironmentProbes.js — exports already present")

print("\n✅ All fixes applied — run: npm run build")
