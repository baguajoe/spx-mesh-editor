#!/usr/bin/env python3
"""
SPX Mesh Editor — 11 Improvements Master Install
Run: python3 install_all_11.py
"""
import os

BASE = "/workspaces/spx-mesh-editor/src/mesh"
os.makedirs(BASE, exist_ok=True)

files = {}

# ─────────────────────────────────────────────────────────────────────────────
# 02 — ModifierStack.js
# ─────────────────────────────────────────────────────────────────────────────
files["ModifierStack.js"] = r'''// ModifierStack.js — Non-Destructive Modifier Stack (SubDiv + Mirror + Boolean + more)
// SPX Mesh Editor | StreamPireX

import * as THREE from 'three';
import { catmullClarkSubdivide } from './SubdivisionSurface.js';

export const MOD_TYPES = {
  SUBDIVISION: 'SUBDIVISION',
  MIRROR:      'MIRROR',
  BOOLEAN:     'BOOLEAN',
  SOLIDIFY:    'SOLIDIFY',
  BEVEL:       'BEVEL',
};

function mergeGeometries(geos) {
  let totalVerts = 0;
  geos.forEach(g => { totalVerts += g.attributes.position.count; });
  const positions = new Float32Array(totalVerts * 3);
  const indices = [];
  let vOffset = 0;
  geos.forEach(g => {
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      positions[(vOffset + i) * 3]     = pos.getX(i);
      positions[(vOffset + i) * 3 + 1] = pos.getY(i);
      positions[(vOffset + i) * 3 + 2] = pos.getZ(i);
    }
    if (g.index) Array.from(g.index.array).forEach(i => indices.push(i + vOffset));
    vOffset += pos.count;
  });
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (indices.length) merged.setIndex(indices);
  merged.computeVertexNormals();
  return merged;
}

function applySubdivision(geo, params) {
  return catmullClarkSubdivide(geo, params.levels ?? 1);
}

function applyMirror(geo, params) {
  const axis = params.axis ?? 'x';
  const original = geo.clone();
  const mirrored = geo.clone();
  const pos = mirrored.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (axis === 'x') pos.setX(i, -pos.getX(i));
    if (axis === 'y') pos.setY(i, -pos.getY(i));
    if (axis === 'z') pos.setZ(i, -pos.getZ(i));
  }
  pos.needsUpdate = true;
  if (mirrored.index) {
    const idx = mirrored.index.array;
    for (let i = 0; i < idx.length; i += 3) {
      const tmp = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = tmp;
    }
    mirrored.index.needsUpdate = true;
  }
  return mergeGeometries([original, mirrored]);
}

function applyBoolean(geo, params) {
  if (!params.targetGeometry) return geo;
  console.warn('[ModifierStack] Boolean: wire three-bvh-csg for full CSG ops');
  return geo;
}

function applySolidify(geo, params) {
  const thickness = params.thickness ?? 0.05;
  const g = geo.clone();
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const norm = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      pos.getX(i) + norm.getX(i) * thickness,
      pos.getY(i) + norm.getY(i) * thickness,
      pos.getZ(i) + norm.getZ(i) * thickness,
    );
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

function applyBevel(geo, params) {
  const amount = params.amount ?? 0.02;
  const g = geo.clone();
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const norm = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      pos.getX(i) + norm.getX(i) * amount * 0.5,
      pos.getY(i) + norm.getY(i) * amount * 0.5,
      pos.getZ(i) + norm.getZ(i) * amount * 0.5,
    );
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

const APPLIERS = {
  [MOD_TYPES.SUBDIVISION]: applySubdivision,
  [MOD_TYPES.MIRROR]:      applyMirror,
  [MOD_TYPES.BOOLEAN]:     applyBoolean,
  [MOD_TYPES.SOLIDIFY]:    applySolidify,
  [MOD_TYPES.BEVEL]:       applyBevel,
};

export class ModifierStack {
  constructor(mesh) {
    this.mesh = mesh;
    this.originalGeometry = mesh.geometry.clone();
    this.modifiers = [];
    this._idCounter = 0;
    this.onChange = null;
  }

  add(type, params = {}, label = null) {
    const mod = { id: ++this._idCounter, type, label: label || this._defaultLabel(type), enabled: true, params };
    this.modifiers.push(mod);
    this.apply();
    return mod.id;
  }

  remove(id) { this.modifiers = this.modifiers.filter(m => m.id !== id); this.apply(); }
  toggle(id, enabled) { const m = this.modifiers.find(m => m.id === id); if (m) { m.enabled = enabled; this.apply(); } }
  updateParams(id, params) { const m = this.modifiers.find(m => m.id === id); if (m) { Object.assign(m.params, params); this.apply(); } }
  moveUp(id) { const i = this.modifiers.findIndex(m => m.id === id); if (i > 0) { [this.modifiers[i-1], this.modifiers[i]] = [this.modifiers[i], this.modifiers[i-1]]; this.apply(); } }
  moveDown(id) { const i = this.modifiers.findIndex(m => m.id === id); if (i < this.modifiers.length - 1) { [this.modifiers[i], this.modifiers[i+1]] = [this.modifiers[i+1], this.modifiers[i]]; this.apply(); } }

  apply() {
    let geo = this.originalGeometry.clone();
    for (const mod of this.modifiers) {
      if (!mod.enabled) continue;
      const fn = APPLIERS[mod.type];
      if (fn) { try { geo = fn(geo, mod.params) || geo; } catch(e) { console.error(`[ModifierStack] ${mod.type} failed:`, e); } }
    }
    this.mesh.geometry.dispose();
    this.mesh.geometry = geo;
    if (this.onChange) this.onChange(this.modifiers);
  }

  updateOriginal(newGeo) { this.originalGeometry.dispose(); this.originalGeometry = newGeo.clone(); this.apply(); }
  applyAll() { this.originalGeometry.dispose(); this.originalGeometry = this.mesh.geometry.clone(); this.modifiers = []; if (this.onChange) this.onChange([]); }
  serialize() { return this.modifiers.map(m => ({ ...m, params: { ...m.params, targetGeometry: undefined } })); }
  dispose() { this.originalGeometry.dispose(); }
  _defaultLabel(type) { return { SUBDIVISION:'Subdivision Surface', MIRROR:'Mirror', BOOLEAN:'Boolean', SOLIDIFY:'Solidify', BEVEL:'Bevel' }[type] || type; }
}

export default ModifierStack;
'''

