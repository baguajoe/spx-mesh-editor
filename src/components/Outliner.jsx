import { useState, useRef } from "react";

const C = {
  bg: "#0d1117", panel: "#06060f", border: "#21262d",
  teal: "#00ffc8", orange: "#FF6600", hover: "#1a1f2e", select: "#0a2a1a",
};

export function Outliner({
  objects = [], activeId = null,
  onSelect, onRename, onDelete, onToggleVisible, onSetParent,
  onGroup, onUngroup, onSaveScene, onLoadScene, onExportScene,
}) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal,  setRenameVal]  = useState("");
  const [expanded,   setExpanded]   = useState({});
  const [dragId,     setDragId]     = useState(null);
  const [dropId,     setDropId]     = useState(null);
  const renameRef = useRef(null);

  const roots    = objects.filter(o => !o.parentId);
  const kids     = (pid) => objects.filter(o => o.parentId === pid);
  const hasKids  = (id) => kids(id).length > 0;

  const startRename = (obj) => {
    setRenamingId(obj.id);
    setRenameVal(obj.name);
    setTimeout(() => renameRef.current?.select(), 30);
  };

  const commitRename = () => {
    if (renamingId && renameVal.trim()) onRename(renamingId, renameVal.trim());
    setRenamingId(null);
  };

  const handleDrop = (targetId) => {
    if (dragId && dragId !== targetId) onSetParent(dragId, targetId);
    setDragId(null); setDropId(null);
  };

  const renderRow = (obj, depth = 0) => {
    const isActive   = obj.id === activeId;
    const isExpanded = expanded[obj.id] !== false;
    const isDrop     = dropId === obj.id;

    return (
      <div key={obj.id}>
        <div
          draggable
          onDragStart={() => setDragId(obj.id)}
          onDragOver={(e) => { e.preventDefault(); setDropId(obj.id); }}
          onDragLeave={() => setDropId(null)}
          onDrop={() => handleDrop(obj.id)}
          onClick={() => onSelect(obj.id)}
          onDoubleClick={() => startRename(obj)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: `3px 8px 3px ${8 + depth * 14}px`,
            background: isActive ? C.select : isDrop ? "#0a1a2a" : "transparent",
            borderLeft: isActive ? `2px solid ${C.teal}` : "2px solid transparent",
            cursor: "pointer", userSelect: "none",
          }}
        >
          <span
            onClick={e => { e.stopPropagation(); setExpanded(ex => ({ ...ex, [obj.id]: !ex[obj.id] })); }}
            style={{ color: "#444", fontSize: 9, width: 10, flexShrink: 0 }}
          >
            {hasKids(obj.id) ? (isExpanded ? "▾" : "▸") : "·"}
          </span>
          <span style={{ fontSize: 10, flexShrink: 0 }}>
            {obj.type === "group" ? "📁" : obj.type === "light" ? "💡" : "◻"}
          </span>
          {renamingId === obj.id ? (
            <input
              ref={renameRef}
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
              onClick={e => e.stopPropagation()}
              style={{
                flex: 1, background: "#1a1f2e", border: `1px solid ${C.teal}`,
                color: "#fff", borderRadius: 3, padding: "1px 4px", fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
              }}
            />
          ) : (
            <span style={{
              flex: 1, fontSize: 11,
              color: isActive ? C.teal : obj.visible === false ? "#444" : "#aaa",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {obj.name}
            </span>
          )}
          <span
            onClick={e => { e.stopPropagation(); onToggleVisible(obj.id); }}
            style={{ color: obj.visible === false ? "#333" : "#555", fontSize: 11, cursor: "pointer", flexShrink: 0 }}
          >
            {obj.visible === false ? "🚫" : "👁"}
          </span>
          <span
            onClick={e => { e.stopPropagation(); onDelete(obj.id); }}
            style={{ color: "#333", fontSize: 11, cursor: "pointer", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = C.orange}
            onMouseLeave={e => e.currentTarget.style.color = "#333"}
          >✕</span>
        </div>
        {hasKids(obj.id) && isExpanded && kids(obj.id).map(c => renderRow(c, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{
      width: 200, background: C.bg, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", flexShrink: 0,
      fontFamily: "JetBrains Mono, monospace", fontSize: 12, overflow: "hidden",
    }}>
      <div style={{
        padding: "6px 10px", borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: C.teal, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
          Scene ({objects.length})
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={onGroup} title="Group selected"
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 11 }}>⊞</button>
          <button onClick={onUngroup} title="Ungroup"
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 11 }}>⊟</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {roots.length === 0 ? (
          <div style={{ color: "#333", fontSize: 10, padding: "12px 10px", textAlign: "center" }}>
            No objects.{"\n"}Add a primitive →
          </div>
        ) : roots.map(o => renderRow(o, 0))}
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        <button onClick={onSaveScene}
          style={{ background: C.teal, border: "none", color: "#06060f", borderRadius: 3, padding: "4px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
          💾 Save Scene
        </button>
        <button onClick={onLoadScene}
          style={{ background: "#1a1f2e", border: `1px solid ${C.border}`, color: "#aaa", borderRadius: 3, padding: "4px", cursor: "pointer", fontSize: 10 }}>
          📂 Load Scene
        </button>
        <button onClick={onExportScene}
          style={{ background: "#1a1f2e", border: `1px solid ${C.border}`, color: C.orange, borderRadius: 3, padding: "4px", cursor: "pointer", fontSize: 10 }}>
          📦 Export All GLB
        </button>
      </div>
    </div>
  );
}
