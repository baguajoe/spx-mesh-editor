/**
 * HairGrooming.js — SPX Mesh Editor
 * Groom tools: comb, push, pull, smooth, twist, cut, grow, relax, puff, flatten.
 * Operates on strand arrays with brush falloff, X-mirror, and undo/redo.
 */
import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t)   => a + (b - a) * t;

// ─── Brush falloff ─────────────────────────────────────────────────────────
export function brushFalloff(dist, radius, falloff = 0.6) {
  if (dist >= radius) return 0;
  const t = dist / radius;
  return Math.pow(1 - t, 2) * (1 - falloff) + (1 - t) * falloff;
}

// ─── Groom tools ──────────────────────────────────────────────────────────
export const GroomTools = {

  comb(strands, brushPos, radius, strength, direction, falloff = 0.6) {
    return strands.map(strand => {
      const dist = brushPos.distanceTo(strand.rootPos);
      const w    = brushFalloff(dist, radius, falloff) * strength;
      if (w < 0.001) return strand;
      const newCurve = strand.curve.map((pt, i) => {
        if (i === 0) return pt.clone();
        const t = i / (strand.curve.length - 1);
        return pt.clone().add(direction.clone().multiplyScalar(w * t * 0.02));
      });
      return { ...strand, curve: newCurve };
    });
  },

  push(strands, brushPos, radius, strength, falloff = 0.6) {
    return strands.map(strand => {
      const dist = brushPos.distanceTo(strand.rootPos);
      const w    = brushFalloff(dist, radius, falloff) * strength;
      if (w < 0.001) return strand;
      const pushDir = strand.rootPos.clone().sub(brushPos).normalize();
      const offset  = pushDir.multiplyScalar(w * 0.015);
      return { ...strand, rootPos: strand.rootPos.clone().add(offset) };
    });
  },

  pull(strands, brushPos, radius, strength, falloff = 0.6) {
    return strands.map(strand => {
      const dist = brushPos.distanceTo(strand.rootPos);
      const w    = brushFalloff(dist, radius, falloff) * strength;
      if (w < 0.001) return strand;
      const pullDir = brushPos.clone().sub(strand.rootPos).normalize();
      const offset  = pullDir.multiplyScalar(w * 0.015);
      return { ...strand, rootPos: strand.rootPos.clone().add(offset) };
    });
  },

  smooth(strands, brushPos, radius, strength, falloff = 0.6) {
    const affected = strands.filter(s => brushPos.distanceTo(s.rootPos) < radius);
    if (affected.length < 2) return strands;
    const avgDir = new THREE.Vector3();
    affected.forEach(s => {
      const tip = s.curve[s.curve.length - 1];
      avgDir.add(tip.clone().sub(s.rootPos).normalize());
    });
    avgDir.divideScalar(affected.length).normalize();
    return strands.map(strand => {
      const dist = brushPos.distanceTo(strand.rootPos);
      const w    = brushFalloff(dist, radius, falloff) * strength;
      if (w < 0.001) return strand;
      const newCurve = strand.curve.map((pt, i) => {
        if (i === 0) return pt.clone();
        const t     = i / (strand.curve.length - 1);
        const ideal = strand.rootPos.clone().add(avgDir.clone().multiplyScalar(strand.length * t));
        return pt.clone().lerp(ideal, w * 0.3);
      });
      return { ...strand, curve: newCurve };
    });
  },

  twist(strands, brushPos, radius, strength, angle, falloff = 0.6) {
    return strands.map(strand => {
      const dist = brushPos.distanceTo(strand.rootPos);
      const w    = brushFalloff(dist, radius, falloff) * strength;
      if (w < 0.001) return strand;
      const axis = strand.rootNormal.clone().normalize();
      const newCurve = strand.curve.map((pt, i) => {
        if (i === 0) return pt.clone();
        const t       = i / (strand.curve.length - 1);
        const rotAngle = angle * w * t;
        return pt.clone().applyAxisAngle(axis, rotAngle);
      });
      return { ...strand, curve: newCurve };
    });
  },

  cut(strands, brushPos, radius, strength, cutLength, falloff = 0.6) {
    return strands.map(strand => {
      const dist = brushPos.distanceTo(strand.rootPos);
      const w    = brushFalloff(dist, radius, falloff) * strength;
      if (w < 0.001) return strand;
      const newLen = Math.max(0.01, strand.length * (1 - w * 0.6));
      const ratio  = newLen / strand.length;
      const newCurve = strand.curve.map((pt, i) => {
        const t = i / (strand.curve.length - 1);
        if (t > ratio) {
          const root = strand.rootPos;
          const dir  = strand.curve[strand.curve.length-1].clone().sub(root).normalize();
          return root.clone().add(dir.multiplyScalar(newLen * t));
        }
        return pt.clone();
      });
      return { ...strand, curve: newCurve, length: newLen };
    });
  },

  grow(strands, brushPos, radius, strength, maxLength, falloff = 0.6) {
    return strands.map(strand => {
      const dist = brushPos.distanceTo(strand.rootPos);
      const w    = brushFalloff(dist, radius, falloff) * strength;
      if (w < 0.001) return strand;
      const newLen = Math.min(maxLength ?? 0.6, strand.length * (1 + w * 0.3));
      const ratio  = newLen / strand.length;
      const newCurve = strand.curve.map((pt, i) => {
        const t = i / (strand.curve.length - 1);
        const root = strand.rootPos;
        const dir  = strand.curve[strand.curve.length-1].clone().sub(root).normalize();
        return root.clone().add(dir.clone().multiplyScalar(newLen * t));
      });
      return { ...strand, curve: newCurve, length: newLen };
    });
  },

  relax(strands, brushPos, radius, strength, falloff = 0.6) {
    return strands.map(strand => {
      const dist = brushPos.distanceTo(strand.rootPos);
      const w    = brushFalloff(dist, radius, falloff) * strength;
      if (w < 0.001) return strand;
      const restCurve = [];
      const dir = strand.rootNormal.clone();
      for (let i = 0; i < strand.curve.length; i++) {
        const t = i / (strand.curve.length - 1);
        restCurve.push(strand.rootPos.clone().add(dir.clone().multiplyScalar(t * strand.length)));
      }
      const newCurve = strand.curve.map((pt, i) => pt.clone().lerp(restCurve[i], w * 0.4));
      return { ...strand, curve: newCurve };
    });
  },

  puff(strands, brushPos, radius, strength, falloff = 0.6) {
    return strands.map(strand => {
      const dist = brushPos.distanceTo(strand.rootPos);
      const w    = brushFalloff(dist, radius, falloff) * strength;
      if (w < 0.001) return strand;
      const awayFromCenter = strand.rootPos.clone().normalize();
      const offset = awayFromCenter.multiplyScalar(w * 0.012);
      const newCurve = strand.curve.map((pt, i) => {
        const t = i / (strand.curve.length - 1);
        return pt.clone().add(offset.clone().multiplyScalar(t));
      });
      return { ...strand, curve: newCurve };
    });
  },

  flatten(strands, brushPos, radius, strength, normal, falloff = 0.6) {
    const flatNormal = normal ?? new THREE.Vector3(0, 1, 0);
    return strands.map(strand => {
      const dist = brushPos.distanceTo(strand.rootPos);
      const w    = brushFalloff(dist, radius, falloff) * strength;
      if (w < 0.001) return strand;
      const newCurve = strand.curve.map((pt, i) => {
        if (i === 0) return pt.clone();
        const proj = pt.clone().sub(flatNormal.clone().multiplyScalar(pt.dot(flatNormal)));
        return pt.clone().lerp(proj, w * 0.5);
      });
      return { ...strand, curve: newCurve };
    });
  },
};

