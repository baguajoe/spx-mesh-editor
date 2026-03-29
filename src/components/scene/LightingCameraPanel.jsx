// LightingCameraPanel.jsx — Professional Lighting & Camera System
// 4 tabs: Lights | Environment | Camera | Render Settings
// 13 lighting rigs, 14 HDRI presets, 13 lens presets, 16 camera moves
import React, { useState, useCallback, useEffect } from "react";
import {
  TEMPERATURE_PRESETS, HDRI_PRESETS,
  createLight, createThreePointLighting, applyTemperature,
  createVolumericFog, removeFog, applyHDRI,
  addLightHelper, getSceneLights,
} from "../../mesh/LightSystem.js";
import {
  createCamera, saveBookmark, restoreBookmark,
  setDOF, applyCameraShake, rackFocus, dollyZoom,
  animateCameraToBookmark,
} from "../../mesh/CameraSystem.js";
import { createTightLightingRig } from "../../mesh/LightingRuntime.js";

const C = { bg:"#06060f", panel:"#0a0a14", border:"#1a2a3a", teal:"#00ffc8", orange:"#FF6600", muted:"#5a7088", text:"#ccc", danger:"#ff4444", warn:"#ffaa00" };
const S = {
  wrap:    { display:"flex", flexDirection:"column", height:"100%", background:C.bg, fontFamily:"JetBrains Mono,monospace", fontSize:11, color:C.text, overflow:"hidden" },
  header:  { display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:C.panel, borderBottom:`1px solid ${C.border}`, flexShrink:0 },
  tabs:    { display:"flex", gap:0, background:C.panel, borderBottom:`1px solid ${C.border}`, flexShrink:0, overflowX:"auto" },
  tab:     (a) => ({ padding:"7px 14px", border:"none", borderBottom:`2px solid ${a?C.teal:"transparent"}`, background:"transparent", color:a?C.teal:C.muted, cursor:"pointer", fontSize:10, fontWeight:a?700:400, whiteSpace:"nowrap" }),
  body:    { flex:1, overflowY:"auto", padding:10 },
  sec:     { marginBottom:14 },
  sl:      { fontSize:9, color:C.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:5 },
  row:     { display:"flex", gap:6, alignItems:"center", marginBottom:6, flexWrap:"wrap" },
  input:   { background:C.panel, border:`1px solid ${C.border}`, borderRadius:3, color:C.text, padding:"4px 7px", fontSize:11, fontFamily:"inherit", flex:1, minWidth:60 },
  select:  { background:C.panel, border:`1px solid ${C.border}`, borderRadius:3, color:C.text, padding:"4px 7px", fontSize:11, fontFamily:"inherit", width:"100%", cursor:"pointer" },
  num:     { width:54, background:C.panel, border:`1px solid ${C.border}`, borderRadius:3, color:C.teal, padding:"4px 6px", fontSize:11, fontFamily:"inherit", textAlign:"center" },
  cp:      { width:30, height:24, borderRadius:3, border:`1px solid ${C.border}`, cursor:"pointer", background:"none", padding:1 },
  close:   { marginLeft:"auto", background:"none", border:`1px solid ${C.border}`, borderRadius:3, color:C.muted, cursor:"pointer", padding:"3px 8px", fontSize:12 },
  btn:     (col=C.teal,sm=false) => ({ padding:sm?"3px 8px":"5px 10px", border:`1px solid ${col}44`, borderRadius:3, background:`${col}11`, color:col, cursor:"pointer", fontSize:sm?9:10, fontWeight:600, fontFamily:"inherit" }),
  card:    (a) => ({ padding:"7px 10px", borderRadius:4, border:`1px solid ${a?C.teal:C.border}`, background:a?`${C.teal}11`:C.panel, marginBottom:3, cursor:"pointer" }),
  grid2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:3, marginBottom:8 },
  chk:     { display:"flex", alignItems:"center", gap:5, marginBottom:5, cursor:"pointer", fontSize:10, color:C.text },
};

function KS({ label, value, min, max, step=0.01, unit="", onChange, color=C.teal }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
      <span style={{ color:C.muted, width:78, flexShrink:0, fontSize:10 }}>{label}</span>
      <input type="range" style={{ flex:1, accentColor:color, cursor:"pointer" }} min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} />
      <input type="number" style={S.num} min={min} max={max} step={step} value={typeof value==="number"?+value.toFixed(3):value} onChange={e=>onChange(Number(e.target.value))} />
      {unit&&<span style={{color:C.muted,fontSize:9,width:18}}>{unit}</span>}
    </div>
  );
}