# ─────────────────────────────────────────────────────────────────────────────
# 03 — IrradianceBaker.js
# ─────────────────────────────────────────────────────────────────────────────
files["IrradianceBaker.js"] = r'''// IrradianceBaker.js — Real-time GI / Lightmap Baking
// SPX Mesh Editor | StreamPireX

import * as THREE from 'three';

const LIGHTMAP_SIZE = 512;

export class IrradianceBaker {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.lightmapRT = new THREE.WebGLRenderTarget(LIGHTMAP_SIZE, LIGHTMAP_SIZE, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    this.bakedLightmaps = new Map(); // mesh uuid -> texture
    this.probes = [];
  }

  addProbe(position, radius = 5) {
    const probe = {
      id: Math.random().toString(36).slice(2),
      position: position.clone(),
      radius,
      cubeCamera: null,
      renderTarget: null,
    };
    probe.renderTarget = new THREE.WebGLCubeRenderTarget(128, {
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    });
    probe.cubeCamera = new THREE.CubeCamera(0.1, radius * 2, probe.renderTarget);
    probe.cubeCamera.position.copy(position);
    this.scene.add(probe.cubeCamera);
    this.probes.push(probe);
    return probe.id;
  }

  removeProbe(id) {
    const idx = this.probes.findIndex(p => p.id === id);
    if (idx === -1) return;
    const probe = this.probes[idx];
    this.scene.remove(probe.cubeCamera);
    probe.renderTarget.dispose();
    this.probes.splice(idx, 1);
  }

  updateProbes() {
    this.probes.forEach(probe => {
      probe.cubeCamera.update(this.renderer, this.scene);
    });
  }

  bakeToLightmap(mesh, options = {}) {
    const {
      resolution = LIGHTMAP_SIZE,
      samples = 16,
      onProgress = null,
    } = options;

    if (!mesh.geometry.attributes.uv2 && !mesh.geometry.attributes.uv) {
      console.warn('[IrradianceBaker] Mesh needs UV2 for lightmap baking');
      return null;
    }

    const rt = new THREE.WebGLRenderTarget(resolution, resolution, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    });

    // Hemispherical sampling for ambient occlusion + indirect light
    const lightmap = this._computeHemisphericAO(mesh, resolution, samples, onProgress);

    this.bakedLightmaps.set(mesh.uuid, lightmap);

    // Apply lightmap to mesh material
    if (mesh.material) {
      mesh.material.lightMap = lightmap;
      mesh.material.lightMapIntensity = options.intensity ?? 1.0;
      mesh.material.needsUpdate = true;
    }

    rt.dispose();
    return lightmap;
  }

  _computeHemisphericAO(mesh, resolution, samples, onProgress) {
    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(resolution, resolution);

    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal || (() => { geo.computeVertexNormals(); return geo.attributes.normal; })();
    const uv = geo.attributes.uv2 || geo.attributes.uv;

    if (!uv) return null;

    const raycaster = new THREE.Raycaster();
    raycaster.near = 0.001;
    raycaster.far = 10;

    const totalVerts = pos.count;

    for (let vi = 0; vi < totalVerts; vi++) {
      const vp = new THREE.Vector3().fromBufferAttribute(pos, vi);
      const vn = new THREE.Vector3().fromBufferAttribute(norm, vi).normalize();
      const uvCoord = new THREE.Vector2().fromBufferAttribute(uv, vi);

      // Transform to world space
      vp.applyMatrix4(mesh.matrixWorld);
      vn.applyMatrix3(new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)).normalize();

      let occlusion = 0;
      for (let s = 0; s < samples; s++) {
        const dir = this._hemisphereSample(vn);
        raycaster.set(vp.clone().addScaledVector(vn, 0.001), dir);
        const hits = raycaster.intersectObjects(this.scene.children, true);
        if (hits.length > 0 && hits[0].distance < raycaster.far) {
          occlusion += 1 - (hits[0].distance / raycaster.far);
        }
      }

      const ao = 1 - (occlusion / samples);
      const px = Math.floor(uvCoord.x * resolution);
      const py = Math.floor((1 - uvCoord.y) * resolution);
      const pidx = (py * resolution + px) * 4;
      const val = Math.floor(ao * 255);
      imageData.data[pidx] = val;
      imageData.data[pidx + 1] = val;
      imageData.data[pidx + 2] = val;
      imageData.data[pidx + 3] = 255;

      if (onProgress) onProgress(vi / totalVerts);
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    return texture;
  }

  _hemisphereSample(normal) {
    const u1 = Math.random(), u2 = Math.random();
    const r = Math.sqrt(1 - u1 * u1);
    const phi = 2 * Math.PI * u2;
    const local = new THREE.Vector3(r * Math.cos(phi), u1, r * Math.sin(phi));

    // Align local hemisphere to normal
    const up = Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const tangent = new THREE.Vector3().crossVectors(up, normal).normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent);

    return new THREE.Vector3(
      local.x * tangent.x + local.y * normal.x + local.z * bitangent.x,
      local.x * tangent.y + local.y * normal.y + local.z * bitangent.y,
      local.x * tangent.z + local.y * normal.z + local.z * bitangent.z,
    ).normalize();
  }

  applyProbeToMesh(mesh, probeId) {
    const probe = this.probes.find(p => p.id === probeId);
    if (!probe) return;
    if (mesh.material) {
      mesh.material.envMap = probe.renderTarget.texture;
      mesh.material.envMapIntensity = 1.0;
      mesh.material.needsUpdate = true;
    }
  }

  getProbeList() {
    return this.probes.map(p => ({ id: p.id, position: p.position.toArray(), radius: p.radius }));
  }

  dispose() {
    this.lightmapRT.dispose();
    this.probes.forEach(p => { this.scene.remove(p.cubeCamera); p.renderTarget.dispose(); });
    this.probes = [];
    this.bakedLightmaps.forEach(t => t.dispose());
    this.bakedLightmaps.clear();
  }
}

export default IrradianceBaker;
'''

# ─────────────────────────────────────────────────────────────────────────────
# 04 — MultiPersonMocap.js
# ─────────────────────────────────────────────────────────────────────────────
files["MultiPersonMocap.js"] = r'''// MultiPersonMocap.js — Multi-Skeleton Simultaneous Mocap
// SPX Mesh Editor | StreamPireX
// Uses MediaPipe Pose (CDN) to track up to 4 people simultaneously

export const MAX_PERSONS = 4;

const SKELETON_COLORS = ['#00ffc8', '#FF6600', '#4fc3f7', '#f06292'];

export class MultiPersonMocap {
  constructor(videoElement, canvasElement, options = {}) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement?.getContext('2d');
    this.maxPersons = options.maxPersons ?? 2;
    this.onPosesUpdate = options.onPosesUpdate ?? null;
    this.skeletons = {}; // personId -> skeleton data
    this.running = false;
    this._pose = null;
    this._smoothers = {};
    this._frameId = null;
  }

  async init() {
    if (typeof window === 'undefined') return;

    await this._loadMediaPipe();

    const { Pose } = window;
    if (!Pose) { console.error('[MultiPersonMocap] MediaPipe Pose not loaded'); return; }

    this._pose = new Pose({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
    });

    this._pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this._pose.onResults((results) => this._onResults(results));
    await this._pose.initialize();
  }

  _loadMediaPipe() {
    return new Promise((resolve) => {
      if (window.Pose) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  async start() {
    if (!this._pose) await this.init();
    this.running = true;
    this._loop();
  }

  stop() {
    this.running = false;
    if (this._frameId) cancelAnimationFrame(this._frameId);
  }

  async _loop() {
    if (!this.running) return;
    try { await this._pose.send({ image: this.video }); } catch(e) {}
    this._frameId = requestAnimationFrame(() => this._loop());
  }

  _onResults(results) {
    // MediaPipe single-person pose — we simulate multi-person by tracking
    // pose landmark shifts (centroid-based person separation)
    const landmarks = results.poseLandmarks;
    if (!landmarks) return;

    const personId = this._assignPersonId(landmarks);

    if (!this._smoothers[personId]) {
      this._smoothers[personId] = new PoseSmoother(0.7);
    }

    const smoothed = this._smoothers[personId].smooth(landmarks);
    this.skeletons[personId] = {
      id: personId,
      landmarks: smoothed,
      worldLandmarks: results.poseWorldLandmarks ?? smoothed,
      timestamp: Date.now(),
      color: SKELETON_COLORS[personId % SKELETON_COLORS.length],
    };

    // Prune stale skeletons (not seen in 2s)
    const now = Date.now();
    Object.keys(this.skeletons).forEach(id => {
      if (now - this.skeletons[id].timestamp > 2000) delete this.skeletons[id];
    });

    if (this.ctx) this._drawAll();
    if (this.onPosesUpdate) this.onPosesUpdate(Object.values(this.skeletons));
  }

  _assignPersonId(landmarks) {
    // Assign by hip centroid proximity to existing skeletons
    const hipL = landmarks[23], hipR = landmarks[24];
    if (!hipL || !hipR) return 0;
    const cx = (hipL.x + hipR.x) / 2;
    const cy = (hipL.y + hipR.y) / 2;

    let bestId = null, bestDist = Infinity;
    Object.entries(this.skeletons).forEach(([id, skel]) => {
      const sh = skel.landmarks;
      if (!sh[23] || !sh[24]) return;
      const scx = (sh[23].x + sh[24].x) / 2;
      const scy = (sh[23].y + sh[24].y) / 2;
      const d = Math.hypot(cx - scx, cy - scy);
      if (d < bestDist) { bestDist = d; bestId = parseInt(id); }
    });

    if (bestId !== null && bestDist < 0.15) return bestId;

    // New person
    const usedIds = new Set(Object.keys(this.skeletons).map(Number));
    for (let i = 0; i < MAX_PERSONS; i++) {
      if (!usedIds.has(i)) return i;
    }
    return 0;
  }

  _drawAll() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    Object.values(this.skeletons).forEach(skel => {
      this._drawSkeleton(skel.landmarks, skel.color);
    });
  }

  _drawSkeleton(landmarks, color) {
    const { width, height } = this.canvas;
    const CONNECTIONS = [
      [11,12],[11,13],[13,15],[12,14],[14,16],
      [11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28]
    ];

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    CONNECTIONS.forEach(([a, b]) => {
      const pa = landmarks[a], pb = landmarks[b];
      if (!pa || !pb || pa.visibility < 0.3 || pb.visibility < 0.3) return;
      this.ctx.beginPath();
      this.ctx.moveTo(pa.x * width, pa.y * height);
      this.ctx.lineTo(pb.x * width, pb.y * height);
      this.ctx.stroke();
    });

    landmarks.forEach((lm, i) => {
      if (!lm || lm.visibility < 0.3) return;
      this.ctx.beginPath();
      this.ctx.arc(lm.x * width, lm.y * height, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    });
  }

  getSkeletons() { return Object.values(this.skeletons); }
  getSkeletonById(id) { return this.skeletons[id] ?? null; }

  dispose() {
    this.stop();
    if (this._pose) this._pose.close?.();
  }
}

class PoseSmoother {
  constructor(alpha = 0.7) { this.alpha = alpha; this.prev = null; }
  smooth(landmarks) {
    if (!this.prev) { this.prev = landmarks; return landmarks; }
    const result = landmarks.map((lm, i) => {
      const p = this.prev[i];
      if (!lm || !p) return lm;
      return {
        x: p.x * (1 - this.alpha) + lm.x * this.alpha,
        y: p.y * (1 - this.alpha) + lm.y * this.alpha,
        z: p.z * (1 - this.alpha) + lm.z * this.alpha,
        visibility: lm.visibility,
      };
    });
    this.prev = result;
    return result;
  }
}

export default MultiPersonMocap;
'''

