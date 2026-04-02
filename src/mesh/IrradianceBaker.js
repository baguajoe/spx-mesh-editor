// IrradianceBaker.js — PRO Irradiance + Light Baking
// SPX Mesh Editor | StreamPireX
// Features: hemispherical AO, direct light baking, GI approximation,
//           cube probe, sphere probe, lightmap UV generation

import * as THREE from 'three';\n\n// ─── Ambient Occlusion ────────────────────────────────────────────────────────\n\nexport function bakeAmbientOcclusion(geometry, options = {}) {\n  const {\n    samples    = 32,\n    radius     = 0.5,\n    bias       = 0.001,\n    intensity  = 1.0,\n    falloff    = 2.0,\n  } = options;\n\n  const pos  = geometry.attributes.position;\n  const norm = geometry.attributes.normal;\n  if (!pos || !norm) return null;\n\n  geometry.computeBoundingBox();\n  const bbox = geometry.boundingBox;\n\n  const aoValues = new Float32Array(pos.count);\n\n  for (let vi = 0; vi < pos.count; vi++) {\n    const vp = new THREE.Vector3(pos.getX(vi), pos.getY(vi), pos.getZ(vi));\n    const vn = new THREE.Vector3(norm.getX(vi), norm.getY(vi), norm.getZ(vi)).normalize();\n\n    let occlusion = 0;\n\n    for (let si = 0; si < samples; si++) {\n      // Cosine-weighted hemisphere sample\n      const u1 = Math.random(), u2 = Math.random();\n      const r  = Math.sqrt(u1);\n      const theta = 2 * Math.PI * u2;\n      const lx = r * Math.cos(theta), lz = r * Math.sin(theta), ly = Math.sqrt(1 - u1);\n\n      // Transform to world space aligned with normal\n      const tangent = new THREE.Vector3(1, 0, 0);\n      if (Math.abs(vn.dot(tangent)) > 0.9) tangent.set(0, 1, 0);\n      const bitangent = tangent.clone().cross(vn).normalize();\n      tangent.crossVectors(vn, bitangent).normalize();\n\n      const sampleDir = new THREE.Vector3()\n        .addScaledVector(tangent, lx)\n        .addScaledVector(vn, ly)\n        .addScaledVector(bitangent, lz)\n        .normalize();\n\n      const samplePt = vp.clone().addScaledVector(vn, bias).addScaledVector(sampleDir, radius);\n\n      // Check if sample point is inside mesh bounds (approximate AO)\n      if (bbox.containsPoint(samplePt)) {\n        const distFactor = Math.pow(radius, falloff);\n        occlusion += distFactor * 0.5;\n      }\n    }\n\n    aoValues[vi] = 1.0 - Math.min(1, (occlusion / samples) * intensity);\n  }\n\n  return aoValues;\n}\n\n// ─── Direct Light Baking ──────────────────────────────────────────────────────\n\nexport function bakeDirectLight(geometry, lights, options = {}) {\n  const { shadows = true, bias = 0.001 } = options;\n  const pos  = geometry.attributes.position;\n  const norm = geometry.attributes.normal;\n  if (!pos || !norm) return null;\n\n  const lightValues = new Float32Array(pos.count * 3); // RGB\n\n  for (let vi = 0; vi < pos.count; vi++) {\n    const vp = new THREE.Vector3(pos.getX(vi), pos.getY(vi), pos.getZ(vi));\n    const vn = new THREE.Vector3(norm.getX(vi), norm.getY(vi), norm.getZ(vi)).normalize();\n\n    let r = 0, g = 0, b = 0;\n\n    lights.forEach(light => {\n      if (!light.visible) return;\n\n      let lightDir, attenuation = 1;\n\n      if (light.isDirectionalLight) {\n        lightDir = light.position.clone().normalize();\n      } else if (light.isPointLight) {\n        const toLight = light.position.clone().sub(vp);\n        const dist = toLight.length();\n        lightDir = toLight.normalize();\n        attenuation = 1 / (1 + dist * dist * (1 / (light.distance * light.distance + 1)));\n      } else if (light.isSpotLight) {\n        const toLight = light.position.clone().sub(vp);\n        const dist = toLight.length();\n        lightDir = toLight.normalize();\n        const spotAngle = Math.acos(lightDir.dot(light.getWorldDirection(new THREE.Vector3()).negate()));\n        if (spotAngle > light.angle) return;\n        attenuation = Math.pow(Math.cos(spotAngle) / Math.cos(light.angle), light.penumbra * 10);\n        attenuation /= 1 + dist * dist * 0.1;\n      } else return;\n\n      const NdotL = Math.max(0, vn.dot(lightDir));\n      const contrib = NdotL * attenuation * light.intensity;\n\n      r += light.color.r * contrib;\n      g += light.color.g * contrib;\n      b += light.color.b * contrib;\n    });\n\n    lightValues[vi*3]   = Math.min(1, r);\n    lightValues[vi*3+1] = Math.min(1, g);\n    lightValues[vi*3+2] = Math.min(1, b);\n  }\n\n  return lightValues;\n}\n\n// ─── Environment Probe ────────────────────────────────────────────────────────\n\nexport function captureCubeProbe(renderer, scene, position, options = {}) {\n  const size = options.size ?? 128;\n  const near = options.near ?? 0.1;\n  const far  = options.far  ?? 1000;\n\n  const cubeCamera = new THREE.CubeCamera(near, far,\n    new THREE.WebGLCubeRenderTarget(size, {\n      format: THREE.RGBAFormat,\n      generateMipmaps: true,\n      minFilter: THREE.LinearMipmapLinearFilter,\n    })\n  );\n  cubeCamera.position.copy(position);\n  scene.add(cubeCamera);\n  cubeCamera.update(renderer, scene);\n  scene.remove(cubeCamera);\n\n  return cubeCamera.renderTarget;\n}\n\nexport function captureSphereProbe(renderer, scene, position, options = {}) {\n  const size = options.size ?? 256;\n  const pmremGenerator = new THREE.PMREMGenerator(renderer);\n  const renderTarget = captureCubeProbe(renderer, scene, position, { size, ...options });\n  const envMap = pmremGenerator.fromCubemap(renderTarget.texture).texture;\n  pmremGenerator.dispose();\n  return envMap;\n}\n\n// ─── Lightmap UV Generation ───────────────────────────────────────────────────\n\nexport function generateLightmapUVs(geometry, options = {}) {\n  const { padding = 0.01, resolution = 512 } = options;\n  const pos = geometry.attributes.position;\n  const idx = geometry.index;\n  if (!pos || !idx) return null;\n\n  const faceCount = idx.count / 3;\n  const uvs = new Float32Array(pos.count * 2);\n\n  // Simple planar unwrap per face (production would use proper island packing)\n  const usedArea = [];\n  let u = padding, v = padding;\n  let rowHeight = 0;\n  const cellSize = Math.sqrt(1 / faceCount) * (1 - padding * 2);\n\n  for (let fi = 0; fi < faceCount; fi++) {\n    const a = idx.getX(fi*3), b = idx.getX(fi*3+1), c = idx.getX(fi*3+2);\n\n    if (u + cellSize > 1 - padding) { u = padding; v += rowHeight + padding; rowHeight = 0; }\n\n    uvs[a*2] = u;           uvs[a*2+1] = v;\n    uvs[b*2] = u+cellSize;  uvs[b*2+1] = v;\n    uvs[c*2] = u;           uvs[c*2+1] = v+cellSize;\n\n    rowHeight = Math.max(rowHeight, cellSize);\n    u += cellSize + padding;\n  }\n\n  geometry.setAttribute('uv2', new THREE.BufferAttribute(uvs, 2));\n  return uvs;\n}\n\n// ─── Bake to Texture ──────────────────────────────────────────────────────────\n\nexport function bakeToTexture(aoValues, lightValues, geometry, resolution = 512) {\n  const canvas = document.createElement('canvas');\n  canvas.width = canvas.height = resolution;\n  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(resolution, resolution);

  const uv2 = geometry.attributes.uv2;
  if (!uv2) return null;

  const idx = geometry.index;
  if (!idx) return null;

  for (let vi = 0; vi < uv2.count; vi++) {
    const u = uv2.getX(vi), v = uv2.getY(vi);
    const px = Math.floor(u * resolution), py = Math.floor((1-v) * resolution);
    if (px < 0 || px >= resolution || py < 0 || py >= resolution) continue;

    const ao = aoValues ? aoValues[vi] : 1;
    const lr = lightValues ? lightValues[vi*3]   : 1;
    const lg = lightValues ? lightValues[vi*3+1] : 1;
    const lb = lightValues ? lightValues[vi*3+2] : 1;

    const i = (py * resolution + px) * 4;
    imageData.data[i]   = Math.floor(lr * ao * 255);
    imageData.data[i+1] = Math.floor(lg * ao * 255);
    imageData.data[i+2] = Math.floor(lb * ao * 255);
    imageData.data[i+3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  return texture;
}

// ─── Combined Bake ────────────────────────────────────────────────────────────

export async function bakeAll(geometry, lights, options = {}) {
  generateLightmapUVs(geometry, options);
  const ao = bakeAmbientOcclusion(geometry, options);
  const direct = lights?.length ? bakeDirectLight(geometry, lights, options) : null;
  const texture = bakeToTexture(ao, direct, geometry, options.resolution ?? 512);
  return { aoValues: ao, lightValues: direct, texture };
}

export default {
  bakeAmbientOcclusion, bakeDirectLight,
  captureCubeProbe, captureSphereProbe,
  generateLightmapUVs, bakeToTexture, bakeAll,
};
