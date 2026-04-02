/**
 * HairPhysics.js — SPX Mesh Editor
 * Position-based dynamics for hair strands: verlet integration,
 * distance constraints, stiffness, wind, collision, and volume preservation.
 */
import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Particle ─────────────────────────────────────────────────────────────
export class HairParticle {
  constructor(pos, mass = 0.1) {
    this.pos    = pos.clone();
    this.prev   = pos.clone();
    this.vel    = new THREE.Vector3();
    this.mass   = mass;
    this.pinned = mass === Infinity;
    this.radius = 0.005;
  }
  applyImpulse(force) {
    if (this.pinned) return;
    this.vel.add(force.clone().divideScalar(this.mass));
  }
  integrate(dt, gravity, damping) {
    if (this.pinned) return;
    const vel = this.pos.clone().sub(this.prev).multiplyScalar(damping);
    vel.add(gravity.clone().multiplyScalar(dt * dt));
    this.prev.copy(this.pos);
    this.pos.add(vel);
  }
}

// ─── Constraints ──────────────────────────────────────────────────────────
export class DistanceConstraint {
  constructor(p0, p1, restLength, stiffness = 1.0) {
    this.p0         = p0;
    this.p1         = p1;
    this.restLength = restLength;
    this.stiffness  = stiffness;
  }
  solve() {
    const diff = this.p1.pos.clone().sub(this.p0.pos);
    const dist = diff.length() || 0.0001;
    const err  = (dist - this.restLength) / dist;
    const corr = diff.multiplyScalar(err * 0.5 * this.stiffness);
    if (!this.p0.pinned) this.p0.pos.add(corr);
    if (!this.p1.pinned) this.p1.pos.sub(corr);
  }
}

export class BendConstraint {
  constructor(p0, p1, p2, stiffness = 0.3) {
    this.p0 = p0; this.p1 = p1; this.p2 = p2;
    this.restAngle = this._angle();
    this.stiffness = stiffness;
  }
  _angle() {
    const d01 = this.p1.pos.clone().sub(this.p0.pos).normalize();
    const d12 = this.p2.pos.clone().sub(this.p1.pos).normalize();
    return Math.acos(clamp(d01.dot(d12), -1, 1));
  }
  solve() {
    const angle = this._angle();
    const diff  = angle - this.restAngle;
    if (Math.abs(diff) < 0.001) return;
    const axis = this.p1.pos.clone().sub(this.p0.pos)
      .cross(this.p2.pos.clone().sub(this.p1.pos)).normalize();
    const corr = diff * this.stiffness * 0.1;
    if (!this.p1.pinned) {
      this.p1.pos.add(axis.clone().multiplyScalar(corr * 0.5));
    }
  }
}

// ─── HairStrand physics ───────────────────────────────────────────────────
export class HairStrandPhysics {
  constructor(curve, opts = {}) {
    this.segments    = curve.length - 1;
    this.restLength  = curve[0].distanceTo(curve[1]);
    this.stiffness   = opts.stiffness  ?? 0.7;
    this.damping     = opts.damping    ?? 0.92;
    this.bendStr     = opts.bendStr    ?? 0.3;
    this.particles   = curve.map((p, i) =>
      new HairParticle(p, i === 0 ? Infinity : opts.mass ?? 0.1)
    );
    this.distConstraints = [];
    this.bendConstraints = [];
    for (let i = 0; i < this.particles.length - 1; i++) {
      this.distConstraints.push(
        new DistanceConstraint(this.particles[i], this.particles[i+1], this.restLength, this.stiffness)
      );
    }
    for (let i = 0; i < this.particles.length - 2; i++) {
      this.bendConstraints.push(
        new BendConstraint(this.particles[i], this.particles[i+1], this.particles[i+2], this.bendStr)
      );
    }
  }

  step(dt, gravity, windForce, iterations = 4) {
    this.particles.forEach(p => p.integrate(dt, gravity, this.damping));
    this.particles.forEach(p => { if (!p.pinned) p.pos.add(windForce.clone().multiplyScalar(dt * dt * 0.08)); });
    for (let i = 0; i < iterations; i++) {
      this.distConstraints.forEach(c => c.solve());
      this.bendConstraints.forEach(c => c.solve());
    }
  }

  resolveCollision(collider) {
    this.particles.forEach(p => {
      if (p.pinned) return;
      const d = p.pos.distanceTo(collider.center);
      const r = collider.radius + p.radius;
      if (d < r) {
        const n = p.pos.clone().sub(collider.center).normalize();
        p.pos.copy(collider.center).add(n.multiplyScalar(r));
      }
    });
  }

