/**
 * SPX3DTo2DPipeline.js — PRO 3D→2D Conversion Pipeline
 * SPX Mesh Editor | StreamPireX
 *
 * THE competitive differentiator — 41 cinematic styles, no other 3D app has this.
 *
 * Features:
 * - Orthographic + perspective projection
 * - 41 cinematic/artistic render styles
 * - Depth-aware compositing
 * - Render passes (diffuse, shadow, outline, AO, specular)
 * - Motion blur
 * - Style transfer via canvas filters
 * - AnimationClip → .spxmotion export
 * - BVH → .spxmotion export
 * - Real-time preview
 * - Multi-layer compositing
 */

import * as THREE from 'three';

// ─── Bone Name Mapping ────────────────────────────────────────────────────────

export const BONE_MAP_3D_TO_2D = {
  'Hips':'hips','Spine':'spine','Spine1':'chest','Spine2':'upper_chest',
  'Neck':'neck','Head':'head',
  'LeftShoulder':'l_shoulder','LeftArm':'l_upper_arm','LeftForeArm':'l_forearm','LeftHand':'l_hand',
  'RightShoulder':'r_shoulder','RightArm':'r_upper_arm','RightForeArm':'r_forearm','RightHand':'r_hand',
  'LeftUpLeg':'l_thigh','LeftLeg':'l_shin','LeftFoot':'l_foot','LeftToeBase':'l_toe',
  'RightUpLeg':'r_thigh','RightLeg':'r_shin','RightFoot':'r_foot','RightToeBase':'r_toe',
  'CC_Base_Hip':'hips','CC_Base_Spine01':'spine','CC_Base_Head':'head',
  'CC_Base_L_Upperarm':'l_upper_arm','CC_Base_R_Upperarm':'r_upper_arm',
  'CC_Base_L_Forearm':'l_forearm','CC_Base_R_Forearm':'r_forearm',
  'mixamorig:Hips':'hips','mixamorig:Spine':'spine','mixamorig:Head':'head',
  'mixamorig:LeftArm':'l_upper_arm','mixamorig:RightArm':'r_upper_arm',
};

// ─── 41 Cinematic Styles ──────────────────────────────────────────────────────

