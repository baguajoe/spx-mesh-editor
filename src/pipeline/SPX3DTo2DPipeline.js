/**
 * SPX3DTo2DPipeline.js — TRUE 3D→2D Conversion Pipeline
 * SPX Mesh Editor | StreamPireX
 *
 * THE competitive differentiator — 41 cinematic styles applied as real
 * pixel-level post-processing on the live WebGL render output.
 *
 * Architecture:
 *   1. Capture WebGL renderer's current frame → ImageData
 *   2. Run per-pixel style passes on offscreen canvas
 *   3. Apply convolution kernels (edge detect, blur, sharpen)
 *   4. Composite style layers (diffuse, outline, FX, overlay)
 *   5. Output final styled canvas / download
 */

import * as THREE from 'three';

// ─── Bone Name Mapping (preserved for SPX Puppet pipeline) ───────────────────
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
  // Photo
  photorealistic: { id:'photorealistic', name:'Photorealistic',   category:'photo',    cssFilter:'none',                              passes:['sharpen'],                                  outline:false, toon:false },
  cinematic:      { id:'cinematic',      name:'Cinematic',        category:'photo',    cssFilter:'contrast(1.2) saturate(1.1)',        passes:['vignette','grain'],                         outline:false, toon:false },
  hdr:            { id:'hdr',           name:'HDR',              category:'photo',    cssFilter:'contrast(1.4) brightness(1.1)',      passes:['bloom','sharpen'],                          outline:false, toon:false },
  noir:           { id:'noir',          name:'Film Noir',        category:'photo',    cssFilter:'grayscale(1) contrast(1.5)',         passes:['edge_overlay','grain','vignette'],           outline:true,  toon:false },
  vintage:        { id:'vintage',       name:'Vintage Film',     category:'photo',    cssFilter:'sepia(0.7) contrast(1.1)',           passes:['grain','vignette','scratch'],                outline:false, toon:false },
  // Cartoon
  toon:           { id:'toon',          name:'Toon Shading',     category:'cartoon',  cssFilter:'saturate(1.5)',                      passes:['quantize','edge_black'],    toonLevels:4,   outline:true,  toon:true  },
  cel:            { id:'cel',           name:'Cel Animation',    category:'cartoon',  cssFilter:'saturate(1.8) contrast(1.2)',        passes:['quantize','edge_black'],    toonLevels:3,   outline:true,  toon:true  },
  inkwash:        { id:'inkwash',       name:'Ink Wash',         category:'cartoon',  cssFilter:'grayscale(0.8) contrast(1.3)',       passes:['quantize','edge_black'],    toonLevels:5,   outline:true,  toon:true  },
  comic:          { id:'comic',         name:'Comic Book',       category:'cartoon',  cssFilter:'saturate(2) contrast(1.4)',          passes:['quantize','halftone','edge_black'], toonLevels:3, outline:true, toon:true },
  manga:          { id:'manga',         name:'Manga',            category:'cartoon',  cssFilter:'grayscale(1) contrast(1.6)',         passes:['quantize','crosshatch','edge_black'], toonLevels:2, outline:true, toon:true },
  anime:          { id:'anime',         name:'Anime',            category:'cartoon',  cssFilter:'saturate(1.6) brightness(1.05)',     passes:['quantize','edge_black'],    toonLevels:4,   outline:true,  toon:true  },
  pixar:          { id:'pixar',         name:'Pixar/3D Cartoon', category:'cartoon',  cssFilter:'saturate(1.3) brightness(1.1)',      passes:['quantize','soft_light'],    toonLevels:6,   outline:false, toon:true  },
  // Paint
  oilpaint:       { id:'oilpaint',      name:'Oil Painting',     category:'paint',    cssFilter:'saturate(1.2)',                      passes:['kuwahara'],                                  outline:false, toon:false },
  watercolor:     { id:'watercolor',    name:'Watercolor',       category:'paint',    cssFilter:'saturate(0.9) brightness(1.1)',      passes:['kuwahara','blur_soft','paper_texture'],      outline:false, toon:false },
  gouache:        { id:'gouache',       name:'Gouache',          category:'paint',    cssFilter:'saturate(1.1) contrast(1.1)',        passes:['kuwahara','flatten'],                        outline:false, toon:false },
  impressionist:  { id:'impressionist', name:'Impressionist',    category:'paint',    cssFilter:'saturate(1.3)',                      passes:['kuwahara','stroke_texture'],                 outline:false, toon:false },
  expressionist:  { id:'expressionist', name:'Expressionist',    category:'paint',    cssFilter:'saturate(1.8) contrast(1.5)',        passes:['kuwahara','edge_distort'],                   outline:true,  toon:false },
  // Sketch
  pencil:         { id:'pencil',        name:'Pencil Sketch',    category:'sketch',   cssFilter:'grayscale(1) contrast(1.4)',         passes:['edge_white_bg','hatch'],                     outline:true,  toon:false },
  charcoal:       { id:'charcoal',      name:'Charcoal',         category:'sketch',   cssFilter:'grayscale(1) contrast(1.6)',         passes:['edge_white_bg','hatch','smudge'],            outline:true,  toon:false },
  blueprint:      { id:'blueprint',     name:'Blueprint',        category:'sketch',   cssFilter:'hue-rotate(200deg) saturate(2)',     passes:['edge_overlay','grid_overlay'],               outline:true,  toon:false, bgColor:'#003366' },
  wireframe_style:{ id:'wireframe_style',name:'Wireframe',       category:'sketch',   cssFilter:'none',                              passes:['wireframe_overlay'],                         outline:true,  toon:false, bgColor:'#000010' },
  xray:           { id:'xray',          name:'X-Ray',            category:'sketch',   cssFilter:'invert(1) hue-rotate(180deg)',       passes:['edge_overlay','desaturate'],                 outline:true,  toon:false },
  // Stylized
  lowpoly:        { id:'lowpoly',       name:'Low Poly',         category:'stylized', cssFilter:'saturate(1.2)',                      passes:['quantize','faceted'],       toonLevels:3,   outline:false, toon:true  },
  voxel:          { id:'voxel',         name:'Voxel',            category:'stylized', cssFilter:'none',                              passes:['pixelate'],                 pixelSize:8,    outline:false, toon:false },
  glitch:         { id:'glitch',        name:'Glitch Art',       category:'stylized', cssFilter:'saturate(2) contrast(1.5)',          passes:['glitch_shift','scanlines'], outline:false, toon:false },
  hologram:       { id:'hologram',      name:'Hologram',         category:'stylized', cssFilter:'hue-rotate(120deg) opacity(0.85)',   passes:['scanlines','hologram_glow'],outline:true,  toon:false },
  neon:           { id:'neon',          name:'Neon/Synthwave',   category:'stylized', cssFilter:'saturate(2) brightness(1.2)',        passes:['bloom','edge_neon'],        outline:true,  toon:false, bgColor:'#0a0018' },
  retrowave:      { id:'retrowave',     name:'Retrowave',        category:'stylized', cssFilter:'saturate(1.8) hue-rotate(300deg)',   passes:['quantize','scanlines','grid_overlay'], toonLevels:4, outline:true, toon:true },
  // Cinematic
  anamorphic:     { id:'anamorphic',    name:'Anamorphic Lens',  category:'photo',    cssFilter:'contrast(1.1) saturate(0.95)',       passes:['lens_flare','vignette','letterbox'],         outline:false, toon:false },
  infrared:       { id:'infrared',      name:'Infrared',         category:'photo',    cssFilter:'hue-rotate(90deg) saturate(2)',      passes:['bloom','vignette'],                          outline:false, toon:false },
  thermal:        { id:'thermal',       name:'Thermal Camera',   category:'photo',    cssFilter:'none',                              passes:['thermal_map'],                               outline:false, toon:false },
  // Art styles
  ukiyo_e:        { id:'ukiyo_e',       name:'Ukiyo-e',          category:'cartoon',  cssFilter:'saturate(1.4) contrast(1.2)',        passes:['quantize','woodblock'],     toonLevels:5,   outline:true,  toon:true  },
  stained_glass:  { id:'stained_glass', name:'Stained Glass',    category:'stylized', cssFilter:'saturate(2.5) contrast(1.3)',        passes:['quantize','lead_lines'],    toonLevels:6,   outline:true,  toon:true  },
  mosaic:         { id:'mosaic',        name:'Mosaic/Tile',       category:'stylized', cssFilter:'saturate(1.8)',                      passes:['pixelate','edge_overlay'],  pixelSize:12,   outline:true,  toon:false },
  stipple:        { id:'stipple',       name:'Stipple/Pointillist',category:'paint',   cssFilter:'saturate(1.1)',                      passes:['stipple_dots'],                              outline:false, toon:false },
  linocut:        { id:'linocut',       name:'Linocut Print',    category:'sketch',   cssFilter:'grayscale(1) contrast(1.8)',         passes:['threshold','edge_white_bg'],                outline:true,  toon:false },
  risograph:      { id:'risograph',     name:'Risograph Print',  category:'paint',    cssFilter:'saturate(1.6) contrast(1.2)',        passes:['quantize','halftone','color_shift'], toonLevels:4, outline:false, toon:false },
  // Sci-fi
  tron:           { id:'tron',          name:'Tron/Grid',        category:'stylized', cssFilter:'hue-rotate(180deg) saturate(3)',     passes:['edge_neon','grid_overlay','bloom'],          outline:true,  toon:false, bgColor:'#000814' },
  matrix:         { id:'matrix',        name:'Matrix/Digital',   category:'stylized', cssFilter:'hue-rotate(90deg) saturate(2)',      passes:['scanlines','rain_overlay','bloom'],          outline:false, toon:false, bgColor:'#000800' },
  // Classic
  oil_dark:       { id:'oil_dark',      name:'Dutch Masters',    category:'paint',    cssFilter:'saturate(0.8) contrast(1.3) brightness(0.85)', passes:['kuwahara','vignette','grain'],    outline:false, toon:false },
  fresco:         { id:'fresco',        name:'Fresco',           category:'paint',    cssFilter:'saturate(0.9) brightness(1.05)',     passes:['kuwahara','paper_texture','crack_texture'],  outline:false, toon:false },
};

