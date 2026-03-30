#!/usr/bin/env python3
import os
REPO = "/workspaces/spx-mesh-editor"
P    = f"{REPO}/src/components/panels"
PIPE = f"{REPO}/src/components/pipeline"
for d in [P, PIPE]: os.makedirs(d, exist_ok=True)
FILES = {}

# ── 2D STYLE PRESETS ──────────────────────────────────────────────────────────
FILES[f"{PIPE}/SPX2DStylePresets.js"] = '''
export const STYLE_PRESETS = {
  "Flat Orthographic":   { desc:"Direct 1:1 projection. Clean base.", headScale:1.0, limbScale:1.0, snapDeg:0, combinable:true },
  "Side Scroller":       { desc:"Locked side view. Platformer.", headScale:1.0, limbScale:1.2, snapDeg:0, combinable:true },
  "Isometric Pixel":     { desc:"2:1 iso angle. Classic pixel RPG.", headScale:1.0, limbScale:1.0, snapDeg:45, pixelGrid:4, combinable:true },
  "Classic Cartoon":     { desc:"Rubberhose limbs. Disney/Fleischer.", headScale:1.3, limbScale:1.1, snapDeg:0, combinable:true },
  "Chibi SD":            { desc:"2-head body ratio. Super-deformed.", headScale:1.8, limbScale:0.55, snapDeg:0, combinable:true },
  "Anime Standard":      { desc:"Long legs, narrow waist. Shonen.", headScale:0.85, limbScale:1.25, snapDeg:0, combinable:true },
  "Anime Action":        { desc:"Dynamic. Naruto/DBZ energy.", headScale:0.9, limbScale:1.3, snapDeg:0, combinable:true },
  "Anime Slice of Life": { desc:"Soft rounded. K-On casual.", headScale:0.95, limbScale:1.1, snapDeg:0, combinable:true },
  "Anime Mecha":         { desc:"Rigid angular. Gundam/Eva.", headScale:0.8, limbScale:1.0, snapDeg:15, combinable:false },
  "Marvel What If":      { desc:"Bold ink, flat fills, dramatic angles. Spider-Verse adjacent.", headScale:1.05, limbScale:1.15, snapDeg:5, inkOutline:true, flatColor:true, halftone:true, combinable:true },
  "Western Comic":       { desc:"Classic DC/Marvel print superhero.", headScale:0.9, limbScale:1.1, snapDeg:0, inkOutline:true, combinable:true },
  "Manga B&W":           { desc:"High contrast. Speed lines. Screen tone.", headScale:0.88, limbScale:1.2, snapDeg:0, grayscale:true, inkOutline:true, speedLines:true, combinable:true },
  "Manga Color":         { desc:"Shonen Jump color style. Bold flats.", headScale:0.88, limbScale:1.2, snapDeg:0, inkOutline:true, combinable:true },
  "Webtoon":             { desc:"Korean manhwa. Vertical scroll clean.", headScale:0.92, limbScale:1.15, snapDeg:0, combinable:true },
  "90s Saturday Morning":{ desc:"Thick outlines, limited palette. TMNT/Gargoyles era.", headScale:1.1, limbScale:1.05, snapDeg:0, inkOutline:true, limitedPalette:true, combinable:true },
  "90s Anime":           { desc:"Off-model frames, lens flare, film grain. Evangelion/Cowboy Bebop.", headScale:0.88, limbScale:1.2, snapDeg:0, filmGrain:true, lensFlare:true, combinable:true },
  "Studio Ghibli":       { desc:"Soft weight. Spirited Away feel.", headScale:1.05, limbScale:0.95, snapDeg:0, combinable:true },
  "Pixar Style":         { desc:"Exaggerated squash/stretch.", headScale:1.2, limbScale:1.05, snapDeg:0, combinable:true },
  "Spider-Verse":        { desc:"Halftone, offset frames, pop art.", headScale:1.0, limbScale:1.0, snapDeg:0, halftone:true, frameSkip:3, inkOutline:true, combinable:true },
  "Arcane Painterly":    { desc:"Textured paint. Arcane Netflix.", headScale:0.95, limbScale:1.05, snapDeg:0, painterly:true, combinable:true },
  "8-Bit Pixel":         { desc:"NES era. 8px snap grid.", headScale:1.0, limbScale:1.0, snapDeg:45, pixelGrid:8, combinable:false },
  "16-Bit Pixel":        { desc:"SNES era. 4px snap.", headScale:1.0, limbScale:1.0, snapDeg:22.5, pixelGrid:4, combinable:false },
  "Shadow Puppet":       { desc:"Single-axis silhouette. Wayang.", headScale:1.0, limbScale:1.0, snapDeg:0, silhouette:true, combinable:false },
  "Paper Cutout":        { desc:"Discrete segments. Terry Gilliam.", headScale:1.0, limbScale:1.0, snapDeg:0, cutout:true, combinable:true },
  "Noir Cinematic":      { desc:"High contrast shadow. 1940s noir.", headScale:1.0, limbScale:1.0, snapDeg:0, grayscale:true, highContrast:true, combinable:true },
  "Synthwave Retro":     { desc:"Neon glow outlines. 80s aesthetic.", headScale:1.0, limbScale:1.0, snapDeg:0, neonGlow:true, combinable:true },
  "Rotoscope Realism":   { desc:"Traced from live action. Heavy detail.", headScale:1.0, limbScale:1.0, snapDeg:0, combinable:true },
  "Storyboard Draft":    { desc:"Rough sketch thumbnail format.", headScale:1.0, limbScale:1.0, snapDeg:0, sketch:true, combinable:true },
  "Ukiyo-e Woodblock":   { desc:"Japanese woodblock print. Bold flat areas, texture lines.", headScale:1.0, limbScale:1.0, snapDeg:0, inkOutline:true, limitedPalette:true, combinable:true },
  "Art Deco":            { desc:"Geometric elegance. 1920s glamour.", headScale:1.0, limbScale:1.0, snapDeg:15, combinable:true },
};

export const STYLE_NAMES = Object.keys(STYLE_PRESETS);

export const COMBINABLE_PAIRS = [
  ["Marvel What If", "Spider-Verse"],
  ["Manga B&W", "Anime Action"],
  ["Manga Color", "Anime Standard"],
  ["90s Saturday Morning", "Classic Cartoon"],
  ["90s Anime", "Anime Action"],
  ["Western Comic", "Noir Cinematic"],
  ["Synthwave Retro", "Anime Mecha"],
  ["Arcane Painterly", "Western Comic"],
  ["Webtoon", "Anime Slice of Life"],
  ["Studio Ghibli", "Anime Slice of Life"],
  ["Flat Orthographic", "Spider-Verse"],
  ["Paper Cutout", "Ukiyo-e Woodblock"],
];

export function applyStyleTransform(kf, styleName, time=0) {
  const style = STYLE_PRESETS[styleName];
  if (!style) return kf;
  const out = {};
  const snap = (v, g) => g > 0 ? Math.round(v/g)*g : v;
  Object.entries(kf).forEach(([b, v]) => {
    let x = v.x, y = v.y, rot = v.rotation || 0, sc = v.scale || 1;
    const isHead = b==="head"||b==="neck";
    const isLeg  = b.includes("thigh")||b.includes("shin")||b.includes("foot");
    const isArm  = b.includes("arm")||b.includes("hand")||b.includes("shoulder");
    // head/limb scale
    if (isHead) sc *= style.headScale || 1;
    if (isLeg)  sc *= style.limbScale || 1;
    if (isArm)  sc *= (style.limbScale || 1) * 0.9;
    // snap
    if (style.snapDeg) rot = snap(rot, style.snapDeg);
    if (style.pixelGrid) { x = snap(x, style.pixelGrid); y = snap(y, style.pixelGrid); }
    // style specifics
    if (styleName === "Side Scroller")    { x = x*0.5+160; rot *= 1.4; }
    if (styleName === "Isometric Pixel")  { x = x*Math.cos(Math.PI/6); y = y*0.5+x*0.289; }
    if (styleName === "Classic Cartoon")  { y += b==="hips"?Math.abs(Math.sin(time*Math.PI*2))*8:0; rot*=1.1; }
    if (styleName === "Chibi SD")         { if(isLeg) y*=0.55; }
    if (styleName === "Anime Action")     { x+=Math.sin(time*30)*0.3; rot*=1.3; }
    if (styleName === "Anime Standard")   { if(isLeg) y*=1.25; rot*=0.9; }
    if (styleName === "Marvel What If")   { rot=snap(rot,5); if(isArm)sc*=1.1; }
    if (styleName === "Spider-Verse")     { if(Math.floor(time*12)%3===0){x+=2;y+=1;} }
    if (styleName === "90s Anime")        { x+=Math.sin(time*20)*1.5; }
    if (styleName === "Studio Ghibli")    { y+=b==="chest"||b==="spine"?Math.sin(time*1.5)*1.5:0; rot*=0.8; }
    if (styleName === "Pixar Style")      { const sq=1+Math.sin(time*6)*0.04; sc*=sq; }
    if (styleName === "Manga B&W" || styleName === "Manga Color") { if(isLeg)sc*=1.1; }
    if (styleName === "Shadow Puppet")    { x=320; }
    if (styleName === "90s Saturday Morning") { rot=snap(rot,3); }
    out[b] = { x, y, rotation: rot, scale: sc };
  });
  return out;
}

export function blendStyles(kfA, kfB, alpha=0.5) {
  const out = {};
  const bones = new Set([...Object.keys(kfA), ...Object.keys(kfB)]);
  bones.forEach(b => {
    const a = kfA[b] || { x:320, y:240, rotation:0, scale:1 };
    const bv = kfB[b] || { x:320, y:240, rotation:0, scale:1 };
    out[b] = {
      x:        a.x        + (bv.x        - a.x)        * alpha,
      y:        a.y        + (bv.y        - a.y)        * alpha,
      rotation: a.rotation + (bv.rotation - a.rotation) * alpha,
      scale:    a.scale    + (bv.scale    - a.scale)    * alpha,
    };
  });
  return out;
}

export default STYLE_PRESETS;
'''

