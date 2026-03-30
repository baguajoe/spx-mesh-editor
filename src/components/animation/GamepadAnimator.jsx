import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

const C = {
  bg:"#06060f", panel:"#0a0a14", border:"#1a2a3a",
  teal:"#00ffc8", orange:"#FF6600", muted:"#5a7088",
  text:"#ccc", danger:"#ff4444", warn:"#ffaa00", purple:"#aa44ff",
};

const S = {
  wrap:    { display:"flex", flexDirection:"column", height:"100%", background:C.bg, fontFamily:"JetBrains Mono,monospace", fontSize:11, color:C.text, overflow:"hidden" },
  header:  { display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:C.panel, borderBottom:`1px solid ${C.border}`, flexShrink:0 },
  title:   { color:C.teal, fontWeight:700, fontSize:12, letterSpacing:1 },
  close:   { marginLeft:"auto", background:"none", border:`1px solid ${C.border}`, borderRadius:3, color:C.muted, cursor:"pointer", padding:"3px 8px" },
  tabs:    { display:"flex", background:C.panel, borderBottom:`1px solid ${C.border}`, flexShrink:0 },
  tab:     (a) => ({ padding:"6px 14px", border:"none", borderBottom:`2px solid ${a?C.teal:"transparent"}`, background:"transparent", color:a?C.teal:C.muted, cursor:"pointer", fontSize:10, fontWeight:a?700:400 }),
  body:    { flex:1, overflowY:"auto", padding:10 },
  sec:     { marginBottom:14 },
  sl:      { fontSize:9, color:C.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:5 },
  row:     { display:"flex", gap:6, alignItems:"center", marginBottom:6 },
  label:   { fontSize:10, color:C.muted, minWidth:100, flexShrink:0 },
  val:     { fontSize:10, color:C.teal, minWidth:40, textAlign:"right" },
  slider:  { flex:1, accentColor:C.teal, cursor:"pointer" },
  btn:     (col=C.teal,sm=false) => ({ padding:sm?"3px 8px":"5px 12px", border:`1px solid ${col}44`, borderRadius:3, background:`${col}11`, color:col, cursor:"pointer", fontSize:sm?9:10, fontWeight:600, fontFamily:"inherit" }),
  card:    (a,col=C.teal) => ({ padding:"8px 10px", borderRadius:4, border:`1px solid ${a?col:C.border}`, background:a?`${col}11`:C.panel, marginBottom:4, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }),
  stat:    { display:"flex", justifyContent:"space-between", padding:"3px 0", fontSize:10, borderBottom:`1px solid ${C.border}22` },
  warn:    { background:`${C.warn}11`, border:`1px solid ${C.warn}44`, borderRadius:3, padding:"6px 8px", fontSize:9, color:C.warn, marginBottom:8 },
  grid2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginBottom:8 },
  deadzone:{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:6, padding:12, marginBottom:8 },
  // Joystick visualizer
  stick:   { width:80, height:80, borderRadius:"50%", border:`2px solid ${C.border}`, background:"#0a0a14", position:"relative", flexShrink:0 },
  stickDot:(x,y) => ({ position:"absolute", width:14, height:14, borderRadius:"50%", background:C.teal, left:`calc(50% + ${x*30}px - 7px)`, top:`calc(50% - ${y*30}px - 7px)`, transition:"left 0.05s, top 0.05s", boxShadow:`0 0 8px ${C.teal}` }),
  axisBar: (v,col=C.teal) => ({ height:8, borderRadius:4, background:`${col}22`, overflow:"hidden", marginBottom:3, position:"relative" }),
  axisFill:(v,col=C.teal) => ({ position:"absolute", left: v >= 0 ? "50%" : `${50+v*50}%`, width:`${Math.abs(v)*50}%`, height:"100%", background:col, borderRadius:4, transition:"all 0.05s" }),
  mapCard: { background:C.panel, border:`1px solid ${C.border}`, borderRadius:4, padding:"8px 10px", marginBottom:4 },
  select:  { background:C.panel, border:`1px solid ${C.border}`, borderRadius:3, color:C.text, padding:"3px 6px", fontSize:10, fontFamily:"inherit", flex:1 },
  toggle:  (on) => ({ width:32, height:16, borderRadius:8, background:on?C.teal:C.panel, border:`1px solid ${on?C.teal:C.border}`, cursor:"pointer", position:"relative", flexShrink:0 }),
  dot:     (on) => ({ position:"absolute", top:2, left:on?16:2, width:10, height:10, borderRadius:"50%", background:on?C.bg:C.muted, transition:"left 0.2s" }),
  kfDot:   (col) => ({ width:8, height:8, borderRadius:"50%", background:col, display:"inline-block", marginRight:4 }),
};

