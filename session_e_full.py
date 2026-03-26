from pathlib import Path

app = Path("/workspaces/spx-mesh-editor/src/App.jsx")
src = app.read_text()
original_len = len(src.splitlines())
changes = []

# ═══════════════════════════════════════════════════════════════════════════════
# 1. STATE — Geometry Nodes, Mesh Tools, LOD
# ═══════════════════════════════════════════════════════════════════════════════
old = "  const [showGraphEditor, setShowGraphEditor] = useState(false);"
new = (
    "  const [showGraphEditor, setShowGraphEditor] = useState(false);\n"
    "  // ── Session E: Geo Nodes + Mesh Tools + LOD ───────────────────────────\n"
    "  const [showGeoNodesPanel, setShowGeoNodesPanel] = useState(false);\n"
    "  const [geoGraph, setGeoGraph] = useState(() => createGraph());\n"
    "  const [geoNodeType, setGeoNodeType] = useState('transform');\n"
    "  const [geoSelectedNode, setGeoSelectedNode] = useState(null);\n"
    "  const [geoApplied, setGeoApplied] = useState(false);\n"
    "  const [showMeshToolsPanel, setShowMeshToolsPanel] = useState(false);\n"
    "  const [lodLevel, setLodLevel] = useState(0);\n"
    "  const [lodObj, setLodObj] = useState(null);\n"
    "  const [uvAxis, setUvAxis] = useState('z');\n"
    "  const [boolOp, setBoolOp] = useState('union');"
)
if old in src:
    src = src.replace(old, new, 1)
    changes.append("1. State vars added")
else:
    changes.append("1. SKIP — anchor not found")

