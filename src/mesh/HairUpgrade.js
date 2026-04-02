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

export function compareVersions(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function needsUpgrade(data) {
  return detectVersion(data) < CURRENT_VERSION;
}

export function safeUpgrade(data) {
  try {
    const migrated = migrate(data);
    const repaired = repairHairData(migrated);
    return { success:true, data: stampVersion(repaired) };
  } catch (e) {
    return { success:false, error: e.message, data: repairHairData(data) };
  }
}

export function buildUpgradeReport(data) {
  const fromVersion = detectVersion(data);
  const path        = getUpgradePath(fromVersion);
  const validation  = validateHairData(data);
  return {
    currentVersion: fromVersion,
    targetVersion:  CURRENT_VERSION,
    needsUpgrade:   fromVersion < CURRENT_VERSION,
    upgradePath:    path,
    validation,
    fieldCount:     Object.keys(data).length,
    estimatedSafety: validation.errors.length === 0 ? 'Safe' : 'Needs Repair',
  };
}

export function createVersionedSnapshot(data, label) {
  return {
    label,
    version:     detectVersion(data),
    data:        JSON.parse(JSON.stringify(data)),
    createdAt:   new Date().toISOString(),
    fingerprint: JSON.stringify(data).length,
  };
}

export function mergeHairConfigs(base, override) {
  const merged = { ...repairHairData(base) };
  Object.entries(override).forEach(([k, v]) => {
    if (v !== undefined && v !== null) merged[k] = v;
  });
  return repairHairData(merged);
}

export const DEFAULT_HAIR_DATA = {
  version:    CURRENT_VERSION,
  cards:      300,
  density:    0.75,
  rootColor:  '#2a1808',
  tipColor:   '#8a5020',
  stiffness:  0.70,
  damping:    0.85,
  windStr:    0.40,
  gravity:    0.50,
  shaderType: 'Kajiya-Kay',
  layers:     [
    { type:'Base',     density:1.0, opacity:1.0, enabled:true, length:1.0, width:1.0 },
    { type:'Flyaway',  density:0.15,opacity:1.0, enabled:true, length:0.7, width:0.5 },
  ],
  lod: { enabled:true, distances:[0,3,8,20,50], fractions:[1,0.6,0.3,0.1,0], hysteresis:0.5 },
  physics: { enabled:true, iterations:4, substeps:2 },
  grooming: { strokes:[], historyLength:32 },
};

export function createDefaultHairData() { return JSON.parse(JSON.stringify(DEFAULT_HAIR_DATA)); }

export function canMigrate(data) {
  const v = detectVersion(data);
  return v > 0 && v <= CURRENT_VERSION;
}
export function getSchemaFields(version) {
  const v = Math.min(version, CURRENT_VERSION);
  const schemas = {
    1:['cards','rootColor','tipColor'],
    2:['cards','rootColor','tipColor','density','stiffness','damping'],
    3:['version','cards','rootColor','tipColor','density','stiffness','damping','windStr','gravity','shaderType'],
    4:['version','cards','rootColor','tipColor','density','stiffness','damping','windStr','gravity','shaderType','layers','lod','physics','grooming'],
  };
  return schemas[v] ?? schemas[1];
}
export function summarizeHairData(data) {
  return {
    version: detectVersion(data), cards: data.cards,
    rootColor: data.rootColor, tipColor: data.tipColor,
    hasLayers: Array.isArray(data.layers) && data.layers.length > 0,
    hasPhysics: !!data.physics?.enabled, hasLOD: !!data.lod?.enabled,
    hasGrooming: Array.isArray(data.grooming?.strokes),
    fieldCount: Object.keys(data).length,
  };
}
export function isCompatibleVersion(data, minVersion=1, maxVersion=CURRENT_VERSION) {
  const v = detectVersion(data);
  return v >= minVersion && v <= maxVersion;
}
export function getUpgradeSizeEstimate(data) {
  const from = detectVersion(data);
  const additions = { '1→2':3, '2→3':5, '3→4':8 };
  let fields = 0;
  for (let v=from; v<CURRENT_VERSION; v++) fields += additions[`${v}→${v+1}`]??2;
  return { additionalFields:fields, estimatedBytes: fields * 20 };
}
export function autoUpgradeIfNeeded(data) {
  if (!needsUpgrade(data)) return { data, upgraded:false };
  const result = safeUpgrade(data);
  return { data: result.data, upgraded:result.success, error: result.error };
}

export function buildMigrationLog(data) {
  const fromV  = detectVersion(data);
  const log    = [];
  let current  = { ...data };
  for (let v = fromV; v < CURRENT_VERSION; v++) {
    const key = `${v}→${v+1}`;
    const fn  = { '1→2': d=>({...d,density:0.75,stiffness:0.70,damping:0.85}),
                  '2→3': d=>({...d,version:3,windStr:0.40,gravity:0.50,shaderType:'Kajiya-Kay'}),
                  '3→4': d=>({...d,version:4,lod:{enabled:true},physics:{enabled:true},grooming:{strokes:[]}}) }[key];
    if (fn) { const before=JSON.stringify(current); current=fn(current); log.push({step:key,addedFields:Object.keys(current).filter(k=>!(k in JSON.parse(before)))}); }
  }
  return { fromVersion:fromV, toVersion:CURRENT_VERSION, steps:log };
}
export function stripUnknownFields(data) {
  const known = getSchemaFields(CURRENT_VERSION);
  const extra = ['physics','grooming','accessories','lod','layers'];
  const allowed = [...known, ...extra];
  return Object.fromEntries(Object.entries(data).filter(([k])=>allowed.includes(k)));
}
export function computeDataFingerprint(data) {
  const str = JSON.stringify(data, Object.keys(data).sort());
  let h = 0;
  for (const c of str) h = (Math.imul(31,h) + c.charCodeAt(0)) | 0;
  return (h >>> 0).toString(16).padStart(8,'0');
}
export function isHairDataStale(data, maxAgeMs=86400000) {
  const age = data.updatedAt ? Date.now() - data.updatedAt : Infinity;
  return age > maxAgeMs;
}
export function buildDataDiff(before, after) {
  const added   = Object.keys(after).filter(k=>!(k in before));
  const removed = Object.keys(before).filter(k=>!(k in after));
  const changed = Object.keys(after).filter(k=>k in before && JSON.stringify(before[k])!==JSON.stringify(after[k]));
  return { added, removed, changed, hasChanges: added.length+removed.length+changed.length > 0 };
}
export function cloneHairData(data) { return JSON.parse(JSON.stringify(data)); }
export function mergeDefaults(data) { return { ...DEFAULT_HAIR_DATA, ...data }; }
export function getVersionHistory() {
  return [
    { version:1, description:'Initial format: cards, rootColor, tipColor' },
    { version:2, description:'Added density, stiffness, damping' },
    { version:3, description:'Added windStr, gravity, shaderType, layers, LOD' },
    { version:4, description:'Added physics, grooming history, accessories, full layer schema' },
  ];
}

export function generateUpgradeScript(fromVersion, toVersion=CURRENT_VERSION) {
  const path=getUpgradePath(fromVersion,toVersion);
  return [`// Auto-generated upgrade script v${fromVersion} → v${toVersion}`,
    `// Run: importHairFromJSON(json)`,
    `// Steps: ${path.join(' → ')}`,
    `module.exports={migrate,validateHairData,repairHairData,stampVersion};`,
  ].join('\n');
}
export function compareHairData(a, b) {
  const va=detectVersion(a), vb=detectVersion(b);
  const diff=buildDataDiff(a,b);
  return {versionMatch:va===vb,versionA:va,versionB:vb,...diff,
    fingerprintA:computeDataFingerprint(a), fingerprintB:computeDataFingerprint(b),
    identical:!diff.hasChanges&&va===vb};
}
export function sanitizeHairData(data) {
  const clean={...repairHairData(data)};
  delete clean.exportedAt; delete clean.valid;
  if(Array.isArray(clean.layers)) clean.layers=clean.layers.filter(l=>l&&l.type);
  return clean;
}
export function buildVersionBadge(data) {
  const v=detectVersion(data);
  return {version:v,current:CURRENT_VERSION,upToDate:v>=CURRENT_VERSION,
    label:`v${v}${v>=CURRENT_VERSION?' ✓':' (upgrade available)'}`,
    color:v>=CURRENT_VERSION?'#00ffc8':v>=2?'#f0c040':'#FF6600'};
}

export function buildSchemaDocumentation() {
  return {
    v1:{required:['cards','rootColor','tipColor'],description:'Minimal hair definition'},
    v2:{required:['density','stiffness','damping'],description:'Added physics params'},
    v3:{required:['windStr','gravity','shaderType','layers','lod'],description:'Full feature set'},
    v4:{required:['physics','grooming'],description:'Current — physics + grooming history'},
  };
}
export function getFieldDescription(fieldName) {
  const docs={
    cards:'Number of hair card strands', density:'Fraction of cards actually placed (0-1)',
    rootColor:'Hex color at strand root', tipColor:'Hex color at strand tip',
    stiffness:'How rigidly strands return to rest pose (0-1)',
    damping:'Velocity reduction per frame (0-1)', windStr:'Wind force multiplier',
    gravity:'Gravity scale (0=none, 1=full)', shaderType:'Rendering shader type',
    layers:'Array of hair layer configs', lod:'Level-of-detail settings',
    physics:'Simulation settings', grooming:'Groom stroke history',
  };
  return docs[fieldName]??'No description available';
}
export function validateLayerConfig(layer) {
  const errors=[];
  if(!layer.type) errors.push('Missing layer type');
  if(layer.density<0||layer.density>1) errors.push('Layer density out of range');
  if(layer.opacity<0||layer.opacity>1) errors.push('Layer opacity out of range');
  return {valid:errors.length===0,errors};
}
export function computeUpgradeRisk(data) {
  const v=detectVersion(data);
  if(v===CURRENT_VERSION) return {risk:'none',score:0};
  if(v>=3) return {risk:'low',score:1};
  if(v>=2) return {risk:'medium',score:2};
  return {risk:'high',score:3,note:'Old format — backup before upgrading'};
}

export function createUpgradePipeline(validators=[],migrators=[],postProcessors=[]) {
  return function run(data) {
    let result={...data};
    for(const v of validators) {
      const r=v(result);
      if(!r.valid) return {success:false,data:result,errors:r.errors};
    }
    for(const m of migrators) { result=m(result); }
    for(const p of postProcessors) { result=p(result); }
    return {success:true,data:result};
  };
}
export function buildDefaultPipeline() {
  return createUpgradePipeline(
    [d=>validateHairData(d)],
    [d=>needsUpgrade(d)?migrate(d):d],
    [d=>repairHairData(d),d=>stampVersion(d)]
  );
}
export function runPipelineOnBatch(pipeline, dataArray) {
  return dataArray.map((d,i)=>({index:i,...pipeline(d)}));
}
export function getUpgradeStatsSummary(results) {
  const ok=results.filter(r=>r.success).length;
  return {total:results.length,success:ok,failed:results.length-ok,
    rate:(ok/Math.max(1,results.length)*100).toFixed(1)+'%'};
}