  applyStiffnessToRest(restCurve, stiffnessFactor = 0.05) {
    this.particles.forEach((p, i) => {
      if (p.pinned || !restCurve[i]) return;
      p.pos.lerp(restCurve[i], stiffnessFactor);
    });
  }

  getPositions() { return this.particles.map(p => p.pos.clone()); }

  updateMeshGeometry(geometry) {
    const pos = geometry.attributes.position;
    if (!pos) return;
    const N    = this.particles.length;
    const right = new THREE.Vector3(1, 0, 0);
    const w     = 0.006;
    for (let i = 0; i < N; i++) {
      const p = this.particles[i].pos;
      const b = i * 2;
      pos.setXYZ(b,   p.x - right.x*w, p.y - right.y*w, p.z - right.z*w);
      pos.setXYZ(b+1, p.x + right.x*w, p.y + right.y*w, p.z + right.z*w);
    }
    pos.needsUpdate = true;
  }

  toJSON() {
    return { segments: this.segments, restLength: this.restLength,
      stiffness: this.stiffness, damping: this.damping };
  }
}

// ─── HairPhysicsWorld ────────────────────────────────────────────────────
export class HairPhysicsWorld {
  constructor(opts = {}) {
    this.gravity     = new THREE.Vector3(0, -9.8 * (opts.gravity ?? 0.5), 0);
    this.windForce   = new THREE.Vector3();
    this.colliders   = [];
    this.strands     = new Map();
    this.iterations  = opts.iterations ?? 4;
    this.substeps    = opts.substeps   ?? 2;
    this._time       = 0;
    this._paused     = false;
  }

  addStrand(id, curve, opts = {}) {
    this.strands.set(id, new HairStrandPhysics(curve, opts));
    return this;
  }

  removeStrand(id) { this.strands.delete(id); }

  addCollider(center, radius) {
    this.colliders.push({ center: center.clone(), radius });
    return this;
  }

  setWind(direction, strength) {
    this.windForce.copy(direction).normalize().multiplyScalar(strength);
  }

  step(dt) {
    if (this._paused) return;
    const subDt = dt / this.substeps;
    for (let sub = 0; sub < this.substeps; sub++) {
      this.strands.forEach(strand => {
        strand.step(subDt, this.gravity, this.windForce, this.iterations);
        this.colliders.forEach(c => strand.resolveCollision(c));
      });
    }
    this._time += dt;
  }

  applyStiffness(restCurves, factor = 0.04) {
    this.strands.forEach((strand, id) => {
      const rest = restCurves.get(id);
      if (rest) strand.applyStiffnessToRest(rest, factor);
    });
  }

  pause()  { this._paused = true;  }
  resume() { this._paused = false; }
  get time() { return this._time; }

  dispose() { this.strands.clear(); this.colliders = []; }

  toJSON() {
    return { gravity: this.gravity.toArray(), iterations: this.iterations,
      substeps: this.substeps, strandCount: this.strands.size };
  }
}

export default HairPhysicsWorld;

export class VolumeConstraint {
  constructor(particles, restVolume, stiffness = 0.2) {
    this.particles   = particles;
    this.restVolume  = restVolume;
    this.stiffness   = stiffness;
  }
  solve() {
    if (this.particles.length < 3) return;
    const center = new THREE.Vector3();
    this.particles.forEach(p => center.add(p.pos));
    center.divideScalar(this.particles.length);
    const radius = this.particles.reduce((s, p) => s + p.pos.distanceTo(center), 0) / this.particles.length;
    const targetR = Math.pow(this.restVolume * 0.75 / Math.PI, 1/3);
    if (Math.abs(radius - targetR) < 0.001) return;
    const scale = (1 + (targetR - radius) / Math.max(radius, 0.001) * this.stiffness);
    this.particles.forEach(p => {
      if (!p.pinned) p.pos.sub(center).multiplyScalar(scale).add(center);
    });
  }
}

