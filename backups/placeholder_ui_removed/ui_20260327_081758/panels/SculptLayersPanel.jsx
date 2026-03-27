import React from "react";
import PanelShell from "./PanelShell";

export default function SculptLayersPanel(props) {
  return (
    <PanelShell title="SculptLayers">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire SculptLayers into the Sculpt workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">SculptLayers Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