// Axis mapping options
const AXIS_TARGETS = [
  { id:"none",          label:"— None —" },
  { id:"move_x",        label:"Move X" },
  { id:"move_y",        label:"Move Y" },
  { id:"move_z",        label:"Move Z" },
  { id:"rotate_y",      label:"Rotate Y" },
  { id:"head_x",        label:"Head Look X" },
  { id:"head_y",        label:"Head Look Y" },
  { id:"arm_l_x",       label:"L Arm X" },
  { id:"arm_l_y",       label:"L Arm Y" },
  { id:"arm_r_x",       label:"R Arm X" },
  { id:"arm_r_y",       label:"R Arm Y" },
  { id:"spine_x",       label:"Spine Bend X" },
  { id:"spine_y",       label:"Spine Bend Y" },
  { id:"blend_walk",    label:"Walk Blend" },
  { id:"blend_run",     label:"Run Blend" },
];

const BUTTON_ACTIONS = [
  { id:"none",          label:"— None —" },
  { id:"keyframe",      label:"Insert Keyframe" },
  { id:"walk",          label:"Walk Cycle" },
  { id:"run",           label:"Run Cycle" },
  { id:"jump",          label:"Jump" },
  { id:"punch_l",       label:"Punch Left" },
  { id:"punch_r",       label:"Punch Right" },
  { id:"kick",          label:"Kick" },
  { id:"block",         label:"Block" },
  { id:"dodge",         label:"Dodge Roll" },
  { id:"wave",          label:"Wave" },
  { id:"sit",           label:"Sit" },
  { id:"stand",         label:"Stand" },
  { id:"crouch",        label:"Crouch" },
  { id:"play_pause",    label:"Play / Pause" },
];

const DEFAULT_MAPPING = {
  axes: {
    0: "move_x",       // Left stick X → move
    1: "move_z",       // Left stick Y → forward/back
    2: "head_x",       // Right stick X → head look
    3: "head_y",       // Right stick Y → head look
  },
  buttons: {
    0: "keyframe",     // A/Cross → insert keyframe
    1: "jump",         // B/Circle → jump
    2: "punch_l",      // X/Square → punch
    3: "kick",         // Y/Triangle → kick
    4: "block",        // LB → block
    5: "punch_r",      // RB → punch right
    8: "play_pause",   // Select → play/pause
    9: "walk",         // Start → walk
  },
};

function Toggle({ value, onChange }) {
  return <div style={S.toggle(value)} onClick={() => onChange(!value)}><div style={S.dot(value)} /></div>;
}

function KS({ label, value, min, max, step=0.01, unit="", onChange }) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)} style={S.slider} />
      <span style={S.val}>{typeof value === "number" ? value.toFixed(2) : value}{unit}</span>
    </div>
  );
}

