import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const PRESETS = {
  forest: {
    label: "Forest",
    icon: "🌲",
    skyTop: "#0a1a2e",
    skyBottom: "#1a3a1a",
    fogColor: "#2d5a27",
    fogDensity: 0.04,
    groundColor: "#2d4a1e",
    ambientColor: "#3a6b30",
    ambientIntensity: 0.6,
    sunColor: "#ffe4b5",
    sunIntensity: 1.2,
    sunElevation: 45,
    sunAzimuth: 135,
    assets: ["tree_pine", "tree_oak", "bush", "rock", "fern", "log"],
  },
  desert: {
    label: "Desert",
    icon: "🏜️",
    skyTop: "#87ceeb",
    skyBottom: "#f4a460",
    fogColor: "#d2b48c",
    fogDensity: 0.01,
    groundColor: "#c2955a",
    ambientColor: "#ffd700",
    ambientIntensity: 0.9,
    sunColor: "#fff8dc",
    sunIntensity: 2.0,
    sunElevation: 70,
    sunAzimuth: 180,
    assets: ["cactus", "rock_desert", "dune", "skull", "tumbleweed"],
  },
  studio: {
    label: "Studio",
    icon: "🎬",
    skyTop: "#1a1a1a",
    skyBottom: "#2a2a2a",
    fogColor: "#111111",
    fogDensity: 0.0,
    groundColor: "#222222",
    ambientColor: "#ffffff",
    ambientIntensity: 0.3,
    sunColor: "#ffffff",
    sunIntensity: 1.5,
    sunElevation: 60,
    sunAzimuth: 45,
    assets: ["light_stand", "camera_rig", "backdrop", "greenscreen", "monitor"],
  },
  stage: {
    label: "Stage",
    icon: "🎭",
    skyTop: "#0a0010",
    skyBottom: "#200030",
    fogColor: "#1a0025",
    fogDensity: 0.02,
    groundColor: "#1a1a2a",
    ambientColor: "#9900ff",
    ambientIntensity: 0.4,
    sunColor: "#ff00aa",
    sunIntensity: 1.8,
    sunElevation: 30,
    sunAzimuth: 90,
    assets: ["speaker_stack", "truss", "stage_light", "smoke_machine", "barrier"],
  },
  scifi: {
    label: "Sci-Fi",
    icon: "🚀",
    skyTop: "#000510",
    skyBottom: "#001530",
    fogColor: "#002050",
    fogDensity: 0.015,
    groundColor: "#0a0a1a",
    ambientColor: "#00aaff",
    ambientIntensity: 0.5,
    sunColor: "#00ffff",
    sunIntensity: 1.0,
    sunElevation: 20,
    sunAzimuth: 270,
    assets: ["panel_tech", "antenna", "reactor", "drone", "hologram_emitter"],
  },
  island: {
    label: "Island",
    icon: "🏝️",
    skyTop: "#1a6baf",
    skyBottom: "#87ceeb",
    fogColor: "#87ceeb",
    fogDensity: 0.005,
    groundColor: "#f5deb3",
    ambientColor: "#ffe680",
    ambientIntensity: 0.7,
    sunColor: "#fff5cc",
    sunIntensity: 1.6,
    sunElevation: 55,
    sunAzimuth: 160,
    assets: ["palm_tree", "rock_coastal", "seashell", "boat", "pier", "hut"],
  },
};

const C = {
  bg: "#06060f", bg2: "#0d0d1a", bg3: "#12121f",
  border: "#1e1e35", teal: "#00ffc8", orange: "#FF6600",
  white: "#e8e8f0", muted: "#4a4a6a", font: "'JetBrains Mono', monospace",
};

