import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const C = {
  bg: "#06060f", bg2: "#0d0d1a", bg3: "#12121f",
  border: "#1e1e35", teal: "#00ffc8", orange: "#FF6600",
  white: "#e8e8f0", muted: "#4a4a6a", font: "'JetBrains Mono', monospace",
};

const CITY_STYLES = {
  downtown: { label: "Downtown", icon: "🏙️", buildingHeight: [8, 40], buildingDensity: 0.85, hasSkyscrapers: true, groundColor: "#1a1a1a", roadColor: "#222222", sidewalkColor: "#333333" },
  suburban: { label: "Suburban", icon: "🏘️", buildingHeight: [2, 6], buildingDensity: 0.4, hasSkyscrapers: false, groundColor: "#2a3a1a", roadColor: "#2a2a2a", sidewalkColor: "#3a3a3a" },
  industrial: { label: "Industrial", icon: "🏭", buildingHeight: [4, 14], buildingDensity: 0.6, hasSkyscrapers: false, groundColor: "#1a1a18", roadColor: "#1e1e1e", sidewalkColor: "#282828" },
  futuristic: { label: "Futuristic", icon: "🌆", buildingHeight: [10, 60], buildingDensity: 0.7, hasSkyscrapers: true, groundColor: "#060614", roadColor: "#0a0a1e", sidewalkColor: "#0f0f28" },
};

const MAT = {
  glass: new THREE.MeshLambertMaterial({ color: "#7ab8d4", transparent: true, opacity: 0.7 }),
  concrete: new THREE.MeshLambertMaterial({ color: "#888888" }),
  brick: new THREE.MeshLambertMaterial({ color: "#8b5e3c" }),
  metal: new THREE.MeshLambertMaterial({ color: "#555566" }),
  dark: new THREE.MeshLambertMaterial({ color: "#1a1a2a" }),
  road: new THREE.MeshLambertMaterial({ color: "#222222" }),
  sidewalk: new THREE.MeshLambertMaterial({ color: "#333333" }),
  window_lit: new THREE.MeshLambertMaterial({ color: "#ffeeaa", emissive: "#ffeeaa", emissiveIntensity: 0.8 }),
  ground: new THREE.MeshLambertMaterial({ color: "#1a1a1a" }),
};

