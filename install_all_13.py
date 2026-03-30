#!/usr/bin/env python3
"""
SPX Mesh Editor — Install All 13 Panels
Run from anywhere:  python3 /tmp/install_all_panels.py
"""
import os, shutil

REPO     = "/workspaces/spx-mesh-editor"
SRC      = os.path.join(REPO, "src")
APP      = os.path.join(SRC, "App.jsx")
VFX_DIR  = os.path.join(SRC, "components", "vfx")
GEN_DIR  = os.path.join(SRC, "components", "generators")

# Where Claude put the files this session
SOURCES = {
    "FluidPanel.jsx":               "FluidPanel.jsx",
    "WeatherPanel.jsx":             "WeatherPanel.jsx",
    "DestructionPanel.jsx":         "DestructionPanel.jsx",
    "EnvironmentGenerator.jsx":     "EnvironmentGenerator.jsx",
    "CityGenerator.jsx":            "CityGenerator.jsx",
    "BuildingSimulator.jsx":        "BuildingSimulator.jsx",
    "PhysicsSimulation.jsx":        "PhysicsSimulation.jsx",
    "AssetLibrary.jsx":             "AssetLibrary.jsx",
    "NodeModifierSystem.jsx":       "NodeModifierSystem.jsx",
    "VRPreviewMode.jsx":            "VRPreviewMode.jsx",
    "ProceduralCrowdGenerator.jsx": "ProceduralCrowdGenerator.jsx",
    "TerrainSculpting.jsx":         "TerrainSculpting.jsx",
}

VFX_PANELS = ["FluidPanel.jsx", "WeatherPanel.jsx", "DestructionPanel.jsx"]
GEN_PANELS = [
    "EnvironmentGenerator.jsx", "CityGenerator.jsx", "BuildingSimulator.jsx",
    "PhysicsSimulation.jsx", "AssetLibrary.jsx", "NodeModifierSystem.jsx",
    "VRPreviewMode.jsx", "ProceduralCrowdGenerator.jsx", "TerrainSculpting.jsx",
]

def step(msg): print(f"\n{'─'*60}\n  {msg}\n{'─'*60}")
def ok(msg):   print(f"  ✅ {msg}")
def warn(msg): print(f"  ⚠️  {msg}")
def err(msg):  print(f"  ❌ {msg}")

# ─────────────────────────────────────────────────────────────────
# 1. Validate
# ─────────────────────────────────────────────────────────────────
step("Validating environment")
if not os.path.isdir(REPO):
    err(f"Repo not found: {REPO}"); exit(1)
if not os.path.exists(APP):
    err(f"App.jsx not found: {APP}"); exit(1)

missing = [name for name, path in SOURCES.items() if not os.path.exists(path)]
if missing:
    err(f"Missing source files: {missing}")
    print("  Make sure you are running this in the same Claude session that built the panels.")
    exit(1)

ok("All source files found")
ok(f"Repo: {REPO}")

# ─────────────────────────────────────────────────────────────────
# 2. Create directories
# ─────────────────────────────────────────────────────────────────
step("Creating directories")
os.makedirs(VFX_DIR, exist_ok=True);  ok(f"src/components/vfx/")
os.makedirs(GEN_DIR, exist_ok=True);  ok(f"src/components/generators/")

# ─────────────────────────────────────────────────────────────────
# 3. Copy files
# ─────────────────────────────────────────────────────────────────
step("Copying panel files")
for name in VFX_PANELS:
    shutil.copy2(SOURCES[name], os.path.join(VFX_DIR, name))
    ok(f"vfx/{name}")
for name in GEN_PANELS:
    shutil.copy2(SOURCES[name], os.path.join(GEN_DIR, name))
    ok(f"generators/{name}")

# ─────────────────────────────────────────────────────────────────
# 4. Read + backup App.jsx
# ─────────────────────────────────────────────────────────────────
step("Reading App.jsx")
with open(APP, "r") as f:
    code = f.read()