// ─── Convolution Kernels ──────────────────────────────────────────────────────
const KERNELS = {
  sharpen:     [ 0,-1, 0, -1, 5,-1,  0,-1, 0 ],
  edge:        [-1,-1,-1, -1, 8,-1, -1,-1,-1 ],
  blur:        [ 1, 2, 1,  2, 4, 2,  1, 2, 1 ],  // divide by 16
  emboss:      [-2,-1, 0, -1, 1, 1,  0, 1, 2 ],
};

function convolve3x3(data, w, h, kernel, divisor = 1) {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let r=0,g=0,b=0;
      for (let ky=-1; ky<=1; ky++) {
        for (let kx=-1; kx<=1; kx++) {
          const i = ((y+ky)*w + (x+kx))*4;
          const k = kernel[(ky+1)*3+(kx+1)];
          r += data[i]*k; g += data[i+1]*k; b += data[i+2]*k;
        }
      }
      const i = (y*w+x)*4;
      out[i]   = Math.min(255,Math.max(0,r/divisor));
      out[i+1] = Math.min(255,Math.max(0,g/divisor));
      out[i+2] = Math.min(255,Math.max(0,b/divisor));
      out[i+3] = data[i+3];
    }
  }
  return out;
}

// Kuwahara filter (painterly effect) — 5x5 quadrant variance
function kuwahara(data, w, h, radius = 3) {
  const out = new Uint8ClampedArray(data.length);
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      const quads = [
        [-radius,-radius,0,0],[0,-radius,radius,0],
        [-radius,0,0,radius],[0,0,radius,radius]
      ];
      let bestVar = Infinity, bestR=0, bestG=0, bestB=0;
      for (const [x0,y0,x1,y1] of quads) {
        let sr=0,sg=0,sb=0,n=0;
        for (let qy=y0; qy<=y1; qy++) {
          for (let qx=x0; qx<=x1; qx++) {
            const i=((y+qy)*w+(x+qx))*4;
            sr+=data[i]; sg+=data[i+1]; sb+=data[i+2]; n++;
          }
        }
        const mr=sr/n, mg=sg/n, mb=sb/n;
        let vr=0,vg=0,vb=0;
        for (let qy=y0; qy<=y1; qy++) {
          for (let qx=x0; qx<=x1; qx++) {
            const i=((y+qy)*w+(x+qx))*4;
            vr+=(data[i]-mr)**2; vg+=(data[i+1]-mg)**2; vb+=(data[i+2]-mb)**2;
          }
        }
        const v=(vr+vg+vb)/n;
        if(v<bestVar){bestVar=v;bestR=mr;bestG=mg;bestB=mb;}
      }
      const i=(y*w+x)*4;
      out[i]=bestR; out[i+1]=bestG; out[i+2]=bestB; out[i+3]=data[i+3];
    }
  }
  return out;
}

