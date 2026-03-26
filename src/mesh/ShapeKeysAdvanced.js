import * as THREE from "three";

export function createAdvancedShapeKey(name, mesh, opts = {}) {
  const pos  = mesh.geometry.attributes.position;
  const data = new Float32Array(pos.array);
  return {
    id:          crypto.randomUUID(),
    name,
    data,
    value:       0,
    mute:        false,
    locked:      false,
    relativeKey: opts.relativeKey || "Basis",
    driver:      opts.driver      || null,
    range:       opts.range       || [0, 1],
    sliderMin:   opts.sliderMin   || 0,
    sliderMax:   opts.sliderMax   || 1,
  };
}

export function addAdvancedShapeKey(keys, name, mesh, opts = {}) {
  const k = createAdvancedShapeKey(name, mesh, opts);
  keys.push(k);
  return k;
}

export function removeShapeKey(keys, id) {
  const i = keys.findIndex(k => k.id === id);
  if (i !== -1) keys.splice(i, 1);
  return keys;
}

export function evaluateShapeKeysAdvanced(mesh, keys) {
  if (!keys?.length || !mesh?.geometry?.attributes?.position) return;
  const pos   = mesh.geometry.attributes.position;
  const basis = keys.find(k => k.name === "Basis");
  if (!basis) return;
  for (let i = 0; i < pos.array.length; i++) pos.array[i] = basis.data[i];
  for (const key of keys) {
    if (key.name === "Basis" || key.mute || key.value === 0) continue;
    const ref = key.relativeKey && key.relativeKey !== "Basis"
      ? keys.find(k => k.name === key.relativeKey)
      : basis;
    if (!ref) continue;
    const v = Math.min(key.range[1], Math.max(key.range[0], key.value));
    for (let i = 0; i < pos.array.length; i++) pos.array[i] += (key.data[i] - ref.data[i]) * v;
  }
  pos.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

export function mirrorShapeKey(key, axis = "x") {
  const copy   = { ...key, id: crypto.randomUUID(), name: key.name + ".mirror", data: new Float32Array(key.data) };
  const axIdx  = { x: 0, y: 1, z: 2 }[axis] ?? 0;
  for (let i = 0; i < copy.data.length / 3; i++) copy.data[i * 3 + axIdx] *= -1;
  return copy;
}

export function blendShapeKeys(keys, names, weights) {
  if (!keys.length) return null;
  const basis  = keys[0];
  const result = new Float32Array(basis.data.length);
  for (let ki = 0; ki < names.length; ki++) {
    const key = keys.find(k => k.name === names[ki]);
    if (!key) continue;
    const w = weights[ki] || 0;
    for (let i = 0; i < result.length; i++) result[i] += key.data[i] * w;
  }
  return {
    id:          crypto.randomUUID(),
    name:        "Blend_" + names.join("_"),
    data:        result,
    value:       1,
    mute:        false,
    locked:      false,
    relativeKey: "Basis",
    range:       [0, 1],
  };
}

export function driverShapeKey(key, driverFn) {
  key.driver = driverFn;
  return key;
}

export function updateDriverKeys(keys, context = {}) {
  for (const k of keys) {
    if (k.driver) k.value = Math.min(k.range[1], Math.max(k.range[0], k.driver(context)));
  }
}

export function clampShapeKeyValue(key) {
  key.value = Math.min(key.range[1], Math.max(key.range[0], key.value));
  return key;
}

export function exportShapeKeysGLTF(keys) {
  return keys
    .filter(k => k.name !== "Basis")
    .map(k => ({ name: k.name, weights: [k.value], targetNames: [k.name] }));
}

export function buildMorphTargetsFromKeys(mesh, keys) {
  const basis = keys.find(k => k.name === "Basis");
  if (!basis) return;
  const targets = keys
    .filter(k => k.name !== "Basis")
    .map(key => {
      const delta = new Float32Array(basis.data.length);
      for (let i = 0; i < delta.length; i++) delta[i] = key.data[i] - basis.data[i];
      return { position: new THREE.Float32BufferAttribute(delta, 3), name: key.name };
    });
  mesh.geometry.morphAttributes.position = targets.map(t => t.position);
  mesh.morphTargetInfluences  = targets.map(() => 0);
  mesh.morphTargetDictionary  = Object.fromEntries(targets.map((t, i) => [t.name, i]));
}

export function getShapeKeyStats(keys) {
  return {
    count:  keys.length,
    active: keys.filter(k => k.value > 0 && !k.mute).length,
    driven: keys.filter(k => k.driver).length,
  };
}
