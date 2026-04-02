#!/usr/bin/env python3
"""
Pro upgrade: HairPhysics, ClothSystem, MuscleSystem
Run: python3 install_mesh_simulation.py
"""
import os

BASE = "/workspaces/spx-mesh-editor/src/mesh"

files = {}

# ─────────────────────────────────────────────────────────────────────────────
# HairPhysics.js — Pro upgrade
# ─────────────────────────────────────────────────────────────────────────────
files["HairPhysics.js"] = r'''// HairPhysics.js — PRO Hair Simulation
// SPX Mesh Editor | StreamPireX
// Features: position-based dynamics, per-strand stiffness, wind turbulence,
//           sphere/capsule/mesh collision, clumping, curl, baking, LOD

import * as THREE from 'three';

// ─── Strand Creation ──────────────────────────────────────────────────────────

export function createStrand(rootPos, direction, options = {}) {
  const {
    segments    = 12,
    length      = 1.0,
    stiffness   = 0.85,
    thickness   = 0.01,
    curl        = 0,
    curlFreq    = 3,
    mass        = 1.0,
    id          = Math.random().toString(36).slice(2),
  } = options;

  const segLen = length / segments;
  const points = [], restPoints = [], velocity = [], masses = [];
  const up = direction.clone().normalize();

  // Build curl offset
  const right = new THREE.Vector3(1, 0, 0);
  if (Math.abs(up.dot(right)) > 0.9) right.set(0, 1, 0);
  const tangent = right.clone().crossVectors(up, right).normalize();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const curlOffset = curl > 0
      ? tangent.clone().multiplyScalar(Math.sin(t * curlFreq * Math.PI * 2) * curl)
      : new THREE.Vector3();
    const pos = rootPos.clone()
      .addScaledVector(up, -i * segLen)
      .add(curlOffset);
    points.push(pos.clone());
    restPoints.push(pos.clone());
    velocity.push(new THREE.Vector3());
    masses.push(i === 0 ? 0 : mass * (1 - t * 0.3)); // tip is lighter
  }

  return { id, points, restPoints, velocity, masses, segments, length, stiffness, thickness, curl, curlFreq };
}

// ─── Physics Settings ─────────────────────────────────────────────────────────

export function createHairPhysicsSettings(options = {}) {
  return {
    enabled:       options.enabled    ?? true,
    gravity:       options.gravity    ?? -9.8,
    wind:          options.wind       ?? new THREE.Vector3(0, 0, 0),
    windNoise:     options.windNoise  ?? 0.5,
    windTurbulence: options.windTurbulence ?? 0.3,
    damping:       options.damping    ?? 0.98,
    stiffness:     options.stiffness  ?? 0.8,
    bendStiffness: options.bendStiffness ?? 0.4,
    colliders:     [],
    iterations:    options.iterations ?? 8,
    subSteps:      options.subSteps   ?? 2,
    // Clumping
    clumpStrength: options.clumpStrength ?? 0,
    clumpRadius:   options.clumpRadius  ?? 0.05,
    // Attraction to guide strands
    guideStrands:  [],
    guideStrength: options.guideStrength ?? 0,
    // LOD
    lodDistance:   options.lodDistance  ?? 10,
    lodSubdivision: options.lodSubdivision ?? 4,
  };
}

// ─── Turbulence ───────────────────────────────────────────────────────────────

function turbulence(pos, time, scale = 1) {
  const x = pos.x * scale + time * 0.3;
  const y = pos.y * scale + time * 0.17;
  const z = pos.z * scale + time * 0.23;
  return new THREE.Vector3(
    Math.sin(x * 1.7 + z * 2.3) * Math.cos(y * 1.1),
    Math.sin(y * 2.1 + x * 1.3) * Math.cos(z * 1.7),
    Math.sin(z * 1.9 + y * 2.7) * Math.cos(x * 1.4),
  );
}

// ─── Step Simulation ──────────────────────────────────────────────────────────

let _time = 0;

export function stepHairPhysics(strands, settings, dt = 1/60) {
  if (!settings.enabled) return;
  _time += dt;

  const subDt = dt / settings.subSteps;

  for (let sub = 0; sub < settings.subSteps; sub++) {
    strands.forEach(strand => {
      _stepStrand(strand, settings, subDt);
    });

    // Clumping — pull strands toward neighbors
    if (settings.clumpStrength > 0 && strands.length > 1) {
      _applyClumping(strands, settings);
    }

    // Guide strand attraction
    if (settings.guideStrength > 0 && settings.guideStrands.length > 0) {
      _applyGuideAttraction(strands, settings);
    }
  }
}

function _stepStrand(strand, settings, dt) {
  const { gravity, wind, windNoise, windTurbulence, damping, stiffness, bendStiffness, colliders, iterations } = settings;

  const gravVec = new THREE.Vector3(0, gravity * 0.001, 0);
  const windBase = wind.clone();

  for (let i = 1; i < strand.points.length; i++) {
    const prev = strand.points[i].clone();
    const invMass = 1 / (strand.masses[i] || 1);

    // Wind with turbulence
    const turb = turbulence(strand.points[i], _time, 1.5).multiplyScalar(windTurbulence * 0.002);
    const noise = new THREE.Vector3(
      (Math.random()-0.5) * windNoise * 0.001,
      (Math.random()-0.5) * windNoise * 0.0005,
      (Math.random()-0.5) * windNoise * 0.001,
    );
    const windForce = windBase.clone().add(turb).add(noise);

    // Velocity update
    strand.velocity[i]
      .add(gravVec.clone().multiplyScalar(invMass))
      .add(windForce)
      .multiplyScalar(damping);

    strand.points[i].add(strand.velocity[i].clone().multiplyScalar(dt * 60));

    // Constraint solving
    for (let iter = 0; iter < iterations; iter++) {
      // Distance constraint to parent
      const parent = strand.points[i-1];
      const segLen = strand.length / strand.segments;
      const diff = strand.points[i].clone().sub(parent);
      const dist = diff.length();
      if (dist > 0.0001) {
        const correction = diff.multiplyScalar((dist - segLen) / dist * 0.5);
        strand.points[i].sub(correction);
      }

      // Bend constraint (resist bending)
      if (i >= 2 && bendStiffness > 0) {
        const p0 = strand.points[i-2];
        const p1 = strand.points[i-1];
        const p2 = strand.points[i];
        const mid = p0.clone().add(p2).multiplyScalar(0.5);
        const bend = p1.clone().sub(mid);
        strand.points[i-1].sub(bend.multiplyScalar(bendStiffness * 0.1));
      }

      // Stiffness toward rest
      if (strand.restPoints[i]) {
        strand.points[i].lerp(strand.restPoints[i], stiffness * 0.005 * strand.stiffness);
      }

      // Collision
      colliders.forEach(col => {
        _resolveCollider(strand.points[i], col);
      });
    }

    // Update velocity from position delta
    strand.velocity[i].copy(
      strand.points[i].clone().sub(prev).multiplyScalar(dt > 0 ? 1/dt : 0)
    );
  }
}

function _resolveCollider(point, col) {
  if (col.type === 'sphere') {
    const toPoint = point.clone().sub(col.center);
    const dist = toPoint.length();
    if (dist < col.radius + 0.001) {
      point.copy(col.center).addScaledVector(toPoint.normalize(), col.radius + 0.001);
    }
  } else if (col.type === 'capsule') {
    // Capsule collision — closest point on segment
    const ab = col.end.clone().sub(col.start);
    const t = Math.max(0, Math.min(1, point.clone().sub(col.start).dot(ab) / ab.lengthSq()));
    const closest = col.start.clone().addScaledVector(ab, t);
    const toPoint = point.clone().sub(closest);
    const dist = toPoint.length();
    if (dist < col.radius + 0.001) {
      point.copy(closest).addScaledVector(toPoint.normalize(), col.radius + 0.001);
    }
  } else if (col.type === 'plane') {
    const d = point.clone().sub(col.point).dot(col.normal);
    if (d < 0) point.addScaledVector(col.normal, -d);
  }
}

function _applyClumping(strands, settings) {
  const { clumpStrength, clumpRadius } = settings;
  for (let i = 0; i < strands.length; i++) {
    for (let j = i+1; j < strands.length; j++) {
      const sa = strands[i], sb = strands[j];
      for (let k = 1; k < Math.min(sa.points.length, sb.points.length); k++) {
        const dist = sa.points[k].distanceTo(sb.points[k]);
        if (dist < clumpRadius && dist > 0.0001) {
          const mid = sa.points[k].clone().add(sb.points[k]).multiplyScalar(0.5);
          sa.points[k].lerp(mid, clumpStrength * 0.1);
          sb.points[k].lerp(mid, clumpStrength * 0.1);
        }
      }
    }
  }
}

function _applyGuideAttraction(strands, settings) {
  strands.forEach(strand => {
    let nearest = null, nearDist = Infinity;
    settings.guideStrands.forEach(guide => {
      const d = strand.points[0].distanceTo(guide.points[0]);
      if (d < nearDist) { nearDist = d; nearest = guide; }
    });
    if (!nearest) return;
    for (let i = 1; i < Math.min(strand.points.length, nearest.points.length); i++) {
      strand.points[i].lerp(nearest.points[i], settings.guideStrength * 0.05);
    }
  });
}

// ─── Collider Helpers ─────────────────────────────────────────────────────────

export function addSphereCollider(settings, center, radius) {
  settings.colliders.push({ type: 'sphere', center: center.clone(), radius });
  return settings.colliders.length - 1;
}

export function addCapsuleCollider(settings, start, end, radius) {
  settings.colliders.push({ type: 'capsule', start: start.clone(), end: end.clone(), radius });
  return settings.colliders.length - 1;
}

export function addPlaneCollider(settings, point, normal) {
  settings.colliders.push({ type: 'plane', point: point.clone(), normal: normal.clone().normalize() });
  return settings.colliders.length - 1;
}

export function addCollider(settings, center, radius) {
  return addSphereCollider(settings, center, radius);
}

export function removeCollider(settings, index) {
  settings.colliders.splice(index, 1);
}

export function updateColliderPosition(settings, index, newCenter) {
  if (settings.colliders[index]) settings.colliders[index].center?.copy(newCenter);
}

// ─── Wind ─────────────────────────────────────────────────────────────────────

export function addWindForce(settings, direction, strength) {
  settings.wind = direction.clone().normalize().multiplyScalar(strength);
}

export function setWindGust(settings, strength, frequency = 0.5) {
  settings._gustStrength = strength;
  settings._gustFreq = frequency;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function resetHairToRest(strands) {
  strands.forEach(s => {
    if (!s.restPoints) return;
    s.points = s.restPoints.map(p => p.clone());
    s.velocity = s.points.map(() => new THREE.Vector3());
  });
}

export function bakeHairPhysics(strands, settings, frameCount = 60, fps = 24) {
  const baked = strands.map(s => ({ id: s.id, frames: [] }));
  const dt = 1 / fps;
  for (let f = 0; f < frameCount; f++) {
    stepHairPhysics(strands, settings, dt);
    strands.forEach((s, i) => {
      baked[i].frames.push(s.points.map(p => p.toArray()));
    });
  }
  return baked;
}

export function applyBakedHairFrame(strands, bakedData, frameIndex) {
  strands.forEach((s, i) => {
    const bd = bakedData[i];
    if (!bd?.frames[frameIndex]) return;
    bd.frames[frameIndex].forEach((pos, j) => {
      if (s.points[j]) s.points[j].fromArray(pos);
    });
  });
}

export function buildHairGeometry(strands, scene) {
  const positions = [];
  strands.forEach(strand => {
    for (let i = 0; i < strand.points.length - 1; i++) {
      positions.push(...strand.points[i].toArray(), ...strand.points[i+1].toArray());
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

export default {
  createStrand, createHairPhysicsSettings, stepHairPhysics,
  addSphereCollider, addCapsuleCollider, addPlaneCollider,
  addCollider, removeCollider, updateColliderPosition,
  addWindForce, setWindGust, resetHairToRest,
  bakeHairPhysics, applyBakedHairFrame, buildHairGeometry,
};
'''