# ═══════════════════════════════════════════════════════════════════════════════
# 2. HANDLERS — all at once before Sessions 108-121
# ═══════════════════════════════════════════════════════════════════════════════
old = "  // ── Sessions 108-121: VFX + Fluid + Asset + Procedural state ─────────────"
new = (
    "  // ── Session E: Geo Nodes handlers ──────────────────────────────────────\n"
    "  const handleGeoAddNode = () => {\n"
    "    const pos = { x: 20 + geoGraph.nodes.length * 140, y: 40 };\n"
    "    const node = addNode(geoGraph, geoNodeType, pos);\n"
    "    setGeoGraph({ ...geoGraph });\n"
    "    setGeoSelectedNode(node.id);\n"
    "    setStatus('Added ' + geoNodeType + ' node');\n"
    "  };\n"
    "  const handleGeoAddInput = () => {\n"
    "    const node = addNode(geoGraph, 'input', { x: 20, y: 40 });\n"
    "    setGeoGraph({ ...geoGraph }); setGeoSelectedNode(node.id);\n"
    "  };\n"
    "  const handleGeoAddOutput = () => {\n"
    "    const node = addNode(geoGraph, 'output', { x: 20 + geoGraph.nodes.length * 140, y: 40 });\n"
    "    setGeoGraph({ ...geoGraph }); setGeoSelectedNode(node.id);\n"
    "  };\n"
    "  const handleGeoConnect = () => {\n"
    "    const nodes = geoGraph.nodes;\n"
    "    if (nodes.length >= 2) {\n"
    "      const from = nodes[nodes.length - 2];\n"
    "      const to   = nodes[nodes.length - 1];\n"
    "      connectNodes(geoGraph, from.id, 'geometry', to.id, 'geometry');\n"
    "      setGeoGraph({ ...geoGraph });\n"
    "      setStatus('Connected ' + from.type + ' -> ' + to.type);\n"
    "    }\n"
    "  };\n"
    "  const handleGeoEvaluate = () => {\n"
    "    const mesh = meshRef.current;\n"
    "    if (!mesh) { setStatus('No mesh'); return; }\n"
    "    const result = evaluateGraph(geoGraph, mesh);\n"
    "    if (result && result !== mesh && sceneRef.current) {\n"
    "      result.position.copy(mesh.position);\n"
    "      sceneRef.current.add(result);\n"
    "      setGeoApplied(true);\n"
    "      setStatus('Geo nodes evaluated — result added to scene');\n"
    "    }\n"
    "  };\n"
    "  const handleGeoClear = () => {\n"
    "    setGeoGraph(createGraph()); setGeoSelectedNode(null); setGeoApplied(false);\n"
    "    setStatus('Geo nodes graph cleared');\n"
    "  };\n"
    "  const handleGeoUpdateParam = (nodeId, key, val) => {\n"
    "    const node = geoGraph.nodes.find(n => n.id === nodeId);\n"
    "    if (node) { node.params[key] = isNaN(Number(val)) ? val : Number(val); setGeoGraph({ ...geoGraph }); }\n"
    "  };\n"
    "\n"
    "  // ── Session E: Mesh Tools handlers ────────────────────────────────────\n"
    "  const handleFillHoles = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    fillHoles(mesh); mesh.geometry.computeVertexNormals();\n"
    "    setStatus('Holes filled');\n"
    "  };\n"
    "  const handleFixNormals = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    fixNormals(mesh); setStatus('Normals fixed');\n"
    "  };\n"
    "  const handleRemoveDoubles = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    removeDoubles(mesh); setStatus('Doubles removed');\n"
    "  };\n"
    "  const handleRemoveDegenerates = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    removeDegenerates(mesh); setStatus('Degenerates removed');\n"
    "  };\n"
    "  const handleFullRepair = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    fullRepair(mesh); mesh.geometry.computeVertexNormals();\n"
    "    setStatus('Full mesh repair complete');\n"
    "  };\n"
    "  const handleUVPlanar = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    uvPlanarProject(mesh.geometry, uvAxis); setStatus('UV planar projected (' + uvAxis + ')');\n"
    "  };\n"
    "  const handleUVBox = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    uvBoxProject(mesh.geometry); setStatus('UV box projected');\n"
    "  };\n"
    "  const handleUVSphere = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    uvSphereProject(mesh.geometry); setStatus('UV sphere projected');\n"
    "  };\n"
    "  const handleBooleanOp = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) { setStatus('Need active mesh'); return; }\n"
    "    const objs = sceneRef.current?.children?.filter(c => c.isMesh && c !== mesh) || [];\n"
    "    if (!objs.length) { setStatus('Need 2+ meshes for boolean'); return; }\n"
    "    let result;\n"
    "    if (boolOp === 'union')     result = booleanUnion(mesh, objs[0]);\n"
    "    if (boolOp === 'subtract')  result = booleanSubtract(mesh, objs[0]);\n"
    "    if (boolOp === 'intersect') result = booleanIntersect(mesh, objs[0]);\n"
    "    if (result) { sceneRef.current.add(result); setStatus('Boolean ' + boolOp + ' applied'); }\n"
    "  };\n"
    "  const handleGenerateLOD = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    const lod = generateLOD(mesh); setLodObj(lod);\n"
    "    if (sceneRef.current) sceneRef.current.add(lod);\n"
    "    setStatus('LOD generated — 4 levels');\n"
    "  };\n"
    "  const handleOptimizeScene = () => {\n"
    "    if (!sceneRef.current || !cameraRef.current) return;\n"
    "    optimizeScene(sceneRef.current, cameraRef.current, { frustumCull: true, lodDistance: 10, mergeThreshold: 5 });\n"
    "    setStatus('Scene optimized — frustum cull + LOD active');\n"
    "  };\n"
    "  const handleSmoothTopology = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    smoothTopology(mesh, 2); mesh.geometry.computeVertexNormals();\n"
    "    setStatus('Topology smoothed');\n"
    "  };\n"
    "  const handleSymmetrize = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    symmetrizeMesh(mesh, 'x'); mesh.geometry.computeVertexNormals();\n"
    "    setStatus('Mesh symmetrized on X axis');\n"
    "  };\n"
    "  const handleVoxelRemesh = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    voxelRemesh(mesh, 0.1); mesh.geometry.computeVertexNormals();\n"
    "    setStatus('Voxel remesh complete');\n"
    "  };\n"
    "  const handleQuadRemesh = () => {\n"
    "    const mesh = meshRef.current; if (!mesh) return;\n"
    "    quadRemesh(mesh, 2000); mesh.geometry.computeVertexNormals();\n"
    "    setStatus('Quad remesh complete (2000 faces)');\n"
    "  };\n"
    "  // ── Session E END ─────────────────────────────────────────────────────\n"
    "  // ── Sessions 108-121: VFX + Fluid + Asset + Procedural state ─────────────"
)
if old in src:
    src = src.replace(old, new, 1)
    changes.append("2. Handlers added")
