import * as THREE from "three";

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
export function createVolumetricSettings() {
    return { enabled: false, density: 0.02, anisotropy: 0.7, absorption: "#1a1a1a", scattering: "#ffffff", stepSize: 0.1 };
}
export function createPathTracerSettings() {
    return { samples: 64, bounces: 3, denoise: true, resolutionScale: 1.0 };
}
