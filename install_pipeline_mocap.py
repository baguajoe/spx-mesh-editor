#!/usr/bin/env python3
"""
Chat 2 — SPX 3D→2D Animation Pipeline + Mocap Systems
Installs into BOTH repos:
  /workspaces/spx-mesh-editor  → SPX3DTo2DPipeline.js, ExportToPuppetButton.jsx, VideoFaceMocap3D.jsx
  /workspaces/SPX-Puppet       → SPXMotionImporter.js, VideoMocapPanel.jsx, FaceMocapPanel.jsx

Run from: /workspaces/   OR adjust MESH_REPO / PUPPET_REPO paths at top
"""
import os, sys

# ── CONFIGURE PATHS ──────────────────────────────────────────
MESH_REPO   = os.environ.get("MESH_REPO",   "/workspaces/spx-mesh-editor")
PUPPET_REPO = os.environ.get("PUPPET_REPO", "/workspaces/SPX-Puppet")

for r in [MESH_REPO, PUPPET_REPO]:
    if not os.path.isdir(r):
        print(f"⚠  Repo not found: {r}")
        print(f"   Set env var MESH_REPO / PUPPET_REPO and re-run.")

MESH_SRC    = os.path.join(MESH_REPO,   "src")
PUPPET_SRC  = os.path.join(PUPPET_REPO, "src")

os.makedirs(os.path.join(MESH_SRC,   "pipeline"),  exist_ok=True)
os.makedirs(os.path.join(MESH_SRC,   "components", "pipeline"), exist_ok=True)
os.makedirs(os.path.join(PUPPET_SRC, "pipeline"),  exist_ok=True)
os.makedirs(os.path.join(PUPPET_SRC, "components", "mocap"),    exist_ok=True)

# ════════════════════════════════════════════════════════════
# FILE 1 — .spxmotion FORMAT SPEC + 3D→2D CONVERTER
# ════════════════════════════════════════════════════════════
SPX_PIPELINE_JS = r'''
/**
 * SPX3DTo2DPipeline.js
 * Converts 3D joint/bone animation data → 2D puppet keyframes (.spxmotion)
 *
 * .spxmotion JSON schema:
 * {
 *   "version": "1.0",
 *   "fps": 30,
 *   "duration": 2.5,          // seconds
 *   "bones": ["head","neck","spine","l_shoulder","r_shoulder",...],
 *   "frames": [
 *     {
 *       "time": 0.0,
 *       "keyframes": {
 *         "head":      { "x": 320, "y": 180, "rotation": 0,   "scale": 1.0 },
 *         "l_hand":    { "x": 200, "y": 280, "rotation": -15, "scale": 1.0 },
 *         ...
 *       }
 *     }, ...
 *   ]
 * }
 *
 * Projection: orthographic — 3D (x,y,z) → 2D (x + z*0, y)
 * Canvas size configurable (default 640×480 for puppet stage)
 */

import * as THREE from 'three';

// Standard SPX bone name mapping from common 3D rigs
const BONE_MAP_3D_TO_2D = {
  // Mixamo / standard humanoid names → SPX Puppet bone names
  'Hips':             'hips',
  'Spine':            'spine',
  'Spine1':           'chest',
  'Spine2':           'upper_chest',
  'Neck':             'neck',
  'Head':             'head',
  'LeftShoulder':     'l_shoulder',
  'LeftArm':          'l_upper_arm',
  'LeftForeArm':      'l_forearm',
  'LeftHand':         'l_hand',
  'RightShoulder':    'r_shoulder',
  'RightArm':         'r_upper_arm',
  'RightForeArm':     'r_forearm',
  'RightHand':        'r_hand',
  'LeftUpLeg':        'l_thigh',
  'LeftLeg':          'l_shin',
  'LeftFoot':         'l_foot',
  'RightUpLeg':       'r_thigh',
  'RightLeg':         'r_shin',
  'RightFoot':        'r_foot',
  // iClone / CC names
  'CC_Base_Hip':      'hips',
  'CC_Base_Spine01':  'spine',
  'CC_Base_Head':     'head',
  'CC_Base_L_Upperarm': 'l_upper_arm',
  'CC_Base_R_Upperarm': 'r_upper_arm',
};

/**
 * Project a 3D world position to 2D canvas coords.
 * Uses simple orthographic projection + canvas centering.
 */
function projectTo2D(worldPos, canvasW=640, canvasH=480, scale=6, offsetY=300) {
  return {
    x: canvasW / 2 + worldPos.x * scale,
    y: offsetY  - worldPos.y * scale,  // Y-flip: 3D up = 2D up
  };
}

/**
 * Extract 2D rotation from 3D bone quaternion.
 * Decomposes to Euler ZXY, returns Z angle in degrees for 2D rotation.
 */
function quatToRotation2D(quaternion) {
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'ZXY');
  return THREE.MathUtils.radToDeg(euler.z);
}

/**
 * Convert a Three.js SkinnedMesh/Skeleton animation (AnimationClip)
 * into .spxmotion format.
 *
 * @param {THREE.AnimationClip} clip
 * @param {THREE.Skeleton} skeleton
 * @param {object} options
 * @returns {object} spxmotion JSON object
 */
export function convertClipToSPXMotion(clip, skeleton, options = {}) {
  const {
    fps = 30,
    canvasW = 640,
    canvasH = 480,
    projectionScale = 6,
    projectionOffsetY = 300,
  } = options;

  const duration   = clip.duration;
  const frameCount = Math.ceil(duration * fps);
  const mixer      = new THREE.AnimationMixer(skeleton.bones[0].parent || skeleton.bones[0]);
  const action     = mixer.clipAction(clip);
  action.play();

  // Collect bone names (mapped to SPX names)
  const usedBones = [];
  skeleton.bones.forEach(bone => {
    const spxName = BONE_MAP_3D_TO_2D[bone.name] || bone.name.toLowerCase();
    usedBones.push({ bone, spxName });
  });

  const frames = [];
  for (let f = 0; f < frameCount; f++) {
    const time = f / fps;
    mixer.setTime(time);

    const keyframes = {};
    usedBones.forEach(({ bone, spxName }) => {
      const worldPos = new THREE.Vector3();
      bone.getWorldPosition(worldPos);
      const worldQuat = new THREE.Quaternion();
      bone.getWorldQuaternion(worldQuat);

      const pos2D   = projectTo2D(worldPos, canvasW, canvasH, projectionScale, projectionOffsetY);
      const rot2D   = quatToRotation2D(worldQuat);
      const worldScale = new THREE.Vector3();
      bone.getWorldScale(worldScale);

      keyframes[spxName] = {
        x:        Math.round(pos2D.x * 10) / 10,
        y:        Math.round(pos2D.y * 10) / 10,
        rotation: Math.round(rot2D * 10) / 10,
        scale:    Math.round(worldScale.y * 100) / 100,
      };
    });

    frames.push({ time: Math.round(time * 1000) / 1000, keyframes });
  }

  action.stop();

  return {
    version:  '1.0',
    format:   'spxmotion',
    name:     clip.name || 'unnamed',
    fps,
    duration: Math.round(duration * 1000) / 1000,
    canvasW,
    canvasH,
    bones:    usedBones.map(b => b.spxName),
    frames,
  };
}

/**
 * Convert raw bone position arrays (non-THREE workflow, e.g. from BVH)
 * into .spxmotion. boneFrames = { boneName: [ {time, x,y,z, qx,qy,qz,qw}, ... ] }
 */
export function convertRawBonesToSPXMotion(boneFrames, options = {}) {
  const {
    fps = 30,
    canvasW = 640,
    canvasH = 480,
    projectionScale = 6,
    projectionOffsetY = 300,
  } = options;

  const boneNames = Object.keys(boneFrames);
  const allTimes  = new Set();
  boneNames.forEach(b => boneFrames[b].forEach(f => allTimes.add(f.time)));
  const sortedTimes = Array.from(allTimes).sort((a,b) => a-b);

  const frames = sortedTimes.map(time => {
    const keyframes = {};
    boneNames.forEach(rawName => {
      const spxName = BONE_MAP_3D_TO_2D[rawName] || rawName.toLowerCase();
      // Find closest frame
      const arr = boneFrames[rawName];
      const frame = arr.reduce((prev, cur) => Math.abs(cur.time-time) < Math.abs(prev.time-time) ? cur : prev);

      const worldPos = new THREE.Vector3(frame.x || 0, frame.y || 0, frame.z || 0);
      const quat     = new THREE.Quaternion(frame.qx||0, frame.qy||0, frame.qz||0, frame.qw||1);
      const pos2D    = projectTo2D(worldPos, canvasW, canvasH, projectionScale, projectionOffsetY);
      const rot2D    = quatToRotation2D(quat);

      keyframes[spxName] = {
        x:        Math.round(pos2D.x * 10) / 10,
        y:        Math.round(pos2D.y * 10) / 10,
        rotation: Math.round(rot2D * 10) / 10,
        scale:    1.0,
      };
    });
    return { time: Math.round(time * 1000) / 1000, keyframes };
  });

  const duration = sortedTimes[sortedTimes.length - 1] || 0;

  return {
    version: '1.0',
    format:  'spxmotion',
    name:    'converted',
    fps,
    duration,
    canvasW,
    canvasH,
    bones: [...new Set(boneNames.map(n => BONE_MAP_3D_TO_2D[n] || n.toLowerCase()))],
    frames,
  };
}

/**
 * Download .spxmotion file
 */
export function downloadSPXMotion(spxmotionObj, filename = 'animation.spxmotion') {
  const blob = new Blob([JSON.stringify(spxmotionObj, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { BONE_MAP_3D_TO_2D, projectTo2D, quatToRotation2D };
'''.strip()

