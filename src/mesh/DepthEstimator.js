// DepthEstimator.js — MiDaS-based monocular depth estimation
// SPX Mesh Editor | StreamPireX
// Uses MiDaS small model via ONNX runtime (wasm backend)

const MIDAS_MODEL_URL = 'https://huggingface.co/onnx-community/midas-v2.1-small/resolve/main/onnx/model.onnx';
const INPUT_SIZE = 256;

export class DepthEstimator {
  constructor(options = {}) {
    this.modelUrl = options.modelUrl ?? MIDAS_MODEL_URL;
    this.session = null;
    this.ready = false;
    this.onReady = options.onReady ?? null;
    this.onDepth = options.onDepth ?? null;
    this._canvas = document.createElement('canvas');
    this._canvas.width = INPUT_SIZE;
    this._canvas.height = INPUT_SIZE;
    this._ctx = this._canvas.getContext('2d');
  }

  async init() {
    await this._loadONNX();
    try {
      const ort = window.ort;
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
      this.session = await ort.InferenceSession.create(this.modelUrl, {
        executionProviders: ['wasm'],
      });
      this.ready = true;
      if (this.onReady) this.onReady();
      console.log('[DepthEstimator] MiDaS model ready');
    } catch (e) {
      console.error('[DepthEstimator] Failed to load MiDaS model:', e);
    }
  }

  _loadONNX() {
    return new Promise((resolve) => {
      if (window.ort) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  async estimateDepth(imageSource) {
    if (!this.ready || !this.session) {
      console.warn('[DepthEstimator] Not ready');
      return null;
    }

    // Draw source to canvas at INPUT_SIZE
    this._ctx.drawImage(imageSource, 0, 0, INPUT_SIZE, INPUT_SIZE);
    const imageData = this._ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);

    // Convert to float32 tensor [1, 3, H, W], normalize to ImageNet mean/std
    const tensor = this._imageToTensor(imageData);

    const feeds = { input: tensor };
    const results = await this.session.run(feeds);
    const depthData = results[Object.keys(results)[0]].data;

    // Normalize depth to 0-1
    const min = Math.min(...depthData);
    const max = Math.max(...depthData);
    const range = max - min || 1;
    const normalized = Float32Array.from(depthData, v => (v - min) / range);

    const depthMap = { data: normalized, width: INPUT_SIZE, height: INPUT_SIZE, min, max };
    if (this.onDepth) this.onDepth(depthMap);
    return depthMap;
  }

  _imageToTensor(imageData) {
    const { data, width, height } = imageData;
    const float32 = new Float32Array(3 * width * height);
    const mean = [0.485, 0.456, 0.406];
    const std  = [0.229, 0.224, 0.225];

    for (let i = 0; i < width * height; i++) {
      float32[i]                   = (data[i * 4]     / 255 - mean[0]) / std[0]; // R
      float32[i + width * height]  = (data[i * 4 + 1] / 255 - mean[1]) / std[1]; // G
      float32[i + width * height * 2] = (data[i * 4 + 2] / 255 - mean[2]) / std[2]; // B
    }

    return new window.ort.Tensor('float32', float32, [1, 3, height, width]);
  }

  getDepthAt(depthMap, x, y) {
    if (!depthMap) return 0;
    const px = Math.floor(x * depthMap.width);
    const py = Math.floor(y * depthMap.height);
    return depthMap.data[py * depthMap.width + px] ?? 0;
  }

  // Lift 2D pose landmarks into 3D using depth map
  liftPoseTo3D(landmarks, depthMap, focalLength = 1.0) {
    if (!depthMap || !landmarks) return landmarks;
    return landmarks.map(lm => {
      if (!lm) return lm;
      const d = this.getDepthAt(depthMap, lm.x, lm.y);
      return {
        ...lm,
        z: d * 2 - 1, // remap 0-1 depth to -1..1
        depthConfidence: d,
      };
    });
  }

  renderDepthToCanvas(depthMap, canvas) {
    if (!depthMap || !canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(depthMap.width, depthMap.height);
    for (let i = 0; i < depthMap.data.length; i++) {
      const v = Math.floor(depthMap.data[i] * 255);
      imgData.data[i * 4]     = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  dispose() {
    if (this.session) this.session.release?.();
    this.session = null;
    this.ready = false;
  }
}

export default DepthEstimator;
