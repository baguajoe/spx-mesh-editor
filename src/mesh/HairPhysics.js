import * as THREE from "three";

export function createHairPhysicsSettings(options = {}) {
  return {
    enabled:    false,
    gravity:    options.gravity    ?? -9.8,
    wind:       options.wind       || new THREE.Vector3(0,0,0),
    windNoise:  options.windNoise  ?? 0.5,
    damping:    options.damping    ?? 0.98,
    stiffness:  options.stiffness  ?? 0.8,
    colliders:  [],
    iterations: options.iterations ?? 4,
  };
}

export function stepHairPhysics(strands, settings, dt = 1/60) {
  if (!settings.enabled) return;
  const { gravity, wind, windNoise, damping, stiffness, colliders, iterations } = settings;
  const gravVec = new THREE.Vector3(0, gravity * 0.001, 0);

  strands.forEach(strand => {
    // Skip root point
    for (let i = 1; i < strand.points.length; i++) {
      const vel  = strand.velocity[i];
      const prev = strand.points[i].clone();

      // Wind with noise
      const windForce = wind.clone().addScaledVector(
        new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5),
        windNoise * 0.001
      );

      // Apply forces
      vel.add(gravVec).add(windForce).multiplyScalar(damping);
      strand.points[i].add(vel.clone().multiplyScalar(dt * 60));

      // Solve distance constraints
      for (let iter = 0; iter < iterations; iter++) {
        const parent = strand.points[i-1];
        const segLen = strand.length / strand.segments;
        const diff   = strand.points[i].clone().sub(parent);
        const dist   = diff.length();
        if (dist > 0) {
          const correction = diff.multiplyScalar((dist - segLen) / dist);
          strand.points[i].sub(correction.multiplyScalar(0.5));
        }

        // Stiffness — pull toward rest position
        if (strand.restPoints?.[i]) {
          strand.points[i].lerp(strand.restPoints[i], stiffness * 0.01);
        }
      }

      // Sphere colliders
      colliders.forEach(col => {
        const toPoint = strand.points[i].clone().sub(col.center);
        const dist    = toPoint.length();
        if (dist < col.radius) {
          strand.points[i] = col.center.clone().addScaledVector(toPoint.normalize(), col.radius + 0.001);
        }
      });

      // Update velocity from position change
      strand.velocity[i] = strand.points[i].clone().sub(prev).multiplyScalar(dt > 0 ? 1/dt : 0);
    }
  });
}

export function addWindForce(settings, direction, strength) {
  settings.wind = direction.clone().normalize().multiplyScalar(strength);
}

export function addCollider(settings, center, radius) {
  settings.colliders.push({ center: center.clone(), radius });
  return settings.colliders.length - 1;
}

export function removeCollider(settings, index) {
  settings.colliders.splice(index, 1);
}

export function resetHairToRest(strands) {
  strands.forEach(s => {
    if (!s.restPoints) return;
    s.points = s.restPoints.map(p => p.clone());
    s.velocity = s.points.map(() => new THREE.Vector3());
  });
}

export function bakeHairPhysics(strands, settings, frameCount=60, fps=24) {
  const baked = strands.map(s => ({ id:s.id, frames:[] }));
  const dt = 1/fps;
  for (let f=0; f<frameCount; f++) {
    stepHairPhysics(strands, settings, dt);
    strands.forEach((s,i) => {
      baked[i].frames.push(s.points.map(p=>p.toArray()));
    });
  }
  return baked;
}

export function applyBakedHairFrame(strands, bakedData, frameIndex) {
  strands.forEach((s,i) => {
    const bd = bakedData[i];
    if (!bd?.frames[frameIndex]) return;
    bd.frames[frameIndex].forEach((pos,j) => {
      if (s.points[j]) s.points[j].fromArray(pos);
    });
  });
}