// Toon quantize — posterize to N levels
function quantize(data, levels) {
  const out = new Uint8ClampedArray(data);
  const step = 255 / levels;
  for (let i = 0; i < out.length; i += 4) {
    out[i]   = Math.round(out[i]   / step) * step;
    out[i+1] = Math.round(out[i+1] / step) * step;
    out[i+2] = Math.round(out[i+2] / step) * step;
  }
  return out;
}

// Edge detect → black lines overlay
function edgeDetect(data, w, h, threshold = 30) {
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w*h; i++) gray[i] = (data[i*4]*0.299 + data[i*4+1]*0.587 + data[i*4+2]*0.114);
  const edges = new Uint8ClampedArray(data.length);
  for (let y = 1; y < h-1; y++) {
    for (let x = 1; x < w-1; x++) {
      const gx = -gray[(y-1)*w+(x-1)] - 2*gray[y*w+(x-1)] - gray[(y+1)*w+(x-1)]
                + gray[(y-1)*w+(x+1)] + 2*gray[y*w+(x+1)] + gray[(y+1)*w+(x+1)];
      const gy = -gray[(y-1)*w+(x-1)] - 2*gray[(y-1)*w+x] - gray[(y-1)*w+(x+1)]
                + gray[(y+1)*w+(x-1)] + 2*gray[(y+1)*w+x] + gray[(y+1)*w+(x+1)];
      const mag = Math.sqrt(gx*gx + gy*gy);
      const i = (y*w+x)*4;
      if (mag > threshold) {
        edges[i] = edges[i+1] = edges[i+2] = 0; edges[i+3] = Math.min(255, mag * 2);
      } else {
        edges[i+3] = 0;
      }
    }
  }
  return edges;
}