const s = {
  root: { display: "flex", height: "100%", background: C.bg, fontFamily: C.font, color: C.white, overflow: "hidden" },
  sidebar: { width: 260, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  sectionLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.muted, padding: "14px 14px 6px" },
  presetGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 10px 10px" },
  presetBtn: (active) => ({
    background: active ? `${C.teal}15` : C.bg3, border: `1px solid ${active ? C.teal : C.border}`,
    borderRadius: 4, padding: "10px 8px", cursor: "pointer", color: active ? C.teal : C.white,
    fontFamily: C.font, fontSize: 10, fontWeight: 600, textAlign: "center", transition: "all 0.15s",
  }),
  presetIcon: { fontSize: 22, display: "block", marginBottom: 4 },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", gap: 8 },
  label: { fontSize: 10, color: C.muted, flexShrink: 0, minWidth: 80 },
  slider: { flex: 1, accentColor: C.teal, cursor: "pointer" },
  colorSwatch: (color) => ({
    width: 28, height: 20, borderRadius: 3, background: color, border: `1px solid ${C.border}`,
    cursor: "pointer", flexShrink: 0,
  }),
  input: {
    flex: 1, background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 3,
    color: C.white, fontFamily: C.font, fontSize: 10, padding: "3px 8px",
  },
  divider: { height: 1, background: C.border, margin: "8px 0" },
  btn: (variant) => ({
    background: variant === "primary" ? C.teal : variant === "orange" ? C.orange : C.bg3,
    color: variant === "primary" || variant === "orange" ? C.bg : C.white,
    border: `1px solid ${variant === "primary" ? C.teal : variant === "orange" ? C.orange : C.border}`,
    borderRadius: 3, fontFamily: C.font, fontSize: 10, fontWeight: 700,
    padding: "6px 14px", cursor: "pointer", letterSpacing: 1, transition: "all 0.15s",
  }),
  btnRow: { display: "flex", gap: 6, padding: "10px 14px" },
  canvas: { flex: 1, display: "block", width: "100%", height: "100%" },
  toolbar: { display: "flex", gap: 8, padding: "8px 12px", background: C.bg2, borderBottom: `1px solid ${C.border}`, alignItems: "center" },
  toolbarLabel: { fontSize: 10, color: C.muted },
  assetGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, padding: "0 10px 10px" },
  assetCard: (placed) => ({
    background: placed ? `${C.teal}10` : C.bg3, border: `1px solid ${placed ? C.teal : C.border}`,
    borderRadius: 4, padding: "8px 6px", cursor: "pointer", textAlign: "center",
    fontSize: 9, color: placed ? C.teal : C.white, fontFamily: C.font,
    transition: "all 0.15s", userSelect: "none",
  }),
  tag: (color) => ({
    display: "inline-block", fontSize: 8, padding: "2px 6px", borderRadius: 2,
    background: `${color}20`, color, border: `1px solid ${color}40`, letterSpacing: 1,
  }),
  statusBar: { display: "flex", gap: 16, padding: "6px 12px", background: C.bg2, borderTop: `1px solid ${C.border}`, fontSize: 9, color: C.muted },
};

function ColorPicker({ value, onChange, label }) {
  const ref = useRef();
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <div style={s.colorSwatch(value)} onClick={() => ref.current.click()} />
      <input ref={ref} type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 0, height: 0, opacity: 0, position: "absolute" }} />
      <span style={{ fontSize: 9, color: C.muted, width: 56 }}>{value}</span>
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 0.01, onChange, unit = "" }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} style={s.slider} />
      <span style={{ fontSize: 9, color: C.teal, width: 40, textAlign: "right" }}>{value}{unit}</span>
    </div>
  );
}

