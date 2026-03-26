from pathlib import Path
import shutil

p = Path('/workspaces/spx-mesh-editor/src/App.jsx')
shutil.copy(p, p.with_suffix('.jsx.bak_f'))
s = p.read_text()
before = len(s.splitlines())

# 1. Wire denoiseCanvas into RAF loop at 32 samples
old_loop = '''      const result = stepPathTracer(pt, rendererRef.current, sceneRef.current, cameraRef.current);
      const stats  = getPathTracerStats(pt);
      setPtStats({ ...stats });
      if (result?.done) { setPtRunning(false); setStatus("Path tracing complete \u2014 " + stats.samples + " samples"); return; }
      ptRafRef.current = requestAnimationFrame(loop);'''
new_loop = '''      const result = stepPathTracer(pt, rendererRef.current, sceneRef.current, cameraRef.current);
      const stats  = getPathTracerStats(pt);
      setPtStats({ ...stats });
      if (stats.samples === 32) { try { denoiseCanvas(rendererRef.current?.domElement); } catch(e) {} }
      if (result?.done) {
        try { denoiseCanvas(rendererRef.current?.domElement); } catch(e) {}
        setPtRunning(false);
        setStatus("Path tracing complete \u2014 " + stats.samples + " samples (denoised)");
        return;
      }
      ptRafRef.current = requestAnimationFrame(loop);'''
if old_loop in s:
    s = s.replace(old_loop, new_loop, 1)
    print("1. Denoiser wired")
else:
    print("1. WARN: RAF loop anchor not found")

# 2. Add showPoseLibPanel + poseName state
old_ps = '  const [poseLibrary, setPoseLibrary] = useState({});'
new_ps = '  const [poseLibrary, setPoseLibrary] = useState({});\n  const [showPoseLibPanel, setShowPoseLibPanel] = useState(false);\n  const [poseName, setPoseName] = useState("");'
if old_ps in s:
    s = s.replace(old_ps, new_ps, 1)
    print("2. showPoseLibPanel state added")
else:
    print("2. WARN: poseLibrary state not found")

# 3. Add handlePublishToSPX before handleExportToSPX
old_exp = '  const handleExportToSPX = useCallback(async () => {'
new_pub = '''  const handlePublishToSPX = useCallback(async () => {
    if (!sceneRef.current || !rendererRef.current) { setStatus("No scene to publish"); return; }
    setStatus("Publishing to StreamPireX...");
    try {
      generateThumbnail(rendererRef.current, sceneRef.current, cameraRef.current);
      const payload = buildSPXExportPayload(sceneRef.current, { format: "spx" });
      const result = await exportToStreamPireX(payload);
      if (result.offline) {
        downloadSPXFile(payload, "scene.spx");
        setStatus("Published locally (offline) \u2713");
      } else {
        setStatus("Published to StreamPireX \u2713");
      }
    } catch(e) { setStatus("Publish failed: " + e.message); }
  }, []);

  const handleExportToSPX = useCallback(async () => {'''
if old_exp in s:
    s = s.replace(old_exp, new_pub, 1)
    print("3. handlePublishToSPX added")
else:
    print("3. WARN: handleExportToSPX not found")

# 4. Add POS button after MSH button
old_msh = '>MSH</button>'
new_msh = '''>MSH</button>
        <button title="Pose Library" onClick={() => setShowPoseLibPanel(p => !p)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10,
            background: showPoseLibPanel ? "#8844ff" : COLORS.border,
            color: showPoseLibPanel ? "#fff" : "#888", fontWeight: 700
          }}>POS</button>'''
if old_msh in s:
    s = s.replace(old_msh, new_msh, 1)
    print("4. POS toolbar button added")
else:
    print("4. WARN: MSH button not found")