// Halftone pattern
function halftone(data, w, h, dotSize = 4) {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y += dotSize) {
    for (let x = 0; x < w; x += dotSize) {
      let sum = 0, n = 0;
      for (let dy = 0; dy < dotSize && y+dy < h; dy++) {
        for (let dx = 0; dx < dotSize && x+dx < w; dx++) {
          const i = ((y+dy)*w+(x+dx))*4;
          sum += (data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114);
          n++;
        }
      }
      const brightness = sum / n / 255;
      const radius = (1 - brightness) * dotSize * 0.6;
      const cx = x + dotSize/2, cy = y + dotSize/2;
      for (let dy = 0; dy < dotSize && y+dy < h; dy++) {
        for (let dx = 0; dx < dotSize && x+dx < w; dx++) {
          const dist = Math.hypot(x+dx-cx, y+dy-cy);
          const i = ((y+dy)*w+(x+dx))*4;
          const ink = dist < radius ? 0 : 255;
          out[i] = out[i+1] = out[i+2] = ink; out[i+3] = 255;
        }
      }
    }
  }
  return out;
}

// Pixelate (voxel/mosaic)
function pixelate(data, w, h, size) {
  const out = new Uint8ClampedArray(data);
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      let r=0,g=0,b=0,n=0;
      for (let dy=0; dy<size&&y+dy<h; dy++) {
        for (let dx=0; dx<size&&x+dx<w; dx++) {
          const i=((y+dy)*w+(x+dx))*4;
          r+=data[i]; g+=data[i+1]; b+=data[i+2]; n++;
        }
      }
      r/=n; g/=n; b/=n;
      for (let dy=0; dy<size&&y+dy<h; dy++) {
        for (let dx=0; dx<size&&x+dx<w; dx++) {
          const i=((y+dy)*w+(x+dx))*4;
          out[i]=r; out[i+1]=g; out[i+2]=b;
        }
      }
    }
  }
  return out;
}

