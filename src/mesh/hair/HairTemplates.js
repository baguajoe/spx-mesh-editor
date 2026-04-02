/**
 * HairTemplates.js — SPX Mesh Editor
 * 16 hair style presets with full parameter sets for the HairSystem.
 * Each template includes density, physics, shader, and LOD settings.
 */

export const HAIR_TEMPLATES = {

  shortBuzz: {
    name: 'Short Buzz',
    cardCount: 200, density: 0.95, cardWidth: 0.008, cardLength: 0.03,
    rootColor: '#1a1008', tipColor: '#2a1808',
    wave: 0.00, curl: 0.00, frizz: 0.02, flyaways: 0.02,
    stiffness: 0.98, damping: 0.99, windStr: 0.02, gravity: 0.05,
    shaderType: 'Kajiya-Kay', specPower: 60, specShift: 0.03,
    lod: [200, 100, 50, 20],
  },

  pixieCut: {
    name: 'Pixie Cut',
    cardCount: 350, density: 0.85, cardWidth: 0.010, cardLength: 0.08,
    rootColor: '#2a1808', tipColor: '#4a2810',
    wave: 0.05, curl: 0.02, frizz: 0.08, flyaways: 0.06,
    stiffness: 0.90, damping: 0.92, windStr: 0.08, gravity: 0.20,
    shaderType: 'Kajiya-Kay', specPower: 70, specShift: 0.04,
    lod: [350, 180, 80, 30],
  },

  bobCut: {
    name: 'Bob Cut',
    cardCount: 450, density: 0.80, cardWidth: 0.011, cardLength: 0.18,
    rootColor: '#1a1008', tipColor: '#3a2010',
    wave: 0.08, curl: 0.01, frizz: 0.06, flyaways: 0.08,
    stiffness: 0.80, damping: 0.88, windStr: 0.15, gravity: 0.35,
    shaderType: 'Kajiya-Kay', specPower: 80, specShift: 0.04,
    lod: [450, 220, 100, 40],
  },

  longStraight: {
    name: 'Long Straight',
    cardCount: 600, density: 0.75, cardWidth: 0.012, cardLength: 0.40,
    rootColor: '#0a0808', tipColor: '#2a1808',
    wave: 0.00, curl: 0.00, frizz: 0.04, flyaways: 0.06,
    stiffness: 0.65, damping: 0.85, windStr: 0.30, gravity: 0.55,
    shaderType: 'Kajiya-Kay', specPower: 90, specShift: 0.05,
    lod: [600, 300, 120, 50],
  },

  longWavy: {
    name: 'Long Wavy',
    cardCount: 550, density: 0.72, cardWidth: 0.012, cardLength: 0.38,
    rootColor: '#4a2810', tipColor: '#8a5020',
    wave: 0.30, curl: 0.05, frizz: 0.12, flyaways: 0.10,
    stiffness: 0.60, damping: 0.83, windStr: 0.35, gravity: 0.50,
    shaderType: 'Kajiya-Kay', specPower: 75, specShift: 0.04,
    lod: [550, 280, 110, 45],
  },

  curlyLoose: {
    name: 'Loose Curls',
    cardCount: 500, density: 0.70, cardWidth: 0.010, cardLength: 0.30,
    rootColor: '#2a1808', tipColor: '#6a3818',
    wave: 0.20, curl: 0.45, frizz: 0.18, flyaways: 0.14,
    stiffness: 0.55, damping: 0.80, windStr: 0.20, gravity: 0.40,
    shaderType: 'Kajiya-Kay', specPower: 65, specShift: 0.035,
    lod: [500, 250, 100, 40],
  },

  tightCoils: {
    name: 'Tight Coils',
    cardCount: 480, density: 0.80, cardWidth: 0.009, cardLength: 0.20,
    rootColor: '#1a0a04', tipColor: '#3a1808',
    wave: 0.15, curl: 0.75, frizz: 0.25, flyaways: 0.18,
    stiffness: 0.45, damping: 0.75, windStr: 0.15, gravity: 0.30,
    shaderType: 'Kajiya-Kay', specPower: 55, specShift: 0.03,
    lod: [480, 240, 100, 40],
  },

  afro: {
    name: 'Afro',
    cardCount: 700, density: 0.90, cardWidth: 0.008, cardLength: 0.18,
    rootColor: '#0a0804', tipColor: '#2a1808',
    wave: 0.10, curl: 0.90, frizz: 0.45, flyaways: 0.28,
    stiffness: 0.35, damping: 0.65, windStr: 0.10, gravity: 0.15,
    shaderType: 'Kajiya-Kay', specPower: 45, specShift: 0.025,
    lod: [700, 350, 140, 60],
  },

  ponytail: {
    name: 'Ponytail',
    cardCount: 500, density: 0.80, cardWidth: 0.011, cardLength: 0.35,
    rootColor: '#2a1808', tipColor: '#6a3818',
    wave: 0.12, curl: 0.03, frizz: 0.08, flyaways: 0.10,
    stiffness: 0.58, damping: 0.82, windStr: 0.40, gravity: 0.60,
    shaderType: 'Kajiya-Kay', specPower: 80, specShift: 0.04,
    lod: [500, 250, 100, 40],
  },

  bun: {
    name: 'Bun',
    cardCount: 300, density: 0.85, cardWidth: 0.010, cardLength: 0.12,
    rootColor: '#2a1808', tipColor: '#4a2810',
    wave: 0.05, curl: 0.10, frizz: 0.06, flyaways: 0.12,
    stiffness: 0.88, damping: 0.92, windStr: 0.05, gravity: 0.10,
    shaderType: 'Kajiya-Kay', specPower: 70, specShift: 0.04,
    lod: [300, 150, 60, 25],
  },

  mohawk: {
    name: 'Mohawk',
    cardCount: 250, density: 0.90, cardWidth: 0.012, cardLength: 0.14,
    rootColor: '#0a0808', tipColor: '#1a1208',
    wave: 0.00, curl: 0.00, frizz: 0.05, flyaways: 0.04,
    stiffness: 0.95, damping: 0.97, windStr: 0.08, gravity: 0.10,
    shaderType: 'Kajiya-Kay', specPower: 90, specShift: 0.05,
    lod: [250, 120, 50, 20],
  },

  dreadlocks: {
    name: 'Dreadlocks',
    cardCount: 180, density: 0.75, cardWidth: 0.018, cardLength: 0.45,
    rootColor: '#1a0a04', tipColor: '#3a1808',
    wave: 0.05, curl: 0.10, frizz: 0.30, flyaways: 0.20,
    stiffness: 0.72, damping: 0.88, windStr: 0.25, gravity: 0.50,
    shaderType: 'PBR', specPower: 40, specShift: 0.02,
    lod: [180, 90, 40, 15],
  },

  highlight: {
    name: 'Highlighted',
    cardCount: 550, density: 0.75, cardWidth: 0.011, cardLength: 0.35,
    rootColor: '#1a1008', tipColor: '#d0b060',
    wave: 0.10, curl: 0.02, frizz: 0.08, flyaways: 0.08,
    stiffness: 0.65, damping: 0.85, windStr: 0.28, gravity: 0.50,
    shaderType: 'Kajiya-Kay', specPower: 95, specShift: 0.05,
    lod: [550, 275, 110, 45],
  },

  platinum: {
    name: 'Platinum Blonde',
    cardCount: 580, density: 0.78, cardWidth: 0.011, cardLength: 0.32,
    rootColor: '#c8c0a0', tipColor: '#f0e8d0',
    wave: 0.08, curl: 0.01, frizz: 0.06, flyaways: 0.07,
    stiffness: 0.68, damping: 0.86, windStr: 0.28, gravity: 0.48,
    shaderType: 'Kajiya-Kay', specPower: 110, specShift: 0.06,
    lod: [580, 290, 116, 46],
  },

  red: {
    name: 'Vibrant Red',
    cardCount: 520, density: 0.74, cardWidth: 0.011, cardLength: 0.30,
    rootColor: '#6a1008', tipColor: '#cc2808',
    wave: 0.12, curl: 0.04, frizz: 0.10, flyaways: 0.09,
    stiffness: 0.62, damping: 0.84, windStr: 0.30, gravity: 0.48,
    shaderType: 'Kajiya-Kay', specPower: 85, specShift: 0.045,
    lod: [520, 260, 104, 42],
  },

  anime: {
    name: 'Anime Style',
    cardCount: 120, density: 0.90, cardWidth: 0.025, cardLength: 0.35,
    rootColor: '#1a1a3a', tipColor: '#6060c0',
    wave: 0.00, curl: 0.00, frizz: 0.00, flyaways: 0.02,
    stiffness: 0.95, damping: 0.98, windStr: 0.05, gravity: 0.08,
    shaderType: 'PBR', specPower: 120, specShift: 0.06,
    lod: [120, 60, 30, 12],
  },
};

