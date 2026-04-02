import React, { useEffect, useMemo, useRef, useState } from "react";
import useDraggablePanel from "../../hooks/useDraggablePanel.js";
import {
  findLatestHairGroup,
  applyBraidPathToHair,
  applyLineupToHair,
  applyFadeGradientToHair,
  trimBeardGroup,
  createScalpMaskCanvas,
  paintMaskDot,
  applyDensityMaskToHair,
} from "../../mesh/hair/HairAdvancedEditing.js";
import {
  createPonytailRig,
  attachCardsToRig,
  stepHairPhysics,
} from "../../mesh/hair/HairRigPhysics.js";

const SIZE = 420;
const GRID = 14;

export default function HairAdvancedPanel({ open = false, onClose, sceneRef = null, setStatus = null }) {
  const { beginDrag, style } = useDraggablePanel({ x: 0, y: 0 });

  const braidRef = useRef(null);
  const maskPreviewRef = useRef(null);
  const rafRef = useRef(null);

  const [braidPoints, setBraidPoints] = useState([]);
  const [lineupY, setLineupY] = useState(1.55);
  const [lineupSoftness, setLineupSoftness] = useState(0.04);
  const [fadeTop, setFadeTop] = useState(1.9);
  const [fadeBottom, setFadeBottom] = useState(1.2);
  const [beardTrimY, setBeardTrimY] = useState(0.15);
  const [beardCurve, setBeardCurve] = useState(0.18);
  const [maskRadius, setMaskRadius] = useState(18);
  const [maskStrength, setMaskStrength] = useState(0.25);
  const [maskErase, setMaskErase] = useState(false);
  const [physicsRunning, setPhysicsRunning] = useState(false);
  const [rigSegments, setRigSegments] = useState(6);

  const maskState = useMemo(() => createScalpMaskCanvas(256), []);

  const latestHair = () => findLatestHairGroup(sceneRef?.current);

  const redrawMaskPreview = () => {
    const c = maskPreviewRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(maskState.canvas, 0, 0, c.width, c.height);
  };

  useEffect(() => {
    redrawMaskPreview();
  }, [open]);

  useEffect(() => {
    if (!physicsRunning) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const tick = (t) => {
      const hair = latestHair();
      if (hair) {
        stepHairPhysics(hair, { time: t });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [physicsRunning]);

  const getBraidPos = (e) => {
    const r = braidRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width - 0.5) * 1.2,
      y: 2.0 - ((e.clientY - r.top) / r.height) * 1.8,
    };
  };

  const addBraidPoint = (e) => {
    const p = getBraidPos(e);
    setBraidPoints((prev) => [...prev, p]);
  };

  const clearBraid = () => {
    setBraidPoints([]);
  };

  const applyBraid = () => {
    const hair = latestHair();
    if (!hair || braidPoints.length < 2) {
      setStatus?.("Need hair and at least 2 braid points");
      return;
    }
    applyBraidPathToHair(hair, braidPoints, {});
    setStatus?.("Braid path applied");
  };

  const applyLineup = () => {
    const hair = latestHair();
    if (!hair) return;
    applyLineupToHair(hair, { lineY: lineupY, softness: lineupSoftness });
    setStatus?.("Lineup applied");
  };

  const applyFade = () => {
    const hair = latestHair();
    if (!hair) return;
    applyFadeGradientToHair(hair, { topY: fadeTop, bottomY: fadeBottom });
    setStatus?.("Fade gradient applied");
  };

  const trimBeard = () => {
    const hair = latestHair();
    if (!hair) return;
    trimBeardGroup(hair, { trimY: beardTrimY, curve: beardCurve });
    setStatus?.("Beard trim applied");
  };

  const initRig = () => {
    const hair = latestHair();
    if (!hair) {
      setStatus?.("No hair found");
      return;
    }
    createPonytailRig(hair, { segments: rigSegments, length: 0.9 });
    attachCardsToRig(hair);
    setStatus?.("Ponytail rig created");
  };

  const paintMask = (e) => {
    const c = maskPreviewRef.current;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * maskState.canvas.width;
    const y = ((e.clientY - r.top) / r.height) * maskState.canvas.height;
    paintMaskDot(maskState.ctx, x, y, maskRadius, maskStrength, maskErase);
    redrawMaskPreview();
  };

  const applyMask = () => {
    const hair = latestHair();
    if (!hair) return;
    applyDensityMaskToHair(hair, maskState.canvas);
    setStatus?.("Density mask applied");
  };

  if (!open) return null;

  return (
    <div className="hair-adv-panel-float" style={{ ...style }}>
      <div className="hair-adv-panel">
        <div className="hair-adv-header" onMouseDown={beginDrag}>
          <div>
            <strong>Hair Advanced Editing</strong>
            <span className="hair-adv-sub"> braid paths, lineups, fades, rigs, masks</span>
          </div>
          <button className="hair-adv-btn" type="button" onClick={onClose}>Close</button>
        </div>

        <div className="hair-adv-toolbar">
          <button className="hair-adv-btn" type="button" onClick={clearBraid}>Clear Braid</button>
          <button className="hair-adv-btn" type="button" onClick={applyBraid}>Apply Braid</button>
          <button className="hair-adv-btn" type="button" onClick={applyLineup}>Apply Lineup</button>
          <button className="hair-adv-btn" type="button" onClick={applyFade}>Apply Fade</button>
          <button className="hair-adv-btn" type="button" onClick={trimBeard}>Trim Beard</button>
          <button className="hair-adv-btn" type="button" onClick={initRig}>Init Ponytail Rig</button>
          <button
            className={`hair-adv-btn ${physicsRunning ? "is-active" : ""}`}
            type="button"
            onClick={() => setPhysicsRunning((v) => !v)}
          >
            {physicsRunning ? "Stop Physics" : "Run Physics"}
          </button>
          <button className="hair-adv-btn" type="button" onClick={applyMask}>Apply Mask</button>
        </div>

        <div className="hair-adv-grid">
          <div className="hair-adv-card">
            <div className="hair-adv-title">Braid Path Drawing</div>
            <svg
              ref={braidRef}
              className="hair-adv-canvas"
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              onClick={addBraidPoint}
            >
              <rect x="0" y="0" width={SIZE} height={SIZE} fill="#10151c" />
              {Array.from({ length: GRID + 1 }).map((_, i) => {
                const p = (i / GRID) * SIZE;
                return (
                  <g key={i}>
                    <line x1={p} y1={0} x2={p} y2={SIZE} stroke="rgba(255,255,255,0.08)" />
                    <line x1={0} y1={p} x2={SIZE} y2={p} stroke="rgba(255,255,255,0.08)" />
                  </g>
                );
              })}
              {braidPoints.length >= 2 && (
                <polyline
                  points={braidPoints.map((p) => `${(p.x / 1.2 + 0.5) * SIZE},${((2.0 - p.y) / 1.8) * SIZE}`).join(" ")}
                  fill="none"
                  stroke="#6fd3ff"
                  strokeWidth="3"
                />
              )}
              {braidPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={(p.x / 1.2 + 0.5) * SIZE}
                  cy={((2.0 - p.y) / 1.8) * SIZE}
                  r="4"
                  fill="#9ec5ff"
                />
              ))}
            </svg>
          </div>

          <div className="hair-adv-card">
            <div className="hair-adv-title">Lineup / Fade / Beard</div>

            <label className="hair-adv-field">
              <span>Lineup Y</span>
              <input className="hair-adv-input" type="range" min="0.2" max="2.2" step="0.01" value={lineupY} onChange={(e) => setLineupY(Number(e.target.value))} />
            </label>

            <label className="hair-adv-field">
              <span>Lineup Softness</span>
              <input className="hair-adv-input" type="range" min="0.005" max="0.2" step="0.005" value={lineupSoftness} onChange={(e) => setLineupSoftness(Number(e.target.value))} />
            </label>

            <label className="hair-adv-field">
              <span>Fade Top</span>
              <input className="hair-adv-input" type="range" min="0.4" max="2.4" step="0.01" value={fadeTop} onChange={(e) => setFadeTop(Number(e.target.value))} />
            </label>

            <label className="hair-adv-field">
              <span>Fade Bottom</span>
              <input className="hair-adv-input" type="range" min="0.0" max="2.0" step="0.01" value={fadeBottom} onChange={(e) => setFadeBottom(Number(e.target.value))} />
            </label>

            <label className="hair-adv-field">
              <span>Beard Trim Y</span>
              <input className="hair-adv-input" type="range" min="-0.2" max="1.0" step="0.01" value={beardTrimY} onChange={(e) => setBeardTrimY(Number(e.target.value))} />
            </label>

            <label className="hair-adv-field">
              <span>Beard Curve</span>
              <input className="hair-adv-input" type="range" min="0" max="1" step="0.01" value={beardCurve} onChange={(e) => setBeardCurve(Number(e.target.value))} />
            </label>
          </div>

          <div className="hair-adv-card">
            <div className="hair-adv-title">Ponytail Rig + Physics</div>

            <label className="hair-adv-field">
              <span>Rig Segments</span>
              <input className="hair-adv-input" type="range" min="3" max="12" step="1" value={rigSegments} onChange={(e) => setRigSegments(Number(e.target.value))} />
            </label>

            <div className="hair-adv-note">
              Use this for ponytails, long braids, and long locs. Init rig first, then run physics.
            </div>
          </div>

          <div className="hair-adv-card">
            <div className="hair-adv-title">Density Brush / Scalp Mask</div>

            <label className="hair-adv-field">
              <span>Brush Radius</span>
              <input className="hair-adv-input" type="range" min="4" max="64" step="1" value={maskRadius} onChange={(e) => setMaskRadius(Number(e.target.value))} />
            </label>

            <label className="hair-adv-field">
              <span>Brush Strength</span>
              <input className="hair-adv-input" type="range" min="0.05" max="1" step="0.05" value={maskStrength} onChange={(e) => setMaskStrength(Number(e.target.value))} />
            </label>

            <button
              className={`hair-adv-btn ${maskErase ? "is-active" : ""}`}
              type="button"
              onClick={() => setMaskErase((v) => !v)}
            >
              {maskErase ? "Erase Mask" : "Paint Mask"}
            </button>

            <canvas
              ref={maskPreviewRef}
              className="hair-adv-mask"
              width={256}
              height={256}
              onMouseDown={paintMask}
              onMouseMove={(e) => { if (e.buttons === 1) paintMask(e); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset Manager (shared across all SPX generator panels)
// ─────────────────────────────────────────────────────────────────────────────
function usePresets(panelName, currentParams) {
  const [presets, setPresets] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`spx_presets_${panelName}`) || '[]');
    } catch { return []; }
  });

  const savePreset = React.useCallback((name) => {
    const next = [...presets.filter(p => p.name !== name),
      { name, params: currentParams, createdAt: Date.now() }];
    setPresets(next);
    try { localStorage.setItem(`spx_presets_${panelName}`, JSON.stringify(next)); } catch {}
  }, [presets, currentParams, panelName]);

  const loadPreset = React.useCallback((name) => {
    return presets.find(p => p.name === name)?.params ?? null;
  }, [presets]);

  const deletePreset = React.useCallback((name) => {
    const next = presets.filter(p => p.name !== name);
    setPresets(next);
    try { localStorage.setItem(`spx_presets_${panelName}`, JSON.stringify(next)); } catch {}
  }, [presets, panelName]);

  return { presets, savePreset, loadPreset, deletePreset };
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard shortcut handler (Enter=generate, Shift+R=randomize, Shift+X=reset)
// ─────────────────────────────────────────────────────────────────────────────
function useGeneratorKeys(onGenerate, onRandomize, onReset) {
  React.useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'Enter')                          onGenerate?.();
      if (e.shiftKey && e.key === 'R')                onRandomize?.();
      if (e.shiftKey && (e.key === 'X' || e.key === 'x')) onReset?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onGenerate, onRandomize, onReset]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared slider + badge primitives (inline — avoids import issues)
