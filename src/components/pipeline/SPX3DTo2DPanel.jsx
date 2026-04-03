import React, { useState, useRef, useEffect } from "react";
import { CINEMATIC_STYLES, SPX3DTo2DRenderer } from "../../pipeline/SPX3DTo2DPipeline";

const C = {
  bg: "#06060f", panel: "#0d1117", border: "#21262d",
  teal: "#00ffc8", orange: "#FF6600", text: "#e0e0e0",
  dim: "#8b949e", font: "JetBrains Mono, monospace",
};

const S = {
  root: { position:"fixed", top:60, right:20, width:340, maxHeight:"calc(100vh - 80px)",
    background:C.panel, border:`1px solid ${C.border}`, borderRadius:8,
    fontFamily:C.font, color:C.text, zIndex:900, display:"flex", flexDirection:"column",
    boxShadow:"0 8px 32px rgba(0,0,0,0.7)" },
  header: { display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"10px 14px", borderBottom:`1px solid ${C.border}`, flexShrink:0 },
  title: { fontSize:12, fontWeight:700, color:C.teal, letterSpacing:2 },
  close: { background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:16, padding:0 },
  body: { overflowY:"auto", padding:12, flex:1 },
  section: { marginBottom:12 },
  sectionTitle: { fontSize:9, color:C.orange, letterSpacing:2, marginBottom:6, textTransform:"uppercase" },
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4 },
  styleBtn: (active) => ({
    background: active ? C.teal : "#0d1117",
    color: active ? "#06060f" : C.dim,
    border: `1px solid ${active ? C.teal : C.border}`,
    borderRadius:4, padding:"5px 4px", fontSize:9, cursor:"pointer",
    fontFamily:C.font, textAlign:"center", lineHeight:1.3,
    transition:"all 0.1s",
    boxShadow: active ? `0 0 8px ${C.teal}44` : "none",
  }),
  btn: { background:C.teal, color:"#06060f", border:"none", borderRadius:4,
    padding:"8px 14px", fontFamily:C.font, fontSize:11, fontWeight:700,
    cursor:"pointer", marginRight:6, marginBottom:6 },
  btnO: { background:C.orange, color:"#fff", border:"none", borderRadius:4,
    padding:"8px 14px", fontFamily:C.font, fontSize:11, fontWeight:700,
    cursor:"pointer", marginRight:6, marginBottom:6 },
  preview: { width:"100%", borderRadius:4, border:`1px solid ${C.border}`,
    background:"#000", aspectRatio:"16/9", display:"block", marginBottom:8 },
  stat: { fontSize:10, color:C.teal, marginBottom:3 },
  tag: (col) => ({ display:"inline-block", fontSize:8, padding:"1px 5px",
    borderRadius:3, background:`${col}22`, color:col, border:`1px solid ${col}44`,
    marginRight:3, marginBottom:3, fontFamily:C.font }),
};

const CATEGORIES = [
  { id:"photo",    label:"Photo",    color:"#4a9eff" },
  { id:"cartoon",  label:"Cartoon",  color:"#ff6b6b" },
  { id:"paint",    label:"Paint",    color:"#ffd93d" },
  { id:"sketch",   label:"Sketch",   color:"#c3cfe2" },
  { id:"stylized", label:"Stylized", color:"#a29bfe" },
  { id:"all",      label:"All 41",   color:"#00ffc8" },
];

const ALL_STYLES = Object.values(CINEMATIC_STYLES);

