/**
 * HairProceduralTextures.js — SPX Mesh Editor
 * Canvas 2D procedural hair textures: strand, noise, atlas, normal map.
 */
import * as THREE from 'three';\n\nconst lerp = (a, b, t) => a + (b - a) * t;\n\n// ─── Strand texture ───────────────────────────────────────────────────────────\nexport function buildStrandTexture(opts = {}) {\n  const W    = opts.width  ?? 64;\n  const H    = opts.height ?? 256;\n  const canvas = typeof OffscreenCanvas !== 'undefined'\n    ? new OffscreenCanvas(W, H)\n    : Object.assign(document.createElement('canvas'), { width: W, height: H });\n  const ctx  = canvas.getContext('2d');\n\n  const rootColor = opts.rootColor ?? '#2a1008';\n  const tipColor  = opts.tipColor  ?? '#8a5020';\n  const specColor = opts.specColor ?? '#fff8e0';\n\n  // Background transparent\n  ctx.clearRect(0, 0, W, H);\n\n  // Strand gradient\n  const grad = ctx.createLinearGradient(0, 0, 0, H);\n  grad.addColorStop(0.0, rootColor);\n  grad.addColorStop(0.6, tipColor);\n  grad.addColorStop(1.0, 'transparent');\n  ctx.fillStyle = grad;\n  ctx.fillRect(0, 0, W, H);\n\n  // Specular highlight band\n  const specGrad = ctx.createLinearGradient(0, 0, W, 0);\n  specGrad.addColorStop(0.0, 'transparent');\n  specGrad.addColorStop(0.3, 'transparent');\n  specGrad.addColorStop(0.45, specColor + '88');\n  specGrad.addColorStop(0.5,  specColor + 'cc');\n  specGrad.addColorStop(0.55, specColor + '88');\n  specGrad.addColorStop(0.7, 'transparent');\n  specGrad.addColorStop(1.0, 'transparent');\n  ctx.globalCompositeOperation = 'screen';\n  ctx.fillStyle = specGrad;\n  ctx.fillRect(0, 0, W, H * 0.7);\n  ctx.globalCompositeOperation = 'source-over';\n\n  // Secondary specular\n  if (opts.dualSpecular !== false) {\n    const spec2 = ctx.createLinearGradient(0, 0, W, 0);\n    spec2.addColorStop(0.0, 'transparent');\n    spec2.addColorStop(0.6, 'transparent');\n    spec2.addColorStop(0.72, specColor + '44');\n    spec2.addColorStop(0.75, specColor + '66');\n    spec2.addColorStop(0.78, specColor + '44');\n    spec2.addColorStop(1.0, 'transparent');\n    ctx.globalCompositeOperation = 'screen';\n    ctx.fillStyle = spec2;\n    ctx.fillRect(0, H * 0.3, W, H * 0.5);\n    ctx.globalCompositeOperation = 'source-over';\n  }\n\n  const tex = new THREE.CanvasTexture(canvas);\n  tex.needsUpdate = true;\n  return tex;\n}\n\n// ─── Noise / alpha texture ─────────────────────────────────────────────────────\nexport function buildNoiseTexture(opts = {}) {\n  const W = opts.width  ?? 128;\n  const H = opts.height ?? 128;\n  const canvas = typeof OffscreenCanvas !== 'undefined'\n    ? new OffscreenCanvas(W, H)\n    : Object.assign(document.createElement('canvas'), { width: W, height: H });\n  const ctx = canvas.getContext('2d');\n  const img = ctx.createImageData(W, H);\n  const octaves  = opts.octaves  ?? 4;\n  const lacunarity = opts.lacunarity ?? 2.0;\n  const gain       = opts.gain       ?? 0.5;\n\n  for (let y = 0; y < H; y++) {\n    for (let x = 0; x < W; x++) {\n      let v = 0, amp = 1, freq = 1, max = 0;\n      for (let o = 0; o < octaves; o++) {\n        const nx = (x / W) * freq + o * 17.3;\n        const ny = (y / H) * freq + o * 31.7;\n        v   += Math.sin(nx * 6.28) * Math.cos(ny * 6.28) * amp;\n        max += amp;\n        amp *= gain; freq *= lacunarity;\n      }\n      const n = (v / max + 1) * 0.5;\n      const i = (y * W + x) * 4;\n      img.data[i]     = 255;\n      img.data[i + 1] = 255;\n      img.data[i + 2] = 255;\n      img.data[i + 3] = Math.round(n * 255 * (opts.density ?? 0.7));\n    }\n  }\n  ctx.putImageData(img, 0, 0);\n  const tex = new THREE.CanvasTexture(canvas);\n  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;\n  return tex;\n}\n\n// ─── Atlas packer ─────────────────────────────────────────────────────────────\nexport class HairAtlasBuilder {\n  constructor(atlasW = 512, atlasH = 512, cols = 4, rows = 4) {\n    this.atlasW  = atlasW;\n    this.atlasH  = atlasH;\n    this.cols    = cols;\n    this.rows    = rows;\n    this.cellW   = atlasW / cols;\n    this.cellH   = atlasH / rows;\n    this.slots   = Array.from({ length: cols * rows }, (_, i) => ({\n      index: i,\n      col:   i % cols,\n      row:   Math.floor(i / cols),\n      used:  false,\n    }));\n    this._canvas = typeof OffscreenCanvas !== 'undefined'\n      ? new OffscreenCanvas(atlasW, atlasH)\n      : Object.assign(document.createElement('canvas'), { width: atlasW, height: atlasH });\n    this._ctx = this._canvas.getContext('2d');\n  }\n\n  // Reserve a slot and return its UV rect\n  allocateSlot() {\n    const slot = this.slots.find(s => !s.used);\n    if (!slot) throw new Error('HairAtlas: no free slots');\n    slot.used = true;\n    const u = slot.col / this.cols;\n    const v = slot.row / this.rows;\n    return { slot, u, v, uw: 1 / this.cols, vh: 1 / this.rows };\n  }\n\n  // Draw a strand texture into a slot\n  drawStrand(slotInfo, strandTex) {\n    const { slot } = slotInfo;\n    const x = slot.col * this.cellW;\n    const y = slot.row * this.cellH;\n    if (strandTex.image) {\n      this._ctx.drawImage(strandTex.image, x, y, this.cellW, this.cellH);\n    }\n  }\n\n  // Build final atlas texture\n  build() {\n    const tex = new THREE.CanvasTexture(this._canvas);\n    tex.needsUpdate = true;\n    return tex;\n  }\n\n  freeSlot(slotInfo) {\n    slotInfo.slot.used = false;\n    const x = slotInfo.slot.col * this.cellW;\n    const y = slotInfo.slot.row * this.cellH;\n    this._ctx.clearRect(x, y, this.cellW, this.cellH);\n  }\n}\n\n// ─── Normal map generator ─────────────────────────────────────────────────────\nexport function buildNormalMap(heightTex, strength = 1.5) {\n  const img = heightTex.image;\n  if (!img) return null;\n  const W = img.width ?? 128, H = img.height ?? 128;\n  const canvas = typeof OffscreenCanvas !== 'undefined'\n    ? new OffscreenCanvas(W, H)\n    : Object.assign(document.createElement('canvas'), { width: W, height: H });\n  const ctx = canvas.getContext('2d');
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
