import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const C = { bg: "#06060f", bg2: "#0d0d1a", bg3: "#12121f", border: "#1e1e35", teal: "#00ffc8", orange: "#FF6600", white: "#e8e8f0", muted: "#4a4a6a", red: "#ff4444", yellow: "#ffcc00", font: "'JetBrains Mono', monospace" };

const FORMATIONS = [
  { id: "random", label: "Random", icon: "🌫️" },
  { id: "grid", label: "Grid", icon: "⬛" },
  { id: "concert", label: "Concert", icon: "🎵" },
  { id: "stadium", label: "Stadium", icon: "🏟️" },
  { id: "march", label: "March", icon: "🚶" },
  { id: "circle", label: "Circle", icon: "⭕" },
  { id: "street", label: "Street", icon: "🏙️" },
  { id: "protest", label: "Crowd", icon: "👥" },
];

const LOD_LEVELS = [
  { id: "high", label: "High (Full 3D)", verts: 80 },
  { id: "mid", label: "Mid (Simple)", verts: 12 },
  { id: "low", label: "Low (Billboard)", verts: 4 },
  { id: "auto", label: "Auto (Distance)", verts: -1 },
];

const SKIN_TONES = ["#f5cba7", "#e8a87c", "#d4855a", "#b5651d", "#7a4a1e", "#3d2314"];
const SHIRT_COLORS = [C.teal, C.orange, "#ff4444", "#4444ff", "#ffcc00", "#44ff88", "#ff88cc", "#ffffff", "#333333"];

const s = {
  root: { display: "flex", height: "100%", background: C.bg, fontFamily: C.font, color: C.white, overflow: "hidden" },
  sidebar: { width: 260, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  sectionLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.muted, padding: "12px 12px 6px" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 12px", gap: 6 },
  label: { fontSize: 10, color: C.muted, minWidth: 100 },
  slider: { flex: 1, accentColor: C.teal, cursor: "pointer" },
  val: { fontSize: 9, color: C.teal, width: 44, textAlign: "right" },
  divider: { height: 1, background: C.border, margin: "6px 0" },
  canvas: { flex: 1, display: "block", width: "100%", height: "100%" },
  toolbar: { display: "flex", gap: 6, padding: "7px 10px", background: C.bg2, borderBottom: `1px solid ${C.border}`, alignItems: "center", flexShrink: 0, flexWrap: "wrap" },
  statusBar: { display: "flex", gap: 12, padding: "6px 12px", background: C.bg2, borderTop: `1px solid ${C.border}`, fontSize: 9, color: C.muted, flexShrink: 0 },
  btn: (v) => ({ background: v === "primary" ? C.teal : v === "orange" ? C.orange : v === "danger" ? C.red : C.bg3, color: v === "primary" || v === "orange" ? C.bg : C.white, border: `1px solid ${v === "primary" ? C.teal : v === "orange" ? C.orange : v === "danger" ? C.red : C.border}`, borderRadius: 3, fontFamily: C.font, fontSize: 9, fontWeight: 700, padding: "6px 10px", cursor: "pointer" }),
  btnRow: { display: "flex", gap: 5, padding: "6px 12px", flexWrap: "wrap" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "0 10px 10px" },
  formBtn: (a) => ({ background: a ? `${C.teal}15` : C.bg3, border: `1px solid ${a ? C.teal : C.border}`, borderRadius: 4, padding: "7px 4px", cursor: "pointer", textAlign: "center", fontFamily: C.font, fontSize: 9, color: a ? C.teal : C.white }),
  lodBtn: (a) => ({ background: a ? `${C.orange}15` : C.bg3, border: `1px solid ${a ? C.orange : C.border}`, borderRadius: 3, padding: "5px 8px", cursor: "pointer", fontFamily: C.font, fontSize: 9, color: a ? C.orange : C.white, flex: 1 }),
  toggle: (on) => ({ width: 32, height: 16, borderRadius: 8, background: on ? C.teal : C.bg3, border: `1px solid ${on ? C.teal : C.border}`, cursor: "pointer", position: "relative", flexShrink: 0 }),
  toggleDot: (on) => ({ position: "absolute", top: 2, left: on ? 16 : 2, width: 10, height: 10, borderRadius: "50%", background: on ? C.bg : C.muted, transition: "left 0.2s" }),
  tag: (c) => ({ display: "inline-block", fontSize: 8, padding: "2px 6px", borderRadius: 2, background: `${c}20`, color: c, border: `1px solid ${c}40` }),
};

function Toggle({ value, onChange }) {
  return <div style={s.toggle(value)} onClick={() => onChange(!value)}><div style={s.toggleDot(value)} /></div>;
}

function SliderRow({ label, value, min, max, step = 1, onChange, unit = "" }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} style={s.slider} />
      <span style={s.val}>{value}{unit}</span>
    </div>
  );
}

