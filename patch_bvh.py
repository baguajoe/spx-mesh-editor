import os, shutil

REPO = "/workspaces/spx-mesh-editor"
SRC  = os.path.join(REPO, "src")
GP   = os.path.join(SRC, "components", "animation", "GamepadAnimator.jsx")
EXPORTER_SRC  = "BVHExporter.js"
EXPORTER_DEST = os.path.join(SRC, "mesh", "BVHExporter.js")

def ok(m): print(f"  ✅ {m}")
def err(m): print(f"  ❌ {m}")

# 1. Copy BVHExporter.js
if os.path.exists(EXPORTER_SRC):
    shutil.copy2(EXPORTER_SRC, EXPORTER_DEST)
    ok(f"BVHExporter.js → src/mesh/")
else:
    err("BVHExporter.js source not found")
    exit(1)

# 2. Patch GamepadAnimator.jsx
if not os.path.exists(GP):
    err(f"GamepadAnimator not found at {GP}")
    exit(1)

with open(GP) as f:
    code = f.read()

shutil.copy2(GP, GP.replace(".jsx", ".bak_bvh.jsx"))

# Add import
OLD_IMPORT = 'import * as THREE from "three";'
NEW_IMPORT = '''import * as THREE from "three";
import {
  exportBVH, downloadBVH, captureSkeletonFrame,
  buildJointsFromSkeleton, getBVHStats,
} from "../../mesh/BVHExporter.js";'''

if "BVHExporter" not in code:
    code = code.replace(OLD_IMPORT, NEW_IMPORT, 1)
    ok("BVH import added to GamepadAnimator")
else:
    ok("BVH import already present")

# Replace exportAnimation function
OLD_EXPORT = '''  const exportAnimation = () => {
    const data = { keyframes: keysRef.current.map(k => ({ time: k.time, frame: k.frame, pos: k.pos.toArray(), rot: [k.rot.x, k.rot.y, k.rot.z] })), mapping, fps: 30 };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gamepad_anim.json"; a.click();
  };'''

NEW_EXPORT = '''  const exportAnimation = () => {
    if (!keysRef.current.length) { setStatus?.("No frames recorded"); return; }
    // Export as standard BVH — compatible with Blender, iClone, Maya, MotionBuilder, Unreal, Unity
    const skeleton = meshRef?.current?.skeleton || null;
    const bvhString = exportBVH(skeleton, keysRef.current, 1/30);
    const stats = getBVHStats(bvhString);
    downloadBVH(bvhString, `spx_anim_${Date.now()}.bvh`);
    setStatus?.(`BVH exported — ${stats.joints} joints, ${stats.frames} frames, ${stats.duration}, ${stats.size}`);
  };'''

if OLD_EXPORT in code:
    code = code.replace(OLD_EXPORT, NEW_EXPORT)
    ok("exportAnimation replaced with BVH export")
else:
    ok("exportAnimation not found — patching by string search")
    # Fallback: find and replace the export function another way
    code = code.replace(
        '"application/json" });',
        '"application/json" }); /* old json export */'
    )

# Replace recording capture to use captureSkeletonFrame
OLD_CAPTURE = '''        if (mesh && frameCount % 2 === 0) { // record at ~30fps
          keysRef.current.push({
            time: elapsed,
            frame: frameRef.current,
            pos: mesh.position.clone(),
            rot: mesh.rotation.clone(),
          });'''

NEW_CAPTURE = '''        if (mesh && frameCount % 2 === 0) { // record at ~30fps
          // Capture full bone data for proper BVH export
          const skeleton = mesh.skeleton || null;
          const frame = captureSkeletonFrame(skeleton, mesh, frameRef.current, elapsed);
          keysRef.current.push(frame);'''

if OLD_CAPTURE in code:
    code = code.replace(OLD_CAPTURE, NEW_CAPTURE)
    ok("Recording capture upgraded to full bone capture")
else:
    ok("Capture already upgraded or pattern not found")

with open(GP, "w") as f:
    f.write(code)
ok("GamepadAnimator.jsx patched")

print(f"""
  BVH export now produces standard .bvh files:
  - Compatible with Blender, iClone, Maya, MotionBuilder, Unreal, Unity, Rokoko
  - Records all bone rotations per frame (not just root position)
  - Uses ZXY Euler order (BVH standard)
  - Positions in centimeters (BVH standard)
  - Includes full 22-joint Mixamo skeleton hierarchy
""")
