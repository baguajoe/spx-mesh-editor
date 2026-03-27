export const WORKSPACES_MAP = {
  MODELING: "Modeling",
  ANIMATION: "Animation",
  RENDERING: "Rendering",
  TOPOLOGY: "Topology",
  PHYSICS: "Physics",
};

// ── Array for ProfessionalShell tab bar (.map-safe) ────────────────────────
export const WORKSPACES = Object.values(WORKSPACES_MAP);

export const WORKSPACE_PANELS = {
  [WORKSPACES_MAP.MODELING]:   ["MeshEditorPanel", "PropertyInspector", "Outliner"],
  [WORKSPACES_MAP.ANIMATION]:  ["AnimationTimeline", "Outliner", "PropertyInspector"],
  [WORKSPACES_MAP.RENDERING]:  ["PathTracerPanel", "PropertyInspector"],
  [WORKSPACES_MAP.TOPOLOGY]:   ["MeshEditorPanel", "Outliner"],
  [WORKSPACES_MAP.PHYSICS]:    ["MeshEditorPanel", "PropertyInspector"],
};

// ── Feature index used by App.js FeatureIndexPanel ─────────────────────────
export const WORKSPACE_FEATURES = {
  Modeling:  ["Select", "Loop Cut", "Edge Slide", "Knife", "Extrude", "Bevel", "Inset", "Mirror", "Boolean", "UV Unwrap"],
  Animation: ["Keyframe", "NLA Editor", "Shape Keys", "Armature", "IK Chain", "Pose Mode", "MoCap Retarget", "Drivers"],
  Rendering: ["Path Tracer", "Volumetrics", "Post Processing", "Color Grade", "Pass Stack", "Tone Mapping"],
  Topology:  ["Dyntopo", "Quad Remesh", "Fibermesh", "LOD System", "Instancing", "Mesh Repair"],
  Physics:   ["Rigid Body", "Cloth Sim", "Fluid SPH", "Force Fields", "VFX Particles", "Hair Groom"],
};

export const DEFAULT_WORKSPACE = WORKSPACES_MAP.MODELING;

export default { WORKSPACES, WORKSPACES_MAP, WORKSPACE_PANELS, WORKSPACE_FEATURES, DEFAULT_WORKSPACE };