else:
    changes.append("2. SKIP — handler anchor not found")

# ═══════════════════════════════════════════════════════════════════════════════
# 3. ADV BUTTON — rewire to showGeoNodesPanel, add Mesh Tools button next to it
# ═══════════════════════════════════════════════════════════════════════════════
old = (
    '        <button title="Advanced Tools" onClick={() => setShowGN(g => !g)}\n'
    "          style={{\n"
    "            width: 38, height: 38, border: \"none\", borderRadius: 4, cursor: \"pointer\", fontSize: 10,\n"
    "            background: showGN ? \"#FF6600\" : COLORS.border,\n"
    "            color: showGN ? \"#fff\" : \"#888\", fontWeight: 700\n"
    "          }}>ADV</button>"
)
new = (
    '        <button title="Geometry Nodes" onClick={() => setShowGeoNodesPanel(g => !g)}\n'
    "          style={{\n"
    "            width: 38, height: 38, border: \"none\", borderRadius: 4, cursor: \"pointer\", fontSize: 9,\n"
    "            background: showGeoNodesPanel ? \"#00ffc8\" : COLORS.border,\n"
    "            color: showGeoNodesPanel ? \"#06060f\" : \"#888\", fontWeight: 700\n"
    "          }}>GEO</button>\n"
    '        <button title="Mesh Tools" onClick={() => setShowMeshToolsPanel(m => !m)}\n'
    "          style={{\n"
    "            width: 38, height: 38, border: \"none\", borderRadius: 4, cursor: \"pointer\", fontSize: 9,\n"
    "            background: showMeshToolsPanel ? \"#FF6600\" : COLORS.border,\n"
    "            color: showMeshToolsPanel ? \"#fff\" : \"#888\", fontWeight: 700\n"
    "          }}>MSH</button>"
)
if old in src:
    src = src.replace(old, new, 1)
    changes.append("3. ADV button rewired + MSH button added")
else:
    changes.append("3. SKIP — ADV button anchor not found")

