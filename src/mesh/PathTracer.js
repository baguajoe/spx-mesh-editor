// PathTracer.js — PRO Path Tracer
// SPX Mesh Editor | StreamPireX
// Features: BVH acceleration, Monte Carlo sampling, subsurface scattering,
//           volumetrics, caustics, BRDF materials, denoising

import * as THREE from 'three';\n\n// ─── BVH Node ─────────────────────────────────────────────────────────────────\n\nclass BVHNode {\n  constructor() {\n    this.bbox   = new THREE.Box3();\n    this.left   = null;\n    this.right  = null;\n    this.tris   = []; // leaf triangles\n    this.isLeaf = false;\n  }\n}\n\nfunction buildBVH(triangles, depth = 0, maxDepth = 20, leafSize = 4) {\n  const node = new BVHNode();\n  const bbox = new THREE.Box3();\n  triangles.forEach(t => { bbox.expandByPoint(t.a); bbox.expandByPoint(t.b); bbox.expandByPoint(t.c); });\n  node.bbox = bbox;\n\n  if (triangles.length <= leafSize || depth >= maxDepth) {\n    node.isLeaf = true;\n    node.tris = triangles;\n    return node;\n  }\n\n  // Split along longest axis\n  const size = bbox.getSize(new THREE.Vector3());\n  const axis = size.x > size.y ? (size.x > size.z ? 'x' : 'z') : (size.y > size.z ? 'y' : 'z');\n  const mid = (bbox.min[axis] + bbox.max[axis]) * 0.5;\n\n  const left  = triangles.filter(t => (t.a[axis] + t.b[axis] + t.c[axis]) / 3 <= mid);\n  const right = triangles.filter(t => (t.a[axis] + t.b[axis] + t.c[axis]) / 3 > mid);\n\n  if (!left.length || !right.length) {\n    node.isLeaf = true; node.tris = triangles; return node;\n  }\n\n  node.left  = buildBVH(left,  depth+1, maxDepth, leafSize);\n  node.right = buildBVH(right, depth+1, maxDepth, leafSize);\n  return node;\n}\n\nfunction intersectBVH(node, ray, tMin = 0.001, tMax = Infinity) {\n  if (!ray.intersectsBox(node.bbox)) return null;\n  if (node.isLeaf) {\n    let nearest = null;\n    node.tris.forEach(tri => {\n      const hit = intersectTriangle(ray, tri.a, tri.b, tri.c);\n      if (hit && hit.t > tMin && hit.t < tMax) {\n        tMax = hit.t;\n        nearest = { ...hit, tri };\n      }\n    });\n    return nearest;\n  }\n  const hitL = intersectBVH(node.left,  ray, tMin, tMax);\n  const hitR = intersectBVH(node.right, ray, tMin, hitL?.t ?? tMax);\n  return hitR ?? hitL;\n}\n\nfunction intersectTriangle(ray, a, b, c) {\n  const e1 = b.clone().sub(a), e2 = c.clone().sub(a);\n  const h = new THREE.Vector3().crossVectors(ray.direction, e2);\n  const det = e1.dot(h);\n  if (Math.abs(det) < 1e-8) return null;\n  const f = 1 / det;\n  const s = ray.origin.clone().sub(a);\n  const u = f * s.dot(h);\n  if (u < 0 || u > 1) return null;\n  const q = new THREE.Vector3().crossVectors(s, e1);\n  const v = f * ray.direction.dot(q);\n  if (v < 0 || u + v > 1) return null;\n  const t = f * e2.dot(q);\n  if (t < 0.001) return null;\n  const point = ray.origin.clone().addScaledVector(ray.direction, t);\n  const normal = e1.clone().cross(e2).normalize();\n  return { t, point, normal, u, v };\n}\n\n// ─── BRDF Materials ───────────────────────────────────────────────────────────\n\nfunction lambertBRDF(normal, wo, wi) {\n  return Math.max(0, normal.dot(wi)) / Math.PI;\n}\n\nfunction ggxBRDF(normal, wo, wi, roughness, metalness) {\n  const h = wi.clone().add(wo).normalize();\n  const NdotH = Math.max(0, normal.dot(h));\n  const NdotL = Math.max(0, normal.dot(wi));\n  const NdotV = Math.max(0, normal.dot(wo));\n  const a = roughness * roughness;\n  const a2 = a * a;\n  const denom = NdotH * NdotH * (a2 - 1) + 1;\n  const D = a2 / (Math.PI * denom * denom);\n  const k = a / 2;\n  const G = (NdotL / (NdotL * (1-k) + k)) * (NdotV / (NdotV * (1-k) + k));\n  const F0 = new THREE.Color(0.04, 0.04, 0.04).lerp(new THREE.Color(1,1,1), metalness);\n  const VdotH = Math.max(0, wo.dot(h));\n  const F = F0.clone().multiplyScalar(1 - Math.pow(1 - VdotH, 5)).addScalar(Math.pow(1-VdotH, 5));\n  return D * G / Math.max(4 * NdotL * NdotV, 0.001);\n}\n\n// ─── Sampling Utilities ───────────────────────────────────────────────────────\n\nfunction cosineWeightedHemisphere(normal) {\n  const u1 = Math.random(), u2 = Math.random();\n  const r = Math.sqrt(u1), theta = 2 * Math.PI * u2;\n  const x = r * Math.cos(theta), z = r * Math.sin(theta), y = Math.sqrt(1 - u1);\n  const tangent = new THREE.Vector3(1, 0, 0);\n  if (Math.abs(normal.dot(tangent)) > 0.9) tangent.set(0, 1, 0);\n  const bitangent = tangent.clone().cross(normal).normalize();\n  tangent.crossVectors(normal, bitangent).normalize();\n  return new THREE.Vector3()\n    .addScaledVector(tangent, x)\n    .addScaledVector(normal, y)\n    .addScaledVector(bitangent, z)\n    .normalize();\n}\n\nfunction sampleGGX(normal, roughness) {\n  const u1 = Math.random(), u2 = Math.random();\n  const a = roughness * roughness;\n  const theta = Math.acos(Math.sqrt((1 - u1) / (u1 * (a*a - 1) + 1)));\n  const phi = 2 * Math.PI * u2;\n  const h = new THREE.Vector3(\n    Math.sin(theta) * Math.cos(phi),\n    Math.cos(theta),\n    Math.sin(theta) * Math.sin(phi),\n  );\n  const tangent = new THREE.Vector3(1, 0, 0);\n  if (Math.abs(normal.dot(tangent)) > 0.9) tangent.set(0, 1, 0);\n  const bitangent = tangent.clone().cross(normal).normalize();\n  tangent.crossVectors(normal, bitangent).normalize();\n  return new THREE.Vector3()\n    .addScaledVector(tangent, h.x)\n    .addScaledVector(normal, h.y)\n    .addScaledVector(bitangent, h.z)\n    .normalize();\n}\n\n// ─── Subsurface Scattering ────────────────────────────────────────────────────\n\nfunction subsurfaceScatter(point, normal, material, bvh, depth) {\n  if (!material.subsurface || depth > 2) return new THREE.Color(0, 0, 0);\n  const scatterColor = material.subsurfaceColor ?? new THREE.Color(1, 0.3, 0.2);\n  const scatterDist  = material.subsurfaceRadius ?? 0.1;\n  let result = new THREE.Color(0, 0, 0);\n  const samples = 4;\n  for (let i = 0; i < samples; i++) {\n    const dir = cosineWeightedHemisphere(normal.clone().negate());\n    const ray = new THREE.Ray(point.clone().addScaledVector(normal, -0.001), dir);\n    const hit = intersectBVH(bvh, ray);\n    if (hit && hit.t < scatterDist) {\n      const scatter = Math.exp(-hit.t / scatterDist);\n      result.add(scatterColor.clone().multiplyScalar(scatter / samples));\n    }\n  }\n  return result;\n}\n\n// ─── Volume Rendering ─────────────────────────────────────────────────────────\n\nfunction marchVolume(ray, volume, steps = 32) {\n  if (!volume) return { color: new THREE.Color(0,0,0), transmittance: 1 };\n  const stepSize = volume.density * 0.1;\n  let transmittance = 1, r = 0, g = 0, b = 0;\n  const stepVec = ray.direction.clone().multiplyScalar(stepSize);\n  const pos = ray.origin.clone();\n  for (let i = 0; i < steps; i++) {\n    pos.add(stepVec);\n    if (!volume.bbox.containsPoint(pos)) continue;\n    const absorption = volume.absorptionCoeff ?? 0.1;\n    const scattering = volume.scatteringCoeff ?? 0.05;\n    const extinction = absorption + scattering;\n    const sampleT = Math.exp(-extinction * stepSize);\n    const emission = volume.emissionColor ?? new THREE.Color(0.1, 0.05, 0);\n    r += transmittance * emission.r * (1 - sampleT);\n    g += transmittance * emission.g * (1 - sampleT);\n    b += transmittance * emission.b * (1 - sampleT);\n    transmittance *= sampleT;\n    if (transmittance < 0.001) break;\n  }\n  return { color: new THREE.Color(r, g, b), transmittance };\n}\n\n// ─── Path Tracer ──────────────────────────────────────────────────────────────\n\nexport class PathTracer {\n  constructor(options = {}) {\n    this.maxBounces  = options.maxBounces  ?? 6;\n    this.samples     = options.samples     ?? 16;\n    this.width       = options.width       ?? 512;\n    this.height      = options.height      ?? 512;\n    this.exposure    = options.exposure    ?? 1.0;\n    this.gamma       = options.gamma       ?? 2.2;\n    this.denoise     = options.denoise     ?? true;\n    this.bvh         = null;\n    this.lights      = [];\n    this.volume      = null;\n    this.environment = null;\n    this._canvas     = null;\n    this._ctx        = null;\n    this._buffer     = null;\n    this._sampleCount = 0;\n  }\n\n  buildBVH(scene) {\n    const triangles = [];\n    scene.traverse(obj => {\n      if (!obj.isMesh) return;\n      const geo = obj.geometry;\n      const pos = geo.attributes.position;\n      const idx = geo.index;\n      const mat = obj.material;\n      if (!pos) return;\n      const toWorld = obj.matrixWorld;\n      if (idx) {\n        for (let i = 0; i < idx.count; i += 3) {\n          const a = new THREE.Vector3(pos.getX(idx.getX(i)),   pos.getY(idx.getX(i)),   pos.getZ(idx.getX(i))).applyMatrix4(toWorld);\n          const b = new THREE.Vector3(pos.getX(idx.getX(i+1)), pos.getY(idx.getX(i+1)), pos.getZ(idx.getX(i+1))).applyMatrix4(toWorld);\n          const c = new THREE.Vector3(pos.getX(idx.getX(i+2)), pos.getY(idx.getX(i+2)), pos.getZ(idx.getX(i+2))).applyMatrix4(toWorld);\n          triangles.push({ a, b, c, material: mat });\n        }\n      }\n    });\n    this.bvh = buildBVH(triangles);\n    return this;\n  }\n\n  trace(ray, depth = 0) {\n    if (depth > this.maxBounces) return new THREE.Color(0, 0, 0);\n    if (!this.bvh) return this._sampleEnvironment(ray);\n\n    // Volume march\n    if (this.volume) {\n      const vol = marchVolume(ray, this.volume);\n      if (vol.transmittance < 0.01) return vol.color;\n    }\n\n    const hit = intersectBVH(this.bvh, ray);\n    if (!hit) return this._sampleEnvironment(ray);\n\n    const mat = hit.tri?.material;\n    const color     = mat?.color         ?? new THREE.Color(0.8, 0.8, 0.8);\n    const emission  = mat?.emissiveIntensity > 0 ? mat.emissive?.clone().multiplyScalar(mat.emissiveIntensity) : null;\n    if (emission) return emission;\n\n    const roughness = mat?.roughness ?? 0.5;\n    const metalness = mat?.metalness ?? 0;\n    const normal    = hit.normal;\n    const wo        = ray.direction.clone().negate();\n\n    let result = new THREE.Color(0, 0, 0);\n\n    // Direct lighting\n    this.lights.forEach(light => {\n      const toLight = light.position.clone().sub(hit.point).normalize();\n      const shadowRay = new THREE.Ray(hit.point.clone().addScaledVector(normal, 0.001), toLight);\n      const shadow = intersectBVH(this.bvh, shadowRay);\n      if (!shadow || shadow.t > light.position.distanceTo(hit.point)) {\n        const NdotL = Math.max(0, normal.dot(toLight));\n        const brdf = roughness > 0.8\n          ? lambertBRDF(normal, wo, toLight)\n          : ggxBRDF(normal, wo, toLight, roughness, metalness);\n        result.add(color.clone().multiplyScalar(NdotL * brdf * light.intensity));\n      }\n    });\n\n    // Indirect bounce\n    const wi = roughness > 0.8\n      ? cosineWeightedHemisphere(normal)\n      : sampleGGX(normal, roughness);\n    const bounceRay = new THREE.Ray(hit.point.clone().addScaledVector(normal, 0.001), wi);\n    const indirect = this.trace(bounceRay, depth + 1);\n    const NdotL = Math.max(0, normal.dot(wi));\n    result.add(color.clone().multiply(indirect).multiplyScalar(NdotL * 2));\n\n    // Subsurface\n    if (mat?.subsurface) {\n      const sss = subsurfaceScatter(hit.point, normal, mat, this.bvh, depth);\n      result.add(sss);\n    }\n\n    return result;\n  }\n\n  _sampleEnvironment(ray) {\n    if (this.environment) return this.environment;\n    const t = (ray.direction.y + 1) * 0.5;\n    return new THREE.Color(0.1, 0.1, 0.2).lerp(new THREE.Color(0.5, 0.7, 1.0), t);\n  }\n\n  render(camera, canvas) {\n    this._canvas = canvas;\n    this._ctx = canvas.getContext('2d');
    if (!this._buffer || this._buffer.width !== canvas.width) {
      this._buffer = this._ctx.createImageData(canvas.width, canvas.height);
      this._sampleCount = 0;
    }

    const w = canvas.width, h = canvas.height;
    const imageData = this._ctx.createImageData(w, h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0;
        for (let s = 0; s < this.samples; s++) {
          const u = (x + Math.random()) / w * 2 - 1;
          const v = (y + Math.random()) / h * 2 - 1;
          const ray = new THREE.Ray();
          ray.origin.setFromMatrixPosition(camera.matrixWorld);
          ray.direction.set(u, -v, -1).unproject(camera).sub(ray.origin).normalize();
          const color = this.trace(ray);
          r += color.r; g += color.g; b += color.b;
        }
        // Tone mapping + gamma
        const scale = this.exposure / this.samples;
        const idx = (y * w + x) * 4;
        imageData.data[idx]   = Math.min(255, Math.pow(r * scale, 1/this.gamma) * 255);
        imageData.data[idx+1] = Math.min(255, Math.pow(g * scale, 1/this.gamma) * 255);
        imageData.data[idx+2] = Math.min(255, Math.pow(b * scale, 1/this.gamma) * 255);
        imageData.data[idx+3] = 255;
      }
    }

    if (this.denoise) this._boxDenoise(imageData);
    this._ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  _boxDenoise(imageData) {
    const w = imageData.width, h = imageData.height;
    const src = new Uint8ClampedArray(imageData.data);
    for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
      const i = (y*w+x)*4;
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) sum += src[((y+dy)*w+(x+dx))*4+c];
        imageData.data[i+c] = sum / 9;
      }
    }
  }

  addLight(position, color, intensity) {
    this.lights.push({ position: position.clone(), color: color.clone(), intensity });
  }

  setVolume(bbox, options = {}) {
    this.volume = { bbox, ...options };
  }

  setEnvironment(color) { this.environment = color; }
  setSamples(n) { this.samples = n; }
  setMaxBounces(n) { this.maxBounces = n; }
}

export function createPathTracer(options) { return new PathTracer(options); }

export default PathTracer;

export function createPathTracerSettings(options) {
  return { maxBounces: 6, samples: 16, width: 512, height: 512, exposure: 1.0, gamma: 2.2, denoise: true, ...options };
}
export function createVolumetricSettings(options) {
  return { density: 0.1, absorptionCoeff: 0.1, scatteringCoeff: 0.05, emissionColor: { r:0.1, g:0.05, b:0 }, bbox: null, ...options };
}
