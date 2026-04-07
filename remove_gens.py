import re

SRC = "/workspaces/spxmesh3/src/App.jsx"

with open(SRC) as f:
    src = f.read()

import shutil
shutil.copy(SRC, SRC + ".before_gen_remove")

# ── Remove imports ─────────────────────────────────────────────────────────
for line in [
    'import FaceGeneratorPanel from "./panels/generators/FaceGeneratorPanel.jsx";\n',
    'import FoliageGeneratorPanel from "./panels/generators/FoliageGeneratorPanel.jsx";\n',
    'import VehicleGeneratorPanel from "./panels/generators/VehicleGeneratorPanel.jsx";\n',
    'import CreatureGeneratorPanel from "./panels/generators/CreatureGeneratorPanel.jsx";\n',
    'import PropGeneratorPanel from "./panels/generators/PropGeneratorPanel.jsx";\n',
]:
    src = src.replace(line, '')

# ── Remove useState declarations ───────────────────────────────────────────
for line in [
    '  const [faceGenOpen, setFaceGenOpen] = useState(false);\n',
    '  const [foliageGenOpen, setFoliageGenOpen] = useState(false);\n',
    '  const [vehicleGenOpen, setVehicleGenOpen] = useState(false);\n',
    '  const [creatureGenOpen, setCreatureGenOpen] = useState(false);\n',
    '  const [propGenOpen, setPropGenOpen] = useState(false);\n',
]:
    src = src.replace(line, '')

# ── Remove from closeAllWorkspacePanels ────────────────────────────────────
for line in [
    '    setFaceGenOpen(false);\n',
    '    setFoliageGenOpen(false);\n',
    '    setVehicleGenOpen(false);\n',
    '    setCreatureGenOpen(false);\n',
    '    setPropGenOpen(false);\n',
]:
    src = src.replace(line, '')

# ── Remove from openWorkspaceTool map ──────────────────────────────────────
for line in [
    '      face_gen: () => setFaceGenOpen(true),\n',
    '      foliage_gen: () => setFoliageGenOpen(true),\n',
    '      vehicle_gen: () => setVehicleGenOpen(true),\n',
    '      creature_gen: () => setCreatureGenOpen(true),\n',
    '      prop_gen: () => setPropGenOpen(true),\n',
]:
    src = src.replace(line, '')

# ── Remove from handleApplyFunction ───────────────────────────────────────
for line in [
    '    if (fn === "open_gamepad")      { setGamepadOpen(true); return; }\n',
]:
    pass  # keep this one

for line in [
    '    else if (toolId === "face_gen") setFaceGenOpen?.(true);\n',
    '    else if (toolId === "foliage_gen") setFoliageGenOpen?.(true);\n',
    '    else if (toolId === "vehicle_gen") setVehicleGenOpen?.(true);\n',
    '    else if (toolId === "creature_gen") setCreatureGenOpen?.(true);\n',
    '    else if (toolId === "prop_gen") setPropGenOpen?.(true);\n',
    '    else if (toolId === "face_gen") setFaceGenOpen(true);\n',
    '    else if (toolId === "foliage_gen") setFoliageGenOpen(true);\n',
    '    else if (toolId === "vehicle_gen") setVehicleGenOpen(true);\n',
    '    else if (toolId === "creature_gen") setCreatureGenOpen(true);\n',
    '    else if (toolId === "prop_gen") setPropGenOpen(true);\n',
]:
    src = src.replace(line, '')

# ── Remove GEN SpxTabGroup entries ─────────────────────────────────────────
src = src.replace(
    '              { label: "Face",        fn: () => openWorkspaceTool("face_gen") },\n',
    ''
)
src = src.replace(
    '              { label: "Vehicle",     fn: () => openWorkspaceTool("vehicle_gen") },\n',
    ''
)
src = src.replace(
    '              { label: "Creature",    fn: () => openWorkspaceTool("creature_gen") },\n',
    ''
)
src = src.replace(
    '              { label: "Foliage",     fn: () => openWorkspaceTool("foliage_gen") },\n',
    ''
)

# Also remove from WORLD tab (foliage was there)
src = src.replace(
    '              { label: "Foliage",    fn: () => openWorkspaceTool("foliage_gen") },\n',
    ''
)

# ── Remove the float-panel-gen JSX block ──────────────────────────────────
# Remove the entire conditional block
old_block = '''          {(faceGenOpen || foliageGenOpen || vehicleGenOpen || creatureGenOpen || propGenOpen) && (
            <div className="float-panel-gen">
              <div className="float-panel-gen__header">
                <span className="float-panel-gen__title">
                  {faceGenOpen ? "Face Generator" : foliageGenOpen ? "Foliage Generator" : vehicleGenOpen ? "Vehicle Generator" : creatureGenOpen ? "Creature Generator" : "Prop Generator"}
                </span>
                <button className="float-panel-gen__close" onClick={() => { setFaceGenOpen(false); setFoliageGenOpen(false); setVehicleGenOpen(false); setCreatureGenOpen(false); setPropGenOpen(false); }}>×</button>
              </div>
              <div className="float-panel-gen__body">
                {faceGenOpen     && <FaceGeneratorPanel sceneRef={sceneRef} setStatus={setStatus} />}
                {foliageGenOpen  && <FoliageGeneratorPanel sceneRef={sceneRef} setStatus={setStatus} />}
                {vehicleGenOpen  && <VehicleGeneratorPanel sceneRef={sceneRef} setStatus={setStatus} />}
                {creatureGenOpen && <CreatureGeneratorPanel sceneRef={sceneRef} setStatus={setStatus} />}
                {propGenOpen     && <PropGeneratorPanel sceneRef={sceneRef} setStatus={setStatus} />}
              </div>
            </div>
          )}'''
src = src.replace(old_block, '')

with open(SRC, 'w') as f:
    f.write(src)

# Verify
remaining = [(i+1, l.rstrip()) for i, l in enumerate(src.split('\n'))
             if any(x in l for x in ['faceGen', 'foliageGen', 'vehicleGen', 'creatureGen', 'propGen',
                                       'FaceGenerator', 'FoliageGenerator', 'VehicleGenerator',
                                       'CreatureGenerator', 'PropGenerator'])]

print(f"DONE. {len(remaining)} remaining references:")
for lineno, line in remaining:
    print(f"  {lineno}: {line.strip()[:100]}")
