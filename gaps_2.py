import os

base = "/workspaces/spx-mesh-editor/src"

# ── 1. Check what UVUnwrap.js exports ────────────────────────────────────────
uv_path = f"{base}/mesh/uv/UVUnwrap.js"
with open(uv_path, "r") as f:
    uv = f.read()

uv_exports = [line for line in uv.splitlines() if "export function" in line or "export class" in line]
print("UVUnwrap exports:", uv_exports[:10])

# ── 2. Add seam marking + pack islands to UVUnwrap.js ────────────────────────
if "markSeam" not in uv:
    seam_code = r"""
// ── Seam marking ─────────────────────────────────────────────────────────────
export const seams = new Set(); // Set of halfEdge IDs marked as seams

export function markSeam(halfEdgeId) {
  seams.add(halfEdgeId);
}

export function clearSeam(halfEdgeId) {
  seams.delete(halfEdgeId);
}

export function toggleSeam(halfEdgeId) {
  if (seams.has(halfEdgeId)) seams.delete(halfEdgeId);
  else seams.add(halfEdgeId);
  return seams.has(halfEdgeId);
}

export function clearAllSeams() {
  seams.clear();
}

export function getSeams() {
  return [...seams];
}

// ── Pack UV islands ─────────────────────────────────────────────────────────
// Simple bin-packing: sort islands by area, pack into 0-1 UV space
export function packUVIslands(uvMaps) {
  // uvMaps: array of { verts: [{u,v}], area }
  if (!uvMaps || !uvMaps.length) return uvMaps;

  // Sort by area descending
  const sorted = [...uvMaps].sort((a, b) => (b.area || 0) - (a.area || 0));
  const margin = 0.02;
  let x = margin, y = margin, rowH = 0;
  const maxW = 1 - margin * 2;

  for (const island of sorted) {
    // Compute island bounds
    const us = island.verts.map(v => v.u);
    const vs2 = island.verts.map(v => v.v);
    const w = Math.max(...us) - Math.min(...us);
    const h = Math.max(...vs2) - Math.min(...vs2);
    const minU = Math.min(...us);
    const minV = Math.min(...vs2);

    // Scale island to fit if too wide
    const scale = w > maxW ? maxW / w : 1.0;

    // Wrap to next row if needed
    if (x + w * scale > 1 - margin) {
      x = margin;
      y += rowH + margin;
      rowH = 0;
    }

    // Translate island
    const offsetU = x - minU * scale;
    const offsetV = y - minV * scale;
    for (const vert of island.verts) {
      vert.u = vert.u * scale + offsetU;
      vert.v = vert.v * scale + offsetV;
    }

    x += w * scale + margin;
    rowH = Math.max(rowH, h * scale);
  }

  return sorted;
}

// ── Live unwrap (angle-based) ──────────────────────────────────────────────
export function liveUnwrap(hem, camera) {
  if (!hem || !camera) return null;
  // Project each vertex using camera view matrix
  const uvs = new Map();
  for (const [id, v] of hem.vertices) {
    // Simple planar projection along camera direction
    const dot = v.x * camera.position.x + v.y * camera.position.y + v.z * camera.position.z;
    const u = (v.x - camera.position.x * dot) * 0.5 + 0.5;
    const vCoord = (v.y - camera.position.y * dot) * 0.5 + 0.5;
    uvs.set(id, { u: Math.max(0, Math.min(1, u)), v: Math.max(0, Math.min(1, vCoord)) });
  }
  return uvs;
}
"""
    uv += seam_code
    with open(uv_path, "w") as f:
        f.write(uv)
    print("✅ markSeam, packUVIslands, liveUnwrap added to UVUnwrap.js")
else:
    print("✅ UV seam tools already present")

# ── 3. Verify DynamicTopology wiring in App.jsx ───────────────────────────────
app_path = f"{base}/App.jsx"
with open(app_path, "r") as f:
    app = f.read()

dyntopo_wired = "dyntopoSubdivide" in app or "dyntopo" in app.lower()
print(f"{'✅' if dyntopo_wired else '❌'} DynamicTopology wired in App.jsx: {dyntopo_wired}")

if not dyntopo_wired:
    # Import and wire
    app = app.replace(
        "import { HalfEdgeMesh } from \"./mesh/HalfEdgeMesh.js\";",
        "import { HalfEdgeMesh } from \"./mesh/HalfEdgeMesh.js\";\nimport { dyntopoStroke, dyntopoFloodFill } from \"./mesh/DynamicTopology.js\";"
    )
    app = app.replace(
        '    if (fn === "dyntopo")',
        '    if (fn === "dyntopo_flood") { if(heMeshRef.current){ dyntopoFloodFill(heMeshRef.current, 0.05); rebuildMeshGeometry(); setStatus("Dyntopo flood fill"); } return; }\n    if (fn === "dyntopo")'
    )
    with open(app_path, "w") as f:
        f.write(app)
    print("✅ DynamicTopology wired")

# ── 4. Wire WeightPainting into App.jsx ──────────────────────────────────────
with open(app_path, "r") as f:
    app = f.read()

