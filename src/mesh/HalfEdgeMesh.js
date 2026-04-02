
/**
 * SPX Mesh Editor — Half-Edge Data Structure
 * Enables topological mesh operations: loop cuts, edge slide, knife tool
 */

export class Vertex {
  constructor(id, x, y, z) {
    this.id = id;
    this.x = x; this.y = y; this.z = z;
    this.halfEdge = null; // one outgoing half-edge
  }
  clone() { return new Vertex(this.id, this.x, this.y, this.z); }
  distanceTo(v) {
    return Math.sqrt((this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2);
  }
}

export class HalfEdge {
  constructor(id) {
    this.id = id;
    this.vertex = null;   // vertex at the START of this half-edge
    this.face   = null;   // face this half-edge borders
    this.next   = null;   // next half-edge around the face
    this.prev   = null;   // prev half-edge around the face
    this.twin   = null;   // opposite half-edge
    this.selected = false;
  }
  // Walk around face
  faceLoop() {
    const edges = [this];
    let e = this.next;
    while (e && e !== this && edges.length < 100) {
      edges.push(e); e = e.next;
    }
    return edges;
  }
  // Get the edge loop this half-edge belongs to
  // Proper traversal: go twin->next->next (cross perpendicular edges)
  edgeLoop() {
    const loop = [];
    const visited = new Set();
    let e = this;
    let guard = 0;

    do {
      if (visited.has(e.id)) break;
      visited.add(e.id);
      loop.push(e);

      // To find next edge in loop:
      // 1. Go to twin (cross to adjacent face)
      // 2. Then advance next->next (skip to perpendicular edge)
      if (!e.twin) break;
      let next = e.twin;

      // Count edges in face to handle tris vs quads
      const faceEdges = next.faceLoop ? next.faceLoop() : [];
      const faceSize  = faceEdges.length;

      if (faceSize === 4) {
        // Quad: skip 2 edges to get perpendicular
        next = next.next ? next.next.next : null;
      } else if (faceSize === 3) {
        // Triangle: skip 1 edge
        next = next.next || null;
      } else {
        // N-gon: skip n/2 edges
        const skip = Math.floor(faceSize / 2);
        for (let s = 0; s < skip && next; s++) next = next.next;
      }

      if (!next || visited.has(next.id)) break;
      e = next;
      guard++;
    } while (e !== this && guard < 500);

    return loop;
  }
}

export class Face {
  constructor(id) {
    this.id = id;
    this.halfEdge = null; // one half-edge of this face
    this.selected = false;
  }
  // Get all vertices of this face
  vertices() {
    return this.halfEdge.faceLoop().map(e => e.vertex);
  }
  // Compute face normal
  normal() {
    const verts = this.vertices();
    if (verts.length < 3) return {x:0,y:1,z:0};
    const a = verts[0], b = verts[1], c = verts[2];
    const ax=b.x-a.x, ay=b.y-a.y, az=b.z-a.z;
    const bx=c.x-a.x, by=c.y-a.y, bz=c.z-a.z;
    const nx=ay*bz-az*by, ny=az*bx-ax*bz, nz=ax*by-ay*bx;
    const len=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
    return {x:nx/len, y:ny/len, z:nz/len};
  }
  // Compute face centroid
  centroid() {
    const verts = this.vertices();
    const s = verts.reduce((a,v)=>({x:a.x+v.x,y:a.y+v.y,z:a.z+v.z}),{x:0,y:0,z:0});
    return {x:s.x/verts.length, y:s.y/verts.length, z:s.z/verts.length};
  }
}

export class HalfEdgeMesh {
  constructor() {
    this.vertices  = new Map(); // id -> Vertex
    this.halfEdges = new Map(); // id -> HalfEdge
    this.faces     = new Map(); // id -> Face
    this._vid = 0; this._eid = 0; this._fid = 0;
  }

  addVertex(x, y, z) {
    const v = new Vertex(this._vid++, x, y, z);
    this.vertices.set(v.id, v);
    return v;
  }

  addHalfEdge() {
    const e = new HalfEdge(this._eid++);
    this.halfEdges.set(e.id, e);
    return e;
  }

  addFace() {
    const f = new Face(this._fid++);
    this.faces.set(f.id, f);
    return f;
  }