backup = APP.replace(".jsx", ".bak_all13.jsx")
shutil.copy2(APP, backup)
ok(f"Backup saved: {backup}")

already = "FluidPanel" in code and "EnvironmentGenerator" in code
if already:
    warn("Panels already wired — skipping App.jsx patch")
    print("\n  Build and commit:")
    print(f"  cd {REPO} && npm run build && git add -A && git commit -m 'feat: all 13 panels installed' && git push")
    exit(0)

# ─────────────────────────────────────────────────────────────────
# 5. Add imports
# ─────────────────────────────────────────────────────────────────
step("Adding imports")

VFX_IMPORTS = """import FluidPanel            from "./components/vfx/FluidPanel.jsx";
import WeatherPanel          from "./components/vfx/WeatherPanel.jsx";
import DestructionPanel      from "./components/vfx/DestructionPanel.jsx";"""

GEN_IMPORTS = """import EnvironmentGenerator    from "./components/generators/EnvironmentGenerator.jsx";
import CityGenerator          from "./components/generators/CityGenerator.jsx";
import BuildingSimulator      from "./components/generators/BuildingSimulator.jsx";
import PhysicsSimulation      from "./components/generators/PhysicsSimulation.jsx";
import AssetLibraryPanel      from "./components/generators/AssetLibrary.jsx";
import NodeModifierSystem     from "./components/generators/NodeModifierSystem.jsx";
import VRPreviewMode          from "./components/generators/VRPreviewMode.jsx";
import ProceduralCrowdGenerator from "./components/generators/ProceduralCrowdGenerator.jsx";
import TerrainSculpting       from "./components/generators/TerrainSculpting.jsx";"""

ALL_IMPORTS = "\n// ── VFX Panels ──\n" + VFX_IMPORTS + "\n\n// ── World / Generator Panels ──\n" + GEN_IMPORTS

anchor = 'import LightingCameraPanel from "./components/scene/LightingCameraPanel.jsx";'
if anchor in code:
    code = code.replace(anchor, anchor + "\n" + ALL_IMPORTS)
    ok("Imports added after LightingCameraPanel")
else:
    # fallback: after last import
    lines = code.splitlines()
    last_i = max(i for i, l in enumerate(lines) if l.strip().startswith("import "))
    lines.insert(last_i + 1, ALL_IMPORTS)
    code = "\n".join(lines)
    ok("Imports added (fallback)")

# ─────────────────────────────────────────────────────────────────
# 6. Add state vars
# ─────────────────────────────────────────────────────────────────
step("Adding state variables")

STATE = """
  // ── VFX panels ──
  const [fluidPanelOpen,       setFluidPanelOpen]       = useState(false);
  const [weatherPanelOpen,     setWeatherPanelOpen]     = useState(false);
  const [destructionPanelOpen, setDestructionPanelOpen] = useState(false);
  // ── Generator / World panels ──
  const [envGenOpen,     setEnvGenOpen]     = useState(false);
  const [cityGenOpen,    setCityGenOpen]    = useState(false);
  const [buildingOpen,   setBuildingOpen]   = useState(false);
  const [physicsOpen,    setPhysicsOpen]    = useState(false);
  const [assetLibOpen,   setAssetLibOpen]   = useState(false);
  const [nodeModOpen,    setNodeModOpen]    = useState(false);
  const [vrPreviewOpen,  setVrPreviewOpen]  = useState(false);
  const [crowdGenOpen,   setCrowdGenOpen]   = useState(false);
  const [terrainOpen,    setTerrainOpen]    = useState(false);"""

anchor = "const [lightingCameraPanelOpen, setLightingCameraPanelOpen] = useState(false);"
if anchor in code:
    code = code.replace(anchor, anchor + STATE)
    ok("State vars added")
