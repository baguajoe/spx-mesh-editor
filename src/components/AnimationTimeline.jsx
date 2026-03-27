import React, { useState, useEffect } from "react";

export const AnimationTimeline = ({ currentFrame, totalFrames, onFrameChange, isPlaying, onTogglePlay, isAutoKey, onToggleAutoKey }) => {
  const [localFrame, setLocalFrame] = useState(currentFrame);

  const handleScrub = (e) => {
    const val = parseInt(e.target.value);
    setLocalFrame(val);
    onFrameChange(val);
  };

  return (
    <div className="timeline-container" style={{ 
      background: '#1d1d1d', 
      borderTop: '1px solid #333', 
      padding: '10px 20px', 
      height: '80px',
      color: '#c8c8c8'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
        <button onClick={onTogglePlay} style={{ background: '#333', border: '1px solid #444', color: 'white', padding: '5px 15px', borderRadius: '3px', cursor: 'pointer' }}>
          {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
        <div style={{ fontSize: '11px' }}>
          FRAME: <b style={{ color: '#5b9bd5' }}>{currentFrame}</b> / {totalFrames}
        </div>
      </div>
      
      <div style={{ position: 'relative', width: '100%' }}>
        <input 
          type="range" 
          min="0" 
          max={totalFrames} 
          value={currentFrame} 
          onChange={handleScrub}
          style={{ 
            width: '100%', 
            cursor: 'pointer',
            accentColor: '#5b9bd5',
            background: '#333'
          }} 
        />
        {/* KEYFRAME TICKS (Logic for 700+ function keyframes would render here) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', marginTop: '5px' }}>
          {[0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250].map(tick => <span key={tick}>{tick}</span>)}
        </div>
      </div>
    </div>
  );
};
