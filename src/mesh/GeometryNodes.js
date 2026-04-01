// GeometryNodes.js — Procedural Geometry Node System UPGRADE
// SPX Mesh Editor | StreamPireX
// Nodes: Scatter, CurveToMesh, MathOp, SetPosition, JoinGeometry, InstanceOnPoints,
//        GridGenerator, SphereGenerator, NoiseDisplace, ColorByHeight

import * as THREE from 'three';

// ─── Node Base ────────────────────────────────────────────────────────────────

class GeoNode {
  constructor(id, type) {
    this.id = id;
    this.type = type;
    this.inputs = {};
    this.outputs = {};
    this.params = {};
    this.position = { x: 0, y: 0 }; // UI position
  }
  execute(inputData) { return inputData; }
}

// ─── Node Implementations ─────────────────────────────────────────────────────

class ScatterNode extends GeoNode {
  constructor(id) {
    super(id, 'SCATTER');
    this.params = { count: 100, seed: 42, distributeOnFaces: true };
  }
  execute({ geometry }) {
    if (!geometry) return { points: [] };
    const pos = geometry.attributes.position;
    const { count, seed } = this.params;
    const rng = seededRandom(seed);
    const points = [];
    const faceCount = geometry.index ? geometry.index.count / 3 : pos.count / 3;

    for (let i = 0; i < count; i++) {
      if (geometry.index) {
        const fi = Math.floor(rng() * faceCount) * 3;
        const ai = geometry.index.getX(fi), bi = geometry.index.getX(fi+1), ci = geometry.index.getX(fi+2);
        const a = new THREE.Vector3().fromBufferAttribute(pos, ai);
        const b = new THREE.Vector3().fromBufferAttribute(pos, bi);
        const c = new THREE.Vector3().fromBufferAttribute(pos, ci);
        const r1 = rng(), r2 = rng();
        const u = 1 - Math.sqrt(r1), v = Math.sqrt(r1) * (1 - r2), w = Math.sqrt(r1) * r2;
        points.push(new THREE.Vector3().addScaledVector(a, u).addScaledVector(b, v).addScaledVector(c, w));
      } else {
        const vi = Math.floor(rng() * pos.count);
        points.push(new THREE.Vector3().fromBufferAttribute(pos, vi));
      }
    }
    return { points };
  }
}

class CurveToMeshNode extends GeoNode {
  constructor(id) {
    super(id, 'CURVE_TO_MESH');
    this.params = { radius: 0.05, segments: 8, points: [] };
  }
  execute({ curve }) {
    const pts = curve ?? this.params.points;
    if (!pts || pts.length < 2) return { geometry: new THREE.BufferGeometry() };
    const path = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, p.y, p.z)));
    const geo = new THREE.TubeGeometry(path, pts.length * 4, this.params.radius, this.params.segments, false);
    return { geometry: geo };
  }
}

class MathOpNode extends GeoNode {
  constructor(id) {
    super(id, 'MATH');
    this.params = { operation: 'ADD', value: 1.0 };
  }
  execute({ value }) {
    const a = value ?? 0;
    const b = this.params.value;
    const ops = { ADD: a+b, SUBTRACT: a-b, MULTIPLY: a*b, DIVIDE: b !== 0 ? a/b : 0,
                  POWER: Math.pow(a,b), SQRT: Math.sqrt(Math.abs(a)), ABS: Math.abs(a),
                  SIN: Math.sin(a), COS: Math.cos(a), MAX: Math.max(a,b), MIN: Math.min(a,b) };
    return { value: ops[this.params.operation] ?? 0 };
  }
}

class SetPositionNode extends GeoNode {
  constructor(id) {
    super(id, 'SET_POSITION');
    this.params = { offset: { x: 0, y: 0, z: 0 }, selection: 'ALL' };
  }
  execute({ geometry }) {
    if (!geometry) return { geometry };
    const geo = geometry.clone();
    const pos = geo.attributes.position;
    const off = this.params.offset;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i, pos.getX(i) + off.x, pos.getY(i) + off.y, pos.getZ(i) + off.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return { geometry: geo };
  }
}

class JoinGeometryNode extends GeoNode {
  constructor(id) { super(id, 'JOIN_GEOMETRY'); }
  execute({ geometries }) {
    if (!geometries || !geometries.length) return { geometry: new THREE.BufferGeometry() };
    let totalVerts = 0;
    geometries.forEach(g => { totalVerts += g.attributes.position.count; });
    const positions = new Float32Array(totalVerts * 3);
    const indices = [];
    let offset = 0;
    geometries.forEach(g => {
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        positions[(offset + i) * 3]     = pos.getX(i);
        positions[(offset + i) * 3 + 1] = pos.getY(i);
        positions[(offset + i) * 3 + 2] = pos.getZ(i);
      }
      if (g.index) Array.from(g.index.array).forEach(i => indices.push(i + offset));
      offset += pos.count;
    });
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (indices.length) merged.setIndex(indices);
    merged.computeVertexNormals();
    return { geometry: merged };
  }
}