else:
    anchor2 = "const [collaboratePanelOpen, setCollaboratePanelOpen] = useState(false);"
    if anchor2 in code:
        code = code.replace(anchor2, anchor2 + STATE)
        ok("State vars added (fallback anchor)")
    else:
        warn("State var anchor not found — add manually near other panel useState lines")

# ─────────────────────────────────────────────────────────────────
# 7. Wire openWorkspaceTool
# ─────────────────────────────────────────────────────────────────
step("Wiring openWorkspaceTool")

OWT_ADD = """
    else if (toolId === "fluid")        setFluidPanelOpen?.(true);
    else if (toolId === "weather")      setWeatherPanelOpen?.(true);
    else if (toolId === "destruction")  setDestructionPanelOpen?.(true);
    else if (toolId === "env_gen")      setEnvGenOpen?.(true);
    else if (toolId === "city_gen")     setCityGenOpen?.(true);
    else if (toolId === "building")     setBuildingOpen?.(true);
    else if (toolId === "physics_sim")  setPhysicsOpen?.(true);
    else if (toolId === "asset_lib")    setAssetLibOpen?.(true);
    else if (toolId === "node_mod")     setNodeModOpen?.(true);
    else if (toolId === "vr_preview")   setVrPreviewOpen?.(true);
    else if (toolId === "crowd_gen")    setCrowdGenOpen?.(true);
    else if (toolId === "terrain")      setTerrainOpen?.(true);"""

anchor = 'else if (toolId === "grease_pencil") setGreasePencilPanelOpen?.(true);'
if anchor in code:
    code = code.replace(anchor, anchor + OWT_ADD)
    ok("openWorkspaceTool wired")
else:
    warn("grease_pencil anchor not found — add openWorkspaceTool entries manually")

# ─────────────────────────────────────────────────────────────────
# 8. Wire closeAllWorkspacePanels
# ─────────────────────────────────────────────────────────────────
step("Wiring closeAllWorkspacePanels")

CLOSE_ADD = """
    setFluidPanelOpen?.(false);
    setWeatherPanelOpen?.(false);
    setDestructionPanelOpen?.(false);
    setEnvGenOpen?.(false);
    setCityGenOpen?.(false);
    setBuildingOpen?.(false);
    setPhysicsOpen?.(false);
    setAssetLibOpen?.(false);
    setNodeModOpen?.(false);
    setVrPreviewOpen?.(false);
    setCrowdGenOpen?.(false);
    setTerrainOpen?.(false);"""

anchor = "setGreasePencilPanelOpen?.(false);"
if anchor in code:
    code = code.replace(anchor, anchor + CLOSE_ADD, 1)
    ok("closeAllWorkspacePanels wired")
else:
    warn("closeAll anchor not found — add close calls manually")

# ─────────────────────────────────────────────────────────────────
# 9. Add handleApplyFunction handlers
# ─────────────────────────────────────────────────────────────────
step("Adding handleApplyFunction handlers")

FN_ADD = """
    if (fn === "open_fluid")        { setFluidPanelOpen(true); return; }
    if (fn === "open_weather")      { setWeatherPanelOpen(true); return; }
    if (fn === "open_destruction")  { setDestructionPanelOpen(true); return; }
    if (fn === "open_env_gen")      { setEnvGenOpen(true); return; }
    if (fn === "open_city_gen")     { setCityGenOpen(true); return; }
    if (fn === "open_building")     { setBuildingOpen(true); return; }
    if (fn === "open_physics_sim")  { setPhysicsOpen(true); return; }
    if (fn === "open_asset_lib")    { setAssetLibOpen(true); return; }
    if (fn === "open_node_mod")     { setNodeModOpen(true); return; }
    if (fn === "open_vr_preview")   { setVrPreviewOpen(true); return; }
    if (fn === "open_crowd_gen")    { setCrowdGenOpen(true); return; }
    if (fn === "open_terrain")      { setTerrainOpen(true); return; }
"""

anchor = 'if (fn === "fluid_pyro")'
if anchor in code:
    code = code.replace(anchor, FN_ADD + "    " + anchor)
    ok("handleApplyFunction handlers added")
