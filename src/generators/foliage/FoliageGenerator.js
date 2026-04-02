import * as THREE from "three";

export function createTree(params={}){
  const trunk=new THREE.Mesh(
    new THREE.CylinderGeometry(.1,.2,2,12),
    new THREE.MeshStandardMaterial({color:0x7a5230})
  );

  const leaves=new THREE.Mesh(
    new THREE.SphereGeometry(.8,32,32),
    new THREE.MeshStandardMaterial({color:0x2e8b57})
  );

  leaves.position.y=1.3;

  const group=new THREE.Group();
  group.add(trunk);
  group.add(leaves);

  return group;
}
