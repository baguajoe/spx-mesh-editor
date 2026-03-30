#!/usr/bin/env python3
"""
Install GamepadAnimator + ProMeshPanel into SPX Mesh Editor
Run: python3 /workspaces/spx-mesh-editor/install_gamepad_promesh.py
"""
import os, shutil

REPO    = "/workspaces/spx-mesh-editor"
SRC     = os.path.join(REPO, "src")
APP     = os.path.join(SRC, "App.jsx")
ANIM_DIR = os.path.join(SRC, "components", "animation")
MESH_DIR = os.path.join(SRC, "components", "mesh")

SOURCES = {
    "GamepadAnimator.jsx": "GamepadAnimator.jsx",
    "ProMeshPanel.jsx":    "ProMeshPanel.jsx",
}

def step(msg): print(f"\n{'─'*60}\n  {msg}\n{'─'*60}")
def ok(msg):   print(f"  ✅ {msg}")
def warn(msg): print(f"  ⚠️  {msg}")
def err(msg):  print(f"  ❌ {msg}"); exit(1)

step("Validating")
if not os.path.isdir(REPO): err(f"Repo not found: {REPO}")
if not os.path.exists(APP): err(f"App.jsx not found")
missing = [n for n,p in SOURCES.items() if not os.path.exists(p)]
if missing: err(f"Missing: {missing}")
ok("All files found")

step("Creating directories")
os.makedirs(ANIM_DIR, exist_ok=True); ok(f"components/animation/")
os.makedirs(MESH_DIR, exist_ok=True); ok(f"components/mesh/")

step("Copying files")
shutil.copy2(SOURCES["GamepadAnimator.jsx"], os.path.join(ANIM_DIR, "GamepadAnimator.jsx")); ok("GamepadAnimator.jsx → components/animation/")
shutil.copy2(SOURCES["ProMeshPanel.jsx"],    os.path.join(MESH_DIR, "ProMeshPanel.jsx"));    ok("ProMeshPanel.jsx → components/mesh/")

step("Reading App.jsx")
with open(APP) as f: code = f.read()
shutil.copy2(APP, APP.replace(".jsx", ".bak_gp_pm.jsx"))
ok("Backup saved")

if "GamepadAnimator" in code:
    warn("Already imported — skipping App.jsx patch")
    exit(0)

step("Adding imports")
IMPORTS = """
// ── Gamepad + Pro Mesh ──
import GamepadAnimator from "./components/animation/GamepadAnimator.jsx";
import ProMeshPanel   from "./components/mesh/ProMeshPanel.jsx";"""

anchor = 'import LightingCameraPanel from "./components/scene/LightingCameraPanel.jsx";'
if anchor in code:
    code = code.replace(anchor, anchor + IMPORTS)
    ok("Imports added")
else:
    warn("LightingCameraPanel anchor not found — trying fallback")
    lines = code.splitlines()
    last_i = max(i for i,l in enumerate(lines) if l.strip().startswith("import "))
    lines.insert(last_i+1, IMPORTS)
    code = "\n".join(lines)
    ok("Imports added (fallback)")

step("Adding state vars")
STATE = """
  // ── Gamepad Animator + Pro Mesh ──
  const [gamepadOpen,   setGamepadOpen]   = useState(false);
  const [proMeshOpen,   setProMeshOpen]   = useState(false);"""

anchor = "const [lightingCameraPanelOpen, setLightingCameraPanelOpen] = useState(false);"
if anchor in code:
    code = code.replace(anchor, anchor + STATE); ok("State vars added")
else:
    anchor2 = "const [collaboratePanelOpen, setCollaboratePanelOpen] = useState(false);"
    if anchor2 in code:
        code = code.replace(anchor2, anchor2 + STATE); ok("State vars added (fallback)")
    else:
        warn("State var anchor not found — add manually")

step("Wiring openWorkspaceTool")
OWT_ADD = """
    else if (toolId === "gamepad")    setGamepadOpen?.(true);
    else if (toolId === "pro_mesh")   setProMeshOpen?.(true);"""

anchor = 'else if (toolId === "fluid")       setFluidPanelOpen?.(true);'
if anchor in code:
    code = code.replace(anchor, anchor + OWT_ADD); ok("openWorkspaceTool wired")
else:
    anchor2 = 'else if (toolId === "grease_pencil") setGreasePencilPanelOpen?.(true);'
    if anchor2 in code:
        code = code.replace(anchor2, anchor2 + OWT_ADD); ok("openWorkspaceTool wired (fallback)")
    else:
        warn("openWorkspaceTool anchor not found — add manually")

