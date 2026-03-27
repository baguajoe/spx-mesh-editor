#!/usr/bin/env python3
"""
Run in Codespace terminal:
  python3 /workspaces/spx-mesh-editor/patch_panels.py
"""
path = "/workspaces/spx-mesh-editor/src/App.jsx"

with open(path, 'r') as f:
    content = f.read()

# 1. Add panel imports
old_imp = 'import { SceneOutliner } from "./components/SceneOutliner.jsx";'
new_imp = '''import { SceneOutliner } from "./components/SceneOutliner.jsx";
import { SculptPanel } from "./components/SculptPanel.jsx";
import { ShadingPanel } from "./components/ShadingPanel.jsx";
import { AnimationPanel } from "./components/AnimationPanel.jsx";'''

if old_imp in content:
    content = content.replace(old_imp, new_imp, 1)
    print("✅ Panel imports added")
else:
    print("⚠️  SceneOutliner import not found, trying alternate...")
    if 'SceneOutliner' not in content:
        # Add after MeshEditorPanel import
        old2 = 'import { MeshEditorPanel, PropertiesPanel } from "./components/MeshEditorPanel.jsx";'
        new2 = old2 + '''
import { SceneOutliner } from "./components/SceneOutliner.jsx";
import { SculptPanel } from "./components/SculptPanel.jsx";
import { ShadingPanel } from "./components/ShadingPanel.jsx";
import { AnimationPanel } from "./components/AnimationPanel.jsx";'''
        if old2 in content:
            content = content.replace(old2, new2, 1)
            print("✅ Panel imports added (alternate)")

# 2. Replace leftPanel to be workspace-aware
old_left = '''      leftPanel={
        <MeshEditorPanel
          stats={stats}
          onApplyFunction={handleApplyFunction}
          onAddPrimitive={addPrimitive}
        />
      }'''

new_left = '''      leftPanel={
        activeWorkspace === "Sculpt" ? (
          <SculptPanel
            onApplyFunction={handleApplyFunction}
            sculptBrush={sculptBrush} setSculptBrush={setSculptBrush}
            sculptRadius={sculptRadius} setSculptRadius={setSculptRadius}
            sculptStrength={sculptStrength} setSculptStrength={setSculptStrength}
            sculptFalloff={sculptFalloff} setSculptFalloff={setSculptFalloff}
            sculptSymX={sculptSymX} setSculptSymX={setSculptSymX}
            dyntopoEnabled={dyntopoEnabled} setDyntopoEnabled={setDyntopoEnabled}
            vcPaintColor={vcPaintColor} setVcPaintColor={setVcPaintColor}
            vcRadius={vcRadius} setVcRadius={setVcRadius}
            vcStrength={vcStrength} setVcStrength={setVcStrength}
            gpColor={gpColor} setGpColor={setGpColor}
            gpThickness={gpThickness} setGpThickness={setGpThickness}
          />
        ) : activeWorkspace === "Shading" ? (
          <ShadingPanel onApplyFunction={handleApplyFunction} />
        ) : activeWorkspace === "Animation" ? (
          <AnimationPanel
            onApplyFunction={handleApplyFunction}
            isAutoKey={isAutoKey} setAutoKey={setAutoKey}
            currentFrame={currentFrame}
            shapeKeys={shapeKeys}
            nlaActions={nlaActions}
            nlaTracks={nlaTracks}
          />
        ) : (
          <MeshEditorPanel
            stats={stats}
            onApplyFunction={handleApplyFunction}
            onAddPrimitive={addPrimitive}
          />
        )
      }'''

if old_left in content:
    content = content.replace(old_left, new_left, 1)
    print("✅ leftPanel updated with workspace switching")
else:
    print("⚠️  leftPanel block not matched exactly")
    idx = content.find('leftPanel={')
    print(f"  leftPanel at char: {idx}")
    print(f"  Context: {repr(content[idx:idx+200])}")

with open(path, 'w') as f:
    f.write(content)

print(f"\n✅ Done. File: {len(content)} bytes")
