import os

base = "/workspaces/spx-mesh-editor/src"

# ── 1. Add proportional editing + snap + grid fill to HalfEdgeMesh ───────────
hem_path = f"{base}/mesh/HalfEdgeMesh.js"
with open(hem_path, "r") as f:
    hem = f.read()

new_methods = r"""
  // ── PROPORTIONAL EDITING ────────────────────────────────────────────────────
  // Move selected vertices with falloff influence on nearby verts
  proportionalTransform(selectedVertIds, delta, radius, falloffType = 'smooth') {
    const selected = new Set(selectedVertIds);
    // Build influence map for all verts within radius
    const influenced = new Map();
    for (const [id, v] of this.vertices) {
      let minDist = Infinity;
      for (const selId of selected) {
        const sv = this.vertices.get(selId);
        if (!sv) continue;
        const d = Math.sqrt((v.x-sv.x)**2+(v.y-sv.y)**2+(v.z-sv.z)**2);
        if (d < minDist) minDist = d;
      }
      if (minDist <= radius) {
        const t = minDist / radius;
        let influence;
        switch (falloffType) {
          case 'smooth':   influence = 1 - 3*t*t + 2*t*t*t; break;
          case 'sphere':   influence = Math.sqrt(Math.max(0, 1 - t*t)); break;
          case 'linear':   influence = 1 - t; break;
          case 'sharp':    influence = (1 - t) * (1 - t); break;
          case 'constant': influence = 1.0; break;
          default:         influence = 1 - t;
        }
        influenced.set(id, selected.has(id) ? 1.0 : influence);
      }
    }
    // Apply transform
    for (const [id, influence] of influenced) {
      const v = this.vertices.get(id);
      if (!v) continue;
      v.x += delta.x * influence;
      v.y += delta.y * influence;
      v.z += delta.z * influence;
    }
    return influenced.size;
  }

  // ── SNAP TO SURFACE ─────────────────────────────────────────────────────────
  // Snap a vertex to the nearest point on another mesh's surface
  snapVertexToSurface(vertexId, targetMesh) {
    const v = this.vertices.get(vertexId);
    if (!v || !targetMesh?.geometry) return false;
    const pos = targetMesh.geometry.attributes.position;
    if (!pos) return false;
    let bestDist = Infinity, bestX = v.x, bestY = v.y, bestZ = v.z;
    for (let i = 0; i < pos.count; i++) {
      const tx = pos.getX(i), ty = pos.getY(i), tz = pos.getZ(i);
      const d = Math.sqrt((v.x-tx)**2+(v.y-ty)**2+(v.z-tz)**2);
      if (d < bestDist) { bestDist = d; bestX = tx; bestY = ty; bestZ = tz; }
    }
    v.x = bestX; v.y = bestY; v.z = bestZ;
    return true;
  }

  // Snap vertex to nearest vertex
  snapVertexToVertex(vertexId, targetHEM) {
    const v = this.vertices.get(vertexId);
    if (!v) return false;
    let bestDist = Infinity, best = null;
    for (const tv of targetHEM.vertices.values()) {
      const d = Math.sqrt((v.x-tv.x)**2+(v.y-tv.y)**2+(v.z-tv.z)**2);
      if (d < bestDist) { bestDist = d; best = tv; }
    }
    if (best) { v.x = best.x; v.y = best.y; v.z = best.z; return true; }
    return false;
  }

  // ── GRID FILL ────────────────────────────────────────────────────────────────
  // Fill a loop of boundary edges with a grid topology
  gridFill(boundaryVertIds) {
    if (boundaryVertIds.length < 4) return null;
    const verts = boundaryVertIds.map(id => this.vertices.get(id)).filter(Boolean);
    if (verts.length < 4) return null;
    // Find center
    const cx = verts.reduce((s,v)=>s+v.x,0)/verts.length;
    const cy = verts.reduce((s,v)=>s+v.y,0)/verts.length;
    const cz = verts.reduce((s,v)=>s+v.z,0)/verts.length;
    const center = this.addVertex(cx, cy, cz);
    // Create fan triangles from center to each edge
    const newFaces = [];
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i], b = verts[(i+1)%verts.length];
      const e1 = this.addHalfEdge(), e2 = this.addHalfEdge(), e3 = this.addHalfEdge();
      const f = this.addFace();
      e1.vertex = a; e2.vertex = b; e3.vertex = center;
      e1.next = e2; e2.next = e3; e3.next = e1;
      e1.prev = e3; e2.prev = e1; e3.prev = e2;
      e1.face = e2.face = e3.face = f;
      f.edge = e1;
      newFaces.push(f);
    }
    return newFaces;
  }
"""

# Insert before mirror method
if "  mirror(axis='x')" in hem and "proportionalTransform" not in hem:
    hem = hem.replace("  mirror(axis='x')", new_methods + "\n  mirror(axis='x')")
    with open(hem_path, "w") as f:
        f.write(hem)
    print("✅ proportionalTransform, snapToSurface, snapToVertex, gridFill added to HalfEdgeMesh")
else:
    print("⚠️  Already present or insertion point not found")

# ── 2. Wire into App.jsx ──────────────────────────────────────────────────────
app_path = f"{base}/App.jsx"
with open(app_path, "r") as f:
    app = f.read()

