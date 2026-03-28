
// LightingCameraPanel.jsx — Add/manage lights + cameras in the 3D scene
import React, { useState, useCallback } from "react";
import {
  LIGHT_TYPES, TEMPERATURE_PRESETS, HDRI_PRESETS,
  createLight, createThreePointLighting, applyTemperature,
  createVolumericFog, removeFog, applyHDRI,
  addLightHelper, getSceneLights,
} from "../../mesh/LightSystem.js";
import {
  createCamera, createCameraManager, saveBookmark, restoreBookmark,
  setDOF, applyCameraShake, rackFocus, dollyZoom, serializeCamera,
} from "../../mesh/CameraSystem.js";
import { addPointLight, addSpotLight, createTightLightingRig } from "../../mesh/LightingRuntime.js";

const S = {
  overlay: { position:"fixed",inset:0,zIndex:8800,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"stretch",justifyContent:"flex-end" },
  panel: { width:420,background:"#0d1117",borderLeft:"1px solid #21262d",display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"JetBrains Mono,monospace",fontSize:12 },
  header: { display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:"1px solid #21262d",flexShrink:0 },
  logo: { background:"#00ffc8",color:"#000",fontSize:10,fontWeight:800,padding:"2px 6px",borderRadius:4 },
  tabs: { display:"flex",gap:4,padding:"8px 12px",borderBottom:"1px solid #21262d",flexShrink:0 },
  tab: { padding:"5px 12px",borderRadius:6,border:"1px solid #21262d",background:"transparent",color:"#6b7280",fontSize:11,cursor:"pointer" },
  tabA: { padding:"5px 12px",borderRadius:6,border:"1px solid #00ffc8",background:"rgba(0,255,200,0.1)",color:"#00ffc8",fontSize:11,cursor:"pointer" },
  body: { flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:14 },
  label: { fontSize:10,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",marginBottom:4 },
  btn: { padding:"5px 12px",borderRadius:6,border:"1px solid #21262d",background:"#1a1a2e",color:"#e0e0e0",cursor:"pointer",fontSize:11 },
  btnA: { padding:"5px 12px",borderRadius:6,border:"1px solid #00ffc8",background:"rgba(0,255,200,0.1)",color:"#00ffc8",cursor:"pointer",fontSize:11 },
  btnO: { padding:"5px 12px",borderRadius:6,border:"1px solid #FF6600",background:"rgba(255,102,0,0.1)",color:"#FF6600",cursor:"pointer",fontSize:11 },
  row: { display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" },
  input: { background:"#0d1117",border:"1px solid #21262d",borderRadius:6,color:"#e0e0e0",padding:"5px 8px",fontSize:11,width:"100%",boxSizing:"border-box" },
  select: { background:"#0d1117",border:"1px solid #21262d",borderRadius:6,color:"#e0e0e0",padding:"5px 8px",fontSize:11,width:"100%" },
  slider: { width:"100%",accentColor:"#00ffc8" },
  close: { marginLeft:"auto",padding:"4px 10px",border:"1px solid #21262d",borderRadius:6,background:"transparent",color:"#6b7280",cursor:"pointer" },
  lightItem: { padding:"8px 10px",borderRadius:6,border:"1px solid #21262d",background:"#0d1117",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 },
  dot: (color) => ({ width:10,height:10,borderRadius:"50%",background:color,flexShrink:0 }),
};

function Slider({ label, value, min, max, step=0.01, onChange }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
      <span style={{color:"#6b7280",width:90,flexShrink:0}}>{label}</span>
      <input type="range" style={S.slider} min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} />
      <span style={{color:"#e0e0e0",width:36,textAlign:"right"}}>{typeof value==="number"?value.toFixed(2):value}</span>
    </div>
  );
}

