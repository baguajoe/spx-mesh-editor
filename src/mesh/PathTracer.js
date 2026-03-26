import * as THREE from "three";

// ── Path tracer settings ──────────────────────────────────────────────────────
export function createPathTracerSettings(options = {}) {
  return {
    enabled:        false,
    samples:        options.samples        || 1,
    maxSamples:     options.maxSamples     || 256,
    bounces:        options.bounces        || 4,
    resolutionScale:options.resolutionScale|| 1.0,
    progressive:    options.progressive    || true,
    denoise:        options.denoise        || false,
    toneMapping:    options.toneMapping    || THREE.ACESFilmicToneMapping,
    exposure:       options.exposure       || 1.0,
    background:     options.background     || new THREE.Color("#000010"),
    envMapIntensity:options.envMapIntensity|| 1.0,
  };
}

// ── Detect three-gpu-pathtracer ───────────────────────────────────────────────
export async function detectPathTracer() {
  try {
    // three-gpu-pathtracer is an optional dependency
    // Check if it's available
    const mod = await import(/* @vite-ignore */ "three-gpu-pathtracer").catch(() => null);
    if (mod) {
      return { available: true, version: mod.VERSION || "unknown", module: mod };
    }
    return { available: false, reason: "three-gpu-pathtracer not installed" };
  } catch(e) {
    return { available: false, reason: e.message };
  }
}