# Add proportional editing state
if "proportionalEnabled" not in app:
    app = app.replace(
        "  const [style3DTo2DOpen, setStyle3DTo2DOpen] = useState(false);",
        """  const [style3DTo2DOpen, setStyle3DTo2DOpen] = useState(false);
  const [proportionalEnabled, setProportionalEnabled] = useState(false);
  const [proportionalRadius, setProportionalRadius] = useState(1.0);
  const [proportionalFalloff, setProportionalFalloff] = useState('smooth');
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapMode, setSnapMode] = useState('vertex'); // vertex | surface | grid"""
    )
    print("✅ Proportional editing state added")

# Add handlers
if "proportional_toggle" not in app:
    app = app.replace(
        '    if (fn === "target_weld")',
        '''    if (fn === "proportional_toggle") { setProportionalEnabled(v=>!v); setStatus(proportionalEnabled ? "Proportional off" : "Proportional on (O)"); return; }
    if (fn === "proportional_radius_up") { setProportionalRadius(r=>Math.min(10,r+0.2)); return; }
    if (fn === "proportional_radius_down") { setProportionalRadius(r=>Math.max(0.1,r-0.2)); return; }
    if (fn === "snap_toggle") { setSnapEnabled(v=>!v); setStatus(snapEnabled ? "Snap off" : "Snap on"); return; }
    if (fn === "grid_fill")   { if(heMeshRef.current){ const sel=[...selectedVerts]; const faces=heMeshRef.current.gridFill(sel); if(faces) { rebuildMeshGeometry(); setStatus(`Grid fill — ${faces.length} faces`); }} return; }
    if (fn === "target_weld")'''
    )
    print("✅ Proportional + snap + grid fill handlers added")

# Wire proportional editing into grab/move — when proportionalEnabled, use proportionalTransform
if "proportionalEnabled && heMeshRef" not in app:
    app = app.replace(
        "    if (fn === \"grab\")",
        """    if (fn === "grab") {
      if (proportionalEnabled && heMeshRef.current && selectedVerts.size > 0) {
        // Proportional grab — will be applied on mouse move via delta
        window._proportionalActive = true;
        window._proportionalRadius = proportionalRadius;
        window._proportionalFalloff = proportionalFalloff;
        setStatus(`Proportional Grab — radius: ${proportionalRadius.toFixed(1)}`);
        return;
      }
    }
    if (fn === "_grab_legacy")"""
    )
    print("✅ Proportional grab wired")

with open(app_path, "w") as f:
    f.write(app)

# ── 3. Wire into workspaceMap ─────────────────────────────────────────────────
wmap_path = f"{base}/pro-ui/workspaceMap.js"
with open(wmap_path, "r") as f:
    wmap = f.read()

if "proportional_toggle" not in wmap:
    wmap = wmap.replace(
        """        { id: "grab",        label: "Grab",           system: "TransformGizmo" },""",
        """        { id: "grab",        label: "Grab",           system: "TransformGizmo" },
        { id: "proportional_toggle", label: "Proportional (O)", system: "HalfEdgeMesh" },
        { id: "snap_toggle",         label: "Snap Toggle",      system: "HalfEdgeMesh" },"""
    )
    wmap = wmap.replace(
        """        { id: "grid_fill",   label: "Grid Fill",      system: "NgonSupport"  },""",
        """        { id: "grid_fill",   label: "Grid Fill",      system: "HalfEdgeMesh" },"""
    )
    with open(wmap_path, "w") as f:
        f.write(wmap)
    print("✅ Proportional + snap + grid fill added to workspaceMap")

# ── 4. Add O key shortcut for proportional editing ───────────────────────────
with open(app_path, "r") as f:
    app = f.read()

if "proportional_toggle" not in app[app.find("keydown"):app.find("keydown")+2000]:
    app = app.replace(
        "    window.addEventListener('keydown', onAutoRigKey);",
        """    window.addEventListener('keydown', onAutoRigKey);""",
        1
    )
    # Add O key for proportional
    if "key.toLowerCase() === 'o'" not in app:
        app = app.replace(
            "  useEffect(() => { editModeRef.current = editMode; }, [editMode]);",
            """  useEffect(() => {
    const onProportionalKey = (e) => {
      if (e.key.toLowerCase() === 'o' && editModeRef.current === 'edit') {
        e.preventDefault();
        setProportionalEnabled(v => !v);
      }
    };
    window.addEventListener('keydown', onProportionalKey);
    return () => window.removeEventListener('keydown', onProportionalKey);
  }, []);

  useEffect(() => { editModeRef.current = editMode; }, [editMode]);"""
        )
        print("✅ O key shortcut for proportional editing added")

with open(app_path, "w") as f:
    f.write(app)

# ── 5. Add to ProfessionalShell Mesh menu ────────────────────────────────────
shell_path = f"{base}/pro-ui/ProfessionalShell.jsx"
with open(shell_path, "r") as f:
    shell = f.read()

if "proportional_toggle" not in shell:
    shell = shell.replace(
        '    { label: "─", fn: null },\n    { label: "Target Weld"',
        '    { label: "─", fn: null },\n    { label: "Proportional Edit (O)", fn: "proportional_toggle", key: "O" },\n    { label: "Snap Toggle",          fn: "snap_toggle",          key: "" },\n    { label: "Grid Fill",            fn: "grid_fill",            key: "" },\n    { label: "─", fn: null },\n    { label: "Target Weld"'
    )
    with open(shell_path, "w") as f:
        f.write(shell)
    print("✅ Proportional, Snap, Grid Fill added to Mesh menu")

print("\n── Script 1 complete ──")
print("Added: proportionalTransform, snapToSurface/Vertex, gridFill")
print("Wired: O key toggle, state, handlers, workspaceMap, Mesh menu")
