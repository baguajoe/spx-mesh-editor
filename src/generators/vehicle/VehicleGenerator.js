import * as THREE from "three";

export function createVehicle(){
  const body=new THREE.Mesh(
    new THREE.BoxGeometry(2,.5,1),
    new THREE.MeshStandardMaterial({color:0x222222})
  );

  const wheelGeo=new THREE.CylinderGeometry(.25,.25,.2,24);
  const wheelMat=new THREE.MeshStandardMaterial({color:0x111111});

  function wheel(x,z){
    const w=new THREE.Mesh(wheelGeo,wheelMat);
    w.rotation.z=Math.PI/2;
    w.position.set(x,-.3,z);
    return w;
  }

  const group=new THREE.Group();
  group.add(body);
  group.add(wheel(.8,.5));
  group.add(wheel(-.8,.5));
  group.add(wheel(.8,-.5));
  group.add(wheel(-.8,-.5));

  return group;
}