export default function SPX3DTo2DPanel({ open, onClose, sceneRef, rendererRef, cameraRef }) {
  const [activeStyle, setActiveStyle] = useState("cinematic");
  const [activeCategory, setActiveCategory] = useState("all");
  const [rendering, setRendering] = useState(false);
  const [status, setStatus] = useState("");
  const [outlineWidth, setOutlineWidth] = useState(1.5);
  const [toonLevels, setToonLevels] = useState(4);
  const [exportFormat, setExportFormat] = useState("png");
  const canvasRef = useRef(null);
  const rendRef = useRef(null);

  const filtered = activeCategory === "all"
    ? ALL_STYLES
    : ALL_STYLES.filter(s => s.category === activeCategory);

  const currentStyle = CINEMATIC_STYLES[activeStyle] || ALL_STYLES[0];

  const handleRender = async () => {
    if (!sceneRef?.current || !rendererRef?.current || !cameraRef?.current) {
      setStatus("⚠ No scene attached"); return;
    }
    setRendering(true);
    setStatus("Rendering...");
    try {
      const renderer = new SPX3DTo2DRenderer(rendererRef.current, {
        style: activeStyle,
        outlineWidth,
        toonLevels,
      });
      const canvas = await renderer.render(sceneRef.current, cameraRef.current);
      if (canvasRef.current && canvas) {
        const ctx = canvasRef.current.getContext("2d");
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);
      }
      setStatus(`✓ Rendered: ${currentStyle.name}`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
    setRendering(false);
  };

  const handleExport = () => {
    if (!canvasRef.current) { setStatus("Render first"); return; }
    const url = canvasRef.current.toDataURL(`image/${exportFormat}`);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spx_${activeStyle}_render.${exportFormat}`;
    a.click();
    setStatus(`✓ Exported as ${exportFormat.toUpperCase()}`);
  };

  if (!open) return null;

  return (
    <div style={S.root}>
      <div style={S.header}>
        <span style={S.title}>🎬 3D → 2D STYLE</span>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      <div style={S.body}>

        {/* Category filter */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Category</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                style={{
                  ...S.styleBtn(activeCategory === cat.id),
                  background: activeCategory === cat.id ? cat.color : "#0d1117",
                  color: activeCategory === cat.id ? "#06060f" : C.dim,
                  border: `1px solid ${activeCategory === cat.id ? cat.color : C.border}`,
                  padding:"4px 8px",
                }}
                onClick={() => setActiveCategory(cat.id)}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style grid */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Style — {filtered.length} options</div>
          <div style={S.grid}>
            {filtered.map(style => (
              <button key={style.id}
                style={S.styleBtn(activeStyle === style.id)}
                onClick={() => setActiveStyle(style.id)}>
                {style.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active style info */}
        {currentStyle && (
          <div style={{ ...S.section, background:"#0a0a14", borderRadius:6, padding:"8px 10px", border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, color:C.teal, fontWeight:700, marginBottom:4 }}>{currentStyle.name}</div>
            <div style={{ marginBottom:4 }}>
              {currentStyle.outline && <span style={S.tag(C.teal)}>Outline</span>}
              {currentStyle.toon && <span style={S.tag("#ff6b6b")}>Toon</span>}
              {currentStyle.shadows && <span style={S.tag("#ffd93d")}>Shadows</span>}
              {currentStyle.ao && <span style={S.tag("#a29bfe")}>AO</span>}
              {currentStyle.paintStroke && <span style={S.tag(C.orange)}>Paint</span>}
              {currentStyle.sketch && <span style={S.tag("#c3cfe2")}>Sketch</span>}
              {currentStyle.halftone && <span style={S.tag("#ff6b6b")}>Halftone</span>}
              {currentStyle.neon && <span style={S.tag("#ff00ff")}>Neon</span>}
              {currentStyle.voxel && <span style={S.tag("#00ffc8")}>Voxel</span>}
            </div>
            {currentStyle.filter !== "none" && (
              <div style={{ fontSize:9, color:C.dim, fontFamily:"monospace" }}>
                filter: {currentStyle.filter}
              </div>
            )}
          </div>
        )}

        {/* Params */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Parameters</div>
          <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:6 }}>
            <span style={{ fontSize:10, color:C.dim, minWidth:90 }}>Outline Width</span>
            <input type="range" min={0.5} max={4} step={0.5} value={outlineWidth}
              onChange={e => setOutlineWidth(parseFloat(e.target.value))}
              style={{ flex:1, accentColor:C.teal }} />
            <span style={{ fontSize:10, color:C.teal, minWidth:20 }}>{outlineWidth}</span>
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontSize:10, color:C.dim, minWidth:90 }}>Toon Levels</span>
            <input type="range" min={2} max={8} step={1} value={toonLevels}
              onChange={e => setToonLevels(parseInt(e.target.value))}
              style={{ flex:1, accentColor:C.teal }} />
            <span style={{ fontSize:10, color:C.teal, minWidth:20 }}>{toonLevels}</span>
          </div>
        </div>

        {/* Preview canvas */}
        <canvas ref={canvasRef} style={S.preview} width={320} height={180} />

        {/* Actions */}
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center" }}>
          <button style={S.btn} onClick={handleRender} disabled={rendering}>
            {rendering ? "⏳ Rendering..." : "▶ Render"}
          </button>
          <button style={S.btnO} onClick={handleExport}>⬇ Export</button>
          <select value={exportFormat} onChange={e => setExportFormat(e.target.value)}
            style={{ background:"#0d1117", border:`1px solid ${C.border}`, color:C.text,
              padding:"6px 8px", borderRadius:4, fontFamily:C.font, fontSize:10, cursor:"pointer" }}>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        {status && (
          <div style={{ fontSize:10, color:C.teal, marginTop:6, padding:"4px 8px",
            background:"#0a140a", borderRadius:4, border:`1px solid ${C.border}` }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}