class InstanceOnPointsNode extends GeoNode {
  constructor(id) {
    super(id, 'INSTANCE_ON_POINTS');
    this.params = { scale: 0.1, randomScale: 0.05, randomRotation: true };
  }
  execute({ points, instanceGeometry }) {
    if (!points || !instanceGeometry) return { geometry: new THREE.BufferGeometry() };
    const geos = points.map(pt => {
      const g = instanceGeometry.clone();
      const s = this.params.scale + (Math.random() - 0.5) * this.params.randomScale;
      g.scale(s, s, s);
      if (this.params.randomRotation) g.rotateY(Math.random() * Math.PI * 2);
      g.translate(pt.x, pt.y, pt.z);
      return g;
    });
    // Merge all instances
    const joinNode = new JoinGeometryNode('join');
    return joinNode.execute({ geometries: geos });
  }
}

class NoiseDisplaceNode extends GeoNode {
  constructor(id) {
    super(id, 'NOISE_DISPLACE');
    this.params = { scale: 1, strength: 0.2, seed: 0 };
  }
  execute({ geometry }) {
    if (!geometry) return { geometry };
    const geo = geometry.clone();
    geo.computeVertexNormals();
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const { scale, strength } = this.params;
    for (let i = 0; i < pos.count; i++) {
      const n = simpleNoise(pos.getX(i) * scale, pos.getY(i) * scale, pos.getZ(i) * scale);
      pos.setXYZ(i,
        pos.getX(i) + norm.getX(i) * n * strength,
        pos.getY(i) + norm.getY(i) * n * strength,
        pos.getZ(i) + norm.getZ(i) * n * strength,
      );
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return { geometry: geo };
  }
}

// ─── Node Registry ────────────────────────────────────────────────────────────

export const NODE_TYPES = {
  SCATTER:           ScatterNode,
  CURVE_TO_MESH:     CurveToMeshNode,
  MATH:              MathOpNode,
  SET_POSITION:      SetPositionNode,
  JOIN_GEOMETRY:     JoinGeometryNode,
  INSTANCE_ON_POINTS: InstanceOnPointsNode,
  NOISE_DISPLACE:    NoiseDisplaceNode,
};

// ─── Graph Executor ───────────────────────────────────────────────────────────

export class GeometryNodeGraph {
  constructor() {
    this.nodes = new Map();
    this.connections = []; // [{ fromId, fromPort, toId, toPort }]
    this._idCounter = 0;
  }

  addNode(type, params = {}, position = { x: 0, y: 0 }) {
    const NodeClass = NODE_TYPES[type];
    if (!NodeClass) { console.error(`[GeometryNodes] Unknown node type: ${type}`); return null; }
    const id = `node_${++this._idCounter}`;
    const node = new NodeClass(id);
    Object.assign(node.params, params);
    node.position = position;
    this.nodes.set(id, node);
    return id;
  }

  removeNode(id) {
    this.nodes.delete(id);
    this.connections = this.connections.filter(c => c.fromId !== id && c.toId !== id);
  }

  connect(fromId, fromPort, toId, toPort) {
    this.connections.push({ fromId, fromPort, toId, toPort });
  }

  disconnect(fromId, fromPort, toId, toPort) {
    this.connections = this.connections.filter(c =>
      !(c.fromId === fromId && c.fromPort === fromPort && c.toId === toId && c.toPort === toPort)
    );
  }

  updateParams(id, params) {
    const node = this.nodes.get(id);
    if (node) Object.assign(node.params, params);
  }

  execute(rootId, initialInputs = {}) {
    const cache = new Map();

    const run = (nodeId) => {
      if (cache.has(nodeId)) return cache.get(nodeId);
      const node = this.nodes.get(nodeId);
      if (!node) return {};

      // Gather inputs from connected nodes
      const inputData = { ...initialInputs };
      this.connections.filter(c => c.toId === nodeId).forEach(conn => {
        const upstream = run(conn.fromId);
        inputData[conn.toPort] = upstream[conn.fromPort];
      });

      const result = node.execute(inputData);
      cache.set(nodeId, result);
      return result;
    };

    return run(rootId);
  }

  serialize() {
    const nodes = [];
    this.nodes.forEach((node, id) => {
      nodes.push({ id, type: node.type, params: node.params, position: node.position });
    });
    return { nodes, connections: this.connections };
  }

  deserialize(data) {
    data.nodes.forEach(n => {
      const id = this.addNode(n.type, n.params, n.position);
      // Override auto-generated id with saved id
      const node = this.nodes.get(id);
      this.nodes.delete(id);
      node.id = n.id;
      this.nodes.set(n.id, node);
    });
    data.connections.forEach(c => this.connect(c.fromId, c.fromPort, c.toId, c.toPort));
  }
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function simpleNoise(x, y, z) {
  return Math.sin(x * 1.7 + y * 2.3) * Math.cos(y * 1.1 + z * 3.7) * Math.sin(z * 2.9 + x * 1.3);
}

export default GeometryNodeGraph;


// ─── Legacy functional exports (App.jsx compat) ───────────────────────────────

export function createNode(type, params = {}, position = { x: 0, y: 0 }) {
  const graph = new GeometryNodeGraph();
  return { nodeId: graph.addNode(type, params, position), graph };
}

export function createGraph() {
  return new GeometryNodeGraph();
}

export function addNode(graph, type, params = {}, position = { x: 0, y: 0 }) {
  return graph.addNode(type, params, position);
}

export function connectNodes(graph, fromId, fromPort, toId, toPort) {
  graph.connect(fromId, fromPort, toId, toPort);
}

export function evaluateGraph(graph, rootId, inputs = {}) {
  return graph.execute(rootId, inputs);
}
