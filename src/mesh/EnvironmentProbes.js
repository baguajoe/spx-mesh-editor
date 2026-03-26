import * as THREE from "three";

// ── Reflection probe ──────────────────────────────────────────────────────────
export function createReflectionProbe(position, options = {}) {
  const {
    resolution = 256,
    near       = 0.1,
    far        = 1000,
    name       = "ReflectionProbe_" + Date.now(),
  } = options;

  const cubeCamera = new THREE.CubeCamera(near, far,
    new THREE.WebGLCubeRenderTarget(resolution, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    })
  );
  cubeCamera.position.copy(position);
  cubeCamera.name = name;
  cubeCamera.userData.probeType = "reflection";
  cubeCamera.userData.radius    = options.radius || 5;
  return cubeCamera;
}

// ── Update reflection probe ───────────────────────────────────────────────────
export function updateReflectionProbe(probe, renderer, scene) {
  probe.update(renderer, scene);
}

// ── Apply probe to material ───────────────────────────────────────────────────
export function applyProbeToMaterial(material, probe) {
  material.envMap         = probe.renderTarget.texture;
  material.envMapIntensity = 1.0;
  material.needsUpdate    = true;
}

// ── Apply probe to scene ──────────────────────────────────────────────────────
export function applyProbeToScene(scene, probe) {
  scene.environment = probe.renderTarget.texture;
}

// ── Irradiance probe (diffuse GI) ─────────────────────────────────────────────
export function createIrradianceProbe(position, options = {}) {
  const probe = createReflectionProbe(position, { ...options, resolution: 64 });
  probe.userData.probeType = "irradiance";
  return probe;
}

// ── Environment map from HDRI colors ─────────────────────────────────────────
export function createPMREMFromColors(renderer, colors = {}) {
  const {
    top    = "#87ceeb",
    bottom = "#445566",
    front  = "#668899",
    back   = "#668899",
    left   = "#668899",
    right  = "#668899",
  } = colors;

  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Simple gradient sky
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

// ── Screen space reflections (simple) ────────────────────────────────────────
export function applySSR(canvas, { intensity=0.3, blurRadius=2 } = {}) {
  const ctx = canvas.getContext("2d");
  const w   = canvas.width, h = canvas.height;
  const img = ctx.getImageData(0,0,w,h);
  const src = new Uint8ClampedArray(img.data);

  // Flip bottom half of image onto top as rough SSR
  for (let y=0; y<h/2; y++) {
    for (let x=0; x<w; x++) {
      const si = ((h-1-y)*w+x)*4;
      const di = (y*w+x)*4;
      img.data[di]   = (src[di]   + src[si]*intensity) / (1+intensity);
      img.data[di+1] = (src[di+1] + src[si+1]*intensity) / (1+intensity);
      img.data[di+2] = (src[di+2] + src[si+2]*intensity) / (1+intensity);
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ── GI approximation (ambient probe) ─────────────────────────────────────────
export function createAmbientProbe(scene, options = {}) {
  const {
    skyColor     = "#87ceeb",
    groundColor  = "#556644",
    intensity    = 0.5,
  } = options;

  const existing = scene.getObjectByName("AmbientProbe");
  if (existing) scene.remove(existing);

  const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  light.name  = "AmbientProbe";
  scene.add(light);
  return light;
}

// ── Bake environment to texture ───────────────────────────────────────────────
export function bakeEnvironment(renderer, scene, camera, { resolution=512 } = {}) {
  const target = new THREE.WebGLRenderTarget(resolution, resolution);
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  return target.texture;
}

// ── Probe manager ─────────────────────────────────────────────────────────────
export function createProbeManager() {
  return {
    probes:    [],
    autoUpdate:true,
    frequency: 30, // update every N frames
    frame:     0,

    add(probe, scene) {
      this.probes.push(probe);
      scene.add(probe);
    },
    remove(probe, scene) {
      this.probes = this.probes.filter(p => p !== probe);
      scene.remove(probe);
    },
    update(renderer, scene) {
      this.frame++;
      if (this.frame % this.frequency !== 0) return;
      this.probes.forEach(probe => probe.update(renderer, scene));
    },
  };
}

// ── Probe helper sphere ───────────────────────────────────────────────────────
export function createProbeHelper(probe, scene) {
  const geo    = new THREE.SphereGeometry(0.2, 16, 16);
  const mat    = new THREE.MeshStandardMaterial({
    envMap:     probe.renderTarget?.texture,
    metalness:  1.0,
    roughness:  0.0,
  });
  const helper = new THREE.Mesh(geo, mat);
  helper.position.copy(probe.position);
  helper.name  = probe.name + "_Helper";
  scene.add(helper);
  return helper;
}

export function getProbeStats(manager) {
  return {
    total:      manager.probes.length,
    reflection: manager.probes.filter(p=>p.userData.probeType==="reflection").length,
    irradiance: manager.probes.filter(p=>p.userData.probeType==="irradiance").length,
  };
}