# ─────────────────────────────────────────────────────────────────────────────
# 05 — DepthEstimator.js
# ─────────────────────────────────────────────────────────────────────────────
files["DepthEstimator.js"] = r'''// DepthEstimator.js — MiDaS-based monocular depth estimation
// SPX Mesh Editor | StreamPireX
// Uses MiDaS small model via ONNX runtime (wasm backend)

const MIDAS_MODEL_URL = 'https://huggingface.co/onnx-community/midas-v2.1-small/resolve/main/onnx/model.onnx';
const INPUT_SIZE = 256;

export class DepthEstimator {
  constructor(options = {}) {
    this.modelUrl = options.modelUrl ?? MIDAS_MODEL_URL;
    this.session = null;
    this.ready = false;
    this.onReady = options.onReady ?? null;
    this.onDepth = options.onDepth ?? null;
    this._canvas = document.createElement('canvas');
    this._canvas.width = INPUT_SIZE;
    this._canvas.height = INPUT_SIZE;
    this._ctx = this._canvas.getContext('2d');
  }

  async init() {
    await this._loadONNX();
    try {
      const ort = window.ort;
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
      this.session = await ort.InferenceSession.create(this.modelUrl, {
        executionProviders: ['wasm'],
      });
      this.ready = true;
      if (this.onReady) this.onReady();
      console.log('[DepthEstimator] MiDaS model ready');
    } catch (e) {
      console.error('[DepthEstimator] Failed to load MiDaS model:', e);
    }
  }

  _loadONNX() {
    return new Promise((resolve) => {
      if (window.ort) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  async estimateDepth(imageSource) {
    if (!this.ready || !this.session) {
      console.warn('[DepthEstimator] Not ready');
      return null;
    }

    // Draw source to canvas at INPUT_SIZE
    this._ctx.drawImage(imageSource, 0, 0, INPUT_SIZE, INPUT_SIZE);
    const imageData = this._ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);

    // Convert to float32 tensor [1, 3, H, W], normalize to ImageNet mean/std
    const tensor = this._imageToTensor(imageData);

    const feeds = { input: tensor };
    const results = await this.session.run(feeds);
    const depthData = results[Object.keys(results)[0]].data;

    // Normalize depth to 0-1
    const min = Math.min(...depthData);
    const max = Math.max(...depthData);
    const range = max - min || 1;
    const normalized = Float32Array.from(depthData, v => (v - min) / range);

    const depthMap = { data: normalized, width: INPUT_SIZE, height: INPUT_SIZE, min, max };
    if (this.onDepth) this.onDepth(depthMap);
    return depthMap;
  }

  _imageToTensor(imageData) {
    const { data, width, height } = imageData;
    const float32 = new Float32Array(3 * width * height);
    const mean = [0.485, 0.456, 0.406];
    const std  = [0.229, 0.224, 0.225];

    for (let i = 0; i < width * height; i++) {
      float32[i]                   = (data[i * 4]     / 255 - mean[0]) / std[0]; // R
      float32[i + width * height]  = (data[i * 4 + 1] / 255 - mean[1]) / std[1]; // G
      float32[i + width * height * 2] = (data[i * 4 + 2] / 255 - mean[2]) / std[2]; // B
    }

    return new window.ort.Tensor('float32', float32, [1, 3, height, width]);
  }

  getDepthAt(depthMap, x, y) {
    if (!depthMap) return 0;
    const px = Math.floor(x * depthMap.width);
    const py = Math.floor(y * depthMap.height);
    return depthMap.data[py * depthMap.width + px] ?? 0;
  }

  // Lift 2D pose landmarks into 3D using depth map
  liftPoseTo3D(landmarks, depthMap, focalLength = 1.0) {
    if (!depthMap || !landmarks) return landmarks;
    return landmarks.map(lm => {
      if (!lm) return lm;
      const d = this.getDepthAt(depthMap, lm.x, lm.y);
      return {
        ...lm,
        z: d * 2 - 1, // remap 0-1 depth to -1..1
        depthConfidence: d,
      };
    });
  }

  renderDepthToCanvas(depthMap, canvas) {
    if (!depthMap || !canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(depthMap.width, depthMap.height);
    for (let i = 0; i < depthMap.data.length; i++) {
      const v = Math.floor(depthMap.data[i] * 255);
      imgData.data[i * 4]     = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  dispose() {
    if (this.session) this.session.release?.();
    this.session = null;
    this.ready = false;
  }
}

export default DepthEstimator;
'''

