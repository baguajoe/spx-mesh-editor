/**
 * HairProceduralTextures.js — SPX Mesh Editor
 * Canvas 2D procedural hair textures: strand, noise, atlas, normal map.
 */
import * as THREE from 'three';

const lerp = (a, b, t) => a + (b - a) * t;

// ─── Strand texture ───────────────────────────────────────────────────────────
export function buildStrandTexture(opts = {}) {
  const W    = opts.width  ?? 64;
  const H    = opts.height ?? 256;
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(W, H)
    : Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx  = canvas.getContext('2d');

  const rootColor = opts.rootColor ?? '#2a1008';
  const tipColor  = opts.tipColor  ?? '#8a5020';
  const specColor = opts.specColor ?? '#fff8e0';

  // Background transparent
  ctx.clearRect(0, 0, W, H);

  // Strand gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0.0, rootColor);
  grad.addColorStop(0.6, tipColor);
  grad.addColorStop(1.0, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Specular highlight band
  const specGrad = ctx.createLinearGradient(0, 0, W, 0);
  specGrad.addColorStop(0.0, 'transparent');
  specGrad.addColorStop(0.3, 'transparent');
  specGrad.addColorStop(0.45, specColor + '88');
  specGrad.addColorStop(0.5,  specColor + 'cc');
  specGrad.addColorStop(0.55, specColor + '88');
  specGrad.addColorStop(0.7, 'transparent');
  specGrad.addColorStop(1.0, 'transparent');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = specGrad;
  ctx.fillRect(0, 0, W, H * 0.7);
  ctx.globalCompositeOperation = 'source-over';

  // Secondary specular
  if (opts.dualSpecular !== false) {
    const spec2 = ctx.createLinearGradient(0, 0, W, 0);
    spec2.addColorStop(0.0, 'transparent');
    spec2.addColorStop(0.6, 'transparent');
    spec2.addColorStop(0.72, specColor + '44');
    spec2.addColorStop(0.75, specColor + '66');
    spec2.addColorStop(0.78, specColor + '44');
    spec2.addColorStop(1.0, 'transparent');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = spec2;
    ctx.fillRect(0, H * 0.3, W, H * 0.5);
    ctx.globalCompositeOperation = 'source-over';
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Noise / alpha texture ─────────────────────────────────────────────────────
export function buildNoiseTexture(opts = {}) {
  const W = opts.width  ?? 128;
  const H = opts.height ?? 128;
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(W, H)
    : Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const octaves  = opts.octaves  ?? 4;
  const lacunarity = opts.lacunarity ?? 2.0;
  const gain       = opts.gain       ?? 0.5;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = 0, amp = 1, freq = 1, max = 0;
      for (let o = 0; o < octaves; o++) {
        const nx = (x / W) * freq + o * 17.3;
        const ny = (y / H) * freq + o * 31.7;
        v   += Math.sin(nx * 6.28) * Math.cos(ny * 6.28) * amp;
        max += amp;
        amp *= gain; freq *= lacunarity;
      }
      const n = (v / max + 1) * 0.5;
      const i = (y * W + x) * 4;
      img.data[i]     = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(n * 255 * (opts.density ?? 0.7));
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── Atlas packer ─────────────────────────────────────────────────────────────
export class HairAtlasBuilder {
  constructor(atlasW = 512, atlasH = 512, cols = 4, rows = 4) {
    this.atlasW  = atlasW;
    this.atlasH  = atlasH;
    this.cols    = cols;
    this.rows    = rows;
    this.cellW   = atlasW / cols;
    this.cellH   = atlasH / rows;
    this.slots   = Array.from({ length: cols * rows }, (_, i) => ({
      index: i,
      col:   i % cols,
      row:   Math.floor(i / cols),
      used:  false,
    }));
    this._canvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(atlasW, atlasH)
      : Object.assign(document.createElement('canvas'), { width: atlasW, height: atlasH });
    this._ctx = this._canvas.getContext('2d');
  }

  // Reserve a slot and return its UV rect
  allocateSlot() {
    const slot = this.slots.find(s => !s.used);
    if (!slot) throw new Error('HairAtlas: no free slots');
    slot.used = true;
    const u = slot.col / this.cols;
    const v = slot.row / this.rows;
    return { slot, u, v, uw: 1 / this.cols, vh: 1 / this.rows };
  }

  // Draw a strand texture into a slot
  drawStrand(slotInfo, strandTex) {
    const { slot } = slotInfo;
    const x = slot.col * this.cellW;
    const y = slot.row * this.cellH;
    if (strandTex.image) {
      this._ctx.drawImage(strandTex.image, x, y, this.cellW, this.cellH);
    }
  }

  // Build final atlas texture
  build() {
    const tex = new THREE.CanvasTexture(this._canvas);
    tex.needsUpdate = true;
    return tex;
  }

  freeSlot(slotInfo) {
    slotInfo.slot.used = false;
    const x = slotInfo.slot.col * this.cellW;
    const y = slotInfo.slot.row * this.cellH;
    this._ctx.clearRect(x, y, this.cellW, this.cellH);
  }
}

// ─── Normal map generator ─────────────────────────────────────────────────────
export function buildNormalMap(heightTex, strength = 1.5) {
  const img = heightTex.image;
  if (!img) return null;
  const W = img.width ?? 128, H = img.height ?? 128;
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(W, H)
    : Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H);
  const src  = ctx.getImageData(0, 0, W, H);
  const out  = ctx.createImageData(W, H);
  const h    = (x, y) => src.data[((y * W + x) * 4)];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const tl = h(Math.max(0, x-1), Math.max(0, y-1));
      const tr = h(Math.min(W-1, x+1), Math.max(0, y-1));
      const bl = h(Math.max(0, x-1), Math.min(H-1, y+1));
      const br = h(Math.min(W-1, x+1), Math.min(H-1, y+1));
      const dx = (tr + br - tl - bl) / 255 * strength;
      const dy = (bl + br - tl - tr) / 255 * strength;
      const len = Math.sqrt(dx*dx + dy*dy + 1);
      const i   = (y * W + x) * 4;
      out.data[i]     = Math.round(( dx/len + 1) * 127.5);
      out.data[i + 1] = Math.round((-dy/len + 1) * 127.5);
      out.data[i + 2] = Math.round(( 1 /len + 1) * 127.5);
      out.data[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export class HairProceduralTextures {
  constructor(opts = {}) {
    this.opts   = opts;
    this.strand = null;
    this.noise  = null;
    this.normal = null;
    this.atlas  = null;
  }

  build() {
    this.strand = buildStrandTexture(this.opts);
    this.noise  = buildNoiseTexture(this.opts);
    this.normal = buildNormalMap(this.strand, this.opts.normalStrength ?? 1.5);
    this.atlas  = new HairAtlasBuilder(
      this.opts.atlasW ?? 512,
      this.opts.atlasH ?? 512,
    );
    return this;
  }

  dispose() {
    this.strand?.dispose();
    this.noise?.dispose();
    this.normal?.dispose();
  }
}

export default HairProceduralTextures;
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
