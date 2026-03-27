

import * as THREE from "three";


export function createSceneObject(type){

let mesh

switch(type){

case "cube":

mesh = new THREE.Mesh(

new THREE.BoxGeometry(1,1,1),

new THREE.MeshStandardMaterial()

)

break


case "sphere":

mesh = new THREE.Mesh(

new THREE.SphereGeometry(0.75,32,32),

new THREE.MeshStandardMaterial()

)

break


case "cylinder":

mesh = new THREE.Mesh(

new THREE.CylinderGeometry(0.6,0.6,1.5,32),

new THREE.MeshStandardMaterial()

)

break


case "cone":

mesh = new THREE.Mesh(

new THREE.ConeGeometry(0.6,1.5,32),

new THREE.MeshStandardMaterial()

)

break


case "torus":

mesh = new THREE.Mesh(

new THREE.TorusGeometry(0.6,0.25,32,64),

new THREE.MeshStandardMaterial()

)

break


case "plane":

mesh = new THREE.Mesh(

new THREE.PlaneGeometry(2,2),

new THREE.MeshStandardMaterial({side:THREE.DoubleSide})

)

break


case "circle":

mesh = new THREE.Mesh(

new THREE.CircleGeometry(1,32),

new THREE.MeshStandardMaterial({side:THREE.DoubleSide})

)

break


case "icosphere":

mesh = new THREE.Mesh(

new THREE.IcosahedronGeometry(0.8,2),

new THREE.MeshStandardMaterial()

)

break


default:

mesh = new THREE.Mesh(

new THREE.BoxGeometry(1,1,1),

new THREE.MeshStandardMaterial()

)

}

mesh.castShadow=true

mesh.receiveShadow=true

return mesh

}


export function buildPrimitiveMesh(type){

return createSceneObject(type)

}