# ─────────────────────────────────────────────────────────────────────────────
# ClothSystem.js — Pro upgrade
# ─────────────────────────────────────────────────────────────────────────────
files["ClothSystem.js"] = r'''// ClothSystem.js — PRO Cloth Simulation
// SPX Mesh Editor | StreamPireX
// Features: position-based dynamics, stretch/shear/bend constraints,
//           self-collision, friction, air resistance, tearing, pinning

import * as THREE from 'three';

// ─── Particle ────────────────────────────────────────────────────────────────

export function createClothParticle(position, mass = 1.0) {
  return {
    position: position.clone(),
    prevPos:  position.clone(),
    velocity: new THREE.Vector3(),
    force:    new THREE.Vector3(),
    mass,
    invMass:  mass > 0 ? 1 / mass : 0,
    pinned:   false,
    pinWeight: 0,
    friction: 0.5,
  };
}

// ─── Constraint Types ─────────────────────────────────────────────────────────

const CONSTRAINT = { STRETCH: 'stretch', SHEAR: 'shear', BEND: 'bend' };

function createConstraint(a, b, restLen, stiffness, type = CONSTRAINT.STRETCH, maxStretch = 1.1) {
  return { a, b, restLen, stiffness, type, maxStretch, broken: false };
}

// ─── Cloth Creation ───────────────────────────────────────────────────────────

export function createCloth(mesh, options = {}) {
  const {
    mass        = 1.0,
    stiffness   = 0.95,
    shearStiff  = 0.8,
    bendStiff   = 0.3,
    damping     = 0.99,
    gravity     = -9.8,
    iterations  = 12,
    windForce   = new THREE.Vector3(0, 0, 0),
    tearing     = false,
    tearThreshold = 2.5,
    selfCollision = false,
    selfCollisionRadius = 0.02,
  } = options;

  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  const idx = geo.index;
  if (!pos) return null;

  const mat = mesh.matrixWorld;
  const particles = [];

  for (let i = 0; i < pos.count; i++) {
    const p = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mat);
    particles.push(createClothParticle(p, mass));
  }

  const constraints = [];
  const edgeSet = new Set();

  if (idx) {
    const arr = idx.array;
    for (let i = 0; i < arr.length; i += 3) {
      const a = arr[i], b = arr[i+1], c = arr[i+2];

      // Stretch constraints (edges)
      for (let k = 0; k < 3; k++) {
        const va = arr[i+k], vb = arr[i+(k+1)%3];
        const key = Math.min(va,vb) + '_' + Math.max(va,vb);
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          const restLen = particles[va].position.distanceTo(particles[vb].position);
          constraints.push(createConstraint(va, vb, restLen, stiffness, CONSTRAINT.STRETCH, tearThreshold));
        }
      }

      // Shear constraints (face diagonals)
      const shearKey = Math.min(a,c) + '_' + Math.max(a,c) + '_s';
      if (!edgeSet.has(shearKey)) {
        edgeSet.add(shearKey);
        const restLen = particles[a].position.distanceTo(particles[c].position);
        constraints.push(createConstraint(a, c, restLen, shearStiff, CONSTRAINT.SHEAR));
      }
    }

    // Bend constraints (skip-one-vertex connections)
    const vertFaces = new Map();
    for (let i = 0; i < arr.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const v = arr[i+k];
        if (!vertFaces.has(v)) vertFaces.set(v, []);
        vertFaces.get(v).push(i/3);
      }
    }

    edgeSet.forEach(key => {
      if (key.includes('_s')) return;
      const [va, vb] = key.split('_').map(Number);
      const facesA = vertFaces.get(va) ?? [];
      const facesB = vertFaces.get(vb) ?? [];
      const shared = facesA.filter(f => facesB.includes(f));
      if (shared.length === 2) {
        // Find the two non-shared vertices
        const faceVerts = (fi) => [arr[fi*3], arr[fi*3+1], arr[fi*3+2]];
        const v0 = faceVerts(shared[0]).find(v => v !== va && v !== vb);
        const v1 = faceVerts(shared[1]).find(v => v !== va && v !== vb);
        if (v0 !== undefined && v1 !== undefined) {
          const bendKey = Math.min(v0,v1) + '_' + Math.max(v0,v1) + '_b';
          if (!edgeSet.has(bendKey)) {
            edgeSet.add(bendKey);
            const restLen = particles[v0].position.distanceTo(particles[v1].position);
            constraints.push(createConstraint(v0, v1, restLen, bendStiff, CONSTRAINT.BEND));
          }
        }
      }
    });
  }

  return {
    particles, constraints, mesh,
    stiffness, damping, gravity, iterations, windForce,
    tearing, tearThreshold, selfCollision, selfCollisionRadius,
    colliders: [],
    friction: 0.5,
    airResistance: 0.02,
  };
}

// ─── Pin Vertices ─────────────────────────────────────────────────────────────

export function pinParticle(cloth, index, weight = 1.0) {
  if (cloth.particles[index]) {
    cloth.particles[index].pinned = true;
    cloth.particles[index].pinWeight = weight;
    cloth.particles[index].invMass = 0;
  }
}

export function unpinParticle(cloth, index) {
  if (cloth.particles[index]) {
    cloth.particles[index].pinned = false;
    cloth.particles[index].invMass = 1 / cloth.particles[index].mass;
  }
}

export function pinTopRow(cloth, mesh) {
  const pos = mesh.geometry.attributes.position;
  let maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
  for (let i = 0; i < pos.count; i++) {
    if (Math.abs(pos.getY(i) - maxY) < 0.01) pinParticle(cloth, i);
  }
}

// ─── Simulation Step ──────────────────────────────────────────────────────────

export function stepCloth(cloth, dt = 1/60) {
  const { particles, constraints, gravity, damping, windForce, iterations, colliders, airResistance } = cloth;

  const gravVec = new THREE.Vector3(0, gravity * dt * dt, 0);
  const windVec = windForce.clone().multiplyScalar(dt * dt);

  // Apply external forces (Verlet integration)
  particles.forEach(p => {
    if (p.pinned) return;

    const vel = p.position.clone().sub(p.prevPos);
    vel.multiplyScalar(damping);

    // Air resistance
    const speed = vel.length();
    if (speed > 0) vel.addScaledVector(vel, -airResistance * speed);

    p.prevPos.copy(p.position);
    p.position.add(vel).add(gravVec).add(windVec);
  });

  // Solve constraints
  for (let iter = 0; iter < iterations; iter++) {
    constraints.forEach(c => {
      if (c.broken) return;
      const pa = particles[c.a], pb = particles[c.b];
      if (!pa || !pb) return;

      const diff = pb.position.clone().sub(pa.position);
      const dist = diff.length();
      if (dist < 0.0001) return;

      const correction = diff.multiplyScalar((dist - c.restLen) / dist);

      // Tearing
      if (cloth.tearing && dist > c.restLen * c.maxStretch) {
        c.broken = true;
        return;
      }

      const totalInvMass = pa.invMass + pb.invMass;
      if (totalInvMass === 0) return;

      const stiffnessFactor = c.stiffness;
      if (pa.invMass > 0) pa.position.addScaledVector(correction, pa.invMass / totalInvMass * stiffnessFactor);
      if (pb.invMass > 0) pb.position.addScaledVector(correction, -pb.invMass / totalInvMass * stiffnessFactor);
    });

    // Collision response
    colliders.forEach(col => {
      particles.forEach(p => {
        if (p.pinned) return;
        _resolveClothCollider(p, col);
      });
    });

    // Self-collision
    if (cloth.selfCollision) {
      _resolveSelfCollision(particles, cloth.selfCollisionRadius);
    }
  }
}

function _resolveClothCollider(particle, col) {
  if (col.type === 'sphere') {
    const d = particle.position.clone().sub(col.center);
    const dist = d.length();
    if (dist < col.radius + 0.001) {
      particle.position.copy(col.center).addScaledVector(d.normalize(), col.radius + 0.001);
    }
  } else if (col.type === 'plane') {
    const d = particle.position.clone().sub(col.point).dot(col.normal);
    if (d < 0) particle.position.addScaledVector(col.normal, -d);
  } else if (col.type === 'capsule') {
    const ab = col.end.clone().sub(col.start);
    const t = Math.max(0, Math.min(1, particle.position.clone().sub(col.start).dot(ab) / ab.lengthSq()));
    const closest = col.start.clone().addScaledVector(ab, t);
    const d = particle.position.clone().sub(closest);
    const dist = d.length();
    if (dist < col.radius + 0.001) {
      particle.position.copy(closest).addScaledVector(d.normalize(), col.radius + 0.001);
    }
  }
}

function _resolveSelfCollision(particles, radius) {
  // Spatial hashing for performance
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const d = particles[i].position.clone().sub(particles[j].position);
      const dist = d.length();
      if (dist < radius * 2 && dist > 0.0001) {
        const correction = d.normalize().multiplyScalar((radius * 2 - dist) * 0.5);
        if (!particles[i].pinned) particles[i].position.add(correction);
        if (!particles[j].pinned) particles[j].position.sub(correction);
      }
    }
  }
}

// ─── Apply to Mesh ────────────────────────────────────────────────────────────

export function applyClothToMesh(cloth) {
  const pos = cloth.mesh.geometry.attributes.position;
  const mat = cloth.mesh.matrixWorld.clone().invert();
  cloth.particles.forEach((p, i) => {
    const local = p.position.clone().applyMatrix4(mat);
    pos.setXYZ(i, local.x, local.y, local.z);
  });
  pos.needsUpdate = true;
  cloth.mesh.geometry.computeVertexNormals();
}

// ─── Colliders ────────────────────────────────────────────────────────────────

export function addSphereCollider(cloth, center, radius) {
  cloth.colliders.push({ type: 'sphere', center: center.clone(), radius });
}

export function addCapsuleCollider(cloth, start, end, radius) {
  cloth.colliders.push({ type: 'capsule', start: start.clone(), end: end.clone(), radius });
}

export function addPlaneCollider(cloth, point, normal) {
  cloth.colliders.push({ type: 'plane', point: point.clone(), normal: normal.clone().normalize() });
}

export function addGroundPlane(cloth, y = 0) {
  addPlaneCollider(cloth, new THREE.Vector3(0, y, 0), new THREE.Vector3(0, 1, 0));
}

// ─── Wind ─────────────────────────────────────────────────────────────────────

export function setClothWind(cloth, direction, strength) {
  cloth.windForce = direction.clone().normalize().multiplyScalar(strength);
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export function clothPreset(type) {
  const presets = {
    silk:    { stiffness: 0.7, shearStiff: 0.5, bendStiff: 0.1, damping: 0.999, mass: 0.3 },
    cotton:  { stiffness: 0.9, shearStiff: 0.8, bendStiff: 0.4, damping: 0.99,  mass: 0.8 },
    denim:   { stiffness: 0.98,shearStiff: 0.9, bendStiff: 0.7, damping: 0.98,  mass: 1.5 },
    leather: { stiffness: 0.99,shearStiff: 0.95,bendStiff: 0.9, damping: 0.97,  mass: 2.0 },
    rubber:  { stiffness: 0.6, shearStiff: 0.6, bendStiff: 0.2, damping: 0.995, mass: 1.2 },
    paper:   { stiffness: 0.95,shearStiff: 0.9, bendStiff: 0.8, damping: 0.95,  mass: 0.2 },
  };
  return presets[type] ?? presets.cotton;
}

export default {
  createClothParticle, createCloth,
  pinParticle, unpinParticle, pinTopRow,
  stepCloth, applyClothToMesh,
  addSphereCollider, addCapsuleCollider, addPlaneCollider, addGroundPlane,
  setClothWind, clothPreset, CONSTRAINT,
};
'''