export function createVerletRope(start, end, segments, opts = {}) {
  const particles   = [];
  const constraints = [];
  const segLen = start.distanceTo(end) / segments;
  for (let i = 0; i <= segments; i++) {
    const t   = i / segments;
    const pos = start.clone().lerp(end, t);
    particles.push(new HairParticle(pos, i === 0 ? Infinity : opts.mass ?? 0.1));
  }
  for (let i = 0; i < particles.length - 1; i++) {
    constraints.push(new DistanceConstraint(particles[i], particles[i+1], segLen, opts.stiffness ?? 0.9));
  }
  for (let i = 0; i < particles.length - 2; i++) {
    constraints.push(new BendConstraint(particles[i], particles[i+1], particles[i+2], opts.bendStr ?? 0.3));
  }
  return { particles, constraints,
    step(dt, gravity, wind, iters = 4) {
      particles.forEach(p => p.integrate(dt, gravity, opts.damping ?? 0.92));
      particles.forEach(p => { if (!p.pinned) p.pos.add(wind.clone().multiplyScalar(dt*dt*0.05)); });
      for (let i = 0; i < iters; i++) constraints.forEach(c => c.solve());
    },
    getPositions() { return particles.map(p => p.pos.clone()); },
  };
}

export function computeHairVolume(strands) {
  if (!strands.length) return 0;
  const bbox = { min:new THREE.Vector3(Infinity,Infinity,Infinity), max:new THREE.Vector3(-Infinity,-Infinity,-Infinity) };
  strands.forEach(s => s.curve.forEach(p => { bbox.min.min(p); bbox.max.max(p); }));
  const size = bbox.max.clone().sub(bbox.min);
  return size.x * size.y * size.z;
}

export function detectHairSelfCollision(strands, radius = 0.01) {
  const collisions = [];
  for (let i = 0; i < strands.length; i++) {
    for (let j = i + 1; j < Math.min(strands.length, i + 20); j++) {
      const dist = strands[i].rootPos.distanceTo(strands[j].rootPos);
      if (dist < radius * 2) collisions.push({ a:i, b:j, dist });
    }
  }
  return collisions;
}

export function applyWindField(particles, windField, time, dt) {
  particles.forEach(p => {
    if (p.pinned) return;
    const nx = Math.sin(p.pos.x * 2 + time * 0.8) * windField.turbulence;
    const nz = Math.cos(p.pos.z * 2 + time * 0.6) * windField.turbulence;
    const force = new THREE.Vector3(
      windField.direction.x * windField.strength + nx,
      0,
      windField.direction.z * windField.strength + nz,
    );
    p.vel.add(force.multiplyScalar(dt * dt));
  });
}

export function getSimulationStats(world) {
  return {
    strandCount:    world.strands.size,
    colliderCount:  world.colliders.length,
    time:           world.time.toFixed(3),
    paused:         world._paused,
    substeps:       world.substeps,
    iterations:     world.iterations,
  };
}

export function buildQuickSimulation(curve, gravity=0.5, stiffness=0.7) {
  const strand = new HairStrandPhysics(curve, { stiffness, damping:0.90, bendStr:0.3 });
  const grav   = new THREE.Vector3(0, -9.8*gravity, 0);
  const wind   = new THREE.Vector3();
  return {
    strand,
    step(dt) { strand.step(dt, grav, wind, 4); },
    setWind(dir, str) { wind.copy(dir).normalize().multiplyScalar(str); },
    getPositions() { return strand.getPositions(); },
    updateGeometry(geo) { strand.updateMeshGeometry(geo); },
  };
}
export function estimateSimulationCost(strandCount, segmentsPerStrand, iterations, substeps) {
  const constraintsPerStrand = (segmentsPerStrand - 1) + (segmentsPerStrand - 2);
  const opsPerFrame = strandCount * (segmentsPerStrand + constraintsPerStrand * iterations) * substeps;
  return { opsPerFrame, estimatedMs: (opsPerFrame / 1_000_000 * 16).toFixed(2), tier: opsPerFrame < 500000 ? 'Fast' : opsPerFrame < 2000000 ? 'Medium' : 'Heavy' };
}
export function resetSimulation(world, restCurves) {
  world.strands.forEach((strand, id) => {
    const rest = restCurves.get(id);
    if (!rest) return;
    const pts = strand.particles;
    pts.forEach((p, i) => { if (rest[i]) { p.pos.copy(rest[i]); p.prev.copy(rest[i]); p.vel.set(0,0,0); } });
  });
}
export function getPhysicsDebugData(world) {
  const result = { strands:[], colliders:world.colliders.map(c=>({center:c.center.toArray(),radius:c.radius})) };
  world.strands.forEach((strand, id) => {
    result.strands.push({ id, particleCount:strand.particles.length, positions:strand.getPositions().map(p=>p.toArray()) });
  });
  return result;
}
export function createWindGust(direction, peakStrength, duration) {
  let elapsed = 0;
  return {
    direction: direction.clone().normalize(),
    update(dt) {
      elapsed += dt;
      if (elapsed >= duration) return new THREE.Vector3();
      const t = elapsed / duration;
      const str = peakStrength * Math.sin(t * Math.PI);
      return direction.clone().normalize().multiplyScalar(str);
    },
    isDone() { return elapsed >= duration; },
  };
}

