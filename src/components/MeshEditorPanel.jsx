import React from "react";

export const MeshEditorPanel = ({ stats, onApplyFunction, onAddPrimitive }) => {
  const prims = [
    { id: 'box', label: 'Cube', icon: '📦' }, { id: 'sphere', label: 'Sphere', icon: '🌑' },
    { id: 'cylinder', label: 'Cyl', icon: '🔋' }, { id: 'torus', label: 'Torus', icon: '🍩' },
    { id: 'gear', label: 'Gear', icon: '⚙️' }, { id: 'pipe', label: 'Pipe', icon: '🔧' },
    { id: 'helix', label: 'Helix', icon: '🧬' }, { id: 'staircase', label: 'Stairs', icon: '🪜' }
  ];
  const engines = [
    { id: 'dyntopo', label: 'Dyntopo Sculpt', icon: '🌋' },
    { id: 'retopo', label: 'Quad Remesh', icon: '🕸️' },
    { id: 'mocap', label: 'Mocap Retarget', icon: '🏃' },
    { id: 'boolean', label: 'Boolean Ops', icon: '🧩' },
    { id: 'uv', label: 'Smart UV', icon: '🗺️' }
  ];

  const btnStyle = { background: '#333', border: '1px solid #444', color: '#eee', padding: '6px', fontSize: '11px', cursor: 'pointer', borderRadius: '3px' };

  return (
    <div style={{ background: '#1d1d1d', color: '#c8c8c8', height: '100vh', padding: '15px', borderRight: '1px solid #333', fontFamily: 'monospace' }}>

      {/* ── Top toolbar row 1: Save / Open / Render ── */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <button onClick={() => onApplyFunction('exportSpxScene')} style={{ background: '#27ae60', border: 'none', color: 'white', padding: '5px', fontSize: '9px', borderRadius: '2px', cursor: 'pointer', flex: 1 }}>💾 SAVE</button>
        <label style={{ background: '#34495e', color: 'white', padding: '5px', fontSize: '9px', borderRadius: '2px', cursor: 'pointer', flex: 1, textAlign: 'center' }}>
          📂 OPEN <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => onApplyFunction('importSpxScene', e.target.files[0])} />
        </label>
        <button onClick={() => onApplyFunction('takeSnapshot')} style={{ background: '#8e44ad', border: 'none', color: 'white', padding: '5px', fontSize: '9px', borderRadius: '2px', cursor: 'pointer', flex: 1 }}>📸 RENDER</button>
      </div>

      {/* ── Top toolbar row 2: Save Project / Session ID ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <button onClick={() => onApplyFunction('exportSpxScene')} style={{ background: '#27ae60', border: 'none', color: 'white', padding: '4px 10px', fontSize: '10px', borderRadius: '2px', cursor: 'pointer' }}>
          💾 SAVE PROJECT
        </button>
        <span style={{ fontSize: '9px', color: '#555' }}>ID: {Math.random().toString(36).substr(2, 5).toUpperCase()}</span>
      </div>

      {/* ── Header ── */}
      <h3 style={{ fontSize: '12px', color: '#5b9bd5', margin: '0 0 5px 0' }}>STREAMPIREX D.C.C.</h3>
      <p style={{ fontSize: '10px', color: '#888', marginBottom: '20px' }}>V: {stats.vertices?.toLocaleString() || 0} | F: {stats.faces?.toLocaleString() || 0}</p>

      {/* ── Primitive Factory ── */}
      <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>PRIMITIVE FACTORY</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '25px' }}>
        {prims.map(p => (
          <button key={p.id} onClick={() => onAddPrimitive(p.id)} style={btnStyle}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* ── Core Engines ── */}
      <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>CORE ENGINES</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {engines.map(e => (
          <button key={e.id} onClick={() => onApplyFunction(e.id)} style={{ ...btnStyle, textAlign: 'left', padding: '10px' }}>
            {e.icon} {e.label}
          </button>
        ))}
      </div>

    </div>
  );
};