# ════════════════════════════════════════════════════════════
# FILE 2 — EXPORT TO SPX PUPPET BUTTON (Mesh Editor)
# ════════════════════════════════════════════════════════════
EXPORT_BTN_JSX = r'''
import React, { useState } from 'react';
import { convertClipToSPXMotion, convertRawBonesToSPXMotion, downloadSPXMotion } from '../../pipeline/SPX3DTo2DPipeline';

const S = {
  wrap: { display:'inline-flex', flexDirection:'column', gap:6 },
  btn: { background:'#FF6600', color:'#fff', border:'none', borderRadius:4, padding:'8px 18px', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, cursor:'pointer' },
  btnT: { background:'#00ffc8', color:'#06060f', border:'none', borderRadius:4, padding:'6px 14px', fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, cursor:'pointer' },
  status: { fontSize:10, color:'#00ffc8', fontFamily:'JetBrains Mono,monospace' },
  modal: { position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 },
  box: { background:'#0d0d1a', border:'2px solid #00ffc8', borderRadius:8, padding:24, minWidth:360, fontFamily:'JetBrains Mono,monospace', color:'#e0e0e0' },
  h3: { color:'#00ffc8', fontSize:14, marginBottom:12 },
  label: { fontSize:11, color:'#aaa', display:'block', marginBottom:4 },
  input: { width:'100%', background:'#06060f', border:'1px solid #1a1a2e', color:'#e0e0e0', padding:'4px 8px', borderRadius:4, fontFamily:'JetBrains Mono,monospace', fontSize:11, marginBottom:10, boxSizing:'border-box' },
  select: { width:'100%', background:'#06060f', border:'1px solid #1a1a2e', color:'#e0e0e0', padding:'4px 8px', borderRadius:4, fontFamily:'JetBrains Mono,monospace', fontSize:11, marginBottom:10, boxSizing:'border-box' },
  row: { display:'flex', gap:8, marginTop:12 },
};

/**
 * ExportToPuppetButton
 * Props:
 *   skeleton   — THREE.Skeleton (optional)
 *   clip       — THREE.AnimationClip (optional)
 *   boneFrames — raw bone frames object (alternative to clip)
 *   clipName   — string name for the exported file
 */
export default function ExportToPuppetButton({ skeleton, clip, boneFrames, clipName = 'animation' }) {
  const [open, setOpen]   = useState(false);
  const [fps, setFps]     = useState(30);
  const [cw, setCw]       = useState(640);
  const [ch, setCh]       = useState(480);
  const [scale, setScale] = useState(6);
  const [offY, setOffY]   = useState(300);
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState(null);

  function runExport() {
    try {
      let motion;
      const opts = { fps, canvasW: cw, canvasH: ch, projectionScale: scale, projectionOffsetY: offY };

      if (clip && skeleton) {
        motion = convertClipToSPXMotion(clip, skeleton, opts);
      } else if (boneFrames) {
        motion = convertRawBonesToSPXMotion(boneFrames, opts);
      } else {
        // Demo: generate a walk cycle procedurally
        const demoFrames = {};
        const bones = ['hips','spine','chest','neck','head','l_shoulder','l_upper_arm','l_forearm','l_hand','r_shoulder','r_upper_arm','r_forearm','r_hand','l_thigh','l_shin','l_foot','r_thigh','r_shin','r_foot'];
        const demoFps = fps, duration = 1.0;
        const frameCount = Math.ceil(duration * demoFps);
        bones.forEach(b => {
          demoFrames[b] = [];
          for (let f = 0; f < frameCount; f++) {
            const t  = f / demoFps;
            const ph = (t / duration) * Math.PI * 2;
            let y = 1.0, x = 0;
            if (b === 'hips')     { y = 1.0 + Math.sin(ph*2) * 0.05; }
            if (b === 'l_thigh')  { x = Math.sin(ph) * 0.4; }
            if (b === 'r_thigh')  { x = -Math.sin(ph) * 0.4; }
            if (b === 'l_upper_arm') { x = -Math.sin(ph) * 0.5; }
            if (b === 'r_upper_arm') { x =  Math.sin(ph) * 0.5; }
            demoFrames[b].push({ time: t, x, y, z: 0, qx: 0, qy: 0, qz: Math.sin(x*0.5)*0.2, qw: 1 });
          }
        });
        motion = convertRawBonesToSPXMotion(demoFrames, opts);
        motion.name = clipName + '_demo_walkcycle';
      }

      setPreview({
        name: motion.name,
        fps: motion.fps,
        duration: motion.duration,
        bones: motion.bones.length,
        frames: motion.frames.length,
      });
      downloadSPXMotion(motion, `${clipName}.spxmotion`);
      setStatus(`✓ Exported ${motion.frames.length} frames → ${clipName}.spxmotion`);
    } catch (e) {
      setStatus('Export error: ' + e.message);
    }
  }

  return (
    <div style={S.wrap}>
      <button style={S.btn} onClick={() => setOpen(true)}>
        🎭 Export → SPX Puppet
      </button>
      {status && <div style={S.status}>{status}</div>}

      {open && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div style={S.box}>
            <div style={S.h3}>Export to SPX Puppet (.spxmotion)</div>

            <label style={S.label}>Frame Rate (fps)</label>
            <select style={S.select} value={fps} onChange={e => setFps(+e.target.value)}>
              {[12,24,30,60].map(f => <option key={f}>{f}</option>)}
            </select>

            <label style={S.label}>Canvas Width: {cw}px</label>
            <input style={S.input} type="range" min={320} max={1920} step={80} value={cw} onChange={e => setCw(+e.target.value)} />

            <label style={S.label}>Canvas Height: {ch}px</label>
            <input style={S.input} type="range" min={240} max={1080} step={60} value={ch} onChange={e => setCh(+e.target.value)} />

            <label style={S.label}>Projection Scale: {scale}</label>
            <input style={S.input} type="range" min={1} max={20} step={0.5} value={scale} onChange={e => setScale(+e.target.value)} />

            <label style={S.label}>Y Offset: {offY}</label>
            <input style={S.input} type="range" min={0} max={ch} step={10} value={offY} onChange={e => setOffY(+e.target.value)} />

            {preview && (
              <div style={{ background:'#06060f', borderRadius:4, padding:8, marginBottom:8, fontSize:10, color:'#00ffc8' }}>
                Last export: {preview.name} | {preview.fps}fps | {preview.duration}s | {preview.bones} bones | {preview.frames} frames
              </div>
            )}

            <div style={S.row}>
              <button style={S.btn} onClick={runExport}>⬇ Export .spxmotion</button>
              <button style={S.btnT} onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'''.strip()