export function getTemplate(name) {
  return HAIR_TEMPLATES[name] ?? HAIR_TEMPLATES.longStraight;
}

export function listTemplates() {
  return Object.entries(HAIR_TEMPLATES).map(([key, t]) => ({
    key, name: t.name, length: t.cardLength, curl: t.curl,
  }));
}

export function applyTemplate(hairSystem, templateName) {
  const t = getTemplate(templateName);
  if (!hairSystem) return t;
  hairSystem.setConfig({
    cardCount: t.cardCount, density: t.density,
    cardWidth: t.cardWidth, cardLength: t.cardLength,
    rootColor: t.rootColor, tipColor: t.tipColor,
    stiffness: t.stiffness, damping: t.damping,
    windStr:   t.windStr,   gravity: t.gravity,
  });
  return t;
}

export function blendTemplates(nameA, nameB, t) {
  const a = getTemplate(nameA), b = getTemplate(nameB);
  const lerp = (x, y) => typeof x === 'number' && typeof y === 'number' ? x + (y - x) * t : x;
  return Object.fromEntries(
    Object.keys(a).map(k => [k, lerp(a[k], b[k])])
  );
}

export function findClosestTemplate(params) {
  let best = null, bestScore = Infinity;
  Object.entries(HAIR_TEMPLATES).forEach(([key, t]) => {
    const score = Math.abs(t.cardLength - (params.length ?? 0.25)) * 2 +
                  Math.abs(t.curl - (params.curl ?? 0)) +
                  Math.abs(t.density - (params.density ?? 0.75));
    if (score < bestScore) { bestScore = score; best = key; }
  });
  return best;
}

