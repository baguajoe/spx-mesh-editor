/**
 * GarmentColorways.js
 * Fabric color and pattern variants for garments
 * Allows same garment in multiple colorways for presentation/export
 */

// ── Colorway system ───────────────────────────────────────────────────────────

export function createColorway(name, fabric, color, pattern = null) {
  return {
    id: `cw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    fabric,
    color,
    pattern,
    thumbnail: null,
  };
}

export const DEFAULT_COLORWAYS = {
  'Classic White': { fabric: 'cotton', color: '#FFFFFF', pattern: null },\n  'Midnight Black': { fabric: 'cotton', color: '#111111', pattern: null },\n  'Navy Denim':    { fabric: 'denim',  color: '#1a3a5c', pattern: null },\n  'Washed Denim':  { fabric: 'denim',  color: '#4a6fa5', pattern: null },\n  'Crimson Silk':  { fabric: 'silk',   color: '#8B0000', pattern: null },\n  'Ivory Silk':    { fabric: 'silk',   color: '#FFFFF0', pattern: null },\n  'Black Leather': { fabric: 'leather',color: '#1a1a1a', pattern: null },\n  'Brown Leather': { fabric: 'leather',color: '#4a2c0a', pattern: null },\n  'Stripe':        { fabric: 'cotton', color: '#FFFFFF', pattern: 'stripe' },\n  'Plaid':         { fabric: 'cotton', color: '#8B4513', pattern: 'plaid'  },\n  'Floral':        { fabric: 'silk',   color: '#FFB6C1', pattern: 'floral' },\n  'Houndstooth':   { fabric: 'wool',   color: '#222222', pattern: 'houndstooth' },\n};\n\nexport const PATTERN_TYPES = ['none', 'stripe', 'plaid', 'floral', 'houndstooth', 'polka_dot', 'geometric', 'abstract'];\n\n/**\n * Apply a colorway to a Three.js mesh material\n */\nexport function applyColorwayToMesh(mesh, colorway, THREE) {\n  if (!mesh?.material) return;\n  const color = new THREE.Color(colorway.color);\n  if (Array.isArray(mesh.material)) {\n    mesh.material.forEach(mat => { mat.color = color; mat.needsUpdate = true; });\n  } else {\n    mesh.material.color = color;\n    mesh.material.needsUpdate = true;\n  }\n}\n\n/**\n * Generate CSS gradient preview for a pattern type\n */\nexport function getPatternPreviewCSS(pattern, color) {\n  const c = color || '#ffffff';\n  const dark = '#00000033';\n  switch (pattern) {\n    case 'stripe':\n      return `repeating-linear-gradient(45deg, ${c}, ${c} 4px, ${dark} 4px, ${dark} 8px)`;\n    case 'plaid':\n      return `repeating-linear-gradient(0deg, ${dark} 0px, ${dark} 2px, transparent 2px, transparent 10px),\n              repeating-linear-gradient(90deg, ${dark} 0px, ${dark} 2px, transparent 2px, transparent 10px), ${c}`;\n    case 'polka_dot':\n      return `radial-gradient(circle, ${dark} 2px, transparent 2px) 0 0 / 8px 8px, ${c}`;\n    case 'houndstooth':\n      return `repeating-conic-gradient(${c} 0% 25%, ${dark} 0% 50%) 0 0 / 8px 8px`;\n    default:\n      return c;\n  }\n}\n\n/**\n * Create a colorway session — manages multiple colorways for one garment\n */\nexport function createColorwaySession(garmentName) {\n  return {\n    garmentName,\n    colorways: [createColorway('Default', 'cotton', '#FFFFFF')],
    activeColorwayId: null,
  };
}

export function addColorwayToSession(session, name, fabric, color, pattern) {
  const cw = createColorway(name, fabric, color, pattern);
  session.colorways.push(cw);
  session.activeColorwayId = cw.id;
  return cw;
}

export function removeColorwayFromSession(session, id) {
  session.colorways = session.colorways.filter(c => c.id !== id);
}

export function setActiveColorway(session, id) {
  session.activeColorwayId = id;
  return session.colorways.find(c => c.id === id);
}
