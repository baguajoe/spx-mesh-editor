import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export function buildCheckerTexture(size = 512, cells = 8) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  const cell = size / cells;

  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#999999" : "#222222";
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  for (let i = 0; i <= cells; i++) {
    const p = i * cell;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.needsUpdate = true;
  return tex;
}

export function applyCheckerToMesh(mesh) {
  if (!mesh) return null;

  const checker = buildCheckerTexture();

  const oldMat = mesh.material;
  const nextMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: checker,
    metalness: 0.05,
    roughness: 0.8,
  });

  if (oldMat?.side != null) nextMat.side = oldMat.side;
  mesh.material = nextMat;
  mesh.material.needsUpdate = true;
  return checker;
}

export function ensureUVAttribute(geometry) {
  if (!geometry) return null;
  if (geometry.attributes.uv) return geometry.attributes.uv;

  const pos = geometry.attributes.position;
  if (!pos) return null;

  const uv = new Float32Array(pos.count * 2);
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geometry.attributes.uv;
}

export function unwrapBoxProjection(geometry) {
  if (!geometry || !geometry.attributes.position) return geometry;

  const pos = geometry.attributes.position;
  const uvAttr = ensureUVAttribute(geometry);
  geometry.computeBoundingBox();

  const bb = geometry.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);

  const sx = Math.max(size.x, 1e-6);
  const sy = Math.max(size.y, 1e-6);
  const sz = Math.max(size.z, 1e-6);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const ax = Math.abs(x / sx);
    const ay = Math.abs(y / sy);
    const az = Math.abs(z / sz);

    let u = 0;
    let v = 0;

    if (ax >= ay && ax >= az) {
      u = (z - bb.min.z) / sz;
      v = (y - bb.min.y) / sy;
    } else if (ay >= ax && ay >= az) {
      u = (x - bb.min.x) / sx;
      v = (z - bb.min.z) / sz;
    } else {
      u = (x - bb.min.x) / sx;
      v = (y - bb.min.y) / sy;
    }

    uvAttr.setXY(i, u, v);
  }

  uvAttr.needsUpdate = true;
  return geometry;
}

export function exportUVLayoutGLB(mesh) {
  return new Promise((resolve, reject) => {
    if (!mesh) {
      reject(new Error("No mesh provided"));
      return;
    }

    const exporter = new GLTFExporter();
    exporter.parse(
      mesh,
      (result) => resolve(result),
      (error) => reject(error),
      { binary: false }
    );
  });
}
