// IrradianceBaker.js — Real-time GI / Lightmap Baking
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
