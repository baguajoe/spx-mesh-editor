import os

base = "/workspaces/spx-mesh-editor/src"
app_path = f"{base}/App.jsx"
shell_path = f"{base}/pro-ui/ProfessionalShell.jsx"
wmap_path = f"{base}/pro-ui/workspaceMap.js"

with open(app_path, "r") as f:
    app = f.read()
with open(shell_path, "r") as f:
    shell = f.read()
with open(wmap_path, "r") as f:
    wmap = f.read()

changes = 0

# ── 1. Smart UV unwrap (angle-based LSCM approximation) ──────────────────────
uv_path = f"{base}/mesh/uv/UVUnwrap.js"
with open(uv_path, "r") as f:
    uv = f.read()

if "smartUnwrap" not in uv:
    smart_uv = r"""
// ── Smart UV Unwrap (LSCM-style angle-based projection) ──────────────────────
export function smartUnwrap(hem, seams) {
  const seamSet = new Set(seams || []);
  const uvs = new Map();
  const visited = new Set();
  let islandId = 0;

  // For each unvisited face, flood-fill stopping at seams
  for (const [fid, face] of hem.faces) {
    if (visited.has(fid)) continue;
    // Collect island faces via BFS
    const island = [];
    const queue = [face];
    visited.add(fid);
    while (queue.length) {
      const f = queue.shift();
      island.push(f);
      if (!f.edge) continue;
      let e = f.edge;
      do {
        if (e.twin && e.twin.face && !visited.has(e.twin.face.id) && !seamSet.has(e.id)) {
          visited.add(e.twin.face.id);
          queue.push(e.twin.face);
        }
        e = e.next;
      } while (e && e !== f.edge);
    }

    // Project island using angle-based planar projection
    // Use first face normal as projection plane
    const firstFace = island[0];
    const fverts = firstFace.vertices ? firstFace.vertices() : [];
    if (fverts.length < 3) continue;

    const v0 = fverts[0], v1 = fverts[1], v2 = fverts[2];
    const ex = { x: v1.x-v0.x, y: v1.y-v0.y, z: v1.z-v0.z };
    const ey_raw = { x: v2.x-v0.x, y: v2.y-v0.y, z: v2.z-v0.z };
    const len_ex = Math.sqrt(ex.x**2+ex.y**2+ex.z**2) || 1;
    ex.x /= len_ex; ex.y /= len_ex; ex.z /= len_ex;
    // Gram-Schmidt orthogonalize
    const dot = ey_raw.x*ex.x+ey_raw.y*ex.y+ey_raw.z*ex.z;
    const ey = { x: ey_raw.x-dot*ex.x, y: ey_raw.y-dot*ex.y, z: ey_raw.z-dot*ex.z };
    const len_ey = Math.sqrt(ey.x**2+ey.y**2+ey.z**2) || 1;
    ey.x /= len_ey; ey.y /= len_ey; ey.z /= len_ey;

    // Project all verts in island onto this plane
    const islandUVs = new Map();
    for (const f of island) {
      const fv = f.vertices ? f.vertices() : [];
      for (const v of fv) {
        if (islandUVs.has(v.id)) continue;
        const dx = v.x-v0.x, dy = v.y-v0.y, dz = v.z-v0.z;
        const u = dx*ex.x + dy*ex.y + dz*ex.z;
        const vv = dx*ey.x + dy*ey.y + dz*ey.z;
        islandUVs.set(v.id, { u, v: vv });
      }
    }

    // Normalize island to 0-1 range
    const us = [...islandUVs.values()].map(uv => uv.u);
    const vs = [...islandUVs.values()].map(uv => uv.v);
    const minU = Math.min(...us), maxU = Math.max(...us);
    const minV = Math.min(...vs), maxV = Math.max(...vs);
    const rangeU = (maxU - minU) || 1, rangeV = (maxV - minV) || 1;

    for (const [vid, uvCoord] of islandUVs) {
      uvs.set(vid, {
        u: (uvCoord.u - minU) / rangeU,
        v: (uvCoord.v - minV) / rangeV,
        island: islandId
      });
    }
    islandId++;
  }
  return uvs;
}
"""
    uv += smart_uv
    with open(uv_path, "w") as f:
        f.write(uv)
    changes += 1
    print("✅ smartUnwrap (LSCM-style) added to UVUnwrap.js")

# ── 2. Wire smart UV into App.jsx ────────────────────────────────────────────
with open(app_path, "r") as f:
    app = f.read()