# ═══════════════════════════════════════════════════════════════════════════════
# 4. PANELS — inject before Graph Editor section
# ═══════════════════════════════════════════════════════════════════════════════
old = "      {/* Graph Editor — Session 62 */}"
new = (
    "      {/* ── Session E: Geometry Nodes Panel ── */}\n"
    "      {showGeoNodesPanel && (\n"
    "        <div style={{position:'fixed',top:40,right:260,width:340,background:'#0d1117',\n"
    "          border:'1px solid #21262d',borderRadius:4,padding:10,zIndex:105,overflowY:'auto',maxHeight:'80vh'}}>\n"
    "          <div style={{color:'#00ffc8',fontSize:10,fontWeight:700,marginBottom:8}}>GEOMETRY NODES</div>\n"
    "          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:6}}>\n"
    "            {['transform','array','noise','subdivide','decimate','boolean','merge'].map(t=>(\n"
    "              <button key={t} onClick={()=>setGeoNodeType(t)}\n"
    "                style={{padding:'2px 6px',fontSize:8,borderRadius:3,cursor:'pointer',\n"
    "                  background:geoNodeType===t?NODE_TYPES[t]?.color||'#4488ff':'#1a1f2e',\n"
    "                  border:'1px solid #21262d',color:geoNodeType===t?'#06060f':'#aaa',fontWeight:700}}>\n"
    "                {t}\n"
    "              </button>\n"
    "            ))}\n"
    "          </div>\n"
    "          <div style={{display:'flex',gap:4,marginBottom:6}}>\n"
    "            <button onClick={handleGeoAddInput} style={{flex:1,padding:'3px',fontSize:8,background:'#003322',\n"
    "              border:'1px solid #00ffc8',color:'#00ffc8',borderRadius:3,cursor:'pointer'}}>+ Input</button>\n"
    "            <button onClick={handleGeoAddNode} style={{flex:1,padding:'3px',fontSize:8,background:'#1a1f2e',\n"
    "              border:'1px solid #21262d',color:'#aaa',borderRadius:3,cursor:'pointer'}}>+ Node</button>\n"
    "            <button onClick={handleGeoAddOutput} style={{flex:1,padding:'3px',fontSize:8,background:'#2a0a00',\n"
    "              border:'1px solid #FF6600',color:'#FF6600',borderRadius:3,cursor:'pointer'}}>+ Output</button>\n"
    "            <button onClick={handleGeoConnect} style={{flex:1,padding:'3px',fontSize:8,background:'#1a1f2e',\n"
    "              border:'1px solid #8844ff',color:'#8844ff',borderRadius:3,cursor:'pointer'}}>Connect</button>\n"
    "          </div>\n"
    "          {/* Node list */}\n"
    "          <div style={{marginBottom:6}}>\n"
    "            {geoGraph.nodes.map((node,i) => (\n"
    "              <div key={node.id} onClick={()=>setGeoSelectedNode(node.id)}\n"
    "                style={{padding:'4px 6px',marginBottom:3,borderRadius:3,cursor:'pointer',\n"
    "                  background:geoSelectedNode===node.id?'#1a2a3a':'#0d1117',\n"
    "                  border:'1px solid '+(geoSelectedNode===node.id?NODE_TYPES[node.type]?.color||'#4488ff':'#21262d')}}>\n"
    "                <span style={{color:NODE_TYPES[node.type]?.color||'#dde6ef',fontSize:8,fontWeight:700}}>\n"
    "                  {i+1}. {NODE_TYPES[node.type]?.label||node.type}\n"
    "                </span>\n"
    "                {/* Params */}\n"
    "                {geoSelectedNode===node.id && Object.entries(node.params).map(([k,v])=>(\n"
    "                  <div key={k} style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}>\n"
    "                    <span style={{color:'#555',fontSize:7,width:50}}>{k}</span>\n"
    "                    <input type={typeof v==='number'?'number':'text'} value={v}\n"
    "                      onChange={e=>handleGeoUpdateParam(node.id,k,e.target.value)}\n"
    "                      style={{flex:1,background:'#06060f',border:'1px solid #21262d',color:'#dde6ef',\n"
    "                        fontSize:8,padding:'1px 3px',borderRadius:2}} />\n"
    "                  </div>\n"
    "                ))}\n"
    "              </div>\n"
    "            ))}\n"
    "          </div>\n"
    "          {/* Connections */}\n"
    "          {geoGraph.connections.length>0 && (\n"
    "            <div style={{marginBottom:6}}>\n"
    "              <div style={{color:'#555',fontSize:7,marginBottom:2}}>Connections ({geoGraph.connections.length})</div>\n"
    "              {geoGraph.connections.map((c,i)=>(\n"
    "                <div key={i} style={{color:'#8fa8bf',fontSize:7,marginBottom:1}}>\n"
    "                  {geoGraph.nodes.find(n=>n.id===c.fromId)?.type||'?'} → {geoGraph.nodes.find(n=>n.id===c.toId)?.type||'?'}\n"
    "                </div>\n"
    "              ))}\n"
    "            </div>\n"
    "          )}\n"
    "          <div style={{display:'flex',gap:4}}>\n"
    "            <button onClick={handleGeoEvaluate} style={{flex:2,padding:'4px',fontSize:8,\n"
    "              background:geoApplied?'#003322':'#1a2a1a',border:'1px solid '+(geoApplied?'#00ffc8':'#44ff88'),\n"
    "              color:geoApplied?'#00ffc8':'#44ff88',borderRadius:3,cursor:'pointer',fontWeight:700}}>\n"
    "              {geoApplied?'Re-Evaluate':'Evaluate Graph'}\n"
    "            </button>\n"
    "            <button onClick={handleGeoClear} style={{flex:1,padding:'4px',fontSize:8,background:'#1a1f2e',\n"
    "              border:'1px solid #ff4444',color:'#ff4444',borderRadius:3,cursor:'pointer'}}>Clear</button>\n"
    "          </div>\n"
    "          <div style={{color:'#555',fontSize:7,marginTop:4}}>\n"
    "            Nodes: {geoGraph.nodes.length} | Connections: {geoGraph.connections.length}\n"
    "          </div>\n"
    "        </div>\n"
    "      )}\n"
    "\n"
    "      {/* ── Session E: Mesh Tools Panel ── */}\n"
    "      {showMeshToolsPanel && (\n"
    "        <div style={{position:'fixed',top:40,right:260,width:200,background:'#0d1117',\n"
    "          border:'1px solid #21262d',borderRadius:4,padding:8,zIndex:105,overflowY:'auto',maxHeight:'80vh'}}>\n"
    "          <div style={{color:'#FF6600',fontSize:9,fontWeight:700,marginBottom:6}}>MESH TOOLS</div>\n"
    "\n"
    "          <div style={{color:'#555',fontSize:7,marginBottom:3}}>REPAIR</div>\n"
    "          <button onClick={handleFullRepair} style={{width:'100%',padding:'4px',fontSize:8,background:'#1a2a1a',\n"
    "            border:'1px solid #00ffc8',color:'#00ffc8',borderRadius:3,cursor:'pointer',marginBottom:3,fontWeight:700}}>\n"
    "            Full Auto Repair\n"
    "          </button>\n"
    "          {[\n"
    "            ['Fill Holes', handleFillHoles],\n"
    "            ['Fix Normals', handleFixNormals],\n"
    "            ['Remove Doubles', handleRemoveDoubles],\n"
    "            ['Remove Degenerates', handleRemoveDegenerates],\n"
    "            ['Smooth Topology', handleSmoothTopology],\n"
    "            ['Symmetrize X', handleSymmetrize],\n"
    "          ].map(([label,fn])=>(\n"
    "            <button key={label} onClick={fn} style={{width:'100%',padding:'3px',fontSize:8,background:'#1a1f2e',\n"
    "              border:'1px solid #21262d',color:'#aaa',borderRadius:3,cursor:'pointer',marginBottom:2}}>\n"
    "              {label}\n"
    "            </button>\n"
    "          ))}\n"
    "\n"
    "          <div style={{color:'#555',fontSize:7,marginBottom:3,marginTop:6}}>UV PROJECTION</div>\n"
    "          <select value={uvAxis} onChange={e=>setUvAxis(e.target.value)}\n"
    "            style={{width:'100%',background:'#0d1117',border:'1px solid #21262d',color:'#dde6ef',fontSize:8,padding:2,marginBottom:3}}>\n"
    "            <option value='x'>X Axis</option><option value='y'>Y Axis</option><option value='z'>Z Axis</option>\n"
    "          </select>\n"
    "          {[\n"
    "            ['UV Planar', handleUVPlanar],\n"
    "            ['UV Box', handleUVBox],\n"
    "            ['UV Sphere', handleUVSphere],\n"
    "          ].map(([label,fn])=>(\n"
    "            <button key={label} onClick={fn} style={{width:'100%',padding:'3px',fontSize:8,background:'#1a1f2e',\n"
    "              border:'1px solid #21262d',color:'#aaa',borderRadius:3,cursor:'pointer',marginBottom:2}}>\n"
    "              {label}\n"
    "            </button>\n"
    "          ))}\n"
    "\n"
    "          <div style={{color:'#555',fontSize:7,marginBottom:3,marginTop:6}}>BOOLEAN</div>\n"
    "          <select value={boolOp} onChange={e=>setBoolOp(e.target.value)}\n"
    "            style={{width:'100%',background:'#0d1117',border:'1px solid #21262d',color:'#dde6ef',fontSize:8,padding:2,marginBottom:3}}>\n"
    "            <option value='union'>Union</option><option value='subtract'>Subtract</option><option value='intersect'>Intersect</option>\n"
    "          </select>\n"
    "          <button onClick={handleBooleanOp} style={{width:'100%',padding:'4px',fontSize:8,background:'#1a1f2e',\n"
    "            border:'1px solid #ffff44',color:'#ffff44',borderRadius:3,cursor:'pointer',marginBottom:3}}>Apply Boolean</button>\n"
    "\n"
    "          <div style={{color:'#555',fontSize:7,marginBottom:3,marginTop:6}}>REMESH / LOD</div>\n"
    "          {[\n"
    "            ['Voxel Remesh', handleVoxelRemesh],\n"
    "            ['Quad Remesh 2k', handleQuadRemesh],\n"
    "            ['Generate LOD', handleGenerateLOD],\n"
    "            ['Optimize Scene', handleOptimizeScene],\n"
    "          ].map(([label,fn])=>(\n"
    "            <button key={label} onClick={fn} style={{width:'100%',padding:'3px',fontSize:8,background:'#1a1f2e',\n"
    "              border:'1px solid #21262d',color:'#aaa',borderRadius:3,cursor:'pointer',marginBottom:2}}>\n"
    "              {label}\n"
    "            </button>\n"
    "          ))}\n"
    "        </div>\n"
    "      )}\n"
    "\n"
    "      {/* Graph Editor — Session 62 */}"
)
if old in src:
    src = src.replace(old, new, 1)
    changes.append("4. Geo Nodes + Mesh Tools panels injected")
