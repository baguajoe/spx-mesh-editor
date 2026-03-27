#!/usr/bin/env python3
"""
Run this IN your Codespace terminal:
  python3 patch_app.py
"""
import re

path = "/workspaces/spx-mesh-editor/src/App.jsx"

with open(path, 'r') as f:
    content = f.read()

# 1. Add SceneOutliner + AnimationTimeline imports after existing component imports
old_import = 'import { MeshEditorPanel, PropertiesPanel } from "./components/MeshEditorPanel.jsx";'
new_import = '''import { MeshEditorPanel, PropertiesPanel } from "./components/MeshEditorPanel.jsx";
import { SceneOutliner } from "./components/SceneOutliner.jsx";
import { AnimationTimeline } from "./components/AnimationTimeline.jsx";'''

if old_import in content:
    content = content.replace(old_import, new_import, 1)
    print("✅ Added imports")
else:
    print("⚠️  Import anchor not found - checking...")
    # Try alternate
    alt = 'import { MeshEditorPanel, PropertiesPanel } from "./components/MeshEditorPanel.jsx"'
    if alt in content:
        content = content.replace(alt, alt + ';\nimport { SceneOutliner } from "./components/SceneOutliner.jsx";\nimport { AnimationTimeline as TimelineComp } from "./components/AnimationTimeline.jsx";', 1)
        print("✅ Added imports (alternate)")

# 2. Fix evaluateNLA call if not already fixed
old_nla = '      window.evaluateNLA(currentFrame);'
new_nla = '      if (nlaTracks?.length > 0) window.evaluateNLA(nlaTracks, nlaActions, currentFrame);'
if old_nla in content:
    content = content.replace(old_nla, new_nla, 1)
    print("✅ Fixed evaluateNLA call")

# 3. Update the render/return to add all panels
# Find return( and replace rightPanel + add bottomPanel
old_right = '''      rightPanel={
        showNPanel || activeWorkspace !== "Modeling" ? (
          <FeatureIndexPanel
            activeWorkspace={activeWorkspace}
            onApplyFunction={handleApplyFunction}
          />
        ) : (
          <PropertiesPanel
            stats={stats}
            activeObj={meshRef.current}
          />
        )
      }
    />
  );
}'''

new_right = '''      rightPanel={
        <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
          <SceneOutliner
            sceneObjects={sceneObjects}
            activeObjId={activeObjId}
            onSelect={selectSceneObject}
            onRename={renameSceneObject}
            onDelete={deleteSceneObject}
            onToggleVisible={toggleSceneObjectVisible}
            onAddPrimitive={addPrimitive}
          />
          <div style={{ flex:1, overflow:"auto", borderTop:"1px solid #202020" }}>
            {showNPanel || activeWorkspace !== "Modeling" ? (
              <FeatureIndexPanel
                activeWorkspace={activeWorkspace}
                onApplyFunction={handleApplyFunction}
              />
            ) : (
              <PropertiesPanel
                stats={stats}
                activeObj={meshRef.current}
              />
            )}
          </div>
        </div>
      }
      bottomPanel={
        <AnimationTimeline
          currentFrame={currentFrame}
          setCurrentFrame={setCurrentFrame}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          isAutoKey={isAutoKey}
          setAutoKey={setAutoKey}
          videoStartFrame={videoStartFrame}
          videoEndFrame={videoEndFrame}
          setVideoStartFrame={setVideoStartFrame}
          setVideoEndFrame={setVideoEndFrame}
          videoFps={videoFps}
          setVideoFps={setVideoFps}
          sceneObjects={sceneObjects}
          animKeys={animKeys}
          onAddKeyframe={() => handleApplyFunction("add_keyframe")}
        />
      }
    />
  );
}'''

if old_right in content:
    content = content.replace(old_right, new_right, 1)
    print("✅ Updated render with Outliner + Timeline")
else:
    print("⚠️  Render block not matched exactly - trying partial...")
    # Check what's there
    idx = content.rfind('rightPanel={')
    print(f"  rightPanel found at char {idx}")
    print(f"  Content around it: {repr(content[idx:idx+200])}")

with open(path, 'w') as f:
    f.write(content)

print(f"\nDone. File size: {len(content)} bytes")
