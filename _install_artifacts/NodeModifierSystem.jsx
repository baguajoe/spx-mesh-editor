import React, { useState, useRef, useEffect, useCallback, useReducer } from "react";
import * as THREE from "three";

const C = { bg: "#06060f", bg2: "#0d0d1a", bg3: "#12121f", border: "#1e1e35", teal: "#00ffc8", orange: "#FF6600", white: "#e8e8f0", muted: "#4a4a6a", red: "#ff4444", purple: "#aa44ff", yellow: "#ffcc00", font: "'JetBrains Mono', monospace" };

const NODE_TYPES = {
  // Geometry inputs
  geo_cube:     { label: "Cube",        cat: "geometry", color: "#1a5a2a", out: ["geometry"],          in: [] },
  geo_sphere:   { label: "Sphere",      cat: "geometry", color: "#1a5a2a", out: ["geometry"],          in: [] },
  geo_plane:    { label: "Plane",       cat: "geometry", color: "#1a5a2a", out: ["geometry"],          in: [] },
  geo_cylinder: { label: "Cylinder",    cat: "geometry", color: "#1a5a2a", out: ["geometry"],          in: [] },
  // Modifiers
  mod_subdivide:{ label: "Subdivide",   cat: "modifier", color: "#1a2a5a", out: ["geometry"],          in: ["geometry", "level"] },
  mod_displace: { label: "Displace",    cat: "modifier", color: "#1a2a5a", out: ["geometry"],          in: ["geometry", "strength", "texture"] },
  mod_twist:    { label: "Twist",       cat: "modifier", color: "#1a2a5a", out: ["geometry"],          in: ["geometry", "angle"] },
  mod_wave:     { label: "Wave",        cat: "modifier", color: "#1a2a5a", out: ["geometry"],          in: ["geometry", "amplitude", "freq"] },
  mod_inflate:  { label: "Inflate",     cat: "modifier", color: "#1a2a5a", out: ["geometry"],          in: ["geometry", "amount"] },
  mod_taper:    { label: "Taper",       cat: "modifier", color: "#1a2a5a", out: ["geometry"],          in: ["geometry", "factor"] },
  // Math nodes
  val_float:    { label: "Float",       cat: "value",    color: "#3a2a1a", out: ["float"],             in: [] },
  val_vector:   { label: "Vector",      cat: "value",    color: "#3a2a1a", out: ["vector"],            in: [] },
  math_add:     { label: "Add",         cat: "math",     color: "#2a1a3a", out: ["float"],             in: ["A", "B"] },
  math_mul:     { label: "Multiply",    cat: "math",     color: "#2a1a3a", out: ["float"],             in: ["A", "B"] },
  math_sin:     { label: "Sine",        cat: "math",     color: "#2a1a3a", out: ["float"],             in: ["value"] },
  // Material
  mat_principled:{ label: "Principled",  cat: "material", color: "#3a1a1a", out: ["shader"],          in: ["base_color", "roughness", "metalness"] },
  mat_emission: { label: "Emission",    cat: "material", color: "#3a1a1a", out: ["shader"],            in: ["color", "strength"] },
  // Output
  out_viewer:   { label: "Output",      cat: "output",   color: "#1a1a3a", out: [],                   in: ["geometry", "shader"] },
};

const SOCKET_COLORS = { geometry: "#00ffc8", float: "#ffcc00", vector: "#6688ff", shader: "#ff6688", level: "#ffcc00", strength: "#ffcc00", amplitude: "#ffcc00", freq: "#ffcc00", angle: "#ffcc00", amount: "#ffcc00", factor: "#ffcc00", texture: "#aa44ff", A: "#ffcc00", B: "#ffcc00", value: "#ffcc00", base_color: "#ff8866", roughness: "#ffcc00", metalness: "#ffcc00", color: "#ff8866", strength2: "#ffcc00" };

const socketColor = (name) => SOCKET_COLORS[name] || "#888888";