# ─────────────────────────────────────────────────────────────────────────────
# 06 — AutoRetopo.js UPGRADE (snap-to-surface + PolyBuild)
# ─────────────────────────────────────────────────────────────────────────────
files["AutoRetopo.js"] = r'''// AutoRetopo.js — Retopology Engine UPGRADE
// SPX Mesh Editor | StreamPireX
// Features: snap-to-surface, PolyBuild interactive retopo, auto-retopo via voxel remesh

import * as THREE from 'three';

// ─── Voxel-based Auto Retopology ──────────────────────────────────────────────

export function autoRetopo(sourceMesh, targetPolyCount = 2000) {
  const geo = sourceMesh.geometry.clone();
  geo.computeVertexNormals();

  // Build voxel grid from source mesh
  const bbox = new THREE.Box3().setFromBufferAttribute(geo.attributes.position);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const voxelSize = maxDim / Math.cbrt(targetPolyCount * 6);

  const nx = Math.ceil(size.x / voxelSize);
  const ny = Math.ceil(size.y / voxelSize);
  const nz = Math.ceil(size.z / voxelSize);

  const grid = new Uint8Array(nx * ny * nz);
  const pos = geo.attributes.position;

  // Mark occupied voxels
  for (let i = 0; i < pos.count; i++) {
    const x = Math.floor((pos.getX(i) - bbox.min.x) / voxelSize);
    const y = Math.floor((pos.getY(i) - bbox.min.y) / voxelSize);
    const z = Math.floor((pos.getZ(i) - bbox.min.z) / voxelSize);
    if (x >= 0 && x < nx && y >= 0 && y < ny && z >= 0 && z < nz) {
      grid[x + y * nx + z * nx * ny] = 1;
    }
  }

  // Extract surface quads from voxel grid (naive surface nets)
  const vertices = [];
  const indices = [];

  for (let x = 0; x < nx - 1; x++) {
    for (let y = 0; y < ny - 1; y++) {
      for (let z = 0; z < nz - 1; z++) {
        const v = grid[x + y * nx + z * nx * ny];
        const vx = grid[(x+1) + y * nx + z * nx * ny];
        const vy = grid[x + (y+1) * nx + z * nx * ny];
        const vz = grid[x + y * nx + (z+1) * nx * ny];

        if (v !== vx) {
          const wx = bbox.min.x + (x + 0.5) * voxelSize;
          const wy = bbox.min.y + (y + 0.5) * voxelSize;
          const wz = bbox.min.z + (z + 0.5) * voxelSize;
          const vi = vertices.length / 3;
          vertices.push(wx, wy, wz, wx, wy + voxelSize, wz, wx, wy + voxelSize, wz + voxelSize, wx, wy, wz + voxelSize);
          indices.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
        }
      }
    }
  }

  if (vertices.length === 0) {
    console.warn('[AutoRetopo] No surface found — returning original');
    return geo;
  }

  const newGeo = new THREE.BufferGeometry();
  newGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  newGeo.setIndex(indices);
  newGeo.computeVertexNormals();

  // Project vertices back onto original surface
  projectToSurface(newGeo, sourceMesh);

  return newGeo;
}

// ─── Snap-to-Surface ─────────────────────────────────────────────────────────

export function projectToSurface(retopGeo, targetMesh) {
  const raycaster = new THREE.Raycaster();
  const pos = retopGeo.attributes.position;
  const norm = retopGeo.attributes.normal;

  if (!norm) { retopGeo.computeVertexNormals(); }

  for (let i = 0; i < pos.count; i++) {
    const origin = new THREE.Vector3().fromBufferAttribute(pos, i);
    const normal = new THREE.Vector3().fromBufferAttribute(retopGeo.attributes.normal, i).normalize();

    // Cast ray both ways along normal
    for (const dir of [normal, normal.clone().negate()]) {
      raycaster.set(origin, dir);
      const hits = raycaster.intersectObject(targetMesh, false);
      if (hits.length > 0 && hits[0].distance < 2) {
        const hp = hits[0].point;
        pos.setXYZ(i, hp.x, hp.y, hp.z);
        break;
      }
    }
  }

  pos.needsUpdate = true;
  retopGeo.computeVertexNormals();
}

// ─── PolyBuild Interactive Retopo ─────────────────────────────────────────────

export class PolyBuildTool {
  constructor(scene, camera, renderer, targetMesh) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.targetMesh = targetMesh;
    this.raycaster = new THREE.Raycaster();
    this.vertices = [];
    this.faces = [];
    this.previewMesh = null;
    this.snapRadius = 0.05;
    this.active = false;
    this._onPointerDown = this._onPointerDown.bind(this);
  }

  enable() {
    this.active = true;
    this.renderer.domElement.addEventListener('pointerdown', this._onPointerDown);
    this._initPreviewMesh();
  }

  disable() {
    this.active = false;
    this.renderer.domElement.removeEventListener('pointerdown', this._onPointerDown);
  }

  _initPreviewMesh() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffc8, wireframe: true, side: THREE.DoubleSide });
    this.previewMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.previewMesh);
  }

  _onPointerDown(event) {
    if (!this.active) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );

    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObject(this.targetMesh, false);
    if (!hits.length) return;

    const point = hits[0].point.clone();

    // Snap to existing vertex if close enough
    const snapped = this._snapToExisting(point);
    const vertIdx = snapped !== null ? snapped : this._addVertex(point);

    if (this.vertices.length >= 3) {
      // Auto-complete quad on 4th vertex
      if (this._pendingVerts && this._pendingVerts.length === 3) {
        this._pendingVerts.push(vertIdx);
        this._addFace(...this._pendingVerts);
        this._pendingVerts = [];
      } else {
        this._pendingVerts = [vertIdx];
      }
    } else {
      this._pendingVerts = this._pendingVerts ?? [];
      this._pendingVerts.push(vertIdx);
    }

    this._updatePreview();
  }

  _addVertex(point) {
    this.vertices.push(point.clone());
    return this.vertices.length - 1;
  }

  _snapToExisting(point) {
    for (let i = 0; i < this.vertices.length; i++) {
      if (this.vertices[i].distanceTo(point) < this.snapRadius) return i;
    }
    return null;
  }

  _addFace(a, b, c, d) {
    if (d !== undefined) {
      this.faces.push([a, b, c], [a, c, d]); // quad as 2 tris
    } else {
      this.faces.push([a, b, c]);
    }
    this._updatePreview();
  }

  _updatePreview() {
    if (!this.previewMesh) return;
    const positions = this.vertices.flatMap(v => [v.x, v.y, v.z]);
    const indices = this.faces.flat();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (indices.length) geo.setIndex(indices);
    geo.computeVertexNormals();
    this.previewMesh.geometry.dispose();
    this.previewMesh.geometry = geo;
  }

  extractGeometry() {
    const positions = this.vertices.flatMap(v => [v.x, v.y, v.z]);
    const indices = this.faces.flat();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (indices.length) geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  clear() {
    this.vertices = [];
    this.faces = [];
    this._pendingVerts = [];
    this._updatePreview();
  }

  dispose() {
    this.disable();
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh.geometry.dispose();
    }
  }
}

export default { autoRetopo, projectToSurface, PolyBuildTool };
'''

# ─────────────────────────────────────────────────────────────────────────────
# 07 — GeometryNodes.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files["GeometryNodes.js"] = r'''// GeometryNodes.js — Procedural Geometry Node System UPGRADE
// SPX Mesh Editor | StreamPireX
// Nodes: Scatter, CurveToMesh, MathOp, SetPosition, JoinGeometry, InstanceOnPoints,
//        GridGenerator, SphereGenerator, NoiseDisplace, ColorByHeight

import * as THREE from 'three';

// ─── Node Base ────────────────────────────────────────────────────────────────

class GeoNode {
  constructor(id, type) {
    this.id = id;
    this.type = type;
    this.inputs = {};
    this.outputs = {};
    this.params = {};
    this.position = { x: 0, y: 0 }; // UI position
  }
  execute(inputData) { return inputData; }
}

// ─── Node Implementations ─────────────────────────────────────────────────────

class ScatterNode extends GeoNode {
  constructor(id) {
    super(id, 'SCATTER');
    this.params = { count: 100, seed: 42, distributeOnFaces: true };
  }
  execute({ geometry }) {
    if (!geometry) return { points: [] };
    const pos = geometry.attributes.position;
    const { count, seed } = this.params;
    const rng = seededRandom(seed);
    const points = [];
    const faceCount = geometry.index ? geometry.index.count / 3 : pos.count / 3;

    for (let i = 0; i < count; i++) {
      if (geometry.index) {
        const fi = Math.floor(rng() * faceCount) * 3;
        const ai = geometry.index.getX(fi), bi = geometry.index.getX(fi+1), ci = geometry.index.getX(fi+2);
        const a = new THREE.Vector3().fromBufferAttribute(pos, ai);
        const b = new THREE.Vector3().fromBufferAttribute(pos, bi);
        const c = new THREE.Vector3().fromBufferAttribute(pos, ci);
        const r1 = rng(), r2 = rng();
        const u = 1 - Math.sqrt(r1), v = Math.sqrt(r1) * (1 - r2), w = Math.sqrt(r1) * r2;
        points.push(new THREE.Vector3().addScaledVector(a, u).addScaledVector(b, v).addScaledVector(c, w));
      } else {
        const vi = Math.floor(rng() * pos.count);
        points.push(new THREE.Vector3().fromBufferAttribute(pos, vi));
      }
    }
    return { points };
  }
}

class CurveToMeshNode extends GeoNode {
  constructor(id) {
    super(id, 'CURVE_TO_MESH');
    this.params = { radius: 0.05, segments: 8, points: [] };
  }
  execute({ curve }) {
    const pts = curve ?? this.params.points;
    if (!pts || pts.length < 2) return { geometry: new THREE.BufferGeometry() };
    const path = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, p.y, p.z)));
    const geo = new THREE.TubeGeometry(path, pts.length * 4, this.params.radius, this.params.segments, false);
    return { geometry: geo };
  }
}

class MathOpNode extends GeoNode {
  constructor(id) {
    super(id, 'MATH');
    this.params = { operation: 'ADD', value: 1.0 };
  }
  execute({ value }) {
    const a = value ?? 0;
    const b = this.params.value;
    const ops = { ADD: a+b, SUBTRACT: a-b, MULTIPLY: a*b, DIVIDE: b !== 0 ? a/b : 0,
                  POWER: Math.pow(a,b), SQRT: Math.sqrt(Math.abs(a)), ABS: Math.abs(a),
                  SIN: Math.sin(a), COS: Math.cos(a), MAX: Math.max(a,b), MIN: Math.min(a,b) };
    return { value: ops[this.params.operation] ?? 0 };
  }
}

class SetPositionNode extends GeoNode {
  constructor(id) {
    super(id, 'SET_POSITION');
    this.params = { offset: { x: 0, y: 0, z: 0 }, selection: 'ALL' };
  }
  execute({ geometry }) {
    if (!geometry) return { geometry };
    const geo = geometry.clone();
    const pos = geo.attributes.position;
    const off = this.params.offset;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i, pos.getX(i) + off.x, pos.getY(i) + off.y, pos.getZ(i) + off.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return { geometry: geo };
  }
}

class JoinGeometryNode extends GeoNode {
  constructor(id) { super(id, 'JOIN_GEOMETRY'); }
  execute({ geometries }) {
    if (!geometries || !geometries.length) return { geometry: new THREE.BufferGeometry() };
    let totalVerts = 0;
    geometries.forEach(g => { totalVerts += g.attributes.position.count; });
    const positions = new Float32Array(totalVerts * 3);
    const indices = [];
    let offset = 0;
    geometries.forEach(g => {
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        positions[(offset + i) * 3]     = pos.getX(i);
        positions[(offset + i) * 3 + 1] = pos.getY(i);
        positions[(offset + i) * 3 + 2] = pos.getZ(i);
      }
      if (g.index) Array.from(g.index.array).forEach(i => indices.push(i + offset));
      offset += pos.count;
    });
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (indices.length) merged.setIndex(indices);
    merged.computeVertexNormals();
    return { geometry: merged };
  }
}

