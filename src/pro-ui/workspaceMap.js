export const WORKSPACES = {
  MODELING: "Modeling",
  ANIMATION: "Animation",
  RENDERING: "Rendering",
  TOPOLOGY: "Topology",
  PHYSICS: "Physics"
};

export const WORKSPACE_PANELS = {
  [WORKSPACES.MODELING]: ["MeshEditorPanel", "PropertyInspector", "Outliner"],
  [WORKSPACES.ANIMATION]: ["AnimationTimeline", "Outliner", "PropertyInspector"],
  [WORKSPACES.RENDERING]: ["PathTracerPanel", "PropertyInspector"],
  [WORKSPACES.TOPOLOGY]: ["MeshEditorPanel", "Outliner"],
  [WORKSPACES.PHYSICS]: ["MeshEditorPanel", "PropertyInspector"]
};

export const DEFAULT_WORKSPACE = WORKSPACES.MODELING;\n