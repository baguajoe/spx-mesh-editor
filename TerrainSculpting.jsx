import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const C = { bg: "#06060f", bg2: "#0d0d1a", bg3: "#12121f", border: "#1e1e35", teal: "#00ffc8", orange: "#FF6600", white: "#e8e8f0", muted: "#4a4a6a", red: "#ff4444", yellow: "#ffcc00", green: "#44bb77", font: "'JetBrains Mono', monospace" };

const TOOLS = [
  { id: "raise", label: "Raise", icon: "⬆", desc: "Lift terrain up", color: C.teal },
  { id: "lower", label: "Lower", icon: "⬇", desc: "Push terrain down", color: C.orange },
  { id: "flatten", label: "Flatten", icon: "━", desc: "Level to average height", color: C.yellow },
  { id: "smooth", label: "Smooth", icon: "~", desc: "Blur height variation", color: "#4488ff" },
  { id: "paint", label: "Paint", icon: "🎨", desc: "Paint vertex colors", color: C.green },
  { id: "noise", label: "Noise", icon: "⸪", desc: "Add fractal noise", color: "#aa44ff" },
  { id: "plateau", label: "Plateau", icon: "▬", desc: "Create flat plateau", color: "#888888" },
  { id: "valley", label: "Valley", icon: "⌣", desc: "Carve a valley", color: "#553311" },
];

const BIOMES = [
  { id: "highlands", label: "Highlands", colors: ["#2a5a1a", "#4a7a2a", "#8b8b6b", "#ccccaa", "#ffffff"] },
  { id: "desert", label: "Desert", colors: ["#c2955a", "#d4a86a", "#e8c080", "#f0d890", "#ffffff"] },
  { id: "volcanic", label: "Volcanic", colors: ["#1a0a00", "#3a1a00", "#881800", "#cc3300", "#ff6600"] },
  { id: "arctic", label: "Arctic", colors: ["#aabbcc", "#bbccdd", "#ccddee", "#ddeeff", "#ffffff"] },
  { id: "jungle", label: "Jungle", colors: ["#0a2a00", "#1a4a00", "#2a6a00", "#3a8a00", "#4aaa00"] },
];

