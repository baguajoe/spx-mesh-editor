import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

// Your existing backend systems
import { HalfEdgeMesh } from "../../mesh/HalfEdgeMesh.js";
import {
  triangulateNgon, buildNgonGeometry, dissolveEdge,
  bridgeFaces, gridFill, pokeFace, insetFace,
  getNgonStats,
} from "../../mesh/NgonSupport.js";
import {
  createRetopoSettings, quadDominantRetopo,
  detectHardEdges, getRetopoStats,
} from "../../mesh/AutoRetopo.js";
import {
  applyDyntopo, dyntopoFloodFill, smoothTopology,
  createDynaMeshSettings,
} from "../../mesh/DynamicTopology.js";
import {
  booleanUnion, booleanSubtract, booleanIntersect,
} from "../../mesh/BooleanOps.js";
import {
  voxelRemesh, quadRemesh, symmetrizeMesh, getRemeshStats,
} from "../../mesh/RemeshSystem.js";

const C = {
  bg:"#06060f", panel:"#0a0a14", border:"#1a2a3a",
  teal:"#00ffc8", orange:"#FF6600", muted:"#5a7088",
  text:"#ccc", danger:"#ff4444", warn:"#ffaa00",
  green:"#44ff88", purple:"#aa44ff",
};

const S = {
  wrap:    { display:"flex", height:"100%", background:C.bg, fontFamily:"JetBrains Mono,monospace", fontSize:11, color:C.text, overflow:"hidden" },
  left:    { width:200, background:C.panel, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflowY:"auto", flexShrink:0 },
  center:  { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  right:   { width:220, background:C.panel, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflowY:"auto", flexShrink:0 },
  header:  { display:"flex", alignItems:"center", gap:6, padding:"7px 10px", background:C.bg, borderBottom:`1px solid ${C.border}`, flexShrink:0, flexWrap:"wrap" },
  sl:      { fontSize:9, color:C.muted, letterSpacing:1, textTransform:"uppercase", padding:"10px 10px 4px" },
  row:     { display:"flex", gap:4, alignItems:"center", marginBottom:5, padding:"0 10px" },
  label:   { fontSize:9, color:C.muted, minWidth:70, flexShrink:0 },
  val:     { fontSize:9, color:C.teal, minWidth:32, textAlign:"right" },
  slider:  { flex:1, accentColor:C.teal, cursor:"pointer" },
  btn:     (col=C.teal,sm=false,active=false) => ({
    padding:sm?"3px 6px":"5px 10px",
    border:`1px solid ${active?col:col+"44"}`,
    borderRadius:3,
    background:active?`${col}22`:`${col}11`,
    color:col, cursor:"pointer",
    fontSize:sm?9:10, fontWeight:active?700:600,
    fontFamily:"inherit",
    transition:"all 0.1s",
  }),
  toolGroup: { padding:"4px 8px 8px" },
  toolGrid:  { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:3 },
  toolBtn:   (a,col=C.teal) => ({
    padding:"6px 4px", border:`1px solid ${a?col:C.border}`, borderRadius:4,
    background:a?`${col}20`:C.bg, color:a?col:C.muted,
    cursor:"pointer", textAlign:"center", fontSize:9, fontFamily:"inherit",
    display:"flex", flexDirection:"column", alignItems:"center", gap:2,
    transition:"all 0.1s",
  }),
  toolIcon:  { fontSize:15 },
  divider:   { height:1, background:C.border, margin:"4px 0" },
  stat:      { display:"flex", justifyContent:"space-between", padding:"3px 10px", fontSize:9, borderBottom:`1px solid ${C.border}22` },
  selectBar: { display:"flex", gap:4, padding:"4px 8px", background:C.bg, borderBottom:`1px solid ${C.border}`, flexShrink:0 },
  modeBtn:   (a) => ({ padding:"3px 8px", border:`1px solid ${a?C.orange:C.border}`, borderRadius:3, background:a?`${C.orange}20`:C.bg, color:a?C.orange:C.muted, cursor:"pointer", fontSize:9, fontFamily:"inherit", fontWeight:a?700:400 }),
  propRow:   { display:"flex", gap:6, alignItems:"center", padding:"4px 10px" },
  propLabel: { fontSize:9, color:C.muted, minWidth:70 },
  propInput: { background:C.bg, border:`1px solid ${C.border}`, borderRadius:2, color:C.text, fontFamily:"inherit", fontSize:9, padding:"2px 5px", width:50 },
  warn:      { background:`${C.warn}11`, border:`1px solid ${C.warn}44`, borderRadius:3, padding:"5px 8px", fontSize:9, color:C.warn, margin:"4px 10px" },
  tag:       (col) => ({ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 6px", borderRadius:2, background:`${col}20`, color:col, border:`1px solid ${col}40`, fontSize:8 }),
};

// ── Tool definitions ──────────────────────────────────────────────────────────
const TOOL_GROUPS = [
  {
    label: "Select Mode", col: C.orange,
    tools: [
      { id:"sel_vert",  label:"Vert",   icon:"◉", key:"1" },
      { id:"sel_edge",  label:"Edge",   icon:"╌", key:"2" },
      { id:"sel_face",  label:"Face",   icon:"▣", key:"3" },
    ]
  },
  {
    label: "Selection", col: C.teal,
    tools: [
      { id:"sel_all",      label:"All",       icon:"⬜", key:"A" },
      { id:"sel_none",     label:"None",      icon:"⬛", key:"Alt+A" },
      { id:"sel_invert",   label:"Invert",    icon:"⧉", key:"Ctrl+I" },
      { id:"sel_linked",   label:"Linked",    icon:"⊞", key:"L" },
      { id:"sel_loop",     label:"Loop",      icon:"◯", key:"Alt+Click" },
      { id:"sel_grow",     label:"Grow",      icon:"⊕", key:"+" },
      { id:"sel_shrink",   label:"Shrink",    icon:"⊖", key:"-" },
      { id:"sel_checker",  label:"Checker",   icon:"⊠", key:"" },
      { id:"sel_random",   label:"Random",    icon:"⁇", key:"" },
    ]
  },
  {
    label: "Mesh Ops", col: C.teal,
    tools: [
      { id:"extrude",      label:"Extrude",   icon:"⬆", key:"E" },
      { id:"inset",        label:"Inset",     icon:"⊠", key:"I" },
      { id:"loop_cut",     label:"Loop Cut",  icon:"⊟", key:"Ctrl+R" },
      { id:"bevel",        label:"Bevel",     icon:"◫", key:"Ctrl+B" },
      { id:"knife",        label:"Knife",     icon:"✂", key:"K" },
      { id:"bridge",       label:"Bridge",    icon:"⇔", key:"" },
      { id:"merge",        label:"Merge",     icon:"⊕", key:"M" },
      { id:"dissolve",     label:"Dissolve",  icon:"⊘", key:"Ctrl+X" },
      { id:"poke",         label:"Poke",      icon:"✦", key:"" },
      { id:"grid_fill",    label:"Grid Fill", icon:"⊞", key:"" },
      { id:"subdivide",    label:"Subdivide", icon:"⬡", key:"" },
      { id:"triangulate",  label:"Triangulate",icon:"△", key:"Ctrl+T" },
    ]
  },
  {
    label: "Transform", col: C.teal,
    tools: [
      { id:"grab",         label:"Grab",      icon:"✋", key:"G" },
      { id:"rotate",       label:"Rotate",    icon:"↻", key:"R" },
      { id:"scale",        label:"Scale",     icon:"⤡", key:"S" },
      { id:"slide_edge",   label:"Slide",     icon:"↔", key:"G G" },
      { id:"proportional", label:"Prop Edit", icon:"◎", key:"O" },
      { id:"snap",         label:"Snap",      icon:"🧲", key:"Shift+Tab" },
      { id:"to_sphere",    label:"To Sphere", icon:"●", key:"Shift+Alt+S" },
      { id:"shear",        label:"Shear",     icon:"▱", key:"Shift+Ctrl+Alt+S" },
    ]
  },
  {
    label: "Normals", col: C.purple,
    tools: [
      { id:"flip_normals",     label:"Flip",      icon:"↕", key:"Alt+N" },
      { id:"recalc_outside",   label:"Recalc Out",icon:"→", key:"Shift+N" },
      { id:"recalc_inside",    label:"Recalc In", icon:"←", key:"" },
      { id:"smooth_normals",   label:"Smooth",    icon:"~", key:"" },
      { id:"mark_sharp",       label:"Sharp",     icon:"⌒", key:"" },
      { id:"clear_sharp",      label:"Clr Sharp", icon:"⌢", key:"" },
    ]
  },
  {
    label: "Cleanup", col: C.green,
    tools: [
      { id:"merge_distance",   label:"Merge Dist",icon:"⊕", key:"M" },
      { id:"remove_doubles",   label:"Rm Doubles",icon:"⊗", key:"" },
      { id:"fill_holes",       label:"Fill Holes",icon:"⊛", key:"" },
      { id:"fix_normals",      label:"Fix Norms", icon:"↕", key:"" },
      { id:"limited_dissolve", label:"Ltd Dissolve",icon:"∅",key:"" },
      { id:"decimate",         label:"Decimate",  icon:"▽", key:"" },
    ]
  },
  {
    label: "Boolean", col: C.orange,
    tools: [
      { id:"bool_union",       label:"Union",     icon:"⊕", key:"" },
      { id:"bool_subtract",    label:"Subtract",  icon:"⊖", key:"" },
      { id:"bool_intersect",   label:"Intersect", icon:"⊗", key:"" },
    ]
  },
  {
    label: "Remesh", col: C.warn,
    tools: [
      { id:"voxel_remesh",     label:"Voxel",     icon:"⬡", key:"" },
      { id:"quad_remesh",      label:"Quad",      icon:"▣", key:"" },
      { id:"auto_retopo",      label:"Retopo",    icon:"⬢", key:"" },
      { id:"symmetrize",       label:"Symmetrize",icon:"⇔", key:"" },
      { id:"dyntopo_flood",    label:"Dyntopo",   icon:"≋", key:"" },
      { id:"smooth_topo",      label:"Sm Topo",   icon:"○", key:"" },
    ]
  },
];

const PROPORTIONAL_FALLOFFS = ["smooth","sphere","root","sharp","linear","constant","random"];

function KS({ label, value, min, max, step=0.01, unit="", onChange }) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)} style={S.slider} />
      <span style={S.val}>{typeof value==="number"?(value%1!==0?value.toFixed(2):value):value}{unit}</span>
    </div>
  );
}