const s = {
  root: { display: "flex", height: "100%", background: C.bg, fontFamily: C.font, color: C.white, overflow: "hidden" },
  sidebar: { width: 260, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  sectionLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.muted, padding: "14px 14px 6px" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 14px", gap: 8 },
  label: { fontSize: 10, color: C.muted, minWidth: 90 },
  slider: { flex: 1, accentColor: C.teal, cursor: "pointer" },
  val: { fontSize: 9, color: C.teal, width: 36, textAlign: "right" },
  divider: { height: 1, background: C.border, margin: "8px 0" },
  btn: (v) => ({
    background: v === "primary" ? C.teal : v === "orange" ? C.orange : C.bg3,
    color: v === "primary" || v === "orange" ? C.bg : C.white,
    border: `1px solid ${v === "primary" ? C.teal : v === "orange" ? C.orange : C.border}`,
    borderRadius: 3, fontFamily: C.font, fontSize: 10, fontWeight: 700,
    padding: "6px 14px", cursor: "pointer", letterSpacing: 1,
  }),
  btnRow: { display: "flex", gap: 6, padding: "10px 14px", flexWrap: "wrap" },
  canvas: { flex: 1, display: "block", width: "100%", height: "100%" },
  toolbar: { display: "flex", gap: 8, padding: "8px 12px", background: C.bg2, borderBottom: `1px solid ${C.border}`, alignItems: "center", flexShrink: 0 },
  tag: (c) => ({ display: "inline-block", fontSize: 8, padding: "2px 6px", borderRadius: 2, background: `${c}20`, color: c, border: `1px solid ${c}40`, letterSpacing: 1 }),
  statusBar: { display: "flex", gap: 16, padding: "6px 12px", background: C.bg2, borderTop: `1px solid ${C.border}`, fontSize: 9, color: C.muted, flexShrink: 0 },
  styleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 10px 10px" },
  styleBtn: (a) => ({ background: a ? `${C.teal}15` : C.bg3, border: `1px solid ${a ? C.teal : C.border}`, borderRadius: 4, padding: "8px 6px", cursor: "pointer", color: a ? C.teal : C.white, fontFamily: C.font, fontSize: 10, fontWeight: 600, textAlign: "center" }),
  toggle: (on) => ({ width: 32, height: 16, borderRadius: 8, background: on ? C.teal : C.bg3, border: `1px solid ${on ? C.teal : C.border}`, cursor: "pointer", position: "relative", flexShrink: 0, transition: "all 0.2s" }),
  toggleDot: (on) => ({ position: "absolute", top: 2, left: on ? 16 : 2, width: 10, height: 10, borderRadius: "50%", background: on ? C.bg : C.muted, transition: "left 0.2s" }),
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

function buildCity(threeScene, cfg) {
  // Remove old city objects
  const toRemove = [];
  threeScene.traverse(o => { if (o.userData.cityObject) toRemove.push(o); });
  toRemove.forEach(o => threeScene.remove(o));

  const style = CITY_STYLES[cfg.style];
  const gridW = cfg.blocksX, gridH = cfg.blocksZ;
  const blockSize = cfg.blockSize, roadWidth = cfg.roadWidth;
  const cellSize = blockSize + roadWidth;
  const totalW = gridW * cellSize, totalH = gridH * cellSize;
  const ox = -totalW / 2, oz = -totalH / 2;

  const mark = obj => { obj.userData.cityObject = true; return obj; };

  // Ground plane
  const groundMat = new THREE.MeshLambertMaterial({ color: style.groundColor });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(totalW + roadWidth, totalH + roadWidth), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  threeScene.add(mark(ground));

  const roadMat = new THREE.MeshLambertMaterial({ color: style.roadColor });
  const sidewalkMat = new THREE.MeshLambertMaterial({ color: style.sidewalkColor });

  // Roads — horizontal
  for (let z = 0; z <= gridH; z++) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(totalW + roadWidth, roadWidth), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(ox + totalW / 2, 0.01, oz + z * cellSize);
    threeScene.add(mark(road));
    // Sidewalks
    [-1, 1].forEach(side => {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(totalW + roadWidth, 0.8), sidewalkMat);
      sw.rotation.x = -Math.PI / 2;
      sw.position.set(ox + totalW / 2, 0.02, oz + z * cellSize + side * (roadWidth / 2 + 0.4));
      threeScene.add(mark(sw));
    });
  }

  // Roads — vertical
  for (let x = 0; x <= gridW; x++) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, totalH + roadWidth), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(ox + x * cellSize, 0.01, oz + totalH / 2);
    threeScene.add(mark(road));
    [-1, 1].forEach(side => {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.8, totalH + roadWidth), sidewalkMat);
      sw.rotation.x = -Math.PI / 2;
      sw.position.set(ox + x * cellSize + side * (roadWidth / 2 + 0.4), 0.02, oz + totalH / 2);
      threeScene.add(mark(sw));
    });
  }

  const MATS = [
    new THREE.MeshLambertMaterial({ color: "#8a8a9a" }),
    new THREE.MeshLambertMaterial({ color: "#6a6a7a" }),
    new THREE.MeshLambertMaterial({ color: "#9a9aaa" }),
    new THREE.MeshLambertMaterial({ color: "#7a8a9a" }),
    new THREE.MeshLambertMaterial({ color: style.groundColor === "#060614" ? "#0a0a2a" : "#5a6a7a" }),
  ];

  // Buildings in each block
  for (let bx = 0; bx < gridW; bx++) {
    for (let bz = 0; bz < gridH; bz++) {
      const cx = ox + bx * cellSize + roadWidth / 2 + blockSize / 2;
      const cz = oz + bz * cellSize + roadWidth / 2 + blockSize / 2;

      // How many buildings per block
      const buildCount = cfg.buildingsPerBlock;
      const padding = 0.5;
      const usable = blockSize - padding * 2;

      for (let i = 0; i < buildCount; i++) {
        if (Math.random() > style.buildingDensity) continue;
        const [minH, maxH] = style.buildingHeight;
        let h = minH + Math.random() * (maxH - minH);
        // Downtown: some skyscrapers
        if (style.hasSkyscrapers && Math.random() < 0.15) h *= 2.5;

        const bw = (usable / Math.ceil(Math.sqrt(buildCount))) * (0.6 + Math.random() * 0.3);
        const bd = bw * (0.8 + Math.random() * 0.4);
        const px = cx + (Math.random() - 0.5) * (usable - bw);
        const pz = cz + (Math.random() - 0.5) * (usable - bd);

        const mat = MATS[Math.floor(Math.random() * MATS.length)];
        const building = new THREE.Mesh(new THREE.BoxGeometry(bw, h, bd), mat);
        building.position.set(px, h / 2, pz);
        building.castShadow = true;
        building.receiveShadow = true;
        threeScene.add(mark(building));

        // Windows
        if (cfg.showWindows && h > 3) {
          const floors = Math.floor(h / 2);
          const wRows = Math.max(2, Math.floor(bw / 1.2));
          const winMat = Math.random() > 0.3
            ? new THREE.MeshLambertMaterial({ color: "#ffeeaa", emissive: "#ffcc44", emissiveIntensity: 0.6, transparent: true, opacity: 0.9 })
            : new THREE.MeshLambertMaterial({ color: "#7ab8d4", transparent: true, opacity: 0.7 });
          for (let f = 0; f < floors; f++) {
            for (let w = 0; w < wRows; w++) {
              if (Math.random() < 0.7) {
                const win = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), winMat);
                win.position.set(px - bw / 2 - 0.01, 1 + f * 2, pz - bd / 2 + 0.5 + w * (bd / wRows));
                win.rotation.y = Math.PI / 2;
                threeScene.add(mark(win));
              }
            }
          }
        }

        // Roof details
        if (cfg.showRoofDetails && h > 5 && Math.random() > 0.5) {
          const roofDetail = new THREE.Mesh(
            new THREE.BoxGeometry(bw * 0.3, 1.5, bd * 0.3),
            new THREE.MeshLambertMaterial({ color: "#555566" })
          );
          roofDetail.position.set(px, h + 0.75, pz);
          threeScene.add(mark(roofDetail));
        }
      }

      // Street lights at corners
      if (cfg.showStreetLights) {
        const corners = [
          [cx - blockSize / 2, cz - blockSize / 2],
          [cx + blockSize / 2, cz - blockSize / 2],
          [cx - blockSize / 2, cz + blockSize / 2],
          [cx + blockSize / 2, cz + blockSize / 2],
        ];
        corners.forEach(([lx, lz]) => {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 4, 5), new THREE.MeshLambertMaterial({ color: "#444444" }));
          pole.position.set(lx, 2, lz);
          threeScene.add(mark(pole));
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 5), new THREE.MeshLambertMaterial({ color: "#ffeecc", emissive: "#ffeecc", emissiveIntensity: 2 }));
          bulb.position.set(lx, 4.2, lz);
          threeScene.add(mark(bulb));
          if (cfg.showLightGlow) {
            const light = new THREE.PointLight("#ffeecc", 0.5, 6);
            light.position.set(lx, 4, lz);
            threeScene.add(mark(light));
          }
        });
      }
    }
  }
}