# ════════════════════════════════════════════════════════════
# FILE 3 — .spxmotion IMPORTER (SPX Puppet)
# ════════════════════════════════════════════════════════════
MOTION_IMPORTER_JS = r'''
/**
 * SPXMotionImporter.js — SPX Puppet
 * Imports .spxmotion files and drives puppet bone keyframes
 */

export class SPXMotionImporter {
  constructor() {
    this.motion     = null;
    this.playing    = false;
    this.startTime  = null;
    this.onFrame    = null;   // callback(keyframes, time)
    this.onComplete = null;
    this._raf       = null;
  }

  /**
   * Load from File object (drag-drop or file picker)
   */
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          this.load(data);
          resolve(data);
        } catch (err) {
          reject(new Error('Invalid .spxmotion file: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }

  /**
   * Load from parsed JSON object
   */
  load(motionData) {
    if (motionData.format !== 'spxmotion') {
      throw new Error('Not a .spxmotion file');
    }
    this.motion = motionData;
    this.playing = false;
    this._raf && cancelAnimationFrame(this._raf);
  }

  /**
   * Get interpolated keyframes at a given time (seconds)
   */
  getFrameAt(time) {
    if (!this.motion) return {};
    const { frames, duration } = this.motion;
    const t = ((time % duration) + duration) % duration;

    // Binary search for surrounding frames
    let lo = 0, hi = frames.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (frames[mid].time <= t) lo = mid; else hi = mid;
    }
    const frameA = frames[lo];
    const frameB = frames[Math.min(hi, frames.length - 1)];

    if (!frameB || frameA === frameB) return { ...frameA.keyframes };

    const span = frameB.time - frameA.time;
    const alpha = span > 0 ? (t - frameA.time) / span : 0;

    // Lerp each bone
    const result = {};
    const bones = this.motion.bones;
    bones.forEach(bone => {
      const a = frameA.keyframes[bone] || {};
      const b = frameB.keyframes[bone] || {};
      result[bone] = {
        x:        lerp(a.x        || 0, b.x        || 0, alpha),
        y:        lerp(a.y        || 0, b.y        || 0, alpha),
        rotation: lerpAngle(a.rotation || 0, b.rotation || 0, alpha),
        scale:    lerp(a.scale    || 1, b.scale    || 1, alpha),
      };
    });
    return result;
  }

  /**
   * Play the motion — calls onFrame(keyframes, time) each RAF tick
   */
  play(onFrame, onComplete) {
    if (!this.motion) return;
    this.onFrame    = onFrame    || this.onFrame;
    this.onComplete = onComplete || this.onComplete;
    this.playing    = true;
    this.startTime  = performance.now();

    const tick = (now) => {
      if (!this.playing) return;
      const elapsed = (now - this.startTime) / 1000;
      const kf = this.getFrameAt(elapsed);
      this.onFrame && this.onFrame(kf, elapsed);
      if (elapsed >= this.motion.duration) {
        this.playing = false;
        this.onComplete && this.onComplete();
        return;
      }
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  /**
   * Loop the motion continuously
   */
  loop(onFrame) {
    if (!this.motion) return;
    this.onFrame = onFrame;
    this.playing = true;
    this.startTime = performance.now();

    const tick = (now) => {
      if (!this.playing) return;
      const elapsed = (now - this.startTime) / 1000;
      const kf = this.getFrameAt(elapsed); // getFrameAt already loops via modulo
      this.onFrame && this.onFrame(kf, elapsed);
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  stop() {
    this.playing = false;
    this._raf && cancelAnimationFrame(this._raf);
  }

  get duration() { return this.motion?.duration || 0; }
  get fps()      { return this.motion?.fps      || 30; }
  get bones()    { return this.motion?.bones    || []; }
  get name()     { return this.motion?.name     || ''; }
}

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpAngle(a, b, t) {
  let delta = ((b - a) % 360 + 540) % 360 - 180;
  return a + delta * t;
}

export default SPXMotionImporter;
'''.strip()