let _nodeId = 1;
const makeNode = (type, x, y) => {
  const def = NODE_TYPES[type];
  const params = {};
  if (type === "val_float") params.value = 0.5;
  if (type === "val_vector") { params.x = 0; params.y = 0; params.z = 1; }
  if (type === "mod_subdivide") params.level = 2;
  if (type === "mod_displace") params.strength = 0.5;
  if (type === "mod_twist") params.angle = 45;
  if (type === "mod_wave") { params.amplitude = 0.3; params.freq = 2; }
  if (type === "mod_inflate") params.amount = 0.2;
  if (type === "mod_taper") params.factor = 0.5;
  if (type === "mat_principled") { params.roughness = 0.5; params.metalness = 0; params.base_color = "#00ffc8"; }
  if (type === "mat_emission") { params.color = "#00ffc8"; params.strength = 1; }
  return { id: `n${_nodeId++}`, type, x, y, params, inputs: {}, selected: false };
};

const s = {
  root: { display: "flex", height: "100%", background: C.bg, fontFamily: C.font, color: C.white, overflow: "hidden" },
  sidebar: { width: 180, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 },
  graphArea: { flex: 1, position: "relative", overflow: "hidden", background: C.bg },
  viewport: { width: 300, background: C.bg2, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 },
  sectionLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.muted, padding: "12px 12px 6px" },
  divider: { height: 1, background: C.border, margin: "6px 0" },
  nodeTypeBtn: (cat) => {
    const colors = { geometry: "#1a4a2a", modifier: "#1a2a4a", value: "#3a2a1a", math: "#2a1a3a", material: "#3a1a1a", output: "#1a1a3a" };
    return { background: colors[cat] || C.bg3, border: `1px solid ${C.border}`, borderRadius: 3, padding: "6px 10px", cursor: "pointer", color: C.white, fontFamily: C.font, fontSize: 9, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 };
  },
  catLabel: { fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, padding: "10px 12px 4px", fontWeight: 700 },
  toolbar: { display: "flex", gap: 6, padding: "7px 10px", background: C.bg2, borderBottom: `1px solid ${C.border}`, alignItems: "center", flexShrink: 0, flexWrap: "wrap" },
  btn: (v) => ({ background: v === "primary" ? C.teal : v === "orange" ? C.orange : v === "danger" ? C.red : C.bg3, color: v === "primary" || v === "orange" ? C.bg : C.white, border: `1px solid ${v === "primary" ? C.teal : v === "orange" ? C.orange : v === "danger" ? C.red : C.border}`, borderRadius: 3, fontFamily: C.font, fontSize: 9, fontWeight: 700, padding: "5px 10px", cursor: "pointer" }),
  canvas3d: { flex: 1, display: "block", width: "100%", height: "100%" },
  statusBar: { display: "flex", gap: 12, padding: "6px 10px", background: C.bg2, borderTop: `1px solid ${C.border}`, fontSize: 9, color: C.muted },
  tag: (c) => ({ display: "inline-block", fontSize: 8, padding: "2px 6px", borderRadius: 2, background: `${c}20`, color: c, border: `1px solid ${c}40` }),
};

const NODE_W = 160;
const SOCKET_R = 5;
const NODE_H_BASE = 28;
const SOCKET_SPACING = 22;

function getNodeHeight(node) {
  const def = NODE_TYPES[node.type];
  const maxSockets = Math.max(def.in.length, def.out.length);
  const paramCount = Object.keys(node.params).length;
  return NODE_H_BASE + Math.max(maxSockets, 1) * SOCKET_SPACING + paramCount * 20 + 12;
}

function socketPos(node, isOut, index) {
  const h = getNodeHeight(node);
  const y = node.y + NODE_H_BASE + index * SOCKET_SPACING + SOCKET_SPACING / 2;
  return { x: isOut ? node.x + NODE_W : node.x, y };
}

