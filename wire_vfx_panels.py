#!/usr/bin/env python3
"""
Wire FluidPanel, WeatherPanel, DestructionPanel into App.jsx
Run from: /workspaces/spx-mesh-editor
Usage: python3 /tmp/wire_vfx_panels.py
"""
import os, shutil

REPO = "/workspaces/spx-mesh-editor"
SRC  = os.path.join(REPO, "src")
APP  = os.path.join(SRC, "App.jsx")
VFX_DIR = os.path.join(SRC, "components", "vfx")
PANELS_SRC = "/home/claude/spx-panels/new"

def step(msg): print(f"\n{'─'*60}\n  {msg}\n{'─'*60}")
def ok(msg):   print(f"  ✅ {msg}")
def skip(msg): print(f"  ⏭  {msg}")
def err(msg):  print(f"  ❌ {msg}")

# ── 1. Create vfx component dir ───────────────────────────────────
step("Creating src/components/vfx/")
os.makedirs(VFX_DIR, exist_ok=True)
ok(f"Directory ready: {VFX_DIR}")

# ── 2. Copy panel files ───────────────────────────────────────────
step("Copying panel files")
for fname in ["FluidPanel.jsx", "WeatherPanel.jsx", "DestructionPanel.jsx"]:
    src  = os.path.join(PANELS_SRC, fname)
    dest = os.path.join(VFX_DIR, fname)
    if not os.path.exists(src):
        err(f"Missing: {src}"); continue
    shutil.copy2(src, dest)
    ok(f"Copied: {fname}")

# ── 3. Read + backup App.jsx ──────────────────────────────────────
step("Reading App.jsx")
if not os.path.exists(APP):
    err(f"App.jsx not found at {APP}"); exit(1)

with open(APP, "r") as f:
    code = f.read()

backup = APP.replace(".jsx", ".bak_vfx.jsx")
shutil.copy2(APP, backup)
ok(f"Backup: {backup}")

already_done = "FluidPanel" in code

if already_done:
    skip("FluidPanel already imported — skipping (already wired)")
    exit(0)

# ── 4. Add imports ────────────────────────────────────────────────
step("Adding imports")
IMPORTS = '''import FluidPanel       from "./components/vfx/FluidPanel.jsx";
import WeatherPanel     from "./components/vfx/WeatherPanel.jsx";
import DestructionPanel from "./components/vfx/DestructionPanel.jsx";'''

# Insert after the last import from components
insert_after = 'import LightingCameraPanel from "./components/scene/LightingCameraPanel.jsx";'
if insert_after in code:
    code = code.replace(insert_after, insert_after + "\n" + IMPORTS)
    ok("Imports added after LightingCameraPanel import")
else:
    # fallback: find any import line and append after last one
    lines = code.splitlines()
    last_import = 0
    for i, line in enumerate(lines):
        if line.strip().startswith("import "):
            last_import = i
    lines.insert(last_import + 1, IMPORTS)
    code = "\n".join(lines)
    ok("Imports added after last import")

# ── 5. Add state vars ─────────────────────────────────────────────
step("Adding state vars")
STATE_VARS = '''
  const [fluidPanelOpen,       setFluidPanelOpen]       = useState(false);
  const [weatherPanelOpen,     setWeatherPanelOpen]     = useState(false);
  const [destructionPanelOpen, setDestructionPanelOpen] = useState(false);'''

# Insert near other panel state vars
anchor = "const [lightingCameraPanelOpen, setLightingCameraPanelOpen] = useState(false);"
if anchor in code:
    code = code.replace(anchor, anchor + STATE_VARS)
    ok("State vars added")
else:
    # fallback: find collaboratePanelOpen
    anchor2 = "const [collaboratePanelOpen, setCollaboratePanelOpen] = useState(false);"
    if anchor2 in code:
        code = code.replace(anchor2, anchor2 + STATE_VARS)
        ok("State vars added (fallback anchor)")
    else:
        err("Could not find anchor for state vars — add manually")

# ── 6. Wire openWorkspaceTool ─────────────────────────────────────
step("Wiring openWorkspaceTool")
OWT_ANCHOR = 'else if (toolId === "grease_pencil") setGreasePencilPanelOpen?.(true);'
OWT_ADD    = '''
    else if (toolId === "fluid")       setFluidPanelOpen?.(true);
    else if (toolId === "weather")     setWeatherPanelOpen?.(true);
    else if (toolId === "destruction") setDestructionPanelOpen?.(true);'''

if OWT_ANCHOR in code:
    code = code.replace(OWT_ANCHOR, OWT_ANCHOR + OWT_ADD)
    ok("openWorkspaceTool wired")
else:
    err("grease_pencil anchor not found — add openWorkspaceTool entries manually")