# ── 2D VIEWPORT PANEL (live preview of 3D→2D conversion) ──────────────────────
FILES[f"{P}/TwoDViewportPanel.jsx"] = '''
import React, { useEffect, useRef, useState } from "react";
import STYLE_PRESETS, { STYLE_NAMES, applyStyleTransform, blendStyles, COMBINABLE_PAIRS } from "../pipeline/SPX2DStylePresets";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:4,marginBottom:4},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  canvas:{width:"100%",borderRadius:6,border:"2px solid "+T.border,background:"#000",display:"block"},
  inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
};

// Demo skeleton keyframes (stand pose)
const DEMO_KF = {
  head:      {x:320,y:80},  neck:{x:320,y:110},
  chest:     {x:320,y:155}, spine:{x:320,y:185}, hips:{x:320,y:220},
  l_shoulder:{x:290,y:130}, l_upper_arm:{x:265,y:155}, l_forearm:{x:248,y:185}, l_hand:{x:240,y:210},
  r_shoulder:{x:350,y:130}, r_upper_arm:{x:375,y:155}, r_forearm:{x:392,y:185}, r_hand:{x:400,y:210},
  l_thigh:   {x:305,y:255}, l_shin:{x:300,y:295}, l_foot:{x:295,y:325},
  r_thigh:   {x:335,y:255}, r_shin:{x:340,y:295}, r_foot:{x:345,y:325},
};

const SKELETON_CONNECTIONS = [
  ["head","neck"],["neck","chest"],["chest","spine"],["spine","hips"],
  ["chest","l_shoulder"],["l_shoulder","l_upper_arm"],["l_upper_arm","l_forearm"],["l_forearm","l_hand"],
  ["chest","r_shoulder"],["r_shoulder","r_upper_arm"],["r_upper_arm","r_forearm"],["r_forearm","r_hand"],
  ["hips","l_thigh"],["l_thigh","l_shin"],["l_shin","l_foot"],
  ["hips","r_thigh"],["r_thigh","r_shin"],["r_shin","r_foot"],
];

function getStyleColor(styleName) {
  const colors = {
    "Marvel What If":"#FF6600","Spider-Verse":"#ff00ff","Manga B&W":"#ffffff",
    "Manga Color":"#ff4444","90s Saturday Morning":"#ffaa00","90s Anime":"#00aaff",
    "Synthwave Retro":"#00ffc8","Noir Cinematic":"#888888","Shadow Puppet":"#111111",
    "Arcane Painterly":"#aa6644","Studio Ghibli":"#88cc88",
  };
  return colors[styleName] || "#00ffc8";
}

function drawStickFigure(ctx, kf, style, w, h, time) {
  const sp = STYLE_PRESETS[style] || {};
  ctx.clearRect(0,0,w,h);

  // Background effects
  if (sp.neonGlow) {
    ctx.fillStyle = "#050510"; ctx.fillRect(0,0,w,h);
    // grid lines
    ctx.strokeStyle = "#220044"; ctx.lineWidth = 0.5;
    for(let i=0;i<w;i+=20){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,h);ctx.stroke();}
    for(let j=0;j<h;j+=20){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(w,j);ctx.stroke();}
  } else if (sp.grayscale && sp.highContrast) {
    ctx.fillStyle = "#000"; ctx.fillRect(0,0,w,h);
  } else if (sp.halftone) {
    ctx.fillStyle = "#fffef0"; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = "#e0d8c0";
    for(let i=0;i<w;i+=8) for(let j=0;j<h;j+=8) {
      ctx.beginPath(); ctx.arc(i,j,1.5,0,Math.PI*2); ctx.fill();
    }
  } else if (sp.filmGrain) {
    ctx.fillStyle = "#0a0820"; ctx.fillRect(0,0,w,h);
  } else {
    ctx.fillStyle = "#06060f"; ctx.fillRect(0,0,w,h);
  }

  // Speed lines (manga)
  if (sp.speedLines) {
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth=1;
    for(let i=0;i<20;i++){
      ctx.beginPath(); ctx.moveTo(w/2,h/2);
      const a=i/20*Math.PI*2; ctx.lineTo(w/2+Math.cos(a)*w, h/2+Math.sin(a)*h); ctx.stroke();
    }
  }

  // Transform keyframes by style
  const transformed = applyStyleTransform(kf, style, time);

  const lineW  = sp.inkOutline ? 3 : 2;
  const jColor = getStyleColor(style);

  // Draw connections
  SKELETON_CONNECTIONS.forEach(([a,b]) => {
    const pa = transformed[a], pb = transformed[b];
    if (!pa || !pb) return;
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
    if (sp.grayscale)    ctx.strokeStyle = sp.highContrast ? "#fff" : "#aaa";
    else if (sp.neonGlow) { ctx.shadowBlur=8; ctx.shadowColor=jColor; ctx.strokeStyle=jColor; }
    else                  ctx.strokeStyle = jColor;
    ctx.lineWidth = lineW;
    if (sp.inkOutline) {
      // Double stroke for ink outline feel
      ctx.lineWidth = lineW+2; ctx.strokeStyle = "#000"; ctx.stroke();
      ctx.lineWidth = lineW;   ctx.strokeStyle = jColor;
    }
    ctx.stroke();
    ctx.shadowBlur=0;
  });

  // Draw joints
  Object.entries(transformed).forEach(([bone, pos]) => {
    const r = bone==="head" ? (sp.headScale||1)*14 : 4;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI*2);
    if (bone==="head") {
      ctx.fillStyle = sp.grayscale?"#888": (sp.neonGlow?"#000":T.bg);
      ctx.fill();
      ctx.strokeStyle = jColor; ctx.lineWidth=lineW; ctx.stroke();
    } else {
      ctx.fillStyle = jColor; ctx.fill();
    }
  });

  // Overlay effects
  if (sp.filmGrain) {
    ctx.globalAlpha=0.05;
    for(let i=0;i<500;i++){
      ctx.fillStyle="#fff";
      ctx.fillRect(Math.random()*w, Math.random()*h, 1, 1);
    }
    ctx.globalAlpha=1;
  }
  if (sp.lensFlare) {
    ctx.globalAlpha=0.15;
    const lg=ctx.createRadialGradient(w*0.8,h*0.2,0,w*0.8,h*0.2,80);
    lg.addColorStop(0,"#ffffff"); lg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=lg; ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=1;
  }

  // Style label
  ctx.fillStyle="rgba(0,255,200,0.7)"; ctx.font="10px JetBrains Mono,monospace";
  ctx.fillText(style, 8, h-8);
}

export default function TwoDViewportPanel({ liveKeyframes }) {
  const canvasA = useRef(null);
  const canvasB = useRef(null);
  const [styleA, setStyleA]   = useState("Marvel What If");
  const [styleB, setStyleB]   = useState("Manga B&W");
  const [blending, setBlending] = useState(false);
  const [blendAmt, setBlendAmt] = useState(0.5);
  const [playing, setPlaying] = useState(true);
  const [fps, setFps]         = useState(24);
  const [splitMode, setSplitMode] = useState("Side by Side");
  const [status, setStatus]   = useState("");
  const raf = useRef(null);
  const t   = useRef(0);
  const lastT = useRef(0);

  const KF = liveKeyframes || DEMO_KF;

  const splitModes = ["Side by Side","Style A Only","Style B Only","Blend Preview","Quad View"];

  useEffect(() => {
    const tick = (now) => {
      const dt = Math.min((now - lastT.current)/1000, 0.05);
      lastT.current = now;
      if (playing) t.current += dt;

      const w=320, h=360;
      const kf = { ...KF };
      Object.keys(kf).forEach(b => {
        if (!kf[b].rotation) kf[b] = { ...kf[b], rotation:0, scale:1 };
      });

      if (canvasA.current) {
        canvasA.current.width = w; canvasA.current.height = h;
        drawStickFigure(canvasA.current.getContext("2d"), kf, styleA, w, h, t.current);
      }
      if (canvasB.current && splitMode !== "Style A Only") {
        canvasB.current.width = w; canvasB.current.height = h;
        if (blending) {
          const kfA = applyStyleTransform(kf, styleA, t.current);
          const kfB2 = applyStyleTransform(kf, styleB, t.current);
          const blended = blendStyles(kfA, kfB2, blendAmt);
          // Draw blended on canvas B using style A rendering
          drawStickFigure(canvasB.current.getContext("2d"), blended, styleA, w, h, t.current);
        } else {
          drawStickFigure(canvasB.current.getContext("2d"), kf, styleB, w, h, t.current);
        }
      }

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [styleA, styleB, blending, blendAmt, playing, splitMode, liveKeyframes]);

  function exportFrame() {
    if (!canvasA.current) return;
    const a = document.createElement("a");
    a.href = canvasA.current.toDataURL("image/png");
    a.download = `spx_2d_${styleA.replace(/ /g,"_")}.png`;
    a.click();
    setStatus("Frame exported");
  }

  const canPair = COMBINABLE_PAIRS.some(([a,b]) => (a===styleA&&b===styleB)||(a===styleB&&b===styleA));

  return (
    <div style={S.root}>
      <div style={S.h2}>🎬 2D VIEWPORT</div>
      <div style={S.sec}>
        <label style={S.lbl}>Style A</label>
        <select style={S.sel} value={styleA} onChange={e=>setStyleA(e.target.value)}>
          {STYLE_NAMES.map(s=><option key={s}>{s}</option>)}
        </select>
        <label style={S.lbl}>Style B</label>
        <select style={S.sel} value={styleB} onChange={e=>setStyleB(e.target.value)}>
          {STYLE_NAMES.map(s=><option key={s}>{s}</option>)}
        </select>
        {canPair && <div style={{...S.stat,color:T.orange}}>✓ Compatible pair — blending supported</div>}
        <label style={S.lbl}>View Mode</label>
        <select style={S.sel} value={splitMode} onChange={e=>setSplitMode(e.target.value)}>
          {splitModes.map(s=><option key={s}>{s}</option>)}
        </select>
        <label style={S.lbl}><input type="checkbox" checked={blending} onChange={e=>setBlending(e.target.checked)}/> Blend Styles</label>
        {blending && <>
          <label style={S.lbl}>Blend: {(blendAmt*100).toFixed(0)}% B</label>
          <input style={S.inp} type="range" min={0} max={1} step={0.01} value={blendAmt} onChange={e=>setBlendAmt(+e.target.value)}/>
        </>}
        <label style={S.lbl}>FPS: {fps}</label>
        <input style={S.inp} type="range" min={8} max={60} step={1} value={fps} onChange={e=>setFps(+e.target.value)}/>
        <label style={S.lbl}><input type="checkbox" checked={playing} onChange={e=>setPlaying(e.target.checked)}/> Animate</label>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {splitMode !== "Style B Only" && (
          <div>
            <div style={{...S.lbl,color:T.teal}}>{blending?"Blended":styleA}</div>
            <canvas ref={canvasA} style={{...S.canvas,width:splitMode==="Side by Side"?"calc(50% - 4px)":"100%",height:360}}/>
          </div>
        )}
        {splitMode !== "Style A Only" && splitMode !== "Blend Preview" && (
          <div>
            <div style={{...S.lbl,color:T.orange}}>{styleB}</div>
            <canvas ref={canvasB} style={{...S.canvas,width:splitMode==="Side by Side"?"calc(50% - 4px)":"100%",height:360}}/>
          </div>
        )}
      </div>
      <div style={{marginTop:8}}>
        <button style={S.btn} onClick={()=>setPlaying(!playing)}>{playing?"⏸ Pause":"▶ Play"}</button>
        <button style={S.btnO} onClick={exportFrame}>💾 Export Frame</button>
      </div>
      {status && <div style={{...S.stat,marginTop:8}}>{status}</div>}
      <div style={S.sec}>
        <div style={S.lbl}>Combinable Style Pairs</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {COMBINABLE_PAIRS.map(([a,b])=>(
            <button key={a+b} style={S.btnSm} onClick={()=>{setStyleA(a);setStyleB(b);setBlending(true);}}>
              {a} + {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
'''

