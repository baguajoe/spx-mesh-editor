import os
from pathlib import Path

BASE = "/workspaces/spx-mesh-editor/src/mesh"

files = {}

# ── UDIMSystem.js ─────────────────────────────────────────────────────────────
files["UDIMSystem.js"] = """import * as THREE from "three";

// UDIM tile addressing: tile 1001 = U[0,1] V[0,1], 1002 = U[1,2] V[0,1], etc.
// Row of 10 tiles per V unit: tile = 1001 + uIndex + vIndex * 10

export const UDIM_GRID = { tilesU: 10, tilesV: 10, maxTiles: 100 };

export function udimTileFromUV(u, v) {
  const uIdx = Math.floor(u);
  const vIdx = Math.floor(v);
  return 1001 + uIdx + vIdx * 10;
}

export function uvToUDIMLocal(u, v) {
  return { u: u % 1, v: v % 1, tile: udimTileFromUV(u, v) };
}

export function udimTileToUVOffset(tile) {
  const idx  = tile - 1001;
  const uIdx = idx % 10;
  const vIdx = Math.floor(idx / 10);
  return { uOffset: uIdx, vOffset: vIdx };
}

export function createUDIMLayout(tileCount = 4) {
  const tiles = [];
  for (let i = 0; i < tileCount; i++) {
    const uIdx = i % 10;
    const vIdx = Math.floor(i / 10);
    tiles.push({
      id:      1001 + i,
      uOffset: uIdx,
      vOffset: vIdx,
      uRange:  [uIdx, uIdx + 1],
      vRange:  [vIdx, vIdx + 1],
      texture: null,
      canvas:  null,
      dirty:   false,
    });
  }
  return { tiles, tileCount, activeTextures: new Map() };
}

export function createUDIMTileCanvas(tile, width = 1024, height = 1024) {
  const canvas  = document.createElement("canvas");
  canvas.width  = width;
  canvas.height = height;
  const ctx     = canvas.getContext("2d");
  ctx.fillStyle = "#222222";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#00ffc820";
  ctx.font      = "bold 48px monospace";
  ctx.fillText(`UDIM ${tile.id}`, 20, 60);
  tile.canvas = canvas;
  tile.texture = new THREE.CanvasTexture(canvas);
  return tile;
}

export function initUDIMLayout(layout, width = 1024, height = 1024) {
  for (const tile of layout.tiles) createUDIMTileCanvas(tile, width, height);
  return layout;
}

export function getUDIMTile(layout, tileId) {
  return layout.tiles.find(t => t.id === tileId) || null;
}

export function getUDIMTileFromUV(layout, u, v) {
  const id = udimTileFromUV(u, v);
  return getUDIMTile(layout, id);
}

export function paintUDIM(layout, u, v, opts = {}) {
  const { color = "#ff0000", radius = 20, opacity = 1.0 } = opts;
  const tile = getUDIMTileFromUV(layout, u, v);
  if (!tile?.canvas) return;
  const ctx  = tile.canvas.getContext("2d");
  const w    = tile.canvas.width;
  const h    = tile.canvas.height;
  const lu   = (u % 1) * w;
  const lv   = (1 - (v % 1)) * h;
  ctx.globalAlpha = opacity;
  ctx.fillStyle   = color;
  ctx.beginPath();
  ctx.arc(lu, lv, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  tile.dirty = true;
  if (tile.texture) tile.texture.needsUpdate = true;
}

export function fillUDIMTile(layout, tileId, color = "#888888") {
  const tile = getUDIMTile(layout, tileId);
  if (!tile?.canvas) return;
  const ctx = tile.canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, tile.canvas.width, tile.canvas.height);
  tile.dirty = true;
  if (tile.texture) tile.texture.needsUpdate = true;
}

export function exportUDIMTile(layout, tileId, format = "image/png") {
  const tile = getUDIMTile(layout, tileId);
  if (!tile?.canvas) return null;
  return tile.canvas.toDataURL(format);
}

export function exportAllUDIMTiles(layout, format = "image/png") {
  return layout.tiles.map(t => ({
    id:  t.id,
    url: t.canvas ? t.canvas.toDataURL(format) : null,
  }));
}

export function applyUDIMToMaterial(material, layout) {
  if (!layout.tiles.length) return material;
  const first = layout.tiles[0];
  if (first?.texture) {
    material.map = first.texture;
    material.needsUpdate = true;
  }
  material._udimLayout = layout;
  return material;
}

export function applyUDIMTileToMaterial(material, layout, tileId) {
  const tile = getUDIMTile(layout, tileId);
  if (tile?.texture) {
    material.map = tile.texture;
    material.needsUpdate = true;
  }
  return material;
}

export function remapUVsToUDIM(geometry, tileAssignments = []) {
  const uv = geometry.attributes.uv;
  if (!uv) return geometry;
  for (const { faceStart, faceEnd, tile } of tileAssignments) {
    const { uOffset, vOffset } = udimTileToUVOffset(tile);
    for (let i = faceStart * 3; i < faceEnd * 3; i++) {
      const u = uv.getX(i) + uOffset;
      const v = uv.getY(i) + vOffset;
      uv.setXY(i, u, v);
    }
  }
  uv.needsUpdate = true;
  return geometry;
}

export function buildUDIMAtlas(layout, atlasWidth = 4096, atlasHeight = 4096) {
  const canvas  = document.createElement("canvas");
  canvas.width  = atlasWidth;
  canvas.height = atlasHeight;
  const ctx     = canvas.getContext("2d");
  const tileW   = atlasWidth  / 10;
  const tileH   = atlasHeight / 10;
  for (const tile of layout.tiles) {
    if (!tile.canvas) continue;
    const { uOffset, vOffset } = udimTileToUVOffset(tile.id);
    ctx.drawImage(tile.canvas, uOffset * tileW, vOffset * tileH, tileW, tileH);
  }
  return { canvas, texture: new THREE.CanvasTexture(canvas) };
}

export function getUDIMStats(layout) {
  return {
    tiles:         layout.tileCount,
    initialized:   layout.tiles.filter(t => t.canvas).length,
    dirty:         layout.tiles.filter(t => t.dirty).length,
    tileIds:       layout.tiles.map(t => t.id),
  };
}
"""

