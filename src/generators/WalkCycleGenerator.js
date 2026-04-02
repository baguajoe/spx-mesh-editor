/**
 * WalkCycleGenerator.js — SPX Mesh Editor
 * Procedural walk cycle generator for biped/quadruped rigs. Outputs BVH data and per-frame bone rotations.
 */
import * as THREE from 'three';\n\nconst clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));\nconst lerp  = (a, b, t)   => a + (b - a) * t;\nconst rand  = (lo, hi)    => lo + Math.random() * (hi - lo);\nconst TWO_PI = Math.PI * 2;\n\n\nconst DEG = Math.PI / 180;\n\nfunction sinW(t, phase, amp, freq = 1) {\n  return Math.sin((t * freq + phase) * Math.PI * 2) * amp;\n}\n\nconst BIPED_JOINTS = [\n  'Hips','Spine','Spine1','Spine2','Neck','Head',\n  'LeftShoulder','LeftArm','LeftForeArm','LeftHand',\n  'RightShoulder','RightArm','RightForeArm','RightHand',\n  'LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase',\n  'RightUpLeg','RightLeg','RightFoot','RightToeBase',\n];\n\nexport class WalkCycleGenerator {\n  constructor(opts = {}) {\n    this.frameRate    = opts.frameRate    ?? 30;\n    this.duration     = opts.duration     ?? 1.0;\n    this.stepHeight   = opts.stepHeight   ?? 0.12;\n    this.stepLen      = opts.stepLen      ?? 0.50;\n    this.armSwing     = opts.armSwing     ?? 0.30;\n    this.hipSway      = opts.hipSway      ?? 0.04;\n    this.bounciness   = opts.bounciness   ?? 0.03;\n    this.speed        = opts.speed        ?? 1.0;\n    this.style        = opts.style        ?? 'Normal';\n    this.quadruped    = opts.quadruped    ?? false;\n  }\n\n  _hipPos(t) {\n    return {\n      x: sinW(t, 0, this.hipSway, 2),\n      y: 0.95 + Math.abs(sinW(t, 0, this.bounciness, 2)),\n      z: 0,\n    };\n  }\n\n  _footPos(t, side) {\n    const phase = side === 'L' ? 0 : 0.5;\n    const lift  = Math.max(0, sinW(t, phase, 1, 1));\n    return {\n      x: side === 'L' ? -0.10 : 0.10,\n      y: lift * this.stepHeight,\n      z: sinW(t, phase, this.stepLen * 0.5, 1),\n    };\n  }\n\n  _spineRot(t) {\n    return {\n      x: sinW(t, 0.12, 2.5),\n      y: sinW(t, 0,    3.0),\n      z: sinW(t, 0,    1.5) * 0.5,\n    };\n  }\n\n  _armRot(t, side) {\n    const phase = side === 'L' ? 0.5 : 0.0;\n    const swing = this.armSwing * 60;\n    return {\n      x: sinW(t, phase, swing),\n      y: sinW(t, phase, swing * 0.15),\n      z: side === 'L' ? -6 : 6,\n    };\n  }\n\n  _kneeAngle(t, side) {\n    const phase = side === 'L' ? 0 : 0.5;\n    return Math.max(0, sinW(t, phase + 0.25, 25, 1));\n  }\n\n  _hipRot(t, side) {\n    const phase = side === 'L' ? 0 : 0.5;\n    return {\n      x: sinW(t, phase, 18, 1),\n      y: sinW(t, 0,      5, 2) * (side === 'L' ? -1 : 1),\n      z: 0,\n    };\n  }\n\n  generateFrames() {\n    const frames = Math.round(this.frameRate * this.duration);\n    return Array.from({ length: frames }, (_, f) => {\n      const t = (f / frames) * this.speed;\n      return {\n        frame:  f,\n        t,\n        hip:    this._hipPos(t),\n        footL:  this._footPos(t, 'L'),\n        footR:  this._footPos(t, 'R'),\n        spine:  this._spineRot(t),\n        armL:   this._armRot(t, 'L'),\n        armR:   this._armRot(t, 'R'),\n        kneeL:  this._kneeAngle(t, 'L'),\n        kneeR:  this._kneeAngle(t, 'R'),\n        hipRotL: this._hipRot(t, 'L'),\n        hipRotR: this._hipRot(t, 'R'),\n      };\n    });\n  }\n\n  toBVH() {\n    const frames = this.generateFrames();\n    const fps    = this.frameRate;\n    let bvh  = `HIERARCHY\\nROOT Hips\\n{\\n  OFFSET 0.0 95.0 0.0\\n`;\n    bvh += `  CHANNELS 6 Xposition Yposition Zposition Xrotation Yrotation Zrotation\\n`;\n    bvh += `  JOINT Spine\\n  {\\n    OFFSET 0.0 10.0 0.0\\n    CHANNELS 3 Xrotation Yrotation Zrotation\\n`;\n    bvh += `    JOINT LeftArm\\n    {\\n      OFFSET -15.0 0.0 0.0\\n      CHANNELS 3 Xrotation Yrotation Zrotation\\n      End Site\\n      { OFFSET 0.0 -25.0 0.0 }\\n    }\\n`;\n    bvh += `    JOINT RightArm\\n    {\\n      OFFSET 15.0 0.0 0.0\\n      CHANNELS 3 Xrotation Yrotation Zrotation\\n      End Site\\n      { OFFSET 0.0 -25.0 0.0 }\\n    }\\n`;\n    bvh += `  }\\n  JOINT LeftUpLeg\\n  {\\n    OFFSET -9.0 0.0 0.0\\n    CHANNELS 3 Xrotation Yrotation Zrotation\\n    End Site\\n    { OFFSET 0.0 -40.0 0.0 }\\n  }\\n`;\n    bvh += `  JOINT RightUpLeg\\n  {\\n    OFFSET 9.0 0.0 0.0\\n    CHANNELS 3 Xrotation Yrotation Zrotation\\n    End Site\\n    { OFFSET 0.0 -40.0 0.0 }\\n  }\\n}\\n`;\n    bvh += `MOTION\\nFrames: ${frames.length}\\nFrame Time: ${(1 / fps).toFixed(6)}\\n`;\n    frames.forEach(fr => {\n      const h = fr.hip, s = fr.spine;\n      const la = fr.armL, ra = fr.armR;\n      const ll = fr.hipRotL, rl = fr.hipRotR;\n      bvh += [\n        (h.x * 100).toFixed(4), (h.y * 100).toFixed(4), (h.z * 100).toFixed(4),\n        s.x.toFixed(4), s.y.toFixed(4), s.z.toFixed(4),\n        la.x.toFixed(4), la.y.toFixed(4), la.z.toFixed(4),\n        ra.x.toFixed(4), ra.y.toFixed(4), ra.z.toFixed(4),\n        ll.x.toFixed(4), ll.y.toFixed(4), ll.z.toFixed(4),\n        rl.x.toFixed(4), rl.y.toFixed(4), rl.z.toFixed(4),\n      ].join(' ') + '\n';\n    });\n    return bvh;\n  }\n\n  applyToSkeleton(skeleton, t) {\n    if (!skeleton?.bones) return;\n    const spine = this._spineRot(t);\n    const armL  = this._armRot(t, 'L');\n    const armR  = this._armRot(t, 'R');\n    skeleton.bones.forEach(bone => {\n      if (bone.name.includes('Spine')) {\n        bone.rotation.x = spine.x * DEG;\n        bone.rotation.y = spine.y * DEG;\n      }\n      if (bone.name.includes('LeftArm') || (bone.name.includes('Left') && bone.name.includes('Arm')))\n        bone.rotation.x = armL.x * DEG;\n      if (bone.name.includes('RightArm') || (bone.name.includes('Right') && bone.name.includes('Arm')))\n        bone.rotation.x = armR.x * DEG;\n    });\n  }\n\n  setStyle(style) {\n    this.style = style;\n    switch (style) {\n      case 'Sneak':   this.stepHeight = 0.04; this.hipSway = 0.02; this.bounciness = 0.01; this.armSwing = 0.15; break;\n      case 'Jog':     this.stepHeight = 0.20; this.armSwing = 0.50; this.bounciness = 0.07; this.duration = 0.55; break;\n      case 'Run':     this.stepHeight = 0.28; this.armSwing = 0.65; this.bounciness = 0.10; this.duration = 0.40; break;\n      case 'March':   this.stepHeight = 0.18; this.armSwing = 0.40; this.hipSway = 0.02; break;\n      case 'Limp':    this.stepHeight = 0.06; this.hipSway = 0.09; this.armSwing = 0.10; break;\n      case 'Strafe':  this.armSwing   = 0.08; this.hipSway = 0.08; break;\n      case 'Crouch':  this.stepHeight = 0.06; this.bounciness = 0.015; this.armSwing = 0.2; break;
      default:        this.stepHeight = 0.12; this.armSwing = 0.30; this.bounciness = 0.03; this.duration = 1.0;
    }
    return this;
  }

  toJSON() {
    return { frameRate: this.frameRate, duration: this.duration, stepHeight: this.stepHeight,
      stepLen: this.stepLen, armSwing: this.armSwing, hipSway: this.hipSway,
      bounciness: this.bounciness, speed: this.speed, style: this.style };
  }
}

export default WalkCycleGenerator;
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
//
//
//
// ──────────────────────────────────────────────────────────────────────────
//
//