export default HAIR_TEMPLATES;

export function getTemplatesByLength(minLen, maxLen) {
  return Object.entries(HAIR_TEMPLATES)
    .filter(([, t]) => t.cardLength >= minLen && t.cardLength <= maxLen)
    .map(([key, t]) => ({ key, ...t }));
}

export function getTemplatesByCurliness(minCurl, maxCurl) {
  return Object.entries(HAIR_TEMPLATES)
    .filter(([, t]) => t.curl >= minCurl && t.curl <= maxCurl)
    .map(([key, t]) => ({ key, ...t }));
}

export function getRandomTemplate(seed = Math.random()) {
  const keys = Object.keys(HAIR_TEMPLATES);
  return keys[Math.floor(seed * keys.length)];
}

export function estimateTemplateCost(templateName) {
  const t = getTemplate(templateName);
  const tris = t.cardCount * 8 * 2;
  return { cards: t.cardCount, tris, tier: tris < 30000 ? 'Fast' : tris < 80000 ? 'Medium' : 'Heavy' };
}

export function exportTemplateAsJSON(templateName) {
  return JSON.stringify({ name: templateName, ...getTemplate(templateName), exportedAt: new Date().toISOString() });
}

export function importTemplateFromJSON(json) {
  try {
    const data = JSON.parse(json);
    const { name, exportedAt, ...params } = data;
    return { name: name ?? 'Imported', params };
  } catch { return null; }
}

export function getTemplateColorScheme(templateName) {
  const t = getTemplate(templateName);
  return { rootColor: t.rootColor, tipColor: t.tipColor,
    isDark:  parseInt(t.rootColor.slice(1,3),16) < 64,
    isLight: parseInt(t.rootColor.slice(1,3),16) > 180 };
}

export function getTemplatePhysicsClass(templateName) {
  const t = getTemplate(templateName);
  if (t.stiffness > 0.85) return 'Rigid';
  if (t.stiffness > 0.65) return 'Stiff';
  if (t.stiffness > 0.45) return 'Normal';
  if (t.stiffness > 0.30) return 'Soft';
  return 'Loose';
}

export function scaleTemplate(templateName, scaleFactor) {
  const t = { ...getTemplate(templateName) };
  t.cardLength  *= scaleFactor;
  t.cardWidth   *= Math.sqrt(scaleFactor);
  t.cardCount    = Math.round(t.cardCount * scaleFactor);
  return t;
}