# ── 7. Wire closeAllWorkspacePanels ──────────────────────────────
step("Wiring closeAllWorkspacePanels")
# Find the close function and append
CLOSE_ANCHOR = "setGreasePencilPanelOpen?.(false);"
CLOSE_ADD    = """
    setFluidPanelOpen?.(false);
    setWeatherPanelOpen?.(false);
    setDestructionPanelOpen?.(false);"""

if CLOSE_ANCHOR in code:
    # Only patch first occurrence (inside closeAll)
    code = code.replace(CLOSE_ANCHOR, CLOSE_ANCHOR + CLOSE_ADD, 1)
    ok("closeAllWorkspacePanels wired")
else:
    err("closeAll anchor not found — add manually")

# ── 8. Add JSX overlays ───────────────────────────────────────────
step("Adding JSX overlays")
JSX_ANCHOR = "{/* Grease Pencil Panel */}"
JSX_ADD    = """
      {/* ── Fluid Panel ── */}
      {fluidPanelOpen && (
        <div style={{position:"fixed",top:0,right:0,width:340,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <FluidPanel
            open={fluidPanelOpen}
            onClose={() => setFluidPanelOpen(false)}
            sceneRef={sceneRef}
            setStatus={setStatus}
          />
        </div>
      )}

      {/* ── Weather Panel ── */}
      {weatherPanelOpen && (
        <div style={{position:"fixed",top:0,right:0,width:340,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <WeatherPanel
            open={weatherPanelOpen}
            onClose={() => setWeatherPanelOpen(false)}
            sceneRef={sceneRef}
            setStatus={setStatus}
          />
        </div>
      )}

      {/* ── Destruction Panel ── */}
      {destructionPanelOpen && (
        <div style={{position:"fixed",top:0,right:0,width:360,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <DestructionPanel
            open={destructionPanelOpen}
            onClose={() => setDestructionPanelOpen(false)}
            sceneRef={sceneRef}
            meshRef={meshRef}
            setStatus={setStatus}
            onApplyFunction={handleApplyFunction}
          />
        </div>
      )}
"""

if JSX_ANCHOR in code:
    code = code.replace(JSX_ANCHOR, JSX_ADD + JSX_ANCHOR)
    ok("JSX overlays added")
else:
    # Fallback: insert before MocapWorkspace
    FALLBACK = "<MocapWorkspace"
    if FALLBACK in code:
        code = code.replace(FALLBACK, JSX_ADD + "\n      " + FALLBACK, 1)
        ok("JSX overlays added (fallback before MocapWorkspace)")
    else:
        err("JSX anchor not found — add overlay blocks manually")

# ── 9. Add workspace tab buttons ─────────────────────────────────
step("Adding workspace tab buttons")
TAB_ANCHOR = """        <button type="button" className="spx-native-workspace-tab" onClick={() => setShowPerformancePanel(v => !v)}>
          <span className="spx-native-workspace-tab-label">SPX Performance</span>
          <span className="spx-native-workspace-tab-hint">P</span>
        </button>"""

TAB_ADD    = """
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
        </button>"""

if TAB_ANCHOR in code:
    code = code.replace(TAB_ANCHOR, TAB_ANCHOR + TAB_ADD)
    ok("Workspace tab buttons added")
else:
    err("SPX Performance tab anchor not found — add tab buttons manually")

# ── 10. Add handleApplyFunction handlers ─────────────────────────
step("Adding handleApplyFunction handlers")
FN_ANCHOR = 'if (fn === "fluid_pyro")'
FN_ADD    = """
    if (fn === "open_fluid")       { setFluidPanelOpen(true); return; }
    if (fn === "open_weather")     { setWeatherPanelOpen(true); return; }
    if (fn === "open_destruction") { setDestructionPanelOpen(true); return; }
"""
if FN_ANCHOR in code:
    code = code.replace(FN_ANCHOR, FN_ADD + "    " + FN_ANCHOR)
    ok("handleApplyFunction handlers added")
else:
    err("fluid_pyro anchor not found — add handlers manually near VFX section")

# ── 11. Write final file ──────────────────────────────────────────
step("Writing App.jsx")
with open(APP, "w") as f:
    f.write(code)
ok("App.jsx written")

# ── 12. Done ──────────────────────────────────────────────────────
print(f"""
{'='*60}
  DONE — 3 panels wired

  New workspace tabs added:
    💧 Fluid      (Shift+F)
    🌧 Weather    (Shift+W)
    💥 Destruction (Shift+D)

  Panel files:
    src/components/vfx/FluidPanel.jsx
    src/components/vfx/WeatherPanel.jsx
    src/components/vfx/DestructionPanel.jsx

  Next steps:
    cd /workspaces/spx-mesh-editor
    npm run build
    git add -A && git commit -m "feat: FluidPanel, WeatherPanel, DestructionPanel" && git push
{'='*60}
""")
