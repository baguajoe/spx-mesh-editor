/**
 * WalkCycleGenerator.js — SPX Mesh Editor
 * Procedural walk cycle generator: biped/quadruped locomotion BVH output,
 * per-joint keyframes, multiple gait styles, and skeleton application.
 */
import * as THREE from 'three';

const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const sinW   = (t, phase, amp, freq = 1) => Math.sin((t * freq + phase) * Math.PI * 2) * amp;
const DEG    = Math.PI / 180;

export const BIPED_JOINTS = [
  'Hips','Spine','Spine1','Spine2','Neck','Head',
  'LeftShoulder','LeftArm','LeftForeArm','LeftHand',
  'RightShoulder','RightArm','RightForeArm','RightHand',
  'LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase',
  'RightUpLeg','RightLeg','RightFoot','RightToeBase',
];

export const GAIT_PRESETS = {
  Normal:  { stepHeight:0.12, stepLen:0.50, armSwing:0.30, hipSway:0.04, bounciness:0.03, duration:1.00 },
  Sneak:   { stepHeight:0.04, stepLen:0.30, armSwing:0.15, hipSway:0.02, bounciness:0.01, duration:1.20 },
  Jog:     { stepHeight:0.20, stepLen:0.65, armSwing:0.50, hipSway:0.05, bounciness:0.07, duration:0.55 },
  Run:     { stepHeight:0.28, stepLen:0.80, armSwing:0.65, hipSway:0.06, bounciness:0.10, duration:0.40 },
  March:   { stepHeight:0.18, stepLen:0.55, armSwing:0.40, hipSway:0.02, bounciness:0.04, duration:0.90 },
  Limp:    { stepHeight:0.06, stepLen:0.30, armSwing:0.10, hipSway:0.09, bounciness:0.02, duration:1.30 },
  Strafe:  { stepHeight:0.10, stepLen:0.35, armSwing:0.08, hipSway:0.08, bounciness:0.02, duration:0.90 },
  Crouch:  { stepHeight:0.06, stepLen:0.28, armSwing:0.20, hipSway:0.03, bounciness:0.015,duration:1.10 },
  Drunk:   { stepHeight:0.08, stepLen:0.32, armSwing:0.25, hipSway:0.14, bounciness:0.05, duration:1.50 },
  Elderly: { stepHeight:0.05, stepLen:0.22, armSwing:0.12, hipSway:0.07, bounciness:0.01, duration:1.60 },
};

export class WalkCycleGenerator {
  constructor(opts = {}) {
    this.frameRate    = opts.frameRate    ?? 30;
    this.style        = opts.style        ?? 'Normal';
    this.speed        = opts.speed        ?? 1.0;
    this.quadruped    = opts.quadruped    ?? false;
    this._applyGait(this.style);
    if (opts.stepHeight   !== undefined) this.stepHeight   = opts.stepHeight;
    if (opts.armSwing     !== undefined) this.armSwing     = opts.armSwing;
    if (opts.hipSway      !== undefined) this.hipSway      = opts.hipSway;
    if (opts.bounciness   !== undefined) this.bounciness   = opts.bounciness;
  }

  _applyGait(style) {
    const g = GAIT_PRESETS[style] ?? GAIT_PRESETS.Normal;
    this.stepHeight  = g.stepHeight;
    this.stepLen     = g.stepLen;
    this.armSwing    = g.armSwing;
    this.hipSway     = g.hipSway;
    this.bounciness  = g.bounciness;
    this.duration    = g.duration;
  }

  setStyle(style) { this.style = style; this._applyGait(style); return this; }

  // ── Per-joint evaluators ────────────────────────────────────────────────
  _hipPos(t) {
    return {
      x: sinW(t, 0,    this.hipSway,    2) * 100,
      y: 95  + Math.abs(sinW(t, 0, this.bounciness, 2)) * 100,
      z: 0,
    };
  }

  _hipRot(t) {
    return {
      x: sinW(t, 0,   2.0, 1),
      y: sinW(t, 0,   3.5, 2),
      z: sinW(t, 0.1, 1.5, 2),
    };
  }

  _spineRot(t, level = 0) {
    const phase = 0.08 + level * 0.03;
    return {
      x: sinW(t, phase, 1.5 - level * 0.2),
      y: sinW(t, phase, 2.5 - level * 0.3),
      z: sinW(t, phase, 0.8),
    };
  }

  _armRot(t, side) {
    const phase = side === 'L' ? 0.5 : 0.0;
    const swing = this.armSwing * 60;
    return {
      x: sinW(t, phase, swing),
      y: sinW(t, phase, swing * 0.12),
      z: (side === 'L' ? -1 : 1) * (6 + sinW(t, phase, 3)),
    };
  }

  _foreArmRot(t, side) {
    const phase = side === 'L' ? 0.5 : 0.0;
    return {
      x: 20 + sinW(t, phase, 12 * this.armSwing),
      y: 0, z: 0,
    };
  }