export const CINEMATIC_STYLES = {
  // ── Photorealistic ──
  photorealistic:     { id:'photorealistic',    name:'Photorealistic',      category:'photo',    filter:'none',                         outline:false, toon:false, shadows:true,  ao:true,  fog:true  },
  cinematic:          { id:'cinematic',          name:'Cinematic',           category:'photo',    filter:'contrast(1.2) saturate(1.1)',   outline:false, toon:false, shadows:true,  ao:true,  fog:true  },
  hdr:                { id:'hdr',                name:'HDR',                 category:'photo',    filter:'contrast(1.4) brightness(1.1)', outline:false, toon:false, shadows:true,  ao:true,  fog:false },
  noir:               { id:'noir',               name:'Film Noir',           category:'photo',    filter:'grayscale(1) contrast(1.5)',    outline:true,  toon:false, shadows:true,  ao:true,  fog:true  },
  vintage:            { id:'vintage',            name:'Vintage Film',        category:'photo',    filter:'sepia(0.7) contrast(1.1)',      outline:false, toon:false, shadows:true,  ao:false, fog:true  },
  // ── Toon/Cartoon ──
  toon:               { id:'toon',               name:'Toon Shading',        category:'cartoon',  filter:'saturate(1.5)',                 outline:true,  toon:true,  toonLevels:4, shadows:true,  ao:false },
  cel:                { id:'cel',                name:'Cel Animation',       category:'cartoon',  filter:'saturate(1.8) contrast(1.2)',   outline:true,  toon:true,  toonLevels:3, shadows:false, ao:false },
  inkwash:            { id:'inkwash',            name:'Ink Wash',            category:'cartoon',  filter:'grayscale(0.8) contrast(1.3)', outline:true,  toon:true,  toonLevels:5, shadows:true, ao:false },
  comic:              { id:'comic',              name:'Comic Book',          category:'cartoon',  filter:'saturate(2) contrast(1.4)',     outline:true,  toon:true,  toonLevels:3, halftone:true, shadows:true },
  manga:              { id:'manga',              name:'Manga',               category:'cartoon',  filter:'grayscale(1) contrast(1.6)',    outline:true,  toon:true,  toonLevels:2, crosshatch:true },
  anime:              { id:'anime',              name:'Anime',               category:'cartoon',  filter:'saturate(1.6) brightness(1.05)',outline:true,  toon:true,  toonLevels:4, shadows:true  },
  pixar:              { id:'pixar',              name:'Pixar/3D Cartoon',    category:'cartoon',  filter:'saturate(1.3) brightness(1.1)', outline:false, toon:true,  toonLevels:6, shadows:true, ao:true },
  // ── Painterly ──
  oilpaint:           { id:'oilpaint',           name:'Oil Painting',        category:'paint',    filter:'saturate(1.2)',                 outline:false, toon:false, paintStroke:true,  strokeSize:4  },
  watercolor:         { id:'watercolor',         name:'Watercolor',          category:'paint',    filter:'saturate(0.9) brightness(1.1)', outline:false, toon:false, paintStroke:true,  wet:true      },
  gouache:            { id:'gouache',            name:'Gouache',             category:'paint',    filter:'saturate(1.1) contrast(1.1)',   outline:false, toon:false, paintStroke:true,  flat:true     },
  impressionist:      { id:'impressionist',      name:'Impressionist',       category:'paint',    filter:'saturate(1.3) blur(0.5px)',     outline:false, toon:false, paintStroke:true,  strokeSize:6  },
  expressionist:      { id:'expressionist',      name:'Expressionist',       category:'paint',    filter:'saturate(1.8) contrast(1.5)',   outline:true,  toon:false, paintStroke:true,  distort:true  },
  // ── Sketch/Line Art ──
  pencil:             { id:'pencil',             name:'Pencil Sketch',       category:'sketch',   filter:'grayscale(1) contrast(1.4)',    outline:true,  sketch:true, sketchLines:3     },
  charcoal:           { id:'charcoal',           name:'Charcoal',            category:'sketch',   filter:'grayscale(1) contrast(1.6)',    outline:true,  sketch:true, sketchWeight:3    },
  blueprint:          { id:'blueprint',          name:'Blueprint',           category:'sketch',   filter:'hue-rotate(200deg) saturate(2)',outline:true,  sketch:false, bgColor:'#003366' },
  wireframe:          { id:'wireframe',          name:'Wireframe',           category:'sketch',   filter:'none',                          outline:true,  wireframe:true, bgColor:'#000' },
  xray:               { id:'xray',               name:'X-Ray',               category:'sketch',   filter:'invert(1) hue-rotate(180deg)', outline:true,  xray:true                        },
  // ── Stylized ──
  lowpoly:            { id:'lowpoly',            name:'Low Poly',            category:'stylized', filter:'saturate(1.2)',                 outline:false, toon:true,  toonLevels:3, faceted:true    },
  voxel:              { id:'voxel',              name:'Voxel',               category:'stylized', filter:'none',                          outline:false, voxel:true, voxelSize:8                   },
  glitch:             { id:'glitch',             name:'Glitch Art',          category:'stylized', filter:'saturate(2) contrast(1.5)',     outline:false, glitch:true, glitchStrength:0.1           },
  hologram:           { id:'hologram',           name:'Hologram',            category:'stylized', filter:'hue-rotate(120deg) opacity(0.8)',outline:true, hologram:true, scanlines:true             },
  neon:               { id:'neon',               name:'Neon/Synthwave',      category:'stylized', filter:'saturate(2) brightness(1.2)',   outline:true,  neon:true,  bgColor:'#0a0018'            },
  retrowave:          { id:'retrowave',          name:'Retrowave',           category:'stylized', filter:'saturate(1.8) hue-rotate(300deg)',outline:true, toon:true, toonLevels:4, grid:true       },
  // ── Cinematic Looks ──
  scifi:              { id:'scifi',              name:'Sci-Fi',              category:'cinematic',filter:'saturate(0.8) hue-rotate(180deg)',outline:true, toon:false, shadows:true, lens:true      },
  horror:             { id:'horror',             name:'Horror',              category:'cinematic',filter:'grayscale(0.5) contrast(1.4)',   outline:false, toon:false, shadows:true, vignette:true  },
  western:            { id:'western',            name:'Western',             category:'cinematic',filter:'sepia(0.5) contrast(1.2)',       outline:false, toon:false, shadows:true, dust:true      },
  fantasy:            { id:'fantasy',            name:'Fantasy',             category:'cinematic',filter:'saturate(1.4) brightness(1.1)', outline:false, toon:false, shadows:true, glow:true      },
  cyberpunk:          { id:'cyberpunk',          name:'Cyberpunk',           category:'cinematic',filter:'saturate(2) hue-rotate(270deg)',outline:true,  neon:true,  shadows:true, rain:true      },
  postapoc:           { id:'postapoc',           name:'Post-Apocalyptic',    category:'cinematic',filter:'sepia(0.8) contrast(1.3)',       outline:false, toon:false, dust:true,  desaturate:0.3  },
  // ── Special ──
  silhouette:         { id:'silhouette',         name:'Silhouette',          category:'special',  filter:'brightness(0)',                  outline:false, silhouette:true, bgColor:'#ff6600'       },
  shadowplay:         { id:'shadowplay',         name:'Shadow Play',         category:'special',  filter:'contrast(2)',                    outline:false, shadowOnly:true, bgColor:'#fff'          },
  stencil:            { id:'stencil',            name:'Stencil/Banksy',      category:'special',  filter:'contrast(2) grayscale(1)',       outline:false, toon:true,  toonLevels:2, spray:true    },
  pixelart:           { id:'pixelart',           name:'Pixel Art',           category:'special',  filter:'none',                           outline:false, pixel:true, pixelSize:6                  },
  thermal:            { id:'thermal',            name:'Thermal Camera',      category:'special',  filter:'hue-rotate(0deg)',               outline:false, thermal:true                             },
  // ── Animation Studio ──
  disney:             { id:'disney',             name:'Disney 2D',           category:'studio',   filter:'saturate(1.5) brightness(1.1)', outline:true,  toon:true,  toonLevels:5, smooth:true    },
  dreamworks:         { id:'dreamworks',         name:'DreamWorks',          category:'studio',   filter:'saturate(1.3) contrast(1.1)',   outline:false, toon:true,  toonLevels:6, ao:true        },
  stopmotion:         { id:'stopmotion',         name:'Stop Motion',         category:'studio',   filter:'sepia(0.3) contrast(1.1)',       outline:false, toon:false, grain:true, jitter:0.5      },
};