const s = {
  root: { display: "flex", height: "100%", background: C.bg, fontFamily: C.font, color: C.white, overflow: "hidden" },
  toolStrip: { width: 54, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0", gap: 3, flexShrink: 0 },
  toolBtn: (a, color) => ({ width: 42, height: 42, background: a ? `${color}25` : "none", border: `1px solid ${a ? color : "transparent"}`, borderRadius: 6, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all 0.15s", color: a ? color : C.muted }),
  toolIcon: { fontSize: 16 },
  toolLabel: { fontSize: 7, letterSpacing: 0.3 },
  sidebar: { width: 230, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  sectionLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.muted, padding: "12px 12px 6px" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 12px", gap: 6 },
  label: { fontSize: 10, color: C.muted, minWidth: 80 },
  slider: { flex: 1, accentColor: C.teal, cursor: "pointer" },
  val: { fontSize: 9, color: C.teal, width: 40, textAlign: "right" },
  divider: { height: 1, background: C.border, margin: "6px 0" },
  canvas: { flex: 1, display: "block", width: "100%", height: "100%" },
  toolbar: { display: "flex", gap: 6, padding: "7px 10px", background: C.bg2, borderBottom: `1px solid ${C.border}`, alignItems: "center", flexShrink: 0, flexWrap: "wrap" },
  statusBar: { display: "flex", gap: 12, padding: "6px 12px", background: C.bg2, borderTop: `1px solid ${C.border}`, fontSize: 9, color: C.muted, flexShrink: 0 },
  btn: (v) => ({ background: v === "primary" ? C.teal : v === "orange" ? C.orange : v === "danger" ? C.red : C.bg3, color: v === "primary" || v === "orange" ? C.bg : C.white, border: `1px solid ${v === "primary" ? C.teal : v === "orange" ? C.orange : v === "danger" ? C.red : C.border}`, borderRadius: 3, fontFamily: C.font, fontSize: 9, fontWeight: 700, padding: "5px 10px", cursor: "pointer" }),
  btnRow: { display: "flex", gap: 4, padding: "6px 12px", flexWrap: "wrap" },
  biomeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "0 10px 10px" },
  biomeBtn: (a) => ({ background: a ? `${C.teal}15` : C.bg3, border: `1px solid ${a ? C.teal : C.border}`, borderRadius: 3, padding: "6px 4px", cursor: "pointer", textAlign: "center", fontFamily: C.font, fontSize: 9, color: a ? C.teal : C.white }),
  toggle: (on) => ({ width: 32, height: 16, borderRadius: 8, background: on ? C.teal : C.bg3, border: `1px solid ${on ? C.teal : C.border}`, cursor: "pointer", position: "relative", flexShrink: 0 }),
  toggleDot: (on) => ({ position: "absolute", top: 2, left: on ? 16 : 2, width: 10, height: 10, borderRadius: "50%", background: on ? C.bg : C.muted, transition: "left 0.2s" }),
  tag: (c) => ({ display: "inline-block", fontSize: 8, padding: "2px 6px", borderRadius: 2, background: `${c}20`, color: c, border: `1px solid ${c}40` }),
  colorSwatch: (c) => ({ width: 20, height: 20, borderRadius: 3, background: c, border: `1px solid ${C.border}`, cursor: "pointer", flexShrink: 0 }),
};

function Toggle({ value, onChange }) {
  return <div style={s.toggle(value)} onClick={() => onChange(!value)}><div style={s.toggleDot(value)} /></div>;
}

function SliderRow({ label, value, min, max, step = 0.1, onChange, unit = "" }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} style={s.slider} />
      <span style={s.val}>{value}{unit}</span>
    </div>
  );
}

const TERRAIN_RES = 64;
const TERRAIN_SIZE = 20;

function createHeightmap(res) {
  const h = new Float32Array(res * res);
  return h;
}

function applyFractalNoise(hm, res, scale = 1, octaves = 4, seed = 0) {
  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      let val = 0, amp = 1, freq = 1, max = 0;
      for (let o = 0; o < octaves; o++) {
        const nx = (i / res) * freq * scale + seed;
        const nz = (j / res) * freq * scale + seed * 1.3;
        val += (Math.sin(nx * 3.7 + nz * 2.1) * Math.cos(nz * 4.3 - nx * 1.7) + Math.sin(nx * 1.1 * freq + nz * 2.3 * freq) * 0.5) * amp;
        max += amp;
        amp *= 0.5;
        freq *= 2;
      }
      hm[i * res + j] = Math.max(0, (val / max + 0.5) * 0.6);
    }
  }
}