export default function GamepadAnimator({ open, onClose, sceneRef, meshRef, setStatus, onApplyFunction, currentFrame, setCurrentFrame, isPlaying, setIsPlaying }) {
  if (!open) return null;

  const [tab, setTab]             = useState("control");
  const [connected, setConnected] = useState(false);
  const [gpIndex, setGpIndex]     = useState(0);
  const [axes, setAxes]           = useState([0,0,0,0,0,0,0,0]);
  const [buttons, setButtons]     = useState(new Array(17).fill(false));
  const [mapping, setMapping]     = useState(DEFAULT_MAPPING);
  const [recording, setRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState([]);
  const [deadzone, setDeadzone]   = useState(0.12);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [smoothing, setSmoothing] = useState(0.8);
  const [invertY, setInvertY]     = useState(false);
  const [stats, setStats]         = useState({ keys:0, duration:0, fps:0 });
  const [gpName, setGpName]       = useState("—");

  const animRef     = useRef(null);
  const recordRef   = useRef(false);
  const keysRef     = useRef([]);
  const smoothAxes  = useRef([0,0,0,0,0,0,0,0]);
  const prevButtons = useRef(new Array(17).fill(false));
  const startTime   = useRef(null);
  const frameRef    = useRef(0);

  useEffect(() => { recordRef.current = recording; }, [recording]);

  // Detect gamepad connection
  useEffect(() => {
    const onConnect = (e) => {
      setConnected(true);
      setGpIndex(e.gamepad.index);
      setGpName(e.gamepad.id.substring(0, 40));
      setStatus?.(`🎮 Controller connected: ${e.gamepad.id.substring(0,30)}`);
    };
    const onDisconnect = () => {
      setConnected(false);
      setGpName("—");
      setStatus?.("Controller disconnected");
    };
    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);

    // Check if already connected
    const gps = navigator.getGamepads?.();
    if (gps) {
      for (let i = 0; i < gps.length; i++) {
        if (gps[i]) { setConnected(true); setGpIndex(i); setGpName(gps[i].id.substring(0,40)); break; }
      }
    }
    return () => {
      window.removeEventListener("gamepadconnected", onConnect);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
    };
  }, [setStatus]);

  // Main gamepad poll loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0, fpsTimer = 0;

    const poll = () => {
      animRef.current = requestAnimationFrame(poll);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      frameCount++; fpsTimer += dt;
      if (fpsTimer > 0.5) {
        setStats(s => ({ ...s, fps: Math.round(frameCount / fpsTimer) }));
        frameCount = 0; fpsTimer = 0;
      }

      const gps = navigator.getGamepads?.();
      if (!gps) return;
      const gp = gps[gpIndex];
      if (!gp) return;

      // Apply deadzone + smoothing
      const rawAxes = [...gp.axes];
      const newAxes = rawAxes.map((v, i) => {
        const dead = Math.abs(v) < deadzone ? 0 : v;
        const inv = (i === 3 && invertY) ? -dead : dead;
        const prev = smoothAxes.current[i] || 0;
        const smoothed = prev * smoothing + inv * (1 - smoothing);
        smoothAxes.current[i] = smoothed;
        return smoothed;
      });
      setAxes(newAxes);

      // Apply axis mappings to scene
      applyAxisMappings(newAxes, dt);

      // Button state + edge detection
      const newBtns = gp.buttons.map(b => b.pressed);
      newBtns.forEach((pressed, i) => {
        if (pressed && !prevButtons.current[i]) {
          // Button just pressed
          onButtonPress(i);
        }
      });
      prevButtons.current = newBtns;
      setButtons(newBtns);

      // Record keyframe if recording
      if (recordRef.current) {
        const elapsed = startTime.current ? (now - startTime.current) / 1000 : 0;
        const mesh = meshRef?.current;
        if (mesh && frameCount % 2 === 0) { // record at ~30fps
          keysRef.current.push({
            time: elapsed,
            frame: frameRef.current,
            pos: mesh.position.clone(),
            rot: mesh.rotation.clone(),
          });
          frameRef.current++;
          setStats(s => ({ ...s, keys: keysRef.current.length, duration: +elapsed.toFixed(1) }));
        }
      }
    };
    poll();
    return () => cancelAnimationFrame(animRef.current);
  }, [gpIndex, deadzone, smoothing, sensitivity, invertY, mapping]);

  const applyAxisMappings = useCallback((axisValues, dt) => {
    const mesh = meshRef?.current;
    const scene = sceneRef?.current;
    if (!mesh && !scene) return;

    axisValues.forEach((val, axisIdx) => {
      if (Math.abs(val) < 0.001) return;
      const target = mapping.axes[axisIdx];
      const spd = val * sensitivity * dt * 3;

      if (!target || target === "none") return;
      if (mesh) {
        if (target === "move_x")   mesh.position.x += spd;
        if (target === "move_y")   mesh.position.y += spd;
        if (target === "move_z")   mesh.position.z += spd;
        if (target === "rotate_y") mesh.rotation.y += spd;
        if (target === "spine_x")  mesh.rotation.z += spd * 0.3;
        if (target === "spine_y")  mesh.rotation.x += spd * 0.3;

        // Head look — find head bone
        if (target === "head_x" || target === "head_y") {
          mesh.traverse(child => {
            if (child.isBone && (child.name.toLowerCase().includes("head") || child.name.toLowerCase().includes("neck"))) {
              if (target === "head_x") child.rotation.y += spd * 0.5;
              if (target === "head_y") child.rotation.x += spd * 0.3;
            }
          });
        }

        // Arm IK
        if (target === "arm_l_x" || target === "arm_l_y") {
          mesh.traverse(child => {
            if (child.isBone && child.name.toLowerCase().includes("arm") && child.name.toLowerCase().includes("l")) {
              if (target === "arm_l_x") child.rotation.z += spd * 0.4;
              if (target === "arm_l_y") child.rotation.x += spd * 0.4;
            }
          });
        }
        if (target === "arm_r_x" || target === "arm_r_y") {
          mesh.traverse(child => {
            if (child.isBone && child.name.toLowerCase().includes("arm") && child.name.toLowerCase().includes("r")) {
              if (target === "arm_r_x") child.rotation.z += spd * 0.4;
              if (target === "arm_r_y") child.rotation.x += spd * 0.4;
            }
          });
        }
      }
    });
  }, [meshRef, sceneRef, mapping, sensitivity]);

  const onButtonPress = useCallback((btnIdx) => {
    const action = mapping.buttons[btnIdx];
    if (!action || action === "none") return;

    if (action === "keyframe") {
      onApplyFunction?.("add_keyframe");
      setStatus?.(`🔴 Keyframe inserted at frame ${frameRef.current}`);
    } else if (action === "play_pause") {
      setIsPlaying?.(v => !v);
    } else if (action === "walk")    { onApplyFunction?.("walk_gen"); setStatus?.("Walk cycle"); }
    else if (action === "jump")      { const m = meshRef?.current; if (m) { m.position.y += 0.5; setTimeout(() => { if(m) m.position.y -= 0.5; }, 300); } setStatus?.("Jump"); }
    else if (action === "punch_l")   { onApplyFunction?.("ai_anim_assist"); setStatus?.("Punch L"); }
    else if (action === "punch_r")   { setStatus?.("Punch R"); }
    else if (action === "kick")      { setStatus?.("Kick"); }
    else if (action === "block")     { setStatus?.("Block"); }
    else if (action === "dodge")     { setStatus?.("Dodge"); }
    else if (action === "sit")       { setStatus?.("Sit"); }
    else if (action === "stand")     { setStatus?.("Stand"); }
    else if (action === "crouch")    { setStatus?.("Crouch"); }
    else if (action === "wave")      { setStatus?.("Wave"); }
    else if (action === "run")       { setStatus?.("Run"); }
  }, [mapping, meshRef, onApplyFunction, setStatus, setIsPlaying]);

  const startRecording = () => {
    keysRef.current = [];
    frameRef.current = 0;
    startTime.current = performance.now();
    setRecordedKeys([]);
    setRecording(true);
    setIsPlaying?.(true);
    setStatus?.("🔴 Recording — move controller to animate");
  };

  const stopRecording = () => {
    setRecording(false);
    setIsPlaying?.(false);
    setRecordedKeys([...keysRef.current]);
    setStatus?.(`⏹ Recording stopped — ${keysRef.current.length} keyframes`);
  };

  const exportAnimation = () => {
    const data = { keyframes: keysRef.current.map(k => ({ time: k.time, frame: k.frame, pos: k.pos.toArray(), rot: [k.rot.x, k.rot.y, k.rot.z] })), mapping, fps: 30 };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gamepad_anim.json"; a.click();
  };

  const setAxisMap = (axisIdx, target) => {
    setMapping(prev => ({ ...prev, axes: { ...prev.axes, [axisIdx]: target } }));
  };

  const setButtonMap = (btnIdx, action) => {
    setMapping(prev => ({ ...prev, buttons: { ...prev.buttons, [btnIdx]: action } }));
  };

  const lx = axes[0] || 0, ly = -(axes[1] || 0);
  const rx = axes[2] || 0, ry = -(axes[3] || 0);

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={S.title}>🎮 GAMEPAD ANIMATOR</span>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>

      <div style={S.tabs}>
        {[["control","Control"],["mapping","Mapping"],["record","Record"]].map(([id,label]) => (
          <button key={id} style={S.tab(tab===id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div style={S.body}>

        {tab === "control" && (<>
          {/* Connection status */}
          <div style={{ ...S.card(connected, connected ? C.teal : C.danger), marginBottom:10 }}>
            <span style={{fontSize:20}}>{connected ? "🎮" : "🔌"}</span>
            <div>
              <div style={{fontWeight:700, color:connected?C.teal:C.danger}}>{connected ? "CONNECTED" : "NO CONTROLLER"}</div>
              <div style={{fontSize:9, color:C.muted}}>{connected ? gpName : "Plug in Xbox / PS / any gamepad"}</div>
            </div>
            <div style={{marginLeft:"auto", fontSize:9, color:C.muted}}>{stats.fps} fps</div>
          </div>

          {!connected && (
            <div style={S.warn}>
              Connect an Xbox, PlayStation, or generic USB/Bluetooth gamepad. Press any button after connecting to activate it.
            </div>
          )}

          {/* Stick visualizers */}
          <div style={S.sec}>
            <div style={S.sl}>Analog Sticks</div>
            <div style={{display:"flex", gap:16, alignItems:"center", marginBottom:10}}>
              <div>
                <div style={{fontSize:9, color:C.muted, marginBottom:4, textAlign:"center"}}>LEFT</div>
                <div style={S.stick}>
                  <div style={S.stickDot(lx, ly)} />
                </div>
              </div>
              <div style={{flex:1}}>
                {["LX","LY","RX","RY"].map((name, i) => (
                  <div key={name} style={{marginBottom:5}}>
                    <div style={{fontSize:8, color:C.muted, marginBottom:2, display:"flex", justifyContent:"space-between"}}>
                      <span>{name}</span>
                      <span style={{color:C.teal}}>{(axes[i]||0).toFixed(2)}</span>
                    </div>
                    <div style={S.axisBar(axes[i]||0)}>
                      <div style={S.axisFill(axes[i]||0)} />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:9, color:C.muted, marginBottom:4, textAlign:"center"}}>RIGHT</div>
                <div style={S.stick}>
                  <div style={S.stickDot(rx, ry)} />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={S.sec}>
            <div style={S.sl}>Buttons</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:4}}>
              {["A","B","X","Y","LB","RB","LT","RT","Sel","St","LS","RS","↑","↓","←","→"].map((label, i) => (
                <div key={i} style={{
                  padding:"3px 6px", borderRadius:3, fontSize:9, fontWeight:700,
                  background: buttons[i] ? `${C.teal}33` : C.panel,
                  border: `1px solid ${buttons[i] ? C.teal : C.border}`,
                  color: buttons[i] ? C.teal : C.muted,
                  minWidth:24, textAlign:"center",
                  transition:"all 0.05s",
                }}>{label}</div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div style={S.sec}>
            <div style={S.sl}>Settings</div>
            <KS label="Deadzone" value={deadzone} min={0} max={0.5} step={0.01} onChange={setDeadzone} />
            <KS label="Sensitivity" value={sensitivity} min={0.1} max={5} step={0.1} onChange={setSensitivity} />
            <KS label="Smoothing" value={smoothing} min={0} max={0.99} step={0.01} onChange={setSmoothing} />
            <div style={{...S.row, justifyContent:"space-between"}}>
              <span style={S.label}>Invert Y</span>
              <Toggle value={invertY} onChange={setInvertY} />
            </div>
          </div>
        </>)}

        {tab === "mapping" && (<>
          <div style={S.sec}>
            <div style={S.sl}>Axis Mapping</div>
            {[0,1,2,3].map(i => (
              <div key={i} style={S.mapCard}>
                <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
                  <span style={{fontSize:10, color:C.orange, minWidth:60}}>
                    {["L-Stick X","L-Stick Y","R-Stick X","R-Stick Y"][i]}
                  </span>
                  <div style={{fontSize:9, color:C.teal}}>{(axes[i]||0).toFixed(2)}</div>
                </div>
                <select style={S.select} value={mapping.axes[i] || "none"} onChange={e => setAxisMap(i, e.target.value)}>
                  {AXIS_TARGETS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Button Mapping</div>
            {[0,1,2,3,4,5,8,9].map(i => (
              <div key={i} style={S.mapCard}>
                <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
                  <div style={{
                    padding:"2px 6px", borderRadius:3, fontSize:9, fontWeight:700,
                    background: buttons[i] ? `${C.teal}33` : C.panel,
                    border: `1px solid ${buttons[i] ? C.teal : C.border}`,
                    color: buttons[i] ? C.teal : C.muted,
                    minWidth:28, textAlign:"center",
                  }}>{["A","B","X","Y","LB","RB","","","Sel","St"][i]}</div>
                  <span style={{fontSize:9, color:C.muted}}>Button {i}</span>
                </div>
                <select style={S.select} value={mapping.buttons[i] || "none"} onChange={e => setButtonMap(i, e.target.value)}>
                  {BUTTON_ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Quick Presets</div>
            {[
              { label:"Fight / Combat",   axes:{0:"move_x",1:"move_z",2:"head_x",3:"head_y"}, buttons:{0:"keyframe",1:"kick",2:"punch_l",3:"punch_r",4:"block",5:"dodge"} },
              { label:"Walk & Explore",   axes:{0:"move_x",1:"move_z",2:"rotate_y",3:"head_y"}, buttons:{0:"keyframe",1:"jump",2:"walk",3:"run",8:"play_pause"} },
              { label:"Character Poser",  axes:{0:"arm_l_x",1:"arm_l_y",2:"arm_r_x",3:"arm_r_y"}, buttons:{0:"keyframe",4:"spine_x",5:"head_x",9:"play_pause"} },
            ].map(p => (
              <div key={p.label} style={S.card(false)} onClick={() => { setMapping({ axes:p.axes, buttons:p.buttons }); setStatus?.(`Mapping: ${p.label}`); }}>
                <span style={{fontSize:10}}>{p.label}</span>
              </div>
            ))}
          </div>
        </>)}

        {tab === "record" && (<>
          <div style={S.sec}>
            <div style={S.sl}>Recording</div>

            {!connected && <div style={S.warn}>Connect a controller first</div>}

            <div style={{
              background:C.panel, border:`2px solid ${recording ? C.danger : C.border}`,
              borderRadius:6, padding:12, marginBottom:10, textAlign:"center",
            }}>
              {recording ? (
                <>
                  <div style={{fontSize:24, marginBottom:4}}>🔴</div>
                  <div style={{color:C.danger, fontWeight:700, fontSize:12}}>RECORDING</div>
                  <div style={{fontSize:10, color:C.muted, marginTop:4}}>{stats.keys} keyframes · {stats.duration}s</div>
                </>
              ) : (
                <>
                  <div style={{fontSize:24, marginBottom:4}}>⏺</div>
                  <div style={{color:C.muted, fontSize:11}}>Ready to record</div>
                  <div style={{fontSize:9, color:C.muted, marginTop:4}}>{keysRef.current.length} keyframes captured</div>
                </>
              )}
            </div>

            <div style={{display:"flex", gap:6, marginBottom:10}}>
              <button style={S.btn(C.danger)} onClick={startRecording} disabled={recording || !connected}>🔴 RECORD</button>
              <button style={S.btn(C.orange)} onClick={stopRecording} disabled={!recording}>⏹ STOP</button>
              <button style={S.btn(C.teal)} onClick={exportAnimation} disabled={keysRef.current.length === 0}>💾 EXPORT</button>
            </div>

            <div style={{fontSize:9, color:C.muted, lineHeight:1.8}}>
              1. Select your character/mesh<br/>
              2. Hit RECORD<br/>
              3. Move controller — character follows in real-time<br/>
              4. Press A (Button 0) to insert keyframes while moving<br/>
              5. Hit STOP when done<br/>
              6. EXPORT saves animation as JSON
            </div>
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Stats</div>
            {[
              ["Keyframes", stats.keys],
              ["Duration", `${stats.duration}s`],
              ["Controller FPS", stats.fps],
              ["Status", recording ? "● RECORDING" : connected ? "Ready" : "No controller"],
            ].map(([k,v]) => (
              <div key={k} style={S.stat}>
                <span style={{color:C.muted}}>{k}</span>
                <span style={{color: k==="Status" ? (recording?C.danger:connected?C.teal:C.muted) : C.text}}>{v}</span>
              </div>
            ))}
          </div>

          <div style={S.sec}>
            <div style={S.sl}>iClone-style Tips</div>
            <div style={{fontSize:9, color:C.muted, lineHeight:1.8}}>
              🎯 Fight scene: Use "Fight / Combat" preset. Map punches to face buttons, movement to left stick.<br/><br/>
              🚶 Walk cycle: Use "Walk & Explore" preset. Push left stick forward to play walk animation.<br/><br/>
              💃 Dance: Map both sticks to arm bones. Move naturally while recording.<br/><br/>
              📸 Posing: Use "Character Poser" preset. Each stick controls an arm independently.
            </div>
          </div>
        </>)}

      </div>
    </div>
  );
}