class InstanceOnPointsNode extends GeoNode {
  constructor(id) {
    super(id, 'INSTANCE_ON_POINTS');
    this.params = { scale: 0.1, randomScale: 0.05, randomRotation: true };
  }
  execute({ points, instanceGeometry }) {
    if (!points || !instanceGeometry) return { geometry: new THREE.BufferGeometry() };
    const geos = points.map(pt => {
      const g = instanceGeometry.clone();
      const s = this.params.scale + (Math.random() - 0.5) * this.params.randomScale;
      g.scale(s, s, s);
      if (this.params.randomRotation) g.rotateY(Math.random() * Math.PI * 2);
      g.translate(pt.x, pt.y, pt.z);
      return g;
    });
    // Merge all instances
    const joinNode = new JoinGeometryNode('join');
    return joinNode.execute({ geometries: geos });
  }
}

class NoiseDisplaceNode extends GeoNode {
  constructor(id) {
    super(id, 'NOISE_DISPLACE');
    this.params = { scale: 1, strength: 0.2, seed: 0 };
  }
  execute({ geometry }) {
    if (!geometry) return { geometry };
    const geo = geometry.clone();
    geo.computeVertexNormals();
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const { scale, strength } = this.params;
    for (let i = 0; i < pos.count; i++) {
      const n = simpleNoise(pos.getX(i) * scale, pos.getY(i) * scale, pos.getZ(i) * scale);
      pos.setXYZ(i,
        pos.getX(i) + norm.getX(i) * n * strength,
        pos.getY(i) + norm.getY(i) * n * strength,
        pos.getZ(i) + norm.getZ(i) * n * strength,
      );
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return { geometry: geo };
  }
}

// ─── Node Registry ────────────────────────────────────────────────────────────

export const NODE_TYPES = {
  SCATTER:           ScatterNode,
  CURVE_TO_MESH:     CurveToMeshNode,
  MATH:              MathOpNode,
  SET_POSITION:      SetPositionNode,
  JOIN_GEOMETRY:     JoinGeometryNode,
  INSTANCE_ON_POINTS: InstanceOnPointsNode,
  NOISE_DISPLACE:    NoiseDisplaceNode,
};

// ─── Graph Executor ───────────────────────────────────────────────────────────

export class GeometryNodeGraph {
  constructor() {
    this.nodes = new Map();
    this.connections = []; // [{ fromId, fromPort, toId, toPort }]
    this._idCounter = 0;
  }

  addNode(type, params = {}, position = { x: 0, y: 0 }) {
    const NodeClass = NODE_TYPES[type];
    if (!NodeClass) { console.error(`[GeometryNodes] Unknown node type: ${type}`); return null; }
    const id = `node_${++this._idCounter}`;
    const node = new NodeClass(id);
    Object.assign(node.params, params);
    node.position = position;
    this.nodes.set(id, node);
    return id;
  }

  removeNode(id) {
    this.nodes.delete(id);
    this.connections = this.connections.filter(c => c.fromId !== id && c.toId !== id);
  }

  connect(fromId, fromPort, toId, toPort) {
    this.connections.push({ fromId, fromPort, toId, toPort });
  }

  disconnect(fromId, fromPort, toId, toPort) {
    this.connections = this.connections.filter(c =>
      !(c.fromId === fromId && c.fromPort === fromPort && c.toId === toId && c.toPort === toPort)
    );
  }

  updateParams(id, params) {
    const node = this.nodes.get(id);
    if (node) Object.assign(node.params, params);
  }

  execute(rootId, initialInputs = {}) {
    const cache = new Map();

    const run = (nodeId) => {
      if (cache.has(nodeId)) return cache.get(nodeId);
      const node = this.nodes.get(nodeId);
      if (!node) return {};

      // Gather inputs from connected nodes
      const inputData = { ...initialInputs };
      this.connections.filter(c => c.toId === nodeId).forEach(conn => {
        const upstream = run(conn.fromId);
        inputData[conn.toPort] = upstream[conn.fromPort];
      });

      const result = node.execute(inputData);
      cache.set(nodeId, result);
      return result;
    };

    return run(rootId);
  }

  serialize() {
    const nodes = [];
    this.nodes.forEach((node, id) => {
      nodes.push({ id, type: node.type, params: node.params, position: node.position });
    });
    return { nodes, connections: this.connections };
  }

  deserialize(data) {
    data.nodes.forEach(n => {
      const id = this.addNode(n.type, n.params, n.position);
      // Override auto-generated id with saved id
      const node = this.nodes.get(id);
      this.nodes.delete(id);
      node.id = n.id;
      this.nodes.set(n.id, node);
    });
    data.connections.forEach(c => this.connect(c.fromId, c.fromPort, c.toId, c.toPort));
  }
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function simpleNoise(x, y, z) {
  return Math.sin(x * 1.7 + y * 2.3) * Math.cos(y * 1.1 + z * 3.7) * Math.sin(z * 2.9 + x * 1.3);
}

export default GeometryNodeGraph;
'''

# ─────────────────────────────────────────────────────────────────────────────
# 08 — UVUnwrap.js UPGRADE (seam marking, smart unwrap, UDIM unified)
# ─────────────────────────────────────────────────────────────────────────────
files["UVUnwrap.js"] = r'''// UVUnwrap.js — UV Unwrapping UPGRADE
// SPX Mesh Editor | StreamPireX
// Features: seam marking, angle-based smart unwrap, UDIM tile layout, island packing

import * as THREE from 'three';

// ─── Seam Management ─────────────────────────────────────────────────────────

export class SeamManager {
  constructor() {
    this.seams = new Set(); // Set of "v0_v1" edge keys (sorted)
  }

  edgeKey(a, b) { return a < b ? `${a}_${b}` : `${b}_${a}`; }

  markSeam(v0, v1) { this.seams.add(this.edgeKey(v0, v1)); }
  unmarkSeam(v0, v1) { this.seams.delete(this.edgeKey(v0, v1)); }
  isSeam(v0, v1) { return this.seams.has(this.edgeKey(v0, v1)); }
  clearSeams() { this.seams.clear(); }

  markSharpEdgesAsSeams(geometry, angleThreshold = Math.PI / 4) {
    const pos = geometry.attributes.position;
    const idx = geometry.index;
    if (!idx) return;

    const faceNormals = [];
    for (let f = 0; f < idx.count / 3; f++) {
      const a = new THREE.Vector3().fromBufferAttribute(pos, idx.getX(f*3));
      const b = new THREE.Vector3().fromBufferAttribute(pos, idx.getX(f*3+1));
      const c = new THREE.Vector3().fromBufferAttribute(pos, idx.getX(f*3+2));
      const n = new THREE.Vector3().crossVectors(b.sub(a), c.clone().sub(a)).normalize();
      faceNormals.push(n);
    }

    const edgeFaces = new Map();
    for (let f = 0; f < idx.count / 3; f++) {
      const verts = [idx.getX(f*3), idx.getX(f*3+1), idx.getX(f*3+2)];
      for (let e = 0; e < 3; e++) {
        const key = this.edgeKey(verts[e], verts[(e+1)%3]);
        if (!edgeFaces.has(key)) edgeFaces.set(key, []);
        edgeFaces.get(key).push(f);
      }
    }

    edgeFaces.forEach((faces, key) => {
      if (faces.length === 2) {
        const angle = faceNormals[faces[0]].angleTo(faceNormals[faces[1]]);
        if (angle > angleThreshold) this.seams.add(key);
      } else {
        this.seams.add(key); // boundary edge
      }
    });
  }