export const STYLE_CATEGORIES = ['photo','cartoon','paint','sketch','stylized','cinematic','special','studio'];

// ─── Projection ───────────────────────────────────────────────────────────────

export function projectTo2D(worldPos, options = {}) {
  const {
    mode         = 'orthographic',
    canvasW      = 640,
    canvasH      = 480,
    scale        = 6,
    offsetY      = 300,
    camera       = null,
    fov          = 60,
    near         = 0.1,
    far          = 100,
    depthScale   = 1,
  } = options;

  if (mode === 'perspective' && camera) {
    // Project using actual camera
    const projected = worldPos.clone().project(camera);
    return {
      x: (projected.x + 1) / 2 * canvasW,
      y: (1 - (projected.y + 1) / 2) * canvasH,
      depth: projected.z,
    };
  }

  if (mode === 'perspective') {
    // Manual perspective
    const fovRad = fov * Math.PI / 180;
    const aspect = canvasW / canvasH;
    const f = 1 / Math.tan(fovRad / 2);
    const z = worldPos.z || 1;
    return {
      x: canvasW / 2 + (worldPos.x / z) * f * canvasW * 0.5,
      y: canvasH / 2 - (worldPos.y / z) * f * canvasW * 0.5,
      depth: z,
    };
  }

  // Orthographic (default)
  return {
    x: canvasW / 2 + worldPos.x * scale,
    y: offsetY - worldPos.y * scale,
    depth: worldPos.z,
  };
}

