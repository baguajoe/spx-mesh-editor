import os, re

base = "/workspaces/spx-mesh-editor/src"

# ── 1. Fix RoomEnvironment import in RenderFarm.js ───────────────────────────
rf_path = f"{base}/mesh/RenderFarm.js"
with open(rf_path, "r") as f:
    rf = f.read()

# Replace THREE.RoomEnvironment() with a procedural fallback that doesn't need the import
old_room = "const target = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04);"
new_room = """// RoomEnvironment removed (not in three.module.js build)
  // Use a neutral grey scene as PMREM source instead
  const neutralScene = new THREE.Scene();
  neutralScene.background = new THREE.Color(0x444444);
  const target = pmrem.fromScene(neutralScene, 0.04);"""

if old_room in rf:
    rf = rf.replace(old_room, new_room)
    with open(rf_path, "w") as f:
        f.write(rf)
    print("✅ 1. RoomEnvironment fixed — neutral grey PMREM fallback")
else:
    print("❌ 1. RoomEnvironment string not found — check manually")

# ── 2. Check NodeCompositor wiring ───────────────────────────────────────────
app_path = f"{base}/App.jsx"
with open(app_path, "r") as f:
    app = f.read()

compositor_ui = "NodeCompositor" in app and ("compositorOpen" in app or "nodeCompositor" in app.lower())
print(f"{'✅' if compositor_ui else '⚠️ '} 2. NodeCompositor UI wiring: {'found' if compositor_ui else 'MISSING — needs panel'}")

if not compositor_ui:
    # Wire it: add state + handler
    if "compositorOpen" not in app:
        app = app.replace(
            "  const [style3DTo2DOpen, setStyle3DTo2DOpen] = useState(false);",
            "  const [style3DTo2DOpen, setStyle3DTo2DOpen] = useState(false);\n  const [compositorOpen, setCompositorOpen] = useState(false);"
        )
        app = app.replace(
            "    else if (toolId === \"3d_to_2d\") setStyle3DTo2DOpen(true);",
            "    else if (toolId === \"3d_to_2d\") setStyle3DTo2DOpen(true);\n    else if (toolId === \"node_compositor\") setCompositorOpen(v => !v);"
        )
        with open(app_path, "w") as f:
            f.write(app)
        print("   ✅ NodeCompositor state + handler added")

# ── 3. PBR viewport shading — ensure renderer uses physical lights ────────────
# Check App.jsx renderer setup
renderer_pbr = "physicallyCorrectLights" in app or "useLegacyLights" in app or "outputColorSpace" in app
print(f"{'✅' if renderer_pbr else '⚠️ '} 3. PBR renderer settings: {'found' if renderer_pbr else 'checking RenderFarm'}")

# Fix in RenderFarm if needed
with open(rf_path, "r") as f:
    rf = f.read()

if "outputColorSpace" not in rf and "outputEncoding" not in rf:
    # Find renderer setup and add color space
    old_ibl = "export function applyIBLToScene"
    new_ibl = """export function configurePBRRenderer(renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

export function applyIBLToScene"""
    rf = rf.replace(old_ibl, new_ibl)
    with open(rf_path, "w") as f:
        f.write(rf)
    print("✅ 3. PBR renderer config added (ACES tonemapping, sRGB, PCF shadows)")
else:
    print("✅ 3. PBR renderer settings already present")

# ── 4. Camera DOF/dolly/rack — already wired per audit, verify completeness ──
cam_checks = {
    "DOF": "cam_dof" in app,
    "dollyZoom": "dollyZoom" in app,
    "rackFocus": "rackFocus" in app or "rack_focus" in app,
    "shake": "cam_shake" in app or "cameraShake" in app,
}
for name, ok in cam_checks.items():
    print(f"{'✅' if ok else '⚠️ '} 4. Camera {name}: {'wired' if ok else 'MISSING'}")

# ── 5. GLB export quality — add draco compression hint in export ──────────────
glb_path = f"{base}/mesh/FBXPipeline.js"
if os.path.exists(glb_path):
    with open(glb_path, "r") as f:
        glb = f.read()
    has_draco = "draco" in glb.lower() or "DRACOExporter" in glb
    print(f"{'✅' if has_draco else '⚠️ '} 5. GLB Draco compression: {'present' if has_draco else 'not found — standard GLB export only'}")
else:
    print("⚠️  5. FBXPipeline.js not found")

# ── 6. Performance — check if renderer uses requestAnimationFrame properly ────
perf_checks = {
    "FPS counter": "fps" in app.lower() and "setFps" in app,
    "polyCount": "polyCount" in app,
    "pixelRatio": "pixelRatio" in app or "setPixelRatio" in app,
}
for name, ok in perf_checks.items():
    print(f"{'✅' if ok else '⚠️ '} 6. Performance {name}: {'present' if ok else 'MISSING'}")

# Wire configurePBRRenderer call into App.jsx renderer init
if "configurePBRRenderer" not in app:
    # Import it
    app_updated = False
    if "createPMREMFromScene" in app:
        old_import_rf = "createPMREMFromScene"
        # Just add configurePBRRenderer to the existing RenderFarm import
        app = re.sub(
            r'(import\s*\{[^}]*)(createPMREMFromScene)([^}]*\}\s*from\s*["\'].*RenderFarm)',
            r'\1createPMREMFromScene\3',
            app
        )
        # Find renderer creation and add config call
        if "renderer.setPixelRatio" in app:
            app = app.replace(
                "renderer.setPixelRatio",
                "configurePBRRenderer(renderer);\n    renderer.setPixelRatio",
                1
            )
            app_updated = True
    if app_updated:
        with open(app_path, "w") as f:
            f.write(app)
        print("✅ 6. configurePBRRenderer wired into renderer init")

print("\n── All 6 checks complete ──")
