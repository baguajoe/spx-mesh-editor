import * as THREE from "three";

export function createCreature(){
  const body=new THREE.Mesh(
    new THREE.SphereGeometry(1,32,32),
    new THREE.MeshStandardMaterial({color:0x883333})
  );

  const head=new THREE.Mesh(
    new THREE.SphereGeometry(.6,32,32),
    new THREE.MeshStandardMaterial({color:0xaa5555})
  );

  head.position.y=1;

  const group=new THREE.Group();
  group.add(body);
  group.add(head);

  return group;
}