// Build one person (LOD aware)
function buildPerson(lod, skinTone, shirtColor, height) {
  const g = new THREE.Group();
  const h = height || (1.5 + Math.random() * 0.4);

  if (lod === "low") {
    // Billboard quad
    const mat = new THREE.MeshBasicMaterial({ color: shirtColor, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, h), mat);
    mesh.position.y = h / 2;
    g.add(mesh);
    return g;
  }

  if (lod === "mid") {
    // Capsule body
    const bodyMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, h * 0.55, 6), bodyMat);
    body.position.y = h * 0.4;
    g.add(body);
    const headMat = new THREE.MeshLambertMaterial({ color: skinTone });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 5), headMat);
    head.position.y = h * 0.72;
    g.add(head);
    return g;
  }

  // High quality
  const bodyMat = new THREE.MeshLambertMaterial({ color: shirtColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: "#1a1a3a" });
  const skinMat = new THREE.MeshLambertMaterial({ color: skinTone });
  const hairColors = ["#1a0a00", "#3a2a10", "#5a3a1a", "#cc9944", "#ff3300", "#888888", "#111111"];
  const hairMat = new THREE.MeshLambertMaterial({ color: hairColors[Math.floor(Math.random() * hairColors.length)] });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, h * 0.3, 0.2), bodyMat);
  torso.position.y = h * 0.45;
  g.add(torso);

  // Hips
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.28, h * 0.18, 0.18), pantsMat);
  hips.position.y = h * 0.28;
  g.add(hips);

  // Legs
  [[-0.1, 0], [0.1, 0]].forEach(([x]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, h * 0.3, 0.12), pantsMat);
    leg.position.set(x, h * 0.12, 0);
    g.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.18), new THREE.MeshLambertMaterial({ color: "#111111" }));
    shoe.position.set(x, 0.03, 0.03);
    g.add(shoe);
  });

  // Arms (animated pose variation)
  const armAngle = (Math.random() - 0.5) * 0.6;
  [[-0.22, 0], [0.22, 0]].forEach(([x], i) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, h * 0.25, 0.1), skinMat);
    arm.position.set(x, h * 0.4, 0);
    arm.rotation.z = (i === 0 ? 1 : -1) * armAngle;
    g.add(arm);
  });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), skinMat);
  head.position.y = h * 0.75;
  g.add(head);

  // Hair
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.y = h * 0.77;
  g.add(hair);

  return g;
}

function generateCrowd(formation, count, spread, lod, animate, threeScene) {
  const positions = [];

  if (formation === "random") {
    for (let i = 0; i < count; i++) positions.push([( Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * spread]);
  } else if (formation === "grid") {
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const spacingX = spread / cols, spacingZ = spread / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (positions.length >= count) break;
      positions.push([(c - cols / 2) * spacingX + (Math.random() - 0.5) * 0.3, 0, (r - rows / 2) * spacingZ + (Math.random() - 0.5) * 0.3]);
    }
  } else if (formation === "concert") {
    // Dense front, scattered back
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const z = -spread / 2 + t * spread;
      const xRange = spread * (0.3 + t * 0.7);
      positions.push([(Math.random() - 0.5) * xRange, 0, z]);
    }
  } else if (formation === "stadium") {
    // Oval ring
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = spread / 2 * (0.7 + Math.random() * 0.3);
      positions.push([Math.cos(angle) * r * 1.5, Math.random() * 3, Math.sin(angle) * r]);
    }
  } else if (formation === "circle") {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = spread / 2 * (0.8 + Math.random() * 0.4);
      positions.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
    }
  } else if (formation === "march") {
    const cols = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
      positions.push([(i % cols - cols / 2) * 0.8, 0, -Math.floor(i / cols) * 1.2]);
    }
  } else if (formation === "street") {
    // Two streams going opposite directions
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? 1.5 : -1.5;
      positions.push([side + (Math.random() - 0.5) * 0.8, 0, (i / 2 - count / 4) * 1.0]);
    }
  } else if (formation === "protest") {
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * (spread / 2);
      const angle = Math.random() * Math.PI * 2;
      positions.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
    }
  }

  // Instanced mesh for performance when count > 50
  if (count > 50 && lod !== "high") {
    const geo = lod === "low" ? new THREE.PlaneGeometry(0.5, 1.7) : new THREE.CylinderGeometry(0.18, 0.18, 1.2, 6);
    const colors = SHIRT_COLORS;
    const mat = new THREE.MeshLambertMaterial({ color: "#aaaaaa" });
    const instancedMesh = new THREE.InstancedMesh(geo, mat, positions.length);
    instancedMesh.userData.crowdObject = true;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    positions.forEach((pos, i) => {
      dummy.position.set(...pos);
      dummy.position.y += lod === "low" ? 0.85 : 0.6;
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.scale.setScalar(0.9 + Math.random() * 0.2);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
      color.set(colors[Math.floor(Math.random() * colors.length)]);
      instancedMesh.setColorAt(i, color);
    });
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    threeScene.add(instancedMesh);
    return [instancedMesh];
  }

  // Individual meshes for small crowds / high LOD
  return positions.map(pos => {
    const skin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
    const shirt = SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)];
    const person = buildPerson(lod, skin, shirt, 1.5 + Math.random() * 0.3);
    person.position.set(...pos);
    person.rotation.y = Math.random() * Math.PI * 2;
    person.scale.setScalar(0.85 + Math.random() * 0.3);
    person.userData.crowdObject = true;
    person.userData.animOffset = Math.random() * Math.PI * 2;
    threeScene.add(person);
    return person;
  });
}

