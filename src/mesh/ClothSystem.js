import * as THREE from "three";

// ── Cloth particle ────────────────────────────────────────────────────────────
export function createClothParticle(position, mass=1.0) {
  return {
    position:   position.clone(),
    prevPos:    position.clone(),
    velocity:   new THREE.Vector3(),
    force:      new THREE.Vector3(),
    mass,
    invMass:    mass > 0 ? 1/mass : 0,
    pinned:     false,
    pinWeight:  0,
  };
}

// ── Create cloth from mesh ────────────────────────────────────────────────────
export function createCloth(mesh, options = {}) {
  const {
    mass        = 1.0,
    stiffness   = 0.9,
    damping     = 0.99,
    gravity     = -9.8,
    iterations  = 8,
    windForce   = new THREE.Vector3(0,0,0),
  } = options;

  const geo  = mesh.geometry;
  const pos  = geo.attributes.position;
  const idx  = geo.index;
  if (!pos) return null;

  const mat = mesh.matrixWorld;

  // Create particles
  const particles = [];
  for (let i=0; i<pos.count; i++) {
    const p = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mat);
    particles.push(createClothParticle(p, mass));
  }

  // Create constraints from edges
  const constraints = [];
  const edgeSet = new Set();

  if (idx) {
    const arr = idx.array;
    for (let i=0; i<arr.length; i+=3) {
      for (let k=0; k<3; k++) {
        const a = arr[i+k], b = arr[i+(k+1)%3];
        const key = Math.min(a,b)+"_"+Math.max(a,b);
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          const restLen = particles[a].position.distanceTo(particles[b].position);
          constraints.push({ a, b, restLen, stiffness });
        }
      }
      // Shear constraints
      const a=arr[i], b=arr[i+1], c=arr[i+2];
      const key2 = Math.min(a,c)+"_"+Math.max(a,c);
      if (!edgeSet.has(key2)) {
        edgeSet.add(key2);
        const restLen = particles[a].position.distanceTo(particles[c].position);
        constraints.push({ a, b:c, restLen, stiffness:stiffness*0.5 });
      }
    }
  }

  return {
    mesh, particles, constraints,
    gravity, damping, iterations, windForce,
    originalGeo: geo.clone(),
  };
}

// ── Step cloth simulation ─────────────────────────────────────────────────────
export function stepCloth(cloth, dt=1/60) {
  const { particles, constraints, gravity, damping, iterations, windForce } = cloth;
  const gravVec = new THREE.Vector3(0, gravity*0.001, 0);

  // Apply forces + integrate (Verlet)
  particles.forEach(p => {
    if (p.pinned) return;
    const acc = new THREE.Vector3().addScaledVector(gravVec, p.invMass);
    acc.add(windForce.clone().multiplyScalar(p.invMass*0.001));
    const temp = p.position.clone();
    p.position.addScaledVector(
      p.position.clone().sub(p.prevPos).multiplyScalar(damping), 1
    ).add(acc.multiplyScalar(dt*dt*3600));
    p.prevPos.copy(temp);
  });

  // Solve constraints
  for (let iter=0; iter<iterations; iter++) {
    constraints.forEach(c => {
      const pa = particles[c.a], pb = particles[c.b];
      if (pa.invMass === 0 && pb.invMass === 0) return;
      const diff   = pb.position.clone().sub(pa.position);
      const dist   = diff.length();
      if (dist === 0) return;
      const error  = (dist - c.restLen) / dist;
      const corr   = diff.multiplyScalar(error * c.stiffness);
      const totalW = pa.invMass + pb.invMass;
      if (totalW === 0) return;
      if (!pa.pinned) pa.position.addScaledVector(corr,  pa.invMass/totalW);
      if (!pb.pinned) pb.position.addScaledVector(corr, -pb.invMass/totalW);
    });
  }

  // Write positions back to geometry
  const pos = cloth.mesh.geometry.attributes.position;
  const inv = cloth.mesh.matrixWorld.clone().invert();
  particles.forEach((p,i) => {
    const local = p.position.clone().applyMatrix4(inv);
    pos.setXYZ(i, local.x, local.y, local.z);
  });
  pos.needsUpdate = true;
  cloth.mesh.geometry.computeVertexNormals();
}

// ── Presets ───────────────────────────────────────────────────────────────────
export const CLOTH_PRESETS = {
  silk:    { stiffness:0.6, damping:0.995, gravity:-9.8, label:"Silk" },
  cotton:  { stiffness:0.8, damping:0.99,  gravity:-9.8, label:"Cotton" },
  denim:   { stiffness:0.95,damping:0.98,  gravity:-9.8, label:"Denim" },
  rubber:  { stiffness:0.5, damping:0.97,  gravity:-9.8, label:"Rubber" },
  leather: { stiffness:0.9, damping:0.985, gravity:-9.8, label:"Leather" },
  silk_light:{ stiffness:0.5,damping:0.998,gravity:-9.8, label:"Light Silk" },
};

export function applyClothPreset(cloth, presetKey) {
  const preset = CLOTH_PRESETS[presetKey];
  if (!preset) return;
  cloth.constraints.forEach(c => c.stiffness = preset.stiffness);
  cloth.damping = preset.damping;
  cloth.gravity = preset.gravity;
}

export function resetCloth(cloth) {
  const pos = cloth.originalGeo.attributes.position;
  const mat = cloth.mesh.matrixWorld;
  cloth.particles.forEach((p,i) => {
    const wp = new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i)).applyMatrix4(mat);
    p.position.copy(wp);
    p.prevPos.copy(wp);
    p.velocity.set(0,0,0);
  });
}

export function getClothStats(cloth) {
  const pinned = cloth.particles.filter(p=>p.pinned).length;
  return {
    particles:   cloth.particles.length,
    constraints: cloth.constraints.length,
    pinned,
  };
}
