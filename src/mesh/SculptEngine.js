import * as THREE from "three";

// ── Falloff library — ZBrush-quality curves ───────────────────────────────────
// t = 0 (center) → 1 (edge)
function smoothFalloff(t)   { const u=1-t; return u*u*(3-2*u); }           // smooth step
function linearFalloff(t)   { return 1 - t; }
function sharpFalloff(t)    { return Math.pow(1 - t, 4); }                  // quartic — sharp center
function sphereFalloff(t)   { return Math.sqrt(Math.max(0, 1 - t*t)); }    // hemispherical
function rootFalloff(t)     { return 1 - Math.sqrt(t); }                    // root — wide soft
function constFalloff()     { return 1; }                                    // constant — hard edge
function cubicFalloff(t)    { return 1 - t*t*t; }                           // cubic — ZBrush default

function getFalloff(type, t) {
  if (t >= 1) return 0;
  switch (type) {
    case "linear":   return linearFalloff(t);
    case "sharp":    return sharpFalloff(t);
    case "sphere":   return sphereFalloff(t);
    case "root":     return rootFalloff(t);
    case "constant": return constFalloff(t);
    case "cubic":    return cubicFalloff(t);
    default:         return smoothFalloff(t);   // "smooth" = default
  }
}

export const FALLOFF_TYPES = ["smooth", "cubic", "linear", "sharp", "sphere", "root", "constant"];

// ── Get hit point on mesh from mouse event ────────────────────────────────────
export function getSculptHit(event, canvas, camera, mesh) {
  const rect = canvas.getBoundingClientRect();
  const ndc  = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width)  * 2 - 1,
   -((event.clientY - rect.top)  / rect.height) * 2 + 1
  );
  const ray  = new THREE.Raycaster();
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObject(mesh, true);
  return hits.length ? hits[0] : null;
}

// ── Core sculpt stroke — upgraded ────────────────────────────────────────────
export function applySculptStroke(mesh, hit, brush) {
  const { type, radius, strength, falloffType, symmetryX, symmetryY, symmetryZ } = brush;
  const geo      = mesh.geometry;
  const pos      = geo.attributes.position;
  const normal   = geo.attributes.normal;
  const faceNorm = hit.face
    ? hit.face.normal.clone().transformDirection(mesh.matrixWorld)
    : new THREE.Vector3(0, 1, 0);

  // world → local
  const invMat   = mesh.matrixWorld.clone().invert();
  const localCtr = hit.point.clone().applyMatrix4(invMat);
  const localNrm = faceNorm.clone().transformDirection(invMat).normalize();

  const count = pos.count;
  const tmp   = new THREE.Vector3();
  const r2    = radius * radius;

  // Pre-collect affected + their deltas for symmetry
  const deltas = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    tmp.fromBufferAttribute(pos, i);
    const dx2 = tmp.x - localCtr.x;
    const dy2 = tmp.y - localCtr.y;
    const dz2 = tmp.z - localCtr.z;
    const d2  = dx2*dx2 + dy2*dy2 + dz2*dz2;
    if (d2 >= r2) continue;

    const dist    = Math.sqrt(d2);
    const t       = dist / radius;
    const falloff = getFalloff(falloffType || "smooth", t) * strength;
    const vNorm   = normal
      ? new THREE.Vector3().fromBufferAttribute(normal, i).normalize()
      : localNrm;

    let ddx = 0, ddy = 0, ddz = 0;

    switch (type) {
      case "draw":
      case "push":
        ddx = localNrm.x * falloff;
        ddy = localNrm.y * falloff;
        ddz = localNrm.z * falloff;
        break;
      case "pull":
        ddx = -localNrm.x * falloff;
        ddy = -localNrm.y * falloff;
        ddz = -localNrm.z * falloff;
        break;
      case "smooth": {
        const toC = new THREE.Vector3(
          localCtr.x - tmp.x,
          localCtr.y - tmp.y,
          localCtr.z - tmp.z
        ).multiplyScalar(falloff * 0.3);
        ddx = toC.x; ddy = toC.y; ddz = toC.z;
        break;
      }
      case "clay":
        ddx = localNrm.x * falloff * 0.5;
        ddy = localNrm.y * falloff * 0.5;
        ddz = localNrm.z * falloff * 0.5;
        break;
      case "inflate":
        ddx = vNorm.x * falloff;
        ddy = vNorm.y * falloff;
        ddz = vNorm.z * falloff;
        break;
      case "pinch": {
        const toC = new THREE.Vector3(
          localCtr.x - tmp.x,
          localCtr.y - tmp.y,
          localCtr.z - tmp.z
        ).normalize().multiplyScalar(falloff * 0.5);
        ddx = toC.x; ddy = toC.y; ddz = toC.z;
        break;
      }
      case "crease": {
        const toC = new THREE.Vector3(
          localCtr.x - tmp.x,
          localCtr.y - tmp.y,
          localCtr.z - tmp.z
        ).normalize().multiplyScalar(falloff * 0.4);
        ddx = toC.x - localNrm.x * falloff * 0.3;
        ddy = toC.y - localNrm.y * falloff * 0.3;
        ddz = toC.z - localNrm.z * falloff * 0.3;
        break;
      }
      case "flatten": {
        // Project vertex onto the hit plane
        const dot = dx2 * localNrm.x + dy2 * localNrm.y + dz2 * localNrm.z;
        ddx = -localNrm.x * dot * falloff * 0.5;
        ddy = -localNrm.y * dot * falloff * 0.5;
        ddz = -localNrm.z * dot * falloff * 0.5;
        break;
      }
      case "scrape": {
        // Push below-plane vertices up, leave above alone
        const dot2 = dx2 * localNrm.x + dy2 * localNrm.y + dz2 * localNrm.z;
        if (dot2 < 0) {
          ddx = -localNrm.x * dot2 * falloff * 0.8;
          ddy = -localNrm.y * dot2 * falloff * 0.8;
          ddz = -localNrm.z * dot2 * falloff * 0.8;
        }
        break;
      }
      default: break;
    }

    deltas[i*3]   = ddx;
    deltas[i*3+1] = ddy;
    deltas[i*3+2] = ddz;
    pos.setXYZ(i, tmp.x + ddx, tmp.y + ddy, tmp.z + ddz);
  }

  // Fast symmetry — build lookup map of mirrored positions
  if (symmetryX || symmetryY || symmetryZ) {
    const epsilon = radius * 0.05;
    // Build position index for O(n) symmetry
    const posMap = new Map();
    for (let i = 0; i < count; i++) {
      if (deltas[i*3] === 0 && deltas[i*3+1] === 0 && deltas[i*3+2] === 0) continue;
      tmp.fromBufferAttribute(pos, i);
      const key = (
        Math.round(tmp.x / epsilon) + "," +
        Math.round(tmp.y / epsilon) + "," +
        Math.round(tmp.z / epsilon)
      );
      posMap.set(key, i);
    }

    for (let j = 0; j < count; j++) {
      tmp.fromBufferAttribute(pos, j);
      if (symmetryX) {
        const mk = Math.round(-tmp.x / epsilon) + "," + Math.round(tmp.y / epsilon) + "," + Math.round(tmp.z / epsilon);
        if (posMap.has(mk)) {
          const si = posMap.get(mk);
          pos.setXYZ(j, tmp.x - deltas[si*3], tmp.y + deltas[si*3+1], tmp.z + deltas[si*3+2]);
        }
      }
    }
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
}