else:
    anchor2 = 'if (fn === "fluid_water")'
    if anchor2 in code:
        code = code.replace(anchor2, FN_ADD + "    " + anchor2)
        ok("handleApplyFunction handlers added (fallback)")
    else:
        warn("fluid anchor not found — add handlers manually near VFX section")

# ─────────────────────────────────────────────────────────────────
# 10. Add JSX overlays
# ─────────────────────────────────────────────────────────────────
step("Adding JSX overlay panels")

PANEL_WIDTH_VFX = 340
PANEL_WIDTH_GEN = 900  # generators are full viewports - open as wide overlay

OVERLAYS = """
      {/* ══ VFX PANELS ══ */}
      {fluidPanelOpen && (
        <div style={{position:"fixed",top:0,right:0,width:340,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <FluidPanel open={fluidPanelOpen} onClose={() => setFluidPanelOpen(false)} sceneRef={sceneRef} setStatus={setStatus} />
        </div>
      )}
      {weatherPanelOpen && (
        <div style={{position:"fixed",top:0,right:0,width:340,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <WeatherPanel open={weatherPanelOpen} onClose={() => setWeatherPanelOpen(false)} sceneRef={sceneRef} setStatus={setStatus} />
        </div>
      )}
      {destructionPanelOpen && (
        <div style={{position:"fixed",top:0,right:0,width:360,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <DestructionPanel open={destructionPanelOpen} onClose={() => setDestructionPanelOpen(false)} sceneRef={sceneRef} meshRef={meshRef} setStatus={setStatus} onApplyFunction={handleApplyFunction} />
        </div>
      )}

      {/* ══ WORLD / GENERATOR PANELS (full-screen overlays with own viewport) ══ */}
      {envGenOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🌲 ENVIRONMENT GENERATOR</span>
            <button onClick={() => setEnvGenOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><EnvironmentGenerator /></div>
        </div>
      )}
      {cityGenOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🏙️ CITY GENERATOR</span>
            <button onClick={() => setCityGenOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><CityGenerator /></div>
        </div>
      )}
      {buildingOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🏗️ BUILDING SIMULATOR</span>
            <button onClick={() => setBuildingOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><BuildingSimulator /></div>
        </div>
      )}
      {physicsOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#FF6600",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>⚙️ PHYSICS SIMULATION</span>
            <button onClick={() => setPhysicsOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><PhysicsSimulation /></div>
        </div>
      )}
      {assetLibOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>📦 ASSET LIBRARY</span>
            <button onClick={() => setAssetLibOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><AssetLibraryPanel /></div>
        </div>
      )}
      {nodeModOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🔗 NODE MODIFIER SYSTEM</span>
            <button onClick={() => setNodeModOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><NodeModifierSystem /></div>
        </div>
      )}
      {vrPreviewOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#aa44ff",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🥽 VR PREVIEW</span>
            <button onClick={() => setVrPreviewOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><VRPreviewMode /></div>
        </div>
      )}
      {crowdGenOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>👥 CROWD GENERATOR</span>
            <button onClick={() => setCrowdGenOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><ProceduralCrowdGenerator /></div>
        </div>
      )}
      {terrainOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#44bb77",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🏔️ TERRAIN SCULPTING</span>
            <button onClick={() => setTerrainOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><TerrainSculpting /></div>
        </div>
      )}
"""

# Insert before MocapWorkspace or GreasePencilPanel
anchor = "<MocapWorkspace"
if anchor in code:
    code = code.replace(anchor, OVERLAYS + "\n      " + anchor, 1)
    ok("JSX overlays added")
else:
    anchor2 = "{/* Grease Pencil Panel */}"
    if anchor2 in code:
        code = code.replace(anchor2, OVERLAYS + anchor2)
        ok("JSX overlays added (fallback)")
    else:
        warn("JSX anchor not found — paste overlay blocks manually before MocapWorkspace")

