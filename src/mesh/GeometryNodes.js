import * as THREE from "three";

// ── Node types ────────────────────────────────────────────────────────────────
export const NODE_TYPES = {
  input:     { label: "Input Mesh",   color: "#00ffc8", outputs: ["geometry"] },
  output:    { label: "Output",       color: "#FF6600", inputs:  ["geometry"] },
  transform: { label: "Transform",    color: "#4488ff", inputs:  ["geometry"], outputs: ["geometry"] },
  array:     { label: "Array",        color: "#8844ff", inputs:  ["geometry"], outputs: ["geometry"] },
  merge:     { label: "Merge",        color: "#44ff88", inputs:  ["geometry","geometry"], outputs: ["geometry"] },
  noise:     { label: "Noise Deform", color: "#ff8844", inputs:  ["geometry"], outputs: ["geometry"] },
  subdivide: { label: "Subdivide",    color: "#44ffff", inputs:  ["geometry"], outputs: ["geometry"] },
  decimate:  { label: "Decimate",     color: "#ff4444", inputs:  ["geometry"], outputs: ["geometry"] },
  boolean:   { label: "Boolean",      color: "#ffff44", inputs:  ["geometry","geometry"], outputs: ["geometry"] },
};

// ── Create node ───────────────────────────────────────────────────────────────
export function createNode(type, position = { x: 0, y: 0 }) {
  return {
    id:       crypto.randomUUID(),
    type,
    position,
    params:   getDefaultParams(type),
    inputs:   {},  // { slotName: connectedNodeId }
    outputs:  {},  // { slotName: [connectedNodeId] }
  };
}

function getDefaultParams(type) {
  switch (type) {
    case "transform":  return { tx:0, ty:0, tz:0, rx:0, ry:0, rz:0, sx:1, sy:1, sz:1 };
    case "array":      return { count:3, offsetX:1, offsetY:0, offsetZ:0 };
    case "noise":      return { scale:1, strength:0.2, seed:42 };
    case "subdivide":  return { levels:1 };
    case "decimate":   return { ratio:0.5 };
    case "boolean":    return { operation:"union" };
    default:           return {};
  }
}

// ── Create graph ──────────────────────────────────────────────────────────────
export function createGraph() {
  return { nodes: [], connections: [] };
}

// ── Add node to graph ─────────────────────────────────────────────────────────
export function addNode(graph, type, position) {
  const node = createNode(type, position);
  graph.nodes.push(node);
  return node;
}

// ── Connect nodes ─────────────────────────────────────────────────────────────
export function connectNodes(graph, fromId, fromSlot, toId, toSlot) {
  graph.connections.push({ fromId, fromSlot, toId, toSlot });
  const toNode = graph.nodes.find(n => n.id === toId);
  if (toNode) toNode.inputs[toSlot] = fromId;
}

// ── Evaluate graph ────────────────────────────────────────────────────────────
export function evaluateGraph(graph, inputMesh) {
  const cache = {};

  const evaluate = (nodeId) => {
    if (cache[nodeId]) return cache[nodeId];
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    // Gather inputs
    const inputs = {};
    Object.entries(node.inputs).forEach(([slot, srcId]) => {
      inputs[slot] = evaluate(srcId);
    });

    const result = applyNode(node, inputs, inputMesh);
    cache[nodeId] = result;
    return result;
  };

  // Find output node
  const outputNode = graph.nodes.find(n => n.type === "output");
  if (!outputNode) return inputMesh;
  return evaluate(outputNode.id) || inputMesh;
}

// ── Apply node operation ──────────────────────────────────────────────────────
function applyNode(node, inputs, inputMesh) {
  const geo = (inputs.geometry || inputMesh)?.geometry?.clone() || inputMesh?.geometry?.clone();
  if (!geo) return inputMesh;

  switch (node.type) {
    case "input":  return inputMesh;
    case "output": return inputs.geometry || inputMesh;

    case "transform": {
      const { tx,ty,tz,rx,ry,rz,sx,sy,sz } = node.params;
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setXYZ(i,
          pos.getX(i)*sx + tx,
          pos.getY(i)*sy + ty,
          pos.getZ(i)*sz + tz,
        );
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, inputMesh.material.clone());
    }

    case "array": {
      const { count, offsetX, offsetY, offsetZ } = node.params;
      const positions = [], indices = [];
      let   vi = 0;
      const srcPos = geo.attributes.position;
      const srcIdx = geo.index?.array || [];

      for (let c = 0; c < count; c++) {
        for (let i = 0; i < srcPos.count; i++) {
          positions.push(
            srcPos.getX(i) + offsetX * c,
            srcPos.getY(i) + offsetY * c,
            srcPos.getZ(i) + offsetZ * c,
          );
        }
        for (let i = 0; i < srcIdx.length; i++) {
          indices.push(srcIdx[i] + vi);
        }
        vi += srcPos.count;
      }

      const newGeo = new THREE.BufferGeometry();
      newGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
      if (indices.length) newGeo.setIndex(indices);
      newGeo.computeVertexNormals();
      return new THREE.Mesh(newGeo, inputMesh.material.clone());
    }

    case "noise": {
      const { scale, strength, seed } = node.params;
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const nx = Math.sin(pos.getX(i) * scale + seed) * strength;
        const ny = Math.sin(pos.getY(i) * scale + seed + 1) * strength;
        const nz = Math.sin(pos.getZ(i) * scale + seed + 2) * strength;
        pos.setXYZ(i, pos.getX(i)+nx, pos.getY(i)+ny, pos.getZ(i)+nz);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, inputMesh.material.clone());
    }

    case "subdivide": {
      let g = geo;
      for (let l = 0; l < (node.params.levels || 1); l++) {
        g = simpleSubdivide(g);
      }
      return new THREE.Mesh(g, inputMesh.material.clone());
    }

    case "decimate": {
      const ratio = node.params.ratio || 0.5;
      const idx   = geo.index;
      if (idx) {
        const keep = Math.max(3, Math.floor(idx.count * ratio / 3) * 3);
        geo.setIndex(Array.from(idx.array.slice(0, keep)));
      }
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, inputMesh.material.clone());
    }

    default: return inputs.geometry || inputMesh;
  }
}

function simpleSubdivide(geo) {
  const pos   = geo.attributes.position;
  const idx   = geo.index;
  if (!idx) return geo;
  const arr   = idx.array;
  const newP  = [];
  const newI  = [];
  const mids  = new Map();
  let   vi    = pos.count;

  for (let i = 0; i < pos.count; i++) newP.push(pos.getX(i), pos.getY(i), pos.getZ(i));

  const mid = (a, b) => {
    const k = Math.min(a,b)+"_"+Math.max(a,b);
    if (mids.has(k)) return mids.get(k);
    newP.push((pos.getX(a)+pos.getX(b))/2,(pos.getY(a)+pos.getY(b))/2,(pos.getZ(a)+pos.getZ(b))/2);
    mids.set(k, vi); return vi++;
  };

  for (let i = 0; i < arr.length; i+=3) {
    const [a,b,c] = [arr[i],arr[i+1],arr[i+2]];
    const ab=mid(a,b), bc=mid(b,c), ca=mid(c,a);
    newI.push(a,ab,ca, ab,b,bc, ca,bc,c, ab,bc,ca);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(newP), 3));
  g.setIndex(newI);
  g.computeVertexNormals();
  return g;
}
