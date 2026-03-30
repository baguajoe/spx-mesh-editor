#!/usr/bin/env python3
"""
wire_motion_library.py
Adds MotionLibraryPanel as the 6th tab in AnimationPanel.jsx.
Also adds the spx:applyBVH event listener in App.jsx.
Run from anywhere: python3 wire_motion_library.py
"""
import re, os, shutil

REPO = '/workspaces/spx-mesh-editor'
ANIM = f'{REPO}/src/components/AnimationPanel.jsx'
APP  = f'{REPO}/src/App.jsx'

# ─── Patch AnimationPanel.jsx ────────────────────────────────────────────────

with open(ANIM, 'r') as f:
    src = f.read()

# Backup
shutil.copy2(ANIM, ANIM + '.bak_pre_motion')

# 1. Add import at top (after existing React import)
IMPORT_LINE = "import React, { useState } from \"react\";"
IMPORT_NEW  = (
    "import React, { useState } from \"react\";\n"
    "import MotionLibraryPanel from \"./animation/MotionLibraryPanel\";"
)
if 'MotionLibraryPanel' not in src:
    src = src.replace(IMPORT_LINE, IMPORT_NEW, 1)
    print("  ✓ Added MotionLibraryPanel import")
else:
    print("  ✓ Import already present")

# 2. Add gamepadOpen state after existing state declarations
# Insert after: const [procEnabled, setProcEnabled] = useState(false);
STATE_ANCHOR = "const [procEnabled, setProcEnabled] = useState(false);"
STATE_NEW = (
    "const [procEnabled, setProcEnabled] = useState(false);\n\n"
    "  // Motion Library\n"
    "  const [motionLibOpen, setMotionLibOpen] = useState(true);"
)
if 'motionLibOpen' not in src:
    src = src.replace(STATE_ANCHOR, STATE_NEW, 1)
    print("  ✓ Added motionLibOpen state")
else:
    print("  ✓ State already present")

# 3. Expand tabs row: change grid from 5 to 6 columns, add Motion tab
OLD_TABS_GRID = 'style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr" }}'
NEW_TABS_GRID = 'style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr" }}'
if '1fr 1fr 1fr 1fr 1fr 1fr' not in src:
    src = src.replace(OLD_TABS_GRID, NEW_TABS_GRID, 1)
    print("  ✓ Expanded tabs grid to 6 columns")
else:
    print("  ✓ Grid already 6 columns")

OLD_TABS_LIST = '[["keyframes","Keys"],["nla","NLA"],["shapekeys","Shapes"],["drivers","Drivers"],["procedural","Proc"]]'
NEW_TABS_LIST = '[["keyframes","Keys"],["nla","NLA"],["shapekeys","Shapes"],["drivers","Drivers"],["procedural","Proc"],["motion","Motion"]]'
if '"motion","Motion"' not in src:
    src = src.replace(OLD_TABS_LIST, NEW_TABS_LIST, 1)
    print("  ✓ Added Motion tab to tabs list")
else:
    print("  ✓ Motion tab already in list")

# 4. Add motion tab content before closing </div></div> of spnl-body
# Find the closing pattern of the last tab block
CLOSE_ANCHOR = "\n      </div>\n    </div>\n  );\n}"
MOTION_TAB_CONTENT = """
        {/* ── MOTION LIBRARY ── */}
        {tab === "motion" && (
          <div style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <MotionLibraryPanel
              onOpenGamepadAnimator={() => {
                window.dispatchEvent(new CustomEvent('spx:openGamepadAnimator'));
              }}
              onClipApplied={(id, meta) => {
                onApplyFunction && onApplyFunction("motionClipApplied", { id, meta });
              }}
            />
          </div>
        )}
"""
if 'tab === "motion"' not in src:
    src = src.replace(CLOSE_ANCHOR, MOTION_TAB_CONTENT + CLOSE_ANCHOR, 1)
    print("  ✓ Added motion tab content block")
else:
    print("  ✓ Motion tab content already present")

with open(ANIM, 'w') as f:
    f.write(src)

print(f"\n✅ AnimationPanel.jsx patched ({len(src):,} chars)\n")