# ── CHARACTER SKIN STUDIO ──────────────────────────────────────────────────────
FILES[f"{P}/CharacterSkinStudioPanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},tabs:{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12},tab:(a)=>({background:a?T.teal:T.panel,color:a?T.bg:T.muted,border:"1px solid "+(a?T.teal:"#333"),borderRadius:4,padding:"4px 12px",fontFamily:T.font,fontSize:11,cursor:"pointer"}),prev:{width:"100%",height:140,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const TABS=["Human Skin","Creature Skin","Makeup","Export"];

const HUMAN_PRESETS={
  "Fair Porcelain":{base:"#f5e4d3",mid:"#e8c9a8",deep:"#c8956a",lip:"#cc7788",cheek:"#ee9999",vein:"#9999cc",pore:0.3,roughness:0.5,sss:0.95},
  "Light Warm":    {base:"#f0c896",mid:"#d4a06a",deep:"#b07840",lip:"#cc6655",cheek:"#dd8888",vein:"#8899bb",pore:0.4,roughness:0.52,sss:0.9},
  "Medium Olive":  {base:"#c8955a",mid:"#a87040",deep:"#885030",lip:"#993344",cheek:"#bb6655",vein:"#7788aa",pore:0.5,roughness:0.55,sss:0.85},
  "Medium Brown":  {base:"#a06840",mid:"#805030",deep:"#603820",lip:"#882233",cheek:"#993333",vein:"#667799",pore:0.5,roughness:0.57,sss:0.82},
  "Deep Brown":    {base:"#704828",mid:"#503018",deep:"#38200c",lip:"#661122",cheek:"#772222",vein:"#556688",pore:0.55,roughness:0.6,sss:0.78},
  "Deep Ebony":    {base:"#3a2010",mid:"#28160a",deep:"#1a0c04",lip:"#551111",cheek:"#661111",vein:"#334466",pore:0.6,roughness:0.62,sss:0.75},
  "East Asian":    {base:"#f0d8b8",mid:"#d8b890",deep:"#b89068",lip:"#cc8877",cheek:"#ddaaaa",vein:"#9999cc",pore:0.35,roughness:0.5,sss:0.92},
  "South Asian":   {base:"#c8955a",mid:"#a87848",deep:"#885830",lip:"#882233",cheek:"#aa5544",vein:"#778899",pore:0.48,roughness:0.55,sss:0.84},
  "Middle Eastern":{base:"#d4a878",mid:"#b88858",deep:"#9a6840",lip:"#993344",cheek:"#bb6655",vein:"#8899aa",pore:0.45,roughness:0.53,sss:0.87},
  "Nordic":        {base:"#faeadc",mid:"#f0d0b8",deep:"#d8a888",lip:"#cc8888",cheek:"#ffaaaa",vein:"#aaaadd",pore:0.25,roughness:0.48,sss:0.97},
  "Afro-Brazilian":{base:"#8a5530",mid:"#6a3818",deep:"#4a2208",lip:"#771122",cheek:"#882222",vein:"#445566",pore:0.52,roughness:0.58,sss:0.8},
  "Mixed Ancestry":{base:"#c89060",mid:"#a07040",deep:"#785028",lip:"#883344",cheek:"#aa5555",vein:"#667788",pore:0.45,roughness:0.54,sss:0.86},
};

const CREATURE_SKINS={
  "Reptile Green":     {base:"#3a6632",mid:"#2a4a24",scale:true, scaleSize:0.8, scaleColor:"#1a3318",roughness:0.75,metalness:0.05,sheen:"#44aa44"},
  "Reptile Desert":    {base:"#c8a050",mid:"#a07838",scale:true, scaleSize:0.6, scaleColor:"#806028",roughness:0.8, metalness:0.02,sheen:"#ddbb66"},
  "Reptile Dark":      {base:"#1a1a1a",mid:"#111111",scale:true, scaleSize:0.5, scaleColor:"#050505",roughness:0.7, metalness:0.1, sheen:"#222222"},
  "Reptile Chameleon": {base:"#6a9a3a",mid:"#4a7a2a",scale:true, scaleSize:0.7, scaleColor:"#2a5a1a",roughness:0.7, metalness:0.05,sheen:"#88dd44",iridescent:true},
  "Dragon Red":        {base:"#8b1a1a",mid:"#5a0808",scale:true, scaleSize:1.2, scaleColor:"#3a0404",roughness:0.6, metalness:0.3, sheen:"#ff4400",glow:true,emissive:"#aa2200"},
  "Dragon Black":      {base:"#111118",mid:"#080810",scale:true, scaleSize:1.4, scaleColor:"#040408",roughness:0.4, metalness:0.6, sheen:"#4400ff",glow:true,emissive:"#220066"},
  "Dragon Gold":       {base:"#d4a020",mid:"#a07818",scale:true, scaleSize:1.3, scaleColor:"#785810",roughness:0.3, metalness:0.8, sheen:"#ffdd00",glow:true},
  "Dragon Ice":        {base:"#aaddff",mid:"#88bbdd",scale:true, scaleSize:1.1, scaleColor:"#5599bb",roughness:0.15,metalness:0.4, sheen:"#00ddff",glow:true,transparent:true,opacity:0.85},
  "Dragon Poison":     {base:"#2a8a2a",mid:"#1a5a1a",scale:true, scaleSize:1.0, scaleColor:"#0a3a0a",roughness:0.55,metalness:0.15,sheen:"#44ff44",glow:true,emissive:"#22aa22"},
  "Shark Skin":        {base:"#556677",mid:"#3a4a55",scale:false,scaleSize:0,   scaleColor:"#223344",roughness:0.85,metalness:0.02,sheen:"#778899"},
  "Rock Stone":        {base:"#888888",mid:"#666666",scale:false,scaleSize:0,   scaleColor:"#444444",roughness:0.98,metalness:0.0, sheen:"#999999"},
  "Volcanic Rock":     {base:"#1a1a1a",mid:"#0a0a0a",scale:false,scaleSize:0,   scaleColor:"#ff3300",roughness:0.95,metalness:0.0, sheen:"#ff2200",glow:true,emissive:"#ff1100"},
  "Sand/Desert":       {base:"#d4b87a",mid:"#b89458",scale:false,scaleSize:0,   scaleColor:"#a07840",roughness:0.99,metalness:0.0, sheen:"#ddcc88"},
  "Water Liquid":      {base:"#2244aa",mid:"#113388",scale:false,scaleSize:0,   scaleColor:"#001166",roughness:0.05,metalness:0.0, sheen:"#44aaff",transparent:true,opacity:0.7},
  "Ice Crystal":       {base:"#cceeff",mid:"#aaddff",scale:false,scaleSize:0,   scaleColor:"#88ccee",roughness:0.05,metalness:0.2, sheen:"#ffffff",transparent:true,opacity:0.75},
  "Metal Chrome":      {base:"#cccccc",mid:"#aaaaaa",scale:false,scaleSize:0,   scaleColor:"#888888",roughness:0.05,metalness:1.0, sheen:"#ffffff"},
  "Metal Rusted":      {base:"#884422",mid:"#663311",scale:false,scaleSize:0,   scaleColor:"#441100",roughness:0.95,metalness:0.6, sheen:"#cc6633"},
  "Metal Dark":        {base:"#222233",mid:"#111122",scale:false,scaleSize:0,   scaleColor:"#080812",roughness:0.3, metalness:0.9, sheen:"#4444aa"},
  "Lava Skin":         {base:"#cc3300",mid:"#882200",scale:false,scaleSize:0,   scaleColor:"#441100",roughness:0.8, metalness:0.1, sheen:"#ff6600",glow:true,emissive:"#ff2200"},
  "Obsidian":          {base:"#0a0a14",mid:"#050508",scale:false,scaleSize:0,   scaleColor:"#000004",roughness:0.1, metalness:0.7, sheen:"#6600ff"},
  "Bioluminescent":    {base:"#003322",mid:"#002218",scale:true, scaleSize:0.7, scaleColor:"#001108",roughness:0.4, metalness:0.0, sheen:"#00ffaa",glow:true,emissive:"#00ff88"},
  "Bark/Wood":         {base:"#5c3a1a",mid:"#3a2010",scale:false,scaleSize:0,   scaleColor:"#1a0c04",roughness:0.97,metalness:0.0, sheen:"#886644"},
  "Fur Dark":          {base:"#332211",mid:"#221108",scale:false,scaleSize:0,   scaleColor:"#110804",roughness:0.95,metalness:0.0, sheen:"#554433",fur:true},
  "Fur White":         {base:"#eeeeee",mid:"#dddddd",scale:false,scaleSize:0,   scaleColor:"#cccccc",roughness:0.95,metalness:0.0, sheen:"#ffffff",fur:true},
  "Demon Red":         {base:"#660000",mid:"#440000",scale:true, scaleSize:0.4, scaleColor:"#220000",roughness:0.6, metalness:0.2, sheen:"#ff0000",glow:true,emissive:"#880000"},
  "Demon Black":       {base:"#111111",mid:"#080808",scale:true, scaleSize:0.45,scaleColor:"#030303",roughness:0.5, metalness:0.4, sheen:"#9900ff",glow:true,emissive:"#440088"},
  "Undead Pale":       {base:"#c8d8c0",mid:"#a0b898",scale:false,scaleSize:0,   scaleColor:"#788870",roughness:0.7, metalness:0.0, sheen:"#aaccaa"},
  "Void/Cosmic":       {base:"#050510",mid:"#020208",scale:false,scaleSize:0,   scaleColor:"#000004",roughness:0.0, metalness:0.0, sheen:"#8844ff",glow:true,emissive:"#220066",starfield:true},
  "Crystal Gem":       {base:"#ff88cc",mid:"#dd44aa",scale:false,scaleSize:0,   scaleColor:"#aa2288",roughness:0.02,metalness:0.3, sheen:"#ffccee",transparent:true,opacity:0.8,glow:true},
  "Swamp Creature":    {base:"#3a5a22",mid:"#2a4018",scale:true, scaleSize:0.6, scaleColor:"#1a2a0a",roughness:0.88,metalness:0.0, sheen:"#557733"},
};

const MAKEUP_LAYERS=[
  {id:"foundation",label:"Foundation",default:0},
  {id:"blush",     label:"Blush",     default:0},
  {id:"contour",   label:"Contour",   default:0},
  {id:"highlight", label:"Highlight", default:0},
  {id:"eyeshadow", label:"Eye Shadow",default:0},
  {id:"eyeliner",  label:"Eyeliner",  default:0},
  {id:"lipstick",  label:"Lipstick",  default:0},
  {id:"bronzer",   label:"Bronzer",   default:0},
  {id:"freckles",  label:"Freckles",  default:0},
  {id:"warpaint",  label:"War Paint", default:0},
  {id:"runic",     label:"Runic Marks",default:0},
  {id:"tribal",    label:"Tribal Marks",default:0},
];

function generateSkinCanvas(preset,makeup,isCreature){
  const size=512,canvas=document.createElement("canvas");
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext("2d");
  const p=isCreature?CREATURE_SKINS[preset]:HUMAN_PRESETS[preset];
  if(!p){ctx.fillStyle="#888";ctx.fillRect(0,0,size,size);return canvas;}
  ctx.fillStyle=p.base;ctx.fillRect(0,0,size,size);
  if(!isCreature){
    // SSS radial
    const sg=ctx.createRadialGradient(size*.5,size*.4,0,size*.5,size*.4,size*.6);
    sg.addColorStop(0,p.base+"cc");sg.addColorStop(.4,p.mid+"99");sg.addColorStop(1,p.deep+"55");
    ctx.fillStyle=sg;ctx.fillRect(0,0,size,size);
    // pore noise
    ctx.globalAlpha=p.pore*.3;
    for(let i=0;i<4000;i++){const x=Math.random()*size,y=Math.random()*size;ctx.beginPath();ctx.arc(x,y,.5+Math.random()*1.5,0,Math.PI*2);ctx.fillStyle=p.deep;ctx.fill();}
    ctx.globalAlpha=1;
    // veins
    ctx.globalAlpha=0.06;
    for(let i=0;i<8;i++){
      ctx.strokeStyle=p.vein;ctx.lineWidth=.5+Math.random();ctx.beginPath();
      let vx=Math.random()*size*.4+(i%2?size*.6:0),vy=Math.random()*size*.3;
      ctx.moveTo(vx,vy);
      for(let j=0;j<6;j++){vx+=(Math.random()-.5)*30;vy+=15+Math.random()*20;ctx.lineTo(vx,vy);}
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    // makeup
    if(makeup){
      if(makeup.blush>0){
        [[size*.28,size*.52],[size*.72,size*.52]].forEach(([cx,cy])=>{
          const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,size*.18);
          bg.addColorStop(0,`rgba(220,80,80,${makeup.blush*.5})`);bg.addColorStop(1,"rgba(220,80,80,0)");
          ctx.fillStyle=bg;ctx.fillRect(0,0,size,size);
        });
      }
      if(makeup.contour>0){ctx.globalAlpha=makeup.contour*.35;ctx.fillStyle=p.deep;ctx.fillRect(0,size*.6,size*.14,size*.25);ctx.fillRect(size*.86,size*.6,size*.14,size*.25);ctx.globalAlpha=1;}
      if(makeup.highlight>0){ctx.globalAlpha=makeup.highlight*.5;ctx.fillStyle="#ffffff";ctx.fillRect(size*.3,size*.38,size*.4,size*.06);ctx.globalAlpha=1;}
      if(makeup.eyeshadow>0){
        const ec=["#6644aa","#224488","#882244","#226644","#884422"][Math.floor(makeup.eyeshadow*4.99)];
        ctx.globalAlpha=makeup.eyeshadow*.6;ctx.fillStyle=ec;
        [[size*.28,size*.35],[size*.72,size*.35]].forEach(([ex,ey])=>{ctx.beginPath();ctx.ellipse(ex,ey,size*.12,size*.05,0,0,Math.PI*2);ctx.fill();});
        ctx.globalAlpha=1;
      }
      if(makeup.eyeliner>0){ctx.globalAlpha=makeup.eyeliner*.9;ctx.strokeStyle="#111111";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(size*.18,size*.35);ctx.lineTo(size*.38,size*.34);ctx.stroke();ctx.beginPath();ctx.moveTo(size*.62,size*.34);ctx.lineTo(size*.82,size*.35);ctx.stroke();ctx.globalAlpha=1;}
      if(makeup.lipstick>0){
        const lc=["#cc4444","#aa1122","#882244","#cc6644","#dd2266"][Math.floor(makeup.lipstick*4.99)];
        ctx.globalAlpha=makeup.lipstick*.85;ctx.fillStyle=lc;ctx.beginPath();ctx.ellipse(size*.5,size*.78,size*.12,size*.035,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      }
      if(makeup.freckles>0){ctx.globalAlpha=makeup.freckles*.6;for(let i=0;i<makeup.freckles*80;i++){ctx.beginPath();ctx.arc(size*.2+Math.random()*size*.6,size*.25+Math.random()*size*.3,1+Math.random()*2,0,Math.PI*2);ctx.fillStyle=p.deep;ctx.fill();}ctx.globalAlpha=1;}
      if(makeup.warpaint>0){ctx.globalAlpha=makeup.warpaint*.85;ctx.strokeStyle="#cc2200";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(size*.15,size*.35);ctx.lineTo(size*.45,size*.45);ctx.stroke();ctx.beginPath();ctx.moveTo(size*.85,size*.35);ctx.lineTo(size*.55,size*.45);ctx.stroke();ctx.globalAlpha=1;}
      if(makeup.runic>0){ctx.globalAlpha=makeup.runic*.75;ctx.fillStyle="#00ffc8";ctx.font=`${Math.floor(size*.08)}px serif`;ctx.fillText("᚛ᚔ᚜",size*.35,size*.92);ctx.globalAlpha=1;}
      if(makeup.tribal>0){ctx.globalAlpha=makeup.tribal*.8;ctx.strokeStyle="#1a1a1a";ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(size*.05,size*(.3+i*.1));ctx.quadraticCurveTo(size*.2,size*(.25+i*.1),size*.35,size*(.3+i*.1));ctx.stroke();}ctx.globalAlpha=1;}
    }
  } else {
    // Creature
    if(p.scale&&p.scaleSize>0){
      const ss=p.scaleSize*12;ctx.strokeStyle=p.scaleColor;ctx.lineWidth=0.8;
      for(let row=0;row*ss<size+ss;row++){for(let col=0;col*ss*.866<size+ss;col++){
        const cx=col*ss*.866+(row%2?ss*.433:0),cy=row*ss*.75;
        ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;ctx.lineTo(cx+Math.cos(a)*ss*.48,cy+Math.sin(a)*ss*.48);}
        ctx.closePath();ctx.fillStyle=row%3===0?p.scaleColor:p.base;ctx.fill();ctx.stroke();
      }}
    }
    if(p.fur){ctx.globalAlpha=.6;for(let i=0;i<3000;i++){const fx=Math.random()*size,fy=Math.random()*size,len=4+Math.random()*8,angle=(Math.random()-.5)*.8;ctx.strokeStyle=p.sheen;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+Math.sin(angle)*len,fy-Math.cos(angle)*len);ctx.stroke();}ctx.globalAlpha=1;}
    if(p.glow){const gg=ctx.createRadialGradient(size*.5,size*.5,0,size*.5,size*.5,size*.6);gg.addColorStop(0,(p.emissive||p.sheen)+"44");gg.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=gg;ctx.fillRect(0,0,size,size);}
    if(p.iridescent){ctx.globalAlpha=.3;const ig=ctx.createLinearGradient(0,0,size,size);ig.addColorStop(0,"#ff0088");ig.addColorStop(.33,"#00ff88");ig.addColorStop(.66,"#0088ff");ig.addColorStop(1,"#ff0088");ctx.fillStyle=ig;ctx.fillRect(0,0,size,size);ctx.globalAlpha=1;}
    if(p.starfield){for(let i=0;i<200;i++){ctx.beginPath();ctx.arc(Math.random()*size,Math.random()*size,Math.random()*1.5,0,Math.PI*2);ctx.globalAlpha=Math.random()*.8;ctx.fillStyle="#ffffff";ctx.fill();}ctx.globalAlpha=1;}
  }
  return canvas;
}

