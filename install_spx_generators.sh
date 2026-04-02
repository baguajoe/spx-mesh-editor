#!/bin/bash

echo "========================================="
echo "SPX GENERATOR INSTALLER"
echo "Face + Foliage + Vehicle + Creature"
echo "========================================="

ROOT=$(pwd)

echo ""
echo "Creating folders..."

mkdir -p src/generators
mkdir -p src/generators/face
mkdir -p src/generators/foliage
mkdir -p src/generators/vehicle
mkdir -p src/generators/creature

mkdir -p src/panels/generators
mkdir -p src/mesh/generators

echo ""
echo "Installing dependencies..."

npm install three uuid zustand

echo ""
echo "FACE GENERATOR..."

cat <<'EOT' > src/generators/face/FaceGenerator.js
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
EOT

cat <<'EOT' > src/panels/generators/FaceGeneratorPanel.js
import React,{useState} from "react";
import { createFaceMesh } from "../../generators/face/FaceGenerator";

export default function FaceGeneratorPanel({ addObject }){
  const [width,setWidth]=useState(1);
  const [height,setHeight]=useState(1.2);

  function generate(){
    const mesh=createFaceMesh({ width, height });
    addObject(mesh);
  }

  return(
    <div className="spx-panel">
      <h3>Face Generator</h3>

      <label>Head Width</label>
      <input
        type="range"
        min=".7"
        max="1.3"
        step=".01"
        value={width}
        onChange={e=>setWidth(Number(e.target.value))}
      />

      <label>Head Height</label>
      <input
        type="range"
        min=".7"
        max="1.6"
        step=".01"
        value={height}
        onChange={e=>setHeight(Number(e.target.value))}
      />

      <button onClick={generate}>Generate Face</button>
    </div>
  );
}
EOT

echo ""
echo "FOLIAGE GENERATOR..."

cat <<'EOT' > src/generators/foliage/FoliageGenerator.js
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
EOT

cat <<'EOT' > src/panels/generators/FoliageGeneratorPanel.js
import React from "react";
import { createTree } from "../../generators/foliage/FoliageGenerator";

export default function FoliageGeneratorPanel({ addObject }){
  return(
    <div className="spx-panel">
      <h3>Foliage Generator</h3>
      <button onClick={() => addObject(createTree())}>
        Generate Tree
      </button>
    </div>
  );
}
EOT

echo ""
echo "VEHICLE GENERATOR..."

cat <<'EOT' > src/generators/vehicle/VehicleGenerator.js
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
EOT

cat <<'EOT' > src/panels/generators/VehicleGeneratorPanel.js
import React from "react";
import { createVehicle } from "../../generators/vehicle/VehicleGenerator";

export default function VehicleGeneratorPanel({ addObject }){
  return(
    <div className="spx-panel">
      <h3>Vehicle Generator</h3>
      <button onClick={() => addObject(createVehicle())}>
        Generate Vehicle
      </button>
    </div>
  );
}
EOT

echo ""
echo "CREATURE GENERATOR UI..."

cat <<'EOT' > src/generators/creature/CreatureGenerator.js
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
EOT

cat <<'EOT' > src/panels/generators/CreatureGeneratorPanel.js
import React from "react";
import { createCreature } from "../../generators/creature/CreatureGenerator";

export default function CreatureGeneratorPanel({ addObject }){
  return(
    <div className="spx-panel">
      <h3>Creature Generator</h3>
      <button onClick={() => addObject(createCreature())}>
        Generate Creature
      </button>
    </div>
  );
}
EOT

echo ""
echo "Registering panels..."

touch src/panels/GeneratorRegistry.js

if ! grep -q "FaceGeneratorPanel" src/panels/GeneratorRegistry.js; then
cat <<'EOT' >> src/panels/GeneratorRegistry.js

import FaceGeneratorPanel from "./generators/FaceGeneratorPanel";
import FoliageGeneratorPanel from "./generators/FoliageGeneratorPanel";
import VehicleGeneratorPanel from "./generators/VehicleGeneratorPanel";
import CreatureGeneratorPanel from "./generators/CreatureGeneratorPanel";

export const SPX_NEW_GENERATORS = {
  face_generator: FaceGeneratorPanel,
  foliage_generator: FoliageGeneratorPanel,
  vehicle_generator: VehicleGeneratorPanel,
  creature_generator: CreatureGeneratorPanel
};
EOT
fi

echo ""
echo "DONE"
echo ""
echo "Run:"
echo "chmod +x install_spx_generators.sh"
echo "./install_spx_generators.sh"
