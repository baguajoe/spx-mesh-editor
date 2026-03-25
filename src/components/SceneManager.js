import * as THREE from "three";

export function createSceneObject(type, name, mesh) {
  return {
    id:       crypto.randomUUID(),
    name:     name || `${type}_${Date.now()}`,
    type,
    visible:  true,
    parentId: null,
    mesh,
  };
}

export function serializeScene(objects) {
  return objects.map(o => ({
    id:       o.id,
    name:     o.name,
    type:     o.type,
    visible:  o.visible,
    parentId: o.parentId,
    position: o.mesh ? o.mesh.position.toArray() : [0,0,0],
    rotation: o.mesh ? [o.mesh.rotation.x, o.mesh.rotation.y, o.mesh.rotation.z] : [0,0,0],
    scale:    o.mesh ? o.mesh.scale.toArray() : [1,1,1],
  }));
}

export function saveScene(objects) {
  const data = { version: 1, timestamp: Date.now(), objects: serializeScene(objects) };
  localStorage.setItem("spx_scene", JSON.stringify(data));
  return data;
}

export function loadSceneData() {
  try {
    const raw = localStorage.getItem("spx_scene");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function buildPrimitiveMesh(type, color = "#888888") {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
  let geo;
  switch (type) {
    case "sphere":    geo = new THREE.SphereGeometry(1, 32, 24); break;
    case "cylinder":  geo = new THREE.CylinderGeometry(0.5, 0.5, 2, 32); break;
    case "torus":     geo = new THREE.TorusGeometry(1, 0.35, 16, 64); break;
    case "plane":     geo = new THREE.PlaneGeometry(2, 2, 8, 8); break;
    case "icosphere": geo = new THREE.IcosahedronGeometry(1, 2); break;
    default:          geo = new THREE.BoxGeometry(1, 1, 1); break;
  }
  return new THREE.Mesh(geo, mat);
}

export async function exportSceneGLB(objects, filename = "spx_scene.glb") {
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const group = new THREE.Group();
  objects.forEach(o => {
    if (o.mesh && o.visible !== false) {
      const clone = o.mesh.clone();
      clone.name = o.name;
      group.add(clone);
    }
  });
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(group, (glb) => {
      const blob = new Blob([glb], { type: "model/gltf-binary" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, reject, { binary: true });
  });
}

export async function pushSceneToStreamPireX(objects, stats, matProps) {
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const group = new THREE.Group();
  objects.forEach(o => {
    if (o.mesh && o.visible !== false) {
      const clone = o.mesh.clone();
      clone.name = o.name;
      group.add(clone);
    }
  });
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(group, (glb) => {
      const arr = new Uint8Array(glb);
      const b64 = btoa(String.fromCharCode(...arr.slice(0, Math.min(arr.length, 500000))));
      sessionStorage.setItem("spx_mesh_glb_b64", b64);
      localStorage.setItem("spx_mesh_ready", JSON.stringify({
        timestamp: Date.now(),
        objectCount: objects.length,
        objects: objects.map(o => ({ id: o.id, name: o.name, type: o.type })),
        stats,
        material: matProps,
      }));
      resolve();
    }, reject, { binary: true });
  });
}