export const TEMPLATE_CATEGORIES = {
  Short:   ['shortBuzz','pixieCut','bobCut','mohawk'],
  Medium:  ['longWavy','curlyLoose','ponytail','bun','dreadlocks'],
  Long:    ['longStraight','tightCoils','afro','highlight','platinum','red'],
  Fantasy: ['anime'],
};

export function getTemplatesByCategory(category) {
  return (TEMPLATE_CATEGORIES[category] ?? []).map(key => ({ key, ...getTemplate(key) }));
}

export function buildTemplateVariant(base, overrides) {
  return { ...HAIR_TEMPLATES[base] ?? HAIR_TEMPLATES.longStraight, ...overrides };
}
export function computeTemplateSimilarity(nameA, nameB) {
  const a = HAIR_TEMPLATES[nameA], b = HAIR_TEMPLATES[nameB];
  if (!a || !b) return 0;
  const fields = ['cardLength','curl','density','stiffness','windStr'];
  const diff = fields.reduce((s, k) => s + Math.abs((a[k]??0)-(b[k]??0)), 0);
  return Math.max(0, 1 - diff / fields.length);
}
export function getTemplateTransitionTime(fromName, toName, fps=30) {
  const sim = computeTemplateSimilarity(fromName, toName);
  const frames = Math.round((1-sim) * fps * 2);
  return { frames, seconds: (frames/fps).toFixed(2) };
}
export function getTemplatesForAge(age) {
  if (age < 20) return ['shortBuzz','pixieCut','mohawk','anime'];
  if (age < 40) return ['longStraight','longWavy','curlyLoose','bobCut','ponytail','bun'];
  if (age < 60) return ['bobCut','longWavy','bun','dreadlocks'];
  return ['shortBuzz','pixieCut','bobCut'];
}
export function applyTemplateToConfig(template, existingConfig) {
  return { ...existingConfig, cardCount:template.cardCount, density:template.density,
    cardWidth:template.cardWidth, cardLength:template.cardLength,
    rootColor:template.rootColor, tipColor:template.tipColor,
    stiffness:template.stiffness, damping:template.damping };
}

export function buildTemplatePreviewConfig(templateName) {
  const t = getTemplate(templateName);
  return { ...t, cardCount: Math.min(t.cardCount, 100), density: 0.5, enablePhysics: false, enableLOD: false };
}
export function getTemplatesForScene(sceneType) {
  const map = {
    'Game':    Object.keys(HAIR_TEMPLATES).filter(k=>HAIR_TEMPLATES[k].cardCount<300),
    'Film':    Object.keys(HAIR_TEMPLATES).filter(k=>HAIR_TEMPLATES[k].cardCount>=400),
    'Mobile':  Object.keys(HAIR_TEMPLATES).filter(k=>HAIR_TEMPLATES[k].cardCount<200),
    'Preview': Object.keys(HAIR_TEMPLATES).slice(0,6),
  };
  return (map[sceneType]??Object.keys(HAIR_TEMPLATES)).map(k=>({key:k,...HAIR_TEMPLATES[k]}));
}
export function getTemplateWindResponse(templateName) {
  const t = getTemplate(templateName);
  const response = t.windStr * (1-t.stiffness);
  return { windStr:t.windStr, stiffness:t.stiffness, response: response.toFixed(3),
    tier: response<0.1?'Minimal':response<0.25?'Moderate':response<0.4?'High':'Very High' };
}
export function mutateTemplate(templateName, mutationRate=0.1, seed=42) {
  let s=seed; const rng=()=>{s=(s*9301+49297)%233280;return s/233280;};
  const t   = {...getTemplate(templateName)};
  const numericKeys = ['cardCount','density','cardWidth','cardLength','stiffness','damping','windStr','gravity'];
  numericKeys.forEach(k=>{
    if(typeof t[k]==='number') t[k] = Math.max(0.01, t[k]*(1+(rng()-0.5)*mutationRate*2));
  });
  t.cardCount = Math.round(t.cardCount);
  return t;
}
export function rankTemplatesByPerformance() {
  return Object.entries(HAIR_TEMPLATES)
    .map(([key,t])=>({ key, name:t.name, score: t.cardCount*(t.cardLength+1)*(1+t.curl) }))
    .sort((a,b)=>a.score-b.score)
    .map((t,i)=>({...t, rank:i+1}));
}
export function getTemplateLODConfigs(templateName) {
  const t = getTemplate(templateName);
  return [0,1,2,3].map(lod=>({
    lod, cardCount:Math.round(t.cardCount*Math.pow(0.5,lod)),
    segments:Math.max(2,(t.segments??8)-lod*2), label:['Full','High','Mid','Low'][lod],
  }));
}