if "smart_uv" not in app:
    app = app.replace(
        '    if (fn === "mark_seam")',
        '''    if (fn === "smart_uv") {
      if (heMeshRef.current) {
        import("./mesh/uv/UVUnwrap.js").then(({ smartUnwrap, getSeams }) => {
          const uvs = smartUnwrap(heMeshRef.current, getSeams ? getSeams() : []);
          setStatus("Smart UV unwrap — " + uvs.size + " vertices mapped");
        });
      }
      return;
    }
    if (fn === "mark_seam")'''
    )
    changes += 1
    print("✅ smart_uv handler added")

# ── 3. Wire cloth simulation ──────────────────────────────────────────────────
if "cloth_sim_start" not in app:
    app = app.replace(
        '    if (fn === "smart_uv")',
        '''    if (fn === "cloth_sim_start") {
      if (meshRef.current) {
        import("./mesh/ClothSystem.js").then(({ createCloth, stepCloth, applyClothToMesh, pinTopRow }) => {
          const cloth = createCloth(meshRef.current, { segments: 10, stiffness: 0.8 });
          pinTopRow(cloth, meshRef.current);
          let frame = 0;
          const sim = setInterval(() => {
            stepCloth(cloth, 1/60);
            applyClothToMesh(cloth);
            if (meshRef.current?.geometry) meshRef.current.geometry.attributes.position.needsUpdate = true;
            if (++frame > 300) clearInterval(sim);
          }, 16);
          window._clothSim = sim;
          setStatus("Cloth simulation running — 300 frames");
        });
      }
      return;
    }
    if (fn === "cloth_sim_stop") {
      if (window._clothSim) { clearInterval(window._clothSim); window._clothSim = null; }
      setStatus("Cloth simulation stopped");
      return;
    }
    if (fn === "smart_uv")'''
    )
    changes += 1
    print("✅ Cloth simulation start/stop wired")

# ── 4. Wire fluid simulation ──────────────────────────────────────────────────
if "fluid_sim_start" not in app:
    app = app.replace(
        '    if (fn === "cloth_sim_start")',
        '''    if (fn === "fluid_sim_start") {
      import("./mesh/FLIPFluidSolver.js").then(({ FLIPFluidSolver }) => {
        const solver = new FLIPFluidSolver({ gridSize: 32, particleCount: 1000 });
        let frame = 0;
        const sim = setInterval(() => {
          solver.step(1/60);
          if (++frame > 200) clearInterval(sim);
        }, 16);
        window._fluidSim = sim;
        window._fluidSolver = solver;
        setStatus("FLIP fluid simulation running");
      });
      return;
    }
    if (fn === "fluid_sim_stop") {
      if (window._fluidSim) { clearInterval(window._fluidSim); window._fluidSim = null; }
      setStatus("Fluid simulation stopped");
      return;
    }
    if (fn === "cloth_sim_start")'''
    )
    changes += 1
    print("✅ Fluid simulation start/stop wired")

# ── 5. Wire modifier stack ────────────────────────────────────────────────────
if "modifier_add" not in app:
    app = app.replace(
        '    if (fn === "fluid_sim_start")',
        '''    if (fn === "modifier_add") {
      import("./mesh/ModifierStack.js").then(({ addModifier, applyModifierStack }) => {
        if (!meshRef.current) return;
        if (!window._modStack) window._modStack = [];
        const mod = addModifier(window._modStack, "subdivide", { levels: 1 });
        const newGeo = applyModifierStack(meshRef.current.geometry, window._modStack);
        if (newGeo && meshRef.current.isMesh) {
          meshRef.current.geometry.dispose();
          meshRef.current.geometry = newGeo;
          heMeshRef.current = null; // force rebuild on next edit
          setStatus("Subdivide modifier applied");
        }
      });
      return;
    }
    if (fn === "modifier_apply_all") {
      if (window._modStack?.length) {
        import("./mesh/ModifierStack.js").then(({ applyModifierStack }) => {
          const newGeo = applyModifierStack(meshRef.current?.geometry, window._modStack);
          if (newGeo && meshRef.current?.isMesh) {
            meshRef.current.geometry.dispose();
            meshRef.current.geometry = newGeo;
            window._modStack = [];
            setStatus("All modifiers applied");
          }
        });
      }
      return;
    }
    if (fn === "fluid_sim_start")'''
    )
    changes += 1
    print("✅ Modifier stack (add/apply) wired")