# ════════════════════════════════════════════════════════════
# FILE 4 — VIDEO MOCAP PANEL (MP4 → MediaPipe → Puppet)
# ════════════════════════════════════════════════════════════
VIDEO_MOCAP_JSX = r'''
import React, { useState, useRef, useEffect } from 'react';

const S = {
  root: { background:'#06060f', color:'#e0e0e0', fontFamily:'JetBrains Mono,monospace', padding:16, height:'100%', overflowY:'auto' },
  h2: { color:'#00ffc8', fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:'#aaa', display:'block', marginBottom:4 },
  btn: { background:'#00ffc8', color:'#06060f', border:'none', borderRadius:4, padding:'7px 16px', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, cursor:'pointer', marginRight:8, marginBottom:8 },
  btnO: { background:'#FF6600', color:'#fff', border:'none', borderRadius:4, padding:'7px 16px', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, cursor:'pointer', marginRight:8, marginBottom:8 },
  btnRed: { background:'#cc2200', color:'#fff', border:'none', borderRadius:4, padding:'7px 16px', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, cursor:'pointer', marginRight:8, marginBottom:8 },
  section: { background:'#0d0d1a', border:'1px solid #1a1a2e', borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:'#00ffc8', marginBottom:4 },
  canvas: { width:'100%', borderRadius:6, border:'1px solid #1a1a2e', background:'#000' },
  progress: (pct) => ({ width:`${pct}%`, height:4, background:'#00ffc8', borderRadius:2, transition:'width 0.2s' }),
};

// MediaPipe Pose landmark indices → SPX Puppet bone names
const POSE_TO_SPX = {
  0:  'head',
  11: 'l_shoulder',
  12: 'r_shoulder',
  13: 'l_upper_arm',
  14: 'r_upper_arm',
  15: 'l_forearm',
  16: 'r_forearm',
  17: 'l_hand',
  18: 'r_hand',
  23: 'l_thigh',
  24: 'r_thigh',
  25: 'l_shin',
  26: 'r_shin',
  27: 'l_foot',
  28: 'r_foot',
  // Derived from midpoints:
  // hips = midpoint(23,24), spine = midpoint(11,12,23,24)
};

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z||0) + (b.z||0)) / 2, visibility: Math.min(a.visibility||1, b.visibility||1) };
}

function landmarksToSPXKeyframe(lm, canvasW, canvasH) {
  const kf = {};
  Object.entries(POSE_TO_SPX).forEach(([idx, name]) => {
    const p = lm[+idx];
    if (!p) return;
    kf[name] = {
      x: p.x * canvasW,
      y: p.y * canvasH,
      rotation: 0,
      scale: 1,
      confidence: p.visibility || 1,
    };
  });
  // Derived bones
  if (lm[23] && lm[24]) {
    const hip = midpoint(lm[23], lm[24]);
    kf['hips'] = { x: hip.x * canvasW, y: hip.y * canvasH, rotation: 0, scale: 1 };
  }
  if (lm[11] && lm[12] && lm[23] && lm[24]) {
    const sp = midpoint(midpoint(lm[11],lm[12]), midpoint(lm[23],lm[24]));
    kf['spine'] = { x: sp.x * canvasW, y: sp.y * canvasH, rotation: 0, scale: 1 };
  }
  return kf;
}

export default function VideoMocapPanel({ onMotionReady }) {
  const [status, setStatus]     = useState('');
  const [progress, setProgress] = useState(0);
  const [recording, setRecording] = useState(false);
  const [frames, setFrames]     = useState([]);
  const [fps, setFps]           = useState(30);
  const [canvasW, setCanvasW]   = useState(640);
  const [canvasH, setCanvasH]   = useState(480);
  const [smooth, setSmooth]     = useState(true);
  const [videoSrc, setVideoSrc] = useState(null);
  const [mpReady, setMpReady]   = useState(false);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const poseRef   = useRef(null);
  const camRef    = useRef(null);
  const recordedFrames = useRef([]);

  // Load MediaPipe via CDN
  useEffect(() => {
    const loaded = () => setMpReady(true);
    if (window.Pose) { loaded(); return; }
    const s1 = document.createElement('script');
    s1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
    s1.crossOrigin = 'anonymous';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      s2.crossOrigin = 'anonymous';
      s2.onload = loaded;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }, []);

  function initPose(videoEl, canvasEl) {
    if (!window.Pose) { setStatus('MediaPipe not loaded'); return; }
    const pose = new window.Pose({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: smooth,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    pose.onResults(results => {
      if (!results.poseLandmarks) return;
      const ctx = canvasEl.getContext('2d');
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);
      drawSkeleton(ctx, results.poseLandmarks, canvasEl.width, canvasEl.height);

      if (recording) {
        const kf = landmarksToSPXKeyframe(results.poseLandmarks, canvasEl.width, canvasEl.height);
        recordedFrames.current.push({ time: recordedFrames.current.length / fps, keyframes: kf });
        setFrames(prev => [...prev.slice(-2), { count: recordedFrames.current.length }]);
      }
    });
    poseRef.current = pose;
    return pose;
  }

  function drawSkeleton(ctx, landmarks, w, h) {
    const connections = [
      [11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],
      [23,25],[25,27],[24,26],[26,28],
    ];
    ctx.strokeStyle = '#00ffc8';
    ctx.lineWidth   = 2;
    connections.forEach(([a, b]) => {
      const pa = landmarks[a], pb = landmarks[b];
      if (!pa || !pb) return;
      ctx.beginPath();
      ctx.moveTo(pa.x * w, pa.y * h);
      ctx.lineTo(pb.x * w, pb.y * h);
      ctx.stroke();
    });
    landmarks.forEach((p, i) => {
      if (!POSE_TO_SPX[i] && i !== 23 && i !== 24) return;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6600';
      ctx.fill();
    });
  }

  async function startWebcam() {
    if (!mpReady) { setStatus('MediaPipe loading…'); return; }
    const canvas = canvasRef.current;
    canvas.width = canvasW; canvas.height = canvasH;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: canvasW, height: canvasH } });
      const video = videoRef.current;
      video.srcObject = stream;
      video.play();
      const pose = initPose(video, canvas);
      if (!pose) return;
      if (window.Camera) {
        camRef.current = new window.Camera(video, {
          onFrame: async () => { await pose.send({ image: video }); },
          width: canvasW, height: canvasH,
        });
        camRef.current.start();
        setStatus('✓ Webcam mocap running');
      }
    } catch (e) { setStatus('Camera error: ' + e.message); }
  }

  async function processVideoFile(file) {
    if (!mpReady) { setStatus('MediaPipe loading…'); return; }
    setVideoSrc(URL.createObjectURL(file));
    setTimeout(async () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = canvasW; canvas.height = canvasH;
      const pose   = initPose(video, canvas);
      if (!pose) return;
      recordedFrames.current = [];
      setRecording(true);
      const duration = video.duration;
      const frameStep = 1 / fps;
      let t = 0;
      setStatus('Processing video frames…');
      while (t <= duration) {
        video.currentTime = t;
        await new Promise(res => video.addEventListener('seeked', res, { once: true }));
        await pose.send({ image: video });
        setProgress(Math.round(t / duration * 100));
        t += frameStep;
      }
      setRecording(false);
      setStatus(`✓ ${recordedFrames.current.length} frames extracted`);
      buildMotion();
    }, 500);
  }

  function buildMotion() {
    const bones = Object.keys(POSE_TO_SPX).map(i => POSE_TO_SPX[i]);
    bones.push('hips', 'spine');
    const motion = {
      version: '1.0', format: 'spxmotion', name: 'video_mocap',
      fps, duration: recordedFrames.current.length / fps,
      canvasW, canvasH,
      bones: [...new Set(bones)],
      frames: recordedFrames.current,
    };
    const blob = new Blob([JSON.stringify(motion, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'video_mocap.spxmotion'; a.click();
    onMotionReady && onMotionReady(motion);
    setStatus(`✓ video_mocap.spxmotion downloaded (${recordedFrames.current.length} frames)`);
  }

  function startRecord() { recordedFrames.current = []; setRecording(true); setFrames([]); setStatus('Recording…'); }
  function stopRecord()  { setRecording(false); setStatus(`Recorded ${recordedFrames.current.length} frames`); if (recordedFrames.current.length) buildMotion(); }

  function stopAll() {
    camRef.current?.stop();
    if (videoRef.current?.srcObject) { videoRef.current.srcObject.getTracks().forEach(t => t.stop()); }
    setRecording(false); setStatus('Stopped');
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>🎬 VIDEO MOCAP → SPX PUPPET</div>
      <div style={S.section}>
        <div style={S.stat}>{mpReady ? '✓ MediaPipe Pose ready' : '⏳ Loading MediaPipe…'}</div>
        <label style={S.label}>Canvas: {canvasW}×{canvasH} | FPS: {fps}</label>
        <video ref={videoRef} src={videoSrc} style={{ display:'none' }} crossOrigin="anonymous" playsInline muted />
        <canvas ref={canvasRef} style={S.canvas} />
      </div>
      <div style={S.section}>
        <div style={S.label}>Source</div>
        <button style={S.btn} onClick={startWebcam}>📷 Live Webcam</button>
        <label style={S.btn}>
          📁 Upload MP4
          <input type="file" accept="video/*" style={{ display:'none' }} onChange={e => e.target.files[0] && processVideoFile(e.target.files[0])} />
        </label>
      </div>
      {recording
        ? <button style={S.btnRed} onClick={stopRecord}>⏹ Stop + Export</button>
        : <button style={S.btnO}   onClick={startRecord}>⏺ Start Recording</button>
      }
      <button style={S.btn} onClick={stopAll}>✕ Stop All</button>
      {progress > 0 && progress < 100 && (
        <div style={{ background:'#0d0d1a', borderRadius:4, padding:4, marginTop:8 }}>
          <div style={S.progress(progress)} />
          <div style={{ fontSize:10, color:'#00ffc8', marginTop:4 }}>{progress}%</div>
        </div>
      )}
      {status && <div style={{ ...S.stat, marginTop:8 }}>{status}</div>}
      {frames.length > 0 && <div style={S.stat}>Frames: {frames[frames.length-1]?.count}</div>}
    </div>
  );
}
'''.strip()