function hmToGeometry(hm, res, size, maxH) {
  const geo = new THREE.PlaneGeometry(size, size, res - 1, res - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const row = Math.floor(i / res), col = i % res;
    pos.setY(i, hm[row * res + col] * maxH);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function getHeightAtPoint(hm, res, x, z, size) {
  const u = (x / size + 0.5) * (res - 1);
  const v = (z / size + 0.5) * (res - 1);
  const ui = Math.floor(Math.max(0, Math.min(res - 1, u)));
  const vi = Math.floor(Math.max(0, Math.min(res - 1, v)));
  return hm[vi * res + ui];
}

function sculptHM(hm, res, size, cx, cz, radius, strength, mode, maxH, paintColor, vertexColors) {
  const cr = Math.ceil(radius / size * res);
  const ci = Math.round((cx / size + 0.5) * (res - 1));
  const ck = Math.round((cz / size + 0.5) * (res - 1));

  const avgH = (() => {
    let sum = 0, cnt = 0;
    for (let di = -cr; di <= cr; di++) for (let dk = -cr; dk <= cr; dk++) {
      const ni = ci + di, nk = ck + dk;
      if (ni < 0 || ni >= res || nk < 0 || nk >= res) continue;
      const d = Math.sqrt(di * di + dk * dk);
      if (d > cr) continue;
      sum += hm[nk * res + ni]; cnt++;
    }
    return cnt > 0 ? sum / cnt : 0;
  })();

  for (let di = -cr; di <= cr; di++) {
    for (let dk = -cr; dk <= cr; dk++) {
      const ni = ci + di, nk = ck + dk;
      if (ni < 0 || ni >= res || nk < 0 || nk >= res) continue;
      const d = Math.sqrt(di * di + dk * dk);
      if (d > cr) continue;
      const falloff = Math.pow(1 - d / cr, 2);
      const idx = nk * res + ni;

      if (mode === "raise") hm[idx] = Math.min(1, hm[idx] + strength * 0.02 * falloff);
      else if (mode === "lower") hm[idx] = Math.max(0, hm[idx] - strength * 0.02 * falloff);
      else if (mode === "flatten") hm[idx] += (avgH - hm[idx]) * strength * 0.1 * falloff;
      else if (mode === "smooth") {
        let sum = 0, cnt2 = 0;
        for (let si = -1; si <= 1; si++) for (let sk = -1; sk <= 1; sk++) {
          const sni = ni + si, snk = nk + sk;
          if (sni >= 0 && sni < res && snk >= 0 && snk < res) { sum += hm[snk * res + sni]; cnt2++; }
        }
        hm[idx] += (sum / cnt2 - hm[idx]) * strength * 0.2 * falloff;
      } else if (mode === "noise") {
        hm[idx] = Math.max(0, Math.min(1, hm[idx] + (Math.random() - 0.5) * strength * 0.05 * falloff));
      } else if (mode === "plateau") {
        const target = Math.max(hm[idx], avgH + 0.1);
        hm[idx] += (target - hm[idx]) * strength * 0.15 * falloff;
      } else if (mode === "valley") {
        hm[idx] = Math.max(0, hm[idx] - strength * 0.03 * falloff * Math.pow(1 - d / (cr * 0.4), 2));
      } else if (mode === "paint" && vertexColors) {
        const pr = parseInt(paintColor.slice(1, 3), 16) / 255;
        const pg = parseInt(paintColor.slice(3, 5), 16) / 255;
        const pb = parseInt(paintColor.slice(5, 7), 16) / 255;
        vertexColors[idx * 3] += (pr - vertexColors[idx * 3]) * strength * 0.15 * falloff;
        vertexColors[idx * 3 + 1] += (pg - vertexColors[idx * 3 + 1]) * strength * 0.15 * falloff;
        vertexColors[idx * 3 + 2] += (pb - vertexColors[idx * 3 + 2]) * strength * 0.15 * falloff;
      }
    }
  }
}

export default function TerrainSculpting({ scene }) {
  const canvasRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const sceneRef = useRef();
  const animRef = useRef();
  const meshRef = useRef();
  const waterRef = useRef();
  const raycasterRef = useRef(new THREE.Raycaster());
  const hmRef = useRef(createHeightmap(TERRAIN_RES));
  const vcRef = useRef(new Float32Array(TERRAIN_RES * TERRAIN_RES * 3).fill(0.4));
  const isSculpting = useRef(false);

  const [tool, setTool] = useState("raise");
  const [brushRadius, setBrushRadius] = useState(3);
  const [brushStrength, setBrushStrength] = useState(0.5);
  const [maxHeight, setMaxHeight] = useState(6);
  const [biome, setBiome] = useState("highlands");
  const [showWater, setShowWater] = useState(true);
  const [waterLevel, setWaterLevel] = useState(0.15);
  const [showWire, setShowWire] = useState(false);
  const [wireRef2, setWireRef2] = useState(null);
  const [paintColor, setPaintColor] = useState(C.green);
  const [stats, setStats] = useState({ verts: TERRAIN_RES * TERRAIN_RES, tris: (TERRAIN_RES - 1) * (TERRAIN_RES - 1) * 2, maxH: 0 });
  const toolRef = useRef("raise");
  const brushRef = useRef({ radius: 3, strength: 0.5 });
  const maxHRef = useRef(6);
  const paintColorRef = useRef(C.green);
  const biomeRef = useRef("highlands");

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { brushRef.current.radius = brushRadius; }, [brushRadius]);
  useEffect(() => { brushRef.current.strength = brushStrength; }, [brushStrength]);
  useEffect(() => { maxHRef.current = maxHeight; }, [maxHeight]);
  useEffect(() => { paintColorRef.current = paintColor; }, [paintColor]);
  useEffect(() => { biomeRef.current = biome; }, [biome]);

  const updateTerrainMesh = useCallback(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const hm = hmRef.current;
    const maxH = maxHRef.current;
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const vc = vcRef.current;
    const bm = BIOMES.find(b => b.id === biomeRef.current) || BIOMES[0];

    for (let i = 0; i < TERRAIN_RES; i++) {
      for (let j = 0; j < TERRAIN_RES; j++) {
        const idx = i * TERRAIN_RES + j;
        const h = hm[idx];
        pos.setY(idx, h * maxH);

        // Auto-color based on height if not painting
        if (toolRef.current !== "paint") {
          const t = h;
          const ci = Math.min(4, Math.floor(t * 5));
          const ct = (t * 5) % 1;
          const c1 = new THREE.Color(bm.colors[ci]);
          const c2 = new THREE.Color(bm.colors[Math.min(4, ci + 1)]);
          const c = c1.lerp(c2, ct);
          vc[idx * 3] = c.r;
          vc[idx * 3 + 1] = c.g;
          vc[idx * 3 + 2] = c.b;
        }
      }
    }
    pos.needsUpdate = true;

    // Apply vertex colors
    if (!geo.attributes.color) {
      geo.setAttribute("color", new THREE.BufferAttribute(vc.slice(), 3));
    } else {
      const colorAttr = geo.attributes.color;
      for (let i = 0; i < colorAttr.count; i++) colorAttr.setXYZ(i, vc[i * 3], vc[i * 3 + 1], vc[i * 3 + 2]);
      colorAttr.needsUpdate = true;
    }

    geo.computeVertexNormals();

    // Water level
    if (waterRef.current) waterRef.current.position.y = maxH * waterLevel;
    let maxHVal = 0;
    hm.forEach(h => { if (h > maxHVal) maxHVal = h; });
    setStats({ verts: TERRAIN_RES * TERRAIN_RES, tris: (TERRAIN_RES - 1) * (TERRAIN_RES - 1) * 2, maxH: (maxHVal * maxH).toFixed(1) });
  }, [waterLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color("#0a0a14");
    threeScene.fog = new THREE.FogExp2("#0a0a14", 0.012);
    sceneRef.current = threeScene;

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
    camera.position.set(0, 12, 18);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    threeScene.add(new THREE.AmbientLight("#778899", 0.7));
    const sun = new THREE.DirectionalLight("#fff8e8", 1.5);
    sun.position.set(15, 25, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
    threeScene.add(sun);

    // Terrain mesh
    const hm = hmRef.current;
    applyFractalNoise(hm, TERRAIN_RES, 2, 4, Math.random() * 100);
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_RES - 1, TERRAIN_RES - 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "terrain";
    threeScene.add(mesh);
    meshRef.current = mesh;

    // Water
    const water = new THREE.Mesh(new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE), new THREE.MeshLambertMaterial({ color: "#1a55aa", transparent: true, opacity: 0.6 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.9;
    threeScene.add(water);
    waterRef.current = water;

    // Orbit
    let isDragging = false, isRight = false, lastX = 0, lastY = 0, theta = 0.3, phi = 0.5, radius = 22;
    const down = e => { isDragging = true; isRight = e.button === 2; lastX = e.clientX; lastY = e.clientY; if (e.button === 0) isSculpting.current = true; };
    const up = () => { isDragging = false; isSculpting.current = false; };
    const move = e => {
      if (!isDragging) return;
      if (isRight) {
        theta -= (e.clientX - lastX) * 0.01;
        phi = Math.max(0.05, Math.min(1.5, phi - (e.clientY - lastY) * 0.01));
        camera.position.set(radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(phi), radius * Math.cos(theta) * Math.cos(phi));
        camera.lookAt(0, 2, 0);
      } else if (isSculpting.current) {
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        raycasterRef.current.setFromCamera(mouse, camera);
        const hits = raycasterRef.current.intersectObject(mesh);
        if (hits.length) {
          const pt = hits[0].point;
          sculptHM(hmRef.current, TERRAIN_RES, TERRAIN_SIZE, pt.x, pt.z, brushRef.current.radius, brushRef.current.strength, toolRef.current, maxHRef.current, paintColorRef.current, vcRef.current);
          updateTerrainMesh();
        }
      }
      lastX = e.clientX; lastY = e.clientY;
    };
    const wheel = e => {
      radius = Math.max(5, Math.min(60, radius + e.deltaY * 0.05));
      camera.position.set(radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(phi), radius * Math.cos(theta) * Math.cos(phi));
      camera.lookAt(0, 2, 0);
    };
    canvas.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", move);
    canvas.addEventListener("wheel", wheel, { passive: true });
    canvas.addEventListener("contextmenu", e => e.preventDefault());

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

    updateTerrainMesh();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mousemove", move);
      canvas.removeEventListener("wheel", wheel);
      renderer.dispose();
    };
  }, [updateTerrainMesh]);

  useEffect(() => {
    if (waterRef.current) waterRef.current.position.y = maxHeight * waterLevel;
  }, [waterLevel, maxHeight]);

  useEffect(() => {
    if (waterRef.current) waterRef.current.visible = showWater;
  }, [showWater]);

  useEffect(() => { updateTerrainMesh(); }, [biome, updateTerrainMesh]);

  const resetTerrain = () => {
    hmRef.current = createHeightmap(TERRAIN_RES);
    vcRef.current = new Float32Array(TERRAIN_RES * TERRAIN_RES * 3).fill(0.4);
    applyFractalNoise(hmRef.current, TERRAIN_RES, 2, 4, Math.random() * 100);
    updateTerrainMesh();
  };

  const flattenAll = () => {
    hmRef.current.fill(0.1);
    updateTerrainMesh();
  };

  const addErosion = () => {
    const hm = hmRef.current;
    const res = TERRAIN_RES;
    for (let iter = 0; iter < 50; iter++) {
      const i = Math.floor(Math.random() * (res - 2)) + 1;
      const j = Math.floor(Math.random() * (res - 2)) + 1;
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      let minH = hm[i * res + j], minDi = 0, minDj = 0;
      dirs.forEach(([di, dj]) => { const h = hm[(i + di) * res + (j + dj)]; if (h < minH) { minH = h; minDi = di; minDj = dj; } });
      if (minDi !== 0 || minDj !== 0) {
        const erosion = (hm[i * res + j] - minH) * 0.3;
        hm[i * res + j] -= erosion;
        hm[(i + minDi) * res + (j + minDj)] += erosion * 0.8;
      }
    }
    updateTerrainMesh();
  };

  const exportTerrain = () => {
    const hm = hmRef.current;
    const data = { resolution: TERRAIN_RES, size: TERRAIN_SIZE, maxHeight, biome, heightmap: Array.from(hm) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `terrain_${biome}.json`; a.click();
  };

  const currentTool = TOOLS.find(t => t.id === tool);

  return (
    <div style={s.root}>
      {/* Tool strip */}
      <div style={s.toolStrip}>
        {TOOLS.map(t => (
          <button key={t.id} style={s.toolBtn(tool === t.id, t.color)} onClick={() => setTool(t.id)} title={t.desc}>
            <span style={s.toolIcon}>{t.icon}</span>
            <span style={s.toolLabel}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sectionLabel}>Tool — {currentTool?.label}</div>
        <div style={{ padding: "0 12px 6px", fontSize: 9, color: C.muted }}>{currentTool?.desc}</div>
        <SliderRow label="Brush Radius" value={brushRadius} min={0.5} max={8} step={0.5} onChange={setBrushRadius} unit="m" />
        <SliderRow label="Strength" value={brushStrength} min={0.1} max={2} step={0.05} onChange={setBrushStrength} />

        {tool === "paint" && (
          <div style={s.row}>
            <span style={s.label}>Paint Color</span>
            <div style={s.colorSwatch(paintColor)} onClick={() => { const inp = document.createElement("input"); inp.type = "color"; inp.value = paintColor; inp.onchange = e => setPaintColor(e.target.value); inp.click(); }} />
            <span style={{ fontSize: 9, color: C.muted }}>{paintColor}</span>
          </div>
        )}

        <div style={s.divider} />
        <div style={s.sectionLabel}>Terrain</div>
        <SliderRow label="Max Height" value={maxHeight} min={1} max={15} step={0.5} onChange={setMaxHeight} unit="m" />

        <div style={s.divider} />
        <div style={s.sectionLabel}>Biome</div>
        <div style={s.biomeGrid}>
          {BIOMES.map(b => (
            <button key={b.id} style={s.biomeBtn(biome === b.id)} onClick={() => { setBiome(b.id); biomeRef.current = b.id; updateTerrainMesh(); }}>
              <div style={{ display: "flex", gap: 2, justifyContent: "center", marginBottom: 3 }}>
                {b.colors.map((c, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 1, background: c }} />)}
              </div>
              {b.label}
            </button>
          ))}
        </div>

        <div style={s.divider} />
        <div style={s.sectionLabel}>Water</div>
        <div style={s.row}><span style={s.label}>Show Water</span><Toggle value={showWater} onChange={setShowWater} /></div>
        {showWater && <SliderRow label="Water Level" value={waterLevel} min={0} max={0.8} step={0.01} onChange={setWaterLevel} />}

        <div style={s.divider} />
        <div style={s.sectionLabel}>Operations</div>
        <div style={s.btnRow}>
          <button style={s.btn()} onClick={resetTerrain}>🌍 NEW</button>
          <button style={s.btn()} onClick={flattenAll}>━ FLAT</button>
          <button style={s.btn()} onClick={addErosion}>💧 ERODE</button>
        </div>

        <div style={s.divider} />
        <div style={s.btnRow}>
          <button style={s.btn("primary")} onClick={exportTerrain}>💾 EXPORT</button>
        </div>

        <div style={{ padding: "6px 12px 12px" }}>
          <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 5 }}>STATS</div>
            {[["Verts", stats.verts.toLocaleString()], ["Tris", stats.tris.toLocaleString()], ["Max Height", `${stats.maxH}m`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 2 }}>
                <span style={{ color: C.muted }}>{l}</span>
                <span style={{ color: C.teal }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Viewport */}
      <div style={s.main}>
        <div style={s.toolbar}>
          <span style={{ fontSize: 10, color: C.muted }}>TERRAIN SCULPTING</span>
          <span style={{ fontSize: 9, color: C.muted }}>LEFT DRAG: Sculpt | RIGHT DRAG: Orbit | SCROLL: Zoom</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <span style={s.tag(currentTool?.color || C.teal)}>TOOL: {currentTool?.label.toUpperCase()}</span>
            <span style={s.tag(C.orange)}>R: {brushRadius}m</span>
          </div>
        </div>
        <canvas ref={canvasRef} style={s.canvas} />
        <div style={s.statusBar}>
          <span>VERTS: {stats.verts.toLocaleString()}</span>
          <span>TRIS: {stats.tris.toLocaleString()}</span>
          <span>MAX H: {stats.maxH}m</span>
          <span style={{ marginLeft: "auto", color: C.teal }}>BIOME: {biome.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
