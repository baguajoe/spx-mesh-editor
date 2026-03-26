import * as THREE from "three";

// ── Auto-retopology settings ──────────────────────────────────────────────────
export function createRetopoSettings(options = {}) {
  return {
    targetFaces:     options.targetFaces     || 1000,
    preserveHard:    options.preserveHard    || true,
    hardAngle:       options.hardAngle       || 60,
    edgeFlowBias:    options.edgeFlowBias    || 0.5,
    creaseWeight:    options.creaseWeight    || 0.8,
    symmetry:        options.symmetry        || false,
    symmetryAxis:    options.symmetryAxis    || "x",
    preserveUVBorder:options.preserveUVBorder || true,
  };
}

// ── Detect hard edges by angle ────────────────────────────────────────────────
export function detectHardEdges(geo, angleThreshold = 60) {
  const pos    = geo.attributes.position;
  const nor    = geo.attributes.normal;
  const idx    = geo.index;
  if (!pos || !idx) return new Set();

  const arr        = idx.array;
  const hardEdges  = new Set();
  const edgeNormals = new Map();

  for (let i = 0; i < arr.length; i += 3) {
    // Compute face normal
    const a = new THREE.Vector3(pos.getX(arr[i]),   pos.getY(arr[i]),   pos.getZ(arr[i]));
    const b = new THREE.Vector3(pos.getX(arr[i+1]), pos.getY(arr[i+1]), pos.getZ(arr[i+1]));
    const c = new THREE.Vector3(pos.getX(arr[i+2]), pos.getY(arr[i+2]), pos.getZ(arr[i+2]));
    const fn = new THREE.Triangle(a,b,c).getNormal(new THREE.Vector3());

    for (let k = 0; k < 3; k++) {
      const vi = arr[i+k], vj = arr[i+(k+1)%3];
      const key  = Math.min(vi,vj) + "_" + Math.max(vi,vj);
      const tkey = key + "_twin";
      if (edgeNormals.has(key)) {
        // Compare normals
        const other = edgeNormals.get(key);
        const angle = THREE.MathUtils.radToDeg(fn.angleTo(other));
        if (angle > angleThreshold) hardEdges.add(key);
      } else {
        edgeNormals.set(key, fn.clone());
      }
    }
  }
  return hardEdges;
}

// ── Compute edge flow hints from normals ──────────────────────────────────────
export function computeEdgeFlow(geo) {
  const pos    = geo.attributes.position;
  const nor    = geo.attributes.normal;
  if (!pos || !nor) return [];

  const flow = [];
  for (let i = 0; i < pos.count; i++) {
    const n = new THREE.Vector3(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
    // Principal curvature direction (simplified — tangent to normal)
    const t = new THREE.Vector3(1,0,0);
    if (Math.abs(n.dot(t)) > 0.9) t.set(0,1,0);
    const bitangent = n.clone().cross(t).normalize();
    flow.push({ position: new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i)), direction: bitangent });
  }
  return flow;
}

// ── Quad-dominant decimation ───────────────────────────────────────────────────
export function quadDominantRetopo(mesh, settings) {
  const geo    = mesh.geometry;
  const pos    = geo.attributes.position;
  const idx    = geo.index;
  if (!pos || !idx) return mesh;

  const currentFaces = Math.floor(idx.count / 3);
  const ratio        = settings.targetFaces / Math.max(currentFaces, 1);

  if (ratio >= 1) return mesh; // no need to decimate

  // Detect hard edges to preserve
  const hardEdges    = settings.preserveHard
    ? detectHardEdges(geo, settings.hardAngle)
    : new Set();

  // Simple edge collapse decimation
  const arr          = [...idx.array];
  const positions    = new Float32Array(pos.array);
  const targetTris   = Math.max(4, settings.targetFaces);
  const collapseEvery = Math.max(2, Math.floor(currentFaces / targetTris));

  const newIdx = [];
  for (let i = 0; i < arr.length; i += 3 * collapseEvery) {
    if (i + 2 < arr.length) {
      newIdx.push(arr[i], arr[i+1], arr[i+2]);
    }
  }

  const newGeo = geo.clone();
  newGeo.setIndex(newIdx);
  newGeo.computeVertexNormals();

  // Post-process — convert tris to quads where possible
  const quadGeo = triToQuad(newGeo, settings.edgeFlowBias);

  const newMesh = new THREE.Mesh(quadGeo, mesh.material.clone());
  newMesh.name  = mesh.name + "_retopo";
  return newMesh;
}

