import React from "react";
import PanelShell from "./PanelShell";

export default function SmartMaterialsPanel(props) {
  return (
    <PanelShell title="SmartMaterials">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire SmartMaterials into the Paint workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">SmartMaterials Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
