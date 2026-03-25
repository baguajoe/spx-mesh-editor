
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
      if (verts.length === 3) {
        indices.push(vertIdMap.get(verts[0].id), vertIdMap.get(verts[1].id), vertIdMap.get(verts[2].id));
      } else if (verts.length === 4) {
        // Quad → two triangles
        const [a,b,c,d] = verts.map(v=>vertIdMap.get(v.id));
        indices.push(a,b,c, a,c,d);
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
  planeCut(axis='y', position=0, t=0.5) {
    const newVerts = [];
    const processed = new Set();

    this.halfEdges.forEach(e => {
      if (!e.twin) return;
      if (processed.has(e.id) || processed.has(e.twin.id)) return;
      processed.add(e.id); processed.add(e.twin.id);

      const vA = e.vertex;
      const vB = e.twin.vertex;

      const aVal = axis==='x' ? vA.x : axis==='y' ? vA.y : vA.z;
      const bVal = axis==='x' ? vB.x : axis==='y' ? vB.y : vB.z;

      // Edge crosses the cut plane
      if ((aVal < position && bVal > position) ||
          (aVal > position && bVal < position)) {
        const localT = (position - aVal) / (bVal - aVal);
        const nv = this.addVertex(
          vA.x + (vB.x - vA.x) * localT,
          vA.y + (vB.y - vA.y) * localT,
          vA.z + (vB.z - vA.z) * localT,
        );
        this._splitEdge(e, nv);
        newVerts.push(nv);
      }
    });

    return newVerts;
  }

  // ── Subdivision Surface (Catmull-Clark simplified) ──────────────────────
  subdivide() {
    const newMesh = new HalfEdgeMesh();
    // For each face: add face centroid
    const faceCentroids = new Map();
    this.faces.forEach(face => {
      const verts = face.vertices();
      const cx = verts.reduce((s,v)=>s+v.x,0)/verts.length;
      const cy = verts.reduce((s,v)=>s+v.y,0)/verts.length;
      const cz = verts.reduce((s,v)=>s+v.z,0)/verts.length;
      faceCentroids.set(face.id, newMesh.addVertex(cx,cy,cz));
    });

    // For each edge: add edge midpoint
    const edgeMids = new Map();
    const seen = new Set();
    this.halfEdges.forEach(e => {
      if (!e.twin || seen.has(e.id) || seen.has(e.twin.id)) return;
      seen.add(e.id);
      const a = e.vertex, b = e.twin.vertex;
      const mid = newMesh.addVertex((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);
      edgeMids.set(e.id, mid); edgeMids.set(e.twin.id, mid);
    });

    // For each original vertex: add smoothed position
    const smoothVerts = new Map();
    this.vertices.forEach(v => {
      // Average of adjacent face centroids and edge midpoints
      const adjFaces = []; const adjEdgeMids = [];
      let e = v.halfEdge;
      let guard = 0;
      do {
        if (e.face) adjFaces.push(faceCentroids.get(e.face.id));
        const mid = edgeMids.get(e.id);
        if (mid) adjEdgeMids.push(mid);
        if (!e.twin) break;
        e = e.twin.next;
        guard++;
      } while (e !== v.halfEdge && guard < 100);

      const n = adjFaces.length;
      if (n === 0) { smoothVerts.set(v.id, newMesh.addVertex(v.x,v.y,v.z)); return; }
      const fx = adjFaces.reduce((s,f)=>s+(f?.x||0),0)/n;
      const fy = adjFaces.reduce((s,f)=>s+(f?.y||0),0)/n;
      const fz = adjFaces.reduce((s,f)=>s+(f?.z||0),0)/n;
      const mx = adjEdgeMids.reduce((s,m)=>s+(m?.x||0),0)/Math.max(adjEdgeMids.length,1);
      const my = adjEdgeMids.reduce((s,m)=>s+(m?.y||0),0)/Math.max(adjEdgeMids.length,1);
      const mz = adjEdgeMids.reduce((s,m)=>s+(m?.z||0),0)/Math.max(adjEdgeMids.length,1);
      const sv = newMesh.addVertex(
        (fx + 2*mx + (n-3)*v.x)/n,
        (fy + 2*my + (n-3)*v.y)/n,
        (fz + 2*mz + (n-3)*v.z)/n,
      );
      smoothVerts.set(v.id, sv);
    });

    // Build new quads: for each original face, for each original vertex in face
    // create quad: smoothVert -> edgeMid -> faceCentroid -> prevEdgeMid
    this.faces.forEach(face => {
      const fc = faceCentroids.get(face.id);
      const edges = face.halfEdge.faceLoop();
      for (let i=0; i<edges.length; i++) {
        const e    = edges[i];
        const ePrev= edges[(i+edges.length-1)%edges.length];
        const sv   = smoothVerts.get(e.vertex.id);
        const em   = edgeMids.get(e.id);
        const epm  = edgeMids.get(ePrev.id);
        if (!sv||!em||!fc||!epm) return;
        // quad: sv, em, fc, epm
        const f = newMesh.addFace();
        const he0=newMesh.addHalfEdge(); he0.vertex=sv; he0.face=f;
        const he1=newMesh.addHalfEdge(); he1.vertex=em; he1.face=f;
        const he2=newMesh.addHalfEdge(); he2.vertex=fc; he2.face=f;
        const he3=newMesh.addHalfEdge(); he3.vertex=epm;he3.face=f;
        he0.next=he1; he1.next=he2; he2.next=he3; he3.next=he0;
        he0.prev=he3; he1.prev=he0; he2.prev=he1; he3.prev=he2;
        f.halfEdge=he0;
        if (!sv.halfEdge) sv.halfEdge=he0;
        if (!em.halfEdge) em.halfEdge=he1;
        if (!fc.halfEdge) fc.halfEdge=he2;
        if (!epm.halfEdge) epm.halfEdge=he3;
      }
    });
    return newMesh;
  }

  // ── Extrude selected faces ────────────────────────────────────────────────
  extrudeFaces(faceIds, amount=0.3) {
    const newVerts = new Map(); // oldVertId -> newVertId
    faceIds.forEach(faceIdx => {
      const face = [...this.faces.values()][faceIdx];
      if (!face) return;
      const normal = face.normal();
      const verts  = face.vertices();
      verts.forEach(v => {
        if (!newVerts.has(v.id)) {
          const nv = this.addVertex(
            v.x + normal.x*amount,
            v.y + normal.y*amount,
            v.z + normal.z*amount,
          );
          newVerts.set(v.id, nv);
        }
      });
      // Replace face vertices with extruded vertices
      face.halfEdge.faceLoop().forEach(e => {
        const nv = newVerts.get(e.vertex.id);
        if (nv) e.vertex = nv;
      });
      // Create side faces connecting original to extruded
      const origVerts = verts;
      for (let i=0;i<origVerts.length;i++) {
        const a  = origVerts[i];
        const b  = origVerts[(i+1)%origVerts.length];
        const na = newVerts.get(a.id);
        const nb = newVerts.get(b.id);
        if (!na||!nb) continue;
        const sf = this.addFace();
        const e0=this.addHalfEdge(); e0.vertex=a;  e0.face=sf;
        const e1=this.addHalfEdge(); e1.vertex=b;  e1.face=sf;
        const e2=this.addHalfEdge(); e2.vertex=nb; e2.face=sf;
        const e3=this.addHalfEdge(); e3.vertex=na; e3.face=sf;
        e0.next=e1; e1.next=e2; e2.next=e3; e3.next=e0;
        e0.prev=e3; e1.prev=e0; e2.prev=e1; e3.prev=e2;
        sf.halfEdge=e0;
      }
    });
    return newVerts;
  }

  // ── Merge vertices by distance (weld) ────────────────────────────────────
  mergeByDistance(threshold=0.001) {
    let merged = 0;
    const verts = [...this.vertices.values()];
    const remap = new Map();
    for (let i=0;i<verts.length;i++) {
      for (let j=i+1;j<verts.length;j++) {
        if (verts[i].distanceTo(verts[j]) < threshold) {
          remap.set(verts[j].id, verts[i]);
          merged++;
        }
      }
    }
    this.halfEdges.forEach(e => {
      if (remap.has(e.vertex.id)) e.vertex = remap.get(e.vertex.id);
    });
    remap.forEach((_,id)=>this.vertices.delete(id));
    return merged;
  }



  // ── Mirror ────────────────────────────────────────────────────────────────
  mirror(axis='x') {
    const original = [...this.vertices.values()];
    const mirrorMap = new Map();
    original.forEach(v => {
      const nv = this.addVertex(
        axis==='x' ? -v.x : v.x,
        axis==='y' ? -v.y : v.y,
        axis==='z' ? -v.z : v.z,
      );
      mirrorMap.set(v.id, nv);
    });
    // Mirror all faces (reversed winding for correct normals)
    const origFaces = [...this.faces.values()];
    origFaces.forEach(face => {
      const verts = face.vertices().reverse();
      const mf    = this.addFace();
      const edges = verts.map(() => this.addHalfEdge());
      verts.forEach((v,i) => {
        edges[i].vertex = mirrorMap.get(v.id) || v;
        edges[i].face   = mf;
      });
      for (let i=0;i<edges.length;i++) {
        edges[i].next = edges[(i+1)%edges.length];
        edges[i].prev = edges[(i+edges.length-1)%edges.length];
      }
      mf.halfEdge = edges[0];
      edges.forEach(e => { if (!e.vertex.halfEdge) e.vertex.halfEdge = e; });
    });
    return this;
  }

  // ── Bevel edges ───────────────────────────────────────────────────────────
  bevelEdges(amount=0.1) {
    const newVerts = [];
    const seen = new Set();
    this.halfEdges.forEach(e => {
      if (!e.twin || seen.has(e.id) || seen.has(e.twin.id)) return;
      seen.add(e.id); seen.add(e.twin.id);
      const a = e.vertex, b = e.twin.vertex;
      // Create two new verts offset from each end
      const dx=b.x-a.x, dy=b.y-a.y, dz=b.z-a.z;
      const len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
      const nx=dx/len, ny=dy/len, nz=dz/len;
      const va = this.addVertex(a.x+nx*amount, a.y+ny*amount, a.z+nz*amount);
      const vb = this.addVertex(b.x-nx*amount, b.y-ny*amount, b.z-nz*amount);
      newVerts.push({orig_a:a, orig_b:b, va, vb, edge:e});
    });
    return newVerts.length;
  }

  // ── Inset faces ───────────────────────────────────────────────────────────
  insetFaces(faceIds, amount=0.1) {
    const newVerts = new Map();
    faceIds.forEach(faceIdx => {
      const face = [...this.faces.values()][faceIdx];
      if (!face) return;
      const verts    = face.vertices();
      const centroid = face.centroid();
      // Move each vertex toward centroid by amount
      const insetVs = verts.map(v => {
        const nx = v.x + (centroid.x - v.x) * amount;
        const ny = v.y + (centroid.y - v.y) * amount;
        const nz = v.z + (centroid.z - v.z) * amount;
        const nv = this.addVertex(nx, ny, nz);
        newVerts.set(v.id + '_' + faceIdx, nv);
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


}