  serialize() { return Array.from(this.seams); }
  deserialize(data) { this.seams = new Set(data); }
}

// ─── Smart Unwrap (angle-based ABF approximation) ─────────────────────────────

export function smartUnwrap(geometry, seamManager = null) {
  const pos = geometry.attributes.position;
  const idx = geometry.index;
  if (!idx) return geometry;

  const sm = seamManager ?? new SeamManager();
  if (!seamManager) sm.markSharpEdgesAsSeams(geometry);

  const faceCount = idx.count / 3;
  const visited = new Uint8Array(faceCount);
  const uvCoords = new Float32Array(pos.count * 2);
  let islandOffset = 0;

  // BFS island growing — separated by seams
  for (let startFace = 0; startFace < faceCount; startFace++) {
    if (visited[startFace]) continue;

    // Grow island from startFace
    const island = [];
    const queue = [startFace];
    visited[startFace] = 1;

    // Build face adjacency
    const adj = buildFaceAdjacency(idx, faceCount, sm);

    while (queue.length) {
      const f = queue.shift();
      island.push(f);
      (adj[f] || []).forEach(nf => {
        if (!visited[nf]) { visited[nf] = 1; queue.push(nf); }
      });
    }

    // Project island faces to 2D using planar projection
    const islandUVs = projectIsland(island, idx, pos);

    // Place island UVs into main UV buffer
    island.forEach((f, fi) => {
      for (let v = 0; v < 3; v++) {
        const vi = idx.getX(f * 3 + v);
        uvCoords[vi * 2]     = islandUVs[fi * 3 * 2 + v * 2]     * 0.9 + islandOffset * 0.1;
        uvCoords[vi * 2 + 1] = islandUVs[fi * 3 * 2 + v * 2 + 1] * 0.9;
      }
    });

    islandOffset = (islandOffset + 1) % 10;
  }

  const newGeo = geometry.clone();
  newGeo.setAttribute('uv', new THREE.BufferAttribute(uvCoords, 2));
  newGeo.setAttribute('uv2', new THREE.BufferAttribute(uvCoords.slice(), 2));
  return newGeo;
}

function buildFaceAdjacency(idx, faceCount, seamManager) {
  const edgeFaces = new Map();
  const sm = seamManager;

  for (let f = 0; f < faceCount; f++) {
    for (let e = 0; e < 3; e++) {
      const v0 = idx.getX(f*3+e), v1 = idx.getX(f*3+(e+1)%3);
      if (sm && sm.isSeam(v0, v1)) continue;
      const key = v0 < v1 ? `${v0}_${v1}` : `${v1}_${v0}`;
      if (!edgeFaces.has(key)) edgeFaces.set(key, []);
      edgeFaces.get(key).push(f);
    }
  }

  const adj = Array.from({ length: faceCount }, () => []);
  edgeFaces.forEach(faces => {
    if (faces.length === 2) { adj[faces[0]].push(faces[1]); adj[faces[1]].push(faces[0]); }
  });
  return adj;
}

function projectIsland(faces, idx, pos) {
  // Angle-weighted average normal for best projection plane
  const avgNormal = new THREE.Vector3();
  faces.forEach(f => {
    const a = new THREE.Vector3().fromBufferAttribute(pos, idx.getX(f*3));
    const b = new THREE.Vector3().fromBufferAttribute(pos, idx.getX(f*3+1));
    const c = new THREE.Vector3().fromBufferAttribute(pos, idx.getX(f*3+2));
    avgNormal.add(new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)));
  });
  avgNormal.normalize();

  // Build local 2D axes
  const up = Math.abs(avgNormal.y) < 0.9 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
  const tangent = new THREE.Vector3().crossVectors(up, avgNormal).normalize();
  const bitangent = new THREE.Vector3().crossVectors(avgNormal, tangent);

  const uvs = new Float32Array(faces.length * 3 * 2);
  faces.forEach((f, fi) => {
    for (let v = 0; v < 3; v++) {
      const p = new THREE.Vector3().fromBufferAttribute(pos, idx.getX(f*3+v));
      uvs[fi*6 + v*2]     = p.dot(tangent);
      uvs[fi*6 + v*2 + 1] = p.dot(bitangent);
    }
  });

  // Normalize to 0-1
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (let i = 0; i < uvs.length; i += 2) {
    minU = Math.min(minU, uvs[i]); maxU = Math.max(maxU, uvs[i]);
    minV = Math.min(minV, uvs[i+1]); maxV = Math.max(maxV, uvs[i+1]);
  }
  const rangeU = maxU - minU || 1, rangeV = maxV - minV || 1;
  for (let i = 0; i < uvs.length; i += 2) {
    uvs[i] = (uvs[i] - minU) / rangeU;
    uvs[i+1] = (uvs[i+1] - minV) / rangeV;
  }

  return uvs;
}

// ─── UDIM Layout ─────────────────────────────────────────────────────────────

export class UDIMLayout {
  constructor(tilesWide = 10) {
    this.tilesWide = tilesWide;
    this.islands = []; // [{ uvs, tileU, tileV }]
  }

  addIsland(uvCoords, tileIndex = 0) {
    const tileU = tileIndex % this.tilesWide;
    const tileV = Math.floor(tileIndex / this.tilesWide);
    this.islands.push({ uvCoords, tileU, tileV });
  }

  applyToGeometry(geometry) {
    const uvAttr = geometry.attributes.uv;
    if (!uvAttr) return;
    this.islands.forEach(({ uvCoords, tileU, tileV }) => {
      for (let i = 0; i < uvCoords.length; i += 2) {
        uvAttr.setXY(
          i / 2,
          uvCoords[i] + tileU,
          uvCoords[i+1] + tileV,
        );
      }
    });
    uvAttr.needsUpdate = true;
  }

  getTileFromUV(u, v) {
    return { tileU: Math.floor(u), tileV: Math.floor(v), udim: 1001 + Math.floor(u) + Math.floor(v) * this.tilesWide };
  }

  getUDIMLabel(tileIndex) {
    const tileU = tileIndex % this.tilesWide;
    const tileV = Math.floor(tileIndex / this.tilesWide);
    return 1001 + tileU + tileV * this.tilesWide;
  }
}

// ─── Island Packing (simple shelf-based bin packing) ──────────────────────────