# ── Rewrite PathTracer.js with real three-gpu-pathtracer integration ───────────
files["PathTracer.js"] = """import * as THREE from "three";

export function createPathTracerSettings(options = {}) {
  return {
    enabled:         false,
    samples:         options.samples         || 1,
    maxSamples:      options.maxSamples      || 512,
    bounces:         options.bounces         || 8,
    resolutionScale: options.resolutionScale || 0.5,
    progressive:     options.progressive     ?? true,
    denoise:         options.denoise         ?? true,
    toneMapping:     options.toneMapping     || THREE.ACESFilmicToneMapping,
    exposure:        options.exposure        || 1.0,
    background:      options.background      || new THREE.Color("#000010"),
    tiles:           options.tiles           || 2,
    renderDelay:     options.renderDelay     || 8,
    environmentIntensity: options.environmentIntensity || 1.0,
    filterGlossyFactor:   options.filterGlossyFactor   || 0.5,
  };
}

export async function detectPathTracer() {
  try {
    const mod = await import(/* @vite-ignore */ "three-gpu-pathtracer").catch(() => null);
    if (mod?.WebGLPathTracer) return { available: true, version: mod.VERSION || "unknown", mod };
    return { available: false, reason: "three-gpu-pathtracer not installed — run: npm install three-gpu-pathtracer" };
  } catch (e) {
    return { available: false, reason: e.message };
  }
}

export async function createWebGLPathTracer(renderer, scene, camera, options = {}) {
  const settings = createPathTracerSettings(options);
  const detected = await detectPathTracer();

  if (!detected.available) {
    console.warn("[PathTracer] three-gpu-pathtracer not available — using fallback accumulation renderer");
    return createFallbackAccumulator(renderer, scene, camera, settings);
  }

  const { WebGLPathTracer, GradientEquirectTexture } = detected.mod;

  const pt = new WebGLPathTracer(renderer);
  pt.setScene(scene, camera);
  pt.bounces              = settings.bounces;
  pt.tiles                = settings.tiles;
  pt.filterGlossyFactor   = settings.filterGlossyFactor;
  pt.environmentIntensity = settings.environmentIntensity;
  pt.renderDelay          = settings.renderDelay;

  renderer.toneMapping    = settings.toneMapping;
  renderer.toneMappingExposure = settings.exposure;

  return {
    _type:    "WebGLPathTracer",
    _pt:      pt,
    _settings: settings,
    _renderer: renderer,
    _scene:   scene,
    _camera:  camera,
    samples:  0,
    running:  false,
    _raf:     null,
  };
}

function createFallbackAccumulator(renderer, scene, camera, settings) {
  const rt1 = new THREE.WebGLRenderTarget(
    renderer.domElement.width  * settings.resolutionScale,
    renderer.domElement.height * settings.resolutionScale,
    { type: THREE.FloatType }
  );
  const rt2 = rt1.clone();

  const blendMat = new THREE.MeshBasicMaterial();
  const blendGeo = new THREE.PlaneGeometry(2, 2);
  const blendMesh = new THREE.Mesh(blendGeo, blendMat);
  const blendScene = new THREE.Scene();
  const blendCam   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  blendScene.add(blendMesh);

  return {
    _type:     "FallbackAccumulator",
    _rt1:      rt1,
    _rt2:      rt2,
    _blendMat: blendMat,
    _blendScene: blendScene,
    _blendCam:   blendCam,
    _renderer:   renderer,
    _scene:      scene,
    _camera:     camera,
    _settings:   settings,
    samples:     0,
    running:     false,
    _raf:        null,
  };
}

export function startPathTracing(pt) {
  if (!pt) return;
  pt.running = true;
  pt.samples = 0;
  if (pt._type === "WebGLPathTracer") {
    pt._pt.renderSample();
  }
}

export function stopPathTracing(pt) {
  if (!pt) return;
  pt.running = false;
  if (pt._raf) { cancelAnimationFrame(pt._raf); pt._raf = null; }
}

export function stepPathTracer(pt, renderer, scene, camera) {
  if (!pt || !pt.running) return;
  if (pt.samples >= pt._settings.maxSamples) { pt.running = false; return; }

  if (pt._type === "WebGLPathTracer") {
    pt._pt.renderSample();
    pt.samples++;
    return;
  }

  // Fallback: progressive accumulation via alpha blend
  const { _rt1, _rt2, _blendMat, _blendScene, _blendCam } = pt;
  renderer.setRenderTarget(_rt1);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  const alpha = 1 / (pt.samples + 1);
  _blendMat.map     = _rt1.texture;
  _blendMat.opacity = alpha;
  _blendMat.transparent = true;

  renderer.setRenderTarget(_rt2);
  renderer.render(_blendScene, _blendCam);
  renderer.setRenderTarget(null);

  // Swap targets
  const tmp = pt._rt1; pt._rt1 = pt._rt2; pt._rt2 = tmp;
  pt.samples++;
}

export function resetPathTracer(pt, renderer) {
  if (!pt) return;
  pt.samples = 0;
  if (pt._type === "WebGLPathTracer" && pt._pt?.reset) {
    pt._pt.reset();
  }
}

export function exportPathTracedFrame(renderer, filename = "pathtraced.png") {
  const canvas = renderer.domElement;
  const url    = canvas.toDataURL("image/png");
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = filename;
  a.click();
  return url;
}

export function getPathTracerStats(pt) {
  if (!pt) return { samples: 0, running: false, type: "none" };
  return {
    samples:    pt.samples,
    maxSamples: pt._settings?.maxSamples || 512,
    running:    pt.running,
    type:       pt._type,
    progress:   pt.samples / (pt._settings?.maxSamples || 512),
    bounces:    pt._settings?.bounces || 8,
  };
}

export async function detectWebGPU() {
  if (!navigator.gpu) return { available: false, reason: "navigator.gpu not present" };
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter)  return { available: false, reason: "No WebGPU adapter found" };
    const device   = await adapter.requestDevice();
    return {
      available: true,
      adapter:   adapter.name || "unknown",
      features:  [...adapter.features].map(f => f.toString()),
    };
  } catch (e) {
    return { available: false, reason: e.message };
  }
}
"""