export function buildTemplateGrid(cols=4) {
  const keys=Object.keys(HAIR_TEMPLATES);
  const rows=Math.ceil(keys.length/cols);
  return Array.from({length:rows},(_,r)=>keys.slice(r*cols,(r+1)*cols).map(k=>({key:k,...HAIR_TEMPLATES[k]})));
}
export function getTemplateByIndex(idx) {
  const keys=Object.keys(HAIR_TEMPLATES);
  return keys[((idx%keys.length)+keys.length)%keys.length];
}
export function computeTemplateComplexityScore(templateName) {
  const t=getTemplate(templateName);
  return (t.cardCount/100)*(1+t.curl*2)*(1+t.frizz*2)*(t.cardLength*3);
}
export function getTemplatesForEthnicity(ethnicity) {
  const map={
    Asian:   ['longStraight','bobCut','shortBuzz','longWavy'],
    African: ['afro','tightCoils','dreadlocks','mohawk'],
    European:['longWavy','longStraight','curlyLoose','bobCut','pixieCut'],
    Latino:  ['longWavy','curlyLoose','longStraight','ponytail'],
    Mixed:   Object.keys(HAIR_TEMPLATES),
  };
  return (map[ethnicity]??map.Mixed).map(k=>({key:k,...getTemplate(k)}));
}
export function getTemplateHairTexture(templateName) {
  const t=getTemplate(templateName);
  if(t.curl>0.6) return 'Kinky';
  if(t.curl>0.3) return 'Curly';
  if(t.wave>0.2||t.curl>0.1) return 'Wavy';
  return 'Straight';
}
export function sortTemplatesByCardLength() {
  return Object.entries(HAIR_TEMPLATES)
    .sort((a,b)=>a[1].cardLength-b[1].cardLength)
    .map(([key,t])=>({key,name:t.name,length:t.cardLength}));
}

export function getTemplateAgeRange(templateName) {
  const map={shortBuzz:[16,80],pixieCut:[18,70],bobCut:[20,65],longStraight:[15,55],
    longWavy:[15,55],curlyLoose:[16,60],tightCoils:[16,60],afro:[16,60],
    ponytail:[15,45],bun:[20,60],mohawk:[16,35],dreadlocks:[18,55],
    highlight:[20,50],platinum:[20,45],red:[16,40],anime:[14,30]};
  return map[templateName]??[16,80];
}
export function isTemplateAgeAppropriate(templateName, age) {
  const [min,max]=getTemplateAgeRange(templateName);
  return age>=min && age<=max;
}
export function getTemplateWindEffect(templateName) {
  const t=getTemplate(templateName);
  const effect=(1-t.stiffness)*t.windStr*(t.cardLength+0.1);
  return {low:effect<0.05,medium:effect<0.15,high:effect>=0.15,value:effect.toFixed(3)};
}
export function buildTemplateComparisonTable(names) {
  return names.map(name=>{
    const t=getTemplate(name);
    return {name,cards:t.cardCount,length:t.cardLength.toFixed(2),
      curl:t.curl.toFixed(2),stiffness:t.stiffness.toFixed(2),
      windStr:t.windStr.toFixed(2),rootColor:t.rootColor};
  });
}
export function getTemplateSearchResults(query) {
  const q=query.toLowerCase();
  return Object.entries(HAIR_TEMPLATES)
    .filter(([k,t])=>k.includes(q)||t.name.toLowerCase().includes(q))
    .map(([key,t])=>({key,...t}));
}
export function computeTemplateTransitionFrames(from, to, fps=30) {
  const a=getTemplate(from), b=getTemplate(to);
  const delta=Math.abs(a.cardLength-b.cardLength)+Math.abs(a.curl-b.curl)*0.5+Math.abs(a.stiffness-b.stiffness)*0.3;
  return Math.round(fps*delta*3);
}