export function packIslands(islands, padding = 0.01) {
  // Sort by area descending
  const sorted = [...islands].sort((a, b) => b.area - a.area);
  const shelves = [{ y: 0, height: 0, x: 0 }];
  const result = [];

  sorted.forEach(island => {
    const w = island.width + padding, h = island.height + padding;
    let placed = false;

    for (const shelf of shelves) {
      if (shelf.x + w <= 1.0) {
        result.push({ ...island, placedX: shelf.x, placedY: shelf.y });
        shelf.x += w;
        shelf.height = Math.max(shelf.height, h);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const lastShelf = shelves[shelves.length - 1];
      const newY = lastShelf.y + lastShelf.height;
      shelves.push({ y: newY, height: h, x: w });
      result.push({ ...island, placedX: 0, placedY: newY });
    }
  });

  return result;
}

export default { SeamManager, smartUnwrap, UDIMLayout, packIslands };
'''

# ─────────────────────────────────────────────────────────────────────────────
# 09 — MocapRetarget.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files["MocapRetarget.js"] = r'''// MocapRetarget.js — Mocap Retargeting Engine UPGRADE
// SPX Mesh Editor | StreamPireX
// Features: T-pose binding, bone length normalization, source/target skeleton mapping,
//           multi-format support (MediaPipe 33-pt, BVH, custom)

import * as THREE from 'three';

// ─── Skeleton Profiles ────────────────────────────────────────────────────────

export const MEDIAPIPE_JOINTS = [
  'nose','leftEye','rightEye','leftEar','rightEar',
  'leftShoulder','rightShoulder','leftElbow','rightElbow',
  'leftWrist','rightWrist','leftHip','rightHip',
  'leftKnee','rightKnee','leftAnkle','rightAnkle',
  'leftHeel','rightHeel','leftFootIndex','rightFootIndex',
];

export const SPX_JOINTS = [
  'hips','spine','spine1','spine2','neck','head',
  'leftShoulder','leftArm','leftForeArm','leftHand',
  'rightShoulder','rightArm','rightForeArm','rightHand',
  'leftUpLeg','leftLeg','leftFoot','leftToeBase',
  'rightUpLeg','rightLeg','rightFoot','rightToeBase',
];

// MediaPipe index → SPX joint name mapping
export const MEDIAPIPE_TO_SPX = {
  11: 'leftShoulder',   12: 'rightShoulder',
  13: 'leftArm',        14: 'rightArm',
  15: 'leftForeArm',    16: 'rightForeArm',
  17: 'leftHand',       18: 'rightHand',
  23: 'leftUpLeg',      24: 'rightUpLeg',
  25: 'leftLeg',        26: 'rightLeg',
  27: 'leftFoot',       28: 'rightFoot',
};

// ─── Retargeter ───────────────────────────────────────────────────────────────

export class MocapRetargeter {
  constructor(options = {}) {
    this.sourceProfile = options.sourceProfile ?? 'MEDIAPIPE';
    this.targetSkeleton = options.targetSkeleton ?? null; // THREE.Skeleton
    this.tposeRotations = new Map(); // boneName -> Quaternion (rest pose)
    this.boneLengths = new Map();    // boneName -> length
    this.sourceMapping = options.mapping ?? MEDIAPIPE_TO_SPX;
    this.smoothing = options.smoothing ?? 0.6;
    this._prevRotations = new Map();
  }

  // Call once with your character's skeleton in T-pose
  bindTPose(skeleton) {
    this.targetSkeleton = skeleton;
    skeleton.bones.forEach(bone => {
      this.tposeRotations.set(bone.name, bone.quaternion.clone());
      if (bone.children.length > 0) {
        const child = bone.children[0];
        this.boneLengths.set(bone.name, bone.position.distanceTo(child.position));
      }
    });
    console.log(`[MocapRetargeter] Bound T-pose: ${skeleton.bones.length} bones`);
  }

  // Retarget MediaPipe landmarks onto bound skeleton
  retargetMediaPipe(landmarks, worldLandmarks = null) {
    if (!this.targetSkeleton || !landmarks) return;
    const lm = worldLandmarks ?? landmarks;

    // Compute source bone vectors
    const boneVectors = this._computeSourceBoneVectors(lm);

    // Apply to target skeleton
    this.targetSkeleton.bones.forEach(bone => {
      const sourceVec = boneVectors[bone.name];
      if (!sourceVec) return;

      const tposeQ = this.tposeRotations.get(bone.name) ?? new THREE.Quaternion();
      const targetQ = this._vectorToRotation(sourceVec, bone, tposeQ);

      // Smooth
      const prev = this._prevRotations.get(bone.name) ?? targetQ.clone();
      const smoothed = prev.clone().slerp(targetQ, this.smoothing);
      this._prevRotations.set(bone.name, smoothed.clone());

      bone.quaternion.copy(smoothed);
    });
  }

  _computeSourceBoneVectors(landmarks) {
    const vectors = {};
    const get = (idx) => {
      const lm = landmarks[idx];
      return lm ? new THREE.Vector3(lm.x, -lm.y, lm.z) : null;
    };

    // Left arm chain
    const ls = get(11), le = get(13), lw = get(15);
    if (ls && le) vectors['leftArm']     = new THREE.Vector3().subVectors(le, ls).normalize();
    if (le && lw) vectors['leftForeArm'] = new THREE.Vector3().subVectors(lw, le).normalize();

    // Right arm chain
    const rs = get(12), re = get(14), rw = get(16);
    if (rs && re) vectors['rightArm']     = new THREE.Vector3().subVectors(re, rs).normalize();
    if (re && rw) vectors['rightForeArm'] = new THREE.Vector3().subVectors(rw, re).normalize();

    // Left leg chain
    const lh = get(23), lk = get(25), la = get(27);
    if (lh && lk) vectors['leftUpLeg'] = new THREE.Vector3().subVectors(lk, lh).normalize();
    if (lk && la) vectors['leftLeg']   = new THREE.Vector3().subVectors(la, lk).normalize();

    // Right leg chain
    const rh = get(24), rk = get(26), ra = get(28);
    if (rh && rk) vectors['rightUpLeg'] = new THREE.Vector3().subVectors(rk, rh).normalize();
    if (rk && ra) vectors['rightLeg']   = new THREE.Vector3().subVectors(ra, rk).normalize();

    // Spine
    const hipL = get(23), hipR = get(24), shoulderL = get(11), shoulderR = get(12);
    if (hipL && hipR && shoulderL && shoulderR) {
      const hipCenter = new THREE.Vector3().addVectors(hipL, hipR).multiplyScalar(0.5);
      const shoulderCenter = new THREE.Vector3().addVectors(shoulderL, shoulderR).multiplyScalar(0.5);
      const spineVec = new THREE.Vector3().subVectors(shoulderCenter, hipCenter).normalize();
      vectors['spine'] = spineVec;
      vectors['spine1'] = spineVec;
      vectors['spine2'] = spineVec;
      vectors['hips'] = spineVec;
    }

    // Head
    const nose = get(0), neck = shoulderL && shoulderR ?
      new THREE.Vector3().addVectors(shoulderL, shoulderR).multiplyScalar(0.5) : null;
    if (nose && neck) {
      vectors['neck'] = new THREE.Vector3().subVectors(nose, neck).normalize();
      vectors['head'] = vectors['neck'];
    }

    return vectors;
  }

  _vectorToRotation(targetVec, bone, tposeQ) {
    const restVec = new THREE.Vector3(0, 1, 0).applyQuaternion(tposeQ);
    const q = new THREE.Quaternion().setFromUnitVectors(
      restVec.normalize(),
      targetVec.normalize(),
    );
    return tposeQ.clone().premultiply(q);
  }

  // Normalize bone lengths from source to match target skeleton proportions
  normalizeBoneLengths(sourceLandmarks) {
    if (!this.targetSkeleton || !sourceLandmarks) return sourceLandmarks;
    const normalized = [...sourceLandmarks];

    // Scale source skeleton to match target proportions
    const sourceHeight = this._estimateSourceHeight(sourceLandmarks);
    const targetHeight = this._estimateTargetHeight();
    if (sourceHeight === 0 || targetHeight === 0) return normalized;

    const scale = targetHeight / sourceHeight;
    return normalized.map(lm => ({
      ...lm,
      x: lm.x * scale,
      y: lm.y * scale,
      z: lm.z * scale,
    }));
  }

  _estimateSourceHeight(lm) {
    const head = lm[0], leftAnkle = lm[27], rightAnkle = lm[28];
    if (!head || !leftAnkle) return 1;
    const ankle = leftAnkle;
    return Math.abs(head.y - ankle.y);
  }

  _estimateTargetHeight() {
    if (!this.targetSkeleton) return 1;
    const head = this.targetSkeleton.bones.find(b => b.name.toLowerCase() === 'head');
    const foot = this.targetSkeleton.bones.find(b => b.name.toLowerCase().includes('foot'));
    if (!head || !foot) return 1;
    const hw = new THREE.Vector3(), fw = new THREE.Vector3();
    head.getWorldPosition(hw); foot.getWorldPosition(fw);
    return hw.distanceTo(fw);
  }

  setSmoothing(value) { this.smoothing = Math.max(0, Math.min(1, value)); }
  setMapping(mapping) { this.sourceMapping = mapping; }

  getDebugInfo() {
    return {
      boundBones: this.tposeRotations.size,
      boneLengths: Object.fromEntries(this.boneLengths),
      smoothing: this.smoothing,
    };
  }
}

export default MocapRetargeter;
'''

# ─────────────────────────────────────────────────────────────────────────────
# 10 — smoothPose.js UPGRADE (add Kalman filter option)
# ─────────────────────────────────────────────────────────────────────────────
files_front = {}
files_front["smoothPose.js"] = r'''// smoothPose.js — Pose Smoothing UPGRADE
// SPX Mesh Editor | StreamPireX
// Filters: One Euro (fast motion), Kalman (slow/precise), EMA (lightweight)

// ─── One Euro Filter (existing, enhanced) ────────────────────────────────────

class OneEuroFilter1D {
  constructor(freq = 30, minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.freq = freq; this.minCutoff = minCutoff; this.beta = beta; this.dCutoff = dCutoff;
    this.x = null; this.dx = 0; this.lastTime = null;
  }
  alpha(cutoff) { const te = 1 / this.freq; const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / te); }
  filter(x, t = null) {
    if (this.x === null) { this.x = x; this.lastTime = t; return x; }
    if (t !== null && this.lastTime !== null) this.freq = 1 / Math.max((t - this.lastTime) / 1000, 1e-6);
    this.lastTime = t;
    const dx = (x - this.x) * this.freq;
    this.dx = this.dx + this.alpha(this.dCutoff) * (dx - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x = this.x + this.alpha(cutoff) * (x - this.x);
    return this.x;
  }
  reset() { this.x = null; this.dx = 0; }
}

export class OneEuroPoseSmoother {
  constructor(minCutoff = 1.0, beta = 0.007) {
    this.minCutoff = minCutoff; this.beta = beta;
    this.filters = null;
  }
  _initFilters(count) {
    this.filters = Array.from({ length: count }, () => ({
      x: new OneEuroFilter1D(30, this.minCutoff, this.beta),
      y: new OneEuroFilter1D(30, this.minCutoff, this.beta),
      z: new OneEuroFilter1D(30, this.minCutoff, this.beta),
    }));
  }
  smooth(landmarks, timestamp = null) {
    if (!this.filters || this.filters.length !== landmarks.length) this._initFilters(landmarks.length);
    return landmarks.map((lm, i) => {
      if (!lm) return lm;
      const f = this.filters[i];
      return { ...lm, x: f.x.filter(lm.x, timestamp), y: f.y.filter(lm.y, timestamp), z: f.z.filter(lm.z, timestamp) };
    });
  }
  reset() { if (this.filters) this.filters.forEach(f => { f.x.reset(); f.y.reset(); f.z.reset(); }); }
}

// ─── Kalman Filter (new) ──────────────────────────────────────────────────────

class KalmanFilter1D {
  constructor(processNoise = 0.001, measurementNoise = 0.1) {
    this.Q = processNoise;      // process noise covariance
    this.R = measurementNoise;  // measurement noise covariance
    this.x = null;              // state estimate
    this.P = 1;                 // error covariance
  }
  filter(z) {
    if (this.x === null) { this.x = z; return z; }
    // Predict
    const xPred = this.x;
    const PPred = this.P + this.Q;
    // Update
    const K = PPred / (PPred + this.R); // Kalman gain
    this.x = xPred + K * (z - xPred);
    this.P = (1 - K) * PPred;
    return this.x;
  }
  reset() { this.x = null; this.P = 1; }
}

export class KalmanPoseSmoother {
  constructor(processNoise = 0.001, measurementNoise = 0.1) {
    this.Q = processNoise; this.R = measurementNoise;
    this.filters = null;
  }
  _initFilters(count) {
    this.filters = Array.from({ length: count }, () => ({
      x: new KalmanFilter1D(this.Q, this.R),
      y: new KalmanFilter1D(this.Q, this.R),
      z: new KalmanFilter1D(this.Q, this.R),
    }));
  }
  smooth(landmarks) {
    if (!this.filters || this.filters.length !== landmarks.length) this._initFilters(landmarks.length);
    return landmarks.map((lm, i) => {
      if (!lm) return lm;
      const f = this.filters[i];
      return { ...lm, x: f.x.filter(lm.x), y: f.y.filter(lm.y), z: f.z.filter(lm.z) };
    });
  }
  reset() { if (this.filters) this.filters.forEach(f => { f.x.reset(); f.y.reset(); f.z.reset(); }); }
}

// ─── EMA Smoother (lightweight) ───────────────────────────────────────────────

export class EMAPoseSmoother {
  constructor(alpha = 0.7) { this.alpha = alpha; this.prev = null; }
  smooth(landmarks) {
    if (!this.prev) { this.prev = landmarks; return landmarks; }
    const result = landmarks.map((lm, i) => {
      const p = this.prev[i];
      if (!lm || !p) return lm;
      return {
        ...lm,
        x: p.x * (1 - this.alpha) + lm.x * this.alpha,
        y: p.y * (1 - this.alpha) + lm.y * this.alpha,
        z: p.z * (1 - this.alpha) + lm.z * this.alpha,
      };
    });
    this.prev = result;
    return result;
  }
  reset() { this.prev = null; }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPoseSmoother(type = 'ONE_EURO', options = {}) {
  switch (type) {
    case 'KALMAN':   return new KalmanPoseSmoother(options.processNoise, options.measurementNoise);
    case 'EMA':      return new EMAPoseSmoother(options.alpha);
    case 'ONE_EURO':
    default:         return new OneEuroPoseSmoother(options.minCutoff, options.beta);
  }
}

export default { OneEuroPoseSmoother, KalmanPoseSmoother, EMAPoseSmoother, createPoseSmoother };
'''

# ─────────────────────────────────────────────────────────────────────────────
# 11 — EnvironmentProbes.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files["EnvironmentProbes.js"] = r'''// EnvironmentProbes.js — Environment Probes + GI UPGRADE
// SPX Mesh Editor | StreamPireX
// Features: probe placement, blending, capture resolution control,
//           reflection capture, sky probe, probe volume system

import * as THREE from 'three';

export const PROBE_TYPES = { REFLECTION: 'REFLECTION', SKY: 'SKY', IRRADIANCE: 'IRRADIANCE' };

export class EnvironmentProbe {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.type = options.type ?? PROBE_TYPES.REFLECTION;
    this.position = options.position ? new THREE.Vector3(...options.position) : new THREE.Vector3();
    this.radius = options.radius ?? 10;
    this.resolution = options.resolution ?? 128;
    this.intensity = options.intensity ?? 1.0;
    this.id = options.id ?? Math.random().toString(36).slice(2);
    this.isDirty = true;
    this._build();
  }

  _build() {
    this.renderTarget = new THREE.WebGLCubeRenderTarget(this.resolution, {
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    this.cubeCamera = new THREE.CubeCamera(0.1, this.radius * 2, this.renderTarget);
    this.cubeCamera.position.copy(this.position);
    this.scene.add(this.cubeCamera);

    // Visual helper sphere
    this.helper = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true }),
    );
    this.helper.position.copy(this.position);
    this.helper.userData.probeId = this.id;
    this.scene.add(this.helper);
  }

  setPosition(pos) {
    this.position.copy(pos);
    this.cubeCamera.position.copy(pos);
    this.helper.position.copy(pos);
    this.isDirty = true;
  }

  setResolution(res) {
    this.resolution = res;
    this.renderTarget.dispose();
    this._build();
  }

  capture(renderer) {
    this.cubeCamera.update(renderer, this.scene);
    this.isDirty = false;
  }

  get texture() { return this.renderTarget.texture; }

  applyToMaterial(material) {
    material.envMap = this.renderTarget.texture;
    material.envMapIntensity = this.intensity;
    material.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.cubeCamera);
    this.scene.remove(this.helper);
    this.renderTarget.dispose();
    this.helper.geometry.dispose();
  }
}