# ─────────────────────────────────────────────────────────────────
# 11. Add workspace tab buttons
# ─────────────────────────────────────────────────────────────────
step("Adding workspace tab buttons")

TAB_BUTTONS = """
        {/* ── VFX Tabs ── */}
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("fluid")}>
          <span className="spx-native-workspace-tab-label">💧 Fluid</span>
          <span className="spx-native-workspace-tab-hint">Shift+F</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("weather")}>
          <span className="spx-native-workspace-tab-label">🌧 Weather</span>
          <span className="spx-native-workspace-tab-hint">Shift+W</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("destruction")}>
          <span className="spx-native-workspace-tab-label">💥 Destruction</span>
          <span className="spx-native-workspace-tab-hint">Shift+D</span>
        </button>
        {/* ── World / Generator Tabs ── */}
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("env_gen")}>
          <span className="spx-native-workspace-tab-label">🌲 Environment</span>
          <span className="spx-native-workspace-tab-hint">World</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("city_gen")}>
          <span className="spx-native-workspace-tab-label">🏙️ City Gen</span>
          <span className="spx-native-workspace-tab-hint">World</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("building")}>
          <span className="spx-native-workspace-tab-label">🏗️ Building</span>
          <span className="spx-native-workspace-tab-hint">World</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("physics_sim")}>
          <span className="spx-native-workspace-tab-label">⚙️ Physics</span>
          <span className="spx-native-workspace-tab-hint">World</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("asset_lib")}>
          <span className="spx-native-workspace-tab-label">📦 Assets</span>
          <span className="spx-native-workspace-tab-hint">World</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("node_mod")}>
          <span className="spx-native-workspace-tab-label">🔗 Nodes</span>
          <span className="spx-native-workspace-tab-hint">World</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("vr_preview")}>
          <span className="spx-native-workspace-tab-label">🥽 VR Preview</span>
          <span className="spx-native-workspace-tab-hint">World</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("crowd_gen")}>
          <span className="spx-native-workspace-tab-label">👥 Crowd</span>
          <span className="spx-native-workspace-tab-hint">World</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("terrain")}>
          <span className="spx-native-workspace-tab-label">🏔️ Terrain</span>
          <span className="spx-native-workspace-tab-hint">World</span>
        </button>"""

# Insert after SPX Performance tab
anchor = """        <button type="button" className="spx-native-workspace-tab" onClick={() => setShowPerformancePanel(v => !v)}>
          <span className="spx-native-workspace-tab-label">SPX Performance</span>
          <span className="spx-native-workspace-tab-hint">P</span>
        </button>"""

if anchor in code:
    code = code.replace(anchor, anchor + TAB_BUTTONS)
    ok("Workspace tab buttons added (13 total)")
else:
    warn("SPX Performance anchor not found — add tab buttons manually")

# ─────────────────────────────────────────────────────────────────
# 12. Write App.jsx
# ─────────────────────────────────────────────────────────────────
step("Writing App.jsx")
with open(APP, "w") as f:
    f.write(code)
ok("App.jsx written")

# ─────────────────────────────────────────────────────────────────
# 13. Summary
# ─────────────────────────────────────────────────────────────────
print(f"""
{'='*60}
  ✅ ALL 13 PANELS INSTALLED

  VFX panels (right-side overlay):
    💧 Fluid          → Shift+F
    🌧  Weather        → Shift+W
    💥 Destruction    → Shift+D

  World / Generator panels (full-screen):
    🌲 Environment Generator
    🏙️  City Generator
    🏗️  Building Simulator
    ⚙️  Physics Simulation
    📦 Asset Library
    🔗 Node Modifier System
    🥽 VR Preview
    👥 Crowd Generator
    🏔️  Terrain Sculpting

  Next steps:
    cd {REPO}
    npm run build
    git add -A && git commit -m "feat: all 13 panels" && git push
{'='*60}
""")