export default function ProceduralCrowdGenerator({ scene }) {
  const canvasRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const sceneRef = useRef();
  const animRef = useRef();
  const crowdRef = useRef([]);

  const [formation, setFormation] = useState("concert");
  const [crowdCount, setCrowdCount] = useState(80);
  const [spread, setSpread] = useState(20);
  const [lod, setLod] = useState("mid");
  const [animatecrowd, setAnimateCrowd] = useState(true);
  const [showGround, setShowGround] = useState(true);
  const [showVenue, setShowVenue] = useState(true);
  const [stats, setStats] = useState({ npcs: 0, tris: 0, fps: 0 });
  const [generating, setGenerating] = useState(false);
  const animRef2 = useRef(true);
  useEffect(() => { animRef2.current = animatecrowd; }, [animatecrowd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color("#080810");
    threeScene.fog = new THREE.FogExp2("#080810", 0.012);
    sceneRef.current = threeScene;

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    threeScene.add(new THREE.AmbientLight("#667799", 0.6));
    const sun = new THREE.DirectionalLight("#ffffff", 1.2);
    sun.position.set(10, 25, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
    threeScene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ color: "#1a1a2a" }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = "ground";
    threeScene.add(ground);
    threeScene.add(new THREE.GridHelper(60, 40, "#1a1a2a", "#1a1a2a"));

    let isDragging = false, lastX = 0, lastY = 0, theta = 0.3, phi = 0.4, radius = 22;
    const down = e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
    const up = () => { isDragging = false; };
    const move = e => {
      if (!isDragging) return;
      theta -= (e.clientX - lastX) * 0.01;
      phi = Math.max(0.05, Math.min(1.4, phi - (e.clientY - lastY) * 0.01));
      lastX = e.clientX; lastY = e.clientY;
      camera.position.set(radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(phi), radius * Math.cos(theta) * Math.cos(phi));
      camera.lookAt(0, 1, 0);
    };
    const wheel = e => {
      radius = Math.max(5, Math.min(100, radius + e.deltaY * 0.05));
      camera.position.set(radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(phi), radius * Math.cos(theta) * Math.cos(phi));
      camera.lookAt(0, 1, 0);
    };
    canvas.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", move);
    canvas.addEventListener("wheel", wheel, { passive: true });

    let t = 0;
    let lastTime = performance.now(), frameCount = 0, fpsTimer = 0;
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      t += dt;
      frameCount++;
      fpsTimer += dt;
      if (fpsTimer > 0.5) {
        let tris = 0;
        threeScene.traverse(o => { if (o.isMesh && o.geometry) tris += (o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes?.position?.count / 3 || 0); });
        setStats(prev => ({ ...prev, fps: Math.round(frameCount / fpsTimer), tris: Math.round(tris) }));
        frameCount = 0; fpsTimer = 0;
      }

      // Animate crowd
      if (animRef2.current) {
        crowdRef.current.forEach(obj => {
          if (!obj.userData.crowdObject) return;
          if (obj.children && obj.children.length > 2) {
            // Bob and sway
            const offset = obj.userData.animOffset || 0;
            obj.position.y = obj.userData.baseY !== undefined ? obj.userData.baseY : 0;
            obj.position.y += Math.sin(t * 1.8 + offset) * 0.04;
            obj.rotation.y += Math.sin(t * 0.5 + offset) * 0.003;
          }
        });
      }

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
      canvas.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mousemove", move);
      canvas.removeEventListener("wheel", wheel);
      renderer.dispose();
    };
  }, []);

  const buildCrowd = useCallback(() => {
    const threeScene = sceneRef.current;
    if (!threeScene || generating) return;
    setGenerating(true);
    // Remove old crowd
    const toRemove = [];
    threeScene.traverse(o => { if (o.userData.crowdObject) toRemove.push(o); });
    toRemove.forEach(o => threeScene.remove(o));
    crowdRef.current = [];

    setTimeout(() => {
      const crowd = generateCrowd(formation, crowdCount, spread, lod, animatecrowd, threeScene);
      crowdRef.current = crowd;
      crowd.forEach(obj => { obj.userData.baseY = obj.position.y; });
      setStats(prev => ({ ...prev, npcs: crowdCount }));
      setGenerating(false);
    }, 20);
  }, [formation, crowdCount, spread, lod, animatecrowd, generating]);

  const clearCrowd = () => {
    const threeScene = sceneRef.current;
    if (!threeScene) return;
    const toRemove = [];
    threeScene.traverse(o => { if (o.userData.crowdObject) toRemove.push(o); });
    toRemove.forEach(o => threeScene.remove(o));
    crowdRef.current = [];
    setStats(prev => ({ ...prev, npcs: 0, tris: 0 }));
  };

  const exportCrowd = () => {
    const data = {
      formation, count: crowdCount, spread, lod,
      npcs: crowdRef.current.slice(0, 200).map(o => ({ pos: o.position.toArray(), rot: [0, o.rotation.y, 0], scale: o.scale.x }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `crowd_${formation}.json`; a.click();
  };

  return (
    <div style={s.root}>
      <div style={s.sidebar}>
        <div style={s.sectionLabel}>Formation</div>
        <div style={s.formGrid}>
          {FORMATIONS.map(f => (
            <button key={f.id} style={s.formBtn(formation === f.id)} onClick={() => setFormation(f.id)}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{f.icon}</div>
              {f.label}
            </button>
          ))}
        </div>

        <div style={s.divider} />
        <div style={s.sectionLabel}>Crowd Size</div>
        <SliderRow label="NPC Count" value={crowdCount} min={5} max={500} step={5} onChange={setCrowdCount} />
        <SliderRow label="Spread Area" value={spread} min={5} max={60} step={1} onChange={setSpread} unit="m" />

        <div style={s.divider} />
        <div style={s.sectionLabel}>LOD Level</div>
        <div style={{ display: "flex", gap: 4, padding: "0 10px 10px", flexWrap: "wrap" }}>
          {LOD_LEVELS.map(l => (
            <button key={l.id} style={s.lodBtn(lod === l.id)} onClick={() => setLod(l.id)}>{l.label}</button>
          ))}
        </div>
        {lod === "high" && <div style={{ padding: "0 12px 8px", fontSize: 8, color: C.orange }}>⚠ HIGH LOD: Keep count low (&lt;50) for performance</div>}

        <div style={s.divider} />
        <div style={s.sectionLabel}>Behavior</div>
        <div style={s.row}><span style={s.label}>Animate Crowd</span><Toggle value={animatecrowd} onChange={setAnimateCrowd} /></div>

        <div style={s.divider} />
        <div style={s.btnRow}>
          <button style={s.btn("primary")} onClick={buildCrowd} disabled={generating}>{generating ? "⏳ GENERATING..." : "👥 GENERATE"}</button>
        </div>
        <div style={s.btnRow}>
          <button style={s.btn("orange")} onClick={exportCrowd}>💾 EXPORT</button>
          <button style={s.btn("danger")} onClick={clearCrowd}>🗑️ CLEAR</button>
        </div>

        <div style={s.divider} />
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: 10 }}>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>STATS</div>
            {[["NPCs", stats.npcs, C.teal], ["Triangles", stats.tris?.toLocaleString(), C.white], ["FPS", stats.fps, stats.fps > 30 ? C.teal : C.orange]].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                <span style={{ color: C.muted }}>{l}</span>
                <span style={{ color: c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.main}>
        <div style={s.toolbar}>
          <span style={{ fontSize: 10, color: C.muted }}>CROWD GENERATOR — {FORMATIONS.find(f => f.id === formation)?.label.toUpperCase()}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <span style={s.tag(C.teal)}>NPCs: {stats.npcs}</span>
            <span style={s.tag(C.orange)}>LOD: {lod.toUpperCase()}</span>
            <span style={s.tag(stats.fps > 30 ? C.teal : C.red)}>{stats.fps} FPS</span>
          </div>
        </div>
        <canvas ref={canvasRef} style={s.canvas} />
        <div style={s.statusBar}>
          <span>NPC COUNT: {stats.npcs}</span>
          <span>TRIANGLES: {stats.tris?.toLocaleString()}</span>
          <span>FPS: {stats.fps}</span>
          <span style={{ marginLeft: "auto", color: C.teal }}>FORMATION: {formation.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