else:
    changes.append("4. SKIP — Graph Editor anchor not found")

# ═══════════════════════════════════════════════════════════════════════════════
# 5. Wire missing imports — add to existing import line if not present
# ═══════════════════════════════════════════════════════════════════════════════
# Check what MeshRepair imports exist
mesh_repair_fns = [
    'fillHoles', 'fixNormals', 'removeDoubles', 'removeDegenerates', 'fullRepair'
]
missing = [f for f in mesh_repair_fns if f not in src]
if missing:
    # Find MeshRepair import line
    if 'MeshRepair' in src:
        import re
        # add to existing MeshRepair import
        mr_match = re.search(r'import \{([^}]+)\} from ["\']\.\/mesh\/MeshRepair\.js["\']', src)
        if mr_match:
            existing = mr_match.group(1)
            to_add = ', '.join(f for f in missing if f not in existing)
            if to_add:
                new_imports = existing.rstrip() + ', ' + to_add
                src = src.replace(mr_match.group(0), 'import {' + new_imports + '} from "./mesh/MeshRepair.js"', 1)
                changes.append(f"5. Added to MeshRepair import: {to_add}")
        else:
            changes.append("5. SKIP — MeshRepair import line not found for update")
    else:
        changes.append("5. SKIP — MeshRepair not imported at all")
else:
    changes.append("5. MeshRepair fns already imported")

app.write_text(src)
new_len = len(src.splitlines())
print(f"Done. {original_len} -> {new_len} (+{new_len - original_len})")
for c in changes:
    print(" ", c)