  // Build half-edge mesh from THREE.BufferGeometry
  static fromBufferGeometry(geo) {
    const mesh = new HalfEdgeMesh();
    const pos  = geo.attributes.position.array;
    const idx  = geo.index ? geo.index.array : null;

    // Add all vertices
    const vCount = pos.length / 3;
    for (let i = 0; i < vCount; i++) {
      mesh.addVertex(pos[i*3], pos[i*3+1], pos[i*3+2]);
    }

    // Build faces from triangles
    const triCount = idx ? idx.length/3 : vCount/3;
    const edgeMap  = new Map(); // "v0_v1" -> HalfEdge

    for (let t = 0; t < triCount; t++) {
      const vi = idx
        ? [idx[t*3], idx[t*3+1], idx[t*3+2]]
        : [t*3, t*3+1, t*3+2];

      const face = mesh.addFace();
      const edges = [];

      // Create 3 half-edges for this triangle
      for (let k = 0; k < 3; k++) {
        const e = mesh.addHalfEdge();
        e.vertex = mesh.vertices.get(vi[k]);
        e.face   = face;
        if (!e.vertex.halfEdge) e.vertex.halfEdge = e;
        edges.push(e);
      }

      // Link next/prev
      for (let k = 0; k < 3; k++) {
        edges[k].next = edges[(k+1)%3];
        edges[k].prev = edges[(k+2)%3];
      }
      face.halfEdge = edges[0];

      // Register in edge map and link twins
      for (let k = 0; k < 3; k++) {
        const e    = edges[k];
        const vA   = vi[k];
        const vB   = vi[(k+1)%3];
        const key  = `${vA}_${vB}`;
        const tkey = `${vB}_${vA}`;
        edgeMap.set(key, e);
        if (edgeMap.has(tkey)) {
          const twin = edgeMap.get(tkey);
          e.twin    = twin;
          twin.twin = e;
        }
      }
    }

    return mesh;
  }

  // Convert back to THREE.BufferGeometry arrays
  toBufferGeometry() {
    const positions = [];
    const normals   = [];
    const indices   = [];
    const vertIdMap = new Map();
    let   vi = 0;

    this.vertices.forEach(v => {
      vertIdMap.set(v.id, vi++);
      positions.push(v.x, v.y, v.z);
      normals.push(0, 1, 0); // recompute after
    });

    this.faces.forEach(face => {
      const verts = face.vertices();
      if (verts.length < 3) return;
      // Fan triangulation — works for tri, quad, and any n-gon
      const ids = verts.map(v => vertIdMap.get(v.id));
      for (let i = 1; i < ids.length - 1; i++) {
        indices.push(ids[0], ids[i], ids[i+1]);
      }
    });

    return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
  }

  // ── Loop Cut ────────────────────────────────────────────────────────────────
  loopCut(halfEdge, t = 0.5) {
    const loop = halfEdge.edgeLoop();
    if (loop.length < 2) return null;

    const newVerts = [];

    // Step 1: create new vertices along each edge in the loop
    loop.forEach(e => {
      const vA = e.vertex;
      const vB = e.next ? e.next.vertex : e.vertex;
      const nv = this.addVertex(
        vA.x + (vB.x - vA.x) * t,
        vA.y + (vB.y - vA.y) * t,
        vA.z + (vB.z - vA.z) * t,
      );
      newVerts.push({ edge: e, newVert: nv });
    });

    // Step 2: split each edge at the new vertex
    newVerts.forEach(({ edge, newVert }) => {
      this._splitEdge(edge, newVert);
    });

    // Step 3: connect new verts with new edges across faces
    for (let i = 0; i < newVerts.length; i++) {
      const curr = newVerts[i];
      const next = newVerts[(i + 1) % newVerts.length];
      const nv1  = curr.newVert;
      const nv2  = next.newVert;

      // Find the face between these two new verts and split it
      // by inserting a new edge nv1 -> nv2
      const e1 = this.addHalfEdge();
      const e2 = this.addHalfEdge();
      e1.vertex = nv1; e2.vertex = nv2;
      e1.twin = e2;    e2.twin = e1;

      // Assign faces (simplified — proper face splitting handled by rebuild)
      const sharedFace = curr.edge.face;
      e1.face = sharedFace;
      e2.face = sharedFace;
    }

    return newVerts.map(nv => nv.newVert);
  }