  _hipLegRot(t, side) {
    const phase = side === 'L' ? 0 : 0.5;
    return {
      x: sinW(t, phase, 25 + this.stepLen * 15),
      y: sinW(t, 0, 5, 2) * (side === 'L' ? -1 : 1),
      z: 0,
    };
  }

  _kneeBend(t, side) {
    const phase = side === 'L' ? 0 : 0.5;
    return Math.max(0, sinW(t, phase + 0.25, 28 + this.stepLen * 10));
  }

  _footRot(t, side) {
    const phase = side === 'L' ? 0 : 0.5;
    const swing = this.stepLen * 20;
    return {
      x: sinW(t, phase + 0.1, swing),
      y: 0, z: 0,
    };
  }

  _headRot(t) {
    return { x: 0, y: sinW(t, 0.1, 1.5, 2), z: 0 };
  }

  // ── Frame generation ────────────────────────────────────────────────────
  generateFrames() {
    const frameCount = Math.round(this.frameRate * this.duration);
    return Array.from({ length: frameCount }, (_, f) => {
      const t = (f / frameCount) * this.speed;
      return {
        frame: f, t,
        Hips:       { pos: this._hipPos(t), rot: this._hipRot(t) },
        Spine:      { rot: this._spineRot(t, 0) },
        Spine1:     { rot: this._spineRot(t, 1) },
        Spine2:     { rot: this._spineRot(t, 2) },
        Neck:       { rot: { x:0, y:0, z:0 } },
        Head:       { rot: this._headRot(t) },
        LeftShoulder:  { rot: { x:0, y:0, z:0 } },
        LeftArm:       { rot: this._armRot(t, 'L') },
        LeftForeArm:   { rot: this._foreArmRot(t, 'L') },
        LeftHand:      { rot: { x:0, y:0, z:0 } },
        RightShoulder: { rot: { x:0, y:0, z:0 } },
        RightArm:      { rot: this._armRot(t, 'R') },
        RightForeArm:  { rot: this._foreArmRot(t, 'R') },
        RightHand:     { rot: { x:0, y:0, z:0 } },
        LeftUpLeg:  { rot: this._hipLegRot(t, 'L') },
        LeftLeg:    { rot: { x: this._kneeBend(t,'L'), y:0, z:0 } },
        LeftFoot:   { rot: this._footRot(t, 'L') },
        LeftToeBase:{ rot: { x:0, y:0, z:0 } },
        RightUpLeg: { rot: this._hipLegRot(t, 'R') },
        RightLeg:   { rot: { x: this._kneeBend(t,'R'), y:0, z:0 } },
        RightFoot:  { rot: this._footRot(t, 'R') },
        RightToeBase:{ rot: { x:0, y:0, z:0 } },
      };
    });
  }