export function buildSpringSystem(points, stiffness=0.8, damping=0.9) {
  const particles   = points.map((p,i) => new HairParticle(p, i===0?Infinity:0.1));
  const constraints = [];
  for (let i=0; i<particles.length-1; i++) {
    constraints.push(new DistanceConstraint(particles[i], particles[i+1],
      particles[i].pos.distanceTo(particles[i+1].pos), stiffness));
  }
  const gravity = new THREE.Vector3(0,-4.9,0);
  return {
    particles, constraints,
    step(dt, damp=damping) {
      particles.forEach(p=>p.integrate(dt, gravity, damp));
      for(let i=0;i<4;i++) constraints.forEach(c=>c.solve());
    },
    getPositions() { return particles.map(p=>p.pos.clone()); },
    addImpulse(idx, force) { particles[idx]?.applyImpulse(force); },
    pin(idx) { if(particles[idx]) particles[idx].mass=Infinity; particles[idx].pinned=true; },
    unpin(idx) { if(particles[idx]) particles[idx].mass=0.1; particles[idx].pinned=false; },
  };
}
export function computeConstraintError(world) {
  let totalErr = 0, count = 0;
  world.strands.forEach(strand => {
    for(let i=0; i<strand.distConstraints.length; i++) {
      const c    = strand.distConstraints[i];
      const dist = c.p0.pos.distanceTo(c.p1.pos);
      totalErr  += Math.abs(dist - c.restLength);
      count++;
    }
  });
  return count > 0 ? totalErr / count : 0;
}
export function applyExternalForce(world, force, radius, center) {
  world.strands.forEach(strand => {
    strand.particles.forEach(p => {
      if (p.pinned) return;
      const dist = p.pos.distanceTo(center);
      if (dist < radius) {
        const w = 1 - dist/radius;
        p.vel.add(force.clone().multiplyScalar(w * 0.1));
      }
    });
  });
}
export function freezeStrands(world, ids) {
  ids.forEach(id => {
    const strand = world.strands.get(id);
    strand?.particles.forEach(p => { p.prev.copy(p.pos); p.vel.set(0,0,0); });
  });
}
export function serializePhysicsWorld(world) {
  return JSON.stringify({
    strandCount: world.strands.size, colliderCount: world.colliders.length,
    gravity: world.gravity.toArray(), time: world.time, paused: world._paused,
    substeps: world.substeps, iterations: world.iterations,
  });
}

export function buildConstraintGraph(strand) {
  const nodes=strand.particles.map((p,i)=>({id:i,pos:p.pos.toArray(),pinned:p.pinned,mass:p.mass}));
  const edges=strand.distConstraints.map((c,i)=>({id:i,type:'distance',restLength:c.restLength,stiffness:c.stiffness}));
  return {nodes,edges,strandLength:strand.restLength*strand.segments};
}
export function getParticleVelocities(strand) {
  return strand.particles.map(p=>({vel:p.vel.clone(),speed:p.vel.length()}));
}
export function clampParticleVelocities(strand, maxSpeed=2.0) {
  strand.particles.forEach(p=>{
    const spd=p.vel.length();
    if(spd>maxSpeed) p.vel.multiplyScalar(maxSpeed/spd);
  });
}
export function teleportStrand(strand, newRootPos) {
  const offset=newRootPos.clone().sub(strand.particles[0].pos);
  strand.particles.forEach(p=>{p.pos.add(offset);p.prev.add(offset);});
}
export function computeStrandCurvature(strand) {
  const pts=strand.getPositions();
  const curvatures=[];
  for(let i=1;i<pts.length-1;i++){
    const d1=pts[i].clone().sub(pts[i-1]);
    const d2=pts[i+1].clone().sub(pts[i]);
    const cross=d1.clone().cross(d2);
    const denom=d1.length()*d2.length()*d1.length();
    curvatures.push(denom>0.0001?cross.length()/denom:0);
  }
  return curvatures;
}
export function getSimulationSnapshot(world) {
  const strands=[];
  world.strands.forEach((strand,id)=>{
    strands.push({id,positions:strand.getPositions().map(p=>p.toArray())});
  });
  return {strands,time:world.time,windForce:world.windForce.toArray()};
}