export default function CharacterSkinStudioPanel({scene}){
  const [tab,setTab]=useState("Human Skin");
  const [humanP,setHumanP]=useState("Fair Porcelain");
  const [creatureP,setCreatureP]=useState("Reptile Green");
  const [makeup,setMakeup]=useState(()=>Object.fromEntries(MAKEUP_LAYERS.map(l=>[l.id,l.default])));
  const [roughness,setRoughness]=useState(0.55);
  const [metalness,setMetalness]=useState(0.0);
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);
  const isC=tab==="Creature Skin";
  const activeP=isC?creatureP:humanP;
  const presets=isC?Object.keys(CREATURE_SKINS):Object.keys(HUMAN_PRESETS);

  function updatePreview(){
    const c=generateSkinCanvas(activeP,makeup,isC);
    if(prevRef.current){const ctx=prevRef.current.getContext("2d");ctx.clearRect(0,0,prevRef.current.width,prevRef.current.height);ctx.drawImage(c,0,0,prevRef.current.width,prevRef.current.height);}
  }

  function applyToScene(){
    if(!scene){setStatus("No scene");return;}
    const c=generateSkinCanvas(activeP,makeup,isC);
    const tex=new THREE.CanvasTexture(c);
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1,1);
    const p=isC?CREATURE_SKINS[activeP]:HUMAN_PRESETS[activeP];
    const mat=new THREE.MeshStandardMaterial({
      map:tex,color:new THREE.Color(p?.base||"#888"),
      roughness:roughness,metalness:metalness,
      transparent:p?.transparent||false,opacity:p?.opacity||1,
      emissive:p?.emissive?new THREE.Color(p.emissive):new THREE.Color(0x000000),
      emissiveIntensity:p?.glow?0.4:0,
    });
    let n=0;
    scene.traverse(o=>{if(o.isMesh){o.material=mat;o.material.needsUpdate=true;n++;}});
    setStatus(`✓ ${activeP} applied to ${n} mesh(es)`);
  }

  function downloadTexture(){
    const c=generateSkinCanvas(activeP,makeup,isC,512);
    const a=document.createElement("a");a.href=c.toDataURL("image/png");
    a.download=`spx_skin_${activeP.replace(/ /g,"_").toLowerCase()}.png`;a.click();
    setStatus("Texture downloaded");
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🧬 CHARACTER SKIN STUDIO</div>
      <div style={S.tabs}>{TABS.map(t=><button key={t} style={S.tab(tab===t)} onClick={()=>{setTab(t);setTimeout(updatePreview,0);}}>{t}</button>)}</div>

      {(tab==="Human Skin"||tab==="Creature Skin")&&<>
        <div style={S.sec}>
          <label style={S.lbl}>{isC?"Creature":"Human"} Skin Preset</label>
          <select style={S.sel} value={activeP} onChange={e=>{isC?setCreatureP(e.target.value):setHumanP(e.target.value);setTimeout(updatePreview,50);}}>
            {presets.map(p=><option key={p}>{p}</option>)}
          </select>
          <canvas ref={prevRef} width={200} height={140} style={S.prev}/>
          <button style={{...S.btnSm}} onClick={updatePreview}>👁 Preview</button>
        </div>
        <div style={S.sec}>
          <label style={S.lbl}>Roughness: {roughness.toFixed(2)}</label>
          <input style={S.inp} type="range" min={0} max={1} step={0.01} value={roughness} onChange={e=>setRoughness(+e.target.value)}/>
          <label style={S.lbl}>Metalness: {metalness.toFixed(2)}</label>
          <input style={S.inp} type="range" min={0} max={1} step={0.01} value={metalness} onChange={e=>setMetalness(+e.target.value)}/>
        </div>
      </>}

      {tab==="Makeup"&&<div style={S.sec}>
        <div style={S.h3}>Makeup & Markings</div>
        {MAKEUP_LAYERS.map(l=>(
          <div key={l.id}>
            <label style={S.lbl}>{l.label}: {(makeup[l.id]*100).toFixed(0)}%</label>
            <input style={S.inp} type="range" min={0} max={1} step={0.01} value={makeup[l.id]} onChange={e=>setMakeup(m=>({...m,[l.id]:+e.target.value}))}/>
          </div>
        ))}
        <button style={S.btnSm} onClick={()=>{setMakeup(Object.fromEntries(MAKEUP_LAYERS.map(l=>[l.id,l.default])));setStatus("Makeup cleared");}}>Clear All</button>
      </div>}

      {tab==="Export"&&<div style={S.sec}>
        <div style={S.h3}>Export Options</div>
        <div style={{fontSize:10,color:"#888",marginBottom:8,lineHeight:1.6}}>
          Exports 512×512 PNG texture map<br/>
          Ready for GLB/FBX/OBJ import<br/>
          PBR-compatible (roughness/metalness workflow)
        </div>
        <button style={S.btn} onClick={downloadTexture}>💾 Download PNG Texture</button>
      </div>}

      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      <button style={S.btnO} onClick={downloadTexture}>💾 Download PNG</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ── MODEL GENERATOR ────────────────────────────────────────────────────────────
FILES[f"{P}/ModelGeneratorPanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const ARCHETYPES=["Realistic Human","Stylized Human","Hero/Superhero","Creature Humanoid","Demon Humanoid","Dragon Humanoid","Kaiju Humanoid","Vampire","Monster Hybrid","Robot/Android","Elder/Ancient","Child/Youth"];
const ANCESTRY=["African Inspired","East Asian Inspired","South Asian Inspired","Middle Eastern Inspired","European Inspired","Afro-Brazilian Inspired","Nordic Inspired","Mixed/Global Neutral","Fantasy Heritage","Alien Heritage"];
const PROPORTIONS=["Realistic","Heroic (8-head)","Stylized (7-head)","Exaggerated","Chibi (4-head)","Elongated","Hulking"];
const TOPOLOGY=["Animation Ready","High Detail","Low Poly Game","Base Mesh","Hero Topology","Creature Ready"];
const GENDER=["Masculine","Feminine","Neutral/Androgynous","Non-binary Custom"];

const PROP_DATA={
  "Realistic":       {headRatio:7.5, shoulderW:1.5, hipW:1.2, torsoLen:1.0, legLen:1.0, armLen:1.0},
  "Heroic (8-head)": {headRatio:8,   shoulderW:2.0, hipW:1.3, torsoLen:1.1, legLen:1.15, armLen:1.1},
  "Stylized (7-head)":{headRatio:7,  shoulderW:1.6, hipW:1.25,torsoLen:1.0, legLen:1.0, armLen:1.0},
  "Exaggerated":     {headRatio:6,   shoulderW:2.4, hipW:1.4, torsoLen:0.9, legLen:1.3, armLen:1.2},
  "Chibi (4-head)":  {headRatio:4,   shoulderW:1.2, hipW:1.1, torsoLen:0.6, legLen:0.55,armLen:0.7},
  "Elongated":       {headRatio:9,   shoulderW:1.3, hipW:1.0, torsoLen:1.2, legLen:1.4, armLen:1.2},
  "Hulking":         {headRatio:7,   shoulderW:2.8, hipW:1.5, torsoLen:1.1, legLen:1.0, armLen:1.15},
};

function buildCharacterMesh(scene, cfg) {
  const meshes = [];
  const p = PROP_DATA[cfg.proportions] || PROP_DATA["Realistic"];
  const h = cfg.height;
  const headH = h / p.headRatio;
  const genderFem = cfg.gender === "Feminine" ? 1 : 0;
  const matCol = new THREE.Color(0xc8955a);
  const mat = new THREE.MeshStandardMaterial({ color: matCol, roughness: 0.6 });

  const add = (geo, px, py, pz, rx=0, ry=0, rz=0) => {
    const m = new THREE.Mesh(geo, mat.clone());
    m.position.set(px, py, pz);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    scene.add(m); meshes.push(m); return m;
  };

  // Head
  add(new THREE.SphereGeometry(headH * 0.5, 16, 12), 0, h - headH * 0.5, 0);
  // Neck
  add(new THREE.CylinderGeometry(headH*0.18, headH*0.22, headH*0.35, 8), 0, h - headH - headH*0.175, 0);
  // Torso
  const tw = headH * p.shoulderW, th = headH * 2.2 * p.torsoLen;
  const torsoGeo = new THREE.BoxGeometry(tw, th, headH * 0.7);
  add(torsoGeo, 0, h - headH - headH*0.35 - th*0.5, 0);
  // Hips
  const hw = headH * (p.hipW + genderFem * 0.2), hh = headH * 0.6;
  add(new THREE.BoxGeometry(hw, hh, headH * 0.6), 0, h - headH - headH*0.35 - th - hh*0.5, 0);
  // Upper arms
  const armW = headH * 0.22, armH = headH * 1.3 * p.armLen;
  [-1, 1].forEach(side => {
    add(new THREE.CylinderGeometry(armW, armW*0.9, armH, 8), side*(tw/2+armW), h-headH-headH*.4-armH*.5, 0);
    // Forearm
    add(new THREE.CylinderGeometry(armW*0.85, armW*0.7, armH*0.9, 8), side*(tw/2+armW), h-headH-headH*.4-armH-armH*.9*.5, 0);
    // Hand
    add(new THREE.BoxGeometry(headH*0.25, headH*0.3, headH*0.15), side*(tw/2+armW), h-headH-headH*.4-armH-armH*.9-headH*.15, 0);
  });
  // Legs
  const legW = headH * 0.26, legH = headH * 2.3 * p.legLen;
  const hipY = h - headH - headH*0.35 - th - hh;
  [-1, 1].forEach(side => {
    // Thigh
    add(new THREE.CylinderGeometry(legW*1.1, legW*0.9, legH, 8), side*headH*0.3, hipY - legH*0.5, 0);
    // Shin
    add(new THREE.CylinderGeometry(legW*0.9, legW*0.7, legH*0.95, 8), side*headH*0.3, hipY - legH - legH*.95*.5, 0);
    // Foot
    add(new THREE.BoxGeometry(headH*0.35, headH*0.18, headH*0.55), side*headH*0.3, hipY - legH - legH*.95 - headH*.09, headH*0.15);
  });

  // Eyes
  const eyeY = h - headH*0.55, eyeGeo = new THREE.SphereGeometry(headH*0.1, 8, 6);
  [-1,1].forEach(s=>{const em=add(eyeGeo,s*headH*0.2,eyeY,headH*0.42);em.material=new THREE.MeshStandardMaterial({color:cfg.eyeColor||0x224488,roughness:0.05,metalness:0.3});});

  // Creature / demon extras
  if(cfg.archetype.includes("Dragon")||cfg.archetype.includes("Kaiju")){
    const tailGeo=new THREE.CylinderGeometry(headH*0.15,headH*0.05,headH*2,6);
    add(tailGeo,0,hipY-headH*0.5,-(headH*0.5),0.8,0,0);
  }
  if(cfg.archetype.includes("Demon")){
    [[-.25,.35,.22],[.25,.35,.22]].forEach(([x,y,z])=>{
      const hg=new THREE.ConeGeometry(headH*.1,headH*.4,4);
      const hm=add(hg,x*headH,(h-headH*.15+y*headH),z*headH);
      hm.material=new THREE.MeshStandardMaterial({color:0x442200,roughness:0.7});
    });
  }

  // Ambient + directional lights
  if(!scene.getObjectByName("model_amb")){
    const a=new THREE.AmbientLight(0xffffff,.7);a.name="model_amb";scene.add(a);meshes.push(a);
    const d=new THREE.DirectionalLight(0xffeedd,1);d.position.set(20,40,20);d.castShadow=true;scene.add(d);meshes.push(d);
  }

  return meshes;
}

export default function ModelGeneratorPanel({scene}){
  const [archetype,setArchetype]=useState("Realistic Human");
  const [ancestry,setAncestry]=useState("Mixed/Global Neutral");
  const [proportions,setProportions]=useState("Realistic");
  const [topology,setTopology]=useState("Animation Ready");
  const [gender,setGender]=useState("Neutral/Androgynous");
  const [height,setHeight]=useState(1.75);
  const [realism,setRealism]=useState(0.8);
  const [mascFem,setMascFem]=useState(0.5);
  const [eyeColor,setEyeColor]=useState("#224488");
  const [status,setStatus]=useState("");
  const [stats,setStats]=useState(null);
  const meshes=useRef([]);

  function clear(){meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();});meshes.current=[];setStats(null);}

  function generate(){
    if(!scene){setStatus("No scene");return;}
    clear();setStatus("Building character…");
    const cfg={archetype,ancestry,proportions,topology,gender,height,realism,mascFem,eyeColor:new THREE.Color(eyeColor)};
    const ms=buildCharacterMesh(scene,cfg);
    meshes.current=ms;
    setStats({archetype,proportions,gender,height,meshCount:ms.filter(m=>m.isMesh).length});
    setStatus(`✓ ${archetype} built — ${ms.filter(m=>m.isMesh).length} meshes`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🧍 MODEL GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Archetype</label>
        <select style={S.sel} value={archetype} onChange={e=>setArchetype(e.target.value)}>{ARCHETYPES.map(a=><option key={a}>{a}</option>)}</select>
        <label style={S.lbl}>Ancestry / Heritage</label>
        <select style={S.sel} value={ancestry} onChange={e=>setAncestry(e.target.value)}>{ANCESTRY.map(a=><option key={a}>{a}</option>)}</select>
        <label style={S.lbl}>Proportions</label>
        <select style={S.sel} value={proportions} onChange={e=>setProportions(e.target.value)}>{PROPORTIONS.map(p=><option key={p}>{p}</option>)}</select>
        <label style={S.lbl}>Topology</label>
        <select style={S.sel} value={topology} onChange={e=>setTopology(e.target.value)}>{TOPOLOGY.map(t=><option key={t}>{t}</option>)}</select>
        <label style={S.lbl}>Gender Expression</label>
        <select style={S.sel} value={gender} onChange={e=>setGender(e.target.value)}>{GENDER.map(g=><option key={g}>{g}</option>)}</select>
        <label style={S.lbl}>Height: {height.toFixed(2)}m</label>
        <input style={S.inp} type="range" min={.9} max={3.5} step={.01} value={height} onChange={e=>setHeight(+e.target.value)}/>
        <label style={S.lbl}>Realism ↔ Stylized: {(realism*100).toFixed(0)}%</label>
        <input style={S.inp} type="range" min={0} max={1} step={.01} value={realism} onChange={e=>setRealism(+e.target.value)}/>
        <label style={S.lbl}>Masculine ↔ Feminine: {(mascFem*100).toFixed(0)}%</label>
        <input style={S.inp} type="range" min={0} max={1} step={.01} value={mascFem} onChange={e=>setMascFem(+e.target.value)}/>
        <label style={S.lbl}>Eye Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={eyeColor} onChange={e=>setEyeColor(e.target.value)}/>
      </div>
      <button style={S.btn} onClick={generate}>⚡ Generate</button>
      <button style={S.btnO} onClick={clear}>🗑 Clear</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
      {stats&&<div style={S.sec}><div style={S.stat}>Type: {stats.archetype}</div><div style={S.stat}>Proportions: {stats.proportions}</div><div style={S.stat}>Gender: {stats.gender}</div><div style={S.stat}>Height: {stats.height}m | Meshes: {stats.meshCount}</div></div>}
    </div>
  );
}
'''

# ── EYE GENERATOR ──────────────────────────────────────────────────────────────
FILES[f"{P}/EyeGeneratorPanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},prev:{width:"100%",height:120,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const EYE_TYPES=["Natural Human","Heroic","Reptile/Snake","Dragon Slit","Demon Glow","Cyber/Cyberpunk","Undead","Shark","Feline","Owl/Bird","Insect Compound","Alien","Void/Cosmic","Sharingan","Byakugan"];
const PRESETS={
  "Natural Human":  {irisColor:"#5588aa",pupilType:"round",scleraColor:"#f5f0e8",wetness:0.9,glow:false,pupilSize:0.35,limbal:0.7},
  "Heroic":         {irisColor:"#3366cc",pupilType:"round",scleraColor:"#f8f5f0",wetness:0.95,glow:false,pupilSize:0.3,limbal:0.9},
  "Reptile/Snake":  {irisColor:"#88aa22",pupilType:"vertical_slit",scleraColor:"#dde8cc",wetness:0.6,glow:false,pupilSize:0.2,limbal:0.3},
  "Dragon Slit":    {irisColor:"#ff4400",pupilType:"vertical_slit",scleraColor:"#ccaa88",wetness:0.5,glow:true,glowColor:"#ff6600",pupilSize:0.15,limbal:0.2},
  "Demon Glow":     {irisColor:"#ff0000",pupilType:"round",scleraColor:"#220000",wetness:0.4,glow:true,glowColor:"#ff2200",pupilSize:0.5,limbal:0.0},
  "Cyber/Cyberpunk":{irisColor:"#00ffc8",pupilType:"crosshair",scleraColor:"#111122",wetness:0.3,glow:true,glowColor:"#00ffaa",pupilSize:0.4,limbal:0.0},
  "Undead":         {irisColor:"#aabb88",pupilType:"round",scleraColor:"#ccddbb",wetness:0.1,glow:false,pupilSize:0.4,limbal:0.0},
  "Feline":         {irisColor:"#ddaa22",pupilType:"vertical_slit",scleraColor:"#f0eecc",wetness:0.85,glow:false,pupilSize:0.25,limbal:0.4},
  "Alien":          {irisColor:"#aa00ff",pupilType:"horizontal_slit",scleraColor:"#220033",wetness:0.7,glow:true,glowColor:"#cc00ff",pupilSize:0.3,limbal:0.0},
  "Void/Cosmic":    {irisColor:"#000000",pupilType:"void",scleraColor:"#050510",wetness:0.0,glow:true,glowColor:"#4400ff",pupilSize:0.9,limbal:0.0},
};

function drawEyePreview(canvas, cfg){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#06060f";ctx.fillRect(0,0,w,h);
  // Draw two eyes
  [w*.3, w*.7].forEach((cx,idx)=>{
    const cy=h*.5, r=h*.32;
    // Sclera
    ctx.beginPath();ctx.ellipse(cx,cy,r*1.2,r,0,0,Math.PI*2);
    ctx.fillStyle=cfg.scleraColor||"#f5f0e8";ctx.fill();
    // Iris
    ctx.beginPath();ctx.arc(cx,cy,r*.6,0,Math.PI*2);
    ctx.fillStyle=cfg.irisColor||"#5588aa";
    if(cfg.glow){ctx.shadowBlur=16;ctx.shadowColor=cfg.glowColor||cfg.irisColor;}
    ctx.fill();ctx.shadowBlur=0;
    // Pupil
    ctx.fillStyle="#000000";
    ctx.beginPath();
    if(cfg.pupilType==="vertical_slit"){ctx.ellipse(cx,cy,r*.08,r*.45,0,0,Math.PI*2);}
    else if(cfg.pupilType==="horizontal_slit"){ctx.ellipse(cx,cy,r*.4,r*.1,0,0,Math.PI*2);}
    else if(cfg.pupilType==="crosshair"){ctx.fillRect(cx-r*.04,cy-r*.4,r*.08,r*.8);ctx.fillRect(cx-r*.4,cy-r*.04,r*.8,r*.08);}
    else if(cfg.pupilType==="void"){ctx.arc(cx,cy,r*.5,0,Math.PI*2);}
    else{ctx.arc(cx,cy,r*(cfg.pupilSize||.35)*.7,0,Math.PI*2);}
    ctx.fill();
    // Limbal ring
    if(cfg.limbal>0){ctx.beginPath();ctx.arc(cx,cy,r*.6,0,Math.PI*2);ctx.strokeStyle=`rgba(0,0,0,${cfg.limbal*.8})`;ctx.lineWidth=r*.08;ctx.stroke();}
    // Wetness highlight
    if(cfg.wetness>0){ctx.beginPath();ctx.arc(cx-r*.2,cy-r*.2,r*.15,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${cfg.wetness*.8})`;ctx.fill();}
    // Asymmetry label
    if(idx===1&&cfg.asymmetry>0){ctx.beginPath();ctx.arc(cx,cy+r*.08,r*.55,0,Math.PI*2);ctx.strokeStyle="rgba(255,100,0,.3)";ctx.lineWidth=1;ctx.stroke();}
  });
}

export default function EyeGeneratorPanel({scene}){
  const [eyeType,setEyeType]=useState("Natural Human");
  const [irisColor,setIrisColor]=useState("#5588aa");
  const [scleraColor,setScleraColor]=useState("#f5f0e8");
  const [glowColor,setGlowColor]=useState("#ff6600");
  const [pupilType,setPupilType]=useState("round");
  const [pupilSize,setPupilSize]=useState(0.35);
  const [wetness,setWetness]=useState(0.9);
  const [limbal,setLimbal]=useState(0.7);
  const [glow,setGlow]=useState(false);
  const [asymmetry,setAsymmetry]=useState(0);
  const [redness,setRedness]=useState(0);
  const [veins,setVeins]=useState(0);
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);

  function loadPreset(type){
    setEyeType(type);const p=PRESETS[type];if(!p)return;
    setIrisColor(p.irisColor);setScleraColor(p.scleraColor);setPupilType(p.pupilType);
    setPupilSize(p.pupilSize);setWetness(p.wetness);setLimbal(p.limbal);setGlow(p.glow||false);
    if(p.glowColor)setGlowColor(p.glowColor);
    setTimeout(()=>{if(prevRef.current)drawEyePreview(prevRef.current,{irisColor:p.irisColor,scleraColor:p.scleraColor,pupilType:p.pupilType,pupilSize:p.pupilSize,wetness:p.wetness,limbal:p.limbal,glow:p.glow,glowColor:p.glowColor,asymmetry});},50);
  }

  function preview(){if(prevRef.current)drawEyePreview(prevRef.current,{irisColor,scleraColor,pupilType,pupilSize,wetness,limbal,glow,glowColor,asymmetry});}

  function applyToScene(){
    if(!scene){setStatus("No scene");return;}
    const c=document.createElement("canvas");c.width=c.height=256;
    drawEyePreview(c,{irisColor,scleraColor,pupilType,pupilSize,wetness,limbal,glow,glowColor,asymmetry});
    const tex=new THREE.CanvasTexture(c);
    let n=0;
    scene.traverse(o=>{if(o.isMesh&&(o.name.toLowerCase().includes("eye")||o.userData.isEye)){o.material=new THREE.MeshStandardMaterial({map:tex,roughness:glow?0.05:wetness>0.7?0.08:0.3,metalness:0.1,emissive:glow?new THREE.Color(glowColor):new THREE.Color(0),emissiveIntensity:glow?0.5:0});n++;}});
    setStatus(`✓ Eye shader applied to ${n} mesh(es)`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>👁 EYE GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Eye Type Preset</label>
        <select style={S.sel} value={eyeType} onChange={e=>loadPreset(e.target.value)}>{EYE_TYPES.map(t=><option key={t}>{t}</option>)}</select>
        <canvas ref={prevRef} width={300} height={120} style={S.prev}/>
        <button style={{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer"}} onClick={preview}>👁 Preview</button>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Iris</div>
        <label style={S.lbl}>Iris Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={irisColor} onChange={e=>{setIrisColor(e.target.value);preview();}}/>
        <label style={S.lbl}>Pupil Type</label>
        <select style={S.sel} value={pupilType} onChange={e=>{setPupilType(e.target.value);preview();}}>
          {["round","vertical_slit","horizontal_slit","crosshair","void"].map(t=><option key={t}>{t}</option>)}
        </select>
        <label style={S.lbl}>Pupil Size: {pupilSize.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0.05} max={0.9} step={0.01} value={pupilSize} onChange={e=>{setPupilSize(+e.target.value);preview();}}/>
        <label style={S.lbl}>Limbal Ring: {limbal.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={limbal} onChange={e=>{setLimbal(+e.target.value);preview();}}/>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Sclera & Surface</div>
        <label style={S.lbl}>Sclera Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={scleraColor} onChange={e=>{setScleraColor(e.target.value);preview();}}/>
        <label style={S.lbl}>Eye Wetness: {wetness.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={wetness} onChange={e=>{setWetness(+e.target.value);preview();}}/>
        <label style={S.lbl}>Redness: {redness.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={redness} onChange={e=>setRedness(+e.target.value)}/>
        <label style={S.lbl}>Veins: {veins.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={veins} onChange={e=>setVeins(+e.target.value)}/>
        <label style={S.lbl}><input type="checkbox" checked={glow} onChange={e=>{setGlow(e.target.checked);preview();}} /> Fantasy Glow</label>
        {glow&&<><label style={S.lbl}>Glow Color</label><input style={{...S.inp,padding:2,height:32}} type="color" value={glowColor} onChange={e=>{setGlowColor(e.target.value);preview();}}/></>}
        <label style={S.lbl}>Asymmetry: {asymmetry.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={asymmetry} onChange={e=>{setAsymmetry(+e.target.value);preview();}}/>
      </div>
      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ── EXPRESSION GENERATOR ───────────────────────────────────────────────────────
FILES[f"{P}/ExpressionGeneratorPanel.jsx"] = r'''
import React, { useState, useRef, useEffect } from "react";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},prev:{width:"100%",height:160,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const EMOTION_PRESETS={
  "Neutral":    {smile:0,mouthOpen:0,eyeOpen:1,squint:0,browRaise:0,browFrown:0,jawDrop:0,snarl:0,asymmetry:0},
  "Happy":      {smile:0.85,mouthOpen:0.3,eyeOpen:0.9,squint:0.3,browRaise:0.4,browFrown:0,jawDrop:0,snarl:0,asymmetry:0.05},
  "Sad":        {smile:-0.6,mouthOpen:0.1,eyeOpen:0.6,squint:0,browRaise:0,browFrown:0.7,jawDrop:0.1,snarl:0,asymmetry:0.1},
  "Angry":      {smile:-0.4,mouthOpen:0.15,eyeOpen:0.7,squint:0.5,browRaise:0,browFrown:0.95,jawDrop:0,snarl:0.4,asymmetry:0.08},
  "Surprised":  {smile:0.1,mouthOpen:0.9,eyeOpen:1.0,squint:0,browRaise:0.95,browFrown:0,jawDrop:0.8,snarl:0,asymmetry:0.05},
  "Fear":       {smile:-0.2,mouthOpen:0.5,eyeOpen:1.0,squint:0,browRaise:0.7,browFrown:0.3,jawDrop:0.3,snarl:0,asymmetry:0.15},
  "Disgust":    {smile:-0.5,mouthOpen:0.1,eyeOpen:0.7,squint:0.4,browRaise:0,browFrown:0.6,jawDrop:0,snarl:0.6,asymmetry:0.2},
  "Confident":  {smile:0.5,mouthOpen:0,eyeOpen:0.85,squint:0.2,browRaise:0,browFrown:0,jawDrop:0,snarl:0,asymmetry:0.03},
  "Villain":    {smile:0.4,mouthOpen:0.2,eyeOpen:0.6,squint:0.6,browRaise:-0.3,browFrown:0.5,jawDrop:0,snarl:0.3,asymmetry:0.25},
  "Smug":       {smile:0.6,mouthOpen:0,eyeOpen:0.7,squint:0.4,browRaise:0.3,browFrown:0,jawDrop:0,snarl:0,asymmetry:0.35},
  "Anguish":    {smile:-0.9,mouthOpen:0.7,eyeOpen:0.8,squint:0.2,browRaise:0.6,browFrown:0.8,jawDrop:0.6,snarl:0.2,asymmetry:0.2},
  "Rage":       {smile:-0.8,mouthOpen:0.6,eyeOpen:0.5,squint:0.7,browRaise:0,browFrown:1.0,jawDrop:0,snarl:0.9,asymmetry:0.1},
};

function drawFacePreview(canvas, expr){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,w,h);
  const cx=w/2,cy=h/2,fr=h*.36;
  // Head
  ctx.beginPath();ctx.ellipse(cx,cy,fr*.8,fr,0,0,Math.PI*2);
  ctx.fillStyle="#c8955a";ctx.fill();ctx.strokeStyle="#00ffc8";ctx.lineWidth=1.5;ctx.stroke();
  // Eyes
  const eyY=cy-fr*.2, eyeOpen=0.15+expr.eyeOpen*.25;
  [-fr*.3,fr*.3].forEach((ex,idx)=>{
    const asym=idx===1?expr.asymmetry*0.05:0;
    const sq=expr.squint*.08;
    ctx.beginPath();ctx.ellipse(cx+ex,eyY+asym,fr*.15,Math.max(.01,eyeOpen-sq),0,0,Math.PI*2);
    ctx.fillStyle="#ffffff";ctx.fill();ctx.strokeStyle="#333";ctx.lineWidth=1;ctx.stroke();
    // pupil
    ctx.beginPath();ctx.arc(cx+ex,eyY+asym,fr*.07,0,Math.PI*2);ctx.fillStyle="#224488";ctx.fill();
    ctx.beginPath();ctx.arc(cx+ex-fr*.02,eyY+asym-fr*.03,fr*.025,0,Math.PI*2);ctx.fillStyle="#ffffff";ctx.fill();
  });
  // Brows
  [-fr*.3,fr*.3].forEach((ex,idx)=>{
    const asym=idx===1?expr.asymmetry*0.04:0;
    const browY=eyY-fr*.22-expr.browRaise*.08+expr.browFrown*(idx===0?-.04:.04)+asym;
    const angle=(expr.browFrown+expr.browRaise*0.3)*(idx===0?-.12:.12);
    ctx.save();ctx.translate(cx+ex,browY);ctx.rotate(angle);
    ctx.beginPath();ctx.moveTo(-fr*.14,0);ctx.quadraticCurveTo(0,-fr*.04,fr*.14,0);
    ctx.strokeStyle="#554433";ctx.lineWidth=fr*.06*(0.5+expr.browFrown*.5+0.3);ctx.lineCap="round";ctx.stroke();
    ctx.restore();
  });
  // Mouth
  const mouthY=cy+fr*.35, mw=fr*(0.35+Math.abs(expr.smile)*.15+expr.mouthOpen*.1);
  const mouthCurve=expr.smile*fr*.18;
  const asym=expr.asymmetry*fr*.06;
  ctx.beginPath();ctx.moveTo(cx-mw,mouthY+asym);
  ctx.quadraticCurveTo(cx,mouthY+mouthCurve,cx+mw,mouthY-asym);
  ctx.strokeStyle="#884433";ctx.lineWidth=2.5;ctx.stroke();
  if(expr.mouthOpen>.1){
    ctx.beginPath();ctx.moveTo(cx-mw*.7,mouthY+asym+mouthCurve*.4);
    ctx.quadraticCurveTo(cx,mouthY+mouthCurve+expr.mouthOpen*fr*.22,cx+mw*.7,mouthY-asym+mouthCurve*.4);
    ctx.lineTo(cx+mw*.7,mouthY-asym+mouthCurve*.4);
    ctx.closePath();ctx.fillStyle="#220a0a";ctx.fill();
    if(expr.jawDrop>.3){ctx.beginPath();ctx.moveTo(cx-mw*.4,mouthY+mouthCurve+expr.mouthOpen*fr*.15);ctx.lineTo(cx+mw*.4,mouthY+mouthCurve+expr.mouthOpen*fr*.15);ctx.strokeStyle="#ddddcc";ctx.lineWidth=4;ctx.stroke();}
  }
  if(expr.snarl>.2){ctx.beginPath();ctx.moveTo(cx-mw*.6,mouthY+asym+mouthCurve*.3);ctx.lineTo(cx-mw*.3,mouthY+asym+mouthCurve*.3-expr.snarl*fr*.1);ctx.strokeStyle="#884433";ctx.lineWidth=2;ctx.stroke();}
  // Nose
  ctx.beginPath();ctx.moveTo(cx-fr*.06,cy+fr*.05);ctx.quadraticCurveTo(cx,cy+fr*.18,cx+fr*.06,cy+fr*.05);
  ctx.strokeStyle="#a07050";ctx.lineWidth=1.5;ctx.stroke();
  // Emotion label
  ctx.fillStyle="rgba(0,255,200,0.6)";ctx.font="10px JetBrains Mono,monospace";
  ctx.fillText("Intensity: "+(expr.smile>0?"happy":"sad/angry"),8,h-8);
}

