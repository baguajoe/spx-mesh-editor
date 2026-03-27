import React from "react";
import PanelShell from "./PanelShell";

export default function FBXPipelinePanel(props) {
  return (
    <PanelShell title="FBXPipeline">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire FBXPipeline into the Export workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">FBXPipeline Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
