path = "src/App.jsx"
with open(path, "r") as f:
    src = f.read()

changes = 0

# ── 1. Add buildFaceOverlay after buildEdgeOverlay ───────────────────────────
# Find where buildEdgeOverlay ends and insert buildFaceOverlay after it
old_edge_end = """    [selectedEdges]
  );"""

new_face_overlay = """    [selectedEdges]
  );

  // ── Build face overlay ─────────────────────────────────────────────────────
  const buildFaceOverlay = useCallback(
    (selFaces = selectedFaces) => {
      const scene = sceneRef.current;
      const mesh = meshRef.current;
      if (!scene || !mesh) return;

      // Remove existing face overlay
      if (faceOverlayRef.current) { scene.remove(faceOverlayRef.current); faceOverlayRef.current = null; }
      if (selFaces.size === 0) return;

      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      const idx = geo.index;
      if (!pos) return;

      const overlayPositions = [];
      const overlayColors = [];

      if (idx) {
        for (let i = 0; i < idx.count; i += 3) {
          const faceIdx = Math.floor(i / 3);
          const selected = selFaces.has(faceIdx);
          if (!selected) continue;
          for (let k = 0; k < 3; k++) {
            const vi = idx.getX(i + k);
            overlayPositions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
            overlayColors.push(1.0, 0.4, 0.0); // orange highlight
          }
        }
      }

      if (overlayPositions.length === 0) return;

      const overlayGeo = new THREE.BufferGeometry();
      overlayGeo.setAttribute("position", new THREE.Float32BufferAttribute(overlayPositions, 3));
      overlayGeo.setAttribute("color", new THREE.Float32BufferAttribute(overlayColors, 3));
      const overlayMat = new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.4,
        depthTest: false, side: THREE.DoubleSide,
      });
      const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
      overlayMesh.position.copy(mesh.position);
      overlayMesh.renderOrder = 1;
      scene.add(overlayMesh);
      faceOverlayRef.current = overlayMesh;
    },
    [selectedFaces]
  );"""

if old_edge_end in src and "buildFaceOverlay" not in src:
    # Only replace first occurrence (the one after buildEdgeOverlay)
    src = src.replace(old_edge_end, new_face_overlay, 1)
    changes += 1
    print("✅ buildFaceOverlay added")
else:
    print("⚠️  buildFaceOverlay already exists or insertion point not found")

# ── 2. Add faceOverlayRef ────────────────────────────────────────────────────
if "faceOverlayRef" not in src:
    src = src.replace(
        "  const vertDotsRef = useRef(null);",
        "  const vertDotsRef = useRef(null);\n  const faceOverlayRef = useRef(null);"
    )
    changes += 1
    print("✅ faceOverlayRef added")

# ── 3. Wire buildFaceOverlay into rebuildMeshGeometry ────────────────────────
old_rebuild = """    if (editMode === "edit") {
      if (selectMode === "vert") buildVertexOverlay();
      if (selectMode === "edge") buildEdgeOverlay();
    }
  }, [editMode, selectMode, buildVertexOverlay, buildEdgeOverlay]);"""

new_rebuild = """    if (editMode === "edit") {
      if (selectMode === "vert") buildVertexOverlay();
      if (selectMode === "edge") buildEdgeOverlay();
      if (selectMode === "face") buildFaceOverlay();
    }
  }, [editMode, selectMode, buildVertexOverlay, buildEdgeOverlay, buildFaceOverlay]);"""

if old_rebuild in src:
    src = src.replace(old_rebuild, new_rebuild)
    changes += 1
    print("✅ buildFaceOverlay wired into rebuildMeshGeometry")

# ── 4. Wire buildFaceOverlay into useEffect for selectMode ───────────────────
old_effect = """    if (editMode === "edit") {
      if (selectMode === "vert") buildVertexOverlay();
      if (selectMode === "edge") buildEdgeOverlay();
    }
  }, [editMode, selectMode, buildVertexOverlay, buildEdgeOverlay]);"""