# 5. Publish hero button — inject before tour overlay comment
old_tour = '      {/* Tour overlay */}'
new_hero = '''      {/* Publish hero button */}
      <div style={{
        position: "fixed", top: 10, right: 56, zIndex: 200,
        display: "flex", gap: 6, alignItems: "center"
      }}>
        <button
          onClick={handlePublishToSPX}
          title="Publish scene to StreamPireX"
          style={{
            background: "linear-gradient(135deg, #00ffc8, #00c8a0)",
            border: "none", borderRadius: 6, cursor: "pointer",
            color: "#06060f", fontWeight: 800, fontSize: 11,
            padding: "6px 14px", boxShadow: "0 2px 12px #00ffc840",
            letterSpacing: 0.5
          }}
        >
          \u25b2 Publish to SPX
        </button>
      </div>

      {/* Tour overlay */}'''
if old_tour in s:
    s = s.replace(old_tour, new_hero, 1)
    print("5. Publish hero button added")
else:
    print("5. WARN: tour overlay anchor not found")

# 6. Pose Library panel — inject before render panel block
old_rp = '      {(showRenderPanel || showVolPanel || showPassPanel || showProbePanel) && ('
new_pl = '''      {/* Pose Library Panel */}
      {showPoseLibPanel && (
        <div style={{
          position: "fixed", right: 48, top: 120, width: 180, zIndex: 120,
          background: "#0d1117", border: "1px solid #21262d", borderRadius: 6,
          padding: 10, color: "#dde6ef"
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#8844ff", marginBottom: 8 }}>POSE LIBRARY</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            <input
              value={poseName}
              onChange={e => setPoseName(e.target.value)}
              placeholder="Pose name..."
              style={{
                flex: 1, background: "#161b22", border: "1px solid #21262d",
                color: "#dde6ef", borderRadius: 3, padding: "3px 6px", fontSize: 9
              }}
            />
            <button
              onClick={() => {
                const arm = armatureRef?.current;
                if (!arm) { setStatus("No armature selected"); return; }
                const name = poseName || ("Pose_" + Object.keys(poseLibrary).length);
                setPoseLibrary(prev => savePoseToLibrary(arm, name, { ...prev }));
                setPoseName("");
                setStatus("Pose saved: " + name);
              }}
              style={{
                background: "#8844ff", border: "none", borderRadius: 3,
                color: "#fff", cursor: "pointer", fontSize: 9, padding: "3px 7px"
              }}
            >Save</button>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {Object.keys(poseLibrary).length === 0 && (
              <div style={{ color: "#555", fontSize: 9, textAlign: "center", padding: 8 }}>No poses saved yet</div>
            )}
            {Object.keys(poseLibrary).map(name => (
              <div key={name} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "3px 0", borderBottom: "1px solid #161b22"
              }}>
                <span style={{ fontSize: 9, color: "#dde6ef", flex: 1 }}>{name}</span>
                <button
                  onClick={() => {
                    const arm = armatureRef?.current;
                    if (arm) { loadPoseFromLibrary(arm, name, poseLibrary); setStatus("Pose applied: " + name); }
                  }}
                  style={{
                    background: "#1a1f2e", border: "1px solid #21262d", borderRadius: 3,
                    color: "#8844ff", cursor: "pointer", fontSize: 8, padding: "2px 5px"
                  }}
                >Apply</button>
              </div>
            ))}
          </div>
          {Object.keys(poseLibrary).length > 0 && (
            <button
              onClick={() => setPoseLibrary({})}
              style={{
                width: "100%", marginTop: 6, padding: "3px", background: "#1a1f2e",
                border: "1px solid #21262d", borderRadius: 3, color: "#555",
                cursor: "pointer", fontSize: 8
              }}
            >Clear All</button>
          )}
        </div>
      )}

      {(showRenderPanel || showVolPanel || showPassPanel || showProbePanel) && ('''
if old_rp in s:
    s = s.replace(old_rp, new_pl, 1)
    print("6. Pose Library panel injected")
else:
    print("6. WARN: render panel anchor not found")

p.write_text(s)
after = len(s.splitlines())
print(f"Done. {before} -> {after} (+{after - before})")