export default function CityGenerator({ scene }) {
  const canvasRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const sceneRef = useRef();
  const animRef = useRef();

  const [style, setStyle] = useState("downtown");
  const [blocksX, setBlocksX] = useState(4);
  const [blocksZ, setBlocksZ] = useState(4);
  const [blockSize, setBlockSize] = useState(12);
  const [roadWidth, setRoadWidth] = useState(4);
  const [buildingsPerBlock, setBuildingsPerBlock] = useState(4);
  const [showWindows, setShowWindows] = useState(true);
  const [showStreetLights, setShowStreetLights] = useState(true);
  const [showRoofDetails, setShowRoofDetails] = useState(true);
  const [showLightGlow, setShowLightGlow] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [stats, setStats] = useState({ buildings: 0, blocks: 0, tris: 0 });
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color("#0a0a1a");
    threeScene.fog = new THREE.FogExp2("#0a0a1a", 0.008);
    sceneRef.current = threeScene;

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
    camera.position.set(0, 30, 60);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const ambient = new THREE.AmbientLight("#6688aa", 0.5);
    ambient.name = "ambient";
    threeScene.add(ambient);
    const sun = new THREE.DirectionalLight("#fff8f0", 1.5);
    sun.name = "sun";
    sun.position.set(30, 60, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    threeScene.add(sun);

    let isDragging = false, lastX = 0, lastY = 0, theta = 0.3, phi = 0.5, radius = 70;
    const down = e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
    const up = () => { isDragging = false; };
    const move = e => {
      if (!isDragging) return;
      theta -= (e.clientX - lastX) * 0.01;
      phi = Math.max(0.1, Math.min(1.4, phi - (e.clientY - lastY) * 0.01));
      lastX = e.clientX; lastY = e.clientY;
      camera.position.set(radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(phi), radius * Math.cos(theta) * Math.cos(phi));
      camera.lookAt(0, 0, 0);
    };
    const wheel = e => {
      radius = Math.max(10, Math.min(300, radius + e.deltaY * 0.1));
      camera.position.set(radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(phi), radius * Math.cos(theta) * Math.cos(phi));
      camera.lookAt(0, 0, 0);
    };
    canvas.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", move);
    canvas.addEventListener("wheel", wheel, { passive: true });

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
      canvas.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mousemove", move);
      canvas.removeEventListener("wheel", wheel);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const threeScene = sceneRef.current;
    if (!threeScene) return;
    const ambient = threeScene.getObjectByName("ambient");
    const sun = threeScene.getObjectByName("sun");
    if (nightMode) {
      threeScene.background = new THREE.Color("#010106");
      threeScene.fog = new THREE.FogExp2("#010106", 0.01);
      if (ambient) { ambient.color.set("#1122aa"); ambient.intensity = 0.15; }
      if (sun) sun.intensity = 0;
    } else {
      threeScene.background = new THREE.Color("#0a0a1a");
      threeScene.fog = new THREE.FogExp2("#0a0a1a", 0.008);
      if (ambient) { ambient.color.set("#6688aa"); ambient.intensity = 0.5; }
      if (sun) sun.intensity = 1.5;
    }
  }, [nightMode]);

  const generate = useCallback(() => {
    const threeScene = sceneRef.current;
    if (!threeScene || building) return;
    setBuilding(true);
    setTimeout(() => {
      buildCity(threeScene, { style, blocksX, blocksZ, blockSize, roadWidth, buildingsPerBlock, showWindows, showStreetLights, showRoofDetails, showLightGlow });
      let bCount = 0, tris = 0;
      threeScene.traverse(obj => {
        if (obj.userData.cityObject && obj.isMesh) {
          bCount++;
          if (obj.geometry) tris += (obj.geometry.index ? obj.geometry.index.count / 3 : obj.geometry.attributes.position?.count / 3 || 0);
        }
      });
      setStats({ buildings: bCount, blocks: blocksX * blocksZ, tris: Math.round(tris) });
      setBuilding(false);
    }, 10);
  }, [style, blocksX, blocksZ, blockSize, roadWidth, buildingsPerBlock, showWindows, showStreetLights, showRoofDetails, showLightGlow, building]);

  const exportCity = () => {
    const data = { style, grid: { blocksX, blocksZ }, blockSize, roadWidth, buildingsPerBlock, features: { showWindows, showStreetLights, showRoofDetails, showLightGlow } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `city_${style}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={s.root}>
      <div style={s.sidebar}>
        <div style={s.sectionLabel}>City Style</div>
        <div style={s.styleGrid}>
          {Object.entries(CITY_STYLES).map(([k, v]) => (
            <button key={k} style={s.styleBtn(style === k)} onClick={() => setStyle(k)}>
              <div style={{ fontSize: 20, marginBottom: 3 }}>{v.icon}</div>
              {v.label}
            </button>
          ))}
        </div>

        <div style={s.divider} />
        <div style={s.sectionLabel}>Grid Layout</div>
        <SliderRow label="Blocks X" value={blocksX} min={1} max={10} onChange={setBlocksX} />
        <SliderRow label="Blocks Z" value={blocksZ} min={1} max={10} onChange={setBlocksZ} />
        <SliderRow label="Block Size" value={blockSize} min={6} max={30} onChange={setBlockSize} unit="u" />
        <SliderRow label="Road Width" value={roadWidth} min={2} max={10} onChange={setRoadWidth} unit="u" />
        <SliderRow label="Buildings/Block" value={buildingsPerBlock} min={1} max={9} onChange={setBuildingsPerBlock} />

        <div style={s.divider} />
        <div style={s.sectionLabel}>Features</div>
        {[["Windows", showWindows, setShowWindows], ["Street Lights", showStreetLights, setShowStreetLights], ["Roof Details", showRoofDetails, setShowRoofDetails], ["Light Glow", showLightGlow, setShowLightGlow], ["Night Mode", nightMode, setNightMode]].map(([label, val, setter]) => (
          <div key={label} style={s.row}>
            <span style={s.label}>{label}</span>
            <Toggle value={val} onChange={setter} />
          </div>
        ))}

        <div style={s.divider} />
        <div style={s.btnRow}>
          <button style={s.btn("primary")} onClick={generate} disabled={building}>{building ? "⏳ BUILDING..." : "🏗️ GENERATE"}</button>
          <button style={s.btn("orange")} onClick={exportCity}>💾 EXPORT</button>
        </div>

        <div style={{ padding: "6px 14px 14px" }}>
          <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: "10px" }}>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>STATS</div>
            <div style={{ fontSize: 10, color: C.teal }}>Blocks: {stats.blocks}</div>
            <div style={{ fontSize: 10, color: C.white }}>Objects: {stats.buildings}</div>
            <div style={{ fontSize: 10, color: C.muted }}>Triangles: {stats.tris.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={s.main}>
        <div style={s.toolbar}>
          <span style={{ fontSize: 10, color: C.muted }}>CITY VIEWPORT — {CITY_STYLES[style].label.toUpperCase()}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span style={s.tag(C.teal)}>DRAG ORBIT</span>
            <span style={s.tag(C.orange)}>SCROLL ZOOM</span>
            {nightMode && <span style={s.tag("#aa44ff")}>NIGHT MODE</span>}
          </div>
        </div>
        <canvas ref={canvasRef} style={s.canvas} />
        <div style={s.statusBar}>
          <span>BLOCKS: {stats.blocks}</span>
          <span>OBJECTS: {stats.buildings}</span>
          <span>TRIANGLES: {stats.tris.toLocaleString()}</span>
          <span style={{ marginLeft: "auto", color: C.teal }}>STYLE: {CITY_STYLES[style].label.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
