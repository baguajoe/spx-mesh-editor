import React from "react";

export const Outliner = ({ objects, selectedId, onSelect, onDelete, onToggleVisibility }) => {
  return (
    <div className="outliner" style={{ background: '#1d1d1d', color: '#c8c8c8', height: '100%', borderLeft: '1px solid #333', padding: '10px', overflowY: 'auto' }}>
      <h3 style={{ fontSize: '11px', color: '#5b9bd5', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>SCENE OUTLINER</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {objects.map(obj => (
          <div 
            key={obj.uuid} 
            onClick={() => onSelect(obj)}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '4px 8px', 
              fontSize: '11px', 
              cursor: 'pointer',
              background: selectedId === obj.uuid ? '#2d4c6d' : 'transparent',
              borderRadius: '2px'
            }}
          >
            <span>{obj.userData.type === 'gear' ? '⚙️' : '📦'} {obj.name || obj.userData.type || 'Mesh'}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span onClick={(e) => { e.stopPropagation(); onToggleVisibility(obj); }}>{obj.visible ? '👁️' : '🌑'}</span>
              <span onClick={(e) => { e.stopPropagation(); onDelete(obj); }} style={{ color: '#c0392b' }}>✖</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
