import * as THREE from "three";

// ── Falloff functions ─────────────────────────────────────────────────────────
function smoothFalloff(t) { return 1 - t * t; }
function linearFalloff(t) { return 1 - t; }
function sharpFalloff(t)  { return t < 0.5 ? 1 : 1 - (t - 0.5) * 2; }

function getFalloff(type, t) {
  if (t >= 1) return 0;
  switch (type) {
    case "linear": return linearFalloff(t);
    case "sharp":  return sharpFalloff(t);
    default:       return smoothFalloff(t);
  }
}

// ── Get hit point on mesh from mouse event ────────────────────────────────────
export function getSculptHit(event, canvas, camera, mesh) {
  const rect   = canvas.getBoundingClientRect();
  const ndc    = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width)  * 2 - 1,
   -((event.clientY - rect.top)  / rect.height) * 2 + 1
  );
  const ray    = new THREE.Raycaster();
  ray.setFromCamera(ndc, camera);
  const hits   = ray.intersectObject(mesh, true);
  return hits.length ? hits[0] : null;
}

// ── Core sculpt stroke ────────────────────────────────────────────────────────
export function applySculptStroke(mesh, hit, brush) {
  const { type, radius, strength, falloffType, symmetryX, symmetryY, symmetryZ } = brush;
  const geo      = mesh.geometry;
  const pos      = geo.attributes.position;
  const normal   = geo.attributes.normal;
  const center   = hit.point.clone();
  const faceNorm = hit.face ? hit.face.normal.clone().transformDirection(mesh.matrixWorld) : new THREE.Vector3(0,1,0);

  // world → local
  const invMat   = mesh.matrixWorld.clone().invert();
  const localCtr = center.clone().applyMatrix4(invMat);
  const localNrm = faceNorm.clone().transformDirection(invMat).normalize();

  const count    = pos.count;
  const tmp      = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    tmp.fromBufferAttribute(pos, i);
    const dist = tmp.distanceTo(localCtr);
    if (dist >= radius) continue;

    const t       = dist / radius;
    const falloff = getFalloff(falloffType || "smooth", t) * strength;
    const vNorm   = new THREE.Vector3().fromBufferAttribute(normal, i).normalize();

    let dx = 0, dy = 0, dz = 0;

    switch (type) {
      case "push":
        dx = localNrm.x * falloff;
        dy = localNrm.y * falloff;
        dz = localNrm.z * falloff;
        break;
      case "pull":
        dx = -localNrm.x * falloff;
        dy = -localNrm.y * falloff;
        dz = -localNrm.z * falloff;
        break;
      case "smooth": {
        // average neighbor approach — just nudge toward center
        const toCenter = localCtr.clone().sub(tmp).multiplyScalar(falloff * 0.3);
        dx = toCenter.x; dy = toCenter.y; dz = toCenter.z;
        break;
      }
      case "clay":
        dx = localNrm.x * falloff * 0.5;
        dy = localNrm.y * falloff * 0.5;
        dz = localNrm.z * falloff * 0.5;
        break;
      case "inflate":
        dx = vNorm.x * falloff;
        dy = vNorm.y * falloff;
        dz = vNorm.z * falloff;
        break;
      case "pinch": {
        const toC = localCtr.clone().sub(tmp).normalize().multiplyScalar(falloff * 0.5);
        dx = toC.x; dy = toC.y; dz = toC.z;
        break;
      }
      case "crease": {
        const toC2 = localCtr.clone().sub(tmp).normalize().multiplyScalar(falloff * 0.4);
        dx = toC2.x - localNrm.x * falloff * 0.3;
        dy = toC2.y - localNrm.y * falloff * 0.3;
        dz = toC2.z - localNrm.z * falloff * 0.3;
        break;
      }
      default: break;
    }

    pos.setXYZ(i, tmp.x + dx, tmp.y + dy, tmp.z + dz);

    // Symmetry
    if (symmetryX) {
      for (let j = 0; j < count; j++) {
        const sv = new THREE.Vector3().fromBufferAttribute(pos, j);
        if (Math.abs(sv.x + tmp.x) < radius * 0.1 &&
            Math.abs(sv.y - tmp.y) < radius * 0.5 &&
            Math.abs(sv.z - tmp.z) < radius * 0.5) {
          pos.setXYZ(j, sv.x - dx, sv.y + dy, sv.z + dz);
        }
      }
    }
  }

  pos.needsUpdate    = true;
  geo.computeVertexNormals();
}
