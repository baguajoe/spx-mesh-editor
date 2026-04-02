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