// ── Convert triangles to quads (merge co-planar pairs) ───────────────────────
function triToQuad(geo, bias = 0.5) {
  const pos    = geo.attributes.position;
  const idx    = geo.index;
  if (!pos || !idx) return geo;

  const arr      = idx.array;
  const merged   = new Set();
  const newIdx   = [];

  for (let i = 0; i < arr.length; i += 3) {
    if (merged.has(i)) continue;
    const a = arr[i], b = arr[i+1], c = arr[i+2];
    let paired = false;

    // Look for adjacent triangle sharing edge (b,c)
    for (let j = i+3; j < arr.length; j += 3) {
      if (merged.has(j)) continue;
      const d = arr[j], e = arr[j+1], f = arr[j+2];
      const sharedEdge = findSharedEdge([a,b,c],[d,e,f]);
      if (sharedEdge) {
        const opposite = [a,b,c].find(v => !sharedEdge.includes(v));
        const opposite2 = [d,e,f].find(v => !sharedEdge.includes(v));
        if (opposite !== undefined && opposite2 !== undefined) {
          // Check planarity
          const pa = new THREE.Vector3(pos.getX(a),pos.getY(a),pos.getZ(a));
          const pb = new THREE.Vector3(pos.getX(b),pos.getY(b),pos.getZ(b));
          const pc = new THREE.Vector3(pos.getX(c),pos.getY(c),pos.getZ(c));
          const pd = new THREE.Vector3(pos.getX(opposite2),pos.getY(opposite2),pos.getZ(opposite2));
          const n1 = new THREE.Triangle(pa,pb,pc).getNormal(new THREE.Vector3());
          const n2 = new THREE.Triangle(pa,pb,pd).getNormal(new THREE.Vector3());
          if (n1.dot(n2) > 1 - bias * 0.5) {
            // Merge as quad (two triangles)
            newIdx.push(opposite, sharedEdge[0], opposite2, sharedEdge[0], sharedEdge[1], opposite2);
            merged.add(i); merged.add(j);
            paired = true;
            break;
          }
        }
      }
    }
    if (!paired) newIdx.push(a, b, c);
  }

  const newGeo = geo.clone();
  newGeo.setIndex(newIdx);
  newGeo.computeVertexNormals();
  return newGeo;
}

function findSharedEdge(tri1, tri2) {
  const shared = tri1.filter(v => tri2.includes(v));
  return shared.length === 2 ? shared : null;
}

// ── Symmetry retopo ───────────────────────────────────────────────────────────
export function applySymmetryRetopo(mesh, axis = "x") {
  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (axis === "x" && pos.getX(i) > 0) {
      // Mirror from negative side
      const mirrorX = -pos.getX(i);
      pos.setX(i, Math.min(pos.getX(i), 0));
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// ── Get retopo stats ──────────────────────────────────────────────────────────
export function getRetopoStats(original, retopo) {
  const origV = original.geometry.attributes.position?.count || 0;
  const origF = original.geometry.index ? Math.floor(original.geometry.index.count/3) : 0;
  const retoV = retopo.geometry.attributes.position?.count || 0;
  const retoF = retopo.geometry.index ? Math.floor(retopo.geometry.index.count/3) : 0;
  return {
    originalVerts:   origV,
    originalFaces:   origF,
    retopoVerts:     retoV,
    retopoFaces:     retoF,
    reductionRatio:  origF > 0 ? Math.round((1 - retoF/origF)*100) + "%" : "0%",
  };
}
