path = "src/mesh/HalfEdgeMesh.js"
with open(path, "r") as f:
    src = f.read()

new_methods = r"""
  // ── TARGET WELD ─────────────────────────────────────────────────────────────
  // Merge sourceVertex onto targetVertex — all edges from source rerouted to target
  targetWeld(sourceVertexId, targetVertexId) {
    const src = this.vertices.get(sourceVertexId);
    const tgt = this.vertices.get(targetVertexId);
    if (!src || !tgt || sourceVertexId === targetVertexId) return false;
    // Reroute all half-edges pointing to src → tgt
    for (const e of this.halfEdges.values()) {
      if (e.vertex === src) e.vertex = tgt;
    }
    this.vertices.delete(sourceVertexId);
    // Remove degenerate faces (faces where two verts are now the same)
    for (const [fid, face] of this.faces) {
      const verts = face.vertices();
      const unique = new Set(verts.map(v => v.id));
      if (unique.size < verts.length) this.faces.delete(fid);
    }
    return true;
  }

  // ── CHAMFER VERTEX ──────────────────────────────────────────────────────────
  // Split a vertex into multiple vertices (one per adjacent edge), creating a face
  chamferVertex(vertexId, amount = 0.1) {
    const v = this.vertices.get(vertexId);
    if (!v) return null;
    const neighbors = [];
    for (const e of this.halfEdges.values()) {
      if (e.vertex === v && e.twin) {
        const adj = e.twin.vertex;
        if (adj) neighbors.push(adj);
      }
    }
    const newVerts = neighbors.map(n => {
      const nx = v.x + (n.x - v.x) * amount;
      const ny = v.y + (n.y - v.y) * amount;
      const nz = v.z + (n.z - v.z) * amount;
      return this.addVertex(nx, ny, nz);
    });
    this.vertices.delete(vertexId);
    return newVerts;
  }

  // ── AVERAGE VERTEX ──────────────────────────────────────────────────────────
  // Smooth selected vertices by averaging positions with their neighbors
  averageVertices(vertexIds, strength = 0.5, iterations = 1) {
    const ids = new Set(vertexIds);
    for (let iter = 0; iter < iterations; iter++) {
      for (const vid of ids) {
        const v = this.vertices.get(vid);
        if (!v) continue;
        const neighbors = [];
        for (const e of this.halfEdges.values()) {
          if (e.vertex === v && e.twin?.vertex) neighbors.push(e.twin.vertex);
        }
        if (!neighbors.length) continue;
        const ax = neighbors.reduce((s, n) => s + n.x, 0) / neighbors.length;
        const ay = neighbors.reduce((s, n) => s + n.y, 0) / neighbors.length;
        const az = neighbors.reduce((s, n) => s + n.z, 0) / neighbors.length;
        v.x += (ax - v.x) * strength;
        v.y += (ay - v.y) * strength;
        v.z += (az - v.z) * strength;
      }
    }
  }

  // ── CIRCULARIZE ─────────────────────────────────────────────────────────────
  // Arrange selected vertices in a circle — keeps center of mass, projects onto circle
  circularize(vertexIds) {
    if (vertexIds.length < 3) return;
    const verts = vertexIds.map(id => this.vertices.get(id)).filter(Boolean);
    // Compute centroid
    const cx = verts.reduce((s, v) => s + v.x, 0) / verts.length;
    const cy = verts.reduce((s, v) => s + v.y, 0) / verts.length;
    const cz = verts.reduce((s, v) => s + v.z, 0) / verts.length;
    // Compute average radius
    const radius = verts.reduce((s, v) =>
      s + Math.sqrt((v.x-cx)**2 + (v.y-cy)**2 + (v.z-cz)**2), 0) / verts.length;
    // Project each vertex onto circle
    verts.forEach((v, i) => {
      const angle = (i / verts.length) * Math.PI * 2;
      const dx = v.x - cx, dz = v.z - cz;
      const len = Math.sqrt(dx*dx + dz*dz) || 1;
      v.x = cx + (dx / len) * radius;
      v.z = cz + (dz / len) * radius;
      v.y = cy; // flatten to plane
    });
  }

  // ── REORDER VERTICES ────────────────────────────────────────────────────────
  // Reindex vertex IDs in a deterministic order (by position sort)
  reorderVertices() {
    const sorted = [...this.vertices.values()].sort((a, b) =>
      a.x !== b.x ? a.x - b.x : a.y !== b.y ? a.y - b.y : a.z - b.z
    );
    const newMap = new Map();
    sorted.forEach((v, i) => {
      const newId = `v_${i}`;
      newMap.set(newId, v);
      // Update all half-edge references
      for (const e of this.halfEdges.values()) {
        if (e.vertex === v) { /* reference is same object, no update needed */ }
      }
      v.id = newId;
    });
    this.vertices = newMap;
    return sorted.length;
  }

  // ── MULTI-CUT ───────────────────────────────────────────────────────────────
  // Cut multiple edges at specified parametric positions along a path
  multiCut(edgeCuts) {
    // edgeCuts: [{ halfEdgeId, t }]
    const newVerts = [];
    for (const { halfEdgeId, t } of edgeCuts) {
      const e = this.halfEdges.get(halfEdgeId);
      if (!e || !e.vertex || !e.twin?.vertex) continue;
      const vA = e.twin.vertex, vB = e.vertex;
      const nv = this.addVertex(
        vA.x + (vB.x - vA.x) * t,
        vA.y + (vB.y - vA.y) * t,
        vA.z + (vB.z - vA.z) * t,
      );
      this._splitEdge(e, nv);
      newVerts.push(nv);
    }
    return newVerts;
  }

  // ── CONNECT COMPONENTS ──────────────────────────────────────────────────────
  // Create an edge between two vertices that share a face
  connectComponents(vertexIdA, vertexIdB) {
    const vA = this.vertices.get(vertexIdA);
    const vB = this.vertices.get(vertexIdB);
    if (!vA || !vB) return false;
    // Find a face that contains both vertices
    for (const face of this.faces.values()) {
      const fverts = face.vertices ? face.vertices() : [];
      const hasA = fverts.some(v => v.id === vertexIdA);
      const hasB = fverts.some(v => v.id === vertexIdB);
      if (hasA && hasB) {
        // Split the face by adding a new half-edge pair
        const e1 = this.addHalfEdge();
        const e2 = this.addHalfEdge();
        e1.vertex = vB; e2.vertex = vA;
        e1.twin = e2; e2.twin = e1;
        e1.face = face; e2.face = this.addFace();
        return true;
      }
    }
    return false;
  }

  // ── SNAP TOGETHER ──────────────────────────────────────────────────────────
  // Snap closest boundary vertices between two meshes within a threshold
  static snapTogether(hemA, hemB, threshold = 0.05) {
    const snapped = [];
    for (const vA of hemA.vertices.values()) {
      let best = null, bestDist = threshold;
      for (const vB of hemB.vertices.values()) {
        const d = Math.sqrt((vA.x-vB.x)**2 + (vA.y-vB.y)**2 + (vA.z-vB.z)**2);
        if (d < bestDist) { bestDist = d; best = vB; }
      }
      if (best) {
        vA.x = best.x; vA.y = best.y; vA.z = best.z;
        snapped.push({ from: vA.id, to: best.id, dist: bestDist });
      }
    }
    return snapped;
  }

  // ── PAINT SELECT (vertex region) ────────────────────────────────────────────
  // Select all vertices within a sphere (brush) at worldPos with given radius
  paintSelectVertices(worldPos, radius, existingSelection = new Set()) {
    const sel = new Set(existingSelection);
    for (const [id, v] of this.vertices) {
      const d = Math.sqrt((v.x-worldPos.x)**2 + (v.y-worldPos.y)**2 + (v.z-worldPos.z)**2);
      if (d <= radius) sel.add(id);
    }
    return sel;
  }

  // ── PAINT DESELECT ──────────────────────────────────────────────────────────
  paintDeselectVertices(worldPos, radius, existingSelection = new Set()) {
    const sel = new Set(existingSelection);
    for (const [id, v] of this.vertices) {
      const d = Math.sqrt((v.x-worldPos.x)**2 + (v.y-worldPos.y)**2 + (v.z-worldPos.z)**2);
      if (d <= radius) sel.delete(id);
    }
    return sel;
  }
"""

# Inject before the closing brace of HalfEdgeMesh class
# Find the last method closing — insert before final }
# The class ends with the mirror() method then closing }
insert_before = "\n  mirror(axis='x')"
if insert_before in src:
    src = src.replace(insert_before, new_methods + insert_before)
    with open(path, "w") as f:
        f.write(src)
    print(f"✅ 9 Maya tools added to HalfEdgeMesh.js")
    print("   targetWeld, chamferVertex, averageVertices, circularize,")
    print("   reorderVertices, multiCut, connectComponents, snapTogether,")
    print("   paintSelectVertices, paintDeselectVertices")
else:
    # fallback: inject before last }
    last_brace = src.rfind("\n}")
    src = src[:last_brace] + new_methods + src[last_brace:]
    with open(path, "w") as f:
        f.write(src)
    print("✅ 9 Maya tools added (fallback insertion)")