function LCard({ light, sel, onSel, onDel, onTog }) {
  const tc = { PointLight:"#ffaa00", SpotLight:"#00aaff", DirectionalLight:"#fff", AmbientLight:"#aaf", HemisphereLight:"#afa", RectAreaLight:"#faf" };
  const col = tc[light.type]||"#fff";
  return (
    <div style={{...S.card(sel), display:"flex", alignItems:"center", gap:7}} onClick={()=>onSel(light)}>
      <div style={{width:9,height:9,borderRadius:"50%",background:col,flexShrink:0,opacity:light.visible===false?0.3:1}}/>
      <div style={{flex:1}}>
        <div style={{color:C.text,fontWeight:600,fontSize:10}}>{light.name||light.type}</div>
        <div style={{color:C.muted,fontSize:9}}>int: {(light.intensity||0).toFixed(2)}</div>
      </div>
      <span style={{fontSize:8,padding:"1px 4px",borderRadius:2,background:`${col}22`,color:col,fontWeight:700}}>{(light.type||"").replace("Light","")}</span>
      <button onClick={e=>{e.stopPropagation();onTog(light);}} style={{background:"none",border:"none",cursor:"pointer",color:light.visible===false?C.muted:C.teal,fontSize:11}}>◉</button>
      <button onClick={e=>{e.stopPropagation();onDel(light);}} style={{background:"none",border:"none",cursor:"pointer",color:C.danger,fontSize:13}}>×</button>
    </div>
  );
}

const RIGS = [
  {id:"three_point",l:"3-Point",d:"Key/Fill/Rim"},  {id:"butterfly",l:"Butterfly",d:"Fashion/Beauty"},
  {id:"rembrandt",l:"Rembrandt",d:"Dramatic Portrait"},{id:"loop",l:"Loop",d:"General Portrait"},
  {id:"split",l:"Split",d:"High Contrast"},          {id:"broad",l:"Broad",d:"Wide/Flat"},
  {id:"product",l:"Product Shot",d:"Commercial"},    {id:"cinematic",l:"Cinematic",d:"Film"},
  {id:"sunset",l:"Golden Hour",d:"Warm Side Light"}, {id:"overcast",l:"Overcast",d:"Soft Diffuse"},
  {id:"neon_noir",l:"Neon Noir",d:"Cyberpunk"},       {id:"horror",l:"Horror",d:"Under Lighting"},
  {id:"sci_fi",l:"Sci-Fi",d:"Cold Technical"},
];

const HDRI_EXT = [
  {id:"studio",l:"Studio",k:5500},      {id:"outdoor_day",l:"Outdoor Day",k:6500},
  {id:"golden_hour",l:"Golden Hour",k:3200},{id:"overcast",l:"Overcast",k:7000},
  {id:"night_city",l:"Night City",k:4000},{id:"sunset",l:"Sunset",k:2800},
  {id:"forest",l:"Forest",k:5800},       {id:"desert",l:"Desert",k:6200},
  {id:"arctic",l:"Arctic",k:8000},       {id:"volcano",l:"Volcano",k:2000},
  {id:"spaceship",l:"Spaceship",k:4500}, {id:"cathedral",l:"Cathedral",k:5000},
  {id:"warehouse",l:"Industrial",k:3800},{id:"neon_alley",l:"Neon Alley",k:4200},
];

const LENSES = [
  {id:"fisheye",l:"Fisheye 8mm",fov:180,near:0.1,far:500},
  {id:"ultra",l:"Ultrawide 14mm",fov:104,near:0.1,far:1000},
  {id:"wide",l:"Wide 24mm",fov:74,near:0.1,far:1000},
  {id:"norm35",l:"35mm",fov:54,near:0.1,far:1000},
  {id:"norm50",l:"50mm (Normal)",fov:40,near:0.1,far:1000},
  {id:"port85",l:"85mm Portrait",fov:24,near:0.1,far:2000},
  {id:"tele135",l:"135mm Tele",fov:15,near:0.5,far:2000},
  {id:"tele200",l:"200mm Tele",fov:10,near:1,far:5000},
  {id:"tele400",l:"400mm Super Tele",fov:5,near:2,far:10000},
  {id:"macro",l:"Macro 100mm",fov:20,near:0.01,far:100},
  {id:"cinema",l:"Cinema Spherical",fov:40,near:0.1,far:1000},
  {id:"anamorphic",l:"Anamorphic 2.39:1",fov:40,near:0.1,far:1000},
];