# ════════════════════════════════════════════════════════════
# FILE 5 — FACE MOCAP PANEL (Puppet)
# ════════════════════════════════════════════════════════════
FACE_MOCAP_JSX = r'''
import React, { useState, useRef, useEffect } from 'react';

const S = {
  root: { background:'#06060f', color:'#e0e0e0', fontFamily:'JetBrains Mono,monospace', padding:16, height:'100%', overflowY:'auto' },
  h2: { color:'#00ffc8', fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:'#aaa', display:'block', marginBottom:4 },
  btn: { background:'#00ffc8', color:'#06060f', border:'none', borderRadius:4, padding:'7px 16px', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, cursor:'pointer', marginRight:8, marginBottom:8 },
  btnO: { background:'#FF6600', color:'#fff', border:'none', borderRadius:4, padding:'7px 16px', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, cursor:'pointer', marginRight:8, marginBottom:8 },
  btnRed: { background:'#cc2200', color:'#fff', border:'none', borderRadius:4, padding:'7px 16px', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, cursor:'pointer', marginRight:8, marginBottom:8 },
  section: { background:'#0d0d1a', border:'1px solid #1a1a2e', borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:'#00ffc8', marginBottom:4 },
  bar: { background:'#1a1a2e', borderRadius:3, height:8, marginBottom:4 },
  barFill: (v) => ({ width:`${Math.round(v*100)}%`, height:'100%', background:'#00ffc8', borderRadius:3 }),
  canvas: { width:'100%', borderRadius:6, border:'1px solid #1a1a2e', background:'#000' },
};

// FaceMesh indices for key facial landmarks
const FACE_LANDMARKS = {
  jaw_open:       [13, 14],   // upper/lower lip distance
  brow_left_up:   [105, 107],
  brow_right_up:  [334, 336],
  eye_left_open:  [159, 145],
  eye_right_open: [386, 374],
  mouth_left:     [61],
  mouth_right:    [291],
  nose_tip:       [4],
  chin:           [152],
  head_rotation:  [1, 4, 6],  // nose bridge for yaw/pitch
};

function dist(a, b) {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + ((a.z||0)-(b.z||0))**2);
}

function extractFaceParams(lm) {
  const jawOpen   = Math.min(1, dist(lm[13], lm[14]) * 15);
  const eyeL      = Math.min(1, dist(lm[159], lm[145]) * 12);
  const eyeR      = Math.min(1, dist(lm[386], lm[374]) * 12);
  const browL     = Math.max(0, 0.5 - (lm[105].y - lm[159].y) * 10);
  const browR     = Math.max(0, 0.5 - (lm[334].y - lm[386].y) * 10);
  const mouthW    = dist(lm[61], lm[291]);
  const smile     = Math.min(1, (mouthW - 0.12) * 10);
  // Head rotation (simplified from nose/chin axis)
  const headYaw   = (lm[4].x - 0.5) * 2;   // -1 left, +1 right
  const headPitch = (lm[4].y - lm[152].y) * 3 - 0.6;
  const headRoll  = (lm[61].y - lm[291].y) * 5;

  return { jawOpen, eyeL, eyeR, browL, browR, smile, headYaw, headPitch, headRoll };
}

export default function FaceMocapPanel({ onFaceParams, onMotionReady }) {
  const [mpReady, setMpReady]       = useState(false);
  const [recording, setRecording]   = useState(false);
  const [live, setLive]             = useState(false);
  const [params, setParams]         = useState({});
  const [fps, setFps]               = useState(30);
  const [status, setStatus]         = useState('');
  const [frameCount, setFrameCount] = useState(0);
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const meshRef    = useRef(null);
  const camRef     = useRef(null);
  const recorded   = useRef([]);
  const startT     = useRef(0);

  useEffect(() => {
    const loadMP = () => {
      if (window.FaceMesh) { setMpReady(true); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      s.crossOrigin = 'anonymous';
      s.onload = () => { setMpReady(true); };
      document.head.appendChild(s);
    };
    loadMP();
  }, []);

  function initFaceMesh(videoEl, canvasEl) {
    if (!window.FaceMesh) { setStatus('FaceMesh not loaded'); return null; }
    const fm = new window.FaceMesh({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    });
    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    fm.onResults(results => {
      const canvas = canvasEl;
      const ctx    = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (!results.multiFaceLandmarks?.[0]) return;
      const lm = results.multiFaceLandmarks[0];

      // Draw face mesh dots
      ctx.fillStyle = '#00ffc8';
      lm.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 1, 0, Math.PI*2);
        ctx.fill();
      });

      const fp = extractFaceParams(lm);
      setParams(fp);
      onFaceParams && onFaceParams(fp);

      if (recording) {
        const t = (performance.now() - startT.current) / 1000;
        recorded.current.push({ time: Math.round(t*1000)/1000, params: { ...fp } });
        setFrameCount(recorded.current.length);
      }
    });
    meshRef.current = fm;
    return fm;
  }

  async function startLive() {
    if (!mpReady) { setStatus('MediaPipe loading…'); return; }
    const canvas = canvasRef.current;
    canvas.width = 480; canvas.height = 360;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width:480, height:360 } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      const fm = initFaceMesh(videoRef.current, canvas);
      if (!fm) return;
      if (window.Camera) {
        camRef.current = new window.Camera(videoRef.current, {
          onFrame: async () => { await fm.send({ image: videoRef.current }); },
          width: 480, height: 360,
        });
        camRef.current.start();
        setLive(true);
        setStatus('✓ Face mocap live');
      } else {
        setStatus('Camera utils not loaded — add mediapipe/camera_utils CDN');
      }
    } catch (e) { setStatus('Camera error: ' + e.message); }
  }

  function stopLive() {
    camRef.current?.stop();
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setLive(false); setStatus('Live stopped');
  }

  function startRecord() { recorded.current = []; startT.current = performance.now(); setRecording(true); setStatus('Recording…'); setFrameCount(0); }
  function stopRecord()  {
    setRecording(false);
    const count = recorded.current.length;
    setStatus(`Recorded ${count} frames`);
    if (count) exportFaceMotion();
  }

  function exportFaceMotion() {
    const duration = recorded.current[recorded.current.length-1]?.time || 0;
    // Convert face params to spxmotion-compatible format (face bones)
    const frames = recorded.current.map(r => ({
      time: r.time,
      keyframes: {
        'face_jaw':    { x: 0, y: 0, rotation: r.params.jawOpen  * 20, scale: 1 },
        'face_eye_l':  { x: 0, y: 0, rotation: 0, scale: r.params.eyeL },
        'face_eye_r':  { x: 0, y: 0, rotation: 0, scale: r.params.eyeR },
        'face_brow_l': { x: 0, y: -r.params.browL * 10, rotation: 0, scale: 1 },
        'face_brow_r': { x: 0, y: -r.params.browR * 10, rotation: 0, scale: 1 },
        'face_smile':  { x: 0, y: 0, rotation: r.params.smile * 10, scale: 1 },
        'head':        { x: 320 + r.params.headYaw * 80, y: 180 - r.params.headPitch * 60, rotation: r.params.headRoll * 20, scale: 1 },
      },
    }));
    const motion = {
      version: '1.0', format: 'spxmotion', name: 'face_mocap', fps, duration,
      canvasW: 640, canvasH: 480,
      bones: ['face_jaw','face_eye_l','face_eye_r','face_brow_l','face_brow_r','face_smile','head'],
      frames,
    };
    const b = new Blob([JSON.stringify(motion, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'face_mocap.spxmotion'; a.click();
    onMotionReady && onMotionReady(motion);
    setStatus(`✓ face_mocap.spxmotion exported (${frames.length} frames)`);
  }

  const pBar = (label, val) => (
    <div key={label}>
      <div style={S.label}>{label}: {typeof val === 'number' ? val.toFixed(3) : val}</div>
      {typeof val === 'number' && Math.abs(val) <= 1 && (
        <div style={S.bar}><div style={S.barFill(Math.max(0,val))} /></div>
      )}
    </div>
  );

  return (
    <div style={S.root}>
      <div style={S.h2}>😶 FACE MOCAP → PUPPET</div>
      <div style={S.section}>
        <div style={S.stat}>{mpReady ? '✓ FaceMesh ready' : '⏳ Loading…'}</div>
        <video ref={videoRef} style={{ display:'none' }} playsInline muted />
        <canvas ref={canvasRef} style={S.canvas} />
      </div>
      <div style={S.section}>
        {!live
          ? <button style={S.btn} onClick={startLive}>📷 Start Live Face Mocap</button>
          : <button style={S.btnRed} onClick={stopLive}>✕ Stop</button>
        }
        {live && (!recording
          ? <button style={S.btnO} onClick={startRecord}>⏺ Record</button>
          : <button style={S.btnRed} onClick={stopRecord}>⏹ Stop + Export</button>
        )}
      </div>
      {Object.keys(params).length > 0 && (
        <div style={S.section}>
          <div style={S.label}>Live Face Parameters</div>
          {pBar('Jaw Open',   params.jawOpen)}
          {pBar('Eye L',      params.eyeL)}
          {pBar('Eye R',      params.eyeR)}
          {pBar('Brow L',     params.browL)}
          {pBar('Brow R',     params.browR)}
          {pBar('Smile',      params.smile)}
          {pBar('Head Yaw',   params.headYaw)}
          {pBar('Head Pitch', params.headPitch)}
          {pBar('Head Roll',  params.headRoll)}
        </div>
      )}
      {recording && <div style={S.stat}>Frames: {frameCount}</div>}
      {status && <div style={{ ...S.stat, marginTop:4 }}>{status}</div>}
    </div>
  );
}
'''.strip()