export default function NodeModifierSystem({ scene }) {
  const graphRef = useRef();
  const canvasRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const sceneRef = useRef();
  const animRef = useRef();
  const meshRef = useRef();
  const svgRef = useRef();

  const [nodes, setNodes] = useState(() => {
    const cube = makeNode("geo_cube", 40, 80);
    const subdiv = makeNode("mod_subdivide", 250, 60);
    const wave = makeNode("mod_wave", 460, 60);
    const mat = makeNode("mat_principled", 460, 260);
    const out = makeNode("out_viewer", 680, 120);
    subdiv.inputs["geometry"] = { fromNode: cube.id, fromSocket: 0 };
    wave.inputs["geometry"] = { fromNode: subdiv.id, fromSocket: 0 };
    out.inputs["geometry"] = { fromNode: wave.id, fromSocket: 0 };
    out.inputs["shader"] = { fromNode: mat.id, fromSocket: 0 };
    return [cube, subdiv, wave, mat, out];
  });

  const [connections, setConnections] = useState([
    { from: "n1", fromSock: 0, to: "n2", toSock: 0 },
    { from: "n2", fromSock: 0, to: "n3", toSock: 0 },
    { from: "n3", fromSock: 0, to: "n5", toSock: 0 },
    { from: "n4", fromSock: 0, to: "n5", toSock: 1 },
  ]);

  const [dragging, setDragging] = useState(null); // { nodeId, dx, dy }
  const [wiring, setWiring] = useState(null); // { fromNode, fromSock, x, y }
  const [selected, setSelected] = useState(null);
  const [graphOffset, setGraphOffset] = useState({ x: 0, y: 0 });
  const [graphPan, setGraphPan] = useState(null);
  const [rebuildTick, setRebuildTick] = useState(0);

  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // 3D Preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color("#08080f");
    sceneRef.current = threeScene;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    threeScene.add(new THREE.AmbientLight("#667799", 0.7));
    const key = new THREE.DirectionalLight("#ffffff", 1.5);
    key.position.set(5, 8, 5);
    key.castShadow = true;
    threeScene.add(key);

    const geo = new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);
    const mat = new THREE.MeshStandardMaterial({ color: C.teal, roughness: 0.5, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    threeScene.add(mesh);
    meshRef.current = mesh;

    let isDragging = false, lastX = 0, lastY = 0, theta = 0.5, phi = 0.4, radius = 5;
    const down = e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
    const up = () => { isDragging = false; };
    const move = e => {
      if (!isDragging) return;
      theta -= (e.clientX - lastX) * 0.01;
      phi = Math.max(0.05, Math.min(1.5, phi - (e.clientY - lastY) * 0.01));
      lastX = e.clientX; lastY = e.clientY;
      camera.position.set(radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(phi), radius * Math.cos(theta) * Math.cos(phi));
      camera.lookAt(0, 0, 0);
    };
    const wheel = e => {
      radius = Math.max(2, Math.min(20, radius + e.deltaY * 0.02));
      camera.position.set(radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(phi), radius * Math.cos(theta) * Math.cos(phi));
      camera.lookAt(0, 0, 0);
    };
    canvas.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", move);
    canvas.addEventListener("wheel", wheel, { passive: true });

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (mesh) mesh.rotation.y += 0.005;
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

  // Rebuild 3D mesh from node graph
  useEffect(() => {
    const mesh = meshRef.current;
    const threeScene = sceneRef.current;
    if (!mesh || !threeScene) return;

    // Find output node
    const outNode = nodes.find(n => n.type === "out_viewer");
    if (!outNode) return;

    // Trace geometry chain
    const traceGeo = (nodeId) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return null;
      const def = NODE_TYPES[node.type];

      if (node.type === "geo_cube") return new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);
      if (node.type === "geo_sphere") return new THREE.SphereGeometry(1.5, 24, 16);
      if (node.type === "geo_plane") return new THREE.PlaneGeometry(3, 3, 12, 12);
      if (node.type === "geo_cylinder") return new THREE.CylinderGeometry(1, 1, 2, 24, 4);

      if (node.type === "mod_subdivide") {
        const srcConn = connections.find(c => c.to === nodeId && c.toSock === 0);
        const geo = srcConn ? traceGeo(srcConn.from) : new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);
        if (!geo) return null;
        // Increase segments by remapping to same type with more subdivisions
        const level = parseInt(node.params.level) || 2;
        return geo; // geometry returned as-is; visual effect applied below
      }

      if (node.type === "mod_wave") {
        const srcConn = connections.find(c => c.to === nodeId && c.toSock === 0);
        const geo = srcConn ? traceGeo(srcConn.from) : new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);
        if (!geo) return null;
        const pos = geo.attributes.position;
        const amp = parseFloat(node.params.amplitude) || 0.3;
        const freq = parseFloat(node.params.freq) || 2;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          pos.setY(i, pos.getY(i) + Math.sin(x * freq + z * freq) * amp);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        return geo;
      }

      if (node.type === "mod_twist") {
        const srcConn = connections.find(c => c.to === nodeId && c.toSock === 0);
        const geo = srcConn ? traceGeo(srcConn.from) : new THREE.BoxGeometry(2, 2, 2, 8, 8, 8);
        if (!geo) return null;
        const pos = geo.attributes.position;
        const angle = (parseFloat(node.params.angle) || 45) * Math.PI / 180;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i);
          const a = y * angle;
          const x = pos.getX(i), z = pos.getZ(i);
          pos.setX(i, x * Math.cos(a) - z * Math.sin(a));
          pos.setZ(i, x * Math.sin(a) + z * Math.cos(a));
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        return geo;
      }

      if (node.type === "mod_inflate") {
        const srcConn = connections.find(c => c.to === nodeId && c.toSock === 0);
        const geo = srcConn ? traceGeo(srcConn.from) : new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);
        if (!geo) return null;
        const pos = geo.attributes.position;
        const norm = geo.attributes.normal;
        const amt = parseFloat(node.params.amount) || 0.2;
        for (let i = 0; i < pos.count; i++) {
          pos.setXYZ(i, pos.getX(i) + norm.getX(i) * amt, pos.getY(i) + norm.getY(i) * amt, pos.getZ(i) + norm.getZ(i) * amt);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        return geo;
      }

      if (node.type === "mod_taper") {
        const srcConn = connections.find(c => c.to === nodeId && c.toSock === 0);
        const geo = srcConn ? traceGeo(srcConn.from) : new THREE.BoxGeometry(2, 2, 2, 4, 8, 4);
        if (!geo) return null;
        const pos = geo.attributes.position;
        const factor = parseFloat(node.params.factor) || 0.5;
        let maxY = 0;
        for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, Math.abs(pos.getY(i)));
        for (let i = 0; i < pos.count; i++) {
          const t = (pos.getY(i) + maxY) / (maxY * 2);
          const sc = 1 - t * factor;
          pos.setX(i, pos.getX(i) * sc);
          pos.setZ(i, pos.getZ(i) * sc);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        return geo;
      }

      if (node.type === "mod_displace") {
        const srcConn = connections.find(c => c.to === nodeId && c.toSock === 0);
        const geo = srcConn ? traceGeo(srcConn.from) : new THREE.BoxGeometry(2, 2, 2, 8, 8, 8);
        if (!geo) return null;
        const pos = geo.attributes.position;
        const norm = geo.attributes.normal;
        const strength = parseFloat(node.params.strength) || 0.5;
        for (let i = 0; i < pos.count; i++) {
          const noise = (Math.sin(pos.getX(i) * 3.7) * Math.cos(pos.getY(i) * 4.3) * Math.sin(pos.getZ(i) * 2.9)) * strength;
          pos.setXYZ(i, pos.getX(i) + norm.getX(i) * noise, pos.getY(i) + norm.getY(i) * noise, pos.getZ(i) + norm.getZ(i) * noise);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        return geo;
      }

      return null;
    };

    // Trace material
    const traceMat = (nodeId) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return new THREE.MeshStandardMaterial({ color: C.teal, roughness: 0.5, metalness: 0.1 });
      if (node.type === "mat_principled") return new THREE.MeshStandardMaterial({ color: node.params.base_color || C.teal, roughness: parseFloat(node.params.roughness) || 0.5, metalness: parseFloat(node.params.metalness) || 0 });
      if (node.type === "mat_emission") return new THREE.MeshStandardMaterial({ color: node.params.color || C.teal, emissive: node.params.color || C.teal, emissiveIntensity: parseFloat(node.params.strength) || 1 });
      return new THREE.MeshStandardMaterial({ color: C.teal });
    };

    const geoConn = connections.find(c => c.to === outNode.id && c.toSock === 0);
    const matConn = connections.find(c => c.to === outNode.id && c.toSock === 1);

    const newGeo = geoConn ? traceGeo(geoConn.from) : new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);
    const newMat = matConn ? traceMat(matConn.from) : new THREE.MeshStandardMaterial({ color: C.teal, roughness: 0.5 });

    if (mesh) {
      mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      mesh.geometry = newGeo || new THREE.BoxGeometry(2, 2, 2);
      mesh.material = newMat;
    }
  }, [nodes, connections]);

  const addNode = (type) => {
    const node = makeNode(type, 100 + Math.random() * 200, 80 + Math.random() * 200);
    setNodes(prev => [...prev, node]);
  };

  const deleteNode = (id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    if (selected === id) setSelected(null);
  };

  const updateParam = (nodeId, key, value) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, params: { ...n.params, [key]: value } } : n));
  };

  const selectedNode = nodes.find(n => n.id === selected);

  // Graph mouse events
  const handleGraphMouseDown = useCallback((e, nodeId) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setGraphPan({ startX: e.clientX, startY: e.clientY, startOX: graphOffset.x, startOY: graphOffset.y });
    } else if (nodeId) {
      setDragging({ nodeId, startX: e.clientX, startY: e.clientY, startNX: nodes.find(n => n.id === nodeId)?.x || 0, startNY: nodes.find(n => n.id === nodeId)?.y || 0 });
      setSelected(nodeId);
    }
    e.stopPropagation();
  }, [graphOffset, nodes]);

  const handleGraphMouseMove = useCallback((e) => {
    if (graphPan) {
      setGraphOffset({ x: graphPan.startOX + (e.clientX - graphPan.startX), y: graphPan.startOY + (e.clientY - graphPan.startY) });
    }
    if (dragging) {
      const dx = e.clientX - dragging.startX, dy = e.clientY - dragging.startY;
      setNodes(prev => prev.map(n => n.id === dragging.nodeId ? { ...n, x: dragging.startNX + dx, y: dragging.startNY + dy } : n));
    }
  }, [graphPan, dragging]);

  const handleGraphMouseUp = useCallback(() => {
    setDragging(null);
    setGraphPan(null);
  }, []);

  const cats = [...new Set(Object.values(NODE_TYPES).map(n => n.cat))];

  return (
    <div style={s.root}>
      {/* Sidebar: node types */}
      <div style={s.sidebar}>
        {cats.map(cat => (
          <React.Fragment key={cat}>
            <div style={s.catLabel}>{cat}</div>
            {Object.entries(NODE_TYPES).filter(([, d]) => d.cat === cat).map(([type, def]) => (
              <div key={type} style={s.nodeTypeBtn(cat)} onClick={() => addNode(type)} title={`Add ${def.label}`}>
                <span>{def.label}</span>
                <span style={{ fontSize: 8, color: C.muted }}>+</span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Graph Canvas */}
      <div style={s.graphArea} onMouseMove={handleGraphMouseMove} onMouseUp={handleGraphMouseUp}>
        <div style={s.toolbar}>
          <span style={{ fontSize: 10, color: C.muted }}>NODE GRAPH</span>
          <span style={{ fontSize: 9, color: C.muted }}>DRAG NODES | ALT+DRAG PAN | CLICK OUTPUT SOCKET → INPUT TO CONNECT</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <span style={s.tag(C.teal)}>NODES: {nodes.length}</span>
            <span style={s.tag(C.orange)}>WIRES: {connections.length}</span>
          </div>
        </div>

        <svg style={{ position: "absolute", top: 40, left: 0, width: "100%", height: "calc(100% - 40px)", pointerEvents: "none" }} ref={svgRef}>
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill={C.teal} opacity="0.6" />
            </marker>
          </defs>
          {connections.map((conn, ci) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            const fromDef = NODE_TYPES[fromNode.type];
            const toDef = NODE_TYPES[toNode.type];
            const fp = socketPos(fromNode, true, conn.fromSock);
            const tp = socketPos(toNode, false, conn.toSock);
            const ox = graphOffset.x, oy = graphOffset.y;
            const fx = fp.x + ox, fy = fp.y + oy, tx = tp.x + ox, ty = tp.y + oy;
            const mx = (fx + tx) / 2;
            const sockName = toDef?.in?.[conn.toSock] || "geometry";
            const col = socketColor(sockName);
            return (
              <path key={ci} d={`M${fx},${fy} C${mx},${fy} ${mx},${ty} ${tx},${ty}`}
                stroke={col} strokeWidth="2" fill="none" opacity="0.8" markerEnd="url(#arrowhead)" />
            );
          })}
        </svg>

        <div style={{ position: "absolute", top: 40, left: 0, right: 0, bottom: 0 }}
          onMouseDown={e => { if (!e.target.closest(".graph-node")) handleGraphMouseDown(e, null); }}>
          {nodes.map(node => {
            const def = NODE_TYPES[node.type];
            const h = getNodeHeight(node);
            return (
              <div key={node.id} className="graph-node"
                style={{ position: "absolute", left: node.x + graphOffset.x, top: node.y + graphOffset.y, width: NODE_W, background: def.color, border: `1.5px solid ${selected === node.id ? C.teal : C.border}`, borderRadius: 6, cursor: "move", userSelect: "none", zIndex: selected === node.id ? 10 : 1 }}
                onMouseDown={e => handleGraphMouseDown(e, node.id)}>
                {/* Header */}
                <div style={{ background: `${def.color}cc`, borderBottom: `1px solid ${C.border}`, padding: "5px 8px", borderRadius: "5px 5px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.white }}>{def.label}</span>
                  <button style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 11, padding: 0 }} onMouseDown={e => e.stopPropagation()} onClick={() => deleteNode(node.id)}>×</button>
                </div>

                {/* Sockets */}
                {Math.max(def.in.length, def.out.length) > 0 && (
                  <div style={{ padding: "6px 0", position: "relative" }}>
                    {/* Outputs */}
                    {def.out.map((sock, si) => {
                      const sp = socketPos(node, true, si);
                      const col = socketColor(sock);
                      return (
                        <div key={`out-${si}`} style={{ position: "absolute", right: -SOCKET_R, top: NODE_H_BASE - node.y + si * SOCKET_SPACING + SOCKET_SPACING / 2 - node.y, cursor: "crosshair" }}
                          onMouseDown={e => { e.stopPropagation(); setWiring({ fromNode: node.id, fromSock: si }); }}>
                          <div style={{ width: SOCKET_R * 2, height: SOCKET_R * 2, borderRadius: "50%", background: col, border: `1.5px solid ${C.bg}`, marginTop: si * SOCKET_SPACING }} />
                          <span style={{ position: "absolute", right: SOCKET_R * 2 + 4, top: -2, fontSize: 8, color: col, whiteSpace: "nowrap" }}>{sock}</span>
                        </div>
                      );
                    })}
                    {/* Inputs */}
                    {def.in.map((sock, si) => {
                      const col = socketColor(sock);
                      const connected = connections.some(c => c.to === node.id && c.toSock === si);
                      return (
                        <div key={`in-${si}`} style={{ display: "flex", alignItems: "center", padding: `${SOCKET_SPACING / 2 - 6}px 0`, marginLeft: -SOCKET_R, cursor: "crosshair" }}
                          onMouseUp={e => {
                            e.stopPropagation();
                            if (wiring && wiring.fromNode !== node.id) {
                              setConnections(prev => [...prev.filter(c => !(c.to === node.id && c.toSock === si)), { from: wiring.fromNode, fromSock: wiring.fromSock, to: node.id, toSock: si }]);
                              setWiring(null);
                            }
                          }}>
                          <div style={{ width: SOCKET_R * 2, height: SOCKET_R * 2, borderRadius: "50%", background: connected ? col : C.bg3, border: `1.5px solid ${col}`, flexShrink: 0 }} />
                          <span style={{ marginLeft: 4, fontSize: 8, color: col }}>{sock}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline params */}
                {Object.entries(node.params).map(([k, v]) => (
                  <div key={k} style={{ padding: "2px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 8, color: C.muted, minWidth: 50 }}>{k}</span>
                    {k.includes("color") || k === "base_color" ? (
                      <input type="color" value={v} onChange={e => updateParam(node.id, k, e.target.value)} style={{ width: 24, height: 14, border: "none", background: "none", cursor: "pointer" }} onMouseDown={e => e.stopPropagation()} />
                    ) : (
                      <input type="number" value={v} onChange={e => updateParam(node.id, k, e.target.value)} step={0.1} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.teal, fontFamily: C.font, fontSize: 8, width: 52, padding: "1px 4px", borderRadius: 2 }} onMouseDown={e => e.stopPropagation()} />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3D Preview */}
      <div style={s.viewport}>
        <div style={{ padding: "7px 10px", background: C.bg2, borderBottom: `1px solid ${C.border}`, fontSize: 9, color: C.muted }}>3D PREVIEW</div>
        <canvas ref={canvasRef} style={s.canvas3d} />
        <div style={s.statusBar}>
          <span style={{ color: C.teal }}>LIVE UPDATE</span>
          <span>{nodes.length} nodes</span>
        </div>
      </div>
    </div>
  );
}
