import React from "react";

const WORKSPACES = [
  "Layout",
  "Modeling",
  "Sculpt",
  "Paint",
  "Hair",
  "Rig",
  "Animate",
  "Simulation",
  "GeoNodes",
  "Render",
  "Export",
];

export default function WorkspaceTabs({ activeWorkspace, setWorkspace }) {
  return (
    <div className="workspace-topbar">
      <div className="workspace-brand">SPX MESH</div>

      <div className="workspace-tabs">
        {WORKSPACES.map((ws) => (
          <button
            key={ws}
            type="button"
            className={ws === activeWorkspace ? "workspace-tab active" : "workspace-tab"}
            onClick={() => setWorkspace(ws)}
          >
            {ws}
          </button>
        ))}
      </div>
    </div>
  );
}