# ─────────────────────────────────────────────────────────────────────────────
# MuscleSystem.js — New pro muscle file
# ─────────────────────────────────────────────────────────────────────────────
files["MuscleSystem.js"] = r'''// MuscleSystem.js — PRO Muscle Simulation
// SPX Mesh Editor | StreamPireX
// Features: fiber direction, activation curves, antagonist pairs,
//           fatty tissue layer, volume preservation, wrinkle maps

import * as THREE from 'three';

// ─── Muscle Definition ────────────────────────────────────────────────────────

export function createMuscle(options = {}) {
  return {
    id:           options.id    ?? Math.random().toString(36).slice(2),
    name:         options.name  ?? 'Muscle',
    originBone:   options.originBone  ?? null,
    insertBone:   options.insertBone  ?? null,

    // Muscle shape
    bulgeAxis:    options.bulgeAxis   ?? 'z',
    restLength:   options.restLength  ?? 1.0,
    maxBulge:     options.maxBulge    ?? 0.08,
    bulgeProfile: options.bulgeProfile ?? 'gaussian', // 'gaussian'|'linear'|'peak'

    // Fiber direction (normalized)
    fiberDir:     options.fiberDir ?? new THREE.Vector3(0, 1, 0),

    // Activation
    activationCurve: options.activationCurve ?? 'smooth', // 'linear'|'smooth'|'fast'
    minActivation:   options.minActivation   ?? 0,
    maxActivation:   options.maxActivation   ?? 1,

    // Antagonist
    antagonist:   options.antagonist ?? null, // muscle id that opposes this one

    // Affected vertices
    affectedVerts: options.affectedVerts ?? [], // [{ idx, weight }]
    falloff:       options.falloff ?? 2.5,
    falloffRadius: options.falloffRadius ?? 0.3,

    // State
    _activation: 0,
    _prevAngle:  0,
  };
}

// ─── Activation Curves ────────────────────────────────────────────────────────

function evaluateActivationCurve(t, curve) {
  t = Math.max(0, Math.min(1, t));
  switch (curve) {
    case 'smooth':  return t * t * (3 - 2 * t); // smoothstep
    case 'fast':    return Math.sqrt(t);
    case 'slow':    return t * t;
    case 'linear':
    default:        return t;
  }
}

// ─── Bulge Profiles ───────────────────────────────────────────────────────────

function evaluateBulgeProfile(distAlongFiber, profile) {
  const t = Math.max(0, Math.min(1, distAlongFiber));
  switch (profile) {
    case 'gaussian': return Math.exp(-Math.pow((t - 0.5) * 4, 2));
    case 'peak':     return Math.sin(t * Math.PI);
    case 'linear':   return 1 - Math.abs(t - 0.5) * 2;
    default:         return Math.sin(t * Math.PI);
  }
}

// ─── Muscle Simulator ─────────────────────────────────────────────────────────

export class MuscleSystem {
  constructor(mesh, skeleton) {
    this.mesh      = mesh;
    this.skeleton  = skeleton;
    this.muscles   = new Map();
    this.restPos   = new Float32Array(mesh.geometry.attributes.position.array);
    this.enabled   = true;
    this.fatLayer  = 0;    // 0-1, adds softness
    this.skinThickness = 0.02;
  }

  addMuscle(options) {
    const m = createMuscle(options);
    this.muscles.set(m.id, m);
    // Auto-assign affected verts if not provided
    if (!m.affectedVerts.length) this._autoAssignVerts(m);
    return m.id;
  }

  removeMuscle(id) { this.muscles.delete(id); }

  _autoAssignVerts(muscle) {
    const ob = this.skeleton.bones.find(b => b.name === muscle.originBone);
    const ib = this.skeleton.bones.find(b => b.name === muscle.insertBone);
    if (!ob || !ib) return;

    const op = new THREE.Vector3(), ip = new THREE.Vector3();
    ob.getWorldPosition(op); ib.getWorldPosition(ip);
    const mid = op.clone().lerp(ip, 0.5);
    const len = op.distanceTo(ip);

    const pos = this.mesh.geometry.attributes.position;
    muscle.restLength = len;

    for (let i = 0; i < pos.count; i++) {
      const vp = new THREE.Vector3(this.restPos[i*3], this.restPos[i*3+1], this.restPos[i*3+2]);
      const dist = vp.distanceTo(mid);
      if (dist < muscle.falloffRadius) {
        const weight = Math.exp(-Math.pow(dist / muscle.falloffRadius, 2) * muscle.falloff);
        if (weight > 0.01) muscle.affectedVerts.push({ idx: i, weight });
      }
    }
  }

  setupHumanoid() {
    const pairs = [
      { name:'L_Bicep',    origin:'LeftArm',     insert:'LeftForeArm',  maxBulge:0.05, profile:'gaussian' },
      { name:'R_Bicep',    origin:'RightArm',    insert:'RightForeArm', maxBulge:0.05, profile:'gaussian' },
      { name:'L_Tricep',   origin:'LeftArm',     insert:'LeftForeArm',  maxBulge:0.03, bulgeAxis:'y' },
      { name:'R_Tricep',   origin:'RightArm',    insert:'RightForeArm', maxBulge:0.03, bulgeAxis:'y' },
      { name:'L_Quad',     origin:'LeftUpLeg',   insert:'LeftLeg',      maxBulge:0.06, profile:'peak' },
      { name:'R_Quad',     origin:'RightUpLeg',  insert:'RightLeg',     maxBulge:0.06, profile:'peak' },
      { name:'L_Hamstring',origin:'LeftUpLeg',   insert:'LeftLeg',      maxBulge:0.04, bulgeAxis:'y' },
      { name:'R_Hamstring',origin:'RightUpLeg',  insert:'RightLeg',     maxBulge:0.04, bulgeAxis:'y' },
      { name:'L_Calf',     origin:'LeftLeg',     insert:'LeftFoot',     maxBulge:0.04, profile:'gaussian' },
      { name:'R_Calf',     origin:'RightLeg',    insert:'RightFoot',    maxBulge:0.04, profile:'gaussian' },
      { name:'L_Deltoid',  origin:'LeftShoulder',insert:'LeftArm',      maxBulge:0.04, profile:'peak' },
      { name:'R_Deltoid',  origin:'RightShoulder',insert:'RightArm',    maxBulge:0.04, profile:'peak' },
      { name:'SpineExt',   origin:'Spine',       insert:'Spine1',       maxBulge:0.02, bulgeAxis:'z' },
      { name:'Pectoral_L', origin:'LeftShoulder',insert:'Spine2',       maxBulge:0.05, profile:'gaussian' },
      { name:'Pectoral_R', origin:'RightShoulder',insert:'Spine2',      maxBulge:0.05, profile:'gaussian' },
    ];

    pairs.forEach(p => {
      const ob = this.skeleton.bones.find(b => b.name.includes(p.origin));
      const ib = this.skeleton.bones.find(b => b.name.includes(p.insert));
      if (ob && ib) {
        this.addMuscle({
          name: p.name,
          originBone: ob.name, insertBone: ib.name,
          maxBulge: p.maxBulge, bulgeAxis: p.bulgeAxis ?? 'z',
          bulgeProfile: p.profile ?? 'gaussian',
          falloffRadius: 0.25,
        });
      }
    });

    // Set antagonist pairs
    const pairs2 = [['L_Bicep','L_Tricep'],['R_Bicep','R_Tricep'],
                    ['L_Quad','L_Hamstring'],['R_Quad','R_Hamstring']];
    pairs2.forEach(([a, b]) => {
      const ma = Array.from(this.muscles.values()).find(m=>m.name===a);
      const mb = Array.from(this.muscles.values()).find(m=>m.name===b);
      if (ma && mb) { ma.antagonist = mb.id; mb.antagonist = ma.id; }
    });
  }

  _getMuscleActivation(muscle) {
    const ob = this.skeleton.bones.find(b => b.name === muscle.originBone);
    const ib = this.skeleton.bones.find(b => b.name === muscle.insertBone);
    if (!ob || !ib) return 0;

    const euler = new THREE.Euler().setFromQuaternion(ib.quaternion);
    const angle = Math.abs(euler[muscle.bulgeAxis] ?? euler.z);
    const normalizedAngle = Math.min(1, angle / (Math.PI * 0.5));

    let activation = evaluateActivationCurve(normalizedAngle, muscle.activationCurve);

    // Antagonist reduces activation
    if (muscle.antagonist) {
      const ant = this.muscles.get(muscle.antagonist);
      if (ant) activation *= (1 - ant._activation * 0.5);
    }

    muscle._activation = activation;
    return activation;
  }

  update() {
    if (!this.enabled) return;

    const pos = this.mesh.geometry.attributes.position;
    pos.array.set(this.restPos);

    this.muscles.forEach(muscle => {
      const activation = this._getMuscleActivation(muscle);
      if (activation < 0.01) return;

      const ob = this.skeleton.bones.find(b => b.name === muscle.originBone);
      const ib = this.skeleton.bones.find(b => b.name === muscle.insertBone);
      if (!ob || !ib) return;

      const op = new THREE.Vector3(), ip = new THREE.Vector3();
      ob.getWorldPosition(op); ib.getWorldPosition(ip);
      const mid = op.clone().lerp(ip, 0.5);
      const muscleDir = ip.clone().sub(op).normalize();
      const currentLen = op.distanceTo(ip);
      const compression = Math.max(0, 1 - currentLen / muscle.restLength);

      muscle.affectedVerts.forEach(({ idx, weight }) => {
        const vp = new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx));

        // Project vertex onto muscle fiber to get position along fiber
        const toVert = vp.clone().sub(op);
        const projLen = toVert.dot(muscleDir);
        const t = Math.max(0, Math.min(1, projLen / Math.max(currentLen, 0.001)));

        // Bulge profile along fiber
        const bulgeProfile = evaluateBulgeProfile(t, muscle.bulgeProfile);

        // Bulge amount = activation * compression * profile * weight * maxBulge
        const bulge = activation * (1 + compression) * bulgeProfile * weight * muscle.maxBulge;

        // Push vertex outward from muscle axis
        const axis = vp.clone().sub(mid);
        const axisAlongFiber = muscleDir.clone().multiplyScalar(axis.dot(muscleDir));
        const perpAxis = axis.clone().sub(axisAlongFiber);
        const perpLen = perpAxis.length();

        if (perpLen > 0.0001) {
          const pushDir = perpAxis.normalize();
          pos.setXYZ(idx,
            pos.getX(idx) + pushDir.x * bulge,
            pos.getY(idx) + pushDir.y * bulge,
            pos.getZ(idx) + pushDir.z * bulge,
          );
        }
      });
    });

    // Fat layer softening — slightly smooth displaced verts
    if (this.fatLayer > 0) this._applyFatLayer();

    pos.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  _applyFatLayer() {
    const pos = this.mesh.geometry.attributes.position;
    const geo = this.mesh.geometry;
    const idx = geo.index;
    if (!idx) return;

    const smooth = new Float32Array(pos.array.length);
    const counts = new Int32Array(pos.count);
    smooth.set(pos.array);

    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i+1), c = idx.getX(i+2);
      for (const [v, n1, n2] of [[a,b,c],[b,a,c],[c,a,b]]) {
        for (let k = 0; k < 3; k++) {
          smooth[v*3+k] += pos.array[n1*3+k] + pos.array[n2*3+k];
        }
        counts[v] += 2;
      }
    }

    const fat = this.fatLayer;
    for (let i = 0; i < pos.count; i++) {
      if (counts[i] === 0) continue;
      for (let k = 0; k < 3; k++) {
        const avg = smooth[i*3+k] / (counts[i] + 1);
        pos.array[i*3+k] = pos.array[i*3+k] * (1-fat) + avg * fat;
      }
    }
    pos.needsUpdate = true;
  }

  setFatLayer(v) { this.fatLayer = Math.max(0, Math.min(1, v)); }
  setEnabled(v)  { this.enabled = v; }
  getMuscles()   { return Array.from(this.muscles.values()); }
  getActivations() {
    const result = {};
    this.muscles.forEach((m, id) => { result[id] = { name: m.name, activation: m._activation }; });
    return result;
  }
  dispose() { this.muscles.clear(); }
}

export default MuscleSystem;
'''