// ─────────────────────────────────────────────────────────────────────────────
function _Slider({ label, value, min = 0, max = 1, step = 0.01, onChange, unit = '' }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888' }}>
        <span>{label}</span>
        <span style={{ color: '#00ffc8' }}>
          {typeof value === 'number' ? (step < 0.1 ? value.toFixed(2) : Math.round(value)) : value}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#00ffc8', cursor: 'pointer' }} />
    </div>
  );
}

function _Check({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ccc', cursor: 'pointer', marginBottom: 4 }}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: '#00ffc8' }} />
      {label}
    </label>
  );
}

function _ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 10, color: '#888', flex: 1 }}>{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 32, height: 22, border: 'none', cursor: 'pointer', borderRadius: 3 }} />
      <span style={{ fontSize: 9, color: '#555' }}>{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SPX Mesh Editor — Module Reference
// ──────────────────────────────────────────────────────────────────────────
//
// INTEGRATION
//   This module is part of the SPX Mesh Editor pipeline.
//   Import via the barrel export in src/mesh/hair/index.js
//   or src/generators/index.js as appropriate.
//
// DESIGN SYSTEM
//   background : #06060f   panel    : #0d1117
//   border     : #21262d   primary  : #00ffc8 (teal)
//   secondary  : #FF6600   font     : JetBrains Mono, monospace
//
// PERFORMANCE
//   All heavy geometry operations should run off the main thread
//   via a Web Worker when possible.
//   Use THREE.BufferGeometryUtils.mergeGeometries() for batching.