export default function ExpressionGeneratorPanel({morphTargets}){
  const [expr,setExpr]=useState({smile:0,mouthOpen:0,eyeOpen:1,squint:0,browRaise:0,browFrown:0,jawDrop:0,snarl:0,asymmetry:0});
  const [preset,setPreset]=useState("Neutral");
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);

  useEffect(()=>{if(prevRef.current)drawFacePreview(prevRef.current,expr);},[expr]);

  function loadPreset(p){setPreset(p);const e=EMOTION_PRESETS[p];if(e)setExpr(e);}

  function applyMorphs(){
    if(!morphTargets){setStatus("No morph targets connected");return;}
    Object.entries(expr).forEach(([k,v])=>{if(morphTargets[k]!==undefined)morphTargets[k]=v;});
    setStatus("✓ Expression applied to morph targets");
  }

  const CONTROLS=[
    {id:"smile",lbl:"Smile / Frown",min:-1,max:1},
    {id:"mouthOpen",lbl:"Mouth Open",min:0,max:1},
    {id:"eyeOpen",lbl:"Eye Openness",min:0,max:1},
    {id:"squint",lbl:"Squint",min:0,max:1},
    {id:"browRaise",lbl:"Brow Raise",min:0,max:1},
    {id:"browFrown",lbl:"Brow Frown",min:0,max:1},
    {id:"jawDrop",lbl:"Jaw Drop",min:0,max:1},
    {id:"snarl",lbl:"Snarl",min:0,max:1},
    {id:"asymmetry",lbl:"Asymmetry",min:0,max:1},
  ];

  return(
    <div style={S.root}>
      <div style={S.h2}>😐 EXPRESSION GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Emotion Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(EMOTION_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <canvas ref={prevRef} width={300} height={160} style={S.prev}/>
      </div>
      <div style={S.sec}>
        {CONTROLS.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {expr[c.id]?.toFixed(2)}</label>
            <input style={S.inp} type="range" min={c.min} max={c.max} step={0.01} value={expr[c.id]||0} onChange={e=>setExpr(ex=>({...ex,[c.id]:+e.target.value}))}/>
          </div>
        ))}
      </div>
      <button style={S.btn} onClick={applyMorphs}>✓ Apply Morphs</button>
      <button style={{...S.btnO}} onClick={()=>{const b=new Blob([JSON.stringify(expr,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="expression.json";a.click();}}>💾 Export JSON</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ── BODY GENERATOR ─────────────────────────────────────────────────────────────
FILES[f"{P}/BodyGeneratorPanel.jsx"] = r'''
import React, { useState } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const BODY_PRESETS={
  "Slim":       {height:1.78,bodyMass:0.25,bodyFat:0.15,muscle:0.3,shoulderW:0.22,chestSz:0.3,waistSz:0.22,hipW:0.26,thighTk:0.28,armTk:0.22},
  "Athletic":   {height:1.8, bodyMass:0.6, bodyFat:0.12,muscle:0.7,shoulderW:0.28,chestSz:0.45,waistSz:0.26,hipW:0.28,thighTk:0.35,armTk:0.3},
  "Muscular":   {height:1.82,bodyMass:0.85,bodyFat:0.1, muscle:0.95,shoulderW:0.36,chestSz:0.6,waistSz:0.3,hipW:0.32,thighTk:0.45,armTk:0.42},
  "Curvy":      {height:1.68,bodyMass:0.5, bodyFat:0.4, muscle:0.4,shoulderW:0.25,chestSz:0.5,waistSz:0.28,hipW:0.42,thighTk:0.44,armTk:0.28},
  "Heavyset":   {height:1.72,bodyMass:0.9, bodyFat:0.65,muscle:0.4,shoulderW:0.34,chestSz:0.65,waistSz:0.48,hipW:0.5,thighTk:0.52,armTk:0.4},
  "Hero Build": {height:1.88,bodyMass:0.9, bodyFat:0.08,muscle:0.98,shoulderW:0.4, chestSz:0.68,waistSz:0.28,hipW:0.3,thighTk:0.46,armTk:0.45},
  "Elderly":    {height:1.65,bodyMass:0.35,bodyFat:0.35,muscle:0.25,shoulderW:0.22,chestSz:0.35,waistSz:0.35,hipW:0.3,thighTk:0.28,armTk:0.22},
  "Child":      {height:1.2, bodyMass:0.2, bodyFat:0.3, muscle:0.15,shoulderW:0.18,chestSz:0.22,waistSz:0.2,hipW:0.22,thighTk:0.22,armTk:0.18},
};

const CTRL=[
  {id:"height",    lbl:"Height (m)",    min:.8, max:3.0, step:.01},
  {id:"bodyMass",  lbl:"Body Mass",     min:0,  max:1,   step:.01},
  {id:"bodyFat",   lbl:"Body Fat",      min:0,  max:1,   step:.01},
  {id:"muscle",    lbl:"Muscle Mass",   min:0,  max:1,   step:.01},
  {id:"shoulderW", lbl:"Shoulder Width",min:.1, max:.6,  step:.01},
  {id:"chestSz",   lbl:"Chest Size",    min:.1, max:.9,  step:.01},
  {id:"waistSz",   lbl:"Waist Size",    min:.1, max:.7,  step:.01},
  {id:"hipW",      lbl:"Hip Width",     min:.1, max:.7,  step:.01},
  {id:"thighTk",   lbl:"Thigh Thickness",min:.1,max:.7,  step:.01},
  {id:"armTk",     lbl:"Arm Thickness", min:.1, max:.6,  step:.01},
];

export default function BodyGeneratorPanel({scene}){
  const [preset,setPreset]=useState("Athletic");
  const [body,setBody]=useState({...BODY_PRESETS["Athletic"]});
  const [age,setAge]=useState(25);
  const [genderBal,setGenderBal]=useState(0.5);
  const [status,setStatus]=useState("");
  const meshes=React.useRef([]);

  function loadPreset(p){setPreset(p);setBody({...BODY_PRESETS[p]});}

  function clear(){meshes.current.forEach(m=>{scene.remove(m);m.geometry?.dispose();m.material?.dispose();});meshes.current=[];setStatus("");}

  function generate(){
    if(!scene){setStatus("No scene");return;}
    clear();
    const h=body.height, ms=[], mat=new THREE.MeshStandardMaterial({color:0xc8955a,roughness:0.6});
    const headH=h/7.5;
    const add=(geo,px,py,pz)=>{const m=new THREE.Mesh(geo,mat.clone());m.position.set(px,py,pz);m.castShadow=true;scene.add(m);ms.push(m);return m;};
    // Head
    add(new THREE.SphereGeometry(headH*.5,12,10),0,h-headH*.5,0);
    // Torso
    const tw=body.shoulderW*2, tth=headH*2.2;
    add(new THREE.BoxGeometry(tw,tth,body.chestSz),0,h-headH-tth*.5,0);
    // Belly/waist
    const wh=headH*.8;
    add(new THREE.CylinderGeometry(body.waistSz*.9,body.waistSz,wh,10),0,h-headH-tth-wh*.5,0);
    // Hips
    const hipH=headH*.6;
    add(new THREE.BoxGeometry(body.hipW*2,hipH,body.chestSz*.85+(genderBal*.15)),0,h-headH-tth-wh-hipH*.5,0);
    const hipY=h-headH-tth-wh-hipH;
    // Arms
    const armH=headH*2.5;
    [-1,1].forEach(s=>{
      add(new THREE.CylinderGeometry(body.armTk*.5,body.armTk*.45,armH*.55,8),s*(tw*.5+body.armTk*.5),h-headH-armH*.15,0);
      add(new THREE.CylinderGeometry(body.armTk*.42,body.armTk*.35,armH*.45,8),s*(tw*.5+body.armTk*.5),h-headH-armH*.15-armH*.45*.5-armH*.55*.5,0);
    });
    // Legs
    const legH=hipY*.5;
    [-1,1].forEach(s=>{
      add(new THREE.CylinderGeometry(body.thighTk*.55,body.thighTk*.45,legH,8),s*body.hipW*.6,hipY-legH*.5,0);
      add(new THREE.CylinderGeometry(body.thighTk*.4,body.thighTk*.3,legH*.9,8),s*body.hipW*.6,hipY-legH-legH*.9*.5,0);
      add(new THREE.BoxGeometry(body.thighTk*.7,.12,body.thighTk*1.2),s*body.hipW*.6,hipY-legH-legH*.9-.06,body.thighTk*.25);
    });
    // Lights
    if(!scene.getObjectByName("body_amb")){const a=new THREE.AmbientLight(0xffffff,.7);a.name="body_amb";scene.add(a);ms.push(a);const d=new THREE.DirectionalLight(0xffeedd,1);d.position.set(20,40,20);d.castShadow=true;scene.add(d);ms.push(d);}
    meshes.current=ms;
    setStatus(`✓ Body built — ${ms.filter(m=>m.isMesh).length} parts`);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>💪 BODY GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Body Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(BODY_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
        <label style={S.lbl}>Age: {age}</label>
        <input style={S.inp} type="range" min={1} max={90} value={age} onChange={e=>setAge(+e.target.value)}/>
        <label style={S.lbl}>Gender Balance — Masc ↔ Fem: {(genderBal*100).toFixed(0)}%</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={genderBal} onChange={e=>setGenderBal(+e.target.value)}/>
      </div>
      <div style={S.sec}>
        {CTRL.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {body[c.id]?.toFixed(2)}</label>
            <input style={S.inp} type="range" min={c.min} max={c.max} step={c.step} value={body[c.id]||0} onChange={e=>setBody(b=>({...b,[c.id]:+e.target.value}))}/>
          </div>
        ))}
      </div>
      <button style={S.btn} onClick={generate}>⚡ Generate Body</button>
      <button style={S.btnO} onClick={clear}>🗑 Clear</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ── MORPH GENERATOR ────────────────────────────────────────────────────────────
FILES[f"{P}/MorphGeneratorPanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4}};

const MORPH_PRESETS={
  "Realistic Human":   {jawW:.45,jawLen:.4,chinSz:.35,cheekH:.5,cheekFull:.5,browDepth:.3,foreheadSlope:.3,skullW:.5,realismBal:.9,heroicExag:0,ageMorph:.2,wrinkle:.1,creatureAmt:0,demonAmt:0,dragonAmt:0,monsterAmt:0,kaijuAmt:0,asymmetry:.05},
  "Stylized Hero":     {jawW:.6,jawLen:.5,chinSz:.45,cheekH:.65,cheekFull:.4,browDepth:.5,foreheadSlope:.2,skullW:.55,realismBal:.6,heroicExag:.6,ageMorph:.1,wrinkle:0,creatureAmt:0,demonAmt:0,dragonAmt:0,monsterAmt:0,kaijuAmt:0,asymmetry:.03},
  "Demon":             {jawW:.7,jawLen:.6,chinSz:.55,cheekH:.8,cheekFull:.2,browDepth:.9,foreheadSlope:.6,skullW:.6,realismBal:.4,heroicExag:.3,ageMorph:0,wrinkle:.3,creatureAmt:.2,demonAmt:.85,dragonAmt:0,monsterAmt:.2,kaijuAmt:0,asymmetry:.15},
  "Dragon Humanoid":   {jawW:.75,jawLen:.85,chinSz:.4,cheekH:.6,cheekFull:.15,browDepth:.7,foreheadSlope:.8,skullW:.7,realismBal:.2,heroicExag:.4,ageMorph:0,wrinkle:0,creatureAmt:.5,demonAmt:.1,dragonAmt:.9,monsterAmt:.1,kaijuAmt:0,asymmetry:.05},
  "Monster Hybrid":    {jawW:.8,jawLen:.7,chinSz:.3,cheekH:.5,cheekFull:.6,browDepth:.75,foreheadSlope:.5,skullW:.75,realismBal:.15,heroicExag:.2,ageMorph:0,wrinkle:.2,creatureAmt:.6,demonAmt:.2,dragonAmt:.1,monsterAmt:.9,kaijuAmt:.1,asymmetry:.2},
  "Kaiju Humanoid":    {jawW:.95,jawLen:.9,chinSz:.5,cheekH:.7,cheekFull:.5,browDepth:.95,foreheadSlope:.7,skullW:.95,realismBal:.05,heroicExag:.5,ageMorph:0,wrinkle:.4,creatureAmt:.8,demonAmt:.1,dragonAmt:.2,monsterAmt:.5,kaijuAmt:.95,asymmetry:.1},
  "Elderly":           {jawW:.35,jawLen:.38,chinSz:.3,cheekH:.3,cheekFull:.25,browDepth:.4,foreheadSlope:.35,skullW:.45,realismBal:.95,heroicExag:0,ageMorph:.9,wrinkle:.85,creatureAmt:0,demonAmt:0,dragonAmt:0,monsterAmt:0,kaijuAmt:0,asymmetry:.12},
};

const FACIAL_CTRL=[
  {id:"jawW",lbl:"Jaw Width"},{id:"jawLen",lbl:"Jaw Length"},{id:"chinSz",lbl:"Chin Size"},
  {id:"cheekH",lbl:"Cheekbone Height"},{id:"cheekFull",lbl:"Cheek Fullness"},
  {id:"browDepth",lbl:"Brow Depth"},{id:"foreheadSlope",lbl:"Forehead Slope"},
  {id:"skullW",lbl:"Skull Width"},
];
const STYLE_CTRL=[
  {id:"realismBal",lbl:"Realism Balance"},{id:"heroicExag",lbl:"Heroic Exaggeration"},
  {id:"ageMorph",lbl:"Age Morph"},{id:"wrinkle",lbl:"Wrinkle Intensity"},{id:"asymmetry",lbl:"Facial Asymmetry"},
];
const CREATURE_CTRL=[
  {id:"creatureAmt",lbl:"Creature Morph"},{id:"demonAmt",lbl:"Demon Morph"},
  {id:"dragonAmt",lbl:"Dragon Morph"},{id:"monsterAmt",lbl:"Monster Morph"},{id:"kaijuAmt",lbl:"Kaiju Morph"},
];

export default function MorphGeneratorPanel({scene,targetMesh}){
  const [preset,setPreset]=useState("Realistic Human");
  const [morph,setMorph]=useState({...MORPH_PRESETS["Realistic Human"]});
  const [blendPresetA,setBlendPA]=useState("Realistic Human");
  const [blendPresetB,setBlendPB]=useState("Demon");
  const [blendAmt,setBlendAmt]=useState(0.5);
  const [status,setStatus]=useState("");

  function loadPreset(p){setPreset(p);setMorph({...MORPH_PRESETS[p]});}

  function blendPresets(){
    const a=MORPH_PRESETS[blendPresetA],b=MORPH_PRESETS[blendPresetB];
    if(!a||!b)return;
    const blended={};
    Object.keys(a).forEach(k=>{blended[k]=a[k]+(b[k]-a[k])*blendAmt;});
    setMorph(blended);setPreset("Custom Blend");
    setStatus(`Blend: ${blendPresetA} + ${blendPresetB} @ ${(blendAmt*100).toFixed(0)}%`);
  }

  function applyToMesh(){
    if(!scene){setStatus("No scene");return;}
    let n=0;
    scene.traverse(o=>{
      if(!o.isMesh||!o.morphTargetInfluences)return;
      const dict=o.morphTargetDictionary||{};
      Object.entries(morph).forEach(([k,v])=>{if(dict[k]!==undefined)o.morphTargetInfluences[dict[k]]=v;});
      n++;
    });
    setStatus(n>0?`✓ Morphs applied to ${n} mesh(es)`:"No morph target meshes found");
  }

  function exportMorphs(){
    const b=new Blob([JSON.stringify(morph,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="morph_data.json";a.click();
  }

  const renderCtrl=(ctrls)=>ctrls.map(c=>(
    <div key={c.id}>
      <label style={S.lbl}>{c.lbl}: {morph[c.id]?.toFixed(2)}</label>
      <input style={S.inp} type="range" min={0} max={1} step={0.01} value={morph[c.id]||0} onChange={e=>setMorph(m=>({...m,[c.id]:+e.target.value}))}/>
    </div>
  ));

  return(
    <div style={S.root}>
      <div style={S.h2}>🧬 MORPH GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Morph Preset</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(MORPH_PRESETS).map(p=><button key={p} style={{...S.btnSm,background:preset===p?T.teal:T.panel,color:preset===p?T.bg:T.teal}} onClick={()=>loadPreset(p)}>{p}</button>)}
        </div>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Blend Presets</div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <select style={{...S.inp,marginBottom:0}} value={blendPresetA} onChange={e=>setBlendPA(e.target.value)}>{Object.keys(MORPH_PRESETS).map(p=><option key={p}>{p}</option>)}</select>
          <select style={{...S.inp,marginBottom:0}} value={blendPresetB} onChange={e=>setBlendPB(e.target.value)}>{Object.keys(MORPH_PRESETS).map(p=><option key={p}>{p}</option>)}</select>
        </div>
        <label style={S.lbl}>Blend: {(blendAmt*100).toFixed(0)}% B</label>
        <input style={S.inp} type="range" min={0} max={1} step={0.01} value={blendAmt} onChange={e=>setBlendAmt(+e.target.value)}/>
        <button style={S.btnSm} onClick={blendPresets}>⚡ Blend</button>
      </div>
      <div style={S.sec}><div style={S.h3}>Facial Structure</div>{renderCtrl(FACIAL_CTRL)}</div>
      <div style={S.sec}><div style={S.h3}>Stylization</div>{renderCtrl(STYLE_CTRL)}</div>
      <div style={S.sec}><div style={S.h3}>Creature Morphs</div>{renderCtrl(CREATURE_CTRL)}</div>
      <button style={S.btn} onClick={applyToMesh}>✓ Apply Morphs</button>
      <button style={S.btnO} onClick={exportMorphs}>💾 Export JSON</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ── TEETH GENERATOR ────────────────────────────────────────────────────────────
FILES[f"{P}/TeethGeneratorPanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},prev:{width:"100%",height:120,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const TOOTH_TYPES=["Natural Human","Perfect Human","Creature Fangs","Vampire","Demon Multi-Row","Predator","Dragon","Shark","Werewolf","Crocodilian"];
const TOOTH_PRESETS={
  "Natural Human":  {toothCount:8,toothW:.85,toothH:.9,toothTaper:.3,fangLen:0,fangCurve:0,spacing:.05,yellowTint:.2,imperfect:.4,multiRow:false},
  "Perfect Human":  {toothCount:8,toothW:.88,toothH:.92,toothTaper:.2,fangLen:0,fangCurve:0,spacing:.03,yellowTint:.0,imperfect:.05,multiRow:false},
  "Creature Fangs": {toothCount:6,toothW:.7,toothH:1.2,toothTaper:.7,fangLen:.6,fangCurve:.3,spacing:.08,yellowTint:.4,imperfect:.5,multiRow:false},
  "Vampire":        {toothCount:8,toothW:.82,toothH:.95,toothTaper:.4,fangLen:.85,fangCurve:.15,spacing:.04,yellowTint:.05,imperfect:.1,multiRow:false},
  "Demon Multi-Row":{toothCount:10,toothW:.6,toothH:1.1,toothTaper:.8,fangLen:.5,fangCurve:.4,spacing:.06,yellowTint:.5,imperfect:.7,multiRow:true},
  "Predator":       {toothCount:7,toothW:.65,toothH:1.3,toothTaper:.85,fangLen:.7,fangCurve:.5,spacing:.1,yellowTint:.35,imperfect:.4,multiRow:false},
  "Dragon":         {toothCount:12,toothW:.7,toothH:1.5,toothTaper:.9,fangLen:1.0,fangCurve:.6,spacing:.12,yellowTint:.3,imperfect:.2,multiRow:true},
  "Shark":          {toothCount:14,toothW:.6,toothH:1.0,toothTaper:.95,fangLen:.3,fangCurve:.1,spacing:.04,yellowTint:.1,imperfect:.1,multiRow:true},
  "Werewolf":       {toothCount:8,toothW:.75,toothH:1.2,toothTaper:.7,fangLen:.8,fangCurve:.35,spacing:.08,yellowTint:.45,imperfect:.6,multiRow:false},
  "Crocodilian":    {toothCount:16,toothW:.55,toothH:1.1,toothTaper:.6,fangLen:.4,fangCurve:.05,spacing:.15,yellowTint:.4,imperfect:.35,multiRow:true},
};

function drawTeethPreview(canvas,t){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.fillStyle="#0a0008";ctx.fillRect(0,0,w,h);
  // Gums
  ctx.beginPath();ctx.ellipse(w/2,h*.35,w*.42,h*.22,0,0,Math.PI*2);
  ctx.fillStyle="#cc3344";ctx.fill();
  const toothBaseY=h*.42,toothBaseW=w*.75,toothW=(toothBaseW/t.toothCount)*(1-t.spacing);
  const yellowMix=t.yellowTint;
  const toothColor=`rgb(${Math.round(255)},${Math.round(255-yellowMix*60)},${Math.round(255-yellowMix*120)})`;
  for(let i=0;i<t.toothCount;i++){
    const tx=w*.12+i*(toothBaseW/t.toothCount)+t.spacing*4;
    const isFang=(i===1||i===t.toothCount-2);
    const tH=(isFang&&t.fangLen>0)?h*(0.15+t.fangLen*.25):h*(0.12+t.toothH*.1);
    const taper=t.toothTaper*.3;
    const impOff=t.imperfect*(Math.random()-.5)*4;
    ctx.beginPath();ctx.moveTo(tx,toothBaseY+impOff);
    ctx.lineTo(tx+toothW,toothBaseY+impOff);
    ctx.lineTo(tx+toothW*taper,toothBaseY+tH+impOff);
    ctx.lineTo(tx+toothW*(1-taper),toothBaseY+tH+impOff);
    ctx.closePath();
    ctx.fillStyle=isFang&&t.fangLen>.3?"#fff8ee":toothColor;ctx.fill();
    ctx.strokeStyle="#ccccaa";ctx.lineWidth=.5;ctx.stroke();
    if(t.multiRow&&i%2===0&&i>0&&i<t.toothCount-1){
      ctx.beginPath();ctx.moveTo(tx+toothW*.1,toothBaseY-h*.04+impOff*.5);
      ctx.lineTo(tx+toothW*.9,toothBaseY-h*.04+impOff*.5);
      ctx.lineTo(tx+toothW*.7,toothBaseY+tH*.7+impOff*.5);
      ctx.lineTo(tx+toothW*.3,toothBaseY+tH*.7+impOff*.5);
      ctx.closePath();ctx.fillStyle=toothColor;ctx.fill();ctx.stroke();
    }
  }
  if(t.fangLen>0){[w*.25,w*.75].forEach(fx=>{
    ctx.beginPath();ctx.moveTo(fx-8,toothBaseY);ctx.lineTo(fx+8,toothBaseY);
    ctx.lineTo(fx+4*(1-t.fangCurve*.5),toothBaseY+h*(0.15+t.fangLen*.3));
    ctx.lineTo(fx-4*(1-t.fangCurve*.5),toothBaseY+h*(0.15+t.fangLen*.3));
    ctx.closePath();ctx.fillStyle="#fffbf0";ctx.fill();ctx.strokeStyle="#ccccaa";ctx.lineWidth=.8;ctx.stroke();
  });}
}

export default function TeethGeneratorPanel({scene}){
  const [type,setType]=useState("Natural Human");
  const [teeth,setTeeth]=useState({...TOOTH_PRESETS["Natural Human"]});
  const [gumColor,setGumColor]=useState("#cc3344");
  const [brightness,setBrightness]=useState(0.9);
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);

  function loadPreset(t){setType(t);setTeeth({...TOOTH_PRESETS[t]});setTimeout(()=>{if(prevRef.current)drawTeethPreview(prevRef.current,TOOTH_PRESETS[t]);},50);}

  function preview(){if(prevRef.current)drawTeethPreview(prevRef.current,teeth);}

  function buildTeethMesh(){
    if(!scene){setStatus("No scene");return;}
    const group=new THREE.Group();group.name="SPXTeeth";
    const toothMat=new THREE.MeshStandardMaterial({color:new THREE.Color(1,1-teeth.yellowTint*.3,1-teeth.yellowTint*.5),roughness:.15,metalness:.05});
    const gumMat=new THREE.MeshStandardMaterial({color:new THREE.Color(gumColor)});
    // Gum
    const gumGeo=new THREE.TorusGeometry(.04,.012,6,12,Math.PI);const gum=new THREE.Mesh(gumGeo,gumMat);gum.rotation.z=Math.PI;group.add(gum);
    for(let i=0;i<teeth.toothCount;i++){
      const angle=(i/(teeth.toothCount-1)-0.5)*Math.PI*.7;
      const x=Math.sin(angle)*.035,z=Math.cos(angle)*.035-0.035;
      const h=0.008+teeth.toothH*.012+(i===1||i===teeth.toothCount-2?teeth.fangLen*.015:0);
      const w=0.005+teeth.toothW*.004;
      const geo=new THREE.BoxGeometry(w,h,w*.6);
      const tm=new THREE.Mesh(geo,toothMat.clone());
      tm.position.set(x,-h/2,z);tm.rotation.y=angle;
      group.add(tm);
    }
    scene.add(group);
    setStatus(`✓ ${type} teeth built — ${teeth.toothCount} teeth`);
  }

  const CTRL=[
    {id:"toothCount",lbl:"Tooth Count",min:4,max:20,step:1},
    {id:"toothW",lbl:"Tooth Width",min:.3,max:1.2,step:.01},
    {id:"toothH",lbl:"Tooth Height",min:.3,max:2,step:.01},
    {id:"toothTaper",lbl:"Taper/Sharpness",min:0,max:1,step:.01},
    {id:"fangLen",lbl:"Fang Length",min:0,max:1.5,step:.01},
    {id:"fangCurve",lbl:"Fang Curve",min:0,max:1,step:.01},
    {id:"spacing",lbl:"Spacing",min:0,max:.4,step:.01},
    {id:"yellowTint",lbl:"Yellow Tint",min:0,max:1,step:.01},
    {id:"imperfect",lbl:"Imperfections",min:0,max:1,step:.01},
  ];

  return(
    <div style={S.root}>
      <div style={S.h2}>🦷 TEETH GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Tooth Type</label>
        <select style={S.sel} value={type} onChange={e=>loadPreset(e.target.value)}>{TOOTH_TYPES.map(t=><option key={t}>{t}</option>)}</select>
        <canvas ref={prevRef} width={300} height={120} style={S.prev}/>
        <button style={{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer"}} onClick={preview}>👁 Preview</button>
        <label style={S.lbl}><input type="checkbox" checked={teeth.multiRow} onChange={e=>setTeeth(t=>({...t,multiRow:e.target.checked}))}/> Multi-Row Teeth</label>
      </div>
      <div style={S.sec}>
        {CTRL.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {typeof teeth[c.id]==="number"?teeth[c.id].toFixed(c.step<.1?2:0):""}</label>
            <input style={S.inp} type="range" min={c.min} max={c.max} step={c.step} value={teeth[c.id]||0} onChange={e=>setTeeth(t=>({...t,[c.id]:+e.target.value}))}/>
          </div>
        ))}
        <label style={S.lbl}>Gum Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={gumColor} onChange={e=>setGumColor(e.target.value)}/>
      </div>
      <button style={S.btn} onClick={buildTeethMesh}>⚡ Build Teeth</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ── EYEBROW GENERATOR ──────────────────────────────────────────────────────────
FILES[f"{P}/EyebrowGeneratorPanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},prev:{width:"100%",height:100,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const BROW_PRESETS={
  "Natural":    {thickness:.5,width:.7,archH:.4,archSharp:.3,length:.7,tailLen:.5,density:.7,asymmetry:.05,browRidge:0,angelicCurve:0,demonAngle:0},
  "Thick":      {thickness:.85,width:.8,archH:.3,archSharp:.2,length:.8,tailLen:.6,density:.9,asymmetry:.05,browRidge:0,angelicCurve:.1,demonAngle:0},
  "Thin":       {thickness:.2,width:.65,archH:.5,archSharp:.5,length:.6,tailLen:.4,density:.5,asymmetry:.08,browRidge:0,angelicCurve:.2,demonAngle:0},
  "Sculpted":   {thickness:.55,width:.7,archH:.65,archSharp:.6,length:.68,tailLen:.5,density:.75,asymmetry:.03,browRidge:0,angelicCurve:.15,demonAngle:0},
  "Villain":    {thickness:.6,width:.68,archH:.2,archSharp:.8,length:.65,tailLen:.55,density:.8,asymmetry:.2,browRidge:.4,angelicCurve:0,demonAngle:.7},
  "Demon Brow": {thickness:.9,width:.85,archH:.1,archSharp:.9,length:.85,tailLen:.8,density:.95,asymmetry:.15,browRidge:.9,angelicCurve:0,demonAngle:.9},
  "Heavy Ridge":{thickness:.95,width:.9,archH:.15,archSharp:.7,length:.88,tailLen:.7,density:1,asymmetry:.1,browRidge:.95,angelicCurve:0,demonAngle:.5},
  "Angular":    {thickness:.65,width:.72,archH:.3,archSharp:.95,length:.7,tailLen:.5,density:.8,asymmetry:.1,browRidge:.3,angelicCurve:0,demonAngle:.6},
};

function drawBrowPreview(canvas,brow,color){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,w,h);
  const drawBrow=(cx,flip)=>{
    const bw=brow.width*w*.35,bh=brow.thickness*h*.35;
    const archY=-brow.archH*h*.18;
    const angle=(brow.demonAngle*.3)*(flip?-1:1);
    ctx.save();ctx.translate(cx,h*.42);ctx.rotate(angle);
    // brow ridge
    if(brow.browRidge>.1){ctx.beginPath();ctx.ellipse(0,-bh*.5,bw*.55,bh*(.5+brow.browRidge*.5),0,0,Math.PI*2);ctx.fillStyle="rgba(100,60,40,"+brow.browRidge*.4+")";ctx.fill();}
    // brow hair
    for(let i=0;i<Math.round(brow.density*25);i++){
      const t=i/25,lx=-bw*.45+t*bw*.9+brow.tailLen*bw*.1;
      const larch=Math.sin(t*Math.PI)*archY;
      const lthick=bh*(.7+Math.sin(t*Math.PI)*brow.density*.3);
      const angle2=(Math.random()-.5)*.3+brow.demonAngle*.2;
      ctx.strokeStyle=color||"#554433";ctx.lineWidth=1+brow.thickness*2;ctx.globalAlpha=.7+Math.random()*.3;
      ctx.beginPath();ctx.moveTo(lx,larch);ctx.lineTo(lx+Math.sin(angle2)*2,larch-lthick*.4);ctx.stroke();
    }
    ctx.globalAlpha=1;
    // main shape
    ctx.beginPath();ctx.moveTo(-bw*.45,0);
    ctx.quadraticCurveTo(-bw*.1,archY-bh*.3*brow.archSharp,bw*.5+brow.tailLen*bw*.2,bh*.2);
    ctx.quadraticCurveTo(bw*.2,archY+bh*.5,- bw*.45,bh*.25);
    ctx.closePath();ctx.fillStyle=color||"#443322";ctx.globalAlpha=.7;ctx.fill();ctx.globalAlpha=1;
    ctx.restore();
  };
  const asym=brow.asymmetry*h*.04;
  drawBrow(w*.3,false);
  ctx.save();ctx.translate(w*.7,asym);drawBrow(0,true);ctx.restore();
}

export default function EyebrowGeneratorPanel({scene}){
  const [preset,setPreset]=useState("Natural");
  const [brow,setBrow]=useState({...BROW_PRESETS["Natural"]});
  const [browColor,setBrowColor]=useState("#443322");
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);

  function loadPreset(p){setPreset(p);setBrow({...BROW_PRESETS[p]});setTimeout(()=>{if(prevRef.current)drawBrowPreview(prevRef.current,BROW_PRESETS[p],browColor);},50);}
  function preview(){if(prevRef.current)drawBrowPreview(prevRef.current,brow,browColor);}

  function applyToScene(){
    if(!scene){setStatus("No scene");return;}
    const c=document.createElement("canvas");c.width=c.height=256;drawBrowPreview(c,brow,browColor);
    const tex=new THREE.CanvasTexture(c);let n=0;
    scene.traverse(o=>{if(o.isMesh&&(o.name.toLowerCase().includes("brow")||o.userData.isBrow)){o.material=new THREE.MeshStandardMaterial({map:tex,roughness:.9,transparent:true});n++;}});
    setStatus(`✓ Applied to ${n} eyebrow mesh(es)`);
  }

  const CTRL=[
    {id:"thickness",lbl:"Thickness"},{id:"width",lbl:"Width"},{id:"archH",lbl:"Arch Height"},
    {id:"archSharp",lbl:"Arch Sharpness"},{id:"length",lbl:"Length"},{id:"tailLen",lbl:"Tail Length"},
    {id:"density",lbl:"Hair Density"},{id:"asymmetry",lbl:"Asymmetry"},
    {id:"browRidge",lbl:"Brow Ridge Depth"},{id:"demonAngle",lbl:"Demon Angle"},
  ];

  return(
    <div style={S.root}>
      <div style={S.h2}>🪶 EYEBROW GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Brow Preset</label>
        <select style={S.sel} value={preset} onChange={e=>loadPreset(e.target.value)}>{Object.keys(BROW_PRESETS).map(p=><option key={p}>{p}</option>)}</select>
        <canvas ref={prevRef} width={300} height={100} style={S.prev}/>
        <button style={{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:8}} onClick={preview}>👁 Preview</button>
        <label style={S.lbl}>Brow Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={browColor} onChange={e=>{setBrowColor(e.target.value);preview();}}/>
      </div>
      <div style={S.sec}>
        {CTRL.map(c=>(
          <div key={c.id}>
            <label style={S.lbl}>{c.lbl}: {brow[c.id]?.toFixed(2)}</label>
            <input style={S.inp} type="range" min={0} max={1} step={0.01} value={brow[c.id]||0} onChange={e=>{setBrow(b=>({...b,[c.id]:+e.target.value}));preview();}}/>
          </div>
        ))}
      </div>
      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ── TATTOO GENERATOR ───────────────────────────────────────────────────────────
FILES[f"{P}/TattooGeneratorPanel.jsx"] = r'''
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},prev:{width:"100%",height:140,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const PLACEMENTS=["Face","Neck","Chest","Back","Left Arm","Right Arm","Left Hand","Right Hand","Left Leg","Right Leg","Full Body Sleeve"];
const STYLES=["Tribal","Geometric","Minimal Line Art","Traditional Bold","Watercolor","Blackwork","Dotwork","Japanese Irezumi","Fantasy Runes","Magical Markings","Creature Markings","Circuit/Tech","Celtic Knotwork","Biomechanical","Script/Text"];

function drawTattooPreview(canvas, cfg){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,w,h);
  const col=cfg.color||"#111111";
  const fade=cfg.inkFade||0;
  const bw=w*.7,bh=h*.8,bx=w*.15,by=h*.1;
  // Body silhouette
  ctx.beginPath();ctx.ellipse(w/2,h/2,bw/2,bh/2,0,0,Math.PI*2);ctx.fillStyle="rgba(200,140,90,.3)";ctx.fill();
  ctx.strokeStyle="rgba(200,140,90,.5)";ctx.lineWidth=1;ctx.stroke();
  ctx.globalAlpha=1-fade*.5;
  // Draw style
  const style=cfg.style||"Tribal";
  const sc=cfg.scale||1;
  ctx.strokeStyle=col;ctx.fillStyle=col;
  ctx.save();ctx.translate(w/2,h/2);ctx.scale(sc,sc);
  if(style==="Tribal"){
    for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(i*Math.PI/3)*50,Math.sin(i*Math.PI/3)*50);ctx.lineTo(Math.cos(i*Math.PI/3+.3)*40,Math.sin(i*Math.PI/3+.3)*40);ctx.closePath();ctx.lineWidth=3;ctx.stroke();}
  }else if(style==="Geometric"){
    for(let i=0;i<4;i++){ctx.beginPath();const r=15+i*15;ctx.arc(0,0,r,0,Math.PI*2);ctx.lineWidth=1.5;ctx.stroke();}
    for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(Math.cos(i/6*Math.PI*2)*10,Math.sin(i/6*Math.PI*2)*10);ctx.lineTo(Math.cos(i/6*Math.PI*2)*55,Math.sin(i/6*Math.PI*2)*55);ctx.lineWidth=1;ctx.stroke();}
  }else if(style==="Fantasy Runes"){
    ctx.font="bold 18px serif";ctx.textAlign="center";
    ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ"].forEach((r,i)=>{ctx.fillText(r,(i%3-1)*25,Math.floor(i/3)*28-14);});
  }else if(style==="Magical Markings"){
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,40,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;ctx.beginPath();ctx.moveTo(Math.cos(a)*40,Math.sin(a)*40);ctx.lineTo(Math.cos(a+Math.PI*4/5)*40,Math.sin(a+Math.PI*4/5)*40);ctx.stroke();}
  }else if(style==="Circuit/Tech"){
    ctx.lineWidth=1.5;
    let px=0,py=0;
    for(let i=0;i<10;i++){const nx=px+(Math.random()-.5)*50,ny=py+(Math.random()-.5)*50;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(nx,py);ctx.lineTo(nx,ny);ctx.stroke();ctx.beginPath();ctx.arc(nx,ny,2,0,Math.PI*2);ctx.fill();px=nx;py=ny;}
  }else if(style==="Creature Markings"){
    ctx.lineWidth=2;
    for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-40+i*20,-(30-Math.abs(i-2)*8));ctx.quadraticCurveTo(0,40,40-i*20,-(30-Math.abs(i-2)*8));ctx.stroke();}
  }else if(style==="Watercolor"){
    for(let i=0;i<8;i++){ctx.globalAlpha=(1-fade*.5)*.3;ctx.beginPath();ctx.arc((Math.random()-.5)*60,(Math.random()-.5)*60,10+Math.random()*25,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();}
    ctx.globalAlpha=1-fade*.5;
  }else{
    // Generic lines
    ctx.lineWidth=2;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-45+i*30,-30+i*20);ctx.quadraticCurveTo(0,0,45-i*30,30-i*20);ctx.stroke();}
  }
  ctx.restore();ctx.globalAlpha=1;
}