// ─── X-Mirror helper ──────────────────────────────────────────────────────
export function mirrorBrushPos(pos) {
  return new THREE.Vector3(-pos.x, pos.y, pos.z);
}

export function applyWithMirror(strands, brushPos, toolFn, ...args) {
  const pass1 = toolFn(strands, brushPos, ...args);
  return toolFn(pass1, mirrorBrushPos(brushPos), ...args);
}

// ─── Undo / Redo stack ───────────────────────────────────────────────────
export class GroomHistory {
  constructor(maxLength = 32) {
    this._stack   = [];
    this._pos     = -1;
    this._maxLen  = maxLength;
  }

  push(strands) {
    this._stack = this._stack.slice(0, this._pos + 1);
    this._stack.push(strands.map(s => ({
      ...s,
      rootPos: s.rootPos.clone(),
      curve:   s.curve.map(p => p.clone()),
    })));
    if (this._stack.length > this._maxLen) this._stack.shift();
    this._pos = this._stack.length - 1;
  }

  undo() {
    if (this._pos <= 0) return null;
    this._pos--;
    return this._restore(this._stack[this._pos]);
  }

  redo() {
    if (this._pos >= this._stack.length - 1) return null;
    this._pos++;
    return this._restore(this._stack[this._pos]);
  }

  _restore(snapshot) {
    return snapshot.map(s => ({
      ...s,
      rootPos: s.rootPos.clone(),
      curve:   s.curve.map(p => p.clone()),
    }));
  }

  canUndo() { return this._pos > 0; }
  canRedo() { return this._pos < this._stack.length - 1; }
  get length() { return this._stack.length; }
  clear() { this._stack = []; this._pos = -1; }
}

// ─── HairGroomingSession ─────────────────────────────────────────────────
export class HairGroomingSession {
  constructor(hairSystem) {
    this.hairSystem  = hairSystem;
    this.history     = new GroomHistory();
    this.activeTool  = 'comb';
    this.brushRadius = 0.08;
    this.brushStr    = 0.50;
    this.brushFalloff= 0.60;
    this.xMirror     = true;
    this.strands     = [];
  }

  setTool(name) { this.activeTool = name; }
  setBrush(radius, strength, falloff) {
    this.brushRadius  = radius;
    this.brushStr     = strength;
    this.brushFalloff = falloff;
  }

  stroke(brushPos, extraArgs = []) {
    this.history.push(this.strands);
    const tool   = GroomTools[this.activeTool];
    if (!tool) return;
    const args   = [brushPos, this.brushRadius, this.brushStr, ...extraArgs, this.brushFalloff];
    let result   = tool(this.strands, ...args);
    if (this.xMirror) {
      result = tool(result, mirrorBrushPos(brushPos), this.brushRadius, this.brushStr, ...extraArgs, this.brushFalloff);
    }
    this.strands = result;
    this._rebuildGeometries();
  }

  undo() { const s = this.history.undo(); if (s) { this.strands = s; this._rebuildGeometries(); } }
  redo() { const s = this.history.redo(); if (s) { this.strands = s; this._rebuildGeometries(); } }

  _rebuildGeometries() {
    this.hairSystem?.emit?.('groomed', this.strands);
  }

  toJSON() {
    return { activeTool: this.activeTool, brushRadius: this.brushRadius,
      brushStr: this.brushStr, xMirror: this.xMirror, strandCount: this.strands.length };
  }
}

export default HairGroomingSession;