const MOVES = [
  {id:"dolly_in",l:"Dolly In",d:"Push forward"},      {id:"dolly_out",l:"Dolly Out",d:"Pull back"},
  {id:"truck_l",l:"Truck Left",d:"Side move"},         {id:"truck_r",l:"Truck Right",d:"Side move"},
  {id:"pedestal_up",l:"Pedestal Up",d:"Rise"},          {id:"pedestal_dn",l:"Pedestal Down",d:"Lower"},
  {id:"pan_l",l:"Pan Left",d:"Rotate Y"},               {id:"pan_r",l:"Pan Right",d:"Rotate Y"},
  {id:"tilt_up",l:"Tilt Up",d:"Rotate X"},              {id:"tilt_dn",l:"Tilt Down",d:"Rotate X"},
  {id:"orbit",l:"Orbit",d:"Circle subject"},            {id:"crane_up",l:"Crane Up",d:"Arc rise"},
  {id:"crane_dn",l:"Crane Down",d:"Arc lower"},         {id:"dolly_zoom",l:"Dolly Zoom",d:"Vertigo"},
  {id:"handheld",l:"Handheld",d:"Organic shake"},       {id:"steadicam",l:"Steadicam",d:"Smooth follow"},
];

export default function LightingCameraPanel({ onClose, sceneRef, cameraRef, cameras, onApplyFunction }) {
  const [tab, setTab] = useState("lights");
  const status = (m) => onApplyFunction?.("_status_" + m);

  // Lights
  const [ltype,setLtype]=useState("point");   const [lcolor,setLcolor]=useState("#ffffff");
  const [lint,setLint]=useState(1.0);         const [lx,setLx]=useState(0);
  const [ly,setLy]=useState(3);               const [lz,setLz]=useState(3);
  const [langle,setLangle]=useState(30);      const [lpen,setLpen]=useState(0.1);
  const [lrange,setLrange]=useState(0);       const [ldecay,setLdecay]=useState(2);
  const [ltemp,setLtemp]=useState("daylight");const [lname,setLname]=useState("");
  const [shadow,setShadow]=useState(true);    const [sres,setSres]=useState(1024);
  const [sbias,setSbias]=useState(-0.0001);   const [helpers,setHelpers]=useState(true);
  const [lights,setLights]=useState([]);      const [selLight,setSelLight]=useState(null);
  const [selRig,setSelRig]=useState(null);

  // Env
  const [hdri,setHdri]=useState("studio");   const [hdriRot,setHdriRot]=useState(0);
  const [hdriInt,setHdriInt]=useState(1.0);  const [hdriBlur,setHdriBlur]=useState(0);
  const [fogOn,setFogOn]=useState(false);    const [fogType,setFogType]=useState("exp2");
  const [fogCol,setFogCol]=useState("#aabbcc");const [fogD,setFogD]=useState(0.02);
  const [fogN,setFogN]=useState(1);          const [fogF,setFogF]=useState(100);
  const [ambInt,setAmbInt]=useState(0.3);    const [skyCol,setSkyCol]=useState("#224488");
  const [gndCol,setGndCol]=useState("#442200");const [godRays,setGodRays]=useState(false);
  const [godInt,setGodInt]=useState(0.5);    const [bloom,setBloom]=useState(false);
  const [bloomTh,setBloomTh]=useState(0.9);  const [bloomSt,setBloomSt]=useState(1.5);

  // Camera
  const [lens,setLens]=useState("norm50");   const [fov,setFov]=useState(40);
  const [near,setNear]=useState(0.1);        const [far,setFar]=useState(1000);
  const [dofOn,setDofOn]=useState(false);    const [dofFoc,setDofFoc]=useState(5.0);
  const [dofAp,setDofAp]=useState(0.025);   const [dofMb,setDofMb]=useState(0.01);
  const [bokeh,setBokeh]=useState("circle"); const [shakeI,setShakeI]=useState(0.05);
  const [shakeD,setShakeD]=useState(0.5);   const [bkName,setBkName]=useState("Shot_01");
  const [bkList,setBkList]=useState([]);     const [move,setMove]=useState("dolly_in");
  const [moveDur,setMoveDur]=useState(1.5);  const [moveAmt,setMoveAmt]=useState(2.0);
  const [ev,setEv]=useState(0);              const [wb,setWb]=useState(6500);
  const [tone,setTone]=useState("ACES");     const [safe,setSafe]=useState(false);
  const [grid,setGrid]=useState(false);

  // Render
  const [engine,setEngine]=useState("pathtracer"); const [samples,setSamples]=useState(128);
  const [bounces,setBounces]=useState(4);           const [denoiser,setDenoiser]=useState("none");
  const [caustics,setCaustics]=useState(false);     const [motBlur,setMotBlur]=useState(false);
  const [mbShut,setMbShut]=useState(0.5);           const [sss,setSss]=useState(false);
  const [vol,setVol]=useState(false);               const [ao,setAo]=useState(false);
  const [aoR,setAoR]=useState(0.5);                 const [aoI,setAoI]=useState(0.8);
  const [ssr,setSsr]=useState(false);               const [shadowType,setShadowType]=useState("pcss");
  const [lightPath,setLightPath]=useState("full");

  const refresh = useCallback(()=>{ if(sceneRef?.current) setLights(getSceneLights(sceneRef.current)); },[sceneRef]);
  useEffect(()=>{ refresh(); },[refresh]);

  const addLight = () => {
    if(!sceneRef?.current) return;
    const l = createLight(ltype,{ color:lcolor, intensity:lint, position:{x:lx,y:ly,z:lz}, angle:langle*Math.PI/180, penumbra:lpen, distance:lrange, decay:ldecay, castShadow:shadow, shadow:{mapSize:sres,bias:sbias} });
    const ll = l.light||l;
    if(lname) ll.name=lname;
    if(helpers) addLightHelper(sceneRef.current,ll);
    sceneRef.current.add(ll); refresh(); status("Added "+ltype+" light");
  };

  const applyRig = (id) => {
    if(!sceneRef?.current) return;
    const CFGS = {
      three_point: ()=>createThreePointLighting(sceneRef.current,lint),
      butterfly:  [{t:"spot",p:{x:0,y:4,z:2},i:2.0,c:"#fff8f0"},{t:"point",p:{x:0,y:1,z:-1},i:0.3,c:"#c0d8ff"}],
      rembrandt:  [{t:"spot",p:{x:-2,y:4,z:1},i:1.5,c:"#ffe8c0"},{t:"point",p:{x:3,y:2,z:2},i:0.2,c:"#c0d8ff"}],
      cinematic:  [{t:"spot",p:{x:-4,y:3,z:2},i:1.8,c:"#ffe0a0"},{t:"spot",p:{x:4,y:1,z:-2},i:0.6,c:"#a0c0ff"},{t:"directional",p:{x:0,y:10,z:5},i:0.3,c:"#fff"}],
      product:    [{t:"spot",p:{x:-2,y:4,z:2},i:1.5,c:"#fff"},{t:"spot",p:{x:2,y:4,z:2},i:1.0,c:"#fff"},{t:"directional",p:{x:0,y:2,z:-3},i:0.3,c:"#e8f0ff"}],
      neon_noir:  [{t:"point",p:{x:-2,y:2,z:0},i:2.0,c:"#ff00aa"},{t:"point",p:{x:2,y:2,z:0},i:2.0,c:"#00aaff"}],
      horror:     [{t:"point",p:{x:0,y:-1,z:1},i:1.5,c:"#ff4400"},{t:"ambient",p:{x:0,y:0,z:0},i:0.1,c:"#000022"}],
      sci_fi:     [{t:"spot",p:{x:0,y:5,z:0},i:1.0,c:"#80f0ff"},{t:"point",p:{x:-3,y:2,z:2},i:0.5,c:"#00ff88"}],
      sunset:     [{t:"directional",p:{x:5,y:1,z:0},i:2.0,c:"#ff8800"},{t:"hemisphere",p:{x:0,y:5,z:0},i:0.4,c:"#4488aa"}],
      overcast:   [{t:"hemisphere",p:{x:0,y:5,z:0},i:1.0,c:"#c0d8ff"},{t:"ambient",p:{x:0,y:0,z:0},i:0.5,c:"#d0e0f0"}],
      loop:       [{t:"spot",p:{x:-1,y:4,z:2},i:1.5,c:"#fff8f0"},{t:"point",p:{x:2,y:2,z:2},i:0.4,c:"#c0d8ff"}],
      split:      [{t:"spot",p:{x:-3,y:3,z:0},i:1.5,c:"#fff"},{t:"spot",p:{x:3,y:3,z:0},i:1.5,c:"#fff"}],
      broad:      [{t:"directional",p:{x:-2,y:4,z:2},i:1.2,c:"#fff"},{t:"point",p:{x:2,y:2,z:2},i:0.5,c:"#e0ecff"}],
    };
    const cfg = CFGS[id];
    if(typeof cfg==="function"){ cfg(); }
    else if(Array.isArray(cfg)){ cfg.forEach(({t,p,i,c})=>{ const l=createLight(t,{color:c,intensity:i,position:p,castShadow:true}); sceneRef.current.add(l.light||l); }); }
    else if(id==="tight"){ createTightLightingRig(sceneRef.current); }
    refresh(); setSelRig(id); status("Rig: "+id);
  };

  const applyLens = (p) => {
    const lp = LENSES.find(l=>l.id===p); if(!lp||!cameraRef?.current) return;
    cameraRef.current.fov=lp.fov; cameraRef.current.near=lp.near; cameraRef.current.far=lp.far;
    cameraRef.current.updateProjectionMatrix(); setFov(lp.fov); setNear(lp.near); setFar(lp.far); setLens(p); status("Lens: "+lp.l);
  };

  const doMove = () => {
    if(!cameraRef?.current) return;
    if(move==="dolly_zoom") dollyZoom(cameraRef.current,{x:0,y:0,z:0},moveAmt,moveAmt*0.5,moveDur);
    else if(move==="handheld"||move==="steadicam") applyCameraShake(cameraRef.current,{intensity:move==="steadicam"?shakeI*0.3:shakeI,duration:moveDur});
    status("Move: "+move+" "+moveDur+"s");
  };

  const saveBk = () => {
    if(!cameraRef?.current) return;
    saveBookmark(cameraRef.current,bkName);
    setBkList(p=>[...p.filter(b=>b!==bkName),bkName]); status("Bookmark: "+bkName);
  };

  const TABS=[["lights","💡 Lights"],["env","🌍 Env"],["camera","🎥 Camera"],["render","⚙ Render"]];

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={{background:C.teal,color:"#000",fontSize:9,fontWeight:800,padding:"2px 5px",borderRadius:3}}>SPX</span>
        <span style={{color:C.teal,fontWeight:700,fontSize:11}}>LIGHTING & CAMERA</span>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      <div style={S.tabs}>
        {TABS.map(([id,lbl])=><button key={id} style={S.tab(tab===id)} onClick={()=>setTab(id)}>{lbl}</button>)}
      </div>
      <div style={S.body}>

        {/* ── LIGHTS ── */}
        {tab==="lights"&&<>
          <div style={S.sec}>
            <div style={S.sl}>Lighting Rigs</div>
            <div style={S.grid2}>
              {RIGS.map(r=>(
                <button key={r.id} onClick={()=>applyRig(r.id)} style={{...S.btn(selRig===r.id?C.teal:C.muted),textAlign:"left",padding:"4px 7px"}}>
                  <div style={{fontWeight:700,fontSize:10}}>{r.l}</div>
                  <div style={{fontSize:9,color:C.muted}}>{r.d}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Add Light</div>
            <div style={S.row}>
              <input style={S.input} placeholder="Name" value={lname} onChange={e=>setLname(e.target.value)}/>
              <select style={{...S.select,width:110}} value={ltype} onChange={e=>setLtype(e.target.value)}>
                {["point","spot","directional","area","ambient","hemisphere"].map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div style={S.row}>
              <div><div style={{...S.sl,marginBottom:2}}>Color</div><input type="color" value={lcolor} onChange={e=>setLcolor(e.target.value)} style={S.cp}/></div>
              <div style={{flex:1}}>
                <div style={{...S.sl,marginBottom:2}}>Temperature</div>
                <select style={S.select} value={ltemp} onChange={e=>setLtemp(e.target.value)}>
                  {Object.keys(TEMPERATURE_PRESETS).map(k=><option key={k} value={k}>{k} ({TEMPERATURE_PRESETS[k]}K)</option>)}
                </select>
              </div>
            </div>
            <KS label="Intensity" value={lint} min={0} max={20} onChange={setLint}/>
            <KS label="Range" value={lrange} min={0} max={100} step={0.5} unit="m" onChange={setLrange}/>
            <KS label="Decay" value={ldecay} min={0} max={4} step={0.1} onChange={setLdecay}/>
            {ltype==="spot"&&<>
              <KS label="Angle" value={langle} min={1} max={90} step={1} unit="°" onChange={setLangle}/>
              <KS label="Penumbra" value={lpen} min={0} max={1} onChange={setLpen}/>
            </>}
            <div style={S.sl}>Position</div>
            <div style={S.row}>
              {[["X",lx,setLx],["Y",ly,setLy],["Z",lz,setLz]].map(([ax,v,s])=>(
                <div key={ax} style={{flex:1}}><div style={{fontSize:9,color:C.muted,marginBottom:2}}>{ax}</div><input type="number" style={S.num} value={v} step={0.5} onChange={e=>s(Number(e.target.value))}/></div>
              ))}
            </div>
            <div style={S.sl}>Shadows</div>
            <div style={S.row}>
              <label style={S.chk}><input type="checkbox" checked={shadow} onChange={e=>setShadow(e.target.checked)}/> Cast Shadow</label>
              <select style={{...S.select,width:80}} value={sres} onChange={e=>setSres(Number(e.target.value))}>
                {[256,512,1024,2048,4096].map(r=><option key={r} value={r}>{r}px</option>)}
              </select>
            </div>
            <KS label="Shadow Bias" value={sbias} min={-0.01} max={0.01} step={0.0001} onChange={setSbias}/>
            <label style={S.chk}><input type="checkbox" checked={helpers} onChange={e=>setHelpers(e.target.checked)}/> Show Helpers</label>
            <button style={{...S.btn(C.teal),width:"100%",padding:"7px 0",marginTop:6}} onClick={addLight}>+ Add {ltype[0].toUpperCase()+ltype.slice(1)} Light</button>
          </div>

          <div style={S.sec}>
            <div style={{...S.row,marginBottom:5}}>
              <div style={S.sl}>Scene Lights ({lights.length})</div>
              <button style={S.btn(C.muted,true)} onClick={refresh}>↻</button>
              <button style={S.btn(C.danger,true)} onClick={()=>{lights.forEach(l=>sceneRef.current?.remove(l));refresh();}}>Clear</button>
            </div>
            {lights.length===0&&<div style={{color:C.muted,fontSize:10}}>No lights — add or apply a rig</div>}
            {lights.map((l,i)=><LCard key={i} light={l} sel={selLight===l} onSel={setSelLight} onDel={ll=>{sceneRef.current?.remove(ll);refresh();if(selLight===ll)setSelLight(null);}} onTog={ll=>{ll.visible=!ll.visible;refresh();}}/>)}
            {selLight&&(
              <div style={{marginTop:8,padding:9,border:`1px solid ${C.teal}44`,borderRadius:4,background:`${C.teal}05`}}>
                <div style={{...S.sl,color:C.teal}}>Edit Selected</div>
                <KS label="Intensity" value={selLight.intensity||0} min={0} max={20} onChange={v=>{selLight.intensity=v;refresh();}} color={C.teal}/>
                <div style={S.row}><span style={{color:C.muted,fontSize:10,width:78}}>Color</span><input type="color" value={"#"+(selLight.color?.getHexString?.()||"ffffff")} onChange={e=>{selLight.color?.set?.(e.target.value);refresh();}} style={S.cp}/></div>
              </div>
            )}
          </div>
        </>}

        {/* ── ENVIRONMENT ── */}
        {tab==="env"&&<>
          <div style={S.sec}>
            <div style={S.sl}>HDRI Environment</div>
            <div style={S.grid2}>
              {HDRI_EXT.map(h=>(
                <button key={h.id} onClick={()=>setHdri(h.id)} style={{...S.btn(hdri===h.id?C.teal:C.muted),textAlign:"left",padding:"4px 7px",fontSize:9}}>
                  <div style={{fontWeight:700}}>{h.l}</div>
                  <div style={{color:C.muted,fontSize:8}}>{h.k}K</div>
                </button>
              ))}
            </div>
            <KS label="Intensity" value={hdriInt} min={0} max={5} onChange={setHdriInt}/>
            <KS label="Rotation" value={hdriRot} min={0} max={360} step={1} unit="°" onChange={setHdriRot}/>
            <KS label="Blur" value={hdriBlur} min={0} max={1} onChange={setHdriBlur}/>
            <button style={{...S.btn(C.teal),width:"100%"}} onClick={()=>{if(sceneRef?.current)applyHDRI(sceneRef.current,hdri);status("HDRI: "+hdri);}}>Apply: {HDRI_EXT.find(h=>h.id===hdri)?.l}</button>
          </div>

          <div style={S.sec}>
            <div style={S.sl}>World Ambient</div>
            <div style={S.row}>
              <span style={{color:C.muted,fontSize:10,width:78}}>Sky</span><input type="color" value={skyCol} onChange={e=>setSkyCol(e.target.value)} style={S.cp}/>
              <span style={{color:C.muted,fontSize:10,width:78}}>Ground</span><input type="color" value={gndCol} onChange={e=>setGndCol(e.target.value)} style={S.cp}/>
            </div>
            <KS label="Ambient Int" value={ambInt} min={0} max={3} onChange={setAmbInt}/>
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Volumetric Fog</div>
            <div style={S.row}>
              <select style={{...S.select,width:80}} value={fogType} onChange={e=>setFogType(e.target.value)}>
                {["linear","exp","exp2"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <input type="color" value={fogCol} onChange={e=>setFogCol(e.target.value)} style={S.cp}/>
            </div>
            {fogType==="linear"?<><KS label="Near" value={fogN} min={0} max={100} onChange={setFogN}/><KS label="Far" value={fogF} min={1} max={1000} onChange={setFogF}/></>:<KS label="Density" value={fogD} min={0} max={0.1} step={0.001} onChange={setFogD}/>}
            <button style={{...S.btn(fogOn?C.danger:C.teal),width:"100%"}} onClick={()=>{if(!sceneRef?.current)return;if(fogOn){removeFog(sceneRef.current);setFogOn(false);}else{createVolumericFog(sceneRef.current,{color:fogCol,density:fogD,near:fogN,far:fogF,type:fogType});setFogOn(true);}status(fogOn?"Fog removed":"Fog applied");}}>{fogOn?"Remove Fog":"Apply Fog"}</button>
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Post Effects</div>
            <label style={S.chk}><input type="checkbox" checked={godRays} onChange={e=>setGodRays(e.target.checked)}/> God Rays / Light Shafts</label>
            {godRays&&<KS label="Intensity" value={godInt} min={0} max={2} onChange={setGodInt}/>}
            <label style={S.chk}><input type="checkbox" checked={bloom} onChange={e=>setBloom(e.target.checked)}/> Bloom</label>
            {bloom&&<><KS label="Threshold" value={bloomTh} min={0} max={2} onChange={setBloomTh}/><KS label="Strength" value={bloomSt} min={0} max={5} onChange={setBloomSt}/></>}
          </div>
        </>}

        {/* ── CAMERA ── */}
        {tab==="camera"&&<>
          <div style={S.sec}>
            <div style={S.sl}>Lens Presets</div>
            <div style={S.grid2}>
              {LENSES.map(p=>(
                <button key={p.id} onClick={()=>applyLens(p.id)} style={{...S.btn(lens===p.id?C.teal:C.muted),textAlign:"left",padding:"4px 7px",fontSize:9}}>
                  <div style={{fontWeight:700}}>{p.l}</div>
                  <div style={{color:C.muted,fontSize:8}}>FOV {p.fov}°</div>
                </button>
              ))}
            </div>
            <KS label="FOV" value={fov} min={1} max={180} step={1} unit="°" onChange={v=>{setFov(v);if(cameraRef?.current){cameraRef.current.fov=v;cameraRef.current.updateProjectionMatrix();}}}/>
            <KS label="Near Clip" value={near} min={0.001} max={10} step={0.001} unit="m" onChange={setNear}/>
            <KS label="Far Clip" value={far} min={10} max={100000} step={10} unit="m" onChange={setFar}/>
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Depth of Field</div>
            <label style={S.chk}><input type="checkbox" checked={dofOn} onChange={e=>setDofOn(e.target.checked)}/> Enable DOF</label>
            {dofOn&&<>
              <KS label="Focus" value={dofFoc} min={0.1} max={100} unit="m" onChange={setDofFoc}/>
              <KS label="Aperture" value={dofAp} min={0.001} max={0.2} step={0.001} onChange={setDofAp}/>
              <KS label="Max Blur" value={dofMb} min={0} max={0.05} step={0.001} onChange={setDofMb}/>
              <div style={S.sl}>Bokeh Shape</div>
              <div style={S.row}>{["circle","hexagon","octagon","anamorphic"].map(b=><button key={b} onClick={()=>setBokeh(b)} style={S.btn(bokeh===b?C.teal:C.muted,true)}>{b}</button>)}</div>
              <button style={{...S.btn(C.teal),width:"100%",marginTop:5}} onClick={()=>{if(cameraRef?.current)setDOF(cameraRef.current,{enabled:dofOn,focus:dofFoc,aperture:dofAp,maxBlur:dofMb});status("DOF applied");}}>Apply DOF</button>
            </>}
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Camera Moves</div>
            <div style={S.grid2}>
              {MOVES.map(m=>(
                <button key={m.id} onClick={()=>setMove(m.id)} style={{...S.btn(move===m.id?C.orange:C.muted),textAlign:"left",padding:"4px 7px",fontSize:9}}>
                  <div style={{fontWeight:700}}>{m.l}</div>
                  <div style={{color:C.muted,fontSize:8}}>{m.d}</div>
                </button>
              ))}
            </div>
            <KS label="Duration" value={moveDur} min={0.1} max={10} step={0.1} unit="s" onChange={setMoveDur} color={C.orange}/>
            <KS label="Amount" value={moveAmt} min={0.1} max={20} step={0.1} unit="m" onChange={setMoveAmt} color={C.orange}/>
            <button style={{...S.btn(C.orange),width:"100%"}} onClick={doMove}>▶ Execute Move</button>
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Camera Shake</div>
            <KS label="Intensity" value={shakeI} min={0} max={0.5} step={0.001} onChange={setShakeI}/>
            <KS label="Duration" value={shakeD} min={0.1} max={5} step={0.1} unit="s" onChange={setShakeD}/>
            <button style={{...S.btn(C.teal),width:"100%"}} onClick={()=>{if(cameraRef?.current)applyCameraShake(cameraRef.current,{intensity:shakeI,duration:shakeD});status("Shake applied");}}>📳 Apply Shake</button>
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Camera Bookmarks</div>
            <div style={S.row}>
              <input style={S.input} placeholder="Shot name" value={bkName} onChange={e=>setBkName(e.target.value)}/>
              <button style={S.btn(C.teal)} onClick={saveBk}>💾 Save</button>
            </div>
            {bkList.map((b,i)=>(
              <div key={i} style={{...S.card(false),display:"flex",alignItems:"center",gap:7}}>
                <span style={{color:C.text,flex:1,fontSize:10}}>📷 {b}</span>
                <button style={S.btn(C.teal,true)} onClick={()=>{if(cameraRef?.current){restoreBookmark(cameraRef.current,b);status("Camera: "+b);}}}>▶ Go</button>
                <button style={S.btn(C.warn,true)} onClick={()=>{if(cameraRef?.current)animateCameraToBookmark(cameraRef.current,b,1.5);}}>🎬 Animate</button>
                <button style={{background:"none",border:"none",color:C.danger,cursor:"pointer"}} onClick={()=>setBkList(p=>p.filter(x=>x!==b))}>×</button>
              </div>
            ))}
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Exposure & Color</div>
            <KS label="Exposure" value={ev} min={-4} max={4} step={0.1} unit="EV" onChange={setEv}/>
            <KS label="White Bal" value={wb} min={1000} max={12000} step={100} unit="K" onChange={setWb}/>
            <div style={S.sl}>Tone Mapping</div>
            <div style={S.row}>{["Linear","Reinhard","ACES","Filmic","AgX"].map(t=><button key={t} onClick={()=>setTone(t)} style={S.btn(tone===t?C.teal:C.muted,true)}>{t}</button>)}</div>
          </div>

          <div style={S.sec}>
            <div style={S.sl}>Viewport Overlays</div>
            <label style={S.chk}><input type="checkbox" checked={safe} onChange={e=>setSafe(e.target.checked)}/> Safe Frames (Action/Title)</label>
            <label style={S.chk}><input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/> Rule of Thirds Grid</label>
          </div>
        </>}

        {/* ── RENDER SETTINGS ── */}
        {tab==="render"&&<>
          <div style={S.sec}>
            <div style={S.sl}>Render Engine</div>
            <div style={S.row}>{["pathtracer","rasterizer","hybrid"].map(e=><button key={e} onClick={()=>setEngine(e)} style={S.btn(engine===e?C.teal:C.muted)}>{e}</button>)}</div>
          </div>
          <div style={S.sec}>
            <div style={S.sl}>Sampling</div>
            <KS label="Samples" value={samples} min={1} max={4096} step={1} onChange={setSamples}/>
            <KS label="Bounces" value={bounces} min={0} max={32} step={1} onChange={setBounces}/>
            <div style={S.sl}>Denoiser</div>
            <select style={S.select} value={denoiser} onChange={e=>setDenoiser(e.target.value)}>
              {["none","NLM","OptiX","OIDN","Temporal"].map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={S.sec}>
            <div style={S.sl}>Light Path</div>
            <select style={S.select} value={lightPath} onChange={e=>setLightPath(e.target.value)}>
              {[["full","Full GI"],["direct","Direct Only"],["indirect","Indirect Only"],["ao","AO Only"],["diffuse","Diffuse"],["specular","Specular"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={S.sec}>
            <div style={S.sl}>Features</div>
            {[[caustics,setCaustics,"Caustics"],[motBlur,setMotBlur,"Motion Blur"],[sss,setSss,"Subsurface Scattering"],[vol,setVol,"Volumetrics"],[ao,setAo,"Ambient Occlusion"],[ssr,setSsr,"Screen Space Reflections"]].map(([v,s,l])=>(
              <label key={l} style={S.chk}><input type="checkbox" checked={v} onChange={e=>s(e.target.checked)}/> {l}</label>
            ))}
            {motBlur&&<KS label="Shutter" value={mbShut} min={0} max={1} step={0.01} onChange={setMbShut}/>}
            {ao&&<><KS label="AO Radius" value={aoR} min={0} max={5} onChange={setAoR}/><KS label="AO Intensity" value={aoI} min={0} max={2} onChange={setAoI}/></>}
          </div>
          <div style={S.sec}>
            <div style={S.sl}>Shadows</div>
            <select style={S.select} value={shadowType} onChange={e=>setShadowType(e.target.value)}>
              {[["none","No Shadows"],["basic","Basic"],["pcf","PCF Soft"],["pcss","PCSS Contact"],["vsm","VSM Variance"],["esm","ESM"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <button style={{...S.btn(C.teal),width:"100%",padding:"8px 0",marginTop:4}} onClick={()=>{onApplyFunction?.("render_start");status("Render started");}}>▶ Start Render</button>
          <button style={{...S.btn(C.orange),width:"100%",padding:"8px 0",marginTop:4}} onClick={()=>{onApplyFunction?.("render_preview");status("Viewport render");}}>👁 Viewport Render</button>
        </>}

      </div>
    </div>
  );
}