# ════════════════════════════════════════════════════════════
# FILE 6 — FACE MOCAP FOR 3D MESH EDITOR RIG
# ════════════════════════════════════════════════════════════
FACE_MOCAP_3D_JSX = r'''
import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

const S = {
  root: { background:'#06060f', color:'#e0e0e0', fontFamily:'JetBrains Mono,monospace', padding:16, height:'100%', overflowY:'auto' },
  h2: { color:'#00ffc8', fontSize:14, marginBottom:12, letterSpacing:1 },
  label: { fontSize:11, color:'#aaa', display:'block', marginBottom:4 },
  btn: { background:'#00ffc8', color:'#06060f', border:'none', borderRadius:4, padding:'7px 16px', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, cursor:'pointer', marginRight:8, marginBottom:8 },
  btnO: { background:'#FF6600', color:'#fff', border:'none', borderRadius:4, padding:'7px 16px', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, cursor:'pointer', marginRight:8, marginBottom:8 },
  btnRed: { background:'#cc2200', color:'#fff', border:'none', borderRadius:4, padding:'7px 16px', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, cursor:'pointer', marginRight:8, marginBottom:8 },
  section: { background:'#0d0d1a', border:'1px solid #1a1a2e', borderRadius:6, padding:12, marginBottom:12 },
  stat: { fontSize:11, color:'#00ffc8', marginBottom:4 },
  canvas: { width:'100%', borderRadius:6, border:'1px solid #1a1a2e', background:'#000' },
};

// Maps MediaPipe FaceMesh landmarks to 3D head bone names
const FACE_TO_3D_BONES = {
  'Head':          'head_rotation',
  'Jaw':           'jaw',
  'LeftEye':       'eye_l',
  'RightEye':      'eye_r',
  'LeftBrow':      'brow_l',
  'RightBrow':     'brow_r',
};

function dist(a, b) {
  if (!a || !b) return 0;
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + ((a.z||0)-(b.z||0))**2);
}

/**
 * Drive 3D skeleton bones from FaceMesh landmarks.
 * skeleton: THREE.Skeleton (or object with bones array)
 * lm: MediaPipe FaceMesh landmark array (468 points)
 */
function driveFaceBones(skeleton, lm) {
  if (!skeleton?.bones) return;
  const bones = {};
  skeleton.bones.forEach(b => { bones[b.name] = b; });

  // Head rotation: use nose tip relative to face center
  const headBone = bones['Head'] || bones['CC_Base_Head'] || bones['head'];
  if (headBone && lm[4] && lm[1]) {
    const yaw   = (lm[4].x - 0.5) * Math.PI * 0.6;
    const pitch = (lm[4].y - lm[152]?.y || 0) * Math.PI * 0.4 - 0.1;
    const roll  = ((lm[61]?.y || 0.5) - (lm[291]?.y || 0.5)) * Math.PI * 0.3;
    headBone.rotation.set(pitch, yaw, roll);
  }

  // Jaw open (lower jaw bone)
  const jawBone = bones['Jaw'] || bones['CC_Base_JawRoot'] || bones['jaw'];
  if (jawBone && lm[13] && lm[14]) {
    const open = Math.min(0.4, dist(lm[13], lm[14]) * 8);
    jawBone.rotation.x = open;
  }

  // Eye L
  const eyeLBone = bones['LeftEye'] || bones['CC_Base_L_Eye'] || bones['eye_l'];
  if (eyeLBone && lm[159] && lm[145]) {
    const open = Math.min(1, dist(lm[159], lm[145]) * 12);
    eyeLBone.scale.y = Math.max(0.05, open);
  }

  // Eye R
  const eyeRBone = bones['RightEye'] || bones['CC_Base_R_Eye'] || bones['eye_r'];
  if (eyeRBone && lm[386] && lm[374]) {
    const open = Math.min(1, dist(lm[386], lm[374]) * 12);
    eyeRBone.scale.y = Math.max(0.05, open);
  }

  // Brow L / R — move in Y (up/down)
  const browLBone = bones['LeftBrow'] || bones['brow_l'];
  if (browLBone && lm[105] && lm[159]) {
    browLBone.position.y = (0.5 - lm[105].y) * 0.3;
  }
  const browRBone = bones['RightBrow'] || bones['brow_r'];
  if (browRBone && lm[334] && lm[386]) {
    browRBone.position.y = (0.5 - lm[334].y) * 0.3;
  }
}

export default function VideoFaceMocap3DPanel({ skeleton }) {
  const [mpReady, setMpReady]   = useState(false);
  const [live, setLive]         = useState(false);
  const [recording, setRecording] = useState(false);
  const [frames, setFrames]     = useState(0);
  const [fps, setFps]           = useState(30);
  const [status, setStatus]     = useState('');
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const meshRef   = useRef(null);
  const camRef    = useRef(null);
  const recorded  = useRef([]);
  const startT    = useRef(0);

  useEffect(() => {
    if (window.FaceMesh) { setMpReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => setMpReady(true);
    document.head.appendChild(s);
  }, []);

  function setupFaceMesh(videoEl, canvasEl) {
    if (!window.FaceMesh) { setStatus('FaceMesh not loaded'); return null; }
    const fm = new window.FaceMesh({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    });
    fm.setOptions({ maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:0.5, minTrackingConfidence:0.5 });
    fm.onResults(results => {
      const ctx = canvasEl.getContext('2d');
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);
      if (!results.multiFaceLandmarks?.[0]) return;
      const lm = results.multiFaceLandmarks[0];
      // Draw dots
      ctx.fillStyle = '#FF6600';
      lm.forEach(p => { ctx.beginPath(); ctx.arc(p.x*canvasEl.width, p.y*canvasEl.height, 1, 0, Math.PI*2); ctx.fill(); });
      // Drive 3D bones live
      if (skeleton) driveFaceBones(skeleton, lm);
      // Record
      if (recording) {
        const t = (performance.now() - startT.current) / 1000;
        recorded.current.push({ time: Math.round(t*1000)/1000, landmarks: lm.slice(0,50).map(p=>({x:p.x,y:p.y,z:p.z||0})) });
        setFrames(recorded.current.length);
      }
    });
    meshRef.current = fm;
    return fm;
  }

  async function startLive() {
    if (!mpReady) { setStatus('MediaPipe loading…'); return; }
    const canvas = canvasRef.current;
    canvas.width = 480; canvas.height = 360;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{width:480,height:360} });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      const fm = setupFaceMesh(videoRef.current, canvas);
      if (!fm) return;
      if (window.Camera) {
        camRef.current = new window.Camera(videoRef.current, {
          onFrame: async () => { await fm.send({ image: videoRef.current }); },
          width:480, height:360,
        });
        camRef.current.start();
        setLive(true); setStatus('✓ Face mocap driving 3D rig live');
      }
    } catch(e) { setStatus('Camera error: ' + e.message); }
  }

  function stopLive() {
    camRef.current?.stop();
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t=>t.stop());
    setLive(false); setStatus('Stopped');
  }

  function startRecord() { recorded.current=[]; startT.current=performance.now(); setRecording(true); setStatus('Recording face anim…'); setFrames(0); }
  function stopRecord() {
    setRecording(false);
    const count = recorded.current.length;
    if (!count) { setStatus('No frames recorded'); return; }
    // Export as .spxmotion
    const motionFrames = recorded.current.map(r => {
      const lm = r.landmarks;
      const jawOpen = lm[13] && lm[14] ? Math.min(1, Math.sqrt((lm[13].x-lm[14].x)**2+(lm[13].y-lm[14].y)**2)*8) : 0;
      const yaw = (lm[4]?.x||0.5 - 0.5) * 60;
      const pitch = ((lm[4]?.y||0) - (lm[152]?.y||0)) * 30 - 10;
      return {
        time: r.time,
        keyframes: {
          'head': { x:320+yaw*2, y:180-pitch*2, rotation: yaw, scale:1 },
          'face_jaw': { x:0, y:0, rotation: jawOpen*20, scale:1 },
        }
      };
    });
    const duration = recorded.current[count-1].time;
    const motion = {
      version:'1.0', format:'spxmotion', name:'face_3d_mocap',
      fps, duration, canvasW:640, canvasH:480,
      bones:['head','face_jaw'], frames: motionFrames,
    };
    const b = new Blob([JSON.stringify(motion,null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='face_3d_mocap.spxmotion'; a.click();
    setStatus(`✓ face_3d_mocap.spxmotion exported (${count} frames)`);
  }

  return (
    <div style={S.root}>
      <div style={S.h2}>🎭 FACE MOCAP → 3D RIG</div>
      <div style={S.section}>
        <div style={S.stat}>{mpReady ? '✓ FaceMesh loaded' : '⏳ Loading FaceMesh…'}</div>
        {skeleton && <div style={S.stat}>✓ Skeleton connected ({skeleton.bones?.length} bones)</div>}
        <video ref={videoRef} style={{display:'none'}} playsInline muted />
        <canvas ref={canvasRef} style={S.canvas} />
      </div>
      {!live
        ? <button style={S.btn} onClick={startLive}>📷 Start + Drive 3D Rig</button>
        : <button style={S.btnRed} onClick={stopLive}>✕ Stop</button>
      }
      {live && (!recording
        ? <button style={S.btnO} onClick={startRecord}>⏺ Record</button>
        : <button style={S.btnRed} onClick={stopRecord}>⏹ Stop + Export</button>
      )}
      {recording && <div style={S.stat}>Frames: {frames}</div>}
      {status && <div style={{...S.stat,marginTop:8}}>{status}</div>}
      <div style={S.section}>
        <div style={{fontSize:10,color:'#888',lineHeight:1.7}}>
          • Drives Head, Jaw, Eyes, Brows on connected THREE.Skeleton<br/>
          • Supports Mixamo, CC3, iClone bone naming<br/>
          • Records → exports .spxmotion for SPX Puppet import<br/>
          • FPS: {fps} | Landmarks: 468-point MediaPipe FaceMesh
        </div>
      </div>
    </div>
  );
}
'''.strip()

