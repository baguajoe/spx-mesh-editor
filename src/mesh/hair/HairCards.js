/**
 * HairCards.js — SPX Mesh Editor
 * Generates geometry-based hair cards with UV layout, LOD, and physics metadata.
 * Each card is a flat quad strip shaped along a strand curve.
 */
import * as THREE from 'three';\n\nconst clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));\nconst lerp  = (a, b, t)   => a + (b - a) * t;\nconst rand  = (lo, hi)    => lo + Math.random() * (hi - lo);\n\n// ─── HairCard ────────────────────────────────────────────────────────────────\nexport class HairCard {\n  constructor(opts = {}) {\n    this.id          = opts.id    ?? 0;\n    this.segments    = opts.segments ?? 8;\n    this.width       = opts.width    ?? 0.012;\n    this.widthTaper  = opts.widthTaper ?? 0.6;  // 0=uniform, 1=full taper\n    this.length      = opts.length   ?? 0.25;\n    this.curl        = opts.curl     ?? 0.0;\n    this.curlFreq    = opts.curlFreq ?? 2.0;\n    this.wave        = opts.wave     ?? 0.0;\n    this.waveFreq    = opts.waveFreq ?? 3.0;\n    this.twist       = opts.twist    ?? 0.0;\n    this.rootPos     = opts.rootPos  ?? new THREE.Vector3();\n    this.rootNormal  = opts.rootNormal ?? new THREE.Vector3(0, 1, 0);\n    this.rootTangent = opts.rootTangent ?? new THREE.Vector3(1, 0, 0);\n    this.uvOffset    = opts.uvOffset ?? new THREE.Vector2();\n    this.uvScale     = opts.uvScale  ?? new THREE.Vector2(1, 1);\n    this.groupId     = opts.groupId  ?? 0;\n    this.stiffness   = opts.stiffness ?? 0.7;\n    this.mass        = opts.mass      ?? 0.1;\n    this.geometry    = null;\n    this._curve      = null;\n  }\n\n  // Build strand curve points\n  buildCurve() {\n    const pts = [];\n    const right = this.rootTangent.clone().cross(this.rootNormal).normalize();\n    for (let i = 0; i <= this.segments; i++) {\n      const t = i / this.segments;\n      const p = this.rootPos.clone()\n        .add(this.rootNormal.clone().multiplyScalar(t * this.length));\n      // curl\n      if (this.curl > 0) {\n        const angle = t * Math.PI * 2 * this.curlFreq;\n        p.add(right.clone().multiplyScalar(Math.sin(angle) * this.curl * t));\n        p.add(this.rootNormal.clone().cross(right)\n          .multiplyScalar(Math.cos(angle) * this.curl * t));\n      }\n      // wave\n      if (this.wave > 0) {\n        const wAngle = t * Math.PI * 2 * this.waveFreq;\n        p.add(right.clone().multiplyScalar(Math.sin(wAngle) * this.wave));\n      }\n      pts.push(p);\n    }\n    this._curve = pts;\n    return pts;\n  }\n\n  // Build flat quad strip geometry along the curve\n  buildGeometry() {\n    const pts = this._curve ?? this.buildCurve();\n    const N   = pts.length;\n    const positions = [];\n    const normals   = [];\n    const uvs       = [];\n    const indices   = [];\n\n    const right = this.rootTangent.clone().cross(this.rootNormal).normalize();\n\n    for (let i = 0; i < N; i++) {\n      const t = i / (N - 1);\n      const w = this.width * lerp(1, this.widthTaper, t) * 0.5;\n      const p = pts[i];\n      const twist = this.twist * t * Math.PI * 2;\n      const r = right.clone()\n        .applyAxisAngle(this.rootNormal, twist);\n\n      // Left vertex\n      positions.push(p.x - r.x * w, p.y - r.y * w, p.z - r.z * w);\n      normals.push(this.rootNormal.x, this.rootNormal.y, this.rootNormal.z);\n      uvs.push(\n        this.uvOffset.x + this.uvScale.x * 0,\n        this.uvOffset.y + this.uvScale.y * t\n      );\n\n      // Right vertex\n      positions.push(p.x + r.x * w, p.y + r.y * w, p.z + r.z * w);\n      normals.push(this.rootNormal.x, this.rootNormal.y, this.rootNormal.z);\n      uvs.push(\n        this.uvOffset.x + this.uvScale.x * 1,\n        this.uvOffset.y + this.uvScale.y * t\n      );\n\n      if (i < N - 1) {\n        const base = i * 2;\n        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);\n      }\n    }\n\n    const geo = new THREE.BufferGeometry();\n    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));\n    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));\n    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
    geo.setIndex(indices);
    this.geometry = geo;
    return geo;
  }

  // Returns physics simulation data for this card
  getSimData() {
    return {
      id:        this.id,
      rootPos:   this.rootPos.toArray(),
      stiffness: this.stiffness,
      mass:      this.mass,
      segments:  this.segments,
      length:    this.length,
    };
  }

  dispose() {
    this.geometry?.dispose();
    this.geometry = null;
  }

  toJSON() {
    return {
      id: this.id, segments: this.segments, width: this.width,
      widthTaper: this.widthTaper, length: this.length,
      curl: this.curl, curlFreq: this.curlFreq,
      wave: this.wave, waveFreq: this.waveFreq, twist: this.twist,
      rootPos: this.rootPos.toArray(),
      rootNormal: this.rootNormal.toArray(),
      uvOffset: this.uvOffset.toArray(),
      uvScale: this.uvScale.toArray(),
      groupId: this.groupId, stiffness: this.stiffness, mass: this.mass,
    };
  }
}

