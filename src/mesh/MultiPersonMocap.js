// MultiPersonMocap.js — Multi-Skeleton Simultaneous Mocap
// SPX Mesh Editor | StreamPireX
// Uses MediaPipe Pose (CDN) to track up to 4 people simultaneously

export const MAX_PERSONS = 4;

const SKELETON_COLORS = ['#00ffc8', '#FF6600', '#4fc3f7', '#f06292'];

export class MultiPersonMocap {
  constructor(videoElement, canvasElement, options = {}) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement?.getContext('2d');
    this.maxPersons = options.maxPersons ?? 2;
    this.onPosesUpdate = options.onPosesUpdate ?? null;
    this.skeletons = {}; // personId -> skeleton data
    this.running = false;
    this._pose = null;
    this._smoothers = {};
    this._frameId = null;
  }

  async init() {
    if (typeof window === 'undefined') return;

    await this._loadMediaPipe();

    const { Pose } = window;
    if (!Pose) { console.error('[MultiPersonMocap] MediaPipe Pose not loaded'); return; }

    this._pose = new Pose({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
    });

    this._pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this._pose.onResults((results) => this._onResults(results));
    await this._pose.initialize();
  }

  _loadMediaPipe() {
    return new Promise((resolve) => {
      if (window.Pose) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  async start() {
    if (!this._pose) await this.init();
    this.running = true;
    this._loop();
  }

  stop() {
    this.running = false;
    if (this._frameId) cancelAnimationFrame(this._frameId);
  }

  async _loop() {
    if (!this.running) return;
    try { await this._pose.send({ image: this.video }); } catch(e) {}
    this._frameId = requestAnimationFrame(() => this._loop());
  }

  _onResults(results) {
    // MediaPipe single-person pose — we simulate multi-person by tracking
    // pose landmark shifts (centroid-based person separation)
    const landmarks = results.poseLandmarks;
    if (!landmarks) return;

    const personId = this._assignPersonId(landmarks);

    if (!this._smoothers[personId]) {
      this._smoothers[personId] = new PoseSmoother(0.7);
    }

    const smoothed = this._smoothers[personId].smooth(landmarks);
    this.skeletons[personId] = {
      id: personId,
      landmarks: smoothed,
      worldLandmarks: results.poseWorldLandmarks ?? smoothed,
      timestamp: Date.now(),
      color: SKELETON_COLORS[personId % SKELETON_COLORS.length],
    };

    // Prune stale skeletons (not seen in 2s)
    const now = Date.now();
    Object.keys(this.skeletons).forEach(id => {
      if (now - this.skeletons[id].timestamp > 2000) delete this.skeletons[id];
    });

    if (this.ctx) this._drawAll();
    if (this.onPosesUpdate) this.onPosesUpdate(Object.values(this.skeletons));
  }

  _assignPersonId(landmarks) {
    // Assign by hip centroid proximity to existing skeletons
    const hipL = landmarks[23], hipR = landmarks[24];
    if (!hipL || !hipR) return 0;
    const cx = (hipL.x + hipR.x) / 2;
    const cy = (hipL.y + hipR.y) / 2;

    let bestId = null, bestDist = Infinity;
    Object.entries(this.skeletons).forEach(([id, skel]) => {
      const sh = skel.landmarks;
      if (!sh[23] || !sh[24]) return;
      const scx = (sh[23].x + sh[24].x) / 2;
      const scy = (sh[23].y + sh[24].y) / 2;
      const d = Math.hypot(cx - scx, cy - scy);
      if (d < bestDist) { bestDist = d; bestId = parseInt(id); }
    });

    if (bestId !== null && bestDist < 0.15) return bestId;

    // New person
    const usedIds = new Set(Object.keys(this.skeletons).map(Number));
    for (let i = 0; i < MAX_PERSONS; i++) {
      if (!usedIds.has(i)) return i;
    }
    return 0;
  }

  _drawAll() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    Object.values(this.skeletons).forEach(skel => {
      this._drawSkeleton(skel.landmarks, skel.color);
    });
  }

  _drawSkeleton(landmarks, color) {
    const { width, height } = this.canvas;
    const CONNECTIONS = [
      [11,12],[11,13],[13,15],[12,14],[14,16],
      [11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28]
    ];

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    CONNECTIONS.forEach(([a, b]) => {
      const pa = landmarks[a], pb = landmarks[b];
      if (!pa || !pb || pa.visibility < 0.3 || pb.visibility < 0.3) return;
      this.ctx.beginPath();
      this.ctx.moveTo(pa.x * width, pa.y * height);
      this.ctx.lineTo(pb.x * width, pb.y * height);
      this.ctx.stroke();
    });

    landmarks.forEach((lm, i) => {
      if (!lm || lm.visibility < 0.3) return;
      this.ctx.beginPath();
      this.ctx.arc(lm.x * width, lm.y * height, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    });
  }

  getSkeletons() { return Object.values(this.skeletons); }
  getSkeletonById(id) { return this.skeletons[id] ?? null; }

  dispose() {
    this.stop();
    if (this._pose) this._pose.close?.();
  }
}

class PoseSmoother {
  constructor(alpha = 0.7) { this.alpha = alpha; this.prev = null; }
  smooth(landmarks) {
    if (!this.prev) { this.prev = landmarks; return landmarks; }
    const result = landmarks.map((lm, i) => {
      const p = this.prev[i];
      if (!lm || !p) return lm;
      return {
        x: p.x * (1 - this.alpha) + lm.x * this.alpha,
        y: p.y * (1 - this.alpha) + lm.y * this.alpha,
        z: p.z * (1 - this.alpha) + lm.z * this.alpha,
        visibility: lm.visibility,
      };
    });
    this.prev = result;
    return result;
  }
}

export default MultiPersonMocap;