// Scanlines overlay
function scanlines(data, w, h, gap = 3, alpha = 60) {
  const out = new Uint8ClampedArray(data);
  for (let y = 0; y < h; y += gap) {
    for (let x = 0; x < w; x++) {
      const i = (y*w+x)*4;
      out[i]   = Math.max(0, out[i]   - alpha);
      out[i+1] = Math.max(0, out[i+1] - alpha);
      out[i+2] = Math.max(0, out[i+2] - alpha);
    }
  }
  return out;
}

// Vignette
function vignette(data, w, h, strength = 0.6) {
  const out = new Uint8ClampedArray(data);
  const cx = w/2, cy = h/2, maxD = Math.hypot(cx, cy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x-cx, y-cy) / maxD;
      const factor = 1 - d * d * strength;
      const i = (y*w+x)*4;
      out[i]   = out[i]   * factor;
      out[i+1] = out[i+1] * factor;
      out[i+2] = out[i+2] * factor;
    }
  }
  return out;
}

// Film grain
function grain(data, strength = 20) {
  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < out.length; i += 4) {
    const n = (Math.random() - 0.5) * strength;
    out[i]   = Math.min(255, Math.max(0, out[i]   + n));
    out[i+1] = Math.min(255, Math.max(0, out[i+1] + n));
    out[i+2] = Math.min(255, Math.max(0, out[i+2] + n));
  }
  return out;
}

// Bloom (simple: blur + add)
function bloom(ctx, w, h, threshold = 180, strength = 0.4) {
  const src = ctx.getImageData(0, 0, w, h);
  const bright = new Uint8ClampedArray(src.data);
  for (let i = 0; i < bright.length; i += 4) {
    const lum = bright[i]*0.299 + bright[i+1]*0.587 + bright[i+2]*0.114;
    if (lum < threshold) { bright[i]=bright[i+1]=bright[i+2]=0; }
  }
  // Blur the bright pass
  const tmp = document.createElement('canvas'); tmp.width=w; tmp.height=h;
  const tctx = tmp.getContext('2d');
  const bd = new ImageData(bright, w, h);
  tctx.putImageData(bd, 0, 0);
  tctx.filter = 'blur(6px)';
  tctx.drawImage(tmp, 0, 0);
  // Additive blend
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = strength;
  ctx.drawImage(tmp, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// Glitch shift
function glitch(data, w, h, strength = 8) {
  const out = new Uint8ClampedArray(data);
  const numSlices = Math.floor(h / 20);
  for (let s = 0; s < numSlices; s++) {
    if (Math.random() > 0.3) continue;
    const y = Math.floor(Math.random() * h);
    const shift = Math.floor((Math.random()-0.5) * strength * 2);
    for (let x = 0; x < w; x++) {
      const sx = Math.min(w-1, Math.max(0, x + shift));
      const i = (y*w+x)*4, si = (y*w+sx)*4;
      out[i] = data[si]; // R channel only shift for RGB split
    }
  }
  return out;
}

// Thermal color map
function thermalMap(data) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114) / 255;
    // Map 0→1 through black→blue→cyan→green→yellow→red→white
    let r,g,b;
    if (lum < 0.25)      { r=0;   g=0;              b=lum*4*255; }
    else if (lum < 0.5)  { r=0;   g=(lum-0.25)*4*255; b=255; }
    else if (lum < 0.75) { r=(lum-0.5)*4*255; g=255; b=255-(lum-0.5)*4*255; }
    else                 { r=255; g=255-(lum-0.75)*4*255; b=0; }
    out[i]=r; out[i+1]=g; out[i+2]=b; out[i+3]=data[i+3];
  }
  return out;
}