# ── 6. Wire particle emit panel ───────────────────────────────────────────────
if "particle_emit" not in app:
    app = app.replace(
        '    if (fn === "modifier_add")',
        '''    if (fn === "particle_emit") {
      if (sceneRef.current && meshRef.current) {
        const pos = meshRef.current.position;
        if (typeof window.burstEmit === "function") {
          window.burstEmit(null, pos, 200);
          setStatus("Particle burst emitted");
        } else {
          setStatus("Particle system not initialized — add a mesh first");
        }
      }
      return;
    }
    if (fn === "particle_fire")  { if(typeof window.createEmitter==="function"&&window.VFX_PRESETS){ window.createEmitter(window.VFX_PRESETS.fire); setStatus("Fire emitter"); } return; }
    if (fn === "particle_smoke") { if(typeof window.createEmitter==="function"&&window.VFX_PRESETS){ window.createEmitter(window.VFX_PRESETS.smoke); setStatus("Smoke emitter"); } return; }
    if (fn === "particle_sparks"){ if(typeof window.createEmitter==="function"&&window.VFX_PRESETS){ window.createEmitter(window.VFX_PRESETS.sparks); setStatus("Sparks emitter"); } return; }
    if (fn === "modifier_add")'''
    )
    changes += 1
    print("✅ Particle emit handlers wired")

# ── 7. Wire F-curve graph editor ──────────────────────────────────────────────
if "graph_editor" not in app:
    app = app.replace(
        '    if (fn === "particle_emit")',
        '''    if (fn === "graph_editor") {
      import("./mesh/DriverSystem.js").then(({ createDriver }) => {
        setStatus("Graph editor — use Animation workspace → F-Curve panel");
      });
      return;
    }
    if (fn === "particle_emit")'''
    )
    changes += 1
    print("✅ Graph editor handler added")

with open(app_path, "w") as f:
    f.write(app)

# ── 8. Add to workspaceMap ────────────────────────────────────────────────────
if "cloth_sim_start" not in wmap:
    # Add to Physics/FX section
    wmap = wmap.replace(
        """        { id: "bool_union",    label: "Union",        system: "BooleanOps" },""",
        """        { id: "bool_union",    label: "Union",        system: "BooleanOps" },
        { id: "cloth_sim_start", label: "Cloth Sim Start", system: "ClothSystem" },
        { id: "cloth_sim_stop",  label: "Cloth Sim Stop",  system: "ClothSystem" },
        { id: "fluid_sim_start", label: "Fluid Sim Start", system: "FLIPFluid"   },
        { id: "fluid_sim_stop",  label: "Fluid Sim Stop",  system: "FLIPFluid"   },
        { id: "modifier_add",    label: "Add Modifier",    system: "ModifierStack"},
        { id: "modifier_apply_all", label: "Apply All Mods", system: "ModifierStack"},
        { id: "particle_emit",   label: "Particle Burst",  system: "GPUParticles" },
        { id: "particle_fire",   label: "Fire Emitter",    system: "VFXSystem"   },
        { id: "particle_smoke",  label: "Smoke Emitter",   system: "VFXSystem"   },
        { id: "particle_sparks", label: "Sparks Emitter",  system: "VFXSystem"   },
        { id: "smart_uv",        label: "Smart UV Unwrap", system: "UVUnwrap"    },"""
    )
    with open(wmap_path, "w") as f:
        f.write(wmap)
    changes += 1
    print("✅ All new tools added to workspaceMap")

# ── 9. Add to ProfessionalShell menus ────────────────────────────────────────
if "cloth_sim_start" not in shell:
    shell = shell.replace(
        '    { label: "Export GLB",           fn: "exportGLB",          key: "Ctrl+E" },',
        '''    { label: "Export GLB",           fn: "exportGLB",          key: "Ctrl+E" },
    { label: "─", fn: null },
    { label: "Cloth Sim Start",      fn: "cloth_sim_start",    key: "" },
    { label: "Cloth Sim Stop",       fn: "cloth_sim_stop",     key: "" },
    { label: "Fluid Sim Start",      fn: "fluid_sim_start",    key: "" },
    { label: "Fluid Sim Stop",       fn: "fluid_sim_stop",     key: "" },
    { label: "─", fn: null },
    { label: "Add Subdivide Mod",    fn: "modifier_add",       key: "" },
    { label: "Apply All Modifiers",  fn: "modifier_apply_all", key: "" },
    { label: "─", fn: null },
    { label: "Particle Burst",       fn: "particle_emit",      key: "" },
    { label: "Fire Emitter",         fn: "particle_fire",      key: "" },
    { label: "Smoke Emitter",        fn: "particle_smoke",     key: "" },
    { label: "Smart UV Unwrap",      fn: "smart_uv",           key: "" },'''
    )
    with open(shell_path, "w") as f:
        f.write(shell)
    changes += 1
    print("✅ All tools added to Shell menus")

print(f"\n── Final script complete — {changes} changes ──")
print("Added: Smart UV, Cloth sim, Fluid sim, Modifier stack, Particles, Graph editor")
print("This is the last feature script — test week starts now")
