path = "src/App.jsx"
with open(path, "r") as f:
    src = f.read()

# Add handlers for the new tools in handleApplyFunction
# Find a good insertion point near other mesh edit handlers
old_handler = '    if (fn === "extrude")'
new_handlers = '''    if (fn === "target_weld")      { if(meshRef.current?.userData?.hem){ const sel=[...window._selectedVerts||[]]; if(sel.length>=2){ meshRef.current.userData.hem.targetWeld(sel[0],sel[1]); rebuildMesh(); setStatus("Target Weld applied"); }} return; }
    if (fn === "chamfer_vertex")   { if(meshRef.current?.userData?.hem){ const sel=[...window._selectedVerts||[]]; sel.forEach(id=>meshRef.current.userData.hem.chamferVertex(id,0.1)); rebuildMesh(); setStatus("Chamfer applied"); }} return; }
    if (fn === "average_vertex")   { if(meshRef.current?.userData?.hem){ const sel=[...window._selectedVerts||[]]; meshRef.current.userData.hem.averageVertices(sel,0.5,2); rebuildMesh(); setStatus("Vertices averaged"); }} return; }
    if (fn === "circularize")      { if(meshRef.current?.userData?.hem){ const sel=[...window._selectedVerts||[]]; meshRef.current.userData.hem.circularize(sel); rebuildMesh(); setStatus("Circularize applied"); }} return; }
    if (fn === "reorder_verts")    { if(meshRef.current?.userData?.hem){ const n=meshRef.current.userData.hem.reorderVertices(); setStatus(`Reordered ${n} vertices`); }} return; }
    if (fn === "connect_comps")    { if(meshRef.current?.userData?.hem){ const sel=[...window._selectedVerts||[]]; if(sel.length>=2){ meshRef.current.userData.hem.connectComponents(sel[0],sel[1]); rebuildMesh(); setStatus("Components connected"); }}} return; }
    if (fn === "extrude")'''

if '    if (fn === "extrude")' in src and "target_weld" not in src:
    src = src.replace(old_handler, new_handlers)
    with open(path, "w") as f:
        f.write(src)
    print("✅ Maya tool handlers added to App.jsx")
else:
    print("⚠️  Handlers already present or insertion point not found")

# Wire into workspaceMap
wmap_path = "src/pro-ui/workspaceMap.js"
with open(wmap_path, "r") as f:
    wmap = f.read()

old_bool = '''    {
      folder: "Boolean Ops",
      items: [
        { id: "bool_union",    label: "Union",        system: "BooleanOps" },
        { id: "bool_subtract", label: "Subtract",     system: "BooleanOps" },
        { id: "bool_intersect",label: "Intersect",    system: "BooleanOps" },
      ],
    },'''

new_bool = '''    {
      folder: "Boolean Ops",
      items: [
        { id: "bool_union",    label: "Union",        system: "BooleanOps" },
        { id: "bool_subtract", label: "Subtract",     system: "BooleanOps" },
        { id: "bool_intersect",label: "Intersect",    system: "BooleanOps" },
      ],
    },
    {
      folder: "Vertex Tools",
      items: [
        { id: "target_weld",   label: "Target Weld",      system: "HalfEdgeMesh" },
        { id: "chamfer_vertex",label: "Chamfer Vertex",    system: "HalfEdgeMesh" },
        { id: "average_vertex",label: "Average Vertex",    system: "HalfEdgeMesh" },
        { id: "circularize",   label: "Circularize",       system: "HalfEdgeMesh" },
        { id: "reorder_verts", label: "Reorder Vertices",  system: "HalfEdgeMesh" },
        { id: "connect_comps", label: "Connect Components",system: "HalfEdgeMesh" },
        { id: "poke_face",     label: "Poke Face",         system: "NgonSupport"  },
        { id: "bridge",        label: "Bridge Faces",      system: "NgonSupport"  },
        { id: "multi_cut",     label: "Multi-Cut",         system: "HalfEdgeMesh" },
      ],
    },'''

if old_bool in wmap and "target_weld" not in wmap:
    wmap = wmap.replace(old_bool, new_bool)
    with open(wmap_path, "w") as f:
        f.write(wmap)
    print("✅ Vertex Tools folder added to workspaceMap Modeling workspace")
else:
    print("⚠️  workspaceMap already updated or insertion point changed")

# Add to ProfessionalShell Mesh menu
shell_path = "src/pro-ui/ProfessionalShell.jsx"
with open(shell_path, "r") as f:
    shell = f.read()

old_mesh_menu = '    { label: "Inset Faces",          fn: "inset",              key: "I" },'
new_mesh_menu = '''    { label: "Inset Faces",          fn: "inset",              key: "I" },
    { label: "─", fn: null },
    { label: "Target Weld",          fn: "target_weld",        key: "" },
    { label: "Chamfer Vertex",       fn: "chamfer_vertex",     key: "" },
    { label: "Average Vertex",       fn: "average_vertex",     key: "" },
    { label: "Circularize",          fn: "circularize",        key: "" },
    { label: "Connect Components",   fn: "connect_comps",      key: "" },
    { label: "Poke Face",            fn: "poke_face",          key: "" },
    { label: "Multi-Cut",            fn: "multi_cut",          key: "" },
    { label: "Reorder Vertices",     fn: "reorder_verts",      key: "" },'''

if old_mesh_menu in shell and "target_weld" not in shell:
    shell = shell.replace(old_mesh_menu, new_mesh_menu)
    with open(shell_path, "w") as f:
        f.write(shell)
    print("✅ Maya tools added to Mesh menu in ProfessionalShell")
else:
    print("⚠️  Shell already updated or insertion point changed")

print("\n── Done. Run: npm run build ──")