# ─── Patch App.jsx ────────────────────────────────────────────────────────────

with open(APP, 'r') as f:
    app_src = f.read()

shutil.copy2(APP, APP + '.bak_pre_motion')

# 1. Add spx:applyBVH event listener and spx:openGamepadAnimator listener
# Wire after the GamepadAnimator import line
GAMEPAD_IMPORT = "import GamepadAnimator from \"./components/animation/GamepadAnimator.jsx\";"
APP_MOTION_IMPORT = (
    "import GamepadAnimator from \"./components/animation/GamepadAnimator.jsx\";\n"
    "import MotionLibraryPanel from \"./components/animation/MotionLibraryPanel\";"
)
if 'MotionLibraryPanel' not in app_src:
    app_src = app_src.replace(GAMEPAD_IMPORT, APP_MOTION_IMPORT, 1)
    print("  ✓ Added MotionLibraryPanel import to App.jsx")
else:
    print("  ✓ App.jsx import already present")

# 2. Wire spx:openGamepadAnimator event → setGamepadOpen(true)
# Find the GamepadAnimator JSX block and add useEffect before it or near gamepadOpen usage
# Look for: {gamepadOpen && (
EVENT_LISTENER_BLOCK = """
      {/* ── Motion Library BVH event bridge ── */}"""

GAMEPAD_JSX = "      {/* ── Gamepad Animator ── */}"
EVENT_AND_GAMEPAD = """
      {/* ── Motion Library BVH + GamepadAnimator event bridge ── */}
      {/* spx:applyBVH is dispatched by MotionLibraryPanel when no bvhImporter prop is passed */}
      {/* spx:openGamepadAnimator is dispatched by MotionLibraryPanel Record New button */}

      {/* ── Gamepad Animator ── */}"""

if 'Motion Library BVH' not in app_src:
    app_src = app_src.replace(GAMEPAD_JSX, EVENT_AND_GAMEPAD, 1)
    print("  ✓ Added BVH event bridge comment in App.jsx")
else:
    print("  ✓ Bridge comment already present")

# 3. Wire useEffect for spx:openGamepadAnimator → setGamepadOpen(true)
# Find existing useEffect block or add near gamepadOpen state
# Look for: const [gamepadOpen, setGamepadOpen]
GAMEPAD_STATE_PAT = re.compile(r'(const \[gamepadOpen, setGamepadOpen\] = useState\(false\);)')
if GAMEPAD_STATE_PAT.search(app_src) and 'spx:openGamepadAnimator' not in app_src:
    EFFECT_BLOCK = (
        "\n\n  // Wire MotionLibrary → GamepadAnimator\n"
        "  React.useEffect(() => {\n"
        "    const onOpen = () => setGamepadOpen(true);\n"
        "    const onBVH = (e) => {\n"
        "      const { bvh, name, fps, loop } = e.detail;\n"
        "      handleApplyFunction && handleApplyFunction('importBVHString', { bvh, name, fps, loop });\n"
        "    };\n"
        "    window.addEventListener('spx:openGamepadAnimator', onOpen);\n"
        "    window.addEventListener('spx:applyBVH', onBVH);\n"
        "    return () => {\n"
        "      window.removeEventListener('spx:openGamepadAnimator', onOpen);\n"
        "      window.removeEventListener('spx:applyBVH', onBVH);\n"
        "    };\n"
        "  }, []);\n"
    )
    app_src = GAMEPAD_STATE_PAT.sub(
        r'\1' + EFFECT_BLOCK,
        app_src,
        count=1
    )
    print("  ✓ Added useEffect for spx:openGamepadAnimator + spx:applyBVH in App.jsx")
elif 'spx:openGamepadAnimator' in app_src:
    print("  ✓ useEffect already present in App.jsx")
else:
    print("  ⚠ Could not find gamepadOpen state — add useEffect manually (see README below)")

with open(APP, 'w') as f:
    f.write(app_src)

print(f"\n✅ App.jsx patched ({len(app_src):,} chars)")
print("\n── All done. Restart dev server: npm run dev\n")