// ─── HairCards manager ───────────────────────────────────────────────────────
export class HairCards {
  constructor(opts = {}) {
    this.cards      = [];
    this.count      = opts.count      ?? 200;
    this.density    = opts.density    ?? 0.7;
    this.spread     = opts.spread     ?? 1.0;
    this.cardWidth  = opts.cardWidth  ?? 0.012;
    this.cardLength = opts.cardLength ?? 0.25;
    this.segments   = opts.segments   ?? 8;
    this.groupCount = opts.groupCount ?? 5;
    this.seed       = opts.seed       ?? 42;
    this._rng       = this._mkRng(this.seed);
    this._merged    = null;
  }

  _mkRng(s) { let n = s; return () => { n = (n * 9301 + 49297) % 233280; return n / 233280; }; }
  _rn(lo, hi) { return lo + this._rng() * (hi - lo); }

  // Scatter cards over a surface (uses random hemisphere)
  scatter(scalp) {
    this.cards = [];
    const N = Math.round(this.count * this.density);
    for (let i = 0; i < N; i++) {
      const theta = this._rn(0, Math.PI * 2);
      const phi   = this._rn(0, Math.PI * 0.4);
      const r     = this._rn(0, this.spread);
      const rootPos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
      const rootNormal = rootPos.clone().normalize();
      const card = new HairCard({
        id:          i,
        segments:    this.segments,
        width:       this.cardWidth   * this._rn(0.8, 1.2),
        length:      this.cardLength  * this._rn(0.85, 1.15),
        curl:        this._rn(0, 0.02),
        wave:        this._rn(0, 0.008),
        twist:       this._rn(-0.1, 0.1),
        rootPos,
        rootNormal,
        rootTangent: new THREE.Vector3(1, 0, 0)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), theta),
        groupId: Math.floor(i / (N / this.groupCount)),
        stiffness: this._rn(0.5, 0.9),
        mass:      this._rn(0.05, 0.15),
      });
      card.buildCurve();
      card.buildGeometry();
      this.cards.push(card);
    }
    return this;
  }

  // Merge all card geometries into a single BufferGeometry
  merge() {
    if (!this.cards.length) return null;
    const geos = this.cards.map(c => c.geometry).filter(Boolean);
    this._merged = THREE.BufferGeometryUtils?.mergeGeometries?.(geos) ?? geos[0];
    return this._merged;
  }

  // Return per-group geometry for LOD or material separation
  getGroup(groupId) {
    return this.cards.filter(c => c.groupId === groupId).map(c => c.geometry);
  }

  getSimData()   { return this.cards.map(c => c.getSimData()); }
  getCardCount() { return this.cards.length; }

  dispose() {
    this.cards.forEach(c => c.dispose());
    this._merged?.dispose();
    this.cards = [];
  }

  toJSON() {
    return {
      count: this.count, density: this.density, spread: this.spread,
      cardWidth: this.cardWidth, cardLength: this.cardLength,
      segments: this.segments, groupCount: this.groupCount, seed: this.seed,
    };
  }
}

export default HairCards;
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