export default function LightingCameraPanel({ open, onClose, sceneRef, cameraRef, setStatus }) {
  const [tab, setTab] = useState("lights");

  // Lighting state
  const [lightType, setLightType] = useState("point");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [lightX, setLightX] = useState(0);
  const [lightY, setLightY] = useState(3);
  const [lightZ, setLightZ] = useState(3);
  const [lightTemp, setLightTemp] = useState("daylight");
  const [sceneLights, setSceneLights] = useState([]);
  const [hdriPreset, setHdriPreset] = useState("studio");
  const [fogColor, setFogColor] = useState("#aabbcc");
  const [fogDensity, setFogDensity] = useState(0.02);
  const [fogEnabled, setFogEnabled] = useState(false);

  // Camera state
  const [bookmarkName, setBookmarkName] = useState("Shot_1");
  const [bookmarks, setBookmarks] = useState([]);
  const [dofEnabled, setDofEnabled] = useState(false);
  const [dofFocus, setDofFocus] = useState(5.0);
  const [dofAperture, setDofAperture] = useState(0.025);
  const [shakeIntensity, setShakeIntensity] = useState(0.05);

  const refreshLights = useCallback(() => {
    if (sceneRef?.current) {
      setSceneLights(getSceneLights(sceneRef.current));
    }
  }, [sceneRef]);

  const addLight = () => {
    if (!sceneRef?.current) return;
    const light = createLight(lightType, {
      color: lightColor,
      intensity: lightIntensity,
      position: { x: lightX, y: lightY, z: lightZ },
    });
    applyTemperature(light.light || light, Object.values(TEMPERATURE_PRESETS).find((_,i) => Object.keys(TEMPERATURE_PRESETS)[i] === lightTemp) || 6500);
    sceneRef.current.add(light.light || light);
    addLightHelper(sceneRef.current, light.light || light);
    refreshLights();
    setStatus("Added " + lightType + " light");
  };

  const addThreePoint = () => {
    if (!sceneRef?.current) return;
    createThreePointLighting(sceneRef.current, lightIntensity);
    refreshLights();
    setStatus("Three-point lighting added");
  };

  const addTightRig = () => {
    if (!sceneRef?.current) return;
    createTightLightingRig(sceneRef.current);
    refreshLights();
    setStatus("Tight lighting rig added");
  };

  const applyHDRIPreset = () => {
    if (!sceneRef?.current) return;
    applyHDRI(sceneRef.current, hdriPreset);
    setStatus("HDRI applied: " + hdriPreset);
  };

  const toggleFog = () => {
    if (!sceneRef?.current) return;
    if (fogEnabled) {
      removeFog(sceneRef.current);
      setFogEnabled(false);
      setStatus("Fog removed");
    } else {
      createVolumericFog(sceneRef.current, { color: fogColor, density: fogDensity });
      setFogEnabled(true);
      setStatus("Fog added");
    }
  };

  const saveBookmarkFn = () => {
    if (!cameraRef?.current) return;
    saveBookmark(cameraRef.current, bookmarkName);
    setBookmarks(prev => [...prev, bookmarkName]);
    setStatus("Bookmark saved: " + bookmarkName);
  };

  const restoreBookmarkFn = (name) => {
    if (!cameraRef?.current) return;
    restoreBookmark(cameraRef.current, name);
    setStatus("Restored: " + name);
  };

  const applyDOF = () => {
    if (!cameraRef?.current) return;
    setDOF(cameraRef.current, { enabled: dofEnabled, focus: dofFocus, aperture: dofAperture });
    setStatus("DOF " + (dofEnabled ? "enabled" : "disabled"));
  };

  const shake = () => {
    if (!cameraRef?.current) return;
    applyCameraShake(cameraRef.current, { intensity: shakeIntensity, duration: 0.5 });
    setStatus("Camera shake applied");
  };

  if (!open) return null;
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e => e.stopPropagation()}>
        <div style={S.header}>
          <span style={S.logo}>SPX</span>
          <strong style={{color:"#e0e0e0"}}>Lighting & Camera</strong>
          <button style={S.close} onClick={onClose}>✕</button>
        </div>

        <div style={S.tabs}>
          {[["lights","💡 Lights"],["env","🌍 Environment"],["camera","🎥 Camera"]].map(([id,lbl]) => (
            <button key={id} style={tab===id?S.tabA:S.tab} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>

        <div style={S.body}>

          {/* ── LIGHTS TAB ── */}
          {tab === "lights" && <>
            <div>
              <div style={S.label}>Light Type</div>
              <select style={S.select} value={lightType} onChange={e => setLightType(e.target.value)}>
                {["point","spot","directional","area","ambient","hemisphere"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div style={S.row}>
              <div>
                <div style={S.label}>Color</div>
                <input type="color" value={lightColor} onChange={e => setLightColor(e.target.value)}
                  style={{width:44,height:32,borderRadius:6,border:"1px solid #21262d",cursor:"pointer",background:"none"}} />
              </div>
              <div style={{flex:1}}>
                <div style={S.label}>Temperature</div>
                <select style={S.select} value={lightTemp} onChange={e => setLightTemp(e.target.value)}>
                  {Object.keys(TEMPERATURE_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            <Slider label="Intensity" value={lightIntensity} min={0} max={10} onChange={setLightIntensity} />
            <Slider label="X" value={lightX} min={-10} max={10} onChange={setLightX} />
            <Slider label="Y" value={lightY} min={-10} max={10} onChange={setLightY} />
            <Slider label="Z" value={lightZ} min={-10} max={10} onChange={setLightZ} />

            <div style={S.row}>
              <button style={S.btnA} onClick={addLight}>+ Add Light</button>
              <button style={S.btn} onClick={addThreePoint}>☀ 3-Point</button>
              <button style={S.btn} onClick={addTightRig}>🎬 Tight Rig</button>
            </div>

            <div>
              <div style={S.label}>Scene Lights ({sceneLights.length})</div>
              <button style={{...S.btn,marginBottom:6}} onClick={refreshLights}>↻ Refresh</button>
              {sceneLights.map((l, i) => (
                <div key={i} style={S.lightItem}>
                  <div style={S.row}>
                    <div style={S.dot(l.color?.getStyle?.() || "#fff")} />
                    <span style={{color:"#e0e0e0"}}>{l.type || "Light"}</span>
                  </div>
                  <span style={{color:"#6b7280"}}>{(l.intensity || 0).toFixed(2)}</span>
                </div>
              ))}
              {sceneLights.length === 0 && <div style={{color:"#6b7280",fontSize:11}}>No lights in scene</div>}
            </div>
          </>}

          {/* ── ENVIRONMENT TAB ── */}
          {tab === "env" && <>
            <div>
              <div style={S.label}>HDRI Preset</div>
              <select style={S.select} value={hdriPreset} onChange={e => setHdriPreset(e.target.value)}>
                {(HDRI_PRESETS || []).map(p => (
                  <option key={p.id || p} value={p.id || p}>{p.label || p}</option>
                ))}
              </select>
              <button style={{...S.btnA,marginTop:8,width:"100%"}} onClick={applyHDRIPreset}>Apply HDRI</button>
            </div>

            <div>
              <div style={S.label}>Volumetric Fog</div>
              <div style={S.row}>
                <input type="color" value={fogColor} onChange={e => setFogColor(e.target.value)}
                  style={{width:44,height:32,borderRadius:6,border:"1px solid #21262d",cursor:"pointer",background:"none"}} />
                <div style={{flex:1}}>
                  <Slider label="Density" value={fogDensity} min={0} max={0.1} step={0.001} onChange={setFogDensity} />
                </div>
              </div>
              <button style={fogEnabled ? S.btnO : S.btnA} onClick={toggleFog}>
                {fogEnabled ? "Remove Fog" : "Add Fog"}
              </button>
            </div>
          </>}

          {/* ── CAMERA TAB ── */}
          {tab === "camera" && <>
            <div>
              <div style={S.label}>Bookmarks</div>
              <div style={S.row}>
                <input style={{...S.input,flex:1}} value={bookmarkName} onChange={e => setBookmarkName(e.target.value)} placeholder="Shot name" />
                <button style={S.btnA} onClick={saveBookmarkFn}>💾 Save</button>
              </div>
              {bookmarks.length > 0 && (
                <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
                  {bookmarks.map((b,i) => (
                    <div key={i} style={S.lightItem}>
                      <span style={{color:"#e0e0e0"}}>{b}</span>
                      <button style={S.btn} onClick={() => restoreBookmarkFn(b)}>▶ Go</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={S.label}>Depth of Field</div>
              <label style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,cursor:"pointer"}}>
                <input type="checkbox" checked={dofEnabled} onChange={e => setDofEnabled(e.target.checked)} />
                <span style={{color:"#e0e0e0"}}>Enable DOF</span>
              </label>
              <Slider label="Focus" value={dofFocus} min={0.1} max={50} onChange={setDofFocus} />
              <Slider label="Aperture" value={dofAperture} min={0.001} max={0.1} step={0.001} onChange={setDofAperture} />
              <button style={S.btnA} onClick={applyDOF}>Apply DOF</button>
            </div>

            <div>
              <div style={S.label}>Camera FX</div>
              <Slider label="Shake" value={shakeIntensity} min={0} max={0.5} onChange={setShakeIntensity} />
              <div style={S.row}>
                <button style={S.btn} onClick={shake}>📳 Camera Shake</button>
              </div>
            </div>
          </>}

        </div>
      </div>
    </div>
  );
}