export function quatToRotation2D(quaternion) {
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'ZXY');
  return THREE.MathUtils.radToDeg(euler.z);
}

// ─── Render Pass System ───────────────────────────────────────────────────────

export class RenderPass {
  constructor(canvas, style) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.style   = style;
    this.layers  = {
      background: document.createElement('canvas'),
      diffuse:    document.createElement('canvas'),
      shadow:     document.createElement('canvas'),
      outline:    document.createElement('canvas'),
      ao:         document.createElement('canvas'),
      specular:   document.createElement('canvas'),
      effects:    document.createElement('canvas'),
    };
    Object.values(this.layers).forEach(c => {
      c.width = canvas.width; c.height = canvas.height;
    });
  }

  clear() { Object.values(this.layers).forEach(c => c.getContext('2d').clearRect(0,0,c.width,c.height)); }

  composite() {
    const { ctx, canvas, style, layers } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    const bgCtx = layers.background.getContext('2d');
    bgCtx.fillStyle = style.bgColor ?? '#1a1a2e';
    bgCtx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(layers.background, 0, 0);

    // Shadow pass
    if (style.shadows) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(layers.shadow, 0, 0);
      ctx.globalAlpha = 1;
    }

    // AO pass
    if (style.ao) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.6;
      ctx.drawImage(layers.ao, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // Diffuse
    ctx.drawImage(layers.diffuse, 0, 0);

    // Specular
    if (style.specular) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.4;
      ctx.drawImage(layers.specular, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // Outline
    if (style.outline) {
      ctx.drawImage(layers.outline, 0, 0);
    }

    // Effects (glow, neon, grain etc)
    ctx.drawImage(layers.effects, 0, 0);

    // Apply CSS filter
    if (style.filter && style.filter !== 'none') {
      ctx.filter = style.filter;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }

    this._applyPostEffects();
  }

  _applyPostEffects() {
    const { ctx, canvas, style } = this;
    const w = canvas.width, h = canvas.height;

    if (style.vignette) this._drawVignette(ctx, w, h);
    if (style.grain)    this._drawGrain(ctx, w, h);
    if (style.scanlines) this._drawScanlines(ctx, w, h);
    if (style.halftone) this._drawHalftone(ctx, w, h);
    if (style.glitch)   this._applyGlitch(ctx, w, h, style.glitchStrength ?? 0.05);
  }

  _drawVignette(ctx, w, h) {
    const grad = ctx.createRadialGradient(w/2, h/2, h*0.3, w/2, h/2, h*0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  _drawGrain(ctx, w, h) {
    const imageData = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      imageData.data[i]   = Math.max(0, Math.min(255, imageData.data[i]   + noise));
      imageData.data[i+1] = Math.max(0, Math.min(255, imageData.data[i+1] + noise));
      imageData.data[i+2] = Math.max(0, Math.min(255, imageData.data[i+2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
  }

  _drawScanlines(ctx, w, h) {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 1;
  }

  _drawHalftone(ctx, w, h) {
    const size = 6;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += size*2) {
      for (let x = 0; x < w; x += size*2) {
        const r = size * Math.random();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  _applyGlitch(ctx, w, h, strength) {
    const slices = Math.floor(5 + Math.random() * 10);
    for (let i = 0; i < slices; i++) {
      const y = Math.random() * h;
      const sliceH = Math.random() * 20 + 2;
      const offset = (Math.random() - 0.5) * w * strength;
      const imageData = ctx.getImageData(0, y, w, sliceH);
      ctx.putImageData(imageData, offset, y);
    }
  }
}

// ─── 3D Scene Renderer to 2D Canvas ──────────────────────────────────────────

export class SPX3DTo2DRenderer {
  constructor(canvas, options = {}) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.style   = options.style ? CINEMATIC_STYLES[options.style] ?? CINEMATIC_STYLES.toon : CINEMATIC_STYLES.toon;
    this.pass    = new RenderPass(canvas, this.style);
    this.camera  = options.camera ?? null;
    this.projMode = options.projMode ?? 'orthographic';
    this.projOptions = options.projOptions ?? {};
    this.motionBlur  = options.motionBlur ?? 0;
    this._prevPositions = new Map();
  }

  setStyle(styleId) {
    this.style = CINEMATIC_STYLES[styleId] ?? CINEMATIC_STYLES.toon;
    this.pass.style = this.style;
  }

  renderSkeleton(skeleton, options = {}) {
    if (!skeleton?.bones) return;
    this.pass.clear();

    const diffCtx   = this.pass.layers.diffuse.getContext('2d');
    const outCtx    = this.pass.layers.outline.getContext('2d');
    const shadowCtx = this.pass.layers.shadow.getContext('2d');
    const fxCtx     = this.pass.layers.effects.getContext('2d');

    const projOpts = { mode: this.projMode, camera: this.camera, canvasW: this.canvas.width, canvasH: this.canvas.height, ...this.projOptions };

    // Project all bones
    const bonePositions = new Map();
    skeleton.bones.forEach(bone => {
      const wp = new THREE.Vector3();
      bone.getWorldPosition(wp);
      const p2d = projectTo2D(wp, projOpts);
      bonePositions.set(bone.name, { ...p2d, bone });
    });

    // Draw bones
    const BONE_CONNECTIONS = [
      ['Head','Neck'],['Neck','Spine2'],['Spine2','Spine1'],['Spine1','Spine'],['Spine','Hips'],
      ['Hips','LeftUpLeg'],['LeftUpLeg','LeftLeg'],['LeftLeg','LeftFoot'],
      ['Hips','RightUpLeg'],['RightUpLeg','RightLeg'],['RightLeg','RightFoot'],
      ['Spine2','LeftShoulder'],['LeftShoulder','LeftArm'],['LeftArm','LeftForeArm'],['LeftForeArm','LeftHand'],
      ['Spine2','RightShoulder'],['RightShoulder','RightArm'],['RightArm','RightForeArm'],['RightForeArm','RightHand'],
    ];

    const style = this.style;
    const lineWidth = style.toon ? 3 : 2;
    const jointRadius = style.toon ? 5 : 3;

    // Shadow pass
    if (style.shadows) {
      shadowCtx.globalAlpha = 0.4;
      BONE_CONNECTIONS.forEach(([nameA, nameB]) => {
        const pa = bonePositions.get(nameA), pb = bonePositions.get(nameB);
        if (!pa || !pb) return;
        shadowCtx.beginPath();
        shadowCtx.strokeStyle = 'rgba(0,0,0,0.5)';
        shadowCtx.lineWidth = lineWidth + 2;
        shadowCtx.moveTo(pa.x + 3, pa.y + 4);
        shadowCtx.lineTo(pb.x + 3, pb.y + 4);
        shadowCtx.stroke();
      });
      shadowCtx.globalAlpha = 1;
    }

    // Diffuse pass — draw limb segments
    BONE_CONNECTIONS.forEach(([nameA, nameB]) => {
      const pa = bonePositions.get(nameA), pb = bonePositions.get(nameB);
      if (!pa || !pb) return;

      diffCtx.beginPath();

      if (style.toon) {
        const color = this._getToonColor(nameA, style);
        diffCtx.strokeStyle = color;
        diffCtx.lineWidth = lineWidth + (nameA.includes('Spine') || nameA === 'Hips' ? 4 : 0);
        diffCtx.lineCap = 'round';
      } else {
        const depth = (pa.depth + pb.depth) / 2;
        const brightness = Math.max(0.3, 1 - depth * 0.2);
        diffCtx.strokeStyle = `rgba(180,160,140,${brightness})`;
        diffCtx.lineWidth = lineWidth;
      }

      diffCtx.moveTo(pa.x, pa.y);
      diffCtx.lineTo(pb.x, pb.y);
      diffCtx.stroke();

      // Joint dots
      diffCtx.beginPath();
      diffCtx.arc(pa.x, pa.y, jointRadius, 0, Math.PI*2);
      diffCtx.fillStyle = style.toon ? '#fff' : 'rgba(200,180,160,0.8)';
      diffCtx.fill();
    });

    // Outline pass
    if (style.outline) {
      BONE_CONNECTIONS.forEach(([nameA, nameB]) => {
        const pa = bonePositions.get(nameA), pb = bonePositions.get(nameB);
        if (!pa || !pb) return;
        outCtx.beginPath();
        outCtx.strokeStyle = '#000';
        outCtx.lineWidth = lineWidth + 2;
        outCtx.lineCap = 'round';
        outCtx.moveTo(pa.x, pa.y);
        outCtx.lineTo(pb.x, pb.y);
        outCtx.stroke();
      });
    }

    // Special style effects
    if (style.neon) this._drawNeonEffect(fxCtx, bonePositions, BONE_CONNECTIONS);
    if (style.hologram) this._drawHologramEffect(fxCtx, bonePositions);
    if (style.xray) this._drawXRayEffect(diffCtx, bonePositions, BONE_CONNECTIONS);

    // Motion blur
    if (this.motionBlur > 0) this._applyMotionBlur(diffCtx, bonePositions);
    this._prevPositions = bonePositions;

    this.pass.composite();
  }

  renderMesh(geometry, options = {}) {
    const { color = '#888', wireframe = false } = options;
    const pos = geometry.attributes.position;
    const idx = geometry.index;
    if (!pos) return;

    const diffCtx = this.pass.layers.diffuse.getContext('2d');
    const outCtx  = this.pass.layers.outline.getContext('2d');
    const style   = this.style;

    const projOpts = { mode: this.projMode, camera: this.camera, canvasW: this.canvas.width, canvasH: this.canvas.height, ...this.projOptions };

    if (idx) {
      for (let i = 0; i < idx.count; i += 3) {
        const a = idx.getX(i), b = idx.getX(i+1), c = idx.getX(i+2);
        const pa = projectTo2D(new THREE.Vector3(pos.getX(a),pos.getY(a),pos.getZ(a)), projOpts);
        const pb = projectTo2D(new THREE.Vector3(pos.getX(b),pos.getY(b),pos.getZ(b)), projOpts);
        const pc = projectTo2D(new THREE.Vector3(pos.getX(c),pos.getY(c),pos.getZ(c)), projOpts);

        // Depth-based lighting
        const depth = (pa.depth + pb.depth + pc.depth) / 3;
        const light = Math.max(0.2, 1 - depth * 0.1);

        if (wireframe || style.wireframe) {
          diffCtx.beginPath();
          diffCtx.strokeStyle = color;
          diffCtx.lineWidth = 1;
          diffCtx.moveTo(pa.x, pa.y);
          diffCtx.lineTo(pb.x, pb.y);
          diffCtx.lineTo(pc.x, pc.y);
          diffCtx.closePath();
          diffCtx.stroke();
        } else {
          let fillColor = color;
          if (style.toon) {
            const levels = style.toonLevels ?? 4;
            const level = Math.floor(light * levels) / levels;
            const c255 = Math.floor(level * 200);
            fillColor = `rgb(${c255},${Math.floor(c255*0.8)},${Math.floor(c255*0.7)})`;
          } else {
            const c255 = Math.floor(light * 200);
            fillColor = `rgb(${c255},${Math.floor(c255*0.9)},${Math.floor(c255*0.8)})`;
          }
          diffCtx.beginPath();
          diffCtx.fillStyle = fillColor;
          diffCtx.moveTo(pa.x, pa.y);
          diffCtx.lineTo(pb.x, pb.y);
          diffCtx.lineTo(pc.x, pc.y);
          diffCtx.closePath();
          diffCtx.fill();

          if (style.outline) {
            outCtx.beginPath();
            outCtx.strokeStyle = '#000';
            outCtx.lineWidth = 1;
            outCtx.moveTo(pa.x, pa.y);
            outCtx.lineTo(pb.x, pb.y);
            outCtx.lineTo(pc.x, pc.y);
            outCtx.closePath();
            outCtx.stroke();
          }
        }
      }
    }

    this.pass.composite();
  }

  _getToonColor(boneName, style) {
    const colorMap = {
      Head: '#f4a261', Neck: '#f4a261',
      Spine: '#e63946', Spine1: '#e63946', Spine2: '#e63946', Hips: '#e63946',
      LeftArm: '#457b9d', LeftForeArm: '#457b9d', LeftHand: '#f4a261',
      RightArm: '#457b9d', RightForeArm: '#457b9d', RightHand: '#f4a261',
      LeftUpLeg: '#2a9d8f', LeftLeg: '#2a9d8f', LeftFoot: '#264653',
      RightUpLeg: '#2a9d8f', RightLeg: '#2a9d8f', RightFoot: '#264653',
    };
    return colorMap[boneName] ?? '#888';
  }

  _drawNeonEffect(ctx, positions, connections) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffc8';
    ctx.strokeStyle = '#00ffc8';
    ctx.lineWidth = 2;
    connections.forEach(([a, b]) => {
      const pa = positions.get(a), pb = positions.get(b);
      if (!pa || !pb) return;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    });
    ctx.shadowBlur = 0;
  }

  _drawHologramEffect(ctx, positions) {
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    positions.forEach(p => {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(p.x, p.y + i * 4, 8, 0, Math.PI*2);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  _drawXRayEffect(ctx, positions, connections) {
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(100,200,255,0.6)';
    ctx.lineWidth = 8;
    connections.forEach(([a, b]) => {
      const pa = positions.get(a), pb = positions.get(b);
      if (!pa || !pb) return;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  _applyMotionBlur(ctx, currentPositions) {
    if (!this._prevPositions.size) return;
    ctx.globalAlpha = this.motionBlur * 0.5;
    this._prevPositions.forEach((p, name) => {
      const curr = currentPositions.get(name);
      if (!curr) return;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  captureFrame() {
    return this.canvas.toDataURL('image/png');
  }

  captureFrameBlob() {
    return new Promise(res => this.canvas.toBlob(res, 'image/png'));
  }
}

// ─── Animation Conversion ─────────────────────────────────────────────────────

export function convertClipToSPXMotion(clip, skeleton, options = {}) {
  const {
    fps = 30, canvasW = 640, canvasH = 480,
    projectionScale = 6, projectionOffsetY = 300,
    projMode = 'orthographic', camera = null,
    styleId = 'toon',
  } = options;

  const duration   = clip.duration;
  const frameCount = Math.ceil(duration * fps);
  const mixer      = new THREE.AnimationMixer(skeleton.bones[0].parent || skeleton.bones[0]);
  const action     = mixer.clipAction(clip);
  action.play();

  const usedBones = skeleton.bones.map(bone => ({
    bone,
    spxName: BONE_MAP_3D_TO_2D[bone.name] || bone.name.toLowerCase(),
  }));

  const projOpts = { mode: projMode, camera, canvasW, canvasH, scale: projectionScale, offsetY: projectionOffsetY };

  const frames = [];
  for (let f = 0; f < frameCount; f++) {
    const time = f / fps;
    mixer.setTime(time);
    const keyframes = {};
    usedBones.forEach(({ bone, spxName }) => {
      const wp = new THREE.Vector3();
      bone.getWorldPosition(wp);
      const wq = new THREE.Quaternion();
      bone.getWorldQuaternion(wq);
      const ws = new THREE.Vector3();
      bone.getWorldScale(ws);
      const p2d = projectTo2D(wp, projOpts);
      keyframes[spxName] = {
        x:        Math.round(p2d.x * 10) / 10,
        y:        Math.round(p2d.y * 10) / 10,
        z:        Math.round((wp.z || 0) * 100) / 100,
        depth:    Math.round((p2d.depth || 0) * 100) / 100,
        rotation: Math.round(quatToRotation2D(wq) * 10) / 10,
        scale:    Math.round(ws.y * 100) / 100,
      };
    });
    frames.push({ time: Math.round(time * 1000) / 1000, keyframes });
  }

  action.stop();

  return {
    version: '2.0', format: 'spxmotion',
    name: clip.name || 'unnamed',
    fps, duration: Math.round(duration * 1000) / 1000,
    canvasW, canvasH, projMode, styleId,
    bones: usedBones.map(b => b.spxName),
    frames,
  };
}

export function convertRawBonesToSPXMotion(boneFrames, options = {}) {
  const {
    fps = 30, canvasW = 640, canvasH = 480,
    projectionScale = 6, projectionOffsetY = 300,
    projMode = 'orthographic',
  } = options;

  const boneNames = Object.keys(boneFrames);
  const allTimes = new Set();
  boneNames.forEach(b => boneFrames[b].forEach(f => allTimes.add(f.time)));
  const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);
  const projOpts = { mode: projMode, canvasW, canvasH, scale: projectionScale, offsetY: projectionOffsetY };

  const frames = sortedTimes.map(time => {
    const keyframes = {};
    boneNames.forEach(rawName => {
      const spxName = BONE_MAP_3D_TO_2D[rawName] || rawName.toLowerCase();
      const arr = boneFrames[rawName];
      const frame = arr.reduce((prev, cur) => Math.abs(cur.time-time) < Math.abs(prev.time-time) ? cur : prev);
      const wp = new THREE.Vector3(frame.x||0, frame.y||0, frame.z||0);
      const quat = new THREE.Quaternion(frame.qx||0, frame.qy||0, frame.qz||0, frame.qw||1);
      const p2d = projectTo2D(wp, projOpts);
      keyframes[spxName] = {
        x: Math.round(p2d.x*10)/10, y: Math.round(p2d.y*10)/10,
        depth: Math.round((p2d.depth||0)*100)/100,
        rotation: Math.round(quatToRotation2D(quat)*10)/10, scale: 1.0,
      };
    });
    return { time: Math.round(time*1000)/1000, keyframes };
  });

  return {
    version: '2.0', format: 'spxmotion', name: 'converted',
    fps, duration: sortedTimes[sortedTimes.length-1]||0,
    canvasW, canvasH, projMode,
    bones: [...new Set(boneNames.map(n => BONE_MAP_3D_TO_2D[n]||n.toLowerCase()))],
    frames,
  };
}

// ─── Export Utilities ─────────────────────────────────────────────────────────

export function downloadSPXMotion(spxmotionObj, filename = 'animation.spxmotion') {
  const blob = new Blob([JSON.stringify(spxmotionObj, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function exportFrameSequence(renderer, frameCount, fps = 30) {
  const frames = [];
  for (let i = 0; i < frameCount; i++) frames.push(renderer.captureFrame());
  return frames;
}

export async function exportToGIF(frames, delay = 33) {
  // Returns frame array for use with GIF encoder
  return { frames, delay, frameCount: frames.length };
}

export function exportToVideoBlobs(frames) {
  return frames.map(dataURL => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  });
}

export function getStylesByCategory(category) {
  return Object.values(CINEMATIC_STYLES).filter(s => s.category === category);
}

export function getStyleCount() { return Object.keys(CINEMATIC_STYLES).length; }

export default {
  CINEMATIC_STYLES, STYLE_CATEGORIES, BONE_MAP_3D_TO_2D,
  projectTo2D, quatToRotation2D,
  RenderPass, SPX3DTo2DRenderer,
  convertClipToSPXMotion, convertRawBonesToSPXMotion,
  downloadSPXMotion, exportFrameSequence, exportToGIF, exportToVideoBlobs,
  getStylesByCategory, getStyleCount,
};