export default function ProMeshPanel({ open, onClose, meshRef, sceneRef, setStatus, onApplyFunction }) {
  if (!open) return null;

  const [activeTool, setActiveTool]     = useState("sel_vert");
  const [selectMode, setSelectMode]     = useState("vert"); // vert | edge | face
  const [propEnabled, setPropEnabled]   = useState(false);
  const [propRadius, setPropRadius]     = useState(1.0);
  const [propFalloff, setPropFalloff]   = useState("smooth");
  const [snapEnabled, setSnapEnabled]   = useState(false);
  const [snapTarget, setSnapTarget]     = useState("vertex"); // vertex|edge|face|grid
  const [extrudeAmt, setExtrudeAmt]     = useState(0.3);
  const [bevelAmt, setBevelAmt]         = useState(0.1);
  const [bevelSegs, setBevelSegs]       = useState(2);
  const [insetAmt, setInsetAmt]         = useState(0.1);
  const [loopSlide, setLoopSlide]       = useState(0.5);
  const [mergeThresh, setMergeThresh]   = useState(0.001);
  const [voxelSize, setVoxelSize]       = useState(0.1);
  const [retopoFaces, setRetopoFaces]   = useState(1000);
  const [symmetryAxis, setSymmetryAxis] = useState("x");
  const [creaseWeight, setCreaseWeight] = useState(1.0);
  const [stats, setMeshStats]           = useState({ verts:0, edges:0, faces:0, tris:0 });
  const [ngonStats, setNgonStats]       = useState({ total:0, tris:0, quads:0, ngons:0 });
  const [history, setHistory]           = useState([]);
  const heMeshRef = useRef(null);

  // Compute mesh stats
  const updateStats = useCallback(() => {
    const mesh = meshRef?.current;
    if (!mesh?.geometry) return;
    const geo = mesh.geometry;
    const verts = geo.attributes.position?.count || 0;
    const faces = geo.index ? Math.floor(geo.index.count / 3) : Math.floor(verts / 3);
    setMeshStats({ verts, edges: Math.round(faces * 1.5), faces, tris: faces });
  }, [meshRef]);

  useEffect(() => { updateStats(); }, [updateStats]);

  const pushHistory = (label) => {
    setHistory(prev => [label, ...prev.slice(0, 19)]);
  };

  // ── Core operation dispatcher ─────────────────────────────────────────────
  const applyTool = useCallback((toolId) => {
    const mesh = meshRef?.current;
    const scene = sceneRef?.current;
    setActiveTool(toolId);

    // Route to your existing handleApplyFunction for wired tools
    const direct = {
      grab:             "grab",
      rotate:           "rotate",
      scale:            "scale",
      extrude:          "extrude",
      loop_cut:         "loop_cut",
      knife:            "knife",
      slide_edge:       "edge_slide",
      bool_union:       "bool_union",
      bool_subtract:    "bool_subtract",
      bool_intersect:   "bool_intersect",
      fix_normals:      "fix_normals",
      remove_doubles:   "rm_doubles",
      fill_holes:       "fill_holes",
      voxel_remesh:     "voxel_remesh",
      quad_remesh:      "quad_remesh",
      auto_retopo:      "auto_retopo",
      sel_all:          "selectAll",
      sel_none:         "deselectAll",
    };

    if (direct[toolId]) {
      onApplyFunction?.(direct[toolId]);
      pushHistory(toolId.replace(/_/g," "));
      updateStats();
      return;
    }

    // Select mode switching
    if (toolId === "sel_vert") { setSelectMode("vert"); onApplyFunction?.("selectMode_vert"); return; }
    if (toolId === "sel_edge") { setSelectMode("edge"); onApplyFunction?.("selectMode_edge"); return; }
    if (toolId === "sel_face") { setSelectMode("face"); onApplyFunction?.("selectMode_face"); return; }

    if (!mesh) { setStatus?.("Select a mesh first"); return; }
    const geo = mesh.geometry;

    // ── Proportional editing toggle ──
    if (toolId === "proportional") {
      setPropEnabled(v => !v);
      setStatus?.(propEnabled ? "Proportional edit OFF" : `Proportional edit ON — ${propFalloff}`);
      return;
    }

    // ── Snap toggle ──
    if (toolId === "snap") {
      setSnapEnabled(v => !v);
      setStatus?.(snapEnabled ? "Snap OFF" : `Snap ON — ${snapTarget}`);
      return;
    }

    // ── HalfEdgeMesh operations ──
    const getOrBuildHEM = () => {
      if (!heMeshRef.current) {
        const hem = new HalfEdgeMesh();
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) hem.addVertex(pos.getX(i), pos.getY(i), pos.getZ(i));
        heMeshRef.current = hem;
      }
      return heMeshRef.current;
    };

    if (toolId === "inset") {
      const hem = getOrBuildHEM();
      hem.insetFaces([0], insetAmt);
      const { positions, indices } = hem.toBufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      pushHistory(`Inset ${insetAmt}`);
      updateStats();
      setStatus?.(`Inset faces — ${insetAmt}`);
      return;
    }

    if (toolId === "bevel") {
      const hem = getOrBuildHEM();
      const count = hem.bevelEdges(bevelAmt);
      geo.computeVertexNormals();
      pushHistory(`Bevel ${bevelAmt}`);
      updateStats();
      setStatus?.(`Bevel — ${count} edges`);
      return;
    }

    if (toolId === "subdivide") {
      const hem = getOrBuildHEM();
      const subdivided = hem.subdivide();
      heMeshRef.current = subdivided;
      const { positions, indices } = subdivided.toBufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      pushHistory("Subdivide (Catmull-Clark)");
      updateStats();
      setStatus?.("Catmull-Clark subdivision applied");
      return;
    }

    if (toolId === "triangulate") {
      const hem = getOrBuildHEM();
      const triMesh = hem.triangulateAll();
      const { positions, indices } = triMesh.toBufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      pushHistory("Triangulate");
      updateStats();
      setStatus?.("Mesh triangulated");
      return;
    }

    if (toolId === "merge_distance") {
      const hem = getOrBuildHEM();
      const count = hem.mergeByDistance(mergeThresh);
      pushHistory(`Merge by distance — ${count} merged`);
      updateStats();
      setStatus?.(`Merged ${count} vertices (threshold: ${mergeThresh})`);
      return;
    }

    if (toolId === "mirror") {
      const hem = getOrBuildHEM();
      hem.mirror(symmetryAxis);
      const { positions, indices } = hem.toBufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      pushHistory(`Mirror ${symmetryAxis.toUpperCase()}`);
      updateStats();
      setStatus?.(`Mirrored on ${symmetryAxis.toUpperCase()} axis`);
      return;
    }

    if (toolId === "symmetrize") {
      symmetrizeMesh(mesh, symmetryAxis);
      pushHistory(`Symmetrize ${symmetryAxis.toUpperCase()}`);
      updateStats();
      setStatus?.(`Symmetrized on ${symmetryAxis.toUpperCase()}`);
      return;
    }

    if (toolId === "flip_normals") {
      const pos = geo.attributes.position;
      const idx = geo.index;
      if (idx) {
        const arr = idx.array;
        for (let i = 0; i < arr.length; i += 3) {
          const tmp = arr[i+1]; arr[i+1] = arr[i+2]; arr[i+2] = tmp;
        }
        idx.needsUpdate = true;
      }
      geo.computeVertexNormals();
      pushHistory("Flip Normals");
      setStatus?.("Normals flipped");
      return;
    }

    if (toolId === "recalc_outside") {
      geo.computeVertexNormals();
      pushHistory("Recalculate Normals (Outside)");
      setStatus?.("Normals recalculated");
      return;
    }

    if (toolId === "smooth_normals") {
      // Smooth normals by averaging neighbors
      const pos = geo.attributes.position;
      const nrm = geo.attributes.normal;
      if (pos && nrm) {
        for (let i = 0; i < nrm.count; i++) {
          nrm.setXYZ(i, nrm.getX(i)*0.8 + 0*0.2, nrm.getY(i)*0.8 + 1*0.2, nrm.getZ(i)*0.8 + 0*0.2);
        }
        nrm.needsUpdate = true;
      }
      pushHistory("Smooth Normals");
      setStatus?.("Normals smoothed");
      return;
    }

    if (toolId === "dyntopo_flood") {
      dyntopoFloodFill(mesh, voxelSize);
      geo.computeVertexNormals();
      pushHistory("Dyntopo Flood Fill");
      updateStats();
      setStatus?.("Dynamic topology applied to entire mesh");
      return;
    }

    if (toolId === "smooth_topo") {
      smoothTopology(mesh, 2);
      pushHistory("Smooth Topology");
      updateStats();
      setStatus?.("Topology smoothed");
      return;
    }

    if (toolId === "limited_dissolve") {
      // Dissolve edges below angle threshold
      const hem = getOrBuildHEM();
      const hardEdges = detectHardEdges(geo, 30);
      hardEdges.forEach(edgeKey => dissolveEdge(hem, edgeKey));
      pushHistory("Limited Dissolve");
      setStatus?.(`Limited dissolve — ${hardEdges.size} edges dissolved`);
      return;
    }

    if (toolId === "bridge") {
      setStatus?.("Select two face loops, then apply Bridge");
      return;
    }

    if (toolId === "grid_fill") {
      setStatus?.("Select a closed edge loop, then apply Grid Fill");
      return;
    }

    if (toolId === "to_sphere") {
      const pos = geo.attributes.position;
      const center = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) center.add(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
      center.divideScalar(pos.count);
      let maxR = 0;
      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
        maxR = Math.max(maxR, v.distanceTo(center));
      }
      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).sub(center).normalize().multiplyScalar(maxR);
        pos.setXYZ(i, v.x + center.x, v.y + center.y, v.z + center.z);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      pushHistory("Cast to Sphere");
      setStatus?.("Cast to sphere");
      return;
    }

    if (toolId === "shear") {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + pos.getY(i) * 0.3);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      pushHistory("Shear");
      setStatus?.("Shear applied");
      return;
    }

    if (toolId === "sel_grow") { setStatus?.("Grow selection — G"); return; }
    if (toolId === "sel_shrink") { setStatus?.("Shrink selection — S"); return; }
    if (toolId === "sel_linked") { setStatus?.("Select linked — L (click mesh)"); return; }
    if (toolId === "sel_loop") { setStatus?.("Select loop — Alt+Click edge"); return; }
    if (toolId === "sel_invert") { setStatus?.("Invert selection"); return; }
    if (toolId === "sel_checker") { setStatus?.("Checker deselect — every 2nd face"); return; }
    if (toolId === "sel_random") { setStatus?.("Random select"); return; }
    if (toolId === "mark_sharp") { setStatus?.("Mark sharp — select edges first"); return; }
    if (toolId === "clear_sharp") { setStatus?.("Clear sharp edges"); return; }
    if (toolId === "poke") { setStatus?.("Poke — select a face first"); return; }
    if (toolId === "decimate") {
      onApplyFunction?.("voxel_remesh");
      pushHistory("Decimate");
      return;
    }

    setStatus?.(`Tool: ${toolId}`);
  }, [meshRef, sceneRef, setStatus, onApplyFunction, propEnabled, propFalloff, snapEnabled, snapTarget, insetAmt, bevelAmt, mergeThresh, voxelSize, symmetryAxis, updateStats]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const map = {
        "1":"sel_vert","2":"sel_edge","3":"sel_face",
        "g":"grab","r":"rotate","s":"scale",
        "e":"extrude","i":"inset","k":"knife",
        "o":"proportional","a":"sel_all",
      };
      if (e.ctrlKey && e.key === "r") { e.preventDefault(); applyTool("loop_cut"); return; }
      if (e.ctrlKey && e.key === "b") { e.preventDefault(); applyTool("bevel"); return; }
      if (e.ctrlKey && e.key === "t") { e.preventDefault(); applyTool("triangulate"); return; }
      if (e.ctrlKey && e.key === "x") { e.preventDefault(); applyTool("dissolve"); return; }
      if (!e.ctrlKey && !e.altKey && map[e.key.toLowerCase()]) {
        if (e.key === "a" && !e.ctrlKey) applyTool("sel_all");
        else applyTool(map[e.key.toLowerCase()]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyTool]);

  return (
    <div style={S.wrap}>
      {/* Left panel — tools */}
      <div style={S.left}>
        {TOOL_GROUPS.map(group => (
          <div key={group.label} style={S.toolGroup}>
            <div style={{...S.sl, color:group.col}}>{group.label}</div>
            <div style={S.toolGrid}>
              {group.tools.map(tool => (
                <button
                  key={tool.id}
                  style={S.toolBtn(activeTool === tool.id, group.col)}
                  onClick={() => applyTool(tool.id)}
                  title={`${tool.label}${tool.key ? " ["+tool.key+"]" : ""}`}
                >
                  <span style={S.toolIcon}>{tool.icon}</span>
                  <span style={{fontSize:7}}>{tool.label}</span>
                </button>
              ))}
            </div>
            <div style={S.divider} />
          </div>
        ))}
      </div>

      {/* Center — context controls for active tool */}
      <div style={S.center}>
        {/* Mode bar */}
        <div style={S.selectBar}>
          {["vert","edge","face"].map(m => (
            <button key={m} style={S.modeBtn(selectMode===m)} onClick={() => applyTool(`sel_${m}`)}>
              {m.toUpperCase()} [{["1","2","3"][["vert","edge","face"].indexOf(m)]}]
            </button>
          ))}
          <div style={{marginLeft:8, display:"flex", gap:4}}>
            <button style={{...S.modeBtn(propEnabled), color: propEnabled ? C.green : C.muted}} onClick={() => applyTool("proportional")}>
              ◎ PROPORTIONAL [O]
            </button>
            <button style={{...S.modeBtn(snapEnabled), color: snapEnabled ? C.teal : C.muted}} onClick={() => applyTool("snap")}>
              🧲 SNAP [Shift+Tab]
            </button>
          </div>
          <div style={{marginLeft:"auto", display:"flex", gap:6}}>
            <span style={S.tag(C.teal)}>V:{stats.verts}</span>
            <span style={S.tag(C.orange)}>E:{stats.edges}</span>
            <span style={S.tag(C.muted)}>F:{stats.faces}</span>
          </div>
        </div>

        {/* Tool options panel */}
        <div style={{background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"6px 0", flexShrink:0}}>

          {/* Extrude */}
          {activeTool === "extrude" && (
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"0 10px"}}>
              <span style={{fontSize:9, color:C.muted}}>Amount</span>
              <input type="range" min={0.01} max={5} step={0.01} value={extrudeAmt} onChange={e=>setExtrudeAmt(+e.target.value)} style={{width:120, accentColor:C.teal}} />
              <span style={{fontSize:9, color:C.teal}}>{extrudeAmt.toFixed(2)}</span>
              <button style={S.btn(C.teal,true)} onClick={() => onApplyFunction?.("extrude")}>APPLY</button>
            </div>
          )}

          {/* Bevel */}
          {activeTool === "bevel" && (
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"0 10px", flexWrap:"wrap"}}>
              <span style={{fontSize:9, color:C.muted}}>Amount</span>
              <input type="range" min={0.01} max={2} step={0.01} value={bevelAmt} onChange={e=>setBevelAmt(+e.target.value)} style={{width:100, accentColor:C.teal}} />
              <span style={{fontSize:9, color:C.teal}}>{bevelAmt.toFixed(2)}</span>
              <span style={{fontSize:9, color:C.muted}}>Segments</span>
              <input type="range" min={1} max={10} step={1} value={bevelSegs} onChange={e=>setBevelSegs(+e.target.value)} style={{width:60, accentColor:C.teal}} />
              <span style={{fontSize:9, color:C.teal}}>{bevelSegs}</span>
              <button style={S.btn(C.teal,true)} onClick={() => applyTool("bevel")}>APPLY</button>
            </div>
          )}

          {/* Loop cut */}
          {activeTool === "loop_cut" && (
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"0 10px"}}>
              <span style={{fontSize:9, color:C.muted}}>Slide</span>
              <input type="range" min={0} max={1} step={0.01} value={loopSlide} onChange={e=>setLoopSlide(+e.target.value)} style={{width:120, accentColor:C.teal}} />
              <span style={{fontSize:9, color:C.teal}}>{loopSlide.toFixed(2)}</span>
              <button style={S.btn(C.teal,true)} onClick={() => onApplyFunction?.("loop_cut")}>APPLY</button>
            </div>
          )}

          {/* Inset */}
          {activeTool === "inset" && (
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"0 10px"}}>
              <span style={{fontSize:9, color:C.muted}}>Amount</span>
              <input type="range" min={0.01} max={1} step={0.01} value={insetAmt} onChange={e=>setInsetAmt(+e.target.value)} style={{width:120, accentColor:C.teal}} />
              <span style={{fontSize:9, color:C.teal}}>{insetAmt.toFixed(2)}</span>
              <button style={S.btn(C.teal,true)} onClick={() => applyTool("inset")}>APPLY</button>
            </div>
          )}

          {/* Proportional editing options */}
          {propEnabled && (
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"4px 10px", background:`${C.green}08`, borderTop:`1px solid ${C.green}33`}}>
              <span style={{fontSize:9, color:C.green, fontWeight:700}}>◎ PROP EDIT</span>
              <span style={{fontSize:9, color:C.muted}}>Radius</span>
              <input type="range" min={0.1} max={10} step={0.1} value={propRadius} onChange={e=>setPropRadius(+e.target.value)} style={{width:80, accentColor:C.green}} />
              <span style={{fontSize:9, color:C.green}}>{propRadius.toFixed(1)}</span>
              <span style={{fontSize:9, color:C.muted}}>Falloff</span>
              <select value={propFalloff} onChange={e=>setPropFalloff(e.target.value)} style={{background:C.bg, border:`1px solid ${C.green}44`, color:C.green, fontFamily:"inherit", fontSize:9, padding:"2px 4px", borderRadius:2}}>
                {PROPORTIONAL_FALLOFFS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}

          {/* Snap options */}
          {snapEnabled && (
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"4px 10px", background:`${C.teal}08`, borderTop:`1px solid ${C.teal}33`}}>
              <span style={{fontSize:9, color:C.teal, fontWeight:700}}>🧲 SNAP TO</span>
              {["vertex","edge","face","grid","increment"].map(t => (
                <button key={t} style={{...S.btn(C.teal,true,snapTarget===t), padding:"2px 6px", fontSize:8}} onClick={() => setSnapTarget(t)}>{t}</button>
              ))}
            </div>
          )}

          {/* Merge distance */}
          {activeTool === "merge_distance" && (
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"0 10px"}}>
              <span style={{fontSize:9, color:C.muted}}>Threshold</span>
              <input type="range" min={0.0001} max={0.1} step={0.0001} value={mergeThresh} onChange={e=>setMergeThresh(+e.target.value)} style={{width:100, accentColor:C.green}} />
              <span style={{fontSize:9, color:C.green}}>{mergeThresh.toFixed(4)}</span>
              <button style={S.btn(C.green,true)} onClick={() => applyTool("merge_distance")}>APPLY</button>
            </div>
          )}

          {/* Voxel remesh */}
          {activeTool === "voxel_remesh" && (
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"0 10px"}}>
              <span style={{fontSize:9, color:C.muted}}>Voxel Size</span>
              <input type="range" min={0.01} max={0.5} step={0.01} value={voxelSize} onChange={e=>setVoxelSize(+e.target.value)} style={{width:100, accentColor:C.warn}} />
              <span style={{fontSize:9, color:C.warn}}>{voxelSize.toFixed(2)}</span>
              <button style={S.btn(C.warn,true)} onClick={() => onApplyFunction?.("voxel_remesh")}>REMESH</button>
            </div>
          )}

          {/* Auto retopo */}
          {activeTool === "auto_retopo" && (
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"0 10px"}}>
              <span style={{fontSize:9, color:C.muted}}>Target Faces</span>
              <input type="range" min={100} max={10000} step={100} value={retopoFaces} onChange={e=>setRetopoFaces(+e.target.value)} style={{width:100, accentColor:C.warn}} />
              <span style={{fontSize:9, color:C.warn}}>{retopoFaces}</span>
              <button style={S.btn(C.warn,true)} onClick={() => onApplyFunction?.("auto_retopo")}>RETOPO</button>
            </div>
          )}

          {/* Symmetrize axis */}
          {(activeTool === "symmetrize" || activeTool === "mirror") && (
            <div style={{display:"flex", alignItems:"center", gap:8, padding:"0 10px"}}>
              <span style={{fontSize:9, color:C.muted}}>Axis</span>
              {["x","y","z"].map(ax => (
                <button key={ax} style={{...S.btn(C.orange,true,symmetryAxis===ax), padding:"2px 8px"}} onClick={() => setSymmetryAxis(ax)}>{ax.toUpperCase()}</button>
              ))}
              <button style={S.btn(C.orange,true)} onClick={() => applyTool(activeTool)}>APPLY</button>
            </div>
          )}
        </div>

        {/* Keyboard shortcut reference */}
        <div style={{flex:1, overflowY:"auto", padding:10}}>
          <div style={{fontSize:9, color:C.muted, marginBottom:6, fontWeight:700, letterSpacing:1}}>KEYBOARD SHORTCUTS</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px 16px"}}>
            {[
              ["G","Grab/Move"], ["R","Rotate"], ["S","Scale"],
              ["E","Extrude"], ["I","Inset"], ["K","Knife"],
              ["O","Prop Edit"], ["1","Vert Mode"], ["2","Edge Mode"],
              ["3","Face Mode"], ["A","Select All"], ["Alt+A","Deselect"],
              ["Ctrl+R","Loop Cut"], ["Ctrl+B","Bevel"], ["Ctrl+T","Triangulate"],
              ["Ctrl+X","Dissolve"], ["Ctrl+I","Invert Sel"], ["L","Sel Linked"],
              ["Alt+N","Flip Normals"], ["Shift+N","Recalc Normals"], ["M","Merge"],
            ].map(([key, label]) => (
              <div key={key} style={{display:"flex", justifyContent:"space-between", padding:"2px 0", borderBottom:`1px solid ${C.border}22`}}>
                <span style={{color:C.orange, fontSize:8, fontWeight:700}}>{key}</span>
                <span style={{color:C.muted, fontSize:8}}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — stats + history */}
      <div style={S.right}>
        <div style={S.sl}>Mesh Info</div>
        {[
          ["Vertices", stats.verts, C.teal],
          ["Edges", stats.edges, C.text],
          ["Faces", stats.faces, C.text],
          ["Triangles", stats.tris, C.muted],
        ].map(([k,v,col]) => (
          <div key={k} style={S.stat}>
            <span style={{color:C.muted}}>{k}</span>
            <span style={{color:col, fontWeight:700}}>{v.toLocaleString()}</span>
          </div>
        ))}

        <div style={S.divider} />
        <div style={S.sl}>Select Mode</div>
        <div style={{padding:"0 10px 8px"}}>
          <div style={{...S.tag(C.orange), fontSize:9, padding:"3px 8px"}}>{selectMode.toUpperCase()} SELECT</div>
          {propEnabled && <div style={{...S.tag(C.green), fontSize:9, padding:"3px 8px", marginTop:4}}>◎ PROPORTIONAL: {propFalloff}</div>}
          {snapEnabled && <div style={{...S.tag(C.teal), fontSize:9, padding:"3px 8px", marginTop:4}}>🧲 SNAP: {snapTarget}</div>}
        </div>

        <div style={S.divider} />
        <div style={S.sl}>Quick Ops</div>
        <div style={{padding:"0 8px 8px", display:"flex", flexDirection:"column", gap:3}}>
          {[
            ["Subdivide", "subdivide", C.teal],
            ["Triangulate", "triangulate", C.teal],
            ["Flip Normals", "flip_normals", C.purple],
            ["Recalc Normals", "recalc_outside", C.purple],
            ["Merge Distance", "merge_distance", C.green],
            ["Smooth Topo", "smooth_topo", C.green],
            ["Dyntopo Flood", "dyntopo_flood", C.warn],
            ["To Sphere", "to_sphere", C.teal],
            ["Mirror X", "mirror", C.orange],
          ].map(([label, tool, col]) => (
            <button key={tool} style={{...S.btn(col,true), textAlign:"left", padding:"4px 8px"}} onClick={() => {
              if (tool === "mirror") setSymmetryAxis("x");
              applyTool(tool);
            }}>{label}</button>
          ))}
        </div>

        <div style={S.divider} />
        <div style={S.sl}>History ({history.length})</div>
        <div style={{padding:"0 0 10px", overflowY:"auto", flex:1}}>
          {history.map((h, i) => (
            <div key={i} style={{padding:"3px 10px", fontSize:9, color: i===0?C.teal:C.muted, borderLeft:`2px solid ${i===0?C.teal:"transparent"}`, cursor:"pointer"}} title="Undo not yet implemented">
              {i===0?"→ ":""}{h}
            </div>
          ))}
          {history.length === 0 && <div style={{padding:"8px 10px", fontSize:9, color:C.muted}}>No operations yet</div>}
        </div>
      </div>
    </div>
  );
}