// ── WebGL path tracer (custom, no external dep) ───────────────────────────────
export function createWebGLPathTracer(renderer, scene, camera, options = {}) {
  const settings = createPathTracerSettings(options);
  const w = renderer.domElement.width  * settings.resolutionScale;
  const h = renderer.domElement.height * settings.resolutionScale;

  // Accumulation render target
  const accumulationTarget = new THREE.WebGLRenderTarget(w, h, {
    type:   THREE.FloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });

  const copyTarget = accumulationTarget.clone();

  // Full-screen quad for accumulation
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const quadMat = new THREE.ShaderMaterial({
    uniforms: {
      tPrevious: { value: accumulationTarget.texture },
      tCurrent:  { value: null },
      blend:     { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tPrevious;
      uniform sampler2D tCurrent;
      uniform float blend;
      varying vec2 vUv;
      void main() {
        vec4 prev = texture2D(tPrevious, vUv);
        vec4 curr = texture2D(tCurrent,  vUv);
        gl_FragColor = mix(prev, curr, blend);
      }
    `,
    depthWrite: false,
    depthTest:  false,
  });

  const quad = new THREE.Mesh(quadGeo, quadMat);
  const quadScene  = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  quadScene.add(quad);

  return {
    settings,
    accumulationTarget,
    copyTarget,
    quadMat,
    quadScene,
    quadCamera,
    currentSample: 0,
    isRendering:   false,
    startTime:     null,
    lastFrameTime: null,
  };
}

// ── Step path tracer ──────────────────────────────────────────────────────────
export function stepPathTracer(pt, renderer, scene, camera) {
  if (!pt.isRendering) return;
  const { settings, accumulationTarget, copyTarget, quadMat, quadScene, quadCamera } = pt;

  // Jitter camera for anti-aliasing
  const aspect = renderer.domElement.width / renderer.domElement.height;
  const jitterX = (Math.random()-0.5) * 0.001;
  const jitterY = (Math.random()-0.5) * 0.001;
  camera.setViewOffset(
    renderer.domElement.width,  renderer.domElement.height,
    jitterX * renderer.domElement.width,
    jitterY * renderer.domElement.height,
    renderer.domElement.width,  renderer.domElement.height,
  );

  // Render current sample to copy target
  renderer.setRenderTarget(copyTarget);
  renderer.render(scene, camera);

  // Accumulate
  quadMat.uniforms.tPrevious.value = accumulationTarget.texture;
  quadMat.uniforms.tCurrent.value  = copyTarget.texture;
  const blend = 1.0 / (pt.currentSample + 1);
  quadMat.uniforms.blend.value     = blend;

  renderer.setRenderTarget(accumulationTarget);
  renderer.render(quadScene, quadCamera);

  // Display to screen
  renderer.setRenderTarget(null);
  quadMat.uniforms.tPrevious.value = accumulationTarget.texture;
  quadMat.uniforms.tCurrent.value  = accumulationTarget.texture;
  quadMat.uniforms.blend.value     = 0.0;
  renderer.render(quadScene, quadCamera);

  // Reset camera jitter
  camera.clearViewOffset();

  pt.currentSample++;
  pt.lastFrameTime = Date.now();

  if (pt.currentSample >= settings.maxSamples) {
    pt.isRendering = false;
    return { done: true, samples: pt.currentSample };
  }
  return { done: false, samples: pt.currentSample, progress: pt.currentSample / settings.maxSamples };
}

// ── Start path tracing ────────────────────────────────────────────────────────
export function startPathTracing(pt) {
  pt.isRendering   = true;
  pt.currentSample = 0;
  pt.startTime     = Date.now();
  return pt;
}

// ── Stop path tracing ─────────────────────────────────────────────────────────
export function stopPathTracing(pt) {
  pt.isRendering = false;
  return pt;
}

// ── Reset accumulation ────────────────────────────────────────────────────────
export function resetPathTracer(pt, renderer) {
  pt.currentSample = 0;
  if (renderer) {
    renderer.setRenderTarget(pt.accumulationTarget);
    renderer.clear();
    renderer.setRenderTarget(null);
  }
}

// ── Simple software ray marcher (preview quality) ─────────────────────────────
export function createRayMarchPreview(width=64, height=64) {
  const canvas = document.createElement("canvas");
  canvas.width  = width;
  canvas.height = height;
  const ctx     = canvas.getContext("2d");
  return { canvas, ctx, width, height };
}

export function renderRayMarchPreview(preview, scene, camera) {
  const { ctx, width, height } = preview;
  const img = ctx.createImageData(width, height);

  const origin = new THREE.Vector3();
  const dir    = new THREE.Vector3();
  camera.getWorldPosition(origin);

  const invProj = new THREE.Matrix4().copy(camera.projectionMatrix).invert();
  const invView = new THREE.Matrix4().copy(camera.matrixWorldInverse).invert();

  // Simple ray-scene intersection (boxes only for preview)
  const boxes = [];
  scene.traverse(obj => {
    if (obj.isMesh) {
      const box = new THREE.Box3().setFromObject(obj);
      boxes.push({ box, color: obj.material?.color || new THREE.Color(0.8,0.8,0.8) });
    }
  });

  for (let y=0; y<height; y++) for (let x=0; x<width; x++) {
    const nx = (x/width)*2-1;
    const ny = (y/height)*-2+1;

    dir.set(nx, ny, -1).applyMatrix4(invProj).applyMatrix4(invView).sub(origin).normalize();

    let minDist = Infinity;
    let hitColor = new THREE.Color(0.1, 0.1, 0.15);

    boxes.forEach(({ box, color }) => {
      const ray = new THREE.Ray(origin, dir);
      const hit = ray.intersectBox(box, new THREE.Vector3());
      if (hit) {
        const d = origin.distanceTo(hit);
        if (d < minDist) { minDist = d; hitColor = color; }
      }
    });

    const i = (y*width+x)*4;
    const shade = minDist < Infinity ? Math.max(0, 1-minDist*0.1) : 0;
    img.data[i]   = hitColor.r*255*shade;
    img.data[i+1] = hitColor.g*255*shade;
    img.data[i+2] = hitColor.b*255*shade;
    img.data[i+3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

// ── Export rendered frame ─────────────────────────────────────────────────────
export function exportPathTracedFrame(renderer, filename="pathtraced.png") {
  const dataURL = renderer.domElement.toDataURL("image/png");
  const a = document.createElement("a");
  a.href     = dataURL;
  a.download = filename;
  a.click();
  return dataURL;
}

// ── Path tracer stats ─────────────────────────────────────────────────────────
export function getPathTracerStats(pt) {
  const elapsed = pt.startTime ? (Date.now() - pt.startTime) / 1000 : 0;
  const spp     = pt.currentSample;
  const sps     = elapsed > 0 ? spp / elapsed : 0;
  const eta     = sps > 0 ? (pt.settings.maxSamples - spp) / sps : 0;
  return {
    samples:    spp,
    maxSamples: pt.settings.maxSamples,
    progress:   spp / pt.settings.maxSamples,
    elapsed:    elapsed.toFixed(1),
    sps:        sps.toFixed(1),
    eta:        eta.toFixed(1),
    isRendering:pt.isRendering,
  };
}