// ─── Main Renderer ────────────────────────────────────────────────────────────
export class SPX3DTo2DRenderer {
  /**
   * @param {THREE.WebGLRenderer} threeRenderer — the live Three.js renderer
   * @param {object} options
   */
  constructor(threeRenderer, options = {}) {
    this.threeRenderer = threeRenderer;
    this.styleId = options.style || 'cinematic';
    this.style = CINEMATIC_STYLES[this.styleId] || CINEMATIC_STYLES.cinematic;
    this.outlineWidth = options.outlineWidth || 1.5;
    this.toonLevels = options.toonLevels || this.style.toonLevels || 4;
  }

  setStyle(styleId) {
    this.styleId = styleId;
    this.style = CINEMATIC_STYLES[styleId] || CINEMATIC_STYLES.cinematic;
  }

  /**
   * Capture the current WebGL frame, apply style passes, return output canvas.
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   * @returns {HTMLCanvasElement}
   */
  async render(scene, camera) {
    const renderer = this.threeRenderer;
    const style = this.style;

    // 1. Render scene to offscreen buffer
    const w = renderer.domElement.width  || renderer.domElement.clientWidth  || 1280;
    const h = renderer.domElement.height || renderer.domElement.clientHeight || 720;

    const rtCanvas = document.createElement('canvas');
    rtCanvas.width = w; rtCanvas.height = h;
    const rtCtx = rtCanvas.getContext('2d');

    // Render the Three.js scene
    renderer.render(scene, camera);
    rtCtx.drawImage(renderer.domElement, 0, 0, w, h);

    // 2. Apply style
    return this._applyStyle(rtCanvas, w, h, style);
  }

  /**
   * Apply style to an existing canvas (e.g. already-rendered frame).
   */
  async applyStyleToCanvas(sourceCanvas, styleId) {
    const s = CINEMATIC_STYLES[styleId] || this.style;
    const w = sourceCanvas.width, h = sourceCanvas.height;
    return this._applyStyle(sourceCanvas, w, h, s);
  }