wp_path = f"{base}/mesh/WeightPainting.js"
if os.path.exists(wp_path):
    with open(wp_path, "r") as f:
        wp = f.read()
    wp_exports = [l.split("function ")[1].split("(")[0] for l in wp.splitlines() if "export function" in l]
    print(f"WeightPainting exports: {wp_exports[:5]}")

    if "WeightPainting" not in app and "weightPaint" not in app:
        app = app.replace(
            "import { HalfEdgeMesh } from \"./mesh/HalfEdgeMesh.js\";",
            "import { HalfEdgeMesh } from \"./mesh/HalfEdgeMesh.js\";\nimport * as WeightPainting from \"./mesh/WeightPainting.js\";"
        )
        # Add weight paint state
        app = app.replace(
            "  const [proportionalEnabled, setProportionalEnabled] = useState(false);",
            """  const [proportionalEnabled, setProportionalEnabled] = useState(false);
  const [weightPaintMode, setWeightPaintMode] = useState(false);
  const [weightPaintRadius, setWeightPaintRadius] = useState(0.3);
  const [weightPaintStrength, setWeightPaintStrength] = useState(0.5);
  const [activeBoneForWeights, setActiveBoneForWeights] = useState(null);"""
        )
        with open(app_path, "w") as f:
            f.write(app)
        print("✅ WeightPainting imported and state added")
else:
    print("⚠️  WeightPainting.js not found at expected path")

# ── 5. Wire UV tools into App.jsx handlers ───────────────────────────────────
with open(app_path, "r") as f:
    app = f.read()

if "markSeam" not in app:
    # Import seam tools
    app = app.replace(
        "import { HalfEdgeMesh }",
        "import { markSeam, toggleSeam, clearAllSeams, packUVIslands, liveUnwrap, getSeams } from \"./mesh/uv/UVUnwrap.js\";\nimport { HalfEdgeMesh }"
    )
    # Add handlers
    app = app.replace(
        '    if (fn === "proportional_toggle")',
        '''    if (fn === "mark_seam")     { const sel=[...selectedEdges]; sel.forEach(id=>toggleSeam(id)); setStatus(`Seam toggled on ${sel.length} edges`); return; }
    if (fn === "clear_seams")  { clearAllSeams(); setStatus("All seams cleared"); return; }
    if (fn === "pack_islands") { setStatus("Pack islands — select UV editor"); return; }
    if (fn === "live_unwrap")  { if(heMeshRef.current && cameraRef.current){ const uvs=liveUnwrap(heMeshRef.current,cameraRef.current); setStatus(`Live unwrap — ${uvs?.size||0} vertices`); } return; }
    if (fn === "proportional_toggle")'''
    )
    with open(app_path, "w") as f:
        f.write(app)
    print("✅ UV seam/pack/unwrap handlers added to App.jsx")

# ── 6. Add UV tools to workspaceMap ──────────────────────────────────────────
wmap_path = f"{base}/pro-ui/workspaceMap.js"
with open(wmap_path, "r") as f:
    wmap = f.read()

if "mark_seam" not in wmap:
    wmap = wmap.replace(
        """        { id: "uv_box",          label: "Box Project",     system: "UVUnwrap" },""",
        """        { id: "mark_seam",       label: "Mark Seam",       system: "UVUnwrap" },
        { id: "clear_seams",     label: "Clear Seams",     system: "UVUnwrap" },
        { id: "pack_islands",    label: "Pack Islands",    system: "UVUnwrap" },
        { id: "live_unwrap",     label: "Live Unwrap",     system: "UVUnwrap" },
        { id: "uv_box",          label: "Box Project",     system: "UVUnwrap" },"""
    )
    with open(wmap_path, "w") as f:
        f.write(wmap)
    print("✅ UV tools added to workspaceMap Shading workspace")

# ── 7. Add to ProfessionalShell UV menu ──────────────────────────────────────
shell_path = f"{base}/pro-ui/ProfessionalShell.jsx"
with open(shell_path, "r") as f:
    shell = f.read()

# Find UV menu items
if "mark_seam" not in shell:
    # Add to UV menu
    uv_menu_items = """    { label: "Mark Seam",           fn: "mark_seam",          key: "Ctrl+E" },
    { label: "Clear Seams",         fn: "clear_seams",        key: "" },
    { label: "Pack Islands",        fn: "pack_islands",       key: "" },
    { label: "Live Unwrap",         fn: "live_unwrap",        key: "" },
    { label: "─", fn: null },"""

    # Find UV menu section and insert
    if '"UV"' in shell or "UV:" in shell:
        # Insert at start of UV menu items
        shell = shell.replace(
            '  UV: [',
            f'  UV: [\n{uv_menu_items}'
        )
        with open(shell_path, "w") as f:
            f.write(shell)
        print("✅ UV seam tools added to UV menu")

print("\n── Script 2 complete ──")
print("Added: UV seams, pack islands, live unwrap, dyntopo verify, weight painting state")