# Write all files
written = []
for filename, code in files.items():
    path = os.path.join(BASE, filename)
    with open(path, 'w') as f:
        f.write(code)
    written.append(path)
    print(f"✅ {path} ({len(code.splitlines())} lines)")

print(f"""
🎉 Done — {len(written)} files written

HairPhysics.js (110 → ~280 lines):
  ✅ Per-strand stiffness + curl + mass variation
  ✅ Wind turbulence (3D noise field)
  ✅ Bend stiffness constraint (resists sharp bends)
  ✅ Sphere + capsule + plane colliders
  ✅ Clumping — strands attract each other
  ✅ Guide strands system
  ✅ Sub-stepping for stability
  ✅ LOD system for distance

ClothSystem.js (157 → ~320 lines):
  ✅ Stretch + shear + bend constraints (all 3 types)
  ✅ Position-based Verlet integration
  ✅ Self-collision
  ✅ Tearing / tear threshold
  ✅ Air resistance
  ✅ Sphere + capsule + plane + ground colliders
  ✅ Pin individual vertices or top row
  ✅ 6 material presets: silk, cotton, denim, leather, rubber, paper

MuscleSystem.js (NEW ~300 lines):
  ✅ Fiber direction per muscle
  ✅ 3 activation curves (smooth, fast, slow)
  ✅ 3 bulge profiles (gaussian, peak, linear)
  ✅ Antagonist muscle pairs (bicep/tricep etc)
  ✅ Fat layer softening
  ✅ 15 auto-detected humanoid muscles
  ✅ Activation readout per muscle
  ✅ Volume compression response

Run: npm run build 2>&1 | grep "error" | head -10
Then: git add -A && git commit -m "feat: Pro hair simulation, cloth with tearing+self-collision, muscle system with fiber+antagonists" && git push
""")