export default function TattooGeneratorPanel({scene}){
  const [placement,setPlacement]=useState("Left Arm");
  const [style,setStyle]=useState("Tribal");
  const [color,setColor]=useState("#111111");
  const [scale,setScale]=useState(1);
  const [rotation,setRotation]=useState(0);
  const [opacity,setOpacity]=useState(0.9);
  const [inkFade,setInkFade]=useState(0.1);
  const [blur,setBlur]=useState(0);
  const [layers,setLayers]=useState([]);
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);

  function preview(){if(prevRef.current)drawTattooPreview(prevRef.current,{style,color,scale,inkFade});}

  function addLayer(){
    setLayers(l=>[...l,{style,color,placement,scale,opacity,inkFade,id:Date.now()}]);
    setStatus(`Layer added — ${layers.length+1} total`);
  }

  function applyToScene(){
    if(!scene){setStatus("No scene");return;}
    const allLayers=layers.length?layers:[{style,color,placement,scale,opacity,inkFade}];
    let n=0;
    allLayers.forEach((layer,idx)=>{
      const c=document.createElement("canvas");c.width=c.height=512;
      drawTattooPreview(c,layer);
      const tex=new THREE.CanvasTexture(c);
      tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
      const mat=new THREE.MeshStandardMaterial({map:tex,transparent:true,opacity:layer.opacity||.9,roughness:.9,alphaTest:.05});
      scene.traverse(o=>{if(o.isMesh&&!o.userData.isTattoo){
        const decal=new THREE.Mesh(new THREE.BoxGeometry(.001,.2,.1),mat.clone());
        decal.position.copy(o.position);decal.position.y+=.3*(idx*.1);
        decal.userData.isTattoo=true;scene.add(decal);n++;
      }});
    });
    setStatus(`✓ ${allLayers.length} tattoo layer(s) applied`);
  }

  function downloadTexture(){
    const c=document.createElement("canvas");c.width=c.height=512;drawTattooPreview(c,{style,color,scale,inkFade});
    const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download=`tattoo_${style.replace(/ /g,"_")}.png`;a.click();
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>💉 TATTOO GENERATOR</div>
      <div style={S.sec}>
        <label style={S.lbl}>Placement Zone</label>
        <select style={S.sel} value={placement} onChange={e=>setPlacement(e.target.value)}>{PLACEMENTS.map(p=><option key={p}>{p}</option>)}</select>
        <label style={S.lbl}>Tattoo Style</label>
        <select style={S.sel} value={style} onChange={e=>{setStyle(e.target.value);setTimeout(preview,50);}}>
          {STYLES.map(s=><option key={s}>{s}</option>)}
        </select>
        <canvas ref={prevRef} width={300} height={140} style={S.prev}/>
        <button style={{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer"}} onClick={preview}>👁 Preview</button>
      </div>
      <div style={S.sec}>
        <label style={S.lbl}>Ink Color</label>
        <input style={{...S.inp,padding:2,height:32}} type="color" value={color} onChange={e=>{setColor(e.target.value);preview();}}/>
        <label style={S.lbl}>Scale: {scale.toFixed(2)}</label>
        <input style={S.inp} type="range" min={.2} max={3} step={.01} value={scale} onChange={e=>{setScale(+e.target.value);preview();}}/>
        <label style={S.lbl}>Rotation: {rotation}°</label>
        <input style={S.inp} type="range" min={0} max={360} value={rotation} onChange={e=>setRotation(+e.target.value)}/>
        <label style={S.lbl}>Opacity: {opacity.toFixed(2)}</label>
        <input style={S.inp} type="range" min={.1} max={1} step={.01} value={opacity} onChange={e=>setOpacity(+e.target.value)}/>
        <label style={S.lbl}>Ink Fade: {inkFade.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={.01} value={inkFade} onChange={e=>{setInkFade(+e.target.value);preview();}}/>
        <label style={S.lbl}>Blur: {blur.toFixed(2)}</label>
        <input style={S.inp} type="range" min={0} max={1} step={.01} value={blur} onChange={e=>setBlur(+e.target.value)}/>
      </div>
      <div style={S.sec}>
        <div style={S.h3}>Layers ({layers.length})</div>
        <button style={S.btnSm} onClick={addLayer}>+ Add Layer</button>
        <button style={S.btnSm} onClick={()=>{setLayers([]);setStatus("Layers cleared");}}>Clear Layers</button>
        {layers.map((l,i)=><div key={l.id} style={{fontSize:10,color:"#888",padding:"2px 0"}}>{i+1}. {l.style} on {l.placement}</div>)}
      </div>
      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      <button style={S.btnO} onClick={downloadTexture}>💾 Download PNG</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
'''

# ─────────────────────────────────────────────────────────────────────────────
# WRITE ALL FILES
# ─────────────────────────────────────────────────────────────────────────────
print("Writing files...")
for path, content in FILES.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    short = path.replace("/workspaces/spx-mesh-editor/src/","src/")
    print(f"  ✓ {short}")

print(f"\n✅ Done — {len(FILES)} files written")
print("Run: npm run build && git add -A && git commit -m 'feat: Character Creator Suite + 30 2D styles + 2D Viewport' && git push")