export default function EnvironmentGenerator({ scene }) {
  const canvasRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const sceneRef = useRef();
  const animRef = useRef();
  const placedAssets = useRef([]);

  const [preset, setPreset] = useState("forest");
  const [env, setEnv] = useState({ ...PRESETS.forest });
  const [placed, setPlaced] = useState({});
  const [assetCount, setAssetCount] = useState({});
  const [stats, setStats] = useState({ objects: 0, triangles: 0, lights: 0 });
  const [generating, setGenerating] = useState(false);

  const setEnvKey = (key) => (val) => setEnv(prev => ({ ...prev, [key]: val }));

  // Init Three.js preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    const threeScene = new THREE.Scene();
    sceneRef.current = threeScene;

    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 32, 32),
      new THREE.MeshLambertMaterial({ color: PRESETS.forest.groundColor })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = "ground";
    threeScene.add(ground);

    // Ambient
    const ambient = new THREE.AmbientLight(PRESETS.forest.ambientColor, PRESETS.forest.ambientIntensity);
    ambient.name = "ambient";
    threeScene.add(ambient);

    // Sun
    const sun = new THREE.DirectionalLight(PRESETS.forest.sunColor, PRESETS.forest.sunIntensity);
    sun.name = "sun";
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    threeScene.add(sun);

    // Orbit controls (manual)
    let isDragging = false, lastX = 0, lastY = 0, theta = 0, phi = 0.3, radius = 20;
    const onMouseDown = (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      theta -= (e.clientX - lastX) * 0.01;
      phi = Math.max(0.05, Math.min(1.5, phi - (e.clientY - lastY) * 0.01));
      lastX = e.clientX; lastY = e.clientY;
      camera.position.set(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(phi),
        radius * Math.cos(theta) * Math.cos(phi)
      );
      camera.lookAt(0, 0, 0);
    };
    const onWheel = (e) => {
      radius = Math.max(3, Math.min(80, radius + e.deltaY * 0.05));
      camera.position.set(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(phi),
        radius * Math.cos(theta) * Math.cos(phi)
      );
      camera.lookAt(0, 0, 0);
    };
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel, { passive: true });

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (renderer.domElement.width !== w || renderer.domElement.height !== h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      renderer.render(threeScene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onWheel);
      renderer.dispose();
    };
  }, []);

  // Apply env settings to scene
  useEffect(() => {
    const threeScene = sceneRef.current;
    if (!threeScene) return;
    threeScene.background = new THREE.Color(env.skyBottom);
    threeScene.fog = new THREE.FogExp2(env.fogColor, env.fogDensity);
    const ground = threeScene.getObjectByName("ground");
    if (ground) ground.material.color.set(env.groundColor);
    const ambient = threeScene.getObjectByName("ambient");
    if (ambient) { ambient.color.set(env.ambientColor); ambient.intensity = env.ambientIntensity; }
    const sun = threeScene.getObjectByName("sun");
    if (sun) {
      const el = (env.sunElevation * Math.PI) / 180;
      const az = (env.sunAzimuth * Math.PI) / 180;
      sun.position.set(Math.cos(az) * Math.cos(el) * 30, Math.sin(el) * 30, Math.sin(az) * Math.cos(el) * 30);
      sun.color.set(env.sunColor);
      sun.intensity = env.sunIntensity;
    }
    // Count stats
    let tris = 0;
    threeScene.traverse(obj => { if (obj.isMesh && obj.geometry) tris += (obj.geometry.index ? obj.geometry.index.count / 3 : obj.geometry.attributes.position.count / 3); });
    setStats({ objects: threeScene.children.length, triangles: Math.round(tris), lights: 2 });
  }, [env]);

  const applyPreset = (key) => {
    setPreset(key);
    setEnv({ ...PRESETS[key] });
    // Clear placed assets from scene
    const threeScene = sceneRef.current;
    if (threeScene) {
      placedAssets.current.forEach(obj => threeScene.remove(obj));
      placedAssets.current = [];
    }
    setPlaced({});
    setAssetCount({});
  };

  const makeAssetMesh = (assetName) => {
    const geoms = {
      tree_pine: () => { const g = new THREE.Group(); g.add(Object.assign(new THREE.Mesh(new THREE.ConeGeometry(1.5, 4, 8), new THREE.MeshLambertMaterial({ color: "#1a6b1a" })), { position: new THREE.Vector3(0, 3, 0) })); g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6), new THREE.MeshLambertMaterial({ color: "#4a2800" })), { position: new THREE.Vector3(0, 0.75, 0) })); return g; },
      tree_oak: () => { const g = new THREE.Group(); g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(2, 8, 6), new THREE.MeshLambertMaterial({ color: "#2d7a2d" })), { position: new THREE.Vector3(0, 4, 0) })); g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 2.5, 6), new THREE.MeshLambertMaterial({ color: "#5a3300" })), { position: new THREE.Vector3(0, 1.25, 0) })); return g; },
      bush: () => new THREE.Mesh(new THREE.SphereGeometry(0.8, 7, 5), new THREE.MeshLambertMaterial({ color: "#1a5c1a" })),
      rock: () => new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), new THREE.MeshLambertMaterial({ color: "#666688" })),
      cactus: () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 3, 8), new THREE.MeshLambertMaterial({ color: "#2d6b2d" }))); return g; },
      rock_desert: () => new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), new THREE.MeshLambertMaterial({ color: "#8b7355" })),
      dune: () => new THREE.Mesh(new THREE.SphereGeometry(4, 12, 6), new THREE.MeshLambertMaterial({ color: "#c2955a" })),
      palm_tree: () => { const g = new THREE.Group(); g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 5, 8), new THREE.MeshLambertMaterial({ color: "#7a5530" })), {})); g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 5), new THREE.MeshLambertMaterial({ color: "#1a7a2a" })), { position: new THREE.Vector3(0, 4, 0) })); return g; },
      light_stand: () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4, 6), new THREE.MeshLambertMaterial({ color: "#555555" }))); g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#ffeecc", emissiveIntensity: 2 })), { position: new THREE.Vector3(0, 2.5, 0) })); return g; },
      speaker_stack: () => new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.0), new THREE.MeshLambertMaterial({ color: "#1a1a1a" })),
      panel_tech: () => new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 0.1), new THREE.MeshLambertMaterial({ color: "#0a1a2a", emissive: "#002244", emissiveIntensity: 0.5 })),
      antenna: () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 5, 6), new THREE.MeshLambertMaterial({ color: "#888888" }))); return g; },
    };
    const factory = geoms[assetName] || (() => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: C.teal })));
    const obj = factory();
    const castShadow = (o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } if (o.children) o.children.forEach(castShadow); };
    castShadow(obj);
    return obj;
  };

  const placeAsset = (assetName) => {
    const threeScene = sceneRef.current;
    if (!threeScene) return;
    const obj = makeAssetMesh(assetName);
    const spread = 12;
    obj.position.set((Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * spread);
    obj.rotation.y = Math.random() * Math.PI * 2;
    const sc = 0.8 + Math.random() * 0.6;
    obj.scale.setScalar(sc);
    obj.userData.assetName = assetName;
    threeScene.add(obj);
    placedAssets.current.push(obj);
    setAssetCount(prev => ({ ...prev, [assetName]: (prev[assetName] || 0) + 1 }));
  };

  const autoGenerate = async () => {
    setGenerating(true);
    const p = PRESETS[preset];
    const threeScene = sceneRef.current;
    if (!threeScene) { setGenerating(false); return; }
    placedAssets.current.forEach(obj => threeScene.remove(obj));
    placedAssets.current = [];
    setAssetCount({});
    for (let i = 0; i < p.assets.length; i++) {
      const assetName = p.assets[i];
      const count = preset === "forest" ? 6 : preset === "island" ? 4 : 3;
      for (let j = 0; j < count; j++) {
        await new Promise(r => setTimeout(r, 40));
        if (makeAssetMesh(assetName)) placeAsset(assetName);
      }
    }
    setGenerating(false);
  };

  const exportEnv = () => {
    const data = { preset, settings: env, assets: placedAssets.current.map(a => ({ name: a.userData.assetName, position: a.position.toArray(), rotation: [a.rotation.x, a.rotation.y, a.rotation.z], scale: a.scale.x })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `env_${preset}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const curPreset = PRESETS[preset];

  return (
    <div style={s.root}>
      {/* SIDEBAR */}
      <div style={s.sidebar}>
        <div style={s.sectionLabel}>Environment Preset</div>
        <div style={s.presetGrid}>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} style={s.presetBtn(preset === key)} onClick={() => applyPreset(key)}>
              <span style={s.presetIcon}>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        <div style={s.divider} />
        <div style={s.sectionLabel}>Sky &amp; Atmosphere</div>
        <ColorPicker label="Sky Color" value={env.skyBottom} onChange={setEnvKey("skyBottom")} />
        <ColorPicker label="Fog Color" value={env.fogColor} onChange={setEnvKey("fogColor")} />
        <SliderRow label="Fog Density" value={env.fogDensity} min={0} max={0.2} step={0.001} onChange={setEnvKey("fogDensity")} />

        <div style={s.divider} />
        <div style={s.sectionLabel}>Ground</div>
        <ColorPicker label="Ground Color" value={env.groundColor} onChange={setEnvKey("groundColor")} />

        <div style={s.divider} />
        <div style={s.sectionLabel}>Ambient Light</div>
        <ColorPicker label="Color" value={env.ambientColor} onChange={setEnvKey("ambientColor")} />
        <SliderRow label="Intensity" value={env.ambientIntensity} min={0} max={3} step={0.05} onChange={setEnvKey("ambientIntensity")} />

        <div style={s.divider} />
        <div style={s.sectionLabel}>Sun / Directional</div>
        <ColorPicker label="Sun Color" value={env.sunColor} onChange={setEnvKey("sunColor")} />
        <SliderRow label="Intensity" value={env.sunIntensity} min={0} max={5} step={0.1} onChange={setEnvKey("sunIntensity")} />
        <SliderRow label="Elevation" value={env.sunElevation} min={0} max={90} step={1} onChange={setEnvKey("sunElevation")} unit="°" />
        <SliderRow label="Azimuth" value={env.sunAzimuth} min={0} max={360} step={1} onChange={setEnvKey("sunAzimuth")} unit="°" />

        <div style={s.divider} />
        <div style={s.sectionLabel}>Assets — {curPreset.label}</div>
        <div style={s.assetGrid}>
          {curPreset.assets.map(a => (
            <div key={a} style={s.assetCard(assetCount[a] > 0)} onClick={() => placeAsset(a)} title={`Click to place ${a}`}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>📦</div>
              <div>{a.replace(/_/g, " ")}</div>
              {assetCount[a] > 0 && <div style={{ color: C.teal, fontSize: 8, marginTop: 2 }}>×{assetCount[a]}</div>}
            </div>
          ))}
        </div>

        <div style={s.divider} />
        <div style={s.btnRow}>
          <button style={s.btn("primary")} onClick={autoGenerate} disabled={generating}>
            {generating ? "⏳ GEN..." : "⚡ AUTO GEN"}
          </button>
          <button style={s.btn("orange")} onClick={exportEnv}>💾 EXPORT</button>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <div style={s.main}>
        <div style={s.toolbar}>
          <span style={s.toolbarLabel}>VIEWPORT — {curPreset.label.toUpperCase()} ENVIRONMENT</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span style={s.tag(C.teal)}>DRAG TO ORBIT</span>
            <span style={s.tag(C.orange)}>SCROLL TO ZOOM</span>
          </div>
        </div>
        <canvas ref={canvasRef} style={s.canvas} />
        <div style={s.statusBar}>
          <span>OBJECTS: {stats.objects}</span>
          <span>TRIANGLES: {stats.triangles.toLocaleString()}</span>
          <span>LIGHTS: {stats.lights}</span>
          <span style={{ marginLeft: "auto", color: C.teal }}>PRESET: {curPreset.label.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