# ─────────────────────────────────────────────────────────────
# WRITE ALL FILES
# ─────────────────────────────────────────────────────────────

files = [
  (os.path.join(MESH_SRC,   "pipeline",              "SPX3DTo2DPipeline.js"),           SPX_PIPELINE_JS),
  (os.path.join(MESH_SRC,   "components", "pipeline","ExportToPuppetButton.jsx"),        EXPORT_BTN_JSX),
  (os.path.join(MESH_SRC,   "components", "pipeline","VideoFaceMocap3DPanel.jsx"),       FACE_MOCAP_3D_JSX),
  (os.path.join(PUPPET_SRC, "pipeline",              "SPXMotionImporter.js"),            MOTION_IMPORTER_JS),
  (os.path.join(PUPPET_SRC, "components", "mocap",   "VideoMocapPanel.jsx"),             VIDEO_MOCAP_JSX),
  (os.path.join(PUPPET_SRC, "components", "mocap",   "FaceMocapPanel.jsx"),              FACE_MOCAP_JSX),
]

print("Writing Chat 2 files…")
for path, content in files:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    short = path.replace(MESH_REPO,"[MESH]").replace(PUPPET_REPO,"[PUPPET]")
    print(f"  ✓ {short}")

print("""
════════════════════════════════════════════════════════════
CHAT 2 INSTALL COMPLETE
════════════════════════════════════════════════════════════

SPX MESH EDITOR  (/workspaces/spx-mesh-editor):
  src/pipeline/SPX3DTo2DPipeline.js            ← .spxmotion format + converter
  src/components/pipeline/ExportToPuppetButton.jsx  ← Export button for toolbar
  src/components/pipeline/VideoFaceMocap3DPanel.jsx ← Face mocap → 3D rig

SPX PUPPET  (/workspaces/SPX-Puppet):
  src/pipeline/SPXMotionImporter.js            ← .spxmotion importer + playback
  src/components/mocap/VideoMocapPanel.jsx     ← MP4 → MediaPipe → puppet
  src/components/mocap/FaceMocapPanel.jsx      ← Face mocap → puppet

HOW TO WIRE ExportToPuppetButton into Mesh Editor toolbar:
  import ExportToPuppetButton from './pipeline/ExportToPuppetButton';
  // Then in your toolbar JSX:
  <ExportToPuppetButton skeleton={skeleton} clip={currentClip} clipName="my_animation" />

HOW TO WIRE SPXMotionImporter into SPX Puppet:
  import SPXMotionImporter from '../../pipeline/SPXMotionImporter';
  const importer = new SPXMotionImporter();
  await importer.loadFromFile(file);       // from file picker
  importer.loop(keyframes => {             // drive puppet bones
    applyKeyframesToBones(keyframes);
  });

NEXT: cd /workspaces/spx-mesh-editor && npm run build
      cd /workspaces/SPX-Puppet && npm run build
""")