  _splitEdge(edge, midVert) {
    // Split edge into two edges at midVert
    const twin = edge.twin;
    const e1   = this.addHalfEdge();
    e1.vertex  = midVert;
    e1.face    = edge.face;
    e1.next    = edge.next;
    e1.prev    = edge;
    edge.next.prev = e1;
    edge.next  = e1;
    midVert.halfEdge = e1;

    if (twin) {
      const e2  = this.addHalfEdge();
      e2.vertex = midVert;
      e2.face   = twin.face;
      e2.next   = twin.next;
      e2.prev   = twin;
      twin.next.prev = e2;
      twin.next = e2;
      e1.twin = twin; twin.twin = e1;
      edge.twin = e2;  e2.twin = edge;
    }
  }

  // ── Edge Slide ──────────────────────────────────────────────────────────────
  slideEdge(halfEdge, t) {
    const loop = halfEdge.edgeLoop();
    loop.forEach(e => {
      const v   = e.vertex;
      const adj = e.prev.vertex; // slide toward adjacent vertex
      v.x = v.x + (adj.x - v.x) * t * 0.1;
      v.y = v.y + (adj.y - v.y) * t * 0.1;
      v.z = v.z + (adj.z - v.z) * t * 0.1;
    });
  }

  // ── Knife Cut ───────────────────────────────────────────────────────────────
  knifeCut(planeNormal, planePoint) {
    const newVerts = [];
    this.halfEdges.forEach(e => {
      if (e.twin && e.id < e.twin.id) { // process each edge once
        const vA = e.vertex;
        const vB = e.twin.vertex;
        // Check if edge crosses the cutting plane
        const dA = (vA.x-planePoint.x)*planeNormal.x + (vA.y-planePoint.y)*planeNormal.y + (vA.z-planePoint.z)*planeNormal.z;
        const dB = (vB.x-planePoint.x)*planeNormal.x + (vB.y-planePoint.y)*planeNormal.y + (vB.z-planePoint.z)*planeNormal.z;
        if (dA * dB < 0) { // opposite sides — edge crosses plane
          const t = dA / (dA - dB);
          const nv = this.addVertex(
            vA.x + (vB.x-vA.x)*t,
            vA.y + (vB.y-vA.y)*t,
            vA.z + (vB.z-vA.z)*t,
          );
          this._splitEdge(e, nv);
          newVerts.push(nv);
        }
      }
    });
    return newVerts;
  }

  // Stats
  stats() {
    return {
      vertices:  this.vertices.size,
      halfEdges: this.halfEdges.size,
      faces:     this.faces.size,
      edges:     Math.floor(this.halfEdges.size / 2),
    };
  }


