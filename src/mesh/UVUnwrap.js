
/**
 * SPX Mesh Editor — UV Unwrap
 * Box projection, sphere projection, planar projection
 * + UV editor panel data
 */
import * as THREE from "three";

// Box projection UV mapping
export function uvBoxProject(geometry) {
  const geo  = geometry.clone();
  const pos  = geo.attributes.position;
  const uvs  = new Float32Array(pos.count * 2);
  for (let i=0;i<pos.count;i++) {
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    const ax=Math.abs(x), ay=Math.abs(y), az=Math.abs(z);
    let u,v;
    if (ax>=ay && ax>=az) { u=z/ax*0.5+0.5; v=y/ax*0.5+0.5; }
    else if (ay>=ax && ay>=az) { u=x/ay*0.5+0.5; v=z/ay*0.5+0.5; }
    else { u=x/az*0.5+0.5; v=y/az*0.5+0.5; }
    uvs[i*2]=u; uvs[i*2+1]=v;
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs,2));
  return geo;
}

// Sphere projection UV mapping
export function uvSphereProject(geometry) {
  const geo = geometry.clone();
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count*2);
  for (let i=0;i<pos.count;i++) {
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    const r = Math.sqrt(x*x+y*y+z*z)||1;
    const u = 0.5 + Math.atan2(z,x)/(2*Math.PI);
    const v = 0.5 - Math.asin(y/r)/Math.PI;
    uvs[i*2]=u; uvs[i*2+1]=v;
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs,2));
  return geo;
}

// Planar projection UV mapping (project onto XY plane)
export function uvPlanarProject(geometry, axis="z") {
  const geo = geometry.clone();
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count*2);
  // Compute bounding box for normalization
  const bbox = new THREE.Box3().setFromBufferAttribute(pos);
  const size = bbox.getSize(new THREE.Vector3());
  const min  = bbox.min;
  for (let i=0;i<pos.count;i++) {
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    let u,v;
    if (axis==="z") { u=(x-min.x)/(size.x||1); v=(y-min.y)/(size.y||1); }
    else if (axis==="y") { u=(x-min.x)/(size.x||1); v=(z-min.z)/(size.z||1); }
    else { u=(z-min.z)/(size.z||1); v=(y-min.y)/(size.y||1); }
    uvs[i*2]=u; uvs[i*2+1]=v;
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs,2));
  return geo;
}

// Get UV islands data for the 2D UV editor view
export function getUVIslands(geometry) {
  const uv  = geometry.attributes.uv;
  const idx = geometry.index;
  if (!uv) return [];
  const tris = [];
  if (idx) {
    for (let i=0;i<idx.count;i+=3) {
      tris.push([
        {u:uv.getX(idx.array[i]),   v:uv.getY(idx.array[i])},
        {u:uv.getX(idx.array[i+1]), v:uv.getY(idx.array[i+1])},
        {u:uv.getX(idx.array[i+2]), v:uv.getY(idx.array[i+2])},
      ]);
    }
  } else {
    for (let i=0;i<uv.count;i+=3) {
      tris.push([
        {u:uv.getX(i),   v:uv.getY(i)},
        {u:uv.getX(i+1), v:uv.getY(i+1)},
        {u:uv.getX(i+2), v:uv.getY(i+2)},
      ]);
    }
  }
  return tris;
}
