import * as THREE from "three";

export function createFaceMesh(params = {}) {
  const geo = new THREE.SphereGeometry(1,64,64);

  geo.scale(
    params.width || 1,
    params.height || 1.2,
    params.depth || 1
  );

  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: 0xf1c7a3,
      roughness: .5
    })
  );
}
