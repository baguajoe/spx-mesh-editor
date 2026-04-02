import * as THREE from "three";

export function generateProp(type = "crate") {
  let mesh;

  switch (type) {
    case "crate":
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      );
      break;

    case "barrel":
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
        new THREE.MeshStandardMaterial()
      );
      break;

    case "table": {
      mesh = new THREE.Group();

      const top = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.1, 1),
        new THREE.MeshStandardMaterial()
      );
      top.position.y = 0.75;
      mesh.add(top);

      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.75, 0.1),
          new THREE.MeshStandardMaterial()
        );

        leg.position.set(
          i < 2 ? -0.9 : 0.9,
          0.375,
          i % 2 ? -0.4 : 0.4
        );

        mesh.add(leg);
      }
      break;
    }

    case "sci_panel":
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.05, 1),
        new THREE.MeshStandardMaterial({
          metalness: 0.8,
          roughness: 0.3
        })
      );
      break;

    default:
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshStandardMaterial()
      );
  }

  mesh.name = "prop_" + type;
  return mesh;
}
