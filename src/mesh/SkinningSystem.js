import * as THREE from "three";

// ── Convert regular mesh to skinned mesh ──────────────────────────────────────
export function createSkinnedMesh(mesh, skeleton) {
  const geo = mesh.geometry.clone();

  // Add skin weights if not present
  if (!geo.attributes.skinWeight) {
    const count   = geo.attributes.position.count;
    const indices = new Float32Array(count * 4).fill(0);
    const weights = new Float32Array(count * 4).fill(0);
    for (let i = 0; i < count; i++) weights[i*4] = 1.0;
    geo.setAttribute("skinIndex",  new THREE.BufferAttribute(indices, 4));
    geo.setAttribute("skinWeight", new THREE.BufferAttribute(weights, 4));
  }

  const mat     = new THREE.MeshStandardMaterial({
    color:        mesh.material?.color || 0x888888,
    roughness:    0.5,
    metalness:    0.1,
    skinning:     true,
  });

  const skinned = new THREE.SkinnedMesh(geo, mat);
  skinned.add(skeleton.bones[0]);
  skinned.bind(skeleton);
  skinned.name = mesh.name + "_skinned";
  return skinned;
}

// ── Auto-bind mesh to armature ────────────────────────────────────────────────
export function bindMeshToArmature(mesh, armature) {
  const bones   = armature.userData.bones || [];
  if (!bones.length) return null;

  const threeBones = bones.map(b => {
    const tb = new THREE.Bone();
    tb.name  = b.name;
    tb.position.copy(b.position);
    tb.rotation.copy(b.rotation);
    return tb;
  });

  // Parent bones matching armature hierarchy
  bones.forEach((b, i) => {
    if (b.userData.parentId) {
      const parentIdx = bones.findIndex(pb => pb.userData.boneId === b.userData.parentId);
      if (parentIdx >= 0) threeBones[parentIdx].add(threeBones[i]);
    }
  });

  const skeleton   = new THREE.Skeleton(threeBones);
  const skinned    = createSkinnedMesh(mesh, skeleton);

  // Auto-weight
  autoWeightByProximity(skinned, threeBones);

  return skinned;
}

// ── Auto-weight by proximity ──────────────────────────────────────────────────
function autoWeightByProximity(skinned, bones) {
  const geo     = skinned.geometry;
  const pos     = geo.attributes.position;
  const weights = geo.attributes.skinWeight;
  const indices = geo.attributes.skinIndex;
  const tmp     = new THREE.Vector3();
  const bonePos = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    tmp.fromBufferAttribute(pos, i);
    const dists = bones.map((b, bi) => {
      bonePos.setFromMatrixPosition(b.matrixWorld);
      return { bi, d: tmp.distanceTo(bonePos) };
    }).sort((a,b) => a.d - b.d).slice(0,4);

    const total = dists.reduce((s,d)=>s+(1/(d.d+0.001)),0);
    dists.forEach((d,slot) => {
      indices.setComponent(i, slot, d.bi);
      weights.setComponent(i, slot, (1/(d.d+0.001))/total);
    });
  }
  indices.needsUpdate = weights.needsUpdate = true;
}

// ── Build AnimationMixer for a skinned mesh ───────────────────────────────────
export function createMixer(skinnedMesh) {
  return new THREE.AnimationMixer(skinnedMesh);
}

// ── Play animation clip on mixer ──────────────────────────────────────────────
export function playClip(mixer, clip, loop = true) {
  const action = mixer.clipAction(clip);
  action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
  action.play();
  return action;
}
