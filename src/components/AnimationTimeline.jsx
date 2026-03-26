import { useState, useRef, useEffect, useCallback } from "react";

const C = {
  bg:     "#06060f", panel:  "#0d1117", border: "#21262d",
  teal:   "#00ffc8", orange: "#FF6600", text:   "#dde6ef",
  dim:    "#555",    grey:   "#8fa8bf",
};

// ── Keyframe data structure ───────────────────────────────────────────────────
// keys = { objectId: { property: { frame: value } } }

export function AnimationTimeline({
  objects = [], activeObjId = null, shapeKeys = [],
  onSeek, onPlay, onStop, fps = 24,
}) {
  const [frame,        setFrame]        = useState(0);
  const [frameStart,   setFrameStart]   = useState(0);
  const [frameEnd,     setFrameEnd]     = useState(120);
  const [playing,      setPlaying]      = useState(false);
  const [loop,         setLoop]         = useState(true);
  const [keys,         setKeys]         = useState({});
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [clipboard,    setClipboard]    = useState([]);
  const [interp,       setInterp]       = useState("linear");
  const [showDope,     setShowDope]     = useState(true);
  const [copied,       setCopied]       = useState(false);
  const rafRef   = useRef(null);
  const lastTime = useRef(null);
  const frameRef = useRef(0);

  // ── Playback ────────────────────────────────────────────────────────────────
  const tick = useCallback((time) => {
    if (!lastTime.current) lastTime.current = time;
    const delta = (time - lastTime.current) / 1000;
    lastTime.current = time;
    frameRef.current += delta * fps;
    if (frameRef.current > frameEnd) {
      if (loop) frameRef.current = frameStart;
      else { stopPlayback(); return; }
    }
    const f = Math.floor(frameRef.current);
    setFrame(f);
    onSeek?.(f, keys);
    rafRef.current = requestAnimationFrame(tick);
  }, [fps, frameEnd, frameStart, loop, keys, onSeek]);

  const startPlayback = useCallback(() => {
    frameRef.current = frame;
    lastTime.current = null;
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
    onPlay?.();
  }, [frame, tick, onPlay]);

  const stopPlayback = useCallback(() => {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTime.current = null;
    onStop?.();
  }, [onStop]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Keyframe operations ─────────────────────────────────────────────────────
  const insertKey = useCallback((objId, property, value) => {
    const id = objId || activeObjId; if (!id) return;
    setKeys(prev => {
      const next = { ...prev };
      if (!next[id]) next[id] = {};
      if (!next[id][property]) next[id][property] = {};
      next[id][property][frame] = value;
      return next;
    });
  }, [activeObjId, frame]);

  const deleteKey = useCallback((objId, property, f) => {
    setKeys(prev => {
      const next = { ...prev };
      if (next[objId]?.[property]?.[f] !== undefined) {
        delete next[objId][property][f];
      }
      return next;
    });
  }, []);

  const copySelectedKeys = useCallback(() => {
    const copied = selectedKeys.map(k => ({ ...k, value: keys[k.objId]?.[k.property]?.[k.frame] }));
    setClipboard(copied);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [selectedKeys, keys]);

  const pasteKeys = useCallback((offset = 0) => {
    if (!clipboard.length) return;
    setKeys(prev => {
      const next = { ...prev };
      clipboard.forEach(k => {
        if (!next[k.objId]) next[k.objId] = {};
        if (!next[k.objId][k.property]) next[k.objId][k.property] = {};
        next[k.objId][k.property][k.frame + offset] = k.value;
      });
      return next;
    });
  }, [clipboard]);

  // ── Get interpolated value at frame ─────────────────────────────────────────
  const getValueAtFrame = useCallback((objId, property, f) => {
    const channel = keys[objId]?.[property];
    if (!channel) return null;
    const frames = Object.keys(channel).map(Number).sort((a,b)=>a-b);
    if (!frames.length) return null;
    if (f <= frames[0]) return channel[frames[0]];
    if (f >= frames[frames.length-1]) return channel[frames[frames.length-1]];
    for (let i = 0; i < frames.length - 1; i++) {
      const f0 = frames[i], f1 = frames[i+1];
      if (f >= f0 && f <= f1) {
        const t = (f - f0) / (f1 - f0);
        const v0 = channel[f0], v1 = channel[f1];
        if (interp === "constant") return v0;
        if (interp === "bezier") {
          const ease = t * t * (3 - 2 * t); // smoothstep
          return v0 + (v1 - v0) * ease;
        }
        return v0 + (v1 - v0) * t; // linear
      }
    }
    return null;
  }, [keys, interp]);

  // ── Auto-key active object ──────────────────────────────────────────────────
  const autoKey = useCallback((obj) => {
    if (!obj?.mesh || !activeObjId) return;
    const m = obj.mesh;
    insertKey(activeObjId, "pos.x", m.position.x);
    insertKey(activeObjId, "pos.y", m.position.y);
    insertKey(activeObjId, "pos.z", m.position.z);
    insertKey(activeObjId, "rot.x", m.rotation.x);
    insertKey(activeObjId, "rot.y", m.rotation.y);
    insertKey(activeObjId, "rot.z", m.rotation.z);
    insertKey(activeObjId, "scale", m.scale.x);
  }, [activeObjId, insertKey]);

  // ── All channels for active object ─────────────────────────────────────────
  const activeChannels = activeObjId ? Object.keys(keys[activeObjId] || {}) : [];
  const allFrames = activeChannels.flatMap(ch =>
    Object.keys(keys[activeObjId]?.[ch] || {}).map(Number)
  );
  const totalKeys = new Set(allFrames).size;

  // ── Scrubber click ──────────────────────────────────────────────────────────
  const scrubberRef = useRef(null);
  const onScrubberClick = (e) => {
    const rect = scrubberRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = (e.clientX - rect.left) / rect.width;
    const f = Math.round(frameStart + t * (frameEnd - frameStart));
    setFrame(Math.max(frameStart, Math.min(frameEnd, f)));
    frameRef.current = f;
    onSeek?.(f, keys);
  };

  const scrubberPos = (frameEnd - frameStart) > 0
    ? ((frame - frameStart) / (frameEnd - frameStart)) * 100
    : 0;

  return (
    <div style={{background:C.panel,borderTop:`1px solid ${C.border}`,
      fontFamily:"JetBrains Mono,monospace",fontSize:11,userSelect:"none",flexShrink:0}}>

      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",
        borderBottom:`1px solid ${C.border}`}}>

        {/* Playback controls */}
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>{ setFrame(frameStart); frameRef.current=frameStart; onSeek?.(frameStart,keys); }}
            style={btnStyle("#1a1f2e")}>⏮</button>
          <button onClick={playing?stopPlayback:startPlayback}
            style={btnStyle(playing?C.orange:C.teal, playing?C.bg:"#06060f")}>
            {playing?"⏸":"▶"}
          </button>
          <button onClick={()=>{ setFrame(frameEnd); frameRef.current=frameEnd; onSeek?.(frameEnd,keys); }}
            style={btnStyle("#1a1f2e")}>⏭</button>
          <button onClick={()=>setLoop(l=>!l)}
            style={btnStyle(loop?C.teal:"#1a1f2e", loop?"#06060f":C.dim)}
            title="Loop">🔁</button>
        </div>

        {/* Frame counter */}
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{color:C.dim,fontSize:9}}>Frame</span>
          <input type="number" value={frame} min={frameStart} max={frameEnd}
            onChange={e=>{const f=Number(e.target.value);setFrame(f);frameRef.current=f;onSeek?.(f,keys);}}
            style={{width:48,background:"#1a1f2e",border:`1px solid ${C.border}`,
              color:C.teal,borderRadius:3,padding:"2px 4px",fontSize:10,textAlign:"center"}}/>
          <span style={{color:C.dim,fontSize:9}}>/ {frameEnd}</span>
        </div>

        {/* Range */}
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{color:C.dim,fontSize:9}}>Start</span>
          <input type="number" value={frameStart}
            onChange={e=>setFrameStart(Number(e.target.value))}
            style={{width:36,background:"#1a1f2e",border:`1px solid ${C.border}`,
              color:C.text,borderRadius:3,padding:"2px 4px",fontSize:9,textAlign:"center"}}/>
          <span style={{color:C.dim,fontSize:9}}>End</span>
          <input type="number" value={frameEnd}
            onChange={e=>setFrameEnd(Number(e.target.value))}
            style={{width:36,background:"#1a1f2e",border:`1px solid ${C.border}`,
              color:C.text,borderRadius:3,padding:"2px 4px",fontSize:9,textAlign:"center"}}/>
        </div>

        {/* FPS display */}
        <span style={{color:C.dim,fontSize:9}}>{fps}fps</span>

        {/* Interpolation */}
        <div style={{display:"flex",gap:3,marginLeft:"auto"}}>
          {["linear","constant","bezier"].map(i=>(
            <button key={i} onClick={()=>setInterp(i)}
              style={btnStyle(interp===i?C.orange:"#1a1f2e",interp===i?"#fff":C.dim,9)}>
              {i}
            </button>
          ))}
        </div>

        {/* Key ops */}
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>{ const obj=objects.find(o=>o.id===activeObjId); autoKey(obj); }}
            style={btnStyle(C.teal,"#06060f")} title="Insert keyframe (I)">
            + Key
          </button>
          <button onClick={copySelectedKeys} style={btnStyle("#1a1f2e",copied?C.teal:C.dim)}>
            {copied?"Copied":"Copy"}
          </button>
          <button onClick={()=>pasteKeys(frame)} style={btnStyle("#1a1f2e")}>Paste</button>
        </div>

        {/* Dope sheet toggle */}
        <button onClick={()=>setShowDope(s=>!s)}
          style={btnStyle(showDope?C.teal:"#1a1f2e",showDope?"#06060f":C.dim)}>
          Dope
        </button>
      </div>

      {/* Scrubber */}
      <div ref={scrubberRef} onClick={onScrubberClick}
        style={{position:"relative",height:20,background:"#0a0a12",cursor:"col-resize",
          borderBottom:`1px solid ${C.border}`}}>
        {/* Frame ticks */}
        {Array.from({length:Math.min(30,frameEnd-frameStart+1)},(_,i)=>{
          const step = Math.ceil((frameEnd-frameStart)/30);
          const f    = frameStart + i*step;
          const pct  = ((f-frameStart)/(frameEnd-frameStart))*100;
          return (
            <div key={f} style={{position:"absolute",left:`${pct}%`,top:0,
              height:"100%",borderLeft:`1px solid ${C.border}`}}>
              <span style={{position:"absolute",top:2,left:2,fontSize:7,color:C.dim}}>{f}</span>
            </div>
          );
        })}
        {/* Playhead */}
        <div style={{position:"absolute",left:`${scrubberPos}%`,top:0,
          width:2,height:"100%",background:C.teal,zIndex:10,pointerEvents:"none"}}/>
      </div>

      {/* Dope sheet */}
      {showDope && (
        <div style={{maxHeight:120,overflowY:"auto"}}>
          {objects.filter(o=>keys[o.id]).map(obj=>(
            <div key={obj.id}>
              <div style={{padding:"2px 8px",background:"#0d1117",
                borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}>
                <span style={{color:C.grey,fontSize:9,fontWeight:700}}>{obj.name}</span>
                <span style={{color:C.dim,fontSize:9}}>{
                  Object.keys(keys[obj.id]||{}).reduce((s,ch)=>s+Object.keys(keys[obj.id][ch]).length,0)
                } keys</span>
              </div>
              {Object.keys(keys[obj.id]||{}).map(ch=>(
                <div key={ch} style={{position:"relative",height:18,
                  borderBottom:`1px solid ${C.border}22`,display:"flex",alignItems:"center"}}>
                  <span style={{color:C.dim,fontSize:8,width:80,paddingLeft:16,flexShrink:0}}>{ch}</span>
                  <div style={{flex:1,position:"relative",height:"100%"}}>
                    {Object.keys(keys[obj.id][ch]).map(Number).map(f=>{
                      const pct = ((f-frameStart)/(frameEnd-frameStart))*100;
                      const sel = selectedKeys.some(k=>k.objId===obj.id&&k.property===ch&&k.frame===f);
                      return (
                        <div key={f}
                          onClick={()=>setSelectedKeys([{objId:obj.id,property:ch,frame:f}])}
                          style={{position:"absolute",left:`${pct}%`,top:"50%",
                            transform:"translate(-50%,-50%) rotate(45deg)",
                            width:6,height:6,cursor:"pointer",
                            background:sel?C.orange:C.teal,
                            border:`1px solid ${sel?"#fff":C.teal}44`}}/>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {/* Shape key channels */}
          {shapeKeys.slice(1).map(key=>(
            <div key={key.id} style={{position:"relative",height:18,
              borderBottom:`1px solid ${C.border}22`,display:"flex",alignItems:"center"}}>
              <span style={{color:"#8844ff",fontSize:8,width:80,paddingLeft:16,flexShrink:0}}>
                sk:{key.name}
              </span>
              <div style={{flex:1,position:"relative",height:"100%"}}>
                {Object.keys(keys["shapekey_"+key.id]?.value||{}).map(Number).map(f=>{
                  const pct = ((f-frameStart)/(frameEnd-frameStart))*100;
                  return (
                    <div key={f} style={{position:"absolute",left:`${pct}%`,top:"50%",
                      transform:"translate(-50%,-50%) rotate(45deg)",
                      width:6,height:6,background:"#8844ff"}}/>
                  );
                })}
              </div>
            </div>
          ))}
          {!objects.some(o=>keys[o.id]) && shapeKeys.length < 2 && (
            <div style={{padding:"8px 12px",color:C.dim,fontSize:9}}>
              No keyframes yet. Select an object and click + Key.
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{padding:"3px 12px",display:"flex",gap:12,borderTop:`1px solid ${C.border}`}}>
        <span style={{color:C.dim,fontSize:8}}>Objects: {objects.length}</span>
        <span style={{color:C.dim,fontSize:8}}>Keys: {totalKeys}</span>
        <span style={{color:C.dim,fontSize:8}}>Channels: {activeChannels.length}</span>
        <span style={{color:C.dim,fontSize:8}}>Interp: {interp}</span>
        {selectedKeys.length > 0 && (
          <span style={{color:C.orange,fontSize:8}}>Selected: {selectedKeys.length} key(s)</span>
        )}
      </div>
    </div>
  );
}

function btnStyle(bg="#1a1f2e", color="#dde6ef", fontSize=10) {
  return {
    background:bg, border:"none", color, borderRadius:3,
    padding:"3px 8px", cursor:"pointer", fontSize, fontWeight:700,
  };
}

export default AnimationTimeline;