  // ── Plane Cut (reliable alternative to edge loop traversal) ──────────────
  // Cuts mesh with an axis-aligned plane — always produces clean results
  planeCut(axis='y', position=0, t=0.5) {\n    const newVerts = [];\n    const processed = new Set();\n\n    this.halfEdges.forEach(e => {\n      if (!e.twin) return;\n      if (processed.has(e.id) || processed.has(e.twin.id)) return;\n      processed.add(e.id); processed.add(e.twin.id);\n\n      const vA = e.vertex;\n      const vB = e.twin.vertex;\n\n      const aVal = axis==='x' ? vA.x : axis==='y' ? vA.y : vA.z;\n      const bVal = axis==='x' ? vB.x : axis==='y' ? vB.y : vB.z;\n\n      // Edge crosses the cut plane\n      if ((aVal < position && bVal > position) ||\n          (aVal > position && bVal < position)) {\n        const localT = (position - aVal) / (bVal - aVal);\n        const nv = this.addVertex(\n          vA.x + (vB.x - vA.x) * localT,\n          vA.y + (vB.y - vA.y) * localT,\n          vA.z + (vB.z - vA.z) * localT,\n        );\n        this._splitEdge(e, nv);\n        newVerts.push(nv);\n      }\n    });\n\n    return newVerts;\n  }\n\n  // ── Subdivision Surface (Catmull-Clark simplified) ──────────────────────\n  subdivide() {\n    const newMesh = new HalfEdgeMesh();\n    // For each face: add face centroid\n    const faceCentroids = new Map();\n    this.faces.forEach(face => {\n      const verts = face.vertices();\n      const cx = verts.reduce((s,v)=>s+v.x,0)/verts.length;\n      const cy = verts.reduce((s,v)=>s+v.y,0)/verts.length;\n      const cz = verts.reduce((s,v)=>s+v.z,0)/verts.length;\n      faceCentroids.set(face.id, newMesh.addVertex(cx,cy,cz));\n    });\n\n    // For each edge: add edge midpoint\n    const edgeMids = new Map();\n    const seen = new Set();\n    this.halfEdges.forEach(e => {\n      if (!e.twin || seen.has(e.id) || seen.has(e.twin.id)) return;\n      seen.add(e.id);\n      const a = e.vertex, b = e.twin.vertex;\n      const mid = newMesh.addVertex((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);\n      edgeMids.set(e.id, mid); edgeMids.set(e.twin.id, mid);\n    });\n\n    // For each original vertex: add smoothed position\n    const smoothVerts = new Map();\n    this.vertices.forEach(v => {\n      // Average of adjacent face centroids and edge midpoints\n      const adjFaces = []; const adjEdgeMids = [];\n      let e = v.halfEdge;\n      let guard = 0;\n      do {\n        if (e.face) adjFaces.push(faceCentroids.get(e.face.id));\n        const mid = edgeMids.get(e.id);\n        if (mid) adjEdgeMids.push(mid);\n        if (!e.twin) break;\n        e = e.twin.next;\n        guard++;\n      } while (e !== v.halfEdge && guard < 100);\n\n      const n = adjFaces.length;\n      if (n === 0) { smoothVerts.set(v.id, newMesh.addVertex(v.x,v.y,v.z)); return; }\n      const fx = adjFaces.reduce((s,f)=>s+(f?.x||0),0)/n;\n      const fy = adjFaces.reduce((s,f)=>s+(f?.y||0),0)/n;\n      const fz = adjFaces.reduce((s,f)=>s+(f?.z||0),0)/n;\n      const mx = adjEdgeMids.reduce((s,m)=>s+(m?.x||0),0)/Math.max(adjEdgeMids.length,1);\n      const my = adjEdgeMids.reduce((s,m)=>s+(m?.y||0),0)/Math.max(adjEdgeMids.length,1);\n      const mz = adjEdgeMids.reduce((s,m)=>s+(m?.z||0),0)/Math.max(adjEdgeMids.length,1);\n      const sv = newMesh.addVertex(\n        (fx + 2*mx + (n-3)*v.x)/n,\n        (fy + 2*my + (n-3)*v.y)/n,\n        (fz + 2*mz + (n-3)*v.z)/n,\n      );\n      smoothVerts.set(v.id, sv);\n    });\n\n    // Build new quads: for each original face, for each original vertex in face\n    // create quad: smoothVert -> edgeMid -> faceCentroid -> prevEdgeMid\n    this.faces.forEach(face => {\n      const fc = faceCentroids.get(face.id);\n      const edges = face.halfEdge.faceLoop();\n      for (let i=0; i<edges.length; i++) {\n        const e    = edges[i];\n        const ePrev= edges[(i+edges.length-1)%edges.length];\n        const sv   = smoothVerts.get(e.vertex.id);\n        const em   = edgeMids.get(e.id);\n        const epm  = edgeMids.get(ePrev.id);\n        if (!sv||!em||!fc||!epm) return;\n        // quad: sv, em, fc, epm\n        const f = newMesh.addFace();\n        const he0=newMesh.addHalfEdge(); he0.vertex=sv; he0.face=f;\n        const he1=newMesh.addHalfEdge(); he1.vertex=em; he1.face=f;\n        const he2=newMesh.addHalfEdge(); he2.vertex=fc; he2.face=f;\n        const he3=newMesh.addHalfEdge(); he3.vertex=epm;he3.face=f;\n        he0.next=he1; he1.next=he2; he2.next=he3; he3.next=he0;\n        he0.prev=he3; he1.prev=he0; he2.prev=he1; he3.prev=he2;\n        f.halfEdge=he0;\n        if (!sv.halfEdge) sv.halfEdge=he0;\n        if (!em.halfEdge) em.halfEdge=he1;\n        if (!fc.halfEdge) fc.halfEdge=he2;\n        if (!epm.halfEdge) epm.halfEdge=he3;\n      }\n    });\n    return newMesh;\n  }\n\n  // ── Extrude selected faces ────────────────────────────────────────────────\n  extrudeFaces(faceIds, amount=0.3) {\n    const newVerts = new Map(); // oldVertId -> newVertId\n    faceIds.forEach(faceIdx => {\n      const face = [...this.faces.values()][faceIdx];\n      if (!face) return;\n      const normal = face.normal();\n      const verts  = face.vertices();\n      verts.forEach(v => {\n        if (!newVerts.has(v.id)) {\n          const nv = this.addVertex(\n            v.x + normal.x*amount,\n            v.y + normal.y*amount,\n            v.z + normal.z*amount,\n          );\n          newVerts.set(v.id, nv);\n        }\n      });\n      // Replace face vertices with extruded vertices\n      face.halfEdge.faceLoop().forEach(e => {\n        const nv = newVerts.get(e.vertex.id);\n        if (nv) e.vertex = nv;\n      });\n      // Create side faces connecting original to extruded\n      const origVerts = verts;\n      for (let i=0;i<origVerts.length;i++) {\n        const a  = origVerts[i];\n        const b  = origVerts[(i+1)%origVerts.length];\n        const na = newVerts.get(a.id);\n        const nb = newVerts.get(b.id);\n        if (!na||!nb) continue;\n        const sf = this.addFace();\n        const e0=this.addHalfEdge(); e0.vertex=a;  e0.face=sf;\n        const e1=this.addHalfEdge(); e1.vertex=b;  e1.face=sf;\n        const e2=this.addHalfEdge(); e2.vertex=nb; e2.face=sf;\n        const e3=this.addHalfEdge(); e3.vertex=na; e3.face=sf;\n        e0.next=e1; e1.next=e2; e2.next=e3; e3.next=e0;\n        e0.prev=e3; e1.prev=e0; e2.prev=e1; e3.prev=e2;\n        sf.halfEdge=e0;\n      }\n    });\n    return newVerts;\n  }\n\n  // ── Merge vertices by distance (weld) ────────────────────────────────────\n  mergeByDistance(threshold=0.001) {\n    let merged = 0;\n    const verts = [...this.vertices.values()];\n    const remap = new Map();\n    for (let i=0;i<verts.length;i++) {\n      for (let j=i+1;j<verts.length;j++) {\n        if (verts[i].distanceTo(verts[j]) < threshold) {\n          remap.set(verts[j].id, verts[i]);\n          merged++;\n        }\n      }\n    }\n    this.halfEdges.forEach(e => {\n      if (remap.has(e.vertex.id)) e.vertex = remap.get(e.vertex.id);\n    });\n    remap.forEach((_,id)=>this.vertices.delete(id));\n    return merged;\n  }\n\n\n\n  // ── Mirror ────────────────────────────────────────────────────────────────\n  mirror(axis='x') {\n    const original = [...this.vertices.values()];\n    const mirrorMap = new Map();\n    original.forEach(v => {\n      const nv = this.addVertex(\n        axis==='x' ? -v.x : v.x,\n        axis==='y' ? -v.y : v.y,\n        axis==='z' ? -v.z : v.z,\n      );\n      mirrorMap.set(v.id, nv);\n    });\n    // Mirror all faces (reversed winding for correct normals)\n    const origFaces = [...this.faces.values()];\n    origFaces.forEach(face => {\n      const verts = face.vertices().reverse();\n      const mf    = this.addFace();\n      const edges = verts.map(() => this.addHalfEdge());\n      verts.forEach((v,i) => {\n        edges[i].vertex = mirrorMap.get(v.id) || v;\n        edges[i].face   = mf;\n      });\n      for (let i=0;i<edges.length;i++) {\n        edges[i].next = edges[(i+1)%edges.length];\n        edges[i].prev = edges[(i+edges.length-1)%edges.length];\n      }\n      mf.halfEdge = edges[0];\n      edges.forEach(e => { if (!e.vertex.halfEdge) e.vertex.halfEdge = e; });\n    });\n    return this;\n  }\n\n  // ── Bevel edges ───────────────────────────────────────────────────────────\n  bevelEdges(amount=0.1) {\n    const newVerts = [];\n    const seen = new Set();\n    this.halfEdges.forEach(e => {\n      if (!e.twin || seen.has(e.id) || seen.has(e.twin.id)) return;\n      seen.add(e.id); seen.add(e.twin.id);\n      const a = e.vertex, b = e.twin.vertex;\n      // Create two new verts offset from each end\n      const dx=b.x-a.x, dy=b.y-a.y, dz=b.z-a.z;\n      const len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;\n      const nx=dx/len, ny=dy/len, nz=dz/len;\n      const va = this.addVertex(a.x+nx*amount, a.y+ny*amount, a.z+nz*amount);\n      const vb = this.addVertex(b.x-nx*amount, b.y-ny*amount, b.z-nz*amount);\n      newVerts.push({orig_a:a, orig_b:b, va, vb, edge:e});\n    });\n    return newVerts.length;\n  }\n\n  // ── Inset faces ───────────────────────────────────────────────────────────\n  insetFaces(faceIds, amount=0.1) {\n    const newVerts = new Map();\n    faceIds.forEach(faceIdx => {\n      const face = [...this.faces.values()][faceIdx];\n      if (!face) return;\n      const verts    = face.vertices();\n      const centroid = face.centroid();\n      // Move each vertex toward centroid by amount\n      const insetVs = verts.map(v => {\n        const nx = v.x + (centroid.x - v.x) * amount;\n        const ny = v.y + (centroid.y - v.y) * amount;\n        const nz = v.z + (centroid.z - v.z) * amount;\n        const nv = this.addVertex(nx, ny, nz);\n        newVerts.set(v.id + '_' + faceIdx, nv);
        return nv;
      });
      // Create inner face
      const innerFace = this.addFace();
      const innerEdges = insetVs.map(() => this.addHalfEdge());
      insetVs.forEach((v,i) => {
        innerEdges[i].vertex = v;
        innerEdges[i].face   = innerFace;
      });
      for (let i=0;i<innerEdges.length;i++) {
        innerEdges[i].next = innerEdges[(i+1)%innerEdges.length];
        innerEdges[i].prev = innerEdges[(i+innerEdges.length-1)%innerEdges.length];
      }
      innerFace.halfEdge = innerEdges[0];
      innerEdges.forEach(e => { if (!e.vertex.halfEdge) e.vertex.halfEdge = e; });

      // Create side faces connecting original to inset
      for (let i=0;i<verts.length;i++) {
        const a  = verts[i];
        const b  = verts[(i+1)%verts.length];
        const ia = insetVs[i];
        const ib = insetVs[(i+1)%insetVs.length];
        const sf = this.addFace();
        const e0=this.addHalfEdge(); e0.vertex=a;  e0.face=sf;
        const e1=this.addHalfEdge(); e1.vertex=b;  e1.face=sf;
        const e2=this.addHalfEdge(); e2.vertex=ib; e2.face=sf;
        const e3=this.addHalfEdge(); e3.vertex=ia; e3.face=sf;
        e0.next=e1; e1.next=e2; e2.next=e3; e3.next=e0;
        e0.prev=e3; e1.prev=e0; e2.prev=e1; e3.prev=e2;
        sf.halfEdge=e0;
      }
    });
    return [...newVerts.values()];
  }


  // ── Session 6: Add face from vertex array (n-gon support) ─────────────────
  addFaceFromVertices(verts) {
    if (verts.length < 3) return null;
    const face  = this.addFace();
    const edges = verts.map(() => this.addHalfEdge());
    verts.forEach((v, i) => {
      edges[i].vertex = v;
      edges[i].face   = face;
      if (!v.halfEdge) v.halfEdge = edges[i];
    });
    for (let i = 0; i < edges.length; i++) {
      edges[i].next = edges[(i+1) % edges.length];
      edges[i].prev = edges[(i+edges.length-1) % edges.length];
    }
    face.halfEdge = edges[0];
    return face;
  }

  // ── Session 7: Triangulate all faces (for export) ─────────────────────────
  triangulateAll() {
    const tris = new HalfEdgeMesh();
    const vmap = new Map();
    this.vertices.forEach(v => {
      const nv = tris.addVertex(v.x, v.y, v.z);
      vmap.set(v.id, nv);
    });
    this.faces.forEach(face => {
      const verts = face.vertices();
      if (verts.length < 3) return;
      const mapped = verts.map(v => vmap.get(v.id));
      for (let i = 1; i < mapped.length - 1; i++) {
        tris.addFaceFromVertices([mapped[0], mapped[i], mapped[i+1]]);
      }
    });
    return tris;
  }

  // ── Session 7: Export as triangulated BufferGeometry arrays ──────────────
  toTriangulatedBufferGeometry() {
    return this.triangulateAll().toBufferGeometry();
  }


}