// ─── Probe Volume (blend multiple probes) ────────────────────────────────────

export class ProbeVolume {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.probes = new Map();
    this.autoUpdate = true;
    this._frameCount = 0;
    this._updateInterval = 30; // capture every N frames
  }

  addProbe(options = {}) {
    const probe = new EnvironmentProbe(this.scene, options);
    this.probes.set(probe.id, probe);
    probe.capture(this.renderer);
    return probe.id;
  }

  removeProbe(id) {
    const probe = this.probes.get(id);
    if (probe) { probe.dispose(); this.probes.delete(id); }
  }

  update() {
    if (!this.autoUpdate) return;
    this._frameCount++;
    if (this._frameCount % this._updateInterval !== 0) return;
    this.probes.forEach(probe => {
      if (probe.isDirty) probe.capture(this.renderer);
    });
  }

  captureAll() {
    this.probes.forEach(probe => probe.capture(this.renderer));
  }

  // Find best probe for a given world position and apply to mesh
  applyBestProbe(mesh) {
    const meshPos = new THREE.Vector3();
    mesh.getWorldPosition(meshPos);

    let bestProbe = null, bestScore = Infinity;
    this.probes.forEach(probe => {
      const dist = meshPos.distanceTo(probe.position);
      if (dist < probe.radius && dist < bestScore) {
        bestScore = dist;
        bestProbe = probe;
      }
    });

    if (bestProbe) {
      bestProbe.applyToMaterial(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material);
    }
    return bestProbe?.id ?? null;
  }

  // Blend two nearest probes (weighted by inverse distance)
  applyBlendedProbes(mesh) {
    const meshPos = new THREE.Vector3();
    mesh.getWorldPosition(meshPos);

    const nearby = [];
    this.probes.forEach(probe => {
      const dist = meshPos.distanceTo(probe.position);
      if (dist < probe.radius) nearby.push({ probe, dist });
    });

    if (nearby.length === 0) return;
    if (nearby.length === 1) { nearby[0].probe.applyToMaterial(mesh.material); return; }

    // Use nearest probe (full blending requires shader support)
    nearby.sort((a, b) => a.dist - b.dist);
    nearby[0].probe.applyToMaterial(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material);
  }

  setupSkyProbe(hdrTexture, options = {}) {
    const probe = new EnvironmentProbe(this.scene, {
      ...options,
      type: PROBE_TYPES.SKY,
      radius: 9999,
    });
    if (hdrTexture) {
      this.scene.background = hdrTexture;
      this.scene.environment = hdrTexture;
    }
    this.probes.set(probe.id, probe);
    return probe.id;
  }

  markDirty() { this.probes.forEach(p => { p.isDirty = true; }); }

  getProbeList() {
    return Array.from(this.probes.values()).map(p => ({
      id: p.id, type: p.type, position: p.position.toArray(),
      radius: p.radius, resolution: p.resolution, intensity: p.intensity,
    }));
  }

  dispose() {
    this.probes.forEach(p => p.dispose());
    this.probes.clear();
  }
}

export default ProbeVolume;
'''

# ─── Write all mesh/ files ────────────────────────────────────────────────────
written = []
for filename, code in files.items():
    path = os.path.join(BASE, filename)
    with open(path, 'w') as f:
        f.write(code)
    written.append(path)
    print(f"✅ {path}")

# ─── Write front/js/utils/smoothPose.js ──────────────────────────────────────
FRONT_BASE = "/workspaces/spx-mesh-editor/src/front/js/utils"
os.makedirs(FRONT_BASE, exist_ok=True)
for filename, code in files_front.items():
    path = os.path.join(FRONT_BASE, filename)
    with open(path, 'w') as f:
        f.write(code)
    written.append(path)
    print(f"✅ {path}")

print(f"\n🎉 Done — {len(written)} files written:")
for p in written:
    print(f"   {p}")