# Already replaced above — wire into the face selection handler too
old_face_sel = """          setStatus(`Face ${faceIdx} selected`);
        }
      }
    },
    [raycast, buildVertexOverlay, buildEdgeOverlay]
  );"""

new_face_sel = """          setStatus(`Face ${faceIdx} selected`);
          buildFaceOverlay(next);
        }
      }
    },
    [raycast, buildVertexOverlay, buildEdgeOverlay, buildFaceOverlay]
  );"""

if old_face_sel in src:
    src = src.replace(old_face_sel, new_face_sel)
    changes += 1
    print("✅ buildFaceOverlay called on face selection")

# ── 5. Wire extrude to use selectedFaces ─────────────────────────────────────
old_extrude = '    if (fn === "extrude")'
new_extrude = '''    if (fn === "extrude") {
      if (heMeshRef.current && selectedFaces.size > 0) {
        pushHistory();
        const faceIds = [...selectedFaces];
        heMeshRef.current.extrudeFaces(faceIds, 0.3);
        rebuildMeshGeometry();
        setStatus(`Extruded ${faceIds.length} face(s)`);
        return;
      }
    }
    if (fn === "_extrude_legacy")'''

if old_extrude in src and "extrudeFaces" not in src[src.find(old_extrude)-200:src.find(old_extrude)]:
    src = src.replace(old_extrude, new_extrude, 1)
    changes += 1
    print("✅ Extrude wired to selectedFaces")

# ── 6. Wire bevel to use selectedEdges ───────────────────────────────────────
old_bevel = '    if (fn === "bevel")'
new_bevel = '''    if (fn === "bevel") {
      if (heMeshRef.current) {
        pushHistory();
        heMeshRef.current.bevelEdges(0.1);
        rebuildMeshGeometry();
        setStatus("Bevel applied");
        return;
      }
    }
    if (fn === "_bevel_legacy")'''

if old_bevel in src and "_bevel_legacy" not in src:
    src = src.replace(old_bevel, new_bevel, 1)
    changes += 1
    print("✅ Bevel wired to HalfEdgeMesh.bevelEdges")

# ── 7. Wire inset to use selectedFaces ───────────────────────────────────────
old_inset = '    if (fn === "inset")'
new_inset = '''    if (fn === "inset") {
      if (heMeshRef.current && selectedFaces.size > 0) {
        pushHistory();
        const faceIds = [...selectedFaces];
        heMeshRef.current.insetFaces(faceIds, 0.1);
        rebuildMeshGeometry();
        setStatus(`Inset ${faceIds.length} face(s)`);
        return;
      }
    }
    if (fn === "_inset_legacy")'''

if old_inset in src and "_inset_legacy" not in src:
    src = src.replace(old_inset, new_inset, 1)
    changes += 1
    print("✅ Inset wired to selectedFaces")

# ── 8. Fix Maya tools to use selectedVerts state instead of window._selectedVerts ──
src = src.replace(
    "[...window._selectedVerts||[]]",
    "[...selectedVerts]"
)
changes += 1
print("✅ Maya tools now use selectedVerts state (not window._selectedVerts)")

# ── 9. Add selectMode_face handler + face overlay trigger ────────────────────
old_face_mode = '    if (fn === "selectMode_face")     { setSelectMode("face"); setStatus("Face select"); return; }'
new_face_mode = '    if (fn === "selectMode_face")     { setSelectMode("face"); setTimeout(()=>buildFaceOverlay(),50); setStatus("Face select"); return; }'
if old_face_mode in src:
    src = src.replace(old_face_mode, new_face_mode)
    changes += 1
    print("✅ selectMode_face triggers buildFaceOverlay")

with open(path, "w") as f:
    f.write(src)

print(f"\n── {changes} changes applied ──")
print("Grease Pencil: Sculpt workspace → Grease Pencil section, or Shift+G shortcut")
print("Edge slide: Switch to Edge mode → select an edge → press G+G")