print("Writing files...")
for fname, content in files.items():
    path = os.path.join(BASE, fname)
    with open(path, "w") as f:
        f.write(content)
    lines = content.count("\\n")
    print(f"  {fname}: {lines} lines")

# ── Patch App.jsx to import UDIMSystem ────────────────────────────────────────
app = Path("/workspaces/spx-mesh-editor/src/App.jsx")
src = app.read_text()

udim_import = 'import { createUDIMLayout, initUDIMLayout, paintUDIM, fillUDIMTile, exportUDIMTile, exportAllUDIMTiles, applyUDIMToMaterial, remapUVsToUDIM, buildUDIMAtlas, getUDIMStats, getUDIMTileFromUV, udimTileFromUV } from "./mesh/UDIMSystem.js";'

if "UDIMSystem" not in src:
    old = 'import { createPostPassManager, createBloomPass, createSSAOPass, createDOFPass, createChromaticAberrationPass } from "./mesh/PostPassShaders.js";'
    new = old + "\\n" + udim_import
    src = src.replace(old, new, 1)
    app.write_text(src)
    print("Patched App.jsx — UDIM import added")
else:
    print("App.jsx already has UDIMSystem import")

print("\\nDone. Verifying:")
for fname in files:
    p = Path(BASE) / fname
    n = sum(1 for _ in open(p))
    print(f"  {fname}: {n} lines")