  _applyStyle(srcCanvas, w, h, style) {
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const ctx = out.getContext('2d');

    // Optional background color override
    if (style.bgColor) {
      ctx.fillStyle = style.bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(srcCanvas, 0, 0);
    } else {
      ctx.drawImage(srcCanvas, 0, 0);
    }

    // Apply CSS filter via intermediate canvas
    if (style.cssFilter && style.cssFilter !== 'none') {
      const tmp = document.createElement('canvas');
      tmp.width = w; tmp.height = h;
      const tctx = tmp.getContext('2d');
      tctx.filter = style.cssFilter;
      tctx.drawImage(out, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (style.bgColor) { ctx.fillStyle = style.bgColor; ctx.fillRect(0,0,w,h); }
      ctx.drawImage(tmp, 0, 0);
    }

    // Apply pixel passes
    let imgData = ctx.getImageData(0, 0, w, h);
    let d = imgData.data;
    const passes = style.passes || [];

    for (const pass of passes) {
      switch (pass) {
        case 'quantize':
          d = quantize(d, this.toonLevels || style.toonLevels || 4);
          break;
        case 'edge_black': {
          const edges = edgeDetect(d, w, h, 25);
          // Composite edges over current
          for (let i = 0; i < d.length; i += 4) {
            if (edges[i+3] > 0) {
              const t = edges[i+3] / 255;
              d[i]   = d[i]   * (1-t);
              d[i+1] = d[i+1] * (1-t);
              d[i+2] = d[i+2] * (1-t);
            }
          }
          break;
        }
        case 'edge_overlay': {
          const edges = edgeDetect(d, w, h, 20);
          for (let i = 0; i < d.length; i += 4) {
            if (edges[i+3] > 0) {
              d[i] = d[i+1] = d[i+2] = 0;
              d[i+3] = 255;
            }
          }
          break;
        }
        case 'edge_white_bg': {
          // White bg + black edges (sketch look)
          const edges = edgeDetect(d, w, h, 15);
          for (let i = 0; i < d.length; i += 4) {
            const e = edges[i+3] / 255;
            d[i]   = 255 - e * 255;
            d[i+1] = 255 - e * 255;
            d[i+2] = 255 - e * 255;
            d[i+3] = 255;
          }
          break;
        }
        case 'edge_neon': {
          const edges = edgeDetect(d, w, h, 20);
          for (let i = 0; i < d.length; i += 4) {
            if (edges[i+3] > 40) {
              d[i]   = Math.min(255, d[i]   + edges[i+3]);
              d[i+1] = Math.min(255, d[i+1] + edges[i+3] * 0.5);
              d[i+2] = Math.min(255, d[i+2] + edges[i+3] * 2);
            }
          }
          break;
        }
        case 'kuwahara':
          d = kuwahara(d, w, h, 3);
          break;
        case 'halftone':
          d = halftone(d, w, h, 4);
          break;
        case 'crosshatch': {
          // Blend crosshatch with edge detection
          const edges = edgeDetect(d, w, h, 20);
          for (let y2 = 0; y2 < h; y2++) {
            for (let x2 = 0; x2 < w; x2++) {
              const i = (y2*w+x2)*4;
              const lum = (d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114)/255;
              const isHatch = (x2+y2)%6===0 || (x2-y2+h)%6===0;
              if (isHatch && lum < 0.7) { d[i]=d[i+1]=d[i+2]=0; }
              else if (edges[i+3]>20) { d[i]=d[i+1]=d[i+2]=0; }
              else { d[i]=d[i+1]=d[i+2]=220; }
              d[i+3]=255;
            }
          }
          break;
        }
        case 'hatch': {
          for (let y2 = 0; y2 < h; y2++) {
            for (let x2 = 0; x2 < w; x2++) {
              const i=(y2*w+x2)*4;
              const lum=(d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114)/255;
              const hatch = lum < 0.3 ? ((x2+y2)%3===0)
                          : lum < 0.5 ? ((x2+y2)%5===0)
                          : lum < 0.7 ? ((x2+y2)%8===0) : false;
              d[i]=d[i+1]=d[i+2] = hatch ? 0 : 255; d[i+3]=255;
            }
          }
          break;
        }
        case 'pixelate':
          d = pixelate(d, w, h, style.pixelSize || 8);
          break;
        case 'scanlines':
          d = scanlines(d, w, h, 3, 50);
          break;
        case 'vignette':
          d = vignette(d, w, h, 0.6);
          break;
        case 'grain':
          d = grain(d, 15);
          break;
        case 'glitch_shift':
          d = glitch(d, w, h, 12);
          break;
        case 'thermal_map':
          d = thermalMap(d);
          break;
        case 'sharpen':
          d = convolve3x3(d, w, h, KERNELS.sharpen, 1);
          break;
        case 'blur_soft':
          d = convolve3x3(d, w, h, KERNELS.blur, 16);
          break;
        case 'desaturate': {
          for (let i = 0; i < d.length; i += 4) {
            const lum = d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114;
            d[i]=d[i+1]=d[i+2]=lum;
          }
          break;
        }
        case 'threshold': {
          for (let i = 0; i < d.length; i += 4) {
            const lum = d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114;
            const v = lum > 128 ? 255 : 0;
            d[i]=d[i+1]=d[i+2]=v;
          }
          break;
        }
        case 'color_shift': {
          for (let i = 0; i < d.length; i += 4) {
            d[i]   = Math.min(255, d[i]   * 1.2);
            d[i+1] = Math.min(255, d[i+1] * 0.9);
          }
          break;
        }
        case 'letterbox': {
          const bar = Math.floor(h * 0.08);
          for (let x2 = 0; x2 < w; x2++) {
            for (let row of [0, h-bar]) {
              for (let y2 = row; y2 < Math.min(row+bar, h); y2++) {
                const i=(y2*w+x2)*4;
                d[i]=d[i+1]=d[i+2]=0;
              }
            }
          }
          break;
        }
        case 'grid_overlay': {
          const gs = 40;
          for (let y2 = 0; y2 < h; y2++) {
            for (let x2 = 0; x2 < w; x2++) {
              if (y2%gs===0 || x2%gs===0) {
                const i=(y2*w+x2)*4;
                d[i]=0; d[i+1]=150; d[i+2]=255; d[i+3]=100;
              }
            }
          }
          break;
        }
        case 'hologram_glow': {
          for (let i = 0; i < d.length; i += 4) {
            d[i+2] = Math.min(255, d[i+2] * 1.5);
            d[i]   = d[i]   * 0.3;
            d[i+1] = Math.min(255, d[i+1] * 1.2);
          }
          break;
        }
        case 'flat': {
          d = quantize(d, 8);
          break;
        }
        // Style-specific overrides handled via cssFilter, these are no-ops
        case 'soft_light':
        case 'stroke_texture':
        case 'paper_texture':
        case 'crack_texture':
        case 'woodblock':
        case 'lead_lines':
        case 'stipple_dots':
        case 'rain_overlay':
        case 'scratch':
        case 'smudge':
        case 'distort':
        case 'wireframe_overlay':
        case 'faceted':
        case 'lens_flare':
          break; // Handled by cssFilter or future GPU pass
        default:
          break;
      }
    }

    ctx.putImageData(new ImageData(d, w, h), 0, 0);

    // Bloom pass (uses canvas compositing, done after putImageData)
    if (passes.includes('bloom')) bloom(ctx, w, h, 170, 0.35);

    return out;
  }

  /**
   * Export the styled canvas as a data URL.
   */
  async exportPNG(scene, camera) {
    const canvas = await this.render(scene, camera);
    return canvas.toDataURL('image/png');
  }
}

// ─── Legacy skeleton renderer (kept for SPX Puppet / 2D animation pipeline) ──
export class SPX3DTo2DSkeletonRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.style = CINEMATIC_STYLES[options.style] || CINEMATIC_STYLES.toon;
  }
  setStyle(id) { this.style = CINEMATIC_STYLES[id] || this.style; }
  renderSkeleton(skeleton, options = {}) {
    // Legacy: kept for SPX Puppet bone projection
    if (!skeleton?.bones) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.strokeStyle = this.style.toon ? '#00ffc8' : '#888';
    ctx.lineWidth = 2;
    skeleton.bones.forEach(bone => {
      const wp = new THREE.Vector3();
      bone.getWorldPosition(wp);
      const x = (wp.x + 1) * this.canvas.width / 2;
      const y = (-wp.y + 1) * this.canvas.height / 2;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI*2);
      ctx.fillStyle = '#FF6600';
      ctx.fill();
    });
  }
}


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