  // ── BVH export ──────────────────────────────────────────────────────────
  toBVH() {
    const frames = this.generateFrames();
    const fps    = this.frameRate;
    let bvh = 'HIERARCHY\n';
    bvh += 'ROOT Hips\n{\n  OFFSET 0.0 95.0 0.0\n';
    bvh += '  CHANNELS 6 Xposition Yposition Zposition Xrotation Yrotation Zrotation\n';
    bvh += '  JOINT Spine\n  {\n    OFFSET 0.0 10.0 0.0\n    CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '    JOINT LeftArm\n    {\n      OFFSET -15.0 22.0 0.0\n      CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '      JOINT LeftForeArm\n      {\n        OFFSET 0.0 -25.0 0.0\n        CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '        End Site\n        { OFFSET 0.0 -20.0 0.0 }\n      }\n    }\n';
    bvh += '    JOINT RightArm\n    {\n      OFFSET 15.0 22.0 0.0\n      CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '      JOINT RightForeArm\n      {\n        OFFSET 0.0 -25.0 0.0\n        CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '        End Site\n        { OFFSET 0.0 -20.0 0.0 }\n      }\n    }\n  }\n';
    bvh += '  JOINT LeftUpLeg\n  {\n    OFFSET -9.0 0.0 0.0\n    CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '    JOINT LeftLeg\n    {\n      OFFSET 0.0 -40.0 0.0\n      CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '      JOINT LeftFoot\n      {\n        OFFSET 0.0 -38.0 0.0\n        CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '        End Site\n        { OFFSET 0.0 -8.0 5.0 }\n      }\n    }\n  }\n';
    bvh += '  JOINT RightUpLeg\n  {\n    OFFSET 9.0 0.0 0.0\n    CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '    JOINT RightLeg\n    {\n      OFFSET 0.0 -40.0 0.0\n      CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '      JOINT RightFoot\n      {\n        OFFSET 0.0 -38.0 0.0\n        CHANNELS 3 Xrotation Yrotation Zrotation\n';
    bvh += '        End Site\n        { OFFSET 0.0 -8.0 5.0 }\n      }\n    }\n  }\n}\n';
    bvh += `MOTION\nFrames: ${frames.length}\nFrame Time: ${(1/fps).toFixed(6)}\n`;
    frames.forEach(fr => {
      const h  = fr.Hips, s = fr.Spine;
      const la = fr.LeftArm, ra = fr.RightArm;
      const lfa= fr.LeftForeArm, rfa= fr.RightForeArm;
      const ll = fr.LeftUpLeg, rl = fr.RightUpLeg;
      const lk = fr.LeftLeg,  rk = fr.RightLeg;
      const lf = fr.LeftFoot, rf = fr.RightFoot;
      const row = [
        h.pos.x.toFixed(4), h.pos.y.toFixed(4), h.pos.z.toFixed(4),
        h.rot.x.toFixed(4), h.rot.y.toFixed(4), h.rot.z.toFixed(4),
        s.rot.x.toFixed(4), s.rot.y.toFixed(4), s.rot.z.toFixed(4),
        la.rot.x.toFixed(4),la.rot.y.toFixed(4),la.rot.z.toFixed(4),
        lfa.rot.x.toFixed(4),lfa.rot.y.toFixed(4),lfa.rot.z.toFixed(4),
        ra.rot.x.toFixed(4),ra.rot.y.toFixed(4),ra.rot.z.toFixed(4),
        rfa.rot.x.toFixed(4),rfa.rot.y.toFixed(4),rfa.rot.z.toFixed(4),
        ll.rot.x.toFixed(4),ll.rot.y.toFixed(4),ll.rot.z.toFixed(4),
        lk.rot.x.toFixed(4),lk.rot.y.toFixed(4),lk.rot.z.toFixed(4),
        lf.rot.x.toFixed(4),lf.rot.y.toFixed(4),lf.rot.z.toFixed(4),
        rl.rot.x.toFixed(4),rl.rot.y.toFixed(4),rl.rot.z.toFixed(4),
        rk.rot.x.toFixed(4),rk.rot.y.toFixed(4),rk.rot.z.toFixed(4),
        rf.rot.x.toFixed(4),rf.rot.y.toFixed(4),rf.rot.z.toFixed(4),
      ];
      bvh += row.join(' ') + '\n';
    });
    return bvh;
  }

  // ── Apply to Three.js skeleton ──────────────────────────────────────────
  applyToSkeleton(skeleton, t) {
    if (!skeleton?.bones) return;
    const frame = this._evalAtT(t);
    skeleton.bones.forEach(bone => {
      const data = frame[bone.name];
      if (!data?.rot) return;
      bone.rotation.x = data.rot.x * DEG;
      bone.rotation.y = data.rot.y * DEG;
      bone.rotation.z = data.rot.z * DEG;
    });
  }

  _evalAtT(t) {
    const tNorm = ((t * this.speed) % 1 + 1) % 1;
    return {
      Hips:       { pos: this._hipPos(tNorm), rot: this._hipRot(tNorm) },
      Spine:      { rot: this._spineRot(tNorm, 0) },
      Spine1:     { rot: this._spineRot(tNorm, 1) },
      Spine2:     { rot: this._spineRot(tNorm, 2) },
      Head:       { rot: this._headRot(tNorm) },
      LeftArm:    { rot: this._armRot(tNorm, 'L') },
      RightArm:   { rot: this._armRot(tNorm, 'R') },
      LeftForeArm:  { rot: this._foreArmRot(tNorm, 'L') },
      RightForeArm: { rot: this._foreArmRot(tNorm, 'R') },
      LeftUpLeg:  { rot: this._hipLegRot(tNorm, 'L') },
      RightUpLeg: { rot: this._hipLegRot(tNorm, 'R') },
      LeftLeg:    { rot: { x: this._kneeBend(tNorm,'L'), y:0, z:0 } },
      RightLeg:   { rot: { x: this._kneeBend(tNorm,'R'), y:0, z:0 } },
      LeftFoot:   { rot: this._footRot(tNorm, 'L') },
      RightFoot:  { rot: this._footRot(tNorm, 'R') },
    };
  }

  // ── Blend between two styles ─────────────────────────────────────────────
  blendStyles(styleA, styleB, t) {
    const a = GAIT_PRESETS[styleA] ?? GAIT_PRESETS.Normal;
    const b = GAIT_PRESETS[styleB] ?? GAIT_PRESETS.Normal;
    const blend = key => a[key] + (b[key] - a[key]) * t;
    this.stepHeight  = blend('stepHeight');
    this.stepLen     = blend('stepLen');
    this.armSwing    = blend('armSwing');
    this.hipSway     = blend('hipSway');
    this.bounciness  = blend('bounciness');
    this.duration    = blend('duration');
    return this;
  }

  getFootPosition(t, side) {
    const foot = this._evalAtT(t)[side === 'L' ? 'LeftFoot' : 'RightFoot'];
    return foot?.rot ?? { x:0, y:0, z:0 };
  }

  getHipHeight(t) { return this._hipPos(t).y; }

  toJSON() {
    return { frameRate:this.frameRate, style:this.style, speed:this.speed,
      stepHeight:this.stepHeight, stepLen:this.stepLen, armSwing:this.armSwing,
      hipSway:this.hipSway, bounciness:this.bounciness, duration:this.duration };
  }
}

export default WalkCycleGenerator;
