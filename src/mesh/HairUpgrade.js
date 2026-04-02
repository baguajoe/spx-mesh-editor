/**
 * HairUpgrade.js — SPX Mesh Editor
 * Hair data schema versioning: v1→v4 migrations, validation,
 * repair, diff, batch upgrade, and export/import utilities.
 */

const CURRENT_VERSION = 4;

// ─── Version schemas ──────────────────────────────────────────────────────
const SCHEMAS = {
  1: {
    required: ['cards','rootColor','tipColor'],
    optional: ['density','stiffness'],
  },
  2: {
    required: ['cards','rootColor','tipColor','density','stiffness','damping'],
    optional: ['windStr','gravity','shaderType'],
  },
  3: {
    required: ['version','cards','rootColor','tipColor','density','stiffness','damping','windStr','gravity','shaderType'],
    optional: ['layers','lod','physics'],
  },
  4: {
    required: ['version','cards','rootColor','tipColor','density','stiffness','damping','windStr','gravity','shaderType','layers','lod'],
    optional: ['physics','grooming','accessories'],
  },
};

// ─── Migrations ───────────────────────────────────────────────────────────
const MIGRATIONS = {

  '1→2': (data) => ({
    ...data,
    density:    data.density    ?? 0.75,
    stiffness:  data.stiffness  ?? 0.70,
    damping:    data.damping    ?? 0.85,
  }),

  '2→3': (data) => ({
    ...data,
    version:    3,
    windStr:    data.windStr    ?? 0.40,
    gravity:    data.gravity    ?? 0.50,
    shaderType: data.shaderType ?? 'Kajiya-Kay',
    layers:     data.layers     ?? [
      { type:'Base', density:1.0, opacity:1.0, enabled:true },
      { type:'Top',  density:0.5, opacity:1.0, enabled:true },
    ],
    lod: data.lod ?? { enabled:true, distances:[0,3,8,20,50] },
  }),

  '3→4': (data) => ({
    ...data,
    version: 4,
    layers: (data.layers ?? []).map(layer => ({
      ...layer,
      length:      layer.length      ?? 1.0,
      width:       layer.width       ?? 1.0,
      color:       layer.color       ?? data.rootColor,
      tipColor:    layer.tipColor    ?? data.tipColor,
      stiffness:   layer.stiffness   ?? data.stiffness,
    })),
    lod: {
      ...data.lod,
      fractions: data.lod?.fractions ?? [1.0, 0.6, 0.3, 0.1, 0],
      hysteresis: 0.5,
    },
    physics: data.physics ?? {
      enabled:    true,
      iterations: 4,
      substeps:   2,
    },
    grooming: data.grooming ?? { strokes:[], historyLength:32 },
  }),
};

// ─── Core API ─────────────────────────────────────────────────────────────
export function detectVersion(data) {
  if (!data || typeof data !== 'object') return 0;
  if (data.version) return data.version;
  if (data.layers && data.lod) return 3;
  if (data.damping !== undefined) return 2;
  if (data.cards)   return 1;
  return 0;
}

export function migrate(data, targetVersion = CURRENT_VERSION) {
  let current = detectVersion(data);
  let result  = { ...data };
  while (current < targetVersion) {
    const key = `${current}→${current+1}`;
    const fn  = MIGRATIONS[key];
    if (!fn) throw new Error(`No migration found: ${key}`);
    result  = fn(result);
    current = detectVersion(result);
    if (current === 0) current++;
  }
  return result;
}

export function validateHairData(data) {
  const version = detectVersion(data);
  if (version === 0) return { valid:false, errors:['Cannot detect version'], warnings:[] };
  const schema   = SCHEMAS[Math.min(version, CURRENT_VERSION)];
  const errors   = [];
  const warnings = [];
  schema.required.forEach(key => {
    if (!(key in data)) errors.push(`Missing required field: ${key}`);
  });
  if (data.density   !== undefined && (data.density   < 0 || data.density   > 1)) errors.push('density out of range 0-1');
  if (data.stiffness !== undefined && (data.stiffness < 0 || data.stiffness > 1)) errors.push('stiffness out of range 0-1');
  if (data.damping   !== undefined && (data.damping   < 0 || data.damping   > 1)) errors.push('damping out of range 0-1');
  if (version < CURRENT_VERSION) warnings.push(`Schema v${version} — upgrade to v${CURRENT_VERSION} recommended`);
  if (data.cards > 5000) warnings.push('High card count — may impact performance');
  return { valid: errors.length === 0, errors, warnings, version };
}

export function repairHairData(data) {
  const repaired = { ...data };
  repaired.density    = Math.max(0, Math.min(1, repaired.density    ?? 0.75));
  repaired.stiffness  = Math.max(0, Math.min(1, repaired.stiffness  ?? 0.70));
  repaired.damping    = Math.max(0, Math.min(1, repaired.damping    ?? 0.85));
  repaired.windStr    = Math.max(0, Math.min(5, repaired.windStr    ?? 0.40));
  repaired.gravity    = Math.max(0, Math.min(2, repaired.gravity    ?? 0.50));
  repaired.cards      = Math.max(1, Math.min(10000, repaired.cards  ?? 300));
  repaired.rootColor  = repaired.rootColor  ?? '#2a1808';
  repaired.tipColor   = repaired.tipColor   ?? '#8a5020';
  repaired.shaderType = repaired.shaderType ?? 'Kajiya-Kay';
  if (!Array.isArray(repaired.layers)) repaired.layers = [];
  return repaired;
}

export function diffHairData(before, after) {
  const changed = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  allKeys.forEach(k => {
    const bv = JSON.stringify(before[k]);
    const av = JSON.stringify(after[k]);
    if (bv !== av) changed[k] = { from: before[k], to: after[k] };
  });
  return changed;
}

export function stampVersion(data, version = CURRENT_VERSION) {
  return { ...data, version, updatedAt: Date.now() };
}

export function exportHairToJSON(data) {
  const upgraded = migrate(data);
  const valid    = validateHairData(upgraded);
  return JSON.stringify({ ...upgraded, exportedAt: new Date().toISOString(), valid: valid.valid }, null, 2);
}

export function importHairFromJSON(json) {
  try {
    const parsed  = JSON.parse(json);
    const migrated = migrate(parsed);
    const validation = validateHairData(migrated);
    return { data: validation.valid ? migrated : repairHairData(migrated), validation };
  } catch (e) {
    return { data: null, validation: { valid:false, errors:[e.message], warnings:[] } };
  }
}

export function batchUpgrade(dataArray) {
  return dataArray.map(data => {
    try { return { success:true, data: stampVersion(migrate(data)) }; }
    catch (e) { return { success:false, error: e.message, data: repairHairData(data) }; }
  });
}

export function getUpgradePath(fromVersion, toVersion = CURRENT_VERSION) {
  const path = [];
  for (let v = fromVersion; v < toVersion; v++) path.push(`v${v} → v${v+1}`);
  return path;
}

export default {
  detectVersion, migrate, validateHairData, repairHairData,
  diffHairData, stampVersion, exportHairToJSON, importHairFromJSON,
  batchUpgrade, getUpgradePath, CURRENT_VERSION,
};