step("Wiring closeAllWorkspacePanels")
CLOSE_ADD = """
    setGamepadOpen?.(false);
    setProMeshOpen?.(false);"""
anchor = "setMocapWorkspaceOpen?.(false);"
if anchor in code:
    code = code.replace(anchor, anchor + CLOSE_ADD, 1); ok("closeAll wired")
else:
    warn("closeAll anchor not found")

step("Adding JSX overlays")
OVERLAYS = """
      {/* ── Gamepad Animator ── */}
      {gamepadOpen && (
        <div style={{position:"fixed",top:0,right:0,width:360,height:"100vh",zIndex:65,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <GamepadAnimator
            open={gamepadOpen}
            onClose={() => setGamepadOpen(false)}
            sceneRef={sceneRef}
            meshRef={meshRef}
            setStatus={setStatus}
            onApplyFunction={handleApplyFunction}
            currentFrame={currentFrame}
            setCurrentFrame={setCurrentFrame}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        </div>
      )}

      {/* ── Pro Mesh Panel (full-screen) ── */}
      {proMeshOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8,flexShrink:0}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>✂ PRO MESH EDITOR</span>
            <span style={{fontSize:9,color:"#5a7088"}}>Best-in-class mesh tools</span>
            <button onClick={() => setProMeshOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}>
            <ProMeshPanel
              open={proMeshOpen}
              onClose={() => setProMeshOpen(false)}
              meshRef={meshRef}
              sceneRef={sceneRef}
              setStatus={setStatus}
              onApplyFunction={handleApplyFunction}
            />
          </div>
        </div>
      )}
"""

anchor = "<MocapWorkspace"
if anchor in code:
    code = code.replace(anchor, OVERLAYS + "\n      " + anchor, 1); ok("JSX overlays added")
else:
    anchor2 = "{/* Grease Pencil Panel */}"
    if anchor2 in code:
        code = code.replace(anchor2, OVERLAYS + anchor2); ok("JSX overlays added (fallback)")
    else:
        warn("JSX anchor not found — add overlays manually")

step("Adding workspace tab buttons")
TAB_ADD = """
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("gamepad")}>
          <span className="spx-native-workspace-tab-label">🎮 Gamepad</span>
          <span className="spx-native-workspace-tab-hint">Animate</span>
        </button>
        <button type="button" className="spx-native-workspace-tab" onClick={() => openWorkspaceTool("pro_mesh")}>
          <span className="spx-native-workspace-tab-label">✂ Pro Mesh</span>
          <span className="spx-native-workspace-tab-hint">Shift+P</span>
        </button>"""

anchor = """        <button type="button" className="spx-native-workspace-tab" onClick={() => setShowPerformancePanel(v => !v)}>
          <span className="spx-native-workspace-tab-label">SPX Performance</span>
          <span className="spx-native-workspace-tab-hint">P</span>
        </button>"""

if anchor in code:
    code = code.replace(anchor, anchor + TAB_ADD); ok("Tab buttons added")
else:
    warn("Tab button anchor not found — add manually")

step("Adding handleApplyFunction handlers")
FN_ADD = """
    if (fn === "open_gamepad")   { setGamepadOpen(true); return; }
    if (fn === "open_pro_mesh")  { setProMeshOpen(true); return; }
"""
anchor = 'if (fn === "open_fluid")'
if anchor in code:
    code = code.replace(anchor, FN_ADD + "    " + anchor); ok("handleApplyFunction handlers added")
else:
    warn("fn anchor not found — add handlers manually")

step("Writing App.jsx")
with open(APP, "w") as f: f.write(code)
ok("App.jsx written")

print(f"""
{'='*60}
  ✅ INSTALLED

  🎮 Gamepad Animator  → workspace tab "Gamepad"
     • Xbox/PS/generic controller support
     • Real-time character control via joystick
     • Record animation while performing
     • Axis + button mapping with presets
     • Fight/Combat, Walk, Poser presets

  ✂ Pro Mesh Panel    → workspace tab "Pro Mesh" (Shift+P)
     • Full tool strip (8 groups, 50+ tools)
     • Proportional editing with falloff curves
     • Snap system (vertex/edge/face/grid)
     • Keyboard shortcuts (G,R,S,E,I,K,O,1,2,3...)
     • Wired to HalfEdgeMesh, NgonSupport,
       AutoRetopo, DynamicTopology, BooleanOps,
       RemeshSystem
     • Operation history log
     • Real-time mesh stats

  Next:
    cd {REPO}
    npm run build
    git add -A && git commit -m "feat: GamepadAnimator + ProMeshPanel" && git push
{'='*60}
""")
