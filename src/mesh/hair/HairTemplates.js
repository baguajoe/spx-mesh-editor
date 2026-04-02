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
